const mongoose = require('mongoose');
const User = require('../../models/userModel');
const CategoryResult = require('../../models/Teachers/ManageProgress/categoryResultModel');
const IntegrationTriggerService = require('./PrescriptiveAnalytics/integrationTriggerService');
const AssessmentFlowControlService = require('./AssessmentFlowControlService');
const ReadingLevelProgressionService = require('../ReadingLevelProgressionService');

/**
 * Service for handling category results data
 */
class CategoryResultsService {

  /**
   * 🎯 COMPREHENSIVE CATEGORY REPAIR SYSTEM
   * Auto-fix existing data inconsistencies on service startup
   * This ensures ALL students have complete category records with correct question counts
   */
  static async autoFixExistingData() {
    try {
      console.log('[AUTO-FIX] 🔧 Starting comprehensive category repair system...');

      // Step 1: Fix question counts using main_assessment data
      await this.fixMainAssessmentQuestionCounts();

      // Step 2: COMPREHENSIVE FIX for all incorrect totalQuestions
      await this.fixAllIncorrectTotalQuestions();

      // Step 3: Repair ALL incomplete category records
      await this.repairAllIncompleteCategoryRecords();

      // Step 4: Fix existing overall scores that don't include intervention results
      await this.fixExistingOverallScores();

      // 🔧 FORCE FIX: Handle stubborn records that don't update properly
      console.log('[FORCE FIX] 🔧 Running force fix for specific problematic students...');
      const problematicStudents = [202533333]; // Students with known score calculation issues

      for (const studentId of problematicStudents) {
        const forceResult = await this.forceFixStudentOverallScore(studentId);
        if (forceResult.success) {
          console.log(`[FORCE FIX] ✅ Student ${studentId}: ${forceResult.oldScore}% → ${forceResult.newScore}%`);
        } else {
          console.log(`[FORCE FIX] ❌ Student ${studentId}: ${forceResult.error}`);
        }
      }

      console.log('[AUTO-FIX] ✅ Comprehensive category repair completed successfully');

    } catch (error) {
      console.error('[AUTO-FIX] ❌ Error during comprehensive category repair:', error);
      throw error;
    }
  }

  /**
   * 📊 Fix question counts using main_assessment data
   */
  static async fixMainAssessmentQuestionCounts() {
    try {
      console.log('[AUTO-FIX] 📊 Step 1: Fixing question counts from main_assessment...');

      // Import the MainAssessment model
      const MainAssessment = require('../../models/Teachers/mainAssessmentModel');

      // Get all active main assessments using Mongoose model
      const mainAssessments = await MainAssessment.find({
        isActive: true
      }).lean();
      
      if (!mainAssessments || mainAssessments.length === 0) {
        console.log('[AUTO-FIX] ⚠️ No active main assessments found');
        return;
      }
      
      // Create a map of category to correct question count
      const categoryQuestionCounts = {};
      mainAssessments.forEach(assessment => {
        if (assessment.questions && assessment.questions.length > 0) {
          categoryQuestionCounts[assessment.category] = assessment.questions.length;
          console.log(`[AUTO-FIX] 📋 ${assessment.category}: ${assessment.questions.length} questions`);
        }
      });
      
      let totalFixedCount = 0;
      
      // Import the CategoryResult model
      const CategoryResult = require('../../models/Teachers/ManageProgress/categoryResultModel');

      // Process each category
      for (const [categoryName, correctTotalQuestions] of Object.entries(categoryQuestionCounts)) {
        console.log(`[AUTO-FIX] 🔧 Processing ${categoryName}...`);

        // Find category results with incorrect question counts for this category
        const categoryResults = await CategoryResult.find({
          [`categories.categoryName`]: categoryName,
          [`categories.totalQuestions`]: { $ne: correctTotalQuestions }
        }).lean();
        
        console.log(`[AUTO-FIX] 📊 Found ${categoryResults.length} category results with incorrect ${categoryName} data`);

        for (const categoryResult of categoryResults) {
          const category = categoryResult.categories.find(
            cat => cat.categoryName === categoryName
          );
          
          if (category) {
            const oldTotalQuestions = category.totalQuestions;
            const oldScore = category.score;
            
            // Update the totalQuestions to the correct number from main assessment
            category.totalQuestions = correctTotalQuestions;
            
            // Recalculate the score based on correct answers out of the correct total
            const newScore = Math.round((category.correctAnswers / correctTotalQuestions) * 100);
            category.score = newScore;
            
            // Update isPassed based on new score
            category.isPassed = newScore >= category.passingThreshold;
            
            console.log(`[AUTO-FIX] Student ${categoryResult.studentId} - ${categoryName}: ${oldTotalQuestions} → ${correctTotalQuestions} questions, ${oldScore}% → ${newScore}%`);

            // Update the category result in the database
            await CategoryResult.updateOne(
              { _id: categoryResult._id },
              {
                $set: {
                  categories: categoryResult.categories,
                  updatedAt: new Date()
                }
              }
            );
            
            totalFixedCount++;
          }
        }
      }
      
      console.log(`[AUTO-FIX] 🎉 Fixed ${totalFixedCount} category results across all categories!`);

    } catch (error) {
      console.error('[AUTO-FIX] ❌ Error during automatic data fix:', error);
    }
  }

  /**
   * 🔧 COMPREHENSIVE FIX: Fix all incorrect totalQuestions in category_results
   * This DYNAMICALLY reads from main_assessment and fixes ALL records
   */
  static async fixAllIncorrectTotalQuestions() {
    try {
      console.log('[COMPREHENSIVE FIX] 🔧 Starting DYNAMIC totalQuestions correction for all category results...');

      // Import required models
      const MainAssessment = require('../../models/Teachers/mainAssessmentModel');
      const CategoryResult = require('../../models/Teachers/ManageProgress/categoryResultModel');

      // Get ALL main assessment records to see what we have
      const allMainAssessments = await MainAssessment.find({}).lean();
      console.log(`[COMPREHENSIVE FIX] 📚 Found ${allMainAssessments.length} main assessment records in database`);

      // Get ACTIVE correct question counts from main_assessment (DYNAMIC)
      const activeMainAssessments = await MainAssessment.find({ isActive: true }).lean();
      const correctQuestionCounts = {};

      console.log('[COMPREHENSIVE FIX] 📋 DYNAMIC question counts from main_assessment:');
      activeMainAssessments.forEach(assessment => {
        if (assessment.questions && assessment.questions.length > 0) {
          correctQuestionCounts[assessment.category] = assessment.questions.length;
          console.log(`[COMPREHENSIVE FIX]   📝 ${assessment.category}: ${assessment.questions.length} questions (Reading Level: ${assessment.readingLevel})`);
        }
      });

      // Check if we have all required categories
      const requiredCategories = ['Alphabet Knowledge', 'Phonological Awareness', 'Decoding', 'Word Recognition', 'Reading Comprehension'];
      const missingCategories = requiredCategories.filter(cat => !correctQuestionCounts[cat]);

      if (missingCategories.length > 0) {
        console.warn(`[COMPREHENSIVE FIX] ⚠️ Missing main_assessment data for: ${missingCategories.join(', ')}`);
      }

      // Find ALL category results that need fixing
      const allCategoryResults = await CategoryResult.find({}).lean();
      console.log(`[COMPREHENSIVE FIX] 📊 Found ${allCategoryResults.length} total category result records to check`);

      let totalFixed = 0;
      let totalChecked = 0;

      for (const categoryResult of allCategoryResults) {
        totalChecked++;
        let recordNeedsUpdate = false;
        const updates = {};
        const studentId = categoryResult.studentId;

        console.log(`[COMPREHENSIVE FIX] 🔍 Checking student ${studentId} (${totalChecked}/${allCategoryResults.length})`);

        for (let i = 0; i < categoryResult.categories.length; i++) {
          const category = categoryResult.categories[i];
          const correctCount = correctQuestionCounts[category.categoryName];

          if (!correctCount) {
            console.warn(`[COMPREHENSIVE FIX] ⚠️ No main_assessment data for ${category.categoryName} - skipping`);
            continue;
          }

          if (category.totalQuestions !== correctCount) {
            console.log(`[COMPREHENSIVE FIX] 🔧 Student ${studentId} - ${category.categoryName}: ${category.totalQuestions} → ${correctCount} (Dynamic from main_assessment)`);

            // Calculate new score based on CORRECT total from main_assessment
            const newScore = category.correctAnswers > 0 ?
              Math.round((category.correctAnswers / correctCount) * 100) : 0;

            // For Phonological Awareness, use correctMatches if available
            let finalScore = newScore;
            if (category.categoryName === 'Phonological Awareness' && category.correctMatches !== undefined && category.totalPossibleMatches > 0) {
              finalScore = Math.round((category.correctMatches / category.totalPossibleMatches) * 100);
              console.log(`[COMPREHENSIVE FIX]   📊 Using Phonological Awareness matching score: ${category.correctMatches}/${category.totalPossibleMatches} = ${finalScore}%`);
            }

            updates[`categories.${i}.totalQuestions`] = correctCount;
            updates[`categories.${i}.score`] = finalScore;
            updates[`categories.${i}.isPassed`] = finalScore >= 75;
            updates[`updatedAt`] = new Date();

            recordNeedsUpdate = true;
          }
        }

        if (recordNeedsUpdate) {
          await CategoryResult.updateOne(
            { _id: categoryResult._id },
            { $set: updates }
          );
          totalFixed++;
          console.log(`[COMPREHENSIVE FIX] ✅ Fixed student ${studentId} record`);
        } else {
          console.log(`[COMPREHENSIVE FIX] ✅ Student ${studentId} record already correct`);
        }
      }

      console.log(`[COMPREHENSIVE FIX] 🎉 Complete! Checked ${totalChecked} records, Fixed ${totalFixed} category result records`);
      console.log(`[COMPREHENSIVE FIX] 📊 All totalQuestions now dynamically match main_assessment data`);

    } catch (error) {
      console.error('[COMPREHENSIVE FIX] ❌ Error during comprehensive fix:', error);
      throw error;
    }
  }

  /**
   * 🔧 COMPREHENSIVE REPAIR: Ensure ALL students have complete category records
   * This repairs incomplete category records for ALL students based on their reading levels
   */
  static async repairAllIncompleteCategoryRecords() {
    try {
      console.log('[COMPREHENSIVE REPAIR] 🔧 Step 2: Repairing ALL incomplete category records...');

      // Get all students with reading levels
      const allStudents = await User.find({
        readingLevel: { $exists: true, $ne: null }
      }).select('idNumber firstName lastName readingLevel');

      console.log(`[COMPREHENSIVE REPAIR] 📊 Found ${allStudents.length} students with reading levels`);

      let repairedCount = 0;
      let alreadyCompleteCount = 0;

      for (const student of allStudents) {
        const studentId = student.idNumber;
        const readingLevel = student.readingLevel;
        const studentName = `${student.firstName} ${student.lastName}`;

        console.log(`[COMPREHENSIVE REPAIR] 🔍 Checking ${studentName} (${studentId}) - ${readingLevel}`);

        // Get required categories for this reading level
        const requiredCategories = this.getCategoriesForReadingLevel(readingLevel);
        console.log(`[COMPREHENSIVE REPAIR]   📚 Required categories for ${readingLevel}: ${requiredCategories.join(', ')}`);

        // Check existing category results
        const existingResults = await CategoryResult.find({ studentId: studentId });

        if (existingResults.length === 0) {
          // No category results exist - create placeholder record with all categories
          console.log(`[COMPREHENSIVE REPAIR]   ❌ NO CATEGORY RESULTS FOUND - Creating placeholder record`);
          await this.createPlaceholderCategoryRecord(studentId, readingLevel, requiredCategories);
          repairedCount++;
        } else {
          // 🎯 SMART RECORD SELECTION: Only repair records that match current reading level
          const currentLevelRecord = existingResults.find(result => result.readingLevel === readingLevel);

          if (!currentLevelRecord) {
            console.log(`[COMPREHENSIVE REPAIR]   ❌ NO CURRENT LEVEL RECORD - Found ${existingResults.length} historical records but none for ${readingLevel}`);
            console.log(`[COMPREHENSIVE REPAIR]   📚 Historical levels: ${existingResults.map(r => r.readingLevel).join(', ')}`);
            console.log(`[COMPREHENSIVE REPAIR]   ➕ Creating new record for current level: ${readingLevel}`);
            await this.createPlaceholderCategoryRecord(studentId, readingLevel, requiredCategories);
            repairedCount++;
          } else {
            // 🚫 HISTORICAL RECORD PROTECTION: Skip completed historical records
            if (currentLevelRecord.readingLevelUpdated === true) {
              console.log(`[COMPREHENSIVE REPAIR]   🚫 HISTORICAL RECORD - Cannot modify completed record (readingLevelUpdated=true)`);
              console.log(`[COMPREHENSIVE REPAIR]   📚 Record: ${currentLevelRecord.readingLevel} level, completed on ${currentLevelRecord.updatedAt}`);
              alreadyCompleteCount++;
              continue;
            }

            if (currentLevelRecord.allCategoriesPassed === true) {
              console.log(`[COMPREHENSIVE REPAIR]   🚫 PROGRESSION COMPLETED - Cannot modify record (allCategoriesPassed=true)`);
              console.log(`[COMPREHENSIVE REPAIR]   ✅ Record has completed its level progression`);
              alreadyCompleteCount++;
              continue;
            }

            // Check if all required categories are present in current level record
            const existingCategoryNames = currentLevelRecord.categories.map(cat => cat.categoryName);
            const missingCategories = requiredCategories.filter(cat => !existingCategoryNames.includes(cat));

            if (missingCategories.length > 0) {
              console.log(`[COMPREHENSIVE REPAIR]   🔧 INCOMPLETE CURRENT RECORD - Missing ${missingCategories.length} categories: ${missingCategories.join(', ')}`);
              await this.addMissingCategoriesToRecord(currentLevelRecord, missingCategories, readingLevel);
              repairedCount++;
            } else {
              console.log(`[COMPREHENSIVE REPAIR]   ✅ COMPLETE CURRENT RECORD - All ${requiredCategories.length} categories present`);
              alreadyCompleteCount++;
            }
          }
        }
      }

      console.log(`[COMPREHENSIVE REPAIR] ✅ Repair complete: ${repairedCount} fixed, ${alreadyCompleteCount} already complete`);

    } catch (error) {
      console.error('[COMPREHENSIVE REPAIR] ❌ Error during comprehensive repair:', error);
      throw error;
    }
  }

