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
exports.DataCollectionSchedulerStack = void 0;
const cdk = __importStar(require("aws-cdk-lib"));
const dynamodb = __importStar(require("aws-cdk-lib/aws-dynamodb"));
const sqs = __importStar(require("aws-cdk-lib/aws-sqs"));
const lambda = __importStar(require("aws-cdk-lib/aws-lambda"));
const lambdaEventSources = __importStar(require("aws-cdk-lib/aws-lambda-event-sources"));
const events = __importStar(require("aws-cdk-lib/aws-events"));
const targets = __importStar(require("aws-cdk-lib/aws-events-targets"));
const apigateway = __importStar(require("aws-cdk-lib/aws-apigateway"));
const path = __importStar(require("path"));
class DataCollectionSchedulerStack extends cdk.Stack {
    constructor(scope, id, props) {
        super(scope, id, props);
        // Mock API Lambda - simulates AI Employee API
        const mockApiLambda = new lambda.Function(this, 'MockApiLambda', {
            runtime: lambda.Runtime.NODEJS_20_X,
            handler: 'index.handler',
            code: lambda.Code.fromAsset(path.join(__dirname, '../dist/lambda/mock-api')),
            timeout: cdk.Duration.seconds(10),
        });
        // API Gateway for Mock API
        const mockApi = new apigateway.RestApi(this, 'MockApi', {
            restApiName: 'AI Employee Mock API',
            description: 'Mock API for testing data collection scheduler',
            deployOptions: {
                stageName: 'prod',
            },
        });
        // Add /response_count endpoint
        const responseCountResource = mockApi.root.addResource('response_count');
        responseCountResource.addMethod('GET', new apigateway.LambdaIntegration(mockApiLambda));
        // Add /health endpoint
        const healthResource = mockApi.root.addResource('health');
        healthResource.addMethod('GET', new apigateway.LambdaIntegration(mockApiLambda));
        // DynamoDB Table for AI Response Metrics
        const metricsTable = new dynamodb.Table(this, 'AiResponseMetrics', {
            partitionKey: {
                name: 'metricName',
                type: dynamodb.AttributeType.STRING,
            },
            sortKey: {
                name: 'slotTime',
                type: dynamodb.AttributeType.STRING,
            },
            billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
            removalPolicy: cdk.RemovalPolicy.DESTROY, // For PoC - allows easy cleanup
        });
        // SQS Queue for scheduling messages
        const schedulingQueue = new sqs.Queue(this, 'SchedulingQueue', {
            visibilityTimeout: cdk.Duration.seconds(30),
            retentionPeriod: cdk.Duration.days(1),
        });
        // Sender Lambda - generates 12 delayed SQS messages per minute
        const senderLambda = new lambda.Function(this, 'SenderLambda', {
            runtime: lambda.Runtime.NODEJS_20_X,
            handler: 'index.handler',
            code: lambda.Code.fromAsset(path.join(__dirname, '../dist/lambda/sender')),
            environment: {
                QUEUE_URL: schedulingQueue.queueUrl,
            },
            timeout: cdk.Duration.seconds(10),
        });
        // Grant Sender Lambda permission to send messages to the queue
        schedulingQueue.grantSendMessages(senderLambda);
        // Collector Lambda - fetches data from AI Employee API and stores in DynamoDB
        const collectorLambda = new lambda.Function(this, 'CollectorLambda', {
            runtime: lambda.Runtime.NODEJS_20_X,
            handler: 'index.handler',
            code: lambda.Code.fromAsset(path.join(__dirname, '../dist/lambda/collector')),
            environment: {
                AI_API_BASE_URL: mockApi.url, // Use deployed Mock API URL
                AI_METRICS_TABLE_NAME: metricsTable.tableName,
            },
            timeout: cdk.Duration.seconds(30),
        });
        // Grant Collector Lambda permission to write to DynamoDB
        metricsTable.grantWriteData(collectorLambda);
        // Add SQS trigger to Collector Lambda
        collectorLambda.addEventSource(new lambdaEventSources.SqsEventSource(schedulingQueue, {
            batchSize: 1,
        }));
        // EventBridge rule to trigger Sender Lambda every minute
        const scheduleRule = new events.Rule(this, 'ScheduleRule', {
            schedule: events.Schedule.rate(cdk.Duration.minutes(1)),
            description: 'Triggers Sender Lambda every minute to initiate sub-minute polling',
        });
        // Add Sender Lambda as target for the EventBridge rule
        scheduleRule.addTarget(new targets.LambdaFunction(senderLambda));
        // Output the Mock API URL
        new cdk.CfnOutput(this, 'MockApiUrl', {
            value: mockApi.url,
            description: 'Mock AI Employee API URL',
        });
        // Output the DynamoDB Table Name
        new cdk.CfnOutput(this, 'MetricsTableName', {
            value: metricsTable.tableName,
            description: 'DynamoDB table name for metrics',
        });
    }
}
exports.DataCollectionSchedulerStack = DataCollectionSchedulerStack;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoic3RhY2suanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi9saWIvc3RhY2sudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7O0FBQUEsaURBQW1DO0FBQ25DLG1FQUFxRDtBQUNyRCx5REFBMkM7QUFDM0MsK0RBQWlEO0FBQ2pELHlGQUEyRTtBQUMzRSwrREFBaUQ7QUFDakQsd0VBQTBEO0FBQzFELHVFQUF5RDtBQUV6RCwyQ0FBNkI7QUFFN0IsTUFBYSw0QkFBNkIsU0FBUSxHQUFHLENBQUMsS0FBSztJQUN2RCxZQUFZLEtBQWdCLEVBQUUsRUFBVSxFQUFFLEtBQXNCO1FBQzVELEtBQUssQ0FBQyxLQUFLLEVBQUUsRUFBRSxFQUFFLEtBQUssQ0FBQyxDQUFDO1FBRXhCLDhDQUE4QztRQUM5QyxNQUFNLGFBQWEsR0FBRyxJQUFJLE1BQU0sQ0FBQyxRQUFRLENBQUMsSUFBSSxFQUFFLGVBQWUsRUFBRTtZQUM3RCxPQUFPLEVBQUUsTUFBTSxDQUFDLE9BQU8sQ0FBQyxXQUFXO1lBQ25DLE9BQU8sRUFBRSxlQUFlO1lBQ3hCLElBQUksRUFBRSxNQUFNLENBQUMsSUFBSSxDQUFDLFNBQVMsQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDLFNBQVMsRUFBRSx5QkFBeUIsQ0FBQyxDQUFDO1lBQzVFLE9BQU8sRUFBRSxHQUFHLENBQUMsUUFBUSxDQUFDLE9BQU8sQ0FBQyxFQUFFLENBQUM7U0FDcEMsQ0FBQyxDQUFDO1FBRUgsMkJBQTJCO1FBQzNCLE1BQU0sT0FBTyxHQUFHLElBQUksVUFBVSxDQUFDLE9BQU8sQ0FBQyxJQUFJLEVBQUUsU0FBUyxFQUFFO1lBQ3BELFdBQVcsRUFBRSxzQkFBc0I7WUFDbkMsV0FBVyxFQUFFLGdEQUFnRDtZQUM3RCxhQUFhLEVBQUU7Z0JBQ1gsU0FBUyxFQUFFLE1BQU07YUFDcEI7U0FDSixDQUFDLENBQUM7UUFFSCwrQkFBK0I7UUFDL0IsTUFBTSxxQkFBcUIs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LENBQUMsZUFBZSxFQUFFO1lBQ25ELFNBQVMsRUFBRSxDQUFDO1NBQ2YsQ0FBQyxDQUNMLENBQUM7UUFFRix5REFBeUQ7UUFDekQsTUFBTSxZQUFZLEdBQUcsSUFBSSxNQUFNLENBQUMsSUFBSSxDQUFDLElBQUksRUFBRSxjQUFjLEVBQUU7WUFDdkQsUUFBUSxFQUFFLE1BQU0sQ0FBQyxRQUFRLENBQUMsSUFBSSxDQUFDLEdBQUcsQ0FBQyxRQUFRLENBQUMsT0FBTyxDQUFDLENBQUMsQ0FBQyxDQUFDO1lBQ3ZELFdBQVcsRUFBRSxvRUFBb0U7U0FDcEYsQ0FBQyxDQUFDO1FBRUgsdURBQXVEO1FBQ3ZELFlBQVksQ0FBQyxTQUFTLENBQUMsSUFBSSxPQUFPLENBQUMsY0FBYyxDQUFDLFlBQVksQ0FBQyxDQUFDLENBQUM7UUFFakUsMEJBQTBCO1FBQzFCLElBQUksR0FBRyxDQUFDLFNBQVMsQ0FBQyxJQUFJLEVBQUUsWUFBWSxFQUFFO1lBQ2xDLEtBQUssRUFBRSxPQUFPLENBQUMsR0FBRztZQUNsQixXQUFXLEVBQUUsMEJBQTBCO1NBQzFDLENBQUMsQ0FBQztRQUVILGlDQUFpQztRQUNqQyxJQUFJLEdBQUcsQ0FBQyxTQUFTLENBQUMsSUFBSSxFQUFFLGtCQUFrQixFQUFFO1lBQ3hDLEtBQUssRUFBRSxZQUFZLENBQUMsU0FBUztZQUM3QixXQUFXLEVBQUUsaUNBQWlDO1NBQ2pELENBQUMsQ0FBQztJQUNQLENBQUM7Q0FDSjtBQTFHRCxvRUEwR0MiLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQgKiBhcyBjZGsgZnJvbSAnYXdzLWNkay1saWInO1xyXG5pbXBvcnQgKiBhcyBkeW5hbW9kYiBmcm9tICdhd3MtY2RrLWxpYi9hd3MtZHluYW1vZGInO1xyXG5pbXBvcnQgKiBhcyBzcXMgZnJvbSAnYXdzLWNkay1saWIvYXdzLXNxcyc7XHJcbmltcG9ydCAqIGFzIGxhbWJkYSBmcm9tICdhd3MtY2RrLWxpYi9hd3MtbGFtYmRhJztcclxuaW1wb3J0ICogYXMgbGFtYmRhRXZlbnRTb3VyY2VzIGZyb20gJ2F3cy1jZGstbGliL2F3cy1sYW1iZGEtZXZlbnQtc291cmNlcyc7XHJcbmltcG9ydCAqIGFzIGV2ZW50cyBmcm9tICdhd3MtY2RrLWxpYi9hd3MtZXZlbnRzJztcclxuaW1wb3J0ICogYXMgdGFyZ2V0cyBmcm9tICdhd3MtY2RrLWxpYi9hd3MtZXZlbnRzLXRhcmdldHMnO1xyXG5pbXBvcnQgKiBhcyBhcGlnYXRld2F5IGZyb20gJ2F3cy1jZGstbGliL2F3cy1hcGlnYXRld2F5JztcclxuaW1wb3J0IHsgQ29uc3RydWN0IH0gZnJvbSAnY29uc3RydWN0cyc7XHJcbmltcG9ydCAqIGFzIHBhdGggZnJvbSAncGF0aCc7XHJcblxyXG5leHBvcnQgY2xhc3MgRGF0YUNvbGxlY3Rpb25TY2hlZHVsZXJTdGFjayBleHRlbmRzIGNkay5TdGFjayB7XHJcbiAgICBjb25zdHJ1Y3RvcihzY29wZTogQ29uc3RydWN0LCBpZDogc3RyaW5nLCBwcm9wcz86IGNkay5TdGFja1Byb3BzKSB7XHJcbiAgICAgICAgc3VwZXIoc2NvcGUsIGlkLCBwcm9wcyk7XHJcblxyXG4gICAgICAgIC8vIE1vY2sgQVBJIExhbWJkYSAtIHNpbXVsYXRlcyBBSSBFbXBsb3llZSBBUElcclxuICAgICAgICBjb25zdCBtb2NrQXBpTGFtYmRhID0gbmV3IGxhbWJkYS5GdW5jdGlvbih0aGlzLCAnTW9ja0FwaUxhbWJkYScsIHtcclxuICAgICAgICAgICAgcnVudGltZTogbGFtYmRhLlJ1bnRpbWUuTk9ERUpTXzIwX1gsXHJcbiAgICAgICAgICAgIGhhbmRsZXI6ICdpbmRleC5oYW5kbGVyJyxcclxuICAgICAgICAgICAgY29kZTogbGFtYmRhLkNvZGUuZnJvbUFzc2V0KHBhdGguam9pbihfX2Rpcm5hbWUsICcuLi9kaXN0L2xhbWJkYS9tb2NrLWFwaScpKSxcclxuICAgICAgICAgICAgdGltZW91dDogY2RrLkR1cmF0aW9uLnNlY29uZHMoMTApLFxyXG4gICAgICAgIH0pO1xyXG5cclxuICAgICAgICAvLyBBUEkgR2F0ZXdheSBmb3IgTW9jayBBUElcclxuICAgICAgICBjb25zdCBtb2NrQXBpID0gbmV3IGFwaWdhdGV3YXkuUmVzdEFwaSh0aGlzLCAnTW9ja0FwaScsIHtcclxuICAgICAgICAgICAgcmVzdEFwaU5hbWU6ICdBSSBFbXBsb3llZSBNb2NrIEFQSScsXHJcbiAgICAgICAgICAgIGRlc2NyaXB0aW9uOiAnTW9jayBBUEkgZm9yIHRlc3RpbmcgZGF0YSBjb2xsZWN0aW9uIHNjaGVkdWxlcicsXHJcbiAgICAgICAgICAgIGRlcGxveU9wdGlvbnM6IHtcclxuICAgICAgICAgICAgICAgIHN0YWdlTmFtZTogJ3Byb2QnLFxyXG4gICAgICAgICAgICB9LFxyXG4gICAgICAgIH0pO1xyXG5cclxuICAgICAgICAvLyBBZGQgL3Jlc3BvbnNlX2NvdW50IGVuZHBvaW50XHJcbiAgICAgICAgY29uc3QgcmVzcG9uc2VDb3VudFJlc291cmNlID0gbW9ja0FwaS5yb290LmFkZFJlc291cmNlKCdyZXNwb25zZV9jb3VudCcpO1xyXG4gICAgICAgIHJlc3BvbnNlQ291bnRSZXNvdXJjZS5hZGRNZXRob2QoJ0dFVCcsIG5ldyBhcGlnYXRld2F5LkxhbWJkYUludGVncmF0aW9uKG1vY2tBcGlMYW1iZGEpKTtcclxuXHJcbiAgICAgICAgLy8gQWRkIC9oZWFsdGggZW5kcG9pbnRcclxuICAgICAgICBjb25zdCBoZWFsdGhSZXNvdXJjZSA9IG1vY2tBcGkucm9vdC5hZGRSZXNvdXJjZSgnaGVhbHRoJyk7XHJcbiAgICAgICAgaGVhbHRoUmVzb3VyY2UuYWRkTWV0aG9kKCdHRVQnLCBuZXcgYXBpZ2F0ZXdheS5MYW1iZGFJbnRlZ3JhdGlvbihtb2NrQXBpTGFtYmRhKSk7XHJcblxyXG4gICAgICAgIC8vIER5bmFtb0RCIFRhYmxlIGZvciBBSSBSZXNwb25zZSBNZXRyaWNzXHJcbiAgICAgICAgY29uc3QgbWV0cmljc1RhYmxlID0gbmV3IGR5bmFtb2RiLlRhYmxlKHRoaXMsICdBaVJlc3BvbnNlTWV0cmljcycsIHtcclxuICAgICAgICAgICAgcGFydGl0aW9uS2V5OiB7XHJcbiAgICAgICAgICAgICAgICBuYW1lOiAnbWV0cmljTmFtZScsXHJcbiAgICAgICAgICAgICAgICB0eXBlOiBkeW5hbW9kYi5BdHRyaWJ1dGVUeXBlLlNUUklORyxcclxuICAgICAgICAgICAgfSxcclxuICAgICAgICAgICAgc29ydEtleToge1xyXG4gICAgICAgICAgICAgICAgbmFtZTogJ3Nsb3RUaW1lJyxcclxuICAgICAgICAgICAgICAgIHR5cGU6IGR5bmFtb2RiLkF0dHJpYnV0ZVR5cGUuU1RSSU5HLFxyXG4gICAgICAgICAgICB9LFxyXG4gICAgICAgICAgICBiaWxsaW5nTW9kZTogZHluYW1vZGIuQmlsbGluZ01vZGUuUEFZX1BFUl9SRVFVRVNULFxyXG4gICAgICAgICAgICByZW1vdmFsUG9saWN5OiBjZGsuUmVtb3ZhbFBvbGljeS5ERVNUUk9ZLCAvLyBGb3IgUG9DIC0gYWxsb3dzIGVhc3kgY2xlYW51cFxyXG4gICAgICAgIH0pO1xyXG5cclxuICAgICAgICAvLyBTUVMgUXVldWUgZm9yIHNjaGVkdWxpbmcgbWVzc2FnZXNcclxuICAgICAgICBjb25zdCBzY2hlZHVsaW5nUXVldWUgPSBuZXcgc3FzLlF1ZXVlKHRoaXMsICdTY2hlZHVsaW5nUXVldWUnLCB7XHJcbiAgICAgICAgICAgIHZpc2liaWxpdHlUaW1lb3V0OiBjZGsuRHVyYXRpb24uc2Vjb25kcygzMCksXHJcbiAgICAgICAgICAgIHJldGVudGlvblBlcmlvZDogY2RrLkR1cmF0aW9uLmRheXMoMSksXHJcbiAgICAgICAgfSk7XHJcblxyXG4gICAgICAgIC8vIFNlbmRlciBMYW1iZGEgLSBnZW5lcmF0ZXMgMTIgZGVsYXllZCBTUVMgbWVzc2FnZXMgcGVyIG1pbnV0ZVxyXG4gICAgICAgIGNvbnN0IHNlbmRlckxhbWJkYSA9IG5ldyBsYW1iZGEuRnVuY3Rpb24odGhpcywgJ1NlbmRlckxhbWJkYScsIHtcclxuICAgICAgICAgICAgcnVudGltZTogbGFtYmRhLlJ1bnRpbWUuTk9ERUpTXzIwX1gsXHJcbiAgICAgICAgICAgIGhhbmRsZXI6ICdpbmRleC5oYW5kbGVyJyxcclxuICAgICAgICAgICAgY29kZTogbGFtYmRhLkNvZGUuZnJvbUFzc2V0KHBhdGguam9pbihfX2Rpcm5hbWUsICcuLi9kaXN0L2xhbWJkYS9zZW5kZXInKSksXHJcbiAgICAgICAgICAgIGVudmlyb25tZW50OiB7XHJcbiAgICAgICAgICAgICAgICBRVUVVRV9VUkw6IHNjaGVkdWxpbmdRdWV1ZS5xdWV1ZVVybCxcclxuICAgICAgICAgICAgfSxcclxuICAgICAgICAgICAgdGltZW91dDogY2RrLkR1cmF0aW9uLnNlY29uZHMoMTApLFxyXG4gICAgICAgIH0pO1xyXG5cclxuICAgICAgICAvLyBHcmFudCBTZW5kZXIgTGFtYmRhIHBlcm1pc3Npb24gdG8gc2VuZCBtZXNzYWdlcyB0byB0aGUgcXVldWVcclxuICAgICAgICBzY2hlZHVsaW5nUXVldWUuZ3JhbnRTZW5kTWVzc2FnZXMoc2VuZGVyTGFtYmRhKTtcclxuXHJcbiAgICAgICAgLy8gQ29sbGVjdG9yIExhbWJkYSAtIGZldGNoZXMgZGF0YSBmcm9tIEFJIEVtcGxveWVlIEFQSSBhbmQgc3RvcmVzIGluIER5bmFtb0RCXHJcbiAgICAgICAgY29uc3QgY29sbGVjdG9yTGFtYmRhID0gbmV3IGxhbWJkYS5GdW5jdGlvbih0aGlzLCAnQ29sbGVjdG9yTGFtYmRhJywge1xyXG4gICAgICAgICAgICBydW50aW1lOiBsYW1iZGEuUnVudGltZS5OT0RFSlNfMjBfWCxcclxuICAgICAgICAgICAgaGFuZGxlcjogJ2luZGV4LmhhbmRsZXInLFxyXG4gICAgICAgICAgICBjb2RlOiBsYW1iZGEuQ29kZS5mcm9tQXNzZXQocGF0aC5qb2luKF9fZGlybmFtZSwgJy4uL2Rpc3QvbGFtYmRhL2NvbGxlY3RvcicpKSxcclxuICAgICAgICAgICAgZW52aXJvbm1lbnQ6IHtcclxuICAgICAgICAgICAgICAgIEFJX0FQSV9CQVNFX1VSTDogbW9ja0FwaS51cmwsIC8vIFVzZSBkZXBsb3llZCBNb2NrIEFQSSBVUkxcclxuICAgICAgICAgICAgICAgIEFJX01FVFJJQ1NfVEFCTEVfTkFNRTogbWV0cmljc1RhYmxlLnRhYmxlTmFtZSxcclxuICAgICAgICAgICAgfSxcclxuICAgICAgICAgICAgdGltZW91dDogY2RrLkR1cmF0aW9uLnNlY29uZHMoMzApLFxyXG4gICAgICAgIH0pO1xyXG5cclxuICAgICAgICAvLyBHcmFudCBDb2xsZWN0b3IgTGFtYmRhIHBlcm1pc3Npb24gdG8gd3JpdGUgdG8gRHluYW1vREJcclxuICAgICAgICBtZXRyaWNzVGFibGUuZ3JhbnRXcml0ZURhdGEoY29sbGVjdG9yTGFtYmRhKTtcclxuXHJcbiAgICAgICAgLy8gQWRkIFNRUyB0cmlnZ2VyIHRvIENvbGxlY3RvciBMYW1iZGFcclxuICAgICAgICBjb2xsZWN0b3JMYW1iZGEuYWRkRXZlbnRTb3VyY2UoXHJcbiAgICAgICAgICAgIG5ldyBsYW1iZGFFdmVudFNvdXJjZXMuU3FzRXZlbnRTb3VyY2Uoc2NoZWR1bGluZ1F1ZXVlLCB7XHJcbiAgICAgICAgICAgICAgICBiYXRjaFNpemU6IDEsXHJcbiAgICAgICAgICAgIH0pXHJcbiAgICAgICAgKTtcclxuXHJcbiAgICAgICAgLy8gRXZlbnRCcmlkZ2UgcnVsZSB0byB0cmlnZ2VyIFNlbmRlciBMYW1iZGEgZXZlcnkgbWludXRlXHJcbiAgICAgICAgY29uc3Qgc2NoZWR1bGVSdWxlID0gbmV3IGV2ZW50cy5SdWxlKHRoaXMsICdTY2hlZHVsZVJ1bGUnLCB7XHJcbiAgICAgICAgICAgIHNjaGVkdWxlOiBldmVudHMuU2NoZWR1bGUucmF0ZShjZGsuRHVyYXRpb24ubWludXRlcygxKSksXHJcbiAgICAgICAgICAgIGRlc2NyaXB0aW9uOiAnVHJpZ2dlcnMgU2VuZGVyIExhbWJkYSBldmVyeSBtaW51dGUgdG8gaW5pdGlhdGUgc3ViLW1pbnV0ZSBwb2xsaW5nJyxcclxuICAgICAgICB9KTtcclxuXHJcbiAgICAgICAgLy8gQWRkIFNlbmRlciBMYW1iZGEgYXMgdGFyZ2V0IGZvciB0aGUgRXZlbnRCcmlkZ2UgcnVsZVxyXG4gICAgICAgIHNjaGVkdWxlUnVsZS5hZGRUYXJnZXQobmV3IHRhcmdldHMuTGFtYmRhRnVuY3Rpb24oc2VuZGVyTGFtYmRhKSk7XHJcblxyXG4gICAgICAgIC8vIE91dHB1dCB0aGUgTW9jayBBUEkgVVJMXHJcbiAgICAgICAgbmV3IGNkay5DZm5PdXRwdXQodGhpcywgJ01vY2tBcGlVcmwnLCB7XHJcbiAgICAgICAgICAgIHZhbHVlOiBtb2NrQXBpLnVybCxcclxuICAgICAgICAgICAgZGVzY3JpcHRpb246ICdNb2NrIEFJIEVtcGxveWVlIEFQSSBVUkwnLFxyXG4gICAgICAgIH0pO1xyXG5cclxuICAgICAgICAvLyBPdXRwdXQgdGhlIER5bmFtb0RCIFRhYmxlIE5hbWVcclxuICAgICAgICBuZXcgY2RrLkNmbk91dHB1dCh0aGlzLCAnTWV0cmljc1RhYmxlTmFtZScsIHtcclxuICAgICAgICAgICAgdmFsdWU6IG1ldHJpY3NUYWJsZS50YWJsZU5hbWUsXHJcbiAgICAgICAgICAgIGRlc2NyaXB0aW9uOiAnRHluYW1vREIgdGFibGUgbmFtZSBmb3IgbWV0cmljcycsXHJcbiAgICAgICAgfSk7XHJcbiAgICB9XHJcbn1cclxuIl19