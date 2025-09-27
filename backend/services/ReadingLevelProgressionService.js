const mongoose = require('mongoose');
const CategoryResult = require('../models/Teachers/ManageProgress/categoryResultModel');
const User = require('../models/userModel');
const MainAssessment = require('../models/Teachers/mainAssessmentModel');

/**
 * ✅ AUTOMATIC READING LEVEL PROGRESSION SYSTEM
 * Based on CLAUDE.md specifications for sequential reading level progression
 *
 * Reading Level Structure:
 * - Low Emerging: 1 category (Alphabet Knowledge)
 * - High Emerging: 2 categories (Alphabet + Phonological)
 * - Developing: 3 categories (Alphabet + Phonological + Decoding)
 * - Transitioning: 4 categories (Alphabet + Phonological + Decoding + Word Recognition)
 * - At Grade Level: 5 categories (All above + Reading Comprehension)
 */
class ReadingLevelProgressionService {

  /**
   * Main method to check and process reading level progression for a student
   */
  static async checkAndProgressReadingLevel(studentId, currentReadingLevel = null) {
    try {
      console.log(`[PROGRESSION] 🚀 Checking reading level progression for student ${studentId}`);

      // Get current student data
      const student = await User.findOne({ idNumber: studentId });
      if (!student) {
        console.error(`[PROGRESSION] ❌ Student ${studentId} not found`);
        return { success: false, error: 'Student not found' };
      }

      const readingLevel = currentReadingLevel || student.readingLevel;
      console.log(`[PROGRESSION] 📚 Current reading level: ${readingLevel}`);

      // Get required categories for current level
      const requiredCategories = this.getCategoriesForReadingLevel(readingLevel);
      console.log(`[PROGRESSION] 📋 Required categories for ${readingLevel}: [${requiredCategories.join(', ')}]`);

      // Check if all categories are completed and passed
      const progressionResult = await this.evaluateProgressionEligibility(studentId, readingLevel, requiredCategories);

      if (!progressionResult.eligible) {
        console.log(`[PROGRESSION] ⏸️ Student ${studentId} not eligible for progression: ${progressionResult.reason}`);
        return {
          success: true,
          progressionNeeded: false,
          reason: progressionResult.reason,
          categoryStatus: progressionResult.categoryStatus
        };
      }

      // Special handling for students already at maximum level
      if (readingLevel === 'At Grade Level') {
        console.log(`[PROGRESSION] 🏔️ Student ${studentId} at maximum level but all categories completed - marking as updated`);

        // Mark the category results as reading level updated (assessment complete)
        const CategoryResult = require('../models/Teachers/ManageProgress/categoryResultModel');
        await CategoryResult.updateOne(
          { studentId: studentId },
          {
            $set: {
              readingLevelUpdated: true,
              updatedAt: new Date()
            }
          }
        );

        console.log(`[PROGRESSION] ✅ Marked readingLevelUpdated=true for student ${studentId} at maximum level`);
        return {
          success: true,
          progressionNeeded: false,
          reason: 'Already at maximum level - marked as completed',
          readingLevelUpdated: true,
          categoryStatus: progressionResult.categoryStatus
        };
      }

      // Execute progression to next level
      const nextLevel = this.getNextReadingLevel(readingLevel);

      // Check if there is a next level (prevent null progression)
      if (!nextLevel) {
        console.log(`[PROGRESSION] 🏔️ Student ${studentId} is already at maximum level (${readingLevel}) - cannot progress further`);

        // Mark the category results as completed for maximum level
        const CategoryResult = require('../models/Teachers/ManageProgress/categoryResultModel');
        await CategoryResult.updateOne(
          { studentId: studentId, readingLevel: readingLevel },
          {
            $set: {
              readingLevelUpdated: true,
              updatedAt: new Date()
            }
          }
        );

        console.log(`[PROGRESSION] ✅ Marked readingLevelUpdated=true for student ${studentId} at maximum level ${readingLevel}`);
        return {
          success: true,
          progressionNeeded: false,
          reason: `Already at maximum level (${readingLevel}) - marked as completed`,
          readingLevelUpdated: true,
          categoryStatus: progressionResult.categoryStatus
        };
      }

      console.log(`[PROGRESSION] ⬆️ Progressing student ${studentId} from ${readingLevel} to ${nextLevel}`);

      const progressionExecutionResult = await this.executeReadingLevelProgression(
        studentId,
        readingLevel,
        nextLevel
      );

      return progressionExecutionResult;

    } catch (error) {
      console.error(`[PROGRESSION] ❌ Error in reading level progression for student ${studentId}:`, error);
      return {
        success: false,
        error: error.message,
        stack: error.stack
      };
    }
  }

