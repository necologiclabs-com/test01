/**
 * Message format sent from Sender Lambda to SQS queue
 * Contains the time window for data collection
 */
export interface ScheduleMessage {
    from: string; // ISO8601 timestamp (start of time window)
    to: string; // ISO8601 timestamp (end of time window)
}

/**
 * Response format from AI Employee API
 */
export interface ApiResponse {
    from: string; // ISO8601 timestamp
    to: string; // ISO8601 timestamp
    count: number; // Response count for the time window
}

/**
 * DynamoDB record format for storing metrics
 */
export interface MetricRecord {
    metricName: string; // Partition key: "ai_response_count"
    slotTime: string; // Sort key: ISO8601 timestamp truncated to 5-second boundary
    count: number; // Response count from API
}
