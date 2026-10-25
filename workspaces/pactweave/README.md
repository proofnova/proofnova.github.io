<a href="README.md"><kbd>English ✓</kbd></a> · <a href="README.ko.md"><kbd>한국어</kbd></a> · <a href="README.ja.md"><kbd>日本語</kbd></a> · <a href="README.zh-CN.md"><kbd>简体中文</kbd></a>

# ProofNova PactWeave

**One Skill. Every Workflow. Verified.**

One installable skill for understanding a request, binding an execution contract, running registered tools and checking the result with evidence. A model is optional. Unknown tasks remain explicitly blocked.

Architecture and product direction designed by ProofNova. PactLoop, WeaveMesh and PactVault are the independent internal implementations of that architecture. The only public skill is `pactweave`.

![ProofNova PactWeave architecture](assets/architecture/pactweave-architecture-en.svg?v=redraw-20261025)

Image editions: [English](assets/architecture/pactweave-architecture-en.svg?v=redraw-20261025) · [한국어](assets/architecture/pactweave-architecture-ko.svg?v=redraw-20261025) · [日本語](assets/architecture/pactweave-architecture-ja.svg?v=redraw-20261025) · [简体中文](assets/architecture/pactweave-architecture-zh-CN.svg?v=redraw-20261025)

## Quick start

Node.js 22 or newer. No mandatory runtime dependencies, account, API key, paid provider or automatic download. The repository clone is an explicit user action. These commands use local synthetic inputs; they do not send payments or contact external services.

```sh
git clone https://github.com/proofnova/proofnova-pactweave.git
cd proofnova-pactweave
node cli.mjs doctor --json
node cli.mjs analyze examples/invoice.json --json
node cli.mjs run examples/invoice.json --json
node --test
```

The invoice example uses a USD 10.00 invoice and a USD 12.00 payment. Its contract requires `result.summary.paid` to equal `1`. Inspect the actual output: the engine must verify that criterion, retain unallocated money, preserve the original request and include execution/review evidence. A missing task or acceptance criterion returns `BLOCKED`; an unmet criterion must never be reported as a completed task.

## Install the one skill

Copy this repository into your agent’s supported skill location, preserving [SKILL.md](SKILL.md) and its relative source files. Use the Agent Skills-compatible loader provided by your host. CLI use does not depend on an agent host. For a local executable, `npm link` registers the `pactweave` bin from this checkout; it is optional and is not a registry-package download.

The installed skill folder must be named **`pactweave`**, with `pactweave/SKILL.md` at its root and all relative source files preserved. The repository name remains `proofnova-pactweave`; rename the checkout folder when placing it inside your host’s supported skills directory. Do not nest an extra `proofnova-pactweave` directory between the skill folder and SKILL.md.

## Try the real browser engine

