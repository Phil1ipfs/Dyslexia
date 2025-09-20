const mongoose = require('mongoose');

// Connect to MongoDB
mongoose.connect('mongodb+srv://johncasingal63:GqrI1M4qlAq8u1R0@cluster0.0f8ylb8.mongodb.net/test');

async function testInterventionFix() {
  try {
    console.log('🔥 TESTING INTERVENTION FIX FOR REVISION 3');

    // Import the service
    const InterventionGeneratorService = require('./backend/services/Teachers/InterventionGeneratorService');

    // Manually trigger intervention processing for revision 3
    console.log('📋 Triggering intervention processing for revision 3...');

    const result = await InterventionGeneratorService.processInterventionResults('68cbb0975a26e73b61e061d3');

    console.log('✅ Intervention processing result:', {
      success: result.success,
      score: result.results?.score,
      passed: result.results?.isPassed,
      interventionResultsId: result.interventionResultsId
    });

    // Check if category_results was updated
    const CategoryResult = require('./backend/models/Teachers/ManageProgress/categoryResultsModel');
    const categoryResult = await CategoryResult.findOne({
      studentId: 202522233,
      'categories.categoryName': 'Alphabet Knowledge'
    }, { 'categories.$': 1 });

    console.log('🔍 Category results intervention history:');
    if (categoryResult && categoryResult.categories[0]) {
      categoryResult.categories[0].interventionHistory.forEach(attempt => {
        console.log(`  Attempt ${attempt.attemptNumber}: Score=${attempt.score}%, Revision=${attempt.revisionNumber}, Reason=${attempt.attemptReason}`);
      });
    }

    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

testInterventionFix();