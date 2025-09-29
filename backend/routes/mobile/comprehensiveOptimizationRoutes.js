// routes/mobile/comprehensiveOptimizationRoutes.js
const express = require('express');
const router = express.Router();
const ComprehensiveOptimizationService = require('../../services/Teachers/ComprehensiveOptimizationService');

/**
 * Comprehensive Optimization API Routes for Mobile
 * Provides unified endpoints for complete assessment optimization
 */

/**
 * GET /api/mobile/comprehensive/:studentId
 * Get complete optimized assessment results for student
 */
router.get('/:studentId', async (req, res) => {
  try {
    const { studentId } = req.params;
    const { forceRefresh } = req.query;

    console.log(`[MOBILE API] Comprehensive optimization request for student ${studentId}`);

    const startTime = Date.now();

    // Get complete optimized assessment results
    const result = await ComprehensiveOptimizationService.optimizeCompleteAssessmentFlow(
      studentId,
      { forceRefresh: forceRefresh === 'true' }
    );

    const responseTime = Date.now() - startTime;

    res.json({
      success: true,
      studentId,
      responseTime,
      ...result,
      apiVersion: '2.0',
      optimized: true
    });

  } catch (error) {
    console.error(`[MOBILE API] Error in comprehensive optimization:`, error);
    res.status(500).json({
      success: false,
      error: 'Failed to get comprehensive optimization',
      message: error.message,
      studentId: req.params.studentId
    });
  }
});

/**
 * GET /api/mobile/comprehensive/:studentId/quick
 * Get quick optimized summary for mobile dashboard
 */
router.get('/:studentId/quick', async (req, res) => {
  try {
    const { studentId } = req.params;

    console.log(`[MOBILE API] Quick comprehensive summary for student ${studentId}`);

    const startTime = Date.now();

    // Get optimized category results only (fastest response)
    const categoryResults = await ComprehensiveOptimizationService.getOptimizedCategoryResults(studentId);

    if (!categoryResults.success) {
      return res.status(404).json({
        success: false,
        error: 'No data found for student',
        studentId
      });
    }

    const categories = categoryResults.data.categories || [];
    const quickSummary = {
      studentId,
      totalCategories: categories.length,
      completedCategories: categories.filter(cat => cat.isCompleted).length,
      passedCategories: categories.filter(cat => cat.isPassed).length,
      overallScore: categoryResults.data.overallScore || 0,
      status: categories.every(cat => cat.isPassed) ? 'all_passed' :
              categories.some(cat => cat.interventionRequired) ? 'intervention_needed' :
              categories.some(cat => cat.isCompleted) ? 'in_progress' : 'not_started',
      readingLevel: categoryResults.data.readingLevel,
      lastUpdated: categoryResults.data.assessmentDate
    };

    const responseTime = Date.now() - startTime;

    res.json({
      success: true,
      responseTime,
      data: quickSummary,
      source: categoryResults.source,
      cached: categoryResults.source === 'cache',
      apiVersion: '2.0'
    });

  } catch (error) {
    console.error(`[MOBILE API] Error in quick comprehensive summary:`, error);
    res.status(500).json({
      success: false,
      error: 'Failed to get quick summary',
      message: error.message,
      studentId: req.params.studentId
    });
  }
});

/**
 * GET /api/mobile/comprehensive/:studentId/next-action
 * Get next recommended action for student
 */
router.get('/:studentId/next-action', async (req, res) => {
  try {
    const { studentId } = req.params;

    console.log(`[MOBILE API] Getting next action for student ${studentId}`);

    // Get optimized sequential access information
    const categoryResults = await ComprehensiveOptimizationService.getOptimizedCategoryResults(studentId);

    if (!categoryResults.success) {
      return res.status(404).json({
        success: false,
        error: 'No data found for student',
        studentId
      });
    }

    const accessValidation = await ComprehensiveOptimizationService.optimizeSequentialCategoryAccess(
      studentId,
      categoryResults
    );

    const nextAction = {
      studentId,
      readingLevel: accessValidation.readingLevel,
      nextCategory: accessValidation.nextAvailableCategory?.nextCategory,
      accessible: accessValidation.nextAvailableCategory?.accessible || false,
      blockingFactors: accessValidation.nextAvailableCategory?.blockingFactors || [],
      totalCategories: accessValidation.totalCategories,
      completedCategories: accessValidation.accessChecks.filter(check => check.completed).length,
      recommendedAction: accessValidation.nextAvailableCategory?.accessible ? 'continue_assessment' :
                        accessValidation.nextAvailableCategory?.blockingFactors.length > 0 ? 'complete_intervention' :
                        'assessment_complete'
    };

    res.json({
      success: true,
      data: nextAction,
      accessChecks: accessValidation.accessChecks,
      sequentialFlow: accessValidation.sequentialFlow,
      apiVersion: '2.0'
    });

  } catch (error) {
    console.error(`[MOBILE API] Error getting next action:`, error);
    res.status(500).json({
      success: false,
      error: 'Failed to get next action',
      message: error.message,
      studentId: req.params.studentId
    });
  }
});

