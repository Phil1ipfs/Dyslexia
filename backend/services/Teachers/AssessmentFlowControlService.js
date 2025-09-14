// Assessment Flow Control Service
// Enforces sequential category completion within reading levels
// Ensures prerequisites are met before allowing access to dependent categories

const AdvancedMathematicalModelsService = require('./PrescriptiveAnalytics/advancedMathematicalModelsService');
const CategoryResultsService = require('./CategoryResultsService');
const User = require('../../models/userModel');

/**
 * Prerequisites for each reading skill category
 * Based on educational scaffolding principles
 */
const SKILL_PREREQUISITES = {
  'Alphabet Knowledge': [], // Foundational - no prerequisites
  'Phonological Awareness': ['Alphabet Knowledge'], // Requires letter knowledge
  'Decoding': ['Alphabet Knowledge', 'Phonological Awareness'], // Builds on both
  'Word Recognition': ['Alphabet Knowledge', 'Phonological Awareness', 'Decoding'], // Needs all previous
  'Reading Comprehension': ['Alphabet Knowledge', 'Phonological Awareness', 'Decoding', 'Word Recognition'] // Highest level
};

/**
 * Category order within each reading level
 * Defines the sequence in which categories should be taken
 */
const CATEGORY_SEQUENCE = {
  'Low Emerging': ['Alphabet Knowledge'],
  'High Emerging': ['Alphabet Knowledge', 'Phonological Awareness'],
  'Developing': ['Alphabet Knowledge', 'Phonological Awareness', 'Decoding'],
  'Transitioning': ['Alphabet Knowledge', 'Phonological Awareness', 'Decoding', 'Word Recognition'],
  'At Grade Level': ['Alphabet Knowledge', 'Phonological Awareness', 'Decoding', 'Word Recognition', 'Reading Comprehension']
};

class AssessmentFlowControlService {

  /**
   * Check if a student can access a specific category
   * Enforces sequential prerequisite completion
   *
   * @param {number} studentId - Student ID
   * @param {string} targetCategory - Category student wants to access
   * @returns {Object} Access decision with details
   */
  static async checkCategoryAccess(studentId, targetCategory) {
    try {
      console.log(`[FLOW CONTROL] Checking category access for student ${studentId}: ${targetCategory}`);

      // Get student's current reading level
      const student = await User.findOne({ studentId: studentId });
      if (!student) {
        return {
          allowed: false,
          reason: 'Student not found',
          blockingFactors: ['student_not_found']
        };
      }

      const readingLevel = student.readingLevel;
      console.log(`[FLOW CONTROL] Student ${studentId} reading level: ${readingLevel}`);

      // Check if target category is valid for student's reading level
      const levelCategories = CATEGORY_SEQUENCE[readingLevel] || [];
      if (!levelCategories.includes(targetCategory)) {
        return {
          allowed: false,
          reason: `Category "${targetCategory}" not available for reading level "${readingLevel}"`,
          blockingFactors: ['category_not_in_level'],
          availableCategories: levelCategories
        };
      }

      // Get prerequisites for target category
      const prerequisites = SKILL_PREREQUISITES[targetCategory] || [];

      if (prerequisites.length === 0) {
        // No prerequisites - always allowed (foundational skill)
        return {
          allowed: true,
          reason: 'Foundational category - no prerequisites required',
          prerequisites: [],
          nextCategory: targetCategory
        };
      }

      // Check if all prerequisites are completed and passed
      const prerequisiteStatus = await this.checkPrerequisiteCompletion(studentId, prerequisites);

      if (prerequisiteStatus.allMet) {
        return {
          allowed: true,
          reason: 'All prerequisites met',
          prerequisites: prerequisiteStatus.details,
          nextCategory: targetCategory
        };
      } else {
        return {
          allowed: false,
          reason: 'Prerequisites not met',
          blockingFactors: prerequisiteStatus.missing.map(p => p.category),
          prerequisites: prerequisiteStatus.details,
          nextRequired: prerequisiteStatus.nextRequired,
          message: `Must complete and pass: ${prerequisiteStatus.missing.map(p => p.category).join(', ')}`
        };
      }

    } catch (error) {
      console.error('[FLOW CONTROL] Error checking category access:', error);
      return {
        allowed: false,
        reason: 'System error during prerequisite check',
        error: error.message,
        blockingFactors: ['system_error']
      };
    }
  }

