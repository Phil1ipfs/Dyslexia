/**
 * Direct validation test with fresh DB connection
 * Tests the exact validation logic that should detect mixed revision data
 */

const mongoose = require('mongoose');
require('dotenv').config({ path: require('path').join(__dirname, '../.env') });

async function directValidationTest() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('✅ Connected to MongoDB');

    // Force fresh schema definition
    const InterventionResponse = mongoose.model('InterventionResponseTest', new mongoose.Schema({}, { collection: 'intervention_responses', strict: false }));
    const InterventionAssessment = mongoose.model('InterventionAssessmentTest', new mongoose.Schema({}, { collection: 'intervention_assessment', strict: false }));

    const studentId = 202522233;
    const interventionAssessmentId = new mongoose.Types.ObjectId('68cbb0975a26e73b61e061d3');

    // Get intervention
    const intervention = await InterventionAssessment.findById(interventionAssessmentId);
    const currentRevision = intervention.revisionNumber || 1;
    console.log('📋 Intervention revision:', currentRevision);

    // Get ALL responses with fresh query
    const responses = await InterventionResponse.find({
      studentId: studentId,
      interventionAssessmentId: interventionAssessmentId
    });

    console.log('\n📊 DIRECT DATABASE CHECK:');
    console.log('- Total responses found:', responses.length);

    // Check revision distribution
    const withRevision = responses.filter(r => r.revisionNumber !== null && r.revisionNumber !== undefined);
    const withoutRevision = responses.filter(r => r.revisionNumber === null || r.revisionNumber === undefined);

    console.log('- Responses WITH revisionNumber:', withRevision.length);
    console.log('- Responses WITHOUT revisionNumber:', withoutRevision.length);

    if (withoutRevision.length > 0) {
      console.log('\n❌ RESPONSES MISSING REVISION NUMBER:');
      withoutRevision.forEach(r => {
        console.log(`  - ${r.questionId} (ID: ${r._id}) revisionNumber: ${r.revisionNumber}`);
      });
    }

    // Test the exact validation filter logic from CategoryResultsService
    console.log('\n🔍 TESTING VERSION-AWARE FILTERING:');
    const versionAwareResponses = responses.filter(response => {
      // CRITICAL: revisionNumber is now STRICTLY REQUIRED for ALL responses
      if (response.revisionNumber) {
        const matches = response.revisionNumber === currentRevision;
        if (!matches) {
          console.warn(`⚠️ Response ${response._id} has revisionNumber ${response.revisionNumber}, expected ${currentRevision}`);
        }
        return matches;
      }

      // NO LEGACY SUPPORT: ALL responses must have revisionNumber
      console.error(`❌ Response ${response._id} missing revisionNumber - STRICT VALIDATION FAILED`);
      return false;
    });

    console.log(`📊 Version-aware responses: ${versionAwareResponses.length}/${responses.length} match revision ${currentRevision}`);

    // Test mixed data detection logic
    console.log('\n🚨 MIXED DATA DETECTION TEST:');
    const hasMixedData = withoutRevision.length > 0 && withRevision.length > 0;
    console.log('- Mixed data detected:', hasMixedData);

    if (hasMixedData) {
      console.log('✅ VALIDATION SHOULD BLOCK: Mixed version data detected');
      console.log(`   - ${withoutRevision.length} responses lack revisionNumber`);
      console.log(`   - ${withRevision.length} responses have revisionNumber`);
    } else {
      console.log('❌ VALIDATION WOULD ALLOW: No mixed data detected');
    }

    // Test completeness
    const expectedQuestions = intervention.totalQuestions || intervention.questions?.length || 0;
    const isComplete = versionAwareResponses.length >= expectedQuestions;

    console.log('\n🎯 COMPLETENESS CHECK:');
    console.log('- Expected questions:', expectedQuestions);
    console.log('- Version-valid responses:', versionAwareResponses.length);
    console.log('- Would be considered complete:', isComplete);

    // Final validation result
    console.log('\n🔥 FINAL VALIDATION RESULT:');
    if (hasMixedData) {
      console.log('❌ BLOCKED: Mixed revision data detected - intervention_results creation should be prevented');
    } else if (isComplete) {
      console.log('✅ ALLOWED: All validation passed - intervention_results creation would proceed');
    } else {
      console.log('❌ BLOCKED: Incomplete responses - intervention_results creation should be prevented');
    }

    await mongoose.connection.close();
    console.log('\n✅ Database connection closed');

  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

directValidationTest();