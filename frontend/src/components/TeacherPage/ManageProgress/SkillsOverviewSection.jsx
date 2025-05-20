import React, { useEffect, useRef } from 'react';
import { FaChartLine, FaChartBar } from 'react-icons/fa';
import './css/SkillsOverviewSection.css';

const SkillsOverviewSection = ({ scores, animated = false }) => {
  const progressBarsRef = useRef({});
  
  useEffect(() => {
    if (!animated) return;
    
    // Animate progress bars after component mounts
    Object.entries(scores).forEach(([key, value]) => {
      if (progressBarsRef.current[key]) {
        progressBarsRef.current[key].style.width = `${value}%`;
      }
    });
  }, [animated, scores]);
  
  if (!scores || Object.keys(scores).length === 0) {
    return (
      <div className="literexia-skills-empty">
        <p>No skills data available for this student.</p>
      </div>
    );
  }

  // Map keys to display labels and determine skill categories
  const getSkillInfo = (key) => {
    switch(key) {
      case 'Alphabet Knowledge':
        return { 
          label: 'Alphabet Knowledge', 
          description: 'Recognition of uppercase and lowercase letters',
          icon: <FaChartBar />
        };
      case 'Phonological Awareness':
        return { 
          label: 'Phonological Awareness', 
          description: 'Ability to recognize and work with sounds in spoken language',
          icon: <FaChartBar />
        };
      case 'Word Recognition':
        return { 
          label: 'Word Recognition', 
          description: 'Ability to recognize and read words accurately',
          icon: <FaChartBar />
        };
      case 'Decoding':
        return { 
          label: 'Decoding', 
          description: 'Ability to apply knowledge of letter-sound relationships',
          icon: <FaChartBar />
        };
      case 'Reading Comprehension':
        return { 
          label: 'Reading Comprehension', 
          description: 'Ability to understand and interpret text content',
          icon: <FaChartBar />
        };
      default:
        // Create a reasonable label from the key
        const label = key
          .replace(/([A-Z])/g, ' $1')
          .replace(/^./, str => str.toUpperCase());
        
        return { 
          label: key, 
          description: 'Reading skill assessment',
          icon: <FaChartBar />
        };
    }
  };

  // Get skill level classification
  const getSkillLevel = (score) => {
    if (score >= 85) return { label: 'Mastered', className: 'mastered' };
    if (score >= 70) return { label: 'Proficient', className: 'proficient' };
    if (score >= 50) return { label: 'Developing', className: 'developing' };
    return { label: 'Emerging', className: 'emerging' };
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
        <h3 className="literexia-section-title">
          <FaChartLine className="literexia-section-icon" />
          Skill Performance Overview
        </h3>
        <div className={`literexia-average-score ${averageSkillLevel.className}`}>
          <span className="literexia-average-value">{averageScore}%</span>
          <span className="literexia-average-label">{averageSkillLevel.label}</span>
        </div>
      </div>

      <div className="literexia-skills-grid">
        {Object.entries(scores).map(([key, value], index) => {
          const skillInfo = getSkillInfo(key);
          const skillLevel = getSkillLevel(value);
          
          return (
            <div 
              key={index} 
              className={`literexia-skill-card ${animated ? 'animate' : ''}`} 
              style={{animationDelay: `${0.1 * index}s`}}
            >
              <div className="literexia-skill-content">
                <div className="literexia-skill-icon-container">
                  {skillInfo.icon}
                </div>
                
                <div className="literexia-skill-info">
                  <h4 className="literexia-skill-name">{skillInfo.label}</h4>
                  <div className="literexia-skill-description">{skillInfo.description}</div>
                </div>
                
                <div className="literexia-skill-score">
                  {value}%
                </div>
              </div>
              
              <div className="literexia-skill-bar-container">
                <div 
                  ref={el => progressBarsRef.current[key] = el}
                  className="literexia-skill-bar-fill"
                  style={{ width: animated ? `${value}%` : '0%' }}
                  data-value={value}
                ></div>
                {/* Only show the Emerging label directly, no markers */}
                <div className="literexia-skill-level-badge">
                  {skillLevel.label}
                </div>
              </div>
            </div>
          );
        })}
      </div>
      
      <div className="literexia-skills-legend">
        <div className="literexia-legend-title">Skill Levels:</div>
        <div className="literexia-legend-items">
          <div className="literexia-legend-item">
            <span className="literexia-legend-marker mastered"></span>
            <span className="literexia-legend-label">Mastered (85-100%)</span>
          </div>
          <div className="literexia-legend-item">
            <span className="literexia-legend-marker proficient"></span>
            <span className="literexia-legend-label">Proficient (70-84%)</span>
          </div>
          <div className="literexia-legend-item">
            <span className="literexia-legend-marker developing"></span>
            <span className="literexia-legend-label">Developing (50-69%)</span>
          </div>
          <div className="literexia-legend-item">
            <span className="literexia-legend-marker emerging"></span>
            <span className="literexia-legend-label">Emerging (0-49%)</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SkillsOverviewSection;