import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import * as fc from 'fast-check';
import { app, server } from './index';

interface ApiResponse {
    from: string;
    to: string;
    count: number;
}

describe('Mock API Property Tests', () => {
    // Close server after tests
    afterAll(() => {
        server.close();
    });

    /**
     * **Feature: data-collection-scheduler, Property 7: モック API レスポンス構造と境界**
     * **Validates: Requirements 5.1, 5.2**
     * 
     * For any valid time window query, the response must:
     * - Include from, to, and count fields
     * - Have count as an integer between 0 and 10
     * - Always generate the same count for the same input (deterministic)
     */
    it('Property 7: response structure and boundaries are correct', async () => {
        await fc.assert(
            fc.asyncProperty(
                // Generate valid ISO8601 timestamps
                fc.date({ min: new Date('2020-01-01'), max: new Date('2030-12-31') }),
                fc.integer({ min: 5, max: 60 }), // Duration in seconds
                async (fromDate, durationSeconds) => {
                    const toDate = new Date(fromDate.getTime() + durationSeconds * 1000);
                    const from = fromDate.toISOString();
                    const to = toDate.toISOString();

                    // Make request to the API
                    const response = await fetch(
                        `http://localhost:3000/response_count?from=${encodeURIComponent(from)}&to=${encodeURIComponent(to)}`
                    );

                    expect(response.status).toBe(200);
                    const data = await response.json() as ApiResponse;

                    // Check 1: Response must include from, to, and count fields
                    expect(data).toHaveProperty('from');
                    expect(data).toHaveProperty('to');
                    expect(data).toHaveProperty('count');

                    // Check 2: from and to should match the query parameters
                    expect(data.from).toBe(from);
                    expect(data.to).toBe(to);

                    // Check 3: count must be an integer between 0 and 10
                    expect(Number.isInteger(data.count)).toBe(true);
                    expect(data.count).toBeGreaterThanOrEqual(0);
                    expect(data.count).toBeLessThanOrEqual(10);

                    // Check 4: Deterministic - same input should produce same output
                    const response2 = await fetch(
                        `http://localhost:3000/response_count?from=${encodeURIComponent(from)}&to=${encodeURIComponent(to)}`
                    );
                    const data2 = await response2.json() as ApiResponse;
                    expect(data2.count).toBe(data.count);

                    // Check 5: Count should be based on minute value (minute % 11)
                    const expectedCount = toDate.getUTCMinutes() % 11;
                    expect(data.count).toBe(expectedCount);
                }
            ),
            { numRuns: 100 }
        );
    });

    /**
     * **Feature: data-collection-scheduler, Property 8: モック API の ISO8601 パース**
     * **Validates: Requirements 5.3**
     * 
     * For any valid ISO8601 datetime string, the mock API must:
     * - Parse it to a Date object
     * - Format it back to ISO8601 to produce an equivalent timestamp
     */
    it('Property 8: ISO8601 parsing round-trip', async () => {
        await fc.assert(
            fc.asyncProperty(
                // Generate valid ISO8601 timestamps
                fc.date({ min: new Date('2020-01-01'), max: new Date('2030-12-31') }),
                async (timestamp) => {
                    const iso8601String = timestamp.toISOString();
                    const from = iso8601String;
                    const to = new Date(timestamp.getTime() + 5000).toISOString();

                    // Make request to the API
                    const response = await fetch(
                        `http://localhost:3000/response_count?from=${encodeURIComponent(from)}&to=${encodeURIComponent(to)}`
                    );

                    expect(response.status).toBe(200);
                    const data = await response.json() as ApiResponse;

                    // Check 1: API should accept and return the ISO8601 strings
                    expect(data.from).toBe(from);
                    expect(data.to).toBe(to);

                    // Check 2: Returned strings should be parseable back to Date
                    const parsedFrom = new Date(data.from);
                    const parsedTo = new Date(data.to);
                    expect(parsedFrom.toString()).not.toBe('Invalid Date');
                    expect(parsedTo.toString()).not.toBe('Invalid Date');

                    // Check 3: Round-trip should preserve the timestamp
                    expect(parsedFrom.toISOString()).toBe(from);
                    expect(parsedTo.toISOString()).toBe(to);
                }
            ),
            { numRuns: 100 }
        );
    });

    // Edge case: Missing query parameters
    it('returns 400 when query parameters are missing', async () => {
        const response1 = await fetch('http://localhost:3000/response_count');
        expect(response1.status).toBe(400);

        const response2 = await fetch('http://localhost:3000/response_count?from=2025-01-01T00:00:00Z');
        expect(response2.status).toBe(400);

        const response3 = await fetch('http://localhost:3000/response_count?to=2025-01-01T00:00:00Z');
        expect(response3.status).toBe(400);
    });

    // Edge case: Invalid ISO8601 format
    it('returns 400 when ISO8601 format is invalid', async () => {
        const response = await fetch(
            'http://localhost:3000/response_count?from=invalid-date&to=2025-01-01T00:00:00Z'
        );
        expect(response.status).toBe(400);
    });
});
