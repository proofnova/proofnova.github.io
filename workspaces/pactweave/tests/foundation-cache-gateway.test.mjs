import test from "node:test";
import assert from "node:assert/strict";
import {
  SessionLLMCache,
  MemoryCacheBackend,
} from "../src/session-llm-cache.mjs";
import { MemoryContextStore } from "../src/memory-context-store.mjs";
import { LLMGateway } from "../src/llm-gateway.mjs";
import { createPolicy } from "../src/security-policy.mjs";
const query = {
  needed: true,
  project_id: "project",
  session_id: "session",
  request: "calculate total invoice",
  context: { rows: [1, 2] },
  model_identifier: "fake-local-provider",
  requirements_digest: "contract",
  permission_scope_digest: "scope",
  source_versions: { manual: { version: "1", source_hash: "a" } },
};
const policy = () => createPolicy({ grants: ["llm.call"] });
const deferred = () => {
  let resolve;
  const promise = new Promise((done) => (resolve = done));
  return { promise, resolve };
};
test("cache exact reuse, supplemental-only similarity and session isolation", async () => {
  const cache = new SessionLLMCache();
  await cache.set(query, "3");
  assert.equal((await cache.lookup(query)).status, "exact");
  const related = await cache.lookup({
    ...query,
    request: "calculate total receipts",
  });
  assert.equal(related.status, "context");
  assert.equal(related.response, null);
  assert.equal(related.context[0].trusted, false);
  assert.equal(
    (await cache.lookup({ ...query, session_id: "other" })).status,
    "miss",
  );
  assert.equal(
    (await cache.lookup({ ...query, context: { rows: [1, 4] } })).response,
    null,
  );
  assert.equal(
    (
      await cache.lookup({
        ...query,
        source_versions: { manual: { version: "2", source_hash: "b" } },
      })
    ).status,
    "miss",
  );
});
test("cache TTL, explicit invalidation and session end erase response data", async () => {
  let now = 10;
  const cache = new SessionLLMCache({ now: () => now, ttlMs: 100 });
  await cache.set(query, "3");
  now = 111;
  assert.equal((await cache.lookup(query)).status, "miss");
  assert.equal(cache.stats().invalidations, 1);
  await cache.set(query, "3");
  assert.equal(
    (await cache.invalidate({ session_id: "session" }, "test-change"))
      .invalidated,
    1,
  );
  await cache.set(query, "3");
  await cache.endSession("project", "session");
  assert.equal((await cache.store.entries()).length, 0);
});
test("cache physically separate backend required; invalid identities rejected", async () => {
  assert.throws(
    () => new SessionLLMCache({ store: new MemoryContextStore() }),
    { code: "CACHE_BACKEND_REQUIRED" },
  );
  await assert.rejects(
    new SessionLLMCache().lookup({ ...query, requirements_digest: "" }),
    { code: "INPUT_INVALID" },
  );
});
test("Gateway default makes no calls, optional gap skips and cached exact result survives zero call budget", async () => {
  let calls = 0;
  const providers = {
    "fake-local-provider": {
      kind: "local",
      call: async () => {
        calls++;
        return { response: "3", usage: { total_tokens: 2 } };
      },
    },
  };
  const closed = new LLMGateway({ providers, policy: policy() });
  await assert.rejects(closed.request(query), { code: "BUDGET_EXHAUSTED" });
  assert.equal(
    (await closed.request({ ...query, needed: false })).status,
    "skipped",
  );
  const cache = new SessionLLMCache();
  await cache.set(query, "3");
  const reuse = new LLMGateway({ providers, policy: policy(), cache });
  assert.equal(
    (await reuse.request({ ...query, max_calls_remaining: 0 })).status,
    "cached",
  );
  assert.equal(calls, 0);
});
test("Gateway deduplicates in-flight identity and preserves actual usage without fabricating model benchmark", async () => {
  let release;
  const pending = new Promise((resolve) => (release = resolve));
  let calls = 0;
  const gateway = new LLMGateway({
    policy: policy(),
    budget: { maxCalls: 2 },
    providers: {
      "fake-local-provider": {
        kind: "local",
        call: async () => {
          calls++;
          await pending;
          return { response: "3", usage: { total_tokens: 7 } };
        },
      },
    },
  });
  const first = gateway.request(query),
    second = gateway.request(query);
  setTimeout(release, 10);
  const outputs = await Promise.all([first, second]);
  assert.deepEqual(outputs.map((value) => value.status).sort(), [
    "called",
    "coalesced",
  ]);
  assert.equal(calls, 1);
  assert.equal(gateway.stats().actual_calls, 1);
  assert.equal(gateway.stats().tokens, 7);
  assert.equal((await gateway.request(query)).status, "cached");
});
test("Gateway provider retries debit real calls, remaining workflow budget bounds retries", async () => {
  let calls = 0;
  const gateway = new LLMGateway({
    policy: policy(),
    budget: { maxCalls: 10, maxRetries: 2 },
    providers: {
      "fake-local-provider": {
        kind: "local",
        call: async () => {
          calls++;
          throw new Error("fixture provider error");
        },
      },
    },
  });
  await assert.rejects(gateway.request({ ...query, max_calls_remaining: 1 }), {
    code: "BUDGET_EXHAUSTED",
  });
  assert.equal(calls, 1);
  assert.equal(gateway.stats().actual_calls, 1);
  assert.equal(gateway.stats().failures, 1);
});
test("Gateway cancellation and authority revocation prevent response/cache admission", async () => {
  const permissions = policy();
  const cache = new SessionLLMCache();
  const gateway = new LLMGateway({
    cache,
    policy: permissions,
    budget: { maxCalls: 1 },
    providers: {
      "fake-local-provider": {
        kind: "local",
        call: async () => {
          permissions.revoked = true;
          return { response: "untrusted-after-revoke" };
        },
      },
    },
  });
  await assert.rejects(gateway.request(query), { code: "APPROVAL_REQUIRED" });
  assert.equal((await cache.store.entries()).length, 0);
});
test("Gateway paid/default authority cannot be granted by dynamic policy narrowing callback", async () => {
  let calls = 0;
  const gateway = new LLMGateway({
    policy: createPolicy({ check: async () => true }),
    budget: { maxCalls: 1 },
    providers: {
      "fake-local-provider": {
        kind: "paid",
        call: async () => {
          calls++;
          return { response: "bad" };
        },
      },
    },
  });
  await assert.rejects(gateway.request(query), { code: "APPROVAL_REQUIRED" });
  assert.equal(calls, 0);
});
test("Gateway authoritative source changes invalidate pending results", async () => {
  let version = "one";
  const cache = new SessionLLMCache();
  const gateway = new LLMGateway({
    cache,
    policy: policy(),
    budget: { maxCalls: 1 },
    sourceManifest: async () => ({ manual: { version } }),
    providers: {
      "fake-local-provider": {
        kind: "local",
        call: async () => {
          version = "two";
          return { response: "stale" };
        },
      },
    },
  });
  await assert.rejects(gateway.request(query), { code: "SOURCE_CHANGED" });
  assert.equal((await cache.store.entries()).length, 0);
});
test("Gateway model callback time cap aborts unresponsive provider", async () => {
  let started = false;
  const gateway = new LLMGateway({
    policy: policy(),
    // A controlled accounting clock isolates callback timeout from parallel-suite startup.
    now: () => 0,
    budget: { maxCalls: 1, maxTimeMs: 100 },
    providers: {
      "fake-local-provider": {
        kind: "local",
        call: async () => {
          started = true;
          return new Promise(() => {});
        },
      },
    },
  });
  await assert.rejects(gateway.request(query), { code: "BUDGET_EXHAUSTED" });
  assert.equal(started, true);
  assert.equal(gateway.stats().actual_calls, 1);
});

