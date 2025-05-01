// src/pages/Teachers/StudentDetails.jsx
import React, { useState, useRef } from 'react';
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
import '../../../css/Teachers/StudentDetails.css';
// This will be used to export PDF in a real implementation
// import { jsPDF } from 'jspdf';

const StudentDetails = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const progressReportRef = useRef(null);
  
  const student = location.state?.student || {
    id: 'STD-5432',
    name: 'Alex Thompson',
    age: 10,
    gradeLevel: 'Grade 4',
    gender: 'Male',
    readingLevel: 'Antas 3',
    address: '123 Learning Street, Education City',
    parent: 'Sarah Thompson',
    parentEmail: 'sarah.thompson@example.com',
    contactNumber: '(555) 123-4567',
    section: '4-A',
    siblings: [
      {
        id: 'STD-5435',
        name: 'Max Thompson',
        age: 8,
        gradeLevel: 'Grade 2',
        section: '2-B',
        readingLevel: 'Antas 2'
      },
      {
        id: 'STD-5438',
        name: 'Emma Thompson',
        age: 6,
        gradeLevel: 'Grade 1',
        section: '1-A',
        readingLevel: 'Antas 1'
      }
    ]
  };
  
  // Learning activities data
  const learningActivities = [
    {
      id: 'LA-001',
      name: 'Panghalip Panao',
      description: 'Pagsasanay sa pagtukoy at paggamit ng panghalip panao',
      completed: true,
      minimalSupport: true,
      moderateSupport: false,
      extensiveSupport: false,
      remarks: `${student.name} ay nakatukoy ng mga panghalip na panao ngunit nahihirapan pa sa paggamit ng mga ito sa pangungusap.`
    },
    {
      id: 'LA-002',
      name: 'Mga Salita na may Diptonggo',
      description: 'Pagkilala at pagbasa ng mga salitang may diptonggo',
      completed: true,
      minimalSupport: false,
      moderateSupport: true,
      extensiveSupport: false,
      remarks: `${student.name} ay nakakabasa ng mga salitang may diptonggo ngunit kailangan pa ng tulong sa pagbigkas nang maayos.`
    },
    {
      id: 'LA-003',
      name: 'Maikling Kuwento: Pag-unawa',
      description: 'Pag-unawa sa binasang maikling kuwento',
      completed: false,
      minimalSupport: false,
      moderateSupport: false,
      extensiveSupport: true, 
      remarks: `${student.name} ay nahihirapan sa pagsagot ng mga tanong tungkol sa kuwento. Kailangan ng karagdagang pagsasanay sa pag-unawa.`
    },
    {
      id: 'LA-004',
      name: 'Mga Kayarian ng Pangungusap',
      description: 'Pagsasanay sa kayarian ng pangungusap',
      completed: false,
      minimalSupport: true,
      moderateSupport: false,
      extensiveSupport: false,
      remarks: `${student.name} ay nagsisimulang maintindihan ang mga simpleng kayarian ng pangungusap.`
    }
  ];
  
  // Default progress report based on template
  const defaultProgress = {
    schoolYear: '2024-2025',
    reportDate: '2025-04-01',
    recommendations: [
      `${student.name} ay patuloy na nagpapaunlad ng kanyang kasanayan sa pagsulat. Maaaring kailangan niya ng karagdagang pagsasanay at suporta upang mapahusay ang kanyang pagsulat at kontrol sa paggamit ng maliliit na bagay.`,
      `Hinihikayat ko siyang magsanay sa pagpapalakas ng kanyang fine motor skills tulad ng paggamit ng gunting at tamang paghawak ng lapis. Ang patuloy na pagsasanay sa bahay ay makakatulong upang mapahusay ang kanyang kontrol at katumpakan.`,
      `Kailangan niyang mag-focus sa pagpapaunlad ng mas mahusay na kontrol sa kanyang fine motor movements, tulad ng pagkulay sa loob ng mga linya at tamang paghawak habang nagsusulat. Ang patuloy na pagsasanay at paggabay ay susuporta sa kanyang pag-unlad sa larangan na ito.`
    ]
  };

  // State for progress report
  const [progressReport, setProgressReport] = useState(defaultProgress);
  
  // State for learning activities
  const [activities, setActivities] = useState(learningActivities);
  
  // State for feedback message
  const [feedbackMessage, setFeedbackMessage] = useState({
    subject: 'Pag-unlad ni ' + student.name,
    content: `Mahal na ${student.parent},\n\nIpinaaabot ko ang pag-unlad ni ${student.name} sa aming mga gawain sa pagbasa at pag-unawa. Si ${student.name} ay masigasig na nagtatrabaho para mapabuti ang kanyang kasanayan sa pagbasa, lalo na sa pagkilala ng mga tunog at pattern ng letra.\n\nAng ulat ng pag-unlad ay nakalakip para sa detalyadong impormasyon tungkol sa kanyang pag-unlad. Kung mayroon kayong mga katanungan o alalahanin, huwag mag-atubiling makipag-ugnayan.\n\nLubos na gumagalang,\nGuro Claire`
  });
  
  // State for showing progress report modal
  const [showProgressReport, setShowProgressReport] = useState(false);
  
  // State for editing feedback
  const [isEditingFeedback, setIsEditingFeedback] = useState(false);
  
  // State for showing siblings
  const [showingSiblings, setShowingSiblings] = useState(true);
  
  // State for including progress report
  const [includeProgressReport, setIncludeProgressReport] = useState(true);
  
  // Handle save feedback
  const handleSaveFeedback = () => {
    setIsEditingFeedback(false);
    // Here you would typically send the message to the parent
    alert("Mensahe para sa magulang ay na-save na!");
  };
  
  // Handle send report
  const handleSendReport = () => {
    alert("Ulat ng pag-unlad ay ipinadala na sa magulang!");
  };
  
  // Function to render checkbox based on status
  const renderCheckbox = (isChecked) => {
    return (
      <div className={`sdx-checkbox ${isChecked ? 'checked' : ''}`}>
        {isChecked && <span className="sdx-checkmark">✓</span>}
      </div>
    );
  };
  
  // Function to export progress report as PDF
  const exportAsPDF = () => {
    // In a real implementation, this would use jsPDF or similar library
    // to generate a PDF from the progress report content
    alert("Ine-export bilang PDF file...");
    
    // Example of how this might work with jsPDF:
    /*
    const doc = new jsPDF();
    
    // Add content from the progress report
    doc.setFontSize(22);
    doc.text("CRADLE OF LEARNERS", 105, 20, { align: "center" });
    doc.setFontSize(16);
    doc.text("ULAT NG PAG-UNLAD", 105, 30, { align: "center" });
    
    // Add student information
    doc.setFontSize(12);
    doc.text(`Pangalan: ${student.name}`, 20, 50);
    doc.text(`Edad: ${student.age}`, 20, 60);
    doc.text(`Baitang: ${student.gradeLevel}`, 20, 70);
    
    // Add more content...
    
    // Save the PDF
    doc.save(`ulat_ng_pag-unlad_${student.name.replace(/\s+/g, '_')}.pdf`);
    */
  };
  
  // Go back to students list
  const goBack = () => {
    navigate('/teacher/view-student');
  };

  return (
    <div className="sdx-container">
      {/* Header */}
      <div className="sdx-header">
        <button className="sdx-back-btn" onClick={goBack}>
          <FaArrowLeft /> Bumalik
        </button>
        <h1 className="sdx-title">Detalye ng Mag-aaral</h1>
        <div className="sdx-actions">
          <button 
            className="sdx-view-report-btn"
            onClick={() => setShowProgressReport(true)}
          >
            <FaFilePdf /> Tingnan ang Ulat ng Pag-unlad
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
                <span className="sdx-detail-label">Edad</span>
                <span className="sdx-detail-value">{student.age} taong gulang</span>
              </div>
            </div>
            
            <div className="sdx-detail-item">
              <FaSchool className="sdx-detail-icon" />
              <div className="sdx-detail-content">
                <span className="sdx-detail-label">Antas</span>
                <span className="sdx-detail-value">{student.gradeLevel}</span>
              </div>
            </div>
            
            <div className="sdx-detail-item">
              <FaUsers className="sdx-detail-icon" />
              <div className="sdx-detail-content">
                <span className="sdx-detail-label">Seksiyon</span>
                <span className="sdx-detail-value">{student.section}</span>
              </div>
            </div>
          </div>
          
          <div className="sdx-details-column">
            <div className="sdx-detail-item">
              <FaVenusMars className="sdx-detail-icon" />
              <div className="sdx-detail-content">
                <span className="sdx-detail-label">Kasarian</span>
                <span className="sdx-detail-value">{student.gender}</span>
              </div>
            </div>
            
            <div className="sdx-detail-item">
              <FaMapMarkerAlt className="sdx-detail-icon" />
              <div className="sdx-detail-content">
                <span className="sdx-detail-label">Tirahan</span>
                <span className="sdx-detail-value">{student.address}</span>
              </div>
            </div>
            
            <div className="sdx-detail-item">
              <FaUser className="sdx-detail-icon" />
              <div className="sdx-detail-content">
                <span className="sdx-detail-label">Antas ng Pagbabasa</span>
                <span className="sdx-detail-value">{student.readingLevel}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      {/* Parent Information */}
      <div className="sdx-parent-card">
        <h3 className="sdx-section-title">Impormasyon ng Magulang</h3>
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
          <h3 className="sdx-section-title">Mga Kapatid</h3>
       
        </div>
        
        {showingSiblings && (
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
                        <span>{sibling.age} taong gulang</span>
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
              <p className="sdx-no-siblings">Walang nakarehistrong kapatid.</p>
            )}

          </div>
        )}
      </div>
      
      {/* Learning Activities and Progress Section */}
      <div className="sdx-activities-card">
        <h3 className="sdx-section-title">Mga Gawain at Pag-unlad</h3>
        
        <div className="sdx-activities-table">
          <div className="sdx-table-header">
            <div className="sdx-header-cell sdx-activity-name">Aralin</div>
            <div className="sdx-header-cell sdx-activity-completed">Nakumpleto</div>
            <div className="sdx-header-cell sdx-activity-progress-label" colSpan="3">Antas ng Pag-unlad</div>
            <div className="sdx-header-cell sdx-activity-remarks">Mga Puna</div>
          </div>
          
          <div className="sdx-table-subheader">
            <div className="sdx-subheader-cell sdx-placeholder"></div>
            <div className="sdx-subheader-cell sdx-placeholder"></div>
            <div className="sdx-subheader-cell sdx-support-level">Minimal na tulong</div>
            <div className="sdx-subheader-cell sdx-support-level">Katamtamang tulong</div>
            <div className="sdx-subheader-cell sdx-support-level">Malaking tulong</div>
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
        <h3 className="sdx-section-title">Ipadala ang Ulat sa Magulang</h3>
        
        <div className="sdx-message-box">
          <div className="sdx-message-header">
            <div className="sdx-message-subject">
              <label> <strong> Paksa:</strong></label>
              {isEditingFeedback ? (
                <input 
                  type="text"
                  value={feedbackMessage.subject}
                  onChange={(e) => setFeedbackMessage({...feedbackMessage, subject: e.target.value})}
                  className="sdx-subject-input"
                />
              ) : (
                <span>{feedbackMessage.subject}</span>
              )}
            </div>
            <div className="sdx-message-recipient">
              <span>Para kay:</span>
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
                onChange={(e) => setFeedbackMessage({...feedbackMessage, content: e.target.value})}
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
              <span> <strong>Isama ang Ulat ng Pag-unlad </strong></span>
            </label>
          </div>
          
          <div className="sdx-message-actions">
            {isEditingFeedback ? (
              <button 
                className="sdx-save-btn"
                onClick={handleSaveFeedback}
              >
                <FaSave /> I-save ang Mensahe
              </button>
            ) : (
              <button 
                className="sdx-edit-btn"
                onClick={() => setIsEditingFeedback(true)}
              >
                <FaEdit /> I-edit ang Mensahe
              </button>
            )}
            
            <button 
              className="sdx-send-btn"
              onClick={handleSendReport}
              disabled={isEditingFeedback}
            >
              <FaPaperPlane /> Ipadala ang Ulat
            </button>
          </div>
        </div>
      </div>
      
      {/* Progress Report Modal */}
      {showProgressReport && (
        <div className="sdx-modal-overlay" onClick={() => setShowProgressReport(false)}>
          <div className="sdx-modal-content" onClick={e => e.stopPropagation()}>
            <div className="sdx-modal-header">
              <h2 className="sdx-modal-title">Ulat ng Pag-unlad</h2>
              <div className="sdx-modal-actions">
                <button className="sdx-export-btn" onClick={exportAsPDF}>
                  <FaFilePdf /> I-export bilang PDF
                </button>
                <button 
                  className="sdx-close-btn"
                  onClick={() => setShowProgressReport(false)}
                >
                  <FaTimes />
                </button>
              </div>
            </div>
            
            <div className="sdx-modal-body" ref={progressReportRef}>
              {/* Report Header with School Info */}
              <div className="sdx-report-header">
                <img 
                  src="/images/logo.png" 
                  alt="Cradle of Learners Logo" 
                  className="sdx-report-logo" 
                />
                <div className="sdx-report-school-info">
                  <h1 className="sdx-report-school-name">CRADLE OF LEARNERS</h1>
                  <p className="sdx-report-school-tagline">(Inclusive School for Individualized Education), Inc.</p>
                  <p className="sdx-report-school-address">3rd Floor TUCP Bldg. Elliptical Road Corner Maharlika St. Quezon City</p>
                  <p className="sdx-report-school-contact">☎ 8294-7772 | ✉ cradle.of.learners@gmail.com</p>
                </div>
              </div>
              
              {/* Report Title */}
              <div className="sdx-report-title-section">
                <h2 className="sdx-report-main-title">ULAT NG PAG-UNLAD</h2>
                <p className="sdx-report-school-year">S.Y. {progressReport.schoolYear}</p>
              </div>
              
              {/* Student Information */}
              <div className="sdx-report-student-info">
                <div className="sdx-report-info-row">
                  <div className="sdx-report-info-item">
                    <strong>Pangalan:</strong> {student.name}
                  </div>
                  <div className="sdx-report-info-item">
                    <strong>Edad:</strong> {student.age}
                  </div>
                </div>
                <div className="sdx-report-info-row">
                  <div className="sdx-report-info-item">
                    <strong>Baitang:</strong> {student.gradeLevel}
                  </div>
                  <div className="sdx-report-info-item">
                    <strong>Kasarian:</strong> {student.gender}
                  </div>
                </div>
                <div className="sdx-report-info-row">
                  <div className="sdx-report-info-item">
                    <strong>Magulang:</strong> {student.parent}
                  </div>
                  <div className="sdx-report-info-item">
                    <strong>Petsa:</strong> {progressReport.reportDate}
                  </div>
                </div>
              </div>
              
              {/* Progress Table */}
              <div className="sdx-report-progress-table">
                <table className="sdx-report-table">
                  <thead>
                    <tr>
                      <th className="sdx-report-th sdx-report-th-aralin">Aralin</th>
                      <th className="sdx-report-th sdx-report-th-nakumpleto">Nakumpleto</th>
                      <th className="sdx-report-th sdx-report-th-antas" colSpan="3">Antas ng Pag-unlad</th>
                      <th className="sdx-report-th sdx-report-th-puna">Mga Puna</th>
                    </tr>
                    <tr>
                      <th className="sdx-report-th-empty"></th>
                      <th className="sdx-report-th-empty"></th>
                      <th className="sdx-report-th-level">Minimal na tulong</th>
                      <th className="sdx-report-th-level">Katamtamang tulong</th>
                      <th className="sdx-report-th-level">Malaking tulong</th>
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
                <h3 className="sdx-report-section-title">Rekomendasyon</h3>
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
                  <p className="sdx-report-sign-name">Lagda ng Guro</p>
                </div>
                <div className="sdx-report-signature">
                  <div className="sdx-report-sign-line"></div>
                  <p className="sdx-report-sign-name">Lagda ng Punong-guro</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default StudentDetails;