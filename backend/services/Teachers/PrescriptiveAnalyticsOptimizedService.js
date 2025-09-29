// services/Teachers/PrescriptiveAnalyticsOptimizedService.js
const CategoryResultsOptimizedService = require('./CategoryResultsOptimizedService');
const mongoose = require('mongoose');

/**
 * Optimized Prescriptive Analytics Service for Incremental Category Completion
 * Handles analysis as each category is completed, not waiting for full assessment
 */
class PrescriptiveAnalyticsOptimizedService {
  constructor() {
    this.PrescriptionOnlyService = require('./PrescriptiveAnalytics/prescriptionOnlyService');
    this.IntegrationTriggerService = require('./PrescriptiveAnalytics/integrationTriggerService');
    this.analysisCache = new Map(); // Cache for incremental analysis
  }

  /**
   * Process prescriptive analysis incrementally as categories complete
   * Triggers analysis for each completed category without waiting for full assessment
   */
  async processIncrementalAnalysis(studentId, completedCategory, categoryResults) {
    try {
      console.log(`[PRESCRIPTIVE OPTIMIZED] Processing incremental analysis for student ${studentId}, category: ${completedCategory}`);

      const startTime = Date.now();

      // Get student reading level and required categories
      const student = await this.getStudentInfo(studentId);
      if (!student) {
        throw new Error(`Student ${studentId} not found`);
      }

      const CategoryResultsService = require('./CategoryResultsService');
      const requiredCategories = CategoryResultsService.getCategoriesForReadingLevel(student.readingLevel);

      // Check completion status across all categories
      const completionStatus = this.assessCategoryCompletionStatus(categoryResults, requiredCategories);

      let analysisResult;

      if (completionStatus.allCompleted) {
        // All categories completed - generate comprehensive final analysis
        console.log(`[PRESCRIPTIVE OPTIMIZED] All categories completed for student ${studentId} - generating comprehensive analysis`);
        analysisResult = await this.generateComprehensiveAnalysis(studentId, categoryResults);
      } else if (completionStatus.hasFailures) {
        // Some categories failed - generate targeted analysis for failed categories
        console.log(`[PRESCRIPTIVE OPTIMIZED] Categories with failures detected for student ${studentId} - generating targeted analysis`);
        analysisResult = await this.generateTargetedAnalysis(studentId, completedCategory, categoryResults, completionStatus.failedCategories);
      } else {
        // Categories still in progress - generate progress analysis
        console.log(`[PRESCRIPTIVE OPTIMIZED] Assessment in progress for student ${studentId} - generating progress analysis`);
        analysisResult = await this.generateProgressAnalysis(studentId, completedCategory, categoryResults, completionStatus);
      }

      const processingTime = Date.now() - startTime;

      // Cache the result
      this.cacheAnalysisResult(studentId, completedCategory, analysisResult);

      // Trigger appropriate actions based on analysis
      await this.triggerPostAnalysisActions(studentId, analysisResult, completionStatus);

      console.log(`[PRESCRIPTIVE OPTIMIZED] ✅ Incremental analysis completed in ${processingTime}ms for student ${studentId}`);

      return {
        success: true,
        type: analysisResult.type,
        category: completedCategory,
        analysisId: analysisResult.analysisId,
        completionStatus,
        processingTime,
        timestamp: new Date().toISOString()
      };

    } catch (error) {
      console.error(`[PRESCRIPTIVE OPTIMIZED] Error in incremental analysis for student ${studentId}:`, error);
      throw error;
    }
  }

