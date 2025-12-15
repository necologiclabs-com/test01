# シーケンス図

## 全体フロー（1 分間のサイクル）

```mermaid
sequenceDiagram
    participant EB as EventBridge
    participant CL as Collector Lambda
    participant API as API Gateway
    participant ML as Mock API Lambda
    participant DDB as DynamoDB

    Note over EB: 毎分0秒
    EB->>CL: トリガー実行

    activate CL
    CL->>CL: 基準時刻取得<br/>(例: 10:23:00)

    loop 12回繰り返し (i=0 to 11)
        CL->>CL: 時間幅計算<br/>from: 基準時刻 + i*5秒<br/>to: 基準時刻 + (i+1)*5秒

        CL->>API: GET /response_count<br/>?from={from}&to={to}

        activate API
        API->>ML: Lambda呼び出し<br/>(プロキシ統合)

        activate ML
        ML->>ML: クエリパラメータ検証
        ML->>ML: ISO8601パース
        ML->>ML: カウント計算<br/>(時刻ベース)
        ML-->>API: 200 OK<br/>{from, to, count}
        deactivate ML

        API-->>CL: JSON レスポンス
        deactivate API

        CL->>CL: レスポンスパース
        CL->>CL: スロットタイム計算<br/>(5秒境界に切り捨て)

        CL->>DDB: PutItem (条件付き)<br/>Condition: attribute_not_exists

        alt 新規レコード
            DDB-->>CL: 成功
        else 既存レコード
            DDB-->>CL: ConditionalCheckFailedException
            Note over CL: 冪等性により無視
        end
    end

    CL-->>EB: 完了
    deactivate CL
```

## 詳細シーケンス: Collector Lambda

```mermaid
sequenceDiagram
    participant EB as EventBridge
    participant CL as Collector Lambda
    participant API as Mock API
    participant DDB as DynamoDB

    EB->>CL: スケジュールイベント<br/>{time: "2025-12-03T10:23:00Z"}

    activate CL
    Note over CL: 環境変数読み込み
    CL->>CL: AI_API_BASE_URL取得<br/>AI_METRICS_TABLE_NAME取得

    Note over CL: 基準時刻設定
    CL->>CL: baseTime = new Date()<br/>baseTime.setSeconds(0)<br/>baseTime.setMilliseconds(0)

    Note over CL: データ収集ループ
    loop i = 0 to 11
        CL->>CL: fromTime = baseTime + (i * 5秒)<br/>toTime = baseTime + ((i+1) * 5秒)

        Note over CL: API呼び出し
        CL->>CL: url = `${baseUrl}/response_count`<br/>+ `?from=${from}&to=${to}`

        CL->>API: fetch(url)

        activate API
        API->>API: クエリパラメータ検証

        alt パラメータ不足
            API-->>CL: 400 Bad Request<br/>{error: "Missing parameters"}
            Note over CL: エラーログ出力<br/>※続行
        else パラメータ正常
            API->>API: 日付パース<br/>fromDate = new Date(from)<br/>toDate = new Date(to)

            alt 無効な日付形式
                API-->>CL: 400 Bad Request<br/>{error: "Invalid ISO8601"}
                Note over CL: エラーログ出力<br/>※続行
            else 日付正常
                API->>API: カウント計算<br/>hour = toDate.getUTCHours()<br/>minute = toDate.getUTCMinutes()<br/>second = toDate.getUTCSeconds()
                API->>API: baseCount = (9<=hour<=17) ? 50 : 20<br/>variation = (hour*7 + minute*3 + second) % 40<br/>count = min(100, max(0, baseCount + variation - 20))

                API-->>CL: 200 OK<br/>{from, to, count}
            end
        end
        deactivate API

        Note over CL: レスポンス処理
        CL->>CL: response = await res.json()<br/>{from, to, count}

        Note over CL: スロットタイム計算
        CL->>CL: slotTime = calculateSlotTime(from)<br/>※5秒境界に切り捨て

        Note over CL: DynamoDB書き込み
        CL->>CL: item = {<br/>  metricName: "ai_response_count",<br/>  slotTime: slotTime,<br/>  count: count<br/>}

        CL->>DDB: PutItem<br/>ConditionExpression:<br/>"attribute_not_exists(metricName)<br/>AND attribute_not_exists(slotTime)"

        alt 新規レコード
            DDB-->>CL: 成功
            Note over CL: ログ: レコード書き込み成功
        else 既存レコード（重複）
            DDB-->>CL: ConditionalCheckFailedException
            Note over CL: ログ: 重複レコード（冪等性）<br/>※エラーとして扱わない
        else その他のエラー
            DDB-->>CL: エラー
            Note over CL: エラーログ出力<br/>※続行
        end
    end

    CL-->>EB: 処理完了
    deactivate CL
```

## エラーハンドリングフロー

