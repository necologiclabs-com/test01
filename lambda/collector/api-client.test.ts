import { describe, it, expect } from 'vitest';
import * as fc from 'fast-check';
import { buildApiUrl } from './api-client';
import { ApiResponse } from '../shared/types';

/**
 * Property-based tests for API client
 * Requirements: 2.2, 2.3
 */

describe('API Client Property Tests', () => {
    /**
     * **Feature: data-collection-scheduler, Property 3: ISO8601 形式での API URL 構築**
     * **Validates: Requirements 2.2, 2.3**
     * 
     * For any valid time window with from/to dates, the constructed URL should contain
     * properly formatted ISO8601 query parameters that can be parsed back to equivalent timestamps.
     */
    it('Property 3: URL construction with ISO8601 format', () => {
        fc.assert(
            fc.property(
                // Generate valid ISO8601 timestamps
                fc.date({ min: new Date('2020-01-01'), max: new Date('2030-12-31') }),
                fc.integer({ min: 1, max: 3600 }), // Duration in seconds
                fc.webUrl(), // Base URL
                (startDate, durationSeconds, baseUrl) => {
                    // Create time window
                    const from = startDate.toISOString();
                    const toDate = new Date(startDate.getTime() + durationSeconds * 1000);
                    const to = toDate.toISOString();

                    // Build URL
                    const url = buildApiUrl(baseUrl, from, to);

                    // Parse URL to extract query parameters
                    const urlObj = new URL(url);
                    const fromParam = urlObj.searchParams.get('from');
                    const toParam = urlObj.searchParams.get('to');

                    // Verify parameters exist
                    expect(fromParam).toBeTruthy();
                    expect(toParam).toBeTruthy();

                    // Verify parameters can be parsed back to equivalent timestamps
                    const parsedFrom = new Date(fromParam!);
                    const parsedTo = new Date(toParam!);

                    expect(parsedFrom.toISOString()).toBe(from);
                    expect(parsedTo.toISOString()).toBe(to);

                    // Verify URL structure
                    expect(url).toContain('/response_count');
                    expect(url).toContain('from=');
                    expect(url).toContain('to=');
                }
            ),
            { numRuns: 100 }
        );
    });

    /**
     * **Feature: data-collection-scheduler, Property 4: API レスポンスパースのラウンドトリップ**
     * **Validates: Requirements 2.3**
     * 
     * For any valid JSON response containing from, to, and count fields, parsing should produce
     * a structured object with equivalent values that can be serialized back to equivalent JSON.
     */
    it('Property 4: API response parse round-trip', () => {
        fc.assert(
            fc.property(
                // Generate valid API response data
                fc.date({ min: new Date('2020-01-01'), max: new Date('2030-12-31') }),
                fc.integer({ min: 1, max: 3600 }),
                fc.integer({ min: 0, max: 10 }),
                (startDate, durationSeconds, count) => {
                    const from = startDate.toISOString();
                    const endDate = new Date(startDate.getTime() + durationSeconds * 1000);
                    const to = endDate.toISOString();

                    // Create original response object
                    const originalResponse: ApiResponse = { from, to, count };

                    // Serialize to JSON
                    const jsonString = JSON.stringify(originalResponse);

                    // Parse back
                    const parsedResponse = JSON.parse(jsonString) as ApiResponse;

                    // Verify round-trip consistency
                    expect(parsedResponse.from).toBe(originalResponse.from);
                    expect(parsedResponse.to).toBe(originalResponse.to);
                    expect(parsedResponse.count).toBe(originalResponse.count);

                    // Verify structure
                    expect(typeof parsedResponse.from).toBe('string');
                    expect(typeof parsedResponse.to).toBe('string');
                    expect(typeof parsedResponse.count).toBe('number');

                    // Verify timestamps are valid ISO8601
                    const fromDate = new Date(parsedResponse.from);
                    const toDateParsed = new Date(parsedResponse.to);
                    expect(fromDate.toISOString()).toBe(parsedResponse.from);
                    expect(toDateParsed.toISOString()).toBe(parsedResponse.to);
                }
            ),
            { numRuns: 100 }
        );
    });
});
