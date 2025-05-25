// src/components/TeacherPage/ManageProgress/PrescriptiveAnalysis.jsx
import React, { useState, useEffect } from 'react';
import {
  FaInfoCircle,
  FaExclamationTriangle,
  FaChartLine,
  FaBook,
  FaEdit,
  FaCheckCircle,
  FaBrain,
  FaLightbulb,
  FaArrowRight,
  FaPlus,
  FaMobile,
  FaChalkboardTeacher,
  FaHandsHelping,
  FaSpinner,
  FaTimes
} from 'react-icons/fa';
import ActivityEditModal from './ActivityEditModal';
import './css/PrescriptiveAnalysis.css';

/**
 * PrescriptiveAnalysis Component
 * 
 * Main component for displaying prescriptive analysis and managing interventions
 * for students who scored below 75% in specific categories.
 * 
 * This component shows:
 * - Category performance breakdown
 * - Strengths, weaknesses, and recommendations for each failing category
 * - Current intervention activities
 * - Teaching guides for in-person support
 * 
 * @param {Object} student - Student object from users collection
 * @param {Object} categoryResults - Results from category_results collection
 * @param {Array} prescriptiveAnalyses - Array from prescriptive_analysis collection
 * @param {Array} interventions - Array from intervention_assessment collection
 * @param {Array} interventionProgress - Array from intervention_progress collection
 * @param {Function} onCreateActivity - Callback when new activity is created
 */
