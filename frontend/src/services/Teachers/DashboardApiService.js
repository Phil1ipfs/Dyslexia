import axios from 'axios';

// API base URL from environment variable
const API_BASE_URL = import.meta?.env?.VITE_API_BASE_URL || 'http://localhost:5002/api';

const PARENT_API = `${API_BASE_URL}/parents`;


/**
 * Service for handling Dashboard API requests
 */
class DashboardApiService {
  /**
   * Fetch all dashboard data in a single request
   * @param {Object} authHeaders - Authentication headers
   * @returns {Promise<Object>} - Dashboard data
   */
  static async getDashboardData(authHeaders) {
    try {
      const response = await axios.get(`${API_BASE_URL}/dashboard/data`, authHeaders);
      return response.data;
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
      return this.fetchDashboardDataSeparately(authHeaders);
    }
  }



  /**
   * Fallback method to fetch dashboard data through separate API calls
   * @param {Object} authHeaders - Authentication headers
   * @returns {Promise<Object>} - Dashboard data
   */
  static async fetchDashboardDataSeparately(authHeaders) {
    try {
      // Fetch students
      const studentsResponse = await axios.get(`${API_BASE_URL}/student/students`, authHeaders);
      const studentsData = studentsResponse.data.students || [];

      // Process student data
      const processedData = this.processStudentData(studentsData);

      // Fetch metrics
      let metrics;
      try {
        const metricsResponse = await axios.get(`${API_BASE_URL}/dashboard/metrics`, authHeaders);
        metrics = metricsResponse.data;
      } catch (error) {
        console.warn('Could not fetch metrics, calculating locally', error);
        metrics = this.calculateMetrics(processedData.allStudents);
      }

      // Fetch or generate pending activities
      let pendingActivities;
      try {
        const activitiesResponse = await axios.get(`${API_BASE_URL}/dashboard/activities`, authHeaders);
        pendingActivities = activitiesResponse.data;
      } catch (error) {
        console.warn('Could not fetch activities, generating locally', error);
        pendingActivities = this.generateActivities(processedData.allStudents);
      }

      // Fetch or generate reading level distribution
      let readingLevelDistribution;
      try {
        const distributionResponse = await axios.get(`${API_BASE_URL}/dashboard/reading-level-distribution`, authHeaders);
        readingLevelDistribution = distributionResponse.data;
      } catch (error) {
        console.warn('Could not fetch reading level distribution, using calculated data', error);
        readingLevelDistribution = processedData.readingLevelDistribution;
      }

      // Fetch or generate prescriptive data
      let prescriptiveData;
      try {
        const prescriptiveResponse = await axios.get(`${API_BASE_URL}/dashboard/prescriptive-data`, authHeaders);
        prescriptiveData = prescriptiveResponse.data;
      } catch (error) {
        console.warn('Could not fetch prescriptive data, generating locally', error);
        prescriptiveData = this.generatePrescriptiveData(readingLevelDistribution);
      }

      // Extract unique sections
      const sections = [...new Set(processedData.allStudents
        .map(student => student.section)
        .filter(section => section)
      )];

      // Generate progress data
      const progressData = this.generateProgressData(readingLevelDistribution);

      // Combine and return all data
      return {
        students: processedData.allStudents,
        studentsNeedingAttention: processedData.studentsNeedingAttention,
        readingLevelDistribution,
        metrics,
        pendingActivities,
        prescriptiveData,
        sections: sections.length > 0 ? sections : ['Sampaguita', 'Unity', 'Dignity'],
        progressData
      };
    } catch (error) {
      console.error('Error fetching dashboard data separately:', error);
      throw error;
    }
  }

  /**
 * Fetch a parent’s profile by _id from the `parent.profile` collection
 */
  static async getParentProfile(parentId, authHeaders) {
    const { data } = await axios.get(
      `${PARENT_API}/profile/${parentId}`,
      authHeaders
    );
    return data;
  }

