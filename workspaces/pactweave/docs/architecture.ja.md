<a href="../README.md"><kbd>English</kbd></a> · <a href="../README.ko.md"><kbd>한국어</kbd></a> · <a href="../README.ja.md"><kbd>日本語 ✓</kbd></a> · <a href="../README.zh-CN.md"><kbd>简体中文</kbd></a>

# ProofNova PactWeave — 固定したアーキテクチャ

アーキテクチャと製品方針は ProofNova の設計です。PactLoop、WeaveMesh、PactVault は独立実装の内部モジュールであり、唯一の公開スキルは `pactweave` です。

![ProofNova PactWeave 日本語アーキテクチャ](../assets/architecture/pactweave-architecture-ja.png)

画像の言語： [English](../assets/architecture/pactweave-architecture-en.png) · [한국어](../assets/architecture/pactweave-architecture-ko.png) · [日本語](../assets/architecture/pactweave-architecture-ja.png) · [简体中文](../assets/architecture/pactweave-architecture-zh-CN.png)

依頼原文 → 意図分析 → タスク契約 → モデル不要の文脈前処理 → PactLoop の計画・実行・レビュー・修復 → 根拠と最終報告。Wiki、RAG、LLM Gateway は計画・実行・レビュー中の情報不足に応じて使う分岐です。全依頼に強制する初期段階ではありません。

**PactLoop** は上限付き反復、否定的レビュー、修復、再開にわたり原文と受け入れ契約を維持します。重要な失敗は平均点で相殺しません。

**WeaveMesh** は登録ハンドラーと依存ジョブを実行します。役割は実際に動いた関数を示し、架空の AI 従業員を演出しません。有用な独立作業だけを並列化し、共有書き込みは直列化します。

**PactVault** は Resources、Memory、Skills、Sessions を範囲付き ID、ハッシュ、復元機能とともにローカル保存します。セッション LLM 応答は長期知識とは物理的に分離します。

**LLM Gateway** が唯一の呼び出し境界です。有効な完全一致キャッシュだけが呼び出しを省けます。類似応答は信頼しない補助文脈であり、正解とはみなしません。出典・契約・権限の変更で無効化します。

## 機能ごとの対応範囲

| 機能                                             | ブラウザ                 | ローカル CLI                 |
| ------------------------------------------------ | ------------------------ | ---------------------------- |
| 規則による意図分析・型付き契約質問               | 対応                     | 対応                         |
| 登録済み ProofNova 純粋ツール                    | 対応                     | 対応                         |
| PactLoop・WeaveMesh の決定的ジョブ実行           | 対応                     | 対応                         |
| 出典付き Wiki/RAG 分割・BM25 検索                | メモリ内文書             | 永続ローカル文書             |
| セッション応答キャッシュ                         | メモリのみ、モデル未設定 | TTL・無効化対応の別領域      |
| PactVault 永続化・復元・保持期間・エクスポート   | ローカル CLI が必要      | 対応                         |
| 信頼したプロジェクトコマンド                     | ローカル CLI が必要      | 明示的ホスト権限が必要       |
| モデルプロバイダーのコールバック                 | デモには未設定           | Gateway 経由で任意設定       |
| 有料呼び出し・無制限通信・自動コード取得         | 無効                     | 既定で無効                   |
| 任意の自然文からのシェル実行・未対応の意味タスク | 非対応                   | 明示的能力がなければ BLOCKED |

## 制限と非対応

登録済み能力を接続する有界エンジンです。規則による分析は全依頼の人間並み理解を保証しません。ランタイム検出はあらゆる言語や運用基盤の完全自動化ではありません。信頼したコマンドは利用者権限でローカルコードを実行し、OS サンドボックスではありません。保存データは本製品では暗号化しません。ブラウザ実行だけでディスク復元や提供者連携を実証できず、合成テストだけで外部利用効果は証明できません。
