/**
 * Comprehensive Intervention Revision Service
 *
 * This service manages the complete intervention retake and revision system
 * supporting the Doctor-Teacher-Student model with multiple intervention attempts:
 *
 * Flow:
 * 1. Student takes intervention → fails (< 75%)
 * 2. Teacher receives revision guidance
 * 3. Teacher revises intervention_assessment questions (creates version 2)
 * 4. Student retakes revised intervention
 * 5. New intervention_results created and linked
 * 6. Process repeats until student passes or escalation needed
 *
 * Key Features:
 * - Dynamic intervention versioning
 * - Multiple intervention_results tracking
 * - Teacher revision guidance generation
 * - Automatic retry enablement
 * - Complete intervention history tracking
 */

const InterventionAssessment = require('../../models/Teachers/ManageProgress/interventionAssessmentModel');
const InterventionResults = require('../../models/Teachers/ManageProgress/interventionResultsModel');
const InterventionResponse = require('../../models/Teachers/ManageProgress/interventionResponseModel');
const CategoryResults = require('../../models/Teachers/ManageProgress/categoryResultModel');
const InterventionResultsAnalysisService = require('./InterventionResultsAnalysisService');

class InterventionRevisionService {

  /**
   * Process intervention completion and determine next steps
   * This is the main entry point called when student completes an intervention
   */
  static async processInterventionCompletion(interventionAssessmentId, studentId) {
    console.log(`[INTERVENTION REVISION] 🔄 Processing intervention completion...`);
    console.log(`[INTERVENTION REVISION] Student: ${studentId}, Assessment: ${interventionAssessmentId}`);

    try {
      // Step 1: Generate comprehensive intervention results analysis
      const interventionResults = await InterventionResultsAnalysisService.generateComprehensiveInterventionResults(
        interventionAssessmentId,
        studentId
      );

      // Step 2: Link results to intervention assessment
      const interventionAssessment = await this.linkResultsToAssessment(
        interventionAssessmentId,
        interventionResults
      );

      // Step 3: Determine next steps based on results
      const nextSteps = await this.determineNextSteps(interventionResults, interventionAssessment);

      // Step 4: Process next steps
      const processResult = await this.processNextSteps(nextSteps, interventionResults, interventionAssessment);

      console.log(`[INTERVENTION REVISION] ✅ Intervention completion processed: ${nextSteps.action}`);
      return {
        success: true,
        interventionResults: interventionResults,
        nextSteps: nextSteps,
        processResult: processResult
      };

    } catch (error) {
      console.error(`[INTERVENTION REVISION] ❌ Failed to process intervention completion:`, error);
      throw error;
    }
  }

  /**
   * Link intervention results to assessment with tracking
   */
  static async linkResultsToAssessment(interventionAssessmentId, interventionResults) {
    console.log(`[INTERVENTION REVISION] 🔗 Linking intervention results to assessment...`);

    const interventionAssessment = await InterventionAssessment.findById(interventionAssessmentId);
    if (!interventionAssessment) {
      throw new Error(`Intervention assessment not found: ${interventionAssessmentId}`);
    }

    // Add intervention result to tracking array
    await interventionAssessment.addInterventionResult(
      interventionResults._id,
      interventionResults.score,
      interventionResults.isPassed,
      'initial_attempt'
    );

    console.log(`[INTERVENTION REVISION] ✅ Results linked successfully`);
    return interventionAssessment;
  }

