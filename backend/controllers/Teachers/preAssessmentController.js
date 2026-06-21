const mongoose = require('mongoose');
const { S3Client, PutObjectCommand, DeleteObjectCommand } = require('@aws-sdk/client-s3');
const { Upload } = require('@aws-sdk/lib-storage');
const gcsStorage = require('../../utils/gcsStorage'); // uploads now go to GCS
const { PreAssessment, QuestionType } = require('../../models/Teachers/preAssessmentModel');

// Configure AWS S3 client
const s3Client = new S3Client({
  region: process.env.AWS_REGION,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  },
});

// Get the correct databases
const getTestDb = () => mongoose.connection.useDb('test'); // for users
const getPreAssessmentDb = () => mongoose.connection.useDb('Pre_Assessment'); // for assessment data

// Helper function to convert display category names to database keys
const normalizeCategoryKey = (categoryName) => {
  if (!categoryName) return null;
  
  // Convert display names from database to count keys
  const categoryMap = {
    'Alphabet Knowledge': 'alphabet_knowledge',
    'Phonological Awareness': 'phonological_awareness', 
    'Decoding': 'decoding',
    'Word Recognition': 'word_recognition',
    'Reading Comprehension': 'reading_comprehension'
  };
  
  return categoryMap[categoryName] || categoryName.toLowerCase().replace(/ /g, '_');
};

// Helper function to recalculate category counts from questions
const recalculateCategoryCounts = (questions) => {
  const counts = {
    alphabet_knowledge: 0,
    phonological_awareness: 0,
    decoding: 0,
    word_recognition: 0,
    reading_comprehension: 0
  };
  
  if (questions && questions.length > 0) {
    questions.forEach(question => {
      // Use the category field from the database
      const categoryKey = normalizeCategoryKey(question.category);
      if (categoryKey && counts.hasOwnProperty(categoryKey)) {
        counts[categoryKey]++;
      }
    });
  }
  
  return counts;
};

// Helper function to calculate dynamic scoring rules based on DepEd standards
const calculateScoringRules = (categoryCounts) => {
  // Calculate Part 1 total (first 4 categories) from actual questions
  const part1Total = categoryCounts.alphabet_knowledge +
                    categoryCounts.phonological_awareness +
                    categoryCounts.decoding +
                    categoryCounts.word_recognition;
  
  const readingComprehensionTotal = categoryCounts.reading_comprehension;
  
  // Only generate scoring rules if we have questions
  if (part1Total > 0) {
    // Calculate scoring thresholds based on DepEd standards (natural proportional scaling)
    // From DepEd: 16/30 = 53.33% threshold for Low Emerging
    const lowEmergingMax = Math.floor(part1Total * 0.5333); // 53.33% threshold
    const part1Passing = lowEmergingMax + 1; // Above 53.33%
    const part1Max = part1Total; // Maximum possible score
    
    // Calculate RC requirements using DepEd ratios (based on 5 RC questions in standard)
    // DepEd ratios: High Emerging 0%, Developing ≥20%, Transitioning 40-60%, Grade Level ≥80%
    let rcHigh, rcDeveloping, rcTransitioningMin, rcTransitioningMax, rcGradeLevel;
    
    if (readingComprehensionTotal > 0) {
      rcHigh = [0, 0]; // Always 0% - cannot answer any
      rcDeveloping = [Math.max(1, Math.ceil(readingComprehensionTotal * 0.2)), readingComprehensionTotal]; // ≥20%
      rcTransitioningMin = Math.max(2, Math.ceil(readingComprehensionTotal * 0.4)); // ≥40%
      rcTransitioningMax = Math.min(readingComprehensionTotal, Math.max(rcTransitioningMin, Math.ceil(readingComprehensionTotal * 0.6))); // ≤60%
      rcGradeLevel = [Math.max(Math.min(4, readingComprehensionTotal), Math.ceil(readingComprehensionTotal * 0.8)), readingComprehensionTotal]; // ≥80%
    } else {
      rcHigh = [0, 0];
      rcDeveloping = [0, 0];
      rcTransitioningMin = 0;
      rcTransitioningMax = 0;
      rcGradeLevel = [0, 0];
    }
    
    return {
      "Low Emerging": {
        part1ScoreRange: [0, lowEmergingMax],
        readingPercentageRange: null,
        comprehensionCorrectRange: null,
        description: `Learner with scores 0 to ${lowEmergingMax} upon administration of Part 1 (${part1Total} questions)`
      },
      "High Emerging": {
        part1ScoreRange: [part1Passing, part1Max],
        readingPercentageRange: [0, 25],
        comprehensionCorrectRange: rcHigh,
        description: `Learner with scores ${part1Passing} to ${part1Max} upon administration of Part 1 and reads less than 25% and cannot answer any of the questions`
      },
      "Developing": {
        part1ScoreRange: [part1Passing, part1Max],
        readingPercentageRange: [26, 50],
        comprehensionCorrectRange: rcDeveloping,
        description: `Learner with scores ${part1Passing} to ${part1Max} upon administration of Part 1 and reads between 26-50% and answers atleast ${rcDeveloping[0]} question${rcDeveloping[0] > 1 ? 's' : ''} correctly`
      },
      "Transitioning": {
        part1ScoreRange: [part1Passing, part1Max],
        readingPercentageRange: [51, 75],
        comprehensionCorrectRange: [rcTransitioningMin, rcTransitioningMax],
        description: `Learner with scores ${part1Passing} to ${part1Max} upon administration of Part 1 and reads between 51-75% and answers atleast ${rcTransitioningMin}-${rcTransitioningMax} questions correctly`
      },
      "At Grade Level": {
        part1ScoreRange: [part1Passing, part1Max],
        readingPercentageRange: [76, 100],
        comprehensionCorrectRange: rcGradeLevel,
        description: `Learner with scores ${part1Passing} to ${part1Max} upon administration of Part 1 and reads between 76-100% and answers atleast ${rcGradeLevel[0]} to ${rcGradeLevel[1]} questions correctly`
      }
    };
  } else {
    // Default scoring rules when no questions exist yet
    return {
      "Low Emerging": {
        part1ScoreRange: [0, 0],
        readingPercentageRange: null,
        comprehensionCorrectRange: null,
        description: "Scoring will be calculated based on actual questions added to the assessment"
      },
      "High Emerging": {
        part1ScoreRange: [0, 0],
        readingPercentageRange: [0, 25],
        comprehensionCorrectRange: [0, 0],
        description: "Scoring will be calculated based on actual questions added to the assessment"
      },
      "Developing": {
        part1ScoreRange: [0, 0],
        readingPercentageRange: [26, 50],
        comprehensionCorrectRange: [0, 0],
        description: "Scoring will be calculated based on actual questions added to the assessment"
      },
      "Transitioning": {
        part1ScoreRange: [0, 0],
        readingPercentageRange: [51, 75],
        comprehensionCorrectRange: [0, 0],
        description: "Scoring will be calculated based on actual questions added to the assessment"
      },
      "At Grade Level": {
        part1ScoreRange: [0, 0],
        readingPercentageRange: [76, 100],
        comprehensionCorrectRange: [0, 0],
        description: "Scoring will be calculated based on actual questions added to the assessment"
      }
    };
  }
};

