---
name: billing-auditor
description: Proration and tier billing auditor. 기간 비례·구간 요금의 예상액을 계산하고 중복·누락·오청구 행을 찾는다.
---

# Proration and tier billing auditor

기간 비례·구간 요금의 예상액을 계산하고 중복·누락·오청구 행을 찾는다.

Use this when the supplied structured input matches [resource.json](resource.json). Read [example.json](example.json) for nested field names. Ask for missing domain inputs rather than inventing defaults not declared by the implementation.

1. Confirm required root fields: `period`, `subscriptions`, `statement`. Preserve source IDs and declared units.
2. Apply the task rule: Charge rounding is per declared line; a mismatched total cannot hide individual duplicate or missing charges.
3. Execute from this repository root: `node cli.mjs input.json`. Or import `execute` from `./run.mjs` and pass the JSON object. The output binds the result to an input SHA-256.
4. Inspect the complete findings/held/rejected/feasibility fields, not only the summary. UTC-day proration, exact tier arithmetic and statement-line reconciliation.
5. Recovery: Correct period boundaries, tiers or duplicate lines; day granularity is explicit and does not emulate a provider's second-level policy. After a corrected input, retry once. If the same failure repeats, retain the input and error as a checkpoint; do not claim completion.
6. Deliver the actual JSON, important findings, assumptions and unresolved constraints. This computes a proposal or audit; it does not execute external changes.

Run `npm test` before extending the resource. [cases.json](cases.json) has independently specified expected checks. Keep evaluation answers out of model prompts. See [RESEARCH.md](RESEARCH.md) for prior art, counterarguments and claim limits.
