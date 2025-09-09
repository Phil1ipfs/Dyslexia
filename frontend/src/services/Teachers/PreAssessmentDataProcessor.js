/**
 * PreAssessmentDataProcessor - Service for processing pre-assessment data
 * Handles matching student responses with questions and correct answers
 */

// Pre-assessment questions data (from CLAUDE.md)
const PRE_ASSESSMENT_QUESTIONS = {
  "AK_001": {
    questionId: "AK_001",
    category: "Alphabet Knowledge",
    questionType: "patinig",
    questionText: "Anong ang katumbas na maliit na letra?",
    questionValue: "E",
    questionImage: "https://literexia-bucket.s3.ap-southeast-2.amazonaws.com/pre-assessment/image/1757026946462-ux19b3b5qth.png",
    difficultyLevel: "low_emerging",
    options: [
      { optionId: "1", optionText: "a", isCorrect: false },
      { optionId: "2", optionText: "e", isCorrect: true },
      { optionId: "3", optionText: "c", isCorrect: false }
    ],
    correctAnswer: "2"
  },
  "AK_002": {
    questionId: "AK_002",
    category: "Alphabet Knowledge", 
    questionType: "patinig",
    questionText: "Anong ang katumbas na maliit na letra?",
    questionValue: "O",
    questionImage: "https://literexia-bucket.s3.ap-southeast-2.amazonaws.com/pre-assessment/image/1757026961201-l8mzg7m0f4.png",
    difficultyLevel: "low_emerging",
    options: [
      { optionId: "1", optionText: "o", isCorrect: true },
      { optionId: "2", optionText: "u", isCorrect: false },
      { optionId: "3", optionText: "j", isCorrect: false }
    ],
    correctAnswer: "1"
  },
  "AK_003": {
    questionId: "AK_003",
    category: "Alphabet Knowledge",
    questionType: "katinig", 
    questionText: "Anong ang katumbas na maliit na letra?",
    questionValue: "B",
    questionImage: "https://literexia-bucket.s3.ap-southeast-2.amazonaws.com/pre-assessment/image/1757026868015-luedcqnf75a.png",
    difficultyLevel: "low_emerging",
    options: [
      { optionId: "1", optionText: "d", isCorrect: false },
      { optionId: "2", optionText: "i", isCorrect: false },
      { optionId: "3", optionText: "b", isCorrect: true }
    ],
    correctAnswer: "3"
  },
  "AK_004": {
    questionId: "AK_004",
    category: "Alphabet Knowledge",
    questionType: "patinig",
    questionText: "Anong ang katumbas na malaking na letra?",
    questionValue: "u",
    questionImage: "https://literexia-bucket.s3.ap-southeast-2.amazonaws.com/pre-assessment/image/1757026934967-invu7gnr6bp.png",
    difficultyLevel: "low_emerging",
    options: [
      { optionId: "1", optionText: "U", isCorrect: true },
      { optionId: "2", optionText: "E", isCorrect: false },
      { optionId: "3", optionText: "V", isCorrect: false }
    ],
    correctAnswer: "1"
  },
  "AK_005": {
    questionId: "AK_005",
    category: "Alphabet Knowledge",
    questionType: "katinig",
    questionText: "Anong ang katumbas na malaking letra?",
    questionValue: "d",
    questionImage: "https://literexia-bucket.s3.ap-southeast-2.amazonaws.com/pre-assessment/image/1757027023463-xnmaziiecf.png",
    difficultyLevel: "low_emerging",
    options: [
      { optionId: "1", optionText: "W", isCorrect: false },
      { optionId: "2", optionText: "D", isCorrect: true },
      { optionId: "3", optionText: "B", isCorrect: false }
    ],
    correctAnswer: "2"
  },
  "AK_006": {
    questionId: "AK_006",
    category: "Alphabet Knowledge",
    questionType: "katinig",
    questionText: "Anong ang katumbas na malaking letra?",
    questionValue: "k",
    questionImage: "https://literexia-bucket.s3.ap-southeast-2.amazonaws.com/pre-assessment/image/1757027068340-mumkmlhynp.png",
    difficultyLevel: "low_emerging",
    options: [
      { optionId: "1", optionText: "F", isCorrect: false },
      { optionId: "2", optionText: "U", isCorrect: false },
      { optionId: "3", optionText: "K", isCorrect: true }
    ],
    correctAnswer: "3"
  },
  "AK_007": {
    questionId: "AK_007",
    category: "Alphabet Knowledge",
    questionType: "patinig",
    questionText: "Anong tunog ng letra?",
    questionValue: "A",
    questionImage: "https://literexia-bucket.s3.ap-southeast-2.amazonaws.com/pre-assessment/image/1757027113796-rilnwh43xmp.png",
    difficultyLevel: "low_emerging",
    options: [
      { optionId: "1", optionText: "/geh/", isCorrect: false },
      { optionId: "2", optionText: "/ey/", isCorrect: true },
      { optionId: "3", optionText: "/ee/", isCorrect: false }
    ],
    correctAnswer: "2"
  },
  "AK_008": {
    questionId: "AK_008",
    category: "Alphabet Knowledge",
    questionType: "katinig",
    questionText: "Anong tunog ng letra?",
    questionValue: "R",
    questionImage: "https://literexia-bucket.s3.ap-southeast-2.amazonaws.com/pre-assessment/image/1757027156158-6qa209rpjyx.png",
    difficultyLevel: "low_emerging",
    options: [
      { optionId: "1", optionText: "/ar/", isCorrect: true },
      { optionId: "2", optionText: "/es/", isCorrect: false },
      { optionId: "3", optionText: "/beh/", isCorrect: false }
    ],
    correctAnswer: "1"
  },
  "AK_009": {
    questionId: "AK_009",
    category: "Alphabet Knowledge",
    questionType: "katinig",
    questionText: "Anong tunog ng letra?",
    questionValue: "S",
    questionImage: "https://literexia-bucket.s3.ap-southeast-2.amazonaws.com/pre-assessment/image/1757027203742-5y69maht04p.png",
    difficultyLevel: "low_emerging",
    options: [
      { optionId: "1", optionText: "/ar/", isCorrect: false },
      { optionId: "2", optionText: "/the/", isCorrect: false },
      { optionId: "3", optionText: "/es/", isCorrect: true }
    ],
    correctAnswer: "3"
  },
  "AK_010": {
    questionId: "AK_010",
    category: "Alphabet Knowledge",
    questionType: "patinig",
    questionText: "Tukuyin ang letra kung Patinig, Katinig o Malapantig",
    questionValue: "I",
    questionImage: "https://literexia-bucket.s3.ap-southeast-2.amazonaws.com/pre-assessment/image/1757027279488-v9ijrp0t7r.png",
    difficultyLevel: "low_emerging",
    options: [
      { optionId: "1", optionText: "Patinig", isCorrect: true },
      { optionId: "2", optionText: "Katinig", isCorrect: false },
      { optionId: "3", optionText: "Malapantig", isCorrect: false }
    ],
    correctAnswer: "1"
  },
  "PA_001": {
    questionId: "PA_001",
    category: "Phonological Awareness",
    questionType: "malapantig",
    questionText: "Pakinggan ang letra sa audio. Itugma ito sa katumbas na letra sa kabilang hanay",
    questionValue: null,
    questionImage: null,
    difficultyLevel: "high_emerging",
    questionSet: {
      audioTexts: ["H", "T", "N", "L", "P"],
      matchingOptions: ["Hh", "Tt", "Nn", "Ll", "Pp"],
      correctPairs: [
        { audio: "H", match: "Hh" },
        { audio: "T", match: "Tt" },
        { audio: "N", match: "Nn" },
        { audio: "L", match: "Ll" },
        { audio: "P", match: "Pp" }
      ]
    }
  },
  "PA_002": {
    questionId: "PA_002",
    category: "Phonological Awareness",
    questionType: "malapantig",
    questionText: "Pakinggan ang salita sa audio. Itugma ito sa katumbas na salita sa kabilang hanay.",
    questionImage: null,
    difficultyLevel: "high_emerging",
    questionSet: {
      audioTexts: ["DAGA", "ILAW", "MATA", "PUNO", "RELO"],
      matchingOptions: ["Daga", "Ilaw", "Mata", "Puno", "Relo"],
      correctPairs: [
        { audio: "DAGA", match: "Daga" },
        { audio: "ILAW", match: "Ilaw" },
        { audio: "MATA", match: "Mata" },
        { audio: "PUNO", match: "Puno" },
        { audio: "RELO", match: "Relo" }
      ]
    }
  },
  "DC_001": {
    questionId: "DC_001",
    category: "Decoding",
    questionType: "decode",
    questionText: "Tukuyin ang nasa larawan?",
    questionValue: null,
    questionImage: "https://literexia-bucket.s3.ap-southeast-2.amazonaws.com/pre-assessment/image/1757029227985-d5xxu50j1y.png",
    difficultyLevel: "developing",
    dragElements: ["Y", "e", "l", "o", "A", "I"],
    correctSequence: ["Y", "e", "l", "o"]
  },
  "DC_002": {
    questionId: "DC_002",
    category: "Decoding", 
    questionType: "decode",
    questionText: "Tukuyin ang nasa larawan?",
    questionValue: null,
    questionImage: "https://literexia-bucket.s3.ap-southeast-2.amazonaws.com/pre-assessment/image/1757029273136-nqrf90xxoh.png",
    difficultyLevel: "developing",
    dragElements: ["A", "r", "a", "w", "R", "W"],
    correctSequence: ["A", "r", "a", "w"]
  },
  "WR_001": {
    questionId: "WR_001",
    category: "Word Recognition",
    questionType: "word",
    questionText: "Basahin ang pangungusap. Piliin ang tamang salita mula sa hanay.",
    questionValue: null,
    questionImage: null,
    difficultyLevel: "transitioning",
    displayWord: "Naglalaro siya ng ___ sa parke",
    blankOptions: ["BOLA", "KUTSARA", "PAPEL", "DAMIT"],
    correctAnswer: ["BOLA"]
  },
  "WR_002": {
    questionId: "WR_002", 
    category: "Word Recognition",
    questionType: "word",
    questionText: "Basahin ang pangungusap. Piliin ang tamang salita mula sa hanay.",
    questionValue: null,
    questionImage: null,
    difficultyLevel: "transitioning",
    displayWord: "Malaki ang ___ sa zoo",
    blankOptions: ["ELEPANTE", "LAMESA", "NANAY", "MANOK"],
    correctAnswer: ["ELEPANTE"]
  },
  "RC_001": {
    questionId: "RC_001",
    category: "Reading Comprehension",
    questionType: "sentence", 
    questionValue: null,
    questionImage: null,
    difficultyLevel: "at_grade_level",
    passages: [
      {
        pageNumber: 1,
        pageText: "Tuwing umaga, si Juan at ang kaniyang aso na si Max ay naglalaro sa Parke",
        pageImage: "https://literexia-bucket.s3.ap-southeast-2.amazonaws.com/pre-assessment/image/1757031431002-pd431brj7oo.png"
      },
      {
        pageNumber: 2, 
        pageText: "Paboritong habulin ni Max ang bola na inihahagis ni Juan.",
        pageImage: "https://literexia-bucket.s3.ap-southeast-2.amazonaws.com/pre-assessment/image/1757031432394-slk98m6h5b.png"
      },
      {
        pageNumber: 3,
        pageText: "Silang dalawa ay masayang uuwi ng tahanan",
        pageImage: "https://literexia-bucket.s3.ap-southeast-2.amazonaws.com/pre-assessment/image/1757031433286-zvtteh7c5h.png"
      }
    ],
    sentenceQuestions: [
      {
        questionText: "Sino ang may aso?",
        correctAnswer: "Juan",
        acceptableAnswers: ["Si juan", "juan", "si juan"]
      },
      {
        questionText: "Saan naglaro si Juan at Max?",
        correctAnswer: "Parke", 
        acceptableAnswers: ["Sa parke", "sa parke"]
      },
      {
        questionText: "Ano ang ginagawa ni Juan at Max?",
        correctAnswer: "Naglalaro",
        acceptableAnswers: ["naglalaro", "naglaro", "naglaro"]
      }
    ]
  },
  "RC_002": {
    questionId: "RC_002",
    category: "Reading Comprehension",
    questionType: "sentence",
    questionValue: null,
    questionImage: null, 
    difficultyLevel: "at_grade_level",
    passages: [
      {
        pageNumber: 1,
        pageText: "Si Maria ay may puno ng mangga sa kanilang bakuran",
        pageImage: "https://literexia-bucket.s3.ap-southeast-2.amazonaws.com/pre-assessment/image/1757031779544-g731d7bqoyt.png"
      },
      {
        pageNumber: 2,
        pageText: "Tuwing tag-init, nangunguha siya ng mangga. Ang mga mangga ay matamis at kulay dilaw.",
        pageImage: "https://literexia-bucket.s3.ap-southeast-2.amazonaws.com/pre-assessment/image/1757031781082-n52iycewcz.png"
      },
      {
        pageNumber: 3,
        pageText: "Si Maria ay umaakyat sa puno upang kunin ang mangga",
        pageImage: "https://literexia-bucket.s3.ap-southeast-2.amazonaws.com/pre-assessment/image/1757031781948-798hmttxt09.png"
      }
    ],
    sentenceQuestions: [
      {
        questionText: "Sino ang nangunguha ng mangga?",
        correctAnswer: "Maria",
        acceptableAnswers: ["si Maria", "ma-ria", "maria"]
      },
      {
        questionText: "Saan matatagpuan ang puno ng mangga?",
        correctAnswer: "Bakuran",
        acceptableAnswers: ["bakuran", "sa bakuran", "ba-kuran"]
      },
      {
        questionText: "Ano ang ginagawa ni Maria?",
        correctAnswer: "Nangunguha",
        acceptableAnswers: ["sa nangunguha", "nangunguha"]
      }
    ]
  }
};

