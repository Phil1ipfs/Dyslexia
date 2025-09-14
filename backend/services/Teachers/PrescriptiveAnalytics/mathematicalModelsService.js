// Mathematical Models Service for Prescriptive Analytics
// Implements exact BKT, IRT, and weighted scoring formulas from CLAUDE.md

/**
 * Bayesian Knowledge Tracing (BKT) Parameters
 * Exact values from CLAUDE.md research specifications
 */
const BKT_PARAMETERS = {
  P_INIT: 0.5,    // P(L₀) - Initial probability of mastery
  P_LEARN: 0.1,   // P(T) - Probability of learning
  P_GUESS: 0.3,   // P(G) - Probability of guessing
  P_SLIP: 0.1     // P(S) - Probability of slipping
};

/**
 * Category weights by reading level for weighted composite scoring
 * Exact values from CLAUDE.md specification
 */
const CATEGORY_WEIGHTS = {
  "Low Emerging": {
    "Alphabet Knowledge": 1.0,
    "Phonological Awareness": 0.0,
    "Decoding": 0.0,
    "Word Recognition": 0.0,
    "Reading Comprehension": 0.0
  },
  "High Emerging": {
    "Alphabet Knowledge": 0.6,
    "Phonological Awareness": 0.4,
    "Decoding": 0.0,
    "Word Recognition": 0.0,
    "Reading Comprehension": 0.0
  },
  "Developing": {
    "Alphabet Knowledge": 0.35,
    "Phonological Awareness": 0.30,
    "Decoding": 0.35,
    "Word Recognition": 0.0,
    "Reading Comprehension": 0.0
  },
  "Transitioning": {
    "Alphabet Knowledge": 0.20,
    "Phonological Awareness": 0.25,
    "Decoding": 0.25,
    "Word Recognition": 0.30,
    "Reading Comprehension": 0.0
  },
  "At Grade Level": {
    "Alphabet Knowledge": 0.10,
    "Phonological Awareness": 0.15,
    "Decoding": 0.15,
    "Word Recognition": 0.20,
    "Reading Comprehension": 0.40
  }
};

class MathematicalModelsService {
  
  /**
   * Bayesian Knowledge Tracing (BKT) Implementation
   * Updates mastery probability based on student response
   * 
   * Formula: P(L_n+1) = P(L_n | evidence_n) + (1 - P(L_n | evidence_n)) × P(T)
   * 
   * @param {number} currentMastery - Current mastery probability (0-1)
   * @param {boolean} isCorrect - Whether the response was correct
   * @param {Object} params - BKT parameters (optional, defaults to standard values)
   * @returns {number} Updated mastery probability (0-1)
   */
  updateMasteryProbabilityBKT(currentMastery, isCorrect, params = BKT_PARAMETERS) {
    const { P_LEARN, P_GUESS, P_SLIP } = params;
    
    let evidenceGivenMastery;
    
    if (isCorrect) {
      // P(correct | mastery) = 1 - P_SLIP
      // P(correct | no mastery) = P_GUESS
      const pCorrect = currentMastery * (1 - P_SLIP) + (1 - currentMastery) * P_GUESS;
      
      // Bayes theorem: P(mastery | correct) = P(correct | mastery) * P(mastery) / P(correct)
      evidenceGivenMastery = (currentMastery * (1 - P_SLIP)) / pCorrect;
    } else {
      // P(incorrect | mastery) = P_SLIP
      // P(incorrect | no mastery) = 1 - P_GUESS
      const pIncorrect = currentMastery * P_SLIP + (1 - currentMastery) * (1 - P_GUESS);
      
      // Bayes theorem: P(mastery | incorrect) = P(incorrect | mastery) * P(mastery) / P(incorrect)
      evidenceGivenMastery = (currentMastery * P_SLIP) / pIncorrect;
    }
    
    // Apply learning: P(L_n+1) = P(L_n | evidence) + (1 - P(L_n | evidence)) * P(T)
    const updatedMastery = evidenceGivenMastery + (1 - evidenceGivenMastery) * P_LEARN;
    
    // Ensure bounds [0, 1]
    return Math.max(0, Math.min(1, updatedMastery));
  }

