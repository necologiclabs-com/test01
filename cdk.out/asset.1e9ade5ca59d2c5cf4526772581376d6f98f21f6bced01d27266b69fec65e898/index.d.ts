import { SQSEvent } from 'aws-lambda';
/**
 * Collector Lambda Handler
 *
 * Triggered by SQS messages containing time windows.
 * Fetches response count from AI Employee API and stores in DynamoDB.
 *
 * Requirements: 2.1, 2.2, 2.3, 3.1, 3.2, 3.3, 3.4, 7.1, 7.2, 7.4
 *
 * @param event - SQS event containing one or more messages
 */
export declare function handler(event: SQSEvent): Promise<void>;
