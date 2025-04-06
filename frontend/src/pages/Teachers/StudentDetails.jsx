// src/pages/Teachers/StudentDetails.jsx
import React, { useState } from 'react';
import '../../css/Teachers/StudentDetails.css';
import { FaPaperPlane } from 'react-icons/fa';
import { useLocation, useNavigate } from 'react-router-dom';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip,
  LineChart, Line, PieChart, Pie, Cell, Area,
  CartesianGrid, ReferenceLine, ResponsiveContainer
} from 'recharts';

const activityCategories = {
  A: {
    label: 'Panimulang Pagbasa (Emergent Reader)',
    categories: ['Alpabeto at Tunog', 'Pagkilala ng Larawan', 'Pakikinig sa Kwento']
  },
  B: {
    label: 'Maagang Yugto ng Pagbasa (Early Reader)',
    categories: ['Sight Words', 'Simpleng Pangungusap', 'Kwento ng Pamilya']
  },
  C: {
    label: 'Nagpapaunlad na Yugto (Developing Reader)',
    categories: ['Pangunahing Ideya', 'Detalye ng Talata', 'Paggamit ng Konteksto']
  },
  D: {
    label: 'Malayang Pagbasa (Fluent Reader)',
    categories: ['Paglalagom', 'Paghinuha', 'Pagkasunod-sunod ng Kwento']
  },
  E: {
    label: 'Mahusay na Mambabasa (Proficient Reader)',
    categories: ['Kritikal na Pagsusuri', 'Layunin ng May-akda', 'Tekstong Impormatibo']
  }
};

