// controllers/Teachers/studentController.js
const mongoose = require('mongoose');

// Get the right databases
const getUsersDb = () => mongoose.connection.useDb('test'); // This contains students
const getTeachersDb = () => mongoose.connection.useDb('teachers');

// Controller methods for CRUD operations
exports.getStudents = async (req, res) => {
  try {
    const { limit = 100, skip = 0, search = '' } = req.query;
    
    // Get users collection from test database
    const usersCollection = getUsersDb().collection('users');
    
    // Build query
    let query = {};
    if (search) {
      query = {
        $or: [
          { name: { $regex: search, $options: 'i' } },
          { firstName: { $regex: search, $options: 'i' } },
          { lastName: { $regex: search, $options: 'i' } }
        ]
      };
    }
    
    // Get total count
    const total = await usersCollection.countDocuments(query);
    
    // Get students with pagination
    const students = await usersCollection
      .find(query)
      .sort({ lastName: 1, firstName: 1 })
      .skip(parseInt(skip))
      .limit(parseInt(limit))
      .toArray();
    
    // Map to correct format
    const formattedStudents = students.map(student => ({
      id: student._id,
      idNumber: student.idNumber,
      name: student.name || `${student.firstName || ''} ${student.middleName ? student.middleName + ' ' : ''}${student.lastName || ''}`.trim(),
      firstName: student.firstName,
      middleName: student.middleName,
      lastName: student.lastName,
      age: student.age,
      gender: student.gender,
      gradeLevel: student.gradeLevel || 'Grade 1',
      section: student.section,
      readingLevel: student.readingLevel || 'Not Assessed',
      profileImageUrl: student.profileImageUrl,
      parentId: student.parentId,
      address: student.address,
      preAssessmentCompleted: student.preAssessmentCompleted || false,
      lastAssessmentDate: student.lastAssessmentDate
    }));
    
    res.json({
      students: formattedStudents,
      total,
      page: Math.floor(skip / limit) + 1,
      pages: Math.ceil(total / limit)
    });
  } catch (error) {
    console.error('Error fetching students:', error);
    res.status(500).json({ message: 'Error fetching students', error: error.message });
  }
};

exports.getParentInfo = async (req, res) => {
    try {
      const studentId = req.params.id;
      
      // Get users collection from test database
      const usersCollection = getUsersDb().collection('users');
      
      // Find student to get parentId
      const student = await usersCollection.findOne({
        $or: [
          { _id: new mongoose.Types.ObjectId(studentId) },
          { idNumber: parseInt(studentId) || studentId }
        ]
      });
      
      if (!student || !student.parentId) {
        return res.status(404).json({ message: 'Student or parent not found' });
      }
      
      // Get parent info from parent.parent_profile collection
      const parentDb = mongoose.connection.useDb('parent');
      const parentCollection = parentDb.collection('parent_profile');
      
      let parentObjId;
      try {
        if (typeof student.parentId === 'object' && student.parentId.$oid) {
          parentObjId = new mongoose.Types.ObjectId(student.parentId.$oid);
        } else {
          parentObjId = new mongoose.Types.ObjectId(student.parentId);
        }
      } catch (err) {
        return res.status(400).json({ message: 'Invalid parent ID format' });
      }
      
      const parentProfile = await parentCollection.findOne({ _id: parentObjId });
      
      if (!parentProfile) {
        return res.status(404).json({ message: 'Parent profile not found' });
      }
      
      // Format parent info
      const firstName = parentProfile.firstName || '';
      const middleName = parentProfile.middleName || '';
      const lastName = parentProfile.lastName || '';
      
      let name = firstName;
      if (middleName) name += ` ${middleName}`;
      if (lastName) name += ` ${lastName}`;
      
      // Get email from users_web.users if possible
      let email = parentProfile.email || '';
      if (parentProfile.userId) {
        try {
          const usersWebDb = mongoose.connection.useDb('users_web');
          const usersCollection = usersWebDb.collection('users');
          
          let userId;
          if (typeof parentProfile.userId === 'object' && parentProfile.userId.$oid) {
            userId = new mongoose.Types.ObjectId(parentProfile.userId.$oid);
          } else {
            userId = new mongoose.Types.ObjectId(parentProfile.userId);
          }
          
          const user = await usersCollection.findOne({ _id: userId });
          if (user) {
            email = user.email || '';
          }
        } catch (e) {
          console.warn("Error fetching parent email:", e);
        }
      }
      
      const parentInfo = {
        id: parentProfile._id,
        name: name.trim(),
        email: email,
        contact: parentProfile.contact || '',
        address: parentProfile.address || '',
        civilStatus: parentProfile.civilStatus || '',
        gender: parentProfile.gender || '',
        profileImageUrl: parentProfile.profileImageUrl || ''
      };
      
      res.json(parentInfo);
    } catch (error) {
      console.error('Error fetching parent info:', error);
      res.status(500).json({ message: 'Error fetching parent info', error: error.message });
    }
  };

