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
      responseHistory: responseHistory.slice(-10) // Keep last 10 responses
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
   * Get BKT parameters (for testing/debugging)
   * 
   * @returns {Object} BKT parameters
   */
  getBKTParameters() {
    return { ...BKT_PARAMETERS };
  }
}

module.exports = new MathematicalModelsService();