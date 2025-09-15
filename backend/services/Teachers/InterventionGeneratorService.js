const mongoose = require('mongoose');
const PrescriptiveAnalysis = require('../../models/Teachers/ManageProgress/prescriptiveAnalysisModel');
const InterventionAssessment = require('../../models/Teachers/ManageProgress/interventionAssessmentModel');
const InterventionResponse = require('../../models/Teachers/ManageProgress/interventionResponseModel');
const InterventionResults = require('../../models/Teachers/ManageProgress/interventionResultsModel');
const TemplateQuestion = require('../../models/Teachers/ManageProgress/templatesQuestionsModel');
const TemplateChoice = require('../../models/Teachers/ManageProgress/templatesChoicesModel');
const SentenceTemplate = require('../../models/Teachers/ManageProgress/sentenceTemplateModel');
const MainAssessment = require('../../models/Teachers/mainAssessmentModel');
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

      // Generate questions using template-based approach
      console.log('[INTERVENTION GENERATOR] About to call generateTemplateBasedQuestions');
      console.log('[INTERVENTION GENERATOR] Parameters:', {
        category,
        readingLevel: analysis.readingLevel,
        errorPatterns,
        interventionPlan,
        questionCount: optimalQuestionCount,
        abilityEstimate: analysis.abilityEstimates.get ? analysis.abilityEstimates.get(category) : analysis.abilityEstimates[category] || 0
      });

      const questionGeneration = await this.generateTemplateBasedQuestions(
        category,
        analysis.readingLevel,
        errorPatterns,
        interventionPlan,
        optimalQuestionCount,
        analysis.abilityEstimates.get ? analysis.abilityEstimates.get(category) : analysis.abilityEstimates[category] || 0
      );

      console.log('[INTERVENTION GENERATOR] Questions returned:', questionGeneration.questions ? questionGeneration.questions.length : 'null/undefined');

      // Create intervention assessment
      const interventionData = {
        studentId: analysis.studentId,
        prescriptiveAnalysisId: analysisId,
        category,
        readingLevel: analysis.readingLevel,
        passThreshold: 75,
        questionSelectionStrategy: strategy,
        totalQuestions: optimalQuestionCount, // Dynamic count based on analytics
        questions: questionGeneration.questions,
        interventionParameters: {
          fixedQuestions: optimalQuestionCount,
          allowSkip: false,
          showProgress: true,
          immediateFeeback: false
        },
        status: 'active',
        createdBy: questionGeneration.templateAvailability ? questionGeneration.createdBy : null,
        templateMetadata: {
          templateCount: questionGeneration.templateAvailability?.availableTemplates || 0,
          mainAssessmentCount: questionGeneration.templateAvailability?.mainAssessmentCount || 0,
          customCount: questionGeneration.templateAvailability?.customCount || 0,
          shortageAmount: questionGeneration.templateAvailability?.shortageAmount || 0,
          teacherAction: questionGeneration.templateAvailability?.teacherAction || null
        },
        createdAt: new Date(),
        updatedAt: new Date()
      };

      const intervention = new InterventionAssessment(interventionData);
      await intervention.save();

      console.log(`[INTERVENTION GENERATOR] Generated intervention ${intervention._id} with ${questionGeneration.questions.length} questions (${questionGeneration.templateAvailability?.availableTemplates || 0} from templates)`);

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
      const totalQuestions = intervention.totalQuestions || 10;
      const answeredQuestions = responses.length;
      const correctAnswers = responses.filter(r => r.isCorrect).length;
      const finalScore = Math.round((correctAnswers / totalQuestions) * 100);
      const isPassed = finalScore >= 75; // 75% pass threshold

      // Calculate average response time
      const responsesWithTime = responses.filter(r => r.responseTime && r.responseTime > 0);
      const avgResponseTime = responsesWithTime.length > 0 
        ? Math.round(responsesWithTime.reduce((sum, r) => sum + r.responseTime, 0) / responsesWithTime.length)
        : null;

      // Analyze error patterns
      const incorrectResponses = responses.filter(r => !r.isCorrect);
      const errorPatterns = this.analyzeInterventionErrors(incorrectResponses, intervention.category);

      // Create intervention results record
      const interventionResults = new InterventionResults({
        studentId: intervention.studentId,
        interventionAssessmentId: interventionId,
        category: intervention.category,
        readingLevel: intervention.readingLevel,
        totalQuestions,
        answeredQuestions,
        correctAnswers,
        finalScore,
        isPassed,
        passThreshold: 75,
        avgResponseTime,
        errorPatterns,
        startedAt: intervention.startedAt,
        completedAt: new Date(),
        responses: responses.map(r => ({
          questionId: r.questionId,
          response: r.response,
          isCorrect: r.isCorrect,
          responseTime: r.responseTime,
          answeredAt: r.answeredAt
        }))
      });

      await interventionResults.save();

      console.log(`[INTERVENTION GENERATOR] Results processed - Score: ${finalScore}%, Passed: ${isPassed}`);

      return {
        success: true,
        interventionResultsId: interventionResults._id,
        results: {
          category: intervention.category,
          totalQuestions,
          answeredQuestions,
          correctAnswers,
          finalScore,
          isPassed,
          avgResponseTime,
          errorPatterns,
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
   * @returns {Object} Error pattern analysis
   */
  analyzeInterventionErrors(incorrectResponses, category) {
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
        // Analyze letter confusion patterns
        const letterErrors = incorrectResponses.filter(r => r.questionId.includes('_ak_') || r.questionId.includes('AK_'));
        patterns.patterns.letterConfusion = {
          count: letterErrors.length,
          percentage: Math.round((letterErrors.length / incorrectResponses.length) * 100)
        };
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
}

module.exports = new InterventionGeneratorService();