// Get all pre-assessments
exports.getAllPreAssessments = async (req, res) => {
  try {
    const preAssessmentCollection = getPreAssessmentDb().collection('pre-assessment');
    
    console.log('Querying pre-assessment collection...');
    const preAssessments = await preAssessmentCollection.find({}).toArray();
    console.log(`Found ${preAssessments.length} pre-assessments`);
    
    // Format the response to include only necessary fields and add category counts
    const formattedAssessments = preAssessments.map(assessment => {
      const categoryCounts = {
        alphabet_knowledge: 0,
        phonological_awareness: 0,
        decoding: 0,
        word_recognition: 0,
        reading_comprehension: 0
      };
      
      // Count questions by category (using category field from database)
      if (assessment.questions && assessment.questions.length > 0) {
        assessment.questions.forEach(question => {
          const categoryKey = normalizeCategoryKey(question.category);
          if (categoryKey && categoryCounts.hasOwnProperty(categoryKey)) {
            categoryCounts[categoryKey]++;
          }
        });
      }
      
      // Calculate totalQuestions dynamically from actual questions count
      const dynamicTotalQuestions = assessment.questions ? assessment.questions.length : 0;
      
      return {
        _id: assessment._id,
        assessmentId: assessment.assessmentId,
        title: assessment.title,
        description: assessment.description,
        language: assessment.language,
        status: assessment.status,
        totalQuestions: dynamicTotalQuestions,
        type: assessment.type,
        categoryCounts: categoryCounts
      };
    });
    
    res.json(formattedAssessments);
  } catch (error) {
    console.error('Error fetching pre-assessments:', error);
    res.status(500).json({ message: 'Error fetching pre-assessments', error: error.message });
  }
};

// Get a single pre-assessment by ID
exports.getPreAssessmentById = async (req, res) => {
  try {
    const preAssessmentId = req.params.id;
    
    const preAssessmentCollection = getPreAssessmentDb().collection('pre-assessment');
    
    let preAssessment;
    try {
      // Try as MongoDB ObjectId
      preAssessment = await preAssessmentCollection.findOne({ 
        _id: new mongoose.Types.ObjectId(preAssessmentId) 
      });
    } catch (err) {
      // Try as assessmentId string
      preAssessment = await preAssessmentCollection.findOne({ 
        assessmentId: preAssessmentId 
      });
    }
    
    if (!preAssessment) {
      return res.status(404).json({ message: 'Pre-assessment not found' });
    }
    
    // Calculate category counts
    const categoryCounts = {
      alphabet_knowledge: 0,
      phonological_awareness: 0,
      decoding: 0,
      word_recognition: 0,
      reading_comprehension: 0
    };
    
    // Count questions by category (using category field from database)
    if (preAssessment.questions && preAssessment.questions.length > 0) {
      preAssessment.questions.forEach(question => {
        const categoryKey = normalizeCategoryKey(question.category);
        if (categoryKey && categoryCounts.hasOwnProperty(categoryKey)) {
          categoryCounts[categoryKey]++;
        }
      });
    }
    
    // Add category counts and dynamic totalQuestions to the response
    preAssessment.categoryCounts = categoryCounts;
    preAssessment.totalQuestions = preAssessment.questions ? preAssessment.questions.length : 0;
    
    res.json(preAssessment);
    
  } catch (error) {
    console.error('Error fetching pre-assessment:', error);
    res.status(500).json({ message: 'Error fetching pre-assessment', error: error.message });
  }
};

