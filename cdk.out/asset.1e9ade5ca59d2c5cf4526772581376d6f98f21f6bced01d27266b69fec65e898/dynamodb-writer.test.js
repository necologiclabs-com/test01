"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
const vitest_1 = require("vitest");
const fc = __importStar(require("fast-check"));
const dynamodb_writer_1 = require("./dynamodb-writer");
const lib_dynamodb_1 = require("@aws-sdk/lib-dynamodb");
/**
 * Property-based tests for DynamoDB writer
 * Requirements: 3.4
 */
// Mock the DynamoDB client
vitest_1.vi.mock('@aws-sdk/lib-dynamodb', async () => {
    const actual = await vitest_1.vi.importActual('@aws-sdk/lib-dynamodb');
    return {
        ...actual,
        DynamoDBDocumentClient: {
            from: vitest_1.vi.fn(() => ({
                send: vitest_1.vi.fn(),
            })),
        },
    };
});
(0, vitest_1.describe)('DynamoDB Writer Property Tests', () => {
    let mockSend;
    let writtenRecords;
    (0, vitest_1.beforeEach)(() => {
        // Reset the in-memory store for each test
        writtenRecords = new Map();
        // Mock the send function to simulate DynamoDB behavior
        mockSend = vitest_1.vi.fn(async (command) => {
            if (command instanceof lib_dynamodb_1.PutCommand) {
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
        vitest_1.vi.mocked(lib_dynamodb_1.DynamoDBDocumentClient.from).mockReturnValue({
            send: mockSend,
        });
    });
    /**
     * **Feature: data-collection-scheduler, Property 9: 冪等な DynamoDB 書き込み**
     * **Validates: Requirements 3.4**
     *
     * For any metric record, writing the same record (same metricName and slotTime) multiple times
     * should result in exactly one record in the table with consistent data.
     */
    (0, vitest_1.it)('Property 9: Idempotent DynamoDB writes', async () => {
        await fc.assert(fc.asyncProperty(
        // Generate random metric data
        fc.date({ min: new Date('2020-01-01'), max: new Date('2030-12-31') }), fc.integer({ min: 0, max: 10 }), fc.integer({ min: 2, max: 5 }), // Number of write attempts
        async (slotDate, count, writeAttempts) => {
            // Reset for each property iteration
            writtenRecords.clear();
            // Create slot time (5-second aligned)
            const seconds = slotDate.getUTCSeconds();
            const truncatedSeconds = Math.floor(seconds / 5) * 5;
            slotDate.setUTCSeconds(truncatedSeconds, 0);
            const slotTime = slotDate.toISOString();
            // Create API response
            const apiResponse = {
                from: slotTime,
                to: new Date(slotDate.getTime() + 5000).toISOString(),
                count,
            };
            const config = {
                tableName: 'test-table',
            };
            // Attempt to write the same record multiple times
            const results = [];
            for (let i = 0; i < writeAttempts; i++) {
                const result = await (0, dynamodb_writer_1.writeMetricRecord)(config, apiResponse, slotTime);
                results.push(result);
            }
            // Verify idempotency: first write succeeds, subsequent writes return false (duplicate prevented)
            (0, vitest_1.expect)(results[0]).toBe(true); // First write should succeed
            for (let i = 1; i < writeAttempts; i++) {
                (0, vitest_1.expect)(results[i]).toBe(false); // Subsequent writes should be prevented
            }
            // Verify exactly one record exists in the "table"
            const key = `ai_response_count#${slotTime}`;
            (0, vitest_1.expect)(writtenRecords.has(key)).toBe(true);
            (0, vitest_1.expect)(writtenRecords.size).toBe(1);
            // Verify the record has consistent data
            const storedRecord = writtenRecords.get(key);
            (0, vitest_1.expect)(storedRecord.metricName).toBe('ai_response_count');
            (0, vitest_1.expect)(storedRecord.slotTime).toBe(slotTime);
            (0, vitest_1.expect)(storedRecord.count).toBe(count);
        }), { numRuns: 100 });
    });
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZHluYW1vZGItd3JpdGVyLnRlc3QuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi9sYW1iZGEvY29sbGVjdG9yL2R5bmFtb2RiLXdyaXRlci50ZXN0LnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7O0FBQUEsbUNBQThEO0FBQzlELCtDQUFpQztBQUNqQyx1REFBNEU7QUFFNUUsd0RBQTJFO0FBRTNFOzs7R0FHRztBQUVILDJCQUEyQjtBQUMzQixXQUFFLENBQUMsSUFBSSxDQUFDLHVCQUF1QixFQUFFLEtBQUssSUFBSSxFQUFFO0lBQ3hDLE1BQU0sTUFBTSxHQUFHLE1BQU0sV0FBRSxDQUFDLFlBQVksQ0FBQyx1QkFBdUIsQ0FBQyxDQUFDO0lBQzlELE9BQU87UUFDSCxHQUFHLE1BQU07UUFDVCxzQkFBc0IsRUFBRTtZQUNwQixJQUFJLEVBQUUsV0FBRSxDQUFDLEVBQUUsQ0FBQyxHQUFHLEVBQUUsQ0FBQyxDQUFDO2dCQUNmLElBQUksRUFBRSxXQUFFLENBQUMsRUFBRSxFQUFFO2FBQ2hCLENBQUMsQ0FBQztTQUNOO0tBQ0osQ0FBQztBQUNOLENBQUMsQ0FBQyxDQUFDO0FBRUgsSUFBQSxpQkFBUSxFQUFDLGdDQUFnQyxFQUFFLEdBQUcsRUFBRTtJQUM1QyxJQUFJLFFBQWEsQ0FBQztJQUNsQixJQUFJLGNBQWdDLENBQUM7SUFFckMsSUFBQSxtQkFBVSxFQUFDLEdBQUcsRUFBRTtRQUNaLDBDQUEwQztRQUMxQyxjQUFjLEdBQUcsSUFBSSxHQUFHLEVBQUUsQ0FBQztRQUUzQix1REFBdUQ7UUFDdkQsUUFBUSxHQUFHLFdBQUUsQ0FBQyxFQUFFLENBQUMsS0FBSyxFQUFFLE9BQVksRUFBRSxFQUFFO1lBQ3BDLElBQUksT0FBTyxZQUFZLHlCQUFVLEVBQUUsQ0FBQztnQkFDaEMsTUFBTSxJQUFJLEdBQUcsT0FBTyxDQUFDLEtBQUssQ0FBQyxJQUFJLENBQUM7Z0JBQ2hDLElB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Y3JpYmUsIGl0LCBleHBlY3QsIGJlZm9yZUVhY2gsIHZpIH0gZnJvbSAndml0ZXN0JztcclxuaW1wb3J0ICogYXMgZmMgZnJvbSAnZmFzdC1jaGVjayc7XHJcbmltcG9ydCB7IHdyaXRlTWV0cmljUmVjb3JkLCBEeW5hbW9EQldyaXRlckNvbmZpZyB9IGZyb20gJy4vZHluYW1vZGItd3JpdGVyJztcclxuaW1wb3J0IHsgQXBpUmVzcG9uc2UgfSBmcm9tICcuLi9zaGFyZWQvdHlwZXMnO1xyXG5pbXBvcnQgeyBEeW5hbW9EQkRvY3VtZW50Q2xpZW50LCBQdXRDb21tYW5kIH0gZnJvbSAnQGF3cy1zZGsvbGliLWR5bmFtb2RiJztcclxuXHJcbi8qKlxyXG4gKiBQcm9wZXJ0eS1iYXNlZCB0ZXN0cyBmb3IgRHluYW1vREIgd3JpdGVyXHJcbiAqIFJlcXVpcmVtZW50czogMy40XHJcbiAqL1xyXG5cclxuLy8gTW9jayB0aGUgRHluYW1vREIgY2xpZW50XHJcbnZpLm1vY2soJ0Bhd3Mtc2RrL2xpYi1keW5hbW9kYicsIGFzeW5jICgpID0+IHtcclxuICAgIGNvbnN0IGFjdHVhbCA9IGF3YWl0IHZpLmltcG9ydEFjdHVhbCgnQGF3cy1zZGsvbGliLWR5bmFtb2RiJyk7XHJcbiAgICByZXR1cm4ge1xyXG4gICAgICAgIC4uLmFjdHVhbCxcclxuICAgICAgICBEeW5hbW9EQkRvY3VtZW50Q2xpZW50OiB7XHJcbiAgICAgICAgICAgIGZyb206IHZpLmZuKCgpID0+ICh7XHJcbiAgICAgICAgICAgICAgICBzZW5kOiB2aS5mbigpLFxyXG4gICAgICAgICAgICB9KSksXHJcbiAgICAgICAgfSxcclxuICAgIH07XHJcbn0pO1xyXG5cclxuZGVzY3JpYmUoJ0R5bmFtb0RCIFdyaXRlciBQcm9wZXJ0eSBUZXN0cycsICgpID0+IHtcclxuICAgIGxldCBtb2NrU2VuZDogYW55O1xyXG4gICAgbGV0IHdyaXR0ZW5SZWNvcmRzOiBNYXA8c3RyaW5nLCBhbnk+O1xyXG5cclxuICAgIGJlZm9yZUVhY2goKCkgPT4ge1xyXG4gICAgICAgIC8vIFJlc2V0IHRoZSBpbi1tZW1vcnkgc3RvcmUgZm9yIGVhY2ggdGVzdFxyXG4gICAgICAgIHdyaXR0ZW5SZWNvcmRzID0gbmV3IE1hcCgpO1xyXG5cclxuICAgICAgICAvLyBNb2NrIHRoZSBzZW5kIGZ1bmN0aW9uIHRvIHNpbXVsYXRlIER5bmFtb0RCIGJlaGF2aW9yXHJcbiAgICAgICAgbW9ja1NlbmQgPSB2aS5mbihhc3luYyAoY29tbWFuZDogYW55KSA9PiB7XHJcbiAgICAgICAgICAgIGlmIChjb21tYW5kIGluc3RhbmNlb2YgUHV0Q29tbWFuZCkge1xyXG4gICAgICAgICAgICAgICAgY29uc3QgaXRlbSA9IGNvbW1hbmQuaW5wdXQuSXRlbTtcclxuICAgICAgICAgICAgICAgIGlmICghaXRlbSkge1xyXG4gICAgICAgICAgICAgICAgICAgIHRocm93IG5ldyBFcnJvcignSXRlbSBpcyB1bmRlZmluZWQnKTtcclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgIGNvbnN0IGtleSA9IGAke2l0ZW0ubWV0cmljTmFtZX0jJHtpdGVtLnNsb3RUaW1lfWA7XHJcblxyXG4gICAgICAgICAgICAgICAgLy8gU2ltdWxhdGUgY29uZGl0aW9uYWwgY2hlY2s6IGF0dHJpYnV0ZV9ub3RfZXhpc3RzXHJcbiAgICAgICAgICAgICAgICBpZiAod3JpdHRlblJlY29yZHMuaGFzKGtleSkpIHtcclxuICAgICAgICAgICAgICAgICAgICAvLyBTaW11bGF0ZSBDb25kaXRpb25hbENoZWNrRmFpbGVkRXhjZXB0aW9uXHJcbiAgICAgICAgICAgICAgICAgICAgY29uc3QgZXJyb3IgPSBuZXcgRXJyb3IoJ1RoZSBjb25kaXRpb25hbCByZXF1ZXN0IGZhaWxlZCcpO1xyXG4gICAgICAgICAgICAgICAgICAgIGVycm9yLm5hbWUgPSAnQ29uZGl0aW9uYWxDaGVja0ZhaWxlZEV4Y2VwdGlvbic7XHJcbiAgICAgICAgICAgICAgICAgICAgdGhyb3cgZXJyb3I7XHJcbiAgICAgICAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgICAgICAgLy8gV3JpdGUgdGhlIHJlY29yZFxyXG4gICAgICAgICAgICAgICAgd3JpdHRlblJlY29yZHMuc2V0KGtleSwgaXRlbSk7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgcmV0dXJuIHt9O1xyXG4gICAgICAgIH0pO1xyXG5cclxuICAgICAgICAvLyBSZXBsYWNlIHRoZSBtb2NrIGltcGxlbWVudGF0aW9uXHJcbiAgICAgICAgdmkubW9ja2VkKER5bmFtb0RCRG9jdW1lbnRDbGllbnQuZnJvbSkubW9ja1JldHVyblZhbHVlKHtcclxuICAgICAgICAgICAgc2VuZDogbW9ja1NlbmQsXHJcbiAgICAgICAgfSBhcyBhbnkpO1xyXG4gICAgfSk7XHJcblxyXG4gICAgLyoqXHJcbiAgICAgKiAqKkZlYXR1cmU6IGRhdGEtY29sbGVjdGlvbi1zY2hlZHVsZXIsIFByb3BlcnR5IDk6IOWGquetieOBqiBEeW5hbW9EQiDmm7jjgY3ovrzjgb8qKlxyXG4gICAgICogKipWYWxpZGF0ZXM6IFJlcXVpcmVtZW50cyAzLjQqKlxyXG4gICAgICogXHJcbiAgICAgKiBGb3IgYW55IG1ldHJpYyByZWNvcmQsIHdyaXRpbmcgdGhlIHNhbWUgcmVjb3JkIChzYW1lIG1ldHJpY05hbWUgYW5kIHNsb3RUaW1lKSBtdWx0aXBsZSB0aW1lc1xyXG4gICAgICogc2hvdWxkIHJlc3VsdCBpbiBleGFjdGx5IG9uZSByZWNvcmQgaW4gdGhlIHRhYmxlIHdpdGggY29uc2lzdGVudCBkYXRhLlxyXG4gICAgICovXHJcbiAgICBpdCgnUHJvcGVydHkgOTogSWRlbXBvdGVudCBEeW5hbW9EQiB3cml0ZXMnLCBhc3luYyAoKSA9PiB7XHJcbiAgICAgICAgYXdhaXQgZmMuYXNzZXJ0KFxyXG4gICAgICAgICAgICBmYy5hc3luY1Byb3BlcnR5KFxyXG4gICAgICAgICAgICAgICAgLy8gR2VuZXJhdGUgcmFuZG9tIG1ldHJpYyBkYXRhXHJcbiAgICAgICAgICAgICAgICBmYy5kYXRlKHsgbWluOiBuZXcgRGF0ZSgnMjAyMC0wMS0wMScpLCBtYXg6IG5ldyBEYXRlKCcyMDMwLTEyLTMxJykgfSksXHJcbiAgICAgICAgICAgICAgICBmYy5pbnRlZ2VyKHsgbWluOiAwLCBtYXg6IDEwIH0pLFxyXG4gICAgICAgICAgICAgICAgZmMuaW50ZWdlcih7IG1pbjogMiwgbWF4OiA1IH0pLCAvLyBOdW1iZXIgb2Ygd3JpdGUgYXR0ZW1wdHNcclxuICAgICAgICAgICAgICAgIGFzeW5jIChzbG90RGF0ZSwgY291bnQsIHdyaXRlQXR0ZW1wdHMpID0+IHtcclxuICAgICAgICAgICAgICAgICAgICAvLyBSZXNldCBmb3IgZWFjaCBwcm9wZXJ0eSBpdGVyYXRpb25cclxuICAgICAgICAgICAgICAgICAgICB3cml0dGVuUmVjb3Jkcy5jbGVhcigpO1xyXG5cclxuICAgICAgICAgICAgICAgICAgICAvLyBDcmVhdGUgc2xvdCB0aW1lICg1LXNlY29uZCBhbGlnbmVkKVxyXG4gICAgICAgICAgICAgICAgICAgIGNvbnN0IHNlY29uZHMgPSBzbG90RGF0ZS5nZXRVVENTZWNvbmRzKCk7XHJcbiAgICAgICAgICAgICAgICAgICAgY29uc3QgdHJ1bmNhdGVkU2Vjb25kcyA9IE1hdGguZmxvb3Ioc2Vjb25kcyAvIDUpICogNTtcclxuICAgICAgICAgICAgICAgICAgICBzbG90RGF0ZS5zZXRVVENTZWNvbmRzKHRydW5jYXRlZFNlY29uZHMsIDApO1xyXG4gICAgICAgICAgICAgICAgICAgIGNvbnN0IHNsb3RUaW1lID0gc2xvdERhdGUudG9JU09TdHJpbmcoKTtcclxuXHJcbiAgICAgICAgICAgICAgICAgICAgLy8gQ3JlYXRlIEFQSSByZXNwb25zZVxyXG4gICAgICAgICAgICAgICAgICAgIGNvbnN0IGFwaVJlc3BvbnNlOiBBcGlSZXNwb25zZSA9IHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgZnJvbTogc2xvdFRpbWUsXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHRvOiBuZXcgRGF0ZShzbG90RGF0ZS5nZXRUaW1lKCkgKyA1MDAwKS50b0lTT1N0cmluZygpLFxyXG4gICAgICAgICAgICAgICAgICAgICAgICBjb3VudCxcclxuICAgICAgICAgICAgICAgICAgICB9O1xyXG5cclxuICAgICAgICAgICAgICAgICAgICBjb25zdCBjb25maWc6IER5bmFtb0RCV3JpdGVyQ29uZmlnID0ge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICB0YWJsZU5hbWU6ICd0ZXN0LXRhYmxlJyxcclxuICAgICAgICAgICAgICAgICAgICB9O1xyXG5cclxuICAgICAgICAgICAgICAgICAgICAvLyBBdHRlbXB0IHRvIHdyaXRlIHRoZSBzYW1lIHJlY29yZCBtdWx0aXBsZSB0aW1lc1xyXG4gICAgICAgICAgICAgICAgICAgIGNvbnN0IHJlc3VsdHM6IGJvb2xlYW5bXSA9IFtdO1xyXG4gICAgICAgICAgICAgICAgICAgIGZvciAobGV0IGkgPSAwOyBpIDwgd3JpdGVBdHRlbXB0czsgaSsrKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGNvbnN0IHJlc3VsdCA9IGF3YWl0IHdyaXRlTWV0cmljUmVjb3JkKGNvbmZpZywgYXBpUmVzcG9uc2UsIHNsb3RUaW1lKTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgcmVzdWx0cy5wdXNoKHJlc3VsdCk7XHJcbiAgICAgICAgICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgICAgICAgICAvLyBWZXJpZnkgaWRlbXBvdGVuY3k6IGZpcnN0IHdyaXRlIHN1Y2NlZWRzLCBzdWJzZXF1ZW50IHdyaXRlcyByZXR1cm4gZmFsc2UgKGR1cGxpY2F0ZSBwcmV2ZW50ZWQpXHJcbiAgICAgICAgICAgICAgICAgICAgZXhwZWN0KHJlc3VsdHNbMF0pLnRvQmUodHJ1ZSk7IC8vIEZpcnN0IHdyaXRlIHNob3VsZCBzdWNjZWVkXHJcbiAgICAgICAgICAgICAgICAgICAgZm9yIChsZXQgaSA9IDE7IGkgPCB3cml0ZUF0dGVtcHRzOyBpKyspIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgZXhwZWN0KHJlc3VsdHNbaV0pLnRvQmUoZmFsc2UpOyAvLyBTdWJzZXF1ZW50IHdyaXRlcyBzaG91bGQgYmUgcHJldmVudGVkXHJcbiAgICAgICAgICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgICAgICAgICAvLyBWZXJpZnkgZXhhY3RseSBvbmUgcmVjb3JkIGV4aXN0cyBpbiB0aGUgXCJ0YWJsZVwiXHJcbiAgICAgICAgICAgICAgICAgICAgY29uc3Qga2V5ID0gYGFpX3Jlc3BvbnNlX2NvdW50IyR7c2xvdFRpbWV9YDtcclxuICAgICAgICAgICAgICAgICAgICBleHBlY3Qod3JpdHRlblJlY29yZHMuaGFzKGtleSkpLnRvQmUodHJ1ZSk7XHJcbiAgICAgICAgICAgICAgICAgICAgZXhwZWN0KHdyaXR0ZW5SZWNvcmRzLnNpemUpLnRvQmUoMSk7XHJcblxyXG4gICAgICAgICAgICAgICAgICAgIC8vIFZlcmlmeSB0aGUgcmVjb3JkIGhhcyBjb25zaXN0ZW50IGRhdGFcclxuICAgICAgICAgICAgICAgICAgICBjb25zdCBzdG9yZWRSZWNvcmQgPSB3cml0dGVuUmVjb3Jkcy5nZXQoa2V5KTtcclxuICAgICAgICAgICAgICAgICAgICBleHBlY3Qoc3RvcmVkUmVjb3JkLm1ldHJpY05hbWUpLnRvQmUoJ2FpX3Jlc3BvbnNlX2NvdW50Jyk7XHJcbiAgICAgICAgICAgICAgICAgICAgZXhwZWN0KHN0b3JlZFJlY29yZC5zbG90VGltZSkudG9CZShzbG90VGltZSk7XHJcbiAgICAgICAgICAgICAgICAgICAgZXhwZWN0KHN0b3JlZFJlY29yZC5jb3VudCkudG9CZShjb3VudCk7XHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICksXHJcbiAgICAgICAgICAgIHsgbnVtUnVuczogMTAwIH1cclxuICAgICAgICApO1xyXG4gICAgfSk7XHJcbn0pO1xyXG4iXX0=