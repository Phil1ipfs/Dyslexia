// controllers/DatabaseCleanupController.js
const DatabaseCleanupService = require('../services/DatabaseCleanupService');
const imageUrlValidator = require('../utils/imageUrlValidator');

class DatabaseCleanupController {
  /**
   * Run comprehensive database cleanup for intervention image URLs
   */
  async runCleanup(req, res) {
    try {
      console.log('🧹 [CLEANUP CONTROLLER] Starting comprehensive database cleanup...');

      const cleanupResults = await DatabaseCleanupService.cleanupInterventionImageUrls();
      const report = DatabaseCleanupService.generateCleanupReport();

      return res.status(200).json({
        success: true,
        message: 'Database cleanup completed successfully',
        results: cleanupResults,
        report: report,
        timestamp: new Date().toISOString()
      });

    } catch (error) {
      console.error('❌ [CLEANUP CONTROLLER] Database cleanup failed:', error);
      return res.status(500).json({
        success: false,
        message: 'Database cleanup failed',
        error: error.message,
        timestamp: new Date().toISOString()
      });
    }
  }

  /**
   * Run quick health check on intervention image URLs
   */
  async healthCheck(req, res) {
    try {
      console.log('🏥 [CLEANUP CONTROLLER] Running health check...');

      const healthCheck = await DatabaseCleanupService.quickHealthCheck();

      return res.status(200).json({
        success: true,
        message: 'Health check completed',
        healthCheck: healthCheck,
        timestamp: new Date().toISOString()
      });

    } catch (error) {
      console.error('❌ [CLEANUP CONTROLLER] Health check failed:', error);
      return res.status(500).json({
        success: false,
        message: 'Health check failed',
        error: error.message,
        timestamp: new Date().toISOString()
      });
    }
  }

  /**
   * Clean up orphaned files from S3
   */
  async cleanupOrphanedFiles(req, res) {
    try {
      const { confirm } = req.body;

      if (!confirm) {
        return res.status(400).json({
          success: false,
          message: 'Orphaned file cleanup requires confirmation',
          required: 'Set confirm=true in request body to proceed',
          warning: 'This action will permanently delete files from S3'
        });
      }

      console.log('🗑️ [CLEANUP CONTROLLER] Starting orphaned file cleanup...');

      const cleanupResults = await DatabaseCleanupService.cleanupOrphanedFiles(true);

      return res.status(200).json({
        success: true,
        message: 'Orphaned file cleanup completed',
        results: cleanupResults,
        timestamp: new Date().toISOString()
      });

    } catch (error) {
      console.error('❌ [CLEANUP CONTROLLER] Orphaned file cleanup failed:', error);
      return res.status(500).json({
        success: false,
        message: 'Orphaned file cleanup failed',
        error: error.message,
        timestamp: new Date().toISOString()
      });
    }
  }

  /**
   * Validate a specific image URL
   */
  async validateImageUrl(req, res) {
    try {
      const { url, category } = req.body;

      if (!url) {
        return res.status(400).json({
          success: false,
          message: 'URL is required',
          example: { url: 'https://example.com/image.jpg', category: 'Phonological Awareness' }
        });
      }

      console.log(`🔍 [CLEANUP CONTROLLER] Validating URL: ${url}`);

      const validationResult = await imageUrlValidator.validateOrFallback(url, category || 'default');

      return res.status(200).json({
        success: true,
        message: 'URL validation completed',
        validation: validationResult,
        timestamp: new Date().toISOString()
      });

    } catch (error) {
      console.error('❌ [CLEANUP CONTROLLER] URL validation failed:', error);
      return res.status(500).json({
        success: false,
        message: 'URL validation failed',
        error: error.message,
        timestamp: new Date().toISOString()
      });
    }
  }

  /**
   * Get image URL validator cache statistics
   */
  async getCacheStats(req, res) {
    try {
      console.log('📊 [CLEANUP CONTROLLER] Getting cache statistics...');

      const cacheStats = imageUrlValidator.getCacheStats();

      return res.status(200).json({
        success: true,
        message: 'Cache statistics retrieved',
        cacheStats: cacheStats,
        timestamp: new Date().toISOString()
      });

    } catch (error) {
      console.error('❌ [CLEANUP CONTROLLER] Failed to get cache stats:', error);
      return res.status(500).json({
        success: false,
        message: 'Failed to get cache statistics',
        error: error.message,
        timestamp: new Date().toISOString()
      });
    }
  }

