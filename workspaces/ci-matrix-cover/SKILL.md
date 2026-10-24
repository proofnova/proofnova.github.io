---
name: ci-matrix-cover
description: Minimum-cost CI matrix. 필수 환경·기능의 검증 범위를 전부 덮는 최소 비용 CI 작업 조합을 찾는다.
---

# Minimum-cost CI matrix

필수 환경·기능의 검증 범위를 전부 덮는 최소 비용 CI 작업 조합을 찾는다.

Use this when the supplied structured input matches [resource.json](resource.json). Read [example.json](example.json) for nested field names. Ask for missing domain inputs rather than inventing defaults not declared by the implementation.

1. Confirm required root fields: `requirements`, `jobs`. Preserve source IDs and declared units.
2. Apply the task rule: Every declared requirement must be covered; an over-budget optimum is not a feasible plan.
3. Execute from this repository root: `node cli.mjs input.json`. Or import `execute` from `./run.mjs` and pass the JSON object. The output binds the result to an input SHA-256.
4. Inspect the complete findings/held/rejected/feasibility fields, not only the summary. Exact bitmask dynamic programming rather than greedy cheapest-first selection.
5. Recovery: Add coverage for missing requirements or raise the explicit budget; never drop a required environment. After a corrected input, retry once. If the same failure repeats, retain the input and error as a checkpoint; do not claim completion.
6. Deliver the actual JSON, important findings, assumptions and unresolved constraints. This computes a proposal or audit; it does not execute external changes.

Run `npm test` before extending the resource. [cases.json](cases.json) has independently specified expected checks. Keep evaluation answers out of model prompts. See [RESEARCH.md](RESEARCH.md) for prior art, counterarguments and claim limits.
