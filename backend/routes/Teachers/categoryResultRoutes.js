// routes/Teachers/categoryResultRoutes.js
const express = require('express');
const router = express.Router();
const { auth } = require('../../middleware/auth');
const {
  generateCategoryResults,
  checkAssessmentCompletionStatus
} = require('../../controllers/Teachers/ManageProgress/categoryResultController');

// Check if student assessment is complete and ready for processing
router.get('/:studentId/status', checkAssessmentCompletionStatus);

// Generate category results and prescriptive analysis for a student
// This should be called when student completes their main assessment
router.post('/:studentId/generate', generateCategoryResults);

// Force regenerate prescriptive analysis for testing
router.post('/:categoryResultId/force-regenerate', async (req, res) => {
  try {
    const { categoryResultId } = req.params;

    console.log(`[FORCE REGENERATE] Triggering manual regeneration for category result: ${categoryResultId}`);

    const IntegrationTriggerService = require('../../services/Teachers/PrescriptiveAnalytics/integrationTriggerService');
    const analysis = await IntegrationTriggerService.manualTrigger(categoryResultId, true);

    res.status(200).json({
      success: true,
      message: 'Prescriptive analysis regenerated successfully',
      data: analysis
    });
  } catch (error) {
    console.error('Error in force regenerate:', error);
    res.status(500).json({
      success: false,
      message: 'Error regenerating prescriptive analysis',
      error: error.message
    });
  }
});

module.exports = router;