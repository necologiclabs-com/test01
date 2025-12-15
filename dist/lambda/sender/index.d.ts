import { ScheduleMessage } from '../shared/types';
/**
 * Message with delay information
 */
export interface DelayedMessage {
    message: ScheduleMessage;
    delaySeconds: number;
}
/**
 * Generates time windows and delays for sub-minute scheduling
 *
 * Requirements: 1.2, 1.3
 *
 * @param referenceTime - Base time (minute boundary)
 * @param intervalSeconds - Interval between messages (5 seconds)
 * @param messagesPerMinute - Number of messages to generate (12)
 * @returns Array of messages with their delay values
 */
export declare function generateDelayedMessages(referenceTime: Date, intervalSeconds: number, messagesPerMinute: number): DelayedMessage[];
/**
 * Sender Lambda Handler
 *
 * Triggered by EventBridge every minute at 0 seconds.
 * Generates 12 delayed SQS messages to achieve 5-second polling intervals.
 *
 * Requirements: 1.2, 1.3, 7.3, 7.4
 *
 * @param event - EventBridge scheduled event
 */
export declare function handler(event: any): Promise<void>;
