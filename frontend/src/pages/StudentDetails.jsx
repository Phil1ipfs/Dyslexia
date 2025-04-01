import React, { useState } from 'react';
import '../css/StudentDetails.css';
import { FaPaperPlane } from 'react-icons/fa';

const studentData = {
  name: 'Kit Nicholas T. Santiago',
  id: '03223123122',
  grade: 2,
  age: 8,
  parents: 'Maria & Jose Santiago',
  readingPerformance: 72,
  activitiesCompleted: 24,
  totalActivities: 30,
  lastActivity: 'Feb 28, 2025',
  aiUsage: {
    requests: 17,
    mostHelp: 'Syllable Patterns',
    lastUsed: 'March 2, 2025'
  },
  recentScores: {
    wordRecognition: 85,
    syllableStructures: 62,
    grammarTasks: 78
  },
  contact: '+63 912 345 6789',
  email: 'santiago_family@email.com',
  siblings: [
    {
      name: 'Julia Santiago',
      grade: 3,
      id: '03223123123',
      readingPerformance: 85
    }
  ]
};

const StudentDetails = () => {
  const [activeTab, setActiveTab] = useState('Progress');
  const [feedback, setFeedback] = useState('');

  const handleFeedbackSubmit = () => {
    alert(`Feedback sent: "${feedback}" to ${studentData.parents}`);
    setFeedback('');
  };

  return (
    <div className="student-details-container">
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

      {/* Info Section */}
      <div className="student-profile-box">
        <div className="student-avatar">KS</div>
        <div className="student-info">
          <h3>{studentData.name}</h3>
          <p>ID: {studentData.id}</p>
          <p>Grade: {studentData.grade} | Age: {studentData.age}</p>
          <p>Parents: {studentData.parents}</p>
        </div>
        <div className="reading-box">
          <strong>Reading Performance</strong>
          <div className="progress-bar">
            <div className="bar-fill" style={{ width: `${studentData.readingPerformance}%` }}></div>
          </div>
          <p>Activities Completed: {studentData.activitiesCompleted}/{studentData.totalActivities}</p>
          <p>Last Activity: {studentData.lastActivity}</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="student-tabs">
        {['Progress', 'Activities', 'Feedback History', 'Family'].map(tab => (
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
          <div className="progress-tab">
            <div className="progress-graph">📈 <strong>Monthly Progress</strong> (Chart Placeholder)</div>

            <div className="recent-activity">
              <strong>Recent Activity Performance</strong>
              <p>Word Recognition: <span className="green">85%</span></p>
              <p>Syllable Structures: <span className="orange">62%</span></p>
              <p>Grammar Tasks: <span className="green">78%</span></p>
            </div>

            <div className="ai-usage">
              <strong>AI Chatbot Usage</strong>
              <p>Assistance Requests: {studentData.aiUsage.requests} times</p>
              <p>Most Requested Help: {studentData.aiUsage.mostHelp}</p>
              <p>Last Used: {studentData.aiUsage.lastUsed}</p>
            </div>

            <div className="feedback-box">
              <strong>Send Feedback to Parents</strong>
              <textarea
                placeholder="Write feedback message..."
                value={feedback}
                onChange={(e) => setFeedback(e.target.value)}
              />
              <div className="send-footer">
                <span>To: {studentData.parents}</span>
                <button onClick={handleFeedbackSubmit}><FaPaperPlane /> Send</button>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'Family' && (
          <div className="family-tab">
            <div className="family-info">
              <strong>Family Information</strong>
              <p>Parents: {studentData.parents}</p>
              <p>Contact: {studentData.contact} | {studentData.email}</p>
            </div>

            <div className="siblings">
              <strong>Siblings</strong>
              {studentData.siblings.map((sibling, i) => (
                <div key={i} className="sibling-card">
                  <div className="sibling-avatar">{sibling.name.split(' ')[0][0]}{sibling.name.split(' ')[1]?.[0]}</div>
                  <div className="sibling-info">
                    <p><strong>{sibling.name}</strong></p>
                    <p>Grade: {sibling.grade} | ID: {sibling.id}</p>
                    <p>Reading Performance: {sibling.readingPerformance}%</p>
                  </div>
                  <button className="view-btn">View Details</button>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default StudentDetails;
