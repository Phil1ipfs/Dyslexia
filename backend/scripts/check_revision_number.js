const mongoose = require('mongoose');
require('dotenv').config();

const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
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

const checkRevisionNumber = async () => {
  try {
    console.log('\n🔍 CHECKING REVISION NUMBER ISSUE');
    console.log('==================================');

    const interventionId = '68cbb0975a26e73b61e061d3';
    const resultId = '68ce50f42ff099f3079f395f';

    // 1. Check intervention_assessment
    const intervention = await InterventionAssessment.findById(interventionId);
    console.log('\n📋 INTERVENTION ASSESSMENT:');
    console.log(`- ID: ${intervention._id}`);
    console.log(`- Student: ${intervention.studentId}`);
    console.log(`- Category: ${intervention.category}`);
    console.log(`- Revision Number: ${intervention.revisionNumber || 'MISSING'}`);
    console.log(`- Has revisionNumber field: ${intervention.hasOwnProperty('revisionNumber') ? 'YES' : 'NO'}`);
    console.log(`- All fields: ${Object.keys(intervention.toObject()).join(', ')}`);

    // 2. Check intervention_results
    const result = await InterventionResults.findById(resultId);
    console.log('\n📊 INTERVENTION RESULTS:');
    console.log(`- ID: ${result._id}`);
    console.log(`- Student: ${result.studentId}`);
    console.log(`- Intervention Assessment ID: ${result.interventionAssessmentId}`);
    console.log(`- Revision Number: ${result.revisionNumber || 'MISSING'}`);
    console.log(`- Has revisionNumber field: ${result.hasOwnProperty('revisionNumber') ? 'YES' : 'NO'}`);
    console.log(`- Created At: ${result.createdAt}`);
    console.log(`- All fields: ${Object.keys(result.toObject()).join(', ')}`);

    // 3. Check if there are any other results for this intervention
    const allResults = await InterventionResults.find({
      interventionAssessmentId: new mongoose.Types.ObjectId(interventionId)
    }).sort({ createdAt: -1 });

    console.log(`\n📈 ALL RESULTS FOR THIS INTERVENTION: ${allResults.length} total`);
    allResults.forEach((r, index) => {
      console.log(`${index + 1}. ID: ${r._id}, Revision: ${r.revisionNumber || 'MISSING'}, Created: ${r.createdAt}`);
    });

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await mongoose.disconnect();
    console.log('\n✅ Disconnected from MongoDB');
  }
};

// Run the check
connectDB().then(() => {
  checkRevisionNumber();
});
