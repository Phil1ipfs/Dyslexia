// backend/config/s3.js
const { S3Client, ListBucketsCommand, PutObjectCommand } = require('@aws-sdk/client-s3');
const { getSignedUrl } = require('@aws-sdk/s3-request-presigner');
require('dotenv').config();

// Create S3 client
const s3Client = new S3Client({
  region: process.env.AWS_REGION || 'ap-southeast-2',
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  },
});

// Add method to generate presigned URLs (compatible with AWS SDK v3)
s3Client.getSignedUrlPromise = async (operation, params) => {
  // For 'putObject' operation
  if (operation === 'putObject') {
    const command = new PutObjectCommand(params);
    return getSignedUrl(s3Client, command, { expiresIn: params.Expires || 3600 });
  }
  
  // Add other operations as needed
  throw new Error(`Unsupported operation: ${operation}`);
};

// Test S3 connection function
const testS3Connection = async () => {
  try {
    const command = new ListBucketsCommand({});
    const response = await s3Client.send(command);
    console.log('✅ S3 connection successful - available buckets:', 
      response.Buckets.map(b => b.Name).join(', '));
    return true;
  } catch (error) {
    console.error('❌ S3 connection failed:', error.message);
    return false;
  }
};

// Add test function to s3Client object
s3Client.testS3Connection = testS3Connection;

module.exports = s3Client;