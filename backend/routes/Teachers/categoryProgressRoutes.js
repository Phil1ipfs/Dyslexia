// routes/Teachers/categoryProgressRoutes.js
const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const { auth } = require('../../middleware/auth');
const {
  getCategoryProgress,
  getSpecificCategoryProgress,
  getAllStudentsCategoryProgress,
  createCategoryResult,
  updateCategoryResult,
  deleteCategoryResult,
  getCategoryResultById,
  generateCategoryResultsFromResponses
} = require('../../controllers/Teachers/ManageProgress/categoryProgressController');

// Validation middleware
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

const validateCategoryResultId = (req, res, next) => {
  const { categoryResultId } = req.params;
  
  if (!categoryResultId || !mongoose.Types.ObjectId.isValid(categoryResultId)) {
    return res.status(400).json({
      success: false,
      message: 'Invalid category result ID format',
      errors: [{ field: 'categoryResultId', message: 'Invalid MongoDB ObjectId format' }]
    });
  }
  
  next();
};

const validateCategoryName = (req, res, next) => {
  const { categoryName } = req.params;
  const validCategories = ['Alphabet Knowledge', 'Phonological Awareness', 'Decoding', 'Word Recognition', 'Reading Comprehension'];
  
  if (!categoryName || !validCategories.includes(categoryName)) {
    return res.status(400).json({
      success: false,
      message: 'Invalid category name',
      errors: [{ field: 'categoryName', message: 'Category must be one of: ' + validCategories.join(', ') }]
    });
  }
  
  next();
};

const validateCreateCategoryResult = (req, res, next) => {
  const errors = [];
  
  if (!req.body.studentId) {
    errors.push({ field: 'studentId', message: 'Student ID is required' });
  } else {
    const studentIdInt = parseInt(req.body.studentId);
    if (isNaN(studentIdInt) || studentIdInt < 1) {
      errors.push({ field: 'studentId', message: 'Student ID must be a positive integer' });
    }
  }
  
  if (!req.body.categories || !Array.isArray(req.body.categories) || req.body.categories.length === 0) {
    errors.push({ field: 'categories', message: 'Categories array is required and must not be empty' });
  }
  
  if (req.body.readingLevel) {
    const validReadingLevels = ['Low Emerging', 'High Emerging', 'Developing', 'Transitioning', 'At Grade Level'];
    if (!validReadingLevels.includes(req.body.readingLevel)) {
      errors.push({ field: 'readingLevel', message: 'Reading level must be one of: ' + validReadingLevels.join(', ') });
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
};

// CREATE - Create new category result
router.post('/', auth, validateCreateCategoryResult, createCategoryResult);

// CREATE - Generate category results from student responses
router.post('/generate/:studentId', auth, validateStudentId, generateCategoryResultsFromResponses);

// READ - Get all students category progress summary  
router.get('/all', auth, getAllStudentsCategoryProgress);

// READ - Get category result by ID
router.get('/result/:categoryResultId', auth, validateCategoryResultId, getCategoryResultById);

// READ - Get category progress for a specific student
router.get('/:studentId', auth, validateStudentId, getCategoryProgress);

// READ - Get specific category progress for a student
router.get('/:studentId/:categoryName', auth, validateStudentId, validateCategoryName, getSpecificCategoryProgress);

// UPDATE - Update existing category result
router.put('/:categoryResultId', auth, validateCategoryResultId, updateCategoryResult);

// UPDATE - Partial update existing category result
router.patch('/:categoryResultId', auth, validateCategoryResultId, updateCategoryResult);

// DELETE - Delete category result
router.delete('/:categoryResultId', auth, validateCategoryResultId, deleteCategoryResult);

// Error handling middleware
router.use((error, req, res, next) => {
  console.error('Category Progress Route Error:', error);
  
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
  
  res.status(500).json({
    success: false,
    message: 'Internal server error',
    error: process.env.NODE_ENV === 'development' ? error.message : 'Something went wrong'
  });
});

module.exports = router;