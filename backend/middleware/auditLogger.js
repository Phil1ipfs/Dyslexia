const mongoose = require('mongoose');

// Audit log schema
const auditLogSchema = new mongoose.Schema({
  userId: {
    type: String,
    required: true
  },
  userEmail: {
    type: String,
    required: false // Only log if explicitly provided, not from JWT
  },
  action: {
    type: String,
    required: true,
    enum: [
      'LOGIN_SUCCESS', 'LOGIN_FAILED', 'LOGOUT',
      'PASSWORD_CHANGE', 'USER_CREATE', 'USER_UPDATE', 'USER_DELETE',
      'STUDENT_DATA_ACCESS', 'STUDENT_DATA_MODIFY', 'STUDENT_ASSESSMENT_ACCESS',
      'ASSESSMENT_RESULTS_ACCESS', 'ASSESSMENT_RESULTS_MODIFY',
      'INTERVENTION_CREATE', 'INTERVENTION_MODIFY', 'INTERVENTION_ACCESS',
      'FILE_UPLOAD', 'FILE_ACCESS', 'FILE_DELETE',
      'ADMIN_ACTION', 'PERMISSION_VIOLATION', 'RATE_LIMIT_EXCEEDED'
    ]
  },
  resource: {
    type: String,
    required: false // e.g., 'student_responses', 'category_results'
  },
  resourceId: {
    type: String,
    required: false // e.g., student ID, assessment ID
  },
  ipAddress: {
    type: String,
    required: true
  },
  userAgent: {
    type: String,
    required: false
  },
  method: {
    type: String,
    required: true // HTTP method
  },
  endpoint: {
    type: String,
    required: true // API endpoint accessed
  },
  success: {
    type: Boolean,
    required: true
  },
  errorMessage: {
    type: String,
    required: false
  },
  sensitiveData: {
    type: Boolean,
    default: false // Flag for operations involving sensitive student data
  },
  metadata: {
    type: mongoose.Schema.Types.Mixed,
    required: false // Additional context-specific data
  },
  timestamp: {
    type: Date,
    default: Date.now
  }
}, {
  collection: 'audit_logs'
});

// Create indexes for better query performance
auditLogSchema.index({ userId: 1, timestamp: -1 });
auditLogSchema.index({ action: 1, timestamp: -1 });
auditLogSchema.index({ ipAddress: 1, timestamp: -1 });
auditLogSchema.index({ sensitiveData: 1, timestamp: -1 });

const AuditLog = mongoose.model('AuditLog', auditLogSchema);

class AuditLogger {
  /**
   * Log a security event
   * @param {Object} params - Audit log parameters
   */
  static async log({
    userId,
    userEmail = null,
    action,
    resource = null,
    resourceId = null,
    ipAddress,
    userAgent = null,
    method,
    endpoint,
    success,
    errorMessage = null,
    sensitiveData = false,
    metadata = null
  }) {
    try {
      // Use the test database for audit logs
      const testDb = mongoose.connection.useDb('test');
      const AuditLogModel = testDb.model('AuditLog', auditLogSchema);

      const auditEntry = new AuditLogModel({
        userId,
        userEmail,
        action,
        resource,
        resourceId,
        ipAddress: this.sanitizeIP(ipAddress),
        userAgent,
        method,
        endpoint,
        success,
        errorMessage,
        sensitiveData,
        metadata,
        timestamp: new Date()
      });

      await auditEntry.save();

      // Log to console for immediate visibility (without sensitive data)
      const logLevel = success ? 'info' : 'warn';
      const logMessage = `[AUDIT] ${action} - User: ${userId}, IP: ${this.sanitizeIP(ipAddress)}, Success: ${success}`;

      if (success) {
        console.log(logMessage);
      } else {
        console.warn(logMessage + (errorMessage ? `, Error: ${errorMessage}` : ''));
      }

      // Alert on sensitive data access failures
      if (!success && sensitiveData) {
        console.error(`[SECURITY ALERT] Failed access to sensitive data - User: ${userId}, Action: ${action}, IP: ${this.sanitizeIP(ipAddress)}`);
      }

    } catch (error) {
      console.error('Failed to write audit log:', error);
      // Don't throw error to avoid breaking the main application flow
    }
  }

