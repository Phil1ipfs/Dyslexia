import React, { useState } from 'react';
import '../../css/Parents/Feedback.css';
import { FaFilePdf } from 'react-icons/fa';

const sampleFeedbacks = [
  {
    teacher: 'Ms. Maria L. Santiago',
    subject: 'Filipino',
    date: '2025-04-02',
    week: 'Week 1',
    pdfUrl: '/feedback/math_week1.pdf',
  },
  {
    teacher: 'Mr. John D. DeLemos',
    subject: 'Filipino',
    date: '2025-04-01',
    week: 'Week 2',
    pdfUrl: '/feedback/filipino_week2.pdf',
  },
  {
    teacher: 'Ms. Maria L. Santiago',
    subject: 'Filipino',
    date: '2025-04-01',
    week: 'Week 3',
    pdfUrl: '/feedback/filipino_week3.pdf',
  },
  {
    teacher: 'Mr. John D. DeLemos',
    subject: 'Filipino',
    date: '2025-04-01',
    week: 'Week 4',
    pdfUrl: '/feedback/filipino_week4.pdf',
  },
  {
    teacher: 'Ms. Maria L. Santiago',
    subject: 'Filipino',
    date: '2025-04-01',
    week: 'Week 5',
    pdfUrl: '/feedback/filipino_week5.pdf',
  },
  {
    teacher: 'Ms. Maria L. Santiago',
    subject: 'Filipino',
    date: '2025-04-01',
    week: 'Week 6',
    pdfUrl: '/feedback/filipino_week6.pdf',
  },
  {
    teacher: 'Mr. John D. DeLemos',
    subject: 'Filipino',
    date: '2025-04-01',
    week: 'Week 7',
    pdfUrl: '/feedback/filipino_week7.pdf',
  },
  {
    teacher: 'Mr. John D. DeLemos',
    subject: 'Filipino',
    date: '2025-04-01',
    week: 'Week 8',
    pdfUrl: '/feedback/filipino_week8.pdf',
  },
];

const Feedback = () => {
  const [feedbacks] = useState(sampleFeedbacks);
  const [selectedPdf, setSelectedPdf] = useState(null);

  // Function to handle PDF viewing
  const viewPdf = (pdfUrl) => {
    // Open PDF in a new window/tab
    window.open(pdfUrl, '_blank');
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
    </div>
  );
};

export default Feedback;
