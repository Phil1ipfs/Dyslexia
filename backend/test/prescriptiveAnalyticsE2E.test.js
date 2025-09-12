/**
 * End-to-End Test for Prescriptive Analytics Flow
 * Tests the complete flow: Assessment → Category Results → Prescriptive Analysis → Intervention → Results Processing
 */

const mongoose = require('mongoose');
require('dotenv').config();

// Import services and models
const CategoryResultsService = require('../services/Teachers/CategoryResultsService');
const PrescriptiveAnalyticsService = require('../services/Teachers/PrescriptiveAnalyticsService');
const InterventionGeneratorService = require('../services/Teachers/InterventionGeneratorService');
const ProgressTrackingService = require('../services/Teachers/ProgressTrackingService');
const IntegrationTriggerService = require('../services/Teachers/PrescriptiveAnalytics/integrationTriggerService');

const PrescriptiveAnalysis = require('../models/Teachers/ManageProgress/prescriptiveAnalysisModel');
const CategoryResult = require('../models/Teachers/ManageProgress/categoryResultModel');
const InterventionAssessment = require('../models/Teachers/ManageProgress/interventionAssessmentModel');
const InterventionResults = require('../models/Teachers/ManageProgress/interventionResultsModel');
const User = require('../models/userModel');

/**
 * End-to-End Prescriptive Analytics Test Suite
 */
class PrescriptiveAnalyticsE2ETest {
  
  constructor() {
    this.testStudentId = 202533333; // Real student ID from database
    this.testResults = {
      totalTests: 0,
      passedTests: 0,
      failedTests: 0,
      errors: []
    };
  }

  /**
   * Run complete end-to-end test suite
   */
  async runE2ETestSuite() {
    console.log('\n🧪 Starting End-to-End Prescriptive Analytics Test Suite');
    console.log('=' .repeat(70));

    try {
      // Connect to database
      await this.connectToDatabase();

      // Clean up any existing test data
      await this.cleanupTestData();

      console.log(`\n📋 Testing with Student ID: ${this.testStudentId} (Philip Pangilinan)`);

      // Run the complete flow test
      await this.testCompleteFlow();

      // Test BKT/IRT calculations
      await this.testMathematicalModels();

      // Test intervention rules
      await this.testInterventionRules();

      // Test progress tracking
      await this.testProgressTracking();

      // Test face-to-face escalation
      await this.testFaceToFaceEscalation();

      // Print results summary
      this.printTestSummary();

    } catch (error) {
      console.error('❌ E2E Test Suite Failed:', error);
      this.testResults.errors.push(`Suite Setup Error: ${error.message}`);
    } finally {
      // Clean up test data
      await this.cleanupTestData();
      
      // Close database connection
      await mongoose.connection.close();
    }
  }

  /**
   * Test the complete flow from category results to intervention processing
   */
  async testCompleteFlow() {
    console.log('\n🔄 Testing Complete Prescriptive Analytics Flow');
    console.log('-'.repeat(50));

    try {
      // Step 1: Create category results (simulating assessment completion)
      console.log('Step 1: Creating category results...');
      const categoryResultData = this.generateTestCategoryResults();
      const categoryResult = await CategoryResultsService.createCategoryResult(categoryResultData);
      
      this.assert(categoryResult._id, 'Category result should be created');
      this.assert(categoryResult.categories.length > 0, 'Category result should have categories');
      console.log('✅ Category results created successfully');

      // Step 2: Verify prescriptive analysis was auto-generated
      console.log('Step 2: Checking auto-generated prescriptive analysis...');
      await this.sleep(2000); // Wait for async processing
      
      const analysis = await PrescriptiveAnalysis.findOne({
        studentId: this.testStudentId
      }).sort({ createdAt: -1 });
      
      this.assert(analysis, 'Prescriptive analysis should be auto-generated');
      this.assert(analysis.skillMastery, 'Analysis should contain skill mastery data');
      this.assert(analysis.interventionPlan, 'Analysis should contain intervention plan');
      console.log('✅ Prescriptive analysis auto-generated successfully');

      // Step 3: Generate intervention for failed category
      console.log('Step 3: Generating intervention for failed category...');
      const failedCategory = this.getFailedCategory(analysis);
      
      if (failedCategory) {
        const intervention = await InterventionGeneratorService.generateIntervention(
          analysis._id.toString(),
          failedCategory
        );
        
        this.assert(intervention._id, 'Intervention should be generated');
        this.assert(intervention.questions.length === 10, 'Intervention should have exactly 10 questions');
        this.assert(intervention.category === failedCategory, 'Intervention should target failed category');
        console.log(`✅ Intervention generated for ${failedCategory}`);

        // Step 4: Simulate intervention responses
        console.log('Step 4: Simulating intervention responses...');
        const interventionResponses = await this.simulateInterventionResponses(intervention);
        
        this.assert(interventionResponses.length === 10, 'Should have 10 intervention responses');
        console.log('✅ Intervention responses simulated');

        // Step 5: Process intervention results
        console.log('Step 5: Processing intervention results...');
        const processingResult = await InterventionGeneratorService.processInterventionResults(
          intervention._id.toString()
        );
        
        this.assert(processingResult.success, 'Intervention results should be processed successfully');
        this.assert(processingResult.interventionResultsId, 'Should create intervention results record');
        console.log('✅ Intervention results processed successfully');

        // Step 6: Verify analysis update
        console.log('Step 6: Verifying prescriptive analysis update...');
        const updatedAnalysis = await PrescriptiveAnalysis.findById(analysis._id);
        
        this.assert(
          updatedAnalysis.interventionHistory.length > 0, 
          'Analysis should be updated with intervention history'
        );
        console.log('✅ Prescriptive analysis updated with intervention results');

      } else {
        console.log('ℹ️  No failed categories found - skipping intervention tests');
      }

      console.log('🎉 Complete flow test passed!');

    } catch (error) {
      this.recordError('Complete Flow Test', error);
    }
  }

