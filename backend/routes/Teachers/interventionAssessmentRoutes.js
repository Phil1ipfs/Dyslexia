const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const interventionAssessmentController = require('../../controllers/Teachers/interventionAssessmentController');
const { authenticateToken, authorize } = require('../../middleware/auth');

// Validation middleware functions
const validateAnalysisId = (req, res, next) => {
  const { analysisId } = req.body;
  
  if (!analysisId) {
    return res.status(400).json({
      success: false,
      message: 'Prescriptive analysis ID is required',
      errors: [{ field: 'analysisId', message: 'Prescriptive analysis ID is required' }]
    });
  }
  
  if (!mongoose.Types.ObjectId.isValid(analysisId)) {
    return res.status(400).json({
      success: false,
      message: 'Invalid prescriptive analysis ID format',
      errors: [{ field: 'analysisId', message: 'Invalid MongoDB ObjectId format' }]
    });
  }
  
  next();
};

const validateCategory = (req, res, next) => {
  const { category } = req.body || req.params;
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

const validateInterventionId = (req, res, next) => {
  const { interventionId } = req.params;
  
  if (!interventionId || !mongoose.Types.ObjectId.isValid(interventionId)) {
    return res.status(400).json({
      success: false,
      message: 'Invalid intervention ID format',
      errors: [{ field: 'interventionId', message: 'Invalid MongoDB ObjectId format' }]
    });
  }
  
  next();
};

const validateInterventionGeneration = (req, res, next) => {
  const errors = [];
  
  // Check analysisId
  if (!req.body.analysisId || !mongoose.Types.ObjectId.isValid(req.body.analysisId)) {
    errors.push({ field: 'analysisId', message: 'Valid prescriptive analysis ID is required' });
  }
  
  // Check category
  const validCategories = ['Alphabet Knowledge', 'Phonological Awareness', 'Decoding', 'Word Recognition', 'Reading Comprehension'];
  if (!req.body.category || !validCategories.includes(req.body.category)) {
    errors.push({ field: 'category', message: 'Category must be one of: ' + validCategories.join(', ') });
  }
  
  if (errors.length > 0) {
    return res.status(400).json({
      success: false,
      message: 'Validation failed',
      errors
    });
  }
  
  next();
};

const validateEligibilityCheck = (req, res, next) => {
  const { studentId } = req.params;
  const { category } = req.params;
  
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
  
  next();
};

// POST /api/intervention-assessment
// Create new teacher-created intervention assessment
router.post('/',
  authenticateToken,
  authorize('teacher', 'guro', 'admin'),
  (req, res, next) => {
    // Validate required fields for teacher-created interventions
    const errors = [];
    const { studentId, category, questions } = req.body;

    if (!studentId) {
      errors.push({ field: 'studentId', message: 'Student ID is required' });
    }

    if (!category) {
      errors.push({ field: 'category', message: 'Category is required' });
    }

    if (!questions || !Array.isArray(questions) || questions.length === 0) {
      errors.push({ field: 'questions', message: 'At least one question is required' });
    }

    // 🔧 AUTHENTICATION FIX: No longer require teacherImplementation.implementedBy from request
    // This will be automatically populated from req.user.id in the controller

    if (errors.length > 0) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors
      });
    }

    next();
  },
  interventionAssessmentController.createIntervention
);

// POST /api/intervention-assessment/generate
// Generate one-time intervention based on prescriptive analysis
router.post('/generate',
  authenticateToken,
  authorize('teacher', 'guro', 'admin'),
  validateInterventionGeneration,
  interventionAssessmentController.generateIntervention
);

// GET /api/intervention-assessment/eligibility/:studentId/:category
// Check if student is eligible for intervention in a category
router.get('/eligibility/:studentId/:category',
  validateEligibilityCheck,
  interventionAssessmentController.checkEligibility
);

// Add all other specific routes before parameterized routes
// POST /api/intervention-assessment/validate-generation
// Validate intervention generation request without creating
router.post('/validate-generation',
  validateInterventionGeneration,
  interventionAssessmentController.validateInterventionGeneration
);

// GET /api/intervention-assessment/health
// Health check for intervention assessment service
router.get('/health',
  interventionAssessmentController.getServiceHealth
);

// GET /api/intervention-assessment/verify-teacher-profile
// 🔧 AUTHENTICATION VERIFICATION: Verify teacher profile linking
router.get('/verify-teacher-profile',
  authenticateToken,
  authorize('teacher', 'guro', 'admin'),
  interventionAssessmentController.verifyTeacherProfileLinking
);

// GET /api/intervention-assessment/:interventionId
// Get intervention assessment by ID (MOVED AFTER SPECIFIC ROUTES)
router.get('/:interventionId',
  validateInterventionId,
  interventionAssessmentController.getInterventionById
);

// GET /api/intervention-assessment/student/:studentId
// Get all interventions for a student
router.get('/student/:studentId',
  validateStudentId,
  interventionAssessmentController.getInterventionsForStudent
);

// GET /api/intervention-assessment/student/:studentId/active
// Get active interventions for a student
router.get('/student/:studentId/active',
  validateStudentId,
  interventionAssessmentController.getActiveInterventionsForStudent
);

