#!/usr/bin/env node

/**
 * Debug Script for Student 202533333 Cross-Level Contamination Issue
 *
 * This script will trace the exact data flow and identify why intervention
 * attempts are not being recorded correctly in category_results.
 */

const mongoose = require('mongoose');
require('dotenv').config();

// Import models
const CategoryResult = require('./models/Teachers/ManageProgress/categoryResultModel');
const InterventionResults = require('./models/Teachers/ManageProgress/interventionResultsModel');
const InterventionAssessment = require('./models/Teachers/ManageProgress/interventionAssessmentModel');
const User = require('./models/userModel');

const STUDENT_ID = 202533333;

async function debugStudent202533333() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/test');
    console.log('✅ Connected to MongoDB');

    console.log('🔍 DEBUGGING STUDENT 202533333 CROSS-LEVEL CONTAMINATION');
    console.log('='.repeat(70));

    // Step 1: Get student's current info
    console.log('\n📋 Step 1: Student Information');
    console.log('-'.repeat(50));
    const student = await User.findOne({ idNumber: STUDENT_ID });
    if (student) {
      console.log(`Student ID: ${student.idNumber}`);
      console.log(`Current Reading Level: ${student.readingLevel}`);
      console.log(`Reading Percentage: ${student.readingPercentage}`);
    } else {
      console.error('❌ Student not found!');
      return;
    }

    // Step 2: Get ALL category_results for this student
    console.log('\n📊 Step 2: All Category Results Records');
    console.log('-'.repeat(50));
    const allCategoryResults = await CategoryResult.find({ studentId: STUDENT_ID }).sort({ createdAt: 1 });

    console.log(`Found ${allCategoryResults.length} category_results records:`);
    allCategoryResults.forEach((record, index) => {
      console.log(`\n${index + 1}. Record ID: ${record._id}`);
      console.log(`   Reading Level: ${record.readingLevel}`);
      console.log(`   Created: ${record.createdAt}`);
      console.log(`   Updated: ${record.updatedAt}`);

      // Focus on Phonological Awareness
      const paCategory = record.categories.find(cat => cat.categoryName === 'Phonological Awareness');
      if (paCategory) {
        console.log(`   📝 Phonological Awareness:`);
        console.log(`      Score: ${paCategory.score}`);
        console.log(`      Passed: ${paCategory.isPassed}`);
        console.log(`      Intervention Attempts: ${paCategory.interventionAttempts}`);
        console.log(`      Intervention History: ${paCategory.interventionHistory.length} entries`);

        paCategory.interventionHistory.forEach((attempt, i) => {
          console.log(`         Attempt ${attempt.attemptNumber}: Score ${attempt.score}%, ID: ${attempt.interventionResultId}`);
        });
      }
    });

    // Step 3: Get ALL intervention results for this student
    console.log('\n🎯 Step 3: All Intervention Results');
    console.log('-'.repeat(50));
    const allInterventionResults = await InterventionResults.find({
      studentId: STUDENT_ID,
      category: 'Phonological Awareness'
    }).sort({ createdAt: 1 });

    console.log(`Found ${allInterventionResults.length} intervention results for Phonological Awareness:`);
    allInterventionResults.forEach((result, index) => {
      console.log(`\n${index + 1}. Intervention Result ID: ${result._id}`);
      console.log(`   Reading Level: ${result.readingLevel}`);
      console.log(`   Score: ${result.score}%`);
      console.log(`   Passed: ${result.isPassed}`);
      console.log(`   Pass Threshold: ${result.passThreshold}%`);
      console.log(`   Created: ${result.createdAt}`);
      console.log(`   Should trigger update: ${result.isPassed && result.score >= result.passThreshold}`);
    });

    // Step 4: Get ALL intervention assessments for this student
    console.log('\n📋 Step 4: All Intervention Assessments');
    console.log('-'.repeat(50));
    const allInterventionAssessments = await InterventionAssessment.find({
      studentId: STUDENT_ID,
      category: 'Phonological Awareness'
    }).sort({ createdAt: 1 });

    console.log(`Found ${allInterventionAssessments.length} intervention assessments for Phonological Awareness:`);
    allInterventionAssessments.forEach((assessment, index) => {
      console.log(`\n${index + 1}. Intervention Assessment ID: ${assessment._id}`);
      console.log(`   Reading Level: ${assessment.readingLevel}`);
      console.log(`   Total Questions: ${assessment.totalQuestions}`);
      console.log(`   Revision Number: ${assessment.revisionNumber}`);
      console.log(`   Created: ${assessment.createdAt}`);
      console.log(`   Intervention Results Array: ${assessment.interventionResults.length} entries`);

      assessment.interventionResults.forEach((result, i) => {
        console.log(`      Result ${result.attemptNumber}: Score ${result.score}%, Passed: ${result.isPassed}, ID: ${result.interventionResultsId}`);
      });
    });

    // Step 5: Cross-reference and identify the problem
    console.log('\n🔍 Step 5: Cross-Reference Analysis');
    console.log('-'.repeat(50));

    // Find the specific intervention result that should be attempt 3
    const targetResultId = '68d8a477c12696514958e108';
    const targetResult = await InterventionResults.findById(targetResultId);

    if (targetResult) {
      console.log(`\n🎯 Analyzing target intervention result: ${targetResultId}`);
      console.log(`   Student: ${targetResult.studentId}`);
      console.log(`   Category: ${targetResult.category}`);
      console.log(`   Reading Level: ${targetResult.readingLevel}`);
      console.log(`   Score: ${targetResult.score}%`);
      console.log(`   Passed: ${targetResult.isPassed}`);
      console.log(`   Should trigger category update: ${targetResult.isPassed && targetResult.score >= targetResult.passThreshold}`);

      // Check which category_results records contain this intervention result
      const recordsWithThisResult = await CategoryResult.find({
        studentId: STUDENT_ID,
        'categories.interventionHistory.interventionResultId': mongoose.Types.ObjectId(targetResultId)
      });

      console.log(`\n🔍 Category Results containing this intervention result: ${recordsWithThisResult.length}`);
      recordsWithThisResult.forEach((record, index) => {
        console.log(`   ${index + 1}. Record ${record._id} (Reading Level: ${record.readingLevel})`);

        const paCategory = record.categories.find(cat => cat.categoryName === 'Phonological Awareness');
        if (paCategory) {
          const matchingAttempt = paCategory.interventionHistory.find(attempt =>
            attempt.interventionResultId.toString() === targetResultId
          );
          if (matchingAttempt) {
            console.log(`      Found as attempt ${matchingAttempt.attemptNumber} with score ${matchingAttempt.score}%`);
          }
        }
      });

    } else {
      console.error(`❌ Target intervention result ${targetResultId} not found!`);
    }

    // Step 6: Identify the root cause
    console.log('\n🚨 Step 6: Root Cause Analysis');
    console.log('-'.repeat(50));

    console.log('Expected behavior:');
    console.log('- Student at "Developing" level takes intervention');
    console.log('- Intervention result gets created with readingLevel: "Developing"');
    console.log('- Post-save hook triggers updateCategoryFromIntervention with "Developing"');
    console.log('- Update targets category_results record with readingLevel: "Developing"');
    console.log('- Attempt gets recorded in "Developing" record only');

    console.log('\nActual behavior from data:');
    const developingRecord = allCategoryResults.find(r => r.readingLevel === 'Developing');
    const highEmergingRecord = allCategoryResults.find(r => r.readingLevel === 'High Emerging');

    if (developingRecord) {
      const paCategory = developingRecord.categories.find(cat => cat.categoryName === 'Phonological Awareness');
      console.log(`- "Developing" record has ${paCategory ? paCategory.interventionHistory.length : 0} intervention attempts`);
    }

    if (highEmergingRecord) {
      const paCategory = highEmergingRecord.categories.find(cat => cat.categoryName === 'Phonological Awareness');
      console.log(`- "High Emerging" record has ${paCategory ? paCategory.interventionHistory.length : 0} intervention attempts`);
      if (paCategory && paCategory.interventionHistory.length > 0) {
        console.log('- ❌ CONTAMINATION: High Emerging record contains attempts that should be in Developing!');
        paCategory.interventionHistory.forEach(attempt => {
          console.log(`   Attempt ${attempt.attemptNumber}: ${attempt.attemptedAt} (should be in Developing record)`);
        });
      }
    }

  } catch (error) {
    console.error('❌ Error during debugging:', error);
  } finally {
    await mongoose.disconnect();
    console.log('\n✅ Disconnected from MongoDB');
  }
}

// Run the debug script
debugStudent202533333().catch(console.error);