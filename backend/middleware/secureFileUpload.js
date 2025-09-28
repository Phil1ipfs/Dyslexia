/**
 * Secure File Upload Middleware
 * Protects against malicious file uploads with comprehensive security checks
 */

const multer = require('multer');
const path = require('path');
const fs = require('fs');
const crypto = require('crypto');
const AuditLogger = require('./auditLogger');

/**
 * Security configuration for different file types
 */
const SECURITY_CONFIG = {
  IMAGE: {
    allowedMimeTypes: [
      'image/jpeg',
      'image/jpg',
      'image/png',
      'image/gif',
      'image/webp'
    ],
    allowedExtensions: ['.jpg', '.jpeg', '.png', '.gif', '.webp'],
    maxSize: 5 * 1024 * 1024, // 5MB
    virusCheck: true,
    requireImageValidation: true
  },
  DOCUMENT: {
    allowedMimeTypes: [
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
    ],
    allowedExtensions: ['.pdf', '.doc', '.docx'],
    maxSize: 10 * 1024 * 1024, // 10MB
    virusCheck: true,
    requireImageValidation: false
  },
  MEDIA: {
    allowedMimeTypes: [
      'audio/mpeg',
      'audio/wav',
      'audio/mp3',
      'video/mp4',
      'video/mpeg'
    ],
    allowedExtensions: ['.mp3', '.wav', '.mp4', '.mpeg'],
    maxSize: 50 * 1024 * 1024, // 50MB
    virusCheck: true,
    requireImageValidation: false
  }
};

/**
 * Dangerous file signatures to detect (magic numbers)
 */
const DANGEROUS_SIGNATURES = [
  // Executable files
  { signature: Buffer.from([0x4D, 0x5A]), description: 'Windows executable' },
  { signature: Buffer.from([0x7F, 0x45, 0x4C, 0x46]), description: 'Linux executable' },

  // Script files
  { signature: Buffer.from('<?php'), description: 'PHP script' },
  { signature: Buffer.from('<script'), description: 'JavaScript in HTML' },
  { signature: Buffer.from('javascript:'), description: 'JavaScript protocol' },

  // Archive files that could contain malware
  { signature: Buffer.from([0x50, 0x4B, 0x03, 0x04]), description: 'ZIP archive' },
  { signature: Buffer.from([0x52, 0x61, 0x72, 0x21]), description: 'RAR archive' },
];

/**
 * Creates secure file upload middleware with comprehensive security checks
 * @param {Object} options - Upload configuration options
 * @returns {Function} Multer middleware
 */
function createSecureUpload(options = {}) {
  const {
    fileType = 'IMAGE',
    fieldName = 'file',
    uploadDir = 'uploads',
    allowMultiple = false,
    maxFiles = 1,
    enableAntivirus = false
  } = options;

  const config = SECURITY_CONFIG[fileType];
  if (!config) {
    throw new Error(`Invalid file type: ${fileType}`);
  }

  // Ensure upload directory exists and is secure
  ensureSecureUploadDir(uploadDir);

  const storage = multer.diskStorage({
    destination: (req, file, cb) => {
      // Create user-specific subdirectory if authenticated
      const userDir = req.user?.id ? path.join(uploadDir, req.user.id) : uploadDir;
      ensureSecureUploadDir(userDir);
      cb(null, userDir);
    },
    filename: (req, file, cb) => {
      // Generate cryptographically secure filename
      const timestamp = Date.now();
      const randomBytes = crypto.randomBytes(16).toString('hex');
      const ext = path.extname(file.originalname).toLowerCase();
      const secureFilename = `${timestamp}-${randomBytes}${ext}`;

      // Store original filename securely
      file.secureOriginalName = file.originalname;
      file.secureFilename = secureFilename;

      cb(null, secureFilename);
    }
  });

  const fileFilter = async (req, file, cb) => {
    try {
      // Comprehensive security validation
      const validation = await validateFileSecuritySync(file, config, req);

      if (validation.isSecure) {
        cb(null, true);
      } else {
        const error = new Error(validation.reason);
        error.code = 'SECURITY_VIOLATION';
        error.securityLevel = validation.securityLevel;
        cb(error, false);
      }
    } catch (error) {
      cb(error, false);
    }
  };

  const upload = multer({
    storage,
    fileFilter,
    limits: {
      fileSize: config.maxSize,
      files: maxFiles,
      fields: 10,
      fieldSize: 1024 * 1024, // 1MB field size limit
      headerPairs: 2000
    }
  });

  // Return appropriate multer method based on requirements
  if (allowMultiple) {
    return upload.array(fieldName, maxFiles);
  } else {
    return upload.single(fieldName);
  }
}