  /**
   * Determine next steps based on intervention results
   */
  static async determineNextSteps(interventionResults, interventionAssessment) {
    console.log(`[INTERVENTION REVISION] 🎯 Determining next steps...`);

    const { score, isPassed, improvement, category } = interventionResults;
    const attemptCount = interventionAssessment.getAttemptCount();

    let action, reason, priority, guidance;

    if (isPassed) {
      // ✅ INTERVENTION PASSED - Student succeeded!
      action = 'category_completion';
      reason = `Student passed intervention with ${score}% (≥ 75%)`;
      priority = 'success';
      guidance = {
        type: 'success',
        message: 'Student successfully completed intervention!',
        categoryStatus: 'passed',
        nextAction: 'proceed_to_next_category'
      };

    } else if (improvement >= 15 && score >= 65) {
      // 📝 NEAR-MISS - Strong improvement, teacher revision recommended
      action = 'teacher_revision';
      reason = `Strong improvement (+${improvement}%) but failed (${score}%). Near-miss case.`;
      priority = 'medium';
      guidance = await this.generateTeacherRevisionGuidance(interventionResults, 'near_miss');

    } else if (improvement >= 5 && score >= 50) {
      // 📝 MODERATE IMPROVEMENT - Teacher revision with more changes
      action = 'teacher_revision';
      reason = `Moderate improvement (+${improvement}%) but failed (${score}%). Needs revision.`;
      priority = 'high';
      guidance = await this.generateTeacherRevisionGuidance(interventionResults, 'moderate_revision');

    } else if (attemptCount >= 3) {
      // 🚨 ESCALATION - Multiple attempts failed, intensive support needed
      action = 'intensive_escalation';
      reason = `${attemptCount} attempts completed with minimal progress. Escalation required.`;
      priority = 'critical';
      guidance = await this.generateEscalationGuidance(interventionResults, attemptCount);

    } else {
      // 📝 MAJOR REVISION - Poor improvement, significant changes needed
      action = 'teacher_revision';
      reason = `Poor improvement (+${improvement}%, ${score}%). Major revision needed.`;
      priority = 'critical';
      guidance = await this.generateTeacherRevisionGuidance(interventionResults, 'major_revision');
    }

    console.log(`[INTERVENTION REVISION] 📋 Next steps determined: ${action} (${priority})`);
    console.log(`[INTERVENTION REVISION] Reason: ${reason}`);

    return {
      action,
      reason,
      priority,
      guidance,
      category,
      studentId: interventionResults.studentId,
      attemptCount,
      score,
      improvement
    };
  }

  /**
   * Generate teacher revision guidance based on intervention results
   */
  static async generateTeacherRevisionGuidance(interventionResults, revisionType) {
    const { score, improvement, category, insights } = interventionResults;
    const recommendations = interventionResults.researchBasedPrescriptions[category];

    let revisionPriority, expectedImpact, modifications;

    switch (revisionType) {
      case 'near_miss':
        revisionPriority = 'medium';
        expectedImpact = '5-10% improvement expected with minor adjustments';
        modifications = [
          'Reduce question difficulty slightly',
          'Add visual cues for support',
          'Include audio replay option',
          'Provide immediate feedback'
        ];
        break;

      case 'moderate_revision':
        revisionPriority = 'high';
        expectedImpact = '10-20% improvement expected with targeted changes';
        modifications = [
          'Simplify complex questions',
          'Reduce cognitive load',
          'Add multisensory supports',
          'Focus on error patterns',
          'Increase scaffolding'
        ];
        break;

      case 'major_revision':
        revisionPriority = 'critical';
        expectedImpact = '20-30% improvement needed with comprehensive redesign';
        modifications = [
          'Complete intervention redesign',
          'Reduce question count',
          'Lower difficulty level',
          'Add extensive supports',
          'Consider alternative approaches'
        ];
        break;

      default:
        revisionPriority = 'medium';
        expectedImpact = '10-15% improvement expected';
        modifications = ['General revision recommended'];
    }

    return {
      type: 'teacher_revision',
      revisionType: revisionType,
      revisionPriority: revisionPriority,
      currentPerformance: {
        score: score,
        improvement: improvement,
        category: category
      },
      revisionRecommendations: {
        specificChanges: modifications,
        expectedImpact: expectedImpact,
        estimatedSuccess: this.calculateSuccessProbability(score, improvement),
        targetScore: 75
      },
      implementationSteps: [
        '1. Review current intervention questions',
        '2. Identify problematic questions based on error patterns',
        '3. Apply recommended modifications',
        '4. Test changes with student',
        '5. Monitor improvement'
      ],
      supportFeatures: [
        'Visual cues and supports',
        'Audio replay functionality',
        'Immediate feedback',
        'Progress indicators',
        'Reduced cognitive load'
      ],
      researchBasis: recommendations?.teacherRevisionGuidance || {
        rationale: 'Evidence-based intervention modification principles',
        expectedOutcome: 'Improved student performance through targeted adjustments'
      }
    };
  }

