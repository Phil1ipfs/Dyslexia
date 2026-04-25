// services/MobileFallbackService.js
const s3Client = require('../config/s3');
const { PutObjectCommand, HeadObjectCommand } = require('@aws-sdk/client-s3');
const imageUrlValidator = require('../utils/imageUrlValidator');
const sharp = require('sharp'); // For image generation (install if needed)

class MobileFallbackService {
  constructor() {
    this.bucketName = process.env.AWS_S3_BUCKET || 'literexia-bucket';
    this.fallbackPath = 'defaults';

    // Enhanced fallback images for all intervention categories
    this.fallbackImages = {
      'Word Recognition': `https://${this.bucketName}.s3.ap-southeast-2.amazonaws.com/${this.fallbackPath}/word-recognition-placeholder.png`,
      'Alphabet Knowledge': `https://${this.bucketName}.s3.ap-southeast-2.amazonaws.com/${this.fallbackPath}/alphabet-placeholder.png`,
      'Phonological Awareness': `https://${this.bucketName}.s3.ap-southeast-2.amazonaws.com/${this.fallbackPath}/phonological-placeholder.png`,
      'Decoding': `https://${this.bucketName}.s3.ap-southeast-2.amazonaws.com/${this.fallbackPath}/decoding-placeholder.png`,
      'Reading Comprehension': `https://${this.bucketName}.s3.ap-southeast-2.amazonaws.com/${this.fallbackPath}/reading-placeholder.png`,
      'default': `https://${this.bucketName}.s3.ap-southeast-2.amazonaws.com/${this.fallbackPath}/question-placeholder.png`,

      // Mobile-specific placeholders
      'mobile_loading': `https://${this.bucketName}.s3.ap-southeast-2.amazonaws.com/${this.fallbackPath}/mobile-loading-placeholder.png`,
      'mobile_error': `https://${this.bucketName}.s3.ap-southeast-2.amazonaws.com/${this.fallbackPath}/mobile-error-placeholder.png`,
      'mobile_offline': `https://${this.bucketName}.s3.ap-southeast-2.amazonaws.com/${this.fallbackPath}/mobile-offline-placeholder.png`
    };

    this.fallbackImageSpecs = {
      width: 400,
      height: 300,
      format: 'png',
      quality: 80
    };
  }

  /**
   * Ensure all fallback images exist in S3, create them if missing
   */
  async ensureFallbackImagesExist() {
    console.log('🖼️ Ensuring all mobile fallback images exist in S3...');

    const results = {
      verified: [],
      created: [],
      failed: []
    };

    for (const [category, url] of Object.entries(this.fallbackImages)) {
      try {
        console.log(`  📸 Checking fallback image for ${category}: ${url}`);

        const exists = await this.checkImageExistsInS3(url);

        if (exists) {
          console.log(`  ✅ Fallback image exists: ${category}`);
          results.verified.push({ category, url, status: 'exists' });
        } else {
          console.log(`  ⚠️ Fallback image missing: ${category}, creating...`);

          const creationResult = await this.createFallbackImage(category, url);

          if (creationResult.success) {
            console.log(`  ✅ Created fallback image: ${category}`);
            results.created.push({ category, url, status: 'created' });
          } else {
            console.error(`  ❌ Failed to create fallback image: ${category}`);
            results.failed.push({ category, url, error: creationResult.error });
          }
        }

      } catch (error) {
        console.error(`  ❌ Error processing fallback image for ${category}:`, error);
        results.failed.push({ category, url, error: error.message });
      }
    }

    const summary = {
      total: Object.keys(this.fallbackImages).length,
      verified: results.verified.length,
      created: results.created.length,
      failed: results.failed.length,
      details: results
    };

    console.log('🖼️ Fallback image verification completed:', summary);
    return summary;
  }

  /**
   * Check if an image exists in S3
   */
  async checkImageExistsInS3(url) {
    try {
      // Extract S3 key from URL
      const s3Key = this.extractS3KeyFromUrl(url);
      if (!s3Key) return false;

      await s3Client.send(new HeadObjectCommand({
        Bucket: this.bucketName,
        Key: s3Key
      }));

      return true;
    } catch (error) {
      if (error.name === 'NotFound' || error.$metadata?.httpStatusCode === 404) {
        return false;
      }
      throw error;
    }
  }

