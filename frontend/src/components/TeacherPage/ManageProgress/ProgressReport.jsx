import React, { useState, useEffect } from 'react';
import { 
  FaInfoCircle, 
  FaChartLine, 
  FaCheckCircle, 
  FaBrain,
  FaCalendarAlt,
  FaClock,
  FaExclamationTriangle,
  FaArrowUp,
  FaArrowRight,
  FaLock,
  FaHourglassHalf,
  FaSpinner,
  FaTrophy
} from 'react-icons/fa';

import SkillsOverviewSection from './SkillsOverviewSection';
import './css/ProgressReport.css';

const ProgressReport = ({ 
  progressData, 
  categoryProgress, 
  readingLevelInfo,
  assessmentAssignments 
}) => {
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [timeRange, setTimeRange] = useState('month');
  
  if (!progressData || !categoryProgress || !readingLevelInfo) {
    return (
      <div className="literexia-empty-state">
        <FaInfoCircle size={40} />
        <h3>No Progress Data</h3>
        <p>No progress data available for this student. They may not have completed any assessments yet.</p>
      </div>
    );
  }
  
  // Calculate completion percentage
  const calculateCompletionPercentage = () => {
    if (!categoryProgress.categories) return 0;
    
    const completedCategories = categoryProgress.categories.filter(
      cat => cat.passed
    ).length;
    
    return completedCategories > 0 
      ? Math.round((completedCategories / categoryProgress.categories.length) * 100) 
      : 0;
  };
  
  // Get average score from completed assessments
  const getAverageScore = () => {
    if (!categoryProgress.categories) return 0;
    
    const completedCategories = categoryProgress.categories.filter(
      cat => cat.mainAssessmentCompleted
    );
    
    if (completedCategories.length === 0) return 0;
    
    const totalScore = completedCategories.reduce(
      (sum, cat) => sum + (cat.mainAssessmentScore || 0), 
      0
    );
    
    return Math.round(totalScore / completedCategories.length);
  };
  
  // Filter activities based on selected time range
  const filterActivitiesByTime = () => {
    if (!progressData.recentActivities) return [];
    
    const now = new Date();
    const cutoffDate = new Date();
    
    switch (timeRange) {
      case 'week':
        cutoffDate.setDate(now.getDate() - 7);
        break;
      case 'month':
        cutoffDate.setDate(now.getDate() - 30);
        break;
      case 'quarter':
        cutoffDate.setDate(now.getDate() - 90);
        break;
      default:
        cutoffDate.setDate(now.getDate() - 30);
    }
    
    return progressData.recentActivities.filter(activity => {
      const activityDate = new Date(activity.date);
      return activityDate >= cutoffDate;
    });
  };
  
  // Filter activities by category if a specific one is selected
  const filteredActivities = filterActivitiesByTime();
  const filteredByCategory = selectedCategory === 'all' 
    ? filteredActivities 
    : filteredActivities.filter(activity => 
        activity.category === selectedCategory || 
        activity.category.includes(selectedCategory)
      );
  
  // Format date for display
  const formatDate = (date) => {
    return new Date(date).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };
  
  // Get CSS class for skill category
  const getCategoryClass = (category) => {
    if (!category) return '';
    
    const lowerCategory = category.toLowerCase();
    
    if (lowerCategory.includes('alphabet') || lowerCategory.includes('patinig')) {
      return 'literexia-patinig';
    }
    if (lowerCategory.includes('phonological') || lowerCategory.includes('pantig')) {
      return 'literexia-pantig';
    }
    if (lowerCategory.includes('decoding') || lowerCategory.includes('decode')) {
      return 'literexia-decoding';
    }
    if (lowerCategory.includes('word') || lowerCategory.includes('salita')) {
      return 'literexia-word-recognition';
    }
    if (lowerCategory.includes('reading') || lowerCategory.includes('comprehension') || 
        lowerCategory.includes('pag-unawa')) {
      return 'literexia-reading-comprehension';
    }
    
    return '';
  };
  
  // Calculate completion rate and average score
  const completionPercentage = calculateCompletionPercentage();
  const averageScore = getAverageScore();
  
  return (
    <div className="literexia-progress-container">
      {/* Progress info section */}
      <div className="literexia-progress-info">
        <div className="literexia-progress-info-icon">
          <FaBrain />
        </div>
        <div className="literexia-progress-info-text">
          <h3>Reading Progress Report</h3>
          <p>
            This section shows the student's progress across all assigned assessment categories.
            Track their performance, identify strengths and weaknesses, and monitor their progress
            toward the next reading level.
          </p>
        </div>
      </div>
      
      {/* Progress Summary Cards */}
      <div className="literexia-summary-cards">
        <div className="literexia-summary-card">
          <div className="literexia-card-header">
            <div className="literexia-card-icon">
              <FaCheckCircle />
            </div>
            <div className="literexia-card-value">{completionPercentage}%</div>
          </div>
          <div className="literexia-card-label">Categories Completed</div>
        </div>
        
        <div className="literexia-summary-card">
          <div className="literexia-card-header">
            <div className="literexia-card-icon">
              <FaChartLine />
            </div>
            <div className="literexia-card-value">{averageScore}%</div>
          </div>
          <div className="literexia-card-label">Average Score</div>
        </div>
        
        <div className="literexia-summary-card">
          <div className="literexia-card-header">
            <div className="literexia-card-icon">
              <FaClock />
            </div>
            <div className="literexia-card-value">{progressData.totalTimeSpent || 0}</div>
          </div>
          <div className="literexia-card-label">Minutes Spent</div>
        </div>
      </div>
      
      {/* Reading Level Progression */}
      <div className="literexia-reading-level-progress">
        <h3 className="literexia-section-title">
          <FaChartLine className="literexia-section-icon" />
          Reading Level Progression
        </h3>
        
        <div className="literexia-reading-level-info">
          <div className="literexia-current-level">
            <div className="literexia-level-label">Current Level</div>
            <div className="literexia-level-value">{readingLevelInfo.currentReadingLevel || 'Not Assessed'}</div>
          </div>
          
          <div className="literexia-level-arrow">
            <FaArrowRight />
          </div>
          
          <div className="literexia-next-level">
            <div className="literexia-level-label">Next Level</div>
            <div className="literexia-level-value">{readingLevelInfo.advancementRequirements?.nextLevel || 'N/A'}</div>
          </div>
          
          <div className="literexia-level-requirements">
            <div className="literexia-requirements-header">
              <div className="literexia-requirements-title">Requirements to advance</div>
              <div className="literexia-requirements-progress">
                {readingLevelInfo.advancementRequirements?.completedCategories?.length || 0}/
                {readingLevelInfo.advancementRequirements?.requiredCategories?.length || 0} Categories
              </div>
            </div>
            
            <div className="literexia-progress-bar-wrapper">
              <div 
                className="literexia-progress-bar"
                style={{ 
                  width: `${readingLevelInfo.overallProgress || 0}%`
                }}
              ></div>
            </div>
          </div>
        </div>
      </div>
      
      {/* Category Progress */}
      <div className="literexia-category-progress-section">
        <h3 className="literexia-section-title">
          <FaChartLine className="literexia-section-icon" />
          Category Progress
        </h3>
        
        <div className="literexia-category-cards">
          {categoryProgress.categories && categoryProgress.categories.map((category, index) => {
            const isLocked = category.status === 'locked';
            const isPending = category.status === 'pending';
            const isInProgress = category.status === 'in_progress';
            const isCompleted = category.status === 'completed';
            
            const progressPercentage = category.mainAssessmentScore || 0;
            const hasPassed = category.passed;
            
            return (
              <div 
                key={category.categoryId} 
                className={`literexia-category-card ${isLocked ? 'locked' : ''} ${isCompleted ? 'completed' : ''}`}
              >
                <div className={`literexia-category-icon ${getCategoryClass(category.categoryName)}`}>
                  {isLocked && <FaLock />}
                  {isPending && <FaHourglassHalf />}
                  {isInProgress && <FaSpinner />}
                  {isCompleted && <FaCheckCircle />}
                </div>
                
                <div className="literexia-category-content">
                  <h4 className="literexia-category-title">{category.categoryName}</h4>
                  
                  <div className="literexia-category-status">
                    {isLocked && <span className="literexia-locked-status">Locked</span>}
                    {isPending && <span className="literexia-pending-status">Pending</span>}
                    {isInProgress && <span className="literexia-in-progress-status">In Progress</span>}
                    {isCompleted && <span className="literexia-completed-status">Completed</span>}
                  </div>
                  
                  {!isLocked && (
                    <div className="literexia-category-details">
                      <div className="literexia-category-progress-bar-wrapper">
                        <div 
                          className={`literexia-category-progress-bar ${hasPassed ? 'passed' : ''}`}
                          style={{ width: `${progressPercentage}%` }}
                        ></div>
                      </div>
                      
                      <div className="literexia-category-stats">
                        <div className="literexia-stat-item">
                          <span className="literexia-stat-label">Assessment ID:</span>
                          <span className="literexia-stat-value">{category.mainAssessmentId || 'Not assigned'}</span>
                        </div>
                        
                        <div className="literexia-stat-item">
                          <span className="literexia-stat-label">Score:</span>
                          <span className={`literexia-stat-value ${hasPassed ? 'passed-value' : ''}`}>
                            {category.mainAssessmentScore ? `${category.mainAssessmentScore}%` : 'Not completed'}
                          </span>
                        </div>
                        
                        <div className="literexia-stat-item">
                          <span className="literexia-stat-label">Attempts:</span>
                          <span className="literexia-stat-value">{category.attemptCount || 0}</span>
                        </div>
                        
                        {category.lastAttemptDate && (
                          <div className="literexia-stat-item">
                            <span className="literexia-stat-label">Last Attempt:</span>
                            <span className="literexia-stat-value">{formatDate(category.lastAttemptDate)}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
                
                {hasPassed && (
                  <div className="literexia-passed-badge">
                    <FaTrophy />
                    <span>Passed</span>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
      
      {/* Skills Overview Section */}
      {progressData.scores && Object.keys(progressData.scores).length > 0 && (
        <SkillsOverviewSection scores={progressData.scores} />
      )}
      
      {/* Recent Activities Section */}
      <div className="literexia-recent-activities-section">
        <div className="literexia-section-header">
          <h3 className="literexia-section-title">
            <FaCalendarAlt className="literexia-section-icon" />
            Recent Activities
          </h3>
          
          <div className="literexia-time-filter">
            <label htmlFor="time-range">Time Range:</label>
            <select 
              id="time-range" 
              value={timeRange} 
              onChange={(e) => setTimeRange(e.target.value)}
              className="literexia-time-select"
            >
              <option value="week">Last 7 Days</option>
              <option value="month">Last 30 Days</option>
              <option value="quarter">Last 90 Days</option>
            </select>
            
            <label htmlFor="category-filter" className="literexia-category-label">Category:</label>
            <select 
              id="category-filter" 
              value={selectedCategory} 
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="literexia-category-select"
            >
              <option value="all">All Categories</option>
              {categoryProgress.categories && categoryProgress.categories.map((cat) => (
                <option key={cat.categoryId} value={cat.categoryName}>
                  {cat.categoryName}
                </option>
              ))}
            </select>
          </div>
        </div>
        
        {filteredByCategory.length > 0 ? (
          <div className="literexia-activities-list">
            {filteredByCategory.map((activity, index) => (
              <div key={index} className="literexia-activity-card">
                <div className={`literexia-activity-icon ${getCategoryClass(activity.category)}`}>
                  <FaCheckCircle />
                </div>
                
                <div className="literexia-activity-content">
                  <h4 className="literexia-activity-title">{activity.title}</h4>
                  
                  <div className="literexia-activity-details">
                    <div className="literexia-activity-category">
                      <span className={`literexia-category-badge ${getCategoryClass(activity.category)}`}>
                        {activity.category}
                      </span>
                    </div>
                    
                    <div className="literexia-activity-stats">
                      <div className="literexia-activity-stat">
                        <span className="literexia-stat-icon"><FaCalendarAlt /></span>
                        <span className="literexia-stat-text">{formatDate(activity.date)}</span>
                      </div>
                      
                      <div className="literexia-activity-stat">
                        <span className="literexia-stat-icon"><FaClock /></span>
                        <span className="literexia-stat-text">{activity.timeSpent} min</span>
                      </div>
                      
                      <div className="literexia-activity-stat">
                        <span className="literexia-stat-icon"><FaChartLine /></span>
                        <span className="literexia-stat-text">Score: {activity.score}%</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="literexia-empty-activities">
            <FaExclamationTriangle />
            <p>No activities found for the selected time range and category.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default ProgressReport;