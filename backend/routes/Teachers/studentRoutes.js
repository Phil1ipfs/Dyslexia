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

// Helper function to get reading level class
const getReadingLevelClass = (level) => {
  switch (level) {
    case 'Antas 1': return 'vs-level-1';
    case 'Antas 2': return 'vs-level-2';
    case 'Antas 3': return 'vs-level-3';
    case 'Antas 4': return 'vs-level-4';
    case 'Antas 5': return 'vs-level-5';
    case 'Early': return 'vs-level-1';
    case 'Emergent': return 'vs-level-2';
    case 'Fluent': return 'vs-level-3';
    case 'Not Assessed': return 'vs-level-na';
    default: return 'vs-level-na';
  }
};

// Helper function to get parent information from parent.profile collection
async function getParentInfo(student) {
  console.log("Starting getParentInfo for student:", student.idNumber || student._id);
  
  let parentInfo = {
    name: "Not connected",
    email: "Not available",
    contact: "Not available",
    address: "Not provided",
    civilStatus: "Not provided",
    gender: "Not provided",
    occupation: "Not provided",
    profileImageUrl: null // Add this line to initialize the profileImageUrl
  };

  if (!student.parentId) {
    console.log("No parentId found for student");
    return parentInfo;
  }
  
  console.log("ParentId found:", student.parentId);

  try {
    // Convert parentId to ObjectId if possible
    const parentId = toObjectIdIfPossible(student.parentId);
    console.log("Converted parentId:", parentId);
    
    // Connect to parent database to get parent profile
    const parentDb = mongoose.connection.useDb('parent');
    const parentProfileCollection = parentDb.collection('profile');
    
    // Connect to users_web database to get user email
    const usersWebDb = mongoose.connection.useDb('users_web');
    const usersCollection = usersWebDb.collection('users');
    
    // Find parent profile by parentId
    const parentProfile = await parentProfileCollection.findOne({
      $or: [
        { _id: parentId },
        { userId: parentId }
      ]
    });

    console.log("Parent profile found:", parentProfile ? "Yes" : "No");
    
    if (parentProfile) {
      // Format full name with first, middle, and last name
      parentInfo.name = [
        parentProfile.firstName || '',
        parentProfile.middleName ? parentProfile.middleName + ' ' : '',
        parentProfile.lastName || ''
      ].filter(part => part).join(' ');
      
      // Populate all available parent information from profile
      parentInfo.contact = parentProfile.contact || "Not available";
      parentInfo.address = parentProfile.address || "Not provided";
      parentInfo.civilStatus = parentProfile.civilStatus || "Not provided";
      parentInfo.gender = parentProfile.gender || "Not provided";
      parentInfo.occupation = parentProfile.occupation || "Not provided";
      parentInfo.profileImageUrl = parentProfile.profileImageUrl || null; // Add this line
      
      // Find the user's email by connecting the userId from parent profile to users_web.users
      if (parentProfile.userId) {
        console.log("Looking up email with userId:", parentProfile.userId);
        const userRecord = await usersCollection.findOne({
          _id: toObjectIdIfPossible(parentProfile.userId)
        });
        
        console.log("User record found:", userRecord ? "Yes" : "No");
        console.log("Email found:", userRecord?.email || "None");
        
        if (userRecord && userRecord.email) {
          parentInfo.email = userRecord.email;
        }
      } else {
        console.log("No userId found in parent profile");
      }
    }
    
    console.log("Final parent info:", parentInfo);
  } catch (error) {
    console.error("Error finding parent information:", error);
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
      console.log(`Processing student: ${student.firstName} ${student.lastName} (ID: ${student.idNumber})`);

      // Get reading level directly from student record
      let readingLevel = student.readingLevel || 'Not Assessed';

      // Apply reading level filtering if specified
      if (readingLevelFilter && readingLevelFilter !== 'all' && readingLevel !== readingLevelFilter) {
        return null; // This student doesn't match the filter
      }

      const readingLevelClass = getReadingLevelClass(readingLevel);

      // Get parent information using the helper function
      const parentInfo = await getParentInfo(student);

      // Get pre-assessment completion status directly from the database
      const preAssessmentCompleted = student.preAssessmentCompleted === true;

      // Calculate reading percentage
      const readingPercentage = student.readingPercentage || 0;

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
        gradeLevel: student.gradeLevel || 'Grade 1', // Default to Grade 1 if not set
        section: 'Sampaguita', // Fixed as requested
        readingLevel: readingLevel,
        readingLevelClass,
        readingPercentage: readingPercentage,
        parent: parentInfo,
        parentName:     parentInfo.name,
        preAssessmentCompleted: preAssessmentCompleted,
        profileImageUrl: student.profileImageUrl || null,
        gender: student.gender || 'Not specified',
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

      // Get detailed parent information using the enhanced helper function
      const parentInfo = await getParentInfo(student);

      // Format the full name properly
      const fullName = `${student.firstName || ''} ${student.middleName ? student.middleName + ' ' : ''}${student.lastName || ''}`.trim();

      // Create student data object
      const studentData = {
        id: student.idNumber?.toString() || student._id.toString(),
        name: fullName,
        parent: parentInfo.name,
        parentId: student.parentId,
        parentEmail: parentInfo.email,
        parentContact: parentInfo.contact,
        parentAddress: parentInfo.address,
        parentCivilStatus: parentInfo.civilStatus,
        parentGender: parentInfo.gender,
        parentOccupation: parentInfo.occupation,
        parentProfileImageUrl: parentInfo.profileImageUrl,
        age: student.age || 0,
        gradeLevel: student.gradeLevel || 'Grade 1',
        gender: student.gender || 'Not specified',
        section: 'Sampaguita',
        readingLevel: readingLevel,
        readingPercentage: readingPercentage,
        address: student.address || 'Not available',
        profileImageUrl: student.profileImageUrl || null,
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





// PATCH /api/student/:id/address
router.patch('/student/:id/address', auth, async (req, res) => {
  try {
    const { address } = req.body;
    if (typeof address !== 'string') {
      return res.status(400).json({ message: 'Address must be a string' });
    }

    const testDb = mongoose.connection.useDb('test');
    const users = testDb.collection('users');

    // Try numeric or ObjectId lookup just like your GET
    const idQuery = isNaN(req.params.id)
      ? new mongoose.Types.ObjectId(req.params.id)
      : parseInt(req.params.id);

    const result = await users.updateOne(
      {
        $or: [
          { idNumber: idQuery },
          {
            _id: mongoose.Types.ObjectId.isValid(req.params.id)
              ? new mongoose.Types.ObjectId(req.params.id)
              : null
          }
        ].filter(x => x)
      },
      { $set: { address } }
    );

    if (result.matchedCount === 0) {
      return res.status(404).json({ message: 'Student not found' });
    }

    res.json({ success: true, message: 'Address updated', address });
  } catch (err) {
    console.error('Error updating address:', err);
    res.status(500).json({ message: 'Server error', error: err.message });
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
        readingLevel: readingLevel,
        recommendedLevel: readingLevel,
        assessmentDate: student.lastAssessmentDate
          ? new Date(student.lastAssessmentDate).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })
          : 'Not available',
        scores: {
          patinig: patinigScore,
          pantig: pantigScore,
          pagkilalaNgSalita: pagkilalaNgSalitaScore,
          pagUnawaSaBinasa: pagUnawaSaBinasaScore,
          overall: overall
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
        focusAreas: determineFocusAreas(readingLevel, patinigScore, pantigScore, pagkilalaNgSalitaScore, pagUnawaSaBinasaScore)
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

router.get('/parent/:parentId', auth, async (req, res) => {
  try {
    // we only need the parentId
    const parentInfo = await getParentInfo({ parentId: req.params.parentId });
    return res.json(parentInfo);
  } catch (error) {
    console.error('Error fetching parent info:', error);
    return res.status(500).json({ message: 'Server error', error: error.message });
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
      const recentActivities = generateRecentActivities(req.params.id, readingLevel, readingPercentage / 100);

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


const parentController = require('../../controllers/Teachers/parentController');

/**
 * @route GET /api/student/parent/:id
 * @desc Get parent profile by ID
 * @access Private (teachers only)
 */
router.get('/parent/:id', parentController.getParentProfile);


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

function determineFocusAreas(readingLevel, patinigScore, pantigScore, pagkilalaNgSalitaScore, pagUnawaSaBinasaScore) {
  // Find the lowest score
  const scores = [
    { category: 'pagkilala ng mga patinig', score: patinigScore },
    { category: 'pagkilala ng mga pantig', score: pantigScore },
    { category: 'pagkilala ng mga salita', score: pagkilalaNgSalitaScore },
    { category: 'pag-unawa sa binasa', score: pagUnawaSaBinasaScore }
  ];

  // Sort by score, ascending
  scores.sort((a, b) => a.score - b.score);

  // Return the lowest 1-2 areas as focus
  if (scores[0].score < 40) {
    return scores[0].category;
  } else if (scores[0].score < 60) {
    return `${scores[0].category} at ${scores[1].category}`;
  } else if (readingLevel === 'Antas 1' || readingLevel === 'Early' || readingLevel === 'Emergent') {
    return 'pagkilala ng mga tunog at pantig';
  } else if (readingLevel === 'Antas 2' || readingLevel === 'Antas 3') {
    return 'pagkilala ng mga salita at pag-unawa';
  } else {
    return 'pag-unawa sa binasa';
  }
}

function generateRecentActivities(studentId, readingLevel, score) {
  // Create realistic recent activities based on reading level and score
  const now = new Date();

  // Base activities based on reading level
  let baseActivities = [];

  if (readingLevel === 'Antas 1' || readingLevel === 'Early' || readingLevel === 'Emergent' || readingLevel === 'Not Assessed') {
    baseActivities = [
      { id: `act${studentId}-001`, title: 'Pagkilala ng Patinig', category: 'Patinig', score: Math.round(score * 100), timeSpent: 15 },
      { id: `act${studentId}-002`, title: 'Pagbuo ng Pantig', category: 'Pantig', score: Math.round(score * 90), timeSpent: 20 },
      { id: `act${studentId}-003`, title: 'Mga Salitang May Dalawang Pantig', category: 'Pagkilala ng Salita', score: Math.round(score * 85), timeSpent: 18 }
    ];
  } else if (readingLevel === 'Antas 2') {
    baseActivities = [
      { id: `act${studentId}-004`, title: 'Pagbasa ng mga Salitang may Diptonggo', category: 'Patinig', score: Math.round(score * 95), timeSpent: 25 },
      { id: `act${studentId}-005`, title: 'Paghihiwalay ng Pantig', category: 'Pantig', score: Math.round(score * 90), timeSpent: 18 },
      { id: `act${studentId}-006`, title: 'Pagkilala ng mga Pamilyar na Salita', category: 'Pagkilala ng Salita', score: Math.round(score * 85), timeSpent: 22 }
    ];
  } else if (readingLevel === 'Antas 3') {
    baseActivities = [
      { id: `act${studentId}-007`, title: 'Mga Panghalip Panao', category: 'Pagkilala ng Salita', score: Math.round(score * 95), timeSpent: 25 },
      { id: `act${studentId}-008`, title: 'Pag-unawa sa Maikling Kwento', category: 'Pag-unawa sa Binasa', score: Math.round(score * 85), timeSpent: 25 },
      { id: `act${studentId}-009`, title: 'Pagsagot sa mga Tanong tungkol sa Kwento', category: 'Pag-unawa sa Binasa', score: Math.round(score * 80), timeSpent: 30 }
    ];
  } else if (readingLevel === 'Antas 4' || readingLevel === 'Antas 5' || readingLevel === 'Fluent') {
    baseActivities = [
      { id: `act${studentId}-010`, title: 'Pagbasa ng Tekstong Deskriptibo', category: 'Pag-unawa sa Binasa', score: Math.round(score * 95), timeSpent: 35 },
      { id: `act${studentId}-011`, title: 'Pagkilala ng Tambalang Salita', category: 'Pagkilala ng Salita', score: Math.round(score * 90), timeSpent: 30 },
      { id: `act${studentId}-012`, title: 'Pagsusunod-sunod ng mga Pangyayari', category: 'Pag-unawa sa Binasa', score: Math.round(score * 85), timeSpent: 35 }
    ];
  }
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
      date: date.toISOString().split('T')[0], // YYYY-MM-DD format
      score: progressScore
    });
  }

  return data;
}

function generateRecommendedLessons(readingLevel) {
  // Map reading levels to the appropriate lessons
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
  // Map reading levels to appropriate prescriptive recommendations
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
      { id: 7, title: "Pagsasanay sa Pag-unawa sa Binasa", category: "Pag-unawa sa Binasa", rationale: "Kailangan ng pagsasanay sa pag-unawa sa binasa. Kailangan ng pagsasanay sa pag-unawa sa binasa. Kailangan ng pagsasanay sa pag-unawa sa binasa.", status: "draft" },
      { id: 8, title: "Pagsasanay sa Pagtukoy ng Pangunahing Kaisipan", category: "Pag-unawa sa Binasa", rationale: "Kailangan ng pagsasanay sa pagtukoy ng pangunahing kaisipan.", status: "draft" }
    ],

    'Antas 5': [
      { id: 9, title: "Komprehensyon sa Pagbasa", category: "Pag-unawa sa Binasa", rationale: "Dapat palakasin ang kakayahang maghinuha mula sa binasa.", status: "draft" },
      { id: 10, title: "Pagsusunod-sunod ng mga Pangyayari", category: "Pag-unawa sa Binasa", rationale: "Kailangan ng pagsasanay sa pagtukoy ng tamang pagkakasunod-sunod ng mga pangyayari.", status: "draft" }
    ],
    'Early': [
      { id: 12, title: "Pagkilala ng mga Patinig at Katinig", category: "Patinig", rationale: "Kailangan ng pagsasanay sa pagkilala ng mga patinig at katinig.", status: "draft" }
    ],
    'Emergent': [
      { id: 11, title: "Pagkilala ng mga Letra", category: "Patinig", rationale: "Kailangan ng pagsasanay sa pagkilala ng mga letra.", status: "draft" }
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