[Open the demo](https://proofnova.github.io/workspaces/pactweave/). Choose the invoice, missing-task or failed-criterion sample. Inspect the request, contract, plan, cache record, optional knowledge queries, model-call record, PactLoop events, evidence and final JSON. Change the input and old evidence/downloads are invalidated. Inputs remain in page memory; the language preference alone is persisted. Static demo assets are fetched normally, but entered workflow data is not uploaded.

## Support boundaries

| Capability                                                   | Browser                          | Local CLI                                                 |
| ------------------------------------------------------------ | -------------------------------- | --------------------------------------------------------- |
| Rule-based intent analysis and typed contract questions      | Available                        | Available                                                 |
| Registered ProofNova pure-tool execution                     | Available                        | Available                                                 |
| PactLoop and WeaveMesh deterministic role/job execution      | Available                        | Available                                                 |
| Local Wiki/RAG chunking and BM25 with citations              | In-memory documents              | Persistent local documents                                |
| Session response-cache management                            | Memory only; no configured model | Separate local cache with TTL and invalidation            |
| PactVault persistence, recovery, retention and export        | Local CLI Required               | Available                                                 |
| Trusted project commands                                     | Local CLI Required               | Explicit host permission required                         |
| Model-provider callbacks                                     | Not configured in this demo      | Optional configured provider through Gateway              |
| Paid calls, unrestricted network and automatic code download | Disabled                         | Disabled by default                                       |
| Arbitrary prose-to-shell or unsupported semantic tasks       | Unsupported                      | BLOCKED unless an explicit trusted capability is supplied |

## The fixed architecture

Original request → intent analysis → Task Contract → model-free context preprocessing → PactLoop plan/execute/review/repair → evidence and final report. Wiki, RAG and the LLM Gateway branch from planning, execution or review only when an explicit information gap requires them. They are not compulsory steps before every task.

**PactLoop** keeps the original request and acceptance contract intact through bounded attempts, negative review, repair and resumption. A critical failed condition cannot be averaged away.

**WeaveMesh** executes registered handlers and dependency jobs. Roles describe real functions that ran, not fictional AI employees. Only independent useful work is parallelized; shared writes serialize.

**PactVault** stores Resources, Memory, Skills and Sessions locally with scoped identities, hashes and recovery. Session LLM responses are a physically separate cache, not long-term knowledge.

**LLM Gateway** is the sole provider boundary. Exact valid cache hits may avoid calls; similar prior answers are untrusted supplemental context, never automatically correct results. Source, contract and permission changes invalidate reuse.

## A measurable task, not a success slogan

The default demo explicitly names `invoice-reconciliation`, supplies structured invoices/payments and defines a critical criterion. The engine also enforces its own execution, digest, schema and output invariants. Empty criteria do not disable those checks. Repair may change adapter inputs or a plan inside the same contract; it cannot rewrite the goal or grant authority.

## CLI surface

One entry point: `analyze`, `plan`, `run`, `resume`, `status`, `verify`, `explain`, `cache`, `wiki`, `rag`, `memory`, `doctor`, `stats`, `export`. Use `node cli.mjs --help` for the current argument contract. Commands support machine-readable JSON. Exit codes distinguish success (0), execution/validation failure (1), missing prerequisites (2), approval required (3), and exhausted/cancelled budgets (4).

Full argument examples, task IDs, resume and optional host setup: [CLI guide](docs/cli.md).

## Measured results and reproduction

Measured on Windows / Node.js 24.13.1: **142/142 automated tests passed**, and the real browser UI executed **60/60 normal/edge fixtures across all 30 adapters**. Invoice execution passed in English, Korean, Japanese and Simplified Chinese. Missing-task and failed-criterion samples correctly returned BLOCKED; malformed JSON returned ERROR and disabled download. The checked 390 × 844 mobile view had no horizontal overflow or missing form labels. All **14 CLI command surfaces** were exercised with parsed JSON. The fresh extracted release archive also passed the invoice workflow and all 142 tests.

The [raw benchmark](benchmarks/results/raw.json) records **16/16 expected workflow behaviors** (14 PASS and two intentional BLOCKED outcomes). On six developer-worked domain examples, registered executors completed **6/6**, while **SmolLM2-135M-Instruct q4** on CPU met **0/6 strict flat-JSON checks** under a 64-new-token cap. These are existing development fixtures, not unseen tasks or a measure of general reasoning; many model outputs were prose or truncated. The task explicitly selected the tool and supplied structured input.

The actual cache experiment made **3 calls without cache versus 2 with cache**, with one exact hit and one avoided call. A source-version change forced a new inference. All responses in this cache-formatting task failed the answer check: **cache reuse did not improve answer quality**. The final run completed 11 real inferences. Two earlier failed attempts remain archived; the first's original EXECUTED label was invalid because all 12 provider attempts failed before inference. No token savings were measured.

See the [verification record](docs/verification.md), [benchmark method and failure history](benchmarks/README.md), [CLI guide](docs/cli.md), [test log](docs/evidence/test-run-02.txt) and [browser evidence](docs/evidence/browser-adapters.json). Run `node --test` and reproduce with the recorded settings. These local synthetic measurements do not establish universal accuracy or external adoption.

## Limits and non-goals

This is a bounded workflow engine for registered capabilities. Rule-based analysis does not promise human-level interpretation of every request. Runtime detection does not imply full automation of every programming language or operations platform. Trusted project commands execute local code under your authority and are not an operating-system sandbox. Persisted local records are not encrypted by this project. Browser execution does not prove disk-recovery or provider integration. No external user impact has been established by synthetic tests alone.

## Safety and data

Task JSON, ordinary answers, retrieved documents and cached responses cannot grant permissions. Host policy intersects the contract’s permitted actions; forbidden actions win. Remote push, destructive changes, credential access, data transfer, paid services and production changes need explicit scoped authority. Keep `.pactweave/`, raw sessions, backups and credentials out of Git. Export redaction is not a substitute for reviewing a file before sharing it.

## Project notes

[Architecture](docs/architecture.md) · [Design](DESIGN.md) · [Research and counterarguments](RESEARCH.md) · [License audit](LICENSE_AUDIT.md) · [Notices](THIRD_PARTY_NOTICES.md) · [Security](SECURITY.md) · [Contributing](CONTRIBUTING.md) · [Changelog](CHANGELOG.md)

The objective is useful, reproducible open-source contribution: working tools, clear docs, maintainable interfaces and honest evidence. Novelty and a promising demo alone do not establish impact.
