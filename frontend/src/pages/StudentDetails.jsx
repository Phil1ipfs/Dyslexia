import React, { useState } from 'react';
import '../css/StudentDetails.css';
import { FaPaperPlane } from 'react-icons/fa';
import { useLocation, useNavigate } from 'react-router-dom';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip,
  LineChart, Line, PieChart, Pie, Cell, ResponsiveContainer
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


  const renderChart = (chart) => {
    switch (chart.type) {
      case 'bar':
        return (
          <BarChart width={220} height={120} data={[{ name: 'Progress', value: parseInt(chart.desc.match(/\d+/)) }]}>
            <XAxis dataKey="name" hide />
            <YAxis />
            <Tooltip />
            <Bar dataKey="value" fill="#3B4F81" radius={[6, 6, 0, 0]} />
          </BarChart>
        );

      case 'line':
        return (
          <LineChart width={220} height={120} data={[
            { name: 'Start', value: parseInt(chart.desc.match(/\d+/)[0]) },
            { name: 'Now', value: parseInt(chart.desc.match(/\d+/)[1]) },
          ]}>
            <XAxis dataKey="name" />
            <YAxis />
            <Tooltip />
            <Line type="monotone" dataKey="value" stroke="#3B4F81" strokeWidth={2} />
          </LineChart>
        );

      case 'donut':
        const percent = parseInt(chart.desc.match(/\d+/));
        return (
          <PieChart width={220} height={120}>
            <Pie
              data={[
                { name: 'Completed', value: percent },
                { name: 'Remaining', value: 100 - percent },
              ]}
              cx="50%" cy="50%" innerRadius={35} outerRadius={50}
              fill="#3B4F81" paddingAngle={3} dataKey="value"
            >
              <Cell fill="#3B4F81" />
              <Cell fill="#ddd" />
            </Pie>
            <Tooltip />
          </PieChart>
        );

      default:
        return <div style={{ color: 'gray' }}>Chart Unavailable</div>;
    }
  };




  const location = useLocation();
  const navigate = useNavigate();

  const mockStudent = location.state?.student;

  if (!mockStudent) {
    return (
      <div className="student-details-container" style={{ marginLeft: '260px', padding: '2rem' }}>
        <h2>No student data found</h2>
        <p>Please access this page by clicking "View Details" from the View Student page.</p>
        <button onClick={() => navigate('/view-student')} className="view-btn">Back to Students</button>
      </div>
    );
  }

  const [activeTab, setActiveTab] = useState('Progress');

  return (
    <div className="student-details-container" style={{ marginLeft: '260px' }}>
      {/* Header */}
      <div className="student-details-header">
        <div className="header-left">
          <h2>Student Details</h2>
        </div>
        <div className="header-right">
          <div className="teacher-name">Cradle of Learners Inc.</div>
          <div className="teacher-avatar">TC</div>
        </div>
      </div>

      {/* Profile Box */}
      <div className="student-profile-box">
        <div className="student-avatar">KS</div>
        <div className="student-info">
          <h3>{mockStudent.name}</h3>
          <p>Age: {mockStudent.age}</p>
          <p>Reading Level: {mockStudent.readingLevel}</p>
          <p>Parents: {mockStudent.parent}</p>
        </div>
        <div className="reading-box">
          <strong>Reading Performance</strong>
          <div className="progress-bar">
            <div className="bar-fill" style={{ width: `${mockStudent.readingPerformance}%` }}></div>
          </div>
          <p>Activities Completed: {mockStudent.activitiesCompleted}/{mockStudent.totalActivities}</p>
          <p>Last Activity: {mockStudent.lastActivity}</p>
        </div>
      </div>

      {/* Tabs */}
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

      {/* Tab Content */}
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

            {/* Two-column grid: Recent Activity + Feedback */}
            <div className="progress-bottom-grid">
              <div className="recent-activities-box">
                <strong className="section-title">Recent Activity Performance</strong>
                {mockStudent.activities.map((activity, index) => (
                  <div key={index} className="activity-item">
                    <div className="activity-icon">📘</div>
                    <div className="activity-info">
                      <p className="activity-title">{activity.title}</p>
                      <p className="activity-meta">{activity.time} | Score:
                        <span className={`score-badge ${activity.score >= 80 ? 'green' : activity.score >= 70 ? 'yellow' : 'red'}`}>
                          {activity.score}%
                        </span>
                      </p>
                      <div className="progress-bar" style={{ marginTop: '0.4rem' }}>
                        <div
                          className="bar-fill"
                          style={{
                            width: `${activity.score}%`,
                            background: activity.score >= 80 ? '#2e7d32' : activity.score >= 70 ? '#e67e22' : '#c62828'
                          }}
                        ></div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Feedback Box */}
              <div className="feedback-box">
                <strong className="section-heading">Send Feedback to Parents</strong>

                {/* Text formatting controls */}
                <div className="feedback-toolbar">
                  <button onClick={() => document.execCommand('bold')}><strong>B</strong></button>
                  <button onClick={() => document.execCommand('italic')}><em>I</em></button>
                  <button onClick={() => document.execCommand('underline')}><u>U</u></button>
                  <button onClick={() => document.execCommand('insertUnorderedList')}>• List</button>
                  <button onClick={() => document.getElementById('feedbackInput').innerHTML = ''}>🧹 Clear</button>
                </div>

                {/* Editable feedback box */}
                <div
                  id="feedbackInput"
                  className="feedback-editor"
                  contentEditable
                  placeholder="Write feedback message..."
                ></div>

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


                  <button className="send-btn" onClick={() => {
                    const message = document.getElementById('feedbackInput').innerHTML;
                    alert(`Sending feedback to ${mockStudent.parent} at ${mockStudent.email}:\n\n${message}`);
                  }}>
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
      {activityCategories[mockStudent.readingLevel]?.label}
    </h3>

    <div className="activities-result-section">
      {activityCategories[mockStudent.readingLevel]?.categories.map((category, index) => {
        const activitiesInCategory = mockStudent.activities.filter(
          (activity) => activity.category === category
        );

        return (
          <div key={index} className="activity-category">
            <h4 className="category-title">{category}</h4>

            {activitiesInCategory.length > 0 ? (
              activitiesInCategory.map((activity, idx) => {
                const percent = Math.round((activity.score / activity.total) * 100);
                const barColor =
                  percent >= 80 ? '#2e7d32' : percent >= 60 ? '#e67e22' : '#c62828';

                const [expanded, setExpanded] = useState(false);

                return (
                  <div key={idx} className="activity-item-box">
                    <div className="activity-info-full">
                      <div className="activity-head">
                        <p className="activity-title">{activity.title}</p>
                        <p className="activity-score">
                          <strong>{activity.score}/{activity.total}</strong>
                        </p>
                      </div>
                      <p className="activity-time">{activity.time}</p>
                      <div className="progress-bar mt-1">
                        <div
                          className="bar-fill"
                          style={{
                            width: `${percent}%`,
                            backgroundColor: barColor
                          }}
                        ></div>
                      </div>

                      {/* Dropdown for question-level feedback */}
                      {activity.questions && (
                        <div className="activity-dropdown">
                          <button
                            className="dropdown-toggle"
                            onClick={() => setExpanded(!expanded)}
                          >
                            {expanded ? '▲ I-collapse ang mga Tanong' : '▼ Tingnan ang mga Tanong'}
                          </button>

                          {expanded && (
                            <ul className="question-list">
                              {activity.questions.map((q, i) => (
                                <li key={i} className={`question-item ${q.correct ? 'correct' : 'incorrect'}`}>
                                  <span className="question-text">{q.text}</span>
                                  <span className="question-result">{q.correct ? '✔ Tama' : '✘ Mali'}</span>
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
              <p className="no-activity">Walang nakatalang aktibidad sa kategoryang ito.</p>
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
              {mockStudent.feedbackHistory.map((fb, i) => (
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
                {/* Avatar */}
                <div className="family-avatar">
                  {mockStudent.parent.split(' ')[0][0]}&amp;
                </div>

                {/* Parent Details Grid */}
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
                mockStudent.siblings.map((sibling, i) => (
                  <div key={i} className="sibling-card">
                    <div className="sibling-avatar">
                      {sibling.name.split(' ')[0][0]}{sibling.name.split(' ')[1]?.[0]}
                    </div>
                    <div className="sibling-info">
                      <p><strong>{sibling.name}</strong></p>
                      <p>Grade: {sibling.grade} | ID: {sibling.id}</p>
                      <p>Age: {sibling.age} | Reading Level: {sibling.readingLevel}</p>
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
  );
};

export default StudentDetails;
