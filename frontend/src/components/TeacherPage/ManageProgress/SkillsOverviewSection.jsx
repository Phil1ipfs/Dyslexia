// src/components/TeacherPage/ManageProgress/SkillsOverviewSection.jsx
import React, { useEffect, useRef } from 'react';
import { FaChartLine, FaChartBar, FaFont, FaHeadphones, FaBook, FaFileAlt, FaComments } from 'react-icons/fa';

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
      icon: <FaChartBar />
    };
    
    const categoryNameLower = typeof categoryName === 'string' ? 
      categoryName.toLowerCase().replace(/[^a-z0-9]/g, '') : '';
    
    switch(categoryNameLower) {
      case 'alphabetknowledge':
        return { 
          label: 'Alphabet Knowledge', 
          description: 'Recognition of uppercase and lowercase letters',
          icon: <FaFont />
        };
      case 'phonologicalawareness':
        return { 
          label: 'Phonological Awareness', 
          description: 'Ability to recognize and work with sounds in spoken language',
          icon: <FaHeadphones />
        };
      case 'wordrecognition':
        return { 
          label: 'Word Recognition', 
          description: 'Ability to recognize and read words accurately',
          icon: <FaBook />
        };
      case 'decoding':
        return { 
          label: 'Decoding', 
          description: 'Ability to apply knowledge of letter-sound relationships',
          icon: <FaFileAlt />
        };
      case 'readingcomprehension':
        return { 
          label: 'Reading Comprehension', 
          description: 'Ability to understand and interpret text content',
          icon: <FaComments />
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
          icon: <FaChartBar />
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

  return (
    <div className="literexia-skills-overview">
      <div className="literexia-skills-header">
        <h3 className="literexia-section-title">
          <FaChartLine className="literexia-section-icon" />
          Mastery Performance Overview
        </h3>
        <div className={`literexia-average-score ${averageSkillLevel.className}`}>
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
              </div>
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