  /**
   * Process sequence of responses using BKT
   * Updates mastery probability through each response chronologically
   * 
   * @param {Array} responses - Array of response objects {isCorrect, timestamp}
   * @param {number} initialMastery - Starting mastery probability (default: 0.5)
   * @returns {Object} {finalMastery, responseHistory}
   */
  processBKTSequence(responses, initialMastery = BKT_PARAMETERS.P_INIT) {
    let currentMastery = initialMastery;
    const responseHistory = [];
    
    // Sort responses chronologically
    const sortedResponses = responses.sort((a, b) => new Date(a.answeredAt) - new Date(b.answeredAt));
    
    for (const response of sortedResponses) {
      currentMastery = this.updateMasteryProbabilityBKT(currentMastery, response.isCorrect);
      
      responseHistory.push({
        questionId: response.questionId,
        correct: response.isCorrect,
        timestamp: response.answeredAt,
        masteryAfter: Math.round(currentMastery * 1000) / 1000 // Round to 3 decimal places
      });
    }
    
    return {
      finalMastery: Math.round(currentMastery * 1000) / 1000,
      responseHistory: responseHistory // Keep ALL responses for comprehensive analysis
    };
  }

  /**
   * Item Response Theory (IRT) 2-Parameter Logistic Model
   * Formula: P(X_ij = 1|θ_j, a_i, b_i) = 1 / (1 + e^(-1.702×a_i×(θ_j - b_i)))
   * 
   * @param {number} ability - Student ability (θ) on scale -3 to +3
   * @param {number} difficulty - Item difficulty (b) on same scale
   * @param {number} discrimination - Item discrimination (a), typically 0.5-2.0
   * @returns {number} Probability of correct response (0-1)
   */
  calculateIRTProbability(ability, difficulty, discrimination = 1.0) {
    const exponent = -1.702 * discrimination * (ability - difficulty);
    return 1 / (1 + Math.exp(exponent));
  }

  /**
   * Estimate student ability using IRT from proportion correct
   * Converts percentage correct to ability estimate on -3 to +3 scale
   * 
   * @param {number} proportionCorrect - Proportion of correct answers (0-1)
   * @returns {number} Ability estimate (-3 to +3)
   */
  estimateAbilityFromProportion(proportionCorrect) {
    // Handle boundary cases
    if (proportionCorrect <= 0) return -2.0; // Floor value
    if (proportionCorrect >= 1) return 2.0;  // Ceiling value
    
    // Logit transformation: θ = ln(p / (1-p))
    const ability = Math.log(proportionCorrect / (1 - proportionCorrect));
    
    // Bound between -3 and +3
    return Math.max(-3, Math.min(3, Math.round(ability * 100) / 100));
  }

  /**
   * Calculate ability estimate for Phonological Awareness (special handling)
   * Uses correctMatches/totalMatches instead of simple correct/total
   * 
   * @param {Array} responses - Array with correctMatches and totalMatches
   * @returns {number} Ability estimate (-3 to +3)
   */
  estimateAbilityPhonologicalAwareness(responses) {
    const totalMatches = responses.reduce((sum, r) => sum + (r.totalMatches || 0), 0);
    const correctMatches = responses.reduce((sum, r) => sum + (r.correctMatches || 0), 0);
    
    if (totalMatches === 0) return 0.0;
    
    const proportionCorrect = correctMatches / totalMatches;
    return this.estimateAbilityFromProportion(proportionCorrect);
  }

  /**
   * Calculate weighted composite score by reading level
   * Uses exact weights from CLAUDE.md specification
   * 
   * @param {Object} categoryScores - Object with category names as keys, scores as values
   * @param {string} readingLevel - Student's reading level
   * @returns {number} Weighted overall score (0-100)
   */
  calculateWeightedScore(categoryScores, readingLevel) {
    const weights = CATEGORY_WEIGHTS[readingLevel] || CATEGORY_WEIGHTS["At Grade Level"];
    
    let totalScore = 0;
    let totalWeight = 0;
    
    for (const [category, score] of Object.entries(categoryScores)) {
      const weight = weights[category] || 0;
      if (weight > 0 && typeof score === 'number') {
        totalScore += score * weight;
        totalWeight += weight;
      }
    }
    
    return totalWeight > 0 ? Math.round(totalScore / totalWeight) : 0;
  }

  /**
   * Classify performance level based on score
   * 
   * @param {number} score - Score (0-100)
   * @returns {Object} {level, isPassed, description}
   */
  classifyPerformanceLevel(score) {
    if (score >= 85) {
      return {
        level: "excellent",
        isPassed: true,
        description: "Excellent performance"
      };
    } else if (score >= 75) {
      return {
        level: "proficient", 
        isPassed: true,
        description: "Proficient - meets standard"
      };
    } else if (score >= 60) {
      return {
        level: "approaching",
        isPassed: false,
        description: "Approaching proficiency"
      };
    } else {
      return {
        level: "below_basic",
        isPassed: false,
        description: "Below basic - needs significant support"
      };
    }
  }

