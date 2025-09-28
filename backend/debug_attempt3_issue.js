/**
 * Debug Script for Attempt 3 Issue
 * This script manually triggers the category_results update for attempt 3 to debug the cross-level contamination
 */

const mongoose = require('mongoose');
require('dotenv').config();

async function debugAttempt3Issue() {
  try {
    await mongoose.connect(process.env.DB_CONNECTION_STRING);
    console.log('🔗 Connected to MongoDB');

    const CategoryResultsService = require('./services/Teachers/CategoryResultsService');
    const CategoryResult = require('./models/Teachers/ManageProgress/categoryResultModel');
    const InterventionResults = require('./models/Teachers/ManageProgress/interventionResultsModel');

    const studentId = 202533333;
    const category = 'Phonological Awareness';
    const interventionResultId = '68d8641886a81e780f7a51dc'; // Attempt 3 result ID

    console.log('\n🔍 DEBUGGING ATTEMPT 3 ISSUE');
    console.log('=' + '='.repeat(60));

    // Step 1: Check the intervention_results record for attempt 3
    console.log('\n📊 Step 1: Check intervention_results record for attempt 3');
    console.log('-'.repeat(50));

    const attempt3Result = await InterventionResults.findById(interventionResultId);
    if (attempt3Result) {
      console.log('✅ Found intervention_results record:');
      console.log('   ID:', attempt3Result._id);
      console.log('   Student ID:', attempt3Result.studentId);
      console.log('   Category:', attempt3Result.category);
      console.log('   Reading Level:', attempt3Result.readingLevel);
      console.log('   Score:', attempt3Result.score);
      console.log('   isPassed:', attempt3Result.isPassed);
      console.log('   passThreshold:', attempt3Result.passThreshold);
      console.log('   Should trigger hook?', attempt3Result.isPassed && attempt3Result.score >= attempt3Result.passThreshold);
    } else {
      console.log('❌ Intervention result not found!');
      process.exit(1);
    }

    // Step 2: Check all category_results for this student
    console.log('\n📊 Step 2: Check all category_results for student', studentId);
    console.log('-'.repeat(50));

    const allResults = await CategoryResult.find({ studentId: studentId });
    console.log(`Found ${allResults.length} category_results records:`);

    allResults.forEach((result, index) => {
      console.log(`\n   ${index + 1}. Reading Level: ${result.readingLevel}`);
      console.log(`      Record ID: ${result._id}`);
      console.log(`      Categories:`);
      result.categories.forEach(cat => {
        if (cat.categoryName === category) {
          console.log(`        📍 ${cat.categoryName}: ${cat.score}% (${cat.isPassed ? 'PASSED' : 'FAILED'}) - ${cat.interventionHistory?.length || 0} attempts`);
        } else {
          console.log(`        ${cat.categoryName}: ${cat.score}% (${cat.isPassed ? 'PASSED' : 'FAILED'})`);
        }
      });
    });

    // Step 3: Test the query that should find the Developing record
    console.log('\n📊 Step 3: Test database query for Developing level');
    console.log('-'.repeat(50));

    const developingQuery = {
      studentId: parseInt(studentId),
      'categories.categoryName': category,
      readingLevel: 'Developing'
    };

    console.log('Query:', JSON.stringify(developingQuery, null, 2));

    const developingRecord = await CategoryResult.findOne(developingQuery);
    console.log('Query result:', developingRecord ? 'FOUND' : 'NOT FOUND');

    if (developingRecord) {
      const paCategory = developingRecord.categories.find(cat => cat.categoryName === category);
      console.log('Phonological Awareness in Developing record:');
      console.log('   Score:', paCategory.score);
      console.log('   Passed:', paCategory.isPassed);
      console.log('   Intervention attempts:', paCategory.interventionHistory?.length || 0);
    }

    // Step 4: Manually trigger the update
    console.log('\n📊 Step 4: Manually trigger category_results update');
    console.log('-'.repeat(50));

    try {
      const updateResult = await CategoryResultsService.updateCategoryFromIntervention(
        studentId,
        category,
        100, // Score from attempt 3
        attempt3Result._id,
        'Developing' // Reading level from attempt 3
      );

      console.log('Update result:', JSON.stringify(updateResult, null, 2));
    } catch (error) {
      console.error('❌ Update failed:', error.message);
      console.error('Error details:', error);
    }

    // Step 5: Check results after manual update
    console.log('\n📊 Step 5: Check category_results after manual update');
    console.log('-'.repeat(50));

    const afterUpdate = await CategoryResult.findOne({
      studentId: parseInt(studentId),
      readingLevel: 'Developing'
    });

    if (afterUpdate) {
      const paAfter = afterUpdate.categories.find(cat => cat.categoryName === category);
      console.log('Phonological Awareness after update:');
      console.log('   Score:', paAfter.score);
      console.log('   Passed:', paAfter.isPassed);
      console.log('   Intervention attempts:', paAfter.interventionHistory?.length || 0);

      if (paAfter.interventionHistory?.length) {
        console.log('   Intervention history:');
        paAfter.interventionHistory.forEach((attempt, index) => {
          console.log(`     Attempt ${attempt.attemptNumber}: ${attempt.score}% (${attempt.isPassed ? 'PASSED' : 'FAILED'})`);
        });
      }
    }

    console.log('\n✅ Debug completed');
    process.exit(0);
  } catch (error) {
    console.error('❌ Debug error:', error);
    process.exit(1);
  }
}

debugAttempt3Issue();