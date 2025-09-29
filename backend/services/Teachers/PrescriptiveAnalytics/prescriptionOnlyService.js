/**
 * Prescription-Only Service - Doctor-Teacher-Student Model Implementation
 *
 * 🩺 DOCTOR ROLE: This service acts as the "Doctor" in the system:
 * - Analyzes student performance data (DIAGNOSIS)
 * - Prescribes specific interventions strategies (PRESCRIPTION)
 * - DOES NOT create questions or implement treatments
 * - Provides data-driven recommendations to teachers
 *
 * 👩‍🏫 TEACHER ROLE: Teachers act as "Treatment Providers":
 * - Receive detailed prescriptions from this service
 * - Create ALL intervention questions using templates
 * - Implement recommended strategies and techniques
 * - Re-edit interventions when students fail
 *
 * 📚 STUDENT ROLE: Students act as "Patients":
 * - Take teacher-created intervention assessments
 * - Benefit from data-driven prescriptions via teacher implementation
 *
 * This service provides ONLY diagnosis + prescription, never implementation.
 */

const mongoose = require('mongoose');
const StudentResponse = require('../../../models/Teachers/ManageProgress/studentResponseModel');
const CategoryResult = require('../../../models/Teachers/ManageProgress/categoryResultModel');
const PrescriptiveAnalysis = require('../../../models/Teachers/ManageProgress/prescriptiveAnalysisModel');
const User = require('../../../models/userModel');

const mathematicalModelsService = require('./mathematicalModelsService');
const errorPatternService = require('./errorPatternService');

class PrescriptionOnlyService {

  /**
   * Generate PRESCRIPTION ONLY (Doctor's role)
   * This method provides diagnosis and prescriptions, NOT implementations
   *
   * @param {string} categoryResultId - ID of the category_results record
   * @returns {Object} Prescription with teacher guidance
   */
  async generatePrescription(categoryResultId) {
    try {
      const categoryResult = await CategoryResult.findById(categoryResultId);

      if (!categoryResult) {
        throw new Error('Category result not found');
      }

      const studentId = categoryResult.studentId;

      // Fetch student data
      const student = await User.findOne({ idNumber: studentId });
      if (!student) {
        throw new Error(`Student with ID ${studentId} not found`);
      }

      const readingLevel = student.readingLevel || 'Low Emerging';

      // ✅ FIX: Fetch student responses ONLY for current reading level
      const responses = await StudentResponse.find({
        studentId,
        readingLevel: readingLevel  // Only get responses for the current reading level
      }).sort({ answeredAt: 1 });

      console.log(`[PRESCRIPTION] Found ${responses.length} responses for student ${studentId} at reading level ${readingLevel}`);

      // Extract failed categories from category result
      const failedCategories = categoryResult.categories.filter(cat => !cat.isPassed || cat.score < 75);
      console.log(`[PRESCRIPTION] Found ${failedCategories.length} failed categories:`, failedCategories.map(cat => cat.categoryName));

      // DIAGNOSIS: Analyze what's wrong
      const diagnosis = await this.generateDiagnosis(responses, categoryResult, readingLevel);

      // PRESCRIPTION: What should the teacher do?
      const prescription = await this.generateTeacherPrescription(
        diagnosis,
        categoryResult.categories,
        readingLevel,
        studentId
      );

      // Create the prescription record mapped to proper schema fields
      const prescriptionData = {
        studentId,
        categoryResultId,
        assessmentDate: categoryResult.assessmentDate || new Date(),
        assessmentType: 'main',
        readingLevel,

        // ✅ FIX: Add categoryId to prevent duplicate key errors
        // Since prescriptive analysis covers multiple categories, use the primary failed category
        // If no failed categories, create unique maintenance analysis identifier
        categoryId: failedCategories.length > 0
          ? failedCategories[0].categoryName
          : `maintenance_${readingLevel}_${Date.now()}`,

        // Map diagnosis to schema fields (use plain objects for Mongoose Maps)
        skillMastery: diagnosis.skillMastery || {},
        abilityEstimates: this.calculateAbilityEstimates(diagnosis.skillMastery) || {},
        errorPatterns: this.fixErrorPatternStructure(diagnosis.errorPatterns) || {},

        // Map intervention plan
        interventionPlan: this.mapToInterventionPlan(prescription),

        // Map insights
        insights: this.mapToInsights(diagnosis, prescription, categoryResult.categories),

        // Map research-based prescriptions to schema format (use plain object for Mongoose Map)
        researchBasedPrescriptions: this.mapToResearchBasedPrescriptions(prescription, diagnosis, categoryResult.categories) || {},

        // Legacy fields for backward compatibility
        strengths: diagnosis.primaryDifficulties.length === 0 ?
          Object.keys(diagnosis.skillMastery).filter(cat => diagnosis.skillMastery[cat].isPassed) : [],
        weaknesses: diagnosis.primaryDifficulties.map(d => `${d.category}: ${d.issue}`),
        recommendations: prescription.teacherActionItems ?
          prescription.teacherActionItems.map(item => `${item.category}: ${item.action}`) : [],

        createdAt: new Date(),
        updatedAt: new Date()
      };

      // Save prescription (not implementation)
      const prescriptiveAnalysis = new PrescriptiveAnalysis(prescriptionData);
      await prescriptiveAnalysis.save();

      console.log(`[DOCTOR] Generated prescription for student ${studentId}`);
      console.log(`[DOCTOR] Prescription summary: ${prescription.summary}`);

      return {
        type: 'prescription',
        role: 'doctor',
        diagnosis: diagnosis,
        prescription: prescription,
        teacherGuidance: this.generateTeacherGuidance(diagnosis, prescription),
        nextSteps: 'Teacher should create intervention questions based on this prescription',
        analysisId: prescriptiveAnalysis._id
      };

    } catch (error) {
      console.error('Error generating prescription:', error);
      throw error;
    }
  }

