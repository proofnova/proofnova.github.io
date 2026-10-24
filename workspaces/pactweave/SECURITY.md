# Security policy

PactWeave defaults to local execution, restricted network, disabled paid providers, disabled automatic downloads and a zero model-call budget. Task text, answers, documents and cached responses are data, not permission grants.

The host supplies trusted permissions separately from task JSON. The contract further restricts those permissions; forbidden actions take precedence. Approval for a narrow action does not authorize unrelated remote publication, credential access, destructive cleanup, external transfer or production modification.

## Trust boundaries

- Register only reviewed adapters. An adapter or provider callback is executable host code and must be trusted before registration.
- Trusted project commands run local code under your OS user. Explicit command/argument restrictions are not a full sandbox. Review test files and project dependencies before granting execution.
- Retrieved content may contain prompt injection. Treat it as quoted evidence with source/version metadata, never as an instruction to run a command or change policy.
- Keep private state, sessions, cache, credentials and backups out of Git. The local store is not encrypted. Review exported files even when key redaction is enabled.
- Exact response reuse still requires current authority and source freshness. Never reuse a cached permission decision as present authorization.
- The browser demo fetches static assets, uses memory-only workflow state and stores a language preference. It has no configured external model, telemetry or workflow upload endpoint.

## Reporting a vulnerability

Use the repository's **Security → Report a vulnerability** feature if GitHub private vulnerability reporting is enabled. Do not put credentials, private sessions or exploitable user data in a public issue. If private reporting is unavailable, open only a minimal non-sensitive coordination issue requesting a secure reporting channel; no private email address is assumed by this project.

Include the affected commit, runtime, minimal synthetic reproduction, expected boundary, observed behavior and impact. No response-time guarantee or audit certification is claimed. Local tests and negative fixtures do not replace an independent security assessment.
