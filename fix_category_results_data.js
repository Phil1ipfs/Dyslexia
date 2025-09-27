/**
 * 🔧 DATA MIGRATION SCRIPT: Fix Existing Category Results with Missing Attempt 2 Data
 *
 * Problem: Student 202533333 has revision 2 with 100% score but category_results only shows attempt 1
 * This script will find and fix such cases automatically
 */

const mongoose = require('mongoose');

// Import models
const CategoryResults = require('./backend/models/categoryResultsModel');
const InterventionResults = require('./backend/models/interventionResultsModel');
const InterventionAssessment = require('./backend/models/interventionAssessmentModel');

/**
 * Find all students with missing intervention attempts in category_results
 */
async function findProblematicCategoryResults() {
  console.log('🔍 SCANNING: Looking for category_results with missing intervention attempts...');

  // Find all intervention_results where student passed (score = 100, revision = 2)
  const successfulRevision2Results = await InterventionResults.find({
    revisionNumber: 2,
    isPassed: true,
    score: { $gte: 75 }
  });

  console.log(`📊 Found ${successfulRevision2Results.length} successful revision 2 interventions`);

  const problematicCases = [];

  for (const interventionResult of successfulRevision2Results) {
    const { studentId, category, interventionAssessmentId, score, revisionNumber } = interventionResult;

    // Check corresponding category_results
    const categoryResult = await CategoryResults.findOne({
      studentId: studentId,
      'categories.categoryName': category
    });

    if (categoryResult) {
      const categoryData = categoryResult.categories.find(cat => cat.categoryName === category);

      if (categoryData) {
        const hasAttempt2 = categoryData.interventionHistory.some(entry =>
          entry.attemptNumber === 2 || entry.revisionNumber === 2
        );

        if (!hasAttempt2) {
          console.log(`❌ PROBLEM FOUND: Student ${studentId}, Category ${category}`);
          console.log(`   - Intervention passed with score ${score}% (revision ${revisionNumber})`);
          console.log(`   - But category_results missing attempt 2 entry`);
          console.log(`   - Current history length: ${categoryData.interventionHistory.length}`);

          problematicCases.push({
            studentId,
            category,
            categoryResultId: categoryResult._id,
            categoryIndex: categoryResult.categories.findIndex(cat => cat.categoryName === category),
            interventionResult,
            categoryData,
            missingAttempt: 2
          });
        }
      }
    }
  }

  console.log(`🚨 Total problematic cases found: ${problematicCases.length}`);
  return problematicCases;
}

/**
 * Fix a single problematic category result
 */
async function fixProblematicCategoryResult(problematicCase) {
  const { studentId, category, categoryResultId, categoryIndex, interventionResult, missingAttempt } = problematicCase;

  console.log(`🔧 FIXING: Student ${studentId}, Category ${category}`);

  try {
    const categoryResult = await CategoryResults.findById(categoryResultId);
    if (!categoryResult) {
      throw new Error(`Category result not found: ${categoryResultId}`);
    }

    // Add the missing attempt 2 entry
    const missingEntry = {
      attemptNumber: missingAttempt,
      interventionId: interventionResult.interventionAssessmentId,
      interventionResultId: interventionResult._id,
      revisionNumber: interventionResult.revisionNumber || missingAttempt,
      score: interventionResult.score,
      isPassed: interventionResult.isPassed,
      attemptedAt: interventionResult.assessmentDate,
      completedAt: interventionResult.completedAt,
      attemptReason: missingAttempt > 1 ? 'teacher_revision' : 'initial_attempt'
    };

    // Add to intervention history
    categoryResult.categories[categoryIndex].interventionHistory.push(missingEntry);

    // Update attempt count
    categoryResult.categories[categoryIndex].interventionAttempts = missingAttempt;

    // If intervention passed, mark category as completed
    if (interventionResult.isPassed) {
      categoryResult.categories[categoryIndex].isPassed = true;
      categoryResult.categories[categoryIndex].interventionCompleted = true;
      categoryResult.categories[categoryIndex].interventionRequired = false;
      categoryResult.categories[categoryIndex].currentInterventionId = null;

      console.log(`   ✅ Marked category as PASSED (intervention succeeded)`);
    }

    // Save the fixed category result
    await categoryResult.save();

    console.log(`   ✅ Added missing attempt ${missingAttempt} to intervention history`);
    console.log(`   📊 Score: ${interventionResult.score}%, Passed: ${interventionResult.isPassed}`);

    return {
      success: true,
      studentId,
      category,
      addedAttempt: missingAttempt,
      score: interventionResult.score,
      isPassed: interventionResult.isPassed
    };

  } catch (error) {
    console.error(`   ❌ FAILED to fix student ${studentId}, category ${category}:`, error.message);
    return {
      success: false,
      studentId,
      category,
      error: error.message
    };
  }
}

