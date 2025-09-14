const mongoose = require('mongoose');
const User = require('../../models/userModel');
const CategoryResult = require('../../models/Teachers/ManageProgress/categoryResultModel');
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
      
      // Use Mongoose model instead of direct collection access
      const results = await CategoryResult
        .find({ studentId: studentIdInt })
        .sort({ assessmentDate: -1, createdAt: -1 })
        .lean();
      
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
      
      // Build query for Mongoose
      const query = {
        studentId: studentIdInt,
        'categories.categoryName': categoryName
      };
      
      console.log('Category result query:', JSON.stringify(query));
      
      // Use Mongoose model instead of direct collection access
      const result = await CategoryResult
        .findOne(query)
        .sort({ assessmentDate: -1, createdAt: -1 })
        .lean();
      
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

      // Create the category result document using Mongoose model
      const categoryResultDoc = new CategoryResult({
        studentId: studentIdInt,
        assessmentDate: categoryResultData.assessmentDate || new Date(),
        readingLevel: categoryResultData.readingLevel || 'Low Emerging',
        categories: normalizedCategories,
        overallScore: overallStats.overallScore,
        completedCategories: normalizedCategories.length,
        totalCategories: normalizedCategories.length,
        allCategoriesPassed: overallStats.passedCategories === normalizedCategories.length,
        readingLevelUpdated: false
      });

      // Save using Mongoose model
      const savedResult = await categoryResultDoc.save();
      
      console.log(`[CATEGORY RESULTS] Successfully created category result ${savedResult._id}`);

      // Trigger prescriptive analysis generation
      try {
        console.log(`[CATEGORY RESULTS] Triggering prescriptive analysis for category result ${savedResult._id}`);
        
        const prescriptiveAnalysis = await IntegrationTriggerService.triggerPrescriptiveAnalysis(savedResult.toObject());
        
        if (prescriptiveAnalysis) {
          console.log(`[CATEGORY RESULTS] Successfully generated prescriptive analysis ${prescriptiveAnalysis._id}`);
          savedResult.prescriptiveAnalysisId = prescriptiveAnalysis._id;
        } else {
          console.warn(`[CATEGORY RESULTS] Prescriptive analysis generation returned null`);
        }
      } catch (analyticsError) {
        console.error('[CATEGORY RESULTS] Error generating prescriptive analysis:', analyticsError);
        // Don't fail the category result creation if analytics fails
      }

      return savedResult.toObject();

    } catch (error) {
      console.error('[CATEGORY RESULTS] Error creating category result:', error);
      throw error;
    }
  }

  /**
   * Update existing category result and regenerate prescriptive analysis if needed
   * Also handles automatic reading level progression when all categories are passed
   *
   * @param {string} categoryResultId - Category result ID
   * @param {Object} updateData - Data to update
   * @returns {Promise<Object>} - Updated category result
   */
  static async updateCategoryResult(categoryResultId, updateData) {
    try {
      console.log(`[CATEGORY RESULTS] Updating category result ${categoryResultId}`);

      // Get existing category result using Mongoose
      const existingResult = await CategoryResult.findById(categoryResultId);

      if (!existingResult) {
        throw new Error('Category result not found');
      }

      // Update categories if provided
      if (updateData.categories) {
        updateData.categories = this.normalizeCategories(updateData.categories);

        // Recalculate overall stats
        const overallStats = this.calculateOverallStats(updateData.categories);
        updateData.overallScore = overallStats.overallScore;
        updateData.completedCategories = updateData.categories.length;
        updateData.totalCategories = updateData.categories.length;
        updateData.allCategoriesPassed = overallStats.passedCategories === updateData.categories.length;

        // Check for reading level progression if all categories passed
        if (updateData.allCategoriesPassed && !existingResult.allCategoriesPassed) {
          console.log(`[CATEGORY RESULTS] Student ${existingResult.studentId} passed all categories for ${existingResult.readingLevel}`);

          try {
            const progressionResult = await this.processReadingLevelProgression(existingResult.studentId, existingResult.readingLevel);
            if (progressionResult.levelChanged) {
              updateData.readingLevelUpdated = true;
              console.log(`[CATEGORY RESULTS] Reading level progression triggered: ${existingResult.readingLevel} → ${progressionResult.newLevel}`);
            }
          } catch (progressionError) {
            console.error('[CATEGORY RESULTS] Error processing reading level progression:', progressionError);
            // Don't fail the update if progression fails
          }
        }
      }

      // Update the document using Mongoose
      const updatedResult = await CategoryResult.findByIdAndUpdate(
        categoryResultId,
        { $set: updateData },
        { new: true, runValidators: true }
      );

      if (!updatedResult) {
        throw new Error('Category result not found for update');
      }

      console.log(`[CATEGORY RESULTS] Successfully updated category result ${categoryResultId}`);

      // Regenerate prescriptive analysis if categories changed
      if (updateData.categories) {
        try {
          const prescriptiveAnalysis = await IntegrationTriggerService.triggerPrescriptiveAnalysis(updatedResult.toObject());
          if (prescriptiveAnalysis) {
            updatedResult.prescriptiveAnalysisId = prescriptiveAnalysis._id;
          }
        } catch (analyticsError) {
          console.error('[CATEGORY RESULTS] Error regenerating prescriptive analysis:', analyticsError);
        }
      }

      return updatedResult.toObject();

    } catch (error) {
      console.error('[CATEGORY RESULTS] Error updating category result:', error);
      throw error;
    }
  }

  /**
   * Delete category result and associated prescriptive analysis
   * 
   * @param {string} categoryResultId - Category result ID to delete
   * @returns {Promise<Object>} - Deletion result
   */
  static async deleteCategoryResult(categoryResultId) {
    try {
      console.log(`[CATEGORY RESULTS] Deleting category result ${categoryResultId}`);

      // Get existing category result using Mongoose
      const existingResult = await CategoryResult.findById(categoryResultId);

      if (!existingResult) {
        throw new Error('Category result not found');
      }

      // Import PrescriptiveAnalysis model for cleanup
      const PrescriptiveAnalysis = require('../../models/Teachers/ManageProgress/prescriptiveAnalysisModel');

      // Delete associated prescriptive analysis if exists
      if (existingResult.prescriptiveAnalysisId) {
        try {
          await PrescriptiveAnalysis.findByIdAndDelete(existingResult.prescriptiveAnalysisId);
          console.log(`[CATEGORY RESULTS] Deleted associated prescriptive analysis ${existingResult.prescriptiveAnalysisId}`);
        } catch (analyticsError) {
          console.warn('[CATEGORY RESULTS] Error deleting prescriptive analysis:', analyticsError);
          // Continue with category result deletion
        }
      }

      // Delete prescriptive analysis by student reference if no direct link
      try {
        const deletedAnalyses = await PrescriptiveAnalysis.deleteMany({
          studentId: existingResult.studentId,
          assessmentDate: existingResult.assessmentDate
        });
        console.log(`[CATEGORY RESULTS] Cleaned up ${deletedAnalyses.deletedCount} prescriptive analyses for student ${existingResult.studentId}`);
      } catch (cleanupError) {
        console.warn('[CATEGORY RESULTS] Error during prescriptive analysis cleanup:', cleanupError);
      }

      // Delete the category result using Mongoose
      const deleteResult = await CategoryResult.findByIdAndDelete(categoryResultId);

      if (!deleteResult) {
        throw new Error('Failed to delete category result');
      }

      console.log(`[CATEGORY RESULTS] Successfully deleted category result ${categoryResultId}`);

      return {
        success: true,
        deletedId: categoryResultId,
        studentId: existingResult.studentId,
        deletedCount: 1
      };

    } catch (error) {
      console.error('[CATEGORY RESULTS] Error deleting category result:', error);
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

  /**
   * Process reading level progression when student passes all categories
   * Automatically updates user's reading level and creates new category_results record
   *
   * @param {number} studentId - Student ID
   * @param {string} currentReadingLevel - Current reading level
   * @returns {Promise<Object>} - Progression result
   */
  static async processReadingLevelProgression(studentId, currentReadingLevel) {
    try {
      console.log(`[READING LEVEL PROGRESSION] Processing progression for student ${studentId} from ${currentReadingLevel}`);

      // Get next reading level
      const readingLevelProgression = {
        'Low Emerging': 'High Emerging',
        'High Emerging': 'Developing',
        'Developing': 'Transitioning',
        'Transitioning': 'At Grade Level',
        'At Grade Level': null // Already at highest level
      };

      const nextLevel = readingLevelProgression[currentReadingLevel];

      if (!nextLevel) {
        console.log(`[READING LEVEL PROGRESSION] Student ${studentId} already at highest level: ${currentReadingLevel}`);
        return {
          levelChanged: false,
          currentLevel: currentReadingLevel,
          newLevel: null,
          message: 'Already at highest reading level'
        };
      }

      // Update user's reading level and reading percentage
      const User = require('../../models/userModel');
      const user = await User.findOne({ studentId: studentId });

      if (!user) {
        throw new Error(`User with studentId ${studentId} not found`);
      }

      // Calculate new reading percentage based on level progression
      const readingPercentages = {
        'High Emerging': 40,
        'Developing': 60,
        'Transitioning': 80,
        'At Grade Level': 100
      };

      const newReadingPercentage = readingPercentages[nextLevel] || user.readingPercentage;

      // Update user record
      await User.findByIdAndUpdate(user._id, {
        $set: {
          readingLevel: nextLevel,
          readingPercentage: newReadingPercentage,
          updatedAt: new Date()
        }
      });

      console.log(`[READING LEVEL PROGRESSION] Updated user ${studentId}: ${currentReadingLevel} → ${nextLevel} (${newReadingPercentage}%)`);

      // Create new category_results record for the next level
      const nextLevelCategories = this.getCategoriesForReadingLevel(nextLevel);
      const initialCategoryData = nextLevelCategories.map(categoryName => ({
        categoryName,
        totalQuestions: 0,
        correctAnswers: 0,
        totalPossibleMatches: 0,
        correctMatches: 0,
        score: 0,
        isPassed: false,
        passingThreshold: 75,
        isCompleted: false,
        lastQuestionAnswered: '',
        interventionRequired: false,
        interventionAttempts: 0,
        interventionCompleted: false,
        currentInterventionId: null,
        interventionHistory: []
      }));

      const newCategoryResult = {
        studentId: studentId,
        assessmentDate: new Date(),
        readingLevel: nextLevel,
        categories: initialCategoryData,
        overallScore: 0,
        completedCategories: 0,
        totalCategories: nextLevelCategories.length,
        allCategoriesPassed: false,
        readingLevelUpdated: false // Will be true when they complete this level
      };

      // Create the new category_results record
      const createdResult = await this.createCategoryResult(newCategoryResult);

      console.log(`[READING LEVEL PROGRESSION] Created new category_results ${createdResult._id} for reading level ${nextLevel}`);

      return {
        levelChanged: true,
        currentLevel: currentReadingLevel,
        newLevel: nextLevel,
        newReadingPercentage: newReadingPercentage,
        newCategoryResultId: createdResult._id,
        requiredCategories: nextLevelCategories,
        message: `Successfully progressed from ${currentReadingLevel} to ${nextLevel}`
      };

    } catch (error) {
      console.error('[READING LEVEL PROGRESSION] Error processing progression:', error);
      throw error;
    }
  }

  /**
   * Check if student is eligible for reading level progression
   * Used by mobile app to determine if new assessment should be unlocked
   *
   * @param {number} studentId - Student ID
   * @returns {Promise<Object>} - Progression eligibility status
   */
  static async checkProgressionEligibility(studentId) {
    try {
      // Get student's current reading level
      const User = require('../../models/userModel');
      const user = await User.findOne({ studentId: studentId });

      if (!user) {
        return { eligible: false, reason: 'Student not found' };
      }

      // Get latest category results for current level
      const latestResult = await CategoryResult
        .findOne({
          studentId: studentId,
          readingLevel: user.readingLevel
        })
        .sort({ assessmentDate: -1 });

      if (!latestResult) {
        return {
          eligible: false,
          reason: 'No assessment completed for current reading level',
          currentLevel: user.readingLevel,
          requiredCategories: this.getCategoriesForReadingLevel(user.readingLevel)
        };
      }

      if (!latestResult.allCategoriesPassed) {
        const failedCategories = latestResult.categories
          .filter(cat => !cat.isPassed)
          .map(cat => cat.categoryName);

        return {
          eligible: false,
          reason: 'Not all categories passed',
          currentLevel: user.readingLevel,
          failedCategories,
          needsIntervention: failedCategories.some(cat =>
            latestResult.categories.find(c => c.categoryName === cat)?.interventionRequired
          )
        };
      }

      // Check if already at highest level
      const nextLevel = {
        'Low Emerging': 'High Emerging',
        'High Emerging': 'Developing',
        'Developing': 'Transitioning',
        'Transitioning': 'At Grade Level',
        'At Grade Level': null
      }[user.readingLevel];

      if (!nextLevel) {
        return {
          eligible: false,
          reason: 'Already at highest reading level',
          currentLevel: user.readingLevel
        };
      }

      return {
        eligible: true,
        currentLevel: user.readingLevel,
        nextLevel,
        message: `Ready to progress from ${user.readingLevel} to ${nextLevel}`,
        completedAt: latestResult.updatedAt
      };

    } catch (error) {
      console.error('[READING LEVEL PROGRESSION] Error checking eligibility:', error);
      return {
        eligible: false,
        reason: 'Error checking progression eligibility',
        error: error.message
      };
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