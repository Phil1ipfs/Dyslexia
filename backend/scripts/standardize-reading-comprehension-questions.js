/**
 * Script to standardize Reading Comprehension intervention questions
 * Converts all questions to use only "sentenceQuestions" field
 * Removes inconsistent field names like "additionalSentenceQuestions"
 */

const mongoose = require('mongoose');

// Connection string - adjust as needed
const CONNECTION_STRING = process.env.MONGODB_URI || 'mongodb://localhost:27017/test';

async function standardizeReadingComprehensionQuestions() {
  try {
    console.log('🔄 CONNECTING TO MONGODB...');
    await mongoose.connect(CONNECTION_STRING);
    console.log('✅ CONNECTED TO MONGODB');

    const InterventionAssessment = mongoose.connection.db.collection('intervention_assessment');

    // Find all Reading Comprehension interventions
    console.log('🔍 FINDING READING COMPREHENSION INTERVENTIONS...');
    const interventions = await InterventionAssessment.find({
      category: "Reading Comprehension"
    }).toArray();

    console.log(`📊 FOUND ${interventions.length} READING COMPREHENSION INTERVENTIONS`);

    let updateCount = 0;
    let questionUpdateCount = 0;

    for (const intervention of interventions) {
      console.log(`\n🔧 PROCESSING INTERVENTION: ${intervention._id}`);
      console.log(`   - Student: ${intervention.studentId}`);
      console.log(`   - Questions: ${intervention.questions?.length || 0}`);

      let interventionUpdated = false;
      const updatedQuestions = [];

      for (let i = 0; i < intervention.questions.length; i++) {
        const question = intervention.questions[i];
        console.log(`\n   📝 Question ${i + 1}: ${question.questionId}`);

        let questionUpdated = false;
        const updatedQuestion = { ...question };

        // Check if question has additionalSentenceQuestions
        if (question.additionalSentenceQuestions && question.additionalSentenceQuestions.length > 0) {
          console.log(`      ⚠️  Found additionalSentenceQuestions (${question.additionalSentenceQuestions.length} items)`);

          // Move additionalSentenceQuestions to sentenceQuestions
          if (!updatedQuestion.sentenceQuestions) {
            updatedQuestion.sentenceQuestions = [];
          }

          // Merge additional questions into sentenceQuestions
          for (const additionalQ of question.additionalSentenceQuestions) {
            updatedQuestion.sentenceQuestions.push(additionalQ);
          }

          // Remove additionalSentenceQuestions fields
          delete updatedQuestion.additionalSentenceQuestions;
          delete updatedQuestion.hasAdditionalQuestions;
          delete updatedQuestion.additionalQuestionsCount;

          questionUpdated = true;
          interventionUpdated = true;
          questionUpdateCount++;

          console.log(`      ✅ Moved ${question.additionalSentenceQuestions.length} additional questions to sentenceQuestions`);
          console.log(`      ✅ Total sentenceQuestions: ${updatedQuestion.sentenceQuestions.length}`);
        }

        // Ensure sentenceQuestions exists even if empty
        if (!updatedQuestion.sentenceQuestions) {
          updatedQuestion.sentenceQuestions = [];
        }

        updatedQuestions.push(updatedQuestion);
      }

      // Update intervention if changes were made
      if (interventionUpdated) {
        console.log(`\n   💾 UPDATING INTERVENTION ${intervention._id}...`);

        const updateResult = await InterventionAssessment.updateOne(
          { _id: intervention._id },
          {
            $set: {
              questions: updatedQuestions,
              updatedAt: new Date()
            }
          }
        );

        if (updateResult.modifiedCount > 0) {
          updateCount++;
          console.log(`   ✅ INTERVENTION UPDATED SUCCESSFULLY`);
        } else {
          console.log(`   ⚠️  INTERVENTION UPDATE FAILED`);
        }
      } else {
        console.log(`   ℹ️  No changes needed for this intervention`);
      }
    }

    console.log(`\n🎉 STANDARDIZATION COMPLETE:`);
    console.log(`   - Interventions processed: ${interventions.length}`);
    console.log(`   - Interventions updated: ${updateCount}`);
    console.log(`   - Questions standardized: ${questionUpdateCount}`);

  } catch (error) {
    console.error('❌ ERROR DURING STANDARDIZATION:', error);
    throw error;
  } finally {
    await mongoose.connection.close();
    console.log('🔐 MONGODB CONNECTION CLOSED');
  }
}

// Run the standardization
if (require.main === module) {
  standardizeReadingComprehensionQuestions()
    .then(() => {
      console.log('✅ STANDARDIZATION SCRIPT COMPLETED SUCCESSFULLY');
      process.exit(0);
    })
    .catch((error) => {
      console.error('❌ STANDARDIZATION SCRIPT FAILED:', error);
      process.exit(1);
    });
}

module.exports = { standardizeReadingComprehensionQuestions };