/**
 * Validates file security synchronously during upload
 * @param {Object} file - Multer file object
 * @param {Object} config - Security configuration
 * @param {Object} req - Express request object
 * @returns {Object} Validation result
 */
function validateFileSecuritySync(file, config, req) {
  const userId = req.user?.id || 'anonymous';
  const ip = req.ip || req.connection.remoteAddress;

  // 1. MIME type validation
  if (!config.allowedMimeTypes.includes(file.mimetype)) {
    logSecurityViolation(userId, ip, 'invalid_mime_type', {
      received: file.mimetype,
      allowed: config.allowedMimeTypes
    });
    return {
      isSecure: false,
      reason: `File type ${file.mimetype} not allowed`,
      securityLevel: 'HIGH'
    };
  }

  // 2. File extension validation
  const ext = path.extname(file.originalname).toLowerCase();
  if (!config.allowedExtensions.includes(ext)) {
    logSecurityViolation(userId, ip, 'invalid_extension', {
      received: ext,
      allowed: config.allowedExtensions
    });
    return {
      isSecure: false,
      reason: `File extension ${ext} not allowed`,
      securityLevel: 'HIGH'
    };
  }

  // 3. Filename security validation
  const filenameValidation = validateFilename(file.originalname);
  if (!filenameValidation.isSecure) {
    logSecurityViolation(userId, ip, 'malicious_filename', {
      filename: file.originalname,
      reason: filenameValidation.reason
    });
    return {
      isSecure: false,
      reason: `Filename security violation: ${filenameValidation.reason}`,
      securityLevel: 'HIGH'
    };
  }

  // 4. Content length validation
  if (file.size > config.maxSize) {
    return {
      isSecure: false,
      reason: `File size ${file.size} exceeds maximum ${config.maxSize}`,
      securityLevel: 'MEDIUM'
    };
  }

  return { isSecure: true, reason: 'File passed security validation' };
}

/**
 * Advanced file security validation after upload
 * @param {string} filePath - Path to uploaded file
 * @param {Object} config - Security configuration
 * @param {Object} req - Express request object
 * @returns {Promise<Object>} Validation result
 */
async function validateFileSecurityAdvanced(filePath, config, req) {
  const userId = req.user?.id || 'anonymous';
  const ip = req.ip || req.connection.remoteAddress;

  try {
    // 1. File signature validation (magic number check)
    const signatureValidation = await validateFileSignature(filePath);
    if (!signatureValidation.isSecure) {
      logSecurityViolation(userId, ip, 'malicious_signature', {
        signature: signatureValidation.detectedSignature,
        filePath: path.basename(filePath)
      });
      return {
        isSecure: false,
        reason: `Malicious file signature detected: ${signatureValidation.detectedSignature}`,
        securityLevel: 'CRITICAL'
      };
    }

    // 2. Image validation for image files
    if (config.requireImageValidation) {
      const imageValidation = await validateImageFile(filePath);
      if (!imageValidation.isSecure) {
        logSecurityViolation(userId, ip, 'invalid_image', {
          reason: imageValidation.reason,
          filePath: path.basename(filePath)
        });
        return {
          isSecure: false,
          reason: `Image validation failed: ${imageValidation.reason}`,
          securityLevel: 'HIGH'
        };
      }
    }

    // 3. Virus scanning (if enabled)
    if (config.virusCheck) {
      const virusValidation = await scanForViruses(filePath);
      if (!virusValidation.isSecure) {
        logSecurityViolation(userId, ip, 'virus_detected', {
          virusName: virusValidation.virusName,
          filePath: path.basename(filePath)
        });
        return {
          isSecure: false,
          reason: `Virus detected: ${virusValidation.virusName}`,
          securityLevel: 'CRITICAL'
        };
      }
    }

    return { isSecure: true, reason: 'File passed advanced security validation' };

  } catch (error) {
    console.error('[FILE SECURITY] Advanced validation error:', error);
    return {
      isSecure: false,
      reason: 'Security validation failed due to system error',
      securityLevel: 'HIGH'
    };
  }
}

