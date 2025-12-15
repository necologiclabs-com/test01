import * as cdk from 'aws-cdk-lib';
import * as dynamodb from 'aws-cdk-lib/aws-dynamodb';
import * as sqs from 'aws-cdk-lib/aws-sqs';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as lambdaEventSources from 'aws-cdk-lib/aws-lambda-event-sources';
import * as events from 'aws-cdk-lib/aws-events';
import * as targets from 'aws-cdk-lib/aws-events-targets';
import * as apigateway from 'aws-cdk-lib/aws-apigateway';
import { Construct } from 'constructs';
import * as path from 'path';

export class DataCollectionSchedulerStack extends cdk.Stack {
    constructor(scope: Construct, id: string, props?: cdk.StackProps) {
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
        collectorLambda.addEventSource(
            new lambdaEventSources.SqsEventSource(schedulingQueue, {
                batchSize: 1,
            })
        );

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
