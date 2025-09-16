const mongoose = require('mongoose');
const User = require('../../models/userModel');
const CategoryResult = require('../../models/Teachers/ManageProgress/categoryResultModel');
const IntegrationTriggerService = require('./PrescriptiveAnalytics/integrationTriggerService');
const AssessmentFlowControlService = require('./AssessmentFlowControlService');

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
   * Generate category results from student responses
   * @param {number} studentId - Student ID
   * @param {string} category - Category name (optional, if not provided processes all categories)
   * @returns {Promise<Object>} Generated category results
   */
  /**
   * Validate completeness before creating category results
   * Ensures student answered ALL questions in the main assessment for each category
   * @param {number} studentId - Student ID
   * @param {string} readingLevel - Student's reading level
   * @param {string} category - Specific category (optional)
   * @returns {Promise<Object>} Validation result with completeness status
   */
  static async validateAssessmentCompleteness(studentId, readingLevel, category = null) {
    try {
      console.log(`[COMPLETENESS VALIDATION] Checking completeness for student ${studentId}, level ${readingLevel}`);

      const MainAssessment = require('../../models/Teachers/mainAssessmentModel');
      const StudentResponse = require('../../models/Teachers/ManageProgress/studentResponseModel');

      // Get main assessments for the reading level
      const query = { readingLevel, isActive: true };
      if (category) {
        query.category = category;
      }

      const mainAssessments = await MainAssessment.find(query);

      if (mainAssessments.length === 0) {
        console.warn(`[COMPLETENESS VALIDATION] No main assessments found for ${readingLevel}${category ? ` - ${category}` : ''}`);
        return {
          isComplete: false,
          reason: 'no_assessments_found',
          details: `No main assessments found for reading level ${readingLevel}${category ? ` in category ${category}` : ''}`
        };
      }

      const completenessResults = {};
      let overallComplete = true;

      for (const assessment of mainAssessments) {
        const categoryName = assessment.category;
        const totalQuestionsInAssessment = assessment.questions.length;

        console.log(`[COMPLETENESS VALIDATION] Checking ${categoryName}: ${totalQuestionsInAssessment} questions required`);

        // Get student responses for this category
        const studentResponses = await StudentResponse.find({
          studentId: parseInt(studentId),
          category: categoryName
        });

        const answeredQuestions = studentResponses.length;
        const isComplete = answeredQuestions >= totalQuestionsInAssessment;

        completenessResults[categoryName] = {
          required: totalQuestionsInAssessment,
          answered: answeredQuestions,
          isComplete,
          missing: Math.max(0, totalQuestionsInAssessment - answeredQuestions),
          assessmentId: assessment._id
        };

        if (!isComplete) {
          overallComplete = false;
          console.log(`[COMPLETENESS VALIDATION] ${categoryName} INCOMPLETE: ${answeredQuestions}/${totalQuestionsInAssessment} questions answered`);
        } else {
          console.log(`[COMPLETENESS VALIDATION] ${categoryName} COMPLETE: ${answeredQuestions}/${totalQuestionsInAssessment} questions answered`);
        }
      }

      return {
        isComplete: overallComplete,
        categoryResults: completenessResults,
        summary: {
          totalCategories: Object.keys(completenessResults).length,
          completeCategories: Object.values(completenessResults).filter(r => r.isComplete).length,
          incompleteCategories: Object.values(completenessResults).filter(r => !r.isComplete).length
        }
      };

    } catch (error) {
      console.error('[COMPLETENESS VALIDATION] Error validating completeness:', error);
      return {
        isComplete: false,
        reason: 'validation_error',
        error: error.message
      };
    }
  }

  /**
   * Validate intervention assessment completeness
   * @param {number} studentId - Student ID
   * @param {string} interventionAssessmentId - Intervention Assessment ID
   * @returns {Promise<Object>} Validation result
   */
  static async validateInterventionCompleteness(studentId, interventionAssessmentId) {
    try {
      console.log(`[INTERVENTION COMPLETENESS] Checking completeness for student ${studentId}, intervention ${interventionAssessmentId}`);

      const InterventionAssessment = require('../../models/Teachers/ManageProgress/interventionAssessmentModel');
      const InterventionResponse = require('../../models/Teachers/ManageProgress/interventionResponseModel');

      // Get intervention assessment
      const intervention = await InterventionAssessment.findById(interventionAssessmentId);

      if (!intervention) {
        return {
          isComplete: false,
          reason: 'intervention_not_found',
          details: `Intervention assessment ${interventionAssessmentId} not found`
        };
      }

      const totalQuestionsInIntervention = intervention.totalQuestions || intervention.questions.length;

      // Get student responses for this intervention
      const interventionResponses = await InterventionResponse.find({
        studentId: parseInt(studentId),
        interventionAssessmentId: interventionAssessmentId
      });

      const answeredQuestions = interventionResponses.length;
      const isComplete = answeredQuestions >= totalQuestionsInIntervention;

      console.log(`[INTERVENTION COMPLETENESS] ${intervention.category}: ${answeredQuestions}/${totalQuestionsInIntervention} questions answered - ${isComplete ? 'COMPLETE' : 'INCOMPLETE'}`);

      return {
        isComplete,
        category: intervention.category,
        required: totalQuestionsInIntervention,
        answered: answeredQuestions,
        missing: Math.max(0, totalQuestionsInIntervention - answeredQuestions),
        interventionId: interventionAssessmentId
      };

    } catch (error) {
      console.error('[INTERVENTION COMPLETENESS] Error validating intervention completeness:', error);
      return {
        isComplete: false,
        reason: 'validation_error',
        error: error.message
      };
    }
  }

  static async generateCategoryResultsFromResponses(studentId, category = null) {
    try {
      console.log(`[CATEGORY RESULTS] Generating category results from responses for student ${studentId}`);

      // Get student data to determine reading level
      let student = await User.findOne({ idNumber: parseInt(studentId) });
      let readingLevel = 'High Emerging'; // Default based on your data

      if (student) {
        readingLevel = student.readingLevel || 'High Emerging';
        console.log(`[CATEGORY RESULTS] Found student ${studentId} with reading level: ${readingLevel}`);
      } else {
        // Try to infer reading level from responses
        console.log(`[CATEGORY RESULTS] Student ${studentId} not found in users collection, checking responses for reading level`);

        const StudentResponse = require('../../models/Teachers/ManageProgress/studentResponseModel');
        const sampleResponse = await StudentResponse.findOne({ studentId: parseInt(studentId) });

        if (sampleResponse && sampleResponse.readingLevel) {
          readingLevel = sampleResponse.readingLevel;
          console.log(`[CATEGORY RESULTS] Inferred reading level from responses: ${readingLevel}`);
        } else {
          console.log(`[CATEGORY RESULTS] Using default reading level: ${readingLevel}`);
        }
      }

      // CATEGORY-BY-CATEGORY APPROACH (CLAUDE.md): Process only complete categories, create placeholders for others
      console.log(`[CATEGORY RESULTS] ✅ USING CATEGORY-BY-CATEGORY PROCESSING (CLAUDE.md APPROACH)`);

      // Get all categories for this reading level
      const allCategoriesForLevel = this.getCategoriesForReadingLevel(readingLevel);
      console.log(`[CATEGORY RESULTS] Required categories for ${readingLevel}: [${allCategoriesForLevel.join(', ')}]`);

      // Check completeness for each category individually
      const categoryCompleteness = {};
      for (const cat of allCategoriesForLevel) {
        const catValidation = await this.validateAssessmentCompleteness(studentId, readingLevel, cat);
        categoryCompleteness[cat] = catValidation.categoryResults[cat] || { isComplete: false, answered: 0, required: 0 };
        console.log(`[CATEGORY RESULTS] ${cat}: ${categoryCompleteness[cat].isComplete ? 'COMPLETE' : 'INCOMPLETE'} (${categoryCompleteness[cat].answered}/${categoryCompleteness[cat].required})`);
      }

      console.log(`[CATEGORY RESULTS] ✅ PROCEEDING WITH CATEGORY-BY-CATEGORY RECORD CREATION`);

      // Get all student responses
      const StudentResponse = require('../../models/Teachers/ManageProgress/studentResponseModel');
      const query = { studentId: parseInt(studentId) };
      if (category) {
        query.category = category;
      }

      const responses = await StudentResponse.find(query)
        .sort({ answeredAt: 1 })
        .lean();

      console.log(`[CATEGORY RESULTS] Found ${responses.length} responses for student ${studentId}`);

      // Group responses by category
      const responsesByCategory = {};
      responses.forEach(response => {
        const cat = response.category;
        if (!responsesByCategory[cat]) {
          responsesByCategory[cat] = [];
        }
        responsesByCategory[cat].push(response);
      });

      // Process each category using completeness validation (CLAUDE.md: category-by-category)
      const categories = [];

      for (const categoryName of allCategoriesForLevel) {
        const categoryResponses = responsesByCategory[categoryName] || [];
        const isComplete = categoryCompleteness[categoryName]?.isComplete || false;

        if (!isComplete || categoryResponses.length === 0) {
          // Category is incomplete or has no responses - create placeholder entry
          console.log(`[CATEGORY RESULTS] Creating placeholder for ${categoryName} (${isComplete ? 'has responses but incomplete' : 'no responses yet'})`);
          categories.push({
            categoryName: categoryName,
            totalQuestions: categoryCompleteness[categoryName]?.required || 0,
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
          });
          continue;
        }
        console.log(`[CATEGORY RESULTS] Processing ${categoryResponses.length} responses for ${categoryName}`);

        // Calculate scores
        let totalQuestions = categoryResponses.length;
        let correctAnswers = 0;
        let totalMatches = 0;
        let correctMatches = 0;

        // Handle different question types
        if (categoryName === 'Phonological Awareness') {
          // For PA, count total matches and correct matches
          categoryResponses.forEach(response => {
            if (response.totalMatches) {
              totalMatches += response.totalMatches;
              correctMatches += response.correctMatches || 0;
            } else {
              // Fallback for older data structure
              totalQuestions++;
              if (response.isCorrect) correctAnswers++;
            }
          });

          if (totalMatches > 0) {
            const score = Math.round((correctMatches / totalMatches) * 100);
            categories.push({
              categoryName: categoryName,
              totalQuestions: categoryResponses.length,
              totalPossibleMatches: totalMatches,
              correctMatches: correctMatches,
              score: score,
              isPassed: score >= 75,
              isCompleted: true,
              interventionRequired: score < 75,
              responseDetails: categoryResponses.map(r => ({
                questionId: r.questionId,
                isCorrect: r.isCorrect,
                totalMatches: r.totalMatches || 0,
                correctMatches: r.correctMatches || 0,
                answeredAt: r.answeredAt
              }))
            });
          } else {
            // Fallback calculation
            const score = Math.round((correctAnswers / totalQuestions) * 100);
            categories.push({
              categoryName: categoryName,
              totalQuestions: totalQuestions,
              correctAnswers: correctAnswers,
              score: score,
              isPassed: score >= 75,
              isCompleted: true,
              interventionRequired: score < 75,
              responseDetails: categoryResponses.map(r => ({
                questionId: r.questionId,
                isCorrect: r.isCorrect,
                answeredAt: r.answeredAt
              }))
            });
          }
        } else {
          // For other categories, count correct answers
          categoryResponses.forEach(response => {
            if (response.isCorrect) {
              correctAnswers++;
            }
          });

          const score = Math.round((correctAnswers / totalQuestions) * 100);
          categories.push({
            categoryName: categoryName,
            totalQuestions: totalQuestions,
            correctAnswers: correctAnswers,
            score: score,
            isPassed: score >= 75,
            isCompleted: true,
            interventionRequired: score < 75,
            responseDetails: categoryResponses.map(r => ({
              questionId: r.questionId,
              isCorrect: r.isCorrect,
              answeredAt: r.answeredAt
            }))
          });
        }
      }

      // Create category result document
      const categoryResultData = {
        studentId: parseInt(studentId),
        assessmentDate: new Date(),
        readingLevel: readingLevel,
        categories: categories
      };

      // Check for existing category results to prevent duplicates
      console.log(`[CATEGORY RESULTS] 🔍 CHECKING FOR EXISTING RECORDS`);
      const existingResults = await this.getCategoryResults(parseInt(studentId));

      if (existingResults && existingResults.length > 0) {
        console.log(`[CATEGORY RESULTS] ⚠️  EXISTING RECORD FOUND - UPDATING INSTEAD OF CREATING NEW`);

        // Update the existing record instead of creating a new one
        const existingResult = existingResults[0]; // Get the first (most recent) record
        const updatedResult = await this.updateCategoryResult(existingResult._id, {
          categories: categories,
          assessmentDate: new Date()
        });

        console.log(`[CATEGORY RESULTS] ✅ Successfully UPDATED existing category results for student ${studentId}`);
        console.log(`[CATEGORY RESULTS] Record ID: ${updatedResult._id}`);
        console.log(`[CATEGORY RESULTS] Categories: ${updatedResult.categories.map(c => `${c.categoryName} (${c.totalQuestions}Q)`).join(', ')}`);

        return updatedResult;
      }

      // No existing record found - create new one
      console.log(`[CATEGORY RESULTS] 🔒 NO EXISTING RECORD - CREATING NEW NORMALIZED RECORD`);
      const createdResult = await this.createCategoryResult(categoryResultData);

      console.log(`[CATEGORY RESULTS] ✅ Successfully generated COMPLETE category results for student ${studentId}`);
      console.log(`[CATEGORY RESULTS] Record ID: ${createdResult._id}`);
      console.log(`[CATEGORY RESULTS] Categories: ${createdResult.categories.map(c => `${c.categoryName} (${c.totalQuestions}Q)`).join(', ')}`);

      return createdResult;

    } catch (error) {
      console.error(`[CATEGORY RESULTS] Error generating category results from responses:`, error);
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

      // Update user record - only readingLevel, NOT readingPercentage
      // readingPercentage should only be updated during pre-assessment
      await User.findByIdAndUpdate(user._id, {
        $set: {
          readingLevel: nextLevel,
          updatedAt: new Date()
        }
      });

      console.log(`[READING LEVEL PROGRESSION] Updated user ${studentId}: ${currentReadingLevel} → ${nextLevel} (readingPercentage preserved: ${user.readingPercentage}%)`);

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
        readingPercentagePreserved: user.readingPercentage, // Unchanged from pre-assessment
        newCategoryResultId: createdResult._id,
        requiredCategories: nextLevelCategories,
        message: `Successfully progressed from ${currentReadingLevel} to ${nextLevel} (readingPercentage preserved from pre-assessment)`
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

  /**
   * Get categories for reading level in prerequisite order (CLAUDE.md)
   * This matches the AutoProcessingService method for consistency
   */
  static getCategoriesForReadingLevel(readingLevel) {
    const categoryAssignment = {
      "Low Emerging": ["Alphabet Knowledge"],
      "High Emerging": ["Alphabet Knowledge", "Phonological Awareness"],
      "Developing": ["Alphabet Knowledge", "Phonological Awareness", "Decoding"],
      "Transitioning": ["Alphabet Knowledge", "Phonological Awareness", "Decoding", "Word Recognition"],
      "At Grade Level": ["Alphabet Knowledge", "Phonological Awareness", "Decoding", "Word Recognition", "Reading Comprehension"]
    };

    return categoryAssignment[readingLevel] || [];
  }

  /**
   * Check if student can access a specific category (with prerequisite validation)
   * Integrates with AssessmentFlowControlService for sequential access control
   *
   * @param {number} studentId - Student ID
   * @param {string} category - Category to check access for
   * @returns {Object} Access status and details
   */
  static async checkCategoryAccess(studentId, category) {
    try {
      console.log(`[CATEGORY ACCESS] Checking access for student ${studentId} to category ${category}`);

      // Use flow control service for prerequisite checking
      const accessResult = await AssessmentFlowControlService.checkCategoryAccess(studentId, category);

      return {
        success: true,
        allowed: accessResult.allowed,
        category: category,
        reason: accessResult.reason,
        prerequisites: accessResult.prerequisites || [],
        nextRequired: accessResult.nextRequired || null,
        blockingFactors: accessResult.blockingFactors || [],
        message: accessResult.message || null
      };

    } catch (error) {
      console.error('[CATEGORY ACCESS] Error checking category access:', error);
      return {
        success: false,
        allowed: false,
        error: error.message,
        reason: 'System error during access check'
      };
    }
  }

  /**
   * Get next available category for student assessment
   * Uses sequential flow control to determine what student should take next
   *
   * @param {number} studentId - Student ID
   * @returns {Object} Next category recommendation
   */
  static async getNextCategoryForAssessment(studentId) {
    try {
      console.log(`[NEXT CATEGORY] Getting next category for student ${studentId}`);

      const nextAvailable = await AssessmentFlowControlService.getNextAvailableCategory(studentId);

      if (nextAvailable.hasNext) {
        return {
          success: true,
          hasNext: true,
          nextCategory: nextAvailable.nextCategory,
          reason: nextAvailable.reason,
          currentScore: nextAvailable.currentScore || 0,
          requiresIntervention: nextAvailable.requiresIntervention || false
        };
      } else {
        return {
          success: true,
          hasNext: false,
          reason: nextAvailable.reason,
          readyForProgression: nextAvailable.readyForProgression || false,
          currentLevel: nextAvailable.currentLevel,
          nextRequired: nextAvailable.nextRequired || null,
          blockingFactors: nextAvailable.blockingFactors || []
        };
      }

    } catch (error) {
      console.error('[NEXT CATEGORY] Error getting next category:', error);
      return {
        success: false,
        hasNext: false,
        error: error.message
      };
    }
  }

  /**
   * Get complete assessment flow summary for student
   * Shows progress across all categories with prerequisite information
   *
   * @param {number} studentId - Student ID
   * @returns {Object} Complete flow summary
   */
  static async getAssessmentFlowSummary(studentId) {
    try {
      console.log(`[FLOW SUMMARY] Getting assessment flow summary for student ${studentId}`);

      const flowSummary = await AssessmentFlowControlService.getAssessmentFlowSummary(studentId);

      if (flowSummary.error) {
        return {
          success: false,
          error: flowSummary.error,
          message: flowSummary.message
        };
      }

      return {
        success: true,
        studentId: flowSummary.studentId,
        readingLevel: flowSummary.readingLevel,
        totalCategories: flowSummary.totalCategories,
        overallProgress: flowSummary.overallProgress,
        categoryProgress: flowSummary.categoryProgress,
        nextAvailable: flowSummary.nextAvailable,
        recommendedAction: this.determineRecommendedAction(flowSummary)
      };

    } catch (error) {
      console.error('[FLOW SUMMARY] Error getting flow summary:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Determine recommended action based on flow summary
   * Helper method to provide clear guidance on what student should do next
   *
   * @param {Object} flowSummary - Flow summary from AssessmentFlowControlService
   * @returns {string} Recommended action
   */
  static determineRecommendedAction(flowSummary) {
    if (flowSummary.nextAvailable.hasNext) {
      if (flowSummary.nextAvailable.requiresIntervention) {
        return 'complete_intervention';
      } else {
        return 'take_next_category';
      }
    } else if (flowSummary.nextAvailable.readyForProgression) {
      return 'ready_for_level_progression';
    } else if (flowSummary.nextAvailable.nextRequired) {
      return 'complete_prerequisite';
    } else {
      return 'assessment_complete';
    }
  }

  /**
   * Validate category result update with prerequisite checking
   * Enhanced version of updateCategoryResult that enforces sequential access
   *
   * @param {Object} updateData - Category result update data
   * @returns {Object} Update result with prerequisite validation
   */
  static async updateCategoryResultWithPrerequisites(updateData) {
    try {
      const { studentId, category } = updateData;

      // First check if student can access this category
      const accessCheck = await this.checkCategoryAccess(studentId, category);

      if (!accessCheck.allowed) {
        return {
          success: false,
          error: 'Category access denied',
          reason: accessCheck.reason,
          blockingFactors: accessCheck.blockingFactors,
          nextRequired: accessCheck.nextRequired,
          message: `Cannot update results for ${category}: ${accessCheck.reason}`
        };
      }

      // If access is allowed, proceed with normal update
      console.log(`[CATEGORY UPDATE] Prerequisites met for ${category} - proceeding with update`);
      const updateResult = await this.updateCategoryResult(updateData);

      // Add flow control information to the result
      if (updateResult.success) {
        const nextCategory = await this.getNextCategoryForAssessment(studentId);
        updateResult.nextAvailable = nextCategory;
        updateResult.accessValidated = true;
      }

      return updateResult;

    } catch (error) {
      console.error('[CATEGORY UPDATE] Error updating with prerequisites:', error);
      return {
        success: false,
        error: error.message,
        reason: 'System error during prerequisite-validated update'
      };
    }
  }

  /**
   * Update category_results when intervention succeeds
   * This is called when intervention_results shows a passing score (≥75%)
   *
   * @param {number} studentId - Student ID
   * @param {string} category - Category name
   * @param {number} interventionScore - Score from intervention
   * @param {ObjectId} interventionResultId - ID of intervention result
   * @returns {Object} Update result
   */
  static async updateCategoryFromIntervention(studentId, category, interventionScore, interventionResultId) {
    try {
      console.log(`[INTERVENTION UPDATE] Updating category_results for student ${studentId}, category ${category}, score ${interventionScore}`);

      // Find the category result that needs updating
      const categoryResult = await CategoryResult.findOne({
        studentId: parseInt(studentId),
        'categories.categoryName': category
      });

      if (!categoryResult) {
        throw new Error(`Category result not found for student ${studentId}, category ${category}`);
      }

      // Find the specific category within the result
      const categoryIndex = categoryResult.categories.findIndex(
        cat => cat.categoryName === category
      );

      if (categoryIndex === -1) {
        throw new Error(`Category ${category} not found in results for student ${studentId}`);
      }

      // Update the category with intervention success
      categoryResult.categories[categoryIndex].score = interventionScore;
      categoryResult.categories[categoryIndex].isPassed = true;
      categoryResult.categories[categoryIndex].interventionRequired = false;
      categoryResult.categories[categoryIndex].interventionCompleted = true;
      categoryResult.categories[categoryIndex].interventionResultId = interventionResultId;
      categoryResult.categories[categoryIndex].lastUpdated = new Date();

      // Update overall category result metadata
      categoryResult.updatedAt = new Date();

      // Save the updated category result
      await categoryResult.save();

      console.log(`[INTERVENTION UPDATE] Successfully updated category_results for ${category}`);

      // Check if all categories for this reading level are now passed
      const student = await User.findOne({ idNumber: studentId });
      if (student) {
        const progressionResult = await this.processReadingLevelProgression(
          studentId,
          student.readingLevel
        );

        if (progressionResult.shouldProgress) {
          console.log(`[INTERVENTION UPDATE] Student ${studentId} progressed from ${student.readingLevel} to ${progressionResult.newLevel}`);
        }
      }

      return {
        success: true,
        message: `Category ${category} updated to passed status`,
        score: interventionScore,
        categoryResult: categoryResult._id,
        progressionChecked: true
      };

    } catch (error) {
      console.error('[INTERVENTION UPDATE] Error updating category from intervention:', error);
      return {
        success: false,
        error: error.message,
        reason: 'Failed to update category_results from intervention success'
      };
    }
  }
}

module.exports = CategoryResultsService; 