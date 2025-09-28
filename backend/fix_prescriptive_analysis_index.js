// Fix prescriptive analysis duplicate key index issue
// This script modifies the database index to allow multiple records for progress tracking

const mongoose = require('mongoose');

async function fixPrescriptiveAnalysisIndex() {
  try {
    console.log('🔧 [INDEX FIX] Starting prescriptive analysis index modification...');

    // Connect to MongoDB
    await mongoose.connect('mongodb+srv://goodboykit:T9HRRjhwL7hNSl4J@cluster0.0f8ylb8.mongodb.net/test?retryWrites=true&w=majority', {
      useNewUrlParser: true,
      useUnifiedTopology: true
    });

    console.log('✅ [INDEX FIX] Connected to MongoDB');

    // Get the prescriptive_analysis collection
    const db = mongoose.connection.db;
    const collection = db.collection('prescriptive_analysis');

    // Check current indexes
    console.log('📋 [INDEX FIX] Current indexes:');
    const currentIndexes = await collection.indexes();
    currentIndexes.forEach(index => {
      console.log(`  - ${index.name}: ${JSON.stringify(index.key)}`);
    });

    // Check if the problematic unique index exists
    const problematicIndex = currentIndexes.find(idx =>
      idx.name === 'studentId_1_categoryId_1' && idx.unique === true
    );

    if (problematicIndex) {
      console.log('🚫 [INDEX FIX] Found problematic unique index: studentId_1_categoryId_1');
      console.log('🗑️ [INDEX FIX] Dropping problematic unique index...');

      try {
        await collection.dropIndex('studentId_1_categoryId_1');
        console.log('✅ [INDEX FIX] Successfully dropped problematic unique index');
      } catch (error) {
        console.warn('⚠️ [INDEX FIX] Index may not exist or already dropped:', error.message);
      }
    } else {
      console.log('✅ [INDEX FIX] No problematic unique index found');
    }

    // Create a new compound index that allows multiple records per student for progress tracking
    console.log('🔧 [INDEX FIX] Creating new compound index for progress tracking...');

    try {
      await collection.createIndex(
        {
          studentId: 1,
          readingLevel: 1,
          createdAt: 1
        },
        {
          name: 'studentId_readingLevel_createdAt_progress_tracking',
          background: true,
          sparse: true  // Allow null values
        }
      );
      console.log('✅ [INDEX FIX] Created new progress tracking index: studentId_readingLevel_createdAt_progress_tracking');
    } catch (error) {
      console.warn('⚠️ [INDEX FIX] Index may already exist:', error.message);
    }

    // Create additional performance indexes
    console.log('🚀 [INDEX FIX] Creating performance optimization indexes...');

    const performanceIndexes = [
      { keys: { studentId: 1, assessmentDate: -1 }, name: 'studentId_assessmentDate_desc' },
      { keys: { readingLevel: 1, createdAt: -1 }, name: 'readingLevel_createdAt_desc' },
      { keys: { categoryResultId: 1 }, name: 'categoryResultId_lookup' }
    ];

    for (const indexSpec of performanceIndexes) {
      try {
        await collection.createIndex(indexSpec.keys, {
          name: indexSpec.name,
          background: true,
          sparse: true
        });
        console.log(`✅ [INDEX FIX] Created index: ${indexSpec.name}`);
      } catch (error) {
        console.warn(`⚠️ [INDEX FIX] Index ${indexSpec.name} may already exist:`, error.message);
      }
    }

    // Verify final index state
    console.log('📋 [INDEX FIX] Final indexes after modification:');
    const finalIndexes = await collection.indexes();
    finalIndexes.forEach(index => {
      console.log(`  - ${index.name}: ${JSON.stringify(index.key)} ${index.unique ? '(UNIQUE)' : '(NON-UNIQUE)'}`);
    });

    console.log('🎉 [INDEX FIX] Index modification complete!');
    console.log('✅ [INDEX FIX] Multiple prescriptive analysis records per student now allowed for progress tracking');
    console.log('📊 [INDEX FIX] Performance optimized for student progress queries');

    process.exit(0);
  } catch (error) {
    console.error('❌ [INDEX FIX] Error fixing prescriptive analysis index:', error);
    process.exit(1);
  }
}

fixPrescriptiveAnalysisIndex();