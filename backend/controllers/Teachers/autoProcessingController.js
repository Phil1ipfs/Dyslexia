const AutoProcessingService = require('../../services/Teachers/AutoProcessingService');

/**
 * Auto Processing Controller
 * Handles manual triggers and status checks for automatic assessment processing
 */

/**
 * Manually trigger processing of all complete assessments
 * POST /api/auto-processing/process-all
 */
const processAllCompleteAssessments = async (req, res) => {
  try {
    console.log('[AUTO PROCESSING CONTROLLER] Manual trigger for processing all complete assessments');

    const result = await AutoProcessingService.processAllCompleteAssessments();

    res.status(200).json({
      success: true,
      message: 'Auto-processing completed',
      data: {
        summary: result,
        details: {
          totalStudents: result.total,
          newlyProcessed: result.processed,
          alreadyProcessed: result.skipped,
          stillIncomplete: result.incomplete
        }
      }
    });

  } catch (error) {
    console.error('[AUTO PROCESSING CONTROLLER] Error in manual processing:', error);
    res.status(500).json({
      success: false,
      message: 'Error during auto-processing',
      error: error.message
    });
  }
};

/**
 * Process specific student
 * POST /api/auto-processing/process-student/:studentId
 */
const processSpecificStudent = async (req, res) => {
  try {
    const { studentId } = req.params;

    console.log(`[AUTO PROCESSING CONTROLLER] Manual trigger for student ${studentId}`);

    const result = await AutoProcessingService.processSpecificStudent(studentId);

    res.status(200).json({
      success: true,
      message: `Student ${studentId} processing completed`,
      data: result
    });

  } catch (error) {
    console.error(`[AUTO PROCESSING CONTROLLER] Error processing student ${req.params.studentId}:`, error);
    res.status(500).json({
      success: false,
      message: `Error processing student ${req.params.studentId}`,
      error: error.message
    });
  }
};

/**
 * Get auto-processing status
 * GET /api/auto-processing/status
 */
const getProcessingStatus = async (req, res) => {
  try {
    const status = await AutoProcessingService.getProcessingStatus();

    res.status(200).json({
      success: true,
      message: 'Auto-processing status retrieved',
      data: status
    });

  } catch (error) {
    console.error('[AUTO PROCESSING CONTROLLER] Error getting status:', error);
    res.status(500).json({
      success: false,
      message: 'Error retrieving auto-processing status',
      error: error.message
    });
  }
};

/**
 * Fix intervention success not reflected in category_results
 * POST /api/auto-processing/fix-intervention-success/:studentId
 */
const fixInterventionSuccess = async (req, res) => {
  try {
    const { studentId } = req.params;
    const CategoryResults = require('../../models/Teachers/ManageProgress/categoryResultModel');

    console.log(`[MANUAL FIX] Fixing intervention success for student ${studentId}`);

    const categoryResults = await CategoryResults.findOne({ studentId: parseInt(studentId) });
    if (!categoryResults) {
      return res.status(404).json({
        success: false,
        message: `Student ${studentId} not found`
      });
    }

    let fixedCategories = [];
    let updated = false;

    // Check each category for successful interventions
    for (let i = 0; i < categoryResults.categories.length; i++) {
      const category = categoryResults.categories[i];

      if (category.interventionHistory && category.interventionHistory.length > 0) {
        // Find the highest scoring passed intervention
        const passedInterventions = category.interventionHistory.filter(h => h.isPassed === true);

        if (passedInterventions.length > 0) {
          const highestScore = Math.max(...passedInterventions.map(h => h.score || 0));
          const originalPassed = category.isPassed;
          const originalScore = category.score;

          // If intervention score is higher and passed, update the category
          if (highestScore >= 75 && (!originalPassed || highestScore > originalScore)) {
            console.log(`[MANUAL FIX] 🔒 PRESERVING original data for ${category.categoryName}: score=${originalScore}%, isPassed=${originalPassed}`);
            console.log(`[MANUAL FIX] ✅ Intervention success (${highestScore}%) tracked in history only`);

            // ❌ REMOVED: categoryResults.categories[i].isPassed = true;  // PRESERVE original isPassed
            // ❌ REMOVED: categoryResults.categories[i].score = highestScore;  // PRESERVE original score
            categoryResults.categories[i].interventionRequired = false;
            categoryResults.categories[i].interventionCompleted = true;

            fixedCategories.push({
              categoryName: category.categoryName,
              originalScore: originalScore,
              newScore: highestScore,
              originalPassed: originalPassed,
              newPassed: true
            });

            updated = true;
          }
        }
      }
    }

    if (updated) {
      // Recalculate overall statistics
      const passedCategories = categoryResults.categories.filter(cat => cat.isPassed === true);
      categoryResults.completedCategories = passedCategories.length;

      // ✅ FIX: Use CategoryResultsService.calculateOverallStats for correct calculation
      const CategoryResultsService = require('../../services/Teachers/CategoryResultsService');
      const correctStats = CategoryResultsService.calculateOverallStats(categoryResults.categories);
      const totalCategories = categoryResults.categories.length;
      categoryResults.overallScore = correctStats.overallScore;
      categoryResults.allCategoriesPassed = passedCategories.length === totalCategories;

      categoryResults.updatedAt = new Date();
      await categoryResults.save();

      console.log(`[MANUAL FIX] Successfully updated ${fixedCategories.length} categories for student ${studentId}`);
    }

    res.status(200).json({
      success: true,
      message: updated ? `Fixed ${fixedCategories.length} categories` : 'No fixes needed',
      data: {
        studentId: parseInt(studentId),
        categoriesFixed: fixedCategories,
        newCompletedCategories: categoryResults.completedCategories,
        newOverallScore: categoryResults.overallScore,
        updated: updated
      }
    });

  } catch (error) {
    console.error(`[MANUAL FIX] Error fixing student ${req.params.studentId}:`, error);
    res.status(500).json({
      success: false,
      message: `Error fixing student ${req.params.studentId}`,
      error: error.message
    });
  }
};

