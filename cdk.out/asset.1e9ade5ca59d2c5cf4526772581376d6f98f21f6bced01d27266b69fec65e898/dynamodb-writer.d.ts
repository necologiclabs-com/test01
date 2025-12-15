import { ApiResponse } from '../shared/types';
/**
 * DynamoDB Writer Configuration
 * Requirements: 3.1, 3.2, 3.3, 3.4
 */
export interface DynamoDBWriterConfig {
    tableName: string;
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
export declare function writeMetricRecord(config: DynamoDBWriterConfig, apiResponse: ApiResponse, slotTime: string): Promise<boolean>;
