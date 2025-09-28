// Integration Trigger Service for Prescriptive Analytics
// Handles automatic generation of prescriptive analysis when category_results are created

const prescriptiveAnalyticsService = require('../PrescriptiveAnalyticsService');
const mongoose = require('mongoose');
const PrescriptiveAnalysis = require('../../../models/Teachers/ManageProgress/prescriptiveAnalysisModel');
const CategoryResult = require('../../../models/Teachers/ManageProgress/categoryResultModel');

class IntegrationTriggerService {
  
  /**
   * Main trigger function to be called after category_results are saved
   * This ensures prescriptive analysis is generated automatically
   *
   * @param {Object} categoryResult - The newly created category_result document
   * @returns {Object} Generated prescriptive analysis or null if error
   */
  static async triggerPrescriptiveAnalysis(categoryResult) {
    try {
      console.log(`[INTEGRATION TRIGGER] Triggering prescriptive analysis for student ${categoryResult.studentId}, reading level: ${categoryResult.readingLevel}`);

      // Validate category result
      if (!categoryResult || !categoryResult._id || !categoryResult.studentId) {
        console.error('[INTEGRATION TRIGGER] Invalid category result provided');
        return null;
      }

      // ✅ ENHANCED CHECK: Verify if prescriptive analysis is COMPLETE for all categories
      const existingAnalysis = await this.checkExistingAnalysis(categoryResult._id);
      if (existingAnalysis) {
        // Check if the existing analysis contains complete data for all expected categories
        const isComplete = await IntegrationTriggerService.verifyAnalysisCompleteness(existingAnalysis, categoryResult);

        if (isComplete) {
          console.log(`[INTEGRATION TRIGGER] Complete prescriptive analysis already exists for category result ${categoryResult._id}`);
          return existingAnalysis;
        } else {
          console.log(`[INTEGRATION TRIGGER] ⚠️  Existing prescriptive analysis is INCOMPLETE - will regenerate with all category data`);

          // Delete incomplete analysis so we can regenerate a complete one
          await PrescriptiveAnalysis.deleteOne({ _id: existingAnalysis._id });
          console.log(`[INTEGRATION TRIGGER] Deleted incomplete analysis ${existingAnalysis._id} for regeneration`);
        }
      }

      // NEW: Generate prescription-only analysis (Doctor-Teacher-Student Model)
      // This provides DIAGNOSIS + PRESCRIPTION only, NO question generation
      console.log(`[DOCTOR-TEACHER-STUDENT] Using prescription-only model for category result ${categoryResult._id}`);
      const analysis = await prescriptiveAnalyticsService.generatePrescriptionOnly(categoryResult._id);

      console.log(`[INTEGRATION TRIGGER] Successfully generated prescriptive analysis ${analysis._id} for student ${categoryResult.studentId}`);

      // Optional: Trigger additional processes if needed
      await this.postAnalysisProcessing(analysis);

      return analysis;
    } catch (error) {
      // ✅ ENHANCED AUTOMATIC DUPLICATE KEY ERROR HANDLING FOR MULTIPLE READING LEVELS
      if (error.code === 11000 && error.message.includes('studentId_1_categoryId_1')) {
        console.log(`[INTEGRATION TRIGGER] 🔧 ENHANCED AUTOMATIC FIX: Duplicate key error for student ${categoryResult.studentId} - this means student has multiple reading levels`);

        try {
          // 1. First check if we already have analysis for THIS specific reading level using categoryResultId
          console.log(`[INTEGRATION TRIGGER] 🔍 Step 1: Checking by categoryResultId to avoid index conflicts`);
          const existingByCategoryResultId = await PrescriptiveAnalysis.findOne({
            categoryResultId: categoryResult._id
          });

          if (existingByCategoryResultId) {
            console.log(`[INTEGRATION TRIGGER] ✅ Analysis already exists for this category result: ${existingByCategoryResultId._id}`);
            return existingByCategoryResultId;
          }

          // 2. Check by reading level specifically (bypassing problematic studentId+categoryId index)
          console.log(`[INTEGRATION TRIGGER] 🔍 Step 2: Checking by readingLevel (${categoryResult.readingLevel}) only`);
          const existingForThisLevel = await PrescriptiveAnalysis.findOne({
            studentId: categoryResult.studentId,
            readingLevel: categoryResult.readingLevel
          }).sort({ createdAt: -1 });

          if (existingForThisLevel) {
            console.log(`[INTEGRATION TRIGGER] ✅ Found analysis for this reading level: ${existingForThisLevel._id}`);

            // Link this category result to the existing analysis if not already linked
            if (!existingForThisLevel.categoryResultId) {
              existingForThisLevel.categoryResultId = categoryResult._id;
              await existingForThisLevel.save();
              console.log(`[INTEGRATION TRIGGER] 🔗 Linked existing analysis to category result`);
            }

            return existingForThisLevel;
          }

          // 3. Create new analysis using ONLY categoryResultId approach (bypassing problematic indexes)
          console.log(`[INTEGRATION TRIGGER] 🔄 Step 3: Creating new analysis using categoryResultId-only approach`);

          // Use existing prescription generation method
          const analysisData = await prescriptiveAnalyticsService.generatePrescriptionOnly(categoryResult._id);

          if (analysisData) {
            // Create analysis with explicit categoryResultId and remove problematic fields
            const safeAnalysisData = {
              ...analysisData,
              categoryResultId: categoryResult._id,
              studentId: categoryResult.studentId,
              readingLevel: categoryResult.readingLevel,
              // Remove categoryId field that's causing the duplicate key issue
              categoryId: undefined
            };

            const newAnalysis = new PrescriptiveAnalysis(safeAnalysisData);
            const savedAnalysis = await newAnalysis.save();

            console.log(`[INTEGRATION TRIGGER] ✅ SUCCESS: Created prescriptive analysis bypassing index conflicts: ${savedAnalysis._id}`);
            return savedAnalysis;
          }

          // 4. Fallback: Generate minimal analysis to ensure system continuity
          console.log(`[INTEGRATION TRIGGER] 🔄 Step 4: Creating minimal fallback analysis`);
          const fallbackAnalysis = await this.createMinimalAnalysis(categoryResult);

          if (fallbackAnalysis) {
            console.log(`[INTEGRATION TRIGGER] ✅ SUCCESS: Created minimal fallback analysis: ${fallbackAnalysis._id}`);
            return fallbackAnalysis;
          }

          // If all else fails, log the issue but don't break the flow
          console.log(`[INTEGRATION TRIGGER] ⚠️ Could not resolve duplicate key error automatically after all attempts`);
          console.log(`[INTEGRATION TRIGGER] 💡 This indicates database indexes need to be updated to include readingLevel`);

          await this.logError(categoryResult, error);
          return null;

        } catch (retryError) {
          console.error('[INTEGRATION TRIGGER] Error in enhanced automatic duplicate key fix:', retryError);

          // Final fallback: Try to create minimal analysis even if main generation fails
          try {
            const emergencyAnalysis = await this.createMinimalAnalysis(categoryResult);
            if (emergencyAnalysis) {
              console.log(`[INTEGRATION TRIGGER] 🚨 EMERGENCY SUCCESS: Created minimal analysis as last resort: ${emergencyAnalysis._id}`);
              return emergencyAnalysis;
            }
          } catch (emergencyError) {
            console.error('[INTEGRATION TRIGGER] Emergency fallback also failed:', emergencyError);
          }

          await this.logError(categoryResult, retryError);
          return null;
        }
      }

      console.error('[INTEGRATION TRIGGER] Error generating prescriptive analysis:', error);

      // Log the error but don't throw - we don't want to break the main assessment flow
      await this.logError(categoryResult, error);

      return null;
    }
  }
  
