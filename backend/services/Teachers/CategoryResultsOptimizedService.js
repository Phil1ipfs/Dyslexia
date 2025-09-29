// services/Teachers/CategoryResultsOptimizedService.js
const mongoose = require('mongoose');
const NodeCache = require('node-cache');

/**
 * Optimized Category Results Service for Real-time Mobile Processing
 * Provides fast, cached, and background-processed category results
 */
class CategoryResultsOptimizedService {
  constructor() {
    // Cache for 10 minutes with automatic cleanup
    this.cache = new NodeCache({ stdTTL: 600, checkperiod: 120 });
    this.processingQueue = new Map(); // Track processing requests
    this.CategoryResultsService = require('./CategoryResultsService');
  }

  /**
   * Get category results with caching and background processing
   * Mobile-optimized with immediate response
   */
  async getCategoryResultsOptimized(studentId, forceRefresh = false) {
    try {
      const cacheKey = `category_results_${studentId}`;
      const processingKey = `processing_${studentId}`;

      console.log(`[OPTIMIZED] Getting category results for student ${studentId}, forceRefresh: ${forceRefresh}`);

      // Return cached data if available and not forcing refresh
      if (!forceRefresh) {
        const cached = this.cache.get(cacheKey);
        if (cached) {
          console.log(`[OPTIMIZED] ✅ Cache hit for student ${studentId}`);
          return {
            success: true,
            data: cached,
            source: 'cache',
            timestamp: new Date().toISOString()
          };
        }
      }

      // Check if already processing
      if (this.processingQueue.has(processingKey)) {
        console.log(`[OPTIMIZED] ⏳ Already processing student ${studentId}, returning existing promise`);
        return await this.processingQueue.get(processingKey);
      }

      // Start background processing
      const processingPromise = this.processStudentResultsInBackground(studentId);
      this.processingQueue.set(processingKey, processingPromise);

      try {
        const result = await processingPromise;

        // Cache the result
        this.cache.set(cacheKey, result.data);
        console.log(`[OPTIMIZED] ✅ Cached results for student ${studentId}`);

        return result;
      } finally {
        // Clean up processing queue
        this.processingQueue.delete(processingKey);
      }

    } catch (error) {
      console.error(`[OPTIMIZED] Error getting category results for student ${studentId}:`, error);
      throw error;
    }
  }

  /**
   * Background processing of student results with optimizations
   */
  async processStudentResultsInBackground(studentId) {
    try {
      console.log(`[OPTIMIZED] 🚀 Starting background processing for student ${studentId}`);
      const startTime = Date.now();

      // Get student basic info first (fast query)
      const student = await this.getStudentBasicInfo(studentId);
      if (!student) {
        throw new Error(`Student ${studentId} not found`);
      }

      // Check if category results already exist
      const existingResults = await this.getExistingCategoryResults(studentId);

      if (existingResults && existingResults.length > 0) {
        console.log(`[OPTIMIZED] ✅ Found existing category results for student ${studentId}`);
        const processingTime = Date.now() - startTime;

        return {
          success: true,
          data: this.formatCategoryResultsForMobile(existingResults[0], student),
          source: 'database_existing',
          processingTimeMs: processingTime,
          timestamp: new Date().toISOString()
        };
      }

      // No existing results - need to generate from responses
      console.log(`[OPTIMIZED] 📊 Generating new category results for student ${studentId}`);

      // Use optimized response processing
      const generatedResults = await this.generateOptimizedCategoryResults(studentId, student);

      const processingTime = Date.now() - startTime;
      console.log(`[OPTIMIZED] ✅ Generated category results for student ${studentId} in ${processingTime}ms`);

      return {
        success: true,
        data: generatedResults,
        source: 'generated_optimized',
        processingTimeMs: processingTime,
        timestamp: new Date().toISOString()
      };

    } catch (error) {
      console.error(`[OPTIMIZED] Error in background processing for student ${studentId}:`, error);
      throw error;
    }
  }