// In controllers/Teachers/studentController.js, let's update the getStudentById method:

// Update the studentController.js getStudentById method to properly include parent info:

exports.getStudentById = async (req, res) => {
    try {
      const id = req.params.id;
      
      // Validate ID
      let studentId;
      try {
        studentId = new mongoose.Types.ObjectId(id);
      } catch (err) {
        studentId = id; // Try as idNumber if not valid ObjectId
      }
      
      // Get users collection
      const usersCollection = getUsersDb().collection('users');
      
      // Find student by ID or idNumber
      const student = await usersCollection.findOne({
        $or: [
          { _id: studentId },
          { idNumber: parseInt(id) || id }
        ]
      });
      
      if (!student) {
        return res.status(404).json({ message: 'Student not found' });
      }
      
      // Get parent information directly if parentId exists
      let parentInfo = null;
      if (student.parentId) {
        try {
          // Try to find the parent in parent.parent_profile collection first
          const parentDb = mongoose.connection.useDb('parent');
          const parentCollection = parentDb.collection('parent_profile');
          
          let parentId;
          if (typeof student.parentId === 'object' && student.parentId.$oid) {
            parentId = new mongoose.Types.ObjectId(student.parentId.$oid);
          } else {
            parentId = new mongoose.Types.ObjectId(student.parentId);
          }
          
          // Try to find parent by ID
          const parent = await parentCollection.findOne({ _id: parentId });
          
          if (parent) {
            // Format parent details
            const firstName = parent.firstName || '';
            const middleName = parent.middleName || '';
            const lastName = parent.lastName || '';
            
            let name = firstName;
            if (middleName) name += ` ${middleName}`;
            if (lastName) name += ` ${lastName}`;
            
            // Get email from users_web.users if possible
            let email = parent.email || '';
            if (parent.userId && !email) {
              try {
                const usersWebDb = mongoose.connection.useDb('users_web');
                const usersCollection = usersWebDb.collection('users');
                
                let userId;
                if (typeof parent.userId === 'object' && parent.userId.$oid) {
                  userId = new mongoose.Types.ObjectId(parent.userId.$oid);
                } else {
                  userId = new mongoose.Types.ObjectId(parent.userId);
                }
                
                const user = await usersCollection.findOne({ _id: userId });
                if (user) {
                  email = user.email || '';
                }
              } catch (e) {
                console.warn("Error fetching parent email:", e);
              }
            }
            
            console.log("Found parent info:", {
              id: parent._id,
              name: name.trim(),
              email: email,
              contact: parent.contact || '',
              address: parent.address || '',
              civilStatus: parent.civilStatus || '',
              gender: parent.gender || '',
              profileImageUrl: parent.profileImageUrl || ''
            });
            
            parentInfo = {
              id: parent._id,
              name: name.trim(),
              email: email,
              contact: parent.contact || '',
              address: parent.address || '',
              civilStatus: parent.civilStatus || '',
              gender: parent.gender || '',
              profileImageUrl: parent.profileImageUrl || ''
            };
          }
        } catch (err) {
          console.warn(`Error fetching parent info for student ${id}:`, err);
        }
      }
      
      // Format student data
      const formattedStudent = {
        id: student._id,
        idNumber: student.idNumber,
        name: student.name || `${student.firstName || ''} ${student.middleName ? student.middleName + ' ' : ''}${student.lastName || ''}`.trim(),
        firstName: student.firstName,
        middleName: student.middleName,
        lastName: student.lastName,
        age: student.age,
        gender: student.gender,
        gradeLevel: student.gradeLevel || 'Grade 1',
        section: student.section,
        readingLevel: student.readingLevel || 'Not Assessed',
        profileImageUrl: student.profileImageUrl,
        parentId: student.parentId,
        parent: parentInfo, // Include parent info directly
        address: student.address,
        preAssessmentCompleted: student.preAssessmentCompleted || false,
        lastAssessmentDate: student.lastAssessmentDate
      };
      
      res.json(formattedStudent);
    } catch (error) {
      console.error(`Error fetching student with ID ${req.params.id}:`, error);
      res.status(500).json({ message: 'Error fetching student details', error: error.message });
    }
  };