  /**
   * Generate escalation guidance for failed interventions
   */
  static async generateEscalationGuidance(interventionResults, attemptCount) {
    const { score, category, insights } = interventionResults;

    return {
      type: 'intensive_escalation',
      escalationReason: `${attemptCount} intervention attempts with limited progress`,
      escalationLevel: 'high',
      currentStatus: {
        attempts: attemptCount,
        bestScore: score,
        category: category,
        pattern: 'persistent_difficulties'
      },
      recommendedActions: [
        'Face-to-face intensive intervention',
        'Individual educational support',
        'Specialized reading instruction',
        'Multi-sensory learning approaches',
        'Consider learning disability assessment'
      ],
      intensityLevel: 'highly_intensive',
      supportStructure: {
        frequency: 'Daily 20-30 minute sessions',
        duration: '4-6 weeks minimum',
        approach: 'One-on-one specialized instruction',
        monitoring: 'Weekly progress assessment'
      },
      nextSteps: [
        'Refer to reading specialist',
        'Consider comprehensive evaluation',
        'Implement intensive face-to-face support',
        'Monitor closely for progress indicators'
      ]
    };
  }

  /**
   * Calculate success probability for teacher revision
   */
  static calculateSuccessProbability(currentScore, improvement) {
    if (improvement >= 15 && currentScore >= 65) return 0.85; // High probability
    if (improvement >= 10 && currentScore >= 55) return 0.70; // Good probability
    if (improvement >= 5 && currentScore >= 45) return 0.55;  // Moderate probability
    return 0.35; // Low probability
  }

  /**
   * Process next steps based on determination
   */
  static async processNextSteps(nextSteps, interventionResults, interventionAssessment) {
    console.log(`[INTERVENTION REVISION] ⚙️ Processing next steps: ${nextSteps.action}`);

    switch (nextSteps.action) {
      case 'category_completion':
        return await this.processCategoryCompletion(interventionResults, interventionAssessment);

      case 'teacher_revision':
        return await this.processTeacherRevision(nextSteps, interventionResults, interventionAssessment);

      case 'intensive_escalation':
        return await this.processIntensiveEscalation(nextSteps, interventionResults, interventionAssessment);

      default:
        throw new Error(`Unknown next step action: ${nextSteps.action}`);
    }
  }

  /**
   * Process category completion (intervention passed)
   */
  static async processCategoryCompletion(interventionResults, interventionAssessment) {
    console.log(`[INTERVENTION REVISION] 🎉 Processing category completion...`);

    const { studentId, category, score } = interventionResults;

    // Update category_results to reflect successful intervention
    await this.updateCategoryResultsForSuccess(studentId, category, score, interventionResults._id);

    // Mark intervention as successfully completed
    await interventionAssessment.markAsCompleted(interventionResults._id);

    console.log(`[INTERVENTION REVISION] ✅ Category completion processed - student can progress`);
    return {
      type: 'category_completion',
      success: true,
      message: `Student successfully completed ${category} intervention`,
      categoryStatus: 'passed',
      categoryScore: score,
      nextAction: 'proceed_to_next_category'
    };
  }

  /**
   * Process teacher revision preparation
   */
  static async processTeacherRevision(nextSteps, interventionResults, interventionAssessment) {
    console.log(`[INTERVENTION REVISION] 📝 Processing teacher revision preparation...`);

    const revisionGuidance = nextSteps.guidance;

    // Create revision guidance record for teacher dashboard
    const revisionRecord = {
      studentId: interventionResults.studentId,
      category: interventionResults.category,
      interventionAssessmentId: interventionAssessment._id,
      interventionResultsId: interventionResults._id,
      revisionType: revisionGuidance.revisionType,
      priority: nextSteps.priority,
      guidance: revisionGuidance,
      createdAt: new Date(),
      status: 'pending_teacher_action'
    };

    // Enable intervention for revision (student can retake after teacher edits)
    await this.enableInterventionRetake(interventionAssessment._id, 'teacher_revision');

    console.log(`[INTERVENTION REVISION] ✅ Teacher revision preparation completed`);
    return {
      type: 'teacher_revision',
      success: true,
      message: `Teacher revision guidance generated for ${interventionResults.category}`,
      revisionGuidance: revisionRecord,
      nextAction: 'teacher_should_revise_intervention'
    };
  }