  /**
   * Generate comprehensive diagnosis of student's reading difficulties
   *
   * @param {Array} responses - Student responses
   * @param {Object} categoryResult - Category results
   * @param {string} readingLevel - Student's reading level
   * @returns {Object} Complete diagnosis
   */
  async generateDiagnosis(responses, categoryResult, readingLevel) {
    // Calculate skill mastery using BKT
    const skillMastery = await this.calculateSkillMastery(responses, readingLevel);

    // ✅ FIX: Only analyze error patterns from current reading level responses
    // Don't mix error patterns from previous reading levels
    console.log(`[ERROR PATTERNS] Analyzing error patterns for current reading level: ${readingLevel}`);
    console.log(`[ERROR PATTERNS] Using ${responses.length} responses from current reading level only`);

    const errorPatterns = await errorPatternService.analyzeErrorPatternsFromResponses(responses, readingLevel);

    // Determine severity levels
    const severityLevels = this.analyzeSeverityLevels(categoryResult.categories, skillMastery);

    // Identify root causes
    const rootCauses = this.identifyRootCauses(errorPatterns, skillMastery, responses);

    return {
      studentId: categoryResult.studentId,
      readingLevel,
      assessmentDate: categoryResult.assessmentDate,

      // Performance analysis
      skillMastery: skillMastery,
      errorPatterns: errorPatterns,
      severityLevels: severityLevels,
      rootCauses: rootCauses,

      // Overall diagnosis
      primaryDifficulties: this.identifyPrimaryDifficulties(errorPatterns, skillMastery),
      secondaryIssues: this.identifySecondaryIssues(errorPatterns, skillMastery),
      cognitiveFactors: this.assessCognitiveFactors(responses, errorPatterns),

      // Diagnostic summary
      diagnosisCode: this.generateDiagnosisCode(severityLevels, errorPatterns),
      diagnosisSummary: this.generateDiagnosisSummary(severityLevels, errorPatterns)
    };
  }

  /**
   * Generate teacher prescription based on diagnosis
   * This tells teachers WHAT to do, not HOW to implement it
   *
   * @param {Object} diagnosis - Student diagnosis
   * @param {Array} categoryResults - Category results
   * @param {string} readingLevel - Reading level
   * @param {number} studentId - Student ID
   * @returns {Object} Teacher prescription
   */
  async generateTeacherPrescription(diagnosis, categoryResults, readingLevel, studentId) {
    // Identify categories needing intervention (CLAUDE.md: only completed AND failed categories)
    const failedCategories = categoryResults.filter(cat =>
      !cat.isPassed && cat.isCompleted === true && cat.score > 0
    );

    console.log(`[PRESCRIPTION] Failed categories (completed & failed): [${failedCategories.map(c => c.categoryName).join(', ')}]`);
    console.log(`[PRESCRIPTION] Placeholder categories (not completed): [${categoryResults.filter(c => !c.isCompleted).map(c => c.categoryName).join(', ')}]`);

    if (failedCategories.length === 0) {
      return this.generateMaintenancePrescription(diagnosis, categoryResults, readingLevel);
    }

    // For failed categories, generate intervention prescriptions
    const interventionPrescriptions = {};

    for (const category of failedCategories) {
      interventionPrescriptions[category.categoryName] = {
        // PRESCRIPTION: What teacher should focus on
        interventionFocus: this.determineInterventionFocus(
          category.categoryName,
          diagnosis.errorPatterns[category.categoryName]
        ),

        // PRESCRIPTION: Recommended question count based on analytics
        recommendedQuestionCount: await this.calculateOptimalQuestionCount(
          diagnosis, category.categoryName, readingLevel
        ),

        // PRESCRIPTION: Specific skills to target
        targetSkills: this.identifyTargetSkills(
          category.categoryName,
          diagnosis.errorPatterns[category.categoryName],
          diagnosis.skillMastery[category.categoryName]
        ),

        // PRESCRIPTION: Teaching approach recommendations
        teachingApproach: this.recommendTeachingApproach(
          category.categoryName,
          diagnosis.cognitiveFactors,
          diagnosis.errorPatterns[category.categoryName]
        ),

        // PRESCRIPTION: Success criteria
        successCriteria: this.defineSuccessCriteria(category.categoryName, category.score),

        // PRESCRIPTION: Implementation timeline
        timeline: this.recommendTimeline(diagnosis.severityLevels[category.categoryName])
      };
    }

    return {
      type: 'intervention_required',
      priorityLevel: this.calculatePriorityLevel(failedCategories, diagnosis.severityLevels),
      interventionCategories: failedCategories.map(cat => cat.categoryName),
      interventionPrescriptions: interventionPrescriptions,

      // Overall prescription summary
      summary: this.generatePrescriptionSummary(interventionPrescriptions, diagnosis),

      // Teacher action items
      teacherActionItems: this.generateTeacherActionItems(interventionPrescriptions, diagnosis),

      // Monitoring recommendations
      progressMonitoring: this.recommendProgressMonitoring(failedCategories, diagnosis)
    };
  }

