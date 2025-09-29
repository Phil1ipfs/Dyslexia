// routes/mobile/interventionResultsMobileRoutes.js
const express = require('express');
const router = express.Router();
const InterventionResultsOptimizedService = require('../../services/mobile/InterventionResultsOptimizedService');
const CategoryResultsOptimizedService = require('../../services/Teachers/CategoryResultsOptimizedService');

/**
 * ⚡ Optimized Intervention Results API for Mobile Apps
 * Fast intervention pass/fail determination and attempt tracking
 */

/**
 * GET /api/mobile/intervention-results/:studentId/:interventionId
 * Get complete intervention results with pass/fail status (FAST)
 */
router.get('/:studentId/:interventionId', async (req, res) => {
  try {
    const { studentId, interventionId } = req.params;
    const { forceRefresh } = req.query;

    console.log(`[MOBILE API] Getting intervention results for student ${studentId}, intervention ${interventionId}`);

    const startTime = Date.now();

    // Get optimized intervention results
    const result = await InterventionResultsOptimizedService.getInterventionResultsOptimized(
      studentId,
      interventionId,
      forceRefresh === 'true'
    );

    const responseTime = Date.now() - startTime;

    res.json({
      success: true,
      studentId,
      interventionId,
      responseTime,
      ...result,
      apiVersion: '2.1'
    });

  } catch (error) {
    console.error(`[MOBILE API] Error getting intervention results:`, error);
    res.status(500).json({
      success: false,
      error: 'Failed to get intervention results',
      message: error.message,
      studentId: req.params.studentId,
      interventionId: req.params.interventionId
    });
  }
});

/**
 * GET /api/mobile/intervention-results/:studentId/:interventionId/quick
 * Ultra-fast intervention status check for mobile dashboard (~50ms)
 */
router.get('/:studentId/:interventionId/quick', async (req, res) => {
  try {
    const { studentId, interventionId } = req.params;

    console.log(`[MOBILE API] Quick intervention status for student ${studentId}`);

    const startTime = Date.now();

    // Get quick intervention status
    const result = await InterventionResultsOptimizedService.getQuickInterventionStatus(
      studentId,
      interventionId
    );

    const responseTime = Date.now() - startTime;

    res.json({
      success: true,
      studentId,
      interventionId,
      responseTime,
      ...result,
      apiVersion: '2.1'
    });

  } catch (error) {
    console.error(`[MOBILE API] Error getting quick intervention status:`, error);
    res.status(500).json({
      success: false,
      error: 'Failed to get quick intervention status',
      message: error.message,
      studentId: req.params.studentId,
      interventionId: req.params.interventionId
    });
  }
});

/**
 * GET /api/mobile/intervention-results/student/:studentId/all
 * Get all intervention results for student with attempts summary
 */
router.get('/student/:studentId/all', async (req, res) => {
  try {
    const { studentId } = req.params;

    console.log(`[MOBILE API] Getting all intervention results for student ${studentId}`);

    const startTime = Date.now();

    // Get category results with intervention data (optimized)
    const categoryResults = await CategoryResultsOptimizedService.getCategoryResultsOptimized(studentId);

    if (!categoryResults.success) {
      return res.status(404).json({
        success: false,
        error: 'No data found for student',
        studentId
      });
    }

    // Extract intervention data from category results
    const interventions = categoryResults.data.categories
      .filter(cat => cat.interventionData?.required)
      .map(cat => ({
        category: cat.categoryName,
        interventionData: cat.interventionData,
        categoryScore: cat.score,
        categoryPassed: cat.isPassed
      }));

    const summary = categoryResults.data.summary?.interventionSummary || {
      hasInterventions: false,
      totalRequired: 0
    };

    const responseTime = Date.now() - startTime;

    res.json({
      success: true,
      studentId,
      responseTime,
      data: {
        interventions,
        summary,
        totalInterventions: interventions.length,
        studentName: categoryResults.data.studentName,
        readingLevel: categoryResults.data.readingLevel
      },
      source: categoryResults.source,
      apiVersion: '2.1'
    });

  } catch (error) {
    console.error(`[MOBILE API] Error getting all intervention results:`, error);
    res.status(500).json({
      success: false,
      error: 'Failed to get all intervention results',
      message: error.message,
      studentId: req.params.studentId
    });
  }
});

/**
 * GET /api/mobile/intervention-results/student/:studentId/summary
 * Get intervention summary for mobile dashboard
 */
router.get('/student/:studentId/summary', async (req, res) => {
  try {
    const { studentId } = req.params;

    console.log(`[MOBILE API] Getting intervention summary for student ${studentId}`);

    const startTime = Date.now();

    // Get category results (uses cache when available)
    const categoryResults = await CategoryResultsOptimizedService.getCategoryResultsOptimized(studentId);

    if (!categoryResults.success) {
      return res.status(404).json({
        success: false,
        error: 'No data found for student',
        studentId
      });
    }

    // Extract just the intervention summary
    const interventionSummary = categoryResults.data.summary?.interventionSummary || {
      hasInterventions: false,
      totalRequired: 0,
      message: 'No interventions required'
    };

    // Add quick access data for mobile
    const quickData = {
      studentId,
      studentName: categoryResults.data.studentName,
      hasInterventions: interventionSummary.hasInterventions,
      urgency: interventionSummary.urgency || 'low',
      urgencyMessage: interventionSummary.urgencyMessage || 'No action needed',
      nextAction: interventionSummary.nextAction || { type: 'none', message: 'No action needed' },
      completionRate: interventionSummary.completionRate || 0,
      categoriesNeedingAttention: interventionSummary.categoriesNeedingAttention || []
    };

    const responseTime = Date.now() - startTime;

    res.json({
      success: true,
      studentId,
      responseTime,
      data: quickData,
      fullSummary: interventionSummary,
      source: categoryResults.source,
      cached: categoryResults.source === 'cache',
      apiVersion: '2.1'
    });

  } catch (error) {
    console.error(`[MOBILE API] Error getting intervention summary:`, error);
    res.status(500).json({
      success: false,
      error: 'Failed to get intervention summary',
      message: error.message,
      studentId: req.params.studentId
    });
  }
});

