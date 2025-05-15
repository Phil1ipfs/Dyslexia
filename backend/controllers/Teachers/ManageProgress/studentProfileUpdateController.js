// controllers/Teachers/ManageProgress/studentProfileUpdateController.js
const mongoose = require('mongoose');
const ObjectId = mongoose.Types.ObjectId;

// Helper function to get connection to test database
const getTestDb = () => mongoose.connection.useDb('test');

// Get updates for a student
exports.getUpdates = async (req, res) => {
  try {
    const studentId = req.params.id;
    
    const testDb = getTestDb();
    const updatesCollection = testDb.collection('student_profile_updates');
    
    const updates = await updatesCollection.find({
      userId: ObjectId(studentId)
    }).sort({ updateDate: -1 }).toArray();
    
    res.json(updates);
  } catch (error) {
    console.error('Error fetching student profile updates:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Create a new profile update
exports.createUpdate = async (req, res) => {
  try {
    const studentId = req.params.id;
    const { updateType, previousValue, newValue, reason, assessmentId, categoryId } = req.body;
    const teacherId = req.user.id;
    
    if (!updateType) {
      return res.status(400).json({ message: 'Update type is required' });
    }
    
    const validUpdateTypes = [
      'assignment_received',
      'assessment_completed',
      'category_status_changed',
      'reading_level_changed',
      'recommendation_created'
    ];
    
    if (!validUpdateTypes.includes(updateType)) {
      return res.status(400).json({ message: 'Invalid update type' });
    }
    
    const testDb = getTestDb();
    const updatesCollection = testDb.collection('student_profile_updates');
    
    const update = {
      userId: ObjectId(studentId),
      updateType: updateType,
      previousValue: previousValue,
      newValue: newValue,
      reason: reason,
      assessmentId: assessmentId,
      categoryId: categoryId ? parseInt(categoryId) : undefined,
      updateDate: new Date(),
      updatedBy: ObjectId(teacherId)
    };
    
    const result = await updatesCollection.insertOne(update);
    
    res.status(201).json({
      success: true,
      message: 'Profile update created',
      updateId: result.insertedId,
      update: {
        ...update,
        _id: result.insertedId
      }
    });
  } catch (error) {
    console.error('Error creating profile update:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};