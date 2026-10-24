import {
  readFile,
  mkdir,
  writeFile,
  copyFile,
  realpath,
  access,
} from "node:fs/promises";
import { createReadStream } from "node:fs";
import { createHash } from "node:crypto";
import { fileURLToPath, pathToFileURL } from "node:url";
import path from "node:path";
import { performance } from "node:perf_hooks";
import { runWorkflow, resumeWorkflow } from "../src/pact-loop.mjs";
import { createRegistry } from "../src/skill-router.mjs";
import { MemoryContextStore } from "../src/memory-context-store.mjs";
import { KnowledgeRetriever } from "../src/knowledge-retriever.mjs";
import { SessionLLMCache } from "../src/session-llm-cache.mjs";
import { LLMGateway } from "../src/llm-gateway.mjs";
import { createPolicy } from "../src/security-policy.mjs";
import { digest, getPath, canonical } from "../src/shared.mjs";
import { adapters } from "../vendor/inventory.mjs";
const root = fileURLToPath(new URL("../", import.meta.url));
const spec = JSON.parse(
  await readFile(path.join(root, "examples/invoice.json"), "utf8"),
);
const outputDir = path.resolve(
  process.env.PACTWEAVE_BENCH_OUTPUT ||
    path.join(root, "benchmarks", "results"),
);
await mkdir(outputDir, { recursive: true });
try {
  await mkdir(path.join(outputDir, "history"), { recursive: true });
  await copyFile(
    path.join(outputDir, "raw.json"),
    path.join(outputDir, "history", "before-" + Date.now() + ".json"),
  );
} catch (e) {
  if (e.code !== "ENOENT") throw e;
}
const now = new Date().toISOString();
const trials = [];
for (const mode of ["full", "no-cache", "no-retrieval"]) {
  for (let trial = 0; trial < 3; trial++) {
    const store = new MemoryContextStore({ project_id: spec.project_id });
    await store.init();
    const cache = new SessionLLMCache({
      ttlMs: mode === "no-cache" ? 0 : 1800000,
    });
    const policy = createPolicy();
    const retriever =
      mode === "no-retrieval"
        ? undefined
        : new KnowledgeRetriever({ store, policy });
    const gateway = new LLMGateway({ cache, policy });
    const started = performance.now();
    try {
      const result = await runWorkflow(spec, {
        store,
        registry: createRegistry(),
        retriever,
        gateway,
        policy,
      });
      trials.push({
        experiment: "deterministic-workflow",
        mode,
        trial,
        input: spec,
        state: result.state,
        expected_behavior_met: result.state === "PASS",
        reason: result.reason || null,
        output: result.output,
        evidence: result.evidence,
        metrics: result.metrics,
        actual_model_calls: gateway.stats().actual_calls,
        elapsed_ms: performance.now() - started,
      });
    } catch (e) {
      trials.push({
        experiment: "deterministic-workflow",
        mode,
        trial,
        error: { message: e.message, code: e.code || null },
        elapsed_ms: performance.now() - started,
      });
    }
  }
}
for (const mode of ["full", "no-cache", "no-retrieval"]) {
  const store = new MemoryContextStore({ project_id: spec.project_id });
  await store.init();
  const policy = createPolicy(),
    cache = new SessionLLMCache({ ttlMs: mode === "no-cache" ? 0 : 1800000 });
  const retriever =
    mode === "no-retrieval"
      ? undefined
      : new KnowledgeRetriever({ store, policy });
  if (retriever)
    await retriever.ingest({
      id: "invoice-policy",
      text: "Invoice overpayments must remain unallocated rather than discarded.",
      source: "local:synthetic-invoice-policy",
      version: "1",
      kind: "wiki",
    });
  const contextual = {
    ...spec,
    task_id: "required-knowledge",
    knowledge: [
      {
        query: "Invoice overpayments unallocated",
        kind: "wiki",
        needed: true,
        required: true,
        reason: "Verify the declared handling policy before execution.",
      },
    ],
  };
  const started = performance.now();
  const result = await runWorkflow(contextual, {
    store,
    registry: createRegistry(),
    retriever,
    policy,
  });
  trials.push({
    experiment: "required-knowledge-ablation",
    mode,
    input: contextual,
    state: result.state,
    reason: result.reason,
    output: result.output,
    knowledge_queries: result.knowledge_queries,
    evidence: result.evidence,
    elapsed_ms: performance.now() - started,
    expected_behavior:
      mode === "no-retrieval"
        ? "BLOCKED: required evidence unavailable"
        : "PASS with source citation",
    expected_behavior_met:
      mode === "no-retrieval"
        ? result.state === "BLOCKED" &&
          result.reason?.code === "KNOWLEDGE_UNAVAILABLE"
        : result.state === "PASS" &&
          result.knowledge_queries.some((q) =>
            q.result?.results?.some((r) => r.citation?.source_hash),
          ),
  });
  if (mode === "no-retrieval") {
    const resumed = await resumeWorkflow(
      result,
      {},
      { store, registry: createRegistry(), policy },
    );
    trials.push({
      experiment: "missing-knowledge-resume",
      mode,
      state: resumed.state,
      reason: resumed.reason,
      expected_behavior:
        "Still BLOCKED; resume cannot skip failed required query",
      expected_behavior_met:
        resumed.state === "BLOCKED" &&
        resumed.reason?.code === "KNOWLEDGE_UNAVAILABLE",
    });
  }
  const repairSpec = {
    ...spec,
    task_id: "repair-resume",
    task: { ...spec.task, input: { ...spec.task.input, payments: [] } },
  };
  const first = await runWorkflow(repairSpec, {
    store,
    registry: createRegistry(),
    policy,
  });
  const repaired = await resumeWorkflow(
    first,
    {},
    {
      store,
      registry: createRegistry(),
      policy,
      budgets: { maxRepeatedErrors: 3 },
      repair: async ({ task }) => ({
        task: { ...task, input: spec.task.input },
      }),
    },
  );
  trials.push({
    experiment: "repair-and-resume",
    mode,
    input: repairSpec,
    initial_state: first.state,
    initial_failure: first.reason,
    state: repaired.state,
    history: repaired.history,
    evidence: repaired.evidence,
    events: repaired.events,
    contract_unchanged:
      first.contract.contract_digest === repaired.contract.contract_digest,
    original_unchanged: first.original_request === repaired.original_request,
    metrics: repaired.metrics,
    expected_behavior:
      "Original contract preserved; failure retained; repaired input verified",
    explicit_resume_budget: { maxRepeatedErrors: 3 },
    expected_behavior_met:
      repaired.state === "PASS" &&
      first.contract.contract_digest === repaired.contract.contract_digest &&
      first.original_request === repaired.original_request &&
      repaired.history.length > 0,
  });
}
const domainFixtures = [];
for (const domain of [
  "software",
  "operations",
  "data",
  "business",
  "research",
  "learning",
]) {
  const adapter = adapters.find((a) => a.domain === domain),
    cases = JSON.parse(
      await readFile(
        path.join(root, "vendor", adapter.id, "cases.json"),
        "utf8",
      ),
    ),
    fixture = cases[0];
  const criteria = Object.entries(fixture.expect).map(([key, expected], i) => ({
    id: "outcome-" + i,
    path: "result." + key,
    operator: "equals",
    expected,
    critical: true,
  }));
  const taskSpec = {
    request: `Perform ${adapter.title}: ${adapter.description || adapter.job || adapter.method || ""}`,
    project_id: "benchmark",
    session_id: "domain-" + domain,
    task: { adapter: adapter.id, input: fixture.input },
    acceptance_criteria: criteria,
  };
  const started = performance.now();
  const result = await runWorkflow(taskSpec, { registry: createRegistry() });
  domainFixtures.push({
    domain,
    adapter: adapter.id,
    input: fixture.input,
    expected: fixture.expect,
    request: taskSpec.request,
    output_paths: Object.keys(fixture.expect),
    state: result.state,
    output: result.output,
    evidence: result.evidence,
    metrics: result.metrics,
    elapsed_ms: performance.now() - started,
  });
}
const modelResult = {
  status: "NOT_RUN",
  reason:
    "Set PACTWEAVE_MODEL_MODULE and PACTWEAVE_MODEL_CACHE to an already installed local Transformers.js module and cached model; no downloads are performed.",
};
let generator;
if (process.env.PACTWEAVE_MODEL_MODULE && process.env.PACTWEAVE_MODEL_CACHE) {
  try {
    const module = await import(
      pathToFileURL(path.resolve(process.env.PACTWEAVE_MODEL_MODULE)).href
    );
    module.env.cacheDir = path.resolve(process.env.PACTWEAVE_MODEL_CACHE);
    module.env.allowRemoteModels = false;
    const model = "HuggingFaceTB/SmolLM2-135M-Instruct",
      revision = "12fd25f77366fa6b3b4b768ec3050bf629380bac";
    const localModel = await realpath(
      path.join(module.env.cacheDir, ...model.split("/"), revision),
    );
    const modelAssets = {};
    for (const name of [
      "config.json",
      "generation_config.json",
      "tokenizer_config.json",
      "tokenizer.json",
      "onnx/model_q4.onnx",
    ]) {
      const file = path.join(localModel, name);
      await access(file);
      const hash = createHash("sha256");
      for await (const chunk of createReadStream(file)) hash.update(chunk);
      modelAssets[name] = hash.digest("hex");
    }
    const modelOptions = {
      dtype: "q4",
      revision,
      local_files_only: true,
      device: "cpu",
      session_options: { intraOpNumThreads: 1, interOpNumThreads: 1 },
    };
    // Explicit public SDK components avoid optional remote file-list discovery.
    // Every component is restricted to the already cached pinned revision.
    const tokenizer = await module.AutoTokenizer.from_pretrained(
      localModel,
      modelOptions,
    );
    const modelInstance = await module.AutoModelForCausalLM.from_pretrained(
      localModel,
      modelOptions,
    );
    generator = new module.TextGenerationPipeline({
      task: "text-generation",
      model: modelInstance,
      tokenizer,
    });
    if (!generator.tokenizer || !generator.model)
      throw Error("Local model components unavailable");
    const provider = {
      kind: "local",
      call: async (payload) => {
        const messages = [
          {
            role: "system",
            content:
              "Return only JSON. Follow the exact output schema in the user request.",
          },
          {
            role: "user",
            content:
              payload.request + "\nContext: " + JSON.stringify(payload.context),
          },
        ];
        const r = await generator(messages, {
          max_new_tokens: 64,
          do_sample: false,
          return_full_text: false,
        });
        const generated = r[0].generated_text;
        const response =
          typeof generated === "string" ? generated : generated.at(-1).content;
        return { response };
      },
    };
    modelResult.status = "EXECUTED";
    modelResult.model = {
      id: model,
      revision,
      dtype: "q4",
      device: "cpu",
      max_new_tokens: 64,
      do_sample: false,
      assets_sha256: modelAssets,
    };
    modelResult.arms = [];
    modelResult.domain_comparison = [];
    const directGateway = new LLMGateway({
      providers: { [model]: provider },
      policy: createPolicy({ grants: ["llm.call"] }),
      budget: { maxCalls: 6, maxTimeMs: 120000, maxTokens: 10000 },
    });
    for (const fixture of domainFixtures) {
      const query = {
        needed: true,
        project_id: "benchmark",
        session_id: "plain-" + fixture.domain,
        model_identifier: model,
        request:
          fixture.request +
          " Return a JSON object mapping each requested output path to its computed value. Compute from the supplied input; do not explain.",
        context: { input: fixture.input, output_paths: fixture.output_paths },
        requirements_digest: await digest(fixture.output_paths),
        permission_scope_digest: await digest(["llm.call"]),
      };
      const started = performance.now();
      try {
        const result = await directGateway.request(query);
        let parsed = null;
        try {
          parsed = JSON.parse(result.response);
        } catch {}
        const checks = Object.entries(fixture.expected).map(
          ([key, expected]) => ({
            path: key,
            expected,
            actual: parsed?.[key] ?? null,
            passed:
              parsed?.[key] !== undefined &&
              canonical(parsed[key]) === canonical(expected),
          }),
        );
        modelResult.domain_comparison.push({
          domain: fixture.domain,
          adapter: fixture.adapter,
          query,
          response: result.response,
          checks,
          passed: checks.every((c) => c.passed),
          elapsed_ms: performance.now() - started,
          tool_state: fixture.state,
          tool_elapsed_ms: fixture.elapsed_ms,
        });
      } catch (e) {
        modelResult.domain_comparison.push({
          domain: fixture.domain,
          query,
          error: { message: e.message, code: e.code || null },
          passed: false,
          tool_state: fixture.state,
        });
      }
    }
    modelResult.domain_metrics = directGateway.stats();
    const request =
      'Reconcile invoice i total USD10.00 and matching payment p USD12.00. Return exactly {"paid":1,"unallocated":"2.00"} if the invoice is fully paid and the remainder is USD2.00.';
    for (const mode of ["plain-model-no-cache", "pactweave-cache"]) {
      const cache = new SessionLLMCache({
        ttlMs: mode === "plain-model-no-cache" ? 0 : 1800000,
      });
      const policy = createPolicy({ grants: ["llm.call"] });
      let sources = {
        policy: { version: "1", source_hash: await digest("invoice policy1") },
      };
      const gateway = new LLMGateway({
        cache,
        providers: { [model]: provider },
        policy,
        budget: { maxCalls: 3, maxTimeMs: 120000, maxTokens: 10000 },
        sourceManifest: async () => sources,
      });
      const runs = [];
      for (let index = 0; index < 3; index++) {
        if (index === 2)
          sources = {
            policy: {
              version: "2",
              source_hash: await digest("invoice policy2"),
            },
          };
        const query = {
          needed: true,
          project_id: "benchmark",
          session_id: "actual-small-model",
          request,
          context: {
            invoice_total: "10.00",
            payment: "12.00",
            currency: "USD",
          },
          model_identifier: model,
          requirements_digest: await digest({ paid: 1, unallocated: "2.00" }),
          permission_scope_digest: await digest(policy.grants),
        };
        const started = performance.now();
        try {
          const r = await gateway.request(query);
          let parsed = null;
          try {
            parsed = JSON.parse(r.response);
          } catch {}
          runs.push({
            index,
            query,
            response: r.response,
            status: r.status,
            evidence: r.evidence,
            passed: parsed?.paid === 1 && parsed?.unallocated === "2.00",
            elapsed_ms: performance.now() - started,
          });
        } catch (e) {
          runs.push({
            index,
            error: { message: e.message, code: e.code || null },
            elapsed_ms: performance.now() - started,
          });
        }
      }
      modelResult.arms.push({ mode, runs, metrics: gateway.stats() });
    }
    modelResult.limitations = [
      "One tiny fully specified arithmetic/JSON fixture; answer is present in the prompt. Measures cache behavior and formatting, not general reasoning or intelligence.",
      "The provider did not report token usage; no token-savings claim.",
      "Source version changes force a new actual model call. Cache does not improve an incorrect answer.",
      "Deterministic domain tool outcomes and model response scores are separate evidence.",
      "Six worked examples across six domains compare a configured tiny model's flat JSON computation with bundled domain executors; this measures tool-assisted workflow completion on these fixtures only, not model intelligence. Held-out expected values are used for scoring, not supplied in the domain-model prompt.",
    ];
    const completedInferences =
      modelResult.domain_comparison.filter(
        (r) => typeof r.response === "string",
      ).length +
      modelResult.arms
        .flatMap((a) => a.runs)
        .filter((r) => r.status === "called").length;
    modelResult.completed_inferences = completedInferences;
    modelResult.status =
      completedInferences > 0
        ? modelResult.domain_metrics.failures ||
          modelResult.arms.some((a) => a.metrics.failures)
          ? "EXECUTED_WITH_FAILURES"
          : "EXECUTED"
        : "FAILED";
  } catch (e) {
    modelResult.status = "FAILED";
    modelResult.failure = { message: e.message, code: e.code || null };
  } finally {
    if (generator) await generator.dispose();
  }
}
const report = {
  schema_version: 1,
  checked_at: now,
  platform: process.platform,
  node: process.versions.node,
  original_spec_digest: await digest(spec),
  benchmark_source_sha256: await digest(
    await readFile(fileURLToPath(import.meta.url), "utf8"),
  ),
  trials,
  domain_fixtures: domainFixtures,
  small_model: modelResult,
  limitations: [
    "Synthetic local fixtures, no external users.",
    "Identical deterministic task has no retrieval/model requirement; no-cache/no-retrieval should have equal outcomes and zero model calls.",
    "Required-knowledge ablation intentionally blocks when a required source is removed. Repair/resume runs preserve the same outcome contract; no-cache has no benefit when there is no model call.",
    "Timings include local initialization; this small suite does not establish production latency or global accuracy.",
  ],
  summary: {
    trials: trials.length,
    passed: trials.filter((x) => x.state === "PASS").length,
    expected_behavior_checks: trials.filter(
      (x) => typeof x.expected_behavior_met === "boolean",
    ).length,
    expected_behavior_passed: trials.filter(
      (x) => x.expected_behavior_met === true,
    ).length,
    unexpected_behavior:
      trials.filter((x) => x.error || x.expected_behavior_met === false)
        .length + domainFixtures.filter((x) => x.state !== "PASS").length,
  },
};
await writeFile(
  path.join(outputDir, "raw.json"),
  JSON.stringify(report, null, 2) + "\n",
);
if (report.summary.unexpected_behavior > 0) process.exitCode = 1;
console.log(
  JSON.stringify(
    {
      output: path.join(outputDir, "raw.json"),
      summary: report.summary,
      small_model: modelResult.status,
    },
    null,
    2,
  ),
);
