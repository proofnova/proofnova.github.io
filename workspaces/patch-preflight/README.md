# Exact patch preflight

<a href="README.md"><kbd><strong>English</strong></kbd></a> <a href="README.ko.md"><kbd>한국어</kbd></a> <a href="README.ja.md"><kbd>日本語</kbd></a> <a href="README.zh-CN.md"><kbd>简体中文</kbd></a>

**Validate and apply unified diffs against the exact original text in memory before changing files.**

An executable resource for AI-assisted structured work. Runs locally with **zero runtime dependencies, no API key and no account**.

[Open the workspace](https://proofnova.github.io/patch-preflight/) · [Explore all resources](https://proofnova.github.io/) · [Task contract](resource.json) · [Alternatives and research](RESEARCH.md)

## Quick start

Requires Node.js 22 or later. No package installation is needed.

```sh
git clone https://github.com/proofnova/patch-preflight.git
cd patch-preflight
npm test
node cli.mjs example.json
```

## What it does

Validate and apply unified diffs against the exact original text in memory before changing files.

**Implementation:** Exact hunk offsets/content/counts, path rejection and source/result fingerprints.

**Task-specific recovery:** Regenerate a hunk against current bytes; do not fuzz-match stale changes or write files automatically.

### Required input fields

`files` · `patch`

Field names are part of the API contract and stay unchanged in every language. See [example.json](example.json) for a complete input and [cases.json](cases.json) for normal and edge cases.

### Worked example

```json
{
  "files": 1,
  "hunks": 1
}
```

These values come from the included synthetic example. They are not model-performance or real-user adoption claims.

## Use it with a model

Import `execute` from `./run.mjs`, register it as a declared tool, validate the selected tool and input, and retain the returned JSON and input digest. The user or integration selects the resource. Deterministic code performs the calculation; this does not demonstrate autonomous model reasoning.

The [AI skill](SKILL.md) explains input checks, interpretation and recovery. The browser runs the same calculation locally in a bounded worker and does not upload the input.

## Validation and recovery

The bundled tests cover two synthetic task cases, Node/browser parity, input immutability and rejection of missing input. Run `npm test` after any change.

Inspect held, rejected or infeasible items before using the result. Correct the input or declared constraints and rerun; do not treat an unresolved case as success. Exact rules and task-specific limits are in the task contract and skill.

## Scope and limits

The underlying algorithms and task outcomes have established prior art. Practical differentiation is a hypothesis; an existing configured tool may already be the better choice. Synthetic regression checks do not establish general model expertise or real-world impact. The recorded model comparison covers six synthetic tasks and does not validate all thirty resources. No external users or GitHub Stars membership are implied.

## Contribute

Report a reproducible, synthetic or redacted failing input, the expected result and your Node version. Include a regression case and run `npm test`. Keep credentials and private records out of public examples.

MIT · Proofnova · 2026
