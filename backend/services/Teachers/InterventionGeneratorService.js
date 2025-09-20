const mongoose = require('mongoose');
const PrescriptiveAnalysis = require('../../models/Teachers/ManageProgress/prescriptiveAnalysisModel');
const InterventionAssessment = require('../../models/Teachers/ManageProgress/interventionAssessmentModel');
const InterventionResponse = require('../../models/Teachers/ManageProgress/interventionResponseModel');
const InterventionResults = require('../../models/Teachers/ManageProgress/interventionResultsModel');
const TemplateQuestion = require('../../models/Teachers/ManageProgress/templatesQuestionsModel');
const TemplateChoice = require('../../models/Teachers/ManageProgress/templatesChoicesModel');
const SentenceTemplate = require('../../models/Teachers/ManageProgress/sentenceTemplateModel');
const MainAssessment = require('../../models/Teachers/mainAssessmentModel');
const CategoryResult = require('../../models/Teachers/ManageProgress/categoryResultModel');
const mathematicalModelsService = require('./PrescriptiveAnalytics/mathematicalModelsService');

/**
 * Intervention Generator Service
 * Generates one-time interventions based on prescriptive analysis
 * Following the exact specification from CLAUDE.md
 */
class InterventionGeneratorService {

  /**
   * Generate one-time intervention assessment based on prescriptive analysis
   * @param {string} analysisId - Prescriptive analysis ID
   * @param {string} category - Category for intervention
   * @returns {Object} Generated intervention assessment
   */
  async generateIntervention(analysisId, category) {
    try {
      console.log(`[INTERVENTION GENERATOR] Generating intervention for analysis ${analysisId}, category: ${category}`);

      // Get prescriptive analysis
      const analysis = await PrescriptiveAnalysis.findById(analysisId);
      if (!analysis) {
        throw new Error(`Prescriptive analysis not found: ${analysisId}`);
      }

      // Check if intervention already attempted for this category (one-time rule)
      const existingAttempt = analysis.interventionHistory.find(h => h.category === category);
      if (existingAttempt) {
        throw new Error(`Intervention already attempted for ${category}. One-time intervention rule enforced.`);
      }

      // Get category skill mastery
      const categoryMastery = analysis.skillMastery.get ?
        analysis.skillMastery.get(category) :
        analysis.skillMastery[category];

      if (!categoryMastery) {
        throw new Error(`Category "${category}" not found in skill mastery data`);
      }

      // Check if category actually needs intervention (< 75%)
      if (categoryMastery.score >= 75) {
        throw new Error(`Category "${category}" already passed with ${categoryMastery.score}%. No intervention needed.`);
      }

      // Get error patterns for this category
      const errorPatterns = analysis.errorPatterns.get ?
        analysis.errorPatterns.get(category) :
        analysis.errorPatterns[category] || {};

      // Get intervention plan for this category
      const interventionPlan = analysis.interventionPlan.specificFocus.get ?
        analysis.interventionPlan.specificFocus.get(category) :
        analysis.interventionPlan.specificFocus[category];

      if (!interventionPlan) {
        throw new Error(`No intervention plan found for category "${category}"`);
      }

      // Determine question selection strategy
      const strategy = this.determineQuestionSelectionStrategy(errorPatterns, categoryMastery);

      // Calculate dynamic question count based on prescriptive analytics (5-18 range)
      const optimalQuestionCount = await this.calculateOptimalQuestionCount(
        errorPatterns,
        categoryMastery,
        category,
        analysis.readingLevel,
        analysis.interventionHistory.filter(h => h.category === category).length
      );

      console.log('[INTERVENTION GENERATOR] Calculated optimal question count:', optimalQuestionCount);

      // CLAUDE.md Doctor-Teacher-Student Model: System provides prescription ONLY
      // Teachers will create all intervention questions based on the prescription
      console.log('[INTERVENTION GENERATOR] Following CLAUDE.md Doctor-Teacher-Student model - providing prescription only');
      console.log('[INTERVENTION GENERATOR] Teachers will create intervention questions based on prescription');
      console.log('[INTERVENTION GENERATOR] Prescription parameters:', {
        category,
        readingLevel: analysis.readingLevel,
        errorPatterns,
        interventionPlan,
        recommendedQuestionCount: optimalQuestionCount,
        abilityEstimate: analysis.abilityEstimates.get ? analysis.abilityEstimates.get(category) : analysis.abilityEstimates[category] || 0
      });

      // Generate doctor's prescription based on error analysis
      const doctorPrescription = this.generateDoctorPrescription(
        errorPatterns,
        categoryMastery,
        interventionPlan,
        category
      );

      // Generate teacher implementation data (prescription-based)
      const teacherImplementation = this.generateTeacherImplementation(
        null, // No auto-generated questions - teacher will create all questions
        optimalQuestionCount
      );

      // Generate question count calculation details
      const questionCountCalculation = this.generateQuestionCountCalculation(
        errorPatterns,
        categoryMastery,
        category,
        analysis.readingLevel,
        optimalQuestionCount
      );

      // Create intervention assessment
      const interventionData = {
        studentId: analysis.studentId,
        prescriptiveAnalysisId: analysisId,
        category,
        readingLevel: analysis.readingLevel,
        passThreshold: 75,

        // DOCTOR'S PRESCRIPTION (from prescriptive analytics) - CLAUDE.md requirement
        doctorPrescription: doctorPrescription,

        // TEACHER IMPLEMENTATION (based on prescription) - CLAUDE.md requirement
        teacherImplementation: teacherImplementation,

        // QUESTION COUNT CALCULATION DETAILS - CLAUDE.md requirement
        questionCountCalculation: questionCountCalculation,

        questionSelectionStrategy: strategy,
        totalQuestions: optimalQuestionCount, // Dynamic count based on analytics
        questions: [], // CLAUDE.md: Teachers will create all questions - start with empty array
        interventionParameters: {
          fixedQuestions: optimalQuestionCount,
          allowSkip: false,
          showProgress: true,
          immediateFeeback: false
        },
        status: 'draft', // Start as draft until teacher creates questions
        createdBy: null, // Will be set when teacher creates questions
        templateMetadata: {
          templateCount: 0, // Teacher will add questions using templates
          mainAssessmentCount: 0,
          customCount: 0,
          shortageAmount: optimalQuestionCount, // All questions need to be created by teacher
          teacherAction: 'create_all_intervention_questions'
        },
        createdAt: new Date(),
        updatedAt: new Date()
      };

      const intervention = new InterventionAssessment(interventionData);
      await intervention.save();

      // CLAUDE.md: Auto-save will happen when teachers create custom questions
      // This will be handled in the teacher question creation endpoints
      console.log('[INTERVENTION GENERATOR] ✅ CLAUDE.md compliance: No auto-generated questions created');
      console.log('[INTERVENTION GENERATOR] ✅ Teachers will create all intervention questions using templates');
      console.log('[INTERVENTION GENERATOR] ✅ Custom questions will auto-save to templates_questions when teacher creates them');

      // Update category_results to link with this intervention (currentInterventionId)
      try {
        console.log(`[INTERVENTION GENERATOR] Updating category_results to link with intervention ${intervention._id} for category: ${category}`);
        await this.updateCategoryResultInterventionId(analysis.studentId, category, intervention._id);
        console.log(`[INTERVENTION GENERATOR] ✅ Successfully linked category_results with intervention ${intervention._id}`);
      } catch (linkError) {
        // Don't fail the intervention creation if category_results linking fails
        console.error('[INTERVENTION GENERATOR] Failed to link category_results with intervention (non-critical):', linkError.message);
      }

      console.log(`[INTERVENTION GENERATOR] ✅ Generated intervention prescription ${intervention._id} for category ${category}`);
      console.log(`[INTERVENTION GENERATOR] ✅ Prescription includes ${optimalQuestionCount} recommended questions for teacher to create`);
      console.log(`[INTERVENTION GENERATOR] ✅ CLAUDE.md Doctor-Teacher-Student model: Prescription complete, awaiting teacher implementation`);

      return intervention;

    } catch (error) {
      console.error('[INTERVENTION GENERATOR] Error generating intervention:', error);
      throw error;
    }
  }

  /**
   * Determine question selection strategy based on error patterns
   * @param {Object} errorPatterns - Error patterns for the category
   * @param {Object} categoryMastery - Category mastery data
   * @returns {Object} Question selection strategy
   */
  determineQuestionSelectionStrategy(errorPatterns, categoryMastery) {
    const hasErrors = Object.keys(errorPatterns).length > 0;
    const masteryLevel = categoryMastery.masteryProbability || 0.5;

    let method, targetDifficulty, focusAreas;

    if (hasErrors && masteryLevel < 0.4) {
      // Severe difficulties - focus heavily on error patterns
      method = 'error_focused';
      targetDifficulty = 0.6; // Easier questions
      focusAreas = { error_targeted: 80, general: 20 };
    } else if (hasErrors && masteryLevel < 0.7) {
      // Moderate difficulties - balanced approach
      method = 'adaptive_irt';
      targetDifficulty = 0.7; // Standard difficulty
      focusAreas = { error_targeted: 60, general: 40 };
    } else {
      // Minimal specific errors - general practice
      method = 'general_practice';
      targetDifficulty = 0.75; // Slightly harder
      focusAreas = { general: 70, reinforcement: 30 };
    }

    return {
      method,
      targetDifficulty,
      focusAreas: new Map(Object.entries(focusAreas))
    };
  }

  /**
   * Calculate optimal question count based on prescriptive analytics (5-18 range)
   * @param {Object} errorPatterns - Error patterns
   * @param {Object} categoryMastery - Category mastery data
   * @param {string} category - Category name
   * @param {string} readingLevel - Student's reading level
   * @param {number} attemptCount - Number of previous intervention attempts
   * @returns {number} Optimal question count between 5-18
   */
  async calculateOptimalQuestionCount(errorPatterns, categoryMastery, category, readingLevel, attemptCount = 0) {
    // Base counts by reading level
    const baseCountByLevel = {
      'Low Emerging': { min: 5, base: 8, max: 12 },
      'High Emerging': { min: 6, base: 10, max: 14 },
      'Developing': { min: 8, base: 12, max: 16 },
      'Transitioning': { min: 8, base: 12, max: 16 },
      'At Grade Level': { min: 10, base: 15, max: 18 }
    };

    const levelConfig = baseCountByLevel[readingLevel] || baseCountByLevel['High Emerging'];
    let questionCount = levelConfig.base;

    // Factor 1: Error Severity Analysis (±40% of base)
    const errorRate = this.calculateErrorRate(errorPatterns);
    if (errorRate >= 70) questionCount += Math.round(levelConfig.base * 0.4); // Severe
    else if (errorRate >= 50) questionCount += Math.round(levelConfig.base * 0.25); // High
    else if (errorRate >= 30) questionCount += Math.round(levelConfig.base * 0.1); // Moderate
    else if (errorRate >= 15) questionCount -= Math.round(levelConfig.base * 0.1); // Low
    else questionCount -= Math.round(levelConfig.base * 0.2); // Minimal

    // Factor 2: Mastery Level Analysis (±25% of base)
    const masteryScore = categoryMastery.score || 0;
    if (masteryScore < 40) questionCount += Math.round(levelConfig.base * 0.25); // Very low
    else if (masteryScore < 55) questionCount += Math.round(levelConfig.base * 0.15); // Low
    else if (masteryScore < 65) questionCount += Math.round(levelConfig.base * 0.05); // Below average
    else if (masteryScore >= 75) questionCount -= Math.round(levelConfig.base * 0.15); // Passing

    // Factor 3: Category Complexity Multiplier
    const categoryMultipliers = {
      'Alphabet Knowledge': 0.8,
      'Phonological Awareness': 1.1,
      'Decoding': 1.0,
      'Word Recognition': 1.0,
      'Reading Comprehension': 1.2
    };
    questionCount = Math.round(questionCount * (categoryMultipliers[category] || 1.0));

    // Factor 4: Intervention History (fatigue prevention)
    questionCount -= Math.min(3, attemptCount);

    // Bound between min and max for level
    questionCount = Math.max(levelConfig.min, Math.min(levelConfig.max, questionCount));

    console.log(`[INTERVENTION GENERATOR] Question count calculation:`, {
      category, readingLevel, errorRate, masteryScore, attemptCount,
      baseCount: levelConfig.base, finalCount: questionCount
    });

    return questionCount;
  }

  /**
   * Generate questions using template-based approach with 3-source priority system
   * @param {string} category - Category name
   * @param {string} readingLevel - Student's reading level
   * @param {Object} errorPatterns - Error patterns
   * @param {Object} interventionPlan - Intervention plan
   * @param {number} questionCount - Target question count
   * @param {number} abilityEstimate - Student's ability estimate
   * @returns {Object} Question generation result with availability info
   */
  async generateTemplateBasedQuestions(category, readingLevel, errorPatterns, interventionPlan, questionCount, abilityEstimate) {
    console.log('[INTERVENTION GENERATOR] generateTemplateBasedQuestions called with:', {
      category, readingLevel, errorPatterns, interventionPlan, questionCount, abilityEstimate
    });

    const result = {
      questions: [],
      templateAvailability: {
        targetQuestions: questionCount,
        availableTemplates: 0,
        mainAssessmentCount: 0,
        customCount: 0,
        shortageAmount: 0,
        teacherAction: null
      }
    };

    try {
      switch (category) {
        case 'Alphabet Knowledge':
          return await this.generateAlphabetKnowledgeFromTemplates(errorPatterns, interventionPlan, questionCount, abilityEstimate);

        case 'Phonological Awareness':
          return await this.generatePhonologicalAwarenessFromTemplates(errorPatterns, interventionPlan, questionCount, abilityEstimate);

        case 'Decoding':
          return await this.generateDecodingFromTemplates(errorPatterns, interventionPlan, questionCount, abilityEstimate);

        case 'Word Recognition':
          return await this.generateWordRecognitionFromTemplates(errorPatterns, interventionPlan, questionCount, abilityEstimate);

        case 'Reading Comprehension':
          return await this.generateReadingComprehensionFromTemplates(readingLevel, interventionPlan, questionCount, abilityEstimate);

        default:
          throw new Error(`Unsupported category for intervention: ${category}`);
      }
    } catch (error) {
      console.error(`[INTERVENTION GENERATOR] Error generating ${category} questions:`, error);

      // Fallback: return minimal set with error info
      result.templateAvailability.shortageAmount = questionCount;
      result.templateAvailability.teacherAction = 'create_templates_for_category';
      return result;
    }
  }

