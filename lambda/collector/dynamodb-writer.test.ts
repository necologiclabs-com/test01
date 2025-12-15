import { describe, it, expect, beforeEach, vi } from 'vitest';
import * as fc from 'fast-check';
import { writeMetricRecord, DynamoDBWriterConfig } from './dynamodb-writer';
import { ApiResponse } from '../shared/types';
import { DynamoDBDocumentClient, PutCommand } from '@aws-sdk/lib-dynamodb';

/**
 * Property-based tests for DynamoDB writer
 * Requirements: 3.4
 */

// Mock the DynamoDB client
vi.mock('@aws-sdk/lib-dynamodb', async () => {
    const actual = await vi.importActual('@aws-sdk/lib-dynamodb');
    return {
        ...actual,
        DynamoDBDocumentClient: {
            from: vi.fn(() => ({
                send: vi.fn(),
            })),
        },
    };
});

describe('DynamoDB Writer Property Tests', () => {
    let mockSend: any;
    let writtenRecords: Map<string, any>;

    beforeEach(() => {
        // Reset the in-memory store for each test
        writtenRecords = new Map();

        // Mock the send function to simulate DynamoDB behavior
        mockSend = vi.fn(async (command: any) => {
            if (command instanceof PutCommand) {
                const item = command.input.Item;
                if (!item) {
                    throw new Error('Item is undefined');
                }
                const key = `${item.metricName}#${item.slotTime}`;

                // Simulate conditional check: attribute_not_exists
                if (writtenRecords.has(key)) {
                    // Simulate ConditionalCheckFailedException
                    const error = new Error('The conditional request failed');
                    error.name = 'ConditionalCheckFailedException';
                    throw error;
                }

                // Write the record
                writtenRecords.set(key, item);
            }
            return {};
        });

        // Replace the mock implementation
        vi.mocked(DynamoDBDocumentClient.from).mockReturnValue({
            send: mockSend,
        } as any);
    });

    /**
     * **Feature: data-collection-scheduler, Property 9: 冪等な DynamoDB 書き込み**
     * **Validates: Requirements 3.4**
     * 
     * For any metric record, writing the same record (same metricName and slotTime) multiple times
     * should result in exactly one record in the table with consistent data.
     */
    it('Property 9: Idempotent DynamoDB writes', async () => {
        await fc.assert(
            fc.asyncProperty(
                // Generate random metric data
                fc.date({ min: new Date('2020-01-01'), max: new Date('2030-12-31') }),
                fc.integer({ min: 0, max: 10 }),
                fc.integer({ min: 2, max: 5 }), // Number of write attempts
                async (slotDate, count, writeAttempts) => {
                    // Reset for each property iteration
                    writtenRecords.clear();

                    // Create slot time (5-second aligned)
                    const seconds = slotDate.getUTCSeconds();
                    const truncatedSeconds = Math.floor(seconds / 5) * 5;
                    slotDate.setUTCSeconds(truncatedSeconds, 0);
                    const slotTime = slotDate.toISOString();

                    // Create API response
                    const apiResponse: ApiResponse = {
                        from: slotTime,
                        to: new Date(slotDate.getTime() + 5000).toISOString(),
                        count,
                    };

                    const config: DynamoDBWriterConfig = {
                        tableName: 'test-table',
                    };

                    // Attempt to write the same record multiple times
                    const results: boolean[] = [];
                    for (let i = 0; i < writeAttempts; i++) {
                        const result = await writeMetricRecord(config, apiResponse, slotTime);
                        results.push(result);
                    }

                    // Verify idempotency: first write succeeds, subsequent writes return false (duplicate prevented)
                    expect(results[0]).toBe(true); // First write should succeed
                    for (let i = 1; i < writeAttempts; i++) {
                        expect(results[i]).toBe(false); // Subsequent writes should be prevented
                    }

                    // Verify exactly one record exists in the "table"
                    const key = `ai_response_count#${slotTime}`;
                    expect(writtenRecords.has(key)).toBe(true);
                    expect(writtenRecords.size).toBe(1);

                    // Verify the record has consistent data
                    const storedRecord = writtenRecords.get(key);
                    expect(storedRecord.metricName).toBe('ai_response_count');
                    expect(storedRecord.slotTime).toBe(slotTime);
                    expect(storedRecord.count).toBe(count);
                }
            ),
            { numRuns: 100 }
        );
    });
});
