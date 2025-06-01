const express = require('express');
const router = express.Router();
const multer = require('multer');
const { checkAuth } = require('../../middleware/authMiddleware');
const { checkRole } = require('../../middleware/roleMiddleware');
const preAssessmentController = require('../../controllers/Teachers/preAssessmentController');

// Configure multer for memory storage (for S3 uploads)
const storage = multer.memoryStorage();
const upload = multer({ 
  storage,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
  }
});

// Pre-assessment routes
router.get('/assessments', checkAuth, checkRole(['teacher', 'guro']), preAssessmentController.getAllPreAssessments);
router.get('/assessments/:id', checkAuth, checkRole(['teacher', 'guro']), preAssessmentController.getPreAssessmentById);
router.post('/assessments', checkAuth, checkRole(['teacher', 'guro']), preAssessmentController.createPreAssessment);
router.put('/assessments/:id', checkAuth, checkRole(['teacher', 'guro']), preAssessmentController.updatePreAssessment);
router.delete('/assessments/:id', checkAuth, checkRole(['teacher', 'guro']), preAssessmentController.deletePreAssessment);

// Question type routes
router.get('/question-types', checkAuth, checkRole(['teacher', 'guro']), preAssessmentController.getAllQuestionTypes);
router.post('/question-types', checkAuth, checkRole(['teacher', 'guro']), preAssessmentController.createQuestionType);
router.put('/question-types/:id', checkAuth, checkRole(['teacher', 'guro']), preAssessmentController.updateQuestionType);
router.delete('/question-types/:id', checkAuth, checkRole(['teacher', 'guro']), preAssessmentController.deleteQuestionType);

// Media upload routes
router.post('/upload-media', checkAuth, checkRole(['teacher', 'guro']), upload.single('file'), preAssessmentController.uploadMedia);
router.delete('/delete-media/:fileKey', checkAuth, checkRole(['teacher', 'guro']), preAssessmentController.deleteMedia);

// Student results routes
router.get('/student-results/:id', checkAuth, checkRole(['teacher', 'guro']), preAssessmentController.getPreAssessmentResults);

module.exports = router;