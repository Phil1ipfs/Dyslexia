// routes/prescriptiveAnalysisRoutes.js
const express = require('express');
const router = express.Router();
const prescriptiveAnalysisController = require('../../controllers/Teachers/prescriptiveAnalysisController');

// Get all prescriptive analyses for a student
router.get('/student/:studentId', prescriptiveAnalysisController.getStudentAnalyses);

// Get a specific prescriptive analysis by ID
router.get('/:analysisId', prescriptiveAnalysisController.getAnalysisById);

// Get a specific prescriptive analysis by student ID and category
router.get('/student/:studentId/category/:category', prescriptiveAnalysisController.getAnalysisByStudentAndCategory);

// Create a new prescriptive analysis
router.post('/', prescriptiveAnalysisController.createAnalysis);

// Update an existing prescriptive analysis
router.put('/:analysisId', prescriptiveAnalysisController.updateAnalysis);

// Delete a prescriptive analysis
router.delete('/:analysisId', prescriptiveAnalysisController.deleteAnalysis);

// Generate prescriptive analyses from category results
router.post('/generate', prescriptiveAnalysisController.generateAnalysesFromCategoryResults);

// Initialize prescriptive analyses for all students
router.post('/initialize-all', prescriptiveAnalysisController.initializeForAllStudents);

// Cleanup analyses for students with null reading level
router.post('/cleanup-null', prescriptiveAnalysisController.cleanupNullReadingLevelAnalyses);

// Regenerate content for empty prescriptive analyses
router.post('/regenerate/:studentId', prescriptiveAnalysisController.regenerateAnalyses);

// Debug route to inspect category results for a student
router.get('/debug/category-results/:studentId', prescriptiveAnalysisController.debugCategoryResults);

// Ensure a student has prescriptive analysis records for all categories
router.post('/ensure/:studentId', prescriptiveAnalysisController.ensureStudentAnalysesExist);

// Fix all empty prescriptive analyses in the database directly
router.post('/fix-empty', prescriptiveAnalysisController.fixEmptyAnalyses);

module.exports = router; 