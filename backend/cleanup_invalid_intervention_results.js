#!/usr/bin/env node

/**
 * Clean up invalid intervention_results records that don't have interventionAssessmentId
 * These were created by the broken progressController.js before the fix
 */

const mongoose = require('mongoose');
require('dotenv').config();

async function cleanupInvalidInterventionResults() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/test');
    console.log('✅ Connected to MongoDB');

    // Import the model
    const InterventionResults = require('./models/Teachers/ManageProgress/interventionResultsModel');

    console.log('🔍 Checking for invalid intervention_results records...');

    // Find records without interventionAssessmentId (schema requires it)
    const invalidRecords = await InterventionResults.find({
      $or: [
        { interventionAssessmentId: null },
        { interventionAssessmentId: { $exists: false } }
      ]
    });

    console.log(`📊 Found ${invalidRecords.length} invalid intervention_results records`);

    if (invalidRecords.length > 0) {
      console.log('🗑️ Invalid records details:');
      invalidRecords.forEach((record, index) => {
        console.log(`  ${index + 1}. ID: ${record._id}, Student: ${record.studentId}, Category: ${record.category}`);
      });

      // Delete the invalid records
      const deleteResult = await InterventionResults.deleteMany({
        $or: [
          { interventionAssessmentId: null },
          { interventionAssessmentId: { $exists: false } }
        ]
      });

      console.log(`🗑️ Successfully deleted ${deleteResult.deletedCount} invalid intervention_results records`);
    } else {
      console.log('✅ No invalid records found - database is clean');
    }

    // Verify all remaining records have interventionAssessmentId
    const totalRecords = await InterventionResults.countDocuments({});
    const validRecords = await InterventionResults.countDocuments({
      interventionAssessmentId: { $exists: true, $ne: null }
    });

    console.log(`📊 Database status: ${validRecords}/${totalRecords} intervention_results have valid interventionAssessmentId`);

    if (validRecords === totalRecords) {
      console.log('🎉 ALL intervention_results records are now valid!');
    } else {
      console.error(`⚠️ Still have ${totalRecords - validRecords} invalid records`);
    }

  } catch (error) {
    console.error('❌ Error during cleanup:', error);
  } finally {
    await mongoose.disconnect();
    console.log('✅ Disconnected from MongoDB');
  }
}

// Run the cleanup
cleanupInvalidInterventionResults().catch(console.error);