```mermaid
sequenceDiagram
    participant CL as Collector Lambda
    participant API as Mock API
    participant DDB as DynamoDB

    Note over CL: 正常フロー
    CL->>API: API呼び出し
    API-->>CL: 200 OK
    CL->>DDB: 書き込み
    DDB-->>CL: 成功
    Note over CL: 次のスロットへ続行

    Note over CL: エラーケース1: API障害
    CL->>API: API呼び出し
    API-->>CL: タイムアウト/エラー
    Note over CL: エラーログ出力<br/>該当スロットをスキップ<br/>次のスロットへ続行

    Note over CL: エラーケース2: DynamoDB障害
    CL->>API: API呼び出し
    API-->>CL: 200 OK
    CL->>DDB: 書き込み
    DDB-->>CL: スロットリング/エラー
    Note over CL: エラーログ出力<br/>該当スロットをスキップ<br/>次のスロットへ続行

    Note over CL: エラーケース3: 重複（冪等性）
    CL->>API: API呼び出し
    API-->>CL: 200 OK
    CL->>DDB: 書き込み
    DDB-->>CL: ConditionalCheckFailed
    Note over CL: 正常として処理<br/>（冪等性保証）<br/>次のスロットへ続行
```

## データフロー詳細

```mermaid
graph LR
    subgraph "入力"
        A[EventBridge<br/>トリガー時刻]
    end

    subgraph "Collector Lambda"
        B[基準時刻<br/>2025-12-03T10:23:00Z]
        C[時間幅生成<br/>12スロット]
        H[API呼び出し<br/>GET /response_count]
        I[レスポンス<br/>count: 45]
        J[スロットタイム<br/>10:23:00Z]
    end

    subgraph "DynamoDB"
        K[レコード<br/>PK: ai_response_count<br/>SK: 2025-12-03T10:23:00Z<br/>count: 45]
    end

    A --> B
    B --> C
    C --> H
    H --> I
    I --> J
    J --> K

    style A fill:#FF9900
    style K fill:#4B4BFF
```

## 集計処理フロー（Grafana データ取得）

```mermaid
sequenceDiagram
    participant GF as Grafana
    participant APIGW as API Gateway
    participant AL as Aggregator Lambda
    participant DDB as DynamoDB

    Note over GF: 5秒ごとにポーリング
    GF->>APIGW: GET /metrics/summary

    activate APIGW
    APIGW->>AL: Lambda呼び出し<br/>(プロキシ統合)

    activate AL
    Note over AL: 現在時刻取得
    AL->>AL: now = new Date()

    Note over AL: 1. 直近1分の問い合わせ数取得
    AL->>AL: oneMinuteAgo = now - 60秒<br/>startSlot = 1分境界に切り捨て

    AL->>DDB: Query<br/>PK: ai_response_count<br/>SK: between(startSlot, now)

    activate DDB
    DDB-->>AL: 12件のレコード<br/>(5秒 × 12 = 60秒分)
    deactivate DDB

    AL->>AL: lastMinuteTotal = sum(records.count)<br/>※直近1分の合計

    Note over AL: 2. 直近30分の1分ごとデータ取得
    AL->>AL: thirtyMinutesAgo = now - 30分<br/>startSlot = 30分前の1分境界

    AL->>DDB: Query<br/>PK: ai_response_count<br/>SK: between(thirtyMinutesAgo, now)

    activate DDB
    DDB-->>AL: 360件のレコード<br/>(5秒 × 12 × 30 = 30分分)
    deactivate DDB

    AL->>AL: 1分ごとに集約<br/>minutelyData = groupBy(minute)<br/>.map(sum(count))

    Note over AL: レスポンス構築
    AL->>AL: response = {<br/>  lastMinuteCount: 523,<br/>  minutelyData: [<br/>    {time: "10:00", count: 512},<br/>    {time: "10:01", count: 498},<br/>    ...(30件)<br/>  ]<br/>}

    AL-->>APIGW: 200 OK<br/>{lastMinuteCount, minutelyData}
    deactivate AL

    APIGW-->>GF: JSON レスポンス
    deactivate APIGW

    Note over GF: ダッシュボード更新<br/>・単一数値パネル<br/>・時系列グラフ
```

## 詳細シーケンス: Aggregator Lambda