test("Ending a session while its provider is pending prevents cache resurrection and result return", async () => {
  const started = deferred(),
    release = deferred(),
    cache = new SessionLLMCache();
  const gateway = new LLMGateway({
    cache,
    policy: policy(),
    budget: { maxCalls: 1 },
    providers: {
      "fake-local-provider": {
        kind: "local",
        call: async () => {
          started.resolve();
          await release.promise;
          return { response: "private response" };
        },
      },
    },
  });
  const pending = gateway.request(query);
  await started.promise;
  await cache.endSession("project", "session");
  release.resolve();
  await assert.rejects(pending, { code: "SESSION_ENDED" });
  assert.equal((await cache.store.entries()).length, 0);
  await assert.rejects(gateway.request(query), { code: "SESSION_ENDED" });
});
test("Deleting an attached memory session while provider waits closes admission independently of cache entry existence", async () => {
  const store = new MemoryContextStore({ project_id: "project" }),
    backend = new MemoryCacheBackend(),
    cache = new SessionLLMCache({ store: backend });
  store.attachCache(backend);
  await store.put(
    "Sessions",
    "checkpoint",
    { original_request: "private" },
    { session_id: "session" },
  );
  const started = deferred(),
    release = deferred();
  const gateway = new LLMGateway({
    cache,
    policy: policy(),
    budget: { maxCalls: 1 },
    providers: {
      "fake-local-provider": {
        kind: "local",
        call: async () => {
          started.resolve();
          await release.promise;
          return { response: "private response" };
        },
      },
    },
  });
  const pending = gateway.request(query);
  await started.promise;
  await store.delete("Sessions", "checkpoint", { session_id: "session" });
  release.resolve();
  await assert.rejects(pending, { code: "SESSION_ENDED" });
  assert.equal((await backend.entries()).length, 0);
});
test("Cached final source freshness wait cannot bypass revocation or cancellation", async () => {
  for (const action of ["revoke", "cancel"]) {
    const cache = new SessionLLMCache(),
      permissions = policy(),
      paused = deferred(),
      release = deferred(),
      signal = new AbortController();
    await cache.set(
      {
        ...query,
        source_versions: { engine: query.source_versions, knowledge: {} },
      },
      "private cached",
    );
    let reads = 0;
    const gateway = new LLMGateway({
      cache,
      policy: permissions,
      sourceManifest: async () => {
        if (++reads === 2) {
          paused.resolve();
          await release.promise;
        }
        return {};
      },
      providers: {
        "fake-local-provider": {
          kind: "local",
          call: async () => {
            throw Error("must not call");
          },
        },
      },
    });
    const pending = gateway.request({ ...query, signal: signal.signal });
    await paused.promise;
    if (action === "revoke") permissions.revoked = true;
    else signal.abort();
    release.resolve();
    await assert.rejects(pending, {
      code: action === "revoke" ? "APPROVAL_REQUIRED" : "CANCELLED",
    });
  }
});
test("Called final source freshness wait cannot return or retain newly admitted response after revocation", async () => {
  const cache = new SessionLLMCache(),
    permissions = policy(),
    paused = deferred(),
    release = deferred();
  let reads = 0;
  const gateway = new LLMGateway({
    cache,
    policy: permissions,
    budget: { maxCalls: 1 },
    sourceManifest: async () => {
      if (++reads === 4) {
        paused.resolve();
        await release.promise;
      }
      return {};
    },
    providers: {
      "fake-local-provider": {
        kind: "local",
        call: async () => ({ response: "private fresh" }),
      },
    },
  });
  const pending = gateway.request(query);
  await paused.promise;
  permissions.revoked = true;
  release.resolve();
  await assert.rejects(pending, { code: "APPROVAL_REQUIRED" });
  assert.equal((await cache.store.entries()).length, 0);
});
test("Coalesced final source freshness wait is reauthorized after the owning call completed", async () => {
  const cache = new SessionLLMCache(),
    permissions = policy(),
    providerStarted = deferred(),
    providerRelease = deferred(),
    paused = deferred(),
    release = deferred();
  let gateway;
  gateway = new LLMGateway({
    cache,
    policy: permissions,
    budget: { maxCalls: 2 },
    sourceManifest: async () => {
      if (gateway.stats().events.some((event) => event.status === "called")) {
        paused.resolve();
        await release.promise;
      }
      return {};
    },
    providers: {
      "fake-local-provider": {
        kind: "local",
        call: async () => {
          providerStarted.resolve();
          await providerRelease.promise;
          return { response: "private fresh" };
        },
      },
    },
  });
  const first = gateway.request(query);
  await providerStarted.promise;
  const second = gateway.request(query);
  while (gateway.stats().coalesced_calls === 0)
    await new Promise((resolve) => setImmediate(resolve));
  providerRelease.resolve();
  await paused.promise;
  permissions.revoked = true;
  release.resolve();
  await first;
  await assert.rejects(second, { code: "APPROVAL_REQUIRED" });
});
test("Adapter source locks remain in exact identity alongside refreshed knowledge without recursive source scopes", async () => {
  let calls = 0;
  const gateway = new LLMGateway({
    policy: policy(),
    budget: { maxCalls: 2 },
    sourceManifest: async () => ({ manual: { source_hash: "knowledge" } }),
    providers: {
      "fake-local-provider": {
        kind: "local",
        call: async () => ({ response: ++calls }),
      },
    },
  });
  const first = await gateway.request({
    ...query,
    source_versions: { adapter: { commit: "one" } },
  });
  const second = await gateway.request({
    ...query,
    source_versions: { adapter: { commit: "two" } },
  });
  assert.equal(first.status, "called");
  assert.equal(second.status, "called");
  assert.equal(calls, 2);
  assert.deepEqual(Object.keys(second.evidence.source_versions).sort(), [
    "engine",
    "knowledge",
  ]);
  assert.equal(second.evidence.source_versions.engine.adapter.commit, "two");
  assert.equal(second.evidence.source_versions.engine.engine, undefined);
});
