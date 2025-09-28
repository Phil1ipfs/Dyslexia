// Prescriptive Analytics Routes
// Defines API endpoints for prescriptive analysis functionality

const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const prescriptiveAnalyticsController = require('../../controllers/Teachers/prescriptiveAnalyticsController');

// Manual validation middleware functions
const validateCategoryResultId = (req, res, next) => {
  const { categoryResultId } = req.body;
  
  if (!categoryResultId) {
    return res.status(400).json({
      success: false,
      message: 'Category result ID is required',
      errors: [{ field: 'categoryResultId', message: 'Category result ID is required' }]
    });
  }
  
  if (!mongoose.Types.ObjectId.isValid(categoryResultId)) {
    return res.status(400).json({
      success: false,
      message: 'Invalid category result ID format',
      errors: [{ field: 'categoryResultId', message: 'Invalid MongoDB ObjectId format' }]
    });
  }
  
  next();
};

const validateStudentId = (req, res, next) => {
  const { studentId } = req.params;
  const studentIdInt = parseInt(studentId);
  
  if (!studentId || isNaN(studentIdInt) || studentIdInt < 1) {
    return res.status(400).json({
      success: false,
      message: 'Student ID must be a positive integer',
      errors: [{ field: 'studentId', message: 'Student ID must be a positive integer' }]
    });
  }
  
  next();
};

const validateInterventionUpdate = (req, res, next) => {
  const { studentId, interventionResultId } = req.body;
  const studentIdInt = parseInt(studentId);
  
  if (!studentId || isNaN(studentIdInt) || studentIdInt < 1) {
    return res.status(400).json({
      success: false,
      message: 'Student ID must be a positive integer',
      errors: [{ field: 'studentId', message: 'Student ID must be a positive integer' }]
    });
  }
  
  if (!interventionResultId || !mongoose.Types.ObjectId.isValid(interventionResultId)) {
    return res.status(400).json({
      success: false,
      message: 'Invalid intervention result ID format',
      errors: [{ field: 'interventionResultId', message: 'Invalid MongoDB ObjectId format' }]
    });
  }
  
  next();
};

const validateAnalysisId = (req, res, next) => {
  const { id } = req.params;
  
  if (!id || !mongoose.Types.ObjectId.isValid(id)) {
    return res.status(400).json({
      success: false,
      message: 'Invalid analysis ID format',
      errors: [{ field: 'id', message: 'Invalid MongoDB ObjectId format' }]
    });
  }
  
  next();
};

const validateCategory = (req, res, next) => {
  const { category } = req.params;
  const validCategories = ['Alphabet Knowledge', 'Phonological Awareness', 'Decoding', 'Word Recognition', 'Reading Comprehension'];
  
  if (!category || !validCategories.includes(category)) {
    return res.status(400).json({
      success: false,
      message: 'Invalid category name',
      errors: [{ field: 'category', message: 'Category must be one of: ' + validCategories.join(', ') }]
    });
  }
  
  next();
};

const validateOptionalAssessmentType = (req, res, next) => {
  const { assessmentType } = req.query;
  
  if (assessmentType && !['main', 'intervention'].includes(assessmentType)) {
    return res.status(400).json({
      success: false,
      message: 'Assessment type must be either "main" or "intervention"',
      errors: [{ field: 'assessmentType', message: 'Assessment type must be either "main" or "intervention"' }]
    });
  }
  
  next();
};

const validateTimePredictionRequest = (req, res, next) => {
  const { studentId, category, readingLevel } = req.body;
  const studentIdInt = parseInt(studentId);
  
  if (!studentId || isNaN(studentIdInt) || studentIdInt < 1) {
    return res.status(400).json({
      success: false,
      message: 'Student ID must be a positive integer',
      errors: [{ field: 'studentId', message: 'Student ID must be a positive integer' }]
    });
  }
  
  const validCategories = ['Alphabet Knowledge', 'Phonological Awareness', 'Decoding', 'Word Recognition', 'Reading Comprehension'];
  if (!category || !validCategories.includes(category)) {
    return res.status(400).json({
      success: false,
      message: 'Invalid category name',
      errors: [{ field: 'category', message: 'Category must be one of: ' + validCategories.join(', ') }]
    });
  }
  
  const validReadingLevels = ['Low Emerging', 'High Emerging', 'Developing', 'Transitioning', 'At Grade Level'];
  if (!readingLevel || !validReadingLevels.includes(readingLevel)) {
    return res.status(400).json({
      success: false,
      message: 'Invalid reading level',
      errors: [{ field: 'readingLevel', message: 'Reading level must be one of: ' + validReadingLevels.join(', ') }]
    });
  }
  
  next();
};

