const mongoose = require('mongoose');

// Get the correct databases
const getTestDb = () => mongoose.connection.useDb('test'); // for users
const getPreAssessmentDb = () => mongoose.connection.useDb('Pre_Assessment'); // for assessment data

exports.getPreAssessmentResults = async (req, res) => {
  try {
    const studentId = req.params.id;
    console.log('⭐ Getting pre-assessment results for student ID:', studentId);
    console.log('⭐ Full request path:', req.originalUrl);
    console.log('⭐ Request method:', req.method);
    
    // Get collections from correct databases
    const usersCollection = getTestDb().collection('users');
    const userResponsesCollection = getPreAssessmentDb().collection('user_responses');
    const preAssessmentCollection = getPreAssessmentDb().collection('pre-assessment');
    
    // Find student from test database
    let student;
    try {
      // Try as ObjectId first
      console.log('Attempting to find student with ObjectId:', studentId);
      student = await usersCollection.findOne({ _id: new mongoose.Types.ObjectId(studentId) });
    } catch (err) {
      // If not valid ObjectId, try as idNumber
      console.log('Not a valid ObjectId, trying as idNumber:', studentId);
      student = await usersCollection.findOne({ idNumber: studentId });
    }
    
    if (!student) {
      console.log('❌ Student not found with ID:', studentId);
      return res.status(404).json({ message: 'Student not found' });
    }
    
    console.log('✅ Found student:', student.firstName, student.lastName);
    
    // Find user responses from Pre_Assessment database
    // Try multiple ways to match the user ID
    let userResponses = null;
    const possibleUserIds = [
      student.idNumber?.toString(),
      student._id.toString(),
      studentId
    ];
    
    // Try each possible user ID until we find a match
    for (const userId of possibleUserIds) {
      if (!userId) continue;
      
      userResponses = await userResponsesCollection.findOne({
        userId: userId
      });
      
      if (userResponses) break;
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
    // Use FL-G1-001 as default if assessmentId is not available
    const assessmentId = userResponses.assessmentId || "FL-G1-001";
    const preAssessment = await preAssessmentCollection.findOne({
      assessmentId: assessmentId
    });
    
    if (!preAssessment) {
      console.error(`Pre-assessment structure not found for assessmentId: ${assessmentId}`);
      return res.status(404).json({ message: `Pre-assessment structure not found for assessmentId: ${assessmentId}` });
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
  
  // Normalize the category scores keys to handle both formats
  let normalizedCategoryScores = {};
  if (userResponses.categoryScores) {
    // Log the original category scores for debugging
    console.log('Original category scores:', JSON.stringify(userResponses.categoryScores));
    
    // Process each category key to ensure consistency
    Object.keys(userResponses.categoryScores).forEach(key => {
      // Convert key to lowercase with underscores if it has capitals or spaces
      const normalizedKey = key.includes(' ') ? 
        key.toLowerCase().replace(/ /g, '_') : 
        key.toLowerCase();
        
      normalizedCategoryScores[normalizedKey] = userResponses.categoryScores[key];
    });
    
    // Log the normalized scores
    console.log('Normalized category scores:', JSON.stringify(normalizedCategoryScores));
  }
  
  // Group questions by category
  const questionsByCategory = {};
  preAssessment.questions.forEach(question => {
    const categoryId = question.questionTypeId;
    if (!questionsByCategory[categoryId]) {
      questionsByCategory[categoryId] = [];
    }
    questionsByCategory[categoryId].push(question);
  });
  
  // Log available categories for debugging
  console.log('Question categories available:', Object.keys(questionsByCategory));
  console.log('Normalized category keys available:', Object.keys(normalizedCategoryScores));
  
  // Process each category
  Object.keys(questionsByCategory).forEach(categoryKey => {
    const categoryQuestions = questionsByCategory[categoryKey];
    // Use the normalized category data or create default if missing
    const categoryData = normalizedCategoryScores[categoryKey] || {
      total: categoryQuestions.length,
      correct: 0,
      score: 0
    };
    
    // Log processing info for debugging
    console.log(`Processing category ${categoryKey} with ${categoryQuestions.length} questions`);
    
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
  
  // Log the final skill details to verify they were created properly
  console.log(`Generated ${results.skillDetails.length} skill details`);
  
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
    console.log('⭐ Getting pre-assessment status for student ID:', studentId);
    console.log('⭐ Full request path:', req.originalUrl);
    console.log('⭐ Request method:', req.method);
    
    const usersCollection = getTestDb().collection('users');
    const userResponsesCollection = getPreAssessmentDb().collection('user_responses');
    
    // Find student from test database
    let student;
    try {
      console.log('Attempting to find student with ObjectId:', studentId);
      student = await usersCollection.findOne({ _id: new mongoose.Types.ObjectId(studentId) });
    } catch (err) {
      console.log('Not a valid ObjectId, trying as idNumber:', studentId);
      student = await usersCollection.findOne({ idNumber: studentId });
    }
    
    if (!student) {
      console.log('❌ Student not found with ID:', studentId);
      return res.status(404).json({ message: 'Student not found' });
    }
    
    console.log('✅ Found student:', student.firstName, student.lastName);
    
    // Try multiple ways to find user responses
    let hasResponses = null;
    const possibleUserIds = [
      student.idNumber?.toString(),
      student._id.toString(),
      studentId
    ];
    
    // Try each possible user ID until we find a match
    for (const userId of possibleUserIds) {
      if (!userId) continue;
      
      hasResponses = await userResponsesCollection.findOne({
        userId: userId
      });
      
      if (hasResponses) break;
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