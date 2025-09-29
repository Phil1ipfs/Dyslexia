// src/pages/Parents/Feedback.jsx
import React, { useState, useEffect } from 'react';
import {
  FileText, // Changed from FilePdf to FileText
  Info,
  Calendar,
  User,
  Book,
  X,
  Download,
  BookOpen,
  Eye,
  Home,
  MessageSquare
} from 'lucide-react';
import '../../css/Parents/Feedback.css';
import axios from 'axios';

const Feedback = () => {
  const [feedbacks, setFeedbacks] = useState([]);
  const [selectedPdf, setSelectedPdf] = useState(null);
  const [viewMode, setViewMode] = useState(null); // 'pdf' or 'message'
  const [animated, setAnimated] = useState(false);

  // Fetch feedbacks from backend
  useEffect(() => {
    const token = localStorage.getItem('token');
    axios.get('/api/parent/child_pdf', {
      headers: {
        Authorization: `Bearer ${token}`
      }
    })
      .then(res => {
        setFeedbacks(res.data);
      })
      .catch(() => setFeedbacks([]));
  }, []);

  // Animation trigger
  useEffect(() => {
    const timer = setTimeout(() => {
      setAnimated(true);
    }, 100);

    return () => clearTimeout(timer);
  }, []);

  // Prevent background scroll when modal is open
  useEffect(() => {
    if (selectedPdf) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => { document.body.style.overflow = ''; };
  }, [selectedPdf]);

  // Function to handle PDF viewing
  const viewPdf = (feedback) => {
    setSelectedPdf(feedback);
    setViewMode('pdf');
  };

  // Function to handle message viewing
  const viewMessage = (feedback) => {
    setSelectedPdf(feedback);
    setViewMode('message');
  };

  const closePdf = () => {
    setSelectedPdf(null);
    setViewMode(null);
  };

  // Format date string to readable format
  const formatDate = (dateString) => {
    if (!dateString) return "Not available";

    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });
    } catch (e) {
      return dateString;
    }
  };

  return (
    <div className="parent-feedback__container">
      {/* Header section with breadcrumb */}
      <div className="parent-feedback__main-content">
        <div className="parent-feedback__header">
          <div className="parent-feedback__breadcrumb">
            <Home size={16} />
            <span className="parent-feedback__breadcrumb-separator">/</span>
            <span className="parent-feedback__breadcrumb-active">Progress Reports</span>
          </div>
          <h1 className="parent-feedback__title">Weekly Progress Reports</h1>
          <p className="parent-feedback__subtitle">View and download your child's progress reports submitted by teachers</p>
        </div>

        {/* Info Banner */}
        <div className={`parent-feedback__info-banner ${animated ? 'animate' : ''}`} style={{ animationDelay: '0s' }}>
          <Info className="parent-feedback__info-icon" />
          <div className="parent-feedback__info-content">
            <h3>Progress Report Overview</h3>
            <p>
              These weekly reports provide detailed feedback on your child's performance and development.
              Click on "View Report" to open the PDF document. You can download reports for your records.
            </p>
          </div>
        </div>

        {/* Table Container */}
        <div className={`parent-feedback__table-container ${animated ? 'animate' : ''}`} style={{ animationDelay: '0.2s' }}>
          <div className="parent-feedback__table-header">
            <BookOpen className="parent-feedback__table-icon" />
            <h3>Available Reports</h3>
          </div>
          <div className="parent-feedback__table-wrapper">
            <table className="parent-feedback__table">
              <thead>
                <tr>
                  <th>
                    <div className="parent-feedback__th-content">
                      <User size={16} className="parent-feedback__th-icon" />
                      <span>Teacher</span>
                    </div>
                  </th>
                  <th>
                    <div className="parent-feedback__th-content">
                      <User size={16} className="parent-feedback__th-icon" />
                      <span>Parent</span>
                    </div>
                  </th>
                  <th>
                    <div className="parent-feedback__th-content">
                      <User size={16} className="parent-feedback__th-icon" />
                      <span>Student</span>
                    </div>
                  </th>
                  <th>
                    <div className="parent-feedback__th-content">
                      <Calendar size={16} className="parent-feedback__th-icon" />
                      <span>Week</span>
                    </div>
                  </th>
                  <th>
                    <div className="parent-feedback__th-content">
                      <Calendar size={16} className="parent-feedback__th-icon" />
                      <span>Date</span>
                    </div>
                  </th>
                  <th>
                    <div className="parent-feedback__th-content">
                      <FileText size={16} className="parent-feedback__th-icon" />
                      <span>Action</span>
                    </div>
                  </th>
                </tr>
              </thead>
              <tbody>
                {feedbacks.map((feedback, index) => (
                  <tr
                    key={index}
                    className={`parent-feedback__table-row ${animated ? 'animate' : ''}`}
                    style={{ animationDelay: `${0.3 + (index * 0.05)}s` }}
                  >
                    <td className="parent-feedback__teacher-cell">
                      <div className="parent-feedback__teacher-info">
                        <span className="parent-feedback__teacher-name">{feedback.teacher}</span>
                      </div>
                    </td>
                    <td>{feedback.parent}</td>
                    <td>{feedback.student}</td>
                    <td>{feedback.week}</td>
                    <td>{formatDate(feedback.date)}</td>
                    <td>
                      <div className="parent-feedback__action-buttons">
                        <button
                          className="parent-feedback__message-btn"
                          onClick={() => viewMessage(feedback)}
                          title="View message content"
                        >
                          <MessageSquare size={16} />
                          <span>View Message</span>
                        </button>
                        <button
                          className="parent-feedback__view-btn"
                          onClick={() => viewPdf(feedback)}
                          title="View full report with PDF"
                        >
                          <Eye size={16} />
                          <span>View Report</span>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Process Note */}
        <div className={`parent-feedback__process-note ${animated ? 'animate' : ''}`} style={{ animationDelay: '0.5s' }}>
          <Info className="parent-feedback__process-note-icon" />
          <div className="parent-feedback__process-note-content">
            <p>
              <strong>Note:</strong> Progress reports are generated weekly by your child's teachers.
              If you have any questions about a specific report, please contact the teacher directly.
            </p>
          </div>
        </div>
      </div>

      {/* Modal PDF Viewer */}
      {selectedPdf && (
        <div className="parent-feedback__modal-overlay" onClick={closePdf}>
          <div className="parent-feedback__modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="parent-feedback__modal-header">
              <h2>{viewMode === 'message' ? 'Teacher Message' : 'Progress Report'}</h2>
              <div className="parent-feedback__modal-actions">
                {viewMode === 'pdf' && (
                  <a
                    href={selectedPdf.pdfUrl}
                    download
                    className="parent-feedback__download-btn"
                  >
                    <Download size={16} />
                    <span>Download</span>
                  </a>
                )}
                <button
                  className="parent-feedback__close-btn"
                  onClick={closePdf}
                >
                  <X size={16} />
                  <span>Close</span>
                </button>
              </div>
            </div>

            {/* Message Content Section - Only show when viewing message */}
            {viewMode === 'message' && (
              <div className="parent-feedback__message-section">
                <div className="parent-feedback__message-info">
                  <div className="parent-feedback__message-subject">
                    <strong>Subject: </strong>
                    <span>{selectedPdf.subject || 'No subject available'}</span>
                  </div>
                  <div className="parent-feedback__message-from">
                    <strong>From: </strong>
                    <span>{selectedPdf.teacher}</span>
                  </div>
                  <div className="parent-feedback__message-date">
                    <strong>Date: </strong>
                    <span>{formatDate(selectedPdf.date)}</span>
                  </div>
                </div>
                <div className="parent-feedback__message-content-box">
                  <strong>Message:</strong>
                  <div className="parent-feedback__message-text-full">
                    {selectedPdf.content || 'No message content available'}
                  </div>
                </div>
              </div>
            )}

            {/* PDF Section - Only show when viewing PDF report */}
            {viewMode === 'pdf' && (
              <div className="parent-feedback__modal-body">
                <iframe
                  src={selectedPdf.pdfUrl}
                  title="Progress Report PDF"
                  className="parent-feedback__pdf-frame"
                  allow="autoplay"
                />
              </div>
            )}

            {/* Message-only mode actions */}
            {viewMode === 'message' && (
              <div className="parent-feedback__message-actions">
                <button
                  className="parent-feedback__view-full-btn"
                  onClick={() => setViewMode('pdf')}
                >
                  <Eye size={16} />
                  <span>View Full Report with PDF</span>
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default Feedback;