  /**
   * Process raw student data for dashboard use
   * @param {Array} studentsData - Raw student data from MongoDB
   * @returns {Object} Processed data for dashboard display
   */
  static processStudentData(studentsData) {
    if (!studentsData || studentsData.length === 0) {
      return {
        allStudents: [],
        readingLevelDistribution: [],
        studentsNeedingAttention: []
      };
    }

    // Process the students data
    const allStudents = studentsData.map(student => {
      // Extract ID from MongoDB format
      const id = student._id?.$oid ||
        (typeof student._id === 'object' ? student._id.toString() : student._id) ||
        student.id ||
        student.idNumber?.toString() ||
        '';

      // Use reading level directly from database
      const readingLevel = student.readingLevel || 'Not Assessed';

      // Calculate completion rate
      let completionRate = 0;
      if (student.completedLessons && Array.isArray(student.completedLessons)) {
        const totalAssigned = 25; // Assuming 25 as default total
        completionRate = Math.round((student.completedLessons.length / totalAssigned) * 100);
      } else {
        // Fallback to a random value
        completionRate = Math.floor(Math.random() * 80) + 10;
      }

      // Get score - use readingPercentage if available
      const lastScore = student.readingPercentage
        ? parseFloat(student.readingPercentage)
        : (readingLevel === 'Early' ? 40 :
          readingLevel === 'Emergent' ? 55 :
            readingLevel === 'Fluent' ? 85 : 60);

      // Format name correctly from MongoDB document
      const name = student.name ||
        `${student.firstName || ''} ${student.middleName ? student.middleName + ' ' : ''}${student.lastName || ''}`.trim();

      // Determine categories for improvement based on reading level
      const improvementCategories = this.determineCategoriesForImprovement(readingLevel);

      // Create difficulty text based on categories
      let difficulty;
      if (readingLevel === 'Not Assessed') {
        difficulty = 'Needs assessment to determine areas for improvement';
      } else {
        difficulty = improvementCategories.join('; ');
      }

      // Format address or use default
      const address = student.address || 'Address not available';

      // Format gender or use default
      const gender = student.gender || 'Not specified';

      // Format parent information or use default
      const parentId = student.parentId?.$oid || student.parentId || null;
      const parentName = student.parentName || student.parent || 'Not specified';

      return {
        id,
        name,
        readingLevel,
        section: student.section || 'Sampaguita', // Default section if not specified
        gradeLevel: student.gradeLevel || 'Grade 1',
        gender,
        age: student.age || 'Not specified',
        lastScore,
        completionRate,
        difficulty,
        improvementCategories,
        needsAttention: readingLevel === 'Not Assessed' ||
          readingLevel === 'Early' ||
          lastScore < 70 ||
          completionRate < 60,
        // Additional fields
        profileImageUrl: student.profileImageUrl || null,
        address,
        parentId,
        parentName,
        lastAssessment: student.lastAssessmentDate ?
          new Date(student.lastAssessmentDate).toLocaleDateString('en-US', {
            year: 'numeric', month: 'long', day: 'numeric'
          }) : 'Not assessed',
        preAssessmentCompleted: student.preAssessmentCompleted || false
      };
    });

    // Calculate reading level distribution
    const readingLevelMap = {};
    allStudents.forEach(student => {
      if (readingLevelMap[student.readingLevel]) {
        readingLevelMap[student.readingLevel]++;
      } else {
        readingLevelMap[student.readingLevel] = 1;
      }
    });

    // Format distribution for pie chart
    const readingLevelDistribution = Object.entries(readingLevelMap)
      .filter(([level]) => level) // Filter out empty levels
      .map(([name, value]) => ({
        name,
        value,
        color: this.getReadingLevelColor(name)
      }));

    // Sort by reading level progression
    const levelOrder = [
      'Early',
      'Emergent',
      'Fluent',
      'Not Assessed'
    ];
    readingLevelDistribution.sort((a, b) =>
      levelOrder.indexOf(a.name) - levelOrder.indexOf(b.name)
    );

    // Get students needing attention - focus on those not assessed, early readers, or low scores
    const studentsNeedingAttention = allStudents
      .filter(student => student.needsAttention)
      .sort((a, b) => {
        // Prioritize Not Assessed, then sort by score
        if (a.readingLevel === 'Not Assessed' && b.readingLevel !== 'Not Assessed') return -1;
        if (a.readingLevel !== 'Not Assessed' && b.readingLevel === 'Not Assessed') return 1;
        return a.lastScore - b.lastScore;
      })
      .slice(0, 10); // Limit to top 10 students

    return {
      allStudents,
      readingLevelDistribution,
      studentsNeedingAttention
    };
  }

