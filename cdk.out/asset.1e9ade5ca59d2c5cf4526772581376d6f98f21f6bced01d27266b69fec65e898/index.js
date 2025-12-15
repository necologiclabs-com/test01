"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.handler = handler;
const api_client_1 = require("./api-client");
const dynamodb_writer_1 = require("./dynamodb-writer");
/**
 * Loads configuration from environment variables
 *
 * Requirements: 7.1, 7.2, 7.4
 *
 * @returns Configuration object
 * @throws Error if required environment variables are missing
 */
function loadConfig() {
    const apiBaseUrl = process.env.AI_API_BASE_URL;
    const tableName = process.env.AI_METRICS_TABLE_NAME;
    if (!apiBaseUrl) {
        const error = 'AI_API_BASE_URL environment variable is not set';
        console.error(error);
        throw new Error(error);
    }
    if (!tableName) {
        const error = 'AI_METRICS_TABLE_NAME environment variable is not set';
        console.error(error);
        throw new Error(error);
    }
    return { apiBaseUrl, tableName };
}
/**
 * Processes a single SQS message
 *
 * Requirements: 2.1, 2.2, 2.3, 3.1, 3.2, 3.3, 3.4, 7.1, 7.2, 7.4
 *
 * @param record - SQS record containing time window message
 * @param config - Collector configuration
 */
