// src/pages/Teachers/TeacherDashboard.jsx
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, ReferenceLine, Area, PieChart, Pie, Cell,
  BarChart, Bar
} from 'recharts';

// Import services and utilities
import DashboardApiService from '../../services/Teachers/DashboardApiService';

// Import icons and CSS
import studentsIcon from '../../assets/icons/Teachers/students.png';
import activitiesIcon from '../../assets/icons/Teachers/students.png';
import pendingIcon from '../../assets/icons/Teachers/students.png';
import scoringIcon from '../../assets/icons/Teachers/students.png';
import '../../css/Teachers/TeacherDashboard.css';

/**
 * TeacherDashboard component
 * Displays overview of student performance, reading levels, and activities
 */
const TeacherDashboard = () => {
  // Navigation
  const navigate = useNavigate();

  // State variables
  const [selectedReadingLevel, setSelectedReadingLevel] = useState('All Levels');
  const [timeFrame, setTimeFrame] = useState('weekly');
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [studentDetailOpen, setStudentDetailOpen] = useState(false);
  const [readingLevelDetailOpen, setReadingLevelDetailOpen] = useState(false);
  const [notificationCount, setNotificationCount] = useState(0);
  const [studentFilter, setStudentFilter] = useState('all');
  const [sectionFilter, setSectionFilter] = useState('all');
  const [activityFilter, setActivityFilter] = useState('all');
  
  // Data state variables
  const [students, setStudents] = useState([]);
  const [sections, setSections] = useState(['Sampaguita', 'Rosal', 'Orchid']);
  const [readingLevelDistribution, setReadingLevelDistribution] = useState([]);
  const [studentsNeedingAttention, setStudentsNeedingAttention] = useState([]);
  const [studentsInSelectedLevel, setStudentsInSelectedLevel] = useState([]);
  const [pendingActivities, setPendingActivities] = useState([]);
  const [metrics, setMetrics] = useState({
    totalStudents: 0,
    completionRate: 0,
    averageScore: 0,
    assignedActivities: 0,
    completedActivities: 0,
    pendingEdits: 0
  });
  const [progressData, setProgressData] = useState({});
  const [prescriptiveData, setPrescriptiveData] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  // Fetch dashboard data on component mount
  useEffect(() => {
    fetchDashboardData();
  }, []);

  /**
   * Main function to fetch all dashboard data from MongoDB through API
   */
  const fetchDashboardData = async () => {
    setIsLoading(true);
    try {
      // 1. Fetch all students
      const studentsData = await DashboardApiService.getAllStudents();
      
      // 2. Process data for dashboard use
      const processedStudents = processStudentData(studentsData);
      setStudents(processedStudents.allStudents);
      
      // 3. Get reading level distribution
      let distributionData;
      try {
        distributionData = await DashboardApiService.getReadingLevelDistribution();
      } catch (error) {
        distributionData = processedStudents.readingLevelDistribution;
      }
      setReadingLevelDistribution(distributionData);
      
      // 4. Get students needing attention
      let attentionData;
      try {
        attentionData = await DashboardApiService.getStudentsNeedingAttention();
      } catch (error) {
        attentionData = processedStudents.studentsNeedingAttention;
      }
      setStudentsNeedingAttention(attentionData);

      // 5. Get dashboard metrics
      let metricsData;
      try {
        metricsData = await DashboardApiService.getDashboardMetrics();
      } catch (error) {
        metricsData = calculateMetrics(processedStudents.allStudents);
      }
      setMetrics(metricsData);
      
      // 6. Extract unique sections from student data
      const uniqueSections = [...new Set(processedStudents.allStudents
        .map(student => student.section)
        .filter(section => section)
      )];
      if (uniqueSections.length > 0) {
        setSections(uniqueSections);
      }
      
      // 7. Group students by reading level
      const studentsByLevel = {};
      distributionData.forEach(level => {
        studentsByLevel[level.name] = processedStudents.allStudents.filter(
          student => student.readingLevel === level.name
        );
      });
      
      // 8. Generate pending activities
      const pendingActivitiesData = generatePendingActivities(processedStudents.allStudents);
      setPendingActivities(pendingActivitiesData);
      setNotificationCount(pendingActivitiesData.length);
      
      // 9. Generate progress data for charts
      const progressChartData = generateProgressData(distributionData);
      setProgressData(progressChartData);
      
      // 10. Generate prescriptive analytics
      const prescriptiveInsights = generatePrescriptiveData(distributionData);
      setPrescriptiveData(prescriptiveInsights);
      
      // Set initial selected level if available
      if (distributionData.length > 0) {
        const initialLevel = distributionData[0].name;
        setSelectedReadingLevel(initialLevel);
        setStudentsInSelectedLevel(studentsByLevel[initialLevel] || []);
      }
    } catch (error) {
      console.error("Error fetching dashboard data:", error);
      
      // Fallback to empty data structures
      setStudents([]);
      setReadingLevelDistribution([]);
      setStudentsNeedingAttention([]);
      setMetrics({
        totalStudents: 0,
        completionRate: 0,
        averageScore: 0,
        assignedActivities: 0,
        completedActivities: 0,
        pendingEdits: 0
      });
      setPendingActivities([]);
      setProgressData({});
      setPrescriptiveData([]);
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Process raw student data for dashboard display
   * @param {Array} studentsData Raw student data from API
   * @returns {Object} Processed data with different groups
   */
  const processStudentData = (studentsData) => {
    if (!studentsData || studentsData.length === 0) {
      return {
        allStudents: [],
        readingLevelDistribution: [],
        studentsNeedingAttention: []
      };
    }

    // Process the students from MongoDB format
    const allStudents = studentsData.map(student => {
      // Extract ID from MongoDB format (_id.$oid or _id)
      const id = student._id?.$oid || 
                 (typeof student._id === 'object' ? student._id.toString() : student._id) || 
                 student.id || 
                 student.idNumber?.toString() || 
                 '';
      
      // Use reading level directly from database - don't convert
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
      const categories = DashboardApiService.determineCategoriesForImprovement(readingLevel);
      
      // Create difficulty text based on categories
      let difficulty;
      if (readingLevel === 'Not Assessed') {
        difficulty = 'Needs assessment to determine areas for improvement';
      } else {
        difficulty = categories.join('; ');
      }
      
      return {
        id, 
        name,
        readingLevel,
        section: student.section || 'Sampaguita', // Default section if not specified
        gradeLevel: student.gradeLevel || 'Grade 1',
        gender: student.gender || 'Not specified',
        age: student.age || 7,
        lastScore,
        completionRate,
        difficulty,
        improvementCategories: categories,
        needsAttention: readingLevel === 'Not Assessed' || 
                        readingLevel === 'Early' ||
                        lastScore < 70 ||
                        completionRate < 60,
        // Additional fields
        profileImageUrl: student.profileImageUrl || null,
        address: student.address || 'Address not available',
        parentId: student.parentId?.$oid || student.parentId || null,
        parentName: student.parentName || student.parent || 'Parent information not available',
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
        color: getReadingLevelColor(name)
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
  };

  /**
   * Get color for a reading level
   * @param {string} level Reading level
   * @returns {string} HEX color code
   */
  const getReadingLevelColor = (level) => {
    const colors = {
      'Early': '#FF6B8A',
      'Emergent': '#FF9E40',
      'Fluent': '#4BC0C0',
      'Not Assessed': '#B0B0B0'
    };
    return colors[level] || '#B0B0B0';
  };

  /**
   * Calculate metrics for dashboard overview
   * @param {Array} students Students array
   * @returns {Object} Metrics object
   */
  const calculateMetrics = (students) => {
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
  };

  /**
   * Generate pending activities for dashboard
   * @param {Array} students Students array
   * @returns {Array} Pending activities array
   */
  const generatePendingActivities = (students) => {
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
        date: formatDate(activityDate, 'short'),
        studentName: student.name,
        studentSection: student.section || 'Sampaguita',
        antasLevel: student.readingLevel,
        details
      };
    });
  };

  /**
   * Generate progress data for charts
   * @param {Array} levelDistribution Reading level distribution
   * @returns {Object} Progress data for charts
   */
  const generateProgressData = (levelDistribution) => {
    // Create progress data for each reading level
    const weeklyData = (baseValue, count = 4) => Array.from({ length: count }, (_, i) => ({
      name: `Week ${i + 1}`,
      progress: Math.min(100, Math.round(baseValue + (i * (80 / count))))
    }));
    
    const monthlyData = (baseValue, count = 6) => {
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
    const data = {};
    
    levelDistribution.forEach(level => {
      // Base value depends on the reading level
      let baseValue;
      switch(level.name) {
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
  };

  /**
   * Generate prescriptive data for reading levels
   * @param {Array} levelDistribution Reading level distribution
   * @returns {Array} Prescriptive data
   */
  const generatePrescriptiveData = (levelDistribution) => {
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
  };

  /**
   * Format date for display
   * @param {Date} date Date to format
   * @param {string} format Format style (short, medium, long)
   * @returns {string} Formatted date string
   */
  const formatDate = (date, format = 'medium') => {
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
  };

  // UI event handlers
  const toggleDropdown = () => setIsDropdownOpen(!isDropdownOpen);

  const selectReadingLevel = (level) => {
    setSelectedReadingLevel(level);
    setIsDropdownOpen(false);
    // Update students in selected level
    setStudentsInSelectedLevel(students.filter(s => s.readingLevel === level));
  };

  const toggleTimeFrame = () =>
    setTimeFrame(tf => (tf === 'weekly' ? 'monthly' : 'weekly'));

  const handleReadingLevelPieClick = (entry) => {
    setSelectedReadingLevel(entry.name);
    // Update students in selected level
    setStudentsInSelectedLevel(students.filter(s => s.readingLevel === entry.name));
    setReadingLevelDetailOpen(true);
  };

  const closeReadingLevelModal = () => {
    setReadingLevelDetailOpen(false);
  };

  const openStudentDetail = (student) => {
    setSelectedStudent(student);
    setStudentDetailOpen(true);
  };

  const closeStudentDetail = () => {
    setStudentDetailOpen(false);
    setSelectedStudent(null);
  };

  const handleReadingLevelFilter = (filter) => {
    setStudentFilter(filter);
  };

  const handleSectionFilter = (section) => {
    setSectionFilter(section);
  };

  const handleActivityFilter = (status) => {
    setActivityFilter(status);
  };
  
  const handleResolveActivity = (activityId) => {
    // Mark the activity as resolved
    const updatedActivities = pendingActivities.map(activity => {
      if (activity.id === activityId) {
        return { ...activity, status: 'Resolved' };
      }
      return activity;
    });
    
    // Update state to reflect the change
    setPendingActivities(updatedActivities);
    
    // In a real application, this would also make an API call to update the database
    // For example:
    // axios.put(`${API_BASE_URL}/student/update-activity/${activityId}`, 
    //   { status: 'Resolved' }, 
    //   getAuthHeaders()
    // );
  };
  
  const viewStudentDetails = (student) => {
    if (studentDetailOpen) {
      closeStudentDetail();
    }
    navigate(`/teacher/student-details/${student.id}`);
  };

  // Get chart data for the selected reading level
  const chartData = progressData[selectedReadingLevel]?.[timeFrame] || [];

  // Filter students based on selected filters
  const filteredStudents = studentFilter === 'all'
    ? studentsNeedingAttention
    : studentsNeedingAttention.filter(student => student.readingLevel === studentFilter);

  // Further filter by section if needed
  const sectionFilteredStudents = sectionFilter === 'all'
    ? filteredStudents
    : filteredStudents.filter(student => student.section === sectionFilter);

  // Filter activities
  const filteredActivities = activityFilter === 'all'
    ? pendingActivities
    : activityFilter === 'Urgent'
      ? pendingActivities.filter(activity => activity.status === 'Urgent')
      : activityFilter === 'Pending'
        ? pendingActivities.filter(activity => activity.status === 'Pending')
        : pendingActivities.filter(activity => activity.status === 'Scheduled');

  // Further filter activities by section if needed
  const sectionFilteredActivities = sectionFilter === 'all'
    ? filteredActivities
    : filteredActivities.filter(activity => activity.studentSection === sectionFilter);

  if (isLoading) {
    return (
      <div className="litx-dashboard-loading">
        <div className="loading-spinner"></div>
        <p>Loading dashboard data...</p>
      </div>
    );
  }

  return (
    <div className="litx-dashboard">
      {/* Header with dashboard title and notification bell */}
      <main className="litx-dashboard__content">
        <div className="litx-dashboard__header">
          <h1 className="litx-dashboard__title">Teacher Dashboard</h1>

          <div className="litx-notification-bell">
            <span className="litx-notification-icon">🔔</span>
            {notificationCount > 0 && (
              <span className="litx-notification-badge">{notificationCount}</span>
            )}
          </div>
        </div>

        {/* Stats Cards Grid - Key metrics at the top */}
        <div className="litx-dashboard__stats">
          <div className="litx-stat-card litx-stat-card--students">
            <img src={studentsIcon} alt="Students" className="litx-stat-card__icon" />
            <div className="litx-stat-card__info">
              <h3 className="litx-stat-card__heading">Total Students</h3>
              <p className="litx-stat-card__value">{metrics.totalStudents}</p>
            </div>
          </div>

          <div className="litx-stat-card litx-stat-card--scoring">
            <img src={scoringIcon} alt="Score" className="litx-stat-card__icon" />
            <div className="litx-stat-card__info">
              <h3 className="litx-stat-card__heading">Average Score</h3>
              <p className="litx-stat-card__value">{metrics.averageScore}%</p>
            </div>
          </div>

          <div className="litx-stat-card litx-stat-card--activities">
            <img src={activitiesIcon} alt="Activities" className="litx-stat-card__icon" />
            <div className="litx-stat-card__info">
              <h3 className="litx-stat-card__heading">Completion Rate</h3>
              <p className="litx-stat-card__value">{metrics.completionRate}%</p>
              <p className="litx-stat-card__subtitle">
                {metrics.completedActivities} of {metrics.assignedActivities}
              </p>
            </div>
          </div>

          <div className="litx-stat-card litx-stat-card--pending">
            <img src={pendingIcon} alt="Pending" className="litx-stat-card__icon" />
            <div className="litx-stat-card__info">
              <h3 className="litx-stat-card__heading">Pending Actions</h3>
              <p className="litx-stat-card__value">{metrics.pendingEdits}</p>
            </div>
          </div>
        </div>

        {/* Students Needing Attention Section */}
        <div className="litx-card litx-full-width-card litx-students-card">
          <div className="litx-card__header">
            <h2 className="litx-card__title">Students Needing Attention</h2>
            <div className="litx-filter-controls">
              <span className="litx-filter-label">Reading Level:</span>
              <div className="litx-filter-buttons">
                <button
                  className={`litx-filter-btn ${studentFilter === 'all' ? 'litx-filter-btn--active' : ''}`}
                  onClick={() => handleReadingLevelFilter('all')}
                >
                  All
                </button>
                {readingLevelDistribution.map((level) => (
                  <button
                    key={level.name}
                    className={`litx-filter-btn ${studentFilter === level.name ? 'litx-filter-btn--active' : ''}`}
                    onClick={() => handleReadingLevelFilter(level.name)}
                    style={{
                      backgroundColor: studentFilter === level.name ? getReadingLevelColor(level.name) : 'transparent',
                      color: studentFilter === level.name ? 'white' : 'inherit'
                    }}
                  >
                    {level.name}
                  </button>
                ))}
              </div>
              
              <span className="litx-filter-label">Section:</span>
              <div className="litx-filter-buttons">
                <button
                  className={`litx-filter-btn ${sectionFilter === 'all' ? 'litx-filter-btn--active' : ''}`}
                  onClick={() => handleSectionFilter('all')}
                >
                  All
                </button>
                {sections.map((section) => (
                  <button
                    key={section}
                    className={`litx-filter-btn ${sectionFilter === section ? 'litx-filter-btn--active' : ''}`}
                    onClick={() => handleSectionFilter(section)}
                  >
                    {section}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Student Scores Bar Chart */}
          <div className="litx-score-chart-container">
            <ResponsiveContainer width="100%" height={180}>
              <BarChart
                data={sectionFilteredStudents.map(student => ({
                  name: student.name.split(' ')[0], // First name only for chart
                  score: student.lastScore
                }))}
                margin={{ top: 10, right: 0, left: 0, bottom: 20 }}
                barSize={18}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
                <XAxis
                  dataKey="name"
                  scale="band"
                  tick={{ fill: 'white', fontSize: 10 }}
                  axisLine={{ stroke: 'rgba(255,255,255,0.3)' }}
                />
                <YAxis
                  domain={[0, 100]}
                  tick={{ fill: 'white', fontSize: 10 }}
                  axisLine={{ stroke: 'rgba(255,255,255,0.3)' }}
                  tickFormatter={(value) => `${value}%`}
                />
                <Tooltip
                  formatter={(value) => [`${value}%`, 'Score']}
                  contentStyle={{
                    background: '#3B4F81',
                    border: '1px solid #F3C922',
                    color: 'white',
                    borderRadius: '6px',
                    fontSize: '13px',
                    lineHeight: '1.5',
                  }}
                  labelStyle={{
                    color: 'white',
                    fontWeight: 500,
                  }}
                  itemStyle={{
                    color: 'white',
                    fontWeight: 500,
                  }}
                  cursor={{ fill: 'transparent' }}
                />

                <ReferenceLine y={70} stroke="#F3C922" strokeWidth={1} strokeDasharray="3 3" />

                <Bar dataKey="score" radius={[4, 4, 0, 0]}>
                  {sectionFilteredStudents.map((student, i) => (
                    <Cell
                      key={`cell-${i}`}
                      fill={getReadingLevelColor(student.readingLevel)}
                      cursor="pointer"
                      onClick={() => openStudentDetail(student)}
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Students Needing Attention Table */}
          <div className="litx-students-table-container">
            <table className="litx-students-table">
              <thead>
                <tr>
                  <th>Student</th>
                  <th>Reading Level</th>
                  <th>Section</th>
                  <th>Categories Needing Improvement</th>
                  <th>Score</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {sectionFilteredStudents.length > 0 ? (
                  sectionFilteredStudents.map((student) => (
                    <tr key={student.id} className="litx-student-row">
                      <td>{student.name}</td>
                      <td>
                        <span
                          className="litx-antas-badge"
                          style={{ backgroundColor: getReadingLevelColor(student.readingLevel) }}
                        >
                          {student.readingLevel}
                        </span>
                      </td>
                      <td>{student.section}</td>
                      <td className="litx-difficulty-cell">
                        <span className="litx-difficulty-text">
                          {student.readingLevel === 'Not Assessed' 
                            ? 'Needs assessment to determine areas for improvement'
                            : student.improvementCategories.join(', ')}
                        </span>
                      </td>
                      <td>{student.readingLevel === 'Not Assessed' ? 'N/A' : `${student.lastScore}%`}</td>
                      <td>
                        <button
                          className="litx-view-button"
                          onClick={() => openStudentDetail(student)}
                        >
                          View
                        </button>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="6" style={{ textAlign: 'center', padding: '20px' }}>
                      No students found matching the current filter.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Main 2x2 grid structure */}
        <div className="litx-dashboard__main-grid">
          {/* Top-left cell: Reading Level Distribution Chart */}
          <div className="litx-dashboard__grid-cell">
            <div className="litx-card litx-distribution-card">
              <h2 className="litx-card__title">Students by Reading Level</h2>
              <div className="litx-antas-distribution">
                <div className="litx-pie-chart">
                  <ResponsiveContainer width="120%" height={320}>
                    <PieChart>
                      <Pie
                        data={readingLevelDistribution}
                        cx="50%"
                        cy="50%"
                        outerRadius={80}
                        innerRadius={50}
                        dataKey="value"
                        nameKey="name"
                        onClick={handleReadingLevelPieClick}
                        cursor="pointer"
                      >
                        {readingLevelDistribution.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip
                        formatter={(value, name) => [`${value} students`, name]}
                        contentStyle={{
                          background: '#3B4F81',
                          border: '2px solid #F3C922',
                          borderRadius: '8px',
                          color: 'white',
                          padding: '8px 12px',
                          boxShadow: '0 2px 10px rgba(0,0,0,0.25)',
                        }}
                        itemStyle={{ color: 'white' }}
                        cursor={{ fill: 'transparent' }}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                </div>

                <div className="litx-antas-legend">
                  {readingLevelDistribution.map((entry, index) => (
                    <div
                      key={index}
                      className="litx-legend-item"
                      onClick={() => handleReadingLevelPieClick(entry)}
                    >
                      <div
                        className="litx-legend-color"
                        style={{ backgroundColor: entry.color }}
                      ></div>
                      <div className="litx-legend-text">
                        <span>{entry.name}</span>
                        <span className="litx-legend-value">{entry.value} students</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Top-right cell: Progress Chart */}
          <div className="litx-dashboard__grid-cell">
            <div className="litx-card litx-chart-card">
              <div className="litx-chart__header">
                <h2 className="litx-card__title">
                  {timeFrame === 'weekly' ? 'Weekly' : 'Monthly'} Reading Progress
                </h2>
                <div className="litx-chart__controls">
                  <button
                    className="litx-timeframe-btn"
                    onClick={toggleTimeFrame}
                  >
                    {timeFrame === 'weekly' ? 'Show Monthly' : 'Show Weekly'}
                  </button>
                  <div className="litx-dropdown">
                    <button
                      className="litx-dropdown__trigger"
                      onClick={toggleDropdown}
                    >
                      {selectedReadingLevel}
                      <span className={`litx-dropdown__arrow ${isDropdownOpen ? 'litx-dropdown__arrow--open' : ''}`}>▼</span>
                    </button>
                    {isDropdownOpen && (
                      <div className="litx-dropdown__menu">
                        {readingLevelDistribution
                          .filter(level => level.name !== 'Not Assessed') // Exclude Not Assessed from progress chart
                          .map((level, index) => (
                            <div
                              key={index}
                              className={`litx-dropdown__item ${selectedReadingLevel === level.name ? 'litx-dropdown__item--active' : ''}`}
                              onClick={() => selectReadingLevel(level.name)}
                            >
                              {level.name}
                            </div>
                          ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>

              <div className="litx-chart__container">
                {selectedReadingLevel !== 'Not Assessed' && chartData.length > 0 ? (
                  <ResponsiveContainer width="100%" height={300}>
                    <LineChart
                      data={chartData}
                      margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.3)" />
                      <XAxis
                        dataKey="name"
                        axisLine={{ stroke: 'white', strokeWidth: 2 }}
                        tick={{ fill: 'white', fontSize: 12 }}
                        tickLine={{ stroke: 'white', strokeWidth: 2 }}
                        tickMargin={12}
                      />
                      <YAxis
                        domain={[0, 100]}
                        axisLine={{ stroke: 'white', strokeWidth: 2 }}
                        tick={{ fill: 'white', fontSize: 11 }}
                        tickLine={{ stroke: 'white' }}
                        tickFormatter={(value) => `${value}%`}
                      />
                      <defs>
                        <linearGradient id="litxAreaFill" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor={getReadingLevelColor(selectedReadingLevel)} stopOpacity={0.8} />
                          <stop offset="95%" stopColor={getReadingLevelColor(selectedReadingLevel)} stopOpacity={0.1} />
                        </linearGradient>
                      </defs>
                      <Area
                        type="monotone"
                        dataKey="progress"
                        fill="url(#litxAreaFill)"
                        stroke="none"
                      />
                      <Line
                        type="monotone"
                        dataKey="progress"
                        stroke={getReadingLevelColor(selectedReadingLevel)}
                        strokeWidth={3}
                        dot={{
                          fill: '#3B4F81',
                          stroke: 'white',
                          strokeWidth: 2,
                          r: 6
                        }}
                        activeDot={{
                          r: 8,
                          fill: '#F3C922',
                          stroke: 'white'
                        }}
                      />
                      <ReferenceLine
                        y={80}
                        stroke="#F3C922"
                        strokeWidth={2}
                        strokeDasharray="5 5"
                        label={{
                          value: 'Target',
                          position: 'right',
                          fill: '#F3C922',
                          fontSize: 12
                        }}
                      />
                      <Tooltip
                        contentStyle={{
                          background: '#3B4F81',
                          border: '1px solid rgba(255,255,255,0.2)',
                          borderRadius: '8px',
                          color: 'white',
                          padding: '10px'
                        }}
                        formatter={(value) => [`${value}%`, 'Progress']}
                        labelFormatter={(label) => timeFrame === 'weekly' ? `Week ${label}` : label}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="litx-no-data-message">
                    {selectedReadingLevel === 'Not Assessed' ? (
                      <p>No progress data available for students who haven't been assessed.</p>
                    ) : (
                      <p>No progress data available for this reading level.</p>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Full-width Activity Modifications */}
        <div className="litx-dashboard__full-width">
          <div className="litx-card litx-activity-modifications-card">
            <div className="litx-card__header">
              <h2 className="litx-card__title">Activity Modifications</h2>
              <div className="litx-filter-controls">
                <div className="litx-filter-group">
                  <span className="litx-filter-label">Status:</span>
                  <div className="litx-filter-buttons">
                    <button
                      className={`litx-filter-btn ${activityFilter === 'all' ? 'litx-filter-btn-highlighted' : ''}`}
                      onClick={() => handleActivityFilter('all')}
                    >
                      All
                    </button>
                    <button
                      className={`litx-filter-btn ${activityFilter === 'Urgent' ? 'litx-filter-btn-highlighted' : ''}`}
                      onClick={() => handleActivityFilter('Urgent')}
                      style={{
                        backgroundColor: activityFilter === 'Urgent' ? '#FF6B8A' : 'transparent',
                        color: activityFilter === 'Urgent' ? 'white' : 'inherit'
                      }}
                    >
                      Urgent
                    </button>
                    <button
                      className={`litx-filter-btn ${activityFilter === 'Pending' ? 'litx-filter-btn-highlighted' : ''}`}
                      onClick={() => handleActivityFilter('Pending')}
                      style={{
                        backgroundColor: activityFilter === 'Pending' ? '#FFCD56' : 'transparent',
                        color: activityFilter === 'Pending' ? 'white' : 'inherit'
                      }}
                    >
                      Pending
                    </button>
                    <button
                      className={`litx-filter-btn ${activityFilter === 'Scheduled' ? 'litx-filter-btn-highlighted' : ''}`}
                      onClick={() => handleActivityFilter('Scheduled')}
                      style={{
                        backgroundColor: activityFilter === 'Scheduled' ? '#4BC0C0' : 'transparent',
                        color: activityFilter === 'Scheduled' ? 'white' : 'inherit'
                      }}
                    >
                      Scheduled
                    </button>
                  </div>
                </div>
                
                <div className="litx-filter-group">
                  <span className="litx-filter-label">Section:</span>
                  <div className="litx-filter-buttons">
                    <button
                      className={`litx-filter-btn ${sectionFilter === 'all' ? 'litx-filter-btn-highlighted' : ''}`}
                      onClick={() => handleSectionFilter('all')}
                    >
                      All
                    </button>
                    {sections.map((section) => (
                      <button
                        key={section}
                        className={`litx-filter-btn ${sectionFilter === section ? 'litx-filter-btn-highlighted' : ''}`}
                        onClick={() => handleSectionFilter(section)}
                      >
                        {section}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>
            
            <div className="litx-activity-list">
              {sectionFilteredActivities.length > 0 ? (
                sectionFilteredActivities.map((activity) => (
                  <div
                    key={activity.id}
                    className={`litx-activity-item litx-activity-item--${activity.status.toLowerCase()}`}
                  >
                    <div className="litx-activity-header">
                      <div className="litx-activity-type">
                        <span 
                          className={`litx-status-indicator litx-status-${activity.status.toLowerCase()}`}
                        ></span>
                        {activity.type}
                      </div>
                      <span className="litx-activity-status">{activity.status}</span>
                      <span className="litx-activity-date">{activity.date}</span>
                    </div>
                    <div className="litx-activity-content">
                      <div className="litx-student-badge">
                        <span className="litx-student-name">{activity.studentName}</span>
                        <span className="litx-student-section">{activity.studentSection}</span>
                      </div>
                      {activity.antasLevel && (
                        <span
                          className={`litx-reading-level-badge litx-reading-level-badge--${activity.antasLevel.toLowerCase().replace(/\s+/g, '-')}`}
                          style={{ backgroundColor: getReadingLevelColor(activity.antasLevel) + '20', color: getReadingLevelColor(activity.antasLevel) }}
                        >
                          {activity.antasLevel}
                        </span>
                      )}
                      <p className="litx-activity-description">{activity.details}</p>
                      <div className="litx-activity-actions">
                        <button 
                          className="litx-activity-btn litx-activity-btn--review"
                          onClick={() => navigate('/teacher/manage-activities')}
                        >
                          Review
                        </button>
                        <button 
                          className="litx-activity-btn litx-activity-btn--resolve"
                          onClick={() => handleResolveActivity(activity.id)}
                        >
                          Mark as Resolved
                        </button>
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="litx-no-activities">
                  <p>No pending activity modifications matching the current filters.</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </main>

      {/* Modal for Reading Level Details */}
      {readingLevelDetailOpen && (
        <div className="litx-modal-overlay" onClick={closeReadingLevelModal}>
          <div className="litx-modal-content" onClick={(e) => e.stopPropagation()}>
            <div
              className="litx-modal-header"
              style={{ backgroundColor: getReadingLevelColor(selectedReadingLevel) }}
            >
              <h2>{selectedReadingLevel} Details</h2>
              <button className="litx-modal-close" onClick={closeReadingLevelModal}>&times;</button>
            </div>

            <div className="litx-modal-body">
              {/* Stats */}
              <div className="litx-stats-section">
                <div className="litx-stat-block">
                  <h3>Students</h3>
                  <p className="litx-big-stat">
                    {readingLevelDistribution.find(a => a.name === selectedReadingLevel)?.value || 0}
                  </p>
                </div>
                <div className="litx-stat-block">
                  <h3>Completion Rate</h3>
                  <p className="litx-big-stat">
                    {selectedReadingLevel === 'Not Assessed' ? 'N/A' : Math.round(
                      studentsInSelectedLevel
                        .reduce((sum, s) => sum + s.completionRate, 0) /
                      (studentsInSelectedLevel.length || 1)
                    ) + '%'}
                  </p>
                </div>

                <div className="litx-stat-block">
                  <h3>Avg. Score</h3>
                  <p className="litx-big-stat">
                    {selectedReadingLevel === 'Not Assessed' ? 'N/A' : 
                     Math.round(studentsInSelectedLevel
                      .reduce((sum, s) => sum + s.lastScore, 0) / 
                      (studentsInSelectedLevel.length || 1)
                    ) + '%'}
                  </p>
                </div>
                
                <div className="litx-prescriptive-summary">
                  <h4>Prescriptive Analysis</h4>
                  <p>
                    {prescriptiveData.find(d => d.antasLevel === selectedReadingLevel)?.broadAnalysis || 
                     "No analysis available for this reading level yet."}
                  </p>
                </div>
                
                {/* Students in this reading level */}
                <div className="litx-students-in-level">
                  <h4>Students in this Level</h4>
                  <div className="litx-student-list">
                    <table className="litx-students-table">
                      <thead>
                        <tr>
                          <th>Student</th>
                          <th>Section</th>
                          <th>Grade</th>
                          {selectedReadingLevel !== 'Not Assessed' && <th>Score</th>}
                          <th>Action</th>
                        </tr>
                      </thead>
                      <tbody>
                        {studentsInSelectedLevel.length > 0 ? (
                          studentsInSelectedLevel.map(student => (
                            <tr key={student.id} className="litx-student-row">
                              <td>{student.name}</td>
                              <td>{student.section}</td>
                              <td>{student.gradeLevel}</td>
                              {selectedReadingLevel !== 'Not Assessed' && <td>{student.lastScore}%</td>}
                              <td>
                                <button 
                                  className="litx-view-button"
                                  onClick={() => {
                                    closeReadingLevelModal();
                                    openStudentDetail(student);
                                  }}
                                >
                                  View
                                </button>
                              </td>
                            </tr>
                          ))
                        ) : (
                          <tr>
                            <td colSpan={selectedReadingLevel !== 'Not Assessed' ? 5 : 4} style={{ textAlign: 'center' }}>
                              No students found in this reading level.
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            </div>

            <div className="litx-modal-footer">
              <button 
                className="litx-primary-button"
                onClick={() => {
                  closeReadingLevelModal();
                  // Navigate to a dedicated reading level page if you have one
                  navigate('/teacher/manage-progress', { state: { readingLevel: selectedReadingLevel } });
                }}
              >
                See All Students
              </button>
              <button className="litx-modal-action-button" onClick={closeReadingLevelModal}>Close</button>
            </div>
          </div>
        </div>
      )}

      {/* Student Detail Modal */}
      {studentDetailOpen && selectedStudent && (
        <div className="litx-modal-overlay" onClick={closeStudentDetail}>
          <div className="litx-modal-content litx-student-modal" onClick={(e) => e.stopPropagation()}>
            <div
              className="litx-modal-header"
              style={{ backgroundColor: getReadingLevelColor(selectedStudent.readingLevel) }}
            >
              <h2>{selectedStudent.name}</h2>
              <button className="litx-modal-close" onClick={closeStudentDetail}>&times;</button>
            </div>

            <div className="litx-modal-body">
              <div className="litx-student-info-summary">
                <div className="litx-student-info-section">
                  <h3>Performance Summary</h3>
                  <div className="litx-info-grid">
                    <div className="litx-info-item">
                      <span className="litx-info-label">Reading Level:</span>
                      <span className="litx-info-value">
                        <span
                          className="litx-antas-badge"
                          style={{ backgroundColor: getReadingLevelColor(selectedStudent.readingLevel) }}
                        >
                          {selectedStudent.readingLevel}
                        </span>
                      </span>
                    </div>
                    <div className="litx-info-item">
                      <span className="litx-info-label">Grade Level:</span>
                      <span className="litx-info-value">{selectedStudent.gradeLevel}</span>
                    </div>
                    <div className="litx-info-item">
                      <span className="litx-info-label">Section:</span>
                      <span className="litx-info-value">{selectedStudent.section}</span>
                    </div>
                    {selectedStudent.readingLevel !== 'Not Assessed' && (
                      <div className="litx-info-item">
                        <span className="litx-info-label">Last Score:</span>
                        <span className="litx-info-value">{selectedStudent.lastScore}%</span>
                      </div>
                    )}
                    <div className="litx-info-item">
                      <span className="litx-info-label">Completion Rate:</span>
                      <span className="litx-info-value">{selectedStudent.completionRate}%</span>
                    </div>
                    <div className="litx-info-item">
                      <span className="litx-info-label">Last Assessment:</span>
                      <span className="litx-info-value">{selectedStudent.lastAssessment}</span>
                    </div>
                  </div>
                </div>

                <div className="litx-student-categories">
                  <h3>Categories Needing Improvement</h3>
                  {selectedStudent.readingLevel !== 'Not Assessed' ? (
                    <div className="litx-categories-list">
                      {selectedStudent.improvementCategories.map((category, index) => (
                        <div key={index} className="litx-category-item">
                          <div className="litx-category-marker" style={{ backgroundColor: getReadingLevelColor(selectedStudent.readingLevel) }}></div>
                          <div className="litx-category-name">{category}</div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="litx-no-assessment-message">
                      This student needs to complete the pre-assessment to determine areas for improvement.
                    </p>
                  )}
                </div>

                <div className="litx-student-additional-info">
                  <h3>Additional Information</h3>
                  <div className="litx-info-grid">
                    <div className="litx-info-item">
                      <span className="litx-info-label">Age:</span>
                      <span className="litx-info-value">{selectedStudent.age}</span>
                    </div>
                    <div className="litx-info-item">
                      <span className="litx-info-label">Gender:</span>
                      <span className="litx-info-value">{selectedStudent.gender || 'Not specified'}</span>
                    </div>
                    <div className="litx-info-item">
                      <span className="litx-info-label">Parent:</span>
                      <span className="litx-info-value">{selectedStudent.parentName || 'Not specified'}</span>
                    </div>
                    <div className="litx-info-item">
                      <span className="litx-info-label">Pre-Assessment:</span>
                      <span className="litx-info-value">{selectedStudent.preAssessmentCompleted ? 'Completed' : 'Not completed'}</span>
                    </div>
                    <div className="litx-info-item litx-full-width">
                      <span className="litx-info-label">Address:</span>
                      <span className="litx-info-value">{selectedStudent.address}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="litx-modal-footer">
              <button
                className="litx-primary-button"
                onClick={() => viewStudentDetails(selectedStudent)}
              >
                View Full Profile
              </button>
              <button 
                className="litx-secondary-button"
                onClick={() => {
                  closeStudentDetail();
                  navigate('/teacher/manage-activities', { 
                    state: { studentId: selectedStudent.id } 
                  });
                }}
              >
                Manage Activities
              </button>
              <button className="litx-modal-action-button" onClick={closeStudentDetail}>Close</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TeacherDashboard;