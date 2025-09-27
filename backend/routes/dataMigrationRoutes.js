/**
 * API routes for data migration and fixing
 */

const express = require('express');
const router = express.Router();

// Import models directly to avoid the import issue
const mongoose = require('mongoose');

// Import the data migration functions - commented out due to model import issues
// const {
//   runDataMigration,
//   findProblematicCategoryResults,
//   validateFixForStudent
// } = require('../../fix_category_results_data');

/**
 * DEBUG: Find all intervention results for a specific student
 */
router.get('/debug/intervention-results/:studentId', async (req, res) => {
  try {
    const { studentId } = req.params;
    console.log(`[DEBUG] Finding all intervention results for student ${studentId}...`);

    // Direct database query using existing connection
    const db = mongoose.connection.db;

    // Find all intervention_results for this student
    const interventionResults = await db.collection('intervention_results').find({
      studentId: parseInt(studentId)
    }).sort({ createdAt: 1 }).toArray();

    console.log(`[DEBUG] Found ${interventionResults.length} intervention results for student ${studentId}`);

    // Also find intervention_assessment data
    const interventionAssessments = await db.collection('intervention_assessment').find({
      studentId: parseInt(studentId)
    }).sort({ createdAt: 1 }).toArray();

    console.log(`[DEBUG] Found ${interventionAssessments.length} intervention assessments for student ${studentId}`);

    // Find category_results for this student
    const categoryResults = await db.collection('category_results').find({
      studentId: parseInt(studentId)
    }).sort({ createdAt: 1 }).toArray();

    console.log(`[DEBUG] Found ${categoryResults.length} category results for student ${studentId}`);

    res.json({
      success: true,
      studentId: parseInt(studentId),
      data: {
        interventionResults: interventionResults.map(ir => ({
          _id: ir._id,
          category: ir.category,
          score: ir.score,
          isPassed: ir.isPassed,
          revisionNumber: ir.revisionNumber,
          readingLevel: ir.readingLevel,
          assessmentDate: ir.assessmentDate,
          completedAt: ir.completedAt,
          interventionAssessmentId: ir.interventionAssessmentId
        })),
        interventionAssessments: interventionAssessments.map(ia => ({
          _id: ia._id,
          category: ia.category,
          revisionNumber: ia.revisionNumber,
          readingLevel: ia.readingLevel,
          createdAt: ia.createdAt,
          lastEditedAt: ia.lastEditedAt,
          interventionResults: ia.interventionResults || []
        })),
        categoryResults: categoryResults.map(cr => ({
          _id: cr._id,
          readingLevel: cr.readingLevel,
          categories: cr.categories.map(cat => ({
            categoryName: cat.categoryName,
            interventionAttempts: cat.interventionAttempts,
            interventionCompleted: cat.interventionCompleted,
            interventionHistory: cat.interventionHistory || []
          }))
        }))
      }
    });

  } catch (error) {
    console.error('[DEBUG] Failed to find intervention data:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to find intervention data',
      error: error.message
    });
  }
});

// Commented out routes that depend on problematic imports
// TODO: Re-enable once model import issues are resolved

/*
router.get('/check', async (req, res) => {
  // Implementation commented out due to import issues
  res.status(503).json({
    success: false,
    message: 'Service temporarily unavailable due to import issues'
  });
});

router.post('/fix', async (req, res) => {
  // Implementation commented out due to import issues
  res.status(503).json({
    success: false,
    message: 'Service temporarily unavailable due to import issues'
  });
});

router.get('/validate/:studentId', async (req, res) => {
  // Implementation commented out due to import issues
  res.status(503).json({
    success: false,
    message: 'Service temporarily unavailable due to import issues'
  });
});

router.get('/student/:studentId/category/:category', async (req, res) => {
  // Implementation commented out due to import issues
  res.status(503).json({
    success: false,
    message: 'Service temporarily unavailable due to import issues'
  });
});
*/

module.exports = router;