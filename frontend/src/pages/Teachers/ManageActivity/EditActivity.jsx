import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faArrowLeft, faSave, faSpinner } from '@fortawesome/free-solid-svg-icons';
import '../../css/Teachers/CreateActivity.css'; // Reusing the same styles

// Import mock data
import { 
  readingLevels, 
  categories 
} from '../../../data/Teachers/activityData.js';

const EditActivity = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const [loading, setLoading] = useState(true);
  const [activityData, setActivityData] = useState(null);
  const [error, setError] = useState(null);

  // Fetch activity data when component mounts
  useEffect(() => {
    const fetchActivity = async () => {
      setLoading(true);
      try {
        // In a real app, you would fetch from your API
        // For now, let's simulate with mock data from our import
        const mockResponse = await import('../../../data/Teachers/activitiesMockData.js');
        const activities = mockResponse.default;
        const activity = activities.find(a => a.id === parseInt(id));
        
        if (!activity) {
          throw new Error('Activity not found');
        }
        
        setActivityData({
          title: activity.title,
          level: activity.level,
          category: activity.categories[0], // Using first category
          type: activity.type,
          contentType: activity.contentType.toLowerCase(),
          description: activity.description
        });
      } catch (err) {
        console.error('Error fetching activity:', err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchActivity();
  }, [id]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setActivityData({
      ...activityData,
      [name]: value
    });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    console.log('Updated activity data:', activityData);
    // Here you would update the data in your backend
    // For now, just redirect back to manage activities
    navigate('/teacher/manage-activities');
  };

  if (loading) {
    return (
      <div className="create-activity-container">
        <div className="loading-state">
          <FontAwesomeIcon icon={faSpinner} spin />
          <p>Loading activity data...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="create-activity-container">
        <div className="error-state">
          <h2>Error Loading Activity</h2>
          <p>{error}</p>
          <button 
            className="btn-cancel" 
            onClick={() => navigate('/teacher/manage-activities')}
          >
            Back to Activities
          </button>
        </div>
      </div>
    );
  }

  if (!activityData) return null;

  return (
    <div className="create-activity-container">
      <div className="page-header">
        <h1 className="page-title">Edit Activity</h1>
        <p className="page-subtitle">Modify this learning activity</p>
      </div>

      <div className="activity-form-container">
        <form onSubmit={handleSubmit}>
          <div className="form-section">
            <h2 className="section-title">Basic Information</h2>
            
            <div className="form-group">
              <label htmlFor="title">Activity Title</label>
              <input
                type="text"
                id="title"
                name="title"
                value={activityData.title}
                onChange={handleInputChange}
                required
                placeholder="Enter a descriptive title..."
              />
            </div>
            
            <div className="form-row">
              <div className="form-group">
                <label htmlFor="level">Reading Level (Antas)</label>
                <select
                  id="level"
                  name="level"
                  value={activityData.level}
                  onChange={handleInputChange}
                  required
                >
                  {readingLevels.slice(1).map((level, index) => (
                    <option key={index} value={level}>{level}</option>
                  ))}
                </select>
              </div>
              
              <div className="form-group">
                <label htmlFor="category">Category</label>
                <select
                  id="category"
                  name="category"
                  value={activityData.category}
                  onChange={handleInputChange}
                  required
                >
                  {categories.slice(1).map((category, index) => (
                    <option key={index} value={category}>{category}</option>
                  ))}
                </select>
              </div>
            </div>
            
            <div className="form-row">
              <div className="form-group">
                <label htmlFor="type">Activity Type</label>
                <select
                  id="type"
                  name="type"
                  value={activityData.type}
                  onChange={handleInputChange}
                  required
                >
                  <option value="template">General Template</option>
                  <option value="assessment">Pre-Assessment</option>
                  <option value="practice">Practice Module</option>
                </select>
              </div>
              
              <div className="form-group">
                <label htmlFor="contentType">Content Type</label>
                <select
                  id="contentType"
                  name="contentType"
                  value={activityData.contentType}
                  onChange={handleInputChange}
                  required
                >
                  <option value="text">Text Reading</option>
                  <option value="image">Image Based</option>
                  <option value="voice">Voice to Text</option>
                </select>
              </div>
            </div>
            
            <div className="form-group">
              <label htmlFor="description">Description</label>
              <textarea
                id="description"
                name="description"
                value={activityData.description}
                onChange={handleInputChange}
                rows="3"
                placeholder="Describe the activity and its learning objectives..."
              ></textarea>
            </div>
          </div>
          
          {/* This would be populated with different content based on selected contentType */}
          <div className="form-section">
            <h2 className="section-title">Content Configuration</h2>
            <p className="helper-text">
              This is where you would edit the specific content for this activity.
              <br />
              In a complete implementation, this section would display the existing content
              (reading passages, images, or voice prompts) for you to modify.
            </p>
            
            <div className="placeholder-content">
              <p>Content editing interface for {activityData.contentType} would be displayed here.</p>
            </div>
          </div>
          
          <div className="form-actions">
            <button 
              type="button" 
              className="btn-cancel"
              onClick={() => navigate('/teacher/manage-activities')}
            >
              <FontAwesomeIcon icon={faArrowLeft} /> Back
            </button>
            <button type="submit" className="btn-save">
              <FontAwesomeIcon icon={faSave} /> Save Changes
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default EditActivity;