  /**
   * Calculate progress metrics between two assessments
   * 
   * @param {Object} previousAnalysis - Previous prescriptive analysis
   * @param {Object} currentAnalysis - Current prescriptive analysis  
   * @returns {Object} Progress metrics
   */
  calculateProgressMetrics(previousAnalysis, currentAnalysis) {
    const progress = {
      overallImprovement: 0,
      categoryProgress: {},
      masteryGains: {},
      timeElapsed: 0
    };

    if (!previousAnalysis) return progress;

    // Calculate time elapsed
    const prevDate = new Date(previousAnalysis.createdAt);
    const currDate = new Date(currentAnalysis.createdAt);
    progress.timeElapsed = Math.round((currDate - prevDate) / (1000 * 60 * 60 * 24)); // days

    // Overall improvement
    progress.overallImprovement = 
      (currentAnalysis.insights?.overallScore || 0) - (previousAnalysis.insights?.overallScore || 0);

    // Category-level progress
    for (const category in currentAnalysis.skillMastery) {
      const currentScore = currentAnalysis.skillMastery.get(category)?.score || 0;
      const previousScore = previousAnalysis.skillMastery?.get(category)?.score || 0;
      
      progress.categoryProgress[category] = currentScore - previousScore;
      
      const currentMastery = currentAnalysis.skillMastery.get(category)?.masteryProbability || 0;
      const previousMastery = previousAnalysis.skillMastery?.get(category)?.masteryProbability || 0;
      
      progress.masteryGains[category] = currentMastery - previousMastery;
    }

    return progress;
  }

  /**
   * Get category weights for a reading level
   * 
   * @param {string} readingLevel - Reading level
   * @returns {Object} Category weights
   */
  getCategoryWeights(readingLevel) {
    return CATEGORY_WEIGHTS[readingLevel] || CATEGORY_WEIGHTS["At Grade Level"];
  }

  /**
   * Enhanced BKT update that considers response time for learning probability
   * Faster correct responses indicate stronger mastery
   * 
   * @param {number} currentMastery - Current mastery probability (0-1)
   * @param {boolean} isCorrect - Whether response was correct
   * @param {number} responseTime - Time taken to respond (seconds)
   * @param {number} expectedTime - Expected time for this question type (seconds)
   * @param {Object} params - BKT parameters
   * @returns {number} Updated mastery probability with time consideration
   */
  updateMasteryProbabilityWithTime(currentMastery, isCorrect, responseTime, expectedTime, params = BKT_PARAMETERS) {
    // First, get base BKT update
    const baseMastery = this.updateMasteryProbabilityBKT(currentMastery, isCorrect, params);
    
    // Calculate time factor for learning probability adjustment
    const timeFactor = this.calculateTimeFactor(responseTime, expectedTime, isCorrect);
    
    // Adjust learning probability based on response time
    const adjustedParams = { ...params };
    adjustedParams.P_LEARN = params.P_LEARN * timeFactor;
    
    // Recalculate with adjusted parameters
    const { P_LEARN, P_GUESS, P_SLIP } = adjustedParams;
    
    let evidenceGivenMastery;
    
    if (isCorrect) {
      const pCorrect = currentMastery * (1 - P_SLIP) + (1 - currentMastery) * P_GUESS;
      evidenceGivenMastery = (currentMastery * (1 - P_SLIP)) / pCorrect;
    } else {
      const pIncorrect = currentMastery * P_SLIP + (1 - currentMastery) * (1 - P_GUESS);
      evidenceGivenMastery = (currentMastery * P_SLIP) / pIncorrect;
    }
    
    // Apply time-adjusted learning
    const updatedMastery = evidenceGivenMastery + (1 - evidenceGivenMastery) * P_LEARN;
    
    return Math.max(0, Math.min(1, updatedMastery));
  }

