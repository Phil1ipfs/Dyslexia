// Time Prediction Service for Prescriptive Analytics
// Uses historical responseTime data to predict completion times and optimize interventions

const StudentResponse = require('../../../models/Teachers/ManageProgress/studentResponseModel');
const InterventionResponse = require('../../../models/Teachers/ManageProgress/interventionResponseModel');

class TimePredictionService {
  
  /**
   * Predict completion time for intervention based on historical response times
   * 
   * @param {number} studentId - Student ID
   * @param {string} category - Category name
   * @param {number} questionCount - Number of questions planned
   * @param {string} readingLevel - Student's reading level
   * @returns {Object} Time prediction with confidence interval
   */
  async predictInterventionTime(studentId, category, questionCount, readingLevel) {
    try {
      // Get historical response times for this student and category
      const historicalTimes = await this.getHistoricalResponseTimes(studentId, category);
      
      // Get category-specific timing patterns
      const categoryTimingPatterns = await this.getCategoryTimingPatterns(category, readingLevel);
      
      // If we have student history, use personalized prediction
      if (historicalTimes.length >= 3) {
        return this.calculatePersonalizedPrediction(historicalTimes, questionCount, categoryTimingPatterns);
      }
      
      // Otherwise, use category-based prediction
      return this.calculateCategoryBasedPrediction(category, questionCount, readingLevel, categoryTimingPatterns);
      
    } catch (error) {
      console.error('Error predicting intervention time:', error);
      // Return fallback prediction
      return this.getFallbackPrediction(category, questionCount, readingLevel);
    }
  }

  /**
   * Get historical response times for a student in a specific category
   * 
   * @param {number} studentId - Student ID
   * @param {string} category - Category name
   * @returns {Array} Array of response time objects
   */
  async getHistoricalResponseTimes(studentId, category) {
    try {
      // Get main assessment response times
      const mainResponses = await StudentResponse.find({
        studentId,
        category,
        responseTime: { $exists: true, $gte: 0 }
      })
      .select('responseTime isCorrect answeredAt questionId')
      .sort({ answeredAt: -1 })
      .limit(50) // Last 50 responses
      .lean();

      // Get intervention response times
      const interventionResponses = await InterventionResponse.find({
        studentId,
        category,
        responseTime: { $exists: true, $gte: 0 }
      })
      .select('responseTime isCorrect answeredAt questionId')
      .sort({ answeredAt: -1 })
      .limit(30) // Last 30 intervention responses
      .lean();

      // Combine and sort by recency
      const allResponses = [...mainResponses, ...interventionResponses]
        .sort((a, b) => new Date(b.answeredAt) - new Date(a.answeredAt));

      return allResponses.map(response => ({
        responseTime: response.responseTime,
        isCorrect: response.isCorrect,
        answeredAt: response.answeredAt,
        questionId: response.questionId,
        source: response.interventionResultsId ? 'intervention' : 'main'
      }));

    } catch (error) {
      console.error('Error fetching historical response times:', error);
      return [];
    }
  }

