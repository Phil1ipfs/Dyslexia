const express = require('express');
const router = express.Router();
const { authenticateToken, authorize } = require('../../middleware/auth');
const mainAssessmentController = require('../../controllers/Teachers/mainAssessmentController');
const multer = require('multer');
const { PutObjectCommand } = require('@aws-sdk/client-s3');
const s3Client = require('../../config/s3');
const path = require('path');

// Storage config for multer
const storage = multer.memoryStorage();
const upload = multer({
  storage,
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB limit
  }
}).single('file');

// Route middleware - log all requests
router.use((req, res, next) => {
  console.log(`[MAIN ASSESSMENT] ${req.method} ${req.originalUrl}`);
  next();
});

// Ping route to check API availability - no auth required
router.get('/ping', (req, res) => {
  res.status(200).json({ success: true, message: "Main Assessment API is available" });
});

// File upload route for S3 - no auth temporarily
router.post('/upload-image', (req, res) => {
  upload(req, res, async (err) => {
    if (err) {
      console.error("Upload error:", err);
      return res.status(400).json({
        success: false,
        message: "File upload failed",
        error: err.message
      });
    }

    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: "No file provided"
      });
    }

    try {
      // Generate a unique filename
      const timestamp = Date.now();
      const originalName = req.file.originalname.replace(/\s+/g, '-').toLowerCase();
      const filename = `${timestamp}-${originalName}`;
      
      // Get path from the request or use default
      const uploadPath = req.body.path || 'main-assessment';
      
      // Configure S3 upload parameters
      const s3Params = {
        Bucket: process.env.AWS_BUCKET_NAME || 'literexia-bucket',
        Key: `${uploadPath}/${filename}`,
        Body: req.file.buffer,
        ContentType: req.file.mimetype,
        ACL: 'public-read'
      };
      
      // Upload to S3
      await s3Client.send(new PutObjectCommand(s3Params));
      
      // Return success response with file URL
      const region = process.env.AWS_REGION || 'ap-southeast-2';
      const bucket = process.env.AWS_BUCKET_NAME || 'literexia-bucket';
      const fileUrl = `https://${bucket}.s3.${region}.amazonaws.com/${uploadPath}/${filename}`;
      
      return res.status(200).json({
        success: true,
        message: "File uploaded successfully",
        filename: filename,
        url: fileUrl
      });
    } catch (error) {
      console.error("Error uploading to S3:", error);
      
      // For development, return a mock URL to allow testing
      if (process.env.NODE_ENV !== 'production') {
        const mockUrl = `https://literexia-bucket.s3.ap-southeast-2.amazonaws.com/${req.body.path || 'main-assessment'}/${Date.now()}-${req.file.originalname}`;
        console.log("Using mock URL for development:", mockUrl);
        
        return res.status(200).json({
          success: true,
          message: "Development mode: Using mock S3 URL",
          filename: `${Date.now()}-${req.file.originalname}`,
          url: mockUrl,
          isMock: true
        });
      }
      
      return res.status(500).json({
        success: false,
        message: "Failed to upload file to S3",
        error: error.message
      });
    }
  });
});

// GET all assessments with pagination and filtering
router.get(
  '/', 
  authenticateToken, 
  authorize('teacher', 'guro'), 
  mainAssessmentController.getAllAssessments
);

// GET assessment by ID
router.get(
  '/:id', 
  authenticateToken, 
  authorize('teacher', 'guro'), 
  mainAssessmentController.getAssessmentById
);

// GET filtered assessments
router.get(
  '/filter/by-criteria', 
  authenticateToken, 
  authorize('teacher', 'guro'), 
  mainAssessmentController.getFilteredAssessments
);

// POST create new assessment
router.post(
  '/', 
  authenticateToken, 
  authorize('teacher', 'guro'), 
  mainAssessmentController.createAssessment
);

// PUT update existing assessment
router.put(
  '/:id', 
  authenticateToken, 
  authorize('teacher', 'guro'), 
  mainAssessmentController.updateAssessment
);

// DELETE assessment
router.delete(
  '/:id', 
  authenticateToken, 
  authorize('teacher', 'guro'), 
  mainAssessmentController.deleteAssessment
);

// PATCH toggle assessment status
router.patch(
  '/:id/status', 
  authenticateToken, 
  authorize('teacher', 'guro'), 
  mainAssessmentController.toggleAssessmentStatus
);

module.exports = router; 