  /**
   * 📝 Create placeholder category record with all required categories
   */
  static async createPlaceholderCategoryRecord(studentId, readingLevel, requiredCategories) {
    try {
      console.log(`[PLACEHOLDER CREATION] 📝 Creating placeholder record for student ${studentId}`);

      const placeholderCategories = [];

      for (const categoryName of requiredCategories) {
        // Get correct question count from main_assessment
        const correctQuestionCount = await this.getCorrectTotalQuestions(categoryName, readingLevel);

        const placeholderCategory = {
          categoryName: categoryName,
          totalQuestions: correctQuestionCount || 0,
          correctAnswers: 0,
          totalPossibleMatches: categoryName === 'Phonological Awareness' ? 0 : 0,
          correctMatches: 0,
          score: 0,
          isPassed: false,
          passingThreshold: 75,
          isCompleted: false,
          lastQuestionAnswered: '',
          interventionRequired: true,
          interventionAttempts: 0,
          interventionCompleted: false,
          currentInterventionId: null,
          interventionHistory: []
        };

        placeholderCategories.push(placeholderCategory);
        console.log(`[PLACEHOLDER CREATION]   📋 Added ${categoryName}: ${correctQuestionCount} questions`);
      }

      // Create the category result record
      const categoryResultData = {
        studentId: studentId,
        assessmentDate: new Date(),
        categories: placeholderCategories,
        overallScore: 0,
        completedCategories: 0,
        totalCategories: placeholderCategories.length,
        allCategoriesPassed: false,
        readingLevel: readingLevel,
        readingLevelUpdated: false
      };

      const newCategoryResult = new CategoryResult(categoryResultData);
      await newCategoryResult.save();

      console.log(`[PLACEHOLDER CREATION] ✅ Created placeholder record ${newCategoryResult._id} for student ${studentId}`);

    } catch (error) {
      console.error(`[PLACEHOLDER CREATION] ❌ Error creating placeholder for student ${studentId}:`, error);
      throw error;
    }
  }

  /**
   * ➕ Add missing categories to existing record
   */
  static async addMissingCategoriesToRecord(existingResult, missingCategories, readingLevel) {
    try {
      // 🚫 CRITICAL VALIDATION: Never modify historical records
      if (existingResult.readingLevelUpdated === true) {
        console.log(`[MISSING CATEGORIES] 🚫 HISTORICAL RECORD PROTECTION: Cannot modify completed record with readingLevelUpdated=true`);
        console.log(`[MISSING CATEGORIES] 📚 Historical record: ${existingResult.readingLevel} level, completed on ${existingResult.updatedAt}`);
        console.log(`[MISSING CATEGORIES] ✅ Skipping modification - historical record must remain intact`);
        return; // Exit early without modification
      }

      // 🚫 READING LEVEL MISMATCH PROTECTION: Never modify records from different reading levels
      if (existingResult.readingLevel !== readingLevel) {
        console.log(`[MISSING CATEGORIES] 🚫 READING LEVEL MISMATCH: Record level (${existingResult.readingLevel}) ≠ Current level (${readingLevel})`);
        console.log(`[MISSING CATEGORIES] ✅ This is a historical record from previous level - skipping modification`);
        return; // Exit early without modification
      }

      // 🚫 PROGRESSION PROTECTION: Never modify records that have completed progression
      if (existingResult.allCategoriesPassed === true) {
        console.log(`[MISSING CATEGORIES] 🚫 PROGRESSION COMPLETED: Record shows allCategoriesPassed=true`);
        console.log(`[MISSING CATEGORIES] ✅ This record has completed its level progression - skipping modification`);
        return; // Exit early without modification
      }

      console.log(`[MISSING CATEGORIES] ➕ Adding ${missingCategories.length} missing categories to record ${existingResult._id}`);
      console.log(`[MISSING CATEGORIES] ✅ Validation passed - safe to modify current level record`);

      for (const categoryName of missingCategories) {
        // Get correct question count from main_assessment
        const correctQuestionCount = await this.getCorrectTotalQuestions(categoryName, readingLevel);

        const placeholderCategory = {
          categoryName: categoryName,
          totalQuestions: correctQuestionCount || 0,
          correctAnswers: 0,
          totalPossibleMatches: categoryName === 'Phonological Awareness' ? 0 : 0,
          correctMatches: 0,
          score: 0,
          isPassed: false,
          passingThreshold: 75,
          isCompleted: false,
          lastQuestionAnswered: '',
          interventionRequired: true,
          interventionAttempts: 0,
          interventionCompleted: false,
          currentInterventionId: null,
          interventionHistory: []
        };

        existingResult.categories.push(placeholderCategory);
        console.log(`[MISSING CATEGORIES]   📋 Added ${categoryName}: ${correctQuestionCount} questions`);
      }

      // Update total categories count
      existingResult.totalCategories = existingResult.categories.length;

      // Save the updated record
      await existingResult.save();

      console.log(`[MISSING CATEGORIES] ✅ Added ${missingCategories.length} categories to record ${existingResult._id}`);

    } catch (error) {
      console.error(`[MISSING CATEGORIES] ❌ Error adding missing categories:`, error);
      throw error;
    }
  }

  /**
   * Get correct total questions for a category from main assessment
   * @param {string} categoryName - The category name
   * @param {string} readingLevel - The reading level
   * @returns {Promise<number>} - The correct total questions count
   */
  static async getCorrectTotalQuestions(categoryName, readingLevel) {
    try {
      const mainDb = mongoose.connection.useDb('dyslexia');
      const mainAssessmentsCollection = mainDb.collection('mainassessments');
      
      // Find the main assessment for this category and reading level
      const mainAssessment = await mainAssessmentsCollection.findOne({
        category: categoryName,
        readingLevel: readingLevel,
        isActive: true
      });
      
      if (mainAssessment && mainAssessment.questions) {
        const correctCount = mainAssessment.questions.length;
        console.log(`[AUTO-FIX] 📋 ${categoryName} (${readingLevel}): ${correctCount} questions from main assessment`);
        return correctCount;
      }
      
      // Fallback: try to find any active assessment for this category
      const fallbackAssessment = await mainAssessmentsCollection.findOne({
        category: categoryName,
        isActive: true
      });
      
      if (fallbackAssessment && fallbackAssessment.questions) {
        const correctCount = fallbackAssessment.questions.length;
        console.log(`[AUTO-FIX] 📋 ${categoryName} (fallback): ${correctCount} questions from main assessment`);
        return correctCount;
      }
      
      console.log(`[AUTO-FIX] ⚠️ No main assessment found for ${categoryName}, using response count`);
      return 0; // Will be handled by the calling function
      
    } catch (error) {
      console.error(`[AUTO-FIX] Error getting correct total questions for ${categoryName}:`, error);
      return 0;
    }
  }

  // Get category results for a student
  static async getCategoryResults(studentId) {
    try {
      // Convert studentId to integer to ensure consistency
      const studentIdInt = parseInt(studentId);
      if (isNaN(studentIdInt)) {
        console.error(`Invalid studentId provided: ${studentId}`);
        return [];
      }

      console.log(`Fetching category results for student ID: ${studentIdInt}`);
      
      // Use Mongoose model instead of direct collection access
      const results = await CategoryResult
        .find({ studentId: studentIdInt })
        .sort({ assessmentDate: -1, createdAt: -1 })
        .lean();
      
      if (results.length === 0) {
        console.log(`No category results found for student: ${studentIdInt}`);
        return [];
      }
      
      console.log(`Found ${results.length} category results for student: ${studentIdInt}`);
      
      // Format the results using the normalize function
      return results.map(result => ({
        ...result,
        categories: this.normalizeCategories(result.categories)
      }));
    } catch (error) {
      console.error(`Error fetching category results for student ${studentId}:`, error);
      return [];
    }
  }

  /**
   * Get the most recent category result for a specific category and student
   * @param {string|number} studentId - Student ID 
   * @param {string} categoryName - The category name to filter by
   * @returns {Promise<Object|null>} - The most recent category result or null
   */
  static async getCategoryResult(studentId, categoryName) {
    try {
      // Convert studentId to integer to ensure consistency
      const studentIdInt = parseInt(studentId);
      if (isNaN(studentIdInt)) {
        console.error(`Invalid studentId provided: ${studentId}`);
        return null;
      }

      console.log(`Fetching category results for student ID: ${studentIdInt} and category: ${categoryName}`);
      
      // Build query for Mongoose
      const query = {
        studentId: studentIdInt,
        'categories.categoryName': categoryName
      };
      
      console.log('Category result query:', JSON.stringify(query));
      
      // Use Mongoose model instead of direct collection access
      const result = await CategoryResult
        .findOne(query)
        .sort({ assessmentDate: -1, createdAt: -1 })
        .lean();
      
      if (!result) {
        console.log(`No category results found for category ${categoryName} and student ${studentIdInt}`);
        return null;
      }
      
      console.log(`Found category result ${result._id} for category ${categoryName} and student ${studentIdInt}`);
      
      // Find the specific category data and return formatted result
      const categoryData = result.categories.find(cat => cat.categoryName === categoryName);
      
      return {
        ...result,
        categories: this.normalizeCategories(result.categories),
        specificCategory: categoryData ? this.normalizeCategories([categoryData])[0] : null
      };
    } catch (error) {
      console.error(`Error fetching category results for student ${studentId} and category ${categoryName}:`, error);
      return null;
    }
  }

  /**
   * Create or update category results with automatic prescriptive analysis generation
   * This method ensures category results are properly created and prescriptive analysis is triggered
   * 
   * @param {Object} categoryResultData - Category result data
   * @returns {Promise<Object>} - Created/updated category result with analysis
   */
  static async createCategoryResult(categoryResultData) {
    try {
      console.log(`[CATEGORY RESULTS] Creating category result for student ${categoryResultData.studentId}`);

      // Validate required data
      if (!categoryResultData.studentId || !categoryResultData.categories) {
        throw new Error('Invalid category result data: studentId and categories are required');
      }

      // Ensure studentId is integer
      const studentIdInt = parseInt(categoryResultData.studentId);
      if (isNaN(studentIdInt)) {
        throw new Error(`Invalid studentId: ${categoryResultData.studentId}`);
      }

      // Normalize categories and calculate intervention requirements
      const normalizedCategories = this.normalizeCategories(categoryResultData.categories);
      
      // Calculate overall performance and intervention needs
      const overallStats = this.calculateOverallStats(normalizedCategories);

      // Create the category result document using Mongoose model
      const categoryResultDoc = new CategoryResult({
        studentId: studentIdInt,
        assessmentDate: categoryResultData.assessmentDate || new Date(),
        readingLevel: categoryResultData.readingLevel || 'Low Emerging',
        categories: normalizedCategories,
        overallScore: overallStats.overallScore,
        completedCategories: normalizedCategories.filter(cat => {
          // ✅ CONSISTENT COMPLETION LOGIC: Category is completed if main assessment passed (≥75%) OR any intervention was successful
          const mainAssessmentPassed = (cat.score || 0) >= 75;
          const hasSuccessfulIntervention = cat.interventionHistory && cat.interventionHistory.some(intervention => intervention.isPassed === true);
          const isCompleted = mainAssessmentPassed || hasSuccessfulIntervention;

          if (isCompleted) {
            console.log(`[CREATE] ✅ Counting ${cat.categoryName} as completed: ${mainAssessmentPassed ? 'MAIN PASSED' : 'INTERVENTION PASSED'} (${cat.score}%)`);
          }

          return isCompleted;
        }).length,
        totalCategories: normalizedCategories.length,
        allCategoriesPassed: overallStats.passedCategories === normalizedCategories.length,
        readingLevelUpdated: false
      });

      // Save using Mongoose model
      const savedResult = await categoryResultDoc.save();
      
      console.log(`[CATEGORY RESULTS] Successfully created category result ${savedResult._id}`);

      // Trigger prescriptive analysis generation
      try {
        console.log(`[CATEGORY RESULTS] Triggering prescriptive analysis for category result ${savedResult._id}`);

        const prescriptiveAnalysis = await IntegrationTriggerService.triggerPrescriptiveAnalysis(savedResult.toObject());

        if (prescriptiveAnalysis) {
          console.log(`[CATEGORY RESULTS] Successfully generated prescriptive analysis ${prescriptiveAnalysis._id}`);
          savedResult.prescriptiveAnalysisId = prescriptiveAnalysis._id;
        } else {
          console.warn(`[CATEGORY RESULTS] Prescriptive analysis generation returned null`);
        }
      } catch (analyticsError) {
        console.error('[CATEGORY RESULTS] Error generating prescriptive analysis:', analyticsError);
        // Don't fail the category result creation if analytics fails
      }

      // 🚀 AUTOMATIC READING LEVEL PROGRESSION CHECK
      // Check if student is now eligible for reading level progression after category completion
      try {
        console.log(`[CATEGORY RESULTS] 🔍 Checking reading level progression eligibility after category completion`);

        const progressionResult = await ReadingLevelProgressionService.checkAndProgressReadingLevel(
          savedResult.studentId,
          savedResult.readingLevel
        );

        if (progressionResult.success && progressionResult.progressionExecuted) {
          console.log(`[CATEGORY RESULTS] 🎉 AUTOMATIC PROGRESSION TRIGGERED: ${progressionResult.fromLevel} → ${progressionResult.toLevel}`);

          // Update the current category result to mark progression as completed
          savedResult.readingLevelUpdated = true;
          await savedResult.save();

          console.log(`[CATEGORY RESULTS] 📋 Updated current category result to mark progression completed`);
        } else if (progressionResult.success && !progressionResult.progressionNeeded) {
          console.log(`[CATEGORY RESULTS] ℹ️ No progression needed: ${progressionResult.reason}`);
        } else {
          console.warn(`[CATEGORY RESULTS] ⚠️ Progression check incomplete:`, progressionResult);
        }
      } catch (progressionError) {
        console.error('[CATEGORY RESULTS] ❌ Error in automatic reading level progression check:', progressionError);
        // Don't fail the category result creation if progression check fails
      }

      return savedResult.toObject();

    } catch (error) {
      console.error('[CATEGORY RESULTS] Error creating category result:', error);
      throw error;
    }
  }

