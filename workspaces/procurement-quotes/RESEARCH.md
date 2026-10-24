# Prior art and falsification

Checked 2026-10-24. Primary documentation and repository descriptions were read on the public web. Competitor code, plugins and packaged execution were not exhaustively tested. This is a bounded prior-art review, not a worldwide novelty search.

Problem: 묶음 수량·최소 주문·세금·배송·환율·납기를 반영한 실구매 비용을 비교한다. The user's requirement is model-assisted task completion at zero additional spending. Existing tools are evidence that the task exists; they are not evidence of a measured unmet market or an interview.

## Closest alternatives

|Alternative|Existing capability|Conditions/burden|Candidate difference|Unconfirmed|
|---|---|---|---|---|
|[ERPNext payment reconciliation](https://docs.frappe.io/erpnext/payment-reconciliation)|Payment allocation and accounting workflow|ERP instance and financial configuration; other ERP modules not fully reviewed|Rational FX and rounding with feasibility and Pareto dominance checks. A narrow dependency-free JSON/AI tool contract.|Exact parity and real-user benefit not measured.|
|[셀노믹 공급처 단가 비교](https://sellnomic.kr/tools/supplier-compare)|Public calculator compares pack price, shipping and total purchase outlay; direct overlap on landed-cost comparison|Page reviewed; tax/FX and exact input parity not fully executed|Rational FX and rounding with feasibility and Pareto dominance checks. A narrow dependency-free JSON/AI tool contract.|Exact parity and real-user benefit not measured.|
|[Google OR-Tools](https://developers.google.com/optimization)|Scheduling, constraint optimization, flows and routing|Solver installation and problem modeling; broader and more scalable than bounded in-browser search|Rational FX and rounding with feasibility and Pareto dominance checks. A narrow dependency-free JSON/AI tool contract.|Exact parity and real-user benefit not measured.|
|Manual or composed workflow|A person follows the rules with a spreadsheet, scripts and tool documentation|Repeated setup, arithmetic, checks and trace keeping; actual human time savings have not been measured|Rational FX and rounding with feasibility and Pareto dominance checks. A narrow dependency-free JSON/AI tool contract.|Exact parity and real-user benefit not measured.|

## Six attempts to disprove the idea

1. Same functionality already exists? Yes, underlying domain operations are established. An existing tool configured for this exact task may remove the need for a separate project.
2. Existing configuration enough? Plausibly; no exhaustive plugin/configuration execution was completed. Check the nearest tool before expanding this prototype.
3. Another name? Search terms include supplier quote pack minimum shipping tax landed cost comparison 구매 견적. Existing algorithm names appear in the method above.
4. Important user difference? Fewer runtime dependencies and a validated tool boundary are concrete; actual adoption and time savings remain unmeasured.
5. Added complexity? Structured JSON is a real setup cost. A browser example and exact field errors reduce it, but do not erase it.
6. Retraction evidence? An existing setup with the same access/contract or a failed invariant/performance comparison removes the claimed practical advantage.

Status: **practical-differentiation-hypothesis**. A working program is not proof of originality. No worldwide-first, official GitHub Stars probability or external-use claim.

The Stars contribution pattern reused here is runnable tools plus teaching (Rob Bos), accessible operations explanations (Barbara Forbes), and onboarding/participation (Ruth Ikegah); source links are in resource.json. These patterns do not license copying a Star's product. Add a small failing input as an issue or a regression test as a PR to contribute. No external contacts have been sent.

Next actions within the weekly budget: (1) add one independently sourced real task, (2) compare against the closest configured alternative, (3) improve the weakest observed model/tool case.
