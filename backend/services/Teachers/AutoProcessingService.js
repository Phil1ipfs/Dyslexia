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
   * Process a single student using CATEGORY-BY-CATEGORY approach (CLAUDE.md sequential flow)
   * This follows the prerequisite-based sequential assessment system
   */
  static async processStudentIfComplete(studentId, readingLevel, firstName = '', lastName = '') {
    try {
      console.log(`[AUTO PROCESSOR] 📋 Checking student: ${firstName} ${lastName} (${studentId}) - ${readingLevel}`);

      // Get categories for this reading level in prerequisite order
      const categoriesForLevel = this.getCategoriesForReadingLevel(readingLevel);
      console.log(`[AUTO PROCESSOR]    📚 Categories for ${readingLevel}: [${categoriesForLevel.join(', ')}]`);

      let processedCount = 0;
      let blockedCount = 0;
      let results = [];

      // Process each category sequentially (prerequisite order)
      for (let i = 0; i < categoriesForLevel.length; i++) {
        const category = categoriesForLevel[i];
        console.log(`[AUTO PROCESSOR]    🔍 Processing category ${i + 1}/${categoriesForLevel.length}: ${category}`);

        try {
          const result = await this.processIndividualCategory(studentId, category, readingLevel, categoriesForLevel.slice(0, i));
          results.push(result);

          if (result.action === 'processed') {
            processedCount++;
            console.log(`[AUTO PROCESSOR]    ✅ ${category}: PROCESSED`);
          } else if (result.action === 'blocked') {
            blockedCount++;
            console.log(`[AUTO PROCESSOR]    🚫 ${category}: BLOCKED (prerequisite failed)`);
            // Stop processing subsequent categories if this one is blocked
            break;
          } else if (result.action === 'incomplete') {
            console.log(`[AUTO PROCESSOR]    ⏳ ${category}: INCOMPLETE (waiting for responses)`);
            // Stop processing if current category is incomplete
            break;
          } else if (result.action === 'skipped') {
            console.log(`[AUTO PROCESSOR]    ⏭️  ${category}: SKIPPED (already processed)`);
          }

        } catch (error) {
          console.error(`[AUTO PROCESSOR]    ❌ Error processing ${category}: ${error.message}`);
          break;
        }
      }

      console.log(`[AUTO PROCESSOR]    📊 Summary: ${processedCount} processed, ${blockedCount} blocked`);

      return {
        action: processedCount > 0 ? 'processed' : (blockedCount > 0 ? 'blocked' : 'incomplete'),
        processedCategories: processedCount,
        blockedCategories: blockedCount,
        results: results
      };

    } catch (error) {
      console.error(`[AUTO PROCESSOR] ❌ Error processing student ${studentId}: ${error.message}`);
      throw error;
    }
  }

  /**
   * Process an individual category for a student (CLAUDE.md sequential approach)
   */
  static async processIndividualCategory(studentId, category, readingLevel, prerequisiteCategories) {
    try {
      const CategoryResult = require('../../models/Teachers/ManageProgress/categoryResultModel');

      // Check if this category already has results
      const existingCategoryResult = await CategoryResult.findOne({
        studentId: parseInt(studentId),
        'categories.categoryName': category
      });

      if (existingCategoryResult) {
        const categoryData = existingCategoryResult.categories.find(cat => cat.categoryName === category);

        // DEBUG: Log what we're actually seeing for PA
        if (category === 'Phonological Awareness') {
          console.log(`[AUTO PROCESSOR] 🔍 DEBUG PA: categoryData found: ${!!categoryData}`);
          if (categoryData) {
            console.log(`[AUTO PROCESSOR] 🔍 DEBUG PA: isCompleted: ${categoryData.isCompleted}, score: ${categoryData.score}, isPassed: ${categoryData.isPassed}`);
          }
        }

        if (categoryData && categoryData.isCompleted) {
          // ✅ ENHANCED CHECK: Also verify prescriptive analysis includes this category
          const PrescriptiveAnalysis = require('../../models/Teachers/ManageProgress/prescriptiveAnalysisModel');
          const existingAnalysis = await PrescriptiveAnalysis.findOne({
            studentId: parseInt(studentId),
            'skillMastery': { $exists: true }
          }).sort({ createdAt: -1 });

          if (existingAnalysis && existingAnalysis.skillMastery && existingAnalysis.skillMastery[category]) {
            const categoryAnalysis = existingAnalysis.skillMastery[category];
            // Check if prescriptive analysis has actual data for this category (not just empty defaults)
            const hasRealData = categoryAnalysis.totalQuestions > 0 || categoryAnalysis.responseHistory.length > 0;

            if (hasRealData) {
              console.log(`[AUTO PROCESSOR] ✅ ${category}: VERIFIED - Category complete AND has prescriptive analysis`);
              return {
                action: 'skipped',
                category: category,
                reason: 'already_processed',
                score: categoryData.score,
                passed: categoryData.isPassed
              };
            } else {
              console.log(`[AUTO PROCESSOR] ⚠️  ${category}: INCOMPLETE ANALYSIS - Category complete but prescriptive analysis has no data, regenerating...`);
            }
          } else {
            console.log(`[AUTO PROCESSOR] ⚠️  ${category}: NO ANALYSIS FOUND - Category complete but no prescriptive analysis exists, generating...`);
          }
        }
      }

      // Check prerequisites (CLAUDE.md prerequisite blocking)
      if (prerequisiteCategories.length > 0) {
        console.log(`[AUTO PROCESSOR] 🔍 Checking prerequisites for ${category}: [${prerequisiteCategories.join(', ')}]`);

        for (const prereq of prerequisiteCategories) {
          const prereqResult = await CategoryResult.findOne({
            studentId: parseInt(studentId),
            'categories.categoryName': prereq
          });

          if (!prereqResult) {
            console.log(`[AUTO PROCESSOR] ❌ ${prereq}: No category result found for prerequisite`);
            return {
              action: 'blocked',
              category: category,
              reason: 'prerequisite_not_completed',
              blockingCategory: prereq
            };
          }

          const prereqData = prereqResult.categories.find(cat => cat.categoryName === prereq);
          if (!prereqData) {
            console.log(`[AUTO PROCESSOR] ❌ ${prereq}: No category data found in result`);
            return {
              action: 'blocked',
              category: category,
              reason: 'prerequisite_not_completed',
              blockingCategory: prereq
            };
          }

          // ✅ ENHANCED PREREQUISITE CHECK: Consider intervention scores
          let effectivePassed = prereqData.isPassed;
          let effectiveScore = prereqData.score || 0;

          console.log(`[AUTO PROCESSOR] 🔍 ${prereq} prerequisite check:`, {
            originalPassed: prereqData.isPassed,
            originalScore: prereqData.score,
            hasInterventionHistory: !!(prereqData.interventionHistory && prereqData.interventionHistory.length > 0),
            interventionCount: prereqData.interventionHistory ? prereqData.interventionHistory.length : 0
          });

          // Check if category has intervention history with passed attempts
          if (prereqData.interventionHistory && prereqData.interventionHistory.length > 0) {
            console.log(`[AUTO PROCESSOR] 🔍 ${prereq}: Found ${prereqData.interventionHistory.length} intervention attempts`);
            const passedInterventions = prereqData.interventionHistory.filter(attempt => attempt.isPassed === true);
            console.log(`[AUTO PROCESSOR] 🔍 ${prereq}: ${passedInterventions.length} passed interventions`);

            if (passedInterventions.length > 0) {
              const highestInterventionScore = Math.max(...passedInterventions.map(attempt => attempt.score || 0));
              console.log(`[AUTO PROCESSOR] 🔍 ${prereq}: Highest intervention score: ${highestInterventionScore}%`);

              // Use intervention results for prerequisite check
              if (highestInterventionScore >= 75) {
                effectivePassed = true;
                effectiveScore = highestInterventionScore;
                console.log(`[AUTO PROCESSOR] ✅ ${prereq}: Prerequisite satisfied via intervention (${highestInterventionScore}%)`);
              } else {
                console.log(`[AUTO PROCESSOR] ⚠️  ${prereq}: Intervention score ${highestInterventionScore}% < 75% - not sufficient`);
              }
            } else {
              console.log(`[AUTO PROCESSOR] ⚠️  ${prereq}: No passed interventions found`);
            }
          } else {
            console.log(`[AUTO PROCESSOR] ⚠️  ${prereq}: No intervention history found`);
          }

          console.log(`[AUTO PROCESSOR] 🔍 ${prereq} final result: effectivePassed=${effectivePassed}, effectiveScore=${effectiveScore}`);

          if (!effectivePassed) {
            console.log(`[AUTO PROCESSOR] ❌ ${prereq}: Prerequisite failed - blocking ${category}`);
            return {
              action: 'blocked',
              category: category,
              reason: 'prerequisite_failed',
              blockingCategory: prereq,
              prereqScore: effectiveScore
            };
          } else {
            console.log(`[AUTO PROCESSOR] ✅ ${prereq}: Prerequisite satisfied - allowing ${category}`);
          }
        }
      }

      // Check if this category has complete responses
      const categoryCompleteness = await CategoryResultsService.validateAssessmentCompleteness(
        studentId,
        readingLevel,
        category  // Check only this specific category
      );

      const categoryStatus = categoryCompleteness.categoryResults[category];
      if (!categoryStatus || !categoryStatus.isComplete) {
        return {
          action: 'incomplete',
          category: category,
          answered: categoryStatus ? categoryStatus.answered : 0,
          required: categoryStatus ? categoryStatus.required : 0,
          missing: categoryStatus ? categoryStatus.missing : 'unknown'
        };
      }

      // Category is complete and prerequisites are met - process it!
      console.log(`[AUTO PROCESSOR]        ✅ ${category} is complete - generating category result...`);

      const categoryResults = await CategoryResultsService.generateCategoryResultsFromResponses(
        studentId,
        category  // Process only this category
      );

      return {
        action: 'processed',
        category: category,
        categoryResultId: categoryResults._id,
        prescriptiveAnalysisId: categoryResults.prescriptiveAnalysisId
      };

    } catch (error) {
      console.error(`[AUTO PROCESSOR] Error processing category ${category}: ${error.message}`);
      throw error;
    }
  }

  /**
   * Get categories for reading level in prerequisite order (CLAUDE.md)
   */
  static getCategoriesForReadingLevel(readingLevel) {
    const categoryAssignment = {
      "Low Emerging": ["Alphabet Knowledge"],
      "High Emerging": ["Alphabet Knowledge", "Phonological Awareness"],
      "Developing": ["Alphabet Knowledge", "Phonological Awareness", "Decoding"],
      "Transitioning": ["Alphabet Knowledge", "Phonological Awareness", "Decoding", "Word Recognition"],
      "At Grade Level": ["Alphabet Knowledge", "Phonological Awareness", "Decoding", "Word Recognition", "Reading Comprehension"]
    };

    return categoryAssignment[readingLevel] || [];
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

    // Run progression validation immediately on startup
    this.runPeriodicProgressionValidation().catch(error => {
      console.error('[AUTO PROCESSOR] Error in initial progression validation:', error.message);
    });

    // Then run both periodically
    const intervalMs = intervalMinutes * 60 * 1000;
    setInterval(async () => {
      // Overlap guard: a full all-students scan can occasionally exceed the
      // interval on a busy/contended instance. Skipping the tick (instead of
      // launching a second concurrent scan) prevents these heavy passes from
      // stacking up and starving request handlers on the shared event loop.
      if (this._periodicRunning) {
        console.log('[AUTO PROCESSOR] ⏭️ Previous periodic run still in progress, skipping this tick');
        return;
      }
      this._periodicRunning = true;
      try {
        // Run assessment processing
        await this.processAllCompleteAssessments();

        // Run progression validation
        await this.runPeriodicProgressionValidation();
      } catch (error) {
        console.error('[AUTO PROCESSOR] Error in periodic processing:', error.message);
      } finally {
        this._periodicRunning = false;
      }
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

  /**
   * ❌ DISABLED: Run automatic progression validation as part of periodic processing
   * DISABLED: This was causing automatic progression without teacher approval
   */
  static async runPeriodicProgressionValidation() {
    try {
      console.log('[AUTO PROCESSOR] ⚠️ AUTOMATIC PROGRESSION DISABLED - Teacher-triggered only via IEP dashboard');

      // ❌ DISABLED: This was causing automatic progression without teacher approval
      /*
      const AutomaticProgressionValidationService = require('../AutomaticProgressionValidationService');
      const results = await AutomaticProgressionValidationService.detectStuckProgressions();

      if (results.success) {
        console.log(`[AUTO PROCESSOR] ✅ Progression validation: ${results.progressionsFixed} progressions fixed from ${results.stuckFound} stuck`);
      } else {
        console.warn(`[AUTO PROCESSOR] ⚠️ Progression validation failed: ${results.error}`);
      }

      return results;
      */

      return { success: true, progressionsFixed: 0, stuckFound: 0, disabled: true };

    } catch (error) {
      console.error('[AUTO PROCESSOR] ❌ Error in progression validation:', error.message);
      return { success: false, error: error.message };
    }
  }
}

module.exports = AutoProcessingService;