const mongoose = require('mongoose');
require('dotenv').config();

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI || 'mongodb+srv://goodboykit:4rfv5tgb@cluster0.0f8ylb8.mongodb.net/test?retryWrites=true&w=majority');

const PrescriptiveAnalysis = require('./models/Teachers/ManageProgress/prescriptiveAnalysisModel');

async function fixPrescriptiveAnalysisIndexes() {
  try {
    console.log('🔧 Fixing prescriptive analysis database indexes...\n');

    // Get current indexes
    console.log('1. Checking current indexes:');
    const indexes = await PrescriptiveAnalysis.collection.getIndexes();
    console.log('   Current indexes:', Object.keys(indexes));

    // Check for the problematic index
    const problematicIndex = 'studentId_1_categoryId_1';
    if (indexes[problematicIndex]) {
      console.log(`\n   ❌ Found problematic index: ${problematicIndex}`);
      console.log('   This index prevents multiple prescriptive analyses for same student/category at different reading levels');

      // Drop the problematic index
      console.log('\n2. Dropping problematic index:');
      try {
        await PrescriptiveAnalysis.collection.dropIndex(problematicIndex);
        console.log(`   ✅ Successfully dropped index: ${problematicIndex}`);
      } catch (error) {
        if (error.message.includes('index not found')) {
          console.log(`   ⚠️ Index ${problematicIndex} not found (already dropped or doesn't exist)`);
        } else {
          throw error;
        }
      }
    } else {
      console.log(`\n   ✅ Problematic index ${problematicIndex} not found (good!)`);
    }

    // Create correct indexes
    console.log('\n3. Creating correct indexes:');

    // Index for efficient querying by student and reading level
    const correctIndex1 = { studentId: 1, readingLevel: 1, assessmentType: 1 };
    try {
      await PrescriptiveAnalysis.collection.createIndex(correctIndex1);
      console.log('   ✅ Created index: studentId_1_readingLevel_1_assessmentType_1');
    } catch (error) {
      if (error.message.includes('already exists')) {
        console.log('   ⚠️ Index studentId_1_readingLevel_1_assessmentType_1 already exists');
      } else {
        throw error;
      }
    }

    // Index for category-specific queries with reading level
    const correctIndex2 = { studentId: 1, categoryId: 1, readingLevel: 1 };
    try {
      await PrescriptiveAnalysis.collection.createIndex(correctIndex2);
      console.log('   ✅ Created index: studentId_1_categoryId_1_readingLevel_1');
    } catch (error) {
      if (error.message.includes('already exists')) {
        console.log('   ⚠️ Index studentId_1_categoryId_1_readingLevel_1 already exists');
      } else {
        throw error;
      }
    }

    // Verify current state
    console.log('\n4. Verifying final index state:');
    const finalIndexes = await PrescriptiveAnalysis.collection.getIndexes();
    console.log('   Final indexes:', Object.keys(finalIndexes));

    // Test the fix by trying to create the High Emerging analysis
    console.log('\n5. Testing: Can we now create High Emerging prescriptive analysis?');

    // Check existing prescriptive analyses for student 202533333
    const existingAnalyses = await PrescriptiveAnalysis.find({
      studentId: 202533333
    }).select('readingLevel categoryId createdAt');

    console.log(`   Found ${existingAnalyses.length} existing prescriptive analyses for student 202533333:`);
    existingAnalyses.forEach(analysis => {
      console.log(`   - Reading Level: ${analysis.readingLevel}, Category: ${analysis.categoryId}, Date: ${analysis.createdAt}`);
    });

    // Test creating a duplicate for different reading level
    console.log('\n   Testing: Can we create Alphabet Knowledge analysis for High Emerging level?');
    const testDoc = {
      studentId: 202533333,
      categoryId: "Alphabet Knowledge",
      readingLevel: "High Emerging",
      assessmentType: "main",
      skillMastery: new Map(),
      abilityEstimates: new Map(),
      errorPatterns: new Map(),
      insights: {
        strengths: [],
        weaknesses: ["Test entry"],
        overallReadiness: "Test",
        recommendedAction: "immediate_intervention",
        passedCategories: 0,
        failedCategories: 1,
        overallScore: 33
      }
    };

    try {
      const testResult = await PrescriptiveAnalysis.create(testDoc);
      console.log(`   ✅ SUCCESS! Created test prescriptive analysis: ${testResult._id}`);
      console.log('   🎉 Multiple analyses for same student/category but different reading levels now allowed!');

      // Clean up test document
      await PrescriptiveAnalysis.deleteOne({ _id: testResult._id });
      console.log('   🧹 Cleaned up test document');

    } catch (error) {
      if (error.code === 11000) {
        console.log('   ❌ STILL FAILING: Duplicate key error still occurring');
        console.log('   Error details:', error.message);
        console.log('   💡 The problematic index may still exist or there may be another index causing issues');
      } else {
        console.log('   ❌ Other error occurred:', error.message);
      }
    }

    console.log('\n✅ Index fix process completed!');
    console.log('💡 If duplicate key errors persist, the High Emerging prescriptive analysis generation should now work.');

  } catch (error) {
    console.error('❌ Fix process failed:', error);
  } finally {
    mongoose.connection.close();
  }
}

fixPrescriptiveAnalysisIndexes();