  /**
   * Check if prescriptive analysis already exists for this category result
   *
   * @param {ObjectId} categoryResultId - Category result ID
   * @returns {Object|null} Existing analysis or null
   */
  static async checkExistingAnalysis(categoryResultId) {
    try {
      const existingAnalysis = await PrescriptiveAnalysis.findOne({
        categoryResultId: categoryResultId
      }).lean();

      return existingAnalysis;
    } catch (error) {
      console.error('[INTEGRATION TRIGGER] Error checking existing analysis:', error);
      return null;
    }
  }

  /**
   * Verify if existing prescriptive analysis contains complete data for all categories
   *
   * @param {Object} existingAnalysis - Existing prescriptive analysis
   * @param {Object} categoryResult - Category result with all completed categories
   * @returns {boolean} True if analysis is complete, false if missing data
   */
  static async verifyAnalysisCompleteness(existingAnalysis, categoryResult) {
    try {
      console.log(`[INTEGRATION TRIGGER] Verifying completeness of analysis ${existingAnalysis._id}`);

      // Get all completed categories from category_results
      const completedCategories = categoryResult.categories
        .filter(cat => cat.isCompleted === true)
        .map(cat => cat.categoryName);

      console.log(`[INTEGRATION TRIGGER] Completed categories: [${completedCategories.join(', ')}]`);

      // Check if skillMastery exists and has data for each completed category
      if (!existingAnalysis.skillMastery) {
        console.log(`[INTEGRATION TRIGGER] ❌ No skillMastery data found`);
        return false;
      }

      for (const category of completedCategories) {
        const categoryData = existingAnalysis.skillMastery[category];

        if (!categoryData) {
          console.log(`[INTEGRATION TRIGGER] ❌ Missing skillMastery data for: ${category}`);
          return false;
        }

        // Check if this category has real data (not just defaults)
        const hasRealData = (
          categoryData.totalQuestions > 0 ||
          categoryData.responseHistory?.length > 0 ||
          categoryData.correctAnswers > 0 ||
          categoryData.correctMatches > 0
        );

        if (!hasRealData) {
          console.log(`[INTEGRATION TRIGGER] ❌ Category ${category} has empty/default data - totalQuestions: ${categoryData.totalQuestions}, responseHistory: ${categoryData.responseHistory?.length || 0}`);
          return false;
        }

        console.log(`[INTEGRATION TRIGGER] ✅ Category ${category} has complete data - totalQuestions: ${categoryData.totalQuestions}, responseHistory: ${categoryData.responseHistory?.length || 0}`);
      }

      console.log(`[INTEGRATION TRIGGER] ✅ Analysis is complete for all ${completedCategories.length} categories`);
      return true;

    } catch (error) {
      console.error('[INTEGRATION TRIGGER] Error verifying analysis completeness:', error);
      return false; // Assume incomplete if we can't verify
    }
  }
  
