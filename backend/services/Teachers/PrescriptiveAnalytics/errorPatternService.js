// Error Pattern Analysis Service for Prescriptive Analytics
// Analyzes student_responses to identify specific error patterns by category

const StudentResponse = require('../../../models/Teachers/ManageProgress/studentResponseModel');

class ErrorPatternService {
  
  /**
   * Analyze error patterns from student responses
   * 
   * @param {number} studentId - Student ID
   * @param {string} categoryResultId - Category result ID to link responses
   * @returns {Object} Error patterns by category
   */
  async analyzeErrorPatterns(studentId, categoryResultId = null) {
    try {
      // Fetch student responses for analysis
      const query = { studentId };
      if (categoryResultId) {
        query.categoryId = categoryResultId;
      }
      
      const responses = await StudentResponse.find(query).sort({ answeredAt: 1 });
      
      // Group responses by category
      const responsesByCategory = this.groupResponsesByCategory(responses);
      
      const errorPatterns = {};
      
      // Analyze each category
      for (const [category, categoryResponses] of Object.entries(responsesByCategory)) {
        switch (category) {
          case 'Alphabet Knowledge':
            errorPatterns[category] = this.analyzeAlphabetKnowledgeErrors(categoryResponses);
            break;
          case 'Phonological Awareness':
            errorPatterns[category] = this.analyzePhonologicalAwarenessErrors(categoryResponses);
            break;
          case 'Decoding':
            errorPatterns[category] = this.analyzeDecodingErrors(categoryResponses);
            break;
          case 'Word Recognition':
            errorPatterns[category] = this.analyzeWordRecognitionErrors(categoryResponses);
            break;
          case 'Reading Comprehension':
            errorPatterns[category] = this.analyzeReadingComprehensionErrors(categoryResponses);
            break;
        }
      }
      
      return errorPatterns;
    } catch (error) {
      console.error('Error analyzing error patterns:', error);
      throw error;
    }
  }

  /**
   * Group responses by category
   */
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

  /**
   * Analyze Alphabet Knowledge errors
   * Identifies patinig (vowel) and katinig (consonant) error patterns
   */
  analyzeAlphabetKnowledgeErrors(responses) {
    const errorAnalysis = {};
    
    // Separate patinig and katinig responses based on questionValue
    const patinigLetters = ['A', 'E', 'I', 'O', 'U'];
    const patinigResponses = responses.filter(r => 
      r.questionValue && patinigLetters.includes(r.questionValue.toUpperCase())
    );
    const katinigResponses = responses.filter(r => 
      r.questionValue && !patinigLetters.includes(r.questionValue.toUpperCase()) && r.questionValue
    );
    
    // Analyze patinig errors
    const patinigErrors = patinigResponses.filter(r => !r.isCorrect);
    if (patinigErrors.length > 0 && patinigResponses.length > 0) {
      const specificLetters = [...new Set(patinigErrors.map(r => r.questionValue))];
      
      errorAnalysis.patinig_errors = {
        count: patinigErrors.length,
        total: patinigResponses.length,
        percentage: Math.round((patinigErrors.length / patinigResponses.length) * 100),
        specific_letters: specificLetters,
        error_type: specificLetters.length > 2 ? 'visual_confusion' : 'specific_letter_difficulty',
        questionIds: patinigErrors.map(r => r.questionId)
      };
    }
    
    // Analyze katinig errors
    const katinigErrors = katinigResponses.filter(r => !r.isCorrect);
    if (katinigErrors.length > 0 && katinigResponses.length > 0) {
      const specificLetters = [...new Set(katinigErrors.map(r => r.questionValue))];
      const confusionPairs = ['B', 'P', 'D', 'T', 'M', 'N'];
      const hasConfusionPairs = specificLetters.some(letter => confusionPairs.includes(letter));
      
      errorAnalysis.katinig_errors = {
        count: katinigErrors.length,
        total: katinigResponses.length,
        percentage: Math.round((katinigErrors.length / katinigResponses.length) * 100),
        specific_letters: specificLetters,
        error_type: hasConfusionPairs ? 'sound_substitution' : 'general_difficulty',
        questionIds: katinigErrors.map(r => r.questionId)
      };
    }
    
    return errorAnalysis;
  }

