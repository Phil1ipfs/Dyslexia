// Main Prescriptive Analytics Service
// Orchestrates the complete prescriptive analysis generation process
// Works as enhancement layer that triggers AFTER category_results is saved

const StudentResponse = require('../../models/Teachers/ManageProgress/studentResponseModel');
const CategoryResult = require('../../models/Teachers/ManageProgress/categoryResultModel');
const PrescriptiveAnalysis = require('../../models/Teachers/ManageProgress/prescriptiveAnalysisModel');
const User = require('../../models/userModel');

const mathematicalModelsService = require('./PrescriptiveAnalytics/mathematicalModelsService');
const errorPatternService = require('./PrescriptiveAnalytics/errorPatternService');
const timePredictionService = require('./PrescriptiveAnalytics/timePredictionService');
const dynamicQuestionService = require('./PrescriptiveAnalytics/dynamicQuestionService');

class PrescriptiveAnalyticsService {

  /**
   * Generate complete prescriptive analysis after category_results is created
   * This is the main entry point called after assessment completion
   * 
   * @param {string} categoryResultId - ID of the category_results record
   * @returns {Object} Complete prescriptive analysis record
   */
  async generatePrescriptiveAnalysis(categoryResultId) {
    try {
      const categoryResult = await CategoryResult.findById(categoryResultId);
      
      if (!categoryResult) {
        throw new Error('Category result not found');
      }

      const studentId = categoryResult.studentId;
      
      // Fetch student data separately - User model uses 'idNumber' field
      const student = await User.findOne({ idNumber: studentId });
      if (!student) {
        throw new Error(`Student with ID ${studentId} not found`);
      }
      
      const readingLevel = student.readingLevel || 'Low Emerging';

      // Fetch all student responses for main assessment
      const responses = await StudentResponse.find({ studentId })
        .sort({ answeredAt: 1 });

      // Check if this is a re-assessment (has previous prescriptive analysis)
      const existingAnalysis = await PrescriptiveAnalysis.findOne({ 
        studentId,
        assessmentType: 'main'
      }).sort({ createdAt: -1 });

      // Generate skill mastery using BKT
      const skillMastery = await this.calculateSkillMastery(responses, readingLevel);

      // Estimate abilities using IRT
      const abilityEstimates = this.estimateStudentAbilities(responses, readingLevel);

      // Analyze error patterns
      const errorPatterns = await errorPatternService.analyzeErrorPatterns(studentId);

      // Generate intervention plan based on failed categories
      const interventionPlan = this.generateInterventionPlan(
        skillMastery, 
        errorPatterns, 
        categoryResult.categories
      );

      // Generate insights and recommendations
      const insights = this.generateInsights(
        skillMastery,
        categoryResult.categories,
        readingLevel
      );

      // Get intervention history
      const interventionHistory = await this.getInterventionHistory(studentId);

      // Create prescriptive analysis record
      const analysisData = {
        studentId,
        categoryResultId,
        assessmentDate: categoryResult.assessmentDate || new Date(),
        assessmentType: 'main',
        readingLevel,
        skillMastery: new Map(Object.entries(skillMastery)),
        abilityEstimates,
        errorPatterns,
        interventionPlan,
        insights,
        interventionHistory,
        createdAt: new Date(),
        updatedAt: new Date()
      };

      const prescriptiveAnalysis = new PrescriptiveAnalysis(analysisData);
      await prescriptiveAnalysis.save();

      console.log(`Generated prescriptive analysis for student ${studentId}`);
      return prescriptiveAnalysis;

    } catch (error) {
      console.error('Error generating prescriptive analysis:', error);
      throw error;
    }
  }

