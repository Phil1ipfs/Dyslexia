// controllers/Teachers/ManageProgress/studentResponseController.js
const mongoose = require('mongoose');

/**
 * Controller for handling student responses data
 * Based on the student_responses collection structure
 */

// Get all student responses for a specific student
const getStudentResponses = async (req, res) => {
  try {
    const { studentId } = req.params;
    const assessmentType = req.query.type; // Filter by assessment type
    const dateRange = req.query.dateRange; // Optional date range filter

    // Convert studentId to integer to match database format
    const studentIdInt = parseInt(studentId);
    if (isNaN(studentIdInt)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid studentId. Must be a valid integer.'
      });
    }

    console.log(`Getting student responses for student: ${studentIdInt}, type: ${assessmentType || 'all'}, dateRange: ${dateRange || 'all'}`);

    // Get student responses from test database
    const testDb = mongoose.connection.useDb('test');
    const studentResponsesCollection = testDb.collection('student_responses');

    // Build query
    const query = { studentId: studentIdInt };

    // Add assessment type filter if provided
    if (assessmentType) {
      if (assessmentType === 'pre-assessment' || assessmentType === 'post-assessment') {
        // For main assessment types, we don't have a direct field in student_responses
        // We need to correlate with category_results to determine assessment type
        // For now, we'll use date-based logic or rely on dateRange parameter
        console.log(`Filtering for assessment type: ${assessmentType}`);
      } else if (assessmentType === 'intervention') {
        // Filter for intervention responses (these have different source collection)
        query.assessmentType = 'intervention';
      }
    }

    // Add date range filter if provided (format: "2025-09-14")
    if (dateRange) {
      try {
        const date = new Date(dateRange);
        const startDate = new Date(date.getTime());
        const endDate = new Date(date.getTime() + (24 * 60 * 60 * 1000)); // Add 24 hours

        query.answeredAt = {
          $gte: startDate,
          $lt: endDate
        };
        console.log(`Applied date filter: ${startDate.toISOString()} to ${endDate.toISOString()}`);
      } catch (dateError) {
        console.warn(`Invalid date range format: ${dateRange}, ignoring filter`);
      }
    }

    console.log('Student responses query:', JSON.stringify(query));

    const responses = await studentResponsesCollection
      .find(query)
      .sort({ answeredAt: -1, createdAt: -1 })
      .toArray();
    
    if (!responses || responses.length === 0) {
      return res.status(200).json({
        success: true,
        message: 'No responses found for this student',
        data: []
      });
    }

    // Sanitize and format responses
    const sanitizedResponses = responses.map(response => ({
      _id: response._id,
      studentId: response.studentId,
      categoryId: response.categoryId,
      questionId: response.questionId,
      category: response.category,
      response: response.response,
      correctMatches: response.correctMatches || null,
      totalMatches: response.totalMatches || null,
      isCorrect: response.isCorrect,
      responseTime: response.responseTime || null,
      answeredAt: response.answeredAt,
      createdAt: response.createdAt,
      readingLevel: response.readingLevel
    }));

    res.json({
      success: true,
      message: 'Student responses retrieved successfully',
      data: sanitizedResponses,
      totalResponses: sanitizedResponses.length
    });
  } catch (error) {
    console.error('Error getting student responses:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
};

// Get student responses for a specific category
const getStudentResponsesByCategory = async (req, res) => {
  try {
    const { studentId, categoryName } = req.params;
    
    // Convert studentId to integer to match database format
    const studentIdInt = parseInt(studentId);
    if (isNaN(studentIdInt)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid studentId. Must be a valid integer.'
      });
    }

    // Validate category name
    const validCategories = [
      'Alphabet Knowledge', 
      'Phonological Awareness', 
      'Word Recognition', 
      'Decoding', 
      'Reading Comprehension'
    ];
    
    if (!validCategories.includes(categoryName)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid category name'
      });
    }

    console.log(`Getting ${categoryName} responses for student: ${studentIdInt}`);
    
    // Get student responses from test database
    const testDb = mongoose.connection.useDb('test');
    const studentResponsesCollection = testDb.collection('student_responses');
    
    const responses = await studentResponsesCollection
      .find({ 
        studentId: studentIdInt,
        category: categoryName
      })
      .sort({ answeredAt: -1, createdAt: -1 })
      .toArray();
    
    if (!responses || responses.length === 0) {
      return res.status(200).json({
        success: true,
        message: `No ${categoryName} responses found for this student`,
        data: []
      });
    }

    // Sanitize and format responses
    const sanitizedResponses = responses.map(response => ({
      _id: response._id,
      studentId: response.studentId,
      categoryId: response.categoryId,
      questionId: response.questionId,
      category: response.category,
      response: response.response,
      correctMatches: response.correctMatches || null,
      totalMatches: response.totalMatches || null,
      isCorrect: response.isCorrect,
      responseTime: response.responseTime || null,
      answeredAt: response.answeredAt,
      createdAt: response.createdAt,
      readingLevel: response.readingLevel
    }));

    res.json({
      success: true,
      message: `${categoryName} responses retrieved successfully`,
      data: sanitizedResponses,
      totalResponses: sanitizedResponses.length,
      category: categoryName
    });
  } catch (error) {
    console.error('Error getting student responses by category:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
};

// Get aggregated response statistics for a student
const getStudentResponseStats = async (req, res) => {
  try {
    const { studentId } = req.params;
    
    // Convert studentId to integer to match database format
    const studentIdInt = parseInt(studentId);
    if (isNaN(studentIdInt)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid studentId. Must be a valid integer.'
      });
    }

    console.log(`Getting response statistics for student: ${studentIdInt}`);
    
    // Get student responses from test database
    const testDb = mongoose.connection.useDb('test');
    const studentResponsesCollection = testDb.collection('student_responses');
    
    // Aggregate statistics by category
    const pipeline = [
      {
        $match: { studentId: studentIdInt }
      },
      {
        $group: {
          _id: '$category',
          totalResponses: { $sum: 1 },
          correctResponses: {
            $sum: { $cond: ['$isCorrect', 1, 0] }
          },
          averageResponseTime: { $avg: '$responseTime' },
          readingLevel: { $first: '$readingLevel' },
          lastResponseDate: { $max: '$answeredAt' }
        }
      },
      {
        $addFields: {
          accuracy: {
            $multiply: [
              { $divide: ['$correctResponses', '$totalResponses'] },
              100
            ]
          }
        }
      }
    ];

    const stats = await studentResponsesCollection.aggregate(pipeline).toArray();
    
    // Calculate overall statistics
    const totalResponses = stats.reduce((sum, stat) => sum + stat.totalResponses, 0);
    const totalCorrect = stats.reduce((sum, stat) => sum + stat.correctResponses, 0);
    const overallAccuracy = totalResponses > 0 ? (totalCorrect / totalResponses) * 100 : 0;

    res.json({
      success: true,
      message: 'Response statistics retrieved successfully',
      data: {
        byCategory: stats,
        overall: {
          totalResponses,
          correctResponses: totalCorrect,
          accuracy: Math.round(overallAccuracy * 100) / 100,
          categoriesAttempted: stats.length
        }
      }
    });
  } catch (error) {
    console.error('Error getting student response statistics:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
};

module.exports = {
  getStudentResponses,
  getStudentResponsesByCategory,
  getStudentResponseStats
};