  /**
   * Get categories required for a specific reading level
   */
  static getCategoriesForReadingLevel(readingLevel) {
    const categoryMapping = {
      'Low Emerging': ['Alphabet Knowledge'],
      'High Emerging': ['Alphabet Knowledge', 'Phonological Awareness'],
      'Developing': ['Alphabet Knowledge', 'Phonological Awareness', 'Decoding'],
      'Transitioning': ['Alphabet Knowledge', 'Phonological Awareness', 'Decoding', 'Word Recognition'],
      'At Grade Level': ['Alphabet Knowledge', 'Phonological Awareness', 'Decoding', 'Word Recognition', 'Reading Comprehension']
    };

    return categoryMapping[readingLevel] || [];
  }

  /**
   * Get the next reading level in the progression sequence
   */
  static getNextReadingLevel(currentLevel) {
    const progression = {
      'Low Emerging': 'High Emerging',
      'High Emerging': 'Developing',
      'Developing': 'Transitioning',
      'Transitioning': 'At Grade Level',
      'At Grade Level': null // Maximum level
    };

    return progression[currentLevel];
  }

  /**
   * Check if student is eligible for reading level progression
   */
  static async evaluateProgressionEligibility(studentId, readingLevel, requiredCategories) {
    try {
      // Get latest category results for student
      const categoryResults = await CategoryResult.findOne({
        studentId: studentId
      }).sort({ updatedAt: -1 });

      if (!categoryResults) {
        return {
          eligible: false,
          reason: 'No category results found',
          categoryStatus: {}
        };
      }

      console.log(`[PROGRESSION] 🔍 Evaluating ${requiredCategories.length} required categories for student ${studentId}`);

      const categoryStatus = {};
      let allCategoriesPassed = true;
      let completedCount = 0;

      // Check each required category
      for (const categoryName of requiredCategories) {
        const categoryData = categoryResults.categories.find(cat => cat.categoryName === categoryName);

        if (!categoryData) {
          categoryStatus[categoryName] = {
            exists: false,
            completed: false,
            passed: false,
            score: 0,
            reason: 'Category data not found'
          };
          allCategoriesPassed = false;
          continue;
        }

        // Check if category is completed through main assessment or intervention
        const isCompleted = categoryData.isCompleted === true;
        const isPassedOriginal = categoryData.isPassed === true && categoryData.score >= 75;

        // Check if passed through intervention
        const isPassedThroughIntervention = this.checkInterventionSuccess(categoryData);

        const effectivelyPassed = isPassedOriginal || isPassedThroughIntervention;

        categoryStatus[categoryName] = {
          exists: true,
          completed: isCompleted,
          passed: effectivelyPassed,
          score: categoryData.score,
          interventionCompleted: categoryData.interventionCompleted || false,
          interventionAttempts: categoryData.interventionAttempts || 0,
          passedVia: isPassedOriginal ? 'main_assessment' : (isPassedThroughIntervention ? 'intervention' : 'none')
        };

        if (effectivelyPassed) {
          completedCount++;
        } else {
          allCategoriesPassed = false;
        }

        console.log(`[PROGRESSION]   📊 ${categoryName}: completed=${isCompleted}, passed=${effectivelyPassed} (${categoryStatus[categoryName].passedVia}), score=${categoryData.score}%`);
      }

      const result = {
        eligible: allCategoriesPassed,
        reason: allCategoriesPassed ? 'All categories passed - eligible for progression' : `${completedCount}/${requiredCategories.length} categories passed`,
        categoryStatus: categoryStatus,
        completedCount: completedCount,
        totalRequired: requiredCategories.length
      };

      console.log(`[PROGRESSION] 📈 Progression eligibility: ${result.eligible ? '✅ ELIGIBLE' : '❌ NOT ELIGIBLE'} (${result.reason})`);

      return result;

    } catch (error) {
      console.error(`[PROGRESSION] ❌ Error evaluating progression eligibility:`, error);
      return {
        eligible: false,
        reason: `Error evaluating eligibility: ${error.message}`,
        categoryStatus: {}
      };
    }
  }

