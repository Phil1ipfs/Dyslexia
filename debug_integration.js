const mongoose = require('mongoose');
const path = require('path');

// Load environment variables
require('dotenv').config({ path: path.join(__dirname, 'backend', '.env') });

async function debugIntegration() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGO_URI);
    console.log('✅ Connected to MongoDB');

    // Load models
    const InterventionResults = require('./backend/models/Teachers/ManageProgress/interventionResultsModel');
    const InterventionAssessment = require('./backend/models/Teachers/ManageProgress/interventionAssessmentModel');
    const CategoryResults = require('./backend/models/Teachers/ManageProgress/categoryResultModel');

    // Check the specific intervention result
    const interventionResultId = '68d7af9a4679c1621425a458';
    const interventionResult = await InterventionResults.findById(interventionResultId);

    if (!interventionResult) {
      console.log('❌ Intervention result not found');
      return;
    }

    console.log('✅ Found intervention result:');
    console.log('- Student ID:', interventionResult.studentId);
    console.log('- Category:', interventionResult.category);
    console.log('- Reading Level:', interventionResult.readingLevel);
    console.log('- Score:', interventionResult.score);
    console.log('- Passed:', interventionResult.isPassed);
    console.log('- Intervention Assessment ID:', interventionResult.interventionAssessmentId);

    // Check the intervention assessment
    const interventionAssessment = await InterventionAssessment.findById(interventionResult.interventionAssessmentId);
    console.log('\\n✅ Found intervention assessment:');
    console.log('- Revision Number:', interventionAssessment.revisionNumber);
    console.log('- Intervention Results ID:', interventionAssessment.interventionResultsId);
    console.log('- Intervention Results Array Length:', interventionAssessment.interventionResults?.length || 0);

    // Check category results for the student at the Developing level
    const categoryResults = await CategoryResults.findOne({
      studentId: interventionResult.studentId,
      readingLevel: interventionResult.readingLevel
    });

    if (!categoryResults) {
      console.log('\\n❌ Category results not found for student', interventionResult.studentId, 'at level', interventionResult.readingLevel);
      return;
    }

    console.log('\\n✅ Found category results:');
    console.log('- Record ID:', categoryResults._id);
    console.log('- Reading Level:', categoryResults.readingLevel);
    console.log('- Categories:', categoryResults.categories.length);

    // Check the specific category
    const alphabetCategory = categoryResults.categories.find(cat => cat.categoryName === interventionResult.category);
    if (alphabetCategory) {
      console.log('\\n✅ Found Alphabet Knowledge category:');
      console.log('- Score:', alphabetCategory.score);
      console.log('- Is Passed:', alphabetCategory.isPassed);
      console.log('- Intervention Attempts:', alphabetCategory.interventionAttempts);
      console.log('- Intervention History Length:', alphabetCategory.interventionHistory?.length || 0);
      console.log('- Current Intervention ID:', alphabetCategory.currentInterventionId);

      if (alphabetCategory.interventionHistory?.length > 0) {
        console.log('\\n📊 Intervention History:');
        alphabetCategory.interventionHistory.forEach((hist, index) => {
          console.log(`  ${index + 1}. Attempt ${hist.attemptNumber}: Score ${hist.score}%, Passed: ${hist.isPassed}, Revision: ${hist.revisionNumber || 'unknown'}`);
        });
      }
    } else {
      console.log('\\n❌ Alphabet Knowledge category not found in results');
    }

  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error(error.stack);
  } finally {
    await mongoose.disconnect();
    process.exit(0);
  }
}

debugIntegration();