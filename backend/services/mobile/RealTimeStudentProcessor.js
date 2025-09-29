// services/mobile/RealTimeStudentProcessor.js
const EventEmitter = require('events');
const CategoryResultsOptimizedService = require('../Teachers/CategoryResultsOptimizedService');

/**
 * Real-time Student Response Processor
 * Processes student responses as they come in and updates category results in real-time
 */
class RealTimeStudentProcessor extends EventEmitter {
  constructor() {
    super();
    this.processingQueue = new Map();
    this.activeAssessments = new Map(); // Track ongoing assessments
  }

  /**
   * Process student response immediately and update category results incrementally
   */
  async processStudentResponseRealTime(studentId, responseData) {
    try {
      console.log(`[REAL-TIME] Processing response for student ${studentId}, question: ${responseData.questionId}`);

      const startTime = Date.now();

      // Add to active assessment tracking
      this.trackActiveAssessment(studentId, responseData);

      // Process the response immediately
      const processedResponse = await this.validateAndProcessResponse(studentId, responseData);

      // Update incremental category results
      const categoryUpdate = await this.updateCategoryResultsIncremental(studentId, processedResponse);

      // Emit real-time update event
      this.emit('studentProgress', {
        studentId,
        questionId: responseData.questionId,
        category: responseData.category,
        isCorrect: processedResponse.isCorrect,
        categoryUpdate,
        timestamp: new Date().toISOString(),
        processingTime: Date.now() - startTime
      });

      // Check if assessment is complete
      const completionStatus = await this.checkAssessmentCompletion(studentId);

      if (completionStatus.isComplete) {
        console.log(`[REAL-TIME] ✅ Assessment complete for student ${studentId}`);

        // Generate final category results
        const finalResults = await this.generateFinalCategoryResults(studentId);

        // Emit completion event
        this.emit('assessmentComplete', {
          studentId,
          finalResults,
          completionTime: new Date().toISOString()
        });

        // Clear active assessment
        this.activeAssessments.delete(studentId);

        return {
          success: true,
          status: 'assessment_complete',
          response: processedResponse,
          categoryUpdate,
          finalResults,
          processingTime: Date.now() - startTime
        };
      }

      return {
        success: true,
        status: 'response_processed',
        response: processedResponse,
        categoryUpdate,
        completionStatus,
        processingTime: Date.now() - startTime
      };

    } catch (error) {
      console.error(`[REAL-TIME] Error processing response for student ${studentId}:`, error);

      this.emit('processingError', {
        studentId,
        questionId: responseData.questionId,
        error: error.message,
        timestamp: new Date().toISOString()
      });

      throw error;
    }
  }

  /**
   * Track active assessment progress
   */
  trackActiveAssessment(studentId, responseData) {
    try {
      if (!this.activeAssessments.has(studentId)) {
        this.activeAssessments.set(studentId, {
          studentId,
          startTime: new Date(),
          responses: [],
          categories: new Set(),
          lastActivity: new Date()
        });
      }

      const assessment = this.activeAssessments.get(studentId);
      assessment.responses.push({
        questionId: responseData.questionId,
        category: responseData.category,
        timestamp: new Date(),
        isCorrect: responseData.isCorrect
      });
      assessment.categories.add(responseData.category);
      assessment.lastActivity = new Date();

      console.log(`[REAL-TIME] Tracking: Student ${studentId} has ${assessment.responses.length} responses across ${assessment.categories.size} categories`);

    } catch (error) {
      console.error(`[REAL-TIME] Error tracking assessment:`, error);
    }
  }

  /**
   * Validate and process individual response
   */
  async validateAndProcessResponse(studentId, responseData) {
    try {
      // Basic validation
      if (!responseData.questionId || !responseData.category) {
        throw new Error('Missing required response fields');
      }

      // Process based on category type
      let processedResponse = {
        studentId: parseInt(studentId),
        questionId: responseData.questionId,
        category: responseData.category,
        response: responseData.response,
        isCorrect: responseData.isCorrect,
        responseTime: responseData.responseTime || 0,
        answeredAt: new Date(),
        readingLevel: responseData.readingLevel
      };

      // Special handling for Phonological Awareness
      if (responseData.category === 'Phonological Awareness') {
        processedResponse.totalMatches = responseData.totalMatches || 0;
        processedResponse.correctMatches = responseData.correctMatches || 0;

        // Validate all-or-nothing scoring
        if (processedResponse.totalMatches > 0) {
          const matchPercentage = (processedResponse.correctMatches / processedResponse.totalMatches) * 100;
          processedResponse.isCorrect = matchPercentage === 100;
        }
      }

      console.log(`[REAL-TIME] Processed response: ${responseData.questionId} - ${processedResponse.isCorrect ? 'CORRECT' : 'INCORRECT'}`);

      return processedResponse;

    } catch (error) {
      console.error(`[REAL-TIME] Error validating response:`, error);
      throw error;
    }
  }

