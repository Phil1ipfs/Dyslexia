const express = require('express');
const router = express.Router();
const UploadController = require('../controllers/uploadController');
const uploadAuthMiddleware = require('../middleware/uploadAuthMiddleware');
const multer = require('multer');
const gcsStorage = require('../utils/gcsStorage'); // uploads now go to GCS
const imageUrlValidator = require('../utils/imageUrlValidator');

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
    fileSize: 5 * 1024 * 1024, // 5MB limit
    files: 1, // Only allow 1 file per request
    fields: 10, // Limit number of fields
    fieldNameSize: 100, // Limit field name size
    fieldSize: 1024 * 1024 // 1MB limit for field values
  },
  fileFilter: (req, file, cb) => {
    // Allowed file types for security
    const allowedMimeTypes = [
      'image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp',
      'application/pdf', 'text/plain', 'text/csv',
      'application/vnd.ms-excel', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    ];

    // Check MIME type
    if (!allowedMimeTypes.includes(file.mimetype)) {
      return cb(new Error(`File type ${file.mimetype} not allowed. Allowed types: ${allowedMimeTypes.join(', ')}`), false);
    }

    // Check file extension
    const allowedExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.pdf', '.txt', '.csv', '.xls', '.xlsx'];
    const fileExtension = file.originalname.toLowerCase().substring(file.originalname.lastIndexOf('.'));

    if (!allowedExtensions.includes(fileExtension)) {
      return cb(new Error(`File extension ${fileExtension} not allowed. Allowed extensions: ${allowedExtensions.join(', ')}`), false);
    }

    cb(null, true);
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
      
      // COMPREHENSIVE sanitization to prevent corruption and special character issues
      const sanitizedOriginalName = file.originalname
        .replace(/[^\w\s.-]/g, '') // Remove special characters except word chars, spaces, dots, and dashes
        .replace(/\s+/g, '-') // Replace spaces with dashes
        .replace(/--+/g, '-') // Replace multiple dashes with single dash
        .replace(/^-+|-+$/g, '') // Remove leading/trailing dashes
        .replace(/\.(js|html|php|exe|bat|cmd|sh|ps1)$/i, '.txt') // Convert dangerous extensions to .txt
        .substring(0, 100); // Limit filename length to prevent issues

      // Additional security check: prevent JavaScript injection in filenames
      if (sanitizedOriginalName.includes('javascript:') ||
          sanitizedOriginalName.includes('async') ||
          sanitizedOriginalName.includes('=>') ||
          sanitizedOriginalName.includes('function') ||
          sanitizedOriginalName.includes('<script')) {
        console.error('Invalid filename: contains potentially dangerous content:', file.originalname);
        return res.status(400).json({
          success: false,
          message: 'Invalid filename: contains potentially dangerous content'
        });
      }
      
      const fileName = `${path}/${Date.now()}-${sanitizedOriginalName}`;

      // Set up S3 parameters
      const params = {
        Bucket: process.env.AWS_S3_BUCKET || 'literexia-bucket',
        Key: fileName,
        Body: file.buffer,
        ContentType: file.mimetype,
      };

      // Upload to S3
      try {
        console.log(`🚀 Uploading file to GCS: ${fileName}`);
        const fileUrl = await gcsStorage.uploadBuffer(params.Body, params.Key, params.ContentType);
        console.log(`✅ File uploaded successfully: ${fileUrl}`);

        return res.status(200).json({
          success: true,
          message: 'File uploaded successfully',
          url: fileUrl,
          verified: true
        });
      } catch (s3Error) {
        console.error('❌ S3 upload error:', s3Error);

        // Provide fallback image even if upload completely fails
        const fallbackResult = await imageUrlValidator.validateOrFallback('', path);

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

// Multer error handling middleware
router.use((error, req, res, next) => {
  if (error instanceof multer.MulterError) {
    console.log('Multer error:', error.message);

    switch (error.code) {
      case 'LIMIT_FILE_SIZE':
        return res.status(400).json({
          success: false,
          message: 'File too large. Maximum size allowed is 5MB.',
          error: 'FILE_TOO_LARGE'
        });
      case 'LIMIT_FILE_COUNT':
        return res.status(400).json({
          success: false,
          message: 'Too many files. Only 1 file allowed per request.',
          error: 'TOO_MANY_FILES'
        });
      case 'LIMIT_FIELD_COUNT':
        return res.status(400).json({
          success: false,
          message: 'Too many fields in request.',
          error: 'TOO_MANY_FIELDS'
        });
      case 'LIMIT_UNEXPECTED_FILE':
        return res.status(400).json({
          success: false,
          message: 'Unexpected file field.',
          error: 'UNEXPECTED_FILE'
        });
      default:
        return res.status(400).json({
          success: false,
          message: 'File upload error: ' + error.message,
          error: 'UPLOAD_ERROR'
        });
    }
  }

  // Handle file filter errors (from our custom fileFilter)
  if (error.message && error.message.includes('not allowed')) {
    return res.status(400).json({
      success: false,
      message: error.message,
      error: 'INVALID_FILE_TYPE'
    });
  }

  // Pass other errors to default error handler
  next(error);
});

module.exports = router; 