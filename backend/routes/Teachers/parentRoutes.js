// routes/Parents/parentRoutes.js
const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const { auth, authorize } = require('../../middleware/auth');

/**
 * @route GET /api/parents/profile/:id
 * @desc Get parent profile by ID
 * @access Private (teachers, admins)
 */
router.get('/profile/:id', auth, authorize('teacher', 'guro', 'admin'), async (req, res) => {
  try {
    const parentId = req.params.id;
    console.log("Starting getParentInfo for student:", req.query.studentId || 'undefined');

    if (!parentId) {
      return res.status(400).json({ message: 'Parent ID is required' });
    }

    // Convert the parentId string to ObjectId
    console.log("ParentId found:", parentId);
    let parentObjId;
    try {
      parentObjId = new mongoose.Types.ObjectId(parentId);
      console.log("Converted parentId:", parentObjId);
    } catch (error) {
      return res.status(400).json({ message: 'Invalid parent ID format' });
    }

    // Get the profile collection from the mobile_literexia database
    const mobileLiterexiaDb = mongoose.connection.useDb('parent');
    const profileCollection = mobileLiterexiaDb.collection('profile');
    
    // Find parent profile
    const parentProfile = await profileCollection.findOne({ _id: parentObjId });
    console.log("Parent profile found:", parentProfile ? "Yes" : "No");

    if (!parentProfile) {
      return res.status(404).json({ message: 'Parent profile not found' });
    }

    // Get the userId to find the email from users collection
    const userId = parentProfile.userId;
    console.log("Looking up email with userId:", userId);

    // Find the user email in the users collection
    const usersWebDb = mongoose.connection.useDb('users_web');
    const usersCollection = usersWebDb.collection('users');
    const user = await usersCollection.findOne({ _id: userId });
    console.log("User record found:", user ? "Yes" : "No");

    let email = null;
    if (user) {
      email = user.email;
      console.log("Email found:", email);
    }

    // Construct final parent info with full name
    const firstName = parentProfile.firstName || '';
    const middleName = parentProfile.middleName || '';
    const lastName = parentProfile.lastName || '';
    
    let fullName = firstName;
    if (middleName) fullName += ` ${middleName}`;
    if (lastName) fullName += ` ${lastName}`;

    const parentInfo = {
      name: fullName.trim(),
      email: email,
      contact: parentProfile.contact || '',
      address: parentProfile.address || '',
      civilStatus: parentProfile.civilStatus || '',
      gender: parentProfile.gender || '',
      occupation: parentProfile.occupation || '',
      profileImageUrl: parentProfile.profileImageUrl || ''
    };

    console.log("Final parent info:", parentInfo);

    return res.json(parentInfo);
  } catch (error) {
    console.error('Error fetching parent profile:', error);
    return res.status(500).json({ message: 'Server error', error: error.message });
  }
});

module.exports = router;