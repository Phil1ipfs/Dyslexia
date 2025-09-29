const mongoose = require('mongoose');
require('dotenv').config();

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI || 'mongodb+srv://goodboykit:4rfv5tgb@cluster0.0f8ylb8.mongodb.net/test?retryWrites=true&w=majority', {
  useNewUrlParser: true,
  useUnifiedTopology: true
});

const CategoryResult = require('./models/Teachers/ManageProgress/categoryResultModel');
const PrescriptiveAnalysis = require('./models/Teachers/ManageProgress/prescriptiveAnalysisModel');
const IntegrationTriggerService = require('./services/Teachers/PrescriptiveAnalytics/integrationTriggerService');

async function fixMissingPrescriptiveAnalysis() {
  try {
    console.log('🔧 Fixing missing prescriptive analysis for existing category_results...\n');

    // 1. Find all category_results without prescriptive analysis
    console.log('1. Finding category_results without prescriptive analysis:');
    const categoryResultsWithoutAnalysis = await CategoryResult.find({
      $or: [
        { prescriptiveAnalysisId: null },
        { prescriptiveAnalysisId: { $exists: false } }
      ]
    }).sort({ studentId: 1, readingLevel: 1, createdAt: -1 });

    console.log(`   Found ${categoryResultsWithoutAnalysis.length} category_results without prescriptive analysis:`);

    for (const result of categoryResultsWithoutAnalysis) {
      console.log(`   - Student ${result.studentId}: ${result.readingLevel} (ID: ${result._id})`);
    }

    // 2. Generate prescriptive analysis for each missing one
    console.log('\n2. Generating missing prescriptive analyses:');
    let successCount = 0;
    let errorCount = 0;

    for (const categoryResult of categoryResultsWithoutAnalysis) {
      try {
        console.log(`\n   Processing Student ${categoryResult.studentId} (${categoryResult.readingLevel}):`);

        // Check if analysis already exists (duplicate check)
        const existingAnalysis = await PrescriptiveAnalysis.findOne({
          studentId: categoryResult.studentId,
          categoryResultId: categoryResult._id,
          readingLevel: categoryResult.readingLevel
        });

        if (existingAnalysis) {
          console.log(`   ⚠️ Analysis already exists: ${existingAnalysis._id}`);
          // Update the category result to link to existing analysis
          categoryResult.prescriptiveAnalysisId = existingAnalysis._id;
          await categoryResult.save();
          console.log(`   ✅ Linked existing analysis to category_results`);
          successCount++;
          continue;
        }

        // Generate new prescriptive analysis
        console.log(`   🧠 Generating prescriptive analysis...`);
        const prescriptiveAnalysis = await IntegrationTriggerService.triggerPrescriptiveAnalysis(categoryResult.toObject());

        if (prescriptiveAnalysis) {
          // Update the category result with the prescriptive analysis ID
          categoryResult.prescriptiveAnalysisId = prescriptiveAnalysis._id;
          await categoryResult.save();

          console.log(`   ✅ Generated analysis: ${prescriptiveAnalysis._id}`);
          console.log(`   📊 Categories analyzed: ${Object.keys(prescriptiveAnalysis.skillMastery || {}).join(', ')}`);
          successCount++;
        } else {
          console.log(`   ❌ Failed to generate analysis (returned null)`);
          errorCount++;
        }

      } catch (error) {
        console.error(`   ❌ Error processing Student ${categoryResult.studentId}:`, error.message);
        errorCount++;
      }
    }

    // 3. Summary
    console.log(`\n✅ Fix completed!`);
    console.log(`   - Successfully processed: ${successCount}`);
    console.log(`   - Errors: ${errorCount}`);
    console.log(`   - Total: ${categoryResultsWithoutAnalysis.length}`);

    // 4. Verify the specific case we're interested in
    console.log(`\n4. Verifying student 202533333 High Emerging case:`);
    const student202533333HighEmerging = await CategoryResult.findOne({
      studentId: 202533333,
      readingLevel: 'High Emerging'
    });

    if (student202533333HighEmerging) {
      console.log(`   ✅ Found High Emerging record: ${student202533333HighEmerging._id}`);

      if (student202533333HighEmerging.prescriptiveAnalysisId) {
        const analysis = await PrescriptiveAnalysis.findById(student202533333HighEmerging.prescriptiveAnalysisId);
        if (analysis) {
          console.log(`   ✅ Prescriptive analysis linked: ${analysis._id}`);
          console.log(`   📊 Analysis for: ${analysis.readingLevel}`);
          console.log(`   🎯 Categories: ${Object.keys(analysis.skillMastery || {}).join(', ')}`);
        } else {
          console.log(`   ❌ Prescriptive analysis ID exists but record not found`);
        }
      } else {
        console.log(`   ❌ No prescriptive analysis ID linked`);
      }
    } else {
      console.log(`   ❌ No High Emerging record found for student 202533333`);
    }

    console.log('\n🎉 Fix complete! Check the frontend now to see if prescriptive analysis appears.');

  } catch (error) {
    console.error('❌ Fix failed:', error);
  } finally {
    mongoose.connection.close();
  }
}

fixMissingPrescriptiveAnalysis();