const User = require('../../models/userModel');
const CategoryResultsService = require('./CategoryResultsService');

/**
 * Auto Processing Service
 * Automatically processes complete assessments without requiring API calls
 * Should be run periodically to catch any missed complete assessments
 */
class AutoProcessingService {

  /**
   * Auto-process all students with complete assessments
   * This should be called periodically (e.g., every 5 minutes) to catch complete assessments
   */
  static async processAllCompleteAssessments() {
    try {
      console.log('[AUTO PROCESSOR] 🔍 Scanning for students with complete assessments...');

      // Get all students who have completed pre-assessment and have reading levels
      const students = await User.find({
        preAssessmentCompleted: true,
        readingLevel: { $ne: null, $exists: true }
      });

      console.log(`[AUTO PROCESSOR] Found ${students.length} students with reading levels assigned`);

      let processedCount = 0;
      let skippedCount = 0;
      let incompleteCount = 0;

      for (const student of students) {
        try {
          const result = await this.processStudentIfComplete(student.idNumber, student.readingLevel, student.firstName, student.lastName);

          if (result.action === 'processed') {
            processedCount++;
          } else if (result.action === 'skipped') {
            skippedCount++;
          } else if (result.action === 'incomplete') {
            incompleteCount++;
          }

        } catch (error) {
          console.error(`[AUTO PROCESSOR] ❌ Error processing student ${student.idNumber}: ${error.message}`);
        }
      }

      console.log(`[AUTO PROCESSOR] 🏁 Batch processing complete:`);
      console.log(`[AUTO PROCESSOR]    ✅ Processed: ${processedCount}`);
      console.log(`[AUTO PROCESSOR]    ⏭️  Skipped (already done): ${skippedCount}`);
      console.log(`[AUTO PROCESSOR]    ⚠️  Incomplete: ${incompleteCount}`);

      return {
        total: students.length,
        processed: processedCount,
        skipped: skippedCount,
        incomplete: incompleteCount
      };

    } catch (error) {
      console.error('[AUTO PROCESSOR] ❌ Error in batch processing:', error.message);
      throw error;
    }
  }

  /**
   * Process a single student if their assessment is complete
   */
  static async processStudentIfComplete(studentId, readingLevel, firstName = '', lastName = '') {
    try {
      console.log(`[AUTO PROCESSOR] 📋 Checking student: ${firstName} ${lastName} (${studentId}) - ${readingLevel}`);

      // Check if category_results already exist
      const CategoryResult = require('../../models/Teachers/ManageProgress/categoryResultModel');
      const existingResults = await CategoryResult.findOne({
        studentId: parseInt(studentId)
      });

      if (existingResults) {
        console.log(`[AUTO PROCESSOR]    ⏭️  Category results already exist - skipping`);
        return { action: 'skipped', reason: 'already_processed' };
      }

      // Validate assessment completeness
      console.log(`[AUTO PROCESSOR]    🔍 Checking assessment completeness...`);
      const completenessValidation = await CategoryResultsService.validateAssessmentCompleteness(
        studentId,
        readingLevel
      );

      if (completenessValidation.isComplete) {
        console.log(`[AUTO PROCESSOR]    ✅ Assessment COMPLETE - auto-generating category results...`);

        // Generate category results automatically
        const categoryResults = await CategoryResultsService.generateCategoryResultsFromResponses(
          studentId
        );

        console.log(`[AUTO PROCESSOR]    🎉 SUCCESS - Category results created: ${categoryResults._id}`);

        if (categoryResults.prescriptiveAnalysisId) {
          console.log(`[AUTO PROCESSOR]    🧠 Prescriptive analysis created: ${categoryResults.prescriptiveAnalysisId}`);
        }

        return {
          action: 'processed',
          categoryResultId: categoryResults._id,
          prescriptiveAnalysisId: categoryResults.prescriptiveAnalysisId
        };

      } else {
        console.log(`[AUTO PROCESSOR]    ⚠️  Assessment INCOMPLETE - not processing yet`);

        // Log incomplete details
        for (const [category, status] of Object.entries(completenessValidation.categoryResults)) {
          if (!status.isComplete) {
            console.log(`[AUTO PROCESSOR]       ${category}: ${status.answered}/${status.required} questions (${status.missing} missing)`);
          }
        }

        return {
          action: 'incomplete',
          missing: completenessValidation.categoryResults
        };
      }

    } catch (error) {
      console.error(`[AUTO PROCESSOR] ❌ Error processing student ${studentId}: ${error.message}`);
      throw error;
    }
  }

  /**
   * Process a specific student (useful for testing or manual triggers)
   */
  static async processSpecificStudent(studentId) {
    try {
      const student = await User.findOne({ idNumber: parseInt(studentId) });

      if (!student) {
        throw new Error(`Student ${studentId} not found`);
      }

      if (!student.preAssessmentCompleted || !student.readingLevel) {
        throw new Error(`Student ${studentId} has not completed pre-assessment or has no reading level`);
      }

      return await this.processStudentIfComplete(
        student.idNumber,
        student.readingLevel,
        student.firstName,
        student.lastName
      );

    } catch (error) {
      console.error(`[AUTO PROCESSOR] Error processing specific student ${studentId}:`, error.message);
      throw error;
    }
  }

  /**
   * Start periodic auto-processing (call this from server.js)
   */
  static startPeriodicProcessing(intervalMinutes = 5) {
    console.log(`[AUTO PROCESSOR] 🚀 Starting periodic auto-processing every ${intervalMinutes} minutes`);

    // Run immediately on startup
    this.processAllCompleteAssessments().catch(error => {
      console.error('[AUTO PROCESSOR] Error in initial processing:', error.message);
    });

    // Then run periodically
    const intervalMs = intervalMinutes * 60 * 1000;
    setInterval(() => {
      this.processAllCompleteAssessments().catch(error => {
        console.error('[AUTO PROCESSOR] Error in periodic processing:', error.message);
      });
    }, intervalMs);
  }

  /**
   * Get processing status for monitoring
   */
  static async getProcessingStatus() {
    try {
      const CategoryResult = require('../../models/Teachers/ManageProgress/categoryResultModel');
      const PrescriptiveAnalysis = require('../../models/Teachers/ManageProgress/prescriptiveAnalysisModel');

      const totalStudents = await User.countDocuments({
        preAssessmentCompleted: true,
        readingLevel: { $ne: null, $exists: true }
      });

      const processedStudents = await CategoryResult.distinct('studentId').then(ids => ids.length);
      const analysisCount = await PrescriptiveAnalysis.countDocuments();

      return {
        totalStudentsWithReadingLevels: totalStudents,
        studentsWithCategoryResults: processedStudents,
        prescriptiveAnalysisCount: analysisCount,
        pendingProcessing: totalStudents - processedStudents
      };

    } catch (error) {
      console.error('[AUTO PROCESSOR] Error getting processing status:', error.message);
      throw error;
    }
  }
}

module.exports = AutoProcessingService;