  /**
   * Calculate optimal question count based on data analytics
   * This is a PRESCRIPTION, not implementation
   */
  async calculateOptimalQuestionCount(diagnosis, categoryName, readingLevel) {
    const baseCountByLevel = {
      'Low Emerging': 8,
      'High Emerging': 10,
      'Developing': 12,
      'Transitioning': 14,
      'At Grade Level': 16
    };

    let baseCount = baseCountByLevel[readingLevel] || 10;

    // Adjust based on error severity
    const errorPattern = diagnosis.errorPatterns[categoryName];
    if (errorPattern) {
      const errorRate = this.getErrorRate(errorPattern);
      if (errorRate > 70) baseCount += 4; // Severe errors need more practice
      else if (errorRate > 50) baseCount += 2; // Moderate errors need some extra
      else if (errorRate < 30) baseCount -= 2; // Mild errors need fewer questions
    }

    // Adjust based on mastery level
    const mastery = diagnosis.skillMastery[categoryName];
    if (mastery && mastery.masteryProbability < 0.3) {
      baseCount += 3; // Very low mastery needs extensive practice
    } else if (mastery && mastery.masteryProbability > 0.6) {
      baseCount -= 2; // Higher mastery needs less practice
    }

    // Keep within reasonable bounds
    const minCount = 6;
    const maxCount = 18;
    const finalCount = Math.max(minCount, Math.min(maxCount, baseCount));

    return {
      recommendedCount: finalCount,
      rationale: `Based on ${readingLevel} level and error analysis`,
      factors: {
        baseForLevel: baseCountByLevel[readingLevel],
        errorAdjustment: this.getErrorRate(errorPattern || {}) > 50 ? 'increased' : 'standard',
        masteryAdjustment: mastery?.masteryProbability < 0.4 ? 'increased' : 'standard'
      }
    };
  }

  /**
   * Generate specific teacher guidance for implementing the prescription
   */
  generateTeacherGuidance(diagnosis, prescription) {
    if (prescription.type === 'intervention_required') {
      return {
        overview: `Student needs intervention in ${prescription.interventionCategories.length} categories`,

        // Step-by-step teacher instructions
        implementationSteps: [
          '1. Review the diagnosis and error patterns below',
          '2. Use the template system to create intervention questions',
          '3. Focus on the specific target skills identified',
          '4. Create the recommended number of questions for each category',
          '5. Monitor student progress using the success criteria provided'
        ],

        // Category-specific guidance
        categoryGuidance: Object.entries(prescription.interventionPrescriptions).map(([category, details]) => ({
          category,
          focus: details.interventionFocus,
          questionCount: details.recommendedQuestionCount.recommendedCount,
          targetSkills: details.targetSkills,
          approach: details.teachingApproach
        })),

        // Alert for severe cases
        alerts: this.generateAlerts(diagnosis, prescription)
      };
    }

    return {
      overview: 'Student performance is satisfactory - maintenance recommended',
      implementationSteps: ['Continue regular curriculum', 'Provide enrichment opportunities']
    };
  }

  // Helper methods for prescription generation