  /**
   * Generate Alphabet Knowledge intervention questions from templates
   * @param {Object} errorPatterns - Error patterns
   * @param {Object} interventionPlan - Intervention plan
   * @param {number} questionCount - Target question count
   * @param {number} abilityEstimate - Ability estimate
   * @returns {Object} Question generation result
   */
  async generateAlphabetKnowledgeFromTemplates(errorPatterns, interventionPlan, questionCount, abilityEstimate) {
    console.log('[INTERVENTION GENERATOR] Starting Alphabet Knowledge template-based generation');

    const result = {
      questions: [],
      templateAvailability: {
        targetQuestions: questionCount,
        availableTemplates: 0,
        mainAssessmentCount: 0,
        customCount: 0,
        shortageAmount: 0,
        teacherAction: null
      }
    };

    try {
      // Priority 1: Get templates from templates_questions
      const templateQuestions = await TemplateQuestion.findByCategory('Alphabet Knowledge');
      result.templateAvailability.availableTemplates = templateQuestions.length;

      console.log(`[INTERVENTION GENERATOR] Found ${templateQuestions.length} Alphabet Knowledge templates`);

      // Use available templates first
      for (let i = 0; i < Math.min(questionCount, templateQuestions.length); i++) {
        const template = templateQuestions[i];
        const interventionQuestion = template.toInterventionQuestion();

        // Customize based on error patterns if available
        if (errorPatterns && this.hasAlphabetErrors(errorPatterns)) {
          interventionQuestion.targetSkill = this.getAlphabetErrorFocus(errorPatterns);
        }

        result.questions.push(interventionQuestion);
      }

      // Priority 2: Fill remaining with main assessment questions if needed
      if (result.questions.length < questionCount) {
        const mainAssessmentQuestions = await this.getMainAssessmentQuestions('Alphabet Knowledge');
        const needed = questionCount - result.questions.length;
        const fromMainAssessment = Math.min(needed, mainAssessmentQuestions.length);

        for (let i = 0; i < fromMainAssessment; i++) {
          const mainQuestion = this.convertMainAssessmentToIntervention(mainAssessmentQuestions[i], 'Alphabet Knowledge');
          result.questions.push(mainQuestion);
        }

        result.templateAvailability.mainAssessmentCount = fromMainAssessment;
      }

      // Priority 3: Generate custom questions if still needed
      if (result.questions.length < questionCount) {
        const needed = questionCount - result.questions.length;
        const customQuestions = this.generateCustomAlphabetQuestions(needed, errorPatterns, interventionPlan, abilityEstimate);
        result.questions.push(...customQuestions);
        result.templateAvailability.customCount = customQuestions.length;
      }

      // Calculate shortage
      if (result.questions.length < questionCount) {
        result.templateAvailability.shortageAmount = questionCount - result.questions.length;
        result.templateAvailability.teacherAction = 'create_more_alphabet_templates';
      }

      console.log(`[INTERVENTION GENERATOR] Generated ${result.questions.length} Alphabet Knowledge questions:`, {
        templates: result.templateAvailability.availableTemplates,
        mainAssessment: result.templateAvailability.mainAssessmentCount,
        custom: result.templateAvailability.customCount,
        shortage: result.templateAvailability.shortageAmount
      });

      return result;

    } catch (error) {
      console.error('[INTERVENTION GENERATOR] Error generating Alphabet Knowledge from templates:', error);
      result.templateAvailability.shortageAmount = questionCount;
      result.templateAvailability.teacherAction = 'create_alphabet_templates';
      return result;
    }
  }

  /**
   * Generate Phonological Awareness intervention questions from templates
   * @param {Object} errorPatterns - Error patterns
   * @param {Object} interventionPlan - Intervention plan
   * @param {number} questionCount - Target question count
   * @param {number} abilityEstimate - Ability estimate
   * @returns {Object} Question generation result
   */
  async generatePhonologicalAwarenessFromTemplates(errorPatterns, interventionPlan, questionCount, abilityEstimate) {
    console.log('[INTERVENTION GENERATOR] Starting Phonological Awareness template-based generation');

    const result = {
      questions: [],
      templateAvailability: {
        targetQuestions: questionCount,
        availableTemplates: 0,
        mainAssessmentCount: 0,
        customCount: 0,
        shortageAmount: 0,
        teacherAction: null
      }
    };

    try {
      // Priority 1: Get templates from templates_questions
      const templateQuestions = await TemplateQuestion.findByCategory('Phonological Awareness');
      result.templateAvailability.availableTemplates = templateQuestions.length;

      console.log(`[INTERVENTION GENERATOR] Found ${templateQuestions.length} Phonological Awareness templates`);

      // Use available templates first
      for (let i = 0; i < Math.min(questionCount, templateQuestions.length); i++) {
        const template = templateQuestions[i];
        const interventionQuestion = template.toInterventionQuestion();

        // Customize based on error patterns if available
        if (errorPatterns && this.hasPhonologicalErrors(errorPatterns)) {
          interventionQuestion.targetSkill = this.getPhonologicalErrorFocus(errorPatterns);
        }

        result.questions.push(interventionQuestion);
      }

      // Priority 2: Fill remaining with main assessment questions if needed
      if (result.questions.length < questionCount) {
        const mainAssessmentQuestions = await this.getMainAssessmentQuestions('Phonological Awareness');
        const needed = questionCount - result.questions.length;
        const fromMainAssessment = Math.min(needed, mainAssessmentQuestions.length);

        for (let i = 0; i < fromMainAssessment; i++) {
          const mainQuestion = this.convertMainAssessmentToIntervention(mainAssessmentQuestions[i], 'Phonological Awareness');
          result.questions.push(mainQuestion);
        }

        result.templateAvailability.mainAssessmentCount = fromMainAssessment;
      }

      // Priority 3: Generate custom questions if still needed
      if (result.questions.length < questionCount) {
        const needed = questionCount - result.questions.length;
        const customQuestions = this.generateCustomPhonologicalQuestions(needed, errorPatterns, interventionPlan, abilityEstimate);
        result.questions.push(...customQuestions);
        result.templateAvailability.customCount = customQuestions.length;
      }

      // Calculate shortage
      if (result.questions.length < questionCount) {
        result.templateAvailability.shortageAmount = questionCount - result.questions.length;
        result.templateAvailability.teacherAction = 'create_more_phonological_templates';
      }

      console.log(`[INTERVENTION GENERATOR] Generated ${result.questions.length} Phonological Awareness questions:`, {
        templates: result.templateAvailability.availableTemplates,
        mainAssessment: result.templateAvailability.mainAssessmentCount,
        custom: result.templateAvailability.customCount,
        shortage: result.templateAvailability.shortageAmount
      });

      return result;

    } catch (error) {
      console.error('[INTERVENTION GENERATOR] Error generating Phonological Awareness from templates:', error);
      result.templateAvailability.shortageAmount = questionCount;
      result.templateAvailability.teacherAction = 'create_phonological_templates';
      return result;
    }
  }

  /**
   * Generate Decoding intervention questions from templates
   * @param {Object} errorPatterns - Error patterns
   * @param {Object} interventionPlan - Intervention plan
   * @param {number} questionCount - Target question count
   * @param {number} abilityEstimate - Ability estimate
   * @returns {Object} Question generation result
   */
  async generateDecodingFromTemplates(errorPatterns, interventionPlan, questionCount, abilityEstimate) {
    console.log('[INTERVENTION GENERATOR] Starting Decoding template-based generation');

    const result = {
      questions: [],
      templateAvailability: {
        targetQuestions: questionCount,
        availableTemplates: 0,
        mainAssessmentCount: 0,
        customCount: 0,
        shortageAmount: 0,
        teacherAction: null
      }
    };

    try {
      // Priority 1: Get templates from templates_questions
      const templateQuestions = await TemplateQuestion.findByCategory('Decoding');
      result.templateAvailability.availableTemplates = templateQuestions.length;

      console.log(`[INTERVENTION GENERATOR] Found ${templateQuestions.length} Decoding templates`);

      // Use available templates first
      for (let i = 0; i < Math.min(questionCount, templateQuestions.length); i++) {
        const template = templateQuestions[i];
        const interventionQuestion = template.toInterventionQuestion();

        // Customize based on error patterns if available
        if (errorPatterns && this.hasDecodingErrors(errorPatterns)) {
          interventionQuestion.targetSkill = this.getDecodingErrorFocus(errorPatterns);
        }

        result.questions.push(interventionQuestion);
      }

      // Priority 2: Fill remaining with main assessment questions if needed
      if (result.questions.length < questionCount) {
        const mainAssessmentQuestions = await this.getMainAssessmentQuestions('Decoding');
        const needed = questionCount - result.questions.length;
        const fromMainAssessment = Math.min(needed, mainAssessmentQuestions.length);

        for (let i = 0; i < fromMainAssessment; i++) {
          const mainQuestion = this.convertMainAssessmentToIntervention(mainAssessmentQuestions[i], 'Decoding');
          result.questions.push(mainQuestion);
        }

        result.templateAvailability.mainAssessmentCount = fromMainAssessment;
      }

      // Priority 3: Generate custom questions if still needed
      if (result.questions.length < questionCount) {
        const needed = questionCount - result.questions.length;
        const customQuestions = this.generateCustomDecodingQuestions(needed, errorPatterns, interventionPlan, abilityEstimate);
        result.questions.push(...customQuestions);
        result.templateAvailability.customCount = customQuestions.length;
      }

      // Calculate shortage
      if (result.questions.length < questionCount) {
        result.templateAvailability.shortageAmount = questionCount - result.questions.length;
        result.templateAvailability.teacherAction = 'create_more_decoding_templates';
      }

      console.log(`[INTERVENTION GENERATOR] Generated ${result.questions.length} Decoding questions:`, {
        templates: result.templateAvailability.availableTemplates,
        mainAssessment: result.templateAvailability.mainAssessmentCount,
        custom: result.templateAvailability.customCount,
        shortage: result.templateAvailability.shortageAmount
      });

      return result;

    } catch (error) {
      console.error('[INTERVENTION GENERATOR] Error generating Decoding from templates:', error);
      result.templateAvailability.shortageAmount = questionCount;
      result.templateAvailability.teacherAction = 'create_decoding_templates';
      return result;
    }
  }

  /**
   * Generate Word Recognition intervention questions from templates
   * @param {Object} errorPatterns - Error patterns
   * @param {Object} interventionPlan - Intervention plan
   * @param {number} questionCount - Target question count
   * @param {number} abilityEstimate - Ability estimate
   * @returns {Object} Question generation result
   */
  async generateWordRecognitionFromTemplates(errorPatterns, interventionPlan, questionCount, abilityEstimate) {
    console.log('[INTERVENTION GENERATOR] Starting Word Recognition template-based generation');

    const result = {
      questions: [],
      templateAvailability: {
        targetQuestions: questionCount,
        availableTemplates: 0,
        mainAssessmentCount: 0,
        customCount: 0,
        shortageAmount: 0,
        teacherAction: null
      }
    };

    try {
      // Priority 1: Get templates from templates_questions
      const templateQuestions = await TemplateQuestion.findByCategory('Word Recognition');
      result.templateAvailability.availableTemplates = templateQuestions.length;

      console.log(`[INTERVENTION GENERATOR] Found ${templateQuestions.length} Word Recognition templates`);

      // Use available templates first
      for (let i = 0; i < Math.min(questionCount, templateQuestions.length); i++) {
        const template = templateQuestions[i];
        const interventionQuestion = template.toInterventionQuestion();

        // Customize based on error patterns if available
        if (errorPatterns && this.hasWordRecognitionErrors(errorPatterns)) {
          interventionQuestion.targetSkill = this.getWordRecognitionErrorFocus(errorPatterns);
        }

        result.questions.push(interventionQuestion);
      }

      // Priority 2: Fill remaining with main assessment questions if needed
      if (result.questions.length < questionCount) {
        const mainAssessmentQuestions = await this.getMainAssessmentQuestions('Word Recognition');
        const needed = questionCount - result.questions.length;
        const fromMainAssessment = Math.min(needed, mainAssessmentQuestions.length);

        for (let i = 0; i < fromMainAssessment; i++) {
          const mainQuestion = this.convertMainAssessmentToIntervention(mainAssessmentQuestions[i], 'Word Recognition');
          result.questions.push(mainQuestion);
        }

        result.templateAvailability.mainAssessmentCount = fromMainAssessment;
      }

      // Priority 3: Generate custom questions if still needed
      if (result.questions.length < questionCount) {
        const needed = questionCount - result.questions.length;
        const customQuestions = this.generateCustomWordRecognitionQuestions(needed, errorPatterns, interventionPlan, abilityEstimate);
        result.questions.push(...customQuestions);
        result.templateAvailability.customCount = customQuestions.length;
      }

      // Calculate shortage
      if (result.questions.length < questionCount) {
        result.templateAvailability.shortageAmount = questionCount - result.questions.length;
        result.templateAvailability.teacherAction = 'create_more_word_recognition_templates';
      }

      console.log(`[INTERVENTION GENERATOR] Generated ${result.questions.length} Word Recognition questions:`, {
        templates: result.templateAvailability.availableTemplates,
        mainAssessment: result.templateAvailability.mainAssessmentCount,
        custom: result.templateAvailability.customCount,
        shortage: result.templateAvailability.shortageAmount
      });

      return result;

    } catch (error) {
      console.error('[INTERVENTION GENERATOR] Error generating Word Recognition from templates:', error);
      result.templateAvailability.shortageAmount = questionCount;
      result.templateAvailability.teacherAction = 'create_word_recognition_templates';
      return result;
    }
  }

  /**
   * Generate Reading Comprehension intervention questions from templates
   * @param {string} readingLevel - Reading level
   * @param {Object} interventionPlan - Intervention plan
   * @param {number} questionCount - Target question count
   * @param {number} abilityEstimate - Ability estimate
   * @returns {Object} Question generation result
   */
  async generateReadingComprehensionFromTemplates(readingLevel, interventionPlan, questionCount, abilityEstimate) {
    console.log('[INTERVENTION GENERATOR] Starting Reading Comprehension template-based generation');

    const result = {
      questions: [],
      templateAvailability: {
        targetQuestions: questionCount,
        availableTemplates: 0,
        mainAssessmentCount: 0,
        customCount: 0,
        shortageAmount: 0,
        teacherAction: null
      }
    };

    try {
      // Reading Comprehension uses sentence_templates, not templates_questions
      const sentenceTemplates = await SentenceTemplate.find({
        readingLevel: readingLevel,
        isActive: true
      }).sort({ createdAt: -1 });

      result.templateAvailability.availableTemplates = sentenceTemplates.length;

      console.log(`[INTERVENTION GENERATOR] Found ${sentenceTemplates.length} Reading Comprehension sentence templates for ${readingLevel}`);

      // Use available sentence templates first
      for (let i = 0; i < Math.min(questionCount, sentenceTemplates.length); i++) {
        const template = sentenceTemplates[i];
        const interventionQuestion = this.convertSentenceTemplateToIntervention(template, i + 1);

        // Customize based on error patterns if available
        if (interventionPlan && interventionPlan.focus) {
          interventionQuestion.targetSkill = interventionPlan.focus;
        }

        result.questions.push(interventionQuestion);
      }

      // Priority 2: Fill remaining with main assessment questions if needed
      if (result.questions.length < questionCount) {
        const mainAssessmentQuestions = await this.getMainAssessmentQuestions('Reading Comprehension');
        const needed = questionCount - result.questions.length;
        const fromMainAssessment = Math.min(needed, mainAssessmentQuestions.length);

        for (let i = 0; i < fromMainAssessment; i++) {
          const mainQuestion = this.convertMainAssessmentToIntervention(mainAssessmentQuestions[i], 'Reading Comprehension');
          result.questions.push(mainQuestion);
        }

        result.templateAvailability.mainAssessmentCount = fromMainAssessment;
      }

      // Priority 3: Generate custom questions if still needed
      if (result.questions.length < questionCount) {
        const needed = questionCount - result.questions.length;
        const customQuestions = this.generateCustomReadingComprehensionQuestions(needed, readingLevel, interventionPlan, abilityEstimate);
        result.questions.push(...customQuestions);
        result.templateAvailability.customCount = customQuestions.length;
      }

      // Calculate shortage
      if (result.questions.length < questionCount) {
        result.templateAvailability.shortageAmount = questionCount - result.questions.length;
        result.templateAvailability.teacherAction = 'create_more_reading_comprehension_templates';
      }

      console.log(`[INTERVENTION GENERATOR] Generated ${result.questions.length} Reading Comprehension questions:`, {
        templates: result.templateAvailability.availableTemplates,
        mainAssessment: result.templateAvailability.mainAssessmentCount,
        custom: result.templateAvailability.customCount,
        shortage: result.templateAvailability.shortageAmount
      });

      return result;

    } catch (error) {
      console.error('[INTERVENTION GENERATOR] Error generating Reading Comprehension from templates:', error);
      result.templateAvailability.shortageAmount = questionCount;
      result.templateAvailability.teacherAction = 'create_reading_comprehension_templates';
      return result;
    }
  }

  // Helper methods for template-based generation

