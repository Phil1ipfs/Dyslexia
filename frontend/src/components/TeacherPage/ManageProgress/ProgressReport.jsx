import React, { useState, useEffect, useRef } from 'react';
import { 
  FaInfoCircle, 
  FaBookOpen, 
  FaChartLine, 
  FaCheckCircle, 
  FaBrain,
  FaCalendarAlt,
  FaFilter,
  FaArrowRight
} from 'react-icons/fa';

import SkillsOverviewSection from './SkillsOverviewSection';
import './css/ProgressReport.css';

const ProgressReport = ({ progressData, assignedLessons }) => {
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [timeRange, setTimeRange] = useState('month');
  const [animated, setAnimated] = useState(false);
  const animatedRef = useRef(false);
  
  // Run animation after component mounts
  useEffect(() => {
    if (animatedRef.current) return;
    
    const timer = setTimeout(() => {
      setAnimated(true);
      animatedRef.current = true;
      
      // Animate counters on page load
      const counters = document.querySelectorAll('.counter');
      counters.forEach(counter => {
        const target = parseInt(counter.textContent, 10);
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
    progressData.categories.length > 0;
  
  if (!progressData) {
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
  
  const getAverageScore = () => {
    if (!hasCategoryResults) return 0;
    
    // Calculate average score across all categories
    const sum = progressData.categories.reduce((total, category) => total + (category.score || 0), 0);
    return Math.round(sum / progressData.categories.length);
  };
  
  const getTotalQuestions = () => {
    if (!hasCategoryResults) return 0;
    
    // Sum up all questions across categories
    return progressData.categories.reduce((total, category) => total + (category.totalQuestions || 0), 0);
  };
  
  const getCorrectAnswers = () => {
    if (!hasCategoryResults) return 0;
    
    // Sum up all correct answers across categories
    return progressData.categories.reduce((total, category) => total + (category.correctAnswers || 0), 0);
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
  
  // Prepare scores object for SkillsOverviewSection
  const prepareScores = () => {
    if (!hasCategoryResults) return null;
    
    const scoreObj = {};
    
    // Map category names to score values
    progressData.categories.forEach(category => {
      // Convert category names without camelCase to match screenshot
      scoreObj[category.categoryName] = category.score || 0;
    });
    
    return scoreObj;
  };
  
  // Calculate completion rate and other metrics
  const completionRate = calculateCompletionRate();
  const averageScore = getAverageScore();
  const totalQuestions = getTotalQuestions();
  const correctAnswers = getCorrectAnswers();
  const passedCategories = hasCategoryResults ? progressData.categories.filter(cat => cat.isPassed).length : 0;
  const totalCategories = hasCategoryResults ? progressData.categories.length : 0;
  const assessmentDate = formatDate(progressData.assessmentDate || progressData.createdAt);
  const readingLevel = progressData.readingLevel || "Not Assigned";
  const scores = prepareScores();
  
  return (
    <div className="literexia-progress-container">
      {/* Progress info section */}
      <div className="literexia-progress-info">
        <div className="literexia-progress-info-icon">
          <FaBrain />
        </div>
        <div className="literexia-progress-info-text">
          <h3>Post Assessment Progress Report</h3>
          <p>
            This report shows the student's performance based on their most recent assessment
            completed on {assessmentDate}. Current reading level: <strong>{readingLevel}</strong>.
            You can view their performance across the five key reading skill categories.
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
              <span className="counter">{completionRate}</span>%
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
              <span className="counter">{averageScore}</span>%
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
              <span className="counter">{correctAnswers}</span>/{totalQuestions}
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
              {progressData.categories.map((category, index) => (
                <option key={index} value={category.categoryName}>
                  {category.categoryName}
                </option>
              ))}
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
            <table className="literexia-category-table">
              <thead>
                <tr>
                  <th>Category</th>
                  <th>Questions</th>
                  <th>Correct</th>
                  <th>Score</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {progressData.categories
                  .filter(cat => selectedCategory === 'all' || cat.categoryName === selectedCategory)
                  .map((category, index) => (
                    <tr key={index} className={animated ? 'animate' : ''} style={{animationDelay: `${0.1 * index}s`}}>
                      <td>
                        <span className="literexia-category-label">
                          {category.categoryName}
                        </span>
                      </td>
                      <td>{category.totalQuestions || 0}</td>
                      <td>{category.correctAnswers || 0}</td>
                      <td>
                        <span className="literexia-score-badgeee">
                          {category.score || 0}%
                        </span>
                      </td>
                      <td>
                        <span className={`literexia-status-badge ${category.isPassed ? 'achieved' : 'in-progress'}`}>
                          {category.isPassed ? 'Achieved' : 'In Progress'}
                        </span>
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
      
      {/* Skills Overview Section - pass prepared scores */}
      {scores && <SkillsOverviewSection scores={scores} animated={animated} />}
      
      {/* Overall Assessment Status */}
      <div className={`literexia-overall-status ${progressData.allCategoriesPassed ? 'achieved' : 'developing'}`}>
        <h3>
          {progressData.allCategoriesPassed 
            ? 'Assessment Mastered!' 
            : 'Skills Being Developed'}
        </h3>
        <p>
          {progressData.allCategoriesPassed 
            ? 'Student has mastered all categories and is ready to advance to the next reading level.' 
            : 'Student is developing skills in some categories. Focused practice will help them advance to the next level.'}
        </p>
        {!progressData.allCategoriesPassed && hasCategoryResults && (
          <div className="literexia-focus-areas">
            <h4>Recommended Focus Areas:</h4>
            <ul>
              {progressData.categories
                .filter(cat => !cat.isPassed)
                .map((category, index) => (
                  <li key={index} className={animated ? 'animate' : ''} style={{animationDelay: `${0.2 + (0.1 * index)}s`}}>
                    {category.categoryName}
                  </li>
                ))}
            </ul>
          </div>
        )}
      </div>
    </div>
  );
};

export default ProgressReport;