  async calculateSkillMastery(responses, readingLevel) {
    const skillMastery = {};

    // Group responses by category
    const responsesByCategory = this.groupResponsesByCategory(responses);

    // Get categories for this reading level
    const expectedCategories = this.getCategoriesForReadingLevel(readingLevel);

    for (const category of expectedCategories) {
      const categoryResponses = responsesByCategory[category] || [];

      if (categoryResponses.length === 0) {
        skillMastery[category] = {
          masteryProbability: 0.5, // Initial BKT probability
          lastUpdated: new Date(),
          totalQuestions: 0,
          correctAnswers: 0,
          score: 0,
          isPassed: false,
          responseHistory: []
        };
        continue;
      }

      // Process responses using existing BKT logic
      const bktResult = mathematicalModelsService.processBKTSequence(categoryResponses);

      // Calculate basic stats
      let correctCount, totalCount, score;

      if (category === 'Phonological Awareness') {
        // Special handling for matching questions
        const totalMatches = categoryResponses.reduce((sum, r) => sum + (r.totalMatches || 0), 0);
        const correctMatches = categoryResponses.reduce((sum, r) => sum + (r.correctMatches || 0), 0);

        correctCount = correctMatches;
        totalCount = totalMatches;
        score = totalMatches > 0 ? Math.round((correctMatches / totalMatches) * 100) : 0;

        // ✅ FIXED: Ensure BKT mastery probability aligns with actual performance
        const adjustedMasteryProbability = this.calculateRealisticMasteryProbability(score, bktResult.finalMastery);

        skillMastery[category] = {
          masteryProbability: adjustedMasteryProbability,
          lastUpdated: new Date(),
          totalQuestions: categoryResponses.length,
          totalPossibleMatches: totalMatches,
          correctMatches: correctMatches,
          score,
          isPassed: score >= 75,
          responseHistory: bktResult.responseHistory
        };
      } else {
        // Standard handling for other categories
        correctCount = categoryResponses.filter(r => r.isCorrect).length;
        totalCount = categoryResponses.length;
        score = Math.round((correctCount / totalCount) * 100);

        // ✅ FIXED: Ensure BKT mastery probability aligns with actual performance
        const adjustedMasteryProbability = this.calculateRealisticMasteryProbability(score, bktResult.finalMastery);

        skillMastery[category] = {
          masteryProbability: adjustedMasteryProbability,
          lastUpdated: new Date(),
          totalQuestions: totalCount,
          correctAnswers: correctCount,
          score,
          isPassed: score >= 75,
          responseHistory: bktResult.responseHistory
        };
      }
    }

    return skillMastery;
  }

  analyzeSeverityLevels(categories, skillMastery) {
    const severityLevels = {};

    categories.forEach(category => {
      const score = category.score || 0;
      const mastery = skillMastery[category.categoryName]?.masteryProbability || 0;

      let severity;
      if (score < 40 || mastery < 0.3) severity = 'severe';
      else if (score < 60 || mastery < 0.5) severity = 'moderate';
      else if (score < 75 || mastery < 0.7) severity = 'mild';
      else severity = 'none';

      severityLevels[category.categoryName] = {
        level: severity,
        score: score,
        mastery: mastery,
        needsIntervention: score < 75
      };
    });

    return severityLevels;
  }

  identifyRootCauses(errorPatterns, skillMastery, responses) {
    const causes = [];

    // Analyze response patterns for cognitive indicators
    if (responses.length > 0) {
      const avgResponseTime = responses.reduce((sum, r) => sum + (r.responseTime || 0), 0) / responses.length;
      if (avgResponseTime > 20) {
        causes.push('Processing speed difficulties may be impacting performance');
      }
    }

    // Analyze error patterns for specific deficits
    Object.entries(errorPatterns).forEach(([category, pattern]) => {
      if (pattern.matching_errors?.percentage > 60) {
        causes.push(`${category}: Sound discrimination difficulties`);
      }
      if (pattern.patinig_errors?.percentage > 50) {
        causes.push(`${category}: Vowel recognition weaknesses`);
      }
    });

    return causes;
  }

  identifyPrimaryDifficulties(errorPatterns, skillMastery) {
    const difficulties = [];

    Object.entries(skillMastery).forEach(([category, mastery]) => {
      if (mastery.masteryProbability < 0.4 && mastery.score < 60) {
        difficulties.push({
          category,
          issue: 'Fundamental skill gaps',
          severity: 'high',
          masteryLevel: mastery.masteryProbability
        });
      }
    });

    return difficulties.sort((a, b) => a.masteryLevel - b.masteryLevel);
  }

  identifySecondaryIssues(errorPatterns, skillMastery) {
    const issues = [];

    Object.entries(skillMastery).forEach(([category, mastery]) => {
      if (mastery.masteryProbability >= 0.4 && mastery.masteryProbability < 0.7) {
        issues.push({
          category,
          issue: 'Developing skills need reinforcement',
          severity: 'moderate'
        });
      }
    });

    return issues;
  }

  assessCognitiveFactors(responses, errorPatterns) {
    return {
      workingMemory: this.assessWorkingMemory(responses),
      processingSpeed: this.assessProcessingSpeed(responses),
      attention: this.assessAttention(responses, errorPatterns),
      auditoryProcessing: this.assessAuditoryProcessing(errorPatterns)
    };
  }

  generateDiagnosisCode(severityLevels, errorPatterns) {
    const severeCount = Object.values(severityLevels).filter(s => s.level === 'severe').length;
    const moderateCount = Object.values(severityLevels).filter(s => s.level === 'moderate').length;

    if (severeCount > 0) return `SEVERE-${severeCount}CAT`;
    if (moderateCount > 1) return `MODERATE-${moderateCount}CAT`;
    if (moderateCount === 1) return 'MODERATE-1CAT';
    return 'MILD-SUPPORT';
  }

