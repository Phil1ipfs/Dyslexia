// Central Google Cloud Storage helper. All image/file uploads in the app go
// through here (migrated off AWS S3 after the AWS account was suspended).
// On Cloud Run, Application Default Credentials (the service account) are used
// automatically — no keys needed.
const { Storage } = require('@google-cloud/storage');
const path = require('path');

const storage = new Storage();
const BUCKET = process.env.GCS_BUCKET || 'literexia-uploads';
const UPLOAD_TIMEOUT_MS = 10000; // fail fast so a slow upload can't 504 the request

function publicUrl(key) {
  return `https://storage.googleapis.com/${BUCKET}/${key}`;
}

// Generate a unique object key, optionally under a folder/prefix.
function makeKey(originalname = 'file', folder = '') {
  const ext = path.extname(originalname) || '';
  const name = `${Date.now()}_${Math.random().toString(36).substring(2, 8)}${ext}`;
  return folder ? `${folder.replace(/\/$/, '')}/${name}` : name;
}

async function uploadBuffer(buffer, key, contentType) {
  const blob = storage.bucket(BUCKET).file(key);
  await Promise.race([
    blob.save(buffer, { contentType, resumable: false }),
    new Promise((_, reject) =>
      setTimeout(() => reject(new Error(`GCS upload timed out after ${UPLOAD_TIMEOUT_MS}ms`)), UPLOAD_TIMEOUT_MS)
    ),
  ]);
  return publicUrl(key);
}

// Upload a multer file (memoryStorage → file.buffer) and return the public URL.
async function uploadFile(file, folder = '') {
  return uploadBuffer(file.buffer, makeKey(file.originalname, folder), file.mimetype);
}

// Pull the object key out of a GCS URL (or a legacy S3 URL, for cleanup of old data).
function keyFromUrl(url) {
  if (!url || typeof url !== 'string') return null;
  let m = url.match(/storage\.googleapis\.com\/[^/]+\/(.+)$/);
  if (m) return decodeURIComponent(m[1]);
  m = url.match(/amazonaws\.com\/(.+)$/); // legacy S3
  if (m) return decodeURIComponent(m[1]);
  return null;
}

async function deleteByUrl(url) {
  const key = keyFromUrl(url);
  if (!key) return false;
  try {
    await storage.bucket(BUCKET).file(key).delete({ ignoreNotFound: true });
    return true;
  } catch (err) {
    console.warn(`[GCS] Could not delete ${key}: ${err.message}`);
    return false;
  }
}

module.exports = { uploadBuffer, uploadFile, deleteByUrl, publicUrl, makeKey, keyFromUrl, BUCKET, storage };
