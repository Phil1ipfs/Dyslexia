// routes/Teachers/ManageProgress/interventionRoutes.js
const express = require('express');
const router = express.Router();
const InterventionController = require('../../../controllers/Teachers/ManageProgress/interventionController');
const auth = require('../../../middleware/auth');
const checkRole = require('../../../middleware/checkRole');

const interventionController = new InterventionController();

// Get all interventions for a student
router.get('/student/:studentId', auth, checkRole(['teacher', 'admin']), interventionController.getStudentInterventions);

// Get an intervention by ID
router.get('/:interventionId', auth, checkRole(['teacher', 'admin']), interventionController.getInterventionById);

// Check if an intervention exists for a student and category
router.get('/check', auth, checkRole(['teacher', 'admin']), interventionController.checkExistingIntervention);

// Create a new intervention
router.post('/', auth, checkRole(['teacher', 'admin']), interventionController.createIntervention);

// Update an existing intervention
router.put('/:interventionId', auth, checkRole(['teacher', 'admin']), interventionController.updateIntervention);

// Delete an intervention
router.delete('/:interventionId', auth, checkRole(['teacher', 'admin']), interventionController.deleteIntervention);

// Push an intervention to mobile
router.post('/:interventionId/push', auth, checkRole(['teacher', 'admin']), interventionController.pushToMobile);

// Get main assessment questions
router.get('/questions/main', auth, checkRole(['teacher', 'admin']), interventionController.getMainAssessmentQuestions);

// Get template questions
router.get('/templates/questions', auth, checkRole(['teacher', 'admin']), interventionController.getTemplateQuestions);

// Get template choices
router.get('/templates/choices', auth, checkRole(['teacher', 'admin']), interventionController.getTemplateChoices);

// Get sentence templates
router.get('/templates/sentences', auth, checkRole(['teacher', 'admin']), interventionController.getSentenceTemplates);

// Create a new template question
router.post('/templates/questions', auth, checkRole(['teacher', 'admin']), interventionController.createTemplateQuestion);

// Create a new template choice
router.post('/templates/choices', auth, checkRole(['teacher', 'admin']), interventionController.createTemplateChoice);

// Get a pre-signed URL for S3 uploads
router.post('/upload-url', auth, checkRole(['teacher', 'admin']), interventionController.getUploadUrl);

// Record a response to an intervention question
router.post('/responses', auth, checkRole(['teacher', 'admin', 'student']), interventionController.recordResponse);

module.exports = router;
