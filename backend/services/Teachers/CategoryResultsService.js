const mongoose = require('mongoose');
const User = require('../../models/userModel');

/**
 * Service for handling category results data
 */
class CategoryResultsService {

  // Get category results for a student
  static async getCategoryResults(studentId) {
    try {
      // Convert studentId to integer to ensure consistency
      const studentIdInt = parseInt(studentId);
      if (isNaN(studentIdInt)) {
        console.error(`Invalid studentId provided: ${studentId}`);
        return [];
      }

      console.log(`Fetching category results for student ID: ${studentIdInt}`);
      
      // Get collections
      const testDb = mongoose.connection.useDb('test');
      const categoryResultsCollection = testDb.collection('category_results');
      
      // Find by integer studentId
      const query = { studentId: studentIdInt };
        
      const results = await categoryResultsCollection
        .find(query)
        .sort({ assessmentDate: -1, createdAt: -1 })
        .toArray();
      
      if (results.length === 0) {
        console.log(`No category results found for student: ${studentIdInt}`);
        return [];
      }
      
      console.log(`Found ${results.length} category results for student: ${studentIdInt}`);
      
      // Format the results using the normalize function
      return results.map(result => ({
        ...result,
        categories: this.normalizeCategories(result.categories)
      }));
    } catch (error) {
      console.error(`Error fetching category results for student ${studentId}:`, error);
      return [];
    }
  }

  /**
   * Get the most recent category result for a specific category and student
   * @param {string|number} studentId - Student ID 
   * @param {string} categoryName - The category name to filter by
   * @returns {Promise<Object|null>} - The most recent category result or null
   */
  static async getCategoryResult(studentId, categoryName) {
    try {
      // Convert studentId to integer to ensure consistency
      const studentIdInt = parseInt(studentId);
      if (isNaN(studentIdInt)) {
        console.error(`Invalid studentId provided: ${studentId}`);
        return null;
      }

      console.log(`Fetching category results for student ID: ${studentIdInt} and category: ${categoryName}`);
      
      // Get collections
      const testDb = mongoose.connection.useDb('test');
      const categoryResultsCollection = testDb.collection('category_results');
      
      // Build query
      const query = {
        studentId: studentIdInt,
        'categories.categoryName': categoryName
      };
      
      console.log('Category result query:', JSON.stringify(query));
      
      // Find the most recent result
      const result = await categoryResultsCollection
        .findOne(query, {
          sort: { assessmentDate: -1, createdAt: -1 }
        });
      
      if (!result) {
        console.log(`No category results found for category ${categoryName} and student ${studentIdInt}`);
        return null;
      }
      
      console.log(`Found category result ${result._id} for category ${categoryName} and student ${studentIdInt}`);
      
      // Find the specific category data and return formatted result
      const categoryData = result.categories.find(cat => cat.categoryName === categoryName);
      
      return {
        ...result,
        categories: this.normalizeCategories(result.categories),
        specificCategory: categoryData ? this.normalizeCategories([categoryData])[0] : null
      };
    } catch (error) {
      console.error(`Error fetching category results for student ${studentId} and category ${categoryName}:`, error);
      return null;
    }
  }

  // Helper function to normalize category data format
  static normalizeCategories(categories) {
    if (!categories || !Array.isArray(categories) || categories.length === 0) {
      return [];
    }
    
    return categories.map(category => ({
      categoryName: category.categoryName || 'Unknown Category',
      totalQuestions: category.totalQuestions || 0,
      correctAnswers: category.correctAnswers || 0,
      totalPossibleMatches: category.totalPossibleMatches || 0,
      correctMatches: category.correctMatches || 0,
      score: category.score || 0,
      isPassed: category.isPassed || false,
      passingThreshold: category.passingThreshold || 75,
      isCompleted: category.isCompleted || false,
      lastQuestionAnswered: category.lastQuestionAnswered || '',
      interventionRequired: category.interventionRequired || false,
      interventionAttempts: category.interventionAttempts || 0,
      interventionCompleted: category.interventionCompleted || false,
      currentInterventionId: category.currentInterventionId || null,
      interventionHistory: category.interventionHistory || []
    }));
  }
}

module.exports = CategoryResultsService; 