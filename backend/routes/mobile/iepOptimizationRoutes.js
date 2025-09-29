// routes/mobile/iepOptimizationRoutes.js
const express = require('express');
const router = express.Router();
const AutomaticIEPReportGenerator = require('../../services/AutomaticIEPReportGenerator');

/**
 * ⚡ Optimized IEP Report Routes for Mobile Apps
 * Fast IEP report generation with proper formatting
 */

/**
 * POST /api/mobile/iep/refresh/:studentId
 * Manually refresh IEP report with optimized formatting
 */
router.post('/refresh/:studentId', async (req, res) => {
  try {
    const { studentId } = req.params;
    const { reason } = req.body;

    console.log(`[MOBILE IEP] Refreshing IEP report for student ${studentId}, reason: ${reason || 'manual'}`);

    const startTime = Date.now();

    // Trigger IEP report regeneration with optimized formatting
    const result = await AutomaticIEPReportGenerator.generateIEPReportForStudent(
      parseInt(studentId),
      'manual_refresh'
    );

    const processingTime = Date.now() - startTime;

    if (result) {
      res.json({
        success: true,
        message: 'IEP report refreshed successfully',
        studentId,
        iepReportId: result._id,
        processingTime,
        refreshReason: reason || 'manual',
        optimizations: [
          'Proper Phonological Awareness scoring (matches format)',
          'Corrected intervention progress display',
          'Concise student summary for single-page layout'
        ],
        apiVersion: '2.1'
      });
    } else {
      res.status(404).json({
        success: false,
        error: 'No category results found for student',
        studentId,
        message: 'Student must complete assessment before IEP report can be generated'
      });
    }

  } catch (error) {
    console.error(`[MOBILE IEP] Error refreshing IEP report:`, error);
    res.status(500).json({
      success: false,
      error: 'Failed to refresh IEP report',
      message: error.message,
      studentId: req.params.studentId
    });
  }
});

/**
 * GET /api/mobile/iep/status/:studentId
 * Get IEP report status with formatting information
 */
router.get('/status/:studentId', async (req, res) => {
  try {
    const { studentId } = req.params;

    console.log(`[MOBILE IEP] Getting IEP status for student ${studentId}`);

    const startTime = Date.now();

    // Check if IEP report exists
    const mongoose = require('mongoose');
    const testDb = mongoose.connection.useDb('test');
    const iepCollection = testDb.collection('iep_reports');

    const existingReport = await iepCollection.findOne(
      { studentNumber: studentId.toString() },
      { projection: { _id: 1, objectives: 1, overallScore: 1, studentSummary: 1, updatedAt: 1 } }
    );

    const responseTime = Date.now() - startTime;

    if (existingReport) {
      // Check if report has optimized formatting
      const hasOptimizedFormatting = existingReport.objectives?.some(obj =>
        obj.performanceDetails || obj.interventionProgress
      );

      const hasStudentSummary = !!existingReport.studentSummary;

      res.json({
        success: true,
        studentId,
        responseTime,
        data: {
          hasIEPReport: true,
          iepReportId: existingReport._id,
          overallScore: existingReport.overallScore,
          lastUpdated: existingReport.updatedAt,
          hasOptimizedFormatting,
          hasStudentSummary,
          totalObjectives: existingReport.objectives?.length || 0,
          needsRefresh: !hasOptimizedFormatting || !hasStudentSummary
        },
        apiVersion: '2.1'
      });
    } else {
      res.json({
        success: true,
        studentId,
        responseTime,
        data: {
          hasIEPReport: false,
          needsGeneration: true,
          message: 'No IEP report found - student may need to complete assessment first'
        },
        apiVersion: '2.1'
      });
    }

  } catch (error) {
    console.error(`[MOBILE IEP] Error getting IEP status:`, error);
    res.status(500).json({
      success: false,
      error: 'Failed to get IEP status',
      message: error.message,
      studentId: req.params.studentId
    });
  }
});

/**
 * POST /api/mobile/iep/batch-refresh
 * Refresh IEP reports for multiple students with optimized formatting
 */
router.post('/batch-refresh', async (req, res) => {
  try {
    const { studentIds, reason } = req.body;

    if (!Array.isArray(studentIds) || studentIds.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'Invalid student IDs array',
        required: 'studentIds array'
      });
    }

    console.log(`[MOBILE IEP] Batch IEP refresh for ${studentIds.length} students, reason: ${reason || 'manual'}`);

    const startTime = Date.now();
    const results = [];

    // Process students sequentially to avoid overwhelming the system
    for (const studentId of studentIds) {
      try {
        const result = await AutomaticIEPReportGenerator.generateIEPReportForStudent(
          parseInt(studentId),
          'batch_refresh'
        );

        results.push({
          studentId,
          success: true,
          iepReportId: result?._id || null,
          hasReport: !!result
        });
      } catch (error) {
        results.push({
          studentId,
          success: false,
          error: error.message
        });
      }
    }

    const totalResponseTime = Date.now() - startTime;

    const summary = {
      totalStudents: studentIds.length,
      successful: results.filter(r => r.success).length,
      failed: results.filter(r => !r.success).length,
      reportsGenerated: results.filter(r => r.success && r.hasReport).length
    };

    res.json({
      success: true,
      summary,
      results,
      totalResponseTime,
      batchSize: studentIds.length,
      refreshReason: reason || 'manual',
      optimizations: [
        'Proper Phonological Awareness scoring (matches format)',
        'Corrected intervention progress display',
        'Concise student summary for single-page layout'
      ],
      apiVersion: '2.1'
    });

  } catch (error) {
    console.error(`[MOBILE IEP] Error in batch IEP refresh:`, error);
    res.status(500).json({
      success: false,
      error: 'Failed to process batch IEP refresh',
      message: error.message
    });
  }
});

module.exports = router;