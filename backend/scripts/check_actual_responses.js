/**
 * Script to check actual intervention responses in database
 * to see if the missing revisionNumber response is still there
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
const interventionResponseSchema = new mongoose.Schema({}, {
  collection: 'intervention_responses',
  strict: false
});

const InterventionResponse = mongoose.model('InterventionResponse', interventionResponseSchema);

const checkActualResponses = async () => {
  try {
    console.log('\n🔍 CHECKING ACTUAL INTERVENTION RESPONSES');
    console.log('=========================================');

    const studentId = 202522233;
    const interventionId = '68cbb0975a26e73b61e061d3';

    // Get ALL responses for this intervention
    const allResponses = await InterventionResponse.find({
      studentId: studentId,
      interventionAssessmentId: new mongoose.Types.ObjectId(interventionId)
    }).sort({ createdAt: 1 });

    console.log(`\n📊 TOTAL RESPONSES: ${allResponses.length}`);
    console.log('================================');

    allResponses.forEach((response, index) => {
      console.log(`${index + 1}. ${response.questionId}`);
      console.log(`   - ID: ${response._id}`);
      console.log(`   - Revision Number: ${response.revisionNumber || 'MISSING'}`);
      console.log(`   - Response: ${response.response}`);
      console.log(`   - Correct: ${response.isCorrect}`);
      console.log(`   - Created: ${response.createdAt}`);
      console.log('');
    });

    // Check revision distribution
    const withRevision = allResponses.filter(r => r.revisionNumber);
    const withoutRevision = allResponses.filter(r => !r.revisionNumber);

    console.log('\n📈 REVISION DISTRIBUTION:');
    console.log(`- Responses WITH revisionNumber: ${withRevision.length}`);
    console.log(`- Responses WITHOUT revisionNumber: ${withoutRevision.length}`);

    if (withoutRevision.length > 0) {
      console.log('\n❌ RESPONSES MISSING REVISION NUMBER:');
      withoutRevision.forEach((response, index) => {
        console.log(`  ${index + 1}. ${response.questionId} (ID: ${response._id})`);
      });
    }

    // Check if the specific missing response exists
    const missingResponse = allResponses.find(r => r.questionId === 'int_alphabet_knowledge_009');
    if (missingResponse) {
      console.log('\n🔍 FOUND "int_alphabet_knowledge_009" RESPONSE:');
      console.log(`- ID: ${missingResponse._id}`);
      console.log(`- Revision Number: ${missingResponse.revisionNumber || 'MISSING'}`);
      console.log(`- This explains why validation shows 8/9 - this response has no revisionNumber!`);
    } else {
      console.log('\n❌ "int_alphabet_knowledge_009" response NOT FOUND');
    }

  } catch (error) {
    console.error('❌ Error checking responses:', error);
  }
};

const main = async () => {
  await connectDB();
  await checkActualResponses();
  await mongoose.connection.close();
  console.log('\n✅ Check completed - database connection closed');
  process.exit(0);
};

// Run the script
main().catch(error => {
  console.error('❌ Script failed:', error);
  process.exit(1);
});