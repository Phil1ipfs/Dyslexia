// routes/Teachers/assessmentRoutes.js
const express = require('express');
const router = express.Router();
const { auth, authorize } = require('../../middleware/auth');

// Import only existing controllers
const categoryController = require('../../controllers/Teachers/ManageProgress/categoryProgressController');

// Apply auth middleware to all routes
router.use(auth);

// Category progress routes
router.get('/category-progress/:id', categoryController.getCategoryProgress);

// Sequential assessment flow routes (prerequisite-aware) - these are the critical missing routes
router.get('/category-access/:studentId/:category', categoryController.checkCategoryAccess);
router.get('/next-category/:studentId', categoryController.getNextCategoryForAssessment);
router.get('/assessment-flow/:studentId', categoryController.getAssessmentFlowSummary);
router.post('/category-result-validated', categoryController.createCategoryResultWithPrerequisites);

module.exports = router;