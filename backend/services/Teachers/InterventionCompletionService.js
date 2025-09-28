const InterventionResponse = require('../../models/Teachers/ManageProgress/interventionResponseModel');
const InterventionAssessment = require('../../models/Teachers/ManageProgress/interventionAssessmentModel');
const InterventionGeneratorService = require('./InterventionGeneratorService');

/**
 * Service to automatically detect and process intervention completion
 * This service should be called whenever an intervention_response is created
 * to check if all questions have been answered and trigger automatic processing
 */
class InterventionCompletionService {

  /**
   * Automatically check and process intervention completion
   * This method should be called after every intervention_response is created
   * @param {string} interventionAssessmentId - Intervention Assessment ID
   * @param {number} studentId - Student ID
   * @returns {Object} Completion status and processing results
   */
  static async checkAndProcessCompletion(interventionAssessmentId, studentId) {
    try {
      console.log(`[INTERVENTION COMPLETION] Checking completion for intervention ${interventionAssessmentId}, student ${studentId}`);

      // 1. Get intervention assessment to know expected question count
      const intervention = await InterventionAssessment.findById(interventionAssessmentId);
      if (!intervention) {
        console.error(`[INTERVENTION COMPLETION] Intervention assessment not found: ${interventionAssessmentId}`);
        return { completed: false, reason: 'intervention_not_found' };
      }

      const expectedQuestions = intervention.totalQuestions || intervention.questions?.length || 0;
      console.log(`[INTERVENTION COMPLETION] Expected questions: ${expectedQuestions}`);

      // 2. Count current intervention responses
      const responseCount = await InterventionResponse.countDocuments({
        interventionAssessmentId: interventionAssessmentId,
        studentId: studentId
      });

      console.log(`[INTERVENTION COMPLETION] Current responses: ${responseCount}/${expectedQuestions}`);

      // 3. Check if intervention is complete
      const isComplete = responseCount >= expectedQuestions;

      if (!isComplete) {
        console.log(`[INTERVENTION COMPLETION] Intervention not yet complete (${responseCount}/${expectedQuestions})`);
        return {
          completed: false,
          responseCount: responseCount,
          expectedCount: expectedQuestions,
          remaining: expectedQuestions - responseCount
        };
      }

      // 4. Check if already processed (VERSION-AWARE duplicate prevention)
      if (intervention.completedAt || intervention.interventionResultsId) {
        console.log(`[INTERVENTION COMPLETION] Checking existing processing - completedAt: ${intervention.completedAt}, resultsId: ${intervention.interventionResultsId}`);

        // VERSION-AWARE CHECK: Verify if existing results match current revision
        if (intervention.interventionResultsId) {
          const InterventionResults = require('../../models/Teachers/ManageProgress/interventionResultsModel');
          const existingResults = await InterventionResults.findById(intervention.interventionResultsId);

          if (existingResults) {
            const currentRevision = intervention.revisionNumber || 1;
            const resultsRevision = existingResults.revisionNumber || 1;

            console.log(`[INTERVENTION COMPLETION] Existing results revision: ${resultsRevision}, Current intervention revision: ${currentRevision}`);

            if (resultsRevision === currentRevision) {
              console.log(`[INTERVENTION COMPLETION] ✅ Results already exist for revision ${currentRevision} - skipping processing`);
              return {
                completed: true,
                alreadyProcessed: true,
                reason: 'intervention_already_processed_for_revision',
                revisionNumber: currentRevision
              };
            } else {
              console.log(`[INTERVENTION COMPLETION] 🔄 Revision mismatch detected - allowing reprocessing for revision ${currentRevision}`);
              // Continue to processing - different revision needs new results
            }
          } else {
            console.log(`[INTERVENTION COMPLETION] ⚠️ Linked results not found - allowing reprocessing`);
            // Continue to processing - linked results don't exist
          }
        } else {
          console.log(`[INTERVENTION COMPLETION] ⚠️ No results linked despite completedAt - allowing reprocessing`);
          // Continue to processing - no results linked
        }
      }

      // 5. INTERVENTION IS COMPLETE - TRIGGER AUTOMATIC PROCESSING
      console.log(`[INTERVENTION COMPLETION] ✅ INTERVENTION COMPLETE - TRIGGERING AUTOMATIC PROCESSING`);

      const processingResults = await InterventionGeneratorService.processInterventionResults(interventionAssessmentId);

      // 6. Mark intervention as completed
      await InterventionAssessment.findByIdAndUpdate(interventionAssessmentId, {
        completedAt: new Date(),
        interventionResultsId: processingResults.interventionResultsId
      });

      console.log(`[INTERVENTION COMPLETION] ✅ AUTOMATIC PROCESSING COMPLETE`);
      console.log(`[INTERVENTION COMPLETION] Results:`, {
        score: processingResults.score,
        passed: processingResults.isPassed,
        interventionResultsId: processingResults.interventionResultsId
      });

      return {
        completed: true,
        autoProcessed: true,
        results: processingResults,
        responseCount: responseCount,
        expectedCount: expectedQuestions
      };

    } catch (error) {
      console.error(`[INTERVENTION COMPLETION] Error in automatic completion processing:`, error);
      return {
        completed: false,
        error: error.message,
        reason: 'processing_error'
      };
    }
  }

