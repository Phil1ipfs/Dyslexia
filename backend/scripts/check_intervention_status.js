/**
 * Script to check current intervention status and understand why intervention_results
 * is not being auto-generated after migration
 */

const mongoose = require('mongoose');
require('dotenv').config({ path: require('path').join(__dirname, '../.env') });

// Database connection
const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
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

const interventionResponseSchema = new mongoose.Schema({}, {
  collection: 'intervention_responses',
  strict: false
});

const interventionAssessmentSchema = new mongoose.Schema({}, {
  collection: 'intervention_assessment',
  strict: false
});

const InterventionResults = mongoose.model('InterventionResults', interventionResultsSchema);
const InterventionResponse = mongoose.model('InterventionResponse', interventionResponseSchema);
const InterventionAssessment = mongoose.model('InterventionAssessment', interventionAssessmentSchema);

const checkInterventionStatus = async () => {
  try {
    console.log('\n🔍 CHECKING INTERVENTION STATUS');
    console.log('================================');

    const studentId = 202522233;
    const interventionId = '68cbb0975a26e73b61e061d3';

    // 1. Check intervention_assessment
    const intervention = await InterventionAssessment.findById(interventionId);
    console.log('\n📋 INTERVENTION ASSESSMENT:');
    console.log(`- ID: ${intervention._id}`);
    console.log(`- Student: ${intervention.studentId}`);
    console.log(`- Category: ${intervention.category}`);
    console.log(`- Revision Number: ${intervention.revisionNumber || 1}`);
    console.log(`- Total Questions: ${intervention.totalQuestions || intervention.questions?.length || 0}`);
    console.log(`- Has interventionResultsId: ${intervention.interventionResultsId ? 'YES' : 'NO'}`);
    if (intervention.interventionResultsId) {
      console.log(`- Linked Results ID: ${intervention.interventionResultsId}`);
    }

    // 2. Check intervention_responses
    const responses = await InterventionResponse.find({
      studentId: studentId,
      interventionAssessmentId: new mongoose.Types.ObjectId(interventionId)
    }).sort({ createdAt: 1 });

    console.log('\n📝 INTERVENTION RESPONSES:');
    console.log(`- Total Responses: ${responses.length}`);
    console.log(`- Expected Questions: ${intervention.totalQuestions || intervention.questions?.length || 0}`);
    console.log(`- Complete: ${responses.length >= (intervention.totalQuestions || intervention.questions?.length || 0) ? 'YES' : 'NO'}`);

    responses.forEach((response, index) => {
      console.log(`  ${index + 1}. ${response.questionId} - ${response.isCorrect ? 'CORRECT' : 'WRONG'} - revisionNumber: ${response.revisionNumber || 'MISSING'}`);
    });

    // 3. Check intervention_results
    const results = await InterventionResults.find({
      studentId: studentId,
      interventionAssessmentId: new mongoose.Types.ObjectId(interventionId)
    });

    console.log('\n📊 INTERVENTION RESULTS:');
    console.log(`- Total Results Records: ${results.length}`);

    results.forEach((result, index) => {
      console.log(`  ${index + 1}. ID: ${result._id}`);
      console.log(`     - Score: ${result.score}%`);
      console.log(`     - Passed: ${result.isPassed ? 'YES' : 'NO'}`);
      console.log(`     - Revision Number: ${result.revisionNumber || 'MISSING'}`);
      console.log(`     - Created: ${result.createdAt}`);
    });

    // 4. Analysis
    console.log('\n🔍 ANALYSIS:');
    const expectedQuestions = intervention.totalQuestions || intervention.questions?.length || 0;
    const actualResponses = responses.length;
    const hasResults = results.length > 0;
    const isLinked = intervention.interventionResultsId ? true : false;

    if (hasResults) {
      console.log('❗ REASON: intervention_results already exists');
      console.log('   The system prevents duplicate intervention_results generation');
      console.log('   Options:');
      console.log('   1. Delete existing intervention_results to allow regeneration');
      console.log('   2. Update existing intervention_results with correct data');
      console.log('   3. Leave as-is if the existing results are correct');
    } else if (actualResponses < expectedQuestions) {
      console.log('❗ REASON: Incomplete responses');
      console.log(`   Missing ${expectedQuestions - actualResponses} responses`);
    } else if (isLinked) {
      console.log('❗ REASON: intervention_assessment already linked to results');
      console.log('   The system thinks results already exist');
    } else {
      console.log('✅ Should be ready for intervention_results generation');
    }

  } catch (error) {
    console.error('❌ Error checking intervention status:', error);
  }
};

const main = async () => {
  await connectDB();
  await checkInterventionStatus();
  await mongoose.connection.close();
  console.log('\n✅ Status check completed - database connection closed');
  process.exit(0);
};

// Run the script
main().catch(error => {
  console.error('❌ Script failed:', error);
  process.exit(1);
});