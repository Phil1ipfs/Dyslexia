const mongoose = require('mongoose');
const MainAssessment = require('../../models/Teachers/mainAssessmentModel');
const gcsStorage = require('../../utils/gcsStorage'); // question images go to GCS

// Upload any base64 (data:image) question images to GCS and replace them with the
// public storage URL, so create/update persists a real URL in MongoDB instead of a
// huge base64 blob. Already-http(s) URLs are left untouched.
async function processQuestionImages(questions) {
  if (!Array.isArray(questions)) return questions;
  for (const question of questions) {
    const img = question && question.questionImage;
    if (img && typeof img === 'string' && img.startsWith('data:image')) {
      try {
        const matches = img.match(/^data:([A-Za-z-+\/]+);base64,(.+)$/);
        if (!matches || matches.length !== 3) continue;
        const mimeType = matches[1];
        const buffer = Buffer.from(matches[2], 'base64');
        const fileExt = (mimeType.split('/')[1] || 'png').split('+')[0];
        const key = `main-assessment/images/${question.questionId || 'q'}_${Date.now()}.${fileExt}`;
        question.questionImage = await gcsStorage.uploadBuffer(buffer, key, mimeType);
        console.log(`[MAIN-ASSESSMENT] Uploaded question image to GCS: ${question.questionImage}`);
      } catch (err) {
        console.error(`[MAIN-ASSESSMENT] Failed to upload image for question ${question && question.questionId}:`, err.message);
      }
    }
  }
  return questions;
}

// Helper to get database collections
const getMainAssessmentCollection = () => {
  const testDb = mongoose.connection.useDb('test');
  return testDb.collection('main_assessment');
};

const getResponsesCollection = () => {
  const testDb = mongoose.connection.useDb('test');
  return testDb.collection('student_responses');
};

/**
 * Get all assessments with pagination and filtering
 */
exports.getAllAssessments = async (req, res) => {
  try {
    const { page = 1, limit = 10, readingLevel, category, status } = req.query;
    
    // Build filter object
    const filter = {};
    if (readingLevel) filter.readingLevel = readingLevel;
    if (category) filter.category = category;
    if (status) filter.status = status;
    
    // Convert page and limit to numbers
    const pageNum = parseInt(page);
    const limitNum = parseInt(limit);
    const skip = (pageNum - 1) * limitNum;
    
    // Get main_assessment collection
    const mainAssessmentCollection = getMainAssessmentCollection();
    
    // Execute query with pagination
    const assessments = await mainAssessmentCollection
      .find(filter)
      .sort({ readingLevel: 1, category: 1, createdAt: -1 })
      .skip(skip)
      .limit(limitNum)
      .toArray();
    
    // Get total count for pagination
    const total = await mainAssessmentCollection.countDocuments(filter);
    
    return res.status(200).json({
      success: true,
      data: assessments,
      pagination: {
        total,
        page: pageNum,
        limit: limitNum,
        pages: Math.ceil(total / limitNum)
      }
    });
  } catch (error) {
    console.error('Error getting assessments:', error);
    return res.status(500).json({
      success: false,
      message: 'Error retrieving assessments',
      error: error.message
    });
  }
};

/**
 * Get assessment by ID
 */
exports.getAssessmentById = async (req, res) => {
  try {
    const { id } = req.params;
    
    // Get main_assessment collection
    const mainAssessmentCollection = getMainAssessmentCollection();
    
    // Find assessment by ID
    const assessment = await mainAssessmentCollection.findOne({
      _id: new mongoose.Types.ObjectId(id)
    });
    
    if (!assessment) {
      return res.status(404).json({
        success: false,
        message: 'Assessment not found'
      });
    }
    
    return res.status(200).json({
      success: true,
      data: assessment
    });
  } catch (error) {
    console.error('Error getting assessment:', error);
    return res.status(500).json({
      success: false,
      message: 'Error retrieving assessment',
      error: error.message
    });
  }
};

/**
 * Get questions by reading level and category
 */