  /**
   * Update existing category result and regenerate prescriptive analysis if needed
   * Also handles automatic reading level progression when all categories are passed
   *
   * @param {string} categoryResultId - Category result ID
   * @param {Object} updateData - Data to update
   * @returns {Promise<Object>} - Updated category result
   */
  static async updateCategoryResult(categoryResultId, updateData) {
    try {
      console.log(`[CATEGORY RESULTS] Updating category result ${categoryResultId}`);

      // Get existing category result using Mongoose
      const existingResult = await CategoryResult.findById(categoryResultId);

      if (!existingResult) {
        throw new Error('Category result not found');
      }

      // Update categories if provided
      if (updateData.categories) {
        updateData.categories = this.normalizeCategories(updateData.categories);

        // Recalculate overall stats
        const overallStats = this.calculateOverallStats(updateData.categories);
        updateData.overallScore = overallStats.overallScore;
        updateData.completedCategories = updateData.categories.filter(cat => {
          // ✅ CONSISTENT COMPLETION LOGIC: Category is completed if main assessment passed (≥75%) OR any intervention was successful
          const mainAssessmentPassed = (cat.score || 0) >= 75;
          const hasSuccessfulIntervention = cat.interventionHistory && cat.interventionHistory.some(intervention => intervention.isPassed === true);
          const isCompleted = mainAssessmentPassed || hasSuccessfulIntervention;

          if (isCompleted) {
            console.log(`[UPDATE] ✅ Counting ${cat.categoryName} as completed: ${mainAssessmentPassed ? 'MAIN PASSED' : 'INTERVENTION PASSED'} (${cat.score}%)`);
          }

          return isCompleted;
        }).length;
        updateData.totalCategories = updateData.categories.length;
        updateData.allCategoriesPassed = overallStats.passedCategories === updateData.categories.length;

        // 🚀 AUTOMATIC READING LEVEL PROGRESSION CHECK
        // Check for reading level progression using the comprehensive ReadingLevelProgressionService
        if (updateData.allCategoriesPassed && !existingResult.allCategoriesPassed) {
          console.log(`[CATEGORY RESULTS] ✅ Student ${existingResult.studentId} passed all categories for ${existingResult.readingLevel} - triggering progression check`);

          try {
            const progressionResult = await ReadingLevelProgressionService.checkAndProgressReadingLevel(
              existingResult.studentId,
              existingResult.readingLevel
            );

            if (progressionResult.success && progressionResult.progressionExecuted) {
              updateData.readingLevelUpdated = true;
              console.log(`[CATEGORY RESULTS] 🎉 READING LEVEL PROGRESSION SUCCESSFUL: ${progressionResult.fromLevel} → ${progressionResult.toLevel}`);
              console.log(`[CATEGORY RESULTS] 📋 User updated: ${progressionResult.userUpdated}, Categories updated: ${progressionResult.categoryResultsUpdated}`);
            } else if (progressionResult.success && !progressionResult.progressionNeeded) {
              console.log(`[CATEGORY RESULTS] ℹ️ No progression needed: ${progressionResult.reason}`);
            } else {
              console.warn(`[CATEGORY RESULTS] ⚠️ Progression check failed:`, progressionResult);
            }
          } catch (progressionError) {
            console.error('[CATEGORY RESULTS] ❌ Error in automatic reading level progression:', progressionError);
            // Don't fail the update if progression fails - continue with category results update
          }
        } else if (updateData.allCategoriesPassed) {
          console.log(`[CATEGORY RESULTS] ℹ️ All categories already passed - skipping duplicate progression check`);
        }
      }

      // Update the document using Mongoose
      const updatedResult = await CategoryResult.findByIdAndUpdate(
        categoryResultId,
        { $set: updateData },
        { new: true, runValidators: true }
      );

      if (!updatedResult) {
        throw new Error('Category result not found for update');
      }

      console.log(`[CATEGORY RESULTS] Successfully updated category result ${categoryResultId}`);

      // Regenerate prescriptive analysis if categories changed
      if (updateData.categories) {
        try {
          const prescriptiveAnalysis = await IntegrationTriggerService.triggerPrescriptiveAnalysis(updatedResult.toObject());
          if (prescriptiveAnalysis) {
            updatedResult.prescriptiveAnalysisId = prescriptiveAnalysis._id;
          }
        } catch (analyticsError) {
          console.error('[CATEGORY RESULTS] Error regenerating prescriptive analysis:', analyticsError);
        }
      }

      return updatedResult.toObject();

    } catch (error) {
      console.error('[CATEGORY RESULTS] Error updating category result:', error);
      throw error;
    }
  }

  /**
   * Generate category results from student responses
   * @param {number} studentId - Student ID
   * @param {string} category - Category name (optional, if not provided processes all categories)
   * @returns {Promise<Object>} Generated category results
   */
  /**
   * Validate completeness before creating category results
   * Ensures student answered ALL questions in the main assessment for each category
   * @param {number} studentId - Student ID
   * @param {string} readingLevel - Student's reading level
   * @param {string} category - Specific category (optional)
   * @returns {Promise<Object>} Validation result with completeness status
   */
  static async validateAssessmentCompleteness(studentId, readingLevel, category = null) {
    try {
      console.log(`[COMPLETENESS VALIDATION] Checking completeness for student ${studentId}, level ${readingLevel}`);

      const MainAssessment = require('../../models/Teachers/mainAssessmentModel');
      const StudentResponse = require('../../models/Teachers/ManageProgress/studentResponseModel');

      // Get main assessments for the reading level
      const query = { readingLevel, isActive: true };
      if (category) {
        query.category = category;
      }

      const mainAssessments = await MainAssessment.find(query);

      if (mainAssessments.length === 0) {
        console.warn(`[COMPLETENESS VALIDATION] No main assessments found for ${readingLevel}${category ? ` - ${category}` : ''}`);
        return {
          isComplete: false,
          reason: 'no_assessments_found',
          details: `No main assessments found for reading level ${readingLevel}${category ? ` in category ${category}` : ''}`
        };
      }

      const completenessResults = {};
      let overallComplete = true;

      for (const assessment of mainAssessments) {
        const categoryName = assessment.category;
        const totalQuestionsInAssessment = assessment.questions.length;

        console.log(`[COMPLETENESS VALIDATION] Checking ${categoryName}: ${totalQuestionsInAssessment} questions required`);

        // Get student responses for this category
        const studentResponses = await StudentResponse.find({
          studentId: parseInt(studentId),
          category: categoryName
        });

        const answeredQuestions = studentResponses.length;
        const isComplete = answeredQuestions >= totalQuestionsInAssessment;

        completenessResults[categoryName] = {
          required: totalQuestionsInAssessment,
          answered: answeredQuestions,
          isComplete,
          missing: Math.max(0, totalQuestionsInAssessment - answeredQuestions),
          assessmentId: assessment._id
        };

        if (!isComplete) {
          overallComplete = false;
          console.log(`[COMPLETENESS VALIDATION] ${categoryName} INCOMPLETE: ${answeredQuestions}/${totalQuestionsInAssessment} questions answered`);
        } else {
          console.log(`[COMPLETENESS VALIDATION] ${categoryName} COMPLETE: ${answeredQuestions}/${totalQuestionsInAssessment} questions answered`);
        }
      }

      return {
        isComplete: overallComplete,
        categoryResults: completenessResults,
        summary: {
          totalCategories: Object.keys(completenessResults).length,
          completeCategories: Object.values(completenessResults).filter(r => r.isComplete).length,
          incompleteCategories: Object.values(completenessResults).filter(r => !r.isComplete).length
        }
      };

    } catch (error) {
      console.error('[COMPLETENESS VALIDATION] Error validating completeness:', error);
      return {
        isComplete: false,
        reason: 'validation_error',
        error: error.message
      };
    }
  }

  /**
   * Validate intervention assessment completeness
   * @param {number} studentId - Student ID
   * @param {string} interventionAssessmentId - Intervention Assessment ID
   * @returns {Promise<Object>} Validation result
   */
  static async validateInterventionCompleteness(studentId, interventionAssessmentId) {
    try {
      console.log(`[INTERVENTION COMPLETENESS] 🔍 Checking completeness for student ${studentId}, intervention ${interventionAssessmentId}`);

      const InterventionAssessment = require('../../models/Teachers/ManageProgress/interventionAssessmentModel');
      const InterventionResponse = require('../../models/Teachers/ManageProgress/interventionResponseModel');

      // Get intervention assessment
      const intervention = await InterventionAssessment.findById(interventionAssessmentId);

      if (!intervention) {
        console.error(`[INTERVENTION COMPLETENESS] ❌ Intervention not found: ${interventionAssessmentId}`);
        return {
          isComplete: false,
          reason: 'intervention_not_found',
          details: `Intervention assessment ${interventionAssessmentId} not found`
        };
      }

      // ✅ FIX: Auto-detect the most recent COMPLETED revision instead of just using assessment.revisionNumber
      const currentRevision = await this.findMostRecentCompletedRevision(
        studentId,
        interventionAssessmentId,
        intervention
      );
      const totalQuestionsInIntervention = intervention.totalQuestions || intervention.questions.length;

      console.log(`[INTERVENTION COMPLETENESS] 📋 Intervention details: ${intervention.category}, Version: ${currentRevision}, Total Questions: ${totalQuestionsInIntervention}`);

      // Get student responses for this intervention
      const interventionResponses = await InterventionResponse.find({
        studentId: parseInt(studentId),
        interventionAssessmentId: interventionAssessmentId
      });

      console.log(`[INTERVENTION COMPLETENESS] 📝 Found ${interventionResponses.length} intervention responses`);

      // CRITICAL FIX: ALWAYS validate version-specific responses (including VERSION 1)
      console.log(`[INTERVENTION COMPLETENESS] 🔄 This is revision ${currentRevision} - validating version-specific responses`);

      // Check if responses include revisionNumber tracking
      const versionAwareResponses = interventionResponses.filter(response => {
        // CRITICAL: revisionNumber is now STRICTLY REQUIRED for ALL responses
        if (response.revisionNumber) {
          const matches = response.revisionNumber === currentRevision;
          if (!matches) {
            console.warn(`[INTERVENTION COMPLETENESS] ⚠️ Response ${response._id} has revisionNumber ${response.revisionNumber}, expected ${currentRevision}`);
          }
          return matches;
        }

        // NO LEGACY SUPPORT: ALL responses must have revisionNumber
        console.error(`[INTERVENTION COMPLETENESS] ❌ Response ${response._id} missing revisionNumber - STRICT VALIDATION FAILED`);
        return false;
      });

      console.log(`[INTERVENTION COMPLETENESS] 📊 Version-aware responses: ${versionAwareResponses.length}/${interventionResponses.length} match revision ${currentRevision}`);

      // CRITICAL: Check for mixed version responses (data integrity issue)
      const responsesWithoutRevision = interventionResponses.filter(r => !r.revisionNumber);
      const responsesWithRevision = interventionResponses.filter(r => r.revisionNumber);

      if (responsesWithoutRevision.length > 0 && responsesWithRevision.length > 0) {
        console.error(`[INTERVENTION COMPLETENESS] ❌ MIXED DATA DETECTED: ${responsesWithoutRevision.length} responses lack revisionNumber, ${responsesWithRevision.length} have revisionNumber`);
        console.error(`[INTERVENTION COMPLETENESS] ❌ This indicates incomplete migration - BLOCKING intervention_results creation`);

        return {
          isComplete: false,
          category: intervention.category,
          revisionNumber: currentRevision,
          required: totalQuestionsInIntervention,
          answered: interventionResponses.length,
          missing: totalQuestionsInIntervention - versionAwareResponses.length,
          interventionId: interventionAssessmentId,
          reason: 'mixed_version_data',
          details: `Data integrity issue: ${responsesWithoutRevision.length} responses missing revisionNumber. Run migration script to fix existing data.`,
          responsesWithoutRevision: responsesWithoutRevision.map(r => ({ _id: r._id, questionId: r.questionId })),
          responsesWithRevision: responsesWithRevision.map(r => ({ _id: r._id, questionId: r.questionId, revisionNumber: r.revisionNumber }))
        };
      }

      // Validate all expected questions are answered for current revision
      const expectedQuestionIds = intervention.questions.map(q => q.questionId);
      const answeredQuestionIds = versionAwareResponses.map(r => r.questionId);

      console.log(`[INTERVENTION COMPLETENESS] 🎯 Expected questions: [${expectedQuestionIds.join(', ')}]`);
      console.log(`[INTERVENTION COMPLETENESS] ✅ Answered questions: [${answeredQuestionIds.join(', ')}]`);

      // CRITICAL FIX: Check for duplicate responses to same question
      const duplicateQuestions = answeredQuestionIds.filter((qId, index) =>
        answeredQuestionIds.indexOf(qId) !== index
      );

      if (duplicateQuestions.length > 0) {
        console.error(`[INTERVENTION COMPLETENESS] ❌ DUPLICATE RESPONSES DETECTED for revision ${currentRevision}: [${duplicateQuestions.join(', ')}]`);
        return {
          isComplete: false,
          category: intervention.category,
          revisionNumber: currentRevision,
          required: totalQuestionsInIntervention,
          answered: versionAwareResponses.length,
          duplicateQuestions: duplicateQuestions,
          interventionId: interventionAssessmentId,
          reason: 'duplicate_responses',
          details: `Revision ${currentRevision} has duplicate responses for questions: ${duplicateQuestions.join(', ')}. Each question should be answered exactly once.`
        };
      }

      // CRITICAL FIX: Check for extra responses (questions not in assessment)
      const extraQuestions = answeredQuestionIds.filter(qId => !expectedQuestionIds.includes(qId));

      if (extraQuestions.length > 0) {
        console.error(`[INTERVENTION COMPLETENESS] ❌ EXTRA RESPONSES DETECTED for revision ${currentRevision}: [${extraQuestions.join(', ')}]`);
        return {
          isComplete: false,
          category: intervention.category,
          revisionNumber: currentRevision,
          required: totalQuestionsInIntervention,
          answered: versionAwareResponses.length,
          extraQuestions: extraQuestions,
          interventionId: interventionAssessmentId,
          reason: 'extra_responses',
          details: `Revision ${currentRevision} has ${extraQuestions.length} extra responses for questions not in assessment: ${extraQuestions.join(', ')}. Remove these responses.`
        };
      }

      const missingQuestions = expectedQuestionIds.filter(qId => !answeredQuestionIds.includes(qId));

      if (missingQuestions.length > 0) {
        console.warn(`[INTERVENTION COMPLETENESS] ⚠️ Missing responses for revision ${currentRevision}: [${missingQuestions.join(', ')}]`);
        return {
          isComplete: false,
          category: intervention.category,
          revisionNumber: currentRevision,
          required: totalQuestionsInIntervention,
          answered: versionAwareResponses.length,
          missing: missingQuestions.length,
          missingQuestions: missingQuestions,
          interventionId: interventionAssessmentId,
          reason: 'incomplete_revision',
          details: `Revision ${currentRevision} incomplete: missing responses for questions ${missingQuestions.join(', ')}`
        };
      }

      // CRITICAL FIX: EXACT COUNT VALIDATION - Must be exactly the right number, not "at least"
      const validAnsweredQuestions = versionAwareResponses.length;
      const isComplete = validAnsweredQuestions === totalQuestionsInIntervention; // Changed from >= to ===

      // Enhanced logging for revision tracking (ALL VERSIONS)
      console.log(`[INTERVENTION COMPLETENESS] ✅ REVISION ${currentRevision} COMPLETENESS CHECK:`);
      console.log(`[INTERVENTION COMPLETENESS] - Total questions required: ${totalQuestionsInIntervention}`);
      console.log(`[INTERVENTION COMPLETENESS] - Raw responses received: ${interventionResponses.length}`);
      console.log(`[INTERVENTION COMPLETENESS] - Version-valid responses: ${validAnsweredQuestions}`);
      console.log(`[INTERVENTION COMPLETENESS] - Status: ${isComplete ? 'COMPLETE' : 'INCOMPLETE'}`);
      console.log(`[INTERVENTION COMPLETENESS] - Ready for intervention_results generation: ${isComplete ? 'YES' : 'NO'}`);

      return {
        isComplete,
        category: intervention.category,
        revisionNumber: currentRevision,
        required: totalQuestionsInIntervention,
        answered: validAnsweredQuestions, // Use version-aware count
        missing: Math.max(0, totalQuestionsInIntervention - validAnsweredQuestions),
        interventionId: interventionAssessmentId,
        validationDetails: {
          isRevision: currentRevision > 1,
          versionValidated: true, // Always validate version now
          readyForResults: isComplete,
          totalRawResponses: interventionResponses.length,
          versionValidResponses: validAnsweredQuestions
        }
      };

    } catch (error) {
      console.error('[INTERVENTION COMPLETENESS] ❌ Error validating intervention completeness:', error);
      return {
        isComplete: false,
        reason: 'validation_error',
        error: error.message,
        interventionId: interventionAssessmentId
      };
    }
  }

