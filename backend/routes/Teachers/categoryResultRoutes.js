// routes/Teachers/categoryResultRoutes.js
const express = require('express');
const router = express.Router();
const { auth } = require('../../middleware/auth');
const {
  generateCategoryResults,
  checkAssessmentCompletionStatus
} = require('../../controllers/Teachers/ManageProgress/categoryResultController');

// Check if student assessment is complete and ready for processing
router.get('/:studentId/status', checkAssessmentCompletionStatus);

// Generate category results and prescriptive analysis for a student
// This should be called when student completes their main assessment
router.post('/:studentId/generate', generateCategoryResults);

// Get assessment flow with proper blocking status for frontend
router.get('/:studentId/assessment-flow', async (req, res) => {
  try {
    const { studentId } = req.params;
    const studentIdInt = parseInt(studentId);

    // Get student reading level
    const mongoose = require('mongoose');
    const testDb = mongoose.connection.useDb('test');
    const usersCollection = testDb.collection('users');

    const student = await usersCollection.findOne({
      $or: [{ idNumber: studentIdInt }, { studentId: studentIdInt }]
    });

    if (!student) {
      return res.status(404).json({
        success: false,
        message: `Student ${studentIdInt} not found`
      });
    }

    const CategoryResultsService = require('../../services/Teachers/CategoryResultsService');
    const AssessmentFlowControlService = require('../../services/Teachers/AssessmentFlowControlService');

    // Get categories for reading level in prerequisite order
    const categoriesForLevel = CategoryResultsService.getCategoriesForReadingLevel(student.readingLevel);
    const categoryResults = await CategoryResultsService.getCategoryResults(studentIdInt);

    const assessmentFlow = [];

    for (let i = 0; i < categoriesForLevel.length; i++) {
      const category = categoriesForLevel[i];
      const prerequisiteCategories = categoriesForLevel.slice(0, i);

      // Get category status
      const categoryData = categoryResults?.[0]?.categories?.find(cat => cat.categoryName === category);

      // Check prerequisite blocking
      let isBlocked = false;
      let blockingCategory = null;
      let blockingReason = null;

      for (const prereq of prerequisiteCategories) {
        const prereqData = categoryResults?.[0]?.categories?.find(cat => cat.categoryName === prereq);
        if (!prereqData || !prereqData.isPassed) {
          isBlocked = true;
          blockingCategory = prereq;
          blockingReason = !prereqData ? 'prerequisite_not_completed' : 'prerequisite_failed';
          break;
        }
      }

      // Determine status
      let status, displayStatus, badge;
      if (isBlocked) {
        status = 'blocked';
        displayStatus = 'Blocked';
        badge = 'BLOCKED';
      } else if (!categoryData || !categoryData.isCompleted) {
        status = 'not_attempted';
        displayStatus = 'Not Attempted';
        badge = 'NOT ATTEMPTED';
      } else if (categoryData.isPassed) {
        status = 'passed';
        displayStatus = 'Passed';
        badge = 'PASSED';
      } else {
        status = 'failed';
        displayStatus = 'Failed - Intervention Required';
        badge = 'INTERVENTION REQUIRED';
      }

      assessmentFlow.push({
        sequence: i + 1,
        category: category,
        status: status,
        displayStatus: displayStatus,
        badge: badge,
        score: categoryData?.score || 0,
        totalQuestions: categoryData?.totalQuestions || 0,
        isPassed: categoryData?.isPassed || false,
        isCompleted: categoryData?.isCompleted || false,
        isBlocked: isBlocked,
        blockingCategory: blockingCategory,
        blockingReason: blockingReason,
        interventionRequired: categoryData?.interventionRequired || false,
        accessible: !isBlocked
      });
    }

    res.json({
      success: true,
      studentId: studentIdInt,
      studentName: `${student.firstName} ${student.lastName}`,
      readingLevel: student.readingLevel,
      assessmentFlow: assessmentFlow,
      summary: {
        totalCategories: categoriesForLevel.length,
        completed: assessmentFlow.filter(cat => cat.isCompleted).length,
        passed: assessmentFlow.filter(cat => cat.isPassed).length,
        blocked: assessmentFlow.filter(cat => cat.isBlocked).length,
        interventionRequired: assessmentFlow.filter(cat => cat.interventionRequired).length
      }
    });

  } catch (error) {
    console.error('Error getting assessment flow:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Verify database records (for debugging)
router.get('/:studentId/verify', async (req, res) => {
  try {
    const { studentId } = req.params;
    const studentIdInt = parseInt(studentId);

    const CategoryResultsService = require('../../services/Teachers/CategoryResultsService');
    const results = await CategoryResultsService.getCategoryResults(studentIdInt);

    res.json({
      success: true,
      studentId: studentIdInt,
      recordCount: results ? results.length : 0,
      records: results || [],
      message: results && results.length > 0 ? `Found ${results.length} records` : 'No records found'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Force regenerate prescriptive analysis for testing
router.post('/:categoryResultId/force-regenerate', async (req, res) => {
  try {
    const { categoryResultId } = req.params;

    console.log(`[FORCE REGENERATE] Triggering manual regeneration for category result: ${categoryResultId}`);

    const IntegrationTriggerService = require('../../services/Teachers/PrescriptiveAnalytics/integrationTriggerService');
    const analysis = await IntegrationTriggerService.manualTrigger(categoryResultId, true);

    res.status(200).json({
      success: true,
      message: 'Prescriptive analysis regenerated successfully',
      data: analysis
    });
  } catch (error) {
    console.error('Error in force regenerate:', error);
    res.status(500).json({
      success: false,
      message: 'Error regenerating prescriptive analysis',
      error: error.message
    });
  }
});

module.exports = router;