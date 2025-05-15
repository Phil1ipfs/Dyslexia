// controllers/Teachers/ManageProgress/customizedAssessmentController.js
const mongoose = require('mongoose');
const ObjectId = mongoose.Types.ObjectId;

// Helper function to get connection to database
const getTestDb = () => mongoose.connection.useDb('test');
const getPreAssessmentDb = () => mongoose.connection.useDb('Pre_Assessment');

/**
 * Create a customized assessment from a template
 * @route POST /api/customized-assessment
 */


exports.createCustomizedAssessment = async (req, res) => {
    try {
      const { originalAssessmentId, studentId, questions, title, description } = req.body;
      const teacherId = req.user.id;
      
      // Validate request data
      if (!originalAssessmentId || !studentId || !questions || !Array.isArray(questions)) {
        return res.status(400).json({ 
          success: false, 
          message: 'Missing required fields: originalAssessmentId, studentId, questions array' 
        });
      }
      
      const testDb = getTestDb();
      const customizedAssessmentsCollection = testDb.collection('customized_assessments');
      const mainAssessmentCollection = testDb.collection('main_assessment');
      
      // Find the original assessment
      let originalAssessment;
      if (mongoose.Types.ObjectId.isValid(originalAssessmentId)) {
        originalAssessment = await mainAssessmentCollection.findOne({ _id: new ObjectId(originalAssessmentId) });
      }
      
      if (!originalAssessment) {
        originalAssessment = await mainAssessmentCollection.findOne({ assessmentId: originalAssessmentId });
      }
      
      if (!originalAssessment) {
        return res.status(404).json({ success: false, message: 'Original assessment not found' });
      }
      
      // Generate a unique assessment ID
      const customAssessmentId = `CA-${originalAssessment.categoryID}-${Date.now().toString().slice(-6)}`;
      
      // Process content references for questions
      const processedQuestions = questions.map(question => {
        // Ensure we have a valid question ID
        if (!question.questionId) {
          question.questionId = Date.now().toString() + Math.floor(Math.random() * 1000);
        }
        
        // Preserve original question ID if available
        if (!question.originalQuestionId) {
          question.originalQuestionId = question.questionId;
        }
        
        return question;
      });
      
      // Create the customized assessment
      const customizedAssessment = {
        originalAssessmentId: originalAssessment.assessmentId || originalAssessmentId,
        studentId: mongoose.Types.ObjectId.isValid(studentId) ? new ObjectId(studentId) : studentId,
        teacherId: mongoose.Types.ObjectId.isValid(teacherId) ? new ObjectId(teacherId) : teacherId,
        assessmentId: customAssessmentId,
        title: title || `${originalAssessment.title} (Customized)`,
        description: description || `Customized version of ${originalAssessment.title}`,
        categoryID: originalAssessment.categoryID,
        categoryName: originalAssessment.categoryName,
        targetReadingLevel: originalAssessment.targetReadingLevel,
        questions: processedQuestions,
        totalQuestions: processedQuestions.length,
        status: 'active',
        isPublished: true,
        createdAt: new Date(),
        updatedAt: new Date()
      };
      
      // Insert into database
      const result = await customizedAssessmentsCollection.insertOne(customizedAssessment);
      
      res.status(201).json({
        success: true,
        message: 'Customized assessment created successfully',
        customizedAssessment: {
          ...customizedAssessment,
          _id: result.insertedId
        }
      });
    } catch (error) {
      console.error('Error creating customized assessment:', error);
      res.status(500).json({
        success: false,
        message: 'Server error',
        error: error.message
      });
    }
  };




/**
 * Get questions with content for a customized assessment
 * @route GET /api/customized-assessment/:id/questions-with-content
 */
