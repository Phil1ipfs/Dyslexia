// src/components/TeacherPage/ManageProgress/SkillsOverviewSection.jsx
import React, { useEffect, useRef } from 'react';
import { 
  FaChartLine, 
  FaChartBar, 
  FaFont, 
  FaHeadphones, 
  FaBook, 
  FaFileAlt, 
  FaComments, 
  FaExclamationTriangle,
  FaArrowRight,
  FaLightbulb
} from 'react-icons/fa';

import '../../../components/TeacherPage/ManageProgress/css/SkillsOverviewSection.css';

const SkillsOverviewSection = ({ categories, animated = false }) => {
  console.log("SkillsOverviewSection received categories:", categories);
  
  const progressBarsRef = useRef({});
  
  useEffect(() => {
    if (!animated || !categories || categories.length === 0) return;
    
    // Animate progress bars after component mounts
    setTimeout(() => {
      categories.forEach(category => {
        const key = typeof category.categoryName === 'string' ? category.categoryName : `category-${Math.random()}`;
        if (progressBarsRef.current[key]) {
          progressBarsRef.current[key].style.width = `${category.score || 0}%`;
        }
      });
    }, 300);
  }, [animated, categories]);
  
  if (!categories || !Array.isArray(categories) || categories.length === 0) {
    console.log("No valid categories to display");
    return (
      <div className="literexia-skills-empty">
        <p>No skills data available for this student.</p>
      </div>
    );
  }

  // Map keys to display labels and determine skill categories
  const getSkillInfo = (categoryName) => {
    if (!categoryName) return {
      label: 'Unknown Category',
      description: 'Reading skill assessment',
      icon: <FaChartBar />,
      errorPatterns: []
    };
    
    const categoryNameLower = typeof categoryName === 'string' ? 
      categoryName.toLowerCase().replace(/[^a-z0-9]/g, '') : '';
    
    switch(categoryNameLower) {
      case 'alphabetknowledge':
        return { 
          label: 'Alphabet Knowledge', 
          description: 'Recognition of uppercase and lowercase letters',
          icon: <FaFont />,
          errorPatterns: [
            { type: 'Uppercase vs. Lowercase', description: 'Difficulty distinguishing uppercase from lowercase letters' },
            { type: 'Similar Letter Forms', description: 'Confusion between similar-looking letters like b/d, p/q, m/w' }
          ],
          questionTypes: ['Patinig (Vowels)', 'Katinig (Consonants)']
        };
      case 'phonologicalawareness':
        return { 
          label: 'Phonological Awareness', 
          description: 'Ability to recognize and work with sounds in spoken language',
          icon: <FaHeadphones />,
          errorPatterns: [
            { type: 'Sound Blending', description: 'Difficulty combining sounds to form words' },
            { type: 'Sound Identification', description: 'Trouble identifying individual sounds in words' }
          ],
          questionTypes: ['Malapantig (Syllables)', 'Tunog (Sounds)']
        };
      case 'wordrecognition':
        return { 
          label: 'Word Recognition', 
          description: 'Ability to recognize and read words accurately',
          icon: <FaBook />,
          errorPatterns: [
            { type: 'Sight Words', description: 'Difficulty with common sight words' },
            { type: 'Word Length', description: 'Struggles with longer, multi-syllable words' }
          ],
          questionTypes: ['Sight Words', 'Regular Words']
        };
      case 'decoding':
        return { 
          label: 'Decoding', 
          description: 'Ability to apply knowledge of letter-sound relationships',
          icon: <FaFileAlt />,
          errorPatterns: [
            { type: 'Letter-Sound Correspondence', description: 'Inconsistent application of letter-sound rules' },
            { type: 'Syllable Patterns', description: 'Difficulty breaking words into syllables' }
          ],
          questionTypes: ['Word', 'Buoin Salita (Word Formation)']
        };
      case 'readingcomprehension':
        return { 
          label: 'Reading Comprehension', 
          description: 'Ability to understand and interpret text content',
          icon: <FaComments />,
          errorPatterns: [
            { type: 'Literal Comprehension', description: 'Difficulty recalling explicit information from text' },
            { type: 'Inferential Comprehension', description: 'Struggles making connections beyond explicit text' }
          ],
          questionTypes: ['Detail Questions', 'Main Idea Questions']
        };
      default:
        // Create a reasonable label from the key
        const label = typeof categoryName === 'string' ?
          categoryName
            .replace(/([A-Z])/g, ' $1')
            .replace(/^./, str => str.toUpperCase())
            .replace(/_/g, ' ') : 
          'Unknown Category';
        
        return { 
          label, 
          description: 'Reading skill assessment',
          icon: <FaChartBar />,
          errorPatterns: []
        };
    }
  };

  // Get skill level classification
  const getSkillLevel = (score) => {
    score = Number(score) || 0;
    if (score >= 85) return { label: 'Mastered', className: 'mastered' };
    if (score >= 70) return { label: 'Proficient', className: 'proficient' };
    if (score >= 50) return { label: 'Developing', className: 'developing' };
    return { label: 'Emerging', className: 'emerging' };
  };

  // Calculate average score
  const calculateAverageScore = () => {
    if (categories.length === 0) return 0;
    const sum = categories.reduce((total, category) => total + (Number(category.score) || 0), 0);
    return Math.round(sum / categories.length);
  };

  const averageScore = calculateAverageScore();
  const averageSkillLevel = getSkillLevel(averageScore);

  // Generate a mock error pattern for demo purposes
  const getErrorPattern = (category) => {
    const skillInfo = getSkillInfo(category.categoryName);
    const score = Number(category.score) || 0;
    
    // Only show error patterns for scores below 75
    if (score >= 75 || !skillInfo.errorPatterns || skillInfo.errorPatterns.length === 0) {
      return null;
    }
    
    // Select an error pattern based on score
    const patternIndex = score < 50 ? 0 : 1;
    return skillInfo.errorPatterns[patternIndex % skillInfo.errorPatterns.length];
  };

  return (
    <div className="literexia-skills-overview">
      <div className="literexia-skills-header">
        <h3 className="literexia-section-title">
          <FaChartLine className="literexia-section-icon" />
          Mastery Performance Overview
        </h3>
        <div className={`literexia-average-scoree ${averageSkillLevel.className}`}>
          <span className="literexia-average-valuee">{averageScore}%</span>
          <span className="literexia-average-label">{averageSkillLevel.label}</span>
        </div>
      </div>

      <div className="literexia-skills-grid">
        {categories.map((category, index) => {
          const categoryName = category.categoryName || `Category ${index + 1}`;
          const skillInfo = getSkillInfo(categoryName);
          const score = Number(category.score) || 0;
          const skillLevel = getSkillLevel(score);
          const errorPattern = getErrorPattern(category);
          
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
                  
                  {skillInfo.questionTypes && skillInfo.questionTypes.length > 0 && (
                    <div className="literexia-skill-question-types">
                      <span className="literexia-skill-question-types-label">Question Types:</span>
                      <div className="literexia-skill-question-types-items">
                        {skillInfo.questionTypes.map((type, i) => (
                          <span key={i} className="literexia-skill-question-type">{type}</span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
                
                <div className="literexia-skill-score">
                  {score}%
                </div>
              </div>
              
              <div className="literexia-skill-bar-container">
                <div 
                  ref={el => progressBarsRef.current[categoryName] = el}
                  className="literexia-skill-bar-fill"
                  style={{ width: animated ? '0%' : `${score}%` }}
                ></div>
                <div className="literexia-skill-level-badge">
                  {skillLevel.label}
                </div>
                
                {/* Add 75% threshold indicator */}
                <div className="literexia-threshold-indicator">
                  <div className="literexia-threshold-line"></div>
                  <div className="literexia-threshold-label">75%</div>
                </div>
              </div>
              
              {/* Error Pattern Section */}
              {errorPattern && (
                <div className="literexia-error-pattern">
                  <div className="literexia-error-pattern-header">
                    <FaExclamationTriangle className="literexia-error-icon" />
                    <span>Error Pattern Detected</span>
                  </div>
                  <div className="literexia-error-pattern-content">
                    <div className="literexia-error-pattern-type">{errorPattern.type}</div>
                    <div className="literexia-error-pattern-description">{errorPattern.description}</div>
                  </div>
                </div>
              )}
              
              {/* Next Assessment Focus */}
              {score < 75 && (
                <div className="literexia-next-focus">
                  <div className="literexia-next-focus-header">
                    <FaLightbulb className="literexia-next-focus-icon" />
                    <span>Next Assessment Focus</span>
                  </div>
                  <div className="literexia-next-focus-content">
                    <div className="literexia-next-focus-description">
                      <FaArrowRight className="literexia-next-focus-arrow" />
                      {score < 50 
                        ? `Focus on basic ${skillInfo.label} skills and concepts` 
                        : `Work on improving specific ${skillInfo.label} weaknesses`}
                    </div>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
      
      <div className="literexia-skills-legend">
        <div className="literexia-legend-title">Mastery Levels:</div>
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