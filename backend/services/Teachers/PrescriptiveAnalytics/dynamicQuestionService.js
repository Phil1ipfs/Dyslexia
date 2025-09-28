// Dynamic Question Generation Service
// Removes fixed 10-question limit and generates truly adaptive interventions
// Based on error patterns, student ability, and time predictions

const timePredictionService = require('./timePredictionService');
const mathematicalModelsService = require('./mathematicalModelsService');

class DynamicQuestionService {

  /**
   * Generate dynamic question count and distribution based on student needs
   * This is the main entry point that replaces fixed 10-question interventions
   * 
   * @param {Object} analysisData - Prescriptive analysis data
   * @param {string} category - Category for intervention
   * @param {number} availableMinutes - Available time (optional, defaults to 30)
   * @param {Object} constraints - Override constraints (optional)
   * @returns {Object} Dynamic question plan with count, distribution, and timing
   */
  async generateDynamicQuestionPlan(analysisData, category, availableMinutes = 30, constraints = null) {
    try {
      const { studentId, readingLevel, errorPatterns, skillMastery, abilityEstimates } = analysisData;

      console.log(`[DYNAMIC QUESTIONS] Generating plan for student ${studentId}, category: ${category}`);

      // Get error severity for this category
      const errorSeverity = this.calculateErrorSeverity(errorPatterns[category] || {});
      
      // Get mastery level for this category
      const masteryLevel = skillMastery.get ? skillMastery.get(category) : skillMastery[category];
      const currentMastery = masteryLevel?.masteryProbability || 0.5;
      const currentScore = masteryLevel?.score || 0;
      
      // Get ability estimate
      const abilityEstimate = abilityEstimates.get ? abilityEstimates.get(category) : abilityEstimates[category] || 0;

      // Calculate optimal question count based on multiple factors
      const optimalCount = await this.calculateOptimalQuestionCount({
        studentId,
        category,
        readingLevel,
        errorSeverity,
        masteryLevel: currentMastery,
        abilityEstimate,
        currentScore,
        availableMinutes,
        constraints
      });

      // Generate question distribution based on error patterns
      const questionDistribution = this.calculateQuestionDistribution(
        errorPatterns[category] || {},
        errorSeverity,
        optimalCount,
        category
      );

      // Get time predictions
      const timePrediction = await timePredictionService.predictInterventionTime(
        studentId, category, optimalCount, readingLevel
      );

      // Generate difficulty progression
      const difficultyProgression = this.calculateDifficultyProgression(
        abilityEstimate,
        currentMastery,
        optimalCount
      );

      // Generate success criteria
      const successCriteria = this.calculateSuccessCriteria(
        currentScore,
        errorSeverity,
        optimalCount
      );

      return {
        questionCount: optimalCount,
        questionDistribution,
        timePrediction,
        difficultyProgression,
        successCriteria,
        adaptationReason: this.getAdaptationReason(errorSeverity, currentMastery, availableMinutes),
        metadata: {
          category,
          readingLevel,
          errorSeverity,
          masteryLevel: currentMastery,
          abilityEstimate,
          generatedAt: new Date()
        }
      };

    } catch (error) {
      console.error('[DYNAMIC QUESTIONS] Error generating plan:', error);
      
      // Return safe fallback
      return this.getFallbackQuestionPlan(category, analysisData.readingLevel, availableMinutes);
    }
  }

  /**
   * Calculate error severity from error patterns
   * 
   * @param {Object} errorPatterns - Error patterns for the category
   * @returns {Object} Error severity analysis
   */
  calculateErrorSeverity(errorPatterns) {
    if (!errorPatterns || Object.keys(errorPatterns).length === 0) {
      return {
        level: 'low',
        score: 0,
        primaryErrorType: 'none',
        needsIntensiveSupport: false
      };
    }

    let totalErrors = 0;
    let totalQuestions = 0;
    let primaryErrorType = 'general';
    let maxErrorRate = 0;

    // Analyze each error pattern
    Object.entries(errorPatterns).forEach(([errorType, errorData]) => {
      if (errorData.count && errorData.total) {
        totalErrors += errorData.count;
        totalQuestions += errorData.total;
        
        const errorRate = errorData.percentage || 0;
        if (errorRate > maxErrorRate) {
          maxErrorRate = errorRate;
          primaryErrorType = errorType;
        }
      }
    });

    const overallErrorRate = totalQuestions > 0 ? (totalErrors / totalQuestions) * 100 : 0;
    
    let level;
    let needsIntensiveSupport;
    
    if (overallErrorRate >= 70) {
      level = 'severe';
      needsIntensiveSupport = true;
    } else if (overallErrorRate >= 50) {
      level = 'high';
      needsIntensiveSupport = true;
    } else if (overallErrorRate >= 30) {
      level = 'moderate';
      needsIntensiveSupport = false;
    } else if (overallErrorRate >= 15) {
      level = 'low';
      needsIntensiveSupport = false;
    } else {
      level = 'minimal';
      needsIntensiveSupport = false;
    }

    return {
      level,
      score: Math.round(overallErrorRate),
      primaryErrorType,
      needsIntensiveSupport,
      totalErrors,
      totalQuestions,
      maxErrorRate
    };
  }