const validateDynamicQuestionsRequest = (req, res, next) => {
  const { analysisId, category } = req.body;
  
  if (!analysisId || !mongoose.Types.ObjectId.isValid(analysisId)) {
    return res.status(400).json({
      success: false,
      message: 'Invalid analysis ID format',
      errors: [{ field: 'analysisId', message: 'Invalid MongoDB ObjectId format' }]
    });
  }
  
  const validCategories = ['Alphabet Knowledge', 'Phonological Awareness', 'Decoding', 'Word Recognition', 'Reading Comprehension'];
  if (!category || !validCategories.includes(category)) {
    return res.status(400).json({
      success: false,
      message: 'Invalid category name',
      errors: [{ field: 'category', message: 'Category must be one of: ' + validCategories.join(', ') }]
    });
  }
  
  next();
};

const validatePagination = (req, res, next) => {
  const { limit, page } = req.query;
  
  if (limit) {
    const limitInt = parseInt(limit);
    if (isNaN(limitInt) || limitInt < 1 || limitInt > 100) {
      return res.status(400).json({
        success: false,
        message: 'Limit must be between 1 and 100',
        errors: [{ field: 'limit', message: 'Limit must be between 1 and 100' }]
      });
    }
  }
  
  if (page) {
    const pageInt = parseInt(page);
    if (isNaN(pageInt) || pageInt < 1) {
      return res.status(400).json({
        success: false,
        message: 'Page must be a positive integer',
        errors: [{ field: 'page', message: 'Page must be a positive integer' }]
      });
    }
  }
  
  next();
};

// POST /api/prescriptive-analytics/generate
// Generate prescriptive analysis after category results are created
router.post('/generate', 
  validateCategoryResultId,
  prescriptiveAnalyticsController.generateAnalysis
);

// GET /api/prescriptive-analytics/:id
// Get prescriptive analysis by ID
router.get('/:id', 
  validateAnalysisId,
  prescriptiveAnalyticsController.getAnalysisById
);

// GET /api/prescriptive-analytics/student/:studentId/latest
// Get latest prescriptive analysis for a student
router.get('/student/:studentId/latest',
  validateStudentId,
  validateOptionalAssessmentType,
  prescriptiveAnalyticsController.getLatestAnalysisForStudent
);

// GET /api/prescriptive-analytics/student/:studentId
// Get all prescriptive analyses for a student with pagination
router.get('/student/:studentId',
  validateStudentId,
  validatePagination,
  validateOptionalAssessmentType,
  prescriptiveAnalyticsController.getAnalysesForStudent
);

// PUT /api/prescriptive-analytics/update-after-intervention
// Update analysis after intervention completion
router.put('/update-after-intervention',
  validateInterventionUpdate,
  prescriptiveAnalyticsController.updateAfterIntervention
);

// GET /api/prescriptive-analytics/face-to-face-check/:studentId/:category
// Check if student needs face-to-face intervention
router.get('/face-to-face-check/:studentId/:category',
  validateStudentId,
  validateCategory,
  prescriptiveAnalyticsController.checkFaceToFaceNeeded
);

// GET /api/prescriptive-analytics/dashboard/:studentId
// Get analysis summary for dashboard display
router.get('/dashboard/:studentId',
  validateStudentId,
  prescriptiveAnalyticsController.getDashboardSummary
);

// GET /api/prescriptive-analytics/skill-mastery/:studentId
// Get detailed skill mastery report
router.get('/skill-mastery/:studentId',
  validateStudentId,
  (req, res, next) => {
    const { category } = req.query;
    const validCategories = ['Alphabet Knowledge', 'Phonological Awareness', 'Decoding', 'Word Recognition', 'Reading Comprehension'];
    
    if (category && !validCategories.includes(category)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid category name',
        errors: [{ field: 'category', message: 'Category must be one of: ' + validCategories.join(', ') }]
      });
    }
    next();
  },
  prescriptiveAnalyticsController.getSkillMasteryReport
);

// GET /api/prescriptive-analytics/error-patterns/:studentId
// Get error pattern analysis report
router.get('/error-patterns/:studentId',
  validateStudentId,
  prescriptiveAnalyticsController.getErrorPatternReport
);

// POST /api/prescriptive-analytics/predict-time
// Predict intervention time for a student
router.post('/predict-time',
  validateTimePredictionRequest,
  prescriptiveAnalyticsController.predictInterventionTime
);

// POST /api/prescriptive-analytics/dynamic-questions
// Generate dynamic question plan based on analysis
router.post('/dynamic-questions',
  validateDynamicQuestionsRequest,
  prescriptiveAnalyticsController.generateDynamicQuestions
);

// GET /api/prescriptive-analytics/response-time-patterns/:studentId/:category
// Get student's historical response time patterns
router.get('/response-time-patterns/:studentId/:category',
  validateStudentId,
  validateCategory,
  prescriptiveAnalyticsController.getResponseTimePatterns
);

