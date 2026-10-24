---
name: change-impact
description: Change impact planner. 변경 파일의 소유 프로젝트와 전이 의존성을 따라 실행할 테스트를 정한다.
---

# Change impact planner

변경 파일의 소유 프로젝트와 전이 의존성을 따라 실행할 테스트를 정한다.

Use this when the supplied structured input matches [resource.json](resource.json). Read [example.json](example.json) for nested field names. Ask for missing domain inputs rather than inventing defaults not declared by the implementation.

1. Confirm required root fields: `projects`, `changed_files`. Preserve source IDs and declared units.
2. Apply the task rule: A changed shared dependency reaches every dependent; unknown scope cannot produce an empty green plan.
3. Execute from this repository root: `node cli.mjs input.json`. Or import `execute` from `./run.mjs` and pass the JSON object. The output binds the result to an input SHA-256.
4. Inspect the complete findings/held/rejected/feasibility fields, not only the summary. Reverse dependency closure, topological order and conservative unknown-file fallback.
5. Recovery: Fix the ownership map; unknown files trigger the full plan instead of skipping tests. After a corrected input, retry once. If the same failure repeats, retain the input and error as a checkpoint; do not claim completion.
6. Deliver the actual JSON, important findings, assumptions and unresolved constraints. This computes a proposal or audit; it does not execute external changes.

Run `npm test` before extending the resource. [cases.json](cases.json) has independently specified expected checks. Keep evaluation answers out of model prompts. See [RESEARCH.md](RESEARCH.md) for prior art, counterarguments and claim limits.