  static async generateCategoryResultsFromResponses(studentId, category = null) {
    try {
      console.log(`[CATEGORY RESULTS] Generating category results from responses for student ${studentId}`);

      // Get student data to determine reading level
      let student = await User.findOne({ idNumber: parseInt(studentId) });
      let readingLevel = 'High Emerging'; // Default based on your data

      if (student) {
        readingLevel = student.readingLevel || 'High Emerging';
        console.log(`[CATEGORY RESULTS] Found student ${studentId} with reading level: ${readingLevel}`);
      } else {
        // Try to infer reading level from responses
        console.log(`[CATEGORY RESULTS] Student ${studentId} not found in users collection, checking responses for reading level`);

        const StudentResponse = require('../../models/Teachers/ManageProgress/studentResponseModel');
        const sampleResponse = await StudentResponse.findOne({ studentId: parseInt(studentId) });

        if (sampleResponse && sampleResponse.readingLevel) {
          readingLevel = sampleResponse.readingLevel;
          console.log(`[CATEGORY RESULTS] Inferred reading level from responses: ${readingLevel}`);
        } else {
          console.log(`[CATEGORY RESULTS] Using default reading level: ${readingLevel}`);
        }
      }

      // CATEGORY-BY-CATEGORY APPROACH (CLAUDE.md): Process only complete categories, create placeholders for others
      console.log(`[CATEGORY RESULTS] ✅ USING CATEGORY-BY-CATEGORY PROCESSING (CLAUDE.md APPROACH)`);

      // Get all categories for this reading level
      const allCategoriesForLevel = this.getCategoriesForReadingLevel(readingLevel);
      console.log(`[CATEGORY RESULTS] Required categories for ${readingLevel}: [${allCategoriesForLevel.join(', ')}]`);

      // Check completeness for each category individually
      const categoryCompleteness = {};
      for (const cat of allCategoriesForLevel) {
        const catValidation = await this.validateAssessmentCompleteness(studentId, readingLevel, cat);
        categoryCompleteness[cat] = catValidation.categoryResults[cat] || { isComplete: false, answered: 0, required: 0 };
        console.log(`[CATEGORY RESULTS] ${cat}: ${categoryCompleteness[cat].isComplete ? 'COMPLETE' : 'INCOMPLETE'} (${categoryCompleteness[cat].answered}/${categoryCompleteness[cat].required})`);
      }

      console.log(`[CATEGORY RESULTS] ✅ PROCEEDING WITH CATEGORY-BY-CATEGORY RECORD CREATION`);

      // Get student responses FILTERED BY READING LEVEL
      const StudentResponse = require('../../models/Teachers/ManageProgress/studentResponseModel');
      const query = {
        studentId: parseInt(studentId),
        readingLevel: readingLevel  // ✅ CRITICAL FIX: Only get responses for current reading level
      };
      if (category) {
        query.category = category;
      }

      const responses = await StudentResponse.find(query)
        .sort({ answeredAt: 1 })
        .lean();

      console.log(`[CATEGORY RESULTS] Found ${responses.length} responses for student ${studentId} at reading level ${readingLevel}`);

      // DEBUG: Log what categories we actually found
      const foundCategories = [...new Set(responses.map(r => r.category))];
      console.log(`[CATEGORY RESULTS] 🔍 DEBUG: Found responses for categories: [${foundCategories.join(', ')}]`);

      // DEBUG: Check specifically for PA responses
      const paResponses = responses.filter(r => r.category === 'Phonological Awareness');
      console.log(`[CATEGORY RESULTS] 🔍 DEBUG: Phonological Awareness responses: ${paResponses.length}`);
      if (paResponses.length > 0) {
        console.log(`[CATEGORY RESULTS] 🔍 DEBUG: PA questionIds: [${paResponses.map(r => r.questionId).join(', ')}]`);
      }

      // DEBUG: Log the query being used
      console.log(`[CATEGORY RESULTS] 🔍 DEBUG: Query used:`, JSON.stringify(query));

      // Group responses by category
      const responsesByCategory = {};
      responses.forEach(response => {
        const cat = response.category;
        if (!responsesByCategory[cat]) {
          responsesByCategory[cat] = [];
        }
        responsesByCategory[cat].push(response);
      });

      // Process each category using completeness validation (CLAUDE.md: category-by-category)
      const categories = [];

      for (const categoryName of allCategoriesForLevel) {
        const categoryResponses = responsesByCategory[categoryName] || [];
        const isComplete = categoryCompleteness[categoryName]?.isComplete || false;

        // CRITICAL FIX: If processing specific category and this isn't it, skip placeholder creation
        if (category && category !== categoryName) {
          console.log(`[CATEGORY RESULTS] ⏭️  Skipping ${categoryName} (processing specific category: ${category})`);
          continue;
        }

        if (categoryResponses.length === 0) {
          // Category has no responses - create placeholder entry ONLY if processing all categories
          if (!category) {
            console.log(`[CATEGORY RESULTS] Creating placeholder for ${categoryName} (no responses yet)`);
            // AUTO-FIX: Get correct total questions for placeholder
            const correctTotalQuestions = await this.getCorrectTotalQuestions(categoryName, readingLevel);
            const totalQuestions = correctTotalQuestions > 0 ? correctTotalQuestions : (categoryCompleteness[categoryName]?.required || 0);
            
            categories.push({
              categoryName: categoryName,
              totalQuestions: totalQuestions,
              correctAnswers: 0,
              totalPossibleMatches: 0,
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
            });
          } else {
            console.log(`[CATEGORY RESULTS] ⏭️  Skipping placeholder for ${categoryName} (specific category processing)`);
          }
          continue;
        }
        console.log(`[CATEGORY RESULTS] Processing ${categoryResponses.length} responses for ${categoryName}`);

        // Calculate scores - AUTO-FIX: Get correct total questions from main assessment
        const correctTotalQuestions = await this.getCorrectTotalQuestions(categoryName, readingLevel);
        let totalQuestions = correctTotalQuestions > 0 ? correctTotalQuestions : categoryResponses.length;
        let correctAnswers = 0;
        let totalMatches = 0;
        let correctMatches = 0;
        
        console.log(`[AUTO-FIX] ${categoryName}: Using ${totalQuestions} total questions (${correctTotalQuestions} from main assessment, ${categoryResponses.length} responses)`);

        // Handle different question types
        if (categoryName === 'Phonological Awareness') {
          // For PA, count total matches and correct matches
          categoryResponses.forEach(response => {
            if (response.totalMatches) {
              totalMatches += response.totalMatches;
              correctMatches += response.correctMatches || 0;
            } else {
              // Fallback for older data structure
              totalQuestions++;
              if (response.isCorrect) correctAnswers++;
            }
          });

          if (totalMatches > 0) {
            const score = Math.round((correctMatches / totalMatches) * 100);
            categories.push({
              categoryName: categoryName,
              totalQuestions: categoryResponses.length,
              totalPossibleMatches: totalMatches,
              correctMatches: correctMatches,
              score: score,
              isPassed: score >= 75,
              isCompleted: isComplete, // ✅ FIX: Use actual completeness status
              interventionRequired: score < 75,
              responseDetails: categoryResponses.map(r => {
                // ✅ FIX: Recalculate isCorrect for Phonological Awareness based on matches
                let isCorrect = r.isCorrect;
                if (r.totalMatches !== undefined && r.correctMatches !== undefined) {
                  const matchPercentage = r.totalMatches > 0 ? 
                    (r.correctMatches / r.totalMatches) * 100 : 0;
                  isCorrect = matchPercentage === 100; // Only correct if ALL matches are correct
                }
                
                return {
                  questionId: r.questionId,
                  isCorrect: isCorrect,
                  totalMatches: r.totalMatches || 0,
                  correctMatches: r.correctMatches || 0,
                  answeredAt: r.answeredAt
                };
              })
            });
          } else {
            // Fallback calculation
            const score = Math.round((correctAnswers / totalQuestions) * 100);
            categories.push({
              categoryName: categoryName,
              totalQuestions: totalQuestions,
              correctAnswers: correctAnswers,
              score: score,
              isPassed: score >= 75,
              isCompleted: isComplete, // ✅ FIX: Use actual completeness status
              interventionRequired: score < 75,
              responseDetails: categoryResponses.map(r => {
                // ✅ FIX: Recalculate isCorrect for Phonological Awareness based on matches
                let isCorrect = r.isCorrect;
                if (r.totalMatches !== undefined && r.correctMatches !== undefined) {
                  const matchPercentage = r.totalMatches > 0 ? 
                    (r.correctMatches / r.totalMatches) * 100 : 0;
                  isCorrect = matchPercentage === 100; // Only correct if ALL matches are correct
                }
                
                return {
                  questionId: r.questionId,
                  isCorrect: isCorrect,
                  totalMatches: r.totalMatches || 0,
                  correctMatches: r.correctMatches || 0,
                  answeredAt: r.answeredAt
                };
              })
            });
          }
        } else {
          // For other categories, count correct answers
          categoryResponses.forEach(response => {
            if (response.isCorrect) {
              correctAnswers++;
            }
          });

          const score = Math.round((correctAnswers / totalQuestions) * 100);
          categories.push({
            categoryName: categoryName,
            totalQuestions: totalQuestions,
            correctAnswers: correctAnswers,
            score: score,
            isPassed: score >= 75,
            isCompleted: true,
            interventionRequired: score < 75,
            responseDetails: categoryResponses.map(r => ({
              questionId: r.questionId,
              isCorrect: r.isCorrect,
              answeredAt: r.answeredAt
            }))
          });
        }
      }

      // Create category result document
      const categoryResultData = {
        studentId: parseInt(studentId),
        assessmentDate: new Date(),
        readingLevel: readingLevel,
        categories: categories
      };

      // Check for existing category results to prevent duplicates
      console.log(`[CATEGORY RESULTS] 🔍 CHECKING FOR EXISTING RECORDS`);
      const existingResults = await this.getCategoryResults(parseInt(studentId));

      if (existingResults && existingResults.length > 0) {
        console.log(`[CATEGORY RESULTS] ⚠️  EXISTING RECORDS FOUND - CHECKING IF MODIFICATION IS ALLOWED`);
        console.log(`[CATEGORY RESULTS] 📊 Found ${existingResults.length} existing records for student ${studentId}`);

        // 🎯 SMART RECORD SELECTION: Find record that matches current reading level
        const currentLevelRecord = existingResults.find(result => result.readingLevel === readingLevel);
        const hasHistoricalRecords = existingResults.some(result => result.readingLevel !== readingLevel);

        if (hasHistoricalRecords) {
          const historicalLevels = existingResults
            .filter(result => result.readingLevel !== readingLevel)
            .map(result => result.readingLevel);
          console.log(`[CATEGORY RESULTS] 📚 Historical records detected for levels: [${historicalLevels.join(', ')}]`);
          console.log(`[CATEGORY RESULTS] 🚫 HISTORICAL PROTECTION: These records will not be modified`);
        }

        if (!currentLevelRecord) {
          console.log(`[CATEGORY RESULTS] ❌ NO CURRENT LEVEL RECORD - Found historical records but none for ${readingLevel}`);
          console.log(`[CATEGORY RESULTS] ➕ Creating new record for current level: ${readingLevel}`);
          // Fall through to create new record
        } else {
          console.log(`[CATEGORY RESULTS] ✅ CURRENT LEVEL RECORD FOUND - Checking modification permissions`);
          const existingResult = currentLevelRecord;

          // ✅ CRITICAL VALIDATION: Check if this is a completed historical record
          if (existingResult.readingLevelUpdated === true) {
            console.log(`[CATEGORY RESULTS] 🚫 HISTORICAL RECORD DETECTED - Cannot modify completed record with readingLevelUpdated=true`);
            console.log(`[CATEGORY RESULTS] 📚 Historical record: ${existingResult.readingLevel} level, completed on ${existingResult.updatedAt}`);
            console.log(`[CATEGORY RESULTS] ✅ Skipping modification - historical record must remain intact`);
            return existingResult; // Return the historical record without modification
          }

          // ✅ PROGRESSION PROTECTION: Check if progression is completed
          if (existingResult.allCategoriesPassed === true) {
            console.log(`[CATEGORY RESULTS] 🚫 PROGRESSION COMPLETED - Cannot modify record with allCategoriesPassed=true`);
            console.log(`[CATEGORY RESULTS] ✅ This record has completed its level progression - skipping modification`);
            return existingResult; // Return the completed record without modification
          }

          // ✅ CRITICAL VALIDATION: Double-check reading levels match
          if (existingResult.readingLevel !== readingLevel) {
            console.log(`[CATEGORY RESULTS] 🚫 READING LEVEL MISMATCH - Record level: ${existingResult.readingLevel}, Current level: ${readingLevel}`);
            console.log(`[CATEGORY RESULTS] ✅ This indicates a progression occurred - old record should not be modified`);
            return existingResult; // Return the existing record without modification
          }

          console.log(`[CATEGORY RESULTS] ✅ VALIDATION PASSED - Safe to modify current level record`);

          // 🎯 SAFE TO MODIFY: Detect and repair incomplete existing records (only for current level)
        const requiredCategories = this.getCategoriesForReadingLevel(readingLevel);
        const existingCategoryNames = existingResult.categories.map(c => c.categoryName);
        const missingCategories = requiredCategories.filter(cat => !existingCategoryNames.includes(cat));

        if (missingCategories.length > 0) {
          console.log(`[CATEGORY RESULTS] 🔧 INCOMPLETE RECORD DETECTED: Missing ${missingCategories.length} categories for ${readingLevel} level`);
          console.log(`[CATEGORY RESULTS] 🔧 Missing categories: [${missingCategories.join(', ')}]`);

          // Add missing categories as placeholders
          for (const missingCategory of missingCategories) {
            console.log(`[CATEGORY RESULTS] ➕ Adding missing placeholder for ${missingCategory}`);

            // Get correct total questions for placeholder
            const correctTotalQuestions = await this.getCorrectTotalQuestions(missingCategory, readingLevel);
            const totalQuestions = correctTotalQuestions > 0 ? correctTotalQuestions : 0;

            existingResult.categories.push({
              categoryName: missingCategory,
              totalQuestions: totalQuestions,
              correctAnswers: 0,
              totalPossibleMatches: 0,
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
            });
          }

          // Update the existing record with complete categories
          await this.updateCategoryResult(existingResult._id, {
            categories: existingResult.categories
          });

          console.log(`[CATEGORY RESULTS] ✅ REPAIRED INCOMPLETE RECORD: Added ${missingCategories.length} missing categories`);
          console.log(`[CATEGORY RESULTS] ✅ Complete category set: ${existingResult.categories.map(c => c.categoryName).join(', ')}`);
        }

        // CRITICAL FIX: Preserve existing intervention data when updating from responses
        const currentResult = existingResults[0]; // Get the first (most recent) record

        // CRITICAL FIX: Handle category-specific updates vs full updates
        let mergedCategories;

        if (category) {
          // Category-specific update: Only update the specific category, preserve all others
          console.log(`[CATEGORY RESULTS] 🔄 Category-specific update for: ${category}`);

          mergedCategories = currentResult.categories.map(existingCategory => {
            if (existingCategory.categoryName === category) {
              // This is the category being updated
              const newCategory = categories.find(cat => cat.categoryName === category);
              if (newCategory) {
                console.log(`[CATEGORY RESULTS] 🔄 Updating ${category} with new response data`);

                // Preserve intervention data and merge with new assessment data
                return {
                  ...newCategory,
                  // Preserve intervention tracking
                  interventionAttempts: existingCategory.interventionAttempts || 0,
                  interventionCompleted: existingCategory.interventionCompleted || false,
                  currentInterventionId: existingCategory.currentInterventionId || null,
                  interventionHistory: existingCategory.interventionHistory || [],
                  // Use intervention status if intervention was completed successfully
                  isPassed: existingCategory.interventionCompleted && existingCategory.isPassed ? true : newCategory.isPassed,
                  score: existingCategory.interventionCompleted && existingCategory.isPassed ?
                         Math.max(newCategory.score, existingCategory.score) : newCategory.score,
                  interventionRequired: existingCategory.interventionCompleted && existingCategory.isPassed ? false : newCategory.interventionRequired
                };
              }
            }

            // For all other categories, preserve existing data completely
            console.log(`[CATEGORY RESULTS] ✅ Preserving existing data for ${existingCategory.categoryName}`);
            return existingCategory;
          });
        } else {
          // Full update: Process all categories as before
          mergedCategories = categories.map(newCategory => {
            const existingCategory = currentResult.categories.find(cat => cat.categoryName === newCategory.categoryName);

            if (existingCategory && existingCategory.interventionHistory && existingCategory.interventionHistory.length > 0) {
              console.log(`[CATEGORY RESULTS] 🔄 Preserving intervention data for ${newCategory.categoryName}: ${existingCategory.interventionHistory.length} attempts, isPassed: ${existingCategory.isPassed}`);

              // Preserve intervention data and use higher score between original assessment and intervention
              return {
                ...newCategory,
                // Preserve intervention tracking
                interventionAttempts: existingCategory.interventionAttempts || 0,
                interventionCompleted: existingCategory.interventionCompleted || false,
                currentInterventionId: existingCategory.currentInterventionId || null,
                interventionHistory: existingCategory.interventionHistory || [],
                // Use intervention status if intervention was completed successfully
                isPassed: existingCategory.interventionCompleted && existingCategory.isPassed ? true : newCategory.isPassed,
                score: existingCategory.interventionCompleted && existingCategory.isPassed ?
                       Math.max(newCategory.score, existingCategory.score) : newCategory.score,
                interventionRequired: existingCategory.interventionCompleted && existingCategory.isPassed ? false : newCategory.interventionRequired
              };
            } else {
              // No intervention data to preserve
              console.log(`[CATEGORY RESULTS] ➡️  No intervention data to preserve for ${newCategory.categoryName}`);
              return newCategory;
            }
          });
        }

        const updatedResult = await this.updateCategoryResult(currentResult._id, {
          categories: mergedCategories,
          assessmentDate: new Date()
        });

        console.log(`[CATEGORY RESULTS] ✅ Successfully UPDATED existing category results with intervention preservation for student ${studentId}`);
        console.log(`[CATEGORY RESULTS] Record ID: ${updatedResult._id}`);
        console.log(`[CATEGORY RESULTS] Categories: ${updatedResult.categories.map(c => `${c.categoryName} (${c.totalQuestions}Q, ${c.interventionHistory?.length || 0} interventions)`).join(', ')}`);

        return updatedResult;
        }
      }

      // No existing record found - create new one
      console.log(`[CATEGORY RESULTS] 🔒 NO EXISTING RECORD - CREATING NEW NORMALIZED RECORD`);

      // 🎯 CRITICAL FIX: When creating NEW record, ensure ALL required categories for reading level are present
      if (category) {
        console.log(`[CATEGORY RESULTS] 🔧 FIRST-TIME CREATION: Adding missing categories for ${readingLevel} level`);

        // Get all required categories for this reading level
        const requiredCategories = this.getCategoriesForReadingLevel(readingLevel);
        const existingCategoryNames = categories.map(c => c.categoryName);

        // Create placeholders for missing categories
        for (const requiredCategory of requiredCategories) {
          if (!existingCategoryNames.includes(requiredCategory)) {
            console.log(`[CATEGORY RESULTS] ➕ Adding placeholder for ${requiredCategory}`);

            // Get correct total questions for placeholder
            const correctTotalQuestions = await this.getCorrectTotalQuestions(requiredCategory, readingLevel);
            const totalQuestions = correctTotalQuestions > 0 ? correctTotalQuestions : 0;

            categories.push({
              categoryName: requiredCategory,
              totalQuestions: totalQuestions,
              correctAnswers: 0,
              totalPossibleMatches: 0,
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
            });
          }
        }

        // Update categoryResultData with complete categories list
        categoryResultData.categories = categories;
        console.log(`[CATEGORY RESULTS] ✅ Complete category set created: ${categories.map(c => c.categoryName).join(', ')}`);
      }

      const createdResult = await this.createCategoryResult(categoryResultData);

      console.log(`[CATEGORY RESULTS] ✅ Successfully generated COMPLETE category results for student ${studentId}`);
      console.log(`[CATEGORY RESULTS] Record ID: ${createdResult._id}`);
      console.log(`[CATEGORY RESULTS] Categories: ${createdResult.categories.map(c => `${c.categoryName} (${c.totalQuestions}Q)`).join(', ')}`);

      return createdResult;

    } catch (error) {
      console.error(`[CATEGORY RESULTS] Error generating category results from responses:`, error);
      throw error;
    }
  }

