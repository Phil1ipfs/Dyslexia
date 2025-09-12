const mongoose = require('mongoose');
const PrescriptiveAnalysis = require('../../models/Teachers/ManageProgress/prescriptiveAnalysisModel');
const InterventionAssessment = require('../../models/Teachers/ManageProgress/interventionAssessmentModel');
const InterventionResponse = require('../../models/Teachers/ManageProgress/interventionResponseModel');
const InterventionResults = require('../../models/Teachers/ManageProgress/interventionResultsModel');
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

      // Generate exactly 10 questions based on error patterns and focus areas
      const questions = await this.generateAdaptiveQuestions(
        category,
        analysis.readingLevel,
        errorPatterns,
        interventionPlan,
        analysis.abilityEstimates.get ? analysis.abilityEstimates.get(category) : analysis.abilityEstimates[category] || 0
      );

      // Create intervention assessment
      const interventionData = {
        studentId: analysis.studentId,
        prescriptiveAnalysisId: analysisId,
        category,
        readingLevel: analysis.readingLevel,
        passThreshold: 75,
        questionSelectionStrategy: strategy,
        totalQuestions: 10, // Fixed for one-time intervention
        questions,
        interventionParameters: {
          fixedQuestions: 10,
          allowSkip: false,
          showProgress: true,
          immediateFeeback: false
        },
        status: 'active',
        createdAt: new Date(),
        updatedAt: new Date()
      };

      const intervention = new InterventionAssessment(interventionData);
      await intervention.save();

      console.log(`[INTERVENTION GENERATOR] Generated intervention ${intervention._id} with ${questions.length} questions`);

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
   * Generate exactly 10 adaptive questions for intervention
   * @param {string} category - Category name
   * @param {string} readingLevel - Student's reading level
   * @param {Object} errorPatterns - Error patterns
   * @param {Object} interventionPlan - Intervention plan
   * @param {number} abilityEstimate - Student's ability estimate
   * @returns {Array} Array of 10 questions
   */
  async generateAdaptiveQuestions(category, readingLevel, errorPatterns, interventionPlan, abilityEstimate) {
    const questions = [];

    switch (category) {
      case 'Alphabet Knowledge':
        return this.generateAlphabetKnowledgeQuestions(errorPatterns, interventionPlan, abilityEstimate);
      
      case 'Phonological Awareness':
        return this.generatePhonologicalAwarenessQuestions(errorPatterns, interventionPlan, abilityEstimate);
      
      case 'Decoding':
        return this.generateDecodingQuestions(errorPatterns, interventionPlan, abilityEstimate);
      
      case 'Word Recognition':
        return this.generateWordRecognitionQuestions(errorPatterns, interventionPlan, abilityEstimate);
      
      case 'Reading Comprehension':
        return this.generateReadingComprehensionQuestions(readingLevel, interventionPlan, abilityEstimate);
      
      default:
        throw new Error(`Unsupported category for intervention: ${category}`);
    }
  }

  /**
   * Generate Alphabet Knowledge intervention questions
   * @param {Object} errorPatterns - Error patterns
   * @param {Object} interventionPlan - Intervention plan
   * @param {number} abilityEstimate - Ability estimate
   * @returns {Array} 10 questions
   */
  generateAlphabetKnowledgeQuestions(errorPatterns, interventionPlan, abilityEstimate) {
    const questions = [];
    const distribution = interventionPlan.questionDistribution || { patinig: 50, katinig: 50 };
    
    // Calculate number of each type
    const patinigCount = Math.round(10 * (distribution.patinig / 100));
    const katinigCount = 10 - patinigCount;

    // Get target letters from error patterns or intervention plan
    const targetPatinig = this.getTargetPatinigLetters(errorPatterns, interventionPlan);
    const targetKatinig = this.getTargetKatinigLetters(errorPatterns, interventionPlan);

    // Generate patinig questions
    for (let i = 0; i < patinigCount; i++) {
      const letter = targetPatinig[i % targetPatinig.length];
      questions.push({
        questionId: `q_ak_int_patinig_${i + 1}`,
        source: 'custom',
        questionType: 'multiple_choice',
        questionText: 'Anong ang katumbas na maliit na letra?',
        questionImage: this.generateS3ImageUrl('alphabet-knowledge', `big-${letter}.png`),
        questionValue: letter,
        choiceOptions: this.generateAlphabetChoices(letter, 'patinig', abilityEstimate),
        difficulty: this.calculateQuestionDifficulty(abilityEstimate, i, 10),
        discrimination: 1.2,
        targetSkill: 'patinig_recognition',
        targetElement: letter
      });
    }

    // Generate katinig questions
    for (let i = 0; i < katinigCount; i++) {
      const letter = targetKatinig[i % targetKatinig.length];
      questions.push({
        questionId: `q_ak_int_katinig_${i + 1}`,
        source: 'custom',
        questionType: 'multiple_choice',
        questionText: 'Anong ang katumbas na maliit na letra?',
        questionImage: this.generateS3ImageUrl('alphabet-knowledge', `big-${letter}.png`),
        questionValue: letter,
        choiceOptions: this.generateAlphabetChoices(letter, 'katinig', abilityEstimate),
        difficulty: this.calculateQuestionDifficulty(abilityEstimate, i + patinigCount, 10),
        discrimination: 1.2,
        targetSkill: 'katinig_recognition',
        targetElement: letter
      });
    }

    return questions.slice(0, 10); // Ensure exactly 10 questions
  }

  /**
   * Generate Phonological Awareness intervention questions
   * @param {Object} errorPatterns - Error patterns
   * @param {Object} interventionPlan - Intervention plan
   * @param {number} abilityEstimate - Ability estimate
   * @returns {Array} 10 questions
   */
  generatePhonologicalAwarenessQuestions(errorPatterns, interventionPlan, abilityEstimate) {
    const questions = [];
    const targetSounds = interventionPlan.targetSounds || ['B-P', 'M-N', 'D-T', 'L-R'];

    // All questions are matching type for PA
    for (let i = 0; i < 10; i++) {
      const soundSet = this.getPhonologicalSoundSet(targetSounds, i, abilityEstimate);
      
      questions.push({
        questionId: `q_pa_int_${i + 1}`,
        source: 'custom',
        questionType: 'malapantig',
        questionText: 'Pakinggan ang letra sa audio. Itugma ito sa katumbas na letra.',
        questionSet: {
          audioTexts: soundSet.audioTexts,
          matchingOptions: soundSet.matchingOptions,
          correctPairs: soundSet.correctPairs
        },
        difficulty: this.calculateQuestionDifficulty(abilityEstimate, i, 10),
        discrimination: 1.1,
        targetSkill: 'sound_discrimination',
        targetElement: soundSet.confusionPair
      });
    }

    return questions;
  }

  /**
   * Generate Decoding intervention questions
   * @param {Object} errorPatterns - Error patterns
   * @param {Object} interventionPlan - Intervention plan
   * @param {number} abilityEstimate - Ability estimate
   * @returns {Array} 10 questions
   */
  generateDecodingQuestions(errorPatterns, interventionPlan, abilityEstimate) {
    const questions = [];
    const targetPatterns = interventionPlan.targetPatterns || ['CVC', 'CVCV'];
    const focus = interventionPlan.focus || 'initial_sounds';

    const wordList = this.getDecodingWords(targetPatterns, focus, abilityEstimate);

    for (let i = 0; i < 10; i++) {
      const word = wordList[i % wordList.length];
      const questionData = this.createDecodingQuestion(word, focus, i);
      
      questions.push({
        questionId: `q_dc_int_${i + 1}`,
        source: 'custom',
        questionType: 'drag_drop',
        questionText: questionData.questionText,
        questionImage: questionData.questionImage,
        displaySequence: questionData.displaySequence,
        dragElements: questionData.dragElements,
        correctSequence: questionData.correctSequence,
        blankPosition: questionData.blankPosition,
        difficulty: this.calculateQuestionDifficulty(abilityEstimate, i, 10),
        discrimination: 1.0,
        targetSkill: 'decoding',
        targetElement: word.toUpperCase()
      });
    }

    return questions;
  }

  /**
   * Generate Word Recognition intervention questions
   * @param {Object} errorPatterns - Error patterns
   * @param {Object} interventionPlan - Intervention plan
   * @param {number} abilityEstimate - Ability estimate
   * @returns {Array} 10 questions
   */
  generateWordRecognitionQuestions(errorPatterns, interventionPlan, abilityEstimate) {
    const questions = [];
    const distribution = interventionPlan.questionDistribution || { sentence_completion: 60, rhyming: 40 };
    
    const sentenceCount = Math.round(10 * (distribution.sentence_completion / 100));
    const rhymingCount = 10 - sentenceCount;

    // Generate sentence completion questions
    for (let i = 0; i < sentenceCount; i++) {
      const sentenceData = this.getSentenceCompletionData(i, abilityEstimate);
      
      questions.push({
        questionId: `q_wr_int_sentence_${i + 1}`,
        source: 'custom',
        questionType: 'fill_blank',
        questionText: 'Basahin ang pangungusap. Piliin ang tamang salita mula sa hanay.',
        displayWord: sentenceData.sentence,
        blankOptions: sentenceData.options,
        correctAnswer: sentenceData.correctAnswer,
        difficulty: this.calculateQuestionDifficulty(abilityEstimate, i, 10),
        discrimination: 1.1,
        targetSkill: 'sentence_context',
        targetElement: sentenceData.correctAnswer[0]
      });
    }

    // Generate rhyming questions
    for (let i = 0; i < rhymingCount; i++) {
      const rhymingData = this.getRhymingData(i, abilityEstimate);
      
      questions.push({
        questionId: `q_wr_int_rhyme_${i + 1}`,
        source: 'custom',
        questionType: 'fill_blank',
        questionText: 'Anong kasing tunog ng salitang nakikita?',
        questionImage: rhymingData.image,
        displayWord: rhymingData.word,
        blankOptions: rhymingData.options,
        correctAnswer: rhymingData.correctAnswer,
        difficulty: this.calculateQuestionDifficulty(abilityEstimate, i + sentenceCount, 10),
        discrimination: 1.0,
        targetSkill: 'rhyming_words',
        targetElement: rhymingData.word
      });
    }

    return questions;
  }

  /**
   * Generate Reading Comprehension intervention questions
   * @param {string} readingLevel - Reading level
   * @param {Object} interventionPlan - Intervention plan
   * @param {number} abilityEstimate - Ability estimate
   * @returns {Array} 10 questions (structured as passages with multiple sentence questions each)
   */
  generateReadingComprehensionQuestions(readingLevel, interventionPlan, abilityEstimate) {
    const questions = [];
    
    // Get reading comprehension passages based on reading level
    const passages = this.getReadingComprehensionPassages(readingLevel, abilityEstimate);
    
    let questionIndex = 1;
    
    // Each passage becomes one question object with multiple sentence questions
    for (const passage of passages) {
      if (questionIndex > 10) break;
      
      questions.push({
        questionId: `q_rc_int_${questionIndex}`,
        source: 'custom',
        questionType: 'text_input',
        storyTitle: passage.storyTitle,
        passages: passage.passages,
        sentenceQuestions: passage.sentenceQuestions, // All sentence questions for this passage
        questionValue: null,
        difficulty: this.calculateQuestionDifficulty(abilityEstimate, questionIndex - 1, 10),
        discrimination: 0.9,
        targetSkill: 'literal_comprehension',
        targetElement: passage.storyTitle
      });
      
      questionIndex++;
    }

    // If we don't have enough passages to make 10 questions, 
    // we can duplicate some passages with slight variations
    while (questions.length < 10 && passages.length > 0) {
      const passage = passages[questions.length % passages.length];
      
      questions.push({
        questionId: `q_rc_int_${questions.length + 1}`,
        source: 'custom',
        questionType: 'text_input',
        storyTitle: `${passage.storyTitle} - Part ${Math.floor(questions.length / passages.length) + 1}`,
        passages: passage.passages,
        sentenceQuestions: passage.sentenceQuestions,
        questionValue: null,
        difficulty: this.calculateQuestionDifficulty(abilityEstimate, questions.length, 10),
        discrimination: 0.9,
        targetSkill: 'literal_comprehension',
        targetElement: passage.storyTitle
      });
    }

    return questions.slice(0, 10);
  }

  // Helper methods

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
            pageText: 'Si Ana ay may maliit na aso na si Brownie.',
            pageImage: this.generateS3ImageUrl('reading-comprehension', 'Si-Ana-at-ang-Aso-1.png')
          },
          {
            pageNumber: 2,
            pageText: 'Tuwing umaga, naglalaro sila sa hardin.',
            pageImage: this.generateS3ImageUrl('reading-comprehension', 'Si-Ana-at-ang-Aso-2.png')
          }
        ],
        sentenceQuestions: [
          { questionText: 'Sino ang may aso?', correctAnswer: 'Ana', acceptableAnswers: ['Ana', 'si Ana'] },
          { questionText: 'Ano ang pangalan ng aso?', correctAnswer: 'Brownie', acceptableAnswers: ['Brownie'] },
          { questionText: 'Saan sila naglalaro?', correctAnswer: 'hardin', acceptableAnswers: ['hardin', 'sa hardin'] }
        ]
      },
      {
        storyTitle: 'Ang Matalinong Langaw',
        passages: [
          {
            pageNumber: 1,
            pageText: 'May isang langaw na nahulog sa tubig.',
            pageImage: this.generateS3ImageUrl('reading-comprehension', 'Ang-Matalinong-Langaw-1.png')
          }
        ],
        sentenceQuestions: [
          { questionText: 'Sino ang nahulog sa tubig?', correctAnswer: 'langaw', acceptableAnswers: ['langaw', 'isang langaw'] },
          { questionText: 'Saan nahulog ang langaw?', correctAnswer: 'tubig', acceptableAnswers: ['tubig', 'sa tubig'] }
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