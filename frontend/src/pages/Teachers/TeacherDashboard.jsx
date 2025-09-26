// src/pages/Teachers/TeacherDashboard.jsx
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, ReferenceLine, Area, PieChart, Pie, Cell,
  BarChart, Bar, Legend
} from 'recharts';

// Import icons (replace with actual paths to your icons)
import studentsIcon from '../../assets/icons/Teachers/students.png';
import activitiesIcon from '../../assets/icons/Teachers/students.png';
import pendingIcon from '../../assets/icons/Teachers/students.png';
import scoringIcon from '../../assets/icons/Teachers/students.png';
import '../../css/Teachers/TeacherDashboard.css';

// Dashboard API Service
import DashboardApiService from '../../services/Teachers/DashboardApiService';

/**
 * TeacherDashboard Component
 * 
 * A dashboard for teachers to monitor student progress and reading levels
 * Fetches data from MongoDB through API endpoints
 */
const TeacherDashboard = () => {
  // Navigation hook
  const navigate = useNavigate();

  // State variables
  const [selectedReadingLevel, setSelectedReadingLevel] = useState('All Levels');
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [studentDetailOpen, setStudentDetailOpen] = useState(false);
  const [readingLevelDetailOpen, setReadingLevelDetailOpen] = useState(false);
  const [notificationCount, setNotificationCount] = useState(0);
  const [studentFilter, setStudentFilter] = useState('all');
  const [sectionFilter, setSectionFilter] = useState('all');

  const [interventionFilter, setInterventionFilter] = useState('all');
  const [selectedIntervention, setSelectedIntervention] = useState(null);
  const [interventionDetailOpen, setInterventionDetailOpen] = useState(false);

  // Data state variables
  const [students, setStudents] = useState([]);
  const [sections, setSections] = useState(['Sampaguita', 'Unity', 'Dignity']);
  const [readingLevelDistribution, setReadingLevelDistribution] = useState([]);
  const [studentsNeedingAttention, setStudentsNeedingAttention] = useState([]);
  const [studentsInSelectedLevel, setStudentsInSelectedLevel] = useState([]);
  const [interventionProgress, setInterventionProgress] = useState([]);
  const [metrics, setMetrics] = useState({
    totalStudents: 0,
    completionRate: 0,
    averageScore: 0,
    pendingEdits: 0
  });
  const [prescriptiveData, setPrescriptiveData] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [successMessage, setSuccessMessage] = useState('');

  // Error state for database connection issues
  const [error, setError] = useState(null);

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

  const openInterventionDetail = (intervention) => {
    setSelectedIntervention(intervention);
    setInterventionDetailOpen(true);
  };

  // Add this function to handle closing the dialog
  const closeInterventionDetail = () => {
    setInterventionDetailOpen(false);
    setSelectedIntervention(null);
  };

  // Add this computed value for filtered intervention progress
  const filteredInterventionProgress = interventionFilter === 'all'
    ? interventionProgress
    : interventionProgress.filter(progress =>
      progress.readingLevel === interventionFilter ||
      progress.studentReadingLevel === interventionFilter
    );



  /**
   * Get category performance data based on reading level specifications from CLAUDE.md
   * Uses real category results data from test files
   */
  const getCategoryPerformanceData = () => {
    // Reading level category assignments from CLAUDE.md (STRICT)
    const readingLevelCategories = {
      "Low Emerging": ["Alphabet Knowledge"],
      "High Emerging": ["Alphabet Knowledge", "Phonological Awareness"],
      "Developing": ["Alphabet Knowledge", "Phonological Awareness", "Decoding"],
      "Transitioning": ["Alphabet Knowledge", "Phonological Awareness", "Decoding", "Word Recognition"],
      "At Grade Level": ["Alphabet Knowledge", "Phonological Awareness", "Decoding", "Word Recognition", "Reading Comprehension"]
    };

    // If no students data available, return empty array
    if (!students || students.length === 0) {
      return [];
    }

    // Get category results data
    const categoryResultsData = window.testCategoryResults || [];

    // Group students by reading level
    const studentsByLevel = students.reduce((acc, student) => {
      const level = student.readingLevel;
      if (!acc[level]) {
        acc[level] = [];
      }
      acc[level].push(student);
      return acc;
    }, {});

    // Process category performance for each reading level
    const performanceData = Object.keys(readingLevelCategories).map(readingLevel => {
      const studentsInLevel = studentsByLevel[readingLevel] || [];
      const categoriesForLevel = readingLevelCategories[readingLevel];

      if (studentsInLevel.length === 0) {
        return null; // Skip levels with no students
      }

      // Calculate performance for each category applicable to this reading level
      const categoryData = {};

      categoriesForLevel.forEach(categoryName => {
        let totalStudentsWithData = 0;
        let passedStudents = 0;

        // Process each student's category results
        studentsInLevel.forEach(student => {
          // Find category results for this student
          const studentCategoryResult = categoryResultsData.find(cr =>
            cr.studentId === student.idNumber || cr.studentId === student.id
          );

          if (studentCategoryResult && studentCategoryResult.categories) {
            // Find the specific category result
            const categoryResult = studentCategoryResult.categories.find(cat =>
              cat.categoryName === categoryName
            );

            if (categoryResult && categoryResult.isCompleted === true) {
              totalStudentsWithData++;
              if (categoryResult.isPassed === true && categoryResult.score >= 75) {
                passedStudents++;
              }
            }
          }
        });

        // Calculate pass percentage for this category
        const passPercentage = totalStudentsWithData > 0 ?
          Math.round((passedStudents / totalStudentsWithData) * 100) : 0;

        categoryData[categoryName] = passPercentage;
      });

      return {
        readingLevel,
        studentCount: studentsInLevel.length,
        ...categoryData
      };
    }).filter(data => data !== null); // Remove null entries for levels with no students

    return performanceData;
  };

  /**
   * Calculate which students need attention based on failed categories
   * A student needs attention if they have failed any category (score < 75%)
   * This function processes real test data from separate files
   */
  const calculateStudentsNeedingAttention = (studentsData) => {
    // Load and parse category results from test data
    let categoryResultsData = [];
    try {
      if (window.testCategoryResults) {
        categoryResultsData = window.testCategoryResults;
        console.log('Processing category results data:', categoryResultsData.length, 'records');
      }
    } catch (error) {
      console.warn('Could not load category results test data:', error);
    }

    const studentsNeedingAttention = [];

    studentsData.forEach(student => {
      // Find category results for this student using idNumber
      const studentCategoryResult = categoryResultsData.find(cr =>
        cr.studentId === student.idNumber
      );

      console.log(`Processing student ${student.idNumber}:`, {
        firstName: student.firstName,
        lastName: student.lastName,
        readingLevel: student.readingLevel,
        foundCategoryResult: !!studentCategoryResult
      });

      if (!studentCategoryResult || !studentCategoryResult.categories) {
        // No category results found - assume needs assessment
        const studentName = `${student.firstName || 'Student'} ${student.middleName ? student.middleName + ' ' : ''}${student.lastName || 'Name'}`;
        studentsNeedingAttention.push({
          ...student,
          id: student.idNumber,
          name: studentName,
          failedCategories: ['Assessment needed'],
          categoriesNeedingImprovement: [{
            category: 'Assessment',
            score: 0,
            status: 'Not Assessed',
            interventionRequired: false,
            interventionCompleted: false
          }],
          reason: 'Needs initial assessment'
        });
        return;
      }

      const failedCategories = [];
      const categoriesNeedingImprovement = [];

      // Check each category result for failures (score < 75%)
      studentCategoryResult.categories.forEach(categoryResult => {
        const hasFailed = categoryResult.isPassed === false || categoryResult.score < 75;
        const needsIntervention = categoryResult.interventionRequired === true;
        const interventionCompleted = categoryResult.interventionCompleted === true;

        if (hasFailed && !interventionCompleted) {
          failedCategories.push(categoryResult.categoryName);

          // Determine intervention status
          let status = 'Assessment Failed';
          if (needsIntervention && !interventionCompleted) {
            status = 'Intervention Required';
          } else if (interventionCompleted) {
            status = 'Intervention Completed';
          }

          categoriesNeedingImprovement.push({
            category: categoryResult.categoryName,
            score: Math.round(categoryResult.score || 0),
            status: status,
            interventionRequired: needsIntervention,
            interventionCompleted: interventionCompleted
          });
        }
      });

      // If student has any failed categories, they need attention
      if (failedCategories.length > 0) {
        const studentName = `${student.firstName || 'Student'} ${student.middleName ? student.middleName + ' ' : ''}${student.lastName || 'Name'}`;
        studentsNeedingAttention.push({
          ...student,
          id: student.idNumber,
          name: studentName,
          failedCategories,
          categoriesNeedingImprovement,
          // Calculate attention reason
          reason: failedCategories.length === 1 ?
            `Failed ${failedCategories[0]}` :
            `Failed ${failedCategories.length} categories`
        });

        console.log(`Added student to attention list:`, {
          name: studentName,
          failedCategories,
          categoriesCount: categoriesNeedingImprovement.length
        });
      }
    });

    console.log(`Total students needing attention: ${studentsNeedingAttention.length}`);
    return studentsNeedingAttention;
  };

  /**
   * Main function to fetch all dashboard data
   */
  const fetchDashboardData = async () => {
    setIsLoading(true);
    setError(null);

    try {
      console.log('Fetching dashboard data from test files...');

      // Load test users data
      let usersData = [];
      try {
        const usersResponse = await fetch('/test.users.json');
        if (usersResponse.ok) {
          usersData = await usersResponse.json();
          console.log('Loaded test users data:', usersData.length, 'records');
        }
      } catch (error) {
        console.warn('Could not load test users data:', error);
        usersData = [];
      }

      // Load test category results data for processing
      let categoryResultsData = [];
      try {
        const categoryResultsResponse = await fetch('/test.category_results.json');
        if (categoryResultsResponse.ok) {
          categoryResultsData = await categoryResultsResponse.json();
          window.testCategoryResults = categoryResultsData;
          console.log('Loaded test category results data:', categoryResultsData.length, 'records');
        }
      } catch (error) {
        console.warn('Could not load test category results:', error);
        window.testCategoryResults = [];
        categoryResultsData = [];
      }

      console.log('Successfully loaded test data files');

      // Set students data - ensure it's properly formatted for category-based attention
      const students = usersData || [];
      console.log('Raw students data from test files:', students.slice(0, 2)); // Debug first 2 students
      setStudents(students);

      // Calculate reading level distribution from test users data
      const levelCounts = {};
      usersData.forEach(student => {
        const level = student.readingLevel || 'Not Assessed';
        levelCounts[level] = (levelCounts[level] || 0) + 1;
      });

      const testReadingLevelDistribution = Object.entries(levelCounts).map(([level, count]) => ({
        name: level,
        value: count,
        level: level,
        count: count,
        percentage: Math.round((count / usersData.length) * 100),
        color: getReadingLevelColor(level)
      }));

      setReadingLevelDistribution(testReadingLevelDistribution);

      // Process students with category results for proper attention calculation
      console.log('Category results data loaded:', categoryResultsData.length);

      // Merge students with their category results and overall scores
      const studentsWithCategoryData = students.map(student => {
        const categoryResult = categoryResultsData.find(cr =>
          cr.studentId === student.idNumber || cr.studentId === student.id
        );

        return {
          ...student,
          // Use overallScore from category results if available, fallback to readingPercentage
          lastScore: categoryResult ? categoryResult.overallScore : (student.readingPercentage || 0),
          categoryResult: categoryResult // Attach category result for processing
        };
      });

      console.log('Students with category data:', studentsWithCategoryData.slice(0, 2));

      // Set students needing attention - calculate based on category failures
      const studentsNeedingAttention = calculateStudentsNeedingAttention(studentsWithCategoryData);
      setStudentsNeedingAttention(studentsNeedingAttention);

      console.log(`Found ${studentsNeedingAttention.length} students needing attention based on category failures`);
      console.log('Students needing attention:', studentsNeedingAttention.map(s => ({
        name: s.name,
        readingLevel: s.readingLevel,
        failedCategories: s.failedCategories,
        categoriesNeedingImprovement: s.categoriesNeedingImprovement
      })));

      // Set dashboard metrics using test data
      const testMetrics = {
        totalStudents: students.length,
        studentsNeedingAttention: studentsNeedingAttention.length,
        completionRate: Math.round(((students.length - studentsNeedingAttention.length) / students.length) * 100) || 0,
        averageScore: 0, // Could be calculated from category results if needed
        pendingEdits: studentsNeedingAttention.length
      };
      setMetrics(testMetrics);

      // Set sections from test users data
      const sectionCounts = {};
      usersData.forEach(student => {
        const section = student.section || 'Unassigned';
        sectionCounts[section] = (sectionCounts[section] || 0) + 1;
      });

      const availableSections = Object.keys(sectionCounts);
      setSections(availableSections);

      // Set intervention progress data (empty for test data)
      setInterventionProgress([]);

      // Set notification count based on students needing attention
      setNotificationCount(studentsNeedingAttention.length);


      // Set prescriptive analytics (using default data since we're loading from test files)
      setPrescriptiveData([]);

      // Set initial selected reading level
      if (testReadingLevelDistribution && testReadingLevelDistribution.length > 0) {
        const initialLevel = testReadingLevelDistribution[0].name;
        setSelectedReadingLevel(initialLevel);

        // Set students in selected level
        const studentsInLevel = students.filter(
          student => student.readingLevel === initialLevel
        );
        setStudentsInSelectedLevel(studentsInLevel);
      }

      console.log('Dashboard data successfully loaded and processed');

    } catch (error) {
      console.error("Error fetching dashboard data:", error);

      // Set comprehensive error state
      setError({
        message: error.message || 'Failed to fetch dashboard data',
        type: 'DATABASE_ERROR',
        details: error.message.includes('Network Error') ? 'Unable to connect to database server' :
                error.message.includes('API Error') ? 'Database returned an error' :
                'An unexpected error occurred while loading dashboard data'
      });

      // Set empty states to prevent crashes
      setStudents([]);
      setStudentsNeedingAttention([]);
      setReadingLevelDistribution([]);
      setMetrics({
        totalStudents: 0,
        completionRate: 0,
        averageScore: 0,
        pendingEdits: 0
      });
      setSections([]);
      setInterventionProgress([]);
      setNotificationCount(0);
      setPrescriptiveData([]);

    } finally {
      setIsLoading(false);
    }
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
   * Navigate to student progress page
   * @param {Object} student - Student to view
   */
  const viewStudentDetails = (student) => {
    if (studentDetailOpen) {
      closeStudentDetail();
    }
    navigate(`/teacher/student-progress/${student.id}`);
  };

  /**
   * Get color for a reading level
   * @param {string} level - Reading level
   * @returns {string} HEX color code
   */
  const getReadingLevelColor = (level) => {
    const colors = {
      'Low Emerging': '#FF6B8A',
      'High Emerging': '#FF9E40',
      'Transitioning': '#e6c229',
      'Developing': '#4BC0C0',
      'At Grade Level': '#3D9970',
      'Not Assessed': '#B0B0B0'
    };
    return colors[level] || '#B0B0B0';
  };


  // Filter students based on selected filters
  const filteredStudents = studentFilter === 'all'
    ? studentsNeedingAttention
    : studentsNeedingAttention.filter(student => student.readingLevel === studentFilter);

  // Further filter by section if needed
  const sectionFilteredStudents = sectionFilter === 'all'
    ? filteredStudents
    : filteredStudents.filter(student => student.section === sectionFilter);

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
      {/* Database Error Display */}
      {error && (
        <div style={{
          backgroundColor: '#ff4444',
          color: 'white',
          padding: '1rem 1.5rem',
          margin: '0 0 2rem 0',
          borderRadius: '8px',
          border: '1px solid #cc0000',
          boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)'
        }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between'
          }}>
            <div>
              <h4 style={{ margin: '0 0 0.5rem 0', fontSize: '1.1rem', fontWeight: '600' }}>
                🚫 Database Connection Error
              </h4>
              <p style={{ margin: '0 0 0.5rem 0', fontSize: '0.95rem' }}>
                {error.details}
              </p>
              <p style={{ margin: '0', fontSize: '0.85rem', opacity: 0.9 }}>
                Please check your database connection or contact system administrator.
              </p>
            </div>
            <button
              style={{
                backgroundColor: 'rgba(255, 255, 255, 0.2)',
                border: '1px solid rgba(255, 255, 255, 0.3)',
                color: 'white',
                padding: '0.5rem 1rem',
                borderRadius: '4px',
                cursor: 'pointer',
                fontSize: '0.85rem',
                fontWeight: '500',
                transition: 'all 0.2s'
              }}
              onMouseOver={(e) => e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.3)'}
              onMouseOut={(e) => e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.2)'}
              onClick={() => {
                console.log('Retrying database connection...');
                fetchDashboardData();
              }}
            >
              Retry Connection
            </button>
          </div>
        </div>
      )}

      {/* Header with dashboard title and notification bell */}
      <main className="teacher-dashboard__content">
        <div className="teacher-dashboard__header">
          <div className="teacher-dashboard__title-wrapper">
            <h1 className="teacher-dashboard__title">Teacher Dashboard</h1>
            <p className="teacher-dashboard__subtitle">
              Monitor student reading levels, performance, and assign interventions effectively.
            </p>
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
              <h3 className="teacher-stat-card__heading">Students At Risk</h3>
              <p className="teacher-stat-card__value">
                {studentsNeedingAttention.filter(student => student.readingLevel !== 'Not Assessed').length} students
              </p>
            </div>
          </div>

          <div className="teacher-stat-card teacher-stat-card--pending">
            <img src={pendingIcon} alt="Pending" className="teacher-stat-card__icon" />
            <div className="teacher-stat-card__info">
              <h3 className="teacher-stat-card__heading">Active Interventions</h3>
              <p className="teacher-stat-card__value">
                {interventionProgress.length} {interventionProgress.length === 1 ? 'intervention' : 'interventions'}
              </p>
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
                  name: student.name ? student.name.split(' ')[0] : 'Student', // First name only for chart
                  failedCategories: student.failedCategories ? student.failedCategories.length : 0,
                  totalCategories: student.categoriesNeedingImprovement ? student.categoriesNeedingImprovement.length : 0
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
                  domain={[0, 10]}
                  tick={{ fill: 'white', fontSize: 10 }}
                  axisLine={{ stroke: 'rgba(255,255,255,0.3)' }}
                  tickFormatter={(value) => `${value}`}
                />
                <Tooltip
                  content={({ active, payload, label }) => {
                    if (active && payload && payload.length) {
                      const failedCount = payload[0].value;
                      const student = sectionFilteredStudents.find(s => s.name && s.name.split(' ')[0] === label);
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
                          <div style={{ fontSize: '1rem', fontWeight: '600', marginBottom: '0.5rem' }}>{student?.name || label}</div>
                          <div style={{ fontSize: '0.9rem' }}>Failed Categories: {failedCount}</div>
                          {student?.reason && (
                            <div style={{ fontSize: '0.85rem', marginTop: '0.5rem' }}>{student.reason}</div>
                          )}
                        </div>
                      );
                    }
                    return null;
                  }}
                  cursor={{ fill: 'transparent' }}
                />
                <ReferenceLine y={3} stroke="#F3C922" strokeWidth={1} strokeDasharray="3 3" />
                <Bar dataKey="failedCategories" radius={[4, 4, 0, 0]}>
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
          <div style={{
            width: '100%',
            maxHeight: '400px',
            overflow: 'auto',
            margin: '1rem 0',
            borderRadius: '8px',
            backgroundColor: 'transparent',
            border: '1px solid rgba(255, 255, 255, 0.08)',
            boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)'
          }}>
            <table style={{
              width: '100%',
              borderCollapse: 'collapse',
              borderSpacing: '0',
              tableLayout: 'fixed',
              backgroundColor: 'transparent',
              color: 'white'
            }}>
              <thead>
                <tr>
                  <th style={{
                    textAlign: 'left',
                    fontSize: '0.9rem',
                    fontWeight: '500',
                    color: 'white',
                    padding: '12px 16px',
                    borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
                    backgroundColor: '#2a3c6d', // Darker blue as shown in screenshot
                    position: 'sticky',
                    top: '0',
                    zIndex: '10',
                    textTransform: 'uppercase',
                    letterSpacing: '0.05em'
                  }}>Student</th>
                  <th style={{
                    fontSize: '0.9rem',
                    fontWeight: '500',
                    color: 'white',
                    padding: '12px 16px',
                    borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
                    backgroundColor: '#2a3c6d', // Darker blue as shown in screenshot
                    position: 'sticky',
                    top: '0',
                    zIndex: '10',
                    textTransform: 'uppercase',
                    letterSpacing: '0.05em',
                    width: '15%',
                    textAlign: 'center'
                  }}>Reading Level</th>
                  <th style={{
                    textAlign: 'left',
                    fontSize: '0.9rem',
                    fontWeight: '500',
                    color: 'white',
                    padding: '12px 16px',
                    borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
                    backgroundColor: '#2a3c6d', // Darker blue as shown in screenshot
                    position: 'sticky',
                    top: '0',
                    zIndex: '10',
                    textTransform: 'uppercase',
                    letterSpacing: '0.05em',
                    width: '15%'
                  }}>Section</th>
                  <th style={{
                    textAlign: 'left',
                    fontSize: '0.9rem',
                    fontWeight: '500',
                    color: 'white',
                    padding: '12px 16px',
                    borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
                    backgroundColor: '#2a3c6d', // Darker blue as shown in screenshot
                    position: 'sticky',
                    top: '0',
                    zIndex: '10',
                    textTransform: 'uppercase',
                    letterSpacing: '0.05em',
                    width: '30%'
                  }}>Categories Needing Improvement</th>
                  <th style={{
                    textAlign: 'left',
                    fontSize: '0.9rem',
                    fontWeight: '500',
                    color: 'white',
                    padding: '12px 16px',
                    borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
                    backgroundColor: '#2a3c6d', // Darker blue as shown in screenshot
                    position: 'sticky',
                    top: '0',
                    zIndex: '10',
                    textTransform: 'uppercase',
                    letterSpacing: '0.05em',
                    width: '10%'
                  }}>Action</th>
                </tr>
              </thead>
              <tbody>
                {sectionFilteredStudents.length > 0 ? (
                  sectionFilteredStudents.map((student) => (
                    <tr key={student.uniqueId || student.id} style={{
                      transition: 'background-color 0.2s',
                      backgroundColor: 'transparent'
                    }} onMouseOver={(e) => e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.08)'}
                      onMouseOut={(e) => e.currentTarget.style.backgroundColor = 'transparent'}>
                      <td style={{
                        padding: '12px 16px',
                        borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
                        fontSize: '0.95rem',
                        verticalAlign: 'middle',
                        color: 'white',
                        backgroundColor: 'transparent'
                      }}>{student.name}</td>
                      <td style={{
                        padding: '12px 16px',
                        borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
                        fontSize: '0.95rem',
                        verticalAlign: 'middle',
                        color: 'white',
                        backgroundColor: 'transparent',
                        textAlign: 'center'
                      }}>
                        <span style={{
                          display: 'inline-block',
                          padding: '0.35rem 0.8rem',
                          borderRadius: '20px',
                          fontSize: '0.8rem',
                          fontWeight: '600',
                          color: 'white',
                          textAlign: 'center',
                          minWidth: '80px',
                          boxShadow: '0 2px 4px rgba(0, 0, 0, 0.2)',
                          letterSpacing: '0.03em',
                          backgroundColor: getReadingLevelColor(student.readingLevel)
                        }}>
                          {student.readingLevel}
                        </span>
                      </td>
                      <td style={{
                        padding: '12px 16px',
                        borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
                        fontSize: '0.95rem',
                        verticalAlign: 'middle',
                        color: 'white',
                        backgroundColor: 'transparent'
                      }}>{student.section}</td>
                      <td style={{
                        padding: '12px 16px',
                        borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
                        fontSize: '0.95rem',
                        verticalAlign: 'middle',
                        color: 'white',
                        backgroundColor: 'transparent',
                        maxWidth: '300px'
                      }}>
                        <span style={{
                          display: '-webkit-box',
                          WebkitLineClamp: 2,
                          WebkitBoxOrient: 'vertical',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          lineHeight: 1.4
                        }}>
                          {student.readingLevel === 'Not Assessed'
                            ? 'Needs assessment to determine areas for improvement'
                            : (student.categoriesNeedingImprovement && Array.isArray(student.categoriesNeedingImprovement)
                              ? student.categoriesNeedingImprovement.map(cat => `${cat.category} (${cat.score}%)`).join(', ')
                              : 'All categories passed')}
                        </span>
                      </td>
                      <td style={{
                        padding: '12px 16px',
                        borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
                        fontSize: '0.95rem',
                        verticalAlign: 'middle',
                        color: 'white',
                        backgroundColor: 'transparent'
                      }}>
                        <button
                          style={{
                            backgroundColor: 'rgba(255, 255, 255, 0.15)',
                            border: '1px solid rgba(255, 255, 255, 0.15)',
                            borderRadius: '6px',
                            color: 'white',
                            padding: '0.4rem 0.9rem',
                            fontSize: '0.85rem',
                            cursor: 'pointer',
                            transition: 'all 0.2s',
                            minWidth: '70px',
                            width: '100%',
                            maxWidth: '100px',
                            margin: '0 auto',
                            display: 'block',
                            fontWeight: '500'
                          }}
                          onMouseOver={(e) => {
                            e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.25)';
                            e.currentTarget.style.transform = 'translateY(-2px)';
                            e.currentTarget.style.boxShadow = '0 2px 5px rgba(0, 0, 0, 0.2)';
                          }}
                          onMouseOut={(e) => {
                            e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.15)';
                            e.currentTarget.style.transform = 'translateY(0)';
                            e.currentTarget.style.boxShadow = 'none';
                          }}
                          onClick={() => openStudentDetail(student)}
                        >
                          View
                        </button>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="5" style={{
                      textAlign: 'center',
                      padding: '20px',
                      color: 'white',
                      borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
                      fontSize: '0.95rem',
                      backgroundColor: 'transparent'
                    }}>
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
          {/* Top-left cell: Category Performance by Reading Level Chart */}
          <div className="teacher-dashboard__grid-cell">
            <div className="teacher-card teacher-distribution-card">
              <h2 className="teacher-card__title">Category Performance by Reading Level</h2>
              <div className="teacher-category-performance-chart" style={{ height: '400px' }}>
                <ResponsiveContainer width="100%" height={400}>
                  <BarChart
                    data={getCategoryPerformanceData()}
                    margin={{ top: 20, right: 30, left: 20, bottom: 60 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255, 255, 255, 0.1)" />
                    <XAxis
                      dataKey="readingLevel"
                      stroke="white"
                      fontSize={12}
                      angle={-45}
                      textAnchor="end"
                      height={80}
                    />
                    <YAxis
                      stroke="white"
                      fontSize={12}
                      domain={[0, 100]}
                      label={{ value: 'Pass Rate (%)', angle: -90, position: 'insideLeft', style: { textAnchor: 'middle', fill: 'white' } }}
                    />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: 'rgba(42, 60, 109, 0.95)',
                        border: '1px solid rgba(255, 255, 255, 0.2)',
                        borderRadius: '8px',
                        color: 'white'
                      }}
                      formatter={(value, name) => [`${value}%`, name]}
                      labelStyle={{ color: 'white' }}
                    />
                    <ReferenceLine y={75} stroke="#FFC154" strokeDasharray="5 5" strokeWidth={2} />
                    <Legend
                      wrapperStyle={{ color: 'white', fontSize: '12px' }}
                      iconType="rect"
                    />
                    <Bar dataKey="Alphabet Knowledge" stackId="a" fill="#4BC0C0" name="Alphabet Knowledge" />
                    <Bar dataKey="Phonological Awareness" stackId="b" fill="#FF9F40" name="Phonological Awareness" />
                    <Bar dataKey="Decoding" stackId="c" fill="#FF6B6B" name="Decoding" />
                    <Bar dataKey="Word Recognition" stackId="d" fill="#9F7AEA" name="Word Recognition" />
                    <Bar dataKey="Reading Comprehension" stackId="e" fill="#48BB78" name="Reading Comprehension" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>

          {/* Top-right cell: Reading Level Distribution Chart */}
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
                        content={({ active, payload, label }) => {
                          if (active && payload && payload.length) {
                            const data = payload[0].payload;
                            return (
                              <div className="teacher-pie-chart-custom-tooltip">
                                <div className="teacher-pie-tooltip-header">{data.name}</div>
                                <div className="teacher-pie-tooltip-content">
                                  <div className="teacher-pie-tooltip-item">
                                    <span 
                                      className="teacher-pie-tooltip-color" 
                                      style={{ backgroundColor: data.color }}
                                    ></span>
                                    <span className="teacher-pie-tooltip-label">
                                      {data.value} students
                                    </span>
                                  </div>
                                </div>
                              </div>
                            );
                          }
                          return null;
                        }}
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

        </div>

        {/* Student Intervention Progress Section */}
        <div className="teacher-dashboard__full-width">
          <div className="teacher-intervention-section">
            <div className="teacher-intervention-header">
              <h2 className="teacher-intervention-title">Student Intervention Progress</h2>
              <div className="teacher-intervention-filters">
                <span className="teacher-filter-label">Reading Level:</span>
                <div className="teacher-reading-level-pills">
                  <button
                    className={`teacher-level-pill ${interventionFilter === 'all' ? 'teacher-level-pill--active' : ''}`}
                    onClick={() => setInterventionFilter('all')}
                  >
                    All
                  </button>
                  <button
                    className={`teacher-level-pill ${interventionFilter === 'Low Emerging' ? 'teacher-level-pill--active' : ''}`}
                    onClick={() => setInterventionFilter('Low Emerging')}
                  >
                    Low Emerging
                  </button>
                  <button
                    className={`teacher-level-pill ${interventionFilter === 'Transitioning' ? 'teacher-level-pill--active' : ''}`}
                    onClick={() => setInterventionFilter('Transitioning')}
                  >
                    Transitioning
                  </button>
                </div>
              </div>
            </div>

            {/* Chart Container */}
            <div className="teacher-intervention-chart-container">
              <ResponsiveContainer width="100%" height={300}>
                <BarChart
                  data={filteredInterventionProgress.map(progress => ({
                    name: progress.studentName || 'Student',
                    completed: progress.percentComplete || 0,
                    correct: progress.percentCorrect || 0
                  }))}
                  margin={{ top: 10, right: 30, left: 20, bottom: 60 }}
                  barGap={0}
                  barCategoryGap="20%"
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" vertical={false} />
                  <XAxis
                    dataKey="name"
                    tick={{ fill: 'white', fontSize: 12 }}
                    axisLine={{ stroke: 'rgba(255,255,255,0.3)' }}
                    tickLine={false}
                  />
                  <YAxis
                    tickFormatter={(value) => `${value}%`}
                    tick={{ fill: 'white', fontSize: 12 }}
                    axisLine={{ stroke: 'rgba(255,255,255,0.3)' }}
                    tickLine={false}
                    domain={[0, 100]}
                    ticks={[0, 25, 50, 75, 100]}
                  />
                  <Tooltip
                    content={({ active, payload, label }) => {
                      if (active && payload && payload.length) {
                        return (
                          <div className="teacher-intervention-custom-tooltip">
                            <div className="teacher-intervention-tooltip-header">{label}</div>
                            {payload.map((entry, index) => (
                              <div key={index} className="teacher-intervention-tooltip-item">
                                <span 
                                  className="teacher-intervention-tooltip-color" 
                                  style={{ backgroundColor: entry.color }}
                                ></span>
                                <span className="teacher-intervention-tooltip-label">
                                  {entry.dataKey === 'completed' ? 'Completion' : 'Correct Answers'}: {entry.value}%
                                </span>
                              </div>
                            ))}
                          </div>
                        );
                      }
                      return null;
                    }}
                    cursor={false}
                  />
                  <ReferenceLine y={75} stroke="#F3C922" strokeWidth={1} />
                  <Bar dataKey="completed" name="Completion %" fill="#4BC0C0" radius={[4, 4, 0, 0]} maxBarSize={30} />
                  <Bar dataKey="correct" name="Correct Answers %" fill="#FF9E40" radius={[4, 4, 0, 0]} maxBarSize={30} />
                  <Legend
                    verticalAlign="bottom"
                    height={36}
                    iconType="circle"
                    iconSize={10}
                    wrapperStyle={{ paddingTop: '20px' }}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>

            {/* Intervention Progress Table */}
            <div style={{
              padding: '0',
              overflowX: 'auto',
              border: '1px solid rgba(255, 255, 255, 0.15)',
              borderRadius: '8px',
              backgroundColor: 'rgba(30, 42, 74, 0.3)'
            }}>
              <table className="teacher-intervention-table">
                <thead>
                  <tr>
                    <th>STUDENT</th>
                    <th>INTERVENTION PLAN</th>
                    <th>READING LEVEL</th>
                    <th>COMPLETION</th>
                    <th>CORRECT %</th>
                    <th>ACTIONS</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredInterventionProgress && filteredInterventionProgress.length > 0 ? (
                    filteredInterventionProgress.map((progress) => (
                      <tr key={progress._id.$oid || progress._id}>
                        <td>{progress.studentName}</td>
                        <td>Intervention Plan</td>
                        <td>
                          <span style={{
                            display: 'inline-block',
                            padding: '0.4rem 0.8rem',
                            backgroundColor: 'rgba(255, 255, 255, 0.1)',
                            borderRadius: '4px',
                            fontSize: '0.85rem',
                            fontWeight: '500'
                          }}>
                            {progress.readingLevel || 'Not Assessed'}
                          </span>
                        </td>
                        <td>
                          <div style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '1rem'
                          }}>
                            <div style={{
                              flex: 1,
                              height: '10px',
                              backgroundColor: 'rgba(255, 255, 255, 0.1)',
                              borderRadius: '5px',
                              overflow: 'hidden'
                            }}>
                              <div 
                                style={{
                                  height: '100%',
                                  backgroundColor: '#F3C922',
                                  borderRadius: '5px',
                                  width: `${progress.percentComplete || 0}%`
                                }}
                              ></div>
                            </div>
                            <span style={{
                              fontSize: '0.85rem',
                              color: 'white',
                              minWidth: '40px',
                              textAlign: 'right'
                            }}>{progress.percentComplete || 0}%</span>
                          </div>
                        </td>
                        <td>{progress.percentCorrect || 0}%</td>
                        <td>
                          {progress.passedThreshold ? (
                            <button style={{
                              backgroundColor: '#4BC0C0',
                              color: '#1E2A4A',
                              padding: '0.5rem 1rem',
                              borderRadius: '6px',
                              fontSize: '0.85rem',
                              fontWeight: '500',
                              cursor: 'pointer',
                              transition: 'all 0.2s',
                              textAlign: 'center',
                              border: 'none',
                              whiteSpace: 'nowrap'
                            }}>
                              Resolved
                            </button>
                          ) : (
                            <button 
                              style={{
                                backgroundColor: '#FF9E40',
                                color: '#1E2A4A',
                                padding: '0.5rem 1rem',
                                borderRadius: '6px',
                                fontSize: '0.85rem',
                                fontWeight: '500',
                                cursor: 'pointer',
                                transition: 'all 0.2s',
                                textAlign: 'center',
                                border: 'none',
                                whiteSpace: 'nowrap'
                              }}
                              onMouseOver={(e) => {
                                e.currentTarget.style.transform = 'translateY(-2px)';
                                e.currentTarget.style.boxShadow = '0 3px 8px rgba(0, 0, 0, 0.2)';
                              }}
                              onMouseOut={(e) => {
                                e.currentTarget.style.transform = 'translateY(0)';
                                e.currentTarget.style.boxShadow = 'none';
                              }}
                              onClick={() => openInterventionDetail(progress)}
                            >
                              View Progress
                            </button>
                          )}
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan="6" className="teacher-no-data-cell">
                        No intervention progress data available.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Intervention Detail Modal */}
        {interventionDetailOpen && selectedIntervention && (
          <div className="teacher-modal-overlay" onClick={closeInterventionDetail}>
            <div className="teacher-modal-content teacher-intervention-modal" onClick={(e) => e.stopPropagation()}>
              <div className="teacher-modal-header" style={{ backgroundColor: "#FF9E40" }}>
                <h2>Intervention Progress Summary</h2>
                <button className="teacher-modal-close" onClick={closeInterventionDetail}>&times;</button>
              </div>

              <div className="teacher-modal-body">
                <div className="teacher-intervention-summary">
                  <div className="teacher-intervention-summary-header">
                    <div className="teacher-intervention-student-info">
                      <h3>{selectedIntervention.studentName || 'Student'}</h3>
                      <div className="teacher-intervention-student-details">
                        <span className="teacher-level-badge modal-badge">
                          {selectedIntervention.readingLevel || selectedIntervention.studentReadingLevel || 'Not Assessed'}
                        </span>
                        <span className="teacher-intervention-date">
                          Last Activity: {selectedIntervention.lastActivityDate || 'N/A'}
                        </span>
                      </div>
                    </div>
                    <div className="teacher-intervention-progress-stats">
                      <div className="teacher-stat-item">
                        <span className="teacher-stat-label">Completion</span>
                        <span className="teacher-stat-value">{selectedIntervention.percentComplete || 0}%</span>
                      </div>
                      <div className="teacher-stat-item">
                        <span className="teacher-stat-label">Correct</span>
                        <span className="teacher-stat-value">{selectedIntervention.percentCorrect || 0}%</span>
                      </div>
                      <div className="teacher-stat-item">
                        <span className="teacher-stat-label">Status</span>
                        <span className={`teacher-stat-status ${selectedIntervention.passedThreshold ? 'passed' : 'in-progress'}`}>
                          {selectedIntervention.passedThreshold ? 'Passed' : 'In Progress'}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="teacher-intervention-details">
                    <div className="teacher-intervention-detail-section">
                      <h4>Intervention Plan</h4>
                      <div className="teacher-detail-item">
                        <span className="teacher-detail-label">Plan Name:</span>
                        <span className="teacher-detail-value">{selectedIntervention.interventionPlanName || 'Intervention Plan'}</span>
                      </div>
                      <div className="teacher-detail-item">
                        <span className="teacher-detail-label">Category:</span>
                        <span className="teacher-detail-value">{selectedIntervention.category || 'N/A'}</span>
                      </div>
                      <div className="teacher-detail-item">
                        <span className="teacher-detail-label">Total Activities:</span>
                        <span className="teacher-detail-value">{selectedIntervention.totalActivities || 0}</span>
                      </div>
                      <div className="teacher-detail-item">
                        <span className="teacher-detail-label">Completed Activities:</span>
                        <span className="teacher-detail-value">{selectedIntervention.completedActivities || 0}</span>
                      </div>
                      <div className="teacher-detail-item">
                        <span className="teacher-detail-label">Correct Answers:</span>
                        <span className="teacher-detail-value">{selectedIntervention.correctAnswers || 0}</span>
                      </div>
                      <div className="teacher-detail-item">
                        <span className="teacher-detail-label">Incorrect Answers:</span>
                        <span className="teacher-detail-value">{selectedIntervention.incorrectAnswers || 0}</span>
                      </div>
                    </div>

                    <div className="teacher-intervention-notes-section">
                      <h4>Notes</h4>
                      <div className="teacher-intervention-notes">
                        {selectedIntervention.notes ? (
                          <p>{selectedIntervention.notes}</p>
                        ) : (
                          <p className="teacher-no-notes">No notes available for this intervention.</p>
                        )}
                      </div>
                    </div>

                    <div className="teacher-intervention-progress-chart-section">
                      <h4>Progress Visualization</h4>
                      <div className="teacher-intervention-progress-bars">
                        <div className="teacher-progress-bar-item">
                          <span className="teacher-progress-label">Completion</span>
                          <div className="teacher-modal-progress-wrapper">
                            <div className="teacher-modal-progress-track">
                              <div
                                className="teacher-modal-progress-fill"
                                style={{
                                  width: `${selectedIntervention.percentComplete || 0}%`,
                                  backgroundColor: '#4BC0C0'
                                }}
                              ></div>
                            </div>
                            <span className="teacher-modal-progress-text">{selectedIntervention.percentComplete || 0}%</span>
                          </div>
                        </div>

                        <div className="teacher-progress-bar-item">
                          <span className="teacher-progress-label">Correct Answers</span>
                          <div className="teacher-modal-progress-wrapper">
                            <div className="teacher-modal-progress-track">
                              <div
                                className="teacher-modal-progress-fill"
                                style={{
                                  width: `${selectedIntervention.percentCorrect || 0}%`,
                                  backgroundColor: '#FF9E40'
                                }}
                              ></div>
                              <div
                                className="teacher-threshold-marker"
                                style={{ left: '75%' }}
                              ></div>
                            </div>
                            <span className="teacher-modal-progress-text">{selectedIntervention.percentCorrect || 0}%</span>
                          </div>
                          <div className="teacher-threshold-label">Passing Threshold: 75%</div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="teacher-modal-footer">
                {!selectedIntervention.passedThreshold ? (
                  <button
                    className="teacher-primary-button"
                    onClick={() => {
                      // Add logic to update the intervention as complete if needed
                      closeInterventionDetail();
                    }}
                  >
                  </button>
                ) : (
                  <button
                    className="teacher-secondary-button"
                    onClick={closeInterventionDetail}
                  >
                    Close
                  </button>
                )}
              </div>
            </div>
          </div>
        )}


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
                      {prescriptiveData.find(d => d.readingLevel === selectedReadingLevel)?.broadAnalysis ||
                        "No analysis available for this reading level yet."}
                    </p>
                  </div>
                </div>

                {/* Students in this reading level */}
                <div style={{
                  marginTop: '1.5rem'
                }}>
                  <h4 style={{
                    fontSize: '1.1rem',
                    marginBottom: '1rem',
                    color: 'white',
                    fontWeight: '600'
                  }}>Students in this Level</h4>
                  <div style={{
                    backgroundColor: 'rgba(59, 79, 129, 0.3)',
                    borderRadius: '8px',
                    border: '1px solid rgba(255, 255, 255, 0.15)',
                    overflow: 'auto',
                    maxHeight: '300px'
                  }}>
                    <table style={{
                      width: '100%',
                      borderCollapse: 'collapse',
                      borderSpacing: '0',
                      backgroundColor: 'transparent',
                      color: 'white'
                    }}>
                      <thead>
                        <tr>
                          <th style={{
                            textAlign: 'left',
                            fontSize: '0.9rem',
                            fontWeight: '500',
                            color: 'white',
                            padding: '12px 16px',
                            borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
                            backgroundColor: '#2a3c6d', // Darker blue as shown in screenshot
                            position: 'sticky',
                            top: '0',
                            zIndex: '10',
                            textTransform: 'uppercase',
                            letterSpacing: '0.05em'
                          }}>Student</th>
                          <th style={{
                            textAlign: 'left',
                            fontSize: '0.9rem',
                            fontWeight: '500',
                            color: 'white',
                            padding: '12px 16px',
                            borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
                            backgroundColor: '#2a3c6d', // Darker blue as shown in screenshot
                            position: 'sticky',
                            top: '0',
                            zIndex: '10',
                            textTransform: 'uppercase',
                            letterSpacing: '0.05em'
                          }}>Section</th>
                          <th style={{
                            textAlign: 'left',
                            fontSize: '0.9rem',
                            fontWeight: '500',
                            color: 'white',
                            padding: '12px 16px',
                            borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
                            backgroundColor: '#2a3c6d', // Darker blue as shown in screenshot
                            position: 'sticky',
                            top: '0',
                            zIndex: '10',
                            textTransform: 'uppercase',
                            letterSpacing: '0.05em'
                          }}>Grade</th>
                          {selectedReadingLevel !== 'Not Assessed' && <th style={{
                            textAlign: 'left',
                            fontSize: '0.9rem',
                            fontWeight: '500',
                            color: 'white',
                            padding: '12px 16px',
                            borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
                            backgroundColor: '#2a3c6d', // Darker blue as shown in screenshot
                            position: 'sticky',
                            top: '0',
                            zIndex: '10',
                            textTransform: 'uppercase',
                            letterSpacing: '0.05em'
                          }}>Score</th>}
                          <th style={{
                            textAlign: 'left',
                            fontSize: '0.9rem',
                            fontWeight: '500',
                            color: 'white',
                            padding: '12px 16px',
                            borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
                            backgroundColor: '#2a3c6d', // Darker blue as shown in screenshot
                            position: 'sticky',
                            top: '0',
                            zIndex: '10',
                            textTransform: 'uppercase',
                            letterSpacing: '0.05em'
                          }}>Action</th>
                        </tr>
                      </thead>
                      <tbody>
                        {studentsInSelectedLevel.length > 0 ? (
                          studentsInSelectedLevel.map(student => (
                            <tr key={student.uniqueId || student.id} style={{
                              transition: 'background-color 0.2s',
                              backgroundColor: 'transparent'
                            }} onMouseOver={(e) => e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.08)'}
                               onMouseOut={(e) => e.currentTarget.style.backgroundColor = 'transparent'}>
                              <td style={{
                                padding: '12px 16px',
                                borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
                                fontSize: '0.95rem',
                                verticalAlign: 'middle',
                                color: 'white',
                                backgroundColor: 'transparent'
                              }}>{student.name}</td>
                              <td style={{
                                padding: '12px 16px',
                                borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
                                fontSize: '0.95rem',
                                verticalAlign: 'middle',
                                color: 'white',
                                backgroundColor: 'transparent'
                              }}>{student.section}</td>
                              <td style={{
                                padding: '12px 16px',
                                borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
                                fontSize: '0.95rem',
                                verticalAlign: 'middle',
                                color: 'white',
                                backgroundColor: 'transparent'
                              }}>{student.gradeLevel}</td>
                              {selectedReadingLevel !== 'Not Assessed' && <td style={{
                                padding: '12px 16px',
                                borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
                                fontSize: '0.95rem',
                                verticalAlign: 'middle',
                                color: 'white',
                                backgroundColor: 'transparent'
                              }}>{student.lastScore}%</td>}
                              <td style={{
                                padding: '12px 16px',
                                borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
                                fontSize: '0.95rem',
                                verticalAlign: 'middle',
                                color: 'white',
                                backgroundColor: 'transparent'
                              }}>
                                <button
                                  style={{
                                    backgroundColor: 'rgba(255, 255, 255, 0.15)',
                                    border: '1px solid rgba(255, 255, 255, 0.15)',
                                    borderRadius: '6px',
                                    color: 'white',
                                    padding: '0.4rem 0.9rem',
                                    fontSize: '0.85rem',
                                    cursor: 'pointer',
                                    transition: 'all 0.2s',
                                    minWidth: '70px',
                                    width: '100%',
                                    maxWidth: '80px',
                                    display: 'block',
                                    fontWeight: '500'
                                  }}
                                  onMouseOver={(e) => {
                                    e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.25)';
                                    e.currentTarget.style.transform = 'translateY(-2px)';
                                    e.currentTarget.style.boxShadow = '0 2px 5px rgba(0, 0, 0, 0.2)';
                                  }}
                                  onMouseOut={(e) => {
                                    e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.15)';
                                    e.currentTarget.style.transform = 'translateY(0)';
                                    e.currentTarget.style.boxShadow = 'none';
                                  }}
                                  onClick={() => openStudentDetail(student)}
                                >
                                  View
                                </button>
                              </td>
                            </tr>
                          ))
                        ) : (
                          <tr>
                            <td colSpan={selectedReadingLevel !== 'Not Assessed' ? 5 : 4} style={{
                              textAlign: 'center',
                              padding: '20px',
                              color: 'white',
                              borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
                              fontSize: '0.95rem',
                              backgroundColor: 'transparent'
                            }}>
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

            <div style={{
              padding: '1.5rem',
              display: 'flex',
              justifyContent: 'flex-end',
              gap: '1rem',
              borderTop: '1px solid rgba(255, 255, 255, 0.1)',
              backgroundColor: 'rgba(43, 58, 103, 0.5)',
              borderRadius: '0 0 12px 12px'
            }}>
              <button
                style={{
                  backgroundColor: '#F3C922',
                  border: 'none',
                  borderRadius: '6px',
                  color: '#2B3A67',
                  padding: '0.6rem 1.2rem',
                  fontSize: '0.95rem',
                  fontWeight: '600',
                  cursor: 'pointer',
                  transition: 'all 0.3s',
                  boxShadow: '0 2px 5px rgba(0, 0, 0, 0.2)',
                  letterSpacing: '0.03em',
                  textTransform: 'uppercase'
                }}
                onMouseOver={(e) => {
                  e.currentTarget.style.backgroundColor = '#FFE066';
                  e.currentTarget.style.transform = 'translateY(-2px)';
                  e.currentTarget.style.boxShadow = '0 4px 8px rgba(0, 0, 0, 0.25)';
                }}
                onMouseOut={(e) => {
                  e.currentTarget.style.backgroundColor = '#F3C922';
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.boxShadow = '0 2px 5px rgba(0, 0, 0, 0.2)';
                }}
                onClick={() => {
                  closeReadingLevelModal();
                  navigate('/teacher/students', { state: { filterReadingLevel: selectedReadingLevel } });
                }}
              >
                See All Students
              </button>
              <button 
                style={{
                  backgroundColor: 'rgba(255, 255, 255, 0.1)',
                  border: '1px solid rgba(255, 255, 255, 0.15)',
                  borderRadius: '6px',
                  color: 'white',
                  padding: '0.6rem 1.2rem',
                  fontSize: '0.95rem',
                  fontWeight: '500',
                  cursor: 'pointer',
                  transition: 'all 0.3s',
                  letterSpacing: '0.03em'
                }}
                onMouseOver={(e) => {
                  e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.2)';
                  e.currentTarget.style.transform = 'translateY(-2px)';
                  e.currentTarget.style.boxShadow = '0 2px 5px rgba(0, 0, 0, 0.2)';
                }}
                onMouseOut={(e) => {
                  e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.1)';
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.boxShadow = 'none';
                }}
                onClick={closeReadingLevelModal}
              >
                Close
              </button>
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
                      {selectedStudent.categoriesNeedingImprovement && selectedStudent.categoriesNeedingImprovement.length > 0 ? (
                        selectedStudent.categoriesNeedingImprovement.map((categoryInfo, index) => (
                          <div key={index} className="teacher-category-item">
                            <div className="teacher-category-marker" style={{ backgroundColor: getReadingLevelColor(selectedStudent.readingLevel) }}></div>
                            <div className="teacher-category-name">
                              {categoryInfo.category} ({categoryInfo.score}%) - {categoryInfo.status}
                            </div>
                          </div>
                        ))
                      ) : (
                        <p>No improvement categories identified.</p>
                      )}
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
                      <span className="teacher-info-value">
                        {selectedStudent.parentName || 'Not specified'}
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
                  navigate('/teacher/manage-progress', {
                    state: { studentId: selectedStudent.id }
                  });
                }}
              >
                Manage Progress
              </button>
              <button className="teacher-secondary-button" onClick={closeStudentDetail}>Close</button>
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
