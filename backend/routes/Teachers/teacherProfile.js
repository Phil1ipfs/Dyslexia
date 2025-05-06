// routes/Teachers/teacherProfile.js
const express = require('express');
const router = express.Router();
const multer = require('multer');
const { auth, authorize } = require('../../middleware/auth');
const teacherProfileController = require('../../controllers/teacherProfileController');

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

// Initialize teacher profile
router.post('/profile/initialize', auth, authorize('teacher', 'guro'), teacherProfileController.initializeProfile);

// Get profile route
router.get('/profile', auth, authorize('teacher', 'guro'), teacherProfileController.getProfile);

// Create profile route
router.post('/profile', auth, authorize('teacher', 'guro'), teacherProfileController.createProfile);

// Update profile route
router.put('/profile', auth, authorize('teacher', 'guro'), teacherProfileController.updateProfile);

// Update password route
router.post('/password', auth, authorize('teacher', 'guro'), teacherProfileController.updatePassword);

// Upload profile image route
router.post('/profile/image', auth, authorize('teacher', 'guro'), upload.single('profileImage'), teacherProfileController.uploadProfileImage);

// Delete profile image route
router.delete('/profile/image', auth, authorize('teacher', 'guro'), teacherProfileController.deleteProfileImage);

// Alternative delete profile image route
router.post('/profile/image/delete', auth, authorize('teacher', 'guro'), teacherProfileController.deleteProfileImage);

// Get current profile image route
router.get('/profile/image/current', auth, authorize('teacher', 'guro'), teacherProfileController.getCurrentProfileImage);

module.exports = router;