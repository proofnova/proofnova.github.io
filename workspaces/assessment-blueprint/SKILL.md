---
name: assessment-blueprint
description: Assessment blueprint assembler. 문항 품질·영역·난도·시간·중복 계열·정답 분포를 함께 만족하는 시험을 구성한다.
---

# Assessment blueprint assembler

문항 품질·영역·난도·시간·중복 계열·정답 분포를 함께 만족하는 시험을 구성한다.

Use this when the supplied structured input matches [resource.json](resource.json). Read [example.json](example.json) for nested field names. Ask for missing domain inputs rather than inventing defaults not declared by the implementation.

1. Confirm required root fields: `items`, `blueprint`, `max_minutes`. Preserve source IDs and declared units.
2. Apply the task rule: A duplicated option or invalid answer index cannot enter a seemingly complete assessment.
3. Execute from this repository root: `node cli.mjs input.json`. Or import `execute` from `./run.mjs` and pass the JSON object. The output binds the result to an input SHA-256.
4. Inspect the complete findings/held/rejected/feasibility fields, not only the summary. Reject invalid questions before bounded selection and answer-balance optimization.
5. Recovery: Repair invalid items or supply missing blueprint cells; keep the selected item IDs for audit. After a corrected input, retry once. If the same failure repeats, retain the input and error as a checkpoint; do not claim completion.
6. Deliver the actual JSON, important findings, assumptions and unresolved constraints. This computes a proposal or audit; it does not execute external changes.

Run `npm test` before extending the resource. [cases.json](cases.json) has independently specified expected checks. Keep evaluation answers out of model prompts. See [RESEARCH.md](RESEARCH.md) for prior art, counterarguments and claim limits.
