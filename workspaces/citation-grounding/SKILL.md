---
name: citation-grounding
description: Citation grounding auditor. 주장의 인용문·문서 버전·행 범위를 확인하고 구조화된 상충 주장을 드러낸다.
---

# Citation grounding auditor

주장의 인용문·문서 버전·행 범위를 확인하고 구조화된 상충 주장을 드러낸다.

Use this when the supplied structured input matches [resource.json](resource.json). Read [example.json](example.json) for nested field names. Ask for missing domain inputs rather than inventing defaults not declared by the implementation.

1. Confirm required root fields: `documents`, `claims`. Preserve source IDs and declared units.
2. Apply the task rule: A real quote is not automatically semantic support, and a changed source cannot reuse an old digest.
3. Execute from this repository root: `node cli.mjs input.json`. Or import `execute` from `./run.mjs` and pass the JSON object. The output binds the result to an input SHA-256.
4. Inspect the complete findings/held/rejected/feasibility fields, not only the summary. Exact excerpt location and optional document hash binding without pretending to judge meaning.
5. Recovery: Locate the actual source excerpt or repair its range/version; send semantic support questions to domain review. After a corrected input, retry once. If the same failure repeats, retain the input and error as a checkpoint; do not claim completion.
6. Deliver the actual JSON, important findings, assumptions and unresolved constraints. This computes a proposal or audit; it does not execute external changes.

Run `npm test` before extending the resource. [cases.json](cases.json) has independently specified expected checks. Keep evaluation answers out of model prompts. See [RESEARCH.md](RESEARCH.md) for prior art, counterarguments and claim limits.