  /**
   * Calculate optimal question count based on multiple factors
   * 
   * @param {Object} factors - All factors for calculation
   * @returns {number} Optimal question count
   */
  async calculateOptimalQuestionCount(factors) {
    const {
      studentId,
      category,
      readingLevel,
      errorSeverity,
      masteryLevel,
      abilityEstimate,
      currentScore,
      availableMinutes,
      constraints
    } = factors;

    // Base question count from time availability
    const timeBasedCount = await this.calculateTimeBasedQuestionCount(
      studentId, category, availableMinutes, readingLevel
    );

    // Error-based adjustment
    const errorBasedCount = this.calculateErrorBasedQuestionCount(
      errorSeverity, category
    );

    // Mastery-based adjustment
    const masteryBasedCount = this.calculateMasteryBasedQuestionCount(
      masteryLevel, currentScore
    );

    // Ability-based adjustment
    const abilityBasedCount = this.calculateAbilityBasedQuestionCount(
      abilityEstimate, readingLevel
    );

    // Weighted combination
    let optimalCount = Math.round(
      timeBasedCount * 0.4 +     // 40% weight on time availability
      errorBasedCount * 0.3 +    // 30% weight on error severity
      masteryBasedCount * 0.2 +  // 20% weight on mastery level
      abilityBasedCount * 0.1    // 10% weight on ability estimate
    );

    // Apply constraints
    const categoryConstraints = constraints || this.getCategoryConstraints(category, readingLevel);
    optimalCount = Math.max(categoryConstraints.min, Math.min(categoryConstraints.max, optimalCount));

    console.log(`[DYNAMIC QUESTIONS] Calculated counts - Time: ${timeBasedCount}, Error: ${errorBasedCount}, Mastery: ${masteryBasedCount}, Ability: ${abilityBasedCount}, Final: ${optimalCount}`);

    return optimalCount;
  }

  /**
   * Calculate question count based on available time
   * 
   * @param {number} studentId - Student ID
   * @param {string} category - Category name
   * @param {number} availableMinutes - Available minutes
   * @param {string} readingLevel - Reading level
   * @returns {number} Time-based question count
   */
  async calculateTimeBasedQuestionCount(studentId, category, availableMinutes, readingLevel) {
    try {
      const timeOptimization = await timePredictionService.calculateOptimalQuestionCount(
        availableMinutes, studentId, category, readingLevel
      );
      
      return timeOptimization.optimalQuestionCount;
    } catch (error) {
      console.error('[DYNAMIC QUESTIONS] Error calculating time-based count:', error);
      
      // Fallback calculation
      const defaultTimePerQuestion = timePredictionService.getDefaultTimePerQuestion(category);
      const levelFactor = readingLevel === 'Low Emerging' ? 1.4 : 
                         readingLevel === 'High Emerging' ? 1.2 : 1.0;
      
      const adjustedTimePerQuestion = defaultTimePerQuestion * levelFactor + 3; // +3 for UI
      return Math.floor((availableMinutes * 60 * 0.8) / adjustedTimePerQuestion);
    }
  }

