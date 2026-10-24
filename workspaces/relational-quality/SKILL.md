---
name: relational-quality
description: Relational quality gate. 여러 표의 복합 키·필수 값·외래 키를 검사해 오류 행을 지정한다.
---

# Relational quality gate

여러 표의 복합 키·필수 값·외래 키를 검사해 오류 행을 지정한다.

Use this when the supplied structured input matches [resource.json](resource.json). Read [example.json](example.json) for nested field names. Ask for missing domain inputs rather than inventing defaults not declared by the implementation.

1. Confirm required root fields: `tables`. Preserve source IDs and declared units.
2. Apply the task rule: Partial-null foreign keys are not silently treated as a valid optional relation.
3. Execute from this repository root: `node cli.mjs input.json`. Or import `execute` from `./run.mjs` and pass the JSON object. The output binds the result to an input SHA-256.
4. Inspect the complete findings/held/rejected/feasibility fields, not only the summary. Compound-key indexes and explicit nullable foreign-key policies.
5. Recovery: Correct duplicated/empty keys before repairing orphan rows; keep source row indices. After a corrected input, retry once. If the same failure repeats, retain the input and error as a checkpoint; do not claim completion.
6. Deliver the actual JSON, important findings, assumptions and unresolved constraints. This computes a proposal or audit; it does not execute external changes.

Run `npm test` before extending the resource. [cases.json](cases.json) has independently specified expected checks. Keep evaluation answers out of model prompts. See [RESEARCH.md](RESEARCH.md) for prior art, counterarguments and claim limits.
