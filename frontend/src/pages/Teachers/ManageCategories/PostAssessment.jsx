// src/pages/Teachers/ManageCategories/PostAssessment.jsx
// This file has been renamed functionally to MainAssessment but kept the same filename for compatibility
import React, { useState, useEffect } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faPlus,
  faEdit,
  faEye,
  faTrash,
  faTimes,
  faExclamationTriangle,
  faSearch,
  faCheckCircle,
  faLock,
  faUpload,
  faBook,
  faFont,
  faImages,
  faFileAlt,
  faInfoCircle,
  faPuzzlePiece,
  faArrowRight,
  faArrowLeft,
  faChevronDown,
  faChevronUp,
  faFilter,
  faCheckDouble,
  faClipboardList,
  faChartLine,
  faUserGraduate,
  faLayerGroup,
  faCogs,
  faBullseye,
  faUsers,
  faGraduationCap,
  faQuestion,
  faCloudUploadAlt
} from "@fortawesome/free-solid-svg-icons";
import "../../../css/Teachers/ManageCategories/PostAssessment.css";
import MainAssessmentService from '../../../services/Teachers/MainAssessmentService';
import { toast } from 'react-toastify';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

// Add import for file helpers
import { dataURLtoFile, validateFileForUpload } from '../../../utils/fileHelpers';

// Tooltip component for help text
const Tooltip = ({ text }) => (
  <div className="pa-tooltip">
    <FontAwesomeIcon icon={faInfoCircle} className="pa-tooltip-icon" />
    <span className="pa-tooltip-text">{text}</span>
  </div>
);

// Helper function to handle API errors and display user-friendly messages
const handleApiError = (error, defaultMessage = "An error occurred. Please try again.") => {
  if (error.response) {
    // Server responded with an error status code
    const status = error.response.status;
    const errorMessage = error.response.data?.message || defaultMessage;
    
    if (status === 401) {
      return "You are not authorized. Please log in again.";
    } else if (status === 403) {
      return "You don't have permission to perform this action.";
    } else if (status === 404) {
      return "The requested resource was not found. This might be because the Main Assessment feature is new.";
    } else if (status === 422) {
      return errorMessage; // Validation error with specific message
    } else {
      return `Error: ${errorMessage}`;
    }
  } else if (error.request) {
    // Request was made but no response received (network issue)
    return "Unable to connect to the server. Please check your internet connection.";
  } else {
    // Something else happened while setting up the request
    return defaultMessage;
  }
};