  /**
   * Clear image URL validator cache
   */
  async clearCache(req, res) {
    try {
      console.log('🗑️ [CLEANUP CONTROLLER] Clearing image URL validation cache...');

      imageUrlValidator.clearCache();

      return res.status(200).json({
        success: true,
        message: 'Cache cleared successfully',
        timestamp: new Date().toISOString()
      });

    } catch (error) {
      console.error('❌ [CLEANUP CONTROLLER] Failed to clear cache:', error);
      return res.status(500).json({
        success: false,
        message: 'Failed to clear cache',
        error: error.message,
        timestamp: new Date().toISOString()
      });
    }
  }

  /**
   * Get comprehensive system status for S3 and image management
   */
  async getSystemStatus(req, res) {
    try {
      console.log('📊 [CLEANUP CONTROLLER] Getting comprehensive system status...');

      // Run health check
      const healthCheck = await DatabaseCleanupService.quickHealthCheck();

      // Get cache stats
      const cacheStats = imageUrlValidator.getCacheStats();

      // Test S3 connectivity by validating a known image
      const s3ConnectivityTest = await imageUrlValidator.validateImageUrl(
        'https://literexia-bucket.s3.ap-southeast-2.amazonaws.com/defaults/question-placeholder.png'
      );

      const systemStatus = {
        overall: healthCheck.status === 'HEALTHY' && s3ConnectivityTest ? 'HEALTHY' : 'WARNING',
        components: {
          database: {
            status: 'HEALTHY',
            description: 'Database connection active'
          },
          s3Storage: {
            status: s3ConnectivityTest ? 'HEALTHY' : 'WARNING',
            description: s3ConnectivityTest ? 'S3 connectivity verified' : 'S3 connectivity issues detected'
          },
          imageValidation: {
            status: 'HEALTHY',
            description: 'Image validation service operational',
            cacheStats: cacheStats
          },
          interventionImages: {
            status: healthCheck.status,
            healthRate: healthCheck.healthRate,
            description: `${healthCheck.healthyUrls}/${healthCheck.totalChecked} URLs healthy`,
            recommendation: healthCheck.recommendation
          }
        },
        lastChecked: new Date().toISOString()
      };

      return res.status(200).json({
        success: true,
        message: 'System status retrieved successfully',
        systemStatus: systemStatus,
        timestamp: new Date().toISOString()
      });

    } catch (error) {
      console.error('❌ [CLEANUP CONTROLLER] Failed to get system status:', error);
      return res.status(500).json({
        success: false,
        message: 'Failed to get system status',
        error: error.message,
        systemStatus: {
          overall: 'ERROR',
          error: error.message
        },
        timestamp: new Date().toISOString()
      });
    }
  }

  /**
   * Check for duplicate prescriptive analysis records for a specific student
   */
  async checkPrescriptiveDuplicates(req, res) {
    try {
      const { studentId } = req.params;
      console.log(`🔍 [CLEANUP CONTROLLER] Checking prescriptive analysis duplicates for student ${studentId}...`);

      const mongoose = require('mongoose');
      const testDb = mongoose.connection.useDb('test');
      const prescriptiveCollection = testDb.collection('prescriptive_analysis');

      // Find all records for this student
      const records = await prescriptiveCollection.find({
        studentId: parseInt(studentId)
      }).toArray();

      // Find duplicates (records with same studentId and categoryId = null)
      const duplicates = records.filter(record => record.categoryId === null);
      const validRecords = records.filter(record => record.categoryId !== null);

      console.log(`[CLEANUP CONTROLLER] Found ${records.length} total records, ${duplicates.length} duplicates, ${validRecords.length} valid`);

      return res.status(200).json({
        success: true,
        message: `Duplicate check completed for student ${studentId}`,
        data: {
          studentId: parseInt(studentId),
          totalRecords: records.length,
          duplicateRecords: duplicates.length,
          validRecords: validRecords.length,
          duplicates: duplicates.map(d => ({
            _id: d._id,
            categoryId: d.categoryId,
            readingLevel: d.readingLevel,
            createdAt: d.createdAt
          })),
          blockingNewAnalysis: duplicates.length > 0
        },
        timestamp: new Date().toISOString()
      });

    } catch (error) {
      console.error('❌ [CLEANUP CONTROLLER] Failed to check prescriptive duplicates:', error);
      return res.status(500).json({
        success: false,
        message: 'Failed to check prescriptive analysis duplicates',
        error: error.message,
        timestamp: new Date().toISOString()
      });
    }
  }

