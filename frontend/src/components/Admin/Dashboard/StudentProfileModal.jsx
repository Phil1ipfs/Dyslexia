// src/components/StudentProfileModal.jsx
import React, { useState } from 'react';
import './StudentProfileModal.css';
import { X, Edit, FileText, Mail, Phone, AlertTriangle, UserCircle, BookOpen, Clock, Award, BarChart2 } from 'lucide-react';

const StudentProfileModal = ({ student, onClose }) => {
  const [activeTab, setActiveTab] = useState('info');
  
  if (!student) return null;
  
  // Mock performance data - in a real app, this would come from props or an API
  const performanceData = {
    gpa: '3.75',
    subjects: [
      { name: 'Mathematics', grade: 'A', percentage: 94 },
      { name: 'Science', grade: 'A-', percentage: 90 },
      { name: 'English', grade: 'B+', percentage: 87 },
      { name: 'History', grade: 'A', percentage: 92 }
    ],
    ranking: '5th of 120'
  };
  
  // Mock attendance data
  const attendanceData = {
    present: 85,
    absent: 3,
    late: 2,
    excused: 1,
    total: 91,
    recentAbsences: [
      { date: '2023-11-15', reason: 'Medical appointment', excused: true },
      { date: '2023-10-22', reason: 'Family emergency', excused: true }
    ]
  };
  
  const calculateAttendancePercentage = () => {
    return Math.round((attendanceData.present / attendanceData.total) * 100);
  };
  
  return (
    <div className="profile-modal-overlay">
      <div className="profile-modal-content">
        <div className="profile-modal-header">
          <h2>Student Profile</h2>
          <button className="profile-modal-close" onClick={onClose}>
            <X size={20} />
          </button>
        </div>
        
        <div className="profile-overview">
          <div className="profile-avatar">
            <div className="profile-avatar-placeholder">
              <UserCircle size={64} />
            </div>
          </div>
          <div className="profile-overview-details">
            <h3 className="profile-name">{student.name}</h3>
            <div className="profile-overview-info">
              <div className="profile-overview-item">
                <BookOpen size={16} />
                <span>Grade {student.gradeLevel || "N/A"}</span>
              </div>
              <div className="profile-overview-item">
                <Award size={16} />
                <span>GPA: {performanceData.gpa}</span>
              </div>
              <div className="profile-overview-item">
                <BarChart2 size={16} />
                <span>Rank: {performanceData.ranking}</span>
              </div>
            </div>
          </div>
          <div className="profile-quick-actions">
            <button className="profile-action-button">
              <Edit size={14} />
              <span>Edit</span>
            </button>
            <button className="profile-action-button">
              <FileText size={14} />
              <span>Report</span>
            </button>
            <button className="profile-action-button">
              <Mail size={14} />
              <span>Contact</span>
            </button>
          </div>
        </div>
        
        <div className="profile-tabs">
          <div 
            className={`profile-tab ${activeTab === 'info' ? 'active' : ''}`} 
            onClick={() => setActiveTab('info')}
          >
            Information
          </div>
          <div 
            className={`profile-tab ${activeTab === 'performance' ? 'active' : ''}`}
            onClick={() => setActiveTab('performance')}
          >
            Performance
          </div>
          <div 
            className={`profile-tab ${activeTab === 'attendance' ? 'active' : ''}`}
            onClick={() => setActiveTab('attendance')}
          >
            Attendance
          </div>
        </div>
        
        <div className="profile-modal-body">
          {activeTab === 'info' && (
            <>
              <div className="profile-section">
                <h3 className="profile-section-title">Student Information</h3>
                <div className="profile-details">
                  <div className="profile-detail-row">
                    <div className="profile-detail-label">Full Name:</div>
                    <div className="profile-detail-value">{student.name}</div>
                  </div>
                  <div className="profile-detail-row">
                    <div className="profile-detail-label">Student ID:</div>
                    <div className="profile-detail-value">{student.id}</div>
                  </div>
                  <div className="profile-detail-row">
                    <div className="profile-detail-label">Date of Birth:</div>
                    <div className="profile-detail-value">{student.dob || '05/17/2008'}</div>
                  </div>
                  <div className="profile-detail-row">
                    <div className="profile-detail-label">Address:</div>
                    <div className="profile-detail-value">{student.address || '123 School Lane, Cityville'}</div>
                  </div>
                </div>
              </div>
              
              <div className="profile-section">
                <h3 className="profile-section-title">Parent Information</h3>
                <div className="profile-details">
                  <div className="profile-detail-row">
                    <div className="profile-detail-label">Parent Name:</div>
                    <div className="profile-detail-value">{student.parentName}</div>
                  </div>
                  <div className="profile-detail-row">
                    <div className="profile-detail-label">Parent Email:</div>
                    <div className="profile-detail-value">{student.parentEmail}</div>
                  </div>
                  <div className="profile-detail-row">
                    <div className="profile-detail-label">Phone Number:</div>
                    <div className="profile-detail-value">{student.parentPhone || '(555) 123-4567'}</div>
                  </div>
                  <div className="profile-detail-row">
                    <div className="profile-detail-label">Relationship:</div>
                    <div className="profile-detail-value">{student.parentRelation || 'Mother'}</div>
                  </div>
                </div>
              </div>
              
              <div className="profile-section">
                <h3 className="profile-section-title">Academic Information</h3>
                <div className="profile-details">
                  <div className="profile-detail-row">
                    <div className="profile-detail-label">Grade Level:</div>
                    <div className="profile-detail-value">Grade {student.gradeLevel || "Not specified"}</div>
                  </div>
                  <div className="profile-detail-row">
                    <div className="profile-detail-label">Teacher:</div>
                    <div className="profile-detail-value">{student.teacher || "Not assigned"}</div>
                  </div>
                  <div className="profile-detail-row">
                    <div className="profile-detail-label">Enrollment Date:</div>
                    <div className="profile-detail-value">{student.enrollmentDate || "09/01/2023"}</div>
                  </div>
                  <div className="profile-detail-row">
                    <div className="profile-detail-label">Class Section:</div>
                    <div className="profile-detail-value">{student.section || "A"}</div>
                  </div>
                </div>
              </div>
              
              <div className="profile-section">
                <h3 className="profile-section-title">Emergency Contact</h3>
                <div className="profile-details">
                  <div className="profile-detail-row">
                    <div className="profile-detail-label">Contact Name:</div>
                    <div className="profile-detail-value">{student.emergencyName || student.parentName}</div>
                  </div>
                  <div className="profile-detail-row">
                    <div className="profile-detail-label">Relationship:</div>
                    <div className="profile-detail-value">{student.emergencyRelation || "Mother"}</div>
                  </div>
                  <div className="profile-detail-row">
                    <div className="profile-detail-label">Phone Number:</div>
                    <div className="profile-detail-value">{student.emergencyPhone || "(555) 123-4567"}</div>
                  </div>
                </div>
              </div>
            </>
          )}
          
          {activeTab === 'performance' && (
            <>
              <div className="profile-section">
                <h3 className="profile-section-title">Academic Performance</h3>
                <div className="performance-summary">
                  <div className="performance-metric">
                    <div className="performance-metric-label">GPA</div>
                    <div className="performance-metric-value">{performanceData.gpa}</div>
                  </div>
                  <div className="performance-metric">
                    <div className="performance-metric-label">Class Rank</div>
                    <div className="performance-metric-value">{performanceData.ranking}</div>
                  </div>
                </div>
              </div>
              
              <div className="profile-section">
                <h3 className="profile-section-title">Subject Performance</h3>
                <div className="subject-performance">
                  {performanceData.subjects.map((subject, index) => (
                    <div className="subject-item" key={index}>
                      <div className="subject-info">
                        <div className="subject-name">{subject.name}</div>
                        <div className="subject-grade">{subject.grade}</div>
                      </div>
                      <div className="subject-progress-container">
                        <div 
                          className="subject-progress-bar" 
                          style={{width: `${subject.percentage}%`}}
                        ></div>
                        <span className="subject-percentage">{subject.percentage}%</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              
              <div className="profile-section">
                <h3 className="profile-section-title">Notes & Recommendations</h3>
                <div className="performance-notes">
                  <p>Christine demonstrates excellent analytical skills in mathematics and science. 
                  She participates actively in class discussions and is thorough with homework assignments.</p>
                  <p>Recommended for the Science Olympiad team and Advanced Placement courses next year.</p>
                </div>
              </div>
            </>
          )}
          
          {activeTab === 'attendance' && (
            <>
              <div className="profile-section">
                <h3 className="profile-section-title">Attendance Summary</h3>
                <div className="attendance-summary">
                  <div className="attendance-metric">
                    <div className="attendance-percentage">{calculateAttendancePercentage()}%</div>
                    <div className="attendance-label">Overall Attendance</div>
                  </div>
                  <div className="attendance-details">
                    <div className="attendance-detail">
                      <span className="attendance-detail-label">Present:</span>
                      <span className="attendance-detail-value">{attendanceData.present} days</span>
                    </div>
                    <div className="attendance-detail">
                      <span className="attendance-detail-label">Absent:</span>
                      <span className="attendance-detail-value">{attendanceData.absent} days</span>
                    </div>
                    <div className="attendance-detail">
                      <span className="attendance-detail-label">Late:</span>
                      <span className="attendance-detail-value">{attendanceData.late} days</span>
                    </div>
                    <div className="attendance-detail">
                      <span className="attendance-detail-label">Excused:</span>
                      <span className="attendance-detail-value">{attendanceData.excused} days</span>
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="profile-section">
                <h3 className="profile-section-title">Recent Absences</h3>
                <div className="recent-absences">
                  {attendanceData.recentAbsences.length > 0 ? (
                    attendanceData.recentAbsences.map((absence, index) => (
                      <div className="absence-item" key={index}>
                        <div className="absence-date">
                          {new Date(absence.date).toLocaleDateString('en-US', {
                            month: 'short',
                            day: 'numeric',
                            year: 'numeric'
                          })}
                        </div>
                        <div className="absence-details">
                          <div className="absence-reason">{absence.reason}</div>
                          <div className={`absence-status ${absence.excused ? 'excused' : 'unexcused'}`}>
                            {absence.excused ? 'Excused' : 'Unexcused'}
                          </div>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="no-absences">No recent absences recorded.</div>
                  )}
                </div>
              </div>
              
              {attendanceData.late > 0 && (
                <div className="attendance-alert">
                  <AlertTriangle size={18} />
                  <span>Student has been late {attendanceData.late} times this semester.</span>
                </div>
              )}
            </>
          )}
        </div>
        
        <div className="profile-modal-footer">
          <button className="profile-close-button" onClick={onClose}>
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

export default StudentProfileModal;