```mermaid
sequenceDiagram
    participant APIGW as API Gateway
    participant AL as Aggregator Lambda
    participant DDB as DynamoDB

    APIGW->>AL: APIリクエスト

    activate AL
    Note over AL: 環境変数読み込み
    AL->>AL: AI_METRICS_TABLE_NAME取得

    Note over AL: 時刻計算
    AL->>AL: now = new Date()<br/>nowMinute = 分境界に切り捨て<br/>oneMinuteAgo = now - 60秒<br/>thirtyMinutesAgo = now - 30分

    Note over AL: DynamoDBクエリ（30分分一括取得）
    AL->>DDB: Query<br/>KeyConditionExpression:<br/>"metricName = :pk AND<br/>slotTime BETWEEN :start AND :end"<br/>:pk = "ai_response_count"<br/>:start = thirtyMinutesAgo<br/>:end = now

    activate DDB
    alt データ取得成功
        DDB-->>AL: Items[]<br/>(最大360件)
    else データなし
        DDB-->>AL: Items: []
    else エラー
        DDB-->>AL: エラー
        Note over AL: エラーログ出力
        AL-->>APIGW: 500 Internal Server Error
    end
    deactivate DDB

    Note over AL: データ集計処理

    AL->>AL: 直近1分フィルタ<br/>lastMinuteRecords = items.filter(<br/>  slotTime >= oneMinuteAgo<br/>)

    AL->>AL: 直近1分合計<br/>lastMinuteCount = lastMinuteRecords<br/>.reduce((sum, r) => sum + r.count, 0)

    AL->>AL: 1分ごとグループ化<br/>grouped = groupBy(items,<br/>  r => truncateToMinute(r.slotTime)<br/>)

    AL->>AL: 各分の合計計算<br/>minutelyData = Object.entries(grouped)<br/>.map(([minute, records]) => ({<br/>  time: minute,<br/>  count: sum(records.count)<br/>}))<br/>.sort(byTime)

    Note over AL: レスポンス構築
    AL->>AL: response = {<br/>  timestamp: now.toISOString(),<br/>  lastMinuteCount: 523,<br/>  minutelyData: [<br/>    {time: "2025-12-03T10:00:00Z", count: 512},<br/>    {time: "2025-12-03T10:01:00Z", count: 498},<br/>    ... (30件)<br/>  ]<br/>}

    AL-->>APIGW: 200 OK<br/>Content-Type: application/json
    deactivate AL
```

## Grafana 連携データフロー

```mermaid
graph LR
    subgraph "Grafana"
        G1[5秒ポーリング]
        G2[単一数値パネル<br/>直近1分: 523件]
        G3[時系列グラフ<br/>30分トレンド]
    end

    subgraph "API Gateway"
        API[GET /metrics/summary]
    end

    subgraph "Aggregator Lambda"
        A1[DynamoDBクエリ]
        A2[データ集計]
        A3[レスポンス生成]
    end

    subgraph "DynamoDB"
        D1[5秒スロットデータ<br/>metricName: ai_response_count<br/>slotTime: ISO8601]
    end

    G1 --> API
    API --> A1
    A1 --> D1
    D1 --> A2
    A2 --> A3
    A3 --> API
    API --> G2
    API --> G3

    style G1 fill:#3F6833
    style G2 fill:#3F6833
    style G3 fill:#3F6833
    style D1 fill:#4B4BFF
```

## API レスポンス形式

```json
{
  "timestamp": "2025-12-03T10:30:15Z",
  "lastMinuteCount": 523,
  "minutelyData": [
    { "time": "2025-12-03T10:00:00Z", "count": 512 },
    { "time": "2025-12-03T10:01:00Z", "count": 498 },
    { "time": "2025-12-03T10:02:00Z", "count": 534 },
    { "time": "2025-12-03T10:03:00Z", "count": 521 },
    { "time": "2025-12-03T10:04:00Z", "count": 489 },
    { "time": "2025-12-03T10:05:00Z", "count": 545 },
    { "time": "2025-12-03T10:06:00Z", "count": 502 },
    { "time": "2025-12-03T10:07:00Z", "count": 518 },
    { "time": "2025-12-03T10:08:00Z", "count": 531 },
    { "time": "2025-12-03T10:09:00Z", "count": 495 },
    { "time": "2025-12-03T10:10:00Z", "count": 527 },
    { "time": "2025-12-03T10:11:00Z", "count": 509 },
    { "time": "2025-12-03T10:12:00Z", "count": 542 },
    { "time": "2025-12-03T10:13:00Z", "count": 486 },
    { "time": "2025-12-03T10:14:00Z", "count": 553 },
    { "time": "2025-12-03T10:15:00Z", "count": 501 },
    { "time": "2025-12-03T10:16:00Z", "count": 524 },
    { "time": "2025-12-03T10:17:00Z", "count": 538 },
    { "time": "2025-12-03T10:18:00Z", "count": 492 },
    { "time": "2025-12-03T10:19:00Z", "count": 516 },
    { "time": "2025-12-03T10:20:00Z", "count": 529 },
    { "time": "2025-12-03T10:21:00Z", "count": 507 },
    { "time": "2025-12-03T10:22:00Z", "count": 541 },
    { "time": "2025-12-03T10:23:00Z", "count": 483 },
    { "time": "2025-12-03T10:24:00Z", "count": 556 },
    { "time": "2025-12-03T10:25:00Z", "count": 498 },
    { "time": "2025-12-03T10:26:00Z", "count": 522 },
    { "time": "2025-12-03T10:27:00Z", "count": 535 },
    { "time": "2025-12-03T10:28:00Z", "count": 491 },
    { "time": "2025-12-03T10:29:00Z", "count": 523 }
  ]
}
```
