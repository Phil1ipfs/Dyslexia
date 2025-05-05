import React, { useState, useEffect } from 'react';
import { 
  FaInfoCircle, 
  FaBookOpen, 
  FaChartLine, 
  FaCheckCircle, 
  FaEdit, 
  FaSave,
  FaCalendarAlt,
  FaClock,
  FaTrophy
} from 'react-icons/fa';

import SkillsOverviewSection from '../ManageProgress/SkillsOverviewSection';
import '../ManageProgress/css/ProgressReport.css';

const ProgressReport = ({ progressData, assignedLessons }) => {
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [timeRange, setTimeRange] = useState('month');
  const [editingFeedback, setEditingFeedback] = useState({});
  const [tempFeedback, setTempFeedback] = useState({});

  // Initialize learningObjectives using the assignedLessons prop
  const [learningObjectives, setLearningObjectives] = useState(
    assignedLessons.map(lesson => ({
      id: lesson.id,
      title: lesson.title,
      assistance: null, // null, 'minimal', 'moderate', 'maximal'
      remarks: '',
      isEditingRemarks: false
    }))
  );

  // Update learningObjectives when assignedLessons changes
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
    
  }, [assignedLessons]);
  
  if (!progressData) {
    return (
      <div className="literexia-empty-state">
        <FaInfoCircle size={40} />
        <h3>Walang Datos ng Pag-unlad</h3>
        <p>Walang available na datos ng pag-unlad para sa mag-aaral na ito. Maaaring hindi pa siya nakakatapos ng anumang aralin.</p>
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
      case 'Patinig':
      case 'Vowel Sound':
        return 'literexia-patinig';
      case 'Pantig':
      case 'Syllable Blending':
        return 'literexia-pantig';
      case 'Pagkilala ng Salita':
      case 'Word Recognition':
        return 'literexia-salita';
      case 'Pag-unawa sa Binasa':
      case 'Reading Comprehension':
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
          <FaInfoCircle />
        </div>
        <div className="literexia-progress-info-text">
          <p>
            Ang seksyong ito ay nagpapakita ng progreso ng mag-aaral sa kanilang mga aktibidad sa pagbasa. 
            Maaari mong tingnan ang kanilang performance sa paglipas ng panahon at sa iba't ibang kategorya ng kasanayan sa pagbasa.
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
          <div className="literexia-card-label">Nakumpletong Aralin</div>
        </div>
        
        <div className="literexia-summary-card">
          <div className="literexia-card-header">
            <div className="literexia-card-icon">
              <FaChartLine />
            </div>
            <div className="literexia-card-value">{averageScore}%</div>
          </div>
          <div className="literexia-card-label">Karaniwang Iskor</div>
        </div>
        
        <div className="literexia-summary-card">
          <div className="literexia-card-header">
            <div className="literexia-card-icon">
              <FaBookOpen />
            </div>
            <div className="literexia-card-value">{progressData.activitiesCompleted || 0}</div>
          </div>
          <div className="literexia-card-label">Nakumpletong Aktibidad</div>
        </div>
      </div>
      
      {/* Skills Overview Section - New enhanced component */}
      <SkillsOverviewSection scores={progressData.scores} />
      
      {/* Learning Objectives Table integrated with activities */}
      <div className="literexia-combined-section">
        <h3 className="literexia-section-title">
          <FaCheckCircle className="literexia-section-icon" /> Mga Aralin at Aktibidad
        </h3>
        
        <div className="literexia-filters">
          <div className="literexia-filter-group">
            <label htmlFor="timeRangeFilter">Panahon:</label>
            <select
              id="timeRangeFilter"
              value={timeRange}
              onChange={(e) => setTimeRange(e.target.value)}
              className="literexia-filter-select"
            >
              <option value="week">Nakaraang Linggo</option>
              <option value="month">Nakaraang Buwan</option>
              <option value="quarter">Nakaraang 3 Buwan</option>
            </select>
          </div>
          
          <div className="literexia-filter-group">
            <label htmlFor="categoryFilter">Kategorya:</label>
            <select
              id="categoryFilter"
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="literexia-filter-select"
            >
              <option value="all">Lahat ng Kategorya</option>
              <option value="Patinig">Patinig</option>
              <option value="Pantig">Pantig</option>
              <option value="Pagkilala ng Salita">Pagkilala ng Salita</option>
              <option value="Pag-unawa sa Binasa">Pag-unawa sa Binasa</option>
            </select>
          </div>
        </div>
        
        {/* Learning Objectives Table */}
        <div className="literexia-learning-objectives">
          <h4 className="literexia-subsection-title">Pag-unlad sa Mga Aralin</h4>
          
          <div className="literexia-table-container">
            <table className="literexia-objectives-table">
              <thead>
                <tr>
                  <th rowSpan="2">Aralin</th>
                  <th rowSpan="2">Nakumpleto</th>
                  <th colSpan="3">Antas ng Pag-unlad</th>
                  <th rowSpan="2">Mga Puna</th>
                </tr>
                <tr>
                  <th>Minimal na tulong</th>
                  <th>Katamtamang tulong</th>
                  <th>Malaking tulong</th>
                </tr>
              </thead>
              <tbody>
                {learningObjectives.map((objective) => (
                  <tr key={objective.id}>
                    <td>{objective.title}</td>
                    <td className="literexia-completion-cell">
                      {filteredActivities.some(act => act.title.includes(objective.title.substring(0, 5))) ? (
                        <span className="literexia-completed"><FaCheckCircle /></span>
                      ) : (
                        <span className="literexia-not-completed">Hindi pa</span>
                      )}
                    </td>
                    <td className="literexia-assistance-cell">
                      <div 
                        className={`literexia-checkbox ${objective.assistance === 'minimal' ? 'literexia-selected' : ''}`}
                        onClick={() => handleAssistanceChange(objective.id, 'minimal')}
                      >
                        {objective.assistance === 'minimal' && <FaCheckCircle />}
                      </div>
                    </td>
                    <td className="literexia-assistance-cell">
                      <div 
                        className={`literexia-checkbox ${objective.assistance === 'moderate' ? 'literexia-selected' : ''}`}
                        onClick={() => handleAssistanceChange(objective.id, 'moderate')}
                      >
                        {objective.assistance === 'moderate' && <FaCheckCircle />}
                      </div>
                    </td>
                    <td className="literexia-assistance-cell">
                      <div 
                        className={`literexia-checkbox ${objective.assistance === 'maximal' ? 'literexia-selected' : ''}`}
                        onClick={() => handleAssistanceChange(objective.id, 'maximal')}
                      >
                        {objective.assistance === 'maximal' && <FaCheckCircle />}
                      </div>
                    </td>
                    <td className="literexia-remarks-cell">
                      {objective.isEditingRemarks ? (
                        <div className="literexia-remarks-edit">
                          <textarea
                            value={objective.remarks}
                            onChange={(e) => handleRemarksChange(objective.id, e.target.value)}
                            placeholder="Magdagdag ng mga puna..."
                            className="literexia-remarks-textarea"
                          />
                          <button 
                            className="literexia-save-remarks-btn"
                            onClick={() => toggleRemarksEditing(objective.id)}
                          >
                            <FaSave />
                          </button>
                        </div>
                      ) : (
                        <div className="literexia-remarks-view">
                          <p>{objective.remarks || 'Walang puna pa.'}</p>
                          <button 
                            className="literexia-edit-remarks-btn"
                            onClick={() => toggleRemarksEditing(objective.id)}
                          >
                            <FaEdit />
                          </button>
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProgressReport;