// src/pages/Teachers/StudentDetails.jsx
import React, { useState, useRef } from 'react';
import { 
  FaPaperPlane, FaUser, FaEnvelope, FaPhone, FaCalendarAlt, 
  FaBook, FaHome, FaUsers, FaFileAlt, FaDownload, FaTimesCircle,
  FaGraduationCap, FaIdCard, FaBirthdayCake, FaMapMarkerAlt,
  FaUserFriends, FaHandPaper, FaSchool, FaBell
} from 'react-icons/fa';
import { useLocation, useNavigate } from 'react-router-dom';
import '../../css/Teachers/StudentDetails.css';

/* ====================================================
   Sub-Components
   ==================================================== */

// Header component
const StudentHeader = ({ onBack, schoolName, teacherAvatar }) => (
  <div className="std-header">
    <div className="std-header-left">
      <button onClick={onBack} className="std-back-btn">
        <span>←</span>
      </button>
      <h2>Student Details</h2>
    </div>
    <div className="std-header-right">
      <div className="std-school-name">{schoolName}</div>
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
          <span className="std-student-id">
            <FaIdCard className="std-id-icon" /> 
            ID: {student.id || 'STD-' + Math.floor(1000 + Math.random() * 9000)}
          </span>
        </div>
        
        <div className="std-info-section">
          <div className="std-info-row">
            <div className="std-info-item">
              <div className="std-info-icon">
                <FaBirthdayCake />
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
                <FaMapMarkerAlt />
              </div>
              <div className="std-info-content">
                <span className="std-info-label">Address</span>
                <span className="std-info-value">{student.address || 'Not provided'}</span>
              </div>
            </div>
            
            <div className="std-info-item">
              <div className="std-info-icon">
                <FaSchool />
              </div>
              <div className="std-info-content">
                <span className="std-info-label">Class/Section</span>
                <span className="std-info-value">{student.classSection || 'Not assigned'}</span>
              </div>
            </div>
          </div>
          
          <div className="std-info-row">
            <div className="std-info-item">
              <div className="std-info-icon">
                <FaGraduationCap />
              </div>
              <div className="std-info-content">
                <span className="std-info-label">Grade Level</span>
                <span className="std-info-value">{student.gradeLevel || 'Not assigned'}</span>
              </div>
            </div>
            
            <div className="std-info-item">
              <div className="std-info-icon">
                <FaUserFriends />
              </div>
              <div className="std-info-content">
                <span className="std-info-label">Guardian Type</span>
                <span className="std-info-value">{student.guardianType || 'Parent'}</span>
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
                  <span className="std-info-value">{student.parent || 'Not provided'}</span>
                </div>
              </div>
              
              <div className="std-parent-info-item">
                <div className="std-info-icon"><FaPhone /></div>
                <div className="std-info-content">
                  <span className="std-info-label">Contact</span>
                  <span className="std-info-value">{student.contact || 'Not provided'}</span>
                </div>
              </div>
              
              <div className="std-parent-info-item">
                <div className="std-info-icon"><FaEnvelope /></div>
                <div className="std-info-content">
                  <span className="std-info-label">Email</span>
                  <span className="std-info-value">{student.email || 'Not provided'}</span>
                </div>
              </div>
              
              <div className="std-parent-info-item">
                <div className="std-info-icon"><FaMapMarkerAlt /></div>
                <div className="std-info-content">
                  <span className="std-info-label">Address</span>
                  <span className="std-info-value">{student.address || 'Same as student'}</span>
                </div>
              </div>
              
              <div className="std-parent-info-item">
                <div className="std-info-icon"><FaHandPaper /></div>
                <div className="std-info-content">
                  <span className="std-info-label">Relationship</span>
                  <span className="std-info-value">{student.relationship || 'Parent'}</span>
                </div>
              </div>
              
              <div className="std-parent-info-item">
                <div className="std-info-icon"><FaBell /></div>
                <div className="std-info-content">
                  <span className="std-info-label">Notification Preference</span>
                  <span className="std-info-value">{student.notificationPreference || 'Email & SMS'}</span>
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
                      <span><FaGraduationCap /> Grade: {sib.grade || 'N/A'}</span>
                      <span><FaBirthdayCake /> Age: {sib.age || 'N/A'}</span>
                      <span><FaBook /> Reading Level: {sib.readingLevel || 'N/A'}</span>
                      <span><FaIdCard /> ID: {sib.id || 'N/A'}</span>
                    </div>
                  </div>
                  <button className="std-view-sibling-btn">View Details</button>
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
const FeedbackTypeFilter = ({ activeFilter, setActiveFilter }) => {
  const filters = ['All', 'Academic', 'Behavioral', 'Concern', 'Positive', 'Reports'];
  
  return (
    <div className="std-feedback-filters">
      {filters.map(filter => (
        <button
          key={filter}
          className={`std-filter-btn ${activeFilter === filter ? 'active' : ''}`}
          onClick={() => setActiveFilter(filter)}
        >
          {filter}
        </button>
      ))}
    </div>
  );
};

const FeedbackHistoryItem = ({ feedback }) => {
  const [expanded, setExpanded] = useState(false);
  
  // Extract initials for avatar
  const senderInitials = feedback.sender
    ? feedback.sender.split(' ').map(word => word[0]).join('').toUpperCase()
    : 'T';
  
  // Determine sender type for styling
  const isFromParent = feedback.senderType === 'parent';
  
  return (
    <div className={`std-feedback-item ${isFromParent ? 'parent-feedback' : ''}`}>
      <div className="std-feedback-item-header">
        <div className="std-feedback-sender-info">
          <div className={`std-feedback-avatar ${isFromParent ? 'parent-avatar' : 'teacher-avatar'}`}>
            {senderInitials}
          </div>
          <div className="std-feedback-sender-details">
            <span className="std-feedback-sender-name">{feedback.sender}</span>
            <span className="std-feedback-date">{feedback.date}</span>
          </div>
        </div>
        <span className={`std-feedback-type ${feedback.subject.toLowerCase()}`}>
          {feedback.subject}
        </span>
      </div>
      
      <div className={`std-feedback-content ${expanded ? 'expanded' : ''}`}>
        {feedback.message}
        {!expanded && feedback.message.length > 150 && (
          <button 
            className="std-feedback-expand-btn"
            onClick={() => setExpanded(true)}
          >
            Read more
          </button>
        )}
      </div>
      
      {feedback.hasReport && (
        <div className="std-feedback-report">
          <FaFileAlt className="std-report-icon" />
          <span className="std-report-label">Progress Report</span>
          <button className="std-download-report-btn">
            <FaDownload /> Download
          </button>
        </div>
      )}
      
      {feedback.response && (
        <div className="std-feedback-response">
          <div className="std-response-header">
            <span className="std-response-label">Reply:</span>
            <span className="std-response-date">{feedback.responseDate}</span>
          </div>
          <div className="std-response-content">
            {feedback.response}
          </div>
        </div>
      )}
    </div>
  );
};

// Dialog component for progress report preview
const ReportPreviewDialog = ({ isOpen, onClose, report, onSend, student }) => {
  if (!isOpen) return null;
  
  return (
    <div className="std-dialog-overlay">
      <div className="std-report-preview-dialog">
        <div className="std-dialog-header">
          <h3>Progress Report Preview</h3>
          <button className="std-dialog-close-btn" onClick={onClose}>
            <FaTimesCircle />
          </button>
        </div>
        
        <div className="std-dialog-content">
          <div className="std-report-preview">
            <div className="std-report-header">
              <div className="std-report-school">Cradle of Learners Inc.</div>
              <div className="std-report-title">Student Progress Report</div>
              <div className="std-report-date">Generated on: {new Date().toLocaleDateString()}</div>
            </div>
            
            <div className="std-report-student-info">
              <div className="std-report-field">
                <span className="std-report-label">Student Name:</span>
                <span className="std-report-value">{student.name}</span>
              </div>
              <div className="std-report-field">
                <span className="std-report-label">ID:</span>
                <span className="std-report-value">{student.id}</span>
              </div>
              <div className="std-report-field">
                <span className="std-report-label">Grade/Class:</span>
                <span className="std-report-value">{student.classSection}</span>
              </div>
              <div className="std-report-field">
                <span className="std-report-label">Report Period:</span>
                <span className="std-report-value">{report.period}</span>
              </div>
            </div>
            
            <div className="std-report-section">
              <h4>Academic Performance</h4>
              {report.academics.map((item, index) => (
                <div key={index} className="std-report-performance-item">
                  <div className="std-report-subject">{item.subject}</div>
                  <div className="std-report-grade">{item.grade}</div>
                  <div className="std-report-comment">{item.comment}</div>
                </div>
              ))}
            </div>
            
            <div className="std-report-section">
              <h4>Behavioral Assessment</h4>
              {report.behavior.map((item, index) => (
                <div key={index} className="std-report-behavior-item">
                  <div className="std-report-category">{item.category}</div>
                  <div className={`std-report-rating ${item.rating.toLowerCase()}`}>{item.rating}</div>
                  <div className="std-report-comment">{item.comment}</div>
                </div>
              ))}
            </div>
            
            <div className="std-report-section">
              <h4>Teacher's Overall Comments</h4>
              <div className="std-report-comments">
                {report.overallComments}
              </div>
            </div>
          </div>
        </div>
        
        <div className="std-dialog-footer">
          <button className="std-dialog-btn std-download-btn">
            <FaDownload /> Download PDF
          </button>
          <button className="std-dialog-btn std-send-report-btn" onClick={onSend}>
            <FaPaperPlane /> Send to Parent
          </button>
        </div>
      </div>
    </div>
  );
};

const FeedbackBox = ({ student, onSendFeedback }) => {
  const [messageSubject, setMessageSubject] = useState('Academic');
  const [messageText, setMessageText] = useState('');
  const [includeReport, setIncludeReport] = useState(false);
  const [showReportPreview, setShowReportPreview] = useState(false);
  const editorRef = useRef(null);
  
  // Sample report data
  const sampleReport = {
    period: "January - March 2025",
    academics: [
      { subject: "Mathematics", grade: "A-", comment: "Excellent problem-solving skills." },
      { subject: "Reading", grade: "B+", comment: "Good comprehension, needs work on vocabulary." },
      { subject: "Science", grade: "A", comment: "Shows great interest and engagement." }
    ],
    behavior: [
      { category: "Classroom Participation", rating: "Excellent", comment: "Actively contributes to discussions." },
      { category: "Cooperation", rating: "Good", comment: "Works well with others." },
      { category: "Focus & Attention", rating: "Satisfactory", comment: "Occasionally distracted." }
    ],
    overallComments: "Overall, the student has shown significant progress this term. They excel in mathematics and science, showing natural aptitude. Reading skills are improving steadily. They participate well in class and have a positive attitude toward learning."
  };
  
  const handleEditorChange = () => {
    if (editorRef.current) {
      setMessageText(editorRef.current.innerHTML);
    }
  };
  
  const handleSend = () => {
    if (!messageText.trim()) {
      alert('Please enter a message before sending.');
      return;
    }
    
    if (includeReport) {
      setShowReportPreview(true);
    } else {
      sendFeedback();
    }
  };
  
  const sendFeedback = () => {
    const feedbackData = {
      subject: messageSubject,
      message: messageText,
      hasReport: includeReport,
      report: includeReport ? sampleReport : null,
      date: new Date().toLocaleDateString('en-US', { 
        month: 'short', 
        day: 'numeric', 
        year: 'numeric' 
      }),
      sender: "Teacher",
      senderType: "teacher"
    };
    
    onSendFeedback(feedbackData);
    
    // Reset form
    setMessageText('');
    setIncludeReport(false);
    if (editorRef.current) {
      editorRef.current.innerHTML = '';
    }
    
    // Close report preview if open
    setShowReportPreview(false);
  };
  
  return (
    <div className="std-feedback-box">
      <h3 className="std-section-title">Send Message to Parent</h3>
      
      <div className="std-message-subject-selector">
        <span className="std-subject-label">Message Subject:</span>
        <div className="std-subject-options">
          <button 
            className={`std-subject-btn ${messageSubject === 'Academic' ? 'active' : ''}`}
            onClick={() => setMessageSubject('Academic')}
          >
            Academic
          </button>
          <button 
            className={`std-subject-btn ${messageSubject === 'Behavioral' ? 'active' : ''}`}
            onClick={() => setMessageSubject('Behavioral')}
          >
            Behavioral
          </button>
          <button 
            className={`std-subject-btn ${messageSubject === 'Concern' ? 'active' : ''}`}
            onClick={() => setMessageSubject('Concern')}
          >
            Concern
          </button>
          <button 
            className={`std-subject-btn ${messageSubject === 'Positive' ? 'active' : ''}`}
            onClick={() => setMessageSubject('Positive')}
          >
            Positive
          </button>
        </div>
      </div>
      
      <div className="std-feedback-toolbar">
        <button onClick={() => document.execCommand('bold')}><strong>B</strong></button>
        <button onClick={() => document.execCommand('italic')}><em>I</em></button>
        <button onClick={() => document.execCommand('underline')}><u>U</u></button>
        <button onClick={() => document.execCommand('insertUnorderedList')}>List</button>
        <button onClick={() => {
          if (editorRef.current) {
            editorRef.current.innerHTML = '';
            setMessageText('');
          }
        }}>Clear</button>
      </div>
      
      <div
        ref={editorRef}
        className="std-feedback-editor"
        contentEditable
        onInput={handleEditorChange}
        placeholder="Write your message to the parent..."
      />
      
      <div className="std-report-option">
        <label className="std-report-checkbox">
          <input 
            type="checkbox" 
            checked={includeReport} 
            onChange={() => setIncludeReport(!includeReport)}
          />
          <span className="std-checkbox-label">Include Progress Report</span>
        </label>
        {includeReport && (
          <button 
            className="std-preview-report-btn"
            onClick={() => setShowReportPreview(true)}
          >
            <FaFileAlt /> Preview Report
          </button>
        )}
      </div>
      
      <div className="std-send-footer">
        <div className="std-recipient-box">
          <div className="std-recipient-avatar">{student.parent ? student.parent[0] : 'P'}</div>
          <div className="std-recipient-details">
            <div className="std-recipient-name">{student.parent || 'Parent/Guardian'}</div>
            <div className="std-recipient-email">{student.email || 'No email provided'}</div>
          </div>
        </div>
        <button className="std-send-btn" onClick={handleSend}>
          <FaPaperPlane /> Send Message
        </button>
      </div>
      
      <ReportPreviewDialog 
        isOpen={showReportPreview}
        onClose={() => setShowReportPreview(false)}
        report={sampleReport}
        onSend={sendFeedback}
        student={student}
      />
    </div>
  );
};

const FeedbackHistory = ({ feedbackHistory = [] }) => {
  const [activeFilter, setActiveFilter] = useState('All');
  
  // Filter feedback based on selected type
  const filteredFeedback = activeFilter === 'All' 
    ? feedbackHistory 
    : feedbackHistory.filter(feedback => 
        activeFilter === 'Reports' 
          ? feedback.hasReport 
          : feedback.subject === activeFilter
      );
  
  // Group feedback by month
  const groupedFeedback = filteredFeedback.reduce((groups, item) => {
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
      <h3 className="std-section-title">Communication History</h3>
      
      <FeedbackTypeFilter 
        activeFilter={activeFilter}
        setActiveFilter={setActiveFilter}
      />
      
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
          <p>No communication history available for this student.</p>
          {activeFilter !== 'All' && (
            <p>Try selecting a different filter or view all communications.</p>
          )}
        </div>
      )}
    </div>
  );
};

