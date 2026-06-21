// Image uploads now go to Google Cloud Storage (migrated off AWS S3 after the
// AWS account was suspended). The export name `uploadToS3` is kept so existing
// callers (studentAdminController, etc.) work unchanged — only the storage
// backend changed. On Cloud Run, Application Default Credentials (the service
// account) are used automatically, so no keys are needed.
const { Storage } = require('@google-cloud/storage');
const path = require('path');

const storage = new Storage();
const BUCKET = process.env.GCS_BUCKET || 'literexia-uploads';

// Bound how long an upload may take so a slow/hung storage backend can't make the
// whole request hang until Cloud Run's 300s timeout (which the browser sees as a
// 504 on create/update). On timeout the caller's try/catch degrades gracefully
// (saves the record without the image). 10s is generous for a small profile image.
const UPLOAD_TIMEOUT_MS = 10000;

async function uploadToS3(file, folder = '') {
  const ext = path.extname(file.originalname);
  const filename = `${Date.now()}_${Math.random().toString(36).substring(2, 8)}${ext}`;
  const key = folder ? `${folder}/${filename}` : filename;

  const blob = storage.bucket(BUCKET).file(key);

  await Promise.race([
    blob.save(file.buffer, {
      contentType: file.mimetype,
      resumable: false, // simple one-shot upload — fine for small profile images
    }),
    new Promise((_, reject) =>
      setTimeout(() => reject(new Error(`GCS upload timed out after ${UPLOAD_TIMEOUT_MS}ms`)), UPLOAD_TIMEOUT_MS)
    ),
  ]);

  // Public URL (bucket has allUsers objectViewer)
  return `https://storage.googleapis.com/${BUCKET}/${key}`;
}

module.exports = uploadToS3;