const MainAssessment = ({ templates }) => {
  const [assessments, setAssessments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filterReadingLevel, setFilterReadingLevel] = useState("all");
  const [filterCategory, setFilterCategory] = useState("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [modalType, setModalType] = useState(""); // create, edit, preview, delete
  const [selectedAssessment, setSelectedAssessment] = useState(null);
  const [formData, setFormData] = useState({
    readingLevel: "",
    category: "",
    questions: [],
    isActive: true,
    status: "active"
  });
  const [submitConfirmDialog, setSubmitConfirmDialog] = useState(false);
  const [submitSuccessDialog, setSubmitSuccessDialog] = useState(false);
  const [deleteSuccessDialog, setDeleteSuccessDialog] = useState(false);
  const [currentQuestion, setCurrentQuestion] = useState(null);
  const [showQuestionForm, setShowQuestionForm] = useState(false);
  const [questionFormData, setQuestionFormData] = useState({
    questionType: "",
    questionText: "",
    questionImage: null,
    questionValue: "",
    choiceOptions: [
      { optionId: "1", optionText: "", isCorrect: true, description: "" },
      { optionId: "2", optionText: "", isCorrect: false, description: "" }
    ],
    order: 1
  });
  const [previewPage, setPreviewPage] = useState(0);
  const [duplicateRestrictionDialog, setDuplicateRestrictionDialog] = useState(false);
  const [restrictionReason, setRestrictionReason] = useState("");
  const [apiMessage, setApiMessage] = useState(null);
  const [uploadingImage, setUploadingImage] = useState(false);

  // Check if an assessment already exists for a reading level and category
  const checkExistingAssessment = (readingLevel, category, excludeId = null) => {
    return assessments.find(assessment => 
      assessment.readingLevel === readingLevel && 
      assessment.category === category &&
      assessment._id !== excludeId
    );
  };

  // Check if a new assessment can be created for a reading level and category
  const canCreateAssessment = (readingLevel, category) => {
    const existing = checkExistingAssessment(readingLevel, category);
    
    if (existing) {
      return {
        canCreate: false,
        reason: "An assessment already exists for this reading level and category combination"
      };
    }
    
    return { canCreate: true };
  };

  useEffect(() => {
    // Fetch assessments data from the backend
    const fetchAssessments = async () => {
      try {
        setLoading(true);

        const response = await MainAssessmentService.getAllAssessments();
        
        if (response && response.success) {
          setAssessments(response.data || []);
          
          // If there's a message from the API, store it
          if (response.message) {
            setApiMessage(response.message);
          }
        } else {
          setAssessments([]);
        }
        
        setLoading(false);
      } catch (err) {
        console.error('Error fetching assessments:', err);
        setError(handleApiError(err, "Failed to load assessments. Please try again later."));
        setLoading(false);
      }
    };

    fetchAssessments();
  }, []);

  // Filter assessments
  const filteredAssessments = assessments.filter(assessment => {
    // Reading level filter
    const levelMatch = filterReadingLevel === "all" ? true : assessment.readingLevel === filterReadingLevel;

    // Category filter
    const categoryMatch = filterCategory === "all" ? true : assessment.category === filterCategory;

    // Search term
    const searchMatch =
      assessment.category.toLowerCase().includes(searchTerm.toLowerCase()) ||
      assessment.readingLevel.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (assessment.questions.some(q => q.questionText?.toLowerCase().includes(searchTerm.toLowerCase())));

    return levelMatch && categoryMatch && searchMatch;
  });

  const readingLevels = ["all", "Low Emerging", "High Emerging", "Developing", "Transitioning", "At Grade Level"];
  const categories = ["all", "Alphabet Knowledge", "Phonological Awareness",
    "Decoding", "Word Recognition", "Reading Comprehension"];

  // Get assessment statistics
  const getAssessmentStats = () => {
    const totalAssessments = assessments.length;
    const activeAssessments = assessments.filter(a => a.isActive).length;
    const inactiveAssessments = assessments.filter(a => !a.isActive).length;

    return {
      total: totalAssessments,
      active: activeAssessments,
      inactive: inactiveAssessments
    };
  };

  const stats = getAssessmentStats();

  const handleCreateAssessment = () => {
    setModalType("create");
    setSelectedAssessment(null);
    setFormData({
      readingLevel: "",
      category: "",
      questions: [],
      isActive: true,
      status: "active"
    });
    setShowModal(true);
  };

  const handleEditAssessment = (assessment) => {
    setModalType("edit");
    setSelectedAssessment(assessment);
    setFormData({
      readingLevel: assessment.readingLevel,
      category: assessment.category,
      questions: [...assessment.questions],
      isActive: assessment.isActive,
      status: assessment.status
    });
    setShowModal(true);
  };

  const handlePreviewAssessment = (assessment) => {
    setModalType("preview");
    setSelectedAssessment(assessment);
    setPreviewPage(0); // Reset to first page
    setShowModal(true);
  };

  const handleDeleteConfirm = (assessment) => {
    setModalType("delete");
    setSelectedAssessment(assessment);
    setShowModal(true);
  };

  const handleDeleteAssessment = async () => {
    if (!selectedAssessment) return;

    try {
      const response = await MainAssessmentService.deleteAssessment(selectedAssessment._id);
      
      if (response && response.success) {
        // Remove from local state
    setAssessments(prev => prev.filter(a => a._id !== selectedAssessment._id));
    setShowModal(false);
    setSelectedAssessment(null);

        // Show success notification
    setDeleteSuccessDialog(true);
    setTimeout(() => {
      setDeleteSuccessDialog(false);
    }, 3000);
      }
    } catch (error) {
      console.error('Error deleting assessment:', error);
      alert(handleApiError(error, "Failed to delete assessment. Please try again."));
    }
  };

  const handleFormChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleAddQuestion = () => {
    setShowQuestionForm(true);
    setCurrentQuestion(null);

    const initialQuestionType =
      formData.category === "Alphabet Knowledge" ? "patinig" :
        formData.category === "Phonological Awareness" ? "malapantig" :
          formData.category === "Word Recognition" ? "word" :
            formData.category === "Decoding" ? "word" :
              "sentence";

    setQuestionFormData({
      questionType: initialQuestionType,
      questionText: "",
      questionImage: null,
      questionValue: "",
      choiceOptions: [
        { optionId: "1", optionText: "", isCorrect: true, description: "" },
        { optionId: "2", optionText: "", isCorrect: false, description: "" }
      ],
      passages: initialQuestionType === "sentence" ? [
        { pageNumber: 1, pageText: "", pageImage: null }
      ] : [],
      sentenceQuestions: initialQuestionType === "sentence" ? [
        { questionText: "", correctAnswer: "", incorrectAnswer: "" }
      ] : [],
      order: formData.questions.length + 1
    });
  };

  const handleEditQuestion = (question, index) => {
    setShowQuestionForm(true);
    setCurrentQuestion(index);
    setQuestionFormData({
      ...question,
      order: index + 1
    });
  };

  const handleRemoveQuestion = (index) => {
    setFormData(prev => ({
      ...prev,
      questions: prev.questions.filter((_, i) => i !== index)
    }));
  };

  const handleQuestionFormChange = (e) => {
    const { name, value } = e.target;
    setQuestionFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleChoiceChange = (index, field, value) => {
    setQuestionFormData(prev => {
      const updatedChoices = [...prev.choiceOptions];
      updatedChoices[index] = {
        ...updatedChoices[index],
        [field]: value
      };
      return {
        ...prev,
        choiceOptions: updatedChoices
      };
    });
  };

  const handleAddChoice = () => {
    setQuestionFormData(prev => ({
      ...prev,
      choiceOptions: [
        ...prev.choiceOptions,
        { optionId: (prev.choiceOptions.length + 1).toString(), optionText: "", isCorrect: false, description: "" }
      ]
    }));
  };

  const handleRemoveChoice = (index) => {
    setQuestionFormData(prev => ({
      ...prev,
      choiceOptions: prev.choiceOptions.filter((_, i) => i !== index)
    }));
  };

  const handleQuestionFormSubmit = async () => {
    if (!questionFormData.questionText) {
      toast.error("Please enter a question text.");
      return;
    }

    if (questionFormData.questionType !== "sentence" && questionFormData.choiceOptions.length < 2) {
      toast.error("Please add at least two choices for the question.");
      return;
    }

    if (
      questionFormData.questionType !== "sentence" &&
      !questionFormData.choiceOptions.some(c => c.isCorrect)
    ) {
      toast.error("Please mark at least one choice as correct.");
      return;
    }
    
    try {
      let finalQuestionData = { ...questionFormData };
      
      // If there's an image file pending upload, upload it to S3 first
      if (questionFormData.imageFile) {
        const result = await MainAssessmentService.uploadImageToS3(questionFormData.imageFile, 'main-assessment');
        
        if (result.success) {
          finalQuestionData.questionImage = result.url;
        } else {
          toast.error(result.error || "Failed to upload image");
        }
        
        // Remove temporary fields used for handling the upload
        delete finalQuestionData.imageFile;
        delete finalQuestionData.imageName;
      }
      
      // If we have passage pages with images, handle those uploads as well
      if (finalQuestionData.questionType === "sentence" && finalQuestionData.passages) {
        const updatedPassages = [];
        
        for (const passage of finalQuestionData.passages) {
          // If this passage has a new image that needs uploading (it's a data URL)
          if (passage.pageImage && typeof passage.pageImage === 'string' && passage.pageImage.startsWith('data:')) {
            // We need to convert the data URL back to a file for upload
            const imageFile = dataURLtoFile(passage.pageImage, `page_${passage.pageNumber}.jpg`);
            
            const result = await MainAssessmentService.uploadImageToS3(imageFile, 'main-assessment');
            
            if (result.success) {
              updatedPassages.push({
                ...passage,
                pageImage: result.url
              });
            } else {
              toast.error(`Failed to upload image for page ${passage.pageNumber}`);
              updatedPassages.push(passage);
            }
          } else {
            updatedPassages.push(passage);
          }
        }
        
        finalQuestionData.passages = updatedPassages;
      }
      
      // Update the form data with the final question data
      if (currentQuestion !== null) {
        setFormData(prev => {
          const updatedQuestions = [...prev.questions];
          updatedQuestions[currentQuestion] = finalQuestionData;
          return {
            ...prev,
            questions: updatedQuestions
          };
        });
        
        // Reset for a new question and keep the form open
        setCurrentQuestion(null);
        setQuestionFormData({
          questionType: finalQuestionData.questionType,
          questionText: "",
          questionImage: null,
          questionValue: "",
          choiceOptions: [
            { optionId: "1", optionText: "", isCorrect: true, description: "" },
            { optionId: "2", optionText: "", isCorrect: false, description: "" }
          ],
          passages: finalQuestionData.questionType === "sentence" ? [
            { pageNumber: 1, pageText: "", pageImage: null }
          ] : [],
          sentenceQuestions: finalQuestionData.questionType === "sentence" ? [
            { questionText: "", correctAnswer: "", incorrectAnswer: "" }
          ] : [],
          order: formData.questions.length + 1
        });
        
        toast.success("Question updated! You can add another or click Back to return to the assessment.");
      } else {
        setFormData(prev => ({
          ...prev,
          questions: [...prev.questions, finalQuestionData]
        }));
        
        // Reset for a new question and keep the form open
        setQuestionFormData({
          questionType: finalQuestionData.questionType,
          questionText: "",
          questionImage: null,
          questionValue: "",
          choiceOptions: [
            { optionId: "1", optionText: "", isCorrect: true, description: "" },
            { optionId: "2", optionText: "", isCorrect: false, description: "" }
          ],
          passages: finalQuestionData.questionType === "sentence" ? [
            { pageNumber: 1, pageText: "", pageImage: null }
          ] : [],
          sentenceQuestions: finalQuestionData.questionType === "sentence" ? [
            { questionText: "", correctAnswer: "", incorrectAnswer: "" }
          ] : [],
          order: formData.questions.length + 1
        });
        
        toast.success("Question added! You can add another or click Back to return to the assessment.");
      }
    } catch (error) {
      console.error("Error saving question:", error);
      toast.error("Failed to save question with image upload. Please try again.");
    }
  };

  const handleFileUpload = (e, field) => {
    const file = e.target.files[0];
    if (!file) return;

    const fakeImageUrl = URL.createObjectURL(file);

    if (field === 'questionImage') {
      setQuestionFormData(prev => ({
        ...prev,
        questionImage: fakeImageUrl
      }));
    } else if (field.includes('pageImage')) {
      const pageIndex = parseInt(field.split('-')[1]);
      setQuestionFormData(prev => {
        const updatedPassages = [...prev.passages];
        updatedPassages[pageIndex] = {
          ...updatedPassages[pageIndex],
          pageImage: fakeImageUrl
        };
        return {
          ...prev,
          passages: updatedPassages
        };
      });
    }
  };

  const handleSaveAssessment = () => {
    // Validate form data
    if (!formData.readingLevel || !formData.category || formData.questions.length === 0) {
      alert("Please fill in all required fields and add at least one question.");
      return;
    }
    
    // Check restrictions for new assessments
    if (modalType === 'create') {
      const validation = canCreateAssessment(formData.readingLevel, formData.category);
      if (!validation.canCreate) {
        setRestrictionReason(validation.reason);
        setDuplicateRestrictionDialog(true);
        return;
      }
    }
    
    // Open confirmation dialog
    setSubmitConfirmDialog(true);
  };

  const handleConfirmSubmit = async () => {
    try {
      setSubmitConfirmDialog(false);
      
      // Ensure each question has proper format
      const formattedQuestions = formData.questions.map((question, index) => ({
        ...question,
        order: index + 1,
        // Ensure choiceOptions have optionId, description if missing
        choiceOptions: question.choiceOptions.map((option, optIndex) => ({
          ...option,
          optionId: option.optionId || (optIndex + 1).toString(),
          description: option.description || (option.isCorrect ? 
            "Ito ang tamang sagot." : 
            "Hindi ito ang tamang sagot.")
        }))
      }));
      
      // Create payload
      const assessmentData = {
      readingLevel: formData.readingLevel,
      category: formData.category,
        questions: formattedQuestions,
        isActive: formData.isActive,
        status: formData.status
      };
      
      let response;
      
      if (modalType === 'edit' && selectedAssessment) {
      // Update existing assessment
        response = await MainAssessmentService.updateAssessment(selectedAssessment._id, assessmentData);
        
        if (response && response.success) {
          // Update local state
          setAssessments(prev => 
            prev.map(a => a._id === selectedAssessment._id ? response.data : a)
          );
        }
    } else {
        // Create new assessment
        response = await MainAssessmentService.createAssessment(assessmentData);
        
        if (response && response.success) {
          // Add to local state
          setAssessments(prev => [...prev, response.data]);
        }
      }
      
      // Reset form and close modal
    setShowModal(false);
    setSelectedAssessment(null);
    setFormData({
      readingLevel: "",
      category: "",
        questions: [],
        isActive: true,
        status: "active"
    });

    // Show success notification
    setSubmitSuccessDialog(true);
    setTimeout(() => {
      setSubmitSuccessDialog(false);
    }, 3000);
      
    } catch (error) {
      console.error('Error saving assessment:', error);
      alert(handleApiError(error, "Failed to save assessment. Please check your inputs and try again."));
    }
  };

  const handlePreviewPageChange = (direction) => {
    if (direction === 'next' && selectedAssessment?.questions?.[0]?.passages?.length > previewPage + 1) {
      setPreviewPage(prev => prev + 1);
    } else if (direction === 'prev' && previewPage > 0) {
      setPreviewPage(prev => prev - 1);
    }
  };

  const getQuestionTypeDisplay = (type) => {
    switch (type) {
      case "patinig": return "Vowel (Patinig)";
      case "katinig": return "Consonant (Katinig)";
      case "malapantig": return "Syllable (Malapantig)";
      case "word": return "Word";
      case "sentence": return "Reading Passage";
      default: return type;
    }
  };

  // Handle status toggle
  const handleToggleStatus = async (assessment) => {
    try {
      const newStatus = assessment.status === 'active' ? 'inactive' : 'active';
      const newIsActive = newStatus === 'active';
      
      const response = await MainAssessmentService.toggleAssessmentStatus(assessment._id, newStatus);
      
      if (response && response.success) {
        // Update local state
        setAssessments(prev => 
          prev.map(a => a._id === assessment._id ? 
            { ...a, status: newStatus, isActive: newIsActive } : a
          )
        );
      }
    } catch (error) {
      console.error('Error toggling assessment status:', error);
      alert(handleApiError(error, "Failed to update status. Please try again."));
    }
  };

  const handleImageUpload = async (e, field) => {
    const file = e.target.files[0];
    if (!file) return;

    // Validate the file
    const validation = validateFileForUpload(file);
    if (!validation.success) {
      toast.error(validation.error);
      return;
    }

    setUploadingImage(true);
    
    try {
      // Create a preview using FileReader
      const reader = new FileReader();
      reader.onloadend = () => {
        setQuestionFormData(prev => ({
          ...prev,
          [field]: reader.result, // Set data URL for preview
          imageFile: file, // Store the file for later upload
          imageName: file.name // Store the name for display
        }));
        setUploadingImage(false);
      };
      reader.readAsDataURL(file);
    } catch (error) {
      console.error("Error processing image:", error);
      setUploadingImage(false);
      toast.error("Error processing image. Please try again.");
    }
  };

  if (loading) {
    return (
      <div className="post-assessment-container">
        <div className="pa-loading">
          <div className="pa-spinner"></div>
          <p>Loading assessments...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="post-assessment-container">
        <div className="pa-error">
          <FontAwesomeIcon icon={faExclamationTriangle} className="pa-error-icon" />
          <p>{error}</p>
          <button onClick={() => window.location.reload()} className="pa-retry-btn">
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="post-assessment-container">
      <div className="pa-header">
        <h2>
          <FontAwesomeIcon icon={faClipboardList} />
          Main Assessment Management
        </h2>
        <p>Create and manage targeted assessments for specific reading levels and categories based on student performance and learning progress.</p>
      </div>

      <div className="pa-assessment-overview">
        <div className="pa-overview-header">
          <h3><FontAwesomeIcon icon={faLayerGroup} /> Assessment Overview</h3>
        </div>
        <div className="pa-overview-stats">
          <div className="pa-stat-card">
            <div className="pa-stat-icon">
              <FontAwesomeIcon icon={faLayerGroup} />
            </div>
            <div className="pa-stat-content">
              <div className="pa-stat-number">{stats.total}</div>
              <div className="pa-stat-label">Total Assessments</div>
            </div>
          </div>

          <div className="pa-stat-card active">
            <div className="pa-stat-icon">
              <FontAwesomeIcon icon={faCheckCircle} />
            </div>
            <div className="pa-stat-content">
              <div className="pa-stat-number">{stats.active}</div>
              <div className="pa-stat-label">Active</div>
            </div>
          </div>

          <div className="pa-stat-card inactive">
            <div className="pa-stat-icon">
              <FontAwesomeIcon icon={faExclamationTriangle} />
            </div>
            <div className="pa-stat-content">
              <div className="pa-stat-number">{stats.inactive}</div>
              <div className="pa-stat-label">Inactive</div>
            </div>
            </div>
          </div>

        <div className="pa-reading-level-overview">
          <div className="pa-reading-level-header">
            <h4><FontAwesomeIcon icon={faBook} /> Assessments by Reading Level</h4>
            <p>Manage assessments for different reading levels and track their availability</p>
          </div>
          <div className="pa-reading-level-grid">
            {/* Dynamic generation of reading level cards */}
            {['Low Emerging', 'High Emerging', 'Developing', 'Transitioning', 'At Grade Level'].map(level => {
              // Get all assessments for this reading level
              const levelAssessments = assessments.filter(a => a.readingLevel === level);
              
              // Get all unique categories for this reading level
              const levelCategories = [...new Set(levelAssessments.map(a => a.category))].sort();
              
              return (
                <div className="pa-reading-level-card" key={level}>
                  <div className={`pa-reading-level-header-bar pa-level-${level.toLowerCase().replace(' ', '-')}`}>
                    <div className="pa-reading-level-name">
                      <FontAwesomeIcon icon={faBook} /> {level}
                    </div>
                    <div className="pa-reading-level-count">
                      {levelAssessments.length}
                    </div>
                  </div>
                  <div className="pa-reading-level-body">
                    <div className="pa-category-list">
                      {levelCategories.length > 0 ? (
                        levelCategories.map(category => {
                          // Get all questions for this category in this reading level
                          const categoryQuestions = levelAssessments
                            .filter(a => a.category === category)
                            .reduce((total, a) => total + (a.questions ? a.questions.length : 0), 0);
                          
                          // Choose the appropriate icon based on category
                          const categoryIcon = 
                            category === "Reading Comprehension" ? faBook : 
                            category === "Alphabet Knowledge" ? faFont : 
                            category === "Phonological Awareness" ? faPuzzlePiece : 
                            category === "Decoding" ? faFileAlt : 
                            faImages; // Word Recognition
                          
                          return (
                            <div className="pa-category-item" key={category}>
                              <div className="pa-category-name">
                                <FontAwesomeIcon icon={categoryIcon} /> {category}
                              </div>
                              <div className="pa-category-count">
                                {categoryQuestions}
                              </div>
                            </div>
                          );
                        })
                      ) : (
                        <div className="pa-category-item">
                          <div className="pa-category-name">
                            <FontAwesomeIcon icon={faInfoCircle} /> No categories yet
                          </div>
                          <div className="pa-category-count">
                            0
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      <div className="pa-process-flow">
        <h3>Main Assessment Process Flow</h3>
        <div className="pa-flow-steps">
          <div className="pa-flow-step">
            <div className="pa-step-number">1</div>
            <div className="pa-step-content">
              <h4>Assessment Creation</h4>
              <p>Teachers create targeted assessments based on student reading levels and specific learning objectives.</p>
            </div>
          </div>
          <div className="pa-flow-connector">
            <FontAwesomeIcon icon={faArrowRight} />
          </div>
          <div className="pa-flow-step">
            <div className="pa-step-number">2</div>
            <div className="pa-step-content">
              <h4>Assessment Activation</h4>
              <p>Teachers activate assessments to make them available to students in the mobile application.</p>
            </div>
          </div>
          <div className="pa-flow-connector">
            <FontAwesomeIcon icon={faArrowRight} />
          </div>
          <div className="pa-flow-step">
            <div className="pa-step-number">3</div>
            <div className="pa-step-content">
              <h4>Student Assignment</h4>
              <p>Activated assessments are assigned to students based on their reading level and identified needs.</p>
            </div>
          </div>
          <div className="pa-flow-connector">
            <FontAwesomeIcon icon={faArrowRight} />
          </div>
          <div className="pa-flow-step">
            <div className="pa-step-number">4</div>
            <div className="pa-step-content">
              <h4>Progress Tracking</h4>
              <p>Monitor student performance and advancement through the assessment system in real-time.</p>
            </div>
          </div>
          <div className="pa-flow-connector">
            <FontAwesomeIcon icon={faArrowRight} />
          </div>
          <div className="pa-flow-step">
            <div className="pa-step-number">5</div>
            <div className="pa-step-content">
              <h4>Level Advancement</h4>
              <p>Students advance to higher reading levels based on successful completion of assessments.</p>
            </div>
          </div>
        </div>
      </div>

    

      <div className="pa-system-info">
        <h3>About Main Assessment Process</h3>
        <div className="pa-info-grid">
          <div className="pa-info-card">
            <div className="pa-info-icon">
              <FontAwesomeIcon icon={faBullseye} />
            </div>
            <div className="pa-info-content">
              <h4>Targeted Interventions</h4>
              <p>
                Create specialized assessments tailored to specific reading levels and categories
                to address individual student needs and learning gaps.
              </p>
            </div>
          </div>

          <div className="pa-info-card">
            <div className="pa-info-icon">
              <FontAwesomeIcon icon={faChartLine} />
            </div>
            <div className="pa-info-content">
              <h4>Progress Monitoring</h4>
              <p>
                Track student advancement through customized assessments that measure
                improvement in specific skill areas identified during pre-assessment.
              </p>
            </div>
          </div>

          <div className="pa-info-card">
            <div className="pa-info-icon">
              <FontAwesomeIcon icon={faCogs} />
            </div>
            <div className="pa-info-content">
              <h4>Flexible Assessment Design</h4>
              <p>
                Build assessments with various question types including visual, auditory,
                and text-based elements to accommodate different learning styles.
              </p>
            </div>
          </div>

          <div className="pa-info-card">
            <div className="pa-info-icon">
              <FontAwesomeIcon icon={faUserGraduate} />
            </div>
            <div className="pa-info-content">
              <h4>Adaptive Learning Path</h4>
              <p>
                Enable students to progress through reading levels at their own pace
                with assessments that adapt to their current skill level and performance.
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="pa-create-assessment-section">
        <button
          className="pa-create-assessment-btn"
          onClick={handleCreateAssessment}
        >
          <FontAwesomeIcon icon={faPlus} /> Create New Assessment
        </button>
      </div>

      <div className="pa-filters">
        <div className="pa-search">
          <input
            type="text"
            placeholder="Search assessments..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
          />
          <FontAwesomeIcon icon={faSearch} className="pa-search-icon" />
        </div>

        <div className="pa-filter-group">
          <label><FontAwesomeIcon icon={faFilter} className="pa-filter-icon" /> Reading Level:</label>
          <select
            value={filterReadingLevel}
            onChange={e => setFilterReadingLevel(e.target.value)}
          >
            {readingLevels.map(level => (
              <option key={level} value={level}>
                {level === "all" ? "All Levels" : level}
              </option>
            ))}
          </select>
        </div>

        <div className="pa-filter-group">
          <label><FontAwesomeIcon icon={faFilter} className="pa-filter-icon" /> Category:</label>
          <select
            value={filterCategory}
            onChange={e => setFilterCategory(e.target.value)}
          >
            {categories.map(category => (
              <option key={category} value={category}>
                {category === "all" ? "All Categories" : category}
              </option>
            ))}
          </select>
        </div>
      </div>

      {apiMessage && (
        <div className="pa-api-message">
          <FontAwesomeIcon icon={faInfoCircle} className="pa-api-message-icon" />
          <p>{apiMessage}</p>
          <button 
            className="pa-dismiss-message" 
            onClick={() => setApiMessage(null)}
            title="Dismiss message"
          >
            <FontAwesomeIcon icon={faTimes} />
          </button>
        </div>
      )}

      <div className="pa-assessment-list">
        {filteredAssessments.length === 0 ? (
          <div className="pa-no-assessments">
            <div className="pa-empty-icon">
              <FontAwesomeIcon icon={faFileAlt} />
            </div>
            {searchTerm || filterReadingLevel !== "all" || filterCategory !== "all" ? (
              <>
                <h3>No matching assessments found</h3>
                <p>Try adjusting your search or filter criteria to find assessments.</p>
                <button
                  className="pa-reset-filters"
                  onClick={() => {
                    setSearchTerm("");
                    setFilterReadingLevel("all");
                    setFilterCategory("all");
                  }}
                >
                  <FontAwesomeIcon icon={faFilter} /> Reset Filters
                </button>
              </>
            ) : (
              <>
                <h3>Welcome to Main Assessment Management</h3>
                <p>This is where you'll create targeted assessments for different reading levels and categories. Get started by creating your first assessment.</p>
                <div className="pa-getting-started-tips">
                  <h4><FontAwesomeIcon icon={faInfoCircle} /> Getting Started</h4>
                  <ol>
                    <li>Click "Create New Assessment" to build your first assessment</li>
                    <li>Select a reading level and category for your assessment</li>
                    <li>Add questions with appropriate content for that level</li>
                    <li>Activate your assessment to make it available to students</li>
                  </ol>
                </div>
            <button
              className="pa-create-first"
              onClick={handleCreateAssessment}
            >
                  <FontAwesomeIcon icon={faPlus} /> Create Your First Assessment
            </button>
              </>
            )}
          </div>
        ) : (
          <div className="pa-table">
            <div className="pa-header-row">
              <div className="pa-header-cell">
                <FontAwesomeIcon icon={faBook} className="pa-header-icon" /> 
                Reading Level
                <span className="pa-table-tooltip">
                  <FontAwesomeIcon icon={faInfoCircle} style={{marginLeft: '5px', fontSize: '12px', color: '#4e5c93'}} />
                  <span className="pa-tooltip-text">Organized by CRLA reading level from Low Emerging to At Grade Level</span>
                </span>
              </div>
              <div className="pa-header-cell">
                <FontAwesomeIcon icon={faLayerGroup} className="pa-header-icon" /> 
                Category
                <span className="pa-table-tooltip">
                  <FontAwesomeIcon icon={faInfoCircle} style={{marginLeft: '5px', fontSize: '12px', color: '#4e5c93'}} />
                  <span className="pa-tooltip-text">Learning category like Phonological Awareness or Word Recognition</span>
                </span>
              </div>
              <div className="pa-header-cell">
                <FontAwesomeIcon icon={faClipboardList} className="pa-header-icon" /> 
                Questions
                <span className="pa-table-tooltip">
                  <FontAwesomeIcon icon={faInfoCircle} style={{marginLeft: '5px', fontSize: '12px', color: '#4e5c93'}} />
                  <span className="pa-tooltip-text">Number of questions in this assessment</span>
                </span>
              </div>
              <div className="pa-header-cell">
                <FontAwesomeIcon icon={faCheckCircle} className="pa-header-icon" /> 
                Status
                <span className="pa-table-tooltip">
                  <FontAwesomeIcon icon={faInfoCircle} style={{marginLeft: '5px', fontSize: '12px', color: '#4e5c93'}} />
                  <span className="pa-tooltip-text">Active assessments are available to students</span>
                </span>
              </div>
              <div className="pa-header-cell">
                Actions
                <span className="pa-table-tooltip">
                  <FontAwesomeIcon icon={faInfoCircle} style={{marginLeft: '5px', fontSize: '12px', color: '#4e5c93'}} />
                  <span className="pa-tooltip-text">Edit, preview, toggle status, or delete assessments</span>
                </span>
              </div>
            </div>

            {filteredAssessments.map(assessment => (
              <div key={assessment._id} className="pa-row">
                <div className="pa-cell">
                  <FontAwesomeIcon icon={faBook} className="pa-cell-icon" />
                  {assessment.readingLevel}
                </div>
                <div className="pa-cell">
                  <FontAwesomeIcon icon={
                    assessment.category === "Reading Comprehension" ? faBook : 
                    assessment.category === "Alphabet Knowledge" ? faFont : 
                    assessment.category === "Phonological Awareness" ? faPuzzlePiece : 
                    assessment.category === "Decoding" ? faFileAlt : 
                    faImages
                  } className="pa-cell-icon" /> 
                  {assessment.category}
                </div>
                <div className="pa-cell">{assessment.questions.length}</div>
                <div className="pa-cell">
                  {assessment.isActive ? (
                    <span className="pa-status pa-active">
                      <FontAwesomeIcon icon={faCheckCircle} /> Active
                    </span>
                  ) : (
                                          <span className="pa-status pa-inactive">
                      <FontAwesomeIcon icon={faExclamationTriangle} /> Inactive
                      </span>
                  )}
                </div>
                <div className="pa-cell pa-actions">
                      <button
                        className="pa-edit-btn"
                        onClick={() => handleEditAssessment(assessment)}
                    title="Edit assessment"
                      >
                        <FontAwesomeIcon icon={faEdit} />
                      </button>
                  
                      <button
                    className="pa-preview-btn"
                    onClick={() => handlePreviewAssessment(assessment)}
                    title="Preview assessment"
                  >
                    <FontAwesomeIcon icon={faEye} />
                      </button>
                  
                  <button
                    className={`pa-status-toggle-btn ${assessment.isActive ? 'active' : 'inactive'}`}
                    onClick={() => handleToggleStatus(assessment)}
                    title={assessment.isActive ? "Deactivate assessment" : "Activate assessment"}
                  >
                    <FontAwesomeIcon icon={assessment.isActive ? faLock : faCheckCircle} />
                  </button>
                  
                  <button
                    className="pa-delete-btn"
                    onClick={() => handleDeleteConfirm(assessment)}
                    title="Delete assessment"
                  >
                    <FontAwesomeIcon icon={faTrash} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {showModal && (
        <div className="pa-modal-overlay">
          <div className={`pa-modal ${modalType === 'preview' || showQuestionForm ? 'pa-modal-enhanced' : ''} ${modalType === 'delete' ? 'pa-modal-narrow' : ''}`}>
            <div className="pa-modal-header">
              <h3>
                {modalType === 'create' ?
                  <><FontAwesomeIcon icon={faPlus} className="pa-modal-header-icon" /> Create New Assessment</> :
                  modalType === 'edit' ?
                    <><FontAwesomeIcon icon={faEdit} className="pa-modal-header-icon" /> Edit Assessment</> :
                    modalType === 'preview' ?
                      <><FontAwesomeIcon icon={faEye} className="pa-modal-header-icon" /> Assessment Preview</> :
                      <><FontAwesomeIcon icon={faTrash} className="pa-modal-header-icon" /> Delete Assessment</>
                }
              </h3>
              <button
                className="pa-modal-close"
                onClick={() => setShowModal(false)}
                title="Close"
              >
                <FontAwesomeIcon icon={faTimes} />
              </button>
            </div>

            <div className="pa-modal-body">
                              {modalType === 'delete' ? (
                <div className="pa-delete-confirm">
                  <div className="pa-delete-icon">
                    <FontAwesomeIcon icon={faExclamationTriangle} />
                  </div>
                  <div className="pa-delete-message">
                    <h4>Delete Assessment</h4>
                    <p>Are you sure you want to permanently delete this assessment?</p>
                        <p className="pa-delete-warning">
                      This action cannot be undone. All questions and content will be permanently removed.
                    </p>
                  </div>
                </div>
              ) : modalType === 'preview' ? (
                <div className="pa-assessment-preview">
                  <div className="pa-preview-header">
                    <div className="pa-preview-info">
                        <div className="pa-preview-section">
                          <span className="pa-preview-label">Reading Level:</span>
                          <span className="pa-preview-value">{selectedAssessment.readingLevel}</span>
                        </div>

                        <div className="pa-preview-section">
                          <span className="pa-preview-label">Category:</span>
                          <span className="pa-preview-value">{selectedAssessment.category}</span>
                        </div>

                        <div className="pa-preview-section">
                          <span className="pa-preview-label">Total Questions:</span>
                          <span className="pa-preview-value">{selectedAssessment.questions.length}</span>
                        </div>

                        <div className="pa-preview-section">
                          <span className="pa-preview-label">Status:</span>
                          <span className="pa-preview-value">
                          {selectedAssessment.isActive ? (
                              <span className="pa-status-tag active">
                                <FontAwesomeIcon icon={faCheckCircle} /> Active
                              </span>
                            ) : (
                            <span className="pa-status-tag inactive">
                              <FontAwesomeIcon icon={faExclamationTriangle} /> Inactive
                              </span>
                            )}
                          </span>
                      </div>
                    </div>
                  </div>

                  <div className="pa-preview-content">
                    <h4>
                      <FontAwesomeIcon icon={faClipboardList} className="pa-preview-icon" /> 
                      Assessment Questions
                    </h4>

                    {selectedAssessment.questions.map((question, index) => (
                      <div key={index} className="pa-preview-question-card">
                        <div className="pa-question-header">
                                                <div className="pa-question-metadata">
                            <span className="pa-question-numberr">Question {index + 1}</span>
                          <span className="pa-question-type">
                            <FontAwesomeIcon
                              icon={
                                question.questionType === "patinig" || question.questionType === "katinig"
                                  ? faFont
                                  : question.questionType === "malapantig"
                                    ? faPuzzlePiece
                                    : question.questionType === "sentence"
                                      ? faBook
                                      : faFileAlt
                              }
                              className="pa-question-type-icon"
                            />
                            {getQuestionTypeDisplay(question.questionType)}
                          </span>
                        </div>
                        </div>

                        <div className="pa-question-content">
                          <div className="pa-question-prompt">
                            {question.questionImage && (
                              <div className="pa-question-image-container">
                                <img
                                  src={question.questionImage}
                                  alt="Question visual"
                                  className="pa-question-image"
                                />
                              </div>
                            )}

                            <div className="pa-question-text-container">
                              <p className="pa-question-text">{question.questionText}</p>
                              {question.questionValue && (
                                <div className="pa-question-value">
                                  <strong>Value:</strong> {question.questionValue}
                                </div>
                              )}
                            </div>
                          </div>

                          {question.questionType === 'sentence' && question.passages ? (
                            <div className="pa-passage-preview">
                              <h5><FontAwesomeIcon icon={faBook} /> Reading Passage</h5>

                              <div className="pa-passage-navigation">
                                <button
                                  className="pa-page-nav-btn"
                                  onClick={() => handlePreviewPageChange('prev')}
                                  disabled={previewPage === 0}
                                >
                                  <FontAwesomeIcon icon={faArrowLeft} /> Previous
                                </button>

                                <span className="pa-page-indicator">
                                  Page {previewPage + 1} of {question.passages.length}
                                </span>

                                <button
                                  className="pa-page-nav-btn"
                                  onClick={() => handlePreviewPageChange('next')}
                                  disabled={previewPage >= question.passages.length - 1}
                                >
                                  Next <FontAwesomeIcon icon={faArrowRight} />
                                </button>
                              </div>

                              <div className="pa-passage-container">
                                {question.passages[previewPage]?.pageImage && (
                                  <div className="pa-passage-image-container">
                                    <img
                                      src={question.passages[previewPage].pageImage}
                                      alt={`Page ${previewPage + 1} illustration`}
                                      className="pa-passage-image"
                                    />
                                  </div>
                                )}

                                <div className="pa-passage-text-container">
                                  <p className="pa-passage-text">{question.passages[previewPage]?.pageText}</p>
                                </div>
                              </div>

                              <div className="pa-comprehension-questions">
                                <h5><FontAwesomeIcon icon={faQuestion} /> Comprehension Questions</h5>
                                {question.sentenceQuestions && question.sentenceQuestions.length > 0 ? (
                                  question.sentenceQuestions.map((sq, sqIndex) => (
                                    <div key={sqIndex} className="pa-comprehension-question">
                                      <div className="pa-comprehension-q-header">
                                        <span className="pa-comprehension-q-number">Q{sqIndex + 1}:</span>
                                        <span className="pa-comprehension-q-text">{sq.questionText}</span>
                                      </div>

                                      <div className="pa-comprehension-options">
                                        <div className="pa-option pa-option-correct">
                                          <FontAwesomeIcon icon={faCheckCircle} className="pa-option-icon" />
                                          {sq.correctAnswer}
                                        </div>
                                        <div className="pa-option">
                                          {sq.incorrectAnswer}
                                        </div>
                                      </div>
                                    </div>
                                  ))
                                ) : (
                                  <div className="pa-no-questions">
                                    <p>No comprehension questions added yet.</p>
                                  </div>
                                )}
                              </div>
                            </div>
                          ) : (
                            <div className="pa-choice-options">
                              <h5><FontAwesomeIcon icon={faCheckDouble} /> Answer Options</h5>

                              <div className="pa-options-list">
                                {question.choiceOptions && question.choiceOptions.map((option, optIndex) => (
                                  <div
                                    key={optIndex}
                                    className={`pa-option ${option.isCorrect ? 'pa-option-correct' : ''}`}
                                  >
                                    <div className="pa-option-header">
                                    {option.isCorrect && (
                                      <FontAwesomeIcon icon={faCheckCircle} className="pa-option-icon" />
                                    )}
                                    {option.optionText}
                                  </div>
                                    
                                    {option.description && (
                                      <div className="pa-option-description">
                                        {option.description}
                            </div>
                          )}
                      </div>
                    ))}
                  </div>
                    </div>
                          )}
                    </div>
                  </div>
                    ))}
                  </div>
                </div>
              ) : showQuestionForm ? (
                <div className="pa-question-form">
                  <div className="pa-question-form-header">
                    <h4>
                      {currentQuestion !== null ? (
                        <><FontAwesomeIcon icon={faEdit} /> Edit Question #{currentQuestion + 1}</>
                      ) : (
                        <><FontAwesomeIcon icon={faPlus} /> Add New Question</>
                      )}
                    </h4>
                    <button
                      type="button"
                      className="pa-back-to-form-btn"
                      onClick={() => setShowQuestionForm(false)}
                    >
                      <FontAwesomeIcon icon={faArrowLeft} /> Back to Assessment
                    </button>
                  </div>

                  <div className="pa-question-form-content">
                    <div className="pa-question-form-grid">
                      <div className="pa-form-group">
                        <label htmlFor="questionType">
                          Question Type:
                          <Tooltip text="Select the type of question you want to create based on your assessment category." />
                        </label>
                        <select
                          id="questionType"
                          name="questionType"
                          value={questionFormData.questionType}
                          onChange={handleQuestionFormChange}
                          className="pa-select-input"
                        >
                          {formData.category === "Alphabet Knowledge" && (
                            <>
                              <option value="patinig">Vowel (Patinig)</option>
                              <option value="katinig">Consonant (Katinig)</option>
                            </>
                          )}
                          {formData.category === "Phonological Awareness" && (
                            <>
                              <option value="malapantig">Syllable (Malapantig)</option>
                              <option value="katinig">Consonant (Katinig)</option>
                              <option value="patinig">Vowel (Patinig)</option>
                            </>
                          )}
                          {(formData.category === "Word Recognition" || formData.category === "Decoding") && (
                            <option value="word">Word</option>
                          )}
                          {formData.category === "Reading Comprehension" && (
                            <option value="sentence">Reading Passage</option>
                          )}
                        </select>
                      </div>

                      <div className="pa-form-group">
                        <label htmlFor="questionText">
                          Question Text:
                          <Tooltip text="The main instruction or question displayed to the student." />
                        </label>
                        <input
                          type="text"
                          id="questionText"
                          name="questionText"
                          value={questionFormData.questionText}
                          onChange={handleQuestionFormChange}
                          placeholder="Enter the question text (e.g., 'Anong katumbas na maliit na letra?')"
                          required
                          className="pa-text-input"
                        />
                      </div>

                      {questionFormData.questionType !== "sentence" && (
                        <>
                          <div className="pa-form-group">
                            <label htmlFor="questionValue">
                              Question Display Text:
                              <Tooltip text="The text shown alongside the question, like a letter or word combination that students need to analyze." />
                            </label>
                            <input
                              type="text"
                              id="questionValue"
                              name="questionValue"
                              value={questionFormData.questionValue || ""}
                              onChange={handleQuestionFormChange}
                              placeholder="Enter text to display with the question (e.g., 'A' or 'BO + LA')"
                              className="pa-text-input"
                            />
                          </div>

                          <div className="pa-form-group">
                            <label>
                              Question Image:
                              <Tooltip text="Upload an image to display with the question (e.g., a picture of the letter or word)." />
                            </label>
                            <div className="pa-file-upload">
                              <label className="pa-file-upload-btn">
                                <FontAwesomeIcon icon={faCloudUploadAlt} />
                                {uploadingImage ? "Uploading..." : "Upload Image"}
                                <input
                                  type="file"
                                  accept="image/*"
                                  onChange={(e) => handleImageUpload(e, "questionImage")}
                                  className="pa-file-input"
                                  disabled={uploadingImage}
                                />
                              </label>

                              {questionFormData.questionImage && (
                                <div className="pa-image-preview">
                                  <img
                                    src={
                                      typeof questionFormData.questionImage === 'string' && 
                                      questionFormData.questionImage.startsWith('data:') 
                                        ? questionFormData.questionImage // Show data URL for preview
                                        : questionFormData.questionImage // Show existing URL
                                    } 
                                    alt="Question" 
                                    className="pa-preview-image"
                                  />
                                  
                                  <div className="pa-file-name">
                                    {questionFormData.imageName || "Image Preview"}
                                  </div>
                                  
                                  <button
                                    type="button"
                                    onClick={() => {
                                      setQuestionFormData({
                                        ...questionFormData,
                                        questionImage: null,
                                        imageFile: null,
                                        imageName: ""
                                      });
                                    }}
                                    className="pa-remove-image"
                                    title="Remove Image"
                                  >
                                    <FontAwesomeIcon icon={faTimes} />
                                  </button>
                                </div>
                              )}
                            </div>
                          </div>

                          <div className="pa-form-group pa-full-width">
                            <label>
                              Answer Choices:
                              <Tooltip text="Add answer options for the student to choose from. Mark one as correct." />
                            </label>

                            <div className="pa-choices-container">
                              {questionFormData.choiceOptions.map((choice, index) => (
                                <div className="pa-choice-item" key={index}>
                                  <div className="pa-choice-input-group">
                                    <input
                                      type="text"
                                      value={choice.optionText}
                                      onChange={(e) => handleChoiceChange(index, "optionText", e.target.value)}
                                      placeholder={`Option ${index + 1} (e.g., "a" or "BOLA")`}
                                      required
                                      className="pa-text-input"
                                    />

                                    <div className="pa-choice-controls">
                                      <label className={`pa-correct-checkbox ${choice.isCorrect ? 'selected' : ''}`}>
                                        <input
                                          type="radio"
                                          name="correctOption"
                                          checked={choice.isCorrect}
                                          onChange={() => {
                                            // Update all choices to be incorrect first
                                            const updatedChoices = questionFormData.choiceOptions.map(c => ({
                                              ...c,
                                              isCorrect: false
                                            }));
                                            // Then set the selected one to correct
                                            updatedChoices[index].isCorrect = true;
                                            setQuestionFormData(prev => ({
                                              ...prev,
                                              choiceOptions: updatedChoices
                                            }));
                                          }}
                                        />
                                        <FontAwesomeIcon icon={choice.isCorrect ? faCheckCircle : faQuestion} />
                                        Correct Answer
                                      </label>

                                      {index > 1 && (
                                        <button
                                          type="button"
                                          className="pa-remove-choice"
                                          onClick={() => handleRemoveChoice(index)}
                                          title="Remove this option"
                                        >
                                          <FontAwesomeIcon icon={faTimes} />
                                        </button>
                                      )}
                                    </div>
                                  </div>

                                  <div className="pa-choice-description">
                                    <label>
                                      Description:
                                      <Tooltip text="Provide feedback to be shown when this option is selected. For correct answers, explain why it's right. For incorrect answers, give guidance." />
                                    </label>
                                    <textarea
                                      value={choice.description || ''}
                                      onChange={(e) => handleChoiceChange(index, "description", e.target.value)}
                                      placeholder={choice.isCorrect ? 
                                        "Explain why this is the correct answer (e.g., 'Tama! Ang letra B ay may tunog na /buh/.')" : 
                                        "Explain why this is incorrect (e.g., 'Mali. Ang tunog na /kuh/ ay para sa letra K.')"}
                                    ></textarea>
                                  </div>
                                </div>
                              ))}

                              <div className="pa-help-text">
                                <FontAwesomeIcon icon={faInfoCircle} />
                                Note: This assessment type is limited to exactly 2 answer choices for optimal mobile experience.
                              </div>
                            </div>
                          </div>
                        </>
                      )}
                      {questionFormData.questionType === "sentence" && (
                        <div className="pa-passage-form pa-full-width">
                          <div className="pa-form-section">
                            <h5><FontAwesomeIcon icon={faBook} /> Reading Passage Pages</h5>

                            {questionFormData.passages.map((page, index) => (
                              <div key={index} className="pa-passage-item">
                                <div className="pa-passage-header">
                                  <h5>Page {index + 1}</h5>
                                  {index > 0 && (
                                    <button
                                      type="button"
                                      className="pa-remove-page"
                                      onClick={() => {
                                        setQuestionFormData(prev => ({
                                          ...prev,
                                          passages: prev.passages.filter((_, i) => i !== index)
                                        }));
                                      }}
                                      title="Remove page"
                                    >
                                      <FontAwesomeIcon icon={faTimes} />
                                    </button>
                                  )}
                                </div>

                                <div className="pa-form-group">
                                  <label>
                                    Page Text:
                                    <Tooltip text="The text content for this page of the reading passage." />
                                  </label>
                                  <textarea
                                    value={page.pageText}
                                    onChange={(e) => {
                                      const updatedPassages = [...questionFormData.passages];
                                      updatedPassages[index] = {
                                        ...updatedPassages[index],
                                        pageText: e.target.value
                                      };
                                      setQuestionFormData(prev => ({
                                        ...prev,
                                        passages: updatedPassages
                                      }));
                                    }}
                                    placeholder="Enter the text for this page of the story"
                                    rows={4}
                                    className="pa-textarea"
                                  ></textarea>
                                </div>

                                <div className="pa-form-group">
                                  <label>
                                    Page Image:
                                    <Tooltip text="Upload an illustration for this page of the reading passage." />
                                  </label>
                                  <div className="pa-file-upload">
                                    <label className="pa-file-upload-btn">
                                      <FontAwesomeIcon icon={faUpload} /> Choose Image
                                      <input
                                        type="file"
                                        accept="image/*"
                                        onChange={(e) => handleFileUpload(e, `pageImage-${index}`)}
                                        className="pa-file-input"
                                      />
                                    </label>
                                    <span className="pa-file-name">
                                      {page.pageImage
                                        ? page.pageImage.split('/').pop()
                                        : "No file chosen"}
                                    </span>

                                    {page.pageImage && (
                                      <div className="pa-image-preview">
                                        <img
                                          src={page.pageImage}
                                          alt={`Page ${index + 1} preview`}
                                          className="pa-preview-image"
                                        />
                                      </div>
                                    )}
                                  </div>
                                </div>
                              </div>
                            ))}

                            <button
                              type="button"
                              className="pa-add-page-btn"
                              onClick={() => {
                                setQuestionFormData(prev => ({
                                  ...prev,
                                  passages: [
                                    ...prev.passages,
                                    {
                                      pageNumber: prev.passages.length + 1,
                                      pageText: "",
                                      pageImage: null
                                    }
                                  ]
                                }));
                              }}
                            >
                              <FontAwesomeIcon icon={faPlus} /> Add Page
                            </button>
                          </div>

                          <div className="pa-form-section">
                            <h5><FontAwesomeIcon icon={faQuestion} /> Comprehension Questions</h5>

                            {questionFormData.sentenceQuestions.map((sq, index) => (
                              <div key={index} className="pa-sentence-question-item">
                                <div className="pa-sentence-question-header">
                                  <h5>Question {index + 1}</h5>
                                  {index > 0 && (
                                    <button
                                      type="button"
                                      className="pa-remove-sentence-question"
                                      onClick={() => {
                                        setQuestionFormData(prev => ({
                                          ...prev,
                                          sentenceQuestions: prev.sentenceQuestions.filter((_, i) => i !== index)
                                        }));
                                      }}
                                      title="Remove question"
                                    >
                                      <FontAwesomeIcon icon={faTimes} />
                                    </button>
                                  )}
                                </div>

                                <div className="pa-form-group">
                                  <label>
                                    Question Text:
                                    <Tooltip text="The comprehension question about the passage." />
                                  </label>
                                  <input
                                    type="text"
                                    value={sq.questionText}
                                    onChange={(e) => {
                                      const updatedQuestions = [...questionFormData.sentenceQuestions];
                                      updatedQuestions[index] = {
                                        ...updatedQuestions[index],
                                        questionText: e.target.value
                                      };
                                      setQuestionFormData(prev => ({
                                        ...prev,
                                        sentenceQuestions: updatedQuestions
                                      }));
                                    }}
                                    placeholder="Enter question text (e.g., 'Sino ang pangunahing tauhan?')"
                                    className="pa-text-input"
                                  />
                                </div>

                                <div className="pa-form-group">
                                  <label>
                                    Correct Answer:
                                    <Tooltip text="The correct answer to the comprehension question." />
                                  </label>
                                  <input
                                    type="text"
                                    value={sq.correctAnswer}
                                    onChange={(e) => {
                                      const updatedQuestions = [...questionFormData.sentenceQuestions];
                                      updatedQuestions[index] = {
                                        ...updatedQuestions[index],
                                        correctAnswer: e.target.value
                                      };
                                      setQuestionFormData(prev => ({
                                        ...prev,
                                        sentenceQuestions: updatedQuestions
                                      }));
                                    }}
                                    placeholder="Enter the correct answer"
                                    className="pa-text-input pa-correct-input"
                                  />
                                </div>

                                <div className="pa-form-group">
                                  <label>
                                    Incorrect Answer:
                                    <Tooltip text="One incorrect option for the comprehension question." />
                                  </label>
                                  <input
                                    type="text"
                                    value={sq.incorrectAnswer}
                                    onChange={(e) => {
                                      const updatedQuestions = [...questionFormData.sentenceQuestions];
                                      updatedQuestions[index] = {
                                        ...updatedQuestions[index],
                                        incorrectAnswer: e.target.value
                                      };
                                      setQuestionFormData(prev => ({
                                        ...prev,
                                        sentenceQuestions: updatedQuestions
                                      }));
                                    }}
                                    placeholder="Enter an incorrect answer"
                                    className="pa-text-input pa-incorrect-input"
                                  />
                                </div>
                              </div>
                            ))}

                            <button
                              type="button"
                              className="pa-add-sentence-question-btn"
                              onClick={() => {
                                setQuestionFormData(prev => ({
                                  ...prev,
                                  sentenceQuestions: [
                                    ...prev.sentenceQuestions,
                                    {
                                      questionText: "",
                                      correctAnswer: "",
                                      incorrectAnswer: ""
                                    }
                                  ]
                                }));
                              }}
                            >
                              <FontAwesomeIcon icon={faPlus} /> Add Comprehension Question
                            </button>

                            <div className="pa-help-text">
                              <FontAwesomeIcon icon={faInfoCircle} />
                              Note: Only two answer choices (correct and incorrect) will be shown to students.
                            </div>
                          </div>
                        </div>
                      )}
                    </div>

                    <div className="pa-question-form-buttons">
                      <button
                        type="button"
                        className="pa-cancel-btn"
                        onClick={() => setShowQuestionForm(false)}
                      >
                        <FontAwesomeIcon icon={faTimes} /> Cancel
                      </button>
                      <button
                        type="button"
                        className="pa-save-question-btn"
                        onClick={handleQuestionFormSubmit}
                      >
                        <FontAwesomeIcon icon={currentQuestion !== null ? faEdit : faPlus} />
                        {currentQuestion !== null ? ' Update Question' : ' Add Question'}
                      </button>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="pa-assessment-form">
                  <div className="pa-assessment-form-header">
                    <h4>
                      <FontAwesomeIcon icon={modalType === 'create' ? faPlus : faEdit} />
                      {modalType === 'create' ? 'Create New Assessment' : 'Edit Assessment'}
                    </h4>
                    <p className="pa-form-description">
                      Build targeted assessments to evaluate student progress in specific reading skills and categories.
                    </p>
                  </div>

                  <div className="pa-form-section">
                    <h5>
                      <FontAwesomeIcon icon={faInfoCircle} />
                      Assessment Configuration
                    </h5>

                    <div className="pa-form-row">
                      <div className="pa-form-group">
                        <label htmlFor="readingLevel">
                          Reading Level:
                          <Tooltip text="Select the CRLA reading level this assessment targets." />
                        </label>
                        <select
                          id="readingLevel"
                          name="readingLevel"
                          value={formData.readingLevel}
                          onChange={handleFormChange}
                          required
                          className="pa-select-input"
                        >
                          <option value="">Select Reading Level</option>
                          <option value="Low Emerging">Low Emerging</option>
                          <option value="High Emerging">High Emerging</option>
                          <option value="Developing">Developing</option>
                          <option value="Transitioning">Transitioning</option>
                          <option value="At Grade Level">At Grade Level</option>
                        </select>
                      </div>

                      <div className="pa-form-group">
                        <label htmlFor="category">
                          Category:
                          <Tooltip text="Select the specific reading skill category to assess." />
                        </label>
                        <select
                          id="category"
                          name="category"
                          value={formData.category}
                          onChange={handleFormChange}
                          required
                          className="pa-select-input"
                        >
                          <option value="">Select Category</option>
                          <option value="Alphabet Knowledge">Alphabet Knowledge</option>
                          <option value="Phonological Awareness">Phonological Awareness</option>
                          <option value="Decoding">Decoding</option>
                          <option value="Word Recognition">Word Recognition</option>
                          <option value="Reading Comprehension">Reading Comprehension</option>
                        </select>
                      </div>
                    </div>
                  </div>

                  <div className="pa-form-section">
                    <div className="pa-questions-header">
                      <h5>
                        <FontAwesomeIcon icon={faFileAlt} />
                        Assessment Questions
                      </h5>
                      <div className="pa-questions-stats">
                        <span className="pa-questions-counttt">
                          {formData.questions.length} questions added
                        </span>
                        <button
                          type="button"
                          className="pa-add-question-btn"
                          onClick={handleAddQuestion}
                          disabled={!formData.category}
                        >
                          <FontAwesomeIcon icon={faPlus} /> Add Question
                        </button>
                      </div>
                    </div>

                    <div className="pa-questions-container">
                      {formData.questions.length === 0 ? (
                        <div className="pa-no-questions">
                          <FontAwesomeIcon icon={faQuestion} className="pa-no-questions-icon" />
                          <h6>No questions added yet</h6>
                          <p>Start building your assessment by adding questions tailored to your selected category and reading level.</p>
                          {!formData.category && (
                            <div className="pa-category-reminder">
                              <FontAwesomeIcon icon={faInfoCircle} />
                              Select a category above to begin adding questions.
                            </div>
                          )}
                        </div>
                      ) : (
                        <div className="pa-question-list">
                          {formData.questions.map((question, index) => (
                            <div key={index} className="pa-question-item">
                              <div className="pa-question-item-header">
                                <div className="pa-question-info">
                                  <span className="pa-question-numberr">Q{index + 1}</span>
                                  <div className="pa-question-details">
                                    <span className="pa-question-category">
                                      {getQuestionTypeDisplay(question.questionType)}
                                    </span>
                                    <span className="pa-question-text-preview">
                                      {question.questionText}
                                    </span>
                                  </div>
                                </div>

                                <div className="pa-question-item-actions">
                                  <button
                                    className="pa-edit-question-btn"
                                    onClick={() => handleEditQuestion(question, index)}
                                    title="Edit question"
                                  >
                                    <FontAwesomeIcon icon={faEdit} />
                                  </button>
                                  <button
                                    className="pa-remove-question"
                                    onClick={() => handleRemoveQuestion(index)}
                                    title="Remove question"
                                  >
                                    <FontAwesomeIcon icon={faTimes} />
                                  </button>
                                </div>
                              </div>

                              <div className="pa-question-item-metadata">
                                <div className="pa-question-meta-item">
                                  {question.questionImage && (
                                    <span className="pa-meta-tag">
                                      <FontAwesomeIcon icon={faImages} /> Has Image
                                    </span>
                                  )}
                                  {question.questionType === "sentence" ? (
                                    <>
                                      <span className="pa-meta-tag">
                                        <FontAwesomeIcon icon={faBook} /> {question.passages?.length || 0} Pages
                                      </span>
                                      <span className="pa-meta-tag">
                                        <FontAwesomeIcon icon={faQuestion} /> {question.sentenceQuestions?.length || 0} Questions
                                      </span>
                                    </>
                                  ) : (
                                    <span className="pa-meta-tag">
                                      <FontAwesomeIcon icon={faCheckCircle} /> {question.choiceOptions?.length || 0} Options
                                    </span>
                                  )}
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Admin approval message removed */}
                </div>
              )}
            </div>

            <div className="pa-modal-footer">
              {modalType === 'delete' ? (
                <>
                  <button
                    className="pa-modal-cancel"
                    onClick={() => setShowModal(false)}
                  >
                    <FontAwesomeIcon icon={faTimes} /> Cancel
                  </button>
                  <button
                    className="pa-modal-delete"
                    onClick={handleDeleteAssessment}
                  >
                    <FontAwesomeIcon icon={faTrash} /> Delete Assessment
                  </button>
                </>
              ) : modalType === 'preview' ? (
                <button
                  className="pa-modal-close-btn"
                  onClick={() => setShowModal(false)}
                >
                  <FontAwesomeIcon icon={faTimes} /> Close Preview
                </button>
              ) : showQuestionForm ? (
                null
              ) : (
                <>
                  <button
                    className="pa-modal-cancel"
                    onClick={() => setShowModal(false)}
                  >
                    <FontAwesomeIcon icon={faTimes} /> Cancel
                  </button>
                  <button
                    className="pa-modal-save"
                    onClick={handleSaveAssessment}
                    disabled={!formData.readingLevel || !formData.category || formData.questions.length === 0}
                  >
                    <FontAwesomeIcon icon={modalType === 'create' ? faPlus : faEdit} />
                    {modalType === 'create' ? ' Create Assessment' : ' Save Changes'}
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      )}

      {submitConfirmDialog && (
        <div className="pa-modal-overlay">
          <div className="pa-modal pa-confirm-dialog">
            <div className="pa-modal-header">
              <h3><FontAwesomeIcon icon={faLock} className="pa-modal-header-icon" /> Submit for Admin Approval</h3>
              <button
                className="pa-modal-close"
                onClick={() => setSubmitConfirmDialog(false)}
              >
                <FontAwesomeIcon icon={faTimes} />
              </button>
            </div>

            <div className="pa-modal-body">
              <div className="pa-confirm-icon">
                <FontAwesomeIcon icon={faLock} />
              </div>
              <div className="pa-confirm-message">
                <p>Your assessment will be submitted for admin approval before it can be assigned to students.</p>
                <p>Once submitted, it will appear with "Pending Approval" status.</p>
                <p className="pa-confirm-question">Would you like to submit this assessment now?</p>
              </div>

              <div className="pa-submission-summary">
                <h4>Assessment Summary:</h4>
                <div className="pa-summary-details">
                  <div className="pa-summary-item">
                    <span className="pa-summary-label">Reading Level:</span>
                    <span className="pa-summary-value">{formData.readingLevel}</span>
                  </div>
                  <div className="pa-summary-item">
                    <span className="pa-summary-label">Category:</span>
                    <span className="pa-summary-value">{formData.category}</span>
                  </div>
                  <div className="pa-summary-item">
                    <span className="pa-summary-label">Total Questions:</span>
                    <span className="pa-summary-value">{formData.questions.length}</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="pa-modal-footer">
              <button
                className="pa-modal-cancel"
                onClick={() => setSubmitConfirmDialog(false)}
              >
                <FontAwesomeIcon icon={faArrowLeft} /> Go Back and Edit
              </button>
              <button
                className="pa-modal-save"
                onClick={handleConfirmSubmit}
              >
                <FontAwesomeIcon icon={faLock} /> Submit for Approval
              </button>
            </div>
          </div>
        </div>
      )}

      {submitSuccessDialog && (
        <div className="pa-success-notification">
          <div className="pa-success-icon">
            <FontAwesomeIcon icon={faCheckCircle} />
          </div>
          <div className="pa-success-message">
            <p>
              {modalType === 'create' 
                ? 'Assessment created successfully!' 
                : 'Assessment updated successfully!'}
            </p>
            <div className="pa-success-detail">
              <span>{formData.readingLevel}</span> | <span>{formData.category}</span>
            </div>
          </div>
        </div>
      )}

      {deleteSuccessDialog && (
        <div className="pa-success-notification">
          <div className="pa-success-icon">
            <FontAwesomeIcon icon={faTrash} />
          </div>
          <div className="pa-success-message">
            <p>Assessment deleted successfully!</p>
          </div>
        </div>
      )}

      {duplicateRestrictionDialog && (
        <div className="pa-modal-overlay">
          <div className="pa-modal pa-restriction-dialog">
            <div className="pa-modal-header">
              <h3>
                <FontAwesomeIcon icon={faExclamationTriangle} className="pa-modal-header-icon" /> 
                Cannot Create Assessment
              </h3>
              <button 
                className="pa-modal-close"
                onClick={() => setDuplicateRestrictionDialog(false)}
              >
                <FontAwesomeIcon icon={faTimes} />
              </button>
            </div>
            
            <div className="pa-modal-body">
              <div className="pa-restriction-icon">
                <FontAwesomeIcon icon={faExclamationTriangle} />
              </div>
              <div className="pa-restriction-message">
                <p>
                  <strong>Restriction:</strong> Only one assessment per reading level and category combination is allowed.
                </p>
                <p>
                  For <strong>{formData.readingLevel}</strong> level and <strong>{formData.category}</strong> category:
                </p>
                
                {(() => {
                  const existing = checkExistingAssessment(formData.readingLevel, formData.category);
                  if (existing) {
                    return (
                      <div className="pa-restriction-details">
                        <FontAwesomeIcon icon={faExclamationTriangle} />
                        <span>An assessment already exists for this reading level and category combination</span>
                      </div>
                    );
                  }
                })()}
                
                <div className="pa-restriction-options">
                  <p>You can:</p>
                  <ul className="pa-restriction-list">
                    <li>Wait for the existing assessment to be approved or rejected</li>
                    <li>Choose a different reading level or category combination</li>
                    <li>Edit the existing assessment if available</li>
                    <li>Contact an administrator to modify active assessments</li>
                  </ul>
                </div>
              </div>
            </div>
            
            <div className="pa-modal-footer">
              <button 
                className="pa-modal-close-btn"
                onClick={() => setDuplicateRestrictionDialog(false)}
              >
                <FontAwesomeIcon icon={faArrowLeft} /> Go Back
              </button>
            </div>
          </div>
        </div>
      )}
      <ToastContainer position="top-right" autoClose={5000} hideProgressBar={false} newestOnTop closeOnClick pauseOnHover />
    </div>
  );
};

// To maintain compatibility, we export as both MainAssessment and the original PostAssessment name
export { MainAssessment as PostAssessment };
export default MainAssessment;