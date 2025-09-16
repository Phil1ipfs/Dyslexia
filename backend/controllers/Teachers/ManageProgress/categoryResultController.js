// controllers/Teachers/ManageProgress/categoryResultController.js
const mongoose = require('mongoose');
const CategoryResultsService = require('../../../services/Teachers/CategoryResultsService');

/**
 * Controller for automatic category result processing
 * Processes student_responses into category_results and triggers prescriptive analysis
 */

/**
 * Automatically generate category results for a student based on their responses
 * This should be called when a student completes their main assessment
 */
const generateCategoryResults = async (req, res) => {
  try {
    const { studentId } = req.params;
    const { force = false } = req.query; // Force regeneration even if exists

    // Convert studentId to integer to match database format
    const studentIdInt = parseInt(studentId);
    if (isNaN(studentIdInt)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid studentId. Must be a valid integer.'
      });
    }

    console.log(`[CATEGORY RESULTS] Generating category results for student: ${studentIdInt}, force: ${force}`);

    // Check if category results already exist (unless forcing)
    if (!force) {
      const existingResults = await CategoryResultsService.getCategoryResults(studentIdInt);
      if (existingResults && existingResults.length > 0) {
        return res.status(200).json({
          success: true,
          message: 'Category results already exist for this student',
          data: existingResults,
          note: 'Use force=true to regenerate'
        });
      }
    }

    // Get student information
    const testDb = mongoose.connection.useDb('test');
    const usersCollection = testDb.collection('users');

    const student = await usersCollection.findOne({
      $or: [
        { idNumber: studentIdInt },
        { studentId: studentIdInt }
      ]
    });

    if (!student) {
      return res.status(404).json({
        success: false,
        message: `Student ${studentIdInt} not found`
      });
    }

    const readingLevel = student.readingLevel || 'High Emerging';
    console.log(`[CATEGORY RESULTS] Student: ${student.firstName} ${student.lastName}, Reading Level: ${readingLevel}`);

    // Get all student responses
    const studentResponsesCollection = testDb.collection('student_responses');
    const responses = await studentResponsesCollection
      .find({ studentId: studentIdInt })
      .sort({ answeredAt: 1 })
      .toArray();

    if (responses.length === 0) {
      return res.status(404).json({
        success: false,
        message: `No responses found for student ${studentIdInt}`
      });
    }

    console.log(`[CATEGORY RESULTS] Found ${responses.length} responses`);

    // Group responses by category
    const categorizedResponses = {};
    responses.forEach(response => {
      if (!categorizedResponses[response.category]) {
        categorizedResponses[response.category] = [];
      }
      categorizedResponses[response.category].push(response);
    });

    const categories = Object.keys(categorizedResponses);
    console.log(`[CATEGORY RESULTS] Categories found: ${categories.join(', ')}`);

    // Process each category
    const categoryResults = [];

    for (const [categoryName, categoryResponses] of Object.entries(categorizedResponses)) {
      console.log(`[CATEGORY RESULTS] Processing ${categoryName}...`);

      let categoryResult;

      if (categoryName === 'Phonological Awareness') {
        // Special handling for matching questions
        categoryResult = processPhonologicalAwareness(categoryName, categoryResponses);
      } else if (categoryName === 'Reading Comprehension') {
        // Special handling for all-or-nothing sentence questions
        categoryResult = processReadingComprehension(categoryName, categoryResponses);
      } else {
        // Standard processing for other categories
        categoryResult = processStandardCategory(categoryName, categoryResponses);
      }

      categoryResults.push(categoryResult);

      const status = categoryResult.isPassed ? 'PASSED' : 'FAILED';
      console.log(`[CATEGORY RESULTS] ${categoryName}: ${categoryResult.score}% (${status})`);
    }

    // Create category_results document
    const categoryResultData = {
      studentId: studentIdInt,
      assessmentDate: new Date(responses[responses.length - 1].answeredAt),
      readingLevel: readingLevel,
      categories: categoryResults
    };

    console.log(`[CATEGORY RESULTS] Creating category results and triggering prescriptive analysis...`);

    // Use the service to create category_results (this will auto-trigger prescriptive analysis)
    const savedCategoryResult = await CategoryResultsService.createCategoryResult(categoryResultData);

    // Calculate weighted overall score
    const overallScore = calculateWeightedScore(categoryResults, readingLevel);

    console.log(`[CATEGORY RESULTS] Successfully created category results!`);
    console.log(`[CATEGORY RESULTS] Category Results ID: ${savedCategoryResult._id}`);
    if (savedCategoryResult.prescriptiveAnalysisId) {
      console.log(`[CATEGORY RESULTS] Prescriptive Analysis ID: ${savedCategoryResult.prescriptiveAnalysisId}`);
    }

    // Return success response
    res.json({
      success: true,
      message: 'Category results and prescriptive analysis generated successfully',
      data: {
        categoryResultId: savedCategoryResult._id,
        prescriptiveAnalysisId: savedCategoryResult.prescriptiveAnalysisId,
        studentInfo: {
          studentId: studentIdInt,
          name: `${student.firstName} ${student.lastName}`,
          readingLevel: readingLevel
        },
        summary: {
          totalResponses: responses.length,
          categoriesProcessed: categories.length,
          overallScore: overallScore,
          categoryScores: categoryResults.map(cat => ({
            category: cat.categoryName,
            score: cat.score,
            passed: cat.isPassed
          }))
        },
        interventionRequired: categoryResults.some(cat => cat.interventionRequired)
      }
    });

  } catch (error) {
    console.error('[CATEGORY RESULTS] Error generating category results:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to generate category results',
      error: error.message
    });
  }
};

