/**
 * Auto-Fix Script for Reading Comprehension Prescriptive Analysis
 * Fixes scoring issues and regenerates accurate prescriptive analysis
 */

const mongoose = require('mongoose');
const StudentResponse = require('./backend/models/studentResponseModel');
const MainAssessment = require('./backend/models/mainAssessmentModel');
const PrescriptiveAnalysis = require('./backend/models/prescriptiveAnalysisModel');

async function fixReadingComprehensionAnalysis(studentId = 202522233, prescriptiveAnalysisId = "68d327391b9f4942fe6d7016") {
  console.log(`🔧 [FIX] Starting Reading Comprehension analysis fix for student ${studentId}`);

  try {
    // 1. Get the actual student responses
    const studentResponses = await StudentResponse.find({
      studentId: studentId,
      category: "Reading Comprehension"
    }).sort({ answeredAt: 1 });

    console.log(`📝 [FIX] Found ${studentResponses.length} Reading Comprehension responses`);

    // 2. Get the main assessment with correct answers
    const mainAssessment = await MainAssessment.findOne({
      readingLevel: "At Grade Level",
      category: "Reading Comprehension",
      isActive: true
    });

    if (!mainAssessment) {
      throw new Error("Main assessment not found");
    }

    console.log(`📚 [FIX] Found main assessment with ${mainAssessment.questions.length} questions`);

    // 3. Re-score all responses correctly
    let correctCount = 0;
    const correctedResponses = [];
    const detailedErrors = [];

    for (const response of studentResponses) {
      const question = mainAssessment.questions.find(q => q.questionId === response.questionId);

      if (!question) {
        console.warn(`⚠️ [FIX] Question ${response.questionId} not found in main assessment`);
        continue;
      }

      // For Reading Comprehension: Check if student response matches correct answers
      let isCorrect = true;
      const studentAnswers = Array.isArray(response.response) ? response.response : [response.response];

      // All-or-nothing scoring: ALL sentence questions must be correct
      if (question.sentenceQuestions.length !== studentAnswers.length) {
        isCorrect = false;
      } else {
        for (let i = 0; i < question.sentenceQuestions.length; i++) {
          const correctAnswer = question.sentenceQuestions[i].correctAnswer;
          const acceptableAnswers = question.sentenceQuestions[i].acceptableAnswers || [];
          const studentAnswer = studentAnswers[i];

          // Check exact match or acceptable answer match (case insensitive)
          const isAnswerCorrect =
            studentAnswer.toLowerCase() === correctAnswer.toLowerCase() ||
            acceptableAnswers.some(acceptable =>
              studentAnswer.toLowerCase() === acceptable.toLowerCase()
            );

          if (!isAnswerCorrect) {
            isCorrect = false;
            // Track specific errors for detailed analysis
            detailedErrors.push({
              questionId: response.questionId,
              questionNumber: i + 1,
              questionText: question.sentenceQuestions[i].questionText,
              studentAnswer: studentAnswer,
              correctAnswer: correctAnswer,
              storyTitle: question.storyTitle || `Question ${response.questionId}`
            });
          }
        }
      }

      if (isCorrect) {
        correctCount++;
      }

      correctedResponses.push({
        questionId: response.questionId,
        correct: isCorrect,
        timestamp: response.answeredAt,
        studentAnswers: studentAnswers,
        expectedAnswers: question.sentenceQuestions.map(sq => sq.correctAnswer),
        storyTitle: question.storyTitle,
        sentenceCount: question.sentenceQuestions.length
      });

      // Update the student_response record with correct scoring
      await StudentResponse.updateOne(
        { _id: response._id },
        { $set: { isCorrect: isCorrect } }
      );
    }

    // 4. Calculate corrected score
    const totalQuestions = studentResponses.length;
    const correctedScore = Math.round((correctCount / totalQuestions) * 100);

    console.log(`📊 [FIX] Corrected scoring: ${correctCount}/${totalQuestions} = ${correctedScore}%`);

    // 5. Generate proper error pattern analysis
    const errorPatternAnalysis = {
      comprehension_errors: {
        count: totalQuestions - correctCount,
        total: totalQuestions,
        percentage: Math.round(((totalQuestions - correctCount) / totalQuestions) * 100),

        // All-or-nothing breakdown
        question_breakdown: {},

        // Comprehension skill analysis
        literal_comprehension: {
          errors: detailedErrors.filter(e => e.questionText.includes("Sino") || e.questionText.includes("Saan") || e.questionText.includes("Ano")).length,
          description: "difficulty identifying literal facts from text"
        },

        error_type: correctedScore < 50 ? "severe_comprehension_deficit" : "partial_story_comprehension",
        failed_questionIds: correctedResponses.filter(r => !r.correct).map(r => r.questionId),

        // Scoring methodology
        scoring_methodology: "all_or_nothing",
        scoring_rule: "Each questionId requires ALL sentence questions correct - no partial credit",

        detailedErrorAnalysis: detailedErrors.map(error => ({
          errorPattern: `Story comprehension failure in "${error.storyTitle}"`,
          specificPairs: [],
          interventionFocus: `Reading comprehension training with focus on ${error.questionText.includes("Sino") ? "character identification" : error.questionText.includes("Saan") ? "setting identification" : "action/detail identification"}`
        }))
      }
    };

    // 6. Generate corrected skill mastery using BKT
    let masteryProbability = 0.5; // Start with 50%
    const responseHistory = [];

    for (const response of correctedResponses) {
      // BKT parameters for Reading Comprehension
      const P_LEARN = 0.1;
      const P_GUESS = 0.25; // Lower guess rate for comprehension
      const P_SLIP = 0.1;

      if (response.correct) {
        // Bayesian update for correct answer
        const pCorrect = masteryProbability * (1 - P_SLIP) + (1 - masteryProbability) * P_GUESS;
        const posterior = (masteryProbability * (1 - P_SLIP)) / pCorrect;
        masteryProbability = posterior + (1 - posterior) * P_LEARN;
      } else {
        // Bayesian update for incorrect answer
        const pIncorrect = masteryProbability * P_SLIP + (1 - masteryProbability) * (1 - P_GUESS);
        const posterior = (masteryProbability * P_SLIP) / pIncorrected;
        masteryProbability = posterior + (1 - posterior) * P_LEARN;
      }

      responseHistory.push({
        questionId: response.questionId,
        correct: response.correct,
        timestamp: response.timestamp,
        masteryAfter: Math.round(masteryProbability * 1000) / 1000
      });
    }

    // 7. Generate proper intervention plan
    const interventionPlan = {
      required: correctedScore < 75,
      priority: correctedScore < 75 ? ["Reading Comprehension"] : [],
      specificFocus: {
        "Reading Comprehension": {
          focus: correctedScore < 50 ? "fundamental_comprehension_skills" : "advanced_comprehension_strategies",
          targetSkills: [
            "literal_comprehension",
            "character_identification",
            "setting_identification",
            "action_sequence_understanding"
          ],
          targetPatterns: [
            "story_element_identification",
            "factual_recall_from_text",
            "sequential_understanding"
          ],
          recommendedActivities: [
            "guided_reading_with_comprehension_checks",
            "story_mapping_exercises",
            "literal_comprehension_practice"
          ],
          questionDistribution: {
            total: correctedScore < 50 ? 16 : 12 // More questions for severe deficits
          }
        }
      }
    };

    // 8. Update the prescriptive analysis with corrected data
    const updateData = {
      'skillMastery.Reading Comprehension': {
        masteryProbability: masteryProbability,
        lastUpdated: new Date(),
        totalQuestions: totalQuestions,
        correctAnswers: correctCount,
        totalPossibleMatches: 0,
        correctMatches: 0,
        score: correctedScore,
        isPassed: correctedScore >= 75,
        status: correctedScore >= 75 ? "PASSED" : (correctedScore >= 50 ? "ADEQUATE" : "NEEDS_INTENSIVE_SUPPORT"),
        responseHistory: responseHistory
      },
      'errorPatterns.Reading Comprehension': errorPatternAnalysis,
      'interventionPlan': interventionPlan,
      'insights.overallScore': correctedScore,
      'insights.weaknesses': correctedScore < 75 ? [`Reading Comprehension - ${correctedScore}%`] : [],
      'insights.recommendedAction': correctedScore < 50 ? "intensive_intervention_required" : (correctedScore < 75 ? "intervention_required" : "continue_monitoring"),
      'insights.passedCategories': correctedScore >= 75 ? 1 : 0,
      'insights.failedCategories': correctedScore < 75 ? 1 : 0
    };

    await PrescriptiveAnalysis.updateOne(
      { _id: prescriptiveAnalysisId },
      { $set: updateData }
    );

    console.log(`✅ [FIX] Successfully updated prescriptive analysis with corrected Reading Comprehension data`);
    console.log(`📈 [FIX] Final score: ${correctedScore}% (${correctCount}/${totalQuestions})`);
    console.log(`🧠 [FIX] BKT Mastery: ${Math.round(masteryProbability * 100)}%`);
    console.log(`📝 [FIX] Error patterns: ${detailedErrors.length} specific errors identified`);

    return {
      success: true,
      originalScore: 38,
      correctedScore: correctedScore,
      correctAnswers: correctCount,
      totalQuestions: totalQuestions,
      masteryProbability: masteryProbability,
      errorsIdentified: detailedErrors.length,
      interventionRequired: correctedScore < 75
    };

  } catch (error) {
    console.error(`❌ [FIX] Error fixing Reading Comprehension analysis:`, error);
    throw error;
  }
}

// Auto-execute the fix
if (require.main === module) {
  mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/test')
    .then(() => {
      console.log('🔗 Connected to MongoDB');
      return fixReadingComprehensionAnalysis();
    })
    .then(result => {
      console.log('🎉 Fix completed successfully:', result);
      process.exit(0);
    })
    .catch(error => {
      console.error('💥 Fix failed:', error);
      process.exit(1);
    });
}

module.exports = { fixReadingComprehensionAnalysis };