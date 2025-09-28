const express = require('express');
const router = express.Router();
const UploadController = require('../controllers/uploadController');
const uploadAuthMiddleware = require('../middleware/uploadAuthMiddleware');
const multer = require('multer');
const { PutObjectCommand } = require('@aws-sdk/client-s3');
const s3Client = require('../config/s3');
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
        ACL: 'public-read'
      };

      // Upload to S3
      try {
        console.log(`🚀 Uploading file to S3: ${fileName}`);
        await s3Client.send(new PutObjectCommand(params));

        // Construct the URL of the uploaded file
        const fileUrl = `https://${params.Bucket}.s3.${process.env.AWS_REGION || 'ap-southeast-2'}.amazonaws.com/${fileName}`;
        console.log(`📁 File uploaded to S3, attempting verification: ${fileUrl}`);

        // CRITICAL: Verify the file is actually accessible before returning success
        const verificationResult = await imageUrlValidator.validateOrFallback(fileUrl, path);

        if (verificationResult.isOriginal) {
          console.log(`✅ Upload verification successful: ${fileUrl}`);
          return res.status(200).json({
            success: true,
            message: 'File uploaded and verified successfully',
            url: fileUrl,
            verified: true,
            isOriginal: true
          });
        } else {
          console.warn(`⚠️ Upload verification failed, using fallback: ${verificationResult.url}`);

          // Delete the failed upload to prevent storage waste
          try {
            const { DeleteObjectCommand } = require('@aws-sdk/client-s3');
            await s3Client.send(new DeleteObjectCommand({
              Bucket: params.Bucket,
              Key: fileName
            }));
            console.log(`🗑️ Cleaned up failed upload: ${fileName}`);
          } catch (deleteError) {
            console.error('Failed to cleanup failed upload:', deleteError);
          }

          return res.status(200).json({
            success: true,
            message: 'Upload completed but verification failed, using fallback image',
            url: verificationResult.url,
            verified: false,
            isFallback: true,
            originalUrl: fileUrl,
            category: verificationResult.category,
            warning: 'Original upload failed verification, fallback image provided for mobile compatibility'
          });
        }
      } catch (s3Error) {
        console.error('❌ S3 upload error:', s3Error);

        // Provide fallback image even if upload completely fails
        const fallbackResult = await imageUrlValidator.validateOrFallback('', path);

        return res.status(500).json({
          success: false,
          message: 'Error uploading to S3, providing fallback image',
          error: s3Error.message,
          fallbackUrl: fallbackResult.url,
          isFallback: true,
          category: fallbackResult.category,
          recommendation: 'Use fallback URL for mobile compatibility'
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