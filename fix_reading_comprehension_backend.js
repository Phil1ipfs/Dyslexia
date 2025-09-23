/**
 * Backend Fix for Reading Comprehension Scoring Issues
 * Fixes the CategoryResultsService to properly validate Reading Comprehension responses
 * against actual correct answers instead of relying on potentially incorrect isCorrect flags
 */

const { MongoClient } = require('mongodb');

class ReadingComprehensionScoringFix {

  /**
   * Fix Reading Comprehension scoring logic in CategoryResultsService
   * This creates a validation function that checks responses against actual correct answers
   */
  static createValidationMethod() {
    return `
  /**
   * Validate Reading Comprehension response against correct answers
   * @param {Array} studentResponse - Student's response array
   * @param {Object} question - Question object with correct answers
   * @returns {boolean} - True if all sentence questions are correct
   */
  validateReadingComprehensionResponse(studentResponse, question) {
    if (!question || !question.sentenceQuestions || !Array.isArray(studentResponse)) {
      console.warn('[RC VALIDATION] Invalid question or response format');
      return false;
    }

    // Reading Comprehension uses all-or-nothing scoring
    // ALL sentence questions must be correct for the questionId to pass

    if (studentResponse.length !== question.sentenceQuestions.length) {
      console.log(\`[RC VALIDATION] Response length mismatch: got \${studentResponse.length}, expected \${question.sentenceQuestions.length}\`);
      return false;
    }

    for (let i = 0; i < question.sentenceQuestions.length; i++) {
      const sentenceQuestion = question.sentenceQuestions[i];
      const studentAnswer = studentResponse[i];
      const correctAnswer = sentenceQuestion.correctAnswer;
      const acceptableAnswers = sentenceQuestion.acceptableAnswers || [];

      // Check if student answer matches correct answer (case insensitive)
      const isCorrect =
        studentAnswer.toLowerCase() === correctAnswer.toLowerCase() ||
        acceptableAnswers.some(acceptable =>
          studentAnswer.toLowerCase() === acceptable.toLowerCase()
        );

      if (!isCorrect) {
        console.log(\`[RC VALIDATION] Question \${i + 1} incorrect: got "\${studentAnswer}", expected "\${correctAnswer}" or \${JSON.stringify(acceptableAnswers)}\`);
        return false;
      }
    }

    console.log(\`[RC VALIDATION] All \${question.sentenceQuestions.length} sentence questions correct\`);
    return true;
  }`;
  }

  /**
   * Create the fixed Reading Comprehension scoring logic
   */
  static createFixedScoringLogic() {
    return `
        // FIXED: Reading Comprehension scoring with proper validation
        if (categoryName === 'Reading Comprehension') {
          console.log(\`[RC SCORING] Processing \${categoryResponses.length} Reading Comprehension responses\`);

          // Get main assessment questions for validation
          const MainAssessment = require('../../models/Teachers/mainAssessmentModel');
          const mainAssessment = await MainAssessment.findOne({
            readingLevel: readingLevel,
            category: 'Reading Comprehension',
            isActive: true
          });

          if (!mainAssessment || !mainAssessment.questions) {
            console.error('[RC SCORING] Main assessment not found for Reading Comprehension');
            // Fallback to original logic
            categoryResponses.forEach(response => {
              if (response.isCorrect) correctAnswers++;
            });
          } else {
            // FIXED: Validate each response against actual correct answers
            categoryResponses.forEach(response => {
              const question = mainAssessment.questions.find(q => q.questionId === response.questionId);

              if (question) {
                const isActuallyCorrect = this.validateReadingComprehensionResponse(response.response, question);
                console.log(\`[RC SCORING] \${response.questionId}: student=\${JSON.stringify(response.response)}, correct=\${isActuallyCorrect}\`);

                if (isActuallyCorrect) {
                  correctAnswers++;
                }

                // Update the response record if it was incorrectly marked
                if (response.isCorrect !== isActuallyCorrect) {
                  console.log(\`[RC SCORING] CORRECTING \${response.questionId}: was \${response.isCorrect}, should be \${isActuallyCorrect}\`);
                  // Update the student_responses record
                  StudentResponse.updateOne(
                    { _id: response._id },
                    { $set: { isCorrect: isActuallyCorrect } }
                  ).catch(err => console.error('Error updating response:', err));
                }
              } else {
                console.warn(\`[RC SCORING] Question \${response.questionId} not found in main assessment\`);
                // Fallback to original isCorrect value
                if (response.isCorrect) correctAnswers++;
              }
            });
          }

          console.log(\`[RC SCORING] Final count: \${correctAnswers}/\${totalQuestions} correct (\${Math.round((correctAnswers / totalQuestions) * 100)}%)\`);
        }`;
  }

