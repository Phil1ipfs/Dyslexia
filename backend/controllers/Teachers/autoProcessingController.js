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
            console.log(`[MANUAL FIX] Updating ${category.categoryName}: ${originalScore}% → ${highestScore}%`);

            categoryResults.categories[i].isPassed = true;
            categoryResults.categories[i].score = highestScore;
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
      const CategoryResultsService = require('../services/Teachers/CategoryResultsService');
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

module.exports = {
  processAllCompleteAssessments,
  processSpecificStudent,
  getProcessingStatus,
  fixInterventionSuccess
};