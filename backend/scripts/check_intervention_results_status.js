/**
 * Script to check intervention_results status
 * and see if results are being newly created or just old ones still exist
 */

const mongoose = require('mongoose');

// Database connection
const connectDB = async () => {
  try {
    const MONGO_URI = 'mongodb+srv://johncasingal63:GqrI1M4qlAq8u1R0@cluster0.0f8ylb8.mongodb.net/test?retryWrites=true&w=majority&appName=Cluster0';
    await mongoose.connect(MONGO_URI);
    console.log('✅ Connected to MongoDB');
  } catch (error) {
    console.error('❌ MongoDB connection error:', error);
    process.exit(1);
  }
};

// Define schemas
const interventionResultsSchema = new mongoose.Schema({}, {
  collection: 'intervention_results',
  strict: false
});

const interventionAssessmentSchema = new mongoose.Schema({}, {
  collection: 'intervention_assessment',
  strict: false
});

const InterventionResults = mongoose.model('InterventionResults', interventionResultsSchema);
const InterventionAssessment = mongoose.model('InterventionAssessment', interventionAssessmentSchema);

const checkInterventionResultsStatus = async () => {
  try {
    console.log('\n📊 CHECKING INTERVENTION RESULTS STATUS');
    console.log('=====================================');

    const studentId = 202522233;
    const interventionId = '68cbb0975a26e73b61e061d3';

    // Check intervention_assessment status
    const intervention = await InterventionAssessment.findById(interventionId);
    console.log('\n🏗️ INTERVENTION ASSESSMENT:');
    console.log(`- Completed At: ${intervention.completedAt || 'NULL'}`);
    console.log(`- Results ID: ${intervention.interventionResultsId || 'NULL'}`);
    console.log(`- Revision Number: ${intervention.revisionNumber || 1}`);

    // Check all intervention_results for this intervention
    const allResults = await InterventionResults.find({
      studentId: studentId,
      interventionAssessmentId: new mongoose.Types.ObjectId(interventionId)
    }).sort({ createdAt: -1 });

    console.log(`\n📈 INTERVENTION RESULTS: ${allResults.length} total`);
    console.log('===============================');

    allResults.forEach((result, index) => {
      console.log(`${index + 1}. ID: ${result._id}`);
      console.log(`   - Score: ${result.score}%`);
      console.log(`   - Passed: ${result.isPassed ? 'YES' : 'NO'}`);
      console.log(`   - Revision Number: ${result.revisionNumber || 'MISSING'}`);
      console.log(`   - Total Questions: ${result.totalQuestions}`);
      console.log(`   - Correct Answers: ${result.correctAnswers}`);
      console.log(`   - Created: ${result.createdAt}`);
      console.log(`   - Updated: ${result.updatedAt}`);
      console.log('');
    });

    // Check if intervention_assessment is linked to results
    if (intervention.interventionResultsId) {
      const linkedResult = allResults.find(r => r._id.toString() === intervention.interventionResultsId.toString());
      if (linkedResult) {
        console.log('🔗 LINKED RESULT FOUND:');
        console.log(`- This intervention_assessment is linked to result: ${linkedResult._id}`);
        console.log(`- Result created: ${linkedResult.createdAt}`);
        console.log(`- Score: ${linkedResult.score}%`);
      } else {
        console.log('❌ LINKED RESULT NOT FOUND - broken reference');
      }
    }

    // Analysis
    console.log('\n🎯 ANALYSIS:');
    if (allResults.length === 0) {
      console.log('✅ No intervention_results exist - system correctly preventing creation');
    } else {
      const latestResult = allResults[0];
      const now = new Date();
      const resultAge = (now - latestResult.createdAt) / (1000 * 60); // minutes ago

      if (resultAge < 10) {
        console.log(`❌ RECENT RESULT DETECTED: Created ${Math.round(resultAge)} minutes ago`);
        console.log('   This suggests intervention_results was recently generated despite incomplete data!');
      } else {
        console.log(`✅ OLD RESULT: Created ${Math.round(resultAge)} minutes ago`);
        console.log('   This is likely the old result - no new generation happened');
      }

      console.log(`\nCURRENT ISSUE:`);
      console.log(`- Expected: 9 responses for complete intervention`);
      console.log(`- Actual: 8 responses (missing int_alphabet_knowledge_009)`);
      console.log(`- Should block: intervention_results creation`);
      console.log(`- Current status: ${allResults.length > 0 ? 'Results exist' : 'No results'}`);
    }

  } catch (error) {
    console.error('❌ Error checking intervention results status:', error);
  }
};

const main = async () => {
  await connectDB();
  await checkInterventionResultsStatus();
  await mongoose.connection.close();
  console.log('\n✅ Check completed - database connection closed');
  process.exit(0);
};

// Run the script
main().catch(error => {
  console.error('❌ Script failed:', error);
  process.exit(1);
});