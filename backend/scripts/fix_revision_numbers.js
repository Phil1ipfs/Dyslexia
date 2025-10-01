/**
 * Script to fix missing revisionNumber fields in existing data
 * This adds revisionNumber: 1 to all existing intervention_responses and intervention_results
 * that don't have this field, ensuring backward compatibility.
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
const interventionResponseSchema = new mongoose.Schema({}, {
  collection: 'intervention_responses',
  strict: false
});

const interventionResultsSchema = new mongoose.Schema({}, {
  collection: 'intervention_results',
  strict: false
});

const categoryResultsSchema = new mongoose.Schema({}, {
  collection: 'category_results',
  strict: false
});

const InterventionResponse = mongoose.model('InterventionResponse', interventionResponseSchema);
const InterventionResults = mongoose.model('InterventionResults', interventionResultsSchema);
const CategoryResults = mongoose.model('CategoryResults', categoryResultsSchema);

const fixRevisionNumbers = async () => {
  try {
    console.log('\n🔧 FIXING REVISION NUMBERS');
    console.log('============================');

    // 1. Fix intervention_responses missing revisionNumber
    console.log('\n1️⃣ Fixing intervention_responses...');
    const responsesWithoutRevision = await InterventionResponse.find({
      revisionNumber: { $exists: false }
    });

    console.log(`Found ${responsesWithoutRevision.length} intervention responses without revisionNumber`);

    if (responsesWithoutRevision.length > 0) {
      const responseResult = await InterventionResponse.updateMany(
        { revisionNumber: { $exists: false } },
        { $set: { revisionNumber: 1 } }
      );
      console.log(`✅ Updated ${responseResult.modifiedCount} intervention responses with revisionNumber: 1`);
    }

    // 2. Fix intervention_results missing revisionNumber
    console.log('\n2️⃣ Fixing intervention_results...');
    const resultsWithoutRevision = await InterventionResults.find({
      revisionNumber: { $exists: false }
    });

    console.log(`Found ${resultsWithoutRevision.length} intervention results without revisionNumber`);

    if (resultsWithoutRevision.length > 0) {
      const resultsResult = await InterventionResults.updateMany(
        { revisionNumber: { $exists: false } },
        { $set: { revisionNumber: 1 } }
      );
      console.log(`✅ Updated ${resultsResult.modifiedCount} intervention results with revisionNumber: 1`);
    }

    // 3. Fix category_results intervention history missing revisionNumber
    console.log('\n3️⃣ Fixing category_results intervention history...');
    const categoryResults = await CategoryResults.find({
      'categories.interventionHistory': { $exists: true }
    });

    let historyEntriesFixed = 0;
    for (const categoryResult of categoryResults) {
      let modified = false;

      for (const category of categoryResult.categories) {
        if (category.interventionHistory && category.interventionHistory.length > 0) {
          for (const historyEntry of category.interventionHistory) {
            if (!historyEntry.revisionNumber) {
              historyEntry.revisionNumber = 1;
              historyEntry.attemptReason = 'initial_attempt';
              modified = true;
              historyEntriesFixed++;
            }
          }
        }
      }

      if (modified) {
        await categoryResult.save();
      }
    }

    console.log(`✅ Updated ${historyEntriesFixed} intervention history entries with revisionNumber: 1`);

    // 4. Summary
    console.log('\n📊 MIGRATION SUMMARY');
    console.log('===================');
    console.log(`✅ Intervention responses fixed: ${responsesWithoutRevision.length}`);
    console.log(`✅ Intervention results fixed: ${resultsWithoutRevision.length}`);
    console.log(`✅ Intervention history entries fixed: ${historyEntriesFixed}`);
    console.log('\n🎯 All existing data now has revisionNumber: 1 for backward compatibility');
    console.log('🔄 New interventions will use revisionNumber: 2, 3, etc. for proper version tracking');

  } catch (error) {
    console.error('❌ Error fixing revision numbers:', error);
  }
};

const main = async () => {
  await connectDB();
  await fixRevisionNumbers();
  await mongoose.connection.close();
  console.log('\n✅ Migration completed - database connection closed');
  process.exit(0);
};

// Run the script
main().catch(error => {
  console.error('❌ Script failed:', error);
  process.exit(1);
});