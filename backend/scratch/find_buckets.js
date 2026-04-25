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

    console.log('Searching for buckets...');
    const { Buckets } = await client.send(new ListBucketsCommand({}));
    
    console.log(`Found ${Buckets.length} buckets:`);
    for (const bucket of Buckets) {
      console.log(`- ${bucket.Name}`);
      
      // Check if this bucket has any files
      try {
        const objClient = new S3Client({ region: 'ap-southeast-1', credentials: { accessKeyId, secretAccessKey } });
        const { Contents } = await objClient.send(new ListObjectsV2Command({ Bucket: bucket.Name, MaxKeys: 1 }));
        if (Contents && Contents.length > 0) {
          console.log(`  ✅ This bucket HAS files!`);
        } else {
          console.log(`  ❌ This bucket is EMPTY.`);
        }
      } catch (e) {
        // Try other region if ap-southeast-1 fails
        try {
          const objClient = new S3Client({ region: 'ap-southeast-2', credentials: { accessKeyId, secretAccessKey } });
          const { Contents } = await objClient.send(new ListObjectsV2Command({ Bucket: bucket.Name, MaxKeys: 1 }));
          if (Contents && Contents.length > 0) {
            console.log(`  ✅ This bucket HAS files (in ap-southeast-2)!`);
          }
        } catch (e2) {}
      }
    }
  } catch (err) {
    console.error('Error:', err.message);
  }
}

findImages();