class PreAssessmentDataProcessor {
  /**
   * Process and match student responses with questions
   * @param {Array} userResponses - Array of user response objects  
   * @param {Array|null} preAssessmentQuestions - Optional pre-assessment questions array
   * @returns {Object} Processed assessment data
   */
  static processStudentResponses(userResponses, preAssessmentQuestions = null) {
    if (!userResponses || !Array.isArray(userResponses)) {
      return {
        hasCompleted: false,
        message: 'No responses found for this student'
      };
    }

    // Group responses by category
    const responsesByCategory = {};
    const processedQuestions = [];
    let totalCorrect = 0;
    let totalQuestions = userResponses.length;

    userResponses.forEach(response => {
      const question = PRE_ASSESSMENT_QUESTIONS[response.questionId];
      
      if (!question) {
        console.warn(`Question ${response.questionId} not found in question bank`);
        return;
      }

      // Initialize category if not exists
      if (!responsesByCategory[response.category]) {
        responsesByCategory[response.category] = {
          categoryName: response.category,
          questions: [],
          correct: 0,
          total: 0,
          score: 0
        };
      }

      const categoryData = responsesByCategory[response.category];

      // Process the response based on question type
      const processedQuestion = this.processQuestionResponse(question, response);
      
      categoryData.questions.push(processedQuestion);
      categoryData.total += 1;
      
      if (processedQuestion.isCorrect) {
        categoryData.correct += 1;
        totalCorrect += 1;
      }

      categoryData.score = Math.round((categoryData.correct / categoryData.total) * 100);
      
      processedQuestions.push(processedQuestion);
    });

    // Convert to skill details format
    const skillDetails = Object.values(responsesByCategory);
    
    // Calculate overall stats
    const overallScore = totalQuestions > 0 ? Math.round((totalCorrect / totalQuestions) * 100) : 0;
    const totalResponseTime = userResponses.reduce((sum, resp) => sum + (resp.responseTime || 0), 0);
    
    // Determine reading level based on score
    let readingLevel = 'Low Emerging';
    if (overallScore >= 85) readingLevel = 'At Grade Level';
    else if (overallScore >= 70) readingLevel = 'Transitioning';
    else if (overallScore >= 55) readingLevel = 'Developing';
    else if (overallScore >= 40) readingLevel = 'High Emerging';

    return {
      hasCompleted: true,
      studentId: userResponses[0]?.studentId,
      overallScore: overallScore,
      correctAnswers: totalCorrect,
      totalQuestions: totalQuestions,
      readingLevel: readingLevel,
      completedAt: userResponses[0]?.answeredAt || userResponses[0]?.createdAt,
      totalResponseTime: totalResponseTime,
      skillDetails: skillDetails
    };
  }