  generateDiagnosisSummary(severityLevels, errorPatterns) {
    const severeCategories = Object.entries(severityLevels)
      .filter(([cat, sev]) => sev.level === 'severe')
      .map(([cat, sev]) => cat);

    const moderateCategories = Object.entries(severityLevels)
      .filter(([cat, sev]) => sev.level === 'moderate')
      .map(([cat, sev]) => cat);

    if (severeCategories.length > 0) {
      return `Severe difficulties in ${severeCategories.join(', ')} requiring intensive intervention`;
    }

    if (moderateCategories.length > 0) {
      return `Moderate difficulties in ${moderateCategories.join(', ')} requiring targeted support`;
    }

    return 'Mild support needs identified';
  }

  // Additional helper methods...

  determineInterventionFocus(categoryName, errorPattern) {
    if (!errorPattern) return 'General skill reinforcement';

    switch (categoryName) {
      case 'Phonological Awareness':
        if (errorPattern.matching_errors?.percentage > 60) {
          return 'Sound discrimination training';
        }
        return 'Phonological processing skills';

      case 'Alphabet Knowledge':
        if (errorPattern.patinig_errors?.count > 0) {
          return 'Vowel recognition and sound-symbol correspondence';
        }
        return 'Letter-sound correspondence';

      default:
        return `${categoryName} skill building`;
    }
  }

  identifyTargetSkills(categoryName, errorPattern, skillMastery) {
    const skills = [];

    if (skillMastery?.masteryProbability < 0.5) {
      skills.push(`Foundation ${categoryName.toLowerCase()} skills`);
    }

    if (errorPattern?.matching_errors?.confusionPairs) {
      errorPattern.matching_errors.confusionPairs.forEach(pair => {
        skills.push(`${pair.sounds.join('-')} discrimination`);
      });
    }

    return skills.length > 0 ? skills : [`Core ${categoryName.toLowerCase()} competencies`];
  }

  recommendTeachingApproach(categoryName, cognitiveFactors, errorPattern) {
    const approaches = [];

    if (cognitiveFactors.auditoryProcessing === 'below_average') {
      approaches.push('Visual-tactile multisensory approach');
    }

    if (cognitiveFactors.attention === 'limited') {
      approaches.push('Short, focused sessions with breaks');
    }

    approaches.push('Systematic, explicit instruction');
    approaches.push('Immediate corrective feedback');

    return approaches;
  }

  defineSuccessCriteria(categoryName, currentScore) {
    const targetScore = 75; // Passing threshold
    const improvementNeeded = targetScore - currentScore;

    return {
      passingScore: targetScore,
      currentScore: currentScore,
      improvementNeeded: improvementNeeded,
      milestones: [
        `Achieve ${Math.min(currentScore + Math.ceil(improvementNeeded/2), targetScore)}% accuracy`,
        `Maintain consistent performance across question types`,
        `Demonstrate transfer to novel contexts`
      ]
    };
  }

  recommendTimeline(severityLevel) {
    const timelines = {
      'severe': '6-8 weeks intensive intervention',
      'moderate': '4-6 weeks focused practice',
      'mild': '2-4 weeks targeted support',
      'none': 'Ongoing maintenance'
    };

    return timelines[severityLevel.level] || '4-6 weeks';
  }

  calculatePriorityLevel(failedCategories, severityLevels) {
    const severeCount = failedCategories
      .filter(cat => severityLevels[cat.categoryName]?.level === 'severe').length;

    if (severeCount > 1) return 'CRITICAL';
    if (severeCount === 1) return 'HIGH';
    if (failedCategories.length > 2) return 'MEDIUM';
    return 'LOW';
  }

  generatePrescriptionSummary(interventionPrescriptions, diagnosis) {
    const categories = Object.keys(interventionPrescriptions);
    const totalQuestions = Object.values(interventionPrescriptions)
      .reduce((sum, p) => sum + p.recommendedQuestionCount.recommendedCount, 0);

    return `Intervention needed for ${categories.join(', ')}. ` +
           `Teacher should create approximately ${totalQuestions} questions total, ` +
           `focusing on identified error patterns and target skills.`;
  }

  generateTeacherActionItems(interventionPrescriptions, diagnosis) {
    const actionItems = [];

    Object.entries(interventionPrescriptions).forEach(([category, details]) => {
      actionItems.push({
        category,
        action: `Create ${details.recommendedQuestionCount.recommendedCount} intervention questions`,
        focus: details.interventionFocus,
        approach: details.teachingApproach.join(', '),
        deadline: 'Within 1 week'
      });
    });

    return actionItems;
  }

  recommendProgressMonitoring(failedCategories, diagnosis) {
    return {
      frequency: failedCategories.length > 2 ? 'Daily' : 'Weekly',
      metrics: [
        'Accuracy on targeted skills',
        'Response consistency',
        'Error pattern reduction',
        'Transfer to new contexts'
      ],
      reviewSchedule: 'Weekly progress review meetings',
      escalationCriteria: 'If no improvement after 2 weeks of intervention'
    };
  }

