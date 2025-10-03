const rateLimit = require('express-rate-limit');

// Rate limiter for login attempts
const loginLimiter = rateLimit({
  windowMs: 5 * 1000, // 5 seconds
  max: 10, // limit each IP to 10 requests per 5 seconds
  message: {
    error: 'Too many login attempts from this IP, please try again after 5 seconds',
    retryAfter: '5 seconds'
  },
  standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
  legacyHeaders: false, // Disable the `X-RateLimit-*` headers
  // Skip successful requests
  skipSuccessfulRequests: true,
  // Skip failed requests that are not authentication failures
  skip: (req, res) => {
    // Only count authentication failures (401/403) and bad requests (400)
    return res.statusCode < 400 || res.statusCode >= 500;
  },
  handler: (req, res) => {
    console.warn(`[SECURITY] Rate limit exceeded for IP: ${req.ip}, path: ${req.path}`);
    res.status(429).json({
      error: 'Too many login attempts from this IP, please try again after 5 seconds',
      retryAfter: '5 seconds',
      code: 'RATE_LIMIT_EXCEEDED'
    });
  }
});

// Aggressive rate limiter for repeated failed attempts from same IP
const aggressiveLoginLimiter = rateLimit({
  windowMs: 5 * 1000, // 5 seconds
  max: 10, // limit each IP to 10 requests per 5 seconds
  message: {
    error: 'Too many failed login attempts from this IP, please try again after 5 seconds',
    retryAfter: '5 seconds'
  },
  standardHeaders: true,
  legacyHeaders: false,
  skipSuccessfulRequests: true,
  handler: (req, res) => {
    console.warn(`[SECURITY] Aggressive rate limit exceeded for IP: ${req.ip}, path: ${req.path}`);
    res.status(429).json({
      error: 'Too many failed login attempts from this IP, please try again after 5 seconds',
      retryAfter: '5 seconds',
      code: 'AGGRESSIVE_RATE_LIMIT_EXCEEDED'
    });
  }
});

// Environment-aware API rate limiter
const createApiLimiter = () => {
  const isProduction = process.env.NODE_ENV === 'production';

  if (!isProduction) {
    // Development: Very lenient rate limiting
    console.log('🔧 [RATE LIMITER] Development mode: Using lenient rate limits');
    return rateLimit({
      windowMs: 15 * 60 * 1000, // 15 minutes
      max: 1000, // limit each IP to 1000 requests per windowMs (very high for development)
      message: {
        error: 'Rate limit exceeded (development mode)',
        retryAfter: '15 minutes'
      },
      standardHeaders: true,
      legacyHeaders: false,
      handler: (req, res) => {
        console.warn(`[DEV] API rate limit exceeded for IP: ${req.ip}, path: ${req.path}`);
        res.status(429).json({
          error: 'Rate limit exceeded (development mode)',
          retryAfter: '15 minutes',
          code: 'DEV_API_RATE_LIMIT_EXCEEDED'
        });
      }
    });
  } else {
    // Production: Strict rate limiting
    console.log('🔒 [RATE LIMITER] Production mode: Using strict rate limits');
    return rateLimit({
      windowMs: 15 * 60 * 1000, // 15 minutes
      max: 100, // limit each IP to 100 requests per windowMs
      message: {
        error: 'Too many requests from this IP, please try again later',
        retryAfter: '15 minutes'
      },
      standardHeaders: true,
      legacyHeaders: false,
      handler: (req, res) => {
        console.warn(`[SECURITY] API rate limit exceeded for IP: ${req.ip}, path: ${req.path}`);
        res.status(429).json({
          error: 'Too many requests from this IP, please try again later',
          retryAfter: '15 minutes',
          code: 'API_RATE_LIMIT_EXCEEDED'
        });
      }
    });
  }
};

// Create the appropriate rate limiter based on environment
const apiLimiter = createApiLimiter();

