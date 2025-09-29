const express = require('express');
const router = express.Router();
const adminController = require('../../controllers/adminController');
const { authenticateToken: auth, authorize } = require('../../middleware/auth');

// Get admin profile route - protected with auth middleware
router.get('/profile', auth, authorize('admin'), adminController.getAdminProfile);

// Update admin profile route - protected with auth middleware
router.put('/profile', auth, authorize('admin'), adminController.updateAdminProfile);

// Upload profile image route - protected with auth middleware
router.post('/upload-profile-image', auth, authorize('admin'), adminController.uploadProfileImage);

// Change password route - protected with auth middleware
router.put('/change-password', auth, authorize('admin'), adminController.changePassword);

module.exports = router; 