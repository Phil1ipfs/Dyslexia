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
 * @route POST /api/prescriptive-analysis/comprehensive/:studentId
 * @desc Generate comprehensive prescriptive analysis using BKT/IRT models
 * @access Private (Teachers only)
 */
router.post('/comprehensive/:studentId', authenticateToken, authorize('teacher'), 
  prescriptiveAnalysisController.generateComprehensiveAnalysis
);

/**
 * @route POST /api/prescriptive-analysis/intervention/:interventionId
 * @desc Generate prescriptive analysis from intervention results
 * @access Private (Teachers only)
 */
router.post('/intervention/:interventionId', authenticateToken, authorize('teacher'), 
  prescriptiveAnalysisController.generateAnalysisFromIntervention
);

/**
 * @route GET /api/prescriptive-analysis/intervention-history/:studentId
 * @desc Get intervention history with analytics for a student
 * @access Private (Teachers only)
 */
router.get('/intervention-history/:studentId', authenticateToken, authorize('teacher'), 
  prescriptiveAnalysisController.getInterventionHistory
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