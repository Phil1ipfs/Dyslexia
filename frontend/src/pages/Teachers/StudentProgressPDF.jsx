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

  const { student, progressReport, activities, readingLevelProgress, iepReport } = location.state || {};

  useEffect(() => {
    if (!student) {
      alert('Missing student data.');
      navigate('/teacher/view-student');
    } else {
      console.log("Data received in PDF:", { 
        student, 
        progressReportData: progressReport, 
        activitiesCount: activities?.length || 0,
        readingLevelData: readingLevelProgress,
        iepReportData: iepReport
      });
    }
  }, [student, navigate]);

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

  // Format scores for display
  const formatScoreClass = (score) => {
    if (score >= 80) return 'score-excellent';
    if (score >= 60) return 'score-good';
    if (score >= 40) return 'score-average';
    return 'score-needs-improvement';
  };

  // Format date for display
  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  // Get parent name
  const getParentName = () => {
    if (student.parent && typeof student.parent === 'string') {
      return student.parent;
    }
    
    if (student.parent && student.parent.name) {
      return student.parent.name;
    }
    
    if (student.parentName) {
      return student.parentName;
    }
    
    return 'Parent';
  };
  
  // Format reading level categories for display
  const renderReadingLevelCategories = () => {
    if (!readingLevelProgress || !readingLevelProgress.categories || readingLevelProgress.categories.length === 0) {
      return (
        <div className="sdx-report-td-empty">
          No reading assessment data available.
        </div>
      );
    }
    
    return (
      <div className="sdx-compact-progress">
        {readingLevelProgress.categories.map((category, index) => {
          const score = category.score || 0;
          const correctAnswers = category.correctAnswers || 0;
          const totalQuestions = category.totalQuestions || 0;
          const incorrectAnswers = totalQuestions - correctAnswers;
          const isPassed = category.isPassed || false;
          
          return (
            <div key={index} className="sdx-compact-category">
              <div className="sdx-compact-category-header">
                <span className="sdx-compact-category-name">
                  {category.category || category.categoryName}
                </span>
                <span className="sdx-compact-category-score">
                  {score}%
                </span>
              </div>
              
              <div className="sdx-compact-progress-bar">
                <div 
                  className="sdx-compact-progress-fill"
                  style={{ width: `${score}%` }}
                ></div>
              </div>
              
              <div className="sdx-compact-category-results">
                <div className="sdx-compact-category-answers">
                  <span>✓ {correctAnswers} correct</span>
                  <span>✗ {incorrectAnswers} incorrect</span>
                </div>
                <span className="sdx-compact-status">
                  {isPassed ? 'Passed' : 'Not Passed'}
                </span>
              </div>
            </div>
          );
        })}
      </div>
    );
  };

  // Render learning activities or IEP objectives
  const renderActivitiesTable = () => {
    // Check if we have activities or IEP data
    const hasActivities = activities && activities.length > 0;
    const hasIepObjectives = iepReport && iepReport.objectives && iepReport.objectives.length > 0;
    
    if (!hasActivities && !hasIepObjectives) {
      return (
        <div className="sdx-report-td-empty">
          No learning activities recorded yet.
        </div>
      );
    }
    
    // Decide which data to use (prefer activities, fallback to IEP)
    const itemsToRender = hasActivities ? activities : iepReport.objectives;
    
    return (
      <table className="sdx-report-table">
        <thead>
          <tr>
            <th className="sdx-report-th">Lesson</th>
            <th className="sdx-report-th">Completed</th>
            <th className="sdx-report-th" colSpan="3">Support Level</th>
            <th className="sdx-report-th">Remarks</th>
          </tr>
          <tr>
            <th className="sdx-report-th-empty"></th>
            <th className="sdx-report-th-empty"></th>
            <th className="sdx-report-th-level">Minimal</th>
            <th className="sdx-report-th-level">Moderate</th>
            <th className="sdx-report-th-level">Extensive</th>
            <th className="sdx-report-th-empty"></th>
          </tr>
        </thead>
        <tbody>
          {itemsToRender.map((item, index) => {
            // Handle both activity and IEP objective formats
            const isIepItem = !hasActivities;
            
            // Format the data based on the type
            const name = isIepItem ? item.lesson : item.name;
            const completed = isIepItem ? item.completed : item.completed;
            const minimal = isIepItem ? item.supportLevel === 'minimal' : item.minimalSupport;
            const moderate = isIepItem ? item.supportLevel === 'moderate' : item.moderateSupport;
            const extensive = isIepItem ? item.supportLevel === 'extensive' : item.extensiveSupport;
            const remarks = isIepItem 
              ? (item.remarks || `Student is working on ${item.categoryName} skills.`) 
              : (item.remarks || 'No remarks available');
            
            return (
              <tr key={index} className="sdx-report-tr">
                <td className="sdx-report-td sdx-report-td-aralin">{name}</td>
                <td className="sdx-report-td sdx-report-td-nakumpleto">
                  {completed ? "✓" : ""}
                </td>
                <td className="sdx-report-td sdx-report-td-support">
                  {minimal ? "✓" : ""}
                </td>
                <td className="sdx-report-td sdx-report-td-support">
                  {moderate ? "✓" : ""}
                </td>
                <td className="sdx-report-td sdx-report-td-support">
                  {extensive ? "✓" : ""}
                </td>
                <td className="sdx-report-td sdx-report-td-puna">{remarks}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
    );
  };

  return (
    <div className="sdx-container">
      <button className="sdx-export-btn" onClick={exportToPDF} style={{ marginBottom: '1rem' }}>
        Download PDF
      </button>

      <div className="sdx-report-printable" ref={reportRef}>
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
              <strong>Parent:</strong> {getParentName()}
            </div>
            <div className="sdx-report-info-item"><strong>Date:</strong> {formatDate(progressReport?.reportDate || new Date())}</div>
          </div>
          <div className="sdx-report-info-row">
            <div className="sdx-report-info-item">
              <strong>Reading Level:</strong> {student.readingLevel || 'Not Assessed'}
            </div>
            <div className="sdx-report-info-item">
              <strong>Last Assessment:</strong> {formatDate(student.lastAssessment || student.lastAssessmentDate)}
            </div>
          </div>
        </div>

        {/* Reading Level Progress */}
        <div className="sdx-report-section-title">Reading Level Progress</div>
        {renderReadingLevelCategories()}
        
        <div className="sdx-report-overall-summary">
          <p className="sdx-report-overall-description">
            {student.name} is currently at the <strong>{student.readingLevel || 'Not Assessed'}</strong> reading level. 
            {student.readingLevel && student.readingLevel !== 'Not Assessed' ? 
              ` This means ${getReadingLevelDescription(student.readingLevel).toLowerCase()}.` : 
              ' An assessment is needed to determine the appropriate reading level.'}
          </p>
        </div>

        {/* Progress Table - With Support Levels */}
        <div className="sdx-report-section-title">Learning Progress</div>
        <div className="sdx-report-progress-table">
          {renderActivitiesTable()}
        </div>

        {/* Recommendations */}
        <div className="sdx-report-section-title">Prescriptive Recommendations</div>
        <ul className="sdx-report-rec-list">
          {progressReport?.recommendations?.length > 0 ? 
            progressReport.recommendations.map((rec, i) => (
              <li key={i} className="sdx-report-rec-item">{rec}</li>
            )) : 
            <li className="sdx-report-rec-item">No recommendations available yet.</li>
          }
        </ul>

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
  );
};

export default StudentProgressPDF;