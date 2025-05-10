// routes/Teachers/dashboardRoutes.js
const express = require('express');
const mongoose = require('mongoose');
const { auth, authorize } = require('../../middleware/auth');
const router = express.Router();

/**
 * @route GET /api/dashboard/metrics
 * @desc Get overall dashboard metrics
 * @access Private (teacher only)
 */
router.get('/metrics', auth, authorize('teacher', 'guro'), async (req, res) => {
  try {
    // Access test database for student data
    const testDb = mongoose.connection.useDb('test');
    const usersCollection = testDb.collection('users');
    
    // Count total students
    const totalStudents = await usersCollection.countDocuments();
    
    // Group students by reading level
    const readingLevelAggregation = await usersCollection.aggregate([
      { $group: { _id: "$readingLevel", count: { $sum: 1 } } }
    ]).toArray();
    
    // Count assessed students (those with a reading level that isn't null or "Not Assessed")
    const assessedStudents = readingLevelAggregation.reduce((sum, level) => {
      if (level._id && level._id !== 'Not Assessed') {
        return sum + level.count;
      }
      return sum;
    }, 0);
    
    // Calculate average reading percentage
    const percentageAggregation = await usersCollection.aggregate([
      { 
        $match: { 
          readingPercentage: { $exists: true, $ne: null } 
        } 
      },
      {
        $group: {
          _id: null,
          average: { $avg: "$readingPercentage" }
        }
      }
    ]).toArray();
    
    const averageScore = percentageAggregation.length > 0 
      ? Math.round(percentageAggregation[0].average)
      : 0;
    
    // Count completed lessons
    const completedLessonsAggregation = await usersCollection.aggregate([
      {
        $match: {
          completedLessons: { $exists: true, $type: 'array' }
        }
      },
      {
        $project: {
          lessonCount: { $size: '$completedLessons' }
        }
      },
      {
        $group: {
          _id: null,
          totalCompleted: { $sum: '$lessonCount' }
        }
      }
    ]).toArray();
    
    const completedActivities = completedLessonsAggregation.length > 0 
      ? completedLessonsAggregation[0].totalCompleted
      : 0;
    
    // Calculate total assigned activities (assuming 25 per student)
    const totalAssignedActivities = assessedStudents * 25;
    
    // Calculate completion rate
    const completionRate = totalAssignedActivities > 0
      ? Math.round((completedActivities / totalAssignedActivities) * 100)
      : 0;
    
    // Count students needing attention (not assessed, early readers, or low scores)
    const pendingEditStudents = await usersCollection.countDocuments({
      $or: [
        { readingLevel: "Not Assessed" },
        { readingLevel: "Early" },
        { readingLevel: "Emergent" },
        { readingPercentage: { $lt: 70 } }
      ]
    });
    
    return res.json({
      totalStudents,
      completionRate,
      averageScore,
      assignedActivities: totalAssignedActivities,
      completedActivities,
      pendingEdits: pendingEditStudents
    });
    
  } catch (error) {
    console.error('Error fetching dashboard metrics:', error);
    return res.status(500).json({ message: 'Server error', error: error.message });
  }
});

/**
 * @route GET /api/dashboard/reading-level-distribution
 * @desc Get reading level distribution
 * @access Private (teacher only)
 */
router.get('/reading-level-distribution', auth, authorize('teacher', 'guro'), async (req, res) => {
  try {
    // Access test database for student data
    const testDb = mongoose.connection.useDb('test');
    const usersCollection = testDb.collection('users');
    
    // Group students by reading level
    const readingLevelAggregation = await usersCollection.aggregate([
      { $group: { _id: "$readingLevel", count: { $sum: 1 } } }
    ]).toArray();
    
    // Convert to format needed for frontend charts
    const distribution = readingLevelAggregation.map(level => {
      const readingLevel = level._id || 'Not Assessed';
      // Assign colors based on reading level
      let color = '#B0B0B0'; 
      
      switch (readingLevel) {
        case 'Early':
          color = '#FF6B8A';
          break;
        case 'Emergent':
          color = '#FF9E40';
          break;
        case 'Fluent':
          color = '#4BC0C0';
          break;
        case 'Not Assessed':
          color = '#B0B0B0';
          break;
        default:
          color = '#B0B0B0';
      }
      
      return {
        name: readingLevel,
        value: level.count,
        color: color
      };
    });
    
    return res.json(distribution);
    
  } catch (error) {
    console.error('Error fetching reading level distribution:', error);
    return res.status(500).json({ message: 'Server error', error: error.message });
  }
});