/**
 * Validates filename for security issues
 * @param {string} filename - Original filename
 * @returns {Object} Validation result
 */
function validateFilename(filename) {
  // Path traversal attempts
  if (filename.includes('..') || filename.includes('/') || filename.includes('\\')) {
    return {
      isSecure: false,
      reason: 'Path traversal attempt detected'
    };
  }

  // Null byte injection
  if (filename.includes('\0')) {
    return {
      isSecure: false,
      reason: 'Null byte injection detected'
    };
  }

  // Executable extensions disguised as images
  const dangerousPatterns = [
    /\.exe$/i, /\.bat$/i, /\.cmd$/i, /\.com$/i, /\.scr$/i,
    /\.php$/i, /\.jsp$/i, /\.asp$/i, /\.js$/i, /\.vbs$/i,
    /\.jar$/i, /\.war$/i, /\.class$/i
  ];

  for (const pattern of dangerousPatterns) {
    if (pattern.test(filename)) {
      return {
        isSecure: false,
        reason: 'Potentially dangerous file extension detected'
      };
    }
  }

  // Control characters
  if (/[\x00-\x1f\x7f-\x9f]/.test(filename)) {
    return {
      isSecure: false,
      reason: 'Control characters detected in filename'
    };
  }

  return { isSecure: true };
}

/**
 * Validates file signature (magic numbers)
 * @param {string} filePath - Path to file
 * @returns {Promise<Object>} Validation result
 */
async function validateFileSignature(filePath) {
  try {
    const fileBuffer = await fs.promises.readFile(filePath, { start: 0, end: 32 });

    for (const dangerous of DANGEROUS_SIGNATURES) {
      if (fileBuffer.includes(dangerous.signature)) {
        return {
          isSecure: false,
          detectedSignature: dangerous.description
        };
      }
    }

    return { isSecure: true };
  } catch (error) {
    console.error('[FILE SECURITY] Signature validation error:', error);
    return { isSecure: false, detectedSignature: 'Validation error' };
  }
}

/**
 * Validates image file integrity
 * @param {string} filePath - Path to image file
 * @returns {Promise<Object>} Validation result
 */
async function validateImageFile(filePath) {
  try {
    // Basic image header validation
    const buffer = await fs.promises.readFile(filePath, { start: 0, end: 12 });

    // Check for valid image signatures
    const imageSignatures = [
      { signature: Buffer.from([0xFF, 0xD8, 0xFF]), type: 'JPEG' },
      { signature: Buffer.from([0x89, 0x50, 0x4E, 0x47]), type: 'PNG' },
      { signature: Buffer.from([0x47, 0x49, 0x46, 0x38]), type: 'GIF' },
      { signature: Buffer.from('RIFF'), type: 'WebP' }
    ];

    let validImage = false;
    for (const img of imageSignatures) {
      if (buffer.includes(img.signature)) {
        validImage = true;
        break;
      }
    }

    if (!validImage) {
      return {
        isSecure: false,
        reason: 'Invalid image signature - file may be corrupted or not a real image'
      };
    }

    return { isSecure: true };
  } catch (error) {
    return {
      isSecure: false,
      reason: 'Image validation failed due to read error'
    };
  }
}

