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
  const [timeFrame, setTimeFrame] = useState('weekly');
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
  const [progressData, setProgressData] = useState({});
  const [prescriptiveData, setPrescriptiveData] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
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
   * Main function to fetch all dashboard data
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
          pendingEdits: 0
        });

        // Set sections
        setSections(dashboardData.sections || ['Sampaguita', 'Unity', 'Dignity']);

        // Set intervention progress data
        setInterventionProgress(dashboardData.interventionProgress || []);

        // Set notification count based on students needing attention
        setNotificationCount(
          (dashboardData.studentsNeedingAttention || []).length
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
      }
    } catch (error) {
      console.error("Error fetching dashboard data:", error);
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
                          <div style={{ fontSize: '0.9rem' }}> Score Percentage: {score}%</div>
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
                    <tr key={student.uniqueId || student.id} className="teacher-student-row">
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
                            : (student.improvementCategories && Array.isArray(student.improvementCategories)
                              ? student.improvementCategories.join(', ')
                              : 'Needs assessment')}
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
            name: progress.studentName || 'Unknown',
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
            contentStyle={{
              backgroundColor: 'rgba(43, 58, 103, 0.9)',
              border: '1px solid #F3C922',
              borderRadius: '8px',
              color: 'white'
            }}
            formatter={(value) => [`${value}%`, '']}
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
    <div className="teacher-intervention-table-wrapper">
      <table className="teacher-intervention-table">
        <thead>
          <tr>
            <th className="teacher-table-cell teacher-student-column">STUDENT</th>
            <th className="teacher-table-cell teacher-plan-column">INTERVENTION PLAN</th>
            <th className="teacher-table-cell teacher-level-column">READING LEVEL</th>
            <th className="teacher-table-cell teacher-completion-column">COMPLETION</th>
            <th className="teacher-table-cell teacher-correct-column">CORRECT %</th>
            <th className="teacher-table-cell teacher-action-column">ACTIONS</th>
          </tr>
        </thead>
        <tbody>
          {filteredInterventionProgress && filteredInterventionProgress.length > 0 ? (
            filteredInterventionProgress.map((progress) => (
              <tr key={progress._id.$oid || progress._id} className="teacher-intervention-row">
                <td className="teacher-table-cell teacher-student-column">{progress.studentName}</td>
                <td className="teacher-table-cell teacher-plan-column">Intervention Plan</td>
                <td className="teacher-table-cell teacher-level-column">
                  <span className="teacher-level-badge">
                    {progress.readingLevel || 'Not Assessed'}
                  </span>
                </td>
                <td className="teacher-table-cell teacher-completion-column">
                  <div className="teacher-progress-wrapper">
                    <div className="teacher-progress-track">
                      <div 
                        className="teacher-progress-fill" 
                        style={{ width: `${progress.percentComplete || 0}%` }}
                      ></div>
                    </div>
                    <span className="teacher-progress-text">{progress.percentComplete || 0}%</span>
                  </div>
                </td>
                <td className="teacher-table-cell teacher-correct-column">{progress.percentCorrect || 0}%</td>
                <td className="teacher-table-cell teacher-action-column">
                  {progress.passedThreshold ? (
                    <button className="teacher-action-button teacher-resolved-button">
                      Resolved
                    </button>
                  ) : (
                    <button 
                    className="teacher-action-button teacher-view-progress-button"
                    onClick={() => openInterventionDetail(progress)}
                  >
                    In View Progress
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
              <h3>{selectedIntervention.studentName || 'Unknown Student'}</h3>
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
                            <tr key={student.uniqueId || student.id} className="teacher-student-row">
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
                      {selectedStudent.improvementCategories && selectedStudent.improvementCategories.length > 0 ? (
                        selectedStudent.improvementCategories.map((category, index) => (
                          <div key={index} className="teacher-category-item">
                            <div className="teacher-category-marker" style={{ backgroundColor: getReadingLevelColor(selectedStudent.readingLevel) }}></div>
                            <div className="teacher-category-name">{category}</div>
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