/**
 * Check if a student is ready for category result generation
 * Based on completed responses for their reading level
 */
const checkAssessmentCompletionStatus = async (req, res) => {
  try {
    const { studentId } = req.params;

    const studentIdInt = parseInt(studentId);
    if (isNaN(studentIdInt)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid studentId. Must be a valid integer.'
      });
    }

    // Get student info
    const testDb = mongoose.connection.useDb('test');
    const usersCollection = testDb.collection('users');

    const student = await usersCollection.findOne({
      $or: [
        { idNumber: studentIdInt },
        { studentId: studentIdInt }
      ]
    });

    if (!student) {
      return res.status(404).json({
        success: false,
        message: `Student ${studentIdInt} not found`
      });
    }

    const readingLevel = student.readingLevel || 'High Emerging';

    // Define expected categories by reading level
    const expectedCategories = {
      'Low Emerging': ['Alphabet Knowledge'],
      'High Emerging': ['Alphabet Knowledge', 'Phonological Awareness'],
      'Developing': ['Alphabet Knowledge', 'Phonological Awareness', 'Decoding'],
      'Transitioning': ['Alphabet Knowledge', 'Phonological Awareness', 'Decoding', 'Word Recognition'],
      'At Grade Level': ['Alphabet Knowledge', 'Phonological Awareness', 'Decoding', 'Word Recognition', 'Reading Comprehension']
    };

    const requiredCategories = expectedCategories[readingLevel] || [];

    // Get student responses and check completeness
    const studentResponsesCollection = testDb.collection('student_responses');
    const responses = await studentResponsesCollection
      .find({ studentId: studentIdInt })
      .toArray();

    // Group by category
    const responsesByCategory = {};
    responses.forEach(response => {
      if (!responsesByCategory[response.category]) {
        responsesByCategory[response.category] = [];
      }
      responsesByCategory[response.category].push(response);
    });

    const completedCategories = Object.keys(responsesByCategory);
    const missingCategories = requiredCategories.filter(cat => !completedCategories.includes(cat));

    // Check if assessment is complete
    const isComplete = missingCategories.length === 0;

    // Check if category results already exist
    const existingResults = await CategoryResultsService.getCategoryResults(studentIdInt);
    const hasExistingResults = existingResults && existingResults.length > 0;

    res.json({
      success: true,
      data: {
        studentInfo: {
          studentId: studentIdInt,
          name: `${student.firstName} ${student.lastName}`,
          readingLevel: readingLevel
        },
        assessmentStatus: {
          isComplete: isComplete,
          hasExistingResults: hasExistingResults,
          readyForProcessing: isComplete && !hasExistingResults
        },
        categories: {
          required: requiredCategories,
          completed: completedCategories,
          missing: missingCategories
        },
        responseStats: {
          totalResponses: responses.length,
          byCategory: Object.keys(responsesByCategory).map(cat => ({
            category: cat,
            responseCount: responsesByCategory[cat].length
          }))
        }
      }
    });

  } catch (error) {
    console.error('[CATEGORY RESULTS] Error checking assessment completion:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to check assessment completion status',
      error: error.message
    });
  }
};

/**
 * Process Phonological Awareness (matching questions)
 */
function processPhonologicalAwareness(categoryName, responses) {
  let totalMatches = 0;
  let correctMatches = 0;
  let questionsWithErrors = [];

  responses.forEach(response => {
    totalMatches += response.totalMatches || 0;
    correctMatches += response.correctMatches || 0;

    if (!response.isCorrect) {
      questionsWithErrors.push(response.questionId);
    }
  });

  const score = totalMatches > 0 ? Math.round((correctMatches / totalMatches) * 100) : 0;

  return {
    categoryName: categoryName,
    totalQuestions: responses.length,
    totalPossibleMatches: totalMatches,
    correctMatches: correctMatches,
    score: score,
    isPassed: score >= 75,
    passingThreshold: 75,
    isCompleted: true,
    lastQuestionAnswered: responses[responses.length - 1]?.questionId,
    interventionRequired: score < 75,
    interventionAttempts: 0,
    interventionCompleted: false,
    currentInterventionId: null,
    interventionHistory: [],
    errorQuestions: questionsWithErrors
  };
}

