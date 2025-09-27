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

/**
 * POST /api/data-migration/force-intervention-sync/:studentId
 * Force sync of specific intervention result to category_results
 */
router.post('/force-intervention-sync/:studentId', async (req, res) => {
  try {
    const { studentId } = req.params;
    const { interventionResultId } = req.body;

    console.log(`[FORCE SYNC] Starting forced intervention sync for student ${studentId}...`);

    if (!interventionResultId) {
      return res.status(400).json({
        success: false,
        message: 'interventionResultId is required in request body'
      });
    }

    const db = mongoose.connection.db;

    // Get the intervention result
    const interventionResult = await db.collection('intervention_results').findOne({
      _id: new mongoose.Types.ObjectId(interventionResultId)
    });

    if (!interventionResult) {
      return res.status(404).json({
        success: false,
        message: `Intervention result ${interventionResultId} not found`
      });
    }

    console.log(`[FORCE SYNC] Found intervention result:`, {
      id: interventionResult._id,
      studentId: interventionResult.studentId,
      category: interventionResult.category,
      score: interventionResult.score,
      isPassed: interventionResult.isPassed,
      revisionNumber: interventionResult.revisionNumber
    });

    // Import the service
    const InterventionResultsAnalysisService = require('../services/Teachers/InterventionResultsAnalysisService');

    // Force the sync
    const dataContext = {
      studentId: studentId,
      category: interventionResult.category
    };

    await InterventionResultsAnalysisService.updateCategoryResultsWithIntervention(
      interventionResult,
      dataContext
    );

    res.json({
      success: true,
      message: `Forced intervention sync completed for student ${studentId}`,
      interventionResult: {
        id: interventionResult._id,
        category: interventionResult.category,
        score: interventionResult.score,
        isPassed: interventionResult.isPassed,
        revisionNumber: interventionResult.revisionNumber
      }
    });

  } catch (error) {
    console.error('[FORCE SYNC] Failed to force intervention sync:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to force intervention sync',
      error: error.message
    });
  }
});

/**
 * POST /api/data-migration/fix-cross-level-sync/:studentId
 * Fix cross-reading-level intervention sync issues for a specific student
 */
