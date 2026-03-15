import { S3Client, PutObjectCommand, GetObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { AWS_REGION, MEDICAL_REPORTS_BUCKET } from "../config/env.js";

const s3 = new S3Client({
  region: AWS_REGION,
});

export async function getMedicalReportUploadUrl({ key, contentType }) {
  const command = new PutObjectCommand({
    Bucket: MEDICAL_REPORTS_BUCKET,
    Key: key,
    ContentType: contentType,
  });
  return getSignedUrl(s3, command, { expiresIn: 300 });
}

export async function getMedicalReportDownloadUrl({ key }) {
  const command = new GetObjectCommand({
    Bucket: MEDICAL_REPORTS_BUCKET,
    Key: key,
  });
  return getSignedUrl(s3, command, { expiresIn: 300 });
}