/**
 * POST /api/mobile/intervention-results/:studentId/:interventionId/refresh
 * Force refresh intervention results (when new responses added)
 */
router.post('/:studentId/:interventionId/refresh', async (req, res) => {
  try {
    const { studentId, interventionId } = req.params;
    const { reason } = req.body;

    console.log(`[MOBILE API] Refreshing intervention results for ${studentId}, reason: ${reason || 'manual'}`);

    const startTime = Date.now();

    // Clear intervention cache
    InterventionResultsOptimizedService.clearInterventionCache(studentId, interventionId);

    // Also clear category results cache since it includes intervention data
    CategoryResultsOptimizedService.clearStudentCache(studentId);

    // Get fresh intervention results
    const result = await InterventionResultsOptimizedService.getInterventionResultsOptimized(
      studentId,
      interventionId,
      true // Force refresh
    );

    const responseTime = Date.now() - startTime;

    res.json({
      success: true,
      message: 'Intervention results refreshed',
      studentId,
      interventionId,
      responseTime,
      refreshReason: reason || 'manual',
      result: {
        status: result.data?.status,
        score: result.data?.score,
        isPassed: result.data?.isPassed,
        progressPercentage: result.data?.progressPercentage
      },
      apiVersion: '2.1'
    });

  } catch (error) {
    console.error(`[MOBILE API] Error refreshing intervention results:`, error);
    res.status(500).json({
      success: false,
      error: 'Failed to refresh intervention results',
      message: error.message,
      studentId: req.params.studentId,
      interventionId: req.params.interventionId
    });
  }
});

/**
 * GET /api/mobile/intervention-results/stats/performance
 * Get intervention performance statistics
 */
router.get('/stats/performance', async (req, res) => {
  try {
    const cacheStats = InterventionResultsOptimizedService.getInterventionCacheStats();

    res.json({
      success: true,
      data: {
        cache: cacheStats,
        optimization: {
          version: '2.1',
          features: [
            'fast_pass_fail_detection',
            'intervention_attempt_tracking',
            'mobile_dashboard_integration',
            'real_time_cache_management'
          ]
        },
        performance: {
          averageResponseTime: '50-150ms cached, 200-500ms fresh',
          cacheHitRate: `${cacheStats.hitRate}%`,
          activeProcessing: cacheStats.activeProcessing
        }
      },
      timestamp: new Date().toISOString(),
      apiVersion: '2.1'
    });

  } catch (error) {
    console.error(`[MOBILE API] Error getting performance stats:`, error);
    res.status(500).json({
      success: false,
      error: 'Failed to get performance stats',
      message: error.message
    });
  }
});

/**
 * POST /api/mobile/intervention-results/batch-status
 * Get intervention status for multiple students (for teacher dashboards)
 */
router.post('/batch-status', async (req, res) => {
  try {
    const { studentIds } = req.body;

    if (!Array.isArray(studentIds) || studentIds.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'Invalid student IDs array',
        required: 'studentIds array'
      });
    }

    console.log(`[MOBILE API] Batch intervention status for ${studentIds.length} students`);

    const startTime = Date.now();
    const results = [];

    // Process students in parallel for speed
    const statusPromises = studentIds.map(async (studentId) => {
      try {
        const categoryResults = await CategoryResultsOptimizedService.getCategoryResultsOptimized(studentId);

        if (!categoryResults.success) {
          return {
            studentId,
            success: false,
            error: 'No data found'
          };
        }

        const interventionSummary = categoryResults.data.summary?.interventionSummary || {
          hasInterventions: false,
          totalRequired: 0
        };

        return {
          studentId,
          success: true,
          studentName: categoryResults.data.studentName,
          hasInterventions: interventionSummary.hasInterventions,
          urgency: interventionSummary.urgency || 'low',
          nextAction: interventionSummary.nextAction?.type || 'none',
          completionRate: interventionSummary.completionRate || 0,
          source: categoryResults.source
        };
      } catch (error) {
        return {
          studentId,
          success: false,
          error: error.message
        };
      }
    });

    const batchResults = await Promise.all(statusPromises);
    const totalResponseTime = Date.now() - startTime;

    const summary = {
      totalStudents: studentIds.length,
      successful: batchResults.filter(r => r.success).length,
      failed: batchResults.filter(r => !r.success).length,
      studentsWithInterventions: batchResults.filter(r => r.success && r.hasInterventions).length,
      highUrgency: batchResults.filter(r => r.success && r.urgency === 'high').length
    };

    res.json({
      success: true,
      summary,
      results: batchResults,
      totalResponseTime,
      batchSize: studentIds.length,
      apiVersion: '2.1'
    });

  } catch (error) {
    console.error(`[MOBILE API] Error in batch intervention status:`, error);
    res.status(500).json({
      success: false,
      error: 'Failed to process batch intervention status',
      message: error.message
    });
  }
});

module.exports = router;