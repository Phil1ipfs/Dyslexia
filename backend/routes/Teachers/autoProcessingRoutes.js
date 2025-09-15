const express = require('express');
const router = express.Router();
const { auth, authorize } = require('../../middleware/auth');
const {
  processAllCompleteAssessments,
  processSpecificStudent,
  getProcessingStatus
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

module.exports = router;