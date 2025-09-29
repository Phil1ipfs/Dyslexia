const mongoose = require('mongoose');
require('dotenv').config();

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI || 'mongodb+srv://goodboykit:4rfv5tgb@cluster0.0f8ylb8.mongodb.net/test?retryWrites=true&w=majority');

const PrescriptiveAnalysis = require('./models/Teachers/ManageProgress/prescriptiveAnalysisModel');

async function cleanupPrescriptiveAnalysis() {
  try {
    console.log('🧹 Cleaning up duplicate prescriptive analysis records for student 202533333...\n');

    // Delete all prescriptive analysis records for this student to prevent duplicate key errors
    const deletedRecords = await PrescriptiveAnalysis.deleteMany({
      studentId: 202533333
    });

    console.log(`✅ Deleted ${deletedRecords.deletedCount} prescriptive analysis records for student 202533333`);
    console.log('💡 This clears the way for fresh analysis generation when student completes new categories');

    console.log('\n🔍 Verifying cleanup...');
    const remainingRecords = await PrescriptiveAnalysis.find({
      studentId: 202533333
    });

    console.log(`📊 Remaining records for student 202533333: ${remainingRecords.length}`);

    if (remainingRecords.length === 0) {
      console.log('✅ SUCCESS: All prescriptive analysis records cleaned up');
      console.log('🎯 Student can now generate fresh prescriptive analysis without duplicate key errors');
    } else {
      console.log('⚠️ Some records remain:', remainingRecords.map(r => r._id));
    }

  } catch (error) {
    console.error('❌ Cleanup failed:', error);
  } finally {
    mongoose.connection.close();
  }
}

cleanupPrescriptiveAnalysis();