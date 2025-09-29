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

        // ⚡ OPTIMIZED: Add concise student summary for single-page layout
        studentSummary: this.generateConciseStudentSummary(categoryResult, student),

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
          // ✅ FIXED: Use correct scoring for Phonological Awareness
          assessmentScore: Math.min(
            category.categoryName === 'Phonological Awareness' &&
            category.totalPossibleMatches > 0 &&
            category.correctMatches !== undefined
              ? Math.round((category.correctMatches / category.totalPossibleMatches) * 100)
              : (category.score || 0),
            100
          ),
          totalQuestions: category.totalQuestions || 0,
          correctAnswers: category.correctAnswers || 0,
          totalPossibleMatches: category.totalPossibleMatches || 0,
          correctMatches: category.correctMatches || 0,
          isCompleted: category.isCompleted || false,
          isPassed: category.isPassed || false,

          // ⚡ OPTIMIZED: Proper performance formatting for different categories
          performanceDetails: this.formatPerformanceDetails(category),

          // Status determination
          status: this.determineStatus(category),
          completed: category.isPassed || false,
          supportLevel: null, // Teachers will set this manually after assessment
          score: Math.min(category.score || 0, 100),
          passingThreshold: category.passingThreshold || 75,

          // ⚡ OPTIMIZED: Proper intervention progress formatting
          interventionProgress: this.formatInterventionProgress(interventionData, category),

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
   * ⚡ OPTIMIZED: Format performance details properly for different categories
   */
  static formatPerformanceDetails(category) {
    const categoryName = category.categoryName;

    // ✅ FIXED: Calculate correct score for Phonological Awareness using correctMatches/totalMatches
    let score;
    if (categoryName === 'Phonological Awareness' &&
        category.totalPossibleMatches > 0 &&
        category.correctMatches !== undefined) {
      score = Math.round((category.correctMatches / category.totalPossibleMatches) * 100);
    } else {
      score = Math.min(category.score || 0, 100);
    }

    if (categoryName === 'Phonological Awareness') {
      // Show matches format for Phonological Awareness
      const correctMatches = category.correctMatches || 0;
      const totalMatches = category.totalPossibleMatches || 0;
      return `${score}% (${correctMatches}/${totalMatches} matches correct)`;
    } else if (categoryName === 'Reading Comprehension') {
      // Show all-or-nothing scoring info
      const correctAnswers = category.correctAnswers || 0;
      const totalQuestions = category.totalQuestions || 0;
      return `${score}% (${correctAnswers}/${totalQuestions} stories fully understood)`;
    } else {
      // Standard format for other categories
      const correctAnswers = category.correctAnswers || 0;
      const totalQuestions = category.totalQuestions || 0;
      return `${score}% (${correctAnswers}/${totalQuestions} questions correct)`;
    }
  }

  /**
   * ⚡ OPTIMIZED: Format intervention progress properly
   */
  static formatInterventionProgress(interventionData, category) {
    // Handle case where interventionData might be undefined or category might be undefined
    if (!interventionData && !category) {
      return 'Not Started';
    }

    // If category passed and no intervention needed
    if (category && category.isPassed && category.score >= 75) {
      return 'Not Started'; // No intervention needed - category passed
    }

    // If no intervention data available
    if (!interventionData) {
      if (category && !category.isPassed) {
        return 'Required'; // Intervention needed but not started yet
      }
      return 'Not Started';
    }

    // If intervention data indicates no intervention
    if (!interventionData.hasIntervention) {
      if (category && category.isPassed) {
        return 'Not Started'; // No intervention needed - category passed
      } else {
        return 'Required'; // Intervention needed but not started yet
      }
    }

    // If intervention exists but no attempts yet
    if (interventionData.interventionAttempts === 0) {
      return 'Not Started'; // Intervention exists but no attempts yet
    }

    const attempts = interventionData.interventionAttempts;
    const latestScore = interventionData.latestInterventionScore || 0;
    const passed = interventionData.latestInterventionPassed;

    if (passed) {
      return `${latestScore}% (${attempts} attempt${attempts > 1 ? 's' : ''}) - COMPLETED`;
    } else {
      return `${latestScore}% (${attempts} attempt${attempts > 1 ? 's' : ''}) - IN PROGRESS`;
    }
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
   * ✅ COMPREHENSIVE: Generate complete student summary matching React component
   */
  static generateConciseStudentSummary(categoryResult, student) {
    const totalCategories = categoryResult.categories?.length || 0;
    const passedCategories = categoryResult.categories?.filter(cat => cat.isPassed).length || 0;
    const overallScore = categoryResult.overallScore || 0;
    const interventionCategories = categoryResult.categories?.filter(cat => cat.interventionRequired).length || 0;

    // Check if all categories are passed (mastery achieved)
    const allCategoriesPassed = passedCategories === totalCategories;
    const masteryText = allCategoriesPassed ?
      'demonstrating complete mastery across all assessed literacy domains' :
      `requiring targeted development in ${totalCategories} critical literacy domains`;

    // Build category performance details
    const categoryDetails = categoryResult.categories?.map(cat => {
      const score = cat.categoryName === 'Phonological Awareness' &&
                   cat.totalPossibleMatches > 0 &&
                   cat.correctMatches !== undefined
        ? Math.round((cat.correctMatches / cat.totalPossibleMatches) * 100)
        : (cat.score || 0);
      return `${cat.categoryName} (${score}%)`;
    }).join(', ') || '';

    // Build initial assessment details
    const initialAssessmentDetails = categoryResult.categories?.map(cat => {
      const score = cat.categoryName === 'Phonological Awareness' &&
                   cat.totalPossibleMatches > 0 &&
                   cat.correctMatches !== undefined
        ? Math.round((cat.correctMatches / cat.totalPossibleMatches) * 100)
        : (cat.score || 0);
      const totalQuestions = cat.totalQuestions || 0;
      const correctAnswers = cat.correctAnswers || 0;
      return `${cat.categoryName}: ${score}% (${correctAnswers}/${totalQuestions} questions correct)`;
    }).join('; ') || '';

    // Build intervention progress details
    const interventionDetails = categoryResult.categories
      ?.filter(cat => cat.interventionHistory && cat.interventionHistory.length > 0)
      ?.map(cat => {
        const history = cat.interventionHistory[cat.interventionHistory.length - 1]; // Latest intervention
        const initialScore = cat.categoryName === 'Phonological Awareness' &&
                            cat.totalPossibleMatches > 0 &&
                            cat.correctMatches !== undefined
          ? Math.round((cat.correctMatches / cat.totalPossibleMatches) * 100)
          : (cat.score || 0);
        const interventionScore = history.score || 0;
        const improvement = interventionScore - initialScore;
        return `${cat.categoryName} (1 attempt with +${improvement}% improvement (latest score: ${interventionScore}%))`;
      }).join('; ') || '';

    const masteredDomains = categoryResult.categories
      ?.filter(cat => cat.isPassed)
      ?.map(cat => cat.categoryName)
      ?.join(', ') || '';

    const averageImprovement = categoryResult.categories
      ?.filter(cat => cat.interventionHistory && cat.interventionHistory.length > 0)
      ?.reduce((sum, cat) => {
        const history = cat.interventionHistory[cat.interventionHistory.length - 1];
        const initialScore = cat.score || 0;
        const interventionScore = history.score || 0;
        return sum + (interventionScore - initialScore);
      }, 0) / Math.max(categoryResult.categories?.filter(cat => cat.interventionHistory && cat.interventionHistory.length > 0).length || 1, 1);

    // Generate comprehensive report
    let comprehensiveReport = `Reading Level Achievement: ${student.firstName} ${student.lastName} is currently functioning at the ${categoryResult.readingLevel} reading level, ${masteryText}: ${categoryDetails}. `;

    if (allCategoriesPassed) {
      comprehensiveReport += `With an average performance of ${overallScore}%, this achievement reflects strong foundational reading skills and readiness for advancement to the next developmental reading level. `;
    } else {
      comprehensiveReport += `Current performance indicates specific skill gaps that benefit from systematic intervention approaches. The average assessment performance of ${overallScore}% suggests foundational skills requiring intensive support through evidence-based instructional strategies. `;
    }

    comprehensiveReport += `Initial Assessment Performance: The comprehensive initial assessment administered across multiple literacy domains revealed the following detailed performance profile: ${initialAssessmentDetails}. `;

    if (interventionCategories > 0) {
      const strugglingCategories = categoryResult.categories
        ?.filter(cat => !cat.isPassed)
        ?.map(cat => {
          const score = cat.categoryName === 'Phonological Awareness' &&
                       cat.totalPossibleMatches > 0 &&
                       cat.correctMatches !== undefined
            ? Math.round((cat.correctMatches / cat.totalPossibleMatches) * 100)
            : (cat.score || 0);
          const difficulty = score === 0 ? 'significant challenge' :
                           score < 40 ? 'severe difficulty' :
                           score < 60 ? 'moderate difficulty' : 'approaching proficiency';
          return `${cat.categoryName} (${difficulty} at ${score}%)`;
        }).join(', ') || '';

      comprehensiveReport += `Assessment results indicate ${interventionCategories} domains requiring intervention: ${strugglingCategories}. `;
    }

    if (interventionDetails) {
      comprehensiveReport += `Intervention Progress: ${student.firstName} ${student.lastName} has actively engaged in ${interventionCategories} intervention sessions across ${interventionCategories} literacy domains: ${interventionDetails}. `;

      if (masteredDomains) {
        comprehensiveReport += `The student successfully achieved mastery in ${passedCategories} domains (${masteredDomains}), demonstrating an average improvement of ${Math.round(averageImprovement)}% across intervention areas. This progress indicates strong responsiveness to targeted instructional support and effective skill acquisition through systematic intervention approaches. `;
      }
    }

    if (allCategoriesPassed) {
      comprehensiveReport += `Current Status: Complete mastery achieved - ready for reading level advancement.`;
    } else {
      comprehensiveReport += `Current Academic Status and Recommendations: ${student.firstName} ${student.lastName} requires immediate implementation of intensive intervention protocols in ${interventionCategories} critical literacy domains: ${categoryDetails}. With current performance metrics showing ${Math.round((passedCategories/totalCategories)*100)}% mastery rate and ${overallScore}% overall academic achievement, priority actions include: development of individualized intervention plans, implementation of evidence-based instructional strategies, provision of specialized educational supports, and establishment of frequent progress monitoring systems. The student would benefit from multi-sensory teaching approaches, reduced cognitive load strategies, and potential consultation with literacy specialists to address identified learning gaps and facilitate academic progress toward mastery at the ${categoryResult.readingLevel} reading level.`;
    }

    return comprehensiveReport;
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