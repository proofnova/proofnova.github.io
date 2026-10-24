# Proofnova

<a href="README.md"><kbd>English</kbd></a> <a href="README.ko.md"><kbd>한국어</kbd></a> <a href="README.ja.md"><kbd><strong>日本語</strong></kbd></a> <a href="README.zh-CN.md"><kbd>简体中文</kbd></a>

AIによる実務を支援する、独立実行可能な三十のツールです。データ・開発・運用・業務・研究・学習の仕事をブラウザーで試せます。

**[リソース一覧を開く](https://proofnova.github.io/)**

## リソースの使い方

業務を選び、合成例を実行して入力を変更し、結果を確認します。各ツールには独立した公開リポジトリ、AIスキル、CLI、テスト、復旧案内があります。入力はブラウザー内に留まり、アカウントやAPIキーは不要です。

## ローカル実行

個別リソースを複製し、Node.js 22以上でテストとCLI例を実行してください。実行パックにも同じ独立実行可能なソースが含まれます。この紹介サイトのプレビューには静的HTTPサーバーを使用してください。ファイルURLから直接モジュールを開く方法は未対応です。

```sh
git clone https://github.com/proofnova/csv-harmonizer.git
cd csv-harmonizer
npm test
node cli.mjs example.json
```

## リソース一覧

| リソース | 業務 |
| --- | --- |
| [CSV harmonizer](https://github.com/proofnova/csv-harmonizer) | CSVの列名・型・重複を整理し、除外行と出典を保持します。 |
| [Nested record flattener](https://github.com/proofnova/nested-record-flattener) | 注文やイベントの入れ子配列を、親情報と行の出典を保って展開します。 |
| [Time-series repair](https://github.com/proofnova/time-series-repair) | 時刻のずれ・重複・欠測・順序の乱れを、指定した時間軸で確認します。 |
| [Schema drift analyst](https://github.com/proofnova/schema-drift) | データの削除項目・型変更・新しい空値・任意項目を分類します。 |
| [Relational quality gate](https://github.com/proofnova/relational-quality) | 複数の表の複合キー・必須値・外部キーを検査し、問題のある行を示します。 |
| [Change impact planner](https://github.com/proofnova/change-impact) | 変更ファイルの所属と推移的依存関係から、実行すべきテストを求めます。 |
| [API contract diff](https://github.com/proofnova/api-contract-diff) | APIの入力・出力の変更を方向別に評価し、未対応の構文は判断を保留します。 |
| [Minimum-cost CI matrix](https://github.com/proofnova/ci-matrix-cover) | 必要な環境と機能をすべて検証する、最小コストのCIジョブを選びます。 |
| [Release propagation planner](https://github.com/proofnova/release-propagation) | ワークスペースの依存関係に沿って、バージョンと依存範囲の変更を計画します。 |
| [Exact patch preflight](https://github.com/proofnova/patch-preflight) | ファイルを書き換える前に、unified diffを実際の原文と照合してメモリ上で適用します。 |
| [Trace reconstruction](https://github.com/proofnova/trace-reconstruction) | 分散トレースを整理し、親の欠落・重複・時間境界の不整合を検出します。 |
| [Multi-window SLO analyst](https://github.com/proofnova/slo-burn-rate) | 長短の観測窓でエラーバジェットを計算し、観測不足と正常を区別します。 |
| [Retry and reconciliation planner](https://github.com/proofnova/retry-reconciliation) | 依存関係・試行上限・リース・外部結果の曖昧さから、次の処理を明示します。 |
| [Capacity placement solver](https://github.com/proofnova/capacity-placement) | CPU・メモリ・ラベル・分散条件を満たす、最小コストの配置を求めます。 |
| [Restore manifest verifier](https://github.com/proofnova/restore-manifest) | バックアップの実バイト・分割片・全体ハッシュから、復元可能性を検証します。 |
| [Invoice/payment reconciliation](https://github.com/proofnova/invoice-reconciliation) | 分割・過入金・重複・曖昧な入金を照合し、残高と未配賦額を保持します。 |
| [Landed quote comparator](https://github.com/proofnova/procurement-quotes) | 梱包数・最低注文数・税・送料・為替・納期を含めた実際の購入費を比較します。 |
| [Inventory rebalance solver](https://github.com/proofnova/inventory-rebalance) | 移動上限を守りながら、拠点間の過剰・不足在庫を総コスト最小で再配置します。 |
| [Coverage roster solver](https://github.com/proofnova/coverage-roster) | 勤務可能時間・スキル・上限・重複を守り、必要な業務枠を割り当てます。 |
| [Proration and tier billing auditor](https://github.com/proofnova/billing-auditor) | 期間按分と段階料金を計算し、重複・欠落・誤計算のある請求行を特定します。 |
| [Citation grounding auditor](https://github.com/proofnova/citation-grounding) | 引用文・文書の版・行範囲を照合し、構造化された主張の矛盾を示します。 |
| [Anchored document redline](https://github.com/proofnova/document-redline) | 安定した節IDと単語の差分から、文書の追加・削除・移動・編集を区別します。 |
| [Requirement evidence ledger](https://github.com/proofnova/requirement-evidence) | 要求と子条件を、現在の版に対応するテストと実行証拠につなぎます。 |
| [Research screening ledger](https://github.com/proofnova/research-screening) | 研究記録の重複と選定規則を処理し、情報不足と判断の不一致を区別します。 |
| [Evidence-bound action ledger](https://github.com/proofnova/action-ledger) | 会議の実行提案を発言・担当者・期限の根拠につなぎ、曖昧な提案を保留します。 |
| [Prerequisite learning planner](https://github.com/proofnova/prerequisite-learning) | 現在の習得状況と前提条件から、目標に至る最短学習時間の経路を求めます。 |
| [Assessment blueprint assembler](https://github.com/proofnova/assessment-blueprint) | 品質・分野・難度・時間・同系列問題・正答分布を満たす試験を構成します。 |
| [Keyboard workflow auditor](https://github.com/proofnova/keyboard-workflow) | 状態・操作部品・キー操作の経路から、業務全体をキーボードで完了できるか検査します。 |
| [ICU localization gate](https://github.com/proofnova/localization-contract) | 翻訳文の入れ子ICU引数・選択・複数形・保護トークンの欠落を確認します。 |
| [Time-window itinerary solver](https://github.com/proofnova/time-window-itinerary) | 移動時間・訪問可能時間・滞在時間・予算を守り、全訪問を終える最短日程を求めます。 |

## 言語

既定の言語は英語です。サイトと各READMEは英語・韓国語・日本語・簡体字中国語に対応します。JSONのキーとコード識別子は変更しません。

## 根拠と限界

公開パックを新しいフォルダーに展開し、同梱テストとCLI例を実行しました。画面確認、決定的なコードの検証、モデル比較、外部への効果は別々の根拠です。小型モデル比較は利用者が道具と入力を選んだ合成業務六つ・四十八回の限定実験であり、三十ツール全体のモデル評価ではありません。外部での効果は未確認です。

## Review Evidence Lab

不完全または古い検討証拠を扱う十七の実行可能な反例を試せます。

[Review Evidence Lab](https://proofnova.github.io/review-evidence-lab/)

MITライセンス · Proofnova · 2026
