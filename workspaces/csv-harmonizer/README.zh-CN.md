# CSV harmonizer

<a href="README.md"><kbd>English</kbd></a> <a href="README.ko.md"><kbd>한국어</kbd></a> <a href="README.ja.md"><kbd>日本語</kbd></a> <a href="README.zh-CN.md"><kbd><strong>简体中文</strong></kbd></a>

**规范 CSV 列名、类型和重复标识，同时保留异常行与数据来源。**

用于 AI 辅助结构化工作的可执行资源，**无需运行依赖、API 密钥或账户**，可在本地运行。

[打开工作区](https://proofnova.github.io/csv-harmonizer/) · [浏览全部资源](https://proofnova.github.io/) · [任务契约](resource.json) · [已有方案与调研](RESEARCH.md)

## 快速开始

需要 Node.js 22 或更高版本，无需安装其他软件包。

```sh
git clone https://github.com/proofnova/csv-harmonizer.git
cd csv-harmonizer
npm test
node cli.mjs example.json
```

## 可以完成什么

规范 CSV 列名、类型和重复标识，同时保留异常行与数据来源。

### 必填输入字段

`sources` · `schema` · `keys`

字段名属于公开接口，切换显示语言时保持不变。完整输入请查看[示例文件](example.json)，正常与边界案例请查看[验证案例](cases.json)。

### 运行示例结果

```json
{
  "accepted": 2,
  "rejected": 1,
  "duplicates": 1,
  "conflicts": 0
}
```

这些数值来自随附合成示例的实际运行，不代表模型性能或真实用户数量。

## 连接模型

将执行模块中的 `execute` 函数注册为明确的工具，验证所选工具与输入，保存返回的 JSON 和输入摘要。资源由用户或集成代码选择，计算由确定性的代码完成。这并不证明模型能够自主推理。

[AI 技能说明](SKILL.md)介绍输入检查、结果解读和恢复步骤。浏览器通过有时间限制的工作线程运行相同计算，不会上传输入。

## 验证与恢复

随附测试检查两个合成业务案例、Node 与浏览器计算的一致性、原始输入保持不变及缺少必填输入时的拒绝行为。修改后请运行 `npm test`。

使用结果前，请检查保留、拒绝或不可行的事项。修正输入或已声明约束中的原因后重新运行，不要将尚未解决的事项视为成功。具体规则与单项限制请查看任务契约和技能说明。

## 范围与限制

底层算法和任务结果已有现成实现。实用差异仍是需要验证的假设，配置已有工具可能是更合适的选择。合成回归检查不能证明模型的一般专业能力或真实外部效果。已记录的模型比较仅覆盖六项合成任务，并未验证全部三十个资源。外部用户和官方 GitHub Stars 会员资格尚未确认。

## 参与贡献

请提供可复现的合成或脱敏失败输入、预期结果及 Node 版本，添加回归案例并运行测试。不要在公开示例中包含凭据或真实私密记录。

MIT 许可证 · Proofnova · 2026
