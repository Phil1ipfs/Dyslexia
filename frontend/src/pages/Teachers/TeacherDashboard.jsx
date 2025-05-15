// src/pages/Teachers/TeacherDashboard.jsx
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, ReferenceLine, Area, PieChart, Pie, Cell,
  BarChart, Bar
} from 'recharts';

// Import icons (replace with actual paths to your icons)
import studentsIcon from '../../assets/icons/Teachers/students.png';
import activitiesIcon from '../../assets/icons/Teachers/students.png';
import pendingIcon from '../../assets/icons/Teachers/students.png';
import scoringIcon from '../../assets/icons/Teachers/students.png';
import '../../css/Teachers/TeacherDashboard.css';

import {
  formatDate,
  calculateMetrics,
  determineCategoriesForImprovement,
  getReadingLevelColor,
  generateActivities,
  processStudentData,
  generateProgressData,
  generatePrescriptiveData
} from '../../utils/Teachers/dashboardUtils.js';

// Dashboard API Service
import DashboardApiService from '../../services/Teachers/DashboardApiService';

// API base URL from environment variable
const API_BASE_URL = import.meta?.env?.VITE_API_BASE_URL || 'http://localhost:5002/api';

/**
 * TeacherDashboard Component
 * 
 * A dashboard for teachers to monitor student progress, activities, and reading levels
 * Fetches data directly from MongoDB through API endpoints
 */
