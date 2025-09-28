const express = require('express');
const router = express.Router();
const { auth, authorize } = require('../middleware/auth');
const { securityMonitoring } = require('../middleware/securityMonitoring');
const { cssProtection } = require('../middleware/cssInjectionProtection');
const { runCSSInjectionTests, generateSecurityReport } = require('../utils/securityTestSuite');
const AuditLogger = require('../middleware/auditLogger');

/**
 * @route   GET /api/security/dashboard
 * @desc    Get security monitoring dashboard data
 * @access  Admin only
 */
router.get('/dashboard', auth, authorize('admin'), async (req, res) => {
  try {
    const dashboard = securityMonitoring.getSecurityDashboard();

    // Add audit log for security dashboard access
    AuditLogger.logDataAccess(
      req.user.id,
      'security_dashboard_access',
      req,
      'Security dashboard accessed for monitoring'
    );

    res.json({
      success: true,
      data: dashboard
    });
  } catch (error) {
    console.error('Error fetching security dashboard:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching security dashboard',
      error: error.message
    });
  }
});

/**
 * @route   GET /api/security/events
 * @desc    Get recent security events with filtering
 * @access  Admin only
 */
router.get('/events', auth, authorize('admin'), async (req, res) => {
  try {
    const {
      eventType,
      severity,
      userId,
      ip,
      limit = 100,
      offset = 0,
      startDate,
      endDate
    } = req.query;

    // Get events from audit logs
    const auditEvents = await AuditLogger.getSecurityEvents({
      eventType,
      severity,
      userId,
      ip,
      limit: parseInt(limit),
      offset: parseInt(offset),
      startDate: startDate ? new Date(startDate) : undefined,
      endDate: endDate ? new Date(endDate) : undefined
    });

    // Add audit log for security events access
    AuditLogger.logDataAccess(
      req.user.id,
      'security_events_access',
      req,
      `Security events accessed with filters: ${JSON.stringify(req.query)}`
    );

    res.json({
      success: true,
      data: auditEvents,
      pagination: {
        limit: parseInt(limit),
        offset: parseInt(offset),
        total: auditEvents.length
      }
    });
  } catch (error) {
    console.error('Error fetching security events:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching security events',
      error: error.message
    });
  }
});

/**
 * @route   GET /api/security/alerts
 * @desc    Get active security alerts
 * @access  Admin only
 */
router.get('/alerts', auth, authorize('admin'), async (req, res) => {
  try {
    // Get active alerts from audit logs
    const alerts = await AuditLogger.getActiveSecurityAlerts();

    // Add audit log for security alerts access
    AuditLogger.logDataAccess(
      req.user.id,
      'security_alerts_access',
      req,
      'Security alerts accessed for monitoring'
    );

    res.json({
      success: true,
      data: alerts
    });
  } catch (error) {
    console.error('Error fetching security alerts:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching security alerts',
      error: error.message
    });
  }
});

/**
 * @route   POST /api/security/alerts/:id/acknowledge
 * @desc    Acknowledge a security alert
 * @access  Admin only
 */
router.post('/alerts/:id/acknowledge', auth, authorize('admin'), async (req, res) => {
  try {
    const { id } = req.params;
    const { notes } = req.body;

    // Acknowledge alert in audit logs
    await AuditLogger.acknowledgeSecurityAlert(id, req.user.id, notes);

    // Add audit log for alert acknowledgment
    AuditLogger.logSecurityEvent(
      req.user.id,
      'alert_acknowledgment',
      {
        alertId: id,
        notes,
        acknowledgedBy: req.user.id
      }
    );

    res.json({
      success: true,
      message: 'Security alert acknowledged successfully'
    });
  } catch (error) {
    console.error('Error acknowledging security alert:', error);
    res.status(500).json({
      success: false,
      message: 'Error acknowledging security alert',
      error: error.message
    });
  }
});

/**
 * @route   GET /api/security/statistics
 * @desc    Get security statistics and trends
 * @access  Admin only
 */
router.get('/statistics', auth, authorize('admin'), async (req, res) => {
  try {
    const { days = 7 } = req.query;
    const daysInt = parseInt(days);

    // Get statistics from audit logs
    const statistics = await AuditLogger.getSecurityStatistics(daysInt);

    // Add audit log for statistics access
    AuditLogger.logDataAccess(
      req.user.id,
      'security_statistics_access',
      req,
      `Security statistics accessed for ${daysInt} days`
    );

    res.json({
      success: true,
      data: statistics
    });
  } catch (error) {
    console.error('Error fetching security statistics:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching security statistics',
      error: error.message
    });
  }
});

/**
 * @route   POST /api/security/test-alert
 * @desc    Test security alert system (development only)
 * @access  Admin only
 */
