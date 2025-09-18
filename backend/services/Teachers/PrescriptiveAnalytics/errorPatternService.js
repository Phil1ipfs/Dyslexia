// Error Pattern Analysis Service for Prescriptive Analytics
// Analyzes student_responses to identify specific error patterns by category

const StudentResponse = require('../../../models/Teachers/ManageProgress/studentResponseModel');
const MainAssessment = require('../../../models/Teachers/mainAssessmentModel');

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
      console.log(`[ERROR PATTERN ANALYSIS] Starting analysis for student ${studentId}, categoryResultId: ${categoryResultId}`);

      // Fetch student responses for analysis
      const query = { studentId };
      if (categoryResultId) {
        query.categoryId = categoryResultId;
      }

      const responses = await StudentResponse.find(query).sort({ answeredAt: 1 });
      console.log(`[ERROR PATTERN ANALYSIS] Found ${responses.length} responses for student ${studentId}`);
      
      // Group responses by category
      const responsesByCategory = this.groupResponsesByCategory(responses);
      
      const errorPatterns = {};
      
      // Analyze each category
      for (const [category, categoryResponses] of Object.entries(responsesByCategory)) {
        switch (category) {
          case 'Alphabet Knowledge':
            errorPatterns[category] = await this.analyzeAlphabetKnowledgeErrors(categoryResponses);
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
  async analyzeAlphabetKnowledgeErrors(responses) {
    const errorAnalysis = {};

    // Get question details from main_assessment to map questionId to questionValue
    const questionIds = responses.map(r => r.questionId);
    const assessmentQuestions = await MainAssessment.find({
      category: 'Alphabet Knowledge',
      'questions.questionId': { $in: questionIds }
    });

    // Create mapping from questionId to questionValue
    const questionValueMap = {};
    assessmentQuestions.forEach(assessment => {
      assessment.questions.forEach(question => {
        if (questionIds.includes(question.questionId)) {
          questionValueMap[question.questionId] = question.questionValue;
        }
      });
    });

    // Add questionValue to responses for analysis
    const enhancedResponses = responses.map(r => ({
      ...r.toObject(),
      questionValue: questionValueMap[r.questionId]
    }));

    // Separate patinig and katinig responses based on questionValue
    const patinigLetters = ['A', 'E', 'I', 'O', 'U'];

    // Helper function to determine if questionValue represents a vowel concept
    const isVowelValue = (value) => {
      if (!value) return false;
      const upperValue = value.toUpperCase();
      // Check if it's a single vowel letter
      if (upperValue.length === 1 && patinigLetters.includes(upperValue)) {
        return true;
      }
      // Check if it's a word that starts with a vowel (common for vowel teaching)
      if (upperValue.length > 1 && patinigLetters.includes(upperValue.charAt(0))) {
        return true;
      }
      return false;
    };

    const patinigResponses = enhancedResponses.filter(r => r.questionValue && isVowelValue(r.questionValue));
    const katinigResponses = enhancedResponses.filter(r => r.questionValue && !isVowelValue(r.questionValue));
    
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
        questionIds: patinigErrors.map(r => r.questionId),
        researchClassification: specificLetters.length > 2 ?
          'Multiple vowel confusion - potential visual processing difficulty' :
          'Specific vowel deficit - targeted intervention needed',
        interventionFocus: 'Visual-auditory vowel discrimination with multisensory support',
        cognitiveImplications: {
          workingMemory: specificLetters.length > 3 ? 'High load - may indicate working memory limitations' : 'Manageable load',
          visualProcessing: specificLetters.length > 2 ? 'Visual discrimination difficulties evident' : 'Specific visual pattern issue',
          auditoryProcessing: 'Cross-modal letter-sound integration challenges',
          attentionFactors: patinigErrors.length > patinigResponses.length * 0.7 ? 'High error rate suggests attention or processing issues' : 'Within expected range'
        }
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
        questionIds: katinigErrors.map(r => r.questionId),
        researchClassification: hasConfusionPairs ?
          'Phonological confusion patterns - sound substitution difficulties' :
          'General consonant processing deficit',
        interventionFocus: hasConfusionPairs ?
          'Phoneme discrimination training with articulatory awareness' :
          'Systematic consonant-sound correspondence building',
        cognitiveImplications: {
          workingMemory: specificLetters.length > 5 ? 'Overloaded - reduce cognitive demands' : 'Manageable processing load',
          auditoryProcessing: hasConfusionPairs ? 'Phoneme discrimination difficulties - requires intensive auditory training' : 'General auditory processing support needed',
          visualStrengths: 'Can leverage visual cues and mouth position images',
          attentionFactors: katinigErrors.length > katinigResponses.length * 0.6 ? 'High error rate - consider attention regulation strategies' : 'Attention within normal range'
        },
        confusionPairAnalysis: hasConfusionPairs ? {
          commonPairs: specificLetters.filter(letter => confusionPairs.includes(letter)),
          linguisticBasis: 'Similar place or manner of articulation',
          interventionPriority: 'Address most frequent confusions first'
        } : null
      };
    }

    // Create detailed error analysis array
    const detailedErrorAnalysis = [];

    // Add detailed analysis for each wrong question
    const allErrors = [...(patinigErrors || []), ...(katinigErrors || [])];
    allErrors.forEach(errorResponse => {
      const isVowel = patinigLetters.includes(errorResponse.questionValue?.toUpperCase());
      detailedErrorAnalysis.push({
        questionId: errorResponse.questionId,
        letter: errorResponse.questionValue,
        letterType: isVowel ? 'vowel' : 'consonant',
        errorType: isVowel ? 'vowel_recognition_error' : 'consonant_recognition_error',
        specificError: `Failed to recognize letter "${errorResponse.questionValue}"`,
        interventionTarget: errorResponse.questionValue,
        cognitiveImplication: isVowel ?
          'Visual-auditory vowel processing difficulty' :
          'Consonant-sound correspondence weakness',
        // Required fields for validation
        errorPattern: isVowel ?
          `Vowel recognition difficulty with ${errorResponse.questionValue}` :
          `Consonant recognition difficulty with ${errorResponse.questionValue}`,
        interventionFocus: isVowel ?
          `Vowel discrimination training for ${errorResponse.questionValue}` :
          `Consonant-sound correspondence practice for ${errorResponse.questionValue}`
      });
    });

    errorAnalysis.detailedErrorAnalysis = detailedErrorAnalysis;

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
        questionIds: incorrectMatches.map(r => r.questionId),
        cognitiveImplications: {
          workingMemory: avgPartialSuccess < 0.3 ? 'Severe working memory limitations - reduce sequence length' :
                        avgPartialSuccess < 0.6 ? 'Moderate working memory challenges - provide support' :
                        'Working memory within functional range',
          auditoryProcessing: errorType === 'sound_discrimination' ?
                            'Significant auditory discrimination deficits - intensive training needed' :
                            'Sequential auditory processing difficulties',
          visualStrengths: 'Can benefit from visual cues and mouth position images',
          attentionFactors: incorrectMatches.length > totalResponses * 0.75 ?
                          'High error rate suggests attention regulation difficulties' :
                          'Attention appears adequate for task demands'
        },
        sequentialDifficulty: this.analyzeSequentialProcessing(incorrectMatches),
        confusionPairs: [], // Will be populated by identifyPhonologicalConfusions
        researchClassification: errorType === 'sound_discrimination' ?
          'Phonological processing deficit - core difficulty with sound-symbol mapping' :
          'Sequential phonological processing challenge - working memory involved'
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

      // Update confusion pairs in the main error analysis
      errorAnalysis.matching_errors.confusionPairs = sortedConfusions.map(([confusion, count]) => {
        const [sound1, sound2] = confusion.split('-');
        return {
          sounds: [sound1, sound2],
          confusionRate: Math.round((count / incorrectResponses.length) * 100),
          articulatoryBasis: this.getArticulatoryBasis(sound1, sound2),
          interventionFocus: `Focus on ${sound1}-${sound2} discrimination with mouth position awareness`
        };
      });
    }
  }

  /**
   * Analyze sequential processing difficulties in phonological awareness
   * Examines how sequence length affects performance
   */
  analyzeSequentialProcessing(incorrectResponses) {
    const sequenceLengthAnalysis = {
      twoSounds: { total: 0, correct: 0, percentage: 0 },
      threeSounds: { total: 0, correct: 0, percentage: 0 },
      fourSounds: { total: 0, correct: 0, percentage: 0 },
      averageSuccessByLength: {}
    };

    incorrectResponses.forEach(response => {
      if (response.totalMatches) {
        const sequenceLength = response.totalMatches;
        const successRate = response.correctMatches / response.totalMatches;

        if (sequenceLength === 2) {
          sequenceLengthAnalysis.twoSounds.total++;
          sequenceLengthAnalysis.twoSounds.correct += response.correctMatches;
        } else if (sequenceLength === 3) {
          sequenceLengthAnalysis.threeSounds.total++;
          sequenceLengthAnalysis.threeSounds.correct += response.correctMatches;
        } else if (sequenceLength === 4) {
          sequenceLengthAnalysis.fourSounds.total++;
          sequenceLengthAnalysis.fourSounds.correct += response.correctMatches;
        }

        sequenceLengthAnalysis.averageSuccessByLength[sequenceLength] =
          sequenceLengthAnalysis.averageSuccessByLength[sequenceLength] || [];
        sequenceLengthAnalysis.averageSuccessByLength[sequenceLength].push(successRate);
      }
    });

    // Calculate percentages
    if (sequenceLengthAnalysis.twoSounds.total > 0) {
      sequenceLengthAnalysis.twoSounds.percentage =
        Math.round((sequenceLengthAnalysis.twoSounds.correct / (sequenceLengthAnalysis.twoSounds.total * 2)) * 100);
    }
    if (sequenceLengthAnalysis.threeSounds.total > 0) {
      sequenceLengthAnalysis.threeSounds.percentage =
        Math.round((sequenceLengthAnalysis.threeSounds.correct / (sequenceLengthAnalysis.threeSounds.total * 3)) * 100);
    }
    if (sequenceLengthAnalysis.fourSounds.total > 0) {
      sequenceLengthAnalysis.fourSounds.percentage =
        Math.round((sequenceLengthAnalysis.fourSounds.correct / (sequenceLengthAnalysis.fourSounds.total * 4)) * 100);
    }

    // Return only percentage numbers as required by schema
    return {
      twoSounds: sequenceLengthAnalysis.twoSounds.percentage,
      threeSounds: sequenceLengthAnalysis.threeSounds.percentage,
      fourSounds: sequenceLengthAnalysis.fourSounds.percentage,
      workingMemoryCapacity: sequenceLengthAnalysis.twoSounds.percentage > 80 ? 'adequate' : 'limited'
    };
  }

  /**
   * Get articulatory basis for sound confusions
   */
  getArticulatoryBasis(sound1, sound2) {
    const articularityMap = {
      'B-P': 'Same place of articulation (bilabial), differ only in voicing',
      'D-T': 'Same place of articulation (alveolar), differ only in voicing',
      'M-N': 'Both nasal sounds, differ in place of articulation',
      'G-K': 'Same place of articulation (velar), differ only in voicing',
      'F-V': 'Same place of articulation (labiodental), differ only in voicing'
    };

    const key = `${sound1}-${sound2}`;
    const reverseKey = `${sound2}-${sound1}`;

    return articularityMap[key] || articularityMap[reverseKey] || 'Similar phonetic characteristics requiring discrimination practice';
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