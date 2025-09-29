const mongoose = require('mongoose');
require('dotenv').config();

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI || 'mongodb+srv://goodboykit:4rfv5tgb@cluster0.0f8ylb8.mongodb.net/test?retryWrites=true&w=majority');

const CategoryResult = require('./models/Teachers/ManageProgress/categoryResultModel');
const IntegrationTriggerService = require('./services/Teachers/PrescriptiveAnalytics/integrationTriggerService');

async function generateMissingHighEmergingAnalysis() {
  try {
    console.log('🔧 Generating missing prescriptive analysis for High Emerging level...\n');

    // 1. Find the specific category_results record for student 202533333 High Emerging
    console.log('1. Finding High Emerging category_results for student 202533333:');
    const categoryResult = await CategoryResult.findOne({
      studentId: 202533333,
      readingLevel: 'High Emerging'
    });

    if (!categoryResult) {
      console.log('   ❌ No High Emerging category_results found for student 202533333');
      return;
    }

    console.log(`   ✅ Found category_results: ${categoryResult._id}`);
    console.log(`   📊 Reading Level: ${categoryResult.readingLevel}`);
    console.log(`   📊 Overall Score: ${categoryResult.overallScore}%`);

    // Show current categories status
    categoryResult.categories.forEach(cat => {
      console.log(`   - ${cat.categoryName}: ${cat.score}% (completed: ${cat.isCompleted})`);
    });

    // 2. Check if prescriptive analysis already exists
    if (categoryResult.prescriptiveAnalysisId) {
      console.log(`\n   ⚠️ Prescriptive analysis already exists: ${categoryResult.prescriptiveAnalysisId}`);
      console.log('   This suggests the analysis exists but frontend might not be displaying it properly.');
      return;
    }

    console.log('\n   📝 No prescriptive analysis ID found - generating...');

    // 3. Generate prescriptive analysis for this completed assessment
    console.log('\n2. Generating prescriptive analysis for the completed assessment:');
    const prescriptiveAnalysis = await IntegrationTriggerService.triggerPrescriptiveAnalysis(categoryResult.toObject());

    if (prescriptiveAnalysis) {
      // Update the category result with the prescriptive analysis ID
      categoryResult.prescriptiveAnalysisId = prescriptiveAnalysis._id;
      await categoryResult.save();

      console.log(`   ✅ Generated prescriptive analysis: ${prescriptiveAnalysis._id}`);
      console.log(`   📊 Analysis for reading level: ${prescriptiveAnalysis.readingLevel}`);
      console.log(`   🎯 Categories analyzed: ${Object.keys(prescriptiveAnalysis.skillMastery || {}).join(', ')}`);
      console.log(`   📋 Linked prescriptive analysis to category_results`);
    } else {
      console.log(`   ❌ Failed to generate prescriptive analysis (returned null)`);
    }

    console.log('\n✅ Process completed! The High Emerging prescriptive analysis should now be available in the frontend.');

  } catch (error) {
    console.error('❌ Process failed:', error);
  } finally {
    mongoose.connection.close();
  }
}

generateMissingHighEmergingAnalysis();