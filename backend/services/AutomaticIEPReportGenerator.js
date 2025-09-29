const mongoose = require('mongoose');
const User = require('../models/userModel');
const CategoryResult = require('../models/Teachers/ManageProgress/categoryResultModel');
const IEPReport = require('../models/Teachers/ManageProgress/iepReportModel');
const InterventionResults = require('../models/Teachers/ManageProgress/interventionResultsModel');

/**
 * Automatic IEP Report Generator
 * Automatically creates/updates IEP reports whenever students complete assessments or interventions
 */
class AutomaticIEPReportGenerator {

  /**
   * Main entry point - automatically generate/update IEP report from category results
   */
  static async generateOrUpdateIEPReport(categoryResult, triggerEvent = 'assessment_completed') {
    try {
      console.log(`[IEP AUTO GEN] 📋 Generating IEP report for categoryResult:`, JSON.stringify(categoryResult, null, 2));
      console.log(`[IEP AUTO GEN] 📋 categoryResult keys:`, Object.keys(categoryResult || {}));
      console.log(`[IEP AUTO GEN] 📋 categoryResult.studentId:`, categoryResult?.studentId);
      console.log(`[IEP AUTO GEN] 📋 Generating IEP report for student ${categoryResult?.studentId} - Event: ${triggerEvent}`);

      // Validate categoryResult input
      if (!categoryResult) {
        console.error(`[IEP AUTO GEN] ❌ categoryResult is null or undefined`);
        return { success: false, error: 'categoryResult is required' };
      }

      // Get student information
      const student = await User.findOne({ idNumber: categoryResult.studentId });
      if (!student) {
        console.error(`[IEP AUTO GEN] ❌ Student not found: ${categoryResult.studentId}`);
        return { success: false, error: `Student not found: ${categoryResult.studentId}` };
      }

      // Check if IEP report already exists
      let iepReport = await IEPReport.findOne({
        studentId: student._id,
        isActive: true
      });

      if (iepReport) {
        // Update existing IEP report
        console.log(`[IEP AUTO GEN] 🔄 Updating existing IEP report for ${student.firstName} ${student.lastName}`);
        await this.updateExistingIEPReport(iepReport, categoryResult, student);
      } else {
        // Create new IEP report
        console.log(`[IEP AUTO GEN] ✨ Creating new IEP report for ${student.firstName} ${student.lastName}`);
        iepReport = await this.createNewIEPReport(categoryResult, student);
      }

      console.log(`[IEP AUTO GEN] ✅ IEP report generated successfully for student ${categoryResult.studentId}`);
      return { success: true, iepReport: iepReport, message: 'IEP report generated successfully' };

    } catch (error) {
      console.error(`[IEP AUTO GEN] ❌ Error generating IEP report:`, error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Create a new IEP report from category results
   */
  static async createNewIEPReport(categoryResult, student) {
    try {
      console.log(`[IEP AUTO GEN] 📝 Creating new IEP report...`);

      // Generate objectives from category results
      const objectives = await this.generateObjectivesFromCategoryResults(categoryResult, student.idNumber);

      const iepReportData = {
        studentId: student._id,
        studentNumber: student.idNumber.toString(),
        readingLevel: categoryResult.readingLevel || student.readingLevel,
        overallScore: categoryResult.overallScore || 0,
        objectives: objectives,
        basedOnAssessmentId: categoryResult._id,
        isActive: true,
        academicYear: new Date().getFullYear().toString(),
        createdAt: new Date(),
        updatedAt: new Date()
      };

      const iepReport = new IEPReport(iepReportData);
      const savedReport = await iepReport.save();

      console.log(`[IEP AUTO GEN] ✅ New IEP report created with ${objectives.length} objectives`);
      return savedReport;

    } catch (error) {
      console.error(`[IEP AUTO GEN] ❌ Error creating new IEP report:`, error);
      throw error;
    }
  }

  /**
   * Update existing IEP report with new data (preserves teacher data)
   */
  static async updateExistingIEPReport(iepReport, categoryResult, student) {
    try {
      console.log(`[IEP AUTO GEN] 🔄 Updating existing IEP report (preserving teacher data)...`);

      // Update basic information ONLY - preserve all objectives and teacher data
      iepReport.readingLevel = categoryResult.readingLevel || student.readingLevel;
      iepReport.overallScore = categoryResult.overallScore || 0;
      iepReport.basedOnAssessmentId = categoryResult._id;
      iepReport.updatedAt = new Date();

      // ✅ PRESERVE TEACHER DATA: Don't regenerate objectives, just update overallScore
      // This prevents duplicate intervention attempts and preserves teacher remarks
      console.log(`[IEP AUTO GEN] 🔄 Preserving existing objectives and teacher data, only updating overallScore: ${iepReport.overallScore}`);

      const savedReport = await iepReport.save();
      console.log(`[IEP AUTO GEN] ✅ IEP report updated (overallScore synced, teacher data preserved)`);

      return savedReport;

    } catch (error) {
      console.error(`[IEP AUTO GEN] ❌ Error updating IEP report:`, error);
      throw error;
    }
  }

  /**
   * Generate IEP objectives from category results with intervention tracking
   */
  static async generateObjectivesFromCategoryResults(categoryResult, studentId) {
    try {
      const objectives = [];

      for (const category of categoryResult.categories) {
        console.log(`[IEP AUTO GEN] 📊 Processing category: ${category.categoryName}`);

        // Get intervention data for this category
        const interventionData = await this.getInterventionDataForCategory(studentId, category.categoryName);

        const objective = {
          categoryName: category.categoryName,
          lesson: this.generateLessonName(category.categoryName),

          // Assessment data (capped at 100 to meet validation requirements)
          assessmentScore: Math.min(category.score || 0, 100),
          totalQuestions: category.totalQuestions || 0,
          correctAnswers: category.correctAnswers || 0,
          totalPossibleMatches: category.totalPossibleMatches || 0,
          correctMatches: category.correctMatches || 0,
          isCompleted: category.isCompleted || false,
          isPassed: category.isPassed || false,

          // Status determination
          status: this.determineStatus(category),
          completed: category.isPassed || false,
          supportLevel: this.determineSupportLevel(category.score || 0),
          score: Math.min(category.score || 0, 100),
          passingThreshold: category.passingThreshold || 75,

          // Intervention tracking
          hasIntervention: interventionData.hasIntervention,
          interventionId: interventionData.interventionId,
          interventionName: interventionData.interventionName,
          interventionStatus: interventionData.interventionStatus,
          interventionAttempts: interventionData.interventionAttempts,
          interventionCompleted: interventionData.interventionCompleted,
          interventionHistory: interventionData.interventionHistory,
          latestInterventionScore: interventionData.latestInterventionScore,
          latestInterventionPassed: interventionData.latestInterventionPassed,
          interventionImprovement: interventionData.interventionImprovement,
          interventionCreatedAt: interventionData.interventionCreatedAt,

          // Default values
          remarks: '',
          mainAssessmentRemarks: '',
          lastUpdated: new Date()
        };

        objectives.push(objective);
        console.log(`[IEP AUTO GEN] ✅ Generated objective for ${category.categoryName}: ${objective.status} (${objective.score}%)`);
      }

      return objectives;

    } catch (error) {
      console.error(`[IEP AUTO GEN] ❌ Error generating objectives:`, error);
      return [];
    }
  }

  /**
   * Get comprehensive intervention data for a category
   */
  static async getInterventionDataForCategory(studentId, categoryName) {
    try {
      // Get latest intervention results for this category
      const latestInterventionResult = await InterventionResults.findOne({
        studentId: studentId,
        category: categoryName
      }).sort({ assessmentDate: -1 });

      if (!latestInterventionResult) {
        return {
          hasIntervention: false,
          interventionId: null,
          interventionName: '',
          interventionStatus: 'not_needed',
          interventionAttempts: 0,
          interventionCompleted: false,
          interventionHistory: [],
          latestInterventionScore: 0,
          latestInterventionPassed: false,
          interventionImprovement: 0,
          interventionCreatedAt: null
        };
      }

      // Get all intervention results for this category to build history
      const allInterventionResults = await InterventionResults.find({
        studentId: studentId,
        category: categoryName
      }).sort({ assessmentDate: 1 });

      const interventionHistory = allInterventionResults.map((result, index) => ({
        attemptNumber: index + 1,
        score: Math.min(result.score || 0, 100), // Cap at 100 for validation
        isPassed: result.isPassed || false,
        attemptedAt: result.assessmentDate || new Date(),
        reason: 'intervention_attempt',
        revisionNumber: result.revisionNumber || 1,
        teacherRemarks: ''
      }));

      return {
        hasIntervention: true,
        interventionId: latestInterventionResult.interventionAssessmentId,
        interventionName: `${categoryName} Intervention`,
        interventionStatus: latestInterventionResult.isPassed ? 'completed_passed' : 'completed_failed',
        interventionAttempts: allInterventionResults.length,
        interventionCompleted: true,
        interventionHistory: interventionHistory,
        latestInterventionScore: Math.min(latestInterventionResult.score || 0, 100), // Cap at 100 for validation
        latestInterventionPassed: latestInterventionResult.isPassed || false,
        interventionImprovement: Math.max(-100, Math.min(100, (latestInterventionResult.score || 0) - (latestInterventionResult.previousScore || 0))), // Cap between -100 and +100
        interventionCreatedAt: latestInterventionResult.assessmentDate || new Date()
      };

    } catch (error) {
      console.error(`[IEP AUTO GEN] ❌ Error getting intervention data for ${categoryName}:`, error);
      return {
        hasIntervention: false,
        interventionId: null,
        interventionName: '',
        interventionStatus: 'not_needed',
        interventionAttempts: 0,
        interventionCompleted: false,
        interventionHistory: [],
        latestInterventionScore: 0,
        latestInterventionPassed: false,
        interventionImprovement: 0,
        interventionCreatedAt: null
      };
    }
  }

  /**
   * Generate lesson name based on category
   */
  static generateLessonName(categoryName) {
    const lessonNames = {
      'Alphabet Knowledge': 'Letter Recognition and Sound Correspondence',
      'Phonological Awareness': 'Sound Awareness and Discrimination',
      'Decoding': 'Word Decoding and Sound Blending',
      'Word Recognition': 'Sight Word Recognition and Vocabulary',
      'Reading Comprehension': 'Reading Comprehension and Text Understanding'
    };

    return lessonNames[categoryName] || `${categoryName} Skills Development`;
  }

  /**
   * Determine status based on category performance
   */
  static determineStatus(category) {
    if (category.isPassed) {
      return 'mastered';
    } else if (category.isCompleted) {
      return 'in_progress';  // Completed but not passed
    } else {
      return 'not_started';
    }
  }

  /**
   * Determine support level based on score
   */
  static determineSupportLevel(score) {
    if (score >= 75) {
      return 'minimal';
    } else if (score >= 50) {
      return 'moderate';
    } else {
      return 'extensive';
    }
  }

  /**
   * Process all existing students and generate missing IEP reports
   */
  static async generateMissingIEPReports() {
    try {
      console.log('[IEP AUTO GEN] 🔍 Checking for students with missing IEP reports...');

      // Find all students with category results but no IEP reports
      const categoryResults = await CategoryResult.find({});
      console.log(`[IEP AUTO GEN] Found ${categoryResults.length} category results to process`);

      for (const categoryResult of categoryResults) {
        // Get student info
        const student = await User.findOne({ idNumber: categoryResult.studentId });
        if (!student) {
          console.log(`[IEP AUTO GEN] ⚠️ Student not found for ID: ${categoryResult.studentId}`);
          continue;
        }

        // Check if IEP report exists
        const existingIEPReport = await IEPReport.findOne({
          studentId: student._id,
          isActive: true
        });

        if (!existingIEPReport) {
          console.log(`[IEP AUTO GEN] 📋 Creating missing IEP report for ${student.firstName} ${student.lastName} (${categoryResult.studentId})`);
          await this.generateOrUpdateIEPReport(categoryResult, 'batch_generation');
        } else {
          // Update existing report to ensure it has latest data
          console.log(`[IEP AUTO GEN] 🔄 Updating existing IEP report for ${student.firstName} ${student.lastName} (${categoryResult.studentId})`);
          await this.updateExistingIEPReport(existingIEPReport, categoryResult, student);
        }
      }

      console.log('[IEP AUTO GEN] ✅ Missing IEP reports generation completed');

    } catch (error) {
      console.error('[IEP AUTO GEN] ❌ Error generating missing IEP reports:', error);
    }
  }

  /**
   * Auto-trigger IEP report generation when category results are updated
   */
  static async triggerIEPReportUpdate(categoryResultId, triggerEvent = 'category_updated') {
    try {
      const categoryResult = await CategoryResult.findById(categoryResultId);
      if (categoryResult) {
        await this.generateOrUpdateIEPReport(categoryResult, triggerEvent);
      }
    } catch (error) {
      console.error('[IEP AUTO GEN] ❌ Error triggering IEP report update:', error);
    }
  }

  /**
   * Initialize automatic IEP report generation on server startup
   */
  static async initializeAutoGeneration() {
    try {
      console.log('[IEP AUTO GEN] 🚀 Initializing automatic IEP report generation...');

      // Wait for server to fully start, then process missing reports
      setTimeout(async () => {
        await this.generateMissingIEPReports();
      }, 8000);

    } catch (error) {
      console.error('[IEP AUTO GEN] ❌ Error initializing auto generation:', error);
    }
  }
}

module.exports = AutomaticIEPReportGenerator;