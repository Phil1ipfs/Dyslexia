const mongoose = require('mongoose');

/**
 * Model for the test.intervention_responses collection  
 * Records student responses to intervention assessment questions
 * Based on actual data structure from database - similar to student_responses but for interventions
 */
const interventionResponseSchema = new mongoose.Schema({
  studentId: {
    type: mongoose.Schema.Types.Mixed, // Can be integer or string
    required: true
  },
  interventionResultsId: {
    type: mongoose.Schema.Types.ObjectId,
    required: true
  },
  interventionAssessmentId: {
    type: mongoose.Schema.Types.ObjectId,
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

  // For Reading Comprehension questions only
  correctSentenceQuestions: {
    type: Number
  },
  totalSentenceQuestions: {
    type: Number
  },
  isCorrect: {
    type: Boolean,
    required: true
  },
  responseTime: {
    type: Number, // Critical for time prediction service
    required: false
  },
  answeredAt: {
    type: Date,
    required: true
  },
  createdAt: {
    type: Date,
    required: true
  },

  // VERSION TRACKING: Critical for revision validation
  revisionNumber: {
    type: Number,
    required: true,
    default: 1, // Which version of the intervention was taken (1, 2, 3...)
    validate: {
      validator: function(v) {
        return v >= 1 && Number.isInteger(v);
      },
      message: 'Revision number must be a positive integer starting from 1'
    }
  },

  readingLevel: {
    type: String,
    required: true,
    enum: ['Low Emerging', 'High Emerging', 'Developing', 'Transitioning', 'At Grade Level']
  }
}, {
  collection: 'intervention_responses'
});

// Index for performance optimization on common queries
interventionResponseSchema.index({ studentId: 1, category: 1 });
interventionResponseSchema.index({ studentId: 1, answeredAt: -1 });
interventionResponseSchema.index({ category: 1, readingLevel: 1 });

// ✅ AUTOMATIC INTERVENTION COMPLETION DETECTION WITH BATCH HANDLING
// This middleware triggers every time a new intervention response is saved
// But uses debouncing to handle batch submissions (when mobile drops all 15 responses at once)

let interventionProcessingQueue = new Map(); // Track pending processing by intervention

interventionResponseSchema.post('save', async function(doc) {
  try {
    console.log(`[INTERVENTION REAL-TIME] 🔄 New intervention response saved: Student ${doc.studentId}, Category: ${doc.category}, Question: ${doc.questionId}, RevisionNumber: ${doc.revisionNumber}`);

    const interventionKey = `${doc.studentId}_${doc.interventionAssessmentId}_${doc.revisionNumber}`;

    // Clear existing timeout for this intervention (debouncing)
    if (interventionProcessingQueue.has(interventionKey)) {
      clearTimeout(interventionProcessingQueue.get(interventionKey));
    }

    // Set new timeout to process after 2 seconds (allows batch submissions to complete)
    const timeoutId = setTimeout(async () => {
      try {
        console.log(`[INTERVENTION REAL-TIME] ⏰ Processing intervention after batch delay: ${interventionKey}`);

        // Import services dynamically to avoid circular dependency
        const CategoryResultsService = require('../../../services/Teachers/CategoryResultsService');
        const InterventionGeneratorService = require('../../../services/Teachers/InterventionGeneratorService');

        // Check if this intervention is now complete
        console.log(`[INTERVENTION REAL-TIME] 🔍 Checking completeness for intervention ${doc.interventionAssessmentId}...`);

        const completenessCheck = await CategoryResultsService.validateInterventionCompleteness(
          doc.studentId,
          doc.interventionAssessmentId
        );

        if (completenessCheck.isComplete) {
          console.log(`[INTERVENTION REAL-TIME] ✅ Intervention ${doc.interventionAssessmentId} is now COMPLETE for student ${doc.studentId}!`);

          // ✅ CRITICAL FIX: Check if intervention results already exist before generating new ones
          const InterventionAssessment = require('./interventionAssessmentModel');
          const interventionAssessment = await InterventionAssessment.findById(doc.interventionAssessmentId);

          if (interventionAssessment && interventionAssessment.interventionResultsId) {
            console.log(`[INTERVENTION REAL-TIME] ⚠️ Intervention results ALREADY EXIST (${interventionAssessment.interventionResultsId}) - SKIPPING generation to prevent duplicates`);
            return; // Exit early to prevent infinite loop
          }

          console.log(`[INTERVENTION REAL-TIME] 🎯 No existing results found - proceeding with generation...`);

          // Generate intervention results
          const interventionResults = await InterventionGeneratorService.processInterventionResults(
            doc.interventionAssessmentId
          );

          console.log(`[INTERVENTION REAL-TIME] ✅ Intervention results generated: ${interventionResults._id}`);

          // If intervention passed, this will automatically update category_results via the existing system
          if (interventionResults.isPassed) {
            console.log(`[INTERVENTION REAL-TIME] 🎉 Intervention PASSED! Category ${doc.category} will be marked as completed.`);
          } else {
            console.log(`[INTERVENTION REAL-TIME] ⚠️ Intervention FAILED. Teacher may need to revise questions.`);
          }

        } else {
          console.log(`[INTERVENTION REAL-TIME] ⏳ Intervention ${doc.interventionAssessmentId} still incomplete for student ${doc.studentId} (${completenessCheck.answered}/${completenessCheck.required} responses)`);
        }

        // Remove from processing queue
        interventionProcessingQueue.delete(interventionKey);

      } catch (error) {
        console.error(`[INTERVENTION REAL-TIME] ❌ Error processing intervention for student ${doc.studentId}:`, error.message);
        interventionProcessingQueue.delete(interventionKey);
      }
    }, 2000); // 2-second delay to handle batch submissions

    // Store timeout ID
    interventionProcessingQueue.set(interventionKey, timeoutId);

  } catch (error) {
    console.error(`[INTERVENTION REAL-TIME] ❌ Error setting up intervention processing for student ${doc.studentId}:`, error.message);
    // Don't throw - let the response save succeed even if auto-processing fails
  }
});

module.exports = mongoose.models.InterventionResponse || mongoose.model('InterventionResponse', interventionResponseSchema);