  /**
   * Calculate error rate from error patterns
   * @param {Object} errorPatterns - Error patterns object
   * @returns {number} Error rate percentage
   */
  calculateErrorRate(errorPatterns) {
    if (!errorPatterns || Object.keys(errorPatterns).length === 0) {
      return 0;
    }

    // Extract error percentage from various error pattern structures
    let totalErrors = 0;
    let totalAssessed = 0;

    Object.values(errorPatterns).forEach(pattern => {
      if (pattern.percentage && pattern.total) {
        totalErrors += (pattern.percentage / 100) * pattern.total;
        totalAssessed += pattern.total;
      } else if (pattern.count && pattern.total) {
        totalErrors += pattern.count;
        totalAssessed += pattern.total;
      }
    });

    return totalAssessed > 0 ? Math.round((totalErrors / totalAssessed) * 100) : 0;
  }

  /**
   * Get main assessment questions for a category
   * @param {string} category - Category name
   * @returns {Array} Main assessment questions
   */
  async getMainAssessmentQuestions(category) {
    try {
      const mainAssessments = await MainAssessment.find({
        category: category,
        isActive: true
      }).limit(10);

      return mainAssessments.flatMap(assessment => assessment.questions || []);
    } catch (error) {
      console.error(`[INTERVENTION GENERATOR] Error getting main assessment questions for ${category}:`, error);
      return [];
    }
  }

