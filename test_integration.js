const mongoose = require('mongoose');
const path = require('path');

// Load environment variables
require('dotenv').config({ path: path.join(__dirname, 'backend', '.env') });

async function testIntegration() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGO_URI);
    console.log('✅ Connected to MongoDB');

    // Load models and service
    const InterventionResults = require('./backend/models/Teachers/ManageProgress/interventionResultsModel');
    const CategoryResults = require('./backend/models/Teachers/ManageProgress/categoryResultModel');
    const InterventionResultsAnalysisService = require('./backend/services/Teachers/InterventionResultsAnalysisService');

    // Get the successful intervention result
    const interventionResultId = '68d7b4915602e99ab53e6cdc';
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
    console.log('- Revision Number:', interventionResult.revisionNumber);

    // Check category_results BEFORE manual update
    console.log('\\n🔍 Checking category_results BEFORE update:');
    const categoryResultsBefore = await CategoryResults.findOne({
      studentId: interventionResult.studentId,
      readingLevel: interventionResult.readingLevel
    });

    if (categoryResultsBefore) {
      const alphabetCategory = categoryResultsBefore.categories.find(cat => cat.categoryName === interventionResult.category);
      if (alphabetCategory) {
        console.log('- Intervention Attempts:', alphabetCategory.interventionAttempts);
        console.log('- Intervention Completed:', alphabetCategory.interventionCompleted);
        console.log('- isPassed:', alphabetCategory.isPassed);
        console.log('- History Length:', alphabetCategory.interventionHistory?.length || 0);
        console.log('- Current Intervention ID:', alphabetCategory.currentInterventionId);
      }
    }

    // Manually call the updateCategoryResultsWithIntervention method
    console.log('\\n🔧 Manually calling updateCategoryResultsWithIntervention...');

    const dataContext = {
      studentId: interventionResult.studentId,
      category: interventionResult.category
    };

    try {
      await InterventionResultsAnalysisService.updateCategoryResultsWithIntervention(interventionResult, dataContext);
      console.log('✅ updateCategoryResultsWithIntervention completed successfully');
    } catch (error) {
      console.error('❌ Error in updateCategoryResultsWithIntervention:', error.message);
      console.error(error.stack);
    }

    // Check category_results AFTER manual update
    console.log('\\n🔍 Checking category_results AFTER update:');
    const categoryResultsAfter = await CategoryResults.findOne({
      studentId: interventionResult.studentId,
      readingLevel: interventionResult.readingLevel
    });

    if (categoryResultsAfter) {
      const alphabetCategoryAfter = categoryResultsAfter.categories.find(cat => cat.categoryName === interventionResult.category);
      if (alphabetCategoryAfter) {
        console.log('- Intervention Attempts:', alphabetCategoryAfter.interventionAttempts);
        console.log('- Intervention Completed:', alphabetCategoryAfter.interventionCompleted);
        console.log('- isPassed:', alphabetCategoryAfter.isPassed);
        console.log('- History Length:', alphabetCategoryAfter.interventionHistory?.length || 0);
        console.log('- Current Intervention ID:', alphabetCategoryAfter.currentInterventionId);

        if (alphabetCategoryAfter.interventionHistory?.length > 0) {
          console.log('\\n📊 Intervention History:');
          alphabetCategoryAfter.interventionHistory.forEach((hist, index) => {
            console.log(`  ${index + 1}. Attempt ${hist.attemptNumber}: Score ${hist.score}%, Passed: ${hist.isPassed}, Revision: ${hist.revisionNumber || 'unknown'}`);
          });
        }
      }
    }

  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error(error.stack);
  } finally {
    await mongoose.disconnect();
    process.exit(0);
  }
}

testIntegration();