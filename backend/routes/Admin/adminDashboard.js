const express = require('express');
const router = express.Router();
const { getDashboardStats } = require('../../controllers/adminDashboardController');

// Route to get dashboard statistics
router.get('/stats', getDashboardStats);

module.exports = router; 