  /**
   * Fast student basic info retrieval
   */
  async getStudentBasicInfo(studentId) {
    try {
      const testDb = mongoose.connection.useDb('test');
      const usersCollection = testDb.collection('users');

      const student = await usersCollection.findOne(
        { $or: [{ idNumber: parseInt(studentId) }, { studentId: parseInt(studentId) }] },
        { projection: { idNumber: 1, firstName: 1, lastName: 1, readingLevel: 1 } }
      );

      return student;
    } catch (error) {
      console.error(`[OPTIMIZED] Error getting student basic info:`, error);
      return null;
    }
  }

  /**
   * Fast existing category results check
   */
  async getExistingCategoryResults(studentId) {
    try {
      const testDb = mongoose.connection.useDb('test');
      const categoryResultsCollection = testDb.collection('category_results');

      const results = await categoryResultsCollection
        .find({ studentId: parseInt(studentId) })
        .sort({ createdAt: -1 })
        .limit(1)
        .toArray();

      return results;
    } catch (error) {
      console.error(`[OPTIMIZED] Error getting existing category results:`, error);
      return [];
    }
  }

  /**
   * Optimized category results generation with minimal database queries
   */
  async generateOptimizedCategoryResults(studentId, student) {
    try {
      const readingLevel = student.readingLevel || 'High Emerging';

      // Get all required data in parallel
      const [responses, mainAssessmentCounts] = await Promise.all([
        this.getStudentResponsesOptimized(studentId, readingLevel),
        this.getMainAssessmentQuestionCounts(readingLevel)
      ]);

      console.log(`[OPTIMIZED] Retrieved ${responses.length} responses and question counts for ${readingLevel}`);

      // Group responses by category for fast processing
      const responsesByCategory = this.groupResponsesByCategory(responses);

      // Get categories for reading level
      const categoriesForLevel = this.CategoryResultsService.getCategoriesForReadingLevel(readingLevel);

      // Process each category in parallel
      const categoryPromises = categoriesForLevel.map(categoryName =>
        this.processCategoryOptimized(
          categoryName,
          responsesByCategory[categoryName] || [],
          mainAssessmentCounts[categoryName] || 0
        )
      );

      const categories = await Promise.all(categoryPromises);

      // Calculate overall metrics
      const overallMetrics = this.calculateOverallMetrics(categories, categoriesForLevel);

      // Create optimized category result document
      const categoryResultData = {
        studentId: parseInt(studentId),
        assessmentDate: new Date(),
        categories: categories,
        overallScore: overallMetrics.overallScore,
        completedCategories: overallMetrics.completedCategories,
        totalCategories: categoriesForLevel.length,
        allCategoriesPassed: overallMetrics.allCategoriesPassed,
        readingLevel: readingLevel,
        readingLevelUpdated: false,
        createdAt: new Date(),
        updatedAt: new Date()
      };

      // Save to database in background (don't wait)
      this.saveCategoryResultsInBackground(categoryResultData);

      // Return formatted data immediately
      return this.formatCategoryResultsForMobile(categoryResultData, student);

    } catch (error) {
      console.error(`[OPTIMIZED] Error generating optimized category results:`, error);
      throw error;
    }
  }

  /**
   * Optimized student responses retrieval with minimal fields
   */
  async getStudentResponsesOptimized(studentId, readingLevel) {
    try {
      const testDb = mongoose.connection.useDb('test');
      const studentResponsesCollection = testDb.collection('student_responses');

      const responses = await studentResponsesCollection
        .find(
          {
            studentId: parseInt(studentId),
            readingLevel: readingLevel
          },
          {
            projection: {
              questionId: 1,
              category: 1,
              isCorrect: 1,
              correctMatches: 1,
              totalMatches: 1,
              answeredAt: 1
            }
          }
        )
        .sort({ answeredAt: 1 })
        .toArray();

      return responses;
    } catch (error) {
      console.error(`[OPTIMIZED] Error getting student responses:`, error);
      return [];
    }
  }