  /**
   * Delete category result and associated prescriptive analysis
   * 
   * @param {string} categoryResultId - Category result ID to delete
   * @returns {Promise<Object>} - Deletion result
   */
  static async deleteCategoryResult(categoryResultId) {
    try {
      console.log(`[CATEGORY RESULTS] Deleting category result ${categoryResultId}`);

      // Get existing category result using Mongoose
      const existingResult = await CategoryResult.findById(categoryResultId);

      if (!existingResult) {
        throw new Error('Category result not found');
      }

      // Import PrescriptiveAnalysis model for cleanup
      const PrescriptiveAnalysis = require('../../models/Teachers/ManageProgress/prescriptiveAnalysisModel');

      // Delete associated prescriptive analysis if exists
      if (existingResult.prescriptiveAnalysisId) {
        try {
          await PrescriptiveAnalysis.findByIdAndDelete(existingResult.prescriptiveAnalysisId);
          console.log(`[CATEGORY RESULTS] Deleted associated prescriptive analysis ${existingResult.prescriptiveAnalysisId}`);
        } catch (analyticsError) {
          console.warn('[CATEGORY RESULTS] Error deleting prescriptive analysis:', analyticsError);
          // Continue with category result deletion
        }
      }

      // Delete prescriptive analysis by student reference if no direct link
      try {
        const deletedAnalyses = await PrescriptiveAnalysis.deleteMany({
          studentId: existingResult.studentId,
          assessmentDate: existingResult.assessmentDate
        });
        console.log(`[CATEGORY RESULTS] Cleaned up ${deletedAnalyses.deletedCount} prescriptive analyses for student ${existingResult.studentId}`);
      } catch (cleanupError) {
        console.warn('[CATEGORY RESULTS] Error during prescriptive analysis cleanup:', cleanupError);
      }

      // Delete the category result using Mongoose
      const deleteResult = await CategoryResult.findByIdAndDelete(categoryResultId);

      if (!deleteResult) {
        throw new Error('Failed to delete category result');
      }

      console.log(`[CATEGORY RESULTS] Successfully deleted category result ${categoryResultId}`);

      return {
        success: true,
        deletedId: categoryResultId,
        studentId: existingResult.studentId,
        deletedCount: 1
      };

    } catch (error) {
      console.error('[CATEGORY RESULTS] Error deleting category result:', error);
      throw error;
    }
  }

