const express = require('express');
const router = express.Router();
const {
    getDashboardStats,
    getPrescriptiveAnalysis,
    getCategoryAnalysis,
    getSectionAnalysis,
    getSkillMasteryAnalysis
} = require('../../controllers/adminDashboardController');
const { authenticateToken: auth, authorize } = require('../../middleware/auth');

// Route to get dashboard statistics
router.get('/stats', auth, authorize('admin'), getDashboardStats);

// Prescriptive Analysis Routes
router.get('/prescriptive-analysis', auth, authorize('admin'), getPrescriptiveAnalysis);
router.get('/prescriptive-analysis/category/:category', auth, authorize('admin'), getCategoryAnalysis);
router.get('/prescriptive-analysis/section/:section', auth, authorize('admin'), getSectionAnalysis);
router.get('/prescriptive-analysis/skill-mastery', auth, authorize('admin'), getSkillMasteryAnalysis);

module.exports = router; 