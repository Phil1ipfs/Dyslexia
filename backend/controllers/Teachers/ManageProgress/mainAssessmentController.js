// controllers/Teachers/ManageProgress/mainAssessmentController.js
const mongoose = require('mongoose');
const ObjectId = mongoose.Types.ObjectId;

// Helper function to get connection to test database
const getTestDb = () => mongoose.connection.useDb('test');

// Get all published main assessments for Manage Progress
exports.getPublishedAssessments = async (req, res) => {
  try {
    const testDb = getTestDb();
    const mainAssessmentCollection = testDb.collection('main_assessment');
    
    // Get filters from query parameters
    const { categoryId, readingLevel } = req.query;
    
    // Build filter object - ONLY show published and active assessments
    const filter = {
      status: "active",
      isPublished: true
    };
    
    if (categoryId) {
      filter.categoryID = parseInt(categoryId);
    }
    
    if (readingLevel) {
      filter.targetReadingLevel = readingLevel;
    }
    
    // Execute query with robust error handling
    let assessments;
    try {
      assessments = await mainAssessmentCollection.find(filter).toArray();
      
      // Log successful query and assessment count
      console.log(`Successfully retrieved ${assessments.length} published assessments`);
      if (assessments.length === 0) {
        console.log('Warning: No published assessments found matching filter criteria');
      }
    } catch (queryError) {
      console.error('Database query error:', queryError);
      return res.status(500).json({ 
        message: 'Error querying assessment database', 
        error: queryError.message 
      });
    }
    
    // Return full result set to match API expectations
    res.json(assessments);
  } catch (error) {
    console.error('Error in getPublishedAssessments:', error);
    res.status(500).json({ 
      message: 'Server error', 
      error: error.message,
      stack: process.env.NODE_ENV === 'production' ? undefined : error.stack
    });
  }
};

// Get a specific published assessment by ID
exports.getPublishedAssessmentById = async (req, res) => {
  try {
    const assessmentId = req.params.id;
    console.log(`Looking up published assessment with ID: ${assessmentId}`);
    
    const testDb = getTestDb();
    const mainAssessmentCollection = testDb.collection('main_assessment');
    
    // Only retrieve active and published assessments
    const filter = {
      status: "active",
      isPublished: true,
      $or: []
    };
    
    // Try different ways to find the assessment
    if (mongoose.Types.ObjectId.isValid(assessmentId)) {
      filter.$or.push({ _id: ObjectId(assessmentId) });
    }
    
    filter.$or.push({ assessmentId: assessmentId });
    
    const assessment = await mainAssessmentCollection.findOne(filter);
    
    // If assessment is found, return it
    if (assessment) {
      return res.json(assessment);
    }
    
    // If not found after all attempts, return 404
    console.log(`Published assessment not found with ID: ${assessmentId}`);
    return res.status(404).json({ message: 'Published assessment not found' });
  } catch (error) {
    console.error('Error in getPublishedAssessmentById:', error);
    res.status(500).json({ 
      message: 'Server error', 
      error: error.message,
      stack: process.env.NODE_ENV === 'production' ? undefined : error.stack
    });
  }
};


// Get all main assessments with proper error handling
exports.getAllAssessments = async (req, res) => {
  try {
    const testDb = getTestDb();
    const mainAssessmentCollection = testDb.collection('main_assessment');
    
    // Get filters from query parameters
    const { categoryId, readingLevel } = req.query;
    
    // Build filter object
    const filter = {};
    
    if (categoryId) {
      filter.categoryID = parseInt(categoryId);
    }
    
    if (readingLevel) {
      filter.targetReadingLevel = readingLevel;
    }
    
    // Execute query with robust error handling
    let assessments;
    try {
      assessments = await mainAssessmentCollection.find(filter).toArray();
      
      // Log successful query and assessment count
      console.log(`Successfully retrieved ${assessments.length} assessments`);
      if (assessments.length === 0) {
        console.log('Warning: No assessments found matching filter criteria');
      }
    } catch (queryError) {
      console.error('Database query error:', queryError);
      return res.status(500).json({ 
        message: 'Error querying assessment database', 
        error: queryError.message 
      });
    }
    
    // Return full result set to match API expectations
    res.json(assessments);
  } catch (error) {
    console.error('Error in getAllAssessments:', error);
    res.status(500).json({ 
      message: 'Server error', 
      error: error.message,
      stack: process.env.NODE_ENV === 'production' ? undefined : error.stack
    });
  }
};