  /**
   * ✅ FIX EXISTING OVERALL SCORES: Update records with incorrect overall scores
   * This specifically fixes records that have intervention successes but wrong overall scores
   */
  static async fixExistingOverallScores() {
    try {
      console.log('[OVERALL SCORE FIX] 🔧 Fixing existing records with incorrect overall scores...');

      // Find all category results that might have incorrect overall scores
      const allCategoryResults = await CategoryResult.find({});
      let fixedCount = 0;
      let checkedCount = 0;

      for (const categoryResult of allCategoryResults) {
        checkedCount++;
        const studentId = categoryResult.studentId;

        // Calculate what the overall score SHOULD be using our new logic
        const correctStats = this.calculateOverallStats(categoryResult.categories);
        const currentScore = categoryResult.overallScore || 0;
        const correctScore = correctStats.overallScore;

        if (Math.abs(currentScore - correctScore) > 1) { // Allow 1% rounding difference
          console.log(`[OVERALL SCORE FIX] Student ${studentId}: Current ${currentScore}% → Correct ${correctScore}%`);

          // Update the record with correct overall score
          categoryResult.overallScore = correctScore;
          categoryResult.completedCategories = correctStats.passedCategories;
          categoryResult.allCategoriesPassed = correctStats.passedCategories === categoryResult.categories.length;
          categoryResult.updatedAt = new Date();

          await categoryResult.save();
          fixedCount++;

          console.log(`[OVERALL SCORE FIX] ✅ Fixed student ${studentId}: ${currentScore}% → ${correctScore}%`);
        }
      }

      console.log(`[OVERALL SCORE FIX] ✅ Complete: ${fixedCount} fixed, ${checkedCount - fixedCount} already correct`);
      return { fixedCount, checkedCount };

    } catch (error) {
      console.error('[OVERALL SCORE FIX] ❌ Error fixing overall scores:', error);
      throw error;
    }
  }

