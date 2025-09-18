const express = require('express');
const router = express.Router();
const interventionMonitoringService = require('../../services/Teachers/InterventionMonitoringService');

/**
 * Intervention Monitoring Service API Routes
 * Provides control and status endpoints for the background monitoring service
 */

// GET /api/intervention-monitoring/status
// Get monitoring service status
router.get('/status', async (req, res) => {
  try {
    const status = interventionMonitoringService.getStatus();
    const stats = await interventionMonitoringService.getMonitoringStats();

    res.json({
      success: true,
      message: 'Monitoring service status retrieved',
      data: {
        status,
        stats
      }
    });
  } catch (error) {
    console.error('[MONITORING API] Error getting status:', error);
    res.status(500).json({
      success: false,
      message: 'Error retrieving monitoring status',
      error: error.message
    });
  }
});

// POST /api/intervention-monitoring/start
// Start the monitoring service
router.post('/start', (req, res) => {
  try {
    interventionMonitoringService.start();

    res.json({
      success: true,
      message: 'Intervention monitoring service started',
      data: interventionMonitoringService.getStatus()
    });
  } catch (error) {
    console.error('[MONITORING API] Error starting service:', error);
    res.status(500).json({
      success: false,
      message: 'Error starting monitoring service',
      error: error.message
    });
  }
});

// POST /api/intervention-monitoring/stop
// Stop the monitoring service
router.post('/stop', (req, res) => {
  try {
    interventionMonitoringService.stop();

    res.json({
      success: true,
      message: 'Intervention monitoring service stopped',
      data: interventionMonitoringService.getStatus()
    });
  } catch (error) {
    console.error('[MONITORING API] Error stopping service:', error);
    res.status(500).json({
      success: false,
      message: 'Error stopping monitoring service',
      error: error.message
    });
  }
});

// POST /api/intervention-monitoring/check
// Force a manual check
router.post('/check', async (req, res) => {
  try {
    await interventionMonitoringService.forceCheck();

    res.json({
      success: true,
      message: 'Manual check completed',
      data: {
        checkedAt: new Date(),
        status: interventionMonitoringService.getStatus()
      }
    });
  } catch (error) {
    console.error('[MONITORING API] Error in manual check:', error);
    res.status(500).json({
      success: false,
      message: 'Error performing manual check',
      error: error.message
    });
  }
});

// PUT /api/intervention-monitoring/interval
// Update check interval
router.put('/interval', (req, res) => {
  try {
    const { intervalSeconds } = req.body;

    if (!intervalSeconds || intervalSeconds < 10 || intervalSeconds > 3600) {
      return res.status(400).json({
        success: false,
        message: 'Invalid interval. Must be between 10 and 3600 seconds.',
        errors: [{ field: 'intervalSeconds', message: 'Must be between 10 and 3600 seconds' }]
      });
    }

    const intervalMs = intervalSeconds * 1000;
    interventionMonitoringService.setCheckInterval(intervalMs);

    res.json({
      success: true,
      message: `Check interval updated to ${intervalSeconds} seconds`,
      data: interventionMonitoringService.getStatus()
    });
  } catch (error) {
    console.error('[MONITORING API] Error updating interval:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating check interval',
      error: error.message
    });
  }
});

// GET /api/intervention-monitoring/stats
// Get detailed monitoring statistics
router.get('/stats', async (req, res) => {
  try {
    const stats = await interventionMonitoringService.getMonitoringStats();

    res.json({
      success: true,
      message: 'Monitoring statistics retrieved',
      data: stats
    });
  } catch (error) {
    console.error('[MONITORING API] Error getting stats:', error);
    res.status(500).json({
      success: false,
      message: 'Error retrieving monitoring statistics',
      error: error.message
    });
  }
});

// GET /api/intervention-monitoring/debug-data
// Get debug data about intervention results
router.get('/debug-data', async (req, res) => {
  try {
    const InterventionResults = require('../../models/Teachers/ManageProgress/interventionResultsModel');
    const InterventionAssessment = require('../../models/Teachers/ManageProgress/interventionAssessmentModel');
    const InterventionResponse = require('../../models/Teachers/ManageProgress/interventionResponseModel');

    // Get latest intervention results
    const results = await InterventionResults.find({}).sort({ createdAt: -1 }).limit(5);

    // Get intervention assessments
    const assessments = await InterventionAssessment.find({}).sort({ createdAt: -1 }).limit(3);

    // Get intervention responses
    const responses = await InterventionResponse.find({}).sort({ createdAt: -1 }).limit(10);

    res.json({
      success: true,
      message: 'Debug data retrieved',
      data: {
        interventionResults: results,
        interventionAssessments: assessments,
        interventionResponses: responses,
        counts: {
          totalResults: await InterventionResults.countDocuments({}),
          totalAssessments: await InterventionAssessment.countDocuments({}),
          totalResponses: await InterventionResponse.countDocuments({})
        }
      }
    });
  } catch (error) {
    console.error('[MONITORING API] Error getting debug data:', error);
    res.status(500).json({
      success: false,
      message: 'Error retrieving debug data',
      error: error.message
    });
  }
});

// POST /api/intervention-monitoring/force-process
// Force process a specific intervention ID
router.post('/force-process', async (req, res) => {
  try {
    const { interventionId } = req.body;

    if (!interventionId) {
      return res.status(400).json({
        success: false,
        message: 'interventionId is required',
        error: 'Missing interventionId parameter'
      });
    }

    console.log(`[FORCE PROCESS] 🔧 Manual intervention processing requested for: ${interventionId}`);

    const InterventionGeneratorService = require('../../services/Teachers/InterventionGeneratorService');
    const InterventionAssessment = require('../../models/Teachers/ManageProgress/interventionAssessmentModel');

    // Get intervention details
    const intervention = await InterventionAssessment.findById(interventionId);
    if (!intervention) {
      return res.status(404).json({
        success: false,
        message: 'Intervention not found',
        error: `No intervention found with ID: ${interventionId}`
      });
    }

    console.log(`[FORCE PROCESS] Found intervention for student ${intervention.studentId}, category: ${intervention.category}`);

    // Force process the intervention results
    const results = await InterventionGeneratorService.processInterventionResults(interventionId);

    res.json({
      success: true,
      message: 'Intervention processed successfully',
      data: {
        interventionId: interventionId,
        studentId: intervention.studentId,
        category: intervention.category,
        results: results
      }
    });

  } catch (error) {
    console.error('[FORCE PROCESS] Error processing intervention:', error);
    res.status(500).json({
      success: false,
      message: 'Error processing intervention',
      error: error.message
    });
  }
});

// Error handling middleware
router.use((error, req, res, next) => {
  console.error('Intervention Monitoring Route Error:', error);

  res.status(500).json({
    success: false,
    message: 'Internal server error in monitoring service',
    error: process.env.NODE_ENV === 'development' ? error.message : 'Something went wrong'
  });
});

module.exports = router;