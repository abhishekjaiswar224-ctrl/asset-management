import { S3Client, PutObjectCommand, GetObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import dotenv from "dotenv";

dotenv.config();

const region = process.env.AWS_REGION || "us-east-1";
const bucketName = process.env.AWS_S3_BUCKET_NAME;

let s3Client;

try {
  s3Client = new S3Client({
    region: region,
    credentials: {
      accessKeyId: process.env.AWS_ACCESS_KEY_ID,
      secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
    },
  });
} catch (error) {
  console.error("Failed to initialize S3 client:", error);
}

export const uploadToS3 = async (fileBuffer, fileName, contentType) => {
  if (!s3Client) throw new Error("S3 Client not initialized");
  
  const params = {
    Bucket: bucketName,
    Key: fileName,
    Body: fileBuffer,
    ContentType: contentType,
  };

  const command = new PutObjectCommand(params);
  await s3Client.send(command);
  return fileName;
};

export const getPresignedUrl = async (fileName, expiresIn = 3600) => {
  if (!s3Client) throw new Error("S3 Client not initialized");

  const command = new GetObjectCommand({
    Bucket: bucketName,
    Key: fileName,
  });

  return await getSignedUrl(s3Client, command, { expiresIn });
};