  /**
   * Calculate question count based on error severity
   * 
   * @param {Object} errorSeverity - Error severity analysis
   * @param {string} category - Category name
   * @returns {number} Error-based question count
   */
  calculateErrorBasedQuestionCount(errorSeverity, category) {
    const baseCounts = {
      'Alphabet Knowledge': 12,
      'Phonological Awareness': 10,
      'Decoding': 14,
      'Word Recognition': 16,
      'Reading Comprehension': 6
    };

    const baseCount = baseCounts[category] || 12;

    switch (errorSeverity.level) {
      case 'severe':
        return Math.round(baseCount * 1.8);  // Need lots of practice
      case 'high':
        return Math.round(baseCount * 1.5);  // Above average practice
      case 'moderate':
        return Math.round(baseCount * 1.2);  // Slightly more practice
      case 'low':
        return Math.round(baseCount * 0.9);  // Slightly less practice
      case 'minimal':
        return Math.round(baseCount * 0.7);  // Minimal practice needed
      default:
        return baseCount;
    }
  }

  /**
   * Calculate question count based on mastery level
   * 
   * @param {number} masteryLevel - BKT mastery probability (0-1)
   * @param {number} currentScore - Current percentage score
   * @returns {number} Mastery-based question count
   */
  calculateMasteryBasedQuestionCount(masteryLevel, currentScore) {
    const baseCount = 12;

    // Lower mastery = more questions needed
    if (masteryLevel < 0.3 || currentScore < 40) {
      return Math.round(baseCount * 1.6);  // Very low mastery
    } else if (masteryLevel < 0.5 || currentScore < 60) {
      return Math.round(baseCount * 1.3);  // Low mastery
    } else if (masteryLevel < 0.7 || currentScore < 75) {
      return Math.round(baseCount * 1.1);  // Moderate mastery
    } else {
      return Math.round(baseCount * 0.8);  // High mastery - fewer questions
    }
  }

  /**
   * Calculate question count based on ability estimate
   * 
   * @param {number} abilityEstimate - IRT ability estimate (-3 to +3)
   * @param {string} readingLevel - Reading level
   * @returns {number} Ability-based question count
   */
  calculateAbilityBasedQuestionCount(abilityEstimate, readingLevel) {
    const baseCount = 12;

    // Lower ability = more questions for thorough assessment
    if (abilityEstimate < -1.5) {
      return Math.round(baseCount * 1.4);
    } else if (abilityEstimate < -0.5) {
      return Math.round(baseCount * 1.2);
    } else if (abilityEstimate < 0.5) {
      return baseCount;
    } else if (abilityEstimate < 1.5) {
      return Math.round(baseCount * 0.9);
    } else {
      return Math.round(baseCount * 0.8);
    }
  }

  /**
   * Get category constraints for question count
   * 
   * @param {string} category - Category name
   * @param {string} readingLevel - Reading level
   * @returns {Object} Min/max constraints
   */
  getCategoryConstraints(category, readingLevel) {
    const baseConstraints = {
      'Alphabet Knowledge': { min: 6, max: 25 },
      'Phonological Awareness': { min: 4, max: 20 },
      'Decoding': { min: 5, max: 30 },
      'Word Recognition': { min: 6, max: 35 },
      'Reading Comprehension': { min: 3, max: 12 }
    };

    const base = baseConstraints[category] || baseConstraints['Alphabet Knowledge'];

    // Adjust for reading level
    const levelAdjustments = {
      'Low Emerging': { minFactor: 0.7, maxFactor: 0.8 },
      'High Emerging': { minFactor: 0.85, maxFactor: 0.9 },
      'Developing': { minFactor: 1.0, maxFactor: 1.0 },
      'Transitioning': { minFactor: 1.0, maxFactor: 1.2 },
      'At Grade Level': { minFactor: 1.0, maxFactor: 1.4 }
    };

    const adjustment = levelAdjustments[readingLevel] || levelAdjustments['Developing'];

    return {
      min: Math.max(3, Math.round(base.min * adjustment.minFactor)),
      max: Math.round(base.max * adjustment.maxFactor),
      category,
      readingLevel
    };
  }

