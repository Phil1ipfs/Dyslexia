import React from 'react';
import { 
  FaEdit, 
  FaLightbulb, 
  FaExclamationTriangle, 
  FaCheckCircle,
  FaInfoCircle,
  FaChartLine,
  FaArrowRight,
  FaBrain,
  FaChalkboardTeacher,
  FaHandsHelping
} from 'react-icons/fa';
import '../ManageProgress/css/PrescriptiveAnalysis.css';

const PrescriptiveAnalysis = ({ recommendations, onEditActivity, student }) => {
  if (!recommendations || recommendations.length === 0) {
    return (
      <div className="literexia-empty-state">
        <FaExclamationTriangle className="literexia-empty-icon" />
        <h3>Walang Rekomendasyong Natagpuan</h3>
        <p>Kailangan munang kumpletuhin ang paunang pagsusuri upang makabuo ng mga personalized na rekomendasyon.</p>
      </div>
    );
  }
  
  // Get category color class
  const getCategoryColorClass = (category) => {
    switch (category) {
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
  
  // Get status class and text
  const getStatusInfo = (status) => {
    switch (status) {
      case 'pending_approval':
        return { class: 'literexia-pending', text: 'Nakabinbin ang Pag-apruba' };
      case 'completed':
        return { class: 'literexia-completed', text: 'Nakumpleto' };
      case 'in_progress':
        return { class: 'literexia-in-progress', text: 'Kasalukuyang Ginagawa' };
      default:
        return { class: 'literexia-draft', text: 'Draft' };
    }
  };

  // Text shortening utility
  const shortenText = (text, maxLength = 100) => {
    if (!text || text.length <= maxLength) return text;
    return text.substring(0, maxLength) + '...';
  };
  
  return (
    <div className="literexia-prescriptive-container">
      {/* Header with explanation */}
      <div className="literexia-prescriptive-header">
        <div className="literexia-header-icon">
          <FaBrain />
        </div>
        <div className="literexia-head-content">
          <h3>AI-Generated na mga Rekomendasyon para sa Pag-aaral</h3>
          <p>
            Batay sa resulta ng pagtatasa at patuloy na pagganap ng mag-aaral, 
            ang aming system ay nakakita ng partikular na mga learning gaps 
            at gumawa ng mga targeted na rekomendasyon upang mapabuti ang 
            kanilang mga kasanayan sa pagbasa.
          </p>
        </div>
      </div>
      
      {/* Findings summary */}
      <div className="literexia-summary-section">
        <div className="literexia-summary-header">
          <FaLightbulb className="literexia-summary-icon" />
          <h3>Buod ng mga Natuklasan</h3>
        </div>
        <div className="literexia-summary-content">
          <p>
            Ang pagsusuri sa data ng pag-unlad ni {student?.name} ay nagpapahiwatig na may 
            kahirapan siya sa <strong>pagkilala ng diptonggo</strong> at <strong>kumplikadong 
            pattern ng pantig</strong>. Ang kanyang performance sa mga aktibidad na 
            nangangailangan ng mga kasanayang ito ay patuloy na nasa mababang antas, 
            na may pattern ng mga pagkakamali na nagmumungkahi ng mga hamon sa phonological 
            processing na karaniwan sa mga mag-aaral na may dyslexia.
          </p>
          <p>
            Batay sa kanyang kasalukuyang antas ng pagbasa ({recommendations[0]?.readingLevel || 'Antas 2'}) 
            at sa kanyang mga partikular na pattern ng pagganap, ang system ay bumuo ng mga 
            personalized na rekomendasyon para sa pag-aaral upang matugunan ang mga gaps na ito. 
            Ang mga aktibidad sa ibaba ay partikular na idinisenyo upang tukuyin ang kanyang 
            mga kahinaan habang itinataguyod ang kanyang mga kasalukuyang kalakasan.
          </p>
        </div>
      </div>
      
      {/* Teacher Implementation Guide */}
      <div className="literexia-teaching-guide">
        <div className="literexia-guide-header">
          <FaChalkboardTeacher className="literexia-guide-icon" />
          <h3>Gabay sa Pagtuturo sa Harap-harapan</h3>
        </div>
        <div className="literexia-guide-content">
          <p>
            Habang gumagamit ng mga digital na aktibidad, inirerekomenda na suportahan si {student?.name} 
            gamit ang mga sumusunod na estratehiya:
          </p>
          <div className="literexia-strategy-list">
            <div className="literexia-strategy">
              <div className="literexia-strategy-icon">
                <FaHandsHelping />
              </div>
              <div className="literexia-strategy-content">
                <h4>Multi-sensory na Pagtuturo</h4>
                <p>
                  Gumamit ng mga pisikal na letter tiles o cards kapag 
                  nagtatrabaho sa mga diptonggo, na nagbibigay-daan kay {student?.name} na makita, 
                  mahawakan, at marinig ang mga tunog nang sabay-sabay.
                </p>
              </div>
            </div>
            
            <div className="literexia-strategy">
              <div className="literexia-strategy-icon">
                <FaHandsHelping />
              </div>
              <div className="literexia-strategy-content">
                <h4>Syllable Tapping</h4>
                <p>
                  Turuan si {student?.name} na i-tap ang mga pantig gamit ang kanyang mga daliri 
                  habang nagbabasa, na pinatitibay ang pisikal na koneksyon sa mga pattern ng pantig.
                </p>
              </div>
            </div>
            
            <div className="literexia-strategy">
              <div className="literexia-strategy-icon">
                <FaHandsHelping />
              </div>
              <div className="literexia-strategy-content">
                <h4>Chunking Strategy</h4>
                <p>
                  Ipakita kung paano hatiin ang mas mahahabang salita sa mga makakayanan parts, 
                  at unti-unting bawasan ang suporta habang tumataas ang kumpiyansa ni {student?.name}.
                </p>
              </div>
            </div>
          </div>
          
          <div className="literexia-monitoring-note">
            <strong>Pag-monitor ng Progreso:</strong> Pagkatapos ipatupad ang mga interbensiyon na ito 
            sa loob ng 2-3 linggo, suriin ang progreso ni {student?.name} at ayusin ang mga estratehiya kung kinakailangan.
          </div>
        </div>
      </div>
      
      {/* Recommended Activities/Interventions */}
      <div className="literexia-interventions">
        <h3 className="literexia-interventions-title">Mga Inirerekomendang Interbensyon</h3>
        
        <div className="literexia-interventions-list">
          {recommendations.map((rec) => (
            <div key={rec.id} className="literexia-intervention-card">
              <div className="literexia-intervention-header">
                <div className={`literexia-intervention-icon ${getCategoryColorClass(rec.category)}`}>
                  <FaLightbulb />
                </div>
                <div className="literexia-intervention-title-container">
                  <h4 className="literexia-intervention-title">{rec.title}</h4>
                  <div className="literexia-intervention-category">{rec.category}</div>
                </div>
                <div className={`literexia-intervention-status ${getStatusInfo(rec.status).class}`}>
                  {getStatusInfo(rec.status).text}
                </div>
              </div>
              
              <div className="literexia-intervention-metrics">
                <div className="literexia-metric">
                  <div className="literexia-metric-label">Kasalukuyang Iskor</div>
                  <div className="literexia-metric-value">{rec.score}%</div>
                </div>
                <div className="literexia-metric-arrow">
                  <FaArrowRight />
                </div>
                <div className="literexia-metric">
                  <div className="literexia-metric-label">Target na Iskor</div>
                  <div className="literexia-metric-value">{rec.targetScore}%</div>
                </div>
                <div className="literexia-metric literexia-success-probability">
                  <div className="literexia-metric-label">Posibilidad ng Tagumpay</div>
                  <div className="literexia-metric-value">{rec.successProbability || '85'}%</div>
                </div>
              </div>
              
              <div className="literexia-intervention-details">
                <div className="literexia-intervention-analysis">
                  <h5>Pagsusuri</h5>
                  <p>{rec.analysis || 'Walang partikular na pagsusuri na ibinigay.'}</p>
                </div>
                
                <div className="literexia-intervention-recommendation">
                  <h5><FaCheckCircle /> Rekomendasyon</h5>
                  <p>{rec.recommendation}</p>
                </div>
                
                <div className="literexia-intervention-actions">
                  <div className="literexia-action-note">
                    <FaInfoCircle />
                    <span>Ang pag-edit ng aktibidad na ito ay gagawa ng custom version para sa partikular na pangangailangan ng mag-aaral na ito.</span>
                  </div>
                  <button
                    className="literexia-edit-activity-btn"
                    onClick={() => onEditActivity(rec)}
                    disabled={rec.status === 'pending_approval'}
                  >
                    <FaEdit /> {rec.status === 'pending_approval' ? 'Naghihintay ng Pag-apruba' : 'I-edit ang Aktibidad'}
                  </button>
                </div>
              </div>
              
              {rec.questions && rec.questions.length > 0 && (
                <div className="literexia-intervention-questions">
                  <div className="literexia-questions-preview-header" onClick={() => {
                    // This would toggle questions visibility in a real implementation
                  }}>
                    <h5>Preview ng mga Tanong sa Aktibidad</h5>
                    <span className="literexia-preview-toggle">Ipakita</span>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default PrescriptiveAnalysis;