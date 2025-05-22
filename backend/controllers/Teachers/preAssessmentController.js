const mongoose = require('mongoose');

// Get the correct databases
const getTestDb = () => mongoose.connection.useDb('test'); // for users
const getPreAssessmentDb = () => mongoose.connection.useDb('Pre_Assessment'); // for assessment data

exports.getPreAssessmentResults = async (req, res) => {
  try {
    const studentId = req.params.id;
    console.log('Getting pre-assessment results for student:', studentId);
    
    // Get collections from correct databases
    const usersCollection = getTestDb().collection('users');
    const userResponsesCollection = getPreAssessmentDb().collection('user_responses');
    const preAssessmentCollection = getPreAssessmentDb().collection('pre-assessment');
    
    // Find student from test database
    let student;
    try {
      // Try as ObjectId first
      student = await usersCollection.findOne({ _id: new mongoose.Types.ObjectId(studentId) });
    } catch (err) {
      // If not valid ObjectId, try as idNumber
      student = await usersCollection.findOne({ idNumber: studentId });
    }
    
    if (!student) {
      return res.status(404).json({ message: 'Student not found' });
    }
    
    console.log('Found student:', student.firstName, student.lastName);
    
    // Find user responses from Pre_Assessment database
    let userResponses = await userResponsesCollection.findOne({
      userId: student.idNumber?.toString()
    });
    
    if (!userResponses) {
      userResponses = await userResponsesCollection.findOne({
        userId: student._id.toString()
      });
    }
    
    if (!userResponses) {
      userResponses = await userResponsesCollection.findOne({
        userId: studentId
      });
    }
    
    if (!userResponses) {
      return res.status(404).json({ 
        message: 'No pre-assessment results found for this student',
        studentId: studentId,
        hasCompleted: false
      });
    }
    
    console.log('Found user responses:', userResponses._id);
    
    // Get the pre-assessment structure from Pre_Assessment database
    const preAssessment = await preAssessmentCollection.findOne({
      assessmentId: userResponses.assessmentId || "FL-G1-001"
    });
    
    if (!preAssessment) {
      return res.status(404).json({ message: 'Pre-assessment structure not found' });
    }
    
    console.log('Found pre-assessment structure:', preAssessment.title);
    
    // Process the results
    const processedResults = await processAssessmentResults(userResponses, preAssessment, student);
    
    res.json(processedResults);
    
  } catch (error) {
    console.error('Error fetching pre-assessment results:', error);
    res.status(500).json({ 
      message: 'Error fetching pre-assessment results', 
      error: error.message 
    });
  }
};

// Helper function to process assessment results based on your actual data structure
async function processAssessmentResults(userResponses, preAssessment, student) {
  const results = {
    studentId: student._id,
    studentName: `${student.firstName} ${student.lastName}`,
    assessmentId: userResponses.assessmentId,
    readingLevel: userResponses.readingLevel || student.readingLevel,
    overallScore: userResponses.readingPercentage || 0,
    totalQuestions: userResponses.totalQuestions || 25,
    correctAnswers: userResponses.score || 0,
    part1Score: userResponses.part1Score || 0,
    completedAt: userResponses.completedAt,
    timeTaken: userResponses.timeTaken,
    categoryScores: userResponses.categoryScores || {},
    difficultyBreakdown: userResponses.difficultyBreakdown || {},
    skillDetails: [],
    focusAreas: [],
    hasCompleted: true
  };
  
  // Group questions by category
  const questionsByCategory = {};
  preAssessment.questions.forEach(question => {
    const categoryId = question.questionTypeId;
    if (!questionsByCategory[categoryId]) {
      questionsByCategory[categoryId] = [];
    }
    questionsByCategory[categoryId].push(question);
  });
  
  // Process each category
  Object.keys(questionsByCategory).forEach(categoryKey => {
    const categoryQuestions = questionsByCategory[categoryKey];
    const categoryData = userResponses.categoryScores[categoryKey];
    
    if (!categoryData) return;
    
    // Special handling for reading comprehension
    if (categoryKey === 'reading_comprehension') {
      // Process reading comprehension questions directly
      const processedQuestions = categoryQuestions.map(q => {
        const studentAnswer = userResponses.answers[q.questionId];
        
        // Get ALL passage pages and their text
        const allPages = q.passages || [];
        const passageText = allPages.map(page => page.pageText).join(' ');
        
        // Get the actual comprehension questions from sentenceQuestions
        const comprehensionQuestions = q.sentenceQuestions || [];
        const mainComprehensionQ = comprehensionQuestions[0] || {};
        
        // Determine if student was correct
        // Based on your data structure, check if student answered correctly
        const isCorrect = studentAnswer === "1";
        
        return {
          questionId: q.questionId,
          questionNumber: q.questionNumber,
          mainInstruction: q.questionText, // "Basahin ang kwento at sagutin ang tanong"
          
          // Story/Passage information
          passageText: passageText, // Combined story text
          passages: allPages, // Individual pages with pageText and pageImage
          
          // Actual question information
          actualQuestion: mainComprehensionQ.questionText, // The real question like "Ano ang kinain ni Maria?"
          questionImage: mainComprehensionQ.questionImage,
          
          // Answer information
          studentAnswer: studentAnswer,
          correctAnswer: mainComprehensionQ.correctAnswer, // "Mansanas"
          incorrectAnswer: mainComprehensionQ.incorrectAnswer, // "Mangga"
          isCorrect: isCorrect,
          
          // Additional metadata
          difficultyLevel: q.difficultyLevel,
          questionType: q.questionType,
          hasPassage: true,
          allComprehensionQuestions: comprehensionQuestions // In case there are multiple questions per passage
        };
      });

      // Create the skill detail
      const skillDetail = {
        category: categoryKey,
        categoryName: getCategoryDisplayName(categoryKey),
        score: categoryData.score || 0,
        correct: categoryData.correct || 0,
        total: categoryData.total || 5,
        questions: processedQuestions
      };
      
      results.skillDetails.push(skillDetail);
    } else {
      const skillDetail = processRegularCategory(
        categoryKey, 
        categoryQuestions, 
        userResponses.answers, 
        categoryData
      );
      results.skillDetails.push(skillDetail);
    }
    
    // Add to focus areas if score is below 75%
    if (categoryData.score < 75) {
      results.focusAreas.push(getCategoryDisplayName(categoryKey));
    }
  });
  
  return results;
}

