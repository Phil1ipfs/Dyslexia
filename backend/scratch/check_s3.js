const { S3Client, GetBucketLocationCommand, ListObjectsV2Command } = require('@aws-sdk/client-s3');
const { execSync } = require('child_process');

async function test() {
  try {
    const accessKeyId = execSync('gcloud secrets versions access latest --secret="AWS_ACCESS_KEY_ID" --project="literexia-capstone-project"').toString().trim();
    const secretAccessKey = execSync('gcloud secrets versions access latest --secret="AWS_SECRET_ACCESS_KEY" --project="literexia-capstone-project"').toString().trim();
    const bucket = 'literexia-bucket';

    console.log('Testing S3 connection...');
    
    // Regions to try
    const regions = ['ap-southeast-1', 'ap-southeast-2', 'us-east-1'];
    
    for (const region of regions) {
      console.log(`Trying region: ${region}...`);
      const client = new S3Client({
        region,
        credentials: { accessKeyId, secretAccessKey }
      });

      try {
        const command = new ListObjectsV2Command({ Bucket: bucket, MaxKeys: 1 });
        const response = await client.send(command);
        console.log(`✅ SUCCESS in region ${region}!`);
        process.exit(0);
      } catch (err) {
        console.log(`❌ Failed in ${region}: ${err.message}`);
      }
    }
  } catch (err) {
    console.error('Fatal error:', err.message);
  }
}

test();
