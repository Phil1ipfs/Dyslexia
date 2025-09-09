/**
 * PreAssessmentDataProcessor - Service for processing pre-assessment data
 * Handles matching student responses with questions and correct answers
 */

// Complete Pre-assessment questions data (from CLAUDE.md)
const PRE_ASSESSMENT_QUESTIONS = {
  // Alphabet Knowledge (10 questions)
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
      { optionId: "1", optionText: "b", isCorrect: true },  // Fixed: option 1 is actually "b"
      { optionId: "2", optionText: "i", isCorrect: false },
      { optionId: "3", optionText: "d", isCorrect: false }
    ],
    correctAnswer: "1"  // Fixed: correct answer is option 1
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
      { optionId: "1", optionText: "/geh/ ", isCorrect: false },
      { optionId: "2", optionText: "/ey/ ", isCorrect: true },
      { optionId: "3", optionText: "/ee/ ", isCorrect: false }
    ],
    correctAnswer: "2"
  },
  "AK_008": {
    questionId: "AK_008",
    category: "Alphabet Knowledge",
    questionType: "katinig",
    questionText: "Anong tunog ng letra? ",
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
  // Phonological Awareness (6 questions)
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
    questionValue: null,
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
  "PA_003": {
    questionId: "PA_003",
    category: "Phonological Awareness",
    questionType: "malapantig",
    questionText: "Pakinggan ang letra sa audio. Itugma ito sa katumbas na letra sa kabilang hanay.",
    questionImage: null,
    difficultyLevel: "high_emerging",
    questionValue: null,
    questionSet: {
      audioTexts: ["GA", "LO", "PI", "NGA", "WU"],
      matchingOptions: ["GA", "LO", "PI", "NGA", "WU"],
      correctPairs: [
        { audio: "GA", match: "GA" },
        { audio: "LO", match: "LO" },
        { audio: "PI", match: "PI" },
        { audio: "NGA", match: "NGA" },
        { audio: "WU", match: "WU" }
      ]
    }
  },
  "PA_004": {
    questionId: "PA_004",
    category: "Phonological Awareness",
    questionType: "malapantig",
    questionText: "Pakinggan ang letra sa audio. Itugma ito sa katumbas na letra sa kabilang hanay.",
    questionImage: null,
    difficultyLevel: "high_emerging",
    questionValue: null,
    questionSet: {
      audioTexts: ["PUNO", "RELO"],
      matchingOptions: ["PUNO", "RELO"],
      correctPairs: [
        { audio: "PUNO", match: "PUNO" },
        { audio: "RELO", match: "RELO" }
      ]
    }
  },
  "PA_005": {
    questionId: "PA_005",
    category: "Phonological Awareness",
    questionType: "malapantig",
    questionText: "Pakinggan ang pantig sa audio. Itugma ito sa katumbas na pantig sa kabilang hanay.",
    questionValue: null,
    questionImage: null,
    difficultyLevel: "high_emerging",
    questionSet: {
      audioTexts: ["GA", "LO", "PI"],
      matchingOptions: ["GA", "LO", "PI"],
      correctPairs: [
        { audio: "GA", match: "GA" },
        { audio: "LO", match: "LO" },
        { audio: "PI", match: "PI" }
      ]
    }
  },
  "PA_006": {
    questionId: "PA_006",
    category: "Phonological Awareness",
    questionType: "malapantig",
    questionText: "Pakinggan ang pantig sa audio. Itugma ito sa katumbas na pantig sa kabilang hanay.",
    questionValue: null,
    questionImage: null,
    difficultyLevel: "high_emerging",
    questionSet: {
      audioTexts: ["NGA", "WU"],
      matchingOptions: ["NGA", "WU"],
      correctPairs: [
        { audio: "NGA", match: "NGA" },
        { audio: "WU", match: "WU" }
      ]
    }
  },
  // Decoding (10 questions)
  "DC_001": {
    questionId: "DC_001",
    category: "Decoding",
    questionType: "decode",
    questionText: "Tukuyin ang nasa larawan?",
    questionValue: null,
    questionImage: "https://literexia-bucket.s3.ap-southeast-2.amazonaws.com/pre-assessment/image/1757029227985-d5xxu50j1y.png",
    difficultyLevel: "developing",
    displaySequence: null,
    blankPosition: null,
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
    displaySequence: null,
    blankPosition: null,
    dragElements: ["A", "r", "a", "w", "R", "W"],
    correctSequence: ["A", "r", "a", "w"]
  },
  "DC_003": {
    questionId: "DC_003",
    category: "Decoding",
    questionType: "decode",
    questionText: "Tukuyin ang nasa larawan?",
    questionValue: null,
    questionImage: "https://literexia-bucket.s3.ap-southeast-2.amazonaws.com/pre-assessment/image/1757029657613-k0q2ed3nzu.png",
    difficultyLevel: "developing",
    displaySequence: null,
    blankPosition: null,
    dragElements: ["N", "g", "i", "p", "i", "n", "A", "U"],
    correctSequence: ["N", "g", "i", "p", "i", "n"]
  },
  "DC_004": {
    questionId: "DC_004",
    category: "Decoding",
    questionType: "decode",
    questionText: "Tukuyin ang nasa larawan?",
    questionValue: null,
    questionImage: "https://literexia-bucket.s3.ap-southeast-2.amazonaws.com/pre-assessment/image/1757029687663-6kovs8zne2d.png",
    difficultyLevel: "developing",
    displaySequence: null,
    blankPosition: null,
    dragElements: ["E", "r", "o", "p", "l", "a", "n", "o", "E", "U"],
    correctSequence: ["E", "r", "o", "p", "l", "a", "n", "o"]
  },
  "DC_005": {
    questionId: "DC_005",
    category: "Decoding",
    questionType: "decode",
    questionText: "Tukuyin ang nasa larawan?",
    questionValue: null,
    questionImage: "https://literexia-bucket.s3.ap-southeast-2.amazonaws.com/pre-assessment/image/1757029713845-kilagifx557.png",
    difficultyLevel: "developing",
    displaySequence: null,
    blankPosition: null,
    dragElements: ["B", "a", "h", "a", "y", "E", "I"],
    correctSequence: ["B", "a", "h", "a", "y"]
  },
  "DC_006": {
    questionId: "DC_006",
    category: "Decoding",
    questionType: "decode",
    questionText: "Tukuyin ang nasa larawan?",
    questionValue: null,
    questionImage: "https://literexia-bucket.s3.ap-southeast-2.amazonaws.com/pre-assessment/image/1757382362894-9iz7doh1crl.png",
    difficultyLevel: "developing",
    displaySequence: [],
    blankPosition: null,
    dragElements: ["K", "a", "m", "a", "y", "E", "O"],
    correctSequence: ["K", "a", "m", "a", "y"]
  },
  "DC_007": {
    questionId: "DC_007",
    category: "Decoding",
    questionType: "decode",
    questionText: "Tukuyin ang nasa larawan?",
    questionValue: null,
    questionImage: "https://literexia-bucket.s3.ap-southeast-2.amazonaws.com/pre-assessment/image/1757029777889-825j13vbgeq.png",
    difficultyLevel: "developing",
    displaySequence: null,
    blankPosition: null,
    dragElements: ["R", "o", "s", "a", "s", "S", "H"],
    correctSequence: ["R", "o", "s", "a", "s"]
  },
  "DC_008": {
    questionId: "DC_008",
    category: "Decoding",
    questionType: "decode",
    questionText: "Tukuyin ang nasa larawan?",
    questionValue: null,
    questionImage: "https://literexia-bucket.s3.ap-southeast-2.amazonaws.com/pre-assessment/image/1757029827506-866iq6svjhe.png",
    difficultyLevel: "developing",
    displaySequence: null,
    blankPosition: null,
    dragElements: ["P", "a", "l", "a", "k", "a", "e", "I"],
    correctSequence: ["P", "a", "l", "a", "k", "a"]
  },
  "DC_009": {
    questionId: "DC_009",
    category: "Decoding",
    questionType: "decode",
    questionText: "Buuin ang salita",
    questionValue: null,
    questionImage: "https://literexia-bucket.s3.ap-southeast-2.amazonaws.com/pre-assessment/image/1757029864142-hbk05ve4l3a.png",
    difficultyLevel: "developing",
    displaySequence: ["", "I", "N", "A", "P", "A", "Y"],
    blankPosition: 0,
    dragElements: ["T", "S", "E", "I"],
    correctSequence: ["T"]
  },
  "DC_010": {
    questionId: "DC_010",
    category: "Decoding",
    questionType: "decode",
    questionText: "Buoin ang salita",
    questionValue: null,
    questionImage: "https://literexia-bucket.s3.ap-southeast-2.amazonaws.com/pre-assessment/image/1757029905272-5d3ojki7ma9.png",
    difficultyLevel: "developing",
    displaySequence: ["", "S", "O"],
    blankPosition: 0,
    dragElements: ["O", "P", "E", "I"],
    correctSequence: ["O"]
  },
  // Word Recognition (10 questions)
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
  "WR_003": {
    questionId: "WR_003",
    category: "Word Recognition",
    questionType: "word",
    questionText: "Basahin ang pangungusap. Piliin ang tamang salita mula sa hanay.",
    questionValue: null,
    questionImage: null,
    difficultyLevel: "transitioning",
    displayWord: "Mahilig magluto ang ___ ko",
    blankOptions: ["NANAY", "MANOK", "BOLA", "ELEPANTE"],
    correctAnswer: ["NANAY"]
  },
  "WR_004": {
    questionId: "WR_004",
    category: "Word Recognition",
    questionType: "word",
    questionText: "Basahin ang pangungusap. Piliin ang tamang salita mula sa hanay.",
    questionValue: null,
    questionImage: null,
    difficultyLevel: "transitioning",
    displayWord: "Nasa ___ ang mga libro",
    blankOptions: ["LAMESA", "PAPEL", "MANOK", "BOLA"],
    correctAnswer: ["LAMESA"]
  },
  "WR_005": {
    questionId: "WR_005",
    category: "Word Recognition",
    questionType: "word",
    questionText: "Basahin ang pangungusap. Piliin ang tamang salita mula sa hanay.",
    questionValue: null,
    questionImage: null,
    difficultyLevel: "transitioning",
    displayWord: "Kumakain ng mais ang ___",
    blankOptions: ["MANOK", "NANAY", "ELEPANTE", "KUTSARA"],
    correctAnswer: ["MANOK"]
  },
  "WR_006": {
    questionId: "WR_006",
    category: "Word Recognition",
    questionType: "word",
    questionText: "Basahin ang pangungusap. Piliin ang tamang salita mula sa hanay.",
    questionValue: null,
    questionImage: null,
    difficultyLevel: "transitioning",
    displayWord: "Ginagamit niya ang ___ sa pagkain",
    blankOptions: ["KUTSARA", "LAMESA", "ELEPANTE", "DAMIT"],
    correctAnswer: ["KUTSARA"]
  },
  "WR_007": {
    questionId: "WR_007",
    category: "Word Recognition",
    questionType: "word",
    questionText: "Basahin ang pangungusap. Piliin ang tamang salita mula sa hanay.",
    questionValue: null,
    questionImage: null,
    difficultyLevel: "transitioning",
    displayWord: "Malinis ang ___ ni Ana",
    blankOptions: ["DAMIT", "BOLA", "PAPEL", "KUTSARA"],
    correctAnswer: ["DAMIT"]
  },
  "WR_008": {
    questionId: "WR_008",
    category: "Word Recognition",
    questionType: "word",
    questionText: "Basahin ang pangungusap. Piliin ang tamang salita mula sa hanay.",
    questionValue: null,
    questionImage: null,
    difficultyLevel: "transitioning",
    displayWord: "Gumuguhit ako sa ___",
    blankOptions: ["PAPEL", "ELEPANTE", "MANOK", "LAMESA"],
    correctAnswer: ["PAPEL"]
  },
  "WR_009": {
    questionId: "WR_009",
    category: "Word Recognition",
    questionType: "word",
    questionText: "Anong kasing tunog ng salitang nakikita?",
    questionValue: null,
    questionImage: "https://literexia-bucket.s3.ap-southeast-2.amazonaws.com/pre-assessment/image/1757030517902-0eh214z662zr.png",
    difficultyLevel: "transitioning",
    displayWord: "SUMBRERO",
    blankOptions: ["LIB", "RO", "ME", "SA"],
    correctAnswer: ["LIB", "RO"]
  },
  "WR_010": {
    questionId: "WR_010",
    category: "Word Recognition",
    questionType: "word",
    questionText: "Anong kasing tunog ng salitang nakikita?",
    questionValue: null,
    questionImage: null,
    difficultyLevel: "transitioning",
    displayWord: "LOBO",
    blankOptions: ["ME", "SA", "TU", "BO"],
    correctAnswer: ["TU", "BO"]
  },
  // Reading Comprehension (9 questions) 
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
        questionText: "Sino ang may aso? ",
        correctAnswer: "Juan",
        acceptableAnswers: ["Si juan", "juan", "si juan"]
      },
      {
        questionText: "Saan naglaro si Juan at Max? ",
        correctAnswer: "Parke", 
        acceptableAnswers: ["Sa parke", "sa parke"]
      },
      {
        questionText: "Ano ang ginagawa ni Juan at Max? ",
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
        pageText: "Tuwing tag-init, nangunguha siya ng mangga. Ang mga mangga ay matamis at kulay dilaw. ",
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
        questionText: "Sino ang nangunguha ng mangga? ",
        correctAnswer: "Maria",
        acceptableAnswers: ["si Maria", "ma-ria", "maria"]
      },
      {
        questionText: "Saan matatagpuan ang puno ng mangga? ",
        correctAnswer: "Bakuran",
        acceptableAnswers: ["bakuran", "sa bakuran", "ba-kuran"]
      },
      {
        questionText: "Ano ang ginagawa ni Maria? ",
        correctAnswer: "Nangunguha",
        acceptableAnswers: ["sa nangunguha", "nangunguha"]
      }
    ]
  },
  "RC_003": {
    questionId: "RC_003",
    category: "Reading Comprehension",
    questionType: "sentence",
    questionValue: null,
    questionImage: null,
    difficultyLevel: "at_grade_level",
    passages: [
      {
        pageNumber: 1,
        pageText: "Si Juan ay tumulong kay Tatay magbuhat ng kahon",
        pageImage: "https://literexia-bucket.s3.ap-southeast-2.amazonaws.com/pre-assessment/image/1757031992761-o8g0bn8299.png"
      },
      {
        pageNumber: 2,
        pageText: "Si Tatay ay nagdadala ng mga gamit sa garahe. Matagal nang hindi nagagamit ang mga kahon na iyon",
        pageImage: "https://literexia-bucket.s3.ap-southeast-2.amazonaws.com/pre-assessment/image/1757031994108-ii2hu1mxnfi.png"
      },
      {
        pageNumber: 3,
        pageText: "Inutusan ni Tatay si Juan na ilagay ang mga kahon sa isang tabi.",
        pageImage: "https://literexia-bucket.s3.ap-southeast-2.amazonaws.com/pre-assessment/image/1757031994994-r7hxjojmm1g.png"
      },
      {
        pageNumber: 4,
        pageText: "Habang binubuhat nila ang mga kahon, napansin ni Juan ang mga lumang laruan. Inisip ni Juan na magtulungan silang ayusin ang garahe",
        pageImage: "https://literexia-bucket.s3.ap-southeast-2.amazonaws.com/pre-assessment/image/1757031995685-lpyszq1z14.png"
      }
    ],
    sentenceQuestions: [
      {
        questionText: "Sino ang tumulong kay Tatay? ",
        correctAnswer: "Juan",
        acceptableAnswers: ["juan", "si juan", "ju-an"]
      },
      {
        questionText: "Saan naganap ang pagtulong? ",
        correctAnswer: "Garahe",
        acceptableAnswers: ["garahe", "gaarahe", "sa garahe"]
      },
      {
        questionText: "Ano ang ginawa ni Juan? ",
        correctAnswer: "Nagbuhat",
        acceptableAnswers: ["nagbuhat", "nag-buhat", "buhatt"]
      }
    ]
  },
  "RC_004": {
    questionId: "RC_004",
    category: "Reading Comprehension",
    questionType: "sentence",
    questionValue: null,
    questionImage: null,
    difficultyLevel: "at_grade_level",
    passages: [
      {
        pageNumber: 1,
        pageText: "Si Liza at si Marco ay magkaibigan",
        pageImage: "https://literexia-bucket.s3.ap-southeast-2.amazonaws.com/pre-assessment/image/1757032149430-65bqlu9v7yq.png"
      },
      {
        pageNumber: 2,
        pageText: "Tuwing hapon, naglalaro sila ng habulan sa bakuran.",
        pageImage: "https://literexia-bucket.s3.ap-southeast-2.amazonaws.com/pre-assessment/image/1757032151678-tvhi5c2ffwj.png"
      },
      {
        pageNumber: 3,
        pageText: "Madalas silang maghabulan mula sa paligid ng bakuran hangang hangang gumabi o umulan.",
        pageImage: "https://literexia-bucket.s3.ap-southeast-2.amazonaws.com/pre-assessment/image/1757032152990-x1wxqyaxjjd.png"
      }
    ],
    sentenceQuestions: [
      {
        questionText: "Sino ang naglalaro ng habulan? ",
        correctAnswer: "Liza at Marco",
        acceptableAnswers: ["liza marco", "si liza at marco", "liza marco"]
      },
      {
        questionText: "Saan sila naglalaro? ",
        correctAnswer: "Bakuran",
        acceptableAnswers: ["bakuran", "babakuran", "binakuran"]
      },
      {
        questionText: "Ano ang laro nila? ",
        correctAnswer: "Habulan",
        acceptableAnswers: ["habulan", "habbulan", "hahabulin"]
      }
    ]
  },
  "RC_005": {
    questionId: "RC_005",
    category: "Reading Comprehension",
    questionType: "sentence",
    questionValue: null,
    questionImage: null,
    difficultyLevel: "at_grade_level",
    passages: [
      {
        pageNumber: 1,
        pageText: "Si Maria ay kumain ng mansanas.",
        pageImage: "https://literexia-bucket.s3.ap-southeast-2.amazonaws.com/pre-assessment/image/1757032323481-g4tr9ru3vze.png"
      }
    ],
    sentenceQuestions: [
      {
        questionText: "Ano ang kinain ni Maria?",
        correctAnswer: "Mansanas",
        acceptableAnswers: ["mansanass", "mansaanas"]
      }
    ]
  },
  "RC_006": {
    questionId: "RC_006",
    category: "Reading Comprehension",
    questionType: "sentence",
    questionValue: null,
    questionImage: null,
    difficultyLevel: "at_grade_level",
    passages: [
      {
        pageNumber: 1,
        pageText: "Si Juan ay naglalaro ng bola sa parke.",
        pageImage: "https://literexia-bucket.s3.ap-southeast-2.amazonaws.com/pre-assessment/image/1757032375027-iv7p1trs1f.png"
      }
    ],
    sentenceQuestions: [
      {
        questionText: "Ano ang nilalaro ni Juan?",
        correctAnswer: "Bola",
        acceptableAnswers: ["booola", "bolaa"]
      }
    ]
  },
  "RC_007": {
    questionId: "RC_007",
    category: "Reading Comprehension",
    questionType: "sentence",
    questionValue: null,
    questionImage: null,
    difficultyLevel: "at_grade_level",
    passages: [
      {
        pageNumber: 1,
        pageText: "Ang aso ay tumakbo sa hardin.",
        pageImage: "https://literexia-bucket.s3.ap-southeast-2.amazonaws.com/pre-assessment/image/1757032469179-d962tot7cj.png"
      }
    ],
    sentenceQuestions: [
      {
        questionText: "Saan tumakbo ang aso?",
        correctAnswer: "Hardin",
        acceptableAnswers: ["hardin", "sa hardin"]
      }
    ]
  },
  "RC_008": {
    questionId: "RC_008",
    category: "Reading Comprehension",
    questionType: "sentence",
    questionValue: null,
    questionImage: null,
    difficultyLevel: "at_grade_level",
    passages: [
      {
        pageNumber: 1,
        pageText: "Si nanay ay nagluto ng adobo.",
        pageImage: "https://literexia-bucket.s3.ap-southeast-2.amazonaws.com/pre-assessment/image/1757032523091-cbg03vv30kq.png"
      }
    ],
    sentenceQuestions: [
      {
        questionText: "Ano ang niluto ni nanay?",
        correctAnswer: "Adobo",
        acceptableAnswers: ["adobo", "inadobo", "aadobo"]
      }
    ]
  },
  "RC_009": {
    questionId: "RC_009",
    category: "Reading Comprehension",
    questionType: "sentence",
    questionValue: null,
    questionImage: null,
    difficultyLevel: "at_grade_level",
    passages: [
      {
        pageNumber: 1,
        pageText: "Ang bata ay nag-aaral ng aralin",
        pageImage: "https://literexia-bucket.s3.ap-southeast-2.amazonaws.com/pre-assessment/image/1757032587663-547gwak4d93.png"
      }
    ],
    sentenceQuestions: [
      {
        questionText: "Ano ang ginagawa ng bata?",
        correctAnswer: "Nagaaral",
        acceptableAnswers: ["nag aaral", "nagaaral", "Nag aaral"]
      }
    ]
  }
};

