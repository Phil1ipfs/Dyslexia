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

  const exportToPDF = async () => {
    const element = progressReportRef?.current || reportRef?.current;  // whichever ref exists
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
  
      // add extra pages while there’s still image left
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
          <p className="sdx-report-school-year">S.Y. {progressReport.schoolYear}</p>
        </div>

        {/* STUDENT INFO */}
        <div className="sdx-report-student-info">
          <div className="sdx-report-info-row">
            <div className="sdx-report-info-item"><strong>Name:</strong> {student.name}</div>
            <div className="sdx-report-info-item"><strong>Age:</strong> {student.age}</div>
          </div>
          <div className="sdx-report-info-row">
            <div className="sdx-report-info-item"><strong>Grade:</strong> {student.gradeLevel}</div>
            <div className="sdx-report-info-item"><strong>Gender:</strong> {student.gender}</div>
          </div>
          <div className="sdx-report-info-row">
            <div className="sdx-report-info-item"><strong>Parent:</strong> {student.parent}</div>
            <div className="sdx-report-info-item"><strong>Date:</strong> {progressReport.reportDate}</div>
          </div>
        </div>

        {/* TABLE */}
        <div className="sdx-report-progress-table">
          <table className="sdx-report-table">
            <thead>
              <tr>
                <th>Lesson</th>
                <th>Completed</th>
                <th colSpan="3">Progress Level</th>
                <th>Remarks</th>
              </tr>
              <tr>
                <th></th>
                <th></th>
                <th>Minimal support</th>
                <th>Moderate support</th>
                <th>Extensive support</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {activities.map((activity, index) => (
                <tr key={index}>
                  <td>{activity.name}</td>
                  <td>{activity.completed ? '✓' : ''}</td>
                  <td>{activity.minimalSupport ? '✓' : ''}</td>
                  <td>{activity.moderateSupport ? '✓' : ''}</td>
                  <td>{activity.extensiveSupport ? '✓' : ''}</td>
                  <td>{activity.remarks}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* RECOMMENDATIONS */}
        <div className="sdx-report-recommendations">
          <h3>Recommendations</h3>
          <ul>
            {progressReport.recommendations.map((rec, i) => (
              <li key={i}>{rec}</li>
            ))}
          </ul>
        </div>

        {/* SIGNATURE */}
        <div className="sdx-report-signatures">
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
