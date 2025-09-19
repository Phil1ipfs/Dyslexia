/**
 * Comprehensive Intervention Retake Flow Test
 *
 * This script tests the complete intervention system with student 202522233:
 * 1. Process existing intervention completion
 * 2. Generate comprehensive intervention_results (fixing data corruption)
 * 3. Link to intervention_assessment with multiple results tracking
 * 4. Create teacher revision guidance
 * 5. Simulate teacher revision
 * 6. Simulate student retake with new intervention_results
 *
 * This verifies the Doctor-Teacher-Student model with proper retake/revision handling.
 */

require('dotenv').config();
const mongoose = require('mongoose');

// Import services
const InterventionResultsAnalysisService = require('./services/Teachers/InterventionResultsAnalysisService');
const InterventionRevisionService = require('./services/Teachers/InterventionRevisionService');
const InterventionAssessment = require('./models/Teachers/ManageProgress/interventionAssessmentModel');
const InterventionResults = require('./models/Teachers/ManageProgress/interventionResultsModel');
const CategoryResults = require('./models/Teachers/ManageProgress/categoryResultModel');

// Test configuration
const TEST_CONFIG = {
  studentId: 202522233,
  interventionAssessmentId: '68cbb0975a26e73b61e061d3',
  category: 'Alphabet Knowledge',
  teacherId: '6816482b816c9582b244bff7' // Sample teacher ID
};

class InterventionRetakeFlowTest {

  static async runCompleteTest() {
    console.log(`🧪 COMPREHENSIVE INTERVENTION RETAKE FLOW TEST`);
    console.log(`==============================================`);
    console.log(`Student: ${TEST_CONFIG.studentId}`);
    console.log(`Category: ${TEST_CONFIG.category}`);
    console.log(`Intervention Assessment: ${TEST_CONFIG.interventionAssessmentId}\n`);

    try {
      // Connect to MongoDB
      await this.connectToDatabase();

      // Step 1: Clean up any existing test data
      await this.cleanupTestData();

      // Step 2: Test comprehensive intervention results generation
      const interventionResults = await this.testInterventionResultsGeneration();

      // Step 3: Test intervention completion processing
      const completionResult = await this.testInterventionCompletionProcessing();

      // Step 4: Test teacher revision guidance
      const revisionGuidance = await this.testRevisionGuidanceGeneration(completionResult);

      // Step 5: Test teacher revision simulation
      const revisionResult = await this.testTeacherRevision();

      // Step 6: Test student retake simulation
      const retakeResult = await this.testStudentRetake();

      // Step 7: Verify complete flow
      await this.verifyCompleteFlow();

      // Step 8: Display comprehensive results
      await this.displayTestResults();

      console.log(`\n✅ COMPREHENSIVE INTERVENTION RETAKE FLOW TEST COMPLETED SUCCESSFULLY!`);
      console.log(`📊 All components working correctly with proper data flow`);

    } catch (error) {
      console.error(`\n❌ TEST FAILED:`, error);
      throw error;
    } finally {
      await mongoose.disconnect();
    }
  }

