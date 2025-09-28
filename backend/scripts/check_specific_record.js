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

const InterventionResults = mongoose.model('InterventionResults', interventionResultsSchema);

const checkSpecificRecord = async () => {
  try {
    console.log('\n🔍 CHECKING SPECIFIC INTERVENTION RESULTS RECORD');
    console.log('================================================');

    const specificRecordId = '68ce50f42ff099f3079f395f';
    const interventionId = '68cbb0975a26e73b61e061d3';
    const studentId = 202522233;

    // Check the specific record you mentioned
    const specificRecord = await InterventionResults.findById(specificRecordId);
    console.log('\n📊 SPECIFIC RECORD (68ce50f42ff099f3079f395f):');
    if (specificRecord) {
      console.log(`- ID: ${specificRecord._id}`);
      console.log(`- Student: ${specificRecord.studentId}`);
      console.log(`- Intervention Assessment ID: ${specificRecord.interventionAssessmentId}`);
      console.log(`- Revision Number: ${specificRecord.revisionNumber || 'MISSING'}`);
      console.log(`- Has revisionNumber field: ${specificRecord.hasOwnProperty('revisionNumber') ? 'YES' : 'NO'}`);
      console.log(`- Created At: ${specificRecord.createdAt}`);
      console.log(`- All fields: ${Object.keys(specificRecord.toObject()).join(', ')}`);
    } else {
      console.log('❌ Record not found');
    }

    // Check ALL records for this intervention
    const allRecords = await InterventionResults.find({
      studentId: studentId,
      interventionAssessmentId: new mongoose.Types.ObjectId(interventionId)
    }).sort({ createdAt: -1 });

    console.log(`\n📈 ALL RECORDS FOR THIS INTERVENTION: ${allRecords.length} total`);
    allRecords.forEach((record, index) => {
      console.log(`${index + 1}. ID: ${record._id}`);
      console.log(`   - Revision Number: ${record.revisionNumber || 'MISSING'}`);
      console.log(`   - Created: ${record.createdAt}`);
      console.log(`   - Has revisionNumber field: ${record.hasOwnProperty('revisionNumber') ? 'YES' : 'NO'}`);
      console.log('');
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
  checkSpecificRecord();
});