  /**
   * Get timing patterns for a category and reading level from all students
   * 
   * @param {string} category - Category name
   * @param {string} readingLevel - Reading level
   * @returns {Object} Timing statistics
   */
  async getCategoryTimingPatterns(category, readingLevel) {
    try {
      // Get response times from students at the same reading level
      const responses = await StudentResponse.aggregate([
        {
          $lookup: {
            from: 'users',
            localField: 'studentId',
            foreignField: 'studentId',
            as: 'student'
          }
        },
        {
          $match: {
            category: category,
            'student.readingLevel': readingLevel,
            responseTime: { $exists: true, $gte: 0, $lte: 180 } // Filter extreme values (0-180 seconds)
          }
        },
        {
          $group: {
            _id: null,
            avgTime: { $avg: '$responseTime' },
            medianTime: { $push: '$responseTime' },
            correctAvgTime: { 
              $avg: { 
                $cond: [{ $eq: ['$isCorrect', true] }, '$responseTime', null] 
              }
            },
            incorrectAvgTime: { 
              $avg: { 
                $cond: [{ $eq: ['$isCorrect', false] }, '$responseTime', null] 
              }
            },
            totalResponses: { $sum: 1 }
          }
        }
      ]);

      if (responses.length === 0) {
        return this.getDefaultCategoryTimingPatterns(category);
      }

      const stats = responses[0];
      
      // Calculate median
      const sortedTimes = stats.medianTime.sort((a, b) => a - b);
      const median = sortedTimes[Math.floor(sortedTimes.length / 2)];
      
      // Calculate standard deviation
      const variance = stats.medianTime.reduce((sum, time) => 
        sum + Math.pow(time - stats.avgTime, 2), 0) / stats.medianTime.length;
      const standardDeviation = Math.sqrt(variance);

      return {
        avgTime: Math.round(stats.avgTime * 100) / 100,
        medianTime: Math.round(median * 100) / 100,
        correctAvgTime: Math.round(stats.correctAvgTime * 100) / 100,
        incorrectAvgTime: Math.round(stats.incorrectAvgTime * 100) / 100,
        standardDeviation: Math.round(standardDeviation * 100) / 100,
        totalResponses: stats.totalResponses,
        category,
        readingLevel
      };

    } catch (error) {
      console.error('Error fetching category timing patterns:', error);
      return this.getDefaultCategoryTimingPatterns(category);
    }
  }

  /**
   * Calculate personalized time prediction based on student's history
   * 
   * @param {Array} historicalTimes - Student's historical response times
   * @param {number} questionCount - Number of questions
   * @param {Object} categoryPatterns - Category timing patterns
   * @returns {Object} Personalized prediction
   */
  calculatePersonalizedPrediction(historicalTimes, questionCount, categoryPatterns) {
    // Get recent performance (last 10 responses)
    const recentTimes = historicalTimes.slice(0, 10);
    
    // Calculate student's average response time
    const avgResponseTime = recentTimes.reduce((sum, r) => sum + r.responseTime, 0) / recentTimes.length;
    
    // Calculate accuracy-based adjustment
    const recentAccuracy = recentTimes.filter(r => r.isCorrect).length / recentTimes.length;
    const accuracyFactor = recentAccuracy > 0.7 ? 0.9 : (recentAccuracy < 0.5 ? 1.3 : 1.1);
    
    // Calculate learning trend (improving or declining)
    const firstHalf = recentTimes.slice(0, Math.floor(recentTimes.length / 2));
    const secondHalf = recentTimes.slice(Math.ceil(recentTimes.length / 2));
    
    const firstHalfAvg = firstHalf.reduce((sum, r) => sum + r.responseTime, 0) / firstHalf.length;
    const secondHalfAvg = secondHalf.reduce((sum, r) => sum + r.responseTime, 0) / secondHalf.length;
    
    // Trend factor: if getting faster over time, reduce prediction
    const trendFactor = firstHalfAvg > secondHalfAvg ? 0.95 : 1.05;
    
    // Base prediction per question
    const predictedTimePerQuestion = avgResponseTime * accuracyFactor * trendFactor;
    
    // Total time with buffer for interface interactions
    const baseTime = predictedTimePerQuestion * questionCount;
    const interfaceBuffer = questionCount * 2; // 2 seconds per question for UI interactions
    const totalTime = baseTime + interfaceBuffer;
    
    // Calculate confidence based on consistency of historical times
    const variance = recentTimes.reduce((sum, r) => 
      sum + Math.pow(r.responseTime - avgResponseTime, 2), 0) / recentTimes.length;
    const standardDeviation = Math.sqrt(variance);
    const coefficient = standardDeviation / avgResponseTime;
    
    const confidence = coefficient < 0.3 ? 'high' : coefficient < 0.6 ? 'medium' : 'low';
    
    return {
      predictedTime: Math.round(totalTime),
      timePerQuestion: Math.round(predictedTimePerQuestion * 100) / 100,
      confidence,
      confidenceScore: Math.round((1 - Math.min(coefficient, 1)) * 100),
      factors: {
        accuracyFactor: Math.round(accuracyFactor * 100) / 100,
        trendFactor: Math.round(trendFactor * 100) / 100,
        recentAccuracy: Math.round(recentAccuracy * 100) / 100
      },
      dataPoints: recentTimes.length,
      range: {
        min: Math.round(totalTime * 0.7),
        max: Math.round(totalTime * 1.4)
      }
    };
  }