/**
 * Main migration function
 */
async function runDataMigration() {
  console.log('🚀 STARTING: Category Results Data Migration');
  console.log('=' .repeat(60));

  try {
    // Connect to MongoDB if not already connected
    if (mongoose.connection.readyState !== 1) {
      console.log('📡 Connecting to MongoDB...');
      await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/dyslexia_db');
      console.log('✅ Connected to MongoDB');
    }

    // Step 1: Find problematic cases
    const problematicCases = await findProblematicCategoryResults();

    if (problematicCases.length === 0) {
      console.log('🎉 No problematic cases found! All category_results are correct.');
      return;
    }

    // Step 2: Fix each problematic case
    console.log('\n🔧 FIXING PROBLEMATIC CASES...');
    console.log('-' .repeat(40));

    const results = [];
    for (const problematicCase of problematicCases) {
      const result = await fixProblematicCategoryResult(problematicCase);
      results.push(result);
    }

    // Step 3: Summary
    const successful = results.filter(r => r.success);
    const failed = results.filter(r => !r.success);

    console.log('\n📊 MIGRATION SUMMARY:');
    console.log('=' .repeat(40));
    console.log(`✅ Successfully fixed: ${successful.length} cases`);
    console.log(`❌ Failed to fix: ${failed.length} cases`);

    if (successful.length > 0) {
      console.log('\n✅ SUCCESSFUL FIXES:');
      successful.forEach(s => {
        console.log(`   - Student ${s.studentId}, ${s.category}: Added attempt ${s.addedAttempt} (${s.score}%, passed=${s.isPassed})`);
      });
    }

    if (failed.length > 0) {
      console.log('\n❌ FAILED FIXES:');
      failed.forEach(f => {
        console.log(`   - Student ${f.studentId}, ${f.category}: ${f.error}`);
      });
    }

    console.log('\n🎉 DATA MIGRATION COMPLETED!');

  } catch (error) {
    console.error('🚨 MIGRATION FAILED:', error);
    throw error;
  }
}

/**
 * Validate the fix for a specific student
 */
async function validateFixForStudent(studentId) {
  console.log(`\n🧪 VALIDATING FIX FOR STUDENT ${studentId}:`);
  console.log('-' .repeat(50));

  const categoryResult = await CategoryResults.findOne({ studentId: studentId });
  if (!categoryResult) {
    console.log(`❌ No category_results found for student ${studentId}`);
    return;
  }

  categoryResult.categories.forEach(category => {
    console.log(`\n📋 Category: ${category.categoryName}`);
    console.log(`   isPassed: ${category.isPassed}`);
    console.log(`   interventionAttempts: ${category.interventionAttempts}`);
    console.log(`   interventionCompleted: ${category.interventionCompleted}`);
    console.log(`   interventionHistory (${category.interventionHistory.length} entries):`);

    category.interventionHistory.forEach(entry => {
      console.log(`     - Attempt ${entry.attemptNumber}: revision=${entry.revisionNumber}, score=${entry.score}%, passed=${entry.isPassed}, reason='${entry.attemptReason}'`);
    });
  });
}

// Export functions for use in other scripts
module.exports = {
  runDataMigration,
  findProblematicCategoryResults,
  fixProblematicCategoryResult,
  validateFixForStudent
};

// Run migration if this script is executed directly
if (require.main === module) {
  runDataMigration()
    .then(() => {
      console.log('\n🔍 Validating fix for student 202533333...');
      return validateFixForStudent(202533333);
    })
    .then(() => {
      console.log('\n✅ Migration and validation completed successfully!');
      process.exit(0);
    })
    .catch(error => {
      console.error('💥 Migration failed:', error);
      process.exit(1);
    });
}