const CryptoJS = require('crypto-js');

class DataEncryption {
  constructor() {
    // Get encryption key from environment variable
    this.encryptionKey = process.env.DATA_ENCRYPTION_KEY;

    if (!this.encryptionKey) {
      console.error('DATA_ENCRYPTION_KEY environment variable is required for data encryption');
      throw new Error('Data encryption configuration missing');
    }

    // Ensure key is at least 32 characters for AES-256
    if (this.encryptionKey.length < 32) {
      console.error('DATA_ENCRYPTION_KEY must be at least 32 characters long for AES-256 encryption');
      throw new Error('Data encryption key too short');
    }
  }

  /**
   * Encrypt sensitive data
   * @param {string} data - Data to encrypt
   * @returns {string} - Encrypted data with IV
   */
  encrypt(data) {
    if (!data || typeof data !== 'string') {
      return data; // Return as-is if no data or not a string
    }

    try {
      // Generate a random IV for each encryption
      const iv = CryptoJS.lib.WordArray.random(16);

      // Encrypt using AES-256-CBC
      const encrypted = CryptoJS.AES.encrypt(data, this.encryptionKey, {
        iv: iv,
        mode: CryptoJS.mode.CBC,
        padding: CryptoJS.pad.Pkcs7
      });

      // Combine IV and encrypted data
      const combined = iv.concat(encrypted.ciphertext);

      // Return as base64 string with prefix to identify encrypted data
      return 'ENC:' + CryptoJS.enc.Base64.stringify(combined);
    } catch (error) {
      console.error('Encryption error:', error);
      throw new Error('Failed to encrypt data');
    }
  }

  /**
   * Decrypt sensitive data
   * @param {string} encryptedData - Encrypted data with IV
   * @returns {string} - Decrypted data
   */
  decrypt(encryptedData) {
    if (!encryptedData || typeof encryptedData !== 'string') {
      return encryptedData; // Return as-is if no data or not a string
    }

    // Check if data is encrypted (has our prefix)
    if (!encryptedData.startsWith('ENC:')) {
      return encryptedData; // Return as-is if not encrypted
    }

    try {
      // Remove prefix and decode from base64
      const combined = CryptoJS.enc.Base64.parse(encryptedData.substring(4));

      // Extract IV (first 16 bytes) and ciphertext
      const iv = CryptoJS.lib.WordArray.create(combined.words.slice(0, 4));
      const ciphertext = CryptoJS.lib.WordArray.create(combined.words.slice(4));

      // Decrypt using AES-256-CBC
      const decrypted = CryptoJS.AES.decrypt(
        CryptoJS.lib.CipherParams.create({ ciphertext: ciphertext }),
        this.encryptionKey,
        {
          iv: iv,
          mode: CryptoJS.mode.CBC,
          padding: CryptoJS.pad.Pkcs7
        }
      );

      return decrypted.toString(CryptoJS.enc.Utf8);
    } catch (error) {
      console.error('Decryption error:', error);
      throw new Error('Failed to decrypt data');
    }
  }

  /**
   * Check if data is encrypted
   * @param {string} data - Data to check
   * @returns {boolean} - True if data is encrypted
   */
  isEncrypted(data) {
    return typeof data === 'string' && data.startsWith('ENC:');
  }

  /**
   * Encrypt sensitive fields in an object
   * @param {Object} obj - Object containing data
   * @param {Array} sensitiveFields - Array of field names to encrypt
   * @returns {Object} - Object with encrypted sensitive fields
   */
  encryptSensitiveFields(obj, sensitiveFields) {
    if (!obj || typeof obj !== 'object') {
      return obj;
    }

    const result = { ...obj };

    sensitiveFields.forEach(field => {
      if (result[field] !== undefined && result[field] !== null) {
        // Handle arrays of objects (like responses)
        if (Array.isArray(result[field])) {
          result[field] = result[field].map(item => {
            if (typeof item === 'object') {
              return this.encryptSensitiveFields(item, ['response', 'answer', 'value']);
            }
            return typeof item === 'string' ? this.encrypt(item) : item;
          });
        } else if (typeof result[field] === 'object') {
          // Handle nested objects
          result[field] = this.encryptSensitiveFields(result[field], ['response', 'answer', 'value']);
        } else if (typeof result[field] === 'string') {
          // Encrypt string fields
          result[field] = this.encrypt(result[field]);
        }
      }
    });

    return result;
  }

  /**
   * Decrypt sensitive fields in an object
   * @param {Object} obj - Object containing encrypted data
   * @param {Array} sensitiveFields - Array of field names to decrypt
   * @returns {Object} - Object with decrypted sensitive fields
   */
  decryptSensitiveFields(obj, sensitiveFields) {
    if (!obj || typeof obj !== 'object') {
      return obj;
    }

    const result = { ...obj };

    sensitiveFields.forEach(field => {
      if (result[field] !== undefined && result[field] !== null) {
        // Handle arrays of objects (like responses)
        if (Array.isArray(result[field])) {
          result[field] = result[field].map(item => {
            if (typeof item === 'object') {
              return this.decryptSensitiveFields(item, ['response', 'answer', 'value']);
            }
            return this.isEncrypted(item) ? this.decrypt(item) : item;
          });
        } else if (typeof result[field] === 'object') {
          // Handle nested objects
          result[field] = this.decryptSensitiveFields(result[field], ['response', 'answer', 'value']);
        } else if (this.isEncrypted(result[field])) {
          // Decrypt encrypted string fields
          result[field] = this.decrypt(result[field]);
        }
      }
    });

    return result;
  }
}

// Define sensitive fields for different collections
const SENSITIVE_FIELDS = {
  student_responses: ['response', 'correctAnswer'],
  intervention_responses: ['response', 'correctAnswer'],
  user_responses: ['response', 'correctAnswer'],
  assessment_results: ['responses', 'answers'],
  category_results: ['responses', 'errorPatterns']
};

// Create singleton instance
let encryptionInstance = null;

function getEncryptionInstance() {
  if (!encryptionInstance) {
    try {
      encryptionInstance = new DataEncryption();
    } catch (error) {
      console.warn('Data encryption not available:', error.message);
      // Return a mock instance that doesn't encrypt/decrypt
      encryptionInstance = {
        encrypt: (data) => data,
        decrypt: (data) => data,
        isEncrypted: () => false,
        encryptSensitiveFields: (obj) => obj,
        decryptSensitiveFields: (obj) => obj
      };
    }
  }
  return encryptionInstance;
}

module.exports = {
  DataEncryption,
  SENSITIVE_FIELDS,
  getEncryptionInstance
};