  /**
   * Generate comprehensive analysis when all categories are completed
   */
  async generateComprehensiveAnalysis(studentId, categoryResults) {
    try {
      // Get or create category_results record
      let categoryResultRecord = await this.ensureCategoryResultRecord(studentId, categoryResults);

      // Generate comprehensive prescriptive analysis
      const analysis = await this.IntegrationTriggerService.triggerPrescriptiveAnalysis(categoryResultRecord);

      // Check for reading level progression
      const progressionCheck = await this.checkReadingLevelProgression(studentId, categoryResults);

      return {
        type: 'comprehensive',
        analysisId: analysis._id,
        categoryResultId: categoryResultRecord._id,
        overallScore: categoryResultRecord.overallScore,
        allCategoriesPassed: categoryResultRecord.allCategoriesPassed,
        interventionRequired: this.hasInterventionRequired(categoryResults),
        readingLevelProgression: progressionCheck,
        analysis: analysis,
        recommendedAction: this.determineRecommendedAction(categoryResults, progressionCheck)
      };

    } catch (error) {
      console.error(`[PRESCRIPTIVE OPTIMIZED] Error generating comprehensive analysis:`, error);
      throw error;
    }
  }

  /**
   * Generate targeted analysis for specific failed categories
   */
  async generateTargetedAnalysis(studentId, completedCategory, categoryResults, failedCategories) {
    try {
      const targetedAnalysis = [];

      for (const failedCategory of failedCategories) {
        console.log(`[PRESCRIPTIVE OPTIMIZED] Generating targeted analysis for failed category: ${failedCategory}`);

        // Create category-specific analysis
        const categorySpecificData = this.extractCategorySpecificData(studentId, failedCategory, categoryResults);

        // Generate prescription for this specific category
        const prescription = await this.generateCategorySpecificPrescription(studentId, failedCategory, categorySpecificData);

        targetedAnalysis.push({
          category: failedCategory,
          score: categorySpecificData.score,
          prescription: prescription,
          interventionRequired: true,
          priority: this.calculateInterventionPriority(failedCategory, categorySpecificData)
        });
      }

      // Create partial prescriptive analysis record
      const analysisRecord = await this.createPartialAnalysisRecord(studentId, targetedAnalysis, 'targeted');

      return {
        type: 'targeted',
        analysisId: analysisRecord._id,
        targetedCategories: failedCategories,
        analyses: targetedAnalysis,
        interventionRequired: true,
        recommendedAction: 'category_specific_intervention'
      };

    } catch (error) {
      console.error(`[PRESCRIPTIVE OPTIMIZED] Error generating targeted analysis:`, error);
      throw error;
    }
  }

  /**
   * Generate progress analysis for ongoing assessments
   */
  async generateProgressAnalysis(studentId, completedCategory, categoryResults, completionStatus) {
    try {
      const progressData = {
        studentId,
        completedCategory,
        categoryScore: this.getCategoryScore(categoryResults, completedCategory),
        categoryPassed: this.getCategoryPassed(categoryResults, completedCategory),
        totalCompleted: completionStatus.completedCount,
        totalRequired: completionStatus.totalRequired,
        progressPercentage: Math.round((completionStatus.completedCount / completionStatus.totalRequired) * 100),
        nextCategory: completionStatus.nextCategory,
        estimatedCompletion: this.estimateCompletionTime(completionStatus)
      };

      // Create progress record for tracking
      const progressRecord = await this.createProgressRecord(studentId, progressData);

      return {
        type: 'progress',
        analysisId: progressRecord._id,
        progress: progressData,
        interventionRequired: false,
        recommendedAction: 'continue_assessment'
      };

    } catch (error) {
      console.error(`[PRESCRIPTIVE OPTIMIZED] Error generating progress analysis:`, error);
      throw error;
    }
  }

  /**
   * Assess completion status across all categories
   */
  assessCategoryCompletionStatus(categoryResults, requiredCategories) {
    const completedCategories = [];
    const failedCategories = [];
    const passingCategories = [];

    for (const category of requiredCategories) {
      const categoryData = categoryResults.find(cat => cat.categoryName === category);

      if (categoryData && categoryData.isCompleted) {
        completedCategories.push(category);

        if (categoryData.isPassed) {
          passingCategories.push(category);
        } else {
          failedCategories.push(category);
        }
      }
    }

    const nextCategory = requiredCategories.find(cat => !completedCategories.includes(cat));

    return {
      completedCount: completedCategories.length,
      totalRequired: requiredCategories.length,
      allCompleted: completedCategories.length === requiredCategories.length,
      hasFailures: failedCategories.length > 0,
      completedCategories,
      failedCategories,
      passingCategories,
      nextCategory,
      progressPercentage: Math.round((completedCategories.length / requiredCategories.length) * 100)
    };
  }

