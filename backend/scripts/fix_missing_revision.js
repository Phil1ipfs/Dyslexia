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

const fixMissingRevision = async () => {
  try {
    console.log('\n🔧 FIXING MISSING REVISION NUMBER');
    console.log('==================================');

    const specificRecordId = '68ce50f42ff099f3079f395f';
    const interventionId = '68cbb0975a26e73b61e061d3';

    // Get the intervention_assessment to get the revisionNumber
    const intervention = await InterventionAssessment.findById(interventionId);
    const revisionNumber = intervention.revisionNumber || 1;
    
    console.log(`📋 Intervention Assessment revisionNumber: ${revisionNumber}`);

    // Find the specific record
    const record = await InterventionResults.findById(specificRecordId);
    if (!record) {
      console.log('❌ Record not found');
      return;
    }

    console.log(`📊 Before fix:`);
    console.log(`- ID: ${record._id}`);
    console.log(`- Revision Number: ${record.revisionNumber || 'MISSING'}`);
    console.log(`- Has revisionNumber field: ${record.hasOwnProperty('revisionNumber') ? 'YES' : 'NO'}`);

    // Add the missing revisionNumber
    record.revisionNumber = revisionNumber;
    await record.save();

    console.log(`\n✅ After fix:`);
    console.log(`- ID: ${record._id}`);
    console.log(`- Revision Number: ${record.revisionNumber}`);
    console.log(`- Has revisionNumber field: ${record.hasOwnProperty('revisionNumber') ? 'YES' : 'NO'}`);

    console.log('\n🎉 SUCCESS: Missing revisionNumber has been added!');

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await mongoose.disconnect();
    console.log('\n✅ Disconnected from MongoDB');
  }
};

// Run the fix
connectDB().then(() => {
  fixMissingRevision();
});