router.post('/test-alert', auth, authorize('admin'), async (req, res) => {
  try {
    const { severity = 'LOW', message = 'Test alert' } = req.body;

    // Only allow in development environment
    if (process.env.NODE_ENV === 'production') {
      return res.status(403).json({
        success: false,
        message: 'Test alerts not allowed in production'
      });
    }

    // Trigger test alert
    securityMonitoring.triggerSecurityAlert(severity, message, {
      testAlert: true,
      triggeredBy: req.user.id,
      ip: req.ip
    });

    res.json({
      success: true,
      message: 'Test alert triggered successfully'
    });
  } catch (error) {
    console.error('Error triggering test alert:', error);
    res.status(500).json({
      success: false,
      message: 'Error triggering test alert',
      error: error.message
    });
  }
});

/**
 * @route   GET /api/security/css-protection/stats
 * @desc    Get CSS injection protection statistics
 * @access  Admin only
 */
router.get('/css-protection/stats', auth, authorize('admin'), async (req, res) => {
  try {
    const stats = cssProtection.getStats();

    // Add audit log for CSS protection stats access
    AuditLogger.logDataAccess(
      req.user.id,
      'css_protection_stats_access',
      req,
      'CSS injection protection statistics accessed'
    );

    res.json({
      success: true,
      data: stats
    });
  } catch (error) {
    console.error('Error fetching CSS protection stats:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching CSS protection statistics',
      error: error.message
    });
  }
});

/**
 * @route   POST /api/security/css-protection/test
 * @desc    Test CSS injection detection (development only)
 * @access  Admin only
 */
router.post('/css-protection/test', auth, authorize('admin'), async (req, res) => {
  try {
    const { testString, field = 'test' } = req.body;

    // Only allow in development environment
    if (process.env.NODE_ENV === 'production') {
      return res.status(403).json({
        success: false,
        message: 'CSS injection testing not allowed in production'
      });
    }

    if (!testString) {
      return res.status(400).json({
        success: false,
        message: 'testString parameter is required'
      });
    }

    // Test CSS injection detection
    const detection = cssProtection.detectCSSInjection(testString, field);
    const sanitized = cssProtection.sanitizeCSSInjection(testString);

    // Log test attempt
    AuditLogger.logSecurityEvent(
      req.user.id,
      'css_injection_test',
      {
        testString: testString.substring(0, 100), // First 100 chars only
        detected: detection.detected,
        severity: detection.severity,
        patterns: detection.patterns.length
      }
    );

    res.json({
      success: true,
      data: {
        original: testString,
        detection,
        sanitized,
        blocked: detection.severity === 'high' ||
                (detection.severity === 'medium' && detection.patterns.length > 2)
      }
    });
  } catch (error) {
    console.error('Error testing CSS injection detection:', error);
    res.status(500).json({
      success: false,
      message: 'Error testing CSS injection detection',
      error: error.message
    });
  }
});

/**
 * @route   GET /api/security/health
 * @desc    Check security monitoring system health
 * @access  Admin only
 */
router.get('/health', auth, authorize('admin'), async (req, res) => {
  try {
    const health = {
      status: 'healthy',
      timestamp: new Date(),
      components: {
        securityMonitoring: {
          status: 'operational',
          eventsTracked: Object.keys(securityMonitoring.securityEvents).length
        },
        auditLogging: {
          status: 'operational',
          lastLogTime: new Date() // In real implementation, get from audit logs
        },
        alertSystem: {
          status: 'operational',
          thresholds: securityMonitoring.alertThresholds
        },
        cssInjectionProtection: {
          status: 'operational',
          stats: cssProtection.getStats()
        }
      }
    };

    res.json({
      success: true,
      data: health
    });
  } catch (error) {
    console.error('Error checking security health:', error);
    res.status(500).json({
      success: false,
      message: 'Error checking security health',
      error: error.message
    });
  }
});

/**
 * @route   POST /api/security/run-security-tests
 * @desc    Run comprehensive security test suite (development only)
 * @access  Admin only
 */
router.post('/run-security-tests', auth, authorize('admin'), async (req, res) => {
  try {
    // Only allow in development environment
    if (process.env.NODE_ENV === 'production') {
      return res.status(403).json({
        success: false,
        message: 'Security testing not allowed in production'
      });
    }

    console.log('Running comprehensive CSS injection security tests...');

    // Run CSS injection tests
    const testResults = runCSSInjectionTests(cssProtection);
    const report = generateSecurityReport(testResults);

    // Log security test execution
    AuditLogger.logSecurityEvent(
      req.user.id,
      'security_test_suite_execution',
      {
        testType: 'css_injection_protection',
        totalTests: testResults.summary.totalTests,
        passed: testResults.summary.passed,
        failed: testResults.summary.failed,
        successRate: testResults.summary.successRate,
        falsePositives: testResults.summary.falsePositives,
        falseNegatives: testResults.summary.falseNegatives
      }
    );

    // Output report to console for development
    console.log(report);

    res.json({
      success: true,
      message: 'Security test suite completed',
      data: {
        summary: testResults.summary,
        report: report,
        details: testResults.details
      }
    });
  } catch (error) {
    console.error('Error running security tests:', error);
    res.status(500).json({
      success: false,
      message: 'Error running security test suite',
      error: error.message
    });
  }
});

module.exports = router;