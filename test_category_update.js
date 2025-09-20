const mongoose = require('mongoose');

// Connect to MongoDB
mongoose.connect('mongodb+srv://johncasingal63:GqrI1M4qlAq8u1R0@cluster0.0f8ylb8.mongodb.net/test');

async function testCategoryUpdate() {
  try {
    console.log('🔍 TESTING CATEGORY RESULTS UPDATE');

    // Get the current category results
    const CategoryResult = require('./backend/models/Teachers/ManageProgress/categoryResultModel');
    const categoryResult = await CategoryResult.findOne({
      studentId: 202522233,
      'categories.categoryName': 'Alphabet Knowledge'
    });

    console.log('📊 CURRENT CATEGORY RESULTS STATISTICS:');
    console.log('  - completedCategories:', categoryResult.completedCategories);
    console.log('  - overallScore:', categoryResult.overallScore);
    console.log('  - allCategoriesPassed:', categoryResult.allCategoriesPassed);

    console.log('📊 ALPHABET KNOWLEDGE STATUS:');
    const alphabetCategory = categoryResult.categories.find(cat => cat.categoryName === 'Alphabet Knowledge');
    console.log('  - isPassed:', alphabetCategory.isPassed);
    console.log('  - interventionCompleted:', alphabetCategory.interventionCompleted);
    console.log('  - interventionAttempts:', alphabetCategory.interventionAttempts);
    console.log('  - intervention history length:', alphabetCategory.interventionHistory.length);

    console.log('📊 ALL CATEGORIES PASS STATUS:');
    categoryResult.categories.forEach(cat => {
      console.log(`  - ${cat.categoryName}: isPassed=${cat.isPassed}, score=${cat.score}%`);
    });

    // Test the logic: should be 1 passed category (Alphabet Knowledge)
    const passedCategories = categoryResult.categories.filter(cat => cat.isPassed === true);
    const expectedCompletedCategories = passedCategories.length;
    const expectedOverallScore = Math.round((passedCategories.length / categoryResult.categories.length) * 100);

    console.log('🧮 EXPECTED VALUES:');
    console.log(`  - Should have completedCategories: ${expectedCompletedCategories}`);
    console.log(`  - Should have overallScore: ${expectedOverallScore}%`);

    if (categoryResult.completedCategories === expectedCompletedCategories &&
        categoryResult.overallScore === expectedOverallScore) {
      console.log('✅ STATISTICS ARE CORRECT!');
    } else {
      console.log('❌ STATISTICS NEED UPDATE!');
    }

    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

testCategoryUpdate();