  /**
   * 🔧 FORCE FIX: Manually update specific student's overall score
   * This method forces a direct MongoDB update to bypass any save issues
   */
  static async forceFixStudentOverallScore(studentId) {
    try {
      console.log(`[FORCE FIX] 🔧 Force fixing overall score for student ${studentId}...`);

      // Get the student's category result
      const categoryResult = await CategoryResult.findOne({ studentId: studentId });
      if (!categoryResult) {
        console.log(`[FORCE FIX] ❌ No category result found for student ${studentId}`);
        return { success: false, error: 'No category result found' };
      }

      console.log(`[FORCE FIX] 📊 Current overall score: ${categoryResult.overallScore || 0}%`);

      // Calculate correct score using our working logic
      const correctStats = this.calculateOverallStats(categoryResult.categories);
      const correctScore = correctStats.overallScore;

      console.log(`[FORCE FIX] 📊 Calculated correct score: ${correctScore}%`);

      // 🔧 PRESERVE ORIGINAL isPassed VALUES - Do not update category isPassed flags
      const updatedCategories = categoryResult.categories.map(cat => {
        // Keep original isPassed value - do not modify based on intervention success
        console.log(`[FORCE FIX] 🔒 Preserving original isPassed for ${cat.categoryName}: ${cat.isPassed}`);
        
        return {
          ...cat
          // isPassed field is preserved as-is, no changes made
        };
      });

      // Force update using direct MongoDB updateOne (bypasses Mongoose middleware)
      const updateResult = await CategoryResult.updateOne(
        { studentId: studentId },
        {
          $set: {
            categories: updatedCategories,
            overallScore: correctScore,
            completedCategories: correctStats.passedCategories,
            allCategoriesPassed: correctStats.passedCategories === categoryResult.categories.length,
            updatedAt: new Date()
          }
        }
      );

      console.log(`[FORCE FIX] 📊 MongoDB updateOne result:`, updateResult);

      // Verify the update worked
      const verifyResult = await CategoryResult.findOne({ studentId: studentId });
      const actualScore = verifyResult?.overallScore || 0;

      console.log(`[FORCE FIX] ✅ Verification: Overall score is now ${actualScore}%`);

      if (actualScore === correctScore) {
        console.log(`[FORCE FIX] ✅ SUCCESS: Student ${studentId} overall score fixed: ${actualScore}%`);
        return { success: true, oldScore: categoryResult.overallScore, newScore: actualScore };
      } else {
        console.log(`[FORCE FIX] ❌ FAILED: Score not updated correctly`);
        return { success: false, error: 'Score not updated correctly' };
      }

    } catch (error) {
      console.error(`[FORCE FIX] ❌ Error force fixing student ${studentId}:`, error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Calculate overall statistics using simple average with intervention scores
   * ✅ FIX: Uses intervention scores when intervention passed
   *
   * @param {Array} categories - Array of category data
   * @returns {Object} - Overall statistics
   */
  static calculateOverallStats(categories) {
    if (!categories || categories.length === 0) {
      return {
        overallScore: 0,
        passedCategories: 0,
        failedCategories: 0,
        interventionRequired: false
      };
    }

    // ✅ DYNAMIC FIX: Categories are "effectively completed" if they pass main assessment (≥75%) OR successful intervention
    const effectivelyCompletedCategories = categories.filter(cat => {
      const mainAssessmentPassed = (cat.score || 0) >= 75; // Direct score check for main assessment
      const hasSuccessfulIntervention = cat.interventionHistory && cat.interventionHistory.some(intervention => intervention.isPassed === true);
      const isCompleted = mainAssessmentPassed || hasSuccessfulIntervention;

      // Debug logging for completion detection
      if (isCompleted) {
        console.log(`[COMPLETION DETECTION] ✅ ${cat.categoryName}: ${mainAssessmentPassed ? 'PASSED MAIN' : 'PASSED INTERVENTION'} (score: ${cat.score}%)`);
      } else {
        console.log(`[COMPLETION DETECTION] ❌ ${cat.categoryName}: INCOMPLETE (score: ${cat.score}%, interventions: ${cat.interventionHistory?.length || 0})`);
      }

      return isCompleted;
    });

    const incompleteCategories = categories.filter(cat => {
      const mainAssessmentPassed = (cat.score || 0) >= 75;
      const hasSuccessfulIntervention = cat.interventionHistory && cat.interventionHistory.some(intervention => intervention.isPassed === true);
      return !(mainAssessmentPassed || hasSuccessfulIntervention);
    });

    let overallScore = 0;

    // 🔧 CRITICAL FIX: Calculate scores for ALL categories using BEST available score
    // For completed categories, use intervention score if it's higher than original
    // For incomplete categories, use original score
    const allScores = categories.map(cat => {
      const mainAssessmentPassed = (cat.score || 0) >= 75;
      const hasSuccessfulIntervention = cat.interventionHistory && cat.interventionHistory.some(intervention => intervention.isPassed === true);

      let finalScore = cat.score || 0;
      let scoreSource = 'original';

      console.log(`[OVERALL STATS] DEBUG ${cat.categoryName}:`, {
        originalScore: cat.score,
        mainAssessmentPassed,
        interventionHistory: cat.interventionHistory ? cat.interventionHistory.map(i => ({ score: i.score, isPassed: i.isPassed })) : [],
        hasSuccessfulIntervention
      });

      // 🔧 NEW LOGIC: Always use the best available score
      if (hasSuccessfulIntervention) {
        const passedInterventions = cat.interventionHistory.filter(attempt => attempt.isPassed === true);
        const highestInterventionScore = Math.max(...passedInterventions.map(attempt => attempt.score || 0));
        
        // Use intervention score if it's higher than original OR if original didn't pass
        if (highestInterventionScore > finalScore || !mainAssessmentPassed) {
          finalScore = highestInterventionScore;
          scoreSource = 'intervention';
          console.log(`[OVERALL STATS] ✅ Using intervention score for ${cat.categoryName}: ${highestInterventionScore}% (original: ${cat.score}%)`);
        } else {
          console.log(`[OVERALL STATS] ⚪ Using original score for ${cat.categoryName}: ${finalScore}% (intervention available but lower: ${highestInterventionScore}%)`);
        }
      } else {
        console.log(`[OVERALL STATS] ⚪ Using original score for ${cat.categoryName}: ${finalScore}%`);
      }

      console.log(`[OVERALL STATS] 📊 Final score for ${cat.categoryName}: ${finalScore}% (${scoreSource})`);
      return finalScore;
    });

    // Simple average of all category scores
    const totalScore = allScores.reduce((sum, score) => sum + score, 0);
    overallScore = Math.round(totalScore / categories.length);

    console.log(`[OVERALL STATS] ✅ ENHANCED CALCULATION: ${overallScore}% average of [${allScores.join(', ')}]`);
    console.log(`[OVERALL STATS] Passed: ${effectivelyCompletedCategories.length}, Failed: ${incompleteCategories.length}, Total: ${categories.length}`);

    const interventionRequired = incompleteCategories.length > 0;

    return {
      overallScore,
      passedCategories: effectivelyCompletedCategories.length,
      failedCategories: incompleteCategories.length,
      interventionRequired
    };
  }

  /**
   * Get category result by category name (for intervention service)
   * 
   * @param {string|number} studentId - Student ID
   * @param {string} categoryName - Category name
   * @returns {Promise<Object|null>} - Category result
   */
  static async getCategoryResultByCategory(studentId, categoryName) {
    try {
      // This method is used by intervention service, maintain compatibility
      return await this.getCategoryResult(studentId, categoryName);
    } catch (error) {
      console.error(`[CATEGORY RESULTS] Error getting category result by category:`, error);
      return null;
    }
  }

  /**
   * Check if student has completed assessment for reading level
   * 
   * @param {number} studentId - Student ID
   * @param {string} readingLevel - Reading level
   * @returns {Promise<Object>} - Completion status
   */
  static async checkAssessmentCompletion(studentId, readingLevel) {
    try {
      const expectedCategories = this.getCategoriesForReadingLevel(readingLevel);
      const categoryResults = await this.getCategoryResults(studentId);
      
      if (categoryResults.length === 0) {
        return {
          completed: false,
          completedCategories: [],
          missingCategories: expectedCategories,
          readingLevel
        };
      }

      // Get latest result
      const latestResult = categoryResults[0];
      const completedCategories = latestResult.categories.map(cat => cat.categoryName);
      const missingCategories = expectedCategories.filter(cat => !completedCategories.includes(cat));

      return {
        completed: missingCategories.length === 0,
        completedCategories,
        missingCategories,
        readingLevel,
        categoryResultId: latestResult._id
      };

    } catch (error) {
      console.error(`[CATEGORY RESULTS] Error checking assessment completion:`, error);
      return {
        completed: false,
        completedCategories: [],
        missingCategories: [],
        error: error.message
      };
    }
  }

  /**
   * Get expected categories for reading level
   * 
   * @param {string} readingLevel - Reading level
   * @returns {Array} - Expected categories
   */
  static getCategoriesForReadingLevel(readingLevel) {
    const categoryMap = {
      'Low Emerging': ['Alphabet Knowledge'],
      'High Emerging': ['Alphabet Knowledge', 'Phonological Awareness'],
      'Developing': ['Alphabet Knowledge', 'Phonological Awareness', 'Decoding'],
      'Transitioning': ['Alphabet Knowledge', 'Phonological Awareness', 'Decoding', 'Word Recognition'],
      'At Grade Level': ['Alphabet Knowledge', 'Phonological Awareness', 'Decoding', 'Word Recognition', 'Reading Comprehension']
    };

    return categoryMap[readingLevel] || categoryMap['At Grade Level'];
  }

  /**
   * Enforce 75% pass threshold validation
   * 
   * @param {Array} categories - Categories to validate
   * @returns {Array} - Validated categories with enforced threshold
   */
  static enforcePassThreshold(categories) {
    const PASS_THRESHOLD = 75;
    
    return categories.map(category => ({
      ...category,
      passingThreshold: PASS_THRESHOLD,
      isPassed: (category.score || 0) >= PASS_THRESHOLD,
      interventionRequired: (category.score || 0) < PASS_THRESHOLD
    }));
  }

  /**
   * Process reading level progression when student passes all categories
   * Automatically updates user's reading level and creates new category_results record
   *
   * @param {number} studentId - Student ID
   * @param {string} currentReadingLevel - Current reading level
   * @returns {Promise<Object>} - Progression result
   */
  /**
   * LEGACY WRAPPER METHOD: Process reading level progression
   *
   * This method is maintained for backward compatibility and now uses the comprehensive
   * ReadingLevelProgressionService internally while preserving the original return format.
   *
   * @param {number} studentId - Student ID
   * @param {string} currentReadingLevel - Current reading level
   * @returns {Promise<Object>} - Progression result in legacy format
   */
  static async processReadingLevelProgression(studentId, currentReadingLevel) {
    try {
      console.log(`[LEGACY WRAPPER] 🔄 processReadingLevelProgression called - delegating to ReadingLevelProgressionService`);
      console.log(`[LEGACY WRAPPER] Student: ${studentId}, Current Level: ${currentReadingLevel}`);

      // Use the comprehensive ReadingLevelProgressionService
      const progressionResult = await ReadingLevelProgressionService.checkAndProgressReadingLevel(
        studentId,
        currentReadingLevel
      );

      console.log(`[LEGACY WRAPPER] 📊 ReadingLevelProgressionService result:`, progressionResult);

      // Map to legacy format for backward compatibility
      if (progressionResult.success && progressionResult.progressionExecuted) {
        const user = await User.findOne({ idNumber: studentId });

        return {
          shouldProgress: true,          // Legacy field name
          levelChanged: true,            // Legacy field name
          currentLevel: progressionResult.fromLevel,
          newLevel: progressionResult.toLevel,
          readingPercentagePreserved: user?.readingPercentage,
          userUpdated: progressionResult.userUpdated,
          categoryResultsUpdated: progressionResult.categoryResultsUpdated,
          placeholderCreated: progressionResult.placeholderCreated,
          message: `Successfully progressed from ${progressionResult.fromLevel} to ${progressionResult.toLevel}`,
          // Include new comprehensive data
          comprehensiveResult: progressionResult
        };
      } else if (progressionResult.success && !progressionResult.progressionNeeded) {
        return {
          shouldProgress: false,         // Legacy field name
          levelChanged: false,           // Legacy field name
          currentLevel: currentReadingLevel,
          newLevel: null,
          reason: progressionResult.reason,
          message: progressionResult.reason || 'No progression needed',
          // Include new comprehensive data
          comprehensiveResult: progressionResult
        };
      } else {
        // Handle error cases
        return {
          shouldProgress: false,         // Legacy field name
          levelChanged: false,           // Legacy field name
          currentLevel: currentReadingLevel,
          newLevel: null,
          error: progressionResult.error || 'Progression check failed',
          message: progressionResult.error || 'Progression check failed',
          // Include new comprehensive data
          comprehensiveResult: progressionResult
        };
      }

    } catch (error) {
      console.error('[LEGACY WRAPPER] ❌ Error in processReadingLevelProgression wrapper:', error);

      return {
        shouldProgress: false,           // Legacy field name
        levelChanged: false,             // Legacy field name
        currentLevel: currentReadingLevel,
        newLevel: null,
        error: error.message,
        message: `Error processing progression: ${error.message}`
      };
    }
  }

  /**
   * Check if student is eligible for reading level progression
   * Used by mobile app to determine if new assessment should be unlocked
   *
   * @param {number} studentId - Student ID
   * @returns {Promise<Object>} - Progression eligibility status
   */
  static async checkProgressionEligibility(studentId) {
    try {
      // Get student's current reading level
      const User = require('../../models/userModel');
      const user = await User.findOne({ studentId: studentId });

      if (!user) {
        return { eligible: false, reason: 'Student not found' };
      }

      // Get latest category results for current level
      const latestResult = await CategoryResult
        .findOne({
          studentId: studentId,
          readingLevel: user.readingLevel
        })
        .sort({ assessmentDate: -1 });

      if (!latestResult) {
        return {
          eligible: false,
          reason: 'No assessment completed for current reading level',
          currentLevel: user.readingLevel,
          requiredCategories: this.getCategoriesForReadingLevel(user.readingLevel)
        };
      }

      if (!latestResult.allCategoriesPassed) {
        const failedCategories = latestResult.categories
          .filter(cat => !cat.isPassed)
          .map(cat => cat.categoryName);

        return {
          eligible: false,
          reason: 'Not all categories passed',
          currentLevel: user.readingLevel,
          failedCategories,
          needsIntervention: failedCategories.some(cat =>
            latestResult.categories.find(c => c.categoryName === cat)?.interventionRequired
          )
        };
      }

      // Check if already at highest level
      const nextLevel = {
        'Low Emerging': 'High Emerging',
        'High Emerging': 'Developing',
        'Developing': 'Transitioning',
        'Transitioning': 'At Grade Level',
        'At Grade Level': null
      }[user.readingLevel];

      if (!nextLevel) {
        return {
          eligible: false,
          reason: 'Already at highest reading level',
          currentLevel: user.readingLevel
        };
      }

      return {
        eligible: true,
        currentLevel: user.readingLevel,
        nextLevel,
        message: `Ready to progress from ${user.readingLevel} to ${nextLevel}`,
        completedAt: latestResult.updatedAt
      };

    } catch (error) {
      console.error('[READING LEVEL PROGRESSION] Error checking eligibility:', error);
      return {
        eligible: false,
        reason: 'Error checking progression eligibility',
        error: error.message
      };
    }
  }

  // Helper function to normalize category data format with dynamic completion detection
  static normalizeCategories(categories) {
    if (!categories || !Array.isArray(categories) || categories.length === 0) {
      return [];
    }

    return categories.map(category => {
      const score = category.score || 0;
      const mainAssessmentPassed = score >= 75;
      const hasSuccessfulIntervention = category.interventionHistory &&
        category.interventionHistory.some(intervention => intervention.isPassed === true);

      // ✅ DYNAMIC COMPLETION DETECTION: Category is completed if passed main OR successful intervention
      const effectivelyCompleted = mainAssessmentPassed || hasSuccessfulIntervention;

      // ✅ INTERVENTION REQUIREMENT: Only require intervention if main assessment failed AND no successful intervention
      const needsIntervention = !effectivelyCompleted;

      // Debug logging for intervention requirement setting
      if (mainAssessmentPassed) {
        console.log(`[NORMALIZE] ✅ ${category.categoryName}: PASSED MAIN (${score}%) - interventionRequired: false`);
      } else if (hasSuccessfulIntervention) {
        console.log(`[NORMALIZE] ✅ ${category.categoryName}: PASSED INTERVENTION - interventionRequired: false`);
      } else {
        console.log(`[NORMALIZE] ❌ ${category.categoryName}: NEEDS INTERVENTION (${score}%) - interventionRequired: true`);
      }

      return {
        categoryName: category.categoryName || 'Unknown Category',
        totalQuestions: category.totalQuestions || 0,
        correctAnswers: category.correctAnswers || 0,
        totalPossibleMatches: category.totalPossibleMatches || 0,
        correctMatches: category.correctMatches || 0,
        score: score,
        isPassed: mainAssessmentPassed, // Main assessment pass status (preserve original for data integrity)
        passingThreshold: 75, // Always 75%
        isCompleted: category.isCompleted || false,
        lastQuestionAnswered: category.lastQuestionAnswered || '',
        interventionRequired: needsIntervention, // ✅ DYNAMIC: false if passed main OR intervention
        interventionAttempts: category.interventionAttempts || 0,
        interventionCompleted: category.interventionCompleted || false,
        currentInterventionId: category.currentInterventionId || null,
        interventionHistory: category.interventionHistory || []
      };
    });
  }

  /**
   * Get categories for reading level in prerequisite order (CLAUDE.md)
   * This matches the AutoProcessingService method for consistency
   */
  static getCategoriesForReadingLevel(readingLevel) {
    const categoryAssignment = {
      "Low Emerging": ["Alphabet Knowledge"],
      "High Emerging": ["Alphabet Knowledge", "Phonological Awareness"],
      "Developing": ["Alphabet Knowledge", "Phonological Awareness", "Decoding"],
      "Transitioning": ["Alphabet Knowledge", "Phonological Awareness", "Decoding", "Word Recognition"],
      "At Grade Level": ["Alphabet Knowledge", "Phonological Awareness", "Decoding", "Word Recognition", "Reading Comprehension"]
    };

    return categoryAssignment[readingLevel] || [];
  }

  /**
   * Check if student can access a specific category (with prerequisite validation)
   * Integrates with AssessmentFlowControlService for sequential access control
   *
   * @param {number} studentId - Student ID
   * @param {string} category - Category to check access for
   * @returns {Object} Access status and details
   */
  static async checkCategoryAccess(studentId, category) {
    try {
      console.log(`[CATEGORY ACCESS] Checking access for student ${studentId} to category ${category}`);

      // Use flow control service for prerequisite checking
      const accessResult = await AssessmentFlowControlService.checkCategoryAccess(studentId, category);

      return {
        success: true,
        allowed: accessResult.allowed,
        category: category,
        reason: accessResult.reason,
        prerequisites: accessResult.prerequisites || [],
        nextRequired: accessResult.nextRequired || null,
        blockingFactors: accessResult.blockingFactors || [],
        message: accessResult.message || null
      };

    } catch (error) {
      console.error('[CATEGORY ACCESS] Error checking category access:', error);
      return {
        success: false,
        allowed: false,
        error: error.message,
        reason: 'System error during access check'
      };
    }
  }

  /**
   * Get next available category for student assessment
   * Uses sequential flow control to determine what student should take next
   *
   * @param {number} studentId - Student ID
   * @returns {Object} Next category recommendation
   */
  static async getNextCategoryForAssessment(studentId) {
    try {
      console.log(`[NEXT CATEGORY] Getting next category for student ${studentId}`);

      const nextAvailable = await AssessmentFlowControlService.getNextAvailableCategory(studentId);

      if (nextAvailable.hasNext) {
        return {
          success: true,
          hasNext: true,
          nextCategory: nextAvailable.nextCategory,
          reason: nextAvailable.reason,
          currentScore: nextAvailable.currentScore || 0,
          requiresIntervention: nextAvailable.requiresIntervention || false
        };
      } else {
        return {
          success: true,
          hasNext: false,
          reason: nextAvailable.reason,
          readyForProgression: nextAvailable.readyForProgression || false,
          currentLevel: nextAvailable.currentLevel,
          nextRequired: nextAvailable.nextRequired || null,
          blockingFactors: nextAvailable.blockingFactors || []
        };
      }

    } catch (error) {
      console.error('[NEXT CATEGORY] Error getting next category:', error);
      return {
        success: false,
        hasNext: false,
        error: error.message
      };
    }
  }

  /**
   * Get complete assessment flow summary for student
   * Shows progress across all categories with prerequisite information
   *
   * @param {number} studentId - Student ID
   * @returns {Object} Complete flow summary
   */
  static async getAssessmentFlowSummary(studentId) {
    try {
      console.log(`[FLOW SUMMARY] Getting assessment flow summary for student ${studentId}`);

      const flowSummary = await AssessmentFlowControlService.getAssessmentFlowSummary(studentId);

      if (flowSummary.error) {
        return {
          success: false,
          error: flowSummary.error,
          message: flowSummary.message
        };
      }

      return {
        success: true,
        studentId: flowSummary.studentId,
        readingLevel: flowSummary.readingLevel,
        totalCategories: flowSummary.totalCategories,
        overallProgress: flowSummary.overallProgress,
        categoryProgress: flowSummary.categoryProgress,
        nextAvailable: flowSummary.nextAvailable,
        recommendedAction: this.determineRecommendedAction(flowSummary)
      };

    } catch (error) {
      console.error('[FLOW SUMMARY] Error getting flow summary:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Determine recommended action based on flow summary
   * Helper method to provide clear guidance on what student should do next
   *
   * @param {Object} flowSummary - Flow summary from AssessmentFlowControlService
   * @returns {string} Recommended action
   */
  static determineRecommendedAction(flowSummary) {
    if (flowSummary.nextAvailable.hasNext) {
      if (flowSummary.nextAvailable.requiresIntervention) {
        return 'complete_intervention';
      } else {
        return 'take_next_category';
      }
    } else if (flowSummary.nextAvailable.readyForProgression) {
      return 'ready_for_level_progression';
    } else if (flowSummary.nextAvailable.nextRequired) {
      return 'complete_prerequisite';
    } else {
      return 'assessment_complete';
    }
  }

  /**
   * Validate category result update with prerequisite checking
   * Enhanced version of updateCategoryResult that enforces sequential access
   *
   * @param {Object} updateData - Category result update data
   * @returns {Object} Update result with prerequisite validation
   */
  static async updateCategoryResultWithPrerequisites(updateData) {
    try {
      const { studentId, category } = updateData;

      // First check if student can access this category
      const accessCheck = await this.checkCategoryAccess(studentId, category);

      if (!accessCheck.allowed) {
        return {
          success: false,
          error: 'Category access denied',
          reason: accessCheck.reason,
          blockingFactors: accessCheck.blockingFactors,
          nextRequired: accessCheck.nextRequired,
          message: `Cannot update results for ${category}: ${accessCheck.reason}`
        };
      }

      // If access is allowed, proceed with normal update
      console.log(`[CATEGORY UPDATE] Prerequisites met for ${category} - proceeding with update`);
      const updateResult = await this.updateCategoryResult(updateData);

      // Add flow control information to the result
      if (updateResult.success) {
        const nextCategory = await this.getNextCategoryForAssessment(studentId);
        updateResult.nextAvailable = nextCategory;
        updateResult.accessValidated = true;
      }

      return updateResult;

    } catch (error) {
      console.error('[CATEGORY UPDATE] Error updating with prerequisites:', error);
      return {
        success: false,
        error: error.message,
        reason: 'System error during prerequisite-validated update'
      };
    }
  }

  /**
   * Update category_results when intervention succeeds
   * This is called when intervention_results shows a passing score (≥75%)
   *
   * @param {number} studentId - Student ID
   * @param {string} category - Category name
   * @param {number} interventionScore - Score from intervention
   * @param {ObjectId} interventionResultId - ID of intervention result
   * @returns {Object} Update result
   */
  static async updateCategoryFromIntervention(studentId, category, interventionScore, interventionResultId) {
    try {
      console.log(`[INTERVENTION UPDATE] Updating category_results for student ${studentId}, category ${category} - marking as passed via intervention`);

      // Find the category result that needs updating
      const categoryResult = await CategoryResult.findOne({
        studentId: parseInt(studentId),
        'categories.categoryName': category
      });

      if (!categoryResult) {
        throw new Error(`Category result not found for student ${studentId}, category ${category}`);
      }

      // Find the specific category within the result
      const categoryIndex = categoryResult.categories.findIndex(
        cat => cat.categoryName === category
      );

      if (categoryIndex === -1) {
        throw new Error(`Category ${category} not found in results for student ${studentId}`);
      }

      const originalScore = categoryResult.categories[categoryIndex].score;
      const originalIsPassed = categoryResult.categories[categoryIndex].isPassed;

      console.log(`[INTERVENTION UPDATE] Original assessment: ${originalScore}% (passed: ${originalIsPassed})`);
      console.log(`[INTERVENTION UPDATE] Intervention result: ${interventionScore}% (passed: ${interventionScore >= 75})`);

      // ✅ ADD INTERVENTION TO HISTORY
      if (!categoryResult.categories[categoryIndex].interventionHistory) {
        categoryResult.categories[categoryIndex].interventionHistory = [];
      }

      const attemptNumber = categoryResult.categories[categoryIndex].interventionHistory.length + 1;
      const interventionEntry = {
        attemptNumber: attemptNumber,
        interventionId: null, // Will be set if available
        interventionResultId: interventionResultId,
        score: interventionScore,
        isPassed: interventionScore >= 75,
        attemptedAt: new Date(),
        completedAt: new Date()
      };

      categoryResult.categories[categoryIndex].interventionHistory.push(interventionEntry);

      // ✅ UPDATE CATEGORY STATUS BASED ON INTERVENTION SUCCESS
      if (interventionScore >= 75) {
        categoryResult.categories[categoryIndex].isPassed = true;
        categoryResult.categories[categoryIndex].interventionRequired = false;
        categoryResult.categories[categoryIndex].interventionCompleted = true;

        // ✅ CRITICAL FIX: Update category score to use intervention score when higher
        if (interventionScore > originalScore) {
          console.log(`[INTERVENTION UPDATE] 🔄 Updating category score: ${originalScore}% → ${interventionScore}% (intervention score higher)`);
          categoryResult.categories[categoryIndex].score = interventionScore;
        } else {
          console.log(`[INTERVENTION UPDATE] ℹ️ Keeping original score: ${originalScore}% (higher than intervention ${interventionScore}%)`);
        }

        console.log(`[INTERVENTION UPDATE] ✅ Category now PASSED via intervention (${interventionScore}%)`);
      } else {
        console.log(`[INTERVENTION UPDATE] ❌ Intervention failed (${interventionScore}% < 75%)`);
      }

      categoryResult.categories[categoryIndex].interventionResultId = interventionResultId;
      categoryResult.categories[categoryIndex].lastUpdated = new Date();

      // ✅ RECALCULATE OVERALL SCORE AFTER INTERVENTION UPDATE
      const overallStats = this.calculateOverallStats(categoryResult.categories);
      categoryResult.overallScore = overallStats.overallScore;
      categoryResult.completedCategories = overallStats.passedCategories;
      categoryResult.allCategoriesPassed = overallStats.passedCategories === categoryResult.categories.length;

      console.log(`[INTERVENTION UPDATE] 🔄 Recalculated overall score: ${overallStats.overallScore}% (${overallStats.passedCategories}/${categoryResult.categories.length} categories passed)`);

      // Update overall category result metadata
      categoryResult.updatedAt = new Date();

      // Save the updated category result
      await categoryResult.save();

      console.log(`[INTERVENTION UPDATE] Successfully updated category_results for ${category}`);

      // Return success result for the calling hook
      const successResult = {
        success: true,
        studentId: studentId,
        category: category,
        originalScore: originalScore,
        interventionScore: interventionScore,
        newOverallScore: categoryResult.overallScore,
        isPassed: interventionScore >= 75,
        categoryUpdated: true
      };

      // 🚀 AUTOMATIC READING LEVEL PROGRESSION CHECK AFTER INTERVENTION SUCCESS
      // Check if intervention success now qualifies student for reading level progression
      const student = await User.findOne({ idNumber: studentId });
      if (student) {
        try {
          console.log(`[INTERVENTION UPDATE] 🔍 Checking reading level progression after intervention success for ${category}`);

          const progressionResult = await ReadingLevelProgressionService.checkAndProgressReadingLevel(
            studentId,
            student.readingLevel
          );

          if (progressionResult.success && progressionResult.progressionExecuted) {
            console.log(`[INTERVENTION UPDATE] 🎉 INTERVENTION SUCCESS TRIGGERED PROGRESSION: ${progressionResult.fromLevel} → ${progressionResult.toLevel}`);
            console.log(`[INTERVENTION UPDATE] 📋 User updated: ${progressionResult.userUpdated}, Categories updated: ${progressionResult.categoryResultsUpdated}`);

            // Update the current category result to mark progression as completed
            categoryResult.readingLevelUpdated = true;
            await categoryResult.save();

            console.log(`[INTERVENTION UPDATE] 📋 Marked progression completed in category_results`);
          } else if (progressionResult.success && !progressionResult.progressionNeeded) {
            console.log(`[INTERVENTION UPDATE] ℹ️ No progression needed after intervention: ${progressionResult.reason}`);
          } else {
            console.warn(`[INTERVENTION UPDATE] ⚠️ Progression check after intervention inconclusive:`, progressionResult);
          }
        } catch (progressionError) {
          console.error('[INTERVENTION UPDATE] ❌ Error in automatic reading level progression after intervention:', progressionError);
          // Don't fail the intervention update if progression fails
        }
      }

      return successResult;

    } catch (error) {
      console.error('[INTERVENTION UPDATE] Error updating category from intervention:', error);
      return {
        success: false,
        error: error.message,
        reason: 'Failed to update category_results from intervention success'
      };
    }
  }

  /**
   * ✅ DYNAMIC COMPLETION FIX: Update category results to reflect categories that pass without intervention
   * This method fixes categories scoring ≥75% that should have interventionRequired: false
   * and ensures they are counted in overall statistics
   *
   * @param {number} studentId - Student ID to fix (optional, fixes all if not provided)
   * @returns {Object} Fix summary
   */
  static async fixDynamicCategoryCompletion(studentId = null) {
    try {
      console.log(`[DYNAMIC COMPLETION FIX] 🔧 Starting dynamic category completion fix${studentId ? ` for student ${studentId}` : ' for all students'}`);

      // Build query for category results to fix
      const query = {};
      if (studentId) {
        query.studentId = parseInt(studentId);
      }

      const categoryResults = await CategoryResult.find(query);

      console.log(`[DYNAMIC COMPLETION FIX] 📋 Found ${categoryResults.length} category results to analyze`);

      let fixedCount = 0;
      let analysisCount = 0;

      for (const categoryResult of categoryResults) {
        analysisCount++;
        let categoryFixed = false;

        console.log(`[DYNAMIC COMPLETION FIX] 🔍 Analyzing student ${categoryResult.studentId} (${analysisCount}/${categoryResults.length})`);

        // Check each category for completion status
        for (const category of categoryResult.categories) {
          const score = category.score || 0;
          const mainAssessmentPassed = score >= 75;
          const hasSuccessfulIntervention = category.interventionHistory &&
            category.interventionHistory.some(intervention => intervention.isPassed === true);
          const shouldBeCompleted = mainAssessmentPassed || hasSuccessfulIntervention;

          // Check if intervention requirement is incorrectly set
          const currentInterventionRequired = category.interventionRequired;
          const correctInterventionRequired = !shouldBeCompleted;

          // Debug logging for each category
          console.log(`[DYNAMIC COMPLETION FIX] 🔍 Analyzing ${category.categoryName}:`);
          console.log(`[DYNAMIC COMPLETION FIX]   - Score: ${score}%`);
          console.log(`[DYNAMIC COMPLETION FIX]   - Main assessment passed: ${mainAssessmentPassed}`);
          console.log(`[DYNAMIC COMPLETION FIX]   - Has successful intervention: ${hasSuccessfulIntervention}`);
          console.log(`[DYNAMIC COMPLETION FIX]   - Should be completed: ${shouldBeCompleted}`);
          console.log(`[DYNAMIC COMPLETION FIX]   - Current interventionRequired: ${currentInterventionRequired}`);
          console.log(`[DYNAMIC COMPLETION FIX]   - Correct interventionRequired: ${correctInterventionRequired}`);
          console.log(`[DYNAMIC COMPLETION FIX]   - Needs fixing: ${currentInterventionRequired !== correctInterventionRequired}`);

          if (currentInterventionRequired !== correctInterventionRequired) {
            console.log(`[DYNAMIC COMPLETION FIX] 🔧 Fixing ${category.categoryName} for student ${categoryResult.studentId}:`);
            console.log(`[DYNAMIC COMPLETION FIX]   - Score: ${score}%`);
            console.log(`[DYNAMIC COMPLETION FIX]   - Should be completed: ${shouldBeCompleted}`);
            console.log(`[DYNAMIC COMPLETION FIX]   - Current interventionRequired: ${currentInterventionRequired}`);
            console.log(`[DYNAMIC COMPLETION FIX]   - Correct interventionRequired: ${correctInterventionRequired}`);

            // Fix the intervention requirement flag
            category.interventionRequired = correctInterventionRequired;
            categoryFixed = true;
          }
        }

        // If any categories were fixed, recalculate overall statistics
        if (categoryFixed) {
          const normalizedCategories = this.normalizeCategories(categoryResult.categories);
          const overallStats = this.calculateOverallStats(normalizedCategories);

          // Update category result with corrected statistics
          categoryResult.categories = normalizedCategories;
          categoryResult.overallScore = overallStats.overallScore;
          categoryResult.completedCategories = overallStats.passedCategories;
          categoryResult.totalCategories = normalizedCategories.length;
          categoryResult.allCategoriesPassed = overallStats.passedCategories === normalizedCategories.length;
          categoryResult.updatedAt = new Date();

          await categoryResult.save();

          console.log(`[DYNAMIC COMPLETION FIX] ✅ Fixed student ${categoryResult.studentId}: ${overallStats.passedCategories}/${normalizedCategories.length} completed, overall: ${overallStats.overallScore}%`);
          fixedCount++;
        } else {
          console.log(`[DYNAMIC COMPLETION FIX] ⏭️  Student ${categoryResult.studentId}: No fixes needed`);
        }
      }

      console.log(`[DYNAMIC COMPLETION FIX] ✅ Completion fix summary: ${fixedCount} fixed out of ${analysisCount} analyzed`);

      return {
        success: true,
        message: `Dynamic completion fix completed`,
        analyzed: analysisCount,
        fixed: fixedCount,
        skipped: analysisCount - fixedCount
      };

    } catch (error) {
      console.error('[DYNAMIC COMPLETION FIX] ❌ Error during dynamic completion fix:', error);
      return {
        success: false,
        error: error.message,
        message: 'Dynamic completion fix failed'
      };
    }
  }

  /**
   * ✅ FIX: Auto-detect the most recent completed revision
   * This fixes the issue where intervention_assessment.revisionNumber might be outdated
   * or point to an incomplete revision while a newer complete revision exists
   */
  static async findMostRecentCompletedRevision(studentId, interventionAssessmentId, interventionAssessment) {
    console.log(`[REVISION DETECTION] 🔍 Detecting current revision to validate (NOT looking for completed ones)...`);

    const InterventionResponse = require('../../models/Teachers/ManageProgress/interventionResponseModel');

    // Get all intervention responses for this intervention
    const allResponses = await InterventionResponse.find({
      studentId: studentId,
      interventionAssessmentId: interventionAssessmentId
    }).sort({ revisionNumber: -1, answeredAt: -1 }); // Sort by newest first

    console.log(`[REVISION DETECTION] Found ${allResponses.length} total responses across all revisions`);

    if (allResponses.length === 0) {
      console.log(`[REVISION DETECTION] No responses found - using assessment revision ${interventionAssessment.revisionNumber}`);
      return interventionAssessment.revisionNumber || 1;
    }

    // Find the most recent revision number (highest revision number with responses)
    const mostRecentRevisionWithResponses = Math.max(
      ...allResponses.map(response => response.revisionNumber || 1)
    );

    // Get expected question count from intervention assessment
    const expectedQuestions = interventionAssessment.totalQuestions || interventionAssessment.questions?.length || 0;
    console.log(`[REVISION DETECTION] Expected questions per revision: ${expectedQuestions}`);

    // Group responses by revision number for analysis
    const responsesByRevision = {};
    allResponses.forEach(response => {
      const revision = response.revisionNumber || 1;
      if (!responsesByRevision[revision]) {
        responsesByRevision[revision] = [];
      }
      responsesByRevision[revision].push(response);
    });

    // Analyze all revisions (for logging purposes)
    const revisionAnalysis = {};
    Object.keys(responsesByRevision).forEach(revision => {
      const revisionNum = parseInt(revision);
      const responses = responsesByRevision[revision];
      const responseCount = responses.length;
      const isComplete = responseCount >= expectedQuestions;

      revisionAnalysis[revisionNum] = {
        responseCount,
        expectedQuestions,
        isComplete,
        completionRate: Math.round((responseCount / expectedQuestions) * 100)
      };

      console.log(`[REVISION DETECTION] Revision ${revisionNum}: ${responseCount}/${expectedQuestions} responses (${isComplete ? 'COMPLETE' : 'INCOMPLETE'})`);
    });

    console.log(`[REVISION DETECTION] 📊 Revision analysis:`, revisionAnalysis);

    // CRITICAL FIX: Always validate the most recent revision, even if incomplete
    // This will allow the validation function to properly block incomplete interventions
    const assessmentRevision = interventionAssessment.revisionNumber;
    const currentRevision = mostRecentRevisionWithResponses;

    if (currentRevision !== assessmentRevision) {
      console.log(`[REVISION DETECTION] ⚠️  REVISION MISMATCH DETECTED:`);
      console.log(`[REVISION DETECTION]   Assessment revision: ${assessmentRevision}`);
      console.log(`[REVISION DETECTION]   Most recent with responses: ${currentRevision}`);
      console.log(`[REVISION DETECTION]   🔧 Using most recent revision for validation (${currentRevision})`);
    }

    console.log(`[REVISION DETECTION] ✅ Using revision ${currentRevision} for validation (most recent, may be incomplete)`);
    return currentRevision;
  }
}

module.exports = CategoryResultsService; 