const express = require('express');
const router = express.Router();
const prescriptiveAnalysisController = require('../../../controllers/Teachers/ManageProgress/prescriptiveAnalysisController');
const { authenticateToken, authorize } = require('../../../middleware/auth');

/**
 * @route GET /api/prescriptive-analysis/student/:studentId
 * @desc Get all prescriptive analyses for a student
 * @access Private (Teachers only)
 */
router.get('/student/:studentId', authenticateToken, authorize('teacher'), 
  prescriptiveAnalysisController.getStudentAnalyses
);

/**
 * @route POST /api/prescriptive-analysis/generate/:studentId
 * @desc Generate prescriptive analyses from category results
 * @access Private (Teachers only)
 */
router.post('/generate/:studentId', authenticateToken, authorize('teacher'), 
  prescriptiveAnalysisController.generateAnalysesFromResults
);

/**
 * @route PUT /api/prescriptive-analysis/template
 * @desc Update recommendation template for easy updates
 * @access Private (Teachers only)
 */
router.put('/template', authenticateToken, authorize('teacher'), 
  prescriptiveAnalysisController.updateRecommendationTemplate
);

/**
 * @route GET /api/prescriptive-analysis/templates
 * @desc Get available templates
 * @access Private (Teachers only)
 */
router.get('/templates', authenticateToken, authorize('teacher'), 
  prescriptiveAnalysisController.getAvailableTemplates
);

module.exports = router; 