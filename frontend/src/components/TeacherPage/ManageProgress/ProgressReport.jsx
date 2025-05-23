// src/components/TeacherPage/ManageProgress/ProgressReport.jsx
import React, { useState, useEffect, useRef } from 'react';
import { 
  FaInfoCircle, 
  FaBookOpen, 
  FaChartLine, 
  FaCheckCircle, 
  FaBrain,
  FaCalendarAlt,
  FaFilter,
  FaArrowRight,
  FaBook,
  FaListAlt,
  FaQuestionCircle,
  FaCheck,
  FaPercentage,
  FaTag
} from 'react-icons/fa';

import SkillsOverviewSection from './SkillsOverviewSection';

import '../../../components/TeacherPage/ManageProgress/css/ProgressReport.css';

const ProgressReport = ({ progressData, learningObjectives, setLearningObjectives }) => {
  console.log("ProgressReport received data:", progressData);
  
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [animated, setAnimated] = useState(false);
  const animatedRef = useRef(false);
  
  useEffect(() => {
    if (animatedRef.current) return;
    
    const timer = setTimeout(() => {
      setAnimated(true);
      animatedRef.current = true;
      
      // Animate counters on page load
      const counters = document.querySelectorAll('.counter');
      counters.forEach(counter => {
        const target = parseInt(counter.getAttribute('data-target') || 0, 10);
        const duration = 1500; // milliseconds
        const startTime = performance.now();
        
        function updateCounter(currentTime) {
          const elapsedTime = currentTime - startTime;
          
          if (elapsedTime < duration) {
            const progress = elapsedTime / duration;
            const currentValue = Math.ceil(progress * target);
            counter.textContent = currentValue;
            requestAnimationFrame(updateCounter);
          } else {
            counter.textContent = target;
          }
        }
        
        requestAnimationFrame(updateCounter);
      });
    }, 300);
    
    return () => clearTimeout(timer);
  }, []);
  
  // Check if we have valid category results data
  const hasCategoryResults = progressData && 
    progressData.categories && 
    Array.isArray(progressData.categories) && 
    progressData.categories.length > 0;
  
  if (!progressData) {
    console.log("No progress data provided");
    return (
      <div className="literexia-empty-state">
        <FaInfoCircle size={40} />
        <h3>No Progress Data</h3>
        <p>No progress data available for this student. They may not have completed any assessment yet.</p>
      </div>
    );
  }
  
  // Calculate progress metrics from category results
  const calculateCompletionRate = () => {
    if (!hasCategoryResults) return 0;
    
    // Count passed categories
    const passedCategories = progressData.categories.filter(cat => cat.isPassed).length;
    return Math.round((passedCategories / progressData.categories.length) * 100);
  };
  
  // Format date for display
  const formatDate = (dateString) => {
    if (!dateString) return "Not available";
    
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
  
  // Calculate completion rate and other metrics
  const completionRate = calculateCompletionRate();
  const totalQuestions = hasCategoryResults ? 
    progressData.categories.reduce((total, category) => total + (Number(category.totalQuestions) || 0), 0) : 0;
  const correctAnswers = hasCategoryResults ? 
    progressData.categories.reduce((total, category) => total + (Number(category.correctAnswers) || 0), 0) : 0;
  const passedCategories = hasCategoryResults ? 
    progressData.categories.filter(cat => cat.isPassed).length : 0;
  const totalCategories = hasCategoryResults ? 
    progressData.categories.length : 0;
  const assessmentDate = formatDate(progressData.assessmentDate || progressData.createdAt);
  const readingLevel = progressData.readingLevel || "Not Assessed";
  
  // Calculate overall score - either use the one from the API or calculate
  const overallScore = progressData.overallScore || (hasCategoryResults ? 
    Math.round(progressData.categories.reduce((total, category) => total + (Number(category.score) || 0), 0) / totalCategories) : 0);
  
  console.log("Progress metrics calculated:", {
    completionRate,
    totalQuestions,
    correctAnswers,
    passedCategories,
    totalCategories,
    overallScore
  });
  
  return (
    <div className="literexia-progress-container">
      {/* Progress info section */}
      <div className="literexia-progress-info">
        <div className="literexia-progress-info-icon">
          <FaBrain />
        </div>
        <div className="literexia-progress-info-text">
          <h3>Assessment Progress Report</h3>
          <p>
            This report shows the student's performance based on their assessment
            completed on {assessmentDate}. Current reading level: <strong>{readingLevel}</strong>.
            You can view their performance across the key reading skill categories.
          </p>
        </div>
      </div>
      
      {/* Assessment Summary Cards */}
      <div className="literexia-summary-cards">
        <div className={`literexia-summary-card ${animated ? 'animate' : ''}`} style={{animationDelay: '0s'}}>
          <div className="literexia-card-header">
            <div className="literexia-card-icon">
              <FaCheckCircle />
            </div>
            <div className="literexia-card-value">
              <span className="counter" data-target={completionRate}>{animated ? '0' : completionRate}</span>%
            </div>
          </div>
          <div className="literexia-card-label">Categories Passed ({passedCategories}/{totalCategories})</div>
        </div>
        
        <div className={`literexia-summary-card ${animated ? 'animate' : ''}`} style={{animationDelay: '0.1s'}}>
          <div className="literexia-card-header">
            <div className="literexia-card-icon">
              <FaChartLine />
            </div>
            <div className="literexia-card-value">
              <span className="counter" data-target={overallScore}>{animated ? '0' : overallScore}</span>%
            </div>
          </div>
          <div className="literexia-card-label">Average Score</div>
        </div>
        
        <div className={`literexia-summary-card ${animated ? 'animate' : ''}`} style={{animationDelay: '0.2s'}}>
          <div className="literexia-card-header">
            <div className="literexia-card-icon">
              <FaBookOpen />
            </div>
            <div className="literexia-card-value">
              <span className="counter" data-target={correctAnswers}>{animated ? '0' : correctAnswers}</span>/{totalQuestions}
            </div>
          </div>
          <div className="literexia-card-label">Correct Answers</div>
        </div>
        
        <div className={`literexia-summary-card ${animated ? 'animate' : ''}`} style={{animationDelay: '0.3s'}}>
          <div className="literexia-card-header">
            <div className="literexia-card-icon">
              <FaCalendarAlt />
            </div>
            <div className="literexia-card-value">{readingLevel}</div>
          </div>
          <div className="literexia-card-label">Reading Level</div>
        </div>
      </div>
      
      {/* Optional: Filter section */}
      {hasCategoryResults && (
        <div className="literexia-filters">
          <div className="literexia-filter-header">
            <FaFilter /> <span>Filter Results</span>
          </div>
          <div className="literexia-filter-group">
            <label htmlFor="categoryFilter">Category:</label>
            <select 
              id="categoryFilter" 
              className="literexia-filter-select"
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
            >
              <option value="all">All Categories</option>
              {progressData.categories.map((category, index) => {
                // Format category name for display
                const categoryName = category.categoryName || `Category ${index + 1}`;
                const displayName = typeof categoryName === 'string' ?
                  categoryName
                    .replace(/_/g, ' ')
                    .replace(/\b\w/g, l => l.toUpperCase()) :
                  `Category ${index + 1}`;
                  
                return (
                  <option key={index} value={categoryName}>
                    {displayName}
                  </option>
                );
              })}
            </select>
          </div>
        </div>
      )}
      
      {/* Category Results Table */}
      {hasCategoryResults && (
        <div className="literexia-category-results">
          <h3 className="literexia-section-title">
            <FaChartLine className="literexia-section-icon" /> 
            Category Performance
          </h3>
          
          <div className="literexia-category-table-container">
            <table className="literexia-category-tablee">
              <thead>
                <tr>
                  <th>
                    <span className="th-content">
                      <FaTag className="th-icon" /> Category
                    </span>
                  </th>
                  <th>
                    <span className="th-content">
                      <FaQuestionCircle className="th-icon" /> Questions
                    </span>
                  </th>
                  <th>
                    <span className="th-content">
                      <FaCheck className="th-icon" /> Correct
                    </span>
                  </th>
                  <th>
                    <span className="th-content">
                      <FaPercentage className="th-icon" /> Score
                    </span>
                  </th>
                  <th>
                    <span className="th-content">
                      <FaChartLine className="th-icon" /> Status
                    </span>
                  </th>
                </tr>
              </thead>
              <tbody>
                {progressData.categories
                  .filter(cat => selectedCategory === 'all' || cat.categoryName === selectedCategory)
                  .map((category, index) => {
                    // Format category name for display
                    const categoryName = category.categoryName || `Category ${index + 1}`;
                    const displayName = typeof categoryName === 'string' ?
                      categoryName
                        .replace(/_/g, ' ')
                        .replace(/\b\w/g, l => l.toUpperCase()) :
                      `Category ${index + 1}`;
                    
                    const score = Number(category.score) || 0;
                    const isPassed = category.isPassed || score >= 75;
                      
                    return (
                      <tr key={index} className={animated ? 'animate' : ''} style={{animationDelay: `${0.1 * index}s`}}>
                        <td>
                          <span className="literexia-category-label">
                            {displayName}
                          </span>
                        </td>
                        <td>{Number(category.totalQuestions) || 0}</td>
                        <td>{Number(category.correctAnswers) || 0}</td>
                        <td>
                          <span className="literexia-score-badgeee">
                            {score}%
                          </span>
                        </td>
                        <td>
                          <span className={`literexia-status-badge ${isPassed ? 'achieved' : 'in-progress'}`}>
                            {isPassed ? 'Achieved' : 'In Progress'}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
              </tbody>
            </table>
          </div>
        </div>
      )}
      
      {/* Skills Overview Section - explicitly pass categories */}
      {hasCategoryResults && (
        <SkillsOverviewSection 
          categories={progressData.categories} 
          animated={animated} 
        />
      )}
      

    </div>
  );
};

export default ProgressReport;