// Create a new pre-assessment
exports.createPreAssessment = async (req, res) => {
  try {
    const preAssessmentData = req.body;
    
    // Always set assessmentId to "1" as per sample JSON structure
    preAssessmentData.assessmentId = "1";
    
    // Validate required fields
    if (!preAssessmentData.title || !preAssessmentData.language) {
      return res.status(400).json({ message: 'Missing required fields: title, language' });
    }
    
    // Set default values if not provided - always set status to 'active' and isActive to true
    preAssessmentData.status = 'active';
    preAssessmentData.isActive = true;
    preAssessmentData.type = preAssessmentData.type || 'pre_assessment';
    preAssessmentData.totalQuestions = preAssessmentData.totalQuestions || 0;
    
    // Initialize categoryCounts - always start with zeros and calculate from questions
    preAssessmentData.categoryCounts = {
      alphabet_knowledge: 0,
      phonological_awareness: 0,
      decoding: 0,
      word_recognition: 0,
      reading_comprehension: 0
    };
    
    // If questions are provided, calculate categoryCounts from actual questions
    if (preAssessmentData.questions && preAssessmentData.questions.length > 0) {
      const counts = {
        alphabet_knowledge: 0,
        phonological_awareness: 0,
        decoding: 0,
        word_recognition: 0,
        reading_comprehension: 0
      };
      
      preAssessmentData.questions.forEach(question => {
        const categoryKey = normalizeCategoryKey(question.category);
        if (categoryKey && counts.hasOwnProperty(categoryKey)) {
          counts[categoryKey]++;
        }
      });
      
      preAssessmentData.categoryCounts = counts;
      preAssessmentData.totalQuestions = preAssessmentData.questions.length;
    }
    
    // Calculate dynamic scoring rules based on actual question counts - DepEd curriculum standards
    preAssessmentData.scoringRules = calculateScoringRules(preAssessmentData.categoryCounts);
    
    // Check if assessment with same ID already exists - if so, update it instead of creating duplicate
    const preAssessmentCollection = getPreAssessmentDb().collection('pre-assessment');
    const existingAssessment = await preAssessmentCollection.findOne({ assessmentId: preAssessmentData.assessmentId });
    
    let result;
    if (existingAssessment) {
      // Update the existing assessment instead of creating a duplicate
      result = await preAssessmentCollection.updateOne(
        { assessmentId: preAssessmentData.assessmentId },
        { $set: preAssessmentData }
      );
      
      res.status(200).json({
        message: 'Pre-assessment updated successfully',
        assessmentId: preAssessmentData.assessmentId,
        _id: existingAssessment._id
      });
    } else {
      // Insert the new pre-assessment
      result = await preAssessmentCollection.insertOne(preAssessmentData);
      
      res.status(201).json({
        message: 'Pre-assessment created successfully',
        assessmentId: preAssessmentData.assessmentId,
        _id: result.insertedId
      });
    }
  } catch (error) {
    console.error('Error creating pre-assessment:', error);
    res.status(500).json({ message: 'Error creating pre-assessment', error: error.message });
  }
};

// Update an existing pre-assessment
exports.updatePreAssessment = async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = req.body;
    
    // Remove _id from update data if present
    if (updateData._id) {
      delete updateData._id;
    }
    
    const preAssessmentCollection = getPreAssessmentDb().collection('pre-assessment');
    
    let filter;
    try {
      // Try as MongoDB ObjectId
      filter = { _id: new mongoose.Types.ObjectId(id) };
    } catch (err) {
      // Try as assessmentId string
      filter = { assessmentId: id };
    }
    
    // Check if assessment exists
    const existingAssessment = await preAssessmentCollection.findOne(filter);
    if (!existingAssessment) {
      return res.status(404).json({ message: 'Pre-assessment not found' });
    }
    
    // Always ensure status is 'active' and isActive is true
    updateData.status = 'active';
    updateData.isActive = true;
    
    // If questions are being updated, recalculate categoryCounts, totalQuestions, and scoringRules
    if (updateData.questions) {
      updateData.categoryCounts = recalculateCategoryCounts(updateData.questions);
      updateData.totalQuestions = updateData.questions.length;
      
      // Recalculate dynamic scoring rules based on updated question counts
      updateData.scoringRules = calculateScoringRules(updateData.categoryCounts);
    }
    
    // Add logging to help debug update issues
    console.log('Update filter:', filter);
    console.log('Update data keys:', Object.keys(updateData));
    console.log('Existing assessment ID:', existingAssessment._id);
    console.log('Update data questions count:', updateData.questions ? updateData.questions.length : 'no questions field');
    console.log('Existing questions count:', existingAssessment.questions ? existingAssessment.questions.length : 'no questions field');

    // Update the assessment
    const result = await preAssessmentCollection.updateOne(filter, { $set: updateData });

    console.log('Update result:', {
      matched: result.matchedCount,
      modified: result.modifiedCount,
      acknowledged: result.acknowledged
    });

    if (result.modifiedCount === 0) {
      console.log('No modifications made - possible reasons:');
      console.log('- Data identical to existing');
      console.log('- Update filter did not match');
      console.log('- Invalid update data');
      return res.status(400).json({
        message: 'Please make changes before updating the question',
        details: {
          matched: result.matchedCount,
          modified: result.modifiedCount,
          reason: 'no_changes_detected'
        }
      });
    }
    
    // Fetch the updated document to return
    const updatedDocument = await preAssessmentCollection.findOne(filter);
    console.log('Updated document questions count:', updatedDocument.questions ? updatedDocument.questions.length : 'no questions field');

    res.json({
      message: 'Pre-assessment updated successfully',
      modifiedCount: result.modifiedCount,
      data: updatedDocument
    });
  } catch (error) {
    console.error('Error updating pre-assessment:', error);
    res.status(500).json({ message: 'Error updating pre-assessment', error: error.message });
  }
};

// Delete a pre-assessment
exports.deletePreAssessment = async (req, res) => {
  try {
    const { id } = req.params;
    const preAssessmentCollection = getPreAssessmentDb().collection('pre-assessment');
    
    let filter;
    try {
      // Try as MongoDB ObjectId
      filter = { _id: new mongoose.Types.ObjectId(id) };
    } catch (err) {
      // Try as assessmentId string
      filter = { assessmentId: id };
    }
    
    // Check if assessment exists
    const existingAssessment = await preAssessmentCollection.findOne(filter);
    if (!existingAssessment) {
      return res.status(404).json({ message: 'Pre-assessment not found' });
    }
    
    // Delete the assessment
    const result = await preAssessmentCollection.deleteOne(filter);
    
    res.json({
      message: 'Pre-assessment deleted successfully',
      deletedCount: result.deletedCount
    });
  } catch (error) {
    console.error('Error deleting pre-assessment:', error);
    res.status(500).json({ message: 'Error deleting pre-assessment', error: error.message });
  }
};

