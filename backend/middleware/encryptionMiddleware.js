const { getEncryptionInstance, SENSITIVE_FIELDS } = require('../utils/encryption');

/**
 * Middleware to automatically encrypt sensitive data before saving to database
 * @param {string} collectionType - Type of collection (e.g., 'student_responses')
 */
function encryptBeforeSave(collectionType) {
  return (req, res, next) => {
    const encryption = getEncryptionInstance();
    const sensitiveFields = SENSITIVE_FIELDS[collectionType] || [];

    if (req.body && sensitiveFields.length > 0) {
      try {
        // Encrypt sensitive fields in request body
        req.body = encryption.encryptSensitiveFields(req.body, sensitiveFields);

        // Log encryption activity (without sensitive data)
        console.log(`[ENCRYPTION] Encrypted sensitive fields for ${collectionType}:`, sensitiveFields);
      } catch (error) {
        console.error('Error encrypting sensitive data:', error);
        return res.status(500).json({
          success: false,
          message: 'Data processing error',
          error: 'ENCRYPTION_ERROR'
        });
      }
    }

    next();
  };
}

/**
 * Middleware to automatically decrypt sensitive data after retrieving from database
 * @param {string} collectionType - Type of collection (e.g., 'student_responses')
 */
function decryptAfterRetrieve(collectionType) {
  return (req, res, next) => {
    const encryption = getEncryptionInstance();
    const sensitiveFields = SENSITIVE_FIELDS[collectionType] || [];

    if (sensitiveFields.length === 0) {
      return next();
    }

    // Override res.json to decrypt data before sending
    const originalJson = res.json;

    res.json = function(data) {
      try {
        if (data && typeof data === 'object') {
          // Handle single objects
          if (!Array.isArray(data)) {
            data = encryption.decryptSensitiveFields(data, sensitiveFields);
          } else {
            // Handle arrays of objects
            data = data.map(item =>
              encryption.decryptSensitiveFields(item, sensitiveFields)
            );
          }

          // Log decryption activity (without sensitive data)
          console.log(`[DECRYPTION] Decrypted sensitive fields for ${collectionType}:`, sensitiveFields);
        }
      } catch (error) {
        console.error('Error decrypting sensitive data:', error);
        return originalJson.call(this, {
          success: false,
          message: 'Data retrieval error',
          error: 'DECRYPTION_ERROR'
        });
      }

      return originalJson.call(this, data);
    };

    next();
  };
}

/**
 * Encrypt assessment response data before saving
 */
const encryptStudentResponses = encryptBeforeSave('student_responses');

/**
 * Decrypt assessment response data after retrieving
 */
const decryptStudentResponses = decryptAfterRetrieve('student_responses');

/**
 * Encrypt intervention response data before saving
 */
const encryptInterventionResponses = encryptBeforeSave('intervention_responses');

/**
 * Decrypt intervention response data after retrieving
 */
const decryptInterventionResponses = decryptAfterRetrieve('intervention_responses');

/**
 * Encrypt user response data before saving
 */
const encryptUserResponses = encryptBeforeSave('user_responses');

/**
 * Decrypt user response data after retrieving
 */
const decryptUserResponses = decryptAfterRetrieve('user_responses');

/**
 * Encrypt category results data before saving
 */
const encryptCategoryResults = encryptBeforeSave('category_results');

/**
 * Decrypt category results data after retrieving
 */
const decryptCategoryResults = decryptAfterRetrieve('category_results');

/**
 * General encryption middleware for any collection type
 * @param {string} collectionType - Type of collection
 * @returns {Object} - Object with encrypt and decrypt middleware functions
 */
function createEncryptionMiddleware(collectionType) {
  return {
    encrypt: encryptBeforeSave(collectionType),
    decrypt: decryptAfterRetrieve(collectionType)
  };
}

module.exports = {
  encryptBeforeSave,
  decryptAfterRetrieve,
  encryptStudentResponses,
  decryptStudentResponses,
  encryptInterventionResponses,
  decryptInterventionResponses,
  encryptUserResponses,
  decryptUserResponses,
  encryptCategoryResults,
  decryptCategoryResults,
  createEncryptionMiddleware
};