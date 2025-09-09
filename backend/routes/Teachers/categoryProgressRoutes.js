// routes/Teachers/categoryProgressRoutes.js
const express = require('express');
const router = express.Router();
const { auth } = require('../../middleware/auth');
const {
  getCategoryProgress,
  getSpecificCategoryProgress,
  getAllStudentsCategoryProgress
} = require('../../controllers/Teachers/ManageProgress/categoryProgressController');

// Get all students category progress summary
router.get('/all', getAllStudentsCategoryProgress);

// Get category progress for a specific student
router.get('/:studentId', getCategoryProgress);

// Get specific category progress for a student
router.get('/:studentId/:categoryName', getSpecificCategoryProgress);

module.exports = router;