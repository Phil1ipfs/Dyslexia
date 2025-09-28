const AuditLogger = require('./auditLogger');

class SecurityMonitoring {
  constructor() {
    this.alertThresholds = {
      // Rate limiting violations
      rateLimitViolations: {
        perMinute: 10,
        perHour: 50
      },
      // Failed authentication attempts
      authFailures: {
        perMinute: 5,
        perHour: 20,
        perDay: 100
      },
      // Permission violations
      permissionViolations: {
        perMinute: 5,
        perHour: 15
      },
      // Data access violations
      dataAccessViolations: {
        perMinute: 3,
        perHour: 10
      }
    };

    // In-memory tracking for real-time monitoring
    this.securityEvents = {
      rateLimitViolations: [],
      authFailures: [],
      permissionViolations: [],
      dataAccessViolations: [],
      suspiciousActivities: []
    };

    // Clean up old events every 5 minutes
    setInterval(() => {
      this.cleanupOldEvents();
    }, 5 * 60 * 1000);
  }

  /**
   * Track security event and check for threshold violations
   */
  trackSecurityEvent(eventType, userId, ip, details = {}) {
    const event = {
      timestamp: new Date(),
      eventType,
      userId: userId || 'anonymous',
      ip,
      details,
      id: this.generateEventId()
    };

    // Add to appropriate tracking array
    if (this.securityEvents[eventType]) {
      this.securityEvents[eventType].push(event);
    } else {
      this.securityEvents.suspiciousActivities.push(event);
    }

    // Check if we need to trigger alerts
    this.checkAlertThresholds(eventType, userId, ip);

    // Log to audit system
    AuditLogger.logSecurityEvent(userId || 'anonymous', eventType, {
      ip,
      details,
      eventId: event.id
    });

    console.log(`[SECURITY MONITORING] ${eventType} event tracked for ${userId || 'anonymous'} from ${ip}`);
  }

