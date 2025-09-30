// services/Teachers/ComprehensiveOptimizationService.js
const CategoryResultsOptimizedService = require('./CategoryResultsOptimizedService');
const PrescriptiveAnalyticsOptimizedService = require('./PrescriptiveAnalyticsOptimizedService');
const RealTimeStudentProcessor = require('../mobile/RealTimeStudentProcessor');
const WebSocketService = require('../mobile/WebSocketService');
const mongoose = require('mongoose');

/**
 * Comprehensive System Optimization Service
 * Optimizes the entire assessment flow for all categories and response types
 */
class ComprehensiveOptimizationService {
  constructor() {
    this.CategoryResultsService = require('./CategoryResultsService');
    this.processingQueue = new Map();
    this.optimizationCache = new Map();
  }

  /**
   * Optimize complete assessment processing pipeline
   * Handles all categories with correct/incorrect responses efficiently
   */
  async optimizeCompleteAssessmentFlow(studentId, options = {}) {
    try {
      console.log(`[COMPREHENSIVE OPT] Starting complete assessment optimization for student ${studentId}`);

      const startTime = Date.now();
      const forceRefresh = options.forceRefresh || false;

      // Step 1: Get or generate optimized category results
      const categoryResults = await this.getOptimizedCategoryResults(studentId, forceRefresh);

      // Step 2: Process sequential category access validation
      const accessValidation = await this.optimizeSequentialCategoryAccess(studentId, categoryResults);

      // Step 3: Generate optimized prescriptive analysis for completed categories
      const prescriptiveAnalysis = await this.generateOptimizedPrescriptiveAnalysis(studentId, categoryResults);

      // Step 4: Check and process reading level progression
      const progressionCheck = await this.optimizeReadingLevelProgression(studentId, categoryResults);

      // Step 5: Generate comprehensive assessment summary
      const assessmentSummary = await this.generateComprehensiveAssessmentSummary(
        studentId,
        categoryResults,
        accessValidation,
        prescriptiveAnalysis,
        progressionCheck
      );

      const totalProcessingTime = Date.now() - startTime;

      console.log(`[COMPREHENSIVE OPT] ✅ Complete optimization finished in ${totalProcessingTime}ms for student ${studentId}`);

      // Cache the optimized results
      this.cacheOptimizedResults(studentId, assessmentSummary);

      // Send real-time updates via WebSocket
      this.broadcastOptimizationComplete(studentId, assessmentSummary);

      return {
        success: true,
        studentId,
        processingTime: totalProcessingTime,
        categoryResults: categoryResults.data,
        accessValidation,
        prescriptiveAnalysis,
        progressionCheck,
        assessmentSummary,
        optimized: true,
        timestamp: new Date().toISOString()
      };

    } catch (error) {
      console.error(`[COMPREHENSIVE OPT] Error in complete assessment optimization:`, error);
      throw error;
    }
  }

  /**
   * Get optimized category results with enhanced processing
   */
  async getOptimizedCategoryResults(studentId, forceRefresh = false) {
    try {
      console.log(`[COMPREHENSIVE OPT] Getting optimized category results for student ${studentId}`);

      // Use the optimized service for fast results
      const result = await CategoryResultsOptimizedService.getCategoryResultsOptimized(studentId, forceRefresh);

      if (!result.success) {
        throw new Error('Failed to get optimized category results');
      }

      // Enhance the results with additional optimization
      const enhancedResults = await this.enhanceCategoryResults(result.data);

      return {
        success: true,
        data: enhancedResults,
        source: result.source,
        processingTime: result.processingTimeMs || 0
      };

    } catch (error) {
      console.error(`[COMPREHENSIVE OPT] Error getting optimized category results:`, error);
      throw error;
    }
  }

