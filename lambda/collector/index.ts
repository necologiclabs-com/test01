import { SQSEvent, SQSRecord } from 'aws-lambda';
import { ScheduleMessage } from '../shared/types';
import { fetchResponseCount, ApiClientConfig } from './api-client';
import { writeMetricRecord, DynamoDBWriterConfig } from './dynamodb-writer';

/**
 * Collector Lambda Configuration
 * Requirements: 7.1, 7.2, 7.4
 */
interface CollectorConfig {
    apiBaseUrl: string; // AI_API_BASE_URL environment variable
    tableName: string; // AI_METRICS_TABLE_NAME environment variable
}

/**
 * Loads configuration from environment variables
 * 
 * Requirements: 7.1, 7.2, 7.4
 * 
 * @returns Configuration object
 * @throws Error if required environment variables are missing
 */
function loadConfig(): CollectorConfig {
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
async function processMessage(record: SQSRecord, config: CollectorConfig): Promise<void> {
    console.log('Processing SQS message', {
        messageId: record.messageId,
        timestamp: new Date().toISOString(),
    });

    // Parse SQS message body to get time window (Requirement 2.1)
    const timeWindow: ScheduleMessage = JSON.parse(record.body);

    console.log('Time window extracted from message', {
        from: timeWindow.from,
        to: timeWindow.to,
    });

    // Fetch response count from AI Employee API (Requirements 2.2, 2.3)
    const apiClientConfig: ApiClientConfig = {
        baseUrl: config.apiBaseUrl,
    };

    const apiResponse = await fetchResponseCount(apiClientConfig, timeWindow);

    console.log('API response received', {
        from: apiResponse.from,
        to: apiResponse.to,
        count: apiResponse.count,
    });

    // Write metric record to DynamoDB (Requirements 3.1, 3.2, 3.3, 3.4)
    // Use 'from' as slot time (already 5-second aligned from Sender Lambda)
    const dynamoDBWriterConfig: DynamoDBWriterConfig = {
        tableName: config.tableName,
    };

    const written = await writeMetricRecord(
        dynamoDBWriterConfig,
        apiResponse,
        timeWindow.from // Use 'from' as slot time (Requirement 3.2)
    );

    if (written) {
        console.log('Message processed successfully', {
            messageId: record.messageId,
            slotTime: timeWindow.from,
            count: apiResponse.count,
        });
    } else {
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
export async function handler(event: SQSEvent): Promise<void> {
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
        } catch (error) {
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
