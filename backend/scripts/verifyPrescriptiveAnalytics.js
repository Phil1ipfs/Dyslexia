#!/usr/bin/env node

/**
 * Prescriptive Analytics System Verification Script
 * Quick verification that all components are properly integrated and functioning
 */

const mongoose = require('mongoose');
require('dotenv').config();

// Import services for verification
const CategoryResultsService = require('../services/Teachers/CategoryResultsService');
const PrescriptiveAnalyticsService = require('../services/Teachers/PrescriptiveAnalyticsService');
const InterventionGeneratorService = require('../services/Teachers/InterventionGeneratorService');
const ProgressTrackingService = require('../services/Teachers/ProgressTrackingService');
const IntegrationTriggerService = require('../services/Teachers/PrescriptiveAnalytics/integrationTriggerService');

// Import mathematical models for verification
const mathematicalModelsService = require('../services/Teachers/PrescriptiveAnalytics/mathematicalModelsService');

/**
 * System Verification Class
 */
class PrescriptiveAnalyticsVerification {

  constructor() {
    this.verificationResults = {
      totalChecks: 0,
      passedChecks: 0,
      failedChecks: 0,
      warnings: [],
      errors: []
    };
  }

  /**
   * Run complete system verification
   */
  async runVerification() {
    console.log('\n🔍 Prescriptive Analytics System Verification');
    console.log('=' .repeat(60));
    console.log('This script verifies that all components are properly integrated\n');

    try {
      // Connect to database
      await this.connectToDatabase();

      // Run verification checks
      await this.verifyDatabaseConnection();
      await this.verifyModelsLoad();
      await this.verifyServicesLoad();
      await this.verifyMathematicalModels();
      await this.verifyIntegrationChain();
      await this.verifySystemHealth();

      // Print results
      this.printVerificationResults();

    } catch (error) {
      console.error('❌ Verification failed:', error);
      this.recordError('System Verification', error);
    } finally {
      // Close database connection
      if (mongoose.connection.readyState === 1) {
        await mongoose.connection.close();
      }
    }
  }

  /**
   * Verify database connection and collections
   */
  async verifyDatabaseConnection() {
    console.log('🔗 Verifying Database Connection...');
    
    try {
      this.check(
        mongoose.connection.readyState === 1,
        'Database connection should be active'
      );

      const collections = await mongoose.connection.db.listCollections().toArray();
      const collectionNames = collections.map(c => c.name);

      const requiredCollections = [
        'users',
        'category_results',
        'prescriptive_analysis',
        'intervention_assessments',
        'intervention_results'
      ];

      for (const collection of requiredCollections) {
        if (collectionNames.includes(collection)) {
          console.log(`  ✅ Collection '${collection}' exists`);
          this.verificationResults.passedChecks++;
        } else {
          console.log(`  ⚠️  Collection '${collection}' not found (may be created on first use)`);
          this.verificationResults.warnings.push(`Collection '${collection}' not found`);
        }
        this.verificationResults.totalChecks++;
      }

      console.log('✅ Database connection verified\n');

    } catch (error) {
      this.recordError('Database Connection', error);
    }
  }

  /**
   * Verify all Mongoose models load correctly
   */
  async verifyModelsLoad() {
    console.log('📄 Verifying Mongoose Models...');

    const models = [
      { name: 'CategoryResult', path: '../models/Teachers/ManageProgress/categoryResultModel' },
      { name: 'PrescriptiveAnalysis', path: '../models/Teachers/ManageProgress/prescriptiveAnalysisModel' },
      { name: 'InterventionAssessment', path: '../models/Teachers/ManageProgress/interventionAssessmentModel' },
      { name: 'InterventionResults', path: '../models/Teachers/ManageProgress/interventionResultsModel' },
      { name: 'InterventionResponse', path: '../models/Teachers/ManageProgress/interventionResponseModel' }
    ];

    for (const model of models) {
      try {
        const ModelClass = require(model.path);
        this.check(
          typeof ModelClass === 'function' || typeof ModelClass === 'object',
          `${model.name} model should load correctly`
        );
        console.log(`  ✅ ${model.name} model loaded`);
      } catch (error) {
        this.recordError(`Model Loading: ${model.name}`, error);
      }
    }

    console.log('✅ All models loaded successfully\n');
  }

  /**
   * Verify all services load correctly
   */
  async verifyServicesLoad() {
    console.log('⚙️  Verifying Services...');

    const services = [
      { name: 'CategoryResultsService', service: CategoryResultsService },
      { name: 'PrescriptiveAnalyticsService', service: PrescriptiveAnalyticsService },
      { name: 'InterventionGeneratorService', service: InterventionGeneratorService },
      { name: 'ProgressTrackingService', service: ProgressTrackingService },
      { name: 'IntegrationTriggerService', service: IntegrationTriggerService }
    ];

    for (const { name, service } of services) {
      try {
        this.check(
          service !== null && service !== undefined,
          `${name} should load correctly`
        );
        
        // Check for key methods
        const keyMethods = this.getKeyMethods(name);
        for (const method of keyMethods) {
          this.check(
            typeof service[method] === 'function',
            `${name} should have ${method} method`
          );
        }
        
        console.log(`  ✅ ${name} loaded with required methods`);
      } catch (error) {
        this.recordError(`Service Loading: ${name}`, error);
      }
    }

    console.log('✅ All services loaded successfully\n');
  }

