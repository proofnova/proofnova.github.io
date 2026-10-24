---
name: schema-drift
description: Schema drift analyst. 두 데이터 스냅샷의 필드 삭제·형식 변화·새 null·선택 필드를 분류한다.
---

# Schema drift analyst

두 데이터 스냅샷의 필드 삭제·형식 변화·새 null·선택 필드를 분류한다.

Use this when the supplied structured input matches [resource.json](resource.json). Read [example.json](example.json) for nested field names. Ask for missing domain inputs rather than inventing defaults not declared by the implementation.

1. Confirm required root fields: `before`, `after`. Preserve source IDs and declared units.
2. Apply the task rule: An empty sample cannot prove field removal; null and optionality are separate changes.
3. Execute from this repository root: `node cli.mjs input.json`. Or import `execute` from `./run.mjs` and pass the JSON object. The output binds the result to an input SHA-256.
4. Inspect the complete findings/held/rejected/feasibility fields, not only the summary. Observed type/presence sets with conservative compatibility findings.
5. Recovery: Inspect breaking fields, add a migration or expand evidence; an empty snapshot is inconclusive. After a corrected input, retry once. If the same failure repeats, retain the input and error as a checkpoint; do not claim completion.
6. Deliver the actual JSON, important findings, assumptions and unresolved constraints. This computes a proposal or audit; it does not execute external changes.

Run `npm test` before extending the resource. [cases.json](cases.json) has independently specified expected checks. Keep evaluation answers out of model prompts. See [RESEARCH.md](RESEARCH.md) for prior art, counterarguments and claim limits.