  /**
   * Check if all prerequisites for a category are completed and passed
   *
   * @param {number} studentId - Student ID
   * @param {Array} prerequisites - List of prerequisite categories
   * @returns {Object} Prerequisite completion status
   */
  static async checkPrerequisiteCompletion(studentId, prerequisites) {
    const details = [];
    const missing = [];
    let nextRequired = null;

    for (const prereqCategory of prerequisites) {
      const categoryStatus = await this.getCategoryStatus(studentId, prereqCategory);

      details.push({
        category: prereqCategory,
        completed: categoryStatus.completed,
        passed: categoryStatus.passed,
        score: categoryStatus.score,
        status: categoryStatus.status
      });

      if (!categoryStatus.completed || !categoryStatus.passed) {
        missing.push({
          category: prereqCategory,
          issue: !categoryStatus.completed ? 'not_completed' : 'not_passed',
          currentScore: categoryStatus.score || 0
        });

        // Set the first missing prerequisite as the next required
        if (!nextRequired) {
          nextRequired = prereqCategory;
        }
      }
    }

    return {
      allMet: missing.length === 0,
      details: details,
      missing: missing,
      nextRequired: nextRequired
    };
  }

  /**
   * Get the completion and pass status for a specific category
   * Checks both main assessment and intervention results
   *
   * @param {number} studentId - Student ID
   * @param {string} category - Category to check
   * @returns {Object} Category status information
   */
  static async getCategoryStatus(studentId, category) {
    try {
      // Get category results for this student
      const categoryResults = await CategoryResultsService.getCategoryResults(studentId);

      if (!categoryResults || categoryResults.length === 0) {
        return {
          completed: false,
          passed: false,
          score: 0,
          status: 'not_started'
        };
      }

      // Look for the specific category in the results
      for (const result of categoryResults) {
        const categoryData = result.categories?.find(cat => cat.categoryName === category);

        if (categoryData) {
          // Check if category has been completed
          const completed = categoryData.isCompleted === true;
          const passed = categoryData.isPassed === true && categoryData.score >= 75;

          return {
            completed: completed,
            passed: passed,
            score: categoryData.score || 0,
            status: !completed ? 'in_progress' : (passed ? 'passed' : 'failed'),
            interventionRequired: categoryData.interventionRequired || false,
            interventionCompleted: categoryData.interventionCompleted || false
          };
        }
      }

      // Category not found in results
      return {
        completed: false,
        passed: false,
        score: 0,
        status: 'not_started'
      };

    } catch (error) {
      console.error(`[FLOW CONTROL] Error getting category status for ${category}:`, error);
      return {
        completed: false,
        passed: false,
        score: 0,
        status: 'error',
        error: error.message
      };
    }
  }

  /**
   * Get next available category for student based on their current progress
   *
   * @param {number} studentId - Student ID
   * @returns {Object} Next category recommendation
   */
  static async getNextAvailableCategory(studentId) {
    try {
      console.log(`[FLOW CONTROL] Getting next available category for student ${studentId}`);

      // Get student's reading level
      const student = await User.findOne({ studentId: studentId });
      if (!student) {
        return {
          hasNext: false,
          reason: 'Student not found'
        };
      }

      const readingLevel = student.readingLevel;
      const levelCategories = CATEGORY_SEQUENCE[readingLevel] || [];

      // Check each category in sequence
      for (const category of levelCategories) {
        const accessCheck = await this.checkCategoryAccess(studentId, category);

        if (accessCheck.allowed) {
          // Check if this category is already completed
          const categoryStatus = await this.getCategoryStatus(studentId, category);

          if (!categoryStatus.completed || !categoryStatus.passed) {
            return {
              hasNext: true,
              nextCategory: category,
              reason: !categoryStatus.completed ? 'not_completed' : 'not_passed',
              currentScore: categoryStatus.score || 0,
              requiresIntervention: categoryStatus.interventionRequired && !categoryStatus.interventionCompleted
            };
          }
        } else {
          // This category is blocked - return the blocking info
          return {
            hasNext: false,
            blockedCategory: category,
            reason: accessCheck.reason,
            nextRequired: accessCheck.nextRequired,
            blockingFactors: accessCheck.blockingFactors
          };
        }
      }

      // All categories completed - check for reading level progression
      return {
        hasNext: false,
        reason: 'All categories completed for current reading level',
        readyForProgression: true,
        currentLevel: readingLevel,
        message: 'Student may be eligible for reading level progression'
      };

    } catch (error) {
      console.error('[FLOW CONTROL] Error getting next available category:', error);
      return {
        hasNext: false,
        reason: 'System error',
        error: error.message
      };
    }
  }