  /**
   * Check if category was passed through intervention
   */
  static checkInterventionSuccess(categoryData) {
    if (!categoryData.interventionHistory || categoryData.interventionHistory.length === 0) {
      return false;
    }

    // Check if any intervention attempt passed
    return categoryData.interventionHistory.some(attempt =>
      attempt.isPassed === true && attempt.score >= 75
    );
  }

  /**
   * Execute the reading level progression
   */
  static async executeReadingLevelProgression(studentId, fromLevel, toLevel) {
    const session = await mongoose.startSession();

    try {
      session.startTransaction();

      console.log(`[PROGRESSION] 🔄 Executing progression for student ${studentId}: ${fromLevel} → ${toLevel}`);

      // Step 1: Update user's reading level
      const userUpdateResult = await User.updateOne(
        { idNumber: studentId },
        {
          $set: {
            readingLevel: toLevel,
            updatedAt: new Date()
          }
        },
        { session }
      );

      if (userUpdateResult.modifiedCount === 0) {
        throw new Error(`Failed to update user reading level for student ${studentId}`);
      }

      console.log(`[PROGRESSION] ✅ Updated user reading level: ${fromLevel} → ${toLevel}`);

      // Step 2: Update OLD category results to mark progression as completed
      // ✅ CLAUDE.md COMPLIANCE: Keep old record's readingLevel, just mark as updated
      const categoryResultsUpdate = await CategoryResult.updateOne(
        { studentId: studentId, readingLevel: fromLevel }, // Find the old level record
        {
          $set: {
            readingLevelUpdated: true, // Mark as progression completed
            // ✅ Keep original readingLevel (fromLevel) - don't change it to toLevel
            updatedAt: new Date()
          }
        },
        { session }
      );

      if (categoryResultsUpdate.modifiedCount === 0) {
        console.warn(`[PROGRESSION] ⚠️ No category results updated for progression flag`);
      }

      console.log(`[PROGRESSION] ✅ Marked progression completed in category_results`);

      // Step 3: Create new category results placeholder for next level (if not at max)
      if (toLevel !== 'At Grade Level') {
        await this.createNextLevelCategoryPlaceholder(studentId, toLevel, session);
      } else {
        console.log(`[PROGRESSION] 🏔️ Student reached maximum level - no placeholder needed`);
      }

      // Commit transaction
      await session.commitTransaction();

      console.log(`[PROGRESSION] 🎉 Successfully progressed student ${studentId} to ${toLevel}`);

      return {
        success: true,
        progressionExecuted: true,
        fromLevel: fromLevel,
        toLevel: toLevel,
        userUpdated: true,
        categoryResultsUpdated: true,
        placeholderCreated: toLevel !== 'At Grade Level'
      };

    } catch (error) {
      await session.abortTransaction();
      console.error(`[PROGRESSION] ❌ Error executing progression:`, error);

      return {
        success: false,
        error: error.message,
        fromLevel: fromLevel,
        toLevel: toLevel
      };

    } finally {
      session.endSession();
    }
  }