  /**
   * Process individual question response
   * @param {Object} question - Question data from question bank
   * @param {Object} response - Student response data
   * @returns {Object} Processed question with student response
   */
  static processQuestionResponse(question, response) {
    const processedQuestion = {
      ...question,
      studentResponse: response.response,
      responseTime: response.responseTime,
      answeredAt: response.answeredAt,
      isCorrect: response.isCorrect
    };

    // Process answer display based on question type
    switch (question.questionType) {
      case 'patinig':
      case 'katinig':
        // Multiple choice questions
        processedQuestion.studentAnswerText = this.getMultipleChoiceAnswerText(question, response);
        processedQuestion.correctAnswerText = this.getCorrectAnswerText(question);
        break;

      case 'malapantig':
        // Audio matching questions
        processedQuestion.studentAnswerText = this.getMatchingAnswerText(response);
        processedQuestion.correctAnswerText = `All ${question.questionSet?.correctPairs?.length || 0} pairs correct`;
        processedQuestion.correctMatches = response.correctMatches || 0;
        processedQuestion.totalMatches = response.totalMatches || question.questionSet?.correctPairs?.length || 0;
        break;

      case 'decode':
        // Decoding/sequencing questions  
        processedQuestion.studentAnswerText = Array.isArray(response.response) ? 
          response.response.join('') : (response.response || 'No answer');
        processedQuestion.correctAnswerText = question.correctSequence?.join('') || 'Not specified';
        break;

      case 'word':
        // Word recognition questions
        processedQuestion.studentAnswerText = Array.isArray(response.response) ?
          response.response.join(', ') : (response.response || 'No answer');
        processedQuestion.correctAnswerText = Array.isArray(question.correctAnswer) ?
          question.correctAnswer.join(', ') : (question.correctAnswer || 'Not specified');
        break;

      case 'sentence':
        // Reading comprehension questions
        processedQuestion.studentAnswerText = Array.isArray(response.response) ?
          response.response[0] : (response.response || 'No answer');
        // For RC questions, we need to match with specific sentence questions
        processedQuestion.correctAnswerText = this.getReadingComprehensionAnswer(question, response);
        break;

      default:
        processedQuestion.studentAnswerText = 'Response recorded';
        processedQuestion.correctAnswerText = 'Answer available';
    }

    return processedQuestion;
  }

