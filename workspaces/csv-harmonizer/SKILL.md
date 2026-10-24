---
name: csv-harmonizer
description: CSV harmonizer. Normalize CSV aliases, types and duplicate identities while preserving rejected rows and source provenance.
---

# CSV harmonizer

Normalize CSV aliases, types and duplicate identities while preserving rejected rows and source provenance.

Use this when the supplied structured input matches [resource.json](resource.json). Read [example.json](example.json) for nested field names. Ask for missing domain inputs rather than inventing defaults not declared by the implementation.

1. Confirm required root fields: `sources`, `schema`, `keys`. Preserve source IDs and declared units.
2. Apply the task rule: Ambiguous headers, malformed quoting and conflicting identities must not silently merge.
3. Execute from this repository root: `node cli.mjs input.json`. Or import `execute` from `./run.mjs` and pass the JSON object. The output binds the result to an input SHA-256.
4. Inspect the complete findings/held/rejected/feasibility fields, not only the summary. Explicit aliases, exact decimal coercion and key-level conflict quarantine.
5. Recovery: Resolve ambiguous aliases; correct only rejected rows; do not overwrite conflicting records. After a corrected input, retry once. If the same failure repeats, retain the input and error as a checkpoint; do not claim completion.
6. Deliver the actual JSON, important findings, assumptions and unresolved constraints. This computes a proposal or audit; it does not execute external changes.

Run `npm test` before extending the resource. [cases.json](cases.json) has independently specified expected checks. Keep evaluation answers out of model prompts. See [RESEARCH.md](RESEARCH.md) for prior art, counterarguments and claim limits.