// Upload media files (images, audio) to S3
exports.uploadMedia = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'No file uploaded' });
    }
    
    const file = req.file;
    const fileType = file.mimetype.split('/')[0]; // 'image' or 'audio'
    const fileExt = file.originalname.split('.').pop();
    
    // Generate a unique file name with pre-assessment path
    const fileName = `pre-assessment/${fileType}/${Date.now()}-${Math.random().toString(36).substring(2, 15)}.${fileExt}`;
    
    // Upload to S3
    const params = {
      Bucket: process.env.AWS_S3_BUCKET || 'literexia-bucket',
      Key: fileName,
      Body: file.buffer,
      ContentType: file.mimetype,
    };
    
    const fileUrl = await gcsStorage.uploadBuffer(params.Body, params.Key, params.ContentType);

    res.json({
      message: 'File uploaded successfully',
      fileUrl: fileUrl,
      fileKey: params.Key,
      s3Path: fileName
    });
  } catch (error) {
    console.error('Error uploading file to GCS:', error);
    res.status(500).json({ message: 'Error uploading file', error: error.message });
  }
};

// Delete media file from S3
exports.deleteMedia = async (req, res) => {
  try {
    const { fileKey } = req.params;
    
    if (!fileKey) {
      return res.status(400).json({ message: 'File key is required' });
    }
    
    // Delete from GCS
    await gcsStorage.storage.bucket(gcsStorage.BUCKET).file(fileKey).delete({ ignoreNotFound: true });

    res.json({
      message: 'File deleted successfully',
      fileKey
    });
  } catch (error) {
    console.error('Error deleting file from S3:', error);
    res.status(500).json({ message: 'Error deleting file', error: error.message });
  }
};

// Get all question types
exports.getAllQuestionTypes = async (req, res) => {
  try {
    const questionTypesCollection = getPreAssessmentDb().collection('question_types');
    const questionTypes = await questionTypesCollection.find({}).toArray();
    
    res.json(questionTypes);
  } catch (error) {
    console.error('Error fetching question types:', error);
    res.status(500).json({ message: 'Error fetching question types', error: error.message });
  }
};

// Create a new question type
exports.createQuestionType = async (req, res) => {
  try {
    const questionTypeData = req.body;
    
    // Validate required fields
    if (!questionTypeData.typeId || !questionTypeData.typeName) {
      return res.status(400).json({ message: 'Missing required fields: typeId, typeName' });
    }
    
    // Check if question type with same ID already exists
    const questionTypesCollection = getPreAssessmentDb().collection('question_types');
    const existingType = await questionTypesCollection.findOne({ typeId: questionTypeData.typeId });
    
    if (existingType) {
      return res.status(409).json({ message: `Question type with ID ${questionTypeData.typeId} already exists` });
    }
    
    // Insert the new question type
    const result = await questionTypesCollection.insertOne(questionTypeData);
    
    res.status(201).json({
      message: 'Question type created successfully',
      typeId: questionTypeData.typeId,
      _id: result.insertedId
    });
  } catch (error) {
    console.error('Error creating question type:', error);
    res.status(500).json({ message: 'Error creating question type', error: error.message });
  }
};

// Update an existing question type
exports.updateQuestionType = async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = req.body;
    
    // Remove _id from update data if present
    if (updateData._id) {
      delete updateData._id;
    }
    
    const questionTypesCollection = getPreAssessmentDb().collection('question_types');
    
    let filter;
    try {
      // Try as MongoDB ObjectId
      filter = { _id: new mongoose.Types.ObjectId(id) };
    } catch (err) {
      // Try as typeId string
      filter = { typeId: id };
    }
    
    // Check if question type exists
    const existingType = await questionTypesCollection.findOne(filter);
    if (!existingType) {
      return res.status(404).json({ message: 'Question type not found' });
    }
    
    // Update the question type
    const result = await questionTypesCollection.updateOne(filter, { $set: updateData });
    
    if (result.modifiedCount === 0) {
      return res.status(400).json({ message: 'No changes made to the question type' });
    }
    
    res.json({
      message: 'Question type updated successfully',
      modifiedCount: result.modifiedCount
    });
  } catch (error) {
    console.error('Error updating question type:', error);
    res.status(500).json({ message: 'Error updating question type', error: error.message });
  }
};

// Delete a question type
exports.deleteQuestionType = async (req, res) => {
  try {
    const { id } = req.params;
    const questionTypesCollection = getPreAssessmentDb().collection('question_types');
    
    let filter;
    try {
      // Try as MongoDB ObjectId
      filter = { _id: new mongoose.Types.ObjectId(id) };
    } catch (err) {
      // Try as typeId string
      filter = { typeId: id };
    }
    
    // Check if question type exists
    const existingType = await questionTypesCollection.findOne(filter);
    if (!existingType) {
      return res.status(404).json({ message: 'Question type not found' });
    }
    
    // Delete the question type
    const result = await questionTypesCollection.deleteOne(filter);
    
    res.json({
      message: 'Question type deleted successfully',
      deletedCount: result.deletedCount
    });
  } catch (error) {
    console.error('Error deleting question type:', error);
    res.status(500).json({ message: 'Error deleting question type', error: error.message });
  }
};

