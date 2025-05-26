// src/pages/Teachers/StudentProgressPDF.jsx
import React, { useEffect, useRef } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import cradleLogo from '../../assets/images/Teachers/cradleLogo.jpg';
import '../../css/Teachers/StudentDetails.css';

const StudentProgressPDF = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const reportRef = useRef(null);

  const { student, progressReport, activities } = location.state || {};

  useEffect(() => {
    if (!student || !activities) {
      alert('Missing report data.');
      navigate('/teacher/view-student');
    }
  }, [student, activities, navigate]);

  const getReadingLevelClass = (level) => {
    const classMap = {
      'Low Emerging': 'reading-level-early',
      'High Emerging': 'reading-level-early', 
      'Developing': 'reading-level-developing',
      'Transitioning': 'reading-level-developing',
      'At Grade Level': 'reading-level-fluent',
      'Advanced': 'reading-level-advanced'
    };
    return classMap[level] || 'reading-level-not-assessed';
  };

  const getReadingLevelDescription = (level) => {
    const descriptions = {
      'Low Emerging': 'Beginning to recognize letters and sounds',
      'High Emerging': 'Developing letter-sound connections',
      'Developing': 'Building phonemic awareness and basic vocabulary',
      'Transitioning': 'Building reading comprehension skills',
      'At Grade Level': 'Can read and comprehend grade-level text',
      'Advanced': 'Reading above grade level with strong comprehension'
    };
    return descriptions[level] || 'Not yet assessed - Needs initial assessment';
  };

  const exportToPDF = async () => {
    const element = reportRef.current;
    if (!element) return;
  
    try {
      const canvas = await html2canvas(element, {
        scale: 2,         // good looking text
        useCORS: true,
        scrollY: -window.scrollY   // grab full page even if modal is scrolled
      });
  
      const imgData   = canvas.toDataURL('image/png');
      const pdf       = new jsPDF('p', 'mm', 'a4');
      const pdfW      = pdf.internal.pageSize.getWidth();
      const pdfH      = pdf.internal.pageSize.getHeight();
  
      // image dimensions *inside* the PDF
      const imgW      = pdfW;
      const imgH      = (canvas.height * imgW) / canvas.width;
  
      let yOffset     = 0;        // current y‑offset (negative after 1st page)
      let remainingH  = imgH;     // how much of the image is still not on a page yet
  
      // first page
      pdf.addImage(imgData, 'PNG', 0, yOffset, imgW, imgH);
      remainingH -= pdfH;
      yOffset    -= pdfH;         // shift upwards for next slice
  
      // add extra pages while there's still image left
      while (remainingH > 0) {
        pdf.addPage();
        pdf.addImage(imgData, 'PNG', 0, yOffset, imgW, imgH);
        remainingH -= pdfH;
        yOffset    -= pdfH;
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

  return (
    <div className="sdx-container">
      <button className="sdx-export-btn" onClick={exportToPDF} style={{ marginBottom: '1rem' }}>
        Download PDF
      </button>

      <div className="sdx-modal-body" ref={reportRef}>
        {/* HEADER */}
        <div className="sdx-report-header">
          <img src={cradleLogo} alt="Cradle of Learners Logo" className="sdx-report-logo" />
          <div className="sdx-report-school-info">
            <h1 className="sdx-report-school-name">CRADLE OF LEARNERS</h1>
            <p className="sdx-report-school-tagline">(Inclusive School for Individualized Education), Inc.</p>
            <p className="sdx-report-school-address">3rd Floor TUCP Bldg. Elliptical Road Corner Maharlika St. Quezon City</p>
            <p className="sdx-report-school-contact">☎ 8294-7772 | ✉ cradle.of.learners@gmail.com</p>
          </div>
        </div>

        {/* TITLE */}
        <div className="sdx-report-title-section">
          <h2 className="sdx-report-main-title">PROGRESS REPORT</h2>
          <p className="sdx-report-school-year">S.Y. {progressReport?.schoolYear || '2024-2025'}</p>
        </div>

        {/* STUDENT INFO */}
        <div className="sdx-report-student-info">
          <div className="sdx-report-info-row">
            <div className="sdx-report-info-item"><strong>Name:</strong> {student.name}</div>
            <div className="sdx-report-info-item"><strong>Age:</strong> {student.age}</div>
          </div>
          <div className="sdx-report-info-row">
            <div className="sdx-report-info-item"><strong>Grade:</strong> {student.gradeLevel || 'Grade 1'}</div>
            <div className="sdx-report-info-item"><strong>Gender:</strong> {student.gender || 'Not specified'}</div>
          </div>
          <div className="sdx-report-info-row">
            <div className="sdx-report-info-item">
              <strong>Parent:</strong> {
                typeof student.parent === 'string' ? 
                  student.parent : 
                  student.parent && student.parent.name ? 
                    student.parent.name : 'Not registered'
              }
            </div>
            <div className="sdx-report-info-item"><strong>Date:</strong> {progressReport?.reportDate || new Date().toISOString().split('T')[0]}</div>
          </div>
          <div className="sdx-report-info-row">
            <div className="sdx-report-info-item">
              <strong>Reading Level:</strong> {student.readingLevel || 'Not Assessed'}
            </div>
            <div className="sdx-report-info-item">
              <strong>Last Assessment:</strong> {student.lastAssessment || student.lastAssessmentDate || 'Not available'}
            </div>
          </div>
        </div>

        {/* TABLE */}
        <div className="sdx-report-progress-table">
          <table className="sdx-report-table">
            <thead>
              <tr>
                <th className="sdx-report-th">Lesson</th>
                <th className="sdx-report-th">Completed</th>
                <th className="sdx-report-th" colSpan="3">Progress Level</th>
                <th className="sdx-report-th">Remarks</th>
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
              {activities && activities.length > 0 ? (
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

        {/* RECOMMENDATIONS */}
        <div className="sdx-report-recommendations">
          <h3 className="sdx-report-section-title">Recommendations</h3>
          <ul className="sdx-report-rec-list">
            {progressReport?.recommendations?.map((rec, i) => (
              <li key={i} className="sdx-report-rec-item">{rec}</li>
            ))}
          </ul>
        </div>

        {/* SIGNATURE */}
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
  );
};

export default StudentProgressPDF;