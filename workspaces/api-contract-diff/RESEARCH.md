# Prior art and falsification

Checked 2026-10-24. Primary documentation and repository descriptions were read on the public web. Competitor code, plugins and packaged execution were not exhaustively tested. This is a bounded prior-art review, not a worldwide novelty search.

Problem: API 입력·출력 계약의 변경을 방향별로 판단하고 지원하지 않는 문법을 보류한다. The user's requirement is model-assisted task completion at zero additional spending. Existing tools are evidence that the task exists; they are not evidence of a measured unmet market or an interview.

## Closest alternatives

|Alternative|Existing capability|Conditions/burden|Candidate difference|Unconfirmed|
|---|---|---|---|---|
|[oasdiff](https://github.com/oasdiff/oasdiff)|OpenAPI differences and breaking-change analysis|Full OpenAPI workflow; much broader than this resource's explicit subset|Request/response variance for explicit endpoint schemas; unsupported composition is surfaced. A narrow dependency-free JSON/AI tool contract.|Exact parity and real-user benefit not measured.|
|[OpenAPI Specification](https://spec.openapis.org/oas/v3.1.1.html)|Established API request/response contract specification; defines the task, not an executable diff tool|Use a full specification validator for unsupported schemas; this resource supports a declared subset|Request/response variance for explicit endpoint schemas; unsupported composition is surfaced. A narrow dependency-free JSON/AI tool contract.|Exact parity and real-user benefit not measured.|
|Manual or composed workflow|A person follows the rules with a spreadsheet, scripts and tool documentation|Repeated setup, arithmetic, checks and trace keeping; actual human time savings have not been measured|Request/response variance for explicit endpoint schemas; unsupported composition is surfaced. A narrow dependency-free JSON/AI tool contract.|Exact parity and real-user benefit not measured.|

## Six attempts to disprove the idea

1. Same functionality already exists? Yes, underlying domain operations are established. An existing tool configured for this exact task may remove the need for a separate project.
2. Existing configuration enough? Plausibly; no exhaustive plugin/configuration execution was completed. Check the nearest tool before expanding this prototype.
3. Another name? Search terms include OpenAPI breaking change enum required request response oasdiff. Existing algorithm names appear in the method above.
4. Important user difference? Fewer runtime dependencies and a validated tool boundary are concrete; actual adoption and time savings remain unmeasured.
5. Added complexity? Structured JSON is a real setup cost. A browser example and exact field errors reduce it, but do not erase it.
6. Retraction evidence? An existing setup with the same access/contract or a failed invariant/performance comparison removes the claimed practical advantage.

Status: **practical-differentiation-hypothesis**. A working program is not proof of originality. No worldwide-first, official GitHub Stars probability or external-use claim.

The Stars contribution pattern reused here is runnable tools plus teaching (Rob Bos), accessible operations explanations (Barbara Forbes), and onboarding/participation (Ruth Ikegah); source links are in resource.json. These patterns do not license copying a Star's product. Add a small failing input as an issue or a regression test as a PR to contribute. No external contacts have been sent.

Next actions within the weekly budget: (1) add one independently sourced real task, (2) compare against the closest configured alternative, (3) improve the weakest observed model/tool case.