/**
 * @route GET /api/dashboard/students-needing-attention
 * @desc Get students needing attention
 * @access Private (teacher only)
 */
router.get('/students-needing-attention', auth, authorize('teacher', 'guro'), async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 5;
    
    // Access test database for student data
    const testDb = mongoose.connection.useDb('test');
    const usersCollection = testDb.collection('users');
    
    // Find students needing attention
    const query = {
      $or: [
        { readingLevel: "Not Assessed" },
        { readingLevel: "Early" },
        { readingLevel: "Emergent" },
        { readingPercentage: { $lt: 70 } }
      ]
    };
    
    // Fetch students needing attention with limit
    const students = await usersCollection.find(query)
      .limit(limit)
      .toArray();
    
    // Map students to desired format
    const formattedStudents = students.map(student => {
      // Format name from parts
      const name = `${student.firstName || ''} ${student.middleName ? student.middleName + ' ' : ''}${student.lastName || ''}`.trim();
      
      // Determine improvement categories based on reading level
      const categories = [];
      switch (student.readingLevel) {
        case 'Early':
          categories.push('Alphabet Knowledge', 'Phonological Awareness');
          break;
        case 'Emergent':
          categories.push('Phonological Awareness', 'Decoding');
          break;
        case 'Fluent':
          categories.push('Reading Comprehension', 'Critical Thinking');
          break;
        case 'Not Assessed':
          categories.push('Pre-Assessment Needed');
          break;
        default:
          categories.push('Literacy Skills Assessment');
      }
      
      // Create difficulty text based on categories
      let difficulty;
      if (student.readingLevel === 'Not Assessed') {
        difficulty = 'Needs assessment to determine areas for improvement';
      } else {
        difficulty = categories.join('; ');
      }
      
      // Format student data
      return {
        id: student._id.toString(),
        name: name,
        readingLevel: student.readingLevel || 'Not Assessed',
        section: student.section || 'Sampaguita', // Default section
        gradeLevel: student.gradeLevel || 'Grade 1',
        lastScore: student.readingPercentage || 
                  (student.readingLevel === 'Fluent' ? 85 : 
                   student.readingLevel === 'Emergent' ? 55 :
                   student.readingLevel === 'Early' ? 40 : 60),
        completionRate: student.completedLessons 
          ? Math.round((student.completedLessons.length / 25) * 100)
          : Math.floor(Math.random() * 60) + 20, // Random completion between 20-80%
        difficulty: difficulty,
        improvementCategories: categories,
        lastAssessment: student.lastAssessmentDate 
          ? new Date(student.lastAssessmentDate).toLocaleDateString('en-US', { 
              year: 'numeric', month: 'long', day: 'numeric' 
            })
          : 'Not assessed',
        preAssessmentCompleted: student.preAssessmentCompleted || false
      };
    });
    
    return res.json(formattedStudents);
    
  } catch (error) {
    console.error('Error fetching students needing attention:', error);
    return res.status(500).json({ message: 'Server error', error: error.message });
  }
});

/**
 * @route GET /api/dashboard/progress-data
 * @desc Get progress data for reading levels
 * @access Private (teacher only)
 */
