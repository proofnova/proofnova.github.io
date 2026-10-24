# Reproducible experiments

The benchmark distinguishes deterministic workflow behavior, actual local model output and response-cache behavior. It is a small synthetic development evaluation, not an unseen general-intelligence or production benchmark.

## Saved evidence

- [Final raw.json](results/raw.json): original inputs, prompt/context, source hashes, actual outputs, checks, failures, timing, cache events and model configuration.
- [First archived attempt](results/history/before-1792859773167.json): 12 pre-inference provider failures. Its original EXECUTED status was incorrect; it is **not a valid model comparison**.
- [Second archived attempt](results/history/before-1792860044225.json): tokenizer initialization FAILED; no successful inference.
- [Verification record](../docs/verification.md): tests, browser observations, limitations and the failure/recovery interpretation.
- [Runner source](run.mjs): executable experiment and scoring rules.

The archives are deliberately unchanged. The final record reports `small_model.status: "EXECUTED"` and **11 completed inferences**; earlier provider-call counters must not be substituted for successful inference counts.

## What was measured

| Experiment | Result | Interpretation |
| --- | --- | --- |
| Workflow variants, required-source ablation, repair and resume | **16/16 expected behaviors**: 14 PASS, 2 intentional BLOCKED | Checks contract behavior on these fixtures; BLOCKED is not a completed task |
| Six domain developer examples | Registered executors **6/6 PASS**, model **0/6 strict flat-JSON matches** | Demonstrates these executor-completed tasks under stated model settings, not general model reasoning |
| Three repeated/source-changed requests without cache | **3 actual model calls**, no hits | Call-count baseline |
| Same three requests with cache | **2 actual calls**, **1 exact hit**, **1 avoided call** | Reuses one exact response; source change forces a fresh call |
| Cache-task answer correctness | All model responses failed the JSON check in both arms | Caching did **not** improve answer quality |

The six examples cover `change-impact`, `trace-reconstruction`, `csv-harmonizer`, `invoice-reconciliation`, `citation-grounding` and `prerequisite-learning`. The developer supplies structured input and selects the executor; this does not test autonomous routing from unrestricted prose. These examples were already used during development and are not held-out tasks. Expected values are used for scoring the domain responses, rather than being supplied in those prompts. The separate trivial cache prompt does contain the desired answer and is only a reuse/formatting test.

The model often returned prose or output truncated by its **64-token** generation limit. That cap, a single tiny model, a single configuration, six worked examples and strict flat-JSON scoring sharply limit the comparison. Different prompts, token budgets, runtimes or models can change results. The measurements do not prove universal accuracy, 95% reliability, general reasoning improvement or superiority to other workflow engines.

## Reproduce deterministic checks

Node.js 22+ is required. The saved run used **Windows / Node.js 24.13.1**. No mandatory runtime package, model or network is needed for the deterministic arms.

```powershell
$env:PACTWEAVE_BENCH_OUTPUT = '.pactweave/benchmark-reproduction'
node benchmarks/run.mjs
```

Without the two model environment variables below, the local-model arm is **NOT_RUN**. That is different from a failed inference and is never replaced with a mock labeled as a real model. Use a new output directory to keep the published final record intact; the runner also archives a prior `raw.json` before replacement. The sample output directory is ignored private state and should not be committed accidentally.

## Reproduce the actual offline model arm

Use an **already installed** compatible Transformers.js module and an **already cached** pinned model. The repository does not download either automatically, and the benchmark does not authorize a paid call.

```powershell
$env:PACTWEAVE_MODEL_MODULE = 'C:/path/to/installed/transformers.node.mjs'
$env:PACTWEAVE_MODEL_CACHE = 'C:/path/to/existing/model-cache'
$env:PACTWEAVE_BENCH_OUTPUT = '.pactweave/benchmark-reproduction-with-model'
node benchmarks/run.mjs
```

`PACTWEAVE_MODEL_MODULE` is the actual local module entry file, not a model server URL. `PACTWEAVE_MODEL_CACHE` must contain the existing cache subtree:

```text
HuggingFaceTB/SmolLM2-135M-Instruct/
  12fd25f77366fa6b3b4b768ec3050bf629380bac/
    config.json
    generation_config.json
    tokenizer_config.json
    tokenizer.json
    onnx/model_q4.onnx
```

The runner sets `allowRemoteModels=false`, `local_files_only=true`, `dtype="q4"`, `device="cpu"`, `intraOpNumThreads=1`, `interOpNumThreads=1`, `max_new_tokens=64`, `do_sample=false` and `return_full_text=false`. The local model revision and five asset SHA-256 hashes are recorded in `small_model.model`. The prompt asks for JSON and appends structured context; full task-specific prompts and raw responses are saved for inspection.

On POSIX shells, set the same three environment variables with your shell's standard `export` syntax before invoking the same Node command. Linux/macOS were not locally run for this saved record.

## Metric interpretation

Exact hits, avoided calls, coalesced calls, context-only matches and provider failures are separate counters. Only successfully returned actual provider results count toward the final completed-inference count. No token usage was reported by this provider, so token savings are **not measured**; a zero accounting total is not a token-count observation. Elapsed times include local initialization and are not controlled production latency measurements.

The simple invoice variants require neither retrieval nor a model, so identical full/no-cache/no-retrieval outcomes and zero calls are expected. The required-knowledge ablation intentionally blocks when its source is removed. Repair/resume must preserve the same acceptance contract. These distinctions keep a safe refusal from being misreported as successful task completion and keep an optimization from being misreported as better answer quality.