exports.getPreAssessmentResults = async (req, res) => {
  try {
    const studentId = req.params.id;
    console.log('⭐ Getting pre-assessment results for student ID:', studentId);
    
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
      const idNum = parseInt(studentId);
      if (!isNaN(idNum)) {
        student = await usersCollection.findOne({ idNumber: idNum });
      }
    }
    
    if (!student) {
      console.log('❌ Student not found with ID:', studentId);
      return res.status(404).json({ message: 'Student not found' });
    }
    
    console.log('✅ Found student:', student.firstName, student.lastName, 'idNumber:', student.idNumber);
    
    // Find ALL individual user responses for this student from Pre_Assessment database
    // Based on CLAUDE.md sample, user_responses are individual records per question
    const possibleStudentIds = [
      student.idNumber,
      parseInt(studentId),
      student._id
    ].filter(id => id !== null && id !== undefined);
    
    let allUserResponses = [];
    
    // Try each possible student ID to find responses
    for (const possibleId of possibleStudentIds) {
      const responses = await userResponsesCollection.find({
        studentId: possibleId,
        assessmentId: "1" // Always use assessmentId "1" as per sample
      }).toArray();
      
      if (responses && responses.length > 0) {
        allUserResponses = responses;
        console.log(`✅ Found ${responses.length} individual responses for studentId: ${possibleId}`);
        break;
      }
    }
    
    if (!allUserResponses || allUserResponses.length === 0) {
      return res.status(404).json({ 
        message: 'No pre-assessment results found for this student',
        studentId: studentId,
        hasCompleted: false
      });
    }
    
    // Get the pre-assessment structure
    const preAssessment = await preAssessmentCollection.findOne({
      assessmentId: "1"
    });
    
    if (!preAssessment) {
      console.error('Pre-assessment structure not found for assessmentId: 1');
      return res.status(404).json({ message: 'Pre-assessment structure not found' });
    }
    
    console.log('✅ Found pre-assessment structure:', preAssessment.title);
    
    // Process individual responses into the expected format
    const processedResults = await aggregateIndividualResponses(allUserResponses, preAssessment, student);
    
    res.json(processedResults);
    
  } catch (error) {
    console.error('Error fetching pre-assessment results:', error);
    res.status(500).json({ 
      message: 'Error fetching pre-assessment results', 
      error: error.message 
    });
  }
};

// Function to aggregate individual user responses into assessment results format
async function aggregateIndividualResponses(allUserResponses, preAssessment, student) {
  console.log('🔄 Aggregating individual responses into assessment format...');
  
  // Group responses by category
  const responsesByCategory = {};
  const categoryStats = {};
  let totalCorrect = 0;
  
  // Initialize category stats
  const categories = ['Alphabet Knowledge', 'Phonological Awareness', 'Decoding', 'Word Recognition', 'Reading Comprehension'];
  categories.forEach(category => {
    responsesByCategory[category] = [];
    categoryStats[category] = {
      correct: 0,
      total: 0,
      percentage: 0
    };
  });
  
  // Process each individual response and calculate total time
  let totalResponseTime = 0;
  allUserResponses.forEach(response => {
    const category = response.category;
    if (responsesByCategory[category]) {
      responsesByCategory[category].push(response);
      categoryStats[category].total++;
      
      // Add response time to total
      if (response.responseTime && typeof response.responseTime === 'number') {
        totalResponseTime += response.responseTime;
      }
      
      if (response.isCorrect) {
        categoryStats[category].correct++;
        totalCorrect++;
      }
    }
  });
  
  // Calculate percentages
  categories.forEach(category => {
    const stats = categoryStats[category];
    stats.percentage = stats.total > 0 ? Math.round((stats.correct / stats.total) * 100) : 0;
  });
  
  // Calculate Part 1 Score (first 4 categories)
  const part1Categories = ['Alphabet Knowledge', 'Phonological Awareness', 'Decoding', 'Word Recognition'];
  const part1Correct = part1Categories.reduce((sum, cat) => sum + categoryStats[cat].correct, 0);
  const part1Total = part1Categories.reduce((sum, cat) => sum + categoryStats[cat].total, 0);
  
  // Get Reading Comprehension details for percentage calculation
  const rcStats = categoryStats['Reading Comprehension'];
  const readingPercentage = rcStats.percentage;
  
  // Determine reading level based on scoring rules
  const scoringRules = preAssessment.scoringRules || {};
  let determinedReadingLevel = 'Not Assessed';
  
  if (part1Correct <= 16) {
    determinedReadingLevel = 'Low Emerging';
  } else if (part1Correct >= 17) {
    if (readingPercentage <= 25 && rcStats.correct === 0) {
      determinedReadingLevel = 'High Emerging';
    } else if (readingPercentage >= 26 && readingPercentage <= 50 && rcStats.correct >= 1) {
      determinedReadingLevel = 'Developing';
    } else if (readingPercentage >= 51 && readingPercentage <= 75 && rcStats.correct >= 2) {
      determinedReadingLevel = 'Transitioning';
    } else if (readingPercentage >= 76 && rcStats.correct >= 4) {
      determinedReadingLevel = 'At Grade Level';
    } else {
      determinedReadingLevel = 'High Emerging'; // Default for scores 17-30 not meeting other criteria
    }
  }
  
  // Build the results structure
  const results = {
    studentId: student._id,
    studentName: `${student.firstName} ${student.lastName}`,
    studentInfo: {
      firstName: student.firstName,
      lastName: student.lastName,
      age: student.age,
      gradeLevel: student.gradeLevel,
      section: student.section
    },
    assessmentId: "1",
    readingLevel: student.readingLevel || determinedReadingLevel,
    overallScore: Math.max(0, Math.min(100, student.readingPercentage || 0)), // Sanitize: 0-100 range
    totalQuestions: Math.max(1, preAssessment.totalQuestions || 45), // Use total from pre-assessment structure
    correctAnswers: Math.max(0, Math.round(((preAssessment.totalQuestions || 45) * (student.readingPercentage || 0)) / 100)), // Calculate based on stored percentage and actual total
    part1Score: Math.max(0, part1Correct || 0), // Sanitize: >= 0
    part1Total: Math.max(1, part1Total || 1), // Sanitize: minimum 1
    readingComprehensionScore: Math.max(0, rcStats.correct || 0), // Sanitize: >= 0
    readingComprehensionTotal: Math.max(0, rcStats.total || 0), // Sanitize: >= 0
    readingComprehensionPercentage: Math.max(0, Math.min(100, readingPercentage || 0)), // Sanitize: 0-100 range
    completedAt: student.lastAssessmentDate || new Date().toISOString(),
    totalResponseTime: Math.max(0, Math.round(totalResponseTime || 0)), // Sanitize: >= 0 seconds
    averageResponseTime: allUserResponses.length > 0 ? Math.max(0, Math.round((totalResponseTime || 0) / allUserResponses.length)) : 0, // Sanitize: avoid division by zero
    hasCompleted: true,
    categoryScores: {},
    skillDetails: [],
    focusAreas: []
  };
  
  // Process each category to build skill details
  categories.forEach(category => {
    const categoryResponses = responsesByCategory[category];
    const stats = categoryStats[category];
    const categoryKey = normalizeCategoryKey(category);
    
    // Add to category scores
    results.categoryScores[categoryKey] = {
      correct: stats.correct,
      total: stats.total,
      percentage: stats.percentage
    };
    
    // Get questions from pre-assessment for this category
    const categoryQuestions = preAssessment.questions.filter(q => q.category === category);
    
    let skillDetail;
    
    if (category === 'Reading Comprehension') {
      skillDetail = processReadingComprehensionCategory(categoryQuestions, categoryResponses, stats);
    } else if (category === 'Phonological Awareness') {
      skillDetail = processPhonologicalAwarenessCategory(categoryQuestions, categoryResponses, stats);
    } else if (category === 'Decoding') {
      skillDetail = processDecodingCategory(categoryQuestions, categoryResponses, stats);
    } else if (category === 'Word Recognition') {
      skillDetail = processWordRecognitionCategory(categoryQuestions, categoryResponses, stats);
    } else {
      // Alphabet Knowledge and other categories
      skillDetail = processAlphabetKnowledgeCategory(categoryQuestions, categoryResponses, stats);
    }
    
    skillDetail.category = categoryKey;
    skillDetail.categoryName = category;
    results.skillDetails.push(skillDetail);
    
    // Add to focus areas if score is below 75%
    if (stats.percentage < 75) {
      results.focusAreas.push(category);
    }
  });
  
  console.log('✅ Successfully aggregated individual responses');
  console.log(`📊 Overall Score: ${results.overallScore}% (${results.correctAnswers}/${results.totalQuestions})`);
  console.log(`📚 Reading Level: ${results.readingLevel}`);
  console.log(`🎯 Part 1 Score: ${part1Correct}/${part1Total}`);
  console.log(`⏱️ Total Response Time: ${results.totalResponseTime} seconds (${Math.round(results.totalResponseTime/60)}m ${results.totalResponseTime%60}s)`);
  console.log(`📝 Processed ${allUserResponses.length} user responses`);
  
  return results;
}

