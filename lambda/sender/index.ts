import { SQSClient, SendMessageCommand } from '@aws-sdk/client-sqs';
import { ScheduleMessage } from '../shared/types';

/**
 * Sender Lambda Configuration
 * Requirements: 1.2, 1.3
 */
interface SenderConfig {
    queueUrl: string;
    intervalSeconds: number; // 5 seconds
    messagesPerMinute: number; // 12 messages
}

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
export function generateDelayedMessages(
    referenceTime: Date,
    intervalSeconds: number,
    messagesPerMinute: number
): DelayedMessage[] {
    const messages: DelayedMessage[] = [];

    for (let i = 0; i < messagesPerMinute; i++) {
        const delaySeconds = i * intervalSeconds;

        // Calculate time window for this slot
        const fromTime = new Date(referenceTime);
        fromTime.setUTCSeconds(delaySeconds);

        const toTime = new Date(fromTime);
        toTime.setUTCSeconds(fromTime.getUTCSeconds() + intervalSeconds);

        messages.push({
            message: {
                from: fromTime.toISOString(),
                to: toTime.toISOString(),
            },
            delaySeconds,
        });
    }

    return messages;
}

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
export async function handler(event: any): Promise<void> {
    console.log('Sender Lambda triggered', { timestamp: new Date().toISOString(), event });

    // Load configuration from environment variables
    const config: SenderConfig = {
        queueUrl: process.env.QUEUE_URL || '',
        intervalSeconds: 5,
        messagesPerMinute: 12,
    };

    if (!config.queueUrl) {
        const error = 'QUEUE_URL environment variable is not set';
        console.error(error);
        throw new Error(error);
    }

    // Get reference time from EventBridge trigger (minute boundary)
    const referenceTime = new Date(event.time || new Date().toISOString());

    // Ensure we're at the minute boundary (0 seconds)
    referenceTime.setUTCSeconds(0, 0);

    console.log('Reference time (minute boundary)', { referenceTime: referenceTime.toISOString() });

    const sqsClient = new SQSClient({});
    const results = [];

    // Generate messages with delays: 0, 5, 10, ..., 55 seconds
    const delayedMessages = generateDelayedMessages(
        referenceTime,
        config.intervalSeconds,
        config.messagesPerMinute
    );

    // Send each message to SQS
    for (const { message, delaySeconds } of delayedMessages) {
        try {
            const command = new SendMessageCommand({
                QueueUrl: config.queueUrl,
                MessageBody: JSON.stringify(message),
                DelaySeconds: delaySeconds,
            });

            const response = await sqsClient.send(command);

            console.log('Message sent successfully', {
                messageId: response.MessageId,
                delaySeconds,
                from: message.from,
                to: message.to,
            });

            results.push({ success: true, delaySeconds, messageId: response.MessageId });
        } catch (error) {
            // Log error but continue processing remaining messages (Requirement 7.3)
            console.error('Failed to send message', {
                delaySeconds,
                from: message.from,
                to: message.to,
                error: error instanceof Error ? error.message : String(error),
            });

            results.push({ success: false, delaySeconds, error: String(error) });
        }
    }

    const successCount = results.filter(r => r.success).length;
    const failureCount = results.filter(r => !r.success).length;

    console.log('Sender Lambda completed', {
        totalMessages: config.messagesPerMinute,
        successCount,
        failureCount,
    });

    // If all messages failed, throw error to trigger Lambda retry
    if (failureCount === config.messagesPerMinute) {
        throw new Error('All SQS messages failed to send');
    }
}