exports.getAssessmentResults = async (req, res) => {
  try {
    const id = req.params.id;
    
    // Get assessments collection
    const categoryResultsCollection = getUsersDb().collection('category_results');
    
    // Find assessment results
    const results = await categoryResultsCollection.find({ studentId: id }).toArray();
    
    if (!results || results.length === 0) {
      return res.json({ 
        message: 'No assessment results found',
        skillDetails: [] 
      });
    }
    
    // Format results
    const skillDetails = results.map(result => ({
      id: result._id,
      category: result.category,
      score: result.score || 0,
      analysis: result.analysis || `Assessment for ${result.category} completed with ${result.score || 0}% score.`
    }));
    
    res.json({
      studentId: id,
      assessmentDate: results[0]?.assessmentDate || new Date(),
      skillDetails,
      overallScore: skillDetails.reduce((sum, item) => sum + item.score, 0) / skillDetails.length
    });
  } catch (error) {
    console.error(`Error fetching assessment results for student ID ${req.params.id}:`, error);
    res.status(500).json({ message: 'Error fetching assessment results', error: error.message });
  }
};

exports.getProgressData = async (req, res) => {
  try {
    const id = req.params.id;
    
    // Get progress data collections
    const progressCollection = getUsersDb().collection('intervention_progress');
    
    // Find progress data
    const progressData = await progressCollection.find({ studentId: id }).toArray();
    
    // Format recent activities from progress data
    const recentActivities = progressData.map(item => ({
      id: item._id,
      title: item.activityName || item.title || `Activity ${item._id.toString().substr(-4)}`,
      category: item.category || 'General',
      score: item.score || 0,
      date: item.date || new Date(),
      completed: true
    }));
    
    res.json({
      studentId: id,
      recentActivities,
      currentLevel: progressData[0]?.currentLevel || 'Not Assessed',
      lastUpdated: progressData[0]?.date || new Date()
    });
  } catch (error) {
    console.error(`Error fetching progress data for student ID ${req.params.id}:`, error);
    res.status(500).json({ message: 'Error fetching progress data', error: error.message });
  }
};

exports.getRecommendedLessons = async (req, res) => {
  try {
    const id = req.params.id;
    
    // This would typically come from a recommendations collection
    // For now, generate sample data
    const recommendations = [
      { 
        id: '1', 
        title: 'Alphabet Recognition Practice',
        type: 'Interactive',
        description: 'Practice recognizing uppercase and lowercase letters.',
        difficulty: 'Basic'
      },
      { 
        id: '2', 
        title: 'Phonemic Awareness Activities',
        type: 'Audio',
        description: 'Listening exercises to identify beginning sounds in words.',
        difficulty: 'Intermediate'
      },
      { 
        id: '3', 
        title: 'Word Building With Syllables',
        type: 'Game',
        description: 'Build words by combining syllables correctly.',
        difficulty: 'Advanced'
      }
    ];
    
    res.json(recommendations);
  } catch (error) {
    console.error(`Error fetching recommended lessons for student ID ${req.params.id}:`, error);
    res.status(500).json({ message: 'Error fetching recommended lessons', error: error.message });
  }
};