  generateAlerts(diagnosis, prescription) {
    const alerts = [];

    if (prescription.priorityLevel === 'CRITICAL') {
      alerts.push({
        type: 'URGENT',
        message: 'Multiple severe skill deficits identified - consider comprehensive evaluation'
      });
    }

    const severeCategories = Object.entries(prescription.interventionPrescriptions)
      .filter(([cat, details]) => details.recommendedQuestionCount.recommendedCount > 15);

    if (severeCategories.length > 0) {
      alerts.push({
        type: 'HIGH_INTENSITY',
        message: 'High-intensity intervention recommended - break into shorter sessions'
      });
    }

    return alerts;
  }

  // Helper methods for cognitive assessment
  assessWorkingMemory(responses) {
    // Simplified assessment based on complex task performance
    return responses.length > 10 && responses.slice(-5).filter(r => r.isCorrect).length < 2 ?
      'below_average' : 'average';
  }

  assessProcessingSpeed(responses) {
    const avgTime = responses.reduce((sum, r) => sum + (r.responseTime || 0), 0) / responses.length;
    return avgTime > 15 ? 'below_average' : 'average';
  }

  assessAttention(responses, errorPatterns) {
    return responses.length < 5 ? 'limited' : 'adequate';
  }

  assessAuditoryProcessing(errorPatterns) {
    const hasAuditoryErrors = Object.values(errorPatterns).some(p =>
      p.matching_errors?.error_type === 'sound_discrimination'
    );
    return hasAuditoryErrors ? 'below_average' : 'average';
  }

  getErrorRate(errorPattern) {
    if (errorPattern.matching_errors?.percentage) {
      return errorPattern.matching_errors.percentage;
    }
    if (errorPattern.patinig_errors?.percentage) {
      return errorPattern.patinig_errors.percentage;
    }
    return 0;
  }

  generateMaintenancePrescription(diagnosis, categoryResults, readingLevel) {
    return {
      type: 'maintenance_recommended',
      summary: 'Student is performing well - focus on skill maintenance and enrichment',
      teacherActionItems: [
        {
          action: 'Continue regular curriculum',
          frequency: 'Daily',
          focus: 'Skill reinforcement'
        },
        {
          action: 'Provide enrichment activities',
          frequency: 'Weekly',
          focus: 'Advanced skill development'
        }
      ]
    };
  }

  getResearchEvidence(diagnosis, prescription) {
    return [
      {
        citation: 'National Reading Panel (2000)',
        relevance: 'Supports systematic intervention approach',
        application: 'Prescription follows evidence-based intervention principles'
      },
      {
        citation: 'Ehri, L.C. (2005)',
        relevance: 'Letter knowledge foundational to reading',
        application: 'Prescription prioritizes foundational skills based on diagnosis'
      }
    ];
  }

  // Helper methods
  groupResponsesByCategory(responses) {
    return responses.reduce((groups, response) => {
      const category = response.category;
      if (!groups[category]) {
        groups[category] = [];
      }
      groups[category].push(response);
      return groups;
    }, {});
  }

