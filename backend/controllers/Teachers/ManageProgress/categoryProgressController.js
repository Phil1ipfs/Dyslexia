// controllers/Teachers/ManageProgress/categoryProgressController.js
const mongoose = require('mongoose');
const ObjectId = mongoose.Types.ObjectId;

// Helper function to get connection to test database
const getTestDb = () => mongoose.connection.useDb('test');

/**
 * Get category progress for a student
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
exports.getCategoryProgress = async (req, res) => {
  try {
    const studentId = req.params.id;
    console.log(`Getting category progress for student: ${studentId}`);
    
    // Check if studentId is a valid ObjectId
    let userId;
    try {
      if (mongoose.Types.ObjectId.isValid(studentId)) {
        userId = new mongoose.Types.ObjectId(studentId);
      } else {
        // If not a valid ObjectId, try to parse as a number
        const idNum = parseInt(studentId);
        if (!isNaN(idNum)) {
          // Check if there's a user with this ID number
          const usersCollection = getTestDb().collection('users');
          const user = await usersCollection.findOne({ idNumber: idNum });
          if (user) {
            userId = user._id;
          } else {
            userId = studentId; // Use as-is if we couldn't find a better ID
          }
        } else {
          userId = studentId; // Use as-is if it's not a number
        }
      }
    } catch (idError) {
      console.warn('Error processing studentId:', idError);
      userId = studentId; // Use as-is in case of error
    }
    
    const testDb = getTestDb();
    const categoryProgressCollection = testDb.collection('category_progress');
    
    // Try to find existing progress
    let progress;
    try {
      // Try with ObjectId if valid
      if (mongoose.Types.ObjectId.isValid(userId)) {
        progress = await categoryProgressCollection.findOne({ 
          userId: userId 
        });
      }
      
      // If not found, try with string ID
      if (!progress && typeof studentId === 'string') {
        progress = await categoryProgressCollection.findOne({ 
          userId: studentId 
        });
      }
    } catch (findError) {
      console.error('Error finding category progress:', findError);
    }
    
    // If progress exists, return it
    if (progress) {
      return res.json(progress);
    }
    
    // Get student info to help create initial progress
    let student;
    try {
      const usersCollection = testDb.collection('users');
      
      if (mongoose.Types.ObjectId.isValid(userId)) {
        student = await usersCollection.findOne({ _id: userId });
      }
      
      if (!student && typeof studentId === 'string') {
        student = await usersCollection.findOne({ 
          $or: [
            { idNumber: studentId },
            { email: studentId }
          ]
        });
      }
    } catch (userError) {
      console.warn('Error finding student:', userError);
    }
    
    // Create a new progress record
    const now = new Date();
    const readingLevel = student?.readingLevel || 'Not Assessed';
    
    const newProgress = {
      userId: mongoose.Types.ObjectId.isValid(userId) ? userId : studentId,
      studentName: student?.name || student?.firstName || `Student ${studentId}`,
      readingLevel: readingLevel,
      categories: [
        {
          categoryId: 1,
          categoryName: "Alphabet Knowledge",
          preAssessmentCompleted: false,
          preAssessmentScore: null,
          preAssessmentDate: null,
          mainAssessmentCompleted: false,
          mainAssessmentId: null,
          mainAssessmentScore: null,
          passed: false,
          passingThreshold: 75,
          attemptCount: 0,
          lastAttemptDate: null,
          completionDate: null,
          status: "pending"
        },
        {
          categoryId: 2,
          categoryName: "Phonological Awareness",
          preAssessmentCompleted: false,
          preAssessmentScore: null,
          preAssessmentDate: null,
          mainAssessmentCompleted: false,
          mainAssessmentId: null,
          mainAssessmentScore: null,
          passed: false,
          passingThreshold: 75,
          attemptCount: 0,
          lastAttemptDate: null,
          completionDate: null,
          status: "pending"
        },
        {
          categoryId: 3,
          categoryName: "Decoding",
          preAssessmentCompleted: false,
          preAssessmentScore: null,
          preAssessmentDate: null,
          mainAssessmentCompleted: false,
          mainAssessmentId: null,
          mainAssessmentScore: null,
          passed: false,
          passingThreshold: 75,
          attemptCount: 0,
          lastAttemptDate: null,
          completionDate: null,
          status: "pending"
        },
        {
          categoryId: 4,
          categoryName: "Word Recognition",
          preAssessmentCompleted: false,
          preAssessmentScore: null,
          preAssessmentDate: null,
          mainAssessmentCompleted: false,
          mainAssessmentId: null,
          mainAssessmentScore: null,
          passed: false,
          passingThreshold: 75,
          attemptCount: 0,
          lastAttemptDate: null,
          completionDate: null,
          status: "pending"
        },
        {
          categoryId: 5,
          categoryName: "Reading Comprehension",
          preAssessmentCompleted: false,
          preAssessmentScore: null,
          preAssessmentDate: null,
          mainAssessmentCompleted: false,
          mainAssessmentId: null,
          mainAssessmentScore: null,
          passed: false,
          passingThreshold: 75,
          attemptCount: 0,
          lastAttemptDate: null,
          completionDate: null,
          status: "locked"
        }
      ],
      completedCategories: 0,
      totalCategories: 5,
      overallProgress: 0,
      nextCategory: {
        categoryId: 1,
        categoryName: "Alphabet Knowledge",
        assessmentId: null
      },
      createdAt: now,
      updatedAt: now
    };
    
    try {
      // Try to insert the new progress record
      const result = await categoryProgressCollection.insertOne(newProgress);
      console.log(`Created new category progress with ID: ${result.insertedId}`);
      
      // Add the _id field to the object before returning
      newProgress._id = result.insertedId;
      return res.json(newProgress);
    } catch (insertError) {
      console.error('Error creating category progress:', insertError);
      
      return res.json(newProgress);
    }
  } catch (error) {
    console.error('Error in getCategoryProgress:', error);
    
    const defaultProgress = {
      userId: req.params.id,
      categories: [],
      completedCategories: 0,
      totalCategories: 5,
      overallProgress: 0,
      nextCategory: null,
      createdAt: new Date(),
      updatedAt: new Date()
    };
    
    res.json(defaultProgress);
  }
};