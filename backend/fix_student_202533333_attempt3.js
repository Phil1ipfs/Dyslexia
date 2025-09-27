/**
 * Manual Fix for Student 202533333 - Attempt 3 Issue
 * This script manually applies the missing attempt 3 update to the Developing level category_results
 */

const mongoose = require('mongoose');
require('dotenv').config();

async function fixStudent202533333Attempt3() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('🔗 Connected to MongoDB');

    const CategoryResult = require('./models/Teachers/ManageProgress/categoryResultModel');
    const InterventionResults = require('./models/Teachers/ManageProgress/interventionResultsModel');

    const studentId = 202533333;
    const category = 'Phonological Awareness';
    const interventionResultId = '68d8641886a81e780f7a51dc'; // Attempt 3 result ID

    console.log('\n🔧 MANUAL FIX for Student 202533333 - Attempt 3');
    console.log('=' + '='.repeat(60));

    // Step 1: Find the Developing level category_results record
    console.log('\n📊 Step 1: Find Developing level category_results');
    console.log('-'.repeat(50));

    const developingRecord = await CategoryResult.findOne({
      studentId: parseInt(studentId),
      readingLevel: 'Developing',
      'categories.categoryName': category
    });

    if (!developingRecord) {
      console.error('❌ Developing level category_results not found!');
      process.exit(1);
    }

    console.log('✅ Found Developing record:', developingRecord._id);

    const categoryIndex = developingRecord.categories.findIndex(cat => cat.categoryName === category);
    if (categoryIndex === -1) {
      console.error('❌ Phonological Awareness category not found in Developing record!');
      process.exit(1);
    }

    const currentCategory = developingRecord.categories[categoryIndex];
    console.log('Current status:');
    console.log('   Score:', currentCategory.score);
    console.log('   Passed:', currentCategory.isPassed);
    console.log('   Intervention attempts:', currentCategory.interventionHistory?.length || 0);

    // Step 2: Check if attempt 3 is already recorded
    const hasAttempt3 = currentCategory.interventionHistory?.some(attempt => attempt.attemptNumber === 3);

    if (hasAttempt3) {
      console.log('✅ Attempt 3 already recorded - checking if it needs fixing');
      const attempt3 = currentCategory.interventionHistory.find(attempt => attempt.attemptNumber === 3);
      console.log('Attempt 3 details:', {
        score: attempt3.score,
        passed: attempt3.isPassed,
        interventionResultId: attempt3.interventionResultId
      });

      if (attempt3.score === 100 && attempt3.isPassed && currentCategory.isPassed) {
        console.log('✅ Attempt 3 is already correctly recorded and category is passed!');
        process.exit(0);
      }
    }

    // Step 3: Add attempt 3 to intervention history
    console.log('\n📊 Step 3: Add attempt 3 to intervention history');
    console.log('-'.repeat(50));

    if (!currentCategory.interventionHistory) {
      currentCategory.interventionHistory = [];
    }

    // Add attempt 3 if not already present
    if (!hasAttempt3) {
      const attempt3Entry = {
        attemptNumber: 3,
        interventionId: new mongoose.Types.ObjectId('68d85d7f7794011dd9b3531e'), // From intervention_assessment
        interventionResultId: new mongoose.Types.ObjectId(interventionResultId),
        score: 100,
        isPassed: true,
        attemptedAt: new Date('2025-09-27T22:24:24.350Z'),
        completedAt: new Date('2025-09-27T22:24:24.350Z')
      };

      currentCategory.interventionHistory.push(attempt3Entry);
      console.log('✅ Added attempt 3 to intervention history');
    }

    // Step 4: Update category status since attempt 3 passed
    console.log('\n📊 Step 4: Update category status (attempt 3 passed with 100%)');
    console.log('-'.repeat(50));

    currentCategory.isPassed = true;
    currentCategory.interventionRequired = false;
    currentCategory.interventionCompleted = true;

    // Update score if intervention score is higher
    if (100 > currentCategory.score) {
      console.log(`🔄 Updating category score: ${currentCategory.score}% → 100%`);
      currentCategory.score = 100;
    }

    currentCategory.interventionAttempts = currentCategory.interventionHistory.length;

    // Step 5: Save the updated record
    console.log('\n📊 Step 5: Save updated category_results');
    console.log('-'.repeat(50));

    developingRecord.updatedAt = new Date();
    await developingRecord.save();

    console.log('✅ Successfully updated Developing level category_results');

    // Step 6: Verify the fix
    console.log('\n📊 Step 6: Verify the fix');
    console.log('-'.repeat(50));

    const verifyRecord = await CategoryResult.findOne({
      studentId: parseInt(studentId),
      readingLevel: 'Developing'
    });

    const verifyCategory = verifyRecord.categories.find(cat => cat.categoryName === category);
    console.log('Verification results:');
    console.log('   Score:', verifyCategory.score);
    console.log('   Passed:', verifyCategory.isPassed);
    console.log('   Intervention attempts:', verifyCategory.interventionHistory?.length || 0);

    if (verifyCategory.interventionHistory?.length) {
      console.log('   Intervention history:');
      verifyCategory.interventionHistory.forEach((attempt, index) => {
        console.log(`     Attempt ${attempt.attemptNumber}: ${attempt.score}% (${attempt.isPassed ? 'PASSED' : 'FAILED'})`);
      });
    }

    // Step 7: Check if this fixes the overall category completion
    console.log('\n📊 Step 7: Check overall category completion for Developing level');
    console.log('-'.repeat(50));

    const allCategories = verifyRecord.categories;
    const passedCategories = allCategories.filter(cat => cat.isPassed);
    const totalCategories = allCategories.length;

    console.log(`Developing level progress: ${passedCategories.length}/${totalCategories} categories passed`);
    allCategories.forEach(cat => {
      console.log(`   ${cat.categoryName}: ${cat.score}% (${cat.isPassed ? 'PASSED' : 'FAILED'})`);
    });

    if (passedCategories.length === totalCategories) {
      console.log('🎉 ALL CATEGORIES PASSED! Student should be eligible for next reading level progression');
    } else {
      console.log(`📚 Student needs to pass ${totalCategories - passedCategories.length} more categories for progression`);
    }

    console.log('\n✅ Manual fix completed successfully!');
    console.log('\n🎯 What this fixed:');
    console.log('   - Added missing attempt 3 (100% score) to Developing level Phonological Awareness');
    console.log('   - Updated category status to PASSED');
    console.log('   - Updated intervention completion status');
    console.log('   - Fixed category score to reflect successful intervention');

    process.exit(0);
  } catch (error) {
    console.error('❌ Manual fix error:', error);
    process.exit(1);
  }
}

fixStudent202533333Attempt3();