  /**
   * Manual trigger for intervention completion processing
   * Used for testing or manual processing of missed interventions
   * @param {string} interventionAssessmentId - Intervention Assessment ID
   * @returns {Object} Processing results
   */
  static async manuallyProcessIntervention(interventionAssessmentId) {
    try {
      console.log(`[INTERVENTION COMPLETION] Manual processing triggered for intervention ${interventionAssessmentId}`);

      const intervention = await InterventionAssessment.findById(interventionAssessmentId);
      if (!intervention) {
        throw new Error(`Intervention assessment not found: ${interventionAssessmentId}`);
      }

      // Force processing regardless of current state
      const processingResults = await InterventionGeneratorService.processInterventionResults(interventionAssessmentId);

      // Mark as completed
      await InterventionAssessment.findByIdAndUpdate(interventionAssessmentId, {
        completedAt: new Date(),
        interventionResultsId: processingResults.interventionResultsId
      });

      console.log(`[INTERVENTION COMPLETION] Manual processing complete for intervention ${interventionAssessmentId}`);
      return processingResults;

    } catch (error) {
      console.error(`[INTERVENTION COMPLETION] Error in manual processing:`, error);
      throw error;
    }
  }

  /**
   * Get intervention completion status without processing
   * @param {string} interventionAssessmentId - Intervention Assessment ID
   * @param {number} studentId - Student ID
   * @returns {Object} Completion status
   */
  static async getCompletionStatus(interventionAssessmentId, studentId) {
    try {
      const intervention = await InterventionAssessment.findById(interventionAssessmentId);
      if (!intervention) {
        return { found: false, reason: 'intervention_not_found' };
      }

      const expectedQuestions = intervention.totalQuestions || intervention.questions?.length || 0;
      const responseCount = await InterventionResponse.countDocuments({
        interventionAssessmentId: interventionAssessmentId,
        studentId: studentId
      });

      const isComplete = responseCount >= expectedQuestions;
      const isProcessed = intervention.completedAt && intervention.interventionResultsId;

      return {
        found: true,
        interventionId: interventionAssessmentId,
        studentId: studentId,
        category: intervention.category,
        expectedQuestions: expectedQuestions,
        responseCount: responseCount,
        isComplete: isComplete,
        isProcessed: isProcessed,
        completedAt: intervention.completedAt,
        resultsId: intervention.interventionResultsId,
        status: !isComplete ? 'in_progress' : (isProcessed ? 'processed' : 'ready_for_processing')
      };
    } catch (error) {
      console.error(`[INTERVENTION COMPLETION] Error getting completion status:`, error);
      return { found: false, error: error.message };
    }
  }
}

module.exports = InterventionCompletionService;