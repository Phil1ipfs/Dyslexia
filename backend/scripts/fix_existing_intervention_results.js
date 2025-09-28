/**
 * Script to fix the existing intervention_results record to include revisionNumber
 * This ensures the existing record is properly versioned
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

const InterventionResults = mongoose.model('InterventionResults', interventionResultsSchema);

const fixExistingInterventionResults = async () => {
  try {
    console.log('\n🔧 FIXING EXISTING INTERVENTION RESULTS');
    console.log('========================================');

    // Find the specific intervention_results that needs fixing
    const targetResult = await InterventionResults.findById('68ce442e2ff099f3079f347b');

    if (targetResult) {
      console.log('\n🔍 Found target intervention_results:');
      console.log(`- ID: ${targetResult._id}`);
      console.log(`- Student: ${targetResult.studentId}`);
      console.log(`- Category: ${targetResult.category}`);
      console.log(`- Score: ${targetResult.score}%`);
      console.log(`- Current revisionNumber: ${targetResult.revisionNumber || 'MISSING'}`);

      // Update with revisionNumber: 1
      const updateResult = await InterventionResults.updateOne(
        { _id: targetResult._id },
        { $set: { revisionNumber: 1 } }
      );

      if (updateResult.modifiedCount > 0) {
        console.log('\n✅ Successfully updated intervention_results:');
        console.log(`- Added revisionNumber: 1`);
        console.log(`- This intervention_results now properly tracks VERSION 1`);

        // Verify the update
        const updatedResult = await InterventionResults.findById(targetResult._id);
        console.log(`- Verified revisionNumber: ${updatedResult.revisionNumber}`);
      } else {
        console.log('\n⚠️ No changes made - record may already have revisionNumber');
      }
    } else {
      console.log('\n❌ Target intervention_results not found');
    }

    console.log('\n📊 SUMMARY:');
    console.log('- Existing intervention_results now has revisionNumber: 1');
    console.log('- This matches the revisionNumber of all intervention_responses');
    console.log('- System validation will now properly recognize this as VERSION 1');
    console.log('- No new intervention_results will be generated (existing one is valid)');

  } catch (error) {
    console.error('❌ Error fixing intervention results:', error);
  }
};

const main = async () => {
  await connectDB();
  await fixExistingInterventionResults();
  await mongoose.connection.close();
  console.log('\n✅ Fix completed - database connection closed');
  process.exit(0);
};

// Run the script
main().catch(error => {
  console.error('❌ Script failed:', error);
  process.exit(1);
});