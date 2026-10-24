---
name: inventory-rebalance
description: Inventory rebalance solver. 여러 거점의 초과·부족 재고를 이동 한도 안에서 전역 최소 비용으로 재배치한다.
---

# Inventory rebalance solver

여러 거점의 초과·부족 재고를 이동 한도 안에서 전역 최소 비용으로 재배치한다.

Use this when the supplied structured input matches [resource.json](resource.json). Read [example.json](example.json) for nested field names. Ask for missing domain inputs rather than inventing defaults not declared by the implementation.

1. Confirm required root fields: `stocks`, `routes`. Preserve source IDs and declared units.
2. Apply the task rule: A greedy route choice can be globally worse; supply, demand and route capacities must be conserved.
3. Execute from this repository root: `node cli.mjs input.json`. Or import `execute` from `./run.mjs` and pass the JSON object. The output binds the result to an input SHA-256.
4. Inspect the complete findings/held/rejected/feasibility fields, not only the summary. Residual-network min-cost flow that can undo a locally cheap assignment.
5. Recovery: Inspect unresolved shortages or add a route/capacity; no actual order or transfer is submitted. After a corrected input, retry once. If the same failure repeats, retain the input and error as a checkpoint; do not claim completion.
6. Deliver the actual JSON, important findings, assumptions and unresolved constraints. This computes a proposal or audit; it does not execute external changes.

Run `npm test` before extending the resource. [cases.json](cases.json) has independently specified expected checks. Keep evaluation answers out of model prompts. See [RESEARCH.md](RESEARCH.md) for prior art, counterarguments and claim limits.
