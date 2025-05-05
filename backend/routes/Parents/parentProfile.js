// routes/Parents/parentProfile.js
const express = require('express');
const router = express.Router();
const multer = require('multer');
const { auth, authorize } = require('../../middleware/auth');
// We'll use a simple stub controller until we implement the full parent profile controller
const parentProfileController = {
    initializeProfile: (req, res) => {
        res.json({ message: 'Parent profile initialization endpoint (stub)' });
    },
    getProfile: (req, res) => {
        res.json({ message: 'Get parent profile endpoint (stub)' });
    },
    createProfile: (req, res) => {
        res.json({ message: 'Create parent profile endpoint (stub)' });
    },
    updateProfile: (req, res) => {
        res.json({ message: 'Update parent profile endpoint (stub)' });
    },
    updatePassword: (req, res) => {
        res.json({ message: 'Update parent password endpoint (stub)' });
    },
    uploadProfileImage: (req, res) => {
        res.json({ message: 'Upload parent profile image endpoint (stub)' });
    },
    deleteProfileImage: (req, res) => {
        res.json({ message: 'Delete parent profile image endpoint (stub)' });
    },
    getCurrentProfileImage: (req, res) => {
        res.json({ message: 'Get current parent profile image endpoint (stub)' });
    }
};

// Configure multer for memory storage
const storage = multer.memoryStorage();

// File type filter
const fileFilter = (req, file, cb) => {
  // Accept only images
  if (file.mimetype.startsWith('image/')) {
    cb(null, true);
  } else {
    cb(new Error('Only image files are allowed'), false);
  }
};

const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB limit
  }
});

// Initialize parent profile
router.post('/profile/initialize', auth, authorize('parent', 'magulang'), parentProfileController.initializeProfile);

// Get profile route
router.get('/profile', auth, authorize('parent', 'magulang'), parentProfileController.getProfile);

// Create profile route
router.post('/profile', auth, authorize('parent', 'magulang'), parentProfileController.createProfile);

// Update profile route
router.put('/profile', auth, authorize('parent', 'magulang'), parentProfileController.updateProfile);

// Update password route
router.post('/password', auth, authorize('parent', 'magulang'), parentProfileController.updatePassword);

// Upload profile image route
router.post('/profile/image', auth, authorize('parent', 'magulang'), upload.single('profileImage'), parentProfileController.uploadProfileImage);

// Delete profile image route
router.delete('/profile/image', auth, authorize('parent', 'magulang'), parentProfileController.deleteProfileImage);

// Alternative delete profile image route
router.post('/profile/image/delete', auth, authorize('parent', 'magulang'), parentProfileController.deleteProfileImage);

// Get current profile image route
router.get('/profile/image/current', auth, authorize('parent', 'magulang'), parentProfileController.getCurrentProfileImage);

module.exports = router;