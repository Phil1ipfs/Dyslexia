// controllers/Teachers/ManageProgress/readingLevelProgressionController.js
const mongoose = require('mongoose');
const ObjectId = mongoose.Types.ObjectId;

// Helper function to get connection to test database
const getTestDb = () => mongoose.connection.useDb('test');

// Get reading level progression for a student
// In controllers/Teachers/ManageProgress/readingLevelProgressionController.js
exports.getProgression = async (req, res) => {
  try {
    const studentId = req.params.id;
    console.log(`Getting reading level progression for student: ${studentId}`);
    
    const testDb = getTestDb();
    const readingLevelCollection = testDb.collection('reading_level_progression');
    const usersCollection = testDb.collection('users');
    
    // Try to find progression first
    let progressionQuery = {};
    
    if (mongoose.Types.ObjectId.isValid(studentId)) {
      progressionQuery.userId = new mongoose.Types.ObjectId(studentId);
    } else {
      // Try numeric ID if not valid ObjectId
      const studentIdNum = parseInt(studentId);
      if (!isNaN(studentIdNum)) {
        // If we're dealing with a numeric ID, we need to find the user first to get the ObjectId
        const user = await usersCollection.findOne({ idNumber: studentIdNum });
        if (user) {
          progressionQuery.userId = user._id;
        } else {
          progressionQuery.userId = studentId; // Fallback to using the string directly
        }
      } else {
        progressionQuery.userId = studentId;
      }
    }
    
    let progression = await readingLevelCollection.findOne(progressionQuery);
    
    // If not found, try to create a new progression
    if (!progression) {
      console.log(`No reading level progression found, checking if student exists`);
      
      // Try to find the student in users collection
      let student = null;
      
      if (mongoose.Types.ObjectId.isValid(studentId)) {
        student = await usersCollection.findOne({ _id: new mongoose.Types.ObjectId(studentId) });
      } 
      
      if (!student) {
        const studentIdNum = parseInt(studentId);
        if (!isNaN(studentIdNum)) {
          student = await usersCollection.findOne({ idNumber: studentIdNum });
        }
      }
      
      // If student exists, create a new progression for them
      if (student) {
        console.log(`Found student, creating new reading level progression`);
        const readingLevel = student.readingLevel || 'Transitioning';
        const now = new Date();
        
        const newProgression = {
          userId: student._id,
          currentReadingLevel: readingLevel,
          initialReadingLevel: readingLevel,
          levelHistory: [{
            readingLevel: readingLevel,
            startDate: now
          }],
          advancementRequirements: calculateAdvancementRequirements(readingLevel),
          overallProgress: 0,
          createdAt: now,
          updatedAt: now
        };
        
        try {
          // Insert into database
          const result = await readingLevelCollection.insertOne(newProgression);
          newProgression._id = result.insertedId;
          
          console.log(`Created new reading level progression with ID: ${result.insertedId}`);
          return res.json(newProgression);
        } catch (insertError) {
          console.error('Error creating reading level progression:', insertError);
          return res.status(500).json({
            message: 'Error creating reading level progression',
            error: insertError.message
          });
        }
      } else {
        // If student doesn't exist, create a placeholder record
        console.log(`Student not found, creating placeholder progression`);
        
        // Determine if this is a student ID that isn't in ObjectId format
        const userId = mongoose.Types.ObjectId.isValid(studentId) ?
          new mongoose.Types.ObjectId(studentId) : studentId;
          
        const now = new Date();
        const readingLevel = 'Transitioning'; // Default to transitioning as that's what UI expects
        
        const placeholderProgression = {
          userId: userId,
          currentReadingLevel: readingLevel,
          initialReadingLevel: readingLevel,
          levelHistory: [{
            readingLevel: readingLevel,
            startDate: now
          }],
          advancementRequirements: calculateAdvancementRequirements(readingLevel),
          overallProgress: 0,
          createdAt: now,
          updatedAt: now
        };
        
        try {
          // Insert into database
          const result = await readingLevelCollection.insertOne(placeholderProgression);
          placeholderProgression._id = result.insertedId;
          
          console.log(`Created placeholder reading level progression with ID: ${result.insertedId}`);
          return res.json(placeholderProgression);
        } catch (insertError) {
          console.error('Error creating placeholder progression:', insertError);
          // If we can't even create a placeholder, return something that matches the schema
          return res.json(placeholderProgression);
        }
      }
    }
    
    // Return existing progression
    return res.json(progression);
  } catch (error) {
    console.error('Error in getProgression:', error);
    res.status(500).json({ 
      message: 'Server error', 
      error: error.message 
    });
  }
};