exports.getQuestionsByLevelAndCategory = async (req, res) => {
  try {
    const { readingLevel, category } = req.params;
    
    // Validate reading level and category
    const validReadingLevels = ['Low Emerging', 'High Emerging', 'Developing', 'Transitioning', 'At Grade Level'];
    const validCategories = ['Alphabet Knowledge', 'Phonological Awareness', 'Decoding', 'Word Recognition', 'Reading Comprehension'];
    
    if (!validReadingLevels.includes(readingLevel)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid reading level'
      });
    }
    
    if (!validCategories.includes(category)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid category'
      });
    }
    
    // Get main_assessment collection
    const mainAssessmentCollection = getMainAssessmentCollection();
    
    // Find assessment for this reading level and category
    const assessment = await mainAssessmentCollection.findOne({
      readingLevel,
      category,
      status: 'active',
      isActive: true
    });
    
    if (!assessment) {
      return res.status(404).json({
        success: false,
        message: 'No active assessment found for this reading level and category'
      });
    }
    
    return res.status(200).json({
      success: true,
      data: {
        _id: assessment._id,
        readingLevel: assessment.readingLevel,
        category: assessment.category,
        questionType: assessment.questionType,
        questions: assessment.questions
      }
    });
  } catch (error) {
    console.error('Error getting questions:', error);
    return res.status(500).json({
      success: false,
      message: 'Error retrieving questions',
      error: error.message
    });
  }
};

/**
 * Get student responses for analysis
 */
exports.getStudentResponses = async (req, res) => {
  try {
    const { studentId } = req.params;
    const { category, readingLevel } = req.query;
    
    // Build filter
    const filter = { studentId: parseInt(studentId) };
    if (category) filter.category = category;
    if (readingLevel) filter.readingLevel = readingLevel;
    
    // Get responses collection
    const responsesCollection = getResponsesCollection();
    
    // Get student responses
    const responses = await responsesCollection
      .find(filter)
      .sort({ answeredAt: 1 })
      .toArray();
    
    return res.status(200).json({
      success: true,
      count: responses.length,
      data: responses
    });
  } catch (error) {
    console.error('Error getting student responses:', error);
    return res.status(500).json({
      success: false,
      message: 'Error retrieving student responses',
      error: error.message
    });
  }
};

/**
 * Get student results with answer analysis
 */
exports.getStudentResults = async (req, res) => {
  try {
    const { studentId, category } = req.params;
    
    // Get responses collection
    const responsesCollection = getResponsesCollection();
    const mainAssessmentCollection = getMainAssessmentCollection();
    
    // Get student responses for this category
    const responses = await responsesCollection
      .find({ 
        studentId: parseInt(studentId), 
        category 
      })
      .sort({ answeredAt: 1 })
      .toArray();
    
    if (responses.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'No responses found for this student and category'
      });
    }
    
    // Get the assessment questions to compare answers
    const readingLevel = responses[0].readingLevel;
    const assessment = await mainAssessmentCollection.findOne({
      readingLevel,
      category,
      status: 'active'
    });
    
    if (!assessment) {
      return res.status(404).json({
        success: false,
        message: 'Assessment not found'
      });
    }
    
    // Analyze responses against correct answers
    const analysisResults = responses.map(response => {
      const question = assessment.questions.find(q => q.questionId === response.questionId);
      if (!question) {
        return {
          ...response,
          analysis: { error: 'Question not found' }
        };
      }
      
      return {
        ...response,
        question: question,
        analysis: analyzeResponse(response, question)
      };
    });
    
    // Calculate summary statistics
    const totalQuestions = analysisResults.length;
    const correctAnswers = analysisResults.filter(r => r.isCorrect).length;
    const accuracy = totalQuestions > 0 ? (correctAnswers / totalQuestions) * 100 : 0;
    const averageResponseTime = totalQuestions > 0 
      ? analysisResults.reduce((sum, r) => sum + r.responseTime, 0) / totalQuestions 
      : 0;
    
    return res.status(200).json({
      success: true,
      data: {
        studentId: parseInt(studentId),
        category,
        readingLevel,
        summary: {
          totalQuestions,
          correctAnswers,
          accuracy: Math.round(accuracy * 100) / 100,
          averageResponseTime: Math.round(averageResponseTime * 100) / 100
        },
        responses: analysisResults
      }
    });
  } catch (error) {
    console.error('Error getting student results:', error);
    return res.status(500).json({
      success: false,
      message: 'Error retrieving student results',
      error: error.message
    });
  }
};