  /**
   * Optimize sequential category access validation
   */
  async optimizeSequentialCategoryAccess(studentId, categoryResults) {
    try {
      console.log(`[COMPREHENSIVE OPT] Optimizing sequential category access for student ${studentId}`);

      const AssessmentFlowControlService = require('./AssessmentFlowControlService');
      const student = await this.getStudentInfo(studentId);

      if (!student) {
        throw new Error('Student not found');
      }

      // Get required categories for reading level
      const requiredCategories = this.CategoryResultsService.getCategoriesForReadingLevel(student.readingLevel);

      // Optimize access checks for all categories
      const accessChecks = await Promise.all(
        requiredCategories.map(async (category) => {
          const access = await AssessmentFlowControlService.checkCategoryAccess(studentId, category);
          const categoryData = categoryResults.data.categories?.find(cat => cat.categoryName === category);

          return {
            category,
            sequence: requiredCategories.indexOf(category) + 1,
            accessible: access.allowed,
            completed: categoryData?.isCompleted || false,
            passed: categoryData?.isPassed || false,
            score: categoryData?.score || 0,
            status: this.determineCategoryStatus(categoryData, access),
            blockingFactors: access.blockingFactors || [],
            prerequisites: access.prerequisites || [],
            interventionRequired: categoryData?.interventionRequired || false
          };
        })
      );

      // Determine next available category with optimization
      const nextCategory = await this.getOptimizedNextCategory(studentId, accessChecks);

      return {
        readingLevel: student.readingLevel,
        requiredCategories,
        totalCategories: requiredCategories.length,
        accessChecks,
        nextAvailableCategory: nextCategory,
        sequentialFlow: this.validateSequentialFlow(accessChecks),
        optimizationApplied: true
      };

    } catch (error) {
      console.error(`[COMPREHENSIVE OPT] Error optimizing sequential access:`, error);
      throw error;
    }
  }

  /**
   * Generate optimized prescriptive analysis for all scenarios
   */
  async generateOptimizedPrescriptiveAnalysis(studentId, categoryResults) {
    try {
      console.log(`[COMPREHENSIVE OPT] Generating optimized prescriptive analysis for student ${studentId}`);

      const categories = categoryResults.data.categories || [];

      // Determine analysis type based on completion status
      const completedCategories = categories.filter(cat => cat.isCompleted);
      const failedCategories = categories.filter(cat => cat.isCompleted && !cat.isPassed);

      let analysisResult;

      if (completedCategories.length === categories.length) {
        // All categories completed - comprehensive analysis
        analysisResult = await PrescriptiveAnalyticsOptimizedService.processIncrementalAnalysis(
          studentId,
          'assessment_complete',
          categories
        );
      } else if (failedCategories.length > 0) {
        // Some failures detected - targeted analysis
        for (const failedCategory of failedCategories) {
          const categoryAnalysis = await PrescriptiveAnalyticsOptimizedService.processIncrementalAnalysis(
            studentId,
            failedCategory.categoryName,
            categories
          );

          // Process immediate intervention requirements
          await this.processImmediateInterventionRequirements(studentId, failedCategory, categoryAnalysis);
        }

        analysisResult = {
          type: 'targeted',
          targetedCategories: failedCategories.map(cat => cat.categoryName),
          interventionRequired: true
        };
      } else {
        // Assessment in progress - progress analysis
        analysisResult = {
          type: 'progress',
          completedCount: completedCategories.length,
          totalRequired: categories.length,
          progressPercentage: Math.round((completedCategories.length / categories.length) * 100)
        };
      }

      return {
        success: true,
        analysisType: analysisResult.type,
        analysisResult,
        prescriptiveAnalysisGenerated: analysisResult.type !== 'progress',
        optimized: true
      };

    } catch (error) {
      console.error(`[COMPREHENSIVE OPT] Error generating optimized prescriptive analysis:`, error);
      return {
        success: false,
        error: error.message,
        analysisType: 'error'
      };
    }
  }

