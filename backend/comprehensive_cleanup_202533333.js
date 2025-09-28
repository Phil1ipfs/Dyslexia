/**
 * Comprehensive Cleanup for Student 202533333
 * This script fixes ALL cross-level contamination and data corruption
 */

const mongoose = require('mongoose');
require('dotenv').config();

async function comprehensiveCleanup202533333() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('🔗 Connected to MongoDB');

    const CategoryResult = require('./models/Teachers/ManageProgress/categoryResultModel');
    const InterventionAssessment = require('./models/Teachers/ManageProgress/interventionAssessmentModel');

    const studentId = 202533333;
    const category = 'Phonological Awareness';

    console.log('\n🧹 COMPREHENSIVE CLEANUP for Student 202533333');
    console.log('=' + '='.repeat(60));

    // Step 1: Get the intervention_assessment to understand the correct data
    console.log('\n📊 Step 1: Analyze intervention_assessment data');
    console.log('-'.repeat(50));

    const intervention = await InterventionAssessment.findById('68d85d7f7794011dd9b3531e');
    if (!intervention) {
      console.error('❌ Intervention assessment not found');
      process.exit(1);
    }

    console.log('✅ Found intervention assessment:');
    console.log(`   Reading Level: ${intervention.readingLevel}`);
    console.log(`   Category: ${intervention.category}`);
    console.log(`   Intervention Results Count: ${intervention.interventionResults?.length || 0}`);

    if (intervention.interventionResults?.length) {
      console.log('   Intervention Results:');
      intervention.interventionResults.forEach(result => {
        console.log(`     Attempt ${result.attemptNumber}: ${result.score}% (${result.isPassed ? 'PASSED' : 'FAILED'})`);
      });
    }

    // Step 2: Find all category_results for this student
    console.log('\n📊 Step 2: Find all category_results records');
    console.log('-'.repeat(50));

    const allRecords = await CategoryResult.find({ studentId: studentId });
    console.log(`Found ${allRecords.length} category_results records:`);

    allRecords.forEach((record, index) => {
      console.log(`\n   ${index + 1}. Reading Level: ${record.readingLevel}`);
      console.log(`      Record ID: ${record._id}`);

      const paCategory = record.categories.find(cat => cat.categoryName === category);
      if (paCategory) {
        console.log(`      📍 ${category}:`);
        console.log(`         Score: ${paCategory.score}%`);
        console.log(`         Passed: ${paCategory.isPassed}`);
        console.log(`         Intervention History: ${paCategory.interventionHistory?.length || 0} attempts`);

        if (paCategory.interventionHistory?.length) {
          paCategory.interventionHistory.forEach(attempt => {
            console.log(`           Attempt ${attempt.attemptNumber}: ${attempt.score}% (${attempt.isPassed ? 'PASSED' : 'FAILED'}) - Intervention: ${attempt.interventionId}`);
          });
        }
      }
    });

    // Step 3: Clean up High Emerging record (remove contaminated data)
    console.log('\n📊 Step 3: Clean up High Emerging record');
    console.log('-'.repeat(50));

    const highEmergingRecord = await CategoryResult.findOne({
      studentId: studentId,
      readingLevel: 'High Emerging'
    });

    if (highEmergingRecord) {
      const paIndex = highEmergingRecord.categories.findIndex(cat => cat.categoryName === category);
      if (paIndex !== -1) {
        const paCat = highEmergingRecord.categories[paIndex];

        console.log(`Current High Emerging ${category} data:`);
        console.log(`   Score: ${paCat.score}%`);
        console.log(`   Passed: ${paCat.isPassed}`);
        console.log(`   Intervention History: ${paCat.interventionHistory?.length || 0} attempts`);

        // Remove any interventions that belong to Developing level
        const originalCount = paCat.interventionHistory?.length || 0;

        if (paCat.interventionHistory) {
          // Filter out interventions that belong to Developing level (intervention ID: 68d85d7f7794011dd9b3531e)
          paCat.interventionHistory = paCat.interventionHistory.filter(attempt => {
            const belongsToDeveloping = attempt.interventionId?.toString() === '68d85d7f7794011dd9b3531e';
            if (belongsToDeveloping) {
              console.log(`   🗑️  Removing contaminated attempt ${attempt.attemptNumber} (belongs to Developing level)`);
            }
            return !belongsToDeveloping;
          });
        }

        const newCount = paCat.interventionHistory?.length || 0;
        console.log(`   ✅ Cleaned intervention history: ${originalCount} → ${newCount} attempts`);

        // Update intervention counts
        paCat.interventionAttempts = newCount;

        // Update category status based on remaining interventions
        if (paCat.interventionHistory?.length) {
          const lastAttempt = paCat.interventionHistory[paCat.interventionHistory.length - 1];
          if (lastAttempt.isPassed) {
            paCat.isPassed = true;
            paCat.interventionCompleted = true;
            paCat.interventionRequired = false;
            if (lastAttempt.score > paCat.score) {
              paCat.score = lastAttempt.score;
            }
          } else {
            paCat.isPassed = false;
            paCat.interventionCompleted = false;
            paCat.interventionRequired = true;
          }
        } else {
          // No interventions, check if main assessment passed
          paCat.isPassed = paCat.score >= 75;
          paCat.interventionCompleted = false;
          paCat.interventionRequired = !paCat.isPassed;
        }

        highEmergingRecord.updatedAt = new Date();
        await highEmergingRecord.save();
        console.log('   ✅ High Emerging record cleaned and saved');
      }
    }

    // Step 4: Fix Developing record (add correct intervention data)
    console.log('\n📊 Step 4: Fix Developing record');
    console.log('-'.repeat(50));

    const developingRecord = await CategoryResult.findOne({
      studentId: studentId,
      readingLevel: 'Developing'
    });

    if (!developingRecord) {
      console.error('❌ Developing level record not found');
      process.exit(1);
    }

    const devPaIndex = developingRecord.categories.findIndex(cat => cat.categoryName === category);
    if (devPaIndex === -1) {
      console.error('❌ Phonological Awareness category not found in Developing record');
      process.exit(1);
    }

    const devPaCat = developingRecord.categories[devPaIndex];

    console.log(`Current Developing ${category} data:`);
    console.log(`   Score: ${devPaCat.score}%`);
    console.log(`   Passed: ${devPaCat.isPassed}`);
    console.log(`   Intervention History: ${devPaCat.interventionHistory?.length || 0} attempts`);

    // Clear existing intervention history and rebuild it correctly
    if (!devPaCat.interventionHistory) {
      devPaCat.interventionHistory = [];
    }

    // Remove any existing attempts to avoid duplicates
    devPaCat.interventionHistory = [];

    // Add all 3 attempts from the intervention_assessment
    if (intervention.interventionResults?.length) {
      intervention.interventionResults.forEach(result => {
        const attemptEntry = {
          attemptNumber: result.attemptNumber,
          interventionId: new mongoose.Types.ObjectId('68d85d7f7794011dd9b3531e'),
          interventionResultId: result.interventionResultsId,
          score: result.score,
          isPassed: result.isPassed,
          attemptedAt: result.completedAt,
          completedAt: result.completedAt
        };
        devPaCat.interventionHistory.push(attemptEntry);
        console.log(`   ✅ Added attempt ${result.attemptNumber}: ${result.score}% (${result.isPassed ? 'PASSED' : 'FAILED'})`);
      });
    }

    // Update category status based on intervention results
    const lastAttempt = devPaCat.interventionHistory[devPaCat.interventionHistory.length - 1];
    if (lastAttempt && lastAttempt.isPassed) {
      devPaCat.isPassed = true;
      devPaCat.interventionCompleted = true;
      devPaCat.interventionRequired = false;
      devPaCat.score = Math.max(devPaCat.score, lastAttempt.score);
      devPaCat.interventionAttempts = devPaCat.interventionHistory.length;

      console.log(`   ✅ Updated category status: PASSED with ${lastAttempt.score}%`);
    }

    developingRecord.updatedAt = new Date();
    await developingRecord.save();
    console.log('   ✅ Developing record fixed and saved');

    // Step 5: Verification
    console.log('\n📊 Step 5: Verification');
    console.log('-'.repeat(50));

    // Re-fetch and verify both records
    const verifyHigh = await CategoryResult.findOne({
      studentId: studentId,
      readingLevel: 'High Emerging'
    });

    const verifyDev = await CategoryResult.findOne({
      studentId: studentId,
      readingLevel: 'Developing'
    });

    console.log('\n✅ VERIFICATION RESULTS:');

    if (verifyHigh) {
      const highPa = verifyHigh.categories.find(cat => cat.categoryName === category);
      console.log(`\n📍 High Emerging - ${category}:`);
      console.log(`   Score: ${highPa.score}%`);
      console.log(`   Passed: ${highPa.isPassed}`);
      console.log(`   Intervention History: ${highPa.interventionHistory?.length || 0} attempts`);
      if (highPa.interventionHistory?.length) {
        highPa.interventionHistory.forEach(attempt => {
          console.log(`     Attempt ${attempt.attemptNumber}: ${attempt.score}% (${attempt.isPassed ? 'PASSED' : 'FAILED'})`);
        });
      }
    }

    if (verifyDev) {
      const devPa = verifyDev.categories.find(cat => cat.categoryName === category);
      console.log(`\n📍 Developing - ${category}:`);
      console.log(`   Score: ${devPa.score}%`);
      console.log(`   Passed: ${devPa.isPassed}`);
      console.log(`   Intervention History: ${devPa.interventionHistory?.length || 0} attempts`);
      if (devPa.interventionHistory?.length) {
        devPa.interventionHistory.forEach(attempt => {
          console.log(`     Attempt ${attempt.attemptNumber}: ${attempt.score}% (${attempt.isPassed ? 'PASSED' : 'FAILED'})`);
        });
      }

      // Check overall completion for Developing level
      const passedCategories = verifyDev.categories.filter(cat => cat.isPassed);
      const totalCategories = verifyDev.categories.length;

      console.log(`\n📈 Developing level progress: ${passedCategories.length}/${totalCategories} categories passed`);
      verifyDev.categories.forEach(cat => {
        const status = cat.isPassed ? '✅ PASSED' : '❌ FAILED';
        console.log(`   ${cat.categoryName}: ${cat.score}% ${status}`);
      });
    }

    console.log('\n✅ Comprehensive cleanup completed successfully!');
    console.log('\n🎯 What was fixed:');
    console.log('   - Removed cross-level contamination from High Emerging record');
    console.log('   - Added all 3 intervention attempts to Developing record');
    console.log('   - Fixed category status and scores');
    console.log('   - Ensured data consistency across reading levels');

    process.exit(0);
  } catch (error) {
    console.error('❌ Comprehensive cleanup error:', error);
    process.exit(1);
  }
}

comprehensiveCleanup202533333();