  /**
   * Process intensive escalation
   */
  static async processIntensiveEscalation(nextSteps, interventionResults, interventionAssessment) {
    console.log(`[INTERVENTION REVISION] 🚨 Processing intensive escalation...`);

    const escalationGuidance = nextSteps.guidance;

    // Create escalation record for administrative review
    const escalationRecord = {
      studentId: interventionResults.studentId,
      category: interventionResults.category,
      interventionAssessmentId: interventionAssessment._id,
      escalationLevel: escalationGuidance.escalationLevel,
      attemptCount: nextSteps.attemptCount,
      reason: nextSteps.reason,
      guidance: escalationGuidance,
      createdAt: new Date(),
      status: 'requires_specialist_intervention'
    };

    // Mark category as requiring intensive support
    await this.markCategoryForIntensiveSupport(
      interventionResults.studentId,
      interventionResults.category,
      escalationRecord
    );

    console.log(`[INTERVENTION REVISION] ✅ Intensive escalation processing completed`);
    return {
      type: 'intensive_escalation',
      success: true,
      message: `Escalation triggered for ${interventionResults.category} - specialist intervention required`,
      escalationRecord: escalationRecord,
      nextAction: 'specialist_intervention_required'
    };
  }

  /**
   * Handle teacher revision of intervention assessment
   */
  static async handleTeacherRevision(interventionAssessmentId, teacherId, revisionData) {
    console.log(`[INTERVENTION REVISION] 👩‍🏫 Handling teacher revision...`);

    const interventionAssessment = await InterventionAssessment.findById(interventionAssessmentId);
    if (!interventionAssessment) {
      throw new Error(`Intervention assessment not found: ${interventionAssessmentId}`);
    }

    // Create new revision of the intervention
    await interventionAssessment.createRevision(
      teacherId,
      revisionData.changes,
      revisionData.modifiedQuestions
    );

    // Enable intervention for student retake
    await this.enableInterventionRetake(interventionAssessmentId, 'teacher_revision');

    console.log(`[INTERVENTION REVISION] ✅ Teacher revision completed - intervention ready for retake`);
    return {
      success: true,
      message: 'Intervention revised successfully',
      revisionNumber: interventionAssessment.revisionNumber,
      enabledForRetake: true
    };
  }

  /**
   * Handle student retake of revised intervention
   */
  static async handleStudentRetake(interventionAssessmentId, studentId) {
    console.log(`[INTERVENTION REVISION] 🔄 Handling student retake...`);

    // Generate new comprehensive analysis for the retake
    const retakeResults = await InterventionResultsAnalysisService.handleInterventionRetake(
      interventionAssessmentId,
      studentId,
      await this.getRevisionNumber(interventionAssessmentId)
    );

    // Link retake results to intervention assessment
    const interventionAssessment = await InterventionAssessment.findById(interventionAssessmentId);
    await interventionAssessment.addInterventionResult(
      retakeResults._id,
      retakeResults.score,
      retakeResults.isPassed,
      'teacher_revision'
    );

    // Process retake completion
    const completionResult = await this.processInterventionCompletion(
      interventionAssessmentId,
      studentId
    );

    console.log(`[INTERVENTION REVISION] ✅ Student retake completed and processed`);
    return {
      success: true,
      retakeResults: retakeResults,
      completionResult: completionResult
    };
  }

  /**
   * Helper methods
   */
  static async updateCategoryResultsForSuccess(studentId, category, score, interventionResultsId) {
    // This will be handled by the InterventionResultsAnalysisService
    console.log(`[INTERVENTION REVISION] ✅ Category results will be updated by analysis service`);
  }

