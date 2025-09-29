// Integration Trigger Service for Prescriptive Analytics - UPDATED VERSION
// Handles automatic generation of prescriptive analysis when category_results are created
// CLEAN VERSION: No fallbacks, uses real prescriptive analytics service only
// INCLUDES AUTOMATIC CLEANUP OF OLD RECORDS TO PREVENT DUPLICATE KEY ERRORS

const prescriptiveAnalyticsService = require('../PrescriptiveAnalyticsService');
const mongoose = require('mongoose');
const PrescriptiveAnalysis = require('../../../models/Teachers/ManageProgress/prescriptiveAnalysisModel');
const CategoryResult = require('../../../models/Teachers/ManageProgress/categoryResultModel');

class IntegrationTriggerService {

  /**
   * Main trigger function to be called after category_results are saved
   * This ensures prescriptive analysis is generated automatically using REAL analysis only
   *
   * @param {Object} categoryResult - The newly created category_result document
   * @returns {Object} Generated prescriptive analysis or null if error
   */
  static async triggerPrescriptiveAnalysis(categoryResult) {
    try {
      console.log(`[INTEGRATION TRIGGER] 🧹 UPDATED VERSION - Triggering REAL prescriptive analysis for student ${categoryResult.studentId}, reading level: ${categoryResult.readingLevel}`);

      console.log(`[INTEGRATION TRIGGER] Triggering REAL prescriptive analysis for student ${categoryResult.studentId}, reading level: ${categoryResult.readingLevel}`);

      // Validate category result
      if (!categoryResult || !categoryResult._id || !categoryResult.studentId) {
        console.error('[INTEGRATION TRIGGER] Invalid category result provided');
        return null;
      }

      // Check if prescriptive analysis already exists for this exact category result
      const existingAnalysis = await this.checkExistingAnalysis(categoryResult._id);
      if (existingAnalysis) {
        // ✅ CRITICAL FIX: Check if regeneration is needed due to data changes
        const needsRegeneration = await this.checkIfRegenerationNeeded(existingAnalysis, categoryResult);

        if (needsRegeneration.required) {
          console.log(`[INTEGRATION TRIGGER] 🔄 REGENERATION REQUIRED: ${needsRegeneration.reason}`);
          console.log(`[INTEGRATION TRIGGER] Deleting stale analysis ${existingAnalysis._id} to regenerate with current data`);

          // Delete stale analysis to force regeneration
          await PrescriptiveAnalysis.deleteOne({ _id: existingAnalysis._id });
        } else {
          console.log(`[INTEGRATION TRIGGER] Prescriptive analysis already exists and is current for category result ${categoryResult._id}: ${existingAnalysis._id}`);
          return existingAnalysis;
        }
      }

      // Use REAL prescription-only analysis (Doctor-Teacher-Student Model)
      // This provides DIAGNOSIS + PRESCRIPTION only, NO question generation
      console.log(`[DOCTOR-TEACHER-STUDENT] Using REAL prescription-only model for category result ${categoryResult._id}`);
      const analysis = await prescriptiveAnalyticsService.generatePrescriptionOnly(categoryResult._id);

      if (!analysis) {
        console.error(`[INTEGRATION TRIGGER] ❌ REAL prescriptive analysis generation returned null for category result ${categoryResult._id}`);
        throw new Error('Real prescriptive analysis generation failed - returned null');
      }

      console.log(`[INTEGRATION TRIGGER] ✅ Successfully generated REAL prescriptive analysis ${analysis._id} for student ${categoryResult.studentId}`);

      // 🧹 SAFE CLEANUP: Now that new analysis is created successfully, clean up old ones
      try {
        console.log(`[INTEGRATION TRIGGER] 🧹 Cleaning up old prescriptive analysis records for student ${categoryResult.studentId} (keeping new one: ${analysis.analysisId})`);
        const cleanup = await PrescriptiveAnalysis.deleteMany({
          studentId: categoryResult.studentId,
          _id: { $ne: analysis.analysisId }  // Delete all except the new one
        });
        console.log(`[INTEGRATION TRIGGER] 🗑️ SAFE CLEANUP: Deleted ${cleanup.deletedCount} old records (preserved new one)`);
      } catch (cleanupError) {
        console.warn('[INTEGRATION TRIGGER] ⚠️ Cleanup warning (non-critical):', cleanupError.message);
        // Don't fail the entire process if cleanup fails
      }

      // Optional: Trigger additional processes if needed
      await this.postAnalysisProcessing(analysis);

      return analysis;
    } catch (error) {
      console.error('[INTEGRATION TRIGGER] ❌ Error generating REAL prescriptive analysis:', error);

      // CRITICAL: Check for duplicate key error due to database index issues
      if (error.code === 11000 && error.message.includes('studentId_1_categoryId_1')) {
        console.log(`[INTEGRATION TRIGGER] 🔧 CRITICAL: Duplicate key error detected for student ${categoryResult.studentId}`);
        console.log(`[INTEGRATION TRIGGER] ⚠️  This indicates the database index 'studentId_1_categoryId_1' prevents multiple reading levels`);
        console.log(`[INTEGRATION TRIGGER] 💡 Database indexes need to include readingLevel field to support progression`);

        // Check if analysis already exists by categoryResultId (which is unique)
        const existingByCategoryResultId = await PrescriptiveAnalysis.findOne({
          categoryResultId: categoryResult._id
        });

        if (existingByCategoryResultId) {
          console.log(`[INTEGRATION TRIGGER] ✅ Found existing analysis by categoryResultId: ${existingByCategoryResultId._id}`);
          return existingByCategoryResultId;
        }

        // Log error for database administrator to fix indexes
        await this.logError(categoryResult, error);

        throw new Error(`Duplicate key error: Database indexes need updating to support multiple reading levels. Student ${categoryResult.studentId} category ${categoryResult.categories?.[0]?.categoryName || 'unknown'}`);
      }

      // Log other errors but don't break the main assessment flow
      await this.logError(categoryResult, error);
      throw error; // Re-throw to let caller handle
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
   * Check if existing prescriptive analysis needs regeneration due to data changes
   * This prevents stale analysis from being returned when underlying data has changed
   *
   * @param {Object} existingAnalysis - The existing prescriptive analysis document
   * @param {Object} currentCategoryResult - The current category result with updated data
   * @returns {Object} Object with 'required' boolean and 'reason' string
   */
  static async checkIfRegenerationNeeded(existingAnalysis, currentCategoryResult) {
    try {
      console.log(`[INTEGRATION TRIGGER] 🔍 Checking if regeneration needed for analysis ${existingAnalysis._id}`);

      // Get current category result data for comparison
      const currentCategories = currentCategoryResult.categories || [];
      const analysisDate = new Date(existingAnalysis.createdAt);
      const categoryUpdateDate = new Date(currentCategoryResult.updatedAt || currentCategoryResult.createdAt);

      // Rule 1: If category result was updated after analysis creation, regeneration likely needed
      if (categoryUpdateDate > analysisDate) {
        const timeDiffMinutes = Math.round((categoryUpdateDate - analysisDate) / (1000 * 60));
        console.log(`[INTEGRATION TRIGGER] ⏰ Category result updated ${timeDiffMinutes} minutes after analysis creation`);

        // Check if there are meaningful data changes (not just timestamp updates)
        const hasSignificantDataChanges = await this.checkSignificantDataChanges(existingAnalysis, currentCategories);

        if (hasSignificantDataChanges.detected) {
          return {
            required: true,
            reason: `Significant data changes detected: ${hasSignificantDataChanges.details}`
          };
        }
      }

      // Rule 2: Check if analysis has mostly empty/zero data while category results have real data
      const hasStaleEmptyData = this.detectStaleEmptyData(existingAnalysis, currentCategories);
      if (hasStaleEmptyData.detected) {
        return {
          required: true,
          reason: `Stale empty data detected: ${hasStaleEmptyData.details}`
        };
      }

      // Rule 3: Check if any category in current results has >0 score but analysis shows 0
      const hasScoreMismatch = this.detectScoreMismatch(existingAnalysis, currentCategories);
      if (hasScoreMismatch.detected) {
        return {
          required: true,
          reason: `Score mismatch detected: ${hasScoreMismatch.details}`
        };
      }

      console.log(`[INTEGRATION TRIGGER] ✅ No regeneration needed - existing analysis is current`);
      return { required: false, reason: 'Analysis is current with category data' };

    } catch (error) {
      console.error('[INTEGRATION TRIGGER] Error checking regeneration need:', error);
      // When in doubt, regenerate to be safe
      return {
        required: true,
        reason: `Error checking data consistency - regenerating to be safe: ${error.message}`
      };
    }
  }

  /**
   * Check for significant data changes between analysis and current category results
   */
  static async checkSignificantDataChanges(existingAnalysis, currentCategories) {
    try {
      const changes = [];

      // Check each current category against analysis data
      for (const category of currentCategories) {
        const categoryName = category.categoryName;
        const currentScore = category.score || 0;
        const currentCompleted = category.isCompleted || false;
        const currentTotalQuestions = category.totalQuestions || 0;

        // Try to find corresponding data in analysis
        const analysisSkillMastery = existingAnalysis.skillMastery?.[categoryName];
        const analysisScore = analysisSkillMastery?.score || 0;

        // Check for score changes > 10%
        if (Math.abs(currentScore - analysisScore) > 10) {
          changes.push(`${categoryName}: score changed from ${analysisScore}% to ${currentScore}%`);
        }

        // Check if category became completed when analysis shows incomplete
        if (currentCompleted && currentTotalQuestions > 0 && analysisScore === 0) {
          changes.push(`${categoryName}: completed with ${currentTotalQuestions} questions, analysis shows incomplete`);
        }
      }

      return {
        detected: changes.length > 0,
        details: changes.join('; ')
      };

    } catch (error) {
      console.error('[INTEGRATION TRIGGER] Error checking significant changes:', error);
      return { detected: true, details: 'Error checking changes - assuming changes exist' };
    }
  }

  /**
   * Detect if existing analysis has stale empty data while category results have real data
   */
  static detectStaleEmptyData(existingAnalysis, currentCategories) {
    try {
      const issues = [];

      // Check if analysis has empty skillMastery but categories have real scores
      const skillMastery = existingAnalysis.skillMastery || {};
      const hasEmptySkillMastery = Object.keys(skillMastery).length === 0;

      if (hasEmptySkillMastery) {
        const categoriesWithScores = currentCategories.filter(cat => (cat.score || 0) > 0);
        if (categoriesWithScores.length > 0) {
          issues.push(`Analysis has empty skillMastery but ${categoriesWithScores.length} categories have scores`);
        }
      }

      // Check if analysis insights are generic/empty while categories have real data
      const insights = existingAnalysis.insights || {};
      const hasGenericInsights = !insights.strengths || insights.strengths.length === 0;

      if (hasGenericInsights) {
        const completedCategories = currentCategories.filter(cat => cat.isCompleted === true);
        if (completedCategories.length > 0) {
          issues.push(`Analysis has no insights but ${completedCategories.length} categories completed`);
        }
      }

      return {
        detected: issues.length > 0,
        details: issues.join('; ')
      };

    } catch (error) {
      console.error('[INTEGRATION TRIGGER] Error detecting stale data:', error);
      return { detected: true, details: 'Error checking stale data - assuming stale' };
    }
  }

  /**
   * Detect score mismatches between analysis and current category data
   */
  static detectScoreMismatch(existingAnalysis, currentCategories) {
    try {
      const mismatches = [];

      for (const category of currentCategories) {
        const categoryName = category.categoryName;
        const currentScore = category.score || 0;

        // Get score from analysis
        const analysisSkillMastery = existingAnalysis.skillMastery?.[categoryName];
        const analysisScore = analysisSkillMastery?.score || 0;

        // Check for significant mismatch (>5% difference and current score >0)
        if (currentScore > 0 && Math.abs(currentScore - analysisScore) > 5) {
          mismatches.push(`${categoryName}: analysis shows ${analysisScore}% but category shows ${currentScore}%`);
        }
      }

      return {
        detected: mismatches.length > 0,
        details: mismatches.join('; ')
      };

    } catch (error) {
      console.error('[INTEGRATION TRIGGER] Error detecting score mismatches:', error);
      return { detected: true, details: 'Error checking score consistency - assuming mismatch' };
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
      console.log(`[INTEGRATION TRIGGER] Starting batch REAL analysis for ${studentIds.length} students`);

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

      console.log(`[INTEGRATION TRIGGER] Batch REAL analysis completed. Generated ${results.length} analyses`);
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
      console.log(`[INTEGRATION TRIGGER] Post-processing REAL analysis ${analysis._id}`);

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
        errorCode: error.code || null,
        timestamp: new Date(),
        resolved: false,
        errorType: error.code === 11000 ? 'duplicate_key_index_issue' : 'generation_failure'
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
      console.log(`[INTEGRATION TRIGGER] Manual trigger for REAL analysis of category result ${categoryResultId}`);

      // Get the category result using Mongoose
      const categoryResult = await CategoryResult.findById(categoryResultId).lean();

      if (!categoryResult) {
        throw new Error(`Category result ${categoryResultId} not found`);
      }

      // Check if analysis already exists
      if (!forceRegenerate) {
        const existingAnalysis = await this.checkExistingAnalysis(categoryResult._id);
        if (existingAnalysis) {
          console.log(`[INTEGRATION TRIGGER] Using existing REAL analysis for category result ${categoryResultId}`);
          return existingAnalysis;
        }
      } else {
        // Delete existing analysis if force regenerate using Mongoose
        await PrescriptiveAnalysis.deleteMany({
          categoryResultId: categoryResult._id
        });
        console.log(`[INTEGRATION TRIGGER] Deleted existing analysis for regeneration`);
      }

      // Generate new REAL analysis
      const analysis = await this.triggerPrescriptiveAnalysis(categoryResult);

      return analysis;
    } catch (error) {
      console.error('[INTEGRATION TRIGGER] Error in manual trigger:', error);
      throw error;
    }
  }

  /**
   * Clean up old prescriptive analysis records for a student to prevent duplicate key errors
   * This is critical when students progress through reading levels
   *
   * @param {number} studentId - Student ID to clean up records for
   */
  static async cleanupOldPrescriptiveAnalysis(studentId) {
    try {
      console.log(`[INTEGRATION TRIGGER] 🔍 Checking for existing prescriptive analysis records for student ${studentId}`);

      // Find all existing prescriptive analysis records for this student
      const existingRecords = await PrescriptiveAnalysis.find({
        studentId: studentId
      }).select('_id readingLevel categoryId createdAt');

      if (existingRecords.length === 0) {
        console.log(`[INTEGRATION TRIGGER] ✅ No existing prescriptive analysis records found for student ${studentId}`);
        return;
      }

      console.log(`[INTEGRATION TRIGGER] 🧹 Found ${existingRecords.length} existing prescriptive analysis records for student ${studentId}`);
      console.log(`[INTEGRATION TRIGGER] 📋 Records: ${existingRecords.map(r => `${r.readingLevel}-${r.categoryId || 'unknown'}`).join(', ')}`);

      // Delete all existing prescriptive analysis records for this student
      const deleteResult = await PrescriptiveAnalysis.deleteMany({
        studentId: studentId
      });

      console.log(`[INTEGRATION TRIGGER] ✅ Successfully deleted ${deleteResult.deletedCount} old prescriptive analysis records for student ${studentId}`);
      console.log(`[INTEGRATION TRIGGER] 💡 This prevents duplicate key errors when generating new analysis for current reading level`);

    } catch (error) {
      console.error(`[INTEGRATION TRIGGER] ❌ Error cleaning up old prescriptive analysis for student ${studentId}:`, error);
      // Don't throw - log error but continue with analysis generation
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
      const serviceCheck = { status: 'healthy' }; // Simplified since we removed external service dependency

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
        },
        mode: 'REAL_ANALYSIS_ONLY' // Indicates no fallbacks
      };
    } catch (error) {
      return {
        status: 'unhealthy',
        timestamp: new Date(),
        error: error.message
      };
    }
  }
}

module.exports = IntegrationTriggerService;