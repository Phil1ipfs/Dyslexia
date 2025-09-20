/**
 * Category Results Fix Service
 *
 * Automatically fixes category_results where interventions have passed
 * but overall statistics (completedCategories, overallScore) weren't updated
 */

const CategoryResults = require('../../models/Teachers/ManageProgress/categoryResultModel');

class CategoryResultsFixService {
  /**
   * Fix all category results where statistics don't match actual performance
   * Works for ALL categories regardless of how they were passed (main assessment OR intervention)
   */
  static async fixAllCategoryResults() {
    console.log('[CATEGORY FIX] 🔧 Starting automatic category results fix...');

    try {
      // Find ALL category results that might need fixing
      // This includes both intervention successes AND main assessment passes
      const categoryResults = await CategoryResults.find({
        $or: [
          { 'categories.isPassed': true },  // Categories marked as passed
          { 'categories.interventionHistory.isPassed': true }  // Categories with passed interventions
        ]
      });

      console.log(`[CATEGORY FIX] 📋 Found ${categoryResults.length} category results with passed categories or interventions`);

      let fixedCount = 0;
      let skippedCount = 0;

      for (const categoryResult of categoryResults) {
        const fixResult = await this.fixSingleCategoryResult(categoryResult);
        if (fixResult.fixed) {
          fixedCount++;
        } else {
          skippedCount++;
        }
      }

      console.log(`[CATEGORY FIX] ✅ Fix complete: ${fixedCount} fixed, ${skippedCount} skipped`);

      return {
        success: true,
        fixed: fixedCount,
        skipped: skippedCount,
        total: categoryResults.length
      };

    } catch (error) {
      console.error('[CATEGORY FIX] ❌ Error during fix:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Fix a single category result
   */
  static async fixSingleCategoryResult(categoryResult) {
    const studentId = categoryResult.studentId;

    try {
      // First, fix any categories that have passed interventions but still have isPassed: false
      let categoriesFixed = 0;
      for (const category of categoryResult.categories) {
        if (!category.isPassed && category.interventionHistory && category.interventionHistory.length > 0) {
          // Check if any intervention in history passed
          const hasPassedIntervention = category.interventionHistory.some(history => history.isPassed === true);
          if (hasPassedIntervention) {
            console.log(`[CATEGORY FIX] 🔧 Student ${studentId}: Fixing category ${category.categoryName} - intervention passed but isPassed was false`);
            category.isPassed = true;
            category.interventionRequired = false;
            category.interventionCompleted = true;
            categoriesFixed++;
          }
        }
      }

      // Calculate current statistics
      const passedCategories = categoryResult.categories.filter(cat => cat.isPassed === true);
      const currentCompletedCategories = categoryResult.completedCategories || 0;
      const expectedCompletedCategories = passedCategories.length;

      const totalCategories = categoryResult.categories.length;
      
      // Calculate overall score based on total possible points across all categories
      let totalPointsEarned = 0;
      let totalPossiblePoints = 0;
      
      for (const category of categoryResult.categories) {
        // Each category has a maximum of 100 points (100%)
        totalPossiblePoints += 100;
        
        if (category.isPassed) {
          // Use the highest score between original assessment and intervention
          let categoryScore = category.score || 0;
          
          // Check if there's a higher intervention score
          if (category.interventionHistory && category.interventionHistory.length > 0) {
            const passedInterventions = category.interventionHistory.filter(h => h.isPassed === true);
            if (passedInterventions.length > 0) {
              const highestInterventionScore = Math.max(...passedInterventions.map(h => h.score));
              categoryScore = Math.max(categoryScore, highestInterventionScore);
            }
          }
          
          totalPointsEarned += categoryScore;
        }
        // If category not passed, it contributes 0 points
      }
      
      const expectedOverallScore = totalPossiblePoints > 0 ? Math.round((totalPointsEarned / totalPossiblePoints) * 100) : 0;
      const currentOverallScore = categoryResult.overallScore || 0;

      // Check if fix is needed
      const needsFix = (
        currentCompletedCategories !== expectedCompletedCategories ||
        currentOverallScore !== expectedOverallScore ||
        categoriesFixed > 0
      );

      if (!needsFix) {
        console.log(`[CATEGORY FIX] ⏭️  Student ${studentId}: Already correct`);
        return { fixed: false, reason: 'already_correct' };
      }

      console.log(`[CATEGORY FIX] 🔧 Student ${studentId}: Fixing statistics`);
      console.log(`[CATEGORY FIX]   - Categories fixed: ${categoriesFixed}`);
      console.log(`[CATEGORY FIX]   - completedCategories: ${currentCompletedCategories} → ${expectedCompletedCategories}`);
      console.log(`[CATEGORY FIX]   - overallScore: ${currentOverallScore}% → ${expectedOverallScore}%`);
      console.log(`[CATEGORY FIX]   - Score calculation: ${totalPointsEarned}/${totalPossiblePoints} points = ${expectedOverallScore}%`);

      // List intervention successes
      const interventionSuccesses = categoryResult.categories.filter(cat =>
        cat.isPassed && cat.interventionCompleted
      );
      console.log(`[CATEGORY FIX]   - Intervention successes: ${interventionSuccesses.map(cat => cat.categoryName).join(', ')}`);

      // Apply the fix
      categoryResult.completedCategories = expectedCompletedCategories;
      categoryResult.overallScore = expectedOverallScore;
      categoryResult.allCategoriesPassed = (expectedCompletedCategories === totalCategories);
      categoryResult.updatedAt = new Date();

      // Save the updated result
      await categoryResult.save();

      console.log(`[CATEGORY FIX] ✅ Student ${studentId}: Fixed successfully`);

      return {
        fixed: true,
        changes: {
          categoriesFixed: categoriesFixed,
          completedCategories: { from: currentCompletedCategories, to: expectedCompletedCategories },
          overallScore: { from: currentOverallScore, to: expectedOverallScore }
        }
      };

    } catch (error) {
      console.error(`[CATEGORY FIX] ❌ Error fixing student ${studentId}:`, error);
      return { fixed: false, error: error.message };
    }
  }

  /**
   * Check specific student's category results and fix if needed
   */
  static async fixStudentCategoryResults(studentId) {
    console.log(`[CATEGORY FIX] 🔍 Checking student ${studentId} for fixes...`);

    try {
      const categoryResult = await CategoryResults.findOne({ studentId: studentId });

      if (!categoryResult) {
        console.log(`[CATEGORY FIX] ⚠️  Student ${studentId}: No category results found`);
        return { success: false, reason: 'no_results_found' };
      }

      const fixResult = await this.fixSingleCategoryResult(categoryResult);

      return {
        success: true,
        studentId: studentId,
        fixed: fixResult.fixed,
        changes: fixResult.changes || null,
        reason: fixResult.reason || null
      };

    } catch (error) {
      console.error(`[CATEGORY FIX] ❌ Error checking student ${studentId}:`, error);
      return { success: false, studentId, error: error.message };
    }
  }

  /**
   * Monitor and auto-fix category results periodically
   */
  static startAutoFixMonitoring(intervalMinutes = 5) {
    console.log(`[CATEGORY FIX] 🔄 Starting auto-fix monitoring (every ${intervalMinutes} minutes)`);

    setInterval(async () => {
      console.log('[CATEGORY FIX] 🔍 Running periodic category results check...');
      await this.fixAllCategoryResults();
    }, intervalMinutes * 60 * 1000);
  }
}

module.exports = CategoryResultsFixService;