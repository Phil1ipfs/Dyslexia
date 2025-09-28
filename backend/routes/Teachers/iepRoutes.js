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

    // Step 1: Find student by ID (try both ObjectId and numeric formats)
    let user = null;
    let userObjectId = null;

    try {
      // Try to find user by ObjectId first
      user = await User.findById(studentId);
      userObjectId = studentId;
    } catch (error) {
      // If ObjectId fails, try by idNumber (numeric format)
      try {
        user = await User.findOne({ idNumber: parseInt(studentId) });
        userObjectId = user ? user._id : null;
      } catch (parseError) {
        console.log(`[IEP GET] Could not parse studentId as number: ${studentId}`);
      }
    }

    if (!user || !userObjectId) {
      console.log(`[IEP GET] ❌ Student not found: ${studentId}`);
      return res.status(404).json({
        success: false,
        error: 'Student not found'
      });
    }

    console.log(`[IEP GET] ✅ Found student: ${user.firstName} ${user.lastName} (ID: ${user.idNumber})`);

    // Step 2: Find or create IEP report
    let iepReport = await IEPReport.findOne({ studentId: userObjectId });

    if (!iepReport) {
      console.log(`[IEP GET] 📋 No IEP report found - creating new one using AutomaticIEPReportGenerator`);

      // Get category results for the student
      const categoryResults = await CategoryResult.find({ studentId: user.idNumber }).sort({ updatedAt: -1 });

      if (categoryResults.length === 0) {
        console.log(`[IEP GET] ⚠️ No category results found for student ${user.idNumber} - cannot create IEP report`);
        return res.status(404).json({
          success: false,
          error: 'No assessment data found for this student'
        });
      }

      // Find the most recent COMPLETED assessment (not placeholder)
      // Priority: readingLevelUpdated=true (progression completed) > allCategoriesPassed=true > latest
      const completedCategoryResult = categoryResults.find(result =>
        result.readingLevelUpdated === true || result.allCategoriesPassed === true
      ) || categoryResults[0];

      console.log(`[IEP GET] 📊 Using category result: ${completedCategoryResult.readingLevel} (readingLevelUpdated: ${completedCategoryResult.readingLevelUpdated}, allCategoriesPassed: ${completedCategoryResult.allCategoriesPassed})`);
      console.log(`[IEP GET] 🐛 DEBUG categoryResult.studentId: ${completedCategoryResult.studentId}`);
      console.log(`[IEP GET] 🐛 DEBUG categoryResult keys:`, Object.keys(completedCategoryResult));

      // Convert Mongoose object to plain object to ensure studentId is accessible
      const categoryResultPlain = completedCategoryResult.toObject ? completedCategoryResult.toObject() : completedCategoryResult;
      console.log(`[IEP GET] 🐛 DEBUG plain object studentId: ${categoryResultPlain.studentId}`);

      // Use the automatic IEP generator service
      const AutomaticIEPReportGenerator = require('../../services/AutomaticIEPReportGenerator');
      const generationResult = await AutomaticIEPReportGenerator.generateOrUpdateIEPReport(categoryResultPlain, 'api_request');

      console.log(`[IEP GET] 🐛 DEBUG generationResult:`, JSON.stringify(generationResult, null, 2));

      if (generationResult && generationResult.success) {
        iepReport = generationResult.iepReport;
        console.log(`[IEP GET] ✅ Created new IEP report for student ${user.idNumber}`);
      } else {
        const errorMessage = generationResult?.error || 'Unknown error - generationResult was null or undefined';
        console.log(`[IEP GET] ❌ Failed to create IEP report: ${errorMessage}`);
        return res.status(500).json({
          success: false,
          error: `Failed to create IEP report: ${errorMessage}`
        });
      }
    }

    console.log(`[IEP GET] ✅ Found IEP report for student ${user.idNumber}`);
    res.json({
      success: true,
      data: iepReport,
      studentInfo: {
        idNumber: user.idNumber,
        name: `${user.firstName} ${user.lastName}`,
        readingLevel: user.readingLevel
      }
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

    // Step 1: Find student by ID (try both ObjectId and numeric formats)
    let user = null;
    let userObjectId = null;

    try {
      // Try to find user by ObjectId first
      user = await User.findById(studentId);
      userObjectId = studentId;
    } catch (error) {
      // If ObjectId fails, try by idNumber (numeric format)
      try {
        user = await User.findOne({ idNumber: parseInt(studentId) });
        userObjectId = user ? user._id : null;
      } catch (parseError) {
        console.log(`[IEP REFRESH] Could not parse studentId as number: ${studentId}`);
      }
    }

    if (!user || !userObjectId) {
      console.log(`[IEP REFRESH] ❌ Student not found: ${studentId}`);
      return res.status(404).json({
        success: false,
        error: 'Student not found'
      });
    }

    console.log(`[IEP REFRESH] ✅ Found student: ${user.firstName} ${user.lastName} (ID: ${user.idNumber})`);

    // Step 2: Find or create IEP report
    let iepReport = await IEPReport.findOne({ studentId: userObjectId });

    if (!iepReport) {
      console.log(`[IEP REFRESH] 📋 No IEP report found - creating new one using AutomaticIEPReportGenerator`);

      // Get category results for the student
      const categoryResults = await CategoryResult.find({ studentId: user.idNumber }).sort({ updatedAt: -1 });

      if (categoryResults.length === 0) {
        console.log(`[IEP REFRESH] ⚠️ No category results found for student ${user.idNumber} - cannot create IEP report`);
        return res.status(404).json({
          success: false,
          error: 'No assessment data found for this student'
        });
      }

      // Find the most recent COMPLETED assessment (not placeholder)
      // Priority: readingLevelUpdated=true (progression completed) > allCategoriesPassed=true > latest
      const completedCategoryResult = categoryResults.find(result =>
        result.readingLevelUpdated === true || result.allCategoriesPassed === true
      ) || categoryResults[0];

      console.log(`[IEP REFRESH] 📊 Using category result: ${completedCategoryResult.readingLevel} (readingLevelUpdated: ${completedCategoryResult.readingLevelUpdated}, allCategoriesPassed: ${completedCategoryResult.allCategoriesPassed})`);
      console.log(`[IEP REFRESH] 🐛 DEBUG categoryResult.studentId: ${completedCategoryResult.studentId}`);
      console.log(`[IEP REFRESH] 🐛 DEBUG categoryResult type:`, typeof completedCategoryResult.studentId);

      // Convert Mongoose object to plain object to ensure studentId is accessible
      const categoryResultPlain = completedCategoryResult.toObject ? completedCategoryResult.toObject() : completedCategoryResult;
      console.log(`[IEP REFRESH] 🐛 DEBUG plain object studentId: ${categoryResultPlain.studentId}`);

      // Use the automatic IEP generator service
      const AutomaticIEPReportGenerator = require('../../services/AutomaticIEPReportGenerator');
      const generatedReport = await AutomaticIEPReportGenerator.generateOrUpdateIEPReport(categoryResultPlain, 'api_request');

      console.log(`[IEP REFRESH] 🐛 DEBUG generatedReport:`, JSON.stringify(generatedReport, null, 2));

      if (generatedReport && generatedReport.success) {
        iepReport = generatedReport.iepReport;
        console.log(`[IEP REFRESH] ✅ Created new IEP report for student ${user.idNumber}`);
      } else {
        const errorMessage = generatedReport?.error || 'Unknown error - generatedReport was null or undefined';
        console.log(`[IEP REFRESH] ❌ Failed to create IEP report: ${errorMessage}`);
        return res.status(500).json({
          success: false,
          error: `Failed to create IEP report: ${errorMessage}`
        });
      }
    } else {
      console.log(`[IEP REFRESH] 📋 Found existing IEP report - updating with latest data`);

      // Get latest category results for update
      const categoryResults = await CategoryResult.find({ studentId: user.idNumber }).sort({ updatedAt: -1 });

      if (categoryResults.length > 0) {
        // Find the most recent COMPLETED assessment (not placeholder)
        // Priority: readingLevelUpdated=true (progression completed) > allCategoriesPassed=true > latest
        const completedCategoryResult = categoryResults.find(result =>
          result.readingLevelUpdated === true || result.allCategoriesPassed === true
        ) || categoryResults[0];

        console.log(`[IEP REFRESH] 📊 Updating with category result: ${completedCategoryResult.readingLevel} (readingLevelUpdated: ${completedCategoryResult.readingLevelUpdated}, allCategoriesPassed: ${completedCategoryResult.allCategoriesPassed})`);

        // Convert Mongoose object to plain object to ensure studentId is accessible
        const categoryResultPlain = completedCategoryResult.toObject ? completedCategoryResult.toObject() : completedCategoryResult;

        // Update existing IEP report with latest data
        const AutomaticIEPReportGenerator = require('../../services/AutomaticIEPReportGenerator');
        const updatedReport = await AutomaticIEPReportGenerator.generateOrUpdateIEPReport(categoryResultPlain, 'api_update');

        console.log(`[IEP REFRESH] 🐛 DEBUG updatedReport:`, JSON.stringify(updatedReport, null, 2));

        if (updatedReport && updatedReport.success) {
          iepReport = updatedReport.iepReport;
          console.log(`[IEP REFRESH] ✅ Updated existing IEP report for student ${user.idNumber}`);
        } else {
          const errorMessage = updatedReport?.error || 'Unknown error - updatedReport was null or undefined';
          console.log(`[IEP REFRESH] ⚠️ Update failed (${errorMessage}), using existing report`);
          // Continue with existing report if update fails
          iepReport.updatedAt = new Date();
          await iepReport.save();
        }
      } else {
        // No category results found, just update timestamp
        iepReport.updatedAt = new Date();
        await iepReport.save();
        console.log(`[IEP REFRESH] ⚠️ No category results found, updated timestamp only`);
      }
    }

    console.log(`[IEP REFRESH] ✅ Refreshed intervention data for student ${user.idNumber}`);
    res.json({
      success: true,
      message: 'Intervention data refreshed successfully',
      data: iepReport,
      studentInfo: {
        idNumber: user.idNumber,
        name: `${user.firstName} ${user.lastName}`,
        readingLevel: user.readingLevel
      }
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
    // CRITICAL: Must check both main assessment AND intervention success
    const allCategoriesPassed = currentCategoryResults.every(result =>
      result.categories.every(cat => {
        // Category passes if either:
        // 1. Main assessment passed (≥75%)
        // 2. OR intervention completed successfully (intervention passed)
        const mainAssessmentPassed = cat.isCompleted && cat.isPassed && cat.score >= 75;
        const interventionPassed = cat.interventionCompleted &&
          cat.interventionHistory &&
          cat.interventionHistory.length > 0 &&
          cat.interventionHistory.some(attempt => attempt.isPassed === true);

        const categoryComplete = mainAssessmentPassed || interventionPassed;

        console.log(`[PROGRESSION CHECK] ${cat.categoryName}: Main=${mainAssessmentPassed ? 'PASS' : 'FAIL'} (${cat.score}%), Intervention=${interventionPassed ? 'PASS' : 'FAIL'} → ${categoryComplete ? 'READY' : 'NOT READY'}`);

        return categoryComplete;
      })
    );

    if (!allCategoriesPassed) {
      // Provide detailed information about what's blocking progression
      const blockingCategories = [];
      currentCategoryResults.forEach(result =>
        result.categories.forEach(cat => {
          const mainAssessmentPassed = cat.isCompleted && cat.isPassed && cat.score >= 75;
          const interventionPassed = cat.interventionCompleted &&
            cat.interventionHistory &&
            cat.interventionHistory.length > 0 &&
            cat.interventionHistory.some(attempt => attempt.isPassed === true);

          if (!mainAssessmentPassed && !interventionPassed) {
            blockingCategories.push({
              category: cat.categoryName,
              mainScore: cat.score || 0,
              mainPassed: mainAssessmentPassed,
              interventionAttempts: cat.interventionHistory?.length || 0,
              interventionPassed: interventionPassed,
              status: cat.interventionCompleted ? 'intervention_failed' : 'needs_intervention'
            });
          }
        })
      );

      return res.status(400).json({
        success: false,
        error: 'Student must complete and pass all categories before progressing to the next reading level',
        blockingCategories: blockingCategories,
        details: `${blockingCategories.length} categor${blockingCategories.length > 1 ? 'ies' : 'y'} not ready: ${blockingCategories.map(b => b.category).join(', ')}`
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

    // Step 7: Update/Create fresh IEP report for new reading level
    try {
      const IEPReport = require('../../models/Teachers/ManageProgress/iepReportModel');

      // Find existing IEP report and mark as inactive
      await IEPReport.updateMany(
        { studentId: new require('mongoose').Types.ObjectId(user._id), isActive: true },
        { isActive: false, inactiveReason: `Progressed to ${nextLevel} level`, inactiveDate: new Date() }
      );

      // Create new IEP report for the new reading level using the fresh category result
      const AutomaticIEPReportGenerator = require('../../services/AutomaticIEPReportGenerator');
      const newIepResult = await AutomaticIEPReportGenerator.generateOrUpdateIEPReport(
        freshCategoryResult.toObject(),
        'reading_level_progression'
      );

      if (newIepResult && newIepResult.success) {
        console.log(`[IEP PROGRESSION] ✅ Created new IEP report for ${nextLevel} level: ${newIepResult.iepReport._id}`);
      } else {
        console.warn(`[IEP PROGRESSION] ⚠️ Failed to create IEP report for new level: ${newIepResult?.error || 'Unknown error'}`);
      }
    } catch (iepError) {
      console.error('[IEP PROGRESSION] Error updating IEP report:', iepError);
      // Don't fail the progression if IEP update fails
    }

    res.json({
      success: true,
      message: `Student successfully progressed from ${currentLevel} to ${nextLevel}`,
      previousLevel: currentLevel,
      newReadingLevel: nextLevel,
      categoriesCreated: requiredCategories,
      newCategoryResult: freshCategoryResult._id,
      preservedData: [
        'intervention_results - All intervention history preserved',
        'intervention_assessment - All teacher-created interventions preserved',
        'prescriptive_analysis - All diagnostic insights preserved',
        'users - Reading level progression history preserved'
      ],
      deletedData: [
        'category_results - Old records deleted and replaced with fresh ones for new level'
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