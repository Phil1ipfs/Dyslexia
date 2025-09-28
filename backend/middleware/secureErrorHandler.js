/**
 * Secure Error Handling Middleware
 * Prevents information disclosure through error messages
 * Provides secure logging for debugging while protecting sensitive data
 */

const AuditLogger = require('./auditLogger');

/**
 * Security-focused error handler that prevents information disclosure
 * @param {Error} err - Error object
 * @param {Request} req - Express request object
 * @param {Response} res - Express response object
 * @param {Function} next - Express next function
 */
const secureErrorHandler = (err, req, res, next) => {
  const timestamp = new Date().toISOString();
  const userId = req.user?.id || 'anonymous';
  const ip = req.ip || req.connection.remoteAddress;

  // Determine error severity and classification
  const errorClassification = classifyError(err);

  // Create secure error ID for tracking
  const errorId = generateErrorId();

  // Log comprehensive error details securely (server-side only)
  const secureLogEntry = {
    errorId,
    timestamp,
    classification: errorClassification,
    endpoint: req.path,
    method: req.method,
    userAgent: req.get('User-Agent'),
    ip,
    userId,
    referer: req.get('Referer'),
    query: sanitizeForLogging(req.query),
    params: sanitizeForLogging(req.params),
    // Only log body for certain error types (not authentication errors)
    body: errorClassification.category !== 'AUTHENTICATION' ? sanitizeForLogging(req.body) : '[REDACTED]',
    error: {
      name: err.name,
      message: err.message,
      code: err.code,
      stack: process.env.NODE_ENV === 'development' ? err.stack : '[REDACTED]',
      statusCode: err.status || err.statusCode || 500
    }
  };

  // Different logging levels based on error severity
  switch (errorClassification.severity) {
    case 'CRITICAL':
      console.error('[CRITICAL SECURITY ERROR]', JSON.stringify(secureLogEntry, null, 2));
      break;
    case 'HIGH':
      console.error('[HIGH SEVERITY ERROR]', JSON.stringify(secureLogEntry, null, 2));
      break;
    case 'MEDIUM':
      console.warn('[MEDIUM SEVERITY ERROR]', JSON.stringify(secureLogEntry, null, 2));
      break;
    default:
      console.error('[ERROR]', JSON.stringify(secureLogEntry, null, 2));
  }

  // Log security event for high-severity errors
  if (errorClassification.severity === 'CRITICAL' || errorClassification.severity === 'HIGH') {
    AuditLogger.logSecurityEvent(userId, 'application_error', {
      errorId,
      severity: errorClassification.severity,
      category: errorClassification.category,
      endpoint: req.path,
      method: req.method,
      ip,
      userAgent: req.get('User-Agent'),
      errorType: err.name,
      statusCode: err.status || 500
    });
  }

  // Create sanitized response for client
  const clientResponse = createSecureErrorResponse(err, errorClassification, errorId);

  // Set appropriate status code
  const statusCode = determineStatusCode(err, errorClassification);

  res.status(statusCode).json(clientResponse);
};

/**
 * Classifies errors by type, severity, and security implications
 * @param {Error} err - Error object
 * @returns {Object} Error classification
 */
function classifyError(err) {
  const message = err.message || '';
  const name = err.name || '';
  const code = err.code || '';

  // Security-related errors (highest priority)
  if (isSecurityError(err)) {
    return {
      category: 'SECURITY',
      severity: 'CRITICAL',
      publicMessage: 'Access denied',
      logDetails: true
    };
  }

  // Authentication/Authorization errors
  if (isAuthError(err)) {
    return {
      category: 'AUTHENTICATION',
      severity: 'HIGH',
      publicMessage: 'Authentication failed',
      logDetails: false // Don't log sensitive auth details
    };
  }

  // Validation errors (generally safe to expose basic info)
  if (isValidationError(err)) {
    return {
      category: 'VALIDATION',
      severity: 'LOW',
      publicMessage: 'Invalid request parameters',
      logDetails: true,
      allowDetailedMessage: true
    };
  }

  // Database errors
  if (isDatabaseError(err)) {
    return {
      category: 'DATABASE',
      severity: 'MEDIUM',
      publicMessage: 'Database operation failed',
      logDetails: true
    };
  }

  // Network/External service errors
  if (isNetworkError(err)) {
    return {
      category: 'NETWORK',
      severity: 'MEDIUM',
      publicMessage: 'External service unavailable',
      logDetails: true
    };
  }

  // File system errors
  if (isFileSystemError(err)) {
    return {
      category: 'FILESYSTEM',
      severity: 'MEDIUM',
      publicMessage: 'File operation failed',
      logDetails: true
    };
  }

  // Default classification
  return {
    category: 'GENERAL',
    severity: 'MEDIUM',
    publicMessage: 'An unexpected error occurred',
    logDetails: true
  };
}

/**
 * Security error detection
 */
