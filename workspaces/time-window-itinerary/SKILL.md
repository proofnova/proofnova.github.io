---
name: time-window-itinerary
description: Time-window itinerary solver. 이동 시간·방문 가능 시간·체류·예산을 지키며 모든 방문을 마치는 최단 일정을 찾는다.
---

# Time-window itinerary solver

이동 시간·방문 가능 시간·체류·예산을 지키며 모든 방문을 마치는 최단 일정을 찾는다.

Use this when the supplied structured input matches [resource.json](resource.json). Read [example.json](example.json) for nested field names. Ask for missing domain inputs rather than inventing defaults not declared by the implementation.

1. Confirm required root fields: `stops`, `travel_minutes`, `start_minute`, `end_minute`, `budget`. Preserve source IDs and declared units.
2. Apply the task rule: Nearest-first routing can miss a closing window; search exhaustion cannot prove infeasibility.
3. Execute from this repository root: `node cli.mjs input.json`. Or import `execute` from `./run.mjs` and pass the JSON object. The output binds the result to an input SHA-256.
4. Inspect the complete findings/held/rejected/feasibility fields, not only the summary. Bounded exact time-window search with waiting, asymmetric travel and explicit optimality.
5. Recovery: Change the requested windows/travel data or budget when infeasible; do not fabricate live availability. After a corrected input, retry once. If the same failure repeats, retain the input and error as a checkpoint; do not claim completion.
6. Deliver the actual JSON, important findings, assumptions and unresolved constraints. This computes a proposal or audit; it does not execute external changes.

Run `npm test` before extending the resource. [cases.json](cases.json) has independently specified expected checks. Keep evaluation answers out of model prompts. See [RESEARCH.md](RESEARCH.md) for prior art, counterarguments and claim limits.