  /**
   * Calculate question distribution based on error patterns
   * 
   * @param {Object} errorPatterns - Error patterns for category
   * @param {Object} errorSeverity - Error severity analysis
   * @param {number} totalQuestions - Total questions to distribute
   * @param {string} category - Category name
   * @returns {Object} Question distribution
   */
  calculateQuestionDistribution(errorPatterns, errorSeverity, totalQuestions, category) {
    const distribution = {};
    
    // If no error patterns, use balanced distribution
    if (!errorPatterns || Object.keys(errorPatterns).length === 0) {
      return this.getBalancedDistribution(category, totalQuestions);
    }

    // Calculate distribution based on error severity
    const errorTypes = Object.keys(errorPatterns);
    const totalErrorWeight = errorTypes.reduce((sum, errorType) => {
      const errorData = errorPatterns[errorType];
      return sum + (errorData.percentage || 0);
    }, 0);

    // Reserve questions for general practice (20-40% based on severity)
    const generalPracticeRatio = errorSeverity.level === 'severe' ? 0.2 : 
                                 errorSeverity.level === 'high' ? 0.25 : 
                                 errorSeverity.level === 'moderate' ? 0.3 : 0.35;
    
    const generalQuestions = Math.round(totalQuestions * generalPracticeRatio);
    const targetedQuestions = totalQuestions - generalQuestions;

    // Distribute targeted questions based on error rates
    if (totalErrorWeight > 0) {
      errorTypes.forEach(errorType => {
        const errorData = errorPatterns[errorType];
        const errorWeight = (errorData.percentage || 0) / totalErrorWeight;
        distribution[errorType] = Math.round(targetedQuestions * errorWeight);
      });
    }

    // Add general practice
    distribution['general'] = generalQuestions;

    // Ensure total adds up correctly
    const totalAssigned = Object.values(distribution).reduce((sum, count) => sum + count, 0);
    if (totalAssigned !== totalQuestions) {
      // Adjust the largest category
      const largestCategory = Object.keys(distribution).reduce((a, b) => 
        distribution[a] > distribution[b] ? a : b
      );
      distribution[largestCategory] += totalQuestions - totalAssigned;
    }

    return distribution;
  }

  /**
   * Get balanced distribution when no error patterns available
   * 
   * @param {string} category - Category name
   * @param {number} totalQuestions - Total questions
   * @returns {Object} Balanced distribution
   */
  getBalancedDistribution(category, totalQuestions) {
    const distributions = {
      'Alphabet Knowledge': {
        'patinig': 0.4,
        'katinig': 0.4,
        'general': 0.2
      },
      'Phonological Awareness': {
        'matching': 0.7,
        'general': 0.3
      },
      'Decoding': {
        'drag_drop': 0.8,
        'general': 0.2
      },
      'Word Recognition': {
        'sentence_completion': 0.5,
        'rhyming': 0.3,
        'general': 0.2
      },
      'Reading Comprehension': {
        'passages': 0.8,
        'general': 0.2
      }
    };

    const template = distributions[category] || { 'general': 1.0 };
    const result = {};

    Object.entries(template).forEach(([type, ratio]) => {
      result[type] = Math.round(totalQuestions * ratio);
    });

    return result;
  }

  /**
   * Calculate difficulty progression for questions
   * 
   * @param {number} abilityEstimate - IRT ability estimate
   * @param {number} masteryLevel - BKT mastery level
   * @param {number} totalQuestions - Total questions
   * @returns {Object} Difficulty progression plan
   */
  calculateDifficultyProgression(abilityEstimate, masteryLevel, totalQuestions) {
    // Start slightly below student's ability, progress gradually
    const startDifficulty = abilityEstimate - 0.5;
    const endDifficulty = abilityEstimate + 0.3;
    
    // Create progression
    const progression = [];
    for (let i = 0; i < totalQuestions; i++) {
      const progress = i / (totalQuestions - 1);
      const difficulty = startDifficulty + (endDifficulty - startDifficulty) * progress;
      
      progression.push({
        questionIndex: i + 1,
        targetDifficulty: Math.max(-3, Math.min(3, Math.round(difficulty * 100) / 100)),
        successProbability: Math.round(mathematicalModelsService.calculateIRTProbability(
          abilityEstimate, difficulty, 1.0
        ) * 100) / 100
      });
    }

    return {
      progression,
      startDifficulty: Math.round(startDifficulty * 100) / 100,
      endDifficulty: Math.round(endDifficulty * 100) / 100,
      adaptiveAdjustment: true
    };
  }

