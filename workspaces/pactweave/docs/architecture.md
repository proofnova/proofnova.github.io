<a href="../README.md"><kbd>English ✓</kbd></a> · <a href="../README.ko.md"><kbd>한국어</kbd></a> · <a href="../README.ja.md"><kbd>日本語</kbd></a> · <a href="../README.zh-CN.md"><kbd>简体中文</kbd></a>

# ProofNova PactWeave — The fixed architecture

Architecture and product direction designed by ProofNova. PactLoop, WeaveMesh and PactVault are the independent internal implementations of that architecture. The only public skill is `pactweave`.

![ProofNova PactWeave architecture](../assets/architecture/pactweave-architecture-en.png)

Image editions: [English](../assets/architecture/pactweave-architecture-en.png) · [한국어](../assets/architecture/pactweave-architecture-ko.png) · [日本語](../assets/architecture/pactweave-architecture-ja.png) · [简体中文](../assets/architecture/pactweave-architecture-zh-CN.png)

Original request → intent analysis → Task Contract → model-free context preprocessing → PactLoop plan/execute/review/repair → evidence and final report. Wiki, RAG and the LLM Gateway branch from planning, execution or review only when an explicit information gap requires them. They are not compulsory steps before every task.

**PactLoop** keeps the original request and acceptance contract intact through bounded attempts, negative review, repair and resumption. A critical failed condition cannot be averaged away.

**WeaveMesh** executes registered handlers and dependency jobs. Roles describe real functions that ran, not fictional AI employees. Only independent useful work is parallelized; shared writes serialize.

**PactVault** stores Resources, Memory, Skills and Sessions locally with scoped identities, hashes and recovery. Session LLM responses are a physically separate cache, not long-term knowledge.

**LLM Gateway** is the sole provider boundary. Exact valid cache hits may avoid calls; similar prior answers are untrusted supplemental context, never automatically correct results. Source, contract and permission changes invalidate reuse.

## Support boundaries

| Capability                                                   | Browser                          | Local CLI                                                 |
| ------------------------------------------------------------ | -------------------------------- | --------------------------------------------------------- |
| Rule-based intent analysis and typed contract questions      | Available                        | Available                                                 |
| Registered ProofNova pure-tool execution                     | Available                        | Available                                                 |
| PactLoop and WeaveMesh deterministic role/job execution      | Available                        | Available                                                 |
| Local Wiki/RAG chunking and BM25 with citations              | In-memory documents              | Persistent local documents                                |
| Session response-cache management                            | Memory only; no configured model | Separate local cache with TTL and invalidation            |
| PactVault persistence, recovery, retention and export        | Local CLI Required               | Available                                                 |
| Trusted project commands                                     | Local CLI Required               | Explicit host permission required                         |
| Model-provider callbacks                                     | Not configured in this demo      | Optional configured provider through Gateway              |
| Paid calls, unrestricted network and automatic code download | Disabled                         | Disabled by default                                       |
| Arbitrary prose-to-shell or unsupported semantic tasks       | Unsupported                      | BLOCKED unless an explicit trusted capability is supplied |

## Limits and non-goals

This is a bounded workflow engine for registered capabilities. Rule-based analysis does not promise human-level interpretation of every request. Runtime detection does not imply full automation of every programming language or operations platform. Trusted project commands execute local code under your authority and are not an operating-system sandbox. Persisted local records are not encrypted by this project. Browser execution does not prove disk-recovery or provider integration. No external user impact has been established by synthetic tests alone.