  /**
   * Trigger multiple analyses for students who have completed all categories for their level
   * This is useful for batch processing or manual triggers
   * 
   * @param {Array} studentIds - Array of student IDs to process
   * @returns {Array} Array of generated analyses
   */
  static async triggerBatchAnalysis(studentIds) {
    const results = [];
    
    try {
      console.log(`[INTEGRATION TRIGGER] Starting batch analysis for ${studentIds.length} students`);
      
      for (const studentId of studentIds) {
        try {
          // Get latest category result for this student
          const latestCategoryResult = await this.getLatestCategoryResult(studentId);
          
          if (latestCategoryResult) {
            const analysis = await this.triggerPrescriptiveAnalysis(latestCategoryResult);
            if (analysis) {
              results.push(analysis);
            }
          } else {
            console.log(`[INTEGRATION TRIGGER] No category results found for student ${studentId}`);
          }
        } catch (studentError) {
          console.error(`[INTEGRATION TRIGGER] Error processing student ${studentId}:`, studentError);
          continue; // Continue with other students
        }
      }
      
      console.log(`[INTEGRATION TRIGGER] Batch analysis completed. Generated ${results.length} analyses`);
      return results;
    } catch (error) {
      console.error('[INTEGRATION TRIGGER] Error in batch analysis:', error);
      return results; // Return partial results
    }
  }
  
  /**
   * Get the latest category result for a student
   * 
   * @param {number} studentId - Student ID
   * @returns {Object|null} Latest category result or null
   */
  static async getLatestCategoryResult(studentId) {
    try {
      const latestResult = await CategoryResult
        .findOne({ studentId: parseInt(studentId) })
        .sort({ assessmentDate: -1, createdAt: -1 })
        .lean();
      
      return latestResult;
    } catch (error) {
      console.error('[INTEGRATION TRIGGER] Error getting latest category result:', error);
      return null;
    }
  }
  
