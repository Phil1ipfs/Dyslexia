/**
 * Script to test validation with mixed revision data
 * This should reproduce the issue where intervention_results gets generated
 * despite having mixed revision data
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

// Import the service to test
const CategoryResultsService = require('../services/Teachers/CategoryResultsService');

const testMixedRevisionValidation = async () => {
  try {
    console.log('\n🧪 TESTING MIXED REVISION DATA VALIDATION');
    console.log('==========================================');

    const studentId = 202522233;
    const interventionId = '68cbb0975a26e73b61e061d3';

    console.log(`\n🔍 Testing validation for student ${studentId}, intervention ${interventionId}`);

    // Test the validation logic directly
    const validationResult = await CategoryResultsService.validateInterventionCompleteness(studentId, interventionId);

    console.log('\n📋 VALIDATION RESULT:');
    console.log('===================');
    console.log(`- Is Complete: ${validationResult.isComplete}`);
    console.log(`- Reason: ${validationResult.reason || 'none'}`);
    console.log(`- Required: ${validationResult.required}`);
    console.log(`- Answered: ${validationResult.answered}`);
    console.log(`- Missing: ${validationResult.missing}`);

    if (validationResult.details) {
      console.log(`- Details: ${validationResult.details}`);
    }

    if (validationResult.responsesWithoutRevision) {
      console.log('\n❌ RESPONSES WITHOUT REVISION:');
      validationResult.responsesWithoutRevision.forEach((response, index) => {
        console.log(`  ${index + 1}. ${response.questionId} (ID: ${response._id})`);
      });
    }

    if (validationResult.responsesWithRevision) {
      console.log('\n✅ RESPONSES WITH REVISION:');
      validationResult.responsesWithRevision.forEach((response, index) => {
        console.log(`  ${index + 1}. ${response.questionId} (ID: ${response._id}, revision: ${response.revisionNumber})`);
      });
    }

    // Check what the system SHOULD do
    console.log('\n🎯 EXPECTED BEHAVIOR:');
    if (validationResult.reason === 'mixed_version_data') {
      console.log('✅ CORRECT: System detected mixed revision data and blocked intervention_results creation');
    } else if (validationResult.isComplete === false) {
      console.log('✅ CORRECT: System blocked intervention_results creation due to incompleteness');
    } else {
      console.log('❌ PROBLEM: System would allow intervention_results creation despite mixed data!');
    }

  } catch (error) {
    console.error('❌ Error testing validation:', error);
  }
};

const main = async () => {
  await connectDB();
  await testMixedRevisionValidation();
  await mongoose.connection.close();
  console.log('\n✅ Test completed - database connection closed');
  process.exit(0);
};

// Run the script
main().catch(error => {
  console.error('❌ Script failed:', error);
  process.exit(1);
});