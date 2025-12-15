import { ScheduleMessage, ApiResponse } from '../shared/types';

/**
 * API Client Configuration
 * Requirements: 2.1, 2.2, 2.3
 */
export interface ApiClientConfig {
    baseUrl: string; // AI_API_BASE_URL environment variable
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
export function buildApiUrl(baseUrl: string, from: string, to: string): string {
    // Ensure baseUrl doesn't end with a slash
    const cleanBaseUrl = baseUrl.endsWith('/') ? baseUrl.slice(0, -1) : baseUrl;

    // Build URL with ISO8601 query parameters
    const url = `${cleanBaseUrl}/response_count?from=${encodeURIComponent(from)}&to=${encodeURIComponent(to)}`;

    return url;
}

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
export async function fetchResponseCount(
    config: ApiClientConfig,
    timeWindow: ScheduleMessage
): Promise<ApiResponse> {
    const url = buildApiUrl(config.baseUrl, timeWindow.from, timeWindow.to);

    console.log('Calling AI Employee API', { url, from: timeWindow.from, to: timeWindow.to });

    try {
        const response = await fetch(url);

        if (!response.ok) {
            throw new Error(`API returned status ${response.status}: ${response.statusText}`);
        }

        const data = await response.json() as ApiResponse;

        // Validate response structure (Requirement 2.3)
        if (!data.from || !data.to || typeof data.count !== 'number') {
            throw new Error('Invalid API response structure: missing from, to, or count fields');
        }

        console.log('API response received', { from: data.from, to: data.to, count: data.count });

        return data;
    } catch (error) {
        // Requirement 7.1: Log error details and re-throw
        console.error('Failed to fetch response count from API', {
            url,
            from: timeWindow.from,
            to: timeWindow.to,
            error: error instanceof Error ? error.message : String(error),
        });

        throw error;
    }
}