  /**
   * Analyze Phonological Awareness errors
   * Focuses on matching errors with partial success analysis
   */
  analyzePhonologicalAwarenessErrors(responses) {
    const errorAnalysis = {};
    
    const incorrectMatches = responses.filter(r => !r.isCorrect);
    const totalResponses = responses.length;
    
    if (incorrectMatches.length > 0 && totalResponses > 0) {
      // Calculate average partial success rate for incorrect responses
      const partialSuccessRates = incorrectMatches
        .filter(r => r.totalMatches > 0)
        .map(r => r.correctMatches / r.totalMatches);
      
      const avgPartialSuccess = partialSuccessRates.length > 0 
        ? partialSuccessRates.reduce((sum, rate) => sum + rate, 0) / partialSuccessRates.length 
        : 0;
      
      // Determine error type based on partial success
      const errorType = avgPartialSuccess < 0.5 ? 'sound_discrimination' : 'sequencing';
      
      errorAnalysis.matching_errors = {
        count: incorrectMatches.length,
        total: totalResponses,
        percentage: Math.round((incorrectMatches.length / totalResponses) * 100),
        avg_partial_success: Math.round(avgPartialSuccess * 100) / 100,
        error_type: errorType,
        questionIds: incorrectMatches.map(r => r.questionId)
      };
      
      // Additional analysis: identify specific confusion patterns
      this.identifyPhonologicalConfusions(incorrectMatches, errorAnalysis);
    }
    
    return errorAnalysis;
  }

  /**
   * Identify specific phonological confusion patterns
   */
  identifyPhonologicalConfusions(incorrectResponses, errorAnalysis) {
    const confusions = {};
    
    incorrectResponses.forEach(response => {
      if (response.response && Array.isArray(response.response)) {
        response.response.forEach(pair => {
          if (typeof pair === 'object') {
            for (const [audio, selected] of Object.entries(pair)) {
              if (audio !== selected) {
                const confusionKey = `${audio}-${selected}`;
                confusions[confusionKey] = (confusions[confusionKey] || 0) + 1;
              }
            }
          }
        });
      }
    });
    
    // Add most common confusions to analysis
    const sortedConfusions = Object.entries(confusions)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 5); // Top 5 confusions
    
