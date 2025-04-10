// src/pages/Teachers/StudentDetails.jsx
import React, { useState } from 'react';
import { FaPaperPlane, FaUser, FaEnvelope, FaPhone, FaCalendarAlt, FaBook, FaHome, FaUsers } from 'react-icons/fa';
import { useLocation, useNavigate } from 'react-router-dom';
import '../../css/Teachers/StudentDetails.css';

/* ====================================================
   Sub-Components
   ==================================================== */

// Header component
const StudentHeader = ({ onBack, teacherName, teacherAvatar }) => (
  <div className="std-header">
    <div className="std-header-left">
      <button onClick={onBack} className="std-back-btn">
        <span>←</span>
      </button>
      <h2>Student Details</h2>
    </div>
    <div className="std-header-right">
      <div className="std-teacher-name">{teacherName}</div>
      <div className="std-teacher-avatar">{teacherAvatar}</div>
    </div>
  </div>
);

// Student Profile Card Component
const StudentProfileCard = ({ student }) => {
  const studentInitials = student.name
    .split(' ')
    .map(part => part[0])
    .join('')
    .toUpperCase();

  return (
    <div className="std-profile-container">
      <div className="std-profile-header">
        <h3>Personal Information</h3>
      </div>
      
      <div className="std-profile-content">
        <div className="std-avatar-section">
          <div className="std-student-avatar">{studentInitials}</div>
          <h2 className="std-student-name">{student.name}</h2>
          <span className="std-student-id">ID: {student.id || 'STD-' + Math.floor(1000 + Math.random() * 9000)}</span>
        </div>
        
        <div className="std-info-section">
          <div className="std-info-row">
            <div className="std-info-item">
              <div className="std-info-icon">
                <FaCalendarAlt />
              </div>
              <div className="std-info-content">
                <span className="std-info-label">Age</span>
                <span className="std-info-value">{student.age} years old</span>
              </div>
            </div>
            
            <div className="std-info-item">
              <div className="std-info-icon">
                <FaBook />
              </div>
              <div className="std-info-content">
                <span className="std-info-label">Reading Level</span>
                <span className="std-info-value">{student.readingLevel}</span>
              </div>
            </div>
          </div>
          
          <div className="std-info-row">
            <div className="std-info-item">
              <div className="std-info-icon">
                <FaHome />
              </div>
              <div className="std-info-content">
                <span className="std-info-label">Address</span>
                <span className="std-info-value">{student.address || 'Not provided'}</span>
              </div>
            </div>
            
            <div className="std-info-item">
              <div className="std-info-icon">
                <FaUsers />
              </div>
              <div className="std-info-content">
                <span className="std-info-label">Class/Section</span>
                <span className="std-info-value">{student.classSection || 'Not assigned'}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// Tab buttons component
const StudentTabs = ({ activeTab, setActiveTab }) => {
  const tabs = ['Family Information', 'Feedback History'];
  
  return (
    <div className="std-tabs">
      {tabs.map(tab => (
        <button
          key={tab}
          className={`std-tab-btn ${activeTab === tab ? 'active' : ''}`}
          onClick={() => setActiveTab(tab)}
        >
          {tab}
        </button>
      ))}
    </div>
  );
};

// Family Information Tab component
const FamilyTab = ({ student }) => {
  const parentInitials = student.parent
    ? student.parent.split(' ').map(word => word[0]).join('').toUpperCase()
    : 'P';
    
  return (
    <div className="std-family-tab">
      <div className="std-parent-section">
        <h3 className="std-section-title">Parent Information</h3>
        <div className="std-parent-card">
          <div className="std-parent-avatar">{parentInitials}</div>
          <div className="std-parent-details">
            <div className="std-parent-info-grid">
              <div className="std-parent-info-item">
                <div className="std-info-icon"><FaUser /></div>
                <div className="std-info-content">
                  <span className="std-info-label">Name</span>
                  <span className="std-info-value">{student.parent}</span>
                </div>
              </div>
              
              <div className="std-parent-info-item">
                <div className="std-info-icon"><FaPhone /></div>
                <div className="std-info-content">
                  <span className="std-info-label">Contact</span>
                  <span className="std-info-value">{student.contact}</span>
                </div>
              </div>
              
              <div className="std-parent-info-item">
                <div className="std-info-icon"><FaEnvelope /></div>
                <div className="std-info-content">
                  <span className="std-info-label">Email</span>
                  <span className="std-info-value">{student.email}</span>
                </div>
              </div>
              
              <div className="std-parent-info-item">
                <div className="std-info-icon"><FaHome /></div>
                <div className="std-info-content">
                  <span className="std-info-label">Address</span>
                  <span className="std-info-value">{student.address || 'Same as student'}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      <div className="std-siblings-section">
        <h3 className="std-section-title">Siblings</h3>
        {student.siblings && student.siblings.length > 0 ? (
          <div className="std-siblings-list">
            {student.siblings.map((sib, i) => {
              const sibInitials = sib.name.split(' ').map(w => w[0]).join('').toUpperCase();
              return (
                <div key={i} className="std-sibling-card">
                  <div className="std-sibling-avatar">{sibInitials}</div>
                  <div className="std-sibling-info">
                    <p className="std-sibling-name">{sib.name}</p>
                    <div className="std-sibling-details">
                      <span>Grade: {sib.grade}</span>
                      <span>Age: {sib.age}</span>
                      <span>Reading Level: {sib.readingLevel}</span>
                      <span>ID: {sib.id}</span>
                    </div>
                  </div>
                  <button className="std-view-sibling-btn">View</button>
                </div>
              );
            })}
          </div>
        ) : (
          <p className="std-no-siblings">No siblings registered in the system.</p>
        )}
      </div>
    </div>
  );
};

// Feedback Tab components
const FeedbackHistoryItem = ({ feedback }) => (
  <div className="std-feedback-item">
    <div className="std-feedback-item-header">
      <span className="std-feedback-date">{feedback.date}</span>
      <span className={`std-feedback-type ${feedback.type || 'general'}`}>
        {feedback.type || 'General'}
      </span>
    </div>
    <div className="std-feedback-content">
      {feedback.message}
    </div>
    <div className="std-feedback-meta">
      <span className="std-feedback-sender">Sent by: {feedback.sender || 'Teacher'}</span>
      {feedback.response && (
        <div className="std-feedback-response">
          <strong>Parent Response:</strong> {feedback.response}
        </div>
      )}
    </div>
  </div>
);

const FeedbackBox = ({ student }) => {
  const [feedbackType, setFeedbackType] = useState('academic');
  const [localFeedback, setLocalFeedback] = useState([]);
  
  const sendFeedback = () => {
    const feedbackElement = document.getElementById('std-feedbackInput');
    const message = feedbackElement.innerHTML.trim();
    
    if (!message) {
      alert('Please enter feedback before sending.');
      return;
    }
    
    const newFeedback = {
      date: new Date().toLocaleDateString('en-PH', { 
        month: 'short', 
        day: 'numeric', 
        year: 'numeric' 
      }),
      type: feedbackType,
      message,
      sender: 'Teacher'
    };
    
    setLocalFeedback(prev => [...prev, newFeedback]);
    alert(`Sending feedback to ${student.parent} at ${student.email}:\n\n${message}`);
    feedbackElement.innerHTML = '';
  };
  
  return (
    <div className="std-feedback-box">
      <h3 className="std-section-title">Send Feedback</h3>
      
      <div className="std-feedback-type-selector">
        <span className="std-feedback-type-label">Feedback type:</span>
        <div className="std-feedback-type-options">
          <button 
            className={`std-feedback-type-btn ${feedbackType === 'academic' ? 'active' : ''}`}
            onClick={() => setFeedbackType('academic')}
          >
            Academic
          </button>
          <button 
            className={`std-feedback-type-btn ${feedbackType === 'behavioral' ? 'active' : ''}`}
            onClick={() => setFeedbackType('behavioral')}
          >
            Behavioral
          </button>
          <button 
            className={`std-feedback-type-btn ${feedbackType === 'concern' ? 'active' : ''}`}
            onClick={() => setFeedbackType('concern')}
          >
            Concern
          </button>
          <button 
            className={`std-feedback-type-btn ${feedbackType === 'positive' ? 'active' : ''}`}
            onClick={() => setFeedbackType('positive')}
          >
            Positive
          </button>
        </div>
      </div>
      
      <div className="std-feedback-toolbar">
        <button onClick={() => document.execCommand('bold')}><strong>B</strong></button>
        <button onClick={() => document.execCommand('italic')}><em>I</em></button>
        <button onClick={() => document.execCommand('underline')}><u>U</u></button>
        <button onClick={() => document.execCommand('insertUnorderedList')}>• List</button>
        <button onClick={() => (document.getElementById('std-feedbackInput').innerHTML = '')}>Clear</button>
      </div>
      
      <div
        id="std-feedbackInput"
        className="std-feedback-editor"
        contentEditable
        placeholder="Write feedback message to parent..."
      />
      
      <div className="std-send-footer">
        <div className="std-recipient-box">
          <div className="std-recipient-avatar">{student.parent ? student.parent[0] : 'P'}</div>
          <div className="std-recipient-details">
            <div className="std-recipient-name">{student.parent}</div>
            <div className="std-recipient-email">{student.email}</div>
          </div>
        </div>
        <button className="std-send-btn" onClick={sendFeedback}>
          <FaPaperPlane /> Send Feedback
        </button>
      </div>
    </div>
  );
};

const FeedbackHistory = ({ localFeedback, studentFeedback = [] }) => {
  const combinedFeedback = [...studentFeedback, ...localFeedback];
  
  // Group feedback by month
  const groupedFeedback = combinedFeedback.reduce((groups, item) => {
    const date = new Date(item.date);
    const month = date.toLocaleString('default', { month: 'long', year: 'numeric' });
    
    if (!groups[month]) {
      groups[month] = [];
    }
    
    groups[month].push(item);
    return groups;
  }, {});
  
  return (
    <div className="std-feedback-history-container">
      <h3 className="std-section-title">Feedback History</h3>
      
      {Object.keys(groupedFeedback).length > 0 ? (
        Object.entries(groupedFeedback).map(([month, feedbacks]) => (
          <div key={month} className="std-feedback-month-group">
            <h4 className="std-feedback-month-title">{month}</h4>
            <div className="std-feedback-items">
              {feedbacks.map((feedback, index) => (
                <FeedbackHistoryItem key={index} feedback={feedback} />
              ))}
            </div>
          </div>
        ))
      ) : (
        <div className="std-no-feedback">
          <p>No feedback history available for this student.</p>
        </div>
      )}
    </div>
  );
};

const FeedbackTab = ({ student }) => {
  const [localFeedback, setLocalFeedback] = useState([]);
  
  return (
    <div className="std-feedback-tab">
      <FeedbackBox student={student} setLocalFeedback={setLocalFeedback} />
      <FeedbackHistory 
        localFeedback={localFeedback} 
        studentFeedback={student.feedbackHistory} 
      />
    </div>
  );
};

/* ====================================================
   Main Component: StudentDetails
   ==================================================== */
const StudentDetails = () => {
  const [activeTab, setActiveTab] = useState('Family Information');
  const location = useLocation();
  const navigate = useNavigate();
  const student = location.state?.student;

  // If no student data is found, return an error view
  if (!student) {
    return (
      <div className="std-container">
        <h2>No student data found</h2>
        <p>Please access this page by clicking "View Details" from the Students page.</p>
        <button onClick={() => navigate('/teacher/view-student')} className="std-back-btn">
          Back to Students
        </button>
      </div>
    );
  }

  return (
    <div className="std-container">
      <StudentHeader
        onBack={() => navigate('/teacher/view-student')}
        teacherName="Cradle of Learners Inc."
        teacherAvatar="TC"
      />
      
      <StudentProfileCard student={student} />
      
      <StudentTabs activeTab={activeTab} setActiveTab={setActiveTab} />
      
      <div className="std-tab-content">
        {activeTab === 'Family Information' && <FamilyTab student={student} />}
        {activeTab === 'Feedback History' && <FeedbackTab student={student} />}
      </div>
    </div>
  );
};

export default StudentDetails;