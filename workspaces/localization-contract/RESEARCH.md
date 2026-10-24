# Prior art and falsification

Checked 2026-10-24. Primary documentation and repository descriptions were read on the public web. Competitor code, plugins and packaged execution were not exhaustively tested. This is a bounded prior-art review, not a worldwide novelty search.

Problem: Validate nested ICU message arguments, selectors, plural branches and protected tokens across translations. The user's requirement is model-assisted task completion at zero additional spending. Existing tools are evidence that the task exists; they are not evidence of a measured unmet market or an interview.

## Closest alternatives

|Alternative|Existing capability|Conditions/burden|Candidate difference|Unconfirmed|
|---|---|---|---|---|
|[ICU MessageFormat](https://unicode-org.github.io/icu/userguide/format_parse/messages/)|Nested message arguments, selection and plurals|Established syntax and mature implementations|A bounded nested MessageFormat parser rather than a flat placeholder regex. A narrow dependency-free JSON/AI tool contract.|Exact parity and real-user benefit not measured.|
|[모두의도구 다국어 카탈로그 검사기](https://teck-tani.com/ko/localization-catalog-auditor)|Public page explicitly describes nested ICU variable, missing-key and plural validation|Direct functional overlap. Page read, implementation not executed here; novelty cannot be claimed for those checks|A bounded nested MessageFormat parser rather than a flat placeholder regex. A narrow dependency-free JSON/AI tool contract.|Exact parity and real-user benefit not measured.|
|[FormatJS](https://formatjs.github.io/docs/core-concepts/icu-syntax/)|ICU parsing and formatting, including nested selectors|Package/runtime integration; many validation needs can use existing parser tooling|A bounded nested MessageFormat parser rather than a flat placeholder regex. A narrow dependency-free JSON/AI tool contract.|Exact parity and real-user benefit not measured.|
|Manual or composed workflow|A person follows the rules with a spreadsheet, scripts and tool documentation|Repeated setup, arithmetic, checks and trace keeping; actual human time savings have not been measured|A bounded nested MessageFormat parser rather than a flat placeholder regex. A narrow dependency-free JSON/AI tool contract.|Exact parity and real-user benefit not measured.|

## Six attempts to disprove the idea

1. Same functionality already exists? Yes, underlying domain operations are established. An existing public catalog auditor describes overlapping nested ICU checks.
2. Existing configuration enough? Plausibly; no exhaustive plugin/configuration execution was completed. Check the nearest tool before expanding this prototype.
3. Another name? Search terms include ICU nested plural placeholder localization validation 번역 변수 검사. Existing algorithm names appear in the method above.
4. Important user difference? Fewer runtime dependencies and a validated tool boundary are concrete; actual adoption and time savings remain unmeasured.
5. Added complexity? Structured JSON is a real setup cost. A browser example and exact field errors reduce it, but do not erase it.
6. Retraction evidence? An existing setup with the same access/contract or a failed invariant/performance comparison removes the claimed practical advantage.

Status: **direct-overlap-on-core-checks**. A working program is not proof of originality. No worldwide-first, official GitHub Stars probability or external-use claim.

The Stars contribution pattern reused here is runnable tools plus teaching (Rob Bos), accessible operations explanations (Barbara Forbes), and onboarding/participation (Ruth Ikegah); source links are in resource.json. These patterns do not license copying a Star's product. Add a small failing input as an issue or a regression test as a PR to contribute. No external contacts have been sent.

Next actions within the weekly budget: (1) add one independently sourced real task, (2) compare against the closest configured alternative, (3) improve the weakest observed model/tool case.
