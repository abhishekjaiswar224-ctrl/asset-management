import { CloudWatchLogsClient, PutLogEventsCommand, CreateLogGroupCommand, CreateLogStreamCommand, DescribeLogStreamsCommand } from "@aws-sdk/client-cloudwatch-logs";
import dotenv from "dotenv";

dotenv.config();

const region = process.env.AWS_REGION || "us-east-1";
const logGroupName = process.env.CLOUDWATCH_LOG_GROUP_NAME || "/asset-management/app";
const logStreamName = `stream-${new Date().toISOString().split('T')[0]}`;

let cloudWatchClient;

try {
  cloudWatchClient = new CloudWatchLogsClient({
    region: region,
    credentials: {
      accessKeyId: process.env.AWS_ACCESS_KEY_ID,
      secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
    },
  });
} catch (error) {
  console.error("Failed to initialize CloudWatch client:", error);
}

let sequenceToken = null;
let isInitialized = false;

async function initializeCloudWatch() {
  if (!cloudWatchClient || isInitialized) return;

  try {
    // Try to create log group (will fail if it exists, which is fine)
    try {
      await cloudWatchClient.send(new CreateLogGroupCommand({ logGroupName }));
    } catch (e) {
      if (e.name !== 'ResourceAlreadyExistsException') {
        console.error("Error creating log group:", e);
      }
    }

    // Try to create log stream
    try {
      await cloudWatchClient.send(new CreateLogStreamCommand({ logGroupName, logStreamName }));
    } catch (e) {
      if (e.name !== 'ResourceAlreadyExistsException') {
        console.error("Error creating log stream:", e);
      }
    }

    // Get sequence token
    const describeCmd = new DescribeLogStreamsCommand({
      logGroupName,
      logStreamNamePrefix: logStreamName,
    });
    const response = await cloudWatchClient.send(describeCmd);
    if (response.logStreams && response.logStreams.length > 0) {
      sequenceToken = response.logStreams[0].uploadSequenceToken;
    }
    
    isInitialized = true;
  } catch (error) {
    console.error("Failed to initialize CloudWatch stream:", error);
  }
}

async function logToCloudWatch(level, message, meta = {}) {
  const timestamp = new Date().getTime();
  const logMessage = JSON.stringify({
    level,
    timestamp: new Date().toISOString(),
    message,
    ...meta
  });

  // Always log to console as well
  if (level === 'ERROR') {
    console.error(logMessage);
  } else {
    console.log(logMessage);
  }

  if (!cloudWatchClient) return;

  try {
    if (!isInitialized) {
      await initializeCloudWatch();
    }

    const params = {
      logEvents: [
        {
          message: logMessage,
          timestamp: timestamp,
        },
      ],
      logGroupName,
      logStreamName,
      ...(sequenceToken && { sequenceToken }),
    };

    const command = new PutLogEventsCommand(params);
    const response = await cloudWatchClient.send(command);
    sequenceToken = response.nextSequenceToken;
  } catch (error) {
    console.error("Error sending log to CloudWatch:", error);
    // If sequence token is invalid, reset initialization to fetch it again
    if (error.name === 'InvalidSequenceTokenException' || error.name === 'DataAlreadyAcceptedException') {
        sequenceToken = error.expectedSequenceToken;
    }
  }
}

export const logger = {
  info: (message, meta) => logToCloudWatch('INFO', message, meta),
  error: (message, meta) => logToCloudWatch('ERROR', message, meta),
  debug: (message, meta) => logToCloudWatch('DEBUG', message, meta),
};
