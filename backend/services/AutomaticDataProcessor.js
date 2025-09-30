const mongoose = require('mongoose');
const User = require('../models/userModel');
const StudentResponse = require('../models/Teachers/ManageProgress/studentResponseModel');
const CategoryResult = require('../models/Teachers/ManageProgress/categoryResultModel');
const CategoryResultsService = require('./Teachers/CategoryResultsService');

/**
 * Automatic Data Processor
 * Ensures data consistency by auto-creating missing category_results from student_responses
 */
class AutomaticDataProcessor {

  /**
   * Main entry point - processes all missing data automatically
   */
  static async processAllMissingData() {
    try {
      console.log('[AUTO PROCESSOR] 🤖 Starting automatic data processing...');

      // Step 1: Find students with responses but no category results
      const studentsNeedingProcessing = await this.findStudentsWithMissingCategoryResults();
      console.log(`[AUTO PROCESSOR] Found ${studentsNeedingProcessing.length} students needing processing`);

      // Step 2: Process each student automatically
      for (const student of studentsNeedingProcessing) {
        await this.processStudentData(student);
      }

      console.log('[AUTO PROCESSOR] ✅ Automatic data processing completed');

    } catch (error) {
      console.error('[AUTO PROCESSOR] ❌ Error during automatic processing:', error);
    }
  }

  /**
   * Find students who have student_responses but no category_results
   */
  static async findStudentsWithMissingCategoryResults() {
    try {
      // Get all students who have student responses
      const studentsWithResponses = await StudentResponse.distinct('studentId');
      console.log(`[AUTO PROCESSOR] Found ${studentsWithResponses.length} students with responses`);

      // Check which ones don't have category results
      const studentsNeedingProcessing = [];

      for (const studentId of studentsWithResponses) {
        const existingCategoryResults = await CategoryResult.findOne({ studentId: studentId });

        if (!existingCategoryResults) {
          // Get student info for reading level
          const user = await User.findOne({ idNumber: studentId });
          if (user) {
            studentsNeedingProcessing.push({
              studentId: studentId,
              readingLevel: user.readingLevel,
              firstName: user.firstName,
              lastName: user.lastName
            });
            console.log(`[AUTO PROCESSOR] ⚠️ Student ${studentId} (${user.firstName} ${user.lastName}) has responses but no category_results`);
          }
        }
      }

      return studentsNeedingProcessing;

    } catch (error) {
      console.error('[AUTO PROCESSOR] Error finding students with missing data:', error);
      return [];
    }
  }

  /**
   * Process a single student's data automatically
   */
  static async processStudentData(student) {
    try {
      console.log(`[AUTO PROCESSOR] 🔄 Processing student ${student.studentId} (${student.firstName} ${student.lastName})`);

      // Get all responses for this student
      const studentResponses = await StudentResponse.find({ studentId: student.studentId });
      console.log(`[AUTO PROCESSOR] Found ${studentResponses.length} responses for student ${student.studentId}`);

      if (studentResponses.length === 0) {
        console.log(`[AUTO PROCESSOR] ⚠️ No responses found for student ${student.studentId}`);
        return;
      }

      // Group responses by reading level (process current level)
      const currentLevelResponses = studentResponses.filter(r => r.readingLevel === student.readingLevel);
      console.log(`[AUTO PROCESSOR] Found ${currentLevelResponses.length} responses for current reading level: ${student.readingLevel}`);

      if (currentLevelResponses.length === 0) {
        console.log(`[AUTO PROCESSOR] ⚠️ No responses for current reading level ${student.readingLevel}`);
        return;
      }

      // Generate category results from responses
      await this.generateCategoryResultsFromResponses(student.studentId, student.readingLevel, currentLevelResponses);

      console.log(`[AUTO PROCESSOR] ✅ Successfully processed student ${student.studentId}`);

    } catch (error) {
      console.error(`[AUTO PROCESSOR] ❌ Error processing student ${student.studentId}:`, error);
    }
  }

