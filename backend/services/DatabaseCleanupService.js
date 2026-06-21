// services/DatabaseCleanupService.js
const mongoose = require('mongoose');
const InterventionAssessment = require('../models/Teachers/ManageProgress/interventionAssessmentModel');
const imageUrlValidator = require('../utils/imageUrlValidator');
const gcsStorage = require('../utils/gcsStorage'); // storage now on GCS

class DatabaseCleanupService {
  constructor() {
    this.processed = 0;
    this.fixed = 0;
    this.failed = 0;
    this.orphanedFiles = [];
    this.brokenUrls = [];
  }

  /**
   * Comprehensive database cleanup for intervention image URLs
   * Validates all image URLs and replaces broken ones with fallbacks
   */
  async cleanupInterventionImageUrls() {
    console.log('🧹 Starting comprehensive database cleanup for intervention image URLs...');

    try {
      // Find all intervention assessments with image URLs
      const interventions = await InterventionAssessment.find({
        'questions.questionImage': { $exists: true, $ne: null, $ne: '' }
      });

      console.log(`📊 Found ${interventions.length} interventions with image URLs to validate`);

      for (const intervention of interventions) {
        await this.cleanupInterventionImages(intervention);
      }

      const summary = {
        totalProcessed: this.processed,
        totalFixed: this.fixed,
        totalFailed: this.failed,
        orphanedFiles: this.orphanedFiles.length,
        brokenUrls: this.brokenUrls.length
      };

      console.log('✅ Database cleanup completed:', summary);
      return summary;

    } catch (error) {
      console.error('❌ Database cleanup failed:', error);
      throw error;
    }
  }

  /**
   * Clean up image URLs in a specific intervention assessment
   */
  async cleanupInterventionImages(intervention) {
    console.log(`🔍 Processing intervention ${intervention._id} for student ${intervention.studentId}`);

    let interventionModified = false;

    for (let questionIndex = 0; questionIndex < intervention.questions.length; questionIndex++) {
      const question = intervention.questions[questionIndex];

      if (question.questionImage) {
        this.processed++;
        console.log(`  📸 Validating image URL: ${question.questionImage}`);

        // Determine category for fallback
        const category = intervention.category || 'default';

        // Validate and get fallback if needed
        const validationResult = await imageUrlValidator.validateOrFallback(
          question.questionImage,
          category
        );

        if (!validationResult.isOriginal) {
          console.warn(`  ⚠️ Broken URL detected: ${question.questionImage}`);
          console.log(`  🔄 Replacing with fallback: ${validationResult.url}`);

          // Track broken URL
          this.brokenUrls.push({
            interventionId: intervention._id,
            studentId: intervention.studentId,
            questionIndex: questionIndex,
            originalUrl: question.questionImage,
            fallbackUrl: validationResult.url,
            category: category
          });

          // Update the question with fallback URL
          intervention.questions[questionIndex].questionImage = validationResult.url;
          intervention.questions[questionIndex].imageSource = 'fallback';
          intervention.questions[questionIndex].originalImageUrl = question.questionImage;
          intervention.questions[questionIndex].imageValidatedAt = new Date();

          interventionModified = true;
          this.fixed++;

          // Track orphaned file for cleanup
          this.trackOrphanedFile(question.questionImage);
        } else {
          console.log(`  ✅ Image URL valid: ${question.questionImage}`);
        }
      }
    }

    // Save intervention if modified
    if (interventionModified) {
      try {
        await intervention.save();
        console.log(`  💾 Updated intervention ${intervention._id} with ${this.fixed} fixes`);
      } catch (saveError) {
        console.error(`  ❌ Failed to save intervention ${intervention._id}:`, saveError);
        this.failed++;
      }
    }
  }

  /**
   * Track orphaned files for potential cleanup
   */
  trackOrphanedFile(url) {
    // Extract S3 key from URL
    if (url && url.includes('literexia-bucket.s3.')) {
      const urlParts = url.split('/');
      if (urlParts.length > 3) {
        const s3Key = urlParts.slice(3).join('/');
        this.orphanedFiles.push({
          url: url,
          s3Key: s3Key,
          trackedAt: new Date()
        });
      }
    }
  }