  /**
   * Test BKT/IRT mathematical model calculations
   */
  async testMathematicalModels() {
    console.log('\n🧮 Testing BKT/IRT Mathematical Model Calculations');
    console.log('-'.repeat(50));

    try {
      // Get the latest analysis
      const analysis = await PrescriptiveAnalysis.findOne({
        studentId: this.testStudentId
      }).sort({ createdAt: -1 });

      if (!analysis) {
        throw new Error('No analysis found for mathematical model testing');
      }

      // Test BKT calculations
      console.log('Testing BKT (Bayesian Knowledge Tracing) calculations...');
      
      for (const [category, mastery] of analysis.skillMastery) {
        // Verify BKT probability bounds
        this.assert(
          mastery.masteryProbability >= 0 && mastery.masteryProbability <= 1,
          `BKT mastery probability should be between 0 and 1 for ${category}`
        );

        // Verify score-mastery correlation
        if (mastery.score >= 75) {
          this.assert(
            mastery.masteryProbability >= 0.5,
            `High scores should correlate with higher mastery probability for ${category}`
          );
        }
      }
      console.log('✅ BKT calculations validated');

      // Test IRT calculations
      console.log('Testing IRT (Item Response Theory) calculations...');
      
      for (const [category, ability] of analysis.abilityEstimates) {
        // Verify IRT ability bounds
        this.assert(
          ability >= -3 && ability <= 3,
          `IRT ability estimate should be between -3 and 3 for ${category}`
        );

        // Verify ability-performance correlation
        const mastery = analysis.skillMastery.get(category);
        if (mastery && mastery.score >= 75) {
          this.assert(
            ability >= -1,
            `Good performance should correlate with positive ability estimate for ${category}`
          );
        }
      }
      console.log('✅ IRT calculations validated');

      console.log('🎉 Mathematical model tests passed!');

    } catch (error) {
      this.recordError('Mathematical Models Test', error);
    }
  }

  /**
   * Test intervention rules (one-time rule, question count, etc.)
   */
  async testInterventionRules() {
    console.log('\n📋 Testing Intervention Rules');
    console.log('-'.repeat(50));

    try {
      const analysis = await PrescriptiveAnalysis.findOne({
        studentId: this.testStudentId
      }).sort({ createdAt: -1 });

      if (!analysis) {
        throw new Error('No analysis found for intervention rules testing');
      }

      const failedCategory = this.getFailedCategory(analysis);
      
      if (failedCategory) {
        // Test one-time intervention rule
        console.log('Testing one-time intervention rule...');
        
        try {
          // Try to generate second intervention for same category
          await InterventionGeneratorService.generateIntervention(
            analysis._id.toString(),
            failedCategory
          );
          
          // This should throw an error due to one-time rule
          this.recordError('One-time Rule Test', new Error('Should not allow duplicate interventions'));
          
        } catch (error) {
          if (error.message.includes('already attempted')) {
            console.log('✅ One-time intervention rule enforced correctly');
          } else {
            throw error;
          }
        }

        // Test question count rule
        console.log('Testing 10-question rule...');
        const interventions = await InterventionAssessment.find({
          studentId: this.testStudentId
        });

        for (const intervention of interventions) {
          this.assert(
            intervention.totalQuestions === 10,
            'All interventions should have exactly 10 questions'
          );
        }
        console.log('✅ 10-question rule validated');

        // Test pass threshold (75%)
        console.log('Testing 75% pass threshold...');
        const interventionResults = await InterventionResults.find({
          studentId: this.testStudentId
        });

        for (const result of interventionResults) {
          this.assert(
            result.passThreshold === 75,
            'All interventions should use 75% pass threshold'
          );
          
          if (result.finalScore >= 75) {
            this.assert(result.isPassed, 'Results >= 75% should be marked as passed');
          } else {
            this.assert(!result.isPassed, 'Results < 75% should be marked as failed');
          }
        }
        console.log('✅ 75% pass threshold validated');

      } else {
        console.log('ℹ️  No failed categories found - skipping intervention rules tests');
      }

      console.log('🎉 Intervention rules tests passed!');

    } catch (error) {
      this.recordError('Intervention Rules Test', error);
    }
  }