// Get a specific main assessment by ID with multiple fallback options
exports.getAssessmentById = async (req, res) => {
  try {
    const assessmentId = req.params.id;
    console.log(`Looking up assessment with ID: ${assessmentId}`);
    
    const testDb = getTestDb();
    const mainAssessmentCollection = testDb.collection('main_assessment');
    
    // Try different ways to find the assessment
    let assessment = null;
    
    // Try to find by ObjectId first
    if (mongoose.Types.ObjectId.isValid(assessmentId)) {
      try {
        assessment = await mainAssessmentCollection.findOne({
          _id: ObjectId(assessmentId)
        });
        
        if (assessment) {
          console.log(`Found assessment by _id: ${assessment.title}`);
        }
      } catch (objIdError) {
        console.warn(`Error finding by ObjectId: ${objIdError.message}`);
      }
    }
    
    // If not found, try by assessmentId string
    if (!assessment) {
      try {
        assessment = await mainAssessmentCollection.findOne({
          assessmentId: assessmentId
        });
        
        if (assessment) {
          console.log(`Found assessment by assessmentId: ${assessment.title}`);
        }
      } catch (strIdError) {
        console.warn(`Error finding by string ID: ${strIdError.message}`);
      }
    }
    
    // If still not found, try partial match (to handle prefixes like MA-)
    if (!assessment) {
      try {
        const partialMatches = await mainAssessmentCollection.find({
          assessmentId: { $regex: assessmentId, $options: 'i' }
        }).toArray();
        
        if (partialMatches.length > 0) {
          assessment = partialMatches[0];
          console.log(`Found assessment by partial match: ${assessment.title}`);
        }
      } catch (regexError) {
        console.warn(`Error finding by regex: ${regexError.message}`);
      }
    }
    
    // If assessment is found, return it
    if (assessment) {
      return res.json(assessment);
    }
    
    // If not found after all attempts, return 404
    console.log(`Assessment not found with ID: ${assessmentId}`);
    return res.status(404).json({ message: 'Assessment not found' });
  } catch (error) {
    console.error('Error in getAssessmentById:', error);
    res.status(500).json({ 
      message: 'Server error', 
      error: error.message,
      stack: process.env.NODE_ENV === 'production' ? undefined : error.stack
    });
  }
};

// Get filtered assessments by category and reading level
exports.getFilteredAssessments = async (req, res) => {
  try {
    const { categoryId, readingLevel } = req.query;
    console.log(`Filtering assessments by: categoryId=${categoryId}, readingLevel=${readingLevel}`);
    
    const testDb = getTestDb();
    const mainAssessmentCollection = testDb.collection('main_assessment');
    
    // Build filter object
    const filter = {};
    
    if (categoryId) {
      filter.categoryID = parseInt(categoryId);
    }
    
    if (readingLevel) {
      filter.targetReadingLevel = readingLevel;
    }
    
    let assessments;
    try {
      assessments = await mainAssessmentCollection.find(filter).toArray();
      console.log(`Found ${assessments.length} assessments matching filter criteria`);
    } catch (queryError) {
      console.error('Database query error:', queryError);
      return res.status(500).json({ 
        message: 'Error querying filtered assessments', 
        error: queryError.message 
      });
    }
    
    res.json(assessments);
  } catch (error) {
    console.error('Error in getFilteredAssessments:', error);
    res.status(500).json({ 
      message: 'Server error', 
      error: error.message 
    });
  }
};

