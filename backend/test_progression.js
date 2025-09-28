const mongoose = require('mongoose');
const ReadingLevelProgressionService = require('./services/ReadingLevelProgressionService');
const AutomaticProgressionValidationService = require('./services/AutomaticProgressionValidationService');

// Connect to MongoDB
async function connectToDatabase() {
  try {
    await mongoose.connect('mongodb://localhost:27017/dyslexia', {
      useNewUrlParser: true,
      useUnifiedTopology: true
    });
    console.log('✅ Connected to MongoDB for progression testing');
  } catch (error) {
    console.error('❌ Failed to connect to MongoDB:', error.message);
    process.exit(1);
  }
}

async function testStudentProgression() {
  console.log('\n🔍 TESTING STUDENT PROGRESSION FOR 202533333');
  console.log('='.repeat(60));

  try {
    // Connect to database
    await connectToDatabase();

    const studentId = 202533333;

    // Step 1: Get current student data
    const User = require('./models/userModel');
    const student = await User.findOne({ idNumber: studentId });

    if (!student) {
      console.error(`❌ Student ${studentId} not found`);
      return;
    }

    console.log(`👤 Student: ${student.firstName} ${student.lastName}`);
    console.log(`📚 Current Reading Level: ${student.readingLevel}`);
    console.log(`📊 Reading Percentage: ${student.readingPercentage}%`);

    // Step 2: Get category results
    const CategoryResult = require('./models/Teachers/ManageProgress/categoryResultModel');
    const categoryResults = await CategoryResult.findOne({
      studentId: studentId
    }).sort({ updatedAt: -1 });

    if (!categoryResults) {
      console.error(`❌ No category results found for student ${studentId}`);
      return;
    }

    console.log(`\n📋 Category Results (Reading Level: ${categoryResults.readingLevel}):`);
    console.log(`🔄 Reading Level Updated: ${categoryResults.readingLevelUpdated}`);

    for (const category of categoryResults.categories) {
      console.log(`\n📊 ${category.categoryName}:`);
      console.log(`   - Score: ${category.score}%`);
      console.log(`   - Is Passed: ${category.isPassed}`);
      console.log(`   - Is Completed: ${category.isCompleted}`);
      console.log(`   - Intervention Required: ${category.interventionRequired}`);
      console.log(`   - Intervention Completed: ${category.interventionCompleted}`);

      if (category.interventionHistory && category.interventionHistory.length > 0) {
        console.log(`   - Intervention History: ${category.interventionHistory.length} attempts`);
        for (const attempt of category.interventionHistory) {
          console.log(`     * Attempt ${attempt.attemptNumber}: ${attempt.score}% - ${attempt.isPassed ? 'PASSED' : 'FAILED'}`);
        }
      }
    }

    // Step 3: Check progression eligibility
    console.log(`\n🔍 CHECKING PROGRESSION ELIGIBILITY`);
    console.log('='.repeat(40));

    const progressionResult = await ReadingLevelProgressionService.checkAndProgressReadingLevel(studentId);

    console.log(`\n📈 Progression Result:`);
    console.log(`   - Success: ${progressionResult.success}`);
    console.log(`   - Progression Needed: ${progressionResult.progressionNeeded}`);
    console.log(`   - Progression Executed: ${progressionResult.progressionExecuted}`);
    console.log(`   - Reason: ${progressionResult.reason}`);

    if (progressionResult.fromLevel && progressionResult.toLevel) {
      console.log(`   - Progression: ${progressionResult.fromLevel} → ${progressionResult.toLevel}`);
    }

    if (progressionResult.categoryStatus) {
      console.log(`\n📊 Category Status:`);
      for (const [categoryName, status] of Object.entries(progressionResult.categoryStatus)) {
        console.log(`   - ${categoryName}: passed=${status.passed}, completed=${status.completed}, score=${status.score}%`);
        if (status.passedVia) {
          console.log(`     * Passed via: ${status.passedVia}`);
        }
      }
    }

    // Step 4: Check if there are any stuck progressions
    console.log(`\n🔍 CHECKING FOR STUCK PROGRESSIONS`);
    console.log('='.repeat(40));

    const stuckResults = await AutomaticProgressionValidationService.detectStuckProgressions();
    console.log(`   - Stuck progressions found: ${stuckResults.stuckFound}`);
    console.log(`   - Progressions fixed: ${stuckResults.progressionsFixed}`);

    // Step 5: Get updated data
    console.log(`\n🔄 GETTING UPDATED STUDENT DATA`);
    console.log('='.repeat(40));

    const updatedStudent = await User.findOne({ idNumber: studentId });
    const updatedCategoryResults = await CategoryResult.findOne({
      studentId: studentId
    }).sort({ updatedAt: -1 });

    console.log(`👤 Updated Student Reading Level: ${updatedStudent.readingLevel}`);
    console.log(`🔄 Updated Category Results Reading Level Updated: ${updatedCategoryResults.readingLevelUpdated}`);

  } catch (error) {
    console.error('❌ Error in progression testing:', error);
  } finally {
    await mongoose.disconnect();
    console.log('\n✅ Disconnected from MongoDB');
  }
}

// Run the test
testStudentProgression();