  static async enableInterventionRetake(interventionAssessmentId, reason) {
    // Get intervention assessment details
    const intervention = await InterventionAssessment.findById(interventionAssessmentId);
    if (!intervention) {
      throw new Error(`Intervention assessment not found: ${interventionAssessmentId}`);
    }

    // Update intervention_assessment status for retake
    await InterventionAssessment.findByIdAndUpdate(
      interventionAssessmentId,
      {
        $set: {
          status: 'active',
          startedAt: null,
          completedAt: null
        }
      }
    );

    console.log(`[INTERVENTION REVISION] ✅ Intervention enabled for retake (${reason})`);

    // CRITICAL FIX: Also restore category_results currentInterventionId for revision retakes
    if (reason === 'teacher_revision') {
      console.log(`[INTERVENTION REVISION] 🔄 Restoring category_results currentInterventionId for teacher revision...`);

      const CategoryResult = require('../../models/Teachers/ManageProgress/categoryResultModel');

      // Find and update the category_results
      const updateResult = await CategoryResult.updateOne(
        {
          studentId: intervention.studentId,
          'categories.categoryName': intervention.category
        },
        {
          $set: {
            'categories.$.currentInterventionId': interventionAssessmentId,
            'categories.$.interventionCompleted': false,  // Reset completion status for revision
            'categories.$.lastUpdated': new Date()
          }
        }
      );

      if (updateResult.modifiedCount > 0) {
        console.log(`[INTERVENTION REVISION] ✅ Restored currentInterventionId ${interventionAssessmentId} for student ${intervention.studentId} category ${intervention.category}`);
      } else {
        console.warn(`[INTERVENTION REVISION] ⚠️ No category_results found to update for student ${intervention.studentId} category ${intervention.category}`);

        // Additional attempt: Try to find any category_results for this student to debug
        const debugCategoryResults = await CategoryResult.find({ studentId: intervention.studentId });
        console.log(`[INTERVENTION REVISION] DEBUG: Found ${debugCategoryResults.length} category_results for student ${intervention.studentId}`);

        for (const result of debugCategoryResults) {
          const categoryData = result.categories?.find(cat => cat.categoryName === intervention.category);
          if (categoryData) {
            console.log(`[INTERVENTION REVISION] DEBUG: Found category ${intervention.category} data:`, {
              currentInterventionId: categoryData.currentInterventionId,
              interventionCompleted: categoryData.interventionCompleted,
              isPassed: categoryData.isPassed,
              score: categoryData.score
            });
          }
        }
      }
    }
  }

