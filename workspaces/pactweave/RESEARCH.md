# Problem, design hypothesis and counterarguments

## Problem evidence

The project starts from the user's explicit request: one installable skill should preserve intent and requirements, connect useful local tools, minimize unnecessary model/retrieval work, recover durable context and verify actual results. The user supplied the architecture illustration and product direction. This is direct product input, not an invented interview or evidence of broad market adoption.

Existing ProofNova task resources expose structured inputs, pure computation and executable fixtures across six domains. They are reusable first-party assets. Their existence does not demonstrate that a single orchestrator outperforms every configured alternative or that a small model can autonomously select every tool.

## Independent design contribution

PactWeave's practical differentiation hypothesis is the combination of a single skill entry, immutable acceptance contract, bounded execution/repair, optional knowledge/model branches and evidence-preserving local resumption. PactLoop, WeaveMesh and PactVault use this repository's own data model and interfaces. The underlying concepts—state machines, dependency graphs, atomic writes, hashing, BM25 and caching—are established methods, not new algorithm inventions.

The public design does not depend on a separately installed orchestration product, remote context server or paid model. Existing first-party task algorithms are reused under their actual license and identified in [THIRD_PARTY_NOTICES.md](THIRD_PARTY_NOTICES.md). A typed input adapter provides a specific capability; it does not imply arbitrary general autonomy.

## Alternatives and counterarguments

| Approach | What it already offers | Proposed difference to test | Counterargument |
| --- | --- | --- | --- |
| A local script with tests | Reproducible execution and assertions | One contract spanning analysis, execution, repair and resume | A short script may be simpler for one stable task |
| An agent host's existing task/session tools | Planning, tool calls and conversation state | Explicit immutable outcome and permission identities with saved failure evidence | A host may already provide equivalent behavior when configured |
| A generic cache plus document index | Fast response reuse and source retrieval | Freshness tied to current sources, permissions and acceptance contract | Existing integrations may already implement these same conditions |
| A manual checklist and task tools | Human judgment and flexible review | Structured blocked states and reusable evidence | Setup and maintenance may outweigh saved work |

This is a bounded conceptual comparison, not a claim that named competitors lack these features. Private investigation records are separate from product documentation. The project must withdraw or narrow a novelty claim if an inspected alternative provides the same user capability under the same conditions. No worldwide absence claim is made.

## Falsifiable validation plan

Hold the input and acceptance criteria constant for full, no-cache and no-retrieval runs. Save raw output, failed checks, iterations, elapsed time, actual provider calls, exact hits, coalesced calls and context-only matches. Include changed-source invalidation, permission changes, critical failures, interrupted work and resumed execution. A deliberately unmet critical condition must never produce PASS.

A cache fixture can establish avoided calls to its configured fixture provider; it cannot establish improved model reasoning. A model comparison must actually run the named model with the stated prompt, input, settings and equal task criteria. An unavailable arm is NOT_RUN. Token savings require real usage measurement. Timing is environment-specific and synthetic cases cannot establish external user impact.

See [benchmarks](benchmarks/) for saved experiment material and [tests](tests/) for executable assertions. Review the actual records for current measured status rather than inferring an accuracy figure from this plan. This document intentionally contains no unmeasured performance, token-saving, adoption or GitHub Stars probability claims.

## Continue, revise or stop

Continue only when contract preservation, meaningful task completion and practical benefit are demonstrated. Revise when the problem is valid but the chosen adapter or workflow adds unnecessary burden. Defer when required execution authority or evidence is missing. Stop or contribute to an existing implementation if the same capability already exists, maintenance exceeds the benefit or the core difference cannot be reproduced within available time and budget.

Open contribution remains part of the goal: reproducible examples, failure reports, documentation, maintainable interfaces and approachable participation. Product originality alone does not prove that others benefit; external usage and feedback remain separate evidence.