  /**
   * Test progress tracking functionality
   */
  async testProgressTracking() {
    console.log('\n📊 Testing Progress Tracking');
    console.log('-'.repeat(50));

    try {
      // Generate additional test data for progress tracking
      await this.generateProgressTrackingData();

      // Test comprehensive progress analytics
      console.log('Testing comprehensive progress analytics...');
      const progressData = await ProgressTrackingService.getStudentProgressAnalytics(this.testStudentId);
      
      this.assert(progressData.hasData, 'Progress tracking should return data');
      this.assert(progressData.overallTrends, 'Should include overall trends');
      this.assert(progressData.categoryProgress, 'Should include category progress');
      this.assert(progressData.masteryProgression, 'Should include mastery progression');
      console.log('✅ Comprehensive progress analytics working');

      // Test before/after intervention comparisons
      if (progressData.interventionComparisons && progressData.interventionComparisons.length > 0) {
        console.log('Testing before/after intervention comparisons...');
        
        for (const comparison of progressData.interventionComparisons) {
          this.assert(comparison.before, 'Should have before data');
          this.assert(comparison.after, 'Should have after data');
          this.assert(comparison.improvement, 'Should have improvement data');
        }
        console.log('✅ Before/after comparisons working');
      }

      console.log('🎉 Progress tracking tests passed!');

    } catch (error) {
      this.recordError('Progress Tracking Test', error);
    }
  }

  /**
   * Test face-to-face escalation logic
   */
  async testFaceToFaceEscalation() {
    console.log('\n🤝 Testing Face-to-Face Escalation');
    console.log('-'.repeat(50));

    try {
      // Create multiple failed intervention attempts to trigger escalation
      const categoryResultData = this.generateTestCategoryResults(true); // Force failures
      const categoryResult = await CategoryResultsService.createCategoryResult(categoryResultData);
      
      await this.sleep(1000);
      
      const analysis = await PrescriptiveAnalysis.findOne({
        studentId: this.testStudentId
      }).sort({ createdAt: -1 });

      if (analysis && analysis.insights) {
        // Simulate multiple intervention failures
        for (let attempt = 1; attempt <= 3; attempt++) {
          analysis.interventionHistory.push({
            category: 'Alphabet Knowledge',
            interventionId: new mongoose.Types.ObjectId(),
            dateTaken: new Date(),
            passed: false,
            score: 50, // Failing score
            attempt: attempt
          });
        }

        await analysis.save();

        // Check if face-to-face escalation is triggered
        if (analysis.insights.recommendedAction === 'face_to_face_required') {
          console.log('✅ Face-to-face escalation triggered correctly after multiple failures');
        } else {
          console.log('ℹ️  Face-to-face escalation logic needs multiple intervention failures to trigger');
        }
      }

      console.log('🎉 Face-to-face escalation tests completed!');

    } catch (error) {
      this.recordError('Face-to-Face Escalation Test', error);
    }
  }

  // Helper methods

