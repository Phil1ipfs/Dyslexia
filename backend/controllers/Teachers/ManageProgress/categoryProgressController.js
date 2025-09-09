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

module.exports = {
  getCategoryProgress,
  getSpecificCategoryProgress,
  getAllStudentsCategoryProgress
};