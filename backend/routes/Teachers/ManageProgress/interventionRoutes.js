// routes/Teachers/ManageProgress/interventionRoutes.js
const express = require('express');
const router = express.Router();
const InterventionController = require('../../../controllers/Teachers/ManageProgress/interventionController');
const { auth, authorize } = require('../../../middleware/auth');

// Initialize controller
const interventionController = new InterventionController();

// API endpoints with specific paths (these must come before parameterized routes)
// Get main assessment questions
router.get('/questions/main', auth, authorize('teacher', 'admin'), 
  async (req, res) => {
    try {
      const { category, readingLevel } = req.query;
      
      if (!category || !readingLevel) {
        return res.status(400).json({
          success: false,
          message: 'Category and reading level are required'
        });
      }
      
      const questions = await interventionController.getMainAssessmentQuestions(req, res);
      
      return questions; // Controller handles the response
    } catch (error) {
      console.error('Error in GET /questions/main route:', error);
      return res.status(500).json({
        success: false,
        message: 'Server error processing request',
        error: error.message
      });
    }
  }
);

// Get template questions
router.get('/templates/questions', auth, authorize('teacher', 'admin'), 
  async (req, res) => {
    try {
      const { category } = req.query;
      
      if (!category) {
        return res.status(400).json({
          success: false,
          message: 'Category is required'
        });
      }
      
      return await interventionController.getTemplateQuestions(req, res);
    } catch (error) {
      console.error('Error in GET /templates/questions route:', error);
      return res.status(500).json({
        success: false,
        message: 'Server error processing request',
        error: error.message
      });
    }
  }
);

// Get template choices
router.get('/templates/choices', auth, authorize('teacher', 'admin'), 
  async (req, res) => {
    try {
      return await interventionController.getTemplateChoices(req, res);
    } catch (error) {
      console.error('Error in GET /templates/choices route:', error);
      return res.status(500).json({
        success: false,
        message: 'Server error processing request',
        error: error.message
      });
    }
  }
);

// Get sentence templates
router.get('/templates/sentences', auth, authorize('teacher', 'admin'), 
  async (req, res) => {
    try {
      const { readingLevel } = req.query;
      
      if (!readingLevel) {
        return res.status(400).json({
          success: false,
          message: 'Reading level is required'
        });
      }
      
      return await interventionController.getSentenceTemplates(req, res);
    } catch (error) {
      console.error('Error in GET /templates/sentences route:', error);
      return res.status(500).json({
        success: false,
        message: 'Server error processing request',
        error: error.message
      });
    }
  }
);

// Create a new template question
router.post('/templates/questions', auth, authorize('teacher', 'admin'), 
  async (req, res) => {
    try {
      return await interventionController.createTemplateQuestion(req, res);
    } catch (error) {
      console.error('Error in POST /templates/questions route:', error);
      return res.status(500).json({
        success: false,
        message: 'Server error processing request',
        error: error.message
      });
    }
  }
);

// Create a new template choice
router.post('/templates/choices', auth, authorize('teacher', 'admin'), 
  async (req, res) => {
    try {
      return await interventionController.createTemplateChoice(req, res);
    } catch (error) {
      console.error('Error in POST /templates/choices route:', error);
      return res.status(500).json({
        success: false,
        message: 'Server error processing request',
        error: error.message
      });
    }
  }
);

// Check if an intervention exists for a student and category
router.get('/check', auth, authorize('teacher', 'admin'), 
  async (req, res) => {
    try {
      return await interventionController.checkExistingIntervention(req, res);
    } catch (error) {
      console.error('Error in GET /check route:', error);
      return res.status(500).json({
        success: false,
        message: 'Server error processing request',
        error: error.message
      });
    }
  }
);

// Get all interventions for a student
router.get('/student/:studentId', auth, authorize('teacher', 'admin'), 
  async (req, res) => {
    try {
      return await interventionController.getStudentInterventions(req, res);
    } catch (error) {
      console.error('Error in GET /student/:studentId route:', error);
      return res.status(500).json({
        success: false,
        message: 'Server error processing request',
        error: error.message
      });
    }
  }
);

// Get a pre-signed URL for S3 uploads
router.post('/upload-url', auth, authorize('teacher', 'admin'), 
  async (req, res) => {
    try {
      return await interventionController.getUploadUrl(req, res);
    } catch (error) {
      console.error('Error in POST /upload-url route:', error);
      return res.status(500).json({
        success: false,
        message: 'Server error processing request',
        error: error.message
      });
    }
  }
);

// Record a response to an intervention question
router.post('/responses', auth, authorize('teacher', 'admin', 'student'), 
  async (req, res) => {
    try {
      return await interventionController.recordResponse(req, res);
    } catch (error) {
      console.error('Error in POST /responses route:', error);
      return res.status(500).json({
        success: false,
        message: 'Server error processing request',
        error: error.message
      });
    }
  }
);

// Parameterized routes (these must come after specific routes)
// Get an intervention by ID
router.get('/:interventionId', auth, authorize('teacher', 'admin'), 
  async (req, res) => {
    try {
      return await interventionController.getInterventionById(req, res);
    } catch (error) {
      console.error('Error in GET /:interventionId route:', error);
      return res.status(500).json({
        success: false,
        message: 'Server error processing request',
        error: error.message
      });
    }
  }
);

// Create a new intervention
router.post('/', auth, authorize('teacher', 'admin'), 
  async (req, res) => {
    try {
      return await interventionController.createIntervention(req, res);
    } catch (error) {
      console.error('Error in POST / route:', error);
      return res.status(500).json({
        success: false,
        message: 'Server error processing request',
        error: error.message
      });
    }
  }
);

// Update an existing intervention
router.put('/:interventionId', auth, authorize('teacher', 'admin'), 
  async (req, res) => {
    try {
      return await interventionController.updateIntervention(req, res);
    } catch (error) {
      console.error('Error in PUT /:interventionId route:', error);
      return res.status(500).json({
        success: false,
        message: 'Server error processing request',
        error: error.message
      });
    }
  }
);

// Delete an intervention
router.delete('/:interventionId', auth, authorize('teacher', 'admin'), 
  async (req, res) => {
    try {
      return await interventionController.deleteIntervention(req, res);
    } catch (error) {
      console.error('Error in DELETE /:interventionId route:', error);
      return res.status(500).json({
        success: false,
        message: 'Server error processing request',
        error: error.message
      });
    }
  }
);

// Push an intervention to mobile
router.post('/:interventionId/push', auth, authorize('teacher', 'admin'), 
  async (req, res) => {
    try {
      return await interventionController.pushToMobile(req, res);
    } catch (error) {
      console.error('Error in POST /:interventionId/push route:', error);
      return res.status(500).json({
        success: false,
        message: 'Server error processing request',
        error: error.message
      });
    }
  }
);

module.exports = router;