  /**
   * Remove duplicate prescriptive analysis records that block new analysis generation
   */
  async removePrescriptiveDuplicates(req, res) {
    try {
      const { studentId, confirm } = req.body;
      console.log(`🗑️ [CLEANUP CONTROLLER] Removing prescriptive analysis duplicates...`);

      const mongoose = require('mongoose');
      const testDb = mongoose.connection.useDb('test');
      const prescriptiveCollection = testDb.collection('prescriptive_analysis');

      let deletionResults = [];

      if (studentId) {
        // Remove duplicates for specific student
        console.log(`[CLEANUP CONTROLLER] Targeting student ${studentId} for duplicate removal`);

        const duplicates = await prescriptiveCollection.find({
          studentId: parseInt(studentId),
          categoryId: null
        }).toArray();

        if (duplicates.length > 0) {
          const deleteResult = await prescriptiveCollection.deleteMany({
            studentId: parseInt(studentId),
            categoryId: null
          });

          deletionResults.push({
            studentId: parseInt(studentId),
            duplicatesFound: duplicates.length,
            duplicatesRemoved: deleteResult.deletedCount,
            removedIds: duplicates.map(d => d._id)
          });

          console.log(`[CLEANUP CONTROLLER] ✅ Removed ${deleteResult.deletedCount} duplicate records for student ${studentId}`);
        } else {
          console.log(`[CLEANUP CONTROLLER] ℹ️ No duplicate records found for student ${studentId}`);
          deletionResults.push({
            studentId: parseInt(studentId),
            duplicatesFound: 0,
            duplicatesRemoved: 0,
            message: 'No duplicates found'
          });
        }

      } else if (confirm === 'all') {
        // Remove all duplicates across all students
        console.log(`[CLEANUP CONTROLLER] Removing ALL prescriptive analysis duplicates`);

        const allDuplicates = await prescriptiveCollection.find({
          categoryId: null
        }).toArray();

        if (allDuplicates.length > 0) {
          const deleteResult = await prescriptiveCollection.deleteMany({
            categoryId: null
          });

          // Group by student for reporting
          const byStudent = {};
          allDuplicates.forEach(duplicate => {
            if (!byStudent[duplicate.studentId]) {
              byStudent[duplicate.studentId] = [];
            }
            byStudent[duplicate.studentId].push(duplicate._id);
          });

          Object.keys(byStudent).forEach(studentId => {
            deletionResults.push({
              studentId: parseInt(studentId),
              duplicatesFound: byStudent[studentId].length,
              duplicatesRemoved: byStudent[studentId].length,
              removedIds: byStudent[studentId]
            });
          });

          console.log(`[CLEANUP CONTROLLER] ✅ Removed ${deleteResult.deletedCount} total duplicate records across all students`);
        } else {
          console.log(`[CLEANUP CONTROLLER] ℹ️ No duplicate records found in database`);
          deletionResults.push({
            message: 'No duplicates found across all students'
          });
        }
      } else {
        return res.status(400).json({
          success: false,
          message: 'Invalid request - provide studentId or confirm="all"',
          examples: [
            { studentId: 202533333 },
            { confirm: 'all' }
          ]
        });
      }

      return res.status(200).json({
        success: true,
        message: 'Prescriptive analysis duplicate cleanup completed',
        results: deletionResults,
        timestamp: new Date().toISOString()
      });

    } catch (error) {
      console.error('❌ [CLEANUP CONTROLLER] Failed to remove prescriptive duplicates:', error);
      return res.status(500).json({
        success: false,
        message: 'Failed to remove prescriptive analysis duplicates',
        error: error.message,
        timestamp: new Date().toISOString()
      });
    }
  }
}

module.exports = new DatabaseCleanupController();