/**
 * Process Reading Comprehension (all-or-nothing sentence questions)
 * Each response contains multiple sentence question answers in an array
 * ALL sentence questions must be correct for the questionId to pass
 */
function processReadingComprehension(categoryName, responses) {
  let totalQuestions = 0;
  let passedQuestions = 0;
  let questionsWithErrors = [];

  responses.forEach(response => {
    totalQuestions++;

    // For Reading Comprehension, isCorrect should be true only if ALL sentence questions are correct
    // This means the mobile/response creation logic should already implement all-or-nothing
    if (response.isCorrect === true) {
      passedQuestions++;
    } else {
      questionsWithErrors.push(response.questionId);
    }
  });

  const score = totalQuestions > 0 ? Math.round((passedQuestions / totalQuestions) * 100) : 0;

  console.log(`[READING COMPREHENSION] Processing complete: ${passedQuestions}/${totalQuestions} questions passed (${score}%)`);
  console.log(`[READING COMPREHENSION] All-or-nothing rule: Each questionId requires ALL sentence questions correct`);

  return {
    categoryName: categoryName,
    totalQuestions: totalQuestions,
    correctAnswers: passedQuestions,  // Number of questionIds where ALL sentence questions were correct
    score: score,
    isPassed: score >= 75,
    passingThreshold: 75,
    isCompleted: true,
    lastQuestionAnswered: responses[responses.length - 1]?.questionId,
    interventionRequired: score < 75,
    interventionAttempts: 0,
    interventionCompleted: false,
    currentInterventionId: null,
    interventionHistory: [],
    errorQuestions: questionsWithErrors,
    // Reading Comprehension specific fields
    allOrNothingScoring: true,  // Flag to indicate special scoring used
    scoringNote: "Each question requires ALL sentence questions correct - no partial credit"
  };
}

/**
 * Process standard categories (multiple choice, etc.)
 */
function processStandardCategory(categoryName, responses) {
  const totalQuestions = responses.length;
  const correctAnswers = responses.filter(r => r.isCorrect === true).length;
  const score = totalQuestions > 0 ? Math.round((correctAnswers / totalQuestions) * 100) : 0;

  const questionsWithErrors = responses
    .filter(r => !r.isCorrect)
    .map(r => r.questionId);

  return {
    categoryName: categoryName,
    totalQuestions: totalQuestions,
    correctAnswers: correctAnswers,
    score: score,
    isPassed: score >= 75,
    passingThreshold: 75,
    isCompleted: true,
    lastQuestionAnswered: responses[responses.length - 1]?.questionId,
    interventionRequired: score < 75,
    interventionAttempts: 0,
    interventionCompleted: false,
    currentInterventionId: null,
    interventionHistory: [],
    errorQuestions: questionsWithErrors
  };
}

/**
 * Calculate weighted overall score based on reading level
 */
function calculateWeightedScore(categoryResults, readingLevel) {
  const weights = {
    'High Emerging': {
      'Alphabet Knowledge': 0.6,
      'Phonological Awareness': 0.4
    },
    'Developing': {
      'Alphabet Knowledge': 0.35,
      'Phonological Awareness': 0.30,
      'Decoding': 0.35
    },
    'Transitioning': {
      'Alphabet Knowledge': 0.20,
      'Phonological Awareness': 0.25,
      'Decoding': 0.25,
      'Word Recognition': 0.30
    },
    'At Grade Level': {
      'Alphabet Knowledge': 0.10,
      'Phonological Awareness': 0.15,
      'Decoding': 0.15,
      'Word Recognition': 0.20,
      'Reading Comprehension': 0.40
    }
  };

  const levelWeights = weights[readingLevel];
  if (!levelWeights) {
    // Equal weighting if no specific weights defined
    return Math.round(categoryResults.reduce((sum, cat) => sum + cat.score, 0) / categoryResults.length);
  }

  let weightedSum = 0;
  let totalWeight = 0;

  categoryResults.forEach(cat => {
    const weight = levelWeights[cat.categoryName] || 0;
    weightedSum += cat.score * weight;
    totalWeight += weight;
  });

  return totalWeight > 0 ? Math.round(weightedSum) : 0;
}

module.exports = {
  generateCategoryResults,
  checkAssessmentCompletionStatus
};