/**
 * Get student progress across all categories
 */
exports.getStudentProgress = async (req, res) => {
  try {
    const { studentId } = req.params;
    
    // Get responses collection
    const responsesCollection = getResponsesCollection();
    
    // Get all responses for this student grouped by category
    const responses = await responsesCollection
      .find({ studentId: parseInt(studentId) })
      .toArray();
    
    if (responses.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'No responses found for this student'
      });
    }
    
    // Group responses by category
    const categorySummary = {};
    const readingLevel = responses[0].readingLevel;
    
    responses.forEach(response => {
      const category = response.category;
      if (!categorySummary[category]) {
        categorySummary[category] = {
          totalQuestions: 0,
          correctAnswers: 0,
          totalTime: 0,
          responses: []
        };
      }
      
      categorySummary[category].totalQuestions++;
      if (response.isCorrect) {
        categorySummary[category].correctAnswers++;
      }
      categorySummary[category].totalTime += response.responseTime;
      categorySummary[category].responses.push(response);
    });
    
    // Calculate percentages and averages
    Object.keys(categorySummary).forEach(category => {
      const summary = categorySummary[category];
      summary.accuracy = summary.totalQuestions > 0 
        ? Math.round((summary.correctAnswers / summary.totalQuestions) * 10000) / 100 
        : 0;
      summary.averageTime = summary.totalQuestions > 0 
        ? Math.round((summary.totalTime / summary.totalQuestions) * 100) / 100 
        : 0;
    });
    
    return res.status(200).json({
      success: true,
      data: {
        studentId: parseInt(studentId),
        readingLevel,
        overallSummary: {
          totalQuestions: responses.length,
          correctAnswers: responses.filter(r => r.isCorrect).length,
          totalCategories: Object.keys(categorySummary).length,
          overallAccuracy: Math.round((responses.filter(r => r.isCorrect).length / responses.length) * 10000) / 100
        },
        categorySummary
      }
    });
  } catch (error) {
    console.error('Error getting student progress:', error);
    return res.status(500).json({
      success: false,
      message: 'Error retrieving student progress',
      error: error.message
    });
  }
};

/**
 * Create a new assessment
 */
exports.createAssessment = async (req, res) => {
  try {
    console.log('[CREATE ASSESSMENT] Request received:', JSON.stringify(req.body, null, 2));
    
    const assessmentData = req.body;
    
    // Automatically set questionType based on category
    const questionTypeMap = {
      'Alphabet Knowledge': 'multiple_choice',
      'Phonological Awareness': 'matching',
      'Decoding': 'drag_drop',
      'Word Recognition': 'fill_blank',
      'Reading Comprehension': 'text_input'
    };
    
    assessmentData.questionType = questionTypeMap[assessmentData.category];
    
    // Ensure status is always 'active' and isActive is true
    assessmentData.status = 'active';
    assessmentData.isActive = true;
    
    // Validate using Mongoose model
    try {
      const mainAssessment = new MainAssessment(assessmentData);
      await mainAssessment.validate();
    } catch (validationError) {
      console.error('[CREATE ASSESSMENT] Validation error:', validationError);
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        error: validationError.message
      });
    }
    
    // Get main_assessment collection
    const mainAssessmentCollection = getMainAssessmentCollection();
    
    // Check if assessment for this reading level and category already exists
    const existing = await mainAssessmentCollection.findOne({
      readingLevel: assessmentData.readingLevel,
      category: assessmentData.category
    });
    
    if (existing) {
      return res.status(400).json({
        success: false,
        message: 'An assessment for this reading level and category already exists'
      });
    }
    
    // Ensure each question has proper questionId - no need to set category as it's already at assessment level
    const categoryPrefix = getCategoryPrefix(assessmentData.category);
    assessmentData.questions.forEach((question, index) => {
      const questionNumber = String(index + 1).padStart(3, '0');
      question.questionId = `${categoryPrefix}_${questionNumber}`;
      // Remove duplicated category field from individual questions
      delete question.category;
    });
    
    // Upload any embedded (base64) question images to GCS before saving
    await processQuestionImages(assessmentData.questions);

    // Set timestamps
    assessmentData.createdAt = new Date();
    assessmentData.updatedAt = new Date();

    // Insert into collection
    const result = await mainAssessmentCollection.insertOne(assessmentData);
    
    return res.status(201).json({
      success: true,
      message: 'Assessment created successfully',
      data: {
        _id: result.insertedId,
        ...assessmentData
      }
    });
  } catch (error) {
    console.error('[CREATE ASSESSMENT] Error:', error);
    return res.status(500).json({
      success: false,
      message: 'Error creating assessment',
      error: error.message
    });
  }
};

