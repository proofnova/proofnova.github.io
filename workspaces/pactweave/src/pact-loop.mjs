import { assert, canonical, clone, digest, safeId, words } from "./shared.mjs";
import { analyzeRequest } from "./request-intent-analyzer.mjs";
import {
  applyAnswers,
  computeContractDigest,
  createContract,
  validateContract,
} from "./requirements-contract.mjs";
import { preprocessContext } from "./context-preprocessor.mjs";
import { createPolicy, authorize } from "./security-policy.mjs";
import { MemoryContextStore } from "./memory-context-store.mjs";
import { createRegistry } from "./skill-router.mjs";
import { AgentOrchestrator } from "./agent-orchestrator.mjs";
import { reviewOutput } from "./adversarial-reviewer.mjs";

const defaults = {
  maxIterations: 3,
  maxTimeMs: 30000,
  maxCalls: 0,
  maxRepeatedErrors: 2,
};
const activeSessions = new WeakMap();
function modelRequirement(value, original) {
  if (!value?.needed) return { needed: false };
  assert(
    typeof value.reason === "string" && value.reason.trim(),
    "A model need requires a reason",
    "INPUT_INVALID",
  );
  assert(
    typeof value.model_identifier === "string" && value.model_identifier.trim(),
    "A model need requires an explicit model identifier",
    "INPUT_INVALID",
  );
  assert(
    value.request === undefined || typeof value.request === "string",
    "Model request must be text",
    "INPUT_INVALID",
  );
  return {
    needed: true,
    reason: value.reason,
    model_identifier: value.model_identifier,
    request: value.request || original,
  };
}
async function withSessionLease(store, session, callback) {
  let sessions = activeSessions.get(store);
  if (!sessions) {
    sessions = new Set();
    activeSessions.set(store, sessions);
  }
  assert(
    !sessions.has(session),
    "A workflow already owns this session in the current process",
    "RUNNER_BUSY",
  );
  sessions.add(session);
  try {
    return await callback();
  } finally {
    sessions.delete(session);
  }
}
export async function runWorkflow(spec, options = {}) {
  assert(
    spec && typeof spec === "object" && !Array.isArray(spec),
    "Workflow spec required",
    "INPUT_INVALID",
  );
  if (options.previous)
    return resumeWorkflow(options.previous, spec, {
      ...options,
      previous: undefined,
    });
  const store =
    options.store ||
    new MemoryContextStore({ project_id: spec.project_id || "default" });
  return withSessionLease(
    store,
    safeId(spec.session_id || "default", "session"),
    () => startWorkflow(spec, { ...options, store }),
  );
}
export async function resumeWorkflow(previous, spec = {}, options = {}) {
  assert(
    options.store,
    "Resume requires the authoritative project store",
    "SCOPE_INVALID",
  );
  return withSessionLease(
    options.store,
    safeId(previous?.session_id, "session"),
    () => resumeSavedWorkflow(previous, spec, options),
  );
}

function boundedBudgets(input = {}) {
  const budgets = { ...defaults, ...input };
  for (const key of Object.keys(defaults))
    assert(
      Number.isSafeInteger(budgets[key]) &&
        budgets[key] >= (key === "maxCalls" ? 0 : 1),
      `Invalid budget ${key}`,
      "INPUT_INVALID",
    );
  assert(
    budgets.maxIterations <= 100 &&
      budgets.maxTimeMs <= 3600000 &&
      budgets.maxCalls <= 100 &&
      budgets.maxRepeatedErrors <= 100,
    "Budget exceeds engine hard bound",
    "INPUT_INVALID",
  );
  return budgets;
}

async function taskSources(task, registry) {
  const ids = task.adapter
    ? [task.adapter]
    : (task.jobs || []).map((job) => job.adapter);
  const sources = {};
  for (const id of [...new Set(ids)]) {
    const meta = registry.describe(id);
    assert(meta, `Unsupported adapter ${id}`, "UNSUPPORTED");
    if (registry.verifySources) await registry.verifySources(id);
    sources[id] = {
      version: meta.version,
      source_commit: meta.source_commit || "trusted-host",
      source_sha256:
        meta.files?.["browser.mjs"]?.sha256 ||
        meta.source_sha256 ||
        "host-registered",
    };
  }
  return sources;
}

