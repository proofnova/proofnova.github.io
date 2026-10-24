# Proofnova

<a href="README.md"><kbd>English</kbd></a> <a href="README.ko.md"><kbd>한국어</kbd></a> <a href="README.ja.md"><kbd>日本語</kbd></a> <a href="README.zh-CN.md"><kbd><strong>简体中文</strong></kbd></a>

三十个可独立运行的 AI 工作辅助工具，涵盖数据、开发、运维、业务、研究和学习，可直接在浏览器中试用。

**[打开资源库](https://proofnova.github.io/)**

## 使用资源

选择任务，运行合成示例，修改结构化输入并检查结果。每个工具都有独立公开仓库、AI 技能、CLI、测试和恢复说明。输入留在浏览器中，无需账户或 API 密钥。

## 本地运行

克隆单个资源，在 Node.js 22 或更高版本中运行测试与 CLI 示例。下载包包含相同的独立可运行源代码。预览本介绍站点时请使用静态 HTTP 服务器，不支持通过文件地址直接加载模块。

```sh
git clone https://github.com/proofnova/csv-harmonizer.git
cd csv-harmonizer
npm test
node cli.mjs example.json
```

## 资源目录

| 资源 | 任务 |
| --- | --- |
| [CSV harmonizer](https://github.com/proofnova/csv-harmonizer) | 规范 CSV 列名、类型和重复标识，同时保留异常行与数据来源。 |
| [Nested record flattener](https://github.com/proofnova/nested-record-flattener) | 展开订单和事件的嵌套数组，保留父级信息和行级来源。 |
| [Time-series repair](https://github.com/proofnova/time-series-repair) | 按明确的时间网格整理时序记录，识别重复、缺失和顺序异常。 |
| [Schema drift analyst](https://github.com/proofnova/schema-drift) | 比较数据快照，区分字段删除、类型变化、新增空值和可选属性。 |
| [Relational quality gate](https://github.com/proofnova/relational-quality) | 检查关联表中的复合键、必填值和外键关系，并定位异常行。 |
| [Change impact planner](https://github.com/proofnova/change-impact) | 沿项目归属和传递依赖关系，找出文件变更影响的测试。 |
| [API contract diff](https://github.com/proofnova/api-contract-diff) | 按输入与输出方向判断 API 契约变更，对不支持的语法保留人工复核。 |
| [Minimum-cost CI matrix](https://github.com/proofnova/ci-matrix-cover) | 选择覆盖全部已声明环境和功能要求的最低成本 CI 任务组合。 |
| [Release propagation planner](https://github.com/proofnova/release-propagation) | 沿工作区依赖图规划版本与依赖范围的传递变更。 |
| [Exact patch preflight](https://github.com/proofnova/patch-preflight) | 在修改文件前，针对准确原文验证 unified diff 并在内存中应用。 |
| [Trace reconstruction](https://github.com/proofnova/trace-reconstruction) | 重建分布式追踪，识别父节点缺失、重复记录和时间边界异常。 |
| [Multi-window SLO analyst](https://github.com/proofnova/slo-burn-rate) | 同时评估长短窗口的错误预算消耗，区分观测缺失与健康信号。 |
| [Retry and reconciliation planner](https://github.com/proofnova/retry-reconciliation) | 根据依赖、重试上限、租约和不明确的外部结果，确定下一步操作。 |
| [Capacity placement solver](https://github.com/proofnova/capacity-placement) | 在 CPU、内存、标签与分散约束下，寻找最低成本的工作负载部署方案。 |
| [Restore manifest verifier](https://github.com/proofnova/restore-manifest) | 验证备份字节、分片和完整文件哈希，确认文件是否可以恢复。 |
| [Invoice/payment reconciliation](https://github.com/proofnova/invoice-reconciliation) | 核对拆分、超额、重复和模糊付款，保持发票余额与未分配金额守恒。 |
| [Landed quote comparator](https://github.com/proofnova/procurement-quotes) | 计入包装数量、起订量、税费、运费、汇率和交期，比较实际采购成本。 |
| [Inventory rebalance solver](https://github.com/proofnova/inventory-rebalance) | 在调拨限制内，以最低总成本平衡多个地点的库存盈余和短缺。 |
| [Coverage roster solver](https://github.com/proofnova/coverage-roster) | 遵守可用时间、技能、工时上限和冲突限制，安排所需工作班次。 |
| [Proration and tier billing auditor](https://github.com/proofnova/billing-auditor) | 核算按比例和阶梯计费，识别重复、遗漏与计算错误的账单行。 |
| [Citation grounding auditor](https://github.com/proofnova/citation-grounding) | 核对引文、文档版本与行号范围，并揭示结构化主张中的冲突。 |
| [Anchored document redline](https://github.com/proofnova/document-redline) | 利用稳定的章节标识和词级差异，区分文档新增、删除、移动与修改。 |
| [Requirement evidence ledger](https://github.com/proofnova/requirement-evidence) | 将需求和子条件关联到当前修订版的测试与执行证据。 |
| [Research screening ledger](https://github.com/proofnova/research-screening) | 去重研究记录，应用明确的筛选规则，区分信息缺失和审查分歧。 |
| [Evidence-bound action ledger](https://github.com/proofnova/action-ledger) | 将会议行动建议绑定到原始发言、负责人和截止日期，对模糊建议保留复核。 |
| [Prerequisite learning planner](https://github.com/proofnova/prerequisite-learning) | 结合当前掌握程度与先修条件，寻找达成学习目标的最短时间路径。 |
| [Assessment blueprint assembler](https://github.com/proofnova/assessment-blueprint) | 组装满足质量、领域、难度、时长、题目家族和答案分布要求的试卷。 |
| [Keyboard workflow auditor](https://github.com/proofnova/keyboard-workflow) | 根据状态、控件和键盘交互路径，检查用户能否完成已声明的任务。 |
| [ICU localization gate](https://github.com/proofnova/localization-contract) | 检查翻译中的嵌套 ICU 参数、选择器、复数分支和保护标记。 |
| [Time-window itinerary solver](https://github.com/proofnova/time-window-itinerary) | 在交通时间、开放时段、停留时长和预算限制下，寻找完成全部访问的最短行程。 |

## 语言

默认语言为英语。网站和每份 README 均提供英语、韩语、日语与简体中文切换。JSON 字段名和代码标识符保持不变。

## 证据与限制

公开执行包已在全新文件夹中解压，并运行随附测试和 CLI 示例。浏览器检查、确定性代码测试、模型实验和外部效果属于不同证据。小模型比较仅涉及用户预先选择工具和输入的六项合成任务、四十八次运行，并非全部三十个工具的模型性能评估。外部使用效果尚未验证。

## 审查证据实验室

探索十七个关于不完整或过期审查证据的可运行反例。

[Review Evidence Lab](https://proofnova.github.io/review-evidence-lab/)

MIT 许可证 · Proofnova · 2026
