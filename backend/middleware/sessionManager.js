const jwt = require('jsonwebtoken');
const AuditLogger = require('./auditLogger');

class SessionManager {
  constructor() {
    this.sessionTimeout = 60 * 60 * 1000; // 1 hour in milliseconds
    this.refreshThreshold = 15 * 60 * 1000; // 15 minutes before expiry
    this.activeSessions = new Map(); // In-memory session tracking
  }

  /**
   * Check if token is close to expiration and needs refresh
   * @param {Object} decodedToken - Decoded JWT token
   * @returns {boolean} - True if token needs refresh
   */
  needsRefresh(decodedToken) {
    if (!decodedToken.exp) return false;

    const now = Math.floor(Date.now() / 1000);
    const timeUntilExpiry = (decodedToken.exp - now) * 1000;

    return timeUntilExpiry <= this.refreshThreshold;
  }

  /**
   * Check if token is expired
   * @param {Object} decodedToken - Decoded JWT token
   * @returns {boolean} - True if token is expired
   */
  isExpired(decodedToken) {
    if (!decodedToken.exp) return false;

    const now = Math.floor(Date.now() / 1000);
    return decodedToken.exp <= now;
  }

  /**
   * Generate a new access token
   * @param {Object} user - User data
   * @returns {string} - New JWT token
   */
  generateAccessToken(user) {
    const secretKey = process.env.JWT_SECRET;

    if (!secretKey) {
      throw new Error('JWT_SECRET environment variable is required');
    }

    return jwt.sign(
      {
        id: user.id,
        email: user.email,
        roles: user.roles
      },
      secretKey,
      {
        expiresIn: '1h',
        issuer: 'literexia-api',
        subject: user.id
      }
    );
  }

  /**
   * Generate a refresh token (longer lived)
   * @param {Object} user - User data
   * @returns {string} - New refresh token
   */
  generateRefreshToken(user) {
    const secretKey = process.env.JWT_SECRET;

    if (!secretKey) {
      throw new Error('JWT_SECRET environment variable is required');
    }

    return jwt.sign(
      {
        id: user.id,
        type: 'refresh'
      },
      secretKey,
      {
        expiresIn: '7d', // 7 days
        issuer: 'literexia-api',
        subject: user.id
      }
    );
  }

  /**
   * Track active session
   * @param {string} userId - User ID
   * @param {string} sessionId - Session identifier
   * @param {Object} sessionData - Session metadata
   */
  trackSession(userId, sessionId, sessionData) {
    if (!this.activeSessions.has(userId)) {
      this.activeSessions.set(userId, new Map());
    }

    this.activeSessions.get(userId).set(sessionId, {
      ...sessionData,
      lastActivity: Date.now(),
      createdAt: Date.now()
    });

    // Clean up old sessions for this user (keep only last 3)
    const userSessions = this.activeSessions.get(userId);
    if (userSessions.size > 3) {
      const oldestSession = Array.from(userSessions.entries())
        .sort((a, b) => a[1].lastActivity - b[1].lastActivity)[0];
      userSessions.delete(oldestSession[0]);
    }
  }

  /**
   * Update session activity
   * @param {string} userId - User ID
   * @param {string} sessionId - Session identifier
   */
  updateActivity(userId, sessionId) {
    const userSessions = this.activeSessions.get(userId);
    if (userSessions && userSessions.has(sessionId)) {
      userSessions.get(sessionId).lastActivity = Date.now();
    }
  }

  /**
   * Remove session
   * @param {string} userId - User ID
   * @param {string} sessionId - Session identifier
   */
  removeSession(userId, sessionId) {
    const userSessions = this.activeSessions.get(userId);
    if (userSessions) {
      userSessions.delete(sessionId);
      if (userSessions.size === 0) {
        this.activeSessions.delete(userId);
      }
    }
  }

  /**
   * Check if session is active
   * @param {string} userId - User ID
   * @param {string} sessionId - Session identifier
   * @returns {boolean} - True if session is active
   */
  isSessionActive(userId, sessionId) {
    const userSessions = this.activeSessions.get(userId);
    if (!userSessions) return false;

    const session = userSessions.get(sessionId);
    if (!session) return false;

    // Check if session has timed out
    const timeSinceActivity = Date.now() - session.lastActivity;
    if (timeSinceActivity > this.sessionTimeout) {
      this.removeSession(userId, sessionId);
      return false;
    }

    return true;
  }

