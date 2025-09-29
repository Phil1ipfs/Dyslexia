// routes/mobile/categoryResultsMobileRoutes.js
const express = require('express');
const router = express.Router();
const CategoryResultsOptimizedService = require('../../services/Teachers/CategoryResultsOptimizedService');

/**
 * Mobile-Optimized Category Results Routes
 * Fast, cached, and real-time processing for mobile apps
 */

// Get category results optimized for mobile (with caching)
router.get('/student/:studentId', async (req, res) => {
  try {
    const { studentId } = req.params;
    const forceRefresh = req.query.refresh === 'true';

    console.log(`[MOBILE API] Category results request for student ${studentId}, forceRefresh: ${forceRefresh}`);

    const startTime = Date.now();
    const result = await CategoryResultsOptimizedService.getCategoryResultsOptimized(studentId, forceRefresh);
    const processingTime = Date.now() - startTime;

    console.log(`[MOBILE API] ✅ Response ready in ${processingTime}ms for student ${studentId} (source: ${result.source})`);

    res.json({
      success: true,
      data: result.data,
      metadata: {
        source: result.source,
        processingTimeMs: processingTime,
        serverTimestamp: new Date().toISOString(),
        optimized: true
      }
    });

  } catch (error) {
    console.error(`[MOBILE API] Error getting category results:`, error);
    res.status(500).json({
      success: false,
      message: 'Error retrieving category results',
      error: error.message
    });
  }
});

// Get real-time processing status
router.get('/student/:studentId/status', async (req, res) => {
  try {
    const { studentId } = req.params;

    const status = await CategoryResultsOptimizedService.getProcessingStatus(studentId);

    res.json({
      success: true,
      studentId: parseInt(studentId),
      processing: status,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error(`[MOBILE API] Error getting processing status:`, error);
    res.status(500).json({
      success: false,
      message: 'Error getting processing status',
      error: error.message
    });
  }
});

// Get quick summary for dashboard (minimal data)
router.get('/student/:studentId/summary', async (req, res) => {
  try {
    const { studentId } = req.params;

    const result = await CategoryResultsOptimizedService.getCategoryResultsOptimized(studentId);

    if (!result.success) {
      return res.status(404).json({
        success: false,
        message: 'No results found'
      });
    }

    // Return minimal summary for quick dashboard loading
    const summary = {
      studentId: result.data.studentId,
      studentName: result.data.studentName,
      overallScore: result.data.overallScore,
      readingLevel: result.data.readingLevel,
      completedCategories: result.data.completedCategories,
      totalCategories: result.data.totalCategories,
      allCategoriesPassed: result.data.allCategoriesPassed,
      performance: result.data.summary.performance,
      nextAction: result.data.summary.nextAction,
      progressPercentage: result.data.summary.progressPercentage,
      lastAssessment: result.data.assessmentDate
    };

    res.json({
      success: true,
      data: summary,
      metadata: {
        source: result.source,
        timestamp: new Date().toISOString(),
        type: 'summary'
      }
    });

  } catch (error) {
    console.error(`[MOBILE API] Error getting summary:`, error);
    res.status(500).json({
      success: false,
      message: 'Error retrieving summary',
      error: error.message
    });
  }
});

// Trigger background processing (for testing/manual refresh)
router.post('/student/:studentId/refresh', async (req, res) => {
  try {
    const { studentId } = req.params;

    console.log(`[MOBILE API] Manual refresh triggered for student ${studentId}`);

    // Clear cache and force regeneration
    CategoryResultsOptimizedService.clearStudentCache(studentId);

    // Start background processing
    const result = await CategoryResultsOptimizedService.getCategoryResultsOptimized(studentId, true);

    res.json({
      success: true,
      message: 'Refresh completed',
      data: result.data,
      metadata: {
        source: result.source,
        refreshed: true,
        timestamp: new Date().toISOString()
      }
    });

  } catch (error) {
    console.error(`[MOBILE API] Error refreshing:`, error);
    res.status(500).json({
      success: false,
      message: 'Error refreshing data',
      error: error.message
    });
  }
});

// Batch processing for multiple students (efficient for teacher dashboards)
router.post('/batch', async (req, res) => {
  try {
    const { studentIds } = req.body;

    if (!Array.isArray(studentIds) || studentIds.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'studentIds array is required'
      });
    }

    if (studentIds.length > 10) {
      return res.status(400).json({
        success: false,
        message: 'Maximum 10 students per batch request'
      });
    }

    console.log(`[MOBILE API] Batch processing ${studentIds.length} students`);

    const startTime = Date.now();

    // Process all students in parallel
    const batchPromises = studentIds.map(async (studentId) => {
      try {
        const result = await CategoryResultsOptimizedService.getCategoryResultsOptimized(studentId);
        return {
          studentId,
          success: true,
          data: result.data.summary || {
            overallScore: result.data.overallScore,
            performance: result.data.summary.performance,
            completedCategories: result.data.completedCategories,
            totalCategories: result.data.totalCategories
          },
          source: result.source
        };
      } catch (error) {
        console.error(`[MOBILE API] Batch error for student ${studentId}:`, error);
        return {
          studentId,
          success: false,
          error: error.message
        };
      }
    });

    const results = await Promise.all(batchPromises);
    const processingTime = Date.now() - startTime;

    const successCount = results.filter(r => r.success).length;
    const errorCount = results.filter(r => !r.success).length;

    console.log(`[MOBILE API] ✅ Batch complete: ${successCount} success, ${errorCount} errors in ${processingTime}ms`);

    res.json({
      success: true,
      results,
      summary: {
        total: studentIds.length,
        successful: successCount,
        errors: errorCount,
        processingTimeMs: processingTime
      },
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error(`[MOBILE API] Batch processing error:`, error);
    res.status(500).json({
      success: false,
      message: 'Batch processing failed',
      error: error.message
    });
  }
});

// Get cache statistics (for monitoring)
router.get('/cache/stats', async (req, res) => {
  try {
    const stats = CategoryResultsOptimizedService.getCacheStats();

    res.json({
      success: true,
      cache: stats,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error(`[MOBILE API] Error getting cache stats:`, error);
    res.status(500).json({
      success: false,
      message: 'Error getting cache statistics',
      error: error.message
    });
  }
});

// Clear cache (for maintenance)
router.delete('/cache', async (req, res) => {
  try {
    const { studentId } = req.query;

    if (studentId) {
      CategoryResultsOptimizedService.clearStudentCache(studentId);
      console.log(`[MOBILE API] Cleared cache for student ${studentId}`);
      res.json({
        success: true,
        message: `Cache cleared for student ${studentId}`
      });
    } else {
      CategoryResultsOptimizedService.clearAllCache();
      console.log(`[MOBILE API] Cleared all cache`);
      res.json({
        success: true,
        message: 'All cache cleared'
      });
    }

  } catch (error) {
    console.error(`[MOBILE API] Error clearing cache:`, error);
    res.status(500).json({
      success: false,
      message: 'Error clearing cache',
      error: error.message
    });
  }
});

// Health check endpoint
router.get('/health', async (req, res) => {
  try {
    const stats = CategoryResultsOptimizedService.getCacheStats();

    res.json({
      success: true,
      status: 'healthy',
      service: 'CategoryResultsOptimizedService',
      cache: stats,
      timestamp: new Date().toISOString(),
      uptime: process.uptime()
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      status: 'unhealthy',
      error: error.message
    });
  }
});

module.exports = router;