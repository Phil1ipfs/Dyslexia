// routes/Teachers/customizedAssessmentRoutes.js
const express = require('express');
const router = express.Router();
const { auth, authorize } = require('../../middleware/auth');
const customizedAssessmentController = require('../../controllers/Teachers/ManageProgress/customizedAssessmentController');


// ----- IMPORTANT: Route order matters in Express -----
// Routes with more specific patterns must come before generic ones

// Get all customized assessments for a student
// This must come BEFORE the generic /:id route to avoid conflicts
router.get('/student/:studentId', auth, authorize('teacher', 'guro'), customizedAssessmentController.getCustomizedAssessmentsByStudent);

// Get a customized assessment by ID
// This generic route comes AFTER the more specific /student/:studentId route
router.get('/:id', auth, authorize('teacher', 'guro'), customizedAssessmentController.getCustomizedAssessment);

// Update a customized assessment
router.put('/:id', auth, authorize('teacher', 'guro'), customizedAssessmentController.updateCustomizedAssessment);

// Delete a customized assessment
router.delete('/:id', auth, authorize('teacher', 'guro'), customizedAssessmentController.deleteCustomizedAssessment);


// Question-level routes
router.post('/:id/question', auth, authorize('teacher', 'guro'), customizedAssessmentController.addQuestion);
router.put('/:id/question/:questionId', auth, authorize('teacher', 'guro'), customizedAssessmentController.updateQuestion);
router.delete('/:id/question/:questionId', auth, authorize('teacher', 'guro'), customizedAssessmentController.removeQuestion);
router.get('/:id/questions-with-content', auth, authorize('teacher', 'guro'), customizedAssessmentController.getQuestionsWithContent);
router.put('/:id/question/:questionId/content', auth, authorize('teacher', 'guro'), customizedAssessmentController.updateQuestionContent);


// Get template questions for a category
router.get('/templates/:categoryId', auth, authorize('teacher', 'guro'), customizedAssessmentController.getTemplateQuestions);

// Clone a template question
router.post('/clone-question', auth, authorize('teacher', 'guro'), customizedAssessmentController.cloneTemplateQuestion);

// Create a new customized assessment
router.post('/', auth, authorize('teacher', 'guro'), customizedAssessmentController.createCustomizedAssessment);

module.exports = router;