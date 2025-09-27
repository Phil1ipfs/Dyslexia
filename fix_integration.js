// Manual fix for missing intervention attempt 2 in category results
const mongoose = require('mongoose');
const path = require('path');

// Load environment variables
require('dotenv').config({ path: path.join(__dirname, 'backend', '.env') });

async function fixIntegrationManually() {
  try {
    // Connect to MongoDB with explicit options
    await mongoose.connect(process.env.MONGO_URI, {
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000,
    });
    console.log('✅ Connected to MongoDB');

    // Load models
    const CategoryResults = require('./backend/models/Teachers/ManageProgress/categoryResultModel');

    // Get the category_results record for student 202533333 at "Developing" level
    const categoryResults = await CategoryResults.findOne({
      studentId: 202533333,
      readingLevel: "Developing"
    });

    if (!categoryResults) {
      console.log('❌ Category results not found');
      return;
    }

    console.log('✅ Found category_results for Developing level:', categoryResults._id);

    // Find the Alphabet Knowledge category
    const categoryIndex = categoryResults.categories.findIndex(cat => cat.categoryName === "Alphabet Knowledge");
    if (categoryIndex === -1) {
      console.log('❌ Alphabet Knowledge category not found');
      return;
    }

    const alphabetCategory = categoryResults.categories[categoryIndex];
    console.log('✅ Found Alphabet Knowledge category');
    console.log('- Current intervention attempts:', alphabetCategory.interventionAttempts);
    console.log('- Current intervention completed:', alphabetCategory.interventionCompleted);
    console.log('- Current isPassed:', alphabetCategory.isPassed);
    console.log('- Current history length:', alphabetCategory.interventionHistory?.length || 0);

    // Add the missing attempt 2 to interventionHistory
    const newHistoryEntry = {
      attemptNumber: 2,
      interventionId: new mongoose.Types.ObjectId("68d7a38acc573c034e487fa5"),
      interventionResultId: new mongoose.Types.ObjectId("68d7b4915602e99ab53e6cdc"),
      revisionNumber: 2,
      score: 100,
      isPassed: true,
      attemptedAt: new Date("2025-09-27T09:55:29.968Z"),
      completedAt: new Date("2025-09-27T09:55:29.968Z"),
      attemptReason: "teacher_revision"
    };

    // Update the category
    categoryResults.categories[categoryIndex].interventionAttempts = 2;
    categoryResults.categories[categoryIndex].interventionCompleted = true;
    categoryResults.categories[categoryIndex].isPassed = true; // CRITICAL: Mark as passed
    categoryResults.categories[categoryIndex].interventionRequired = false;
    categoryResults.categories[categoryIndex].currentInterventionId = null; // Clear since passed

    // Add to intervention history
    if (!categoryResults.categories[categoryIndex].interventionHistory) {
      categoryResults.categories[categoryIndex].interventionHistory = [];
    }
    categoryResults.categories[categoryIndex].interventionHistory.push(newHistoryEntry);

    // Update timestamps
    categoryResults.updatedAt = new Date();

    // Save the updated category_results
    await categoryResults.save();

    console.log('\\n✅ MANUAL FIX APPLIED SUCCESSFULLY!');
    console.log('- Intervention attempts updated to:', categoryResults.categories[categoryIndex].interventionAttempts);
    console.log('- Intervention completed updated to:', categoryResults.categories[categoryIndex].interventionCompleted);
    console.log('- isPassed updated to:', categoryResults.categories[categoryIndex].isPassed);
    console.log('- History length updated to:', categoryResults.categories[categoryIndex].interventionHistory.length);
    console.log('- Current intervention ID cleared:', categoryResults.categories[categoryIndex].currentInterventionId);

    console.log('\\n📊 Updated Intervention History:');
    categoryResults.categories[categoryIndex].interventionHistory.forEach((hist, index) => {
      console.log(`  ${index + 1}. Attempt ${hist.attemptNumber}: Score ${hist.score}%, Passed: ${hist.isPassed}, Revision: ${hist.revisionNumber || 'unknown'}`);
    });

  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error(error.stack);
  } finally {
    await mongoose.disconnect();
    console.log('\\n✅ Database connection closed');
    process.exit(0);
  }
}

fixIntegrationManually();