// Account-specific rate limiter (by email)
const createAccountLimiter = (maxAttempts = 3, windowMs = 60 * 60 * 1000) => {
  const attempts = new Map();

  return (req, res, next) => {
    const email = req.body.email?.toLowerCase();
    if (!email) {
      return next();
    }

    const now = Date.now();
    const windowStart = now - windowMs;

    // Clean up old entries
    for (const [key, data] of attempts.entries()) {
      if (data.firstAttempt < windowStart) {
        attempts.delete(key);
      }
    }

    const accountData = attempts.get(email);

    if (!accountData) {
      // First attempt for this email
      attempts.set(email, {
        count: 1,
        firstAttempt: now,
        lastAttempt: now
      });
      return next();
    }

    if (accountData.firstAttempt < windowStart) {
      // Window has passed, reset
      attempts.set(email, {
        count: 1,
        firstAttempt: now,
        lastAttempt: now
      });
      return next();
    }

    if (accountData.count >= maxAttempts) {
      console.warn(`[SECURITY] Account rate limit exceeded for email: ${email}`);
      return res.status(429).json({
        error: `Too many login attempts for this account, please try again in ${Math.ceil(windowMs / 60000)} minutes`,
        retryAfter: `${Math.ceil(windowMs / 60000)} minutes`,
        code: 'ACCOUNT_RATE_LIMIT_EXCEEDED'
      });
    }

    // Increment attempt count
    accountData.count++;
    accountData.lastAttempt = now;

    next();
  };
};

// Security headers middleware - OWASP ZAP compliant
const securityHeaders = (req, res, next) => {
  // Remove X-Powered-By header to prevent server version disclosure
  res.removeHeader('X-Powered-By');

  // Hide server information completely
  res.removeHeader('Server');

  // OWASP ZAP Fix 1: X-Content-Type-Options Header (prevents MIME-sniffing attacks)
  res.setHeader('X-Content-Type-Options', 'nosniff');

  // OWASP ZAP Fix 2: Anti-clickjacking Header (X-Frame-Options)
  res.setHeader('X-Frame-Options', 'DENY');

  // OWASP ZAP Fix 3: Content Security Policy (CSP) Header
  res.setHeader('Content-Security-Policy',
    "default-src 'self'; " +
    "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://literexia.com https://*.amazonaws.com; " +
    "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com https://literexia.com; " +
    "font-src 'self' https://fonts.gstatic.com data:; " +
    "img-src 'self' data: https: blob:; " +
    "connect-src 'self' https://literexia.com https://*.amazonaws.com ws: wss:; " +
    "frame-ancestors 'none'; " +
    "base-uri 'self'; " +
    "form-action 'self';"
  );

  // XSS Protection (legacy but still useful for older browsers)
  res.setHeader('X-XSS-Protection', '1; mode=block');

  // Referrer Policy (privacy protection)
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');

  // Permissions Policy (restrict browser features)
  res.setHeader('Permissions-Policy',
    'geolocation=(), microphone=(), camera=(), payment=(), usb=(), magnetometer=(), gyroscope=()'
  );

  // Add CORS headers for authentication endpoints
  if (req.path.startsWith('/api/auth/')) {
    res.setHeader('Access-Control-Allow-Credentials', 'true');
  }

  next();
};

// Login attempt logging middleware
const loginLogger = (req, res, next) => {
  const startTime = Date.now();
  const originalSend = res.send;

  res.send = function(data) {
    const duration = Date.now() - startTime;
    const email = req.body.email;
    const expectedRole = req.body.expectedRole;
    const ip = req.ip || req.connection.remoteAddress;
    const userAgent = req.get('User-Agent');

    const logData = {
      timestamp: new Date().toISOString(),
      ip: ip,
      email: email,
      expectedRole: expectedRole,
      statusCode: res.statusCode,
      duration: duration,
      userAgent: userAgent,
      success: res.statusCode === 200
    };

    if (res.statusCode === 200) {
      console.log(`[AUTH SUCCESS] ${JSON.stringify(logData)}`);
    } else {
      console.warn(`[AUTH FAILURE] ${JSON.stringify(logData)}`);
    }

    originalSend.call(this, data);
  };

  next();
};

module.exports = {
  loginLimiter,
  aggressiveLoginLimiter,
  apiLimiter,
  createAccountLimiter,
  securityHeaders,
  loginLogger
};