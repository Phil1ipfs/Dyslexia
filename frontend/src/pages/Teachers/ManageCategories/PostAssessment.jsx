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
  faCloudUploadAlt,
  faClock,
  faTimesCircle,
  faListUl,
  faVolumeUp,
  faLink
} from "@fortawesome/free-solid-svg-icons";
import "../../../css/Teachers/ManageCategories/PostAssessment.css";
import "../../../css/Teachers/ManageCategories/AssessmentPreview.css";
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
  console.log('🔧 [DEBUG] MainAssessment component initializing...');
  console.log('🔧 [DEBUG] Templates prop:', templates);
  
  // State variables
  const [assessments, setAssessments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filterReadingLevel, setFilterReadingLevel] = useState("all");
  const [filterCategory, setFilterCategory] = useState("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [modalType, setModalType] = useState("create"); // "create", "edit", "preview", "delete"
  const [selectedAssessment, setSelectedAssessment] = useState(null);
  const [formData, setFormData] = useState({
    readingLevel: "",
    category: "",
    questions: [],
    isActive: true,
    status: "active"
  });
  const [showQuestionForm, setShowQuestionForm] = useState(false);
  const [currentQuestion, setCurrentQuestion] = useState(null);
  const [questionFormData, setQuestionFormData] = useState({
    questionText: "",
    questionImage: null,
    questionValue: "",
    choiceOptions: [],
    passages: [],
    sentenceQuestions: [],
    questionSet: [],
    // Reading Comprehension specific fields for multiple questions
    storyTitle: "",
    comprehensionQuestions: [],
    currentComprehensionIndex: -1, // -1 means adding new, >=0 means editing existing
    tempComprehensionQuestion: {
      questionText: "",
      correctAnswer: "",
      acceptableAnswers: []
    }
  });
  const [previewPages, setPreviewPages] = useState({});
  const [uploadingImage, setUploadingImage] = useState(false);
  const [submitSuccessDialog, setSubmitSuccessDialog] = useState(false);
  const [deleteSuccessDialog, setDeleteSuccessDialog] = useState(false);
  const [submitConfirmDialog, setSubmitConfirmDialog] = useState(false);
  const [duplicateRestrictionDialog, setDuplicateRestrictionDialog] = useState(false);
  const [restrictionReason, setRestrictionReason] = useState("");
  const [apiMessage, setApiMessage] = useState(null);
  
  console.log('🔧 [DEBUG] Initial state values:', {
    loading,
    error,
    showModal,
    modalType,
    showQuestionForm,
    formData,
    questionFormData
  });
  
  // State for add option inputs
  const [showAddAnswerInput, setShowAddAnswerInput] = useState(false);
  const [showAddSoundInput, setShowAddSoundInput] = useState(false);
  const [newAnswerOption, setNewAnswerOption] = useState('');
  const [newSoundOption, setNewSoundOption] = useState('');

  // Category to question type mapping
  const categoryToQuestionTypeMap = {
    "Alphabet Knowledge": "multiple_choice",
    "Phonological Awareness": "matching", 
    "Decoding": "drag_drop",
    "Word Recognition": "fill_blank",
    "Reading Comprehension": "text_input"
  };

  // Helper function to get category prefix
  const getCategoryPrefix = (category) => {
    const prefixMap = {
      'Alphabet Knowledge': 'AK',
      'Phonological Awareness': 'PA',
      'Decoding': 'DC',
      'Word Recognition': 'WR',
      'Reading Comprehension': 'RC'
    };
    return prefixMap[category] || 'Q';
  };

  // Comprehensive Data Sanitization and Validation System
  const DataSanitizer = {
    // Base question structure for each category
    getBaseStructure: (category) => {
      const baseStructure = {
        questionId: null,
        questionText: "",
        questionImage: null,
        questionValue: null
      };

      switch (category) {
        case "Alphabet Knowledge":
          return {
            ...baseStructure,
            questionValue: "", // Allow questionValue for Alphabet Knowledge
            choiceOptions: [
              { optionId: "1", optionText: "", isCorrect: true },
              { optionId: "2", optionText: "", isCorrect: false },
              { optionId: "3", optionText: "", isCorrect: false }
            ]
          };

        case "Phonological Awareness":
          return {
            ...baseStructure,
            questionSet: {
              audioTexts: [],
              matchingOptions: [],
              correctPairs: []
            }
          };

        case "Decoding":
          return {
            ...baseStructure,
            displaySequence: [],
            blankPosition: null,
            dragElements: [],
            correctSequence: []
          };

        case "Word Recognition":
          return {
            ...baseStructure,
            displayWord: "",
            blankOptions: [],
            correctAnswer: []
          };

        case "Reading Comprehension":
          return {
            ...baseStructure,
            storyTitle: "",
            passages: [],
            acceptableAnswers: []
          };

        default:
          return baseStructure;
      }
    },

    // Sanitize individual question based on category
    sanitizeQuestion: (question, category) => {
      if (!question || !category) {
        throw new Error("Question and category are required for sanitization");
      }

      // Start with base structure
      const sanitized = { ...DataSanitizer.getBaseStructure(category) };

      // Copy common fields
      sanitized.questionId = question.questionId || null;
      sanitized.questionText = (question.questionText || "").toString().trim();
      sanitized.questionImage = question.questionImage || null;

      switch (category) {
        case "Alphabet Knowledge":
          sanitized.questionValue = question.questionValue || "";
          sanitized.choiceOptions = DataSanitizer.sanitizeChoiceOptions(question.choiceOptions);
          break;

        case "Phonological Awareness":
          sanitized.questionSet = DataSanitizer.sanitizeQuestionSet(question.questionSet || {});
          break;

        case "Decoding":
          sanitized.displaySequence = Array.isArray(question.displaySequence) ? 
            question.displaySequence.map(item => {
              if (typeof item === 'string') {
                const cleaned = item.replace(/[^a-zA-Z]/g, '');
                return cleaned.charAt(0).toUpperCase() + cleaned.slice(1).toLowerCase();
              }
              return item;
            }) : [];
          sanitized.blankPosition = typeof question.blankPosition === 'number' ? question.blankPosition : null;
          sanitized.dragElements = Array.isArray(question.dragElements) ? 
            question.dragElements.map(item => {
              if (typeof item === 'string') {
                const cleaned = item.replace(/[^a-zA-Z]/g, '');
                return cleaned.charAt(0).toUpperCase() + cleaned.slice(1).toLowerCase();
              }
              return item;
            }) : [];
          sanitized.correctSequence = Array.isArray(question.correctSequence) ? 
            question.correctSequence.map(item => {
              if (typeof item === 'string') {
                const cleaned = item.replace(/[^a-zA-Z]/g, '');
                return cleaned.charAt(0).toUpperCase() + cleaned.slice(1).toLowerCase();
              }
              return item;
            }) : [];
          break;

        case "Word Recognition":
          sanitized.displayWord = (question.displayWord || "").toString().trim();
          sanitized.blankOptions = Array.isArray(question.blankOptions) ? question.blankOptions : [];
          sanitized.correctAnswer = Array.isArray(question.correctAnswer) ? question.correctAnswer : [];
          break;

        case "Reading Comprehension":
          sanitized.storyTitle = (question.storyTitle || "").toString().trim();
          sanitized.passages = DataSanitizer.sanitizePassages(question.passages);
          sanitized.acceptableAnswers = Array.isArray(question.acceptableAnswers) ? question.acceptableAnswers : [];
          break;

        default:
          throw new Error(`Unknown category: ${category}`);
      }

      return sanitized;
    },

    // Sanitize choice options for Alphabet Knowledge
    sanitizeChoiceOptions: (choiceOptions) => {
      if (!Array.isArray(choiceOptions)) {
        return [
          { optionId: "1", optionText: "", isCorrect: true },
          { optionId: "2", optionText: "", isCorrect: false },
          { optionId: "3", optionText: "", isCorrect: false }
        ];
      }

      // Ensure exactly 3 options
      const sanitized = choiceOptions.slice(0, 3).map((option, index) => ({
        optionId: (index + 1).toString(),
        optionText: (option.optionText || "").toString().trim(),
        isCorrect: Boolean(option.isCorrect)
      }));

      // Fill missing options
      while (sanitized.length < 3) {
        sanitized.push({
          optionId: (sanitized.length + 1).toString(),
          optionText: "",
          isCorrect: false
        });
      }

      // Ensure at least one correct option
      if (!sanitized.some(opt => opt.isCorrect)) {
        sanitized[0].isCorrect = true;
      }

      return sanitized;
    },

    // Sanitize question set for Phonological Awareness
    sanitizeQuestionSet: (questionSet) => {
      // Handle both array and object formats
      const set = Array.isArray(questionSet) ? questionSet[0] : questionSet;
      
      if (!set || typeof set !== 'object') {
        return {
          audioTexts: [],
          matchingOptions: [],
          correctPairs: []
        };
      }

      const audioTexts = Array.isArray(set.audioTexts) ? set.audioTexts : [];
      const matchingOptions = Array.isArray(set.matchingOptions) ? set.matchingOptions : [];
      
      // Generate correct pairs based on audio and matching texts
      const correctPairs = audioTexts.map((audio, index) => ({
        [audio]: matchingOptions[index] || audio
      }));

      return {
        audioTexts,
        matchingOptions,
        correctPairs
      };
    },

    // Sanitize passages for Reading Comprehension
    sanitizePassages: (passages) => {
      if (!Array.isArray(passages)) {
        return [];
      }

      return passages.map((passage, index) => ({
        pageNumber: index + 1,
        pageText: (passage.pageText || "").toString().trim(),
        pageImage: passage.pageImage || null
      })).filter(passage => passage.pageText); // Remove empty passages
    },

    // Validate question structure
    validateQuestion: (question, category) => {
      const errors = [];

      if (!question.questionText || question.questionText.trim() === "") {
        errors.push("Question text is required");
      }

      switch (category) {
        case "Alphabet Knowledge":
          if (!Array.isArray(question.choiceOptions) || question.choiceOptions.length !== 3) {
            errors.push("Alphabet Knowledge must have exactly 3 choice options");
          }
          if (!question.choiceOptions || !question.choiceOptions.some(opt => opt.isCorrect)) {
            errors.push("At least one choice option must be correct");
          }
          break;

        case "Phonological Awareness":
          if (!question.questionSet || !question.questionSet.audioTexts || question.questionSet.audioTexts.length === 0) {
            errors.push("Phonological Awareness must have audio texts");
          }
          if (!question.questionSet || !question.questionSet.matchingOptions || question.questionSet.matchingOptions.length === 0) {
            errors.push("Phonological Awareness must have matching options");
          }
          break;

        case "Decoding":
          if (!Array.isArray(question.dragElements) || question.dragElements.length === 0) {
            errors.push("Decoding must have drag elements");
          }
          if (!Array.isArray(question.correctSequence) || question.correctSequence.length === 0) {
            errors.push("Decoding must have correct sequence");
          }
          break;

        case "Word Recognition":
          if (!question.displayWord || question.displayWord.trim() === "") {
            errors.push("Word Recognition must have display word");
          }
          if (!Array.isArray(question.blankOptions) || question.blankOptions.length === 0) {
            errors.push("Word Recognition must have blank options");
          }
          if (!Array.isArray(question.correctAnswer) || question.correctAnswer.length === 0) {
            errors.push("Word Recognition must have correct answer");
          }
          break;

        case "Reading Comprehension":
          if (!question.storyTitle || question.storyTitle.trim() === "") {
            errors.push("Reading Comprehension must have story title");
          }
          if (!Array.isArray(question.acceptableAnswers) || question.acceptableAnswers.length === 0) {
            errors.push("Reading Comprehension must have acceptable answers");
          }
          break;
      }

      return {
        isValid: errors.length === 0,
        errors
      };
    },

    // Sanitize complete assessment data
    sanitizeAssessment: (assessmentData) => {
      if (!assessmentData || !assessmentData.category) {
        throw new Error("Assessment data with category is required");
      }

      const sanitized = {
        readingLevel: assessmentData.readingLevel,
        category: assessmentData.category,
        questionType: getQuestionTypeForCategory(assessmentData.category),
        questions: [],
        status: assessmentData.status || 'draft',
        isActive: Boolean(assessmentData.isActive)
      };

      if (Array.isArray(assessmentData.questions)) {
        sanitized.questions = assessmentData.questions.map((question, index) => {
          try {
            const sanitizedQuestion = DataSanitizer.sanitizeQuestion(question, assessmentData.category);
            
            // Generate questionId if missing
            if (!sanitizedQuestion.questionId) {
              const prefix = getCategoryPrefix(assessmentData.category);
              const number = String(index + 1).padStart(3, '0');
              sanitizedQuestion.questionId = `${prefix}_${number}`;
            }

            return sanitizedQuestion;
          } catch (error) {
            console.error(`Error sanitizing question ${index + 1}:`, error);
            return null;
          }
        }).filter(Boolean); // Remove null questions
      }

      return sanitized;
    }
  };

  // Check if an assessment already exists for a reading level and category
  const checkExistingAssessment = (readingLevel, category, excludeId = null) => {
    return assessments.find(assessment =>
      (assessment.readingLevel || '').trim() === readingLevel.trim() &&
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
        reason: "An assessment already exists for this reading level and category combination",
        existingAssessment: existing
      };
    }

    return { canCreate: true };
  };

  useEffect(() => {
    // Fetch assessments data from the backend
    const fetchAssessments = async () => {
      try {
        console.log('🔧 [DEBUG] useEffect - fetchAssessments starting...');
        setLoading(true);
        console.log("Attempting to fetch assessments...");

        // Add retry mechanism
        let attempts = 0;
        const maxAttempts = 3;
        let response = null;
        let lastError = null;

        while (attempts < maxAttempts) {
          try {
            console.log(`Fetch attempt ${attempts + 1} of ${maxAttempts}`);
            response = await MainAssessmentService.getAllAssessments();
            // If successful, break out of the retry loop
            break;
          } catch (err) {
            lastError = err;
            console.error(`Attempt ${attempts + 1} failed:`, err);
            attempts++;
            if (attempts < maxAttempts) {
              // Wait 1 second before retrying
              await new Promise(resolve => setTimeout(resolve, 1000));
            }
          }
        }

        if (!response && lastError) {
          throw lastError;
        }

        console.log("API Response:", response); // Debug log

        if (response && response.success) {
          const assessmentData = response.data || [];
          console.log("Setting assessments:", assessmentData.length, "items"); // Debug log

          if (assessmentData.length === 0) {
            console.log("No assessments found in the response");
            setApiMessage("No assessment templates found. This could be because templates haven't been created yet, or there might be an issue with the database connection.");
          }

          setAssessments(assessmentData);

          // If there's a message from the API, store it
          if (response.message) {
            setApiMessage(response.message);
          }
        } else if (response && !response.success) {
          console.error("API request was not successful:", response.message || "Unknown error");
          setError(response.message || "Failed to load assessments due to an unknown error.");
          setApiMessage(response.message || "There was an error loading assessment templates. Please try again later.");
        } else {
          console.log("No data or unsuccessful response");
          setAssessments([]);
          setApiMessage("No assessment templates found. This could be because templates haven't been created yet.");
        }

        setLoading(false);
      } catch (err) {
        console.error('Error fetching assessments:', err);
        const errorMessage = handleApiError(err, "Failed to load assessments. Please try again later.");
        setError(errorMessage);
        setApiMessage("There was an error connecting to the assessment service. Please check your connection and try again.");
        setLoading(false);
      }
    };

    fetchAssessments();
  }, []);

  // Add debug logging to see what assessments are loaded
  useEffect(() => {
    if (assessments.length > 0) {
      console.log("Total assessments loaded:", assessments.length);
      console.log("Assessments by reading level:");

      const byLevel = assessments.reduce((acc, assessment) => {
        const level = assessment.readingLevel;
        if (!acc[level]) acc[level] = [];
        acc[level].push({
          id: assessment._id,
          category: assessment.category,
          questions: assessment.questions.length
        });
        return acc;
      }, {});

      console.table(byLevel);

      // Check specifically for Low Emerging
      const lowEmerging = assessments.filter(a => a.readingLevel === "Low Emerging");
      console.log("Low Emerging assessments:", lowEmerging.length);
      console.log("Low Emerging details:", lowEmerging.map(a => ({
        id: a._id,
        category: a.category,
        questions: a.questions.length
      })));

      // Check for exact reading level strings
      const uniqueLevels = [...new Set(assessments.map(a => `"${a.readingLevel}"`))];
      console.log("Unique reading levels (with quotes to see spaces):", uniqueLevels);

      // Add more detailed debugging for reading levels
      console.log("All assessments with reading levels and categories:");
      assessments.forEach((a, index) => {
        console.log(`Assessment ${index + 1}: ID=${a._id}, Level="${a.readingLevel}", Category="${a.category}", charCodes=${[...a.readingLevel].map(c => c.charCodeAt(0))}`);
      });

      // Check if any don't match expected values
      const expectedLevels = ["Low Emerging", "High Emerging", "Developing", "Transitioning", "At Grade Level"];
      const unexpectedLevels = assessments.filter(a => !expectedLevels.includes(a.readingLevel));

      if (unexpectedLevels.length > 0) {
        console.warn("Assessments with unexpected reading levels:", unexpectedLevels);
      }
    }
  }, [assessments]);

  // Filter assessments
  const filteredAssessments = assessments.filter(assessment => {
    // Reading level filter
    const levelMatch = filterReadingLevel === "all" ? true :
      (assessment.readingLevel || '').trim() === filterReadingLevel.trim();

    // Category filter
    const categoryMatch = filterCategory === "all" ? true : assessment.category === filterCategory;

    // Search term
    const searchMatch =
      assessment.category.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (assessment.readingLevel || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (assessment.questions.some(q => q.questionText?.toLowerCase().includes(searchTerm.toLowerCase())));

    return levelMatch && categoryMatch && searchMatch;
  });

  const readingLevels = ["all", "Low Emerging", "High Emerging", "Developing", "Transitioning", "At Grade Level"];

  // Get existing story titles for the current reading level
  const getExistingStoryTitles = () => {
    if (!formData.readingLevel) return [];
    
    const readingCompAssessments = assessments.filter(assessment => 
      assessment.readingLevel === formData.readingLevel && 
      assessment.category === "Reading Comprehension"
    );
    
    const storyTitles = new Set();
    readingCompAssessments.forEach(assessment => {
      assessment.questions.forEach(question => {
        if (question.storyTitle) {
          storyTitles.add(question.storyTitle);
        }
      });
    });
    
    return Array.from(storyTitles);
  };

  // Check if a story title already has passages in the database
  const hasExistingPassages = (storyTitle) => {
    if (!storyTitle || !formData.readingLevel) return false;
    
    const readingCompAssessments = assessments.filter(assessment => 
      assessment.readingLevel === formData.readingLevel && 
      assessment.category === "Reading Comprehension"
    );
    
    for (const assessment of readingCompAssessments) {
      for (const question of assessment.questions) {
        if (question.storyTitle === storyTitle && question.passages && question.passages.length > 0) {
          return true;
        }
      }
    }
    
    return false;
  };

  // Helper functions for managing comprehension questions
  const addComprehensionQuestion = () => {
    const newQuestion = {
      questionText: questionFormData.sentenceQuestions[0]?.questionText || "",
      correctAnswer: questionFormData.sentenceQuestions[0]?.correctAnswer || "",
      acceptableAnswers: [...(questionFormData.sentenceQuestions[0]?.acceptableAnswers || [])]
    };

    const updatedQuestions = [...questionFormData.comprehensionQuestions, newQuestion];
    
    setQuestionFormData(prev => ({
      ...prev,
      comprehensionQuestions: updatedQuestions,
      sentenceQuestions: [{
        questionText: "",
        correctAnswer: "",
        acceptableAnswers: []
      }],
      currentComprehensionIndex: -1
    }));
  };

  const editComprehensionQuestion = (index) => {
    const questionToEdit = questionFormData.comprehensionQuestions[index];
    setQuestionFormData(prev => ({
      ...prev,
      currentComprehensionIndex: index,
      sentenceQuestions: [{
        questionText: questionToEdit.questionText,
        correctAnswer: questionToEdit.correctAnswer,
        acceptableAnswers: [...questionToEdit.acceptableAnswers]
      }]
    }));
  };

  const saveComprehensionQuestion = () => {
    const updatedQuestions = [...questionFormData.comprehensionQuestions];
    updatedQuestions[questionFormData.currentComprehensionIndex] = {
      questionText: questionFormData.sentenceQuestions[0]?.questionText || "",
      correctAnswer: questionFormData.sentenceQuestions[0]?.correctAnswer || "",
      acceptableAnswers: [...(questionFormData.sentenceQuestions[0]?.acceptableAnswers || [])]
    };
    
    setQuestionFormData(prev => ({
      ...prev,
      comprehensionQuestions: updatedQuestions,
      sentenceQuestions: [{
        questionText: "",
        correctAnswer: "",
        acceptableAnswers: []
      }],
      currentComprehensionIndex: -1
    }));
  };

  const deleteComprehensionQuestion = (index) => {
    const updatedQuestions = questionFormData.comprehensionQuestions.filter((_, i) => i !== index);
    setQuestionFormData(prev => ({
      ...prev,
      comprehensionQuestions: updatedQuestions,
      currentComprehensionIndex: -1,
      tempComprehensionQuestion: {
        questionText: "",
        correctAnswer: "",
        acceptableAnswers: []
      }
    }));
  };

  const cancelComprehensionEdit = () => {
    setQuestionFormData(prev => ({
      ...prev,
      currentComprehensionIndex: -1,
      tempComprehensionQuestion: {
        questionText: "",
        correctAnswer: "",
        acceptableAnswers: []
      }
    }));
  };

  const addAcceptableAnswer = (answer) => {
    // Allow adding empty answers for user to fill in
    const trimmedAnswer = answer.trim();
    if (!questionFormData.sentenceQuestions[0]?.acceptableAnswers?.includes(trimmedAnswer)) {
      setQuestionFormData(prev => ({
        ...prev,
        sentenceQuestions: [{
          ...prev.sentenceQuestions[0],
          acceptableAnswers: [...(prev.sentenceQuestions[0]?.acceptableAnswers || []), trimmedAnswer]
        }]
      }));
    }
  };

  const removeAcceptableAnswer = (index) => {
    setQuestionFormData(prev => ({
      ...prev,
      sentenceQuestions: [{
        ...prev.sentenceQuestions[0],
        acceptableAnswers: (prev.sentenceQuestions[0]?.acceptableAnswers || []).filter((_, i) => i !== index)
      }]
    }));
  };

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

    // Add debug logging
    console.log("Loading assessment for editing:", assessment);

    // Check if any questions are missing questionValue
    const missingValues = assessment.questions.filter(q => q.questionValue === undefined || q.questionValue === null);
    if (missingValues.length > 0) {
      console.warn("Warning: Found questions with missing questionValue", missingValues);
    }

    // Create a fixed copy of the questions with questionValue guaranteed
    const fixedQuestions = assessment.questions.map(q => ({
      ...q,
      questionValue: q.questionValue !== undefined ? q.questionValue : (q.questionType === "sentence" ? "" : null)
    }));

    setFormData({
      readingLevel: assessment.readingLevel,
      category: assessment.category,
      questions: fixedQuestions,
      isActive: assessment.isActive,
      status: assessment.status
    });
    setShowModal(true);
  };

  const handlePreviewAssessment = (assessment) => {
    setModalType("preview");
    setSelectedAssessment(assessment);
    setPreviewPages({}); // Reset all page tracking
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
    console.log('🔧 [DEBUG] handleFormChange called - name:', name, 'value:', value);

    setFormData(prev => {
      const newFormData = {
        ...prev,
        [name]: value
      };
      console.log('🔧 [DEBUG] handleFormChange - new formData:', newFormData);
      return newFormData;
    });

    // When both readingLevel and category are set, check for existing assessments
    if (modalType === 'create' && name === 'category' && formData.readingLevel) {
      // We need to use the current value for category since it's what just changed
      const validation = canCreateAssessment(formData.readingLevel, value);
      if (!validation.canCreate) {
        toast.warning(`An assessment already exists for ${formData.readingLevel} - ${value}. Only one assessment per combination is allowed.`, {
          position: "top-center",
          autoClose: 5000,
          hideProgressBar: false,
          closeOnClick: true,
          pauseOnHover: true,
          draggable: true,
        });

        // Show a more prominent message about the existing assessment
        const existingAssessment = validation.existingAssessment;
        if (existingAssessment) {
          const message = `
            An assessment already exists for this combination with ${existingAssessment.questions.length} questions.
            ${existingAssessment.isActive ? 'This assessment is currently active.' : 'This assessment is currently inactive.'}
            Please edit the existing assessment instead.
          `;

          setTimeout(() => {
            // Add a slight delay so this appears after the first toast
            toast.error(message, {
              position: "top-center",
              autoClose: 8000,
              hideProgressBar: false,
              closeOnClick: true,
              pauseOnHover: true,
              draggable: true,
            });
          }, 500);
        }
      }
    } else if (modalType === 'create' && name === 'readingLevel' && formData.category) {
      // We need to use the current value for reading level since it's what just changed
      const validation = canCreateAssessment(value, formData.category);
      if (!validation.canCreate) {
        toast.warning(`An assessment already exists for ${value} - ${formData.category}. Only one assessment per combination is allowed.`, {
          position: "top-center",
          autoClose: 5000,
          hideProgressBar: false,
          closeOnClick: true,
          pauseOnHover: true,
          draggable: true,
        });

        // Show a more prominent message about the existing assessment
        const existingAssessment = validation.existingAssessment;
        if (existingAssessment) {
          const message = `
            An assessment already exists for this combination with ${existingAssessment.questions.length} questions.
            ${existingAssessment.isActive ? 'This assessment is currently active.' : 'This assessment is currently inactive.'}
            Please edit the existing assessment instead.
          `;

          setTimeout(() => {
            // Add a slight delay so this appears after the first toast
            toast.error(message, {
              position: "top-center",
              autoClose: 8000,
              hideProgressBar: false,
              closeOnClick: true,
              pauseOnHover: true,
              draggable: true,
            });
          }, 500);
        }
      }
    }
  };

  const handleAddQuestion = () => {
    console.log('🔧 [DEBUG] handleAddQuestion called - formData.category:', formData.category);
    setShowQuestionForm(true);
    setCurrentQuestion(null);
    console.log('🔧 [DEBUG] handleAddQuestion - showQuestionForm set to true');

    const initialQuestionType =
      formData.category === "Alphabet Knowledge" ? "multiple_choice" :
        formData.category === "Phonological Awareness" ? "matching" :
          formData.category === "Decoding" ? "drag_drop" :
            formData.category === "Word Recognition" ? "fill_blank" :
              "text_input";

    // Generate a temporary questionId based on category only for non-sentence types
    const categoryPrefix = getCategoryPrefix(formData.category);
    const questionNumber = String(formData.questions.length + 1).padStart(3, '0');
    const tempQuestionId = `${categoryPrefix}_${questionNumber}`;

    // For text_input questions, we'll use a parent ID to generate child IDs, but not store it on the parent
    const parentId = initialQuestionType === "text_input" ? tempQuestionId : null;

    // Category-specific field initialization with auto-null logic
    const getInitialFieldValues = () => {
      switch (formData.category) {
        case "Alphabet Knowledge":
          return {
            questionValue: "", // Only category that allows questionValue
            questionImage: null // Can have images
          };
        case "Phonological Awareness":
          return {
            questionValue: null, // Always null
            questionImage: null, // Always null
            questionSet: [{
              audioTexts: [],
              matchingOptions: [],
              correctPairs: []
            }]
          };
        case "Decoding":
          return {
            questionValue: null, // Always null
            questionImage: null // Can have images
          };
        case "Word Recognition":
          return {
            questionValue: null, // Always null per user requirement
            questionImage: null // Can have images
          };
        case "Reading Comprehension":
          return {
            questionValue: null, // Always null
            questionImage: null // Always null
          };
        default:
          return {
            questionValue: "",
            questionImage: null
          };
      }
    };

    const initialFields = getInitialFieldValues();

    setQuestionFormData({
      questionText: "",
      questionImage: initialFields.questionImage,
      questionValue: initialFields.questionValue,
      // Add questionId for all question types
      questionId: tempQuestionId,
      // Store parent ID temporarily for generating child IDs
      _parentId: parentId,
      choiceOptions: [
        { optionId: "1", optionText: "", isCorrect: true },
        { optionId: "2", optionText: "", isCorrect: false },
        { optionId: "3", optionText: "", isCorrect: false }
      ],
      // Decoding specific fields
      displaySequence: [],
      blankPosition: null,
      dragElements: [],
      correctSequence: [],
      // Word Recognition specific fields
      displayWord: "",
      blankOptions: [],
      // Reading Comprehension fields
      storyTitle: "",
      passages: initialQuestionType === "text_input" ? [
        { pageNumber: 1, pageText: "", pageImage: null }
      ] : [],
      correctAnswer: initialQuestionType === "text_input" ? "" : [],
      acceptableAnswers: [],
          // Reading Comprehension specific fields for multiple questions
          comprehensionQuestions: [],
          currentComprehensionIndex: -1, // -1 means adding new, >=0 means editing existing
          // Use sentenceQuestions directly to match database structure
          sentenceQuestions: [{
            questionText: "",
            correctAnswer: "",
            acceptableAnswers: []
          }]
    });
  };

  const handleEditQuestion = (question, index) => {
    console.log('🔧 [DEBUG] handleEditQuestion called');
    console.log('=== EDIT QUESTION DEBUG START ===');
    console.log('handleEditQuestion called with:');
    console.log('- question:', JSON.stringify(question, null, 2));
    console.log('- index:', index);
    console.log('- formData.category:', formData.category);
    console.log('- question.passages:', question.passages);
    
    setShowQuestionForm(true);
    setCurrentQuestion(index);
    console.log('🔧 [DEBUG] handleEditQuestion - showQuestionForm set to true, currentQuestion set to:', index);
    
    // Create base question data
    const baseQuestionData = {
      ...question,
      // Ensure questionId exists, if not generate a temporary one
      questionId: question.questionId || (() => {
        const categoryPrefix = getCategoryPrefix(formData.category);
        const questionNumber = String(index + 1).padStart(3, '0');
        return `${categoryPrefix}_${questionNumber}`;
      })()
    };
    
    console.log('baseQuestionData after spread:', JSON.stringify(baseQuestionData, null, 2));
    
    // Ensure Reading Comprehension questions have proper structure
    if (formData.category === "Reading Comprehension") {
      console.log('Processing Reading Comprehension question');
      
      // CRITICAL FIX: Preserve existing storyTitle or provide default
      console.log('🔧 [DEBUG] Original storyTitle:', baseQuestionData.storyTitle);
      baseQuestionData.storyTitle = baseQuestionData.storyTitle || "Untitled Story";
      console.log('🔧 [DEBUG] Preserved/Default storyTitle:', baseQuestionData.storyTitle);

      // Handle the direct question format from the database
      baseQuestionData.questionText = baseQuestionData.questionText || "";
      baseQuestionData.correctAnswer = baseQuestionData.correctAnswer || "";
      baseQuestionData.acceptableAnswers = baseQuestionData.acceptableAnswers || [];
      
      // CRITICAL FIX: ALWAYS ensure Reading Comprehension questions have editable passages
      console.log('🔧 [DEBUG] Original passages data:', baseQuestionData.passages);
      console.log('🔧 [DEBUG] Type of passages:', typeof baseQuestionData.passages);
      console.log('🔧 [DEBUG] Is array?', Array.isArray(baseQuestionData.passages));

      // ALWAYS provide passages for editing - never null or empty!
      if (Array.isArray(baseQuestionData.passages) && baseQuestionData.passages.length > 0) {
        console.log('🔧 [DEBUG] Found existing passages:', baseQuestionData.passages.length);
        // PRESERVE existing passages data - don't overwrite with empty values
        baseQuestionData.passages = baseQuestionData.passages.map((passage, idx) => ({
          pageNumber: passage.pageNumber || idx + 1,
          pageText: passage.pageText || "", // Preserve existing text
          pageImage: passage.pageImage || null // Preserve existing image URLs
        }));
        console.log('🔧 [DEBUG] Preserved passages after mapping:', baseQuestionData.passages);
      } else {
        console.log('🔧 [DEBUG] Creating default passages array for missing/empty/null passages');
        // ALWAYS create at least one page for editing - no more null or empty arrays!
        baseQuestionData.passages = [
          { pageNumber: 1, pageText: "", pageImage: null }
        ];
      }
    }
    
    console.log('Final baseQuestionData:', baseQuestionData);
    
    // For Reading Comprehension, set sentenceQuestions fields
    if (formData.category === "Reading Comprehension") {
      console.log('🔧 [DEBUG] Loading Reading Comprehension data for editing');
      console.log('baseQuestionData.sentenceQuestions:', baseQuestionData.sentenceQuestions);

      // CRITICAL FIX: Properly load existing sentenceQuestions data with acceptableAnswers
      let existingSentenceQuestions = [];

      if (baseQuestionData.sentenceQuestions && Array.isArray(baseQuestionData.sentenceQuestions)) {
        // Load existing sentenceQuestions with their acceptableAnswers
        existingSentenceQuestions = baseQuestionData.sentenceQuestions.map(sq => ({
          questionText: sq.questionText || "",
          correctAnswer: sq.correctAnswer || "",
          acceptableAnswers: Array.isArray(sq.acceptableAnswers) ? sq.acceptableAnswers : []
        }));
        console.log('🔧 [DEBUG] Loaded existing sentenceQuestions:', existingSentenceQuestions);
      } else {
        // Fallback: create single question structure
        existingSentenceQuestions = [{
          questionText: baseQuestionData.questionText || "",
          correctAnswer: baseQuestionData.correctAnswer || "",
          acceptableAnswers: Array.isArray(baseQuestionData.acceptableAnswers) ? baseQuestionData.acceptableAnswers : []
        }];
        console.log('🔧 [DEBUG] Created fallback sentenceQuestions:', existingSentenceQuestions);
      }

      // CRITICAL FIX: For Reading Comprehension editing, load existing questions for display
      const existingComprehensionQuestions = existingSentenceQuestions.map((sq) => ({
        questionText: sq.questionText,
        correctAnswer: sq.correctAnswer,
        acceptableAnswers: sq.acceptableAnswers || []
      }));

      console.log('🔧 [DEBUG] Loading existing comprehension questions for editing:', existingComprehensionQuestions);

      setQuestionFormData({
        ...baseQuestionData,
        // Use properly loaded sentenceQuestions to preserve acceptableAnswers
        sentenceQuestions: existingSentenceQuestions,
        // LOAD existing questions for editing instead of empty array
        comprehensionQuestions: existingComprehensionQuestions,
        currentComprehensionIndex: -1 // Start in "view all questions" mode
      });
    } else {
      setQuestionFormData(baseQuestionData);
    }
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
        { optionId: (prev.choiceOptions.length + 1).toString(), optionText: "", isCorrect: false }
      ]
    }));
  };

  const handleRemoveChoice = (index) => {
    setQuestionFormData(prev => ({
      ...prev,
      choiceOptions: prev.choiceOptions.filter((_, i) => i !== index)
    }));
  };


  const handleQuestionFormSubmit = async (e) => {
    e.preventDefault();

    // Validate required fields
    if (!questionFormData.questionText) {
      toast.error("Please enter a question text.");
      return;
    }

    // Category-specific validation
    const category = formData.category;

    // Alphabet Knowledge validation
    if (category === "Alphabet Knowledge") {
      if (questionFormData.choiceOptions.length < 2) {
        toast.error("Please add at least two choices for the question.");
        return;
      }

      const emptyOptions = questionFormData.choiceOptions.filter(c => !c.optionText);
      if (emptyOptions.length > 0) {
        toast.error("All answer choices must have text.");
        return;
      }

      if (!questionFormData.choiceOptions.some(c => c.isCorrect)) {
        toast.error("Please mark at least one choice as correct.");
        return;
      }
    }

    // Phonological Awareness validation
    if (category === "Phonological Awareness") {
      if (questionFormData.questionValue !== null) {
        toast.error("Question value should be null for Phonological Awareness.");
        return;
      }

      if (questionFormData.questionImage !== null) {
        toast.error("Question image should be null for Phonological Awareness.");
        return;
      }

      // Validate questionSet structure
      if (!questionFormData.questionSet || !questionFormData.questionSet[0]) {
        toast.error("Audio matching configuration is required for Phonological Awareness.");
        return;
      }

      const questionSet = questionFormData.questionSet[0];
      if (!questionSet.audioTexts || questionSet.audioTexts.length === 0) {
        toast.error("At least one audio text is required.");
        return;
      }

      if (!questionSet.matchingOptions || questionSet.matchingOptions.length === 0) {
        toast.error("At least one matching option is required.");
        return;
      }

      if (questionSet.audioTexts.length !== questionSet.matchingOptions.length) {
        toast.error("Number of audio texts must match the number of visual options.");
        return;
      }
    }

    // Decoding validation
    if (category === "Decoding") {
      // For "Buoin ang salita" (Word Completion), displaySequence is required
      // For "Tukuyin ang nasa larawan" (Word Identification), displaySequence should be null
      if (questionFormData.questionText === "Buoin ang salita") {
        if (!questionFormData.displaySequence || questionFormData.displaySequence.length === 0) {
          toast.error("Please enter the display sequence for the word completion question.");
          return;
        }
      }

      if (!questionFormData.dragElements || questionFormData.dragElements.length === 0) {
        toast.error("Please enter the available drag elements.");
        return;
      }

      if (!questionFormData.correctSequence || questionFormData.correctSequence.length === 0) {
        toast.error("Please enter the correct sequence.");
        return;
      }

      if (questionFormData.questionText === "Buoin ang salita" &&
        (questionFormData.blankPosition === null || questionFormData.blankPosition === undefined)) {
        toast.error("Please specify the blank position for fill-in questions.");
        return;
      }

      if (questionFormData.questionValue !== null) {
        toast.error("Question value should be null for Decoding.");
        return;
      }
    }

    // Word Recognition validation
    if (category === "Word Recognition") {
      if (!questionFormData.displayWord) {
        toast.error("Please enter the display word/sentence for the question.");
        return;
      }

      if (!questionFormData.blankOptions || questionFormData.blankOptions.length === 0) {
        toast.error("Please add answer options for the word recognition question.");
        return;
      }

      if (!questionFormData.correctAnswer || questionFormData.correctAnswer.length === 0) {
        toast.error("Please specify the correct answer(s).");
        return;
      }

      if (questionFormData.questionValue !== null) {
        toast.error("Question value should be null for Word Recognition.");
        return;
      }
    }

    // Reading Comprehension validation  
    if (category === "Reading Comprehension") {
      // Check story title
      if (!questionFormData.storyTitle || !questionFormData.storyTitle.trim()) {
        toast.error("Please enter a story title.");
        return;
      }

      // Check question content
      if (!questionFormData.questionText || !questionFormData.questionText.trim()) {
        toast.error("Please enter a question text.");
        return;
      }
      
      // For Reading Comprehension, check sentenceQuestions fields
      if (!questionFormData.sentenceQuestions[0]?.questionText || !questionFormData.sentenceQuestions[0].questionText.trim()) {
        toast.error("Please enter a question text.");
        return;
      }
      if (!questionFormData.sentenceQuestions[0]?.correctAnswer || !questionFormData.sentenceQuestions[0].correctAnswer.trim()) {
        toast.error("Please enter a correct answer.");
        return;
      }

      // For new stories (no existing passages), require passage content
      if (!hasExistingPassages(questionFormData.storyTitle)) {
        if (!questionFormData.passages || questionFormData.passages.length === 0) {
          toast.error("Please add at least one passage page for this new story.");
          return;
        }

        // Check if passages have text
        const emptyPassages = questionFormData.passages.filter(p => !p.pageText || !p.pageText.trim());
        if (emptyPassages.length > 0) {
          toast.error("All passage pages must have text content.");
          return;
        }
      }
    }

    try {
      console.log('=== Starting handleQuestionFormSubmit ===');
      console.log('questionFormData:', questionFormData);
      console.log('formData.category:', formData.category);
      
      let finalQuestionData = { ...questionFormData };
      
      console.log('Processing individual question data');

      // Category-specific data sanitization
      const sanitizeQuestionData = (data, category) => {
        console.log('=== Starting sanitization for category:', category);
        console.log('Data before sanitization:', data);
        const sanitized = { ...data };

        switch (category) {
          case "Alphabet Knowledge":
            // Keep only fields relevant to Alphabet Knowledge
            sanitized.choiceOptions = sanitized.choiceOptions || [];
            
            // Alphabet Knowledge - no subtype needed
            
            // Validate choiceOptions - backend requires exactly 3 options with one correct
            if (sanitized.choiceOptions.length !== 3) {
              console.warn('Alphabet Knowledge: choiceOptions must have exactly 3 options');
            }
            if (!sanitized.choiceOptions.some(opt => opt.isCorrect)) {
              console.warn('Alphabet Knowledge: at least one choiceOption must be correct');
            }
            
            // Remove fields not used by Alphabet Knowledge
            delete sanitized.displaySequence;
            delete sanitized.blankPosition;
            delete sanitized.dragElements;
            delete sanitized.correctSequence;
            delete sanitized.displayWord;
            delete sanitized.blankOptions;
            delete sanitized.correctAnswer;
            delete sanitized.passages;
            delete sanitized.sentenceQuestions;
            delete sanitized.storyTitle;
            delete sanitized.acceptableAnswers;
            delete sanitized.questionSet;
            break;

          case "Phonological Awareness":
            // Auto-null required fields
            sanitized.questionValue = null;
            sanitized.questionImage = null;

            // Generate correctPairs from audioTexts and matchingOptions
            if (sanitized.questionSet && sanitized.questionSet[0]) {
              const questionSet = sanitized.questionSet[0];
              if (questionSet.audioTexts && questionSet.matchingOptions) {
                questionSet.correctPairs = questionSet.audioTexts.map((audio, index) => ({
                  [audio]: questionSet.matchingOptions[index]
                }));
              }
            }

            // Remove fields not used by Phonological Awareness
            delete sanitized.choiceOptions;
            delete sanitized.displaySequence;
            delete sanitized.blankPosition;
            delete sanitized.dragElements;
            delete sanitized.correctSequence;
            delete sanitized.displayWord;
            delete sanitized.blankOptions;
            delete sanitized.correctAnswer;
            delete sanitized.passages;
            delete sanitized.sentenceQuestions;
            delete sanitized.storyTitle;
            delete sanitized.acceptableAnswers;
            break;

          case "Decoding":
            // Auto-null required fields
            sanitized.questionValue = null;
            // Ensure arrays exist
            sanitized.displaySequence = sanitized.displaySequence || [];
            sanitized.dragElements = sanitized.dragElements || [];
            sanitized.correctSequence = sanitized.correctSequence || [];
            // Set blankPosition based on question text
            if (sanitized.questionText !== "Buoin ang salita") {
              sanitized.blankPosition = null;
            }
            // Remove fields not used by Decoding
            delete sanitized.choiceOptions;
            delete sanitized.displayWord;
            delete sanitized.blankOptions;
            delete sanitized.correctAnswer;
            delete sanitized.passages;
            delete sanitized.sentenceQuestions;
            delete sanitized.storyTitle;
            delete sanitized.acceptableAnswers;
            delete sanitized.questionSet;
            break;

          case "Word Recognition":
            // Auto-null required fields
            sanitized.questionValue = null;
            // Ensure arrays exist
            sanitized.blankOptions = sanitized.blankOptions || [];
            sanitized.correctAnswer = sanitized.correctAnswer || [];
            // Normalize displayWord formatting - convert __word__ to ___ for database storage
            if (sanitized.displayWord) {
              sanitized.displayWord = sanitized.displayWord
                .replace(/__([^_]+)__/g, ' ___ ') // Convert __word__ to simple ___
                .replace(/\s+/g, ' ') // Normalize multiple spaces to single spaces
                .trim(); // Remove leading/trailing spaces
            }
            // Remove fields not used by Word Recognition
            delete sanitized.choiceOptions;
            delete sanitized.displaySequence;
            delete sanitized.blankPosition;
            delete sanitized.dragElements;
            delete sanitized.correctSequence;
            delete sanitized.passages;
            delete sanitized.sentenceQuestions;
            delete sanitized.storyTitle;
            delete sanitized.acceptableAnswers;
            delete sanitized.questionSet;
            break;

          case "Reading Comprehension":
            // Auto-null required fields
            sanitized.questionValue = null;
            sanitized.questionImage = null;
            
          // For Reading Comprehension, we need to create the proper structure
          // sentenceQuestions is the ACTUAL database field that gets saved
          // Ensure sentenceQuestions exists and has valid data
          if (!sanitized.sentenceQuestions || sanitized.sentenceQuestions.length === 0) {
            // Fallback: create sentenceQuestions from main question fields
            sanitized.sentenceQuestions = [{
              questionText: sanitized.questionText || "",
              correctAnswer: sanitized.correctAnswer || "",
              acceptableAnswers: sanitized.acceptableAnswers || []
            }];
          }
          
          // Remove tempComprehensionQuestion as it's not needed in the database
          delete sanitized.tempComprehensionQuestion;
            
            // Clean and normalize acceptableAnswers array in sentenceQuestions
            if (sanitized.sentenceQuestions && sanitized.sentenceQuestions.length > 0) {
              sanitized.sentenceQuestions.forEach(sq => {
                if (sq.acceptableAnswers) {
                  sq.acceptableAnswers = sq.acceptableAnswers
                    .map(answer => answer ? answer.toString().trim() : '')
                    .filter(answer => answer.length > 0);
                  
                  // Ensure primary answer is included in acceptableAnswers if not already present
                  if (sq.correctAnswer && !sq.acceptableAnswers.includes(sq.correctAnswer)) {
                    sq.acceptableAnswers.unshift(sq.correctAnswer);
                  }
                  
                  // If no acceptable answers provided, use the correct answer
                  if (sq.acceptableAnswers.length === 0 && sq.correctAnswer) {
                    sq.acceptableAnswers = [sq.correctAnswer];
                  }
                }
              });
            }
            
            sanitized.storyTitle = sanitized.storyTitle || "";
            
            // Smart passages handling: preserve passages data when editing
            if (sanitized.storyTitle && hasExistingPassages(sanitized.storyTitle)) {
              // If this story already has passages in the database, check if we're editing
              // If we have passages data in the form (meaning we're editing), preserve it
              if (sanitized.passages && Array.isArray(sanitized.passages) && sanitized.passages.length > 0) {
                // We're editing and have passages data - preserve it
                sanitized.passages = sanitized.passages.filter(p => p.pageText && p.pageText.trim());
              } else {
                // No passages data in form - set to null to reference existing story
                sanitized.passages = null;
              }
            } else {
              // This is a new story or the first question for this story
              sanitized.passages = sanitized.passages || [];
              // Filter out empty passages
              if (sanitized.passages) {
                sanitized.passages = sanitized.passages.filter(p => p.pageText && p.pageText.trim());
              }
            }
            
            // Remove fields not used by Reading Comprehension
            delete sanitized.choiceOptions;
            delete sanitized.displaySequence;
            delete sanitized.blankPosition;
            delete sanitized.dragElements;
            delete sanitized.correctSequence;
            delete sanitized.displayWord;
            delete sanitized.blankOptions;
            delete sanitized.comprehensionQuestions;
            delete sanitized.currentComprehensionIndex;
            
            // Remove main question fields as they're now in sentenceQuestions
            delete sanitized.questionText;
            delete sanitized.correctAnswer;
            delete sanitized.acceptableAnswers;
            break;

          default:
            break;
        }

        // Remove temporary frontend fields
        delete sanitized.imageFile;
        delete sanitized.imageName;
        delete sanitized._parentId;
        
        // Remove fields that should only exist at document level, not in individual questions
        delete sanitized.category; // Category should only be at document level
        
        // Remove Reading Comprehension specific fields from non-Reading Comprehension categories
        if (category !== "Reading Comprehension") {
          delete sanitized.storyTitle;
          delete sanitized.acceptableAnswers;
          delete sanitized.passages;
          delete sanitized.comprehensionQuestions;
          delete sanitized.currentComprehensionIndex;
          delete sanitized.tempComprehensionQuestion;
        }

        console.log('Data after sanitization:', sanitized);
        return sanitized;
      };

      // Apply sanitization
      console.log('Applying sanitization...');
      finalQuestionData = sanitizeQuestionData(finalQuestionData, formData.category);
      console.log('Sanitization completed, finalQuestionData:', finalQuestionData);

      // No additional processing needed for sentenceQuestions

      // Construct S3 path with category folder using existing helper
      const categoryFolderMap = {
        'Alphabet Knowledge': 'alphabet-knowledge',
        'Phonological Awareness': 'phonological-awareness',
        'Decoding': 'decoding',
        'Word Recognition': 'word-recognition',
        'Reading Comprehension': 'reading-comprehension'
      };
      const categoryFolder = categoryFolderMap[formData.category] || '';
      const s3Path = categoryFolder ? `main-assessment/${categoryFolder}` : 'main-assessment';

      // If there's an image file pending upload, upload it to S3 first
      if (questionFormData.imageFile) {
        try {
          console.log('Starting image upload for file:', questionFormData.imageFile.name);
          const result = await MainAssessmentService.uploadImageToS3(questionFormData.imageFile, s3Path);
          console.log('Upload result:', result);

          if (result && result.success && result.url) {
            finalQuestionData.questionImage = result.url;
            console.log('Successfully uploaded image, S3 URL:', result.url);
          } else {
            console.error('Upload failed:', result);
            const uploadError = new Error(result?.error || "Failed to upload image to S3");
            uploadError.userNotified = true;
            toast.error(result?.error || "Failed to upload image to S3");
            throw uploadError;
          }
        } catch (error) {
          console.error('Error during image upload:', error);
          if (!error.userNotified) {
            toast.error("Error uploading image. Please try again.");
            error.userNotified = true;
          }
          throw error;
        }

        // Remove temporary fields used for handling the upload
        delete finalQuestionData.imageFile;
        delete finalQuestionData.imageName;
      }

      // If we have passage pages with images, handle those uploads as well
      if (formData.category === "Reading Comprehension" && finalQuestionData.passages) {
        const updatedPassages = [];

        for (const passage of finalQuestionData.passages) {
          let updatedPassage = { ...passage };

          // Check if this passage has a blob URL that needs uploading
          if (passage.pageImage && typeof passage.pageImage === 'string' && passage.pageImage.startsWith('blob:')) {
            try {
              // Convert blob URL back to File object
              const response = await fetch(passage.pageImage);
              const blob = await response.blob();
              const fileName = `page_${passage.pageNumber}_${Date.now()}.jpg`;
              const imageFile = new File([blob], fileName, { type: blob.type || 'image/jpeg' });

              // Upload to S3
              const uploadResult = await MainAssessmentService.uploadImageToS3(imageFile, s3Path);

              if (uploadResult.success) {
                updatedPassage.pageImage = uploadResult.url;
                console.log(`Successfully uploaded page ${passage.pageNumber} image:`, uploadResult.url);
              } else {
                console.error(`Failed to upload image for page ${passage.pageNumber}:`, uploadResult.error);
                const passageError = new Error(`Failed to upload image for page ${passage.pageNumber}`);
                passageError.userNotified = true;
                toast.error(`Failed to upload image for page ${passage.pageNumber}`);
                throw passageError;
              }
            } catch (error) {
              console.error(`Error processing image for page ${passage.pageNumber}:`, error);
              if (!error.userNotified) {
                toast.error(`Error processing image for page ${passage.pageNumber}`);
                error.userNotified = true;
              }
              throw error;
            }
          }
          // If it's already a proper URL (starts with https://), keep it as is
          else if (passage.pageImage && typeof passage.pageImage === 'string' && passage.pageImage.startsWith('https://')) {
            updatedPassage.pageImage = passage.pageImage;
          }
          // If it's null or empty, keep it as is
          else {
            updatedPassage.pageImage = passage.pageImage;
          }

          updatedPassages.push(updatedPassage);
        }

        finalQuestionData.passages = updatedPassages;
      }

      // Ensure questionId exists
      if (!finalQuestionData.questionId) {
        const categoryPrefix = getCategoryPrefix(formData.category);
        const questionNumber = String(currentQuestion !== null ? currentQuestion + 1 : formData.questions.length + 1).padStart(3, '0');
        finalQuestionData.questionId = `${categoryPrefix}_${questionNumber}`;
      }

      // Final check - ensure no base64 data URLs remain in questionImage
      if (finalQuestionData.questionImage && 
          typeof finalQuestionData.questionImage === 'string' && 
          finalQuestionData.questionImage.startsWith('data:')) {
        console.error('Base64 data URL still present in questionImage, this should not happen');
        toast.error("Image upload incomplete. Please remove and re-add the image.");
        return;
      }

      // Update the form data with the final question data
      console.log('=== Starting form data update ===');
      
      // Critical operation: Save question to form data
      try {
        if (currentQuestion !== null) {
          console.log('Updating existing question at index:', currentQuestion);
          setFormData(prev => {
            const updatedQuestions = [...prev.questions];
            // Ensure questionValue is at least null if it's empty string or undefined
            finalQuestionData.questionValue = finalQuestionData.questionValue || null;
            updatedQuestions[currentQuestion] = finalQuestionData;
            console.log('Updated questions array:', updatedQuestions);
            return {
              ...prev,
              questions: updatedQuestions
            };
          });

          console.log('Question update completed successfully');
          
          // For Reading Comprehension, update the form data and close the question form
          if (formData.category === "Reading Comprehension") {
            // Update the form data with the updated question to preserve passages
            console.log('Updating form data with updated Reading Comprehension question');
            setFormData(prev => ({
              ...prev,
              questions: prev.questions.map((q, index) => 
                index === currentQuestion ? finalQuestionData : q
              )
            }));
            
            // Close the question form and return to the main assessment modal
            console.log('Closing question form and returning to assessment modal for Reading Comprehension');
            setShowQuestionForm(false);
            setCurrentQuestion(null);
            toast.success("Question updated successfully!");
            return; // Exit early to return to assessment modal
          } else {
            // For other categories, reset for a new question
            setCurrentQuestion(null);
            
            // Generate temporary questionId for the next question
            const nextQuestionNumber = String(formData.questions.length + 2).padStart(3, '0'); // +2 because we just added one
            const nextTempQuestionId = `${getCategoryPrefix(formData.category)}_${nextQuestionNumber}`;
            const nextParentId = formData.category === "Reading Comprehension" ? nextTempQuestionId : null;

            setQuestionFormData({
          questionType: categoryToQuestionTypeMap[formData.category],
          questionText: "",
          questionImage: null,
          // Ensure it has a default value
          questionValue: formData.category === "Reading Comprehension" ? "" : null,
          // Include questionId for all question types
          questionId: nextTempQuestionId,
          // Store parent ID temporarily for generating child IDs
          _parentId: nextParentId,
          choiceOptions: formData.category === "Alphabet Knowledge" ? [
            { optionId: "1", optionText: "", isCorrect: true },
            { optionId: "2", optionText: "", isCorrect: false },
            { optionId: "3", optionText: "", isCorrect: false }
          ] : [],
          passages: formData.category === "Reading Comprehension" ? [
            { pageNumber: 1, pageText: "", pageImage: null }
          ] : [],
          sentenceQuestions: formData.category === "Reading Comprehension" ? [
            {
              questionText: "",
              correctAnswer: "",
              // CRITICAL FIX: Use acceptableAnswers array instead of wrong field names
              acceptableAnswers: []
              // REMOVED: questionId - Reading Comprehension sentenceQuestions should not have questionId
            }
          ] : [],
          // Question added successfully
          comprehensionQuestions: [],
          currentComprehensionIndex: -1, // -1 means adding new, >=0 means editing existing
          // Use sentenceQuestions directly to match database structure
          sentenceQuestions: [{
            questionText: "",
            correctAnswer: "",
            acceptableAnswers: []
          }]
        });

        toast.success("Question updated! You can add another or click Back to return to the assessment.");
            } // Close the else block for non-Reading Comprehension categories
        } else {
        // Ensure questionValue is at least null if it's empty string or undefined
        finalQuestionData.questionValue = finalQuestionData.questionValue || null;

        console.log('Adding new question to form data:', finalQuestionData);
        setFormData(prev => ({
          ...prev,
          questions: [...prev.questions, finalQuestionData]
        }));

        // Reset for a new question and keep the form open
        // Generate temporary questionId for the next question
        const nextQuestionNumber = String(formData.questions.length + 2).padStart(3, '0'); // +2 because we just added one
        const nextTempQuestionId = `${getCategoryPrefix(formData.category)}_${nextQuestionNumber}`;
        const nextParentId = formData.category === "Reading Comprehension" ? nextTempQuestionId : null;

        setQuestionFormData({
          questionType: categoryToQuestionTypeMap[formData.category],
          questionText: "",
          questionImage: null,
          // Ensure it has a default value
          questionValue: formData.category === "Reading Comprehension" ? "" : null,
          // Include questionId for all question types
          questionId: nextTempQuestionId,
          // Store parent ID temporarily for generating child IDs
          _parentId: nextParentId,
          choiceOptions: formData.category === "Alphabet Knowledge" ? [
            { optionId: "1", optionText: "", isCorrect: true },
            { optionId: "2", optionText: "", isCorrect: false },
            { optionId: "3", optionText: "", isCorrect: false }
          ] : [],
          passages: formData.category === "Reading Comprehension" ? [
            { pageNumber: 1, pageText: "", pageImage: null }
          ] : [],
          sentenceQuestions: formData.category === "Reading Comprehension" ? [
            {
              questionText: "",
              correctAnswer: "",
              // CRITICAL FIX: Use acceptableAnswers array instead of wrong field names
              acceptableAnswers: []
              // REMOVED: questionId - Reading Comprehension sentenceQuestions should not have questionId
            }
          ] : [],
          // Question added successfully
          comprehensionQuestions: [],
          currentComprehensionIndex: -1, // -1 means adding new, >=0 means editing existing
          // Use sentenceQuestions directly to match database structure
          sentenceQuestions: [{
            questionText: "",
            correctAnswer: "",
            acceptableAnswers: []
          }]
        });

        console.log('Question successfully added to form! Total questions now:', formData.questions.length + 1);
        toast.success("Question added! You can add another or click Back to return to the assessment.");
        }
      
      } catch (saveError) {
        // Critical save operation failed
        console.error('Critical save operation failed:', saveError);
        throw saveError; // Re-throw to be caught by main catch block
      }
      
    } catch (error) {
      console.error("Error saving question:", error);
      
      // Provide more specific error messages based on the error type
      let errorMessage = "Failed to save question. Please try again.";
      
      if (error?.response?.status === 413) {
        errorMessage = "File too large. Please use a smaller image.";
      } else if (error?.response?.status === 400) {
        errorMessage = "Invalid question data. Please check all required fields.";
      } else if (error?.message?.includes('upload') || error?.message?.includes('S3')) {
        errorMessage = "Image upload failed. Please try again.";
      } else if (error?.response?.status === 401 || error?.response?.status === 403) {
        errorMessage = "Authentication error. Please refresh and try again.";
      } else if (error?.name === 'TypeError' || error?.message?.includes('fetch')) {
        errorMessage = "Network error. Please check your connection and try again.";
      } else if (error?.message?.includes('blob')) {
        errorMessage = "Error processing image file. Please try uploading a different image.";
      }
      
      // Only show error toast if no specific error has already been shown
      if (!error?.userNotified) {
        console.error('Final error details:', {
          message: error.message,
          stack: error.stack,
          name: error.name,
          cause: error.cause
        });
        toast.error(errorMessage);
      }
    }
  };

  const handleFileUpload = (e, field) => {
    const file = e.target.files[0];
    if (!file) return;

    // Validate the file
    const validation = validateFileForUpload(file);
    if (!validation.success) {
      toast.error(validation.error);
      return;
    }

    // Create a temporary URL for preview
    const previewUrl = URL.createObjectURL(file);

    // Store the file for later upload when the question is submitted
    if (field === 'questionImage') {
      setQuestionFormData(prev => ({
        ...prev,
        questionImage: previewUrl,
        imageFile: file, // Store the file for later S3 upload with proper category folder
        imageName: file.name
      }));
    } else if (field.includes('pageImage')) {
      const pageIndex = parseInt(field.split('-')[1]);
      setQuestionFormData(prev => {
        const updatedPassages = [...prev.passages];
        updatedPassages[pageIndex] = {
          ...updatedPassages[pageIndex],
          pageImage: previewUrl, // Store blob URL for preview
          _imageFile: file, // Store the actual file for later upload
          _imageName: file.name
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
    if (!formData.readingLevel || !formData.category) {
      alert("Please fill in all required fields.");
      return;
    }

    // Special validation for Reading Comprehension
    if (formData.category === "Reading Comprehension") {
      // Check if we have questions in the main questions array (for existing assessments)
      // or in questionFormData (for new questions being added)
      const hasExistingQuestions = formData.questions && formData.questions.length > 0;
      const hasNewQuestion = questionFormData.sentenceQuestions && 
                            questionFormData.sentenceQuestions.length > 0 && 
                            questionFormData.sentenceQuestions[0]?.questionText && 
                            questionFormData.sentenceQuestions[0].questionText.trim();
      const hasComprehensionQuestions = questionFormData.comprehensionQuestions && 
                                       questionFormData.comprehensionQuestions.length > 0;
      
      if (!hasExistingQuestions && !hasNewQuestion && !hasComprehensionQuestions) {
        alert("Please add at least one comprehension question for the story.");
        return;
      }
      
      // Check story title - use the first question's story title if available
      const storyTitle = formData.questions.length > 0 ? 
                        formData.questions[0].storyTitle : 
                        questionFormData.storyTitle;
      
      if (!storyTitle || !storyTitle.trim()) {
        alert("Please enter a story title.");
        return;
      }
    } else {
      // For other categories, check regular questions array
      if (formData.questions.length === 0) {
        alert("Please add at least one question.");
        return;
      }
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

      // Construct S3 path with category folder
      const categoryFolder = getCategoryFolder(modalType === 'edit' ? selectedAssessment.category : formData.category);
      const s3Path = categoryFolder ? `main-assessment/${categoryFolder}` : 'main-assessment';

      // Ensure each question has proper format
      const formattedQuestions = formData.questions.map((question, index) => {
        // Ensure questionId exists and follows the correct format for non-sentence types
        let questionId = question.questionId;
        if (modalType === 'edit' && selectedAssessment) {
          // When editing, make sure the questionId follows the correct format
          const categoryPrefix = getCategoryPrefix(selectedAssessment.category);
          const questionNumber = String(index + 1).padStart(3, '0');

          // Set questionId for all question types
          questionId = `${categoryPrefix}_${questionNumber}`;
        }

        // Handle sentence type questions that might be missing required arrays
        const isSentenceType = formData.category === 'Reading Comprehension';

        // IMPORTANT: Ensure questionValue is always present and non-null for ALL question types
        // For sentence type questions, use a default empty string if missing
        const questionValue = isSentenceType
          ? (question.questionValue || "")
          : (question.questionValue || null);

        // Prepare sentenceQuestions with proper field names for backend
        let formattedSentenceQuestions;
        if (isSentenceType && question.sentenceQuestions) {
          formattedSentenceQuestions = question.sentenceQuestions.map((sq) => {
            // CRITICAL FIX: Preserve acceptableAnswers structure for Reading Comprehension
            console.log('🔧 [DEBUG] Formatting sentenceQuestion - original sq:', sq);

            return {
              questionText: sq.questionText,
              correctAnswer: sq.correctAnswer,
              // PRESERVE acceptableAnswers array instead of wrong field names
              acceptableAnswers: Array.isArray(sq.acceptableAnswers) ? sq.acceptableAnswers : [],
              questionImage: sq.questionImage || null
              // REMOVED: questionId generation - Reading Comprehension sentenceQuestions should not have questionId
            };
          });
        }

        // DEBUGGING: Log the question data before formatting
        if (isSentenceType) {
          console.log('🔧 [DEBUG] Formatting Reading Comprehension question for save:');
          console.log('- Original question.passages:', question.passages);
          console.log('- Type of passages:', typeof question.passages);
          console.log('- Is array?', Array.isArray(question.passages));
          console.log('- Length?', question.passages?.length);
        }

        // CRITICAL FIX: NEVER allow null or empty passages for Reading Comprehension
        const formattedPassages = isSentenceType ? (
          Array.isArray(question.passages) && question.passages.length > 0
            ? question.passages // Use actual passages if they exist
            : [{ pageNumber: 1, pageText: "", pageImage: null }] // ALWAYS provide at least one page
        ) : undefined;

        if (isSentenceType) {
          console.log('🔧 [DEBUG] Formatted passages result (NEVER null or empty):', formattedPassages);
        }

        return {
          ...question,
          // Include questionId for all question types
          questionId,
          // Set questionValue directly
          questionValue: isSentenceType ? null : questionValue,
          // CRITICAL FIX: Preserve passages data correctly - null means reference existing story
          passages: formattedPassages,
          // Ensure sentenceQuestions exist for sentence type
          sentenceQuestions: isSentenceType ? formattedSentenceQuestions : undefined,
          // Ensure choiceOptions only exist for Alphabet Knowledge
          choiceOptions: formData.category === 'Alphabet Knowledge' ?
            (question.choiceOptions ? question.choiceOptions.map((option, optIndex) => ({
              ...option,
              optionId: option.optionId || (optIndex + 1).toString()
            })) : [
              // Default choices if none exist
              { optionId: "1", optionText: "Choice 1", isCorrect: true },
              { optionId: "2", optionText: "Choice 2", isCorrect: false },
              { optionId: "3", optionText: "Choice 3", isCorrect: false }
            ]) : undefined
        };
      });

      // Final processing - explicitly remove questionId from sentence questions
      const finalQuestions = formattedQuestions;

      let response;

      if (modalType === 'edit' && selectedAssessment) {
        // Update existing assessment - don't include readingLevel and category in the update
        // as the backend doesn't allow these to be changed
        const updateData = {
          questions: finalQuestions, // Use finalQuestions instead of formattedQuestions
          isActive: formData.isActive,
          status: formData.status
        };

        // Update existing assessment
        response = await MainAssessmentService.updateAssessment(selectedAssessment._id, updateData);
      } else {
        // Create new assessment - include all fields
        // Get the questionType based on category (using global mapping)

        // Special handling for Reading Comprehension
        if (formData.category === "Reading Comprehension") {
          // For Reading Comprehension, create a single assessment with all questions
          const storyTitle = questionFormData.storyTitle;
          const passages = questionFormData.passages;
          
          // Build sentenceQuestions array from form data
          let sentenceQuestions = [];
          
          // Check if we have multiple questions in comprehensionQuestions
          if (questionFormData.comprehensionQuestions && questionFormData.comprehensionQuestions.length > 0) {
            sentenceQuestions = questionFormData.comprehensionQuestions.map((q, index) => ({
              questionText: q.questionText,
              correctAnswer: q.correctAnswer,
              acceptableAnswers: q.acceptableAnswers || []
            }));
          } 
          // Check if we have a single question in sentenceQuestions
          else if (questionFormData.sentenceQuestions && questionFormData.sentenceQuestions.length > 0) {
            sentenceQuestions = questionFormData.sentenceQuestions;
          }
          
          if (sentenceQuestions.length === 0) {
            throw new Error("No Reading Comprehension questions to save");
          }
          
          // Create the question data with proper structure
          const questionData = {
            questionId: questionFormData.questionId,
            storyTitle: storyTitle,
            passages: passages,
            sentenceQuestions: sentenceQuestions,
            questionValue: null
          };

          const assessmentData = {
            readingLevel: formData.readingLevel,
            category: formData.category,
            questionType: categoryToQuestionTypeMap[formData.category],
            questions: [questionData],
            isActive: formData.isActive,
            status: formData.status
          };

          console.log("Creating Reading Comprehension assessment:", JSON.stringify(assessmentData, null, 2));
          response = await MainAssessmentService.createAssessment(assessmentData);
        } else {
          // Original logic for other categories
          const assessmentData = {
            readingLevel: formData.readingLevel,
            category: formData.category,
            questionType: categoryToQuestionTypeMap[formData.category],
            questions: finalQuestions.map(question => ({
              ...question,
              category: formData.category // Required by backend model for validation
            })),
            isActive: formData.isActive,
            status: formData.status
          };

          // For debugging - log the data being sent
          console.log("Submitting assessment data:", JSON.stringify(assessmentData, null, 2));

          // Create new assessment
          response = await MainAssessmentService.createAssessment(assessmentData);
        }
      }

      // Check if response indicates success - handle different response formats
      const isSuccess =
        (response && response.success) ||
        (response && response.data && response.data._id);

      if (isSuccess) {
        // Get the assessment data from the response
        const assessmentResponse = response.data || (response.success ? response : null);

        if (modalType === 'edit' && selectedAssessment) {
          // Update local state for edit
          setAssessments(prev =>
            prev.map(a => a._id === selectedAssessment._id ? assessmentResponse : a)
          );
        } else {
          // Add to local state for create
          setAssessments(prev => [...prev, assessmentResponse]);
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
      } else {
        // Handle unsuccessful response
        toast.error("Failed to save assessment. The server did not return a valid response.");
      }
    } catch (error) {
      console.error('Error saving assessment:', error);

      // Show a more detailed error message to help debugging
      let errorMessage = "Failed to save assessment. Please check your inputs and try again.";

      if (error.response) {
        // Server responded with an error status
        if (error.response.data && error.response.data.message) {
          errorMessage = `Error: ${error.response.data.message}`;
        }

        if (error.response.data && error.response.data.error) {
          errorMessage += `\nDetails: ${error.response.data.error}`;
        }

        console.error('Server response error:', error.response.data);
      }

      toast.error(errorMessage);
    }
  };

  const handlePreviewPageChange = (direction, questionIndex) => {
    const currentPage = previewPages[questionIndex] || 0;
    const question = selectedAssessment?.questions?.[questionIndex];
    const totalPages = question?.passages?.length || 0;
    
    if (direction === 'next' && totalPages > currentPage + 1) {
      setPreviewPages(prev => ({
        ...prev,
        [questionIndex]: currentPage + 1
      }));
    } else if (direction === 'prev' && currentPage > 0) {
      setPreviewPages(prev => ({
        ...prev,
        [questionIndex]: currentPage - 1
      }));
    }
  };

  const getQuestionTypeDisplay = (type, subtype) => {
    if (type === "multiple_choice" && subtype) {
      switch (subtype) {
        case "patinig": return "Vowel (Patinig)";
        case "katinig": return "Consonant (Katinig)";
        default: return "Multiple Choice";
      }
    }

    switch (type) {
      case "multiple_choice": return "Multiple Choice";
      case "matching": return "Audio Matching";
      case "drag_drop": return "Drag & Drop";
      case "fill_blank": return "Fill in the Blank";
      case "text_input": return "Reading Comprehension";
      // Legacy support
      case "patinig": return "Vowel (Patinig)";
      case "katinig": return "Consonant (Katinig)";
      case "malapantig": return "Syllable (Malapantig)";
      case "word": return "Word";
      case "sentence": return "Reading Passage";
      default: return type;
    }
  };

  // Helper function to get question type for category
  const getQuestionTypeForCategory = (category) => {
    switch (category) {
      case 'Alphabet Knowledge': return 'multiple_choice';
      case 'Phonological Awareness': return 'matching';
      case 'Decoding': return 'drag_drop';
      case 'Word Recognition': return 'fill_blank';
      case 'Reading Comprehension': return 'text_input';
      default: return '';
    }
  };

  // Helper function to get icon for question type
  const getQuestionTypeIcon = (type) => {
    switch (type) {
      case 'multiple_choice': return faCheckCircle;
      case 'matching': return faArrowRight;
      case 'drag_drop': return faPuzzlePiece;
      case 'fill_blank': return faEdit;
      case 'text_input': return faFileAlt;
      default: return faQuestion;
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

  // Helper function to get category-specific folder for S3 uploads
  const getCategoryFolder = (category) => {
    const folderMap = {
      'Alphabet Knowledge': 'alphabet-knowledge',
      'Phonological Awareness': 'phonological-awareness',
      'Decoding': 'decoding',
      'Word Recognition': 'word-recognition',
      'Reading Comprehension': 'reading-comprehension'
    };
    return folderMap[category] || '';
  };

  console.log('🔧 [DEBUG] Main render - loading:', loading, 'error:', error, 'assessments.length:', assessments.length);

  if (loading) {
    console.log('🔧 [DEBUG] Rendering loading state');
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
    console.log('🔧 [DEBUG] Rendering error state:', error);
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

  // Add styles for the troubleshooting elements
  const styles = {
    troubleshootingList: {
      listStyle: 'disc',
      margin: '0 0 20px 20px',
      color: '#666',
      fontSize: '0.95rem'
    },
    actionButtons: {
      display: 'flex',
      justifyContent: 'center',
      gap: '15px',
      marginTop: '20px'
    },
    retryBtn: {
      backgroundColor: '#f0f0f0',
      color: '#333',
      border: 'none',
      padding: '10px 20px',
      borderRadius: '4px',
      cursor: 'pointer',
      display: 'flex',
      alignItems: 'center',
      gap: '8px',
      boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
      transition: 'all 0.2s ease'
    }
  };

  console.log('🔧 [DEBUG] About to render main component - showModal:', showModal, 'showQuestionForm:', showQuestionForm, 'formData.category:', formData.category);

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
              // Get all assessments for this reading level - use normalized comparison to handle whitespace/case issues
              const levelAssessments = assessments.filter(a => {
                // Normalize both strings for comparison (trim whitespace and ensure case match)
                const normalizedLevel = level.trim();
                const normalizedAssessmentLevel = (a.readingLevel || '').trim();
                return normalizedAssessmentLevel === normalizedLevel;
              });

              // Debug log to see what's happening
              console.log(`Level: ${level}, Assessments found:`, levelAssessments.length);
              console.log(`Assessments for ${level}:`, levelAssessments.map(a => ({ id: a._id, level: a.readingLevel, category: a.category })));

              // Get all unique categories for this reading level
              const levelCategories = [...new Set(levelAssessments.map(a => a.category))].sort();

              return (
                <div className="pa-reading-level-card" key={level}>
                  <div className={`pa-reading-level-header-bar pa-level-${level.toLowerCase().replace(' ', '-')}`}>
                    <div className="pa-reading-level-name">
                      <FontAwesomeIcon icon={faBook} /> {level}
                    </div>
                    <div className="pa-reading-level-count" title={`${levelAssessments.length} assessment(s) for ${level} reading level`}>
                      {levelAssessments.length}
                    </div>
                  </div>
                  <div className="pa-reading-level-body">
                    <div className="pa-category-list">
                      {levelCategories.length > 0 ? (
                        levelCategories.map(category => {
                          // Get all assessments for this category in this reading level
                          const categoryAssessments = levelAssessments.filter(a => a.category === category);

                          // Debug log for this category
                          console.log(`Level: ${level}, Category: ${category}, Assessments:`, categoryAssessments.length);

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
                              <div className="pa-category-count" title={`${categoryAssessments.length} assessment(s) with ${categoryAssessments.reduce((total, a) => total + (a.questions ? a.questions.length : 0), 0)} total questions`}>
                                {categoryAssessments.length}
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
            <div className="paa-step-number">1</div>
            <div className="pa-step-content">
              <h4>Assessment Creation</h4>
              <p>Teachers create targeted assessments based on student reading levels and specific learning objectives.</p>
            </div>
          </div>
          <div className="pa-flow-connector">
            <FontAwesomeIcon icon={faArrowRight} />
          </div>
          <div className="pa-flow-step">
            <div className="paa-step-number">2</div>
            <div className="pa-step-content">
              <h4>Assessment Activation</h4>
              <p>Teachers activate assessments to make them available to students in the mobile application.</p>
            </div>
          </div>
          <div className="pa-flow-connector">
            <FontAwesomeIcon icon={faArrowRight} />
          </div>
          <div className="pa-flow-step">
            <div className="paa-step-number">3</div>
            <div className="pa-step-content">
              <h4>Student Assignment</h4>
              <p>Activated assessments are assigned to students based on their reading level and identified needs.</p>
            </div>
          </div>
          <div className="pa-flow-connector">
            <FontAwesomeIcon icon={faArrowRight} />
          </div>
          <div className="pa-flow-step">
            <div className="paa-step-number">4</div>
            <div className="pa-step-content">
              <h4>Progress Tracking</h4>
              <p>Monitor student performance and advancement through the assessment system in real-time.</p>
            </div>
          </div>
          <div className="pa-flow-connector">
            <FontAwesomeIcon icon={faArrowRight} />
          </div>
          <div className="pa-flow-step">
            <div className="paa-step-number">5</div>
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
                <h3>No Assessment Templates Found</h3>
                <p>This could be due to one of the following reasons:</p>
                <ul className="pa-troubleshooting-list" style={styles.troubleshootingList}>
                  <li>No assessment templates have been created yet</li>
                  <li>The database connection might be unavailable</li>
                  <li>There might be an issue with the server</li>
                </ul>
                <div className="pa-getting-started-tips">
                  <h4><FontAwesomeIcon icon={faInfoCircle} /> Options</h4>
                  <ol>
                    <li>Click "Create New Assessment" to build your first assessment</li>
                    <li>Try refreshing the page</li>
                    <li>Check your internet connection</li>
                    <li>Contact the administrator if the problem persists</li>
                  </ol>
                </div>
                <div className="pa-action-buttons" style={styles.actionButtons}>
                  <button
                    className="pa-retry-btn"
                    style={styles.retryBtn}
                    onClick={() => window.location.reload()}
                  >
                    <FontAwesomeIcon icon={faFilter} /> Refresh Page
                  </button>
                  <button
                    className="pa-create-first"
                    onClick={handleCreateAssessment}
                  >
                    <FontAwesomeIcon icon={faPlus} /> Create Your First Assessment
                  </button>
                </div>
              </>
            )}
          </div>
        ) : (
          <div className="pa-table">
            <div className="pa-header-row">
              <div className="pa-header-cell">
                <FontAwesomeIcon icon={faBook} className="pa-header-icon" />
                Reading Level
              </div>
              <div className="pa-header-cell">
                <FontAwesomeIcon icon={faLayerGroup} className="pa-header-icon" />
                Category
              </div>
              <div className="pa-header-cell">
                <FontAwesomeIcon icon={faClipboardList} className="pa-header-icon" />
                Questions
              </div>
              <div className="pa-header-cell">
                <FontAwesomeIcon icon={faCheckCircle} className="pa-header-icon" />
                Status
              </div>
              <div className="pa-header-cell">
                Actions
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
                    <span className="pa-status pa-active">
                      <FontAwesomeIcon icon={faCheckCircle} /> Active
                    </span>
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
        <div className={modalType === 'preview' ? 'ap-modal-overlay' : 'pa-modal-overlay'}>
          {console.log('🔧 [DEBUG] Modal rendering - showModal:', showModal, 'modalType:', modalType, 'showQuestionForm:', showQuestionForm)}
          <div className={modalType === 'preview' ? 'ap-modal' : `pa-modal ${modalType === 'preview' || showQuestionForm ? 'pa-modal-enhanced' : ''} ${modalType === 'delete' ? 'pa-modal-narrow' : ''}`}>
            <div className={modalType === 'preview' ? 'ap-modal-header' : 'pa-modal-header'}>
              <h3>
                {modalType === 'create' ?
                  <><FontAwesomeIcon icon={faPlus} className="pa-modal-header-icon" /> Create New Assessment</> :
                  modalType === 'edit' ?
                    <><FontAwesomeIcon icon={faEdit} className="pa-modal-header-icon" /> Edit Assessment</> :
                    modalType === 'preview' ?
                      <> Assessment Preview</> :
                      <><FontAwesomeIcon icon={faTrash} className="pa-modal-header-icon" /> Delete Assessment</>
                }
              </h3>
              <button
                className={modalType === 'preview' ? 'ap-modal-close' : 'pa-modal-close'}
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
                <div className="ap-assessment-preview">
                  <div className="ap-preview-header">
                    <div className="ap-preview-info">
                      <div className="ap-preview-section">
                        <span className="ap-preview-label">Reading Level</span>
                        <span className="ap-preview-value">{selectedAssessment.readingLevel}</span>
                      </div>

                      <div className="ap-preview-section">
                        <span className="ap-preview-label">Category</span>
                        <span className="ap-preview-value">{selectedAssessment.category}</span>
                      </div>

                      <div className="ap-preview-section">
                        <span className="ap-preview-label">Total Questions</span>
                        <span className="ap-preview-value">{selectedAssessment.questions.length}</span>
                      </div>

                      <div className="ap-preview-section">
                        <span className="ap-preview-label">Status</span>
                        <span className="ap-preview-value">
                          {selectedAssessment.isActive ? (
                            <span className="ap-status-tag active">
                              <FontAwesomeIcon icon={faCheckCircle} /> Active
                            </span>
                          ) : (
                            <span className="ap-status-tag inactive">
                              <FontAwesomeIcon icon={faExclamationTriangle} /> Inactive
                            </span>
                          )}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="ap-preview-content">
                    <h4>
                      <FontAwesomeIcon icon={faClipboardList} className="ap-preview-icon" />
                      Assessment Questions
                    </h4>

                    {selectedAssessment.questions.map((question, index) => (
                      <div key={index} className="ap-question-card">
                        <div className="ap-question-header">
                          <div className="ap-question-metadata">
                            <span className="ap-question-num">Question {index + 1}</span>
                            <span className="ap-question-type">
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
                                className="ap-question-type-icon"
                              />
                              {getQuestionTypeDisplay(question.questionType, question.questionSubtype)}
                            </span>
                          </div>
                        </div>

                        <div className="ap-question-body">
                          <div className="ap-question-text">{question.questionText}</div>

                          {/* Reading Comprehension */}
                          {selectedAssessment.category === 'Reading Comprehension' && question.passages && (
                            <div className="ap-passage-preview">
                              <h5><FontAwesomeIcon icon={faBook} /> Reading Passage</h5>

                              {(() => {
                                const currentPage = previewPages[index] || 0;
                                return (
                                  <>
                                    <div className="ap-passage-navigation">
                                      <button
                                        className="ap-page-nav-btn"
                                        onClick={() => handlePreviewPageChange('prev', index)}
                                        disabled={currentPage === 0}
                                      >
                                        <FontAwesomeIcon icon={faArrowLeft} /> Previous
                                      </button>

                                      <span className="ap-page-indicator">
                                        Page {currentPage + 1} of {question.passages.length}
                                      </span>

                                      <button
                                        className="ap-page-nav-btn"
                                        onClick={() => handlePreviewPageChange('next', index)}
                                        disabled={currentPage >= question.passages.length - 1}
                                      >
                                        Next <FontAwesomeIcon icon={faArrowRight} />
                                      </button>
                                    </div>

                                    <div className="ap-passage-container">
                                      {question.passages[currentPage]?.pageImage && (
                                        <div className="ap-passage-image-container">
                                          <img
                                            src={question.passages[currentPage].pageImage}
                                            alt={`Page ${currentPage + 1} illustration`}
                                            className="ap-passage-image"
                                          />
                                        </div>
                                      )}

                                      <div className="ap-passage-text-container">
                                        <p className="ap-passage-text">{question.passages[currentPage]?.pageText}</p>
                                      </div>
                                    </div>
                                  </>
                                );
                              })()}

                              <div className="ap-comprehension-questions">
                                <h5><FontAwesomeIcon icon={faQuestion} /> Comprehension Questions</h5>
                                {question.sentenceQuestions && question.sentenceQuestions.length > 0 ? (
                                  question.sentenceQuestions.map((sq, sqIndex) => (
                                    <div key={sqIndex} className="ap-sentence-question">
                                      <div className="ap-sentence-question-text">{sq.questionText}</div>
                                      <div className="ap-correct-answer">Correct Answer: {sq.correctAnswer}</div>
                                      {sq.acceptableAnswers && sq.acceptableAnswers.length > 0 && (
                                        <div className="ap-acceptable-answers">
                                          <div className="ap-acceptable-answers-label">Acceptable Answers:</div>
                                          {sq.acceptableAnswers.map((answer, ansIndex) => (
                                            <span key={ansIndex} className="ap-acceptable-answer">{answer}</span>
                                          ))}
                                        </div>
                                      )}
                                    </div>
                                  ))
                                ) : (
                                  <div className="ap-no-questions">
                                    <p>No comprehension questions added yet.</p>
                                  </div>
                                )}
                              </div>
                            </div>
                          )}

                          {/* Decoding */}
                          {selectedAssessment.category === 'Decoding' && (
                            <div className="ap-decoding-preview">
                              {question.questionImage && (
                                <div className="ap-decoding-image-container">
                                  <img
                                    src={question.questionImage}
                                    alt="Question visual"
                                    className="ap-decoding-image"
                                  />
                                        </div>
                              )}

                              <div className="ap-decoding-content">
                                {question.dragElements && question.dragElements.length > 0 && (
                                  <div className="ap-drag-elements">
                                    <h6>Available Letters:</h6>
                                    {question.dragElements.map((element, elemIndex) => (
                                      <span key={elemIndex} className="ap-drag-element">{element}</span>
                                    ))}
                                        </div>
                                )}

                                {question.correctSequence && question.correctSequence.length > 0 && (
                                  <div className="ap-correct-sequence">
                                    <span className="ap-correct-sequence-label">Correct Answer:</span>
                                    {question.correctSequence.map((element, elemIndex) => (
                                      <span key={elemIndex} className="ap-sequence-element">{element}</span>
                                    ))}
                                      </div>
                                )}
                                    </div>
                                  </div>
                                )}

                          {/* Phonological Awareness */}
                          {selectedAssessment.category === 'Phonological Awareness' && question.questionSet && (
                            <div className="ap-matching-preview">
                              {question.questionSet.map((set, setIndex) => (
                                <div key={setIndex} className="ap-matching-section">
                                  {set.audioTexts && set.audioTexts.length > 0 && (
                                    <div className="ap-audio-texts">
                                      <h6>Audio Texts:</h6>
                                      {set.audioTexts.map((text, textIndex) => (
                                        <span key={textIndex} className="ap-audio-text">{text}</span>
                                      ))}
                              </div>
                                  )}

                                  {set.matchingOptions && set.matchingOptions.length > 0 && (
                                    <div className="ap-matching-options">
                                      <h6>Matching Options:</h6>
                                      {set.matchingOptions.map((option, optIndex) => (
                                        <span key={optIndex} className="ap-matching-option">{option}</span>
                                      ))}
                            </div>
                                  )}

                                  {set.correctPairs && set.correctPairs.length > 0 && (
                                    <div className="ap-correct-pairs">
                                      <h6>Correct Pairs:</h6>
                                      {set.correctPairs.map((pair, pairIndex) => (
                                        <div key={pairIndex} className="ap-correct-pair">
                                          {Object.entries(pair).map(([key, value]) => (
                                            <span key={key}>{key} → {value}</span>
                                          ))}
                                        </div>
                                      ))}
                                    </div>
                                  )}
                                    </div>
                              ))}
                            </div>
                          )}

                          {/* Word Recognition */}
                          {selectedAssessment.category === 'Word Recognition' && (
                            <div className="ap-word-recognition-preview">
                              {question.displayWord && (
                                <div className="ap-display-word">{question.displayWord}</div>
                              )}

                              {question.blankOptions && question.blankOptions.length > 0 && (
                                <div className="ap-blank-options">
                                  <h6>Answer Options:</h6>
                                  {question.blankOptions.map((option, optIndex) => (
                                    <span key={optIndex} className="ap-blank-option">{option}</span>
                                  ))}
                                </div>
                              )}

                              {question.correctAnswer && question.correctAnswer.length > 0 && (
                                <div className="ap-correct-answer">
                                  Correct Answer: {question.correctAnswer.join(', ')}
                                </div>
                              )}
                            </div>
                          )}

                          {/* Alphabet Knowledge */}
                          {selectedAssessment.category === 'Alphabet Knowledge' && question.choiceOptions && (
                            <div className="ap-multiple-choice-preview">
                              {question.questionImage && (
                                <div className="ap-decoding-image-container">
                                  <img
                                    src={question.questionImage}
                                    alt="Question visual"
                                    className="ap-decoding-image"
                                  />
                                </div>
                              )}
                              
                              {question.questionValue && (
                                <div className="ap-question-value">
                                  <strong>Question Value:</strong> {question.questionValue}
                                </div>
                              )}
                              
                              <h6>Answer Options:</h6>
                              <div className="ap-options-list">
                                {question.choiceOptions.map((option, optIndex) => (
                                  <div key={optIndex} className={`ap-option ${option.isCorrect ? 'correct' : ''}`}>
                                    <div className="ap-option-label">{String.fromCharCode(65 + optIndex)}</div>
                                    <div className="ap-option-text">{option.optionText}</div>
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
                  {console.log('🔧 [DEBUG] Question form rendering - showQuestionForm:', showQuestionForm, 'currentQuestion:', currentQuestion, 'formData.category:', formData.category)}
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
                    {console.log('🔧 [DEBUG] Question form content rendering - formData.category:', formData.category, 'questionFormData:', questionFormData)}
                    {/* Question types are now automatically determined by category */}

                    {/* Question Content Section - Two Column Layout */}
                    <div className="pa-form-section">
                      <h5>
                        <FontAwesomeIcon icon={faEdit} className="pa-header-icon" />
                        Question Content
                      </h5>

                      <div className="pa-question-content">
                        {/* Left Column - Text Fields */}
                        <div className="pa-question-left-column">
                          {/* Question ID Display Field */}
                          <div className="pa-form-group">
                            <label className="pa-form-label">
                              <FontAwesomeIcon icon={faEdit} className="pa-label-icon" />
                              Question ID
                              <Tooltip text="Auto-generated unique identifier for this question. Format: XX_000 where XX is category prefix." />
                            </label>
                            <input
                              type="text"
                              value={questionFormData.questionId || "Auto-generated"}
                              readOnly
                              disabled
                              className="pa-text-input pa-readonly-input"
                              style={{ 
                                backgroundColor: '#f5f5f5',
                                color: '#666',
                                cursor: 'not-allowed',
                                fontWeight: 'bold'
                              }}
                            />
                          </div>

                          <div className="pa-form-group">
                            <label className="pa-form-label" htmlFor="questionText">
                              <FontAwesomeIcon icon={faFileAlt} className="pa-label-icon" />
                              Question Text
                              <span className="pa-required-field">*</span>
                              <Tooltip text="The main instruction or question that will be displayed to students. Make it clear and age-appropriate." />
                            </label>
                            {formData.category === "Decoding" ? (
                              <select
                                id="questionText"
                                name="questionText"
                                value={questionFormData.questionText}
                                onChange={(e) => {
                                  const selectedText = e.target.value;
                                  setQuestionFormData(prev => ({
                                    ...prev,
                                    questionText: selectedText,
                                    // Reset related fields when changing question type
                                    displaySequence: [],
                                    dragElements: [],
                                    correctSequence: [],
                                    blankPosition: selectedText === 'Buoin ang salita' ? 0 : null
                                  }));
                                }}
                                className="pa-select-input"
                                required
                              >
                                <option value="">Select question text</option>
                                <option value="Tukuyin ang nasa larawan?">Tukuyin ang nasa larawan?</option>
                                <option value="Buoin ang salita">Buoin ang salita</option>
                              </select>
                            ) : formData.category === "Word Recognition" ? (
                              <select
                                id="questionText"
                                name="questionText"
                                value={questionFormData.questionText}
                                onChange={handleQuestionFormChange}
                                className="pa-select-input"
                                required
                              >
                                <option value="">Select question text</option>
                                <option value="Basahin ang pangungusap. Piliin ang tamang salita mula sa hanay.">Basahin ang pangungusap. Piliin ang tamang salita mula sa hanay.</option>
                                <option value="Anong kasing tunog ng salitang nakikita?">Anong kasing tunog ng salitang nakikita?</option>
                              </select>
                            ) : (
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
                            )}
                          </div>

                          {/* Show questionValue only for Alphabet Knowledge */}
                          {formData.category === "Alphabet Knowledge" && (
                            <div className="pa-form-group">
                              <label htmlFor="questionValue">
                                Question Display Text:
                                <Tooltip text="The text shown alongside the question, like a letter or word combination that students need to analyze. Optional - will be set to null if empty." />
                              </label>
                              <input
                                type="text"
                                id="questionValue"
                                name="questionValue"
                                value={questionFormData.questionValue || ""}
                                onChange={handleQuestionFormChange}
                                placeholder="Enter text to display with the question (e.g., 'A' or 'BO + LA') - optional"
                                className="pa-text-input"
                              />
                            </div>
                          )}
                        </div>

                        {/* Right Column - Image Upload (Hidden for Phonological Awareness) */}
                        {formData.category !== "Phonological Awareness" && (
                          <div className="pa-question-right-column">
                          {/* Show questionImage only for Alphabet Knowledge, Decoding, and Word Recognition */}
                          {(formData.category === "Alphabet Knowledge" ||
                            formData.category === "Decoding" ||
                            formData.category === "Word Recognition") && (
                              <>
                                <label className="pa-form-label">
                                  <FontAwesomeIcon icon={faImages} className="pa-label-icon" />
                                  Question Image
                                  <Tooltip text="Upload an image to display with the question (e.g., a picture of the letter or word)." />
                                </label>
                                <div className="pa-file-upload">
                                  <label className="pa-upload-button">
                                    <FontAwesomeIcon icon={faCloudUploadAlt} />
                                    {uploadingImage ? "Uploading..." : "Upload Image"}
                                    <input
                                      type="file"
                                      accept="image/*"
                                      onChange={(e) => handleImageUpload(e, "questionImage")}
                                      className="pa-file-input"
                                      disabled={uploadingImage}
                                      style={{ display: 'none' }}
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
                                        style={{
                                          width: '100%',
                                          maxHeight: '200px',
                                          objectFit: 'contain',
                                          borderRadius: '8px',
                                          border: '2px solid #e2e8f0'
                                        }}
                                      />

                                      <div className="pa-file-name" style={{
                                        marginTop: '8px',
                                        fontSize: '12px',
                                        color: '#6b7280',
                                        textAlign: 'center'
                                      }}>
                                        {questionFormData.questionImage ? "Question image uploaded" : "Image Preview"}
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
                                        style={{
                                          position: 'absolute',
                                          top: '8px',
                                          right: '8px',
                                          background: '#ef4444',
                                          color: 'white',
                                          border: 'none',
                                          borderRadius: '50%',
                                          width: '24px',
                                          height: '24px',
                                          cursor: 'pointer'
                                        }}
                                      >
                                        <FontAwesomeIcon icon={faTimes} />
                                      </button>
                                    </div>
                                  )}
                                </div>
                              </>
                            )}

                          {/* Placeholder when no image categories - exclude Reading Comprehension */}
                          {!(formData.category === "Alphabet Knowledge" ||
                            formData.category === "Decoding" ||
                            formData.category === "Word Recognition" ||
                            formData.category === "Reading Comprehension") && (
                              <div style={{
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                height: '100%',
                                color: '#9ca3af',
                                fontSize: '14px',
                                textAlign: 'center',
                                fontStyle: 'italic'
                              }}>
                                <FontAwesomeIcon icon={faImages} style={{ marginRight: '8px' }} />
                                Image upload not available for this category
                              </div>
                            )}
                          </div>
                        )}
                      </div>

                      <br></br>
                      <br></br>
                      {/* Alphabet Knowledge - Answer Choices (Single Row Layout) */}
                      {formData.category === "Alphabet Knowledge" && (
                        <div className="pa-form-group pa-full-width">
                          <label className="pa-form-label">
                            <FontAwesomeIcon icon={faCheckCircle} className="pa-label-icon" />
                            Answer Choices
                            <span className="pa-required-field">*</span>
                            <Tooltip text="Create 3 answer options for students to choose from. Click the checkmark to mark the correct answer." />
                          </label>

                          <div className="pa-alphabet-choices-row">
                            {questionFormData.choiceOptions.map((choice, index) => (
                              <div
                                key={index}
                                className={`pa-alphabet-choice-card ${choice.isCorrect ? 'correct' : ''}`}
                                onClick={() => {
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
                              >
                                {choice.isCorrect && (
                                  <div className="pa-correct-indicator">
                                    <FontAwesomeIcon icon={faCheckCircle} />
                                  </div>
                                )}

                                <label className="pa-form-label" style={{ marginBottom: '8px', fontSize: '12px', color: '#6b7280' }}>
                                  Option {index + 1}
                                </label>

                                <input
                                  type="text"
                                  value={choice.optionText}
                                  onChange={(e) => handleChoiceChange(index, "optionText", e.target.value)}
                                  placeholder={`Option ${index + 1}`}
                                  required
                                  className="pa-form-input pa-alphabet-choice-text"
                                  onClick={(e) => e.stopPropagation()} // Prevent card click when typing
                                  style={{
                                    textAlign: 'center',
                                    fontSize: '16px',
                                    fontWeight: '600',
                                    border: 'none',
                                    background: 'transparent',
                                    outline: 'none'
                                  }}
                                />
                              </div>
                            ))}
                          </div>

                          <div className="pa-help-text" style={{
                            marginTop: '15px',
                            padding: '12px 16px',
                            background: 'linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 100%)',
                            borderLeft: '4px solid #0ea5e9',
                            borderRadius: '8px'
                          }}>
                            <FontAwesomeIcon icon={faInfoCircle} style={{ color: '#0ea5e9', marginRight: '8px' }} />
                            <strong>Instructions:</strong> Enter answer options and click on a card to mark it as the correct answer.
                            The correct answer will be highlighted in green.
                          </div>
                        </div>
                      )}

                      {/* Phonological Awareness - Audio Matching */}
                      {formData.category === "Phonological Awareness" && (
                        <div className="pa-form-section">
                          <div className="pa-section-header">
                            <FontAwesomeIcon icon={faVolumeUp} className="pa-section-icon" />
                            <h3>Audio Matching Configuration</h3>
                          </div>

                          <div className="pa-phonological-container">
                            {/* Audio Texts Section */}
                            <div className="pa-audio-section">
                              <div className="pa-section-title">
                                <h4>Audio Texts (TTS will read these)</h4>
                                <span className="pa-item-count">
                                  {questionFormData.questionSet?.[0]?.audioTexts?.length || 0}/4 items
                                </span>
                              </div>
                              <p className="pa-section-description">
                                Enter letters (e.g., H, T) or words (e.g., DAGA, MATA) that will be read aloud by text-to-speech
                              </p>

                              <div className="pa-audio-cards">
                                {questionFormData.questionSet?.[0]?.audioTexts?.map((audioText, index) => (
                                  <div key={index} className="pa-audio-card">
                                    <div className="pa-audio-card-header">
                                      <span className="pa-audio-label">AUDIO {index + 1}</span>
                                      <button
                                        type="button"
                                        className="pa-remove-btn"
                                        onClick={() => {
                                          const updatedAudioTexts = questionFormData.questionSet[0].audioTexts.filter((_, i) => i !== index);
                                          const updatedMatchingOptions = questionFormData.questionSet[0].matchingOptions.filter((_, i) => i !== index);
                                          setQuestionFormData(prev => ({
                                            ...prev,
                                            questionSet: [{
                                              ...prev.questionSet[0],
                                              audioTexts: updatedAudioTexts,
                                              matchingOptions: updatedMatchingOptions,
                                              correctPairs: []
                                            }]
                                          }));
                                        }}
                                      >
                                        <FontAwesomeIcon icon={faTimes} />
                                      </button>
                                    </div>
                                    <div className="pa-audio-card-content">
                                      <div className="pa-audio-text">{audioText}</div>
                                      <div className="pa-auto-match">Auto-match: {questionFormData.questionSet?.[0]?.matchingOptions?.[index] || 'N/A'}</div>
                                    </div>
                                  </div>
                                )) || []}
                              </div>

                              <div className="pa-add-audio-inline">
                                <input
                                  type="text"
                                  placeholder="Enter audio text (e.g., H, DAGA, etc.)"
                                  className="pa-audio-text-input"
                                  onKeyDown={(e) => {
                                    if (e.key === 'Enter' && e.target.value.trim()) {
                                      const newAudio = e.target.value.trim().toUpperCase();
                                      const currentAudioTexts = questionFormData.questionSet?.[0]?.audioTexts || [];
                                      const currentMatchingOptions = questionFormData.questionSet?.[0]?.matchingOptions || [];
                                      setQuestionFormData(prev => ({
                                        ...prev,
                                        questionSet: [{
                                          ...prev.questionSet?.[0],
                                          audioTexts: [...currentAudioTexts, newAudio],
                                          matchingOptions: [...currentMatchingOptions, newAudio.length === 1 ? newAudio + newAudio.toLowerCase() : newAudio],
                                          correctPairs: []
                                        }]
                                      }));
                                      e.target.value = '';
                                    }
                                  }}
                                />
                                <button
                                  type="button"
                                  className="pa-add-audio-btn"
                                  onClick={(e) => {
                                    const input = e.target.parentElement.querySelector('.pa-audio-text-input');
                                    const newAudio = input.value.trim().toUpperCase();
                                    if (newAudio) {
                                      const currentAudioTexts = questionFormData.questionSet?.[0]?.audioTexts || [];
                                      const currentMatchingOptions = questionFormData.questionSet?.[0]?.matchingOptions || [];
                                      setQuestionFormData(prev => ({
                                        ...prev,
                                        questionSet: [{
                                          ...prev.questionSet?.[0],
                                          audioTexts: [...currentAudioTexts, newAudio],
                                          matchingOptions: [...currentMatchingOptions, newAudio.length === 1 ? newAudio + newAudio.toLowerCase() : newAudio],
                                          correctPairs: []
                                        }]
                                      }));
                                      input.value = '';
                                    }
                                  }}
                                >
                                  <FontAwesomeIcon icon={faPlus} /> Add
                                </button>
                              </div>
                            </div>

                            {/* Matching Options Section */}
                            <div className="pa-matching-section">
                              <div className="pa-section-title">
                                <h4>Matching Options (Visual choices)</h4>
                                <span className="pa-auto-label">AUTO-GENERATED & SHUFFLED</span>
                              </div>
                              <p className="pa-section-description">
                                These are automatically generated based on your audio texts and will be randomly shuffled for students
                              </p>

                              <div className="pa-matching-options-display">
                                {questionFormData.questionSet?.[0]?.matchingOptions?.map((option, index) => (
                                  <div key={index} className="pa-matching-option">
                                    <span className="pa-option-number">{index + 1}</span>
                                    <span className="pa-option-text">{option}</span>
                                  </div>
                                )) || <div className="pa-empty-state">No matching options yet</div>}
                              </div>
                            </div>

                            {/* Correct Pairs Section */}
                            <div className="pa-pairs-section">
                              <div className="pa-section-title">
                                <h4>Correct Audio-Visual Pairs</h4>
                                <span className="pa-auto-label">AUTO-CONFIGURED</span>
                              </div>
                              <p className="pa-section-description">
                                Pairs are automatically created from your audio texts
                              </p>

                              <div className="pa-pairs-display">
                                {questionFormData.questionSet?.[0]?.audioTexts?.map((audioText, index) => (
                                  <div key={index} className="pa-pair-display">
                                    <div className="pa-pair-label">PAIR {index + 1}</div>
                                    <div className="pa-pair-content">
                                      <div className="pa-pair-audio-display">
                                        <FontAwesomeIcon icon={faVolumeUp} />
                                        <span>{audioText}</span>
                                      </div>
                                      <FontAwesomeIcon icon={faArrowRight} className="pa-pair-arrow" />
                                      <div className="pa-pair-visual-display">
                                        <span>{questionFormData.questionSet?.[0]?.matchingOptions?.[index] || 'N/A'}</span>
                                      </div>
                                    </div>
                                  </div>
                                )) || <div className="pa-empty-state">No pairs configured yet</div>}
                              </div>
                            </div>
                          </div>
                        </div>
                      )}

                      {/* Decoding - Drag and Drop */}
                      {formData.category === "Decoding" && (
                        <div className="pa-form-section">
                          <div className="pa-section-header">
                            <FontAwesomeIcon icon={faPuzzlePiece} className="pa-section-icon" />
                            <h3>Letter Sequence Configuration</h3>
                          </div>

                          {/* Question Type Selection */}
                          <div className="pa-question-type-selector">
                            <div className="pa-question-type-option">
                              <div className="pa-orange-alert">
                                <FontAwesomeIcon icon={faInfoCircle} />
                                <span className="pa-alert-title">Selected Question Type:</span>
                              </div>
                              <div className="pa-question-description">
                                {questionFormData.questionText === "Tukuyin ang nasa larawan?" ?
                                  "• Students will identify the complete word from the image by arranging all letters" :
                                  questionFormData.questionText === "Buoin ang salita" ?
                                    "• Students will fill in missing letter(s) to complete the word" :
                                    "Please select a question text to see configuration"
                                }
                              </div>
                            </div>
                          </div>

                          {/* Word Identification Configuration */}
                          {questionFormData.questionText === "Tukuyin ang nasa larawan?" && (
                            <div className="pa-decoding-word-config">
                              <h4>Complete Word Letters</h4>
                              <p>Enter all letters of the word that students will arrange from the image</p>

                              <div className="pa-word-input-group">
                                <label>Complete Word (will be scrambled for students):</label>
                                <input
                                  type="text"
                                  placeholder="Enter complete word (e.g., Yelo)"
                                  value={questionFormData.correctSequence?.join('') || ''}
                                  onChange={(e) => {
                                    const cleanWord = e.target.value.replace(/[^a-zA-Z]/g, '').replace(/\s+/g, ''); // Remove numbers, symbols, and spaces
                                    // Auto-capitalize first letter, make rest lowercase
                                    const formattedWord = cleanWord.charAt(0).toUpperCase() + cleanWord.slice(1).toLowerCase();
                                    const letters = formattedWord.split('');
                                    // Add mixed case distractors instead of all capitals
                                    const distractors = ['a', 'e', 'i', 'o', 'u', 'n', 't', 'r'];
                                    const selectedDistractors = distractors.slice(0, 2); // Take 2 distractors
                                    setQuestionFormData(prev => ({
                                      ...prev,
                                      correctSequence: letters,
                                      dragElements: [...letters, ...selectedDistractors]
                                    }));
                                  }}
                                  className="pa-word-input"
                                  style={{ textTransform: 'none' }}
                                />
                              </div>

                              <div className="pa-word-preview">
                                <div className="pa-preview-title">Preview (what students will see):</div>
                                <div className="pa-letter-tiles">
                                  {questionFormData.correctSequence?.map((letter, index) => (
                                    <div key={index} className="pa-letter-tile" style={{ textTransform: 'none' }}>{letter}</div>
                                  ))}
                                </div>
                              </div>

                              <div className="pa-available-letters">
                                <h5>Available Letters (Student Options)</h5>
                                <p>All letters from the word plus some distractors for students to arrange</p>
                                <div className="pa-letter-options">
                                  {questionFormData.dragElements?.map((letter, index) => (
                                    <div key={index} className="pa-letter-option">
                                      <span className="pa-letter" style={{ textTransform: 'none' }}>{letter}</span>
                                      {index >= (questionFormData.correctSequence?.length || 0) && (
                                        <button
                                          type="button"
                                          className="pa-remove-letter"
                                          onClick={() => {
                                            const updatedElements = questionFormData.dragElements.filter((_, i) => i !== index);
                                            setQuestionFormData(prev => ({
                                              ...prev,
                                              dragElements: updatedElements
                                            }));
                                          }}
                                        >
                                          <FontAwesomeIcon icon={faTimes} />
                                        </button>
                                      )}
                                    </div>
                                  ))}
                                  <button
                                    type="button"
                                    className="pa-add-letter"
                                    onClick={() => {
                                      // Show custom modal instead of browser prompt
                                      const modal = document.createElement('div');
                                      modal.style.cssText = `
                                        position: fixed;
                                        top: 0;
                                        left: 0;
                                        width: 100%;
                                        height: 100%;
                                        background: rgba(0,0,0,0.5);
                                        display: flex;
                                        justify-content: center;
                                        align-items: center;
                                        z-index: 10000;
                                      `;
                                      
                                      const modalContent = document.createElement('div');
                                      modalContent.style.cssText = `
                                        background: white;
                                        padding: 20px;
                                        border-radius: 8px;
                                        box-shadow: 0 4px 20px rgba(0,0,0,0.3);
                                        min-width: 300px;
                                        max-width: 500px;
                                      `;
                                      
                                      modalContent.innerHTML = `
                                        <h3 style="margin: 0 0 15px 0; color: #333;">Add Distractor Letter</h3>
                                        <p style="margin: 0 0 15px 0; color: #666; font-size: 14px;">Enter a letter to add as a distractor option for students</p>
                                        <input 
                                          type="text" 
                                          id="letterInput" 
                                          placeholder="Enter letter (e.g., a, B, c)"
                                          style="width: 100%; padding: 8px; border: 1px solid #ddd; border-radius: 4px; margin-bottom: 15px;"
                                          maxlength="1"
                                        />
                                        <div style="display: flex; gap: 10px; justify-content: flex-end;">
                                          <button id="cancelBtn" style="padding: 8px 16px; border: 1px solid #ddd; background: white; border-radius: 4px; cursor: pointer;">Cancel</button>
                                          <button id="addBtn" style="padding: 8px 16px; background: #007bff; color: white; border: none; border-radius: 4px; cursor: pointer;">Add Letter</button>
                                        </div>
                                      `;
                                      
                                      modal.appendChild(modalContent);
                                      document.body.appendChild(modal);
                                      
                                      const input = modalContent.querySelector('#letterInput');
                                      const cancelBtn = modalContent.querySelector('#cancelBtn');
                                      const addBtn = modalContent.querySelector('#addBtn');
                                      
                                      input.focus();
                                      
                                      let cleanup = () => {
                                        document.body.removeChild(modal);
                                      };
                                      
                                      cancelBtn.onclick = cleanup;
                                      addBtn.onclick = () => {
                                        const letter = input.value.trim();
                                        if (letter && /^[a-zA-Z]$/.test(letter)) {
                                          // Keep original case, don't force uppercase
                                        setQuestionFormData(prev => ({
                                          ...prev,
                                            dragElements: [...(prev.dragElements || []), letter]
                                          }));
                                          cleanup();
                                        } else {
                                          alert('Please enter a single letter (a-z or A-Z)');
                                        }
                                      };
                                      
                                      // Close on escape key
                                      const handleKeyPress = (e) => {
                                        if (e.key === 'Escape') cleanup();
                                        if (e.key === 'Enter') addBtn.click();
                                      };
                                      document.addEventListener('keydown', handleKeyPress);
                                      modal.addEventListener('click', (e) => {
                                        if (e.target === modal) cleanup();
                                      });
                                      
                                      // Clean up event listener when modal is removed
                                      const originalCleanup = cleanup;
                                      cleanup = () => {
                                        document.removeEventListener('keydown', handleKeyPress);
                                        originalCleanup();
                                      };
                                    }}
                                  >
                                    <FontAwesomeIcon icon={faPlus} /> Add Option
                                  </button>
                                </div>
                              </div>

                              <div className="pa-correct-answer">
                                <h5>Correct Answer <span className="pa-auto-generated">AUTO-GENERATED</span></h5>
                                <p>The complete word sequence that students need to arrange</p>
                                <div className="pa-answer-sequence">
                                  {questionFormData.correctSequence?.map((letter, index) => (
                                    <div key={index} className="pa-answer-letter">
                                      <span className="pa-letter" style={{ textTransform: 'none' }}>{letter}</span>
                                      <span className="pa-position">Position {index + 1}</span>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            </div>
                          )}

                          {/* Word Completion Configuration */}
                          {questionFormData.questionText === "Buoin ang salita" && (
                            <div className="pa-decoding-blank-config">
                              <h4>Word with Blank Position</h4>
                              <p>Enter the complete word, then mark which position should be blank for students to fill</p>

                              <div className="pa-word-input-group">
                                <label>Complete Word:</label>
                                <input
                                  type="text"
                                  placeholder="Halina (mixed case, no numbers/symbols/spaces)"
                                  value={questionFormData.displaySequence?.join('').replace('_', (questionFormData.correctSequence?.[0] || '')) || ''}
                                  onChange={(e) => {
                                    const cleanWord = e.target.value.replace(/[^a-zA-Z]/g, '').replace(/\s+/g, ''); // Remove numbers, symbols, and spaces
                                    // Auto-capitalize first letter, make rest lowercase
                                    const formattedWord = cleanWord.charAt(0).toUpperCase() + cleanWord.slice(1).toLowerCase();
                                    setQuestionFormData(prev => ({
                                      ...prev,
                                      displaySequence: formattedWord.split(''),
                                      blankPosition: null, // Reset blank position when word changes
                                      correctSequence: []  // Reset correct sequence when word changes
                                    }));
                                  }}
                                  className="pa-word-input"
                                  style={{ textTransform: 'none' }}
                                />
                              </div>

                              <div className="pa-blank-position-selector">
                                <label>Select Blank Position:</label>
                                <p style={{ fontSize: '13px', color: '#6b7280', marginBottom: '8px', fontStyle: 'italic' }}>
                                  Click on a position to make it blank. Click again to unselect and restore the letter.
                                </p>
                                <div className="pa-position-buttons">
                                  {questionFormData.displaySequence?.map((letter, index) => (
                                    <button
                                      key={index}
                                      type="button"
                                      className={`pa-position-btn ${questionFormData.blankPosition === index ? 'selected' : ''}`}
                                      onClick={() => {
                                        // Get the original word from input value
                                        const originalWord = questionFormData.displaySequence?.join('').replace('_', (questionFormData.correctSequence?.[0] || ''));
                                        const originalLetters = originalWord.split('');
                                        
                                        // Toggle functionality: if this position is already selected, unselect it
                                        if (questionFormData.blankPosition === index) {
                                          // Unselect - restore all original letters
                                          setQuestionFormData(prev => ({
                                            ...prev,
                                            blankPosition: null,
                                            displaySequence: originalLetters,
                                            correctSequence: []
                                          }));
                                        } else {
                                          // Select this position - make it blank
                                          const newSequence = [...originalLetters];
                                          const correctLetter = originalLetters[index];
                                          newSequence[index] = '_';
                                          setQuestionFormData(prev => ({
                                            ...prev,
                                            blankPosition: index,
                                            displaySequence: newSequence,
                                            correctSequence: [correctLetter]
                                          }));
                                        }
                                      }}
                                    >
                                      <div className="pa-position-label">Position {index + 1}</div>
                                      <div className="pa-position-letter" style={{ textTransform: 'none' }}>
                                        {/* Show original letter from input field, not from displaySequence which might contain '_' */}
                                        {(() => {
                                          const originalWord = questionFormData.displaySequence?.join('').replace('_', (questionFormData.correctSequence?.[0] || ''));
                                          return originalWord.split('')[index] || letter;
                                        })()}
                                      </div>
                                    </button>
                                  ))}
                                </div>
                              </div>

                              <div className="pa-word-preview">
                                <div className="pa-preview-title">Preview (what students will see):</div>
                                <div className="pa-letter-tiles">
                                  {questionFormData.displaySequence?.map((letter, index) => (
                                    <div key={index} className={`pa-letter-tile ${letter === '_' ? 'blank' : ''}`} style={{ textTransform: 'none' }}>
                                      {letter === '_' ? '___' : letter}
                                    </div>
                                  ))}
                                </div>
                              </div>

                              <div className="pa-available-letters">
                                <h5>Available Letters (Student Options)</h5>
                                <p>Letters students can choose from to fill the blank (includes correct answer + distractors)</p>
                                <button
                                  type="button"
                                  className="pa-auto-populate-btn"
                                  onClick={() => {
                                    const correctLetter = questionFormData.correctSequence?.[0] || '';
                                    
                                    // Create a diverse mix of patinig (vowels) and katinig (consonants) in different cases
                                    const patinig = ['a', 'e', 'i', 'o', 'u', 'A', 'E', 'I', 'O', 'U'];
                                    const katinig = ['b', 'c', 'd', 'f', 'g', 'h', 'j', 'k', 'l', 'm', 'n', 'p', 'q', 'r', 's', 't', 'v', 'w', 'x', 'y', 'z',
                                                    'B', 'C', 'D', 'F', 'G', 'H', 'J', 'K', 'L', 'M', 'N', 'P', 'Q', 'R', 'S', 'T', 'V', 'W', 'X', 'Y', 'Z'];
                                    
                                    // Mix patinig and katinig for variety
                                    const allLetters = [...patinig, ...katinig];
                                    
                                    // Filter out the correct letter and get 3 random distractors
                                    const possibleDistractors = allLetters.filter(letter => 
                                      letter.toLowerCase() !== correctLetter.toLowerCase()
                                    );
                                    
                                    // Shuffle and pick 3 random distractors
                                    const shuffled = possibleDistractors.sort(() => 0.5 - Math.random());
                                    const selectedDistractors = shuffled.slice(0, 3);
                                    
                                    // Combine correct letter with distractors
                                    const availableLetters = [correctLetter, ...selectedDistractors];
                                    
                                    setQuestionFormData(prev => ({
                                      ...prev,
                                      dragElements: availableLetters
                                    }));
                                  }}
                                >
                                  <FontAwesomeIcon icon={faGraduationCap} /> Auto-populate with distractors
                                </button>
                                <div className="pa-letter-options">
                                  {questionFormData.dragElements?.map((letter, index) => (
                                    <div key={index} className="pa-letter-option">
                                      <span className="pa-letter" style={{ textTransform: 'none' }}>{letter}</span>
                                      <button
                                        type="button"
                                        className="pa-remove-letter"
                                        onClick={() => {
                                          const updatedElements = questionFormData.dragElements.filter((_, i) => i !== index);
                                          setQuestionFormData(prev => ({
                                            ...prev,
                                            dragElements: updatedElements
                                          }));
                                        }}
                                      >
                                        <FontAwesomeIcon icon={faTimes} />
                                      </button>
                                    </div>
                                  ))}
                                  <button
                                    type="button"
                                    className="pa-add-letter"
                                    onClick={() => {
                                      // Show custom modal instead of browser prompt
                                      const modal = document.createElement('div');
                                      modal.style.cssText = `
                                        position: fixed;
                                        top: 0;
                                        left: 0;
                                        width: 100%;
                                        height: 100%;
                                        background: rgba(0,0,0,0.5);
                                        display: flex;
                                        justify-content: center;
                                        align-items: center;
                                        z-index: 10000;
                                      `;
                                      
                                      const modalContent = document.createElement('div');
                                      modalContent.style.cssText = `
                                        background: white;
                                        padding: 20px;
                                        border-radius: 8px;
                                        box-shadow: 0 4px 20px rgba(0,0,0,0.3);
                                        min-width: 300px;
                                        max-width: 500px;
                                      `;
                                      
                                      modalContent.innerHTML = `
                                        <h3 style="margin: 0 0 15px 0; color: #333;">Add Distractor Letter</h3>
                                        <p style="margin: 0 0 15px 0; color: #666; font-size: 14px;">Enter a letter to add as a distractor option for students</p>
                                        <input 
                                          type="text" 
                                          id="letterInput" 
                                          placeholder="Enter letter (e.g., a, B, c)"
                                          style="width: 100%; padding: 8px; border: 1px solid #ddd; border-radius: 4px; margin-bottom: 15px;"
                                          maxlength="1"
                                        />
                                        <div style="display: flex; gap: 10px; justify-content: flex-end;">
                                          <button id="cancelBtn" style="padding: 8px 16px; border: 1px solid #ddd; background: white; border-radius: 4px; cursor: pointer;">Cancel</button>
                                          <button id="addBtn" style="padding: 8px 16px; background: #007bff; color: white; border: none; border-radius: 4px; cursor: pointer;">Add Letter</button>
                                        </div>
                                      `;
                                      
                                      modal.appendChild(modalContent);
                                      document.body.appendChild(modal);
                                      
                                      const input = modalContent.querySelector('#letterInput');
                                      const cancelBtn = modalContent.querySelector('#cancelBtn');
                                      const addBtn = modalContent.querySelector('#addBtn');
                                      
                                      input.focus();
                                      
                                      let cleanup = () => {
                                        document.body.removeChild(modal);
                                      };
                                      
                                      cancelBtn.onclick = cleanup;
                                      addBtn.onclick = () => {
                                        const letter = input.value.trim();
                                        if (letter && /^[a-zA-Z]$/.test(letter)) {
                                          // Keep original case, don't force uppercase
                                          setQuestionFormData(prev => ({
                                            ...prev,
                                            dragElements: [...(prev.dragElements || []), letter]
                                          }));
                                          cleanup();
                                        } else {
                                          alert('Please enter a single letter (a-z or A-Z)');
                                        }
                                      };
                                      
                                      // Close on escape key
                                      const handleKeyPress = (e) => {
                                        if (e.key === 'Escape') cleanup();
                                        if (e.key === 'Enter') addBtn.click();
                                      };
                                      document.addEventListener('keydown', handleKeyPress);
                                      modal.addEventListener('click', (e) => {
                                        if (e.target === modal) cleanup();
                                      });
                                      
                                      // Clean up event listener when modal is removed
                                      const originalCleanup = cleanup;
                                      cleanup = () => {
                                        document.removeEventListener('keydown', handleKeyPress);
                                        originalCleanup();
                                      };
                                    }}
                                  >
                                    <FontAwesomeIcon icon={faPlus} /> Add Option
                                  </button>
                                </div>
                              </div>

                              <div className="pa-correct-answer">
                                <h5>Correct Answer <span className="pa-auto-generated">AUTO-GENERATED</span></h5>
                                <p>The correct letter that fills the selected blank position</p>
                                <div className="pa-answer-sequence">
                                  <div className="pa-answer-letter">
                                    <span className="pa-letter" style={{ textTransform: 'none' }}>{questionFormData.correctSequence?.[0] || ''}</span>
                                    <span className="pa-position">Missing Letter</span>
                                  </div>
                                </div>
                              </div>
                            </div>
                          )}

                          {/* Show configuration options when question text is selected */}
                          {!questionFormData.questionText && (
                            <div className="pa-select-question-prompt">
                              <FontAwesomeIcon icon={faInfoCircle} />
                              <span>Please select a question text above to see configuration options</span>
                            </div>
                          )}
                        </div>
                      )}

                      {/* Word Recognition - Fill Blank */}
                      {formData.category === "Word Recognition" && (
                        <div className="pa-form-section">
                          <div className="pa-section-header">
                            <FontAwesomeIcon icon={faImages} className="pa-section-icon" />
                            <h3>Word and Sound Configuration</h3>
                            <span className="pa-config-subtitle">Configure word with syllable/sound options</span>
                          </div>

                          {/* Sentence Completion */}
                          {questionFormData.questionText === "Basahin ang pangungusap. Piliin ang tamang salita mula sa hanay." && (
                            <div className="pa-word-recognition-sentence">
                              <div className="pa-section-title">
                                <h4>Sentence with Blank Position</h4>
                                <p className="pa-section-description">Enter the complete sentence, then mark which position should be blank for students to fill</p>
                              </div>

                              {/* Complete Sentence Input */}
                              <div className="pa-form-group">
                                <label className="pa-form-label">COMPLETE SENTENCE:</label>
                                <textarea
                                  placeholder="Naglalaro siya ng bola sa parke"
                                  value={questionFormData.displayWord || ''}
                                  onChange={(e) => {
                                    setQuestionFormData(prev => ({
                                      ...prev,
                                      displayWord: e.target.value
                                    }));
                                  }}
                                  className="pa-sentence-input"
                                />
                              </div>

                              {/* Select Blank Position */}
                              <div className="pa-form-group pa-blank-position-section">
                                <label className="pa-form-label">Select Blank Position:</label>
                                <p className="pa-help-text">Click on a position to make it blank. Click again to unselect and restore the letter.</p>
                                <div className="pa-word-tokens">
                                  {questionFormData.displayWord?.split(' ').map((word, index) => {
                                    // Check if this word is already a blank (contains underscores)
                                    const isBlank = word.startsWith('__') && word.endsWith('__');
                                    // Get the clean word without underscores for display
                                    const cleanWord = word.replace(/__/g, '');
                                    
                                    return (
                                      <button
                                        key={index}
                                        type="button"
                                        className={`pa-word-token ${isBlank ? 'blank' : ''}`}
                                        onClick={() => {
                                          const words = questionFormData.displayWord.split(' ');
                                          
                                          // Check if this is a "Basahin ang pangungusap" question
                                          const isSentenceReading = questionFormData.questionText === "Basahin ang pangungusap. Piliin ang tamang salita mula sa hanay.";
                                          
                                          if (isBlank) {
                                            // Remove blank - just use the clean word
                                            words[index] = cleanWord;
                                          } else {
                                            // For sentence reading questions, only allow one blank at a time
                                            if (isSentenceReading) {
                                              // First, remove any existing blanks
                                              for (let i = 0; i < words.length; i++) {
                                                if (words[i].startsWith('__') && words[i].endsWith('__')) {
                                                  words[i] = words[i].replace(/__/g, '');
                                                }
                                              }
                                            }
                                            // Add blank - wrap the word with underscores
                                            words[index] = `__${word}__`;
                                          }
                                          setQuestionFormData(prev => ({
                                            ...prev,
                                            displayWord: words.join(' ')
                                          }));
                                        }}
                                      >
                                        {cleanWord}
                                      </button>
                                    );
                                  })}
                                </div>
                              </div>

                              {/* Preview Section */}
                              <div className="pa-form-group pa-preview-section">
                                <label className="pa-form-label">PREVIEW (WHAT STUDENTS WILL SEE):</label>
                                <div className="pa-sentence-preview">
                                  {questionFormData.displayWord?.replace(/__([^_]+)__/g, ' ___ ') || ''}
                                </div>
                              </div>

                              {/* Available Letters Section */}
                              <div className="pa-form-group pa-available-letters-section">
                                <label className="pa-form-label">Available Letters (Student Options)</label>
                                <p className="pa-help-text">Letters students can choose from to fill the blank (includes correct answer + distractors)</p>
                                <button
                                  type="button"
                                  className="pa-auto-populate-btn"
                                  style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '8px',
                                    width: 'auto',
                                    minWidth: '200px',
                                    fontSize: '14px',
                                    fontWeight: '600'
                                  }}
                                  onClick={(e) => {
                                    e.preventDefault();
                                    
                                    // Disable button temporarily to show it's working
                                    e.target.disabled = true;
                                    e.target.style.opacity = '0.7';
                                    e.target.innerHTML = '<span>🔄 Generating...</span>';
                                    
                                    setTimeout(() => {
                                      try {
                                        // Get the blanked word from displayWord
                                        const displayWord = questionFormData.displayWord || '';
                                        const blankMatch = displayWord.match(/__([^_]+)__/);
                                        const correctAnswer = blankMatch ? blankMatch[1].trim() : '';
                                        
                                        if (correctAnswer) {
                                          // Create distractors - common words for sentence completion
                                          const commonWords = ['bola', 'papel', 'kutsara', 'damit', 'libro', 'laruan', 'sapatos', 'tubig', 'mesa', 'silla', 'pusa', 'aso', 'bahay', 'kotse', 'payong', 'lapis', 'upuan', 'aklat', 'plato', 'baso'];
                                          const distractors = commonWords
                                            .filter(word => word.toLowerCase() !== correctAnswer.toLowerCase())
                                            .slice(0, 3);
                                          // Preserve the original case of the correct answer, lowercase distractors
                                          const availableOptions = [correctAnswer, ...distractors];
                                          
                                          setQuestionFormData(prev => ({
                                            ...prev,
                                            blankOptions: availableOptions,
                                            correctAnswer: [correctAnswer]
                                          }));
                                          
                                          // Success feedback with toast instead of alert
                                          toast.success(`Generated ${availableOptions.length} options with "${correctAnswer}" as the correct answer!`);
                                        } else {
                                          // Fallback: if no blank selected, show generic options
                                          const genericWords = ['bola', 'papel', 'kutsara', 'damit'];
                                          setQuestionFormData(prev => ({
                                            ...prev,
                                            blankOptions: genericWords,
                                            correctAnswer: []
                                          }));
                                          toast.warning('Please select a blank position first by clicking on a word above. Added generic options for now.');
                                        }
                                      } catch (error) {
                                        toast.error('Error generating options. Please try again.');
                                        console.error('Auto-populate error:', error);
                                      }
                                      
                                      // Re-enable button
                                      e.target.disabled = false;
                                      e.target.style.opacity = '1';
                                      e.target.innerHTML = '<i class="fas fa-graduation-cap"></i> AUTO-POPULATE WITH DISTRACTORS';
                                    }, 500);
                                  }}
                                >
                                  <FontAwesomeIcon icon={faGraduationCap} /> AUTO-POPULATE WITH DISTRACTORS
                                </button>

                                <div className="pa-answer-options">
                                  <div className="pa-answer-items">
                                  {questionFormData.blankOptions?.map((option, index) => (
                                    <div key={index} className="pa-answer-item">
                                      <input
                                        type="text"
                                        value={option}
                                        onChange={(e) => {
                                          const updatedOptions = [...(questionFormData.blankOptions || [])];
                                          // Preserve the original case entered by teacher
                                          updatedOptions[index] = e.target.value;
                                          setQuestionFormData(prev => ({
                                            ...prev,
                                            blankOptions: updatedOptions
                                          }));
                                        }}
                                        className="pa-answer-input"
                                      />
                                      <button
                                        type="button"
                                        className="pa-answer-correct-btn"
                                        onClick={() => {
                                          // For sentence completion, only allow one correct answer
                                          const correctAnswers = questionFormData.correctAnswer || [];
                                          const isCorrect = correctAnswers.includes(option);
                                          
                                          if (questionFormData.questionText === "Basahin ang pangungusap. Piliin ang tamang salita mula sa hanay.") {
                                            if (isCorrect) {
                                              // Remove this option as correct
                                              setQuestionFormData(prev => ({
                                                ...prev,
                                                correctAnswer: []
                                              }));
                                            } else {
                                              // Set this as the only correct answer
                                              setQuestionFormData(prev => ({
                                                ...prev,
                                                correctAnswer: [option]
                                              }));
                                            }
                                          } else {
                                            // For other question types, allow multiple correct answers
                                            if (isCorrect) {
                                              setQuestionFormData(prev => ({
                                                ...prev,
                                                correctAnswer: correctAnswers.filter(a => a !== option)
                                              }));
                                            } else {
                                              setQuestionFormData(prev => ({
                                                ...prev,
                                                correctAnswer: [...correctAnswers, option]
                                              }));
                                            }
                                          }
                                        }}
                                      >
                                        <FontAwesomeIcon
                                          icon={faCheckCircle}
                                          className={questionFormData.correctAnswer?.includes(option) ? 'correct' : ''}
                                        />
                                        {questionFormData.correctAnswer?.includes(option) ? 'Correct' : ''}
                                      </button>
                                      <button
                                        type="button"
                                        className="pa-remove-answer"
                                        onClick={() => {
                                          const optionToRemove = option;
                                          const updatedOptions = questionFormData.blankOptions.filter((_, i) => i !== index);
                                          
                                          // Also remove from correctAnswer if it was marked as correct
                                          const updatedCorrectAnswers = questionFormData.correctAnswer?.filter(answer => answer !== optionToRemove) || [];
                                          
                                          setQuestionFormData(prev => ({
                                            ...prev,
                                            blankOptions: updatedOptions,
                                            correctAnswer: updatedCorrectAnswers
                                          }));
                                        }}
                                        title="Remove this option"
                                      >
                                        <FontAwesomeIcon icon={faTimes} />
                                      </button>
                                    </div>
                                  ))}
                                </div>

                                {/* Add Answer Option Input */}
                                {!showAddAnswerInput ? (
                                  <button
                                    type="button"
                                    className="pa-add-answer-btn"
                                    onClick={() => setShowAddAnswerInput(true)}
                                  >
                                    <FontAwesomeIcon icon={faPlus} /> Add Answer Option
                                  </button>
                                ) : (
                                  <div className="pa-add-option-input">
                                    <input
                                      type="text"
                                      placeholder="Enter answer option"
                                      value={newAnswerOption}
                                      onChange={(e) => {
                                        // Preserve the original case entered by teacher
                                        setNewAnswerOption(e.target.value);
                                      }}
                                      className="pa-new-option-input"
                                      autoFocus
                                      onKeyDown={(e) => {
                                        if (e.key === 'Enter' && newAnswerOption.trim()) {
                                          // Preserve the original case entered by teacher
                                          const optionToAdd = newAnswerOption.trim();
                                          setQuestionFormData(prev => ({
                                            ...prev,
                                            blankOptions: [...(prev.blankOptions || []), optionToAdd]
                                          }));
                                          setNewAnswerOption('');
                                          setShowAddAnswerInput(false);
                                        }
                                      }}
                                    />
                                    <button
                                      type="button"
                                      className="pa-add-option-confirm"
                                      onClick={() => {
                                        if (newAnswerOption.trim()) {
                                          // Preserve the original case entered by teacher
                                          const optionToAdd = newAnswerOption.trim();
                                          setQuestionFormData(prev => ({
                                            ...prev,
                                            blankOptions: [...(prev.blankOptions || []), optionToAdd]
                                          }));
                                          setNewAnswerOption('');
                                          setShowAddAnswerInput(false);
                                        }
                                      }}
                                    >
                                      <FontAwesomeIcon icon={faCheckCircle} />
                                    </button>
                                    <button
                                      type="button"
                                      className="pa-add-option-cancel"
                                      onClick={() => {
                                        setNewAnswerOption('');
                                        setShowAddAnswerInput(false);
                                      }}
                                    >
                                      <FontAwesomeIcon icon={faTimes} />
                                    </button>
                                  </div>
                                )}
                              </div>
                              </div>

                              {/* Correct Answer Section */}
                              <div className="pa-form-group pa-correct-answer-section">
                                <label className="pa-form-label">Correct Answer <span className="pa-auto-generated">AUTO-GENERATED</span></label>
                                <p className="pa-help-text">The correct word that fills the selected blank position</p>
                                <div className="pa-answer-sequence">
                                  <div className="pa-answer-letter">
                                    <span className="pa-letter">
                                      {(() => {
                                        // First try to get from correctAnswer array (from marked correct options)
                                        if (questionFormData.correctAnswer && questionFormData.correctAnswer.length > 0) {
                                          return questionFormData.correctAnswer[0];
                                        }
                                        
                                        // Fallback: try to extract from displayWord if there's a blank pattern
                                        const blankMatch = questionFormData.displayWord?.match(/__([^_]+)__/);
                                        if (blankMatch) {
                                          return blankMatch[1];
                                        }
                                        
                                        // If no correct answer set, show placeholder
                                        return '';
                                      })()}
                                    </span>
                                    <span className="pa-position">{questionFormData.correctAnswer && questionFormData.correctAnswer.length > 0 ? 'CORRECT ANSWER' : 'NO ANSWER SET'}</span>
                                  </div>
                                </div>
                              </div>
                            </div>
                          )}

                          {/* Sound/Syllable Recognition */}
                          {questionFormData.questionText === "Anong kasing tunog ng salitang nakikita?" && (
                            <div className="pa-word-recognition-sound">
                              <div className="pa-section-title">
                                <h4>Word and Sound Configuration</h4>
                                <p className="pa-section-description">Set up a word that students will identify matching sounds or syllables for</p>
                              </div>

                              {/* Display Word Input */}
                              <div className="pa-form-group">
                                <label className="pa-form-label">Display Word:</label>
                                <input
                                  type="text"
                                  placeholder="Sumbrero"
                                  value={questionFormData.displayWord || ''}
                                  onChange={(e) => {
                                    const sanitizedValue = e.target.value.replace(/[^a-zA-Z\s]/g, '');
                                    setQuestionFormData(prev => ({
                                      ...prev,
                                      displayWord: sanitizedValue
                                    }));
                                  }}
                                  className="pa-display-word-input pa-no-uppercase"
                                  style={{ 
                                    textTransform: 'none',
                                    WebkitTextTransform: 'none',
                                    MozTextTransform: 'none',
                                    msTextTransform: 'none',
                                    OTextTransform: 'none'
                                  }}
                                />
                              </div>

                              <div className="pa-answer-options">
                                <div className="pa-section-header">
                                  <h5>Answer Options</h5>
                                  <span className="pa-instruction">Include correct answers and distractors</span>
                                </div>
                                <p>Add syllables or sounds that students can choose from</p>

                                <div className="pa-sound-options">
                                  {questionFormData.blankOptions?.map((option, index) => (
                                    <div key={index} className="pa-sound-option">
                                      <input
                                        type="text"
                                        value={option}
                                        onChange={(e) => {
                                          const updatedOptions = [...(questionFormData.blankOptions || [])];
                                          updatedOptions[index] = e.target.value;
                                          setQuestionFormData(prev => ({
                                            ...prev,
                                            blankOptions: updatedOptions
                                          }));
                                        }}
                                        className="pa-sound-input pa-no-uppercase"
                                        style={{ 
                                          textTransform: 'none',
                                          WebkitTextTransform: 'none',
                                          MozTextTransform: 'none',
                                          msTextTransform: 'none',
                                          OTextTransform: 'none'
                                        }}
                                      />
                                      <div className="pa-sound-controls">
                                        <label>
                                          <input
                                            type="radio"
                                            name="correctAnswer"
                                            checked={questionFormData.correctAnswer === option}
                                            onChange={() => {
                                              // Only allow one correct answer
                                                setQuestionFormData(prev => ({
                                                  ...prev,
                                                correctAnswer: option
                                              }));
                                            }}
                                          />
                                          <FontAwesomeIcon icon={faCheckCircle} />
                                          Correct
                                        </label>
                                        <button
                                          type="button"
                                          className="pa-remove-sound"
                                          onClick={() => {
                                            const optionToRemove = option;
                                            const updatedOptions = questionFormData.blankOptions.filter((_, i) => i !== index);
                                            
                                            // Clear correctAnswer if the removed option was the correct one
                                            const updatedCorrectAnswer = questionFormData.correctAnswer === optionToRemove ? null : questionFormData.correctAnswer;
                                            
                                            setQuestionFormData(prev => ({
                                              ...prev,
                                              blankOptions: updatedOptions,
                                              correctAnswer: updatedCorrectAnswer
                                            }));
                                          }}
                                          title="Remove this sound option"
                                        >
                                          <FontAwesomeIcon icon={faTimes} />
                                        </button>
                                      </div>
                                    </div>
                                  ))}
                                </div>

                                {/* Add Sound Option Input */}
                                {!showAddSoundInput ? (
                                  <button
                                    type="button"
                                    className="pa-add-sound-btn"
                                    onClick={() => setShowAddSoundInput(true)}
                                  >
                                    <FontAwesomeIcon icon={faPlus} /> Add Sound Option
                                  </button>
                                ) : (
                                  <div className="pa-add-option-input">
                                    <input
                                      type="text"
                                      placeholder="Enter sound/syllable option (e.g., lib, ro)"
                                      value={newSoundOption}
                                      onChange={(e) => setNewSoundOption(e.target.value.replace(/[^a-zA-Z\s]/g, ''))}
                                      className="pa-new-option-input"
                                      style={{ 
                                        textTransform: 'none',
                                        WebkitTextTransform: 'none',
                                        MozTextTransform: 'none',
                                        msTextTransform: 'none',
                                        OTextTransform: 'none'
                                      }}
                                      autoFocus
                                      onKeyDown={(e) => {
                                        if (e.key === 'Enter' && newSoundOption.trim()) {
                                          setQuestionFormData(prev => ({
                                            ...prev,
                                            blankOptions: [...(prev.blankOptions || []), newSoundOption.trim()]
                                          }));
                                          setNewSoundOption('');
                                          setShowAddSoundInput(false);
                                        }
                                      }}
                                    />
                                    <button
                                      type="button"
                                      className="pa-add-option-confirm"
                                      onClick={() => {
                                        if (newSoundOption.trim()) {
                                          setQuestionFormData(prev => ({
                                            ...prev,
                                            blankOptions: [...(prev.blankOptions || []), newSoundOption.trim()]
                                          }));
                                          setNewSoundOption('');
                                          setShowAddSoundInput(false);
                                        }
                                      }}
                                    >
                                      <FontAwesomeIcon icon={faCheckCircle} />
                                    </button>
                                    <button
                                      type="button"
                                      className="pa-add-option-cancel"
                                      onClick={() => {
                                        setNewSoundOption('');
                                        setShowAddSoundInput(false);
                                      }}
                                    >
                                      <FontAwesomeIcon icon={faTimes} />
                                    </button>
                                  </div>
                                )}
                              </div>

                              <div className="pa-correct-answers">
                                <h5>Correct Answer <span className="pa-selected-options">SELECTED FROM OPTIONS</span></h5>
                                <p>Select the correct option above to mark it as the correct answer</p>
                                <div className="pa-correct-sounds-display">
                                  {questionFormData.correctAnswer ? (
                                    <div className="pa-correct-sound-item">
                                      <span style={{ textTransform: 'none', fontWeight: '600' }}>{questionFormData.correctAnswer}</span>
                                      <button
                                        type="button"
                                        className="pa-remove-correct-answer"
                                        onClick={() => {
                                          setQuestionFormData(prev => ({
                                            ...prev,
                                            correctAnswer: null
                                          }));
                                        }}
                                        title="Remove from correct answers"
                                        style={{
                                          background: 'none',
                                          border: 'none',
                                          cursor: 'pointer',
                                          color: '#ef4444',
                                          marginLeft: '8px',
                                          padding: '4px',
                                          borderRadius: '50%',
                                          display: 'flex',
                                          alignItems: 'center',
                                          justifyContent: 'center',
                                          transition: 'all 0.2s ease'
                                        }}
                                        onMouseEnter={(e) => {
                                          e.target.style.backgroundColor = '#fef2f2';
                                          e.target.style.color = '#dc2626';
                                        }}
                                        onMouseLeave={(e) => {
                                          e.target.style.backgroundColor = 'transparent';
                                          e.target.style.color = '#ef4444';
                                        }}
                                      >
                                        <FontAwesomeIcon icon={faTimes} />
                                      </button>
                                    </div>
                                  ) : (
                                    <div className="pa-no-correct-answer">
                                      <span style={{ color: '#6b7280', fontStyle: 'italic' }}>No correct answer selected</span>
                                    </div>
                                  )}
                                </div>
                              </div>
                            </div>
                          )}

                          {/* Show configuration prompt when no question text is selected */}
                          {(!questionFormData.questionText ||
                            (questionFormData.questionText !== "Basahin ang pangungusap. Piliin ang tamang salita mula sa hanay." &&
                              questionFormData.questionText !== "Anong kasing tunog ng salitang nakikita?")) && (
                              <div className="pa-select-question-prompt">
                                <FontAwesomeIcon icon={faInfoCircle} />
                                <span>Please select a question text above to see configuration options</span>
                              </div>
                            )}
                        </div>
                      )}

                      {/* Reading Comprehension - Proper Grid Positioning */}
                      {formData.category === "Reading Comprehension" && (
                        <div
                          className="pa-full-width"
                          style={{
                            gridColumn: '1 / -1',
                            display: 'flex',
                            flexDirection: 'column',
                            gap: '20px',
                            padding: '20px',
                            backgroundColor: '#f8fafc',
                            borderRadius: '8px',
                            border: '1px solid #e2e8f0'
                          }}
                        >
                          {console.log('🔧 [DEBUG] Reading Comprehension form rendering - questionFormData:', questionFormData)}
                       
                          {/* Show story context for subsequent questions */}
                          {questionFormData.passages === null && formData.category === "Reading Comprehension" && (
                            <div style={{
                              marginBottom: '24px',
                              padding: '16px',
                              backgroundColor: '#e0f2fe',
                              border: '1px solid #0891b2',
                              borderRadius: '8px',
                              textAlign: 'center'
                            }}>
                              <div style={{ fontSize: '14px', color: '#0891b2', fontWeight: '600' }}>
                                Adding Question to Story: "{questionFormData.storyTitle}"
                              </div>
                              <div style={{ fontSize: '12px', color: '#155e75', marginTop: '4px' }}>
                                This question will reference the existing story passages
                              </div>
                            </div>
                          )}

                          {/* Story Title Section - ALWAYS show for Reading Comprehension */}
                          <div className="pa-form-section" style={{ marginBottom: '24px' }}>
                            <h5 style={{ color: '#1e40af', marginBottom: '16px', fontSize: '16px', fontWeight: '600' }}>
                              <FontAwesomeIcon icon={faBook} style={{ marginRight: '8px', color: '#3b82f6' }} /> 
                              Story Information
                            </h5>
                            
                            <div className="pa-form-group">
                              <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', fontWeight: '500', color: '#374151' }}>
                                Story Title:
                                <Tooltip text="Enter the story title. The system will automatically detect if this story already exists." />
                              </label>
                              
                              {(() => {
                                const isEditing = currentQuestion !== null;
                                
                                // If editing existing question, show simple input with current value
                                if (isEditing) {
                                  return (
                                    <input
                                      type="text"
                                      value={questionFormData.storyTitle || ""}
                                      onChange={(e) => {
                                        setQuestionFormData(prev => ({
                                          ...prev,
                                          storyTitle: e.target.value
                                        }));
                                      }}
                                      placeholder="Story title"
                                      className="pa-text-input"
                                      style={{ width: '100%', padding: '10px', border: '1px solid #d1d5db', borderRadius: '6px' }}
                                    />
                                  );
                                }
                                
                                // For new questions - only text input for story title
                                return (
                                  <input
                                    type="text"
                                    value={questionFormData.storyTitle || ""}
                                    onChange={(e) => {
                                      setQuestionFormData(prev => ({
                                        ...prev,
                                        storyTitle: e.target.value
                                      }));
                                    }}
                                    placeholder="Type story title (e.g., Si Juan at ang Aso)"
                                    className="pa-text-input"
                                    style={{ width: '100%', padding: '10px', border: '1px solid #d1d5db', borderRadius: '6px' }}
                                    required
                                  />
                                );
                              })()}
                              
                              {formData.category === "Reading Comprehension" && questionFormData.storyTitle && hasExistingPassages(questionFormData.storyTitle) && (
                                <div style={{ 
                                  marginTop: '8px', 
                                  padding: '8px 12px', 
                                  backgroundColor: '#d1fae5', 
                                  border: '1px solid #a7f3d0', 
                                  borderRadius: '4px', 
                                  fontSize: '13px', 
                                  color: '#065f46' 
                                }}>
                                  <FontAwesomeIcon icon={faInfoCircle} style={{ marginRight: '6px' }} />
                                  This story already exists with passages. No need to add story pages again.
                                </div>
                              )}
                            </div>
                          </div>

                          {/* Story Pages Section - ALWAYS show for Reading Comprehension to ensure proper passages */}
                          {formData.category === "Reading Comprehension" && (
                            <div className="pa-form-section" style={{ marginBottom: '24px' }}>
                              <h5 style={{ color: '#1e40af', marginBottom: '16px', fontSize: '16px', fontWeight: '600' }}>
                                <FontAwesomeIcon icon={faBook} style={{ marginRight: '8px', color: '#3b82f6' }} /> 
                                Story Pages
                              </h5>
                              
                              <div style={{
                                marginBottom: '16px',
                                padding: '12px',
                                backgroundColor: '#fef3c7',
                                border: '1px solid #f59e0b',
                                borderRadius: '6px',
                                fontSize: '14px',
                                color: '#92400e'
                              }}>
                                <FontAwesomeIcon icon={faInfoCircle} style={{ marginRight: '8px' }} />
                                Please add the reading passages below. All Reading Comprehension questions must have proper story content.
                              </div>
                              
                              {/* CRITICAL FIX: ALWAYS provide editable passages - no null or empty arrays allowed */}
                              {(Array.isArray(questionFormData.passages) && questionFormData.passages.length > 0
                                ? questionFormData.passages
                                : [{ pageNumber: 1, pageText: "", pageImage: null }] // ALWAYS create at least one editable page
                              ).map((page, index) => (
                                <div key={index} style={{ 
                                  border: '1px solid #e5e7eb', 
                                  borderRadius: '6px', 
                                  padding: '16px', 
                                  marginBottom: '16px',
                                  backgroundColor: 'white'
                                }}>
                                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                                    <h6 style={{ margin: 0, color: '#374151', fontSize: '14px', fontWeight: '600' }}>Page {index + 1}</h6>
                                    {index > 0 && (
                                      <button
                                        type="button"
                                        onClick={() => {
                                          setQuestionFormData(prev => ({
                                            ...prev,
                                            // CRITICAL FIX: Handle null passages properly in filter
                                            passages: Array.isArray(prev.passages) ? prev.passages.filter((_, i) => i !== index) : []
                                          }));
                                        }}
                                        style={{
                                          background: '#ef4444',
                                          color: 'white',
                                          border: 'none',
                                          borderRadius: '4px',
                                          padding: '4px 8px',
                                          cursor: 'pointer',
                                          fontSize: '12px'
                                        }}
                                        title="Remove page"
                                      >
                                        <FontAwesomeIcon icon={faTimes} />
                                      </button>
                                    )}
                                  </div>

                                  <div className="pa-form-group">
                                    <label style={{ display: 'block', marginBottom: '6px', fontSize: '13px', fontWeight: '500', color: '#374151' }}>
                                      Page Text:
                                    </label>
                                    <textarea
                                      value={page?.pageText || ""}
                                      onChange={(e) => {
                                        // CRITICAL FIX: Handle null passages properly in text update
                                        const currentPassages = Array.isArray(questionFormData.passages) ? questionFormData.passages : [];
                                        const updatedPassages = [...currentPassages];
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
                                      rows={3}
                                      style={{
                                        width: '100%',
                                        padding: '8px',
                                        border: '1px solid #d1d5db',
                                        borderRadius: '4px',
                                        fontSize: '14px',
                                        resize: 'vertical'
                                      }}
                                    ></textarea>
                                  </div>

                                  <div className="pa-form-group">
                                    <label style={{ display: 'block', marginBottom: '6px', fontSize: '13px', fontWeight: '500', color: '#374151' }}>
                                      Page Image (Optional):
                                    </label>
                                    <div className="pa-file-upload">
                                      <label style={{
                                        display: 'inline-block',
                                        padding: '8px 16px',
                                        backgroundColor: '#3b82f6',
                                        color: 'white',
                                        borderRadius: '4px',
                                        cursor: 'pointer',
                                        fontSize: '13px'
                                      }}>
                                        <FontAwesomeIcon icon={faUpload} style={{ marginRight: '6px' }} /> Choose Image
                                        <input
                                          type="file"
                                          accept="image/*"
                                          onChange={(e) => handleFileUpload(e, `pageImage-${index}`)}
                                          style={{ display: 'none' }}
                                        />
                                      </label>
                                      <span style={{ marginLeft: '12px', fontSize: '13px', color: '#6b7280' }}>
                                        {page?.pageImage
                                          ? `Page ${index + 1} image uploaded`
                                          : "No file chosen"}
                                      </span>

                                      {page?.pageImage && (
                                        <div style={{ marginTop: '8px' }}>
                                          <img
                                            src={page?.pageImage}
                                            alt={`Page ${index + 1} preview`}
                                            style={{ maxWidth: '200px', maxHeight: '150px', borderRadius: '4px', border: '1px solid #e5e7eb' }}
                                          />
                                        </div>
                                      )}
                                    </div>
                                  </div>
                                </div>
                              ))}

                              <button
                                type="button"
                                onClick={() => {
                                  setQuestionFormData(prev => ({
                                    ...prev,
                                    passages: [
                                      // CRITICAL FIX: Handle null passages properly
                                      ...(Array.isArray(prev.passages) ? prev.passages : []),
                                      {
                                        pageNumber: (Array.isArray(prev.passages) ? prev.passages.length : 0) + 1,
                                        pageText: "",
                                        pageImage: null
                                      }
                                    ]
                                  }));
                                }}
                                style={{
                                  padding: '8px 16px',
                                  backgroundColor: '#10b981',
                                  color: 'white',
                                  border: 'none',
                                  borderRadius: '4px',
                                  cursor: 'pointer',
                                  fontSize: '13px'
                                }}
                              >
                                <FontAwesomeIcon icon={faPlus} style={{ marginRight: '6px' }} /> Add Page
                              </button>
                            </div>
                          )}

                          {/* Comprehension Questions Management */}
                          <div className="pa-form-section" style={{ marginBottom: '32px' }}>
                            <h5 style={{ 
                              color: '#1e40af', 
                              marginBottom: '24px', 
                              fontSize: '16px', 
                              fontWeight: '600',
                              display: 'flex',
                              alignItems: 'center'
                            }}>
                              <FontAwesomeIcon icon={faQuestion} style={{ marginRight: '8px', color: '#3b82f6' }} /> 
                              Comprehension Questions
                            </h5>

                            {/* Show existing comprehension questions */}
                            {questionFormData.comprehensionQuestions.length > 0 && (
                              <div style={{ marginBottom: '24px' }}>
                                <div style={{
                                  fontSize: '14px',
                                  fontWeight: '600',
                                  color: '#374151',
                                  marginBottom: '12px'
                                }}>
                                  Questions for this story ({questionFormData.comprehensionQuestions.length}):
                                </div>
                                
                                {questionFormData.comprehensionQuestions.map((question, index) => (
                                  <div key={index} style={{
                                    border: '2px solid #e5e7eb',
                                    borderRadius: '8px',
                                    padding: '16px',
                                    marginBottom: '12px',
                                    backgroundColor: 'white',
                                    position: 'relative'
                                  }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                                      <div style={{ flex: 1 }}>
                                        <div style={{
                                          fontWeight: '600',
                                          fontSize: '14px',
                                          color: '#374151',
                                          marginBottom: '8px'
                                        }}>
                                          Question {index + 1}: {question.questionText}
                                        </div>
                                        <div style={{
                                          fontSize: '13px',
                                          color: '#059669',
                                          marginBottom: '4px'
                                        }}>
                                          <strong>Answer:</strong> {question.correctAnswer}
                                        </div>
                                        {question.acceptableAnswers.length > 0 && (
                                          <div style={{
                                            fontSize: '12px',
                                            color: '#6b7280'
                                          }}>
                                            <strong>Variations:</strong> {question.acceptableAnswers.join(', ')}
                                          </div>
                                        )}
                                      </div>
                                      <div style={{ display: 'flex', gap: '8px', marginLeft: '16px' }}>
                                        <button
                                          type="button"
                                          onClick={() => editComprehensionQuestion(index)}
                                          style={{
                                            background: '#3b82f6',
                                            color: 'white',
                                            border: 'none',
                                            borderRadius: '6px',
                                            padding: '6px 12px',
                                            cursor: 'pointer',
                                            fontSize: '12px'
                                          }}
                                        >
                                          <FontAwesomeIcon icon={faEdit} />
                                        </button>
                                        <button
                                          type="button"
                                          onClick={() => deleteComprehensionQuestion(index)}
                                          style={{
                                            background: '#ef4444',
                                            color: 'white',
                                            border: 'none',
                                            borderRadius: '6px',
                                            padding: '6px 12px',
                                            cursor: 'pointer',
                                            fontSize: '12px'
                                          }}
                                        >
                                          <FontAwesomeIcon icon={faTrash} />
                                        </button>
                                      </div>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            )}

                            {/* Question Form Header */}
                            <div style={{
                              fontSize: '16px',
                              fontWeight: '600',
                              color: '#1e40af',
                              marginBottom: '20px'
                            }}>
                              {questionFormData.currentComprehensionIndex >= 0 ? 
                                `Edit Question ${questionFormData.currentComprehensionIndex + 1}` : 
                                'Add New Comprehension Question'
                              }
                            </div>

                            <div style={{ 
                              border: '2px solid #e1effe', 
                              borderRadius: '12px', 
                              padding: '32px', 
                              backgroundColor: 'white',
                              boxShadow: '0 2px 4px rgba(0, 0, 0, 0.05)'
                            }}>
                              {/* Question Text */}
                              <div className="pa-form-group" style={{ marginBottom: '28px' }}>
                                <label style={{ 
                                  display: 'block', 
                                  marginBottom: '8px', 
                                  fontSize: '14px', 
                                  fontWeight: '500', 
                                  color: '#374151'
                                }}>
                                  Question Text:
                                  <span style={{ color: '#ef4444', marginLeft: '4px' }}>*</span>
                                </label>
                                <input
                                  type="text"
                                  value={questionFormData.sentenceQuestions[0]?.questionText || ""}
                                  onChange={(e) => {
                                    setQuestionFormData(prev => ({
                                      ...prev,
                                      sentenceQuestions: [{
                                        ...prev.sentenceQuestions[0],
                                        questionText: e.target.value
                                      }]
                                    }));
                                  }}
                                  placeholder="Enter your question (e.g., 'Sino ang pangunahing tauhan?')"
                                  style={{
                                    width: '100%',
                                    padding: '12px 14px',
                                    border: '2px solid #d1d5db',
                                    borderRadius: '8px',
                                    fontSize: '14px',
                                    backgroundColor: '#fafafa',
                                    transition: 'border-color 0.2s ease',
                                    outline: 'none'
                                  }}
                                  onFocus={(e) => e.target.style.borderColor = '#3b82f6'}
                                  onBlur={(e) => e.target.style.borderColor = '#d1d5db'}
                                />
                              </div>

                              {/* Primary Answer */}
                              <div className="pa-form-group" style={{ marginBottom: '32px' }}>
                                <label style={{ 
                                  display: 'block', 
                                  marginBottom: '8px', 
                                  fontSize: '14px', 
                                  fontWeight: '500', 
                                  color: '#374151'
                                }}>
                                  Primary Correct Answer:
                                  <span style={{ color: '#ef4444', marginLeft: '4px' }}>*</span>
                                </label>
                                <input
                                  type="text"
                                  value={questionFormData.sentenceQuestions[0]?.correctAnswer || ""}
                                  onChange={(e) => {
                                    setQuestionFormData(prev => ({
                                      ...prev,
                                      sentenceQuestions: [{
                                        ...prev.sentenceQuestions[0],
                                        correctAnswer: e.target.value
                                      }]
                                    }));
                                  }}
                                  placeholder="Enter the main correct answer (e.g., 'Juan')"
                                  style={{
                                    width: '100%',
                                    padding: '12px 14px',
                                    border: '2px solid #10b981',
                                    borderRadius: '8px',
                                    fontSize: '14px',
                                    backgroundColor: '#f0fdf4',
                                    transition: 'border-color 0.2s ease',
                                    outline: 'none'
                                  }}
                                  onFocus={(e) => e.target.style.borderColor = '#059669'}
                                  onBlur={(e) => e.target.style.borderColor = '#10b981'}
                                />
                              </div>

                              {/* Answer Variations Section */}
                              <div className="pa-form-group">
                                <label style={{ 
                                  display: 'block', 
                                  marginBottom: '8px', 
                                  fontSize: '14px', 
                                  fontWeight: '500', 
                                  color: '#374151'
                                }}>
                                  Acceptable Answer Variations (Optional):
                                </label>
                                <div style={{ 
                                  fontSize: '12px', 
                                  color: '#6b7280', 
                                  marginBottom: '12px'
                                }}>
                                  Add different ways students might answer correctly (different cases, with/without titles, etc.)
                                </div>
                                
                                {/* Display existing acceptable answers */}
                                {(questionFormData.sentenceQuestions[0]?.acceptableAnswers || []).map((answer, index) => (
                                  <div key={index} style={{ 
                                    display: 'flex', 
                                    alignItems: 'center', 
                                    marginBottom: '8px'
                                  }}>
                                    <input
                                      type="text"
                                      value={answer}
                                      onChange={(e) => {
                                        const updatedAnswers = [...(questionFormData.sentenceQuestions[0]?.acceptableAnswers || [])];
                                        updatedAnswers[index] = e.target.value;
                                        setQuestionFormData(prev => ({
                                          ...prev,
                                          sentenceQuestions: [{
                                            ...prev.sentenceQuestions[0],
                                            acceptableAnswers: updatedAnswers
                                          }]
                                        }));
                                      }}
                                      placeholder={`Variation ${index + 1}`}
                                      style={{
                                        flex: 1,
                                        padding: '8px 12px',
                                        border: '1px solid #d1d5db',
                                        borderRadius: '6px',
                                        fontSize: '14px',
                                        marginRight: '8px'
                                      }}
                                    />
                                    <button
                                      type="button"
                                      onClick={() => removeAcceptableAnswer(index)}
                                      style={{
                                        background: '#ef4444',
                                        color: 'white',
                                        border: 'none',
                                        borderRadius: '4px',
                                        padding: '6px 8px',
                                        cursor: 'pointer'
                                      }}
                                    >
                                      <FontAwesomeIcon icon={faTimes} />
                                    </button>
                                  </div>
                                ))}

                                {/* Add new acceptable answer button */}
                                <button
                                  type="button"
                                  onClick={() => addAcceptableAnswer('')}
                                  style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    padding: '10px 16px',
                                    backgroundColor: '#10b981',
                                    color: 'white',
                                    border: 'none',
                                    borderRadius: '8px',
                                    cursor: 'pointer',
                                    fontSize: '14px',
                                    fontWeight: '500',
                                    width: '100%',
                                    marginTop: '8px',
                                    transition: 'all 0.2s ease'
                                  }}
                                  onMouseEnter={(e) => {
                                    e.target.style.backgroundColor = '#059669';
                                    e.target.style.transform = 'translateY(-1px)';
                                  }}
                                  onMouseLeave={(e) => {
                                    e.target.style.backgroundColor = '#10b981';
                                    e.target.style.transform = 'translateY(0)';
                                  }}
                                >
                                  <FontAwesomeIcon icon={faPlus} style={{ marginRight: '6px' }} />
                                  Add Answer Variation
                                </button>

                              </div>

                              {/* Action Buttons */}
                              <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end', marginTop: '32px' }}>
                                {questionFormData.currentComprehensionIndex >= 0 && (
                                  <button
                                    type="button"
                                    onClick={cancelComprehensionEdit}
                                    style={{
                                      padding: '10px 20px',
                                      backgroundColor: '#6b7280',
                                      color: 'white',
                                      border: 'none',
                                      borderRadius: '8px',
                                      cursor: 'pointer',
                                      fontSize: '14px'
                                    }}
                                  >
                                    Cancel
                                  </button>
                                )}
                                
                                <button
                                  type="button"
                                  onClick={() => {
                                    if (!questionFormData.sentenceQuestions[0]?.questionText?.trim()) {
                                      toast.error('Please enter a question text.');
                                      return;
                                    }
                                    if (!questionFormData.sentenceQuestions[0]?.correctAnswer?.trim()) {
                                      toast.error('Please enter a correct answer.');
                                      return;
                                    }
                                    
                                    if (questionFormData.currentComprehensionIndex >= 0) {
                                      saveComprehensionQuestion();
                                    } else {
                                      addComprehensionQuestion();
                                    }
                                  }}
                                  style={{
                                    padding: '10px 20px',
                                    backgroundColor: '#3b82f6',
                                    color: 'white',
                                    border: 'none',
                                    borderRadius: '8px',
                                    cursor: 'pointer',
                                    fontSize: '14px',
                                    fontWeight: '500'
                                  }}
                                >
                                  <FontAwesomeIcon icon={questionFormData.currentComprehensionIndex >= 0 ? faEdit : faPlus} style={{ marginRight: '8px' }} />
                                  {questionFormData.currentComprehensionIndex >= 0 ? 'Update Question' : 'Add Question'}
                                </button>
                              </div>

                              <div style={{ 
                                marginTop: '16px', 
                                padding: '12px', 
                                backgroundColor: '#eff6ff', 
                                border: '1px solid #bfdbfe', 
                                borderRadius: '8px', 
                                fontSize: '13px', 
                                color: '#1e40af' 
                              }}>
                                <FontAwesomeIcon icon={faInfoCircle} style={{ marginRight: '6px' }} />
                                Each question will be saved as a separate assessment with the same story title. The first question includes the story passages, subsequent questions reference them.
                              </div>
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
                        style={{
                          padding: '10px 16px',
                          fontSize: '14px',
                          fontWeight: '500',
                          borderRadius: '6px'
                        }}
                      >
                        <FontAwesomeIcon icon={faTimes} /> Cancel
                      </button>
                      
                      
                      <button
                        type="button"
                        className="pa-save-question-btn"
                        onClick={handleQuestionFormSubmit}
                        style={{
                          padding: '10px 16px',
                          fontSize: '14px',
                          fontWeight: '500',
                          borderRadius: '6px'
                        }}
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
                    <p className="pa-form-description">
                      {modalType === 'create' ? 'Build targeted assessments to evaluate student progress in specific reading skills and categories.' : 'Update and modify your assessment content, questions, and settings to better serve your students\' learning needs.'}
                    </p>
                  </div>

                  {/* Assessment Configuration Section */}
                  <div className="pa-form-section">
                    <h5>
                      <FontAwesomeIcon icon={faInfoCircle} className="pa-header-icon" />
                      Assessment Configuration
                    </h5>

                    <div className="pa-form-row">
                      <div className="pa-form-group">
                        <label htmlFor="readingLevel" className="pa-form-label">
                          <FontAwesomeIcon icon={faGraduationCap} className="pa-label-icon" />
                          Reading Level
                          <span className="pa-required-field">*</span>
                          <Tooltip text="Select the CRLA reading level this assessment targets. This determines the appropriate difficulty and skill expectations." />
                        </label>
                        <select
                          id="readingLevel"
                          name="readingLevel"
                          value={formData.readingLevel}
                          onChange={handleFormChange}
                          required
                          disabled={modalType === 'edit'}
                          className={`pa-select-input ${modalType === 'edit' ? 'pa-disabled-input' : ''} ${modalType === 'create' && formData.readingLevel && formData.category && !canCreateAssessment(formData.readingLevel, formData.category).canCreate ? 'pa-select-error' : ''}`}
                        >
                          <option value="">Choose a reading level...</option>
                          <option value="Low Emerging">Low Emerging</option>
                          <option value="High Emerging">High Emerging</option>
                          <option value="Developing">Developing</option>
                          <option value="Transitioning">Transitioning</option>
                          <option value="At Grade Level">At Grade Level</option>
                        </select>
                        {modalType === 'edit' && (
                          <div className="pa-help-text">
                            <FontAwesomeIcon icon={faInfoCircle} />
                            Reading level cannot be changed during editing to maintain data consistency.
                          </div>
                        )}
                      </div>

                      <div className="pa-form-group">
                        <label htmlFor="category" className="pa-form-label">
                          <FontAwesomeIcon icon={faListUl} className="pa-label-icon" />
                          Assessment Category
                          <span className="pa-required-field">*</span>
                          <Tooltip text="Choose the specific reading skill area this assessment will evaluate. Each category has specialized question types." />
                        </label>
                        <select
                          id="category"
                          name="category"
                          value={formData.category}
                          onChange={(e) => {
                            console.log('🔧 [DEBUG] Category dropdown changed - value:', e.target.value);
                            handleFormChange(e);
                          }}
                          required
                          disabled={modalType === 'edit'}
                          className={`pa-select-input ${modalType === 'edit' ? 'pa-disabled-input' : ''} ${modalType === 'create' && formData.readingLevel && formData.category && !canCreateAssessment(formData.readingLevel, formData.category).canCreate ? 'pa-select-error' : ''}`}
                        >
                          <option value="">Choose a category...</option>
                          <option value="Alphabet Knowledge">Alphabet Knowledge</option>
                          <option value="Phonological Awareness">Phonological Awareness</option>
                          <option value="Decoding">Decoding</option>
                          <option value="Word Recognition">Word Recognition</option>
                          <option value="Reading Comprehension">Reading Comprehension</option>
                        </select>
                        {modalType === 'edit' && (
                          <div className="pa-help-text">
                            <FontAwesomeIcon icon={faInfoCircle} />
                            Category cannot be changed during editing to maintain question type consistency.
                          </div>
                        )}

                        {modalType === 'create' && formData.readingLevel && formData.category && !canCreateAssessment(formData.readingLevel, formData.category).canCreate && (
                          <div className="pa-combination-error">
                            <FontAwesomeIcon icon={faExclamationTriangle} />
                            <strong>Assessment Already Exists!</strong>
                            <br />This combination of reading level and category already has an assessment. Only one assessment per reading level and category is allowed.
                            <button
                              type="button"
                              className="pa-edit-existing-link"
                              onClick={() => {
                                setShowModal(false);
                                const existing = checkExistingAssessment(formData.readingLevel, formData.category);
                                if (existing) {
                                  setTimeout(() => handleEditAssessment(existing), 300);
                                }
                              }}
                            >
                              <FontAwesomeIcon icon={faEdit} /> Edit Existing Assessment Instead
                            </button>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Assessment Status Display for Edit Mode */}
                    {modalType === 'edit' && selectedAssessment && (
                      <div className="pa-assessment-status-display">
                        <div className="pa-status-item">
                          <span className="pa-status-label">Current Status:</span>
                          <span className={`pa-status-badge ${selectedAssessment.status === 'active' ? 'pa-status-active' : selectedAssessment.status === 'inactive' ? 'pa-status-inactive' : 'pa-status-draft'}`}>
                            <FontAwesomeIcon icon={selectedAssessment.status === 'active' ? faCheckCircle : selectedAssessment.status === 'inactive' ? faTimesCircle : faClock} />
                            {selectedAssessment.status === 'active' ? 'Active' : selectedAssessment.status === 'inactive' ? 'Inactive' : 'Draft'}
                          </span>
                        </div>
                        <div className="pa-status-item">
                          <span className="pa-status-label">Last Updated:</span>
                          <span className="pa-status-value">{new Date(selectedAssessment.updatedAt || selectedAssessment.createdAt).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' })}</span>
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="pa-form-section">
                    <div className="pa-questions-header">
                      <h5>
                        <FontAwesomeIcon icon={faFileAlt} />
                        Assessment Questions
                      </h5>
                      <div className="pa-questions-stats">
                        <span className="pa-questions-count">
                          {formData.questions.length} questions added
                        </span>
                        <button
                          type="button"
                          className="pa-add-question-btn"
                          onClick={() => {
                            console.log('🔧 [DEBUG] Add Question button clicked - formData:', formData);
                            console.log('🔧 [DEBUG] Add Question button - formData.category:', formData.category);
                            console.log('🔧 [DEBUG] Add Question button - formData.readingLevel:', formData.readingLevel);
                            handleAddQuestion();
                          }}
                          disabled={!formData.category || (modalType === 'create' && formData.readingLevel && formData.category && !canCreateAssessment(formData.readingLevel, formData.category).canCreate)}
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
                        <>
                          <div className="pa-question-list">
                          {formData.questions.map((question, index) => (
                            <div key={index} className="pa-question-item">
                              <div className="pa-question-item-header">
                                <div className="pa-question-info">
                                  <span className="pa-question-number">Q{index + 1}</span>
                                  <div className="pa-question-details">
                                    <span className="pa-question-category">
                                      {getQuestionTypeDisplay(question.questionType, question.questionSubtype)}
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

                        </>
                      )}
                    </div>
                  </div>

                  {/* Admin approval message removed */}
                </div>
              )}
            </div>

            <div className={modalType === 'preview' ? 'ap-modal-footer' : 'pa-modal-footer'}>
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
                  className="ap-close-btn"
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
                    disabled={!formData.readingLevel || !formData.category || formData.questions.length === 0 || (modalType === 'create' && !canCreateAssessment(formData.readingLevel, formData.category).canCreate)}
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
              <h3><FontAwesomeIcon icon={modalType === 'create' ? faPlus : faEdit} className="pa-modal-header-icon" />
                {modalType === 'create' ? 'Create Assessment' : 'Save Changes'}
              </h3>
              <button
                className="pa-modal-close"
                onClick={() => setSubmitConfirmDialog(false)}
              >
                <FontAwesomeIcon icon={faTimes} />
              </button>
            </div>

            <div className="pa-modal-body">
              <div className="pa-confirm-icon">
                <FontAwesomeIcon icon={modalType === 'create' ? faPlus : faEdit} />
              </div>
              <div className="pa-confirm-message">
                <p>You're about to {modalType === 'create' ? 'create a new' : 'update this'} assessment.</p>
                <p>Once saved, it will be immediately available in the system.</p>
                <p className="pa-confirm-question">Would you like to proceed?</p>
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
                <FontAwesomeIcon icon={modalType === 'create' ? faPlus : faEdit} />
                {modalType === 'create' ? 'Create Assessment' : 'Save Changes'}
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

                        <div className="pa-existing-assessment-details">
                          <h5>Existing Assessment Details:</h5>
                          <div className="pa-existing-detail">
                            <span className="pa-existing-label">Status:</span>
                            <span className={`pa-existing-value ${existing.isActive ? 'active' : 'inactive'}`}>
                              <FontAwesomeIcon icon={existing.isActive ? faCheckCircle : faExclamationTriangle} />
                              {existing.isActive ? 'Active' : 'Inactive'}
                            </span>
                          </div>
                          <div className="pa-existing-detail">
                            <span className="pa-existing-label">Questions:</span>
                            <span className="pa-existing-value">{existing.questions?.length || 0}</span>
                          </div>
                          <div className="pa-existing-detail">
                            <span className="pa-existing-label">ID:</span>
                            <span className="pa-existing-value pa-existing-id">{existing._id}</span>
                          </div>
                        </div>
                      </div>
                    );
                  }
                })()}

                <div className="pa-restriction-options">
                  <p>You can:</p>
                  <ul className="pa-restriction-list">
                    <li>Edit the existing assessment instead of creating a new one</li>
                    <li>Choose a different reading level or category combination</li>
                    <li>Deactivate or delete the existing assessment first</li>
                    <li>Contact an administrator if you need special assistance</li>
                  </ul>
                </div>
              </div>
            </div>

            <div className="pa-modal-footer">
              <button
                className="pa-modal-close-btn"
                onClick={() => setDuplicateRestrictionDialog(false)}
              >
                <FontAwesomeIcon icon={faTimes} /> Close
              </button>
            </div>
          </div>
        </div>
      )}


      <ToastContainer position="top-center" />
    </div>
  );
};

// To maintain compatibility, we export as both MainAssessment and the original PostAssessment name
export { MainAssessment as PostAssessment };
export default MainAssessment;