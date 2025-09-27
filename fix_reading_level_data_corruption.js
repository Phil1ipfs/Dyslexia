// Fix reading level data corruption - move intervention attempt 2 to correct level
const mongoose = require('mongoose');
const path = require('path');

// Load environment variables
require('dotenv').config({ path: path.join(__dirname, 'backend', '.env') });

async function fixReadingLevelDataCorruption() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGO_URI, {
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000,
    });
    console.log('✅ Connected to MongoDB');

    // Load models
    const CategoryResults = require('./backend/models/Teachers/ManageProgress/categoryResultModel');

    const studentId = 202533333;

    console.log('\n🔍 ANALYZING DATA CORRUPTION:');

    // Get both category_results records for this student
    const allRecords = await CategoryResults.find({ studentId: studentId }).sort({ readingLevel: 1 });

    console.log(`Found ${allRecords.length} category_results records for student ${studentId}:`);
    allRecords.forEach((record, index) => {
      console.log(`\n📋 Record ${index + 1}:`);
      console.log(`  - ID: ${record._id}`);
      console.log(`  - Reading Level: ${record.readingLevel}`);
      console.log(`  - Categories: ${record.categories.length}`);

      const alphabetCategory = record.categories.find(cat => cat.categoryName === 'Alphabet Knowledge');
      if (alphabetCategory) {
        console.log(`  - Alphabet Knowledge:`);
        console.log(`    - Score: ${alphabetCategory.score}%`);
        console.log(`    - Passed: ${alphabetCategory.isPassed}`);
        console.log(`    - Intervention Attempts: ${alphabetCategory.interventionAttempts || 0}`);
        console.log(`    - Intervention History: ${alphabetCategory.interventionHistory?.length || 0} entries`);

        if (alphabetCategory.interventionHistory && alphabetCategory.interventionHistory.length > 0) {
          alphabetCategory.interventionHistory.forEach((hist, histIndex) => {
            console.log(`      ${histIndex + 1}. Attempt ${hist.attemptNumber}: Score ${hist.score}%, Passed: ${hist.isPassed}, Revision: ${hist.revisionNumber || 'unknown'}`);
          });
        }
      }
    });

    // Find the High Emerging record (source of corruption)
    const highEmergingRecord = allRecords.find(r => r.readingLevel === 'High Emerging');
    const developingRecord = allRecords.find(r => r.readingLevel === 'Developing');

    if (!highEmergingRecord || !developingRecord) {
      console.error('❌ Could not find both reading level records');
      return;
    }

    console.log('\n🔧 FIXING DATA CORRUPTION:');

    // Get the Alphabet Knowledge categories from both records
    const highEmergingAlphabet = highEmergingRecord.categories.find(cat => cat.categoryName === 'Alphabet Knowledge');
    const developingAlphabet = developingRecord.categories.find(cat => cat.categoryName === 'Alphabet Knowledge');

    if (!highEmergingAlphabet || !developingAlphabet) {
      console.error('❌ Could not find Alphabet Knowledge categories in both records');
      return;
    }

    console.log('\n📊 CURRENT STATE:');
    console.log(`High Emerging Alphabet Knowledge: ${highEmergingAlphabet.interventionHistory?.length || 0} intervention attempts`);
    console.log(`Developing Alphabet Knowledge: ${developingAlphabet.interventionHistory?.length || 0} intervention attempts`);

    // Look for intervention attempt 2 (successful revision 2) in High Emerging record
    const attempt2InHighEmerging = highEmergingAlphabet.interventionHistory?.find(hist =>
      hist.attemptNumber === 2 ||
      hist.revisionNumber === 2 ||
      (hist.score === 100 && hist.isPassed === true)
    );

    if (attempt2InHighEmerging) {
      console.log('\n🎯 FOUND MISPLACED INTERVENTION ATTEMPT:');
      console.log(`  - Attempt Number: ${attempt2InHighEmerging.attemptNumber}`);
      console.log(`  - Revision Number: ${attempt2InHighEmerging.revisionNumber}`);
      console.log(`  - Score: ${attempt2InHighEmerging.score}%`);
      console.log(`  - Passed: ${attempt2InHighEmerging.isPassed}`);
      console.log(`  - Currently in: High Emerging record (WRONG)`);
      console.log(`  - Should be in: Developing record (CORRECT)`);

      console.log('\n🔄 MOVING INTERVENTION ATTEMPT TO CORRECT RECORD:');

      // Create the corrected intervention history entry for Developing record
      const correctedHistoryEntry = {
        attemptNumber: 2,
        interventionId: attempt2InHighEmerging.interventionId,
        interventionResultId: attempt2InHighEmerging.interventionResultId,
        revisionNumber: attempt2InHighEmerging.revisionNumber || 2,
        score: attempt2InHighEmerging.score,
        isPassed: attempt2InHighEmerging.isPassed,
        attemptedAt: attempt2InHighEmerging.attemptedAt,
        completedAt: attempt2InHighEmerging.completedAt,
        attemptReason: 'teacher_revision' // Since this is revision 2
      };

      // Add to Developing record
      if (!developingAlphabet.interventionHistory) {
        developingAlphabet.interventionHistory = [];
      }
      developingAlphabet.interventionHistory.push(correctedHistoryEntry);

      // Update Developing record category status since intervention passed
      developingRecord.categories[developingRecord.categories.findIndex(cat => cat.categoryName === 'Alphabet Knowledge')] = {
        ...developingAlphabet,
        interventionAttempts: 2,
        interventionCompleted: true,
        isPassed: true, // CRITICAL: Mark as passed since intervention succeeded
        interventionRequired: false,
        currentInterventionId: null // Clear since passed
      };

      // Remove the misplaced entry from High Emerging record
      const indexToRemove = highEmergingAlphabet.interventionHistory.findIndex(hist =>
        hist.attemptNumber === attempt2InHighEmerging.attemptNumber &&
        hist.score === attempt2InHighEmerging.score
      );

      if (indexToRemove !== -1) {
        highEmergingAlphabet.interventionHistory.splice(indexToRemove, 1);
        console.log(`✅ Removed misplaced intervention attempt from High Emerging record`);
      }

      // Reset High Emerging record intervention status to clean state
      const highEmergingAlphabetIndex = highEmergingRecord.categories.findIndex(cat => cat.categoryName === 'Alphabet Knowledge');
      if (highEmergingAlphabetIndex !== -1) {
        highEmergingRecord.categories[highEmergingAlphabetIndex].interventionAttempts = 1; // Only legitimate attempt 1
        if (highEmergingRecord.categories[highEmergingAlphabetIndex].interventionHistory.length === 0) {
          // If no intervention history left, reset intervention status
          highEmergingRecord.categories[highEmergingAlphabetIndex].interventionCompleted = false;
          highEmergingRecord.categories[highEmergingAlphabetIndex].currentInterventionId = null;
        }
      }

      // Save both records
      console.log('\n💾 SAVING CORRECTED RECORDS:');

      await highEmergingRecord.save();
      console.log('✅ High Emerging record updated (misplaced data removed)');

      await developingRecord.save();
      console.log('✅ Developing record updated (correct intervention data added)');

      console.log('\n🎉 DATA CORRUPTION FIXED SUCCESSFULLY!');

    } else {
      console.log('\n❌ Could not find the misplaced intervention attempt 2 in High Emerging record');
    }

    console.log('\n🔍 FINAL STATE VERIFICATION:');

    // Re-fetch and display final state
    const finalRecords = await CategoryResults.find({ studentId: studentId }).sort({ readingLevel: 1 });
    finalRecords.forEach((record, index) => {
      console.log(`\n📋 Final Record ${index + 1} (${record.readingLevel}):`);
      const alphabetCategory = record.categories.find(cat => cat.categoryName === 'Alphabet Knowledge');
      if (alphabetCategory) {
        console.log(`  - Score: ${alphabetCategory.score}%`);
        console.log(`  - Passed: ${alphabetCategory.isPassed}`);
        console.log(`  - Intervention Attempts: ${alphabetCategory.interventionAttempts || 0}`);
        console.log(`  - Intervention History: ${alphabetCategory.interventionHistory?.length || 0} entries`);

        if (alphabetCategory.interventionHistory && alphabetCategory.interventionHistory.length > 0) {
          alphabetCategory.interventionHistory.forEach((hist, histIndex) => {
            console.log(`    ${histIndex + 1}. Attempt ${hist.attemptNumber}: Score ${hist.score}%, Passed: ${hist.isPassed}, Revision: ${hist.revisionNumber || 'unknown'}`);
          });
        }
      }
    });

  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error(error.stack);
  } finally {
    await mongoose.disconnect();
    console.log('\n✅ Database connection closed');
    process.exit(0);
  }
}

fixReadingLevelDataCorruption();