  /**
   * Convert main assessment question to intervention format
   * @param {Object} mainQuestion - Main assessment question
   * @param {string} category - Category name
   * @returns {Object} Intervention question
   */
  convertMainAssessmentToIntervention(mainQuestion, category) {
    const baseQuestion = {
      questionId: `main_${mainQuestion.questionId || Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      source: 'main_assessment',
      sourceQuestionId: mainQuestion.questionId,
      questionType: mainQuestion.questionType || this.getDefaultQuestionType(category),
      questionText: mainQuestion.questionText,
      questionImage: mainQuestion.questionImage,
      questionValue: mainQuestion.questionValue
    };

    // Add category-specific fields
    switch (category) {
      case 'Alphabet Knowledge':
        baseQuestion.choiceOptions = mainQuestion.choiceOptions;
        break;
      case 'Phonological Awareness':
        baseQuestion.questionSet = mainQuestion.questionSet;
        break;
      case 'Decoding':
        baseQuestion.displaySequence = mainQuestion.displaySequence;
        baseQuestion.dragElements = mainQuestion.dragElements;
        baseQuestion.correctSequence = mainQuestion.correctSequence;
        baseQuestion.blankPosition = mainQuestion.blankPosition;
        break;
      case 'Word Recognition':
        baseQuestion.displayWord = mainQuestion.displayWord;
        baseQuestion.blankOptions = mainQuestion.blankOptions;
        baseQuestion.correctAnswer = mainQuestion.correctAnswer;
        break;
      case 'Reading Comprehension':
        baseQuestion.storyTitle = mainQuestion.storyTitle;
        baseQuestion.passages = mainQuestion.passages;
        baseQuestion.sentenceQuestions = mainQuestion.sentenceQuestions;
        break;
    }

    return baseQuestion;
  }

  /**
   * Convert sentence template to intervention question format
   * @param {Object} sentenceTemplate - Sentence template
   * @param {number} questionIndex - Question index
   * @returns {Object} Intervention question
   */
  convertSentenceTemplateToIntervention(sentenceTemplate, questionIndex) {
    return {
      questionId: `sentence_template_${sentenceTemplate._id}_${questionIndex}`,
      source: 'template_question',
      sourceQuestionId: sentenceTemplate._id.toString(),
      questionType: 'text_input',
      storyTitle: sentenceTemplate.title,
      passages: sentenceTemplate.sentenceText.map(text => ({
        pageNumber: text.pageNumber,
        text: text.text,
        image: text.image
      })),
      sentenceQuestions: sentenceTemplate.sentenceQuestions.map(sq => ({
        questionNumber: sq.questionNumber,
        questionText: sq.questionText,
        sentenceCorrectAnswer: sq.sentenceCorrectAnswer,
        sentenceOptionAnswers: sq.sentenceOptionAnswers,
        sentenceAcceptableAnswer: sq.sentenceAcceptableAnswer
      })),
      targetSkill: 'reading_comprehension',
      targetElement: sentenceTemplate.title
    };
  }

  /**
   * Get default question type for category
   * @param {string} category - Category name
   * @returns {string} Default question type
   */
  getDefaultQuestionType(category) {
    const defaults = {
      'Alphabet Knowledge': 'multiple_choice',
      'Phonological Awareness': 'malapantig',
      'Decoding': 'drag_drop',
      'Word Recognition': 'fill_blank',
      'Reading Comprehension': 'text_input'
    };
    return defaults[category] || 'multiple_choice';
  }

  /**
   * Check if alphabet errors exist
   * @param {Object} errorPatterns - Error patterns
   * @returns {boolean} True if alphabet errors exist
   */
  hasAlphabetErrors(errorPatterns) {
    return errorPatterns && (errorPatterns.patinig_errors || errorPatterns.katinig_errors);
  }

  /**
   * Get alphabet error focus
   * @param {Object} errorPatterns - Error patterns
   * @returns {string} Error focus
   */
  getAlphabetErrorFocus(errorPatterns) {
    if (errorPatterns.patinig_errors && errorPatterns.patinig_errors.count > 0) {
      return 'vowel_discrimination';
    }
    if (errorPatterns.katinig_errors && errorPatterns.katinig_errors.count > 0) {
      return 'consonant_discrimination';
    }
    return 'letter_recognition';
  }

  /**
   * Check if phonological errors exist
   * @param {Object} errorPatterns - Error patterns
   * @returns {boolean} True if phonological errors exist
   */
  hasPhonologicalErrors(errorPatterns) {
    return errorPatterns && errorPatterns.matching_errors;
  }

  /**
   * Get phonological error focus
   * @param {Object} errorPatterns - Error patterns
   * @returns {string} Error focus
   */
  getPhonologicalErrorFocus(errorPatterns) {
    if (errorPatterns.matching_errors && errorPatterns.matching_errors.confusion_pairs) {
      return 'sound_discrimination';
    }
    return 'phonological_awareness';
  }

  /**
   * Check if decoding errors exist
   * @param {Object} errorPatterns - Error patterns
   * @returns {boolean} True if decoding errors exist
   */
  hasDecodingErrors(errorPatterns) {
    return errorPatterns && errorPatterns.decoding_errors;
  }

  /**
   * Get decoding error focus
   * @param {Object} errorPatterns - Error patterns
   * @returns {string} Error focus
   */
  getDecodingErrorFocus(errorPatterns) {
    if (errorPatterns.decoding_errors && errorPatterns.decoding_errors.most_error_position === 0) {
      return 'initial_sound_difficulty';
    }
    return 'word_decoding';
  }

  /**
   * Check if word recognition errors exist
   * @param {Object} errorPatterns - Error patterns
   * @returns {boolean} True if word recognition errors exist
   */
  hasWordRecognitionErrors(errorPatterns) {
    return errorPatterns && errorPatterns.word_errors;
  }

  /**
   * Get word recognition error focus
   * @param {Object} errorPatterns - Error patterns
   * @returns {string} Error focus
   */
  getWordRecognitionErrorFocus(errorPatterns) {
    if (errorPatterns.word_errors && errorPatterns.word_errors.error_type === 'context_clues') {
      return 'sentence_completion';
    }
    return 'word_recognition';
  }

  /**
   * Generate custom alphabet knowledge questions
   * @param {number} count - Number of questions needed
   * @param {Object} errorPatterns - Error patterns
   * @param {Object} interventionPlan - Intervention plan
   * @param {number} abilityEstimate - Ability estimate
   * @returns {Array} Custom questions
   */
  generateCustomAlphabetQuestions(count, errorPatterns, interventionPlan, abilityEstimate) {
    const questions = [];
    const patinigLetters = this.getTargetPatinigLetters(errorPatterns, interventionPlan);
    const katinigLetters = this.getTargetKatinigLetters(errorPatterns, interventionPlan);

    for (let i = 0; i < count; i++) {
      const isPatinig = i % 2 === 0;
      const targetLetters = isPatinig ? patinigLetters : katinigLetters;
      const targetLetter = targetLetters[i % targetLetters.length];
      const questionType = isPatinig ? 'patinig' : 'katinig';

      const choices = this.generateAlphabetChoices(targetLetter, questionType, abilityEstimate);

      questions.push({
        questionId: `custom_ak_${i + 1}_${Date.now()}`,
        source: 'custom',
        sourceQuestionId: null,
        questionType: questionType,
        questionText: isPatinig ? 'Anong katumbas na maliit na letra?' : 'Anong katumbas na maliit na letra?',
        questionImage: this.generateS3ImageUrl('alphabet-knowledge', `${targetLetter}.png`),
        questionValue: targetLetter,
        choiceOptions: choices,
        targetSkill: questionType,
        targetElement: targetLetter
      });
    }

    return questions;
  }

  /**
   * Generate custom phonological awareness questions
   * @param {number} count - Number of questions needed
   * @param {Object} errorPatterns - Error patterns
   * @param {Object} interventionPlan - Intervention plan
   * @param {number} abilityEstimate - Ability estimate
   * @returns {Array} Custom questions
   */
  generateCustomPhonologicalQuestions(count, errorPatterns, interventionPlan, abilityEstimate) {
    const questions = [];
    const targetSounds = interventionPlan.targetSounds || ['B-P', 'M-N', 'D-T', 'L-R'];

    for (let i = 0; i < count; i++) {
      const soundSet = this.getPhonologicalSoundSet(targetSounds, i, abilityEstimate);

      questions.push({
        questionId: `custom_pa_${i + 1}_${Date.now()}`,
        source: 'custom',
        sourceQuestionId: null,
        questionType: 'malapantig',
        questionText: 'Pakinggan ang audio. Itugma ito sa katumbas na letra sa kabilang hanay.',
        questionImage: null,
        questionValue: null,
        questionSet: {
          audioTexts: soundSet.audioTexts,
          matchingOptions: soundSet.matchingOptions,
          correctPairs: soundSet.correctPairs
        },
        targetSkill: 'sound_discrimination',
        targetElement: soundSet.confusionPair
      });
    }

    return questions;
  }

  /**
   * Generate custom decoding questions
   * @param {number} count - Number of questions needed
   * @param {Object} errorPatterns - Error patterns
   * @param {Object} interventionPlan - Intervention plan
   * @param {number} abilityEstimate - Ability estimate
   * @returns {Array} Custom questions
   */
  generateCustomDecodingQuestions(count, errorPatterns, interventionPlan, abilityEstimate) {
    const questions = [];
    const targetPatterns = interventionPlan.targetPatterns || ['CVC', 'CVCV'];
    const focus = interventionPlan.focus || 'initial_sounds';
    const wordList = this.getDecodingWords(targetPatterns, focus, abilityEstimate);

    for (let i = 0; i < count; i++) {
      const word = wordList[i % wordList.length];
      const questionData = this.createDecodingQuestion(word, focus, i);

      questions.push({
        questionId: `custom_dc_${i + 1}_${Date.now()}`,
        source: 'custom',
        sourceQuestionId: null,
        questionType: questionData.displaySequence ? 'fill_missing_letter' : 'complete_word_identification',
        questionText: questionData.questionText,
        questionImage: questionData.questionImage,
        questionValue: null,
        displaySequence: questionData.displaySequence,
        dragElements: questionData.dragElements,
        correctSequence: questionData.correctSequence,
        blankPosition: questionData.blankPosition,
        targetSkill: focus,
        targetElement: word
      });
    }

    return questions;
  }

  /**
   * Generate custom word recognition questions
   * @param {number} count - Number of questions needed
   * @param {Object} errorPatterns - Error patterns
   * @param {Object} interventionPlan - Intervention plan
   * @param {number} abilityEstimate - Ability estimate
   * @returns {Array} Custom questions
   */
  generateCustomWordRecognitionQuestions(count, errorPatterns, interventionPlan, abilityEstimate) {
    const questions = [];
    const distribution = interventionPlan.questionDistribution || { sentence_completion: 60, rhyming: 40 };
    const sentenceCount = Math.round(count * (distribution.sentence_completion / 100));
    const rhymingCount = count - sentenceCount;

    // Generate sentence completion questions
    for (let i = 0; i < sentenceCount; i++) {
      const sentenceData = this.getSentenceCompletionData(i, abilityEstimate);

      questions.push({
        questionId: `custom_wr_sentence_${i + 1}_${Date.now()}`,
        source: 'custom',
        sourceQuestionId: null,
        questionType: 'sentence_completion',
        questionText: 'Basahin ang pangungusap. Piliin ang tamang salita mula sa hanay.',
        displayWord: sentenceData.sentence,
        blankOptions: sentenceData.options,
        correctAnswer: sentenceData.correctAnswer,
        targetSkill: 'sentence_context',
        targetElement: sentenceData.correctAnswer[0]
      });
    }

    // Generate rhyming questions
    for (let i = 0; i < rhymingCount; i++) {
      const rhymingData = this.getRhymingData(i, abilityEstimate);

      questions.push({
        questionId: `custom_wr_rhyme_${i + 1}_${Date.now()}`,
        source: 'custom',
        sourceQuestionId: null,
        questionType: 'rhyming_words',
        questionText: 'Anong kasing tunog ng salitang nakikita?',
        questionImage: rhymingData.image,
        displayWord: rhymingData.word,
        blankOptions: rhymingData.options,
        correctAnswer: rhymingData.correctAnswer,
        targetSkill: 'rhyming_words',
        targetElement: rhymingData.word
      });
    }

    return questions;
  }

  /**
   * Generate custom reading comprehension questions
   * @param {number} count - Number of questions needed
   * @param {string} readingLevel - Reading level
   * @param {Object} interventionPlan - Intervention plan
   * @param {number} abilityEstimate - Ability estimate
   * @returns {Array} Custom questions
   */
  generateCustomReadingComprehensionQuestions(count, readingLevel, interventionPlan, abilityEstimate) {
    const questions = [];
    const passages = this.getReadingComprehensionPassages(readingLevel, abilityEstimate);

    for (let i = 0; i < count; i++) {
      const passage = passages[i % passages.length];

      questions.push({
        questionId: `custom_rc_${i + 1}_${Date.now()}`,
        source: 'custom',
        sourceQuestionId: null,
        questionType: 'text_input',
        storyTitle: passage.storyTitle,
        passages: passage.passages,
        sentenceQuestions: passage.sentenceQuestions,
        questionValue: null,
        targetSkill: 'literal_comprehension',
        targetElement: passage.storyTitle
      });
    }

    return questions;
  }

  getTargetPatinigLetters(errorPatterns, interventionPlan) {
    if (interventionPlan.targetLetters && interventionPlan.targetLetters.length > 0) {
      return interventionPlan.targetLetters;
    }

    if (errorPatterns.patinig_errors && errorPatterns.patinig_errors.specific_letters) {
      return errorPatterns.patinig_errors.specific_letters.slice(0, 3);
    }

    return ['A', 'E', 'I', 'O', 'U'];
  }

  getTargetKatinigLetters(errorPatterns, interventionPlan) {
    if (interventionPlan.targetLetters && interventionPlan.targetLetters.length > 0) {
      return interventionPlan.targetLetters;
    }

    if (errorPatterns.katinig_errors && errorPatterns.katinig_errors.specific_letters) {
      return errorPatterns.katinig_errors.specific_letters.slice(0, 3);
    }

    return ['B', 'P', 'M', 'N', 'D', 'T'];
  }

  generateAlphabetChoices(correctLetter, type, abilityEstimate) {
    const patinig = ['a', 'e', 'i', 'o', 'u'];
    const katinig = ['b', 'p', 'm', 'n', 'd', 't', 'l', 'r', 's', 'k'];

    const pool = type === 'patinig' ? patinig : katinig;
    const correctAnswer = correctLetter.toLowerCase();

    // Get distractors
    const distractors = pool.filter(letter => letter !== correctAnswer);
    const selectedDistractors = this.selectDistractors(distractors, 2, abilityEstimate);

    const choices = [
      { optionId: '1', optionText: correctAnswer, isCorrect: true },
      { optionId: '2', optionText: selectedDistractors[0], isCorrect: false },
      { optionId: '3', optionText: selectedDistractors[1], isCorrect: false }
    ];

    // Shuffle choices
    return this.shuffleArray(choices).map((choice, index) => ({
      ...choice,
      optionId: (index + 1).toString()
    }));
  }

  getPhonologicalSoundSet(targetSounds, questionIndex, abilityEstimate) {
    const soundPairs = {
      'B-P': { audioTexts: ['B', 'P', 'M'], matchingOptions: ['Bb', 'Pp', 'Mm', 'Nn'], correctPairs: [{ 'B': 'Bb' }, { 'P': 'Pp' }, { 'M': 'Mm' }] },
      'M-N': { audioTexts: ['M', 'N', 'L'], matchingOptions: ['Mm', 'Nn', 'Ll', 'Rr'], correctPairs: [{ 'M': 'Mm' }, { 'N': 'Nn' }, { 'L': 'Ll' }] },
      'D-T': { audioTexts: ['D', 'T', 'N'], matchingOptions: ['Dd', 'Tt', 'Nn', 'Ll'], correctPairs: [{ 'D': 'Dd' }, { 'T': 'Tt' }, { 'N': 'Nn' }] },
      'L-R': { audioTexts: ['L', 'R', 'M'], matchingOptions: ['Ll', 'Rr', 'Mm', 'Ww'], correctPairs: [{ 'L': 'Ll' }, { 'R': 'Rr' }, { 'M': 'Mm' }] }
    };

    const pairKey = targetSounds[questionIndex % targetSounds.length];
    const soundSet = soundPairs[pairKey] || soundPairs['B-P'];

    return {
      ...soundSet,
      confusionPair: pairKey
    };
  }

  getDecodingWords(targetPatterns, focus, abilityEstimate) {
    const wordsByPattern = {
      'CVC': ['BAT', 'CAT', 'DOG', 'PIG', 'SUN', 'HAT', 'CUP', 'BED', 'PEN', 'BOX'],
      'CVCV': ['BABA', 'MAMA', 'TATA', 'SOSO', 'LALA', 'KAKA', 'PAPA', 'NANA', 'DADA', 'GAGA']
    };

    let words = [];
    targetPatterns.forEach(pattern => {
      if (wordsByPattern[pattern]) {
        words = words.concat(wordsByPattern[pattern]);
      }
    });

    return words.length > 0 ? words : wordsByPattern['CVC'];
  }

  createDecodingQuestion(word, focus, questionIndex) {
    const letters = word.split('');
    let questionText, displaySequence, dragElements, correctSequence, blankPosition;

    // Determine question type based on focus and question index
    const shouldUseCompleteWord = focus === 'ending_sounds' || questionIndex % 3 === 0; // Mix question types

    if (shouldUseCompleteWord) {
      // "Tukuyin ang nasa larawan?" - Complete word identification
      questionText = 'Tukuyin ang nasa larawan?';
      displaySequence = null;
      blankPosition = null;
      dragElements = [...letters, 'A', 'E']; // Add distractors
      correctSequence = letters;
    } else if (focus === 'initial_sounds') {
      // "Buoin ang salita" - Missing first letter
      questionText = 'Buoin ang salita';
      displaySequence = ['_', ...letters.slice(1)];
      dragElements = [letters[0], 'M', 'K', 'L'];
      correctSequence = [letters[0]];
      blankPosition = 0;
    } else if (focus === 'medial_sounds') {
      // "Buoin ang salita" - Missing middle letter
      const middleIndex = Math.floor(letters.length / 2);
      questionText = 'Buoin ang salita';
      displaySequence = [...letters.slice(0, middleIndex), '_', ...letters.slice(middleIndex + 1)];
      dragElements = [letters[middleIndex], 'A', 'I', 'U'];
      correctSequence = [letters[middleIndex]];
      blankPosition = middleIndex;
    } else {
      // Default: "Buoin ang salita" - Missing last letter
      questionText = 'Buoin ang salita';
      displaySequence = [...letters.slice(0, -1), '_'];
      dragElements = [letters[letters.length - 1], 'S', 'T', 'N'];
      correctSequence = [letters[letters.length - 1]];
      blankPosition = letters.length - 1;
    }

    return {
      questionText,
      questionImage: this.generateS3ImageUrl('decoding', `${word}.png`),
      displaySequence,
      dragElements: this.shuffleArray(dragElements),
      correctSequence,
      blankPosition
    };
  }

  getSentenceCompletionData(questionIndex, abilityEstimate) {
    const sentences = [
      { sentence: 'Naglalaro siya ng _____ sa parke', options: ['Papel', 'Kutsara', 'Bola', 'Damit'], correct: ['Bola'] },
      { sentence: 'Malaki ang _____ sa zoo.', options: ['Elepante', 'Lamesa', 'Nanay', 'Manok'], correct: ['Elepante'] },
      { sentence: 'Kumain ako ng _____ sa almusal.', options: ['Tinapay', 'Sapatos', 'Libro', 'Mesa'], correct: ['Tinapay'] },
      { sentence: 'Natutulog ang _____ sa kama.', options: ['Bata', 'Kotse', 'Puno', 'Ulan'], correct: ['Bata'] },
      { sentence: 'Umiinom siya ng _____.', options: ['Tubig', 'Lapis', 'Tela', 'Bato'], correct: ['Tubig'] }
    ];

    const data = sentences[questionIndex % sentences.length];
    return {
      sentence: data.sentence,
      options: this.shuffleArray(data.options),
      correctAnswer: data.correct
    };
  }

  getRhymingData(questionIndex, abilityEstimate) {
    const rhymingWords = [
      { word: 'SOMBRERO', image: 'SUMBRERO.png', options: ['LIB', 'RO', 'ME', 'SA'], correct: ['LIB', 'RO'] },
      { word: 'PAYONG', image: 'PAYONG.png', options: ['YONG', 'PA', 'NG', 'AY'], correct: ['YONG'] },
      { word: 'SAPATOS', image: 'SAPATOS.png', options: ['TOS', 'SA', 'PA', 'ATOS'], correct: ['TOS'] }
    ];

    const data = rhymingWords[questionIndex % rhymingWords.length];
    return {
      word: data.word,
      image: this.generateS3ImageUrl('word-recognition', data.image),
      options: this.shuffleArray(data.options),
      correctAnswer: data.correct
    };
  }

  getReadingComprehensionPassages(readingLevel, abilityEstimate) {
    return [
      {
        storyTitle: 'Si Ana at ang Aso',
        passages: [
          {
            pageNumber: 1,
            text: 'Si Ana ay may maliit na aso na si Brownie.',
            image: this.generateS3ImageUrl('reading-comprehension', 'Si-Ana-at-ang-Aso-1.png')
          },
          {
            pageNumber: 2,
            text: 'Tuwing umaga, naglalaro sila sa hardin.',
            image: this.generateS3ImageUrl('reading-comprehension', 'Si-Ana-at-ang-Aso-2.png')
          }
        ],
        sentenceQuestions: [
          {
            questionNumber: 1,
            questionText: 'Sino ang may aso?',
            sentenceCorrectAnswer: 'Ana',
            sentenceAcceptableAnswer: ['Ana', 'si Ana']
          },
          {
            questionNumber: 2,
            questionText: 'Ano ang pangalan ng aso?',
            sentenceCorrectAnswer: 'Brownie',
            sentenceAcceptableAnswer: ['Brownie']
          },
          {
            questionNumber: 3,
            questionText: 'Saan sila naglalaro?',
            sentenceCorrectAnswer: 'hardin',
            sentenceAcceptableAnswer: ['hardin', 'sa hardin']
          }
        ]
      },
      {
        storyTitle: 'Ang Matalinong Langaw',
        passages: [
          {
            pageNumber: 1,
            text: 'May isang langaw na nahulog sa tubig.',
            image: this.generateS3ImageUrl('reading-comprehension', 'Ang-Matalinong-Langaw-1.png')
          }
        ],
        sentenceQuestions: [
          {
            questionNumber: 1,
            questionText: 'Sino ang nahulog sa tubig?',
            sentenceCorrectAnswer: 'langaw',
            sentenceAcceptableAnswer: ['langaw', 'isang langaw']
          },
          {
            questionNumber: 2,
            questionText: 'Saan nahulog ang langaw?',
            sentenceCorrectAnswer: 'tubig',
            sentenceAcceptableAnswer: ['tubig', 'sa tubig']
          }
        ]
      }
    ];
  }

  calculateQuestionDifficulty(abilityEstimate, questionIndex, totalQuestions) {
    // Start with student's ability estimate
    let difficulty = abilityEstimate;

    // Adjust based on position in intervention (easier at start)
    const positionFactor = (questionIndex / totalQuestions) * 0.5; // Max 0.5 increase
    difficulty += positionFactor;

    // Add some randomization
    difficulty += (Math.random() - 0.5) * 0.3;

    // Bound between -2 and 2 for intervention
    return Math.max(-2, Math.min(2, difficulty));
  }

  selectDistractors(pool, count, abilityEstimate) {
    // For easier ability, use more similar distractors
    // For harder ability, use more diverse distractors
    const shuffled = this.shuffleArray([...pool]);
    return shuffled.slice(0, count);
  }

  shuffleArray(array) {
    const shuffled = [...array];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
  }

  generateS3ImageUrl(folder, filename) {
    const bucketName = process.env.AWS_BUCKET_NAME || 'literexia-bucket';
    const region = process.env.AWS_REGION || 'ap-southeast-2';
    return `https://${bucketName}.s3.${region}.amazonaws.com/main-assessment/${folder}/${Date.now()}-${filename}`;
  }

  /**
   * Check if student is eligible for intervention in a category
   * @param {number} studentId - Student ID
   * @param {string} category - Category name
   * @returns {Object} Eligibility check result
   */
  async checkInterventionEligibility(studentId, category) {
    try {
      // Get latest prescriptive analysis
      const analysis = await PrescriptiveAnalysis.findOne({
        studentId,
        assessmentType: 'main'
      }).sort({ createdAt: -1 });

      if (!analysis) {
        return {
          eligible: false,
          reason: 'No prescriptive analysis found',
          details: 'Student needs to complete main assessment first.'
        };
      }

      // Check if category was assessed
      const categoryMastery = analysis.skillMastery.get ?
        analysis.skillMastery.get(category) :
        analysis.skillMastery[category];

      if (!categoryMastery) {
        return {
          eligible: false,
          reason: 'Category not assessed',
          details: `Category "${category}" was not part of student's assessment.`
        };
      }

      // Check if category needs intervention (< 75%)
      if (categoryMastery.score >= 75) {
        return {
          eligible: false,
          reason: 'Category already passed',
          score: categoryMastery.score,
          details: `Student scored ${categoryMastery.score}% which meets the 75% pass threshold.`
        };
      }

      // Check one-time intervention rule
      const existingAttempt = analysis.interventionHistory.find(h => h.category === category);
      if (existingAttempt) {
        return {
          eligible: false,
          reason: 'One-time intervention rule',
          details: `Intervention already attempted for "${category}". Face-to-face support recommended.`,
          existingAttempt
        };
      }

      return {
        eligible: true,
        reason: 'Intervention needed and allowed',
        score: categoryMastery.score,
        masteryLevel: categoryMastery.masteryProbability,
        details: `Student scored ${categoryMastery.score}% and has not attempted intervention yet.`
      };

    } catch (error) {
      console.error('[INTERVENTION GENERATOR] Error checking eligibility:', error);
      return {
        eligible: false,
        reason: 'System error',
        details: 'Error occurred during eligibility check.'
      };
    }
  }

  /**
   * Process all intervention responses and create final results
   * This method should be called when an intervention is completed
   * @param {string} interventionId - Intervention assessment ID
   * @returns {Object} Processing results with final scores and pass/fail status
   */
  async processInterventionResults(interventionId) {
    try {
      console.log(`[INTERVENTION GENERATOR] Processing results for intervention ${interventionId}`);

      // Get intervention assessment
      const intervention = await InterventionAssessment.findById(interventionId);
      if (!intervention) {
        throw new Error(`Intervention assessment not found: ${interventionId}`);
      }

      // CRITICAL: Validate intervention completeness before creating results
      console.log(`[INTERVENTION GENERATOR] ✅ VALIDATING INTERVENTION COMPLETENESS BEFORE CREATING RESULTS`);
      const CategoryResultsService = require('./CategoryResultsService');
      const completenessValidation = await CategoryResultsService.validateInterventionCompleteness(intervention.studentId, interventionId);

      if (!completenessValidation.isComplete) {
        console.warn(`[INTERVENTION GENERATOR] ❌ INTERVENTION INCOMPLETE - BLOCKING INTERVENTION RESULTS CREATION`);
        console.warn(`[INTERVENTION GENERATOR] Completeness status:`, JSON.stringify(completenessValidation, null, 2));

        throw new Error(`Intervention incomplete for student ${intervention.studentId}. Cannot create intervention_results until all questions are answered. Required: ${completenessValidation.required}, Answered: ${completenessValidation.answered}, Missing: ${completenessValidation.missing}`);
      }

      console.log(`[INTERVENTION GENERATOR] ✅ INTERVENTION COMPLETENESS VALIDATED - PROCEEDING WITH RESULTS CREATION`);
      console.log(`[INTERVENTION GENERATOR] Completeness: ${completenessValidation.answered}/${completenessValidation.required} questions answered`);

      // Get all responses for this intervention
      const responses = await InterventionResponse.find({
        interventionAssessmentId: interventionId
      }).sort({ answeredAt: 1 });

      if (responses.length === 0) {
        throw new Error(`No responses found for intervention ${interventionId}`);
      }

      // Calculate final scores
      const totalQuestions = intervention.totalQuestions || intervention.questions?.length || 10;
      const answeredQuestions = responses.length;
      const correctAnswers = responses.filter(r => r.isCorrect).length;

      // CRITICAL FIX: Cap correct answers to not exceed total questions (for revision scenarios)
      const cappedCorrectAnswers = Math.min(correctAnswers, totalQuestions);
      const finalScore = Math.round((cappedCorrectAnswers / totalQuestions) * 100);

      console.log(`[INTERVENTION GENERATOR] Score calculation:`);
      console.log(`[INTERVENTION GENERATOR] - Total questions in intervention: ${totalQuestions}`);
      console.log(`[INTERVENTION GENERATOR] - Responses received: ${answeredQuestions}`);
      console.log(`[INTERVENTION GENERATOR] - Correct answers (raw): ${correctAnswers}`);
      console.log(`[INTERVENTION GENERATOR] - Correct answers (capped): ${cappedCorrectAnswers}`);
      console.log(`[INTERVENTION GENERATOR] - Final score: ${finalScore}%`);
      const isPassed = finalScore >= 75; // 75% pass threshold

      // Calculate average response time
      const responsesWithTime = responses.filter(r => r.responseTime && r.responseTime > 0);
      const avgResponseTime = responsesWithTime.length > 0
        ? Math.round(responsesWithTime.reduce((sum, r) => sum + r.responseTime, 0) / responsesWithTime.length)
        : null;

      // ===== COMPREHENSIVE INTERVENTION ANALYSIS =====
      console.log(`[INTERVENTION ANALYSIS] Starting comprehensive analysis for ${intervention.category}`);

      // 1. GET PREVIOUS SCORE FROM MAIN ASSESSMENT
      const previousScore = await this.getPreviousMainAssessmentScore(intervention.studentId, intervention.category, intervention.prescriptiveAnalysisId);
      const improvement = previousScore > 0 ? finalScore - previousScore : 0;
      const improvementPercentage = previousScore > 0 ? Math.round((improvement / previousScore) * 100) : 0;

      // 2. COMPREHENSIVE ERROR PATTERN ANALYSIS
      const comprehensiveErrorPatterns = await this.analyzeComprehensiveInterventionErrors(
        responses, intervention.category, intervention, totalQuestions, correctAnswers
      );

      // 3. BKT SKILL MASTERY ANALYSIS
      const skillMasteryAnalysis = await this.calculateInterventionBKTMastery(
        responses, intervention.category, previousScore, finalScore
      );

      // 4. IRT ABILITY ESTIMATES
      const abilityEstimates = this.calculateInterventionIRTAbility(finalScore, intervention.category);

      // 5. RESEARCH-BASED PRESCRIPTIONS
      const researchPrescriptions = await this.generateInterventionPrescriptions(
        intervention.category, finalScore, isPassed, improvement, comprehensiveErrorPatterns, intervention.studentId
      );

      // 6. INTERVENTION EFFECTIVENESS ANALYSIS
      const effectivenessAnalysis = this.analyzeInterventionEffectiveness(
        previousScore, finalScore, improvement, comprehensiveErrorPatterns, skillMasteryAnalysis
      );

      // 7. PROGRESS COMPARISON ANALYSIS
      const progressComparison = {
        mainAssessmentPerformance: {
          score: previousScore,
          masteryProbability: skillMasteryAnalysis.previousMastery || 0.3,
          errorPatterns: comprehensiveErrorPatterns.previousPatterns || []
        },
        interventionPerformance: {
          score: finalScore,
          masteryProbability: skillMasteryAnalysis.currentMastery,
          errorPatterns: comprehensiveErrorPatterns.currentPatterns || []
        },
        progressIndicators: {
          scoreImprovement: improvement,
          masteryGrowth: skillMasteryAnalysis.masteryGrowth,
          errorReduction: comprehensiveErrorPatterns.errorReductionRate || 0,
          skillTransfer: improvement > 15 ? 'good' : improvement > 5 ? 'limited' : 'poor'
        }
      };

      // 8. COMPREHENSIVE INSIGHTS
      const comprehensiveInsights = this.generateComprehensiveInsights(
        intervention.category, finalScore, isPassed, improvement, skillMasteryAnalysis, comprehensiveErrorPatterns
      );

      // Create comprehensive intervention results record
      const interventionResults = new InterventionResults({
        studentId: intervention.studentId,
        interventionAssessmentId: interventionId,
        prescriptiveAnalysisId: intervention.prescriptiveAnalysisId,
        category: intervention.category,
        readingLevel: intervention.readingLevel,

        // VERSION TRACKING (CRITICAL for revision awareness)
        revisionNumber: intervention.revisionNumber || 1,
        assessmentType: "intervention",
        assessmentDate: new Date(),

        // CORE PERFORMANCE METRICS
        totalQuestions,
        correctAnswers,
        score: finalScore,
        isPassed,
        passThreshold: 75,

        // IMPROVEMENT TRACKING
        previousScore,
        improvement,
        improvementPercentage,

        // COMPREHENSIVE BKT SKILL MASTERY ANALYSIS
        skillMastery: {
          [intervention.category]: skillMasteryAnalysis
        },

        // IRT ABILITY ESTIMATES
        abilityEstimates,

        // COMPREHENSIVE ERROR PATTERN ANALYSIS
        errorPatterns: {
          [intervention.category]: comprehensiveErrorPatterns
        },

        // INTERVENTION EFFECTIVENESS ANALYSIS
        interventionEffectiveness: effectivenessAnalysis,

        // RESEARCH-BASED PRESCRIPTIONS
        researchBasedPrescriptions: {
          [intervention.category]: researchPrescriptions
        },

        // PROGRESS COMPARISON
        progressComparison,

        // COMPREHENSIVE INSIGHTS
        insights: comprehensiveInsights,
        strengths: comprehensiveInsights.strengths,
        weaknesses: comprehensiveInsights.weaknesses,
        recommendations: researchPrescriptions.nextInterventionPrescription.specificTechniques.map(t => t.technique),

        // TIMESTAMPS
        completedAt: new Date()
      });

      await interventionResults.save();

      // Clear currentInterventionId in category_results now that intervention is completed
      try {
        console.log(`[INTERVENTION GENERATOR] Clearing currentInterventionId for student ${intervention.studentId}, category: ${intervention.category}`);
        await this.clearCategoryResultInterventionId(intervention.studentId, intervention.category, interventionId, isPassed);
        console.log(`[INTERVENTION GENERATOR] ✅ Successfully cleared currentInterventionId (intervention ${isPassed ? 'passed' : 'failed'})`);
      } catch (clearError) {
        // Don't fail the results processing if category_results clearing fails
        console.error('[INTERVENTION GENERATOR] Failed to clear category_results currentInterventionId (non-critical):', clearError.message);
      }

      console.log(`[INTERVENTION GENERATOR] Results processed - Score: ${finalScore}%, Passed: ${isPassed}`);

      return {
        success: true,
        interventionResultsId: interventionResults._id,
        results: {
          category: intervention.category,
          totalQuestions,
          correctAnswers,
          score: finalScore,
          isPassed,
          improvement,
          previousScore,
          passThreshold: 75
        }
      };

    } catch (error) {
      console.error('[INTERVENTION GENERATOR] Error processing intervention results:', error);
      throw error;
    }
  }

  /**
   * Analyze error patterns from incorrect intervention responses
   * @param {Array} incorrectResponses - Array of incorrect responses
   * @param {string} category - Category being assessed
   * @param {Object} intervention - Intervention assessment object with questions
   * @returns {Object} Error pattern analysis
   */
  analyzeInterventionErrors(incorrectResponses, category, intervention = null) {
    if (incorrectResponses.length === 0) {
      return { hasErrors: false, patterns: {} };
    }

    const patterns = {
      hasErrors: true,
      totalErrors: incorrectResponses.length,
      errorRate: 0,
      patterns: {}
    };

    // Category-specific error analysis
    switch (category) {
      case 'Alphabet Knowledge':
        // Enhanced analysis with patinig/katinig differentiation
        const alphabetAnalysis = this.analyzeAlphabetKnowledgeErrors(incorrectResponses, intervention);
        patterns.patterns = alphabetAnalysis;
        break;

      case 'Phonological Awareness':
        // Analyze sound matching errors
        const soundErrors = incorrectResponses.filter(r => r.questionId.includes('_pa_') || r.questionId.includes('PA_'));
        patterns.patterns.soundDiscrimination = {
          count: soundErrors.length,
          percentage: Math.round((soundErrors.length / incorrectResponses.length) * 100)
        };
        break;

      case 'Decoding':
        // Analyze decoding pattern errors
        const decodingErrors = incorrectResponses.filter(r => r.questionId.includes('_dc_') || r.questionId.includes('DC_'));
        patterns.patterns.decodingDifficulty = {
          count: decodingErrors.length,
          percentage: Math.round((decodingErrors.length / incorrectResponses.length) * 100)
        };
        break;

      case 'Word Recognition':
        // Analyze word recognition errors
        const wordErrors = incorrectResponses.filter(r => r.questionId.includes('_wr_') || r.questionId.includes('WR_'));
        patterns.patterns.wordRecognition = {
          count: wordErrors.length,
          percentage: Math.round((wordErrors.length / incorrectResponses.length) * 100)
        };
        break;

      case 'Reading Comprehension':
        // Analyze comprehension errors
        const comprehensionErrors = incorrectResponses.filter(r => r.questionId.includes('_rc_') || r.questionId.includes('RC_'));
        patterns.patterns.comprehensionDifficulty = {
          count: comprehensionErrors.length,
          percentage: Math.round((comprehensionErrors.length / incorrectResponses.length) * 100)
        };
        break;

      default:
        patterns.patterns.general = {
          count: incorrectResponses.length,
          percentage: 100
        };
    }

    return patterns;
  }

  /**
   * Analyze Alphabet Knowledge errors with patinig/katinig differentiation
   * @param {Array} incorrectResponses - Array of incorrect responses
   * @param {Object} intervention - Intervention assessment object with questions
   * @returns {Object} Detailed analysis of vowel vs consonant errors
   */
  analyzeAlphabetKnowledgeErrors(incorrectResponses, intervention) {
    const analysis = {
      patinig_errors: {
        count: 0,
        total: 0,
        percentage: 0,
        specific_letters: [],
        questionIds: []
      },
      katinig_errors: {
        count: 0,
        total: 0,
        percentage: 0,
        specific_letters: [],
        questionIds: []
      },
      overall: {
        letterConfusion: {
          count: incorrectResponses.length,
          percentage: 100
        }
      }
    };

    if (!intervention || !intervention.questions || intervention.questions.length === 0) {
      console.warn('[INTERVENTION GENERATOR] No intervention questions available for detailed analysis');
      return analysis;
    }

    // Create a map of questionId to question data for quick lookup
    const questionMap = {};
    intervention.questions.forEach(question => {
      if (question.questionId) {
        questionMap[question.questionId] = question;
      }
    });

    // Count total questions by type for accurate percentage calculation
    let totalPatinigQuestions = 0;
    let totalKatinigQuestions = 0;

    intervention.questions.forEach(question => {
      if (question.questionType === 'patinig') {
        totalPatinigQuestions++;
      } else if (question.questionType === 'katinig') {
        totalKatinigQuestions++;
      }
    });

    analysis.patinig_errors.total = totalPatinigQuestions;
    analysis.katinig_errors.total = totalKatinigQuestions;

    // Analyze each incorrect response
    incorrectResponses.forEach(response => {
      const question = questionMap[response.questionId];

      if (!question) {
        console.warn(`[INTERVENTION GENERATOR] Question not found for response: ${response.questionId}`);
        return;
      }

      // Classify error by question type
      if (question.questionType === 'patinig') {
        analysis.patinig_errors.count++;
        analysis.patinig_errors.questionIds.push(response.questionId);

        // Extract specific letter from questionValue if available
        if (question.questionValue) {
          const letter = question.questionValue.toUpperCase();
          if (!analysis.patinig_errors.specific_letters.includes(letter)) {
            analysis.patinig_errors.specific_letters.push(letter);
          }
        }
      } else if (question.questionType === 'katinig') {
        analysis.katinig_errors.count++;
        analysis.katinig_errors.questionIds.push(response.questionId);

        // Extract specific letter from questionValue if available
        if (question.questionValue) {
          const letter = question.questionValue.toUpperCase();
          if (!analysis.katinig_errors.specific_letters.includes(letter)) {
            analysis.katinig_errors.specific_letters.push(letter);
          }
        }
      }
    });

    // Calculate percentages
    if (totalPatinigQuestions > 0) {
      analysis.patinig_errors.percentage = Math.round((analysis.patinig_errors.count / totalPatinigQuestions) * 100);
    }

    if (totalKatinigQuestions > 0) {
      analysis.katinig_errors.percentage = Math.round((analysis.katinig_errors.count / totalKatinigQuestions) * 100);
    }

    console.log('[INTERVENTION GENERATOR] Alphabet Knowledge Error Analysis:', {
      patinig: {
        errors: analysis.patinig_errors.count,
        total: analysis.patinig_errors.total,
        percentage: analysis.patinig_errors.percentage,
        letters: analysis.patinig_errors.specific_letters
      },
      katinig: {
        errors: analysis.katinig_errors.count,
        total: analysis.katinig_errors.total,
        percentage: analysis.katinig_errors.percentage,
        letters: analysis.katinig_errors.specific_letters
      }
    });

    return analysis;
  }

  /**
   * Generate doctor's prescription based on error analysis (CLAUDE.md requirement)
   * @param {Object} errorPatterns - Error patterns for the category
   * @param {Object} categoryMastery - Category mastery data
   * @param {Object} interventionPlan - Intervention plan from prescriptive analysis
   * @param {string} category - Category name
   * @returns {Object} Doctor's prescription
   */
  generateDoctorPrescription(errorPatterns, categoryMastery, interventionPlan, category) {
    // Extract REAL deficits from actual error patterns data
    const specificDeficits = [];
    const confusionPairs = [];
    let overallErrorRate = 0;
    let severity = "mild";
    let maxErrorRate = 0;


    if (errorPatterns && Object.keys(errorPatterns).length > 0) {
      // Extract category-specific error patterns from REAL prescriptive analysis data
      if (category === 'Alphabet Knowledge') {
        // Extract vowel errors (patinig_errors)
        if (errorPatterns.patinig_errors) {
          const vowelErrors = errorPatterns.patinig_errors;
          if (vowelErrors.percentage > 0) {
            specificDeficits.push(`Vowel recognition difficulties (${vowelErrors.percentage}% error rate)`);
            if (vowelErrors.specific_letters && vowelErrors.specific_letters.length > 0) {
              specificDeficits.push(`Specific vowel confusions: ${vowelErrors.specific_letters.join(', ')}`);
            }
            maxErrorRate = Math.max(maxErrorRate, vowelErrors.percentage);
          }
        }

        // Extract consonant errors (katinig_errors)
        if (errorPatterns.katinig_errors) {
          const consonantErrors = errorPatterns.katinig_errors;
          if (consonantErrors.percentage > 0) {
            specificDeficits.push(`Consonant recognition difficulties (${consonantErrors.percentage}% error rate)`);
            if (consonantErrors.specific_letters && consonantErrors.specific_letters.length > 0) {
              specificDeficits.push(`Specific consonant confusions: ${consonantErrors.specific_letters.join(', ')}`);
            }
            maxErrorRate = Math.max(maxErrorRate, consonantErrors.percentage);
          }
        }
      } else if (category === 'Phonological Awareness') {
        // Extract matching errors
        if (errorPatterns.matching_errors) {
          const matchingErrors = errorPatterns.matching_errors;
          if (matchingErrors.percentage > 0) {
            specificDeficits.push(`Sound discrimination difficulties (${matchingErrors.percentage}% error rate)`);
            if (matchingErrors.avg_partial_success) {
              specificDeficits.push(`Partial sound matching success: ${Math.round(matchingErrors.avg_partial_success * 100)}%`);
            }
            maxErrorRate = Math.max(maxErrorRate, matchingErrors.percentage);
          }

          // Extract confusion pairs if available
          if (matchingErrors.confusion_pairs && matchingErrors.confusion_pairs.length > 0) {
            matchingErrors.confusion_pairs.forEach(pair => {
              if (pair.sounds) {
                confusionPairs.push({
                  sounds: pair.sounds,
                  confusionRate: pair.confusion_rate || pair.confusionRate
                });
                specificDeficits.push(`${pair.sounds.join('-')} sound confusion (${pair.confusion_rate || pair.confusionRate}% error rate)`);
              }
            });
          }
        }
      } else if (category === 'Decoding') {
        // Extract decoding errors
        if (errorPatterns.decoding_errors) {
          const decodingErrors = errorPatterns.decoding_errors;
          if (decodingErrors.percentage > 0) {
            specificDeficits.push(`Word decoding difficulties (${decodingErrors.percentage}% error rate)`);
            if (decodingErrors.error_type) {
              specificDeficits.push(`Primary difficulty: ${decodingErrors.error_type}`);
            }
            maxErrorRate = Math.max(maxErrorRate, decodingErrors.percentage);
          }
        }
      } else if (category === 'Word Recognition') {
        // Extract word recognition errors
        if (errorPatterns.word_errors) {
          const wordErrors = errorPatterns.word_errors;
          if (wordErrors.percentage > 0) {
            specificDeficits.push(`Word recognition difficulties (${wordErrors.percentage}% error rate)`);
            if (wordErrors.error_type) {
              specificDeficits.push(`Primary difficulty: ${wordErrors.error_type}`);
            }
            maxErrorRate = Math.max(maxErrorRate, wordErrors.percentage);
          }
        }
      } else if (category === 'Reading Comprehension') {
        // Extract comprehension errors
        if (errorPatterns.comprehension_errors) {
          const comprehensionErrors = errorPatterns.comprehension_errors;
          if (comprehensionErrors.percentage > 0) {
            specificDeficits.push(`Reading comprehension difficulties (${comprehensionErrors.percentage}% error rate)`);
            if (comprehensionErrors.error_type) {
              specificDeficits.push(`Primary difficulty: ${comprehensionErrors.error_type}`);
            }
            maxErrorRate = Math.max(maxErrorRate, comprehensionErrors.percentage);
          }
        }
      }

      // If no specific deficits found, look for generic patterns
      if (specificDeficits.length === 0) {
        Object.keys(errorPatterns).forEach(errorType => {
          const pattern = errorPatterns[errorType];
          if (pattern && typeof pattern === 'object') {
            if (pattern.error_type) {
              specificDeficits.push(`${pattern.error_type} difficulties`);
            }
            if (pattern.confusion_pairs) {
              confusionPairs.push(...pattern.confusion_pairs);
            }
            if (pattern.percentage || pattern.error_rate) {
              const rate = pattern.percentage || pattern.error_rate;
              maxErrorRate = Math.max(maxErrorRate, rate);
            }
          }
        });
      }

      // Calculate overall error rate and severity based on REAL data
      overallErrorRate = maxErrorRate;
      if (overallErrorRate >= 70) severity = "severe";
      else if (overallErrorRate >= 40) severity = "moderate";
      else if (overallErrorRate > 0) severity = "mild";
    }

    // Extract mastery probability from real categoryMastery data
    let masteryProbability = 0;
    if (categoryMastery) {
      masteryProbability = categoryMastery.masteryProbability ||
        (categoryMastery.score ? categoryMastery.score / 100 : 0);
    }

    // Generate intervention prescription based on category and REAL error patterns
    const interventionPrescription = this.generateInterventionPrescription(
      category,
      errorPatterns,
      categoryMastery
    );

    return {
      deficitAnalysis: {
        specificDeficits: specificDeficits.length > 0 ? specificDeficits : [`${category} skill deficits - insufficient error pattern data`],
        severity: severity,
        errorRate: `${overallErrorRate}%`,  // REAL error rate from prescriptive analysis
        masteryProbability: masteryProbability,  // REAL mastery data
        confusionPairs: confusionPairs
      },
      interventionPrescription: interventionPrescription,
      materialRecommendations: this.generateMaterialRecommendations(category, errorPatterns)
    };
  }

  /**
   * Generate intervention prescription (CLAUDE.md requirement)
   * @param {string} category - Category name
   * @param {Object} errorPatterns - Error patterns
   * @param {Object} categoryMastery - Category mastery data
   * @returns {Object} Intervention prescription
   */
  generateInterventionPrescription(category, errorPatterns, categoryMastery) {
    const baseRecommendations = {
      'Alphabet Knowledge': {
        primaryApproach: 'Visual-tactile multisensory approach',
        specificTechniques: [
          'Letter-sound correspondence training',
          'Visual discrimination exercises',
          'Tactile letter tracing'
        ]
      },
      'Phonological Awareness': {
        primaryApproach: 'Auditory discrimination training',
        specificTechniques: [
          'Sound isolation practice',
          'Minimal pair discrimination',
          'Sequential sound processing'
        ]
      },
      'Decoding': {
        primaryApproach: 'Systematic phonics instruction',
        specificTechniques: [
          'Blending practice',
          'Segmentation exercises',
          'CVC pattern practice'
        ]
      },
      'Word Recognition': {
        primaryApproach: 'Sight word instruction with context',
        specificTechniques: [
          'High-frequency word practice',
          'Context clue strategies',
          'Word family patterns'
        ]
      },
      'Reading Comprehension': {
        primaryApproach: 'Strategic reading instruction',
        specificTechniques: [
          'Main idea identification',
          'Literal comprehension strategies',
          'Story structure analysis'
        ]
      }
    };

    const base = baseRecommendations[category] || baseRecommendations['Alphabet Knowledge'];

    // Determine intensity based on mastery score
    let intensityLevel = 'moderate';
    if (categoryMastery && categoryMastery.score) {
      if (categoryMastery.score < 40) intensityLevel = 'highly_intensive';
      else if (categoryMastery.score < 60) intensityLevel = 'high';
      else intensityLevel = 'moderate';
    }

    return {
      primaryApproach: base.primaryApproach,
      recommendedQuestionCount: null, // Will be set by question count calculation
      intensityLevel: intensityLevel,
      sessionStructure: {
        optimalLength: intensityLevel === 'highly_intensive' ? '15-20 minutes with frequent breaks' : '20-30 minutes with breaks',
        breakPattern: intensityLevel === 'highly_intensive' ? 'Every 5 minutes' : 'Every 10 minutes'
      },
      specificTechniques: base.specificTechniques
    };
  }

  /**
   * Generate material recommendations (CLAUDE.md requirement)
   * @param {string} category - Category name
   * @param {Object} errorPatterns - Error patterns
   * @returns {Array} Material recommendations
   */
  generateMaterialRecommendations(category, errorPatterns) {
    const baseMaterials = {
      'Alphabet Knowledge': [
        'Letter recognition flashcards',
        'Tactile letter cards',
        'Visual discrimination worksheets'
      ],
      'Phonological Awareness': [
        'Audio discrimination materials',
        'Sound matching games',
        'Rhyming picture cards'
      ],
      'Decoding': [
        'Phonics workbooks',
        'Blending boards',
        'Word building materials'
      ],
      'Word Recognition': [
        'Sight word cards',
        'Context reading passages',
        'Word family charts'
      ],
      'Reading Comprehension': [
        'Leveled reading passages',
        'Comprehension question cards',
        'Story mapping templates'
      ]
    };

    return baseMaterials[category] || baseMaterials['Alphabet Knowledge'];
  }

  /**
   * Generate teacher implementation data (CLAUDE.md requirement)
   * @param {Object} questionGeneration - Question generation result
   * @param {number} optimalQuestionCount - Calculated question count
   * @returns {Object} Teacher implementation data
   */
  generateTeacherImplementation(questionGeneration, optimalQuestionCount) {
    // CLAUDE.md Doctor-Teacher-Student Model: Teacher will implement the prescription
    const questionDistribution = new Map();

    // Since no questions are auto-generated, teacher needs to create all questions
    questionDistribution.set('teacher_to_create', optimalQuestionCount);

    return {
      implementedBy: null, // REQUIRED FIELD - Will be set when teacher implements
      implementationDate: null, // Will be set when teacher implements
      prescriptionFollowed: null, // Will be set when teacher implements
      questionDistribution: questionDistribution
    };
  }

  /**
   * Generate question count calculation details (CLAUDE.md requirement)
   * @param {Object} errorPatterns - Error patterns
   * @param {Object} categoryMastery - Category mastery data
   * @param {string} category - Category name
   * @param {string} readingLevel - Student's reading level
   * @param {number} finalCount - Final calculated count
   * @returns {Object} Question count calculation details
   */
  generateQuestionCountCalculation(errorPatterns, categoryMastery, category, readingLevel, finalCount) {
    // Base counts by reading level
    const baseCountByLevel = {
      'Low Emerging': 8,
      'High Emerging': 10,
      'Developing': 12,
      'Transitioning': 14,
      'At Grade Level': 16
    };

    const baseCount = baseCountByLevel[readingLevel] || 10;

    // Calculate adjustments
    let errorSeverityAdjustment = 0;
    let errorSeverityLevel = 'low';
    let errorPercentage = 0;

    if (errorPatterns && Object.keys(errorPatterns).length > 0) {
      // Find highest error rate
      Object.values(errorPatterns).forEach(pattern => {
        const rate = pattern.percentage || pattern.error_rate || 0;
        if (rate > errorPercentage) {
          errorPercentage = rate;
        }
      });

      if (errorPercentage >= 70) {
        errorSeverityLevel = 'severe';
        errorSeverityAdjustment = 4;
      } else if (errorPercentage >= 50) {
        errorSeverityLevel = 'high';
        errorSeverityAdjustment = 3;
      } else if (errorPercentage >= 30) {
        errorSeverityLevel = 'moderate';
        errorSeverityAdjustment = 2;
      } else {
        errorSeverityLevel = 'low';
        errorSeverityAdjustment = 0;
      }
    }

    let masteryAdjustment = 0;
    if (categoryMastery && categoryMastery.score) {
      if (categoryMastery.score < 40) masteryAdjustment = 2;
      else if (categoryMastery.score < 60) masteryAdjustment = 1;
      else masteryAdjustment = -1;
    }

    // Category complexity multiplier
    const categoryComplexity = {
      'Alphabet Knowledge': 0.8,
      'Phonological Awareness': 1.1,
      'Decoding': 1.0,
      'Word Recognition': 1.0,
      'Reading Comprehension': 1.2
    };

    const complexityMultiplier = categoryComplexity[category] || 1.0;
    const complexityAdjustment = Math.round((complexityMultiplier - 1.0) * baseCount);

    // Generate rationale
    const rationale = `Started with base count of ${baseCount} for ${readingLevel} level, ` +
      `${errorSeverityAdjustment > 0 ? `increased by ${errorSeverityAdjustment} due to ${errorSeverityLevel} error severity (${errorPercentage}% error rate), ` : ''}` +
      `${masteryAdjustment !== 0 ? `${masteryAdjustment > 0 ? 'increased' : 'decreased'} by ${Math.abs(masteryAdjustment)} based on mastery score of ${categoryMastery?.score || 0}%, ` : ''}` +
      `${complexityAdjustment !== 0 ? `${complexityAdjustment > 0 ? 'increased' : 'decreased'} by ${Math.abs(complexityAdjustment)} for category complexity (${complexityMultiplier}x), ` : ''}` +
      `= ${finalCount} total questions`;

    return {
      finalCount: finalCount,
      rationale: rationale,
      factors: {
        base: baseCount,
        errorSeverity: {
          level: errorSeverityLevel,
          adjustment: errorSeverityAdjustment,
          percentage: errorPercentage
        },
        masteryLevel: {
          score: categoryMastery?.score || 0,
          adjustment: masteryAdjustment
        },
        categoryComplexity: {
          multiplier: complexityMultiplier,
          adjustment: complexityAdjustment
        },
        interventionHistory: {
          attemptCount: 1,
          adjustment: 0
        }
      },
      calculatedAt: new Date()
    };
  }

  /**
   * Update category_results to link with the intervention assessment
   * @param {number} studentId - Student ID
   * @param {string} category - Category name
   * @param {string} interventionId - Intervention assessment ID
   */
  async updateCategoryResultInterventionId(studentId, category, interventionId) {
    console.log(`[INTERVENTION GENERATOR] Updating category_results currentInterventionId for student ${studentId}, category: ${category}`);

    // Find the category_results document that contains this category
    const categoryResults = await CategoryResult.find({
      studentId: studentId,
      'categories.categoryName': category
    });

    if (!categoryResults || categoryResults.length === 0) {
      throw new Error(`No category_results found for student ${studentId} and category ${category}`);
    }

    // Update the currentInterventionId for the specific category across all matching documents
    for (const categoryResult of categoryResults) {
      let updated = false;

      for (const cat of categoryResult.categories) {
        if (cat.categoryName === category) {
          cat.currentInterventionId = interventionId;
          cat.interventionAttempts = (cat.interventionAttempts || 0) + 1;

          // NOTE: interventionHistory is only updated when intervention is COMPLETED
          // with all required fields: interventionResultId, score, isPassed, attemptedAt, completedAt
          // During creation, we only update currentInterventionId to track the active intervention

          updated = true;
          console.log(`[INTERVENTION GENERATOR] Updated ${category} currentInterventionId to ${interventionId} (attempt #${cat.interventionAttempts})`);
        }
      }

      if (updated) {
        await categoryResult.save();
        console.log(`[INTERVENTION GENERATOR] ✅ Saved category_results ${categoryResult._id} with updated currentInterventionId`);
      }
    }
  }

  /**
   * Clear currentInterventionId when intervention is completed successfully
   * @param {number} studentId - Student ID
   * @param {string} category - Category name
   * @param {string} interventionId - Intervention assessment ID
   * @param {boolean} passed - Whether the intervention was passed
   */
  async clearCategoryResultInterventionId(studentId, category, interventionId, passed) {
    console.log(`[INTERVENTION GENERATOR] Clearing currentInterventionId for student ${studentId}, category: ${category}, passed: ${passed}`);

    // Find the category_results document that contains this category
    const categoryResults = await CategoryResult.find({
      studentId: studentId,
      'categories.categoryName': category,
      'categories.currentInterventionId': interventionId
    });

    for (const categoryResult of categoryResults) {
      let updated = false;

      for (const cat of categoryResult.categories) {
        if (cat.categoryName === category && cat.currentInterventionId?.toString() === interventionId.toString()) {
          // Clear the current intervention ID
          cat.currentInterventionId = null;
          cat.interventionCompleted = true;

          // Update intervention history
          const historyEntry = cat.interventionHistory?.find(h => h.interventionId?.toString() === interventionId.toString());
          if (historyEntry) {
            historyEntry.status = passed ? 'passed' : 'failed';
            historyEntry.completedAt = new Date();
          }

          // If intervention passed, update the category as passed
          if (passed) {
            cat.isPassed = true;
            cat.interventionRequired = false;
            console.log(`[INTERVENTION GENERATOR] ✅ Category ${category} marked as passed via intervention`);
          }

          updated = true;
        }
      }

      if (updated) {
        await categoryResult.save();
        console.log(`[INTERVENTION GENERATOR] ✅ Cleared currentInterventionId for category_results ${categoryResult._id}`);
      }
    }
  }

  /**
   * Auto-save custom questions to templates_questions collection for future reuse
   * This builds up the template library over time as teachers create interventions
   * @param {Array} customQuestions - Array of custom questions to save
   * @param {string} category - Category of the questions
   * @param {string} createdBy - ID of the user/system creating the template
   * @returns {Object} Save results
   */
  async autoSaveCustomQuestionsToTemplates(customQuestions, category, createdBy = null) {
    console.log(`[INTERVENTION GENERATOR] Auto-saving ${customQuestions.length} custom questions to templates_questions collection`);

    const saveResults = {
      attempted: customQuestions.length,
      succeeded: 0,
      failed: 0,
      errors: []
    };

    for (const question of customQuestions) {
      try {
        // Only save questions marked as 'custom' source
        if (question.source !== 'custom') {
          continue;
        }

        // Create template question from intervention question
        const templateData = {
          category: category,
          questionType: question.questionType,
          questionText: question.questionText,
          questionImage: question.questionImage || null,
          questionValue: question.questionValue || null,
          targetSkills: this.extractTargetSkillsFromQuestion(question, category),
          difficultyLevel: 'medium', // Default to medium difficulty
          createdBy: createdBy || new mongoose.Types.ObjectId(), // System-generated if no user
          isActive: true
        };

        // Add category-specific fields
        switch (category) {
          case 'Alphabet Knowledge':
            if (question.choiceOptions && question.choiceOptions.length > 0) {
              templateData.choiceOptions = question.choiceOptions;
            }
            break;

          case 'Phonological Awareness':
            if (question.questionSet && question.questionSet.length > 0) {
              templateData.questionSet = question.questionSet[0]; // Extract first questionSet
              templateData.matchCount = question.questionSet[0]?.correctPairs?.length || 3;
            }
            break;

          case 'Decoding':
            templateData.displaySequence = question.displaySequence || null;
            templateData.dragElements = question.dragElements || [];
            templateData.correctSequence = question.correctSequence || [];
            templateData.blankPosition = question.blankPosition || null;
            break;

          case 'Word Recognition':
            templateData.displayWord = question.displayWord || null;
            templateData.blankOptions = question.blankOptions || [];
            templateData.correctAnswer = question.correctAnswer || [];
            break;

          case 'Reading Comprehension':
            // Reading Comprehension uses sentence_templates collection, not templates_questions
            console.log(`[INTERVENTION GENERATOR] Skipping Reading Comprehension question - uses sentence_templates collection`);
            continue;
        }

        // Check if similar template already exists (avoid duplicates)
        const existingTemplate = await TemplateQuestion.findOne({
          category: category,
          questionType: question.questionType,
          questionText: question.questionText,
          isActive: true
        });

        if (existingTemplate) {
          console.log(`[INTERVENTION GENERATOR] Template already exists for: ${question.questionText.substring(0, 50)}...`);
          continue;
        }

        // Create and save the template
        const template = new TemplateQuestion(templateData);
        await template.save();

        saveResults.succeeded++;
        console.log(`[INTERVENTION GENERATOR] ✅ Saved custom question as template: ${question.questionId}`);

      } catch (error) {
        console.error(`[INTERVENTION GENERATOR] ❌ Failed to save custom question as template: ${question.questionId}`, error.message);
        saveResults.failed++;
        saveResults.errors.push({
          questionId: question.questionId,
          error: error.message
        });
      }
    }

    console.log(`[INTERVENTION GENERATOR] Auto-save completed: ${saveResults.succeeded} succeeded, ${saveResults.failed} failed`);
    return saveResults;
  }

  /**
   * Extract target skills from a question based on its content and category
   * @param {Object} question - The intervention question
   * @param {string} category - Question category
   * @returns {Array} Array of target skills
   */
  extractTargetSkillsFromQuestion(question, category) {
    const skills = [];

    switch (category) {
      case 'Alphabet Knowledge':
        if (question.questionType === 'patinig') {
          skills.push('vowel_recognition');
        } else if (question.questionType === 'katinig') {
          skills.push('consonant_recognition');
        }
        if (question.questionValue) {
          skills.push(`letter_${question.questionValue.toLowerCase()}`);
        }
        break;

      case 'Phonological Awareness':
        skills.push('sound_discrimination');
        if (question.questionSet && question.questionSet[0]?.audioTexts) {
          const sounds = question.questionSet[0].audioTexts;
          if (sounds.includes('B') && sounds.includes('P')) {
            skills.push('B_P_discrimination');
          }
          if (sounds.includes('M') && sounds.includes('N')) {
            skills.push('M_N_discrimination');
          }
        }
        break;

      case 'Decoding':
        if (question.questionType === 'complete_word_identification') {
          skills.push('word_identification');
        } else if (question.questionType === 'fill_missing_letter') {
          skills.push('initial_sound_identification');
        }
        break;

      case 'Word Recognition':
        if (question.questionType === 'sentence_completion') {
          skills.push('context_clues');
        } else if (question.questionType === 'rhyming_words') {
          skills.push('rhyming_patterns');
        }
        break;
    }

    return skills;
  }

  // ===== COMPREHENSIVE INTERVENTION ANALYSIS METHODS =====

  /**
   * Get previous main assessment score for comparison from prescriptive analysis
   */
  async getPreviousMainAssessmentScore(studentId, category, prescriptiveAnalysisId) {
    try {
      // First try to get from the prescriptive analysis that created this intervention
      if (prescriptiveAnalysisId) {
        const PrescriptiveAnalysis = require('../../models/Teachers/ManageProgress/prescriptiveAnalysisModel');
        const analysis = await PrescriptiveAnalysis.findById(prescriptiveAnalysisId);

        if (analysis && analysis.skillMastery && analysis.skillMastery[category]) {
          console.log(`[INTERVENTION ANALYSIS] Found previous score from prescriptive analysis: ${analysis.skillMastery[category].score}%`);
          return analysis.skillMastery[category].score || 0;
        }
      }

      // Fallback to category results
      const CategoryResults = require('../../models/Teachers/ManageProgress/categoryResultModel');
      const categoryResult = await CategoryResults.findOne({
        studentId: studentId,
        'categories.categoryName': category
      }).sort({ createdAt: -1 });

      if (categoryResult) {
        const categoryData = categoryResult.categories.find(cat => cat.categoryName === category);
        const score = categoryData ? categoryData.score : 0;
        console.log(`[INTERVENTION ANALYSIS] Found previous score from category results: ${score}%`);
        return score;
      }

      console.log(`[INTERVENTION ANALYSIS] No previous score found for student ${studentId}, category ${category}`);
      return 0;
    } catch (error) {
      console.error('[INTERVENTION ANALYSIS] Error getting previous score:', error);
      return 0;
    }
  }

  /**
   * Comprehensive error pattern analysis for intervention
   */
  async analyzeComprehensiveInterventionErrors(responses, category, intervention, totalQuestions, correctAnswers) {
    const incorrectResponses = responses.filter(r => !r.isCorrect);
    const errorCount = incorrectResponses.length;
    const errorRate = Math.round((errorCount / totalQuestions) * 100);

    const baseAnalysis = {
      count: errorCount,
      total: totalQuestions,
      percentage: errorRate,
      questionIds: incorrectResponses.map(r => r.questionId),
      error_type: this.determineErrorType(category, incorrectResponses),
      currentPatterns: [`${errorRate}% error rate in ${category}`],
      errorReductionRate: Math.max(0, 50 - errorRate) // Assume 50% was typical before intervention
    };

    // Category-specific error analysis
    switch (category) {
      case 'Alphabet Knowledge':
        return {
          ...baseAnalysis,
          patinig_errors: {
            count: incorrectResponses.filter(r => r.questionId?.includes('patinig')).length,
            total: responses.filter(r => r.questionId?.includes('patinig')).length,
            percentage: this.calculateSubErrorRate(responses, 'patinig'),
            specific_letters: this.extractErrorLetters(incorrectResponses, 'patinig'),
            error_type: 'vowel_confusion',
            questionIds: incorrectResponses.filter(r => r.questionId?.includes('patinig')).map(r => r.questionId),
            researchClassification: 'phonemic_awareness_deficit',
            interventionFocus: 'vowel_discrimination_practice'
          },
          katinig_errors: {
            count: incorrectResponses.filter(r => r.questionId?.includes('katinig')).length,
            total: responses.filter(r => r.questionId?.includes('katinig')).length,
            percentage: this.calculateSubErrorRate(responses, 'katinig'),
            specific_letters: this.extractErrorLetters(incorrectResponses, 'katinig'),
            error_type: 'consonant_confusion',
            questionIds: incorrectResponses.filter(r => r.questionId?.includes('katinig')).map(r => r.questionId),
            researchClassification: 'visual_processing_deficit',
            interventionFocus: 'consonant_discrimination_practice'
          },
          detailedErrorAnalysis: [{
            errorPattern: `${errorRate}% overall error rate`,
            interventionFocus: 'systematic_letter_review',
            specificPairs: this.identifyConfusionPairs(incorrectResponses)
          }]
        };

      case 'Phonological Awareness':
        return {
          ...baseAnalysis,
          matching_errors: {
            count: errorCount,
            total: totalQuestions,
            percentage: errorRate,
            avg_partial_success: this.calculatePartialMatchSuccess(responses),
            error_type: 'sound_discrimination',
            confusion_pairs: this.identifyPhonologicalConfusions(incorrectResponses),
            sequential_difficulty: {
              two_sounds: this.calculateSequentialDifficulty(responses, 2),
              three_sounds: this.calculateSequentialDifficulty(responses, 3),
              four_sounds: this.calculateSequentialDifficulty(responses, 4)
            },
            questionIds: baseAnalysis.questionIds
          },
          detailedErrorAnalysis: [{
            errorPattern: 'sound_discrimination_difficulty',
            interventionFocus: 'phoneme_discrimination_training',
            specificPairs: ['B-P', 'M-N', 'D-T']
          }]
        };

      case 'Decoding':
        return {
          ...baseAnalysis,
          decoding_errors: {
            count: errorCount,
            total: totalQuestions,
            percentage: errorRate,
            position_analysis: {
              beginning: this.calculatePositionErrors(incorrectResponses, 'beginning'),
              middle: this.calculatePositionErrors(incorrectResponses, 'middle'),
              end: this.calculatePositionErrors(incorrectResponses, 'end')
            },
            most_error_position: this.getMostErrorPosition(incorrectResponses),
            pattern_types: [
              { pattern: 'CVC', error_rate: this.getPatternErrorRate(incorrectResponses, 'CVC') },
              { pattern: 'CVCV', error_rate: this.getPatternErrorRate(incorrectResponses, 'CVCV') }
            ],
            error_type: 'word_decoding_difficulty',
            questionIds: baseAnalysis.questionIds
          },
          detailedErrorAnalysis: [{
            errorPattern: 'word_decoding_difficulty',
            interventionFocus: 'systematic_phonics_instruction',
            specificPairs: this.identifyDecodingConfusions(incorrectResponses)
          }]
        };

      case 'Word Recognition':
        return {
          ...baseAnalysis,
          word_errors: {
            count: errorCount,
            total: totalQuestions,
            percentage: errorRate,
            sentence_completion_errors: this.countSentenceCompletionErrors(incorrectResponses),
            rhyming_errors: this.countRhymingErrors(incorrectResponses),
            error_type: 'context_comprehension',
            secondary_type: 'sight_word_recognition',
            questionIds: baseAnalysis.questionIds
          },
          detailedErrorAnalysis: [{
            errorPattern: 'word_recognition_difficulty',
            interventionFocus: 'sight_word_practice_and_context_clues',
            specificPairs: this.identifyWordConfusions(incorrectResponses)
          }]
        };

      case 'Reading Comprehension':
        return {
          ...baseAnalysis,
          comprehension_errors: {
            count: errorCount,
            total: totalQuestions,
            percentage: errorRate,
            question_breakdown: this.analyzeComprehensionQuestionBreakdown(responses),
            scoring_methodology: 'all_or_nothing',
            scoring_rule: 'Each question requires ALL sentence questions correct - no partial credit',
            literal_comprehension: {
              errors: this.countLiteralComprehensionErrors(incorrectResponses),
              description: 'Difficulty finding stated facts in story context'
            },
            error_type: 'reading_comprehension_deficit',
            failed_questionIds: baseAnalysis.questionIds,
            diagnostic_note: 'Student shows partial understanding but fails all-or-nothing requirement'
          },
          detailedErrorAnalysis: [{
            errorPattern: 'reading_comprehension_difficulty',
            interventionFocus: 'guided_reading_with_comprehension_strategies',
            specificPairs: this.identifyComprehensionWeaknesses(incorrectResponses)
          }]
        };

      default:
        return {
          ...baseAnalysis,
          detailedErrorAnalysis: [{
            errorPattern: `general_${category.toLowerCase()}_errors`,
            interventionFocus: `targeted_${category.toLowerCase()}_practice`,
            specificPairs: []
          }]
        };
    }
  }

  /**
   * Calculate BKT mastery probability for intervention
   */
  async calculateInterventionBKTMastery(responses, category, previousScore, currentScore) {
    // Simplified BKT calculation based on response patterns
    const correctCount = responses.filter(r => r.isCorrect).length;
    const totalCount = responses.length;

    // Base mastery probability from current performance
    const currentMastery = Math.min(0.9, Math.max(0.1, currentScore / 100));
    const previousMastery = Math.min(0.9, Math.max(0.1, previousScore / 100));
    const masteryGrowth = currentMastery - previousMastery;

    // Build response history with evolving mastery
    const responseHistory = [];
    let runningMastery = previousMastery;

    responses.forEach((response, index) => {
      // Update mastery based on response (simplified BKT)
      if (response.isCorrect) {
        runningMastery = Math.min(0.9, runningMastery + 0.05); // Learn from correct
      } else {
        runningMastery = Math.max(0.1, runningMastery - 0.03); // Adjust down from incorrect
      }

      responseHistory.push({
        questionId: response.questionId,
        correct: response.isCorrect,
        timestamp: response.answeredAt || new Date(),
        masteryAfter: Math.round(runningMastery * 100) / 100
      });
    });

    return {
      masteryProbability: currentMastery,
      previousMastery: previousMastery,
      currentMastery: currentMastery,
      masteryGrowth: masteryGrowth,
      lastUpdated: new Date(),
      totalQuestions: totalCount,
      correctAnswers: correctCount,
      score: currentScore,
      isPassed: currentScore >= 75,
      status: this.determineMasteryStatus(currentMastery),
      responseHistory: responseHistory
    };
  }

  /**
   * Calculate IRT ability estimates
   */
  calculateInterventionIRTAbility(score, category) {
    // Convert percentage score to IRT scale (-3 to +3)
    const normalizedScore = (score - 50) / 25; // Convert 0-100 to roughly -2 to +2
    const abilityEstimate = Math.max(-3, Math.min(3, normalizedScore));

    return {
      [category]: Math.round(abilityEstimate * 100) / 100
    };
  }

  /**
   * Generate research-based prescriptions for next steps
   */
  async generateInterventionPrescriptions(category, score, isPassed, improvement, errorPatterns, studentId) {
    const categoryStatus = isPassed ? 'passed' :
                          improvement > 10 ? 'failed_needs_revision' :
                          'failed_needs_escalation';

    const prescription = {
      categoryStatus: categoryStatus,

      deficitAnalysis: {
        specificDeficits: [{
          deficit: this.identifyPrimaryDeficit(category, score, errorPatterns),
          severity: this.calculateDeficitSeverity(score, improvement),
          manifestation: `${errorPatterns.percentage || 0}% error rate in ${category}`,
          errorRate: `${errorPatterns.percentage || 0}%`,
          researchEvidence: this.getResearchEvidence(category),
          interventionResponse: improvement > 5 ? 'positive_response' : 'minimal_response'
        }],
        rootCauseAnalysis: this.analyzeRootCause(category, errorPatterns),
        cognitiveFactors: this.identifyCognitiveFactors(category),
        linguisticFactors: ['letter_sound_correspondence', 'phonemic_awareness'],
        researchClassification: this.getResearchClassification(category, score)
      },

      nextInterventionPrescription: {
        recommendedAction: categoryStatus,
        primaryApproach: this.recommendPrimaryApproach(category, improvement),
        specificTechniques: [{
          technique: this.recommendSpecificTechnique(category, errorPatterns),
          description: `Targeted practice for ${category} with emphasis on error patterns`,
          duration: improvement > 10 ? '2-3 weeks' : '4-6 weeks',
          materials: this.recommendMaterials(category),
          progressCriteria: '75% accuracy threshold',
          researchBasis: 'Evidence-based reading intervention research',
          modificationFromPrevious: improvement > 5 ? 'minor_adjustments' : 'major_restructuring'
        }],
        intensityLevel: this.determineIntensityLevel(improvement, score),
        sessionStructure: {
          optimalLength: '15-20 minutes',
          sessionComponents: this.getSessionComponents(category),
          breakPattern: 'Every 5-7 minutes'
        },
        materialRecommendations: this.getMaterialRecommendations(category),
        progressMonitoring: {
          frequency: 'Weekly assessment',
          keyIndicators: [`${category} accuracy rate`, 'response time improvement'],
          dataCollectionMethod: 'Performance tracking with error analysis'
        }
      },

      teacherRevisionGuidance: {
        revisionRecommended: !isPassed && improvement > 5,
        revisionPriority: this.determineRevisionPriority(improvement, score),
        specificChanges: this.getSpecificRevisionChanges(category, errorPatterns, improvement),
        questionModifications: this.getQuestionModifications(category, errorPatterns),
        supportFeatures: this.getSupportFeatures(category),
        estimatedImpact: improvement > 10 ? '5-10% improvement expected' : '15-25% improvement needed'
      },

      escalationProtocol: {
        escalationTriggered: categoryStatus === 'failed_needs_escalation',
        triggers: this.getEscalationTriggers(improvement, score)
      }
    };

    return prescription;
  }

  /**
   * Analyze intervention effectiveness
   */
  analyzeInterventionEffectiveness(previousScore, currentScore, improvement, errorPatterns, skillMasteryAnalysis) {
    const effectiveness = improvement > 15 ? 'HIGHLY_EFFECTIVE' :
                         improvement > 10 ? 'MODERATELY_EFFECTIVE' :
                         improvement > 5 ? 'MINIMALLY_EFFECTIVE' : 'INEFFECTIVE';

    return {
      overallEffectiveness: effectiveness,
      errorPatternResolution: {
        resolved: improvement > 15 ? ['primary_errors'] : [],
        improved: improvement > 5 ? ['secondary_patterns'] : [],
        persistent: improvement < 10 ? ['core_deficits'] : [],
        new_patterns: []
      },
      skillProgression: {
        masteryGrowth: skillMasteryAnalysis.masteryGrowth || 0,
        responseTimeImprovement: improvement > 5 ? 0.8 : 0.2,
        consistencyImprovement: improvement / 100
      },
      interventionInsights: {
        strengths: this.identifyInterventionStrengths(improvement, currentScore),
        weaknesses: this.identifyInterventionWeaknesses(improvement, errorPatterns),
        teachingApproachEffectiveness: effectiveness.toLowerCase()
      }
    };
  }

  /**
   * Generate comprehensive insights for intervention results
   */
  generateComprehensiveInsights(category, score, isPassed, improvement, skillMasteryAnalysis, errorPatterns) {
    const strengths = [];
    const weaknesses = [];

    // Analyze strengths
    if (improvement > 15) {
      strengths.push(`Significant improvement (+${improvement}%) in ${category}`);
    }
    if (score >= 65) {
      strengths.push(`Near-mastery level performance (${score}%)`);
    }
    if (skillMasteryAnalysis.masteryGrowth > 0.2) {
      strengths.push('Strong learning progression demonstrated');
    }

    // Analyze weaknesses
    if (score < 50) {
      weaknesses.push(`Below-average performance in ${category} (${score}%)`);
    }
    if (improvement < 5) {
      weaknesses.push('Minimal learning gains from intervention');
    }
    if (errorPatterns.percentage > 60) {
      weaknesses.push(`High error rate (${errorPatterns.percentage}%) indicates persistent difficulties`);
    }

    return {
      strengths: strengths,
      weaknesses: weaknesses,
      overallReadiness: this.assessOverallReadiness(score, improvement),
      recommendedAction: isPassed ? 'category_completion' :
                        improvement > 10 ? 'teacher_revision' : 'face_to_face_intervention',
      interventionImpact: this.describeInterventionImpact(improvement, score),
      nextStepsRationale: this.generateNextStepsRationale(score, isPassed, improvement)
    };
  }

  // ===== HELPER METHODS FOR COMPREHENSIVE ANALYSIS =====

  determineErrorType(category, incorrectResponses) {
    switch (category) {
      case 'Alphabet Knowledge': return 'letter_confusion';
      case 'Phonological Awareness': return 'sound_discrimination';
      case 'Decoding': return 'phonics_application';
      case 'Word Recognition': return 'sight_word_recall';
      case 'Reading Comprehension': return 'text_comprehension';
      default: return 'general_difficulty';
    }
  }

  calculateSubErrorRate(responses, subType) {
    const subResponses = responses.filter(r => r.questionId?.includes(subType));
    const subIncorrect = subResponses.filter(r => !r.isCorrect);
    return subResponses.length > 0 ? Math.round((subIncorrect.length / subResponses.length) * 100) : 0;
  }

  extractErrorLetters(incorrectResponses, type) {
    // Extract specific letters from error responses
    const letters = [];
    incorrectResponses.forEach(response => {
      if (response.response && typeof response.response === 'string') {
        letters.push(response.response.toUpperCase());
      }
    });
    return [...new Set(letters)]; // Remove duplicates
  }

  identifyConfusionPairs(incorrectResponses) {
    // Identify common confusion pairs (simplified)
    return ['B-D', 'P-Q', 'M-N'];
  }

  calculatePartialMatchSuccess(responses) {
    // For Phonological Awareness matching questions
    return responses.reduce((acc, r) => {
      if (r.correctMatches && r.totalMatches) {
        return acc + (r.correctMatches / r.totalMatches);
      }
      return acc + (r.isCorrect ? 1 : 0);
    }, 0) / responses.length;
  }

  identifyPhonologicalConfusions(incorrectResponses) {
    return [
      { sounds: ['B', 'P'], confusion_rate: 75 },
      { sounds: ['M', 'N'], confusion_rate: 60 }
    ];
  }

  calculateSequentialDifficulty(responses, soundCount) {
    // Calculate success rate for different numbers of sounds
    return Math.max(0, 80 - (soundCount * 20)); // Simplified calculation
  }

  determineMasteryStatus(masteryProbability) {
    if (masteryProbability >= 0.8) return 'EXCELLENT';
    if (masteryProbability >= 0.65) return 'GOOD';
    if (masteryProbability >= 0.5) return 'ADEQUATE';
    if (masteryProbability >= 0.3) return 'NEEDS_IMPROVEMENT';
    return 'CRITICAL';
  }

  identifyPrimaryDeficit(category, score, errorPatterns) {
    if (score < 40) return `Severe ${category} difficulties`;
    if (score < 60) return `Moderate ${category} challenges`;
    return `Mild ${category} gaps`;
  }

  calculateDeficitSeverity(score, improvement) {
    if (score < 40) return 'severe';
    if (score < 60) return 'moderate';
    if (improvement < 5) return 'moderate';
    return 'mild';
  }

  getResearchEvidence(category) {
    const evidence = {
      'Alphabet Knowledge': 'Adams (1990) - Letter knowledge is fundamental to reading acquisition',
      'Phonological Awareness': 'National Reading Panel (2000) - Phonemic awareness training improves reading',
      'Decoding': 'Ehri (2005) - Systematic phonics instruction enhances decoding skills',
      'Word Recognition': 'Perfetti (1992) - Automatic word recognition frees cognitive resources',
      'Reading Comprehension': 'Duke & Pearson (2002) - Comprehension strategies improve understanding'
    };
    return evidence[category] || 'Research-based intervention approaches';
  }

  analyzeRootCause(category, errorPatterns) {
    return `Primary difficulties in ${category} stem from ${errorPatterns.error_type || 'foundational skills gaps'}`;
  }

  identifyCognitiveFactors(category) {
    return ['working_memory', 'attention', 'processing_speed', 'phonological_processing'];
  }

  getResearchClassification(category, score) {
    if (score < 40) return 'at_risk_for_reading_disability';
    if (score < 60) return 'below_average_reading_skills';
    return 'developing_reading_skills';
  }

  recommendPrimaryApproach(category, improvement) {
    if (improvement > 10) return 'systematic_review_with_extensions';
    return 'intensive_foundational_skill_building';
  }

  recommendSpecificTechnique(category, errorPatterns) {
    const techniques = {
      'Alphabet Knowledge': 'Multisensory letter identification',
      'Phonological Awareness': 'Phoneme discrimination training',
      'Decoding': 'Systematic phonics instruction',
      'Word Recognition': 'High-frequency word practice',
      'Reading Comprehension': 'Guided reading with questioning'
    };
    return techniques[category] || 'Individualized skill practice';
  }

  recommendMaterials(category) {
    const materials = {
      'Alphabet Knowledge': 'Letter cards, sand trays, magnetic letters',
      'Phonological Awareness': 'Sound boxes, minimal pair cards',
      'Decoding': 'Decodable texts, word building materials',
      'Word Recognition': 'Sight word flashcards, word walls',
      'Reading Comprehension': 'Leveled texts, graphic organizers'
    };
    return materials[category] || 'Appropriate instructional materials';
  }

  determineIntensityLevel(improvement, score) {
    if (score < 40 || improvement < 5) return 'highly_intensive';
    if (score < 60 || improvement < 10) return 'intensive';
    return 'moderate';
  }

  getSessionComponents(category) {
    return ['warm_up_review', 'explicit_instruction', 'guided_practice', 'independent_practice', 'progress_monitoring'];
  }

  getMaterialRecommendations(category) {
    return [this.recommendMaterials(category), 'Progress monitoring tools', 'Reinforcement materials'];
  }

  determineRevisionPriority(improvement, score) {
    if (improvement > 10 && score > 60) return 'low';
    if (improvement > 5 || score > 50) return 'medium';
    return 'high';
  }

  getSpecificRevisionChanges(category, errorPatterns, improvement) {
    return [{
      change: 'Reduce question difficulty',
      rationale: improvement > 5 ? 'Student showing progress but needs support' : 'Current level too challenging',
      expectedImpact: '10-15% improvement expected'
    }];
  }

  getQuestionModifications(category, errorPatterns) {
    return [{
      questionType: category,
      currentDifficulty: 'moderate',
      recommendedChange: 'Add visual supports',
      reason: 'Reduce cognitive load'
    }];
  }

  getSupportFeatures(category) {
    return ['Visual cues', 'Audio replay', 'Immediate feedback', 'Progress indicators'];
  }

  getEscalationTriggers(improvement, score) {
    if (improvement < 5 && score < 50) {
      return [{
        trigger: 'Minimal improvement after intervention',
        approach: 'Intensive one-on-one instruction',
        researchFoundation: 'RTI Tier 3 interventions',
        specificTechniques: [{
          technique: 'Daily individualized instruction',
          purpose: 'Address specific skill deficits',
          implementation: '20-30 minutes daily',
          materials: ['Diagnostic assessments', 'Targeted practice materials'],
          progression: 'Systematic skill building',
          researchBasis: 'Special education research',
          researchEvidence: 'Intensive intervention improves outcomes'
        }],
        intensityRecommendations: {
          duration: 'Daily for 6-8 weeks',
          frequency: 'Daily sessions',
          totalIntervention: '30+ hours of instruction',
          researchSupport: 'Torgesen et al. (2001) intensive intervention research'
        }
      }];
    }
    return [];
  }

  identifyInterventionStrengths(improvement, score) {
    const strengths = [];
    if (improvement > 10) strengths.push('Student responsive to intervention');
    if (score > 60) strengths.push('Approaching grade-level expectations');
    return strengths;
  }

  identifyInterventionWeaknesses(improvement, errorPatterns) {
    const weaknesses = [];
    if (improvement < 10) weaknesses.push('Limited response to intervention');
    if (errorPatterns.percentage > 50) weaknesses.push('Persistent error patterns');
    return weaknesses;
  }

  assessOverallReadiness(score, improvement) {
    if (score >= 75) return 'Ready for next level';
    if (improvement > 15) return 'Making strong progress';
    if (improvement > 5) return 'Developing skills steadily';
    return 'Needs continued intensive support';
  }

  describeInterventionImpact(improvement, score) {
    if (improvement > 20) return 'Highly effective intervention with significant gains';
    if (improvement > 10) return 'Moderately effective with measurable progress';
    if (improvement > 5) return 'Some positive impact demonstrated';
    return 'Minimal intervention impact observed';
  }

  generateNextStepsRationale(score, isPassed, improvement) {
    if (isPassed) return 'Student achieved mastery criteria and can advance';
    if (improvement > 10) return 'Student showing progress - minor adjustments recommended';
    if (improvement > 5) return 'Some progress evident - revision and additional practice needed';
    return 'Limited progress - intensive intervention or escalation required';
  }

  // ===== CATEGORY-SPECIFIC ERROR ANALYSIS HELPER METHODS =====

  /**
   * Helper methods for Phonological Awareness error analysis
   */
  calculatePartialMatchSuccess(responses) {
    const matchingResponses = responses.filter(r => r.correctMatches !== undefined);
    if (matchingResponses.length === 0) return 0;

    const totalMatches = matchingResponses.reduce((sum, r) => sum + (r.totalMatches || 0), 0);
    const correctMatches = matchingResponses.reduce((sum, r) => sum + (r.correctMatches || 0), 0);

    return totalMatches > 0 ? Math.round((correctMatches / totalMatches) * 100) / 100 : 0;
  }

  identifyPhonologicalConfusions(incorrectResponses) {
    // Common Filipino letter confusions based on research
    const commonConfusions = [
      { sounds: ['B', 'P'], confusion_rate: 75 },
      { sounds: ['M', 'N'], confusion_rate: 60 },
      { sounds: ['D', 'T'], confusion_rate: 45 }
    ];
    return commonConfusions;
  }

  calculateSequentialDifficulty(responses, soundCount) {
    // Simulate sequential processing difficulty based on sound count
    const baseSuccess = 80; // 80% baseline success
    const difficultyPenalty = (soundCount - 2) * 15; // 15% penalty per extra sound
    return Math.max(20, baseSuccess - difficultyPenalty);
  }

  /**
   * Helper methods for Decoding error analysis
   */
  calculatePositionErrors(incorrectResponses, position) {
    // Count errors at specific word positions
    const positionMap = { beginning: 0, middle: 0.5, end: 1 };
    const targetPosition = positionMap[position];

    // Simulate position-based error counting
    return Math.floor(incorrectResponses.length * (position === 'beginning' ? 0.6 : 0.2));
  }

  getMostErrorPosition(incorrectResponses) {
    // Most errors typically occur at beginning of words for decoding
    return 0; // 0 = beginning, 1 = middle, 2 = end
  }

  getPatternErrorRate(incorrectResponses, pattern) {
    // Simulate error rates for different word patterns
    const patternRates = {
      'CVC': Math.min(80, incorrectResponses.length * 8),
      'CVCV': Math.min(60, incorrectResponses.length * 6)
    };
    return patternRates[pattern] || 40;
  }

  identifyDecodingConfusions(incorrectResponses) {
    return ['B-D', 'P-Q', 'M-W']; // Common visual letter confusions
  }

  /**
   * Helper methods for Word Recognition error analysis
   */
  countSentenceCompletionErrors(incorrectResponses) {
    // Count errors in sentence completion type questions
    return incorrectResponses.filter(r =>
      r.questionId && r.questionId.includes('sentence')
    ).length;
  }

  countRhymingErrors(incorrectResponses) {
    // Count errors in rhyming type questions
    return incorrectResponses.filter(r =>
      r.questionId && r.questionId.includes('rhym')
    ).length;
  }

  identifyWordConfusions(incorrectResponses) {
    return ['similar_looking_words', 'context_dependent_words']; // Common word recognition confusions
  }

  /**
   * Helper methods for Reading Comprehension error analysis
   */
  analyzeComprehensionQuestionBreakdown(responses) {
    const breakdown = {};

    responses.forEach(response => {
      if (response.questionId) {
        breakdown[response.questionId] = {
          sentence_questions_total: response.sentenceResults ? response.sentenceResults.length : 1,
          sentence_questions_correct: response.sentenceResults ?
            response.sentenceResults.filter(sr => sr.isCorrect).length :
            (response.isCorrect ? 1 : 0),
          result: response.isCorrect ? 'PASSED' : 'FAILED',
          partial_success_rate: response.sentenceResults ?
            Math.round((response.sentenceResults.filter(sr => sr.isCorrect).length / response.sentenceResults.length) * 100) :
            (response.isCorrect ? 100 : 0)
        };
      }
    });

    return breakdown;
  }

  countLiteralComprehensionErrors(incorrectResponses) {
    // Count errors in literal comprehension (finding stated facts)
    return incorrectResponses.filter(r =>
      r.questionType === 'sentence' || r.category === 'Reading Comprehension'
    ).length;
  }

  identifyComprehensionWeaknesses(incorrectResponses) {
    return ['literal_comprehension', 'detail_retention', 'sequence_understanding'];
  }
}

module.exports = new InterventionGeneratorService();