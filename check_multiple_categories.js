const mongoose = require('mongoose');
require('dotenv').config();

mongoose.connect('mongodb+srv://johncasingal63:GqrI1M4qlAq8u1R0@cluster0.0f8ylb8.mongodb.net/test')
  .then(async () => {
    const CategoryResults = mongoose.connection.db.collection('category_results');

    console.log('🔍 FINDING STUDENTS WITH MULTIPLE CATEGORIES...\n');

    const results = await CategoryResults.find({}).toArray();

    for (const result of results) {
      const student = result.studentId;
      const categories = result.categories || [];

      if (categories.length > 1) {
        console.log(`👤 Student ${student}:`);
        console.log(`   📊 Overall: completedCategories=${result.completedCategories || 0}, overallScore=${result.overallScore || 0}%`);

        categories.forEach((cat, i) => {
          const passed = cat.isPassed ? '✅ PASSED' : '❌ FAILED';
          const intervention = cat.interventionCompleted ? '🎯 +INTERVENTION' : '';
          const score = cat.score || 0;
          console.log(`   ${i+1}. ${cat.categoryName}: ${score}% ${passed} ${intervention}`);
        });

        // Calculate what the stats SHOULD be
        const passedCount = categories.filter(c => c.isPassed === true).length;
        const expectedOverall = Math.round((passedCount / categories.length) * 100);

        const needsFix = (result.completedCategories !== passedCount) || (result.overallScore !== expectedOverall);
        if (needsFix) {
          console.log(`   🔧 NEEDS FIX: Should be completedCategories=${passedCount}, overallScore=${expectedOverall}%`);
        } else {
          console.log(`   ✅ CORRECT: Statistics match actual performance`);
        }
        console.log('');
      }
    }

    process.exit(0);
  })
  .catch(err => {
    console.error('Error:', err);
    process.exit(1);
  });