import test from "node:test";
import assert from "node:assert/strict";
import { AgentOrchestrator } from "../src/agent-orchestrator.mjs";

const job = (id, extra = {}) => ({
  id,
  adapter: "worker",
  input: { id },
  depends_on: [],
  resources: [],
  side_effects: [],
  ...extra,
});
test("independent pure handlers genuinely overlap while dependencies wait", async () => {
  let active = 0,
    peak = 0;
  const finished = [];
  const mesh = new AgentOrchestrator({
    maxConcurrency: 2,
    handlers: {
      worker: async (input) => {
        active++;
        peak = Math.max(peak, active);
        await new Promise((resolve) => setTimeout(resolve, 5));
        active--;
        finished.push(input.id);
        return input;
      },
    },
  });
  const output = await mesh.run([
    job("a"),
    job("b"),
    job("c", { depends_on: ["a", "b"] }),
  ]);
  assert.equal(peak, 2);
  assert.equal(output.parallelized, true);
  assert.equal(output.completed, 3);
  assert.equal(finished.at(-1), "c");
});
test("shared resources and effects serialize; single job does not invent parallel work", async () => {
  let active = 0,
    peak = 0;
  const mesh = new AgentOrchestrator({
    handlers: {
      worker: async (input) => {
        active++;
        peak = Math.max(peak, active);
        await new Promise((resolve) => setTimeout(resolve, 2));
        active--;
        return input;
      },
    },
  });
  let output = await mesh.run([
    job("a", { resources: ["shared"] }),
    job("b", { resources: ["shared"] }),
  ]);
  assert.equal(peak, 1);
  assert.equal(output.parallelized, false);
  peak = 0;
  output = await mesh.run([
    job("a", { side_effects: ["local.write"] }),
    job("b", { side_effects: ["process.execute"] }),
  ]);
  assert.equal(peak, 1);
  assert.equal(output.parallelized, false);
  output = await mesh.run([job("only")]);
  assert.equal(output.parallelized, false);
});
test("failed dependencies never run dependent tasks", async () => {
  const ran = [];
  const mesh = new AgentOrchestrator({
    handlers: {
      worker: async (input) => {
        ran.push(input.id);
        if (input.id === "a") throw new Error("real failure");
        return input;
      },
    },
  });
  const result = await mesh.run([
    job("a"),
    job("b", { depends_on: ["a"] }),
    job("c", { depends_on: ["b"] }),
  ]);
  assert.deepEqual(ran, ["a"]);
  assert.equal(result.failures.length, 1);
  assert.equal(result.blocked.length, 2);
});
test("unknown dependencies, cycles and duplicate IDs fail before executing handlers", async () => {
  let executions = 0;
  const mesh = new AgentOrchestrator({
    handlers: {
      worker: async () => {
        executions++;
        return {};
      },
    },
  });
  for (const jobs of [
    [job("a", { depends_on: ["missing"] })],
    [job("a", { depends_on: ["b"] }), job("b", { depends_on: ["a"] })],
    [job("a"), job("a")],
  ])
    await assert.rejects(mesh.run(jobs));
  assert.equal(executions, 0);
});
test("cancelled mesh does not start handlers", async () => {
  let executions = 0;
  const controller = new AbortController();
  controller.abort();
  const result = await new AgentOrchestrator({
    handlers: {
      worker: async () => {
        executions++;
        return {};
      },
    },
  }).run([job("a")], { signal: controller.signal });
  assert.equal(executions, 0);
  assert.equal(result.blocked[0].code, "CANCELLED");
});
test("direct mesh deadline bounds an unresolved asynchronous handler and blocks dependents", async () => {
  let receivedSignal;
  const mesh = new AgentOrchestrator({
    handlers: {
      worker: async (_, context) => {
        receivedSignal = context.signal;
        return new Promise(() => {});
      },
    },
  });
  const started = Date.now();
  const result = await mesh.run([job("a"), job("b", { depends_on: ["a"] })], {
    budget: { deadline: Date.now() + 20 },
  });
  assert.ok(Date.now() - started < 1000);
  assert.equal(result.failures[0].code, "BUDGET_EXHAUSTED");
  assert.equal(receivedSignal.aborted, true);
  assert.equal(Object.keys(result.jobs).length, 0);
  assert.equal(result.blocked.length, 1);
});
test("direct mesh cancellation releases pending handler and ignores late output", async () => {
  let release, entered;
  const ready = new Promise((resolve) => {
    entered = resolve;
  });
  const mesh = new AgentOrchestrator({
    handlers: {
      worker: async () => {
        entered();
        return new Promise((resolve) => {
          release = resolve;
        });
      },
    },
  });
  const controller = new AbortController();
  const pending = mesh.run([job("a")], { signal: controller.signal });
  await ready;
  controller.abort();
  const result = await pending;
  assert.equal(result.failures[0].code, "CANCELLED");
  assert.equal(Object.keys(result.jobs).length, 0);
  release({ inventedLateResult: true });
  await Promise.resolve();
  assert.equal(Object.keys(result.jobs).length, 0);
});
