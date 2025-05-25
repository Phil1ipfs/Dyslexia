// routes/Teachers/ManageProgress/mainAssessmentRoutes.js
const express = require('express');
const router = express.Router();
const MainAssessmentController = require('../../../controllers/Teachers/ManageProgress/mainAssessmentController');
const auth = require('../../../middleware/auth');
const checkRole = require('../../../middleware/checkRole');

// Get all main assessment documents (admin only)
router.get('/', auth, checkRole(['admin']), MainAssessmentController.getAllMainAssessments);

// Upsert main assessment questions (admin only)
router.post('/upsert', auth, checkRole(['admin']), MainAssessmentController.upsertMainAssessment);

module.exports = router; 