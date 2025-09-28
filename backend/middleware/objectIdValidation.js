/**
 * ObjectId Validation Middleware
 * Prevents ObjectId injection attacks and application crashes
 */

const mongoose = require('mongoose');
const AuditLogger = require('./auditLogger');

/**
 * Validates ObjectId parameters to prevent injection attacks
 * @param {string|string[]} paramNames - Parameter name(s) to validate
 * @param {object} options - Validation options
 * @returns {Function} Express middleware function
 */
const validateObjectId = (paramNames, options = {}) => {
  const {
    required = true,
    allowArray = false,
    logAttempts = true
  } = options;

  // Normalize paramNames to array
  const params = Array.isArray(paramNames) ? paramNames : [paramNames];

  return (req, res, next) => {
    const validationErrors = [];
    const suspiciousAttempts = [];

    for (const paramName of params) {
      const value = req.params[paramName] || req.query[paramName] || req.body[paramName];

      // Check if parameter is required
      if (!value) {
        if (required) {
          validationErrors.push(`${paramName} parameter is required`);
        }
        continue;
      }

      // Handle array values if allowed
      if (Array.isArray(value)) {
        if (!allowArray) {
          validationErrors.push(`${paramName} cannot be an array`);
          suspiciousAttempts.push({
            param: paramName,
            value: JSON.stringify(value),
            reason: 'array_not_allowed'
          });
          continue;
        }

        // Validate each ObjectId in array
        for (let i = 0; i < value.length; i++) {
          if (!mongoose.Types.ObjectId.isValid(value[i])) {
            validationErrors.push(`Invalid ObjectId at ${paramName}[${i}]`);
            suspiciousAttempts.push({
              param: `${paramName}[${i}]`,
              value: value[i],
              reason: 'invalid_objectid_in_array'
            });
          }
        }
      } else {
        // Validate single ObjectId
        if (!mongoose.Types.ObjectId.isValid(value)) {
          validationErrors.push(`Invalid ${paramName} format`);
          suspiciousAttempts.push({
            param: paramName,
            value: value,
            reason: 'invalid_objectid'
          });
        }
      }

      // Check for potential injection patterns
      if (typeof value === 'string') {
        const injectionPatterns = [
          /\{\s*["\$]/,  // JSON object patterns: {"$ne": null}
          /\$\w+/,       // MongoDB operators: $ne, $gt, etc.
          /\.\./,        // Path traversal attempts
          /[<>]/         // HTML/XML injection attempts
        ];

        for (const pattern of injectionPatterns) {
          if (pattern.test(value)) {
            suspiciousAttempts.push({
              param: paramName,
              value: value,
              reason: 'injection_pattern_detected',
              pattern: pattern.toString()
            });
          }
        }
      }
    }

    // Log suspicious attempts
    if (logAttempts && suspiciousAttempts.length > 0) {
      const userId = req.user?.id || 'anonymous';
      const ip = req.ip || req.connection.remoteAddress;

      console.warn(`[OBJECTID INJECTION ATTEMPT] User: ${userId}, IP: ${ip}`);
      console.warn('Suspicious attempts:', suspiciousAttempts);

      // Log security event
      AuditLogger.logSecurityEvent(userId, 'objectid_injection_attempt', {
        ip,
        userAgent: req.get('User-Agent'),
        path: req.path,
        method: req.method,
        suspiciousAttempts,
        blocked: validationErrors.length > 0
      });
    }

    // Return validation errors if any
    if (validationErrors.length > 0) {
      return res.status(400).json({
        success: false,
        message: 'Invalid request parameters',
        code: 'INVALID_OBJECTID',
        errors: validationErrors,
        timestamp: new Date().toISOString()
      });
    }

    next();
  };
};

/**
 * Validates specific route parameters
 */
const validateParams = {
  id: validateObjectId('id'),
  studentId: validateObjectId('studentId'),
  teacherId: validateObjectId('teacherId'),
  parentId: validateObjectId('parentId'),
  interventionId: validateObjectId('interventionId'),
  analysisId: validateObjectId('analysisId'),
  categoryResultId: validateObjectId('categoryResultId'),
  roleId: validateObjectId('roleId'),

  // Multiple parameters
  studentAndTeacher: validateObjectId(['studentId', 'teacherId']),

  // Optional parameters
  optionalId: validateObjectId('id', { required: false }),

  // Array parameters
  studentIds: validateObjectId('studentIds', { allowArray: true }),
};

/**
 * Validates ObjectId in request body
 * @param {string[]} fields - Field names to validate
 * @returns {Function} Express middleware function
 */
const validateObjectIdInBody = (fields) => {
  return (req, res, next) => {
    const validationErrors = [];

    for (const field of fields) {
      const value = req.body[field];

      if (value && !mongoose.Types.ObjectId.isValid(value)) {
        validationErrors.push(`Invalid ${field} format in request body`);
      }
    }

    if (validationErrors.length > 0) {
      return res.status(400).json({
        success: false,
        message: 'Invalid request body',
        code: 'INVALID_OBJECTID_BODY',
        errors: validationErrors
      });
    }

    next();
  };
};

/**
 * Safe ObjectId conversion with error handling
 * @param {string} id - String to convert to ObjectId
 * @param {string} fieldName - Field name for error reporting
 * @returns {mongoose.Types.ObjectId|null} Valid ObjectId or null
 */
const safeObjectId = (id, fieldName = 'id') => {
  if (!id) return null;

  if (!mongoose.Types.ObjectId.isValid(id)) {
    throw new Error(`Invalid ${fieldName} format: ${id}`);
  }

  return new mongoose.Types.ObjectId(id);
};

/**
 * Middleware to add safe ObjectId helper to request object
 */
const addObjectIdHelper = (req, res, next) => {
  req.safeObjectId = safeObjectId;
  next();
};

module.exports = {
  validateObjectId,
  validateParams,
  validateObjectIdInBody,
  safeObjectId,
  addObjectIdHelper
};