function processRegularCategory(categoryKey, categoryQuestions, studentAnswers, categoryData) {
  const questions = categoryQuestions.map(question => {
    const studentAnswerOptionId = studentAnswers[question.questionId];
    const correctOption = question.options.find(opt => opt.isCorrect);
    const studentSelectedOption = question.options.find(opt => opt.optionId === studentAnswerOptionId);
    
    // Based on your data: "1" is correct, "2" is incorrect
    const isCorrect = studentAnswerOptionId === "1";
    
    return {
      questionId: question.questionId,
      questionNumber: question.questionNumber,
      questionText: question.questionText,
      questionImage: question.questionImage,
      questionValue: question.questionValue,
      displayedText: question.displayedText,
      hasAudio: question.hasAudio,
      audioUrl: question.audioUrl,
      studentAnswer: studentAnswerOptionId,
      studentAnswerText: studentSelectedOption ? studentSelectedOption.optionText : 'No answer',
      correctAnswer: correctOption ? correctOption.optionId : null,
      correctAnswerText: correctOption ? correctOption.optionText : 'Unknown',
      isCorrect: isCorrect,
      difficultyLevel: question.difficultyLevel,
      options: question.options || []
    };
  });

  return {
    category: categoryKey,
    categoryName: getCategoryDisplayName(categoryKey),
    score: categoryData.score || 0,
    correct: categoryData.correct || 0,
    total: categoryData.total || 5,
    questions: questions
  };
}

function getCategoryDisplayName(categoryKey) {
  const categoryMapping = {
    'alphabet_knowledge': 'Alphabet Knowledge',
    'phonological_awareness': 'Phonological Awareness', 
    'decoding': 'Decoding',
    'word_recognition': 'Word Recognition',
    'reading_comprehension': 'Reading Comprehension'
  };
  return categoryMapping[categoryKey] || categoryKey;
}

exports.getStudentPreAssessmentStatus = async (req, res) => {
  try {
    const studentId = req.params.id;
    
    const usersCollection = getTestDb().collection('users');
    const userResponsesCollection = getPreAssessmentDb().collection('user_responses');
    
    // Find student from test database
    let student;
    try {
      student = await usersCollection.findOne({ _id: new mongoose.Types.ObjectId(studentId) });
    } catch (err) {
      student = await usersCollection.findOne({ idNumber: studentId });
    }
    
    if (!student) {
      return res.status(404).json({ message: 'Student not found' });
    }
    
    // Check if student has completed pre-assessment in Pre_Assessment database
    let hasResponses = await userResponsesCollection.findOne({
      userId: student.idNumber?.toString()
    });
    
    if (!hasResponses) {
      hasResponses = await userResponsesCollection.findOne({
        userId: student._id.toString()
      });
    }
    
    res.json({
      studentId: studentId,
      hasCompleted: !!hasResponses,
      preAssessmentCompleted: student.preAssessmentCompleted || false,
      readingLevel: student.readingLevel,
      lastAssessmentDate: student.lastAssessmentDate
    });
    
  } catch (error) {
    console.error('Error checking pre-assessment status:', error);
    res.status(500).json({ 
      message: 'Error checking pre-assessment status', 
      error: error.message 
    });
  }
};