  /**
   * Calculate skill mastery using Bayesian Knowledge Tracing (BKT)
   * 
   * @param {Array} responses - Student responses
   * @param {string} readingLevel - Student's reading level
   * @returns {Object} Skill mastery by category
   */
  async calculateSkillMastery(responses, readingLevel) {
    const skillMastery = {};

    // Group responses by category
    const responsesByCategory = this.groupResponsesByCategory(responses);

    // Get categories for this reading level
    const expectedCategories = this.getCategoriesForReadingLevel(readingLevel);

    for (const category of expectedCategories) {
      const categoryResponses = responsesByCategory[category] || [];
      
      if (categoryResponses.length === 0) {
        // No responses for this category
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

      // Process responses chronologically using time-aware BKT if possible
      const hasResponseTimes = categoryResponses.some(r => r.responseTime && r.responseTime > 0);
      
      let bktResult;
      if (hasResponseTimes) {
        // Use time-aware BKT for more accurate mastery tracking
        bktResult = mathematicalModelsService.processBKTSequenceWithTime(categoryResponses);
      } else {
        // Fallback to standard BKT
        bktResult = mathematicalModelsService.processBKTSequence(categoryResponses);
      }
      
      // Calculate basic stats
      let correctCount, totalCount, score;
      
      if (category === 'Phonological Awareness') {
        // Special handling for matching questions
        const totalMatches = categoryResponses.reduce((sum, r) => sum + (r.totalMatches || 0), 0);
        const correctMatches = categoryResponses.reduce((sum, r) => sum + (r.correctMatches || 0), 0);
        
        correctCount = correctMatches;
        totalCount = totalMatches;
        score = totalMatches > 0 ? Math.round((correctMatches / totalMatches) * 100) : 0;
        
        skillMastery[category] = {
          masteryProbability: bktResult.finalMastery,
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
        
        skillMastery[category] = {
          masteryProbability: bktResult.finalMastery,
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

  /**
   * Estimate student abilities using Item Response Theory (IRT)
   * 
   * @param {Array} responses - Student responses
   * @param {string} readingLevel - Student's reading level
   * @returns {Object} Ability estimates by category (-3 to +3 scale)
   */
  estimateStudentAbilities(responses, readingLevel) {
    const abilities = {};
    const responsesByCategory = this.groupResponsesByCategory(responses);
    const expectedCategories = this.getCategoriesForReadingLevel(readingLevel);

    for (const category of expectedCategories) {
      const categoryResponses = responsesByCategory[category] || [];
      
      if (categoryResponses.length > 0) {
        // Check if we have response time data for enhanced ability estimation
        const hasResponseTimes = categoryResponses.some(r => r.responseTime && r.responseTime > 0);
        
        if (hasResponseTimes) {
          // Use time-aware ability estimation
          const abilityData = mathematicalModelsService.estimateAbilityWithTime(categoryResponses);
          abilities[category] = abilityData.ability;
        } else if (category === 'Phonological Awareness') {
          abilities[category] = mathematicalModelsService.estimateAbilityPhonologicalAwareness(categoryResponses);
        } else {
          const correctCount = categoryResponses.filter(r => r.isCorrect).length;
          const proportionCorrect = correctCount / categoryResponses.length;
          abilities[category] = mathematicalModelsService.estimateAbilityFromProportion(proportionCorrect);
        }
      } else {
        abilities[category] = 0.0; // Neutral ability estimate
      }
    }

    return abilities;
  }

  /**
   * Generate intervention plan based on failed categories
   * 
   * @param {Object} skillMastery - Skill mastery data
   * @param {Object} errorPatterns - Error pattern analysis
   * @param {Array} categoryResults - Category results from assessment
   * @returns {Object} Intervention plan
   */
  generateInterventionPlan(skillMastery, errorPatterns, categoryResults) {
    // Identify categories that need intervention (score < 75%)
    const failedCategories = [];
    const specificFocus = {};

    Object.entries(skillMastery).forEach(([category, data]) => {
      if (data.score < 75) {
        failedCategories.push({
          category,
          score: data.score,
          masteryProbability: data.masteryProbability
        });
      }
    });

    if (failedCategories.length === 0) {
      return {
        required: false,
        priority: [],
        specificFocus: {}
      };
    }

    // Sort by lowest mastery probability (most urgent first)
    failedCategories.sort((a, b) => a.masteryProbability - b.masteryProbability);
    
    // Take top 2 priorities for focused intervention
    const priorityCategories = failedCategories.slice(0, 2).map(fc => fc.category);

    // Generate specific focus for each priority category
    priorityCategories.forEach(category => {
      const categoryErrors = errorPatterns[category] || {};
      
      switch (category) {
        case 'Alphabet Knowledge':
          specificFocus[category] = this.generateAlphabetFocus(categoryErrors);
          break;
        case 'Phonological Awareness':
          specificFocus[category] = this.generatePhonologicalFocus(categoryErrors);
          break;
        case 'Decoding':
          specificFocus[category] = this.generateDecodingFocus(categoryErrors);
          break;
        case 'Word Recognition':
          specificFocus[category] = this.generateWordRecognitionFocus(categoryErrors);
          break;
        case 'Reading Comprehension':
          specificFocus[category] = this.generateComprehensionFocus(categoryErrors);
          break;
      }
    });

    return {
      required: true,
      priority: priorityCategories,
      specificFocus
    };
  }

  /**
   * Generate insights and recommendations
   * 
   * @param {Object} skillMastery - Skill mastery data
   * @param {Array} categoryResults - Category results
   * @param {string} readingLevel - Student's reading level
   * @returns {Object} Insights and recommendations
   */
  generateInsights(skillMastery, categoryResults, readingLevel) {
    const strengths = [];
    const weaknesses = [];
    let passedCategories = 0;
    let failedCategories = 0;

    // Analyze each category
    Object.entries(skillMastery).forEach(([category, data]) => {
      const score = data.score || 0;
      
      if (score >= 85) {
        strengths.push(category);
      }
      
      if (score >= 75) {
        passedCategories++;
      } else {
        failedCategories++;
        weaknesses.push(`${category} - ${score}%`);
      }
    });

    // Calculate weighted overall score
    const categoryScores = {};
    Object.entries(skillMastery).forEach(([category, data]) => {
      categoryScores[category] = data.score || 0;
    });

    const overallScore = mathematicalModelsService.calculateWeightedScore(categoryScores, readingLevel);

    // Determine overall readiness and recommended action
    let overallReadiness, recommendedAction;
    
    if (failedCategories === 0) {
      overallReadiness = "Ready for next level";
      recommendedAction = "continue_regular_curriculum";
    } else if (failedCategories <= 2) {
      overallReadiness = "Needs targeted intervention";
      recommendedAction = "immediate_intervention";
    } else {
      overallReadiness = "Requires comprehensive support";
      recommendedAction = "face_to_face_required";
    }

    return {
      strengths,
      weaknesses,
      overallReadiness,
      recommendedAction,
      passedCategories,
      failedCategories,
      overallScore
    };
  }

  /**
   * Get intervention history for student
   * 
   * @param {number} studentId - Student ID
   * @returns {Array} Intervention history
   */
  async getInterventionHistory(studentId) {
    try {
      const InterventionResults = require('../../models/Teachers/ManageProgress/interventionResultsModel');
      
      const interventions = await InterventionResults.find({ studentId })
        .sort({ completedAt: -1 })
        .limit(10)
        .select('category score isPassed completedAt _id');

      return interventions.map(intervention => ({
        category: intervention.category,
        interventionId: intervention._id,
        dateTaken: intervention.completedAt,
        passed: intervention.isPassed,
        score: intervention.score
      }));

    } catch (error) {
      console.error('Error fetching intervention history:', error);
      return [];
    }
  }

  // Helper methods for generating specific focus areas

  generateAlphabetFocus(errorPatterns) {
    const patinigErrors = errorPatterns.patinig_errors;
    const katinigErrors = errorPatterns.katinig_errors;

    if (patinigErrors && patinigErrors.count > 0) {
      return {
        focus: 'patinig_recognition',
        targetLetters: patinigErrors.specific_letters.slice(0, 3),
        recommendedActivities: ['visual_discrimination', 'letter_tracing', 'letter_sound_association'],
        questionDistribution: { patinig: 70, katinig: 30 }
      };
    } else if (katinigErrors && katinigErrors.count > 0) {
      return {
        focus: 'katinig_recognition',
        targetLetters: katinigErrors.specific_letters.slice(0, 3),
        recommendedActivities: ['consonant_practice', 'letter_formation', 'sound_production'],
        questionDistribution: { katinig: 70, patinig: 30 }
      };
    } else {
      return {
        focus: 'general_alphabet',
        targetLetters: ['A', 'E', 'I', 'O', 'U'],
        recommendedActivities: ['alphabet_practice', 'letter_recognition', 'sound_matching'],
        questionDistribution: { patinig: 50, katinig: 50 }
      };
    }
  }

  generatePhonologicalFocus(errorPatterns) {
    const matchingErrors = errorPatterns.matching_errors;
    
    if (matchingErrors) {
      const errorType = matchingErrors.error_type;
      return {
        focus: errorType === 'sound_discrimination' ? 'sound_matching' : 'sequence_practice',
        targetSounds: ['B-P', 'M-N', 'D-T'],
        recommendedActivities: ['sound_discrimination', 'minimal_pairs', 'rhyming_practice'],
        questionDistribution: { matching: 100 }
      };
    } else {
      return {
        focus: 'sound_matching',
        targetSounds: ['B-P', 'M-N', 'D-T'],
        recommendedActivities: ['sound_discrimination', 'minimal_pairs', 'rhyming_practice'],
        questionDistribution: { matching: 100 }
      };
    }
  }

  generateDecodingFocus(errorPatterns) {
    const decodingErrors = errorPatterns.decoding_errors;
    
    if (decodingErrors) {
      const errorPosition = decodingErrors.most_error_position;
      const focus = errorPosition === 0 ? 'initial_sounds' : 
                   errorPosition === 1 ? 'medial_sounds' : 'ending_sounds';
      
      return {
        focus,
        targetPatterns: ['CVC', 'CVCV'],
        recommendedActivities: ['syllable_blending', 'word_building', 'pattern_recognition'],
        questionDistribution: { drag_drop: 100 }
      };
    } else {
      return {
        focus: 'letter_sequence',
        targetPatterns: ['CVC', 'CVCV'],
        recommendedActivities: ['syllable_blending', 'word_building', 'pattern_recognition'],
        questionDistribution: { drag_drop: 100 }
      };
    }
  }

  generateWordRecognitionFocus(errorPatterns) {
    const wordErrors = errorPatterns.word_errors;
    
    if (wordErrors) {
      const errorType = wordErrors.error_type;
      const focus = errorType === 'context_clues' ? 'sentence_context' : 'rhyming_words';
      
      return {
        focus,
        recommendedActivities: ['context_clues', 'sight_word_practice', 'word_families'],
        questionDistribution: errorType === 'context_clues' ? 
          { sentence_completion: 70, rhyming: 30 } : 
          { rhyming: 70, sentence_completion: 30 }
      };
    } else {
      return {
        focus: 'sentence_context',
        recommendedActivities: ['context_clues', 'sight_word_practice', 'word_families'],
        questionDistribution: { sentence_completion: 60, rhyming: 40 }
      };
    }
  }

  generateComprehensionFocus(errorPatterns) {
    return {
      focus: 'literal_comprehension',
      targetSkills: ['main_idea', 'sequencing', 'detail_recall'],
      recommendedActivities: ['guided_reading', 'question_answering', 'story_retelling'],
      questionDistribution: { passages: 100 }
    };
  }

  // Utility methods

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
   * Check if student needs face-to-face intervention
   * Called when student has failed intervention attempts
   * 
   * @param {number} studentId - Student ID
   * @param {string} category - Category that failed
   * @returns {Object} Face-to-face recommendation
   */
  async checkFaceToFaceRecommendation(studentId, category) {
    try {
      const InterventionResults = require('../../models/Teachers/ManageProgress/interventionResultsModel');
      
      // Check how many times student has attempted this category
      const attempts = await InterventionResults.find({ 
        studentId, 
        category 
      }).sort({ completedAt: -1 });

      const failedAttempts = attempts.filter(a => !a.isPassed);
      
      if (failedAttempts.length >= 2) {
        return {
          recommended: true,
          reason: `Student has failed ${category} intervention ${failedAttempts.length} times`,
          category,
          lastAttemptDate: attempts[0]?.completedAt,
          totalAttempts: attempts.length
        };
      }

      return {
        recommended: false,
        reason: 'Student can still attempt intervention',
        category,
        totalAttempts: attempts.length
      };

    } catch (error) {
      console.error('Error checking face-to-face recommendation:', error);
      return {
        recommended: false,
        error: error.message
      };
    }
  }

  /**
   * Generate dynamic intervention plan (replaces fixed 10-question approach)
   * Uses error patterns, time predictions, and student ability to optimize question count
   * 
   * @param {string} analysisId - Prescriptive analysis ID
   * @param {string} category - Category for intervention
   * @param {number} availableMinutes - Available time (optional, defaults to 30)
   * @param {Object} constraints - Override constraints (optional)
   * @returns {Object} Dynamic intervention plan
   */
  async generateDynamicIntervention(analysisId, category, availableMinutes = 30, constraints = null) {
    try {
      console.log(`[PRESCRIPTIVE ANALYTICS] Generating dynamic intervention for analysis ${analysisId}, category: ${category}`);

      // Get the prescriptive analysis
      const analysis = await PrescriptiveAnalysis.findById(analysisId);
      if (!analysis) {
        throw new Error('Prescriptive analysis not found');
      }

      // Check if intervention already attempted for this category
      const existingAttempt = analysis.interventionHistory.find(h => h.category === category);
      if (existingAttempt) {
        throw new Error(`Intervention already attempted for ${category}. One-time intervention rule enforced.`);
      }

      // Prepare analysis data for dynamic question service
      const analysisData = {
        studentId: analysis.studentId,
        readingLevel: analysis.readingLevel,
        errorPatterns: this.convertMapToObject(analysis.errorPatterns),
        skillMastery: this.convertMapToObject(analysis.skillMastery),
        abilityEstimates: this.convertMapToObject(analysis.abilityEstimates)
      };

      // Generate dynamic question plan
      const questionPlan = await dynamicQuestionService.generateDynamicQuestionPlan(
        analysisData,
        category,
        availableMinutes,
        constraints
      );

      // Validate the plan
      const validatedPlan = dynamicQuestionService.validateQuestionPlan(questionPlan);

      // Add intervention metadata
      const interventionPlan = {
        ...validatedPlan,
        studentId: analysis.studentId,
        prescriptiveAnalysisId: analysisId,
        category,
        readingLevel: analysis.readingLevel,
        createdAt: new Date(),
        status: 'generated'
      };

      console.log(`[PRESCRIPTIVE ANALYTICS] Generated dynamic intervention with ${questionPlan.questionCount} questions (was fixed at 10)`);

      return interventionPlan;

    } catch (error) {
      console.error('[PRESCRIPTIVE ANALYTICS] Error generating dynamic intervention:', error);
      throw error;
    }
  }

  /**
   * Predict completion time for a specific intervention
   * 
   * @param {number} studentId - Student ID
   * @param {string} category - Category name
   * @param {number} questionCount - Number of questions
   * @param {string} readingLevel - Reading level
   * @returns {Object} Time prediction
   */
  async predictInterventionTime(studentId, category, questionCount, readingLevel) {
    try {
      return await timePredictionService.predictInterventionTime(
        studentId, category, questionCount, readingLevel
      );
    } catch (error) {
      console.error('[PRESCRIPTIVE ANALYTICS] Error predicting intervention time:', error);
      throw error;
    }
  }

  /**
   * Calculate optimal question count based on available time
   * 
   * @param {number} availableMinutes - Available minutes
   * @param {number} studentId - Student ID
   * @param {string} category - Category name
   * @param {string} readingLevel - Reading level
   * @returns {Object} Optimal question count calculation
   */
  async calculateOptimalQuestionCount(availableMinutes, studentId, category, readingLevel) {
    try {
      return await timePredictionService.calculateOptimalQuestionCount(
        availableMinutes, studentId, category, readingLevel
      );
    } catch (error) {
      console.error('[PRESCRIPTIVE ANALYTICS] Error calculating optimal question count:', error);
      throw error;
    }
  }

  /**
   * Update analysis after intervention completion with dynamic results
   * Enhanced to handle variable question counts and time-based analysis
   * 
   * @param {number} studentId - Student ID
   * @param {string} interventionResultId - Intervention result ID
   * @returns {Object} Updated analysis
   */
  async updateAnalysisAfterIntervention(studentId, interventionResultId) {
    try {
      console.log(`[PRESCRIPTIVE ANALYTICS] Updating analysis after intervention for student ${studentId}`);

      // Get the intervention result
      const InterventionResults = require('../../models/Teachers/ManageProgress/interventionResultsModel');
      const interventionResult = await InterventionResults.findById(interventionResultId);
      
      if (!interventionResult) {
        throw new Error('Intervention result not found');
      }

      // Get the latest prescriptive analysis for this student
      const analysis = await PrescriptiveAnalysis.findOne({ 
        studentId,
        assessmentType: 'main'
      }).sort({ createdAt: -1 });

      if (!analysis) {
        throw new Error('No prescriptive analysis found for student');
      }

      // Update intervention history
      analysis.interventionHistory.push({
        category: interventionResult.category,
        interventionId: interventionResult._id,
        dateTaken: interventionResult.completedAt || new Date(),
        passed: interventionResult.isPassed,
        score: interventionResult.score,
        attempt: 1 // First and only attempt per one-time rule
      });

      // Update skill mastery for the category based on intervention results
      const category = interventionResult.category;
      const categoryMastery = analysis.skillMastery.get(category) || {};
      
      // Enhanced BKT update with intervention results
      if (interventionResult.isPassed) {
        // Successful intervention increases mastery significantly
        categoryMastery.masteryProbability = Math.min(0.95, categoryMastery.masteryProbability + 0.25);
      } else {
        // Failed intervention indicates persistent difficulty
        categoryMastery.masteryProbability = Math.max(0.1, categoryMastery.masteryProbability - 0.15);
      }
      
      categoryMastery.lastUpdated = new Date();
      categoryMastery.score = interventionResult.score;
      categoryMastery.isPassed = interventionResult.isPassed;
      
      analysis.skillMastery.set(category, categoryMastery);

      // Update insights based on intervention outcome
      if (interventionResult.isPassed) {
        // Remove from weaknesses, add to strengths if high score
        analysis.insights.weaknesses = analysis.insights.weaknesses.filter(w => !w.includes(category));
        
        if (interventionResult.score >= 85 && !analysis.insights.strengths.includes(category)) {
          analysis.insights.strengths.push(`${category} - Intervention Success`);
        }
        
        analysis.insights.recommendedAction = 'continue_assessment';
      } else {
        // Failed intervention - recommend face-to-face
        analysis.insights.recommendedAction = 'face_to_face_required';
        analysis.insights.overallReadiness = 'Requires face-to-face support after intervention failure';
        
        // Update weakness with intervention failure note
        const existingWeakness = analysis.insights.weaknesses.findIndex(w => w.includes(category));
        if (existingWeakness >= 0) {
          analysis.insights.weaknesses[existingWeakness] = `${category} - ${interventionResult.score}% (Intervention Failed)`;
        } else {
          analysis.insights.weaknesses.push(`${category} - ${interventionResult.score}% (Intervention Failed)`);
        }
      }

      // Update intervention plan - remove successful categories
      if (interventionResult.isPassed && analysis.interventionPlan) {
        analysis.interventionPlan.priority = analysis.interventionPlan.priority.filter(cat => cat !== category);
        analysis.interventionPlan.required = analysis.interventionPlan.priority.length > 0;
        
        // Remove specific focus for passed category
        if (analysis.interventionPlan.specificFocus) {
          analysis.interventionPlan.specificFocus.delete(category);
        }
      }

      analysis.updatedAt = new Date();
      await analysis.save();

      console.log(`[PRESCRIPTIVE ANALYTICS] Updated analysis after ${interventionResult.isPassed ? 'successful' : 'failed'} intervention`);

      return analysis;

    } catch (error) {
      console.error('[PRESCRIPTIVE ANALYTICS] Error updating analysis after intervention:', error);
      throw error;
    }
  }

  /**
   * Convert Map to plain object for JSON serialization
   * 
   * @param {Map} mapObject - Map to convert
   * @returns {Object} Plain object
   */
  convertMapToObject(mapObject) {
    if (!mapObject) return {};
    if (mapObject instanceof Map) {
      const obj = {};
      for (const [key, value] of mapObject.entries()) {
        obj[key] = value;
      }
      return obj;
    }
    return mapObject;
  }

  /**
   * Health check for prescriptive analytics service
   * @returns {Object} Health status
   */
  async healthCheck() {
    try {
      // Check if all required models are accessible
      await Promise.all([
        StudentResponse.findOne({}).limit(1),
        CategoryResult.findOne({}).limit(1),
        PrescriptiveAnalysis.findOne({}).limit(1),
        User.findOne({}).limit(1)
      ]);

      // Check if services are working
      const testBKT = mathematicalModelsService.updateMasteryProbabilityBKT(0.5, true);
      const testIRT = mathematicalModelsService.calculateIRTProbability(0, 0, 1);

      return {
        status: 'healthy',
        timestamp: new Date(),
        services: {
          bkt: testBKT > 0.5 ? 'working' : 'error',
          irt: testIRT > 0 && testIRT < 1 ? 'working' : 'error',
          database: 'connected',
          timePrediction: 'available',
          dynamicQuestions: 'available'
        }
      };
    } catch (error) {
      return {
        status: 'unhealthy',
        timestamp: new Date(),
        error: error.message
      };
    }
  }
}

module.exports = new PrescriptiveAnalyticsService();