  /**
   * Calculate time factor for BKT learning adjustment
   * Fast correct responses get bonus learning, slow responses get penalty
   * 
   * @param {number} responseTime - Actual response time
   * @param {number} expectedTime - Expected response time  
   * @param {boolean} isCorrect - Whether response was correct
   * @returns {number} Time factor (0.5 to 2.0)
   */
  calculateTimeFactor(responseTime, expectedTime, isCorrect) {
    if (!responseTime || !expectedTime || responseTime <= 0 || expectedTime <= 0) {
      return 1.0; // No adjustment if invalid data
    }
    
    const timeRatio = responseTime / expectedTime;
    
    if (isCorrect) {
      // Correct responses: faster = more learning
      if (timeRatio < 0.5) return 1.8;        // Very fast correct = high learning
      else if (timeRatio < 0.8) return 1.4;   // Fast correct = good learning
      else if (timeRatio < 1.2) return 1.0;   // Normal speed = baseline
      else if (timeRatio < 2.0) return 0.8;   // Slow correct = reduced learning
      else return 0.6;                        // Very slow correct = minimal learning
    } else {
      // Incorrect responses: time indicates different error types
      if (timeRatio < 0.5) return 0.5;        // Very fast incorrect = guessing
      else if (timeRatio < 1.0) return 0.7;   // Fast incorrect = careless error
      else if (timeRatio < 2.0) return 0.9;   // Slow incorrect = thoughtful but wrong
      else return 0.8;                        // Very slow incorrect = confusion
    }
  }

  /**
   * Process BKT sequence with time awareness
   * 
   * @param {Array} responses - Array with responseTime data
   * @param {number} initialMastery - Starting mastery
   * @param {Object} expectedTimes - Expected times by question type
   * @returns {Object} BKT results with time considerations
   */
  processBKTSequenceWithTime(responses, initialMastery = BKT_PARAMETERS.P_INIT, expectedTimes = {}) {
    let currentMastery = initialMastery;
    const responseHistory = [];
    
    const sortedResponses = responses.sort((a, b) => new Date(a.answeredAt) - new Date(b.answeredAt));
    
    for (const response of sortedResponses) {
      // Get expected time for this question type or use fallback
      const expectedTime = expectedTimes[response.questionId] || 
                          expectedTimes.default || 
                          this.getDefaultExpectedTime(response);
      
      // Update mastery with time consideration
      if (response.responseTime && expectedTime) {
        currentMastery = this.updateMasteryProbabilityWithTime(
          currentMastery, 
          response.isCorrect, 
          response.responseTime, 
          expectedTime
        );
      } else {
        // Fallback to standard BKT
        currentMastery = this.updateMasteryProbabilityBKT(currentMastery, response.isCorrect);
      }
      
      responseHistory.push({
        questionId: response.questionId,
        correct: response.isCorrect,
        responseTime: response.responseTime,
        expectedTime: expectedTime,
        timestamp: response.answeredAt,
        masteryAfter: Math.round(currentMastery * 1000) / 1000
      });
    }
    
    return {
      finalMastery: Math.round(currentMastery * 1000) / 1000,
      responseHistory: responseHistory, // Keep ALL responses for comprehensive analysis
      timeAdjusted: true
    };
  }

  /**
   * Get default expected time based on question characteristics
   * 
   * @param {Object} response - Response object with question info
   * @returns {number} Default expected time in seconds
   */
  getDefaultExpectedTime(response) {
    // Default times by category and question type
    const defaults = {
      'Alphabet Knowledge': 8.5,
      'Phonological Awareness': 15.8,
      'Decoding': 12.3,
      'Word Recognition': 9.7,
      'Reading Comprehension': 25.4
    };
    
    return defaults[response.category] || 10.0;
  }

  /**
   * Calculate time-weighted ability estimate using IRT with response time
   * Incorporates response time as confidence indicator
   * 
   * @param {Array} responses - Responses with time data
   * @returns {Object} Ability estimate with confidence
   */
  estimateAbilityWithTime(responses) {
    if (!responses || responses.length === 0) {
      return { ability: 0.0, confidence: 0, timeAdjusted: false };
    }
    
    // Calculate base proportion correct
    const correctCount = responses.filter(r => r.isCorrect).length;
    const proportionCorrect = correctCount / responses.length;
    
    // Calculate time consistency factor
    const responseTimes = responses
      .filter(r => r.responseTime && r.responseTime > 0)
      .map(r => r.responseTime);
    
    let timeConfidence = 1.0;
    if (responseTimes.length >= 3) {
      const meanTime = responseTimes.reduce((sum, time) => sum + time, 0) / responseTimes.length;
      const variance = responseTimes.reduce((sum, time) => sum + Math.pow(time - meanTime, 2), 0) / responseTimes.length;
      const coefficient = Math.sqrt(variance) / meanTime;
      
      // Lower coefficient = more consistent = higher confidence
      timeConfidence = Math.max(0.3, 1 - coefficient);
    }
    
    // Base ability estimate
    const baseAbility = this.estimateAbilityFromProportion(proportionCorrect);
    
    // Time-adjusted confidence score
    const confidenceScore = Math.round(timeConfidence * 100);
    
    return {
      ability: baseAbility,
      confidence: confidenceScore,
      timeConsistency: Math.round(timeConfidence * 100) / 100,
      meanResponseTime: responseTimes.length > 0 ? 
        Math.round(responseTimes.reduce((sum, time) => sum + time, 0) / responseTimes.length * 100) / 100 : 0,
      timeAdjusted: responseTimes.length >= 3
    };
  }