  /**
   * Determine categories for improvement based on reading level
   * @param {string} readingLevel - The student's reading level
   * @returns {Array} Categories needing improvement
   */
  static determineCategoriesForImprovement(readingLevel) {
    switch (readingLevel) {
      case 'Early':
        return ['Alphabet Knowledge', 'Phonological Awareness'];
      case 'Emergent':
        return ['Phonological Awareness', 'Decoding'];
      case 'Fluent':
        return ['Reading Comprehension', 'Critical Thinking'];
      case 'Not Assessed':
        return ['Pre-Assessment Needed'];
      default:
        return ['Literacy Skills Assessment'];
    }
  }

  /**
   * Get color for a reading level
   * @param {string} level - Reading level
   * @returns {string} HEX color code
   */
  static getReadingLevelColor(level) {
    const colors = {
      'Early': '#FF6B8A',
      'Emergent': '#FF9E40',
      'Fluent': '#4BC0C0',
      'Not Assessed': '#B0B0B0'
    };
    return colors[level] || '#B0B0B0';
  }

  /**
   * Calculate metrics for dashboard overview
   * @param {Array} students - Students array
   * @returns {Object} Metrics object
   */
  static calculateMetrics(students) {
    if (!students || students.length === 0) {
      return {
        totalStudents: 0,
        completionRate: 0,
        averageScore: 0,
        assignedActivities: 0,
        completedActivities: 0,
        pendingEdits: 0
      };
    }

    const totalStudents = students.length;

    // Only count activities for assessed students
    const assessedStudents = students.filter(student => student.readingLevel !== 'Not Assessed');
    const totalAssignedActivities = assessedStudents.length * 25; // Assuming 25 activities per student

    const completedActivities = assessedStudents.reduce(
      (sum, student) => sum + Math.round((student.completionRate / 100) * 25), 0
    );

    const completionRate = totalAssignedActivities > 0
      ? Math.round((completedActivities / totalAssignedActivities) * 100)
      : 0;

    const averageScore = assessedStudents.length > 0
      ? Math.round(assessedStudents.reduce((sum, student) => sum + student.lastScore, 0) / assessedStudents.length)
      : 0;

    // Count pending activities based on students who need attention
    const pendingEdits = students.filter(s => s.needsAttention).length;

    return {
      totalStudents,
      completionRate,
      averageScore,
      assignedActivities: totalAssignedActivities,
      completedActivities,
      pendingEdits
    };
  }

  /**
   * Generate activities for dashboard
   * @param {Array} students - Students array
   * @returns {Array} Activities array
   */
  static generateActivities(students) {
    const pendingStudents = students
      .filter(s => s.needsAttention)
      .slice(0, 10); // Limit to top 10 students

    // Generate different types of activities based on reading level
    return pendingStudents.map((student, index) => {
      let type, details, status;

      if (student.readingLevel === 'Not Assessed') {
        type = 'Pre-Assessment Required';
        details = `${student.name} needs to complete pre-assessment to determine reading level`;
        status = 'Urgent';
      } else if (student.readingLevel === 'Early') {
        type = 'Reading Foundation Development';
        details = `${student.name} needs focused assistance with ${student.improvementCategories[0]}`;
        status = 'Urgent';
      } else if (student.lastScore < 60) {
        type = 'Intervention Activity Needed';
        details = `${student.name} is struggling with ${student.improvementCategories[0]}`;
        status = 'Pending';
      } else {
        type = 'Progress Monitoring';
        details = `Review ${student.name}'s recent progress in ${student.improvementCategories[0]}`;
        status = 'Scheduled';
      }

      // Create an activity date - more recent for urgent items
      const activityDate = new Date();
      if (status === 'Urgent') {
        activityDate.setDate(activityDate.getDate() - Math.floor(Math.random() * 3)); // 0-2 days ago
      } else if (status === 'Pending') {
        activityDate.setDate(activityDate.getDate() - Math.floor(Math.random() * 5) - 3); // 3-7 days ago
      } else {
        activityDate.setDate(activityDate.getDate() - Math.floor(Math.random() * 5) - 5); // 5-10 days ago
      }

      return {
        id: `act-${student.id || index}`,
        type,
        status,
        date: this.formatDate(activityDate, 'short'),
        studentName: student.name,
        studentId: student.id,
        studentSection: student.section || 'Sampaguita',
        antasLevel: student.readingLevel,
        details
      };
    });
  }