async function processMessage(record, config) {
    console.log('Processing SQS message', {
        messageId: record.messageId,
        timestamp: new Date().toISOString(),
    });
    // Parse SQS message body to get time window (Requirement 2.1)
    const timeWindow = JSON.parse(record.body);
    console.log('Time window extracted from message', {
        from: timeWindow.from,
        to: timeWindow.to,
    });
    // Fetch response count from AI Employee API (Requirements 2.2, 2.3)
    const apiClientConfig = {
        baseUrl: config.apiBaseUrl,
    };
    const apiResponse = await (0, api_client_1.fetchResponseCount)(apiClientConfig, timeWindow);
    console.log('API response received', {
        from: apiResponse.from,
        to: apiResponse.to,
        count: apiResponse.count,
    });
    // Write metric record to DynamoDB (Requirements 3.1, 3.2, 3.3, 3.4)
    // Use 'from' as slot time (already 5-second aligned from Sender Lambda)
    const dynamoDBWriterConfig = {
        tableName: config.tableName,
    };
    const written = await (0, dynamodb_writer_1.writeMetricRecord)(dynamoDBWriterConfig, apiResponse, timeWindow.from // Use 'from' as slot time (Requirement 3.2)
    );
    if (written) {
        console.log('Message processed successfully', {
            messageId: record.messageId,
            slotTime: timeWindow.from,
            count: apiResponse.count,
        });
    }
    else {
        console.log('Message processed (duplicate prevented)', {
            messageId: record.messageId,
            slotTime: timeWindow.from,
        });
    }
}
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
async function handler(event) {
    console.log('Collector Lambda triggered', {
        timestamp: new Date().toISOString(),
        messageCount: event.Records.length,
    });
    // Load configuration from environment variables (Requirement 7.4)
    const config = loadConfig();
    console.log('Configuration loaded', {
        apiBaseUrl: config.apiBaseUrl,
        tableName: config.tableName,
    });
    // Process each SQS message
    for (const record of event.Records) {
        try {
            await processMessage(record, config);
        }
        catch (error) {
            // Requirements 7.1, 7.2: Log error details and re-throw
            // This will cause the message to be retried by SQS
            console.error('Failed to process message', {
                messageId: record.messageId,
                error: error instanceof Error ? error.message : String(error),
                stack: error instanceof Error ? error.stack : undefined,
            });
            // Re-throw to trigger SQS retry
            throw error;
        }
    }
    console.log('Collector Lambda completed', {
        timestamp: new Date().toISOString(),
        processedCount: event.Records.length,
    });
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiaW5kZXguanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi9sYW1iZGEvY29sbGVjdG9yL2luZGV4LnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7O0FBZ0hBLDBCQW9DQztBQWxKRCw2Q0FBbUU7QUFDbkUsdURBQTRFO0FBVzVFOzs7Ozs7O0dBT0c7QUFDSCxTQUFTLFVBQVU7SUFDZixNQUFNLFVBQVUsR0FBRyxPQUFPLENBQUMsR0FBRyxDQUFDLGVBQWUsQ0FBQztJQUMvQyxNQUFNLFNBQVMsR0FBRyxPQUFPLENBQUMsR0FBRyxDQUFDLHFCQUFxQixDQUFDO0lBRXBELElBQUksQ0FBQyxVQUFVLEVBQUUsQ0FBQztRQUNkLE1BQU0sS0FBSyxHQUFHLGlEQUFpRCxDQUFDO1FBQ2hFLE9BQU8sQ0FBQyxLQUFLLENBQUMsS0FBSyxDQUFDLENBQUM7UUFDckIsTUFBTSxJQUFJLEtBQUssQ0FBQyxLQUFLLENBQUMsQ0FBQztJQUMzQixDQUFDO0lBRUQsSUFBSSxDQUFDLFNBQVMsRUFBRSxDQUFDO1FBQ2IsTUFBTSxLQUFLLEdBQUcsdURBQXVELENBQUM7UUFDdEUsT0FBTyxDQUFDLEtBQUssQ0FBQyxLQUFLLENBQUMsQ0FBQztRQUNyQixNQUFNLElBQUksS0FBSyxDQUFDLEtBQUssQ0FBQyxDQUFDO0lBQzNCLENBQUM7SUFFRCxPQUFPLEVBQUUsVUFBVSxFQUFFLFNBQVMsRUFBRSxDQUFDO0FBQ3JDLENBQUM7QUFFRDs7Ozs7OztHQU9HO0FBQ0gsS0FBSyxVQUFVLGNBQWMsQ0FBQyxNQUFpQixFQUFFLE1BQXVCO0lBQ3BFLE9BQU8sQ0FBQyxHQUFHLENBQUMsd0JBQXdCLEVBQUU7UUFDbEMsU0FBUyxFQUFFLE1BQU0sQ0FBQyxTQUFTO1FBQzNCLFNBQVMsRUFBRSxJQUFJLElBQUksRUFBRSxDQUFDLFdBQVcsRUFBRTtLQUN0QyxDQUFDLENBQUM7SUFFSCw4REFBOEQ7SUFDOUQsTUFBTSxVQUFVLEdBQW9CLElBQUksQ0FBQyxLQUFLLENBQUMs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QUNMLENBQUM7SUFFRCxPQUFPLENBQUMsR0FBRyxDQUFDLDRCQUE0QixFQUFFO1FBQ3RDLFNBQVMsRUFBRSxJQUFJLElBQUksRUFBRSxDQUFDLFdBQVcsRUFBRTtRQUNuQyxjQUFjLEVBQUUsS0FBSyxDQUFDLE9BQU8sQ0FBQyxNQUFNO0tBQ3ZDLENBQUMsQ0FBQztBQUNQLENBQUMiLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQgeyBTUVNFdmVudCwgU1FTUmVjb3JkIH0gZnJvbSAnYXdzLWxhbWJkYSc7XHJcbmltcG9ydCB7IFNjaGVkdWxlTWVzc2FnZSB9IGZyb20gJy4uL3NoYXJlZC90eXBlcyc7XHJcbmltcG9ydCB7IGZldGNoUmVzcG9uc2VDb3VudCwgQXBpQ2xpZW50Q29uZmlnIH0gZnJvbSAnLi9hcGktY2xpZW50JztcclxuaW1wb3J0IHsgd3JpdGVNZXRyaWNSZWNvcmQsIER5bmFtb0RCV3JpdGVyQ29uZmlnIH0gZnJvbSAnLi9keW5hbW9kYi13cml0ZXInO1xyXG5cclxuLyoqXHJcbiAqIENvbGxlY3RvciBMYW1iZGEgQ29uZmlndXJhdGlvblxyXG4gKiBSZXF1aXJlbWVudHM6IDcuMSwgNy4yLCA3LjRcclxuICovXHJcbmludGVyZmFjZSBDb2xsZWN0b3JDb25maWcge1xyXG4gICAgYXBpQmFzZVVybDogc3RyaW5nOyAvLyBBSV9BUElfQkFTRV9VUkwgZW52aXJvbm1lbnQgdmFyaWFibGVcclxuICAgIHRhYmxlTmFtZTogc3RyaW5nOyAvLyBBSV9NRVRSSUNTX1RBQkxFX05BTUUgZW52aXJvbm1lbnQgdmFyaWFibGVcclxufVxyXG5cclxuLyoqXHJcbiAqIExvYWRzIGNvbmZpZ3VyYXRpb24gZnJvbSBlbnZpcm9ubWVudCB2YXJpYWJsZXNcclxuICogXHJcbiAqIFJlcXVpcmVtZW50czogNy4xLCA3LjIsIDcuNFxyXG4gKiBcclxuICogQHJldHVybnMgQ29uZmlndXJhdGlvbiBvYmplY3RcclxuICogQHRocm93cyBFcnJvciBpZiByZXF1aXJlZCBlbnZpcm9ubWVudCB2YXJpYWJsZXMgYXJlIG1pc3NpbmdcclxuICovXHJcbmZ1bmN0aW9uIGxvYWRDb25maWcoKTogQ29sbGVjdG9yQ29uZmlnIHtcclxuICAgIGNvbnN0IGFwaUJhc2VVcmwgPSBwcm9jZXNzLmVudi5BSV9BUElfQkFTRV9VUkw7XHJcbiAgICBjb25zdCB0YWJsZU5hbWUgPSBwcm9jZXNzLmVudi5BSV9NRVRSSUNTX1RBQkxFX05BTUU7XHJcblxyXG4gICAgaWYgKCFhcGlCYXNlVXJsKSB7XHJcbiAgICAgICAgY29uc3QgZXJyb3IgPSAnQUlfQVBJX0JBU0VfVVJMIGVudmlyb25tZW50IHZhcmlhYmxlIGlzIG5vdCBzZXQnO1xyXG4gICAgICAgIGNvbnNvbGUuZXJyb3IoZXJyb3IpO1xyXG4gICAgICAgIHRocm93IG5ldyBFcnJvcihlcnJvcik7XHJcbiAgICB9XHJcblxyXG4gICAgaWYgKCF0YWJsZU5hbWUpIHtcclxuICAgICAgICBjb25zdCBlcnJvciA9ICdBSV9NRVRSSUNTX1RBQkxFX05BTUUgZW52aXJvbm1lbnQgdmFyaWFibGUgaXMgbm90IHNldCc7XHJcbiAgICAgICAgY29uc29sZS5lcnJvcihlcnJvcik7XHJcbiAgICAgICAgdGhyb3cgbmV3IEVycm9yKGVycm9yKTtcclxuICAgIH1cclxuXHJcbiAgICByZXR1cm4geyBhcGlCYXNlVXJsLCB0YWJsZU5hbWUgfTtcclxufVxyXG5cclxuLyoqXHJcbiAqIFByb2Nlc3NlcyBhIHNpbmdsZSBTUVMgbWVzc2FnZVxyXG4gKiBcclxuICogUmVxdWlyZW1lbnRzOiAyLjEsIDIuMiwgMi4zLCAzLjEsIDMuMiwgMy4zLCAzLjQsIDcuMSwgNy4yLCA3LjRcclxuICogXHJcbiAqIEBwYXJhbSByZWNvcmQgLSBTUVMgcmVjb3JkIGNvbnRhaW5pbmcgdGltZSB3aW5kb3cgbWVzc2FnZVxyXG4gKiBAcGFyYW0gY29uZmlnIC0gQ29sbGVjdG9yIGNvbmZpZ3VyYXRpb25cclxuICovXHJcbmFzeW5jIGZ1bmN0aW9uIHByb2Nlc3NNZXNzYWdlKHJlY29yZDogU1FTUmVjb3JkLCBjb25maWc6IENvbGxlY3RvckNvbmZpZyk6IFByb21pc2U8dm9pZD4ge1xyXG4gICAgY29uc29sZS5sb2coJ1Byb2Nlc3NpbmcgU1FTIG1lc3NhZ2UnLCB7XHJcbiAgICAgICAgbWVzc2FnZUlkOiByZWNvcmQubWVzc2FnZUlkLFxyXG4gICAgICAgIHRpbWVzdGFtcDogbmV3IERhdGUoKS50b0lTT1N0cmluZygpLFxyXG4gICAgfSk7XHJcblxyXG4gICAgLy8gUGFyc2UgU1FTIG1lc3NhZ2UgYm9keSB0byBnZXQgdGltZSB3aW5kb3cgKFJlcXVpcmVtZW50IDIuMSlcclxuICAgIGNvbnN0IHRpbWVXaW5kb3c6IFNjaGVkdWxlTWVzc2FnZSA9IEpTT04ucGFyc2UocmVjb3JkLmJvZHkpO1xyXG5cclxuICAgIGNvbnNvbGUubG9nKCdUaW1lIHdpbmRvdyBleHRyYWN0ZWQgZnJvbSBtZXNzYWdlJywge1xyXG4gICAgICAgIGZyb206IHRpbWVXaW5kb3cuZnJvbSxcclxuICAgICAgICB0bzogdGltZVdpbmRvdy50byxcclxuICAgIH0pO1xyXG5cclxuICAgIC8vIEZldGNoIHJlc3BvbnNlIGNvdW50IGZyb20gQUkgRW1wbG95ZWUgQVBJIChSZXF1aXJlbWVudHMgMi4yLCAyLjMpXHJcbiAgICBjb25zdCBhcGlDbGllbnRDb25maWc6IEFwaUNsaWVudENvbmZpZyA9IHtcclxuICAgICAgICBiYXNlVXJsOiBjb25maWcuYXBpQmFzZVVybCxcclxuICAgIH07XHJcblxyXG4gICAgY29uc3QgYXBpUmVzcG9uc2UgPSBhd2FpdCBmZXRjaFJlc3BvbnNlQ291bnQoYXBpQ2xpZW50Q29uZmlnLCB0aW1lV2luZG93KTtcclxuXHJcbiAgICBjb25zb2xlLmxvZygnQVBJIHJlc3BvbnNlIHJlY2VpdmVkJywge1xyXG4gICAgICAgIGZyb206IGFwaVJlc3BvbnNlLmZyb20sXHJcbiAgICAgICAgdG86IGFwaVJlc3BvbnNlLnRvLFxyXG4gICAgICAgIGNvdW50OiBhcGlSZXNwb25zZS5jb3VudCxcclxuICAgIH0pO1xyXG5cclxuICAgIC8vIFdyaXRlIG1ldHJpYyByZWNvcmQgdG8gRHluYW1vREIgKFJlcXVpcmVtZW50cyAzLjEsIDMuMiwgMy4zLCAzLjQpXHJcbiAgICAvLyBVc2UgJ2Zyb20nIGFzIHNsb3QgdGltZSAoYWxyZWFkeSA1LXNlY29uZCBhbGlnbmVkIGZyb20gU2VuZGVyIExhbWJkYSlcclxuICAgIGNvbnN0IGR5bmFtb0RCV3JpdGVyQ29uZmlnOiBEeW5hbW9EQldyaXRlckNvbmZpZyA9IHtcclxuICAgICAgICB0YWJsZU5hbWU6IGNvbmZpZy50YWJsZU5hbWUsXHJcbiAgICB9O1xyXG5cclxuICAgIGNvbnN0IHdyaXR0ZW4gPSBhd2FpdCB3cml0ZU1ldHJpY1JlY29yZChcclxuICAgICAgICBkeW5hbW9EQldyaXRlckNvbmZpZyxcclxuICAgICAgICBhcGlSZXNwb25zZSxcclxuICAgICAgICB0aW1lV2luZG93LmZyb20gLy8gVXNlICdmcm9tJyBhcyBzbG90IHRpbWUgKFJlcXVpcmVtZW50IDMuMilcclxuICAgICk7XHJcblxyXG4gICAgaWYgKHdyaXR0ZW4pIHtcclxuICAgICAgICBjb25zb2xlLmxvZygnTWVzc2FnZSBwcm9jZXNzZWQgc3VjY2Vzc2Z1bGx5Jywge1xyXG4gICAgICAgICAgICBtZXNzYWdlSWQ6IHJlY29yZC5tZXNzYWdlSWQsXHJcbiAgICAgICAgICAgIHNsb3RUaW1lOiB0aW1lV2luZG93LmZyb20sXHJcbiAgICAgICAgICAgIGNvdW50OiBhcGlSZXNwb25zZS5jb3VudCxcclxuICAgICAgICB9KTtcclxuICAgIH0gZWxzZSB7XHJcbiAgICAgICAgY29uc29sZS5sb2coJ01lc3NhZ2UgcHJvY2Vzc2VkIChkdXBsaWNhdGUgcHJldmVudGVkKScsIHtcclxuICAgICAgICAgICAgbWVzc2FnZUlkOiByZWNvcmQubWVzc2FnZUlkLFxyXG4gICAgICAgICAgICBzbG90VGltZTogdGltZVdpbmRvdy5mcm9tLFxyXG4gICAgICAgIH0pO1xyXG4gICAgfVxyXG59XHJcblxyXG4vKipcclxuICogQ29sbGVjdG9yIExhbWJkYSBIYW5kbGVyXHJcbiAqIFxyXG4gKiBUcmlnZ2VyZWQgYnkgU1FTIG1lc3NhZ2VzIGNvbnRhaW5pbmcgdGltZSB3aW5kb3dzLlxyXG4gKiBGZXRjaGVzIHJlc3BvbnNlIGNvdW50IGZyb20gQUkgRW1wbG95ZWUgQVBJIGFuZCBzdG9yZXMgaW4gRHluYW1vREIuXHJcbiAqIFxyXG4gKiBSZXF1aXJlbWVudHM6IDIuMSwgMi4yLCAyLjMsIDMuMSwgMy4yLCAzLjMsIDMuNCwgNy4xLCA3LjIsIDcuNFxyXG4gKiBcclxuICogQHBhcmFtIGV2ZW50IC0gU1FTIGV2ZW50IGNvbnRhaW5pbmcgb25lIG9yIG1vcmUgbWVzc2FnZXNcclxuICovXHJcbmV4cG9ydCBhc3luYyBmdW5jdGlvbiBoYW5kbGVyKGV2ZW50OiBTUVNFdmVudCk6IFByb21pc2U8dm9pZD4ge1xyXG4gICAgY29uc29sZS5sb2coJ0NvbGxlY3RvciBMYW1iZGEgdHJpZ2dlcmVkJywge1xyXG4gICAgICAgIHRpbWVzdGFtcDogbmV3IERhdGUoKS50b0lTT1N0cmluZygpLFxyXG4gICAgICAgIG1lc3NhZ2VDb3VudDogZXZlbnQuUmVjb3Jkcy5sZW5ndGgsXHJcbiAgICB9KTtcclxuXHJcbiAgICAvLyBMb2FkIGNvbmZpZ3VyYXRpb24gZnJvbSBlbnZpcm9ubWVudCB2YXJpYWJsZXMgKFJlcXVpcmVtZW50IDcuNClcclxuICAgIGNvbnN0IGNvbmZpZyA9IGxvYWRDb25maWcoKTtcclxuXHJcbiAgICBjb25zb2xlLmxvZygnQ29uZmlndXJhdGlvbiBsb2FkZWQnLCB7XHJcbiAgICAgICAgYXBpQmFzZVVybDogY29uZmlnLmFwaUJhc2VVcmwsXHJcbiAgICAgICAgdGFibGVOYW1lOiBjb25maWcudGFibGVOYW1lLFxyXG4gICAgfSk7XHJcblxyXG4gICAgLy8gUHJvY2VzcyBlYWNoIFNRUyBtZXNzYWdlXHJcbiAgICBmb3IgKGNvbnN0IHJlY29yZCBvZiBldmVudC5SZWNvcmRzKSB7XHJcbiAgICAgICAgdHJ5IHtcclxuICAgICAgICAgICAgYXdhaXQgcHJvY2Vzc01lc3NhZ2UocmVjb3JkLCBjb25maWcpO1xyXG4gICAgICAgIH0gY2F0Y2ggKGVycm9yKSB7XHJcbiAgICAgICAgICAgIC8vIFJlcXVpcmVtZW50cyA3LjEsIDcuMjogTG9nIGVycm9yIGRldGFpbHMgYW5kIHJlLXRocm93XHJcbiAgICAgICAgICAgIC8vIFRoaXMgd2lsbCBjYXVzZSB0aGUgbWVzc2FnZSB0byBiZSByZXRyaWVkIGJ5IFNRU1xyXG4gICAgICAgICAgICBjb25zb2xlLmVycm9yKCdGYWlsZWQgdG8gcHJvY2VzcyBtZXNzYWdlJywge1xyXG4gICAgICAgICAgICAgICAgbWVzc2FnZUlkOiByZWNvcmQubWVzc2FnZUlkLFxyXG4gICAgICAgICAgICAgICAgZXJyb3I6IGVycm9yIGluc3RhbmNlb2YgRXJyb3IgPyBlcnJvci5tZXNzYWdlIDogU3RyaW5nKGVycm9yKSxcclxuICAgICAgICAgICAgICAgIHN0YWNrOiBlcnJvciBpbnN0YW5jZW9mIEVycm9yID8gZXJyb3Iuc3RhY2sgOiB1bmRlZmluZWQsXHJcbiAgICAgICAgICAgIH0pO1xyXG5cclxuICAgICAgICAgICAgLy8gUmUtdGhyb3cgdG8gdHJpZ2dlciBTUVMgcmV0cnlcclxuICAgICAgICAgICAgdGhyb3cgZXJyb3I7XHJcbiAgICAgICAgfVxyXG4gICAgfVxyXG5cclxuICAgIGNvbnNvbGUubG9nKCdDb2xsZWN0b3IgTGFtYmRhIGNvbXBsZXRlZCcsIHtcclxuICAgICAgICB0aW1lc3RhbXA6IG5ldyBEYXRlKCkudG9JU09TdHJpbmcoKSxcclxuICAgICAgICBwcm9jZXNzZWRDb3VudDogZXZlbnQuUmVjb3Jkcy5sZW5ndGgsXHJcbiAgICB9KTtcclxufVxyXG4iXX0=