# Proofnova

<a href="README.md"><kbd><strong>English</strong></kbd></a> <a href="README.ko.md"><kbd>한국어</kbd></a> <a href="README.ja.md"><kbd>日本語</kbd></a> <a href="README.zh-CN.md"><kbd>简体中文</kbd></a>

Thirty focused, independently runnable tools for AI-assisted work. Explore data, development, operations, business, research and learning tasks in your browser.

**[Open the resource library](https://proofnova.github.io/)**

## Use a resource

Choose a task, run a synthetic example, edit the structured input and inspect the result. Each tool has its own public repository, executable AI skill, CLI, tests and recovery guidance. Inputs stay in your browser; no account or API key is required.

## Run locally

Clone an individual resource, use Node.js 22+, and run `npm test` followed by `node cli.mjs example.json`. The download packs contain the same independently runnable source. To preview this showcase, serve the repository with a static HTTP server; opening modules directly with file URLs is unsupported.

```sh
git clone https://github.com/proofnova/csv-harmonizer.git
cd csv-harmonizer
npm test
node cli.mjs example.json
```

## Resource catalog

| Resource | Task |
| --- | --- |
| [CSV harmonizer](https://github.com/proofnova/csv-harmonizer) | Normalize CSV aliases, types and duplicate identities while preserving rejected rows and source provenance. |
| [Nested record flattener](https://github.com/proofnova/nested-record-flattener) | Flatten nested order and event arrays without losing parent context or row provenance. |
| [Time-series repair](https://github.com/proofnova/time-series-repair) | Align time-series records to an explicit grid and identify duplicates, missing intervals and ordering problems. |
| [Schema drift analyst](https://github.com/proofnova/schema-drift) | Compare data snapshots and classify removed fields, type changes, new nulls and optional properties. |
| [Relational quality gate](https://github.com/proofnova/relational-quality) | Check composite keys, required values and foreign-key relationships across related tables. |
| [Change impact planner](https://github.com/proofnova/change-impact) | Follow project ownership and transitive dependencies to identify tests affected by changed files. |
| [API contract diff](https://github.com/proofnova/api-contract-diff) | Classify directional API input and output contract changes, and hold unsupported syntax for review. |
| [Minimum-cost CI matrix](https://github.com/proofnova/ci-matrix-cover) | Find the lowest-cost CI job combination that covers every declared environment and feature requirement. |
| [Release propagation planner](https://github.com/proofnova/release-propagation) | Plan version and dependency-range changes through a workspace dependency graph. |
| [Exact patch preflight](https://github.com/proofnova/patch-preflight) | Validate and apply unified diffs against the exact original text in memory before changing files. |
| [Trace reconstruction](https://github.com/proofnova/trace-reconstruction) | Reconstruct distributed trace spans and identify missing parents, duplicates and invalid time boundaries. |
| [Multi-window SLO analyst](https://github.com/proofnova/slo-burn-rate) | Evaluate paired long and short error-budget windows while separating missing observations from healthy signals. |
| [Retry and reconciliation planner](https://github.com/proofnova/retry-reconciliation) | Turn dependency, attempt-limit, lease and ambiguous external-result records into explicit next actions. |
| [Capacity placement solver](https://github.com/proofnova/capacity-placement) | Assign workloads to minimum-cost nodes under CPU, memory, label and placement constraints. |
| [Restore manifest verifier](https://github.com/proofnova/restore-manifest) | Verify backup bytes, chunks and whole-file hashes before declaring files ready to restore. |
| [Invoice/payment reconciliation](https://github.com/proofnova/invoice-reconciliation) | Reconcile split, excess, duplicate and ambiguous payments while conserving invoice balances and unallocated money. |
| [Landed quote comparator](https://github.com/proofnova/procurement-quotes) | Compare landed purchase costs including pack sizes, minimum orders, tax, shipping, exchange rates and lead times. |
| [Inventory rebalance solver](https://github.com/proofnova/inventory-rebalance) | Rebalance surplus and shortage inventory across locations at minimum total cost under transfer limits. |
| [Coverage roster solver](https://github.com/proofnova/coverage-roster) | Assign required shifts while respecting availability, skills, workload limits and overlapping assignments. |
| [Proration and tier billing auditor](https://github.com/proofnova/billing-auditor) | Audit prorated and tiered charges, identifying duplicate, missing and incorrectly calculated billing rows. |
| [Citation grounding auditor](https://github.com/proofnova/citation-grounding) | Check quotations against document versions and line ranges, and expose structured conflicting claims. |
| [Anchored document redline](https://github.com/proofnova/document-redline) | Separate document additions, removals, moves and edits using stable section identities and word-level differences. |
| [Requirement evidence ledger](https://github.com/proofnova/requirement-evidence) | Link requirements and child conditions to tests and execution evidence for the current revision. |
| [Research screening ledger](https://github.com/proofnova/research-screening) | Deduplicate research records, apply explicit screening rules and separate missing data from review disagreements. |
| [Evidence-bound action ledger](https://github.com/proofnova/action-ledger) | Bind proposed meeting actions to source statements, owners and deadlines, holding ambiguous proposals for review. |
| [Prerequisite learning planner](https://github.com/proofnova/prerequisite-learning) | Find a minimum-time learning path from current mastery and prerequisite constraints to a declared goal. |
| [Assessment blueprint assembler](https://github.com/proofnova/assessment-blueprint) | Assemble assessments satisfying quality, topic, difficulty, timing, item-family and answer-distribution constraints. |
| [Keyboard workflow auditor](https://github.com/proofnova/keyboard-workflow) | Audit whether declared user tasks are reachable through keyboard controls, states and interaction paths. |
| [ICU localization gate](https://github.com/proofnova/localization-contract) | Validate nested ICU message arguments, selectors, plural branches and protected tokens across translations. |
| [Time-window itinerary solver](https://github.com/proofnova/time-window-itinerary) | Find a shortest complete itinerary under travel times, opening windows, visit durations and budget limits. |

## Languages

English is the default. The website and every README provide English, Korean, Japanese and Simplified Chinese navigation. JSON keys and code identifiers keep their original names.

## Evidence and limits

The public packs were installed into fresh folders and their included tests and CLI examples were executed. Browser checks, deterministic code tests, model experiments and external impact are separate evidence. The small-model study covers six synthetic tasks and 48 runs using a user-selected tool/input handle; it is not a model benchmark for all thirty tools. External adoption is not yet verified.

## Review Evidence Lab

Explore seventeen executable counterexamples about incomplete and stale review evidence.

[Review Evidence Lab](https://proofnova.github.io/review-evidence-lab/)

MIT · Proofnova · 2026

All thirty independently runnable resources are now published in separate GitHub repositories. The workspaces/ paths and downloadable packs provide additional access. publication.json records the verified repository links.