  /**
   * Get assessment flow summary for student
   * Shows complete progress and next steps
   *
   * @param {number} studentId - Student ID
   * @returns {Object} Complete flow summary
   */
  static async getAssessmentFlowSummary(studentId) {
    try {
      const student = await User.findOne({ studentId: studentId });
      if (!student) {
        return { error: 'Student not found' };
      }

      const readingLevel = student.readingLevel;
      const levelCategories = CATEGORY_SEQUENCE[readingLevel] || [];
      const categoryProgress = [];

      // Get status for each category in the sequence
      for (let i = 0; i < levelCategories.length; i++) {
        const category = levelCategories[i];
        const accessCheck = await this.checkCategoryAccess(studentId, category);
        const statusCheck = await this.getCategoryStatus(studentId, category);

        categoryProgress.push({
          sequence: i + 1,
          category: category,
          accessible: accessCheck.allowed,
          completed: statusCheck.completed,
          passed: statusCheck.passed,
          score: statusCheck.score,
          status: statusCheck.status,
          blockingReason: accessCheck.allowed ? null : accessCheck.reason,
          prerequisites: SKILL_PREREQUISITES[category] || []
        });
      }

      const nextAvailable = await this.getNextAvailableCategory(studentId);

      return {
        studentId: studentId,
        readingLevel: readingLevel,
        totalCategories: levelCategories.length,
        categoryProgress: categoryProgress,
        nextAvailable: nextAvailable,
        overallProgress: {
          completed: categoryProgress.filter(p => p.completed).length,
          passed: categoryProgress.filter(p => p.passed).length,
          remaining: categoryProgress.filter(p => !p.completed).length
        }
      };

    } catch (error) {
      console.error('[FLOW CONTROL] Error getting assessment flow summary:', error);
      return {
        error: 'System error getting flow summary',
        message: error.message
      };
    }
  }

  /**
   * Validate intervention eligibility with prerequisite checking
   * Ensures interventions can only be created for accessible categories
   *
   * @param {number} studentId - Student ID
   * @param {string} category - Category needing intervention
   * @returns {Object} Intervention eligibility status
   */
  static async validateInterventionEligibility(studentId, category) {
    try {
      // First check if category is accessible
      const accessCheck = await this.checkCategoryAccess(studentId, category);

      if (!accessCheck.allowed) {
        return {
          eligible: false,
          reason: 'Category not accessible - prerequisites not met',
          blockingFactors: accessCheck.blockingFactors,
          nextRequired: accessCheck.nextRequired,
          details: accessCheck.reason
        };
      }

      // Check category status
      const categoryStatus = await this.getCategoryStatus(studentId, category);

      if (!categoryStatus.completed) {
        return {
          eligible: false,
          reason: 'Category assessment not completed',
          details: 'Student must complete main assessment for this category first'
        };
      }

      if (categoryStatus.passed) {
        return {
          eligible: false,
          reason: 'Category already passed',
          details: `Student scored ${categoryStatus.score}% which meets the 75% threshold`
        };
      }

      // Check if intervention already attempted
      if (categoryStatus.interventionCompleted) {
        return {
          eligible: false,
          reason: 'Intervention already attempted',
          details: 'One-time intervention rule enforced - teacher revision required',
          recommendedAction: 'teacher_revision_required'
        };
      }

      // All checks passed - eligible for intervention
      return {
        eligible: true,
        reason: 'Intervention allowed',
        categoryScore: categoryStatus.score,
        details: `Student scored ${categoryStatus.score}% (below 75% threshold) and has not attempted intervention yet`
      };

    } catch (error) {
      console.error('[FLOW CONTROL] Error validating intervention eligibility:', error);
      return {
        eligible: false,
        reason: 'System error during validation',
        error: error.message
      };
    }
  }
}

module.exports = AssessmentFlowControlService;