  /**
   * Check for reading level progression eligibility
   */
  async checkReadingLevelProgression(studentId, categoryResults) {
    try {
      const CategoryResultsService = require('./CategoryResultsService');

      // Check if all categories passed
      const allPassed = categoryResults.every(cat => cat.isPassed === true);

      if (!allPassed) {
        return {
          eligible: false,
          reason: 'Not all categories passed',
          failedCategories: categoryResults.filter(cat => !cat.isPassed).map(cat => cat.categoryName)
        };
      }

      // Get student current reading level
      const student = await this.getStudentInfo(studentId);
      const currentLevel = student.readingLevel;
      const nextLevel = this.getNextReadingLevel(currentLevel);

      if (!nextLevel) {
        return {
          eligible: false,
          reason: 'Already at maximum reading level',
          currentLevel: currentLevel
        };
      }

      // Trigger reading level progression
      const progressionResult = await CategoryResultsService.processReadingLevelProgression(studentId, currentLevel);

      return {
        eligible: true,
        shouldProgress: progressionResult.shouldProgress,
        currentLevel: currentLevel,
        nextLevel: nextLevel,
        progressionTriggered: progressionResult.shouldProgress
      };

    } catch (error) {
      console.error(`[PRESCRIPTIVE OPTIMIZED] Error checking reading level progression:`, error);
      return {
        eligible: false,
        reason: 'Error checking progression',
        error: error.message
      };
    }
  }

  /**
   * Trigger post-analysis actions based on results
   */
  async triggerPostAnalysisActions(studentId, analysisResult, completionStatus) {
    try {
      switch (analysisResult.type) {
        case 'comprehensive':
          // All categories completed
          if (analysisResult.interventionRequired) {
            await this.triggerInterventionCreation(studentId, analysisResult);
          }

          if (analysisResult.readingLevelProgression?.progressionTriggered) {
            await this.notifyReadingLevelProgression(studentId, analysisResult.readingLevelProgression);
          }
          break;

        case 'targeted':
          // Failed categories need immediate intervention
          await this.triggerTargetedInterventions(studentId, analysisResult.analyses);
          break;

        case 'progress':
          // Assessment in progress - no immediate action needed
          await this.updateProgressTracking(studentId, analysisResult.progress);
          break;
      }

      // Clear relevant caches
      CategoryResultsOptimizedService.clearStudentCache(studentId);

    } catch (error) {
      console.error(`[PRESCRIPTIVE OPTIMIZED] Error triggering post-analysis actions:`, error);
    }
  }

  /**
   * Generate category-specific prescription
   */
  async generateCategorySpecificPrescription(studentId, category, categoryData) {
    try {
      // Get student responses for this category
      const responses = await this.getStudentResponsesForCategory(studentId, category);

      // Analyze error patterns for this specific category
      const errorAnalysis = await this.analyzeCategoryErrorPatterns(category, responses);

      // Generate targeted prescription
      const prescription = await this.PrescriptionOnlyService.generateCategoryPrescription(
        studentId,
        category,
        categoryData,
        errorAnalysis
      );

      return prescription;

    } catch (error) {
      console.error(`[PRESCRIPTIVE OPTIMIZED] Error generating category prescription:`, error);
      throw error;
    }
  }

  /**
   * Get student responses for specific category
   */
  async getStudentResponsesForCategory(studentId, category) {
    try {
      const testDb = mongoose.connection.useDb('test');
      const studentResponsesCollection = testDb.collection('student_responses');

      const responses = await studentResponsesCollection
        .find({
          studentId: parseInt(studentId),
          category: category
        })
        .sort({ answeredAt: 1 })
        .toArray();

      return responses;

    } catch (error) {
      console.error(`[PRESCRIPTIVE OPTIMIZED] Error getting student responses:`, error);
      return [];
    }
  }