  /**
   * Get main assessment question counts for all categories
   */
  async getMainAssessmentQuestionCounts(readingLevel) {
    try {
      const testDb = mongoose.connection.useDb('test');
      const mainAssessmentCollection = testDb.collection('main_assessment');

      const assessments = await mainAssessmentCollection
        .find(
          { readingLevel: readingLevel, isActive: true },
          { projection: { category: 1, questions: 1 } }
        )
        .toArray();

      const counts = {};
      assessments.forEach(assessment => {
        counts[assessment.category] = assessment.questions ? assessment.questions.length : 0;
      });

      return counts;
    } catch (error) {
      console.error(`[OPTIMIZED] Error getting main assessment counts:`, error);
      return {};
    }
  }

  /**
   * Group responses by category for fast access
   */
  groupResponsesByCategory(responses) {
    const grouped = {};
    responses.forEach(response => {
      const category = response.category;
      if (!grouped[category]) {
        grouped[category] = [];
      }
      grouped[category].push(response);
    });
    return grouped;
  }

  /**
   * Process single category with optimizations
   */
  async processCategoryOptimized(categoryName, responses, totalQuestionsFromAssessment) {
    try {
      if (responses.length === 0) {
        // Create placeholder for incomplete category
        return {
          categoryName: categoryName,
          totalQuestions: totalQuestionsFromAssessment,
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
        };
      }

      let correctAnswers = 0;
      let totalMatches = 0;
      let correctMatches = 0;

      // Fast processing based on category type
      if (categoryName === 'Phonological Awareness') {
        // Special handling for Phonological Awareness matching
        responses.forEach(response => {
          if (response.totalMatches) {
            totalMatches += response.totalMatches;
            correctMatches += response.correctMatches || 0;

            // Count as correct only if ALL matches are correct
            const questionPercentage = response.totalMatches > 0 ?
              (response.correctMatches / response.totalMatches) * 100 : 0;

            if (questionPercentage === 100) {
              correctAnswers++;
            }
          } else {
            if (response.isCorrect) correctAnswers++;
          }
        });
      } else {
        // Standard processing for other categories
        responses.forEach(response => {
          if (response.isCorrect) correctAnswers++;
        });
      }

      const totalQuestions = Math.max(totalQuestionsFromAssessment, responses.length);
      const score = totalQuestions > 0 ? Math.round((correctAnswers / totalQuestions) * 100) : 0;
      const isPassed = score >= 75;

      return {
        categoryName: categoryName,
        totalQuestions: totalQuestions,
        correctAnswers: correctAnswers,
        totalPossibleMatches: totalMatches,
        correctMatches: correctMatches,
        score: score,
        isPassed: isPassed,
        passingThreshold: 75,
        isCompleted: true,
        lastQuestionAnswered: responses[responses.length - 1]?.questionId || '',
        interventionRequired: !isPassed,
        interventionAttempts: 0,
        interventionCompleted: false,
        currentInterventionId: null,
        interventionHistory: []
      };

    } catch (error) {
      console.error(`[OPTIMIZED] Error processing category ${categoryName}:`, error);
      throw error;
    }
  }

  /**
   * Calculate overall metrics from categories
   */
  calculateOverallMetrics(categories, categoriesForLevel) {
    try {
      const categoryWeights = this.CategoryResultsService.getCategoryWeights(categoriesForLevel[0]); // Assume same reading level for all

      let weightedSum = 0;
      let totalWeight = 0;
      let completedCategories = 0;
      let passedCategories = 0;

      categories.forEach(category => {
        const weight = categoryWeights[category.categoryName] || (1 / categories.length);

        if (category.isCompleted) {
          completedCategories++;
          weightedSum += category.score * weight;
          totalWeight += weight;

          if (category.isPassed) {
            passedCategories++;
          }
        }
      });

      const overallScore = totalWeight > 0 ? Math.round(weightedSum / totalWeight) : 0;
      const allCategoriesPassed = passedCategories === categories.length && completedCategories === categories.length;

      return {
        overallScore,
        completedCategories,
        passedCategories,
        allCategoriesPassed
      };
    } catch (error) {
      console.error(`[OPTIMIZED] Error calculating overall metrics:`, error);
      return {
        overallScore: 0,
        completedCategories: 0,
        passedCategories: 0,
        allCategoriesPassed: false
      };
    }
  }

