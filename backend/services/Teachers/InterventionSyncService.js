/**
 * Intervention Sync Service
 *
 * This service syncs existing intervention data with category_results on startup.
 * It ensures that completed interventions are properly reflected in the category_results
 * collection, maintaining data consistency across the system.
 */

const CategoryResults = require('../../models/Teachers/ManageProgress/categoryResultModel');
const InterventionAssessment = require('../../models/Teachers/ManageProgress/interventionAssessmentModel');
const InterventionResults = require('../../models/Teachers/ManageProgress/interventionResultsModel');

class InterventionSyncService {
  /**
   * Sync all existing intervention data with category_results
   * This should be called once during server startup
   */
  static async syncInterventionDataOnStartup() {
    console.log('\n🔄 INTERVENTION DATA SYNC');
    console.log('=========================');
    console.log('Syncing existing intervention data with category_results...');

    try {
      // Find all intervention results that have been completed
      const completedInterventions = await InterventionResults.find({})
        .populate('interventionAssessmentId')
        .sort({ completedAt: 1 }); // Oldest first

      if (completedInterventions.length === 0) {
        console.log('📭 No completed interventions found to sync');
        return { success: true, synced: 0, message: 'No interventions to sync' };
      }

      console.log(`📋 Found ${completedInterventions.length} completed interventions to sync`);

      let syncedCount = 0;
      let updatedCount = 0;
      let skippedCount = 0;

      for (const interventionResult of completedInterventions) {
        try {
          const syncResult = await this.syncSingleIntervention(interventionResult);

          if (syncResult.updated) {
            updatedCount++;
            console.log(`   ✅ Updated category_results for student ${syncResult.studentId} - ${syncResult.category}`);
          } else if (syncResult.skipped) {
            skippedCount++;
            console.log(`   ⏭️  Skipped student ${syncResult.studentId} - ${syncResult.category}: ${syncResult.reason}`);
          }

          syncedCount++;
        } catch (error) {
          console.error(`   ❌ Error syncing intervention ${interventionResult._id}:`, error.message);
        }
      }

      console.log(`\n📊 SYNC SUMMARY:`);
      console.log(`   - Total processed: ${syncedCount}`);
      console.log(`   - Updated: ${updatedCount}`);
      console.log(`   - Skipped: ${skippedCount}`);
      console.log(`   - Errors: ${completedInterventions.length - syncedCount}`);

      return {
        success: true,
        synced: syncedCount,
        updated: updatedCount,
        skipped: skippedCount,
        total: completedInterventions.length
      };

    } catch (error) {
      console.error('❌ Error during intervention data sync:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Sync a single intervention result with category_results
   */
  static async syncSingleIntervention(interventionResult) {
    const studentId = interventionResult.studentId;
    const category = interventionResult.category;
    const interventionScore = interventionResult.score;
    const interventionPassed = interventionResult.isPassed;
    const interventionAssessment = interventionResult.interventionAssessmentId;

    if (!interventionAssessment) {
      return {
        studentId,
        category,
        skipped: true,
        reason: 'No intervention assessment found'
      };
    }

    // ✅ CRITICAL FIX: Find the student's category_results for the SPECIFIC reading level of the intervention
    // This prevents intervention assessments from updating the wrong reading level's category_results
    const categoryResults = await CategoryResults.findOne({
      studentId: studentId,
      readingLevel: interventionAssessment.readingLevel  // ✅ Target specific reading level only
    });

    if (!categoryResults) {
      return {
        studentId,
        category,
        skipped: true,
        reason: 'No category_results found for student'
      };
    }

    // Find the specific category in the results
    const categoryIndex = categoryResults.categories.findIndex(
      cat => cat.categoryName === category
    );

    if (categoryIndex === -1) {
      return {
        studentId,
        category,
        skipped: true,
        reason: `Category ${category} not found in category_results`
      };
    }

    const categoryData = categoryResults.categories[categoryIndex];

    // Check if intervention is already properly recorded
    if (categoryData.interventionCompleted &&
        categoryData.currentInterventionId?.toString() === interventionAssessment._id.toString()) {
      return {
        studentId,
        category,
        skipped: true,
        reason: 'Already synced'
      };
    }

    // Update the category with intervention data
    console.log(`   🔄 Syncing intervention data for ${studentId} - ${category}`);

    // Update category data
    categoryResults.categories[categoryIndex].interventionCompleted = true;
    // ✅ CONSISTENCY FIX: Only set currentInterventionId if intervention FAILED
    // When intervention PASSES, clear currentInterventionId to null (no active intervention needed)
    if (interventionPassed) {
      categoryResults.categories[categoryIndex].currentInterventionId = null; // Clear when passed
    } else {
      categoryResults.categories[categoryIndex].currentInterventionId = interventionAssessment._id; // Keep for retries when failed
    }
    categoryResults.categories[categoryIndex].interventionAttempts = Math.max(
      categoryData.interventionAttempts || 0,
      1
    );

    // Add to intervention history if not already there
    const existingHistory = categoryData.interventionHistory || [];
    const historyExists = existingHistory.some(
      hist => hist.interventionId?.toString() === interventionAssessment._id.toString()
    );

    if (!historyExists) {
      categoryResults.categories[categoryIndex].interventionHistory = [
        ...existingHistory,
        {
          attemptNumber: Math.max(categoryData.interventionAttempts || 0, 1),
          interventionId: interventionAssessment._id,
          interventionResultId: interventionResult._id,
          score: interventionScore,
          isPassed: interventionPassed,
          attemptedAt: interventionResult.assessmentDate || new Date(),
          completedAt: interventionResult.completedAt || new Date()
        }
      ];
    }

    // If intervention passed, update category status
    if (interventionPassed) {
      console.log(`   🎉 Intervention passed! Marking category as completed via intervention`);
      
      // ✅ PRESERVE ORIGINAL ASSESSMENT DATA - Do NOT overwrite isPassed or score
      console.log(`   🔒 PRESERVING original assessment data:`);
      console.log(`   🔒 - Original score: ${categoryData.score}% (PRESERVED)`);
      console.log(`   🔒 - Original isPassed: ${categoryData.isPassed} (PRESERVED)`);
      console.log(`   📊 - Intervention score: ${interventionScore}% (tracked in history only)`);
      
      // ✅ ONLY update intervention status flags - DO NOT touch original assessment results
      categoryResults.categories[categoryIndex].interventionRequired = false;
      categoryResults.categories[categoryIndex].interventionCompleted = true;
      
      // ❌ REMOVED: Do NOT overwrite original isPassed or score
      // ❌ categoryResults.categories[categoryIndex].isPassed = true;  // REMOVED - preserves original false
      // ❌ categoryResults.categories[categoryIndex].score = Math.max(...); // REMOVED - preserves original score
      
      console.log(`   ✅ Category completion status updated without overwriting original assessment data`);
    } else {
      console.log(`   📝 Intervention failed. Category needs teacher revision.`);
      // Keep interventionRequired as true for teacher revision
      categoryResults.categories[categoryIndex].interventionRequired = true;
    }

    // Update timestamps
    categoryResults.updatedAt = new Date();

    // Save the updated category_results
    await categoryResults.save();

    return {
      studentId,
      category,
      updated: true,
      interventionScore,
      interventionPassed,
      previousScore: categoryData.score
    };
  }

  /**
   * Get sync status for monitoring
   */
  static async getSyncStatus() {
    try {
      const totalInterventionResults = await InterventionResults.countDocuments();
      const totalCategoryResults = await CategoryResults.countDocuments();

      // Count category results with completed interventions
      const syncedCategoryResults = await CategoryResults.countDocuments({
        'categories.interventionCompleted': true
      });

      // Count intervention results that should be synced
      const interventionResultsWithAssessments = await InterventionResults.countDocuments({
        interventionAssessmentId: { $ne: null }
      });

      return {
        totalInterventionResults,
        totalCategoryResults,
        syncedCategoryResults,
        interventionResultsWithAssessments,
        syncPercentage: interventionResultsWithAssessments > 0
          ? Math.round((syncedCategoryResults / interventionResultsWithAssessments) * 100)
          : 100
      };
    } catch (error) {
      console.error('Error getting sync status:', error);
      return {
        error: error.message
      };
    }
  }

  /**
   * Force resync specific student's intervention data
   */
  static async resyncStudentInterventions(studentId) {
    console.log(`🔄 Resyncing interventions for student ${studentId}`);

    try {
      const studentInterventions = await InterventionResults.find({ studentId })
        .populate('interventionAssessmentId');

      if (studentInterventions.length === 0) {
        return {
          success: true,
          message: 'No interventions found for student',
          studentId
        };
      }

      let updatedCount = 0;
      for (const intervention of studentInterventions) {
        const result = await this.syncSingleIntervention(intervention);
        if (result.updated) {
          updatedCount++;
        }
      }

      return {
        success: true,
        studentId,
        interventionsFound: studentInterventions.length,
        updated: updatedCount
      };

    } catch (error) {
      console.error(`Error resyncing student ${studentId}:`, error);
      return {
        success: false,
        studentId,
        error: error.message
      };
    }
  }

  /**
   * Check if a specific intervention is synced
   */
  static async checkInterventionSync(interventionResultId) {
    try {
      const interventionResult = await InterventionResults.findById(interventionResultId)
        .populate('interventionAssessmentId');

      if (!interventionResult) {
        return {
          synced: false,
          reason: 'Intervention result not found'
        };
      }

      const categoryResults = await CategoryResults.findOne({
        studentId: interventionResult.studentId
      });

      if (!categoryResults) {
        return {
          synced: false,
          reason: 'Category results not found'
        };
      }

      const categoryData = categoryResults.categories.find(
        cat => cat.categoryName === interventionResult.category
      );

      if (!categoryData) {
        return {
          synced: false,
          reason: 'Category not found in results'
        };
      }

      const isProperlyLinked = categoryData.interventionCompleted &&
        categoryData.currentInterventionId?.toString() === interventionResult.interventionAssessmentId._id.toString();

      return {
        synced: isProperlyLinked,
        interventionCompleted: categoryData.interventionCompleted,
        currentInterventionId: categoryData.currentInterventionId,
        expectedInterventionId: interventionResult.interventionAssessmentId._id,
        interventionScore: interventionResult.score,
        categoryScore: categoryData.score,
        categoryPassed: categoryData.isPassed
      };

    } catch (error) {
      console.error('Error checking intervention sync:', error);
      return {
        synced: false,
        error: error.message
      };
    }
  }
}

module.exports = InterventionSyncService;