router.post('/fix-cross-level-sync/:studentId', async (req, res) => {
  try {
    const { studentId } = req.params;
    console.log(`[CROSS-LEVEL FIX] Starting fix for student ${studentId}...`);

    const db = mongoose.connection.db;

    // Step 1: Get all intervention_results for this student
    const interventionResults = await db.collection('intervention_results').find({
      studentId: parseInt(studentId)
    }).toArray();

    console.log(`[CROSS-LEVEL FIX] Found ${interventionResults.length} intervention results`);

    // Step 2: Get all category_results for this student
    const categoryResults = await db.collection('category_results').find({
      studentId: parseInt(studentId)
    }).toArray();

    console.log(`[CROSS-LEVEL FIX] Found ${categoryResults.length} category result records`);

    const fixResults = [];

    // Step 3: Process each intervention result to ensure proper placement
    for (const interventionResult of interventionResults) {
      const targetReadingLevel = interventionResult.readingLevel;
      const category = interventionResult.category;
      const score = interventionResult.score;
      const isPassed = interventionResult.isPassed;
      const revisionNumber = interventionResult.revisionNumber;
      const interventionResultId = interventionResult._id;

      console.log(`[CROSS-LEVEL FIX] Processing: ${category}, Reading Level: ${targetReadingLevel}, Score: ${score}%, Revision: ${revisionNumber}`);

      // Find the correct category_results record for this reading level
      const targetCategoryResult = categoryResults.find(cr => cr.readingLevel === targetReadingLevel);

      if (!targetCategoryResult) {
        console.log(`[CROSS-LEVEL FIX] ⚠️  No category_results found for reading level: ${targetReadingLevel}`);
        continue;
      }

      // Find the category within that record
      const categoryIndex = targetCategoryResult.categories.findIndex(cat => cat.categoryName === category);

      if (categoryIndex === -1) {
        console.log(`[CROSS-LEVEL FIX] ⚠️  Category ${category} not found in ${targetReadingLevel} level`);
        continue;
      }

      const categoryData = targetCategoryResult.categories[categoryIndex];

      // Check if this intervention result is already properly recorded
      const existingEntry = categoryData.interventionHistory?.find(
        hist => hist.interventionResultId?.toString() === interventionResultId.toString()
      );

      if (existingEntry) {
        console.log(`[CROSS-LEVEL FIX] ✅ Already correct: ${category} intervention in ${targetReadingLevel} level`);
        continue;
      }

      // Step 4: Add missing intervention entry to correct reading level
      console.log(`[CROSS-LEVEL FIX] 🔧 Adding missing intervention: ${category} to ${targetReadingLevel} level`);

      const newHistoryEntry = {
        attemptNumber: revisionNumber, // Use revision number as attempt number
        interventionId: interventionResult.interventionAssessmentId,
        interventionResultId: interventionResultId,
        revisionNumber: revisionNumber,
        score: score,
        isPassed: isPassed,
        attemptedAt: interventionResult.assessmentDate,
        completedAt: interventionResult.completedAt,
        attemptReason: revisionNumber > 1 ? 'teacher_revision' : 'initial_attempt'
      };

      // Add to intervention history
      if (!categoryData.interventionHistory) {
        categoryData.interventionHistory = [];
      }
      categoryData.interventionHistory.push(newHistoryEntry);

      // Update intervention status
      categoryData.interventionAttempts = Math.max(categoryData.interventionAttempts || 0, revisionNumber);

      if (isPassed) {
        categoryData.interventionCompleted = true;
        categoryData.interventionRequired = false;
        categoryData.currentInterventionId = null; // Clear since passed
        console.log(`[CROSS-LEVEL FIX] ✅ Marked ${category} as completed via intervention (score: ${score}%)`);
      } else {
        categoryData.interventionCompleted = false;
        categoryData.interventionRequired = true;
        // Keep currentInterventionId for failed interventions
      }

      // Step 5: Save the updated category_results
      await db.collection('category_results').updateOne(
        { _id: targetCategoryResult._id },
        { $set: { categories: targetCategoryResult.categories, updatedAt: new Date() } }
      );

      fixResults.push({
        category: category,
        readingLevel: targetReadingLevel,
        revisionNumber: revisionNumber,
        score: score,
        isPassed: isPassed,
        action: 'added_missing_intervention'
      });

      console.log(`[CROSS-LEVEL FIX] ✅ Updated ${category} in ${targetReadingLevel} level`);
    }

    // Step 6: Clean up incorrectly placed interventions
    console.log(`[CROSS-LEVEL FIX] 🧹 Cleaning up incorrectly placed interventions...`);

    for (const categoryResult of categoryResults) {
      for (let catIndex = 0; catIndex < categoryResult.categories.length; catIndex++) {
        const category = categoryResult.categories[catIndex];
        const categoryName = category.categoryName;
        const readingLevel = categoryResult.readingLevel;

        if (!category.interventionHistory) continue;

        // Check each intervention history entry
        const validHistory = [];
        let needsUpdate = false;

        for (const histEntry of category.interventionHistory) {
          // Find the corresponding intervention_result
          const interventionResult = interventionResults.find(
            ir => ir._id.toString() === histEntry.interventionResultId?.toString()
          );

          if (interventionResult && interventionResult.readingLevel === readingLevel) {
            // This intervention belongs to this reading level - keep it
            validHistory.push(histEntry);
          } else {
            // This intervention belongs to a different reading level - remove it
            console.log(`[CROSS-LEVEL FIX] 🧹 Removing misplaced intervention: ${categoryName} from ${readingLevel} level`);
            needsUpdate = true;
            fixResults.push({
              category: categoryName,
              readingLevel: readingLevel,
              action: 'removed_misplaced_intervention',
              removedScore: histEntry.score
            });
          }
        }

        if (needsUpdate) {
          categoryResult.categories[catIndex].interventionHistory = validHistory;

          // Update intervention status based on remaining valid history
          const hasPassedIntervention = validHistory.some(hist => hist.isPassed);
          if (hasPassedIntervention) {
            categoryResult.categories[catIndex].interventionCompleted = true;
            categoryResult.categories[catIndex].interventionRequired = false;
            categoryResult.categories[catIndex].currentInterventionId = null;
          } else if (validHistory.length > 0) {
            categoryResult.categories[catIndex].interventionCompleted = false;
            categoryResult.categories[catIndex].interventionRequired = true;
          } else {
            // No interventions - reset to initial state
            categoryResult.categories[catIndex].interventionAttempts = 0;
            categoryResult.categories[catIndex].interventionCompleted = false;
            categoryResult.categories[catIndex].interventionRequired = true;
            categoryResult.categories[catIndex].currentInterventionId = null;
          }

          // Save the cleaned category_results
          await db.collection('category_results').updateOne(
            { _id: categoryResult._id },
            { $set: { categories: categoryResult.categories, updatedAt: new Date() } }
          );

          console.log(`[CROSS-LEVEL FIX] ✅ Cleaned up ${categoryName} in ${readingLevel} level`);
        }
      }
    }

    res.json({
      success: true,
      studentId: parseInt(studentId),
      message: `Cross-level intervention sync fixed for student ${studentId}`,
      fixesApplied: fixResults,
      totalFixes: fixResults.length
    });

  } catch (error) {
    console.error('[CROSS-LEVEL FIX] Failed to fix cross-level sync:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fix cross-level intervention sync',
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