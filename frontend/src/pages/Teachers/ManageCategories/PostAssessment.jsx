// src/pages/Teachers/ManageCategories/PostAssessment.jsx
// This file has been renamed functionally to MainAssessment but kept the same filename for compatibility
import React, { useState, useEffect, useRef } from "react";
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
  faCloudUploadAlt,
  faClock,
  faTimesCircle,
  faListUl,
  faVolumeUp,
  faLink
} from "@fortawesome/free-solid-svg-icons";
import "../../../css/Teachers/ManageCategories/PostAssessment.css";
import "../../../css/Teachers/ManageCategories/PostAssessment-enhanced.css";
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

// Helper function for ordinal suffixes
const getOrdinalSuffix = (num) => {
  const suffixes = ['th', 'st', 'nd', 'rd'];
  const value = num % 100;
  return suffixes[(value - 20) % 10] || suffixes[value] || suffixes[0];
};

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
    currentComprehensionIndex: -1, // -1 means adding new, >=0 means editing existing
    tempComprehensionQuestion: {
      questionText: "",
      correctAnswer: "",
      acceptableAnswers: []
    }
  });
  const [previewPage, setPreviewPage] = useState(0);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [submitSuccessDialog, setSubmitSuccessDialog] = useState(false);
  const [showDistractorInput, setShowDistractorInput] = useState(false);
  const [distractorValue, setDistractorValue] = useState("");
  const [deleteSuccessDialog, setDeleteSuccessDialog] = useState(false);
  const [submitConfirmDialog, setSubmitConfirmDialog] = useState(false);
  const [duplicateRestrictionDialog, setDuplicateRestrictionDialog] = useState(false);
  const [restrictionReason, setRestrictionReason] = useState("");
  const [apiMessage, setApiMessage] = useState(null);
  
  // Add refs to track component stability and prevent race conditions
  const componentMounted = useRef(false);
  const questionFormInitializing = useRef(false);
  
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
            sentenceQuestions: []
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
          // Different formatting based on question type
          const isWordIdentification = question.questionText === "Tukuyin ang nasa larawan?";
          
          sanitized.displaySequence = Array.isArray(question.displaySequence) ? 
            question.displaySequence.map(item => {
              if (typeof item === 'string') {
                const cleaned = item.replace(/[^a-zA-Z]/g, '');
                return isWordIdentification ? cleaned.toUpperCase() : 
                       (cleaned.charAt(0).toUpperCase() + cleaned.slice(1).toLowerCase());
              }
              return item;
            }) : (isWordIdentification ? null : []);
          sanitized.blankPosition = typeof question.blankPosition === 'number' ? question.blankPosition : null;
          sanitized.dragElements = Array.isArray(question.dragElements) ? 
            question.dragElements.map(item => {
              if (typeof item === 'string') {
                const cleaned = item.replace(/[^a-zA-Z]/g, '');
                return isWordIdentification ? cleaned.toUpperCase() : 
                       (cleaned.charAt(0).toUpperCase() + cleaned.slice(1).toLowerCase());
              }
              return item;
            }) : [];
          sanitized.correctSequence = Array.isArray(question.correctSequence) ? 
            question.correctSequence.map(item => {
              if (typeof item === 'string') {
                const cleaned = item.replace(/[^a-zA-Z]/g, '');
                return isWordIdentification ? cleaned.toUpperCase() : 
                       (cleaned.charAt(0).toUpperCase() + cleaned.slice(1).toLowerCase());
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
          sanitized.sentenceQuestions = Array.isArray(question.sentenceQuestions) 
            ? question.sentenceQuestions.map(sq => ({
                questionText: sq.questionText || "",
                correctAnswer: sq.correctAnswer || "",
                acceptableAnswers: Array.isArray(sq.acceptableAnswers) ? sq.acceptableAnswers : []
              }))
            : [];
          // Note: acceptableAnswers should only exist within sentenceQuestions, not at question level
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
          if (!Array.isArray(question.sentenceQuestions) || question.sentenceQuestions.length === 0) {
            errors.push("Reading Comprehension must have sentence questions");
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

  // Component stability tracking
  useEffect(() => {
    componentMounted.current = true;
    
    return () => {
      componentMounted.current = false;
      questionFormInitializing.current = false;
    };
  }, []);

  useEffect(() => {
    // Fetch assessments data from the backend
    const fetchAssessments = async () => {
      try {
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
    // Validate required fields
    if (!questionFormData.tempComprehensionQuestion.questionText.trim()) {
      alert("Please enter a question text for the comprehension question.");
      return;
    }
    if (!questionFormData.tempComprehensionQuestion.correctAnswer.trim()) {
      alert("Please enter a correct answer for the comprehension question.");
      return;
    }

    const newQuestion = {
      questionText: questionFormData.tempComprehensionQuestion.questionText.trim(),
      correctAnswer: questionFormData.tempComprehensionQuestion.correctAnswer.trim(),
      acceptableAnswers: questionFormData.tempComprehensionQuestion.acceptableAnswers.map(ans => ans.trim()).filter(ans => ans)
    };

    const updatedQuestions = [...questionFormData.sentenceQuestions, newQuestion];
    
    setQuestionFormData(prev => ({
      ...prev,
      sentenceQuestions: updatedQuestions,
      tempComprehensionQuestion: {
        questionText: "",
        correctAnswer: "",
        acceptableAnswers: []
      },
      currentComprehensionIndex: -1
    }));
  };

  const editComprehensionQuestion = (index) => {
    const questionToEdit = questionFormData.sentenceQuestions[index];
    setQuestionFormData(prev => ({
      ...prev,
      currentComprehensionIndex: index,
      tempComprehensionQuestion: {
        questionText: questionToEdit.questionText,
        correctAnswer: questionToEdit.correctAnswer,
        acceptableAnswers: [...questionToEdit.acceptableAnswers]
      }
    }));
  };

  const saveComprehensionQuestion = () => {
    // Validate required fields
    if (!questionFormData.tempComprehensionQuestion.questionText.trim()) {
      alert("Please enter a question text for the comprehension question.");
      return;
    }
    if (!questionFormData.tempComprehensionQuestion.correctAnswer.trim()) {
      alert("Please enter a correct answer for the comprehension question.");
      return;
    }

    const updatedQuestions = [...questionFormData.sentenceQuestions];
    updatedQuestions[questionFormData.currentComprehensionIndex] = {
      questionText: questionFormData.tempComprehensionQuestion.questionText.trim(),
      correctAnswer: questionFormData.tempComprehensionQuestion.correctAnswer.trim(),
      acceptableAnswers: questionFormData.tempComprehensionQuestion.acceptableAnswers.map(ans => ans.trim()).filter(ans => ans)
    };
    
    setQuestionFormData(prev => ({
      ...prev,
      sentenceQuestions: updatedQuestions,
      tempComprehensionQuestion: {
        questionText: "",
        correctAnswer: "",
        acceptableAnswers: []
      },
      currentComprehensionIndex: -1
    }));
  };

  const deleteComprehensionQuestion = (index) => {
    const updatedQuestions = questionFormData.sentenceQuestions.filter((_, i) => i !== index);
    setQuestionFormData(prev => ({
      ...prev,
      sentenceQuestions: updatedQuestions,
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
    if (answer.trim() && !questionFormData.tempComprehensionQuestion.acceptableAnswers.includes(answer.trim())) {
      setQuestionFormData(prev => ({
        ...prev,
        tempComprehensionQuestion: {
          ...prev.tempComprehensionQuestion,
          acceptableAnswers: [...prev.tempComprehensionQuestion.acceptableAnswers, answer.trim()]
        }
      }));
    }
  };

  const removeAcceptableAnswer = (index) => {
    setQuestionFormData(prev => ({
      ...prev,
      tempComprehensionQuestion: {
        ...prev.tempComprehensionQuestion,
        acceptableAnswers: prev.tempComprehensionQuestion.acceptableAnswers.filter((_, i) => i !== index)
      }
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
    // Prevent multiple rapid calls and race conditions
    if (questionFormInitializing.current === true) {
      return;
    }
    
    if (showQuestionForm === true) {
      return;
    }
    
    // Set flag to prevent race conditions
    questionFormInitializing.current = true;
    
    // Validate that category is set
    if (!formData.category) {
      questionFormInitializing.current = false;
      toast.error("Please select a category before adding questions.");
      return;
    }
    
    setShowQuestionForm(true);
    setCurrentQuestion(null);
    
    questionFormInitializing.current = false;

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
      questionText: formData.category === "Reading Comprehension" ? null : "",
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
      sentenceQuestions: initialQuestionType === "text_input" ? [] : [],
      correctAnswer: initialQuestionType === "text_input" ? null : [],
      // Reading Comprehension specific fields for multiple questions
      currentComprehensionIndex: -1,
      tempComprehensionQuestion: {
        questionText: "",
        correctAnswer: "",
        acceptableAnswers: []
      },
      // Phonological Awareness specific fields
      questionSet: initialFields.questionSet || []
    });
  };

  const handleEditQuestion = (question, index) => {
    console.log('=== EDIT QUESTION DEBUG START ===');
    console.log('handleEditQuestion called with:');
    console.log('- question:', JSON.stringify(question, null, 2));
    console.log('- index:', index);
    console.log('- formData.category:', formData.category);
    console.log('- question.passages:', question.passages);
    
    setShowQuestionForm(true);
    setCurrentQuestion(index);
    
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
      
      // Ensure storyTitle exists
      if (!baseQuestionData.storyTitle) {
        baseQuestionData.storyTitle = "";
      }
      
      // Handle the direct question format from the database
      baseQuestionData.questionText = baseQuestionData.questionText || "";
      baseQuestionData.correctAnswer = baseQuestionData.correctAnswer || null;
      
      // Handle passages: if null, this question references a previous story's passages
      if (baseQuestionData.passages === null) {
        console.log('This question has passages: null (references previous story)');
        baseQuestionData.passages = []; // Set to empty array for form compatibility
      } else if (!baseQuestionData.passages || !Array.isArray(baseQuestionData.passages)) {
        console.log('Creating default passages array');
        baseQuestionData.passages = [
          { pageNumber: 1, pageText: "", pageImage: null }
        ];
      } else {
        console.log('Found existing passages:', baseQuestionData.passages.length);
        // Ensure each passage has required fields and clean temporary fields
        baseQuestionData.passages = baseQuestionData.passages.map((passage, idx) => ({
          pageNumber: passage.pageNumber || idx + 1,
          pageText: passage.pageText || "",
          pageImage: passage.pageImage || null
          // Remove temporary fields: _imageFile and _imageName are automatically excluded
        }));
      }
      
      // Remove acceptableAnswers at question level (should only be in sentenceQuestions)
      delete baseQuestionData.acceptableAnswers;
      
      // Clean up unwanted fields for Reading Comprehension
      delete baseQuestionData.questionSet; // Not used by Reading Comprehension
    }
    
    console.log('Final baseQuestionData:', baseQuestionData);
    
    // Ensure all required fields are present for Reading Comprehension
    if (formData.category === "Reading Comprehension") {
      baseQuestionData.currentComprehensionIndex = baseQuestionData.currentComprehensionIndex || -1;
      baseQuestionData.tempComprehensionQuestion = baseQuestionData.tempComprehensionQuestion || {
        questionText: "",
        correctAnswer: "",
        acceptableAnswers: []
      };
    }
    
    setQuestionFormData(baseQuestionData);
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



  const handleQuestionFormSubmit = async (e) => {
    e.preventDefault();

    // Validate required fields (questionText not required for Reading Comprehension)
    if (formData.category !== "Reading Comprehension" && !questionFormData.questionText) {
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

      // Validate sentence questions
      if (questionFormData.sentenceQuestions.length === 0) {
        toast.error("Please add at least one sentence question for the story.");
        return;
      }

      // Validate that all sentence questions have required fields
      for (let i = 0; i < questionFormData.sentenceQuestions.length; i++) {
        const question = questionFormData.sentenceQuestions[i];
        if (!question.questionText || !question.questionText.trim()) {
          toast.error(`Question ${i + 1} is missing question text. Please add question text for all sentence questions.`);
          return;
        }
        if (!question.correctAnswer || !question.correctAnswer.trim()) {
          toast.error(`Question ${i + 1} is missing correct answer. Please add correct answer for all sentence questions.`);
          return;
        }
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
            // Set displaySequence based on question type
            if (sanitized.questionText === "Tukuyin ang nasa larawan?") {
              sanitized.displaySequence = null;
            } else {
              sanitized.displaySequence = sanitized.displaySequence || [];
            }
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
            // Ensure arrays exist and properly capitalize
            sanitized.blankOptions = (sanitized.blankOptions || []).map(option => 
              typeof option === 'string' && option.length > 0 
                ? option.charAt(0).toUpperCase() + option.slice(1).toLowerCase() 
                : option
            );
            sanitized.correctAnswer = (sanitized.correctAnswer || []).map(answer => 
              typeof answer === 'string' && answer.length > 0 
                ? answer.charAt(0).toUpperCase() + answer.slice(1).toLowerCase() 
                : answer
            );
            // Normalize displayWord formatting - convert __word__ to dynamic blanks for database storage
            if (sanitized.displayWord) {
              sanitized.displayWord = sanitized.displayWord
                .replace(/__([^_]+)__/g, (_, word) => {
                  // Create dynamic blanks based on word length
                  const blankLength = word.length;
                  return ` ${'_'.repeat(blankLength)} `;
                }) // Convert __word__ to dynamic length blanks
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
            
            // Ensure required fields exist
            sanitized.questionText = sanitized.questionText || "";
            sanitized.correctAnswer = sanitized.correctAnswer || null;
            
            // Note: acceptableAnswers only exist within sentenceQuestions, not at question level
            
            sanitized.storyTitle = sanitized.storyTitle || "";
            
            // Smart passages handling: if this story already has passages in the database,
            // set passages to null (meaning this question references the existing story)
            if (sanitized.storyTitle && hasExistingPassages(sanitized.storyTitle)) {
              sanitized.passages = null;
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
          delete sanitized.sentenceQuestions;
          delete sanitized.currentComprehensionIndex;
          delete sanitized.tempComprehensionQuestion;
        } else {
          // For Reading Comprehension, ensure required fields are properly structured
          // Keep storyTitle, passages, and sentenceQuestions as required by backend model
          
          // Ensure storyTitle exists
          if (!sanitized.storyTitle) {
            sanitized.storyTitle = questionFormData.storyTitle || "";
          }
          
          // Ensure passages exists (array or null)
          if (!sanitized.passages) {
            sanitized.passages = questionFormData.passages || [];
          }
          
          // Ensure sentenceQuestions array is properly structured
          if (!sanitized.sentenceQuestions || !Array.isArray(sanitized.sentenceQuestions)) {
            sanitized.sentenceQuestions = questionFormData.sentenceQuestions || [];
          }
          
          // Validate each sentence question has required fields
          sanitized.sentenceQuestions = sanitized.sentenceQuestions.map(sq => ({
            questionText: sq.questionText || "",
            correctAnswer: sq.correctAnswer || "",
            acceptableAnswers: Array.isArray(sq.acceptableAnswers) ? sq.acceptableAnswers : []
          }));
          
          // Remove acceptableAnswers at question level (should only be in sentenceQuestions)
          delete sanitized.acceptableAnswers;
          
          // Remove fields not needed at document level for Reading Comprehension
          delete sanitized.questionText; // This should be in sentenceQuestions, not at question level
          delete sanitized.correctAnswer; // This should be in sentenceQuestions, not at question level
          delete sanitized.questionSet; // Not used by Reading Comprehension
          
          // Ensure questionImage is always null for Reading Comprehension
          sanitized.questionImage = null;
          
          // Also remove temporary form fields for Reading Comprehension
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


      // If there's an image file pending upload, upload it to S3 first
      if (questionFormData.imageFile) {
        try {
          console.log('Starting image upload for file:', questionFormData.imageFile.name);
          const result = await MainAssessmentService.uploadImageToS3(questionFormData.imageFile);
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

          // Validate passage data before processing
          if (!passage.pageNumber) {
            console.warn('Passage missing pageNumber, skipping image processing');
            updatedPassage.pageImage = null;
            // Remove temporary fields
            delete updatedPassage._imageFile;
            delete updatedPassage._imageName;
            updatedPassages.push(updatedPassage);
            continue;
          }

          // Check if this passage has a blob URL that needs uploading
          if (passage.pageImage && passage.pageImage instanceof File) {
            try {
              console.log(`Processing image upload for page ${passage.pageNumber}`);
              const imageFile = passage.pageImage;


              // Validate file size (limit to 10MB)
              const maxSizeBytes = 10 * 1024 * 1024;
              if (imageFile.size > maxSizeBytes) {
                const sizeMB = (imageFile.size / 1024 / 1024).toFixed(1);
                console.error(`Image too large for page ${passage.pageNumber}: ${sizeMB}MB`);
                toast.error(`Image for page ${passage.pageNumber} is too large (${sizeMB}MB). Please use an image smaller than 10MB.`);
                throw new Error(`Image too large for page ${passage.pageNumber}: ${sizeMB}MB`);
              }


              // Upload to S3 with improved retry mechanism
              let uploadResult;
              let retryCount = 0;
              const maxRetries = 3;

              while (retryCount < maxRetries) {
                try {
                  console.log(`Uploading image for page ${passage.pageNumber} (attempt ${retryCount + 1}/${maxRetries})`);
                  uploadResult = await MainAssessmentService.uploadImageToS3(imageFile);
                  
                  if (uploadResult && uploadResult.success && uploadResult.url) {
                    console.log(`Upload successful for page ${passage.pageNumber}:`, uploadResult.url);
                    break; // Success, exit retry loop
                  } else {
                    throw new Error(uploadResult?.error || 'Upload service returned no URL');
                  }
                } catch (uploadError) {
                  retryCount++;
                  console.warn(`Upload attempt ${retryCount} failed for page ${passage.pageNumber}:`, uploadError.message);
                  
                  if (retryCount >= maxRetries) {
                    console.error(`All upload attempts failed for page ${passage.pageNumber}:`, uploadError);
                    
                    // Provide specific, actionable error messages
                    let userMessage = `Failed to upload image for page ${passage.pageNumber}.`;
                    
                    if (uploadError.message.includes('Authentication failed') || 
                        uploadError.message.includes('401') || 
                        uploadError.message.includes('403')) {
                      userMessage += ' Authentication error. Please refresh the page and try again.';
                    } else if (uploadError.message.includes('Network') || 
                               uploadError.message.includes('timeout')) {
                      userMessage += ' Network error. Please check your internet connection and try again.';
                    } else if (uploadError.message.includes('413') || 
                               uploadError.message.includes('too large') ||
                               uploadError.message.includes('size exceeds')) {
                      userMessage += ' The image file is too large. Please use a smaller image.';
                    } else if (uploadError.message.includes('500')) {
                      userMessage += ' Server error. Please try again in a few moments.';
                    } else {
                      userMessage += ' Please try again or use a different image. If the problem persists, try refreshing the page.';
                    }
                    
                    toast.error(userMessage);
                    const passageError = new Error(`Upload failed for page ${passage.pageNumber} after ${maxRetries} attempts: ${uploadError.message}`);
                    passageError.userNotified = true;
                    throw passageError;
                  } else {
                    // Wait before retrying with exponential backoff
                    const delay = Math.pow(2, retryCount - 1) * 1000; // 1s, 2s, 4s
                    console.log(`Waiting ${delay}ms before retry ${retryCount + 1} for page ${passage.pageNumber}`);
                    await new Promise(resolve => setTimeout(resolve, delay));
                  }
                }
              }

              if (uploadResult && uploadResult.success && uploadResult.url) {
                updatedPassage.pageImage = uploadResult.url;
                console.log(`Successfully uploaded page ${passage.pageNumber} image:`, uploadResult.url);
                toast.success(`Image uploaded successfully for page ${passage.pageNumber}`, { autoClose: 2000 });
              } else {
                console.error(`Upload result missing for page ${passage.pageNumber}:`, uploadResult);
                toast.error(`Upload completed but no URL received for page ${passage.pageNumber}. Please try again.`);
                throw new Error(`Upload result invalid for page ${passage.pageNumber}`);
              }

            } catch (error) {
              console.error(`Error processing image for page ${passage.pageNumber}:`, error);
              
              // Only show generic error if we haven't shown a specific one
              if (!error.userNotified) {
                toast.error(`Unable to process image for page ${passage.pageNumber}. Please remove and re-add the image.`);
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

          // Remove temporary fields before finalizing
          delete updatedPassage._imageFile;
          delete updatedPassage._imageName;
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

          // Reset for a NEW STORY (after updating an existing question)
          setCurrentQuestion(null);
          console.log('Question update completed successfully');

        // Generate temporary questionId for the next question
        const nextQuestionNumber = String(formData.questions.length + 2).padStart(3, '0'); // +2 because we just added one
        const nextTempQuestionId = `${getCategoryPrefix(formData.category)}_${nextQuestionNumber}`;
        const nextParentId = formData.category === "Reading Comprehension" ? nextTempQuestionId : null;

        setQuestionFormData({
          questionType: categoryToQuestionTypeMap[formData.category],
          questionText: formData.category === "Reading Comprehension" ? "" : "",
          questionImage: null,
          imageFile: null,
          imageName: "",
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
              acceptableAnswers: [],
              questionId: nextParentId ? `${nextParentId}_SQ01` : null
            }
          ] : [],
          // Reading Comprehension specific fields - RESET FOR NEW STORY
          storyTitle: "",
          currentComprehensionIndex: -1,
          tempComprehensionQuestion: {
            questionText: "",
            correctAnswer: "",
            acceptableAnswers: []
          },
          // Other question type fields to ensure clean state
          displaySequence: null,
          blankPosition: null,
          dragElements: [],
          correctSequence: [],
          displayWord: "",
          blankOptions: [],
          correctAnswer: formData.category === "Reading Comprehension" ? "" : [],
          questionSet: []
        });

        toast.success("Question updated! You can add another or click Back to return to the assessment.");
        } else {
        // Ensure questionValue is at least null if it's empty string or undefined
        finalQuestionData.questionValue = finalQuestionData.questionValue || null;

        console.log('Adding new question to form data:', finalQuestionData);
        setFormData(prev => ({
          ...prev,
          questions: [...prev.questions, finalQuestionData]
        }));

        // Reset for a NEW STORY (completely fresh form for Reading Comprehension)
        // Generate temporary questionId for the next question
        const nextQuestionNumber = String(formData.questions.length + 2).padStart(3, '0'); // +2 because we just added one
        const nextTempQuestionId = `${getCategoryPrefix(formData.category)}_${nextQuestionNumber}`;
        const nextParentId = formData.category === "Reading Comprehension" ? nextTempQuestionId : null;

        setQuestionFormData({
          questionType: categoryToQuestionTypeMap[formData.category],
          questionText: formData.category === "Reading Comprehension" ? "" : "",
          questionImage: null,
          imageFile: null,
          imageName: "",
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
              acceptableAnswers: [],
              questionId: nextParentId ? `${nextParentId}_SQ01` : null
            }
          ] : [],
          // Reading Comprehension specific fields - RESET FOR NEW STORY
          storyTitle: "",
          currentComprehensionIndex: -1,
          tempComprehensionQuestion: {
            questionText: "",
            correctAnswer: "",
            acceptableAnswers: []
          },
          // Other question type fields to ensure clean state
          displaySequence: null,
          blankPosition: null,
          dragElements: [],
          correctSequence: [],
          displayWord: "",
          blankOptions: [],
          correctAnswer: formData.category === "Reading Comprehension" ? "" : [],
          questionSet: []
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

    // Store the file directly instead of using blob URLs
    if (field === 'questionImage') {
      setQuestionFormData(prev => ({
        ...prev,
        questionImage: file, // Store the file directly
        imageFile: file, // Keep for backwards compatibility
        imageName: file.name
      }));
    } else if (field.includes('pageImage')) {
      const pageIndex = parseInt(field.split('-')[1]);
      setQuestionFormData(prev => {
        const updatedPassages = [...prev.passages];
        updatedPassages[pageIndex] = {
          ...updatedPassages[pageIndex],
          pageImage: file, // Store File object directly instead of blob URL
          _imageFile: file, // Keep for backwards compatibility
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

    // Check if we have any questions regardless of category
    const hasQuestions = formData.category === "Reading Comprehension" 
      ? questionFormData.sentenceQuestions.length > 0
      : formData.questions.length > 0;
      
    if (!hasQuestions) {
      alert("Please add at least one question.");
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
          formattedSentenceQuestions = question.sentenceQuestions.map((sq) => ({
            questionText: sq.questionText,
            correctAnswer: sq.correctAnswer,
            acceptableAnswers: sq.acceptableAnswers || []
          }));
        }

        return {
          ...question,
          // Include questionId for all question types
          questionId,
          // Set questionValue directly 
          questionValue: isSentenceType ? null : questionValue,
          // Ensure passages exist for sentence type
          passages: isSentenceType ? (question.passages || []) : undefined,
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

        // Create assessment data - Reading Comprehension uses single assessment with sentenceQuestions
        const assessmentData = {
          readingLevel: formData.readingLevel,
          category: formData.category,
          questionType: categoryToQuestionTypeMap[formData.category],
          isActive: formData.isActive,
          status: formData.status
        };

        if (formData.category === "Reading Comprehension") {
          // For Reading Comprehension, create single question with sentenceQuestions array
          const questionId = `RC_001`;
          const singleQuestionData = {
            questionId: questionId,
            storyTitle: questionFormData.storyTitle,
            passages: questionFormData.passages.filter(p => p.pageText && p.pageText.trim()),
            sentenceQuestions: questionFormData.sentenceQuestions
          };
          
          assessmentData.questions = [singleQuestionData];
        } else {
          // For other categories, use finalQuestions
          assessmentData.questions = finalQuestions.map(question => ({
            ...question,
            category: formData.category // Required by backend model for validation
          }));
        }

        // For debugging - log the data being sent
        console.log("Submitting assessment data:", JSON.stringify(assessmentData, null, 2));

        // Create new assessment
        response = await MainAssessmentService.createAssessment(assessmentData);
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

  const handlePreviewPageChange = (direction) => {
    if (direction === 'next' && selectedAssessment?.questions?.[0]?.passages?.length > previewPage + 1) {
      setPreviewPage(prev => prev + 1);
    } else if (direction === 'prev' && previewPage > 0) {
      setPreviewPage(prev => prev - 1);
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

  // Helper function to get meaningful metadata for each question type
  const getQuestionMetadata = (question) => {
    const metadata = [];
    
    switch (question.questionType) {
      case "multiple_choice":
        if (question.choiceOptions && question.choiceOptions.length > 0) {
          const correctOption = question.choiceOptions.find(opt => opt.isCorrect);
          metadata.push({
            icon: faCheckCircle,
            text: correctOption ? `Answer: "${correctOption.optionText}"` : `${question.choiceOptions.length} choices`
          });
        }
        break;
        
      case "matching":
        if (question.questionSet && question.questionSet[0]) {
          const audioCount = question.questionSet[0].audioTexts?.length || 0;
          const matchCount = question.questionSet[0].matchingOptions?.length || 0;
          metadata.push({
            icon: faClipboardList,
            text: `${audioCount} audio → ${matchCount} matches`
          });
        }
        break;
        
      case "drag_drop":
        if (question.correctSequence && question.correctSequence.length > 0) {
          metadata.push({
            icon: faPuzzlePiece,
            text: `Answer: "${question.correctSequence.join('')}"`
          });
        }
        if (question.dragElements && question.dragElements.length > 0) {
          metadata.push({
            icon: faLayerGroup,
            text: `${question.dragElements.length} letters available`
          });
        }
        break;
        
      case "fill_blank":
        if (question.correctAnswer && question.correctAnswer.length > 0) {
          metadata.push({
            icon: faCheckCircle,
            text: `Answer: "${question.correctAnswer.join(', ')}"`
          });
        }
        if (question.blankOptions && question.blankOptions.length > 0) {
          metadata.push({
            icon: faClipboardList,
            text: `${question.blankOptions.length} options`
          });
        }
        break;
        
      case "text_input":
        if (question.storyTitle) {
          metadata.push({
            icon: faBook,
            text: `Story: "${question.storyTitle}"`
          });
        }
        if (question.passages && question.passages.length > 0) {
          metadata.push({
            icon: faFileAlt,
            text: `${question.passages.length} pages`
          });
        }
        if (question.correctAnswer) {
          metadata.push({
            icon: faCheckCircle,
            text: `Answer: "${question.correctAnswer}"`
          });
        }
        break;
        
      // Legacy support for old question types
      case "sentence":
        if (question.passages && question.passages.length > 0) {
          metadata.push({
            icon: faBook,
            text: `${question.passages.length} pages`
          });
        }
        if (question.sentenceQuestions && question.sentenceQuestions.length > 0) {
          metadata.push({
            icon: faQuestion,
            text: `${question.sentenceQuestions.length} questions`
          });
        }
        break;
        
      default:
        // For unknown types, show generic info if available
        if (question.choiceOptions && question.choiceOptions.length > 0) {
          metadata.push({
            icon: faCheckCircle,
            text: `${question.choiceOptions.length} options`
          });
        }
    }
    
    return metadata;
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

  // Helper function to clean up object URLs
  const cleanupImageObjectURL = (imageValue) => {
    if (imageValue instanceof File) {
      try {
        const objectUrl = URL.createObjectURL(imageValue);
        URL.revokeObjectURL(objectUrl);
      } catch (error) {
        console.warn('Error cleaning up object URL:', error);
      }
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

  return (
    <div className="post-assessment-container">
      <div className="pa-header">
        <h2>
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
                <div className="pa-assessment-preview-enhanced">
                  <div className="pa-preview-header-enhanced">
                    <div className="pa-preview-summary-card" style={{ color: '#ffffff' }}>
                      <div className="pa-summary-row">
                        <div className="pa-summary-item">
                          <FontAwesomeIcon icon={faGraduationCap} className="pa-summary-icon" />
                          <div className="pa-summary-content">
                            <span className="pa-summary-label" style={{ color: '#ffffff' }}>Reading Level</span>
                            <span className="pa-summary-value" style={{ color: '#ffffff' }}>{selectedAssessment.readingLevel}</span>
                          </div>
                        </div>
                        <div className="pa-summary-item">
                          <FontAwesomeIcon icon={
                            selectedAssessment.category === "Reading Comprehension" ? faBook :
                            selectedAssessment.category === "Alphabet Knowledge" ? faFont :
                            selectedAssessment.category === "Phonological Awareness" ? faVolumeUp :
                            selectedAssessment.category === "Decoding" ? faPuzzlePiece :
                            faImages
                          } className="pa-summary-icon" />
                          <div className="pa-summary-content">
                            <span className="pa-summary-label" style={{ color: '#ffffff' }}>Category</span>
                            <span className="pa-summary-value" style={{ color: '#ffffff' }}>{selectedAssessment.category}</span>
                          </div>
                        </div>
                        <div className="pa-summary-item">
                          <FontAwesomeIcon icon={faClipboardList} className="pa-summary-icon" />
                          <div className="pa-summary-content">
                            <span className="pa-summary-label" style={{ color: '#ffffff' }}>Questions</span>
                            <span className="pa-summary-value" style={{ color: '#ffffff' }}>{selectedAssessment.questions.length}</span>
                          </div>
                        </div>
                        <div className="pa-summary-item">
                          <FontAwesomeIcon icon={selectedAssessment.isActive ? faCheckCircle : faExclamationTriangle} className="pa-summary-icon" />
                          <div className="pa-summary-content">
                            <span className="pa-summary-label" style={{ color: '#ffffff' }}>Status</span>
                            <span className={`pa-summary-status ${selectedAssessment.isActive ? 'active' : 'inactive'}`} style={{ color: '#ffffff' }}>
                              {selectedAssessment.isActive ? 'Active' : 'Inactive'}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="pa-preview-questions-section">
                    <div className="pa-questions-header-enhanced">
                      <h3><FontAwesomeIcon icon={faClipboardList} /> Assessment Questions</h3>
                      <div className="pa-question-type-badge">
                        <FontAwesomeIcon icon={
                          selectedAssessment.category === "Reading Comprehension" ? faBook :
                          selectedAssessment.category === "Alphabet Knowledge" ? faFont :
                          selectedAssessment.category === "Phonological Awareness" ? faVolumeUp :
                          selectedAssessment.category === "Decoding" ? faPuzzlePiece :
                          faImages
                        } />
                        {selectedAssessment.questionType}
                      </div>
                    </div>

                    <div className="pa-questions-container-enhanced">
                      {selectedAssessment.questions.map((question, index) => (
                        <div key={index} className="pa-question-card-enhanced">
                          <div className="pa-question-header-enhanced">
                            <div className="pa-question-number-badge">
                              <FontAwesomeIcon icon={faQuestion} />
                              <span>Question {index + 1}</span>
                            </div>
                            <div className="pa-question-id-badge">
                              ID: {question.questionId || `${getCategoryPrefix(selectedAssessment.category)}_${String(index + 1).padStart(3, '0')}`}
                            </div>
                          </div>

                          <div className="pa-question-body-enhanced">
                            <div className="pa-question-prompt-enhanced">
                              {question.questionImage && (
                                <div className="pa-question-image-wrapper">
                                  <img
                                    src={question.questionImage}
                                    alt="Question visual"
                                    className="pa-question-image-enhanced"
                                  />
                                </div>
                              )}
                              
                              <div className="pa-question-text-enhanced">
                                <h4 className="pa-question-instruction">{question.questionText}</h4>
                                {question.questionValue && (
                                  <div className="pa-question-value-display">
                                    <span className="pa-value-label">Display Text:</span>
                                    <span className="pa-value-content">{question.questionValue}</span>
                                  </div>
                                )}
                              </div>
                            </div>

                            {/* Render category-specific content */}
                            {selectedAssessment.category === "Alphabet Knowledge" && (
                              <div className="pa-alphabet-knowledge-content">
                                <h5 className="pa-answer-section-title">
                                  <FontAwesomeIcon icon={faCheckDouble} /> Multiple Choice Options
                                </h5>
                                <div className="pa-choice-options-enhanced">
                                  {question.choiceOptions && question.choiceOptions.map((option, optIndex) => (
                                    <div
                                      key={optIndex}
                                      className={`pa-choice-option ${option.isCorrect ? 'correct' : 'incorrect'}`}
                                    >
                                      <div className="pa-option-indicator">
                                        {option.isCorrect ? (
                                          <FontAwesomeIcon icon={faCheckCircle} className="correct-icon" />
                                        ) : (
                                          <span className="option-letter">{String.fromCharCode(65 + optIndex)}</span>
                                        )}
                                      </div>
                                      <div className="pa-option-content">
                                        <span className="pa-option-text">{option.optionText}</span>
                                        {option.isCorrect && <span className="pa-correct-label">Correct Answer</span>}
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            )}

                            {selectedAssessment.category === "Phonological Awareness" && (
                              <div className="pa-phonological-awareness-content">
                                <h5 className="pa-answer-section-title">
                                  <FontAwesomeIcon icon={faVolumeUp} /> Audio Matching Pairs
                                </h5>
                                {question.questionSet && question.questionSet[0] && (
                                  <div className="pa-matching-content">
                                    <div className="pa-audio-section">
                                      <h6><FontAwesomeIcon icon={faVolumeUp} /> Audio Elements</h6>
                                      <div className="pa-audio-items">
                                        {question.questionSet[0].audioTexts && question.questionSet[0].audioTexts.map((audio, audioIndex) => (
                                          <div key={audioIndex} className="pa-audio-item">
                                            <FontAwesomeIcon icon={faVolumeUp} />
                                            <span>{audio}</span>
                                          </div>
                                        ))}
                                      </div>
                                    </div>
                                    <div className="pa-matching-arrow">
                                      <FontAwesomeIcon icon={faArrowRight} />
                                    </div>
                                    <div className="pa-visual-section">
                                      <h6><FontAwesomeIcon icon={faImages} /> Visual Options</h6>
                                      <div className="pa-visual-items">
                                        {question.questionSet[0].matchingOptions && question.questionSet[0].matchingOptions.map((visual, visualIndex) => (
                                          <div key={visualIndex} className="pa-visual-item">
                                            <FontAwesomeIcon icon={faImages} />
                                            <span>{visual}</span>
                                          </div>
                                        ))}
                                      </div>
                                    </div>
                                    <div className="pa-correct-pairs-section">
                                      <h6><FontAwesomeIcon icon={faCheckCircle} /> Correct Pairs</h6>
                                      <div className="pa-pairs-list">
                                        {question.questionSet[0].correctPairs && question.questionSet[0].correctPairs.map((pair, pairIndex) => (
                                          <div key={pairIndex} className="pa-correct-pair">
                                            {Object.entries(pair).map(([audio, visual]) => (
                                              <div key={audio} className="pa-pair-connection">
                                                <span className="pa-pair-audio">{audio}</span>
                                                <FontAwesomeIcon icon={faArrowRight} className="pa-pair-arrow" />
                                                <span className="pa-pair-visual">{visual}</span>
                                              </div>
                                            ))}
                                          </div>
                                        ))}
                                      </div>
                                    </div>
                                  </div>
                                )}
                              </div>
                            )}

                            {selectedAssessment.category === "Decoding" && (
                              <div className="pa-decoding-content">
                                <h5 className="pa-answer-section-title">
                                  <FontAwesomeIcon icon={faPuzzlePiece} /> Drag & Drop Elements
                                </h5>
                                <div className="pa-decoding-layout">
                                  <div className="pa-decoding-question-type">
                                    <span className={`pa-decoding-type ${question.questionText === 'Tukuyin ang nasa larawan?' ? 'identification' : 'completion'}`}>
                                      {question.questionText === 'Tukuyin ang nasa larawan?' ? 'Word Identification' : 'Word Completion'}
                                    </span>
                                  </div>
                                  
                                  {question.displaySequence && question.displaySequence.length > 0 && (
                                    <div className="pa-display-sequence">
                                      <h6><FontAwesomeIcon icon={faListUl} /> Display Pattern</h6>
                                      <div className="pa-sequence-items">
                                        {question.displaySequence.map((item, seqIndex) => (
                                          <div key={seqIndex} className={`pa-sequence-item ${item === '_' ? 'blank' : 'filled'}`}>
                                            {item === '_' ? (
                                              <div className="pa-blank-space">
                                                <FontAwesomeIcon icon={faQuestion} />
                                              </div>
                                            ) : (
                                              <span>{item}</span>
                                            )}
                                          </div>
                                        ))}
                                      </div>
                                      {question.blankPosition !== null && (
                                        <div className="pa-blank-info">
                                          <span>Blank Position: {question.blankPosition + 1}</span>
                                        </div>
                                      )}
                                    </div>
                                  )}

                                  <div className="pa-drag-elements">
                                    <h6><FontAwesomeIcon icon={faPuzzlePiece} /> Available Elements</h6>
                                    <div className="pa-drag-items">
                                      {question.dragElements && question.dragElements.map((element, dragIndex) => (
                                        <div key={dragIndex} className="pa-drag-item">
                                          {element}
                                        </div>
                                      ))}
                                    </div>
                                  </div>

                                  <div className="pa-correct-sequence">
                                    <h6><FontAwesomeIcon icon={faCheckCircle} /> Correct Answer</h6>
                                    <div className="pa-correct-items">
                                      {question.correctSequence && question.correctSequence.map((correct, corrIndex) => (
                                        <div key={corrIndex} className="pa-correct-item">
                                          {correct}
                                        </div>
                                      ))}
                                    </div>
                                  </div>
                                </div>
                              </div>
                            )}

                            {selectedAssessment.category === "Word Recognition" && (
                              <div className="pa-word-recognition-content">
                                <h5 className="pa-answer-section-title">
                                  <FontAwesomeIcon icon={faFileAlt} /> Fill in the Blank
                                </h5>
                                <div className="pa-word-recognition-layout">
                                  <div className="pa-display-word-section">
                                    <h6><FontAwesomeIcon icon={faBook} /> Sentence/Word Display</h6>
                                    <div className="pa-display-word">
                                      {question.displayWord}
                                    </div>
                                  </div>

                                  <div className="pa-blank-options-section">
                                    <h6><FontAwesomeIcon icon={faListUl} /> Answer Options</h6>
                                    <div className="pa-blank-options">
                                      {question.blankOptions && question.blankOptions.map((option, optIndex) => (
                                        <div key={optIndex} className={`pa-blank-option ${question.correctAnswer && question.correctAnswer.includes(option) ? 'correct' : 'incorrect'}`}>
                                          <div className="pa-option-indicator">
                                            {question.correctAnswer && question.correctAnswer.includes(option) ? (
                                              <FontAwesomeIcon icon={faCheckCircle} className="correct-icon" />
                                            ) : (
                                              <span className="option-letter">{String.fromCharCode(65 + optIndex)}</span>
                                            )}
                                          </div>
                                          <div className="pa-option-content">
                                            <span className="pa-option-text">{option}</span>
                                            {question.correctAnswer && question.correctAnswer.includes(option) && (
                                              <span className="pa-correct-label">Correct</span>
                                            )}
                                          </div>
                                        </div>
                                      ))}
                                    </div>
                                  </div>

                                  <div className="pa-correct-answers-section">
                                    <h6><FontAwesomeIcon icon={faCheckCircle} /> Correct Answer(s)</h6>
                                    <div className="pa-correct-answers">
                                      {question.correctAnswer && question.correctAnswer.map((answer, ansIndex) => (
                                        <div key={ansIndex} className="pa-correct-answer-item">
                                          <FontAwesomeIcon icon={faCheckCircle} />
                                          <span>{answer}</span>
                                        </div>
                                      ))}
                                    </div>
                                  </div>
                                </div>
                              </div>
                            )}

                            {selectedAssessment.category === "Reading Comprehension" && (
                              <div className="pa-reading-comprehension-content">
                                <h5 className="pa-answer-section-title">
                                  <FontAwesomeIcon icon={faBook} /> Story & Comprehension
                                </h5>
                                
                                <div className="pa-story-info">
                                  <div className="pa-story-title-section">
                                    <h6><FontAwesomeIcon icon={faBook} /> Story Title</h6>
                                    <div className="pa-story-title">{question.storyTitle}</div>
                                  </div>
                                </div>

                                {question.passages && question.passages.length > 0 ? (
                                  <div className="pa-passages-section">
                                    <h6><FontAwesomeIcon icon={faImages} /> Story Passages</h6>
                                    <div className="pa-passages-container">
                                      {question.passages.map((passage, passageIndex) => (
                                        <div key={passageIndex} className="pa-passage-card">
                                          <div className="pa-passage-header">
                                            <span className="pa-page-number">Page {passage.pageNumber}</span>
                                          </div>
                                          <div className="pa-passage-content">
                                            {passage.pageImage && (
                                              <div className="pa-passage-image-container">
                                                <img
                                                  src={passage.pageImage}
                                                  alt={`Page ${passage.pageNumber} illustration`}
                                                  className="pa-passage-image"
                                                />
                                              </div>
                                            )}
                                            <div className="pa-passage-text">
                                              {passage.pageText}
                                            </div>
                                          </div>
                                        </div>
                                      ))}
                                    </div>
                                  </div>
                                ) : (
                                  <div className="pa-no-passages">
                                    <FontAwesomeIcon icon={faLink} />
                                    <span>References existing story passages</span>
                                  </div>
                                )}

                                <div className="pa-comprehension-question-section">
                                  <h6><FontAwesomeIcon icon={faQuestion} /> Question & Answer</h6>
                                  
                                  {/* Handle the new structure with sentenceQuestions array */}
                                  {question.sentenceQuestions && question.sentenceQuestions.length > 0 ? (
                                    <div className="pa-sentence-questions-list">
                                      {question.sentenceQuestions.map((sentenceQ, sqIndex) => (
                                        <div key={sqIndex} className="pa-sentence-question-item">
                                          <div className="pa-comprehension-question-text">
                                            <strong>Q{sqIndex + 1}:</strong> {sentenceQ.questionText}
                                          </div>
                                          <div className="pa-comprehension-answers">
                                            <div className="pa-primary-answer">
                                              <FontAwesomeIcon icon={faCheckCircle} className="correct-icon" />
                                              <span><strong>Primary Answer:</strong> {sentenceQ.correctAnswer}</span>
                                            </div>
                                            {sentenceQ.acceptableAnswers && sentenceQ.acceptableAnswers.length > 0 && (
                                              <div className="pa-acceptable-answers">
                                                <h6 className="pa-acceptable-answers-title">
                                                  <FontAwesomeIcon icon={faCheckDouble} /> 
                                                  Acceptable Answers
                                                </h6>
                                                <div className="pa-acceptable-list">
                                                  {sentenceQ.acceptableAnswers.map((answer, ansIndex) => (
                                                    <div key={ansIndex} className="pa-acceptable-answer">
                                                      <FontAwesomeIcon icon={faCheckCircle} className="acceptable-icon" />
                                                      <span>{answer}</span>
                                                    </div>
                                                  ))}
                                                </div>
                                              </div>
                                            )}
                                          </div>
                                        </div>
                                      ))}
                                    </div>
                                  ) : (
                                    /* Fallback for old structure - if questionText exists at question level */
                                    question.questionText && (
                                      <div className="pa-question-answer-pair">
                                        <div className="pa-comprehension-question-text">
                                          <strong>Q:</strong> {question.questionText}
                                        </div>
                                        <div className="pa-comprehension-answers">
                                          <div className="pa-primary-answer">
                                            <FontAwesomeIcon icon={faCheckCircle} className="correct-icon" />
                                            <span><strong>Primary Answer:</strong> {question.correctAnswer}</span>
                                          </div>
                                          {question.acceptableAnswers && question.acceptableAnswers.length > 1 && (
                                            <div className="pa-acceptable-answers">
                                              <h6><FontAwesomeIcon icon={faCheckDouble} /> Acceptable Answers</h6>
                                              <div className="pa-acceptable-list">
                                                {question.acceptableAnswers.map((answer, ansIndex) => (
                                                  <div key={ansIndex} className="pa-acceptable-answer">
                                                    <FontAwesomeIcon icon={faCheckCircle} className="acceptable-icon" />
                                                    <span>{answer}</span>
                                                  </div>
                                                ))}
                                              </div>
                                            </div>
                                          )}
                                        </div>
                                      </div>
                                    )
                                  )}
                                </div>
                              </div>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
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

                          {/* Hide Question Text field for Reading Comprehension - it has its own question text inputs */}
                          {formData.category !== "Reading Comprehension" && (
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
                                      displaySequence: selectedText === 'Tukuyin ang nasa larawan?' ? null : [],
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
                          )}

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

                        {/* Right Column - Image Upload (Hidden for Phonological Awareness and Reading Comprehension) */}
                        {formData.category !== "Phonological Awareness" && formData.category !== "Reading Comprehension" && (
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
                                          questionFormData.questionImage instanceof File
                                            ? URL.createObjectURL(questionFormData.questionImage) // Create object URL for File objects
                                            : typeof questionFormData.questionImage === 'string' &&
                                              questionFormData.questionImage.startsWith('data:')
                                            ? questionFormData.questionImage // Show data URL for preview
                                            : questionFormData.questionImage // Show existing URL string
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
                                        onError={(e) => {
                                          console.error('Image failed to load:', questionFormData.questionImage);
                                          e.target.style.display = 'none';
                                        }}
                                      />

                                      <div className="pa-file-name" style={{
                                        marginTop: '8px',
                                        fontSize: '12px',
                                        color: '#6b7280',
                                        textAlign: 'center'
                                      }}>
                                        {questionFormData.questionImage instanceof File 
                                          ? `File: ${questionFormData.questionImage.name}` 
                                          : "Question image uploaded"}
                                      </div>

                                      <button
                                        type="button"
                                        onClick={() => {
                                          cleanupImageObjectURL(questionFormData.questionImage);
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
                              <br></br>

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
                                  placeholder={questionFormData.questionText === "Tukuyin ang nasa larawan?" ? 
                                    "Enter complete word (e.g., YELO)" : 
                                    "Enter complete word (e.g., Yelo)"}
                                  value={questionFormData.correctSequence?.join('') || ''}
                                  onChange={(e) => {
                                    const cleanWord = e.target.value.replace(/[^a-zA-Z]/g, '').replace(/\s+/g, ''); // Remove numbers, symbols, and spaces
                                    // Format based on question type: uppercase for "Tukuyin ang nasa larawan?", mixed case for others
                                    const isWordIdentification = questionFormData.questionText === "Tukuyin ang nasa larawan?";
                                    const formattedWord = isWordIdentification ? 
                                      cleanWord.toUpperCase() : 
                                      (cleanWord.charAt(0).toUpperCase() + cleanWord.slice(1).toLowerCase());
                                    const letters = formattedWord.split('');
                                    // Add distractors matching the case style
                                    const distractors = isWordIdentification ? 
                                      ['A', 'E', 'I', 'O', 'U', 'B', 'C', 'D', 'F', 'G', 'H', 'J', 'K', 'L', 'M', 'N', 'P', 'Q', 'R', 'S', 'T', 'V', 'W', 'X', 'Y', 'Z'] : 
                                      ['a', 'e', 'i', 'o', 'u', 'b', 'c', 'd', 'f', 'g', 'h', 'j', 'k', 'l', 'm', 'n', 'p', 'q', 'r', 's', 't', 'v', 'w', 'x', 'y', 'z'];
                                    // Randomize distractor selection - filter out letters already in the word
                                    const availableDistractors = distractors.filter(d => !letters.includes(d));
                                    const shuffled = availableDistractors.sort(() => Math.random() - 0.5);
                                    const selectedDistractors = shuffled.slice(0, 2); // Take 2 random distractors
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
                                    onClick={() => setShowDistractorInput(true)}
                                  >
                                    <FontAwesomeIcon icon={faPlus} /> Add Option
                                  </button>
                                  
                                  {showDistractorInput && (
                                    <div className="pa-distractor-input-modal">
                                      <div className="pa-distractor-input-content">
                                        <label>Add distractor letter:</label>
                                        <input
                                          type="text"
                                          maxLength="1"
                                          value={distractorValue}
                                          onChange={(e) => setDistractorValue(e.target.value.toUpperCase())}
                                          className="pa-distractor-input"
                                          placeholder="Enter single letter"
                                          autoFocus
                                        />
                                        <div className="pa-distractor-buttons">
                                          <button
                                            type="button"
                                            className="pa-cancel-btn"
                                            onClick={() => {
                                              setShowDistractorInput(false);
                                              setDistractorValue("");
                                            }}
                                          >
                                            Cancel
                                          </button>
                                          <button
                                            type="button"
                                            className="pa-add-btn"
                                            onClick={() => {
                                              if (distractorValue && distractorValue.trim()) {
                                                setQuestionFormData(prev => ({
                                                  ...prev,
                                                  dragElements: [...(prev.dragElements || []), distractorValue.trim()]
                                                }));
                                                setShowDistractorInput(false);
                                                setDistractorValue("");
                                              }
                                            }}
                                          >
                                            OK
                                          </button>
                                        </div>
                                      </div>
                                    </div>
                                  )}
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
                                    // For "Buoin ang salita", use mixed case (first letter uppercase, rest lowercase)
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
                                    // Match case of correct letter - if lowercase, use lowercase distractors
                                    const isLowercase = correctLetter === correctLetter.toLowerCase();
                                    const baseDistractors = ['A', 'E', 'I', 'O', 'U', 'B', 'C', 'D', 'F', 'G', 'H', 'J', 'K', 'L', 'M', 'N', 'P', 'Q', 'R', 'S', 'T', 'V', 'W', 'X', 'Y', 'Z'];
                                    const distractors = isLowercase ? 
                                      baseDistractors.map(d => d.toLowerCase()) : 
                                      baseDistractors;
                                    // Randomize distractor selection
                                    const availableDistractors = distractors.filter(d => d !== correctLetter);
                                    const shuffled = availableDistractors.sort(() => Math.random() - 0.5);
                                    const selectedDistractors = shuffled.slice(0, 3); // Take 3 random distractors
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
                                  placeholder=""
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
                                <div className="pa-sentence-preview pa-enhanced-preview">
                                  {questionFormData.displayWord?.replace(/__([^_]+)__/g, (_, word) => {
                                    // Create dynamic blanks based on word length
                                    const blankLength = word.length;
                                    return ` ${'_'.repeat(blankLength)} `;
                                  }) || 'Enter a sentence above to see preview...'}
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
                                          // Create distractors - common words for sentence completion with proper capitalization
                                          const commonWords = ['bola', 'papel', 'kutsara', 'damit', 'libro', 'laruan', 'sapatos', 'tubig', 'mesa', 'silla', 'pusa', 'aso', 'bahay', 'kotse', 'payong', 'lapis', 'upuan', 'aklat', 'plato', 'baso'];
                                          
                                          // Capitalize first letter of correct answer
                                          const capitalizedCorrectAnswer = correctAnswer.charAt(0).toUpperCase() + correctAnswer.slice(1).toLowerCase();
                                          
                                          const distractors = commonWords
                                            .filter(word => word.toLowerCase() !== correctAnswer.toLowerCase())
                                            .slice(0, 3)
                                            .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()); // Capitalize distractors too
                                          
                                          const availableOptions = [capitalizedCorrectAnswer, ...distractors];
                                          
                                          setQuestionFormData(prev => ({
                                            ...prev,
                                            blankOptions: availableOptions,
                                            correctAnswer: [capitalizedCorrectAnswer]
                                          }));
                                          
                                          // Success feedback with toast instead of alert
                                          toast.success(`Generated ${availableOptions.length} options with "${capitalizedCorrectAnswer}" as the correct answer!`);
                                        } else {
                                          // Fallback: if no blank selected, show generic options with proper capitalization
                                          const genericWords = ['Bola', 'Papel', 'Kutsara', 'Damit'];
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
                                <p className="pa-section-description">Set up a word that students will identify matching sounds or syllables</p>
                              </div>

                              {/* Display Word Input */}
                              <div className="pa-form-group">
                                <label className="pa-form-label">Display Word:</label>
                                <input
                                  type="text"
                                  placeholder="SUMBRERO"
                                  value={questionFormData.displayWord || ''}
                                  onChange={(e) => {
                                    const sanitizedValue = e.target.value.replace(/[^a-zA-Z\s]/g, '').toUpperCase();
                                    setQuestionFormData(prev => ({
                                      ...prev,
                                      displayWord: sanitizedValue
                                    }));
                                  }}
                                  className="pa-display-word-input"
                                  style={{ textTransform: 'uppercase' }}
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
                                          updatedOptions[index] = e.target.value.toUpperCase();
                                          setQuestionFormData(prev => ({
                                            ...prev,
                                            blankOptions: updatedOptions
                                          }));
                                        }}
                                        className="pa-sound-input"
                                        style={{ textTransform: 'uppercase' }}
                                      />
                                      <div className="pa-sound-controls">
                                        <label>
                                          <input
                                            type="checkbox"
                                            checked={questionFormData.correctAnswer?.includes(option)}
                                            onChange={() => {
                                              const correctAnswers = questionFormData.correctAnswer || [];
                                              const isCorrect = correctAnswers.includes(option);
                                              
                                              // This section handles sound/syllable recognition - allow multiple answers
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
                                            }}
                                          />
                                          <FontAwesomeIcon icon={faCheckCircle} />
                                          {questionFormData.correctAnswer?.includes(option) ? 
                                            `${questionFormData.correctAnswer.indexOf(option) + 1}${getOrdinalSuffix(questionFormData.correctAnswer.indexOf(option) + 1)} Correct` : 
                                            'Mark Correct'}
                                        </label>
                                        <button
                                          type="button"
                                          className="pa-remove-sound"
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
                                      placeholder="Enter sound/syllable option (e.g., LIB, RO)"
                                      value={newSoundOption}
                                      onChange={(e) => setNewSoundOption(e.target.value.replace(/[^a-zA-Z\s]/g, '').toUpperCase())}
                                      className="pa-new-option-input"
                                      style={{ textTransform: 'uppercase' }}
                                      autoFocus
                                      onKeyDown={(e) => {
                                        if (e.key === 'Enter' && newSoundOption.trim()) {
                                          setQuestionFormData(prev => ({
                                            ...prev,
                                            blankOptions: [...(prev.blankOptions || []), newSoundOption.trim().toUpperCase()]
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
                                            blankOptions: [...(prev.blankOptions || []), newSoundOption.trim().toUpperCase()]
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
                                <h5>Correct Answers <span className="pa-selected-options">IN ORDER SELECTED</span></h5>
                                <p>Check the correct options above to mark them as correct answers (shows order: 1st, 2nd, 3rd...)</p>
                                <div className="pa-correct-sounds-display">
                                  {questionFormData.correctAnswer?.map((answer, index) => (
                                    <div key={index} className="pa-correct-sound-item">
                                      <span className="pa-answer-order">{index + 1}{getOrdinalSuffix(index + 1)}</span>
                                      <span style={{ textTransform: 'uppercase', fontWeight: '600' }}>{answer}</span>
                                      <button
                                        type="button"
                                        className="pa-remove-correct-answer"
                                        onClick={() => {
                                          const updatedCorrectAnswers = questionFormData.correctAnswer.filter((_, i) => i !== index);
                                          setQuestionFormData(prev => ({
                                            ...prev,
                                            correctAnswer: updatedCorrectAnswers
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
                                  ))}
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

                      {/* Reading Comprehension - Enhanced Design */}
                      {formData.category === "Reading Comprehension" && (
                        <div className="pa-reading-comprehension-form" style={{ 
                          background: 'linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%)', 
                          border: '2px solid #e2e8f0', 
                          borderRadius: '16px', 
                          padding: '40px', 
                          marginTop: '32px',
                          boxShadow: '0 4px 12px rgba(0, 0, 0, 0.05)',
                          position: 'relative',
                          backdropFilter: 'blur(10px)'
                        }}>
                          {/* Show story context for subsequent questions */}
                          {questionFormData.passages === null && questionFormData.storyTitle && (
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

                          {/* Story Title Section - Hide if adding subsequent question with passages: null */}
                          {questionFormData.passages !== null && (
                            <div className="pa-form-section" style={{ 
                              marginBottom: '32px', 
                              padding: '24px',
                              background: 'linear-gradient(135deg, #eff6ff 0%, #dbeafe 100%)',
                              border: '2px solid #bfdbfe',
                              borderRadius: '12px',
                              boxShadow: '0 2px 8px rgba(59, 130, 246, 0.1)'
                            }}>
                            <h5 style={{ 
                              color: '#1e40af', 
                              marginBottom: '20px', 
                              fontSize: '18px', 
                              fontWeight: '700',
                              display: 'flex',
                              alignItems: 'center',
                              textShadow: '0 1px 2px rgba(0,0,0,0.1)'
                            }}>
                              <FontAwesomeIcon icon={faBook} style={{ 
                                marginRight: '12px', 
                                color: '#3b82f6',
                                fontSize: '20px'
                              }} /> 
                              Story Information
                            </h5>
                            
                            <div className="pa-form-group">
                              <label style={{ 
                                display: 'block', 
                                marginBottom: '12px', 
                                fontSize: '16px', 
                                fontWeight: '600', 
                                color: '#1e40af',
                                letterSpacing: '0.5px'
                              }}>
                                Story Title:
                                <span style={{ color: '#ef4444', marginLeft: '4px' }}>*</span>
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
                                    style={{ 
                                      width: '100%', 
                                      padding: '14px 16px', 
                                      border: '2px solid #bfdbfe', 
                                      borderRadius: '10px',
                                      fontSize: '16px',
                                      fontWeight: '500',
                                      background: 'white',
                                      boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
                                      transition: 'all 0.2s ease',
                                      outline: 'none'
                                    }}
                                    onFocus={(e) => {
                                      e.target.style.borderColor = '#3b82f6';
                                      e.target.style.boxShadow = '0 0 0 3px rgba(59, 130, 246, 0.1)';
                                    }}
                                    onBlur={(e) => {
                                      e.target.style.borderColor = '#bfdbfe';
                                      e.target.style.boxShadow = '0 1px 3px rgba(0,0,0,0.1)';
                                    }}
                                    required
                                  />
                                );
                              })()}
                              
                              {questionFormData.storyTitle && hasExistingPassages(questionFormData.storyTitle) && (
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
                          )}

                          {/* Story Pages Section - Hide if adding subsequent question with passages: null */}
                          {questionFormData.storyTitle && questionFormData.passages !== null && (
                            <div className="pa-form-section" style={{ 
                              marginBottom: '32px',
                              padding: '24px',
                              background: 'linear-gradient(135deg, #f0fdf4 0%, #dcfce7 100%)',
                              border: '2px solid #bbf7d0',
                              borderRadius: '12px',
                              boxShadow: '0 2px 8px rgba(34, 197, 94, 0.1)'
                            }}>
                              <h5 style={{ 
                                color: '#15803d', 
                                marginBottom: '20px', 
                                fontSize: '18px', 
                                fontWeight: '700',
                                display: 'flex',
                                alignItems: 'center',
                                textShadow: '0 1px 2px rgba(0,0,0,0.1)'
                              }}>
                                <FontAwesomeIcon icon={faBook} style={{ 
                                  marginRight: '12px', 
                                  color: '#22c55e',
                                  fontSize: '20px'
                                }} /> 
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
                                {!hasExistingPassages(questionFormData.storyTitle) 
                                  ? "This is a new story. Please add the reading passages below (required for first question of this story)."
                                  : "This story already has passages. You can add passages here for this specific question, or leave empty to reference the existing story passages (will be set to null in database)."}
                              </div>
                              
                              {(questionFormData.passages && questionFormData.passages.length > 0 
                                ? questionFormData.passages 
                                : [{ pageNumber: 1, pageText: "", pageImage: null }]
                              ).map((page, index) => (
                                <div key={index} style={{ 
                                  border: '2px solid #e2e8f0', 
                                  borderRadius: '12px', 
                                  padding: '24px', 
                                  marginBottom: '20px',
                                  backgroundColor: 'white',
                                  boxShadow: '0 2px 8px rgba(0, 0, 0, 0.05)',
                                  transition: 'all 0.2s ease'
                                }}>
                                  <div style={{ 
                                    display: 'flex', 
                                    justifyContent: 'space-between', 
                                    alignItems: 'center', 
                                    marginBottom: '20px',
                                    paddingBottom: '12px',
                                    borderBottom: '2px solid #f1f5f9'
                                  }}>
                                    <h6 style={{ 
                                      margin: 0, 
                                      color: '#1e40af', 
                                      fontSize: '18px', 
                                      fontWeight: '700',
                                      display: 'flex',
                                      alignItems: 'center'
                                    }}>
                                      <FontAwesomeIcon icon={faBook} style={{ marginRight: '8px', color: '#3b82f6' }} />
                                      Page {index + 1}
                                    </h6>
                                    {index > 0 && (
                                      <button
                                        type="button"
                                        onClick={() => {
                                          setQuestionFormData(prev => ({
                                            ...prev,
                                            passages: prev.passages.filter((_, i) => i !== index)
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

                                  <div className="pa-form-group" style={{ marginBottom: '24px' }}>
                                    <label style={{ 
                                      marginBottom: '12px', 
                                      fontSize: '16px', 
                                      fontWeight: '600', 
                                      color: '#374151',
                                      display: 'flex',
                                      alignItems: 'center'
                                    }}>
                                      <FontAwesomeIcon icon={faFileAlt} style={{ marginRight: '8px', color: '#10b981' }} />
                                      Page Text:
                                      <span style={{ color: '#ef4444', marginLeft: '4px' }}>*</span>
                                    </label>
                                    <textarea
                                      value={page?.pageText || ""}
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
                                      placeholder="Enter the text for this page of the story (e.g., 'Tuwing umaga, si Juan at ang kaniyang aso na si Max ay naglalaro sa parke.')"
                                      rows={4}
                                      style={{
                                        width: '100%',
                                        padding: '14px 16px',
                                        border: '2px solid #d1d5db',
                                        borderRadius: '10px',
                                        fontSize: '15px',
                                        fontFamily: 'inherit',
                                        lineHeight: '1.6',
                                        resize: 'none',
                                        outline: 'none',
                                        transition: 'border-color 0.2s ease',
                                        backgroundColor: '#fafafa'
                                      }}
                                      onFocus={(e) => e.target.style.borderColor = '#10b981'}
                                      onBlur={(e) => e.target.style.borderColor = '#d1d5db'}
                                    ></textarea>
                                  </div>

                                  <div className="pa-form-group">
                                    <label style={{ 
                                      display: 'flex', 
                                      alignItems: 'center',
                                      marginBottom: '12px', 
                                      fontSize: '16px', 
                                      fontWeight: '600', 
                                      color: '#374151'
                                    }}>
                                      <FontAwesomeIcon icon={faImages} style={{ marginRight: '8px', color: '#f59e0b' }} />
                                      Page Image (Optional):
                                    </label>
                                    <div className="pa-file-upload" style={{
                                      padding: '16px',
                                      border: '2px dashed #e5e7eb',
                                      borderRadius: '10px',
                                      textAlign: 'center',
                                      backgroundColor: '#fafafa'
                                    }}>
                                      <label style={{
                                        display: 'inline-block',
                                        padding: '12px 24px',
                                        backgroundColor: '#3b82f6',
                                        color: 'white',
                                        borderRadius: '8px',
                                        cursor: 'pointer',
                                        fontSize: '14px',
                                        fontWeight: '500',
                                        transition: 'all 0.2s ease'
                                      }}>
                                        <FontAwesomeIcon icon={faUpload} style={{ marginRight: '8px' }} /> Choose Image
                                        <input
                                          type="file"
                                          accept="image/*"
                                          onChange={(e) => handleFileUpload(e, `pageImage-${index}`)}
                                          style={{ display: 'none' }}
                                        />
                                      </label>
                                      <div style={{ marginTop: '12px', fontSize: '14px', color: '#6b7280' }}>
                                        {page?.pageImage
                                          ? `Page ${index + 1} image uploaded successfully`
                                          : "No image selected"}
                                      </div>

                                      {page?.pageImage && (
                                        <div style={{ 
                                          marginTop: '16px',
                                          padding: '12px',
                                          backgroundColor: 'white',
                                          borderRadius: '8px',
                                          border: '1px solid #e5e7eb',
                                          position: 'relative'
                                        }}>
                                          <button
                                            type="button"
                                            onClick={() => {
                                              const currentPage = questionFormData.passages[index];
                                              cleanupImageObjectURL(currentPage.pageImage);
                                              const updatedPassages = [...questionFormData.passages];
                                              updatedPassages[index] = {
                                                ...updatedPassages[index],
                                                pageImage: null
                                              };
                                              setQuestionFormData(prev => ({
                                                ...prev,
                                                passages: updatedPassages
                                              }));
                                            }}
                                            style={{
                                              position: 'absolute',
                                              top: '8px',
                                              right: '8px',
                                              background: '#ef4444',
                                              color: 'white',
                                              border: 'none',
                                              borderRadius: '50%',
                                              width: '32px',
                                              height: '32px',
                                              cursor: 'pointer',
                                              fontSize: '14px',
                                              display: 'flex',
                                              alignItems: 'center',
                                              justifyContent: 'center',
                                              boxShadow: '0 2px 4px rgba(0,0,0,0.2)',
                                              transition: 'all 0.2s ease',
                                              zIndex: 10
                                            }}
                                            onMouseEnter={(e) => {
                                              e.target.style.backgroundColor = '#dc2626';
                                              e.target.style.transform = 'scale(1.1)';
                                            }}
                                            onMouseLeave={(e) => {
                                              e.target.style.backgroundColor = '#ef4444';
                                              e.target.style.transform = 'scale(1)';
                                            }}
                                            title="Remove image"
                                          >
                                            <FontAwesomeIcon icon={faTimes} />
                                          </button>
                                          <img
                                            src={page?.pageImage instanceof File ? URL.createObjectURL(page.pageImage) : page?.pageImage}
                                            alt={`Page ${index + 1} preview`}
                                            style={{ 
                                              maxWidth: '100%', 
                                              maxHeight: '200px', 
                                              borderRadius: '8px', 
                                              border: '2px solid #e5e7eb',
                                              objectFit: 'contain'
                                            }}
                                            onError={(e) => {
                                              console.error('Page image failed to load:', page?.pageImage);
                                              e.target.style.display = 'none';
                                            }}
                                          />
                                          <div style={{
                                            marginTop: '8px',
                                            fontSize: '12px',
                                            color: '#6b7280',
                                            textAlign: 'center'
                                          }}>
                                            Page {index + 1} preview - Click X to remove
                                          </div>
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
                                      ...prev.passages,
                                      {
                                        pageNumber: prev.passages.length + 1,
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
                          <div className="pa-form-section" style={{ 
                            marginBottom: '40px',
                            padding: '32px',
                            background: 'linear-gradient(135deg, #fefce8 0%, #fef3c7 100%)',
                            border: '2px solid #fbbf24',
                            borderRadius: '16px',
                            boxShadow: '0 4px 12px rgba(245, 158, 11, 0.15)'
                          }}>
                            <h5 style={{ 
                              color: '#92400e', 
                              marginBottom: '28px', 
                              fontSize: '20px', 
                              fontWeight: '700',
                              display: 'flex',
                              alignItems: 'center',
                              textShadow: '0 1px 2px rgba(0,0,0,0.1)'
                            }}>
                              <FontAwesomeIcon icon={faQuestion} style={{ 
                                marginRight: '12px', 
                                color: '#d97706',
                                fontSize: '22px'
                              }} /> 
                              Comprehension Questions
                            </h5>

                            {/* Show existing sentence questions */}
                            {questionFormData.sentenceQuestions.length > 0 && (
                              <div style={{ marginBottom: '24px' }}>
                                <div style={{
                                  fontSize: '14px',
                                  fontWeight: '600',
                                  color: '#374151',
                                  marginBottom: '12px'
                                }}>
                                  Questions for this story ({questionFormData.sentenceQuestions.length}):
                                </div>
                                
                                {questionFormData.sentenceQuestions.map((question, index) => (
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
                              borderRadius: '16px', 
                              padding: '40px', 
                              backgroundColor: 'white',
                              boxShadow: '0 4px 12px rgba(0, 0, 0, 0.08)',
                              margin: '0 auto',
                              maxWidth: '800px'
                            }}>
                              {/* Question Text */}
                              <div className="pa-form-group" style={{ marginBottom: '40px' }}>
                                <label style={{ 
                                  display: 'flex',
                                  alignItems: 'center',
                                  marginBottom: '12px', 
                                  fontSize: '16px', 
                                  fontWeight: '600', 
                                  color: '#374151'
                                }}>
                                  <FontAwesomeIcon icon={faQuestion} style={{ marginRight: '8px', color: '#3b82f6' }} />
                                  Question Text:
                                  <span style={{ color: '#ef4444', marginLeft: '4px' }}>*</span>
                                </label>
                                <input
                                  type="text"
                                  value={questionFormData.tempComprehensionQuestion.questionText}
                                  onChange={(e) => {
                                    // Allow only letters, spaces, and common punctuation for reading comprehension
                                    const value = e.target.value.replace(/[0-9]/g, '');
                                    setQuestionFormData(prev => ({
                                      ...prev,
                                      tempComprehensionQuestion: {
                                        ...prev.tempComprehensionQuestion,
                                        questionText: value
                                      }
                                    }));
                                  }}
                                  placeholder="Enter your question (e.g., 'Sino ang pangunahing tauhan?')"
                                  style={{
                                    width: '100%',
                                    padding: '14px 16px',
                                    border: '2px solid #d1d5db',
                                    borderRadius: '10px',
                                    fontSize: '15px',
                                    fontFamily: 'inherit',
                                    lineHeight: '1.6',
                                    backgroundColor: '#fafafa',
                                    transition: 'all 0.2s ease',
                                    outline: 'none',
                                    boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)'
                                  }}
                                  onFocus={(e) => {
                                    e.target.style.borderColor = '#3b82f6';
                                    e.target.style.boxShadow = '0 0 0 3px rgba(59, 130, 246, 0.1)';
                                  }}
                                  onBlur={(e) => {
                                    e.target.style.borderColor = '#d1d5db';
                                    e.target.style.boxShadow = '0 1px 3px rgba(0, 0, 0, 0.1)';
                                  }}
                                />
                              </div>

                              {/* Primary Answer */}
                              <div className="pa-form-group" style={{ marginBottom: '40px' }}>
                                <label style={{ 
                                  display: 'flex',
                                  alignItems: 'center',
                                  marginBottom: '12px', 
                                  fontSize: '16px', 
                                  fontWeight: '600', 
                                  color: '#374151'
                                }}>
                                  <FontAwesomeIcon icon={faCheckCircle} style={{ marginRight: '8px', color: '#10b981' }} />
                                  Primary Correct Answer:
                                  <span style={{ color: '#ef4444', marginLeft: '4px' }}>*</span>
                                </label>
                                <input
                                  type="text"
                                  value={questionFormData.tempComprehensionQuestion.correctAnswer}
                                  onChange={(e) => {
                                    // Allow only letters, spaces, and common punctuation - no numbers for reading comprehension answers
                                    const value = e.target.value.replace(/[0-9]/g, '');
                                    setQuestionFormData(prev => ({
                                      ...prev,
                                      tempComprehensionQuestion: {
                                        ...prev.tempComprehensionQuestion,
                                        correctAnswer: value
                                      }
                                    }));
                                  }}
                                  placeholder="Enter the main correct answer (e.g., 'Juan')"
                                  style={{
                                    width: '100%',
                                    padding: '14px 16px',
                                    border: '2px solid #10b981',
                                    borderRadius: '10px',
                                    fontSize: '15px',
                                    fontFamily: 'inherit',
                                    lineHeight: '1.6',
                                    backgroundColor: '#f0fdf4',
                                    transition: 'all 0.2s ease',
                                    outline: 'none',
                                    boxShadow: '0 1px 3px rgba(16, 185, 129, 0.2)'
                                  }}
                                  onFocus={(e) => {
                                    e.target.style.borderColor = '#059669';
                                    e.target.style.boxShadow = '0 0 0 3px rgba(16, 185, 129, 0.1)';
                                  }}
                                  onBlur={(e) => {
                                    e.target.style.borderColor = '#10b981';
                                    e.target.style.boxShadow = '0 1px 3px rgba(16, 185, 129, 0.2)';
                                  }}
                                />
                              </div>

                              {/* Answer Variations Section */}
                              <div className="pa-form-group">
                                <label style={{ 
                                  display: 'flex',
                                  alignItems: 'center',
                                  marginBottom: '12px', 
                                  fontSize: '16px', 
                                  fontWeight: '600', 
                                  color: '#374151'
                                }}>
                                  <FontAwesomeIcon icon={faListUl} style={{ marginRight: '8px', color: '#f59e0b' }} />
                                  Acceptable Answer Variations (Optional):
                                </label>
                                <div style={{ 
                                  fontSize: '14px', 
                                  color: '#6b7280', 
                                  marginBottom: '16px',
                                  padding: '12px 16px',
                                  backgroundColor: '#f9fafb',
                                  borderRadius: '8px',
                                  border: '1px solid #e5e7eb'
                                }}>
                                  Add different ways students might answer correctly (different cases, with/without titles, etc.)
                                </div>
                                
                                {/* Display existing acceptable answers */}
                                {questionFormData.tempComprehensionQuestion.acceptableAnswers.map((answer, index) => (
                                  <div key={index} style={{ 
                                    display: 'flex', 
                                    alignItems: 'center', 
                                    marginBottom: '8px'
                                  }}>
                                    <input
                                      type="text"
                                      value={answer}
                                      onChange={(e) => {
                                        // Remove numbers from acceptable answers
                                        const value = e.target.value.replace(/[0-9]/g, '');
                                        const updatedAnswers = [...questionFormData.tempComprehensionQuestion.acceptableAnswers];
                                        updatedAnswers[index] = value;
                                        setQuestionFormData(prev => ({
                                          ...prev,
                                          tempComprehensionQuestion: {
                                            ...prev.tempComprehensionQuestion,
                                            acceptableAnswers: updatedAnswers
                                          }
                                        }));
                                      }}
                                      placeholder="Enter answer variation (e.g., 'juan', 'si juan')"
                                      style={{
                                        flex: 1,
                                        padding: '12px 14px',
                                        border: '2px solid #d1d5db',
                                        borderRadius: '8px',
                                        fontSize: '15px',
                                        fontFamily: 'inherit',
                                        lineHeight: '1.6',
                                        marginRight: '12px',
                                        outline: 'none',
                                        transition: 'border-color 0.2s ease'
                                      }}
                                      onFocus={(e) => e.target.style.borderColor = '#3b82f6'}
                                      onBlur={(e) => e.target.style.borderColor = '#d1d5db'}
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
                                  onClick={() => {
                                    setQuestionFormData(prev => ({
                                      ...prev,
                                      tempComprehensionQuestion: {
                                        ...prev.tempComprehensionQuestion,
                                        acceptableAnswers: [...prev.tempComprehensionQuestion.acceptableAnswers, '']
                                      }
                                    }));
                                  }}
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
                                    if (!questionFormData.tempComprehensionQuestion.questionText.trim()) {
                                      toast.error('Please enter a question text.');
                                      return;
                                    }
                                    if (!questionFormData.tempComprehensionQuestion.correctAnswer.trim()) {
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
                          onChange={handleFormChange}
                          required
                          disabled={modalType === 'edit' || formData.questions.length > 0}
                          className={`pa-select-input ${(modalType === 'edit' || formData.questions.length > 0) ? 'pa-disabled-input' : ''} ${modalType === 'create' && formData.readingLevel && formData.category && !canCreateAssessment(formData.readingLevel, formData.category).canCreate ? 'pa-select-error' : ''}`}
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
                        
                        {modalType === 'create' && formData.questions.length > 0 && (
                          <div className="pa-help-text">
                            <FontAwesomeIcon icon={faInfoCircle} />
                            Category cannot be changed after questions have been created to maintain uniformity and prevent errors.
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
                          onClick={handleAddQuestion}
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
                                      {formData.category === "Reading Comprehension" 
                                        ? `Story: ${question.storyTitle || 'Untitled'} (${question.sentenceQuestions?.length || 0} questions)`
                                        : question.questionText}
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
                                  {getQuestionMetadata(question).map((meta, metaIndex) => (
                                    <span key={metaIndex} className="pa-meta-tag">
                                      <FontAwesomeIcon icon={meta.icon} /> {meta.text}
                                    </span>
                                  ))}
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
                    disabled={!formData.readingLevel || !formData.category || 
                      (formData.category === "Reading Comprehension" 
                        ? formData.questions.length === 0 || !formData.questions.some(q => q.sentenceQuestions?.length > 0) 
                        : formData.questions.length === 0) ||
                      (modalType === 'create' && !canCreateAssessment(formData.readingLevel, formData.category).canCreate)}
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