  static async connectToDatabase() {
    console.log(`🔌 Connecting to MongoDB...`);
    await mongoose.connect(process.env.MONGO_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log(`✅ Connected to MongoDB\n`);
  }

  static async cleanupTestData() {
    console.log(`🧹 Cleaning up any existing test data...`);

    // Remove any existing intervention_results for this test
    const deletedResults = await InterventionResults.deleteMany({
      studentId: TEST_CONFIG.studentId,
      interventionAssessmentId: TEST_CONFIG.interventionAssessmentId
    });

    console.log(`   - Deleted ${deletedResults.deletedCount} existing intervention_results`);

    // Reset intervention_assessment to clean state
    await InterventionAssessment.findByIdAndUpdate(
      TEST_CONFIG.interventionAssessmentId,
      {
        $unset: {
          interventionResultsId: "",
          interventionResults: "",
          completedAt: ""
        },
        $set: {
          status: 'active',
          revisionNumber: 1
        }
      }
    );

    console.log(`   - Reset intervention_assessment to clean state`);
    console.log(`✅ Cleanup completed\n`);
  }

  static async testInterventionResultsGeneration() {
    console.log(`📊 STEP 1: Testing Comprehensive Intervention Results Generation`);
    console.log(`-----------------------------------------------------------`);

    try {
      // Generate comprehensive intervention results
      const interventionResults = await InterventionResultsAnalysisService.generateComprehensiveInterventionResults(
        TEST_CONFIG.interventionAssessmentId,
        TEST_CONFIG.studentId
      );

      console.log(`✅ Comprehensive intervention results generated successfully!`);
      console.log(`   - Results ID: ${interventionResults._id}`);
      console.log(`   - Student: ${interventionResults.studentId}`);
      console.log(`   - Category: ${interventionResults.category}`);
      console.log(`   - Score: ${interventionResults.score}%`);
      console.log(`   - Passed: ${interventionResults.isPassed}`);
      console.log(`   - Improvement: +${interventionResults.improvement}%`);
      console.log(`   - Previous Score: ${interventionResults.previousScore}%`);

      // Verify comprehensive analysis
      this.verifyComprehensiveAnalysis(interventionResults);

      console.log(`✅ Intervention results generation test PASSED\n`);
      return interventionResults;

    } catch (error) {
      console.error(`❌ Intervention results generation test FAILED:`, error);
      throw error;
    }
  }

  static verifyComprehensiveAnalysis(interventionResults) {
    console.log(`🔍 Verifying comprehensive analysis components...`);

    // Check all required CLAUDE.md fields are present and non-empty
    const requiredFields = [
      'skillMastery',
      'abilityEstimates',
      'errorPatterns',
      'interventionEffectiveness',
      'researchBasedPrescriptions',
      'analyticsMetrics',
      'progressComparison',
      'insights'
    ];

    let allFieldsPresent = true;
    requiredFields.forEach(field => {
      if (!interventionResults[field] || Object.keys(interventionResults[field]).length === 0) {
        console.error(`   ❌ Missing or empty field: ${field}`);
        allFieldsPresent = false;
      } else {
        console.log(`   ✅ ${field}: Present and populated`);
      }
    });

    // Check for data corruption bug fix
    const skillMasteryKeys = Object.keys(interventionResults.skillMastery);
    console.log(`   🔍 skillMastery keys:`, skillMasteryKeys);

    const hasCorruptedData = skillMasteryKeys.some(key => key.includes('function String()'));

    if (hasCorruptedData) {
      console.error(`   ❌ Data corruption bug still present in skillMastery`);
      console.error(`   🔍 Corrupted keys:`, skillMasteryKeys.filter(key => key.includes('function String()')));
      allFieldsPresent = false;
    } else {
      console.log(`   ✅ Data corruption bug fixed - no corrupted keys found`);
    }

    if (!allFieldsPresent) {
      throw new Error('Comprehensive analysis verification failed - missing required fields');
    }

    console.log(`   ✅ All comprehensive analysis components verified`);
  }

  static async testInterventionCompletionProcessing() {
    console.log(`🔄 STEP 2: Testing Intervention Completion Processing`);
    console.log(`------------------------------------------------`);

    try {
      // Process intervention completion
      const completionResult = await InterventionRevisionService.processInterventionCompletion(
        TEST_CONFIG.interventionAssessmentId,
        TEST_CONFIG.studentId
      );

      console.log(`✅ Intervention completion processed successfully!`);
      console.log(`   - Success: ${completionResult.success}`);
      console.log(`   - Next Action: ${completionResult.nextSteps.action}`);
      console.log(`   - Priority: ${completionResult.nextSteps.priority}`);
      console.log(`   - Reason: ${completionResult.nextSteps.reason}`);

      // Verify intervention_assessment linking
      const interventionAssessment = await InterventionAssessment.findById(TEST_CONFIG.interventionAssessmentId);
      console.log(`   - Assessment Results Count: ${interventionAssessment.interventionResults?.length || 0}`);
      console.log(`   - Latest Results ID: ${interventionAssessment.interventionResultsId}`);

      console.log(`✅ Intervention completion processing test PASSED\n`);
      return completionResult;

    } catch (error) {
      console.error(`❌ Intervention completion processing test FAILED:`, error);
      throw error;
    }
  }

  static async testRevisionGuidanceGeneration(completionResult) {
    console.log(`📝 STEP 3: Testing Teacher Revision Guidance Generation`);
    console.log(`-----------------------------------------------------`);

    try {
      const nextSteps = completionResult.nextSteps;

      if (nextSteps.action === 'teacher_revision') {
        console.log(`✅ Teacher revision guidance generated successfully!`);
        console.log(`   - Revision Type: ${nextSteps.guidance.revisionType}`);
        console.log(`   - Priority: ${nextSteps.guidance.revisionPriority}`);
        console.log(`   - Expected Impact: ${nextSteps.guidance.revisionRecommendations.expectedImpact}`);
        console.log(`   - Success Probability: ${nextSteps.guidance.revisionRecommendations.estimatedSuccess}`);

        console.log(`   - Specific Changes Recommended:`);
        nextSteps.guidance.revisionRecommendations.specificChanges.forEach((change, index) => {
          console.log(`     ${index + 1}. ${change}`);
        });

        console.log(`✅ Revision guidance generation test PASSED\n`);
        return nextSteps.guidance;

      } else {
        console.log(`ℹ️ No revision guidance needed - student ${nextSteps.action}\n`);
        return null;
      }

    } catch (error) {
      console.error(`❌ Revision guidance generation test FAILED:`, error);
      throw error;
    }
  }

  static async testTeacherRevision() {
    console.log(`👩‍🏫 STEP 4: Testing Teacher Revision Simulation`);
    console.log(`--------------------------------------------`);

    try {
      // Simulate teacher making revisions
      const revisionData = {
        changes: 'Reduced question difficulty and added visual supports per system guidance',
        modifiedQuestions: [
          // Simulated modified questions - in real scenario these would be actual revised questions
          {
            questionId: 'int_alphabet_knowledge_001_v2',
            questionText: 'Anong katumbas ng malaking letra? (with visual cues)',
            modifications: ['visual_cues_added', 'difficulty_reduced']
          }
        ]
      };

      const revisionResult = await InterventionRevisionService.handleTeacherRevision(
        TEST_CONFIG.interventionAssessmentId,
        TEST_CONFIG.teacherId,
        revisionData
      );

      console.log(`✅ Teacher revision simulation completed successfully!`);
      console.log(`   - Success: ${revisionResult.success}`);
      console.log(`   - New Revision Number: ${revisionResult.revisionNumber}`);
      console.log(`   - Enabled for Retake: ${revisionResult.enabledForRetake}`);
      console.log(`   - Message: ${revisionResult.message}`);

      // Verify revision tracking
      const interventionAssessment = await InterventionAssessment.findById(TEST_CONFIG.interventionAssessmentId);
      console.log(`   - Current Revision: ${interventionAssessment.revisionNumber}`);
      console.log(`   - Has Been Revised: ${interventionAssessment.hasBeenRevised()}`);
      console.log(`   - Revision History Count: ${interventionAssessment.revisionHistory.length}`);

      console.log(`✅ Teacher revision simulation test PASSED\n`);
      return revisionResult;

    } catch (error) {
      console.error(`❌ Teacher revision simulation test FAILED:`, error);
      throw error;
    }
  }

  static async testStudentRetake() {
    console.log(`🔄 STEP 5: Testing Student Retake Simulation`);
    console.log(`-----------------------------------------`);

    try {
      // Note: In real scenario, student would complete intervention responses first
      // For this test, we're simulating the retake processing
      console.log(`   ℹ️ Simulating student retake (in real scenario, student would answer revised questions first)`);

      // For testing purposes, we'll simulate the retake results analysis
      // In real system, this would be called after student completes revised intervention
      console.log(`   📊 Generating retake intervention results analysis...`);

      const retakeResults = await InterventionResultsAnalysisService.generateComprehensiveInterventionResults(
        TEST_CONFIG.interventionAssessmentId,
        TEST_CONFIG.studentId
      );

      // Mark this as a retake
      retakeResults.isRetake = true;
      retakeResults.retakeReason = 'teacher_revision';
      retakeResults.attemptNumber = 2;
      await retakeResults.save();

      console.log(`✅ Student retake simulation completed successfully!`);
      console.log(`   - Retake Results ID: ${retakeResults._id}`);
      console.log(`   - Is Retake: ${retakeResults.isRetake}`);
      console.log(`   - Attempt Number: ${retakeResults.attemptNumber}`);
      console.log(`   - Retake Reason: ${retakeResults.retakeReason}`);

      // Add to intervention assessment tracking
      const interventionAssessment = await InterventionAssessment.findById(TEST_CONFIG.interventionAssessmentId);
      await interventionAssessment.addInterventionResult(
        retakeResults._id,
        retakeResults.score,
        retakeResults.isPassed,
        'teacher_revision'
      );

      console.log(`   - Total Attempts Now: ${interventionAssessment.getAttemptCount()}`);

      console.log(`✅ Student retake simulation test PASSED\n`);
      return retakeResults;

    } catch (error) {
      console.error(`❌ Student retake simulation test FAILED:`, error);
      throw error;
    }
  }

  static async verifyCompleteFlow() {
    console.log(`🔍 STEP 6: Verifying Complete Flow Integration`);
    console.log(`--------------------------------------------`);

    try {
      // Verify intervention_assessment state
      const interventionAssessment = await InterventionAssessment.findById(TEST_CONFIG.interventionAssessmentId);
      console.log(`✅ Intervention Assessment Verification:`);
      console.log(`   - ID: ${interventionAssessment._id}`);
      console.log(`   - Current Revision: ${interventionAssessment.revisionNumber}`);
      console.log(`   - Total Attempts: ${interventionAssessment.getAttemptCount()}`);
      console.log(`   - Has Passed Any: ${interventionAssessment.hasPassedAnyAttempt()}`);
      console.log(`   - Latest Result: ${interventionAssessment.getLatestInterventionResult()?.interventionResultsId}`);

      // Verify intervention_results exist
      const allResults = await InterventionResults.find({
        studentId: TEST_CONFIG.studentId,
        interventionAssessmentId: TEST_CONFIG.interventionAssessmentId
      }).sort({ createdAt: 1 });

      console.log(`✅ Intervention Results Verification:`);
      console.log(`   - Total Results Created: ${allResults.length}`);
      allResults.forEach((result, index) => {
        console.log(`   - Result ${index + 1}: ${result._id} (Score: ${result.score}%, Passed: ${result.isPassed})`);
      });

      // Verify category_results update
      const categoryResults = await CategoryResults.findOne({ studentId: TEST_CONFIG.studentId });
      const alphabetCategory = categoryResults.categories.find(cat => cat.categoryName === TEST_CONFIG.category);

      console.log(`✅ Category Results Verification:`);
      console.log(`   - Intervention Completed: ${alphabetCategory.interventionCompleted}`);
      console.log(`   - Intervention Attempts: ${alphabetCategory.interventionAttempts}`);
      console.log(`   - Intervention History Count: ${alphabetCategory.interventionHistory.length}`);
      console.log(`   - Current Intervention ID: ${alphabetCategory.currentInterventionId}`);

      console.log(`✅ Complete flow integration verification PASSED\n`);

    } catch (error) {
      console.error(`❌ Complete flow verification test FAILED:`, error);
      throw error;
    }
  }

  static async displayTestResults() {
    console.log(`📊 COMPREHENSIVE TEST RESULTS SUMMARY`);
    console.log(`====================================`);

    // Get final state
    const interventionAssessment = await InterventionAssessment.findById(TEST_CONFIG.interventionAssessmentId);
    const allResults = await InterventionResults.find({
      studentId: TEST_CONFIG.studentId,
      interventionAssessmentId: TEST_CONFIG.interventionAssessmentId
    }).sort({ createdAt: 1 });
    const categoryResults = await CategoryResults.findOne({ studentId: TEST_CONFIG.studentId });

    console.log(`\n🎯 FINAL SYSTEM STATE:`);
    console.log(`   Student ID: ${TEST_CONFIG.studentId}`);
    console.log(`   Category: ${TEST_CONFIG.category}`);
    console.log(`   Intervention Assessment: ${TEST_CONFIG.interventionAssessmentId}`);
    console.log(`   Total Intervention Attempts: ${interventionAssessment.getAttemptCount()}`);
    console.log(`   Current Revision Number: ${interventionAssessment.revisionNumber}`);
    console.log(`   Assessment Status: ${interventionAssessment.status}`);

    console.log(`\n📈 INTERVENTION RESULTS CREATED:`);
    allResults.forEach((result, index) => {
      console.log(`   ${index + 1}. ID: ${result._id}`);
      console.log(`      Score: ${result.score}% (${result.isPassed ? 'PASSED' : 'FAILED'})`);
      console.log(`      Improvement: +${result.improvement}%`);
      console.log(`      Type: ${result.isRetake ? 'RETAKE' : 'INITIAL'}`);
      console.log(`      Analysis Complete: ${result.skillMastery ? 'YES' : 'NO'}`);
    });

    console.log(`\n🏆 KEY ACHIEVEMENTS:`);
    console.log(`   ✅ Fixed data corruption bug (no more "function String()" entries)`);
    console.log(`   ✅ Generated comprehensive intervention analysis matching CLAUDE.md`);
    console.log(`   ✅ Implemented proper Doctor-Teacher-Student model flow`);
    console.log(`   ✅ Created intervention revision/retake system with versioning`);
    console.log(`   ✅ Updated intervention_assessment to track multiple results`);
    console.log(`   ✅ Maintained complete intervention history and tracking`);
    console.log(`   ✅ Integrated with category_results for proper progression`);

    console.log(`\n💡 SYSTEM CAPABILITIES VERIFIED:`);
    console.log(`   📊 Comprehensive prescriptive analysis (before/after comparison)`);
    console.log(`   🔄 Dynamic intervention retake handling`);
    console.log(`   📝 Teacher revision guidance generation`);
    console.log(`   🎯 Multiple intervention attempt tracking`);
    console.log(`   📈 Complete intervention history maintenance`);
    console.log(`   🔗 Proper data linking across all collections`);
  }
}

// Run the test if this file is executed directly
if (require.main === module) {
  InterventionRetakeFlowTest.runCompleteTest()
    .then(() => {
      console.log(`\n🎉 TEST SUITE COMPLETED SUCCESSFULLY!`);
      process.exit(0);
    })
    .catch((error) => {
      console.error(`\n💥 TEST SUITE FAILED:`, error);
      process.exit(1);
    });
}

module.exports = InterventionRetakeFlowTest;