function checkedJobs(task, registry, contract) {
  assert(
    task &&
      typeof task === "object" &&
      !!task.adapter !== Array.isArray(task.jobs),
    "Task must contain exactly one adapter or jobs DAG",
    "INPUT_INVALID",
  );
  const jobs = task.adapter
    ? [
        {
          id: "task",
          adapter: task.adapter,
          input: task.input,
          depends_on: [],
          resources: [],
          side_effects: [],
        },
      ]
    : clone(task.jobs);
  assert(
    Array.isArray(jobs) && jobs.length > 0 && jobs.length <= 64,
    "Provide 1..64 jobs",
    "INPUT_INVALID",
  );
  for (const job of jobs) {
    const meta = registry.describe(job.adapter);
    assert(
      meta && contract.allowed_adapters.includes(job.adapter),
      `Adapter outside contract: ${job.adapter}`,
      "UNSUPPORTED",
    );
    assert(
      job.input && typeof job.input === "object" && !Array.isArray(job.input),
      "Structured adapter input required",
      "INPUT_INVALID",
    );
    const effects = meta.side_effects || [];
    if (task.adapter) job.side_effects = clone(effects);
    else
      assert(
        canonical([...(job.side_effects || [])].sort()) ===
          canonical([...effects].sort()),
        `Job effect declaration differs from adapter metadata: ${job.id}`,
        "INPUT_INVALID",
      );
    for (const key of meta.required || [])
      assert(
        Object.hasOwn(job.input, key),
        `Missing required adapter input: ${key}`,
        "INPUT_INVALID",
      );
  }
  return jobs;
}

async function startWorkflow(spec, options = {}) {
  assert(
    spec && typeof spec === "object" && !Array.isArray(spec),
    "Workflow spec required",
    "INPUT_INVALID",
  );
  if (options.previous)
    return resumeWorkflow(options.previous, spec, {
      ...options,
      previous: undefined,
    });
  const project_id = safeId(spec.project_id || "default", "project");
  const session_id = safeId(spec.session_id || "default", "session");
  const store = options.store || new MemoryContextStore({ project_id });
  assert(
    store.project_id === project_id,
    "Store/project mismatch",
    "SCOPE_INVALID",
  );
  await store.init();
  const analysis = await analyzeRequest(spec);
  const task_id = safeId(
    spec.task_id ||
      `task-${(await digest({ original: spec.request, session_id, task: spec.task || {}, criteria: spec.acceptance_criteria || [] })).slice(0, 24)}`,
    "task",
  );
  assert(
    !(await store.get("Sessions", task_id, { session_id })),
    "Task already exists; use resume or an explicit new task ID",
    "TASK_EXISTS",
  );
  let contract = await createContract(spec, analysis);
  if (spec.answers && Object.keys(spec.answers).length)
    contract = await applyAnswers(contract, spec.answers);
  const record = {
    schema_version: 1,
    task_id,
    project_id,
    session_id,
    original_request: spec.request,
    original_request_digest: analysis.original_request_digest,
    contract,
    current_task: clone(contract.task),
    plan: null,
    state: "ANALYZE",
    reason: null,
    iterations: 0,
    counters: {
      attempts: 0,
      elapsed_ms: 0,
      model_calls: 0,
      repeated_errors: 0,
      last_error_digest: null,
    },
    budgets: boundedBudgets(options.budgets),
    output: null,
    evidence: [],
    history: [],
    events: [],
    knowledge_queries: [],
    knowledge: clone(spec.knowledge || []),
    llm: { calls: 0, cache_hits: 0, skipped: true },
    model_requirement: modelRequirement(options.modelRequest, spec.request),
    unresolved_effect: null,
    source_versions: {},
    metrics: {},
    capabilities: {},
    report: null,
  };
  record.model_requirement_digest = await digest(record.model_requirement);
  record.events.push({ type: "state", state: "ANALYZE", role: "Planner" });
  await store.put("Sessions", task_id, record, { session_id });
  return drive(record, { ...options, store });
}