/**
 * Fast reprocess student - fixes counting issues and regenerates category results
 * POST /api/auto-processing/fast-reprocess/:studentId
 */
const fastReprocessStudent = async (req, res) => {
  try {
    const { studentId } = req.params;
    console.log(`[FAST REPROCESS] 🚀 Fast reprocessing student ${studentId}`);

    const CategoryResultsService = require('../../services/Teachers/CategoryResultsService');
    const User = require('../../models/userModel');

    // Get student info
    const student = await User.findOne({ idNumber: parseInt(studentId) });
    if (!student) {
      return res.status(404).json({
        success: false,
        message: `Student ${studentId} not found`
      });
    }

    console.log(`[FAST REPROCESS] Found student: ${student.firstName} ${student.lastName}, Reading Level: ${student.readingLevel}`);

    // Clear existing category results to force regeneration
    const CategoryResult = require('../../models/Teachers/ManageProgress/categoryResultModel');
    await CategoryResult.deleteMany({ studentId: parseInt(studentId) });
    console.log(`[FAST REPROCESS] ✅ Cleared existing category results for fresh generation`);

    // Clear existing prescriptive analysis to force regeneration
    const PrescriptiveAnalysis = require('../../models/Teachers/ManageProgress/prescriptiveAnalysisModel');
    await PrescriptiveAnalysis.deleteMany({ studentId: parseInt(studentId) });
    console.log(`[FAST REPROCESS] ✅ Cleared existing prescriptive analysis for fresh generation`);

    // Regenerate category results from all responses
    console.log(`[FAST REPROCESS] 🔄 Regenerating category results from student responses...`);
    const categoryResult = await CategoryResultsService.generateCategoryResultsFromResponses(
      parseInt(studentId),
      student.readingLevel
    );

    console.log(`[FAST REPROCESS] ✅ Successfully regenerated category results`);

    res.status(200).json({
      success: true,
      message: `Fast reprocessing completed for student ${studentId}`,
      data: {
        studentId: parseInt(studentId),
        studentName: `${student.firstName} ${student.lastName}`,
        readingLevel: student.readingLevel,
        categoryResult: categoryResult,
        categories: categoryResult?.categories?.map(cat => ({
          name: cat.categoryName,
          totalQuestions: cat.totalQuestions,
          correctAnswers: cat.correctAnswers,
          score: cat.score,
          isPassed: cat.isPassed
        })) || [],
        processingTimestamp: new Date()
      }
    });

  } catch (error) {
    console.error(`[FAST REPROCESS] ❌ Error reprocessing student ${req.params.studentId}:`, error);
    res.status(500).json({
      success: false,
      message: `Error reprocessing student ${req.params.studentId}`,
      error: error.message
    });
  }
};

module.exports = {
  processAllCompleteAssessments,
  processSpecificStudent,
  getProcessingStatus,
  fixInterventionSuccess,
  fastReprocessStudent
};