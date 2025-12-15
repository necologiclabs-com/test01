"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.writeMetricRecord = writeMetricRecord;
const client_dynamodb_1 = require("@aws-sdk/client-dynamodb");
const lib_dynamodb_1 = require("@aws-sdk/lib-dynamodb");
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
async function writeMetricRecord(config, apiResponse, slotTime) {
    // Create DynamoDB client
    const client = new client_dynamodb_1.DynamoDBClient({});
    const docClient = lib_dynamodb_1.DynamoDBDocumentClient.from(client);
    // Build metric record (Requirements 3.1, 3.2, 3.3)
    const record = {
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
        const command = new lib_dynamodb_1.PutCommand({
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
    }
    catch (error) {
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZHluYW1vZGItd3JpdGVyLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vLi4vbGFtYmRhL2NvbGxlY3Rvci9keW5hbW9kYi13cml0ZXIudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7QUEwQkEsOENBaUVDO0FBM0ZELDhEQUEwRDtBQUMxRCx3REFBMkU7QUFXM0U7Ozs7Ozs7Ozs7Ozs7R0FhRztBQUNJLEtBQUssVUFBVSxpQkFBaUIsQ0FDbkMsTUFBNEIsRUFDNUIsV0FBd0IsRUFDeEIsUUFBZ0I7SUFFaEIseUJBQXlCO0lBQ3pCLE1BQU0sTUFBTSxHQUFHLElBQUksZ0NBQWMsQ0FBQyxFQUFFLENBQUMsQ0FBQztJQUN0QyxNQUFNLFNBQVMsR0FBRyxxQ0FBc0IsQ0FBQyxJQUFJLENBQUMsTUFBTSxDQUFDLENBQUM7SUFFdEQsbURBQW1EO0lBQ25ELE1BQU0sTUFBTSxHQUFpQjtRQUN6QixVQUFVLEVBQUUsbUJBQW1CLEVBQUUsa0NBQWtDO1FBQ25FLFFBQVEsRUFBRSxRQUFRLEVBQUUsdURBQXVEO1FBQzNFLEtBQUssRUFBRSxXQUFXLENBQUMsS0FBSyxFQUFFLDRDQUE0QztLQUN6RSxDQUFDO0lBRUYsT0FBTyxDQUFDLEdBQUcsQ0FBQyxtQ0FBbUMsRUFBRTtRQUM3QyxTQUFTLEVBQUUsTUFBTSxDQUFDLFNBQVM7UUFDM0IsVUFBVSxFQUFFLE1BQU0sQ0FBQyxVQUFVO1FBQzdCLFFBQVEsRUFBRSxNQUFNLENBQUMsUUFBUTtRQUN6QixLQUFLLEVBQUUsTUFBTSxDQUFDLEtBQUs7S0FDdEIsQ0FBQyxDQUFDO0lBRUgsSUFBSSxDQUFDO1FBQ0QsaURBQWlEO1FBQ2pELHVFQUF1RTtRQUN2RSxNQUFNLE9BQU8sR0FBRyxJQUFJLHlCQUFVLENBQUM7WUFDM0IsU0FBUyxFQUFFLE1BQU0sQ0FBQyxTQUFTO1lBQzNCLElBQUksRUFBRSxNQUFNO1lBQ1osbUJBQW1CLEVBQUUscUVBQXFFO1NBQzdGLENBQUMsQ0FBQztRQUVILE1BQU0sU0FBUyxDQUFDLElBQUksQ0FBQyxPQUFPLENBQUMsQ0FBQztRQUU5QixPQUFPLENBQUMsR0FBRyxDQUFDLG9DQUFvQyxFQUFFO1lBQzlDLFVBQVUsRUFBRSxNQUFNLENBQUMsVUFBVTtZQUM3QixRQUFRLEVBQUUsTUFBTSxDQUFDLFFBQVE7WUFDekIsS0FBSyxFQUFFLE1BQU0sQ0FBQyxLQUFLO1NBQ3RCLENBQUMsQ0FBQztRQUVILE9BQU8sSUFBSSxDQUFDO0lBQ2hCLENBQUM7SUFBQyxPQUFPLEtBQUssRUFBRSxDQUFDO1FBQ2IseUZBQXlGO1FBQ3pGLElBQUksS0FBSyxZQUFZLEtBQUssSUFBSSxLQUFLLENBQUMsSUFBSSxLQUFLLGlDQUFpQyxFQUFFLENBQUM7WUFDN0UsbUVBQW1FO1lBQ25FLE9BQU8sQ0FBQyxJQUFJLENBQUMsK0NBQStDLEVBQUU7Z0JBQzFELFVBQVUsRUFBRSxNQUFNLENBQUMsVUFBVTtnQkFDN0IsUUFBUSxFQUFFLE1BQU0sQ0FBQyxRQUFRO2dCQUN6QixPQUFPLEVBQUUsdUNBQXVDO2FBQ25ELENBQUMsQ0FBQztZQUVILE9BQU8sS0FBSyxDQUFDLENBQUMsd0VBQXdFO1FBQzFGLENBQUM7UUFFRCxxRUFBcUU7UUFDckUsT0FBTyxDQUFDLEtBQUssQ0FBQywyQ0FBMkMsRUFBRTtZQUN2RCxTQUFTLEVBQUUsTUFBTSxDQUFDLFNBQVM7WUFDM0IsVUFBVSxFQUFFLE1BQU0sQ0FBQyxVQUFVO1lBQzdCLFFBQVEsRUFBRSxNQUFNLENBQUMsUUFBUTtZQUN6QixLQUFLLEVBQUUsTUFBTSxDQUFDLEtBQUs7WUFDbkIsS0FBSyxFQUFFLEtBQUssWUFBWSxLQUFLLENBQUMsQ0FBQyxDQUFDLEtBQUssQ0FBQyxPQUFPLENBQUMsQ0FBQyxDQUFDLE1BQU0sQ0FBQyxLQUFLLENBQUM7U0FDaEUsQ0FBQyxDQUFDO1FBRUgsTUFBTSxLQUFLLENBQUM7SUFDaEIsQ0FBQztBQUNMLENBQUMiLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQgeyBEeW5hbW9EQkNsaWVudCB9IGZyb20gJ0Bhd3Mtc2RrL2NsaWVudC1keW5hbW9kYic7XHJcbmltcG9ydCB7IER5bmFtb0RCRG9jdW1lbnRDbGllbnQsIFB1dENvbW1hbmQgfSBmcm9tICdAYXdzLXNkay9saWItZHluYW1vZGInO1xyXG5pbXBvcnQgeyBNZXRyaWNSZWNvcmQsIEFwaVJlc3BvbnNlIH0gZnJvbSAnLi4vc2hhcmVkL3R5cGVzJztcclxuXHJcbi8qKlxyXG4gKiBEeW5hbW9EQiBXcml0ZXIgQ29uZmlndXJhdGlvblxyXG4gKiBSZXF1aXJlbWVudHM6IDMuMSwgMy4yLCAzLjMsIDMuNFxyXG4gKi9cclxuZXhwb3J0IGludGVyZmFjZSBEeW5hbW9EQldyaXRlckNvbmZpZyB7XHJcbiAgICB0YWJsZU5hbWU6IHN0cmluZzsgLy8gQUlfTUVUUklDU19UQUJMRV9OQU1FIGVudmlyb25tZW50IHZhcmlhYmxlXHJcbn1cclxuXHJcbi8qKlxyXG4gKiBXcml0ZXMgbWV0cmljIHJlY29yZCB0byBEeW5hbW9EQiB3aXRoIGlkZW1wb3RlbnQgY29uZGl0aW9uYWwgd3JpdGVcclxuICogXHJcbiAqIFVzZXMgdGhlICdmcm9tJyB0aW1lc3RhbXAgZnJvbSB0aGUgU1FTIG1lc3NhZ2UgYXMgdGhlIHNsb3QgdGltZSAoYWxyZWFkeSBhbGlnbmVkIHRvIDUtc2Vjb25kIGJvdW5kYXJ5KS5cclxuICogSW1wbGVtZW50cyBpZGVtcG90ZW50IHdyaXRlcyB1c2luZyBhdHRyaWJ1dGVfbm90X2V4aXN0cyBjb25kaXRpb24gdG8gcHJldmVudCBkdXBsaWNhdGVzLlxyXG4gKiBcclxuICogUmVxdWlyZW1lbnRzOiAzLjEsIDMuMiwgMy4zLCAzLjRcclxuICogXHJcbiAqIEBwYXJhbSBjb25maWcgLSBEeW5hbW9EQiB3cml0ZXIgY29uZmlndXJhdGlvblxyXG4gKiBAcGFyYW0gYXBpUmVzcG9uc2UgLSBSZXNwb25zZSBmcm9tIEFJIEVtcGxveWVlIEFQSVxyXG4gKiBAcGFyYW0gc2xvdFRpbWUgLSBTbG90IHRpbWUgZnJvbSBTUVMgbWVzc2FnZSAoZnJvbSBmaWVsZCwgYWxyZWFkeSA1LXNlY29uZCBhbGlnbmVkKVxyXG4gKiBAcmV0dXJucyB0cnVlIGlmIHJlY29yZCB3YXMgd3JpdHRlbiwgZmFsc2UgaWYgZHVwbGljYXRlIHdhcyBwcmV2ZW50ZWRcclxuICogQHRocm93cyBFcnJvciBpZiBEeW5hbW9EQiB3cml0ZSBmYWlscyAoZXhjZXB0IGZvciBjb25kaXRpb25hbCBjaGVjayBmYWlsdXJlcylcclxuICovXHJcbmV4cG9ydCBhc3luYyBmdW5jdGlvbiB3cml0ZU1ldHJpY1JlY29yZChcclxuICAgIGNvbmZpZzogRHluYW1vREJXcml0ZXJDb25maWcsXHJcbiAgICBhcGlSZXNwb25zZTogQXBpUmVzcG9uc2UsXHJcbiAgICBzbG90VGltZTogc3RyaW5nXHJcbik6IFByb21pc2U8Ym9vbGVhbj4ge1xyXG4gICAgLy8gQ3JlYXRlIER5bmFtb0RCIGNsaWVudFxyXG4gICAgY29uc3QgY2xpZW50ID0gbmV3IER5bmFtb0RCQ2xpZW50KHt9KTtcclxuICAgIGNvbnN0IGRvY0NsaWVudCA9IER5bmFtb0RCRG9jdW1lbnRDbGllbnQuZnJvbShjbGllbnQpO1xyXG5cclxuICAgIC8vIEJ1aWxkIG1ldHJpYyByZWNvcmQgKFJlcXVpcmVtZW50cyAzLjEsIDMuMiwgMy4zKVxyXG4gICAgY29uc3QgcmVjb3JkOiBNZXRyaWNSZWNvcmQgPSB7XHJcbiAgICAgICAgbWV0cmljTmFtZTogJ2FpX3Jlc3BvbnNlX2NvdW50JywgLy8gUGFydGl0aW9uIGtleSAoUmVxdWlyZW1lbnQgMy4xKVxyXG4gICAgICAgIHNsb3RUaW1lOiBzbG90VGltZSwgLy8gU29ydCBrZXkgLSB1c2UgJ2Zyb20nIGFzIHNsb3QgdGltZSAoUmVxdWlyZW1lbnQgMy4yKVxyXG4gICAgICAgIGNvdW50OiBhcGlSZXNwb25zZS5jb3VudCwgLy8gQ291bnQgZnJvbSBBUEkgcmVzcG9uc2UgKFJlcXVpcmVtZW50IDMuMylcclxuICAgIH07XHJcblxyXG4gICAgY29uc29sZS5sb2coJ1dyaXRpbmcgbWV0cmljIHJlY29yZCB0byBEeW5hbW9EQicsIHtcclxuICAgICAgICB0YWJsZU5hbWU6IGNvbmZpZy50YWJsZU5hbWUsXHJcbiAgICAgICAgbWV0cmljTmFtZTogcmVjb3JkLm1ldHJpY05hbWUsXHJcbiAgICAgICAgc2xvdFRpbWU6IHJlY29yZC5zbG90VGltZSxcclxuICAgICAgICBjb3VudDogcmVjb3JkLmNvdW50LFxyXG4gICAgfSk7XHJcblxyXG4gICAgdHJ5IHtcclxuICAgICAgICAvLyBJZGVtcG90ZW50IGNvbmRpdGlvbmFsIHdyaXRlIChSZXF1aXJlbWVudCAzLjQpXHJcbiAgICAgICAgLy8gT25seSB3cml0ZSBpZiB0aGUgcmVjb3JkIGRvZXNuJ3QgYWxyZWFkeSBleGlzdCAocHJldmVudHMgZHVwbGljYXRlcylcclxuICAgICAgICBjb25zdCBjb21tYW5kID0gbmV3IFB1dENvbW1hbmQoe1xyXG4gICAgICAgICAgICBUYWJsZU5hbWU6IGNvbmZpZy50YWJsZU5hbWUsXHJcbiAgICAgICAgICAgIEl0ZW06IHJlY29yZCxcclxuICAgICAgICAgICAgQ29uZGl0aW9uRXhwcmVzc2lvbjogJ2F0dHJpYnV0ZV9ub3RfZXhpc3RzKG1ldHJpY05hbWUpIEFORCBhdHRyaWJ1dGVfbm90X2V4aXN0cyhzbG90VGltZSknLFxyXG4gICAgICAgIH0pO1xyXG5cclxuICAgICAgICBhd2FpdCBkb2NDbGllbnQuc2VuZChjb21tYW5kKTtcclxuXHJcbiAgICAgICAgY29uc29sZS5sb2coJ01ldHJpYyByZWNvcmQgd3JpdHRlbiBzdWNjZXNzZnVsbHknLCB7XHJcbiAgICAgICAgICAgIG1ldHJpY05hbWU6IHJlY29yZC5tZXRyaWNOYW1lLFxyXG4gICAgICAgICAgICBzbG90VGltZTogcmVjb3JkLnNsb3RUaW1lLFxyXG4gICAgICAgICAgICBjb3VudDogcmVjb3JkLmNvdW50LFxyXG4gICAgICAgIH0pO1xyXG5cclxuICAgICAgICByZXR1cm4gdHJ1ZTtcclxuICAgIH0gY2F0Y2ggKGVycm9yKSB7XHJcbiAgICAgICAgLy8gSGFuZGxlIGNvbmRpdGlvbmFsIGNoZWNrIGZhaWx1cmUgKGR1cGxpY2F0ZSByZWNvcmQpIC0gdGhpcyBpcyBleHBlY3RlZCBmb3IgaWRlbXBvdGVuY3lcclxuICAgICAgICBpZiAoZXJyb3IgaW5zdGFuY2VvZiBFcnJvciAmJiBlcnJvci5uYW1lID09PSAnQ29uZGl0aW9uYWxDaGVja0ZhaWxlZEV4Y2VwdGlvbicpIHtcclxuICAgICAgICAgICAgLy8gUmVxdWlyZW1lbnQgNy4yOiBMb2cgYXMgaW5mb3JtYXRpb25hbCAoZXhwZWN0ZWQgZm9yIGlkZW1wb3RlbmN5KVxyXG4gICAgICAgICAgICBjb25zb2xlLmluZm8oJ0R1cGxpY2F0ZSByZWNvcmQgcHJldmVudGVkIChpZGVtcG90ZW50IHdyaXRlKScsIHtcclxuICAgICAgICAgICAgICAgIG1ldHJpY05hbWU6IHJlY29yZC5tZXRyaWNOYW1lLFxyXG4gICAgICAgICAgICAgICAgc2xvdFRpbWU6IHJlY29yZC5zbG90VGltZSxcclxuICAgICAgICAgICAgICAgIG1lc3NhZ2U6ICdSZWNvcmQgYWxyZWFkeSBleGlzdHMsIHNraXBwaW5nIHdyaXRlJyxcclxuICAgICAgICAgICAgfSk7XHJcblxyXG4gICAgICAgICAgICByZXR1cm4gZmFsc2U7IC8vIER1cGxpY2F0ZSBwcmV2ZW50ZWQsIGJ1dCB0aGlzIGlzIHN1Y2Nlc3MgZnJvbSBpZGVtcG90ZW5jeSBwZXJzcGVjdGl2ZVxyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgLy8gUmVxdWlyZW1lbnQgNy4yOiBMb2cgZXJyb3IgZGV0YWlscyBhbmQgcmUtdGhyb3cgZm9yIG90aGVyIGZhaWx1cmVzXHJcbiAgICAgICAgY29uc29sZS5lcnJvcignRmFpbGVkIHRvIHdyaXRlIG1ldHJpYyByZWNvcmQgdG8gRHluYW1vREInLCB7XHJcbiAgICAgICAgICAgIHRhYmxlTmFtZTogY29uZmlnLnRhYmxlTmFtZSxcclxuICAgICAgICAgICAgbWV0cmljTmFtZTogcmVjb3JkLm1ldHJpY05hbWUsXHJcbiAgICAgICAgICAgIHNsb3RUaW1lOiByZWNvcmQuc2xvdFRpbWUsXHJcbiAgICAgICAgICAgIGNvdW50OiByZWNvcmQuY291bnQsXHJcbiAgICAgICAgICAgIGVycm9yOiBlcnJvciBpbnN0YW5jZW9mIEVycm9yID8gZXJyb3IubWVzc2FnZSA6IFN0cmluZyhlcnJvciksXHJcbiAgICAgICAgfSk7XHJcblxyXG4gICAgICAgIHRocm93IGVycm9yO1xyXG4gICAgfVxyXG59XHJcbiJdfQ==