  /**
   * Generate progress data for charts
   * NOTE: This is mockup data for visualization purposes.
   * In production, this should be fetched from the database.
   * @param {Array} levelDistribution - Reading level distribution
   * @returns {Object} Progress data for charts
   */
  static generateProgressData(levelDistribution) {
    // Create progress data for each reading level
    const weeklyData = (baseValue, count = 4) => Array.from({ length: count }, (_, i) => ({
      name: `${i + 1}`,
      progress: Math.min(100, Math.round(baseValue + (i * (80 / count))))
    }));

    const monthlyData = (baseValue, count = 6) => {
      const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
      const date = new Date();
      const currentMonth = date.getMonth();

      return Array.from({ length: count }, (_, i) => {
        const monthIndex = (currentMonth - (count - 1)

          + i) % 12;
        return {
          name: months[monthIndex >= 0 ? monthIndex : monthIndex + 12],
          progress: Math.min(100, Math.round(baseValue + (i * (80 / count))))
        };
      });
    };

    // Create progress data for each reading level
    const data = {};

    levelDistribution.forEach(level => {
      // Base value depends on the reading level
      let baseValue;
      switch (level.name) {
        case 'Early': baseValue = 25; break;
        case 'Emergent': baseValue = 40; break;
        case 'Fluent': baseValue = 70; break;
        case 'Not Assessed': baseValue = 0; break;
        default: baseValue = 50;
      }

      // Only generate progress data for assessed levels
      if (level.name !== 'Not Assessed') {
        data[level.name] = {
          weekly: weeklyData(baseValue, 4),
          monthly: monthlyData(baseValue, 6)
        };
      } else {
        data[level.name] = {
          weekly: [],
          monthly: []
        };
      }
    });

    return data;
  }

  /**
   * Generate prescriptive data for reading levels
   * @param {Array} levelDistribution - Reading level distribution
   * @returns {Array} Prescriptive data
   */
  static generatePrescriptiveData(levelDistribution) {
    return levelDistribution.map(level => {
      let issueCount = level.value;
      let issues = [];
      let broadAnalysis = '';

      // Only generate meaningful data for assessed levels
      if (level.name === 'Not Assessed') {
        issues = [
          { issue: 'Reading assessment needed', count: issueCount },
          { issue: 'Baseline skills evaluation required', count: Math.ceil(issueCount * 0.8) }
        ];
        broadAnalysis = 'Assessment needed to determine appropriate instructional strategies.';
      } else if (level.name === 'Early') {
        issues = [
          { issue: 'Alphabet Knowledge', count: Math.ceil(issueCount * 0.9) },
          { issue: 'Phonological Awareness', count: Math.ceil(issueCount * 0.8) },
          { issue: 'Print Concepts', count: Math.ceil(issueCount * 0.7) }
        ];
        broadAnalysis = 'Students at the Early level need support with letter recognition, sound-letter correspondence, and basic print concepts. Activities should focus on alphabet knowledge and phonological awareness.';
      } else if (level.name === 'Emergent') {
        issues = [
          { issue: 'Phonological Awareness', count: Math.ceil(issueCount * 0.7) },
          { issue: 'Decoding', count: Math.ceil(issueCount * 0.6) },
          { issue: 'Word Recognition', count: Math.ceil(issueCount * 0.5) }
        ];
        broadAnalysis = 'Emergent readers need continued support with phonological awareness while building decoding skills. Focus on sound blending, syllable patterns, and high-frequency word recognition.';
      } else if (level.name === 'Fluent') {
        issues = [
          { issue: 'Reading Comprehension', count: Math.ceil(issueCount * 0.6) },
          { issue: 'Critical Thinking', count: Math.ceil(issueCount * 0.5) },
          { issue: 'Literary Analysis', count: Math.ceil(issueCount * 0.4) }
        ];
        broadAnalysis = 'Fluent readers should engage with more complex texts that develop critical thinking, inference skills, and literary analysis. Focus on higher-order comprehension and analytical reading skills.';
      }

      return {
        antasLevel: level.name,
        studentCount: level.value,
        completionRate: level.name === 'Not Assessed' ? 0 : Math.round(50 + (Math.random() * 40)),
        issues,
        broadAnalysis
      };
    });
  }

