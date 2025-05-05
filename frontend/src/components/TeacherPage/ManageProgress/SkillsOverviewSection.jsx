import React from 'react';
import { FaChartLine, FaChartBar, FaPercent } from 'react-icons/fa';
import '../ManageProgress/css/SkillsOverviewSection.css';

const SkillsOverviewSection = ({ scores }) => {
  if (!scores || Object.keys(scores).length === 0) {
    return (
      <div className="literexia-skills-empty">
        <p>Walang available na datos ng kasanayan para sa mag-aaral na ito.</p>
      </div>
    );
  }

  // Map keys to Filipino labels and determine skill categories
  const getSkillInfo = (key) => {
    switch(key) {
      case 'patinig':
      case 'vowelSound':
        return { 
          label: 'Patinig', 
          description: 'Kakayahan sa pagkilala at pagbigkas ng mga patinig',
          className: 'literexia-patinig',
          icon: <FaChartBar />
        };
      case 'pantig':
      case 'syllableBlending':
        return { 
          label: 'Pantig', 
          description: 'Kakayahan sa pagbuo at paghihiwalay ng mga pantig',
          className: 'literexia-pantig',
          icon: <FaChartBar />
        };
      case 'pagkilalaNgSalita':
      case 'wordRecognition':
        return { 
          label: 'Pagkilala ng Salita', 
          description: 'Kakayahan sa pagkilala at pagbasa ng mga salita',
          className: 'literexia-salita',
          icon: <FaChartBar />
        };
      case 'pagUnawaSaBinasa':
      case 'readingComprehension':
        return { 
          label: 'Pag-unawa sa Binasa', 
          description: 'Kakayahan sa pag-unawa ng nilalaman ng binasa',
          className: 'literexia-pag-unawa',
          icon: <FaChartBar />
        };
      default:
        return { 
          label: key, 
          description: 'Kasanayan sa pagbasa',
          className: '',
          icon: <FaChartBar />
        };
    }
  };

  // Get skill level classification
  const getSkillLevel = (score) => {
    if (score >= 85) return { label: 'Mahusay', className: 'literexia-excellent' };
    if (score >= 70) return { label: 'Mabuti', className: 'literexia-good' };
    if (score >= 50) return { label: 'Katamtaman', className: 'literexia-average' };
    return { label: 'Nangangailangan ng Pagsasanay', className: 'literexia-needs-improvement' };
  };

  // Calculate average score
  const calculateAverageScore = () => {
    const values = Object.values(scores);
    if (values.length === 0) return 0;
    const sum = values.reduce((total, score) => total + score, 0);
    return Math.round(sum / values.length);
  };

  const averageScore = calculateAverageScore();
  const averageSkillLevel = getSkillLevel(averageScore);

  return (
    <div className="literexia-skills-overview">
      <div className="literexia-skills-header">
        <div className="literexia-skills-title">
          <FaChartLine className="literexia-skills-icon" />
          <h3>Kabuuan ng mga Kasanayan</h3>
        </div>
        <div className={`literexia-average-score ${averageSkillLevel.className}`}>
          <span className="literexia-average-value">{averageScore}<FaPercent className="literexia-percent-icon" /></span>
          <span className="literexia-average-label">{averageSkillLevel.label}</span>
        </div>
      </div>

      <div className="literexia-skills-grid">
        {Object.entries(scores).map(([key, value], index) => {
          const skillInfo = getSkillInfo(key);
          const skillLevel = getSkillLevel(value);
          
          return (
            <div key={index} className="literexia-skill-card">
              <div className="literexia-skill-content">
                <div className={`literexia-skill-icon-container ${skillInfo.className}`}>
                  {skillInfo.icon}
                </div>
                
                <div className="literexia-skill-info">
                  <h4 className="literexia-skill-name">{skillInfo.label}</h4>
                  <div className="literexia-skill-description">{skillInfo.description}</div>
                </div>
                
                <div className={`literexia-skill-score ${skillLevel.className}`}>
                  {value}%
                </div>
              </div>
              
              <div className="literexia-skill-bar-container">
                <div className={`literexia-skill-bar-background ${skillInfo.className}-bg`}></div>
                <div 
                  className={`literexia-skill-bar-fill ${skillInfo.className}-fill`}
                  style={{ width: `${value}%` }}
                ></div>
                <div className="literexia-skill-markers">
                  <div className="literexia-skill-marker" style={{ left: '25%' }}></div>
                  <div className="literexia-skill-marker" style={{ left: '50%' }}></div>
                  <div className="literexia-skill-marker" style={{ left: '75%' }}></div>
                </div>
                <div 
                  className={`literexia-skill-level-badge ${skillLevel.className}`} 
                  style={{ left: `${Math.min(Math.max(value, 15), 85)}%` }}
                >
                  {skillLevel.label}
                </div>
              </div>
            </div>
          );
        })}
      </div>
      
      <div className="literexia-skills-legend">
        <div className="literexia-legend-title">Antas ng Kasanayan:</div>
        <div className="literexia-legend-items">
          <div className="literexia-legend-item">
            <span className="literexia-legend-marker literexia-excellent"></span>
            <span className="literexia-legend-label">Mahusay (85-100%)</span>
          </div>
          <div className="literexia-legend-item">
            <span className="literexia-legend-marker literexia-good"></span>
            <span className="literexia-legend-label">Mabuti (70-84%)</span>
          </div>
          <div className="literexia-legend-item">
            <span className="literexia-legend-marker literexia-average"></span>
            <span className="literexia-legend-label">Katamtaman (50-69%)</span>
          </div>
          <div className="literexia-legend-item">
            <span className="literexia-legend-marker literexia-needs-improvement"></span>
            <span className="literexia-legend-label">Nangangailangan ng Pagsasanay (0-49%)</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SkillsOverviewSection;