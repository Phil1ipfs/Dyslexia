// Real-Time Scoring Service - Ultra Fast Automatic Processing
// Processes student responses and updates category results within seconds

const mongoose = require('mongoose');
const CategoryResultsService = require('./Teachers/CategoryResultsService');
const IntegrationTriggerService = require('./Teachers/PrescriptiveAnalytics/integrationTriggerService');
const NotificationService = require('./NotificationService');

class RealTimeScoringService {

  /**
   * Process student response immediately when it's saved
   * This should trigger within 1-2 seconds of response submission
   */
  static async processResponseImmediately(studentResponse) {
    try {
      console.log(`[REAL-TIME] 🚀 Processing response immediately for student ${studentResponse.studentId}, category ${studentResponse.category}`);
      const startTime = Date.now();

      // Check if this completes a category
      const completionCheck = await this.checkCategoryCompletion(
        studentResponse.studentId,
        studentResponse.category,
        studentResponse.readingLevel
      );

      if (completionCheck.isComplete) {
        console.log(`[REAL-TIME] ✅ Category ${studentResponse.category} completed - triggering automatic scoring`);

        // Trigger immediate category result generation
        const categoryResult = await CategoryResultsService.generateCategoryResultsFromResponses(
          studentResponse.studentId,
          studentResponse.readingLevel,
          studentResponse.category // Process only this specific category
        );

        if (categoryResult) {
          // Trigger prescriptive analysis immediately
          const prescriptiveAnalysis = await IntegrationTriggerService.triggerPrescriptiveAnalysis(categoryResult);

          // 📡 Send real-time notification for category results completion
          await NotificationService.notifyCategoryResultsComplete(studentResponse.studentId, categoryResult);

          // 📡 Send real-time notification for prescriptive analysis completion
          if (prescriptiveAnalysis) {
            await NotificationService.notifyPrescriptiveAnalysisComplete(studentResponse.studentId, prescriptiveAnalysis);
          }

          const processingTime = Date.now() - startTime;
          console.log(`[REAL-TIME] 🎉 Complete processing finished in ${processingTime}ms`);

          return {
            success: true,
            categoryResult: categoryResult,
            prescriptiveAnalysis: prescriptiveAnalysis,
            processingTime: processingTime
          };
        }
      } else {
        console.log(`[REAL-TIME] ⏳ Category ${studentResponse.category} progress: ${completionCheck.progress}`);
      }

      return { success: true, message: 'Response processed, category in progress' };

    } catch (error) {
      console.error('[REAL-TIME] ❌ Error in immediate processing:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Check if a category is complete and ready for scoring
   */
  static async checkCategoryCompletion(studentId, category, readingLevel) {
    try {
      // Get expected question count for this category
      const MainAssessment = require('../models/Teachers/mainAssessmentModel');
      const assessment = await MainAssessment.findOne({
        readingLevel: readingLevel,
        category: category,
        isActive: true
      });

      const expectedQuestions = assessment ? assessment.questions.length : 0;

      // Count current responses
      const StudentResponse = require('../models/Teachers/studentResponseModel');
      const responseCount = await StudentResponse.countDocuments({
        studentId: studentId,
        category: category,
        readingLevel: readingLevel
      });

      const isComplete = responseCount >= expectedQuestions;
      const progress = expectedQuestions > 0 ? `${responseCount}/${expectedQuestions}` : '0/0';

      return {
        isComplete: isComplete,
        progress: progress,
        expectedQuestions: expectedQuestions,
        actualResponses: responseCount
      };

    } catch (error) {
      console.error('[REAL-TIME] Error checking completion:', error);
      return { isComplete: false, progress: 'error' };
    }
  }

  /**
   * Process intervention response immediately
   */
  static async processInterventionResponseImmediately(interventionResponse) {
    try {
      console.log(`[REAL-TIME] 🎯 Processing intervention response for student ${interventionResponse.studentId}`);
      const startTime = Date.now();

      // Check if intervention is complete
      const InterventionAssessment = require('../models/Teachers/ManageProgress/interventionAssessmentModel');
      const intervention = await InterventionAssessment.findById(interventionResponse.interventionAssessmentId);

      if (!intervention) return { success: false, error: 'Intervention not found' };

      // Count intervention responses
      const InterventionResponse = require('../models/Teachers/ManageProgress/interventionResponseModel');
      const responseCount = await InterventionResponse.countDocuments({
        studentId: interventionResponse.studentId,
        interventionAssessmentId: interventionResponse.interventionAssessmentId
      });

      const expectedQuestions = intervention.totalQuestions || intervention.questions?.length || 0;

      if (responseCount >= expectedQuestions) {
        console.log(`[REAL-TIME] ✅ Intervention completed - triggering automatic results generation`);

        // Trigger immediate intervention results generation
        const InterventionGeneratorService = require('./Teachers/InterventionGeneratorService');
        const interventionResults = await InterventionGeneratorService.processInterventionResults(
          interventionResponse.interventionAssessmentId
        );

        // 📡 Send real-time notification for intervention results completion
        if (interventionResults) {
          await NotificationService.notifyInterventionResultsComplete(interventionResponse.studentId, interventionResults);
        }

        const processingTime = Date.now() - startTime;
        console.log(`[REAL-TIME] 🎉 Intervention processing finished in ${processingTime}ms`);

        return {
          success: true,
          interventionResults: interventionResults,
          processingTime: processingTime
        };
      }

      return { success: true, message: 'Intervention response processed, waiting for completion' };

    } catch (error) {
      console.error('[REAL-TIME] ❌ Error processing intervention response:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Batch process any pending responses for faster bulk processing
   */
  static async processPendingResponses() {
    try {
      console.log('[REAL-TIME] 🔄 Processing any pending responses...');

      // Find students with complete responses but no category results
      const pipeline = [
        {
          $group: {
            _id: {
              studentId: '$studentId',
              category: '$category',
              readingLevel: '$readingLevel'
            },
            responseCount: { $sum: 1 },
            latestResponse: { $max: '$answeredAt' }
          }
        },
        {
          $lookup: {
            from: 'category_results',
            let: {
              studentId: '$_id.studentId',
              category: '$_id.category',
              readingLevel: '$_id.readingLevel'
            },
            pipeline: [
              {
                $match: {
                  $expr: {
                    $and: [
                      { $eq: ['$studentId', '$$studentId'] },
                      { $eq: ['$readingLevel', '$$readingLevel'] },
                      { $in: ['$$category', '$categories.categoryName'] }
                    ]
                  }
                }
              }
            ],
            as: 'existingResults'
          }
        },
        {
          $match: {
            'existingResults': { $size: 0 } // No existing category results
          }
        }
      ];

      const testDb = mongoose.connection.useDb('test');
      const pendingGroups = await testDb.collection('student_responses').aggregate(pipeline).toArray();

      console.log(`[REAL-TIME] Found ${pendingGroups.length} pending response groups to process`);

      let processedCount = 0;
      for (const group of pendingGroups) {
        try {
          // Process this group immediately
          const categoryResult = await CategoryResultsService.generateCategoryResultsFromResponses(
            group._id.studentId,
            group._id.readingLevel,
            group._id.category
          );

          if (categoryResult) {
            const prescriptiveAnalysis = await IntegrationTriggerService.triggerPrescriptiveAnalysis(categoryResult);

            // 📡 Send real-time notifications for batch processing
            await NotificationService.notifyCategoryResultsComplete(group._id.studentId, categoryResult);
            if (prescriptiveAnalysis) {
              await NotificationService.notifyPrescriptiveAnalysisComplete(group._id.studentId, prescriptiveAnalysis);
            }

            processedCount++;
            console.log(`[REAL-TIME] ✅ Processed pending: Student ${group._id.studentId}, ${group._id.category}`);
          }
        } catch (error) {
          console.error(`[REAL-TIME] ❌ Error processing pending group:`, error);
        }
      }

      console.log(`[REAL-TIME] 🎉 Batch processing complete: ${processedCount}/${pendingGroups.length} processed`);
      return { success: true, processed: processedCount, total: pendingGroups.length };

    } catch (error) {
      console.error('[REAL-TIME] ❌ Error in batch processing:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Start real-time monitoring service
   */
  static startRealTimeMonitoring() {
    console.log('[REAL-TIME] 🚀 Starting real-time scoring monitoring...');

    // Check for pending responses every 30 seconds
    setInterval(async () => {
      try {
        await this.processPendingResponses();
      } catch (error) {
        console.error('[REAL-TIME] Monitoring error:', error);
      }
    }, 30000); // 30 seconds

    console.log('[REAL-TIME] ✅ Real-time monitoring service started');
  }
}

module.exports = RealTimeScoringService;