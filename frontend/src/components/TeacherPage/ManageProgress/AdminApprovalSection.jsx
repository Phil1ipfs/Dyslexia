import React, { useState } from 'react';
import { 
  FaInfoCircle, 
  FaHistory, 
  FaThumbsUp, 
  FaThumbsDown, 
  FaExclamationTriangle,
  FaCheckCircle,
  FaSpinner
} from 'react-icons/fa';
import '../ManageProgress/css/AdminApprovalSection.css';

const AdminApprovalSection = ({ recommendations }) => {
  const [approvingStatus, setApprovingStatus] = useState({});
  
  if (!recommendations || recommendations.length === 0) {
    return (
      <div className="literexia-empty-state">
        <div className="literexia-empty-icon">
          <FaInfoCircle />
        </div>
        <h3>Walang Nakabinbing Pag-apruba</h3>
        <p>Ang anumang mga na-edit na aktibidad na nangangailangan ng pag-apruba ng admin ay lilitaw dito.</p>
      </div>
    );
  }
  
  // Get CSS class for category
  const getCategoryClass = (category) => {
    switch(category) {
      case 'Patinig':
        return 'literexia-patinig';
      case 'Pantig':
        return 'literexia-pantig';
      case 'Pagkilala ng Salita':
        return 'literexia-salita';
      case 'Pag-unawa sa Binasa':
        return 'literexia-pag-unawa';
      default:
        return '';
    }
  };
  
  // Format date string
  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    
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
  
  // Toggle approval status - In a real implementation, this would be an API call
  const toggleApprovalStatus = (id, status) => {
    setApprovingStatus({
      ...approvingStatus,
      [id]: status
    });
    
    // Simulate API call delay
    setTimeout(() => {
      setApprovingStatus({
        ...approvingStatus,
        [id]: 'completed'
      });
    }, 1500);
  };
  
  return (
    <div className="literexia-approval-content">
      <div className="literexia-approval-info">
        <div className="literexia-info-icon">
          <FaInfoCircle />
        </div>
        <div className="literexia-info-text">
          <h3>Proseso ng Pag-apruba ng Admin</h3>
          <p>
            Kapag binago mo ang isang aktibidad upang mas mapaglingkuran ang mga pangangailangan 
            ng isang mag-aaral, ang mga pagbabago ay dapat aprubahan ng isang administrator 
            bago ito maitakda sa mag-aaral. Ito ay nagsisiguro ng kalidad at pagsunod 
            sa kurikulum.
          </p>
          <p>
            Ipinapakita sa ibaba ang status ng iyong mga kahilingan sa pag-apruba. 
            Kapag naaprubahan na, maaari mong italaga ang mga binagong aktibidad sa mag-aaral.
          </p>
        </div>
      </div>
      
      <div className="literexia-approval-list">
        {recommendations.map((item) => (
          <div key={item.id} className="literexia-approval-item">
            <div className={`literexia-approval-icon ${getCategoryClass(item.category)}`}>
              <FaHistory />
            </div>
            
            <div className="literexia-approval-details">
              <div className="literexia-approval-header">
                <div className="literexia-approval-title-container">
                  <h4 className="literexia-approval-title">{item.title}</h4>
                  <div className="literexia-approval-meta">
                    <span className="literexia-category-badge">{item.category}</span>
                    <span className="literexia-approval-date">
                      Isinumite: {formatDate(item.submittedAt || item.lastModified)}
                    </span>
                    <span className="literexia-status-badge">Nakabinbing Pag-apruba</span>
                  </div>
                </div>
              </div>
              
              <div className="literexia-skill-bar-container">
                <div className="literexia-skill-label">
                  <span>Orihinal na Iskor:</span>
                  <span className="literexia-skill-score">{item.score}%</span>
                </div>
                
                <div className="literexia-skill-bar-wrapper">
                  <div 
                    className={`literexia-skill-bar-fill ${getCategoryClass(item.category)}`} 
                    style={{ width: `${item.score}%` }}>
                  </div>
                </div>
              </div>
              
              <div className="literexia-changes-section">
                <h5 className="literexia-changes-title">
                  <FaHistory /> Mga Ginawang Pagbabago
                </h5>
                <ul className="literexia-changes-list">
                  {item.changes ? (
                    item.changes.map((change, index) => (
                      <li key={index} className="literexia-change-item">{change}</li>
                    ))
                  ) : (
                    <>
                      <li className="literexia-change-item">Binago ang antas ng kahirapan ng mga tanong</li>
                      <li className="literexia-change-item">Nagdagdag ng mas madaling maa-access na wika</li>
                      <li className="literexia-change-item">Na-update ang mga visual aid para sa mas mahusay na pag-unawa</li>
                    </>
                  )}
                </ul>
              </div>
              
              <div className="literexia-approval-actions">
                <h5 className="literexia-actions-title">Mga Aksyon sa Pag-apruba</h5>
                <div className="literexia-action-buttons">
                  {!approvingStatus[item.id] && (
                    <>
                      <button 
                        className="literexia-approve-btn"
                        onClick={() => toggleApprovalStatus(item.id, 'approving')}
                      >
                        <FaThumbsUp /> Aprubahan
                      </button>
                      <button 
                        className="literexia-reject-btn"
                        onClick={() => toggleApprovalStatus(item.id, 'rejecting')}
                      >
                        <FaThumbsDown /> Hindi Aprubahan
                      </button>
                    </>
                  )}
                  
                  {approvingStatus[item.id] === 'approving' && (
                    <div className="literexia-status-message literexia-approving">
                      <FaSpinner className="literexia-spinner" /> Inaprubahan...
                    </div>
                  )}
                  
                  {approvingStatus[item.id] === 'rejecting' && (
                    <div className="literexia-status-message literexia-rejecting">
                      <FaSpinner className="literexia-spinner" /> Hindi Inaprubahan...
                    </div>
                  )}
                  
                  {approvingStatus[item.id] === 'completed' && (
                    <div className="literexia-status-message literexia-completed">
                      <FaCheckCircle /> Kumpleto na ang aksyon!
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default AdminApprovalSection;