  /**
   * Calculate category-based prediction when no student history available
   * 
   * @param {string} category - Category name
   * @param {number} questionCount - Number of questions
   * @param {string} readingLevel - Reading level
   * @param {Object} categoryPatterns - Category timing patterns
   * @returns {Object} Category-based prediction
   */
  calculateCategoryBasedPrediction(category, questionCount, readingLevel, categoryPatterns) {
    // Use category average with reading level adjustments
    let baseTimePerQuestion = categoryPatterns.avgTime || this.getDefaultTimePerQuestion(category);
    
    // Reading level adjustments
    const readingLevelFactors = {
      'Low Emerging': 1.4,      // Slower, more careful
      'High Emerging': 1.2,     // Still learning
      'Developing': 1.0,        // Average
      'Transitioning': 0.9,     // Getting faster
      'At Grade Level': 0.8     // Fastest
    };
    
    const levelFactor = readingLevelFactors[readingLevel] || 1.0;
    baseTimePerQuestion = baseTimePerQuestion * levelFactor;
    
    // Total time calculation
    const baseTime = baseTimePerQuestion * questionCount;
    const interfaceBuffer = questionCount * 3; // Extra buffer without personal history
    const totalTime = baseTime + interfaceBuffer;
    
    return {
      predictedTime: Math.round(totalTime),
      timePerQuestion: Math.round(baseTimePerQuestion * 100) / 100,
      confidence: 'medium',
      confidenceScore: 60,
      factors: {
        readingLevelFactor: levelFactor,
        categoryAverage: categoryPatterns.avgTime || this.getDefaultTimePerQuestion(category)
      },
      dataPoints: categoryPatterns.totalResponses || 0,
      range: {
        min: Math.round(totalTime * 0.6),
        max: Math.round(totalTime * 1.6)
      }
    };
  }

  /**
   * Get fallback prediction when all else fails
   * 
   * @param {string} category - Category name
   * @param {number} questionCount - Number of questions
   * @param {string} readingLevel - Reading level
   * @returns {Object} Fallback prediction
   */
  getFallbackPrediction(category, questionCount, readingLevel) {
    const baseTime = this.getDefaultTimePerQuestion(category) * questionCount;
    const readingLevelFactor = readingLevel === 'Low Emerging' ? 1.5 : 
                              readingLevel === 'High Emerging' ? 1.2 : 1.0;
    
    const totalTime = baseTime * readingLevelFactor + (questionCount * 3);
    
    return {
      predictedTime: Math.round(totalTime),
      timePerQuestion: Math.round(this.getDefaultTimePerQuestion(category) * readingLevelFactor * 100) / 100,
      confidence: 'low',
      confidenceScore: 30,
      factors: {
        fallback: true,
        readingLevelFactor
      },
      dataPoints: 0,
      range: {
        min: Math.round(totalTime * 0.5),
        max: Math.round(totalTime * 2.0)
      }
    };
  }

  /**
   * Get default category timing patterns
   * 
   * @param {string} category - Category name
   * @returns {Object} Default timing patterns
   */
  getDefaultCategoryTimingPatterns(category) {
    const defaults = {
      'Alphabet Knowledge': {
        avgTime: 8.5,
        medianTime: 7.0,
        correctAvgTime: 7.2,
        incorrectAvgTime: 10.5,
        standardDeviation: 4.2
      },
      'Phonological Awareness': {
        avgTime: 15.8,
        medianTime: 14.0,
        correctAvgTime: 13.5,
        incorrectAvgTime: 19.2,
        standardDeviation: 8.1
      },
      'Decoding': {
        avgTime: 12.3,
        medianTime: 11.0,
        correctAvgTime: 10.8,
        incorrectAvgTime: 15.1,
        standardDeviation: 6.4
      },
      'Word Recognition': {
        avgTime: 9.7,
        medianTime: 8.5,
        correctAvgTime: 8.2,
        incorrectAvgTime: 12.4,
        standardDeviation: 5.3
      },
      'Reading Comprehension': {
        avgTime: 25.4,
        medianTime: 22.0,
        correctAvgTime: 21.8,
        incorrectAvgTime: 31.2,
        standardDeviation: 12.7
      }
    };

    return defaults[category] || defaults['Alphabet Knowledge'];
  }