  /**
   * Verify mathematical models (BKT/IRT) are working
   */
  async verifyMathematicalModels() {
    console.log('🧮 Verifying Mathematical Models (BKT/IRT)...');

    try {
      // Test BKT calculation with correct method name
      const bktResult = mathematicalModelsService.updateMasteryProbabilityBKT(0.5, true, {
        P_INIT: 0.5,
        P_LEARN: 0.1,
        P_GUESS: 0.3,
        P_SLIP: 0.1
      });

      this.check(
        bktResult >= 0 && bktResult <= 1,
        'BKT calculation should return probability between 0 and 1'
      );
      console.log(`  ✅ BKT calculation working (result: ${bktResult.toFixed(3)})`);

      // Test IRT calculation
      const irtResult = mathematicalModelsService.calculateIRTProbability(0, 0, 1.0);
      
      this.check(
        irtResult >= 0 && irtResult <= 1,
        'IRT calculation should return probability between 0 and 1'
      );
      console.log(`  ✅ IRT calculation working (result: ${irtResult.toFixed(3)})`);

      // Test ability estimation from proportion
      const abilityResult = mathematicalModelsService.estimateAbilityFromProportion(0.75);
      this.check(
        abilityResult >= -3 && abilityResult <= 3,
        'IRT ability estimation should return value between -3 and 3'
      );
      console.log(`  ✅ IRT ability estimation working (result: ${abilityResult.toFixed(3)})`);

      // Test category weighting
      const weights = mathematicalModelsService.getCategoryWeights('Developing');
      this.check(
        weights && Object.keys(weights).length > 0,
        'Category weights should be available for reading levels'
      );
      console.log(`  ✅ Category weighting system working`);

      // Test weighted score calculation
      const categoryScores = {
        "Alphabet Knowledge": 85,
        "Phonological Awareness": 70,
        "Decoding": 65
      };
      const weightedScore = mathematicalModelsService.calculateWeightedScore(categoryScores, 'Developing');
      this.check(
        weightedScore >= 0 && weightedScore <= 100,
        'Weighted score calculation should return score between 0 and 100'
      );
      console.log(`  ✅ Weighted scoring working (result: ${weightedScore})`);

      // Test BKT sequence processing
      const mockResponses = [
        { isCorrect: true, answeredAt: new Date(), questionId: 'test1' },
        { isCorrect: false, answeredAt: new Date(), questionId: 'test2' },
        { isCorrect: true, answeredAt: new Date(), questionId: 'test3' }
      ];
      const bktSequenceResult = mathematicalModelsService.processBKTSequence(mockResponses);
      this.check(
        bktSequenceResult.finalMastery >= 0 && bktSequenceResult.finalMastery <= 1,
        'BKT sequence processing should return valid mastery probability'
      );
      console.log(`  ✅ BKT sequence processing working (final mastery: ${bktSequenceResult.finalMastery})`);

      console.log('✅ Mathematical models verified\n');

    } catch (error) {
      this.recordError('Mathematical Models', error);
    }
  }

  /**
   * Verify integration chain components
   */
  async verifyIntegrationChain() {
    console.log('🔗 Verifying Integration Chain...');

    try {
      // Test CategoryResultsService
      this.check(
        typeof CategoryResultsService.createCategoryResult === 'function',
        'CategoryResultsService should have createCategoryResult method'
      );
      
      this.check(
        typeof CategoryResultsService.getCategoryResults === 'function',
        'CategoryResultsService should have getCategoryResults method'
      );
      console.log('  ✅ CategoryResultsService integration ready');

      // Test PrescriptiveAnalyticsService
      this.check(
        typeof PrescriptiveAnalyticsService.generatePrescriptiveAnalysis === 'function',
        'PrescriptiveAnalyticsService should have generatePrescriptiveAnalysis method'
      );
      console.log('  ✅ PrescriptiveAnalyticsService integration ready');

      // Test InterventionGeneratorService
      this.check(
        typeof InterventionGeneratorService.generateIntervention === 'function',
        'InterventionGeneratorService should have generateIntervention method'
      );
      
      this.check(
        typeof InterventionGeneratorService.processInterventionResults === 'function',
        'InterventionGeneratorService should have processInterventionResults method'
      );
      console.log('  ✅ InterventionGeneratorService integration ready');

      // Test ProgressTrackingService
      this.check(
        typeof ProgressTrackingService.getStudentProgressAnalytics === 'function',
        'ProgressTrackingService should have getStudentProgressAnalytics method'
      );
      console.log('  ✅ ProgressTrackingService integration ready');

      console.log('✅ Integration chain verified\n');

    } catch (error) {
      this.recordError('Integration Chain', error);
    }
  }