  /**
   * Clean up orphaned files from S3 (use with caution)
   */
  async cleanupOrphanedFiles(confirmCleanup = false) {
    if (!confirmCleanup) {
      console.log('🚨 Orphaned file cleanup requires confirmation. Set confirmCleanup=true to proceed.');
      return {
        message: 'Cleanup not performed - confirmation required',
        orphanedFiles: this.orphanedFiles
      };
    }

    console.log(`🗑️ Starting cleanup of ${this.orphanedFiles.length} orphaned files...`);
    let cleanedUp = 0;
    let cleanupFailed = 0;

    for (const orphanedFile of this.orphanedFiles) {
      try {
        console.log(`  🗑️ Deleting orphaned file: ${orphanedFile.s3Key}`);

        await gcsStorage.storage.bucket(gcsStorage.BUCKET).file(orphanedFile.s3Key).delete({ ignoreNotFound: true });

        cleanedUp++;
        console.log(`  ✅ Deleted: ${orphanedFile.s3Key}`);
      } catch (deleteError) {
        console.error(`  ❌ Failed to delete ${orphanedFile.s3Key}:`, deleteError);
        cleanupFailed++;
      }
    }

    return {
      totalOrphaned: this.orphanedFiles.length,
      cleanedUp: cleanedUp,
      failed: cleanupFailed
    };
  }

  /**
   * Generate comprehensive cleanup report
   */
  generateCleanupReport() {
    const report = {
      summary: {
        totalProcessed: this.processed,
        totalFixed: this.fixed,
        totalFailed: this.failed,
        successRate: this.processed > 0 ? ((this.processed - this.failed) / this.processed * 100).toFixed(2) + '%' : '0%'
      },
      brokenUrls: this.brokenUrls,
      orphanedFiles: this.orphanedFiles.map(file => ({
        url: file.url,
        s3Key: file.s3Key,
        size: file.size || 'unknown'
      })),
      recommendations: this.generateRecommendations()
    };

    return report;
  }

  /**
   * Generate recommendations based on cleanup results
   */
  generateRecommendations() {
    const recommendations = [];

    if (this.brokenUrls.length > 0) {
      recommendations.push({
        priority: 'HIGH',
        action: 'Monitor mobile app image loading',
        description: `${this.brokenUrls.length} broken URLs were replaced with fallbacks. Verify mobile app displays fallback images correctly.`
      });
    }

    if (this.orphanedFiles.length > 0) {
      recommendations.push({
        priority: 'MEDIUM',
        action: 'Clean up orphaned S3 files',
        description: `${this.orphanedFiles.length} orphaned files detected in S3. Consider cleanup to reduce storage costs.`
      });
    }

    if (this.failed > 0) {
      recommendations.push({
        priority: 'HIGH',
        action: 'Investigate failed updates',
        description: `${this.failed} interventions failed to update. Check database connection and permissions.`
      });
    }

    if (this.fixed === 0 && this.processed > 0) {
      recommendations.push({
        priority: 'LOW',
        action: 'System healthy',
        description: 'All image URLs are valid. Continue with regular monitoring.'
      });
    }

    return recommendations;
  }

  /**
   * Quick health check for intervention image URLs
   */
  async quickHealthCheck() {
    console.log('🏥 Running quick health check on intervention image URLs...');

    try {
      // Sample check - get 10 random interventions with images
      const sampleInterventions = await InterventionAssessment.aggregate([
        { $match: { 'questions.questionImage': { $exists: true, $ne: null, $ne: '' } } },
        { $sample: { size: 10 } }
      ]);

      let healthyUrls = 0;
      let brokenUrls = 0;

      for (const intervention of sampleInterventions) {
        for (const question of intervention.questions) {
          if (question.questionImage) {
            const isValid = await imageUrlValidator.validateImageUrl(question.questionImage);
            if (isValid) {
              healthyUrls++;
            } else {
              brokenUrls++;
            }
          }
        }
      }

      const totalChecked = healthyUrls + brokenUrls;
      const healthRate = totalChecked > 0 ? (healthyUrls / totalChecked * 100).toFixed(2) : 0;

      const healthCheck = {
        status: healthRate >= 80 ? 'HEALTHY' : healthRate >= 60 ? 'WARNING' : 'CRITICAL',
        healthRate: `${healthRate}%`,
        healthyUrls: healthyUrls,
        brokenUrls: brokenUrls,
        totalChecked: totalChecked,
        recommendation: healthRate < 80 ? 'Run full cleanup' : 'Continue monitoring'
      };

      console.log('🏥 Health check completed:', healthCheck);
      return healthCheck;

    } catch (error) {
      console.error('❌ Health check failed:', error);
      return {
        status: 'ERROR',
        error: error.message,
        recommendation: 'Check database connection and retry'
      };
    }
  }
}

module.exports = new DatabaseCleanupService();