// src/pages/Teachers/StudentDetails.jsx
import React, { useState, useEffect, useRef } from 'react';
import {
  FaArrowLeft,
  FaUser,
  FaIdCard,
  FaCalendarAlt,
  FaSchool,
  FaVenusMars,
  FaMapMarkerAlt,
  FaUsers,
  FaEnvelope,
  FaPhone,
  FaPaperPlane,
  FaSave,
  FaEdit,
  FaPrint,
  FaFilePdf,
  FaTimes,
  FaPlusCircle,
  FaUserFriends,
  FaChild,
  FaBookReader,
  FaCheckSquare,
  FaBuilding,
  FaRing,
  FaAddressCard,
  FaCheck,
  FaInfoCircle,
  FaExclamationTriangle,
  FaCheckCircle
} from 'react-icons/fa';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import StudentApiService from '../../../services/StudentApiService';
import '../../../css/Teachers/StudentDetails.css';

import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

// Import cradle logo - using Vite's import mechanism
const cradleLogo = new URL('../../../assets/images/Teachers/cradleLogo.jpg', import.meta.url).href;



const StudentDetails = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { id } = useParams();
  const studentId = id || (location.state?.student?.id);


  const progressReportRef = useRef(null);

  const [student, setStudent] = useState(null);

  const [parentProfile, setParentProfile] = useState(null);

  const [assessment, setAssessment] = useState(null);
  const [progress, setProgress] = useState(null);
  const [recommendedLessons, setRecommendedLessons] = useState([]);
  const [prescriptiveRecommendations, setPrescriptiveRecommendations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activities, setActivities] = useState([]);
  const [showSuccessDialog, setShowSuccessDialog] = useState(false);

  async function fetchAllStudentData() {
    try {
      // Fetch basic student data
      const studentData = await studentApiService.getStudent(studentId);
      setStudent(studentData);

      // Try to fetch parent profile with fallback to prevent component failure
      try {
        if (studentData.parentId) {
          const parentData = await StudentApiService.getParentProfileWithFallback(studentData.parentId);
          // Merge parent data into student object
          setStudent(prevStudent => ({
            ...prevStudent,
            parent: parentData
          }));
        }
      } catch (error) {
        console.warn("Could not load parent profile:", error);
        // Don't let parent profile failure break the whole component
        // Default values will be used
      }
      try {
        const assessmentData = await studentApiService.getStudentAssessment(studentId);
        setAssessmentData(assessmentData);
      } catch (error) {
        console.warn("Could not load assessment data:", error);
      }

      try {
        const progressData = await studentApiService.getStudentProgress(studentId);
        setProgressData(progressData);
      } catch (error) {
        console.warn("Could not load progress data:", error);
      }

      setIsLoading(false);
    } catch (error) {
      console.error("Error fetching student data:", error);
      setError("Failed to load student information");
      setIsLoading(false);
    }
  }

  // Helper to map a reading level code to the appropriate CSS class
  const getReadingLevelClass = (level) => {
    switch (level) {
      case 'Fluent': return 'reading-level-fluent';
      case 'Early': return 'reading-level-early';
      case 'Antas 2':
      case 'Antas 3':
      case 'Developing':
        return 'reading-level-developing';
      case 'Antas 4':
      case 'Antas 5':
      case 'Advanced':
        return 'reading-level-advanced';
      default:
        return 'reading-level-not-assessed';
    }
  };

  // Helper to get reading level description
  const getReadingLevelDescription = (level) => {
    switch (level) {
      case 'Early':
        return 'Low Emerging - Learning letter sounds and basic word recognition';
      case 'Developing':
      case 'Antas 2':
      case 'Antas 3':
        return 'Developing - Building phonemic awareness and basic vocabulary';
      case 'Fluent':
        return 'Fluent - Can read and comprehend grade-level text';
      case 'Advanced':
      case 'Antas 4':
      case 'Antas 5':
        return 'Advanced - Reading above grade level with strong comprehension';
      default:
        return 'Not yet assessed - Needs initial assessment';
    }
  };

  // Default progress report based on template
  const defaultProgress = {
    schoolYear: '2024-2025',
    reportDate: new Date().toISOString().split('T')[0],
    recommendations: [
      `Student continues to develop reading skills. May need additional practice and support to improve reading comprehension.`,
      `Encourage practice with phonemic awareness activities at home to strengthen reading foundation.`,
      `Regular practice with guided reading will help improve fluency and comprehension.`
    ]
  };

  // State for progress report
  const [progressReport, setProgressReport] = useState(defaultProgress);

  // State for feedback message
  const [feedbackMessage, setFeedbackMessage] = useState({
    subject: '',
    content: ''
  });

  // State for showing progress report modal
  const [showProgressReport, setShowProgressReport] = useState(false);

  // State for editing feedback
  const [isEditingFeedback, setIsEditingFeedback] = useState(false);

  // State for including progress report
  const [includeProgressReport, setIncludeProgressReport] = useState(true);

  useEffect(() => {
    if (!studentId) {
      setLoading(false);
      return;
    }
    

    const fetchAllStudentData = async () => {
      try {
        setLoading(true);

        // 1) Student details
        const studentData = await StudentApiService.getStudentDetails(studentId);
        setStudent(studentData);

        // 2) Parent profile (with fallback)
        if (studentData.parentId) {
          try {
            const p = await StudentApiService.getParentProfileWithFallback(studentData.parentId);
            setParentProfile(p);
          } catch (e) {
            console.warn('Could not load parent profile:', e);
          }
        }

        // 3) Feedback message template
        setFeedbackMessage({
          subject: `Progress Report for ${studentData.name}`,
          content: `Dear ${parentProfile?.name || 'Parent'},\n\nI'm writing to update you on ${studentData.name}'s progress in our reading comprehension activities. ${studentData.name} is working diligently to improve their reading skills, particularly in ${studentData.readingLevel === 'Not Assessed' ? 'developing their foundational reading skills' : 'developing skills at the ' + studentData.readingLevel + ' level'}.\n\nPlease find the attached progress report for detailed information about their development. If you have any questions or concerns, please don't hesitate to reach out.\n\nSincerely,\nTeacher Claire`
        });

        // 4) Assessment results
        const assessmentData = await StudentApiService.getAssessmentResults(studentId);
        setAssessment(assessmentData);

        // 5) Progress data + derive activities
        const progressData = await StudentApiService.getProgressData(studentId);
        setProgress(progressData);

        const formattedActivities = (progressData.recentActivities || []).map(act => {
          const score = act.score || 0;
          return {
            id: act.id,
            name: act.title,
            description: act.category,
            completed: true,
            minimalSupport: score >= 70,
            moderateSupport: score >= 40 && score < 70,
            extensiveSupport: score < 40,
            remarks: `Student ${score >= 70 ? 'excels at' : score >= 40 ? 'is progressing with' : 'needs additional support with'} ${act.category.toLowerCase()}.`
          };
        });
        setActivities(formattedActivities);

        // 6) Recommended lessons
        const lessonsData = await StudentApiService.getRecommendedLessons(studentId);
        setRecommendedLessons(lessonsData);

        // 7) Prescriptive recommendations + build progressReport.recommendations
        const recs = await StudentApiService.getPrescriptiveRecommendations(studentId);
        setPrescriptiveRecommendations(recs);
        if (recs.length) {
          setProgressReport(prev => ({
            ...prev,
            recommendations: recs.map(r => r.rationale)
          }));
        }

      } catch (error) {
        console.error('Error fetching student data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchAllStudentData();
  }, [studentId]);

  const exportToPDF = async () => {
    const element = progressReportRef.current;
    if (!element) return;

    try {
      const canvas = await html2canvas(element, {
        scale: 2,         // good looking text
        useCORS: true,
        scrollY: -window.scrollY   // grab full page even if modal is scrolled
      });

      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF('p', 'mm', 'a4');
      const pdfW = pdf.internal.pageSize.getWidth();
      const pdfH = pdf.internal.pageSize.getHeight();

      // image dimensions *inside* the PDF
      const imgW = pdfW;
      const imgH = (canvas.height * imgW) / canvas.width;

      let yOffset = 0;        // current y‑offset (negative after 1st page)
      let remainingH = imgH;     // how much of the image is still not on a page yet

      // first page
      pdf.addImage(imgData, 'PNG', 0, yOffset, imgW, imgH);
      remainingH -= pdfH;
      yOffset -= pdfH;         // shift upwards for next slice

      // add extra pages while there's still image left
      while (remainingH > 0) {
        pdf.addPage();
        pdf.addImage(imgData, 'PNG', 0, yOffset, imgW, imgH);
        remainingH -= pdfH;
        yOffset -= pdfH;
      }

      pdf.save(
        `${(student?.name || 'student')
          .replace(/[^a-z0-9]/gi, '_')}_progress_report.pdf`
      );
    } catch (err) {
      console.error('PDF Export Error:', err);
      alert('Failed to export PDF – please try again.');
    }
  };

  // Handle save feedback
  const handleSaveFeedback = () => {
    setIsEditingFeedback(false);
    // Here you would typically send the message to the parent via API
    // For now we just show a success message
  };

  // Handle send report
  const handleSendReport = () => {
    // In a real implementation, this would connect to an API to send the message
    // Show success dialog
    setShowSuccessDialog(true);
  };

  // Function to render checkbox based on status
  const renderCheckbox = (isChecked) => {
    return (
      <div className={`sdx-checkbox ${isChecked ? 'checked' : ''}`}>
        {isChecked && <span className="sdx-checkmark">✓</span>}
      </div>
    );
  };

  // Go back to students list
  const goBack = () => {
    navigate('/teacher/view-student');
  };

  // Close success dialog
  const closeSuccessDialog = () => {
    setShowSuccessDialog(false);
  };

  if (loading) {
    return (
      <div className="sdx-container">
        <div className="vs-loading">
          <div className="vs-loading-spinner"></div>
          <p>Loading student details...</p>
        </div>
      </div>
    );
  }

  if (!student) {
    return (
      <div className="sdx-container">
        <div className="vs-no-results">
          <p>Student not found.</p>
          <button className="sdx-back-btn" onClick={goBack}>
            <FaArrowLeft /> Back to Student List
          </button>
        </div>
      </div>
    );
  }

  // Format reading level assessments for display
  const formatAssessmentItems = () => {
    if (!assessment || !assessment.skillDetails) return [];

    return assessment.skillDetails.map(skill => ({
      id: skill.id || Math.random().toString(36).substr(2, 9),
      code: skill.category === 'Patinig' ? 'Pa' :
        skill.category === 'Pantig' ? 'Pg' :
          skill.category === 'Pagkilala ng Salita' ? 'PS' :
            skill.category === 'Pag-unawa sa Binasa' ? 'PB' : 'RL',
      name: skill.category,
      score: skill.score || 0,
      description: skill.analysis || 'No analysis available'
    }));
  };

  return (
    <div className="sdx-container">
      {/* Header */}
      <div className="sdx-header">
        <button className="sdx-back-btn" onClick={goBack}>
          <FaArrowLeft /> Back
        </button>
        <h1 className="sdx-title">Student Details</h1>
        <div className="sdx-actions">
          <button
            className="sdx-view-report-btn"
            onClick={() => setShowProgressReport(true)}
          >
            <FaFilePdf /> View Progress Report
          </button>
        </div>
      </div>

      {/* Student Profile Section */}
      <div className="sdx-profile-card">
        <div className="sdx-profile-header">
          <div className="sdx-avatar">
            {student.profileImageUrl ? (
              <img
                src={student.profileImageUrl}
                alt={student.name}
                className="sdx-avatar-img"
              />
            ) : (
              student.name.split(' ').map(n => n[0]).join('').toUpperCase()
            )}
          </div>
          <div className="sdx-profile-info">
            <h2 className="sdx-student-name">{student.name}</h2>
            <div className="sdx-student-id">
              <FaIdCard /> ID: {student.id}
            </div>
          </div>
        </div>

        <div className="sdx-profile-details">
          <div className="sdx-details-column">
            <div className="sdx-detail-item">
              <div className="sdx-detail-icon">
                <FaCalendarAlt />
              </div>
              <div className="sdx-detail-content">
                <span className="sdx-detail-label">Age</span>
                <span className="sdx-detail-value">{student.age} years old</span>
              </div>
            </div>

            <div className="sdx-detail-item">
              <div className="sdx-detail-icon">
                <FaSchool />
              </div>
              <div className="sdx-detail-content">
                <span className="sdx-detail-label">Grade</span>
                <span className="sdx-detail-value">{student.gradeLevel || 'Grade 1'}</span>
              </div>
            </div>

            <div className="sdx-detail-item">
              <div className="sdx-detail-icon">
                <FaUsers />
              </div>
              <div className="sdx-detail-content">
                <span className="sdx-detail-label">Section</span>
                <span className="sdx-detail-value">{student.section || 'Sampaguita'}</span>
              </div>
            </div>
          </div>

          <div className="sdx-details-column">
            <div className="sdx-detail-item">
              <div className="sdx-detail-icon">
                <FaVenusMars />
              </div>
              <div className="sdx-detail-content">
                <span className="sdx-detail-label">Gender</span>
                <span className="sdx-detail-value">{student.gender || 'Not specified'}</span>
              </div>
            </div>

            <div className="sdx-detail-item">
              <div className="sdx-detail-icon">
                <FaMapMarkerAlt />
              </div>
              <div className="sdx-detail-content">
                <span className="sdx-detail-label">Address</span>
                <span className="sdx-detail-value">{student.address || 'Not provided'}</span>
              </div>
            </div>

            <div className="sdx-detail-item">
              <div className="sdx-detail-icon">
                <FaBookReader />
              </div>
              <div className="sdx-detail-content">
                <span className="sdx-detail-label">Reading Level</span>
                <span className="sdx-detail-value">{student.readingLevel || 'Not Assessed'}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
      {/* Parent Information */}
      <div className="sdx-parent-card">
        <h3 className="sdx-section-title">
          <FaUser /> Parent Information
        </h3>
        <div className="sdx-parent-details">
          <div className="sdx-parent-avatar">
            {student.parent && student.parent.profileImageUrl ? (
              <img
                src={parentProfile.profileImageUrl || '/images/default-avatar.png'}
                alt="Parent"
                onError={e => { e.currentTarget.src = '/images/default-avatar.png'; }}
              />
            ) : (
              student.parent && typeof student.parent === 'string'
                ? student.parent.charAt(0)
                : student.parent && student.parent.name
                  ? student.parent.name.charAt(0)
                  : 'P'
            )}

          </div>
          <div className="sdx-parent-info">
            <h4 className="sdx-parent-name">
              {typeof student.parent === 'string'
                ? student.parent
                : student.parent && student.parent.name
                  ? student.parent.name
                  : 'Parent info not available'}
            </h4>
            <div className="sdx-parent-contact">
              <div className="sdx-contact-item">
                <FaEnvelope className="sdx-contact-icon" />
                <span>
                  {typeof student.parentEmail === 'string'
                    ? student.parentEmail
                    : student.parent && student.parent.email
                      ? student.parent.email
                      : 'Not available'}
                </span>
              </div>
              <div className="sdx-contact-item">
                <FaPhone className="sdx-contact-icon" />
                <span>
                  {typeof student.parentContact === 'string'
                    ? student.parentContact
                    : student.parent && student.parent.contact
                      ? student.parent.contact
                      : 'Not available'}
                </span>
              </div>
            </div>
          </div>
          {/* Additional parent details in grid format */}
          <div className="sdx-parent-details-grid">
            <div className="sdx-contact-item">
              <FaAddressCard className="sdx-contact-icon" />
              <div className="sdx-detail-content">
                <span className="sdx-detail-label">Address</span>
                <span className="sdx-detail-value">
                  {typeof student.parentAddress === 'string'
                    ? student.parentAddress
                    : student.parent && student.parent.address
                      ? student.parent.address
                      : 'Not provided'}
                </span>
              </div>
            </div>
            <div className="sdx-contact-item">
              <FaRing className="sdx-contact-icon" />
              <div className="sdx-detail-content">
                <span className="sdx-detail-label">Civil Status</span>
                <span className="sdx-detail-value">
                  {typeof student.parentCivilStatus === 'string'
                    ? student.parentCivilStatus
                    : student.parent && student.parent.civilStatus
                      ? student.parent.civilStatus
                      : 'Not provided'}
                </span>
              </div>
            </div>
            <div className="sdx-contact-item">
              <FaVenusMars className="sdx-contact-icon" />
              <div className="sdx-detail-content">
                <span className="sdx-detail-label">Gender</span>
                <span className="sdx-detail-value">
                  {typeof student.parentGender === 'string'
                    ? student.parentGender
                    : student.parent && student.parent.gender
                      ? student.parent.gender
                      : 'Not provided'}
                </span>
              </div>
            </div>
            <div className="sdx-contact-item">
              <FaBuilding className="sdx-contact-icon" />
              <div className="sdx-detail-content">
                <span className="sdx-detail-label">Occupation</span>
                <span className="sdx-detail-value">
                  {typeof student.parentOccupation === 'string'
                    ? student.parentOccupation
                    : student.parent && student.parent.occupation
                      ? student.parent.occupation
                      : 'Not provided'}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
      {/* Learning Activities and Progress Section */}
      <div className="sdx-activities-card">
        <h3 className="sdx-section-title">
          <FaBookReader /> Learning Activities and Progress
        </h3>

        {activities.length > 0 ? (
          <div className="sdx-activities-table">
            <div className="sdx-table-header">
              <div className="sdx-header-cell sdx-activity-name">Lesson</div>
              <div className="sdx-header-cell sdx-activity-completed">Completed</div>
              <div className="sdx-header-cell sdx-activity-progress-label" colSpan="3">Progress Level</div>
              <div className="sdx-header-cell sdx-activity-remarks">Remarks</div>
            </div>

            <div className="sdx-table-subheader">
              <div className="sdx-subheader-cell sdx-placeholder"></div>
              <div className="sdx-subheader-cell sdx-placeholder"></div>
              <div className="sdx-subheader-cell sdx-support-level">Minimal support</div>
              <div className="sdx-subheader-cell sdx-support-level">Moderate support</div>
              <div className="sdx-subheader-cell sdx-support-level">Extensive support</div>
              <div className="sdx-subheader-cell sdx-placeholder"></div>
            </div>

            {activities.map((activity, index) => (
              <div key={index} className="sdx-table-row">
                <div className="sdx-cell sdx-activity-name">{activity.name}</div>
                <div className="sdx-cell sdx-activity-completed">
                  {renderCheckbox(activity.completed)}
                </div>
                <div className="sdx-cell sdx-activity-support">
                  {renderCheckbox(activity.minimalSupport)}
                </div>
                <div className="sdx-cell sdx-activity-support">
                  {renderCheckbox(activity.moderateSupport)}
                </div>
                <div className="sdx-cell sdx-activity-support">
                  {renderCheckbox(activity.extensiveSupport)}
                </div>
                <div className="sdx-cell sdx-activity-remarks">{activity.remarks}</div>
              </div>
            ))}
          </div>
        ) : (
          <div className="sdx-no-activities">
            <p>No learning activities recorded yet.</p>
            {!student.preAssessmentCompleted && (
              <p>Student needs to complete pre-assessment first.</p>
            )}
          </div>
        )}
      </div>

      {/* Assessment Summary Card */}
      {assessment && (
        <div className="sdx-assessment-card">
          <div className="sdx-assessment-header">
            <h3 className="sdx-assessment-title">
              <span className="sdx-assessment-icon">
                <FaBookReader />
              </span>
              Reading Assessment
            </h3>
            <div className="sdx-assessment-score">
              {assessment.scores?.overall || 0}%
            </div>
          </div>

          <div className="sdx-assessment-content">
            {/* Reading Level Information */}
            <div className="sdx-level-info">
              <div className={`sdx-level-badge ${getReadingLevelClass(student.readingLevel)}`}>
                {student.readingLevel || 'Not Assessed'}
              </div>
              <div className="sdx-level-details">
                <div className="sdx-level-name">Reading Level</div>
                <div className="sdx-level-description">
                  {getReadingLevelDescription(student.readingLevel)}
                </div>
              </div>
            </div>

            {/* Assessment Date */}
            <div className="sdx-level-info">
              <div className="sdx-level-badge">
                <FaCalendarAlt />
              </div>
              <div className="sdx-level-details">
                <div className="sdx-level-name">Last Assessment Date</div>
                <div className="sdx-level-description">
                  {assessment.assessmentDate || 'Not available'}
                </div>
              </div>
            </div>

            <div className="sdx-assessment-divider"></div>

            {/* Skill Assessment Items */}
            <div className="sdx-assessment-items">
              {formatAssessmentItems().map((item, index) => (
                <div key={index} className="sdx-assessment-item">
                  <div className="sdx-assessment-item-header">
                    <div className="sdx-assessment-item-name">
                      <span>{item.code}</span> {item.name}
                    </div>
                    <div className={`sdx-assessment-item-badge ${item.score > 0 ? `score-${Math.floor(item.score / 20)}` : 'score-0'}`}>
                      {item.score}%
                    </div>
                  </div>
                  <div className="sdx-assessment-item-description">
                    {item.description}
                  </div>
                </div>
              ))}
            </div>

            <div className="sdx-assessment-divider"></div>

            {/* Focus Areas */}
            <div className="sdx-focus-areas">
              <div className="sdx-focus-areas-title">
                <FaInfoCircle /> Focus Areas
              </div>
              <p className="sdx-focus-areas-content">
                {assessment.focusAreas || 'No specific focus areas identified yet.'}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Send Progress Report Section */}
      <div className="sdx-send-report-section">
        <h3 className="sdx-section-title">
          <FaPaperPlane /> Send Report to Parent
        </h3>

        <div className="sdx-message-box">
          <div className="sdx-message-header">
            <div className="sdx-message-subject">
              <label><strong>Subject:</strong></label>
              {isEditingFeedback ? (
                <input
                  type="text"
                  value={feedbackMessage.subject}
                  onChange={(e) => setFeedbackMessage({ ...feedbackMessage, subject: e.target.value })}
                  className="sdx-subject-input"
                />
              ) : (
                <span>{feedbackMessage.subject}</span>
              )}
            </div>
            <div className="sdx-message-recipient">
              <span>To:</span>
              <div className="sdx-recipient-badge">
                <FaUser className="sdx-recipient-icon" />
                <span>{student.parent || 'Parent'}</span>
              </div>
            </div>
          </div>

          <div className="sdx-message-content">
            {isEditingFeedback ? (
              <textarea
                value={feedbackMessage.content}
                onChange={(e) => setFeedbackMessage({ ...feedbackMessage, content: e.target.value })}
                className="sdx-message-textarea"
                rows="6"
              ></textarea>
            ) : (
              <p className="sdx-message-text">{feedbackMessage.content}</p>
            )}
          </div>

          <div className="sdx-include-report">
            <label className="sdx-include-report-label">
              <input
                type="checkbox"
                checked={includeProgressReport}
                onChange={() => setIncludeProgressReport(!includeProgressReport)}
                className="sdx-include-report-checkbox"
              />
              <FaCheckSquare className={`sdx-checkbox-icon ${includeProgressReport ? 'checked' : ''}`} />
              <span><strong>Include Progress Report</strong></span>
            </label>
          </div>

          <div className="sdx-message-actions">
            {isEditingFeedback ? (
              <button
                className="sdx-save-btn"
                onClick={handleSaveFeedback}
              >
                <FaSave /> Save Message
              </button>
            ) : (
              <button
                className="sdx-edit-btn"
                onClick={() => setIsEditingFeedback(true)}
              >
                <FaEdit /> Edit Message
              </button>
            )}

            <button
              className="sdx-send-btn"
              onClick={handleSendReport}
              disabled={isEditingFeedback}
            >
              <FaPaperPlane /> Send Report
            </button>
          </div>
        </div>
      </div>

      {/* Progress Report Modal */}
      {showProgressReport && (
        <div className="sdx-modal-overlay" onClick={() => setShowProgressReport(false)}>
          <div className="sdx-modal-content" onClick={e => e.stopPropagation()}>
            <div className="sdx-modal-header">
              <h2 className="sdx-modal-title">Progress Report</h2>
              <div className="sdx-modal-actions">
                <button className="sdx-export-btn" onClick={exportToPDF}>
                  <FaFilePdf /> Export as PDF
                </button>
                <button
                  className="sdx-close-btn"
                  onClick={() => setShowProgressReport(false)}
                >
                  <FaTimes />
                </button>
              </div>
            </div>

            {/* Scrollable wrapper keeps the scrollbar */}
            <div className="sdx-scroll-wrapper">
              {/* Printable body (FULL height) */}
              <div className="sdx-report-printable" ref={progressReportRef}>
                {/* Report Header */}
                <div className="sdx-report-header">
                  <img src={cradleLogo} alt="Cradle of Learners Logo" className="sdx-report-logo" />
                  <div className="sdx-report-school-info">
                    <h1 className="sdx-report-school-name">CRADLE OF LEARNERS</h1>
                    <p className="sdx-report-school-tagline">(Inclusive School for Individualized Education), Inc.</p>
                    <p className="sdx-report-school-address">3rd Floor TUCP Bldg. Elliptical Road Corner Maharlika St. Quezon City</p>
                    <p className="sdx-report-school-contact">☎ 8294‑7772 | ✉ cradle.of.learners@gmail.com</p>
                  </div>
                </div>

                <div className="sdx-modal-body">
                  {/* Report Title */}
                  <div className="sdx-report-title-section">
                    <h2 className="sdx-report-main-title">PROGRESS REPORT</h2>
                    <p className="sdx-report-school-year">S.Y. {progressReport.schoolYear}</p>
                  </div>

                  {/* Student Information */}
                  <div className="sdx-report-student-info">
                    <div className="sdx-report-info-row">
                      <div className="sdx-report-info-item">
                        <strong>Name:</strong> {student.name}
                      </div>
                      <div className="sdx-report-info-item">
                        <strong>Age:</strong> {student.age}
                      </div>
                    </div>
                    <div className="sdx-report-info-row">
                      <div className="sdx-report-info-item">
                        <strong>Grade:</strong> {student.gradeLevel || 'Grade 1'}
                      </div>
                      <div className="sdx-report-info-item">
                        <strong>Gender:</strong> {student.gender || 'Not specified'}
                      </div>
                    </div>
                    <div className="sdx-report-info-row">
                      <div className="sdx-report-info-item">
                        <strong>Parent:</strong> {student.parent || 'Not provided'}
                      </div>
                      <div className="sdx-report-info-item">
                        <strong>Date:</strong> {progressReport.reportDate}
                      </div>
                    </div>
                    <div className="sdx-report-info-row">
                      <div className="sdx-report-info-item">
                        <strong>Reading Level:</strong> {student.readingLevel || 'Not Assessed'}
                      </div>
                      <div className="sdx-report-info-item">
                        <strong>Last Assessment:</strong> {student.lastAssessment || 'Not available'}
                      </div>
                    </div>
                  </div>

                  {/* Progress Table */}
                  <div className="sdx-report-progress-table">
                    <table className="sdx-report-table">
                      <thead>
                        <tr>
                          <th className="sdx-report-th sdx-report-th-aralin">Lesson</th>
                          <th className="sdx-report-th sdx-report-th-nakumpleto">Completed</th>
                          <th className="sdx-report-th sdx-report-th-antas" colSpan="3">Progress Level</th>
                          <th className="sdx-report-th sdx-report-th-puna">Remarks</th>
                        </tr>
                        <tr>
                          <th className="sdx-report-th-empty"></th>
                          <th className="sdx-report-th-empty"></th>
                          <th className="sdx-report-th-level">Minimal support</th>
                          <th className="sdx-report-th-level">Moderate support</th>
                          <th className="sdx-report-th-level">Extensive support</th>
                          <th className="sdx-report-th-empty"></th>
                        </tr>
                      </thead>
                      <tbody>
                        {activities.length > 0 ? (
                          activities.map((activity, index) => (
                            <tr key={index} className="sdx-report-tr">
                              <td className="sdx-report-td sdx-report-td-aralin">{activity.name}</td>
                              <td className="sdx-report-td sdx-report-td-nakumpleto">
                                {activity.completed ? "✓" : ""}
                              </td>
                              <td className="sdx-report-td sdx-report-td-support">
                                {activity.minimalSupport ? "✓" : ""}
                              </td>
                              <td className="sdx-report-td sdx-report-td-support">
                                {activity.moderateSupport ? "✓" : ""}
                              </td>
                              <td className="sdx-report-td sdx-report-td-support">
                                {activity.extensiveSupport ? "✓" : ""}
                              </td>
                              <td className="sdx-report-td sdx-report-td-puna">{activity.remarks}</td>
                            </tr>
                          ))
                        ) : (
                          <tr className="sdx-report-tr">
                            <td colSpan="6" className="sdx-report-td-empty">
                              No learning activities recorded yet.
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>

                  {/* Reading Assessment Summary */}
                  {assessment && (
                    <div className="sdx-report-assessment-summary">
                      <h3 className="sdx-report-section-title">Reading Assessment Summary</h3>
                      <div className="sdx-report-skills-grid">
                        {formatAssessmentItems().map((skill, index) => (
                          <div key={index} className="sdx-report-skill-item">
                            <div className="sdx-report-skill-header">
                              <span className="sdx-report-skill-name">{skill.name}</span>
                              <span className={`sdx-report-skill-score ${skill.score >= 80 ? 'score-excellent' :
                                skill.score >= 60 ? 'score-good' :
                                  skill.score >= 40 ? 'score-average' :
                                    'score-needs-improvement'
                                }`}>{skill.score}%</span>
                            </div>
                            <div className="sdx-report-skill-bar-container">
                              <div
                                className={`sdx-report-skill-bar ${skill.score >= 80 ? 'score-excellent' :
                                  skill.score >= 60 ? 'score-good' :
                                    skill.score >= 40 ? 'score-average' :
                                      'score-needs-improvement'
                                  }`}
                                style={{ width: `${skill.score}%` }}
                              ></div>
                            </div>
                            <p className="sdx-report-skill-analysis">{skill.description}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Recommendations */}
                  <div className="sdx-report-recommendations">
                    <h3 className="sdx-report-section-title">Recommendations</h3>
                    <ul className="sdx-report-rec-list">
                      {progressReport.recommendations.map((rec, index) => (
                        <li key={index} className="sdx-report-rec-item">{rec}</li>
                      ))}
                    </ul>
                  </div>

                  {/* Signatures */}
                  <div className="sdx-report-signatures">
                    <div className="sdx-report-signature">
                      <div className="sdx-report-sign-line"></div>
                      <p className="sdx-report-sign-name">Teacher's Signature</p>
                    </div>
                    <div className="sdx-report-signature">
                      <div className="sdx-report-sign-line"></div>
                      <p className="sdx-report-sign-name">Principal's Signature</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Success Dialog */}
      {showSuccessDialog && (
        <div className="sdx-dialog-overlay">
          <div className="sdx-dialog">
            <div className="sdx-dialog-header">
              <h3 className="sdx-dialog-title">
                <FaCheckCircle className="sdx-dialog-icon" /> Success
              </h3>
            </div>
            <div className="sdx-dialog-content">
              <div className="sdx-dialog-message">
                <p>Progress report has been successfully sent to {student.parent}!</p>
                <p>A copy has been saved to the student's records.</p>
              </div>
              <div className="sdx-dialog-actions">
                <button
                  className="sdx-dialog-btn sdx-dialog-btn-primary"
                  onClick={closeSuccessDialog}
                >
                  OK
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default StudentDetails;