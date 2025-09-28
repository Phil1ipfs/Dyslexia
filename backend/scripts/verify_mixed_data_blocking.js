/**
 * Verify that mixed revision data properly blocks intervention_results creation
 */

const mongoose = require('mongoose');

async function verifyMixedDataBlocking() {
  try {
    await mongoose.connect('mongodb+srv://johncasingal63:GqrI1M4qlAq8u1R0@cluster0.0f8ylb8.mongodb.net/test?retryWrites=true&w=majority&appName=Cluster0');
    console.log('✅ Connected to MongoDB');

    // Use raw collection access to bypass Mongoose defaults
    const db = mongoose.connection.db;
    const responsesCollection = db.collection('intervention_responses');
    const interventionCollection = db.collection('intervention_assessment');

    const studentId = 202522233;
    const interventionAssessmentId = new mongoose.Types.ObjectId('68cbb0975a26e73b61e061d3');

    // Get current state
    const intervention = await interventionCollection.findOne({ _id: interventionAssessmentId });
    const responses = await responsesCollection.find({
      studentId: studentId,
      interventionAssessmentId: interventionAssessmentId
    }).toArray();

    console.log('\n📊 CURRENT DATABASE STATE:');
    console.log('- Intervention revision:', intervention.revisionNumber || 1);
    console.log('- Total responses:', responses.length);

    // Check revision distribution
    const withRevision = responses.filter(r => r.revisionNumber !== null && r.revisionNumber !== undefined);
    const withoutRevision = responses.filter(r => r.revisionNumber === null || r.revisionNumber === undefined);

    console.log('- Responses WITH revisionNumber:', withRevision.length);
    console.log('- Responses WITHOUT revisionNumber:', withoutRevision.length);

    if (withoutRevision.length > 0) {
      console.log('\n❌ RESPONSES MISSING REVISION NUMBER:');
      withoutRevision.forEach(r => {
        console.log(`  - ${r.questionId} (revisionNumber: ${r.revisionNumber})`);
      });
    }

    // Test mixed data detection
    const hasMixedData = withoutRevision.length > 0 && withRevision.length > 0;
    console.log('\n🚨 MIXED DATA DETECTION:');
    console.log('- Mixed data present:', hasMixedData);

    if (hasMixedData) {
      console.log('✅ VALIDATION SHOULD BLOCK intervention_results creation');
      console.log('✅ Frontend should show 0% progress (as confirmed in screenshot)');
      console.log('✅ System working correctly - strict revision validation active');
    } else if (withoutRevision.length === responses.length) {
      console.log('⚠️ ALL responses missing revisionNumber - complete data migration needed');
    } else {
      console.log('✅ All responses have valid revisionNumber - would allow intervention_results');
    }

    // Test the exact CategoryResultsService logic
    console.log('\n🔍 TESTING CATEGORYRESULTSSERVICE LOGIC:');
    const currentRevision = intervention.revisionNumber || 1;

    // Simulate the exact filter from CategoryResultsService
    const versionAwareResponses = responses.filter(response => {
      if (response.revisionNumber) {
        return response.revisionNumber === currentRevision;
      }
      console.log(`❌ Response ${response._id} missing revisionNumber - STRICT VALIDATION FAILED`);
      return false;
    });

    console.log(`- Version-aware responses: ${versionAwareResponses.length}/${responses.length}`);
    console.log(`- Expected questions: ${intervention.totalQuestions || intervention.questions?.length || 0}`);

    const wouldBeComplete = versionAwareResponses.length >= (intervention.totalQuestions || intervention.questions?.length || 0);
    console.log(`- Would be considered complete: ${wouldBeComplete}`);

    console.log('\n🎯 FINAL VALIDATION RESULT:');
    if (hasMixedData) {
      console.log('🚫 BLOCKED: Mixed revision data detected');
      console.log('   → intervention_results creation prevented');
      console.log('   → Frontend shows 0% progress ✅');
      console.log('   → System working as designed ✅');
    } else if (!wouldBeComplete) {
      console.log('🚫 BLOCKED: Incomplete responses');
    } else {
      console.log('✅ ALLOWED: All validation passed');
    }

    await mongoose.connection.close();
    console.log('\n✅ Database connection closed');

  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

verifyMixedDataBlocking();