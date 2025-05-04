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
  FaCheckSquare
} from 'react-icons/fa';
import { useLocation, useNavigate } from 'react-router-dom';
import { getStudentDetails } from '../../../services/StudentService';
import cradleLogo from '../../../assets/images/Teachers/cradleLogo.jpg';
import '../../../css/Teachers/StudentDetails.css';

import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';


const StudentDetails = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const progressReportRef = useRef(null);

  const [student, setStudent] = useState(null);
  const [loading, setLoading] = useState(true);

  const exportToPDF = async () => {
    const element = progressReportRef?.current || reportRef?.current;   // whichever ref exists
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

      // add extra pages while there’s still image left
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


  // Learning activities data - using mock data for now
  const learningActivities = [
    {
      id: 'LA-001',
      name: 'Personal Pronouns',
      description: 'Practice in identifying and using personal pronouns',
      completed: true,
      minimalSupport: true,
      moderateSupport: false,
      extensiveSupport: false,
      remarks: `Student can identify pronouns but struggles with using them in sentences.`
    },
    {
      id: 'LA-002',
      name: 'Words with Diphthongs',
      description: 'Recognition and reading of words with diphthongs',
      completed: true,
      minimalSupport: false,
      moderateSupport: true,
      extensiveSupport: false,
      remarks: `Student can read words with diphthongs but needs help with proper pronunciation.`
    },
    {
      id: 'LA-003',
      name: 'Short Story Comprehension',
      description: 'Understanding of short stories',
      completed: false,
      minimalSupport: false,
      moderateSupport: false,
      extensiveSupport: true,
      remarks: `Student struggles with answering questions about stories. Needs additional practice in comprehension.`
    },
    {
      id: 'LA-004',
      name: 'Sentence Structure',
      description: 'Practice in sentence structure',
      completed: false,
      minimalSupport: true,
      moderateSupport: false,
      extensiveSupport: false,
      remarks: `Student is beginning to understand simple sentence structures.`
    }
  ];

  // Default progress report based on template
  const defaultProgress = {
    schoolYear: '2024-2025',
    reportDate: '2025-04-01',
    recommendations: [
      `Student continues to develop writing skills. May need additional practice and support to improve writing and control of fine motor skills.`,
      `Encourage practice to strengthen fine motor skills such as using scissors and proper pencil grip. Continuous practice at home will help improve control and accuracy.`,
      `Needs to focus on developing better control of fine motor movements, such as coloring within lines and proper grip while writing. Continuous practice and guidance will support progress in this area.`
    ]
  };

  // State for progress report
  const [progressReport, setProgressReport] = useState(defaultProgress);

  // State for learning activities
  const [activities, setActivities] = useState(learningActivities);

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
    const fetchStudentDetails = async () => {
      try {
        const studentData = location.state?.student;
        if (studentData) {
          // Fetch full student details from service
          const fullDetails = await getStudentDetails(studentData.id);
          if (fullDetails) {
            setStudent(fullDetails);

            // Initialize feedback message
            setFeedbackMessage({
              subject: `Progress Report for ${fullDetails.name}`,
              content: `Dear ${fullDetails.parent},\n\nI'm writing to update you on ${fullDetails.name}'s progress in our reading comprehension activities. ${fullDetails.name} is working diligently to improve their reading skills, particularly in recognizing letter patterns and sounds.\n\nPlease find the attached progress report for detailed information about their development. If you have any questions or concerns, please don't hesitate to reach out.\n\nSincerely,\nTeacher Claire`
            });
          }
        }
        setLoading(false);
      } catch (error) {
        console.error('Error fetching student details:', error);
        setLoading(false);
      }
    };

    fetchStudentDetails();
  }, [location.state]);

  // Handle save feedback
  const handleSaveFeedback = () => {
    setIsEditingFeedback(false);
    // Here you would typically send the message to the parent
    alert("Message to parent has been saved!");
  };

  // Handle send report
  const handleSendReport = () => {
    alert("Progress report has been sent to parent!");
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
        </div>
      </div>
    );
  }

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
            {student.name.split(' ').map(n => n[0]).join('').toUpperCase()}
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
              <FaCalendarAlt className="sdx-detail-icon" />
              <div className="sdx-detail-content">
                <span className="sdx-detail-label">Age</span>
                <span className="sdx-detail-value">{student.age} years old</span>
              </div>
            </div>

            <div className="sdx-detail-item">
              <FaSchool className="sdx-detail-icon" />
              <div className="sdx-detail-content">
                <span className="sdx-detail-label">Grade</span>
                <span className="sdx-detail-value">{student.gradeLevel}</span>
              </div>
            </div>

            <div className="sdx-detail-item">
              <FaUsers className="sdx-detail-icon" />
              <div className="sdx-detail-content">
                <span className="sdx-detail-label">Section</span>
                <span className="sdx-detail-value">{student.section}</span>
              </div>
            </div>
          </div>

          <div className="sdx-details-column">
            <div className="sdx-detail-item">
              <FaVenusMars className="sdx-detail-icon" />
              <div className="sdx-detail-content">
                <span className="sdx-detail-label">Gender</span>
                <span className="sdx-detail-value">{student.gender}</span>
              </div>
            </div>

            <div className="sdx-detail-item">
              <FaMapMarkerAlt className="sdx-detail-icon" />
              <div className="sdx-detail-content">
                <span className="sdx-detail-label">Address</span>
                <span className="sdx-detail-value">{student.address}</span>
              </div>
            </div>

            <div className="sdx-detail-item">
              <FaUser className="sdx-detail-icon" />
              <div className="sdx-detail-content">
                <span className="sdx-detail-label">Reading Level</span>
                <span className="sdx-detail-value">{student.readingLevel}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Parent Information */}
      <div className="sdx-parent-card">
        <h3 className="sdx-section-title">Parent Information</h3>
        <div className="sdx-parent-details">
          <div className="sdx-parent-avatar">
            {student.parent.split(' ')[0][0]}
          </div>
          <div className="sdx-parent-info">
            <h4 className="sdx-parent-name">{student.parent}</h4>
            <div className="sdx-parent-contact">
              <div className="sdx-contact-item">
                <FaEnvelope className="sdx-contact-icon" />
                <span>{student.parentEmail}</span>
              </div>
              <div className="sdx-contact-item">
                <FaPhone className="sdx-contact-icon" />
                <span>{student.contactNumber}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Siblings Information */}
      <div className="sdx-siblings-card">
        <div className="sdx-section-header">
          <h3 className="sdx-section-title">Siblings</h3>
        </div>

        <div className="sdx-siblings-list">
          {student.siblings && student.siblings.length > 0 ? (
            student.siblings.map((sibling, index) => (
              <div key={index} className="sdx-sibling-item">
                <div className="sdx-sibling-avatar">
                  {sibling.name.split(' ').map(n => n[0]).join('').toUpperCase()}
                </div>
                <div className="sdx-sibling-details">
                  <h4 className="sdx-sibling-name">{sibling.name}</h4>
                  <div className="sdx-sibling-info">
                    <div className="sdx-sibling-info-item">
                      <FaChild className="sdx-sibling-icon" />
                      <span>{sibling.age} years old</span>
                    </div>
                    <div className="sdx-sibling-info-item">
                      <FaSchool className="sdx-sibling-icon" />
                      <span>{sibling.gradeLevel}</span>
                    </div>
                    <div className="sdx-sibling-info-item">
                      <FaUsers className="sdx-sibling-icon" />
                      <span>{sibling.section}</span>
                    </div>
                    <div className="sdx-sibling-info-item">
                      <FaBookReader className="sdx-sibling-icon" />
                      <span>{sibling.readingLevel}</span>
                    </div>
                  </div>
                </div>
              </div>
            ))
          ) : (
            <p className="sdx-no-siblings">No registered siblings.</p>
          )}
        </div>
      </div>

      {/* Learning Activities and Progress Section */}
      <div className="sdx-activities-card">
        <h3 className="sdx-section-title">Learning Activities and Progress</h3>

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
      </div>

      {/* Send Progress Report Section */}
      <div className="sdx-send-report-section">
        <h3 className="sdx-section-title">Send Report to Parent</h3>

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
                <span>{student.parent}</span>
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

            {/* ①  Scrollable wrapper keeps the scrollbar */}
            <div className="sdx-scroll-wrapper">
              {/* ②  Printable body (FULL height) */}
              <div className="sdx-report-printable" ref={progressReportRef}>
                {/* Report Header */}
                <div className="sdx-report-header">
                  <img src={cradleLogo} alt="Cradle of Learners Logo" className="sdx-report-logo" />
                  <div className="sdx-report-school-info">
                    <h1 className="sdx-report-school-name">CRADLE OF LEARNERS</h1>
                    <p className="sdx-report-school-tagline">(Inclusive School for Individualized Education), Inc.</p>
                    <p className="sdx-report-school-address">3rd Floor TUCP Bldg. Elliptical Road Corner Maharlika St. Quezon City</p>
                    <p className="sdx-report-school-contact">☎ 8294‑7772 | ✉ cradle.of.learners@gmail.com</p>
                  </div>
                </div>

                <div className="sdx-modal-body" ref={progressReportRef}>

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
                        <strong>Grade:</strong> {student.gradeLevel}
                      </div>
                      <div className="sdx-report-info-item">
                        <strong>Gender:</strong> {student.gender}
                      </div>
                    </div>
                    <div className="sdx-report-info-row">
                      <div className="sdx-report-info-item">
                        <strong>Parent:</strong> {student.parent}
                      </div>
                      <div className="sdx-report-info-item">
                        <strong>Date:</strong> {progressReport.reportDate}
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
                        {activities.map((activity, index) => (
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
                        ))}
                      </tbody>
                    </table>
                  </div>

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
                      <p className="sdx-report-sign-name">Principal's Signature</p>
                    </div>
                  </div>
                </div>
              </div>{/* end printable */}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default StudentDetails; ``