# 実装計画

- [x] 1. プロジェクト構造と CDK セットアップ

  - [x] 1.1 CDK プロジェクトの初期化とディレクトリ構造の作成

    - `bin/app.ts`、`lib/stack.ts`、`lambda/`ディレクトリを作成
    - package.json に CDK 依存関係を追加
    - tsconfig.json を設定
    - _要件: 6.1, 6.2, 6.3, 6.4, 6.5, 6.6_

  - [x] 1.2 共通ユーティリティとインターフェースの作成

    - `lambda/shared/types.ts`に共通型定義を作成（ScheduleMessage, ApiResponse, MetricRecord）
    - `lambda/shared/slot-time.ts`にスロットタイム計算関数を作成
    - _要件: 4.1, 4.2, 4.3_

  - [x] 1.3 スロットタイム計算のプロパティテストを作成

    - **プロパティ 5: スロットタイムの 5 秒境界への切り捨て**
    - **プロパティ 6: スロットタイム ISO8601 形式**
    - **検証対象: 要件 4.1, 4.3**

- [x] 2. モック AI エンプロイー API の実装

  - [x] 2.1 Express サーバーのセットアップ

    - `mock-api/`ディレクトリを作成
    - package.json と tsconfig.json を設定
    - Express アプリケーションの基本構造を作成
    - _要件: 5.4_

  - [x] 2.2 /response_count エンドポイントの実装

    - ISO8601 パラメータのパースを実装
    - 決定論的カウント計算（minute % 11）を実装
    - JSON レスポンス構造を実装
    - エラーハンドリング（400 レスポンス）を実装
    - _要件: 5.1, 5.2, 5.3_

  - [x] 2.3 モック API のプロパティテストを作成

    - **プロパティ 7: モック API レスポンス構造と境界**
    - **プロパティ 8: モック API の ISO8601 パース**
    - **検証対象: 要件 5.1, 5.2, 5.3**

- [x] 3. Sender Lambda の実装

  - [x] 3.1 Sender Lambda 関数の作成

    - `lambda/sender/index.ts`を作成
    - 基準時刻から 12 個の時間幅（from, to）を生成するロジックを実装
    - 各メッセージに対応する DelaySeconds（0, 5, 10, ... 55）を設定
    - SQS メッセージ送信ロジックを実装
    - エラーハンドリングとロギングを実装
    - _要件: 1.2, 1.3, 7.3, 7.4_

  - [x] 3.2 Sender Lambda のプロパティテストを作成

    - **プロパティ 1: Sender が正しい遅延シーケンスを生成**
    - **プロパティ 2: Sender のタイムウィンドウ生成の正確性**
    - **検証対象: 要件 1.2, 1.3**

- [x] 4. Collector Lambda の実装

  - [x] 4.1 API 呼び出しロジックの実装

    - `lambda/collector/api-client.ts`を作成
    - SQS メッセージから from/to を取得
    - URL 構築と ISO8601 フォーマットを実装
    - HTTP リクエストとレスポンスパースを実装
    - _要件: 2.1, 2.2, 2.3_

  - [x] 4.2 API 呼び出しのプロパティテストを作成

    - **プロパティ 3: ISO8601 形式での API URL 構築**
    - **プロパティ 4: API レスポンスパースのラウンドトリップ**
    - **検証対象: 要件 2.2, 2.3**

  - [x] 4.3 DynamoDB 書き込みロジックの実装

    - `lambda/collector/dynamodb-writer.ts`を作成
    - SQS メッセージの from をスロットタイムとして使用
    - 冪等な条件付き書き込みを実装（attribute_not_exists）
    - _要件: 3.1, 3.2, 3.3, 3.4_

  - [x] 4.4 DynamoDB 書き込みのプロパティテストを作成

    - **プロパティ 9: 冪等な DynamoDB 書き込み**
    - **検証対象: 要件 3.4**

  - [x] 4.5 Collector Lambda ハンドラーの統合

    - `lambda/collector/index.ts`を作成
    - 環境変数読み込みを実装（AI_API_BASE_URL, AI_METRICS_TABLE_NAME）
    - SQS イベントからメッセージを取得
    - 各コンポーネントを統合
    - エラーハンドリングとロギングを実装
    - _要件: 7.1, 7.2, 7.4_

- [x] 5. チェックポイント - すべてのテストが通ることを確認

  - すべてのテストが通ることを確認し、質問があればユーザーに確認する

- [x] 6. CDK スタックの実装

  - [x] 6.1 DynamoDB テーブルの定義

    - AiResponseMetrics テーブルを定義
    - パーティションキー（metricName）とソートキー（slotTime）を設定
    - _要件: 6.1_

  - [x] 6.2 SQS キューの定義

    - スケジューリングメッセージ用キューを定義
    - _要件: 6.2_

  - [x] 6.3 Sender Lambda の定義

    - Lambda 関数を定義（Node.js 20.x）
    - SQS キューへの送信権限を付与
    - 環境変数を設定（QUEUE_URL）
    - _要件: 6.3, 6.6_

  - [x] 6.4 Collector Lambda の定義

    - Lambda 関数を定義（Node.js 20.x）
    - DynamoDB への書き込み権限を付与
    - SQS トリガーを設定
    - 環境変数を設定（AI_API_BASE_URL, AI_METRICS_TABLE_NAME）
    - _要件: 6.4, 6.6_

  - [x] 6.5 EventBridge ルールの定義

    - 1 分間隔のスケジュールルールを定義
    - Sender Lambda をターゲットに設定
    - _要件: 6.5_

  - [x] 6.6 CDK アプリケーションエントリポイントの作成

    - `bin/app.ts`を作成
    - スタックをインスタンス化
    - _要件: 6.1_

- [x] 7. 最終チェックポイント - すべてのテストが通ることを確認

  - すべてのテストが通ることを確認し、質問があればユーザーに確認する
