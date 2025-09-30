const AuditLogger = require('./auditLogger');

/**
 * CSS Injection Protection Middleware
 * Detects and prevents various CSS injection attack vectors
 */
class CSSInjectionProtection {
  constructor() {
    // CSS injection patterns to detect
    this.dangerousPatterns = [
      // CSS expression patterns (IE specific)
      /expression\s*\(/gi,
      /behavior\s*:\s*url\s*\(/gi,
      /binding\s*:\s*url\s*\(/gi,
      /-moz-binding\s*:\s*url\s*\(/gi,

      // JavaScript execution in CSS
      /javascript\s*:/gi,
      /vbscript\s*:/gi,
      /livescript\s*:/gi,
      /mocha\s*:/gi,

      // CSS import attacks
      /@import\s+[^;]*url\s*\(\s*["']?\s*javascript\s*:/gi,
      /@import\s+[^;]*url\s*\(\s*["']?\s*data\s*:/gi,

      // CSS url() with dangerous protocols
      /url\s*\(\s*["']?\s*javascript\s*:/gi,
      /url\s*\(\s*["']?\s*vbscript\s*:/gi,
      /url\s*\(\s*["']?\s*data\s*:.*base64/gi,

      // CSS unicode escapes that could hide attacks
      /\\[0-9a-f]{1,6}\s*/gi,

      // CSS comments that might hide attacks
      /\/\*.*?\*\//g,

      // Style tag injection
      /<style[^>]*>/gi,
      /<\/style>/gi,

      // Inline style attributes
      /style\s*=\s*["'][^"']*expression\s*\(/gi,
      /style\s*=\s*["'][^"']*javascript\s*:/gi,
      /style\s*=\s*["'][^"']*behavior\s*:/gi,

      // CSS content property attacks
      /content\s*:\s*["'][^"']*<script/gi,
      /content\s*:\s*["'][^"']*javascript\s*:/gi,

      // CSS counter attacks
      /counter-reset\s*:\s*["'][^"']*<script/gi,
      /counter-increment\s*:\s*["'][^"']*<script/gi,

      // CSS animation/transition attacks
      /animation\s*:\s*["'][^"']*javascript\s*:/gi,
      /transition\s*:\s*["'][^"']*javascript\s*:/gi,

      // CSS font-face attacks
      /@font-face[^}]*src\s*:\s*url\s*\(\s*["']?\s*javascript\s*:/gi,
      /@font-face[^}]*src\s*:\s*url\s*\(\s*["']?\s*data\s*:/gi,

      // CSS keyframes attacks
      /@keyframes[^}]*\{[^}]*javascript\s*:/gi,
      /@-webkit-keyframes[^}]*\{[^}]*javascript\s*:/gi,

      // CSS filter attacks
      /filter\s*:\s*progid\s*:/gi,
      /-ms-filter\s*:\s*progid\s*:/gi,

      // CSS transform attacks
      /transform\s*:\s*["'][^"']*javascript\s*:/gi,
      /-webkit-transform\s*:\s*["'][^"']*javascript\s*:/gi,

      // CSS background attacks beyond basic url()
      /background\s*:\s*["'][^"']*expression\s*\(/gi,
      /background-image\s*:\s*["'][^"']*expression\s*\(/gi,

      // CSS pseudo-element attacks
      /::?before[^}]*content\s*:\s*["'][^"']*<script/gi,
      /::?after[^}]*content\s*:\s*["'][^"']*<script/gi,

      // CSS media query attacks
      /@media[^{]*\{[^}]*javascript\s*:/gi,
      /@media[^{]*\{[^}]*expression\s*\(/gi
    ];

    // Suspicious CSS properties that often indicate injection attempts
    this.suspiciousProperties = [
      'expression', 'behavior', 'binding', '-moz-binding',
      'javascript', 'vbscript', 'livescript', 'mocha'
    ];

    // Track detection statistics
    this.detectionStats = {
      totalRequests: 0,
      suspiciousRequests: 0,
      blockedRequests: 0,
      patterns: {}
    };
  }

  /**
   * Detect CSS injection attempts in a string value
   */
  detectCSSInjection(value, field = 'unknown') {
    if (typeof value !== 'string') {
      return { detected: false, patterns: [], severity: 'none' };
    }

    const detectedPatterns = [];
    let maxSeverity = 'none';

    // Check against all dangerous patterns
    this.dangerousPatterns.forEach((pattern, index) => {
      if (pattern.test(value)) {
        const patternName = this.getPatternName(pattern);
        detectedPatterns.push({
          pattern: patternName,
          index,
          severity: this.getPatternSeverity(patternName)
        });

        // Update max severity
        const severity = this.getPatternSeverity(patternName);
        if (this.getSeverityLevel(severity) > this.getSeverityLevel(maxSeverity)) {
          maxSeverity = severity;
        }

        // Update detection statistics
        this.detectionStats.patterns[patternName] =
          (this.detectionStats.patterns[patternName] || 0) + 1;
      }
    });

    return {
      detected: detectedPatterns.length > 0,
      patterns: detectedPatterns,
      severity: maxSeverity,
      field
    };
  }

  /**
   * Get pattern name for logging
   */
  getPatternName(pattern) {
    const patternString = pattern.toString();

    if (patternString.includes('expression')) return 'css_expression';
    if (patternString.includes('behavior')) return 'css_behavior';
    if (patternString.includes('binding')) return 'css_binding';
    if (patternString.includes('javascript')) return 'javascript_protocol';
    if (patternString.includes('vbscript')) return 'vbscript_protocol';
    if (patternString.includes('@import')) return 'css_import';
    if (patternString.includes('url')) return 'css_url_injection';
    if (patternString.includes('style')) return 'style_tag_injection';
    if (patternString.includes('content')) return 'css_content_injection';
    if (patternString.includes('font-face')) return 'css_fontface_injection';
    if (patternString.includes('keyframes')) return 'css_keyframes_injection';
    if (patternString.includes('filter')) return 'css_filter_injection';
    if (patternString.includes('transform')) return 'css_transform_injection';
    if (patternString.includes('before\\|after')) return 'css_pseudo_injection';
    if (patternString.includes('media')) return 'css_media_injection';

    return 'unknown_css_pattern';
  }

  /**
   * Get severity level for a pattern
   */
  getPatternSeverity(patternName) {
    const highSeverity = [
      'css_expression', 'javascript_protocol', 'vbscript_protocol',
      'css_behavior', 'css_binding'
    ];

    const mediumSeverity = [
      'css_url_injection', 'style_tag_injection', 'css_import',
      'css_fontface_injection', 'css_filter_injection'
    ];

    if (highSeverity.includes(patternName)) return 'high';
    if (mediumSeverity.includes(patternName)) return 'medium';
    return 'low';
  }

  /**
   * Convert severity to numeric level for comparison
   */
  getSeverityLevel(severity) {
    switch (severity) {
      case 'high': return 3;
      case 'medium': return 2;
      case 'low': return 1;
      default: return 0;
    }
  }

  /**
   * Sanitize CSS injection attempts
   */
  sanitizeCSSInjection(value) {
    if (typeof value !== 'string') {
      return value;
    }

    let sanitized = value;

    // Apply all dangerous pattern replacements
    this.dangerousPatterns.forEach(pattern => {
      sanitized = sanitized.replace(pattern, '[REMOVED_CSS_INJECTION]');
    });

    // Additional sanitization for edge cases
    sanitized = sanitized
      // Remove any remaining dangerous CSS functions
      .replace(/expression\s*\([^)]*\)/gi, '[REMOVED]')
      .replace(/behavior\s*:\s*[^;]+/gi, 'behavior:[REMOVED]')
      .replace(/binding\s*:\s*[^;]+/gi, 'binding:[REMOVED]')

      // Clean up any leftover fragments
      .replace(/javascript\s*:\s*/gi, 'removed:')
      .replace(/vbscript\s*:\s*/gi, 'removed:')

      // Remove suspicious unicode escapes
      .replace(/\\[0-9a-f]{1,6}\s*/gi, '')

      // Clean up any HTML-like content in CSS
      .replace(/<[^>]*>/g, '[REMOVED_TAG]');

    return sanitized;
  }

  /**
   * Analyze request for CSS injection attempts
   */
  analyzeRequest(req) {
    this.detectionStats.totalRequests++;

    const results = {
      detected: false,
      detections: [],
      severity: 'none',
      blocked: false
    };

    // Recursively check all string values in request
    const checkObject = (obj, path = '') => {
      if (!obj || typeof obj !== 'object') {
        return;
      }

      Object.keys(obj).forEach(key => {
        const value = obj[key];
        const currentPath = path ? `${path}.${key}` : key;

        if (typeof value === 'string') {
          const detection = this.detectCSSInjection(value, currentPath);
          if (detection.detected) {
            results.detections.push(detection);
            results.detected = true;

            // Update overall severity
            if (this.getSeverityLevel(detection.severity) >
                this.getSeverityLevel(results.severity)) {
              results.severity = detection.severity;
            }
          }
        } else if (Array.isArray(value)) {
          value.forEach((item, index) => {
            checkObject(item, `${currentPath}[${index}]`);
          });
        } else if (typeof value === 'object') {
          checkObject(value, currentPath);
        }
      });
    };

    // Check request body
    if (req.body) {
      checkObject(req.body, 'body');
    }

    // Check query parameters
    if (req.query) {
      checkObject(req.query, 'query');
    }

    // Check route parameters
    if (req.params) {
      checkObject(req.params, 'params');
    }

    // Determine if request should be blocked
    results.blocked = results.severity === 'high' ||
                     (results.severity === 'medium' && results.detections.length > 2);

    if (results.detected) {
      this.detectionStats.suspiciousRequests++;
      if (results.blocked) {
        this.detectionStats.blockedRequests++;
      }
    }

    return results;
  }

  /**
   * Get detection statistics
   */
  getStats() {
    return {
      ...this.detectionStats,
      detectionRate: this.detectionStats.totalRequests > 0 ?
        (this.detectionStats.suspiciousRequests / this.detectionStats.totalRequests * 100).toFixed(2) : 0,
      blockRate: this.detectionStats.suspiciousRequests > 0 ?
        (this.detectionStats.blockedRequests / this.detectionStats.suspiciousRequests * 100).toFixed(2) : 0
    };
  }
}

// Create singleton instance
const cssProtection = new CSSInjectionProtection();

/**
 * CSS Injection Protection Middleware
 */
const cssInjectionProtectionMiddleware = (req, res, next) => {
  try {
    const analysis = cssProtection.analyzeRequest(req);

    if (analysis.detected) {
      const userId = req.user?.id || 'anonymous';
      const ip = req.ip || req.connection.remoteAddress;

      // Log CSS injection attempt
      console.warn(`[CSS INJECTION DETECTED] User: ${userId}, IP: ${ip}, Severity: ${analysis.severity}`);
      console.warn('Detection details:', analysis.detections);

      // Audit log the attempt
      AuditLogger.logSecurityEvent(userId, 'css_injection_attempt', {
        ip,
        severity: analysis.severity,
        detections: analysis.detections,
        userAgent: req.get('User-Agent'),
        path: req.path,
        method: req.method,
        blocked: analysis.blocked
      });

      // Track security event if tracking is available
      if (req.trackSecurityEvent) {
        req.trackSecurityEvent('css_injection_attempt', {
          severity: analysis.severity,
          detections: analysis.detections.length,
          patterns: analysis.detections.map(d => d.patterns).flat(),
          blocked: analysis.blocked
        });
      }

      // Block high-severity or repeated medium-severity attempts
      if (analysis.blocked) {
        console.error(`[CSS INJECTION BLOCKED] Blocking request from ${ip} due to ${analysis.severity} severity CSS injection attempt`);

        return res.status(400).json({
          success: false,
          message: 'Request blocked due to security policy violation',
          code: 'CSS_INJECTION_DETECTED',
          details: process.env.NODE_ENV !== 'production' ? {
            severity: analysis.severity,
            detectionCount: analysis.detections.length
          } : undefined
        });
      } else {
        // Log but allow request to continue (for medium/low severity)
        console.warn(`[CSS INJECTION WARNING] Allowing request with ${analysis.severity} severity CSS injection patterns`);
      }
    }

    next();
  } catch (error) {
    console.error('CSS injection protection middleware error:', error);
    // Don't block request due to middleware error
    next();
  }
};

/**
 * Apply CSS sanitization to request data
 */
const sanitizeCSSInRequest = (req, res, next) => {
  try {
    // Recursively sanitize all string values
    const sanitizeObject = (obj) => {
      if (!obj || typeof obj !== 'object') {
        return obj;
      }

      if (Array.isArray(obj)) {
        return obj.map(item => sanitizeObject(item));
      }

      const sanitized = {};
      Object.keys(obj).forEach(key => {
        const value = obj[key];
        if (typeof value === 'string') {
          sanitized[key] = cssProtection.sanitizeCSSInjection(value);
        } else if (typeof value === 'object') {
          sanitized[key] = sanitizeObject(value);
        } else {
          sanitized[key] = value;
        }
      });

      return sanitized;
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
  } catch (error) {
    console.error('CSS sanitization middleware error:', error);
    next();
  }
};

module.exports = {
  CSSInjectionProtection,
  cssProtection,
  cssInjectionProtectionMiddleware,
  sanitizeCSSInRequest
};