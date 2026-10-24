import test from "node:test";
import strict from "node:assert/strict";
import { mkdtemp, readFile, writeFile, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import { runBrowser } from "../browser.mjs";
import { run } from "../run.mjs";
import { createProjectTestAdapter } from "../src/host-runtime.mjs";
import { createPolicy } from "../src/security-policy.mjs";
const root = fileURLToPath(new URL("../", import.meta.url));
const example = JSON.parse(
  await readFile(new URL("../examples/invoice.json", import.meta.url)),
);
test("Node persistent and browser memory engines produce the same actual result", async () => {
  const stateRoot = await mkdtemp(path.join(tmpdir(), "pact-parity-"));
  try {
    const local = await run(example, { stateRoot });
    const web = await runBrowser(example);
    strict.equal(local.state, "PASS");
    strict.equal(web.state, "PASS");
    strict.deepEqual(web.output, local.output);
    strict.deepEqual(web.contract, local.contract);
  } finally {
    await rm(stateRoot, { recursive: true, force: true });
  }
});
test("CLI JSON and meaningful missing-data exit code", async () => {
  const r = spawnSync(
    process.execPath,
    ["cli.mjs", "analyze", "make it good", "--json"],
    { cwd: root, encoding: "utf8" },
  );
  strict.equal(r.status, 0);
  strict.equal(JSON.parse(r.stdout).original_request, "make it good");
  const dir = await mkdtemp(path.join(tmpdir(), "pact-cli-"));
  try {
    const file = path.join(dir, "missing.json");
    await writeFile(file, JSON.stringify({ request: "ambiguous" }));
    const p = spawnSync(process.execPath, ["cli.mjs", "plan", file, "--json"], {
      cwd: root,
      encoding: "utf8",
    });
    strict.equal(p.status, 2);
    strict.equal(JSON.parse(p.stdout).state, "BLOCKED");
    const run = spawnSync(
      process.execPath,
      [
        "cli.mjs",
        "run",
        "examples/invoice.json",
        "--state-root",
        dir,
        "--json",
      ],
      { cwd: root, encoding: "utf8" },
    );
    strict.equal(run.status, 0, run.stdout + run.stderr);
    strict.equal(JSON.parse(run.stdout).state, "PASS");
  } finally {
    await rm(dir, { recursive: true, force: true });
  }
});
test("host test adapter requires both host and contract grants and runs real tests", async () => {
  const dir = await mkdtemp(path.join(tmpdir(), "pact-host-"));
  try {
    await writeFile(
      path.join(dir, "check.mjs"),
      'import test from "node:test"; import assert from "node:assert/strict"; test("sum",()=>assert.equal(1+2,3));',
    );
    const policy = createPolicy({ grants: ["process.execute"] });
    const adapter = await createProjectTestAdapter(
      { runtime: "node", files: ["check.mjs"] },
      { policy, root: dir },
    );
    await strict.rejects(
      adapter.execute(
        {},
        { contract: { permitted_actions: [], forbidden_actions: [] } },
      ),
    );
    const r = await adapter.execute(
      {},
      {
        contract: {
          permitted_actions: ["process.execute"],
          forbidden_actions: [],
        },
      },
    );
    strict.equal(r.result.exit_code, 0);
    strict.match(r.result.stdout, /sum/);
    strict.equal(Object.keys(r.result.test_sources).length, 1);
    await strict.rejects(
      createProjectTestAdapter(
        { runtime: "shell", files: ["check.mjs"] },
        { policy, root: dir },
      ),
    );
  } finally {
    await rm(dir, { recursive: true, force: true });
  }
});
