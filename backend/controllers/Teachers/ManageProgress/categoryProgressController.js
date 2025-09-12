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

module.exports = {
  getCategoryProgress,
  getSpecificCategoryProgress,
  getAllStudentsCategoryProgress,
  createCategoryResult,
  updateCategoryResult,
  deleteCategoryResult,
  getCategoryResultById
};