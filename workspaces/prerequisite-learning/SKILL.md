---
name: prerequisite-learning
description: Prerequisite learning planner. Find a minimum-time learning path from current mastery and prerequisite constraints to a declared goal.
---

# Prerequisite learning planner

Find a minimum-time learning path from current mastery and prerequisite constraints to a declared goal.

Use this when the supplied structured input matches [resource.json](resource.json). Read [example.json](example.json) for nested field names. Ask for missing domain inputs rather than inventing defaults not declared by the implementation.

1. Confirm required root fields: `concepts`, `activities`, `goals`, `budget_minutes`. Preserve source IDs and declared units.
2. Apply the task rule: A cheap activity cannot bypass an unmet prerequisite; already-mastered concepts need no repeat work.
3. Execute from this repository root: `node cli.mjs input.json`. Or import `execute` from `./run.mjs` and pass the JSON object. The output binds the result to an input SHA-256.
4. Inspect the complete findings/held/rejected/feasibility fields, not only the summary. Exact mastery-state dynamic programming over declared activity contracts.
5. Recovery: Add a missing prerequisite activity or revise the time budget; do not infer mastery from a plan. After a corrected input, retry once. If the same failure repeats, retain the input and error as a checkpoint; do not claim completion.
6. Deliver the actual JSON, important findings, assumptions and unresolved constraints. This computes a proposal or audit; it does not execute external changes.

Run `npm test` before extending the resource. [cases.json](cases.json) has independently specified expected checks. Keep evaluation answers out of model prompts. See [RESEARCH.md](RESEARCH.md) for prior art, counterarguments and claim limits.