/**
 * Update an existing assessment
 */
exports.updateAssessment = async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = req.body;
    
    // Cannot update readingLevel and category
    if (updateData.readingLevel || updateData.category) {
      return res.status(400).json({
        success: false,
        message: 'Cannot update reading level or category of an existing assessment'
      });
    }
    
    // Automatically set questionType based on category if updating
    const questionTypeMap = {
      'Alphabet Knowledge': 'multiple_choice',
      'Phonological Awareness': 'matching',
      'Decoding': 'drag_drop',
      'Word Recognition': 'fill_blank',
      'Reading Comprehension': 'text_input'
    };
    
    // Get main_assessment collection
    const mainAssessmentCollection = getMainAssessmentCollection();
    
    // Find the existing assessment
    const existing = await mainAssessmentCollection.findOne({
      _id: new mongoose.Types.ObjectId(id)
    });
    
    if (!existing) {
      return res.status(404).json({
        success: false,
        message: 'Assessment not found'
      });
    }
    
    // Set questionType based on existing category
    updateData.questionType = questionTypeMap[existing.category];
    
    // Ensure status remains 'active' and isActive is true
    updateData.status = 'active';
    updateData.isActive = true;
    
    // If questions are being updated, ensure proper questionIds - no duplicated category
    if (updateData.questions) {
      const categoryPrefix = getCategoryPrefix(existing.category);
      updateData.questions.forEach((question, index) => {
        const questionNumber = String(index + 1).padStart(3, '0');
        question.questionId = `${categoryPrefix}_${questionNumber}`;
        // Remove duplicated category field from individual questions
        delete question.category;
      });

      // Upload any embedded (base64) question images to GCS before saving
      await processQuestionImages(updateData.questions);
    }

    // Update timestamps
    updateData.updatedAt = new Date();
    
    // Update in collection
    const result = await mainAssessmentCollection.updateOne(
      { _id: new mongoose.Types.ObjectId(id) },
      { $set: updateData }
    );
    
    if (result.matchedCount === 0) {
      return res.status(404).json({
        success: false,
        message: 'Assessment not found'
      });
    }
    
    // Get updated assessment
    const updated = await mainAssessmentCollection.findOne({
      _id: new mongoose.Types.ObjectId(id)
    });
    
    return res.status(200).json({
      success: true,
      message: 'Assessment updated successfully',
      data: updated
    });
  } catch (error) {
    console.error('Error updating assessment:', error);
    return res.status(500).json({
      success: false,
      message: 'Error updating assessment',
      error: error.message
    });
  }
};

/**
 * Delete an assessment
 */
