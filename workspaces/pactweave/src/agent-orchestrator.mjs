import { assert, clone, safeId } from "./shared.mjs";

export class AgentOrchestrator {
  constructor({ maxConcurrency = 2, handlers = {} } = {}) {
    assert(
      Number.isInteger(maxConcurrency) &&
        maxConcurrency >= 1 &&
        maxConcurrency <= 8,
      "Concurrency must be 1..8",
    );
    this.maxConcurrency = maxConcurrency;
    this.handlers = handlers;
  }
  async run(jobs, { signal, budget = {} } = {}) {
    assert(
      Array.isArray(jobs) && jobs.length > 0 && jobs.length <= 64,
      "Provide 1..64 jobs",
      "INPUT_INVALID",
    );
    const records = new Map();
    for (const raw of jobs) {
      const job = clone(raw);
      safeId(job.id, "job id");
      assert(
        !["constructor", "prototype", "__proto__"].includes(job.id),
        "Reserved job ID",
        "INPUT_INVALID",
      );
      assert(!records.has(job.id), `Duplicate job: ${job.id}`, "INPUT_INVALID");
      assert(
        typeof job.adapter === "string" &&
          typeof this.handlers[job.adapter] === "function",
        `No trusted handler: ${job.adapter}`,
        "UNSUPPORTED",
      );
      for (const field of ["depends_on", "resources", "side_effects"]) {
        job[field] ??= [];
        assert(
          Array.isArray(job[field]) &&
            job[field].every((value) => typeof value === "string"),
          `Invalid job ${field}`,
          "INPUT_INVALID",
        );
        assert(
          new Set(job[field]).size === job[field].length,
          `Duplicate ${field}`,
          "INPUT_INVALID",
        );
      }
      job.resources.forEach((value) => safeId(value, "resource lock"));
      records.set(job.id, job);
    }
    for (const job of records.values())
      for (const id of job.depends_on)
        assert(
          id !== job.id && records.has(id),
          `Unknown/self dependency: ${id}`,
          "INPUT_INVALID",
        );
    const visited = new Set(),
      visiting = new Set();
    function visit(id) {
      assert(!visiting.has(id), "Job dependency cycle", "CYCLE_DETECTED");
      if (visited.has(id)) return;
      visiting.add(id);
      records.get(id).depends_on.forEach(visit);
      visiting.delete(id);
      visited.add(id);
    }
    records.forEach((job) => visit(job.id));
    const outputs = Object.create(null),
      failures = [],
      blocked = [],
      events = [];
    const pending = new Set(records.keys()),
      failed = new Set();
    const deadline =
      budget.deadline ?? Date.now() + (budget.maxTimeMs ?? 30000);
    assert(
      Number.isFinite(deadline) && deadline <= Date.now() + 3600000,
      "Mesh deadline must be finite and at most one hour away",
      "INPUT_INVALID",
    );
    let batches = 0,
      parallelized = false;
    const stopped = () => signal?.aborted || Date.now() >= deadline;
    while (pending.size) {
      if (stopped()) {
        for (const id of pending)
          blocked.push({
            id,
            code: signal?.aborted ? "CANCELLED" : "BUDGET_EXHAUSTED",
          });
        break;
      }
      for (const id of [...pending]) {
        if (records.get(id).depends_on.some((dep) => failed.has(dep))) {
          pending.delete(id);
          failed.add(id);
          blocked.push({ id, code: "DEPENDENCY_FAILED" });
          events.push({ type: "job-blocked", id, reason: "DEPENDENCY_FAILED" });
        }
      }
      if (!pending.size) break;
      const ready = [...pending].filter((id) =>
        records.get(id).depends_on.every((dep) => Object.hasOwn(outputs, dep)),
      );
      assert(ready.length, "No schedulable job remains", "INVALID_PLAN");
      const selected = [],
        locks = new Set();
      for (const id of ready) {
        const job = records.get(id),
          requested = [
            ...job.resources,
            ...(job.side_effects.length ? ["__shared_effect__"] : []),
          ];
        if (requested.some((lock) => locks.has(lock))) continue;
        selected.push(id);
        requested.forEach((lock) => locks.add(lock));
        if (selected.length >= this.maxConcurrency) break;
      }
      parallelized ||= selected.length > 1;
      batches++;
      await Promise.all(
        selected.map(async (id) => {
          pending.delete(id);
          const job = records.get(id);
          if (stopped()) {
            failed.add(id);
            blocked.push({ id, code: "CANCELLED" });
            return;
          }
          events.push({
            type: "job-started",
            id,
            adapter: job.adapter,
            role: "Executor",
            batch: batches,
          });
          try {
            const result = await invokeBounded(this.handlers[job.adapter], job);
            assert(
              !stopped(),
              signal?.aborted
                ? "Job cancelled after callback"
                : "Job exceeded deadline",
              signal?.aborted ? "CANCELLED" : "BUDGET_EXHAUSTED",
            );
            outputs[id] = clone(result);
            events.push({ type: "job-finished", id, adapter: job.adapter });
          } catch (error) {
            failed.add(id);
            failures.push({
              id,
              code: error.code || "EXECUTION_FAILED",
              message: String(error.message || error),
            });
            events.push({
              type: "job-failed",
              id,
              code: error.code || "EXECUTION_FAILED",
            });
          }
        }),
      );
    }
    return {
      jobs: outputs,
      events,
      failures,
      blocked,
      completed: Object.keys(outputs).length,
      parallelized,
      cancellation:
        "Cooperative asynchronous cancellation; synchronous JavaScript is not forcibly preempted.",
    };
    async function invokeBounded(handler, job) {
      const controller = new AbortController();
      let timer, onAbort;
      try {
        const interrupted = new Promise((_, reject) => {
          onAbort = () => {
            controller.abort(signal?.reason);
            reject(
              Object.assign(new Error("Mesh handler cancelled"), {
                code: "CANCELLED",
              }),
            );
          };
          signal?.addEventListener("abort", onAbort, { once: true });
          timer = setTimeout(
            () => {
              reject(
                Object.assign(new Error("Mesh handler deadline exhausted"), {
                  code: "BUDGET_EXHAUSTED",
                }),
              );
              controller.abort("deadline");
            },
            Math.max(1, deadline - Date.now()),
          );
          if (signal?.aborted) onAbort();
        });
        const work = Promise.resolve().then(() => {
          assert(
            !controller.signal.aborted,
            "Mesh handler cancelled before start",
            "CANCELLED",
          );
          return handler(clone(job.input), {
            signal: controller.signal,
            job: clone(job),
            dependency_outputs: Object.fromEntries(
              job.depends_on.map((dep) => [dep, clone(outputs[dep])]),
            ),
          });
        });
        return await Promise.race([work, interrupted]);
      } finally {
        clearTimeout(timer);
        if (onAbort) signal?.removeEventListener("abort", onAbort);
      }
    }
  }
}
