const mongoose = require('mongoose');
require('dotenv').config();

// Connect to MongoDB using the same connection as the server
mongoose.connect(process.env.MONGO_URI);

async function manualCleanup() {
  try {
    console.log('🧹 Manual cleanup for student 202533333...');

    // Get the test database
    const testDb = mongoose.connection.useDb('test');
    const prescriptiveAnalysisCollection = testDb.collection('prescriptive_analysis');

    // Find all prescriptive analysis records for this student
    const existingRecords = await prescriptiveAnalysisCollection.find({
      studentId: 202533333
    }).toArray();

    console.log(`📋 Found ${existingRecords.length} prescriptive analysis records for student 202533333:`);
    existingRecords.forEach(record => {
      console.log(`   - ID: ${record._id}, Level: ${record.readingLevel}, Category: ${record.categoryId || 'unknown'}`);
    });

    if (existingRecords.length === 0) {
      console.log('✅ No records found to delete');
      return;
    }

    // Delete all records for this student
    const deleteResult = await prescriptiveAnalysisCollection.deleteMany({
      studentId: 202533333
    });

    console.log(`✅ Successfully deleted ${deleteResult.deletedCount} prescriptive analysis records`);
    console.log('💡 The duplicate key error should now be resolved');

  } catch (error) {
    console.error('❌ Manual cleanup failed:', error);
  } finally {
    mongoose.connection.close();
  }
}

manualCleanup();