exports.getQuestionsWithContent = async (req, res) => {
  try {
    const { id } = req.params;
    
    if (!id) {
      return res.status(400).json({ 
        success: false, 
        message: 'Assessment ID is required' 
      });
    }
    
    const testDb = getTestDb();
    const customizedAssessmentsCollection = testDb.collection('customized_assessments');
    const preAssessmentDb = getPreAssessmentDb();
    
    // Find the assessment
    const customizedAssessment = await customizedAssessmentsCollection.findOne({
      $or: [
        { _id: mongoose.Types.ObjectId.isValid(id) ? new ObjectId(id) : null },
        { assessmentId: id }
      ].filter(q => q !== null)
    });
    
    if (!customizedAssessment) {
      return res.status(404).json({ 
        success: false, 
        message: 'Customized assessment not found' 
      });
    }
    
    // Process each question to load content
    const questionsWithContent = [];
    
    for (const question of customizedAssessment.questions) {
      let content = null;
      
      if (question.contentReference) {
        const { collection, contentId } = question.contentReference;
        const collectionObj = preAssessmentDb.collection(collection);
        
        try {
          // Try to find content by ID
          if (mongoose.Types.ObjectId.isValid(contentId)) {
            content = await collectionObj.findOne({
              _id: new ObjectId(contentId)
            });
          }
          
          // Try by $oid if it's an object
          if (!content && typeof contentId === 'object' && contentId.$oid) {
            content = await collectionObj.findOne({
              _id: new ObjectId(contentId.$oid)
            });
          }
          
          // Try by content type ID field
          if (!content) {
            const contentType = collection.replace('_collection', '');
            const idField = `${contentType}ID`;
            
            const query = {};
            query[idField] = contentId.toString();
            
            content = await collectionObj.findOne(query);
          }
        } catch (contentError) {
          console.warn(`Error loading content for question ${question.questionId}:`, contentError);
        }
      }
      
      questionsWithContent.push({
        ...question,
        content
      });
    }
    
    res.json({
      success: true,
      questionsWithContent
    });
  } catch (error) {
    console.error('Error fetching questions with content:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

/**
 * Update question content
 * @route PUT /api/customized-assessment/:id/question/:questionId/content
 */
exports.updateQuestionContent = async (req, res) => {
  try {
    const { id, questionId } = req.params;
    const { contentReference } = req.body;
    
    if (!id || !questionId) {
      return res.status(400).json({ 
        success: false, 
        message: 'Assessment ID and Question ID are required' 
      });
    }
    
    if (!contentReference || !contentReference.collection || !contentReference.contentId) {
      return res.status(400).json({ 
        success: false, 
        message: 'Valid content reference is required' 
      });
    }
    
    const testDb = getTestDb();
    const customizedAssessmentsCollection = testDb.collection('customized_assessments');
    
    // Find the assessment
    const customizedAssessment = await customizedAssessmentsCollection.findOne({
      $or: [
        { _id: mongoose.Types.ObjectId.isValid(id) ? new ObjectId(id) : null },
        { assessmentId: id }
      ].filter(q => q !== null)
    });
    
    if (!customizedAssessment) {
      return res.status(404).json({ 
        success: false, 
        message: 'Customized assessment not found' 
      });
    }
    
    // Find the question index
    const questionIdToFind = questionId;
    const questions = customizedAssessment.questions || [];
    const questionIndex = questions.findIndex(q => 
      q.questionId === questionIdToFind || q.questionId?.toString() === questionId.toString()
    );
    
    if (questionIndex === -1) {
      return res.status(404).json({ 
        success: false, 
        message: 'Question not found in this assessment' 
      });
    }
    
    // Store original content reference if not already saved
    const originalContentReference = questions[questionIndex].originalContentReference || 
                                   questions[questionIndex].contentReference;
    
    // Update the question's content reference
    const updatedQuestions = [...questions];
    updatedQuestions[questionIndex] = {
      ...updatedQuestions[questionIndex],
      contentReference: contentReference,
      originalContentReference: originalContentReference
    };
    
    const result = await customizedAssessmentsCollection.findOneAndUpdate(
      { _id: customizedAssessment._id },
      { 
        $set: { 
          questions: updatedQuestions,
          updatedAt: new Date()
        }
      },
      { returnDocument: 'after' }
    );
    
    res.json({
      success: true,
      message: 'Question content updated successfully',
      updatedQuestion: result.value.questions[questionIndex]
    });
  } catch (error) {
    console.error('Error updating question content:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

/**
 * Get customized assessment by ID
 * @route GET /api/customized-assessment/:id
 */
exports.getCustomizedAssessment = async (req, res) => {
  try {
    const { id } = req.params;
    
    if (!id) {
      return res.status(400).json({ 
        success: false, 
        message: 'Assessment ID is required' 
      });
    }
    
    const testDb = getTestDb();
    const customizedAssessmentsCollection = testDb.collection('customized_assessments');
    
    // Try to find by ID or assessmentId
    const customizedAssessment = await customizedAssessmentsCollection.findOne({
      $or: [
        { _id: mongoose.Types.ObjectId.isValid(id) ? new ObjectId(id) : null },
        { assessmentId: id }
      ].filter(q => q !== null)
    });
    
    if (!customizedAssessment) {
      return res.status(404).json({ 
        success: false, 
        message: 'Customized assessment not found' 
      });
    }
    
    res.json({
      success: true,
      customizedAssessment
    });
  } catch (error) {
    console.error('Error fetching customized assessment:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

/**
 * Get all customized assessments for a student
 * @route GET /api/customized-assessment/student/:studentId
 */
exports.getCustomizedAssessmentsByStudent = async (req, res) => {
  try {
    const { studentId } = req.params;
    
    if (!studentId) {
      return res.status(400).json({ 
        success: false, 
        message: 'Student ID is required' 
      });
    }
    
    const testDb = getTestDb();
    const customizedAssessmentsCollection = testDb.collection('customized_assessments');
    
    const customizedAssessments = await customizedAssessmentsCollection.find({
      studentId: mongoose.Types.ObjectId.isValid(studentId) ? new ObjectId(studentId) : studentId
    }).toArray();
    
    res.json({
      success: true,
      count: customizedAssessments.length,
      customizedAssessments
    });
  } catch (error) {
    console.error('Error fetching customized assessments by student:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

/**
 * Update a customized assessment
 * @route PUT /api/customized-assessment/:id
 */
exports.updateCustomizedAssessment = async (req, res) => {
  try {
    const { id } = req.params;
    const { questions, title, description } = req.body;
    
    if (!id) {
      return res.status(400).json({ 
        success: false, 
        message: 'Assessment ID is required' 
      });
    }
    
    if (!questions || !Array.isArray(questions)) {
      return res.status(400).json({ 
        success: false, 
        message: 'Questions array is required' 
      });
    }
    
    const testDb = getTestDb();
    const customizedAssessmentsCollection = testDb.collection('customized_assessments');
    
    // Find the assessment to update
    const filter = {
      $or: [
        { _id: mongoose.Types.ObjectId.isValid(id) ? new ObjectId(id) : null },
        { assessmentId: id }
      ].filter(q => q !== null)
    };
    
    // Update fields
    const updateData = {
      $set: {
        questions,
        updatedAt: new Date()
      }
    };
    
    if (title) updateData.$set.title = title;
    if (description) updateData.$set.description = description;
    
    const result = await customizedAssessmentsCollection.findOneAndUpdate(
      filter,
      updateData,
      { returnDocument: 'after' }
    );
    
    if (!result.value) {
      return res.status(404).json({ 
        success: false, 
        message: 'Customized assessment not found' 
      });
    }
    
    res.json({
      success: true,
      message: 'Customized assessment updated successfully',
      customizedAssessment: result.value
    });
  } catch (error) {
    console.error('Error updating customized assessment:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

/**
 * Delete a customized assessment
 * @route DELETE /api/customized-assessment/:id
 */
exports.deleteCustomizedAssessment = async (req, res) => {
  try {
    const { id } = req.params;
    
    if (!id) {
      return res.status(400).json({ 
        success: false, 
        message: 'Assessment ID is required' 
      });
    }
    
    const testDb = getTestDb();
    const customizedAssessmentsCollection = testDb.collection('customized_assessments');
    
    // Find and delete
    const result = await customizedAssessmentsCollection.deleteOne({
      $or: [
        { _id: mongoose.Types.ObjectId.isValid(id) ? new ObjectId(id) : null },
        { assessmentId: id }
      ].filter(q => q !== null)
    });
    
    if (result.deletedCount === 0) {
      return res.status(404).json({ 
        success: false, 
        message: 'Customized assessment not found' 
      });
    }
    
    res.json({
      success: true,
      message: 'Customized assessment deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting customized assessment:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

/**
 * Add a question to customized assessment
 * @route POST /api/customized-assessment/:id/question
 */
exports.addQuestion = async (req, res) => {
  try {
    const { id } = req.params;
    const { question } = req.body;
    
    if (!id) {
      return res.status(400).json({ 
        success: false, 
        message: 'Assessment ID is required' 
      });
    }
    
    if (!question) {
      return res.status(400).json({ 
        success: false, 
        message: 'Question data is required' 
      });
    }
    
    const testDb = getTestDb();
    const customizedAssessmentsCollection = testDb.collection('customized_assessments');
    
    // Find the assessment
    const customizedAssessment = await customizedAssessmentsCollection.findOne({
      $or: [
        { _id: mongoose.Types.ObjectId.isValid(id) ? new ObjectId(id) : null },
        { assessmentId: id }
      ].filter(q => q !== null)
    });
    
    if (!customizedAssessment) {
      return res.status(404).json({ 
        success: false, 
        message: 'Customized assessment not found' 
      });
    }
    
    // Generate a new question ID
    const existingIds = (customizedAssessment.questions || []).map(q => 
      typeof q.questionId === 'number' ? q.questionId : 0
    );
    const maxId = Math.max(...existingIds, 0);
    const newQuestionId = maxId + 1;
    
    // Add the new question
    const newQuestion = {
      ...question,
      questionId: newQuestionId
    };
    
    const result = await customizedAssessmentsCollection.findOneAndUpdate(
      { _id: customizedAssessment._id },
      { 
        $push: { questions: newQuestion },
        $set: { updatedAt: new Date() }
      },
      { returnDocument: 'after' }
    );
    
    res.json({
      success: true,
      message: 'Question added successfully',
      question: newQuestion,
      customizedAssessment: result.value
    });
  } catch (error) {
    console.error('Error adding question to customized assessment:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

/**
 * Update a question in customized assessment
 * @route PUT /api/customized-assessment/:id/question/:questionId
 */
exports.updateQuestion = async (req, res) => {
  try {
    const { id, questionId } = req.params;
    const { question } = req.body;
    
    if (!id || !questionId) {
      return res.status(400).json({ 
        success: false, 
        message: 'Assessment ID and Question ID are required' 
      });
    }
    
    if (!question) {
      return res.status(400).json({ 
        success: false, 
        message: 'Question data is required' 
      });
    }
    
    const testDb = getTestDb();
    const customizedAssessmentsCollection = testDb.collection('customized_assessments');
    
    // Find the assessment
    const customizedAssessment = await customizedAssessmentsCollection.findOne({
      $or: [
        { _id: mongoose.Types.ObjectId.isValid(id) ? new ObjectId(id) : null },
        { assessmentId: id }
      ].filter(q => q !== null)
    });
    
    if (!customizedAssessment) {
      return res.status(404).json({ 
        success: false, 
        message: 'Customized assessment not found' 
      });
    }
    
    // Find the question index
    const questionIdToFind = parseInt(questionId) || questionId;
    const questions = customizedAssessment.questions || [];
    const questionIndex = questions.findIndex(q => 
      q.questionId === questionIdToFind || q.questionId?.toString() === questionId.toString()
    );
    
    if (questionIndex === -1) {
      return res.status(404).json({ 
        success: false, 
        message: 'Question not found in this assessment' 
      });
    }
    
    // Update the question at the found index
    const updatedQuestions = [...questions];
    updatedQuestions[questionIndex] = {
      ...updatedQuestions[questionIndex],
      ...question,
      questionId: questionIdToFind // Preserve original ID
    };
    
    const result = await customizedAssessmentsCollection.findOneAndUpdate(
      { _id: customizedAssessment._id },
      { 
        $set: { 
          questions: updatedQuestions,
          updatedAt: new Date()
        }
      },
      { returnDocument: 'after' }
    );
    
    res.json({
      success: true,
      message: 'Question updated successfully',
      question: updatedQuestions[questionIndex],
      customizedAssessment: result.value
    });
  } catch (error) {
    console.error('Error updating question in customized assessment:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

/**
 * Remove a question from customized assessment
 * @route DELETE /api/customized-assessment/:id/question/:questionId
 */
exports.removeQuestion = async (req, res) => {
  try {
    const { id, questionId } = req.params;
    
    if (!id || !questionId) {
      return res.status(400).json({ 
        success: false, 
        message: 'Assessment ID and Question ID are required' 
      });
    }
    
    const testDb = getTestDb();
    const customizedAssessmentsCollection = testDb.collection('customized_assessments');
    
    // Find the assessment
    const customizedAssessment = await customizedAssessmentsCollection.findOne({
      $or: [
        { _id: mongoose.Types.ObjectId.isValid(id) ? new ObjectId(id) : null },
        { assessmentId: id }
      ].filter(q => q !== null)
    });
    
    if (!customizedAssessment) {
      return res.status(404).json({ 
        success: false, 
        message: 'Customized assessment not found' 
      });
    }
    
    // Parse the question ID
    const questionIdToFind = parseInt(questionId) || questionId;
    
    // Filter out the question
    const updatedQuestions = (customizedAssessment.questions || []).filter(q => 
      q.questionId !== questionIdToFind && q.questionId?.toString() !== questionId.toString()
    );
    
    if (updatedQuestions.length === customizedAssessment.questions.length) {
      return res.status(404).json({ 
        success: false, 
        message: 'Question not found in this assessment' 
      });
    }
    
    const result = await customizedAssessmentsCollection.findOneAndUpdate(
      { _id: customizedAssessment._id },
      { 
        $set: { 
          questions: updatedQuestions,
          updatedAt: new Date()
        }
      },
      { returnDocument: 'after' }
    );
    
    res.json({
      success: true,
      message: 'Question removed successfully',
      customizedAssessment: result.value
    });
  } catch (error) {
    console.error('Error removing question from customized assessment:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

/**
 * Get template questions for building customized assessments
 * @route GET /api/customized-assessment/templates/:categoryId
 */
exports.getTemplateQuestions = async (req, res) => {
  try {
    const { categoryId } = req.params;
    const { readingLevel } = req.query;
    
    if (!categoryId) {
      return res.status(400).json({ 
        success: false, 
        message: 'Category ID is required' 
      });
    }
    
    const testDb = getTestDb();
    const mainAssessmentCollection = testDb.collection('main_assessment');
    
    // Build filter
    const filter = {
      categoryID: parseInt(categoryId),
      isPublished: true,
      status: 'active'
    };
    
    if (readingLevel) {
      filter.targetReadingLevel = readingLevel;
    }
    
    // Find all assessments that match the criteria
    const assessments = await mainAssessmentCollection.find(filter).toArray();
    
    // Extract all questions with metadata about which assessment they came from
    const templateQuestions = [];
    
    assessments.forEach(assessment => {
      const assessmentQuestions = assessment.questions || [];
      assessmentQuestions.forEach(question => {
        templateQuestions.push({
          assessmentId: assessment.assessmentId,
          assessmentTitle: assessment.title,
          question: {
            ...question,
            originalAssessmentId: assessment.assessmentId,
            originalQuestionId: question.questionId
          }
        });
      });
    });
    
    res.json({
      success: true,
      count: templateQuestions.length,
      templateQuestions
    });
  } catch (error) {
    console.error('Error fetching template questions:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

/**
 * Clone a question from the template bank with a new content reference
 * @route POST /api/customized-assessment/clone-question
 */
// controllers/Teachers/ManageProgress/customizedAssessmentController.js
// Update or add this method for clarity:

exports.cloneTemplateQuestion = async (req, res) => {
    try {
      const { originalAssessmentId, originalQuestionId, newContentReference } = req.body;
      
      if (!originalAssessmentId || !originalQuestionId) {
        return res.status(400).json({ 
          success: false, 
          message: 'Original assessment ID and question ID are required' 
        });
      }
      
      const testDb = getTestDb();
      const mainAssessmentCollection = testDb.collection('main_assessment');
      
      // Find the original assessment
      let originalAssessment;
      try {
        if (mongoose.Types.ObjectId.isValid(originalAssessmentId)) {
          originalAssessment = await mainAssessmentCollection.findOne({
            _id: new ObjectId(originalAssessmentId)
          });
        }
        
        if (!originalAssessment) {
          originalAssessment = await mainAssessmentCollection.findOne({
            assessmentId: originalAssessmentId
          });
        }
      } catch (error) {
        console.error("Error finding original assessment:", error);
        return res.status(500).json({ 
          success: false, 
          message: 'Error finding original assessment' 
        });
      }
      
      if (!originalAssessment) {
        return res.status(404).json({ 
          success: false, 
          message: 'Original assessment not found' 
        });
      }
      
      // Find the original question
      const originalQuestion = (originalAssessment.questions || []).find(q => 
        q.questionId == originalQuestionId || q.questionId?.toString() === originalQuestionId.toString()
      );
      
      if (!originalQuestion) {
        return res.status(404).json({ 
          success: false, 
          message: 'Original question not found' 
        });
      }
      
      // Clone the question
      const clonedQuestion = {
        ...originalQuestion,
        originalQuestionId: originalQuestion.questionId,
        originalContentReference: originalQuestion.contentReference,
        questionId: Date.now().toString(), // Generate a new ID
      };
      
      // Apply new content reference if provided
      if (newContentReference && newContentReference.collection && newContentReference.contentId) {
        clonedQuestion.contentReference = newContentReference;
      }
      
      res.json({
        success: true,
        clonedQuestion
      });
    } catch (error) {
      console.error("Error cloning template question:", error);
      res.status(500).json({ 
        success: false, 
        message: 'Server error', 
        error: error.message 
      });
    }
  };