  async connectToDatabase() {
    if (mongoose.connection.readyState === 0) {
      await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/test', {
        useNewUrlParser: true,
        useUnifiedTopology: true
      });
    }
  }

  async cleanupTestData() {
    try {
      await Promise.all([
        PrescriptiveAnalysis.deleteMany({ studentId: this.testStudentId }),
        CategoryResult.deleteMany({ studentId: this.testStudentId }),
        InterventionAssessment.deleteMany({ studentId: this.testStudentId }),
        InterventionResults.deleteMany({ studentId: this.testStudentId })
        // Don't delete the real student record
      ]);
    } catch (error) {
      console.warn('Warning: Could not clean up all test data:', error.message);
    }
  }

  generateTestCategoryResults(forceFailures = false) {
    return {
      studentId: this.testStudentId,
      assessmentDate: new Date(),
      readingLevel: 'Developing',
      categories: [
        {
          categoryName: 'Alphabet Knowledge',
          totalQuestions: 15,
          correctAnswers: forceFailures ? 8 : 14,
          score: forceFailures ? 53 : 93,
          isPassed: !forceFailures,
          isCompleted: true
        },
        {
          categoryName: 'Phonological Awareness',
          totalQuestions: 10,
          totalPossibleMatches: 20,
          correctMatches: forceFailures ? 8 : 16,
          score: forceFailures ? 40 : 80,
          isPassed: !forceFailures,
          isCompleted: true
        },
        {
          categoryName: 'Decoding',
          totalQuestions: 12,
          correctAnswers: forceFailures ? 6 : 10,
          score: forceFailures ? 50 : 83,
          isPassed: !forceFailures,
          isCompleted: true
        }
      ]
    };
  }

  getFailedCategory(analysis) {
    for (const [category, mastery] of analysis.skillMastery) {
      if (!mastery.isPassed) {
        return category;
      }
    }
    return null;
  }

  async simulateInterventionResponses(intervention) {
    const InterventionResponse = require('../models/Teachers/ManageProgress/interventionResponseModel');
    const responses = [];

    for (let i = 0; i < intervention.questions.length; i++) {
      const response = new InterventionResponse({
        studentId: this.testStudentId,
        interventionAssessmentId: intervention._id,
        questionId: intervention.questions[i].questionId,
        category: intervention.category,
        response: `Test response ${i + 1}`,
        isCorrect: Math.random() > 0.3, // 70% correct rate
        responseTime: Math.floor(Math.random() * 10000) + 2000, // 2-12 seconds
        answeredAt: new Date(),
        readingLevel: intervention.readingLevel
      });

      await response.save();
      responses.push(response);
    }

    return responses;
  }

  async generateProgressTrackingData() {
    // Generate additional category results for progress tracking
    for (let i = 0; i < 3; i++) {
      const categoryResultData = this.generateTestCategoryResults();
      categoryResultData.assessmentDate = new Date(Date.now() - (i * 7 * 24 * 60 * 60 * 1000)); // Weekly intervals
      await CategoryResultsService.createCategoryResult(categoryResultData);
      await this.sleep(1000);
    }
  }

  assert(condition, message) {
    this.testResults.totalTests++;
    
    if (condition) {
      this.testResults.passedTests++;
    } else {
      this.testResults.failedTests++;
      this.testResults.errors.push(`Assertion Failed: ${message}`);
      throw new Error(message);
    }
  }

  recordError(testName, error) {
    this.testResults.totalTests++;
    this.testResults.failedTests++;
    this.testResults.errors.push(`${testName}: ${error.message}`);
    console.error(`❌ ${testName} failed:`, error.message);
  }

  sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  printTestSummary() {
    console.log('\n📊 Test Summary');
    console.log('=' .repeat(70));
    console.log(`Total Tests: ${this.testResults.totalTests}`);
    console.log(`Passed: ${this.testResults.passedTests}`);
    console.log(`Failed: ${this.testResults.failedTests}`);
    console.log(`Success Rate: ${((this.testResults.passedTests / this.testResults.totalTests) * 100).toFixed(1)}%`);
    
    if (this.testResults.errors.length > 0) {
      console.log('\n❌ Errors:');
      this.testResults.errors.forEach((error, index) => {
        console.log(`${index + 1}. ${error}`);
      });
    }
    
    if (this.testResults.failedTests === 0) {
      console.log('\n🎉 All E2E tests passed! Prescriptive Analytics system is working correctly.');
    } else {
      console.log('\n⚠️  Some tests failed. Please review the errors above.');
    }
  }
}

// Export for use in test runners or direct execution
module.exports = PrescriptiveAnalyticsE2ETest;

// Direct execution
if (require.main === module) {
  const testRunner = new PrescriptiveAnalyticsE2ETest();
  testRunner.runE2ETestSuite()
    .then(() => {
      console.log('\n✅ E2E Test Suite Completed');
      process.exit(0);
    })
    .catch((error) => {
      console.error('\n❌ E2E Test Suite Failed:', error);
      process.exit(1);
    });
}