  /**
   * Extract S3 key from full URL
   */
  extractS3KeyFromUrl(url) {
    if (!url || !url.includes(this.bucketName)) return null;

    const urlParts = url.split('/');
    const bucketIndex = urlParts.findIndex(part => part.includes(this.bucketName));

    if (bucketIndex === -1 || bucketIndex + 1 >= urlParts.length) return null;

    return urlParts.slice(bucketIndex + 1).join('/');
  }

  /**
   * Create a fallback image for a specific category
   */
  async createFallbackImage(category, targetUrl) {
    try {
      const s3Key = this.extractS3KeyFromUrl(targetUrl);
      if (!s3Key) {
        throw new Error(`Invalid S3 URL: ${targetUrl}`);
      }

      // Generate appropriate placeholder image based on category
      const imageBuffer = await this.generatePlaceholderImage(category);

      // Upload to S3
      const uploadParams = {
        Bucket: this.bucketName,
        Key: s3Key,
        Body: imageBuffer,
        ContentType: 'image/png',
        CacheControl: 'max-age=31536000', // Cache for 1 year
        Metadata: {
          'generated-by': 'MobileFallbackService',
          'category': category,
          'purpose': 'mobile-fallback',
          'created-at': new Date().toISOString()
        }
      };

      await s3Client.send(new PutObjectCommand(uploadParams));

      // Verify the uploaded image is accessible
      const isAccessible = await imageUrlValidator.validateImageUrl(targetUrl, 3000); // 3 second timeout

      if (!isAccessible) {
        throw new Error('Uploaded image is not accessible via HTTP');
      }

      return {
        success: true,
        category: category,
        url: targetUrl,
        s3Key: s3Key,
        size: imageBuffer.length
      };

    } catch (error) {
      console.error(`Failed to create fallback image for ${category}:`, error);
      return {
        success: false,
        category: category,
        error: error.message
      };
    }
  }

  /**
   * Generate a placeholder image for a specific category
   */
  async generatePlaceholderImage(category) {
    try {
      // For now, create a simple colored rectangle with text
      // In production, you'd want proper educational placeholder images

      const { width, height } = this.fallbackImageSpecs;

      // Category-specific colors and text
      const categoryConfig = this.getCategoryImageConfig(category);

      // Create SVG placeholder
      const svgText = this.generatePlaceholderSVG(categoryConfig, width, height);

      // Convert SVG to PNG using sharp (if available)
      let imageBuffer;
      try {
        // Try to use sharp for better image generation
        const sharp = require('sharp');
        imageBuffer = await sharp(Buffer.from(svgText))
          .png({ quality: this.fallbackImageSpecs.quality })
          .toBuffer();
      } catch (sharpError) {
        console.warn('Sharp not available, using basic SVG buffer:', sharpError.message);
        // Fallback to raw SVG (browsers can handle it)
        imageBuffer = Buffer.from(svgText);
      }

      return imageBuffer;

    } catch (error) {
      console.error(`Error generating placeholder image for ${category}:`, error);

      // Ultimate fallback: return a minimal PNG buffer
      return this.createMinimalPngBuffer();
    }
  }

  /**
   * Get category-specific image configuration
   */
  getCategoryImageConfig(category) {
    const configs = {
      'Word Recognition': {
        backgroundColor: '#4CAF50',
        textColor: '#FFFFFF',
        title: 'Word Recognition',
        subtitle: 'Practice Activity',
        icon: '📖'
      },
      'Alphabet Knowledge': {
        backgroundColor: '#2196F3',
        textColor: '#FFFFFF',
        title: 'Alphabet Knowledge',
        subtitle: 'Letter Learning',
        icon: '🔤'
      },
      'Phonological Awareness': {
        backgroundColor: '#FF9800',
        textColor: '#FFFFFF',
        title: 'Phonological Awareness',
        subtitle: 'Sound Practice',
        icon: '🔊'
      },
      'Decoding': {
        backgroundColor: '#9C27B0',
        textColor: '#FFFFFF',
        title: 'Decoding',
        subtitle: 'Word Building',
        icon: '🧩'
      },
      'Reading Comprehension': {
        backgroundColor: '#F44336',
        textColor: '#FFFFFF',
        title: 'Reading Comprehension',
        subtitle: 'Story Understanding',
        icon: '📚'
      },
      'mobile_loading': {
        backgroundColor: '#607D8B',
        textColor: '#FFFFFF',
        title: 'Loading...',
        subtitle: 'Please wait',
        icon: '⏳'
      },
      'mobile_error': {
        backgroundColor: '#F44336',
        textColor: '#FFFFFF',
        title: 'Image Error',
        subtitle: 'Tap to retry',
        icon: '⚠️'
      },
      'mobile_offline': {
        backgroundColor: '#9E9E9E',
        textColor: '#FFFFFF',
        title: 'Offline Mode',
        subtitle: 'Check connection',
        icon: '📱'
      },
      'default': {
        backgroundColor: '#795548',
        textColor: '#FFFFFF',
        title: 'Learning Activity',
        subtitle: 'Educational Content',
        icon: '🎓'
      }
    };

    return configs[category] || configs['default'];
  }

