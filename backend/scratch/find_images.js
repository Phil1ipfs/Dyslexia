const { S3Client, ListBucketsCommand, ListObjectsV2Command } = require('@aws-sdk/client-s3');
const { execSync } = require('child_process');

async function findImages() {
  try {
    const accessKeyId = execSync('gcloud secrets versions access latest --secret="AWS_ACCESS_KEY_ID" --project="literexia-capstone-project"').toString().trim();
    const secretAccessKey = execSync('gcloud secrets versions access latest --secret="AWS_SECRET_ACCESS_KEY" --project="literexia-capstone-project"').toString().trim();

    const client = new S3Client({
      region: 'ap-southeast-1',
      credentials: { accessKeyId, secretAccessKey }
    });

    const { Buckets } = await client.send(new ListBucketsCommand({}));
    
    console.log(`Checking ${Buckets.length} buckets for assessment images...`);
    
    for (const bucket of Buckets) {
      const regions = ['ap-southeast-1', 'ap-southeast-2', 'us-east-1'];
      for (const region of regions) {
        try {
          const objClient = new S3Client({ region, credentials: { accessKeyId, secretAccessKey } });
          const { Contents } = await objClient.send(new ListObjectsV2Command({ 
            Bucket: bucket.Name, 
            Prefix: 'pre-assessment/', 
            MaxKeys: 1 
          }));
          
          if (Contents && Contents.length > 0) {
            console.log(`🎯 FOUND IT! Bucket: ${bucket.Name} in Region: ${region}`);
            console.log(`   Sample file: ${Contents[0].Key}`);
            process.exit(0);
          }
        } catch (e) {}
      }
    }
    console.log('❌ Could not find "pre-assessment/" folder in any bucket.');
  } catch (err) {
    console.error('Error:', err.message);
  }
}

findImages();
