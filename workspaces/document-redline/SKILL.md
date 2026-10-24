---
name: document-redline
description: Anchored document redline. 문서의 추가·삭제·이동·수정을 안정된 절 ID와 단어 차이로 분리한다.
---

# Anchored document redline

문서의 추가·삭제·이동·수정을 안정된 절 ID와 단어 차이로 분리한다.

Use this when the supplied structured input matches [resource.json](resource.json). Read [example.json](example.json) for nested field names. Ask for missing domain inputs rather than inventing defaults not declared by the implementation.

1. Confirm required root fields: `before`, `after`. Preserve source IDs and declared units.
2. Apply the task rule: Inserting one section must not label every following section as moved.
3. Execute from this repository root: `node cli.mjs input.json`. Or import `execute` from `./run.mjs` and pass the JSON object. The output binds the result to an input SHA-256.
4. Inspect the complete findings/held/rejected/feasibility fields, not only the summary. LCS order anchors distinguish true moves from index shifts caused by insertion.
5. Recovery: Provide stable section IDs; split oversized comparisons rather than accepting a misleading partial diff. After a corrected input, retry once. If the same failure repeats, retain the input and error as a checkpoint; do not claim completion.
6. Deliver the actual JSON, important findings, assumptions and unresolved constraints. This computes a proposal or audit; it does not execute external changes.

Run `npm test` before extending the resource. [cases.json](cases.json) has independently specified expected checks. Keep evaluation answers out of model prompts. See [RESEARCH.md](RESEARCH.md) for prior art, counterarguments and claim limits.