async function resumeSavedWorkflow(previous, spec = {}, options = {}) {
  assert(
    previous && typeof previous === "object",
    "Resume task identity required",
    "INPUT_INVALID",
  );
  const task_id = safeId(previous.task_id, "task"),
    project_id = safeId(previous.project_id, "project"),
    session_id = safeId(previous.session_id, "session");
  const store = options.store;
  assert(
    store && store.project_id === project_id,
    "Resume requires the authoritative project store",
    "SCOPE_INVALID",
  );
  await store.init();
  const record = await store.get("Sessions", task_id, { session_id });
  assert(
    record &&
      record.task_id === task_id &&
      record.project_id === project_id &&
      record.session_id === session_id,
    "Authoritative task checkpoint not found",
    "RESUME_INVALID",
  );
  assert(
    (await digest(record.model_requirement)) ===
      record.model_requirement_digest,
    "Saved model need identity changed",
    "RESUME_INVALID",
  );
  if (options.modelRequest !== undefined)
    assert(
      canonical(
        modelRequirement(options.modelRequest, record.original_request),
      ) === canonical(record.model_requirement),
      "Resume cannot remove or replace a persisted model requirement",
      "MODEL_REQUIREMENT_CHANGED",
    );
  if (spec.knowledge !== undefined)
    assert(
      canonical(spec.knowledge) === canonical(record.knowledge),
      "Resume cannot replace saved knowledge requirements",
      "CONTRACT_CHANGED",
    );
  assert(
    (await digest(record.original_request)) === record.original_request_digest,
    "Stored original request changed",
    "RESUME_INVALID",
  );
  assert(
    (await computeContractDigest(record.contract)) ===
      record.contract.contract_digest,
    "Stored contract changed",
    "RESUME_INVALID",
  );
  assert(
    record.contract.original_request_digest ===
      record.original_request_digest &&
      record.contract.original_request === record.original_request,
    "Stored original/contract mismatch",
    "RESUME_INVALID",
  );
  for (const field of ["task_id", "project_id", "session_id"])
    if (spec[field] !== undefined)
      assert(
        spec[field] === record[field],
        `Resume ${field} mismatch`,
        "RESUME_INVALID",
      );
  if (spec.request !== undefined)
    assert(
      spec.request === record.original_request,
      "Resume cannot replace original request",
      "ORIGINAL_CHANGED",
    );
  for (const key of [
    "constraints",
    "assumptions",
    "required_inputs",
    "acceptance_criteria",
    "permitted_actions",
    "forbidden_actions",
  ])
    if (spec[key] !== undefined)
      assert(
        canonical(spec[key]) === canonical(record.contract[key]),
        `Resume cannot change confirmed ${key}`,
        "CONTRACT_CHANGED",
      );
  if (spec.task !== undefined)
    assert(
      canonical(spec.task) === canonical(record.current_task),
      "Resume cannot replace the task outside a trusted repair",
      "CONTRACT_CHANGED",
    );
  const existing = {
    task_id,
    project_id,
    session_id,
    original_request_digest: record.original_request_digest,
    contract_digest: record.contract.contract_digest,
  };
  for (const [key, value] of Object.entries(existing))
    if (previous[key] !== undefined)
      assert(
        previous[key] === value,
        `Imported report ${key} differs from authoritative state`,
        "RESUME_INVALID",
      );
  if (spec.answers && Object.keys(spec.answers).length) {
    const before = record.contract.contract_digest;
    record.contract = await applyAnswers(record.contract, spec.answers);
    record.current_task = clone(record.contract.task);
    record.output = null;
    record.evidence = [];
    record.plan = null;
    record.events.push({
      type: "contract-answers",
      before_digest: before,
      after_digest: record.contract.contract_digest,
      ids: Object.keys(spec.answers),
    });
  }
  if (options.budgets) {
    const before = record.budgets;
    record.budgets = boundedBudgets({ ...before, ...options.budgets });
    record.events.push({
      type: "host-budget-change",
      before,
      after: clone(record.budgets),
      spent: clone(record.counters),
    });
  }
  record.events.push({
    type: "resume",
    source: "authoritative-store",
    imported_state_ignored: true,
  });
  return drive(record, { ...options, store, resuming: true });
}