  /**
   * Update category results incrementally as responses come in
   */
  async updateCategoryResultsIncremental(studentId, processedResponse) {
    try {
      const category = processedResponse.category;

      // Get current active assessment data
      const activeAssessment = this.activeAssessments.get(studentId);
      if (!activeAssessment) {
        throw new Error('No active assessment found');
      }

      // Calculate current category progress
      const categoryResponses = activeAssessment.responses.filter(r => r.category === category);
      const correctResponses = categoryResponses.filter(r => r.isCorrect).length;
      const totalResponses = categoryResponses.length;

      // Get expected total questions for this category
      const expectedQuestions = await this.getExpectedQuestionsForCategory(category, processedResponse.readingLevel);

      // Calculate current score
      const currentScore = expectedQuestions > 0 ? Math.round((correctResponses / expectedQuestions) * 100) : 0;
      const progressPercentage = expectedQuestions > 0 ? Math.round((totalResponses / expectedQuestions) * 100) : 0;

      const categoryUpdate = {
        category,
        currentScore,
        correctResponses,
        totalResponses,
        expectedQuestions,
        progressPercentage,
        isComplete: totalResponses >= expectedQuestions,
        isPassed: currentScore >= 75,
        lastResponse: {
          questionId: processedResponse.questionId,
          isCorrect: processedResponse.isCorrect,
          timestamp: processedResponse.answeredAt
        }
      };

      console.log(`[REAL-TIME] Category update for ${category}: ${correctResponses}/${totalResponses} correct (${currentScore}%) - ${progressPercentage}% complete`);

      return categoryUpdate;

    } catch (error) {
      console.error(`[REAL-TIME] Error updating category results:`, error);
      throw error;
    }
  }

  /**
   * Check if assessment is complete
   */
  async checkAssessmentCompletion(studentId) {
    try {
      const activeAssessment = this.activeAssessments.get(studentId);
      if (!activeAssessment) {
        return { isComplete: false, reason: 'no_active_assessment' };
      }

      // Get student reading level and required categories
      const student = await this.getStudentBasicInfo(studentId);
      if (!student) {
        return { isComplete: false, reason: 'student_not_found' };
      }

      const CategoryResultsService = require('../Teachers/CategoryResultsService');
      const requiredCategories = CategoryResultsService.getCategoriesForReadingLevel(student.readingLevel);

      // Check completion for each required category
      const categoryCompletion = {};
      let allComplete = true;

      for (const category of requiredCategories) {
        const categoryResponses = activeAssessment.responses.filter(r => r.category === category);
        const expectedQuestions = await this.getExpectedQuestionsForCategory(category, student.readingLevel);

        const isComplete = categoryResponses.length >= expectedQuestions;
        categoryCompletion[category] = {
          completed: categoryResponses.length,
          required: expectedQuestions,
          isComplete
        };

        if (!isComplete) {
          allComplete = false;
        }
      }

      return {
        isComplete: allComplete,
        categoryCompletion,
        totalResponses: activeAssessment.responses.length,
        categoriesAttempted: activeAssessment.categories.size,
        requiredCategories: requiredCategories.length
      };

    } catch (error) {
      console.error(`[REAL-TIME] Error checking completion:`, error);
      return { isComplete: false, reason: 'error', error: error.message };
    }
  }