  /**
   * Analyze error patterns for specific category
   */
  async analyzeCategoryErrorPatterns(category, responses) {
    try {
      const analysis = {
        category,
        totalResponses: responses.length,
        correctResponses: responses.filter(r => r.isCorrect).length,
        errorRate: 0,
        specificPatterns: []
      };

      if (responses.length > 0) {
        analysis.errorRate = Math.round(((responses.length - analysis.correctResponses) / responses.length) * 100);

        // Category-specific error analysis
        switch (category) {
          case 'Phonological Awareness':
            analysis.specificPatterns = this.analyzePhonologicalErrors(responses);
            break;
          case 'Alphabet Knowledge':
            analysis.specificPatterns = this.analyzeAlphabetErrors(responses);
            break;
          case 'Decoding':
            analysis.specificPatterns = this.analyzeDecodingErrors(responses);
            break;
          case 'Word Recognition':
            analysis.specificPatterns = this.analyzeWordRecognitionErrors(responses);
            break;
          case 'Reading Comprehension':
            analysis.specificPatterns = this.analyzeComprehensionErrors(responses);
            break;
        }
      }

      return analysis;

    } catch (error) {
      console.error(`[PRESCRIPTIVE OPTIMIZED] Error analyzing error patterns:`, error);
      return { category, totalResponses: 0, errorRate: 0, specificPatterns: [] };
    }
  }

  /**
   * Analyze Phonological Awareness specific errors
   */
  analyzePhonologicalErrors(responses) {
    const patterns = [];
    const confusionPairs = new Map();

    responses.forEach(response => {
      if (!response.isCorrect && response.response && Array.isArray(response.response)) {
        // Analyze sound confusion patterns
        response.response.forEach(match => {
          if (match.audio && match.match) {
            const confusionKey = `${match.audio}-${match.match}`;
            confusionPairs.set(confusionKey, (confusionPairs.get(confusionKey) || 0) + 1);
          }
        });
      }
    });

    // Convert to pattern analysis
    for (const [confusion, count] of confusionPairs) {
      const [audio, match] = confusion.split('-');
      patterns.push({
        type: 'sound_confusion',
        sounds: [audio, match],
        frequency: count,
        severity: count > 2 ? 'high' : 'moderate'
      });
    }

    return patterns;
  }

  /**
   * Analyze other category errors (simplified)
   */
  analyzeAlphabetErrors(responses) {
    const incorrectResponses = responses.filter(r => !r.isCorrect);
    return [{
      type: 'letter_confusion',
      frequency: incorrectResponses.length,
      questionIds: incorrectResponses.map(r => r.questionId)
    }];
  }

  analyzeDecodingErrors(responses) {
    const incorrectResponses = responses.filter(r => !r.isCorrect);
    return [{
      type: 'decoding_difficulty',
      frequency: incorrectResponses.length,
      questionIds: incorrectResponses.map(r => r.questionId)
    }];
  }

  analyzeWordRecognitionErrors(responses) {
    const incorrectResponses = responses.filter(r => !r.isCorrect);
    return [{
      type: 'word_recognition_difficulty',
      frequency: incorrectResponses.length,
      questionIds: incorrectResponses.map(r => r.questionId)
    }];
  }

  analyzeComprehensionErrors(responses) {
    const incorrectResponses = responses.filter(r => !r.isCorrect);
    return [{
      type: 'comprehension_difficulty',
      frequency: incorrectResponses.length,
      questionIds: incorrectResponses.map(r => r.questionId)
    }];
  }