async function drive(record, options) {
  const { store } = options,
    registry = options.registry || createRegistry(),
    policy = options.policy || createPolicy();
  const now = options.now || (() => Date.now());
  const runController = new AbortController();
  const userAbort = () => runController.abort(options.signal?.reason);
  options.signal?.addEventListener("abort", userAbort, { once: true });
  if (options.signal?.aborted) userAbort();
  let checkpoint = now(),
    active = true;
  const elapsed = () =>
    record.counters.elapsed_ms + Math.max(0, now() - checkpoint);
  const remaining = () => record.budgets.maxTimeMs - elapsed();
  const cancelled = () => runController.signal.aborted;
  const chargeElapsed = () => {
    const stamp = now();
    record.counters.elapsed_ms += Math.max(0, stamp - checkpoint);
    checkpoint = stamp;
  };
  const save = async () => {
    chargeElapsed();
    await store.put("Sessions", record.task_id, record, {
      session_id: record.session_id,
    });
  };
  const event = (type, details = {}) =>
    record.events.push({ type, ...details });
  const stop = async (reason, message) => {
    record.state = "BLOCKED";
    record.reason = { code: reason, message };
    record.report = {
      state: record.state,
      reason: record.reason,
      task_id: record.task_id,
      verified: false,
    };
    event("state", { state: "BLOCKED", reason });
    return finish();
  };
  const finish = async () => {
    record.iterations = record.counters.attempts;
    record.metrics = {
      iterations: record.iterations,
      elapsed_ms: elapsed(),
      llm_calls: record.counters.model_calls,
      verified_criteria:
        record.review?.checks.filter(
          (item) => item.id.startsWith("criterion.") && item.passed,
        ).length || 0,
      required_criteria: record.contract.acceptance_criteria.length,
      actual_completed_tasks: record.state === "PASS" ? 1 : 0,
    };
    record.capabilities = {
      execution: "deterministic registered adapters",
      adapters: registry.list().length,
      model_required: false,
      persistence:
        store.constructor.name === "MemoryContextStore"
          ? "memory-only"
          : "local",
      agent_roles:
        "actual deterministic handler roles; not simulated AI agents",
    };
    event("report", { role: "Reporter", state: record.state });
    await save();
    active = false;
    return clone(record);
  };
  const guard = () => {
    assert(!cancelled(), "Workflow cancelled", "CANCELLED");
    assert(
      remaining() > 0,
      "Elapsed time budget exhausted",
      "BUDGET_EXHAUSTED",
    );
    const allowed = authorize("local.compute", policy, {
      contract: record.contract,
      signal: runController.signal,
    });
    assert(allowed.allowed, allowed.reason, "APPROVAL_REQUIRED");
  };
  const bounded = async (callback) => {
    guard();
    const available = Math.max(1, remaining());
    let timer, abort;
    try {
      const timeout = new Promise((_, reject) => {
        timer = setTimeout(() => {
          reject(
            Object.assign(
              new Error("Callback exceeded remaining workflow time"),
              { code: "BUDGET_EXHAUSTED" },
            ),
          );
          runController.abort("deadline");
        }, available);
      });
      const aborted = new Promise((_, reject) => {
        abort = () =>
          reject(
            Object.assign(new Error("Workflow cancelled"), {
              code: "CANCELLED",
            }),
          );
        runController.signal.addEventListener("abort", abort, { once: true });
      });
      const value = await Promise.race([
        Promise.resolve().then(callback),
        timeout,
        aborted,
      ]);
      guard();
      return value;
    } finally {
      clearTimeout(timer);
      if (abort) runController.signal.removeEventListener("abort", abort);
    }
  };
  try {
    const validation = await validateContract(record.contract);
    if (!validation.valid)
      return stop(
        record.contract.unresolved_questions.some((q) => q.required)
          ? "MISSING_INPUT"
          : "CONTRACT_INVALID",
        validation.errors.join("; ") ||
          "Resolve required questions before execution",
      );
    const sources = await bounded(() =>
      taskSources(record.current_task, registry),
    );
    if (
      options.resuming &&
      Object.keys(record.source_versions).length &&
      canonical(record.source_versions) !== canonical(sources)
    )
      return stop(
        "SOURCE_CHANGED",
        "Pinned adapter sources changed; previous evidence is invalid and a new run is required",
      );
    record.source_versions = sources;
    if (
      options.resuming &&
      record.state === "EXECUTE" &&
      record.execution_may_have_side_effects &&
      !record.unresolved_effect
    )
      record.unresolved_effect = {
        iteration: record.counters.attempts,
        reason: "Interrupted effect execution",
        plan_digest: record.plan?.plan_digest || null,
      };
    if (record.unresolved_effect)
      return stop(
        "REPLAY_UNSAFE",
        "Previous side-effect execution was interrupted. Inspect actual effects before explicitly starting a new task; automatic replay is blocked.",
      );
    if (options.resuming && record.pending_model_call)
      return stop(
        "MODEL_CALL_UNCERTAIN",
        "A model call was interrupted. Its external completion and spent budget are uncertain; do not automatically replay it.",
      );
    const requestWords = new Set(words(record.original_request));
    const memoryRecords = await bounded(() => store.list("Memory"));
    const relatedMemory = memoryRecords
      .map((item) => ({
        record: item,
        overlap: words(canonical(item.value)).filter((word) =>
          requestWords.has(word),
        ).length,
      }))
      .filter((item) => item.overlap > 0)
      .sort(
        (a, b) =>
          b.overlap - a.overlap || a.record.id.localeCompare(b.record.id),
      )
      .slice(0, 8)
      .map((item) => ({
        type: "verified-memory-candidate",
        id: item.record.id,
        hash: item.record.hash,
        trusted: false,
        value: item.record.value,
      }));
    const priorSessionRecords = (
      await bounded(() =>
        store.list("Sessions", { session_id: record.session_id }),
      )
    )
      .filter((item) => item.id !== record.task_id)
      .slice(-8)
      .map((item) => ({
        type: "prior-session",
        id: item.id,
        contract_digest: item.value.contract?.contract_digest || null,
        state: item.value.state,
        trusted: false,
        report: item.value.report || null,
      }));
    const context = await preprocessContext({
      contract: record.contract,
      sessionRecords: [...relatedMemory, ...priorSessionRecords],
    });
    record.context = context;
    event("context-preprocessed", {
      duplicates_removed: context.duplicates_removed,
      context_digest: context.context_digest,
    });
    await ensurePrerequisites(context);
    if (
      record.state === "PASS" ||
      (record.state === "REVIEW" && record.output && record.evidence.length)
    ) {
      guard();
      record.review = await reviewOutput({
        contract: record.contract,
        output: record.output,
        original_request_digest: record.original_request_digest,
        executionEvidence: record.evidence,
      });
      if (!record.review.passed)
        return stop(
          "EVIDENCE_CHANGED",
          "Saved PASS evidence failed verification",
        );
      assert(
        (await prerequisiteStamp()) === record.plan?.prerequisite_digest,
        "Saved outcome was produced under different source, model or permission prerequisites",
        "SOURCE_CHANGED",
      );
      guard();
      record.state = "PASS";
      record.report = {
        state: "PASS",
        verified: true,
        reason: "Saved actual evidence reverified without replay",
        task_id: record.task_id,
      };
      return finish();
    }
    if (options.resuming && record.effect_completion)
      return stop(
        "EFFECT_REPLAY_REQUIRED",
        "A previous effect completed but the task did not pass. Inspect its result and explicitly start a new task rather than replaying effects.",
      );
    if (
      record.counters.attempts >= record.budgets.maxIterations ||
      remaining() <= 0 ||
      record.counters.repeated_errors >= record.budgets.maxRepeatedErrors
    )
      return stop(
        "BUDGET_EXHAUSTED",
        "Persisted iteration/time/repeated-error budget exhausted",
      );
    while (record.counters.attempts < record.budgets.maxIterations) {
      guard();
      assert(
        (await computeContractDigest(record.contract)) ===
          record.contract.contract_digest,
        "Contract identity changed",
        "CONTRACT_CHANGED",
      );
      const reconfirm = await validateContract(record.contract);
      assert(
        reconfirm.valid,
        "Replanned contract is invalid",
        "CONTRACT_CHANGED",
      );
      record.state = "PLAN";
      event("state", { state: "PLAN", role: "Planner" });
      const jobs = checkedJobs(record.current_task, registry, record.contract);
      for (const job of jobs) {
        const metadata = registry.describe(job.adapter);
        for (const action of [
          ...(metadata.capabilities || ["local.compute"]),
          ...(metadata.side_effects || []),
        ]) {
          const allowed = authorize(action, policy, {
            contract: record.contract,
            signal: runController.signal,
          });
          assert(allowed.allowed, allowed.reason, "APPROVAL_REQUIRED");
        }
      }
      record.plan = {
        jobs: clone(jobs),
        contract_digest: record.contract.contract_digest,
        source_versions: clone(record.source_versions),
        input_digest: await digest(record.current_task),
        iteration: record.counters.attempts + 1,
      };
      record.plan.plan_digest = await digest(record.plan);
      await ensurePrerequisites(context);
      record.plan.prerequisite_digest = await prerequisiteStamp();
      delete record.plan.plan_digest;
      record.plan.plan_digest = await digest(record.plan);
      record.state = "EXECUTE";
      record.output = null;
      record.evidence = [];
      record.counters.attempts++;
      record.execution_may_have_side_effects = jobs.some(
        (job) => job.side_effects.length > 0,
      );
      if (record.execution_may_have_side_effects)
        record.unresolved_effect = {
          iteration: record.counters.attempts,
          jobs: jobs
            .filter((job) => job.side_effects.length)
            .map((job) => ({
              id: job.id,
              adapter: job.adapter,
              effects: job.side_effects,
            })),
          plan_digest: record.plan.plan_digest,
        };
      event("state", {
        state: "EXECUTE",
        role: "Executor",
        iteration: record.counters.attempts,
      });
      await save(); // Attempts are spent before any external callback.
      const handlers = Object.fromEntries(
        [...new Set(jobs.map((job) => job.adapter))].map((id) => [
          id,
          async (input, jobContext) => {
            guard();
            const before = structuredClone(input),
              input_digest = await digest(JSON.stringify(before));
            const output = await bounded(() =>
              registry.execute(id, before, {
                policy,
                contract: record.contract,
                signal: runController.signal,
                job: jobContext.job,
              }),
            );
            guard();
            const evidence = {
              adapter: id,
              job_id: jobContext.job.id,
              status: "completed",
              input_digest,
              output_digest: await digest(output),
              contract_digest: record.contract.contract_digest,
              plan_digest: record.plan.plan_digest,
              source: clone(record.source_versions[id]),
              iteration: record.counters.attempts,
            };
            record.evidence.push(evidence);
            return output;
          },
        ]),
      );
      const orchestration = await bounded(() =>
        new AgentOrchestrator({
          maxConcurrency: options.maxConcurrency || 2,
          handlers,
        }).run(jobs, {
          signal: runController.signal,
          budget: { deadline: Date.now() + Math.max(0, remaining()) },
        }),
      );
      record.events.push(...orchestration.events);
      let failure;
      if (orchestration.failures.length || orchestration.blocked.length) {
        failure = {
          code:
            orchestration.failures[0]?.code ||
            orchestration.blocked[0]?.code ||
            "EXECUTION_FAILED",
          findings: [...orchestration.failures, ...orchestration.blocked],
        };
      } else {
        record.output = record.current_task.adapter
          ? orchestration.jobs.task
          : { jobs: orchestration.jobs };
        if (record.unresolved_effect)
          record.effect_completion = clone(record.unresolved_effect);
        record.unresolved_effect = null;
        record.state = "REVIEW";
        await save();
        event("state", { state: "REVIEW", role: "Reviewer" });
        record.review = await reviewOutput({
          contract: record.contract,
          output: record.output,
          original_request_digest: record.original_request_digest,
          executionEvidence: record.evidence,
        });
        event("validation", {
          role: "Validator",
          passed: record.review.passed,
          checks: clone(record.review.checks),
        });
        if (record.review.passed) {
          assert(
            (await prerequisiteStamp()) === record.plan.prerequisite_digest,
            "Source, model or permission prerequisites changed while the executor was running; saved output remains unverified",
            "SOURCE_CHANGED",
          );
          guard();
          record.state = "PASS";
          record.reason = null;
          record.report = {
            state: "PASS",
            verified: true,
            task_id: record.task_id,
            criteria: record.review.checks.filter((item) =>
              item.id.startsWith("criterion."),
            ),
            evidence_count: record.evidence.length,
            limits: [
              "No claim of general model intelligence, novelty or external user impact.",
            ],
          };
          return finish();
        }
        failure = {
          code: "VERIFICATION_FAILED",
          findings: clone(record.review.findings),
        };
      }
      const errorDigest = await digest(failure);
      record.counters.repeated_errors =
        record.counters.last_error_digest === errorDigest
          ? record.counters.repeated_errors + 1
          : 1;
      record.counters.last_error_digest = errorDigest;
      record.history.push({
        iteration: record.counters.attempts,
        state: "FAILED",
        failure,
        output: record.output,
        evidence: clone(record.evidence),
        plan: clone(record.plan),
      });
      event("failure", failure);
      await save();
      if (record.unresolved_effect)
        return stop(
          "REPLAY_UNSAFE",
          "An effect did not finish with a known complete result. Its unresolved latch forbids repair or replay until inspected outside this task.",
        );
      if (
        [
          "APPROVAL_REQUIRED",
          "UNSUPPORTED",
          "CANCELLED",
          "BUDGET_EXHAUSTED",
        ].includes(failure.code)
      )
        return stop(
          failure.code,
          "Execution stopped on a non-repairable prerequisite/authority/budget condition",
        );
      if (!options.repair)
        return stop(
          failure.code,
          "Execution or verification failed; no trusted repair handler is configured",
        );
      if (
        record.counters.attempts >= record.budgets.maxIterations ||
        record.counters.repeated_errors >= record.budgets.maxRepeatedErrors
      )
        return stop(
          "BUDGET_EXHAUSTED",
          "Iteration or repeated-error budget exhausted; failure evidence retained",
        );
      record.state = "REPAIR";
      event("state", { state: "REPAIR", role: "Debugger" });
      const beforeContract = record.contract.contract_digest,
        beforeTask = await digest(record.current_task);
      const replacement = await bounded(() =>
        options.repair({
          contract: clone(record.contract),
          task: clone(record.current_task),
          failure: clone(failure),
          iteration: record.counters.attempts,
          remaining: {
            iterations: record.budgets.maxIterations - record.counters.attempts,
            time_ms: remaining(),
          },
        }),
      );
      assert(
        (await computeContractDigest(record.contract)) === beforeContract,
        "Repair changed immutable contract",
        "CONTRACT_CHANGED",
      );
      assert(
        replacement &&
          typeof replacement === "object" &&
          Object.keys(replacement).every((key) => key === "task"),
        "Trusted repair may return only {task}; criteria/authority cannot change",
        "CONTRACT_CHANGED",
      );
      checkedJobs(replacement.task, registry, record.contract);
      const newSources = await taskSources(replacement.task, registry);
      assert(
        canonical(newSources) === canonical(record.source_versions),
        "Repair cannot switch adapter source scope",
        "CONTRACT_CHANGED",
      );
      record.current_task = clone(replacement.task);
      record.contract.task = clone(replacement.task);
      record.output = null;
      record.evidence = [];
      event("repair", {
        before_input_digest: beforeTask,
        after_input_digest: await digest(record.current_task),
        contract_digest: beforeContract,
        failed_checks: failure.findings,
      });
      await save();
    }
    return stop("BUDGET_EXHAUSTED", "Iteration limit reached");
  } catch (error) {
    return stop(
      error.code || "EXECUTION_FAILED",
      String(error.message || error),
    );
  } finally {
    options.signal?.removeEventListener("abort", userAbort);
    if (active) chargeElapsed();
  }

  async function prerequisiteStamp() {
    const knowledge = await currentKnowledgeManifest();
    guard();
    if (record.model_requirement?.needed) {
      const permission = authorize("llm.call", policy, {
        contract: record.contract,
        signal: runController.signal,
      });
      if (!permission.allowed) {
        record.llm.completed = false;
        record.llm.invalidated = true;
        record.llm.response = null;
      }
      assert(permission.allowed, permission.reason, "APPROVAL_REQUIRED");
    }
    return digest({
      knowledge,
      policy: await digestPolicy(),
      contract_digest: record.contract.contract_digest,
      model_requirement_digest: record.model_requirement_digest,
      model_provenance: record.llm.completed
        ? record.llm.provenance_digest
        : null,
    });
  }
  async function currentKnowledgeManifest() {
    return options.retriever?.sourceManifest
      ? bounded(() => options.retriever.sourceManifest())
      : {};
  }
  function citedResultIsFresh(result, manifest) {
    return (
      result?.status === "found" &&
      Array.isArray(result.results) &&
      result.results.length > 0 &&
      result.results.every((hit) => {
        const citation = hit?.citation;
        const current = citation?.id && manifest[citation.id];
        return (
          typeof hit.text === "string" &&
          hit.text.length > 0 &&
          current &&
          typeof citation.source_hash === "string" &&
          citation.source_hash === current.source_hash &&
          ["string", "number"].includes(typeof citation.version) &&
          citation.version === current.version
        );
      })
    );
  }
  async function ensurePrerequisites(context) {
    const satisfiedKnowledge = [];
    for (const query of record.knowledge) {
      if (!query.needed) continue;
      assert(
        typeof query.query === "string" &&
          query.query.trim() &&
          typeof query.reason === "string" &&
          query.reason.trim(),
        "A knowledge gap needs a query and reason",
        "INPUT_INVALID",
      );
      const manifest = await currentKnowledgeManifest();
      const query_digest = await digest({ query, source_versions: manifest });
      const reusable = record.knowledge_queries.find(
        (item) =>
          item.query_digest === query_digest &&
          item.satisfied === true &&
          citedResultIsFresh(item.result, manifest),
      );
      if (reusable) {
        satisfiedKnowledge.push(clone(reusable));
        continue;
      }
      if (!options.retriever) {
        record.knowledge_queries.push({
          query: query.query,
          query_digest,
          skipped: true,
          satisfied: false,
          reason: "Local retriever not configured",
        });
        assert(
          !query.required,
          "Required knowledge source unavailable",
          "KNOWLEDGE_UNAVAILABLE",
        );
        continue;
      }
      const result = await bounded(() =>
        options.retriever.search({
          query: query.query,
          kind: query.kind || "rag",
          needed: true,
          limit: query.limit || 3,
          external: query.external === true,
          contract: record.contract,
          signal: runController.signal,
        }),
      );
      const after = await currentKnowledgeManifest();
      const fresh =
        canonical(manifest) === canonical(after) &&
        citedResultIsFresh(result, after);
      const entry = {
        query: query.query,
        query_digest,
        kind: query.kind || "rag",
        reason: query.reason,
        result: clone(result),
        satisfied: fresh,
        trusted: false,
      };
      record.knowledge_queries.push(entry);
      event("knowledge-search", {
        role: "Researcher",
        query: query.query,
        kind: query.kind || "rag",
        satisfied: fresh,
      });
      if (fresh) satisfiedKnowledge.push(clone(entry));
      assert(
        !query.required || fresh,
        "Required knowledge gap has no current, verified citation-bearing source",
        "KNOWLEDGE_UNAVAILABLE",
      );
    }
    const request = record.model_requirement;
    if (!request?.needed) return;
    const checkModelAuthority = () => {
      const allowed = authorize("llm.call", policy, {
        contract: record.contract,
        signal: runController.signal,
      });
      if (!allowed.allowed) {
        record.llm.completed = false;
        record.llm.invalidated = true;
        record.llm.response = null;
      }
      assert(allowed.allowed, allowed.reason, "APPROVAL_REQUIRED");
    };
    checkModelAuthority();
    const permission_scope_digest = await digestPolicy();
    const knowledgeSources = await currentKnowledgeManifest();
    const source_versions = {
      engine: record.source_versions,
      knowledge: knowledgeSources,
    };
    const modelContext = { ...context, knowledge: satisfiedKnowledge };
    const signature = await digest({
      requirement: request,
      contract_digest: record.contract.contract_digest,
      permission_scope_digest,
      source_versions,
      context: modelContext,
    });
    checkModelAuthority();
    if (record.llm.completed && record.llm.provenance_digest === signature)
      return;
    if (record.llm.completed) {
      event("model-response-invalidated", {
        reason: "source/context/authority/contract changed",
        previous_provenance: record.llm.provenance_digest,
        current_provenance: signature,
      });
      record.llm.completed = false;
      record.llm.invalidated = true;
      record.llm.response = null;
    }
    assert(
      options.gateway,
      "A persisted required model need has no configured gateway",
      "MODEL_UNAVAILABLE",
    );
    const callsBefore = options.gateway.stats().actual_calls;
    let model,
      knownSettled = false;
    record.pending_model_call = true;
    await save();
    try {
      model = await bounded(() =>
        options.gateway.request({
          ...request,
          contract: record.contract,
          signal: runController.signal,
          max_calls_remaining: Math.max(
            0,
            record.budgets.maxCalls - record.counters.model_calls,
          ),
          project_id: record.project_id,
          session_id: record.session_id,
          context: modelContext,
          requirements_digest: record.contract.contract_digest,
          permission_scope_digest,
          source_versions: record.source_versions,
        }),
      );
      knownSettled = true;
    } catch (error) {
      if (!["CANCELLED", "BUDGET_EXHAUSTED", "TIMEOUT"].includes(error.code))
        knownSettled = true;
      throw error;
    } finally {
      record.counters.model_calls += Math.max(
        0,
        options.gateway.stats().actual_calls - callsBefore,
      );
      record.pending_model_call = !knownSettled;
      await save();
    }
    assert(
      ["called", "cached", "coalesced"].includes(model.status),
      "Required model need was skipped without a valid response",
      "MODEL_UNAVAILABLE",
    );
    const afterSources = await currentKnowledgeManifest();
    checkModelAuthority();
    assert(
      canonical(knowledgeSources) === canonical(afterSources) &&
        permission_scope_digest === (await digestPolicy()),
      "Model evidence changed while awaiting response",
      "SOURCE_CHANGED",
    );
    if (model.status === "cached") record.llm.cache_hits++;
    record.llm = {
      ...record.llm,
      completed: true,
      invalidated: false,
      skipped: false,
      calls: record.counters.model_calls,
      response: clone(model),
      provenance_digest: signature,
      source_versions: clone(source_versions),
      semantics:
        "Supplemental model output; deterministic task and contract unchanged",
    };
    event("gateway-result", {
      status: model.status,
      reason: request.reason,
      provenance_digest: signature,
    });
    await save();
  }
  async function digestPolicy() {
    return digest({
      grants: policy.grants || [],
      network: policy.network,
      paid_providers: policy.paid_providers,
      permitted: record.contract.permitted_actions,
      forbidden: record.contract.forbidden_actions,
    });
  }
}