// Process Reading Comprehension category (sentence type questions)
function processReadingComprehensionCategory(questions, responses, stats) {
  const processedQuestions = questions.map(question => {
    // Find the response for this question
    const response = responses.find(r => r.questionId === question.questionId);
    
    const passages = question.passages || [];
    const sentenceQuestions = question.sentenceQuestions || [];
    
    // Get the full passage text
    const passageText = passages.map(passage => passage.pageText).join(' ').trim();
    
    // Get the main comprehension question and correct answer
    const mainQuestion = sentenceQuestions.length > 0 ? sentenceQuestions[0] : {};
    const correctAnswerText = mainQuestion.correctAnswer || 'Unknown';
    const acceptableAnswers = mainQuestion.acceptableAnswers || [];
    
    // Get student's answer
    let studentAnswerText = 'No answer';
    if (response && response.response && Array.isArray(response.response) && response.response.length > 0) {
      studentAnswerText = response.response[0];
    }
    
    // Check if student answer matches any acceptable answer
    let isAcceptableAnswer = false;
    if (studentAnswerText !== 'No answer') {
      const studentLower = studentAnswerText.toLowerCase().trim();
      const correctLower = correctAnswerText.toLowerCase().trim();
      
      isAcceptableAnswer = studentLower === correctLower || 
                          acceptableAnswers.some(acceptable => 
                            acceptable.toLowerCase().trim() === studentLower
                          );
    }
    
    return {
      questionId: question.questionId,
      questionText: question.questionText,
      questionType: question.questionType,
      difficultyLevel: question.difficultyLevel,
      passages: passages,
      passageText: passageText,
      sentenceQuestions: sentenceQuestions,
      mainQuestion: mainQuestion,
      correctAnswerText: correctAnswerText,
      acceptableAnswers: acceptableAnswers,
      studentResponse: response ? response.response : null,
      studentAnswerText: studentAnswerText,
      isAcceptableAnswer: isAcceptableAnswer,
      isCorrect: response ? response.isCorrect : false,
      responseTime: response ? response.responseTime : 0,
      answeredAt: response ? response.answeredAt : null
    };
  });
  
  return {
    score: stats.percentage,
    correct: stats.correct,
    total: stats.total,
    questions: processedQuestions
  };
}

