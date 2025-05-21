// src/pages/Teachers/ManageCategories/PreAssessment.jsx
import React, { useState, useEffect } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faClipboardCheck,
  faEye,
  faEdit,
  faPlus,
  faCheckCircle,
  faExclamationTriangle,
  faTimes,
  faInfoCircle,
  faListAlt,
  faBook,
  faChartLine,
  faArrowRight,
  faImages,
  faUpload,
  faQuestionCircle,
  faVolumeUp,
  faArrowLeft,
  faLock,
  faBan,
  faTrash,
  faGraduationCap
} from "@fortawesome/free-solid-svg-icons";
import "../../../css/Teachers/ManageCategories/PreAssessment.css";

// Tooltip component for help text
const Tooltip = ({ text }) => (
  <div className="pre-tooltip">
    <FontAwesomeIcon icon={faInfoCircle} className="pre-tooltip-icon" />
    <span className="pre-tooltip-text">{text}</span>
  </div>
);

const PreAssessment = () => {
  const [preAssessment, setPreAssessment] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showPreviewModal, setShowPreviewModal] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showSubmitConfirmModal, setShowSubmitConfirmModal] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [editingQuestionIndex, setEditingQuestionIndex] = useState(-1);
  const [showQuestionEditor, setShowQuestionEditor] = useState(false);
  const [currentQuestionData, setCurrentQuestionData] = useState({
    questionId: '',
    questionTypeId: '',
    questionType: '',
    questionText: '',
    questionImage: null,
    questionValue: '',
    hasAudio: false,
    audioUrl: '',
    difficultyLevel: '',
    options: [
      { optionId: '1', optionText: '', isCorrect: true },
      { optionId: '2', optionText: '', isCorrect: false }
    ]
  });
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    instructions: "",
    totalQuestions: 25,
    categoryCounts: {
      alphabet_knowledge: 5,
      phonological_awareness: 5,
      decoding: 5,
      word_recognition: 5,
      reading_comprehension: 5
    },
    language: "FL",
    questions: []
  });

  useEffect(() => {
    // Fetch pre-assessment data
    const fetchPreAssessment = async () => {
      try {
        setLoading(true);
        
        // In a real application, this would be an API call
        // Mock data representing the current pre-assessment curriculum
        const mockPreAssessment = {
          "_id": "68237e15439570aaa573f645",
          "assessmentId": "FL-G1-001",
          "title": "Filipino Reading Pre-Assessment - Grade 1",
          "description": "Comprehensive assessment of Filipino reading skills based on DEPED CRLA standards",
          "instructions": "This assessment evaluates reading skills in Filipino. Please answer all questions carefully.",
          "totalQuestions": 25,
          "categoryCounts": {
            "alphabet_knowledge": 5,
            "phonological_awareness": 5,
            "decoding": 5,
            "word_recognition": 5,
            "reading_comprehension": 5
          },
          "language": "FL",
          "type": "pre_assessment",
          "status": "rejected", // Can be: pending, approved, rejected
          "isActive": true,
          "createdAt": "2025-05-01T09:00:00.000Z",
          "updatedAt": "2025-05-01T09:00:00.000Z",
          "questions": [
            {
              "questionId": "AK_001",
              "questionTypeId": "alphabet_knowledge",
              "questionType": "patinig",
              "questionText": "Anong ang katumbas na maliit na letra?",
              "questionImage": "https://literexia-bucket.s3.ap-southeast-2.amazonaws.com/letters/A_big.png",
              "difficultyLevel": "low_emerging",
              "options": [
                {
                  "optionId": "1",
                  "optionText": "a",
                  "isCorrect": true
                },
                {
                  "optionId": "2",
                  "optionText": "e",
                  "isCorrect": false
                }
              ]
            },
            {
              "questionId": "PA_001",
              "questionTypeId": "phonological_awareness",
              "questionType": "tunog_letra",
              "questionText": "Anong Letra ang narinig?",
              "hasAudio": true,
              "audioUrl": "assets/audio/o_sound.mp3",
              "difficultyLevel": "low_emerging",
              "options": [
                {
                  "optionId": "1",
                  "optionText": "O",
                  "isCorrect": true
                },
                {
                  "optionId": "2",
                  "optionText": "U",
                  "isCorrect": false
                }
              ]
            },
            {
              "questionId": "DC_001",
              "questionTypeId": "decoding",
              "questionType": "word",
              "questionText": "Ano ang nasa larawan?",
              "questionImage": "https://literexia-bucket.s3.ap-southeast-2.amazonaws.com/words/dog.png",
              "difficultyLevel": "low_emerging",
              "options": [
                {
                  "optionId": "1",
                  "optionText": "ASO",
                  "isCorrect": true
                },
                {
                  "optionId": "2",
                  "optionText": "OSO",
                  "isCorrect": false
                }
              ]
            }
          ],
          "difficultyLevels": {
            "low_emerging": {
              "description": "Basic recognition tasks",
              "targetReadingLevel": "Low Emerging",
              "weight": 1
            },
            "high_emerging": {
              "description": "Simple identification and matching",
              "targetReadingLevel": "High Emerging", 
              "weight": 2
            },
            "developing": {
              "description": "Word formation and basic comprehension",
              "targetReadingLevel": "Developing",
              "weight": 3
            },
            "transitioning": {
              "description": "Sentence-level tasks and short texts",
              "targetReadingLevel": "Transitioning",
              "weight": 4
            },
            "at_grade_level": {
              "description": "Paragraph-level comprehension",
              "targetReadingLevel": "At Grade Level",
              "weight": 5
            }
          },
          "scoringRules": {
            "Low Emerging": {
              "part1ScoreRange": [0, 16],
              "readingPercentageRange": [0, 16],
              "correctAnswersRange": [0, 0]
            },
            "High Emerging": {
              "part1ScoreRange": [17, 30],
              "readingPercentageRange": [1, 25],
              "correctAnswersRange": [0, 0]
            },
            "Developing": {
              "part1ScoreRange": [17, 30],
              "readingPercentageRange": [26, 50],
              "correctAnswersRange": [1, 1]
            },
            "Transitioning": {
              "part1ScoreRange": [17, 30],
              "readingPercentageRange": [51, 75],
              "correctAnswersRange": [2, 3]
            },
            "At Grade Level": {
              "part1ScoreRange": [17, 30],
              "readingPercentageRange": [76, 100],
              "correctAnswersRange": [4, 5]
            }
          }
        };
        
        setPreAssessment(mockPreAssessment);
        
        // Initialize form data if editing
        if (mockPreAssessment) {
          setFormData({
            title: mockPreAssessment.title,
            description: mockPreAssessment.description,
            instructions: mockPreAssessment.instructions,
            totalQuestions: mockPreAssessment.totalQuestions,
            categoryCounts: mockPreAssessment.categoryCounts,
            language: mockPreAssessment.language,
            questions: mockPreAssessment.questions || []
          });
        }
        
        setLoading(false);
      } catch (err) {
        setError("Failed to load pre-assessment data. Please try again.");
        setLoading(false);
      }
    };
    
    fetchPreAssessment();
  }, []);

  // Handle navigating through questions in preview modal
  const handleQuestionNavigation = (direction) => {
    if (direction === "next" && currentQuestionIndex < preAssessment.questions.length - 1) {
      setCurrentQuestionIndex(currentQuestionIndex + 1);
    } else if (direction === "prev" && currentQuestionIndex > 0) {
      setCurrentQuestionIndex(currentQuestionIndex - 1);
    }
  };

  // Modified to count questions automatically
  const handleFormChange = (e) => {
    const { name, value } = e.target;
    
    // We don't need to handle totalQuestions change anymore since it's based on actual questions count
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  // New function to distribute questions evenly across categories
  const distributeQuestionsEvenly = (total, categories) => {
    const baseCount = Math.floor(total / categories.length);
    const remainder = total % categories.length;
    
    const newCounts = {};
    categories.forEach((category, index) => {
      // Add one extra to some categories if there's a remainder
      newCounts[category] = baseCount + (index < remainder ? 1 : 0);
    });
    
    return newCounts;
  };

  // Handle category count changes - now only updates the total
  const handleCategoryCountChange = (category, value) => {
    // This function is no longer needed as we auto-distribute
    // Keeping it for backward compatibility but making it a no-op
  };

  // Define category-specific question types
  const getCategoryQuestionTypes = (categoryId) => {
    const categoryQuestionTypes = {
      'alphabet_knowledge': ['patinig', 'katinig', 'malaking_titik', 'maliit_na_titik'],
      'phonological_awareness': ['tunog_letra', 'pantig', 'rima'],
      'decoding': ['malapantig', 'word', 'salita_larawan'],
      'word_recognition': ['word', 'salitang_madalas_makita', 'sight_word'],
      'reading_comprehension': ['sentence', 'talata', 'buong_kwento']
    };
    
    return categoryId ? (categoryQuestionTypes[categoryId] || []) : [];
  };

  // Handle creating new pre-assessment
  const handleCreatePreAssessment = () => {
    const defaultTotal = 25;
    const categories = ["alphabet_knowledge", "phonological_awareness", "decoding", "word_recognition", "reading_comprehension"];
    const newCategoryCounts = distributeQuestionsEvenly(defaultTotal, categories);
    
    setFormData({
      title: "",
      description: "",
      instructions: "",
      totalQuestions: 0, // Will be automatically updated based on questions count
      categoryCounts: newCategoryCounts,
      language: "FL",
      questions: []
    });
    setShowCreateModal(true);
  };

  // Handle editing existing pre-assessment
  const handleEditPreAssessment = () => {
    if (preAssessment.status !== "rejected") {
      alert("Only rejected pre-assessments can be edited. Approved or pending assessments cannot be modified.");
      return;
    }
    setShowEditModal(true);
  };

  // Handle deleting pre-assessment
  const handleDeleteConfirm = () => {
    if (preAssessment.status !== "rejected") {
      alert("Only rejected pre-assessments can be deleted. Approved or pending assessments cannot be removed.");
      return;
    }
    setShowDeleteModal(true);
  };

  // Handle form submission
  const handleFormSubmit = () => {
    // Validate form
    if (!formData.title || !formData.description || !formData.instructions) {
      alert("Please fill in all required fields.");
      return;
    }

    // Show confirmation dialog
    setShowSubmitConfirmModal(true);
  };

  // Handle confirmed submission
  const handleConfirmSubmit = () => {
    // In a real app, this would be an API call
    const newPreAssessment = {
      ...formData,
      _id: preAssessment ? preAssessment._id : Date.now().toString(),
      assessmentId: preAssessment ? preAssessment.assessmentId : `FL-G1-${Date.now()}`,
      type: "pre_assessment",
      status: "pending",
      isActive: false,
      createdAt: preAssessment ? preAssessment.createdAt : new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    setPreAssessment(newPreAssessment);
    setShowSubmitConfirmModal(false);
    setShowCreateModal(false);
    setShowEditModal(false);
    setShowSuccessModal(true);

    // Auto-close success modal after 3 seconds
    setTimeout(() => {
      setShowSuccessModal(false);
    }, 3000);
  };

  // Handle deletion
  const handleDelete = () => {
    // In a real app, this would be an API call
    setPreAssessment(null);
    setShowDeleteModal(false);
    setShowSuccessModal(true);
    
    setTimeout(() => {
      setShowSuccessModal(false);
    }, 3000);
  };

  // Check if actions are allowed based on status
  const canEdit = () => {
    return !preAssessment || preAssessment.status === "rejected";
  };

  const canDelete = () => {
    return preAssessment && preAssessment.status === "rejected";
  };

  // Modified to add auto-generation of Question ID
  const handleAddQuestion = () => {
    setCurrentQuestionData({
      questionId: '', // Will be auto-generated when category is selected
      questionTypeId: '',
      questionType: '',
      questionText: '',
      questionImage: null,
      questionValue: '',
      difficultyLevel: '',
      options: [
        { optionId: '1', optionText: '', isCorrect: true },
        { optionId: '2', optionText: '', isCorrect: false }
      ]
    });
    setEditingQuestionIndex(-1);
    setShowQuestionEditor(true);
  };

  // Adding a function to generate question ID based on category
  const generateQuestionId = (categoryId) => {
    const prefixMap = {
      'alphabet_knowledge': 'AK',
      'phonological_awareness': 'PA',
      'decoding': 'DC',
      'word_recognition': 'WR',
      'reading_comprehension': 'RC'
    };
    
    const prefix = prefixMap[categoryId] || 'QS';
    
    // Count how many questions of this category type already exist
    const existingCount = formData.questions.filter(q => q.questionTypeId === categoryId).length;
    const paddedNumber = String(existingCount + 1).padStart(3, '0');
    
    return `${prefix}_${paddedNumber}`;
  };

  // Restore missing handleEditQuestion function
  const handleEditQuestion = (index) => {
    const question = formData.questions[index];
    setCurrentQuestionData({
      questionId: question.questionId || '',
      questionTypeId: question.questionTypeId || '',
      questionType: question.questionType || '',
      questionText: question.questionText || '',
      questionImage: question.questionImage || null,
      questionValue: question.questionValue || '',
      difficultyLevel: question.difficultyLevel || '',
      options: question.options && question.options.length >= 2 ? 
        question.options.slice(0, 2) : // Only take the first two options
        [
          { optionId: '1', optionText: '', isCorrect: true },
          { optionId: '2', optionText: '', isCorrect: false }
        ]
    });
    setEditingQuestionIndex(index);
    setShowQuestionEditor(true);
  };

  // Restore missing handleDeleteQuestion function
  const handleDeleteQuestion = (index) => {
    if (window.confirm('Are you sure you want to delete this question?')) {
      setFormData(prev => {
        const newQuestions = prev.questions.filter((_, i) => i !== index);
        return {
          ...prev,
          questions: newQuestions,
          totalQuestions: newQuestions.length // Update total questions count
        };
      });
    }
  };

  // Modified to update questionId when category changes
  const handleQuestionDataChange = (e) => {
    const { name, value } = e.target;
    
    if (name === 'questionTypeId') {
      // Auto-generate questionId when category is selected
      const questionId = generateQuestionId(value);
      
      setCurrentQuestionData(prev => ({
        ...prev,
        [name]: value,
        questionId: questionId,
        // Reset question type when category changes
        questionType: ''
      }));
    } else {
      setCurrentQuestionData(prev => ({
        ...prev,
        [name]: value
      }));
    }
  };

  const handleQuestionImageUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    
    const reader = new FileReader();
    reader.onload = () => {
      setCurrentQuestionData(prev => ({
        ...prev,
        questionImage: reader.result
      }));
    };
    reader.readAsDataURL(file);
  };

  const handleOptionTextChange = (index, value) => {
    setCurrentQuestionData(prev => ({
      ...prev,
      options: prev.options.map((option, i) => 
        i === index ? { ...option, optionText: value } : option
      )
    }));
  };

  const handleOptionCorrectChange = (index) => {
    setCurrentQuestionData(prev => ({
      ...prev,
      options: prev.options.map((option, i) => ({
        ...option,
        isCorrect: i === index
      }))
    }));
  };

  const handleSaveQuestion = () => {
    // Validate question data
    const errors = {};
    
    if (!currentQuestionData.questionText.trim()) {
      errors.questionText = 'Question text is required';
    }
    
    if (!currentQuestionData.questionTypeId) {
      errors.questionTypeId = 'Category is required';
    }
    
    if (!currentQuestionData.questionType) {
      errors.questionType = 'Question type is required';
    }
    
    if (!currentQuestionData.difficultyLevel) {
      errors.difficultyLevel = 'Difficulty level is required';
    }
    
    if (!currentQuestionData.options.some(opt => opt.isCorrect)) {
      errors.options = 'At least one option must be marked as correct';
    }
    
    if (currentQuestionData.options.some(opt => !opt.optionText.trim())) {
      errors.optionText = 'All option texts must be filled in';
    }
    
    // Display errors if any
    if (Object.keys(errors).length > 0) {
      const errorMessage = Object.values(errors).join('\n');
      alert(errorMessage);
      return;
    }
    
    const questionData = {
      ...currentQuestionData,
      questionId: currentQuestionData.questionId || generateQuestionId(currentQuestionData.questionTypeId),
      questionNumber: editingQuestionIndex >= 0 ? editingQuestionIndex + 1 : formData.questions.length + 1,
      order: editingQuestionIndex >= 0 ? editingQuestionIndex + 1 : formData.questions.length + 1
    };
    
    setFormData(prev => {
      const newQuestions = [...prev.questions];
      if (editingQuestionIndex >= 0) {
        newQuestions[editingQuestionIndex] = questionData;
      } else {
        newQuestions.push(questionData);
      }
      
      // Update the total questions count based on the actual number of questions
      return {
        ...prev,
        questions: newQuestions,
        totalQuestions: newQuestions.length
      };
    });
    
    setShowQuestionEditor(false);
    setEditingQuestionIndex(-1);
  };

  if (loading) {
    return (
      <div className="pre-assessment-container">
        <div className="pre-loading">
          <div className="pre-spinner"></div>
          <p>Loading pre-assessment curriculum...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="pre-assessment-container">
        <div className="pre-error">
          <FontAwesomeIcon icon={faExclamationTriangle} className="pre-error-icon" />
          <p>{error}</p>
          <button onClick={() => window.location.reload()} className="pre-button">
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="pre-assessment-container">
      <div className="pre-header">
        <h2>Pre-Assessment Management</h2>
        <p>
          Manage the standardized pre-assessment curriculum used to determine students' initial reading levels based on CRLA standards.
        </p>
      </div>

      {!preAssessment ? (
        // No pre-assessment exists - show create option
        <div className="pre-no-assessment">
          <div className="pre-no-assessment-icon">
            <FontAwesomeIcon icon={faClipboardCheck} />
          </div>
          <h3>No Pre-Assessment Curriculum Found</h3>
          <p>Create a standardized pre-assessment that will be used to evaluate all new students' initial reading levels.</p>
          <button 
            className="pre-button primary"
            onClick={handleCreatePreAssessment}
          >
            <FontAwesomeIcon icon={faPlus} /> Create Pre-Assessment Curriculum
          </button>
        </div>
      ) : (
        // Pre-assessment exists - show overview and actions
        <div className="pre-assessment-overview">
          <div className="pre-assessment-card">
            <div className="pre-assessment-info">
              <div className="pre-assessment-title">
                <FontAwesomeIcon icon={faClipboardCheck} className="pre-icon" />
                <h3>{preAssessment.title}</h3>
                <div className="pre-status-container">
                  {preAssessment.status === "approved" ? (
                    <span className="pre-status-badge active">
                      <FontAwesomeIcon icon={faCheckCircle} /> Active
                    </span>
                  ) : preAssessment.status === "pending" ? (
                    <span className="pre-status-badge pending">
                      <FontAwesomeIcon icon={faLock} /> Pending Approval
                    </span>
                  ) : (
                    <span className="pre-status-badge rejected">
                      <FontAwesomeIcon icon={faBan} /> Rejected
                    </span>
                  )}
                </div>
              </div>
              <p className="pre-assessment-description">{preAssessment.description}</p>
              
              <div className="pre-assessment-details">
                <div className="pre-detail-item">
                  <span className="pre-detail-label">Language:</span>
                  <span className="pre-detail-value">{preAssessment.language === "FL" ? "Filipino" : preAssessment.language}</span>
                </div>
                <div className="pre-detail-item">
                  <span className="pre-detail-label">Total Questions:</span>
                  <span className="pre-detail-value">{preAssessment.totalQuestions}</span>
                </div>
                <div className="pre-detail-item">
                  <span className="pre-detail-label">Last Updated:</span>
                  <span className="pre-detail-value">
                    {new Date(preAssessment.updatedAt).toLocaleDateString()}
                  </span>
                </div>
              </div>
              
              <div className="pre-category-distribution">
                <h4>Category Distribution</h4>
                <div className="pre-category-bars">
                  {Object.entries(preAssessment.categoryCounts).map(([category, count]) => (
                    <div key={category} className="pre-category-bar-item">
                      <div className="pre-category-label">
                        {category.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                      </div>
                      <div className="pre-category-bar-container">
                        <div 
                          className="pre-category-bar" 
                          style={{ width: `${(count / preAssessment.totalQuestions) * 100}%` }}
                        >
                          <span className="pre-category-count">{count}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
          
          <div className="pre-actions-panel">
            <button 
              className="pre-action-button"
              onClick={() => setShowPreviewModal(true)}
            >
              <FontAwesomeIcon icon={faEye} />
              <span>Preview Assessment</span>
            </button>
            
            {canEdit() && (
              <button 
                className="pre-action-button"
                onClick={handleEditPreAssessment}
              >
                <FontAwesomeIcon icon={faEdit} />
                <span>Edit Assessment</span>
              </button>
            )}
            
            {canDelete() && (
              <button 
                className="pre-action-button delete"
                onClick={handleDeleteConfirm}
              >
                <FontAwesomeIcon icon={faTrash} />
                <span>Delete Assessment</span>
              </button>
            )}
            
            {!canEdit() && !canDelete() && (
              <div className="pre-action-restriction">
                <FontAwesomeIcon icon={faInfoCircle} />
                <p>
                  {preAssessment.status === "approved" 
                    ? "This assessment is currently active and cannot be modified. Contact an administrator for changes."
                    : "This assessment is pending approval and cannot be modified until it's approved or rejected."
                  }
                </p>
              </div>
            )}
          </div>
        </div>
      )}
      
      <div className="pre-system-info">
        <h3>About Pre-Assessment Process</h3>
        <div className="pre-info-grid">
          <div className="pre-info-card">
            <div className="pre-info-icon">
              <FontAwesomeIcon icon={faClipboardCheck} />
            </div>
            <div className="pre-info-content">
              <h4>Standardized Format</h4>
              <p>
                The pre-assessment follows a standardized format covering all five CRLA categories, 
                with questions balanced by difficulty level for accurate initial assessment.
              </p>
            </div>
          </div>
          
          <div className="pre-info-card">
            <div className="pre-info-icon">
              <FontAwesomeIcon icon={faGraduationCap} />
            </div>
            <div className="pre-info-content">
              <h4>Automatic Level Assignment</h4>
              <p>
                Based on performance, the system automatically assigns one of five reading 
                levels: Low Emerging, High Emerging, Developing, Transitioning, or At Grade Level.
              </p>
            </div>
          </div>
          
          <div className="pre-info-card">
            <div className="pre-info-icon">
              <FontAwesomeIcon icon={faChartLine} />
            </div>
            <div className="pre-info-content">
              <h4>Performance Tracking</h4>
              <p>
                Student performance is tracked across all categories, providing detailed 
                insights into strengths and areas for improvement to guide instruction.
              </p>
            </div>
          </div>
          
          <div className="pre-info-card">
            <div className="pre-info-icon">
              <FontAwesomeIcon icon={faListAlt} />
            </div>
            <div className="pre-info-content">
              <h4>Post-Assessment Guidance</h4>
              <p>
                Results directly inform the creation of targeted post-assessments, 
                helping teachers focus on areas where students need the most support.
              </p>
            </div>
          </div>
        </div>
      </div>
      
      <div className="pre-process-flow">
        <h3>Pre-Assessment Process Flow</h3>
        <div className="pre-flow-steps">
          <div className="pre-flow-step">
            <div className="pre-step-number">1</div>
            <div className="pre-step-content">
              <h4>Curriculum Setup</h4>
              <p>Teachers create/update the standardized pre-assessment curriculum for the academic year.</p>
            </div>
          </div>
          <div className="pre-flow-connector">
            <FontAwesomeIcon icon={faArrowRight} />
          </div>
          <div className="pre-flow-step">
            <div className="pre-step-number">2</div>
            <div className="pre-step-content">
              <h4>Admin Approval</h4>
              <p>The assessment must be approved by administrators before it becomes active.</p>
            </div>
          </div>
          <div className="pre-flow-connector">
            <FontAwesomeIcon icon={faArrowRight} />
          </div>
          <div className="pre-flow-step">
            <div className="pre-step-number">3</div>
            <div className="pre-step-content">
              <h4>Student Assignment</h4>
              <p>New students are automatically assigned the active pre-assessment.</p>
            </div>
          </div>
          <div className="pre-flow-connector">
            <FontAwesomeIcon icon={faArrowRight} />
          </div>
          <div className="pre-flow-step">
            <div className="pre-step-number">4</div>
            <div className="pre-step-content">
              <h4>Assessment Completion</h4>
              <p>Students complete the assessment on the mobile app with automatic scoring.</p>
            </div>
          </div>
          <div className="pre-flow-connector">
            <FontAwesomeIcon icon={faArrowRight} />
          </div>
          <div className="pre-flow-step">
            <div className="pre-step-number">5</div>
            <div className="pre-step-content">
              <h4>Level Assignment & Planning</h4>
              <p>System assigns reading levels and teachers create targeted post-assessments.</p>
            </div>
          </div>
        </div>
      </div>

      {/* Preview Modal */}
      {showPreviewModal && (
        <div className="pre-modal-overlay">
          <div className="pre-modal pre-preview-modal">
            <div className="pre-modal-header">
              <h3>
                <FontAwesomeIcon icon={faEye} className="pre-modal-header-icon" />
                Pre-Assessment Preview
              </h3>
              <button 
                className="pre-modal-close"
                onClick={() => {
                  setShowPreviewModal(false);
                  setCurrentQuestionIndex(0);
                }}
              >
                <FontAwesomeIcon icon={faTimes} />
              </button>
            </div>
            
            <div className="pre-modal-body">
              <div className="pre-preview-info">
                <div className="pre-preview-section">
                  <span className="pre-preview-label">Assessment:</span>
                  <span className="pre-preview-value">{preAssessment.title}</span>
                </div>
                
                <div className="pre-preview-section">
                  <span className="pre-preview-label">Total Questions:</span>
                  <span className="pre-preview-value">{preAssessment.totalQuestions}</span>
                </div>
                
                <div className="pre-preview-section">
                  <span className="pre-preview-label">Question {currentQuestionIndex + 1} of {preAssessment.questions.length}</span>
                </div>
              </div>
              
              <div className="pre-question-preview">
                <div className="pre-question-category">
                  {preAssessment.questions[currentQuestionIndex].questionTypeId.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                </div>
                
                <div className="pre-question-content">
                  {preAssessment.questions[currentQuestionIndex].questionImage && (
                    <div className="pre-question-image">
                      <img 
                        src={preAssessment.questions[currentQuestionIndex].questionImage} 
                        alt="Question visual" 
                      />
                    </div>
                  )}
                  
                  <div className="pre-question-text">
                    {preAssessment.questions[currentQuestionIndex].questionText}
                    
                    {preAssessment.questions[currentQuestionIndex].hasAudio && (
                      <div className="pre-audio-control">
                        <button className="pre-audio-button">
                          <FontAwesomeIcon icon={faArrowRight} /> Play Sound
                        </button>
                      </div>
                    )}
                  </div>
                </div>
                
                <div className="pre-options-preview">
                  {preAssessment.questions[currentQuestionIndex].options.map((option, index) => (
                    <div 
                      key={option.optionId} 
                      className={`pre-option-item ${option.isCorrect ? 'pre-correct-option' : ''}`}
                    >
                      <div className="pre-option-content">
                        {option.optionText}
                      </div>
                      {option.isCorrect && (
                        <div className="pre-correct-marker">
                          <FontAwesomeIcon icon={faCheckCircle} />
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
              
              <div className="pre-preview-instructions">
                <p>
                  <FontAwesomeIcon icon={faInfoCircle} />
                  <span>
                    This preview shows how the assessment will appear to students on mobile devices. 
                    Questions are presented sequentially with automatic progression.
                  </span>
                </p>
              </div>
              
              <div className="pre-preview-navigation">
                <button 
                  className="pre-nav-button"
                  onClick={() => handleQuestionNavigation("prev")}
                  disabled={currentQuestionIndex === 0}
                >
                  <FontAwesomeIcon icon={faArrowLeft} /> Previous
                </button>
                
                <div className="pre-question-indicator">
                  Question {currentQuestionIndex + 1} of {preAssessment.questions.length}
                </div>
                
                <button 
                  className="pre-nav-button"
                  onClick={() => handleQuestionNavigation("next")}
                  disabled={currentQuestionIndex === preAssessment.questions.length - 1}
                >
                  Next <FontAwesomeIcon icon={faArrowRight} />
                </button>
              </div>
            </div>
            
            <div className="pre-modal-footer">
              <button 
                className="pre-button"
                onClick={() => {
                  setShowPreviewModal(false);
                  setCurrentQuestionIndex(0);
                }}
              >
                Close Preview
              </button>
            </div>
          </div>
        </div>
      )}

     {/* Enhanced Create/Edit Modal */}
{(showCreateModal || showEditModal) && (
  <div className="pre-modal-overlay">
    <div className="pre-modal pre-form-modal pre-enhanced-modal">
      <div className="pre-modal-header">
        <h3>
          <FontAwesomeIcon 
            icon={showCreateModal ? faPlus : faEdit} 
            className="pre-modal-header-icon" 
          />
          {showCreateModal ? "Create Pre-Assessment Curriculum" : "Edit Pre-Assessment Curriculum"}
        </h3>
        <button 
          className="pre-modal-close"
          onClick={() => {
            setShowCreateModal(false);
            setShowEditModal(false);
            setEditingQuestionIndex(-1);
            setShowQuestionEditor(false);
          }}
        >
          <FontAwesomeIcon icon={faTimes} />
        </button>
      </div>
      
      <div className="pre-modal-body">
        {!showQuestionEditor ? (
          // Main Assessment Form
          <form className="pre-assessment-form">
            <div className="pre-form-section">
              <h4>Assessment Information</h4>
              
              <div className="pre-form-group">
                <label htmlFor="title">
                  Assessment Title:
                  <Tooltip text="Enter a descriptive title for this pre-assessment curriculum." />
                </label>
                <input
                  type="text"
                  id="title"
                  name="title"
                  value={formData.title}
                  onChange={handleFormChange}
                  placeholder="e.g., Filipino Reading Pre-Assessment - Grade 1"
                  required
                />
              </div>
              
              <div className="pre-form-group">
                <label htmlFor="description">
                  Description:
                  <Tooltip text="Describe the purpose and scope of this assessment." />
                </label>
                <textarea
                  id="description"
                  name="description"
                  value={formData.description}
                  onChange={handleFormChange}
                  placeholder="Comprehensive assessment of reading skills based on CRLA standards"
                  rows={3}
                  required
                />
              </div>
              
              <div className="pre-form-group">
                <label htmlFor="instructions">
                  Student Instructions:
                  <Tooltip text="Instructions that will be displayed to students before they begin the assessment." />
                </label>
                <textarea
                  id="instructions"
                  name="instructions"
                  value={formData.instructions}
                  onChange={handleFormChange}
                  placeholder="Instructions for students on how to complete the assessment"
                  rows={3}
                  required
                />
              </div>
              
              <div className="pre-form-row">
                <div className="pre-form-group">
                  <label htmlFor="language">
                    Language:
                    <Tooltip text="Select the primary language for this assessment." />
                  </label>
                  <select
                    id="language"
                    name="language"
                    value={formData.language}
                    onChange={handleFormChange}
                    required
                  >
                    <option value="FL">Filipino</option>
                    <option value="EN">English</option>
                  </select>
                </div>
                
                <div className="pre-form-group">
                  <label htmlFor="totalQuestions">
                    Total Questions:
                    <Tooltip text="Total number of questions in the assessment. This is calculated automatically based on the questions you add." />
                  </label>
                  <div className="pre-total-questions-display">
                    <span className="pre-total-questions-value">
                      {formData.questions.length}
                    </span>
                    <span className="pre-total-questions-label">
                      questions
                    </span>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="pre-form-section">
              <h4>Category Distribution</h4>
              
              <p className="pre-form-help">Questions are automatically distributed across CRLA categories as you add them:</p>
              
              <div className="pre-composition-preview">
                <div className="pre-composition-chart">
                  {Object.entries(formData.categoryCounts).map(([category, count]) => {
                    // Count actual questions per category
                    const questionsInCategory = formData.questions.filter(q => q.questionTypeId === category).length;
                    const percentage = formData.questions.length > 0 
                      ? Math.round((questionsInCategory / formData.questions.length) * 100) 
                      : 0;
                    
                    return (
                      <div key={category} className="pre-composition-item">
                        <div className="pre-composition-label">
                          {category.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                        </div>
                        <div className="pre-composition-bar-container">
                          <div 
                            className="pre-composition-bar"
                            style={{ width: `${percentage}%` }}
                          >
                            <span className="pre-composition-count">{questionsInCategory}</span>
                          </div>
                        </div>
                        <div className="pre-composition-percentage">
                          {percentage}%
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Enhanced Questions Management Section */}
            <div className="pre-form-section">
              <div className="pre-questions-header">
                <h4>
                  <FontAwesomeIcon icon={faListAlt} style={{ marginRight: '8px' }} />
                  Assessment Questions
                </h4>
                <button
                  type="button"
                  className="pre-add-question-btn"
                  onClick={handleAddQuestion}
                >
                  <FontAwesomeIcon icon={faPlus} /> Add Question
                </button>
              </div>
              
              {formData.questions && formData.questions.length > 0 ? (
                <div className="pre-questions-list">
                  {formData.questions.map((question, index) => (
                    <div key={question.questionId || index} className="pre-question-item">
                      <div className="pre-question-item-header">
                        <div className="pre-question-info">
                          <span className="pre-question-number">Q{index + 1}</span>
                          <div className="pre-question-details">
                            <span className="pre-question-category">
                              {question.questionTypeId?.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                            </span>
                            <span className="pre-question-type">
                              {question.questionType} • {question.difficultyLevel?.replace('_', ' ')}
                            </span>
                          </div>
                        </div>
                        
                        <div className="pre-question-actions">
                          <button
                            type="button"
                            className="pre-question-action-btn pre-edit-btn"
                            onClick={() => handleEditQuestion(index)}
                            title="Edit Question"
                          >
                            <FontAwesomeIcon icon={faEdit} />
                          </button>
                          <button
                            type="button"
                            className="pre-question-action-btn pre-delete-btn"
                            onClick={() => handleDeleteQuestion(index)}
                            title="Delete Question"
                          >
                            <FontAwesomeIcon icon={faTrash} />
                          </button>
                        </div>
                      </div>
                      
                      <div className="pre-question-preview">
                        <div className="pre-question-text-preview">
                          {question.questionText}
                        </div>
                        
                        <div className="pre-question-meta">
                          {question.questionImage && (
                            <span className="pre-question-meta-item">
                              <FontAwesomeIcon icon={faImages} /> Has Image
                            </span>
                          )}
                          {question.hasAudio && (
                            <span className="pre-question-meta-item">
                              <FontAwesomeIcon icon={faVolumeUp} /> Has Audio
                            </span>
                          )}
                          <span className="pre-question-meta-item">
                            <FontAwesomeIcon icon={faCheckCircle} /> {question.options?.length || 0} Options
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="pre-no-questions">
                  <FontAwesomeIcon icon={faInfoCircle} className="pre-no-questions-icon" />
                  <p>No questions added yet. Click "Add Question" to begin building your assessment.</p>
                </div>
              )}
            </div>
            
            <div className="pre-form-note">
              <FontAwesomeIcon icon={faInfoCircle} />
              <p>
                The assessment structure will be submitted for admin approval. All questions must be added before submission.
              </p>
            </div>
          </form>
        ) : (
          // Question Editor
          <div className="pre-question-editor">
            <div className="pre-editor-header">
              <h4>
                <FontAwesomeIcon icon={editingQuestionIndex >= 0 ? faEdit : faPlus} />
                {editingQuestionIndex >= 0 ? `Edit Question ${editingQuestionIndex + 1}` : 'Add New Question'}
              </h4>
              <button
                type="button"
                className="pre-editor-back-btn"
                onClick={() => setShowQuestionEditor(false)}
              >
                <FontAwesomeIcon icon={faArrowLeft} /> Back to Assessment
              </button>
            </div>
            
            <form className="pre-question-form">
              <div className="pre-question-form-grid">
                <div className="pre-form-group">
                  <label htmlFor="questionId">
                    Question ID:
                    <Tooltip text="Unique identifier for this question (auto-generated)" />
                  </label>
                  <input
                    type="text"
                    id="questionId"
                    name="questionId"
                    value={currentQuestionData.questionId || ''}
                    readOnly
                    className="pre-readonly-input"
                    placeholder="Will be auto-generated when category is selected"
                  />
                </div>
                
                <div className="pre-form-group">
                  <label htmlFor="questionTypeId">
                    Category: <span className="pre-required-field">*</span>
                    <Tooltip text="Select the reading category for this question" />
                  </label>
                  <select
                    id="questionTypeId"
                    name="questionTypeId"
                    value={currentQuestionData.questionTypeId || ''}
                    onChange={handleQuestionDataChange}
                    required
                    className={!currentQuestionData.questionTypeId ? 'pre-validation-highlight' : ''}
                  >
                    <option value="">Select Category</option>
                    <option value="alphabet_knowledge">Alphabet Knowledge</option>
                    <option value="phonological_awareness">Phonological Awareness</option>
                    <option value="decoding">Decoding</option>
                    <option value="word_recognition">Word Recognition</option>
                    <option value="reading_comprehension">Reading Comprehension</option>
                  </select>
                  {!currentQuestionData.questionTypeId && (
                    <div className="pre-validation-message">Please select a category</div>
                  )}
                </div>
                
                <div className="pre-form-group">
                  <label htmlFor="questionType">
                    Question Type: <span className="pre-required-field">*</span>
                    <Tooltip text="Specific type within the category" />
                  </label>
                  <select
                    id="questionType"
                    name="questionType"
                    value={currentQuestionData.questionType || ''}
                    onChange={handleQuestionDataChange}
                    required
                    disabled={!currentQuestionData.questionTypeId}
                    className={currentQuestionData.questionTypeId && !currentQuestionData.questionType ? 'pre-validation-highlight' : ''}
                  >
                    <option value="">Select Type</option>
                    {getCategoryQuestionTypes(currentQuestionData.questionTypeId).map(type => (
                      <option key={type} value={type}>
                        {type.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                      </option>
                    ))}
                  </select>
                  {currentQuestionData.questionTypeId && !currentQuestionData.questionType && (
                    <div className="pre-validation-message">Please select a question type</div>
                  )}
                </div>
                
                <div className="pre-form-group">
                  <label htmlFor="difficultyLevel">
                    Difficulty Level: <span className="pre-required-field">*</span>
                    <Tooltip text="Select the appropriate difficulty level for this question" />
                  </label>
                  <select
                    id="difficultyLevel"
                    name="difficultyLevel"
                    value={currentQuestionData.difficultyLevel || ''}
                    onChange={handleQuestionDataChange}
                    required
                    className={!currentQuestionData.difficultyLevel ? 'pre-validation-highlight' : ''}
                  >
                    <option value="">Select Difficulty</option>
                    <option value="low_emerging">Low Emerging</option>
                    <option value="high_emerging">High Emerging</option>
                    <option value="developing">Developing</option>
                    <option value="transitioning">Transitioning</option>
                    <option value="at_grade_level">At Grade Level</option>
                  </select>
                  {!currentQuestionData.difficultyLevel && (
                    <div className="pre-validation-message">Please select a difficulty level</div>
                  )}
                </div>
                
                <div className="pre-form-group pre-full-width">
                  <label htmlFor="questionText">
                    Question Text: <span className="pre-required-field">*</span>
                    <Tooltip text="The question text that will be displayed to students" />
                  </label>
                  <textarea
                    id="questionText"
                    name="questionText"
                    value={currentQuestionData.questionText || ''}
                    onChange={handleQuestionDataChange}
                    placeholder="Enter the question text (e.g., 'Anong ang katumbas na maliit na letra?')"
                    rows={3}
                    required
                    className={!currentQuestionData.questionText.trim() ? 'pre-validation-highlight' : ''}
                  />
                  {!currentQuestionData.questionText.trim() && (
                    <div className="pre-validation-message">Please enter question text</div>
                  )}
                </div>
                
                <div className="pre-form-group">
                  <label htmlFor="questionValue">
                    Question Value:
                    <Tooltip text="Optional value shown with the question (e.g., letter, word)" />
                  </label>
                  <input
                    type="text"
                    id="questionValue"
                    name="questionValue"
                    value={currentQuestionData.questionValue || ''}
                    onChange={handleQuestionDataChange}
                    placeholder="e.g., 'A', 'BO + LA'"
                  />
                </div>
                
                <div className="pre-form-group">
                  <label htmlFor="questionImage" style={{ color: '#4a5568' }}>
                    Question Image:
                    <Tooltip text="Upload an image for this question" />
                  </label>
                  <div className="pre-file-upload-container">
                    <label className="pre-file-upload-btn">
                      <FontAwesomeIcon icon={faUpload} />
                      {currentQuestionData.questionImage ? 'Change Image' : 'Upload Image'}
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleQuestionImageUpload}
                        className="pre-file-input-hidden"
                        id="questionImage"
                      />
                    </label>
                    {currentQuestionData.questionImage && (
                      <div className="pre-image-preview">
                        <img 
                          src={currentQuestionData.questionImage} 
                          alt="Question preview" 
                          className="pre-preview-image" 
                        />
                        <button
                          type="button"
                          className="pre-remove-image"
                          onClick={() => setCurrentQuestionData(prev => ({
                            ...prev,
                            questionImage: null
                          }))}
                        >
                          <FontAwesomeIcon icon={faTimes} />
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </div>
              
              {/* Answer Options Section - Restricted to exactly 2 options */}
              <div className="pre-options-section">
                <h5>
                  <FontAwesomeIcon icon={faListAlt} style={{ marginRight: '8px' }} />
                  Answer Options <span className="pre-required-field">*</span>
                </h5>
                
                {currentQuestionData.options.map((option, index) => (
                  <div key={index} className={`pre-option-item-editor ${!option.optionText.trim() ? 'has-error' : ''}`}>
                    <div className="pre-option-header">
                      <span className="pre-option-label">Option {index + 1}</span>
                      <div className="pre-option-controls">
                        <label className="pre-correct-checkbox">
                          <input
                            type="radio"
                            name="correctOption"
                            checked={option.isCorrect || false}
                            onChange={() => handleOptionCorrectChange(index)}
                          />
                          <span className="pre-checkbox-label">
                            <FontAwesomeIcon icon={option.isCorrect ? faCheckCircle : faQuestionCircle} />
                            Correct Answer
                          </span>
                        </label>
                      </div>
                    </div>
                    
                    <input
                      type="text"
                      value={option.optionText || ''}
                      onChange={(e) => handleOptionTextChange(index, e.target.value)}
                      placeholder={`Enter option ${index + 1} text`}
                      required
                      className={`pre-option-input ${!option.optionText.trim() ? 'pre-validation-highlight' : ''}`}
                      aria-label={`Option ${index + 1} text`}
                    />
                    {!option.optionText.trim() && (
                      <div className="pre-validation-message">Option text is required</div>
                    )}
                  </div>
                ))}
              </div>
              
              <div className="pre-form-note" style={{ marginTop: '15px' }}>
                <FontAwesomeIcon icon={faInfoCircle} />
                <p>
                  Each question requires exactly 2 options, with one marked as correct. The order of options will be randomized when presented to students.
                </p>
              </div>
              
              <div className="pre-question-form-actions">
                <button
                  type="button"
                  className="pre-button secondary"
                  onClick={() => setShowQuestionEditor(false)}
                >
                  <FontAwesomeIcon icon={faTimes} /> Cancel
                </button>
                <button
                  type="button"
                  className="pre-button primary"
                  onClick={handleSaveQuestion}
                >
                  <FontAwesomeIcon icon={editingQuestionIndex >= 0 ? faEdit : faPlus} />
                  {editingQuestionIndex >= 0 ? ' Update Question' : ' Add Question'}
                </button>
              </div>
            </form>
          </div>
        )}
      </div>
      
      <div className="pre-modal-footer">
        {!showQuestionEditor && (
          <>
            <button 
              className="pre-button secondary"
              onClick={() => {
                setShowCreateModal(false);
                setShowEditModal(false);
              }}
            >
              Cancel
            </button>
            <button 
              className="pre-button primary"
              onClick={handleFormSubmit}
            >
              <FontAwesomeIcon icon={showCreateModal ? faPlus : faEdit} />
              {showCreateModal ? " Create Assessment" : " Save Changes"}
            </button>
          </>
        )}
      </div>
    </div>
  </div>
)}

      {/* Submit Confirmation Modal */}
      {showSubmitConfirmModal && (
        <div className="pre-modal-overlay">
          <div className="pre-modal pre-confirm-modal">
            <div className="pre-modal-header">
              <h3>
                <FontAwesomeIcon icon={faLock} className="pre-modal-header-icon" />
                Submit for Admin Approval
              </h3>
              <button 
                className="pre-modal-close"
                onClick={() => setShowSubmitConfirmModal(false)}
              >
                <FontAwesomeIcon icon={faTimes} />
              </button>
            </div>
            
            <div className="pre-modal-body">
              <div className="pre-confirm-icon">
                <FontAwesomeIcon icon={faLock} />
              </div>
              <div className="pre-confirm-message">
                <p>Your pre-assessment curriculum will be submitted for admin approval.</p>
                <p>Once submitted, it will appear with "Pending Approval" status and cannot be modified until approved or rejected.</p>
                <p className="pre-confirm-question">Would you like to submit this assessment now?</p>
              </div>
              
              <div className="pre-submission-summary">
                <h4>Assessment Summary:</h4>
                <div className="pre-summary-details">
                  <div className="pre-summary-item">
                    <span className="pre-summary-label">Title:</span>
                    <span className="pre-summary-value">{formData.title}</span>
                  </div>
                  <div className="pre-summary-item">
                    <span className="pre-summary-label">Language:</span>
                    <span className="pre-summary-value">{formData.language === "FL" ? "Filipino" : "English"}</span>
                  </div>
                  <div className="pre-summary-item">
                    <span className="pre-summary-label">Total Questions:</span>
                    <span className="pre-summary-value">{formData.totalQuestions}</span>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="pre-modal-footer">
              <button 
                className="pre-button secondary"
                onClick={() => setShowSubmitConfirmModal(false)}
              >
                <FontAwesomeIcon icon={faArrowLeft} /> Go Back and Edit
              </button>
              <button 
                className="pre-button primary"
                onClick={handleConfirmSubmit}
              >
                <FontAwesomeIcon icon={faLock} /> Submit for Approval
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteModal && (
        <div className="pre-modal-overlay">
          <div className="pre-modal pre-confirm-modal">
            <div className="pre-modal-header">
              <h3>
                <FontAwesomeIcon icon={faTrash} className="pre-modal-header-icon" />
                Delete Pre-Assessment
              </h3>
              <button 
                className="pre-modal-close"
                onClick={() => setShowDeleteModal(false)}
              >
                <FontAwesomeIcon icon={faTimes} />
              </button>
            </div>
            
            <div className="pre-modal-body">
              <div className="pre-delete-icon">
                <FontAwesomeIcon icon={faExclamationTriangle} />
              </div>
              <div className="pre-delete-message">
                <p>Are you sure you want to delete this pre-assessment curriculum?</p>
                <p className="pre-delete-warning">This action cannot be undone and will remove all associated data.</p>
              </div>
              
              <div className="pre-delete-summary">
                <div className="pre-summary-item">
                  <span className="pre-summary-label">Assessment:</span>
                  <span className="pre-summary-value">{preAssessment.title}</span>
                </div>
                <div className="pre-summary-item">
                  <span className="pre-summary-label">Questions:</span>
                  <span className="pre-summary-value">{preAssessment.totalQuestions}</span>
                </div>
                <div className="pre-summary-item">
                  <span className="pre-summary-label">Status:</span>
                  <span className="pre-summary-value">{preAssessment.status}</span>
                </div>
              </div>
            </div>
            
            <div className="pre-modal-footer">
              <button 
                className="pre-button secondary"
                onClick={() => setShowDeleteModal(false)}
              >
                Cancel
              </button>
              <button 
                className="pre-button danger"
                onClick={handleDelete}
              >
                <FontAwesomeIcon icon={faTrash} /> Delete Assessment
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Success Notification */}
      {showSuccessModal && (
        <div className="pre-success-notification">
          <div className="pre-success-icon">
            <FontAwesomeIcon icon={faCheckCircle} />
          </div>
          <div className="pre-success-message">
            <p>Operation completed successfully!</p>
            <p className="pre-success-detail">
              {preAssessment 
                ? "Pre-assessment has been submitted for admin approval." 
                : "Pre-assessment has been deleted."}
            </p>
          </div>
        </div>
      )}
    </div>
  );
};

export default PreAssessment;