---
name: restore-manifest
description: Restore manifest verifier. Verify backup bytes, chunks and whole-file hashes before declaring files ready to restore.
---

# Restore manifest verifier

Verify backup bytes, chunks and whole-file hashes before declaring files ready to restore.

Use this when the supplied structured input matches [resource.json](resource.json). Read [example.json](example.json) for nested field names. Ask for missing domain inputs rather than inventing defaults not declared by the implementation.

1. Confirm required root fields: `objects`, `files`. Preserve source IDs and declared units.
2. Apply the task rule: Every referenced chunk and the complete reconstructed file must match; paths cannot escape a restore root.
3. Execute from this repository root: `node cli.mjs input.json`. Or import `execute` from `./run.mjs` and pass the JSON object. The output binds the result to an input SHA-256.
4. Inspect the complete findings/held/rejected/feasibility fields, not only the summary. Canonical base64, per-chunk and reconstructed-file digest/size checks.
5. Recovery: Recover the exact missing/corrupt objects and re-check; a verified manifest alone is not a real restore. After a corrected input, retry once. If the same failure repeats, retain the input and error as a checkpoint; do not claim completion.
6. Deliver the actual JSON, important findings, assumptions and unresolved constraints. This computes a proposal or audit; it does not execute external changes.

Run `npm test` before extending the resource. [cases.json](cases.json) has independently specified expected checks. Keep evaluation answers out of model prompts. See [RESEARCH.md](RESEARCH.md) for prior art, counterarguments and claim limits.
