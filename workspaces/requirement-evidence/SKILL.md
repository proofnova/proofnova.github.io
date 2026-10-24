---
name: requirement-evidence
description: Requirement evidence ledger. 요구사항·하위 조건·테스트·현재 revision의 실행 근거를 연결해 미충족 항목을 찾는다.
---

# Requirement evidence ledger

요구사항·하위 조건·테스트·현재 revision의 실행 근거를 연결해 미충족 항목을 찾는다.

Use this when the supplied structured input matches [resource.json](resource.json). Read [example.json](example.json) for nested field names. Ask for missing domain inputs rather than inventing defaults not declared by the implementation.

1. Confirm required root fields: `requirements`, `now`, `max_age_seconds`, `revision`, `evidence`. Preserve source IDs and declared units.
2. Apply the task rule: Skipped, stale, future, conflicting or wrong-revision evidence cannot count as completion.
3. Execute from this repository root: `node cli.mjs input.json`. Or import `execute` from `./run.mjs` and pass the JSON object. The output binds the result to an input SHA-256.
4. Inspect the complete findings/held/rejected/feasibility fields, not only the summary. Dependency-aware coverage, latest-result conflict detection and freshness/revision checks.
5. Recovery: Run missing/stale tests on the current revision; a passed parent cannot cover a failed child. After a corrected input, retry once. If the same failure repeats, retain the input and error as a checkpoint; do not claim completion.
6. Deliver the actual JSON, important findings, assumptions and unresolved constraints. This computes a proposal or audit; it does not execute external changes.

Run `npm test` before extending the resource. [cases.json](cases.json) has independently specified expected checks. Keep evaluation answers out of model prompts. See [RESEARCH.md](RESEARCH.md) for prior art, counterarguments and claim limits.