  /**
   * Get session info
   * @param {string} userId - User ID
   * @param {string} sessionId - Session identifier
   * @returns {Object|null} - Session data or null
   */
  getSession(userId, sessionId) {
    const userSessions = this.activeSessions.get(userId);
    if (!userSessions) return null;

    return userSessions.get(sessionId) || null;
  }

  /**
   * Clean up expired sessions
   */
  cleanupExpiredSessions() {
    const now = Date.now();

    for (const [userId, userSessions] of this.activeSessions.entries()) {
      for (const [sessionId, session] of userSessions.entries()) {
        if (now - session.lastActivity > this.sessionTimeout) {
          userSessions.delete(sessionId);
        }
      }

      if (userSessions.size === 0) {
        this.activeSessions.delete(userId);
      }
    }
  }
}

// Create singleton instance
const sessionManager = new SessionManager();

// Clean up expired sessions every 15 minutes
setInterval(() => {
  sessionManager.cleanupExpiredSessions();
}, 15 * 60 * 1000);

/**
 * Middleware to check session validity and handle token refresh
 */
const sessionMiddleware = (req, res, next) => {
  // Skip session management for non-authenticated routes
  if (!req.user) {
    return next();
  }

  try {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) {
      return next();
    }

    // Decode token without verification to check expiration
    const decodedToken = jwt.decode(token);
    if (!decodedToken) {
      return next();
    }

    const userId = req.user.id;
    const sessionId = decodedToken.jti || 'default'; // Use jti claim or default

    // Check if session is active
    if (!sessionManager.isSessionActive(userId, sessionId)) {
      console.log(`Session timeout for user: ${userId}`);

      // Audit log session timeout
      AuditLogger.logAuth(userId, 'SESSION_TIMEOUT', req, false, 'Session expired due to inactivity');

      return res.status(401).json({
        error: 'Session expired due to inactivity',
        code: 'SESSION_TIMEOUT',
        requiresLogin: true
      });
    }

    // Update session activity
    sessionManager.updateActivity(userId, sessionId);

    // Check if token needs refresh
    if (sessionManager.needsRefresh(decodedToken)) {
      res.set('X-Token-Refresh-Required', 'true');
      console.log(`Token refresh required for user: ${userId}`);
    }

    // Check if token is expired
    if (sessionManager.isExpired(decodedToken)) {
      console.log(`Token expired for user: ${userId}`);

      // Audit log token expiration
      AuditLogger.logAuth(userId, 'TOKEN_EXPIRED', req, false, 'JWT token expired');

      return res.status(401).json({
        error: 'Token expired',
        code: 'TOKEN_EXPIRED',
        requiresRefresh: true
      });
    }

    // Add session info to request
    req.session = {
      id: sessionId,
      userId: userId,
      lastActivity: sessionManager.getSession(userId, sessionId)?.lastActivity
    };

    next();
  } catch (error) {
    console.error('Session middleware error:', error);
    next(); // Continue without session management on error
  }
};

/**
 * Route handler for token refresh
 */
const refreshTokenHandler = async (req, res) => {
  try {
    const { refreshToken } = req.body;

    if (!refreshToken) {
      return res.status(400).json({
        success: false,
        message: 'Refresh token is required'
      });
    }

    const secretKey = process.env.JWT_SECRET;
    if (!secretKey) {
      return res.status(500).json({
        success: false,
        message: 'Server configuration error'
      });
    }

    // Verify refresh token
    const decoded = jwt.verify(refreshToken, secretKey);

    if (decoded.type !== 'refresh') {
      return res.status(400).json({
        success: false,
        message: 'Invalid refresh token'
      });
    }

    // Generate new access token
    const newAccessToken = sessionManager.generateAccessToken({
      id: decoded.id,
      email: decoded.email,
      roles: decoded.roles
    });

    // Update session tracking
    const sessionId = decoded.jti || 'default';
    sessionManager.trackSession(decoded.id, sessionId, {
      ip: req.ip,
      userAgent: req.get('User-Agent')
    });

    // Audit log token refresh
    await AuditLogger.logAuth(decoded.id, 'TOKEN_REFRESH', req, true);

    res.json({
      success: true,
      accessToken: newAccessToken,
      expiresIn: '1h'
    });

  } catch (error) {
    console.error('Token refresh error:', error);

    // Audit log failed token refresh
    await AuditLogger.logAuth('unknown', 'TOKEN_REFRESH', req, false, error.message);

    res.status(401).json({
      success: false,
      message: 'Invalid or expired refresh token',
      requiresLogin: true
    });
  }
};

module.exports = {
  SessionManager,
  sessionManager,
  sessionMiddleware,
  refreshTokenHandler
};