  /**
   * Generate category_results from student_responses
   */
  static async generateCategoryResultsFromResponses(studentId, readingLevel, responses) {
    try {
      console.log(`[AUTO PROCESSOR] 📊 Generating category results for student ${studentId}, level ${readingLevel}`);

      // Group responses by category
      const responsesByCategory = {};
      responses.forEach(response => {
        const category = response.category;
        if (!responsesByCategory[category]) {
          responsesByCategory[category] = [];
        }
        responsesByCategory[category].push(response);
      });

      console.log(`[AUTO PROCESSOR] Found responses for categories: ${Object.keys(responsesByCategory).join(', ')}`);

      // Calculate scores for each category
      const categories = [];
      let totalScore = 0;
      let totalCategories = Object.keys(responsesByCategory).length;

      for (const [categoryName, categoryResponses] of Object.entries(responsesByCategory)) {
        const categoryResult = this.calculateCategoryScore(categoryName, categoryResponses);
        categories.push(categoryResult);
        totalScore += categoryResult.score;

        console.log(`[AUTO PROCESSOR] ${categoryName}: ${categoryResult.correctAnswers}/${categoryResult.totalQuestions} = ${categoryResult.score}%`);
      }

      const overallScore = Math.round(totalScore / totalCategories);

      // Create category_results record
      const categoryResultData = {
        studentId: studentId,
        assessmentDate: new Date(),
        readingLevel: readingLevel,
        categories: categories,
        overallScore: overallScore,
        completedCategories: totalCategories,
        totalCategories: totalCategories,
        allCategoriesPassed: categories.every(cat => cat.isPassed),
        readingLevelUpdated: false,
        createdAt: new Date(),
        updatedAt: new Date()
      };

      const categoryResult = new CategoryResult(categoryResultData);
      const savedResult = await categoryResult.save();

      console.log(`[AUTO PROCESSOR] ✅ Created category_results for student ${studentId} with overall score ${overallScore}%`);

      // Trigger prescriptive analysis
      try {
        const IntegrationTriggerService = require('./Teachers/PrescriptiveAnalytics/integrationTriggerService');
        await IntegrationTriggerService.triggerPrescriptiveAnalysis(savedResult);
        console.log(`[AUTO PROCESSOR] ✅ Triggered prescriptive analysis for student ${studentId}`);
      } catch (error) {
        console.error(`[AUTO PROCESSOR] ⚠️ Error triggering prescriptive analysis for student ${studentId}:`, error);
      }

      return savedResult;

    } catch (error) {
      console.error(`[AUTO PROCESSOR] ❌ Error generating category results for student ${studentId}:`, error);
      throw error;
    }
  }

  /**
   * Calculate score for a single category
   */
  static calculateCategoryScore(categoryName, responses) {
    let totalQuestions = responses.length;
    let correctAnswers = 0;
    let totalMatches = 0;
    let correctMatches = 0;

    // Process each response
    responses.forEach(response => {
      if (response.isCorrect) {
        correctAnswers++;
      }

      // Handle Phonological Awareness matching
      if (categoryName === 'Phonological Awareness' && response.correctMatches !== undefined) {
        correctMatches += response.correctMatches || 0;
        totalMatches += response.totalMatches || 0;
      }
    });

    // Calculate score based on category type
    let score;
    if (categoryName === 'Phonological Awareness' && totalMatches > 0) {
      score = Math.round((correctMatches / totalMatches) * 100);
    } else {
      score = Math.round((correctAnswers / totalQuestions) * 100);
    }

    const isPassed = score >= 75;

    const categoryResult = {
      categoryName: categoryName,
      totalQuestions: totalQuestions,
      correctAnswers: correctAnswers,
      score: score,
      isPassed: isPassed,
      passingThreshold: 75,
      isCompleted: true,
      interventionRequired: !isPassed,
      interventionAttempts: 0,
      interventionCompleted: false,
      currentInterventionId: null,
      interventionHistory: []
    };

    // Add Phonological Awareness specific fields
    if (categoryName === 'Phonological Awareness') {
      categoryResult.totalPossibleMatches = totalMatches;
      categoryResult.correctMatches = correctMatches;
    }

    return categoryResult;
  }

  /**
   * Run this automatically when server starts
   */
  static async initializeAutoProcessing() {
    try {
      console.log('[AUTO PROCESSOR] 🚀 Initializing automatic data processing...');

      // Wait a bit for server to fully start
      setTimeout(async () => {
        await this.processAllMissingData();
      }, 5000);

    } catch (error) {
      console.error('[AUTO PROCESSOR] ❌ Error initializing auto processing:', error);
    }
  }
}

module.exports = AutomaticDataProcessor;