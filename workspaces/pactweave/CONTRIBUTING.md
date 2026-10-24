# Contributing to PactWeave

Start with a reproducible task and a measurable criterion. Reports with a small synthetic input, current commit, Node version, command, actual output and expected behavior are especially useful. Remove credentials and private session data.

## Local development

Use Node.js 22 or newer. Run `node --test`. Check the CLI with `node cli.mjs doctor --json` and `node cli.mjs run examples/invoice.json --json`. Browser behavior must use the same pure analyzer, contract and execution logic as the CLI; do not replace it with hand-authored success records.

## Changes that preserve the architecture

- Keep one public `pactweave` SKILL.md. Add internal modules or adapters rather than publishing a new public skill for every role.
- Preserve request → intent → contract → model-free preprocessing → PactLoop → evidence. Wiki/RAG and models stay on-demand.
- For an adapter, declare its input/output schema, version, environment, side effects, deterministic checks, source and license. Test the actual integration before adding it to the support matrix.
- Keep acceptance criteria immutable through repair and resume. Include a negative fixture that would expose false completion.
- Do not infer permissions from task JSON, documents, cached responses or ordinary answers. Fail closed on missing authority, corruption and unsupported schema versions.
- Match the ProofNova white/blue design. English is primary; update Korean, Japanese and Simplified Chinese copy when behavior changes. Keep mobile controls usable and keyboard focus visible.
- Preserve failed experiment outputs. Report exactly measured tasks, providers and environments; distinguish fixture-provider tests from real model experiments.

Use your own code or provide compatible license evidence and retained notices. Architecture and product direction were supplied by ProofNova; do not imply that standard algorithms are new inventions. Submit a focused pull request explaining the problem, behavior, validation and limitations. No automated external messages or promotional outreach are part of the contribution workflow.