// Category mappings for easy access
const CATEGORY_MAPPINGS = {
  'Alphabet Knowledge': ['AK_001', 'AK_002', 'AK_003', 'AK_004', 'AK_005', 'AK_006', 'AK_007', 'AK_008', 'AK_009', 'AK_010'],
  'Phonological Awareness': ['PA_001', 'PA_002', 'PA_003', 'PA_004', 'PA_005', 'PA_006'],
  'Decoding': ['DC_001', 'DC_002', 'DC_003', 'DC_004', 'DC_005', 'DC_006', 'DC_007', 'DC_008', 'DC_009', 'DC_010'],
  'Word Recognition': ['WR_001', 'WR_002', 'WR_003', 'WR_004', 'WR_005', 'WR_006', 'WR_007', 'WR_008', 'WR_009', 'WR_010'],
  'Reading Comprehension': ['RC_001', 'RC_002', 'RC_003', 'RC_004', 'RC_005', 'RC_006', 'RC_007', 'RC_008', 'RC_009']
};

const CATEGORY_TOTALS = {
  'Alphabet Knowledge': 10,
  'Phonological Awareness': 6, 
  'Decoding': 10,
  'Word Recognition': 10,
  'Reading Comprehension': 9
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

    // Group responses by category with all questions (answered and unanswered)
    const responsesByCategory = {};
    const processedQuestions = [];
    let totalCorrect = 0;
    let totalQuestions = userResponses.length;

    // Initialize all categories with their complete question sets
    Object.keys(CATEGORY_MAPPINGS).forEach(categoryName => {
      responsesByCategory[categoryName] = {
        categoryName: categoryName,
        questions: [],
        correct: 0,
        answered: 0,
        total: CATEGORY_TOTALS[categoryName],
        score: 0
      };
    });

    // Create a map of answered questions
    const answeredQuestions = new Map();
    userResponses.forEach(response => {
      answeredQuestions.set(response.questionId, response);
    });

    // Process all questions (answered and unanswered) by category
    Object.keys(CATEGORY_MAPPINGS).forEach(categoryName => {
      const questionIds = CATEGORY_MAPPINGS[categoryName];
      const categoryData = responsesByCategory[categoryName];

      questionIds.forEach(questionId => {
        const question = PRE_ASSESSMENT_QUESTIONS[questionId];
        if (!question) {
          console.warn(`Question ${questionId} not found in question bank`);
          return;
        }

        const response = answeredQuestions.get(questionId);
        
        if (response) {
          // Process answered question
          const processedQuestion = this.processQuestionResponse(question, response);
          categoryData.questions.push(processedQuestion);
          categoryData.answered += 1;
          
          if (processedQuestion.isCorrect) {
            categoryData.correct += 1;
            totalCorrect += 1;
          }
          
          processedQuestions.push(processedQuestion);
        } else {
          // Add unanswered question
          const unansweredQuestion = {
            ...question,
            studentResponse: null,
            responseTime: null,
            answeredAt: null,
            isCorrect: false,
            isAnswered: false,
            wasAnswered: false,  // Add this flag for component compatibility
            studentAnswerText: 'No record yet',
            correctAnswerText: this.getCorrectAnswerText(question),
            status: 'unanswered'
          };
          
          categoryData.questions.push(unansweredQuestion);
        }
      });

      // Calculate category score based on answered questions
      categoryData.score = categoryData.answered > 0 ? 
        Math.round((categoryData.correct / categoryData.answered) * 100) : 0;
    });

    // Convert to skill details format and add answered question counts
    const skillDetails = Object.values(responsesByCategory).map(category => ({
      ...category,
      answeredQuestions: category.answered,  // Add this for component compatibility
      totalQuestions: category.total         // Add this for component compatibility
    }));
    
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
      answeredQuestions: answeredQuestions.size,
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
      isCorrect: response.isCorrect,
      isAnswered: true,
      wasAnswered: true,  // Add this flag for component compatibility
      status: response.isCorrect ? 'correct' : 'incorrect'
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
    if (question.questionType === 'malapantig') {
      return `All ${question.questionSet?.correctPairs?.length || 0} pairs correct`;
    }
    
    if (question.questionType === 'decode') {
      return question.correctSequence?.join('') || 'Not specified';
    }
    
    if (question.questionType === 'word') {
      return Array.isArray(question.correctAnswer) ?
        question.correctAnswer.join(', ') : (question.correctAnswer || 'Not specified');
    }
    
    if (question.questionType === 'sentence') {
      if (question.sentenceQuestions && question.sentenceQuestions.length > 0) {
        return question.sentenceQuestions[0].correctAnswer;
      }
      return 'Text answer expected';
    }
    
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
    // For RC questions, we need to determine which specific question was asked
    // This is a simplified approach - in a real system, you'd track which specific question was answered
    if (question.sentenceQuestions && question.sentenceQuestions.length > 0) {
      // Try to match the response with acceptable answers to determine which question was answered
      const studentAnswer = Array.isArray(response.response) ? response.response[0] : response.response;
      
      for (const sentenceQ of question.sentenceQuestions) {
        if (sentenceQ.correctAnswer.toLowerCase() === studentAnswer?.toLowerCase() || 
            sentenceQ.acceptableAnswers?.some(ans => ans.toLowerCase() === studentAnswer?.toLowerCase())) {
          return sentenceQ.correctAnswer;
        }
      }
      
      // If no match found, return the first question's answer as fallback
      return question.sentenceQuestions[0].correctAnswer;
    }
    return 'Text answer expected';
  }

  /**
   * Get all available questions for a category
   * @param {string} categoryName - The category name
   * @returns {Array} Array of question objects
   */
  static getCategoryQuestions(categoryName) {
    const questionIds = CATEGORY_MAPPINGS[categoryName];
    if (!questionIds) return [];
    
    return questionIds.map(id => PRE_ASSESSMENT_QUESTIONS[id]).filter(Boolean);
  }

  /**
   * Get student's progress for a specific category
   * @param {string} categoryName - The category name
   * @param {Array} userResponses - Student responses
   * @returns {Object} Category progress info
   */
  static getCategoryProgress(categoryName, userResponses) {
    const categoryQuestions = this.getCategoryQuestions(categoryName);
    const answeredQuestions = userResponses?.filter(resp => resp.category === categoryName) || [];
    const totalQuestions = categoryQuestions.length;
    const answeredCount = answeredQuestions.length;
    const correctCount = answeredQuestions.filter(resp => resp.isCorrect).length;
    
    return {
      categoryName,
      totalQuestions,
      answeredCount,
      correctCount,
      unansweredCount: totalQuestions - answeredCount,
      score: answeredCount > 0 ? Math.round((correctCount / answeredCount) * 100) : 0,
      completionRate: Math.round((answeredCount / totalQuestions) * 100)
    };
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
      'alphabet knowledge': 'FaQuestionCircle',
      'phonological_awareness': 'FaVolumeUp',
      'phonological awareness': 'FaVolumeUp',
      'decoding': 'FaBook',
      'word_recognition': 'FaClipboardList',
      'word recognition': 'FaClipboardList',
      'reading_comprehension': 'FaFileAlt',
      'reading comprehension': 'FaFileAlt'
    };
    
    return iconMap[category?.toLowerCase().replace(/\s+/g, '_')] || 'FaQuestionCircle';
  }

  /**
   * Get answer status for a question (correct, incorrect, unanswered)
   * @param {Object} question - Question object
   * @param {Object|null} response - Student response object
   * @returns {string} Status: 'correct', 'incorrect', 'unanswered'
   */
  static getAnswerStatus(question, response) {
    if (!response) return 'unanswered';
    return response.isCorrect ? 'correct' : 'incorrect';
  }

  /**
   * Get display-friendly question number within category
   * @param {string} questionId - Question ID (e.g., 'AK_001')
   * @returns {number} Question number within category
   */
  static getQuestionNumber(questionId) {
    const match = questionId.match(/_([0-9]+)$/);
    return match ? parseInt(match[1], 10) : 1;
  }
}

export default PreAssessmentDataProcessor;
export { PRE_ASSESSMENT_QUESTIONS, CATEGORY_MAPPINGS, CATEGORY_TOTALS };