// Process Phonological Awareness category (malapantig type questions)
function processPhonologicalAwarenessCategory(questions, responses, stats) {
  const processedQuestions = questions.map(question => {
    const response = responses.find(r => r.questionId === question.questionId);
    
    // Process the audio-visual matching pairs
    let audioTexts = [];
    let matchingOptions = [];
    let correctPairs = [];
    let studentMatches = [];
    
    if (question.questionSet) {
      audioTexts = question.questionSet.audioTexts || [];
      matchingOptions = question.questionSet.matchingOptions || [];
      correctPairs = question.questionSet.correctPairs || [];
    }
    
    // Process student's matching responses
    if (response && response.response && Array.isArray(response.response)) {
      studentMatches = response.response.map(match => ({
        audio: match.audio,
        studentMatch: match.match,
        isCorrectMatch: correctPairs.some(pair => 
          Object.keys(pair)[0] === match.audio && pair[match.audio] === match.match
        )
      }));
    }
    
    return {
      questionId: question.questionId,
      questionText: question.questionText,
      questionType: question.questionType,
      difficultyLevel: question.difficultyLevel,
      questionSet: question.questionSet,
      audioTexts: audioTexts,
      matchingOptions: matchingOptions,
      correctPairs: correctPairs,
      studentResponse: response ? response.response : null,
      studentMatches: studentMatches,
      correctMatches: response ? response.correctMatches : 0,
      totalMatches: response ? response.totalMatches : 0,
      isCorrect: response ? response.isCorrect : false,
      responseTime: response ? response.responseTime : 0,
      answeredAt: response ? response.answeredAt : null
    };
  });
  
  return {
    score: stats.percentage,
    correct: stats.correct,
    total: stats.total,
    questions: processedQuestions
  };
}

// Process Decoding category (decode type questions)
function processDecodingCategory(questions, responses, stats) {
  const processedQuestions = questions.map(question => {
    const response = responses.find(r => r.questionId === question.questionId);
    
    // Format student answer and correct answer for display
    let studentAnswerText = 'No answer';
    let correctAnswerText = 'Unknown';
    
    if (response && response.response && Array.isArray(response.response)) {
      studentAnswerText = response.response.join('');
    }
    
    if (question.correctSequence && Array.isArray(question.correctSequence)) {
      correctAnswerText = question.correctSequence.join('');
    }
    
    // Determine if it's a fill-in-the-blank question or complete word question
    const isBlankQuestion = question.blankPosition !== null && question.blankPosition !== undefined;
    let questionDisplayText = question.questionText;
    
    if (isBlankQuestion && question.displaySequence) {
      // Show the word with blank filled by student answer
      const displayWithAnswer = [...question.displaySequence];
      if (response && response.response && response.response.length > 0) {
        displayWithAnswer[question.blankPosition] = response.response[0] || '_';
      }
      questionDisplayText = `${question.questionText} → ${displayWithAnswer.join('')}`;
    }
    
    return {
      questionId: question.questionId,
      questionText: question.questionText,
      questionDisplayText: questionDisplayText,
      questionType: question.questionType,
      difficultyLevel: question.difficultyLevel,
      questionImage: question.questionImage,
      displaySequence: question.displaySequence,
      blankPosition: question.blankPosition,
      dragElements: question.dragElements,
      correctSequence: question.correctSequence,
      studentResponse: response ? response.response : null,
      studentAnswerText: studentAnswerText,
      correctAnswerText: correctAnswerText,
      isBlankQuestion: isBlankQuestion,
      isCorrect: response ? response.isCorrect : false,
      responseTime: response ? response.responseTime : 0,
      answeredAt: response ? response.answeredAt : null
    };
  });
  
  return {
    score: stats.percentage,
    correct: stats.correct,
    total: stats.total,
    questions: processedQuestions
  };
}

// Process Word Recognition category (word type questions)
function processWordRecognitionCategory(questions, responses, stats) {
  const processedQuestions = questions.map(question => {
    const response = responses.find(r => r.questionId === question.questionId);
    
    // Format student answer text
    let studentAnswerText = 'No answer';
    let correctAnswerText = 'Unknown';
    
    if (response && response.response && Array.isArray(response.response)) {
      studentAnswerText = response.response.join(', ');
    }
    
    if (question.correctAnswer && Array.isArray(question.correctAnswer)) {
      correctAnswerText = question.correctAnswer.join(', ');
    }
    
    return {
      questionId: question.questionId,
      questionText: question.questionText,
      questionType: question.questionType,
      difficultyLevel: question.difficultyLevel,
      questionValue: question.questionValue,
      questionImage: question.questionImage,
      displayWord: question.displayWord,
      blankOptions: question.blankOptions,
      correctAnswer: question.correctAnswer,
      studentResponse: response ? response.response : null,
      studentAnswerText: studentAnswerText,
      correctAnswerText: correctAnswerText,
      isCorrect: response ? response.isCorrect : false,
      responseTime: response ? response.responseTime : 0,
      answeredAt: response ? response.answeredAt : null
    };
  });
  
  return {
    score: stats.percentage,
    correct: stats.correct,
    total: stats.total,
    questions: processedQuestions
  };
}

// Process Alphabet Knowledge category (patinig/katinig type questions)
function processAlphabetKnowledgeCategory(questions, responses, stats) {
  const processedQuestions = questions.map(question => {
    const response = responses.find(r => r.questionId === question.questionId);
    
    // Get student's selected option details
    let studentSelectedOption = null;
    let correctOption = null;
    
    if (question.options && response && response.response && response.response.length > 0) {
      const selectedOptionId = response.response[0]; // Get the optionId from response array
      studentSelectedOption = question.options.find(opt => opt.optionId === selectedOptionId);
      correctOption = question.options.find(opt => opt.isCorrect === true);
    }
    
    return {
      questionId: question.questionId,
      questionText: question.questionText,
      questionType: question.questionType,
      difficultyLevel: question.difficultyLevel,
      questionValue: question.questionValue,
      questionImage: question.questionImage,
      options: question.options,
      studentResponse: response ? response.response : null,
      studentSelectedOption: studentSelectedOption,
      studentAnswerText: studentSelectedOption ? studentSelectedOption.optionText : 'No answer',
      correctOption: correctOption,
      correctAnswerText: correctOption ? correctOption.optionText : 'Unknown',
      isCorrect: response ? response.isCorrect : false,
      responseTime: response ? response.responseTime : 0,
      answeredAt: response ? response.answeredAt : null
    };
  });
  
  return {
    score: stats.percentage,
    correct: stats.correct,
    total: stats.total,
    questions: processedQuestions
  };
}