  /**
   * Predict success probability for future questions based on time patterns
   * 
   * @param {Array} historicalResponses - Past responses with time data
   * @param {number} targetDifficulty - Difficulty of target questions (-3 to +3)
   * @param {number} expectedTime - Expected time for target questions
   * @returns {Object} Success prediction with time factors
   */
  predictSuccessWithTime(historicalResponses, targetDifficulty, expectedTime) {
    if (!historicalResponses || historicalResponses.length === 0) {
      return {
        successProbability: 0.5,
        confidence: 'low',
        timeFactor: 1.0,
        recommendation: 'insufficient_data'
      };
    }
    
    // Get current ability estimate with time consideration
    const abilityData = this.estimateAbilityWithTime(historicalResponses);
    const currentAbility = abilityData.ability;
    
    // Base IRT prediction
    const baseSuccessProbability = this.calculateIRTProbability(currentAbility, targetDifficulty, 1.0);
    
    // Analyze time patterns for stress/fatigue factors
    const recentResponses = historicalResponses.slice(-5);
    const timeTrend = this.analyzeTimeTrend(recentResponses);
    
    // Adjust success probability based on time patterns
    let timeAdjustment = 1.0;
    
    if (timeTrend.trend === 'improving') {
      timeAdjustment = 1.1; // Getting faster = more confident
    } else if (timeTrend.trend === 'declining') {
      timeAdjustment = 0.9; // Getting slower = potential fatigue
    }
    
    // Factor in time pressure
    if (expectedTime && recentResponses.length > 0) {
      const avgRecentTime = recentResponses.reduce((sum, r) => sum + (r.responseTime || 0), 0) / recentResponses.length;
      const timePressure = avgRecentTime / expectedTime;
      
      if (timePressure > 1.5) {
        timeAdjustment *= 0.85; // Under time pressure
      } else if (timePressure < 0.7) {
        timeAdjustment *= 1.1; // Plenty of time
      }
    }
    
    const adjustedProbability = Math.max(0.05, Math.min(0.95, baseSuccessProbability * timeAdjustment));
    
    return {
      successProbability: Math.round(adjustedProbability * 1000) / 1000,
      confidence: abilityData.confidence > 70 ? 'high' : abilityData.confidence > 40 ? 'medium' : 'low',
      timeFactor: Math.round(timeAdjustment * 100) / 100,
      timeTrend: timeTrend.trend,
      recommendation: adjustedProbability > 0.75 ? 'proceed' : adjustedProbability > 0.5 ? 'review' : 'remediate',
      baseAbility: currentAbility,
      timeConsistency: abilityData.timeConsistency
    };
  }

  /**
   * Analyze time trend from recent responses
   * 
   * @param {Array} responses - Recent responses with time data
   * @returns {Object} Trend analysis
   */
  analyzeTimeTrend(responses) {
    if (!responses || responses.length < 3) {
      return { trend: 'insufficient_data', slope: 0 };
    }
    
    const validResponses = responses.filter(r => r.responseTime && r.responseTime > 0);
    if (validResponses.length < 3) {
      return { trend: 'insufficient_data', slope: 0 };
    }
    
    // Simple linear regression on response times
    const n = validResponses.length;
    const indices = validResponses.map((_, i) => i);
    const times = validResponses.map(r => r.responseTime);
    
    const sumX = indices.reduce((sum, x) => sum + x, 0);
    const sumY = times.reduce((sum, y) => sum + y, 0);
    const sumXY = indices.reduce((sum, x, i) => sum + x * times[i], 0);
    const sumXX = indices.reduce((sum, x) => sum + x * x, 0);
    
    const slope = (n * sumXY - sumX * sumY) / (n * sumXX - sumX * sumX);
    
    let trend;
    if (Math.abs(slope) < 0.5) {
      trend = 'stable';
    } else if (slope < 0) {
      trend = 'improving'; // Getting faster
    } else {
      trend = 'declining'; // Getting slower
    }
    
    return {
      trend,
      slope: Math.round(slope * 100) / 100
    };
  }

  /**
   * Get BKT parameters (for testing/debugging)
   * 
   * @returns {Object} BKT parameters
   */
  getBKTParameters() {
    return { ...BKT_PARAMETERS };
  }
}

module.exports = new MathematicalModelsService();