router.get('/progress-data', auth, authorize('teacher', 'guro'), async (req, res) => {
  try {
    // Generate progress data for each reading level
    // This would ideally come from actual student progress data
    // For now, we'll generate reasonable mock data
    
    const generateWeeklyData = (baseValue, count = 4) => Array.from({ length: count }, (_, i) => ({
      name: `Week ${i + 1}`,
      progress: Math.min(100, Math.round(baseValue + (i * (80 / count))))
    }));
    
    const generateMonthlyData = (baseValue, count = 6) => {
      const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
      const date = new Date();
      const currentMonth = date.getMonth();
      
      return Array.from({ length: count }, (_, i) => {
        const monthIndex = (currentMonth - (count - 1) + i) % 12;
        return {
          name: months[monthIndex >= 0 ? monthIndex : monthIndex + 12],
          progress: Math.min(100, Math.round(baseValue + (i * (80 / count))))
        };
      });
    };
    
    // Create progress data for each reading level
    const progressData = {
      'Early': {
        weekly: generateWeeklyData(25),
        monthly: generateMonthlyData(25)
      },
      'Emergent': {
        weekly: generateWeeklyData(40),
        monthly: generateMonthlyData(40)
      },
      'Fluent': {
        weekly: generateWeeklyData(70),
        monthly: generateMonthlyData(70)
      }
    };
    
    return res.json(progressData);
    
  } catch (error) {
    console.error('Error generating progress data:', error);
    return res.status(500).json({ message: 'Server error', error: error.message });
  }
});

/**
 * @route GET /api/dashboard/prescriptive-data
 * @desc Get prescriptive analytics for reading levels
 * @access Private (teacher only)
 */
router.get('/prescriptive-data', auth, authorize('teacher', 'guro'), async (req, res) => {
  try {
    // Get reading level distribution first
    const testDb = mongoose.connection.useDb('test');
    const usersCollection = testDb.collection('users');
    
    // Group students by reading level
    const readingLevelAggregation = await usersCollection.aggregate([
      { $group: { _id: "$readingLevel", count: { $sum: 1 } } }
    ]).toArray();
    
    // Generate prescriptive data for each reading level
    const prescriptiveData = readingLevelAggregation.map(level => {
      const readingLevel = level._id || 'Not Assessed';
      const studentCount = level.count;
      let issues = [];
      let broadAnalysis = '';
      
      if (readingLevel === 'Not Assessed') {
        issues = [
          { issue: 'Reading assessment needed', count: studentCount },
          { issue: 'Baseline skills evaluation required', count: Math.ceil(studentCount * 0.8) }
        ];
        broadAnalysis = 'Assessment needed to determine appropriate instructional strategies.';
      } else if (readingLevel === 'Early') {
        issues = [
          { issue: 'Alphabet Knowledge', count: Math.ceil(studentCount * 0.9) },
          { issue: 'Phonological Awareness', count: Math.ceil(studentCount * 0.8) },
          { issue: 'Print Concepts', count: Math.ceil(studentCount * 0.7) }
        ];
        broadAnalysis = 'Students at the Early level need support with letter recognition, sound-letter correspondence, and basic print concepts. Activities should focus on alphabet knowledge and phonological awareness.';
      } else if (readingLevel === 'Emergent') {
        issues = [
          { issue: 'Phonological Awareness', count: Math.ceil(studentCount * 0.7) },
          { issue: 'Decoding', count: Math.ceil(studentCount * 0.6) },
          { issue: 'Word Recognition', count: Math.ceil(studentCount * 0.5) }
        ];
        broadAnalysis = 'Emergent readers need continued support with phonological awareness while building decoding skills. Focus on sound blending, syllable patterns, and high-frequency word recognition.';
      } else if (readingLevel === 'Fluent') {
        issues = [
          { issue: 'Reading Comprehension', count: Math.ceil(studentCount * 0.6) },
          { issue: 'Critical Thinking', count: Math.ceil(studentCount * 0.5) },
          { issue: 'Literary Analysis', count: Math.ceil(studentCount * 0.4) }
        ];
        broadAnalysis = 'Fluent readers should engage with more complex texts that develop critical thinking, inference skills, and literary analysis. Focus on higher-order comprehension and analytical reading skills.';
      }
      
      return {
        antasLevel: readingLevel,
        studentCount,
        completionRate: readingLevel === 'Not Assessed' ? 0 : Math.round(50 + (Math.random() * 40)),
        issues,
        broadAnalysis
      };
    });
    
    return res.json(prescriptiveData);
    
  } catch (error) {
    console.error('Error generating prescriptive data:', error);
    return res.status(500).json({ message: 'Server error', error: error.message });
  }
});

module.exports = router;