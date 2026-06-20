const { body, param, query, validationResult } = require('express-validator');
const AuditLogger = require('./auditLogger');

/**
 * Handle validation errors
 */
const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);

  if (!errors.isEmpty()) {
    const errorDetails = errors.array().map(error => ({
      field: error.path || error.param,
      message: error.msg,
      value: error.value,
      location: error.location
    }));

    // Audit log validation failure
    AuditLogger.logPermissionViolation(
      req.user?.id || 'anonymous',
      'Invalid request data',
      req,
      `Validation errors: ${errorDetails.map(e => `${e.field}: ${e.message}`).join(', ')}`
    );

    return res.status(400).json({
      success: false,
      message: 'Validation failed',
      errors: errorDetails
    });
  }

  next();
};

/**
 * Validation rules for authentication endpoints
 */
const authValidation = {
  login: [
    body('email')
      .isEmail()
      .normalizeEmail()
      .withMessage('Valid email is required')
      .isLength({ max: 100 })
      .withMessage('Email must be less than 100 characters'),

    body('password')
      .isLength({ min: 1 })
      .withMessage('Password is required')
      .isLength({ max: 200 })
      .withMessage('Password must be less than 200 characters'),

    body('expectedRole')
      .optional()
      .isIn(['teacher', 'parent', 'admin', 'guro', 'magulang'])
      .withMessage('Invalid role specified'),

    handleValidationErrors
  ],

  changePassword: [
    body('currentPassword')
      .isLength({ min: 1 })
      .withMessage('Current password is required'),

    body('newPassword')
      .isLength({ min: 8 })
      .withMessage('New password must be at least 8 characters')
      .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*])[A-Za-z\d!@#$%^&*]{8,}$/)
      .withMessage('New password must contain at least one uppercase letter, one lowercase letter, one number, and one special character'),

    handleValidationErrors
  ],

  refresh: [
    body('refreshToken')
      .isLength({ min: 1 })
      .withMessage('Refresh token is required')
      .isJWT()
      .withMessage('Invalid refresh token format'),

    handleValidationErrors
  ]
};

/**
 * Validation rules for student data endpoints
 */
