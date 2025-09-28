const mongoose = require('mongoose');
const InterventionGeneratorService = require('./services/Teachers/InterventionGeneratorService');

async function fixMissingRevision2Results() {
  try {
    console.log('🔧 [FIX] Starting fix for missing revision 2 intervention results...');

    // Connect to MongoDB using the connection from app.js
    await mongoose.connect('mongodb+srv://goodboykit:T9HRRjhwL7hNSl4J@cluster0.0f8ylb8.mongodb.net/test?retryWrites=true&w=majority', {
      useNewUrlParser: true,
      useUnifiedTopology: true
    });

    console.log('✅ [FIX] Connected to MongoDB');

    // Target intervention ID from your data
    const interventionId = '68d7a38acc573c034e487fa5';
    const studentId = 202533333;

    console.log(`🎯 [FIX] Processing intervention: ${interventionId} for student: ${studentId}`);

    // Check current state
    const InterventionAssessment = require('./models/Teachers/ManageProgress/interventionAssessmentModel');
    const InterventionResponse = require('./models/Teachers/ManageProgress/interventionResponseModel');
    const InterventionResults = require('./models/Teachers/ManageProgress/interventionResultsModel');

    const intervention = await InterventionAssessment.findById(interventionId);
    console.log(`📊 [FIX] Intervention revision: ${intervention.revisionNumber}`);
    console.log(`📊 [FIX] Current interventionResultsId: ${intervention.interventionResultsId}`);

    // Check if revision 2 responses exist
    const revision2Responses = await InterventionResponse.find({
      interventionAssessmentId: interventionId,
      revisionNumber: 2
    });

    console.log(`📊 [FIX] Found ${revision2Responses.length} responses for revision 2`);
    revision2Responses.forEach((response, index) => {
      console.log(`  Response ${index + 1}: ${response.questionId} - correct: ${response.isCorrect}`);
    });

    // Check if revision 2 results already exist
    const existingRevision2Results = await InterventionResults.findOne({
      interventionAssessmentId: interventionId,
      revisionNumber: 2
    });

    if (existingRevision2Results) {
      console.log(`⚠️ [FIX] Revision 2 results already exist: ${existingRevision2Results._id}`);
      console.log(`📊 [FIX] Score: ${existingRevision2Results.score}, Passed: ${existingRevision2Results.isPassed}`);
      process.exit(0);
    }

    if (revision2Responses.length === 0) {
      console.log(`❌ [FIX] No revision 2 responses found - cannot generate results`);
      process.exit(1);
    }

    // Generate intervention results for revision 2
    console.log(`🎯 [FIX] Generating intervention results for revision 2...`);
    const generatorService = new InterventionGeneratorService();
    const results = await generatorService.processInterventionResults(interventionId);

    console.log(`✅ [FIX] Intervention results generated successfully:`, {
      resultId: results._id,
      score: results.score,
      isPassed: results.isPassed,
      revisionNumber: results.revisionNumber
    });

    // Verify linking
    const updatedIntervention = await InterventionAssessment.findById(interventionId);
    console.log(`🔗 [FIX] Updated intervention interventionResultsId: ${updatedIntervention.interventionResultsId}`);

    console.log(`🎉 [FIX] Fix completed successfully!`);
    process.exit(0);

  } catch (error) {
    console.error('❌ [FIX] Error fixing missing revision 2 results:', error.message);
    console.error('Stack:', error.stack);
    process.exit(1);
  }
}

fixMissingRevision2Results();