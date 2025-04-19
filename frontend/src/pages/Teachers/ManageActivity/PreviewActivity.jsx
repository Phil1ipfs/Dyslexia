import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faArrowLeft, faEdit, faSpinner, faVolumeUp } from '@fortawesome/free-solid-svg-icons';
import '../../css/Teachers/PreviewActivity.css';

const PreviewActivity = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const [loading, setLoading] = useState(true);
  const [activity, setActivity] = useState(null);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('student');
  
  // Fetch activity data when component mounts
  useEffect(() => {
    const fetchActivity = async () => {
      setLoading(true);
      try {
        // In a real app, you would fetch from your API
        // For now, let's simulate with mock data from our import
        const mockResponse = await import('../../data/Teachers/activitiesMockData.js');
        const activities = mockResponse.default;
        const activity = activities.find(a => a.id === parseInt(id));
        
        if (!activity) {
          throw new Error('Activity not found');
        }
        
        setActivity(activity);
      } catch (err) {
        console.error('Error fetching activity:', err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchActivity();
  }, [id]);

  if (loading) {
    return (
      <div className="preview-activity-container">
        <div className="loading-state">
          <FontAwesomeIcon icon={faSpinner} spin />
          <p>Loading activity preview...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="preview-activity-container">
        <div className="error-state">
          <h2>Error Loading Activity</h2>
          <p>{error}</p>
          <button 
            className="btn-back" 
            onClick={() => navigate('/teacher/manage-activities')}
          >
            Back to Activities
          </button>
        </div>
      </div>
    );
  }

  if (!activity) return null;

  // Sample text passages for reading content
  const samplePassages = [
    {
      id: 1,
      text: "Si Mang Jose ay nagtanim ng gulay sa kanyang hardin.",
      audio: "#",
      image: "https://via.placeholder.com/400x300?text=Garden+Scene"
    },
    {
      id: 2,
      text: "Maraming uri ng gulay ang kanyang itinanim tulad ng talong, kamatis, at kalabasa.",
      audio: "#",
      image: "https://via.placeholder.com/400x300?text=Vegetables"
    },
    {
      id: 3,
      text: "Araw-araw ay dinidiligan niya ang mga ito upang lumaki ng maayos.",
      audio: "#",
      image: "https://via.placeholder.com/400x300?text=Watering+Plants"
    }
  ];

  // Sample questions for the activity
  const sampleQuestions = [
    {
      id: 1,
      question: "Ano ang itinanim ni Mang Jose?",
      options: ["Bulaklak", "Gulay", "Puno", "Palay"],
      correctAnswer: "Gulay"
    },
    {
      id: 2,
      question: "Anu-anong uri ng gulay ang itinanim ni Mang Jose?",
      options: ["Talong, kamatis, at kalabasa", "Sibuyas, bawang, at luya", "Repolyo, patatas, at karot", "Kangkong, kamote, at labanos"],
      correctAnswer: "Talong, kamatis, at kalabasa"
    },
    {
      id: 3,
      question: "Bakit dinidiligan ni Mang Jose ang mga tanim?",
      options: ["Upang lumaki ng maayos", "Upang maging matamis", "Upang maging masarap", "Upang maging malaki"],
      correctAnswer: "Upang lumaki ng maayos"
    }
  ];

  return (
    <div className="preview-activity-container">
      <div className="preview-header">
        <div>
          <h1 className="preview-title">{activity.title}</h1>
          <p className="preview-subtitle">
            {activity.level} | {activity.categories.join(', ')} | 
            {activity.type === 'template' && ' Activity Template'}
            {activity.type === 'assessment' && ' Pre-Assessment'}
            {activity.type === 'practice' && ' Practice Module'}
          </p>
        </div>
        <div className="preview-actions">
          <button 
            className="btn-back"
            onClick={() => navigate('/teacher/manage-activities')}
          >
            <FontAwesomeIcon icon={faArrowLeft} /> Back
          </button>
          <button 
            className="btn-edit"
            onClick={() => navigate(`/teacher/edit-activity/${activity.id}`)}
          >
            <FontAwesomeIcon icon={faEdit} /> Edit
          </button>
        </div>
      </div>

      <div className="preview-description">
        <h2>Activity Description</h2>
        <p>{activity.description}</p>
      </div>

      <div className="preview-tabs">
        <button 
          className={`tab-button ${activeTab === 'student' ? 'active' : ''}`}
          onClick={() => setActiveTab('student')}
        >
          Student View
        </button>
        <button 
          className={`tab-button ${activeTab === 'teacher' ? 'active' : ''}`}
          onClick={() => setActiveTab('teacher')}
        >
          Teacher Details
        </button>
      </div>

      <div className="preview-content">
        {activeTab === 'student' ? (
          <div className="student-view">
            <h2>Reading Passage</h2>
            
            <div className="reading-passage">
              {activity.contentType === 'Reading' || activity.contentType === 'Text' ? (
                // Reading passage
                <div className="passages-container">
                  {samplePassages.map(passage => (
                    <div key={passage.id} className="passage-item">
                      <div className="passage-media">
                        <img src={passage.image} alt="Supporting visual" />
                      </div>
                      <div className="passage-text">
                        <p>{passage.text}</p>
                        <button className="audio-button">
                          <FontAwesomeIcon icon={faVolumeUp} /> Listen
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : activity.contentType === 'Image' ? (
                // Image based content
                <div className="image-content">
                  <div className="image-display">
                    <img src="https://via.placeholder.com/800x400?text=Image+Activity" alt="Activity visual" />
                  </div>
                  <div className="image-caption">
                    <p>This is a sample image-based activity for {activity.title}</p>
                  </div>
                </div>
              ) : (
                // Voice to text content
                <div className="voice-content">
                  <div className="voice-prompt">
                    <h3>Read the following sentence aloud:</h3>
                    <p className="prompt-text">"Ang mga bata ay masayang naglalaro sa parke."</p>
                    <button className="record-button">
                      <FontAwesomeIcon icon={faVolumeUp} /> Listen to Sample
                    </button>
                  </div>
                </div>
              )}
            </div>
            
            <h2>Questions</h2>
            <div className="questions-container">
              {sampleQuestions.map(question => (
                <div key={question.id} className="question-item">
                  <h3 className="question-text">{question.question}</h3>
                  <div className="options-list">
                    {question.options.map((option, index) => (
                      <div key={index} className="option-item">
                        <input 
                          type="radio" 
                          id={`q${question.id}_opt${index}`} 
                          name={`question${question.id}`} 
                        />
                        <label htmlFor={`q${question.id}_opt${index}`}>{option}</label>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div className="teacher-view">
            <div className="teacher-details">
              <h2>Teacher Information</h2>
              
              <div className="detail-section">
                <h3>Activity Metadata</h3>
                <div className="detail-grid">
                  <div className="detail-item">
                    <span className="detail-label">Created By:</span>
                    <span className="detail-value">{activity.creator}</span>
                  </div>
                  <div className="detail-item">
                    <span className="detail-label">Creation Date:</span>
                    <span className="detail-value">
                      {new Date(activity.createdAt).toLocaleDateString('en-US', { 
                        year: 'numeric', month: 'long', day: 'numeric' 
                      })}
                    </span>
                  </div>
                  {activity.lastModified && (
                    <div className="detail-item">
                      <span className="detail-label">Last Modified:</span>
                      <span className="detail-value">
                        {new Date(activity.lastModified).toLocaleDateString('en-US', { 
                          year: 'numeric', month: 'long', day: 'numeric' 
                        })}
                      </span>
                    </div>
                  )}
                  <div className="detail-item">
                    <span className="detail-label">Status:</span>
                    <span className={`detail-value status-${activity.status}`}>
                      {activity.status.charAt(0).toUpperCase() + activity.status.slice(1)}
                    </span>
                  </div>
                </div>
              </div>
              
              <div className="detail-section">
                <h3>Usage Guidelines</h3>
                <div className="guidelines">
                  <p>This activity is designed for students at {activity.level} reading level. 
                  It focuses on {activity.categories.join(', ')} skills and should be 
                  administered in a quiet environment without distractions.</p>
                  
                  <p>For best results, ensure students understand the instructions thoroughly before 
                  beginning. Allow approximately 15-20 minutes for completion.</p>
                </div>
              </div>
              
              <div className="detail-section">
                <h3>Correct Answers</h3>
                <div className="answers-list">
                  {sampleQuestions.map(question => (
                    <div key={question.id} className="answer-item">
                      <div className="question">{question.question}</div>
                      <div className="answer">
                        <span className="answer-label">Answer:</span>
                        <span className="answer-value">{question.correctAnswer}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default PreviewActivity;