  getCategoriesForReadingLevel(readingLevel) {
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
   * Calculate IRT ability estimates from skill mastery data
   */
  calculateAbilityEstimates(skillMastery) {
    const abilityEstimates = {};

    Object.entries(skillMastery).forEach(([category, mastery]) => {
      // Convert score percentage to IRT scale (-3 to +3)
      const score = mastery.score || 0;
      let ability;

      if (score >= 95) ability = 2.0;
      else if (score >= 90) ability = 1.5;
      else if (score >= 85) ability = 1.0;
      else if (score >= 75) ability = 0.5;
      else if (score >= 65) ability = 0.0;
      else if (score >= 55) ability = -0.5;
      else if (score >= 45) ability = -1.0;
      else if (score >= 35) ability = -1.5;
      else ability = -2.0;

      abilityEstimates[category] = ability;
    });

    return abilityEstimates;
  }

  /**
   * Map prescription to intervention plan schema
   */
  mapToInterventionPlan(prescription) {
    if (prescription.type !== 'intervention_required') {
      return { required: false, priority: [], specificFocus: new Map() };
    }

    const specificFocus = new Map();
    Object.entries(prescription.interventionPrescriptions).forEach(([category, details]) => {
      specificFocus.set(category, {
        focus: details.interventionFocus,
        targetSounds: details.targetSkills.filter(skill => skill.includes('-')),
        targetPatterns: details.targetSkills.filter(skill => !skill.includes('-')),
        recommendedActivities: details.teachingApproach || [],
        questionDistribution: new Map([['total', details.recommendedQuestionCount.recommendedCount]])
      });
    });

    return {
      required: true,
      priority: prescription.interventionCategories,
      specificFocus: specificFocus
    };
  }

  /**
   * Map to insights schema
   */
  mapToInsights(diagnosis, prescription, categories) {
    // Only count completed categories for insights (CLAUDE.md sequential flow)
    const completedCategories = categories.filter(cat => cat.isCompleted === true);
    const passedCategories = completedCategories.filter(cat => cat.isPassed).length;
    const failedCategories = completedCategories.filter(cat => !cat.isPassed).length;
    const overallScore = completedCategories.length > 0 ?
      completedCategories.reduce((sum, cat) => sum + cat.score, 0) / completedCategories.length : 0;

    let recommendedAction;
    if (prescription.type === 'intervention_required') {
      if (prescription.priorityLevel === 'CRITICAL') {
        recommendedAction = 'face_to_face_required';
      } else {
        recommendedAction = 'immediate_intervention';
      }
    } else {
      recommendedAction = 'continue_assessment';
    }

    return {
      strengths: Object.keys(diagnosis.skillMastery).filter(cat => diagnosis.skillMastery[cat].isPassed),
      weaknesses: diagnosis.primaryDifficulties.map(d => `${d.category} - ${Math.round(d.masteryLevel * 100)}%`),
      overallReadiness: prescription.summary || 'Assessment completed',
      recommendedAction: recommendedAction,
      passedCategories: passedCategories,
      failedCategories: failedCategories,
      overallScore: Math.round(overallScore)
    };
  }

  /**
   * Fix error pattern structure to match schema expectations
   */
  fixErrorPatternStructure(errorPatterns) {
    const fixedPatterns = {};

    Object.entries(errorPatterns).forEach(([category, pattern]) => {
      fixedPatterns[category] = { ...pattern };

      // Fix sequential difficulty structure for Phonological Awareness
      if (category === 'Phonological Awareness' && pattern.matching_errors?.sequentialDifficulty) {
        const seqDiff = pattern.matching_errors.sequentialDifficulty;
        fixedPatterns[category].matching_errors.sequentialDifficulty = {
          twoSounds: seqDiff.twoSounds?.percentage || 0,
          threeSounds: seqDiff.threeSounds?.percentage || 0,
          fourSounds: seqDiff.fourSounds?.percentage || 0,
          workingMemoryCapacity: seqDiff.twoSounds?.percentage > 80 ? 'limited' : 'adequate'
        };
      }
    });

    return fixedPatterns;
  }

  /**
   * Map to research-based prescriptions schema
   */
  mapToResearchBasedPrescriptions(prescription, diagnosis, categories) {
    const prescriptions = {};

    categories.forEach(category => {
      const categoryName = category.categoryName;
      const isPassed = category.isPassed;

      if (isPassed) {
        // Maintenance and acceleration for passed categories
        prescriptions[categoryName] = {
          categoryStatus: 'passed',
          maintenanceRecommendations: {
            activities: [{
              activity: `Continue ${categoryName.toLowerCase()} practice`,
              purpose: 'Skill maintenance and reinforcement',
              frequency: 'Weekly',
              implementation: 'Integrated into regular curriculum',
              rationale: 'Maintain mastery while building advanced skills'
            }],
            researchFoundation: {
              primaryEvidence: [{
                citation: 'National Reading Panel (2000)',
                relevantFinding: 'Systematic skill maintenance prevents regression',
                applicationToStudent: `Student shows mastery in ${categoryName}`,
                strengthOfEvidence: 'strong'
              }],
              theoreticalFramework: 'Mastery Learning Theory',
              interventionApproach: 'Maintenance with enrichment'
            },
            implementationGuidance: {
              frequency: 'Weekly',
              duration: '10-15 minutes',
              integration: 'Embedded in regular instruction',
              monitoringIndicators: ['Maintained accuracy', 'Skill transfer']
            }
          },
          accelerationRecommendations: {
            nextLevelSkills: [{
              skill: `Advanced ${categoryName.toLowerCase()}`,
              targetMastery: '90% accuracy',
              timeframe: '4-6 weeks',
              prerequisiteCheck: 'Current mastery confirmed'
            }],
            bridgingActivities: [`Connect ${categoryName.toLowerCase()} to reading fluency`],
            enrichmentFocus: `Complex ${categoryName.toLowerCase()} applications`,
            timelineGuidance: '2-4 weeks for next level introduction'
          },
          // Required field for all categories per schema
          interventionPrescription: {
            primaryApproach: 'balanced_literacy',
            specificTechniques: [{
              technique: 'Skill maintenance and enrichment',
              description: `Maintain mastery in ${categoryName.toLowerCase()} while building advanced skills`,
              duration: 'Ongoing',
              materials: 'Regular curriculum materials with enrichment activities',
              progressCriteria: 'Maintained 85%+ accuracy with skill transfer',
              researchBasis: 'Mastery learning and spaced practice principles'
            }],
            intensityLevel: 'moderate'
          }
        };
      } else {
        // Intensive intervention for failed categories
        const interventionDetails = prescription.interventionPrescriptions && prescription.interventionPrescriptions[categoryName];
        if (interventionDetails) {
          prescriptions[categoryName] = {
            categoryStatus: 'failed',
            deficitAnalysis: {
              specificDeficits: [{
                deficit: interventionDetails.interventionFocus,
                severity: diagnosis.severityLevels[categoryName]?.level || 'moderate',
                manifestation: `Score: ${category.score}% (below 75% threshold)`,
                errorRate: `${100 - category.score}%`,
                researchEvidence: 'Evidence-based deficit identification'
              }],
              rootCauseAnalysis: diagnosis.rootCauses.find(cause => cause.includes(categoryName)) || 'Skill gap identified',
              cognitiveFactors: diagnosis.cognitiveFactors ? Object.keys(diagnosis.cognitiveFactors) : [],
              researchClassification: `${categoryName} learning difficulty`
            },
            interventionPrescription: {
              primaryApproach: 'multisensory_structured',
              specificTechniques: [{
                technique: interventionDetails.interventionFocus,
                description: `Targeted ${categoryName.toLowerCase()} intervention`,
                duration: interventionDetails.timeline || '4-6 weeks',
                materials: 'Teacher-created intervention questions from templates',
                progressCriteria: '75% accuracy on intervention assessment',
                researchBasis: 'Systematic, explicit instruction principles'
              }],
              intensityLevel: diagnosis.severityLevels[categoryName]?.level === 'severe' ? 'highly_intensive' : 'high',
              sessionStructure: {
                optimalLength: '15-20 minutes',
                sessionComponents: interventionDetails.teachingApproach || ['Systematic instruction', 'Guided practice'],
                breakPattern: 'Short breaks every 10 minutes'
              },
              materialRecommendations: [
                `Create ${interventionDetails.recommendedQuestionCount.recommendedCount} intervention questions using templates`,
                'Focus on identified error patterns',
                'Use multisensory approach'
              ],
              progressMonitoring: {
                frequency: 'Weekly',
                keyIndicators: ['Accuracy improvement', 'Error pattern reduction'],
                dataCollectionMethod: 'Intervention assessment performance'
              }
            },
            escalationProtocol: {
              triggers: [{
                trigger: 'No improvement after 2 weeks',
                approach: 'Increase intervention intensity',
                researchFoundation: 'Response to Intervention (RTI) model',
                specificTechniques: [{
                  technique: 'Intensive one-on-one instruction',
                  purpose: 'Address persistent learning difficulties',
                  implementation: 'Daily 20-minute sessions',
                  materials: ['Teacher-created materials', 'Multisensory aids'],
                  progression: 'Gradual skill building',
                  researchBasis: 'Systematic synthetic phonics approach',
                  researchEvidence: 'Evidence-based intervention research'
                }],
                intensityRecommendations: {
                  duration: '4-6 weeks intensive',
                  frequency: 'Daily sessions',
                  totalIntervention: '20-30 hours',
                  researchSupport: 'RTI framework guidelines'
                }
              }]
            }
          };
        }
      }
    });

    return prescriptions;
  }

  /**
   * ✅ FIXED: Calculate realistic mastery probability that aligns with actual performance
   * Prevents BKT from showing unrealistic mastery levels when actual performance is low
   *
   * @param {number} score - Actual score percentage (0-100)
   * @param {number} bktMastery - BKT calculated mastery (0-1)
   * @returns {number} Adjusted mastery probability that makes sense
   */
  calculateRealisticMasteryProbability(score, bktMastery) {
    // Convert score to 0-1 scale
    const scoreRatio = score / 100;

    // If the BKT mastery is way higher than the actual performance, adjust it
    const maxReasonableMastery = scoreRatio + 0.15; // Allow 15% optimism above actual score
    const minReasonableMastery = Math.max(0.05, scoreRatio - 0.1); // Don't go below 5% or too far below score

    console.log(`[BKT ADJUSTMENT] Score: ${score}%, ScoreRatio: ${scoreRatio}, BKT: ${bktMastery}, MaxReasonable: ${maxReasonableMastery}, MinReasonable: ${minReasonableMastery}`);

    // If BKT is reasonable, use it. Otherwise, constrain it.
    if (bktMastery >= minReasonableMastery && bktMastery <= maxReasonableMastery) {
      console.log(`[BKT ADJUSTMENT] BKT is reasonable, using original: ${bktMastery}`);
      return Math.round(bktMastery * 1000) / 1000; // Keep original if reasonable
    }

    // Adjust BKT to be more realistic based on actual performance
    const adjustedMastery = Math.max(minReasonableMastery, Math.min(maxReasonableMastery, scoreRatio + 0.1));
    console.log(`[BKT ADJUSTMENT] BKT unreasonable, adjusting to: ${adjustedMastery}`);

    return Math.round(adjustedMastery * 1000) / 1000;
  }
}

module.exports = new PrescriptionOnlyService();