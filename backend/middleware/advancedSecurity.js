const crypto = require('crypto');
const bcrypt = require('bcrypt');

// OWASP: Account Lockout Policy
class AccountLockoutService {
  constructor() {
    this.lockouts = new Map(); // In production, use Redis or database
    this.maxAttempts = 5;
    this.lockoutDuration = 30 * 60 * 1000; // 30 minutes
    this.escalationThreshold = 3; // After 3 lockouts, increase duration
  }

  isAccountLocked(email) {
    const lockoutData = this.lockouts.get(email.toLowerCase());
    if (!lockoutData) return false;

    if (Date.now() > lockoutData.unlockTime) {
      this.lockouts.delete(email.toLowerCase());
      return false;
    }
    return true;
  }

  recordFailedAttempt(email, ip) {
    const key = email.toLowerCase();
    const now = Date.now();
    const lockoutData = this.lockouts.get(key) || {
      attempts: 0,
      lockoutCount: 0,
      unlockTime: 0,
      ips: new Set()
    };

    lockoutData.attempts++;
    lockoutData.ips.add(ip);

    if (lockoutData.attempts >= this.maxAttempts) {
      lockoutData.lockoutCount++;
      // Exponential backoff for repeat offenders
      const multiplier = Math.pow(2, Math.min(lockoutData.lockoutCount - 1, 4));
      const lockoutDuration = this.lockoutDuration * multiplier;

      lockoutData.unlockTime = now + lockoutDuration;
      lockoutData.attempts = 0; // Reset attempts after lockout

      console.warn(`[SECURITY] Account locked: ${email}, IP: ${ip}, Lockout #${lockoutData.lockoutCount}, Duration: ${lockoutDuration / 60000} minutes`);
    }

    this.lockouts.set(key, lockoutData);
    return lockoutData.unlockTime > now;
  }

  clearFailedAttempts(email) {
    const key = email.toLowerCase();
    const lockoutData = this.lockouts.get(key);
    if (lockoutData) {
      lockoutData.attempts = 0;
      this.lockouts.set(key, lockoutData);
    }
  }

  getLockoutInfo(email) {
    const lockoutData = this.lockouts.get(email.toLowerCase());
    if (!lockoutData || lockoutData.unlockTime <= Date.now()) {
      return null;
    }
    return {
      unlockTime: lockoutData.unlockTime,
      lockoutCount: lockoutData.lockoutCount,
      remainingTime: Math.ceil((lockoutData.unlockTime - Date.now()) / 60000)
    };
  }
}

// OWASP: Password Strength Validation
const validatePasswordStrength = (password) => {
  const minLength = 8;
  const maxLength = 128;

  if (!password || password.length < minLength) {
    return {
      valid: false,
      errors: [`Password must be at least ${minLength} characters long`]
    };
  }

  if (password.length > maxLength) {
    return {
      valid: false,
      errors: [`Password must not exceed ${maxLength} characters`]
    };
  }

  const patterns = {
    uppercase: /[A-Z]/,
    lowercase: /[a-z]/,
    number: /[0-9]/,
    special: /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/
  };

  const errors = [];
  if (!patterns.uppercase.test(password)) errors.push('At least one uppercase letter');
  if (!patterns.lowercase.test(password)) errors.push('At least one lowercase letter');
  if (!patterns.number.test(password)) errors.push('At least one number');
  if (!patterns.special.test(password)) errors.push('At least one special character');

  // Common password patterns to reject
  const commonPatterns = [
    /(.)\1{2,}/, // Three or more repeated characters
    /123456|654321|qwerty|password|admin|user/i, // Common sequences
    /^[a-zA-Z]+$/, // Only letters
    /^[0-9]+$/ // Only numbers
  ];

  for (const pattern of commonPatterns) {
    if (pattern.test(password)) {
      errors.push('Password contains common patterns that are easily guessed');
      break;
    }
  }

  return {
    valid: errors.length === 0,
    errors: errors
  };
};

// OWASP: Session Security
const generateSecureToken = () => {
  return crypto.randomBytes(32).toString('hex');
};

// OWASP: Input Validation and Sanitization
const sanitizeInput = (input, type = 'general') => {
  if (!input || typeof input !== 'string') return '';

  // Remove null bytes
  input = input.replace(/\0/g, '');

  switch (type) {
    case 'email':
      // Allow only valid email characters
      return input.replace(/[^a-zA-Z0-9@._-]/g, '').toLowerCase().trim();
    case 'role':
      // Allow only alphanumeric for roles
      return input.replace(/[^a-zA-Z]/g, '').toLowerCase().trim();
    case 'general':
    default:
      // Remove potential XSS vectors
      return input
        .replace(/<script[^>]*>.*?<\/script>/gi, '')
        .replace(/<[^>]*>/g, '')
        .replace(/javascript:/gi, '')
        .replace(/on\w+=/gi, '')
        .trim();
  }
};

// OWASP: Request Timing Attack Prevention
const constantTimeStringCompare = (a, b) => {
  if (a.length !== b.length) {
    // Still perform comparison to prevent timing attacks
    crypto.timingSafeEqual(Buffer.from(a), Buffer.from(a));
    return false;
  }
  return crypto.timingSafeEqual(Buffer.from(a), Buffer.from(b));
};