/**
 * Basic virus scanning (placeholder for real antivirus integration)
 * @param {string} filePath - Path to file
 * @returns {Promise<Object>} Scan result
 */
async function scanForViruses(filePath) {
  // This is a placeholder implementation
  // In production, integrate with ClamAV, VirusTotal API, or similar

  try {
    // Simple heuristic checks for now
    const buffer = await fs.promises.readFile(filePath, { start: 0, end: 1024 });
    const content = buffer.toString('utf8');

    // Look for suspicious patterns
    const maliciousPatterns = [
      /<script[^>]*>.*?<\/script>/gi,
      /eval\s*\(/gi,
      /document\.write\s*\(/gi,
      /window\.location\s*=/gi
    ];

    for (const pattern of maliciousPatterns) {
      if (pattern.test(content)) {
        return {
          isSecure: false,
          virusName: 'Heuristic: Suspicious script content'
        };
      }
    }

    return { isSecure: true };
  } catch (error) {
    return { isSecure: true }; // Default to safe if scanning fails
  }
}

/**
 * Ensures upload directory exists and has secure permissions
 * @param {string} uploadDir - Directory path
 */
function ensureSecureUploadDir(uploadDir) {
  try {
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true, mode: 0o755 });
    }

    // Ensure .htaccess file exists to prevent direct access
    const htaccessPath = path.join(uploadDir, '.htaccess');
    if (!fs.existsSync(htaccessPath)) {
      const htaccessContent = `
# Deny direct access to uploaded files
Order Deny,Allow
Deny from all

# Prevent script execution
<Files ~ "\\.(php|pl|py|jsp|asp|sh|cgi)$">
  Order allow,deny
  Deny from all
</Files>`;
      fs.writeFileSync(htaccessPath, htaccessContent);
    }
  } catch (error) {
    console.error('[FILE SECURITY] Upload directory setup error:', error);
  }
}

/**
 * Logs security violations
 * @param {string} userId - User ID
 * @param {string} ip - IP address
 * @param {string} violationType - Type of violation
 * @param {Object} details - Violation details
 */
function logSecurityViolation(userId, ip, violationType, details) {
  console.warn(`[FILE SECURITY VIOLATION] User: ${userId}, IP: ${ip}, Type: ${violationType}`);
  console.warn('Violation details:', details);

  AuditLogger.logSecurityEvent(userId, 'file_upload_violation', {
    ip,
    violationType,
    details,
    timestamp: new Date().toISOString()
  });
}

/**
 * Middleware for post-upload security validation
 * @param {Object} config - Security configuration
 * @returns {Function} Express middleware
 */
function createPostUploadValidation(config) {
  return async (req, res, next) => {
    if (!req.file && !req.files) {
      return next(); // No files uploaded
    }

    const files = req.files || [req.file];

    try {
      for (const file of files) {
        if (file) {
          const validation = await validateFileSecurityAdvanced(file.path, config, req);

          if (!validation.isSecure) {
            // Delete insecure file immediately
            try {
              await fs.promises.unlink(file.path);
            } catch (unlinkError) {
              console.error('[FILE SECURITY] Failed to delete insecure file:', unlinkError);
            }

            return res.status(400).json({
              success: false,
              message: 'File security validation failed',
              code: 'FILE_SECURITY_VIOLATION',
              details: process.env.NODE_ENV === 'development' ? validation.reason : undefined
            });
          }
        }
      }

      next();
    } catch (error) {
      console.error('[FILE SECURITY] Post-upload validation error:', error);
      return res.status(500).json({
        success: false,
        message: 'File security validation failed',
        code: 'VALIDATION_ERROR'
      });
    }
  };
}

module.exports = {
  createSecureUpload,
  createPostUploadValidation,
  validateFileSecurityAdvanced,
  SECURITY_CONFIG
};