  /**
   * Get default time per question for category
   * 
   * @param {string} category - Category name
   * @returns {number} Default time in seconds
   */
  getDefaultTimePerQuestion(category) {
    const defaults = {
      'Alphabet Knowledge': 8.5,
      'Phonological Awareness': 15.8,
      'Decoding': 12.3,
      'Word Recognition': 9.7,
      'Reading Comprehension': 25.4
    };

    return defaults[category] || 10.0;
  }

  /**
   * Calculate optimal question count based on available time and student ability
   * 
   * @param {number} availableMinutes - Available time in minutes
   * @param {number} studentId - Student ID
   * @param {string} category - Category name
   * @param {string} readingLevel - Reading level
   * @returns {Object} Optimal question count and timing
   */
  async calculateOptimalQuestionCount(availableMinutes, studentId, category, readingLevel) {
    try {
      const availableSeconds = availableMinutes * 60;
      
      // Get historical response times to estimate per-question time
      const historicalTimes = await this.getHistoricalResponseTimes(studentId, category);
      const categoryPatterns = await this.getCategoryTimingPatterns(category, readingLevel);
      
      let estimatedTimePerQuestion;
      
      if (historicalTimes.length >= 3) {
        // Use student's personal average
        estimatedTimePerQuestion = historicalTimes
          .slice(0, 10)
          .reduce((sum, r) => sum + r.responseTime, 0) / Math.min(10, historicalTimes.length);
      } else {
        // Use category average adjusted for reading level
        estimatedTimePerQuestion = this.getDefaultTimePerQuestion(category);
        const levelFactor = readingLevel === 'Low Emerging' ? 1.4 : 
                           readingLevel === 'High Emerging' ? 1.2 : 1.0;
        estimatedTimePerQuestion *= levelFactor;
      }
      
      // Add buffer for UI interactions (3 seconds per question)
      const totalTimePerQuestion = estimatedTimePerQuestion + 3;
      
      // Calculate optimal count with 80% of available time (leave buffer)
      const usableTime = availableSeconds * 0.8;
      let optimalCount = Math.floor(usableTime / totalTimePerQuestion);
      
      // Apply constraints based on category and reading level
      const constraints = this.getQuestionCountConstraints(category, readingLevel);
      optimalCount = Math.max(constraints.min, Math.min(constraints.max, optimalCount));
      
      // Calculate actual predicted time
      const actualPrediction = await this.predictInterventionTime(
        studentId, category, optimalCount, readingLevel
      );
      
      return {
        optimalQuestionCount: optimalCount,
        estimatedTimePerQuestion: Math.round(estimatedTimePerQuestion * 100) / 100,
        totalEstimatedTime: actualPrediction.predictedTime,
        availableTime: availableSeconds,
        timeUtilization: Math.round((actualPrediction.predictedTime / availableSeconds) * 100),
        constraints,
        recommendation: this.getCountRecommendation(optimalCount, constraints)
      };
      
    } catch (error) {
      console.error('Error calculating optimal question count:', error);
      // Return fallback
      const constraints = this.getQuestionCountConstraints(category, readingLevel);
      return {
        optimalQuestionCount: constraints.recommended,
        estimatedTimePerQuestion: this.getDefaultTimePerQuestion(category),
        totalEstimatedTime: constraints.recommended * this.getDefaultTimePerQuestion(category),
        availableTime: availableMinutes * 60,
        timeUtilization: 70,
        constraints,
        recommendation: 'Using fallback recommendation due to data unavailability'
      };
    }
  }

