const { S3Client, PutObjectCommand } = require('@aws-sdk/client-s3');
const path = require('path');

const s3 = new S3Client({
  region: process.env.AWS_REGION,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  },
});

const BUCKET = process.env.AWS_S3_BUCKET || process.env.AWS_BUCKET_NAME;

// Bound how long an upload may take. Without this, a hung/slow S3 (credential or
// billing problems) makes the whole request hang until Cloud Run's 300s timeout,
// and the browser sees a 504 (Gateway Timeout) on create/update. With it, the
// upload rejects after S3_TIMEOUT_MS and the caller's try/catch degrades
// gracefully (saves the record without the image). 10s is generous for a small
// profile image yet short enough to never 504.
const S3_TIMEOUT_MS = 10000;

async function uploadToS3(file, folder = '') {
  const ext = path.extname(file.originalname);
  const filename = `${Date.now()}_${Math.random().toString(36).substring(2, 8)}${ext}`;
  const key = folder ? `${folder}/${filename}` : filename;

  const params = {
    Bucket: BUCKET,
    Key: key,
    Body: file.buffer,
    ContentType: file.mimetype,
  };

  await Promise.race([
    s3.send(new PutObjectCommand(params)),
    new Promise((_, reject) =>
      setTimeout(() => reject(new Error(`S3 upload timed out after ${S3_TIMEOUT_MS}ms`)), S3_TIMEOUT_MS)
    ),
  ]);

  // Return the public URL
  return `https://${BUCKET}.s3.${process.env.AWS_REGION}.amazonaws.com/${key}`;
}

module.exports = uploadToS3; 