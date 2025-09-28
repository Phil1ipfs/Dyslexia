const { S3Client, PutObjectCommand } = require('@aws-sdk/client-s3');
const { Upload } = require('@aws-sdk/lib-storage');
const multer = require('multer');
const path = require('path');
require('dotenv').config();

const s3Client = new S3Client({
  region: process.env.AWS_REGION,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  },
});

// Custom multer storage engine using AWS SDK v3
class S3Storage {
  constructor(options) {
    this.bucket = options.bucket;
    this.acl = options.acl || 'public-read';
    this.getKey = options.key || function(req, file, cb) {
      const fileName = `uploads/${Date.now()}-${file.originalname}`;
      cb(null, fileName);
    };
    this.getMetadata = options.metadata || function(req, file, cb) {
      cb(null, { fieldName: file.fieldname });
    };
  }

  _handleFile(req, file, cb) {
    this.getKey(req, file, async (err, key) => {
      if (err) return cb(err);

      this.getMetadata(req, file, async (metaErr, metadata) => {
        if (metaErr) return cb(metaErr);

        console.log('Processing file:', file.fieldname);
        console.log('Generating file key:', key);

        try {
          const upload = new Upload({
            client: s3Client,
            params: {
              Bucket: this.bucket,
              Key: key,
              Body: file.stream,
              ContentType: file.mimetype,
              ACL: this.acl,
              Metadata: metadata
            }
          });

          const result = await upload.done();

          cb(null, {
            bucket: this.bucket,
            key: key,
            acl: this.acl,
            contentType: file.mimetype,
            metadata: metadata,
            location: result.Location,
            etag: result.ETag
          });
        } catch (uploadErr) {
          console.error('S3 upload error:', uploadErr);
          cb(uploadErr);
        }
      });
    });
  }

  _removeFile(req, file, cb) {
    // Optional: implement file removal logic here
    cb();
  }
}

const upload = multer({
  storage: new S3Storage({
    bucket: process.env.AWS_BUCKET_NAME,
    acl: 'public-read',
    metadata: function (req, file, cb) {
      console.log('Processing file:', file.fieldname);
      cb(null, { fieldName: file.fieldname });
    },
    key: function (req, file, cb) {
      const fileName = `uploads/${Date.now()}-${file.originalname}`;
      console.log('Generating file key:', fileName);
      cb(null, fileName);
    }
  }),
});

module.exports = upload;