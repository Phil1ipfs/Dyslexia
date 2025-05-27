import React, { useState } from 'react';
import '../../css/Parents/Feedback.css';
import { FaFilePdf } from 'react-icons/fa';

const sampleFeedbacks = [
  {
    teacher: 'Ms. Maria L. Santiago',
    subject: 'Filipino',
    date: '2025-04-02',
    week: 'Week 1',
    pdfUrl: '/Kit_Nicholas_Rish_Mark_progress_report.pdf',
  },
  {
    teacher: 'Mr. John D. DeLemos',
    subject: 'Filipino',
    date: '2025-04-01',
    week: 'Week 2',
    pdfUrl: '/Kit_Nicholas_Rish_Mark_progress_report.pdf',
  },
  {
    teacher: 'Ms. Maria L. Santiago',
    subject: 'Filipino',
    date: '2025-04-01',
    week: 'Week 3',
    pdfUrl: '/Kit_Nicholas_Rish_Mark_progress_report.pdf',
  },
  {
    teacher: 'Mr. John D. DeLemos',
    subject: 'Filipino',
    date: '2025-04-01',
    week: 'Week 4',
    pdfUrl: '/Kit_Nicholas_Rish_Mark_progress_report.pdf',
  },
  {
    teacher: 'Ms. Maria L. Santiago',
    subject: 'Filipino',
    date: '2025-04-01',
    week: 'Week 5',
    pdfUrl: '/Kit_Nicholas_Rish_Mark_progress_report.pdf',
  },
  {
    teacher: 'Ms. Maria L. Santiago',
    subject: 'Filipino',
    date: '2025-04-01',
    week: 'Week 6',
    pdfUrl: '/Kit_Nicholas_Rish_Mark_progress_report.pdf',
  },
  {
    teacher: 'Mr. John D. DeLemos',
    subject: 'Filipino',
    date: '2025-04-01',
    week: 'Week 7',
    pdfUrl: '/Kit_Nicholas_Rish_Mark_progress_report.pdf',
  },
  {
    teacher: 'Mr. John D. DeLemos',
    subject: 'Filipino',
    date: '2025-04-01',
    week: 'Week 8',
    pdfUrl: '/Kit_Nicholas_Rish_Mark_progress_report.pdf',
  },
];

const Feedback = () => {
  const [feedbacks] = useState(sampleFeedbacks);
  const [selectedPdf, setSelectedPdf] = useState(null);

  // Prevent background scroll when modal is open
  React.useEffect(() => {
    if (selectedPdf) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => { document.body.style.overflow = ''; };
  }, [selectedPdf]);

  // Function to handle PDF viewing
  const viewPdf = (pdfUrl) => {
    setSelectedPdf(pdfUrl);
  };

  const closePdf = () => {
    setSelectedPdf(null);
  };

  return (
    <div className="feedback-container">
      <div className="feedback-header">
        <h1>Progress Reports</h1>
        <p>View your child's weekly progress reports from teachers.</p>
      </div>

      <div className="feedback-table">
        <table>
          <thead>
            <tr>
              <th>Teacher</th>
              <th>Aralin</th>
              <th>Week</th>
              <th>Date</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            {feedbacks.map((feedback, index) => (
              <tr key={index}>
                <td>{feedback.teacher}</td>
                <td>{feedback.subject}</td>
                <td>{feedback.week}</td>
                <td>{feedback.date}</td>
                <td>
                  <button 
                    className="view-pdf-btn"
                    onClick={() => viewPdf(feedback.pdfUrl)}
                  >
                    <FaFilePdf /> View Report
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Modal PDF Viewer */}
      {selectedPdf && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          width: '100vw',
          height: '100vh',
          background: 'rgba(0,0,0,0.6)',
          zIndex: 2000,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}>
          <div style={{
            background: '#fff',
            borderRadius: 16,
            boxShadow: '0 8px 32px rgba(0,0,0,0.18)',
            padding: 0,
            maxWidth: '90vw',
            width: 900,
            maxHeight: '90vh',
            position: 'relative',
            display: 'flex',
            flexDirection: 'column',
          }}>
            <button
              onClick={closePdf}
              style={{
                position: 'absolute',
                top: 12,
                right: 18,
                background: '#F3C922',
                border: 'none',
                borderRadius: 6,
                padding: '6px 16px',
                fontWeight: 600,
                cursor: 'pointer',
                zIndex: 10,
                fontSize: 18
              }}
            >
              Close
            </button>
            <iframe
              src={selectedPdf}
              title="Progress Report PDF"
              width="100%"
              height="600px"
              style={{ border: 'none', borderRadius: '0 0 16px 16px', marginTop: 0 }}
              allow="autoplay"
            />
          </div>
        </div>
      )}
    </div>
  );
};

export default Feedback;
