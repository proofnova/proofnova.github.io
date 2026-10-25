# ProofNova PactWeave design

Architecture and product direction designed by ProofNova. The public entry point is the single `pactweave` skill and CLI. PactLoop, WeaveMesh and PactVault are implementation modules, not separately published skills.

## Fixed execution sequence

Original request → request-intent-analyzer → requirements-contract → context-preprocessor → PactLoop → evidence and final report. The request's original bytes and digest remain invariant. Before every plan and repair, PactLoop validates the contract. Optional knowledge and Gateway operations occur inside planning, execution or review when needed; they never replace the first three stages.

![ProofNova PactWeave architecture](assets/architecture/pactweave-architecture-en.svg?v=redraw-20261025)

The illustration is a new native vector rendering of ProofNova's architecture, built from localized text and shared shapes by [the diagram generator](scripts/draw-architecture.mjs). [English](docs/architecture.md), [한국어](docs/architecture.ko.md), [日本語](docs/architecture.ja.md) and [简体中文](docs/architecture.zh-CN.md) descriptions explain the same architecture. The feature matrix governs actual runtime support when an illustration simplifies a detail.

## Task identity and evidence

The Task Contract includes the original request, interpreted intent, task type, confirmed constraints, assumptions, required inputs, acceptance criteria, verification methods, permitted/forbidden actions and unresolved questions. An executable task needs a nontrivial user outcome criterion. Engine-owned execution, digest, schema and output invariants remain active even when user criteria are missing.

Contract identity binds original request, confirmed constraints, acceptance criteria, adapter scope and permissions. Plan/input revisions are separate. A repair can revise inputs or planning within this contract; a changed goal or authority needs an explicit new contract revision and invalidates affected evidence and cache. Stable typed question IDs let ordinary answers fill missing data without granting permissions.

Single-task criteria address the adapter envelope, such as `result.summary.paid`. A job DAG exposes `jobs.<job-id>` envelopes. Criteria operate on actual output and critical checks cannot be averaged away. A report imported by a caller is untrusted. Verify or resume must re-evaluate authoritative output, digests, evidence and persisted budget counters.

## PactLoop and WeaveMesh

PactLoop states: ANALYZE → PLAN → EXECUTE → REVIEW → PASS / REPAIR / BLOCKED. Repairs re-enter planning with retained failures and unchanged acceptance criteria. Configured iteration, elapsed-time, model-call and repeated-error budgets prevent endless repetition. Cancellation and authority are rechecked around asynchronous boundaries.

WeaveMesh validates job IDs, dependency references and cycles. It serializes shared resource writes, skips dependents after failure, and parallelizes only useful independent work. Roles identify actual handlers executed. A Planner or Reviewer label does not imply a separate model ran or an independent human reviewed the result.

Registered tools declare version/source locks, required input, output contract, environment and side effects. Pure first-party tools are shared between Node and browser. A host process adapter is separate, explicit and permission-bound; runtime detection is not a claim of complete automation for that platform.

## Three different context mechanisms

| Mechanism          | Purpose                                         | Trust and lifetime                                                                         |
| ------------------ | ----------------------------------------------- | ------------------------------------------------------------------------------------------ |
| PactVault          | Resources, verified Memory, Skills and Sessions | Scoped local persistent records on Node; memory-only counterpart in browser                |
| Session LLM Cache  | Prior provider request/response reuse           | Separate local backend; exact identity, TTL, source/contract/permission freshness required |
| Wiki/RAG retrieval | Evidence for a current information gap          | Local chunking/BM25 and citations; retrieved text remains untrusted data                   |

Context preprocessing deduplicates supplemental records and bounds context size without discarding immutable requests, confirmed decisions or safety constraints. Similar past model responses can inform context but never become accepted output by string similarity. Exact avoided calls, coalesced in-flight calls and context-only matches are separate metrics.

PactVault uses private ignored state, schema versions, scoped identifiers, hashes, atomic replacement and recovery. Corruption fails closed. Deletion removes the documented live/history/index/cache scope and uses a tombstone so recovery cannot resurrect it. User-created external backups require separate deletion. Default export redacts sensitive fields, but sensitive raw-session export remains an explicit choice. Data is not encrypted by this implementation.

## Model and retrieval policy

Only the LLM Gateway invokes configured provider callbacks. The default model-call budget is zero; no model is required for deterministic execution. Paid providers, automatic downloads and unrestricted networking are disabled. Optional adapters must satisfy current trusted host grants and the immutable contract, including on a cached return.

Local Wiki/RAG retrieval requires an explicit needed query. The source manifest comes from stored content hashes, not model statements. Changed sources invalidate cached responses and stale retrieval evidence. Optional external adapters are not configured by the public browser demo.

## Honest support boundary

The public browser runs the shared pure engine, registered pure tools, in-memory context/cache and local supplied-document search. It does not execute subprocesses, recover disk state, invoke host-installed model clients or upload workflow inputs. Node provides persistence and optional trusted host extensions. Unsupported arbitrary requests return concrete missing prerequisites instead of an invented result.

The acceptance contract defines correctness for the task, not universal truth. Source accuracy requires versioned citations and comparison with the actual source. Standard state machines, hashing, BM25, caching and dependency scheduling have established prior art; this project does not claim their invention.