const TeacherDashboard = () => {
  // Navigation hook
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

  // Data state variables
  const [students, setStudents] = useState([]);
  const [sections, setSections] = useState(['Sampaguita', 'Unity', 'Dignity']);
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

  // Resolution confirmation modal
  const [confirmResolveOpen, setConfirmResolveOpen] = useState(false);
  const [activityToResolve, setActivityToResolve] = useState(null);
  const [successMessage, setSuccessMessage] = useState('');

  // Fetch dashboard data on component mount
  useEffect(() => {
    fetchDashboardData();
  }, []);

  // Show success message temporarily
  useEffect(() => {
    if (successMessage) {
      const timer = setTimeout(() => {
        setSuccessMessage('');
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [successMessage]);

  /**
   * Get authentication headers with token
   * @returns {Object} Headers with authorization token
   */
  const getAuthHeaders = () => {
    const token = localStorage.getItem('authToken');
    return {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    };
  };

  /**
   * Main function to fetch all dashboard data from MongoDB
   */
  const fetchDashboardData = async () => {
    setIsLoading(true);
    try {
      // Use the dashboard service to fetch data
      const dashboardData = await DashboardApiService.getDashboardData(getAuthHeaders());

      if (dashboardData) {
        // Set students data
        setStudents(dashboardData.students || []);

        // Set reading level distribution
        setReadingLevelDistribution(dashboardData.readingLevelDistribution || []);

        // Set students needing attention
        setStudentsNeedingAttention(dashboardData.studentsNeedingAttention || []);

        // Set dashboard metrics
        setMetrics(dashboardData.metrics || {
          totalStudents: 0,
          completionRate: 0,
          averageScore: 0,
          assignedActivities: 0,
          completedActivities: 0,
          pendingEdits: 0
        });

        // Set sections
        setSections(dashboardData.sections || ['Sampaguita', 'Unity', 'Dignity']);

        // Set pending activities
        setPendingActivities(dashboardData.pendingActivities || []);
        setNotificationCount(
          (dashboardData.pendingActivities || []).filter(act => act.status !== 'Resolved').length
        );

        // Set progress data for charts
        setProgressData(dashboardData.progressData || {});

        // Set prescriptive analytics
        setPrescriptiveData(dashboardData.prescriptiveData || []);

        // Set initial selected reading level
        if (dashboardData.readingLevelDistribution && dashboardData.readingLevelDistribution.length > 0) {
          const initialLevel = dashboardData.readingLevelDistribution[0].name;
          setSelectedReadingLevel(initialLevel);

          // Set students in selected level
          const studentsInLevel = (dashboardData.students || []).filter(
            student => student.readingLevel === initialLevel
          );
          setStudentsInSelectedLevel(studentsInLevel);
        }
      } else {
        // Fallback to direct API calls if service fails to return data
        await fetchDashboardDataDirectly();
      }
    } catch (error) {
      console.error("Error fetching dashboard data from service:", error);

      // Fallback to direct API calls
      await fetchDashboardDataDirectly();
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Fallback function to fetch dashboard data directly through API calls
   * Uses when the service approach fails
   */
  const fetchDashboardDataDirectly = async () => {
    try {
      // 1. Fetch all students
      const studentsResponse = await axios.get(`${API_BASE_URL}/student/students`, getAuthHeaders());
      const studentsData = studentsResponse.data.students || [];

      // Process students for dashboard display
      const processedStudents = processStudentData(studentsData);
      setStudents(processedStudents.allStudents);

      // 2. Get reading level distribution
      try {
        const distributionResponse = await axios.get(`${API_BASE_URL}/dashboard/reading-level-distribution`, getAuthHeaders());
        setReadingLevelDistribution(distributionResponse.data || processedStudents.readingLevelDistribution);
      } catch (error) {
        console.warn('Could not fetch reading level distribution, using calculated data', error);
        setReadingLevelDistribution(processedStudents.readingLevelDistribution);
      }

      // 3. Get students needing attention
      try {
        const attentionResponse = await axios.get(`${API_BASE_URL}/dashboard/students-needing-attention`, getAuthHeaders());
        setStudentsNeedingAttention(attentionResponse.data || processedStudents.studentsNeedingAttention);
      } catch (error) {
        console.warn('Could not fetch students needing attention, using calculated data', error);
        setStudentsNeedingAttention(processedStudents.studentsNeedingAttention);
      }

      // 4. Get dashboard metrics
      try {
        const metricsResponse = await axios.get(`${API_BASE_URL}/dashboard/metrics`, getAuthHeaders());
        setMetrics(metricsResponse.data || calculateMetrics(processedStudents.allStudents));
      } catch (error) {
        console.warn('Could not fetch dashboard metrics, using calculated data', error);
        setMetrics(calculateMetrics(processedStudents.allStudents));
      }

      // 5. Extract unique sections from student data
      const uniqueSections = [...new Set(processedStudents.allStudents
        .map(student => student.section)
        .filter(section => section)
      )];

      if (uniqueSections.length > 0) {
        setSections(uniqueSections);
      }

      // 6. Generate pending activities
      const pendingActivitiesData = await fetchPendingActivities(processedStudents.allStudents);
      setPendingActivities(pendingActivitiesData);
      setNotificationCount(pendingActivitiesData.filter(act => act.status !== 'Resolved').length);

      // 7. Generate progress data for charts
      const progressChartData = generateProgressData(readingLevelDistribution);
      setProgressData(progressChartData);

      // 8. Generate prescriptive analytics
      try {
        const prescriptiveResponse = await axios.get(`${API_BASE_URL}/dashboard/prescriptive-data`, getAuthHeaders());
        setPrescriptiveData(prescriptiveResponse.data || []);
      } catch (error) {
        console.warn('Could not fetch prescriptive data, generating locally', error);
        const prescriptiveInsights = generatePrescriptiveData(readingLevelDistribution);
        setPrescriptiveData(prescriptiveInsights);
      }

      // Set initial selected reading level
      if (readingLevelDistribution.length > 0) {
        const initialLevel = readingLevelDistribution[0].name;
        setSelectedReadingLevel(initialLevel);

        // Set students in selected level
        const studentsInLevel = processedStudents.allStudents.filter(
          student => student.readingLevel === initialLevel
        );
        setStudentsInSelectedLevel(studentsInLevel);
      }
    } catch (error) {
      console.error("Error fetching dashboard data directly:", error);

      // Fallback to empty data structures if API calls fail
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
    }
  };

  /**
   * Fetch pending activities from API or generate if API fails
   * @param {Array} studentsData - Array of student data objects
   * @returns {Array} Pending activities
   */
  const fetchPendingActivities = async (studentsData) => {
    try {
      const activitiesResponse = await axios.get(`${API_BASE_URL}/dashboard/activities`, getAuthHeaders());
      return activitiesResponse.data || generateActivities(studentsData);
    } catch (error) {
      console.warn('Could not fetch activities, generating locally', error);
      return generateActivities(studentsData);
    }
  };

  /**
   * Process raw student data for dashboard use
   * @param {Array} studentsData - Raw student data from MongoDB
   * @returns {Object} Processed data for dashboard display
   */
  const processStudentData = (studentsData) => {
    if (!studentsData || studentsData.length === 0) {
      return {
        allStudents: [],
        readingLevelDistribution: [],
        studentsNeedingAttention: []
      };
    }

    // Process the students data from MongoDB format
    const allStudents = studentsData.map(student => {
      // Extract ID from MongoDB format
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
      const improvementCategories = determineCategoriesForImprovement(readingLevel);

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

  // UI event handlers
  /**
   * Toggle dropdown for reading level selection
   */
  const toggleDropdown = () => setIsDropdownOpen(!isDropdownOpen);

  /**
   * Select a reading level for progress chart
   * @param {string} level - Reading level to select
   */
  const selectReadingLevel = (level) => {
    setSelectedReadingLevel(level);
    setIsDropdownOpen(false);

    // Update students in selected level
    setStudentsInSelectedLevel(students.filter(s => s.readingLevel === level));
  };

  /**
   * Toggle time frame for progress chart
   */
  const toggleTimeFrame = () =>
    setTimeFrame(tf => (tf === 'weekly' ? 'monthly' : 'weekly'));

  /**
   * Open reading level detail modal when pie chart segment is clicked
   * @param {Object} entry - Pie chart data entry that was clicked
   */
  const handleReadingLevelPieClick = (entry) => {
    setSelectedReadingLevel(entry.name);
    // Update students in selected level
    setStudentsInSelectedLevel(students.filter(s => s.readingLevel === entry.name));
    setReadingLevelDetailOpen(true);
  };

  /**
   * Close reading level detail modal
   */
  const closeReadingLevelModal = () => {
    setReadingLevelDetailOpen(false);
  };

  /**
   * Open student detail modal
   * @param {Object} student - Student object to view
   */
  const openStudentDetail = async (student) => {
    setSelectedStudent(student);
    setStudentDetailOpen(true);

    // if this student has a parentId, go fetch their profile
    if (student.parentId) {
      try {
        const parentInfo = await DashboardApiService.getParentProfile(
          student.parentId,
          getAuthHeaders()
        );
        // merge the real parent name & address into state
        setSelectedStudent(s => ({
          ...s,
          parentName: parentInfo.name || s.parentName,
          address: parentInfo.address || s.address
        }));
      } catch (err) {
        console.warn('Could not load parent info', err);
      }
    }
  };

  /**
   * Close student detail modal
   */
  const closeStudentDetail = () => {
    setStudentDetailOpen(false);
    setSelectedStudent(null);
  };

  /**
   * Filter students by reading level
   * @param {string} filter - Reading level filter value
   */
  const handleReadingLevelFilter = (filter) => {
    setStudentFilter(filter);
  };

  /**
   * Filter students by section
   * @param {string} section - Section filter value
   */
  const handleSectionFilter = (section) => {
    setSectionFilter(section);
  };

  /**
   * Open confirmation dialog for resolving an activity
   * @param {Object} activity - Activity to resolve
   */
  const confirmResolveActivity = (activity) => {
    setActivityToResolve(activity);
    setConfirmResolveOpen(true);
  };

  /**
   * Close confirmation dialog
   */
  const closeConfirmDialog = () => {
    setConfirmResolveOpen(false);
    setActivityToResolve(null);
  };

  /**
   * Mark activity as resolved and update state
   */
  const handleResolveActivity = async () => {
    if (!activityToResolve) return;

    try {
      // Make API call to update activity status
      await axios.put(
        `${API_BASE_URL}/dashboard/update-activity/${activityToResolve.id}`,
        { status: 'Resolved' },
        getAuthHeaders()
      );

      // Update local state
      const updatedActivities = pendingActivities.map(activity => {
        if (activity.id === activityToResolve.id) {
          return { ...activity, status: 'Resolved' };
        }
        return activity;
      });

      setPendingActivities(updatedActivities);
      setNotificationCount(prev => prev - 1);
      setSuccessMessage(`Activity for ${activityToResolve.studentName} has been resolved.`);

      // Close dialog
      closeConfirmDialog();

    } catch (error) {
      console.error('Error resolving activity:', error);

      // Update state anyway as a fallback
      const updatedActivities = pendingActivities.map(activity => {
        if (activity.id === activityToResolve.id) {
          return { ...activity, status: 'Resolved' };
        }
        return activity;
      });

      setPendingActivities(updatedActivities);
      setNotificationCount(prev => prev - 1);

      // Close dialog
      closeConfirmDialog();
    }
  };

  /**
   * Navigate to student details page
   * @param {Object} student - Student to view
   */
  const viewStudentDetails = (student) => {
    if (studentDetailOpen) {
      closeStudentDetail();
    }
    navigate(`/teacher/student-details/${student.id}`);
  };

  /**
   * Determine categories for improvement based on reading level
   * @param {string} readingLevel - The student's reading level
   * @returns {Array} Categories needing improvement
   */
  const determineCategoriesForImprovement = (readingLevel) => {
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
  };

  /**
   * Get color for a reading level
   * @param {string} level - Reading level
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
   * @param {Array} students - Students array
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
   * Generate activities for dashboard
   * @param {Array} students - Students array
   * @returns {Array} Activities array
   */
  const generateActivities = (students) => {
    const pendingStudents = students
      .filter(s => s.needsAttention)
      .slice(0, 10); // Limit to top 10 students

    // Generate different types of activities based on reading level
    return pendingStudents.map((student, index) => {
      let type, details, status;

      if (student.readingLevel === 'Not Assessed') {
        type = 'Pre-Assessment Required';
        details = `${student.name} needs to complete pre-assessment to determine reading level`;
      } else if (student.readingLevel === 'Early') {
        type = 'Reading Foundation Development';
        details = `${student.name} needs focused assistance with ${student.improvementCategories[0]}`;
      } else if (student.lastScore < 60) {
        type = 'Intervention Activity Needed';
        details = `${student.name} is struggling with ${student.improvementCategories[0]}`;
      } else {
        type = 'Progress Monitoring';
        details = `Review ${student.name}'s recent progress in ${student.improvementCategories[0]}`;
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
        studentId: student.id,
        studentSection: student.section || 'Sampaguita',
        antasLevel: student.readingLevel,
        details
      };
    });
  };

  /**
   * Generate progress data for charts
   * @param {Array} levelDistribution - Reading level distribution
   * @returns {Object} Progress data for charts
   */
  const generateProgressData = (levelDistribution) => {
    // Create progress data for each reading level
    // NOTE: This is mockup data for visualization purposes. In production, this should be fetched from the database.
    const weeklyData = (baseValue, count = 4) => Array.from({ length: count }, (_, i) => ({
      name: `${i + 1}`,
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
  };

  /**
   * Generate prescriptive data for reading levels
   * @param {Array} levelDistribution - Reading level distribution
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
   * @param {Date} date - Date to format
   * @param {string} format - Format style (short, medium, long)
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

  // Filter activities by section and reading level
  const filteredActivities = pendingActivities.filter(activity => {
    const sectionMatch = sectionFilter === 'all' || activity.studentSection === sectionFilter;
    const levelMatch = studentFilter === 'all' || activity.antasLevel === studentFilter;
    return sectionMatch && levelMatch;
  });

  if (isLoading) {
    return (
      <div className="teacher-dashboard-loading">
        <div className="teacher-loading-spinner"></div>
        <p>Loading dashboard data...</p>
      </div>
    );
  }

  return (
    <div className="teacher-dashboard">
      {/* Header with dashboard title and notification bell */}
      <main className="teacher-dashboard__content">

        <div className="teacher-dashboard__header">
        <div className="teacher-dashboard__title-wrapper">

          <h1 className="teacher-dashboard__title">Teacher Dashboard</h1>
          <p className="teacher-dashboard__subtitle">
      Monitor student reading levels, performance, and assign interventions effectively.
    </p>
    </div>


          <div className="teacher-notification-bell">
            <span className="teacher-notification-icon">🔔</span>
            {notificationCount > 0 && (
              <span className="teacher-notification-badge">{notificationCount}</span>
            )}
          </div>
          </div>
 

        {/* Stats Cards Grid - Key metrics at the top */}
        <div className="teacher-dashboard__stats">
          <div className="teacher-stat-card teacher-stat-card--students">
            <img src={studentsIcon} alt="Students" className="teacher-stat-card__icon" />
            <div className="teacher-stat-card__info">
              <h3 className="teacher-stat-card__heading">Total Students</h3>
              <p className="teacher-stat-card__value">{metrics.totalStudents}</p>
            </div>
          </div>

          <div className="teacher-stat-card teacher-stat-card--scoring">
            <img src={scoringIcon} alt="Score" className="teacher-stat-card__icon" />
            <div className="teacher-stat-card__info">
              <h3 className="teacher-stat-card__heading">Average Score</h3>
              <p className="teacher-stat-card__value">{metrics.averageScore}%</p>
            </div>
          </div>

          <div className="teacher-stat-card teacher-stat-card--activities">
            <img src={activitiesIcon} alt="Activities" className="teacher-stat-card__icon" />
            <div className="teacher-stat-card__info">
              <h3 className="teacher-stat-card__heading">Completion Rate</h3>
              <p className="teacher-stat-card__value">{metrics.completionRate}%</p>
              <p className="teacher-stat-card__subtitle">
                {metrics.completedActivities} of {metrics.assignedActivities}
              </p>
            </div>
          </div>

          <div className="teacher-stat-card teacher-stat-card--pending">
            <img src={pendingIcon} alt="Pending" className="teacher-stat-card__icon" />
            <div className="teacher-stat-card__info">
              <h3 className="teacher-stat-card__heading">Pending Actions</h3>
              <p className="teacher-stat-card__value">{metrics.pendingEdits}</p>
            </div>
          </div>
        </div>

        {/* Students Needing Attention Section */}
        <div className="teacher-card teacher-full-width-card teacher-students-card">
          <div className="teacher-card__header">
            <h2 className="teacher-card__title">Students Needing Attention</h2>
            <div className="teacher-filter-controls">
              <span className="teacher-filter-label">Reading Level:</span>
              <div className="teacher-filter-buttons">
                <button
                  className={`teacher-filter-btn ${studentFilter === 'all' ? 'teacher-filter-btn--active' : ''}`}
                  onClick={() => handleReadingLevelFilter('all')}
                >
                  All
                </button>
                {readingLevelDistribution.map((level) => (
                  <button
                    key={level.name}
                    className={`teacher-filter-btn ${studentFilter === level.name ? 'teacher-filter-btn--active' : ''}`}
                    style={studentFilter === level.name ? { backgroundColor: level.color } : {}}
                    onClick={() => handleReadingLevelFilter(level.name)}
                  >
                    {level.name}
                  </button>
                ))}
              </div>

              <span className="teacher-filter-label">Section:</span>
              <div className="teacher-filter-buttons">
                <button
                  className={`teacher-filter-btn ${sectionFilter === 'all' ? 'teacher-filter-btn--active' : ''}`}
                  onClick={() => handleSectionFilter('all')}
                >
                  All
                </button>
                {sections.map((section) => (
                  <button
                    key={section}
                    className={`teacher-filter-btn ${sectionFilter === section ? 'teacher-filter-btn--active' : ''}`}
                    onClick={() => handleSectionFilter(section)}
                  >
                    {section}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Student Scores Bar Chart */}
          <div className="teacher-score-chart-container">
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
  content={({ active, payload, label }) => {
    if (active && payload && payload.length) {
      const score = payload[0].value;
      const student = payload[0].payload;
      return (
        <div style={{
          background: '#2B3A67',
          border: '1px solid #F3C922',
          borderRadius: '10px',
          padding: '12px 16px',
          color: 'white',
          fontFamily: 'Poppins, sans-serif',
          boxShadow: '0 4px 12px rgba(0, 0, 0, 0.3)',
          minWidth: '160px',
        }}>
          <div style={{ fontSize: '1rem', fontWeight: '600', marginBottom: '0.5rem' }}>{student.name}</div>
          <div style={{ fontSize: '0.9rem' }}> Score Percentage:     {score}%</div>
        </div>
      );
    }
    return null;
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
          <div className="teacher-students-table-container">
            <table className="teacher-students-table">
              <thead>
                <tr>
                  <th>Student</th>
                  <th>Reading Level</th>
                  <th>Section</th>
                  <th>Categories Needing Improvement</th>
                  <th>Score</th>
                  <th style={{ textAlign: 'left' }}>Action</th>
                  </tr>
              </thead>
              <tbody>
                {sectionFilteredStudents.length > 0 ? (
                  sectionFilteredStudents.map((student) => (
                    <tr key={student.id} className="teacher-student-row">
                      <td>{student.name}</td>
                      <td>
                        <span
                          className={`teacher-reading-level-badge teacher-reading-level-badge--${student.readingLevel.toLowerCase().replace(/\s+/g, '-')}`}
                          style={{ backgroundColor: getReadingLevelColor(student.readingLevel) }}
                        >
                          {student.readingLevel}
                        </span>
                      </td>
                      <td>{student.section}</td>
                      <td className="teacher-difficulty-cell">
                        <span className="teacher-difficulty-text">
                          {student.readingLevel === 'Not Assessed'
                            ? 'Needs assessment to determine areas for improvement'
                            : student.improvementCategories.join(', ')}
                        </span>
                      </td>
                      <td>{student.readingLevel === 'Not Assessed' ? 'N/A' : `${student.lastScore}%`}</td>
                      <td>
                        <button
                          className="teacher-view-button"
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
        <div className="teacher-dashboard__main-grid">
          {/* Top-left cell: Reading Level Distribution Chart */}
          <div className="teacher-dashboard__grid-cell">
            <div className="teacher-card teacher-distribution-card">
              <h2 className="teacher-card__title">Students by Reading Level</h2>
              <div className="teacher-reading-level-distribution">
                <div className="teacher-pie-chart">
                <ResponsiveContainer width="100%" height={400}>
                <PieChart>
                      <Pie
                        data={readingLevelDistribution}
                        cx="50%"
                        cy="50%"
                        outerRadius={100}
                        innerRadius={60}
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

                <div className="teacher-reading-level-legend">
                  {readingLevelDistribution.map((entry, index) => (
                    <div
                      key={index}
                      className="teacher-legend-item"
                      onClick={() => handleReadingLevelPieClick(entry)}
                    >
                      <div
                        className="teacher-legend-color"
                        style={{ backgroundColor: entry.color }}
                      ></div>
                      <div className="teacher-legend-text">
                        <span>{entry.name}</span>
                        <span className="teacher-legend-value">{entry.value} students</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Top-right cell: Progress Chart */}
          <div className="teacher-dashboard__grid-cell">
            <div className="teacher-card teacher-chart-card">
              <div className="teacher-chart__header">
                <h2 className="teacher-card__title">
                  {timeFrame === 'weekly' ? 'Weekly' : 'Monthly'} Reading Progress
                </h2>
                <div className="teacher-chart__controls">
                  <button
                    className="teacher-timeframe-btn"
                    onClick={toggleTimeFrame}
                  >
                    {timeFrame === 'weekly' ? 'Show Monthly' : 'Show Weekly'}
                  </button>
                  <div className="teacher-dropdown">
                    <button
                      className="teacher-dropdown__trigger"
                      onClick={toggleDropdown}
                    >
                      {selectedReadingLevel}
                      <span className={`teacher-dropdown__arrow ${isDropdownOpen ? 'teacher-dropdown__arrow--open' : ''}`}>▼</span>
                    </button>
                    {isDropdownOpen && (
                      <div className="teacher-dropdown__menu">
                        {readingLevelDistribution
                          .filter(level => level.name !== 'Not Assessed') // Exclude Not Assessed from progress chart
                          .map((level, index) => (
                            <div
                              key={index}
                              className={`teacher-dropdown__item ${selectedReadingLevel === level.name ? 'teacher-dropdown__item--active' : ''}`}
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

              <div className="teacher-chart__container">
                {/* Note: This is mockup data for visualization. In production, this should be fetched from DB */}
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
                        <linearGradient id="teacherAreaFill" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor={getReadingLevelColor(selectedReadingLevel)} stopOpacity={0.8} />
                          <stop offset="95%" stopColor={getReadingLevelColor(selectedReadingLevel)} stopOpacity={0.1} />
                        </linearGradient>
                      </defs>
                      <Area
                        type="monotone"
                        dataKey="progress"
                        fill="url(#teacherAreaFill)"
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
                  <div className="teacher-no-data-message">
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
        <div className="teacher-dashboard__full-width">
          <div className="teacher-card teacher-activity-modifications-card">
            <div className="teacher-card__header">
              <h2 className="teacher-card__title">Activity Modifications</h2>
              <div className="teacher-filter-controls">
                <div className="teacher-filter-group">
                  <span className="teacher-filter-label">Reading Level:</span>
                  <div className="teacher-filter-buttons">
                    <button
                      className={`teacher-filter-btn ${studentFilter === 'all' ? 'teacher-filter-btn--active' : ''}`}
                      onClick={() => handleReadingLevelFilter('all')}
                    >
                      All
                    </button>
                    {readingLevelDistribution.map((level) => (
                      <button
                        key={level.name}
                        className={`teacher-filter-btn ${studentFilter === level.name ? 'teacher-filter-btn--active' : ''}`}
                        style={studentFilter === level.name ? { backgroundColor: level.color } : {}}
                        onClick={() => handleReadingLevelFilter(level.name)}
                      >
                        {level.name}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="teacher-filter-group">
                  <span className="teacher-filter-label">Section:</span>
                  <div className="teacher-filter-buttons">
                    <button
                      className={`teacher-filter-btn ${sectionFilter === 'all' ? 'teacher-filter-btn--active' : ''}`}
                      onClick={() => handleSectionFilter('all')}
                    >
                      All
                    </button>
                    {sections.map((section) => (
                      <button
                        key={section}
                        className={`teacher-filter-btn ${sectionFilter === section ? 'teacher-filter-btn--active' : ''}`}
                        onClick={() => handleSectionFilter(section)}
                      >
                        {section}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            <div className="teacher-activity-list">
              {filteredActivities.length > 0 ? (
                filteredActivities.map((activity) => (
                  <div
                    key={activity.id}
                    className={`teacher-activity-item teacher-activity-item--${activity.status.toLowerCase()}`}
                  >
                   <div className="teacher-activity-header teacher-activity-header--space">
  <div className="teacher-activity-type">
    {activity.type}
  </div>
  <span className="teacher-activity-date">{activity.date}</span>
</div>
                    <div className="teacher-activity-content">
                      <div className="teacher-student-badge">
                        <span className="teacher-student-name">{activity.studentName}</span>
                        <span className="teacher-student-section">{activity.studentSection}</span>
                      </div>
                      {activity.antasLevel && (
                        <span
                          className={`teacher-reading-level-badge teacher-reading-level-badge--${activity.antasLevel.toLowerCase().replace(/\s+/g, '-')}`}
                          style={{ backgroundColor: getReadingLevelColor(activity.antasLevel) }}
                        >
                          {activity.antasLevel}
                        </span>
                      )}
                      <p className="teacher-activity-description">{activity.details}</p>
                      <div className="teacher-activity-actions">
                        <button
                          className="teacher-activity-btn teacher-activity-btn--review"
                          onClick={() => navigate(`/teacher/student-details/${activity.studentId}`)}
                        >
                          Review
                        </button>
                        {activity.status !== 'Resolved' && (
                          <button
                            className="teacher-activity-btn teacher-activity-btn--resolve"
                            onClick={() => confirmResolveActivity(activity)}
                          >
                            Mark as Resolved
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="teacher-no-activities">
                  <p>No pending activity modifications matching the current filters.</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </main>

      {/* Modal for Reading Level Details */}
      {readingLevelDetailOpen && (
        <div className="teacher-modal-overlay" onClick={closeReadingLevelModal}>
          <div className="teacher-modal-content" onClick={(e) => e.stopPropagation()}>
            <div
              className="teacher-modal-header"
              style={{ backgroundColor: getReadingLevelColor(selectedReadingLevel) }}
            >
              <h2>{selectedReadingLevel} Details</h2>
              <button className="teacher-modal-close" onClick={closeReadingLevelModal}>&times;</button>
            </div>

            <div className="teacher-modal-body">
              {/* Stats */}
              <div className="teacher-stats-section">
                <div className="teacher-student-info-summary">
                  <div className="teacher-student-info-section">
                    <h3>Performance Summary</h3>
                    <div className="teacher-info-grid">
                      <div className="teacher-info-item">
                        <span className="teacher-info-label">Students:</span>
                        <span className="teacher-info-value">
                          {readingLevelDistribution.find(a => a.name === selectedReadingLevel)?.value || 0}
                        </span>
                      </div>

                      <div className="teacher-info-item">
                        <span className="teacher-info-label">Completion Rate:</span>
                        <span className="teacher-info-value">
                          {selectedReadingLevel === 'Not Assessed' ? 'N/A' : Math.round(
                            studentsInSelectedLevel
                              .reduce((sum, s) => sum + s.completionRate, 0) /
                            (studentsInSelectedLevel.length || 1)
                          ) + '%'}
                        </span>
                      </div>

                      <div className="teacher-info-item">
                        <span className="teacher-info-label">Avg. Score:</span>
                        <span className="teacher-info-value">
                          {selectedReadingLevel === 'Not Assessed' ? 'N/A' :
                            Math.round(studentsInSelectedLevel
                              .reduce((sum, s) => sum + s.lastScore, 0) /
                              (studentsInSelectedLevel.length || 1)
                            ) + '%'}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="teacher-student-categories">
                    <h3>Prescriptive Analysis</h3>
                    <p>
                      {prescriptiveData.find(d => d.antasLevel === selectedReadingLevel)?.broadAnalysis ||
                        "No analysis available for this reading level yet."}
                    </p>
                  </div>
                </div>

                {/* Students in this reading level */}
                <div className="teacher-students-in-level">
                  <h4>Students in this Level</h4>
                  <div className="teacher-student-list">
                    <table className="teacher-students-table">
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
                            <tr key={student.id} className="teacher-student-row">
                              <td>{student.name}</td>
                              <td>{student.section}</td>
                              <td>{student.gradeLevel}</td>
                              {selectedReadingLevel !== 'Not Assessed' && <td>{student.lastScore}%</td>}
                              <td>
                                <button
                                  className="teacher-view-button"
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

            <div className="teacher-modal-footer">
              <button
                className="teacher-primary-button"
                onClick={() => {
                  closeReadingLevelModal();
                  // Navigate to a dedicated reading level page if you have one
                  navigate('/teacher/manage-progress', { state: { readingLevel: selectedReadingLevel } });
                }}
              >
                See All Students
              </button>
              <button className="teacher-secondary-button" onClick={closeReadingLevelModal}>Close</button>
            </div>
          </div>
        </div>
      )}

      {/* Student Detail Modal */}
      {studentDetailOpen && selectedStudent && (
        <div className="teacher-modal-overlay" onClick={closeStudentDetail}>
          <div className="teacher-modal-content teacher-student-modal" onClick={(e) => e.stopPropagation()}>
            <div
              className="teacher-modal-header"
              style={{ backgroundColor: getReadingLevelColor(selectedStudent.readingLevel) }}
            >
              <h2>{selectedStudent.name}</h2>
              <button className="teacher-modal-close" onClick={closeStudentDetail}>&times;</button>
            </div>

            <div className="teacher-modal-body">
              <div className="teacher-student-info-summary">
                <div className="teacher-student-info-section">
                  <h3>Performance Summary</h3>


                  <div className="teacher-info-grid">
                    <div className="teacher-info-item">
                      <span className="teacher-info-label">Reading Level:</span>
                      <span className="teacher-info-value">
                        <span
                          className={`teacher-reading-level-badge teacher-reading-level-badge--${selectedStudent.readingLevel.toLowerCase().replace(/\s+/g, '-')}`}
                          style={{ backgroundColor: getReadingLevelColor(selectedStudent.readingLevel) }}
                        >
                          {selectedStudent.readingLevel}
                        </span>
                      </span>
                    </div>
                    <div className="teacher-info-item">
                      <span className="teacher-info-label">Grade Level:</span>
                      <span className="teacher-info-value">{selectedStudent.gradeLevel}</span>
                    </div>
                    <div className="teacher-info-item">
                      <span className="teacher-info-label">Section:</span>
                      <span className="teacher-info-value">{selectedStudent.section}</span>
                    </div>
                    {selectedStudent.readingLevel !== 'Not Assessed' && (
                      <div className="teacher-info-item">
                        <span className="teacher-info-label">Last Score:</span>
                        <span className="teacher-info-value">{selectedStudent.lastScore}%</span>
                      </div>
                    )}
                    <div className="teacher-info-item">
                      <span className="teacher-info-label">Completion Rate:</span>
                      <span className="teacher-info-value">{selectedStudent.completionRate}%</span>
                    </div>
                    <div className="teacher-info-item">
                      <span className="teacher-info-label">Last Assessment:</span>
                      <span className="teacher-info-value">{selectedStudent.lastAssessment}</span>
                    </div>
                  </div>
                </div>

                <div className="teacher-student-categories">
                  <h3>Categories Needing Improvement</h3>
                  {selectedStudent.readingLevel !== 'Not Assessed' ? (
                    <div className="teacher-categories-list">
                      {selectedStudent.improvementCategories.map((category, index) => (
                        <div key={index} className="teacher-category-item">
                          <div className="teacher-category-marker" style={{ backgroundColor: getReadingLevelColor(selectedStudent.readingLevel) }}></div>
                          <div className="teacher-category-name">{category}</div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="teacher-no-assessment-message">
                      This student needs to complete the pre-assessment to determine areas for improvement.
                    </p>
                  )}
                </div>



                <div className="teacher-student-additional-info">
                  <h3>Additional Information</h3>
                  <div className="teacher-info-grid">
                    <div className="teacher-info-item">
                      <span className="teacher-info-label">Age:</span>
                      <span className="teacher-info-value">{selectedStudent.age}</span>
                    </div>
                    <div className="teacher-info-item">
                      <span className="teacher-info-label">Gender:</span>
                      <span className="teacher-info-value">{selectedStudent.gender}</span>
                    </div>
                    <div className="teacher-info-item">
                      <span className="teacher-info-label">Parent:</span>
                      <span className="teacher-info-value">    {selectedStudent.parentName || 'Not specified'}
                      </span>
                    </div>
                    <div className="teacher-info-item">
                      <span className="teacher-info-label">Pre-Assessment:</span>
                      <span className="teacher-info-value">{selectedStudent.preAssessmentCompleted ? 'Completed' : 'Not completed'}</span>
                    </div>
                    <div className="teacher-info-item teacher-full-width">
                      <span className="teacher-info-label">Address:</span>
                      <span className="teacher-info-value">{selectedStudent.address}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="teacher-modal-footer">
              <button
                className="teacher-primary-button"
                onClick={() => viewStudentDetails(selectedStudent)}
              >
                View Full Profile
              </button>
              <button
                className="teacher-secondary-button"
                onClick={() => {
                  closeStudentDetail();
                  navigate('/teacher/manage-activities', {
                    state: { studentId: selectedStudent.id }
                  });
                }}
              >
                Manage Activities
              </button>
              <button className="teacher-secondary-button" onClick={closeStudentDetail}>Close</button>
            </div>
          </div>
        </div>
      )}

      {/* Confirmation Dialog for resolving activity */}
      {confirmResolveOpen && activityToResolve && (
        <div className="teacher-modal-overlay">
          <div className="teacher-modal-content teacher-confirm-modal" onClick={(e) => e.stopPropagation()}>
            <div className="teacher-modal-header">
              <h2>Confirm Action</h2>
              <button className="teacher-modal-close" onClick={closeConfirmDialog}>&times;</button>
            </div>

            <div className="teacher-modal-body">
              <div className="teacher-confirm-message">
                Are you sure you want to mark this activity as resolved?
                <br /><br />
                <strong>Student:</strong> {activityToResolve.studentName}<br />
                <strong>Activity:</strong> {activityToResolve.type}
              </div>
            </div>

            <div className="teacher-modal-footer">
              <button className="teacher-primary-button" onClick={handleResolveActivity}>
                Yes, Mark as Resolved
              </button>
              <button className="teacher-secondary-button" onClick={closeConfirmDialog}>
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Success Message Toast */}
      {successMessage && (
        <div className="teacher-success-message">
          {successMessage}
        </div>
      )}
    </div>
  );
};

export default TeacherDashboard;
