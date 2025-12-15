# データ収集スケジューラ ドキュメント

このディレクトリには、データ収集スケジューラシステムの技術ドキュメントが含まれています。

## 📚 ドキュメント一覧

### 1. [アーキテクチャ図](./architecture.md)

システムの静的構成とコンポーネント詳細

**内容:**

- システム構成図（Mermaid）
- データフロー図
- タイミングチャート
- 各コンポーネントの詳細仕様

### 2. [シーケンス図](./sequence-diagram.md)

AI 社員 API とのやり取りを含む動的な処理フロー

**内容:**

- 全体フロー（1 分間のサイクル）
- Sender Lambda 詳細シーケンス
- Collector Lambda 詳細シーケンス
- エラーハンドリングフロー
- データフロー詳細

### 3. [OpenAPI 仕様書](./openapi.yaml)

モック AI 社員 API の完全な API 仕様

**内容:**

- エンドポイント定義
- リクエスト/レスポンススキーマ
- エラーレスポンス
- 使用例

## 🔍 クイックリファレンス

### システム概要

5 秒間隔で AI 社員 API をポーリングし、レスポンス数を DynamoDB に保存する完全サーバーレスシステム。

### 主要コンポーネント

1. **EventBridge Rule** - 1 分ごとのトリガー
2. **Sender Lambda** - 12 個の遅延メッセージ生成
3. **SQS Queue** - サブミニッツスケジューリング
4. **Collector Lambda** - API 呼び出し + データ保存
5. **API Gateway + Mock API Lambda** - AI 社員 API モック
6. **DynamoDB** - メトリクスデータ保存

### データフロー

```
EventBridge (1分)
  → Sender Lambda
  → SQS (遅延: 0,5,10...55秒)
  → Collector Lambda (5秒ごと)
  → Mock API
  → DynamoDB
```

### API エンドポイント

#### レスポンス数取得

```http
GET /response_count?from={ISO8601}&to={ISO8601}
```

**レスポンス例:**

```json
{
  "from": "2025-12-03T10:23:00Z",
  "to": "2025-12-03T10:23:05Z",
  "count": 65
}
```

#### ヘルスチェック

```http
GET /health
```

**レスポンス例:**

```json
{
  "status": "ok"
}
```

## 📊 データモデル

### DynamoDB テーブル: AiResponseMetrics

| 属性名     | 型     | キー | 説明                     | 例                     |
| ---------- | ------ | ---- | ------------------------ | ---------------------- |
| metricName | String | PK   | メトリクス識別子         | "ai_response_count"    |
| slotTime   | String | SK   | 5 秒境界のタイムスタンプ | "2025-12-03T10:23:05Z" |
| count      | Number | -    | レスポンス数             | 65                     |

### SQS メッセージ形式

```json
{
  "from": "2025-12-03T10:23:00Z",
  "to": "2025-12-03T10:23:05Z"
}
```

## 🔧 技術スタック

- **言語**: TypeScript
- **ランタイム**: Node.js 20.x
- **IaC**: AWS CDK
- **テスト**: Vitest + fast-check (Property-Based Testing)
- **AWS サービス**:
  - Lambda
  - API Gateway
  - DynamoDB
  - SQS
  - EventBridge
  - CloudWatch Logs

## 📈 パフォーマンス特性

### スループット

- **データ収集頻度**: 5 秒ごと（12 回/分）
- **1 日あたりのデータポイント**: 17,280 件
- **Lambda 実行回数**: 約 34,560 回/日

### レイテンシ

- **Sender Lambda**: < 2 秒
- **Collector Lambda**: < 3 秒
- **API 呼び出し**: < 1 秒
- **DynamoDB 書き込み**: < 100ms

### コスト見積もり（月間）

- **Lambda**: 約 $0.50
- **DynamoDB**: 約 $1.00（オンデマンド）
- **SQS**: 約 $0.10
- **API Gateway**: 約 $0.50
- **合計**: 約 $2.10/月

## 🔐 セキュリティ

### 現在の実装（PoC）

- API 認証: なし
- VPC: なし（パブリックサブネット）
- 暗号化: DynamoDB 暗号化（デフォルト）

### 本番環境推奨

- API Gateway: API Key または カスタムオーソライザー
- Lambda: VPC 内配置
- DynamoDB: カスタマーマネージドキー（CMK）
- CloudWatch Logs: 暗号化

## 📝 運用

### デプロイ

```bash
# ビルド
npm run build

# デプロイ
AWS_PROFILE=main AWS_REGION=ap-northeast-1 npx cdk deploy
```

### モニタリング

- CloudWatch Logs: Lambda 実行ログ
- CloudWatch Metrics: Lambda 実行回数、エラー率
- DynamoDB Metrics: 読み取り/書き込みキャパシティ

### トラブルシューティング

1. **データが収集されない**

   - EventBridge Rule の状態確認
   - Sender Lambda のログ確認
   - SQS キューのメッセージ数確認

2. **API 呼び出しエラー**

   - Mock API のログ確認
   - ネットワーク接続確認
   - API Gateway のメトリクス確認

3. **DynamoDB 書き込みエラー**
   - IAM ロールの権限確認
   - スロットリング確認
   - テーブルの状態確認

## 🔗 関連リンク

- [要件定義書](../.kiro/specs/data-collection-scheduler/requirements.md)
- [設計書](../.kiro/specs/data-collection-scheduler/design.md)
- [実装計画](../.kiro/specs/data-collection-scheduler/tasks.md)
- [AWS CDK スタック](../lib/stack.ts)

## 📞 サポート

質問や問題がある場合は、プロジェクトの Issue トラッカーまでお問い合わせください。
