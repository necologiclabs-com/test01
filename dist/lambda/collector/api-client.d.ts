import { ScheduleMessage, ApiResponse } from '../shared/types';
/**
 * API Client Configuration
 * Requirements: 2.1, 2.2, 2.3
 */
export interface ApiClientConfig {
    baseUrl: string;
}
/**
 * Builds the API URL with ISO8601 formatted query parameters
 *
 * Requirements: 2.2
 *
 * @param baseUrl - Base URL of the AI Employee API
 * @param from - ISO8601 timestamp (start of time window)
 * @param to - ISO8601 timestamp (end of time window)
 * @returns Complete URL with query parameters
 */
export declare function buildApiUrl(baseUrl: string, from: string, to: string): string;
/**
 * Fetches response count from AI Employee API
 *
 * Requirements: 2.1, 2.2, 2.3
 *
 * @param config - API client configuration
 * @param timeWindow - Time window from SQS message
 * @returns API response with from, to, and count
 * @throws Error if API call fails or returns invalid response
 */
export declare function fetchResponseCount(config: ApiClientConfig, timeWindow: ScheduleMessage): Promise<ApiResponse>;