  /**
   * Save category results in background without blocking response
   */
  async saveCategoryResultsInBackground(categoryResultData) {
    try {
      // Don't await this - let it run in background
      setImmediate(async () => {
        try {
          const result = await this.CategoryResultsService.createCategoryResult(categoryResultData);
          console.log(`[OPTIMIZED] ✅ Background save completed for student ${categoryResultData.studentId}`);

          // Clear cache to ensure fresh data on next request
          this.cache.del(`category_results_${categoryResultData.studentId}`);

        } catch (error) {
          console.error(`[OPTIMIZED] Background save failed for student ${categoryResultData.studentId}:`, error);
        }
      });
    } catch (error) {
      console.error(`[OPTIMIZED] Error initiating background save:`, error);
    }
  }

  /**
   * Format category results for mobile consumption
   */
  formatCategoryResultsForMobile(categoryResults, student) {
    try {
      return {
        studentId: categoryResults.studentId,
        studentName: `${student.firstName} ${student.lastName}`,
        readingLevel: categoryResults.readingLevel,
        assessmentDate: categoryResults.assessmentDate,
        overallScore: categoryResults.overallScore,
        completedCategories: categoryResults.completedCategories,
        totalCategories: categoryResults.totalCategories,
        allCategoriesPassed: categoryResults.allCategoriesPassed,
        categories: categoryResults.categories.map(category => ({
          categoryName: category.categoryName,
          score: category.score,
          isPassed: category.isPassed,
          isCompleted: category.isCompleted,
          totalQuestions: category.totalQuestions,
          correctAnswers: category.correctAnswers,
          interventionRequired: category.interventionRequired,

          // ⚡ OPTIMIZED: Intervention tracking for mobile
          interventionData: this.formatInterventionDataForMobile(category),

          badge: this.getCategoryBadge(category),
          status: this.getCategoryStatus(category)
        })),
        summary: {
          performance: this.getPerformanceSummary(categoryResults.overallScore),
          nextAction: this.getNextActionRecommendation(categoryResults),
          progressPercentage: Math.round((categoryResults.completedCategories / categoryResults.totalCategories) * 100),

          // ⚡ OPTIMIZED: Intervention summary for mobile dashboard
          interventionSummary: this.getInterventionSummaryForMobile(categoryResults.categories)
        },
        metadata: {
          processedAt: new Date().toISOString(),
          optimized: true,
          version: '2.1', // Updated version with intervention optimization
          interventionOptimized: true
        }
      };
    } catch (error) {
      console.error(`[OPTIMIZED] Error formatting results for mobile:`, error);
      throw error;
    }
  }

  /**
   * ⚡ OPTIMIZED: Format intervention data for mobile apps
   */
  formatInterventionDataForMobile(category) {
    try {
      if (!category.interventionRequired && !category.interventionHistory?.length) {
        return {
          required: false,
          attempts: 0,
          status: 'not_needed',
          message: 'No intervention required'
        };
      }

      const history = category.interventionHistory || [];
      const currentIntervention = category.currentInterventionId;
      const attempts = category.interventionAttempts || 0;
      const completed = category.interventionCompleted || false;

      // Fast status determination for mobile
      let status = 'required';
      let message = 'Intervention needed';
      let lastAttempt = null;

      if (history.length > 0) {
        const lastAttemptData = history[history.length - 1];
        lastAttempt = {
          attemptNumber: lastAttemptData.attemptNumber,
          score: lastAttemptData.score,
          isPassed: lastAttemptData.isPassed,
          completedAt: lastAttemptData.completedAt,
          interventionId: lastAttemptData.interventionId
        };

        if (lastAttemptData.isPassed) {
          status = 'passed';
          message = 'Intervention completed successfully';
        } else if (attempts >= 3) {
          status = 'max_attempts';
          message = 'Maximum attempts reached - teacher review needed';
        } else {
          status = 'failed_can_retry';
          message = `Attempt ${attempts} failed - can retry or teacher can revise`;
        }
      }

      return {
        required: category.interventionRequired,
        attempts: attempts,
        maxAttempts: 3,
        status: status,
        message: message,
        completed: completed,
        currentInterventionId: currentIntervention,
        lastAttempt: lastAttempt,

        // Quick mobile access data
        canRetry: attempts < 3 && !completed,
        needsTeacherReview: attempts >= 2 && !completed,

        // Progress tracking
        progressPercentage: lastAttempt ?
          Math.min(100, Math.round((lastAttempt.score / 75) * 100)) : 0
      };

    } catch (error) {
      console.error(`[OPTIMIZED] Error formatting intervention data:`, error);
      return {
        required: false,
        attempts: 0,
        status: 'error',
        message: 'Error loading intervention data'
      };
    }
  }