  /**
   * Data consistency repair utility - Fix corrupted currentInterventionId states
   * Repairs cases where active interventions have null currentInterventionId
   */
  static async repairDataConsistency(studentId = null, interventionAssessmentId = null) {
    console.log(`[INTERVENTION REVISION] 🔧 STARTING DATA CONSISTENCY REPAIR...`);

    const CategoryResult = require('../../models/Teachers/ManageProgress/categoryResultModel');
    const InterventionAssessment = require('../../models/Teachers/ManageProgress/interventionAssessmentModel');

    let repairResults = {
      scanned: 0,
      corrupted: 0,
      repaired: 0,
      errors: [],
      details: []
    };

    try {
      // Build query filters
      let interventionQuery = { status: 'active' };
      if (interventionAssessmentId) {
        interventionQuery._id = interventionAssessmentId;
      }
      if (studentId) {
        interventionQuery.studentId = studentId;
      }

      // Find all active interventions
      const activeInterventions = await InterventionAssessment.find(interventionQuery);
      console.log(`[INTERVENTION REVISION] Found ${activeInterventions.length} active interventions to check`);

      for (const intervention of activeInterventions) {
        repairResults.scanned++;

        // Find corresponding category_results
        const categoryResults = await CategoryResult.findOne({
          studentId: intervention.studentId,
          'categories.categoryName': intervention.category
        });

        if (!categoryResults) {
          repairResults.errors.push(`No category_results found for student ${intervention.studentId} category ${intervention.category}`);
          continue;
        }

        const categoryData = categoryResults.categories?.find(cat => cat.categoryName === intervention.category);
        if (!categoryData) {
          repairResults.errors.push(`Category ${intervention.category} not found in category_results for student ${intervention.studentId}`);
          continue;
        }

        // Check for corruption patterns
        const isCorrupted = (
          // Pattern 1: currentInterventionId is null but intervention is active
          (categoryData.currentInterventionId === null && intervention.status === 'active') ||
          // Pattern 2: interventionCompleted is true but intervention is still active
          (categoryData.interventionCompleted === true && intervention.status === 'active' && !categoryData.isPassed) ||
          // Pattern 3: currentInterventionId points to wrong intervention
          (categoryData.currentInterventionId && categoryData.currentInterventionId.toString() !== intervention._id.toString())
        );

        if (isCorrupted) {
          repairResults.corrupted++;
          console.log(`[INTERVENTION REVISION] 🚨 CORRUPTION DETECTED:`, {
            studentId: intervention.studentId,
            category: intervention.category,
            interventionId: intervention._id.toString(),
            currentInterventionId: categoryData.currentInterventionId?.toString() || 'null',
            interventionCompleted: categoryData.interventionCompleted,
            isPassed: categoryData.isPassed,
            interventionStatus: intervention.status
          });

          // Repair the corruption
          const updateResult = await CategoryResult.updateOne(
            {
              studentId: intervention.studentId,
              'categories.categoryName': intervention.category
            },
            {
              $set: {
                'categories.$.currentInterventionId': intervention._id,
                'categories.$.interventionCompleted': false,  // Reset since intervention is still active
                'categories.$.lastUpdated': new Date()
              }
            }
          );

          if (updateResult.modifiedCount > 0) {
            repairResults.repaired++;
            const repairDetail = {
              studentId: intervention.studentId,
              category: intervention.category,
              interventionId: intervention._id.toString(),
              action: 'restored_currentInterventionId',
              previousValue: categoryData.currentInterventionId?.toString() || 'null',
              newValue: intervention._id.toString()
            };
            repairResults.details.push(repairDetail);
            console.log(`[INTERVENTION REVISION] ✅ REPAIRED:`, repairDetail);
          } else {
            repairResults.errors.push(`Failed to update category_results for student ${intervention.studentId} category ${intervention.category}`);
          }
        }
      }

      console.log(`[INTERVENTION REVISION] 🔧 DATA CONSISTENCY REPAIR COMPLETED:`, {
        scanned: repairResults.scanned,
        corrupted: repairResults.corrupted,
        repaired: repairResults.repaired,
        errors: repairResults.errors.length
      });

      return repairResults;

    } catch (error) {
      console.error(`[INTERVENTION REVISION] ❌ DATA CONSISTENCY REPAIR ERROR:`, error);
      repairResults.errors.push(error.message);
      return repairResults;
    }
  }

  static async markCategoryForIntensiveSupport(studentId, category, escalationRecord) {
    const categoryResults = await CategoryResults.findOne({ studentId: studentId });
    if (categoryResults) {
      const categoryIndex = categoryResults.categories.findIndex(cat => cat.categoryName === category);
      if (categoryIndex !== -1) {
        categoryResults.categories[categoryIndex].interventionRequired = true;
        categoryResults.categories[categoryIndex].escalationRequired = true;
        categoryResults.categories[categoryIndex].escalationReason = escalationRecord.reason;
        await categoryResults.save();
      }
    }

    console.log(`[INTERVENTION REVISION] ✅ Category marked for intensive support`);
  }

  static async getRevisionNumber(interventionAssessmentId) {
    const assessment = await InterventionAssessment.findById(interventionAssessmentId);
    return assessment ? assessment.revisionNumber : 1;
  }

  /**
   * Get intervention status for student
   */
  static async getInterventionStatus(studentId, category) {
    const interventionAssessment = await InterventionAssessment.findOne({
      studentId: studentId,
      category: category
    }).sort({ createdAt: -1 });

    if (!interventionAssessment) {
      return {
        hasIntervention: false,
        status: 'no_intervention_found'
      };
    }

    const attempts = interventionAssessment.getAllInterventionAttempts();
    const latestAttempt = interventionAssessment.getLatestInterventionResult();
    const hasPassedAny = interventionAssessment.hasPassedAnyAttempt();

    return {
      hasIntervention: true,
      interventionAssessmentId: interventionAssessment._id,
      revisionNumber: interventionAssessment.revisionNumber,
      totalAttempts: attempts.length,
      latestAttempt: latestAttempt,
      hasPassedAny: hasPassedAny,
      status: hasPassedAny ? 'passed' : 'failed',
      canRetake: interventionAssessment.status === 'active'
    };
  }
}

module.exports = InterventionRevisionService;