  /**
   * Post-analysis processing - can be used for notifications, reports, etc.
   * 
   * @param {Object} analysis - Generated prescriptive analysis
   */
  static async postAnalysisProcessing(analysis) {
    try {
      // Log analysis completion
      console.log(`[INTEGRATION TRIGGER] Post-processing analysis ${analysis._id}`);
      
      // Check if interventions are needed
      if (analysis.interventionPlan?.required) {
        console.log(`[INTEGRATION TRIGGER] Student ${analysis.studentId} requires intervention in categories: ${analysis.interventionPlan.priority.join(', ')}`);
        
        // Could trigger notification service here
        // await notificationService.notifyTeacher(analysis.studentId, analysis.interventionPlan);
      }
      
      // Check if face-to-face support is recommended
      if (analysis.insights?.recommendedAction === 'face_to_face_required') {
        console.log(`[INTEGRATION TRIGGER] Student ${analysis.studentId} requires face-to-face intervention`);
        
        // Could trigger urgent notification here
        // await notificationService.notifyUrgent(analysis.studentId);
      }
      
      // Update any dashboard statistics or caches
      // await dashboardService.updateStudentStats(analysis.studentId);
      
    } catch (error) {
      console.error('[INTEGRATION TRIGGER] Error in post-analysis processing:', error);
      // Don't throw - this is optional processing
    }
  }
  
  /**
   * Log errors for monitoring and debugging
   * 
   * @param {Object} categoryResult - Category result that failed
   * @param {Error} error - The error that occurred
   */
  static async logError(categoryResult, error) {
    try {
      const testDb = mongoose.connection.useDb('test');
      const errorLogsCollection = testDb.collection('prescriptive_analysis_errors');
      
      const errorLog = {
        categoryResultId: categoryResult._id,
        studentId: categoryResult.studentId,
        errorMessage: error.message,
        errorStack: error.stack,
        timestamp: new Date(),
        resolved: false
      };
      
      await errorLogsCollection.insertOne(errorLog);
      
      console.log(`[INTEGRATION TRIGGER] Error logged for category result ${categoryResult._id}`);
    } catch (logError) {
      console.error('[INTEGRATION TRIGGER] Failed to log error:', logError);
    }
  }
  
  /**
   * Manual trigger for regenerating analysis
   * Useful for testing or when fixing issues
   * 
   * @param {ObjectId} categoryResultId - Category result ID to regenerate analysis for
   * @param {boolean} forceRegenerate - Whether to regenerate even if analysis exists
   * @returns {Object} Generated or existing analysis
   */
  static async manualTrigger(categoryResultId, forceRegenerate = false) {
    try {
      console.log(`[INTEGRATION TRIGGER] Manual trigger for category result ${categoryResultId}`);
      
      // Get the category result using Mongoose
      const categoryResult = await CategoryResult.findById(categoryResultId).lean();
      
      if (!categoryResult) {
        throw new Error(`Category result ${categoryResultId} not found`);
      }
      
      // Check if analysis already exists
      if (!forceRegenerate) {
        const existingAnalysis = await this.checkExistingAnalysis(categoryResult._id);
        if (existingAnalysis) {
          console.log(`[INTEGRATION TRIGGER] Using existing analysis for category result ${categoryResultId}`);
          return existingAnalysis;
        }
      } else {
        // Delete existing analysis if force regenerate using Mongoose
        await PrescriptiveAnalysis.deleteMany({
          categoryResultId: categoryResult._id
        });
        console.log(`[INTEGRATION TRIGGER] Deleted existing analysis for regeneration`);
      }
      
      // Generate new analysis
      const analysis = await this.triggerPrescriptiveAnalysis(categoryResult);
      
      return analysis;
    } catch (error) {
      console.error('[INTEGRATION TRIGGER] Error in manual trigger:', error);
      throw error;
    }
  }
  
