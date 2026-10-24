import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { ContextStore, NodeFileCacheBackend } from "../src/context-store.mjs";
import { MemoryContextStore } from "../src/memory-context-store.mjs";
import { SessionLLMCache } from "../src/session-llm-cache.mjs";
import { createNodeContext } from "../run.mjs";

async function fixture(t) {
  // macOS exposes its system temp directory through /var -> /private/var.
  // Pass the canonical fixture root; deliberately created links remain rejected below.
  const root = await fs.realpath(
    await fs.mkdtemp(path.join(os.tmpdir(), "pactvault-")),
  );
  t.after(() => fs.rm(root, { recursive: true, force: true }));
  return {
    root,
    store: await new ContextStore({ root, project_id: "project" }).init(),
  };
}
const cacheQuery = {
  project_id: "project",
  session_id: "session",
  request: "sum rows",
  context: { rows: [1, 2] },
  model_identifier: "local-test",
  requirements_digest: "contract",
  permission_scope_digest: "scope",
  source_versions: {},
};
test("PactVault persists across restart, deduplicates equal content and protects original request", async (t) => {
  const { root, store } = await fixture(t);
  await store.put(
    "Sessions",
    "task",
    { original_request: "immutable", state: "PLAN" },
    { session_id: "session" },
  );
  await store.put(
    "Sessions",
    "task",
    { original_request: "immutable", state: "PLAN" },
    { session_id: "session" },
  );
  const history = await fs.readdir(path.join(root, "project", "history"));
  assert.equal(history.length, 1);
  assert.equal(
    (await fs.readdir(path.join(root, "project", "history", history[0])))
      .length,
    1,
  );
  const second = await new ContextStore({ root, project_id: "project" }).init();
  assert.equal(
    (await second.get("Sessions", "task", { session_id: "session" })).state,
    "PLAN",
  );
  await assert.rejects(
    second.put(
      "Sessions",
      "task",
      { original_request: "changed" },
      { session_id: "session" },
    ),
    { code: "ORIGINAL_CHANGED" },
  );
  assert.equal(
    (await second.list("Sessions", { session_id: "session" })).length,
    1,
  );
  await assert.rejects(second.get("Sessions", "task"), {
    code: "SCOPE_INVALID",
  });
});
test("PactVault rejects traversal and symlink/reparse root", async (t) => {
  const { root, store } = await fixture(t);
  await assert.rejects(store.put("Resources", "../escape", {}), {
    code: "SCOPE_INVALID",
  });
  const target = path.join(root, "target");
  await fs.mkdir(target);
  const link = path.join(root, "linked");
  try {
    await fs.symlink(
      target,
      link,
      process.platform === "win32" ? "junction" : "dir",
    );
  } catch (error) {
    if (["EPERM", "EACCES"].includes(error.code)) {
      t.skip("OS does not grant symlink creation");
      return;
    }
    throw error;
  }
  await assert.rejects(
    new ContextStore({ root: link, project_id: "project" }).init(),
    { code: "PATH_UNSAFE" },
  );
});
test("PactVault corrupt data fails closed and explicit recovery restores valid history", async (t) => {
  const { root, store } = await fixture(t);
  await store.put("Memory", "fact", { verified: true });
  await fs.writeFile(
    path.join(root, "project", "vault", "Memory", "_shared", "fact.json"),
    "{broken",
  );
  await assert.rejects(store.get("Memory", "fact"), { code: "STORE_CORRUPT" });
  assert.equal(
    (await fs.readdir(path.join(root, "project", "quarantine"))).length,
    1,
  );
  assert.equal((await store.recover()).recovered, 1);
  assert.deepEqual(await store.get("Memory", "fact"), { verified: true });
});
test("PactVault deletion removes history, cache and index and cannot recover tombstoned data", async (t) => {
  const { root, store } = await fixture(t);
  const cache = new SessionLLMCache({
    store: new NodeFileCacheBackend({ root, project_id: "project" }),
  });
  await store.put(
    "Sessions",
    "task",
    { original_request: "erase me" },
    { session_id: "session" },
  );
  await cache.set(cacheQuery, "private response");
  await store.reindex();
  await store.delete("Sessions", "task", { session_id: "session" });
  assert.equal(
    await store.get("Sessions", "task", { session_id: "session" }),
    null,
  );
  await assert.rejects(cache.lookup(cacheQuery), { code: "SESSION_ENDED" });
  assert.equal((await store.recover()).recovered, 0);
  assert.equal(
    (await fs.readdir(path.join(root, "project", "history"))).length,
    0,
  );
  await assert.rejects(fs.stat(path.join(root, "project", "index.json")), {
    code: "ENOENT",
  });
});

