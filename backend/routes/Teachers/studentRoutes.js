// routes/Teachers/studentRoutes.js
const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const { auth } = require('../../middleware/auth');

// Helper function to handle different types of ObjectId formats
const toObjectIdIfPossible = (id) => {
  if (!id) return null;
  
  try {
    if (typeof id === 'object' && id.$oid) {
      return new mongoose.Types.ObjectId(id.$oid);
    }
    
    if (mongoose.Types.ObjectId.isValid(id)) {
      return new mongoose.Types.ObjectId(id);
    }
  } catch (error) {
    console.error('Error converting to ObjectId:', error);
  }
  
  return id;
};

// Helper function to get parent information from mobile_literexia.parent.profile
async function getParentInfo(student) {
  let parentInfo = "Not connected";
  
  if (!student.parentId) {
    return parentInfo;
  }
  
  try {
    // Connect to mobile_literexia database to get parent profile
    const mobileDb = mongoose.connection.useDb('mobile_literexia');
    const parentProfileCollection = mobileDb.collection('parent.profile');
    
    console.log("Looking for parent with ID:", JSON.stringify(student.parentId));
    
    let parentProfile = null;
    
    // If parentId is in object format with $oid property
    if (typeof student.parentId === 'object' && student.parentId.$oid) {
      try {
        const parentObjId = new mongoose.Types.ObjectId(student.parentId.$oid);
        console.log("Looking up parent by ObjectId:", parentObjId);
        
        // Find by _id
        parentProfile = await parentProfileCollection.findOne({ _id: parentObjId });
        console.log("Found parent by _id:", parentProfile ? "Yes" : "No");
        
        // If not found, try by userId
        if (!parentProfile) {
          parentProfile = await parentProfileCollection.findOne({ userId: parentObjId });
          console.log("Found parent by userId:", parentProfile ? "Yes" : "No");
        }
      } catch (err) {
        console.error("Error converting parentId to ObjectId:", err);
      }
    }
    
    // If parentId is a string or we didn't find a parent yet
    if (!parentProfile && (typeof student.parentId === 'string' || 
        (typeof student.parentId === 'object' && student.parentId.toString))) {
      
      const parentIdStr = typeof student.parentId === 'string' ? 
                         student.parentId : student.parentId.toString();
      
      if (mongoose.Types.ObjectId.isValid(parentIdStr)) {
        const objId = new mongoose.Types.ObjectId(parentIdStr);
        parentProfile = await parentProfileCollection.findOne({
          $or: [
            { _id: objId },
            { userId: objId }
          ]
        });
      }
    }
    
    if (parentProfile) {
      // Format full name with first, middle, and last name
      parentInfo = [
        parentProfile.firstName || '', 
        parentProfile.middleName ? parentProfile.middleName + ' ' : '',
        parentProfile.lastName || ''
      ].filter(part => part).join(' ');
      console.log("Parent found, name:", parentInfo);
    } else {
      console.log("No parent profile found for parentId:", student.parentId);
    }
  } catch (error) {
    console.error("Error finding parent:", error);
  }
  
  return parentInfo;
}