  /**
   * Health check for the integration system
   * 
   * @returns {Object} Health status
   */
  static async healthCheck() {
    try {
      const testDb = mongoose.connection.useDb('test');
      
      // Check database connections
      const collections = {
        category_results: await testDb.collection('category_results').findOne({}, { projection: { _id: 1 } }),
        student_responses: await testDb.collection('student_responses').findOne({}, { projection: { _id: 1 } }),
        prescriptive_analysis: await testDb.collection('prescriptive_analysis').findOne({}, { projection: { _id: 1 } })
      };
      
      // Check service availability
      const serviceCheck = await prescriptiveAnalyticsService.healthCheck();
      
      return {
        status: 'healthy',
        timestamp: new Date(),
        database: {
          connected: true,
          collections: Object.keys(collections).reduce((acc, key) => {
            acc[key] = collections[key] !== null ? 'accessible' : 'empty';
            return acc;
          }, {})
        },
        services: {
          prescriptiveAnalytics: serviceCheck.status
        }
      };
    } catch (error) {
      return {
        status: 'unhealthy',
        timestamp: new Date(),
        error: error.message
      };
    }
  }

  /**
   * Create minimal prescriptive analysis as fallback when main generation fails
   * This ensures system continuity and prevents complete failure
   *
   * @param {Object} categoryResult - Category result data
   * @returns {Object} Minimal prescriptive analysis
   */
  static async createMinimalAnalysis(categoryResult) {
    try {
      console.log(`[INTEGRATION TRIGGER] 🔧 Creating minimal fallback analysis for student ${categoryResult.studentId}`);

      // Create basic analysis structure that avoids problematic indexes
      const minimalAnalysis = {
        categoryResultId: categoryResult._id,
        studentId: categoryResult.studentId,
        readingLevel: categoryResult.readingLevel,
        assessmentDate: new Date(),
        assessmentType: "main",

        // Basic skill mastery based on category results
        skillMastery: this.generateBasicSkillMastery(categoryResult),

        // Basic ability estimates
        abilityEstimates: this.generateBasicAbilityEstimates(categoryResult),

        // Basic error patterns
        errorPatterns: this.generateBasicErrorPatterns(categoryResult),

        // Basic insights
        insights: {
          strengths: this.identifyBasicStrengths(categoryResult),
          weaknesses: this.identifyBasicWeaknesses(categoryResult),
          overallReadiness: this.calculateBasicReadiness(categoryResult),
          recommendedAction: this.determineBasicAction(categoryResult),
          passedCategories: this.countPassedCategories(categoryResult),
          failedCategories: this.countFailedCategories(categoryResult),
          overallScore: categoryResult.overallScore || 0
        },

        // Basic intervention plan if needed
        interventionPlan: this.generateBasicInterventionPlan(categoryResult),

        createdAt: new Date(),
        updatedAt: new Date(),
        generatedBy: "fallback_system",
        generationReason: "duplicate_key_error_bypass"
      };

      // Create the analysis document directly (avoiding problematic fields)
      const newAnalysis = new PrescriptiveAnalysis(minimalAnalysis);
      const savedAnalysis = await newAnalysis.save();

      console.log(`[INTEGRATION TRIGGER] ✅ Successfully created minimal analysis: ${savedAnalysis._id}`);
      return savedAnalysis;

    } catch (error) {
      console.error('[INTEGRATION TRIGGER] Error creating minimal analysis:', error);
      return null;
    }
  }

  /**
   * Generate basic skill mastery data from category results
   */
  static generateBasicSkillMastery(categoryResult) {
    const skillMastery = {};

    if (categoryResult.categories && Array.isArray(categoryResult.categories)) {
      categoryResult.categories.forEach(category => {
        const score = category.score || 0;
        const masteryProbability = Math.max(0.1, Math.min(0.9, score / 100));

        skillMastery[category.categoryName] = {
          masteryProbability: masteryProbability,
          totalQuestions: category.totalQuestions || 1,
          correctAnswers: Math.round((score / 100) * (category.totalQuestions || 1)),
          score: score,
          isPassed: category.isPassed || false,
          status: score >= 75 ? "STRONG" : score >= 50 ? "DEVELOPING" : "NEEDS_IMPROVEMENT",
          responseHistory: []
        };
      });
    }

    return skillMastery;
  }

