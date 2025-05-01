// frontend/src/pages/Teachers/TeacherDashboard.jsx
import React, { useState, useEffect } from 'react';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, ReferenceLine, Area, PieChart, Pie, Cell,
  BarChart, Bar, Legend
} from 'recharts';

// Import services - this is the fixed section with the correct imports
import {
  getStudentDetails,
  getAllStudents,
  getStudentIds,
  getDashboardMetrics,
  getStudentsNeedingAttention,
  getAntasDistribution,
  getProgressByAntas,
  getPrescriptiveAnalytics,
  getPendingActivities
} from '../../services/StudentService';

// Import icons
import studentsIcon from '../../assets/icons/Teachers/students.png';
import activitiesIcon from '../../assets/icons/Teachers/students.png';
import pendingIcon from '../../assets/icons/Teachers/students.png';
import scoringIcon from '../../assets/icons/Teachers/students.png';
import '../../css/Teachers/TeacherDashboard.css';



const TeacherDashboard = () => {

  // Add this at the beginning of your TeacherDashboard component
  useEffect(() => {
    // Debug logged to check if we're getting data from services
    console.log("Checking StudentService exports:");

    getAllStudents()
      .then(students => {
        console.log("getAllStudents returned:", students);
      })
      .catch(err => {
        console.error("Error in getAllStudents:", err);
      });

    getAntasDistribution()
      .then(dist => {
        console.log("getAntasDistribution returned:", dist);
      })
      .catch(err => {
        console.error("Error in getAntasDistribution:", err);
      });

    // More debug checks as needed
  }, []);

  // State variables
  const [selectedAntasLevel, setSelectedAntasLevel] = useState('Antas 1');
  const [timeFrame, setTimeFrame] = useState('week');
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [expandedAntas, setExpandedAntas] = useState(null);
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [studentDetailOpen, setStudentDetailOpen] = useState(false);
  const [activeAntasTab, setActiveAntasTab] = useState('issues');
  const [notificationCount, setNotificationCount] = useState(3);
  const [studentFilter, setStudentFilter] = useState('all');
  const [pendingActivities, setPendingActivities] = useState([]);
  const [students, setStudents] = useState([]);
  const [progressData, setProgressData] = useState({});
  const [antasDistribution, setAntasDistribution] = useState([]);
  const [studentsNeedingAttention, setStudentsNeedingAttention] = useState([]);
  const [studentScores, setStudentScores] = useState([]);
  const [metrics, setMetrics] = useState({
    totalStudents: 0,
    completionRate: 0,
    assignedActivities: 0,
    completedActivities: 0,
    pendingEdits: 0
  });
  const [prescriptiveData, setPrescriptiveData] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  // Antas level colors
  const antasColors = {
    'Antas 1': '#FF6B8A', // Nag-uumpisang Matuto (Kindergarten)
    'Antas 2': '#FF9E40', // Pa-unlad na Nag-aaral (Grade 1)
    'Antas 3': '#FFCD56', // Sanay na Mag-aaral (Grade 2)
    'Antas 4': '#4BC0C0'  // Maalam at Mapanuring Mag-aaral (Grade 3)
  };

  const group = studentsNeedingAttention.filter(
    s => s.readingLevel === selectedAntasLevel
  );

  const avgCompletion = Math.round(
    group.reduce((sum, s) => sum + s.completionRate, 0) / (group.length || 1)
  );

  const avgScore = Math.round(
    group.reduce((sum, s) => sum + s.lastScore, 0) / (group.length || 1)
  );


  // Fetch data on component mount
  useEffect(() => {
    fetchDashboardData();
  }, []);

  // Fetch all necessary dashboard data
  const fetchDashboardData = async () => {
    setIsLoading(true);
    try {
      // Fetch all required data using the service functions
      const metricsData = await getDashboardMetrics();
      const distributionData = await getAntasDistribution();
      const needingAttention = await getStudentsNeedingAttention(5);
      const progByAntas = await getProgressByAntas();
      const prescriptiveInsights = await getPrescriptiveAnalytics();
      const activityModifications = await getPendingActivities();
      const allStudents = await getAllStudents();

      // Set state with fetched data
      setMetrics(metricsData);
      setAntasDistribution(distributionData);
      setStudentsNeedingAttention(needingAttention);
      setProgressData(progByAntas);
      setPrescriptiveData(prescriptiveInsights);
      setPendingActivities(activityModifications);
      setStudents(allStudents);

      // Create student scores for chart
      const scores = needingAttention.map(student => ({
        name: student.name.split(' ')[0], // First name only for chart
        score: student.lastScore
      }));
      setStudentScores(scores);

      // Set first Antas level as default if available
      if (distributionData.length > 0) {
        setSelectedAntasLevel(distributionData[0].name);
      }

    } catch (error) {
      console.error("Error fetching dashboard data:", error);
    } finally {
      setIsLoading(false);
    }
  };

  // UI event handlers
  const toggleDropdown = () => setIsDropdownOpen(!isDropdownOpen);

  const selectAntasLevel = (antas) => {
    setSelectedAntasLevel(antas);
    setIsDropdownOpen(false);
  };

  const toggleTimeFrame = () =>
    setTimeFrame(tf => (tf === 'week' ? 'day' : 'week'));

  const handleAntasPieClick = (entry) => {
    setSelectedAntasLevel(entry.name);
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
  };

  const toggleAntasExpand = (antasLevel) => {
    if (expandedAntas === antasLevel) {
      setExpandedAntas(null);
    } else {
      setExpandedAntas(antasLevel);
    }
  };

  const openStudentDetail = (student) => {
    setSelectedStudent(student);
    setStudentDetailOpen(true);
  };

  const closeStudentDetail = () => {
    setStudentDetailOpen(false);
    setSelectedStudent(null);
  };

  const getAntasColor = (antasLevel) => {
    return antasColors[antasLevel] || '#4BC0C0';
  };

  const handleFilterChange = (filter) => {
    setStudentFilter(filter);
  };

  // Get chart data for the selected Antas level
  const chartData = progressData[selectedAntasLevel]?.[timeFrame] || [];

  // Filter students based on selected filter
  const filteredStudents = studentFilter === 'all'
    ? studentsNeedingAttention
    : studentsNeedingAttention.filter(student => student.readingLevel === studentFilter);

  if (isLoading) {
    return <div className="litx-dashboard-loading">Naglo-load ang dashboard...</div>;
  }

  return (
    <div className="litx-dashboard">
      {/* Header with filters */}
      <main className="litx-dashboard__content">
        <div className="litx-dashboard__header">
          <h1 className="litx-dashboard__title">Teacher Dashboard</h1>

          <div className="litx-notification-bell">
            <span className="litx-notification-icon">🔔</span>
            <span className="litx-notification-badge">{notificationCount}</span>
          </div>
        </div>

        {/* Stats Cards Grid */}
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
              <p className="litx-stat-card__value">{
                Math.round(
                  studentsNeedingAttention.reduce((sum, student) => sum + student.lastScore, 0) /
                  (studentsNeedingAttention.length || 1)
                )
              }%</p>
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

        {/* Full-width Students Needing Attention */}
        <div className="litx-card litx-full-width-card litx-students-card">
          <div className="litx-card__header">
            <h2 className="litx-card__title">Students Needing Attention</h2>
            <div className="litx-filter-controls">
              <span className="litx-filter-label">Filter:</span>
              <div className="litx-filter-buttons">
                <button
                  className={`litx-filter-btn ${studentFilter === 'all' ? 'litx-filter-btn--active' : ''}`}
                  onClick={() => handleFilterChange('all')}
                >
                  All
                </button>
                {antasDistribution.map((antas) => (
                  <button
                    key={antas.name}
                    className={`litx-filter-btn ${studentFilter === antas.name ? 'litx-filter-btn--active' : ''}`}
                    onClick={() => handleFilterChange(antas.name)}
                    style={{
                      backgroundColor: studentFilter === antas.name ? getAntasColor(antas.name) : 'transparent',
                      color: studentFilter === antas.name ? 'white' : 'inherit'
                    }}
                  >
                    {antas.name}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Student Scores Bar Chart */}
          <div className="litx-score-chart-container">
            <ResponsiveContainer width="100%" height={180}>
              <BarChart
                data={filteredStudents.map(student => ({
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
                  {filteredStudents.map((student, i) => (
                    <Cell
                      key={`cell-${i}`}
                      fill={getAntasColor(student.readingLevel)}
                      cursor="pointer"
                      onClick={() => openStudentDetail(student)}
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div className="litx-students-table-container">
            <table className="litx-students-table">
              <thead>
                <tr>
                  <th>Student</th>
                  <th>Antas</th>
                  <th>Difficulty</th>
                  <th>Score</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {filteredStudents.map((student) => (
                  <tr key={student.id} className="litx-student-row">
                    <td>{student.name}</td>
                    <td>
                      <span
                        className="litx-antas-badge"
                        style={{ backgroundColor: getAntasColor(student.readingLevel) }}
                      >
                        {student.readingLevel}
                      </span>
                    </td>
                    <td className="litx-difficulty-cell">
                      <span className="litx-difficulty-text">{student.difficulty}</span>
                    </td>
                    <td>{student.lastScore}%</td>
                    <td>
                      <button
                        className="litx-view-button"
                        onClick={() => openStudentDetail(student)}
                      >
                        View
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Main 2x2 grid structure */}
        <div className="litx-dashboard__main-grid">
          {/* Top-left cell: Antas Distribution Chart */}
          <div className="litx-dashboard__grid-cell">
            <div className="litx-card litx-distribution-card">
              <h2 className="litx-card__title">Students by Antas Level</h2>
              <div className="litx-antas-distribution">
                <div className="litx-pie-chart">
                  <ResponsiveContainer width="120%" height={320}>
                    <PieChart>
                      <Pie
                        data={antasDistribution}
                        cx="50%"
                        cy="50%"
                        outerRadius={80}
                        innerRadius={50}
                        dataKey="value"
                        nameKey="name"
                        onClick={(data, index) => {
                          const target = antasDistribution[index];
                          if (target) handleAntasPieClick(target);
                        }}
                        cursor="pointer"
                      >
                        {antasDistribution.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip
                        formatter={(value, name, props) => [`${value} students`, name]}
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
                  {antasDistribution.map((entry, index) => (
                    <div
                      key={index}
                      className="litx-legend-item"
                      onClick={() => selectAntasLevel(entry.name)}
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
                <h2 className="litx-card__title">{timeFrame === 'week' ? 'Week' : 'Daily'} Reading Progress</h2>
                <div className="litx-chart__controls">
                  <button
                    className="litx-timeframe-btn"
                    onClick={toggleTimeFrame}
                  >
                    {timeFrame === 'week' ? 'Show Daily' : 'Show Weekly'}
                  </button>
                  <div className="litx-dropdown">
                    <button
                      className="litx-dropdown__trigger"
                      onClick={toggleDropdown}
                    >
                      {selectedAntasLevel}
                      <span className={`litx-dropdown__arrow ${isDropdownOpen ? 'litx-dropdown__arrow--open' : ''}`}>▼</span>
                    </button>
                    {isDropdownOpen && (
                      <div className="litx-dropdown__menu">
                        {antasDistribution.map((antas, index) => (
                          <div
                            key={index}
                            className={`litx-dropdown__item ${selectedAntasLevel === antas.name ? 'litx-dropdown__item--active' : ''}`}
                            onClick={() => selectAntasLevel(antas.name)}
                          >
                            {antas.name}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>

              <div className="litx-chart__container">
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
                        <stop offset="5%" stopColor={getAntasColor(selectedAntasLevel)} stopOpacity={0.8} />
                        <stop offset="95%" stopColor={getAntasColor(selectedAntasLevel)} stopOpacity={0.1} />
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
                      stroke={getAntasColor(selectedAntasLevel)}
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
                      labelFormatter={(label) => timeFrame === 'week' ? `Week ${label}` : label}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        </div>

        {/* Full-width Activity Modifications */}
        <div className="litx-dashboard__full-width">
          <div className="litx-card litx-activity-modifications-card">
            <h2 className="litx-card__title">Activity Modifications</h2>
            <div className="litx-activity-modifications">
              {pendingActivities.length > 0 ? (
                pendingActivities.map((activity) => (
                  <div
                    key={activity.id}
                    className="litx-task-item"
                    style={{
                      borderLeft: `4px solid ${activity.status === 'Urgent' ? '#FF6B8A' :
                          activity.status === 'Pending' ? '#FFCD56' : '#4BC0C0'
                        }`
                    }}
                  >
                    <div className="litx-task-header">
                      <span className={`litx-status-indicator litx-status-${activity.status.toLowerCase()}`}></span>
                      <span className="litx-task-type">{activity.type}</span>
                      <span className="litx-task-date">{activity.date}</span>
                    </div>
                    <div className="litx-task-details">
                      <div className="litx-student-info">
                        <p className="litx-student-name">{activity.studentName}</p>
                        <span
                          className="litx-antas-badge litx-antas-badge-small"
                          style={{ backgroundColor: getAntasColor(activity.antasLevel) }}
                        >
                          {activity.antasLevel}
                        </span>
                      </div>
                      <p className="litx-task-description">{activity.details}</p>
                      <button className="litx-action-button">Review</button>
                    </div>
                  </div>
                ))
              ) : (
                <div className="litx-no-activities">
                  <p>No pending activity modifications at this time.</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </main>

      {/* Modal for Antas Level Details */}
      {isModalOpen && (
        <div className="litx-modal-overlay" onClick={closeModal}>
          <div className="litx-modal-content" onClick={e => e.stopPropagation()}>
            <div
              className="litx-modal-header"
              style={{ backgroundColor: getAntasColor(selectedAntasLevel) }}
            >
              <h2>{selectedAntasLevel} Details</h2>
              <button className="litx-modal-close" onClick={closeModal}>&times;</button>
            </div>

            <div className="litx-modal-body">
              {/* Stats */}
              <div className="litx-stats-section">
                <div className="litx-stat-block">
                  <h3>Students</h3>
                  <p className="litx-big-stat">
                    {antasDistribution.find(a => a.name === selectedAntasLevel)?.value || 0}
                  </p>
                </div>
                <div className="litx-stat-block">
                  <h3>Completion Rate</h3>
                  <p className="litx-big-stat">{avgCompletion}%</p>
                </div>

                <div className="litx-stat-block">
                  <h3>Avg. Score</h3>
                  <p className="litx-big-stat">
                    {Math.round(
                      students.filter(s => s.readingLevel === selectedAntasLevel)
                        .reduce((sum, s) => sum + s.lastScore, 0) /
                      (students.filter(s => s.readingLevel === selectedAntasLevel).length || 1)
                    )}%
                  </p>
                </div>
              </div>

              <div className="litx-issues-section">
                <h3 className="litx-section-heading">Top Issues for {selectedAntasLevel}</h3>
                <div className="litx-issue-bars">
                  {prescriptiveData
                    .find(d => d.antasLevel === selectedAntasLevel)
                    ?.issues.map((issue, i) => {
                      const totalStudents = antasDistribution.find(a => a.name === selectedAntasLevel)?.value || 1;
                      const widthPercent = Math.min((issue.count / totalStudents) * 100, 100);

                      return (
                        <div key={i} className="litx-issue-bar-container">
                          <div className="litx-issue-name">{issue.issue}</div>
                          <div className="litx-issue-bar-wrapper">
                            <div
                              className="litx-issue-bar"
                              style={{
                                width: `${widthPercent}%`,
                                backgroundColor: getAntasColor(selectedAntasLevel),
                              }}
                            />
                            <span className="litx-issue-bar-label">{issue.count} student{issue.count > 1 ? 's' : ''}</span>
                          </div>
                        </div>
                      );
                    })}
                </div>

                <div className="litx-prescriptive-summary">
                  <h4>Prescriptive Analysis</h4>
                  <p>
                    {prescriptiveData.find(d => d.antasLevel === selectedAntasLevel)?.broadAnalysis}
                  </p>
                </div>
              </div>
            </div>

            <div className="litx-modal-footer">
              <button className="litx-modal-action-button" onClick={closeModal}>Close</button>
            </div>
          </div>
        </div>
      )}

      {/* Student Detail Modal */}
      {studentDetailOpen && selectedStudent && (
        <div className="litx-modal-overlay">
          <div className="litx-modal-content litx-student-modal" onClick={(e) => e.stopPropagation()}>
            <div
              className="litx-modal-header"
              style={{ backgroundColor: getAntasColor(selectedStudent.readingLevel) }}
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
                      <span className="litx-info-label">Antas Level:</span>
                      <span className="litx-info-value">
                        <span
                          className="litx-antas-badge"
                          style={{ backgroundColor: getAntasColor(selectedStudent.readingLevel) }}
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
                      <span className="litx-info-label">Completion Rate:</span>
                      <span className="litx-info-value">{selectedStudent.completionRate}%</span>
                    </div>
                    <div className="litx-info-item">
                      <span className="litx-info-label">Average Score:</span>
                      <span className="litx-info-value">{selectedStudent.lastScore}%</span>
                    </div>
                  </div>
                </div>

                <div className="litx-student-progress-section">
                  <h3>Areas Needing Improvement</h3>
                  <div className="litx-issues-list">
                    {selectedStudent.difficulty.split(' at ').map((issue, i) => (
                      <div key={i} className="litx-issue-item">
                        <span className="litx-issue-text">• {issue.trim()}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <div className="litx-modal-actions">
                <button
                  className="litx-primary-button"
                  onClick={() => {
                    closeStudentDetail();
                    // Navigate to student progress view
                    window.location.href = `/teacher/student-progress/${selectedStudent.id}`;
                  }}
                >
                  View Complete Progress Report
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TeacherDashboard;