// Get all students
router.get('/students', auth, async (req, res) => {
  try {
    const { page = 1, limit = 10, search, readingLevelFilter } = req.query;
    const pageNum = parseInt(page);
    const limitNum = parseInt(limit);
    
    // Get access to test database with student data
    const testDb = mongoose.connection.useDb('test');
    const usersCollection = testDb.collection('users');
    
    // Build query filter
    let filter = {};
    
    if (search) {
      const searchRegex = new RegExp(search, 'i');
      filter = {
        $or: [
          { firstName: searchRegex },
          { lastName: searchRegex },
          { idNumber: isNaN(search) ? undefined : parseInt(search) }
        ].filter(condition => condition !== undefined)
      };
    }
    
    // Fetch students with pagination
    const students = await usersCollection
      .find(filter)
      .limit(limitNum)
      .skip((pageNum - 1) * limitNum)
      .toArray();
    
    // Create an array of transformed student promises
    const transformedStudentsPromises = students.map(async (student) => {
      // Get reading level directly from student record - NO CONVERSION
      let readingLevel = student.readingLevel || 'Not Assessed';
      let readingPercentage = student.readingPercentage || 0;
      
      // Apply reading level filtering if specified
      if (readingLevelFilter && readingLevelFilter !== 'all' && readingLevel !== readingLevelFilter) {
        return null; // This student doesn't match the filter
      }
      
      // Get parent information using the helper function
      const parentInfo = await getParentInfo(student);
      
      // Get pre-assessment completion status directly from the database
      const preAssessmentCompleted = student.preAssessmentCompleted === true;
      
      // Generate activities data based on reading percentage
      const activitiesCompleted = preAssessmentCompleted ? Math.floor(readingPercentage / 5) : 0;
      const totalActivities = 25; // Fixed total activities
      
      // Format the full name properly
      const fullName = `${student.firstName || ''} ${student.middleName ? student.middleName + ' ' : ''}${student.lastName || ''}`.trim();
      
      // Transform student data for frontend
      return {
        id: student.idNumber?.toString() || student._id.toString(),
        name: fullName,
        age: student.age || 0,
        gradeLevel: 'Grade 1', // Fixed to Grade 1 as requested
        section: 'Sampaguita',
        readingLevel: readingLevel, // Use directly, no conversion
        readingPercentage: readingPercentage,
        parent: parentInfo,
        preAssessmentCompleted: preAssessmentCompleted,
        lastAssessment: student.lastAssessmentDate ? new Date(student.lastAssessmentDate).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }) : 'Not assessed',
        activitiesCompleted: activitiesCompleted,
        totalActivities: totalActivities,
        lastActivityDate: student.lastLogin || student.createdAt || new Date()
      };
    });
    
    // Wait for all promises to resolve
    const transformedStudents = await Promise.all(transformedStudentsPromises);
    
    // Filter out null entries (those that didn't match filters)
    const filteredStudents = transformedStudents.filter(student => student !== null);
    
    res.json({
      students: filteredStudents,
      totalPages: Math.ceil(filteredStudents.length / limitNum),
      currentPage: pageNum,
      total: filteredStudents.length
    });
  } catch (error) {
    console.error('Error fetching students:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Get student details by ID
router.get('/student/:id', auth, async (req, res) => {
  try {
    // Connect to test database
    const testDb = mongoose.connection.useDb('test');
    const usersCollection = testDb.collection('users');
    
    // Convert id to number if possible
    const idQuery = isNaN(req.params.id) ? req.params.id : parseInt(req.params.id);
    
    const student = await usersCollection.findOne({ 
      $or: [
        { idNumber: idQuery },
        { _id: mongoose.Types.ObjectId.isValid(req.params.id) ? new mongoose.Types.ObjectId(req.params.id) : null }
      ].filter(condition => condition !== null)
    });
    
    if (student) {
      // Use the reading level directly from the student record
      let readingLevel = student.readingLevel || 'Not Assessed';
      let readingPercentage = student.readingPercentage || 0;
      
      // Get pre-assessment completion status directly from the database
      const preAssessmentCompleted = student.preAssessmentCompleted === true;
      
      // Get parent information using the helper function
      const parentInfo = await getParentInfo(student);
      
      // Create student data object - no parent email or contact info yet
      const studentData = {
        id: student.idNumber?.toString() || student._id.toString(),
        name: `${student.firstName || ''} ${student.middleName ? student.middleName + ' ' : ''}${student.lastName || ''}`.trim(),
        age: student.age || 0,
        gradeLevel: 'Grade 1',
        gender: student.gender || 'Not specified',
        section: 'Sampaguita',
        readingLevel: readingLevel, // Use directly, no conversion
        readingPercentage: readingPercentage,
        parent: parentInfo,
        parentEmail: 'Not available', // Can be enhanced if needed
        contactNumber: 'Not available', // Can be enhanced if needed
        address: student.address || 'Not available',
        lastActivityDate: student.lastLogin || student.createdAt || new Date(),
        preAssessmentCompleted: preAssessmentCompleted,
        lastAssessment: student.lastAssessmentDate ? new Date(student.lastAssessmentDate).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }) : 'Not assessed'
      };
      
      return res.json(studentData);
    } else {
      return res.status(404).json({ message: 'Student not found' });
    }
  } catch (error) {
    console.error('Error fetching student details:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Get assessment results for a student
router.get('/assessment/:id', auth, async (req, res) => {
  try {
    // Connect to test database for student data
    const testDb = mongoose.connection.useDb('test');
    const usersCollection = testDb.collection('users');
    
    // Find the student first to get their reading level
    const studentIdStr = req.params.id;
    const studentIdNum = isNaN(req.params.id) ? null : parseInt(req.params.id);
    
    let student = null;
    
    // Try numeric ID first if available
    if (studentIdNum !== null) {
      student = await usersCollection.findOne({ idNumber: studentIdNum });
    }
    
    // If not found, try with string ID
    if (!student && mongoose.Types.ObjectId.isValid(studentIdStr)) {
      student = await usersCollection.findOne({ _id: new mongoose.Types.ObjectId(studentIdStr) });
    }
    
    if (student) {
      // Get reading level directly from student record
      let readingLevel = student.readingLevel || 'Not Assessed';
      
      // Calculate percentage if available
      const readingPercentage = student.readingPercentage || 0;
      
      // Calculate skill scores based on the reading percentage
      // These are estimates based on the reading level
      const overall = readingPercentage;
      const patinigScore = Math.round(readingPercentage * 0.9);
      const pantigScore = Math.round(readingPercentage * 0.85);
      const pagkilalaNgSalitaScore = Math.round(readingPercentage * 0.8);
      const pagUnawaSaBinasaScore = Math.round(readingPercentage * 0.75);
      
      const formattedAssessment = {
        studentId: studentIdStr,
        readingLevel: readingLevel, // Use directly, no conversion
        recommendedLevel: readingLevel,
        assessmentDate: student.lastAssessmentDate 
          ? new Date(student.lastAssessmentDate).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })
          : 'Not available',
        scores: {
          patinig: patinigScore,
          pantig: pantigScore,
          pagkilalaNgSalita: pagkilalaNgSalitaScore,
          pagUnawaSaBinasa: pagUnawaSaBinasaScore,
          overall: overall.toFixed(1)
        },
        skillDetails: [
          {
            category: 'Patinig',
            score: patinigScore,
            analysis: getSkillAnalysis('Patinig', patinigScore)
          },
          {
            category: 'Pantig',
            score: pantigScore,
            analysis: getSkillAnalysis('Pantig', pantigScore)
          },
          {
            category: 'Pagkilala ng Salita',
            score: pagkilalaNgSalitaScore,
            analysis: getSkillAnalysis('Pagkilala ng Salita', pagkilalaNgSalitaScore)
          },
          {
            category: 'Pag-unawa sa Binasa',
            score: pagUnawaSaBinasaScore,
            analysis: getSkillAnalysis('Pag-unawa sa Binasa', pagUnawaSaBinasaScore)
          }
        ],
        focusAreas: determineFocusAreas(overall, 100)
      };
      
      return res.json(formattedAssessment);
    } else {
      return res.status(404).json({ message: 'Student not found' });
    }
  } catch (error) {
    console.error('Error fetching assessment:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Get progress data for a student
router.get('/progress/:id', auth, async (req, res) => {
  try {
    // Connect to test database for student data
    const testDb = mongoose.connection.useDb('test');
    const usersCollection = testDb.collection('users');
    
    // Find the student first to get their reading level
    const studentIdStr = req.params.id;
    const studentIdNum = isNaN(req.params.id) ? null : parseInt(req.params.id);
    
    let student = null;
    
    // Try numeric ID first if available
    if (studentIdNum !== null) {
      student = await usersCollection.findOne({ idNumber: studentIdNum });
    }
    
    // If not found, try with string ID
    if (!student && mongoose.Types.ObjectId.isValid(studentIdStr)) {
      student = await usersCollection.findOne({ _id: new mongoose.Types.ObjectId(studentIdStr) });
    }
    
    if (student) {
      // Get reading level directly from student record
      let readingLevel = student.readingLevel || 'Not Assessed';
      
      // Calculate percentage if available
      const readingPercentage = student.readingPercentage || 0;
      
      // Get pre-assessment completion status
      const preAssessmentCompleted = student.preAssessmentCompleted === true;
      
      // Calculate skill scores based on the reading percentage
      const patinigScore = Math.round(readingPercentage * 0.9);
      const pantigScore = Math.round(readingPercentage * 0.85);
      const pagkilalaNgSalitaScore = Math.round(readingPercentage * 0.8);
      const pagUnawaSaBinasaScore = Math.round(readingPercentage * 0.75);
      
      // Calculate completed activities based on reading percentage
      const activitiesCompleted = preAssessmentCompleted ? Math.floor(readingPercentage / 5) : 0;
      const totalActivities = 25;
      
      // Generate sample recent activities
      const recentActivities = generateRecentActivities(req.params.id, readingPercentage / 100);
      
      // Generate skill mastery data
      const skillMasteryOverTime = {
        patinig: generateSkillProgressData(patinigScore),
        pantig: generateSkillProgressData(pantigScore),
        pagkilalaNgSalita: generateSkillProgressData(pagkilalaNgSalitaScore),
        pagUnawaSaBinasa: generateSkillProgressData(pagUnawaSaBinasaScore)
      };
      
      const progressData = {
        studentId: req.params.id,
        activitiesCompleted: activitiesCompleted,
        totalActivities: totalActivities,
        totalTimeSpent: Math.floor(activitiesCompleted * 15), // Estimate 15 minutes per activity
        scores: {
          patinig: patinigScore,
          pantig: pantigScore,
          pagkilalaNgSalita: pagkilalaNgSalitaScore,
          pagUnawaSaBinasa: pagUnawaSaBinasaScore
        },
        recentActivities: recentActivities,
        skillMasteryOverTime: skillMasteryOverTime
      };
      
      return res.json(progressData);
    } else {
      // Return default progress data if student not found
      return res.json({
        studentId: req.params.id,
        activitiesCompleted: 0,
        totalActivities: 25,
        totalTimeSpent: 0,
        scores: {
          patinig: 0,
          pantig: 0,
          pagkilalaNgSalita: 0,
          pagUnawaSaBinasa: 0
        },
        recentActivities: [],
        skillMasteryOverTime: {
          patinig: [],
          pantig: [],
          pagkilalaNgSalita: [],
          pagUnawaSaBinasa: []
        }
      });
    }
  } catch (error) {
    console.error('Error fetching progress data:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Get reading levels
router.get('/reading-levels', auth, async (req, res) => {
  try {
    // Get all possible reading levels directly from the database
    const testDb = mongoose.connection.useDb('test');
    const usersCollection = testDb.collection('users');
    
    // Get distinct reading levels from the users collection
    const dbReadingLevels = await usersCollection.distinct('readingLevel');
    
    // Filter out null/undefined values and add 'Not Assessed'
    const readingLevels = dbReadingLevels
      .filter(level => level) // Remove null/undefined
      .concat(['Not Assessed']) // Add 'Not Assessed' option
      .filter((value, index, self) => self.indexOf(value) === index); // Remove duplicates
    
    res.json(readingLevels);
  } catch (error) {
    console.error('Error fetching reading levels:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Get recommended lessons for a student
router.get('/recommended-lessons/:id', auth, async (req, res) => {
  try {
    // Connect to test database for student data
    const testDb = mongoose.connection.useDb('test');
    const usersCollection = testDb.collection('users');
    
    // Find the student first to get their reading level
    const studentIdStr = req.params.id;
    const studentIdNum = isNaN(req.params.id) ? null : parseInt(req.params.id);
    
    let student = null;
    
    // Try numeric ID first if available
    if (studentIdNum !== null) {
      student = await usersCollection.findOne({ idNumber: studentIdNum });
    }
    
    // If not found, try with string ID
    if (!student && mongoose.Types.ObjectId.isValid(studentIdStr)) {
      student = await usersCollection.findOne({ _id: new mongoose.Types.ObjectId(studentIdStr) });
    }
    
    let readingLevel = 'Not Assessed';
    
    if (student && student.readingLevel) {
      readingLevel = student.readingLevel;
    }
    
    // Generate recommended lessons based on reading level
    const lessons = generateRecommendedLessons(readingLevel);
    
    res.json(lessons);
  } catch (error) {
    console.error('Error fetching recommended lessons:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Get prescriptive recommendations for a student
router.get('/prescriptive-recommendations/:id', auth, async (req, res) => {
  try {
    // Connect to test database for student data
    const testDb = mongoose.connection.useDb('test');
    const usersCollection = testDb.collection('users');
    
    // Find the student first to get their reading level
    const studentIdStr = req.params.id;
    const studentIdNum = isNaN(req.params.id) ? null : parseInt(req.params.id);
    
    let student = null;
    
    // Try numeric ID first if available
    if (studentIdNum !== null) {
      student = await usersCollection.findOne({ idNumber: studentIdNum });
    }
    
    // If not found, try with string ID
    if (!student && mongoose.Types.ObjectId.isValid(studentIdStr)) {
      student = await usersCollection.findOne({ _id: new mongoose.Types.ObjectId(studentIdStr) });
    }
    
    let readingLevel = 'Not Assessed';
    
    if (student && student.readingLevel) {
      readingLevel = student.readingLevel;
    }
    
    // Generate prescriptive recommendations based on reading level
    const recommendations = generatePrescriptiveRecommendations(readingLevel);
    
    res.json(recommendations);
  } catch (error) {
    console.error('Error fetching prescriptive recommendations:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Assign lessons to a student
router.post('/assign-lessons/:id', auth, async (req, res) => {
  try {
    const { lessonIds } = req.body;
    
    if (!Array.isArray(lessonIds) || lessonIds.length === 0) {
      return res.status(400).json({ 
        success: false, 
        message: 'No lesson IDs provided' 
      });
    }
    
    // In a real implementation, this would update a database
    // For now, we'll just return success
    
    res.json({
      success: true,
      message: `Successfully assigned ${lessonIds.length} lessons to student`,
      assignedLessons: lessonIds
    });
  } catch (error) {
    console.error('Error assigning lessons:', error);
    res.status(500).json({ 
      success: false,
      message: 'Server error', 
      error: error.message 
    });
  }
});

// Update an activity
router.put('/update-activity/:id', auth, async (req, res) => {
  try {
    const activityId = req.params.id;
    const updatedActivity = req.body;
    
    // In a real implementation, this would update a database
    // For now, we'll just return success
    
    res.json({
      success: true,
      message: 'Activity updated successfully',
      activity: {
        id: activityId,
        ...updatedActivity,
        status: 'pending_approval'
      }
    });
  } catch (error) {
    console.error('Error updating activity:', error);
    res.status(500).json({ 
      success: false,
      message: 'Server error', 
      error: error.message 
    });
  }
});

// Helper functions
function getSkillAnalysis(skillCategory, score) {
  if (score < 40) {
    return `Nangangailangan ng malaking pagpapahusay sa ${skillCategory.toLowerCase()}.`;
  } else if (score < 60) {
    return `May mga pangunahing kakayahan sa ${skillCategory.toLowerCase()} ngunit nangangailangan pa ng pagsasanay.`;
  } else if (score < 80) {
    return `Nakakabasa nang maayos sa ${skillCategory.toLowerCase()} pero may ilang aspeto na kailangang palakasin.`;
  } else {
    return `Mahusay na sa ${skillCategory.toLowerCase()}, maaaring magpatuloy sa mas mataas na antas.`;
  }
}

function determineFocusAreas(score, maxScore) {
  const percentage = (score / maxScore) * 100;
  
  if (percentage <= 25) {
    return 'pagkilala ng mga patinig at pantig';
  } else if (percentage <= 50) {
    return 'pagkilala ng mga tunog at pantig';
  } else if (percentage <= 75) {
    return 'pag-unawa sa binasa';
  } else {
    return 'kayarian ng pangngalan';
  }
}

function generateRecentActivities(studentId, score) {
  // Create realistic recent activities based on score
  const now = new Date();
  const baseActivities = [
    { id: 'act001', title: 'Pagkilala ng Patinig', category: 'Patinig', score: Math.round(score * 100), timeSpent: 15 },
    { id: 'act002', title: 'Pagbuo ng Pantig', category: 'Pantig', score: Math.round(score * 90), timeSpent: 20 },
    { id: 'act003', title: 'Pagbasa ng mga Salitang may Diptonggo', category: 'Patinig', score: Math.round(score * 100), timeSpent: 25 },
    { id: 'act004', title: 'Paghihiwalay ng Pantig', category: 'Pantig', score: Math.round(score * 90), timeSpent: 18 },
    { id: 'act005', title: 'Pagkilala ng mga Pamilyar na Salita', category: 'Pagkilala ng Salita', score: Math.round(score * 80), timeSpent: 22 }
  ];
  
  // Add dates, most recent first
  return baseActivities.map((activity, index) => {
    const date = new Date();
    date.setDate(now.getDate() - (index * 2)); // Every 2 days before now
    return {
      ...activity,
      date: date.toISOString()
    };
  });
}

function generateSkillProgressData(currentScore) {
  // Generate realistic progress over time
  const now = new Date();
  const data = [];
  
  // Start with a lower score and progress toward current score
  let baseScore = Math.max(currentScore - 30, 0);
  
  for (let i = 0; i < 5; i++) {
    const date = new Date();
    date.setDate(now.getDate() - ((4 - i) * 7)); // Weekly progress
    
    // Progress toward current score
    const progressScore = Math.round(baseScore + ((currentScore - baseScore) * (i / 4)));
    
    data.push({
      date: date.toLocaleDateString('en-US', { year: 'numeric', month: '2-digit', day: '2-digit' }),
      score: progressScore
    });
  }
  
  return data;
}

function generateRecommendedLessons(readingLevel) {
  // Use the actual reading levels from the database
  const levelLessonsMap = {
    'Antas 1': [
      { id: 'lesson301', title: 'Patinig: Pagkilala at Pagbigkas', level: 'Antas 1', category: 'Patinig', description: 'Interactive flashcards para sa limang patinig.', estimatedTime: '12 minuto', difficulty: 'Madali', assigned: false, isRecommended: true },
      { id: 'lesson302', title: 'Pantig: CV Pattern', level: 'Antas 1', category: 'Pantig', description: 'Pagbuo ng mga pantig gamit ang mga patinig at katinig.', estimatedTime: '18 minuto', difficulty: 'Madali', assigned: false, isRecommended: true },
      { id: 'lesson303', title: 'Salitang May Dalawang Pantig', level: 'Antas 1', category: 'Pagkilala ng Salita', description: 'Pagbasa ng mga payak na salitang may dalawang pantig.', estimatedTime: '20 minuto', difficulty: 'Madali', assigned: false, isRecommended: false }
    ],
    'Antas 2': [
      { id: 'lesson304', title: 'Pagkilala ng Patinig at Diptonggo', level: 'Antas 2', category: 'Patinig', description: 'Pagkilala at pagbigkas ng mga patinig at diptonggo.', estimatedTime: '15 minuto', difficulty: 'Madali', assigned: false, isRecommended: true },
      { id: 'lesson305', title: 'Pagbuo ng mga Salita mula sa Pantig', level: 'Antas 2', category: 'Pantig', description: 'Pagsasama ng mga pantig upang makabuo ng salita.', estimatedTime: '20 minuto', difficulty: 'Madali', assigned: false, isRecommended: true },
      { id: 'lesson306', title: 'Pagkilala ng Kahulugan ng Simpleng Salita', level: 'Antas 2', category: 'Pagkilala ng Salita', description: 'Pag-uugnay ng salita sa kahulugan at larawan.', estimatedTime: '25 minuto', difficulty: 'Katamtaman', assigned: false, isRecommended: true }
    ],
    'Antas 3': [
      { id: 'lesson101', title: 'Mga Diptonggo at Klaster', level: 'Antas 3', category: 'Patinig', description: 'Pag-aaral ng mga diptonggo at klaster na matatagpuan sa mga salitang Filipino.', estimatedTime: '20 minuto', difficulty: 'Katamtaman', assigned: false, isRecommended: true },
      { id: 'lesson102', title: 'Kailanan ng Pangngalan', level: 'Antas 3', category: 'Pagkilala ng Salita', description: 'Pag-aaral ng isahan at maramihan ng mga pangngalan sa Filipino.', estimatedTime: '15 minuto', difficulty: 'Madali', assigned: false, isRecommended: true },
      { id: 'lesson103', title: 'Panghalip Panao', level: 'Antas 3', category: 'Pagkilala ng Salita', description: 'Pag-aaral ng mga panghalip na panao tulad ng ako, ikaw, siya, kami, tayo, kayo, sila.', estimatedTime: '25 minuto', difficulty: 'Katamtaman', assigned: true, isRecommended: false }
    ],
    'Antas 4': [
      { id: 'lesson201', title: 'Pagbasa ng Maikling Kuwento', level: 'Antas 4', category: 'Pag-unawa sa Binasa', description: 'Pagbasa at pag-unawa ng maikling kuwento.', estimatedTime: '30 minuto', difficulty: 'Katamtaman', assigned: false, isRecommended: true },
      { id: 'lesson202', title: 'Pagsagot sa mga Tanong Tungkol sa Teksto', level: 'Antas 4', category: 'Pag-unawa sa Binasa', description: 'Pagsagot sa mga tanong tungkol sa binasang teksto.', estimatedTime: '25 minuto', difficulty: 'Katamtaman', assigned: false, isRecommended: true },
      { id: 'lesson203', title: 'Pagkilala sa Pangunahing Kaisipan', level: 'Antas 4', category: 'Pag-unawa sa Binasa', description: 'Pagtukoy sa pangunahing kaisipan ng binasang teksto.', estimatedTime: '28 minuto', difficulty: 'Katamtaman', assigned: false, isRecommended: true }
    ],
    'Antas 5': [
      { id: 'lesson401', title: 'Pagbasa ng Tekstong Deskriptibo', level: 'Antas 5', category: 'Pag-unawa sa Binasa', description: 'Pagkilala sa mga detalyeng naglalarawan sa isang teksto.', estimatedTime: '25 minuto', difficulty: 'Katamtaman', assigned: false, isRecommended: true },
      { id: 'lesson402', title: 'Pagkilala ng Tambalang Salita', level: 'Antas 5', category: 'Pagkilala ng Salita', description: 'Pag-aaral sa pagbuo at kahulugan ng tambalang salita.', estimatedTime: '30 minuto', difficulty: 'Katamtaman', assigned: false, isRecommended: true },
      { id: 'lesson403', title: 'Pagsusunod-sunod ng mga Pangyayari', level: 'Antas 5', category: 'Pag-unawa sa Binasa', description: 'Pagtukoy sa pagkakasunod-sunod ng mga pangyayari sa kwento.', estimatedTime: '35 minuto', difficulty: 'Mahirap', assigned: false, isRecommended: true }
    ],
    'Early': [
      { id: 'lessonE01', title: 'Pagkilala ng mga Patinig', level: 'Early', category: 'Patinig', description: 'Pagsasanay sa pagkilala ng mga patinig.', estimatedTime: '15 minuto', difficulty: 'Madali', assigned: false, isRecommended: true },
      { id: 'lessonE02', title: 'Pagkilala ng mga Katinig', level: 'Early', category: 'Katinig', description: 'Pagsasanay sa pagkilala ng mga katinig.', estimatedTime: '15 minuto', difficulty: 'Madali', assigned: false, isRecommended: true }
    ],
    'Emergent': [
      { id: 'lessonEM01', title: 'Pagkilala ng mga Letra', level: 'Emergent', category: 'Patinig', description: 'Pagsasanay sa pagkilala ng mga letra ng alpabeto.', estimatedTime: '15 minuto', difficulty: 'Madali', assigned: false, isRecommended: true },
      { id: 'lessonEM02', title: 'Pagbigkas ng mga Letra', level: 'Emergent', category: 'Patinig', description: 'Pagsasanay sa pagbigkas ng mga letra ng alpabeto.', estimatedTime: '15 minuto', difficulty: 'Madali', assigned: false, isRecommended: true }
    ],
    'Fluent': [
      { id: 'lessonF01', title: 'Pagbasa ng Maikling Kwento', level: 'Fluent', category: 'Pag-unawa sa Binasa', description: 'Pagbasa at pag-unawa ng maikling kwento.', estimatedTime: '30 minuto', difficulty: 'Katamtaman', assigned: false, isRecommended: true },
      { id: 'lessonF02', title: 'Pagtukoy ng Tema at Mensahe', level: 'Fluent', category: 'Pag-unawa sa Binasa', description: 'Pagtukoy ng tema at mensahe ng binasang teksto.', estimatedTime: '30 minuto', difficulty: 'Katamtaman', assigned: false, isRecommended: true }
    ],
    'Not Assessed': [
      { id: 'lessonNA01', title: 'Pre-Assessment Exercise', level: 'Not Assessed', category: 'Assessment', description: 'Exercise para sa pre-assessment.', estimatedTime: '30 minuto', difficulty: 'Madali', assigned: false, isRecommended: true }
    ]
  };
  
  return levelLessonsMap[readingLevel] || levelLessonsMap['Not Assessed'];
}

function generatePrescriptiveRecommendations(readingLevel) {
  // Use the actual reading levels from the database
  const focusAreas = {
    'Antas 1': [
      { id: 1, title: "Pagkilala ng Patinig", category: "Patinig", rationale: "Kailangan ng higit na pagsasanay sa pagkilala ng patinig.", status: "draft" },
      { id: 2, title: "Pagbigkas ng Tunog ng Titik", category: "Patinig", rationale: "Kailangan ng pagsasanay sa pagbigkas ng tunog ng titik.", status: "draft" }
    ],
    'Antas 2': [
      { id: 3, title: "Pagsasanay sa Diptonggo", category: "Patinig", rationale: "Kailangan ng karagdagang pagsasanay sa pagkilala at pagbigkas ng diptonggo.", status: "draft" },
      { id: 4, title: "Pagsasanay sa Pagbuo ng Pantig", category: "Pantig", rationale: "Kailangan ng pagsasanay sa pagbuo ng iba't ibang uri ng pantig.", status: "draft" }
    ],
    'Antas 3': [
      { id: 5, title: "Pagsasanay sa Pagkilala ng Patinig", category: "Patinig", status: "draft", score: 65, targetScore: 80, readingLevel: "Antas 3", analysis: "Nahihirapan ang mag-aaral sa pagkilala ng mga diptonggo at mga katulad na tunog ng patinig. Kailangan ng mas focused na pagsasanay.", recommendation: "Magtalaga ng mga pagsasanay sa pagkilala ng patinig na may audio support" },
      { id: 6, title: "Mga Gawain sa Paghihiwalay ng Pantig", category: "Pantig", status: "in_progress", score: 70, targetScore: 85, readingLevel: "Antas 3", analysis: "Nagpapakita ng katamtamang progreso sa paghihiwalay ng pantig ngunit kailangan pa ng mas maraming pagsasanay sa mga komplikadong kombinasyon ng pantig.", recommendation: "Ipagpatuloy ang mga pagsasanay sa paghihiwalay ng pantig, na nakatutok sa mga salitang may tatlong pantig" }
    ],
    'Antas 4': [
      { id: 7, title: "Pagsasanay sa Pag-unawa sa Binasa", category: "Pag-unawa sa Binasa", rationale: "Kailangan ng pagsasanay sa pag-unawa sa binasa.", status: "draft" },
      { id: 8, title: "Pagsasanay sa Pagtukoy ng Pangunahing Kaisipan", category: "Pag-unawa sa Binasa", rationale: "Kailangan ng pagsasanay sa pagtukoy ng pangunahing kaisipan.", status: "draft" }
    ],
    'Antas 5': [
      { id: 9, title: "Komprehensyon sa Pagbasa", category: "Pag-unawa sa Binasa", rationale: "Dapat palakasin ang kakayahang maghinuha mula sa binasa.", status: "draft" },
      { id: 10, title: "Pagsusunod-sunod ng mga Pangyayari", category: "Pag-unawa sa Binasa", rationale: "Kailangan ng pagsasanay sa pagtukoy ng tamang pagkakasunod-sunod ng mga pangyayari.", status: "draft" }
    ],
    'Emergent': [
      { id: 11, title: "Pagkilala ng mga Letra", category: "Patinig", rationale: "Kailangan ng pagsasanay sa pagkilala ng mga letra.", status: "draft" }
    ],
    'Early': [
      { id: 12, title: "Pagkilala ng mga Patinig at Katinig", category: "Patinig", rationale: "Kailangan ng pagsasanay sa pagkilala ng mga patinig at katinig.", status: "draft" }
    ],
    'Fluent': [
      { id: 13, title: "Pag-unawa sa Binasa", category: "Pag-unawa sa Binasa", rationale: "Kailangan ng pagsasanay sa pag-unawa sa binasa.", status: "draft" }
    ],
    'Not Assessed': [
      { id: 14, title: "Pre-Assessment Recommendation", category: "Pre-Assessment", rationale: "Kailangan munang kumpletuhin ang pre-assessment upang matukoy ang tamang mga rekomendasyon.", status: "draft" }
    ]
  };
  
  return focusAreas[readingLevel] || focusAreas['Not Assessed'];
}

module.exports = router;