  /**
   * ⚡ OPTIMIZED: Get intervention summary for mobile dashboard
   */
  getInterventionSummaryForMobile(categories) {
    try {
      const interventionCategories = categories.filter(cat => cat.interventionRequired);

      if (interventionCategories.length === 0) {
        return {
          hasInterventions: false,
          totalRequired: 0,
          message: 'No interventions required'
        };
      }

      const completed = interventionCategories.filter(cat => cat.interventionCompleted).length;
      const inProgress = interventionCategories.filter(cat =>
        cat.interventionAttempts > 0 && !cat.interventionCompleted
      ).length;
      const notStarted = interventionCategories.filter(cat =>
        !cat.interventionAttempts || cat.interventionAttempts === 0
      ).length;

      // Calculate overall intervention progress
      const totalAttempts = interventionCategories.reduce((sum, cat) =>
        sum + (cat.interventionAttempts || 0), 0);
      const averageAttempts = totalAttempts / interventionCategories.length;

      // Determine urgency level for mobile UI
      let urgency = 'low';
      let urgencyMessage = 'Interventions progressing normally';

      if (averageAttempts >= 2) {
        urgency = 'high';
        urgencyMessage = 'Multiple intervention attempts - teacher review recommended';
      } else if (inProgress > 0) {
        urgency = 'medium';
        urgencyMessage = 'Interventions in progress';
      }

      return {
        hasInterventions: true,
        totalRequired: interventionCategories.length,
        completed: completed,
        inProgress: inProgress,
        notStarted: notStarted,

        // Progress metrics
        completionRate: Math.round((completed / interventionCategories.length) * 100),
        averageAttempts: Math.round(averageAttempts * 10) / 10,

        // Urgency indicators for mobile UI
        urgency: urgency,
        urgencyMessage: urgencyMessage,

        // Quick action recommendations
        nextAction: this.getInterventionNextAction(interventionCategories),

        // Categories needing attention
        categoriesNeedingAttention: interventionCategories
          .filter(cat => (cat.interventionAttempts || 0) >= 2 && !cat.interventionCompleted)
          .map(cat => cat.categoryName)
      };

    } catch (error) {
      console.error(`[OPTIMIZED] Error getting intervention summary:`, error);
      return {
        hasInterventions: false,
        totalRequired: 0,
        message: 'Error loading intervention summary'
      };
    }
  }

  /**
   * ⚡ OPTIMIZED: Get next intervention action for mobile
   */
  getInterventionNextAction(interventionCategories) {
    const notStarted = interventionCategories.filter(cat =>
      !cat.interventionAttempts || cat.interventionAttempts === 0
    );

    const needsRetry = interventionCategories.filter(cat =>
      cat.interventionAttempts > 0 && !cat.interventionCompleted && cat.interventionAttempts < 3
    );

    const needsTeacherReview = interventionCategories.filter(cat =>
      cat.interventionAttempts >= 2 && !cat.interventionCompleted
    );

    if (needsTeacherReview.length > 0) {
      return {
        type: 'teacher_review',
        priority: 'high',
        message: `${needsTeacherReview.length} intervention(s) need teacher review`,
        categories: needsTeacherReview.map(cat => cat.categoryName)
      };
    }

    if (needsRetry.length > 0) {
      return {
        type: 'student_retry',
        priority: 'medium',
        message: `${needsRetry.length} intervention(s) can be retried`,
        categories: needsRetry.map(cat => cat.categoryName)
      };
    }

    if (notStarted.length > 0) {
      return {
        type: 'start_intervention',
        priority: 'medium',
        message: `${notStarted.length} intervention(s) need to be started`,
        categories: notStarted.map(cat => cat.categoryName)
      };
    }

    return {
      type: 'all_complete',
      priority: 'low',
      message: 'All interventions completed',
      categories: []
    };
  }