const FeedbackTab = ({ student }) => {
  const [feedbackHistory, setFeedbackHistory] = useState([
    // Sample feedback data - in a real app, this would come from an API
    {
      subject: 'Academic',
      message: 'I wanted to let you know that your child has shown significant improvement in mathematics this term. Their test scores have increased by 15% since our last assessment.',
      date: 'Mar 15, 2025',
      sender: 'Ms. Johnson',
      senderType: 'teacher',
      hasReport: true
    },
    {
      subject: 'Concern',
      message: "I've noticed that your child has been having difficulty concentrating during afternoon sessions. Could we schedule a meeting to discuss this further?",
      date: 'Mar 5, 2025',
      sender: 'Ms. Johnson',
      senderType: 'teacher',
      hasReport: false,
      response: 'Thank you for bringing this to my attention. Ive noticed similar behavior at home. Lets meet on Friday after school if that works for you.',
      responseDate: 'Mar 6, 2025'
    },
    {
      subject: 'Concern',
      message: 'My child mentioned theyre having trouble with the new reading assignment. Could you provide some additional resources or support?',
      date: 'Feb 20, 2025',
      sender: student.parent || 'Parent',
      senderType: 'parent',
      hasReport: false,
      response: 'Ill be happy to help! Ill send home some supplementary materials tomorrow and schedule some extra reading time during class.',
      responseDate: 'Feb 21, 2025'
    },
    {
      subject: 'Positive',
      message: 'I wanted to share that your child did an excellent job on their science project. They demonstrated great creativity and thorough understanding of the concepts.',
      date: 'Feb 10, 2025',
      sender: 'Ms. Johnson',
      senderType: 'teacher',
      hasReport: false
    },
    {
      subject: 'Behavioral',
      message: 'Your child has been showing great leadership skills in group activities. Theyre helping other students and setting a positive example.',
      date: 'Jan 25, 2025',
      sender: 'Ms. Johnson',
      senderType: 'teacher',
      hasReport: false
    }
  ]);
  
  const handleSendFeedback = (newFeedback) => {
    setFeedbackHistory([newFeedback, ...feedbackHistory]);
  };
  
  return (
    <div className="std-feedback-tab">
      <FeedbackBox 
        student={student} 
        onSendFeedback={handleSendFeedback} 
      />
      <FeedbackHistory feedbackHistory={feedbackHistory} />
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
  const student = location.state?.student || {
    // Sample student data in case none is provided
    id: 'STD-5432',
    name: 'Alex Thompson',
    age: 10,
    readingLevel: 'Advanced',
    gradeLevel: 'Grade 4',
    classSection: '4-A',
    address: '123 Learning Street, Education City',
    parent: 'Sarah Thompson',
    email: 'sarah.thompson@example.com',
    contact: '(555) 123-4567',
    relationship: 'Mother',
    guardianType: 'Parent',
    notificationPreference: 'Email & SMS',
    siblings: [
      {
        name: 'Emily Thompson',
        age: 8,
        grade: 'Grade 2',
        readingLevel: 'On Level',
        id: 'STD-5433'
      },
      {
        name: 'Michael Thompson',
        age: 12,
        grade: 'Grade 6',
        readingLevel: 'Advanced',
        id: 'STD-5431'
      }
    ]
  };

  return (
    <div className="std-container">
      <StudentHeader
        onBack={() => navigate('/teacher/view-student')}
        schoolName="Cradle of Learners Inc."
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