// Update student reading level
exports.updateReadingLevel = async (req, res) => {
  try {
    const studentId = req.params.id;
    const { newLevel, reason } = req.body;
    const teacherId = req.user ? req.user.id : null;
    
    console.log(`Updating reading level to "${newLevel}" for student: ${studentId}`);
    
    // Input validation
    if (!newLevel) {
      return res.status(400).json({ message: 'New reading level is required' });
    }
    
    const validLevels = [
      'Low Emerging', 
      'High Emerging', 
      'Developing', 
      'Transitioning', 
      'At Grade Level',
      'Not Assessed'
    ];
    
    if (!validLevels.includes(newLevel)) {
      return res.status(400).json({ message: 'Invalid reading level' });
    }
    
    const testDb = getTestDb();
    const readingLevelCollection = testDb.collection('reading_level_progression');
    const usersCollection = testDb.collection('users');
    const studentProfileUpdatesCollection = testDb.collection('student_profile_updates');
    
    // Start a MongoDB session for transaction
    const session = await mongoose.startSession();
    session.startTransaction();
    
    try {
      // Update user record first
      try {
        await usersCollection.updateOne(
          { _id: mongoose.Types.ObjectId.isValid(studentId) ? ObjectId(studentId) : studentId },
          {
            $set: {
              readingLevel: newLevel,
              lastAssessmentDate: new Date()
            }
          },
          { session }
        );
        
        console.log(`Updated user record with new reading level: ${newLevel}`);
      } catch (userUpdateError) {
        console.error('Error updating user record:', userUpdateError);
        throw userUpdateError; // Will trigger transaction abort
      }
      
      // Get the current progression
      let progression;
      try {
        progression = await readingLevelCollection.findOne({
          userId: mongoose.Types.ObjectId.isValid(studentId) ? ObjectId(studentId) : studentId
        });
        
        console.log(`Reading level progression ${progression ? 'found' : 'not found'} for student: ${studentId}`);
      } catch (progressionError) {
        console.error('Error finding reading level progression:', progressionError);
        throw progressionError; // Will trigger transaction abort
      }
      
      const now = new Date();
      let updateResult;
      
      if (progression) {
        // Update existing progression
        const currentLevel = progression.currentReadingLevel;
        
        // Don't update if the level is the same
        if (currentLevel === newLevel) {
          await session.abortTransaction();
          session.endSession();
          console.log(`Reading level unchanged (already ${newLevel})`);
          
          return res.json({
            success: true,
            message: 'Reading level unchanged',
            progression
          });
        }
        
        // Add to level history
        const levelHistory = progression.levelHistory || [];
        levelHistory.push({
          readingLevel: newLevel,
          startDate: now
        });
        
        // Update the previous entry's end date
        if (levelHistory.length > 1) {
          const previousIndex = levelHistory.length - 2;
          levelHistory[previousIndex].endDate = now;
        }
        
        // Determine the next level advancement requirements
        const advancementRequirements = calculateAdvancementRequirements(newLevel);
        
        try {
          updateResult = await readingLevelCollection.findOneAndUpdate(
            { _id: progression._id },
            {
              $set: {
                currentReadingLevel: newLevel,
                levelHistory: levelHistory,
                advancementRequirements: advancementRequirements,
                updatedAt: now
              }
            },
            { 
              session,
              returnDocument: 'after'
            }
          );
          
          console.log(`Updated reading level progression to: ${newLevel}`);
        } catch (updateError) {
          console.error('Error updating reading level progression:', updateError);
          throw updateError; // Will trigger transaction abort
        }
      } else {
        // Create new progression
        const levelHistory = [{
          readingLevel: newLevel,
          startDate: now
        }];
        
        const advancementRequirements = calculateAdvancementRequirements(newLevel);
        
        const newProgression = {
          userId: mongoose.Types.ObjectId.isValid(studentId) ? ObjectId(studentId) : studentId,
          currentReadingLevel: newLevel,
          initialReadingLevel: newLevel,
          levelHistory: levelHistory,
          advancementRequirements: advancementRequirements,
          overallProgress: 0,
          createdAt: now,
          updatedAt: now
        };
        
        try {
          const insertResult = await readingLevelCollection.insertOne(newProgression, { session });
          newProgression._id = insertResult.insertedId;
          updateResult = { value: newProgression };
          
          console.log(`Created new reading level progression with level: ${newLevel}`);
        } catch (insertError) {
          console.error('Error creating reading level progression:', insertError);
          throw insertError; // Will trigger transaction abort
        }
      }
      
      // Add student profile update
      try {
        const previousLevel = progression && progression.levelHistory && progression.levelHistory.length > 1 
          ? progression.levelHistory[progression.levelHistory.length - 2].readingLevel
          : null;
          
        await studentProfileUpdatesCollection.insertOne({
          userId: mongoose.Types.ObjectId.isValid(studentId) ? ObjectId(studentId) : studentId,
          updateType: "reading_level_changed",
          previousValue: previousLevel,
          newValue: newLevel,
          reason: reason || "Assessment completion",
          updateDate: now,
          updatedBy: mongoose.Types.ObjectId.isValid(teacherId) ? ObjectId(teacherId) : teacherId
        }, { session });
        
        console.log(`Created student profile update for reading level change`);
      } catch (updateError) {
        console.error('Error creating student profile update:', updateError);
        throw updateError; // Will trigger transaction abort
      }
      
      // Commit the transaction
      await session.commitTransaction();
      session.endSession();
      
      console.log('Transaction committed successfully');
      
      res.json({
        success: true,
        message: 'Reading level updated successfully',
        progression: updateResult.value
      });
    } catch (error) {
      // Abort transaction on error
      await session.abortTransaction();
      session.endSession();
      console.error('Transaction aborted due to error');
      
      throw error;
    }
  } catch (error) {
    console.error('Error in updateReadingLevel:', error);
    res.status(500).json({ 
      message: 'Server error', 
      error: error.message 
    });
  }
};

function calculateAdvancementRequirements(currentLevel) {
  const nextLevelMap = {
    'Low Emerging': 'High Emerging',
    'High Emerging': 'Developing',
    'Developing': 'Transitioning',
    'Transitioning': 'At Grade Level',
    'At Grade Level': 'At Grade Level',
    'Not Assessed': 'Low Emerging'
  };
  
  const requiredCategoriesMap = {
    'Low Emerging': [1, 2, 3], // Alphabet Knowledge, Phonological Awareness, Decoding
    'High Emerging': [2, 3, 4], // Phonological Awareness, Decoding, Word Recognition
    'Developing': [3, 4, 5],    // Decoding, Word Recognition, Reading Comprehension
    'Transitioning': [4, 5],    // Word Recognition, Reading Comprehension
    'At Grade Level': [5],      // Reading Comprehension
    'Not Assessed': [1, 2, 3]   // Same as Low Emerging
  };
  
  return {
    currentLevel: currentLevel,
    nextLevel: nextLevelMap[currentLevel],
    requiredCategories: requiredCategoriesMap[currentLevel] || [],
    completedCategories: [],
    remainingCategories: requiredCategoriesMap[currentLevel] || []
  };
}



