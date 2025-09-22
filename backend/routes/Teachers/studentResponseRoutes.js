// routes/Teachers/studentResponseRoutes.js
const express = require('express');
const router = express.Router();
const { auth } = require('../../middleware/auth');
const {
  getStudentResponses,
  getStudentResponsesByCategory,
  getStudentResponseStats,
  fixAlphabetKnowledgeData,
  fixAllCategoryData
} = require('../../controllers/Teachers/ManageProgress/studentResponseController');

// Get response statistics for a student (must come before parameterized routes)
router.get('/:studentId/stats', auth, getStudentResponseStats);

// Get all responses for a specific student
router.get('/:studentId', auth, getStudentResponses);

// Get responses for a specific student and category
router.get('/:studentId/:categoryName', auth, getStudentResponsesByCategory);

// Fix Alphabet Knowledge data inconsistency
router.post('/fix-alphabet-knowledge', auth, fixAlphabetKnowledgeData);

// Fix all category data inconsistencies
router.post('/fix-all-categories', auth, fixAllCategoryData);

module.exports = router;