// verify-fix.js - Quick script to verify the comprehensive fix worked
const mongoose = require('mongoose');

async function verifyFix() {
  try {
    // Connect to MongoDB
    await mongoose.connect('mongodb+srv://klester:dXdmL5YRShiLYNQS@cluster0.0f8ylb8.mongodb.net/test', {
      useNewUrlParser: true,
      useUnifiedTopology: true
    });

    console.log('✅ Connected to MongoDB');

    // Get category results model
    const CategoryResult = require('./models/Teachers/ManageProgress/categoryResultModel');

    // Check the specific students that were problematic
    const problematicStudents = [202534029, 2025121];

    for (const studentId of problematicStudents) {
      console.log(`\n🔍 Checking student ${studentId}:`);

      const categoryResult = await CategoryResult.findOne({ studentId }).lean();

      if (categoryResult) {
        categoryResult.categories.forEach(category => {
          console.log(`  📊 ${category.categoryName}: ${category.totalQuestions} questions (score: ${category.score}%)`);
        });
      } else {
        console.log(`  ❌ No category results found`);
      }
    }

    // Check main assessment question counts for reference
    const MainAssessment = require('./models/Teachers/mainAssessmentModel');
    const mainAssessments = await MainAssessment.find({ isActive: true }).lean();

    console.log('\n📋 Correct question counts from main_assessment:');
    mainAssessments.forEach(assessment => {
      if (assessment.questions && assessment.questions.length > 0) {
        console.log(`  📝 ${assessment.category}: ${assessment.questions.length} questions`);
      }
    });

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    mongoose.disconnect();
  }
}

verifyFix();