  /**
   * Get category badge for mobile display
   */
  getCategoryBadge(category) {
    if (!category.isCompleted) return 'NOT ATTEMPTED';
    if (category.isPassed) return 'PASSED';
    if (category.interventionRequired) {
      // Enhanced badge with intervention status
      if (category.interventionCompleted) return 'INTERVENTION COMPLETED';
      if (category.interventionAttempts >= 2) return 'NEEDS TEACHER REVIEW';
      return 'INTERVENTION REQUIRED';
    }
    return 'FAILED';
  }

  /**
   * Get category status for mobile display
   */
  getCategoryStatus(category) {
    if (!category.isCompleted) return 'not_attempted';
    if (category.isPassed) return 'passed';
    if (category.interventionRequired) return 'failed_intervention_required';
    return 'failed';
  }

  /**
   * Get performance summary for mobile
   */
  getPerformanceSummary(overallScore) {
    if (overallScore >= 90) return 'Excellent';
    if (overallScore >= 80) return 'Good';
    if (overallScore >= 70) return 'Satisfactory';
    if (overallScore >= 60) return 'Needs Improvement';
    return 'Requires Intervention';
  }

  /**
   * Get next action recommendation
   */
  getNextActionRecommendation(categoryResults) {
    const failedCategories = categoryResults.categories.filter(cat =>
      cat.isCompleted && !cat.isPassed
    );

    if (failedCategories.length > 0) {
      return `Complete intervention for ${failedCategories[0].categoryName}`;
    }

    const incompleteCategories = categoryResults.categories.filter(cat => !cat.isCompleted);
    if (incompleteCategories.length > 0) {
      return `Continue assessment - ${incompleteCategories[0].categoryName}`;
    }

    if (categoryResults.allCategoriesPassed) {
      return 'Assessment complete - Ready for next level';
    }

    return 'Continue assessment';
  }

  /**
   * Real-time processing status for mobile
   */
  async getProcessingStatus(studentId) {
    try {
      const processingKey = `processing_${studentId}`;
      const isProcessing = this.processingQueue.has(processingKey);
      const cached = this.cache.get(`category_results_${studentId}`);

      return {
        isProcessing,
        hasCachedResults: !!cached,
        lastProcessed: cached ? cached.metadata?.processedAt : null,
        estimatedCompletion: isProcessing ? new Date(Date.now() + 5000).toISOString() : null
      };
    } catch (error) {
      console.error(`[OPTIMIZED] Error getting processing status:`, error);
      return { isProcessing: false, hasCachedResults: false };
    }
  }

  /**
   * Clear cache for specific student (for testing/debugging)
   */
  clearStudentCache(studentId) {
    const cacheKey = `category_results_${studentId}`;
    this.cache.del(cacheKey);
    console.log(`[OPTIMIZED] Cleared cache for student ${studentId}`);
  }

  /**
   * Clear all cache (for maintenance)
   */
  clearAllCache() {
    this.cache.flushAll();
    console.log(`[OPTIMIZED] Cleared all cache`);
  }

  /**
   * Get cache statistics
   */
  getCacheStats() {
    return {
      keys: this.cache.keys().length,
      hits: this.cache.getStats().hits,
      misses: this.cache.getStats().misses,
      processingQueue: this.processingQueue.size
    };
  }
}

module.exports = new CategoryResultsOptimizedService();