// Create a new assessment with detailed validation
exports.createAssessment = async (req, res) => {
  try {
    const {
      title,
      description,
      categoryID,
      categoryName,
      targetReadingLevel,
      passingThreshold,
      questions,
      instructions,
      feedbackSettings
    } = req.body;
    
    // Enhanced validation with specific error messages
    const validationErrors = [];
    
    if (!title) validationErrors.push('Title is required');
    if (!categoryID) validationErrors.push('Category ID is required');
    if (!categoryName) validationErrors.push('Category name is required');
    if (!targetReadingLevel) validationErrors.push('Target reading level is required');
    
    if (validationErrors.length > 0) {
      return res.status(400).json({ 
        message: 'Validation errors', 
        errors: validationErrors 
      });
    }
    
    // Generate a unique assessment ID with category prefix
    const timestamp = Date.now().toString().slice(-6);
    const assessmentId = `MA-${categoryID}-${timestamp}`;
    
    console.log(`Creating new assessment: ${title} with ID: ${assessmentId}`);
    
    const testDb = getTestDb();
    const mainAssessmentCollection = testDb.collection('main_assessment');
    
    // Create the new assessment with all expected fields
    const newAssessment = {
      assessmentId,
      title,
      description: description || `${title} for ${targetReadingLevel} level students`,
      categoryID: parseInt(categoryID),
      categoryName,
      targetReadingLevel,
      totalQuestions: questions ? questions.length : 0,
      passingThreshold: passingThreshold || 75,
      status: 'active',
      isPublished: true,
      questions: questions || [],
      instructions: instructions || `Please complete this ${categoryName} assessment.`,
      feedbackSettings: feedbackSettings || {
        showExplanation: true,
        showCorrectAnswer: true,
        immediatePerQuestionFeedback: true
      },
      createdBy: req.user.id ? ObjectId(req.user.id) : null,
      createdAt: new Date(),
      updatedAt: new Date()
    };
    
    // Insert with error handling
    let result;
    try {
      result = await mainAssessmentCollection.insertOne(newAssessment);
      console.log(`Assessment created with ID: ${assessmentId}`);
    } catch (insertError) {
      console.error('Error inserting assessment:', insertError);
      return res.status(500).json({ 
        message: 'Error creating assessment in database', 
        error: insertError.message 
      });
    }
    
    // Return success with created assessment
    res.status(201).json({
      success: true,
      message: 'Assessment created successfully',
      assessmentId: assessmentId,
      _id: result.insertedId
    });
  } catch (error) {
    console.error('Error in createAssessment:', error);
    res.status(500).json({ 
      message: 'Server error', 
      error: error.message 
    });
  }
};

// Update assessment
exports.updateAssessment = async (req, res) => {
  try {
    const assessmentId = req.params.id;
    const updateData = req.body;
    
    console.log(`Updating assessment: ${assessmentId}`);
    
    // Don't allow changing assessmentId or createdBy
    delete updateData.assessmentId;
    delete updateData.createdBy;
    
    // Update the updatedAt timestamp
    updateData.updatedAt = new Date();
    
    const testDb = getTestDb();
    const mainAssessmentCollection = testDb.collection('main_assessment');
    
    // Find the assessment first to determine how to update it
    let assessment = null;
    
    // Try different ways to find the assessment
    if (mongoose.Types.ObjectId.isValid(assessmentId)) {
      assessment = await mainAssessmentCollection.findOne({
        _id: ObjectId(assessmentId)
      });
    }
    
    if (!assessment) {
      assessment = await mainAssessmentCollection.findOne({
        assessmentId: assessmentId
      });
    }
    
    if (!assessment) {
      return res.status(404).json({ message: 'Assessment not found' });
    }
    
    // Update the assessment
    try {
      const result = await mainAssessmentCollection.findOneAndUpdate(
        { _id: assessment._id },
        { $set: updateData },
        { returnDocument: 'after' }
      );
      
      // Check if update was successful
      if (!result.value) {
        return res.status(404).json({ message: 'Assessment not found after update' });
      }
      
      console.log(`Assessment updated: ${result.value.title}`);
      
      res.json({
        success: true,
        message: 'Assessment updated successfully',
        assessment: result.value
      });
    } catch (updateError) {
      console.error('Error updating assessment:', updateError);
      return res.status(500).json({ 
        message: 'Error updating assessment', 
        error: updateError.message 
      });
    }
  } catch (error) {
    console.error('Error in updateAssessment:', error);
    res.status(500).json({ 
      message: 'Server error', 
      error: error.message 
    });
  }
};

// Delete assessment
exports.deleteAssessment = async (req, res) => {
  try {
    const assessmentId = req.params.id;
    console.log(`Deleting assessment: ${assessmentId}`);
    
    const testDb = getTestDb();
    const mainAssessmentCollection = testDb.collection('main_assessment');
    
    // Try to find by ObjectId first
    let filter = {};
    
    if (mongoose.Types.ObjectId.isValid(assessmentId)) {
      filter._id = ObjectId(assessmentId);
    } else {
      filter.assessmentId = assessmentId;
    }
    
    // Try to delete the assessment
    try {
      const result = await mainAssessmentCollection.deleteOne(filter);
      
      if (result.deletedCount === 0) {
        console.log(`No assessment found to delete with ID: ${assessmentId}`);
        return res.status(404).json({ message: 'Assessment not found' });
      }
      
      console.log(`Deleted assessment with ID: ${assessmentId}`);
      
      res.json({
        success: true,
        message: 'Assessment deleted successfully'
      });
    } catch (deleteError) {
      console.error('Error deleting assessment:', deleteError);
      return res.status(500).json({ 
        message: 'Error deleting assessment', 
        error: deleteError.message 
      });
    }
  } catch (error) {
    console.error('Error in deleteAssessment:', error);
    res.status(500).json({ 
      message: 'Server error', 
      error: error.message 
    });
  }
};