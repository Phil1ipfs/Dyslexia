/**
 * Test Script to Verify Student 202533333 Fix
 * This script checks if the manual fix for attempt 3 worked correctly
 */

const mongoose = require('mongoose');
require('dotenv').config();

async function testStudent202533333Fix() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('🔗 Connected to MongoDB');

    const CategoryResult = require('./models/Teachers/ManageProgress/categoryResultModel');

    const studentId = 202533333;
    const category = 'Phonological Awareness';

    console.log('\n🔍 TESTING STUDENT 202533333 FIX RESULTS');
    console.log('=' + '='.repeat(60));

    // Check both reading level records
    const allRecords = await CategoryResult.find({ studentId: studentId });

    console.log(`\n📊 Found ${allRecords.length} records for student ${studentId}:`);

    allRecords.forEach((record, index) => {
      console.log(`\n${index + 1}. Reading Level: ${record.readingLevel}`);
      console.log(`   Record ID: ${record._id}`);
      console.log(`   Overall Score: ${record.overallScore}%`);

      const paCategory = record.categories.find(cat => cat.categoryName === category);
      if (paCategory) {
        console.log(`   📍 ${category}:`);
        console.log(`      Score: ${paCategory.score}%`);
        console.log(`      Passed: ${paCategory.isPassed}`);
        console.log(`      Intervention History: ${paCategory.interventionHistory?.length || 0} attempts`);

        if (paCategory.interventionHistory?.length) {
          paCategory.interventionHistory.forEach((attempt, idx) => {
            console.log(`        Attempt ${attempt.attemptNumber}: ${attempt.score}% (${attempt.isPassed ? 'PASSED' : 'FAILED'})`);
          });
        }
      }
    });

    // Check specifically for Developing level
    const developingRecord = await CategoryResult.findOne({
      studentId: studentId,
      readingLevel: 'Developing'
    });

    if (developingRecord) {
      const paCategory = developingRecord.categories.find(cat => cat.categoryName === category);

      console.log('\n🎯 DEVELOPING LEVEL VERIFICATION:');
      console.log('✅ Developing record found');
      console.log(`✅ Phonological Awareness Score: ${paCategory.score}%`);
      console.log(`✅ Phonological Awareness Passed: ${paCategory.isPassed}`);
      console.log(`✅ Intervention History Length: ${paCategory.interventionHistory?.length || 0}`);

      if (paCategory.interventionHistory?.length >= 3) {
        const attempt3 = paCategory.interventionHistory.find(attempt => attempt.attemptNumber === 3);
        if (attempt3) {
          console.log('✅ Attempt 3 found:');
          console.log(`   Score: ${attempt3.score}%`);
          console.log(`   Passed: ${attempt3.isPassed}`);
          console.log(`   Date: ${attempt3.attemptedAt}`);
        } else {
          console.log('❌ Attempt 3 NOT found in intervention history');
        }
      } else {
        console.log('❌ Less than 3 attempts in intervention history');
      }

      // Check overall completion for Developing level
      const passedCategories = developingRecord.categories.filter(cat => cat.isPassed);
      const totalCategories = developingRecord.categories.length;

      console.log('\n📈 DEVELOPING LEVEL COMPLETION STATUS:');
      console.log(`Progress: ${passedCategories.length}/${totalCategories} categories passed`);

      developingRecord.categories.forEach(cat => {
        const status = cat.isPassed ? '✅ PASSED' : '❌ FAILED';
        console.log(`   ${cat.categoryName}: ${cat.score}% ${status}`);
      });

      if (passedCategories.length === totalCategories) {
        console.log('\n🎉 ALL CATEGORIES PASSED! Student ready for reading level progression');
      } else {
        console.log(`\n📚 Student needs to pass ${totalCategories - passedCategories.length} more categories`);
      }
    } else {
      console.log('❌ Developing level record not found');
    }

    console.log('\n✅ Test completed');
    process.exit(0);
  } catch (error) {
    console.error('❌ Test error:', error);
    process.exit(1);
  }
}

testStudent202533333Fix();