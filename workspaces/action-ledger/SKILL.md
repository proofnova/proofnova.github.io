---
name: action-ledger
description: Evidence-bound action ledger. 회의에서 추출한 실행 제안을 발언·담당자·기한 근거에 묶고 모호한 제안을 보류한다.
---

# Evidence-bound action ledger

회의에서 추출한 실행 제안을 발언·담당자·기한 근거에 묶고 모호한 제안을 보류한다.

Use this when the supplied structured input matches [resource.json](resource.json). Read [example.json](example.json) for nested field names. Ask for missing domain inputs rather than inventing defaults not declared by the implementation.

1. Confirm required root fields: `turns`, `owners`, `timezone`, `proposals`. Preserve source IDs and declared units.
2. Apply the task rule: A plausible task without a matching quote or owner/date evidence remains held.
3. Execute from this repository root: `node cli.mjs input.json`. Or import `execute` from `./run.mjs` and pass the JSON object. The output binds the result to an input SHA-256.
4. Inspect the complete findings/held/rejected/feasibility fields, not only the summary. Exact task/due excerpts, explicit owner aliases and bounded relative-date resolution.
5. Recovery: Return unknown owners/dates for clarification; no invented commitment or outbound message is created. After a corrected input, retry once. If the same failure repeats, retain the input and error as a checkpoint; do not claim completion.
6. Deliver the actual JSON, important findings, assumptions and unresolved constraints. This computes a proposal or audit; it does not execute external changes.

Run `npm test` before extending the resource. [cases.json](cases.json) has independently specified expected checks. Keep evaluation answers out of model prompts. See [RESEARCH.md](RESEARCH.md) for prior art, counterarguments and claim limits.
