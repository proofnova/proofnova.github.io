# License audit

Scope: repository-authored engine/documentation, bundled first-party task adapters, architecture artwork and optional integration boundaries. This is a source inventory review, not legal advice or a comprehensive patent/trademark clearance.

| Material | Evidence and treatment | Limitation |
| --- | --- | --- |
| Independent PactWeave engine and documentation | Authored for this project; repository MIT LICENSE applies to project-authored software/documentation | Standard algorithms are not claimed as inventions |
| Existing ProofNova pure task adapters | Source LICENSE examined: MIT, Copyright (c) 2026 Proofnova; retain notices and exact source locks in the adapter inventory | Compare bundled hashes against the recorded commits; do not assume unrelated repositories share this license |
| Architecture illustration | User-provided source image, edited under user direction with new ProofNova module names; provenance saved with assets | Does not assert independent legal clearance of supplied original material |
| System fonts and CSS graphics | No font or icon library redistributed | Installed fonts retain their own system licenses |
| Optional host providers/runtimes | No mandatory client package bundled; explicit user-configured integration | Their licenses, data policies, fees and installation authority require separate review |

The user's architecture and requirements drove the independent data model and implementation. External feature investigation does not authorize copying code or applying MIT to an entire external project. If actual external code is added later, record its origin, revision, compatible license, required notices and exact redistributed files before release.

See [THIRD_PARTY_NOTICES.md](THIRD_PARTY_NOTICES.md) for the retained MIT permission text. [vendor/source-lock.json](vendor/source-lock.json) is the authoritative list of all 30 exact first-party source locks; [vendor/inventory.mjs](vendor/inventory.mjs) exposes runtime metadata. Every vendor adapter directory includes its retained MIT LICENSE. Tests must verify all advertised integrations before a release claims complete compatibility.

