/**
 * Message format sent from Sender Lambda to SQS queue
 * Contains the time window for data collection
 */
export interface ScheduleMessage {
    from: string;
    to: string;
}
/**
 * Response format from AI Employee API
 */
export interface ApiResponse {
    from: string;
    to: string;
    count: number;
}
/**
 * DynamoDB record format for storing metrics
 */
export interface MetricRecord {
    metricName: string;
    slotTime: string;
    count: number;
}
