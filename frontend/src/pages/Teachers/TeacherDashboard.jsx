// frontend/src/pages/Teachers/TeacherDashboard.jsx
import React, { useState, useEffect } from 'react';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, ReferenceLine, Area, PieChart, Pie, Cell,
  BarChart, Bar, Legend
} from 'recharts';

// Import icons
import studentsIcon from '../../assets/icons/Teachers/students.png';
import parentIcon from '../../assets/icons/Teachers/parent.png';
import activitiesIcon from '../../assets/icons/Teachers/parent.png';
import pendingIcon from '../../assets/icons/Teachers/parent.png';
import '../../css/Teachers/TeacherDashboard.css';

// Import dashboard data
import dashboardData from '../../data/Teachers/dashboardData.js';

const TeacherDashboard = () => {
  const [selectedAntasLevel, setSelectedAntasLevel] = useState('Antas 1');
  const [timeFrame, setTimeFrame] = useState('week');
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [expandedAntas, setExpandedAntas] = useState(null);
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [studentDetailOpen, setStudentDetailOpen] = useState(false);
  const [activeAntasTab, setActiveAntasTab] = useState('issues');
  const [notificationCount, setNotificationCount] = useState(3);

  const {
    studentsByAntasLevel,
    metrics,
    progressData,
    prescriptiveData,
    pendingTasks,
    studentsNeedingAttention,
    activityLog,
    notifications,
    studentScores
  } = dashboardData;

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
    const antas = studentsByAntasLevel.find(a => a.name === antasLevel);
    return antas ? antas.color : '#4BC0C0';
  };

  const chartData = progressData[selectedAntasLevel]?.[timeFrame] || [];

  // Filter pending tasks to only show parent concerns and activity modifications
  const filteredPendingTasks = pendingTasks.filter(
    task => task.type === 'Parent Concern' || task.type === 'Activity Modification'
  );

  return (
    <div className="edu-dashboard">
      {/* Header with filters */}
      <main className="edu-dashboard__content">
        <div className="edu-dashboard__header">
          <h1 className="edu-dashboard__title">Teacher Dashboard</h1>

          <div className="edu-notification-bell">
            <span className="edu-notification-icon">🔔</span>
            <span className="edu-notification-badge">{notificationCount}</span>
          </div>
        </div>

        {/* Stats Cards Grid */}
        <div className="edu-dashboard__stats">
          <div className="edu-stat-card edu-stat-card--students">
            <img src={studentsIcon} alt="Students" className="edu-stat-card__icon" />
            <div className="edu-stat-card__info">
              <h3 className="edu-stat-card__heading">Total Students</h3>
              <p className="edu-stat-card__value">{metrics.totalStudents}</p>
            </div>
          </div>

          <div className="edu-stat-card edu-stat-card--parents">
            <img src={parentIcon} alt="Parents" className="edu-stat-card__icon" />
            <div className="edu-stat-card__info">
              <h3 className="edu-stat-card__heading">Parent Concerns</h3>
              <p className="edu-stat-card__value">{metrics.openConcerns}</p>
            </div>
          </div>

          <div className="edu-stat-card edu-stat-card--activities">
            <img src={activitiesIcon} alt="Activities" className="edu-stat-card__icon" />
            <div className="edu-stat-card__info">
              <h3 className="edu-stat-card__heading">Completion Rate</h3>
              <p className="edu-stat-card__value">{metrics.completionRate}%</p>
              <p className="edu-stat-card__subtitle">{metrics.completedActivities} of {metrics.assignedActivities}</p>
            </div>
          </div>

          <div className="edu-stat-card edu-stat-card--pending">
            <img src={pendingIcon} alt="Pending" className="edu-stat-card__icon" />
            <div className="edu-stat-card__info">
              <h3 className="edu-stat-card__heading">Pending Actions</h3>
              <p className="edu-stat-card__value">{metrics.pendingEdits + metrics.openConcerns}</p>
            </div>
          </div>
        </div>

        {/* Full-width Students Needing Attention */}
        <div className="edu-card edu-full-width-card edu-students-card">
          <h2 className="edu-card__title">Students Needing Attention</h2>

          {/* Student Scores Bar Chart */}
          <div className="edu-score-chart-container">
            <ResponsiveContainer width="100%" height={180}>
              <BarChart
                data={studentScores}
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
                  {studentScores.map((entry, i) => {
                    const student = studentsNeedingAttention[i];
                    const fillColor = getAntasColor(student.antasLevel);
                    return (
                      <Cell
                        key={`cell-${i}`}
                        fill={fillColor}
                        cursor="pointer"
                        onClick={() => openStudentDetail(student)}
                      />
                    );
                  })}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>


          <div className="edu-students-table-container">
            <table className="edu-students-table">
              <thead>
                <tr>
                  <th>Student</th>
                  <th>Antas</th>
                  <th>Difficulty</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {studentsNeedingAttention.map((student) => (
                  <tr key={student.id} className="edu-student-row">
                    <td>{student.name}</td>
                    <td>
                      <span
                        className="edu-antas-badge"
                        style={{ backgroundColor: getAntasColor(student.antasLevel) }}
                      >
                        {student.antasLevel}
                      </span>
                    </td>
                    <td className="edu-difficulty-cell">
                      <span className="edu-difficulty-text">{student.difficulty}</span>
                    </td>
                    <td>
                      <button
                        className="edu-view-button"
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
        <div className="edu-dashboard__main-grid">
          {/* Top-left cell: Antas Distribution Chart */}
          <div className="edu-dashboard__grid-cell">
            <div className="edu-card edu-distribution-card">
              <h2 className="edu-card__title">Students by Antas Level</h2>
              <div className="edu-antas-distribution">
                <div className="edu-pie-chart">
                  <ResponsiveContainer width="120%" height={320}>
                    <PieChart>
                      <Pie
                        data={studentsByAntasLevel}
                        cx="50%"
                        cy="50%"
                        outerRadius={80}
                        innerRadius={50}
                        dataKey="value"
                        nameKey="name"
                        onClick={(data, index) => {
                          const target = studentsByAntasLevel[index];
                          if (target) handleAntasPieClick(target);
                        }}
                        cursor="pointer"
                      >
                        {studentsByAntasLevel.map((entry, index) => (
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

                <div className="edu-antas-legend">
                  {studentsByAntasLevel.map((entry, index) => (
                    <div
                      key={index}
                      className="edu-legend-item"
                      onClick={() => selectAntasLevel(entry.name)}
                    >
                      <div
                        className="edu-legend-color"
                        style={{ backgroundColor: entry.color }}
                      ></div>
                      <div className="edu-legend-text">
                        <span>{entry.name}</span>
                        <span className="edu-legend-value">{entry.value} students</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>



          {/* Top-right cell: Progress Chart */}
          <div className="edu-dashboard__grid-cell">
            <div className="edu-card edu-chart-card">
              <div className="edu-chart__header">
                <h2 className="edu-card__title">{timeFrame === 'week' ? 'Week' : 'Daily'} Reading Progress</h2>
                <div className="edu-chart__controls">
                  <button
                    className="edu-timeframe-btn"
                    onClick={toggleTimeFrame}
                  >
                    {timeFrame === 'week' ? 'Show Daily' : 'Show Weekly'}
                  </button>
                  <div className="edu-dropdown">
                    <button
                      className="edu-dropdown__trigger"
                      onClick={toggleDropdown}
                    >
                      {selectedAntasLevel}
                      <span className={`edu-dropdown__arrow ${isDropdownOpen ? 'edu-dropdown__arrow--open' : ''}`}>▼</span>
                    </button>
                    {isDropdownOpen && (
                      <div className="edu-dropdown__menu">
                        {studentsByAntasLevel.map((antas, index) => (
                          <div
                            key={index}
                            className={`edu-dropdown__item ${selectedAntasLevel === antas.name ? 'edu-dropdown__item--active' : ''}`}
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

              <div className="edu-chart__container">
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
                      <linearGradient id="eduAreaFill" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor={getAntasColor(selectedAntasLevel)} stopOpacity={0.8} />
                        <stop offset="95%" stopColor={getAntasColor(selectedAntasLevel)} stopOpacity={0.1} />
                      </linearGradient>
                    </defs>
                    <Area
                      type="monotone"
                      dataKey="progress"
                      fill="url(#eduAreaFill)"
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


          {/* Bottom-left cell: Prescriptive Analytics */}
          <div className="edu-dashboard__grid-cell">
            <div className="edu-card edu-prescriptive-card">
              <h2 className="edu-card__title">Prescriptive Analytics Insights</h2>
              <div className="edu-prescriptive-accordion">
                {prescriptiveData.map((data, index) => (
                  <div
                    key={index}
                    className={`edu-accordion-item ${expandedAntas === data.antasLevel ? 'expanded' : ''}`}
                    style={{ borderLeft: `4px solid ${getAntasColor(data.antasLevel)}` }}
                  >
                    <div
                      className="edu-accordion-header"
                      onClick={() => toggleAntasExpand(data.antasLevel)}
                    >
                      <h3>{data.antasLevel} <span className="edu-student-count">({data.students} learners)</span></h3>
                      <span className="edu-expand-icon">{expandedAntas === data.antasLevel ? '−' : '+'}</span>
                    </div>

                    {expandedAntas === data.antasLevel && (
                      <div className="edu-accordion-content">
                        <div className="edu-issues-list">
                          {data.issues.map((issue, i) => (
                            <div key={i} className="edu-issue-item">
                              <span className="edu-issue-count">{issue.count}</span>
                              <span className="edu-issue-text">need help with "{issue.issue}"</span>
                            </div>
                          ))}
                        </div>

                        <div className="edu-intervention-section">
                          <p className="edu-intervention-text">{data.broadAnalysis}</p>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="edu-card edu-pending-card">
            <h2 className="edu-card__title">Parent Concerns & Activity Modifications</h2>
            <div className="edu-pending-tasks">
              {filteredPendingTasks.map((task) => (
                <div
                  key={task.id}
                  className="edu-task-item"
                  style={{
                    borderLeft: `4px solid ${task.status === 'Urgent' ? '#FF6B8A' :
                      task.status === 'Pending' ? '#FFCD56' : '#4BC0C0'
                      }`
                  }}
                >
                  <div className="edu-task-header">
                    <span className={`edu-status-indicator edu-status-${task.status.toLowerCase()}`}></span>
                    <span className="edu-task-type">{task.type}</span>
                    <span className="edu-task-date">{task.date}</span>
                  </div>
                  <div className="edu-task-details">
                    <div className="edu-student-info">
                      <p className="edu-student-name">{task.studentName}</p>
                      <span
                        className="edu-antas-badge edu-antas-badge-small"
                        style={{ backgroundColor: getAntasColor(task.antasLevel) }}
                      >
                        {task.antasLevel}
                      </span>
                    </div>
                    <button className="edu-action-button">{
                      task.type === 'Activity Modification' ? 'Review' : 'Respond'
                    }</button>
                  </div>
                </div>
              ))}
            </div>
          </div>


        </div>

        {/* Full-width Admin Approval Notifications */}
        <div className="edu-dashboard__full-width">
          <div className="edu-card edu-approval-card">
            <h2 className="edu-card__title">Admin Approval Notifications</h2>
            <div className="edu-approval-list">
              {notifications.map((notification, index) => (
                <div key={index} className="edu-notification-item">
                  <div className="edu-notification-status">
                    <span className={`edu-status-dot edu-status-${notification.status.toLowerCase()}`}></span>
                  </div>
                  <div className="edu-notification-content">
                    <p className="edu-notification-message">{notification.message}</p>
                    <span className="edu-notification-time">{notification.time}</span>
                  </div>
                  {notification.status === 'pending' && (
                    <button className="edu-track-button">Track</button>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Full-width Activity Log Below */}
        <div className="edu-dashboard__full-width">
          <div className="edu-card edu-activity-log-card">
            <h2 className="edu-card__title">Activity Log</h2>
            <div className="edu-activity-log">
              {activityLog.map((log, index) => (
                <div key={index} className="edu-log-item">
                  <div className="edu-log-time">{log.time}</div>
                  <div
                    className="edu-log-content"
                    dangerouslySetInnerHTML={{ __html: log.content }}
                  ></div>
                </div>
              ))}
            </div>
          </div>
        </div>

      </main>




      {/* Modal for Antas Level Details */}
      {isModalOpen && (
        <div className="edu-modal-overlay" onClick={closeModal}>
          <div className="edu-modal-content" onClick={e => e.stopPropagation()}>
            <div
              className="edu-modal-header"
              style={{ backgroundColor: getAntasColor(selectedAntasLevel) }}
            >
              <h2>{selectedAntasLevel} Details</h2>
              <button className="edu-modal-close" onClick={closeModal}>&times;</button>
            </div>

            {/* Modal Body */}


            <div className="edu-modal-body">
              {/* Stats */}
              <div className="edu-stats-section">
                <div className="edu-stat-block">
                  <h3>Students</h3>
                  <p className="edu-big-stat">
                    {studentsByAntasLevel.find(a => a.name === selectedAntasLevel)?.value || 0}
                  </p>
                </div>
                <div className="edu-stat-block">
                  <h3>Avg. Score</h3>
                  <p className="edu-big-stat">
                    {Math.round(
                      (progressData[selectedAntasLevel]?.week.reduce((sum, d) => sum + d.progress, 0) || 0) /
                      (progressData[selectedAntasLevel]?.week.length || 1)
                    )}%
                  </p>
                </div>
                <div className="edu-stat-block">
                  <h3>Activities</h3>
                  <p className="edu-big-stat">12</p>
                  <p className="edu-small-stat">8 completed</p>
                </div>
              </div>


              {/* Issues Tab */}

              <div className="edu-issues-left">

                <div className="edu-issues-section">
                  <h3 className="edu-section-heading">Top Issues for {selectedAntasLevel}</h3>
                  <div className="edu-issue-bars">
                    {prescriptiveData
                      .find(d => d.antasLevel === selectedAntasLevel)
                      ?.issues.map((issue, i) => {
                        const totalStudents = studentsByAntasLevel.find(a => a.name === selectedAntasLevel)?.value || 1;
                        const widthPercent = Math.min((issue.count / totalStudents) * 100, 100);

                        return (
                          <div key={i} className="edu-issue-bar-container">
                            <div className="edu-issue-name">{issue.issue}</div>
                            <div className="edu-issue-bar-wrapper">
                              <div
                                className="edu-issue-bar"
                                style={{
                                  width: `${widthPercent}%`,
                                  backgroundColor: getAntasColor(selectedAntasLevel),
                                }}
                              />
                              <span className="edu-issue-bar-label">{issue.count} student{issue.count > 1 ? 's' : ''}</span>
                            </div>
                          </div>
                        );
                      })}
                  </div>

                  <div className="edu-issues-right">

                    <div className="edu-prescriptive-summary">
                      <h4>Prescriptive Analysis</h4>
                      <p>
                        {prescriptiveData.find(d => d.antasLevel === selectedAntasLevel)?.broadAnalysis}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="edu-modal-footer">
              <button className="edu-modal-action-button" onClick={closeModal}>Close</button>
            </div>
          </div>
        </div>
      )}

      {/* Student Detail Modal */}
      {studentDetailOpen && selectedStudent && (
        <div className="edu-modal-overlay">
          <div className="edu-modal-content edu-student-modal" onClick={(e) => e.stopPropagation()}>
            <div
              className="edu-modal-header"
              style={{ backgroundColor: getAntasColor(selectedStudent.antasLevel) }}
            >
              <h2>{selectedStudent.name}</h2>
              <button className="edu-modal-close" onClick={closeStudentDetail}>&times;</button>
            </div>

            <div className="edu-modal-body">
              <div className="edu-student-info-summary">
                <div className="edu-student-info-section">
                  <h3>Performance Summary</h3>
                  <div className="edu-info-grid">
                    <div className="edu-info-item">
                      <span className="edu-info-label">Antas Level:</span>
                      <span className="edu-info-value">
                        <span
                          className="edu-antas-badge"
                          style={{ backgroundColor: getAntasColor(selectedStudent.antasLevel) }}
                        >
                          {selectedStudent.antasLevel}
                        </span>
                      </span>
                    </div>
                    <div className="edu-info-item">
                      <span className="edu-info-label">Last Activity:</span>
                      <span className="edu-info-value">{selectedStudent.lastActivity}</span>
                    </div>
                    <div className="edu-info-item">
                      <span className="edu-info-label">Completion Rate:</span>
                      <span className="edu-info-value">{selectedStudent.completionRate}%</span>
                    </div>
                    <div className="edu-info-item">
                      <span className="edu-info-label">Average Score:</span>
                      <span className="edu-info-value">{selectedStudent.lastScore}%</span>
                    </div>
                  </div>
                </div>

                <div className="edu-student-progress-section">
                  <h3>Areas Needing Improvement</h3>
                  <div className="edu-issues-list">
                    {prescriptiveData
                      .find(data => data.antasLevel === selectedStudent.antasLevel)?.issues
                      .slice(0, 2)
                      .map((issue, i) => (
                        <div key={i} className="edu-issue-item">
                          <span className="edu-issue-text">• {issue.issue}</span>
                        </div>
                      ))}
                  </div>
                </div>
              </div>

              <div className="edu-recent-activities">
                <h3>Recent Activities</h3>
                <div className="edu-activities-list">
                  <div className="edu-activity-record">
                    <div className="edu-activity-date">Apr 14, 2025</div>
                    <div className="edu-activity-name">Direksyong Pakaliwa-Pakanan</div>
                    <div className="edu-activity-score">62%</div>
                  </div>
                </div>
              </div>

              <div className="edu-modal-actions">
                <button
                  className="edu-primary-button"
                  onClick={closeStudentDetail}
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