const StudentDetails = () => {
  const [expandedItems, setExpandedItems] = useState({});
  const [localFeedback, setLocalFeedback] = useState([]);
  const [activeTab, setActiveTab] = useState('Progress');
  const location = useLocation();
  const navigate = useNavigate();
  const mockStudent = location.state?.student;

  // If no student data is found, show an error message and a button to go back.
  if (!mockStudent) {
    return (
      <div className="student-details-container">
        <h2>No student data found</h2>
        <p>Please access this page by clicking "View Details" from the View Student page.</p>
        <button onClick={() => navigate('/teacher/view-student')} className="view-btn">
          Back to Students
        </button>
      </div>
    );
  }

  const combinedFeedback = [...(mockStudent.feedbackHistory || []), ...localFeedback];

  const renderChart = (chart) => {
    switch (chart.type) {
      case 'bar': {
        const match = chart.desc.match(/\d+/);
        const barValue = match ? parseInt(match[0], 10) : 0;
        return (
          <BarChart width={220} height={120} data={[{ name: 'Progress', value: barValue }]}>
            <XAxis dataKey="name" hide />
            <YAxis />
            <Tooltip />
            <Bar dataKey="value" fill="#3B4F81" radius={[6, 6, 0, 0]} />
          </BarChart>
        );
      }
      case 'line': {
        const lineMatches = chart.desc.match(/\d+/g);
        if (!lineMatches || lineMatches.length < 2) {
          return <p style={{ fontStyle: 'italic', color: '#999' }}>No numeric data provided.</p>;
        }
        return (
          <LineChart
            width={220}
            height={120}
            data={[
              { name: 'Start', value: parseInt(lineMatches[0]) },
              { name: 'Now', value: parseInt(lineMatches[1]) }
            ]}
          >
            <XAxis dataKey="name" />
            <YAxis />
            <Tooltip />
            <Line type="monotone" dataKey="value" stroke="#3B4F81" strokeWidth={2} />
          </LineChart>
        );
      }
      case 'donut': {
        const match = chart.desc.match(/\d+/);
        const percent = match ? parseInt(match[0], 10) : 0;
        return (
          <PieChart width={220} height={120}>
            <Pie
              data={[
                { name: 'Completed', value: percent },
                { name: 'Remaining', value: 100 - percent },
              ]}
              cx="50%"
              cy="50%"
              innerRadius={35}
              outerRadius={50}
              dataKey="value"
            >
              <Cell fill="#3B4F81" />
              <Cell fill="#ddd" />
            </Pie>
            <Tooltip />
          </PieChart>
        );
      }
      default:
        return <div style={{ color: 'gray' }}>Chart Unavailable</div>;
    }
  };

  const sendFeedback = () => {
    const message = document.getElementById('feedbackInput').innerHTML.trim();
    if (!message) {
      alert('Please enter feedback before sending.');
      return;
    }
    const newFeedback = {
      date: new Date().toLocaleDateString('en-PH', { month: 'short', day: 'numeric', year: 'numeric' }),
      message
    };
    setLocalFeedback(prev => [...prev, newFeedback]);
    alert(`Sending feedback to ${mockStudent.parent} at ${mockStudent.email}:\n\n${message}`);
    document.getElementById('feedbackInput').innerHTML = '';
  };

  const studentInitials = mockStudent.name
    .split(' ')
    .map(part => part[0])
    .join('')
    .toUpperCase();

  return (
    <>
      <div className="student-details-container">
        <div className="student-details-header">
          <div className="header-left">
            <button onClick={() => navigate('/teacher/view-student')} className="view-btn">
              ←
            </button>
            <h2>Student Details</h2>
          </div>
          <div className="header-right">
            <div className="teacher-name">Cradle of Learners Inc.</div>
            <div className="teacher-avatar">TC</div>
          </div>
        </div>
  
        <div className="student-profile-box">
          <div className="student-avatar">{studentInitials}</div>
          <div className="student-info">
            <h3>{mockStudent.name}</h3>
            <p>Age: {mockStudent.age}</p>
            <p>Reading Level: {mockStudent.readingLevel}</p>
            <p>Parent(s): {mockStudent.parent}</p>
          </div>
          <div className="reading-box">
            <strong>Reading Performance</strong>
            <div className="progress-bar">
              <div
                className="bar-fill"
                style={{ width: `${mockStudent.readingPerformance}%` }}
              />
            </div>
            <p>
              Activities Completed: {mockStudent.activitiesCompleted}/{mockStudent.totalActivities}
            </p>
            <p>Last Activity: {mockStudent.lastActivity}</p>
          </div>
        </div>
  
        <div className="student-tabs">
          {['Progress', 'Activities Result', 'Feedback History', 'Family'].map(tab => (
            <button
              key={tab}
              className={`tab-btn ${activeTab === tab ? 'active' : ''}`}
              onClick={() => setActiveTab(tab)}
            >
              {tab}
            </button>
          ))}
        </div>
  
        <div className="tab-content">
          {activeTab === 'Progress' && (
            <>
              <h3>Reading Progress Overview</h3>
              <div className="progress-overview-grid">
                {mockStudent.progressCharts.map((chart, i) => (
                  <div key={i} className="progress-card">
                    <strong className="chart-title">{chart.title}</strong>
                    <div className="real-chart">{renderChart(chart)}</div>
                    <p className="chart-desc">{chart.desc}</p>
                  </div>
                ))}
              </div>
              <div className="recommendations-container">
                <h4>Prescriptive Recommendations</h4>
                <ul>
                  <li>Practice letter-sound associations daily</li>
                  <li>Short reading drills after class</li>
                  <li>Encourage reading simple stories at home</li>
                </ul>
              </div>
              <div className="progress-bottom-grid">
                <div className="recent-activities-box">
                  <strong className="section-title">Recent Activity Performance</strong>
                  {mockStudent.activities.map((activity, index) => {
                    const percentScore = Math.round((activity.score / activity.total) * 100);
                    return (
                      <div key={index} className="activity-item">
                        <div className="activity-icon">📘</div>
                        <div className="activity-info">
                          <p className="activity-title">{activity.title}</p>
                          <p className="activity-meta">
                            {activity.time} | Score:
                            <span
                              className={`score-badge ${
                                percentScore >= 80 ? 'green'
                                : percentScore >= 70 ? 'yellow'
                                : 'red'
                              }`}
                            >
                              {percentScore}%
                            </span>
                          </p>
                          <div className="progress-bar">
                            <div
                              className="bar-fill"
                              style={{
                                width: `${percentScore}%`,
                                background:
                                  percentScore >= 80 ? '#2e7d32'
                                  : percentScore >= 70 ? '#e67e22'
                                  : '#c62828'
                              }}
                            ></div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
                <div className="feedback-box">
                  <strong className="section-heading">Send Feedback to Parents</strong>
                  <div className="feedback-toolbar">
                    <button onClick={() => document.execCommand('bold')}><strong>B</strong></button>
                    <button onClick={() => document.execCommand('italic')}><em>I</em></button>
                    <button onClick={() => document.execCommand('underline')}><u>U</u></button>
                    <button onClick={() => document.execCommand('insertUnorderedList')}>• List</button>
                    <button onClick={() => (document.getElementById('feedbackInput').innerHTML = '')}>🧹 Clear</button>
                  </div>
                  <div
                    id="feedbackInput"
                    className="feedback-editor"
                    contentEditable
                    placeholder="Write feedback message..."
                  />
                  <div className="send-footer">
                    <div className="recipient-box">
                      <div className="recipient-details">
                        <div className="recipient-line">
                          <span className="label">To:</span>
                          <span className="value">{mockStudent.parent}</span>
                        </div>
                        <div className="recipient-line">
                          <span className="label">Email:</span>
                          <span className="value">{mockStudent.email}</span>
                        </div>
                      </div>
                    </div>
                    <button className="send-btn" onClick={sendFeedback}>
                      <FaPaperPlane /> Send
                    </button>
                  </div>
                </div>
              </div>
            </>
          )}
          {activeTab === 'Activities Result' && (
            <>
              <h3 className="activity-header">
                {activityCategories[mockStudent.readingLevel]?.label || 'Reading Category'}
              </h3>
              <div className="activities-result-section">
                {activityCategories[mockStudent.readingLevel]?.categories.map((cat, catIndex) => {
                  const activitiesInCategory = mockStudent.activities.filter(
                    act => act.category === cat
                  );
                  return (
                    <div key={catIndex} className="activity-category">
                      <h4 className="category-title">{cat}</h4>
                      {activitiesInCategory.length > 0 ? (
                        activitiesInCategory.map((act, idx) => {
                          const percent = Math.round((act.score / act.total) * 100);
                          const barColor =
                            percent >= 80 ? '#2e7d32'
                            : percent >= 60 ? '#e67e22'
                            : '#c62828';
                          const dropdownKey = `${cat}-${idx}`;
                          const isExpanded = expandedItems[dropdownKey] || false;
                          return (
                            <div key={idx} className="activity-item-box">
                              <div className="activity-info-full">
                                <div className="activity-head">
                                  <p className="activity-title">{act.title}</p>
                                  <p className="activity-score">
                                    <strong>{act.score}/{act.total}</strong>
                                  </p>
                                </div>
                                <p className="activity-time">{act.time}</p>
                                <div className="progress-bar mt-1">
                                  <div
                                    className="bar-fill"
                                    style={{ width: `${percent}%`, backgroundColor: barColor }}
                                  />
                                </div>
                                {act.questions && (
                                  <div className="activity-dropdown">
                                    <button
                                      className="dropdown-toggle"
                                      onClick={() => {
                                        setExpandedItems(prev => ({
                                          ...prev,
                                          [dropdownKey]: !isExpanded
                                        }));
                                      }}
                                    >
                                      {isExpanded ? '▲ Collapse Questions' : '▼ Show Questions'}
                                    </button>
                                    {isExpanded && (
                                      <ul className="question-list">
                                        {act.questions.map((q, i) => (
                                          <li key={i} className={`question-item ${q.correct ? 'correct' : 'incorrect'}`}>
                                            <span className="question-text">{q.text}</span>
                                            <span className="question-result">
                                              {q.correct ? '✔ Correct' : '✘ Incorrect'}
                                            </span>
                                          </li>
                                        ))}
                                      </ul>
                                    )}
                                  </div>
                                )}
                              </div>
                            </div>
                          );
                        })
                      ) : (
                        <p className="no-activity">No activities listed for this category.</p>
                      )}
                    </div>
                  );
                })}
              </div>
            </>
          )}
          {activeTab === 'Feedback History' && (
            <>
              <h3>Feedback History</h3>
              <ul className="feedback-history">
                {combinedFeedback.map((fb, i) => (
                  <li key={i}>
                    <strong>{fb.date}</strong>
                    <p>{fb.message}</p>
                  </li>
                ))}
              </ul>
            </>
          )}
          {activeTab === 'Family' && (
            <div className="family-tab">
              <strong>Family Information</strong>
              <div className="family-info-card">
                <div className="family-grid">
                  <div className="family-avatar">
                    {mockStudent.parent.split(' ').map(word => word[0]).join('').toUpperCase()}
                  </div>
                  <div className="family-grid-details">
                    <div className="info-pair">
                      <p><strong>Parents:</strong> {mockStudent.parent}</p>
                      <p><strong>Contact:</strong> {mockStudent.contact}</p>
                    </div>
                    <div className="info-pair">
                      <p><strong>Email:</strong> {mockStudent.email}</p>
                    </div>
                  </div>
                </div>
              </div>
              <div className="siblings">
                <strong>Siblings</strong>
                {mockStudent.siblings && mockStudent.siblings.length > 0 ? (
                  mockStudent.siblings.map((sib, i) => (
                    <div key={i} className="sibling-card">
                      <div className="sibling-avatar">
                        {sib.name.split(' ').map(w => w[0]).join('').toUpperCase()}
                      </div>
                      <div className="sibling-info">
                        <p><strong>{sib.name}</strong></p>
                        <p>Grade: {sib.grade} | ID: {sib.id}</p>
                        <p>Age: {sib.age} | Reading Level: {sib.readingLevel}</p>
                      </div>
                      <button className="view-btn">View Details</button>
                    </div>
                  ))
                ) : (
                  <p className="no-siblings">No siblings listed for this student.</p>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
};

export default StudentDetails;