exports.deleteAssessment = async (req, res) => {
  try {
    const { id } = req.params;
    
    // Get main_assessment collection
    const mainAssessmentCollection = getMainAssessmentCollection();
    
    // Find and delete assessment
    const result = await mainAssessmentCollection.deleteOne({
      _id: new mongoose.Types.ObjectId(id)
    });
    
    if (result.deletedCount === 0) {
      return res.status(404).json({
        success: false,
        message: 'Assessment not found'
      });
    }
    
    return res.status(200).json({
      success: true,
      message: 'Assessment deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting assessment:', error);
    return res.status(500).json({
      success: false,
      message: 'Error deleting assessment',
      error: error.message
    });
  }
};

/**
 * Toggle assessment status (active/inactive)
 */
exports.toggleAssessmentStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    
    if (!status || !['active', 'draft', 'inactive'].includes(status)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid status. Must be active, draft, or inactive'
      });
    }
    
    // Get main_assessment collection
    const mainAssessmentCollection = getMainAssessmentCollection();
    
    // Update status
    const result = await mainAssessmentCollection.updateOne(
      { _id: new mongoose.Types.ObjectId(id) },
      { 
        $set: { 
          status,
          isActive: status === 'active',
          updatedAt: new Date()
        }
      }
    );
    
    if (result.matchedCount === 0) {
      return res.status(404).json({
        success: false,
        message: 'Assessment not found'
      });
    }
    
    return res.status(200).json({
      success: true,
      message: `Assessment status updated to ${status}`
    });
  } catch (error) {
    console.error('Error updating assessment status:', error);
    return res.status(500).json({
      success: false,
      message: 'Error updating assessment status',
      error: error.message
    });
  }
};

/**
 * Helper function to analyze student response against correct answer
 */
function analyzeResponse(response, question) {
  const analysis = {
    isCorrect: response.isCorrect,
    responseTime: response.responseTime,
    difficulty: 'normal'
  };
  
  switch (response.category) {
    case 'Alphabet Knowledge':
      const correctOption = question.choiceOptions.find(opt => opt.isCorrect);
      analysis.correctAnswer = correctOption ? correctOption.optionId : 'Unknown';
      analysis.studentAnswer = response.response[0];
      analysis.explanation = response.isCorrect 
        ? 'Correct letter identification' 
        : `Incorrect. Correct answer is option ${analysis.correctAnswer}`;
      break;
      
    case 'Phonological Awareness':
      analysis.correctPairs = question.questionSet.correctPairs;
      analysis.studentPairs = response.response;
      analysis.correctMatches = response.correctMatches || 0;
      analysis.totalMatches = response.totalMatches || 0;
      analysis.explanation = `Matched ${analysis.correctMatches} out of ${analysis.totalMatches} pairs correctly`;
      break;
      
    case 'Decoding':
      analysis.correctSequence = question.correctSequence;
      analysis.studentSequence = response.response;
      analysis.explanation = response.isCorrect 
        ? 'Correct letter arrangement' 
        : `Incorrect sequence. Correct: ${analysis.correctSequence.join('')}`;
      break;
      
    case 'Word Recognition':
      analysis.correctAnswers = question.correctAnswer;
      analysis.studentAnswer = response.response;
      analysis.explanation = response.isCorrect 
        ? 'Correct word/syllable recognition' 
        : `Incorrect. Correct answer(s): ${analysis.correctAnswers.join(', ')}`;
      break;
      
    case 'Reading Comprehension':
      analysis.correctAnswer = question.questionText; // This might need adjustment based on actual structure
      analysis.acceptableAnswers = question.acceptableAnswers || [];
      analysis.studentAnswer = response.response[0];
      analysis.explanation = response.isCorrect 
        ? 'Correct comprehension answer' 
        : 'Incorrect comprehension answer';
      break;
  }
  
  // Determine difficulty based on response time
  if (response.responseTime > 30) {
    analysis.difficulty = 'challenging';
  } else if (response.responseTime < 10) {
    analysis.difficulty = 'easy';
  }
  
  return analysis;
}

/**
 * Helper function to get category prefix
 */
function getCategoryPrefix(category) {
  const prefixMap = {
    'Alphabet Knowledge': 'AK',
    'Phonological Awareness': 'PA',
    'Decoding': 'DC',
    'Word Recognition': 'WR',
    'Reading Comprehension': 'RC'
  };
  
  return prefixMap[category];
}