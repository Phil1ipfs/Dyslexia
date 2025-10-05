const express = require('express');
const router = express.Router();
const IEPController = require('../../../controllers/Teachers/ManageProgress/iepController');
const { authenticateToken } = require('../../../middleware/auth');

// Apply authentication to all routes
router.use(authenticateToken);

// Add route for refreshing intervention data
router.put('/student/:studentId/refresh-interventions', IEPController.refreshInterventionData);

// Get IEP report for a specific student
router.get('/student/:studentId', IEPController.getIEPReport);

// Get multiple IEP reports (for class view)
router.get('/class', IEPController.getClassIEPReports);

// Update support level for a specific objective using old method (backward compatibility)
router.put('/student/:studentId/objective/:objectiveId/support-level', IEPController.updateSupportLevel);

// Update remarks for a specific objective
router.put('/student/:studentId/objective/:objectiveId/remarks', IEPController.updateRemarks);

// Update main assessment remark for an objective
router.put('/student/:studentId/objective/:objectiveId/main-assessment-remark', IEPController.updateMainAssessmentRemark);

// Update remark for a specific intervention attempt
router.put('/student/:studentId/objective/:objectiveId/attempt/:attemptIndex/remark', IEPController.updateAttemptRemark);

// ✅ NEW: Update general recommendation for IEP report
router.put('/student/:studentId/general-recommendation', IEPController.updateGeneralRecommendation);

// Bulk update multiple objectives for a student
router.put('/student/:studentId/bulk-update', IEPController.bulkUpdateObjectives);

// New route for updating objective support level - changed to PUT to match frontend
router.put('/objective/:objectiveId/support-level', IEPController.updateObjectiveSupportLevel);

// Send progress report to parent
router.post('/student/:studentId/send-report', IEPController.sendReportToParent);

// Get previous PDF reports for a student
router.get('/student/:studentId/reports', IEPController.getPreviousPdfReports);

// ✅ NEW: Get complete IEP history for a student (all reading levels)
router.get('/student/:studentId/history', IEPController.getIEPHistory);

// ✅ NEW: Handle reading level progression with proper IEP record preservation
router.post('/student/:studentId/reading-level-progression', IEPController.handleReadingLevelProgressionRequest);

// Fix category isPassed status when intervention succeeded but status not updated
router.post('/student/:studentId/fix-passed-status', IEPController.fixCategoryPassedStatus);

module.exports = router; 