  /**
   * Get multiple choice answer text
   */
  static getMultipleChoiceAnswerText(question, response) {
    if (!response.response || !Array.isArray(response.response) || response.response.length === 0) {
      return 'No answer selected';
    }

    const selectedOptionId = response.response[0];
    const selectedOption = question.options?.find(opt => opt.optionId === selectedOptionId);
    
    return selectedOption ? selectedOption.optionText : `Option ${selectedOptionId}`;
  }

  /**
   * Get correct answer text for multiple choice
   */
  static getCorrectAnswerText(question) {
    const correctOption = question.options?.find(opt => opt.isCorrect);
    return correctOption ? correctOption.optionText : 'Not specified';
  }

  /**
   * Get matching question answer text
   */
  static getMatchingAnswerText(response) {
    if (response.correctMatches !== undefined && response.totalMatches !== undefined) {
      return `${response.correctMatches}/${response.totalMatches} matches correct`;
    }
    return 'Matching response recorded';
  }

  /**
   * Get reading comprehension answer
   */
  static getReadingComprehensionAnswer(question, response) {
    // This is a simplified version - in practice, you'd need more sophisticated matching
    if (question.sentenceQuestions && question.sentenceQuestions.length > 0) {
      return question.sentenceQuestions[0].correctAnswer;
    }
    return 'Text answer expected';
  }

