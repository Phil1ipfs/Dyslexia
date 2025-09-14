// controllers/Teachers/ManageProgress/categoryProgressController.js
const mongoose = require('mongoose');
const CategoryResultsService = require('../../../services/Teachers/CategoryResultsService');

/**
 * Controller for handling category progress/results for students
 * Based on the category_results collection structure
 * studentId is handled as integer number only
 */

// Get category progress for a student
const getCategoryProgress = async (req, res) => {
  try {
    const { studentId } = req.params;
    
    // Convert studentId to integer
    const studentIdInt = parseInt(studentId);
    if (isNaN(studentIdInt)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid studentId. Must be a valid integer.'
      });
    }

    console.log(`Getting category progress for student: ${studentIdInt}`);
    
    const categoryResults = await CategoryResultsService.getCategoryResults(studentIdInt);
    
    if (!categoryResults || categoryResults.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'No category results found for this student',
        data: []
      });
    }

    res.json({
      success: true,
      message: 'Category progress retrieved successfully',
      data: categoryResults
    });
  } catch (error) {
    console.error('Error getting category progress:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
};

// Get specific category progress for a student
const getSpecificCategoryProgress = async (req, res) => {
  try {
    const { studentId, categoryName } = req.params;
    
    // Convert studentId to integer
    const studentIdInt = parseInt(studentId);
    if (isNaN(studentIdInt)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid studentId. Must be a valid integer.'
      });
    }

    console.log(`Getting ${categoryName} progress for student: ${studentIdInt}`);
    
    const categoryResult = await CategoryResultsService.getCategoryResult(studentIdInt, categoryName);
    
    if (!categoryResult) {
      return res.status(404).json({
        success: false,
        message: `No ${categoryName} results found for this student`,
        data: null
      });
    }

    res.json({
      success: true,
      message: `${categoryName} progress retrieved successfully`,
      data: categoryResult
    });
  } catch (error) {
    console.error('Error getting specific category progress:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
};

// Get all students with their latest category progress summary
const getAllStudentsCategoryProgress = async (req, res) => {
  try {
    const testDb = mongoose.connection.useDb('test');
    const categoryResultsCollection = testDb.collection('category_results');
    
    // Aggregate to get latest results for each student
    const pipeline = [
      {
        $sort: { studentId: 1, assessmentDate: -1 }
      },
      {
        $group: {
          _id: '$studentId',
          latestResult: { $first: '$$ROOT' }
        }
      },
      {
        $replaceRoot: { newRoot: '$latestResult' }
      },
      {
        $sort: { studentId: 1 }
      }
    ];

    const results = await categoryResultsCollection.aggregate(pipeline).toArray();
    
    // Format the results to include summary information
    const formattedResults = results.map(result => ({
      studentId: result.studentId,
      readingLevel: result.readingLevel,
      overallScore: result.overallScore,
      completedCategories: result.completedCategories,
      totalCategories: result.totalCategories,
      allCategoriesPassed: result.allCategoriesPassed,
      assessmentDate: result.assessmentDate,
      categoriesSummary: result.categories.map(cat => ({
        categoryName: cat.categoryName,
        score: cat.score,
        isPassed: cat.isPassed,
        interventionRequired: cat.interventionRequired || false,
        interventionCompleted: cat.interventionCompleted || false
      }))
    }));

    res.json({
      success: true,
      message: 'All students category progress retrieved successfully',
      data: formattedResults
    });
  } catch (error) {
    console.error('Error getting all students category progress:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
};

// Create new category result
const createCategoryResult = async (req, res) => {
  try {
    const { studentId, categories, readingLevel, assessmentDate, assessmentType } = req.body;
    
    // Validate required fields
    if (!studentId || !categories || !Array.isArray(categories)) {
      return res.status(400).json({
        success: false,
        message: 'studentId and categories array are required',
        errors: [
          { field: 'studentId', message: 'Student ID is required' },
          { field: 'categories', message: 'Categories array is required' }
        ]
      });
    }

    // Convert studentId to integer
    const studentIdInt = parseInt(studentId);
    if (isNaN(studentIdInt)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid studentId. Must be a valid integer.',
        errors: [{ field: 'studentId', message: 'Must be a valid integer' }]
      });
    }

    console.log(`Creating category result for student: ${studentIdInt}`);
    
    const categoryResultData = {
      studentId: studentIdInt,
      categories,
      readingLevel: readingLevel || 'Low Emerging',
      assessmentDate: assessmentDate ? new Date(assessmentDate) : new Date(),
      assessmentType: assessmentType || 'main'
    };
    
    const categoryResult = await CategoryResultsService.createCategoryResult(categoryResultData);
    
    res.status(201).json({
      success: true,
      message: 'Category result created successfully',
      data: categoryResult
    });
  } catch (error) {
    console.error('Error creating category result:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
};

// Update existing category result
const updateCategoryResult = async (req, res) => {
  try {
    const { categoryResultId } = req.params;
    const updateData = req.body;
    
    if (!categoryResultId) {
      return res.status(400).json({
        success: false,
        message: 'Category result ID is required',
        errors: [{ field: 'categoryResultId', message: 'Category result ID is required' }]
      });
    }

    // Validate ObjectId format
    if (!mongoose.Types.ObjectId.isValid(categoryResultId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid category result ID format',
        errors: [{ field: 'categoryResultId', message: 'Invalid MongoDB ObjectId format' }]
      });
    }

    console.log(`Updating category result: ${categoryResultId}`);
    
    const updatedResult = await CategoryResultsService.updateCategoryResult(categoryResultId, updateData);
    
    res.json({
      success: true,
      message: 'Category result updated successfully',
      data: updatedResult
    });
  } catch (error) {
    console.error('Error updating category result:', error);
    
    if (error.message === 'Category result not found') {
      return res.status(404).json({
        success: false,
        message: 'Category result not found',
        error: error.message
      });
    }
    
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
};

// Delete category result
const deleteCategoryResult = async (req, res) => {
  try {
    const { categoryResultId } = req.params;
    
    if (!categoryResultId) {
      return res.status(400).json({
        success: false,
        message: 'Category result ID is required',
        errors: [{ field: 'categoryResultId', message: 'Category result ID is required' }]
      });
    }

    // Validate ObjectId format
    if (!mongoose.Types.ObjectId.isValid(categoryResultId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid category result ID format',
        errors: [{ field: 'categoryResultId', message: 'Invalid MongoDB ObjectId format' }]
      });
    }

    console.log(`Deleting category result: ${categoryResultId}`);
    
    const deleteResult = await CategoryResultsService.deleteCategoryResult(categoryResultId);
    
    res.json({
      success: true,
      message: 'Category result deleted successfully',
      data: deleteResult
    });
  } catch (error) {
    console.error('Error deleting category result:', error);
    
    if (error.message === 'Category result not found') {
      return res.status(404).json({
        success: false,
        message: 'Category result not found',
        error: error.message
      });
    }
    
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
};

// Get category result by ID
const getCategoryResultById = async (req, res) => {
  try {
    const { categoryResultId } = req.params;
    
    if (!categoryResultId) {
      return res.status(400).json({
        success: false,
        message: 'Category result ID is required',
        errors: [{ field: 'categoryResultId', message: 'Category result ID is required' }]
      });
    }

    // Validate ObjectId format
    if (!mongoose.Types.ObjectId.isValid(categoryResultId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid category result ID format',
        errors: [{ field: 'categoryResultId', message: 'Invalid MongoDB ObjectId format' }]
      });
    }

    console.log(`Getting category result by ID: ${categoryResultId}`);
    
    const testDb = mongoose.connection.useDb('test');
    const categoryResultsCollection = testDb.collection('category_results');
    
    const categoryResult = await categoryResultsCollection.findOne({
      _id: new mongoose.Types.ObjectId(categoryResultId)
    });
    
    if (!categoryResult) {
      return res.status(404).json({
        success: false,
        message: 'Category result not found',
        data: null
      });
    }

    res.json({
      success: true,
      message: 'Category result retrieved successfully',
      data: categoryResult
    });
  } catch (error) {
    console.error('Error getting category result by ID:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
};

// Check if student can access a specific category (prerequisite validation)
const checkCategoryAccess = async (req, res) => {
  try {
    const { studentId, category } = req.params;

    // Convert studentId to integer
    const studentIdInt = parseInt(studentId);
    if (isNaN(studentIdInt)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid studentId. Must be a valid integer.'
      });
    }

    if (!category) {
      return res.status(400).json({
        success: false,
        message: 'Category is required',
        errors: [{ field: 'category', message: 'Category name is required' }]
      });
    }

    console.log(`Checking category access for student ${studentIdInt} to category ${category}`);

    const accessResult = await CategoryResultsService.checkCategoryAccess(studentIdInt, category);

    if (accessResult.success) {
      res.json({
        success: true,
        allowed: accessResult.allowed,
        category: category,
        studentId: studentIdInt,
        reason: accessResult.reason,
        prerequisites: accessResult.prerequisites,
        nextRequired: accessResult.nextRequired,
        blockingFactors: accessResult.blockingFactors,
        message: accessResult.message
      });
    } else {
      res.status(500).json({
        success: false,
        allowed: false,
        error: accessResult.error,
        message: 'Error checking category access'
      });
    }
  } catch (error) {
    console.error('Error checking category access:', error);
    res.status(500).json({
      success: false,
      allowed: false,
      message: 'Internal server error',
      error: error.message
    });
  }
};

// Get next available category for student assessment
const getNextCategoryForAssessment = async (req, res) => {
  try {
    const { studentId } = req.params;

    // Convert studentId to integer
    const studentIdInt = parseInt(studentId);
    if (isNaN(studentIdInt)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid studentId. Must be a valid integer.'
      });
    }

    console.log(`Getting next available category for student ${studentIdInt}`);

    const nextCategoryResult = await CategoryResultsService.getNextCategoryForAssessment(studentIdInt);

    if (nextCategoryResult.success) {
      res.json({
        success: true,
        studentId: studentIdInt,
        hasNext: nextCategoryResult.hasNext,
        nextCategory: nextCategoryResult.nextCategory || null,
        reason: nextCategoryResult.reason,
        currentScore: nextCategoryResult.currentScore || null,
        requiresIntervention: nextCategoryResult.requiresIntervention || false,
        readyForProgression: nextCategoryResult.readyForProgression || false,
        currentLevel: nextCategoryResult.currentLevel || null,
        nextRequired: nextCategoryResult.nextRequired || null,
        blockingFactors: nextCategoryResult.blockingFactors || []
      });
    } else {
      res.status(500).json({
        success: false,
        hasNext: false,
        error: nextCategoryResult.error,
        message: 'Error getting next category'
      });
    }
  } catch (error) {
    console.error('Error getting next category for assessment:', error);
    res.status(500).json({
      success: false,
      hasNext: false,
      message: 'Internal server error',
      error: error.message
    });
  }
};

