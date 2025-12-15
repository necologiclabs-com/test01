import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, PutCommand } from '@aws-sdk/lib-dynamodb';
import { MetricRecord, ApiResponse } from '../shared/types';

/**
 * DynamoDB Writer Configuration
 * Requirements: 3.1, 3.2, 3.3, 3.4
 */
export interface DynamoDBWriterConfig {
    tableName: string; // AI_METRICS_TABLE_NAME environment variable
}

/**
 * Writes metric record to DynamoDB with idempotent conditional write
 * 
 * Uses the 'from' timestamp from the SQS message as the slot time (already aligned to 5-second boundary).
 * Implements idempotent writes using attribute_not_exists condition to prevent duplicates.
 * 
 * Requirements: 3.1, 3.2, 3.3, 3.4
 * 
 * @param config - DynamoDB writer configuration
 * @param apiResponse - Response from AI Employee API
 * @param slotTime - Slot time from SQS message (from field, already 5-second aligned)
 * @returns true if record was written, false if duplicate was prevented
 * @throws Error if DynamoDB write fails (except for conditional check failures)
 */
export async function writeMetricRecord(
    config: DynamoDBWriterConfig,
    apiResponse: ApiResponse,
    slotTime: string
): Promise<boolean> {
    // Create DynamoDB client
    const client = new DynamoDBClient({});
    const docClient = DynamoDBDocumentClient.from(client);

    // Build metric record (Requirements 3.1, 3.2, 3.3)
    const record: MetricRecord = {
        metricName: 'ai_response_count', // Partition key (Requirement 3.1)
        slotTime: slotTime, // Sort key - use 'from' as slot time (Requirement 3.2)
        count: apiResponse.count, // Count from API response (Requirement 3.3)
    };

    console.log('Writing metric record to DynamoDB', {
        tableName: config.tableName,
        metricName: record.metricName,
        slotTime: record.slotTime,
        count: record.count,
    });

    try {
        // Idempotent conditional write (Requirement 3.4)
        // Only write if the record doesn't already exist (prevents duplicates)
        const command = new PutCommand({
            TableName: config.tableName,
            Item: record,
            ConditionExpression: 'attribute_not_exists(metricName) AND attribute_not_exists(slotTime)',
        });

        await docClient.send(command);

        console.log('Metric record written successfully', {
            metricName: record.metricName,
            slotTime: record.slotTime,
            count: record.count,
        });

        return true;
    } catch (error) {
        // Handle conditional check failure (duplicate record) - this is expected for idempotency
        if (error instanceof Error && error.name === 'ConditionalCheckFailedException') {
            // Requirement 7.2: Log as informational (expected for idempotency)
            console.info('Duplicate record prevented (idempotent write)', {
                metricName: record.metricName,
                slotTime: record.slotTime,
                message: 'Record already exists, skipping write',
            });

            return false; // Duplicate prevented, but this is success from idempotency perspective
        }

        // Requirement 7.2: Log error details and re-throw for other failures
        console.error('Failed to write metric record to DynamoDB', {
            tableName: config.tableName,
            metricName: record.metricName,
            slotTime: record.slotTime,
            count: record.count,
            error: error instanceof Error ? error.message : String(error),
        });

        throw error;
    }
}
