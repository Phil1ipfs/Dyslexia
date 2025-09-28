const express = require('express');
const router = express.Router();
const CategoryResultsFixService = require('../../services/Teachers/CategoryResultsFixService');
const CategoryResultsService = require('../../services/Teachers/CategoryResultsService');

/**
 * Route to manually trigger category results fix
 */
router.post('/fix-all', async (req, res) => {
  try {
    console.log('[CATEGORY FIX API] Manual fix triggered');
    const result = await CategoryResultsFixService.fixAllCategoryResults();
    res.json(result);
  } catch (error) {
    console.error('[CATEGORY FIX API] Error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * Route to fix specific student's category results
 */
router.post('/fix-student/:studentId', async (req, res) => {
  try {
    const { studentId } = req.params;
    console.log(`[CATEGORY FIX API] Manual fix triggered for student ${studentId}`);
    const result = await CategoryResultsFixService.fixStudentCategoryResults(parseInt(studentId));
    res.json(result);
  } catch (error) {
    console.error('[CATEGORY FIX API] Error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * Route to fix dynamic category completion detection
 * ✅ NEW: Fixes categories scoring ≥75% that should not require intervention
 */
router.post('/fix-dynamic-completion', async (req, res) => {
  try {
    console.log('[DYNAMIC COMPLETION FIX API] Manual dynamic completion fix triggered');
    const result = await CategoryResultsService.fixDynamicCategoryCompletion();
    res.json(result);
  } catch (error) {
    console.error('[DYNAMIC COMPLETION FIX API] Error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * Route to fix dynamic category completion for specific student
 * ✅ NEW: Fixes categories scoring ≥75% for a specific student
 */
router.post('/fix-dynamic-completion/:studentId', async (req, res) => {
  try {
    const { studentId } = req.params;
    console.log(`[DYNAMIC COMPLETION FIX API] Manual dynamic completion fix triggered for student ${studentId}`);
    const result = await CategoryResultsService.fixDynamicCategoryCompletion(parseInt(studentId));
    res.json(result);
  } catch (error) {
    console.error('[DYNAMIC COMPLETION FIX API] Error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * Route to test and fix overall score calculation for intervention completion
 */
router.post('/test-intervention-score/:studentId/:category', async (req, res) => {
  try {
    const { studentId, category } = req.params;
    const { interventionScore } = req.body;

    console.log(`[INTERVENTION SCORE TEST] Testing intervention score fix for student ${studentId}, category ${category}, score ${interventionScore}%`);

    // Get current category results before fix
    const CategoryResult = require('../../models/Teachers/ManageProgress/categoryResultModel');
    const beforeResults = await CategoryResult.find({
      studentId: parseInt(studentId),
      'categories.categoryName': category
    }).sort({ createdAt: -1 });

    const beforeData = beforeResults.map(result => ({
      readingLevel: result.readingLevel,
      overallScore: result.overallScore,
      categoryScore: result.categories.find(c => c.categoryName === category)?.score,
      categoryPassed: result.categories.find(c => c.categoryName === category)?.isPassed,
      interventionHistory: result.categories.find(c => c.categoryName === category)?.interventionHistory
    }));

    console.log(`[INTERVENTION SCORE TEST] Before fix:`, JSON.stringify(beforeData, null, 2));

    // Get user's current reading level for proper category targeting
    const User = require('../../models/userModel');
    const user = await User.findOne({ idNumber: parseInt(studentId) });
    const readingLevel = user ? user.readingLevel : null;

    console.log(`[INTERVENTION SCORE TEST] User reading level: ${readingLevel}`);

    // Apply the intervention fix
    const mongoose = require('mongoose');

    // Use the actual existing intervention result ID for student 202533333
    let actualInterventionResultId;
    if (parseInt(studentId) === 202533333 && category === 'Phonological Awareness') {
      // Use the existing intervention result ID that has an intervention assessment
      actualInterventionResultId = new mongoose.Types.ObjectId('68d85df47794011dd9b3532e');
      console.log(`[INTERVENTION SCORE TEST] Using actual intervention result ID: ${actualInterventionResultId}`);
    } else {
      actualInterventionResultId = new mongoose.Types.ObjectId(); // Mock for other tests
    }

    const result = await CategoryResultsService.updateCategoryFromIntervention(
      parseInt(studentId),
      category,
      interventionScore || 100, // Default to 100% if not provided
      actualInterventionResultId, // Use actual intervention result ID when available
      readingLevel // 🎯 FIX: Pass reading level to prevent cross-level contamination
    );

    // Get updated results after fix
    const afterResults = await CategoryResult.find({
      studentId: parseInt(studentId),
      'categories.categoryName': category
    }).sort({ createdAt: -1 });

    const afterData = afterResults.map(result => ({
      readingLevel: result.readingLevel,
      overallScore: result.overallScore,
      categoryScore: result.categories.find(c => c.categoryName === category)?.score,
      categoryPassed: result.categories.find(c => c.categoryName === category)?.isPassed,
      interventionHistory: result.categories.find(c => c.categoryName === category)?.interventionHistory
    }));

    console.log(`[INTERVENTION SCORE TEST] After fix:`, JSON.stringify(afterData, null, 2));

    res.json({
      success: true,
      message: `Intervention score fix applied for student ${studentId}, category ${category}`,
      before: beforeData,
      after: afterData,
      updateResult: result
    });
  } catch (error) {
    console.error('[INTERVENTION SCORE TEST] Error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * Route to fix specific student's intervention score data issues
 * ✅ NEW: Fixes student 202533333's intervention score reflection issue
 */
router.post('/fix-student-intervention-scores/:studentId', async (req, res) => {
  try {
    const { studentId } = req.params;
    console.log(`[INTERVENTION SCORE FIX] Manual intervention score fix triggered for student ${studentId}`);

    const CategoryResult = require('../../models/Teachers/ManageProgress/categoryResultModel');
    const User = require('../../models/userModel');

    // Step 1: Get all category results for this student
    const categoryResults = await CategoryResult.find({
      studentId: parseInt(studentId)
    }).sort({ createdAt: -1 });

    console.log(`[INTERVENTION SCORE FIX] Found ${categoryResults.length} category result records for student ${studentId}`);

    let fixedRecords = 0;
    let issuesFound = [];

    for (const categoryResult of categoryResults) {
      console.log(`[INTERVENTION SCORE FIX] Checking record: ${categoryResult.readingLevel} (readingLevelUpdated: ${categoryResult.readingLevelUpdated})`);

      let recordChanged = false;

      for (let i = 0; i < categoryResult.categories.length; i++) {
        const category = categoryResult.categories[i];

        // Check if category has successful intervention but score not updated
        if (category.interventionHistory && category.interventionHistory.length > 0) {
          const successfulInterventions = category.interventionHistory.filter(h => h.isPassed === true);

          if (successfulInterventions.length > 0) {
            const highestInterventionScore = Math.max(...successfulInterventions.map(h => h.score || 0));
            const originalScore = category.score || 0;

            if (highestInterventionScore > originalScore) {
              console.log(`[INTERVENTION SCORE FIX] 🔄 Updating ${category.categoryName}: ${originalScore}% → ${highestInterventionScore}% (intervention score)`);

              // 🔒 PRESERVE ORIGINAL DATA - Update intervention status only
              console.log(`[INTERVENTION FIX] 🔒 PRESERVING original assessment: score=${categoryResult.categories[i].score}%, isPassed=${categoryResult.categories[i].isPassed}`);
              console.log(`[INTERVENTION FIX] ✅ Intervention success (${highestInterventionScore}%) tracked in history only`);

              // ❌ REMOVED: categoryResult.categories[i].score = highestInterventionScore;  // PRESERVE original score
              // ❌ REMOVED: categoryResult.categories[i].isPassed = true;  // PRESERVE original isPassed
              categoryResult.categories[i].interventionCompleted = true;
              categoryResult.categories[i].interventionRequired = false;

              recordChanged = true;
              issuesFound.push({
                record: categoryResult.readingLevel,
                category: category.categoryName,
                originalScore: originalScore,
                updatedScore: highestInterventionScore,
                action: 'intervention_score_applied'
              });
            }
          }
        }
      }

      // Recalculate overall score if record changed
      if (recordChanged) {
        const CategoryResultsService = require('../../services/Teachers/CategoryResultsService');
        const overallStats = CategoryResultsService.calculateOverallStats(categoryResult.categories);
        categoryResult.overallScore = overallStats.overallScore;
        categoryResult.completedCategories = overallStats.passedCategories;
        categoryResult.allCategoriesPassed = overallStats.passedCategories === categoryResult.categories.length;

        console.log(`[INTERVENTION SCORE FIX] 📊 Recalculated overall score: ${overallStats.overallScore}% (${overallStats.passedCategories}/${categoryResult.categories.length} categories passed)`);

        await categoryResult.save();
        fixedRecords++;
      }
    }

    // Step 2: Check for progression eligibility after fixes
    const student = await User.findOne({ idNumber: parseInt(studentId) });
    let progressionResult = null;

    if (student) {
      const ReadingLevelProgressionService = require('../../services/ReadingLevelProgressionService');
      progressionResult = await ReadingLevelProgressionService.checkAndProgressReadingLevel(
        parseInt(studentId),
        student.readingLevel
      );
    }

    res.json({
      success: true,
      message: `Intervention score fix completed for student ${studentId}`,
      fixedRecords: fixedRecords,
      issuesFound: issuesFound,
      progressionResult: progressionResult,
      studentCurrentLevel: student?.readingLevel
    });

  } catch (error) {
    console.error('[INTERVENTION SCORE FIX] Error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * Route to clean up cross-level contamination for specific student
 * ✅ NEW: Removes intervention attempts that were incorrectly saved to wrong reading level records
 */
router.post('/cleanup-contamination/:studentId', async (req, res) => {
  try {
    const { studentId } = req.params;
    console.log(`[CONTAMINATION CLEANUP API] Manual contamination cleanup triggered for student ${studentId}`);
    const result = await CategoryResultsService.cleanupCrossLevelContamination(parseInt(studentId));
    res.json(result);
  } catch (error) {
    console.error('[CONTAMINATION CLEANUP API] Error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * Route to clean up cross-level contamination for ALL students
 * ✅ NEW: Removes intervention attempts that were incorrectly saved to wrong reading level records
 */
router.post('/cleanup-contamination-all', async (req, res) => {
  try {
    console.log(`[CONTAMINATION CLEANUP API] Manual contamination cleanup triggered for ALL students`);

    const CategoryResultsService = require('../../services/Teachers/CategoryResultsService');
    const User = require('../../models/userModel');

    // Get all students with valid reading levels
    const allStudents = await User.find({
      readingLevel: { $in: ['Low Emerging', 'High Emerging', 'Developing', 'Transitioning', 'At Grade Level'] }
    });

    let totalCleanupActions = 0;
    let cleanedStudents = 0;
    let results = [];

    for (const student of allStudents) {
      const cleanupResult = await CategoryResultsService.cleanupCrossLevelContamination(student.idNumber);

      if (cleanupResult.success && cleanupResult.cleanupActions.length > 0) {
        cleanedStudents++;
        totalCleanupActions += cleanupResult.cleanupActions.length;
        results.push({
          studentId: student.idNumber,
          cleanupActions: cleanupResult.cleanupActions.length,
          details: cleanupResult.cleanupActions
        });
      }
    }

    res.json({
      success: true,
      message: `Contamination cleanup completed for all students`,
      studentsChecked: allStudents.length,
      studentsWithContamination: cleanedStudents,
      totalCleanupActions: totalCleanupActions,
      cleanupResults: results
    });
  } catch (error) {
    console.error('[CONTAMINATION CLEANUP API] Error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * Route to get fix status
 */
router.get('/status', async (req, res) => {
  try {
    res.json({
      success: true,
      message: 'Category Results Fix Service is running',
      timestamp: new Date(),
      features: [
        'Category intervention fix',
        'Dynamic completion detection fix',
        'Intervention score testing'
      ]
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

module.exports = router;