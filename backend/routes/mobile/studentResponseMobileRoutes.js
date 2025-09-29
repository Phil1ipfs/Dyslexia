// routes/mobile/studentResponseMobileRoutes.js
const express = require('express');
const router = express.Router();
const RealTimeStudentProcessor = require('../../services/mobile/RealTimeStudentProcessor');
const WebSocketService = require('../../services/mobile/WebSocketService');
const mongoose = require('mongoose');

/**
 * Enhanced Student Response Routes for Mobile
 * Real-time processing with immediate feedback and category result updates
 */

// Submit student response with real-time processing
router.post('/submit', async (req, res) => {
  try {
    const {
      studentId,
      questionId,
      category,
      response,
      isCorrect,
      responseTime,
      readingLevel,
      totalMatches,
      correctMatches
    } = req.body;

    console.log(`[MOBILE RESPONSE] Processing response from student ${studentId}: ${questionId}`);

    // Basic validation
    if (!studentId || !questionId || !category) {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields: studentId, questionId, category',
        required: ['studentId', 'questionId', 'category']
      });
    }

    const startTime = Date.now();

    // Save response to database first
    const savedResponse = await saveStudentResponseToDatabase({
      studentId,
      questionId,
      category,
      response,
      isCorrect,
      responseTime,
      readingLevel,
      totalMatches,
      correctMatches
    });

    // Process response in real-time
    const processingResult = await RealTimeStudentProcessor.processStudentResponseRealTime(studentId, {
      questionId,
      category,
      response,
      isCorrect,
      responseTime: responseTime || 0,
      readingLevel,
      totalMatches,
      correctMatches
    });

    const totalProcessingTime = Date.now() - startTime;

    console.log(`[MOBILE RESPONSE] ✅ Response processed in ${totalProcessingTime}ms for student ${studentId}`);

    // Send real-time update via WebSocket
    WebSocketService.sendToStudent(studentId, 'response_processed', {
      questionId,
      category,
      isCorrect,
      categoryUpdate: processingResult.categoryUpdate,
      processingTime: totalProcessingTime
    });

    // Return response based on processing status
    if (processingResult.status === 'assessment_complete') {
      return res.json({
        success: true,
        status: 'assessment_complete',
        message: 'Assessment completed successfully!',
        data: {
          response: {
            questionId,
            isCorrect,
            savedAt: savedResponse.createdAt
          },
          categoryUpdate: processingResult.categoryUpdate,
          finalResults: {
            overallScore: processingResult.finalResults.overallScore,
            allCategoriesPassed: processingResult.finalResults.allCategoriesPassed,
            performance: processingResult.finalResults.summary.performance,
            nextAction: processingResult.finalResults.summary.nextAction
          },
          processingTime: totalProcessingTime,
          timestamp: new Date().toISOString()
        }
      });
    }

    return res.json({
      success: true,
      status: 'response_processed',
      message: 'Response processed successfully',
      data: {
        response: {
          questionId,
          isCorrect,
          savedAt: savedResponse.createdAt
        },
        categoryUpdate: processingResult.categoryUpdate,
        completionStatus: processingResult.completionStatus,
        processingTime: totalProcessingTime,
        timestamp: new Date().toISOString()
      }
    });

  } catch (error) {
    console.error(`[MOBILE RESPONSE] Error processing response:`, error);

    // Send error notification via WebSocket
    if (req.body.studentId) {
      WebSocketService.sendToStudent(req.body.studentId, 'processing_error', {
        questionId: req.body.questionId,
        error: 'Response processing failed. Please try again.',
        timestamp: new Date().toISOString()
      });
    }

    res.status(500).json({
      success: false,
      message: 'Error processing student response',
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

// Batch submit multiple responses (for offline sync)
router.post('/batch-submit', async (req, res) => {
  try {
    const { studentId, responses } = req.body;

    if (!studentId || !Array.isArray(responses) || responses.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'studentId and responses array are required'
      });
    }

    if (responses.length > 50) {
      return res.status(400).json({
        success: false,
        message: 'Maximum 50 responses per batch'
      });
    }

    console.log(`[MOBILE RESPONSE] Batch processing ${responses.length} responses for student ${studentId}`);

    const startTime = Date.now();
    const results = [];
    let lastProcessingResult = null;

    // Process responses in order
    for (let i = 0; i < responses.length; i++) {
      const responseData = responses[i];

      try {
        // Save to database
        const savedResponse = await saveStudentResponseToDatabase({
          studentId,
          ...responseData
        });

        // Process in real-time
        const processingResult = await RealTimeStudentProcessor.processStudentResponseRealTime(studentId, {
          ...responseData,
          responseTime: responseData.responseTime || 0
        });

        results.push({
          questionId: responseData.questionId,
          success: true,
          isCorrect: responseData.isCorrect,
          categoryUpdate: processingResult.categoryUpdate,
          status: processingResult.status
        });

        lastProcessingResult = processingResult;

        // Small delay between responses to prevent overwhelming
        if (i < responses.length - 1) {
          await new Promise(resolve => setTimeout(resolve, 100));
        }

      } catch (error) {
        console.error(`[MOBILE RESPONSE] Error processing response ${i + 1}:`, error);
        results.push({
          questionId: responseData.questionId,
          success: false,
          error: error.message
        });
      }
    }

    const totalProcessingTime = Date.now() - startTime;
    const successCount = results.filter(r => r.success).length;
    const errorCount = results.filter(r => !r.success).length;

    console.log(`[MOBILE RESPONSE] ✅ Batch complete: ${successCount} success, ${errorCount} errors in ${totalProcessingTime}ms`);

    // Send batch completion via WebSocket
    WebSocketService.sendToStudent(studentId, 'batch_processed', {
      totalResponses: responses.length,
      successful: successCount,
      errors: errorCount,
      finalStatus: lastProcessingResult?.status || 'responses_processed',
      processingTime: totalProcessingTime
    });

    res.json({
      success: true,
      message: `Batch processing completed: ${successCount}/${responses.length} successful`,
      data: {
        results,
        summary: {
          total: responses.length,
          successful: successCount,
          errors: errorCount,
          finalStatus: lastProcessingResult?.status || 'responses_processed',
          assessmentComplete: lastProcessingResult?.status === 'assessment_complete'
        },
        finalResults: lastProcessingResult?.status === 'assessment_complete' ? lastProcessingResult.finalResults : null,
        processingTime: totalProcessingTime,
        timestamp: new Date().toISOString()
      }
    });

  } catch (error) {
    console.error(`[MOBILE RESPONSE] Batch processing error:`, error);
    res.status(500).json({
      success: false,
      message: 'Batch processing failed',
      error: error.message
    });
  }
});

// Get current assessment progress
router.get('/progress/:studentId', async (req, res) => {
  try {
    const { studentId } = req.params;

    const progress = RealTimeStudentProcessor.getAssessmentProgress(studentId);

    if (!progress) {
      return res.json({
        success: true,
        data: {
          studentId: parseInt(studentId),
          hasActiveAssessment: false,
          message: 'No active assessment found'
        }
      });
    }

    res.json({
      success: true,
      data: {
        studentId: progress.studentId,
        hasActiveAssessment: true,
        startTime: progress.startTime,
        totalResponses: progress.totalResponses,
        categoriesAttempted: progress.categoriesAttempted,
        lastActivity: progress.lastActivity,
        durationMs: progress.duration,
        durationFormatted: formatDuration(progress.duration)
      }
    });

  } catch (error) {
    console.error(`[MOBILE RESPONSE] Error getting progress:`, error);
    res.status(500).json({
      success: false,
      message: 'Error retrieving assessment progress',
      error: error.message
    });
  }
});

// Start assessment session (mobile app initialization)
router.post('/start-assessment', async (req, res) => {
  try {
    const { studentId, studentName, readingLevel } = req.body;

    if (!studentId) {
      return res.status(400).json({
        success: false,
        message: 'studentId is required'
      });
    }

    console.log(`[MOBILE RESPONSE] Starting assessment session for student ${studentId} (${studentName})`);

    // Initialize session tracking
    const sessionInfo = {
      studentId,
      studentName,
      readingLevel,
      sessionStarted: new Date(),
      platform: 'mobile'
    };

    // Send WebSocket notification
    WebSocketService.sendToStudent(studentId, 'assessment_started', sessionInfo);

    res.json({
      success: true,
      message: 'Assessment session started',
      data: sessionInfo
    });

  } catch (error) {
    console.error(`[MOBILE RESPONSE] Error starting assessment:`, error);
    res.status(500).json({
      success: false,
      message: 'Error starting assessment session',
      error: error.message
    });
  }
});

// End assessment session
router.post('/end-assessment', async (req, res) => {
  try {
    const { studentId } = req.body;

    if (!studentId) {
      return res.status(400).json({
        success: false,
        message: 'studentId is required'
      });
    }

    console.log(`[MOBILE RESPONSE] Ending assessment session for student ${studentId}`);

    const progress = RealTimeStudentProcessor.getAssessmentProgress(studentId);

    // Send WebSocket notification
    WebSocketService.sendToStudent(studentId, 'assessment_ended', {
      studentId,
      endTime: new Date(),
      finalProgress: progress
    });

    res.json({
      success: true,
      message: 'Assessment session ended',
      data: {
        studentId,
        endTime: new Date(),
        finalProgress: progress
      }
    });

  } catch (error) {
    console.error(`[MOBILE RESPONSE] Error ending assessment:`, error);
    res.status(500).json({
      success: false,
      message: 'Error ending assessment session',
      error: error.message
    });
  }
});

// Get real-time statistics for active assessments (for monitoring)
router.get('/active-assessments', async (req, res) => {
  try {
    const activeAssessments = RealTimeStudentProcessor.getAllActiveAssessments();

    res.json({
      success: true,
      data: {
        totalActive: activeAssessments.length,
        assessments: activeAssessments.map(assessment => ({
          studentId: assessment.studentId,
          startTime: assessment.startTime,
          totalResponses: assessment.totalResponses,
          categoriesAttempted: assessment.categoriesAttempted,
          lastActivity: assessment.lastActivity,
          durationMs: assessment.duration,
          durationFormatted: formatDuration(assessment.duration)
        }))
      },
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error(`[MOBILE RESPONSE] Error getting active assessments:`, error);
    res.status(500).json({
      success: false,
      message: 'Error retrieving active assessments',
      error: error.message
    });
  }
});

/**
 * Helper function to save student response to database
 */
async function saveStudentResponseToDatabase(responseData) {
  try {
    const testDb = mongoose.connection.useDb('test');
    const studentResponsesCollection = testDb.collection('student_responses');

    const document = {
      studentId: parseInt(responseData.studentId),
      questionId: responseData.questionId,
      category: responseData.category,
      response: responseData.response,
      isCorrect: responseData.isCorrect,
      responseTime: responseData.responseTime || 0,
      answeredAt: new Date(),
      createdAt: new Date(),
      readingLevel: responseData.readingLevel
    };

    // Add category-specific fields
    if (responseData.category === 'Phonological Awareness') {
      document.totalMatches = responseData.totalMatches || 0;
      document.correctMatches = responseData.correctMatches || 0;
    }

    const result = await studentResponsesCollection.insertOne(document);

    return {
      _id: result.insertedId,
      createdAt: document.createdAt
    };

  } catch (error) {
    console.error(`[MOBILE RESPONSE] Error saving to database:`, error);
    throw error;
  }
}

/**
 * Helper function to format duration
 */
function formatDuration(milliseconds) {
  const seconds = Math.floor(milliseconds / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);

  if (hours > 0) {
    return `${hours}h ${minutes % 60}m ${seconds % 60}s`;
  } else if (minutes > 0) {
    return `${minutes}m ${seconds % 60}s`;
  } else {
    return `${seconds}s`;
  }
}

module.exports = router;