  /**
   * Optimize reading level progression checks
   */
  async optimizeReadingLevelProgression(studentId, categoryResults) {
    try {
      console.log(`[COMPREHENSIVE OPT] Checking optimized reading level progression for student ${studentId}`);

      const categories = categoryResults.data.categories || [];
      const allPassed = categories.every(cat => cat.isPassed === true);
      const allCompleted = categories.every(cat => cat.isCompleted === true);

      if (!allCompleted) {
        return {
          eligible: false,
          reason: 'assessment_incomplete',
          completedCategories: categories.filter(cat => cat.isCompleted).length,
          totalCategories: categories.length
        };
      }

      if (!allPassed) {
        return {
          eligible: false,
          reason: 'intervention_required',
          failedCategories: categories.filter(cat => !cat.isPassed).map(cat => cat.categoryName)
        };
      }

      // All categories passed - check for progression
      const student = await this.getStudentInfo(studentId);
      const currentLevel = student.readingLevel;
      const nextLevel = this.getNextReadingLevel(currentLevel);

      if (!nextLevel) {
        return {
          eligible: false,
          reason: 'maximum_level_reached',
          currentLevel: currentLevel
        };
      }

      // Trigger automatic progression
      const progressionResult = await this.CategoryResultsService.processReadingLevelProgression(
        studentId,
        currentLevel
      );

      if (progressionResult.shouldProgress) {
        console.log(`[COMPREHENSIVE OPT] ✅ Reading level progression triggered: ${currentLevel} → ${nextLevel}`);

        // Clear cache to ensure fresh data for new level
        CategoryResultsOptimizedService.clearStudentCache(studentId);

        // Notify via WebSocket
        WebSocketService.sendToStudent(studentId, 'reading_level_progression', {
          fromLevel: currentLevel,
          toLevel: nextLevel,
          progressionTime: new Date().toISOString()
        });
      }

      return {
        eligible: true,
        progressionTriggered: progressionResult.shouldProgress,
        currentLevel: currentLevel,
        nextLevel: nextLevel,
        newCategoriesAvailable: progressionResult.newCategoriesCreated || []
      };

    } catch (error) {
      console.error(`[COMPREHENSIVE OPT] Error in reading level progression:`, error);
      return {
        eligible: false,
        reason: 'progression_error',
        error: error.message
      };
    }
  }

  /**
   * Generate comprehensive assessment summary
   */
  async generateComprehensiveAssessmentSummary(studentId, categoryResults, accessValidation, prescriptiveAnalysis, progressionCheck) {
    try {
      const student = await this.getStudentInfo(studentId);
      const categories = categoryResults.data.categories || [];

      // Calculate comprehensive metrics
      const metrics = this.calculateComprehensiveMetrics(categories);

      // Determine overall status
      const overallStatus = this.determineOverallStatus(categories, progressionCheck);

      // Generate next actions
      const nextActions = this.generateNextActions(categories, accessValidation, prescriptiveAnalysis, progressionCheck);

      // Create performance insights
      const performanceInsights = this.generatePerformanceInsights(categories, metrics);

      return {
        studentInfo: {
          studentId,
          studentName: categoryResults.data.studentName,
          readingLevel: student.readingLevel,
          assessmentDate: categoryResults.data.assessmentDate
        },
        overallStatus,
        metrics,
        categoryBreakdown: categories.map(cat => ({
          categoryName: cat.categoryName,
          score: cat.score,
          status: cat.status,
          badge: cat.badge,
          interventionRequired: cat.interventionRequired
        })),
        nextActions,
        performanceInsights,
        progressionInfo: progressionCheck,
        accessValidation: {
          nextAvailableCategory: accessValidation.nextAvailableCategory,
          sequentialFlowValid: accessValidation.sequentialFlow.isValid
        },
        prescriptiveAnalysis: {
          type: prescriptiveAnalysis.analysisType,
          generated: prescriptiveAnalysis.prescriptiveAnalysisGenerated
        },
        optimizationMetrics: {
          totalProcessingTime: categoryResults.processingTime || 0,
          cacheUsed: categoryResults.source === 'cache',
          optimizationVersion: '2.0'
        }
      };

    } catch (error) {
      console.error(`[COMPREHENSIVE OPT] Error generating assessment summary:`, error);
      throw error;
    }
  }

  /**
   * Process immediate intervention requirements
   */
  async processImmediateInterventionRequirements(studentId, failedCategory, categoryAnalysis) {
    try {
      console.log(`[COMPREHENSIVE OPT] Processing immediate intervention for ${failedCategory.categoryName}`);

      // Check if intervention assessment already exists
      const existingIntervention = await this.checkExistingIntervention(studentId, failedCategory.categoryName);

      if (existingIntervention) {
        console.log(`[COMPREHENSIVE OPT] Existing intervention found for ${failedCategory.categoryName}`);
        return existingIntervention;
      }

      // Generate intervention requirements
      const interventionRequirements = {
        studentId,
        category: failedCategory.categoryName,
        score: failedCategory.score,
        errorPatterns: this.extractErrorPatterns(failedCategory),
        recommendedQuestionCount: this.calculateOptimalQuestionCount(failedCategory),
        priority: this.calculateInterventionPriority(failedCategory),
        readyForCreation: true
      };

      // Notify teachers via WebSocket
      WebSocketService.broadcastToTeachers(studentId, 'intervention_required', {
        category: failedCategory.categoryName,
        score: failedCategory.score,
        requirements: interventionRequirements
      });

      return interventionRequirements;

    } catch (error) {
      console.error(`[COMPREHENSIVE OPT] Error processing intervention requirements:`, error);
      return null;
    }
  }

