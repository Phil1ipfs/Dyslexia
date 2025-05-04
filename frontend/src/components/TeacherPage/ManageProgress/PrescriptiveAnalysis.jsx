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
  FaHandsHelping,
  FaMobile
} from 'react-icons/fa';
import './css/PrescriptiveAnalysis.css';

const PrescriptiveAnalysis = ({ recommendations, onEditActivity, student }) => {
  if (!recommendations || recommendations.length === 0) {
    return (
      <div className="literexia-empty-state">
        <FaExclamationTriangle className="literexia-empty-icon" />
        <h3>No Recommendations Found</h3>
        <p>The initial assessment needs to be completed first to generate personalized recommendations.</p>
      </div>
    );
  }
  
  // Get category color class
  const getCategoryColorClass = (category) => {
    switch (category) {
      case 'Vowel Sound':
      case 'Patinig':
        return 'literexia-patinig';
      case 'Syllable Blending':
      case 'Pantig':
        return 'literexia-pantig';
      case 'Word Recognition':
      case 'Pagkilala ng Salita':
        return 'literexia-salita';
      case 'Reading Comprehension':
      case 'Pag-unawa sa Binasa':
        return 'literexia-pag-unawa';
      default:
        return '';
    }
  };
  
  // Get status info
  const getStatusInfo = (status) => {
    switch (status) {
      case 'pushed_to_mobile':
        return { class: 'literexia-mobile', text: 'Pushed to Mobile' };
      case 'completed':
        return { class: 'literexia-completed', text: 'Completed' };
      case 'in_progress':
        return { class: 'literexia-in-progress', text: 'In Progress' };
      default:
        return { class: 'literexia-draft', text: 'Draft' };
    }
  };
  
  return (
    <div className="literexia-prescriptive-container">
      {/* Header Section */}
      <div className="literexia-prescriptive-header">
        <div className="literexia-header-icon">
          <FaBrain />
        </div>
        <div className="literexia-head-content">
          <h3>AI-Generated Learning Recommendations</h3>
          <p>
            Based on assessment results and the student's ongoing performance, 
            our system has identified specific learning gaps and generated 
            targeted recommendations to improve their reading skills.
          </p>
        </div>
      </div>
      
      {/* Findings summary */}
      <div className="literexia-summary-section">
        <div className="literexia-summary-header">
          <FaLightbulb className="literexia-summary-icon" />
          <h3>Summary of Findings</h3>
        </div>
        <div className="literexia-summary-content">
          <p>
            Analysis of {student?.name}'s progress data indicates difficulties with 
            <strong> diphthong recognition</strong> and <strong>complex syllable patterns</strong>. 
            Their performance in activities requiring these skills has consistently been 
            below average, with a pattern of errors suggesting phonological 
            processing challenges common in students with dyslexia.
          </p>
          <p>
            Based on their current reading level ({recommendations[0]?.readingLevel || 'Level 2'}) 
            and their specific performance patterns, the system has generated 
            personalized learning recommendations to address these gaps. 
            The activities below are specifically designed to target their 
            weaknesses while building on their existing strengths.
          </p>
        </div>
      </div>
      
      {/* Teacher Implementation Guide */}
      <div className="literexia-teaching-guide">
        <div className="literexia-guide-header">
          <FaChalkboardTeacher className="literexia-guide-icon" />
          <h3>In-Person Teaching Guide</h3>
        </div>
        <div className="literexia-guide-content">
          <p>
            While using the digital activities, we recommend supporting {student?.name} 
            with the following strategies:
          </p>
          <div className="literexia-strategy-list">
            <div className="literexia-strategy">
              <div className="literexia-strategy-icon">
                <FaHandsHelping />
              </div>
              <div className="literexia-strategy-content">
                <h4>Multi-sensory Instruction</h4>
                <p>
                  Use physical letter tiles or cards when working on diphthongs, allowing {student?.name} to see, 
                  touch, and hear the sounds simultaneously.
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
                  Teach {student?.name} to tap syllables with their fingers while reading, 
                  reinforcing the physical connection to syllable patterns.
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
                  Demonstrate how to break longer words into manageable parts, 
                  gradually reducing support as {student?.name}'s confidence increases.
                </p>
              </div>
            </div>
          </div>
          
          <div className="literexia-monitoring-note">
            <strong>Progress Monitoring:</strong> After implementing these interventions for 2-3 weeks, 
            review {student?.name}'s progress and adjust strategies as needed.
          </div>
        </div>
      </div>
      
      {/* Recommended Activities/Interventions */}
      <div className="literexia-interventions">
        <h3 className="literexia-interventions-title">Recommended Interventions</h3>
        
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
                  <div className="literexia-metric-label">Current Score</div>
                  <div className="literexia-metric-value">{rec.score || 60}%</div>
                </div>
                <div className="literexia-metric-arrow">
                  <FaArrowRight />
                </div>
                <div className="literexia-metric">
                  <div className="literexia-metric-label">Target Score</div>
                  <div className="literexia-metric-value">{rec.targetScore || 75}%</div>
                </div>
                <div className="literexia-metric literexia-success-probability">
                  <div className="literexia-metric-label">Success Probability</div>
                  <div className="literexia-metric-value">{rec.successProbability || 85}%</div>
                </div>
              </div>
              
              <div className="literexia-intervention-details">
                <div className="literexia-intervention-analysis">
                  <h5>Analysis</h5>
                  <p>{rec.analysis || rec.rationale || 'No specific analysis provided.'}</p>
                </div>
                
                <div className="literexia-intervention-recommendation">
                  <h5><FaCheckCircle /> Recommendation</h5>
                  <p>{rec.recommendation || 'Provide additional practice activities focusing on this skill area, with immediate feedback and opportunities for correction.'}</p>
                </div>
                
                <div className="literexia-intervention-actions">
                  {rec.status === 'pushed_to_mobile' ? (
                    <div className="literexia-mobile-status">
                      <FaMobile />
                      <span>This activity has been pushed to the student's mobile device</span>
                    </div>
                  ) : (
                    <div className="literexia-action-note">
                      <FaInfoCircle />
                      <span>Editing this activity will create a custom version for this student's specific needs.</span>
                    </div>
                  )}
                  <button
                    className="literexia-edit-activity-btn"
                    onClick={() => onEditActivity(rec)}
                  >
                    <FaEdit /> {rec.status === 'pushed_to_mobile' ? 'Edit Activity' : 'Customize & Push to Mobile'}
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default PrescriptiveAnalysis;