  /**
   * Get all questions that a student hasn't answered yet
   * @param {Array} userResponses - Student responses
   * @param {Array} allQuestions - All available questions 
   * @returns {Array} Unanswered questions
   */
  static getUnansweredQuestions(userResponses, allQuestions = null) {
    const answeredQuestionIds = new Set(
      userResponses?.map(response => response.questionId) || []
    );

    const questionBank = allQuestions || Object.values(PRE_ASSESSMENT_QUESTIONS);
    
    return questionBank.filter(question => 
      !answeredQuestionIds.has(question.questionId)
    ).map(question => ({
      ...question,
      isAnswered: false,
      studentAnswerText: 'Not answered yet',
      correctAnswerText: this.getCorrectAnswerText(question) || 'Available when answered'
    }));
  }

  /**
   * Format category name for display
   */
  static formatCategoryName(categoryName) {
    return categoryName
      .replace(/_/g, ' ')
      .replace(/\b\w/g, l => l.toUpperCase());
  }

  /**
   * Get category icon based on category name
   */
  static getCategoryIcon(category) {
    const iconMap = {
      'alphabet_knowledge': 'FaQuestionCircle',
      'phonological_awareness': 'FaVolumeUp', 
      'decoding': 'FaBook',
      'word_recognition': 'FaClipboardList',
      'reading_comprehension': 'FaFileAlt'
    };
    
    return iconMap[category?.toLowerCase().replace(/\s+/g, '_')] || 'FaQuestionCircle';
  }
}

export default PreAssessmentDataProcessor;