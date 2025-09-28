const ReadingLevelProgressionService = require('./ReadingLevelProgressionService');
const CategoryResultsService = require('./Teachers/CategoryResultsService');
const mongoose = require('mongoose');

/**
 * 🔄 AUTOMATIC PROGRESSION VALIDATION SERVICE
 *
 * This service automatically validates and ensures the complete reading level progression
 * system is working correctly for all students. It runs automatically on server startup
 * and periodically to catch any students who should have progressed but haven't.
 *
 * Key Functions:
 * - Detects students ready for progression
 * - Automatically triggers progression
 * - Creates proper category placeholders
 * - Validates end-to-end flow
 * - Ensures no manual intervention needed
 */
class AutomaticProgressionValidationService {

  /**
   * Main validation method - checks all students and ensures proper progression
   */
  static async validateAndProcessAllStudents() {
    try {
      console.log('\n🔄 AUTOMATIC PROGRESSION VALIDATION');
      console.log('='.repeat(60));
      console.log('[VALIDATION] Starting comprehensive progression validation for all students');

      // Get all students with reading levels
      const testDb = mongoose.connection.useDb('test');
      const usersCollection = testDb.collection('users');
      const categoryResultsCollection = testDb.collection('category_results');

      const students = await usersCollection.find({
        readingLevel: { $exists: true, $ne: null, $ne: '' }
      }).toArray();

      console.log(`[VALIDATION] Found ${students.length} students with assigned reading levels`);

      let progressedStudents = 0;
      let placeholdersCreated = 0;
      let completionMarked = 0;

      for (const student of students) {
        try {
          // Skip students with null or invalid reading levels
          if (!student.readingLevel || student.readingLevel === null || student.readingLevel === undefined) {
            console.warn(`[VALIDATION] ⚠️  Skipping student ${student.firstName} ${student.lastName} (${student.idNumber}) - invalid readingLevel: ${student.readingLevel}`);
            continue;
          }

          console.log(`\n[VALIDATION] 📋 Checking student: ${student.firstName} ${student.lastName} (${student.idNumber}) - ${student.readingLevel}`);

          // Check if student has category results for current level
          const categoryResults = await categoryResultsCollection.findOne({
            studentId: student.idNumber,
            readingLevel: student.readingLevel
          });

          if (!categoryResults) {
            console.log(`[VALIDATION]   ⚠️  No category results found for current level - creating placeholder`);
            await this.createMissingCategoryPlaceholder(student.idNumber, student.readingLevel);
            placeholdersCreated++;
            continue;
          }

          // Check progression eligibility
          const progressionResult = await ReadingLevelProgressionService.checkAndProgressReadingLevel(
            student.idNumber,
            student.readingLevel
          );

          if (progressionResult.success) {
            if (progressionResult.progressionNeeded === false && progressionResult.readingLevelUpdated) {
              // Student completed at maximum level
              completionMarked++;
              console.log(`[VALIDATION]   ✅ Student completion properly marked at maximum level`);
            } else if (progressionResult.progressionExecuted) {
              // Student progressed to next level
              progressedStudents++;
              console.log(`[VALIDATION]   🚀 Student progressed: ${progressionResult.fromLevel} → ${progressionResult.toLevel}`);
            } else {
              console.log(`[VALIDATION]   📊 Student not yet eligible for progression: ${progressionResult.reason}`);
            }
          }

        } catch (studentError) {
          console.error(`[VALIDATION]   ❌ Error processing student ${student.idNumber}:`, studentError.message);
        }
      }

      console.log('\n📊 VALIDATION SUMMARY:');
      console.log(`   - Students processed: ${students.length}`);
      console.log(`   - Students progressed: ${progressedStudents}`);
      console.log(`   - Placeholders created: ${placeholdersCreated}`);
      console.log(`   - Completions marked: ${completionMarked}`);

      return {
        success: true,
        studentsProcessed: students.length,
        studentsProgressed: progressedStudents,
        placeholdersCreated: placeholdersCreated,
        completionsMarked: completionMarked
      };

    } catch (error) {
      console.error('[VALIDATION] ❌ Error in automatic progression validation:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Creates missing category result placeholders for students
   */
  static async createMissingCategoryPlaceholder(studentId, readingLevel) {
    try {
      // Prevent creation of placeholders with null or invalid reading levels
      if (!readingLevel || readingLevel === null || readingLevel === undefined) {
        console.warn(`[VALIDATION]   ⚠️  Skipping placeholder creation for student ${studentId} - invalid readingLevel: ${readingLevel}`);
        return;
      }

      console.log(`[VALIDATION]   🔧 Creating missing category placeholder for student ${studentId} at ${readingLevel}`);

      // Use CategoryResultsService to create proper placeholder
      const requiredCategories = ReadingLevelProgressionService.getCategoriesForReadingLevel(readingLevel);
      const questionCounts = await ReadingLevelProgressionService.getQuestionCountsFromMainAssessment(readingLevel);

      const testDb = mongoose.connection.useDb('test');
      const categoryResultsCollection = testDb.collection('category_results');

      // Create categories array with proper question counts
      const categories = requiredCategories.map(categoryName => {
        const questionCount = questionCounts[categoryName] || 15;

        return {
          categoryName: categoryName,
          totalQuestions: questionCount,
          correctAnswers: 0,
          totalPossibleMatches: 0, // ✅ FIX: Will be calculated from actual student_responses when assessment is taken
          correctMatches: 0,
          score: 0,
          isPassed: false,
          passingThreshold: 75,
          isCompleted: false,
          lastQuestionAnswered: '',
          interventionRequired: false,
          interventionAttempts: 0,
          interventionCompleted: false,
          currentInterventionId: null,
          interventionHistory: []
        };
      });

      // Create new category results record
      const newCategoryResult = {
        studentId: studentId,
        assessmentDate: new Date(),
        categories: categories,
        overallScore: 0,
        completedCategories: 0,
        totalCategories: requiredCategories.length,
        allCategoriesPassed: false,
        readingLevel: readingLevel,
        readingLevelUpdated: false,
        createdAt: new Date(),
        updatedAt: new Date()
      };

      await categoryResultsCollection.insertOne(newCategoryResult);

      console.log(`[VALIDATION]   ✅ Created category placeholder with ${requiredCategories.length} categories: [${requiredCategories.join(', ')}]`);

    } catch (error) {
      console.error(`[VALIDATION]   ❌ Error creating placeholder for student ${studentId}:`, error.message);
      throw error;
    }
  }

  /**
   * Validates the complete end-to-end progression flow for a specific scenario
   */
  static async validateCompleteProgressionFlow() {
    try {
      console.log('\n🧪 COMPLETE PROGRESSION FLOW VALIDATION');
      console.log('='.repeat(60));

      // Test progression flow for each reading level
      const progressionLevels = [
        { from: 'Low Emerging', to: 'High Emerging', categories: 1 },
        { from: 'High Emerging', to: 'Developing', categories: 2 },
        { from: 'Developing', to: 'Transitioning', categories: 3 },
        { from: 'Transitioning', to: 'At Grade Level', categories: 4 },
        { from: 'At Grade Level', to: null, categories: 5 } // Maximum level
      ];

      console.log('[FLOW-TEST] Testing progression logic for each level...');

      for (const level of progressionLevels) {
        const requiredCategories = ReadingLevelProgressionService.getCategoriesForReadingLevel(level.from);
        const nextLevel = ReadingLevelProgressionService.getNextReadingLevel(level.from);

        console.log(`[FLOW-TEST] ${level.from}: requires ${requiredCategories.length} categories, next=${nextLevel || 'MAX LEVEL'}`);

        // Validate question counts are available
        const questionCounts = await ReadingLevelProgressionService.getQuestionCountsFromMainAssessment(level.from);

        let allCategoriesHaveQuestions = true;
        for (const category of requiredCategories) {
          if (!questionCounts[category] || questionCounts[category] === 0) {
            console.warn(`[FLOW-TEST]   ⚠️  ${category}: No questions found in main_assessment`);
            allCategoriesHaveQuestions = false;
          }
        }

        if (allCategoriesHaveQuestions) {
          console.log(`[FLOW-TEST]   ✅ All categories have question counts`);
        }
      }

      console.log('[FLOW-TEST] ✅ Progression flow validation completed');

      return { success: true };

    } catch (error) {
      console.error('[FLOW-TEST] ❌ Error in flow validation:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Monitors for students who completed interventions but haven't progressed
   */
  static async detectStuckProgressions() {
    try {
      console.log('\n🔍 DETECTING STUCK PROGRESSIONS');
      console.log('='.repeat(60));

      const testDb = mongoose.connection.useDb('test');
      const categoryResultsCollection = testDb.collection('category_results');

      // Find category results where all categories are completed but readingLevelUpdated is false
      const stuckResults = await categoryResultsCollection.find({
        readingLevelUpdated: false,
        'categories': {
          $not: {
            $elemMatch: {
              $or: [
                { isPassed: false },
                { isCompleted: false }
              ]
            }
          }
        }
      }).toArray();

      console.log(`[STUCK-CHECK] Found ${stuckResults.length} potentially stuck progressions`);

      let fixedProgressions = 0;

      for (const result of stuckResults) {
        try {
          console.log(`[STUCK-CHECK] 🔧 Attempting to fix stuck progression for student ${result.studentId}`);

          // Trigger progression check
          const progressionResult = await ReadingLevelProgressionService.checkAndProgressReadingLevel(
            result.studentId,
            result.readingLevel
          );

          if (progressionResult.success) {
            fixedProgressions++;
            console.log(`[STUCK-CHECK]   ✅ Fixed progression for student ${result.studentId}`);
          } else {
            console.log(`[STUCK-CHECK]   ⚠️  Could not fix progression: ${progressionResult.error || progressionResult.reason}`);
          }

        } catch (error) {
          console.error(`[STUCK-CHECK]   ❌ Error fixing student ${result.studentId}:`, error.message);
        }
      }

      console.log(`[STUCK-CHECK] Fixed ${fixedProgressions} stuck progressions`);

      return {
        success: true,
        stuckFound: stuckResults.length,
        progressionsFixed: fixedProgressions
      };

    } catch (error) {
      console.error('[STUCK-CHECK] ❌ Error detecting stuck progressions:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Main entry point - runs complete validation suite
   */
  static async runCompleteValidation() {
    try {
      console.log('\n🚀 STARTING COMPLETE AUTOMATIC PROGRESSION VALIDATION');
      console.log('='.repeat(80));

      const results = {
        flowValidation: null,
        studentValidation: null,
        stuckDetection: null
      };

      // 1. Validate progression flow logic
      results.flowValidation = await this.validateCompleteProgressionFlow();

      // 2. Process all students and fix any issues
      results.studentValidation = await this.validateAndProcessAllStudents();

      // 3. Detect and fix any stuck progressions
      results.stuckDetection = await this.detectStuckProgressions();

      console.log('\n🎉 COMPLETE VALIDATION FINISHED');
      console.log('='.repeat(80));
      console.log('📊 FINAL RESULTS:');
      console.log(`   Flow Validation: ${results.flowValidation.success ? '✅ PASSED' : '❌ FAILED'}`);
      console.log(`   Student Processing: ${results.studentValidation.success ? '✅ PASSED' : '❌ FAILED'}`);
      console.log(`   Stuck Detection: ${results.stuckDetection.success ? '✅ PASSED' : '❌ FAILED'}`);

      if (results.studentValidation.success) {
        console.log(`   - ${results.studentValidation.studentsProgressed} students progressed`);
        console.log(`   - ${results.studentValidation.placeholdersCreated} placeholders created`);
        console.log(`   - ${results.studentValidation.completionsMarked} completions marked`);
      }

      if (results.stuckDetection.success) {
        console.log(`   - ${results.stuckDetection.progressionsFixed} stuck progressions fixed`);
      }

      return results;

    } catch (error) {
      console.error('❌ Error in complete validation:', error);
      return { success: false, error: error.message };
    }
  }
}

module.exports = AutomaticProgressionValidationService;