test("PactVault deleted checkpoints cannot be recreated by delayed work or recovery", async (t) => {
  const { store } = await fixture(t);
  await store.put(
    "Sessions",
    "checkpoint",
    { original_request: "private", state: "PLAN" },
    { session_id: "session" },
  );
  await store.delete("Sessions", "checkpoint", { session_id: "session" });
  await assert.rejects(
    store.put(
      "Sessions",
      "checkpoint",
      { original_request: "private", state: "PASS" },
      { session_id: "session" },
    ),
    { code: "STORE_DELETED" },
  );
  assert.equal((await store.recover()).recovered, 0);
  await store.put(
    "Sessions",
    "fresh",
    { original_request: "new work" },
    { session_id: "new-session" },
  );
  assert.notEqual(
    await store.get("Sessions", "fresh", { session_id: "new-session" }),
    null,
  );
});
test("Memory deletion serializes with pending writes and permanently rejects the erased identity", async () => {
  const store = new MemoryContextStore({ project_id: "project" });
  const writing = store.put(
    "Sessions",
    "checkpoint",
    { original_request: "private" },
    { session_id: "session" },
  );
  const deleting = store.delete("Sessions", "checkpoint", {
    session_id: "session",
  });
  await Promise.all([writing, deleting]);
  assert.equal(
    await store.get("Sessions", "checkpoint", { session_id: "session" }),
    null,
  );
  await assert.rejects(
    store.put(
      "Sessions",
      "checkpoint",
      { original_request: "private" },
      { session_id: "session" },
    ),
    { code: "STORE_DELETED" },
  );
});
test("File cache closure persists without existing entries and enforces atomic stale-generation rejection", async (t) => {
  const { root } = await fixture(t);
  const backend = new NodeFileCacheBackend({ root, project_id: "project" });
  assert.deepEqual(await backend.sessionState("project", "session"), {
    generation: 0,
    closed: false,
  });
  await backend.deleteSession("project", "session");
  const restarted = new NodeFileCacheBackend({ root, project_id: "project" });
  assert.deepEqual(await restarted.sessionState("project", "session"), {
    generation: 1,
    closed: true,
  });
  await assert.rejects(
    restarted.set(
      "a".repeat(64),
      { project_id: "project", session_id: "session" },
      { session_generation: 0 },
    ),
    { code: "SESSION_ENDED" },
  );
  await assert.rejects(
    new SessionLLMCache({ store: restarted }).set(
      cacheQuery,
      "late private data",
    ),
    { code: "SESSION_ENDED" },
  );
  assert.equal((await restarted.entries()).length, 0);
  await new SessionLLMCache({ store: restarted }).set(
    { ...cacheQuery, session_id: "fresh-session" },
    "new data",
  );
  assert.equal((await restarted.entries()).length, 1);
});
test("Actual Node context retains adapter source changes in cache identity and closes pending session admissions", async (t) => {
  const { root } = await fixture(t);
  let calls = 0,
    pause = false,
    started,
    release;
  const begun = new Promise((resolve) => (started = resolve)),
    waiting = new Promise((resolve) => (release = resolve));
  const context = await createNodeContext(
    { project_id: "project" },
    {
      stateRoot: path.join(root, "node-context"),
      policy: { grants: ["llm.call"] },
      llmBudget: { maxCalls: 3 },
      providers: {
        "local-test": {
          kind: "local",
          call: async () => {
            calls++;
            if (pause) {
              started();
              await waiting;
            }
            return { response: "fixture-only" };
          },
        },
      },
    },
  );
  const input = {
    ...cacheQuery,
    needed: true,
    source_versions: { invoice: { commit: "one" } },
  };
  assert.equal((await context.gateway.request(input)).status, "called");
  assert.equal(
    (
      await context.gateway.request({
        ...input,
        source_versions: { invoice: { commit: "two" } },
      })
    ).status,
    "called",
  );
  assert.equal(calls, 2);
  await context.store.put(
    "Sessions",
    "checkpoint",
    { original_request: "private" },
    { session_id: "session" },
  );
  pause = true;
  const pending = context.gateway.request({
    ...input,
    request: "another semantic request",
  });
  await begun;
  await context.store.delete("Sessions", "checkpoint", {
    session_id: "session",
  });
  release();
  await assert.rejects(pending, { code: "SESSION_ENDED" });
  assert.equal((await context.cache.store.entries()).length, 0);
  await assert.rejects(
    context.store.put(
      "Sessions",
      "checkpoint",
      { original_request: "private" },
      { session_id: "session" },
    ),
    { code: "STORE_DELETED" },
  );
});
test("PactVault default export redacts sensitive session material; raw export explicitly opt-in", async (t) => {
  const { store } = await fixture(t);
  await store.put(
    "Sessions",
    "task",
    {
      original_request: "sensitive",
      token: "secret",
      output: { private_key: "key" },
    },
    { session_id: "session" },
  );
  const clean = await store.export();
  assert.equal(clean.records[0].value.original_request, "[REDACTED]");
  assert.equal(clean.records[0].value.token, "[REDACTED]");
  assert.equal(
    (await store.export({ includeSensitive: true })).records[0].value
      .original_request,
    "sensitive",
  );
});
test("PactVault retention deletes only scoped old records and backup is redacted", async (t) => {
  const { root } = await fixture(t);
  const store = await new ContextStore({
    root,
    project_id: "project",
    now: () => 0,
  }).init();
  await store.put("Memory", "old", { password: "x" });
  await store.put("Resources", "keep", { text: "reference" });
  assert.equal(
    (await store.prune({ before: "1970-01-02T00:00:00Z", area: "Memory" }))
      .deleted,
    1,
  );
  assert.notEqual(await store.get("Resources", "keep"), null);
  const backup = path.join(root, "backup.json");
  await store.backup(backup);
  assert.equal(JSON.parse(await fs.readFile(backup, "utf8")).records.length, 1);
  await assert.rejects(store.backup(backup), { code: "STORE_CONFLICT" });
});
test("PactVault concurrent external writer produces explicit conflict", async (t) => {
  const { root, store } = await fixture(t);
  await fs.writeFile(
    path.join(root, "project", ".write-lock"),
    "external owner",
  );
  await assert.rejects(store.put("Memory", "fact", {}), {
    code: "STORE_CONFLICT",
  });
});
test("Memory PactVault matches scoped values, redaction and original immutability", async () => {
  const store = new MemoryContextStore({ project_id: "project" });
  await store.put(
    "Sessions",
    "task",
    { original_request: "hello" },
    { session_id: "one" },
  );
  assert.equal(
    await store.get("Sessions", "task", { session_id: "two" }),
    null,
  );
  await assert.rejects(
    store.put(
      "Sessions",
      "task",
      { original_request: "changed" },
      { session_id: "one" },
    ),
    { code: "ORIGINAL_CHANGED" },
  );
  assert.equal(
    (await store.export()).records[0].value.original_request,
    "[REDACTED]",
  );
  await store.delete("Sessions", "task", { session_id: "one" });
  assert.equal((await store.recover()).recovered, 0);
});
