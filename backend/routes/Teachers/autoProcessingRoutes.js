const express = require('express');
const router = express.Router();
const { auth, authorize } = require('../../middleware/auth');
const {
  processAllCompleteAssessments,
  processSpecificStudent,
  getProcessingStatus,
  fixInterventionSuccess,
  fastReprocessStudent
} = require('../../controllers/Teachers/autoProcessingController');

// Manual trigger to process all complete assessments
router.post('/process-all',
  auth,
  authorize('teacher', 'guro'),
  processAllCompleteAssessments
);

// Process specific student
router.post('/process-student/:studentId',
  auth,
  authorize('teacher', 'guro'),
  processSpecificStudent
);

// Get auto-processing status
router.get('/status',
  auth,
  authorize('teacher', 'guro'),
  getProcessingStatus
);

// Fix intervention success not reflected in category_results
router.post('/fix-intervention-success/:studentId',
  auth,
  authorize('teacher', 'guro'),
  fixInterventionSuccess
);

// TEMPORARY: Fix intervention success without auth (for urgent fixes)
router.post('/fix-intervention-success-temp/:studentId',
  fixInterventionSuccess
);

// Fast reprocess student with immediate response (no auth for faster testing)
router.post('/fast-reprocess/:studentId',
  fastReprocessStudent
);

module.exports = router;