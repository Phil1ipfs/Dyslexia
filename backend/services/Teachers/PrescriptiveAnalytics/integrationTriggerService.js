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
      console.log(`[INTEGRATION TRIGGER] Triggering prescriptive analysis for student ${categoryResult.studentId}`);
      
      // Validate category result
      if (!categoryResult || !categoryResult._id || !categoryResult.studentId) {
        console.error('[INTEGRATION TRIGGER] Invalid category result provided');
        return null;
      }
      
      // Check if prescriptive analysis already exists for this category result
      const existingAnalysis = await this.checkExistingAnalysis(categoryResult._id);
      if (existingAnalysis) {
        console.log(`[INTEGRATION TRIGGER] Prescriptive analysis already exists for category result ${categoryResult._id}`);
        return existingAnalysis;
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
}

module.exports = IntegrationTriggerService;