// Get complete assessment flow summary for student
const getAssessmentFlowSummary = async (req, res) => {
  try {
    const { studentId } = req.params;

    // Convert studentId to integer
    const studentIdInt = parseInt(studentId);
    if (isNaN(studentIdInt)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid studentId. Must be a valid integer.'
      });
    }

    console.log(`Getting assessment flow summary for student ${studentIdInt}`);

    const flowSummary = await CategoryResultsService.getAssessmentFlowSummary(studentIdInt);

    if (flowSummary.success) {
      res.json({
        success: true,
        studentId: flowSummary.studentId,
        readingLevel: flowSummary.readingLevel,
        totalCategories: flowSummary.totalCategories,
        overallProgress: flowSummary.overallProgress,
        categoryProgress: flowSummary.categoryProgress,
        nextAvailable: flowSummary.nextAvailable,
        recommendedAction: flowSummary.recommendedAction
      });
    } else {
      res.status(500).json({
        success: false,
        error: flowSummary.error,
        message: 'Error getting assessment flow summary'
      });
    }
  } catch (error) {
    console.error('Error getting assessment flow summary:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
};

// Create category result with prerequisite validation
const createCategoryResultWithPrerequisites = async (req, res) => {
  try {
    const { studentId, category, ...updateData } = req.body;

    // Validate required fields
    if (!studentId || !category) {
      return res.status(400).json({
        success: false,
        message: 'studentId and category are required',
        errors: [
          { field: 'studentId', message: 'Student ID is required' },
          { field: 'category', message: 'Category is required' }
        ]
      });
    }

    const studentIdInt = parseInt(studentId);
    if (isNaN(studentIdInt)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid studentId. Must be a valid integer.'
      });
    }

    console.log(`Creating category result with prerequisites for student ${studentIdInt}, category ${category}`);

    const createResult = await CategoryResultsService.updateCategoryResultWithPrerequisites({
      studentId: studentIdInt,
      category: category,
      ...updateData
    });

    if (createResult.success) {
      res.status(201).json({
        success: true,
        message: 'Category result created successfully with prerequisite validation',
        data: createResult.data,
        nextAvailable: createResult.nextAvailable,
        accessValidated: createResult.accessValidated
      });
    } else if (createResult.error === 'Category access denied') {
      res.status(403).json({
        success: false,
        message: 'Category access denied - prerequisites not met',
        reason: createResult.reason,
        blockingFactors: createResult.blockingFactors,
        nextRequired: createResult.nextRequired,
        details: createResult.message
      });
    } else {
      res.status(500).json({
        success: false,
        message: 'Failed to create category result',
        error: createResult.error,
        reason: createResult.reason
      });
    }
  } catch (error) {
    console.error('Error creating category result with prerequisites:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
};

// Generate category results from student responses
const generateCategoryResultsFromResponses = async (req, res) => {
  try {
    const { studentId } = req.params;
    const { category } = req.body; // Optional - if provided, only process this category

    console.log(`Generating category results from responses for student: ${studentId}${category ? ` (category: ${category})` : ''}`);

    const result = await CategoryResultsService.generateCategoryResultsFromResponses(
      parseInt(studentId),
      category
    );

    res.status(201).json({
      success: true,
      message: 'Category results generated successfully from student responses',
      data: result
    });
  } catch (error) {
    console.error('Error generating category results from responses:', error);

    if (error.message.includes('not found')) {
      res.status(404).json({
        success: false,
        message: error.message
      });
    } else {
      res.status(500).json({
        success: false,
        message: 'Internal server error',
        error: error.message
      });
    }
  }
};

module.exports = {
  getCategoryProgress,
  getSpecificCategoryProgress,
  getAllStudentsCategoryProgress,
  createCategoryResult,
  updateCategoryResult,
  deleteCategoryResult,
  getCategoryResultById,
  // New prerequisite-aware endpoints
  checkCategoryAccess,
  getNextCategoryForAssessment,
  getAssessmentFlowSummary,
  createCategoryResultWithPrerequisites,
  // Generate from responses
  generateCategoryResultsFromResponses
};