  /**
   * Sanitize IP address for logging
   * @param {string} ip - IP address
   * @returns {string} - Sanitized IP
   */
  static sanitizeIP(ip) {
    if (!ip) return 'unknown';

    // For IPv4, mask the last octet for privacy
    if (ip.includes('.') && !ip.includes(':')) {
      const parts = ip.split('.');
      if (parts.length === 4) {
        return `${parts[0]}.${parts[1]}.${parts[2]}.xxx`;
      }
    }

    // For IPv6 or other formats, mask last segment
    if (ip.includes(':')) {
      const parts = ip.split(':');
      if (parts.length > 1) {
        parts[parts.length - 1] = 'xxxx';
        return parts.join(':');
      }
    }

    return ip.substring(0, Math.min(ip.length, 10)) + 'xxx';
  }

  /**
   * Log authentication events
   */
  static async logAuth(userId, action, req, success, errorMessage = null) {
    await this.log({
      userId,
      action,
      ipAddress: req.ip || req.connection.remoteAddress,
      userAgent: req.get('User-Agent'),
      method: req.method,
      endpoint: req.originalUrl,
      success,
      errorMessage,
      sensitiveData: false
    });
  }

  /**
   * Log student data access
   */
  static async logStudentDataAccess(userId, action, studentId, req, success, errorMessage = null) {
    await this.log({
      userId,
      action,
      resource: 'student_data',
      resourceId: studentId,
      ipAddress: req.ip || req.connection.remoteAddress,
      userAgent: req.get('User-Agent'),
      method: req.method,
      endpoint: req.originalUrl,
      success,
      errorMessage,
      sensitiveData: true
    });
  }

  /**
   * Log assessment data access
   */
  static async logAssessmentAccess(userId, action, assessmentId, req, success, errorMessage = null) {
    await this.log({
      userId,
      action,
      resource: 'assessment_data',
      resourceId: assessmentId,
      ipAddress: req.ip || req.connection.remoteAddress,
      userAgent: req.get('User-Agent'),
      method: req.method,
      endpoint: req.originalUrl,
      success,
      errorMessage,
      sensitiveData: true
    });
  }

  /**
   * Log file operations
   */
  static async logFileOperation(userId, action, fileName, req, success, errorMessage = null) {
    await this.log({
      userId,
      action,
      resource: 'file',
      resourceId: fileName,
      ipAddress: req.ip || req.connection.remoteAddress,
      userAgent: req.get('User-Agent'),
      method: req.method,
      endpoint: req.originalUrl,
      success,
      errorMessage,
      sensitiveData: false
    });
  }

  /**
   * Log permission violations
   */
  static async logPermissionViolation(userId, attemptedAction, req, errorMessage) {
    await this.log({
      userId: userId || 'anonymous',
      action: 'PERMISSION_VIOLATION',
      ipAddress: req.ip || req.connection.remoteAddress,
      userAgent: req.get('User-Agent'),
      method: req.method,
      endpoint: req.originalUrl,
      success: false,
      errorMessage,
      sensitiveData: true,
      metadata: { attemptedAction }
    });
  }

  /**
   * Log rate limit violations
   */
  static async logRateLimitViolation(userId, req) {
    await this.log({
      userId: userId || 'anonymous',
      action: 'RATE_LIMIT_EXCEEDED',
      ipAddress: req.ip || req.connection.remoteAddress,
      userAgent: req.get('User-Agent'),
      method: req.method,
      endpoint: req.originalUrl,
      success: false,
      errorMessage: 'Rate limit exceeded',
      sensitiveData: false
    });
  }

  /**
   * Log security event for monitoring
   */
  static async logSecurityEvent(userId, eventType, details) {
    const logEntry = {
      timestamp: new Date(),
      userId: userId || 'anonymous',
      eventType: 'SECURITY_EVENT',
      securityEventType: eventType,
      details: {
        ...details,
        severity: details.severity || 'INFO'
      },
      ipAddress: details.ip || 'unknown',
      userAgent: details.userAgent || 'unknown'
    };

    console.log(`[SECURITY EVENT] ${eventType} for user ${userId}:`, details);

    try {
      // Store in audit collection
      const auditDb = mongoose.connection.useDb('audit');
      const auditCollection = auditDb.collection('security_events');
      await auditCollection.insertOne(logEntry);
    } catch (error) {
      console.error('Failed to log security event:', error);
    }

    return logEntry;
  }

