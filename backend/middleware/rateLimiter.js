const rateLimit = require('express-rate-limit');
const AuditLogger = require('./auditLogger');

// General API rate limiter
const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: {
    error: 'Too many requests from this IP, please try again later.',
    retryAfter: '15 minutes'
  },
  standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
  legacyHeaders: false, // Disable the `X-RateLimit-*` headers
  handler: (req, res) => {
    console.log(`Rate limit exceeded for IP: ${req.ip}`);

    // Audit log rate limit violation
    AuditLogger.logRateLimitViolation(req.user?.id, req);

    res.status(429).json({
      error: 'Too many requests from this IP, please try again later.',
      retryAfter: '15 minutes'
    });
  }
});

// Strict rate limiter for authentication endpoints
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // limit each IP to 5 login attempts per windowMs
  message: {
    error: 'Too many login attempts from this IP, please try again later.',
    retryAfter: '15 minutes'
  },
  standardHeaders: true,
  legacyHeaders: false,
  skipSuccessfulRequests: true, // Don't count successful requests
  handler: (req, res) => {
    console.log(`Auth rate limit exceeded for IP: ${req.ip}`);

    // Audit log auth rate limit violation
    AuditLogger.logRateLimitViolation(req.user?.id || 'anonymous', req);

    res.status(429).json({
      error: 'Too many login attempts from this IP, please try again later.',
      retryAfter: '15 minutes'
    });
  }
});

// Moderate rate limiter for file upload endpoints
const uploadLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 10, // limit each IP to 10 uploads per hour
  message: {
    error: 'Too many upload requests from this IP, please try again later.',
    retryAfter: '1 hour'
  },
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res) => {
    console.log(`Upload rate limit exceeded for IP: ${req.ip}`);
    res.status(429).json({
      error: 'Too many upload requests from this IP, please try again later.',
      retryAfter: '1 hour'
    });
  }
});

// Strict rate limiter for password change endpoints
const passwordChangeLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 3, // limit each IP to 3 password changes per hour
  message: {
    error: 'Too many password change attempts from this IP, please try again later.',
    retryAfter: '1 hour'
  },
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res) => {
    console.log(`Password change rate limit exceeded for IP: ${req.ip}`);
    res.status(429).json({
      error: 'Too many password change attempts from this IP, please try again later.',
      retryAfter: '1 hour'
    });
  }
});

module.exports = {
  generalLimiter,
  authLimiter,
  uploadLimiter,
  passwordChangeLimiter
};