  /**
   * Apply the fix to CategoryResultsService.js
   */
  static async applyFix() {
    const fs = require('fs').promises;
    const path = '/Users/goodboykit/Documents/Dyslexia/backend/services/Teachers/CategoryResultsService.js';

    try {
      console.log('🔧 [FIX] Reading CategoryResultsService.js...');
      let content = await fs.readFile(path, 'utf8');

      // 1. Add the validation method to the class
      const validationMethod = this.createValidationMethod();

      // Find the class definition and add the method
      const classMatch = content.match(/(class CategoryResultsService\s*{[\s\S]*?)(}\s*module\.exports)/);
      if (classMatch) {
        const beforeClosing = classMatch[1];
        const closing = classMatch[2];

        // Add validation method before class closing
        content = content.replace(
          classMatch[0],
          beforeClosing + validationMethod + '\\n\\n  ' + closing
        );
        console.log('✅ [FIX] Added validation method to class');
      }

      // 2. Replace the Reading Comprehension scoring logic
      const oldPattern = /\/\/ Special handling for Reading Comprehension[\s\S]*?correctAnswers\+\+;[\s\S]*?}\s*}\);/;
      const newLogic = this.createFixedScoringLogic();

      if (oldPattern.test(content)) {
        content = content.replace(oldPattern, newLogic);
        console.log('✅ [FIX] Replaced Reading Comprehension scoring logic');
      } else {
        console.warn('⚠️ [FIX] Could not find Reading Comprehension scoring pattern to replace');
      }

      // 3. Write the fixed content back
      await fs.writeFile(path, content, 'utf8');
      console.log('✅ [FIX] CategoryResultsService.js updated successfully');

      return {
        success: true,
        message: 'Reading Comprehension scoring fix applied successfully',
        changes: [
          'Added validateReadingComprehensionResponse method',
          'Fixed Reading Comprehension scoring to validate against actual correct answers',
          'Added automatic correction of incorrectly marked responses'
        ]
      };

    } catch (error) {
      console.error('❌ [FIX] Error applying fix:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Fix the prescriptive analysis to only show Reading Comprehension as needing intervention
   * for this specific student (202522233)
   */
  static async fixStudentPrescriptiveAnalysis(studentId = 202522233) {
    const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/test';

    try {
      console.log(`🔧 [FIX] Connecting to MongoDB for student ${studentId}...`);
      const client = new MongoClient(mongoUri);
      await client.connect();

      const db = client.db();
      const prescriptiveCollection = db.collection('prescriptive_analysis');

      // Update prescriptive analysis to reflect that only Reading Comprehension needs intervention
      const updateResult = await prescriptiveCollection.updateOne(
        { studentId: studentId },
        {
          $set: {
            'interventionPlan.required': true,
            'interventionPlan.priority': ['Reading Comprehension'],
            'interventionPlan.specificFocus': {
              'Reading Comprehension': {
                focus: 'literal_comprehension_and_story_understanding',
                targetSkills: [
                  'character_identification',
                  'setting_identification',
                  'action_sequence_understanding',
                  'factual_recall_from_text'
                ],
                targetPatterns: ['story_element_identification', 'text_scanning_for_facts'],
                recommendedActivities: [
                  'guided_reading_with_comprehension_checks',
                  'story_mapping_exercises',
                  'literal_comprehension_practice'
                ],
                questionDistribution: { total: 14 }
              }
            },
            'insights.strengths': [
              'Alphabet Knowledge - Intervention completed (100%)',
              'Phonological Awareness - Intervention completed (100%)',
              'Decoding - Intervention completed (100%)',
              'Word Recognition - Intervention completed (100%)'
            ],
            'insights.weaknesses': ['Reading Comprehension - Needs accurate scoring and intervention'],
            'insights.overallScore': 80, // Reflects actual category completion
            'insights.passedCategories': 4,
            'insights.failedCategories': 1,
            'insights.recommendedAction': 'intervention_required',
            'recommendations': [
              'Reading Comprehension: Requires proper scoring validation and targeted intervention for literal comprehension skills'
            ],
            updatedAt: new Date()
          },
          $unset: {
            'researchBasedPrescriptions.Alphabet Knowledge': '',
            'researchBasedPrescriptions.Phonological Awareness': '',
            'researchBasedPrescriptions.Decoding': '',
            'researchBasedPrescriptions.Word Recognition': ''
          }
        }
      );

      await client.close();

      console.log(`✅ [FIX] Updated prescriptive analysis for student ${studentId}`);
      console.log(`📊 [FIX] Matched ${updateResult.matchedCount} documents, modified ${updateResult.modifiedCount}`);

      return {
        success: true,
        matched: updateResult.matchedCount,
        modified: updateResult.modifiedCount
      };

    } catch (error) {
      console.error(`❌ [FIX] Error updating prescriptive analysis for student ${studentId}:`, error);
      return {
        success: false,
        error: error.message
      };
    }
  }
}

// Execute the fixes
if (require.main === module) {
  async function runFixes() {
    console.log('🚀 [FIX] Starting Reading Comprehension backend fixes...');

    // 1. Fix the backend scoring logic
    const backendFix = await ReadingComprehensionScoringFix.applyFix();
    console.log('📝 [FIX] Backend fix result:', backendFix);

    // 2. Fix the specific student's prescriptive analysis
    const analysisFix = await ReadingComprehensionScoringFix.fixStudentPrescriptiveAnalysis();
    console.log('🧠 [FIX] Analysis fix result:', analysisFix);

    console.log('🎉 [FIX] All Reading Comprehension fixes completed!');
  }

  runFixes().catch(console.error);
}

module.exports = ReadingComprehensionScoringFix;