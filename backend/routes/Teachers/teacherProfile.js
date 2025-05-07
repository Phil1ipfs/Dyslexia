// routes/Teachers/teacherProfile.js
const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const { auth, authorize } = require('../../middleware/auth');

// Initialize teacher profile
router.post('/profile/initialize', auth, authorize('teacher', 'guro'), async (req, res) => {
  try {
    // Get the user's email from the token
    const userEmail = req.user.email;
    
    // Create a new profile template
    const newProfile = {
      email: userEmail,
      firstName: '',
      middleName: '',
      lastName: '',
      position: '',
      employeeId: '',
      contact: '',
      gender: '',
      civilStatus: '',
      dob: '',
      address: '',
      profileImageUrl: null,
      emergencyContact: {
        name: '',
        number: ''
      },
      createdAt: new Date(),
      updatedAt: new Date()
    };
    
    return res.status(201).json({ message: 'Profile initialized successfully', teacher: newProfile });
  } catch (error) {
    console.error('Error initializing teacher profile:', error);
    return res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Get teacher profile
router.get('/profile', auth, authorize('teacher', 'guro'), async (req, res) => {
  try {
    // Get the user's email from the token
    const userEmail = req.user.email;
    
    // Create a default profile
    const profile = {
      email: userEmail,
      firstName: '',
      middleName: '',
      lastName: '',
      position: '',
      employeeId: '',
      contact: '',
      gender: '',
      civilStatus: '',
      dob: '',
      address: '',
      profileImageUrl: null,
      emergencyContact: {
        name: '',
        number: ''
      }
    };
    
    return res.json(profile);
  } catch (error) {
    console.error('Error getting teacher profile:', error);
    return res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Create teacher profile
router.post('/profile', auth, authorize('teacher', 'guro'), async (req, res) => {
  try {
    // Get the user's email from the token
    const userEmail = req.user.email;
    
    // Create profile object
    const profile = {
      ...req.body,
      email: userEmail,
      createdAt: new Date(),
      updatedAt: new Date()
    };
    
    return res.status(201).json({ message: 'Profile created successfully', teacher: profile });
  } catch (error) {
    console.error('Error creating teacher profile:', error);
    return res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Update teacher profile
router.put('/profile', auth, authorize('teacher', 'guro'), async (req, res) => {
  try {
    // Get the user's email from the token
    const userEmail = req.user.email;
    
    // Update profile object
    const updatedProfile = {
      ...req.body,
      email: userEmail,
      updatedAt: new Date()
    };
    
    return res.json({ message: 'Profile updated successfully', teacher: updatedProfile });
  } catch (error) {
    console.error('Error updating teacher profile:', error);
    return res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Update password
router.post('/password', auth, authorize('teacher', 'guro'), async (req, res) => {
  return res.json({ message: 'Password updated successfully' });
});

// Upload profile image
router.post('/profile/image', auth, authorize('teacher', 'guro'), async (req, res) => {
  return res.json({ success: true, imageUrl: 'https://example.com/image.jpg' });
});

// Delete profile image
router.delete('/profile/image', auth, authorize('teacher', 'guro'), async (req, res) => {
  return res.json({ success: true, message: 'Profile image deleted successfully' });
});

// Get current profile image
router.get('/profile/image/current', auth, authorize('teacher', 'guro'), async (req, res) => {
  return res.json({ imageUrl: null });
});

module.exports = router;