    if (sortedConfusions.length > 0) {
      errorAnalysis.matching_errors.common_confusions = sortedConfusions.map(([confusion, count]) => ({
        pattern: confusion,
        frequency: count
      }));
    }
  }

  /**
   * Analyze Decoding errors
   * Focuses on position-based errors and sequence patterns
   */
  analyzeDecodingErrors(responses) {
    const errorAnalysis = {};
    
    const incorrectDecoding = responses.filter(r => !r.isCorrect);
    const totalDecoding = responses.length;
    
    if (incorrectDecoding.length > 0 && totalDecoding > 0) {
      // Analyze blank positions for fill-in-the-blank type questions
      const blankPositions = incorrectDecoding
        .filter(r => typeof r.blankPosition === 'number')
        .map(r => r.blankPosition);
      
      const mostErrorPosition = blankPositions.length > 0 
        ? this.getMostFrequent(blankPositions) 
        : -1;
      
      // Determine error type
      const highErrorRate = (incorrectDecoding.length / totalDecoding) > 0.5;
      const errorType = highErrorRate ? 'letter_sequence' : 'specific_pattern';
      
      errorAnalysis.decoding_errors = {
        count: incorrectDecoding.length,
        total: totalDecoding,
        percentage: Math.round((incorrectDecoding.length / totalDecoding) * 100),
        error_type: errorType,
        most_error_position: mostErrorPosition,
        questionIds: incorrectDecoding.map(r => r.questionId)
      };
      
      // Additional analysis: sequence error patterns
      this.analyzeSequenceErrors(incorrectDecoding, errorAnalysis);
    }
    
    return errorAnalysis;
  }

  /**
   * Analyze sequence errors in decoding responses
   */
  analyzeSequenceErrors(incorrectResponses, errorAnalysis) {
    const sequenceAnalysis = {
      letter_reversals: 0,
      letter_omissions: 0,
      letter_additions: 0,
      sound_substitutions: 0
    };
    
    incorrectResponses.forEach(response => {
      if (response.response && Array.isArray(response.response)) {
        const userSequence = response.response;
        
        // Analyze common sequence error patterns
        if (userSequence.length < 4) {
          sequenceAnalysis.letter_omissions++;
        } else if (userSequence.length > 6) {
          sequenceAnalysis.letter_additions++;
        }
        
        // Check for common letter reversals (b/d, p/q)
        const reversalPairs = ['B', 'D', 'P', 'Q'];
        if (userSequence.some(letter => reversalPairs.includes(letter))) {
          sequenceAnalysis.letter_reversals++;
        }
      }
    });
    
    errorAnalysis.decoding_errors.sequence_analysis = sequenceAnalysis;
  }

  /**
   * Analyze Word Recognition errors
   * Separates sentence completion from rhyming errors
   */
  analyzeWordRecognitionErrors(responses) {
    const errorAnalysis = {};
    
    const incorrectWR = responses.filter(r => !r.isCorrect);
    const totalWR = responses.length;
    
    if (incorrectWR.length > 0 && totalWR > 0) {
      // Classify error types based on question text
      const sentenceErrors = incorrectWR.filter(r => 
        r.questionText && r.questionText.toLowerCase().includes('pangungusap')
      );
      const rhymeErrors = incorrectWR.filter(r => 
        r.questionText && r.questionText.toLowerCase().includes('kasing tunog')
      );
      
      const errorType = sentenceErrors.length > rhymeErrors.length 
        ? 'context_clues' 
        : 'phonological_awareness';
      
      errorAnalysis.word_errors = {
        count: incorrectWR.length,
        total: totalWR,
        percentage: Math.round((incorrectWR.length / totalWR) * 100),
        sentence_completion_errors: sentenceErrors.length,
        rhyming_errors: rhymeErrors.length,
        error_type: errorType,
        questionIds: incorrectWR.map(r => r.questionId)
      };
    }
    
    return errorAnalysis;
  }

  /**
   * Analyze Reading Comprehension errors
   */
  analyzeReadingComprehensionErrors(responses) {
    const errorAnalysis = {};
    
    const incorrectRC = responses.filter(r => !r.isCorrect);
    const totalRC = responses.length;
    
    if (incorrectRC.length > 0 && totalRC > 0) {
      errorAnalysis.comprehension_errors = {
        count: incorrectRC.length,
        total: totalRC,
        percentage: Math.round((incorrectRC.length / totalRC) * 100),
        error_type: 'literal_comprehension',
        questionIds: incorrectRC.map(r => r.questionId)
      };
      
      // Additional analysis could include:
      // - Question type analysis (who, what, where, when, why)
      // - Passage complexity analysis
      // - Response pattern analysis
    }
    
    return errorAnalysis;
  }

  /**
   * Helper function to find most frequent value in array
   */
  getMostFrequent(arr) {
    if (arr.length === 0) return -1;
    
    const frequency = {};
    let maxCount = 0;
    let mostFrequent = arr[0];
    
    arr.forEach(item => {
      frequency[item] = (frequency[item] || 0) + 1;
      if (frequency[item] > maxCount) {
        maxCount = frequency[item];
        mostFrequent = item;
      }
    });
    
    return mostFrequent;
  }

  /**
   * Analyze error trends over time for a student
   * 
   * @param {number} studentId - Student ID
   * @param {string} category - Category to analyze
   * @param {number} daysPast - Number of days to look back
   * @returns {Object} Trend analysis
   */
  async analyzeErrorTrends(studentId, category, daysPast = 30) {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - daysPast);
    
    const responses = await StudentResponse.find({
      studentId,
      category,
      answeredAt: { $gte: cutoffDate }
    }).sort({ answeredAt: 1 });
    
    // Group by day and calculate error rates
    const dailyErrorRates = {};
    responses.forEach(response => {
      const day = response.answeredAt.toISOString().split('T')[0];
      if (!dailyErrorRates[day]) {
        dailyErrorRates[day] = { total: 0, errors: 0 };
      }
      dailyErrorRates[day].total++;
      if (!response.isCorrect) {
        dailyErrorRates[day].errors++;
      }
    });
    
    // Calculate trend
    const days = Object.keys(dailyErrorRates).sort();
    const errorRates = days.map(day => 
      dailyErrorRates[day].errors / dailyErrorRates[day].total
    );
    
    return {
      trend: this.calculateTrend(errorRates),
      dailyData: days.map((day, index) => ({
        date: day,
        errorRate: errorRates[index],
        totalQuestions: dailyErrorRates[day].total
      }))
    };
  }

  /**
   * Calculate trend direction (improving/declining/stable)
   */
  calculateTrend(values) {
    if (values.length < 2) return 'insufficient_data';
    
    const firstHalf = values.slice(0, Math.floor(values.length / 2));
    const secondHalf = values.slice(Math.ceil(values.length / 2));
    
    const firstAvg = firstHalf.reduce((sum, val) => sum + val, 0) / firstHalf.length;
    const secondAvg = secondHalf.reduce((sum, val) => sum + val, 0) / secondHalf.length;
    
    const difference = secondAvg - firstAvg;
    
    if (Math.abs(difference) < 0.05) return 'stable';
    return difference > 0 ? 'declining' : 'improving';
  }
}

module.exports = new ErrorPatternService();