  /**
   * Get question count constraints by category and reading level
   * 
   * @param {string} category - Category name
   * @param {string} readingLevel - Reading level
   * @returns {Object} Min, max, and recommended question counts
   */
  getQuestionCountConstraints(category, readingLevel) {
    // Base constraints by category
    const categoryConstraints = {
      'Alphabet Knowledge': { min: 5, max: 20, recommended: 10 },
      'Phonological Awareness': { min: 3, max: 15, recommended: 8 },
      'Decoding': { min: 4, max: 18, recommended: 10 },
      'Word Recognition': { min: 5, max: 25, recommended: 12 },
      'Reading Comprehension': { min: 2, max: 8, recommended: 5 }
    };

    const base = categoryConstraints[category] || categoryConstraints['Alphabet Knowledge'];
    
    // Adjust for reading level
    const levelAdjustments = {
      'Low Emerging': { minFactor: 0.6, maxFactor: 0.8, recFactor: 0.7 },
      'High Emerging': { minFactor: 0.8, maxFactor: 0.9, recFactor: 0.85 },
      'Developing': { minFactor: 1.0, maxFactor: 1.0, recFactor: 1.0 },
      'Transitioning': { minFactor: 1.0, maxFactor: 1.2, recFactor: 1.1 },
      'At Grade Level': { minFactor: 1.0, maxFactor: 1.4, recFactor: 1.2 }
    };

    const adjustment = levelAdjustments[readingLevel] || levelAdjustments['Developing'];
    
    return {
      min: Math.max(1, Math.round(base.min * adjustment.minFactor)),
      max: Math.round(base.max * adjustment.maxFactor),
      recommended: Math.round(base.recommended * adjustment.recFactor),
      category,
      readingLevel
    };
  }

  /**
   * Get recommendation text for question count
   * 
   * @param {number} count - Calculated optimal count
   * @param {Object} constraints - Question count constraints
   * @returns {string} Recommendation text
   */
  getCountRecommendation(count, constraints) {
    if (count < constraints.min) {
      return `Increased to minimum ${constraints.min} questions for reliable assessment`;
    } else if (count > constraints.max) {
      return `Reduced to maximum ${constraints.max} questions to prevent fatigue`;
    } else if (count === constraints.recommended) {
      return 'Optimal count matches recommended baseline';
    } else {
      return 'Optimized based on available time and student performance history';
    }
  }

  /**
   * Predict time for specific question types within a category
   * 
   * @param {number} studentId - Student ID
   * @param {string} category - Category name
   * @param {Array} questionTypes - Array of question types
   * @returns {Object} Time predictions by question type
   */
  async predictTimeByQuestionType(studentId, category, questionTypes) {
    try {
      const historicalTimes = await this.getHistoricalResponseTimes(studentId, category);
      
      // Group historical times by question type (if available)
      const timesByType = {};
      
      for (const questionType of questionTypes) {
        const typeResponses = historicalTimes.filter(r => 
          r.questionId && r.questionId.toLowerCase().includes(questionType.toLowerCase())
        );
        
        if (typeResponses.length >= 2) {
          const avgTime = typeResponses.reduce((sum, r) => sum + r.responseTime, 0) / typeResponses.length;
          timesByType[questionType] = {
            avgTime: Math.round(avgTime * 100) / 100,
            dataPoints: typeResponses.length,
            confidence: typeResponses.length >= 5 ? 'high' : 'medium'
          };
        } else {
          // Use category default
          timesByType[questionType] = {
            avgTime: this.getDefaultTimePerQuestion(category),
            dataPoints: 0,
            confidence: 'low'
          };
        }
      }
      
      return timesByType;
    } catch (error) {
      console.error('Error predicting time by question type:', error);
      
      // Return defaults
      const result = {};
      questionTypes.forEach(type => {
        result[type] = {
          avgTime: this.getDefaultTimePerQuestion(category),
          dataPoints: 0,
          confidence: 'low'
        };
      });
      return result;
    }
  }
}

module.exports = new TimePredictionService();