  /**
   * Enhanced category results with additional optimization data
   */
  async enhanceCategoryResults(categoryResults) {
    try {
      const enhanced = { ...categoryResults };

      // Add optimization metadata
      enhanced.optimizationMetadata = {
        optimizedAt: new Date().toISOString(),
        version: '2.0',
        enhancementsApplied: ['sequential_access', 'real_time_processing', 'prescriptive_integration']
      };

      // Enhance each category with additional insights
      if (enhanced.categories) {
        enhanced.categories = enhanced.categories.map(category => ({
          ...category,
          optimizedData: {
            accessibilityValidated: true,
            prerequisitesChecked: true,
            interventionReadiness: category.interventionRequired ? 'ready' : 'not_needed',
            progressionImpact: this.calculateProgressionImpact(category)
          }
        }));
      }

      // Add real-time processing capabilities
      enhanced.realTimeCapabilities = {
        webSocketEnabled: true,
        incrementalUpdates: true,
        backgroundProcessing: true,
        cacheOptimized: true
      };

      return enhanced;

    } catch (error) {
      console.error(`[COMPREHENSIVE OPT] Error enhancing category results:`, error);
      return categoryResults;
    }
  }

  /**
   * Helper methods for optimization
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
      console.error(`[COMPREHENSIVE OPT] Error getting student info:`, error);
      return null;
    }
  }

  getNextReadingLevel(currentLevel) {
    const levels = ['Low Emerging', 'High Emerging', 'Developing', 'Transitioning', 'At Grade Level'];
    const currentIndex = levels.indexOf(currentLevel);
    return currentIndex >= 0 && currentIndex < levels.length - 1 ? levels[currentIndex + 1] : null;
  }

  determineCategoryStatus(categoryData, access) {
    if (!access.allowed) return 'blocked';
    if (!categoryData || !categoryData.isCompleted) return 'not_attempted';
    if (categoryData.isPassed) return 'passed';
    if (categoryData.interventionRequired) return 'intervention_required';
    return 'failed';
  }

  async getOptimizedNextCategory(studentId, accessChecks) {
    const nextAccessible = accessChecks.find(check =>
      check.accessible && !check.completed
    );

    const nextBlocked = accessChecks.find(check =>
      !check.accessible && !check.completed
    );

    return {
      nextCategory: nextAccessible?.category || nextBlocked?.category || null,
      accessible: !!nextAccessible,
      blockingFactors: nextBlocked?.blockingFactors || [],
      sequence: nextAccessible?.sequence || nextBlocked?.sequence || 0
    };
  }

  validateSequentialFlow(accessChecks) {
    const issues = [];

    // Check for proper sequential access
    for (let i = 0; i < accessChecks.length; i++) {
      const current = accessChecks[i];
      const previous = i > 0 ? accessChecks[i - 1] : null;

      if (previous && current.accessible && !previous.passed && previous.completed) {
        issues.push(`${current.category} accessible despite ${previous.category} not passing`);
      }
    }

    return {
      isValid: issues.length === 0,
      issues: issues
    };
  }

  calculateComprehensiveMetrics(categories) {
    const completed = categories.filter(cat => cat.isCompleted).length;
    const passed = categories.filter(cat => cat.isPassed).length;
    const failed = categories.filter(cat => cat.isCompleted && !cat.isPassed).length;
    const avgScore = categories.length > 0
      ? Math.round(categories.reduce((sum, cat) => sum + cat.score, 0) / categories.length)
      : 0;

    return {
      totalCategories: categories.length,
      completedCategories: completed,
      passedCategories: passed,
      failedCategories: failed,
      progressPercentage: Math.round((completed / categories.length) * 100),
      successRate: completed > 0 ? Math.round((passed / completed) * 100) : 0,
      averageScore: avgScore,
      overallScore: avgScore
    };
  }

  determineOverallStatus(categories, progressionCheck) {
    if (progressionCheck.progressionTriggered) return 'progression_achieved';
    if (categories.some(cat => cat.interventionRequired)) return 'intervention_needed';
    if (categories.every(cat => cat.isCompleted && cat.isPassed)) return 'assessment_complete';
    if (categories.some(cat => cat.isCompleted)) return 'assessment_in_progress';
    return 'assessment_not_started';
  }

  generateNextActions(categories, accessValidation, prescriptiveAnalysis, progressionCheck) {
    const actions = [];

    if (progressionCheck.progressionTriggered) {
      actions.push({
        type: 'progression',
        description: `Advanced to ${progressionCheck.nextLevel}`,
        priority: 'high'
      });
    }

    const failedCategories = categories.filter(cat => cat.isCompleted && !cat.isPassed);
    if (failedCategories.length > 0) {
      actions.push({
        type: 'intervention',
        description: `Create interventions for: ${failedCategories.map(cat => cat.categoryName).join(', ')}`,
        priority: 'high'
      });
    }

    if (accessValidation.nextAvailableCategory?.nextCategory) {
      actions.push({
        type: 'continue_assessment',
        description: `Continue with ${accessValidation.nextAvailableCategory.nextCategory}`,
        priority: 'medium'
      });
    }

    return actions;
  }

  generatePerformanceInsights(categories, metrics) {
    const insights = [];

    if (metrics.successRate >= 80) {
      insights.push('Strong overall performance across categories');
    } else if (metrics.successRate >= 60) {
      insights.push('Moderate performance with room for improvement');
    } else {
      insights.push('Significant challenges identified requiring targeted intervention');
    }

    const strengths = categories.filter(cat => cat.score >= 85).map(cat => cat.categoryName);
    if (strengths.length > 0) {
      insights.push(`Strengths identified in: ${strengths.join(', ')}`);
    }

    return insights;
  }

  calculateProgressionImpact(category) {
    if (!category.isPassed && category.isCompleted) return 'blocks_progression';
    if (category.isPassed) return 'enables_progression';
    return 'neutral';
  }

  async checkExistingIntervention(studentId, category) {
    try {
      const testDb = mongoose.connection.useDb('test');
      const interventionCollection = testDb.collection('intervention_assessment');

      const existing = await interventionCollection.findOne({
        studentId: parseInt(studentId),
        category: category,
        status: { $in: ['active', 'draft'] }
      });

      return existing ? { exists: true, interventionId: existing._id } : { exists: false };
    } catch (error) {
      return { exists: false };
    }
  }

  extractErrorPatterns(category) {
    return {
      primaryIssues: category.score < 50 ? ['fundamental_gaps'] : ['specific_skills'],
      errorRate: Math.round((1 - category.score / 100) * 100),
      severity: category.score < 40 ? 'high' : category.score < 60 ? 'medium' : 'low'
    };
  }

  calculateOptimalQuestionCount(category) {
    const baseCount = 8;
    const difficultyAdjustment = Math.max(2, Math.floor((75 - category.score) / 10));
    return Math.min(15, baseCount + difficultyAdjustment);
  }

  calculateInterventionPriority(category) {
    if (category.score < 40) return 'urgent';
    if (category.score < 60) return 'high';
    return 'medium';
  }

  cacheOptimizedResults(studentId, summary) {
    this.optimizationCache.set(studentId, {
      summary,
      cachedAt: new Date(),
      ttl: 300000 // 5 minutes
    });
  }

  broadcastOptimizationComplete(studentId, summary) {
    try {
      WebSocketService.sendToStudent(studentId, 'optimization_complete', {
        overallStatus: summary.overallStatus,
        metrics: summary.metrics,
        nextActions: summary.nextActions
      });
    } catch (error) {
      console.error(`[COMPREHENSIVE OPT] Error broadcasting optimization complete:`, error);
    }
  }

  /**
   * Get optimization statistics
   */
  getOptimizationStats() {
    return {
      activeOptimizations: this.processingQueue.size,
      cacheSize: this.optimizationCache.size,
      version: '2.0',
      capabilities: [
        'real_time_processing',
        'sequential_category_validation',
        'comprehensive_analysis',
        'automatic_progression',
        'intervention_optimization'
      ]
    };
  }
}

module.exports = new ComprehensiveOptimizationService();