  /**
   * Generate basic ability estimates from category results
   */
  static generateBasicAbilityEstimates(categoryResult) {
    const abilityEstimates = {};

    if (categoryResult.categories && Array.isArray(categoryResult.categories)) {
      categoryResult.categories.forEach(category => {
        const score = category.score || 0;
        // Convert percentage to IRT scale (-3 to +3)
        const abilityEstimate = ((score - 50) / 50) * 2; // Rough conversion
        abilityEstimates[category.categoryName] = Math.max(-3, Math.min(3, abilityEstimate));
      });
    }

    return abilityEstimates;
  }

  /**
   * Generate basic error patterns from category results
   */
  static generateBasicErrorPatterns(categoryResult) {
    const errorPatterns = {};

    if (categoryResult.categories && Array.isArray(categoryResult.categories)) {
      categoryResult.categories.forEach(category => {
        if (category.score < 75) {
          errorPatterns[category.categoryName] = {
            error_type: "general_difficulty",
            error_rate: 100 - category.score,
            severity: category.score < 50 ? "high" : "moderate",
            pattern_analysis: "Fallback analysis - detailed patterns require full system"
          };
        }
      });
    }

    return errorPatterns;
  }

  /**
   * Identify basic strengths from category results
   */
  static identifyBasicStrengths(categoryResult) {
    const strengths = [];

    if (categoryResult.categories && Array.isArray(categoryResult.categories)) {
      categoryResult.categories.forEach(category => {
        if (category.score >= 75) {
          strengths.push(`${category.categoryName} - ${category.score}%`);
        }
      });
    }

    return strengths.length > 0 ? strengths : ["Assessment completed"];
  }

  /**
   * Identify basic weaknesses from category results
   */
  static identifyBasicWeaknesses(categoryResult) {
    const weaknesses = [];

    if (categoryResult.categories && Array.isArray(categoryResult.categories)) {
      categoryResult.categories.forEach(category => {
        if (category.score < 75) {
          weaknesses.push(`${category.categoryName} - ${category.score}%`);
        }
      });
    }

    return weaknesses.length > 0 ? weaknesses : ["No specific weaknesses identified"];
  }

  /**
   * Calculate basic readiness assessment
   */
  static calculateBasicReadiness(categoryResult) {
    const overallScore = categoryResult.overallScore || 0;

    if (overallScore >= 75) {
      return "Ready for next level";
    } else if (overallScore >= 50) {
      return "Needs some intervention";
    } else {
      return "Requires intensive intervention";
    }
  }

  /**
   * Determine basic recommended action
   */
  static determineBasicAction(categoryResult) {
    const overallScore = categoryResult.overallScore || 0;
    const failedCategories = this.countFailedCategories(categoryResult);

    if (failedCategories === 0) {
      return "continue_to_next_level";
    } else if (overallScore >= 60) {
      return "targeted_intervention";
    } else {
      return "comprehensive_intervention";
    }
  }

  /**
   * Count passed categories
   */
  static countPassedCategories(categoryResult) {
    if (!categoryResult.categories || !Array.isArray(categoryResult.categories)) {
      return 0;
    }

    return categoryResult.categories.filter(category =>
      category.isPassed || (category.score && category.score >= 75)
    ).length;
  }

  /**
   * Count failed categories
   */
  static countFailedCategories(categoryResult) {
    if (!categoryResult.categories || !Array.isArray(categoryResult.categories)) {
      return 0;
    }

    return categoryResult.categories.filter(category =>
      !category.isPassed && (!category.score || category.score < 75)
    ).length;
  }

  /**
   * Generate basic intervention plan
   */
  static generateBasicInterventionPlan(categoryResult) {
    const failedCategories = [];

    if (categoryResult.categories && Array.isArray(categoryResult.categories)) {
      categoryResult.categories.forEach(category => {
        if (!category.isPassed && (!category.score || category.score < 75)) {
          failedCategories.push(category.categoryName);
        }
      });
    }

    if (failedCategories.length === 0) {
      return {
        required: false,
        priority: [],
        specificFocus: {}
      };
    }

    return {
      required: true,
      priority: failedCategories,
      specificFocus: failedCategories.reduce((acc, category) => {
        acc[category] = {
          focus: "general_improvement",
          recommendedActivities: ["review_fundamentals", "practice_exercises"],
          questionDistribution: { "general": 100 }
        };
        return acc;
      }, {})
    };
  }
}

module.exports = IntegrationTriggerService;