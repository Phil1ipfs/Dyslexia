const express = require('express');
const router = express.Router();
const { authenticateToken, authorize } = require('../../middleware/auth');
const mainAssessmentController = require('../../controllers/Teachers/mainAssessmentController');
const multer = require('multer');
const { PutObjectCommand } = require('@aws-sdk/client-s3');
const s3Client = require('../../config/s3');

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

// File upload route for S3 - with conditional authentication
router.post('/upload-image', 
  (req, res, next) => {
    // Optional authentication middleware for development environments
    if (process.env.NODE_ENV === 'development' || process.env.BYPASS_AUTH === 'true') {
      console.log('[MAIN ASSESSMENT] Bypassing authentication for image upload in development');
      // Assign a default teacher role for development
      req.user = { 
        id: 'dev-user-id',
        roles: ['teacher']
      };
      return next();
    }
    // Otherwise use standard auth
    authenticateToken(req, res, next);
  },
  (req, res, next) => {
    // Optional role authorization middleware for development
    if (process.env.NODE_ENV === 'development' || process.env.BYPASS_AUTH === 'true') {
      console.log('[MAIN ASSESSMENT] Bypassing role authorization for image upload in development');
      return next();
    }
    // Otherwise use standard role authorization
    authorize('teacher', 'guro', 'admin')(req, res, next);
  },
  upload, 
  async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ success: false, message: 'No file uploaded' });
      }

      // Get file details
      const file = req.file;
      const path = req.body.path || 'main-assessment';
      const fileName = `${path}/${Date.now()}-${file.originalname.replace(/\s+/g, '-')}`;

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

// === QUESTION MANAGEMENT ENDPOINTS ===

// GET all assessments with pagination and filtering
router.get(
  '/', 
  authenticateToken, 
  authorize('teacher', 'guro', 'admin'), 
  mainAssessmentController.getAllAssessments
);

// GET assessment by ID
router.get(
  '/:id', 
  authenticateToken, 
  authorize('teacher', 'guro', 'admin'), 
  mainAssessmentController.getAssessmentById
);

// GET questions by reading level and category
router.get(
  '/:readingLevel/:category', 
  authenticateToken, 
  authorize('teacher', 'guro', 'admin'), 
  mainAssessmentController.getQuestionsByLevelAndCategory
);

// POST create new assessment
router.post(
  '/', 
  (req, res, next) => {
    // Optional authentication middleware for development environments
    if (process.env.NODE_ENV === 'development' || process.env.BYPASS_AUTH === 'true') {
      console.log('[MAIN ASSESSMENT] Bypassing authentication for development');
      // Assign a default teacher role for development
      req.user = { 
        id: 'dev-user-id',
        roles: ['teacher']
      };
      return next();
    }
    // Otherwise use standard auth
    authenticateToken(req, res, next);
  },
  (req, res, next) => {
    // Optional role authorization middleware for development
    if (process.env.NODE_ENV === 'development' || process.env.BYPASS_AUTH === 'true') {
      console.log('[MAIN ASSESSMENT] Bypassing role authorization for development');
      return next();
    }
    // Otherwise use standard role authorization
    authorize('teacher', 'guro', 'admin')(req, res, next);
  },
  mainAssessmentController.createAssessment
);

// PUT update existing assessment
router.put(
  '/:id', 
  authenticateToken, 
  authorize('teacher', 'guro', 'admin'), 
  mainAssessmentController.updateAssessment
);

// DELETE assessment
router.delete(
  '/:id', 
  authenticateToken, 
  authorize('teacher', 'guro', 'admin'), 
  mainAssessmentController.deleteAssessment
);

// PATCH toggle assessment status
router.patch(
  '/:id/status', 
  authenticateToken, 
  authorize('teacher', 'guro', 'admin'), 
  mainAssessmentController.toggleAssessmentStatus
);

// === RESPONSE ANALYSIS ENDPOINTS ===

// GET student responses for analysis
router.get(
  '/responses/:studentId',
  authenticateToken,
  authorize('teacher', 'guro', 'admin'),
  mainAssessmentController.getStudentResponses
);

// GET student results with answer analysis by category
router.get(
  '/results/:studentId/:category',
  authenticateToken,
  authorize('teacher', 'guro', 'admin'),
  mainAssessmentController.getStudentResults
);

// GET student progress across all categories
router.get(
  '/progress/:studentId',
  authenticateToken,
  authorize('teacher', 'guro', 'admin'),
  mainAssessmentController.getStudentProgress
);

module.exports = router;