const PrescriptiveAnalysis = ({ 
  student, 
  categoryResults, 
  prescriptiveAnalyses, 
  interventions, 
  interventionProgress,
  onCreateActivity 
}) => {
  // ===== STATE MANAGEMENT =====
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [showNeedingInterventionOnly, setShowNeedingInterventionOnly] = useState(true);
  const [showActivityModal, setShowActivityModal] = useState(false);
  const [editingActivity, setEditingActivity] = useState(null);
  const [localInterventions, setLocalInterventions] = useState([]);
  const [loading, setLoading] = useState(false);

  // ===== MOCK DATA FOR DEMO (Remove when connecting to backend) =====
  const mockStudent = student || {
    _id: "202522222",
    firstName: "Kit Nicholas",
    lastName: "Mark",
    readingLevel: "Low Emerging"
  };

  const mockCategoryResults = categoryResults || {
    _id: "683001a0e90bfb98f3462af4",
    studentId: 202522222,
    assessmentType: "pre-assessment",
    assessmentDate: "2025-05-23T13:03:28.375789",
    categories: [
      {
        categoryName: "alphabet_knowledge",
        totalQuestions: 5,
        correctAnswers: 1,
        score: 20,
        isPassed: false,
        passingThreshold: 75
      },
      {
        categoryName: "phonological_awareness",
        totalQuestions: 5,
        correctAnswers: 2,
        score: 40,
        isPassed: false,
        passingThreshold: 75
      },
      {
        categoryName: "decoding",
        totalQuestions: 5,
        correctAnswers: 0,
        score: 0,
        isPassed: false,
        passingThreshold: 75
      },
      {
        categoryName: "word_recognition",
        totalQuestions: 5,
        correctAnswers: 1,
        score: 20,
        isPassed: false,
        passingThreshold: 75
      },
      {
        categoryName: "reading_comprehension",
        totalQuestions: 5,
        correctAnswers: 0,
        score: 0,
        isPassed: false,
        passingThreshold: 75
      }
    ],
    overallScore: 16,
    allCategoriesPassed: false,
    readingLevel: "Low Emerging",
    readingLevelUpdated: true,
    isPreAssessment: true
  };

  const mockPrescriptiveAnalyses = prescriptiveAnalyses || [
    {
      _id: "682b2b47d0570f23768512c9",
      studentId: "202522222",
      categoryId: "alphabet_knowledge",
      readingLevel: "Low Emerging",
      strengths: [
        "Can identify some uppercase letters",
        "Recognizes the vowel 'A'"
      ],
      weaknesses: [
        "Difficulty distinguishing between similar-looking letters (b/d, p/q)",
        "Limited recognition of lowercase letters",
        "Struggles with consonant sounds"
      ],
      recommendations: [
        "Daily practice with letter recognition exercises",
        "Use of multi-sensory approaches (tactile letters, tracing)",
        "Focus on letter-sound correspondence for basic consonants"
      ]
    },
    {
      _id: "682b2b47d0570f23768512ce",
      studentId: "202522222",
      categoryId: "phonological_awareness",
      readingLevel: "Low Emerging",
      strengths: [
        "Can identify initial sounds in simple words",
        "Recognizes rhyming patterns with support"
      ],
      weaknesses: [
        "Difficulty segmenting words into individual sounds",
        "Limited ability to blend sounds together",
        "Struggles with identifying ending sounds"
      ],
      recommendations: [
        "Phoneme segmentation activities using physical counters",
        "Sound blending games with visual supports",
        "Rhyming activities to build pattern recognition"
      ]
    },
    {
      _id: "682b2b47d0570f23768512d1",
      studentId: "202522222",
      categoryId: "decoding",
      readingLevel: "Low Emerging",
      strengths: [],
      weaknesses: [
        "Unable to decode simple CVC words",
        "Limited understanding of letter-sound relationships",
        "Cannot apply phonics rules to unfamiliar words"
      ],
      recommendations: [
        "Start with simple consonant-vowel-consonant (CVC) word building",
        "Use picture support alongside text for context clues",
        "Regular practice with the same word families to build confidence"
      ]
    },
    {
      _id: "682b2b47d0570f23768512d4",
      studentId: "202522222",
      categoryId: "word_recognition",
      readingLevel: "Low Emerging",
      strengths: [
        "Can recognize a few high-frequency words"
      ],
      weaknesses: [
        "Limited sight word vocabulary",
        "Difficulty recognizing common words in different contexts",
        "Slow word recognition speed"
      ],
      recommendations: [
        "Daily practice with high-frequency word flashcards",
        "Word recognition activities in different fonts and contexts",
        "Timed activities to improve recognition speed"
      ]
    },
    {
      _id: "682b2b47d0570f23768512d5",
      studentId: "202522222",
      categoryId: "reading_comprehension",
      readingLevel: "Low Emerging",
      strengths: [],
      weaknesses: [
        "Unable to answer basic comprehension questions",
        "Limited ability to recall story details",
        "Struggles with understanding story sequence"
      ],
      recommendations: [
        "Read-aloud sessions with simple comprehension questions",
        "Visual story mapping activities",
        "Sequencing activities with picture support"
      ]
    }
  ];

  // ===== DERIVED STATE =====
  // Use provided data or mock data
  const effectiveStudent = student || mockStudent;
  const effectiveCategoryResults = categoryResults || mockCategoryResults;
  const effectivePrescriptiveAnalyses = prescriptiveAnalyses || mockPrescriptiveAnalyses;
  const effectiveInterventions = [...(interventions || []), ...localInterventions];

  // Filter categories that need intervention (score < 75%)
  const categoriesNeedingIntervention = effectiveCategoryResults
    ? effectiveCategoryResults.categories.filter(cat => (Number(cat.score) || 0) < 75)
    : [];

  // ===== EFFECTS =====
  
  /**
   * Auto-select first category needing intervention
   */
  useEffect(() => {
    if (categoriesNeedingIntervention.length > 0 && !selectedCategory) {
      setSelectedCategory(categoriesNeedingIntervention[0].categoryName);
    }
  }, [categoriesNeedingIntervention, selectedCategory]);

  // ===== HELPER FUNCTIONS =====

  /**
   * Get analysis for a specific category
   * @param {string} categoryName - Category name
   * @return {Object|null} Analysis object or null
   */
  const getAnalysisForCategory = (categoryName) => {
    return effectivePrescriptiveAnalyses.find(analysis => 
      analysis.categoryId === categoryName
    );
  };

  /**
   * Get interventions for a specific category
   * @param {string} categoryName - Category name
   * @return {Array} Array of interventions
   */
  const getInterventionsForCategory = (categoryName) => {
    return effectiveInterventions.filter(
      intervention => intervention.category === categoryName
    );
  };

  /**
   * Get progress for a specific intervention
   * @param {string} interventionId - Intervention ID
   * @return {Object|null} Progress object or null
   */
  const getProgressForIntervention = (interventionId) => {
    if (!interventionProgress) return null;
    return interventionProgress.find(
      progress => progress.interventionPlanId === interventionId
    );
  };

  /**
   * Format category name for display
   * @param {string} categoryName - Category name
   * @return {string} Formatted category name
   */
  const formatCategoryName = (categoryName) => {
    if (!categoryName) return "Unknown Category";
    
    return categoryName
      .replace(/_/g, ' ')
      .replace(/\b\w/g, l => l.toUpperCase());
  };

  // ===== EVENT HANDLERS =====

  /**
   * Handle creating new activity
   * @param {string} category - Category name
   * @param {Object} analysis - Analysis object
   * @param {Object} existingActivity - Existing activity to edit (optional)
   */
  const handleCreateActivity = (category, analysis, existingActivity = null) => {
    setEditingActivity(existingActivity);
    setSelectedCategory(category);
    setShowActivityModal(true);
  };

  /**
   * Handle saving activity (from ActivityEditModal)
   * @param {Object} activityData - Activity data from modal
   */
  const handleSaveActivity = (activityData) => {
    setLocalInterventions(prev => {
      const existingIndex = prev.findIndex(item => item._id === activityData._id);
      if (existingIndex >= 0) {
        // Update existing
        const updated = [...prev];
        updated[existingIndex] = activityData;
        return updated;
      } else {
        // Add new
        return [...prev, activityData];
      }
    });

    setShowActivityModal(false);
    setEditingActivity(null);

    // Call parent callback if provided
    if (onCreateActivity) {
      onCreateActivity(activityData);
    }
  };

  /**
   * Handle pushing intervention to mobile device
   * TODO: Connect to backend API
   * @param {Object} intervention - Intervention to push
   */
  const handlePushToMobile = async (intervention) => {
    setLoading(true);
    try {
      // TODO: Replace with actual API call
      // await pushInterventionToMobile(intervention._id);
      
      // Mock API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Update intervention status to 'active'
      setLocalInterventions(prev => 
        prev.map(item => 
          item._id === intervention._id 
            ? { ...item, status: 'active' }
            : item
        )
      );
      
      console.log('Intervention pushed to mobile:', intervention._id);
    } catch (error) {
      console.error('Error pushing intervention to mobile:', error);
    } finally {
      setLoading(false);
    }
  };

  // ===== RENDER HELPERS =====

  /**
   * Render teaching guide for specific category
   * @param {string} categoryName - Category name
   * @return {JSX.Element} Teaching guide content
   */
  const renderTeachingGuide = (categoryName) => {
    const guides = {
      alphabet_knowledge: {
        strategies: [
          {
            title: "Multi-sensory Letter Recognition",
            description: "Use physical letter tiles or cards when working on letter recognition, allowing the student to see, touch, and hear the sounds simultaneously."
          },
          {
            title: "Systematic Letter Introduction", 
            description: "Practice letter identification in a systematic way, starting with the most common letters and gradually introducing similar-looking letters (b/d, p/q) separately."
          }
        ]
      },
      phonological_awareness: {
        strategies: [
          {
            title: "Physical Sound Patterns",
            description: "Practice clapping or tapping to syllable patterns, connecting physical movements to sound patterns."
          },
          {
            title: "Structured Sound Practice",
            description: "Practice breaking words into syllables, then individual sounds, following a consistent routine."
          }
        ]
      },
      word_recognition: {
        strategies: [
          {
            title: "Multi-sensory Word Practice",
            description: "Have the student trace words while saying them aloud, creating multi-sensory connections to reinforce word recognition."
          },
          {
            title: "Word Family Groups",
            description: "Create word family groups and practice them together to reinforce patterns."
          }
        ]
      },
      decoding: {
        strategies: [
          {
            title: "Visual Sound Highlighting",
            description: "Use colored markers to highlight different syllables or sounds within words as the student reads them."
          },
          {
            title: "Structured Decoding Strategies",
            description: "Teach specific decoding strategies like 'sound it out' and 'look for word chunks' with consistent practice."
          }
        ]
      },
      reading_comprehension: {
        strategies: [
          {
            title: "Visual Story Mapping",
            description: "Create visual maps or drawings to represent story elements while reading passages together."
          },
          {
            title: "Structured Comprehension Questions",
            description: "Use a structured approach to discuss stories: who, what, where, when, and why questions after each reading."
          }
        ]
      }
    };

    const categoryGuide = guides[categoryName] || { strategies: [] };

    return (
      <div className="literexia-teaching-guide">
        <div className="literexia-guide-header">
          <FaChalkboardTeacher className="literexia-guide-icon" />
          <h3>In-Person Teaching Guide for {formatCategoryName(categoryName)}</h3>
        </div>
        <div className="literexia-guide-content">
          <p>
            While using the digital activities, we recommend supporting {effectiveStudent?.firstName || "the student"}
            with the following strategies:
          </p>
          <div className="literexia-strategy-list">
            {categoryGuide.strategies.map((strategy, index) => (
              <div key={index} className="literexia-strategy">
                <div className="literexia-strategy-icon">
                  <FaHandsHelping />
                </div>
                <div className="literexia-strategy-content">
                  <h4>{strategy.title}</h4>
                  <p>{strategy.description}</p>
                </div>
              </div>
            ))}
            <div className="literexia-strategy">
              <div className="literexia-strategy-icon">
                <FaHandsHelping />
              </div>
              <div className="literexia-strategy-content">
                <h4>Immediate Feedback</h4>
                <p>
                  Provide immediate, specific feedback during practice sessions, highlighting what the student 
                  did correctly before offering corrections. Gradually reduce support as {effectiveStudent?.firstName || "the student"}'s 
                  confidence increases.
                </p>
              </div>
            </div>
          </div>
          <div className="literexia-monitoring-note">
            <strong>Progress Monitoring:</strong> After implementing these interventions for 2-3 weeks,
            review {effectiveStudent?.firstName || "the student"}'s progress and adjust strategies as needed.
          </div>
        </div>
      </div>
    );
  };

  const renderCategoryTabs = () => {
    return (
      <div className="literexia-category-tabs">
        <div className="literexia-tabs-header">
          <h3>Reading Skill Categories</h3>
          <div className="literexia-tabs-filter">
            <label>
              <input 
                type="checkbox" 
                checked={showNeedingInterventionOnly} 
                onChange={() => setShowNeedingInterventionOnly(!showNeedingInterventionOnly)}
              />
              Show only categories needing intervention
            </label>
          </div>
        </div>
        
        <div className="literexia-tabs-containerr">
          {effectiveCategoryResults.categories
            .filter(cat => !showNeedingInterventionOnly || (Number(cat.score) || 0) < 75)
            .map((category, index) => {
              const categoryName = category.categoryName;
              const displayName = formatCategoryName(categoryName);
              const score = Number(category.score) || 0;
              const needsIntervention = score < 75;
              const correctAnswers = category.correctAnswers || 0;
              const totalQuestions = category.totalQuestions || 0;
              const statusLabel = needsIntervention ? "NEEDS ATTENTION" : "NOT STARTED";
              const statusClass = needsIntervention ? "needs-attention" : "not-started";
              
              return (
                <div 
                  key={index}
                  className={`literexia-category-tabb ${selectedCategory === categoryName ? 'active' : ''} ${needsIntervention ? 'needs-intervention' : ''}`}
                  onClick={() => setSelectedCategory(categoryName)}
                >
                  <div className="literexia-tab-contentt">
                    <div className="literexia-tab-namee">{displayName}</div>
                    <div className="literexia-tab-scoree">{score}%</div>
                    
                    <div className="literexia-progress-indicators">
                      {Array.from({ length: Math.min(totalQuestions, 5) }).map((_, i) => (
                        <div 
                          key={i} 
                          className={`literexia-progress-indicator ${i < correctAnswers ? 'correct' : ''}`}
                        />
                      ))}
                    </div>
                    
                    {needsIntervention ? (
                      <div className={`literexia-tab-badge ${statusClass}`}>
                        <FaExclamationTriangle /> {statusLabel}
                      </div>
                    ) : (
                      <div className="literexia-status-text">
                        {correctAnswers > 0 
                          ? `Need ${Math.ceil(totalQuestions * 0.75) - correctAnswers} more to pass` 
                          : 'Not started'}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
        </div>
      </div>
    );
  };

  // ===== EARLY RETURNS =====

  // If no categories need intervention
  if (categoriesNeedingIntervention.length === 0) {
    return (
      <div className="literexia-prescriptive-container">
        <div className="literexia-progress-info">
          <div className="literexia-progress-info-icon">
            <FaCheckCircle />
          </div>
          <div className="literexia-progress-info-text">
            <h3>All Categories Passed</h3>
            <p>
              Great news! The student has passed all categories with scores above the 75% threshold.
              No interventions are needed at this time.
            </p>
          </div>
        </div>
      </div>
    );
  }

  // ===== DERIVED DATA FOR SELECTED CATEGORY =====
  const selectedCategoryData = effectiveCategoryResults.categories.find(
    cat => cat.categoryName === selectedCategory
  );
  const selectedAnalysis = selectedCategory ? getAnalysisForCategory(selectedCategory) : null;
  const selectedInterventions = selectedCategory ? getInterventionsForCategory(selectedCategory) : [];

  // ===== MAIN RENDER =====
  return (
    <div className="literexia-prescriptive-container">
      {/* Header */}
      <div className="literexia-prescriptive-header">
        <div className="literexia-header-icon">
          <FaBrain />
        </div>
        <div className="literexia-head-content">
          <h3>Prescriptive Analysis</h3>
          <p>
            Based on assessment results, this analysis identifies specific categories where the student 
            needs additional support. Each category below the 75% threshold has individualized recommendations
            and intervention activities.
          </p>
        </div>
      </div>
      
      {/* Category tabs */}
      {renderCategoryTabs()}
      
      {/* Selected category analysis */}
      {selectedCategory && selectedCategoryData && (
        <div className="literexia-category-analysis">
          <div className="literexia-analysis-header">
            <h3>{formatCategoryName(selectedCategory)} Analysis</h3>
            <div className="literexia-analysis-metrics">
              <div className="literexia-metric">
                <div className="literexia-metric-label">Current Score</div>
                <div className="literexia-metric-value">{selectedCategoryData.score}%</div>
              </div>
              <div className="literexia-metric-arrow">
                <FaArrowRight />
              </div>
              <div className="literexia-metric">
                <div className="literexia-metric-label">Target Score</div>
                <div className="literexia-metric-value">75%</div>
              </div>
              <div className="literexia-metric">
                <div className="literexia-metric-label">Gap</div>
                <div className="literexia-metric-value">{Math.max(0, 75 - selectedCategoryData.score)}%</div>
              </div>
            </div>
          </div>
          
          {/* Analysis content */}
          <div className="literexia-analysis-content">
            {selectedAnalysis ? (
              <>
                <div className="literexia-analysis-grid">
                  <div className="literexia-analysis-column">
                    <div className="literexia-analysis-section">
                      <h4><FaCheckCircle /> Strengths</h4>
                      {selectedAnalysis.strengths && selectedAnalysis.strengths.length > 0 ? (
                        <ul className="literexia-strengths-list">
                          {selectedAnalysis.strengths.map((strength, idx) => (
                            <li key={idx}>{strength}</li>
                          ))}
                        </ul>
                      ) : (
                        <p className="literexia-empty-info">No specific strengths identified yet.</p>
                      )}
                    </div>
                  </div>
                  
                  <div className="literexia-analysis-column">
                    <div className="literexia-analysis-section">
                      <h4><FaExclamationTriangle /> Weaknesses</h4>
                      {selectedAnalysis.weaknesses && selectedAnalysis.weaknesses.length > 0 ? (
                        <ul className="literexia-weaknesses-list">
                          {selectedAnalysis.weaknesses.map((weakness, idx) => (
                            <li key={idx}>{weakness}</li>
                          ))}
                        </ul>
                      ) : (
                        <p className="literexia-empty-info">No specific weaknesses identified yet.</p>
                      )}
                    </div>
                  </div>
                </div>
                
                {/* Recommendations */}
                <div className="literexia-analysis-section">
                  <h4><FaLightbulb /> Recommendations</h4>
                  {selectedAnalysis.recommendations && selectedAnalysis.recommendations.length > 0 ? (
                    <ul className="literexia-recommendations-list">
                      {selectedAnalysis.recommendations.map((recommendation, idx) => (
                        <li key={idx}>{recommendation}</li>
                      ))}
                    </ul>
                  ) : (
                    <p className="literexia-empty-info">No specific recommendations available yet.</p>
                  )}
                </div>
              </>
            ) : (
              <div className="literexia-empty-analysis">
                <FaInfoCircle />
                <p>No detailed analysis is available for this category yet. Create an intervention to address the learning gap.</p>
              </div>
            )}
          </div>
          
          {/* Teaching guide */}
          {renderTeachingGuide(selectedCategory)}
          
          {/* Current interventions */}
          <div className="literexia-current-interventions">
            <div className="literexia-interventions-header">
              <h3>Current Interventions</h3>
              <button 
                className="literexia-create-activity-btn" 
                onClick={() => handleCreateActivity(selectedCategory, selectedAnalysis)}
                disabled={loading}
              >
                <FaPlus /> Create New Intervention Activity
              </button>
            </div>
            
            {selectedInterventions.length > 0 ? (
              <div className="literexia-interventions-list">
                {selectedInterventions.map((intervention, index) => {
                  const progress = getProgressForIntervention(intervention._id);
                  const progressPercentage = progress ? progress.percentComplete : 0;
                  const correctPercentage = progress ? progress.percentCorrect : 0;
                  const isPassed = progress ? progress.passedThreshold : false;
                  
                  return (
                    <div key={index} className="literexia-intervention-card">
                      <div className="literexia-intervention-header">
                        <div className="literexia-intervention-title-container">
                          <h4 className="literexia-intervention-title">{intervention.name}</h4>
                          <div className="literexia-intervention-subtitle">{intervention.description}</div>
                        </div>
                        <div className={`literexia-intervention-status ${isPassed ? 'passed' : intervention.status}`}>
                          {isPassed ? 'Passed' : intervention.status === 'active' ? 'Active' : 'Draft'}
                        </div>
                      </div>
                      
                      <div className="literexia-intervention-progress">
                        <div className="literexia-progress-item">
                          <div className="literexia-progress-label">
                            <span>Completion</span>
                            <span>{progressPercentage}%</span>
                          </div>
                          <div className="literexia-progress-bar-container">
                            <div 
                              className="literexia-progress-bar-fill" 
                              style={{width: `${progressPercentage}%`}}
                            ></div>
                          </div>
                        </div>
                        
                        <div className="literexia-progress-item">
                          <div className="literexia-progress-label">
                            <span>Accuracy</span>
                            <span>{correctPercentage}%</span>
                          </div>
                          <div className="literexia-progress-bar-container">
                            <div 
                              className={`literexia-progress-bar-fill ${correctPercentage >= 75 ? 'achieved' : 'in-progress'}`}
                              style={{width: `${correctPercentage}%`}}
                            ></div>
                          </div>
                        </div>
                      </div>
                      
                      <div className="literexia-intervention-details">
                        <div className="literexia-intervention-detail">
                          <span className="literexia-detail-label">Reading Level:</span>
                          <span className="literexia-detail-value">{intervention.readingLevel}</span>
                        </div>
                        <div className="literexia-intervention-detail">
                          <span className="literexia-detail-label">Questions:</span>
                          <span className="literexia-detail-value">{intervention.questions ? intervention.questions.length : 0}</span>
                        </div>
                        <div className="literexia-intervention-detail">
                          <span className="literexia-detail-label">Status:</span>
                          <span className="literexia-detail-value">{intervention.status}</span>
                        </div>
                        <div className="literexia-intervention-detail">
                          <span className="literexia-detail-label">Created:</span>
                          <span className="literexia-detail-value">
                            {new Date(intervention.createdAt).toLocaleDateString()}
                          </span>
                        </div>
                      </div>
                      
                      <div className="literexia-intervention-actions">
                        <button 
                          className="literexia-edit-activity-btn"
                          onClick={() => handleCreateActivity(selectedCategory, selectedAnalysis, intervention)}
                          disabled={loading}
                        >
                          <FaEdit /> Edit Activity
                        </button>
                        {intervention.status === 'draft' && (
                          <button 
                            className="literexia-push-mobile-btn"
                            onClick={() => handlePushToMobile(intervention)}
                            disabled={loading}
                          >
                            {loading ? <FaSpinner className="fa-spin" /> : <FaMobile />}
                            Push to Mobile
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="literexia-empty-interventions">
                <FaInfoCircle />
                <p>No intervention activities have been created for this category yet. Create an activity to help the student improve their skills.</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Activity Edit Modal */}
      {showActivityModal && (
        <ActivityEditModal
          activity={editingActivity}
          student={effectiveStudent}
          category={selectedCategory}
          analysis={selectedAnalysis}
          onClose={() => setShowActivityModal(false)}
          onSave={handleSaveActivity}
        />
      )}
    </div>
  );
};

export default PrescriptiveAnalysis;