// OWASP: Security Headers Middleware
const advancedSecurityHeaders = (req, res, next) => {
  // Content Security Policy
  res.setHeader('Content-Security-Policy',
    "default-src 'self'; " +
    "script-src 'self' 'unsafe-inline' 'unsafe-eval'; " +
    "style-src 'self' 'unsafe-inline'; " +
    "img-src 'self' data: https:; " +
    "font-src 'self' data:; " +
    "connect-src 'self';"
  );

  // HTTP Strict Transport Security
  res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains; preload');

  // Prevent MIME type sniffing
  res.setHeader('X-Content-Type-Options', 'nosniff');

  // Prevent clickjacking
  res.setHeader('X-Frame-Options', 'DENY');

  // XSS Protection
  res.setHeader('X-XSS-Protection', '1; mode=block');

  // Referrer Policy
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');

  // Permissions Policy (formerly Feature Policy)
  res.setHeader('Permissions-Policy',
    'geolocation=(), microphone=(), camera=(), payment=(), usb=(), magnetometer=(), gyroscope=()'
  );

  // Cache Control for sensitive pages
  if (req.path.includes('/auth/') || req.path.includes('/admin/')) {
    res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
    res.setHeader('Pragma', 'no-cache');
    res.setHeader('Expires', '0');
  }

  next();
};

// OWASP: IP-based Suspicious Activity Detection
class SuspiciousActivityDetector {
  constructor() {
    this.ipActivity = new Map();
    this.suspiciousThreshold = {
      requestsPerMinute: 60,
      failedLoginsPerHour: 10,
      differentUsersPerIP: 5
    };
  }

  recordActivity(ip, activity) {
    const now = Date.now();
    const ipData = this.ipActivity.get(ip) || {
      requests: [],
      failedLogins: [],
      users: new Set(),
      lastActivity: now,
      suspiciousScore: 0
    };

    // Clean old data (older than 1 hour)
    const oneHourAgo = now - (60 * 60 * 1000);
    ipData.requests = ipData.requests.filter(time => time > oneHourAgo);
    ipData.failedLogins = ipData.failedLogins.filter(time => time > oneHourAgo);

    // Record new activity
    ipData.requests.push(now);
    ipData.lastActivity = now;

    if (activity.type === 'failed_login') {
      ipData.failedLogins.push(now);
      ipData.users.add(activity.email);
    }

    // Calculate suspicion score
    ipData.suspiciousScore = this.calculateSuspicionScore(ipData);

    this.ipActivity.set(ip, ipData);

    return {
      isSuspicious: ipData.suspiciousScore > 70,
      score: ipData.suspiciousScore,
      reasons: this.getSuspiciousReasons(ipData)
    };
  }

  calculateSuspicionScore(ipData) {
    let score = 0;
    const now = Date.now();
    const oneMinuteAgo = now - (60 * 1000);
    const oneHourAgo = now - (60 * 60 * 1000);

    // High request rate
    const recentRequests = ipData.requests.filter(time => time > oneMinuteAgo).length;
    if (recentRequests > this.suspiciousThreshold.requestsPerMinute) {
      score += 30;
    }

    // Multiple failed logins
    const recentFailures = ipData.failedLogins.filter(time => time > oneHourAgo).length;
    if (recentFailures > this.suspiciousThreshold.failedLoginsPerHour) {
      score += 40;
    }

    // Multiple different users from same IP
    if (ipData.users.size > this.suspiciousThreshold.differentUsersPerIP) {
      score += 20;
    }

    // Rapid successive requests
    if (ipData.requests.length > 1) {
      const intervals = [];
      for (let i = 1; i < ipData.requests.length; i++) {
        intervals.push(ipData.requests[i] - ipData.requests[i-1]);
      }
      const avgInterval = intervals.reduce((a, b) => a + b, 0) / intervals.length;
      if (avgInterval < 100) { // Less than 100ms between requests
        score += 25;
      }
    }

    return Math.min(score, 100);
  }

  getSuspiciousReasons(ipData) {
    const reasons = [];
    const now = Date.now();
    const oneMinuteAgo = now - (60 * 1000);
    const oneHourAgo = now - (60 * 60 * 1000);

    const recentRequests = ipData.requests.filter(time => time > oneMinuteAgo).length;
    if (recentRequests > this.suspiciousThreshold.requestsPerMinute) {
      reasons.push(`High request rate: ${recentRequests} requests per minute`);
    }

    const recentFailures = ipData.failedLogins.filter(time => time > oneHourAgo).length;
    if (recentFailures > this.suspiciousThreshold.failedLoginsPerHour) {
      reasons.push(`Multiple failed logins: ${recentFailures} in the last hour`);
    }

    if (ipData.users.size > this.suspiciousThreshold.differentUsersPerIP) {
      reasons.push(`Multiple user accounts attempted: ${ipData.users.size}`);
    }

    return reasons;
  }

  isSuspiciousIP(ip) {
    const ipData = this.ipActivity.get(ip);
    return ipData && ipData.suspiciousScore > 70;
  }
}

// OWASP: Password Timing Attack Prevention
const securePasswordCompare = async (plaintext, hash) => {
  try {
    // Add artificial delay to prevent timing attacks
    const startTime = process.hrtime.bigint();
    const result = await bcrypt.compare(plaintext, hash);
    const endTime = process.hrtime.bigint();

    // Ensure minimum comparison time (prevents timing attacks)
    const minTime = 100; // milliseconds
    const actualTime = Number(endTime - startTime) / 1000000; // Convert to milliseconds

    if (actualTime < minTime) {
      await new Promise(resolve => setTimeout(resolve, minTime - actualTime));
    }

    return result;
  } catch (error) {
    // Even on error, maintain consistent timing
    await new Promise(resolve => setTimeout(resolve, 100));
    return false;
  }
};

// Initialize services
const accountLockout = new AccountLockoutService();
const suspiciousActivityDetector = new SuspiciousActivityDetector();

module.exports = {
  AccountLockoutService,
  accountLockout,
  validatePasswordStrength,
  generateSecureToken,
  sanitizeInput,
  constantTimeStringCompare,
  advancedSecurityHeaders,
  SuspiciousActivityDetector,
  suspiciousActivityDetector,
  securePasswordCompare
};