  /**
   * Create category results placeholder for the next reading level
   */
  static async createNextLevelCategoryPlaceholder(studentId, newLevel, session) {
    try {
      console.log(`[PROGRESSION] 📋 Creating category placeholder for ${newLevel} level`);

      const requiredCategories = this.getCategoriesForReadingLevel(newLevel);
      const questionCounts = await this.getQuestionCountsFromMainAssessment(newLevel);

      console.log(`[PROGRESSION] 📊 Question counts for ${newLevel}:`, questionCounts);

      // ✅ CLAUDE.md COMPLIANCE: Always create fresh category_results for new level
      // Check if placeholder already exists for this level and remove it
      const existingPlaceholder = await CategoryResult.findOne({
        studentId: studentId,
        readingLevel: newLevel
      }).session(session);

      if (existingPlaceholder) {
        console.log(`[PROGRESSION] 🔄 Found existing ${newLevel} record - removing to create fresh placeholder with all required categories`);
        await CategoryResult.deleteOne({
          studentId: studentId,
          readingLevel: newLevel
        }).session(session);
        console.log(`[PROGRESSION] ✅ Removed existing ${newLevel} record - will create fresh one`);
      }

      // Create categories array with proper question counts
      const categories = requiredCategories.map(categoryName => {
        const questionCount = questionCounts[categoryName] || 15; // Default to 15 if not found

        console.log(`[PROGRESSION]   📝 ${categoryName}: ${questionCount} questions`);

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

      // Create new category results record for next level
      const newCategoryResult = new CategoryResult({
        studentId: studentId,
        assessmentDate: new Date(),
        categories: categories,
        overallScore: 0,
        completedCategories: 0,
        totalCategories: requiredCategories.length,
        allCategoriesPassed: false,
        readingLevel: newLevel,
        readingLevelUpdated: false, // Will be set to true when this level is completed
        createdAt: new Date(),
        updatedAt: new Date()
      });

      await newCategoryResult.save({ session });

      console.log(`[PROGRESSION] ✅ Created category results placeholder for ${newLevel} with ${requiredCategories.length} categories`);
      console.log(`[PROGRESSION] 📋 Categories created: [${requiredCategories.join(', ')}]`);

    } catch (error) {
      console.error(`[PROGRESSION] ❌ Error creating category placeholder:`, error);
      throw error;
    }
  }

  /**
   * Get question counts from main_assessment collection
   */
  static async getQuestionCountsFromMainAssessment(readingLevel) {
    try {
      console.log(`[PROGRESSION] 🔍 Getting question counts from main_assessment for ${readingLevel}`);

      const mainAssessments = await MainAssessment.find({
        readingLevel: readingLevel,
        isActive: true
      });

      const questionCounts = {};

      for (const assessment of mainAssessments) {
        const questionCount = assessment.questions ? assessment.questions.length : 0;
        questionCounts[assessment.category] = questionCount;

        console.log(`[PROGRESSION]   📊 ${assessment.category}: ${questionCount} questions (from main_assessment)`);
      }

      // Set defaults for any missing categories
      const defaultCounts = {
        'Alphabet Knowledge': 15,
        'Phonological Awareness': 6,
        'Decoding': 15,
        'Word Recognition': 15,
        'Reading Comprehension': 10
      };

      const requiredCategories = this.getCategoriesForReadingLevel(readingLevel);
      for (const category of requiredCategories) {
        if (!questionCounts[category]) {
          questionCounts[category] = defaultCounts[category] || 15;
          console.log(`[PROGRESSION]   📊 ${category}: ${questionCounts[category]} questions (default fallback)`);
        }
      }

      return questionCounts;

    } catch (error) {
      console.error(`[PROGRESSION] ❌ Error getting question counts:`, error);

      // Return default counts on error
      return {
        'Alphabet Knowledge': 15,
        'Phonological Awareness': 6,
        'Decoding': 15,
        'Word Recognition': 15,
        'Reading Comprehension': 10
      };
    }
  }

  /**
   * Get reading level progression summary for a student
   */
  static async getProgressionSummary(studentId) {
    try {
      const student = await User.findOne({ idNumber: studentId });
      if (!student) {
        return { error: 'Student not found' };
      }

      const currentLevel = student.readingLevel;
      const requiredCategories = this.getCategoriesForReadingLevel(currentLevel);
      const nextLevel = this.getNextReadingLevel(currentLevel);

      const categoryResults = await CategoryResult.findOne({
        studentId: studentId
      }).sort({ updatedAt: -1 });

      let progressionStatus = 'unknown';
      let categoryBreakdown = {};

      if (categoryResults) {
        const eligibilityCheck = await this.evaluateProgressionEligibility(studentId, currentLevel, requiredCategories);
        progressionStatus = eligibilityCheck.eligible ? 'eligible' : 'not_eligible';
        categoryBreakdown = eligibilityCheck.categoryStatus;
      }

      return {
        studentId: studentId,
        currentLevel: currentLevel,
        nextLevel: nextLevel,
        isAtMaxLevel: currentLevel === 'At Grade Level',
        requiredCategories: requiredCategories,
        progressionStatus: progressionStatus,
        categoryBreakdown: categoryBreakdown,
        readingLevelUpdated: categoryResults?.readingLevelUpdated || false
      };

    } catch (error) {
      console.error(`[PROGRESSION] ❌ Error getting progression summary:`, error);
      return { error: error.message };
    }
  }
}

module.exports = ReadingLevelProgressionService;