// routes/Parents/parentProfile.js
const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const { auth } = require('../../middleware/auth');

// Get parent profile by ID
router.get('/profile/:id', auth, async (req, res) => {
  try {
    const parentId = req.params.id;
    console.log(`Fetching parent profile for ID: ${parentId}`);
    
    if (!mongoose.Types.ObjectId.isValid(parentId)) {
      return res.status(400).json({ message: 'Invalid parent ID format' });
    }
    
    const parentObjId = new mongoose.Types.ObjectId(parentId);
    
    // Access the parent database and profile collection
    const parentDb = mongoose.connection.useDb('parent');
    const profileCollection = parentDb.collection('profile');
    
    // Find parent profile
    const parentProfile = await profileCollection.findOne({ _id: parentObjId });
    console.log(`Parent profile found: ${parentProfile ? 'Yes' : 'No'}`);
    
    if (!parentProfile) {
      return res.status(404).json({ message: 'Parent profile not found' });
    }
    
    // Get user info from users_web database
    const usersDb = mongoose.connection.useDb('users_web');
    const usersCollection = usersDb.collection('users');
    
    let userEmail = null;
    if (parentProfile.userId) {
      const userObjId = new mongoose.Types.ObjectId(parentProfile.userId);
      const user = await usersCollection.findOne({ _id: userObjId });
      if (user) {
        userEmail = user.email;
      }
    }
    
    // Build parent info object
    const parentInfo = {
      name: `${parentProfile.firstName || ''} ${parentProfile.middleName || ''} ${parentProfile.lastName || ''}`.trim(),
      email: userEmail,
      contact: parentProfile.contact || '',
      address: parentProfile.address || '',
      civilStatus: parentProfile.civilStatus || '',
      gender: parentProfile.gender || '',
      occupation: parentProfile.occupation || '',
      profileImageUrl: parentProfile.profileImageUrl || null
    };
    
    return res.json(parentInfo);
  } catch (error) {
    console.error('Error fetching parent profile:', error);
    return res.status(500).json({ message: 'Server error', error: error.message });
  }
});

module.exports = router;