  /**
   * Generate SVG placeholder
   */
  generatePlaceholderSVG(config, width, height) {
    return `
      <svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">
        <rect width="100%" height="100%" fill="${config.backgroundColor}"/>
        <text x="50%" y="35%" dominant-baseline="middle" text-anchor="middle"
              font-family="Arial, sans-serif" font-size="48" fill="${config.textColor}">
          ${config.icon}
        </text>
        <text x="50%" y="55%" dominant-baseline="middle" text-anchor="middle"
              font-family="Arial, sans-serif" font-size="24" font-weight="bold" fill="${config.textColor}">
          ${config.title}
        </text>
        <text x="50%" y="70%" dominant-baseline="middle" text-anchor="middle"
              font-family="Arial, sans-serif" font-size="16" fill="${config.textColor}">
          ${config.subtitle}
        </text>
        <text x="50%" y="85%" dominant-baseline="middle" text-anchor="middle"
              font-family="Arial, sans-serif" font-size="12" fill="${config.textColor}" opacity="0.7">
          Literexia Learning Platform
        </text>
      </svg>
    `;
  }

  /**
   * Create minimal PNG buffer as ultimate fallback
   */
  createMinimalPngBuffer() {
    // Minimal 1x1 PNG in base64
    const base64Png = 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChAF0hKYlUwAAAABJRU5ErkJggg==';
    return Buffer.from(base64Png, 'base64');
  }

  /**
   * Get mobile-optimized fallback URL for any category
   */
  getMobileFallbackUrl(category) {
    const normalizedCategory = category || 'default';
    return this.fallbackImages[normalizedCategory] || this.fallbackImages['default'];
  }

  /**
   * Get all available fallback URLs for mobile app initialization
   */
  getAllFallbackUrls() {
    return {
      categories: Object.keys(this.fallbackImages).filter(key =>
        !key.startsWith('mobile_') && key !== 'default'
      ).reduce((acc, category) => {
        acc[category] = this.fallbackImages[category];
        return acc;
      }, {}),
      mobile: {
        loading: this.fallbackImages['mobile_loading'],
        error: this.fallbackImages['mobile_error'],
        offline: this.fallbackImages['mobile_offline']
      },
      default: this.fallbackImages['default']
    };
  }

  /**
   * Health check for all fallback images
   */
  async validateAllFallbackImages() {
    console.log('🏥 Running health check on all fallback images...');

    const results = {
      healthy: [],
      broken: [],
      total: 0
    };

    for (const [category, url] of Object.entries(this.fallbackImages)) {
      try {
        results.total++;
        const isValid = await imageUrlValidator.validateImageUrl(url, 5000);

        if (isValid) {
          results.healthy.push({ category, url, status: 'healthy' });
        } else {
          results.broken.push({ category, url, status: 'broken' });
        }
      } catch (error) {
        results.broken.push({ category, url, status: 'error', error: error.message });
      }
    }

    const healthRate = results.total > 0 ? (results.healthy.length / results.total * 100).toFixed(2) : 0;

    return {
      status: healthRate >= 90 ? 'HEALTHY' : healthRate >= 70 ? 'WARNING' : 'CRITICAL',
      healthRate: `${healthRate}%`,
      healthy: results.healthy.length,
      broken: results.broken.length,
      total: results.total,
      details: results
    };
  }
}

module.exports = new MobileFallbackService();