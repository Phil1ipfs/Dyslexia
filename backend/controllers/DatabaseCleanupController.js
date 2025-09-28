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
   * Remove ONLY problematic duplicate prescriptive analysis records (categoryId: null)
   * that block new analysis generation - PRESERVES VALID STUDENT PROGRESS RECORDS
   */
  async removePrescriptiveDuplicates(req, res) {
    try {
      const { studentId, confirm } = req.body;
      console.log(`🗑️ [CLEANUP CONTROLLER] 🛡️  SAFELY removing ONLY duplicate prescriptive analysis records...`);
      console.log(`🛡️  [SAFETY] This will ONLY remove records with categoryId: null (invalid duplicates)`);
      console.log(`🛡️  [SAFETY] Valid student progress records will be PRESERVED`);

      const mongoose = require('mongoose');
      const testDb = mongoose.connection.useDb('test');
      const prescriptiveCollection = testDb.collection('prescriptive_analysis');

      // 🛡️ SAFETY CHECK: Count total valid records before cleanup
      const totalRecords = await prescriptiveCollection.countDocuments({});
      const validRecords = await prescriptiveCollection.countDocuments({
        categoryId: { $ne: null }
      });
      const duplicateRecords = await prescriptiveCollection.countDocuments({
        categoryId: null
      });

      console.log(`🛡️  [SAFETY AUDIT] Total records: ${totalRecords}, Valid records: ${validRecords}, Duplicate records: ${duplicateRecords}`);

      let deletionResults = [];

      if (studentId) {
        // 🛡️ SAFETY: Remove ONLY problematic duplicates for specific student
        console.log(`🛡️  [SAFETY] Targeting student ${studentId} for duplicate removal - ONLY categoryId: null records`);

        // Check student's valid records first
        const validStudentRecords = await prescriptiveCollection.find({
          studentId: parseInt(studentId),
          categoryId: { $ne: null }
        }).toArray();

        const duplicates = await prescriptiveCollection.find({
          studentId: parseInt(studentId),
          categoryId: null
        }).toArray();

        console.log(`🛡️  [SAFETY] Student ${studentId}: ${validStudentRecords.length} valid records, ${duplicates.length} duplicates to remove`);

        if (duplicates.length > 0) {
          const deleteResult = await prescriptiveCollection.deleteMany({
            studentId: parseInt(studentId),
            categoryId: null  // 🛡️ SAFETY: ONLY remove null categoryId records
          });

          deletionResults.push({
            studentId: parseInt(studentId),
            validRecordsPreserved: validStudentRecords.length,
            duplicatesFound: duplicates.length,
            duplicatesRemoved: deleteResult.deletedCount,
            removedIds: duplicates.map(d => d._id),
            safetyCheck: `Preserved ${validStudentRecords.length} valid records`
          });

          console.log(`🛡️  [SAFETY] ✅ Student ${studentId}: Removed ${deleteResult.deletedCount} duplicates, PRESERVED ${validStudentRecords.length} valid records`);
        } else {
          console.log(`🛡️  [SAFETY] ℹ️ Student ${studentId}: No duplicate records found, ${validStudentRecords.length} valid records preserved`);
          deletionResults.push({
            studentId: parseInt(studentId),
            validRecordsPreserved: validStudentRecords.length,
            duplicatesFound: 0,
            duplicatesRemoved: 0,
            message: 'No duplicates found, all valid records preserved'
          });
        }

      } else if (confirm === 'all') {
        // 🛡️ SAFETY: Remove ALL problematic duplicates while preserving valid records
        console.log(`🛡️  [SAFETY] Removing ALL duplicate prescriptive analysis records - ONLY categoryId: null`);

        const allDuplicates = await prescriptiveCollection.find({
          categoryId: null
        }).toArray();

        // 🛡️ SAFETY CHECK: Verify we're not touching valid records
        const validRecordsBeforeCleanup = await prescriptiveCollection.countDocuments({
          categoryId: { $ne: null }
        });

        if (allDuplicates.length > 0) {
          const deleteResult = await prescriptiveCollection.deleteMany({
            categoryId: null  // 🛡️ SAFETY: ONLY remove null categoryId records
          });

          // 🛡️ SAFETY VERIFICATION: Check valid records are preserved
          const validRecordsAfterCleanup = await prescriptiveCollection.countDocuments({
            categoryId: { $ne: null }
          });

          console.log(`🛡️  [SAFETY VERIFICATION] Valid records before: ${validRecordsBeforeCleanup}, after: ${validRecordsAfterCleanup}`);

          if (validRecordsBeforeCleanup !== validRecordsAfterCleanup) {
            throw new Error(`🚨 SAFETY VIOLATION: Valid records changed! Before: ${validRecordsBeforeCleanup}, After: ${validRecordsAfterCleanup}`);
          }

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
              removedIds: byStudent[studentId],
              safetyVerified: true
            });
          });

          console.log(`🛡️  [SAFETY] ✅ Removed ${deleteResult.deletedCount} duplicate records, PRESERVED ${validRecordsAfterCleanup} valid records`);
        } else {
          console.log(`🛡️  [SAFETY] ℹ️ No duplicate records found, ${validRecordsBeforeCleanup} valid records preserved`);
          deletionResults.push({
            message: 'No duplicates found across all students',
            validRecordsPreserved: validRecordsBeforeCleanup,
            safetyVerified: true
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

  /**
   * Restore accidentally deleted historical prescriptive analysis records
   */
  async restoreHistoricalAnalysis(req, res) {
    try {
      const { studentId, historicalData } = req.body;
      console.log(`🔄 [CLEANUP CONTROLLER] Restoring historical prescriptive analysis for student ${studentId}...`);

      if (!studentId || !historicalData) {
        return res.status(400).json({
          success: false,
          message: 'Missing required fields: studentId and historicalData',
          example: {
            studentId: 202533333,
            historicalData: { readingLevel: "High Emerging", /* full record */ }
          }
        });
      }

      const mongoose = require('mongoose');
      const testDb = mongoose.connection.useDb('test');
      const prescriptiveCollection = testDb.collection('prescriptive_analysis');

      // Check if historical record already exists
      const existingRecord = await prescriptiveCollection.findOne({
        studentId: parseInt(studentId),
        readingLevel: historicalData.readingLevel
      });

      if (existingRecord) {
        return res.status(409).json({
          success: false,
          message: `Historical record already exists for student ${studentId} at ${historicalData.readingLevel} level`,
          data: {
            existingRecordId: existingRecord._id,
            readingLevel: existingRecord.readingLevel,
            createdAt: existingRecord.createdAt
          }
        });
      }

      // Prepare the historical record for restoration
      const historicalRecord = {
        ...historicalData,
        studentId: parseInt(studentId),
        restoredAt: new Date(),
        restorationReason: 'Accidentally deleted during duplicate cleanup - restored for historical continuity'
      };

      // Remove the original _id to let MongoDB generate a new one
      delete historicalRecord._id;

      // ✅ FIX: Set categoryId to a unique historical marker to avoid duplicate key conflicts
      // This allows both historical and current prescriptive analysis to coexist
      historicalRecord.categoryId = new mongoose.Types.ObjectId('000000000000000000000001'); // Historical marker

      // Convert nested $oid and $date objects to proper types
      if (historicalRecord.categoryResultId && historicalRecord.categoryResultId.$oid) {
        historicalRecord.categoryResultId = new mongoose.Types.ObjectId(historicalRecord.categoryResultId.$oid);
      }

      if (historicalRecord.assessmentDate && historicalRecord.assessmentDate.$date) {
        historicalRecord.assessmentDate = new Date(historicalRecord.assessmentDate.$date);
      }

      if (historicalRecord.createdAt && historicalRecord.createdAt.$date) {
        historicalRecord.createdAt = new Date(historicalRecord.createdAt.$date);
      }

      if (historicalRecord.updatedAt && historicalRecord.updatedAt.$date) {
        historicalRecord.updatedAt = new Date(historicalRecord.updatedAt.$date);
      }

      // Recursively convert all nested $date objects
      const convertDates = (obj) => {
        if (Array.isArray(obj)) {
          return obj.map(convertDates);
        } else if (obj && typeof obj === 'object') {
          const converted = {};
          for (const [key, value] of Object.entries(obj)) {
            if (value && typeof value === 'object' && value.$date) {
              converted[key] = new Date(value.$date);
            } else if (value && typeof value === 'object' && value.$oid) {
              converted[key] = new mongoose.Types.ObjectId(value.$oid);
            } else if (value && typeof value === 'object') {
              converted[key] = convertDates(value);
            } else {
              converted[key] = value;
            }
          }
          return converted;
        }
        return obj;
      };

      const cleanedRecord = convertDates(historicalRecord);

      // Insert the restored record
      const insertResult = await prescriptiveCollection.insertOne(cleanedRecord);

      console.log(`[CLEANUP CONTROLLER] ✅ Restored historical analysis record for student ${studentId} at ${historicalData.readingLevel} level`);

      return res.status(200).json({
        success: true,
        message: `Historical prescriptive analysis restored successfully for student ${studentId}`,
        data: {
          studentId: parseInt(studentId),
          readingLevel: historicalData.readingLevel,
          restoredRecordId: insertResult.insertedId,
          originalAssessmentDate: historicalData.assessmentDate,
          restoredAt: new Date()
        },
        timestamp: new Date().toISOString()
      });

    } catch (error) {
      console.error('❌ [CLEANUP CONTROLLER] Failed to restore historical analysis:', error);
      return res.status(500).json({
        success: false,
        message: 'Failed to restore historical prescriptive analysis',
        error: error.message,
        timestamp: new Date().toISOString()
      });
    }
  }
}

module.exports = new DatabaseCleanupController();