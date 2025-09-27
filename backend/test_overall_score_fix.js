const mongoose = require('mongoose');
const CategoryResultsService = require('./services/Teachers/CategoryResultsService');

// Connect to MongoDB
async function connectToDatabase() {
  try {
    await mongoose.connect('mongodb://localhost:27017/dyslexia', {
      useNewUrlParser: true,
      useUnifiedTopology: true
    });
    console.log('✅ Connected to MongoDB for overall score fix testing');
  } catch (error) {
    console.error('❌ Failed to connect to MongoDB:', error.message);
    process.exit(1);
  }
}

async function testOverallScoreFix() {
  console.log('\n🔧 TESTING OVERALL SCORE FIX FOR STUDENT 202533333');
  console.log('='.repeat(60));

  try {
    // Connect to database
    await connectToDatabase();

    const studentId = 202533333;

    // Step 1: Get current student category results
    const CategoryResult = require('./models/Teachers/ManageProgress/categoryResultModel');
    const categoryResults = await CategoryResult.find({
      studentId: studentId
    }).sort({ createdAt: -1 });

    console.log(`\n📊 Found ${categoryResults.length} category result records for student ${studentId}`);

    for (let i = 0; i < categoryResults.length; i++) {
      const result = categoryResults[i];
      console.log(`\n📋 Record ${i + 1} (Reading Level: ${result.readingLevel}):`);
      console.log(`   Overall Score: ${result.overallScore}%`);
      console.log(`   Categories: ${result.categories.length}`);

      for (const category of result.categories) {
        console.log(`\n   📊 ${category.categoryName}:`);
        console.log(`      - Score: ${category.score}%`);
        console.log(`      - Passed: ${category.isPassed}`);
        console.log(`      - Intervention Completed: ${category.interventionCompleted}`);
        console.log(`      - Intervention History: ${category.interventionHistory?.length || 0} attempts`);

        if (category.interventionHistory && category.interventionHistory.length > 0) {
          for (const attempt of category.interventionHistory) {
            console.log(`         * Attempt ${attempt.attemptNumber}: ${attempt.score}% - ${attempt.isPassed ? 'PASSED' : 'FAILED'}`);
          }
        }
      }
    }

    // Step 2: Test the fix for the specific case we know about
    console.log(`\n🔧 TESTING FIX: Simulating intervention completion for Phonological Awareness`);
    console.log('='.repeat(50));

    // Based on the data provided, the student had:
    // - Alphabet Knowledge: 80% (passed)
    // - Phonological Awareness: 33% initially, but intervention scored 100%

    // Get user's current reading level for proper category targeting
    const User = require('./models/userModel');
    const user = await User.findOne({ idNumber: parseInt(studentId) });
    const readingLevel = user ? user.readingLevel : 'High Emerging'; // Default for this test

    console.log(`[TEST] User reading level: ${readingLevel}`);

    try {
      await CategoryResultsService.updateCategoryFromIntervention(
        studentId,
        'Phonological Awareness',
        100, // The intervention score from the data
        new mongoose.Types.ObjectId(), // Mock intervention result ID
        readingLevel // 🎯 FIX: Pass reading level to prevent cross-level contamination
      );

      console.log('✅ Intervention update completed successfully');
    } catch (error) {
      console.log('⚠️ Intervention update error (might be expected if already updated):', error.message);
    }

    // Step 3: Get updated results
    console.log(`\n📈 UPDATED RESULTS AFTER FIX:`);
    console.log('='.repeat(40));

    const updatedResults = await CategoryResult.find({
      studentId: studentId
    }).sort({ createdAt: -1 });

    for (let i = 0; i < updatedResults.length; i++) {
      const result = updatedResults[i];
      console.log(`\n📋 Record ${i + 1} (Reading Level: ${result.readingLevel}):`);
      console.log(`   Overall Score: ${result.overallScore}%`);
      console.log(`   All Categories Passed: ${result.allCategoriesPassed}`);

      for (const category of result.categories) {
        console.log(`\n   📊 ${category.categoryName}:`);
        console.log(`      - Score: ${category.score}%`);
        console.log(`      - Passed: ${category.isPassed}`);
        console.log(`      - Intervention Completed: ${category.interventionCompleted}`);

        if (category.interventionHistory && category.interventionHistory.length > 0) {
          for (const attempt of category.interventionHistory) {
            console.log(`         * Attempt ${attempt.attemptNumber}: ${attempt.score}% - ${attempt.isPassed ? 'PASSED' : 'FAILED'}`);
          }
        }
      }
    }

    // Step 4: Manually test the calculation
    console.log(`\n🧮 MANUAL CALCULATION VERIFICATION:`);
    console.log('='.repeat(40));

    const latestResult = updatedResults[0];
    if (latestResult && latestResult.readingLevel === 'High Emerging') {
      const categories = latestResult.categories;
      const alphabet = categories.find(c => c.categoryName === 'Alphabet Knowledge');
      const phonological = categories.find(c => c.categoryName === 'Phonological Awareness');

      if (alphabet && phonological) {
        console.log(`Alphabet Knowledge: ${alphabet.score}% (passed: ${alphabet.isPassed})`);
        console.log(`Phonological Awareness: ${phonological.score}% (passed: ${phonological.isPassed})`);

        if (phonological.interventionHistory && phonological.interventionHistory.length > 0) {
          const bestIntervention = phonological.interventionHistory
            .filter(h => h.isPassed)
            .sort((a, b) => b.score - a.score)[0];

          if (bestIntervention) {
            console.log(`Best Intervention Score: ${bestIntervention.score}%`);
            console.log(`Expected Overall: (${alphabet.score} + ${bestIntervention.score}) / 2 = ${(alphabet.score + bestIntervention.score) / 2}%`);
          }
        }

        console.log(`Actual Overall Score: ${latestResult.overallScore}%`);
        console.log(`Should be: ${phonological.isPassed && alphabet.isPassed ? '90%' : 'Still calculating...'}`);
      }
    }

  } catch (error) {
    console.error('❌ Error in overall score fix testing:', error);
  } finally {
    await mongoose.disconnect();
    console.log('\n✅ Disconnected from MongoDB');
  }
}

// Run the test
testOverallScoreFix();