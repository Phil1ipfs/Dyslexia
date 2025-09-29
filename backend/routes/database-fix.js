const express = require('express');
const router = express.Router();
const PrescriptiveAnalysis = require('../models/Teachers/ManageProgress/prescriptiveAnalysisModel');

// API endpoint to fix prescriptive analysis indexes
router.post('/fix-prescriptive-indexes', async (req, res) => {
  try {
    console.log('🔧 API: Fixing prescriptive analysis database indexes...\n');

    // Get current indexes
    console.log('1. Checking current indexes:');
    const indexes = await PrescriptiveAnalysis.collection.getIndexes();
    console.log('   Current indexes:', Object.keys(indexes));

    const results = {
      currentIndexes: Object.keys(indexes),
      actions: [],
      success: false
    };

    // Check for the problematic index
    const problematicIndex = 'studentId_1_categoryId_1';
    if (indexes[problematicIndex]) {
      console.log(`\n   ❌ Found problematic index: ${problematicIndex}`);
      results.actions.push(`Found problematic index: ${problematicIndex}`);

      // Drop the problematic index
      console.log('\n2. Dropping problematic index:');
      try {
        await PrescriptiveAnalysis.collection.dropIndex(problematicIndex);
        console.log(`   ✅ Successfully dropped index: ${problematicIndex}`);
        results.actions.push(`Successfully dropped index: ${problematicIndex}`);
      } catch (error) {
        if (error.message.includes('index not found')) {
          console.log(`   ⚠️ Index ${problematicIndex} not found (already dropped or doesn't exist)`);
          results.actions.push(`Index ${problematicIndex} not found (already dropped)`);
        } else {
          throw error;
        }
      }
    } else {
      console.log(`\n   ✅ Problematic index ${problematicIndex} not found (good!)`);
      results.actions.push(`Problematic index ${problematicIndex} not found (good!)`);
    }

    // Create correct indexes
    console.log('\n3. Creating correct indexes:');

    // Index for efficient querying by student and reading level
    const correctIndex1 = { studentId: 1, readingLevel: 1, assessmentType: 1 };
    try {
      await PrescriptiveAnalysis.collection.createIndex(correctIndex1);
      console.log('   ✅ Created index: studentId_1_readingLevel_1_assessmentType_1');
      results.actions.push('Created index: studentId_1_readingLevel_1_assessmentType_1');
    } catch (error) {
      if (error.message.includes('already exists')) {
        console.log('   ⚠️ Index studentId_1_readingLevel_1_assessmentType_1 already exists');
        results.actions.push('Index studentId_1_readingLevel_1_assessmentType_1 already exists');
      } else {
        throw error;
      }
    }

    // Index for category-specific queries with reading level
    const correctIndex2 = { studentId: 1, categoryId: 1, readingLevel: 1 };
    try {
      await PrescriptiveAnalysis.collection.createIndex(correctIndex2);
      console.log('   ✅ Created index: studentId_1_categoryId_1_readingLevel_1');
      results.actions.push('Created index: studentId_1_categoryId_1_readingLevel_1');
    } catch (error) {
      if (error.message.includes('already exists')) {
        console.log('   ⚠️ Index studentId_1_categoryId_1_readingLevel_1 already exists');
        results.actions.push('Index studentId_1_categoryId_1_readingLevel_1 already exists');
      } else {
        throw error;
      }
    }

    // Verify final state
    console.log('\n4. Verifying final index state:');
    const finalIndexes = await PrescriptiveAnalysis.collection.getIndexes();
    console.log('   Final indexes:', Object.keys(finalIndexes));
    results.finalIndexes = Object.keys(finalIndexes);

    // Test the fix
    console.log('\n5. Testing: Can we now create High Emerging prescriptive analysis?');

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
      results.actions.push(`SUCCESS! Test document created: ${testResult._id}`);
      results.success = true;

      // Clean up test document
      await PrescriptiveAnalysis.deleteOne({ _id: testResult._id });
      console.log('   🧹 Cleaned up test document');
      results.actions.push('Cleaned up test document');

    } catch (error) {
      if (error.code === 11000) {
        console.log('   ❌ STILL FAILING: Duplicate key error still occurring');
        console.log('   Error details:', error.message);
        results.actions.push(`STILL FAILING: ${error.message}`);
        results.success = false;
      } else {
        console.log('   ❌ Other error occurred:', error.message);
        results.actions.push(`Other error: ${error.message}`);
        results.success = false;
      }
    }

    console.log('\n✅ Index fix process completed!');

    res.json({
      success: true,
      message: 'Index fix process completed',
      results: results
    });

  } catch (error) {
    console.error('❌ Fix process failed:', error);
    res.status(500).json({
      success: false,
      error: error.message,
      message: 'Fix process failed'
    });
  }
});

// API endpoint to generate missing High Emerging prescriptive analysis
router.post('/generate-high-emerging-analysis/:studentId', async (req, res) => {
  try {
    const { studentId } = req.params;
    console.log(`🔧 API: Generating missing High Emerging prescriptive analysis for student ${studentId}...`);

    const CategoryResult = require('../models/Teachers/ManageProgress/categoryResultModel');
    const IntegrationTriggerService = require('../services/Teachers/PrescriptiveAnalytics/integrationTriggerService');

    // Find High Emerging category_results
    const categoryResult = await CategoryResult.findOne({
      studentId: parseInt(studentId),
      readingLevel: 'High Emerging'
    });

    if (!categoryResult) {
      return res.status(404).json({
        success: false,
        message: `No High Emerging category_results found for student ${studentId}`
      });
    }

    console.log(`   ✅ Found category_results: ${categoryResult._id}`);

    // Check if prescriptive analysis already exists
    if (categoryResult.prescriptiveAnalysisId) {
      return res.json({
        success: true,
        message: `Prescriptive analysis already exists: ${categoryResult.prescriptiveAnalysisId}`,
        existingAnalysisId: categoryResult.prescriptiveAnalysisId
      });
    }

    // Generate prescriptive analysis
    console.log('   🧠 Generating prescriptive analysis...');
    const prescriptiveAnalysis = await IntegrationTriggerService.triggerPrescriptiveAnalysis(categoryResult.toObject());

    if (prescriptiveAnalysis) {
      // Link analysis back to category result
      categoryResult.prescriptiveAnalysisId = prescriptiveAnalysis._id;
      await categoryResult.save();

      console.log(`   ✅ Generated prescriptive analysis: ${prescriptiveAnalysis._id}`);

      res.json({
        success: true,
        message: 'Successfully generated High Emerging prescriptive analysis',
        analysisId: prescriptiveAnalysis._id,
        categoryResultId: categoryResult._id,
        readingLevel: prescriptiveAnalysis.readingLevel
      });

    } else {
      res.status(500).json({
        success: false,
        message: 'Failed to generate prescriptive analysis (returned null)'
      });
    }

  } catch (error) {
    console.error('❌ Generation failed:', error);
    res.status(500).json({
      success: false,
      error: error.message,
      message: 'Generation process failed'
    });
  }
});

module.exports = router;