  /**
   * Helper methods
   */
  async getStudentInfo(studentId) {
    try {
      const testDb = mongoose.connection.useDb('test');
      const usersCollection = testDb.collection('users');

      return await usersCollection.findOne(
        { $or: [{ idNumber: parseInt(studentId) }, { studentId: parseInt(studentId) }] },
        { projection: { idNumber: 1, firstName: 1, lastName: 1, readingLevel: 1 } }
      );
    } catch (error) {
      console.error(`[PRESCRIPTIVE OPTIMIZED] Error getting student info:`, error);
      return null;
    }
  }

  getCategoryScore(categoryResults, categoryName) {
    const category = categoryResults.find(cat => cat.categoryName === categoryName);
    return category ? category.score : 0;
  }

  getCategoryPassed(categoryResults, categoryName) {
    const category = categoryResults.find(cat => cat.categoryName === categoryName);
    return category ? category.isPassed : false;
  }

  getNextReadingLevel(currentLevel) {
    const levels = ['Low Emerging', 'High Emerging', 'Developing', 'Transitioning', 'At Grade Level'];
    const currentIndex = levels.indexOf(currentLevel);
    return currentIndex >= 0 && currentIndex < levels.length - 1 ? levels[currentIndex + 1] : null;
  }

  hasInterventionRequired(categoryResults) {
    return categoryResults.some(cat => cat.interventionRequired === true);
  }

  determineRecommendedAction(categoryResults, progressionCheck) {
    if (this.hasInterventionRequired(categoryResults)) {
      return 'intervention_required';
    } else if (progressionCheck?.progressionTriggered) {
      return 'reading_level_progression';
    } else {
      return 'assessment_complete';
    }
  }

  calculateInterventionPriority(category, categoryData) {
    if (categoryData.score < 40) return 'high';
    if (categoryData.score < 60) return 'medium';
    return 'low';
  }

  estimateCompletionTime(completionStatus) {
    const remaining = completionStatus.totalRequired - completionStatus.completedCount;
    const avgTimePerCategory = 300000; // 5 minutes estimated per category
    return new Date(Date.now() + (remaining * avgTimePerCategory));
  }

  cacheAnalysisResult(studentId, category, result) {
    const cacheKey = `${studentId}_${category}`;
    this.analysisCache.set(cacheKey, {
      result,
      timestamp: new Date(),
      ttl: 600000 // 10 minutes
    });
  }

  /**
   * Placeholder methods for database operations
   */
  async ensureCategoryResultRecord(studentId, categoryResults) {
    // Implementation would ensure category_results record exists
    console.log(`[PRESCRIPTIVE OPTIMIZED] Ensuring category results record for student ${studentId}`);
    return { _id: 'placeholder', overallScore: 75, allCategoriesPassed: true };
  }

  async createPartialAnalysisRecord(studentId, analyses, type) {
    // Implementation would create partial analysis record
    console.log(`[PRESCRIPTIVE OPTIMIZED] Creating ${type} analysis record for student ${studentId}`);
    return { _id: 'placeholder' };
  }

  async createProgressRecord(studentId, progressData) {
    // Implementation would create progress tracking record
    console.log(`[PRESCRIPTIVE OPTIMIZED] Creating progress record for student ${studentId}`);
    return { _id: 'placeholder' };
  }

  async triggerInterventionCreation(studentId, analysisResult) {
    console.log(`[PRESCRIPTIVE OPTIMIZED] Triggering intervention creation for student ${studentId}`);
  }

  async triggerTargetedInterventions(studentId, analyses) {
    console.log(`[PRESCRIPTIVE OPTIMIZED] Triggering targeted interventions for student ${studentId}`);
  }

  async notifyReadingLevelProgression(studentId, progression) {
    console.log(`[PRESCRIPTIVE OPTIMIZED] Notifying reading level progression for student ${studentId}: ${progression.currentLevel} → ${progression.nextLevel}`);
  }

  async updateProgressTracking(studentId, progress) {
    console.log(`[PRESCRIPTIVE OPTIMIZED] Updating progress tracking for student ${studentId}: ${progress.progressPercentage}% complete`);
  }
}

module.exports = new PrescriptiveAnalyticsOptimizedService();