function isSecurityError(err) {
  const securityIndicators = [
    /injection/i,
    /xss/i,
    /csrf/i,
    /unauthorized/i,
    /forbidden/i,
    /invalid.*objectid/i,
    /malicious/i,
    /attack/i,
    /suspicious/i
  ];

  const errorText = `${err.name} ${err.message} ${err.code}`.toLowerCase();
  return securityIndicators.some(pattern => pattern.test(errorText));
}

/**
 * Authentication error detection
 */
function isAuthError(err) {
  const authIndicators = [
    /authentication/i,
    /authorization/i,
    /token/i,
    /login/i,
    /password/i,
    /credential/i,
    /session/i,
    /jwt/i
  ];

  const errorText = `${err.name} ${err.message}`.toLowerCase();
  return authIndicators.some(pattern => pattern.test(errorText)) ||
         err.status === 401 || err.status === 403;
}

/**
 * Validation error detection
 */
function isValidationError(err) {
  const validationIndicators = [
    /validation/i,
    /invalid.*format/i,
    /required/i,
    /missing.*parameter/i,
    /bad.*request/i,
    /schema/i
  ];

  const errorText = `${err.name} ${err.message}`.toLowerCase();
  return validationIndicators.some(pattern => pattern.test(errorText)) ||
         err.status === 400 ||
         err.name === 'ValidationError' ||
         err.name === 'CastError';
}

/**
 * Database error detection
 */
function isDatabaseError(err) {
  return err.name === 'MongoError' ||
         err.name === 'MongooseError' ||
         err.name === 'MongoNetworkError' ||
         err.name === 'MongoServerError' ||
         /mongodb/i.test(err.message) ||
         /mongoose/i.test(err.message);
}

/**
 * Network error detection
 */
function isNetworkError(err) {
  return err.code === 'ECONNREFUSED' ||
         err.code === 'ENOTFOUND' ||
         err.code === 'ETIMEDOUT' ||
         err.code === 'ECONNRESET' ||
         /network/i.test(err.message) ||
         /connection/i.test(err.message);
}

/**
 * File system error detection
 */
function isFileSystemError(err) {
  return err.code === 'ENOENT' ||
         err.code === 'EACCES' ||
         err.code === 'EISDIR' ||
         err.code === 'EMFILE' ||
         /file/i.test(err.message) ||
         /directory/i.test(err.message);
}

/**
 * Creates secure error response for client
 */
function createSecureErrorResponse(err, classification, errorId) {
  const baseResponse = {
    success: false,
    error: {
      code: classification.category,
      message: classification.publicMessage,
      timestamp: new Date().toISOString(),
      errorId: errorId
    }
  };

  // Include more details for validation errors in development
  if (classification.allowDetailedMessage && process.env.NODE_ENV === 'development') {
    baseResponse.error.details = err.message;
  }

  // Include helpful hints for certain error types
  if (classification.category === 'VALIDATION') {
    baseResponse.error.hint = 'Please check your request parameters and try again';
  } else if (classification.category === 'AUTHENTICATION') {
    baseResponse.error.hint = 'Please check your credentials and try again';
  }

  return baseResponse;
}

/**
 * Determines appropriate HTTP status code
 */
function determineStatusCode(err, classification) {
  // Use existing status code if available and reasonable
  if (err.status >= 400 && err.status < 600) {
    return err.status;
  }

  if (err.statusCode >= 400 && err.statusCode < 600) {
    return err.statusCode;
  }

  // Determine status code based on classification
  switch (classification.category) {
    case 'SECURITY':
      return 403; // Forbidden
    case 'AUTHENTICATION':
      return 401; // Unauthorized
    case 'VALIDATION':
      return 400; // Bad Request
    case 'DATABASE':
      return 503; // Service Unavailable
    case 'NETWORK':
      return 502; // Bad Gateway
    case 'FILESYSTEM':
      return 500; // Internal Server Error
    default:
      return 500; // Internal Server Error
  }
}

/**
 * Sanitizes data for logging (removes sensitive information)
 */
function sanitizeForLogging(data) {
  if (!data || typeof data !== 'object') {
    return data;
  }

  const sanitized = {};
  const sensitiveFields = [
    'password', 'token', 'auth', 'secret', 'key', 'hash',
    'credential', 'authorization', 'cookie', 'session'
  ];

  for (const [key, value] of Object.entries(data)) {
    const lowerKey = key.toLowerCase();

    if (sensitiveFields.some(field => lowerKey.includes(field))) {
      sanitized[key] = '[REDACTED]';
    } else if (typeof value === 'object') {
      sanitized[key] = sanitizeForLogging(value);
    } else {
      sanitized[key] = value;
    }
  }

  return sanitized;
}

/**
 * Generates unique error ID for tracking
 */
function generateErrorId() {
  const timestamp = Date.now();
  const random = Math.random().toString(36).substring(2, 8);
  return `ERR_${timestamp}_${random}`.toUpperCase();
}

/**
 * Express middleware wrapper
 */
const middleware = (err, req, res, next) => {
  secureErrorHandler(err, req, res, next);
};

module.exports = {
  secureErrorHandler: middleware,
  classifyError,
  sanitizeForLogging,
  generateErrorId
};