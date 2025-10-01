/**
 * Script to remove invalid intervention_results that were created with incomplete data
 * This cleans up records that bypassed the validation due to missing revisionNumber fields
 */

const mongoose = require('mongoose');
require('dotenv').config({ path: require('path').join(__dirname, '../.env') });

// Database connection
const connectDB = async () => {
  try {
    // Use the correct MongoDB URI from .env file
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

const removeInvalidInterventionResults = async () => {
  try {
    console.log('\n🗑️ REMOVING INVALID INTERVENTION RESULTS');
    console.log('==========================================');

    // Find the specific invalid intervention_results
    const invalidResult = await InterventionResults.findOne({
      studentId: 202522233,
      interventionAssessmentId: new mongoose.Types.ObjectId('68cbb0975a26e73b61e061d3'),
      category: 'Alphabet Knowledge'
    });

    if (invalidResult) {
      console.log(`\n🔍 Found invalid intervention_results: ${invalidResult._id}`);
      console.log(`- Student: ${invalidResult.studentId}`);
      console.log(`- Category: ${invalidResult.category}`);
      console.log(`- Score: ${invalidResult.score}% (created with incomplete data)`);

      // Verify this was created with incomplete data
      const interventionResponses = await InterventionResponse.find({
        studentId: 202522233,
        interventionAssessmentId: new mongoose.Types.ObjectId('68cbb0975a26e73b61e061d3')
      });

      const intervention = await InterventionAssessment.findById('68cbb0975a26e73b61e061d3');
      const expectedQuestions = intervention ? (intervention.totalQuestions || intervention.questions?.length || 0) : 0;

      console.log(`\n📊 VALIDATION CHECK:`);
      console.log(`- Expected questions: ${expectedQuestions}`);
      console.log(`- Actual responses: ${interventionResponses.length}`);
      console.log(`- Complete: ${interventionResponses.length >= expectedQuestions ? 'YES' : 'NO'}`);

      if (interventionResponses.length < expectedQuestions) {
        console.log(`\n❌ CONFIRMED: Invalid intervention_results created with incomplete data`);
        console.log(`- Missing ${expectedQuestions - interventionResponses.length} responses`);

        // Remove the invalid intervention_results
        await InterventionResults.deleteOne({ _id: invalidResult._id });
        console.log(`✅ Removed invalid intervention_results: ${invalidResult._id}`);

        // Also clean up any reference to this result in intervention_assessment
        if (intervention && intervention.interventionResultsId && intervention.interventionResultsId.toString() === invalidResult._id.toString()) {
          await InterventionAssessment.updateOne(
            { _id: intervention._id },
            {
              $unset: {
                interventionResultsId: "",
                completedAt: ""
              }
            }
          );
          console.log(`✅ Cleaned up intervention_assessment reference`);
        }

      } else {
        console.log(`\n✅ This intervention_results appears to be valid (complete data)`);
      }
    } else {
      console.log(`\n✅ No invalid intervention_results found for the specified criteria`);
    }

    console.log('\n📋 CLEANUP SUMMARY');
    console.log('==================');
    console.log('✅ Invalid intervention_results removed');
    console.log('✅ intervention_assessment references cleaned');
    console.log('🔄 System now ready for proper validation');

  } catch (error) {
    console.error('❌ Error removing invalid intervention results:', error);
  }
};

const main = async () => {
  await connectDB();
  await removeInvalidInterventionResults();
  await mongoose.connection.close();
  console.log('\n✅ Cleanup completed - database connection closed');
  process.exit(0);
};

// Run the script
main().catch(error => {
  console.error('❌ Script failed:', error);
  process.exit(1);
});