function getCategoryDisplayName(categoryKey) {
  const categoryMap = {
    'alphabet_knowledge': 'Alphabet Knowledge',
    'phonological_awareness': 'Phonological Awareness',
    'decoding': 'Decoding',
    'word_recognition': 'Word Recognition',
    'reading_comprehension': 'Reading Comprehension'
  };
  
  return categoryMap[categoryKey] || categoryKey;
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


// Convert base64 images to S3 paths for a pre-assessment
exports.getPreAssessmentUserResponses = async (req, res) => {
  try {
    const studentObjectId = req.params.id;
    console.log('⭐ Getting pre-assessment user responses for student ObjectId:', studentObjectId);
    
    // First, get the user from test database to find their idNumber
    const testDb = getTestDb();
    const usersCollection = testDb.collection('users');
    
    // Look up user by ObjectId
    const user = await usersCollection.findOne({ 
      _id: new mongoose.Types.ObjectId(studentObjectId) 
    });
    
    if (!user) {
      console.log('❌ User not found with ObjectId:', studentObjectId);
      return res.json([]);
    }
    
    console.log('⭐ Found user with idNumber:', user.idNumber);
    
    // Now get user responses from the Pre_Assessment database using idNumber
    const preAssessmentDb = getPreAssessmentDb();
    const userResponsesCollection = preAssessmentDb.collection('user_responses');
    
    console.log('⭐ Searching for responses with studentId:', user.idNumber);
    
    // Find all user responses for this student using their idNumber
    console.log('⭐ Searching for responses with query:', { studentId: user.idNumber });
    
    // Try multiple possible studentId formats
    const possibleStudentIds = [
      user.idNumber,
      parseInt(user.idNumber),
      user.idNumber?.toString(),
      user._id,
      user._id?.toString()
    ].filter(id => id !== null && id !== undefined);
    
    console.log('⭐ Trying possible student IDs:', possibleStudentIds);
    
    let userResponses = [];
    for (const possibleId of possibleStudentIds) {
      const responses = await userResponsesCollection.find({ 
        studentId: possibleId 
      }).toArray();
      
      if (responses.length > 0) {
        console.log(`⭐ Found ${responses.length} responses with studentId:`, possibleId);
        userResponses = responses;
        break;
      }
    }
    
    console.log('⭐ Final result: Found', userResponses.length, 'user responses for student');
    
    if (userResponses.length === 0) {
      console.log('⭐ No user responses found for studentId:', user.idNumber);
      return res.json([]);
    }
    
    console.log('⭐ Successfully retrieved user responses');
    res.json(userResponses);
    
  } catch (error) {
    console.error('❌ Error getting pre-assessment user responses:', error);
    res.status(500).json({ 
      message: 'Error retrieving pre-assessment user responses', 
      error: error.message 
    });
  }
};

exports.convertImagesToS3 = async (req, res) => {
  try {
    const { id } = req.params;
    
    const preAssessmentCollection = getPreAssessmentDb().collection('pre-assessment');
    
    let filter;
    try {
      // Try as MongoDB ObjectId
      filter = { _id: new mongoose.Types.ObjectId(id) };
    } catch (err) {
      // Try as assessmentId string
      filter = { assessmentId: id };
    }
    
    // Check if assessment exists
    const preAssessment = await preAssessmentCollection.findOne(filter);
    if (!preAssessment) {
      return res.status(404).json({ message: 'Pre-assessment not found' });
    }
    
    // Process each question
    let updatedQuestions = [];
    let imagesProcessed = 0;
    
    for (const question of preAssessment.questions) {
      const updatedQuestion = { ...question };
      
      // Process question image if it exists and is base64
      if (question.questionImage && question.questionImage.startsWith('data:image')) {
        try {
          // Extract image data and MIME type
          const matches = question.questionImage.match(/^data:([A-Za-z-+\/]+);base64,(.+)$/);
          if (!matches || matches.length !== 3) {
            throw new Error('Invalid base64 image format');
          }
          
          const mimeType = matches[1];
          const base64Data = matches[2];
          const buffer = Buffer.from(base64Data, 'base64');
          
          // Generate filename
          const fileExt = mimeType.split('/')[1] || 'png';
          const fileName = `${question.questionId}_${Date.now()}.${fileExt}`;
          const key = `pre-assessment/images/${fileName}`;
          
          // S3 upload parameters
          const params = {
            Bucket: process.env.AWS_S3_BUCKET || 'literexia-bucket',
            Key: key,
            Body: buffer,
            ContentType: mimeType,
          };
          
          // Upload to GCS
          const s3Url = await gcsStorage.uploadBuffer(params.Body, params.Key, params.ContentType);

          // Update question with the uploaded image URL
          updatedQuestion.questionImage = s3Url;
          
          imagesProcessed++;
        } catch (error) {
          console.error(`Error processing image for question ${question.questionId}:`, error);
        }
      }
      
      updatedQuestions.push(updatedQuestion);
    }
    
    // Update the pre-assessment document
    const updateResult = await preAssessmentCollection.updateOne(
      filter,
      { $set: { questions: updatedQuestions } }
    );
    
    res.json({
      message: 'Pre-assessment images converted to S3 successfully',
      imagesProcessed,
      modifiedCount: updateResult.modifiedCount
    });
    
  } catch (error) {
    console.error('Error converting images to S3:', error);
    res.status(500).json({ message: 'Error converting images to S3', error: error.message });
  }
};