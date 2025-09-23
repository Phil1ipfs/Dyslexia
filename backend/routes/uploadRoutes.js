const express = require('express');
const router = express.Router();
const UploadController = require('../controllers/uploadController');
const uploadAuthMiddleware = require('../middleware/uploadAuthMiddleware');
const multer = require('multer');
const { PutObjectCommand } = require('@aws-sdk/client-s3');
const s3Client = require('../config/s3');

// Log all requests to this router
router.use((req, res, next) => {
  console.log(`[uploadRoutes] ${req.method} ${req.originalUrl}`);
  next();
});

// Storage config for multer
const storage = multer.memoryStorage();
const upload = multer({
  storage,
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB limit
  }
}).single('file');

// General S3 upload endpoint for backwards compatibility
router.post('/s3', 
  upload, 
  async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ success: false, message: 'No file uploaded' });
      }

      // Get file details
      const file = req.file;
      const path = req.body.path || 'general';
      
      // Sanitize filename to prevent corruption and special character issues
      const sanitizedOriginalName = file.originalname
        .replace(/[^\w\s.-]/g, '') // Remove special characters except word chars, spaces, dots, and dashes
        .replace(/\s+/g, '-') // Replace spaces with dashes
        .replace(/--+/g, '-') // Replace multiple dashes with single dash
        .replace(/^-+|-+$/g, ''); // Remove leading/trailing dashes
      
      const fileName = `${path}/${Date.now()}-${sanitizedOriginalName}`;

      // Set up S3 parameters
      const params = {
        Bucket: process.env.AWS_S3_BUCKET || 'literexia-bucket',
        Key: fileName,
        Body: file.buffer,
        ContentType: file.mimetype,
        ACL: 'public-read'
      };

      // Upload to S3
      try {
        await s3Client.send(new PutObjectCommand(params));
        
        // Construct the URL of the uploaded file
        const fileUrl = `https://${params.Bucket}.s3.${process.env.AWS_REGION || 'ap-southeast-2'}.amazonaws.com/${fileName}`;
        
        return res.status(200).json({
          success: true,
          message: 'File uploaded successfully',
          url: fileUrl
        });
      } catch (s3Error) {
        console.error('S3 upload error:', s3Error);
        return res.status(500).json({
          success: false,
          message: 'Error uploading to S3',
          error: s3Error.message
        });
      }
    } catch (error) {
      console.error('Server error during upload:', error);
      return res.status(500).json({
        success: false,
        message: 'Server error during upload',
        error: error.message
      });
    }
  }
);

// Routes for file uploads - using the special auth middleware for uploads
router.post('/pdf', uploadAuthMiddleware, UploadController.uploadPdfToS3);

// Routes for getting PDFs - no auth required
router.get('/pdf/:id', UploadController.getPdf);
router.get('/pdf/local/:id', UploadController.getPdf);

module.exports = router; 