  /**
   * Calculate success criteria
   * 
   * @param {number} currentScore - Current score
   * @param {Object} errorSeverity - Error severity
   * @param {number} totalQuestions - Total questions
   * @returns {Object} Success criteria
   */
  calculateSuccessCriteria(currentScore, errorSeverity, totalQuestions) {
    // Base pass threshold is 75%
    let passThreshold = 75;
    
    // Adjust based on error severity - more severe errors need higher success rate
    if (errorSeverity.level === 'severe') {
      passThreshold = 80; // Need higher success for severe errors
    } else if (errorSeverity.level === 'minimal') {
      passThreshold = 70; // Can be slightly more lenient for minimal errors
    }

    // Calculate question thresholds
    const questionsNeededToPass = Math.ceil((passThreshold / 100) * totalQuestions);
    const questionsForExcellent = Math.ceil(0.9 * totalQuestions);

    return {
      passThreshold,
      questionsNeededToPass,
      questionsForExcellent,
      totalQuestions,
      categories: {
        excellent: questionsForExcellent,
        good: questionsNeededToPass,
        needsImprovement: questionsNeededToPass - 1
      }
    };
  }

  /**
   * Get explanation for question count adaptation
   * 
   * @param {Object} errorSeverity - Error severity
   * @param {number} masteryLevel - Mastery level
   * @param {number} availableMinutes - Available time
   * @returns {string} Adaptation reason
   */
  getAdaptationReason(errorSeverity, masteryLevel, availableMinutes) {
    const reasons = [];

    if (errorSeverity.level === 'severe') {
      reasons.push('Increased questions due to severe error patterns requiring intensive practice');
    } else if (errorSeverity.level === 'minimal') {
      reasons.push('Reduced questions due to minimal errors requiring light reinforcement');
    }

    if (masteryLevel < 0.3) {
      reasons.push('Extended practice needed due to low mastery probability');
    } else if (masteryLevel > 0.8) {
      reasons.push('Streamlined assessment due to high mastery level');
    }

    if (availableMinutes < 20) {
      reasons.push('Optimized for limited time availability');
    } else if (availableMinutes > 45) {
      reasons.push('Extended session allows for comprehensive assessment');
    }

    return reasons.length > 0 ? reasons.join('; ') : 'Dynamically adapted based on individual student needs';
  }

  /**
   * Get fallback question plan when main calculation fails
   * 
   * @param {string} category - Category name
   * @param {string} readingLevel - Reading level
   * @param {number} availableMinutes - Available minutes
   * @returns {Object} Fallback plan
   */
  getFallbackQuestionPlan(category, readingLevel, availableMinutes) {
    const constraints = this.getCategoryConstraints(category, readingLevel);
    const fallbackCount = Math.min(constraints.max, Math.max(constraints.min, 
      Math.floor(availableMinutes * 0.4))); // Conservative estimate

    return {
      questionCount: fallbackCount,
      questionDistribution: this.getBalancedDistribution(category, fallbackCount),
      timePrediction: {
        predictedTime: fallbackCount * 12, // 12 seconds average
        confidence: 'low'
      },
      difficultyProgression: {
        progression: Array(fallbackCount).fill(null).map((_, i) => ({
          questionIndex: i + 1,
          targetDifficulty: 0, // Neutral difficulty
          successProbability: 0.7
        }))
      },
      successCriteria: {
        passThreshold: 75,
        questionsNeededToPass: Math.ceil(fallbackCount * 0.75),
        totalQuestions: fallbackCount
      },
      adaptationReason: 'Using fallback plan due to insufficient data for optimization',
      metadata: {
        category,
        readingLevel,
        fallback: true,
        generatedAt: new Date()
      }
    };
  }

  /**
   * Validate and adjust question plan
   * 
   * @param {Object} questionPlan - Generated question plan
   * @returns {Object} Validated and adjusted plan
   */
  validateQuestionPlan(questionPlan) {
    const { questionCount, questionDistribution, successCriteria } = questionPlan;

    // Ensure distribution adds up to question count
    const distributionTotal = Object.values(questionDistribution).reduce((sum, count) => sum + count, 0);
    if (distributionTotal !== questionCount) {
      console.warn(`[DYNAMIC QUESTIONS] Distribution total (${distributionTotal}) doesn't match question count (${questionCount})`);
      
      // Adjust proportionally
      const adjustmentFactor = questionCount / distributionTotal;
      Object.keys(questionDistribution).forEach(key => {
        questionDistribution[key] = Math.round(questionDistribution[key] * adjustmentFactor);
      });
    }

    // Ensure success criteria are realistic
    if (successCriteria.questionsNeededToPass > questionCount) {
      successCriteria.questionsNeededToPass = Math.ceil(questionCount * 0.75);
    }

    return questionPlan;
  }
}

module.exports = new DynamicQuestionService();