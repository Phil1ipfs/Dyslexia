const mongoose = require('mongoose');

// Connect to MongoDB
mongoose.connect('mongodb+srv://johncasingal63:GqrI1M4qlAq8u1R0@cluster0.0f8ylb8.mongodb.net/test');

async function fixExistingCategories() {
  try {
    console.log('🔧 FIXING EXISTING CATEGORY RESULTS');

    const CategoryResult = require('./backend/models/Teachers/ManageProgress/categoryResultModel');

    // Find the specific student's category results
    const categoryResult = await CategoryResult.findOne({
      studentId: 202522233,
      'categories.categoryName': 'Alphabet Knowledge'
    });

    if (!categoryResult) {
      console.log('❌ Category result not found');
      return;
    }

    console.log('📊 BEFORE FIX:');
    console.log('  - completedCategories:', categoryResult.completedCategories);
    console.log('  - overallScore:', categoryResult.overallScore);
    console.log('  - allCategoriesPassed:', categoryResult.allCategoriesPassed);

    // Check current alphabet knowledge status
    const alphabetCategory = categoryResult.categories.find(cat => cat.categoryName === 'Alphabet Knowledge');
    console.log('  - Alphabet Knowledge isPassed:', alphabetCategory.isPassed);
    console.log('  - Alphabet Knowledge interventionCompleted:', alphabetCategory.interventionCompleted);

    // Manually trigger the recalculation logic (same as in our fixed code)
    if (alphabetCategory.isPassed && alphabetCategory.interventionCompleted) {
      console.log('🔄 TRIGGERING MANUAL RECALCULATION...');

      // Recalculate completedCategories (count of passed categories)
      const passedCategories = categoryResult.categories.filter(cat => cat.isPassed === true);
      const previousCompletedCategories = categoryResult.completedCategories || 0;
      categoryResult.completedCategories = passedCategories.length;

      console.log(`📊 completedCategories updated: ${previousCompletedCategories} → ${categoryResult.completedCategories}`);

      // Recalculate overallScore (weighted average)
      const totalCategories = categoryResult.categories.length;
      const overallScore = Math.round((passedCategories.length / totalCategories) * 100);
      const previousOverallScore = categoryResult.overallScore || 0;
      categoryResult.overallScore = overallScore;

      console.log(`📊 overallScore updated: ${previousOverallScore}% → ${categoryResult.overallScore}%`);

      // Update allCategoriesPassed flag
      const allPassed = passedCategories.length === totalCategories;
      categoryResult.allCategoriesPassed = allPassed;

      console.log(`📊 allCategoriesPassed updated: ${allPassed}`);

      // Update timestamps
      categoryResult.updatedAt = new Date();

      // Save the fixed category_results
      await categoryResult.save();

      console.log('✅ CATEGORY RESULTS FIXED SUCCESSFULLY!');
    } else {
      console.log('⚠️ Category not eligible for recalculation');
      console.log('   - isPassed:', alphabetCategory.isPassed);
      console.log('   - interventionCompleted:', alphabetCategory.interventionCompleted);
    }

    console.log('📊 AFTER FIX:');
    const updatedResult = await CategoryResult.findOne({
      studentId: 202522233,
      'categories.categoryName': 'Alphabet Knowledge'
    });
    console.log('  - completedCategories:', updatedResult.completedCategories);
    console.log('  - overallScore:', updatedResult.overallScore);
    console.log('  - allCategoriesPassed:', updatedResult.allCategoriesPassed);

    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

fixExistingCategories();