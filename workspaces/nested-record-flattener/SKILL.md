---
name: nested-record-flattener
description: Nested record flattener. 주문·이벤트의 중첩 배열을 부모 정보와 행 출처를 보존해 평탄화한다.
---

# Nested record flattener

주문·이벤트의 중첩 배열을 부모 정보와 행 출처를 보존해 평탄화한다.

Use this when the supplied structured input matches [resource.json](resource.json). Read [example.json](example.json) for nested field names. Ask for missing domain inputs rather than inventing defaults not declared by the implementation.

1. Confirm required root fields: `records`, `expand`, `columns`. Preserve source IDs and declared units.
2. Apply the task rule: Missing arrays and required fields stay visible; output retains record and child indices.
3. Execute from this repository root: `node cli.mjs input.json`. Or import `execute` from `./run.mjs` and pass the JSON object. The output binds the result to an input SHA-256.
4. Inspect the complete findings/held/rejected/feasibility fields, not only the summary. Expand one declared array with parent/child paths; avoid accidental Cartesian products.
5. Recovery: Correct missing expansion/required paths; re-run the quarantined source record. After a corrected input, retry once. If the same failure repeats, retain the input and error as a checkpoint; do not claim completion.
6. Deliver the actual JSON, important findings, assumptions and unresolved constraints. This computes a proposal or audit; it does not execute external changes.

Run `npm test` before extending the resource. [cases.json](cases.json) has independently specified expected checks. Keep evaluation answers out of model prompts. See [RESEARCH.md](RESEARCH.md) for prior art, counterarguments and claim limits.