// GET /api/prescriptive-analytics/health
// System health check endpoint
router.get('/health',
  prescriptiveAnalyticsController.getSystemHealth
);

// Additional endpoints from ManageProgress integration
// POST /api/prescriptive-analytics/comprehensive/:studentId
// Generate comprehensive prescriptive analysis using BKT/IRT models
router.post('/comprehensive/:studentId', 
  validateStudentId,
  prescriptiveAnalyticsController.generateComprehensiveAnalysis
);

// POST /api/prescriptive-analytics/intervention/:interventionId
// Generate prescriptive analysis from intervention results
router.post('/intervention/:interventionId',
  (req, res, next) => {
    const { interventionId } = req.params;
    if (!interventionId || !mongoose.Types.ObjectId.isValid(interventionId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid intervention ID format',
        errors: [{ field: 'interventionId', message: 'Invalid MongoDB ObjectId format' }]
      });
    }
    next();
  },
  prescriptiveAnalyticsController.generateAnalysisFromIntervention
);

// GET /api/prescriptive-analytics/intervention-history/:studentId
// Get intervention history with analytics for a student
router.get('/intervention-history/:studentId',
  validateStudentId,
  prescriptiveAnalyticsController.getInterventionHistory
);

// PUT /api/prescriptive-analytics/template
// Update recommendation template for easy updates
router.put('/template',
  (req, res, next) => {
    const { templateType, templateContent } = req.body;
    if (!templateType || !templateContent) {
      return res.status(400).json({
        success: false,
        message: 'Template type and content are required',
        errors: [
          { field: 'templateType', message: 'Template type is required' },
          { field: 'templateContent', message: 'Template content is required' }
        ]
      });
    }
    next();
  },
  prescriptiveAnalyticsController.updateRecommendationTemplate
);

// GET /api/prescriptive-analytics/templates
// Get available templates
router.get('/templates',
  prescriptiveAnalyticsController.getAvailableTemplates
);

// Progress Tracking and Analytics Routes

// GET /api/prescriptive-analytics/progress/:studentId
// Get comprehensive progress tracking analytics for a student
router.get('/progress/:studentId',
  validateStudentId,
  (req, res, next) => {
    const { dateRange } = req.query;
    const validDateRanges = ['30d', '60d', '90d', 'all'];
    
    if (dateRange && !validDateRanges.includes(dateRange)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid date range',
        errors: [{ field: 'dateRange', message: 'Date range must be one of: ' + validDateRanges.join(', ') }]
      });
    }
    next();
  },
  prescriptiveAnalyticsController.getProgressAnalytics
);

// GET /api/prescriptive-analytics/intervention-comparison/:studentId
// Get before/after intervention comparison analytics
router.get('/intervention-comparison/:studentId',
  validateStudentId,
  (req, res, next) => {
    const { category } = req.query;
    const validCategories = ['Alphabet Knowledge', 'Phonological Awareness', 'Decoding', 'Word Recognition', 'Reading Comprehension'];
    
    if (category && !validCategories.includes(category)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid category name',
        errors: [{ field: 'category', message: 'Category must be one of: ' + validCategories.join(', ') }]
      });
    }
    next();
  },
  prescriptiveAnalyticsController.getInterventionComparisons
);

// GET /api/prescriptive-analytics/category-progress/:studentId/:category
// Get category-specific progress trends
router.get('/category-progress/:studentId/:category',
  validateStudentId,
  validateCategory,
  (req, res, next) => {
    const { dateRange } = req.query;
    const validDateRanges = ['30d', '60d', '90d', 'all'];
    
    if (dateRange && !validDateRanges.includes(dateRange)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid date range',
        errors: [{ field: 'dateRange', message: 'Date range must be one of: ' + validDateRanges.join(', ') }]
      });
    }
    next();
  },
  prescriptiveAnalyticsController.getCategoryProgress
);

// GET /api/prescriptive-analytics/intervention-effectiveness/:studentId
// Get intervention effectiveness analytics
router.get('/intervention-effectiveness/:studentId',
  validateStudentId,
  prescriptiveAnalyticsController.getInterventionEffectiveness
);

// Error handling middleware
router.use((error, req, res, next) => {
  console.error('Prescriptive Analytics Route Error:', error);
  
  if (error.name === 'ValidationError') {
    return res.status(400).json({
      success: false,
      message: 'Validation error',
      errors: Object.values(error.errors).map(err => err.message)
    });
  }
  
  if (error.name === 'CastError') {
    return res.status(400).json({
      success: false,
      message: 'Invalid ID format'
    });
  }
  
  res.status(500).json({
    success: false,
    message: 'Internal server error',
    error: process.env.NODE_ENV === 'development' ? error.message : 'Something went wrong'
  });
});

module.exports = router;