  /**
   * Generate final category results when assessment is complete
   */
  async generateFinalCategoryResults(studentId) {
    try {
      console.log(`[REAL-TIME] Generating final category results for student ${studentId}`);

      // Clear any cached results to force fresh generation
      CategoryResultsOptimizedService.clearStudentCache(studentId);

      // Generate optimized results
      const result = await CategoryResultsOptimizedService.getCategoryResultsOptimized(studentId, true);

      if (!result.success) {
        throw new Error('Failed to generate final category results');
      }

      // Trigger comprehensive prescriptive analysis for completed assessment
      try {
        const PrescriptiveAnalyticsOptimizedService = require('../Teachers/PrescriptiveAnalyticsOptimizedService');

        console.log(`[REAL-TIME] Triggering comprehensive prescriptive analysis for student ${studentId}`);

        const analysisResult = await PrescriptiveAnalyticsOptimizedService.processIncrementalAnalysis(
          studentId,
          'assessment_complete', // Special marker for full completion
          result.data.categories
        );

        console.log(`[REAL-TIME] ✅ Prescriptive analysis completed for student ${studentId}: ${analysisResult.type}`);

        // Add analysis info to final results
        result.data.prescriptiveAnalysis = {
          analysisId: analysisResult.analysisId,
          type: analysisResult.type,
          interventionRequired: analysisResult.interventionRequired || false,
          readingLevelProgression: analysisResult.readingLevelProgression || false
        };

      } catch (analysisError) {
        console.error(`[REAL-TIME] Error in prescriptive analysis for student ${studentId}:`, analysisError);
        // Don't fail the entire process if analysis fails
        result.data.prescriptiveAnalysis = {
          error: 'Analysis failed',
          message: analysisError.message
        };
      }

      console.log(`[REAL-TIME] ✅ Final results generated for student ${studentId}: ${result.data.overallScore}% overall`);

      return result.data;

    } catch (error) {
      console.error(`[REAL-TIME] Error generating final results:`, error);
      throw error;
    }
  }

  /**
   * Get expected questions for a category
   */
  async getExpectedQuestionsForCategory(category, readingLevel) {
    try {
      const mongoose = require('mongoose');
      const testDb = mongoose.connection.useDb('test');
      const mainAssessmentCollection = testDb.collection('main_assessment');

      const assessment = await mainAssessmentCollection.findOne({
        category,
        readingLevel,
        isActive: true
      }, { projection: { questions: 1 } });

      return assessment?.questions?.length || 0;

    } catch (error) {
      console.error(`[REAL-TIME] Error getting expected questions:`, error);
      return 0;
    }
  }

  /**
   * Get student basic info
   */
  async getStudentBasicInfo(studentId) {
    try {
      const mongoose = require('mongoose');
      const testDb = mongoose.connection.useDb('test');
      const usersCollection = testDb.collection('users');

      return await usersCollection.findOne(
        { $or: [{ idNumber: parseInt(studentId) }, { studentId: parseInt(studentId) }] },
        { projection: { idNumber: 1, firstName: 1, lastName: 1, readingLevel: 1 } }
      );

    } catch (error) {
      console.error(`[REAL-TIME] Error getting student info:`, error);
      return null;
    }
  }

  /**
   * Get current assessment progress for student
   */
  getAssessmentProgress(studentId) {
    const activeAssessment = this.activeAssessments.get(studentId);
    if (!activeAssessment) {
      return null;
    }

    return {
      studentId,
      startTime: activeAssessment.startTime,
      totalResponses: activeAssessment.responses.length,
      categoriesAttempted: activeAssessment.categories.size,
      lastActivity: activeAssessment.lastActivity,
      duration: Date.now() - activeAssessment.startTime.getTime()
    };
  }

  /**
   * Get all active assessments (for monitoring)
   */
  getAllActiveAssessments() {
    const active = [];
    for (const [studentId, assessment] of this.activeAssessments) {
      active.push({
        studentId,
        startTime: assessment.startTime,
        totalResponses: assessment.responses.length,
        categoriesAttempted: assessment.categories.size,
        lastActivity: assessment.lastActivity,
        duration: Date.now() - assessment.startTime.getTime()
      });
    }
    return active;
  }

  /**
   * Clean up inactive assessments (older than 1 hour)
   */
  cleanupInactiveAssessments() {
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
    let cleanedCount = 0;

    for (const [studentId, assessment] of this.activeAssessments) {
      if (assessment.lastActivity < oneHourAgo) {
        this.activeAssessments.delete(studentId);
        cleanedCount++;
        console.log(`[REAL-TIME] Cleaned up inactive assessment for student ${studentId}`);
      }
    }

    if (cleanedCount > 0) {
      console.log(`[REAL-TIME] Cleaned up ${cleanedCount} inactive assessments`);
    }

    return cleanedCount;
  }
}

module.exports = new RealTimeStudentProcessor();