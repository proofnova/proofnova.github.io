# CLI and host integration

English is the primary documentation language. All commands accept `--json` and emit one JSON document. Diagnostic failures use the documented exit codes. `node cli.mjs --help` lists the current flags.

```sh
node cli.mjs analyze examples/invoice.json --json
node cli.mjs plan examples/invoice.json --json
node cli.mjs run examples/invoice.json --json
node cli.mjs status --project quickstart --session invoice-demo --task TASK_ID --json
node cli.mjs verify --project quickstart --session invoice-demo --task TASK_ID --json
node cli.mjs resume --project quickstart --session invoice-demo --task TASK_ID --json
node cli.mjs explain --project quickstart --session invoice-demo --task TASK_ID --json
node cli.mjs stats --project quickstart --session invoice-demo --json
node cli.mjs export --project quickstart --json
```

Use the actual `task_id` from `run`. Repeating the same `run` identity is rejected to prevent duplicate work; use `resume` or an explicit new `--task another-id`. JSON can come from a file or `-` stdin. `analyze` also accepts quoted request text. Plain prose without a registered adapter, structured inputs and meaningful criteria produces questions rather than arbitrary commands.

Local state defaults to the user's `.pactweave` directory, outside the checkout. `--state-root PATH` selects another private location. Execution owns an exclusive project/session lease; a concurrent runner returns `STORE_CONFLICT`. After an abrupt process crash, inspect its private `runner-locks/PROJECT/SESSION.lock` and confirm no runner remains before manually removing that one lock. No automatic stale-lock deletion or process termination is performed during recovery.

Knowledge ingestion uses JSON `{ "id":"policy", "text":"Payments preserve remaining balances.", "source":"local:policy", "version":"1" }` with `wiki FILE` or `rag FILE`. Search uses `{ "query":"remaining balances", "limit":3 }`. `memory FILE` stores `{ "id":"decision", "value":{ "decision":"keep unallocated funds" } }`; `memory` lists, and `memory --delete --id decision` erases that scoped record. `cache --delete --project PROJECT --session SESSION` erases session responses. Cache counters are process-local; saved workflow stats retain execution counters.

`export` redacts sensitive fields by default. `--include-sensitive` explicitly opts into raw local export; inspect it before sharing. Deletion affects the documented live state/history/index/cache scope and cannot erase user-created external backups. Local records are not encrypted.

## Trusted local project tests

This optional CLI-only adapter supports explicitly selected Node test files. It does not infer shell commands from natural language. Create a host configuration `{ "runtime":"node", "files":["tests/example.test.mjs"], "timeout_ms":15000 }`. The task must explicitly permit `process.execute`, use adapter `project-test`, input `{}`, and criterion `result.exit_code equals 0`. Invoke:

```sh
node cli.mjs run task.json --command-config approved-tests.json --project-root /path/to/project --allow-process --json
```

Files and their hashes are bound to the approved adapter; changed test code invalidates saved verification. This executes trusted local code with a minimal environment and bounded output/time. It is not an operating-system sandbox, and arbitrary malicious test code remains outside the security boundary. Missing runtime support is reported rather than downloaded automatically.

## Optional model providers

The JavaScript `createNodeContext`/`run` API accepts trusted provider callbacks via `options.providers` and explicit `llmBudget`. A provider is `{kind:"local", call: async(payload)=>({response,usage})}`; network or paid providers additionally require their exact policy grants. Model assistance also needs a host-supplied `modelRequest` reason and a task contract permitting the model action. All callbacks pass through the Gateway; the model response is supplemental evidence/context and cannot change the immutable task, grant authority or become an executed task by itself. Installed host clients are not auto-detected or launched as model providers. The browser demo configures no model provider.
