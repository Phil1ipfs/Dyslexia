// Notification API routes for WebSocket management
const express = require('express');
const router = express.Router();
const NotificationService = require('../services/NotificationService');

/**
 * GET /api/notifications/health
 * Get WebSocket service health status
 */
router.get('/health', async (req, res) => {
  try {
    const healthStatus = NotificationService.healthCheck();
    const stats = NotificationService.getStats();

    res.json({
      success: true,
      health: healthStatus,
      statistics: stats,
      websocketUrl: `ws://localhost:${process.env.PORT || 5001}/notifications`,
      message: 'WebSocket notification service status'
    });
  } catch (error) {
    console.error('[NOTIFICATIONS API] ❌ Health check error:', error);
    res.status(500).json({
      success: false,
      error: error.message,
      health: { status: 'unhealthy', error: error.message }
    });
  }
});

/**
 * GET /api/notifications/stats
 * Get current WebSocket connection statistics
 */
router.get('/stats', async (req, res) => {
  try {
    const stats = NotificationService.getStats();

    res.json({
      success: true,
      data: stats,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('[NOTIFICATIONS API] ❌ Stats error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * POST /api/notifications/test/:studentId
 * Send test notification to specific student (for development/testing)
 */
router.post('/test/:studentId', async (req, res) => {
  try {
    const { studentId } = req.params;
    const { type = 'test', message = 'Test notification' } = req.body;

    if (!studentId) {
      return res.status(400).json({
        success: false,
        error: 'studentId parameter is required'
      });
    }

    const testNotification = {
      type: type,
      studentId: parseInt(studentId),
      timestamp: new Date().toISOString(),
      data: {
        message: message,
        source: 'api_test'
      },
      message: message
    };

    NotificationService.sendToStudent(parseInt(studentId), testNotification);

    res.json({
      success: true,
      message: `Test notification sent to student ${studentId}`,
      notification: testNotification
    });
  } catch (error) {
    console.error('[NOTIFICATIONS API] ❌ Test notification error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * POST /api/notifications/broadcast
 * Broadcast notification to all connected clients (admin only)
 */
router.post('/broadcast', async (req, res) => {
  try {
    const { message, type = 'system_announcement' } = req.body;

    if (!message) {
      return res.status(400).json({
        success: false,
        error: 'message field is required'
      });
    }

    const broadcastNotification = {
      type: type,
      timestamp: new Date().toISOString(),
      data: {
        message: message,
        source: 'admin_broadcast'
      },
      message: message
    };

    NotificationService.broadcast(broadcastNotification);

    res.json({
      success: true,
      message: 'Broadcast notification sent to all connected clients',
      notification: broadcastNotification
    });
  } catch (error) {
    console.error('[NOTIFICATIONS API] ❌ Broadcast error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * GET /api/notifications/connection-info/:studentId
 * Get WebSocket connection information for specific student
 */
router.get('/connection-info/:studentId', async (req, res) => {
  try {
    const { studentId } = req.params;

    if (!studentId) {
      return res.status(400).json({
        success: false,
        error: 'studentId parameter is required'
      });
    }

    const hasConnections = NotificationService.connections.has(parseInt(studentId));
    const connectionCount = hasConnections
      ? NotificationService.connections.get(parseInt(studentId)).length
      : 0;

    res.json({
      success: true,
      data: {
        studentId: parseInt(studentId),
        hasActiveConnections: hasConnections,
        connectionCount: connectionCount,
        websocketUrl: `ws://localhost:${process.env.PORT || 5001}/notifications`,
        registrationExample: {
          type: 'register',
          studentId: parseInt(studentId),
          userType: 'student'
        }
      }
    });
  } catch (error) {
    console.error('[NOTIFICATIONS API] ❌ Connection info error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

module.exports = router;