exports.getPrescriptiveRecommendations = async (req, res) => {
  try {
    const id = req.params.id;
    
    // This would typically come from a prescriptive analysis collection
    // For now, generate sample data
    const recommendations = [
      { 
        id: '1', 
        text: 'Daily practice matching uppercase to lowercase letters',
        rationale: 'Student shows difficulty differentiating similar lowercase letters like b/d/p/q. Regular practice will help strengthen visual discrimination skills.'
      },
      { 
        id: '2', 
        text: 'Phonological awareness activities focusing on initial sounds',
        rationale: 'Student struggles to identify beginning sounds in words. Activities that emphasize starting sounds will help build this foundation for decoding words.'
      },
      { 
        id: '3', 
        text: 'Guided reading with visual supports',
        rationale: 'Student performs better with visual cues. Pairing text with relevant images will help improve comprehension and build reading confidence.'
      }
    ];
    
    res.json(recommendations);
  } catch (error) {
    console.error(`Error fetching prescriptive recommendations for student ID ${req.params.id}:`, error);
    res.status(500).json({ message: 'Error fetching prescriptive recommendations', error: error.message });
  }
};

exports.updateStudentAddress = async (req, res) => {
  try {
    const id = req.params.id;
    const { address } = req.body;
    
    if (!address) {
      return res.status(400).json({ message: 'Address is required' });
    }
    
    // Get users collection
    const usersCollection = getUsersDb().collection('users');
    
    // Update student address
    const result = await usersCollection.updateOne(
      { _id: new mongoose.Types.ObjectId(id) },
      { $set: { address } }
    );
    
    if (result.matchedCount === 0) {
      return res.status(404).json({ message: 'Student not found' });
    }
    
    res.json({ message: 'Address updated successfully' });
  } catch (error) {
    console.error(`Error updating address for student ID ${req.params.id}:`, error);
    res.status(500).json({ message: 'Error updating student address', error: error.message });
  }
};

exports.linkParentToStudent = async (req, res) => {
  try {
    const studentId = req.params.id;
    const { parentId } = req.body;
    
    if (!parentId) {
      return res.status(400).json({ message: 'Parent ID is required' });
    }
    
    // Get users collection
    const usersCollection = getUsersDb().collection('users');
    
    // Update student with parent ID
    const result = await usersCollection.updateOne(
      { _id: new mongoose.Types.ObjectId(studentId) },
      { $set: { parentId } }
    );
    
    if (result.matchedCount === 0) {
      return res.status(404).json({ message: 'Student not found' });
    }
    
    res.json({ message: 'Parent linked to student successfully' });
  } catch (error) {
    console.error(`Error linking parent to student ID ${req.params.id}:`, error);
    res.status(500).json({ message: 'Error linking parent to student', error: error.message });
  }
};

// NEW METHODS FOR FILTER ENDPOINTS

// Get available grade levels
exports.getGradeLevels = async (req, res) => {
  try {
    // This could be from a database query if you have a grades collection
    // For now, return a static list
    const gradeLevels = ['Grade 1', 'Grade 2', 'Grade 3'];
    res.json(gradeLevels);
  } catch (error) {
    console.error('Error fetching grade levels:', error);
    res.status(500).json({ message: 'Error fetching grade levels', error: error.message });
  }
};

// Get available sections/classes
exports.getSections = async (req, res) => {
  try {
    // This could be from a database query if you have a sections collection
    // For now, return a static list
    const sections = [
      'Sampaguita', 
      'Rosal', 
      'Rosa', 
      'Lily', 
      'Orchid',
      'Unity',
      'Peace',
      'Dignity'
    ];
    res.json(sections);
  } catch (error) {
    console.error('Error fetching sections:', error);
    res.status(500).json({ message: 'Error fetching sections', error: error.message });
  }
};

// Get reading levels
exports.getReadingLevels = async (req, res) => {
  try {
    // This could be from a database query if you have a reading levels collection
    // For now, return a static list with the updated reading level hierarchy
    const readingLevels = [
      'Low Emerging', 
      'High Emerging', 
      'Developing', 
      'Transitioning', 
      'At Grade Level',
      'Advanced',
      'Not Assessed'
    ];
    res.json(readingLevels);
  } catch (error) {
    console.error('Error fetching reading levels:', error);
    res.status(500).json({ message: 'Error fetching reading levels', error: error.message });
  }
};