  /**
   * Format date for display
   * @param {Date} date - Date to format
   * @param {string} format - Format style (short, medium, long)
   * @returns {string} Formatted date string
   */
  static formatDate(date, format = 'medium') {
    if (!date) return 'Not available';

    try {
      const options = {
        short: { month: 'short', day: 'numeric' },
        medium: { year: 'numeric', month: 'short', day: 'numeric' },
        long: { year: 'numeric', month: 'long', day: 'numeric' }
      };

      return date.toLocaleDateString('en-US', options[format] || options.medium);
    } catch (error) {
      console.warn('Error formatting date:', error);
      return String(date);
    }
  }

  /**
   * Update activity status
   * @param {string} activityId - ID of the activity to update
   * @param {string} status - New status
   * @param {Object} authHeaders - Authentication headers
   * @returns {Promise<Object>} Updated activity
   */
  static async updateActivityStatus(activityId, status, authHeaders) {
    try {
      const response = await axios.put(
        `${API_BASE_URL}/dashboard/update-activity/${activityId}`,
        { status },
        authHeaders
      );
      return response.data;
    } catch (error) {
      console.error('Error updating activity status:', error);
      throw error;
    }
  }

  /**
   * Fetch student details
   * @param {string} studentId - ID of the student
   * @param {Object} authHeaders - Authentication headers
   * @returns {Promise<Object>} Student details
   */
  static async getStudentDetails(studentId, authHeaders) {
    try {
      const response = await axios.get(`${API_BASE_URL}/student/${studentId}`, authHeaders);
      return response.data;
    } catch (error) {
      console.error('Error fetching student details:', error);
      throw error;
    }
  }

  /**
   * Fetch students by reading level
   * @param {string} readingLevel - Reading level to filter by
   * @param {Object} authHeaders - Authentication headers
   * @returns {Promise<Array>} Filtered students
   */
  static async getStudentsByReadingLevel(readingLevel, authHeaders) {
    try {
      const response = await axios.get(
        `${API_BASE_URL}/student/by-reading-level/${readingLevel}`,
        authHeaders
      );
      return response.data.students || [];
    } catch (error) {
      console.error('Error fetching students by reading level:', error);
      throw error;
    }
  }

  /**
   * Fetch students by section
   * @param {string} section - Section to filter by
   * @param {Object} authHeaders - Authentication headers
   * @returns {Promise<Array>} Filtered students
   */
  static async getStudentsBySection(section, authHeaders) {
    try {
      const response = await axios.get(
        `${API_BASE_URL}/dashboard/by-section/${section}`,
        authHeaders
      );
      return response.data || [];
    } catch (error) {
      console.error('Error fetching students by section:', error);
      throw error;
    }
  }

  /**
   * Get activities for a specific student
   * @param {string} studentId - ID of the student
   * @param {Object} authHeaders - Authentication headers
   * @returns {Promise<Array>} Student activities
   */
  static async getStudentActivities(studentId, authHeaders) {
    try {
      const response = await axios.get(
        `${API_BASE_URL}/student/${studentId}/activities`,
        authHeaders
      );
      return response.data || [];
    } catch (error) {
      console.error('Error fetching student activities:', error);
      throw error;
    }
  }
}

export default DashboardApiService;