// POST /api/intervention-assessment/:interventionId/start
// Mark intervention as started
router.post('/:interventionId/start',
  validateInterventionId,
  interventionAssessmentController.startIntervention
);

// POST /api/intervention-assessment/:interventionId/complete
// Mark intervention as completed
router.post('/:interventionId/complete',
  validateInterventionId,
  interventionAssessmentController.completeIntervention
);

// GET /api/intervention-assessment/:interventionId/questions
// Get questions for an intervention
router.get('/:interventionId/questions',
  validateInterventionId,
  interventionAssessmentController.getInterventionQuestions
);

// GET /api/intervention-assessment/:interventionId/question/:questionId
// Get a specific question from an intervention
router.get('/:interventionId/question/:questionId',
  validateInterventionId,
  (req, res, next) => {
    const { questionId } = req.params;
    if (!questionId || questionId.trim() === '') {
      return res.status(400).json({
        success: false,
        message: 'Question ID is required',
        errors: [{ field: 'questionId', message: 'Question ID is required' }]
      });
    }
    next();
  },
  interventionAssessmentController.getInterventionQuestion
);

// POST /api/intervention-assessment/:interventionId/response
// Record student response to intervention question
router.post('/:interventionId/response',
  validateInterventionId,
  (req, res, next) => {
    const errors = [];
    
    if (!req.body.questionId) {
      errors.push({ field: 'questionId', message: 'Question ID is required' });
    }
    
    if (req.body.response === undefined || req.body.response === null) {
      errors.push({ field: 'response', message: 'Response is required' });
    }
    
    if (typeof req.body.isCorrect !== 'boolean') {
      errors.push({ field: 'isCorrect', message: 'isCorrect must be a boolean' });
    }
    
    if (errors.length > 0) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors
      });
    }
    
    next();
  },
  interventionAssessmentController.recordResponse
);

// GET /api/intervention-assessment/:interventionId/progress
// Get intervention progress
router.get('/:interventionId/progress',
  validateInterventionId,
  interventionAssessmentController.getInterventionProgress
);

// PUT /api/intervention-assessment/:interventionId
// Update intervention assessment (for revisions/versioning)
router.put('/:interventionId',
  authenticateToken,
  authorize('teacher', 'guro', 'admin'),
  validateInterventionId,
  (req, res, next) => {
    // Validate update data
    const errors = [];
    const { studentId, category } = req.body;

    // Optional validation - if provided, must be valid
    if (studentId && (typeof studentId !== 'number' || studentId < 1)) {
      errors.push({ field: 'studentId', message: 'Student ID must be a positive integer' });
    }

    if (category) {
      const validCategories = ['Alphabet Knowledge', 'Phonological Awareness', 'Decoding', 'Word Recognition', 'Reading Comprehension'];
      if (!validCategories.includes(category)) {
        errors.push({ field: 'category', message: 'Category must be one of: ' + validCategories.join(', ') });
      }
    }

    if (errors.length > 0) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors
      });
    }

    next();
  },
  interventionAssessmentController.updateIntervention
);

// DELETE /api/intervention-assessment/:interventionId
// Delete an intervention (admin only)
router.delete('/:interventionId',
  validateInterventionId,
  interventionAssessmentController.deleteIntervention
);

// GET /api/intervention-assessment/statistics/:studentId
// Get intervention statistics for a student
router.get('/statistics/:studentId',
  validateStudentId,
  interventionAssessmentController.getStudentInterventionStatistics
);

// POST /api/intervention-assessment/:interventionId/process-completion
// Manually process intervention completion (for testing/fixing missed processing)
router.post('/:interventionId/process-completion',
  validateInterventionId,
  interventionAssessmentController.processInterventionCompletion
);

// GET /api/intervention-assessment/:interventionId/completion-status
// Check intervention completion status
router.get('/:interventionId/completion-status',
  validateInterventionId,
  interventionAssessmentController.getInterventionCompletionStatus
);

// POST /api/intervention-assessment/repair-data-consistency
// Repair data consistency for currentInterventionId fields
router.post('/repair-data-consistency',
  interventionAssessmentController.repairDataConsistency
);

// Error handling middleware
router.use((error, req, res, next) => {
  console.error('Intervention Assessment Route Error:', error);
  
  if (error.name === 'ValidationError') {
    return res.status(400).json({
      success: false,
      message: 'Validation error',
      errors: Object.values(error.errors).map(err => ({
        field: err.path,
        message: err.message
      }))
    });
  }
  
  if (error.name === 'CastError') {
    return res.status(400).json({
      success: false,
      message: 'Invalid ID format',
      errors: [{ field: error.path, message: 'Invalid MongoDB ObjectId format' }]
    });
  }
  
  if (error.message && error.message.includes('already attempted')) {
    return res.status(409).json({
      success: false,
      message: 'Intervention already attempted',
      errors: [{ field: 'category', message: error.message }]
    });
  }
  
  res.status(500).json({
    success: false,
    message: 'Internal server error',
    error: process.env.NODE_ENV === 'development' ? error.message : 'Something went wrong'
  });
});

module.exports = router;