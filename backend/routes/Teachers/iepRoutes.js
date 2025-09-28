const express = require('express');
const router = express.Router();
const CategoryResult = require('../../models/Teachers/ManageProgress/categoryResultModel');
const User = require('../../models/userModel');
const IEPReport = require('../../models/Teachers/ManageProgress/iepReportModel');

/**
 * Get IEP report by student ID
 * GET /api/iep/student/:studentId
 */
router.get('/student/:studentId', async (req, res) => {
  try {
    const { studentId } = req.params;

    console.log(`[IEP GET] Fetching IEP report for student ${studentId}`);

    // Try to find by ObjectId first (frontend format)
    let iepReport = null;
    try {
      iepReport = await IEPReport.findOne({ studentId: studentId });
    } catch (error) {
      // If ObjectId fails, try by studentNumber (numeric format)
      const user = await User.findOne({ idNumber: parseInt(studentId) });
      if (user) {
        iepReport = await IEPReport.findOne({ studentId: user._id });
      }
    }

    if (!iepReport) {
      console.log(`[IEP GET] No IEP report found for student ${studentId}`);
      return res.status(404).json({
        success: false,
        error: 'IEP report not found for this student'
      });
    }

    console.log(`[IEP GET] ✅ Found IEP report for student ${studentId}`);
    res.json({
      success: true,
      data: iepReport
    });

  } catch (error) {
    console.error('[IEP GET] Error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * Refresh intervention data for a student
 * POST /api/iep/student/:studentId/refresh-interventions
 */
router.post('/student/:studentId/refresh-interventions', async (req, res) => {
  try {
    const { studentId } = req.params;

    console.log(`[IEP REFRESH] Refreshing intervention data for student ${studentId}`);

    // Try to find by ObjectId first (frontend format)
    let iepReport = null;
    try {
      iepReport = await IEPReport.findOne({ studentId: studentId });
    } catch (error) {
      // If ObjectId fails, try by studentNumber (numeric format)
      const user = await User.findOne({ idNumber: parseInt(studentId) });
      if (user) {
        iepReport = await IEPReport.findOne({ studentId: user._id });
      }
    }

    if (!iepReport) {
      console.log(`[IEP REFRESH] No IEP report found for student ${studentId}`);
      return res.status(404).json({
        success: false,
        error: 'IEP report not found for this student'
      });
    }

    // Update the updatedAt timestamp to indicate refresh
    iepReport.updatedAt = new Date();
    await iepReport.save();

    console.log(`[IEP REFRESH] ✅ Refreshed intervention data for student ${studentId}`);
    res.json({
      success: true,
      message: 'Intervention data refreshed successfully',
      data: iepReport
    });

  } catch (error) {
    console.error('[IEP REFRESH] Error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * Progress student to next reading level
 * DELETE old category_results + CREATE fresh ones for new level
 */
router.post('/progress-reading-level/:studentId', async (req, res) => {
  try {
    const { studentId } = req.params;

    console.log(`[IEP PROGRESSION] Processing reading level progression for student ${studentId}`);

    // Step 1: Get current user and validate
    const user = await User.findOne({ idNumber: parseInt(studentId) });
    if (!user) {
      return res.status(404).json({ success: false, error: 'Student not found' });
    }

    const currentLevel = user.readingLevel;
    console.log(`[IEP PROGRESSION] Current reading level: ${currentLevel}`);

    // Step 2: Determine next reading level
    const levels = ['Low Emerging', 'High Emerging', 'Developing', 'Transitioning', 'At Grade Level'];
    const currentIndex = levels.indexOf(currentLevel);

    if (currentIndex === -1) {
      return res.status(400).json({ success: false, error: 'Invalid current reading level' });
    }

    if (currentIndex >= levels.length - 1) {
      return res.status(400).json({ success: false, error: 'Student is already at the highest reading level' });
    }

    const nextLevel = levels[currentIndex + 1];
    console.log(`[IEP PROGRESSION] Next reading level: ${nextLevel}`);

    // Step 3: Validate student is ready for progression (all categories passed)
    const currentCategoryResults = await CategoryResult.find({
      studentId: parseInt(studentId),
      readingLevel: currentLevel
    });

    if (currentCategoryResults.length === 0) {
      return res.status(400).json({ success: false, error: 'No assessment data found for current reading level' });
    }

    // Check if all categories are completed and passed
    const allCategoriesPassed = currentCategoryResults.every(result =>
      result.categories.every(cat => cat.isCompleted && cat.isPassed)
    );

    if (!allCategoriesPassed) {
      return res.status(400).json({
        success: false,
        error: 'Student must complete and pass all categories before progressing to the next reading level'
      });
    }

    console.log(`[IEP PROGRESSION] ✅ Student eligible for progression - all categories passed`);

    // Step 4: DELETE old category_results records (the problematic data)
    const deleteResult = await CategoryResult.deleteMany({
      studentId: parseInt(studentId)
    });
    console.log(`[IEP PROGRESSION] 🗑️ Deleted ${deleteResult.deletedCount} old category_results records`);

    // Step 5: UPDATE user reading level
    await User.updateOne(
      { idNumber: parseInt(studentId) },
      {
        $set: {
          readingLevel: nextLevel,
          updatedAt: new Date()
        }
      }
    );
    console.log(`[IEP PROGRESSION] ✅ Updated user reading level: ${currentLevel} → ${nextLevel}`);

    // Step 6: CREATE fresh category_results for new reading level
    const requiredCategories = getCategoriesForLevel(nextLevel);
    const totalQuestions = await getQuestionCountsFromMainAssessment(nextLevel);

    const freshCategoryResult = new CategoryResult({
      studentId: parseInt(studentId),
      assessmentDate: new Date(),  // Required field
      readingLevel: nextLevel,
      categories: requiredCategories.map(categoryName => ({
        categoryName,
        totalQuestions: totalQuestions[categoryName] || 0,
        correctAnswers: 0,
        score: 0,
        isPassed: false,
        isCompleted: false,
        interventionRequired: false,
        interventionCompleted: false,
        interventionHistory: [] // Fresh start
      })),
      overallScore: 0,
      completedCategories: 0,
      totalCategories: requiredCategories.length,  // Required field
      allCategoriesPassed: false,
      readingLevelUpdated: false,
      createdAt: new Date(),
      updatedAt: new Date()
    });

    await freshCategoryResult.save();
    console.log(`[IEP PROGRESSION] ✅ Created fresh category_results for ${nextLevel} level with ${requiredCategories.length} categories`);

    res.json({
      success: true,
      message: `Student successfully progressed from ${currentLevel} to ${nextLevel}`,
      previousLevel: currentLevel,
      newReadingLevel: nextLevel,
      categoriesCreated: requiredCategories,
      preservedData: [
        'intervention_results',
        'intervention_assessment',
        'prescriptive_analysis',
        'user reading level progression history'
      ]
    });

  } catch (error) {
    console.error('[IEP PROGRESSION] Error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * Reset student assessment data (category_results only)
 * DELETE old category_results + CREATE fresh ones for current level
 */
router.post('/reset-student-data/:studentId', async (req, res) => {
  try {
    const { studentId } = req.params;

    console.log(`[IEP RESET] Processing assessment data reset for student ${studentId}`);

    // Step 1: Get current user reading level
    const user = await User.findOne({ idNumber: parseInt(studentId) });
    if (!user) {
      return res.status(404).json({ success: false, error: 'Student not found' });
    }

    console.log(`[IEP RESET] Current reading level: ${user.readingLevel}`);

    // Step 2: DELETE old category_results records (the problematic data)
    const deleteResult = await CategoryResult.deleteMany({
      studentId: parseInt(studentId)
    });
    console.log(`[IEP RESET] 🗑️ Deleted ${deleteResult.deletedCount} old category_results records`);

    // Step 3: CREATE fresh category_results with current reading level
    const requiredCategories = getCategoriesForLevel(user.readingLevel);
    const totalQuestions = await getQuestionCountsFromMainAssessment(user.readingLevel);

    const freshCategoryResult = new CategoryResult({
      studentId: parseInt(studentId),
      assessmentDate: new Date(),  // Required field
      readingLevel: user.readingLevel,
      categories: requiredCategories.map(categoryName => ({
        categoryName,
        totalQuestions: totalQuestions[categoryName] || 0,
        correctAnswers: 0,
        score: 0,
        isPassed: false,
        isCompleted: false,
        interventionRequired: false,
        interventionCompleted: false,
        interventionHistory: [] // Fresh start
      })),
      overallScore: 0,
      completedCategories: 0,
      totalCategories: requiredCategories.length,  // Required field
      allCategoriesPassed: false,
      readingLevelUpdated: false,
      createdAt: new Date(),
      updatedAt: new Date()
    });

    await freshCategoryResult.save();
    console.log(`[IEP RESET] ✅ Created fresh category_results for ${user.readingLevel} level with ${requiredCategories.length} categories`);

    res.json({
      success: true,
      message: `Successfully reset assessment data for student ${studentId}`,
      readingLevel: user.readingLevel,
      categoriesReset: requiredCategories,
      deletedRecords: deleteResult.deletedCount,
      preservedData: [
        'intervention_results - All intervention history preserved',
        'intervention_assessment - All teacher-created interventions preserved',
        'prescriptive_analysis - All diagnostic insights preserved',
        'users - Reading level progression history preserved',
        'All other collections - Unchanged'
      ]
    });

  } catch (error) {
    console.error('[IEP RESET] Error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * Helper function: Get required categories for reading level
 */
function getCategoriesForLevel(readingLevel) {
  const levelCategories = {
    'Low Emerging': ['Alphabet Knowledge'],
    'High Emerging': ['Alphabet Knowledge', 'Phonological Awareness'],
    'Developing': ['Alphabet Knowledge', 'Phonological Awareness', 'Decoding'],
    'Transitioning': ['Alphabet Knowledge', 'Phonological Awareness', 'Decoding', 'Word Recognition'],
    'At Grade Level': ['Alphabet Knowledge', 'Phonological Awareness', 'Decoding', 'Word Recognition', 'Reading Comprehension']
  };
  return levelCategories[readingLevel] || [];
}

/**
 * Helper function: Get question counts from main_assessment
 */
async function getQuestionCountsFromMainAssessment(readingLevel) {
  try {
    const MainAssessment = require('../../models/Teachers/mainAssessmentModel');
    const assessments = await MainAssessment.find({ readingLevel, isActive: true });
    const counts = {};

    assessments.forEach(assessment => {
      counts[assessment.category] = assessment.questions?.length || 0;
    });

    console.log(`[QUESTION COUNTS] Found question counts for ${readingLevel}:`, counts);
    return counts;
  } catch (error) {
    console.error('[QUESTION COUNTS] Error getting question counts:', error);
    return {};
  }
}

module.exports = router;