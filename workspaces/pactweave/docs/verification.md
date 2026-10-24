# Verification record

This record separates executable tests, browser observations, synthetic workflow checks and actual model inference. It describes the measured local build; it does not certify arbitrary tasks, external adoption or production security.

## Local checks

Environment: Windows, Node.js **24.13.1**. The minimum supported runtime is Node.js 22. Other operating systems are represented by the repository's CI configuration; they were not locally executed in this session.

| Check | Observed result | Evidence |
| --- | --- | --- |
| Node test suite, final run | **142/142 passed**, zero failed, skipped or cancelled | [test-run-02.txt](evidence/test-run-02.txt) |
| Original test run | 138 passed, 4 failed; preserved before corrections and final rerun | [test-run-01.txt](evidence/test-run-01.txt) |
| Registered adapters in the actual local browser | **60/60 supplied fixtures passed**, covering all 30 adapters | [browser-adapters.json](evidence/browser-adapters.json) |
| Four-language browser invoice workflow | English, Korean, Japanese and Simplified Chinese each returned PASS | [browser-local.json](evidence/browser-local.json) |
| Browser negative cases | Missing task BLOCKED; unmet criterion BLOCKED; malformed JSON ERROR with download disabled | [browser-local.json](evidence/browser-local.json) |
| Mobile browser | 390 × 844 viewport; no horizontal overflow or missing form labels in the checked page | [browser-local.json](evidence/browser-local.json) |
| CLI command smoke checks | All 14 command surfaces were exercised successfully with parsed JSON | [cli-smoke.json](evidence/cli-smoke.json) and [CLI usage](cli.md) |

The release ZIP preflight recorded 193 entries and passed CRC checks. A fresh extraction ran the invoice workflow successfully and passed the full 142-test suite. The archive contains no model files or mandatory runtime packages. Archive entry counts describe that particular preflight build and can change when documentation is added; they are not a product performance metric.

The browser's execution-record download was also clicked and its actual downloaded JSON parsed: PASS with one execution-evidence record. This is a local interaction observation, not evidence of disk recovery or provider execution in the browser. The checked mobile condition is a layout/label check, not a comprehensive accessibility audit.

The initial test failures included three adapter parity checks and a Gateway timeout assertion. They remain visible in the first log rather than being erased. The final complete run passed all 142 checks. The individual assertions and their scope are available in [tests](../tests/).

## Synthetic workflow experiment

The [final raw benchmark](../benchmarks/results/raw.json) records **16/16 expected-behavior checks**: 14 PASS outcomes and two intentional BLOCKED outcomes. These include full, no-cache and no-retrieval execution; a required-source ablation; repair; and resume. A correctly blocked task counts as expected behavior, not as completed work.

The basic deterministic invoice task needs neither retrieval nor a model. Equal outcomes and zero model calls in its no-cache/no-retrieval variants show those branches were unnecessary for this fixture. They do not establish that cache or retrieval is useless for other tasks. Removing a required source blocks the knowledge-dependent fixture instead of letting it pass without evidence.

## Actual local model comparison

The final `small_model.status` is **EXECUTED**, with **11 completed model inferences**. The model was `HuggingFaceTB/SmolLM2-135M-Instruct`, pinned revision `12fd25f77366fa6b3b4b768ec3050bf629380bac`, q4 quantization, CPU, greedy generation (`do_sample=false`), maximum **64 new tokens**. The runner restricts loading to already cached local files; model asset hashes are retained in the raw record.

On six existing developer-worked examples across software, operations, data, business, research and learning, the registered executors returned **6/6 PASS**, while the model alone met **0/6 strict flat-JSON result checks**. The model often generated prose or truncated responses. The 64-token cap is a substantial limitation. These are developer fixtures, not an unseen evaluation set; the workflow explicitly selects the adapter and provides structured inputs. This demonstrates task completion through those specific deterministic executors under the measured conditions. It does **not** establish general reasoning improvement, autonomous tool selection, all-task accuracy or superiority over larger models or other prompting/settings.

The separate cache arm used three requests: the no-cache arm made **3 calls**; the cache arm made **2 calls**, with **1 exact hit** and **1 avoided call**. The third request changed a source version and forced a new inference. Every response in this small cache-formatting task failed the JSON answer check, including the reused response. **Caching avoided duplicate work; it did not improve answer quality.** That prompt includes its expected answer and is a cache/protocol fixture, not a reasoning benchmark.

The provider did not report token usage. A raw `tokens: 0` accounting field therefore must not be read as zero generated tokens or as measured token savings. Timing values are local per-run observations, not production latency guarantees.

## Failed model history

- [First archived run](../benchmarks/results/history/before-1792859773167.json): originally labeled EXECUTED, but all **12 provider attempts failed before successful inference**, with `Cannot read properties of null (reading 'add_bos_token')`. Its model-comparison results are **invalid** and excluded from the successful comparison. An attempted provider call is not a completed model inference.
- [Second archived run](../benchmarks/results/history/before-1792860044225.json): status FAILED during tokenizer setup, `Cannot read properties of undefined (reading 'tokenizer_class')`. It supplies no successful model result.
- [Final raw record](../benchmarks/results/raw.json): local loading was corrected; 11 actual inferences completed. The earlier archives were preserved unchanged, including their original status fields, so readers can inspect the failures and the corrected interpretation.

## Reproduction

```sh
node --test
node cli.mjs doctor --json
node cli.mjs run examples/invoice.json --json
```

Use [docs/cli.md](cli.md) for all 14 commands, task IDs, resume, scoped state, optional host commands and provider callbacks. Use [benchmarks/README.md](../benchmarks/README.md) for the exact offline model settings and benchmark environment variables. Reproduce the browser checks by serving the repository over localhost or opening the published HTTPS demo, running all supplied fixture contracts, then checking the four languages and negative cases. Browser filesystem/process/model capabilities remain explicitly outside the demo's support boundary.

Actual measured outputs take precedence over a headline, diagram or aggregate count. No external user count, universal accuracy, unmeasured token reduction or invented model result is claimed.
