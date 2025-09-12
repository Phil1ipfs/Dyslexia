const mongoose = require('mongoose');
const User = require('../../models/userModel');
const IntegrationTriggerService = require('./PrescriptiveAnalytics/integrationTriggerService');

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

  /**
   * Create or update category results with automatic prescriptive analysis generation
   * This method ensures category results are properly created and prescriptive analysis is triggered
   * 
   * @param {Object} categoryResultData - Category result data
   * @returns {Promise<Object>} - Created/updated category result with analysis
   */
  static async createCategoryResult(categoryResultData) {
    try {
      console.log(`[CATEGORY RESULTS] Creating category result for student ${categoryResultData.studentId}`);

      // Validate required data
      if (!categoryResultData.studentId || !categoryResultData.categories) {
        throw new Error('Invalid category result data: studentId and categories are required');
      }

      // Ensure studentId is integer
      const studentIdInt = parseInt(categoryResultData.studentId);
      if (isNaN(studentIdInt)) {
        throw new Error(`Invalid studentId: ${categoryResultData.studentId}`);
      }

      // Normalize categories and calculate intervention requirements
      const normalizedCategories = this.normalizeCategories(categoryResultData.categories);
      
      // Calculate overall performance and intervention needs
      const overallStats = this.calculateOverallStats(normalizedCategories);

      // Create the category result document
      const categoryResult = {
        studentId: studentIdInt,
        assessmentDate: categoryResultData.assessmentDate || new Date(),
        assessmentType: categoryResultData.assessmentType || 'main',
        readingLevel: categoryResultData.readingLevel || 'Low Emerging',
        categories: normalizedCategories,
        overallScore: overallStats.overallScore,
        passedCategories: overallStats.passedCategories,
        failedCategories: overallStats.failedCategories,
        interventionRequired: overallStats.interventionRequired,
        createdAt: new Date(),
        updatedAt: new Date()
      };

      // Save to database
      const testDb = mongoose.connection.useDb('test');
      const categoryResultsCollection = testDb.collection('category_results');
      
      const result = await categoryResultsCollection.insertOne(categoryResult);
      
      if (!result.insertedId) {
        throw new Error('Failed to create category result');
      }

      categoryResult._id = result.insertedId;
      
      console.log(`[CATEGORY RESULTS] Successfully created category result ${result.insertedId}`);

      // Trigger prescriptive analysis generation
      try {
        console.log(`[CATEGORY RESULTS] Triggering prescriptive analysis for category result ${result.insertedId}`);
        
        const prescriptiveAnalysis = await IntegrationTriggerService.triggerPrescriptiveAnalysis(categoryResult);
        
        if (prescriptiveAnalysis) {
          console.log(`[CATEGORY RESULTS] Successfully generated prescriptive analysis ${prescriptiveAnalysis._id}`);
          categoryResult.prescriptiveAnalysisId = prescriptiveAnalysis._id;
        } else {
          console.warn(`[CATEGORY RESULTS] Prescriptive analysis generation returned null`);
        }
      } catch (analyticsError) {
        console.error('[CATEGORY RESULTS] Error generating prescriptive analysis:', analyticsError);
        // Don't fail the category result creation if analytics fails
      }

      return categoryResult;

    } catch (error) {
      console.error('[CATEGORY RESULTS] Error creating category result:', error);
      throw error;
    }
  }

  /**
   * Update existing category result and regenerate prescriptive analysis if needed
   * 
   * @param {string} categoryResultId - Category result ID
   * @param {Object} updateData - Data to update
   * @returns {Promise<Object>} - Updated category result
   */
  static async updateCategoryResult(categoryResultId, updateData) {
    try {
      console.log(`[CATEGORY RESULTS] Updating category result ${categoryResultId}`);

      const testDb = mongoose.connection.useDb('test');
      const categoryResultsCollection = testDb.collection('category_results');

      // Get existing category result
      const existingResult = await categoryResultsCollection.findOne({
        _id: new mongoose.Types.ObjectId(categoryResultId)
      });

      if (!existingResult) {
        throw new Error('Category result not found');
      }

      // Update categories if provided
      if (updateData.categories) {
        updateData.categories = this.normalizeCategories(updateData.categories);
        
        // Recalculate overall stats
        const overallStats = this.calculateOverallStats(updateData.categories);
        updateData.overallScore = overallStats.overallScore;
        updateData.passedCategories = overallStats.passedCategories;
        updateData.failedCategories = overallStats.failedCategories;
        updateData.interventionRequired = overallStats.interventionRequired;
      }

      updateData.updatedAt = new Date();

      // Update the document
      const updateResult = await categoryResultsCollection.updateOne(
        { _id: new mongoose.Types.ObjectId(categoryResultId) },
        { $set: updateData }
      );

      if (updateResult.matchedCount === 0) {
        throw new Error('Category result not found for update');
      }

      // Get updated document
      const updatedResult = await categoryResultsCollection.findOne({
        _id: new mongoose.Types.ObjectId(categoryResultId)
      });

      console.log(`[CATEGORY RESULTS] Successfully updated category result ${categoryResultId}`);

      // Regenerate prescriptive analysis if categories changed
      if (updateData.categories) {
        try {
          const prescriptiveAnalysis = await IntegrationTriggerService.triggerPrescriptiveAnalysis(updatedResult);
          if (prescriptiveAnalysis) {
            updatedResult.prescriptiveAnalysisId = prescriptiveAnalysis._id;
          }
        } catch (analyticsError) {
          console.error('[CATEGORY RESULTS] Error regenerating prescriptive analysis:', analyticsError);
        }
      }

      return updatedResult;

    } catch (error) {
      console.error('[CATEGORY RESULTS] Error updating category result:', error);
      throw error;
    }
  }

  /**
   * Calculate overall statistics from categories
   * 
   * @param {Array} categories - Array of category data
   * @returns {Object} - Overall statistics
   */
  static calculateOverallStats(categories) {
    if (!categories || categories.length === 0) {
      return {
        overallScore: 0,
        passedCategories: 0,
        failedCategories: 0,
        interventionRequired: false
      };
    }

    const totalScore = categories.reduce((sum, cat) => sum + (cat.score || 0), 0);
    const overallScore = Math.round(totalScore / categories.length);
    
    const passedCategories = categories.filter(cat => cat.isPassed).length;
    const failedCategories = categories.length - passedCategories;
    
    const interventionRequired = failedCategories > 0;

    return {
      overallScore,
      passedCategories,
      failedCategories,
      interventionRequired
    };
  }

  /**
   * Get category result by category name (for intervention service)
   * 
   * @param {string|number} studentId - Student ID
   * @param {string} categoryName - Category name
   * @returns {Promise<Object|null>} - Category result
   */
  static async getCategoryResultByCategory(studentId, categoryName) {
    try {
      // This method is used by intervention service, maintain compatibility
      return await this.getCategoryResult(studentId, categoryName);
    } catch (error) {
      console.error(`[CATEGORY RESULTS] Error getting category result by category:`, error);
      return null;
    }
  }

  /**
   * Check if student has completed assessment for reading level
   * 
   * @param {number} studentId - Student ID
   * @param {string} readingLevel - Reading level
   * @returns {Promise<Object>} - Completion status
   */
  static async checkAssessmentCompletion(studentId, readingLevel) {
    try {
      const expectedCategories = this.getCategoriesForReadingLevel(readingLevel);
      const categoryResults = await this.getCategoryResults(studentId);
      
      if (categoryResults.length === 0) {
        return {
          completed: false,
          completedCategories: [],
          missingCategories: expectedCategories,
          readingLevel
        };
      }

      // Get latest result
      const latestResult = categoryResults[0];
      const completedCategories = latestResult.categories.map(cat => cat.categoryName);
      const missingCategories = expectedCategories.filter(cat => !completedCategories.includes(cat));

      return {
        completed: missingCategories.length === 0,
        completedCategories,
        missingCategories,
        readingLevel,
        categoryResultId: latestResult._id
      };

    } catch (error) {
      console.error(`[CATEGORY RESULTS] Error checking assessment completion:`, error);
      return {
        completed: false,
        completedCategories: [],
        missingCategories: [],
        error: error.message
      };
    }
  }

  /**
   * Get expected categories for reading level
   * 
   * @param {string} readingLevel - Reading level
   * @returns {Array} - Expected categories
   */
  static getCategoriesForReadingLevel(readingLevel) {
    const categoryMap = {
      'Low Emerging': ['Alphabet Knowledge'],
      'High Emerging': ['Alphabet Knowledge', 'Phonological Awareness'],
      'Developing': ['Alphabet Knowledge', 'Phonological Awareness', 'Decoding'],
      'Transitioning': ['Alphabet Knowledge', 'Phonological Awareness', 'Decoding', 'Word Recognition'],
      'At Grade Level': ['Alphabet Knowledge', 'Phonological Awareness', 'Decoding', 'Word Recognition', 'Reading Comprehension']
    };

    return categoryMap[readingLevel] || categoryMap['At Grade Level'];
  }

  /**
   * Enforce 75% pass threshold validation
   * 
   * @param {Array} categories - Categories to validate
   * @returns {Array} - Validated categories with enforced threshold
   */
  static enforcePassThreshold(categories) {
    const PASS_THRESHOLD = 75;
    
    return categories.map(category => ({
      ...category,
      passingThreshold: PASS_THRESHOLD,
      isPassed: (category.score || 0) >= PASS_THRESHOLD,
      interventionRequired: (category.score || 0) < PASS_THRESHOLD
    }));
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
      isPassed: (category.score || 0) >= 75, // Enforce 75% threshold
      passingThreshold: 75, // Always 75%
      isCompleted: category.isCompleted || false,
      lastQuestionAnswered: category.lastQuestionAnswered || '',
      interventionRequired: (category.score || 0) < 75, // Based on 75% threshold
      interventionAttempts: category.interventionAttempts || 0,
      interventionCompleted: category.interventionCompleted || false,
      currentInterventionId: category.currentInterventionId || null,
      interventionHistory: category.interventionHistory || []
    }));
  }
}

module.exports = CategoryResultsService; 