  /**
   * Check if alert thresholds have been exceeded
   */
  checkAlertThresholds(eventType, userId, ip) {
    const now = new Date();
    const oneMinuteAgo = new Date(now.getTime() - 60 * 1000);
    const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000);
    const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);

    const events = this.securityEvents[eventType] || [];

    // Count events by timeframe for this IP/user
    const eventsLastMinute = events.filter(e =>
      e.timestamp >= oneMinuteAgo &&
      (e.ip === ip || e.userId === userId)
    ).length;

    const eventsLastHour = events.filter(e =>
      e.timestamp >= oneHourAgo &&
      (e.ip === ip || e.userId === userId)
    ).length;

    const eventsLastDay = events.filter(e =>
      e.timestamp >= oneDayAgo &&
      (e.ip === ip || e.userId === userId)
    ).length;

    const thresholds = this.alertThresholds[eventType];
    if (!thresholds) return;

    // Check thresholds and trigger alerts
    if (thresholds.perMinute && eventsLastMinute >= thresholds.perMinute) {
      this.triggerSecurityAlert('HIGH', `${eventType} threshold exceeded`, {
        eventType,
        userId,
        ip,
        eventsLastMinute,
        threshold: thresholds.perMinute,
        timeframe: '1 minute'
      });
    } else if (thresholds.perHour && eventsLastHour >= thresholds.perHour) {
      this.triggerSecurityAlert('MEDIUM', `${eventType} threshold exceeded`, {
        eventType,
        userId,
        ip,
        eventsLastHour,
        threshold: thresholds.perHour,
        timeframe: '1 hour'
      });
    } else if (thresholds.perDay && eventsLastDay >= thresholds.perDay) {
      this.triggerSecurityAlert('LOW', `${eventType} threshold exceeded`, {
        eventType,
        userId,
        ip,
        eventsLastDay,
        threshold: thresholds.perDay,
        timeframe: '1 day'
      });
    }
  }

  /**
   * Trigger security alert
   */
  triggerSecurityAlert(severity, message, details) {
    const alert = {
      id: this.generateEventId(),
      timestamp: new Date(),
      severity,
      message,
      details,
      status: 'active'
    };

    console.error(`[SECURITY ALERT - ${severity}] ${message}`, details);

    // Log to audit system
    AuditLogger.logSecurityAlert(details.userId || 'anonymous', severity, message, details);

    // In production, you would also:
    // - Send email alerts to security team
    // - Post to Slack/Teams channels
    // - Store in security incident database
    // - Trigger automated responses (temporary IP blocks, etc.)

    this.handleSecurityAlert(alert);
  }

  /**
   * Handle security alert based on severity
   */
  handleSecurityAlert(alert) {
    switch (alert.severity) {
      case 'HIGH':
        // Immediate action required
        console.error(`🚨 HIGH SEVERITY SECURITY ALERT: ${alert.message}`);
        // In production: notify security team immediately
        break;

      case 'MEDIUM':
        // Monitor closely, possible action needed
        console.warn(`⚠️ MEDIUM SEVERITY SECURITY ALERT: ${alert.message}`);
        // In production: add to security queue for review
        break;

      case 'LOW':
        // Log for trend analysis
        console.log(`ℹ️ LOW SEVERITY SECURITY ALERT: ${alert.message}`);
        // In production: add to daily security report
        break;
    }
  }

  /**
   * Get security dashboard data
   */
  getSecurityDashboard() {
    const now = new Date();
    const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000);
    const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);

    const dashboard = {
      timestamp: now,
      summary: {
        totalEventsLastHour: 0,
        totalEventsLastDay: 0,
        activeAlerts: 0
      },
      eventTypes: {}
    };

    // Count events by type and timeframe
    Object.keys(this.securityEvents).forEach(eventType => {
      const events = this.securityEvents[eventType];

      const lastHour = events.filter(e => e.timestamp >= oneHourAgo).length;
      const lastDay = events.filter(e => e.timestamp >= oneDayAgo).length;

      dashboard.eventTypes[eventType] = {
        lastHour,
        lastDay,
        total: events.length
      };

      dashboard.summary.totalEventsLastHour += lastHour;
      dashboard.summary.totalEventsLastDay += lastDay;
    });

    return dashboard;
  }

  /**
   * Clean up old events to prevent memory leaks
   */
  cleanupOldEvents() {
    const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);

    Object.keys(this.securityEvents).forEach(eventType => {
      const originalLength = this.securityEvents[eventType].length;
      this.securityEvents[eventType] = this.securityEvents[eventType]
        .filter(event => event.timestamp > oneDayAgo);

      const cleaned = originalLength - this.securityEvents[eventType].length;
      if (cleaned > 0) {
        console.log(`[SECURITY MONITORING] Cleaned ${cleaned} old ${eventType} events`);
      }
    });
  }

  /**
   * Generate unique event ID
   */
  generateEventId() {
    return `sec_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Detect suspicious patterns
   */
  detectSuspiciousPatterns(userId, ip, req) {
    const suspiciousIndicators = [];

    // Check for rapid requests from same IP
    const recentEvents = Object.values(this.securityEvents)
      .flat()
      .filter(e => e.ip === ip && e.timestamp > new Date(Date.now() - 60 * 1000));

    if (recentEvents.length > 20) {
      suspiciousIndicators.push('rapid_requests');
    }

    // Check for multiple failed authentication attempts
    const authFailures = this.securityEvents.authFailures
      .filter(e => (e.ip === ip || e.userId === userId) &&
                   e.timestamp > new Date(Date.now() - 10 * 60 * 1000));

    if (authFailures.length >= 3) {
      suspiciousIndicators.push('multiple_auth_failures');
    }

    // Check for unusual user agent
    const userAgent = req.get('User-Agent') || '';
    if (!userAgent || userAgent.length < 10 ||
        userAgent.includes('bot') || userAgent.includes('crawl')) {
      suspiciousIndicators.push('suspicious_user_agent');
    }

    // Check for missing common headers
    if (!req.get('Accept') || !req.get('Accept-Language')) {
      suspiciousIndicators.push('missing_browser_headers');
    }

    if (suspiciousIndicators.length > 0) {
      this.trackSecurityEvent('suspiciousActivities', userId, ip, {
        indicators: suspiciousIndicators,
        userAgent,
        path: req.path,
        method: req.method
      });
    }

    return suspiciousIndicators;
  }
}

// Create singleton instance
const securityMonitoring = new SecurityMonitoring();

/**
 * Middleware to monitor security events
 */
const securityMonitoringMiddleware = (req, res, next) => {
  // Track request for pattern analysis
  const userId = req.user?.id || null;
  const ip = req.ip || req.connection.remoteAddress;

  // Detect suspicious patterns
  securityMonitoring.detectSuspiciousPatterns(userId, ip, req);

  // Add security event tracking to request object
  req.trackSecurityEvent = (eventType, details) => {
    securityMonitoring.trackSecurityEvent(eventType, userId, ip, details);
  };

  next();
};

/**
 * Express error handler for security events
 */
const securityErrorHandler = (err, req, res, next) => {
  const userId = req.user?.id || null;
  const ip = req.ip || req.connection.remoteAddress;

  // Track security-related errors
  if (err.status === 401) {
    securityMonitoring.trackSecurityEvent('authFailures', userId, ip, {
      error: err.message,
      path: req.path,
      method: req.method
    });
  } else if (err.status === 403) {
    securityMonitoring.trackSecurityEvent('permissionViolations', userId, ip, {
      error: err.message,
      path: req.path,
      method: req.method
    });
  } else if (err.status === 429) {
    securityMonitoring.trackSecurityEvent('rateLimitViolations', userId, ip, {
      error: err.message,
      path: req.path,
      method: req.method
    });
  }

  // Continue with normal error handling
  next(err);
};

module.exports = {
  SecurityMonitoring,
  securityMonitoring,
  securityMonitoringMiddleware,
  securityErrorHandler
};