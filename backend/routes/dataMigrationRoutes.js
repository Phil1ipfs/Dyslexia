/**
 * API routes for data migration and fixing
 */

const express = require('express');
const router = express.Router();

// Import the data migration functions
const {
  runDataMigration,
  findProblematicCategoryResults,
  validateFixForStudent
} = require('../../fix_category_results_data');

/**
 * GET /api/data-migration/check
 * Check for problematic category_results records
 */
router.get('/check', async (req, res) => {
  try {
    console.log('[DATA MIGRATION API] Checking for problematic category_results...');

    const problematicCases = await findProblematicCategoryResults();

    res.json({
      success: true,
      message: `Found ${problematicCases.length} problematic cases`,
      data: {
        problematicCount: problematicCases.length,
        cases: problematicCases.map(c => ({
          studentId: c.studentId,
          category: c.category,
          missingAttempt: c.missingAttempt,
          interventionScore: c.interventionResult.score,
          interventionPassed: c.interventionResult.isPassed
        }))
      }
    });

  } catch (error) {
    console.error('[DATA MIGRATION API] Check failed:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to check for problematic cases',
      error: error.message
    });
  }
});

/**
 * POST /api/data-migration/fix
 * Run the data migration to fix problematic records
 */
router.post('/fix', async (req, res) => {
  try {
    console.log('[DATA MIGRATION API] Running data migration...');

    await runDataMigration();

    res.json({
      success: true,
      message: 'Data migration completed successfully',
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('[DATA MIGRATION API] Migration failed:', error);
    res.status(500).json({
      success: false,
      message: 'Data migration failed',
      error: error.message
    });
  }
});

/**
 * GET /api/data-migration/validate/:studentId
 * Validate the fix for a specific student
 */
router.get('/validate/:studentId', async (req, res) => {
  try {
    const { studentId } = req.params;
    console.log(`[DATA MIGRATION API] Validating fix for student ${studentId}...`);

    // Capture console output for validation
    const originalLog = console.log;
    const logs = [];
    console.log = (...args) => {
      logs.push(args.join(' '));
      originalLog(...args);
    };

    await validateFixForStudent(parseInt(studentId));

    // Restore console.log
    console.log = originalLog;

    res.json({
      success: true,
      message: `Validation completed for student ${studentId}`,
      data: {
        studentId: parseInt(studentId),
        validationLogs: logs
      }
    });

  } catch (error) {
    console.error('[DATA MIGRATION API] Validation failed:', error);
    res.status(500).json({
      success: false,
      message: 'Validation failed',
      error: error.message
    });
  }
});

/**
 * GET /api/data-migration/student/:studentId/category/:category
 * Get detailed intervention history for a specific student and category
 */
router.get('/student/:studentId/category/:category', async (req, res) => {
  try {
    const { studentId, category } = req.params;

    const CategoryResults = require('../models/categoryResultsModel');
    const InterventionResults = require('../models/interventionResultsModel');

    // Get category_results data
    const categoryResult = await CategoryResults.findOne({
      studentId: parseInt(studentId),
      'categories.categoryName': category
    });

    if (!categoryResult) {
      return res.status(404).json({
        success: false,
        message: `No category_results found for student ${studentId}, category ${category}`
      });
    }

    const categoryData = categoryResult.categories.find(cat => cat.categoryName === category);

    // Get all intervention_results for this student/category
    const interventionResults = await InterventionResults.find({
      studentId: parseInt(studentId),
      category: category
    }).sort({ revisionNumber: 1 });

    res.json({
      success: true,
      message: `Retrieved data for student ${studentId}, category ${category}`,
      data: {
        studentId: parseInt(studentId),
        category: category,
        categoryResults: {
          isPassed: categoryData.isPassed,
          interventionAttempts: categoryData.interventionAttempts,
          interventionCompleted: categoryData.interventionCompleted,
          interventionHistory: categoryData.interventionHistory
        },
        interventionResults: interventionResults.map(ir => ({
          _id: ir._id,
          revisionNumber: ir.revisionNumber,
          score: ir.score,
          isPassed: ir.isPassed,
          assessmentDate: ir.assessmentDate,
          completedAt: ir.completedAt
        }))
      }
    });

  } catch (error) {
    console.error('[DATA MIGRATION API] Student data retrieval failed:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve student data',
      error: error.message
    });
  }
});

module.exports = router;