const studentValidation = {
  studentId: [
    param('studentId')
      .isNumeric()
      .withMessage('Student ID must be numeric')
      .isInt({ min: 1, max: 9999999999 })
      .withMessage('Student ID must be a valid integer between 1 and 9999999999'),

    handleValidationErrors
  ],

  createStudent: [
    body('idNumber')
      .exists().withMessage('ID Number is required')
      .custom((value) => {
        if (!value || value.toString().trim() === '') {
          throw new Error('ID Number cannot be empty');
        }
        const numValue = Number(value);
        if (isNaN(numValue)) {
          throw new Error('ID Number must be numeric');
        }
        if (numValue < 1 || numValue > 9999999999) {
          throw new Error('ID Number must be between 1 and 9999999999');
        }
        return true;
      }),

    body('firstName')
      .exists().withMessage('First name is required')
      .custom((value) => {
        if (!value || value.toString().trim() === '') {
          throw new Error('First name cannot be empty');
        }
        const trimmed = value.toString().trim();
        if (trimmed.length > 50) {
          throw new Error('First name must be less than 50 characters');
        }
        if (!/^[a-zA-Z\s\-'\.]+$/.test(trimmed)) {
          throw new Error('First name can only contain letters, spaces, hyphens, apostrophes, and periods');
        }
        return true;
      }),

    body('lastName')
      .exists().withMessage('Last name is required')
      .custom((value) => {
        if (!value || value.toString().trim() === '') {
          throw new Error('Last name cannot be empty');
        }
        const trimmed = value.toString().trim();
        if (trimmed.length > 50) {
          throw new Error('Last name must be less than 50 characters');
        }
        if (!/^[a-zA-Z\s\-'\.]+$/.test(trimmed)) {
          throw new Error('Last name can only contain letters, spaces, hyphens, apostrophes, and periods');
        }
        return true;
      }),

    body('age')
      .exists().withMessage('Age is required')
      .custom((value) => {
        if (!value || value.toString().trim() === '') {
          throw new Error('Age cannot be empty');
        }
        const numValue = Number(value);
        if (isNaN(numValue) || numValue < 5 || numValue > 18) {
          throw new Error('Age must be between 5 and 18');
        }
        return true;
      }),

    body('gender')
      .exists().withMessage('Gender is required')
      .custom((value) => {
        if (!value || value.toString().trim() === '') {
          throw new Error('Gender cannot be empty');
        }
        if (!['Male', 'Female', 'Other'].includes(value.toString().trim())) {
          throw new Error('Gender must be Male, Female, or Other');
        }
        return true;
      }),

    body('gradeLevel')
      .exists().withMessage('Grade level is required')
      .custom((value) => {
        if (!value || value.toString().trim() === '') {
          throw new Error('Grade level cannot be empty');
        }
        const validGrades = ['Grade 1', 'Grade 2', 'Grade 3', 'Grade 4', 'Grade 5', 'Grade 6'];
        if (!validGrades.includes(value.toString().trim())) {
          throw new Error('Grade level must be between Grade 1 and Grade 6');
        }
        return true;
      }),

    body('section')
      .exists().withMessage('Section is required')
      .custom((value) => {
        if (!value || value.toString().trim() === '') {
          throw new Error('Section cannot be empty');
        }
        const trimmed = value.toString().trim();
        if (trimmed.length > 20) {
          throw new Error('Section must be less than 20 characters');
        }
        if (!/^[a-zA-Z0-9\s\-]+$/.test(trimmed)) {
          throw new Error('Section can only contain letters, numbers, spaces, and hyphens');
        }
        return true;
      }),

    body('address')
      .exists().withMessage('Address is required')
      .custom((value) => {
        if (!value || value.toString().trim() === '') {
          throw new Error('Address cannot be empty');
        }
        const trimmed = value.toString().trim();
        if (trimmed.length > 200) {
          throw new Error('Address must be less than 200 characters');
        }
        return true;
      }),

    body('readingLevel')
      .optional()
      .custom((value) => {
        if (value) {
          const validLevels = ['Low Emerging', 'High Emerging', 'Developing', 'Transitioning', 'At Grade Level'];
          if (!validLevels.includes(value.toString().trim())) {
            throw new Error('Invalid reading level');
          }
        }
        return true;
      }),

    handleValidationErrors
  ]
};

/**
 * Validation rules for assessment endpoints
 */
const assessmentValidation = {
  category: [
    param('category')
      .isIn(['Alphabet Knowledge', 'Phonological Awareness', 'Decoding', 'Word Recognition', 'Reading Comprehension'])
      .withMessage('Invalid assessment category'),

    handleValidationErrors
  ],

  questionResponse: [
    body('questionId')
      .isLength({ min: 1 })
      .withMessage('Question ID is required')
      .matches(/^[A-Z]{2,3}_\d{3}$/)
      .withMessage('Question ID must follow format: ABC_123'),

    body('response')
      .custom((value) => {
        if (value === null || value === undefined) {
          throw new Error('Response is required');
        }
        // Allow strings, arrays, or objects for different question types
        if (typeof value !== 'string' && !Array.isArray(value) && typeof value !== 'object') {
          throw new Error('Response must be a string, array, or object');
        }
        return true;
      }),

    body('isCorrect')
      .isBoolean()
      .withMessage('isCorrect must be a boolean'),

    body('responseTime')
      .optional()
      .isFloat({ min: 0, max: 300 })
      .withMessage('Response time must be between 0 and 300 seconds'),

    handleValidationErrors
  ]
};

/**
 * Validation rules for file upload endpoints
 */
const fileValidation = {
  upload: [
    body('path')
      .optional()
      .isLength({ max: 100 })
      .withMessage('Path must be less than 100 characters')
      .matches(/^[a-zA-Z0-9\/_\-]+$/)
      .withMessage('Path can only contain letters, numbers, slashes, underscores, and hyphens'),

    handleValidationErrors
  ]
};

/**
 * Validation rules for pagination and search
 */
const paginationValidation = [
  query('page')
    .optional()
    .isInt({ min: 1, max: 1000 })
    .withMessage('Page must be between 1 and 1000'),

  query('limit')
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage('Limit must be between 1 and 100'),

  query('sort')
    .optional()
    .isIn(['name', 'date', 'score', 'level', 'created', 'updated'])
    .withMessage('Invalid sort field'),

  query('order')
    .optional()
    .isIn(['asc', 'desc'])
    .withMessage('Order must be asc or desc'),

  query('search')
    .optional()
    .isLength({ max: 100 })
    .withMessage('Search term must be less than 100 characters')
    .matches(/^[a-zA-Z0-9\s\-'\.]+$/)
    .withMessage('Search term contains invalid characters'),

  handleValidationErrors
];

/**
 * Validation for MongoDB ObjectIds
 */
const objectIdValidation = (fieldName) => [
  param(fieldName)
    .isMongoId()
    .withMessage(`${fieldName} must be a valid MongoDB ObjectId`),

  handleValidationErrors
];

/**
 * Sanitize request data to prevent injection attacks including CSS injection
 */
const sanitizeRequest = (req, res, next) => {
  // Enhanced sanitization for multiple injection types
  const sanitizeValue = (value) => {
    if (typeof value === 'string') {
      return value
        // XSS Protection
        .replace(/<script[^>]*>.*?<\/script>/gi, '')
        .replace(/<iframe[^>]*>.*?<\/iframe>/gi, '')
        .replace(/javascript:/gi, '')
        .replace(/on\w+\s*=/gi, '')

        // CSS Injection Protection
        .replace(/<style[^>]*>.*?<\/style>/gi, '') // Remove style tags
        .replace(/style\s*=\s*["'][^"']*["']/gi, '') // Remove inline styles
        .replace(/@import\s+[^;]+;/gi, '') // Remove CSS imports
        .replace(/expression\s*\(/gi, '') // Remove CSS expressions (IE)
        .replace(/behavior\s*:/gi, '') // Remove CSS behaviors (IE)
        .replace(/binding\s*:/gi, '') // Remove CSS bindings (IE)
        .replace(/-moz-binding\s*:/gi, '') // Remove Mozilla bindings
        .replace(/vbscript\s*:/gi, '') // Remove VBScript
        .replace(/livescript\s*:/gi, '') // Remove LiveScript
        .replace(/mocha\s*:/gi, '') // Remove Mocha

        // Additional CSS injection vectors
        .replace(/url\s*\(\s*["']?\s*javascript\s*:/gi, '') // Remove javascript: in CSS url()
        .replace(/url\s*\(\s*["']?\s*data\s*:/gi, '') // Remove data: URLs in CSS
        .replace(/<!--.*?-->/g, '') // Remove HTML comments
        .replace(/<!\[CDATA\[.*?\]\]>/g, '') // Remove CDATA sections

        // CSS property injection protection
        .replace(/background\s*:\s*url\s*\(/gi, 'background:removed(')
        .replace(/background-image\s*:\s*url\s*\(/gi, 'background-image:removed(')
        .replace(/list-style\s*:\s*url\s*\(/gi, 'list-style:removed(')
        .replace(/list-style-image\s*:\s*url\s*\(/gi, 'list-style-image:removed(')

        // Remove potentially dangerous CSS functions
        .replace(/calc\s*\(/gi, 'removed(')
        .replace(/attr\s*\(/gi, 'removed(')
        .replace(/counter\s*\(/gi, 'removed(')
        .replace(/counters\s*\(/gi, 'removed(');
    }
    return value;
  };

  // Recursively sanitize object properties
  const sanitizeObject = (obj) => {
    if (obj && typeof obj === 'object') {
      for (const key in obj) {
        if (Object.prototype.hasOwnProperty.call(obj, key)) {
          if (Array.isArray(obj[key])) {
            obj[key] = obj[key].map(item => sanitizeObject(item));
          } else if (typeof obj[key] === 'object' && obj[key] !== null) {
            obj[key] = sanitizeObject(obj[key]);
          } else {
            obj[key] = sanitizeValue(obj[key]);
          }
        }
      }
    }
    return obj;
  };

  // Sanitize request body
  if (req.body) {
    req.body = sanitizeObject(req.body);
  }

  // Sanitize query parameters
  if (req.query) {
    req.query = sanitizeObject(req.query);
  }

  next();
};

/**
 * Rate limiting validation for specific endpoints
 */
const validateRateLimit = (maxRequests = 100, windowMs = 15 * 60 * 1000) => {
  const requests = new Map();

  return (req, res, next) => {
    const clientId = req.ip + (req.user?.id || 'anonymous');
    const now = Date.now();
    const windowStart = now - windowMs;

    // Clean old entries
    if (!requests.has(clientId)) {
      requests.set(clientId, []);
    }

    const clientRequests = requests.get(clientId);
    const recentRequests = clientRequests.filter(time => time > windowStart);

    if (recentRequests.length >= maxRequests) {
      // Audit log rate limit violation
      AuditLogger.logRateLimitViolation(req.user?.id || 'anonymous', req);

      return res.status(429).json({
        success: false,
        message: 'Too many requests',
        retryAfter: Math.ceil(windowMs / 1000)
      });
    }

    // Add current request
    recentRequests.push(now);
    requests.set(clientId, recentRequests);

    next();
  };
};

module.exports = {
  authValidation,
  studentValidation,
  assessmentValidation,
  fileValidation,
  paginationValidation,
  objectIdValidation,
  sanitizeRequest,
  validateRateLimit,
  handleValidationErrors
};