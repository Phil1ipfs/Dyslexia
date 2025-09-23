// utils/imageUrlValidator.js
const fetch = require('node-fetch');

class ImageUrlValidator {
  constructor() {
    // Mobile-optimized fallback images for different question types
    this.fallbackImages = {
      'Word Recognition': 'https://literexia-bucket.s3.ap-southeast-2.amazonaws.com/defaults/word-recognition-placeholder.png',
      'Alphabet Knowledge': 'https://literexia-bucket.s3.ap-southeast-2.amazonaws.com/defaults/alphabet-placeholder.png',
      'Phonological Awareness': 'https://literexia-bucket.s3.ap-southeast-2.amazonaws.com/defaults/phonological-placeholder.png',
      'Decoding': 'https://literexia-bucket.s3.ap-southeast-2.amazonaws.com/defaults/decoding-placeholder.png',
      'Reading Comprehension': 'https://literexia-bucket.s3.ap-southeast-2.amazonaws.com/defaults/reading-placeholder.png',
      'default': 'https://literexia-bucket.s3.ap-southeast-2.amazonaws.com/defaults/question-placeholder.png',

      // Mobile-specific placeholders for enhanced reliability
      'mobile_loading': 'https://literexia-bucket.s3.ap-southeast-2.amazonaws.com/defaults/mobile-loading-placeholder.png',
      'mobile_error': 'https://literexia-bucket.s3.ap-southeast-2.amazonaws.com/defaults/mobile-error-placeholder.png',
      'mobile_offline': 'https://literexia-bucket.s3.ap-southeast-2.amazonaws.com/defaults/mobile-offline-placeholder.png'
    };

    // Enhanced cache for validated URLs with mobile optimization
    this.urlCache = new Map();
    this.cacheExpiry = 5 * 60 * 1000; // 5 minutes for regular cache
    this.mobileCacheExpiry = 10 * 60 * 1000; // 10 minutes for fallback URLs (longer cache)

    // Load MobileFallbackService for dynamic fallback management
    this.mobileFallbackService = null;
    this.loadMobileFallbackService();
  }

  /**
   * Load MobileFallbackService dynamically to avoid circular dependencies
   */
  loadMobileFallbackService() {
    try {
      this.mobileFallbackService = require('../services/MobileFallbackService');
      console.log('📱 MobileFallbackService integration enabled');
    } catch (error) {
      console.warn('⚠️ MobileFallbackService not available, using static fallbacks');
    }
  }

  /**
   * Validate if an image URL is accessible
   * @param {string} url - The image URL to validate
   * @param {number} timeout - Request timeout in milliseconds (default: 5000)
   * @returns {Promise<boolean>} - True if accessible, false otherwise
   */
  async validateImageUrl(url, timeout = 5000) {
    if (!url || typeof url !== 'string') {
      return false;
    }

    // Check cache first
    const cacheKey = url;
    const cached = this.urlCache.get(cacheKey);
    if (cached && (Date.now() - cached.timestamp) < this.cacheExpiry) {
      return cached.isValid;
    }

    try {
      console.log(`🔍 Validating image URL: ${url}`);

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), timeout);

      const response = await fetch(url, {
        method: 'HEAD',
        signal: controller.signal,
        headers: {
          'User-Agent': 'Literexia-Image-Validator/1.0'
        }
      });

      clearTimeout(timeoutId);

      const isValid = response.ok && response.headers.get('content-type')?.startsWith('image/');

      // Cache the result
      this.urlCache.set(cacheKey, {
        isValid,
        timestamp: Date.now()
      });

      if (isValid) {
        console.log(`✅ Image URL is valid: ${url}`);
      } else {
        console.warn(`❌ Image URL is invalid: ${url} (Status: ${response.status})`);
      }

      return isValid;
    } catch (error) {
      console.warn(`❌ Error validating image URL ${url}:`, error.message);

      // Cache negative result for shorter time
      this.urlCache.set(cacheKey, {
        isValid: false,
        timestamp: Date.now()
      });

      return false;
    }
  }

  /**
   * Get fallback image URL for a specific category
   * @param {string} category - The question category
   * @param {string} context - Context for fallback (mobile_loading, mobile_error, etc.)
   * @returns {string} - Fallback image URL
   */
  getFallbackImage(category, context = null) {
    // Use MobileFallbackService if available for dynamic fallback management
    if (this.mobileFallbackService) {
      try {
        // Check for context-specific mobile fallbacks
        if (context && context.startsWith('mobile_')) {
          return this.mobileFallbackService.getMobileFallbackUrl(context);
        }

        // Get category-specific fallback
        return this.mobileFallbackService.getMobileFallbackUrl(category);
      } catch (error) {
        console.warn('⚠️ MobileFallbackService error, using static fallback:', error.message);
      }
    }

    // Fallback to static image mapping
    if (context && this.fallbackImages[context]) {
      return this.fallbackImages[context];
    }

    return this.fallbackImages[category] || this.fallbackImages['default'];
  }

  /**
   * Validate and provide fallback for an image URL
   * @param {string} url - The image URL to validate
   * @param {string} category - The question category for fallback
   * @returns {Promise<Object>} - Object with url, isOriginal, and isFallback
   */
  async validateOrFallback(url, category = 'default') {
    const isValid = await this.validateImageUrl(url);

    if (isValid) {
      return {
        url: url,
        isOriginal: true,
        isFallback: false,
        category: category
      };
    }

    const fallbackUrl = this.getFallbackImage(category);
    console.log(`🔄 Using fallback image for category "${category}": ${fallbackUrl}`);

    return {
      url: fallbackUrl,
      isOriginal: false,
      isFallback: true,
      originalUrl: url,
      category: category
    };
  }

  /**
   * Validate multiple image URLs in parallel
   * @param {Array} urls - Array of URLs to validate
   * @param {string} category - Category for fallbacks
   * @returns {Promise<Array>} - Array of validation results
   */
  async validateMultipleUrls(urls, category = 'default') {
    if (!Array.isArray(urls)) {
      return [];
    }

    const validationPromises = urls.map(url => this.validateOrFallback(url, category));
    return Promise.all(validationPromises);
  }

  /**
   * Clear the validation cache
   */
  clearCache() {
    this.urlCache.clear();
    console.log('🗑️ Image URL validation cache cleared');
  }

  /**
   * Get cache statistics
   * @returns {Object} - Cache statistics
   */
  getCacheStats() {
    const total = this.urlCache.size;
    const valid = Array.from(this.urlCache.values()).filter(entry => entry.isValid).length;
    const invalid = total - valid;

    return {
      total,
      valid,
      invalid,
      hitRate: total > 0 ? (valid / total * 100).toFixed(2) + '%' : '0%'
    };
  }
}

module.exports = new ImageUrlValidator();