import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';

export const handler = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
    console.log('Mock API Lambda invoked', { path: event.path, queryStringParameters: event.queryStringParameters });

    // Health check endpoint
    if (event.path === '/health') {
        return {
            statusCode: 200,
            body: JSON.stringify({ status: 'ok' }),
            headers: {
                'Content-Type': 'application/json',
            },
        };
    }

    // /response_count endpoint
    if (event.path === '/response_count') {
        const from = event.queryStringParameters?.from;
        const to = event.queryStringParameters?.to;

        // Validate query parameters
        if (!from || !to) {
            return {
                statusCode: 400,
                body: JSON.stringify({
                    error: 'Missing required query parameters: from and to'
                }),
                headers: {
                    'Content-Type': 'application/json',
                },
            };
        }

        // Parse ISO8601 timestamps
        const fromDate = new Date(from);
        const toDate = new Date(to);

        // Validate parsed dates
        if (isNaN(fromDate.getTime()) || isNaN(toDate.getTime())) {
            return {
                statusCode: 400,
                body: JSON.stringify({
                    error: 'Invalid ISO8601 format for from or to parameter'
                }),
                headers: {
                    'Content-Type': 'application/json',
                },
            };
        }

        // Calculate more realistic count with variation
        // Use time-based seed for deterministic but varied results
        const hour = toDate.getUTCHours();
        const minute = toDate.getUTCMinutes();
        const second = toDate.getUTCSeconds();

        // Create pseudo-random but deterministic count (0-100)
        // Simulate business hours pattern: higher during 9-17, lower at night
        const baseCount = hour >= 9 && hour <= 17 ? 50 : 20;
        const variation = (hour * 7 + minute * 3 + second) % 40;
        const count = Math.min(100, Math.max(0, baseCount + variation - 20));

        console.log('Returning response count', { from, to, hour, minute, count });

        return {
            statusCode: 200,
            body: JSON.stringify({
                from,
                to,
                count
            }),
            headers: {
                'Content-Type': 'application/json',
            },
        };
    }

    // 404 for unknown paths
    return {
        statusCode: 404,
        body: JSON.stringify({ error: 'Not found' }),
        headers: {
            'Content-Type': 'application/json',
        },
    };
};
