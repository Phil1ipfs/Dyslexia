// routes/Teachers/assessmentRoutes.js
const express = require('express');
const router = express.Router();
const { auth, authorize } = require('../../middleware/auth');
const {
  studentValidation,
  assessmentValidation,
  sanitizeRequest
} = require('../../middleware/validationMiddleware');

// Import only existing controllers
const categoryController = require('../../controllers/Teachers/ManageProgress/categoryProgressController');

// Apply auth middleware to all routes
router.use(auth);

// Category progress routes
router.get('/category-progress/:id', categoryController.getCategoryProgress);

// Sequential assessment flow routes (prerequisite-aware) - these are the critical missing routes
router.get('/category-access/:studentId/:category', studentValidation.studentId, assessmentValidation.category, categoryController.checkCategoryAccess);
router.get('/next-category/:studentId', studentValidation.studentId, categoryController.getNextCategoryForAssessment);
router.get('/assessment-flow/:studentId', studentValidation.studentId, categoryController.getAssessmentFlowSummary);
router.post('/category-result-validated', sanitizeRequest, categoryController.createCategoryResultWithPrerequisites);

module.exports = router;