  /**
   * Log security alert
   */
  static async logSecurityAlert(userId, severity, message, details) {
    const alertEntry = {
      id: `alert_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      timestamp: new Date(),
      userId: userId || 'anonymous',
      severity,
      message,
      details,
      status: 'active',
      acknowledgedAt: null,
      acknowledgedBy: null,
      notes: null
    };

    console.log(`[SECURITY ALERT - ${severity}] ${message}:`, details);

    try {
      // Store in audit collection
      const auditDb = mongoose.connection.useDb('audit');
      const alertsCollection = auditDb.collection('security_alerts');
      await alertsCollection.insertOne(alertEntry);
    } catch (error) {
      console.error('Failed to log security alert:', error);
    }

    return alertEntry;
  }

  /**
   * Get security events with filtering
   */
  static async getSecurityEvents(filters = {}) {
    try {
      const auditDb = mongoose.connection.useDb('audit');
      const securityEventsCollection = auditDb.collection('security_events');

      let query = {};

      // Apply filters
      if (filters.eventType) {
        query.securityEventType = filters.eventType;
      }
      if (filters.userId) {
        query.userId = filters.userId;
      }
      if (filters.ip) {
        query.ipAddress = filters.ip;
      }
      if (filters.severity) {
        query['details.severity'] = filters.severity;
      }
      if (filters.startDate || filters.endDate) {
        query.timestamp = {};
        if (filters.startDate) {
          query.timestamp.$gte = filters.startDate;
        }
        if (filters.endDate) {
          query.timestamp.$lte = filters.endDate;
        }
      }

      const events = await securityEventsCollection
        .find(query)
        .sort({ timestamp: -1 })
        .limit(filters.limit || 100)
        .skip(filters.offset || 0)
        .toArray();

      return events;
    } catch (error) {
      console.error('Failed to get security events:', error);
      return [];
    }
  }

  /**
   * Get active security alerts
   */
  static async getActiveSecurityAlerts() {
    try {
      const auditDb = mongoose.connection.useDb('audit');
      const alertsCollection = auditDb.collection('security_alerts');

      const alerts = await alertsCollection
        .find({ status: 'active' })
        .sort({ timestamp: -1 })
        .toArray();

      return alerts;
    } catch (error) {
      console.error('Failed to get active security alerts:', error);
      return [];
    }
  }

  /**
   * Acknowledge security alert
   */
  static async acknowledgeSecurityAlert(alertId, acknowledgedBy, notes) {
    try {
      const auditDb = mongoose.connection.useDb('audit');
      const alertsCollection = auditDb.collection('security_alerts');

      const result = await alertsCollection.updateOne(
        { id: alertId },
        {
          $set: {
            status: 'acknowledged',
            acknowledgedAt: new Date(),
            acknowledgedBy,
            notes: notes || ''
          }
        }
      );

      return result.modifiedCount > 0;
    } catch (error) {
      console.error('Failed to acknowledge security alert:', error);
      return false;
    }
  }

  /**
   * Get security statistics
   */
  static async getSecurityStatistics(days = 7) {
    try {
      const auditDb = mongoose.connection.useDb('audit');
      const securityEventsCollection = auditDb.collection('security_events');
      const alertsCollection = auditDb.collection('security_alerts');

      const startDate = new Date();
      startDate.setDate(startDate.getDate() - days);

      // Get event counts by type
      const eventStats = await securityEventsCollection.aggregate([
        { $match: { timestamp: { $gte: startDate } } },
        { $group: { _id: '$securityEventType', count: { $sum: 1 } } },
        { $sort: { count: -1 } }
      ]).toArray();

      // Get alert counts by severity
      const alertStats = await alertsCollection.aggregate([
        { $match: { timestamp: { $gte: startDate } } },
        { $group: { _id: '$severity', count: { $sum: 1 } } },
        { $sort: { count: -1 } }
      ]).toArray();

      // Get daily trends
      const dailyTrends = await securityEventsCollection.aggregate([
        { $match: { timestamp: { $gte: startDate } } },
        {
          $group: {
            _id: {
              $dateToString: { format: '%Y-%m-%d', date: '$timestamp' }
            },
            count: { $sum: 1 }
          }
        },
        { $sort: { _id: 1 } }
      ]).toArray();

      return {
        period: {
          days,
          startDate,
          endDate: new Date()
        },
        events: {
          byType: eventStats,
          total: eventStats.reduce((sum, stat) => sum + stat.count, 0)
        },
        alerts: {
          bySeverity: alertStats,
          total: alertStats.reduce((sum, stat) => sum + stat.count, 0)
        },
        trends: {
          daily: dailyTrends
        }
      };
    } catch (error) {
      console.error('Failed to get security statistics:', error);
      return {
        period: { days, startDate: new Date(), endDate: new Date() },
        events: { byType: [], total: 0 },
        alerts: { bySeverity: [], total: 0 },
        trends: { daily: [] }
      };
    }
  }
}

module.exports = AuditLogger;