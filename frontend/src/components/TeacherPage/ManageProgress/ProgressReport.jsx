import React, { useState, useEffect } from 'react';
import { 
  FaInfoCircle, 
  FaBookOpen, 
  FaChartLine, 
  FaCheckCircle, 
  FaBrain,
  FaEdit, 
  FaSave,
  FaCalendarAlt,
  FaClock,
  FaTrophy
} from 'react-icons/fa';

import SkillsOverviewSection from './SkillsOverviewSection';
import './css/ProgressReport.css';

const ProgressReport = ({ progressData, assignedLessons }) => {
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [timeRange, setTimeRange] = useState('month');
  const [editingFeedback, setEditingFeedback] = useState({});
  const [tempFeedback, setTempFeedback] = useState({});

  // Initialize learning objectives using the assignedLessons prop
  const [learningObjectives, setLearningObjectives] = useState(
    assignedLessons.map(lesson => ({
      id: lesson.id,
      title: lesson.title,
      assistance: null, // null, 'minimal', 'moderate', 'maximal'
      remarks: '',
      isEditingRemarks: false
    }))
  );

  // Update learning objectives when assignedLessons changes
  useEffect(() => {
    // Make sure we don't overwrite existing data for lessons that are already in learningObjectives
    const updatedObjectives = assignedLessons.map(lesson => {
      const existingObjective = learningObjectives.find(obj => obj.id === lesson.id);
      
      if (existingObjective) {
        return existingObjective;
      } else {
        return {
          id: lesson.id,
          title: lesson.title,
          assistance: null,
          remarks: '',
          isEditingRemarks: false
        };
      }
    });
    
    setLearningObjectives(updatedObjectives);
  }, [assignedLessons]);
  
  if (!progressData) {
    return (
      <div className="literexia-empty-state">
        <FaInfoCircle size={40} />
        <h3>No Progress Data</h3>
        <p>No progress data available for this student. They may not have completed any lessons yet.</p>
      </div>
    );
  }
  
  // Calculate progress metrics
  const calculateCompletionRate = () => {
    const { activitiesCompleted, totalActivities } = progressData;
    if (!totalActivities) return 0;
    return Math.round((activitiesCompleted / totalActivities) * 100);
  };
  
  const getAverageScore = () => {
    if (!progressData.scores) return 0;
    const scores = Object.values(progressData.scores || {});
    if (scores.length === 0) return 0;
    const sum = scores.reduce((total, score) => total + score, 0);
    return Math.round(sum / scores.length);
  };
  
  // Filter activities based on selected time range
  const filterActivitiesByTime = () => {
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
    
    return progressData.recentActivities?.filter(activity => {
      const activityDate = new Date(activity.date);
      return activityDate >= cutoffDate;
    }) || [];
  };
  
  const filteredActivities = filterActivitiesByTime();
  
  // Filter activities by category if a specific one is selected
  const filteredByCategory = selectedCategory === 'all' 
    ? filteredActivities 
    : filteredActivities.filter(activity => activity.category === selectedCategory);
  
  // Get CSS class for skill category
  const getCategoryClass = (category) => {
    switch(category) {
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
  
  // Format date for display
  const formatDate = (date) => {
    return new Date(date).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };
  
  // Handle teacher feedback
  const handleEditFeedback = (activityId) => {
    setEditingFeedback({
      ...editingFeedback,
      [activityId]: true
    });
    
    // Initialize temp feedback if needed
    if (!tempFeedback[activityId]) {
      setTempFeedback({
        ...tempFeedback,
        [activityId]: progressData.recentActivities.find(a => a.id === activityId)?.feedback || ''
      });
    }
  };
  
  const handleSaveFeedback = (activityId) => {
    // In a real implementation, this would call an API to save the feedback
    // For now, we'll just update our local state
    
    // Create a copy of the activities with the updated feedback
    const updatedActivities = progressData.recentActivities.map(activity => {
      if (activity.id === activityId) {
        return {
          ...activity,
          feedback: tempFeedback[activityId]
        };
      }
      return activity;
    });
    
    // Update the progressData object (in a real app, this would be done via state management or API call)
    progressData.recentActivities = updatedActivities;
    
    // Exit editing mode
    setEditingFeedback({
      ...editingFeedback,
      [activityId]: false
    });
  };
  
  // Handle learning objective assistance level
  const handleAssistanceChange = (lessonId, level) => {
    setLearningObjectives(prev =>
      prev.map(obj =>
        obj.id === lessonId ? { ...obj, assistance: level } : obj
      )
    );
  };
  
  // Handle remarks editing
  const toggleRemarksEditing = (lessonId) => {
    setLearningObjectives(prev =>
      prev.map(obj =>
        obj.id === lessonId
          ? { ...obj, isEditingRemarks: !obj.isEditingRemarks }
          : obj
      )
    );
  };
  
  const handleRemarksChange = (lessonId, remarks) => {
    setLearningObjectives(prev =>
      prev.map(obj =>
        obj.id === lessonId ? { ...obj, remarks } : obj
      )
    );
  };
  
  // Calculate completion rate and average score
  const completionRate = calculateCompletionRate();
  const averageScore = getAverageScore();
  
  return (
    <div className="literexia-progress-container">
      {/* Progress info section */}
      <div className="literexia-progress-info">
        <div className="literexia-progress-info-icon">
          <FaBrain />
        </div>
        <div className="literexia-progress-info-text">
          <p>
            
          <h3>Progress REPORRTT</h3>
            This section shows the student's progress in their reading activities.
            This section shows the student's progress in their reading activities.
            This section shows the student's progress in their reading activities.
            This section shows the student's progress in their reading activities.
            This section shows the student's progress in their reading activities.
            You can view their performance over time and across different reading skill categories.
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
            <div className="literexia-card-value">{completionRate}%</div>
          </div>
          <div className="literexia-card-label">Lessons Completed</div>
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
              <FaBookOpen />
            </div>
            <div className="literexia-card-value">{progressData.activitiesCompleted || 0}</div>
          </div>
          <div className="literexia-card-label">Activities Completed</div>
        </div>
      </div>
      
      {/* Skills Overview Section */}
      <SkillsOverviewSection scores={progressData.scores} /> 
      </div>
  );
};

export default ProgressReport;
                       