  /**
   * Verify system health checks
   */
  async verifySystemHealth() {
    console.log('🏥 Verifying System Health...');

    try {
      // Test integration trigger service health check
      if (typeof IntegrationTriggerService.healthCheck === 'function') {
        const healthStatus = await IntegrationTriggerService.healthCheck();
        
        this.check(
          healthStatus && healthStatus.status === 'healthy',
          'Integration service health check should return healthy status'
        );
        console.log('  ✅ Integration service health check passed');
      }

      // Test prescriptive analytics service health check
      if (typeof PrescriptiveAnalyticsService.healthCheck === 'function') {
        const analyticsHealth = await PrescriptiveAnalyticsService.healthCheck();
        
        this.check(
          analyticsHealth && analyticsHealth.status === 'healthy',
          'Analytics service health check should return healthy status'
        );
        console.log('  ✅ Analytics service health check passed');
      }

      console.log('✅ System health verified\n');

    } catch (error) {
      this.recordError('System Health', error);
    }
  }

  // Helper methods

  async connectToDatabase() {
    if (mongoose.connection.readyState === 0) {
      const dbUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/test';
      await mongoose.connect(dbUri, {
        useNewUrlParser: true,
        useUnifiedTopology: true
      });
      console.log('📡 Connected to database\n');
    }
  }

  check(condition, message) {
    this.verificationResults.totalChecks++;
    
    if (condition) {
      this.verificationResults.passedChecks++;
      return true;
    } else {
      this.verificationResults.failedChecks++;
      this.verificationResults.errors.push(message);
      console.log(`  ❌ ${message}`);
      return false;
    }
  }

  recordError(component, error) {
    this.verificationResults.failedChecks++;
    this.verificationResults.totalChecks++;
    this.verificationResults.errors.push(`${component}: ${error.message}`);
    console.log(`  ❌ ${component} error: ${error.message}`);
  }

  getKeyMethods(serviceName) {
    const methodMap = {
      'CategoryResultsService': ['createCategoryResult', 'getCategoryResults', 'updateCategoryResult'],
      'PrescriptiveAnalyticsService': ['generatePrescriptiveAnalysis', 'updateAnalysisAfterIntervention'],
      'InterventionGeneratorService': ['generateIntervention', 'processInterventionResults'],
      'ProgressTrackingService': ['getStudentProgressAnalytics'],
      'IntegrationTriggerService': ['triggerPrescriptiveAnalysis', 'healthCheck']
    };

    return methodMap[serviceName] || [];
  }

  printVerificationResults() {
    console.log('📊 Verification Results');
    console.log('=' .repeat(60));
    console.log(`Total Checks: ${this.verificationResults.totalChecks}`);
    console.log(`Passed: ${this.verificationResults.passedChecks}`);
    console.log(`Failed: ${this.verificationResults.failedChecks}`);
    
    if (this.verificationResults.warnings.length > 0) {
      console.log(`Warnings: ${this.verificationResults.warnings.length}`);
    }

    const successRate = ((this.verificationResults.passedChecks / this.verificationResults.totalChecks) * 100).toFixed(1);
    console.log(`Success Rate: ${successRate}%`);

    if (this.verificationResults.warnings.length > 0) {
      console.log('\n⚠️  Warnings:');
      this.verificationResults.warnings.forEach((warning, index) => {
        console.log(`${index + 1}. ${warning}`);
      });
    }

    if (this.verificationResults.errors.length > 0) {
      console.log('\n❌ Errors:');
      this.verificationResults.errors.forEach((error, index) => {
        console.log(`${index + 1}. ${error}`);
      });
    }

    console.log('\n' + '=' .repeat(60));
    
    if (this.verificationResults.failedChecks === 0) {
      console.log('🎉 System verification passed! All components are properly integrated.');
      console.log('✅ Prescriptive Analytics system is ready for use.');
    } else {
      console.log('⚠️  System verification found issues. Please review the errors above.');
      console.log('🔧 Fix the errors and run verification again.');
    }
  }
}

// Export for use in other scripts or direct execution
module.exports = PrescriptiveAnalyticsVerification;

// Direct execution
if (require.main === module) {
  const verifier = new PrescriptiveAnalyticsVerification();
  verifier.runVerification()
    .then(() => {
      const success = verifier.verificationResults.failedChecks === 0;
      process.exit(success ? 0 : 1);
    })
    .catch((error) => {
      console.error('\n❌ Verification script failed:', error);
      process.exit(1);
    });
}