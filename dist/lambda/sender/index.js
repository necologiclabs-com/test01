"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.generateDelayedMessages = generateDelayedMessages;
exports.handler = handler;
const client_sqs_1 = require("@aws-sdk/client-sqs");
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
function generateDelayedMessages(referenceTime, intervalSeconds, messagesPerMinute) {
    const messages = [];
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
async function handler(event) {
    console.log('Sender Lambda triggered', { timestamp: new Date().toISOString(), event });
    // Load configuration from environment variables
    const config = {
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
    const sqsClient = new client_sqs_1.SQSClient({});
    const results = [];
    // Generate messages with delays: 0, 5, 10, ..., 55 seconds
    const delayedMessages = generateDelayedMessages(referenceTime, config.intervalSeconds, config.messagesPerMinute);
    // Send each message to SQS
    for (const { message, delaySeconds } of delayedMessages) {
        try {
            const command = new client_sqs_1.SendMessageCommand({
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
        }
        catch (error) {
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiaW5kZXguanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi9sYW1iZGEvc2VuZGVyL2luZGV4LnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7O0FBK0JBLDBEQTJCQztBQVlELDBCQStFQztBQXJKRCxvREFBb0U7QUFxQnBFOzs7Ozs7Ozs7R0FTRztBQUNILFNBQWdCLHVCQUF1QixDQUNuQyxhQUFtQixFQUNuQixlQUF1QixFQUN2QixpQkFBeUI7SUFFekIsTUFBTSxRQUFRLEdBQXFCLEVBQUUsQ0FBQztJQUV0QyxLQUFLLElBQUksQ0FBQyxHQUFHLENBQUMsRUFBRSxDQUFDLEdBQUcsaUJBQWlCLEVBQUUsQ0FBQyxFQUFFLEVBQUUsQ0FBQztRQUN6QyxNQUFNLFlBQVksR0FBRyxDQUFDLEdBQUcsZUFBZSxDQUFDO1FBRXpDLHNDQUFzQztRQUN0QyxNQUFNLFFBQVEsR0FBRyxJQUFJLElBQUksQ0FBQyxhQUFhLENBQUMsQ0FBQztRQUN6QyxRQUFRLENBQUMsYUFBYSxDQUFDLFlBQVksQ0FBQyxDQUFDO1FBRXJDLE1BQU0sTUFBTSxHQUFHLElBQUksSUFBSSxDQUFDLFFBQVEsQ0FBQyxDQUFDO1FBQ2xDLE1BQU0sQ0FBQyxhQUFhLENBQUMsUUFBUSxDQUFDLGFBQWEsRUFBRSxHQUFHLGVBQWUsQ0FBQyxDQUFDO1FBRWpFLFFBQVEsQ0FBQyxJQUFJLENBQUM7WUFDVixPQUFPLEVBQUU7Z0JBQ0wsSUFBSSxFQUFFLFFBQVEsQ0FBQyxXQUFXLEVBQUU7Z0JBQzVCLEVBQUUsRUFBRSxNQUFNLENBQUMsV0FBVyxFQUFFO2FBQzNCO1lBQ0QsWUFBWTtTQUNmLENBQUMsQ0FBQztJQUNQLENBQUM7SUFFRCxPQUFPLFFBQVEsQ0FBQztBQUNwQixDQUFDO0FBRUQ7Ozs7Ozs7OztHQVNHO0FBQ0ksS0FBSyxVQUFVLE9BQU8sQ0FBQyxLQUFVO0lBQ3BDLE9BQU8sQ0FBQyxHQUFHLENBQUMseUJBQXlCLEVBQUUsRUFBRSxTQUFTLEVBQUUsSUFBSSxJQUFJ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Q0FBQyxDQUFDLENBQUMsRUFBRSxDQUFDLENBQUMsQ0FBQyxPQUFPLENBQUMsQ0FBQyxNQUFNLENBQUM7SUFDM0QsTUFBTSxZQUFZLEdBQUcsT0FBTyxDQUFDLE1BQU0sQ0FBQyxDQUFDLENBQUMsRUFBRSxDQUFDLENBQUMsQ0FBQyxDQUFDLE9BQU8sQ0FBQyxDQUFDLE1BQU0sQ0FBQztJQUU1RCxPQUFPLENBQUMsR0FBRyxDQUFDLHlCQUF5QixFQUFFO1FBQ25DLGFBQWEsRUFBRSxNQUFNLENBQUMsaUJBQWlCO1FBQ3ZDLFlBQVk7UUFDWixZQUFZO0tBQ2YsQ0FBQyxDQUFDO0lBRUgsOERBQThEO0lBQzlELElBQUksWUFBWSxLQUFLLE1BQU0sQ0FBQyxpQkFBaUIsRUFBRSxDQUFDO1FBQzVDLE1BQU0sSUFBSSxLQUFLLENBQUMsaUNBQWlDLENBQUMsQ0FBQztJQUN2RCxDQUFDO0FBQ0wsQ0FBQyIsInNvdXJjZXNDb250ZW50IjpbImltcG9ydCB7IFNRU0NsaWVudCwgU2VuZE1lc3NhZ2VDb21tYW5kIH0gZnJvbSAnQGF3cy1zZGsvY2xpZW50LXNxcyc7XHJcbmltcG9ydCB7IFNjaGVkdWxlTWVzc2FnZSB9IGZyb20gJy4uL3NoYXJlZC90eXBlcyc7XHJcblxyXG4vKipcclxuICogU2VuZGVyIExhbWJkYSBDb25maWd1cmF0aW9uXHJcbiAqIFJlcXVpcmVtZW50czogMS4yLCAxLjNcclxuICovXHJcbmludGVyZmFjZSBTZW5kZXJDb25maWcge1xyXG4gICAgcXVldWVVcmw6IHN0cmluZztcclxuICAgIGludGVydmFsU2Vjb25kczogbnVtYmVyOyAvLyA1IHNlY29uZHNcclxuICAgIG1lc3NhZ2VzUGVyTWludXRlOiBudW1iZXI7IC8vIDEyIG1lc3NhZ2VzXHJcbn1cclxuXHJcbi8qKlxyXG4gKiBNZXNzYWdlIHdpdGggZGVsYXkgaW5mb3JtYXRpb25cclxuICovXHJcbmV4cG9ydCBpbnRlcmZhY2UgRGVsYXllZE1lc3NhZ2Uge1xyXG4gICAgbWVzc2FnZTogU2NoZWR1bGVNZXNzYWdlO1xyXG4gICAgZGVsYXlTZWNvbmRzOiBudW1iZXI7XHJcbn1cclxuXHJcbi8qKlxyXG4gKiBHZW5lcmF0ZXMgdGltZSB3aW5kb3dzIGFuZCBkZWxheXMgZm9yIHN1Yi1taW51dGUgc2NoZWR1bGluZ1xyXG4gKiBcclxuICogUmVxdWlyZW1lbnRzOiAxLjIsIDEuM1xyXG4gKiBcclxuICogQHBhcmFtIHJlZmVyZW5jZVRpbWUgLSBCYXNlIHRpbWUgKG1pbnV0ZSBib3VuZGFyeSlcclxuICogQHBhcmFtIGludGVydmFsU2Vjb25kcyAtIEludGVydmFsIGJldHdlZW4gbWVzc2FnZXMgKDUgc2Vjb25kcylcclxuICogQHBhcmFtIG1lc3NhZ2VzUGVyTWludXRlIC0gTnVtYmVyIG9mIG1lc3NhZ2VzIHRvIGdlbmVyYXRlICgxMilcclxuICogQHJldHVybnMgQXJyYXkgb2YgbWVzc2FnZXMgd2l0aCB0aGVpciBkZWxheSB2YWx1ZXNcclxuICovXHJcbmV4cG9ydCBmdW5jdGlvbiBnZW5lcmF0ZURlbGF5ZWRNZXNzYWdlcyhcclxuICAgIHJlZmVyZW5jZVRpbWU6IERhdGUsXHJcbiAgICBpbnRlcnZhbFNlY29uZHM6IG51bWJlcixcclxuICAgIG1lc3NhZ2VzUGVyTWludXRlOiBudW1iZXJcclxuKTogRGVsYXllZE1lc3NhZ2VbXSB7XHJcbiAgICBjb25zdCBtZXNzYWdlczogRGVsYXllZE1lc3NhZ2VbXSA9IFtdO1xyXG5cclxuICAgIGZvciAobGV0IGkgPSAwOyBpIDwgbWVzc2FnZXNQZXJNaW51dGU7IGkrKykge1xyXG4gICAgICAgIGNvbnN0IGRlbGF5U2Vjb25kcyA9IGkgKiBpbnRlcnZhbFNlY29uZHM7XHJcblxyXG4gICAgICAgIC8vIENhbGN1bGF0ZSB0aW1lIHdpbmRvdyBmb3IgdGhpcyBzbG90XHJcbiAgICAgICAgY29uc3QgZnJvbVRpbWUgPSBuZXcgRGF0ZShyZWZlcmVuY2VUaW1lKTtcclxuICAgICAgICBmcm9tVGltZS5zZXRVVENTZWNvbmRzKGRlbGF5U2Vjb25kcyk7XHJcblxyXG4gICAgICAgIGNvbnN0IHRvVGltZSA9IG5ldyBEYXRlKGZyb21UaW1lKTtcclxuICAgICAgICB0b1RpbWUuc2V0VVRDU2Vjb25kcyhmcm9tVGltZS5nZXRVVENTZWNvbmRzKCkgKyBpbnRlcnZhbFNlY29uZHMpO1xyXG5cclxuICAgICAgICBtZXNzYWdlcy5wdXNoKHtcclxuICAgICAgICAgICAgbWVzc2FnZToge1xyXG4gICAgICAgICAgICAgICAgZnJvbTogZnJvbVRpbWUudG9JU09TdHJpbmcoKSxcclxuICAgICAgICAgICAgICAgIHRvOiB0b1RpbWUudG9JU09TdHJpbmcoKSxcclxuICAgICAgICAgICAgfSxcclxuICAgICAgICAgICAgZGVsYXlTZWNvbmRzLFxyXG4gICAgICAgIH0pO1xyXG4gICAgfVxyXG5cclxuICAgIHJldHVybiBtZXNzYWdlcztcclxufVxyXG5cclxuLyoqXHJcbiAqIFNlbmRlciBMYW1iZGEgSGFuZGxlclxyXG4gKiBcclxuICogVHJpZ2dlcmVkIGJ5IEV2ZW50QnJpZGdlIGV2ZXJ5IG1pbnV0ZSBhdCAwIHNlY29uZHMuXHJcbiAqIEdlbmVyYXRlcyAxMiBkZWxheWVkIFNRUyBtZXNzYWdlcyB0byBhY2hpZXZlIDUtc2Vjb25kIHBvbGxpbmcgaW50ZXJ2YWxzLlxyXG4gKiBcclxuICogUmVxdWlyZW1lbnRzOiAxLjIsIDEuMywgNy4zLCA3LjRcclxuICogXHJcbiAqIEBwYXJhbSBldmVudCAtIEV2ZW50QnJpZGdlIHNjaGVkdWxlZCBldmVudFxyXG4gKi9cclxuZXhwb3J0IGFzeW5jIGZ1bmN0aW9uIGhhbmRsZXIoZXZlbnQ6IGFueSk6IFByb21pc2U8dm9pZD4ge1xyXG4gICAgY29uc29sZS5sb2coJ1NlbmRlciBMYW1iZGEgdHJpZ2dlcmVkJywgeyB0aW1lc3RhbXA6IG5ldyBEYXRlKCkudG9JU09TdHJpbmcoKSwgZXZlbnQgfSk7XHJcblxyXG4gICAgLy8gTG9hZCBjb25maWd1cmF0aW9uIGZyb20gZW52aXJvbm1lbnQgdmFyaWFibGVzXHJcbiAgICBjb25zdCBjb25maWc6IFNlbmRlckNvbmZpZyA9IHtcclxuICAgICAgICBxdWV1ZVVybDogcHJvY2Vzcy5lbnYuUVVFVUVfVVJMIHx8ICcnLFxyXG4gICAgICAgIGludGVydmFsU2Vjb25kczogNSxcclxuICAgICAgICBtZXNzYWdlc1Blck1pbnV0ZTogMTIsXHJcbiAgICB9O1xyXG5cclxuICAgIGlmICghY29uZmlnLnF1ZXVlVXJsKSB7XHJcbiAgICAgICAgY29uc3QgZXJyb3IgPSAnUVVFVUVfVVJMIGVudmlyb25tZW50IHZhcmlhYmxlIGlzIG5vdCBzZXQnO1xyXG4gICAgICAgIGNvbnNvbGUuZXJyb3IoZXJyb3IpO1xyXG4gICAgICAgIHRocm93IG5ldyBFcnJvcihlcnJvcik7XHJcbiAgICB9XHJcblxyXG4gICAgLy8gR2V0IHJlZmVyZW5jZSB0aW1lIGZyb20gRXZlbnRCcmlkZ2UgdHJpZ2dlciAobWludXRlIGJvdW5kYXJ5KVxyXG4gICAgY29uc3QgcmVmZXJlbmNlVGltZSA9IG5ldyBEYXRlKGV2ZW50LnRpbWUgfHwgbmV3IERhdGUoKS50b0lTT1N0cmluZygpKTtcclxuXHJcbiAgICAvLyBFbnN1cmUgd2UncmUgYXQgdGhlIG1pbnV0ZSBib3VuZGFyeSAoMCBzZWNvbmRzKVxyXG4gICAgcmVmZXJlbmNlVGltZS5zZXRVVENTZWNvbmRzKDAsIDApO1xyXG5cclxuICAgIGNvbnNvbGUubG9nKCdSZWZlcmVuY2UgdGltZSAobWludXRlIGJvdW5kYXJ5KScsIHsgcmVmZXJlbmNlVGltZTogcmVmZXJlbmNlVGltZS50b0lTT1N0cmluZygpIH0pO1xyXG5cclxuICAgIGNvbnN0IHNxc0NsaWVudCA9IG5ldyBTUVNDbGllbnQoe30pO1xyXG4gICAgY29uc3QgcmVzdWx0cyA9IFtdO1xyXG5cclxuICAgIC8vIEdlbmVyYXRlIG1lc3NhZ2VzIHdpdGggZGVsYXlzOiAwLCA1LCAxMCwgLi4uLCA1NSBzZWNvbmRzXHJcbiAgICBjb25zdCBkZWxheWVkTWVzc2FnZXMgPSBnZW5lcmF0ZURlbGF5ZWRNZXNzYWdlcyhcclxuICAgICAgICByZWZlcmVuY2VUaW1lLFxyXG4gICAgICAgIGNvbmZpZy5pbnRlcnZhbFNlY29uZHMsXHJcbiAgICAgICAgY29uZmlnLm1lc3NhZ2VzUGVyTWludXRlXHJcbiAgICApO1xyXG5cclxuICAgIC8vIFNlbmQgZWFjaCBtZXNzYWdlIHRvIFNRU1xyXG4gICAgZm9yIChjb25zdCB7IG1lc3NhZ2UsIGRlbGF5U2Vjb25kcyB9IG9mIGRlbGF5ZWRNZXNzYWdlcykge1xyXG4gICAgICAgIHRyeSB7XHJcbiAgICAgICAgICAgIGNvbnN0IGNvbW1hbmQgPSBuZXcgU2VuZE1lc3NhZ2VDb21tYW5kKHtcclxuICAgICAgICAgICAgICAgIFF1ZXVlVXJsOiBjb25maWcucXVldWVVcmwsXHJcbiAgICAgICAgICAgICAgICBNZXNzYWdlQm9keTogSlNPTi5zdHJpbmdpZnkobWVzc2FnZSksXHJcbiAgICAgICAgICAgICAgICBEZWxheVNlY29uZHM6IGRlbGF5U2Vjb25kcyxcclxuICAgICAgICAgICAgfSk7XHJcblxyXG4gICAgICAgICAgICBjb25zdCByZXNwb25zZSA9IGF3YWl0IHNxc0NsaWVudC5zZW5kKGNvbW1hbmQpO1xyXG5cclxuICAgICAgICAgICAgY29uc29sZS5sb2coJ01lc3NhZ2Ugc2VudCBzdWNjZXNzZnVsbHknLCB7XHJcbiAgICAgICAgICAgICAgICBtZXNzYWdlSWQ6IHJlc3BvbnNlLk1lc3NhZ2VJZCxcclxuICAgICAgICAgICAgICAgIGRlbGF5U2Vjb25kcyxcclxuICAgICAgICAgICAgICAgIGZyb206IG1lc3NhZ2UuZnJvbSxcclxuICAgICAgICAgICAgICAgIHRvOiBtZXNzYWdlLnRvLFxyXG4gICAgICAgICAgICB9KTtcclxuXHJcbiAgICAgICAgICAgIHJlc3VsdHMucHVzaCh7IHN1Y2Nlc3M6IHRydWUsIGRlbGF5U2Vjb25kcywgbWVzc2FnZUlkOiByZXNwb25zZS5NZXNzYWdlSWQgfSk7XHJcbiAgICAgICAgfSBjYXRjaCAoZXJyb3IpIHtcclxuICAgICAgICAgICAgLy8gTG9nIGVycm9yIGJ1dCBjb250aW51ZSBwcm9jZXNzaW5nIHJlbWFpbmluZyBtZXNzYWdlcyAoUmVxdWlyZW1lbnQgNy4zKVxyXG4gICAgICAgICAgICBjb25zb2xlLmVycm9yKCdGYWlsZWQgdG8gc2VuZCBtZXNzYWdlJywge1xyXG4gICAgICAgICAgICAgICAgZGVsYXlTZWNvbmRzLFxyXG4gICAgICAgICAgICAgICAgZnJvbTogbWVzc2FnZS5mcm9tLFxyXG4gICAgICAgICAgICAgICAgdG86IG1lc3NhZ2UudG8sXHJcbiAgICAgICAgICAgICAgICBlcnJvcjogZXJyb3IgaW5zdGFuY2VvZiBFcnJvciA/IGVycm9yLm1lc3NhZ2UgOiBTdHJpbmcoZXJyb3IpLFxyXG4gICAgICAgICAgICB9KTtcclxuXHJcbiAgICAgICAgICAgIHJlc3VsdHMucHVzaCh7IHN1Y2Nlc3M6IGZhbHNlLCBkZWxheVNlY29uZHMsIGVycm9yOiBTdHJpbmcoZXJyb3IpIH0pO1xyXG4gICAgICAgIH1cclxuICAgIH1cclxuXHJcbiAgICBjb25zdCBzdWNjZXNzQ291bnQgPSByZXN1bHRzLmZpbHRlcihyID0+IHIuc3VjY2VzcykubGVuZ3RoO1xyXG4gICAgY29uc3QgZmFpbHVyZUNvdW50ID0gcmVzdWx0cy5maWx0ZXIociA9PiAhci5zdWNjZXNzKS5sZW5ndGg7XHJcblxyXG4gICAgY29uc29sZS5sb2coJ1NlbmRlciBMYW1iZGEgY29tcGxldGVkJywge1xyXG4gICAgICAgIHRvdGFsTWVzc2FnZXM6IGNvbmZpZy5tZXNzYWdlc1Blck1pbnV0ZSxcclxuICAgICAgICBzdWNjZXNzQ291bnQsXHJcbiAgICAgICAgZmFpbHVyZUNvdW50LFxyXG4gICAgfSk7XHJcblxyXG4gICAgLy8gSWYgYWxsIG1lc3NhZ2VzIGZhaWxlZCwgdGhyb3cgZXJyb3IgdG8gdHJpZ2dlciBMYW1iZGEgcmV0cnlcclxuICAgIGlmIChmYWlsdXJlQ291bnQgPT09IGNvbmZpZy5tZXNzYWdlc1Blck1pbnV0ZSkge1xyXG4gICAgICAgIHRocm93IG5ldyBFcnJvcignQWxsIFNRUyBtZXNzYWdlcyBmYWlsZWQgdG8gc2VuZCcpO1xyXG4gICAgfVxyXG59XHJcbiJdfQ==