---
name: release-propagation
description: Release propagation planner. 워크스페이스 패키지의 버전과 의존 범위 변경을 전이 관계에 맞춰 계획한다.
---

# Release propagation planner

워크스페이스 패키지의 버전과 의존 범위 변경을 전이 관계에 맞춰 계획한다.

Use this when the supplied structured input matches [resource.json](resource.json). Read [example.json](example.json) for nested field names. Ask for missing domain inputs rather than inventing defaults not declared by the implementation.

1. Confirm required root fields: `packages`, `changes`. Preserve source IDs and declared units.
2. Apply the task rule: Exact and caret/tilde ranges differ, including the special semantics of zero-major versions.
3. Execute from this repository root: `node cli.mjs input.json`. Or import `execute` from `./run.mjs` and pass the JSON object. The output binds the result to an input SHA-256.
4. Inspect the complete findings/held/rejected/feasibility fields, not only the summary. Stable SemVer range checks and topological propagation of required dependent patches.
5. Recovery: Resolve unsupported ranges manually; regenerate the plan after changing dependency policy. After a corrected input, retry once. If the same failure repeats, retain the input and error as a checkpoint; do not claim completion.
6. Deliver the actual JSON, important findings, assumptions and unresolved constraints. This computes a proposal or audit; it does not execute external changes.

Run `npm test` before extending the resource. [cases.json](cases.json) has independently specified expected checks. Keep evaluation answers out of model prompts. See [RESEARCH.md](RESEARCH.md) for prior art, counterarguments and claim limits.
