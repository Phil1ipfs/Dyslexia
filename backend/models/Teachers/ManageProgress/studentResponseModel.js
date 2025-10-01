const mongoose = require('mongoose');

/**
 * Model for the test.student_responses collection  
 * Records student responses to main assessment questions (READ-ONLY for web interface)
 * Based on actual data structure from database
 */
const studentResponseSchema = new mongoose.Schema({
  studentId: {
    type: mongoose.Schema.Types.Mixed, // Can be integer or string
    required: true
  },
  categoryId: {
    type: mongoose.Schema.Types.ObjectId,
    required: true
  },
  questionId: {
    type: String,
    required: true
  },
  category: {
    type: String,
    required: true,
    enum: ['Alphabet Knowledge', 'Phonological Awareness', 'Word Recognition', 'Decoding', 'Reading Comprehension']
  },
  response: {
    type: mongoose.Schema.Types.Mixed, // Array with different formats per question type
    required: true
  },
  // For Phonological Awareness questions only
  correctMatches: {
    type: Number
  },
  totalMatches: {
    type: Number  
  },
  isCorrect: {
    type: Boolean,
    required: true
  },
  responseTime: {
    type: Number
  },
  answeredAt: {
    type: Date,
    required: true
  },
  createdAt: {
    type: Date,
    required: true
  },
  readingLevel: {
    type: String,
    required: true,
    enum: ['Low Emerging', 'High Emerging', 'Developing', 'Transitioning', 'At Grade Level']
  }
}, {
  collection: 'student_responses'
});

// ✅ AUTOMATIC CATEGORY COMPLETION DETECTION WITH BATCH HANDLING
// This middleware triggers every time a new response is saved
// But uses debouncing to handle batch submissions (when mobile drops all 15 responses at once)

let assessmentProcessingQueue = new Map(); // Track pending processing by category

studentResponseSchema.post('save', async function(doc) {
  try {
    console.log(`[REAL-TIME DETECTION] 🔄 New response saved: Student ${doc.studentId}, Category: ${doc.category}, Question: ${doc.questionId}`);

    // Create unique key for this student-category combination
    const assessmentKey = `${doc.studentId}_${doc.category}`;

    // Clear existing timeout for this assessment category (debouncing)
    if (assessmentProcessingQueue.has(assessmentKey)) {
      clearTimeout(assessmentProcessingQueue.get(assessmentKey));
    }

    // Set new timeout to process after 2 seconds (allows batch submissions to complete)
    const timeoutId = setTimeout(async () => {
      try {
        console.log(`[REAL-TIME DETECTION] ⏰ Processing assessment after batch delay: ${assessmentKey}`);

        // Import CategoryResultsService dynamically to avoid circular dependency
        const CategoryResultsService = require('../../../services/Teachers/CategoryResultsService');

        // Get the user to determine reading level
        const User = require('../../userModel');
        const user = await User.findOne({ idNumber: doc.studentId });

        if (!user || !user.readingLevel) {
          console.log(`[REAL-TIME DETECTION] ⚠️ No user or reading level found for student ${doc.studentId}`);
          assessmentProcessingQueue.delete(assessmentKey);
          return;
        }

        // Check if this category is now complete
        console.log(`[REAL-TIME DETECTION] 🔍 Checking completeness for ${doc.category} after batch processing...`);

        const completenessCheck = await CategoryResultsService.validateAssessmentCompleteness(
          doc.studentId,
          user.readingLevel,
          doc.category
        );

        const categoryStatus = completenessCheck.categoryResults[doc.category];

        if (categoryStatus && categoryStatus.isComplete) {
          console.log(`[REAL-TIME DETECTION] ✅ ${doc.category} is now COMPLETE for student ${doc.studentId}! Triggering category results generation...`);

          // Generate/update category results for this specific category
          await CategoryResultsService.generateCategoryResultsFromResponses(
            doc.studentId,
            user.readingLevel,
            doc.category
          );

          console.log(`[REAL-TIME DETECTION] ✅ Category results updated for ${doc.category}`);
        } else {
          console.log(`[REAL-TIME DETECTION] ⏳ ${doc.category} still incomplete for student ${doc.studentId} (${categoryStatus ? categoryStatus.answered : 0}/${categoryStatus ? categoryStatus.required : '?'} responses)`);
        }

        // Remove from processing queue
        assessmentProcessingQueue.delete(assessmentKey);

      } catch (error) {
        console.error(`[REAL-TIME DETECTION] ❌ Error processing assessment for student ${doc.studentId}:`, error.message);
        assessmentProcessingQueue.delete(assessmentKey);
      }
    }, 2000); // 2-second delay to handle batch submissions

    // Store timeout ID
    assessmentProcessingQueue.set(assessmentKey, timeoutId);

  } catch (error) {
    console.error(`[REAL-TIME DETECTION] ❌ Error setting up assessment processing for student ${doc.studentId}:`, error.message);
    // Don't throw - let the response save succeed even if auto-processing fails
  }
});

module.exports = mongoose.models.StudentResponse || mongoose.model('StudentResponse', studentResponseSchema);