/**
 * POST /api/mobile/comprehensive/:studentId/trigger-optimization
 * Manually trigger full optimization refresh
 */
router.post('/:studentId/trigger-optimization', async (req, res) => {
  try {
    const { studentId } = req.params;
    const { reason } = req.body;

    console.log(`[MOBILE API] Triggering optimization refresh for student ${studentId}, reason: ${reason || 'manual'}`);

    const startTime = Date.now();

    // Force refresh optimization
    const result = await ComprehensiveOptimizationService.optimizeCompleteAssessmentFlow(
      studentId,
      { forceRefresh: true }
    );

    const responseTime = Date.now() - startTime;

    res.json({
      success: true,
      message: 'Optimization refresh completed',
      studentId,
      responseTime,
      triggerReason: reason || 'manual',
      result: {
        overallStatus: result.assessmentSummary?.overallStatus,
        metrics: result.assessmentSummary?.metrics,
        progressionTriggered: result.progressionCheck?.progressionTriggered || false
      },
      apiVersion: '2.0'
    });

  } catch (error) {
    console.error(`[MOBILE API] Error triggering optimization:`, error);
    res.status(500).json({
      success: false,
      error: 'Failed to trigger optimization',
      message: error.message,
      studentId: req.params.studentId
    });
  }
});

/**
 * GET /api/mobile/comprehensive/stats/optimization
 * Get optimization system statistics
 */
router.get('/stats/optimization', async (req, res) => {
  try {
    const stats = ComprehensiveOptimizationService.getOptimizationStats();

    res.json({
      success: true,
      data: stats,
      timestamp: new Date().toISOString(),
      apiVersion: '2.0'
    });

  } catch (error) {
    console.error(`[MOBILE API] Error getting optimization stats:`, error);
    res.status(500).json({
      success: false,
      error: 'Failed to get optimization stats',
      message: error.message
    });
  }
});

/**
 * POST /api/mobile/comprehensive/batch-optimization
 * Process multiple students optimization in batch
 */
router.post('/batch-optimization', async (req, res) => {
  try {
    const { studentIds, options = {} } = req.body;

    if (!Array.isArray(studentIds) || studentIds.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'Invalid student IDs array',
        required: 'studentIds array'
      });
    }

    console.log(`[MOBILE API] Batch optimization for ${studentIds.length} students`);

    const startTime = Date.now();
    const results = [];

    // Process students in parallel for speed
    const optimizationPromises = studentIds.map(async (studentId) => {
      try {
        const result = await ComprehensiveOptimizationService.optimizeCompleteAssessmentFlow(
          studentId,
          options
        );

        return {
          studentId,
          success: true,
          overallStatus: result.assessmentSummary?.overallStatus,
          metrics: result.assessmentSummary?.metrics,
          processingTime: result.processingTime
        };
      } catch (error) {
        return {
          studentId,
          success: false,
          error: error.message
        };
      }
    });

    const optimizationResults = await Promise.all(optimizationPromises);
    const totalResponseTime = Date.now() - startTime;

    const summary = {
      totalStudents: studentIds.length,
      successful: optimizationResults.filter(r => r.success).length,
      failed: optimizationResults.filter(r => !r.success).length,
      averageProcessingTime: optimizationResults
        .filter(r => r.success && r.processingTime)
        .reduce((sum, r) => sum + r.processingTime, 0) / Math.max(1, optimizationResults.filter(r => r.success).length)
    };

    res.json({
      success: true,
      summary,
      results: optimizationResults,
      totalResponseTime,
      batchSize: studentIds.length,
      apiVersion: '2.0'
    });

  } catch (error) {
    console.error(`[MOBILE API] Error in batch optimization:`, error);
    res.status(500).json({
      success: false,
      error: 'Failed to process batch optimization',
      message: error.message
    });
  }
});

module.exports = router;