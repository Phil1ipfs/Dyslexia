/**
 * ActivityEditModal Component - Template-Only Intervention System
 *
 * TEMPLATE-ONLY APPROACH:
 * This component implements the template-only intervention system as defined in CLAUDE.md.
 * Teachers create intervention questions using templates, and all created questions automatically
 * become reusable templates for future interventions.
 *
 * API ENDPOINTS NEEDED:
 * 1. GET /api/templates/questions?category={category}
 * 2. GET /api/templates/sentences?readingLevel={level}
 * 3. POST /api/templates/questions (for inline creation)
 * 4. POST /api/uploads/s3 (for S3 image uploads)
 * 5. GET /api/interventions/check?studentId={id}&category={category} (to check for duplicates)
 * 6. POST /api/interventions (to save intervention)
 * 7. PUT /api/interventions/{id} (to update intervention)
 *
 * DATA FLOW:
 * 1. Load available templates for question creation (restricted by category)
 * 2. Allow teachers to create custom questions using category-specific forms
 * 3. Alphabet Knowledge enforces exactly 3 choices per question (non-editable)
 * 4. Check for existing interventions before saving to prevent duplicates
 * 5. Save final intervention to intervention_assessment collection
 * 6. Auto-save created questions as templates for future reuse
 *
 * JSON COLLECTIONS REFERENCED:
 * - templates_questions: Reusable question templates (single collection approach)
 * - sentence_templates: Reading comprehension passages
 * - intervention_assessment: Final saved interventions
 * - prescriptive_analysis: Analysis and recommendations for specific categories
 * 
 * @param {Object} activity - Existing activity to edit (from intervention_assessment)
 * @param {Function} onClose - Function to close the modal
 * @param {Function} onSave - Function to save the activity
 * @param {Object} student - Student information (from users collection)
 * @param {String} category - Category that needs intervention (score < 75%)
 * @param {Object} analysis - Prescriptive analysis for this category (from prescriptive_analysis collection)
 *                            Can have different formats:
 *                            - MongoDB: { _id: { $oid: "string" }, categoryId: "string", ... }
 *                            - String ID: { _id: "string", categoryId: "string", ... }
 *                            - Mock: { id: number, category: "string", ... }
 */
import React, { useState, useEffect, useRef } from 'react';
import {
  FaInfoCircle,
  FaExclamationTriangle,
  FaCheckCircle,
  FaChartLine,
  FaEdit,
  FaMagic,
  FaBook,
  FaPen,
  FaTrash,
  FaSync,
  FaLightbulb,
  FaPlus,
  FaSpinner,
  FaUser,
  FaSave,
  FaTimes,
  FaArrowRight,FaMinus,
  FaMobile,
  FaHandsHelping,
  FaChalkboardTeacher,
  FaBookOpen,
  FaUpload,
  FaImage,
  FaVolumeUp,
  FaLock
} from 'react-icons/fa';
import api from '../../../services/Teachers/api';
import { toast } from '../../../utils/toastHelper';

// Local toast system for modal validation errors
const createModalToast = (message, type = 'error') => {
  const modal = document.querySelector('.literexia-activity-edit-modal');
  if (!modal) return;

  // Clear any existing toasts first
  const existingContainer = modal.querySelector('.modal-toast-container');
  if (existingContainer) {
    existingContainer.remove();
  }

  // Create toast container
  const toastContainer = document.createElement('div');
  toastContainer.className = 'modal-toast-container';
  toastContainer.style.cssText = `
    position: fixed;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    z-index: 1000;
    pointer-events: none;
    max-width: 90vw;
    max-height: 90vh;
    overflow: auto;
  `;
  modal.appendChild(toastContainer);

  const toastId = 'modal-toast-' + Date.now();
  const toast = document.createElement('div');

  // Toast styling
  const colors = {
    success: { bg: '#10b981', border: '#059669' },
    error: { bg: '#ef4444', border: '#dc2626' },
    warning: { bg: '#f59e0b', border: '#d97706' },
    info: { bg: '#3b82f6', border: '#2563eb' }
  };

  const color = colors[type] || colors.error;

  toast.id = toastId;
  toast.style.cssText = `
    background: ${color.bg};
    color: white;
    padding: 16px 20px;
    margin-bottom: 12px;
    border-radius: 12px;
    border-left: 4px solid ${color.border};
    box-shadow: 0 8px 25px rgba(0, 0, 0, 0.25);
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    font-size: 15px;
    font-weight: 500;
    line-height: 1.5;
    max-width: 400px;
    min-width: 300px;
    word-wrap: break-word;
    pointer-events: auto;
    transform: scale(0.8) translateY(-20px);
    transition: all 0.3s ease-in-out;
    opacity: 0;
    cursor: pointer;
    text-align: center;
  `;

  toast.textContent = message;

  // Add click to dismiss
  toast.onclick = () => {
    toast.style.transform = 'scale(0.8) translateY(-20px)';
    toast.style.opacity = '0';
    setTimeout(() => {
      if (toast.parentNode) {
        toast.parentNode.removeChild(toast);
      }
    }, 300);
  };

  toastContainer.appendChild(toast);

  // Animate in
  requestAnimationFrame(() => {
    toast.style.transform = 'scale(1) translateY(0)';
    toast.style.opacity = '1';
  });

  // Auto dismiss after 6 seconds
  setTimeout(() => {
    toast.style.transform = 'scale(0.8) translateY(-20px)';
    toast.style.opacity = '0';
    setTimeout(() => {
      if (toast.parentNode) {
        toast.parentNode.removeChild(toast);
      }
    }, 300);
  }, 6000);

  return toastId;
};

import './css/ActivityEditModal.css';
import './css/AlphabetKnowledgeActivityEdit.css';
import './css/PhonologicalAwarenessActivityEdit.css';
import './css/DecodingActivityEdit.css';
import './css/ReadingComprehensionActivityEdit.css';

// Utility function to safely handle arrays that might be undefined
const safe = (arr) => Array.isArray(arr) ? arr : [];

// Utility function to normalize category names
const normalizeCategory = (rawCategory = '') => {
  return typeof rawCategory === 'string' 
    ? rawCategory.toLowerCase().replace(/\s+/g, '_')
    : '';
};

/**
 * Sanitizes the image URL by fixing any corrupted S3 URLs
 * @param {string} url - The potentially corrupted image URL
 * @returns {string} The sanitized image URL
 */
const sanitizeImageUrl = (url) => {
  if (!url) return '';
  
  // Check if the URL contains JavaScript code (a sign of corruption)
  if (url.includes('async () =>') || url.includes('function(') || url.includes('=>')) {
    // Extract the filename from the corrupted URL if possible
    const filenameMatch = url.match(/main-assessment\/[^/]*\/([^/]+)/);
    const filename = filenameMatch ? filenameMatch[1] : '';
    
    if (filename) {
      // Reconstruct a valid S3 URL with the extracted filename
      return `https://literexia-bucket.s3.amazonaws.com/main-assessment/sentences/${filename}`;
    } else {
      console.error('Could not parse corrupted image URL:', url);
      return '';
    }
  }
  
  return url;
};

// Helper function to format category name - moved outside component
const formatCategoryName = (categoryName) => {
  if (!categoryName) return "Unknown Category";
  
  return categoryName
    .replace(/_/g, ' ')
    .replace(/\b\w/g, l => l.toUpperCase());
};

// Simple debounce function implementation
const debounce = (func, delay) => {
  let timeoutId;
  return (...args) => {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => func(...args), delay);
  };
};

const ActivityEditModal = ({ activity, onClose, onSave, student, category, analysis }) => {
  // Cleanup function to remove modal toasts
  const cleanupModalToasts = () => {
    const modal = document.querySelector('.literexia-activity-edit-modal');
    if (modal) {
      const toastContainer = modal.querySelector('.modal-toast-container');
      if (toastContainer) {
        toastContainer.remove();
      }
    }
  };

  // Enhanced close function that cleans up toasts
  const handleClose = () => {
    cleanupModalToasts();
    onClose();
  };

  // Cleanup toasts when component unmounts
  React.useEffect(() => {
    return () => {
      cleanupModalToasts();
    };
  }, []);
  // ===== UTILITY FUNCTIONS (COMPONENT LEVEL) =====

  // Helper function to get a valid ObjectId for teacher implementation
  // Available globally in this component for all functions to use
  const getValidTeacherId = () => {
    const userId = localStorage.getItem('userId');
    if (userId && userId.length === 24 && /^[a-fA-F0-9]{24}$/.test(userId)) {
      // Valid 24-character hex ObjectId format
      console.log("[UTILITY] Using valid ObjectId from localStorage:", userId);
      return userId;
    }
    // Return a valid default ObjectId (can be a system/default teacher ID)
    const defaultTeacherId = '507f1f77bcf86cd799439011';
    console.log("[UTILITY] Using default teacher ObjectId:", defaultTeacherId);
    return defaultTeacherId;
  };

  // ===== STATE MANAGEMENT =====
  
  /** quick map: { choiceId: displayText }  */
  const [questionValueLookup, setQuestionValueLookup] = useState({});
  
  // Basic activity information
  const [title, setTitle] = useState(
    activity?.name || 
    `Intervention for ${student?.firstName || 'Student'}`
  );
  const [description, setDescription] = useState(
    activity?.description || 
    `Targeted practice activities for improving skills`
  );
  const [readingLevel] = useState(student?.readingLevel); // Dynamic reading level from student
  
  // Saving and loading states
  const [submitting, setSubmitting] = useState(false);
  const [saveCompleted, setSaveCompleted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  
  // Checking for existing interventions
  const [existingIntervention, setExistingIntervention] = useState(null);
  const [checkingExisting, setCheckingExisting] = useState(false);
  
  // Prescriptive analysis from MongoDB
  const [mongoDbAnalysis, setMongoDbAnalysis] = useState(null);
  
  // Step management for wizard-style interface
  const [currentStep, setCurrentStep] = useState(1);
  
  // Content type is determined by category
  const [contentType, setContentType] = useState('');
  
  // API Data States
  const [questionTemplates, setQuestionTemplates] = useState([]);
  const [choiceTemplates, setChoiceTemplates] = useState([]);
  const [sentenceTemplates, setSentenceTemplates] = useState([]);
  
  // Question Management
  const [questionChoicePairs, setQuestionChoicePairs] = useState([]);
  
  // For Reading Comprehension - Simplified approach
  const [selectedSentenceTemplate, setSelectedSentenceTemplate] = useState(null);

  // Custom Reading Comprehension Content - Support Multiple Activities
  const [customReadingComprehensionActivities, setCustomReadingComprehensionActivities] = useState([
    {
      id: 'rc_activity_default',
      storyTitle: '',
      storyPages: [],
      questions: [],
      selectedTemplate: null // Each activity can have its own template selection
    }
  ]);
  const [activeActivityIndex, setActiveActivityIndex] = useState(0);

  // Image Upload State
  const [uploadingImage, setUploadingImage] = useState(false);
  const [currentUploadTarget, setCurrentUploadTarget] = useState(null);
  const fileInputRef = useRef(null);
  
  // Pending uploads - files that need to be uploaded when saving
  const [pendingUploads, setPendingUploads] = useState({});
  
  // Inline Creation States
  const [showNewTemplateForm, setShowNewTemplateForm] = useState(false);
  const [showNewChoiceFormByPair, setShowNewChoiceFormByPair] = useState({});
  const [newTemplateData, setNewTemplateData] = useState({
    templateText: '',
    questionType: '',
    applicableChoiceTypes: []
  });
  const [newChoiceData, setNewChoiceData] = useState({
    choiceType: '',
    choiceValue: '',
    soundText: '',
    choiceImage: null,
    description: ''
  });
  
  // UI States
  const [errors, setErrors] = useState({});
  const [creatingTemplate, setCreatingTemplate] = useState(false);
  const [fileUploads, setFileUploads] = useState({});
  const fileInputRefs = useRef({});

  // Reading Comprehension Image Upload Refs
  const storyPageImageRefs = useRef({});
  
  /**
   * Find MongoDB prescriptive analysis for student and category
   * This function will load the MongoDB prescriptive analysis from the provided analysis data
   * or from an API call if needed
   */
  const findMongoDbAnalysis = async () => {
    // Get the student ID - prioritize idNumber since that's what prescriptive analysis uses
    console.log("🔍 [DEBUG] Student object structure:", {
      student,
      idNumber: student?.idNumber,
      studentId: student?.studentId,
      _id: student?._id,
      id: student?.id
    });

    // Try to extract the student ID number (not MongoDB ObjectId)
    let studentId = student?.idNumber || student?.studentId;

    // If we still don't have a numeric student ID, check if it's a numeric string in other fields
    if (!studentId || typeof studentId !== 'number') {
      // Look for numeric IDs in other fields
      const potentialIds = [student?.id, student?._id, student?.idNumber, student?.studentId];
      for (const id of potentialIds) {
        if (typeof id === 'number' && id > 1000000) { // Student IDs are typically large numbers like 202522233
          studentId = id;
          break;
        }
        if (typeof id === 'string' && /^\d{6,10}$/.test(id)) { // 6-10 digit numeric string
          studentId = parseInt(id);
          break;
        }
      }
    }

    console.log("🔍 [DEBUG] Extracted studentId:", studentId, "Type:", typeof studentId);

    if (!studentId || !category) {
      console.error("❌ Missing student ID or category to find MongoDB analysis. StudentId:", studentId, "Category:", category);
      return null;
    }

    console.log("Finding MongoDB analysis for student:", studentId, "and category:", category);
    
    try {
      // First, check if the analysis prop is already in MongoDB format
      if (analysis) {
        console.log("Checking if provided analysis is MongoDB format:", analysis);

        // Check if it's MongoDB format with $oid
        if (analysis._id && analysis._id.$oid) {
          console.log("Found MongoDB analysis with $oid:", analysis._id.$oid);
          setMongoDbAnalysis(analysis);
          return analysis;
        }

        // If it's MongoDB format with string ID (24 hex chars)
        if (analysis._id && typeof analysis._id === 'string' && /^[0-9a-fA-F]{24}$/.test(analysis._id)) {
          console.log("Found MongoDB analysis with valid ObjectId string:", analysis._id);
          setMongoDbAnalysis(analysis);
          return analysis;
        }

        // Check if the analysis has the full MongoDB prescriptive analysis structure
        if (analysis.skillMastery && analysis.errorPatterns && analysis.interventionPlan) {
          console.log("Found complete MongoDB prescriptive analysis structure");
          setMongoDbAnalysis(analysis);
          return analysis;
        }
      }
      
      // If no MongoDB analysis found in props, try to fetch from API
      console.log("Fetching MongoDB analysis from API...");
      try {
        const response = await api.interventions.getPrescriptiveAnalysis(studentId, category);
        if (response.data.success && response.data.data) {
          console.log("API returned MongoDB analysis:", response.data.data);
          setMongoDbAnalysis(response.data.data);
          return response.data.data;
        }
      } catch (error) {
        console.error("Error fetching MongoDB analysis:", error);
      }
      
      // NO DUMMY DATA - ONLY REAL DATA FROM DATABASE
      console.error("❌ NO REAL PRESCRIPTIVE ANALYSIS FOUND in database for student:", studentId, "category:", category);
      console.error("❌ This means the backend CategoryResultsService automatic trigger failed!");
      console.error("❌ Student", studentId, "needs a valid prescriptive_analysis record in the database");

      // Don't set any analysis data - return null to indicate missing data
      setMongoDbAnalysis(null);
      
      return null;
    } catch (error) {
      console.error("Error in findMongoDbAnalysis:", error);
      return null;
    }
  };
  
  // Update title and description after component mounts
  useEffect(() => {
    // Log student object for debugging
    console.log("Student object received in ActivityEditModal:", student);
    
    if (!activity?.name) {
      setTitle(`${formatCategoryName(category)} Intervention for ${student?.firstName || 'Student'}`);
    }
    
    if (!activity?.description) {
      setDescription(`Targeted practice activities to improve ${formatCategoryName(category)} skills`);
    }
    
    // Check for existing interventions for this student/category
    if (!activity) {
      checkExistingInterventions();
    }
    
    // Find MongoDB prescriptive analysis for this student and category
    findMongoDbAnalysis();
  }, [activity, category, student]);
  
  // Separate effect for logging analysis to avoid dependency array size changes
  useEffect(() => {
    if (analysis) {
      console.log("✅ [ANALYSIS DEBUG] Analysis object received in ActivityEditModal:", analysis);
      console.log("✅ [ANALYSIS DEBUG] Analysis type:", typeof analysis);
      console.log("✅ [ANALYSIS DEBUG] Analysis keys:", Object.keys(analysis));

      // Log the structure of the analysis for debugging
      if (analysis._id && typeof analysis._id === 'object' && analysis._id.$oid) {
        console.log("✅ [ANALYSIS DEBUG] MongoDB format analysis with $oid:", analysis._id.$oid);
      } else if (analysis._id && typeof analysis._id === 'string') {
        console.log("✅ [ANALYSIS DEBUG] MongoDB format analysis with string ID:", analysis._id);
      } else if (analysis.id) {
        console.log("Mock format analysis with id:", analysis.id);
      }
    }
  }, [analysis]);
  
  // Add a useEffect to track questionTemplates state changes
  useEffect(() => {
    console.log('🔄 [TEMPLATE STATE CHANGE] questionTemplates state changed:', {
      length: questionTemplates.length,
      isArray: Array.isArray(questionTemplates),
      firstTemplate: questionTemplates[0] ? {
        _id: questionTemplates[0]._id,
        category: questionTemplates[0].category,
        questionType: questionTemplates[0].questionType,
        questionText: questionTemplates[0].questionText
      } : null
    });
  }, [questionTemplates]);

  // Add a useEffect to clean up object URLs when component unmounts
  useEffect(() => {
    // Cleanup function to revoke object URLs when component unmounts
    return () => {
      // Revoke all local URLs created for file previews
      Object.values(fileUploads).forEach(upload => {
        if (upload?.localUrl) {
          URL.revokeObjectURL(upload.localUrl);
        }
      });
    };
  }, [fileUploads]);
  
  // Effect to handle modal cleanup on unmount
  useEffect(() => {
    // This cleanup function will run when the component unmounts
    return () => {
      console.log("ActivityEditModal unmounting, performing cleanup");
      // Reset any critical state variables to ensure proper behavior on remount
      setSubmitting(false);
      setErrors({});
    };
  }, []); // Empty dependency array means this runs only on mount/unmount
  
  // Effect to apply descriptions from activity choices to templates
  // Fix the infinite loop by using a ref to track if we've already processed the activity
  const processedActivityRef = useRef(false);
  
  useEffect(() => {
    // Only run this when we have both activity data and choice templates loaded
    // And only if we haven't processed this activity before
    if (activity?.questions && safe(choiceTemplates).length > 0 && !processedActivityRef.current) {
      console.log("Applying descriptions from activity choices to choice templates");
      processedActivityRef.current = true; // Mark as processed to prevent infinite loop
      
      // Create a map of choice IDs to descriptions from the activity
      const choiceDescriptions = {};
      
      activity.questions.forEach(question => {
        if (question.choices && Array.isArray(question.choices)) {
          // Match choices with their IDs using different possible formats
          
          // Format 1: Direct mapping by index
          if (question.choiceIds && Array.isArray(question.choiceIds)) {
            question.choices.forEach((choice, index) => {
              const choiceId = question.choiceIds[index];
              if (choiceId && choice.description) {
                choiceDescriptions[choiceId] = choice.description;
                console.log(`Found description for choice ${choiceId} by index: "${choice.description}"`);
              }
            });
          }
          
          // Format 2: Choices might have their own IDs
          question.choices.forEach(choice => {
            // Check if the choice has its own ID reference
            if (choice._id && typeof choice._id === 'string') {
              choiceDescriptions[choice._id] = choice.description;
              console.log(`Found description for choice ${choice._id} from choice._id: "${choice.description}"`);
            } else if (choice._id && choice._id.$oid) {
              // Handle MongoDB format with $oid
              choiceDescriptions[choice._id.$oid] = choice.description;
              console.log(`Found description for choice ${choice._id.$oid} from choice._id.$oid: "${choice.description}"`);
            }
            
            // Try to match by optionText if there's no direct ID mapping
            if (choice.optionText) {
              const matchingTemplates = choiceTemplates.filter(template => 
                (template.choiceValue && template.choiceValue === choice.optionText) || 
                (template.soundText && template.soundText === choice.optionText)
              );
              
              matchingTemplates.forEach(template => {
                choiceDescriptions[template._id] = choice.description;
                console.log(`Found description for choice ${template._id} by matching text: "${choice.description}"`);
              });
            }
          });
        }
      });
      
      // Apply the descriptions to the choice templates
      if (Object.keys(choiceDescriptions).length > 0) {
        console.log(`Found ${Object.keys(choiceDescriptions).length} descriptions to apply`);
        setChoiceTemplates(prev => 
          prev.map(template => {
            const description = choiceDescriptions[template._id];
            if (description) {
              console.log(`Updating description for choice ${template._id}: "${description}"`);
              return { ...template, description };
            }
            return template;
          })
        );
      } else {
        console.log("No descriptions found to apply to choice templates");
      }
    }
  }, [activity, safe(choiceTemplates).length]); // Only depend on the length, not the entire array
  
  // Initialize from existing activity when component mounts and data is available
  useEffect(() => {
    if (activity && safe(choiceTemplates).length > 0) {
      initializeFromExistingActivity();
    }
  }, [activity, safe(choiceTemplates).length]);
  
  // Helper function to toggle choice form for a specific pair
  const toggleChoiceForm = (pairId, open) =>
    setShowNewChoiceFormByPair(prev => ({ ...prev, [pairId]: open }));
    
  // ===== HELPER FUNCTIONS =====

  /**
   * Create a new intervention
   * API: POST /api/interventions
   */
  const createIntervention = async (interventionData) => {
    try {
      console.log('Creating new intervention:', interventionData);
      
      // Validate studentId
      if (!interventionData.studentId) {
        throw new Error('Student ID is required');
      }
      
      // Log the student ID format for debugging
      console.log(`Student ID type: ${typeof interventionData.studentId}`);
      console.log(`Student ID value: ${interventionData.studentId}`);
      
      // Ensure questions array is valid
      if (!interventionData.questions || !Array.isArray(interventionData.questions)) {
        throw new Error('Questions must be a valid array');
      }
      
      // Log the number of questions
      console.log(`Number of questions: ${interventionData.questions.length}`);
      
      // Check for valid data structure in each question (category-specific validation per CLAUDE.md)
      interventionData.questions.forEach((question, index) => {
        const normCategory = normalizeCategory(category);

        switch (normCategory) {
          case 'phonological_awareness':
            // Phonological Awareness uses questionSet structure
            if (!question.questionSet || typeof question.questionSet !== 'object') {
              console.error(`[SAVE] ❌ Question ${index} questionSet validation failed:`, {
                question: question,
                questionSet: question.questionSet,
                questionSetType: typeof question.questionSet,
                isObject: typeof question.questionSet === 'object'
              });
              throw new Error(`Question ${index} has invalid questionSet for Phonological Awareness`);
            }

            // Validate questionSet structure
            const questionSetData = question.questionSet; // Direct object access
            if (!questionSetData.audioTexts || !Array.isArray(questionSetData.audioTexts) || questionSetData.audioTexts.length === 0) {
              console.error(`[SAVE] ❌ Question ${index} audioTexts validation failed:`, questionSetData);
              throw new Error(`Question ${index} has invalid audioTexts`);
            }

            // Validate audio texts are not empty
            const validAudioTexts = questionSetData.audioTexts.filter(text => text && text.trim());
            if (validAudioTexts.length === 0) {
              console.error(`[SAVE] ❌ Question ${index} has no valid audio texts:`, questionSetData.audioTexts);
              throw new Error(`Question ${index} has no valid audio texts`);
            }

            console.log(`✅ Question ${index} has ${validAudioTexts.length} valid audio texts for Phonological Awareness`);
            break;

          case 'decoding':
            // Decoding uses dragElements and correctSequence structure
            if (!question.dragElements || !Array.isArray(question.dragElements) || question.dragElements.length === 0) {
              console.error(`[SAVE] ❌ Question ${index} dragElements validation failed:`, {
                question: question,
                dragElements: question.dragElements
              });
              throw new Error(`Question ${index} has invalid dragElements for Decoding`);
            }

            if (!question.correctSequence || !Array.isArray(question.correctSequence) || question.correctSequence.length === 0) {
              console.error(`[SAVE] ❌ Question ${index} correctSequence validation failed:`, {
                question: question,
                correctSequence: question.correctSequence
              });
              throw new Error(`Question ${index} has invalid correctSequence for Decoding`);
            }

            console.log(`✅ Question ${index} has valid Decoding structure with ${question.dragElements.length} drag elements`);
            break;

          case 'word_recognition':
            // Word Recognition uses displayWord, blankOptions, correctAnswer structure
            if (!question.displayWord || typeof question.displayWord !== 'string') {
              console.error(`[SAVE] ❌ Question ${index} displayWord validation failed:`, {
                question: question,
                displayWord: question.displayWord
              });
              throw new Error(`Question ${index} has invalid displayWord for Word Recognition`);
            }

            if (!question.blankOptions || !Array.isArray(question.blankOptions) || question.blankOptions.length === 0) {
              console.error(`[SAVE] ❌ Question ${index} blankOptions validation failed:`, {
                question: question,
                blankOptions: question.blankOptions
              });
              throw new Error(`Question ${index} has invalid blankOptions for Word Recognition`);
            }

            if (!question.correctAnswer || !Array.isArray(question.correctAnswer) || question.correctAnswer.length === 0) {
              console.error(`[SAVE] ❌ Question ${index} correctAnswer validation failed:`, {
                question: question,
                correctAnswer: question.correctAnswer
              });
              throw new Error(`Question ${index} has invalid correctAnswer for Word Recognition`);
            }

            console.log(`✅ Question ${index} has valid Word Recognition structure with ${question.blankOptions.length} options`);
            break;

          case 'reading_comprehension':
            // Reading Comprehension uses sentenceQuestions structure with CLAUDE.md specifications
            if (!question.sentenceQuestions || !Array.isArray(question.sentenceQuestions) || question.sentenceQuestions.length === 0) {
              console.error(`[SAVE] ❌ Question ${index} sentenceQuestions validation failed:`, {
                question: question,
                sentenceQuestions: question.sentenceQuestions
              });
              throw new Error(`Question ${index} has invalid sentenceQuestions for Reading Comprehension`);
            }

            // Validate storyTitle if present (CLAUDE.md specification)
            if (question.storyTitle && typeof question.storyTitle !== 'string') {
              console.error(`[SAVE] ❌ Question ${index} invalid storyTitle:`, question.storyTitle);
              throw new Error(`Question ${index} has invalid storyTitle - must be string`);
            }

            // Validate passages structure if present (CLAUDE.md specification)
            if (question.passages) {
              if (!Array.isArray(question.passages)) {
                console.error(`[SAVE] ❌ Question ${index} passages must be array:`, question.passages);
                throw new Error(`Question ${index} passages must be an array`);
              }

              question.passages.forEach((passage, passageIndex) => {
                if (!passage.pageNumber || typeof passage.pageNumber !== 'number') {
                  console.error(`[SAVE] ❌ Question ${index}, passage ${passageIndex} invalid pageNumber:`, passage);
                  throw new Error(`Question ${index}, passage ${passageIndex} must have valid pageNumber`);
                }
                if (!passage.pageText && !passage.text) {
                  console.error(`[SAVE] ❌ Question ${index}, passage ${passageIndex} missing text:`, passage);
                  throw new Error(`Question ${index}, passage ${passageIndex} must have pageText or text`);
                }
              });
            }

            // Validate responseStructure if present (array response format specification)
            if (question.responseStructure) {
              if (question.responseStructure.format === 'array') {
                if (!question.responseStructure.expectedResponseCount ||
                    typeof question.responseStructure.expectedResponseCount !== 'number' ||
                    question.responseStructure.expectedResponseCount !== question.sentenceQuestions.length) {
                  console.error(`[SAVE] ❌ Question ${index} responseStructure expectedResponseCount mismatch:`, {
                    expected: question.responseStructure.expectedResponseCount,
                    actual: question.sentenceQuestions.length
                  });
                  throw new Error(`Question ${index} responseStructure expectedResponseCount must match sentenceQuestions length`);
                }
              }
            }

            // Validate each sentence question has required fields
            question.sentenceQuestions.forEach((sentenceQ, sentenceIndex) => {
              if (!sentenceQ.questionText || typeof sentenceQ.questionText !== 'string') {
                console.error(`[SAVE] ❌ Question ${index}, sentence ${sentenceIndex} missing questionText:`, sentenceQ);
                throw new Error(`Question ${index}, sentence ${sentenceIndex} has invalid questionText`);
              }
              if (!sentenceQ.sentenceCorrectAnswer || typeof sentenceQ.sentenceCorrectAnswer !== 'string') {
                console.error(`[SAVE] ❌ Question ${index}, sentence ${sentenceIndex} missing sentenceCorrectAnswer:`, sentenceQ);
                throw new Error(`Question ${index}, sentence ${sentenceIndex} has invalid sentenceCorrectAnswer`);
              }

              // Validate sentenceAcceptableAnswer if present (CLAUDE.md specification)
              if (sentenceQ.sentenceAcceptableAnswer && !Array.isArray(sentenceQ.sentenceAcceptableAnswer)) {
                console.error(`[SAVE] ❌ Question ${index}, sentence ${sentenceIndex} sentenceAcceptableAnswer must be array:`, sentenceQ);
                throw new Error(`Question ${index}, sentence ${sentenceIndex} sentenceAcceptableAnswer must be an array`);
              }

              // Note: sentenceOptionAnswers field removed - doesn't exist in main assessment
            });

            console.log(`✅ Question ${index} has valid Reading Comprehension structure with ${question.sentenceQuestions.length} sentence questions`);
            break;

          case 'alphabet_knowledge':
          default:
            // Alphabet Knowledge and other categories use choiceOptions structure
            if (!question.choiceOptions || !Array.isArray(question.choiceOptions)) {
              console.error(`[SAVE] ❌ Question ${index} choiceOptions validation failed:`, {
                question: question,
                choiceOptions: question.choiceOptions,
                choiceOptionsType: typeof question.choiceOptions,
                isArray: Array.isArray(question.choiceOptions)
              });
              throw new Error(`Question ${index} has invalid choiceOptions for ${category}`);
            }

            // Validate each choice has required fields
            question.choiceOptions.forEach((choice, choiceIndex) => {
              if (!choice.optionText && choice.optionText !== '') {
                console.error(`[SAVE] ❌ Question ${index}, choice ${choiceIndex} missing optionText:`, choice);
                throw new Error(`Question ${index}, choice ${choiceIndex} has invalid optionText`);
              }
              if (typeof choice.isCorrect !== 'boolean') {
                console.error(`[SAVE] ❌ Question ${index}, choice ${choiceIndex} invalid isCorrect:`, choice);
                throw new Error(`Question ${index}, choice ${choiceIndex} has invalid isCorrect field`);
              }
            });

            console.log(`✅ Question ${index} has ${question.choiceOptions.length} valid choices for ${category}`);
            break;
        }
      });
      
      // Log the complete intervention data being sent to backend
      console.log('🚀 [SAVE] Complete intervention data being sent to backend:', {
        url: '/api/intervention-assessment',
        method: 'POST',
        category: category,
        studentId: interventionData.studentId,
        totalQuestions: interventionData.totalQuestions,
        questionsStructure: interventionData.questions.map((q, index) => ({
          questionIndex: index,
          questionId: q.questionId,
          questionType: q.questionType,
          hasQuestionSet: !!q.questionSet,
          hasChoiceOptions: !!q.choiceOptions,
          hasDragElements: !!q.dragElements,
          hasDisplayWord: !!q.displayWord,
          hasSentenceQuestions: !!q.sentenceQuestions,
          structure: Object.keys(q).filter(key =>
            ['questionSet', 'choiceOptions', 'dragElements', 'displayWord', 'blankOptions', 'correctAnswer', 'sentenceQuestions'].includes(key)
          )
        })),
        fullData: JSON.stringify(interventionData, null, 2)
      });

      // Make the API call
      try {
        console.log('🔄 [SAVE] Making API call to create intervention...');
        const response = await api.interventions.create(interventionData);
        console.log('✅ [SAVE] Intervention creation response:', response.data);
        return response.data.data;
      } catch (apiError) {
        console.error('API error creating intervention:', apiError);
        
        // Extract and log more error details
        if (apiError.response) {
          console.error('API error status:', apiError.response.status);
          console.error('API error data:', apiError.response.data);
          
          // If the API returned specific error information, include it in the thrown error
          if (apiError.response.data && apiError.response.data.message) {
            throw new Error(`API Error: ${apiError.response.data.message}`);
          }
          
          // If there are validation errors, log them in detail
          if (apiError.response.data && apiError.response.data.validationErrors) {
            const validationErrors = apiError.response.data.validationErrors;
            const errorFields = Object.keys(validationErrors).join(', ');
            throw new Error(`Validation errors in fields: ${errorFields}`);
          }
        }
        
        // Re-throw the original error if we couldn't extract more information
        throw apiError;
      }
    } catch (error) {
      console.error('Error creating intervention:', error);
      throw error;
    }
  };

  /**
   * Update an existing intervention with versioning support
   * API: PUT /api/interventions/{id}
   * UPDATED: Added intervention versioning system as per CLAUDE.md specification
   */
  const updateIntervention = async (interventionId, interventionData) => {
    try {
      console.log(`[INTERVENTION UPDATE] Starting update for intervention ${interventionId}`);
      console.log(`[INTERVENTION UPDATE] Intervention data:`, interventionData);

      // Step 1: Check if this intervention has failed and needs versioning
      let needsVersioning = false;
      let currentIntervention = null;

      try {
        // Fetch current intervention to check its status
        const currentResponse = await api.interventions.getById(interventionId);
        currentIntervention = currentResponse.data;
        console.log(`[INTERVENTION UPDATE] Current intervention:`, currentIntervention);

        // Check if intervention has failed results that require versioning
        if (currentIntervention) {
          const hasFailedResults = currentIntervention.interventionResultsId ||
                                 (currentIntervention.interventionResults && currentIntervention.interventionResults.length > 0);

          if (hasFailedResults) {
            console.log(`[INTERVENTION UPDATE] ✅ Intervention has existing results - creating version ${(currentIntervention.revisionNumber || 1) + 1}`);
            needsVersioning = true;
          } else {
            console.log(`[INTERVENTION UPDATE] No existing results found - updating current version`);
          }
        }
      } catch (error) {
        console.warn(`[INTERVENTION UPDATE] Could not fetch current intervention status:`, error);
        // Continue with normal update if we can't determine status
      }

      // Step 2: Apply versioning logic if needed
      if (needsVersioning && currentIntervention) {
        console.log(`[INTERVENTION UPDATE] 🔄 Applying intervention versioning system`);

        // Increment revision number
        const newRevisionNumber = (currentIntervention.revisionNumber || 1) + 1;
        interventionData.revisionNumber = newRevisionNumber;

        console.log(`[INTERVENTION UPDATE] ✅ Incremented revisionNumber: ${currentIntervention.revisionNumber || 1} → ${newRevisionNumber}`);

        // Create revision history entry
        const revisionEntry = {
          version: newRevisionNumber,
          editedBy: getValidTeacherId(),
          editedAt: new Date().toISOString(),
          changes: "Teacher revision after intervention failure - questions modified per student needs",
          prescriptionCompliance: "revised_for_student_needs"
        };

        // Add to revision history
        interventionData.revisionHistory = [
          ...(currentIntervention.revisionHistory || []),
          revisionEntry
        ];

        console.log(`[INTERVENTION UPDATE] ✅ Added revision history entry:`, revisionEntry);

        // Clear intervention completion status for new version (as per CLAUDE.md)
        interventionData.completedAt = null;
        interventionData.startedAt = null;
        interventionData.interventionResultsId = null;
        interventionData.interventionResults = []; // Clear results array but keep historical record

        // Update last edited metadata
        interventionData.lastEditedBy = getValidTeacherId();
        interventionData.lastEditedAt = new Date().toISOString();
        interventionData.updatedAt = new Date().toISOString();

        console.log(`[INTERVENTION UPDATE] ✅ Reset completion status for version ${newRevisionNumber}`);
        console.log(`[INTERVENTION UPDATE] ✅ Previous intervention_results preserved as reference for prescriptive analysis`);
        console.log(`[INTERVENTION UPDATE] ✅ Student can now retake revised intervention version ${newRevisionNumber}`);

        // Status remains active for student to retake
        interventionData.status = 'active';

        // Log the versioning changes for audit trail
        console.log(`[INTERVENTION UPDATE] 📝 VERSIONING SUMMARY:`);
        console.log(`[INTERVENTION UPDATE] - Previous version: ${currentIntervention.revisionNumber || 1}`);
        console.log(`[INTERVENTION UPDATE] - New version: ${newRevisionNumber}`);
        console.log(`[INTERVENTION UPDATE] - Previous results preserved: ${currentIntervention.interventionResultsId ? 'Yes' : 'No'}`);
        console.log(`[INTERVENTION UPDATE] - Ready for student retake: Yes`);
        console.log(`[INTERVENTION UPDATE] - Mobile will detect version change: Yes`);

      } else {
        console.log(`[INTERVENTION UPDATE] No versioning needed - standard update`);
      }

      // Step 3: Perform the actual update
      const response = await api.interventions.update(interventionId, interventionData);
      console.log('[INTERVENTION UPDATE] ✅ Update response:', response.data);

      if (needsVersioning) {
        console.log(`[INTERVENTION UPDATE] 🎯 INTERVENTION VERSIONING COMPLETE`);
        console.log(`[INTERVENTION UPDATE] 📱 Mobile app will detect revisionNumber change and allow student retake`);
        console.log(`[INTERVENTION UPDATE] 📊 Previous intervention_results remain as reference for analytics`);
        console.log(`[INTERVENTION UPDATE] 🔄 New intervention_results will be created when student completes version ${interventionData.revisionNumber}`);
      }

      return response.data.data;
    } catch (error) {
      console.error('[INTERVENTION UPDATE] ❌ Error updating intervention:', error);
      throw error;
    }
  };

  /**
   * Create intervention revision (VERSION 2, 3, etc.)
   * API: PUT /api/intervention-assessment/{id} with revision data
   * SPEC: CLAUDE.md Doctor-Teacher-Student model - Teacher creates revisions
   */
  const createInterventionRevision = async (interventionId, interventionData) => {
    try {
      console.log(`[INTERVENTION REVISION] ✅ Creating revision for intervention ${interventionId}`);
      console.log(`[INTERVENTION REVISION] Revision data:`, interventionData);

      // Step 1: Get current intervention to determine next revision number
      let currentIntervention = null;
      try {
        const currentResponse = await api.interventions.getById(interventionId);
        // Fix data access - use response.data.data for the actual intervention data
        currentIntervention = currentResponse.data?.data || currentResponse.data;
        console.log(`[INTERVENTION REVISION] Current intervention:`, currentIntervention);
        console.log(`[INTERVENTION REVISION] 🔍 DEBUGGING REVISION DATA:`);
        console.log(`[INTERVENTION REVISION] - Response success:`, currentResponse.success);
        console.log(`[INTERVENTION REVISION] - Current revisionNumber:`, currentIntervention.revisionNumber);
        console.log(`[INTERVENTION REVISION] - Current revisionHistory:`, currentIntervention.revisionHistory);
        console.log(`[INTERVENTION REVISION] - RevisionHistory length:`, currentIntervention.revisionHistory?.length || 0);
        console.log(`[INTERVENTION REVISION] - Last revision entry:`, currentIntervention.revisionHistory?.[currentIntervention.revisionHistory.length - 1]);
        console.log(`[INTERVENTION REVISION] - Expected next revision should be:`, (currentIntervention.revisionNumber || 1) + 1);
      } catch (error) {
        console.error(`[INTERVENTION REVISION] Could not fetch current intervention:`, error);
        throw new Error('Cannot create revision - unable to fetch current intervention');
      }

      // Step 2: Calculate next revision number
      const currentRevision = currentIntervention.revisionNumber || 1; // Fixed property access
      const newRevisionNumber = currentRevision + 1;
      console.log(`[INTERVENTION REVISION] 🔍 REVISION CALCULATION:`);
      console.log(`[INTERVENTION REVISION] - currentIntervention.revisionNumber:`, currentIntervention.revisionNumber);
      console.log(`[INTERVENTION REVISION] - Calculated newRevisionNumber:`, newRevisionNumber);
      console.log(`[INTERVENTION REVISION] Creating revision number: ${newRevisionNumber}`);

      console.log(`[INTERVENTION REVISION] 🔄 REVISION SUMMARY:`);
      console.log(`[INTERVENTION REVISION] - Previous version: ${currentIntervention.revisionNumber || 1}`);
      console.log(`[INTERVENTION REVISION] - New version: ${newRevisionNumber} (backend will handle)`);
      console.log(`[INTERVENTION REVISION] - Previous results preserved: ${currentIntervention.interventionResultsId ? 'Yes' : 'No'}`);
      console.log(`[INTERVENTION REVISION] - Ready for student retake: Yes`);
      console.log(`[INTERVENTION REVISION] - Mobile will detect version change: Yes`);
      console.log(`[INTERVENTION REVISION] - Questions to update: ${interventionData.questions?.length || 0}`);

      // Step 4: Perform the revision update - Send minimal data to avoid conflicts
      const cleanRevisionData = {
        // Core fields that need updating
        questions: interventionData.questions,
        totalQuestions: interventionData.totalQuestions || interventionData.questions?.length || 0,

        // Teacher info for createRevision method
        lastEditedBy: getValidTeacherId(),

        // Let backend handle revisionNumber and revisionHistory via createRevision method
        // Don't send revisionNumber or revisionHistory - causes conflicts

        // Essential metadata
        status: 'active',
        updatedAt: new Date().toISOString(),

        // Preserve other essential intervention fields if they exist
        teacherImplementation: {
          ...interventionData.teacherImplementation,
          implementedBy: getValidTeacherId(),
          implementationDate: new Date().toISOString()
        },

        // Reset completion fields for new version
        completedAt: null,
        startedAt: null,
        interventionResultsId: null
      };

      console.log('[INTERVENTION REVISION] 🔄 Sending clean revision data:', cleanRevisionData);
      const response = await api.interventions.update(interventionId, cleanRevisionData);
      console.log('[INTERVENTION REVISION] ✅ Revision response:', response.data);

      console.log(`[INTERVENTION REVISION] 🎯 INTERVENTION REVISION COMPLETE`);
      console.log(`[INTERVENTION REVISION] 📱 Mobile app will detect revisionNumber change from ${currentIntervention.revisionNumber || 1} to ${newRevisionNumber}`);
      console.log(`[INTERVENTION REVISION] 📊 Previous intervention_results remain as reference for VERSION ${currentIntervention.revisionNumber || 1} analytics`);
      console.log(`[INTERVENTION REVISION] 🔄 New intervention_results will be created when student completes VERSION ${newRevisionNumber}`);

      return response.data.data;
    } catch (error) {
      console.error('[INTERVENTION REVISION] ❌ Error creating revision:', error);
      throw error;
    }
  };

  // ===== EFFECTS =====
  
  /**
   * Initialize content type based on category
   */
  useEffect(() => {
    // Determine content type based on category
      const normCategory = normalizeCategory(category);
    if (normCategory === 'reading_comprehension') {
        setContentType('sentence');
    } else {
      setContentType('question');
    }
  }, [category]);
  
  /**
   * Load initial data when component mounts
   */
  useEffect(() => {
    console.log('🚀 [USEEFFECT] loadInitialData useEffect triggered');
    console.log('🚀 [USEEFFECT] Dependencies:', { category, readingLevel, contentType });

    if (category && readingLevel && contentType) {
      console.log('🚀 [USEEFFECT] All dependencies present, calling loadInitialData()');
      loadInitialData();
    } else {
      console.log('🚀 [USEEFFECT] Missing dependencies, not calling loadInitialData');
    }
  }, [category, readingLevel, contentType]);
  
  /**
   * Initialize question-choice pairs from existing activity
   */
  const processedActivityChoicesRef = useRef(false);
  
  const initializeFromExistingActivity = () => {
    if (!activity) return;
    
    // Set basic information
    setTitle(activity.name || '');
    setDescription(activity.description || '');
    
    // Handle different types of activities
    if (activity.sentenceTemplate) {
      // Reading Comprehension activity
        setSelectedSentenceTemplate(activity.sentenceTemplate);
    } else if (activity.questions && activity.questions.length > 0) {
      // Regular question-choice activity
      const pairs = activity.questions.map(question => {
        // Create a question-choice pair from the question
        return {
          id: Date.now() + Math.random(),
          sourceType: question.source || 'custom',
          sourceId: question.sourceQuestionId || null,
          questionType: question.questionType || '',
          questionText: question.questionText || '',
          questionImage: question.questionImage || null,
          questionValue: question.questionValue || '',
          choiceIds: question.choiceIds || [],
          correctChoiceId: question.correctChoiceId || null
        };
      });
      
      setQuestionChoicePairs(pairs);
      
      // Update the choice templates with descriptions from the activity's choices
      // This ensures the feedback text is preserved when editing
      // Only do this once to prevent infinite loops
      if (activity.questions && safe(choiceTemplates).length > 0 && !processedActivityChoicesRef.current) {
        processedActivityChoicesRef.current = true; // Mark as processed to prevent infinite loop
        
        // Create a map of choice IDs to descriptions
        const choiceDescriptions = {};
        
        activity.questions.forEach(question => {
          if (question.choices && Array.isArray(question.choices)) {
            question.choices.forEach((choice, index) => {
              // Find the corresponding choice template
              const choiceId = question.choiceIds?.[index];
              if (choiceId && choice.description) {
                choiceDescriptions[choiceId] = choice.description;
                console.log(`Found description for choice ${choiceId}: "${choice.description}"`);
              }
            });
          }
        });
        
        // Apply all descriptions at once in a single state update
        if (Object.keys(choiceDescriptions).length > 0) {
          setChoiceTemplates(prev => 
            prev.map(template => {
              const description = choiceDescriptions[template._id];
              if (description) {
                console.log(`Updating description for choice ${template._id}: "${description}"`);
                return { ...template, description };
              }
              return template;
            })
          );
        }
      }
    }
  };
 
  /**
   * Initialize template form data when opening the form
   */
  useEffect(() => {
    if (showNewTemplateForm) {
      // Normalize the category
      const normCategory = normalizeCategory(category);
      
      // Set default question type based on category
      const defaultQuestionType = normCategory === 'alphabet_knowledge' ? 'patinig' : 
                                 normCategory === 'phonological_awareness' ? 'malapantig' : 
                                 normCategory === 'word_recognition' || normCategory === 'decoding' ? 'word' : '';
      
      // Also set default applicable choice types based on the question type
      const defaultChoiceTypes = getApplicableChoiceTypes(defaultQuestionType);
      
      // For malapantig, include both malapatinigText and wordText by default
      let initialChoiceTypes = [];
      if (defaultQuestionType === 'malapantig') {
        initialChoiceTypes = ['malapatinigText', 'wordText'];
      } else if (defaultChoiceTypes.length > 0) {
        initialChoiceTypes = [defaultChoiceTypes[0]];
      }
      
      setNewTemplateData({
        templateText: '',
        questionType: defaultQuestionType,
        applicableChoiceTypes: initialChoiceTypes
      });
    }
  }, [showNewTemplateForm, category]);
 
  // ===== API FUNCTIONS =====
 
  // Helper to build API URLs that work in both dev and production
  const getApiUrl = (path) => {
    // Use environment variable or default to your actual API server
    const baseUrl = import.meta.env.VITE_API_URL || 'http://localhost:5001/';
    return `${baseUrl}${path}`;
  };
 
  /**
   * Check for existing interventions for this student/category
   * API: GET /api/interventions/check?studentId={id}&category={category}
   */
  const checkExistingInterventions = async () => {
    try {
      setCheckingExisting(true);
      
      // Use the same student ID extraction logic as prepareInterventionData
      const studentId = student?._id || student?.id || student?.studentId;
      
      if (!studentId) {
        console.error('No student ID available, skipping existing interventions check. Student object:', student);
        setExistingIntervention(null);
        return;
      }
      
      console.log('Checking existing interventions:', `/api/interventions/check?studentId=${studentId}&category=${category}`);
      
      const response = await api.interventions.checkExisting(studentId, category);
      console.log('Existing interventions response:', response.data);
      
      setExistingIntervention(response.data.exists ? response.data.intervention : null);
    } catch (error) {
      console.error('Error checking existing interventions:', error);
      setExistingIntervention(null);
    } finally {
      setCheckingExisting(false);
    }
  };
  
  /**
   * Load all initial data needed for the modal
   */
  const loadInitialData = async () => {
    console.log('📚 [LOAD INITIAL DATA] Starting loadInitialData...');
    console.log('📚 [LOAD INITIAL DATA] Current state:', { category, readingLevel, contentType });

    // Check if we have all the required data before proceeding
    if (!category || !readingLevel) {
      console.warn('Missing required data for API calls:', { category, readingLevel });
      setErrors({ general: "Missing category or reading level data." });
      return;
    }

    setLoading(true);
    try {
      if (contentType === 'sentence') {
        console.log('📚 [LOAD INITIAL DATA] contentType is sentence, loading sentence templates');
        // For Reading Comprehension, load sentence templates
        await loadSentenceTemplates();
      } else {
        console.log('📚 [LOAD INITIAL DATA] contentType is not sentence, loading question and choice templates');
        // For template-only categories, load templates and start with clean form
        await loadQuestionTemplates();
        await loadChoiceTemplates();

        // Always create initial question-choice pair for clean start
        if (safe(questionChoicePairs).length === 0 && !activity) {
          addQuestionChoicePair();
        }
      }
    } catch (error) {
      console.error("Error loading initial data:", error);
      setErrors({ general: "Failed to load required data. Please try again." });
    } finally {
      setLoading(false);
    }
  };
 
 
  /**
   * Load question templates for this category
   * API: GET /api/templates/questions?category={category}
   */
  const loadQuestionTemplates = async () => {
    try {
      // Make the API call with proper authentication
      console.log('🔄 [TEMPLATE LOADING] Starting template load for category:', category);
      console.log('🔄 [TEMPLATE LOADING] API URL will be:', `/api/templates/questions?category=${category}`);

      const response = await api.interventions.getTemplateQuestions(category);
      console.log('🔄 [TEMPLATE LOADING] Raw API response:', response);
      console.log('🔄 [TEMPLATE LOADING] Response data:', response.data);
      console.log('🔄 [TEMPLATE LOADING] Response data.data:', response.data?.data);
      console.log('🔄 [TEMPLATE LOADING] Templates array length:', response.data?.data?.length || 0);
      console.log('🔄 [TEMPLATE LOADING] API Success:', response.data?.success);
      console.log('🔄 [TEMPLATE LOADING] API Count:', response.data?.count);
      console.log('🔄 [TEMPLATE LOADING] API Message:', response.data?.message);

      // Additional debugging for empty responses
      if (!response.data?.data || response.data.data.length === 0) {
        console.warn('⚠️ [TEMPLATE LOADING] No templates returned for category:', category);
        console.warn('⚠️ [TEMPLATE LOADING] This could mean:');
        console.warn('⚠️ [TEMPLATE LOADING] 1. No templates exist for this category in database');
        console.warn('⚠️ [TEMPLATE LOADING] 2. API endpoint is not working correctly');
        console.warn('⚠️ [TEMPLATE LOADING] 3. Category name mismatch between frontend and backend');

        // Test with a direct API call to see what's in the database
        console.log('🔍 [TEMPLATE LOADING] Testing direct API call...');
        try {
          const testResponse = await fetch(`/api/templates/questions?category=${encodeURIComponent(category)}`, {
            headers: {
              'Authorization': `Bearer ${localStorage.getItem('token')}`
            }
          });
          const testData = await testResponse.json();
          console.log('🔍 [TEMPLATE LOADING] Direct fetch result:', testData);
        } catch (testError) {
          console.error('🔍 [TEMPLATE LOADING] Direct fetch failed:', testError);
        }
      }

      // Log each template for debugging
      if (response.data?.data && Array.isArray(response.data.data)) {
        response.data.data.forEach((template, index) => {
          console.log(`🔄 [TEMPLATE LOADING] Template ${index + 1}:`, {
            _id: template._id,
            templateText: template.templateText,
            questionType: template.questionType,
            category: template.category
          });
        });
      }

      // Update state with the fetched templates
      const templates = response.data.data || [];
      console.log('🔄 [TEMPLATE LOADING] Setting questionTemplates state to:', templates);
      console.log('🔄 [TEMPLATE LOADING] Templates array details:', {
        isArray: Array.isArray(templates),
        length: templates.length,
        firstTemplate: templates[0] ? {
          _id: templates[0]._id,
          category: templates[0].category,
          questionType: templates[0].questionType,
          questionText: templates[0].questionText
        } : null
      });

      setQuestionTemplates(templates);

      // Immediate verification that state was set
      console.log('🔄 [TEMPLATE LOADING] State update initiated with:', templates.length, 'templates');

      // Add a more thorough check after React state update
      setTimeout(() => {
        console.log('🔄 [TEMPLATE LOADING] questionTemplates state after React update:', questionTemplates);
        console.log('🔄 [TEMPLATE LOADING] questionTemplates.length after update:', questionTemplates.length);
        if (questionTemplates.length === 0 && templates.length > 0) {
          console.warn('⚠️ [TEMPLATE LOADING] State update failed! Templates were provided but state is empty');
          console.warn('⚠️ [TEMPLATE LOADING] This suggests a React state update issue');
          // Force re-set the state
          console.log('🔄 [TEMPLATE LOADING] Force re-setting state...');
          setQuestionTemplates([...templates]);
        }
      }, 200);

    } catch (error) {
      console.error('❌ [TEMPLATE LOADING] Error loading question templates:', error);
      setQuestionTemplates([]);
    }
  };
 
  /**
   * Load choice templates
   * API: GET /api/templates/choices
   */
  const loadChoiceTemplates = async () => {
    try {
      // Make the API call with proper authentication
      console.log('Loading choice templates:', `/api/templates/choices`);
      
      const response = await api.interventions.getTemplateChoices();
      console.log('Choice templates response:', response.data);
      
      // Update state with the fetched choices
      const choices = response.data.data || [];
      setChoiceTemplates(choices);
      
    } catch (error) {
      console.error('Error loading choice templates:', error);
      setChoiceTemplates([]);
    }
  };
 
  /**
   * Load sentence templates for reading comprehension
   * API: GET /api/templates/sentences?readingLevel={level}
   */
  const loadSentenceTemplates = async () => {
    try {
      // Get reading level dynamically from student
      const currentReadingLevel = student?.readingLevel || readingLevel;
      
      if (!currentReadingLevel) {
        console.warn('[SENTENCE TEMPLATES] No reading level available for student:', student);
        setSentenceTemplates([]);
        return;
      }
      
      console.log('Loading sentence templates:', `/api/templates/sentences?readingLevel=${currentReadingLevel}`);
      
      const response = await api.interventions.getSentenceTemplates(currentReadingLevel);
      console.log('Sentence templates response:', response.data);
      
      // Sanitize image URLs in the templates before updating state
      const sanitizedTemplates = (response.data.data || []).map(template => {
        // Create a sanitized copy of the template
        const sanitizedTemplate = { ...template };
        
        // Fix image URLs in sentence templates
        if (sanitizedTemplate.sentenceText && sanitizedTemplate.sentenceText.length > 0) {
          sanitizedTemplate.sentenceText = sanitizedTemplate.sentenceText.map(page => ({
            ...page,
            image: sanitizeImageUrl(page.image)
          }));
        }
        
        // Fix standalone imageUrl property if present
        if (sanitizedTemplate.imageUrl) {
          sanitizedTemplate.imageUrl = sanitizeImageUrl(sanitizedTemplate.imageUrl);
        }
        
        return sanitizedTemplate;
      });
      
      // Update state with the sanitized templates
      setSentenceTemplates(sanitizedTemplates);
    } catch (error) {
      console.error('Error loading sentence templates:', error);
      setSentenceTemplates([]);
    }
  };
 
  /**
   * Create a new question template
   * API: POST /api/templates/questions
   */
  const createNewQuestionTemplate = async (templateData) => {
    try {
      console.log('Creating new question template:', templateData);
      
      const response = await api.interventions.createTemplateQuestion(templateData);
      console.log('Template creation response:', response.data);
      
      // Add the new template to the state
      setQuestionTemplates(prev => [...prev, response.data.data]);
      
      return response.data.data;
    } catch (error) {
      console.error('Error creating question template:', error);
      throw error;
    }
  };
  
  /**
   * Create a new choice template
   * API: POST /api/templates/choices
   */
  const createNewChoiceTemplate = async (choiceData) => {
    try {
      console.log('Creating new choice template:', choiceData);
      
      const response = await api.interventions.createTemplateChoice(choiceData);
      console.log('Choice creation response:', response.data);
      
      // Add the new choice to the state
      setChoiceTemplates(prev => [...prev, response.data.data]);
      
      return response.data.data;
    } catch (error) {
      console.error('Error creating choice template:', error);
      throw error;
    }
  };

  /**
   * Upload an image to S3 bucket
   * @param {File} file - The file to upload
   * @param {string} targetFolder - Target folder in S3 bucket (default: 'general')
   * @returns {Promise<string>} - The URL of the uploaded file
   */
  const uploadImageToS3 = async (file, targetFolder = 'general') => {
    try {
      setUploading(true);
      console.log(`[S3 UPLOAD] 🚀 Starting DIRECT upload process for file: ${file.name} (${file.type})`);
      console.log(`[S3 UPLOAD] Target folder: ${targetFolder}`);

      // Check if file is an image (png, jpg, jpeg)
      if (!file.type.match(/^image\/(jpeg|jpg|png)$/i)) {
        console.warn(`[S3 UPLOAD] File type not supported: ${file.type}. Only PNG, JPG, JPEG are allowed.`);
        throw new Error(`File type not supported: ${file.type}. Only PNG, JPG, JPEG are allowed.`);
      }

      console.log(`[S3 UPLOAD] Using NEW DIRECT UPLOAD method with public-read ACL`);
      console.log(`[S3 UPLOAD] Original filename: ${file.name}`);

      // Use direct fetch to /api/uploads/s3 (known working endpoint)
      const formData = new FormData();
      formData.append('file', file);
      formData.append('targetFolder', targetFolder);

      const response = await fetch('/api/uploads/s3', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        throw new Error(`Upload failed with status: ${response.status}`);
      }

      const responseData = await response.json();
      console.log('[S3 UPLOAD] Direct upload response:', responseData);

      if (!responseData.success) {
        throw new Error(responseData.message || 'Upload failed');
      }

      const fileUrl = responseData.url;
      const isPublic = responseData.verified;

      console.log(`[S3 UPLOAD] ✅ Direct upload successful!`);
      console.log(`[S3 UPLOAD] File URL: ${fileUrl}`);
      console.log(`[S3 UPLOAD] Is Public: ${isPublic}`);

      // Test the URL immediately to verify it's accessible
      try {
        console.log(`[S3 UPLOAD] 🔍 Testing URL accessibility...`);
        const testResponse = await fetch(fileUrl, { method: 'HEAD' });
        if (testResponse.ok) {
          console.log(`[S3 UPLOAD] ✅ URL is accessible! Status: ${testResponse.status}`);
        } else {
          console.warn(`[S3 UPLOAD] ⚠️ URL test returned status: ${testResponse.status} (file may still be uploading)`);
        }
      } catch (testError) {
        console.warn(`[S3 UPLOAD] ⚠️ URL test failed (but upload was successful):`, testError.message);
      }

      return fileUrl;
    } catch (error) {
      console.error('[S3 UPLOAD] ❌ Direct upload process failed:', error);

      // Show error in UI
      setErrors(prev => ({
        ...prev,
        upload: `Image upload failed: ${error.message}`
      }));

      throw error;
    } finally {
      setUploading(false);
    }
  };
 
 
 
 
 
 
  // ===== INITIALIZATION FUNCTIONS =====
 
  /**
   * Initialize question-choice pairs from existing activity
   */
  // This function has been moved to line ~534 with the infinite loop fix
  
  // ===== HELPER FUNCTIONS =====

  /**
   * Get applicable choice types for a question type
   */
  const getApplicableChoiceTypes = (questionType) => {
    // Complete mapping based on the provided documentation
    const typeMap = {
      // Alphabet Knowledge
      'patinig': ['patinigBigLetter', 'patinigSmallLetter', 'patinigSound'],
      'katinig': ['katinigBigLetter', 'katinigSmallLetter', 'katinigSound'],
      
      // Phonological Awareness
      'malapantig': ['malapatinigText', 'wordText'], // Restricted to only syllable text and word text
      
      // Word Recognition & Decoding
      'word': ['wordText'],
      
      // Reading Comprehension
      'sentence': [] // No choice types allowed - system generated only
    };
    
    return typeMap[questionType] || [];
  };

  /**
   * Format choice type for display
   */
  const formatChoiceType = (choiceType) => {
    const typeMap = {
      'patinigBigLetter': 'Uppercase Vowel Letter',
      'patinigSmallLetter': 'Lowercase Vowel Letter',
      'patinigSound': 'Vowel Sound',
      'katinigBigLetter': 'Uppercase Consonant Letter',
      'katinigSmallLetter': 'Lowercase Consonant Letter',
      'katinigSound': 'Consonant Sound',
      'malapatinigText': 'Syllable Text',
      'wordText': 'Word Text',
      'sentenceText': 'Sentence Text'
    };
    
    return typeMap[choiceType] || choiceType;
  };

  /**
   * Get choices by IDs from available choices
   */
  const getChoicesByIds = (choiceIds) => {
    if (!choiceIds || !safe(choiceIds).length || !choiceTemplates) return [];
    return choiceTemplates.filter(choice => choice && choiceIds.includes(choice._id));
  };

  /**
   * Remove duplicate letters from choice letters array
   */
  const removeDuplicateLetters = (letters) => {
    const seen = new Set();
    const uniqueLetters = [];
    
    letters.forEach((letter) => {
      if (letter && letter.trim() !== '') {
        const normalizedLetter = letter.toLowerCase();
        if (!seen.has(normalizedLetter)) {
          seen.add(normalizedLetter);
          uniqueLetters.push(letter);
        }
      } else if (letter === '') {
        // Keep empty strings for new input fields
        uniqueLetters.push(letter);
      }
    });
    
    return uniqueLetters;
  };

  /**
   * Validate and sanitize letter input for distractors
   * Only allows uppercase and lowercase letters (A-Z, a-z)
   * Filters out numbers, symbols, and special characters
   */
  const validateLetterInput = (input) => {
    if (!input || typeof input !== 'string') return '';
    
    // Only allow uppercase and lowercase letters A-Z, a-z
    // Remove any numbers, symbols, or special characters
    const lettersOnly = input.replace(/[^A-Za-z]/g, '');
    
    // Return only the first character if multiple characters were entered
    return lettersOnly.charAt(0);
  };

  /**
   * Generate drag elements for Type A (Complete Word) questions
   * Includes correct letters plus exactly 2 distractors in randomized order
   */
  const generateDragElements = (word) => {
    if (!word || typeof word !== 'string') return [];

    // Preserve proper capitalization: first letter uppercase, rest lowercase
    const correctLetters = word.split('').map((letter, index) => 
      index === 0 ? letter.toUpperCase() : letter.toLowerCase()
    );
    const uniqueCorrectLetters = [...new Set(correctLetters)]; // Remove duplicates

    // Complete distractor pool with all consonants and vowels
    // Use mixed case for distractors to match the correct letters style
    const vowels = ['A', 'e', 'I', 'o', 'U', 'a', 'E', 'i', 'O', 'u'];
    const consonants = ['B', 'C', 'D', 'F', 'G', 'H', 'J', 'K', 'L', 'M', 'N', 'P', 'Q', 'R', 'S', 'T', 'V', 'W', 'X', 'Y', 'Z',
                       'b', 'c', 'd', 'f', 'g', 'h', 'j', 'k', 'l', 'm', 'n', 'p', 'q', 'r', 's', 't', 'v', 'w', 'x', 'y', 'z'];
    const commonDistractors = [...vowels, ...consonants];

    // Select distractors that are not in the correct word (case-insensitive comparison)
    const availableDistractors = commonDistractors.filter(letter =>
      !uniqueCorrectLetters.some(correctLetter => 
        correctLetter.toLowerCase() === letter.toLowerCase()
      )
    );

    // Add exactly 2 distractors to make it challenging but not overwhelming
    const numDistractors = Math.min(2, availableDistractors.length);
    const selectedDistractors = availableDistractors
      .sort(() => Math.random() - 0.5) // Shuffle
      .slice(0, numDistractors);

    // Combine correct letters with distractors
    const allElements = [...correctLetters, ...selectedDistractors];

    // Shuffle the final array to randomize order
    return allElements.sort(() => Math.random() - 0.5);
  };

  /**
   * Generate choice letters for Type B (Fill Missing Letter) questions
   * Includes correct letter plus exactly 2 distractors
   */
  const generateChoiceLetters = (correctLetter) => {
    if (!correctLetter || typeof correctLetter !== 'string') return [];

    const correct = correctLetter; // Keep original case

    // Define common confusion pairs and similar-looking letters (case-sensitive)
    const confusionPairs = {
      'B': ['P', 'D', 'R'], 'b': ['p', 'd', 'r'],
      'P': ['B', 'R', 'F'], 'p': ['b', 'r', 'f'],
      'D': ['B', 'G', 'O'], 'd': ['b', 'g', 'o'],
      'G': ['D', 'O', 'C'], 'g': ['d', 'o', 'c'],
      'M': ['N', 'W', 'H'], 'm': ['n', 'w', 'h'],
      'N': ['M', 'H', 'R'], 'n': ['m', 'h', 'r'],
      'T': ['F', 'I', 'L'], 't': ['f', 'i', 'l'],
      'F': ['T', 'E', 'P'], 'f': ['t', 'e', 'p'],
      'C': ['O', 'G', 'S'], 'c': ['o', 'g', 's'],
      'O': ['C', 'G', 'D'], 'o': ['c', 'g', 'd'],
      'A': ['O', 'E', 'U'], 'a': ['o', 'e', 'u'],
      'E': ['A', 'F', 'I'], 'e': ['a', 'f', 'i'],
      'I': ['T', 'L', 'J'], 'i': ['t', 'l', 'j'],
      'U': ['A', 'O', 'V'], 'u': ['a', 'o', 'v'],
      'L': ['I', 'T', 'J'], 'l': ['i', 't', 'j'],
      'R': ['P', 'B', 'N'], 'r': ['p', 'b', 'n'],
      'S': ['C', 'G', 'Z'], 's': ['c', 'g', 'z'],
      'H': ['N', 'M', 'R'], 'h': ['n', 'm', 'r'],
      'K': ['R', 'H', 'N'], 'k': ['r', 'h', 'n'],
      'V': ['U', 'Y', 'W'], 'v': ['u', 'y', 'w'],
      'W': ['M', 'V', 'Y'], 'w': ['m', 'v', 'y'],
      'X': ['K', 'Z', 'Y'], 'x': ['k', 'z', 'y'],
      'Y': ['V', 'T', 'X'], 'y': ['v', 't', 'x'],
      'Z': ['S', 'X', 'N'], 'z': ['s', 'x', 'n'],
      'J': ['I', 'L', 'G'], 'j': ['i', 'l', 'g'],
      'Q': ['O', 'G', 'C'], 'q': ['o', 'g', 'c']
    };

    // Get distractors for this letter (case-sensitive)
    const possibleDistractors = confusionPairs[correct] || (correct === correct.toUpperCase() ? ['A', 'E', 'I'] : ['a', 'e', 'i']);

    // Select exactly 2 distractors
    const selectedDistractors = possibleDistractors.slice(0, 2);

    // Combine correct letter with distractors
    const allChoices = [correct, ...selectedDistractors];

    // Shuffle to randomize order
    return allChoices.sort(() => Math.random() - 0.5);
  };

  /**
   * Validate and sanitize word input for decoding questions
   * - Remove numbers and symbols
   * - Auto-capitalize first letter
   * - Keep only valid letters
   */
  const validateAndSanitizeWordInput = (input) => {
    if (!input || typeof input !== 'string') return { cleanValue: '', error: null };

    // Remove numbers, symbols, and special characters - keep only letters and spaces
    let cleanValue = input.replace(/[^a-zA-Z\s]/g, '');

    // Remove extra spaces and trim
    cleanValue = cleanValue.replace(/\s+/g, ' ').trim();

    // Auto-capitalize first letter of each word
    cleanValue = cleanValue
      .split(' ')
      .map(word => {
        if (word.length === 0) return word;
        return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase();
      })
      .join(' ');

    // Keep first letter capitalized format for proper word display

    // Validate minimum requirements
    let error = null;
    if (cleanValue.length === 0 && input.length > 0) {
      error = 'Please enter only letters - no numbers or symbols allowed';
    } else if (cleanValue.length < 2 && cleanValue.length > 0) {
      error = 'Word must be at least 2 letters long';
    } else if (cleanValue.length > 12) {
      error = 'Word cannot be longer than 12 letters';
    }

    return { cleanValue, error };
  };

  /**
   * Get error state for input validation
   */
  const getInputValidationError = (pairId, fieldName) => {
    return errors[`${pairId}_${fieldName}`] || null;
  };

  /**
   * Set input validation error
   */
  const setInputValidationError = (pairId, fieldName, error) => {
    const errorKey = `${pairId}_${fieldName}`;
    setErrors(prev => {
      if (error) {
        return { ...prev, [errorKey]: error };
      } else {
        const newErrors = { ...prev };
        delete newErrors[errorKey];
        return newErrors;
      }
    });
  };

  /**
   * Get applicable question types for category
   */
  const getApplicableQuestionTypes = (category) => {
    // Normalize the category
    const normCategory = normalizeCategory(category);
    
    // Complete mapping based on the provided documentation
    const typeMap = {
      // Valid question types per category
      'alphabet_knowledge': ['patinig', 'katinig'],
      'phonological_awareness': ['patinig', 'katinig'],
      'word_recognition': ['word'],
      'decoding': ['word'],
      'reading_comprehension': ['sentence']
    };
    
    return typeMap[normCategory] || [];
  };

  /**
   * Format question type for display
   */
  const formatQuestionType = (questionType) => {
    const typeMap = {
      'patinig': 'Patinig (Vowel)',
      'katinig': 'Katinig (Consonant)',
      'malapantig': 'Malapantig (Syllable)',
      'word': 'Word Recognition',
      'sentence': 'Reading Passage'
    };
    
    return typeMap[questionType] || questionType;
  };

  /**
   * Check if inline creation is allowed for this category
   */
  const isInlineCreationAllowed = () => {
    // Normalize the category
    const normCategory = normalizeCategory(category);
    
    // Reading Comprehension does not allow inline creation of templates or choices
    if (normCategory === 'reading_comprehension' || contentType === 'sentence') {
      return false;
    }
    
    // All other categories allow inline creation
    return true;
  };

  /**
   * Handle image upload click
   */
  const handleImageUploadClick = (targetType, targetId) => {
    setCurrentUploadTarget({ type: targetType, id: targetId });
    fileInputRef.current.click();
  };

  /**
   * Handle file upload for question image
   * This function will immediately upload the image to S3 instead of waiting for save
   */
  const handleFileChange = async (e, pairId) => {
    const file = e.target.files[0];
    if (!file) return;
    
    try {
      // Clear question value when setting an image
      updateQuestionChoicePair(pairId, 'questionValue', '');
      
      // Check file size and type
      if (file.size > 5 * 1024 * 1024) { // 5MB limit
        throw new Error("File size exceeds 5MB limit. Please choose a smaller file.");
      }
      
      if (!file.type.match(/^image\/(jpeg|jpg|png)$/i)) {
        throw new Error("Only JPG and PNG images are supported.");
      }
      
      console.log(`[FILE] Processing file upload for pair ${pairId}: ${file.name} (${file.type}, ${Math.round(file.size/1024)}KB)`);
      
      // Create a local preview immediately using URL.createObjectURL
      const localUrl = URL.createObjectURL(file);
      console.log(`[FILE] Created local preview URL: ${localUrl}`);
      
      // Update the UI immediately with the local preview
      updateQuestionChoicePair(pairId, 'questionImage', localUrl);
      
      // Set status to uploading
      setFileUploads(prev => ({
        ...prev,
        [pairId]: { 
          status: 'uploading', 
          file: file.name, 
          fileType: file.type,
          fileSize: file.size,
          localUrl 
        }
      }));
      
      // IMMEDIATE UPLOAD: Upload the file to S3 right away instead of waiting for save
      console.log(`[FILE] Starting immediate S3 upload for file: ${file.name}`);
      
      // Upload to S3 in the general folder
      const imageUrl = await uploadImageToS3(file, 'general');
      
      if (imageUrl) {
        console.log(`[FILE] ✅ Immediate upload successful! Image URL: ${imageUrl}`);
        
        // Update the pair with the S3 URL, replacing the blob URL
        updateQuestionChoicePair(pairId, 'questionImage', imageUrl);
        
        // Update upload status to success with the S3 URL
        setFileUploads(prev => ({
          ...prev,
          [pairId]: { 
            status: 'success', 
            file: file.name, 
            fileType: file.type,
            fileSize: file.size,
            localUrl, // Keep the local URL for preview
            s3Url: imageUrl
          }
        }));
        
        console.log(`[FILE] ✅ Question pair ${pairId} updated with S3 URL: ${imageUrl}`);
      } else {
        throw new Error("Failed to upload image to S3");
      }
    } catch (error) {
      console.error("[FILE] Error handling file:", error);
      setFileUploads(prev => ({
        ...prev,
        [pairId]: { status: 'error', file: file.name, error: error.message }
      }));
      
      // Show error message
      setErrors(prev => ({
        ...prev,
        upload: `Failed to handle image: ${error.message}`
      }));
    } finally {
      // Reset the file input
      e.target.value = null;
    }
  };
  
  /**
   * Handle file upload for new choice creation
   */
  const handleChoiceFileChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    
    try {
      setFileUploads(prev => ({
        ...prev,
        new_choice: { status: 'uploading', file: file.name }
      }));
      
      // Upload to S3
      const imageUrl = await uploadImageToS3(file);
      
      if (imageUrl) {
        // Update the choice data with the image URL
        setNewChoiceData(prev => ({
          ...prev,
          choiceImage: imageUrl
        }));
        
        // Update upload status
        setFileUploads(prev => ({
          ...prev,
          new_choice: { status: 'success', file: file.name }
        }));
      } else {
        throw new Error("Failed to get image URL");
      }
    } catch (error) {
      console.error("Error uploading choice image:", error);
      setFileUploads(prev => ({
        ...prev,
        new_choice: { status: 'error', file: file.name }
      }));
      
      // Show error message
      setErrors(prev => ({
        ...prev,
        upload: `Failed to upload image: ${error.message}`
      }));
    }
    
    // Reset the file input
    e.target.value = null;
  };

  /**
   * Handle question image upload for Alphabet Knowledge
   */
  const handleQuestionImageUpload = async (e, pairId) => {
    const file = e.target.files[0];
    if (!file) return;

    try {
      // Validate file
      if (file.size > 5 * 1024 * 1024) { // 5MB limit
        throw new Error("File size exceeds 5MB limit. Please choose a smaller file.");
      }

      if (!file.type.match(/^image\/(jpeg|jpg|png)$/i)) {
        throw new Error("Only JPG and PNG images are supported.");
      }

      console.log(`[ALPHABET KNOWLEDGE] Processing file upload for pair ${pairId}: ${file.name}`);

      // Set uploading state
      setUploading(true);

      // Clear any previous errors
      setErrors(prev => ({ ...prev, upload: '' }));

      // Upload to S3
      const imageUrl = await uploadImageToS3(file);

      if (imageUrl) {
        // Update the question with the image URL
        updateQuestionChoicePair(pairId, { questionImage: imageUrl });

        console.log(`[ALPHABET KNOWLEDGE] Successfully uploaded image for pair ${pairId}: ${imageUrl}`);
      } else {
        throw new Error("Failed to get image URL from S3");
      }
    } catch (error) {
      console.error("[ALPHABET KNOWLEDGE] Error uploading image:", error);

      // Show error message
      setErrors(prev => ({
        ...prev,
        upload: `Failed to upload image: ${error.message}`
      }));
    } finally {
      setUploading(false);
    }

    // Reset the file input
    e.target.value = null;
  };

  /**
   * Handle file selection for image upload
   */
  const handleFileSelect = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    
    try {
      if (currentUploadTarget && (currentUploadTarget.type === 'question' || currentUploadTarget.type === 'questionImage')) {
        // Create a local preview
        const localUrl = URL.createObjectURL(file);
        
        // Update question image with local preview
        setQuestionChoicePairs(prev => 
          prev.map(pair => 
            pair.id === currentUploadTarget.id ? { ...pair, questionImage: localUrl } : pair
          )
        );
        
        // Store the file for later upload
        setPendingUploads(prev => ({
          ...prev,
          [currentUploadTarget.id]: file
        }));
        
        setFileUploads(prev => ({
          ...prev,
          [currentUploadTarget.id]: { status: 'pending', file: file.name, localUrl }
        }));
      }
    } catch (error) {
      console.error("Error handling file upload:", error);
      setErrors(prev => ({
        ...prev,
        upload: `Failed to handle image: ${error.message}`
      }));
    }
    
    // Reset the file input
    e.target.value = null;
  };
 
  /** find choice object whose text matches a Question Value */
  const findChoiceByText = (text) =>
    choiceTemplates.find(
      c => (c.choiceValue || '').toLowerCase() === text.toLowerCase() || 
           (c.soundText || '').toLowerCase() === text.toLowerCase()
    );
 
  // ===== EVENT HANDLERS =====
 
  /**
   * Handle form submission
   */
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (currentStep < 3) {
      nextStep();
      return;
    }
    
    try {
      // Wait for the save operation to complete
      await saveActivity();
    } catch (error) {
      console.error("Error in handleSubmit:", error);
      // Error already handled in saveActivity
    }
  };

  /**
   * Auto-save custom questions as templates for future reuse
   * This function converts custom questions into reusable templates
   * UPDATED: Added validation to prevent duplicate template creation
   */
  const saveCustomQuestionsAsTemplates = async () => {
    try {
      console.log('[TEMPLATE AUTO-SAVE] Starting auto-save of custom questions as templates');

      // Process all supported categories for template saving
      const normCategory = normalizeCategory(category);
      const supportedCategories = ['alphabet_knowledge', 'phonological_awareness', 'decoding', 'word_recognition', 'reading_comprehension'];

      if (!supportedCategories.includes(normCategory)) {
        console.log(`[TEMPLATE AUTO-SAVE] Skipping - category "${category}" not supported for auto-save yet`);
        return;
      }

      // Special handling for Reading Comprehension custom content
      if (normCategory === 'reading_comprehension' && contentType === 'sentence') {
        console.log('[RC TEMPLATE AUTO-SAVE] Reading Comprehension templates already saved earlier - skipping duplicate save');
        return; // Reading Comprehension templates already saved in saveActivity before intervention creation
      }

      // Filter for truly custom questions (not from pre-made templates)
      const customQuestions = questionChoicePairs.filter(pair => {
        // Exclude if it has a sourceTemplateId (came from a pre-made template)
        if (pair.sourceTemplateId) {
          console.log(`[TEMPLATE AUTO-SAVE] Skipping question "${pair.questionText}" - has sourceTemplateId: ${pair.sourceTemplateId}`);
          return false;
        }

        // Exclude if sourceType is 'template_question' (came from pre-made template)
        if (pair.sourceType === 'template_question') {
          console.log(`[TEMPLATE AUTO-SAVE] Skipping question "${pair.questionText}" - sourceType is template_question`);
          return false;
        }

        // Include only truly custom questions
        const isCustom = pair.sourceType === 'custom' || !pair.sourceType;
        if (isCustom) {
          console.log(`[TEMPLATE AUTO-SAVE] Including custom question: "${pair.questionText}"`);
        }
        return isCustom;
      });

      if (customQuestions.length === 0) {
        console.log('[TEMPLATE AUTO-SAVE] No custom questions to save as templates');
        return;
      }

      console.log(`[TEMPLATE AUTO-SAVE] Found ${customQuestions.length} truly custom questions to convert to templates`);

      // Check for existing templates to prevent duplicates
      let existingTemplates = [];
      try {
        const templatesResponse = await api.interventions.getTemplateQuestions();
        if (templatesResponse.success) {
          existingTemplates = templatesResponse.data || [];
          console.log(`[TEMPLATE AUTO-SAVE] Found ${existingTemplates.length} existing templates for duplicate checking`);
        }
      } catch (error) {
        console.warn('[TEMPLATE AUTO-SAVE] Could not fetch existing templates for duplicate checking:', error);
      }

      // Save each custom question as a template with duplicate validation
      for (const pair of customQuestions) {
        let templateData = null; // Declare at loop level for proper scope

        try {
          // Check for duplicate templates based on content, not just question text
          let isDuplicate = false;
          
          if (normCategory === 'decoding') {
            // For Decoding, check by actual word content AND choices/distractors
            isDuplicate = existingTemplates.some(template => {
              if (template.category !== category || template.questionType !== pair.questionType) return false;
              
              // Check by correctSequence (the actual word being decoded)
              if (pair.correctSequence && template.correctSequence) {
                const pairWord = Array.isArray(pair.correctSequence) ? pair.correctSequence.join('') : pair.correctSequence;
                const templateWord = Array.isArray(template.correctSequence) ? template.correctSequence.join('') : template.correctSequence;
                
                if (pairWord !== templateWord) return false;
                
                // Same word, now check the choices/distractors
                if (pair.questionType === 'complete_word_identification') {
                  // For Type A, compare dragElements (letter choices)
                  if (pair.dragElements && template.dragElements) {
                    const pairChoices = [...pair.dragElements].sort();
                    const templateChoices = [...template.dragElements].sort();
                    return JSON.stringify(pairChoices) === JSON.stringify(templateChoices);
                  }
                } else if (pair.questionType === 'fill_missing_letter') {
                  // For Type B, compare both displaySequence and dragElements
                  const displayMatch = JSON.stringify(pair.displaySequence) === JSON.stringify(template.displaySequence);
                  if (!displayMatch) return false;
                  
                  if (pair.dragElements && template.dragElements) {
                    const pairChoices = [...pair.dragElements].sort();
                    const templateChoices = [...template.dragElements].sort();
                    return JSON.stringify(pairChoices) === JSON.stringify(templateChoices);
                  }
                }
              }
              
              return false;
            });
          } else if (normCategory === 'word_recognition') {
            // For Word Recognition, check by displayWord and questionSubType to prevent true duplicates
            isDuplicate = existingTemplates.some(template => {
              if (template.category !== category) return false;

              // Check if same displayWord and questionSubType combination exists
              const sameDisplayWord = template.displayWord && pair.displayWord &&
                template.displayWord.toLowerCase().trim() === pair.displayWord.toLowerCase().trim();
              const sameQuestionSubType = template.questionSubType === pair.questionSubType;

              if (sameDisplayWord && sameQuestionSubType) {
                console.log(`[TEMPLATE AUTO-SAVE] Found duplicate Word Recognition template: "${template.displayWord}" (${template.questionSubType})`);
                return true;
              }

              return false;
            });
          } else {
            // For other categories, use questionText + category as before
            isDuplicate = existingTemplates.some(template =>
              template.questionText === pair.questionText &&
              template.category === category
            );
          }

          if (isDuplicate) {
            console.log(`[TEMPLATE AUTO-SAVE] ⚠️ Skipping duplicate template: "${pair.questionText}" already exists`);
            continue;
          }

          // Handle different category structures
          if (normCategory === 'phonological_awareness') {
            // Phonological Awareness template structure (CLAUDE.md compliant)
            const audioTexts = pair.audioTexts || [''];
            const validAudioTexts = audioTexts.filter(text => text && text.trim());
            const matchingOptions = [];
            const correctPairs = [];

            // Generate matching options and correct pairs from audioTexts
            validAudioTexts.forEach(audioText => {
              let matchingText;
              if (audioText.length === 1) {
                // Single letter: create uppercase + lowercase format (L → Ll)
                matchingText = audioText.toUpperCase() + audioText.toLowerCase();
              } else {
                // Multi-character: use as-is
                matchingText = audioText;
              }
              matchingOptions.push(matchingText);

              // Use the same format as main_assessment: {"H": "Hh"}
              const pairObj = {};
              pairObj[audioText] = matchingText;
              correctPairs.push(pairObj);
            });

            templateData = {
              category: category,
              questionType: pair.questionType || 'malapantig',
              questionText: pair.questionText,
              templateText: pair.questionText, // Add templateText for backend compatibility
              questionSet: {
                audioTexts: validAudioTexts,
                matchingOptions: matchingOptions,
                correctPairs: correctPairs
              },
              matchCount: validAudioTexts.length,
              targetSkills: ["sound_discrimination", "custom_teacher_created"],
              difficultyLevel: "medium",
              isActive: true
            };

            console.log(`[TEMPLATE AUTO-SAVE] Phonological Awareness template data:`, {
              category: templateData.category,
              questionType: templateData.questionType,
              questionText: templateData.questionText,
              audioTexts: templateData.questionSet.audioTexts,
              matchingOptions: templateData.questionSet.matchingOptions,
              correctPairs: templateData.questionSet.correctPairs,
              matchCount: templateData.matchCount
            });
          } else if (normCategory === 'alphabet_knowledge') {
            // Alphabet Knowledge template structure
            templateData = {
              category: category,
              questionType: pair.questionType || 'patinig',
              questionText: pair.questionText,
              questionImage: pair.questionImage,
              choiceOptions: (pair.choices || []).map((choice, index) => ({
                optionId: (index + 1).toString(),
                optionText: choice.optionText,
                isCorrect: choice.isCorrect
              })),
              targetSkills: ["custom_teacher_created"],
              difficultyLevel: "medium",
              isActive: true
            };
          } else if (normCategory === 'decoding') {
            // Decoding template structure (matching main_assessment structure)
            console.log(`[TEMPLATE AUTO-SAVE] Creating Decoding template for question type: ${pair.questionType}`);
            console.log(`[TEMPLATE AUTO-SAVE] Decoding question data:`, {
              questionType: pair.questionType,
              dragElements: pair.dragElements,
              correctSequence: pair.correctSequence,
              displaySequence: pair.displaySequence,
              blankPosition: pair.blankPosition
            });

            // Determine question type based on structure or explicit questionType
            let questionType = pair.questionType || 'complete_word_identification';

            // Auto-detect question type if not explicitly set
            if (!pair.questionType) {
              if (pair.displaySequence && pair.blankPosition !== undefined) {
                questionType = 'fill_missing_letter';
              } else {
                questionType = 'complete_word_identification';
              }
            }

            templateData = {
              category: category,
              questionType: questionType,
              questionText: pair.questionText,
              questionImage: pair.questionImage,
              targetSkills: ["decoding", "custom_teacher_created"],
              difficultyLevel: "medium",
              isActive: true
            };

            // Add type-specific fields based on question type
            if (questionType === 'complete_word_identification') {
              // Type A: "Tukuyin ang nasa larawan?" - Complete word identification
              templateData.dragElements = pair.dragElements || [];
              templateData.correctSequence = pair.correctSequence || [];
              templateData.displaySequence = null;
              templateData.blankPosition = null;

              console.log(`[TEMPLATE AUTO-SAVE] Type A template data:`, {
                dragElements: templateData.dragElements,
                correctSequence: templateData.correctSequence
              });
            } else if (questionType === 'fill_missing_letter') {
              // Type B: "Buoin ang salita" - Fill in missing letter
              templateData.dragElements = pair.dragElements || [];
              templateData.correctSequence = pair.correctSequence || [];
              templateData.displaySequence = pair.displaySequence || [];
              templateData.blankPosition = pair.blankPosition !== undefined ? pair.blankPosition : 0;

              console.log(`[TEMPLATE AUTO-SAVE] Type B template data:`, {
                dragElements: templateData.dragElements,
                correctSequence: templateData.correctSequence,
                displaySequence: templateData.displaySequence,
                blankPosition: templateData.blankPosition
              });
            }
          } else if (normCategory === 'word_recognition') {
            // Word Recognition template structure (new displayWord/blankOptions structure)
            const validBlankOptions = (pair.blankOptions || []).filter(option => option && option.trim() !== '');
            const validCorrectAnswers = (pair.correctAnswer || []).filter(answer => answer && answer.trim() !== '');

            // For templates, reconstruct the complete sentence without blanks
            let templateDisplayWord = pair.displayWord || '';
            if (pair.questionSubType === 'sentence_completion' && pair.blankPosition !== null && pair.sentenceTokens) {
              // Reconstruct complete sentence from tokens for template storage
              templateDisplayWord = pair.sentenceTokens.join(' ');
            }

            templateData = {
              category: category,
              questionType: 'fill_blank', // Use correct questionType for templates
              questionText: pair.questionText || 'Basahin ang pangungusap. Piliin ang tamang salita mula sa hanay.',
              questionImage: pair.questionImage,

              // Word Recognition specific fields - templates store complete sentences
              displayWord: templateDisplayWord, // Complete sentence without blanks
              blankOptions: validBlankOptions.length > 0 ? validBlankOptions : ['', '', '', ''],
              correctAnswer: validCorrectAnswers.length > 0 ? validCorrectAnswers : [],

              // Template metadata - NO blankPosition or sentenceTokens in templates
              questionSubType: pair.questionSubType || 'sentence_completion',
              targetSkills: [
                "word_recognition",
                pair.questionSubType === 'sound_matching' ? "sound_matching" : "sentence_completion",
                "custom_teacher_created"
              ],
              difficultyLevel: "medium",
              isActive: true,
              createdBy: getValidTeacherId(),
              createdAt: new Date().toISOString()
            };

            console.log(`[TEMPLATE AUTO-SAVE] Word Recognition template data:`, {
              displayWord: templateData.displayWord, // Complete sentence without blanks
              blankOptions: templateData.blankOptions,
              correctAnswer: templateData.correctAnswer,
              questionSubType: templateData.questionSubType,
              questionType: templateData.questionType
            });
          } else {
            // Fallback for unsupported categories
            console.warn(`[TEMPLATE AUTO-SAVE] Unsupported category for template creation: ${normCategory}`);
            continue;
          }

          console.log(`[TEMPLATE AUTO-SAVE] Saving NEW custom question as template: "${pair.questionText}"`);
          console.log(`[TEMPLATE AUTO-SAVE] Template data being sent:`, JSON.stringify(templateData, null, 2));

          const response = await api.interventions.createTemplateQuestion(templateData);
          console.log(`[TEMPLATE AUTO-SAVE] API response:`, response);

          if (response.success) {
            console.log(`[TEMPLATE AUTO-SAVE] ✅ Successfully saved template: ${response.data._id}`);
            // Add to existing templates list to prevent duplicates within this save session
            existingTemplates.push(response.data);
          } else {
            console.error(`[TEMPLATE AUTO-SAVE] ❌ Failed to save template:`, {
              message: response.message,
              error: response.error,
              templateData: templateData
            });
          }

        } catch (templateError) {
          console.error(`[TEMPLATE AUTO-SAVE] Error saving individual template:`, {
            error: templateError,
            templateData: templateData,
            questionText: pair.questionText,
            category: category
          });
          // Continue with other questions even if one fails
        }
      }

      console.log('[TEMPLATE AUTO-SAVE] ✅ Auto-save process completed with duplicate validation');

    } catch (error) {
      console.error('[TEMPLATE AUTO-SAVE] Error in auto-save process:', error);
      // Don't throw error to prevent interrupting the main save process
    }
  };

  /**
   * Save Reading Comprehension custom content as sentence template
   * This function handles the creation of sentence templates from custom Reading Comprehension content
   */
  const saveReadingComprehensionCustomContentAsTemplate = async () => {
    try {
      console.log('[RC TEMPLATE SAVE] Starting Reading Comprehension custom content save as template');

      // Validate custom content exists - save all activities as templates
      if (!customReadingComprehensionActivities.length) {
        console.log('[RC TEMPLATE SAVE] No custom content to save');
        return;
      }

      // Filter activities that have complete content
      const completeActivities = customReadingComprehensionActivities.filter(activity =>
        activity.storyTitle && activity.storyTitle.trim() &&
        activity.storyPages && activity.storyPages.length > 0 &&
        activity.questions && activity.questions.length > 0
      );

      if (!completeActivities.length) {
        console.log('[RC TEMPLATE SAVE] No complete activities to save');
        return;
      }

      // Check for existing templates to prevent duplicates
      let existingTemplates = [];
      try {
        const templatesResponse = await api.interventions.getSentenceTemplates();
        if (templatesResponse.success) {
          existingTemplates = templatesResponse.data || [];
          console.log(`[RC TEMPLATE SAVE] Found ${existingTemplates.length} existing sentence templates for duplicate checking`);
        }
      } catch (error) {
        console.warn('[RC TEMPLATE SAVE] Could not fetch existing sentence templates for duplicate checking:', error);
      }

      // Get the current reading level
      const currentReadingLevel = student?.readingLevel || readingLevel;
      
      if (!currentReadingLevel) {
        console.warn('[RC TEMPLATE SAVE] No reading level available for student, skipping template save');
        toast.warn('Cannot save templates: Student reading level not available');
        return;
      }

      // Validate reading level against backend enum
      const validReadingLevels = ['Low Emerging', 'High Emerging', 'Developing', 'Transitioning', 'At Grade Level'];
      if (!validReadingLevels.includes(currentReadingLevel)) {
        console.warn('[RC TEMPLATE SAVE] Invalid reading level:', currentReadingLevel, 'Valid levels:', validReadingLevels);
        toast.warn(`Cannot save templates: Invalid reading level "${currentReadingLevel}". Valid levels are: ${validReadingLevels.join(', ')}`);
        return;
      }

      // Process each complete activity
      for (const [index, activity] of completeActivities.entries()) {
        // Check for duplicate templates based on story title and reading level
        const isDuplicate = existingTemplates.some(template =>
          template.title && template.title.toLowerCase().trim() === activity.storyTitle.toLowerCase().trim() &&
          template.readingLevel === currentReadingLevel
        );

        if (isDuplicate) {
          console.log(`[RC TEMPLATE SAVE] ⚠️ Skipping duplicate template: "${activity.storyTitle}" already exists for reading level "${currentReadingLevel}"`);
          toast.warn(`A Reading Comprehension template with title "${activity.storyTitle}" already exists for reading level "${currentReadingLevel}".`);
          continue;
        }

        // Prepare sentence template data for this activity
        const templateData = {
          title: activity.storyTitle,
          category: "Reading Comprehension",
          readingLevel: currentReadingLevel,
          sentenceText: (activity.storyPages || []).map((page, pageIndex) => ({
            pageNumber: pageIndex + 1,
            text: page.text || page.pageText,
            image: page.image || page.pageImage || null
          })),
          sentenceQuestions: (activity.questions || []).map((question, qIndex) => ({
            questionNumber: qIndex + 1,
            questionText: question.questionText || question.sentenceQuestionText,
            sentenceCorrectAnswer: question.sentenceCorrectAnswer || question.correctAnswer,
            acceptableAnswers: question.sentenceAcceptableAnswer || question.acceptableAnswers || []
          })),
          isActive: true,
          createdBy: getValidTeacherId(), // Use current teacher ID
          createdAt: new Date()
        };

        // Debug: Log the actual activity structure
        console.log(`[RC TEMPLATE SAVE] 🔍 Activity structure for activity ${index + 1}:`, {
          id: activity.id,
          storyTitle: activity.storyTitle,
          pagesCount: activity.storyPages?.length || 0,
          questionsLength: activity.questions?.length || 0,
          questionsStructure: activity.questions?.map((q, qIdx) => ({
            index: qIdx,
            keys: Object.keys(q || {}),
            questionText: q?.questionText,
            correctAnswer: q?.correctAnswer,
            sentenceCorrectAnswer: q?.sentenceCorrectAnswer,
            acceptableAnswers: q?.acceptableAnswers,
            sentenceAcceptableAnswer: q?.sentenceAcceptableAnswer
          })) || []
        });

        console.log(`[RC TEMPLATE SAVE] Prepared sentence template data for activity ${index + 1}:`, {
          title: templateData.title,
          readingLevel: templateData.readingLevel,
          pagesCount: templateData.sentenceText.length,
          questionsCount: templateData.sentenceQuestions.length,
          sourceQuestionsLength: activity.questions?.length || 0
        });

        // Save template using API
        console.log(`[RC TEMPLATE SAVE] 🔄 Attempting to save template with data:`, templateData);
        console.log(`[RC TEMPLATE SAVE] 🔍 Template data structure:`, {
          hasTitle: !!templateData.title,
          hasCategory: !!templateData.category,
          hasReadingLevel: !!templateData.readingLevel,
          hasSentenceText: !!templateData.sentenceText,
          hasSentenceQuestions: !!templateData.sentenceQuestions,
          hasCreatedBy: !!templateData.createdBy,
          titleLength: templateData.title?.length,
          sentenceTextCount: templateData.sentenceText?.length,
          sentenceQuestionsCount: templateData.sentenceQuestions?.length
        });

        // Validate schema compliance before sending
        const validation = {
          titleValid: templateData.title && templateData.title.trim().length > 0,
          readingLevelValid: ['Low Emerging', 'High Emerging', 'Developing', 'Transitioning', 'At Grade Level'].includes(templateData.readingLevel),
          sentenceTextValid: Array.isArray(templateData.sentenceText) && templateData.sentenceText.length > 0,
          sentenceQuestionsValid: Array.isArray(templateData.sentenceQuestions) && templateData.sentenceQuestions.length > 0,
          createdByValid: templateData.createdBy && typeof templateData.createdBy === 'string'
        };

        console.log(`[RC TEMPLATE SAVE] 🔍 Template validation:`, validation);

        // Check if all validations pass
        const allValid = Object.values(validation).every(v => v === true);
        if (!allValid) {
          console.error(`[RC TEMPLATE SAVE] ❌ Template validation failed:`, validation);
          toast.error('Template data validation failed. Please check all required fields.');
          return;
        }

        // Data validation complete - proceeding with actual template save

        try {
        const templateResponse = await api.interventions.createSentenceTemplate(templateData);
          console.log(`[RC TEMPLATE SAVE] 📡 API Response:`, templateResponse);

          if (templateResponse.data && templateResponse.data.success) {
          console.log(`[RC TEMPLATE SAVE] ✅ Successfully saved Reading Comprehension template: "${templateData.title}"`);
          toast.success(`Reading Comprehension template "${templateData.title}" saved successfully!`);
        } else {
            console.error('[RC TEMPLATE SAVE] ❌ Failed to save sentence template:', templateResponse.data?.error || templateResponse.error);
            console.error('[RC TEMPLATE SAVE] ❌ Full response:', templateResponse);
            toast.error(`Failed to save Reading Comprehension template: ${templateResponse.data?.error || templateResponse.error || 'Unknown error'}`);
          }
        } catch (apiError) {
          console.error('[RC TEMPLATE SAVE] ❌ API Error:', apiError);
          console.error('[RC TEMPLATE SAVE] ❌ Error details:', {
            message: apiError.message,
            status: apiError.response?.status,
            statusText: apiError.response?.statusText,
            data: apiError.response?.data
          });
          
          if (apiError.response?.status === 500) {
            toast.error('Server error: The template saving service is currently unavailable. Please try again later.');
          } else if (apiError.response?.status === 404) {
            toast.error('Template saving endpoint not found. Please contact support.');
          } else {
            toast.error(`Failed to save Reading Comprehension template: ${apiError.message || 'Network error'}`);
          }
        }
      }

    } catch (error) {
      console.error('[RC TEMPLATE SAVE] ❌ Error saving Reading Comprehension custom content as template:', error);
      toast.error('Failed to save Reading Comprehension template. Please try again.');
      // Don't throw error to prevent interrupting the main save process
    }
  };

  /**
   * Save the activity (create or update)
   */
  const saveActivity = async () => {
    try {
      if (!validateAllSteps()) {
        console.log('[SAVE] Validation failed, current errors:', errors);

        // Show toast notifications for validation errors
        const errorMessages = [];

        if (errors.title) errorMessages.push("Title is required");
        if (errors.description) errorMessages.push("Description is required");
        if (errors.sentenceTemplate) errorMessages.push("Please select a reading passage template or create custom content");
        // Note: errors.pairs, errors.questionValue, and errors.questionText are now handled by toast notifications in validation functions
        if (errors.questionValue) errorMessages.push("Question Value is required for all questions");
        if (errors.questionText) errorMessages.push("Question Text is required for all questions");

        console.log('[SAVE] Showing error messages:', errorMessages);

        // Show specific validation errors
        errorMessages.forEach(message => {
          console.log('[TOAST] Showing error:', message);
          toast.error(message);
        });

        // Show general validation error if no specific errors
        if (errorMessages.length === 0) {
          console.log('[TOAST] Showing general validation error');
          toast.error("Please fill in all required fields before saving");
        }

        // Go to first step with errors
        if (errors.title || errors.description) {
          setCurrentStep(1);
        } else if (errors.sentenceTemplate) {
          setCurrentStep(2);
        } else if (errors.pairs || errors.questionValue) {
          setCurrentStep(3);
        }
        return;
      }
      
      // Check if we have a valid student object with ID
      if (!student) {
        console.error("Missing student object when saving activity");
        setErrors({ general: "Cannot save intervention: Student information is missing" });
        return;
      }
      
      // Log student object for debugging
      console.log("Student object when saving:", student);
      
      setSubmitting(true);
      
      // Check for existing interventions (only if creating new)
      if (!activity?._id && existingIntervention) {
        setErrors({ general: "An intervention for this student and category already exists." });
        setSubmitting(false);
        return;
      }
      
      // Save Reading Comprehension custom content as templates first (if applicable)
      // Only save CUSTOM content as templates - NOT when using existing templates
      if (contentType === 'sentence') {
        // Check if we have actual custom activities (not just template selections)
        const hasCustomActivities = customReadingComprehensionActivities.some(activity =>
          activity.storyTitle && activity.storyTitle.trim() &&
          activity.storyPages && activity.storyPages.length > 0 &&
          activity.questions && activity.questions.length > 0 &&
          !activity.selectedTemplate // No template selected = custom content
        );

        if (hasCustomActivities) {
          console.log('[SAVE] ✅ Found custom activities - saving as templates');
          await saveReadingComprehensionCustomContentAsTemplate();
        } else {
          console.log('[SAVE] ✅ No custom activities found - using existing templates only');
        }
      }
      
      // Prepare data for saving
      const interventionData = await prepareInterventionData();
      
      // Save intervention using the API
      let savedIntervention;

      try {
        if (activity?._id) {
          // EDITING EXISTING INTERVENTION - Create revision (VERSION 2, 3, etc.)
          console.log('[SAVE] ✅ Editing existing intervention - creating revision');
          console.log('[SAVE] Current intervention ID:', activity._id);
          console.log('[SAVE] Current revision number:', activity.revisionNumber || 1);

          // Create revision with proper versioning
          savedIntervention = await createInterventionRevision(activity._id, interventionData);
        } else {
          // CREATING NEW INTERVENTION - VERSION 1
          console.log('[SAVE] ✅ Creating new intervention - VERSION 1');
          savedIntervention = await createIntervention(interventionData);
        }

        // Auto-save custom questions as templates for future reuse
        await saveCustomQuestionsAsTemplates();

        // Call the onSave callback with the saved intervention - with null check
        console.log("Intervention saved successfully, calling onSave callback");
        if (typeof onSave === 'function') {
          onSave(savedIntervention);
        }
        
        // Reset state
        setSubmitting(false);
        setCurrentStep(1);
        
        // Close the modal after successful save - with null check
        console.log("Closing modal after successful save");
        if (typeof onClose === 'function') {
          // Using setTimeout to ensure the state updates have completed
          setTimeout(() => {
            onClose();
          }, 0);
        }
      } catch (error) {
        console.error("Error saving intervention:", error);
        setErrors({ 
          general: `Failed to save intervention: ${error.message || 'Unknown error'}. Please try again.` 
        });
        setSubmitting(false);
      }
    } catch (error) {
      console.error("Error in saveActivity preparation:", error);
      setErrors({ 
        general: `Failed to prepare activity data: ${error.message || 'Unknown error'}. Please try again.` 
      });
      setSubmitting(false);
    }
  };
 
  /**
   * Prepare intervention data for saving
   */
  const prepareInterventionData = async () => {
    let interventionData;
    
    // Ensure we have a valid student ID - try multiple properties and provide a fallback
    let studentId = null;
    
    if (student) {
      // Try to get the ID from different potential properties
      // Prioritize idNumber since that's what prescriptive analysis uses
      if (student.idNumber) {
        studentId = parseInt(student.idNumber); // Convert to number to match database format
        console.log("[SAVE] Using student.idNumber:", studentId);
      } else if (student.studentId) {
        studentId = student.studentId;
        console.log("[SAVE] Using student.studentId:", studentId);
      } else if (student._id) {
        studentId = student._id;
        console.log("[SAVE] Using student._id as fallback:", studentId);
      } else if (student.id) {
        studentId = student.id;
        console.log("[SAVE] Using student.id as fallback:", studentId);
      } else {
        // Last resort - try to find any property that might be an ID
        const possibleIdProps = Object.keys(student).filter(
          key => key.toLowerCase().includes('id') || key === '_id'
        );
        
        if (possibleIdProps.length > 0) {
          studentId = student[possibleIdProps[0]];
          console.log(`[SAVE] Using student.${possibleIdProps[0]} as fallback:`, studentId);
        }
      }
    }
    
    if (!studentId) {
      console.error("[SAVE] Missing student ID. Student object:", student);
      throw new Error("Student ID is required to create an intervention");
    }
    
    // Keep studentId as number to match database format
    console.log("[SAVE] Final studentId:", studentId, "Type:", typeof studentId);


    // Get prescriptive analysis ID - ONLY from real database data
    let prescriptiveAnalysisId = null;
    let realAnalysisData = null;

    // First try to get it from the passed analysis prop (real data)
    if (analysis && analysis._id) {
      console.log("[SAVE] ✅ Checking real prescriptive analysis from prop:", analysis);
      console.log("[SAVE] Analysis ID structure:", analysis._id, "Type:", typeof analysis._id);

      if (analysis._id && typeof analysis._id === 'object' && analysis._id.$oid) {
        // MongoDB format with $oid field
        prescriptiveAnalysisId = analysis._id.$oid;
        realAnalysisData = analysis;
        console.log("[SAVE] ✅ Using REAL analysis prop prescriptive ID (from $oid):", prescriptiveAnalysisId);
        console.log("[SAVE] ✅ KNOWN PRESCRIPTIVE ANALYSIS ID:", prescriptiveAnalysisId, "should match 68c9fc70d26632a89f218ef0");
      } else if (analysis._id && typeof analysis._id === 'string' && /^[0-9a-fA-F]{24}$/.test(analysis._id)) {
        // MongoDB format with valid ObjectId string
        prescriptiveAnalysisId = analysis._id;
        realAnalysisData = analysis;
        console.log("[SAVE] ✅ Using REAL analysis prop prescriptive ID (from string):", prescriptiveAnalysisId);
        console.log("[SAVE] ✅ KNOWN PRESCRIPTIVE ANALYSIS ID:", prescriptiveAnalysisId, "should match 68c9fc70d26632a89f218ef0");
      } else {
        console.error("[SAVE] ❌ Invalid analysis ID format:", analysis._id);
        console.error("[SAVE] ❌ Expected 68c9fc70d26632a89f218ef0 but got:", analysis._id);
      }
    } else {
      console.warn("[SAVE] ⚠️ No analysis prop provided, will try to fetch from API");
      console.log("[SAVE] ❌ analysis:", analysis);
    }

    // Try mongoDbAnalysis only if it has real data structure
    if (!prescriptiveAnalysisId && mongoDbAnalysis && mongoDbAnalysis._id) {
      console.log("[SAVE] Checking mongoDbAnalysis for real data:", mongoDbAnalysis);

      if (mongoDbAnalysis._id && typeof mongoDbAnalysis._id === 'object' && mongoDbAnalysis._id.$oid) {
        // MongoDB format with $oid field
        prescriptiveAnalysisId = mongoDbAnalysis._id.$oid;
        realAnalysisData = mongoDbAnalysis;
        console.log("[SAVE] ✅ Using REAL mongoDb prescriptive ID (from $oid):", prescriptiveAnalysisId);
      } else if (mongoDbAnalysis._id && typeof mongoDbAnalysis._id === 'string' && /^[0-9a-fA-F]{24}$/.test(mongoDbAnalysis._id)) {
        // MongoDB format with valid ObjectId string
        prescriptiveAnalysisId = mongoDbAnalysis._id;
        realAnalysisData = mongoDbAnalysis;
        console.log("[SAVE] ✅ Using REAL mongoDb prescriptive ID (from string):", prescriptiveAnalysisId);
      } else {
        console.error("[SAVE] ❌ Invalid mongoDbAnalysis ID format:", mongoDbAnalysis._id);
      }
    }

    // TRY API FALLBACK - fetch prescriptive analysis if not provided
    if (!prescriptiveAnalysisId) {
      console.warn("[SAVE] ⚠️ No prescriptive analysis in props, trying API fallback for student:", studentId, "category:", category);

      try {
        console.log("[SAVE] 🔍 Fetching prescriptive analysis for student:", studentId);

        // Try to get all prescriptive analyses for this student
        const response = await api.interventions.getStudentPrescriptiveAnalyses(studentId);
        console.log("[SAVE] API response for prescriptive analysis:", response);

        if (response.data && response.data.success && response.data.data && Array.isArray(response.data.data) && response.data.data.length > 0) {
          console.log("[SAVE] 📊 Found prescriptive analyses:", response.data.data.length);

          // Look for the analysis that contains data for our category
          let foundAnalysis = null;
          for (const analysis of response.data.data) {
            console.log("[SAVE] 🔍 Checking analysis:", analysis._id, "for category:", category);

            // Check if this analysis has data for the category we need
            if (analysis.skillMastery && analysis.skillMastery[category]) {
              foundAnalysis = analysis;
              console.log("[SAVE] ✅ Found analysis with category data:", analysis._id);
              break;
            }

            // Also check in error patterns or intervention plan
            if (analysis.errorPatterns && analysis.errorPatterns[category]) {
              foundAnalysis = analysis;
              console.log("[SAVE] ✅ Found analysis with error patterns for category:", analysis._id);
              break;
            }

            if (analysis.interventionPlan && analysis.interventionPlan.specificFocus && analysis.interventionPlan.specificFocus[category]) {
              foundAnalysis = analysis;
              console.log("[SAVE] ✅ Found analysis with intervention plan for category:", analysis._id);
              break;
            }
          }

          if (foundAnalysis) {
            prescriptiveAnalysisId = foundAnalysis._id.$oid || foundAnalysis._id;
            realAnalysisData = foundAnalysis;
            console.log("[SAVE] ✅ Using prescriptive analysis ID:", prescriptiveAnalysisId);
            console.log("[SAVE] ✅ Real analysis data from API:", {
              id: prescriptiveAnalysisId,
              hasErrorPatterns: !!foundAnalysis.errorPatterns,
              hasSkillMastery: !!foundAnalysis.skillMastery,
              hasInterventionPlan: !!foundAnalysis.interventionPlan,
              hasResearchBasedPrescriptions: !!foundAnalysis.researchBasedPrescriptions,
              categoryData: foundAnalysis.skillMastery?.[category] ? "found" : "not found"
            });
          } else {
            console.warn("[SAVE] ⚠️ No prescriptive analysis found with data for category:", category);
          }
        } else {
          console.warn("[SAVE] ⚠️ API response format unexpected:", response.data);
        }
      } catch (error) {
        console.error("[SAVE] ❌ Failed to fetch prescriptive analysis via API:", error);
        console.error("[SAVE] ❌ Error details:", error.response?.data || error.message);
      }
    }

    if (!prescriptiveAnalysisId) {
      console.error("[SAVE] ❌ NO REAL PRESCRIPTIVE ANALYSIS FOUND for student:", studentId, "category:", category);
      console.error("[SAVE] ❌ analysis prop:", analysis);
      console.error("[SAVE] ❌ mongoDbAnalysis:", mongoDbAnalysis);
      console.error("[SAVE] ❌ Cannot create intervention without real prescriptive analysis!");

      toast("Cannot create intervention: No prescriptive analysis found for this student and category. Please ensure the student has completed the main assessment.", 'error', 6000);
      return;
    } else {
      console.log("[SAVE] ✅ FINAL PRESCRIPTIVE ANALYSIS ID:", prescriptiveAnalysisId);
      console.log("[SAVE] ✅ Using real prescriptive analysis data for intervention creation");
    }
    
    // Ensure prescriptiveAnalysisId is a valid MongoDB ObjectId (24 hex chars) or null
    if (prescriptiveAnalysisId && !/^[0-9a-fA-F]{24}$/.test(prescriptiveAnalysisId)) {
      console.warn("[SAVE] Invalid prescriptiveAnalysisId format, setting to null:", prescriptiveAnalysisId);
      prescriptiveAnalysisId = null;
    }
    
    // Generate a UUID-like string that doesn't rely on timestamps
    const generateUniqueId = () => {
      return 'q_' + Math.random().toString(36).substring(2, 15) + 
             Math.random().toString(36).substring(2, 15);
    };
    
    // Function to format current date consistently without timezone issues
    const getFormattedDate = () => {
      const now = new Date();
      return now.toISOString();
    };

    // Helper function to sanitize image URLs (handle blob URLs and ensure correct S3 paths)
    const sanitizeImageUrl = (url) => {
      if (!url) return null;
      
      // Get the correct URL from the fileUploads state if it's a blob URL
      if (url.startsWith('blob:')) {
        console.warn('[SAVE] Found blob URL in data that should have been replaced:', url);
        
        // First check if we have this blob URL in our fileUploads state with a successful S3 upload
        let pairWithBlobUrl = null;
        let uploadedUrl = null;
        
        // Find which pair has this blob URL
        for (const pair of questionChoicePairs) {
          if (pair.questionImage === url) {
            pairWithBlobUrl = pair;
            break;
          }
        }
        
        if (pairWithBlobUrl) {
          console.log(`[SAVE] Found pair ${pairWithBlobUrl.id} with blob URL: ${url}`);
          
          // Check if we have a successful upload status for this pair
          const uploadStatus = fileUploads[pairWithBlobUrl.id];
          if (uploadStatus && uploadStatus.status === 'success' && uploadStatus.s3Url) {
            console.log(`[SAVE] ✅ Found successful upload status with S3 URL: ${uploadStatus.s3Url}`);
            return uploadStatus.s3Url;
          }
          
          // If no success status found, look through other pairs for a matching S3 URL
          for (const otherPair of questionChoicePairs) {
            if (otherPair.id === pairWithBlobUrl.id && otherPair.questionImage && !otherPair.questionImage.startsWith('blob:')) {
              uploadedUrl = otherPair.questionImage;
              console.log(`[SAVE] Found uploaded S3 URL to replace blob: ${uploadedUrl}`);
              break;
            }
          }
          
          // If we found an uploaded URL, use it
          if (uploadedUrl) {
            return uploadedUrl;
          }
        }
        
        // If we can't find a corresponding uploaded URL, return null
        console.warn('[SAVE] No uploaded URL found for blob, returning null');
        return null;
      }
      
      // Make sure URLs point to the correct S3 bucket
      if (url) {
        // Check if URL is from our S3 bucket
        const s3BucketUrl = 'https://literexia-bucket.s3.ap-southeast-2.amazonaws.com/';
        
        if (url.startsWith(s3BucketUrl)) {
          // If the URL is in S3 but not in the mobile folder, fix it
          if (!url.includes('/mobile/') && !url.startsWith(s3BucketUrl + 'mobile/')) {
            const fileName = url.substring(url.lastIndexOf('/') + 1);
            const correctedUrl = `${s3BucketUrl}mobile/${fileName}`;
            console.log(`[SAVE] Correcting S3 URL to use mobile folder: ${url} -> ${correctedUrl}`);
            return correctedUrl;
          }
        }
      }
      
      // If URL is already correct or from a different source, return as is
      return url;
    };
    
    // First, make sure all blob URLs are properly processed and replaced with actual S3 URLs
    // Find any questionChoicePairs that still have blob URLs and log them
    const pairsWithBlobUrls = questionChoicePairs.filter(
      pair => pair.questionImage && pair.questionImage.startsWith('blob:')
    );
    
    if (pairsWithBlobUrls.length > 0) {
      console.warn(`[SAVE] Warning: Found ${pairsWithBlobUrls.length} pairs with blob URLs that weren't properly uploaded`);
      pairsWithBlobUrls.forEach(pair => {
        console.warn(`[SAVE] Pair ${pair.id} still has blob URL: ${pair.questionImage}`);
      });
    }
    
    // Track which pairs have images for logging
    const pairsWithImages = questionChoicePairs.filter(
      pair => pair.questionImage && !pair.questionImage.startsWith('blob:')
    );
    
    console.log(`[SAVE] Found ${pairsWithImages.length} pairs with valid images:`);
    pairsWithImages.forEach(pair => {
      console.log(`[SAVE] Pair ${pair.id} has valid image URL: ${pair.questionImage}`);
    });
    
    if (contentType === 'sentence') {
      // Check if any activities have templates or custom content
      const hasValidActivities = customReadingComprehensionActivities.length > 0 &&
        customReadingComprehensionActivities.some(activity => {
          const hasTemplate = activity.selectedTemplate && activity.selectedTemplate._id;
          const hasCustomContent = activity.storyTitle && activity.storyTitle.trim() &&
          activity.storyPages && activity.storyPages.length > 0 &&
            activity.questions && activity.questions.length > 0;
          return hasTemplate || hasCustomContent;
        });

      if (!hasValidActivities) {
        throw new Error("Each activity must have either a template selected or custom content created");
      }

      // Prepare content source - now each activity can have its own template or custom content
      const completeActivities = customReadingComprehensionActivities.filter(activity => {
        const hasTemplate = activity.selectedTemplate && activity.selectedTemplate._id;
        const hasCustomContent = activity.storyTitle && activity.storyTitle.trim() &&
          activity.storyPages && activity.storyPages.length > 0 &&
          activity.questions && activity.questions.length > 0;
        return hasTemplate || hasCustomContent;
      });

      const contentSource = {
        type: 'mixed', // Can have both templates and custom content
          sourceId: null,
          totalActivities: completeActivities.length
        };
      
      // For Reading Comprehension: 1 RC questionId per activity
      const questionCount = completeActivities.length;

        // Store all activities for question creation
      const allActivities = completeActivities;

      // For Reading Comprehension, use the sentence template/custom content according to CLAUDE.md
      interventionData = {
        // Only include _id if editing an existing activity
        ...(activity?._id ? { _id: activity._id } : {}),

        // Core fields (required by CLAUDE.md schema)
        studentId: studentId,
        prescriptiveAnalysisId,
        category,
        readingLevel,
        passThreshold: 75,

        // Doctor's Prescription (from prescriptive analytics)
        doctorPrescription: mongoDbAnalysis ? {
          deficitAnalysis: {
            specificDeficits: mongoDbAnalysis.researchBasedPrescriptions?.[category]?.deficitAnalysis?.specificDeficits?.map(d => d.deficit) || [],
            severity: mongoDbAnalysis.researchBasedPrescriptions?.[category]?.deficitAnalysis?.specificDeficits?.[0]?.severity || "moderate",
            errorRate: mongoDbAnalysis.researchBasedPrescriptions?.[category]?.deficitAnalysis?.specificDeficits?.[0]?.errorRate || "0%",
            confusionPairs: []
          },
          interventionPrescription: {
            primaryApproach: mongoDbAnalysis.researchBasedPrescriptions?.[category]?.interventionPrescription?.primaryApproach || "multisensory_structured",
            recommendedQuestionCount: questionCount,
            intensityLevel: (() => {
              const rawIntensity = mongoDbAnalysis.researchBasedPrescriptions?.[category]?.interventionPrescription?.intensityLevel;
              // Normalize old enum values to new valid values
              if (rawIntensity === "standard") return "moderate";
              if (rawIntensity === "intensive") return "high";
              if (["low", "moderate", "high", "highly_intensive"].includes(rawIntensity)) return rawIntensity;
              return "highly_intensive"; // Default
            })(),
            sessionStructure: mongoDbAnalysis.researchBasedPrescriptions?.[category]?.interventionPrescription?.sessionStructure || {
              optimalLength: "20-30 minutes",
              breakPattern: "Every 10 minutes"
            },
            specificTechniques: mongoDbAnalysis.researchBasedPrescriptions?.[category]?.interventionPrescription?.specificTechniques || []
          },
          materialRecommendations: mongoDbAnalysis.researchBasedPrescriptions?.[category]?.interventionPrescription?.materialRecommendations || []
        } : {
          deficitAnalysis: {
            specificDeficits: ["Reading Comprehension skill development needed"],
            severity: "moderate",
            errorRate: "N/A",
            confusionPairs: []
          },
          interventionPrescription: {
            primaryApproach: "multisensory_structured",
            recommendedQuestionCount: questionCount,
            intensityLevel: "highly_intensive",
            sessionStructure: {
              optimalLength: "20-30 minutes",
              breakPattern: "Every 10 minutes"
            },
            specificTechniques: [
              {
                technique: "Systematic reading comprehension instruction",
                description: "Structured approach to teaching reading comprehension skills",
                duration: "20-30 minutes daily",
                materials: "Reading passages, comprehension questions",
                progressCriteria: "80% accuracy on comprehension questions",
                researchBasis: "Evidence-based reading comprehension strategies"
              },
              {
                technique: "Immediate corrective feedback",
                description: "Prompt feedback on reading comprehension responses",
                duration: "During instruction time",
                materials: "Answer keys, rubrics",
                progressCriteria: "Reduced error rate over time",
                researchBasis: "Feedback theory and comprehension research"
              }
            ]
          },
          materialRecommendations: [usingTemplate ? "Teacher-selected sentence templates" : "Teacher-created custom content"]
        },

        // Teacher Implementation
        teacherImplementation: {
          implementedBy: getValidTeacherId(),
          implementationDate: getFormattedDate(),
          prescriptionFollowed: true,
          questionDistribution: {
            total: questionCount,
            focusAreas: `Reading Comprehension - ${questionCount} ${questionCount === 1 ? 'question' : 'questions'}`
          }
        },

        // Content source tracking
        contentSource,

        // Total questions count
        totalQuestions: questionCount,

        // Questions array - Reading Comprehension structure matching CLAUDE.md specification
        // Each question represents one RC questionId with embedded sentence questions
        questions: (allActivities || []).map((activity, activityIndex) => {
          // Check if this activity uses a template or custom content
          if (activity.selectedTemplate && activity.selectedTemplate._id) {
            // ✅ Template-based activity - populate with template content
            return {
              questionId: `int_rc_${String(activityIndex + 1).padStart(3, '0')}`,
              source: 'sentence_template',
              sourceQuestionId: activity.selectedTemplate._id, // Template reference
              questionType: 'text_input',
              questionText: activity.selectedTemplate.title, // Template title for identification

              // ✅ CRITICAL: Populate template content into intervention assessment
              // Template passages from sentenceText
              passages: (activity.selectedTemplate.sentenceText || []).map((page, pageIndex) => ({
                pageNumber: pageIndex + 1,
                text: page.text,
                image: page.image || null
              })),

              // ✅ CRITICAL: Combine BOTH template questions AND manually added questions
              sentenceQuestions: [
                // First, add all template questions
                ...(activity.selectedTemplate.sentenceQuestions || []).map((q, questionIndex) => ({
                  questionNumber: questionIndex + 1,
                  questionText: q.questionText,
                  sentenceCorrectAnswer: q.sentenceCorrectAnswer,
                  sentenceAcceptableAnswer: q.acceptableAnswers || []
                })),
                // Then, add all manually added questions (continuing the numbering)
                ...(activity.questions || []).map((q, questionIndex) => ({
                  questionNumber: (activity.selectedTemplate.sentenceQuestions || []).length + questionIndex + 1,
                  questionText: q.questionText,
                  sentenceCorrectAnswer: q.correctAnswer,
                  sentenceAcceptableAnswer: q.acceptableAnswers || []
                }))
              ],

              // ✅ Add missing properties to match intervention assessment schema
              questionImage: null,
              questionValue: null,
              displaySequence: [],
              dragElements: [],
              correctSequence: [],
              blankOptions: [],
              correctAnswer: [],
              difficulty: 0,
              discrimination: 1,
              choiceOptions: [],

              // Prescription alignment
              prescriptionAlignment: {
                targetSkill: "reading_comprehension",
                technique: "Systematic reading comprehension instruction",
                difficultyLevel: "standard",
                multisensoryElements: ["visual", "cognitive", "linguistic"]
              },

              createdBy: getValidTeacherId(),
              createdAt: getFormattedDate()
            };
          } else {
            // Custom content activity
            return {
              questionId: `int_rc_${String(activityIndex + 1).padStart(3, '0')}`,
              source: 'custom',
              sourceQuestionId: null,
              questionType: 'text_input',
              questionText: activity.storyTitle,

              // Reading Comprehension structure per CLAUDE.md
              storyTitle: activity.storyTitle,
              passages: activity.storyPages.map((page, pageIndex) => ({
                pageNumber: pageIndex + 1,
                text: page.text,
                image: page.image || null
              })),
              sentenceQuestions: activity.questions.map((q, questionIndex) => ({
                questionNumber: questionIndex + 1,
                questionText: q.questionText,
                sentenceCorrectAnswer: q.correctAnswer,
                sentenceAcceptableAnswer: q.acceptableAnswers || []
              })),

            // Prescription alignment
            prescriptionAlignment: {
              targetSkill: "reading_comprehension",
              technique: "Systematic reading comprehension instruction",
              difficultyLevel: "standard",
              multisensoryElements: ["visual", "cognitive", "linguistic"]
            },

            createdBy: getValidTeacherId(),
            createdAt: getFormattedDate()
            };
          }
        }),

        // Versioning System
        revisionNumber: activity?.revisionNumber || 1,
        revisionHistory: activity?.revisionHistory || [{
          version: 1,
          editedBy: getValidTeacherId(),
          editedAt: getFormattedDate(),
          changes: "Initial implementation of doctor's prescription",
          prescriptionCompliance: "full"
        }],
        lastEditedBy: getValidTeacherId(),
        lastEditedAt: getFormattedDate(),

        // Intervention Parameters
        interventionParameters: {
          fixedQuestions: contentSource.type === 'template' ? 
            (selectedSentenceTemplate?.sentenceQuestions?.length || 1) : 
            questionCount,
          allowSkip: false,
          showProgress: true,
          immediateFeedback: false
        },

        // Question Count Calculation
        questionCountCalculation: {
          finalCount: questionCount,
          rationale: contentSource.type === 'template' ?
            `Teacher selected ${questionCount} reading comprehension passages from template` :
            `Teacher created ${questionCount} custom comprehension questions`,
          factors: {
            base: mongoDbAnalysis?.interventionPlan?.specificFocus?.[category]?.questionDistribution?.total || 3,
            errorSeverity: {
              level: mongoDbAnalysis?.researchBasedPrescriptions?.[category]?.deficitAnalysis?.specificDeficits?.[0]?.severity || "moderate",
              adjustment: 0,
              percentage: parseFloat(mongoDbAnalysis?.researchBasedPrescriptions?.[category]?.deficitAnalysis?.specificDeficits?.[0]?.errorRate) || 0
            },
            masteryLevel: {
              score: mongoDbAnalysis?.skillMastery?.[category]?.score || 0,
              adjustment: 0
            },
            categoryComplexity: {
              multiplier: 1.2,
              adjustment: 0
            },
            interventionHistory: {
              attemptCount: 1,
              adjustment: 0
            }
          },
          calculatedAt: getFormattedDate()
        },

        // Status tracking
        status: 'active',
        createdBy: getValidTeacherId(),
        createdAt: activity?.createdAt || getFormattedDate(),
        updatedAt: getFormattedDate(),

        // Completion tracking
        startedAt: null,
        completedAt: null,
        interventionResultsId: null
      };
    } else {
      // For other categories, use question-choice pairs according to CLAUDE.md schema
      interventionData = {
        // Only include _id if editing an existing activity
        ...(activity?._id ? { _id: activity._id } : {}),

        // Core fields (required by CLAUDE.md schema)
        studentId: studentId,
        prescriptiveAnalysisId,
        category,
        readingLevel,
        passThreshold: 75,

        // Doctor's Prescription (ONLY from real prescriptive analytics data)
        doctorPrescription: realAnalysisData ? {
          deficitAnalysis: {
            specificDeficits: realAnalysisData.researchBasedPrescriptions?.[category]?.deficitAnalysis?.specificDeficits?.map(d => d.deficit || d) ||
                             realAnalysisData.errorPatterns?.[category]?.detailedErrorAnalysis?.map(err => err.errorPattern) ||
                             (realAnalysisData.errorPatterns?.[category] ? [
                               ...(realAnalysisData.errorPatterns[category].patinig_errors ? [
                                 `Vowel recognition difficulties (${realAnalysisData.errorPatterns[category].patinig_errors.percentage}% error rate)`,
                                 `Specific vowel confusions: ${realAnalysisData.errorPatterns[category].patinig_errors.specific_letters?.join(', ')}`
                               ] : []),
                               ...(realAnalysisData.errorPatterns[category].katinig_errors ? [
                                 `Consonant recognition difficulties (${realAnalysisData.errorPatterns[category].katinig_errors.percentage}% error rate)`,
                                 `Specific consonant confusions: ${realAnalysisData.errorPatterns[category].katinig_errors.specific_letters?.join(', ')}`
                               ] : []),
                               `${category} difficulties identified`
                             ] : [`${category} skill deficits`]),
            severity: realAnalysisData.researchBasedPrescriptions?.[category]?.deficitAnalysis?.specificDeficits?.[0]?.severity ||
                     realAnalysisData.errorPatterns?.[category]?.severity ||
                     (realAnalysisData.skillMastery?.[category]?.score < 40 ? "severe" :
                      realAnalysisData.skillMastery?.[category]?.score < 60 ? "moderate" : "mild"),
            errorRate: realAnalysisData.researchBasedPrescriptions?.[category]?.deficitAnalysis?.specificDeficits?.[0]?.errorRate ||
                      (realAnalysisData.errorPatterns?.[category]?.patinig_errors?.percentage ? `${realAnalysisData.errorPatterns[category].patinig_errors.percentage}%` :
                       realAnalysisData.errorPatterns?.[category]?.errorRate ? `${realAnalysisData.errorPatterns[category].errorRate}%` :
                       `${Math.round(100 - (realAnalysisData.skillMastery?.[category]?.score || 0))}%`),
            confusionPairs: realAnalysisData.researchBasedPrescriptions?.[category]?.deficitAnalysis?.confusionPairs ||
                           realAnalysisData.errorPatterns?.[category]?.confusion_pairs ||
                           realAnalysisData.errorPatterns?.[category]?.confusionPairs ||
                           // Build confusion pairs from error patterns data
                           (() => {
                             const pairs = [];
                             const errorPattern = realAnalysisData.errorPatterns?.[category];
                             if (errorPattern?.patinig_errors?.specific_letters) {
                               // Create vowel confusion pairs
                               const vowels = errorPattern.patinig_errors.specific_letters;
                               for (let i = 0; i < vowels.length - 1; i += 2) {
                                 pairs.push({
                                   sounds: [vowels[i], vowels[i + 1] || vowels[0]],
                                   confusionRate: errorPattern.patinig_errors.percentage || 75
                                 });
                               }
                             }
                             if (errorPattern?.katinig_errors?.specific_letters) {
                               // Create consonant confusion pairs
                               const consonants = errorPattern.katinig_errors.specific_letters;
                               for (let i = 0; i < consonants.length - 1; i += 2) {
                                 pairs.push({
                                   sounds: [consonants[i], consonants[i + 1] || consonants[0]],
                                   confusionRate: errorPattern.katinig_errors.percentage || 50
                                 });
                               }
                             }
                             return pairs;
                           })()
          },
          interventionPrescription: {
            primaryApproach: realAnalysisData.researchBasedPrescriptions?.[category]?.interventionPrescription?.primaryApproach ||
                           realAnalysisData.interventionPlan?.specificFocus?.[category]?.primaryApproach ||
                           "multisensory_structured",
            recommendedQuestionCount: realAnalysisData.researchBasedPrescriptions?.[category]?.interventionPrescription?.recommendedQuestionCount ||
                                    realAnalysisData.interventionPlan?.specificFocus?.[category]?.questionDistribution?.total ||
                                    questionChoicePairs.length,
            intensityLevel: (() => {
              const rawIntensity = realAnalysisData.researchBasedPrescriptions?.[category]?.interventionPrescription?.intensityLevel ||
                                 realAnalysisData.interventionPlan?.intensity;

              // Normalize old enum values to new valid values
              if (rawIntensity === "standard") return "moderate";
              if (rawIntensity === "intensive") return "high";
              if (["low", "moderate", "high", "highly_intensive"].includes(rawIntensity)) return rawIntensity;

              // Fallback based on skill mastery score if no valid intensity found
              const score = realAnalysisData.skillMastery?.[category]?.score || 0;
              return score < 40 ? "highly_intensive" : score < 60 ? "high" : "moderate";
            })(),
            sessionStructure: realAnalysisData.researchBasedPrescriptions?.[category]?.interventionPrescription?.sessionStructure || {
              optimalLength: realAnalysisData.interventionPlan?.specificFocus?.[category]?.sessionLength || "15-20 minutes",
              breakPattern: "Every 10 minutes"
            },
            specificTechniques: realAnalysisData.researchBasedPrescriptions?.[category]?.interventionPrescription?.specificTechniques?.map(t => {
                              if (typeof t === 'object' && t.technique) {
                                return {
                                  technique: t.technique,
                                  description: t.description || '',
                                  duration: t.duration || '10-15 minutes daily',
                                  materials: t.materials || 'Visual-auditory materials',
                                  progressCriteria: t.progressCriteria || '80% accuracy',
                                  researchBasis: t.researchBasis || 'Evidence-based practice'
                                };
                              }
                              // Convert string to proper technique object
                              return typeof t === 'string' ? {
                                technique: t,
                                description: `${t} approach`,
                                duration: '10-15 minutes daily',
                                materials: 'Visual-auditory materials',
                                progressCriteria: '80% accuracy',
                                researchBasis: 'Evidence-based practice'
                              } : t;
                            }) ||
                              realAnalysisData.interventionPlan?.specificFocus?.[category]?.recommendedActivities ||
                              realAnalysisData.interventionPlan?.specificFocus?.[category]?.techniques ||
                              // Generate specific techniques based on error patterns
                              (() => {
                                const techniques = [];
                                const errorPattern = realAnalysisData.errorPatterns?.[category];
                                if (errorPattern?.patinig_errors) {
                                  techniques.push({
                                    technique: "Auditory Discrimination Training",
                                    description: "Systematic practice distinguishing similar vowel sounds",
                                    duration: "10-15 minutes daily",
                                    materials: "Minimal pair cards, audio recordings",
                                    progressCriteria: "90% accuracy on targeted sound pairs",
                                    researchBasis: "Tallal et al. (1996) - Intensive auditory training improves discrimination"
                                  });
                                }
                                if (errorPattern?.katinig_errors) {
                                  techniques.push({
                                    technique: "Multisensory Sound-Symbol Mapping",
                                    description: "Visual-auditory-kinesthetic consonant learning",
                                    duration: "15-20 minutes daily",
                                    materials: "Letter cards, mirrors, tactile materials",
                                    progressCriteria: "Consistent cross-modal sound identification",
                                    researchBasis: "Gillingham & Stillman (1960) - Multisensory approach for struggling readers"
                                  });
                                }
                                if (techniques.length === 0) {
                                  techniques.push("Systematic, explicit instruction", "Immediate corrective feedback");
                                }
                                return techniques;
                              })()
          },
          materialRecommendations: realAnalysisData.researchBasedPrescriptions?.[category]?.materialRecommendations ||
                                 realAnalysisData.researchBasedPrescriptions?.[category]?.interventionPrescription?.materialRecommendations ||
                                 realAnalysisData.interventionPlan?.specificFocus?.[category]?.materials ||
                                 // Generate material recommendations based on error patterns
                                 (() => {
                                   const materials = [];
                                   const errorPattern = realAnalysisData.errorPatterns?.[category];
                                   if (errorPattern?.patinig_errors) {
                                     materials.push(
                                       "Letter recognition flashcards with high-contrast visuals",
                                       "Visual discrimination worksheets targeting vowel confusions",
                                       "Audio recordings with clear vowel sound distinctions"
                                     );
                                   }
                                   if (errorPattern?.katinig_errors) {
                                     materials.push(
                                       "Tactile letter cards with sandpaper texture",
                                       "Mirror for mouth position awareness during sound production",
                                       "Minimal pair cards focusing on confused consonant sounds"
                                     );
                                   }
                                   if (materials.length === 0) {
                                     materials.push("Teacher-created intervention questions", "Visual-auditory learning materials");
                                   }
                                   return materials;
                                 })()
        } : {
          // NO REAL DATA AVAILABLE - Create minimal prescription structure
          deficitAnalysis: {
            specificDeficits: ["No prescriptive analysis data available"],
            severity: "unknown",
            errorRate: "unknown",
            confusionPairs: []
          },
          interventionPrescription: {
            primaryApproach: "multisensory_structured",
            recommendedQuestionCount: questionChoicePairs.length,
            intensityLevel: "moderate", // Valid enum value
            sessionStructure: {
              optimalLength: "15-20 minutes",
              breakPattern: "Every 10 minutes"
            },
            specificTechniques: [
              {
                technique: "Teacher-created intervention based on observation",
                description: "Customized intervention approach based on teacher observation",
                duration: "15-20 minutes daily",
                materials: "Teacher-created materials and resources",
                progressCriteria: "Observable improvement in target skills",
                researchBasis: "Teacher expertise and observational assessment"
              }
            ]
          },
          materialRecommendations: ["Teacher-created intervention questions"]
        },

        // Teacher Implementation
        teacherImplementation: {
          implementedBy: getValidTeacherId(),
          implementationDate: getFormattedDate(),
          prescriptionFollowed: true,
          questionDistribution: {
            total: questionChoicePairs.length,
            focusAreas: `${category} - ${questionChoicePairs.length} questions`
          }
        },

        // Total questions count (dynamic based on teacher creation)
        totalQuestions: questionChoicePairs.length,

        // Questions array
        questions: questionChoicePairs.map((pair, index) => {
          // Check category type for proper validation
          const normCategory = normalizeCategory(category);
          const isAlphabetKnowledge = normCategory === 'alphabet_knowledge';
          const isPhonologicalAwareness = normCategory === 'phonological_awareness';
          const isDecoding = normCategory === 'decoding';
          const isWordRecognition = normCategory === 'word_recognition';

          // Get full choice objects for the selected choices
          let selectedChoices = [];
          
          if (isAlphabetKnowledge) {
            // Alphabet Knowledge uses pair.choices array
            selectedChoices = pair.choices || [];
          } else if (isPhonologicalAwareness) {
            // Phonological Awareness uses audioTexts - generate choices from audioTexts
            const audioTexts = pair.audioTexts || [];
            const validAudioTexts = audioTexts.filter(text => text && text.trim());
            
            if (validAudioTexts.length === 0) {
              console.error(`[SAVE] ❌ Question ${index} has no valid audio texts:`, {
                audioTexts: pair.audioTexts,
                validAudioTexts
              });
              throw new Error(`Question ${index} has no valid audio texts configured`);
            }
            
            // Generate choice options from audioTexts for validation
            selectedChoices = validAudioTexts.map((audioText, idx) => ({
              optionId: String(idx + 1),
              optionText: audioText,
              isCorrect: true, // All audio texts are correct for PA
              audioText: audioText
            }));
          } else {
            // Other categories use pair.choiceIds
            selectedChoices = getChoicesByIds(pair.choiceIds);
          }

          // Validate selectedChoices is not empty (except for Phonological Awareness, Decoding, and Word Recognition which have different structures)
          if (!isPhonologicalAwareness && !isDecoding && !isWordRecognition && (!selectedChoices || selectedChoices.length === 0)) {
            console.error(`[SAVE] ❌ Question ${index} has no choices:`, {
              isAlphabetKnowledge,
              isPhonologicalAwareness,
              isDecoding,
              isWordRecognition,
              pairChoices: pair.choices,
              pairChoiceIds: pair.choiceIds,
              audioTexts: pair.audioTexts,
              selectedChoices
            });
            throw new Error(`Question ${index} has no valid choices available`);
          }
          
          // Debug log for image URLs
          if (pair.questionImage) {
            console.log(`[SAVE] Processing question ${index} image URL: ${pair.questionImage.substring(0, 100)}...`);
          }
          
          // Make sure we're not sending blob URLs to the server
          const processedImageUrl = sanitizeImageUrl(pair.questionImage);
          
          // Log if image changed after sanitization
          if (pair.questionImage && processedImageUrl !== pair.questionImage) {
            console.log(`[SAVE] Image URL sanitized for question ${index}:`);
            console.log(`  Before: ${pair.questionImage.substring(0, 100)}...`);
            console.log(`  After: ${processedImageUrl ? processedImageUrl.substring(0, 100) + '...' : 'null'}`);
          }
          
          // Build CLAUDE.md compliant question structure
          const questionId = `int_${category.toLowerCase().replace(/\s+/g, '_')}_${String(index + 1).padStart(3, '0')}`;
          const isTemplateQuestion = pair.sourceType === 'template' || pair.sourceType === 'template_question';

          // Base question structure
          const baseQuestion = {
            questionId: questionId,
            source: pair.sourceType || 'custom',
            sourceTemplateId: isTemplateQuestion ? pair.sourceTemplateId : null,
            sourceQuestionId: pair.sourceId,
            questionType: isWordRecognition ? 'fill_blank' : pair.questionType,
            questionText: pair.questionText,
            questionImage: processedImageUrl,
            questionValue: isDecoding ? null : (isWordRecognition ? null : (pair.questionValue || (pair.questionImage ? pair.questionText?.split(' ').pop() || '' : ''))),
          };

          // Category-specific structure
          if (isPhonologicalAwareness) {
            // Phonological Awareness uses questionSet structure (NOT choiceOptions)
            const audioTexts = pair.audioTexts || [];
            const validAudioTexts = audioTexts.filter(text => text && text.trim());

            const matchingOptions = validAudioTexts.map(audioText => {
              return audioText.length === 1
                ? audioText.toUpperCase() + audioText.toLowerCase()
                : audioText;
            });

            const correctPairs = validAudioTexts.map(audioText => {
              const matchingText = audioText.length === 1
                ? audioText.toUpperCase() + audioText.toLowerCase()
                : audioText;

              // Format matching main_assessment structure: {"H": "Hh"}
              const pairObj = {};
              pairObj[audioText] = matchingText;
              return pairObj;
            });

            return {
              ...baseQuestion,
              // Phonological Awareness specific structure matching main_assessment
              questionSet: {
                audioTexts: validAudioTexts,
                matchingOptions: matchingOptions,
                correctPairs: correctPairs
              },
              // Add prescription alignment
              prescriptionAlignment: {
                targetSkill: "sound_discrimination",
                technique: mongoDbAnalysis?.researchBasedPrescriptions?.[category]?.interventionPrescription?.specificTechniques?.[0]?.technique || "Auditory Discrimination Training",
                difficultyLevel: "standard",
                multisensoryElements: ["audio", "visual"]
              },
              createdBy: getValidTeacherId(),
              createdAt: getFormattedDate()
            };
          } else if (isDecoding) {
            // Decoding uses dragElements and correctSequence structure + intervention metadata
            return {
              ...baseQuestion,
              // Decoding specific structure matching main_assessment
              dragElements: pair.dragElements || [],
              correctSequence: pair.correctSequence || [],
              displaySequence: pair.displaySequence || null,
              blankPosition: pair.blankPosition !== undefined ? pair.blankPosition : null,
              // Add prescription alignment for intervention tracking
              prescriptionAlignment: {
                targetSkill: "decoding",
                technique: mongoDbAnalysis?.researchBasedPrescriptions?.[category]?.interventionPrescription?.specificTechniques?.[0]?.technique || "Word Building Practice",
                difficultyLevel: "standard",
                multisensoryElements: ["visual", "tactile"]
              },
              createdBy: getValidTeacherId(),
              createdAt: getFormattedDate()
            };
          } else if (isWordRecognition) {
            // Word Recognition uses displayWord, blankOptions, correctAnswer structure matching main_assessment
            // For sentence completion, ensure displayWord has blanks if blankPosition is set
            let finalDisplayWord = pair.displayWord || '';
            if (pair.questionSubType === 'sentence_completion' && pair.blankPosition !== null && pair.sentenceTokens) {
              finalDisplayWord = pair.sentenceTokens.map((token, index) => 
                index === pair.blankPosition ? '_____' : token
              ).join(' ');
            }
            
            return {
              ...baseQuestion,
              // Word Recognition specific structure matching main_assessment exactly
              displayWord: finalDisplayWord,
              blankOptions: pair.blankOptions || [],
              correctAnswer: pair.correctAnswer || [],
              // Add prescription alignment for intervention tracking
              prescriptionAlignment: {
                targetSkill: "word_recognition",
                technique: mongoDbAnalysis?.researchBasedPrescriptions?.[category]?.interventionPrescription?.specificTechniques?.[0]?.technique || "Word Recognition Practice",
                difficultyLevel: "standard",
                multisensoryElements: ["visual", "cognitive"]
              },
              createdBy: getValidTeacherId(),
              createdAt: getFormattedDate()
            };
          } else {
            // Other categories use choiceOptions structure
            return {
              ...baseQuestion,
              // Use choiceOptions for non-Phonological Awareness categories
              choiceOptions: selectedChoices.map((choice, choiceIdx) => {
                if (isAlphabetKnowledge) {
                  // Alphabet Knowledge choice structure
                  return {
                    optionId: String(choiceIdx + 1),
                    optionText: choice.optionText || '',
                    isCorrect: choice.isCorrect || false,
                    imageUrl: choice.imageUrl || null
                  };
                } else {
                  // Other categories choice structure
                  const choiceDescription = choice.description || '';
                  console.log(`Saving choice for question ${index}:`, {
                    optionText: choice.choiceValue || choice.soundText || '',
                    isCorrect: choice._id === pair.correctChoiceId,
                    description: choiceDescription
                  });
                  return {
                    optionId: String(choiceIdx + 1),
                    optionText: choice.choiceValue || choice.soundText || '',
                    isCorrect: choice._id === pair.correctChoiceId,
                    imageUrl: null
                  };
                }
              }),

              // For other categories, include additional identification fields
              ...(!isAlphabetKnowledge ? {
                choiceIds: pair.choiceIds,
                correctChoiceId: pair.correctChoiceId
              } : {}),

              // Add prescription alignment per CLAUDE.md
              prescriptionAlignment: {
                targetSkill: isTemplateQuestion ? category.toLowerCase().replace(/\s+/g, '_') : "general_practice",
                technique: mongoDbAnalysis?.researchBasedPrescriptions?.[category]?.interventionPrescription?.specificTechniques?.[0]?.technique ||
                          mongoDbAnalysis?.researchBasedPrescriptions?.[category]?.interventionPrescription?.specificTechniques?.[0] ||
                          mongoDbAnalysis?.interventionPlan?.specificFocus?.[category]?.recommendedActivities?.[0] ||
                          "Systematic, explicit instruction",
                difficultyLevel: "standard",
                multisensoryElements: ["visual", "cognitive"]
              },

              // Track who created this question
              createdBy: getValidTeacherId(),
              createdAt: getFormattedDate()
            };
          }
        }),

        // Versioning System (required by CLAUDE.md)
        revisionNumber: activity?.revisionNumber || 1,
        revisionHistory: activity?.revisionHistory || [{
          version: 1,
          editedBy: getValidTeacherId(),
          editedAt: getFormattedDate(),
          changes: "Initial implementation of doctor's prescription",
          prescriptionCompliance: "full"
        }],
        lastEditedBy: getValidTeacherId(),
        lastEditedAt: getFormattedDate(),

        // Intervention Parameters
        interventionParameters: {
          fixedQuestions: questionChoicePairs.length,
          allowSkip: false,
          showProgress: true,
          immediateFeedback: false
        },

        // Question Count Calculation (dynamic, based on real data)
        questionCountCalculation: {
          finalCount: questionChoicePairs.length,
          rationale: realAnalysisData
            ? `Teacher created ${questionChoicePairs.length} questions based on real prescriptive analysis`
            : `Teacher created ${questionChoicePairs.length} questions (no prescriptive analysis available)`,
          factors: {
            base: realAnalysisData?.interventionPlan?.specificFocus?.[category]?.questionDistribution?.total || 10,
            errorSeverity: {
              level: realAnalysisData?.researchBasedPrescriptions?.[category]?.deficitAnalysis?.specificDeficits?.[0]?.severity ||
                    realAnalysisData?.errorPatterns?.[category]?.severity ||
                    (realAnalysisData?.skillMastery?.[category]?.score < 40 ? "severe" :
                     realAnalysisData?.skillMastery?.[category]?.score < 60 ? "moderate" : "mild"),
              adjustment: 0,
              percentage: parseFloat(realAnalysisData?.researchBasedPrescriptions?.[category]?.deficitAnalysis?.specificDeficits?.[0]?.errorRate) ||
                         realAnalysisData?.errorPatterns?.[category]?.errorRate ||
                         (100 - (realAnalysisData?.skillMastery?.[category]?.score || 0))
            },
            masteryLevel: {
              score: realAnalysisData?.skillMastery?.[category]?.score || 0,
              adjustment: 0
            },
            categoryComplexity: {
              multiplier: 1.0,
              adjustment: 0
            },
            interventionHistory: {
              attemptCount: 1,
              adjustment: 0
            }
          },
          calculatedAt: getFormattedDate()
        },

        // Status tracking
        status: 'active',
        createdBy: getValidTeacherId(),
        createdAt: activity?.createdAt || getFormattedDate(),
        updatedAt: getFormattedDate(),

        // Completion tracking (will be filled when student completes)
        startedAt: null,
        completedAt: null,
        interventionResultsId: null
      };
    }
    
    // Log the prepared data for debugging
    console.log('[SAVE] ✅ Prepared intervention data:', JSON.stringify(interventionData, null, 2));
    console.log('[SAVE] ✅ Prescriptive Analysis ID included:', prescriptiveAnalysisId);
    
    // Log image URLs in the prepared data
    const imageUrlsInQuestions = interventionData.questions.filter(q => q.questionImage).map(q => q.questionImage);
    console.log(`[SAVE] ✅ Found ${imageUrlsInQuestions.length} image URLs in questions:`);
    imageUrlsInQuestions.forEach((url, index) => {
      console.log(`[SAVE] Question ${index + 1} image URL: ${url}`);
    });
    
    return interventionData;
  };
 
  /**
   * Navigation handlers
   */
  const nextStep = () => {
    if (validateCurrentStep()) {
      setCurrentStep(currentStep + 1);
    }
  };
 
  const prevStep = () => {
    setCurrentStep(currentStep - 1);
  };
  
  /**
   * Question-Choice Pair Management
   */
  const addQuestionChoicePair = () => {
    // Normalize the category
    const normCategory = normalizeCategory(category);
    
    // Get default question type based on category, not content type
    // For decoding, don't set a default - let teachers choose
    const defaultQuestionType = normCategory === 'alphabet_knowledge' ? 'patinig' : 
                                normCategory === 'phonological_awareness' ? 'malapantig' : 
                                normCategory === 'word_recognition' ? 'word' : 
                                normCategory === 'decoding' ? '' : 'sentence';
    
    // Generate a UUID-like id that doesn't rely on timestamps
    const generateUniqueId = () => {
      return 'pair_' + Math.random().toString(36).substring(2, 15) + 
             Math.random().toString(36).substring(2, 15);
    };
    
    // Create choices array for Alphabet Knowledge (exactly 3 choices)
    const defaultChoices = normCategory === 'alphabet_knowledge' ? [
      { optionText: '', isCorrect: false },
      { optionText: '', isCorrect: false },
      { optionText: '', isCorrect: false }
    ] : [];

    // Create audio texts array for Phonological Awareness (start with 1, can add up to 4)
    const defaultAudioTexts = normCategory === 'phonological_awareness' ? [''] : undefined;

    // Set default question text based on category and question type
    let defaultQuestionText = '';
    if (normCategory === 'decoding') {
      defaultQuestionText = ''; // No default text - will be set when type is selected
    } else if (normCategory === 'alphabet_knowledge') {
      defaultQuestionText = 'Anong titik ang nasa larawan?';
    } else if (normCategory === 'phonological_awareness') {
      defaultQuestionText = 'Anong tunog ang naririnig mo?';
    } else if (normCategory === 'word_recognition') {
      defaultQuestionText = 'Basahin ang pangungusap. Piliin ang tamang salita mula sa hanay.';
    } else if (normCategory === 'reading_comprehension') {
      defaultQuestionText = 'Basahin ang pangungusap at sagutin ang tanong.';
    }

    // Create Word Recognition specific fields
    const defaultWordRecognitionFields = normCategory === 'word_recognition' ? {
      displayWord: '',                    // Sentence with blank or word to match
      blankOptions: ['', '', '', ''],     // 4 answer choices by default
      correctAnswer: [],                  // Array of correct answers
      blankPosition: null,                // Position of blank in sentence
      sentenceTokens: [],                 // Tokenized sentence for click-to-select
      questionSubType: 'sentence_completion' // 'sentence_completion' or 'sound_matching'
    } : {};

    const newPair = {
      id: generateUniqueId(),
      sourceType: 'custom',
      sourceId: null,
      questionType: defaultQuestionType,
      questionText: defaultQuestionText,
      questionImage: null,
      questionValue: null,
      choiceIds: [],
      correctChoiceId: null,
      choices: defaultChoices,  // Add choices array for Alphabet Knowledge
      // Add audioTexts for Phonological Awareness
      ...(defaultAudioTexts && { audioTexts: defaultAudioTexts }),
      // Add Word Recognition specific fields
      ...defaultWordRecognitionFields
    };

    setQuestionChoicePairs(prev => [...prev, newPair]);
  };
 
  const removeQuestionChoicePair = (id) => {
    // Allow removal of any question, including Question 1 when it's the only one
    setQuestionChoicePairs(prev => prev.filter(pair => pair.id !== id));
  };
 
  const updateQuestionChoicePair = (id, fieldOrUpdates, value) => {
    // Handle both old style (field, value) and new style (object updates)
    let updates;

    if (typeof fieldOrUpdates === 'string') {
      // Old style: updateQuestionChoicePair(id, 'questionText', 'new text')
      updates = { [fieldOrUpdates]: value };
    } else {
      // New style: updateQuestionChoicePair(id, { questionText: 'new text', choices: [...] })
      updates = fieldOrUpdates;
    }

    // If removing an image, clean up any pending uploads and object URLs
    if (updates.questionImage === null) {
      // Revoke the object URL if it exists
      if (fileUploads[id]?.localUrl) {
        URL.revokeObjectURL(fileUploads[id].localUrl);
      }

      // Remove from pending uploads
      setPendingUploads(prev => {
        const newPendingUploads = { ...prev };
        delete newPendingUploads[id];
        return newPendingUploads;
      });

      // Clear file upload status
      setFileUploads(prev => {
        const newFileUploads = { ...prev };
        delete newFileUploads[id];
        return newFileUploads;
      });
    }

    // Update the question-choice pair
    setQuestionChoicePairs(prev =>
      prev.map(pair =>
        pair.id === id ? { ...pair, ...updates } : pair
      )
    );
  };
 
  /**
   * Validation functions for Alphabet Knowledge
   */
  const validateQuestionText = (text) => {
    if (!text || text.trim().length === 0) {
      return "Question text is required.";
    }
    if (text.trim().length < 5) {
      return "Question text must be at least 5 characters long.";
    }
    if (/\d/.test(text)) {
      return "Question text cannot contain numbers.";
    }
    if (text.trim().length > 200) {
      return "Question text must be less than 200 characters.";
    }
    return null;
  };

  const validateAnswerChoice = (choice, index) => {
    if (!choice || choice.trim().length === 0) {
      return `Choice ${index + 1} cannot be empty.`;
    }
    if (choice.trim().length > 50) {
      return `Choice ${index + 1} must be less than 50 characters.`;
    }
    // Check for numbers
    if (/\d/.test(choice)) {
      return `Choice ${index + 1} cannot contain numbers.`;
    }
    // Check for special characters (allow only letters and spaces)
    if (!/^[a-zA-Z\s]*$/.test(choice)) {
      return `Choice ${index + 1} can only contain letters and spaces.`;
    }
    return null;
  };

  const validateAlphabetKnowledgeQuestion = (pair) => {
    const errors = [];

    // Validate question text
    const questionError = validateQuestionText(pair.questionText);
    if (questionError) errors.push(questionError);

    // Validate choices
    if (!pair.choices || pair.choices.length !== 3) {
      errors.push("Must have exactly 3 answer choices.");
    } else {
      // Check each choice
      pair.choices.forEach((choice, index) => {
        const choiceError = validateAnswerChoice(choice.optionText, index);
        if (choiceError) errors.push(choiceError);
      });

      // Check that exactly one choice is marked correct
      const correctChoices = pair.choices.filter(choice => choice.isCorrect);
      if (correctChoices.length === 0) {
        errors.push("You must select one correct answer.");
      } else if (correctChoices.length > 1) {
        errors.push("Only one answer can be marked as correct.");
      }

      // Check for duplicate choices
      const choiceTexts = pair.choices.map(c => c.optionText?.trim().toLowerCase()).filter(Boolean);
      const uniqueChoices = new Set(choiceTexts);
      if (choiceTexts.length !== uniqueChoices.size) {
        errors.push("Answer choices must be different from each other.");
      }
    }

    return errors;
  };

  const validateAllAlphabetKnowledgeQuestions = () => {
    const allErrors = [];
    questionChoicePairs.forEach((pair, index) => {
      const pairErrors = validateAlphabetKnowledgeQuestion(pair);
      if (pairErrors.length > 0) {
        allErrors.push(`Question ${index + 1}: ${pairErrors.join(', ')}`);
      }
    });
    return allErrors;
  };

  /**
   * Apply template to Alphabet Knowledge question
   */
  const applyTemplateToQuestion = (pairId, templateId) => {
    if (!templateId) return;

    const template = questionTemplates.find(t => t._id === templateId);
    if (!template) {
      console.warn(`[TEMPLATE] Template not found: ${templateId}`);
      console.warn(`[TEMPLATE] Available templates:`, questionTemplates.map(t => ({ id: t._id, text: t.questionText || t.templateText })));
      return;
    }

    const templateDisplayName = template.questionText || template.templateText || 'Unknown Template';
    console.log(`[TEMPLATE] Applying template "${templateDisplayName}" to question ${pairId}`);
    console.log(`[TEMPLATE] Full template data:`, {
      _id: template._id,
      category: template.category,
      questionType: template.questionType,
      questionText: template.questionText,
      templateText: template.templateText,
      questionValue: template.questionValue,
      choiceOptions: template.choiceOptions
    });

    // Prepare template choices for Alphabet Knowledge (exactly 3 choices)
    let templateChoices = [];
    if (template.choiceOptions && Array.isArray(template.choiceOptions)) {
      // Use template choices directly
      templateChoices = template.choiceOptions.map(option => ({
        optionText: option.optionText,
        isCorrect: option.isCorrect
      }));
    } else {
      // Fallback: create default structure with correct answer if available
      templateChoices = [
        { optionText: template.questionValue || '', isCorrect: true },
        { optionText: '', isCorrect: false },
        { optionText: '', isCorrect: false }
      ];
    }

    // Ensure exactly 3 choices for Alphabet Knowledge
    while (templateChoices.length < 3) {
      templateChoices.push({ optionText: '', isCorrect: false });
    }
    if (templateChoices.length > 3) {
      templateChoices = templateChoices.slice(0, 3);
    }

    // Update the question with template data including choices and questionValue
    const templateQuestionText = template.templateText || template.questionText || '';
    updateQuestionChoicePair(pairId, {
      questionText: templateQuestionText,
      questionType: template.questionType,
      questionImage: template.questionImage || null,
      questionValue: template.questionValue || null, // Extract questionValue from template
      sourceTemplateId: template._id,
      choices: templateChoices
    });

    // Show success message
    const templateName = template.templateText || template.questionText || 'Template';
    setErrors(prev => ({
      ...prev,
      success: `Applied template: "${templateName}" with choices`
    }));

    // Clear success message after 3 seconds
    setTimeout(() => {
      setErrors(prev => ({
        ...prev,
        success: ''
      }));
    }, 3000);
  };

  /**
   * Apply Decoding Template - Populates Decoding-specific fields from template
   */
  const applyDecodingTemplate = (pairId, templateId) => {
    if (!templateId) {
      // Clear template - reset to custom question
      updateQuestionChoicePair(pairId, {
        sourceTemplateId: null,
        questionText: 'Tukuyin ang nasa larawan?', // Default question text
        questionImage: '',
        correctWord: '',
        completeWord: '',
        dragElements: [],
        correctSequence: [],
        displaySequence: null,
        blankPosition: null
      });
      return;
    }

    const template = questionTemplates.find(t => t._id === templateId);
    if (!template) {
      console.warn(`[DECODING TEMPLATE] Template not found: ${templateId}`);
      return;
    }

    console.log(`[DECODING TEMPLATE] Applying template to question ${pairId}:`, {
      templateId: template._id,
      questionText: template.questionText,
      questionType: template.questionType,
      questionImage: template.questionImage
    });

    // Extract template data based on question type
    const templateData = {
      sourceTemplateId: template._id,
      questionText: template.questionText || (template.questionType === 'complete_word_identification' ? 'Tukuyin ang nasa larawan?' : 'Buoin ang salita'),
      questionType: template.questionType,
      questionImage: template.questionImage || ''
    };

    console.log(`[DECODING TEMPLATE] Processing template data for ${template.questionType}:`, {
      questionValue: template.questionValue,
      correctWord: template.correctWord,
      completeWord: template.completeWord,
      dragElements: template.dragElements,
      correctSequence: template.correctSequence,
      displaySequence: template.displaySequence,
      blankPosition: template.blankPosition
    });

    // Type A: Complete Word Identification ("Tukuyin ang nasa larawan?")
    if (template.questionType === 'complete_word_identification') {
      // Extract word from correctSequence (this is how main assessment stores it)
      const wordFromCorrectSequence = template.correctSequence ? template.correctSequence.join('') : '';
      const wordValue = template.correctWord || wordFromCorrectSequence || template.questionValue || '';

      templateData.correctWord = wordValue.charAt(0).toUpperCase() + wordValue.slice(1).toLowerCase(); // Proper capitalization
      templateData.correctSequence = template.correctSequence || (wordValue ? wordValue.split('').map((letter, index) =>
        index === 0 ? letter.toUpperCase() : letter.toLowerCase()
      ) : []);
      templateData.dragElements = template.dragElements || (wordValue ? generateDragElements(wordValue) : []);
      templateData.displaySequence = null;
      templateData.blankPosition = null;

      console.log(`[DECODING TEMPLATE] Type A populated:`, {
        correctWord: templateData.correctWord,
        correctSequence: templateData.correctSequence,
        dragElements: templateData.dragElements
      });
    }
    // Type B: Fill Missing Letter ("Buoin ang salita")
    else if (template.questionType === 'fill_missing_letter') {
      // For Type B, reconstruct the complete word from displaySequence + correctSequence
      let wordValue = '';
      if (template.displaySequence && template.correctSequence && template.correctSequence.length > 0) {
        const display = [...template.displaySequence];
        const blankPos = template.blankPosition !== undefined ? template.blankPosition : 0;
        if (display[blankPos] === '_') {
          display[blankPos] = template.correctSequence[0];
        }
        wordValue = display.join('');
      } else {
        wordValue = template.completeWord || template.questionValue || '';
      }

      templateData.completeWord = wordValue.charAt(0).toUpperCase() + wordValue.slice(1).toLowerCase(); // Proper capitalization
      templateData.blankPosition = template.blankPosition !== undefined ? template.blankPosition : 0;
      templateData.displaySequence = template.displaySequence || (wordValue ? wordValue.split('').map((letter, idx) =>
        idx === templateData.blankPosition ? '_' : letter
      ) : []);
      templateData.correctSequence = template.correctSequence || (wordValue ? [wordValue[templateData.blankPosition]] : []);
      templateData.dragElements = template.dragElements || (wordValue ? generateChoiceLetters(wordValue[templateData.blankPosition]) : []);

      console.log(`[DECODING TEMPLATE] Type B populated:`, {
        completeWord: templateData.completeWord,
        blankPosition: templateData.blankPosition,
        displaySequence: templateData.displaySequence,
        correctSequence: templateData.correctSequence,
        dragElements: templateData.dragElements
      });
    }

    // Apply the template data to the question
    updateQuestionChoicePair(pairId, templateData);

    // Show success message
    setErrors(prev => ({
      ...prev,
      success: `Applied template: "${template.questionText}" for ${template.questionType}`
    }));

    // Clear success message after 3 seconds
    setTimeout(() => {
      setErrors(prev => ({
        ...prev,
        success: ''
      }));
    }, 3000);
  };

  /**
   * Apply Word Recognition Template - Populates Word Recognition-specific fields from template
   */
  const applyWordRecognitionTemplate = (pairId, templateId) => {
    if (!templateId) {
      // Clear template - reset to custom question
      updateQuestionChoicePair(pairId, {
        sourceTemplateId: null,
        questionText: 'Basahin ang pangungusap. Piliin ang tamang salita mula sa hanay.',
        questionSubType: 'sentence_completion',
        displayWord: '',
        blankOptions: ['', '', '', ''],
        correctAnswer: [],
        // These fields are generated dynamically, not stored in templates
        blankPosition: null,
        sentenceTokens: []
      });
      return;
    }

    const template = questionTemplates.find(t => t._id === templateId);
    if (!template) {
      console.warn('[WORD RECOGNITION TEMPLATE] Template not found:', templateId);
      return;
    }

    console.log('[WORD RECOGNITION TEMPLATE] Applying template:', {
      templateId: template._id,
      questionText: template.questionText,
      displayWord: template.displayWord,
      blankOptions: template.blankOptions,
      correctAnswer: template.correctAnswer
    });

    // Determine question sub-type based on question text content
    let questionSubType = 'sentence_completion'; // Default
    
    if (template.questionText) {
      const questionText = template.questionText.toLowerCase();
      
      // Check for sound matching indicators
      if (questionText.includes('kasing tunog') || 
          questionText.includes('buoin') || 
          questionText.includes('sound') ||
          questionText.includes('match')) {
        questionSubType = 'sound_matching';
      }
      // Check for sentence completion indicators
      else if (questionText.includes('basahin') || 
               questionText.includes('pangungusap') || 
               questionText.includes('piliin') ||
               questionText.includes('sentence') ||
               questionText.includes('complete')) {
        questionSubType = 'sentence_completion';
      }
    }
    
    console.log(`[WORD RECOGNITION TEMPLATE] Detected question type: ${questionSubType} from text: "${template.questionText}"`);

    // For sentence completion, generate sentenceTokens and blankPosition dynamically
    let sentenceTokens = [];
    let blankPosition = null;
    if (questionSubType === 'sentence_completion' && template.displayWord) {
      // Templates store complete sentences WITHOUT blanks - teachers choose blank position
      // Tokenize the complete sentence for word clicking functionality
      sentenceTokens = template.displayWord.split(/\s+/).filter(t => t.length > 0);
      blankPosition = null; // No blank position set initially - teacher must choose
    } else if (questionSubType === 'sound_matching' && template.displayWord) {
      // For sound matching questions, the displayWord is a single word (e.g. "SUMBRERO")
      // No sentence tokens or blank position needed for sound matching
      sentenceTokens = [];
      blankPosition = null;
    }

    // Apply template data to the question pair based on detected type
    const templateData = {
      sourceTemplateId: template._id,
      sourceType: 'template',
      questionText: template.questionText || (questionSubType === 'sound_matching' 
        ? 'Anong kasing tunog ng salitang nakikita?' 
        : 'Basahin ang pangungusap. Piliin ang tamang salita mula sa hanay.'),
      questionSubType: questionSubType,
      displayWord: template.displayWord || '', // Complete sentence from template (no blanks)
      blankOptions: template.blankOptions || ['', '', '', ''],
      correctAnswer: template.correctAnswer || [],
      // Generate these fields dynamically from template data
      blankPosition: blankPosition, // null initially - teacher must choose
      sentenceTokens: sentenceTokens, // Generated from complete sentence
      questionImage: template.questionImage || null
    };

    // Type-specific field population
    if (questionSubType === 'sentence_completion') {
      // Ensure sentence completion has proper structure
      templateData.questionText = template.questionText || 'Basahin ang pangungusap. Piliin ang tamang salita mula sa hanay.';
      templateData.blankPosition = blankPosition;
      templateData.sentenceTokens = sentenceTokens;
      
      console.log(`[WORD RECOGNITION TEMPLATE] Sentence completion populated:`, {
        displayWord: templateData.displayWord, // Complete sentence from template
        blankPosition: templateData.blankPosition, // null - teacher must choose
        sentenceTokens: templateData.sentenceTokens, // Generated from complete sentence
        blankOptions: templateData.blankOptions,
        correctAnswer: templateData.correctAnswer
      });
    } else if (questionSubType === 'sound_matching') {
      // Ensure sound matching has proper structure
      templateData.questionText = template.questionText || 'Anong kasing tunog ng salitang nakikita?';
      templateData.blankPosition = null; // No blank position for sound matching
      templateData.sentenceTokens = []; // No sentence tokens for sound matching
      
      console.log(`[WORD RECOGNITION TEMPLATE] Sound matching populated:`, {
        displayWord: templateData.displayWord,
        blankOptions: templateData.blankOptions,
        correctAnswer: templateData.correctAnswer,
        questionImage: templateData.questionImage
      });
    }

    console.log(`[WORD RECOGNITION TEMPLATE] Final template data being applied:`, templateData);
    updateQuestionChoicePair(pairId, templateData);

    // Show success notification
    createModalToast(`Template applied: ${questionSubType === 'sound_matching' ? 'Sound Matching' : 'Sentence Completion'}`, 'success');

    // Success notification
    const notificationTimeout = setTimeout(() => {
      setSuccessMessage('');
    }, 3000);

    setSuccessMessage(`Template applied successfully!`);
  };

  /**
   * Template Management
   */
  const setTemplateForPair = (pairId, templateId) => {
    setQuestionChoicePairs(prev => {
      return prev.map(pair => {
        if (pair.id === pairId) {
          // Find the selected template
          const template = questionTemplates.find(t => t._id === templateId);

          if (!template) {
            // If clearing template (empty templateId), reset to custom
            if (!templateId) {
              return {
                ...pair,
                sourceType: 'custom',
                sourceId: null,
                questionText: '',
                audioTexts: [''], // Start with just 1 audio text - teacher can add more
                matchingOptions: [],
                correctPairs: []
              };
            }
            return pair;
          }

          console.log(`[TEMPLATE POPULATION] Populating template for Phonological Awareness:`, {
            templateId: template._id,
            questionText: template.questionText || template.templateText,
            questionSet: template.questionSet,
            category: template.category
          });

          // For Phonological Awareness templates, populate all template fields
          if (template.category === 'Phonological Awareness' && template.questionSet) {
            const questionSet = template.questionSet;

            // Generate matching options and correct pairs from audioTexts
            const audioTexts = questionSet.audioTexts || [''];
            const matchingOptions = [];
            const correctPairs = [];

            // Generate matching options for each audio text
            audioTexts.forEach(audioText => {
              if (audioText.trim()) {
                let matchingText;
                if (audioText.length === 1) {
                  // Single letter: create uppercase + lowercase format (L → Ll)
                  matchingText = audioText.toUpperCase() + audioText.toLowerCase();
                } else {
                  // Multi-character: use as-is
                  matchingText = audioText;
                }
                matchingOptions.push(matchingText);
                correctPairs.push({
                  audio: audioText,
                  match: matchingText
                });
              }
            });

            return {
              ...pair,
              sourceType: 'template_question',
              sourceId: template._id,
              sourceTemplateId: template._id, // For proper CLAUDE.md compliance
              questionType: template.questionType,
              questionText: template.questionText || template.templateText,
              // Phonological Awareness specific fields from template
              audioTexts: [...audioTexts], // Make a copy to allow editing
              matchingOptions: [...matchingOptions], // Auto-generated but editable
              correctPairs: [...correctPairs], // Auto-generated but editable
              // Reset other fields not applicable to PA
              questionImage: null,
              questionValue: null,
              choiceIds: [],
              correctChoiceId: null
            };
          } else {
            // For other categories (non-PA), use original logic
            return {
              ...pair,
              sourceType: 'template_question',
              sourceId: template._id,
              sourceTemplateId: template._id,
              questionType: template.questionType,
              questionText: template.templateText || template.questionText,
              questionImage: null,
              questionValue: null,
              choiceIds: [],
              correctChoiceId: null
            };
          }
        }
        return pair;
      });
    });
  };
 
  /**
   * Choice Management
   */
  const addChoiceToPair = (pairId, choiceId) => {
    setQuestionChoicePairs(prev => 
      prev.map(pair => {
        if (pair.id === pairId) {
          // Enforce exactly 2 choices
          if (safe(pair.choiceIds).length >= 2) {
            // Don't silently discard, show a warning instead
            console.warn('Each question can only have two answer choices');
            return pair;
          }
          
          // Don't add if already present
          if (safe(pair.choiceIds).includes(choiceId)) {
            return pair;
          }
          
          const newChoiceIds = [...pair.choiceIds, choiceId];
          
          // autopopulate questionValue if it's still empty
          const autoValue =
            pair.questionValue ||
            questionValueLookup[choiceId] ||
            null;
          
          return {
            ...pair,
            choiceIds: newChoiceIds,
            // Set first choice as correct if none set
            correctChoiceId: pair.correctChoiceId || choiceId,
            questionValue: autoValue
          };
        }
        return pair;
      })
    );
  };
 
  const removeChoiceFromPair = (pairId, choiceId) => {
    setQuestionChoicePairs(prev => 
      prev.map(pair => {
        if (pair.id === pairId) {
          // Check if this is a template with locked correct answer
          if (pair.sourceTemplateId && pair.correctChoiceId === choiceId) {
            // Find the choice to check if it's the correct answer from template
            const choiceToRemove = choiceTemplates.find(c => c._id === choiceId);
            if (choiceToRemove && choiceToRemove.isCorrect) {
              // Prevent deletion of correct answer from template
              createModalToast('Cannot remove the correct answer from a template. The correct answer is locked.', 'warning');
              return pair; // Return unchanged pair
            }
          }
          
          const newChoiceIds = pair.choiceIds.filter(id => id !== choiceId);
          
          // Auto-select the first remaining choice if the removed choice was correct
          let newCorrectChoiceId = pair.correctChoiceId;
          if (pair.correctChoiceId === choiceId) {
            newCorrectChoiceId = newChoiceIds.length > 0 ? newChoiceIds[0] : null;
          }
          
          return {
            ...pair,
            choiceIds: newChoiceIds,
            correctChoiceId: newCorrectChoiceId
          };
        }
        return pair;
      })
    );
  };
 
  const setCorrectChoice = (pairId, choiceId) => {
    setQuestionChoicePairs(prev =>
      prev.map(pair => {
        if (pair.id !== pairId) return pair;

        // For Alphabet Knowledge, update both correctChoiceId and choices isCorrect flags
        const normCategory = normalizeCategory(category);
        if (normCategory === 'alphabet_knowledge' && pair.choices && pair.choices.length > 0) {
          const updatedChoices = pair.choices.map((choice, index) => ({
            ...choice,
            isCorrect: choice._id === choiceId || index === parseInt(choiceId) || choice.optionText === choiceId
          }));

          return {
            ...pair,
            correctChoiceId: choiceId,
            choices: updatedChoices
          };
        }

        // For other categories, just update correctChoiceId
        return { ...pair, correctChoiceId: choiceId };
      })
    );
  };

  /**
   * Update the description for a choice
   */
  const updateChoiceDescription = (choiceId, description) => {
    // Update the choice in choiceTemplates
    setChoiceTemplates(prev => 
      prev.map(choice => 
        choice._id === choiceId ? { ...choice, description } : choice
      )
    );
    
    // Log the updated description for debugging
    console.log(`Updated description for choice ${choiceId}: "${description}"`);
  };
 
  // When updating question value, clear image if value is set
  const handleQuestionValueChange = debounce((pairId, newText) => {
    // Just update the question value without auto-adding choices
    updateQuestionChoicePair(pairId, 'questionValue', newText);
    
    // If a value is being set, clear the image
    // if (newText && newText.trim() !== '') {
    //   updateQuestionChoicePair(pairId, 'questionImage', null);
    // }
    
    // Only attempt to auto-select choices for custom questions
    if (questionChoicePairs.find(p => p.id === pairId)?.sourceType === 'custom') {
      const choice = findChoiceByText(newText);
      if (!choice) return;                           // user typed something random
  
      setQuestionChoicePairs(prev =>
        prev.map(pair => {
          if (pair.id !== pairId) return pair;
  
          // ① Ensure the matching choice is inside choiceIds (max 2 rule)
          let newChoiceIds = pair.choiceIds;
          if (!newChoiceIds.includes(choice._id)) {
            newChoiceIds = [...newChoiceIds, choice._id].slice(-2);
          }
  
          // ② If no correct answer yet, set this one
          const correctChoiceId = pair.correctChoiceId || choice._id;
  
          return { ...pair, choiceIds: newChoiceIds, correctChoiceId };
        })
      );
    }
  }, 200);
 
  /**
   * Inline Template Creation
   */
  const handleCreateNewTemplate = async () => {
    try {
      if (!validateNewTemplate()) {
        return;
      }
      
      // Create new template
      const newTemplate = await createNewQuestionTemplate({
        category: normalizeCategory(category),
        questionType: newTemplateData.questionType,
        templateText: newTemplateData.templateText,
        applicableChoiceTypes: newTemplateData.applicableChoiceTypes
      });
      
      // Reset form
      setNewTemplateData({
        templateText: '',
        questionType: '',
        applicableChoiceTypes: []
      });
      
      // Close form
      setShowNewTemplateForm(false);
    } catch (error) {
      console.error("Error creating template:", error);
      setErrors({ newTemplate: "Failed to create template. Please try again." });
    }
  };
 
  /**
   * Inline Choice Creation
   */
  const handleCreateNewChoice = async (pairId) => {
    try {
      // Auto-fill choiceType if a matching template exists
      if (newChoiceData.choiceValue && !newChoiceData.choiceType) {
        const existingChoice = findChoiceValue(newChoiceData.choiceValue);
        if (existingChoice) {
          setNewChoiceData(prev => ({
            ...prev,
            choiceType: existingChoice.choiceType,
            soundText: existingChoice.soundText || prev.soundText
          }));
        }
      }
      
      // If no description is provided, create a default one based on the question type and correctness
      if (!newChoiceData.description || newChoiceData.description.trim() === '') {
        const pair = questionChoicePairs.find(p => p.id === pairId);
        const isFirstChoice = pair && safe(pair.choiceIds).length === 0;
        
        // Set default description based on question type
        let defaultDescription = '';
        if (pair) {
          switch(pair.questionType) {
            case 'patinig':
              defaultDescription = isFirstChoice ? 
                'Correct! You identified the vowel correctly.' : 
                'Incorrect. Try again and listen carefully to the vowel sound.';
              break;
            case 'katinig':
              defaultDescription = isFirstChoice ? 
                'Correct! You identified the consonant correctly.' : 
                'Incorrect. Try again and listen carefully to the consonant sound.';
              break;
            case 'malapantig':
              defaultDescription = isFirstChoice ? 
                'Correct! You combined the syllables correctly.' : 
                'Incorrect. Try sounding out each syllable slowly.';
              break;
            case 'word':
              defaultDescription = isFirstChoice ? 
                'Correct! You recognized the word correctly.' : 
                'Incorrect. Look carefully at the letters that make up this word.';
              break;
            default:
              defaultDescription = isFirstChoice ? 
                'Correct! Good job.' : 
                'Incorrect. Try again.';
          }
          
          setNewChoiceData(prev => ({
            ...prev,
            description: defaultDescription
          }));
        }
      }
      
      if (!validateNewChoice()) return;
      
      setSubmitting(true);
      
      // Clean up data before sending
      const choiceDataToSend = {
        ...newChoiceData,
        // Convert empty strings to null
        choiceValue: newChoiceData.choiceValue.trim() || null,
        soundText: newChoiceData.soundText.trim() || null,
        description: newChoiceData.description.trim() || '',
        // Remove choiceImage as it should be on the question level
        choiceImage: null
      };
      
      const newChoice = await createNewChoiceTemplate(choiceDataToSend);
      
      // Reset form
      setNewChoiceData({
        choiceType: '',
        choiceValue: '',
        soundText: '',
        choiceImage: null,
        description: ''
      });
      toggleChoiceForm(pairId, false);
      
      // Add the new choice to the current pair
      addChoiceToPair(pairId, newChoice._id);
      
      // Show success message
      console.log('New choice created:', newChoice);
    } catch (error) {
      console.error('Error creating choice:', error);
      setErrors({ newChoice: 'Failed to create choice. Please try again.' });
    } finally {
      setSubmitting(false);
    }
  };
 
  // Removed complex template management functions - now using simple dropdown approach

  /**
   * Reading Comprehension Custom Content Management
   */

  // Multiple Activities Management
  const getCurrentActivity = () => {
    return customReadingComprehensionActivities[activeActivityIndex] || {};
  };

  const updateCurrentActivity = (updates) => {
    setCustomReadingComprehensionActivities(prev =>
      prev.map((activity, index) =>
        index === activeActivityIndex ? { ...activity, ...updates } : activity
      )
    );
  };

  const addNewActivity = () => {
    const newActivity = {
      id: 'rc_activity_' + Date.now(),
      storyTitle: '',
      storyPages: [],
      questions: [],
      selectedTemplate: null // Each activity can have its own template selection
    };
    setCustomReadingComprehensionActivities(prev => [...prev, newActivity]);
    setActiveActivityIndex(customReadingComprehensionActivities.length);
  };

  const removeActivity = (activityIndex) => {
    if (customReadingComprehensionActivities.length <= 1) return;
    setCustomReadingComprehensionActivities(prev => prev.filter((_, index) => index !== activityIndex));
    if (activeActivityIndex >= customReadingComprehensionActivities.length - 1) {
      setActiveActivityIndex(Math.max(0, activeActivityIndex - 1));
    }
  };

  // Story Page Management
  const generateUniquePageId = () => {
    return 'page_' + Math.random().toString(36).substring(2, 15) +
           Math.random().toString(36).substring(2, 15);
  };

  const addStoryPage = () => {
    const currentActivity = getCurrentActivity();
    const newPage = {
      id: generateUniquePageId(),
      pageNumber: (currentActivity.storyPages || []).length + 1,
      text: '',
      image: null
    };
    updateCurrentActivity({
      storyPages: [...(currentActivity.storyPages || []), newPage]
    });
  };

  const removeStoryPage = (pageId) => {
    const currentActivity = getCurrentActivity();
    updateCurrentActivity({
      storyPages: (currentActivity.storyPages || []).filter(page => page.id !== pageId)
    });
  };

  const updateStoryPage = (pageId, field, value) => {
    const currentActivity = getCurrentActivity();
    updateCurrentActivity({
      storyPages: (currentActivity.storyPages || []).map(page =>
        page.id === pageId ? { ...page, [field]: value } : page
      )
    });
  };

  // Story Page Image Upload
  const handleStoryPageImageUpload = async (e, pageId) => {
    const file = e.target.files[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      createModalToast('Please select a valid image file', 'error');
      return;
    }

    // Validate file size (5MB limit)
    if (file.size > 5 * 1024 * 1024) {
      createModalToast('Image file must be less than 5MB', 'error');
      return;
    }

    try {
      setUploading(true);

      // Create immediate local preview
      const localUrl = URL.createObjectURL(file);
      console.log(`[STORY PAGE] Created local preview URL: ${localUrl}`);
      
      // Update the UI immediately with the local preview
      updateStoryPage(pageId, 'image', localUrl);

      // Upload to S3 using the existing function
      console.log(`[STORY PAGE] Starting upload with targetFolder: reading_comprehension`);
      const imageUrl = await uploadImageToS3(file, 'reading_comprehension');

      if (imageUrl) {
        // Update the story page with the S3 URL, replacing the local URL
        updateStoryPage(pageId, 'image', imageUrl);
        console.log(`[STORY PAGE] ✅ Upload successful! Image URL: ${imageUrl}`);
      } else {
        throw new Error("Failed to upload image to S3");
      }
      
      // Clean up the local URL
      URL.revokeObjectURL(localUrl);

      createModalToast('Image uploaded successfully!', 'success');
    } catch (error) {
      console.error('Image upload error:', error);
      createModalToast('Failed to upload image. Please try again.', 'error');
      
      // Remove the local preview on error
      updateStoryPage(pageId, 'image', null);
    } finally {
      setUploading(false);
      // Clear the input
      if (storyPageImageRefs.current[pageId]) {
        storyPageImageRefs.current[pageId].value = '';
      }
    }
  };

  // Comprehension Questions Management
  const generateUniqueQuestionId = () => {
    return 'question_' + Math.random().toString(36).substring(2, 15) +
           Math.random().toString(36).substring(2, 15);
  };

  const addComprehensionQuestion = () => {
    const currentActivity = getCurrentActivity();
    const newQuestion = {
      id: generateUniqueQuestionId(),
      questionNumber: (currentActivity.questions || []).length + 1,
      questionText: '',
      correctAnswer: '',
      acceptableAnswers: []
    };
    updateCurrentActivity({
      questions: [...(currentActivity.questions || []), newQuestion]
    });
  };

  const removeComprehensionQuestion = (questionId) => {
    const currentActivity = getCurrentActivity();
    updateCurrentActivity({
      questions: (currentActivity.questions || []).filter(question => question.id !== questionId)
    });
  };

  const updateComprehensionQuestion = (questionId, field, value) => {
    const currentActivity = getCurrentActivity();
    updateCurrentActivity({
      questions: (currentActivity.questions || []).map(question =>
        question.id === questionId ? { ...question, [field]: value } : question
      )
    });
  };

  // Acceptable Answers Management
  const addAcceptableAnswer = (questionId) => {
    const currentActivity = getCurrentActivity();
    updateCurrentActivity({
      questions: (currentActivity.questions || []).map(question =>
        question.id === questionId
          ? { ...question, acceptableAnswers: [...(question.acceptableAnswers || []), ''] }
          : question
      )
    });
  };

  const removeAcceptableAnswer = (questionId, answerIndex) => {
    const currentActivity = getCurrentActivity();
    updateCurrentActivity({
      questions: (currentActivity.questions || []).map(question =>
        question.id === questionId
          ? {
              ...question,
              acceptableAnswers: (question.acceptableAnswers || []).filter((_, idx) => idx !== answerIndex)
            }
          : question
      )
    });
  };

  const updateAcceptableAnswer = (questionId, answerIndex, value) => {
    const currentActivity = getCurrentActivity();
    updateCurrentActivity({
      questions: (currentActivity.questions || []).map(question =>
        question.id === questionId
          ? {
              ...question,
              acceptableAnswers: (question.acceptableAnswers || []).map((answer, idx) =>
                idx === answerIndex ? value : answer
              )
            }
          : question
      )
    });
  };
 
  // ===== VALIDATION FUNCTIONS =====

  /**
   * Dynamic validation based on category requirements
   */
  const validateCategorySpecificRequirements = (normCategory, questionChoicePairs) => {
    const errors = {};

    switch (normCategory) {
      case 'alphabet_knowledge':
        // Alphabet Knowledge: 3 choices with 1 correct + question value + question text
        const invalidAlphabetPairs = questionChoicePairs.filter(pair => {
          if (!pair.choices || pair.choices.length !== 3) {
            return true; // Must have exactly 3 choices
          }
          const correctChoices = pair.choices.filter(choice => choice.isCorrect);
          return correctChoices.length !== 1; // Must have exactly 1 correct choice
        });

        if (invalidAlphabetPairs.length > 0) {
          const errorMessage = "All Alphabet Knowledge questions must have exactly 3 choices with one marked as correct";
          createModalToast(errorMessage, 'error');
          errors.pairs = errorMessage; // Keep for backward compatibility if needed
        }

        // Validate Question Value is required
        const missingQuestionValue = questionChoicePairs.filter(pair =>
          !pair.sourceTemplateId && (!pair.questionValue || pair.questionValue.trim() === '')
        );

        if (missingQuestionValue.length > 0) {
          const errorMessage = "Question Value is required for all Alphabet Knowledge questions";
          createModalToast(errorMessage, 'error');
          errors.questionValue = errorMessage; // Keep for backward compatibility if needed
        }

        // Validate Question Text is required
        const missingAlphabetQuestionText = questionChoicePairs.filter(pair =>
          !pair.sourceTemplateId && (!pair.questionText || pair.questionText.trim() === '')
        );

        if (missingAlphabetQuestionText.length > 0) {
          const errorMessage = "Question Text is required for all Alphabet Knowledge questions";
          createModalToast(errorMessage, 'error');
          errors.questionText = errorMessage; // Keep for backward compatibility if needed
        }
        break;

      case 'phonological_awareness':
        // Phonological Awareness: audio-visual matching (audioTexts)
        const missingAudioTexts = questionChoicePairs.filter(pair => {
          const audioTexts = pair.audioTexts || [];
          const hasValidAudio = audioTexts.some(text => text && text.trim());
          return !hasValidAudio;
        });

        if (missingAudioTexts.length > 0) {
          const errorMessage = "All Phonological Awareness questions must have at least one audio text";
          createModalToast(errorMessage, 'error');
          errors.pairs = errorMessage; // Keep for backward compatibility if needed
        }

        // Validate Question Text is required
        const missingPAQuestionText = questionChoicePairs.filter(pair =>
          !pair.sourceTemplateId && (!pair.questionText || pair.questionText.trim() === '')
        );

        if (missingPAQuestionText.length > 0) {
          const errorMessage = "Question Text is required for all Phonological Awareness questions";
          createModalToast(errorMessage, 'error');
          errors.questionText = errorMessage; // Keep for backward compatibility if needed
        }
        break;

      case 'decoding':
        // Decoding: depends on question type (drag_drop, fill_blank, etc.)
        const invalidDecodingPairs = questionChoicePairs.filter(pair => {
          // Check if it has either dragElements or choiceIds
          const hasDragElements = pair.dragElements && pair.dragElements.length > 0;
          const hasChoices = safe(pair.choiceIds).length >= 2 && pair.correctChoiceId;
          return !hasDragElements && !hasChoices;
        });

        if (invalidDecodingPairs.length > 0) {
          const errorMessage = "All Decoding questions must have either drag elements or at least 2 choices with one marked as correct";
          createModalToast(errorMessage, 'error');
          errors.pairs = errorMessage; // Keep for backward compatibility if needed
        }
        break;

      case 'word_recognition':
        // Word Recognition: validate displayWord, blankOptions, correctAnswer structure
        const invalidWordRecognitionPairs = questionChoicePairs.filter(pair => {
          // Must have displayWord
          if (!pair.displayWord || pair.displayWord.trim() === '') {
            return true;
          }

          // Must have blankOptions array with at least 2 options
          if (!pair.blankOptions || !Array.isArray(pair.blankOptions) ||
              pair.blankOptions.filter(opt => opt && opt.trim() !== '').length < 2) {
            return true;
          }

          // Must have at least one correct answer
          if (!pair.correctAnswer || !Array.isArray(pair.correctAnswer) ||
              pair.correctAnswer.length === 0) {
            return true;
          }

          // Word Recognition validation is complete - no additional fields needed

          return false;
        });

        if (invalidWordRecognitionPairs.length > 0) {
          const firstInvalid = invalidWordRecognitionPairs[0];
          let errorMessage = "";
          if (!firstInvalid.displayWord || firstInvalid.displayWord.trim() === '') {
            errorMessage = "All Word Recognition questions must have a sentence or display word";
          } else if (!firstInvalid.blankOptions || firstInvalid.blankOptions.filter(opt => opt && opt.trim() !== '').length < 2) {
            errorMessage = "All Word Recognition questions must have at least 2 answer options";
          } else if (!firstInvalid.correctAnswer || firstInvalid.correctAnswer.length === 0) {
            errorMessage = "All Word Recognition questions must have at least one correct answer selected";
          } else if (firstInvalid.questionSubType === 'sentence_completion' && (firstInvalid.blankPosition === null || firstInvalid.blankPosition === undefined)) {
            errorMessage = "All sentence completion questions must have a blank position selected (click on a word)";
          } else {
            errorMessage = "All Word Recognition questions must be properly configured";
          }
          
          // Show modal toast notification instead of banner error
          createModalToast(errorMessage, 'error');
          errors.pairs = errorMessage; // Keep for backward compatibility if needed
        }
        break;

      case 'reading_comprehension':
        // Reading Comprehension: handled separately (sentence-based)
        // No validation needed here as it uses sentence templates
        break;

      default:
        // Default validation for unknown categories
        const invalidDefaultPairs = questionChoicePairs.filter(pair =>
          safe(pair.choiceIds).length !== 2 || !pair.correctChoiceId
        );

        if (invalidDefaultPairs.length > 0) {
          const errorMessage = `All ${category} questions must have exactly 2 choices with one marked as correct`;
          createModalToast(errorMessage, 'error');
          errors.pairs = errorMessage; // Keep for backward compatibility if needed
        }
        break;
    }

    return errors;
  };

  const validateCurrentStep = () => {
    const newErrors = {};
    
    if (currentStep === 1) {
      if (!title.trim()) {
        newErrors.title = "Title is required";
      }
      if (!description.trim()) {
        newErrors.description = "Description is required";
      }
    }
    else if (currentStep === 2) {
      if (contentType === 'sentence') {
        if (selectedSentenceTemplate) {
          // Using template - basic validation
          if (!selectedSentenceTemplate) {
            newErrors.sentenceTemplate = "A reading passage must be selected";
          }
        } else {
          // Custom content validation - validate multiple activities
          if (!customReadingComprehensionActivities || customReadingComprehensionActivities.length === 0) {
            newErrors.activities = "At least one Reading Comprehension activity is required";
          } else {
            // Validate each activity
            let hasInvalidActivities = false;
            customReadingComprehensionActivities.forEach((activity, activityIndex) => {
              const activityPrefix = `activity_${activityIndex}`;

              // Validate story title
              if (!activity.storyTitle || !activity.storyTitle.trim()) {
                newErrors[`${activityPrefix}_storyTitle`] = `Activity ${activityIndex + 1} story title is required`;
                hasInvalidActivities = true;
              }

              // Validate story pages
              if (!activity.storyPages || activity.storyPages.length === 0) {
                newErrors[`${activityPrefix}_storyPages`] = `Activity ${activityIndex + 1} must have at least one story page`;
                hasInvalidActivities = true;
              } else {
                // Validate each story page
                activity.storyPages.forEach((page, pageIndex) => {
                  if (!page.text || !page.text.trim()) {
                    newErrors[`${activityPrefix}_page_${page.id}`] = `Activity ${activityIndex + 1}, Page ${pageIndex + 1} text is required`;
                    hasInvalidActivities = true;
                  }
                });
              }

              // Validate comprehension questions
              if (!activity.questions || activity.questions.length === 0) {
                newErrors[`${activityPrefix}_questions`] = `Activity ${activityIndex + 1} must have at least one comprehension question`;
                hasInvalidActivities = true;
              } else {
                // Validate each question
                activity.questions.forEach((question, questionIndex) => {
                  if (!question.questionText || !question.questionText.trim()) {
                    newErrors[`${activityPrefix}_question_${question.id}_text`] = `Activity ${activityIndex + 1}, Question ${questionIndex + 1} text is required`;
                    hasInvalidActivities = true;
                  }
                  if (!question.correctAnswer || !question.correctAnswer.trim()) {
                    newErrors[`${activityPrefix}_question_${question.id}_answer`] = `Activity ${activityIndex + 1}, Question ${questionIndex + 1} correct answer is required`;
                    hasInvalidActivities = true;
                  }
                });
              }
            });

            if (hasInvalidActivities) {
              newErrors.activities = "All Reading Comprehension activities must be complete with title, pages, and questions";
            }
          }
        }
      } else {
        if (safe(questionChoicePairs).length === 0) {
          newErrors.pairs = "At least one question must be added";
        }

        // Dynamic category-specific validation
        const normCategory = normalizeCategory(category);
        const categoryValidationErrors = validateCategorySpecificRequirements(normCategory, questionChoicePairs);
        Object.assign(newErrors, categoryValidationErrors);
        
        // Remove validation that prevents both value and image
        // const invalidValueImagePairs = questionChoicePairs.filter(pair => 
        //   pair.questionValue && pair.questionValue.trim() !== '' && pair.questionImage
        // );
        
        // if (invalidValueImagePairs.length > 0) {
        //   newErrors.pairs = "Questions can have either a Question Value OR a Question Image, not both";
        // }
      }
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };
 
  const validateAllSteps = () => {
    const allErrors = {};
    
    // Basic info validation
    if (!title.trim()) {
      allErrors.title = "Title is required";
    }
    if (!description.trim()) {
      allErrors.description = "Description is required";
    }
    
    // Template validation - check for either template OR custom content per activity
    if (contentType === 'sentence') {
      const hasValidActivities = customReadingComprehensionActivities.length > 0 &&
        customReadingComprehensionActivities.some(activity => {
          // Check if activity has a template selected
          const hasTemplate = activity.selectedTemplate && activity.selectedTemplate !== null;
          
          // Check if activity has custom content
          const hasCustomContent = activity.storyTitle && activity.storyTitle.trim() &&
          activity.storyPages && activity.storyPages.length > 0 &&
            activity.questions && activity.questions.length > 0;
          
          return hasTemplate || hasCustomContent;
        });
      
      if (!hasValidActivities) {
        allErrors.sentenceTemplate = "Each activity must have either a template selected or custom content created";
      }
    }
    
    // Questions validation
    if (contentType !== 'sentence') {
      if (safe(questionChoicePairs).length === 0) {
        allErrors.pairs = "At least one question must be added";
      }

      // Dynamic category-specific validation
      const normCategory = normalizeCategory(category);
      const categoryValidationErrors = validateCategorySpecificRequirements(normCategory, questionChoicePairs);
      Object.assign(allErrors, categoryValidationErrors);
      
      // Remove validation that prevents both value and image
      // const invalidValueImagePairs = questionChoicePairs.filter(pair => 
      //   pair.questionValue && pair.questionValue.trim() !== '' && pair.questionImage
      // );
      
      // if (invalidValueImagePairs.length > 0) {
      //   allErrors.pairs = "Questions can have either a Question Value OR a Question Image, not both";
      // }
      
      // Description field is optional - no need to show warnings for missing descriptions
  // We'll use default descriptions in the backend if needed
    }
    
    setErrors(allErrors);
    return Object.keys(allErrors).length === 0;
  };
 
  /**
   * Validate new template creation
   */
  const validateNewTemplate = () => {
    const newErrors = {};
    
    if (!newTemplateData.templateText.trim()) {
      newErrors.newTemplate = "Template text is required";
    }
    
    if (!newTemplateData.questionType) {
      newErrors.newTemplate = "Question type is required";
    } else {
      // Verify the question type is valid for this category
      const validQuestionTypes = getApplicableQuestionTypes(category);
      if (!validQuestionTypes.includes(newTemplateData.questionType)) {
        newErrors.newTemplate = `The question type '${formatQuestionType(newTemplateData.questionType)}' is not valid for ${formatCategoryName(category)}`;
      }
    }
    
    // Only validate choice types if not a sentence question (reading comprehension)
    if (newTemplateData.questionType !== 'sentence') {
      if (newTemplateData.applicableChoiceTypes.length === 0) {
        newErrors.newTemplate = "At least one applicable choice type is required";
      } else {
        // Verify all selected choice types are valid for this question type
        const validChoiceTypes = getApplicableChoiceTypes(newTemplateData.questionType);
        const invalidChoiceTypes = newTemplateData.applicableChoiceTypes.filter(
          type => !validChoiceTypes.includes(type)
        );
        
        if (invalidChoiceTypes.length > 0) {
          newErrors.newTemplate = `The following choice types are not valid for ${formatQuestionType(newTemplateData.questionType)}: ${invalidChoiceTypes.map(formatChoiceType).join(', ')}`;
        }
      }
    } else if (category === 'reading_comprehension' && newTemplateData.applicableChoiceTypes.length > 0) {
      // Reading comprehension shouldn't have manual choice types
      newErrors.newTemplate = "Reading Comprehension templates cannot have custom choice types";
    }
    
    setErrors(prev => ({ ...prev, ...newErrors }));
    return Object.keys(newErrors).length === 0;
  };
 
  /** find choice object whose value matches the provided text */
  const findChoiceValue = (val) =>
    choiceTemplates.find(c =>
      (c.choiceValue || '').toLowerCase() === val.toLowerCase() || 
      (c.soundText || '').toLowerCase() === val.toLowerCase()
    );
  
  /**
   * Validate new choice creation
   */
  const validateNewChoice = () => {
    const newErrors = {};
    
    if (!newChoiceData.choiceType) {
      newErrors.newChoice = "Choice type is required";
    } else {
      // Check if this choice type is valid for the current category
      const validQuestionTypes = getApplicableQuestionTypes(category);
      let isValidChoiceType = false;
      
      // Check if this choice type is valid for any question type in this category
      for (const questionType of validQuestionTypes) {
        const validChoiceTypes = getApplicableChoiceTypes(questionType);
        if (validChoiceTypes.includes(newChoiceData.choiceType)) {
          isValidChoiceType = true;
          break;
        }
      }
      
      if (!isValidChoiceType) {
        newErrors.newChoice = `The choice type '${formatChoiceType(newChoiceData.choiceType)}' is not valid for ${formatCategoryName(category)}`;
      }
    }
    
    // Check for required values based on the choice type
    if (newChoiceData.choiceType) {
      if (newChoiceData.choiceType.includes('Sound')) {
        // Sound choices must have soundText
        if (!newChoiceData.soundText || newChoiceData.soundText.trim() === '') {
          newErrors.newChoice = "Sound text is required for sound-based choices";
        }
      } else if ((!newChoiceData.choiceValue || newChoiceData.choiceValue.trim() === '') && 
                (!newChoiceData.soundText || newChoiceData.soundText.trim() === '')) {
        newErrors.newChoice = "Choice value or sound text is required";
      }
    }
    
    setErrors(prev => ({ ...prev, ...newErrors }));
    return Object.keys(newErrors).length === 0;
  };
 
  // ===== RENDER HELPER FUNCTIONS =====
 
  const renderStepContent = () => {
    switch (currentStep) {
      case 1:
        return renderBasicInfoStep();
      case 2:
        if (contentType === 'sentence') {
          return renderSentenceSelectionStep();
        } else if (category === 'Alphabet Knowledge') {
          return renderAlphabetKnowledgeStep();
        } else if (category === 'Phonological Awareness') {
          return renderPhonologicalAwarenessStep();
        } else if (category === 'Decoding') {
          return renderDecodingStep();
        } else if (category === 'Word Recognition') {
          return renderWordRecognitionStep();
        } else {
          return renderQuestionChoicesStepWithTemplates();
        }
      case 3:
        return renderReviewStep();
      default:
        return renderBasicInfoStep();
    }
  };
 
  /**
   * Step 1: Basic Information
   */
  const renderBasicInfoStep = () => {
    return (
      <div className="literexia-form-section">
              <h3>Activity Information</h3>
              
        {existingIntervention && (
          <div className="literexia-warning-banner">
            <FaExclamationTriangle />
            <div>
              <p><strong>Warning:</strong> An intervention for this student and category already exists:</p>
              <p>{existingIntervention.name}</p>
              <p>Creating a new intervention will replace the existing one.</p>
            </div>
          </div>
        )}
        
        <div className="literexia-form-group">
                <label htmlFor="title">
            Activity Title <span className="literexia-required">*</span>
                </label>
                <input
                  type="text"
                  id="title"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
            className={errors.title ? 'literexia-error' : ''}
                  placeholder="Enter a title for this activity"
                />
          {errors.title && <div className="literexia-error-message">{errors.title}</div>}
              </div>
              
        <div className="literexia-form-group">
                <label htmlFor="description">
            Activity Description <span className="literexia-required">*</span>
                </label>
                <textarea
                  id="description"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows="3"
                  placeholder="Provide a brief description of the learning objectives for this activity"
            className={errors.description ? 'literexia-error' : ''}
                ></textarea>
          {errors.description && <div className="literexia-error-message">{errors.description}</div>}
              </div>
              
        <div className="literexia-form-group">
          <label htmlFor="category">Category</label>
          <input
            type="text"
                  id="category"
            value={formatCategoryName(category)}
            disabled
            className="literexia-field-disabled"
          />
          <div className="literexia-help-text">
            This intervention targets the category that needs improvement (score &lt; 75%)
          </div>
              </div>
              
        <div className="literexia-form-group">
                <label htmlFor="readingLevel">Reading Level</label>
          <input
            type="text"
                  id="readingLevel"
                  value={readingLevel}
            disabled
            className="literexia-field-disabled"
          />
          <div className="literexia-help-text">
            Interventions use the student's current reading level
          </div>
              </div>
              
        <div className="literexia-content-type-info">
                <h4>Content Type: {getCategoryDisplayName(category)}</h4>
          <div className="literexia-content-type-description">
            <p>{getCategoryDescription(category)}</p>
          </div>
        </div>
      </div>
    );
  };
 
  /**
   * Step 2: Template Selection
   */
  const renderTemplateSelectionStep = () => {
    if (contentType === 'sentence') {
      return renderSentenceTemplateSelection();
    }

    return (
      <div className="literexia-form-section">
        {/* Available Question Templates */}
        <div className="literexia-template-selection">
          <div className="literexia-template-header">
            <h3>Question Templates</h3>
            {isInlineCreationAllowed() && (
              <button 
                type="button"
                className="literexia-create-template-btn"
                onClick={() => setShowNewTemplateForm(!showNewTemplateForm)}
              >
                <FaPlus /> Create New Template
              </button>
            )}
          </div>
          
          {/* Inline New Template Form */}
          {isInlineCreationAllowed() && showNewTemplateForm && (
            <div className="literexia-inline-form">
              <h4>Create New Question Template</h4>
              <div className="literexia-form-group">
                <label>Template Text</label>
                <input
                  type="text"
                  value={newTemplateData.templateText}
                  onChange={(e) => setNewTemplateData(prev => ({
                    ...prev, templateText: e.target.value
                  }))}
                  placeholder="Enter question template (e.g., 'Anong tunog ng letra?')"
                />
              </div>
              
              <div className="literexia-form-group">
                <label>Question Type</label>
                <select
                  value={newTemplateData.questionType || (category === 'alphabet_knowledge' ? 'patinig' : 
                                                         category === 'phonological_awareness' ? 'malapantig' : 
                                                         category === 'word_recognition' || category === 'decoding' ? 'word' : '')}
                  onChange={(e) => setNewTemplateData(prev => ({
                    ...prev, questionType: e.target.value,
                    applicableChoiceTypes: [] // Reset applicable choice types when question type changes
                  }))}
                >
                  <option value="">Select Type</option>
                  {getApplicableQuestionTypes(category).map(type => (
                    <option key={type} value={type}>
                      {formatQuestionType(type)}
                    </option>
                  ))}
                </select>
              </div>
              
              {newTemplateData.questionType && (
                <div className="literexia-form-group">
                  <label>Applicable Choice Types</label>
                  
                  {newTemplateData.questionType === 'sentence' ? (
                    <div className="literexia-info-banner">
                      <FaInfoCircle />
                      <p>Reading Comprehension templates do not use manual choice types. 
                      Questions and answers are defined in sentence templates.</p>
                    </div>
                  ) : (
                    <>
                      <div className="literexia-help-text">
                        Select which choice types can be used with this question template.
                      </div>
                      <div className="literexia-checkbox-group">
                        {getApplicableChoiceTypes(newTemplateData.questionType).map(choiceType => (
                          <label key={choiceType} className="literexia-checkbox-label">
                            <input
                              type="checkbox"
                              checked={newTemplateData.applicableChoiceTypes.includes(choiceType)}
                              onChange={(e) => {
                                const checked = e.target.checked;
                                setNewTemplateData(prev => ({
                                  ...prev,
                                  applicableChoiceTypes: checked
                                    ? [...prev.applicableChoiceTypes, choiceType]
                                    : prev.applicableChoiceTypes.filter(t => t !== choiceType)
                                }));
                              }}
                            />
                            {formatChoiceType(choiceType)}
                          </label>
                        ))}
                      </div>
                      
                      {getApplicableChoiceTypes(newTemplateData.questionType).length === 0 && (
                        <div className="literexia-error-message">
                          No applicable choice types available for this question type.
                        </div>
                      )}
                    </>
                  )}
                </div>
              )}
              
              {errors.newTemplate && (
                <div className="literexia-error-message">{errors.newTemplate}</div>
              )}
              
              <div className="literexia-inline-form-actions">
                <button 
                  type="button" 
                  onClick={() => setShowNewTemplateForm(false)}
                  className="literexia-cancel-btn"
                >
                  Cancel
                </button>
                <button 
                  type="button" 
                  onClick={handleCreateNewTemplate}
                  className="literexia-save-btn"
                  disabled={submitting}
                >
                  {submitting ? <FaSpinner className="fa-spin" /> : 'Create Template'}
                </button>
                </div>
              </div>
          )}
          
          {/* Template List */}
          <div className="literexia-question-templates-list">
            {safe(questionTemplates).length > 0 ? (
              safe(questionTemplates).map(template => (
                <div 
                  key={template._id}
                  className="literexia-question-template-item"
                >
                  <div className="literexia-question-template-header">
                    <h4>{template.templateText}</h4>
                    <div className="literexia-question-template-type">
                      {template.questionType}
                </div>
              </div>
                  
                  <div className="literexia-question-template-details">
                    <div className="literexia-template-detail">
                      <strong>Category:</strong> {formatCategoryName(template.category)}
                    </div>
                    <div className="literexia-template-detail">
                      <strong>Applicable Choices:</strong> {
                        safe(template.applicableChoiceTypes).map(formatChoiceType).join(', ')
                      }
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="literexia-empty-state">
                <FaExclamationTriangle className="literexia-empty-icon" />
                <h3>No Question Templates Available</h3>
                <p>No templates were found for this category. Create a new template above.</p>
            </div>
          )}
          </div>
        </div>
      </div>
    );
  };
 
  /**
   * Sentence Template Selection (for Reading Comprehension) - Fixed Structure
   */
  const renderSentenceTemplateSelection = () => {
    const currentActivity = customReadingComprehensionActivities[activeActivityIndex] || {};

    return (
      <div className="reading-comprehension-container">
        <div className="rc-section">
          <h3>📚Reading Comprehension</h3>
          
          {/* Activity Tabs */}
          <div className="rc-activities-nav">
            <div className="rc-activities-nav-header">
              <h4>Activities</h4>
              <button
                type="button"
                onClick={addNewActivity}
                className="rc-btn rc-btn-primary"
                style={{ display: 'flex', alignItems: 'center', gap: '8px' }}
              >
                <FaPlus /> Add Activity
              </button>
          </div>

            <div className="rc-activities-tabs">
              {customReadingComprehensionActivities.map((activity, index) => (
                <div
                  key={activity.id || index}
                  className={`rc-activity-tab ${index === activeActivityIndex ? 'active' : ''}`}
                  onClick={() => setActiveActivityIndex(index)}
                >
                  <span>Activity {index + 1}</span>
                  {customReadingComprehensionActivities.length > 1 && (
              <button
                type="button"
                      className="rc-activity-tab-remove"
                      onClick={(e) => {
                        e.stopPropagation();
                        removeActivity(index);
                      }}
                      title="Remove this activity"
                    >
                      ✕
              </button>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Single Activity Content Area */}
          <div className="rc-activity-content">
            <div className="rc-activity-header">
              <h4>Activity {activeActivityIndex + 1}</h4>
              <div className="rc-activity-badge">
                {safe(currentActivity.storyPages || []).length} passages • {safe(currentActivity.questions || []).length} questions
              </div>
            </div>

            {/* Story Template Dropdown - Inside the content area */}
            <div className="rc-form-group" style={{ marginBottom: '20px' }}>
              <label>Story Template</label>
              <select
                value={currentActivity.selectedTemplate?._id || ''}
                onChange={(e) => {
                  const template = e.target.value === '' ? null : sentenceTemplates.find(t => t._id === e.target.value);
                  updateCurrentActivity({ selectedTemplate: template });
                  
                  // If template is selected, populate the activity with template data
                  if (template) {
                    updateCurrentActivity({
                      storyTitle: template.title,
                      storyPages: template.sentenceText.map((page, index) => ({
                        id: `page_${Date.now()}_${index}`,
                        text: page.text,
                        image: page.image || null
                      })),
                      questions: template.sentenceQuestions.map((q, index) => ({
                        id: `question_${Date.now()}_${index}`,
                        questionText: q.questionText,
                        correctAnswer: q.sentenceCorrectAnswer,
                        acceptableAnswers: q.acceptableAnswers || []
                      }))
                    });
                  }
                }}
                className="rc-select"
              >
                <option value="">-- Create Custom Story --</option>
                {safe(sentenceTemplates).map(template => (
                  <option key={template._id} value={template._id}>
                    {template.title} ({template.readingLevel})
                  </option>
                ))}
              </select>
              <div style={{ fontSize: '12px', color: '#6b7280', marginTop: '4px' }}>
                Select a template to auto-populate all fields, or create your own custom story.
              </div>
            </div>

            {/* Show the custom form (will be populated if template is selected) */}
            {renderCustomReadingComprehensionForm()}
          </div>
        </div>
      </div>
    );
  };

  /**
   * Enhanced Template Selection for Multiple Templates
   */
  // Removed complex template selection - now using simple dropdown
  const renderEnhancedTemplateSelection = () => {
    return (
          <div className="rc-section">
        {/* Selected Templates Summary */}
        {selectedSentenceTemplates.length > 0 && (
          <div className="rc-section">
            <div className="rc-success-message" style={{ marginBottom: '16px' }}>
              <FaCheckCircle className="rc-success-icon" />
              <span>
                ✅ You've selected <strong>{selectedSentenceTemplates.length}</strong> story template{selectedSentenceTemplates.length > 1 ? 's' : ''}
              </span>
            </div>

            {/* Selected Templates Preview */}
            <div className="rc-activities-nav" style={{ marginBottom: '24px' }}>
              <div className="rc-activities-nav-header">
                <h4>📚 Selected Stories</h4>
              <button
                type="button"
                  className="rc-btn rc-btn-danger"
                  onClick={clearAllTemplates}
                  style={{ fontSize: '12px', padding: '6px 12px' }}
                >
                  🗑️ Clear All
              </button>
              </div>
              <div className="rc-activities-tabs">
                {selectedSentenceTemplates.map((template, index) => (
                  <div key={template._id} className="rc-activity-tab active">
                    <span>📖 {template.title}</span>
              <button
                type="button"
                      className="rc-activity-tab-remove"
                      onClick={() => removeSelectedTemplate(template._id)}
                      title="Remove this template"
                    >
                      ✕
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Available Templates */}
        <h4>📋 Available Story Templates</h4>
        <p style={{ color: '#6b7280', fontSize: '14px', marginBottom: '16px' }}>
          💡 <strong>Tip:</strong> Click on any story to add it to your selection. You can select multiple stories!
          Click again to remove a story from your selection.
        </p>

        {safe(sentenceTemplates).length > 0 ? (
          <div className="rc-templates-grid">
            {safe(sentenceTemplates).map(template => {
              const isSelected = isTemplateSelected(template._id);
              return (
                <div
                  key={template._id}
                  className={`rc-template-card ${isSelected ? 'selected' : ''}`}
                  onClick={() => handleSelectSentenceTemplate(template)}
                style={{
                    position: 'relative',
                    cursor: 'pointer',
                    transition: 'all 0.2s ease'
                  }}
                >
                  {/* Selection Indicator */}
                  {isSelected && (
                    <div style={{
                      position: 'absolute',
                      top: '12px',
                      right: '12px',
                      background: '#22c55e',
                      color: 'white',
                      borderRadius: '50%',
                      width: '24px',
                      height: '24px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '12px',
                      fontWeight: 'bold',
                      zIndex: 1
                    }}>
                      ✓
                    </div>
                  )}

                  {/* Template Header */}
                  <div className="rc-template-header">
                    <div>
                      <div className="rc-template-badge">{template.readingLevel}</div>
                      <h4 className="rc-template-title">📖 {template.title}</h4>
            </div>
          </div>

                  {/* Template Preview */}
                  <div className="rc-template-preview">
                    {template.sentenceText?.[0]?.image && (
                      <div style={{ marginBottom: '12px', textAlign: 'center' }}>
                        <img
                          src={template.sentenceText[0].image}
                          alt="Story preview"
                          style={{
                            width: '100%',
                            maxWidth: '200px',
                            height: '100px',
                            objectFit: 'cover',
                            borderRadius: '6px',
                            border: '1px solid #e5e7eb'
                          }}
                        />
                      </div>
                    )}

                    <div style={{
                      fontSize: '13px',
                      color: '#6b7280',
                      lineHeight: '1.4',
                      marginBottom: '12px'
                    }}>
                      {template.sentenceText?.[0]?.text?.length > 100
                        ? template.sentenceText[0].text.substring(0, 100) + '...'
                        : template.sentenceText?.[0]?.text || 'No preview available'}
                    </div>
                  </div>

                  {/* Template Meta Information */}
                  <div className="rc-template-meta">
                    <span>📄 {template.sentenceText?.length || 0} pages</span>
                    <span>❓ {template.sentenceQuestions?.length || 0} questions</span>
                  </div>

                  {/* Selection Status */}
                  <div style={{
                    marginTop: '12px',
                    padding: '8px',
                    background: isSelected ? '#f0fdf4' : '#f9fafb',
                    borderRadius: '6px',
                    border: `1px solid ${isSelected ? '#bbf7d0' : '#e5e7eb'}`,
                    textAlign: 'center',
                    fontSize: '12px',
                    fontWeight: '500',
                    color: isSelected ? '#16a34a' : '#6b7280'
                  }}>
                    {isSelected ? (
                      <>✅ Selected - Click to remove</>
                    ) : (
                      <>📌 Click to select this story</>
          )}
        </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="rc-section .empty-state">
            <FaExclamationTriangle style={{ fontSize: '48px', color: '#9ca3af', marginBottom: '16px' }} />
            <h3>No Templates Available</h3>
            <p>No reading comprehension templates were found for this reading level.</p>
            <p style={{ marginTop: '16px', fontSize: '14px', color: '#6b7280' }}>
              💡 Don't worry! You can still create your own content using the "Create My Own Story" option.
            </p>
          </div>
        )}

        {/* Selection Summary */}
        {selectedSentenceTemplates.length === 0 && safe(sentenceTemplates).length > 0 && (
          <div className="reading-comprehension-info-banner" style={{ marginTop: '24px' }}>
            <FaInfoCircle className="info-icon" />
            <p>
              🎯 <strong>How to select:</strong> Click on any story template above to add it to your activity.
              You can select multiple stories to give students more reading variety!
            </p>
          </div>
        )}
      </div>
    );
  };

  /**
   * Template Selection Interface
   */
  const renderTemplateSelection = () => {
    return (
      <div className="rc-section">
        <h4>Available Templates</h4>

        <div className="rc-templates-grid">
          {safe(sentenceTemplates).length > 0 ? (
            safe(sentenceTemplates).map(template => (
              <div
                key={template._id}
                className={`rc-template-card ${
                  selectedSentenceTemplate?._id === template._id ? 'selected' : ''
                }`}
                onClick={() => handleSelectSentenceTemplate(template)}
                style={{
                  border: selectedSentenceTemplate?._id === template._id ? '2px solid #22c55e' : '1px solid #e5e7eb',
                  borderRadius: '12px',
                  padding: '16px',
                  cursor: 'pointer',
                  background: selectedSentenceTemplate?._id === template._id ? '#f0fdf4' : 'white'
                }}
              >
                <div style={{ marginBottom: '12px' }}>
                  <h4 style={{
                    margin: '0 0 8px 0',
                    color: '#1f2937',
                    fontSize: '16px',
                    fontWeight: '600'
                  }}>
                    {template.title}
                  </h4>
                  <div style={{
                    display: 'inline-block',
                    padding: '4px 8px',
                    background: '#dbeafe',
                    color: '#1e40af',
                    borderRadius: '4px',
                    fontSize: '12px',
                    fontWeight: '500'
                  }}>
                    {template.readingLevel}
                  </div>
                </div>

                <div className="rc-template-preview">
                  {template.sentenceText?.[0]?.image && (
                    <div style={{ marginBottom: '8px' }}>
                      <img
                        src={template.sentenceText[0].image}
                        alt="Passage preview"
                        style={{
                          width: '100%',
                          height: '120px',
                          objectFit: 'cover',
                          borderRadius: '8px'
                        }}
                      />
                    </div>
                  )}

                  <p style={{
                    margin: '0 0 8px 0',
                    fontSize: '14px',
                    color: '#4b5563',
                    lineHeight: '1.4'
                  }}>
                    {template.sentenceText?.[0]?.text?.length > 80
                      ? template.sentenceText[0].text.substring(0, 80) + '...'
                      : template.sentenceText?.[0]?.text || 'No preview available'}
                  </p>

                  <div style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    fontSize: '12px',
                    color: '#6b7280',
                    fontWeight: '500'
                  }}>
                    <span>{template.sentenceText?.length || 0} page{(template.sentenceText?.length || 0) !== 1 ? 's' : ''}</span>
                    <span>{template.sentenceQuestions?.length || 0} question{(template.sentenceQuestions?.length || 0) !== 1 ? 's' : ''}</span>
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div className="empty-state">
              <FaExclamationTriangle style={{ fontSize: '48px', color: '#9ca3af', marginBottom: '16px' }} />
              <h3>No Templates Available</h3>
              <p>No reading comprehension templates were found for this reading level.</p>
            </div>
          )}
        </div>
      </div>
    );
  };

  /**
   * Selected Template Preview with Option to Add Custom Content
   */
  const renderSelectedTemplatePreview = () => {
    if (!selectedSentenceTemplate) {
      return null;
    }

    return (
      <div className="rc-section">
        {/* Template Preview Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px' }}>
          <h4>Selected Template: {selectedSentenceTemplate.title}</h4>
          <div style={{ display: 'flex', gap: '8px' }}>
            <button
              type="button"
              onClick={() => setSelectedSentenceTemplate('template_mode')}
              style={{
                padding: '8px 16px',
                border: '1px solid #d1d5db',
                borderRadius: '6px',
                background: 'white',
                color: '#374151',
                fontSize: '14px',
                cursor: 'pointer'
              }}
            >
              Change Template
            </button>
            <button
              type="button"
              onClick={() => setSelectedSentenceTemplate(null)}
              style={{
                padding: '8px 16px',
                border: '1px solid #d1d5db',
                borderRadius: '6px',
                background: 'white',
                color: '#374151',
                fontSize: '14px',
                cursor: 'pointer'
              }}
            >
              Use Custom Content
            </button>
          </div>
          </div>
          
        {/* Template Details */}
        <div style={{
          background: '#f8fafc',
          border: '1px solid #e2e8f0',
          borderRadius: '8px',
          padding: '16px',
          marginBottom: '20px'
        }}>
          <div style={{ marginBottom: '12px' }}>
            <div style={{
              display: 'inline-block',
              padding: '4px 8px',
              background: '#dbeafe',
              color: '#1e40af',
              borderRadius: '4px',
              fontSize: '12px',
              fontWeight: '500',
              marginBottom: '8px'
            }}>
              {selectedSentenceTemplate.readingLevel}
            </div>
          </div>

          {/* Preview Image */}
          {selectedSentenceTemplate.sentenceText?.[0]?.image && (
            <div style={{ marginBottom: '12px' }}>
              <img
                src={selectedSentenceTemplate.sentenceText[0].image}
                alt="Template preview"
                style={{
                  width: '100%',
                  maxWidth: '400px',
                  height: '200px',
                  objectFit: 'cover',
                  borderRadius: '6px'
                }}
              />
            </div>
          )}

          {/* Text Preview */}
          <div style={{ marginBottom: '12px' }}>
            <strong style={{ color: '#1f2937', fontSize: '14px' }}>Story Text:</strong>
            <p style={{
              margin: '4px 0 0 0',
              fontSize: '14px',
              color: '#4b5563',
              lineHeight: '1.5'
            }}>
              {selectedSentenceTemplate.sentenceText?.[0]?.text || 'No preview available'}
            </p>
          </div>

          {/* Questions Preview */}
          <div>
            <strong style={{ color: '#1f2937', fontSize: '14px' }}>Questions:</strong>
            {selectedSentenceTemplate.sentenceQuestions?.map((question, index) => (
              <div key={index} style={{
                margin: '8px 0',
                padding: '8px',
                background: 'white',
                borderRadius: '4px',
                border: '1px solid #e5e7eb'
              }}>
                <p style={{
                  margin: '0 0 4px 0',
                  fontSize: '14px',
                  color: '#1f2937',
                  fontWeight: '500'
                }}>
                  Q{question.questionNumber}: {question.questionText}
                </p>
                <p style={{
                  margin: '0',
                  fontSize: '13px',
                  color: '#059669',
                  fontStyle: 'italic'
                }}>
                  Answer: {question.sentenceCorrectAnswer}
                </p>
              </div>
            ))}
          </div>

          {/* Template Stats */}
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            marginTop: '12px',
            paddingTop: '12px',
            borderTop: '1px solid #e5e7eb',
            fontSize: '12px',
            color: '#6b7280',
            fontWeight: '500'
          }}>
            <span>{selectedSentenceTemplate.sentenceText?.length || 0} page{(selectedSentenceTemplate.sentenceText?.length || 0) !== 1 ? 's' : ''}</span>
            <span>{selectedSentenceTemplate.sentenceQuestions?.length || 0} question{(selectedSentenceTemplate.sentenceQuestions?.length || 0) !== 1 ? 's' : ''}</span>
          </div>
        </div>

        {/* Option to Add Custom Content */}
        <div style={{
          background: '#fefce8',
          border: '1px solid #fde047',
          borderRadius: '8px',
          padding: '16px'
        }}>
          <h5 style={{
            margin: '0 0 8px 0',
            color: '#a16207',
            fontSize: '16px',
            fontWeight: '600'
          }}>
            Add Custom Content (Optional)
          </h5>
          <p style={{
            margin: '0 0 12px 0',
            fontSize: '14px',
            color: '#a16207',
            lineHeight: '1.4'
          }}>
            You can add additional custom reading comprehension activities alongside this template.
          </p>

                <button
                  type="button"
            onClick={() => {
              // Initialize custom activities if not already done
              if (customReadingComprehensionActivities.length === 0) {
                setCustomReadingComprehensionActivities([{
                  id: Date.now(),
                  storyTitle: '',
                  passages: [{ pageNumber: 1, text: '', image: '' }],
                  questions: [{ questionNumber: 1, questionText: '', correctAnswer: '', acceptableAnswers: [] }]
                }]);
              }
              setShowCustomContentForm(true);
            }}
            style={{
              padding: '8px 16px',
              border: '1px solid #f59e0b',
              borderRadius: '6px',
              background: 'white',
              color: '#f59e0b',
              fontSize: '14px',
              fontWeight: '500',
              cursor: 'pointer'
            }}
          >
            + Add Custom Content
          </button>
        </div>

        {/* Custom Content Form (if enabled) */}
        {showCustomContentForm && (
          <div style={{ marginTop: '20px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
              <h5 style={{ margin: 0, color: '#1f2937' }}>Additional Custom Content</h5>
                    <button
                      type="button"
                onClick={() => setShowCustomContentForm(false)}
                style={{
                  padding: '4px 8px',
                  border: '1px solid #d1d5db',
                  borderRadius: '4px',
                  background: 'white',
                  color: '#6b7280',
                  fontSize: '12px',
                  cursor: 'pointer'
                }}
              >
                Hide
                    </button>
            </div>
            {renderCustomReadingComprehensionForm()}
            </div>
          )}
        </div>
    );
  };

  /**
   * Custom Reading Comprehension Form
   */
  const renderCustomReadingComprehensionForm = () => {
    const currentActivity = getCurrentActivity();
    const isTemplateSelected = currentActivity.selectedTemplate && currentActivity.selectedTemplate._id;
    
    return (
      <>
            {/* Story Title Section */}
            <div className="rc-section">
          <h4>Story Title</h4>
          <div className="rc-form-group">
            <label>Enter the title of your story <span style={{ color: '#ef4444' }}>*</span></label>
            <input
              type="text"
              value={currentActivity.storyTitle || ''}
              onChange={(e) => {
                if (isTemplateSelected) return; // Disable editing when template is selected
                // Validation: only letters, spaces, uppercase/lowercase
                const validText = e.target.value.replace(/[^a-zA-Z\s]/g, '');
                updateCurrentActivity({ storyTitle: validText });
              }}
              placeholder="Example: Ang Magkakaibigan na mga Hayop"
              maxLength={100}
              disabled={isTemplateSelected}
              style={{ 
                opacity: isTemplateSelected ? 0.6 : 1,
                cursor: isTemplateSelected ? 'not-allowed' : 'text'
              }}
            />
            <div className="rc-char-counter">
              Only letters and spaces allowed. {(currentActivity.storyTitle || '').length}/100 characters
            </div>
            {isTemplateSelected && (
              <div style={{ fontSize: '12px', color: '#6b7280', marginTop: '4px' }}>
                <FaLock style={{ marginRight: '4px' }} /> Field is locked when using a template
              </div>
            )}
          </div>
        </div>

        {/* Story Pages Section */}
        <div className="rc-section">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <h4>Story Pages</h4>
            <button
              type="button"
              className="reading-comprehension-add-question-btn"
              onClick={addStoryPage}
              disabled={isTemplateSelected}
              style={{ 
                opacity: isTemplateSelected ? 0.6 : 1,
                cursor: isTemplateSelected ? 'not-allowed' : 'pointer'
              }}
            >
              <FaPlus /> Add Page
            </button>
          </div>
          {isTemplateSelected && (
            <div style={{ fontSize: '12px', color: '#6b7280', marginBottom: '16px' }}>
              <FaLock style={{ marginRight: '4px' }} /> Pages are locked when using a template
            </div>
          )}

          {safe(getCurrentActivity().storyPages || []).map((page, pageIndex) => (
            <div key={page.id} className="rc-story-page-card">
              <div className="rc-card-header">
                <div className="page-number">{pageIndex + 1}</div>
                {!isTemplateSelected && safe(getCurrentActivity().storyPages || []).length > 1 && (
                  <button
                    type="button"
                    className="rc-delete-btn"
                    onClick={() => removeStoryPage(page.id)}
                  >
                    <FaTimes /> Delete
                  </button>
                )}
              </div>

              <div className="rc-form-group">
                <label>Page Text <span style={{ color: '#ef4444' }}>*</span></label>
                <textarea
                  value={page.text || ''}
                  onChange={(e) => {
                    if (isTemplateSelected) return; // Disable editing when template is selected
                    // Validation: only letters, spaces, uppercase/lowercase, basic punctuation
                    const validText = e.target.value.replace(/[^a-zA-Z\s.,!?]/g, '');
                    updateStoryPage(page.id, 'text', validText);
                  }}
                  placeholder="Write the story content for this page..."
                  rows={4}
                  maxLength={500}
                  disabled={isTemplateSelected}
                  style={{ 
                    opacity: isTemplateSelected ? 0.6 : 1,
                    cursor: isTemplateSelected ? 'not-allowed' : 'text'
                  }}
                />
                <div className="rc-char-counter">
                  Only letters, spaces, and basic punctuation allowed. {(page.text || '').length}/500 characters
                </div>
              </div>

              <div className="rc-form-group">
                <label>Page Image (Optional)</label>
                <div className="image-upload-area" style={{ opacity: isTemplateSelected ? 0.6 : 1 }}>
                  {page.image && (
                    <div className="uploaded-image-preview">
                      <img
                        src={page.image}
                        alt={`Page ${pageIndex + 1}`}
                        style={{
                          width: '120px',
                          height: '90px',
                          objectFit: 'cover',
                          borderRadius: '8px'
                        }}
                      />
                      {!isTemplateSelected && (
                      <button
                        type="button"
                        onClick={() => updateStoryPage(page.id, 'image', null)}
                        style={{
                          background: '#ef4444',
                          color: 'white',
                          border: 'none',
                          borderRadius: '4px',
                          padding: '4px 8px',
                          fontSize: '12px',
                          cursor: 'pointer'
                        }}
                      >
                        Remove
                      </button>
                      )}
                    </div>
                  )}

                  <input
                    type="file"
                    ref={el => storyPageImageRefs.current[page.id] = el}
                    onChange={(e) => handleStoryPageImageUpload(e, page.id)}
                    accept="image/*"
                    style={{ display: 'none' }}
                    disabled={isTemplateSelected}
                  />
                  <button
                    type="button"
                    className="image-upload-btn"
                    onClick={() => !isTemplateSelected && storyPageImageRefs.current[page.id]?.click()}
                    disabled={uploading || isTemplateSelected}
                    style={{ 
                      opacity: isTemplateSelected ? 0.6 : 1,
                      cursor: isTemplateSelected ? 'not-allowed' : 'pointer'
                    }}
                  >
                    {uploading ? (
                      <>
                        <div className="spinner" style={{
                          width: '16px',
                          height: '16px',
                          border: '2px solid #f3f3f3',
                          borderTop: '2px solid #4A608A',
                          borderRadius: '50%',
                          animation: 'spin 1s linear infinite',
                          marginRight: '8px'
                        }}></div>
                        Uploading...
                      </>
                    ) : (
                      <>
                        <FaImage /> {page.image ? 'Change Image' : 'Upload Image'}
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          ))}

          {safe(getCurrentActivity().storyPages || []).length === 0 && (
            <div className="rc-empty-state">
              <p>No story pages added yet. Click "Add Page" to create your first page.</p>
            </div>
          )}
        </div>

        {/* Comprehension Questions Section */}
        <div className="rc-section">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <h4>Comprehension Questions</h4>
            <button
              type="button"
              className="reading-comprehension-add-question-btn"
              onClick={addComprehensionQuestion}
              style={{ 
                opacity: 1,
                cursor: 'pointer'
              }}
            >
              <FaPlus /> Add Question
            </button>
          </div>
          {isTemplateSelected && (
            <div style={{ fontSize: '12px', color: '#6b7280', marginBottom: '16px' }}>
              <FaLock style={{ marginRight: '4px' }} /> Template questions are locked. You can edit acceptable answers and add more questions for this intervention.
            </div>
          )}

          {safe(getCurrentActivity().questions || []).map((question, questionIndex) => {
            const isTemplateQuestion = isTemplateSelected && questionIndex < (currentActivity.selectedTemplate?.sentenceQuestions?.length || 0);
            return (
            <div key={question.id} className="rc-question-card">
              <div className="rc-card-header">
                <div className="question-number">
                  {questionIndex + 1}
                  {isTemplateQuestion && (
                    <span style={{ 
                      fontSize: '10px', 
                      color: 'white', 
                      marginLeft: '8px',
                      background: '#4A608A',
                      padding: '2px 6px',
                      borderRadius: '4px',
                      fontWeight: '500'
                    }}>
                      Template
                    </span>
                  )}
                </div>
                {(!isTemplateSelected || !isTemplateQuestion) && safe(getCurrentActivity().questions || []).length > 1 && (
                  <button
                    type="button"
                    className="rc-delete-btn"
                    onClick={() => removeComprehensionQuestion(question.id)}
                  >
                    <FaTimes /> Delete
                  </button>
                )}
              </div>

              <div className="rc-form-group">
                <label>Question Text <span style={{ color: '#ef4444' }}>*</span></label>
                <input
                  type="text"
                  value={question.questionText || ''}
                  onChange={(e) => {
                    if (isTemplateQuestion) return; // Disable editing only for template questions
                    // Validation: only letters, spaces, uppercase/lowercase, basic punctuation
                    const validText = e.target.value.replace(/[^a-zA-Z\s.,!?]/g, '');
                    updateComprehensionQuestion(question.id, 'questionText', validText);
                  }}
                  placeholder="Example: Sino ang mga pangunahing tauhan sa kwento?"
                  maxLength={200}
                  disabled={isTemplateQuestion}
                  style={{ 
                    opacity: isTemplateQuestion ? 0.6 : 1,
                    cursor: isTemplateQuestion ? 'not-allowed' : 'text'
                  }}
                />
                <div className="rc-char-counter">
                  Only letters, spaces, and basic punctuation allowed. {(question.questionText || '').length}/200 characters
                </div>
              </div>

              <div className="rc-form-group">
                <label>Correct Answer <span style={{ color: '#ef4444' }}>*</span></label>
                <input
                  type="text"
                  value={question.correctAnswer || ''}
                  onChange={(e) => {
                    if (isTemplateQuestion) return; // Disable editing only for template questions
                    // Validation: only letters, spaces, uppercase/lowercase
                    const validText = e.target.value.replace(/[^a-zA-Z\s]/g, '');
                    updateComprehensionQuestion(question.id, 'correctAnswer', validText);
                  }}
                  placeholder="Example: Si Juan at si Maria"
                  maxLength={100}
                  disabled={isTemplateQuestion}
                  style={{ 
                    opacity: isTemplateQuestion ? 0.6 : 1,
                    cursor: isTemplateQuestion ? 'not-allowed' : 'text'
                  }}
                />
                <div className="rc-char-counter">
                  Only letters and spaces allowed. {(question.correctAnswer || '').length}/100 characters
                </div>
              </div>

              <div className="rc-form-group">
                <label>Acceptable Answer Variations</label>
                <div className="rc-field-description">
                  Add alternative ways students might answer correctly
                </div>

                {safe(question.acceptableAnswers).map((answer, answerIndex) => (
                  <div key={answerIndex} className="rc-acceptable-answer-row">
                    <input
                      type="text"
                      value={answer}
                      onChange={(e) => {
                        // Validation: only letters, spaces, uppercase/lowercase
                        const validText = e.target.value.replace(/[^a-zA-Z\s]/g, '');
                        updateAcceptableAnswer(question.id, answerIndex, validText);
                      }}
                      placeholder={`Alternative answer ${answerIndex + 1}`}
                      className="rc-acceptable-answer-input"
                      maxLength={100}
                    />
                    <button
                      type="button"
                      onClick={() => removeAcceptableAnswer(question.id, answerIndex)}
                      className="rc-acceptable-answer-remove-btn"
                    >
                      <FaMinus />
                    </button>
                  </div>
                ))}

                <button
                  type="button"
                  className="rc-add-acceptable-answer-btn"
                  onClick={() => addAcceptableAnswer(question.id)}
                >
                  <FaPlus /> Add Alternative Answer
                </button>
              </div>
            </div>
            );
          })}

          {safe(getCurrentActivity().questions || []).length === 0 && (
            <div className="rc-empty-state">
              <p>No comprehension questions added yet. Click "Add Question" to create your first question.</p>
            </div>
          )}
        </div>
      </>
    );
  };

/**
 * Step 2: Sentence Selection (for Reading Comprehension)
 * Alias for renderSentenceTemplateSelection to maintain the 3-step flow
 */
const renderSentenceSelectionStep = () => {
  return renderSentenceTemplateSelection();
};

/**
 * Step 2: Question-Choice Pairs with Templates (combined step)
 * Integrates template functionality from the old step 2 with question creation
 */
/**
 * Alphabet Knowledge Specific Form (3 choices default, clean interface)
 */
const renderAlphabetKnowledgeStep = () => {
  return (
    <div className="alphabet-knowledge-container">


      {/* Questions Section */}
      <div className="alphabet-knowledge-questions-section">
        <div className="alphabet-knowledge-section-header">
          <h3 className="alphabet-knowledge-section-title">Questions</h3>
          <button
            type="button"
            className="alphabet-knowledge-add-question-btn"
            onClick={addQuestionChoicePair}
          >
            <FaPlus /> Add Question
          </button>
        </div>

        {/* Question List */}
        {safe(questionChoicePairs).map((pair, index) => (
          <div key={pair.id} className="alphabet-knowledge-question-card">
            <div className="alphabet-knowledge-question-header">
              <h4 className="alphabet-knowledge-question-number">Question {index + 1}</h4>
              <button
                type="button"
                className="alphabet-knowledge-remove-btn"
                onClick={() => removeQuestionChoicePair(pair.id)}
              >
                <FaTrash /> Remove
              </button>
            </div>

            {/* Template Selection */}
            <div className="alphabet-knowledge-form-group">
              <label className="alphabet-knowledge-form-label">
                Step 1: Use a Pre-made Template (Recommended) or Create Your Own <span style={{ color: '#ef4444' }}>*</span>
              </label>

              <select
                className="alphabet-knowledge-question-input"
                value=""
                onChange={(e) => applyTemplateToQuestion(pair.id, e.target.value)}
                style={{
                  marginBottom: '8px',
                  fontSize: '14px',
                  fontWeight: '500'
                }}
              >
                <option value="">-- Choose a pre-made template (recommended) --</option>
                {safe(questionTemplates)
                  .filter(template => {
                    const normCategory = normalizeCategory(category);
                    const templateCategory = normalizeCategory(template.category);
                    return templateCategory === normCategory;
                  })
                  .map(template => (
                    <option key={template._id} value={template._id}>
                      Template: {template.questionText || template.templateText} ({template.questionType})
                      {template.questionValue ? ` - Value: "${template.questionValue}"` : ''}
                    </option>
                  ))}
              </select>

              <div style={{
                fontSize: '12px',
                color: '#6b7280',
                marginBottom: '12px',
                fontStyle: 'italic'
              }}>
                Or skip the template and create your own custom question using the fields below.
              </div>
              {errors.success && (
                <div style={{
                  background: '#d1fae5',
                  border: '1px solid #10b981',
                  color: '#059669',
                  padding: '8px 12px',
                  borderRadius: '6px',
                  fontSize: '14px',
                  marginBottom: '12px'
                }}>
                  {errors.success}
                </div>
              )}
            </div>

            {/* Question Type Selector */}
            <div className="alphabet-knowledge-form-group" style={{ marginBottom: '24px' }}>
              <label className="alphabet-knowledge-form-label">
                Step 2: Choose Question Type <span style={{ color: '#ef4444' }}>*</span>
              </label>
              <div style={{
                fontSize: '12px',
                color: '#6b7280',
                marginBottom: '8px'
              }}>
                {pair.sourceTemplateId
                  ? "Question type is determined by your selected template."
                  : "Select whether this question tests vowels (patinig) or consonants (katinig). This affects analysis accuracy."
                }
              </div>
              <select
                className="alphabet-knowledge-question-input"
                value={pair.questionType || 'patinig'}
                onChange={(e) => {
                  const newQuestionType = e.target.value;
                  updateQuestionChoicePair(pair.id, { questionType: newQuestionType });
                }}
                disabled={pair.sourceTemplateId}
                style={{
                  backgroundColor: pair.sourceTemplateId ? '#f3f4f6' : 'white',
                  cursor: pair.sourceTemplateId ? 'not-allowed' : 'pointer',
                  opacity: pair.sourceTemplateId ? 0.7 : 1,
                  marginBottom: '8px'
                }}
              >
                <option value="patinig">Patinig (Vowels) - Tests A, E, I, O, U recognition</option>
                <option value="katinig">Katinig (Consonants) - Tests consonant letter recognition</option>
              </select>
              {pair.sourceTemplateId && (
                <div style={{
                  fontSize: '12px',
                  color: '#6b7280',
                  marginTop: '4px',
                  fontStyle: 'italic'
                }}>
                  Question type is fixed by the selected template to ensure consistency.
                </div>
              )}
            </div>

            {/* Question Text */}
            <div className="alphabet-knowledge-form-group" style={{ marginBottom: '24px' }}>
              <label className="alphabet-knowledge-form-label">
                Step 3: Write Your Question Text <span style={{ color: '#ef4444' }}>*</span>
              </label>
              <div style={{
                fontSize: '12px',
                color: '#6b7280',
                marginBottom: '8px'
              }}>
                {pair.sourceTemplateId
                  ? `Question Text: "${pair.questionText || 'Loading...'}" (from template)`
                  : "Type the question you want to ask students (no numbers allowed, 5-200 characters)"
                }
              </div>
              <input
                type="text"
                className="alphabet-knowledge-question-input"
                value={pair.questionText || ''}
                onChange={(e) => {
                  const newText = e.target.value;
                  updateQuestionChoicePair(pair.id, { questionText: newText });

                  // Real-time validation for question text
                  if (!pair.sourceTemplateId) {
                    const validationError = validateQuestionText(newText);
                    setErrors(prev => ({
                      ...prev,
                      [`questionText_${pair.id}`]: validationError
                    }));
                  }
                }}
                placeholder="Example: Anong ang katumbas na maliit na letra?"
                readOnly={pair.sourceTemplateId}
                disabled={pair.sourceTemplateId}
                style={{
                  backgroundColor: pair.sourceTemplateId ? '#f3f4f6' : 'white',
                  cursor: pair.sourceTemplateId ? 'not-allowed' : 'text',
                  opacity: pair.sourceTemplateId ? 0.7 : 1,
                  border: errors[`questionText_${pair.id}`] ? '2px solid #ef4444' : '1px solid #d1d5db'
                }}
                maxLength={200}
              />
              {errors[`questionText_${pair.id}`] && (
                <div style={{
                  color: '#ef4444',
                  fontSize: '12px',
                  marginTop: '4px',
                  fontWeight: '500'
                }}>
                  {errors[`questionText_${pair.id}`]}
                </div>
              )}
              {pair.sourceTemplateId && (
                <div style={{
                  fontSize: '12px',
                  color: '#6b7280',
                  marginTop: '4px',
                  fontStyle: 'italic'
                }}>
                  This field is protected because a template is being used. To edit, remove the template first.
                </div>
              )}
              {/* Character counter */}
              {!pair.sourceTemplateId && (
                <div style={{
                  fontSize: '11px',
                  color: '#9ca3af',
                  marginTop: '2px',
                  textAlign: 'right'
                }}>
                  {(pair.questionText || '').length}/200 characters
                </div>
              )}
            </div>

            {/* Question Image */}
            <div className="alphabet-knowledge-form-group" style={{ marginBottom: '24px' }}>
              <label className="alphabet-knowledge-form-label">
                Step 4: Add a Picture (Optional)
              </label>
              <div style={{
                fontSize: '12px',
                color: '#6b7280',
                marginBottom: '12px'
              }}>
                {pair.sourceTemplateId
                  ? "Image is provided by your selected template."
                  : "Upload a picture to help students understand the question (like showing a big letter 'A')"
                }
              </div>
              <div className="alphabet-knowledge-image-section">
                {pair.questionImage && (
                  <div style={{ position: 'relative', display: 'inline-block' }}>
                    <img
                      src={pair.questionImage}
                      alt="Question visual"
                      className="alphabet-knowledge-image-preview"
                    />
                    {/* Only show remove button if not using a template */}
                    {!pair.sourceTemplateId && (
                      <button
                        type="button"
                        className="alphabet-knowledge-remove-btn"
                        onClick={() => updateQuestionChoicePair(pair.id, { questionImage: null })}
                        style={{
                          position: 'absolute',
                          top: '5px',
                          right: '5px',
                          background: '#ef4444',
                          color: 'white',
                          border: 'none',
                          borderRadius: '50%',
                          width: '24px',
                          height: '24px',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontSize: '12px'
                        }}
                      >
                        ×
                      </button>
                    )}
                  </div>
                )}
                <input
                  type="file"
                  ref={el => fileInputRefs.current[pair.id] = el}
                  onChange={(e) => handleQuestionImageUpload(e, pair.id)}
                  accept="image/*"
                  style={{ display: 'none' }}
                />
                <button
                  type="button"
                  className="alphabet-knowledge-change-image-btn"
                  onClick={() => fileInputRefs.current[pair.id]?.click()}
                  disabled={uploading || pair.sourceTemplateId}
                  style={{
                    opacity: pair.sourceTemplateId ? 0.5 : 1,
                    cursor: pair.sourceTemplateId ? 'not-allowed' : 'pointer'
                  }}
                >
                  <FaImage /> {pair.sourceTemplateId ? 'Image Protected by Template' : uploading ? 'Uploading...' : (pair.questionImage ? 'Change Image' : 'Upload Image')}
                </button>
                {pair.sourceTemplateId && (
                  <div style={{
                    fontSize: '12px',
                    color: '#6b7280',
                    marginTop: '4px',
                    fontStyle: 'italic'
                  }}>
                    Image cannot be changed when using a template.
                  </div>
                )}
              </div>
              {errors.upload && (
                <div className="literexia-error-message">{errors.upload}</div>
              )}
            </div>

            {/* Question Value */}
            <div className="alphabet-knowledge-step-section">
              <label className="alphabet-knowledge-form-label">
                Step 5: Question Value (Word/Letter) <span style={{ color: '#ef4444' }}>*</span>
              </label>
              <div className="alphabet-knowledge-step-description">
                {pair.sourceTemplateId
                  ? `Question Value: "${pair.questionValue || 'Loading...'}" (from template)`
                  : "Enter the specific word or letter for this question."
                }
              </div>
              <input
                type="text"
                className="alphabet-knowledge-question-input"
                value={pair.questionValue || ''}
                onChange={(e) => {
                  // Only allow letters (no numbers or special characters)
                  const lettersOnly = e.target.value.replace(/[^a-zA-Z]/g, '');
                  updateQuestionChoicePair(pair.id, 'questionValue', lettersOnly);
                }}
                disabled={pair.sourceTemplateId}
                placeholder={pair.sourceTemplateId ? "Value provided by template" : "Enter word or letter (e.g., CAT, DOG, A, a)"}
                maxLength="100"
                style={{
                  opacity: pair.sourceTemplateId ? 0.5 : 1,
                  cursor: pair.sourceTemplateId ? 'not-allowed' : 'text',
                  backgroundColor: pair.sourceTemplateId ? '#f9fafb' : 'white'
                }}
              />
              {/* Character counter for question value */}
              {!pair.sourceTemplateId && (
                <div style={{
                  fontSize: '10px',
                  color: '#9ca3af',
                  marginTop: '4px'
                }}>
                  {(pair.questionValue || '').length}/100 chars
                </div>
              )}
              {pair.sourceTemplateId && (
                <div style={{
                  fontSize: '12px',
                  color: '#6b7280',
                  marginTop: '4px',
                  fontStyle: 'italic'
                }}>
                  Question Value is automatically set by the template and cannot be changed.
                </div>
              )}
              {/* Error message for required Question Value */}
              {errors.questionValue && (
                <div style={{
                  color: '#ef4444',
                  fontSize: '11px',
                  marginTop: '2px',
                  fontWeight: '500'
                }}>
                  {errors.questionValue}
                </div>
              )}
            </div>

            {/* Choices Section */}
            <div className="alphabet-knowledge-choices-section">
              <div className="alphabet-knowledge-choices-header">
                <h4 className="alphabet-knowledge-choices-title">Step 6: Create Answer Choices <span style={{ color: '#ef4444' }}>*</span></h4>
                <span className="alphabet-knowledge-choices-info">Exactly 3 choices required</span>
              </div>

              {/* Render exactly 3 choices */}
              {[0, 1, 2].map((choiceIndex) => {
                const choice = pair.choices?.[choiceIndex] || { optionText: '', isCorrect: false };
                const isTemplateChoice = pair.sourceTemplateId && choice.isCorrect;
                const canEditChoice = !pair.sourceTemplateId || !choice.isCorrect;

                return (
                  <div key={choiceIndex} className="alphabet-knowledge-choice-item">
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px', width: '100%' }}>
                      {/* Radio button with clear label */}
                      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', minWidth: '80px' }}>
                        <input
                          type="radio"
                          name={`correct-${pair.id}`}
                          className="alphabet-knowledge-choice-radio"
                          checked={choice.isCorrect}
                          disabled={pair.sourceTemplateId}
                          style={{
                            opacity: pair.sourceTemplateId ? 0.5 : 1,
                            cursor: pair.sourceTemplateId ? 'not-allowed' : 'pointer',
                            transform: 'scale(1.2)',
                            marginBottom: '4px'
                          }}
                          onChange={() => {
                            if (pair.sourceTemplateId) return; // Prevent changes when template is used

                            // Set this choice as correct and others as incorrect
                            const newChoices = [...(pair.choices || [])];
                            newChoices[0] = newChoices[0] || { optionText: '', isCorrect: false };
                            newChoices[1] = newChoices[1] || { optionText: '', isCorrect: false };
                            newChoices[2] = newChoices[2] || { optionText: '', isCorrect: false };

                            newChoices[0].isCorrect = choiceIndex === 0;
                            newChoices[1].isCorrect = choiceIndex === 1;
                            newChoices[2].isCorrect = choiceIndex === 2;

                            // Update both choices array and correctChoiceId for consistency
                            updateQuestionChoicePair(pair.id, {
                              choices: newChoices,
                              correctChoiceId: choiceIndex.toString() // Store the index as correctChoiceId
                            });
                          }}
                        />
                        <span style={{
                          fontSize: '11px',
                          color: choice.isCorrect ? '#059669' : '#ef4444', // Green if correct, red if not selected
                          fontWeight: choice.isCorrect ? 'bold' : 'normal',
                          textAlign: 'center'
                        }}>
                          {choice.isCorrect ? 'CORRECT' : 'Click here if correct'}
                        </span>
                      </div>

                      {/* Input field with clear labeling */}
                      <div style={{ flex: 1 }}>
                        <label style={{
                          fontSize: '12px',
                          color: '#374151',
                          fontWeight: '500',
                          marginBottom: '4px',
                          display: 'block'
                        }}>
                          Choice {choiceIndex + 1} {choice.isCorrect ? '(Correct Answer)' : '(Wrong Answer)'}
                        </label>
                        <input
                          type="text"
                          className="alphabet-knowledge-choice-input"
                          value={choice.optionText || ''}
                          readOnly={isTemplateChoice}
                          disabled={isTemplateChoice}
                          style={{
                            backgroundColor: isTemplateChoice ? '#f3f4f6' : 'white',
                            cursor: isTemplateChoice ? 'not-allowed' : 'text',
                            opacity: isTemplateChoice ? 0.7 : 1,
                            width: '100%',
                            border: errors[`choice_${pair.id}_${choiceIndex}`]
                              ? '2px solid #ef4444'
                              : choice.isCorrect ? '2px solid #059669' : '1px solid #d1d5db'
                          }}
                          onChange={(e) => {
                            if (!canEditChoice) return; // Prevent changes to correct answer when template is used

                            const newText = e.target.value;
                            const newChoices = [...(pair.choices || [])];
                            newChoices[0] = newChoices[0] || { optionText: '', isCorrect: false };
                            newChoices[1] = newChoices[1] || { optionText: '', isCorrect: false };
                            newChoices[2] = newChoices[2] || { optionText: '', isCorrect: false };

                            newChoices[choiceIndex].optionText = newText;
                            updateQuestionChoicePair(pair.id, { choices: newChoices });

                            // Real-time validation for choices
                            if (!isTemplateChoice) {
                              const validationError = validateAnswerChoice(newText, choiceIndex);
                              setErrors(prev => ({
                                ...prev,
                                [`choice_${pair.id}_${choiceIndex}`]: validationError
                              }));
                            }
                          }}
                          placeholder={isTemplateChoice ? "Protected by template" : `Enter ${choice.isCorrect ? 'correct' : 'wrong'} answer...`}
                          maxLength={50}
                        />
                        {errors[`choice_${pair.id}_${choiceIndex}`] && (
                          <div style={{
                            color: '#ef4444',
                            fontSize: '11px',
                            marginTop: '2px',
                            fontWeight: '500'
                          }}>
                            {errors[`choice_${pair.id}_${choiceIndex}`]}
                          </div>
                        )}
                        {/* Character counter for choices */}
                        {!isTemplateChoice && (
                          <div style={{
                            fontSize: '10px',
                            color: '#9ca3af',
                            marginTop: '1px'
                          }}>
                            {(choice.optionText || '').length}/50 chars
                          </div>
                        )}
                        {isTemplateChoice && (
                          <div style={{
                            fontSize: '10px',
                            color: '#6b7280',
                            marginTop: '2px',
                            fontStyle: 'italic'
                          }}>
                            Correct answer (protected by template)
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}

              {/* Template Protection Info */}
              {pair.sourceTemplateId && (
                <div style={{
                  background: '#fef3c7',
                  border: '1px solid #f59e0b',
                  color: '#92400e',
                  padding: '8px 12px',
                  borderRadius: '6px',
                  fontSize: '12px',
                  marginTop: '8px'
                }}>
                  <strong>Template Protection:</strong> When using a template, you can only edit the incorrect choices (the two wrong answers). The correct answer and question text are protected to maintain template integrity.
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

const renderQuestionChoicesStepWithTemplates = () => {
  return (
    <div className="literexia-form-section">
      <h3>Create Questions and Choices</h3>

      <div className="literexia-info-banner">
        <FaInfoCircle />
        <p>
          You can select from existing templates or create new questions.
          Templates help you create consistent questions for {formatCategoryName(category)}.
        </p>
      </div>



      {/* Questions and Choices Creation */}
      <div className="literexia-info-banner">
        <FaInfoCircle />
        <p>
          For each question, select exactly 2 choices and mark one as correct.
          You can add choices from the template library or create new ones inline.
        </p>
      </div>

      {/* Validation errors now shown as toast notifications instead of banners */}

      {safe(questionChoicePairs).map((pair, index) => (
        <div key={pair.id} className="literexia-question-pair">
          <div className="literexia-question-pair-header">
            <h4>Question {index + 1}</h4>
            <button
              type="button"
              className="literexia-remove-pair-btn"
              onClick={() => removeQuestionChoicePair(pair.id)}
            >
              <FaTrash /> Remove
            </button>
          </div>

          {/* Template Selection */}
          <div className="literexia-question-template-selection">
            <label>Question Template</label>
            <select
              value={pair.sourceId || ''}
              onChange={(e) => setTemplateForPair(pair.id, e.target.value)}
            >
              <option value="">-- Select Template --</option>
              {(() => {
                console.log('🎯 [DROPDOWN RENDER] Rendering template options...');
                console.log('🎯 [DROPDOWN RENDER] questionTemplates state:', questionTemplates);
                console.log('🎯 [DROPDOWN RENDER] safe(questionTemplates):', safe(questionTemplates));
                console.log('🎯 [DROPDOWN RENDER] safe(questionTemplates).length:', safe(questionTemplates).length);
                console.log('🎯 [DROPDOWN RENDER] category for filtering:', category);

                return safe(questionTemplates).map((template, templateIndex) => {
                  console.log(`🎯 [DROPDOWN RENDER] Template ${templateIndex + 1}:`, {
                    _id: template._id,
                    questionText: template.questionText,
                    templateText: template.templateText,
                    questionType: template.questionType,
                    category: template.category
                  });

                  // Use questionText if templateText is not available (database field mismatch)
                  const displayText = template.templateText || template.questionText || 'Untitled Template';

                  return (
                    <option key={template._id} value={template._id}>
                      {displayText} ({template.questionType})
                      {template.questionValue ? ` - Value: "${template.questionValue}"` : ''}
                    </option>
                  );
                });
              })()}
            </select>
          </div>

          {/* Question Details */}
          <div className="literexia-question-details">
            <div className="literexia-form-group">
              <label>Question Text</label>
              <input
                type="text"
                value={pair.questionText || ''}
                onChange={(e) => updateQuestionChoicePair(pair.id, 'questionText', e.target.value)}
                placeholder="Enter question text..."
              />
            </div>

            {/* Question Image */}
            <div className="literexia-form-group">
              <label>Question Image (Optional)</label>
              <div className="literexia-image-upload-section">
                {pair.questionImage && (
                  <div className="literexia-current-image">
                    <img
                      src={pair.questionImage}
                      alt="Question image"
                      className="literexia-question-image-preview"
                    />
                    {/* Only show remove button if not using a template */}
                    {!pair.sourceTemplateId && (
                      <button
                        type="button"
                        className="literexia-remove-image-btn"
                        onClick={() => removeQuestionImage(pair.id)}
                      >
                        <FaTimes /> Remove Image
                      </button>
                    )}
                  </div>
                )}
                <button
                  type="button"
                  className="literexia-upload-btn"
                  onClick={() => triggerImageUpload(pair.id)}
                  disabled={uploadingImage}
                >
                  <FaUpload /> {pair.questionImage ? 'Change Image' : 'Upload Image'}
                </button>
              </div>
            </div>
          </div>

          {/* Choice Selection */}
          <div className="literexia-choices-section">
            <h5>Question Choices</h5>
            {safe(pair.choices).map((choice, choiceIndex) => (
              <div key={choiceIndex} className="literexia-choice-item">
                <div className="literexia-choice-content">
                  <div className="literexia-choice-selector">
                    <select
                      value={choice.choiceId || ''}
                      onChange={(e) => setChoiceForPair(pair.id, choiceIndex, e.target.value)}
                    >
                      <option value="">-- Select Choice --</option>
                      {safe(choiceTemplates).map(choiceTemplate => (
                        <option key={choiceTemplate._id} value={choiceTemplate._id}>
                          {choiceTemplate.choiceValue} ({choiceTemplate.choiceType})
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="literexia-choice-preview">
                    {choice.choiceValue && (
                      <>
                        <span className="literexia-choice-value">{choice.choiceValue}</span>
                        {choice.choiceImage && (
                          <img
                            src={choice.choiceImage}
                            alt="Choice visual"
                            className="literexia-choice-image"
                          />
                        )}
                      </>
                    )}
                  </div>

                  <div className="literexia-choice-correct">
                    <label>
                      <input
                        type="radio"
                        name={`correct_${pair.id}`}
                        checked={choice.isCorrect === true}
                        onChange={() => setCorrectChoice(pair.id, choiceIndex)}
                      />
                      Correct
                    </label>
                  </div>

                  <button
                    type="button"
                    className="literexia-remove-choice-btn"
                    onClick={() => removeChoiceFromPair(pair.id, choiceIndex)}
                    disabled={safe(pair.choices).length <= 1}
                  >
                    <FaTimes />
                  </button>
                </div>
              </div>
            ))}

            {/* Add Choice */}
            {safe(pair.choices).length < 2 && (
              <button
                type="button"
                className="literexia-add-choice-btn"
                onClick={() => addChoiceToPair(pair.id)}
              >
                <FaPlus /> Add Choice
              </button>
            )}
          </div>
        </div>
      ))}

      {/* Add Question Pair */}
      <div className="literexia-add-pair-section">
        <button
          type="button"
          className="literexia-add-pair-btn"
          onClick={() => addQuestionChoicePair()}
        >
          <FaPlus /> Add Question
        </button>
      </div>
    </div>
  );
};

/**
 * Phonological Awareness Specific Form (Audio-Visual Matching Structure)
 */
const renderPhonologicalAwarenessStep = () => {
  return (
    <div className="phonological-awareness-container">
      <h3>Create Questions and Choices</h3>
      <br></br>
      <br></br>

      <div className="phonological-awareness-info-banner">
        <FaInfoCircle className="info-icon" />
        <p>
          You can select from existing templates or create new questions. Templates help you create consistent questions for
          Phonological Awareness.
        </p>
      </div>


      {/* Validation errors now shown as toast notifications instead of banners */}

      {/* Questions Section */}
      {safe(questionChoicePairs).map((pair, index) => (
        <div key={pair.id} className="phonological-awareness-question-card">
          <div className="phonological-awareness-question-header">
            <h4>Question {index + 1}</h4>
            <button
              type="button"
              className="phonological-awareness-remove-btn"
              onClick={() => removeQuestionChoicePair(pair.id)}
            >
              <FaTrash /> Remove
            </button>
          </div>

          {/* Template Selection */}
          <div className="phonological-awareness-template-selection">
            <label>Question Template</label>
            <select
              value={pair.sourceId || ''}
              onChange={(e) => setTemplateForPair(pair.id, e.target.value)}
              className="phonological-awareness-select"
            >
              <option value="">-- Select Template --</option>
              {safe(questionTemplates).map(template => {
                // For Phonological Awareness, show audio-visual pairs instead of question text
                if (template.category === 'Phonological Awareness' && template.questionSet && template.questionSet.audioTexts) {
                  const audioTexts = template.questionSet.audioTexts || [];
                  const pairsDisplay = audioTexts
                    .filter(audio => audio && audio.trim())
                    .map(audio => {
                      const match = audio.length === 1
                        ? audio.toUpperCase() + audio.toLowerCase()
                        : audio;
                      return `${audio}→${match}`;
                    })
                    .join(', ');

                  return (
                    <option key={template._id} value={template._id}>
                      {pairsDisplay || 'No pairs'} ({template.questionType})
                    </option>
                  );
                } else {
                  // For other categories, show original format
                  return (
                    <option key={template._id} value={template._id}>
                      {template.templateText || template.questionText || 'Untitled Template'} ({template.questionType})
                      {template.questionValue ? ` - Value: "${template.questionValue}"` : ''}
                    </option>
                  );
                }
              })}
            </select>
          </div>

          {/* Question Text Section */}
          <div className="phonological-awareness-question-section">
            <h5>Question Text</h5>
            <input
              type="text"
              value={pair.questionText || ''}
              onChange={(e) => updateQuestionChoicePair(pair.id, 'questionText', e.target.value)}
              placeholder="E.g., Pakinggan ang audio. Itugma ito sa katumbas na letra."
              className="phonological-awareness-input"
            />
          </div>

          {/* Audio Texts Section */}
          <div className="phonological-awareness-audio-section">
            <h5>Audio Texts</h5>
            <p className="phonological-awareness-description">
              Enter the sounds/letters that students will hear (e.g., H, T, N) - Up to 4 audio texts
            </p>
            <div className="phonological-awareness-audio-inputs">
              {/* Ensure we have at least 1 audio text, maximum 4 */}
              {(pair.audioTexts && pair.audioTexts.length > 0 ? pair.audioTexts : ['']).map((audioText, audioIndex) => (
                <div key={audioIndex} className="phonological-awareness-audio-input-group">
                  <div className="phonological-awareness-audio-input-header">
                    <label>Audio {audioIndex + 1}</label>
                    {/* Show remove button if more than 1 audio text */}
                    {(pair.audioTexts?.length || 1) > 1 && (
                      <button
                        type="button"
                        onClick={() => {
                          const currentAudioTexts = pair.audioTexts || [''];
                          const newAudioTexts = currentAudioTexts.filter((_, index) => index !== audioIndex);
                          updateQuestionChoicePair(pair.id, 'audioTexts', newAudioTexts);
                        }}
                        className="phonological-awareness-remove-audio-btn"
                        title="Remove this audio text"
                      >
                        ×
                      </button>
                    )}
                  </div>
                  <input
                    type="text"
                    value={audioText || ''}
                    onChange={(e) => {
                      // Only allow letters (no numbers, symbols, or special characters)
                      const lettersOnly = e.target.value.replace(/[^a-zA-Z\s]/g, '');

                      // Capitalize first letter of each word
                      const capitalizedValue = lettersOnly
                        .split(' ')
                        .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
                        .join(' ');

                      const currentAudioTexts = pair.audioTexts || [''];
                      const newAudioTexts = [...currentAudioTexts];
                      newAudioTexts[audioIndex] = capitalizedValue;
                      updateQuestionChoicePair(pair.id, 'audioTexts', newAudioTexts);
                    }}
                    placeholder={`Audio ${audioIndex + 1}`}
                    className="phonological-awareness-input"
                    maxLength="20"
                  />
                </div>
              ))}

              {/* Add Audio button - show if less than 4 audio texts */}
              {(pair.audioTexts?.length || 1) < 4 && (
                <div className="phonological-awareness-add-audio-section">
                  <button
                    type="button"
                    onClick={() => {
                      const currentAudioTexts = pair.audioTexts || [''];
                      const newAudioTexts = [...currentAudioTexts, ''];
                      updateQuestionChoicePair(pair.id, 'audioTexts', newAudioTexts);
                    }}
                    className="phonological-awareness-add-audio-btn"
                  >
                    + Add Audio Text
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Matching Options Section */}
          <div className="phonological-awareness-matching-section">
            <h5>Matching Options</h5>
            <p className="phonological-awareness-description">
              These are automatically generated based on your audio texts and will be randomly shuffled for students
            </p>
            <div className="phonological-awareness-matching-preview">
              {pair.audioTexts?.filter(text => text.trim()).map((audioText, index) => {
                // Generate correct matching text based on whether it's a single letter or word
                let matchingText;
                if (audioText.length === 1) {
                  // Single letter: L → Ll (uppercase + lowercase)
                  matchingText = audioText.toUpperCase() + audioText.toLowerCase();
                } else {
                  // Word: Keep as is
                  matchingText = audioText;
                }

                return (
                  <div key={index} className="phonological-awareness-matching-item">
                    <span className="audio-text">{audioText}</span>
                    <span className="arrow">→</span>
                    <span className="visual-text">{matchingText}</span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Correct Audio-Visual Pairs Section */}
          <div className="phonological-awareness-pairs-section">
            <h5>Correct Audio-Visual Pairs</h5>
            <p className="phonological-awareness-description">
              Pairs are automatically created from your audio texts
            </p>
            <div className="phonological-awareness-pairs-preview">
              {pair.audioTexts?.filter(text => text.trim()).map((audioText, index) => {
                // Generate correct matching text based on whether it's a single letter or word
                let matchingText;
                if (audioText.length === 1) {
                  // Single letter: L → Ll (uppercase + lowercase)
                  matchingText = audioText.toUpperCase() + audioText.toLowerCase();
                } else {
                  // Word: Keep as is
                  matchingText = audioText;
                }

                return (
                  <div key={index} className="phonological-awareness-pair-item">
                    <div className="pair-audio">
                      <FaVolumeUp />
                      <span>"{audioText}"</span>
                    </div>
                    <FaArrowRight className="pair-arrow" />
                    <div className="pair-visual">
                      <span>"{matchingText}"</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      ))}

      {/* Add Question Button */}
      <div className="phonological-awareness-add-section">
        <button
          type="button"
          className="phonological-awareness-add-question-btn"
          onClick={() => addQuestionChoicePair()}
        >
          <FaPlus /> Add Question
        </button>
      </div>
    </div>
  );
};

/**
 * Step 2: Decoding Questions - Two Types Implementation
 * Type A: "Tukuyin ang nasa larawan?" - Complete word identification where students arrange all letters
 * Type B: "Buoin ang salita" - Fill missing letter(s) where students complete words with blanks
 */
const renderDecodingStep = () => {
  return (
    <div className="decoding-container">
      <h3>Create Decoding Questions</h3>

      <div className="decoding-info-banner">
        <FaInfoCircle className="info-icon" />
        <div>
          <p style={{marginBottom: '12px', fontWeight: '600', fontSize: '18px'}}>
            <strong>Decoding Activity Creator</strong> - Help Students Connect Images to Words
          </p>
          <p style={{marginBottom: '8px'}}>
            <strong>How it works:</strong> Students see an image and work with letters to form or complete the word.
          </p>
          <div style={{display: 'flex', gap: '24px', marginTop: '12px', flexWrap: 'wrap'}}>
            <div style={{minWidth: '280px'}}>
              <strong>Type A - Complete Word:</strong>
              <br />
              <span style={{color: '#666'}}>Students arrange ALL letters to spell the word</span>
            </div>
            <div style={{minWidth: '280px'}}>
              <strong>Type B - Fill Missing Letter:</strong>
              <br />
              <span style={{color: '#666'}}>Students fill in just ONE missing letter</span>
            </div>
          </div>
          <p style={{marginTop: '12px', fontSize: '14px', color: '#666', fontStyle: 'italic'}}>
            <strong>Teacher Tip:</strong> First letter automatically capitalizes and removes numbers/symbols - just type naturally!
          </p>
        </div>
      </div>

      {/* Validation errors now shown as toast notifications instead of banners */}

      {/* Questions Section */}
      {safe(questionChoicePairs).map((pair, index) => (
        <div key={pair.id} className="decoding-question-card">
          <div className="decoding-question-header">
            <h4>Question {index + 1}</h4>
            <button
              type="button"
              className="decoding-remove-btn"
              onClick={() => removeQuestionChoicePair(pair.id)}
            >
              <FaTrash /> Remove
            </button>
          </div>

          {/* Question Type Selection */}
          <div className="decoding-question-type-selection">
            <label>Choose Question Type <span className="required">*</span></label>
            <select
              value={pair.questionType || ''}
              onChange={(e) => {
                const newType = e.target.value;

                // Clear any validation errors when switching types
                setInputValidationError(pair.id, 'correctWord', null);
                setInputValidationError(pair.id, 'completeWord', null);

                updateQuestionChoicePair(pair.id, {
                  questionType: newType,
                  questionText: newType === 'complete_word_identification'
                    ? 'Tukuyin ang nasa larawan?'
                    : newType === 'fill_missing_letter'
                    ? 'Buoin ang salita'
                    : '',
                  displaySequence: newType === 'fill_missing_letter' ? ['_'] : null,
                  blankPosition: newType === 'fill_missing_letter' ? 0 : null,
                  dragElements: [],
                  correctSequence: [],
                  correctWord: '',
                  completeWord: ''
                });
              }}
              className="decoding-select"
            >
              <option value="">-- Select Question Type --</option>
              <option value="complete_word_identification">Type A: Complete Word ID - Students arrange ALL letters to spell the word</option>
              <option value="fill_missing_letter">Type B: Fill Missing Letter - Students fill in ONE missing letter</option>
            </select>
            <small style={{display: 'block', marginTop: '8px', color: '#6b7280', fontSize: '14px', fontStyle: 'italic'}}>
              <strong>Tip:</strong> Type A is harder (arrange all letters), Type B is easier (fill one blank). The question text will update automatically below.
            </small>
          </div>

          {/* Template Selection Section */}
          <div className="decoding-template-selection">
            <label>Use Pre-Made Template (Optional)</label>
            <select
              value={pair.sourceTemplateId || ''}
              onChange={(e) => applyDecodingTemplate(pair.id, e.target.value)}
              className="decoding-select"
            >
              <option value="">-- Create Custom Question --</option>
              {safe(questionTemplates)
                .filter(template => {
                  // Only show Decoding templates
                  if (template.category !== 'Decoding') return false;
                  
                  // Always show ALL Decoding templates regardless of question type
                  return true;
                })
                .map((template) => {
                  // Extract the word being decoded for better display
                  let wordBeingDecoded = '';
                  if (template.questionType === 'complete_word_identification') {
                    // Type A: Get word from correctSequence
                    wordBeingDecoded = template.correctSequence ? template.correctSequence.join('') : '';
                  } else if (template.questionType === 'fill_missing_letter') {
                    // Type B: Get word from displaySequence + correctSequence
                    if (template.displaySequence && template.correctSequence) {
                      const display = [...template.displaySequence];
                      const blankPos = template.blankPosition || 0;
                      if (display[blankPos] === '_') {
                        display[blankPos] = template.correctSequence[0] || '';
                      }
                      wordBeingDecoded = display.join('');
                    }
                  }

                  const questionTypeDisplay = template.questionType === 'complete_word_identification'
                    ? 'Type A: Complete Word'
                    : 'Type B: Fill Missing Letter';

                  return (
                  <option key={template._id} value={template._id}>
                      {template.questionText || 'Untitled Template'} - {questionTypeDisplay}
                      {wordBeingDecoded ? ` (${wordBeingDecoded})` : ''}
                  </option>
                  );
                })
              }
            </select>
            <small style={{display: 'block', marginTop: '8px', color: '#6b7280', fontSize: '14px', fontStyle: 'italic'}}>
              Select a template to auto-fill the question, or choose "Create Custom Question" to start fresh
            </small>
          </div>

          {/* Question Text Section */}
          <div className="decoding-question-section">
            <h5>Question Text (Auto-Generated)</h5>
            <input
              type="text"
              value={pair.questionText || ''}
              onChange={(e) => updateQuestionChoicePair(pair.id, 'questionText', e.target.value)}
              placeholder={pair.questionType ? "Question text is set automatically based on your chosen type" : "Please select a question type above first"}
              className="decoding-input"
            />
            <small style={{display: 'block', marginTop: '8px', color: '#6b7280', fontSize: '14px', fontStyle: 'italic'}}>
              This text appears as the question students will see. It changes automatically when you select Type A or B above, but you can edit it if needed.
            </small>
          </div>

          {/* Image Upload Section */}
          <div className="decoding-image-section">
            <h5>
              Upload Image of the Word <span className="required">*</span>
              {pair.sourceTemplateId && (
                <span style={{color: '#f59e0b', fontSize: '12px', fontWeight: 'normal', marginLeft: '8px'}}>
                  (From Template - Cannot Delete)
                </span>
              )}
            </h5>
            <div className="decoding-image-upload">
              {pair.questionImage ? (
                <div className="decoding-image-preview">
                  <img
                    src={pair.questionImage}
                    alt="Question"
                    className="decoding-question-image"
                  />
                  {!pair.sourceTemplateId && (
                    <button
                      type="button"
                      onClick={() => updateQuestionChoicePair(pair.id, 'questionImage', '')}
                      className="decoding-remove-image-btn"
                      title="Remove this image"
                    >
                      <FaTimes />
                    </button>
                  )}
                  {pair.sourceTemplateId && (
                    <div className="template-lock-indicator" title="Image from template - cannot be deleted">
                      <FaLock style={{color: '#f59e0b', fontSize: '16px'}} />
                    </div>
                  )}
                </div>
              ) : (
                <div
                  className={`decoding-image-upload-area ${pair.sourceTemplateId ? 'disabled' : ''}`}
                  onClick={() => !pair.sourceTemplateId && fileInputRefs.current[pair.id]?.click()}
                  style={{
                    cursor: pair.sourceTemplateId ? 'not-allowed' : 'pointer',
                    opacity: pair.sourceTemplateId ? 0.6 : 1
                  }}
                >
                  <FaUpload />
                  <p>{pair.sourceTemplateId ? 'Template image will appear here' : 'Click to upload image'}</p>
                  <small>JPG, PNG files supported • Clear images work best for students</small>
                </div>
              )}
            </div>
            <small style={{display: 'block', marginTop: '8px', color: '#6b7280', fontSize: '14px', fontStyle: 'italic'}}>
              {pair.sourceTemplateId 
                ? 'When using a template, the image is pre-selected and cannot be changed. You can only modify the letter choices/distractors.'
                : 'Tip: Use clear, simple images that clearly show what the word represents (e.g., a yellow object for "YELO")'
              }
            </small>

            {/* Hidden file input for Decoding image upload */}
            <input
              type="file"
              ref={el => fileInputRefs.current[pair.id] = el}
              onChange={(e) => handleFileChange(e, pair.id)}
              accept="image/png,image/jpeg,image/jpg"
              style={{ display: 'none' }}
            />
          </div>

          {/* Show message when no question type is selected */}
          {!pair.questionType && (
            <div className="decoding-no-type-selected" style={{
              padding: '20px',
              textAlign: 'center',
              backgroundColor: '#f8f9fa',
              border: '2px dashed #dee2e6',
              borderRadius: '8px',
              margin: '20px 0',
              color: '#6c757d'
            }}>
              <h5 style={{ margin: '0 0 10px 0', color: '#495057' }}>Please Select a Question Type</h5>
              <p style={{ margin: '0', fontSize: '14px' }}>
                Choose either Type A (Complete Word ID) or Type B (Fill Missing Letter) above to continue setting up your question.
              </p>
            </div>
          )}

          {/* Type A: Complete Word Identification */}
          {pair.questionType === 'complete_word_identification' && (
            <div className="decoding-complete-word-section">
              <h5>Type A: Complete Word Setup</h5>
              <div className="decoding-word-input">
                <label>
                  What word does the image show? <span className="required">*</span>
                  {pair.sourceTemplateId && (
                    <span style={{color: '#f59e0b', fontSize: '12px', fontWeight: 'normal', marginLeft: '8px'}}>
                      (From Template - Cannot Edit)
                    </span>
                  )}
                </label>
                <input
                  type="text"
                  value={pair.correctWord || ''}
                  onChange={(e) => {
                    if (pair.sourceTemplateId) return; // Prevent editing when using template
                    
                    const { cleanValue, error } = validateAndSanitizeWordInput(e.target.value);

                    // Set validation error if any
                    setInputValidationError(pair.id, 'correctWord', error);

                    // Update the question data
                    updateQuestionChoicePair(pair.id, {
                      correctWord: cleanValue,
                      correctSequence: cleanValue.split(''), // Use proper capitalization for drag interface
                      dragElements: generateDragElements(cleanValue), // Use proper capitalization for drag interface
                      displaySequence: null,
                      blankPosition: null
                    });
                  }}
                  placeholder={pair.sourceTemplateId ? "Word is set from template" : "Type the word here"}
                  className={`decoding-input ${getInputValidationError(pair.id, 'correctWord') ? 'error' : ''} ${pair.sourceTemplateId ? 'template-locked' : ''}`}
                  disabled={pair.sourceTemplateId}
                  style={{
                    backgroundColor: pair.sourceTemplateId ? '#f9fafb' : 'white',
                    cursor: pair.sourceTemplateId ? 'not-allowed' : 'text',
                    opacity: pair.sourceTemplateId ? 0.7 : 1
                  }}
                />
                {getInputValidationError(pair.id, 'correctWord') && (
                  <div className="decoding-error-message">
                    {getInputValidationError(pair.id, 'correctWord')}
                  </div>
                )}
                <small style={{display: 'block', marginTop: '8px', color: '#6b7280', fontSize: '14px', fontStyle: 'italic'}}>
                  {pair.sourceTemplateId 
                    ? 'When using a template, the word is pre-set and cannot be changed. You can only modify the letter choices below.'
                    : 'Type any word and only the first letter will be capitalized (e.g., "yelo" becomes "Yelo")! Numbers and symbols are automatically removed.'
                  }
                </small>
              </div>

              {pair.correctWord && (
                <>
                  <div className="decoding-auto-generated">
                    <h6>Letter Options Configuration</h6>
                    {pair.sourceTemplateId && (
                      <div style={{
                        backgroundColor: '#fef3c7',
                        border: '1px solid #f59e0b',
                        borderRadius: '6px',
                        padding: '12px',
                        marginBottom: '16px',
                        fontSize: '14px'
                      }}>
                        <strong style={{color: '#92400e'}}>🔒 Template Mode:</strong>
                        <span style={{color: '#92400e', marginLeft: '8px'}}>
                          Word and image are locked. You can only add/remove letter choices below.
                        </span>
                      </div>
                    )}
                    
                    {/* Quick Actions */}
                    <div className="quick-actions">
                      <button
                        type="button"
                        onClick={() => {
                          if (pair.correctWord) {
                            const wordLetters = pair.correctWord.split('').map((letter, index) => 
                              index === 0 ? letter.toUpperCase() : letter.toLowerCase()
                            );
                            // Complete distractor pool with all consonants and vowels
                            const vowels = ['A', 'e', 'I', 'o', 'U', 'a', 'E', 'i', 'O', 'u'];
                            const consonants = ['B', 'C', 'D', 'F', 'G', 'H', 'J', 'K', 'L', 'M', 'N', 'P', 'Q', 'R', 'S', 'T', 'V', 'W', 'X', 'Y', 'Z',
                                               'b', 'c', 'd', 'f', 'g', 'h', 'j', 'k', 'l', 'm', 'n', 'p', 'q', 'r', 's', 't', 'v', 'w', 'x', 'y', 'z'];
                            const allDistractors = [...vowels, ...consonants];
                            
                            const availableDistractors = allDistractors.filter(d => 
                              !wordLetters.some(w => w.toLowerCase() === d.toLowerCase())
                            );
                            
                            // Randomize and limit distractors to only 2
                            const randomizedDistractors = availableDistractors
                              .sort(() => Math.random() - 0.5)
                              .slice(0, 2);
                            
                            const allLetters = [...wordLetters, ...randomizedDistractors];
                            
                            // Clear any existing validation errors
                            setInputValidationError(pair.id, 'dragElements', null);
                            
                            updateQuestionChoicePair(pair.id, 'dragElements', allLetters);
                            updateQuestionChoicePair(pair.id, 'correctSequence', wordLetters);
                          }
                        }}
                        className="generate-from-word-btn"
                        disabled={!pair.correctWord}
                      >
                        Generate from Word
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          updateQuestionChoicePair(pair.id, 'dragElements', []);
                          updateQuestionChoicePair(pair.id, 'correctSequence', []);
                        }}
                        className="clear-all-btn"
                      >
                        Clear All
                      </button>
                    </div>
                    
                    {/* Available Letters Section */}
                    <div className="decoding-drag-elements-preview">
                      <label>Available Letters (includes distractors):</label>
                      <div className="letters-control-container">
                        <div className="letters-display">
                          {(pair.dragElements || []).map((letter, idx) => {
                            // Check if this letter is part of the word (first part of array)
                            const wordLetters = pair.correctWord ? pair.correctWord.split('').map((l, i) => 
                              i === 0 ? l.toUpperCase() : l.toLowerCase()
                            ) : [];
                            const isWordLetter = wordLetters.includes(letter);
                            
                            return (
                              <div key={idx} className={`letter-chip-container ${isWordLetter ? 'word-letter' : 'distractor-letter'}`}>
                                <input
                                  type="text"
                                  value={letter}
                                  onChange={(e) => {
                                    // Validate input to allow only letters (A-Z, a-z)
                                    const validatedInput = validateLetterInput(e.target.value);
                                    
                                    const newDragElements = [...(pair.dragElements || [])];
                                    newDragElements[idx] = validatedInput;
                                    
                                    // Automatically remove duplicates
                                    const uniqueLetters = removeDuplicateLetters(newDragElements);
                                    
                                    updateQuestionChoicePair(pair.id, 'dragElements', uniqueLetters);
                                    
                                    // Clear any validation errors
                                    setInputValidationError(pair.id, 'dragElements', null);
                                  }}
                                  className={`letter-input ${isWordLetter ? 'word-letter-input' : 'distractor-letter-input'}`}
                                  maxLength="1"
                                  placeholder="Letter"
                                  disabled={isWordLetter}
                                />
                                {!isWordLetter && (
                                  <button
                                    type="button"
                                    onClick={() => {
                                      const newDragElements = (pair.dragElements || []).filter((_, i) => i !== idx);
                                      
                                      // Automatically remove any remaining duplicates
                                      const uniqueLetters = removeDuplicateLetters(newDragElements);
                                      
                                      updateQuestionChoicePair(pair.id, 'dragElements', uniqueLetters);
                                      
                                      // Clear any validation errors
                                      setInputValidationError(pair.id, 'dragElements', null);
                                    }}
                                    className="remove-letter-btn"
                                    title="Remove distractor"
                                  >
                                    ×
                                  </button>
                                )}
                      </div>
                            );
                          })}
                    </div>
                        <button
                          type="button"
                          onClick={() => {
                            const newDragElements = [...(pair.dragElements || []), ''];
                            updateQuestionChoicePair(pair.id, 'dragElements', newDragElements);
                          }}
                          className="add-letter-btn"
                        >
                          + Add Distractor
                        </button>
                      </div>
                    </div>

                    {/* Correct Sequence Section */}
                    <div className="decoding-correct-sequence">
                      <label>Correct Sequence (based on word):</label>
                      <div className="sequence-display">
                        {(pair.correctSequence || []).map((letter, idx) => (
                          <div key={idx} className="sequence-letter-display">
                            <span className="sequence-letter-text">{letter}</span>
                          </div>
                        ))}
                      </div>
                      <small className="sequence-help-text">
                        This sequence is automatically generated from the word you typed above.
                      </small>
                    </div>
                  </div>

                  <div className="decoding-student-preview" key={`preview-a-${pair.id}`} data-question-id={pair.id} data-question-type="A">
                    <h6>Student View Preview - Type A</h6>
                    <div className="student-preview-container" key={`container-a-${pair.id}`}>
                      <div className="preview-image" key={`image-a-${pair.id}`}>
                        {pair.questionImage && (
                          <img src={pair.questionImage} alt={`Preview for Question ${pair.id}`} className="preview-img" key={`img-a-${pair.id}`} />
                        )}
                      </div>
                      <p className="preview-question" key={`question-a-${pair.id}`}>{pair.questionText || 'Question text not set'}</p>
                      <div className="preview-drag-area" key={`drag-area-a-${pair.id}`}>
                        <label key={`drag-label-a-${pair.id}`}>Drag letters here to spell: {(pair.correctSequence || []).join('')}</label>
                        <div className="preview-drop-zone" key={`drop-zone-a-${pair.id}`}>
                          {(pair.correctSequence || []).map((letter, idx) => (
                            <div key={`${pair.id}-drop-${idx}`} className="preview-drop-slot" title={`Position ${idx + 1}: ${letter}`}></div>
                          ))}
                        </div>
                      </div>
                      <div className="preview-available-letters" key={`available-a-${pair.id}`}>
                        <label key={`available-label-a-${pair.id}`}>Available letters:</label>
                        <div className="preview-letters-container" key={`letters-container-a-${pair.id}`}>
                          {(pair.dragElements || []).map((letter, idx) => (
                            <div key={`${pair.id}-letter-${idx}-${letter}`} className="preview-letter-option">{letter}</div>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                </>
              )}
            </div>
          )}

          {/* Type B: Fill Missing Letter */}
          {pair.questionType === 'fill_missing_letter' && (
            <div className="decoding-fill-missing-section">
              <h5>Type B: Fill Missing Letter Setup</h5>
              <div className="decoding-word-input">
                <label>
                  What word does the image show? <span className="required">*</span>
                  {pair.sourceTemplateId && (
                    <span style={{color: '#f59e0b', fontSize: '12px', fontWeight: 'normal', marginLeft: '8px'}}>
                      (From Template - Cannot Edit)
                    </span>
                  )}
                </label>
                <input
                  type="text"
                  value={pair.completeWord || ''}
                  onChange={(e) => {
                    if (pair.sourceTemplateId) return; // Prevent editing when using template
                    
                    const { cleanValue, error } = validateAndSanitizeWordInput(e.target.value);

                    // Set validation error if any
                    setInputValidationError(pair.id, 'completeWord', error);

                    // Update the question data
                    updateQuestionChoicePair(pair.id, {
                      completeWord: cleanValue,
                      displaySequence: cleanValue.split('').map((letter, idx) =>
                        idx === (pair.blankPosition || 0) ? '_' : letter
                      ),
                      correctSequence: [cleanValue[pair.blankPosition || 0]],
                      dragElements: generateChoiceLetters(cleanValue[pair.blankPosition || 0])
                    });
                  }}
                  placeholder={pair.sourceTemplateId ? "Word is set from template" : "Type the word here"}
                  className={`decoding-input ${getInputValidationError(pair.id, 'completeWord') ? 'error' : ''} ${pair.sourceTemplateId ? 'template-locked' : ''}`}
                  disabled={pair.sourceTemplateId}
                  style={{
                    backgroundColor: pair.sourceTemplateId ? '#f9fafb' : 'white',
                    cursor: pair.sourceTemplateId ? 'not-allowed' : 'text',
                    opacity: pair.sourceTemplateId ? 0.7 : 1
                  }}
                />
                {getInputValidationError(pair.id, 'completeWord') && (
                  <div className="decoding-error-message">
                    {getInputValidationError(pair.id, 'completeWord')}
                  </div>
                )}
                <small style={{display: 'block', marginTop: '8px', color: '#6b7280', fontSize: '14px', fontStyle: 'italic'}}>
                  {pair.sourceTemplateId 
                    ? 'When using a template, the word is pre-set and cannot be changed. You can only modify the letter choices below.'
                    : 'Type any word and only the first letter will be capitalized (e.g., "yelo" becomes "Yelo")! Numbers and symbols are automatically removed.'
                  }
                </small>
              </div>

              {pair.completeWord && (
                <>
                  <div className="decoding-blank-position">
                    <label>
                      Click on the letter you want to make blank <span className="required">*</span>
                      {pair.sourceTemplateId && (
                        <span style={{color: '#f59e0b', fontSize: '12px', fontWeight: 'normal', marginLeft: '8px'}}>
                          (From Template - Cannot Change)
                        </span>
                      )}
                    </label>
                    <div className={`position-selector ${pair.sourceTemplateId ? 'template-locked' : ''}`}>
                      {pair.completeWord.split('').map((letter, idx) => (
                        <div
                          key={idx}
                          className={`position-option ${(pair.blankPosition || 0) === idx ? 'selected' : ''} ${pair.sourceTemplateId ? 'disabled' : ''}`}
                          onClick={() => {
                            if (pair.sourceTemplateId) return; // Prevent changes when using template
                            
                            updateQuestionChoicePair(pair.id, {
                              blankPosition: idx,
                              displaySequence: pair.completeWord.split('').map((l, i) => i === idx ? '_' : l),
                              correctSequence: [pair.completeWord[idx]], // Keep original case
                              dragElements: generateChoiceLetters(pair.completeWord[idx])
                            });
                          }}
                          title={pair.sourceTemplateId ? "Position is set from template" : `Click to make "${letter}" the missing letter`}
                          style={{
                            cursor: pair.sourceTemplateId ? 'not-allowed' : 'pointer',
                            opacity: pair.sourceTemplateId ? 0.6 : 1
                          }}
                        >
                          <span className="position-number">#{idx + 1}</span>
                          <span className="position-letter">{letter}</span>
                        </div>
                      ))}
                    </div>
                    <small style={{display: 'block', marginTop: '12px', color: '#6b7280', fontSize: '14px', fontStyle: 'italic'}}>
                      {pair.sourceTemplateId 
                        ? 'When using a template, the blank position is pre-set and cannot be changed. You can only modify the letter choices below.'
                        : 'Students will need to fill in the letter you select. The selected position will show as a blank "_" in the question.'
                      }
                    </small>
                  </div>

                  <div className="decoding-auto-generated">
                    <h6>Letter Options Configuration</h6>
                    {pair.sourceTemplateId && (
                      <div style={{
                        backgroundColor: '#fef3c7',
                        border: '1px solid #f59e0b',
                        borderRadius: '6px',
                        padding: '12px',
                        marginBottom: '16px',
                        fontSize: '14px'
                      }}>
                        <strong style={{color: '#92400e'}}>🔒 Template Mode:</strong>
                        <span style={{color: '#92400e', marginLeft: '8px'}}>
                          Word, blank position, and image are locked. You can only add/remove letter choices below.
                        </span>
                      </div>
                    )}
                    
                    {/* Quick Actions */}
                    <div className="quick-actions">
                      <button
                        type="button"
                        onClick={() => {
                          if (pair.completeWord && pair.blankPosition !== undefined) {
                            const correctLetter = pair.completeWord[pair.blankPosition];
                            const choiceLetters = generateChoiceLetters(correctLetter);
                            
                            // Clear any existing validation errors
                            setInputValidationError(pair.id, 'dragElements', null);
                            
                            updateQuestionChoicePair(pair.id, 'dragElements', choiceLetters);
                          }
                        }}
                        className="generate-from-word-btn"
                        disabled={!pair.completeWord || pair.blankPosition === undefined}
                      >
                        Generate from Word
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          updateQuestionChoicePair(pair.id, 'dragElements', []);
                        }}
                        className="clear-all-btn"
                      >
                        Clear All
                      </button>
                    </div>
                    
                    {/* Word with Blank Display */}
                    <div className="decoding-display-sequence">
                      <label>Word with Blank (read-only):</label>
                      <div className="display-sequence-preview">
                        {(pair.displaySequence || []).map((char, idx) => (
                          <span key={idx} className={`display-char ${char === '_' ? 'blank' : 'filled'}`}>
                            {char}
                          </span>
                        ))}
                      </div>
                      <small className="sequence-help-text">
                        This display is automatically generated from your word and selected blank position.
                      </small>
                    </div>
                    
                    {/* Choice Letters Section */}
                    <div className="decoding-choice-letters">
                      <label>Choice Letters (includes distractors):</label>
                      <div className="letters-control-container">
                        <div className="letters-display">
                          {(pair.dragElements || []).map((letter, idx) => {
                            // Check if this letter is the correct answer
                            const correctLetter = pair.completeWord && pair.blankPosition !== undefined ? 
                              pair.completeWord[pair.blankPosition] : '';
                            const isCorrectLetter = letter === correctLetter;
                            
                            return (
                              <div key={idx} className={`letter-chip-container ${isCorrectLetter ? 'correct-letter' : 'distractor-letter'}`}>
                                <input
                                  type="text"
                                  value={letter}
                                  onChange={(e) => {
                                    // Validate input to allow only letters (A-Z, a-z)
                                    const validatedInput = validateLetterInput(e.target.value);
                                    
                                    const newDragElements = [...(pair.dragElements || [])];
                                    newDragElements[idx] = validatedInput;
                                    
                                    // Automatically remove duplicates
                                    const uniqueLetters = removeDuplicateLetters(newDragElements);
                                    
                                    updateQuestionChoicePair(pair.id, 'dragElements', uniqueLetters);
                                    
                                    // Clear any validation errors
                                    setInputValidationError(pair.id, 'dragElements', null);
                                  }}
                                  className={`letter-input ${isCorrectLetter ? 'correct-letter-input' : 'distractor-letter-input'}`}
                                  maxLength="1"
                                  placeholder="Letter"
                                  disabled={isCorrectLetter}
                                />
                                {!isCorrectLetter && (
                                  <button
                                    type="button"
                                    onClick={() => {
                                      const newDragElements = (pair.dragElements || []).filter((_, i) => i !== idx);
                                      
                                      // Automatically remove any remaining duplicates
                                      const uniqueLetters = removeDuplicateLetters(newDragElements);
                                      
                                      updateQuestionChoicePair(pair.id, 'dragElements', uniqueLetters);
                                      
                                      // Clear any validation errors
                                      setInputValidationError(pair.id, 'dragElements', null);
                                    }}
                                    className="remove-letter-btn"
                                    title="Remove distractor"
                                  >
                                    ×
                                  </button>
                                )}
                      </div>
                            );
                          })}
                        </div>
                        <button
                          type="button"
                          onClick={() => {
                            const newDragElements = [...(pair.dragElements || []), ''];
                            updateQuestionChoicePair(pair.id, 'dragElements', newDragElements);
                          }}
                          className="add-letter-btn"
                        >
                          + Add Distractor
                        </button>
                      </div>
                    </div>
                  </div>

                  <div className="decoding-student-preview" key={`preview-b-${pair.id}`}>
                    <h6>Student View Preview - Type B</h6>
                    <div className="student-preview-container" key={`container-b-${pair.id}`}>
                      <div className="preview-image" key={`image-b-${pair.id}`}>
                        {pair.questionImage && (
                          <img src={pair.questionImage} alt={`Preview for Question ${pair.id}`} className="preview-img" key={`img-b-${pair.id}`} />
                        )}
                      </div>
                      <p className="preview-question" key={`question-b-${pair.id}`}>{pair.questionText || 'Question text not set'}</p>
                      <div className="preview-word-display" key={`word-display-b-${pair.id}`}>
                        <label key={`word-label-b-${pair.id}`}>Word to complete: {pair.completeWord || 'Complete word not set'}</label>
                        <div style={{ display: 'flex', gap: '4px', justifyContent: 'center', marginBottom: '16px' }} key={`word-container-b-${pair.id}`}>
                        {(pair.displaySequence || []).map((char, idx) => (
                          <div
                              key={`${pair.id}-display-${idx}`}
                            className={`preview-letter-position ${char === '_' ? 'blank clickable' : 'filled'}`}
                          >
                            {char === '_' ? '?' : char}
                          </div>
                        ))}
                      </div>
                      </div>
                      <div className="preview-available-letters" key={`available-b-${pair.id}`}>
                        <label key={`available-label-b-${pair.id}`}>Available letters to choose from:</label>
                        <div className="preview-letters-container" key={`letters-container-b-${pair.id}`}>
                          {(pair.dragElements || []).map((letter, idx) => (
                            <div key={`${pair.id}-choice-${idx}-${letter}`} className="preview-letter-option">{letter}</div>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                </>
              )}
            </div>
          )}
        </div>
      ))}

      {/* Add Question Button */}
      <div className="decoding-add-section">
        <button
          type="button"
          className="decoding-add-question-btn"
          onClick={() => addQuestionChoicePair()}
        >
          <FaPlus /> Add Question
        </button>
      </div>
    </div>
  );
};

/**
 * Step 2: Word Recognition Questions - Two Types Implementation
 * Type A: "Basahin ang pangungusap. Piliin ang tamang salita mula sa hanay." (Sentence completion with blank)
 * Type B: "Anong kasing tunog ng salitang nakikita?" (Sound matching)
 */
const renderWordRecognitionStep = () => {
  // Helper function to tokenize sentence for click-to-select blank position
  const tokenizeSentence = (sentence) => {
    if (!sentence || typeof sentence !== 'string') return [];
    return sentence.trim().split(/\s+/).filter(token => token.length > 0);
  };

  // Helper function to update sentence tokens when displayWord changes
  const updateSentenceTokens = (pairId, sentence) => {
    const tokens = tokenizeSentence(sentence);
    updateQuestionChoicePair(pairId, {
      sentenceTokens: tokens,
      blankPosition: null, // Reset blank position when sentence changes
      displayWord: sentence // Update displayWord with the new sentence
    });
  };

  // Helper function to set blank position
  const setBlankPosition = (pairId, position) => {
    const pair = questionChoicePairs.find(p => p.id === pairId);
    if (!pair || !pair.sentenceTokens) return;
    
    // Generate the displayWord with blank
    const displayWordWithBlank = pair.sentenceTokens.map((token, index) => {
      if (index === position) {
        return '_____';
      }
      return token;
    }).join(' ');
    
    updateQuestionChoicePair(pairId, { 
      blankPosition: position,
      displayWord: displayWordWithBlank
    });
  };

  // Helper function to generate sentence with blank for preview (dynamic underscore count)
  const generateSentencePreview = (tokens, blankPosition) => {
    if (!tokens || tokens.length === 0) return '';
    return tokens.map((token, index) => {
      if (index === blankPosition) {
        // Create dynamic blanks based on word length
        const wordLength = token.length;
        return '_'.repeat(Math.max(wordLength, 1)); // Match exact word length
      }
      return token;
    }).join(' ');
  };

  // Helper function to auto-generate answer options
  const autoGenerateOptions = (pairId, correctWord) => {
    if (!correctWord || correctWord.trim() === '') return;

    const common_distractors = [
      'aso', 'pusa', 'bahay', 'mesa', 'silya', 'libro', 'lapis', 'papel',
      'bola', 'damit', 'sapatos', 'pagkain', 'tubig', 'bulaklak', 'puno',
      'kotse', 'kutsara', 'plato', 'baso', 'kama', 'unan', 'kumot'
    ];

    const correctWordClean = correctWord.trim().toLowerCase();

    // Generate 3 distractors that are different from the correct word
    const distractors = common_distractors
      .filter(word => word !== correctWordClean)
      .sort(() => Math.random() - 0.5)
      .slice(0, 3);

    const newOptions = [correctWordClean, ...distractors];

    updateQuestionChoicePair(pairId, {
      blankOptions: newOptions,
      correctAnswer: [correctWordClean]
    });
  };

  // Helper function to validate text input (no numbers or symbols)
  const validateTextInput = (text) => {
    if (!text || typeof text !== 'string') return false;
    // Only allow letters, spaces, and basic Filipino punctuation
    const validPattern = /^[a-zA-ZÀ-ÿñÑ\s.,!?'-]+$/;
    return validPattern.test(text.trim());
  };

  // Helper function to validate word input (no numbers or symbols, allows spaces for multi-word display)
  const validateWordInput = (word) => {
    if (!word || typeof word !== 'string') return false;
    // Allow letters, spaces, and basic Filipino characters for display words
    const validPattern = /^[a-zA-ZÀ-ÿñÑ\s]+$/;
    return validPattern.test(word.trim());
  };

  // Helper function to check template duplicate by displayWord
  const checkTemplateDuplicate = async (displayWord, category = 'Word Recognition') => {
    if (!displayWord || displayWord.trim() === '') return false;

    try {
      const response = await fetch('/api/templates/questions/check-duplicate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          category: category,
          displayWord: displayWord.trim(),
        }),
      });

      if (response.ok) {
        const result = await response.json();
        return result.isDuplicate;
      }
    } catch (error) {
      console.error('Error checking template duplicate:', error);
    }
    return false;
  };

  // Helper function to generate correct answer preview
  const generateCorrectAnswerPreview = (pair) => {
    if (!pair) return '';

    // Auto-detect question type if questionSubType is not set
    let questionType = pair.questionSubType;
    if (!questionType && pair.questionText) {
      questionType = pair.questionText.includes('kasing tunog') ? 'sound_matching' : 'sentence_completion';
    }

    if (questionType === 'sentence_completion') {
      const tokens = pair.sentenceTokens || [];
      const blankPosition = pair.blankPosition;
      const correctAnswer = pair.correctAnswer && pair.correctAnswer[0];

      if (tokens.length > 0 && blankPosition !== null && blankPosition !== undefined && correctAnswer && correctAnswer.trim() !== '') {
        return tokens.map((token, index) => {
          if (index === blankPosition) {
            return `[${correctAnswer}]`; // Show correct answer in brackets
          }
          return token;
        }).join(' ');
      }
    } else if (questionType === 'sound_matching') {
      const displayWord = pair.displayWord;
      const correctAnswer = pair.correctAnswer && pair.correctAnswer[0];

      if (displayWord && displayWord.trim() !== '' && correctAnswer && correctAnswer.trim() !== '') {
        return `"${displayWord}" sounds like "${correctAnswer}"`;
      }
    }

    return '';
  };

  // Helper function to handle text input with validation
  const handleValidatedTextInput = (value, pairId, fieldName, isWordInput = false) => {
    const validator = isWordInput ? validateWordInput : validateTextInput;

    if (value === '' || validator(value)) {
      updateQuestionChoicePair(pairId, { [fieldName]: value });
      // Clear any validation errors for this field
      if (errors[`${pairId}_${fieldName}`]) {
        setErrors(prev => {
          const newErrors = { ...prev };
          delete newErrors[`${pairId}_${fieldName}`];
          return newErrors;
        });
      }
    } else {
      // Set validation error
      const errorMessage = isWordInput
        ? 'Only letters and spaces are allowed (no numbers or symbols)'
        : 'Only letters, spaces, and basic punctuation are allowed';

      setErrors(prev => ({
        ...prev,
        [`${pairId}_${fieldName}`]: errorMessage
      }));
    }
  };

  // Helper function to trigger file upload for Word Recognition images
  const triggerFileUpload = (pairId) => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    input.onchange = async (e) => {
      const file = e.target.files[0];
      if (file) {
        try {
          setUploadingImage(true);
          const formData = new FormData();
          formData.append('file', file);
          formData.append('type', 'question-image');
          formData.append('path', 'general'); // Specify general folder

          const response = await fetch('/api/uploads/s3', {
            method: 'POST',
            body: formData,
          });

          if (response.ok) {
            const data = await response.json();
            updateQuestionChoicePair(pairId, { questionImage: data.url });
            setNotification({
              message: 'Image uploaded successfully!',
              type: 'success'
            });
          } else {
            throw new Error('Upload failed');
          }
        } catch (error) {
          console.error('Error uploading image:', error);
          setNotification({
            message: 'Failed to upload image. Please try again.',
            type: 'error'
          });
        } finally {
          setUploadingImage(false);
        }
      }
    };
    input.click();
  };

  return (
    <div className="word-recognition-container">
      <div className="word-recognition-info-banner">
        <FaInfoCircle className="info-icon" />
        <div>
          <h3>Create Word Recognition Questions</h3>
          <p>
            <strong>Activity Creator</strong> - Help students practice word recognition skills
          </p>
          <p>
            <strong>Choose activity type:</strong>
          </p>
          <div style={{display: 'flex', gap: '24px', marginTop: '12px', flexWrap: 'wrap'}}>
            <div style={{minWidth: '280px', padding: '12px 16px', background: 'rgba(255, 255, 255, 0.1)', borderRadius: '6px', border: '1px solid rgba(255, 255, 255, 0.2)', flex: '1'}}>
              <strong>Type A - Sentence Completion</strong>
              <br />
              <span style={{color: '#e3f2fd', fontSize: '13px'}}>Students fill in missing words</span>
            </div>
            <div style={{minWidth: '280px', padding: '12px 16px', background: 'rgba(255, 255, 255, 0.1)', borderRadius: '6px', border: '1px solid rgba(255, 255, 255, 0.2)', flex: '1'}}>
              <strong>Type B - Sound Matching</strong>
              <br />
              <span style={{color: '#e3f2fd', fontSize: '13px'}}>Students match similar sounds</span>
            </div>
          </div>
          <p style={{marginTop: '8px', fontSize: '12px', color: '#e3f2fd', padding: '6px', background: 'rgba(255, 255, 255, 0.1)', borderRadius: '4px', border: '1px solid rgba(255, 255, 255, 0.2)'}}>
            <strong>Tip:</strong> Click words to set blanks. Use auto-generate for quick setup.
          </p>
        </div>
      </div>

      {/* Validation errors now shown as toast notifications instead of banners */}

      {/* Questions Section */}
      {safe(questionChoicePairs).map((pair, index) => (
        <div key={pair.id} className="word-recognition-question-card">
          <div className="word-recognition-question-header">
            <h4>Question {index + 1}</h4>
            <button
              type="button"
              className="word-recognition-remove-btn"
              onClick={() => removeQuestionChoicePair(pair.id)}
              title="Remove this question"
            >
              <FaTrash /> Remove
            </button>
          </div>

          {/* Template Selection Section */}
          <div style={{background: '#f8fafc', padding: '12px', borderRadius: '4px', marginBottom: '12px', border: '1px solid #e1e8ed'}}>
            <div className="word-recognition-form-group">
              <label>Use Template (Optional)</label>
              <select
                value={pair.sourceTemplateId || ''}
                onChange={(e) => applyWordRecognitionTemplate(pair.id, e.target.value)}
                className="word-recognition-select"
              >
                <option value="">Create Custom Question</option>
                {safe(questionTemplates)
                  .filter(template => {
                    // Only show Word Recognition templates
                    if (template.category !== 'Word Recognition') return false;
                    return true;
                  })
                  .map((template) => {
                    // Create descriptive display text based on question type
                    let displayText = '';
                    let questionType = 'sentence_completion'; // Default
                    
                    if (template.questionText) {
                      const questionText = template.questionText.toLowerCase();
                      
                      // Check for sound matching indicators
                      if (questionText.includes('kasing tunog') || 
                          questionText.includes('buoin') || 
                          questionText.includes('sound') ||
                          questionText.includes('match')) {
                        questionType = 'sound_matching';
                      }
                      // Check for sentence completion indicators
                      else if (questionText.includes('basahin') || 
                               questionText.includes('pangungusap') || 
                               questionText.includes('piliin') ||
                               questionText.includes('sentence') ||
                               questionText.includes('complete')) {
                        questionType = 'sentence_completion';
                      }
                    }
                    
                    if (questionType === 'sound_matching') {
                      displayText = `Sound Matching: ${template.displayWord || 'Untitled'}`;
                    } else {
                      displayText = `Sentence Completion: ${template.displayWord || 'Untitled'}`;
                    }

                    return (
                      <option key={template._id} value={template._id}>
                        {displayText}
                      </option>
                    );
                  })}
              </select>
              <small style={{color: '#64748b', fontSize: '11px', marginTop: '4px', display: 'block'}}>
                Templates provide pre-made content for faster question creation
              </small>
            </div>
          </div>

          {/* Question Type Selection Section */}
          <div style={{background: '#fef3c7', padding: '12px', borderRadius: '4px', marginBottom: '12px', border: '1px solid #f59e0b'}}>
            <div className="word-recognition-form-group">
              <label>Question Type</label>
              <select
                value={pair.questionText || 'Basahin ang pangungusap. Piliin ang tamang salita mula sa hanay.'}
                onChange={(e) => {
                  const newQuestionText = e.target.value;
                  const newSubType = newQuestionText.includes('kasing tunog') ? 'sound_matching' : 'sentence_completion';
                  updateQuestionChoicePair(pair.id, {
                    questionText: newQuestionText,
                    questionSubType: newSubType,
                    // Reset fields when changing type
                    displayWord: '',
                    blankOptions: ['', '', '', ''],
                    correctAnswer: [],
                    blankPosition: null,
                    sentenceTokens: []
                  });
                }}
                disabled={pair.sourceTemplateId} // Disable if template is selected
              >
                <option value="Basahin ang pangungusap. Piliin ang tamang salita mula sa hanay.">
                  Basahin ang pangungusap. Piliin ang tamang salita mula sa hanay.
                </option>
                <option value="Anong kasing tunog ng salitang nakikita?">
                  Anong kasing tunog ng salitang nakikita?
                </option>
              </select>
              {pair.sourceTemplateId ? (
                <small style={{color: '#92400e', fontSize: '11px', marginTop: '4px', display: 'block', fontWeight: '500'}}>
                  Question text is controlled by the selected template
                </small>
              ) : (
                <small style={{color: '#92400e', fontSize: '11px', marginTop: '4px', display: 'block'}}>
                  Select the type of question to create
                </small>
              )}
            </div>
          </div>

          {/* Type A: Sentence Completion */}
          {pair.questionSubType === 'sentence_completion' && (
            <div style={{background: '#ecfdf5', padding: '12px', borderRadius: '4px', marginBottom: '12px', border: '1px solid #10b981'}}>
              <h5 style={{margin: '0 0 12px 0', color: '#047857', fontSize: '14px', fontWeight: '600'}}>
                Sentence Completion Setup
              </h5>
              
              {/* Sentence Input */}
              <div className="word-recognition-form-group">
                <label>Complete Sentence (click word to set as blank)</label>
                <input
                  type="text"
                  value={pair.displayWord || ''}
                  onChange={(e) => {
                    const sentence = e.target.value;
                    if (!pair.sourceTemplateId) {
                      handleValidatedTextInput(sentence, pair.id, 'displayWord', false);
                      updateSentenceTokens(pair.id, sentence);
                    }
                  }}
                  placeholder="e.g., Naglalaro siya ng _____ sa parke"
                  disabled={pair.sourceTemplateId} // Disable if template is selected
                  className={errors[`${pair.id}_displayWord`] ? 'literexia-error' : ''}
                />
                {errors[`${pair.id}_displayWord`] && (
                  <div className="literexia-error-message" style={{color: '#dc2626', fontSize: '11px', marginTop: '4px'}}>
                    {errors[`${pair.id}_displayWord`]}
                  </div>
                )}
                {pair.sourceTemplateId ? (
                  <small style={{color: '#047857', fontSize: '11px', marginTop: '4px', display: 'block', fontWeight: '500'}}>
                    Sentence is controlled by the selected template
                  </small>
                ) : (
                  <small style={{color: '#047857', fontSize: '11px', marginTop: '4px', display: 'block'}}>
                    Type a complete sentence, then click words to set blank position
                  </small>
                )}
              </div>

              {/* Sentence Image Upload (Optional) */}
              <div className="word-recognition-form-group">
                <label>Sentence Image (Optional)</label>
                <div className="word-recognition-image-upload">
                  {pair.questionImage ? (
                    <div className="word-recognition-image-preview">
                      <img
                        src={pair.questionImage}
                        alt="Sentence illustration"
                        className="word-recognition-uploaded-image"
                      />
                      <div className="word-recognition-image-controls">
                        <button
                          type="button"
                          className="word-recognition-remove-image-btn"
                          onClick={() => updateQuestionChoicePair(pair.id, { questionImage: null })}
                          title={pair.sourceTemplateId ? "Image is from template - cannot remove" : "Remove image"}
                          disabled={pair.sourceTemplateId}
                          style={{
                            opacity: pair.sourceTemplateId ? 0.5 : 1,
                            cursor: pair.sourceTemplateId ? 'not-allowed' : 'pointer'
                          }}
                        >
                          <FaTimes />
                        </button>
                        <button
                          type="button"
                          className="word-recognition-change-image-btn"
                          onClick={() => triggerFileUpload(pair.id)}
                          title={pair.sourceTemplateId ? "Image is from template - cannot change" : "Change image"}
                          disabled={uploadingImage || pair.sourceTemplateId}
                          style={{
                            opacity: pair.sourceTemplateId ? 0.5 : 1,
                            cursor: pair.sourceTemplateId ? 'not-allowed' : 'pointer',
                            marginLeft: '8px'
                          }}
                        >
                          <FaImage /> Change
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="word-recognition-image-upload-empty">
                      <FaImage className="word-recognition-image-upload-icon" />
                      <p className="word-recognition-image-upload-text">
                        Add an image to illustrate the sentence
                      </p>
                      <button
                        type="button"
                        className="word-recognition-upload-btn"
                        onClick={() => triggerFileUpload(pair.id)}
                        disabled={uploadingImage || pair.sourceTemplateId}
                        style={{
                          opacity: pair.sourceTemplateId ? 0.5 : 1,
                          cursor: pair.sourceTemplateId ? 'not-allowed' : 'pointer'
                        }}
                      >
                        {uploadingImage ? (
                          <>
                            <div className="word-recognition-upload-spinner"></div>
                            Uploading...
                          </>
                        ) : (
                          <>
                            <FaPlus /> Choose Image
                          </>
                        )}
                      </button>
                    </div>
                  )}
                </div>
                <small style={{color: '#047857', fontSize: '12px', marginTop: '8px', display: 'block', textAlign: 'center', fontStyle: 'italic'}}>
                  {pair.sourceTemplateId 
                    ? 'Image is controlled by the selected template'
                    : 'Images help students understand the context better (optional but recommended)'
                  }
                </small>
              </div>

              {/* Click-to-Select Blank Position */}
              {pair.sentenceTokens && pair.sentenceTokens.length > 0 && (
                <div className="word-recognition-form-group">
                  <label>Click word to set as blank:</label>
                  <div className="word-recognition-sentence-tokens">
                    {pair.sentenceTokens.map((token, tokenIndex) => (
                      <span
                        key={tokenIndex}
                        className={`word-token ${pair.blankPosition === tokenIndex ? 'selected-blank' : ''}`}
                        onClick={() => setBlankPosition(pair.id, tokenIndex)}
                        title={`Click to set "${token}" as the blank word`}
                      >
                        {token}
                      </span>
                    ))}
                  </div>
                  <small style={{color: '#047857', fontSize: '11px', marginTop: '4px', display: 'block'}}>
                    Click any word above to make it the blank for students to fill in
                  </small>
                </div>
              )}

              {/* Preview */}
              {pair.blankPosition !== null && pair.sentenceTokens && (
                <div className="word-recognition-form-group">
                  <label>Preview:</label>
                  <div className="word-recognition-preview">
                    {generateSentencePreview(pair.sentenceTokens, pair.blankPosition)}
                  </div>
                  <small style={{color: '#047857', fontSize: '11px', marginTop: '4px', display: 'block'}}>
                    This is how your question will appear to students
                  </small>
                </div>
              )}

              {/* Auto-generate button */}
              {pair.blankPosition !== null && pair.sentenceTokens && !pair.sourceTemplateId && (
                <div className="word-recognition-form-group">
                  <button
                    type="button"
                    className="word-recognition-auto-generate-btn"
                    onClick={() => {
                      const correctWord = pair.sentenceTokens[pair.blankPosition];
                      autoGenerateOptions(pair.id, correctWord);
                    }}
                    title="Automatically generate answer options based on the selected word"
                  >
                    <FaMagic /> Auto-Generate Options
                  </button>
                  <small style={{color: '#047857', fontSize: '11px', marginTop: '4px', display: 'block'}}>
                    Automatically creates answer options to save time
                  </small>
                </div>
              )}
            </div>
          )}

          {/* Type B: Sound Matching */}
          {pair.questionSubType === 'sound_matching' && (
            <div style={{background: '#f0f9ff', padding: '12px', borderRadius: '4px', marginBottom: '12px', border: '1px solid #0ea5e9'}}>
              <h5 style={{margin: '0 0 12px 0', color: '#0c4a6e', fontSize: '14px', fontWeight: '600'}}>
                Sound Matching Setup
              </h5>
              
              {/* Display Word */}
              <div className="word-recognition-form-group">
                <label>Display Word (word to match sounds with)</label>
                <input
                  type="text"
                  value={pair.displayWord || ''}
                  onChange={(e) => {
                    const word = e.target.value;
                    if (!pair.sourceTemplateId) {
                      handleValidatedTextInput(word, pair.id, 'displayWord', true); // true for word input validation
                    }
                  }}
                  onKeyDown={(e) => {
                    // Allow letters, spaces, and basic navigation keys
                    const char = e.key;
                    const validPattern = /^[a-zA-ZÀ-ÿñÑ\s]$/;
                    if (!validPattern.test(char) && char !== 'Backspace' && char !== 'Delete' && char !== 'Tab' && char !== 'ArrowLeft' && char !== 'ArrowRight' && char !== 'ArrowUp' && char !== 'ArrowDown' && char.length === 1) {
                      e.preventDefault();
                    }
                  }}
                  placeholder="e.g., SUMBRERO or LARUAN (letters and spaces allowed)"
                  disabled={pair.sourceTemplateId} // Disable if template is selected
                  className={errors[`${pair.id}_displayWord`] ? 'literexia-error' : ''}
                />
                {errors[`${pair.id}_displayWord`] && (
                  <div className="literexia-error-message" style={{color: '#dc2626', fontSize: '11px', marginTop: '4px'}}>
                    {errors[`${pair.id}_displayWord`]}
                  </div>
                )}
                {pair.sourceTemplateId ? (
                  <small style={{color: '#0c4a6e', fontSize: '11px', marginTop: '4px', display: 'block', fontWeight: '500'}}>
                    Display word is controlled by the selected template
                  </small>
                ) : (
                  <small style={{color: '#0c4a6e', fontSize: '11px', marginTop: '4px', display: 'block'}}>
                    Enter the word that students will match sounds with (spaces allowed for multi-word phrases)
                  </small>
                )}
              </div>

              {/* Word Image Upload (Optional) */}
              <div className="word-recognition-form-group">
                <label>Word Image (Optional)</label>
                <div className="word-recognition-image-upload">
                  {pair.questionImage ? (
                    <div className="word-recognition-image-preview">
                      <img
                        src={pair.questionImage}
                        alt="Word"
                        className="word-recognition-uploaded-image"
                      />
                      <button
                        type="button"
                        className="word-recognition-remove-image-btn"
                        onClick={() => updateQuestionChoicePair(pair.id, { questionImage: null })}
                        title={pair.sourceTemplateId ? "Image is from template - cannot remove" : "Remove image"}
                        disabled={pair.sourceTemplateId}
                        style={{
                          opacity: pair.sourceTemplateId ? 0.5 : 1,
                          cursor: pair.sourceTemplateId ? 'not-allowed' : 'pointer'
                        }}
                      >
                        <FaTimes />
                      </button>
                    </div>
                  ) : (
                    <div className="word-recognition-image-upload-empty">
                      <FaImage className="word-recognition-image-upload-icon" />
                      <p className="word-recognition-image-upload-text">
                        Add an image to represent the word
                      </p>
                      <button
                        type="button"
                        className="word-recognition-upload-btn"
                        onClick={() => triggerFileUpload(pair.id)}
                      >
                        <FaPlus /> Choose Image
                      </button>
                    </div>
                  )}
                </div>
                <small style={{color: '#0c4a6e', fontSize: '11px', marginTop: '4px', display: 'block'}}>
                  Upload an image that represents the word
                </small>
              </div>
            </div>
          )}

          {/* Answer Options (Common for both types) */}
          <div style={{background: '#fef3c7', padding: '12px', borderRadius: '4px', marginBottom: '12px', border: '1px solid #f59e0b'}}>
            <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px'}}>
              <h5 style={{margin: '0', color: '#92400e', fontSize: '14px', fontWeight: '600'}}>
                Answer Options ({(pair.blankOptions || ['', '', '', '']).length} options)
              </h5>
              <div style={{display: 'flex', gap: '8px'}}>
                <button
                  type="button"
                  onClick={() => {
                    const currentOptions = pair.blankOptions || ['', '', '', ''];
                    const newOptions = [...currentOptions, ''];
                    updateQuestionChoicePair(pair.id, { blankOptions: newOptions });
                  }}
                  style={{
                    padding: '4px 8px',
                    fontSize: '12px',
                    background: '#10b981',
                    color: 'white',
                    border: 'none',
                    borderRadius: '4px',
                    cursor: 'pointer'
                  }}
                  title="Add another option"
                >
                  <FaPlus /> Add Option
                </button>
                {(pair.blankOptions || ['', '', '', '']).length > 2 && (() => {
                  const currentOptions = pair.blankOptions || ['', '', '', ''];
                  const lastOption = currentOptions[currentOptions.length - 1];
                  const isLastOptionCorrect = (pair.correctAnswer || []).includes(lastOption);
                  const isTemplateLocked = pair.sourceTemplateId && pair.questionSubType === 'sound_matching' && isLastOptionCorrect;
                  
                  return (
                    <button
                      type="button"
                      onClick={() => {
                        // Check if this is a template with locked correct answer
                        if (isTemplateLocked) {
                          // Prevent deletion of correct answer from sound matching template
                          createModalToast('Cannot remove the correct answer from a Sound Matching template. The correct answer is locked.', 'warning');
                          return;
                        }
                        
                        const newOptions = currentOptions.slice(0, -1);
                        // Remove from correct answers if it was selected
                        const newCorrectAnswers = (pair.correctAnswer || []).filter(answer => answer !== lastOption);
                        updateQuestionChoicePair(pair.id, {
                          blankOptions: newOptions,
                          correctAnswer: newCorrectAnswers
                        });
                      }}
                      style={{
                        padding: '4px 8px',
                        fontSize: '12px',
                        background: isTemplateLocked ? '#9ca3af' : '#ef4444',
                        color: 'white',
                        border: 'none',
                        borderRadius: '4px',
                        cursor: isTemplateLocked ? 'not-allowed' : 'pointer',
                        opacity: isTemplateLocked ? 0.6 : 1
                      }}
                      title={isTemplateLocked ? 'Cannot remove correct answer from template' : 'Remove last option'}
                    >
                      <FaMinus /> Remove Option
                    </button>
                  );
                })()}
              </div>
            </div>

            <div className="word-recognition-options-grid">
              {(pair.blankOptions || ['', '', '', '']).map((option, optionIndex) => {
                // Check if this option is the correct answer from template
                const isCorrectAnswer = (pair.correctAnswer || []).includes(option);
                const isFromTemplate = pair.sourceTemplateId && isCorrectAnswer;
                
                return (
                  <div key={optionIndex} className="word-recognition-option-item">
                    <input
                      type="text"
                      value={option}
                      onChange={(e) => {
                        // Don't allow editing correct answers from templates
                        if (isFromTemplate) return;
                        
                        const newValue = e.target.value;
                        // Strict validation: only allow letters (no numbers, symbols, or spaces)
                        if (newValue === '' || validateWordInput(newValue)) {
                          // Check for duplicates in other options
                          const currentOptions = pair.blankOptions || ['', '', '', ''];
                          const isDuplicate = currentOptions.some((existingOption, index) => 
                            index !== optionIndex && 
                            existingOption.toLowerCase() === newValue.toLowerCase() && 
                            existingOption.trim() !== ''
                          );

                          if (isDuplicate) {
                            // Clear the field and show error for duplicate option
                            const newOptions = [...currentOptions];
                            newOptions[optionIndex] = ''; // Clear the duplicate value
                            
                            updateQuestionChoicePair(pair.id, {
                              blankOptions: newOptions,
                              correctAnswer: pair.correctAnswer || []
                            });
                            
                            // Show error for duplicate option
                            setErrors(prev => ({
                              ...prev,
                              [`${pair.id}_option_${optionIndex}`]: 'This option already exists. Please enter a unique answer choice.'
                            }));
                            return;
                          }

                          const oldOption = option;
                          const newOptions = [...currentOptions];
                          newOptions[optionIndex] = newValue;

                          // Update correct answers if this option was marked as correct
                          let newCorrectAnswers = pair.correctAnswer || [];
                          if (newCorrectAnswers.includes(oldOption)) {
                            newCorrectAnswers = newCorrectAnswers.map(answer =>
                              answer === oldOption ? newValue : answer
                            ).filter(answer => answer !== ''); // Remove empty answers
                          }

                          updateQuestionChoicePair(pair.id, {
                            blankOptions: newOptions,
                            correctAnswer: newCorrectAnswers
                          });

                          // Clear any validation errors for this field
                          if (errors[`${pair.id}_option_${optionIndex}`]) {
                            setErrors(prev => {
                              const newErrors = { ...prev };
                              delete newErrors[`${pair.id}_option_${optionIndex}`];
                              return newErrors;
                            });
                          }
                        } else {
                          // Set validation error and prevent invalid input
                          setErrors(prev => ({
                            ...prev,
                            [`${pair.id}_option_${optionIndex}`]: 'Only letters and spaces are allowed (no numbers or symbols)'
                          }));
                        }
                      }}
                      onKeyDown={(e) => {
                        // Don't allow editing correct answers from templates
                        if (isFromTemplate) {
                          e.preventDefault();
                          return;
                        }
                        
                        // Allow letters and spaces, prevent numbers and symbols
                        const char = e.key;
                        const validPattern = /^[a-zA-ZÀ-ÿñÑ\s]$/;
                        if (!validPattern.test(char) && char !== 'Backspace' && char !== 'Delete' && char !== 'Tab' && char !== 'ArrowLeft' && char !== 'ArrowRight' && char !== 'ArrowUp' && char !== 'ArrowDown' && char.length === 1) {
                          e.preventDefault();
                        }
                      }}
                      placeholder={isFromTemplate ? "Correct answer from template" : "Option (letters and spaces allowed)"}
                      disabled={isFromTemplate}
                      className={`${errors[`${pair.id}_option_${optionIndex}`] ? 'literexia-error' : ''} ${isFromTemplate ? 'template-locked' : ''}`}
                      style={{
                        backgroundColor: isFromTemplate ? '#f3f4f6' : 'white',
                        cursor: isFromTemplate ? 'not-allowed' : 'text'
                      }}
                    />
                    {errors[`${pair.id}_option_${optionIndex}`] && (
                      <div className="literexia-error-message" style={{color: '#dc2626', fontSize: '11px', marginTop: '4px'}}>
                        {errors[`${pair.id}_option_${optionIndex}`]}
                      </div>
                    )}
                    <label className="word-recognition-correct-checkbox">
                      <input
                        type="radio"
                        name={`correct-answer-${pair.id}`}
                        checked={option !== '' && (pair.correctAnswer || []).includes(option)}
                        onChange={(e) => {
                          if (option === '') {
                            setNotification({
                              message: 'Please enter an option before marking it as correct',
                              type: 'warning'
                            });
                            return;
                          }

                          if (e.target.checked) {
                            // Word Recognition allows only ONE correct answer
                            updateQuestionChoicePair(pair.id, { correctAnswer: [option] });
                          }
                        }}
                        disabled={option === '' || (pair.sourceTemplateId && pair.questionSubType === 'sound_matching')} // Disable if empty or sound matching template
                        style={{
                          cursor: (pair.sourceTemplateId && pair.questionSubType === 'sound_matching') ? 'not-allowed' : 'pointer'
                        }}
                      />
                      <span style={{ 
                        color: (pair.sourceTemplateId && pair.questionSubType === 'sound_matching') ? '#6b7280' : 'inherit',
                        fontStyle: (pair.sourceTemplateId && pair.questionSubType === 'sound_matching') ? 'italic' : 'normal'
                      }}>
                        Correct Answer (select only one)
                        {pair.sourceTemplateId && pair.questionSubType === 'sentence_completion' && ' (editable)'}
                        {pair.sourceTemplateId && pair.questionSubType === 'sound_matching' && ' (from template)'}
                      </span>
                    </label>
                  </div>
                );
              })}
            </div>
            {pair.sourceTemplateId ? (
              <small style={{color: '#92400e', fontSize: '11px', marginTop: '8px', display: 'block', fontWeight: '500'}}>
                {pair.questionSubType === 'sentence_completion' 
                  ? 'Template provides base options - you can add/remove options, edit incorrect answers, and change the correct answer selection.'
                  : 'Template provides base options - you can add/remove options and edit incorrect answers. Correct answer selection is locked from template.'
                }
              </small>
            ) : (
              <small style={{color: '#92400e', fontSize: '11px', marginTop: '8px', display: 'block'}}>
                Enter answer choices and mark which ones are correct. Min 2 options required. Each option must be unique.
              </small>
            )}
          </div>

          {/* Correct Answer Preview */}
          <div style={{background: '#f0fdf4', padding: '12px', borderRadius: '4px', marginTop: '12px', border: '1px solid #10b981'}}>
            <h5 style={{margin: '0 0 8px 0', color: '#047857', fontSize: '14px', fontWeight: '600'}}>
              ✓ Correct Answer Preview
            </h5>
            <div style={{color: '#065f46', fontSize: '15px', fontWeight: '500', fontFamily: 'monospace', background: 'white', padding: '8px 12px', borderRadius: '4px', border: '1px solid #bbf7d0', minHeight: '40px', display: 'flex', alignItems: 'center'}}>
              {generateCorrectAnswerPreview(pair) || (
                <span style={{color: '#9ca3af', fontStyle: 'italic', fontSize: '13px'}}>
                  Preview will appear when you complete the question setup
                </span>
              )}
            </div>
            <small style={{color: '#047857', fontSize: '11px', marginTop: '4px', display: 'block', fontStyle: 'italic'}}>
              {generateCorrectAnswerPreview(pair)
                ? 'This shows how the correct answer will appear to students'
                : 'Complete the sentence/word, set blank position/answer options, and mark correct answer to see preview'
              }
            </small>
          </div>
        </div>
      ))}

      {/* Add Question Button */}
      <div className="word-recognition-add-section">
        <button
          type="button"
          className="word-recognition-add-question-btn"
          onClick={() => addQuestionChoicePair()}
          title="Add another question to this activity"
        >
          <FaPlus /> Add Another Question
        </button>
        <p style={{color: '#64748b', fontSize: '12px', marginTop: '8px', fontStyle: 'italic'}}>
          You can add multiple questions to create a complete activity
        </p>
      </div>
    </div>
  );
};

/**
 * Step 2: Question-Choice Pairs (Original)
 */
const renderQuestionChoicesStep = () => {
  return (
    <div className="literexia-form-section">
              <h3>Create Questions and Choices</h3>
              
      <div className="literexia-info-banner">
                <FaInfoCircle />
                <p>
          For each question, select exactly 2 choices and mark one as correct. 
          You can add choices from the template library or create new ones inline.
                </p>
              </div>
      
      {/* Validation errors now shown as toast notifications instead of banners */}
              
              {safe(questionChoicePairs).map((pair, index) => (
        <div key={pair.id} className="literexia-question-pair">
          <div className="literexia-question-pair-header">
                    <h4>Question {index + 1}</h4>
                    <button
                      type="button"
              className="literexia-remove-pair-btn"
              onClick={() => removeQuestionChoicePair(pair.id)}
                    >
                      <FaTrash /> Remove
                    </button>
                  </div>
                  
          {/* Template Selection */}
          <div className="literexia-question-template-selection">
            <label>Question Template</label>
            <select
              value={pair.sourceId || ''}
              onChange={(e) => setTemplateForPair(pair.id, e.target.value)}
            >
              <option value="">-- Select Template --</option>
              {safe(questionTemplates).map(template => (
                <option key={template._id} value={template._id}>
                  {template.templateText || template.questionText || 'Untitled Template'} ({template.questionType})
                  {template.questionValue ? ` - Value: "${template.questionValue}"` : ''}
                </option>
              ))}
            </select>
          </div>
          
          {/* Question Details */}
          <div className="literexia-question-details">
            <div className="literexia-form-row">
              <div className="literexia-form-group">
                <label>Question Text</label>
                <input
                  type="text"
                  value={pair.questionText || ''}
                  onChange={(e) => updateQuestionChoicePair(pair.id, 'questionText', e.target.value)}
                  readOnly={pair.sourceType === 'template_question'}
                  className={pair.sourceType === 'template_question' ? 'literexia-readonly-input' : ''}
                />
              </div>
            </div>
            
            <div className="literexia-form-group">
              <label>Question Value</label>
              <div className="literexia-help-text">
                You can set both Question Value and Question Image if needed.
              </div>
              {pair.sourceType === 'template_question' ? (
                // Dropdown for template questions
                <select
                  value={pair.questionValue || ''}
                  onChange={(e) => updateQuestionChoicePair(pair.id, 'questionValue', e.target.value)}
                  className="literexia-dropdown"
                >
                  <option value="">-- Select Value --</option>
                  {safe(choiceTemplates)
                    .filter(c => {
                      if (!c) return false;
                      // Filter by applicable choice types for current question
                      if (pair.sourceType === 'template_question' && pair.sourceId) {
                        const template = safe(questionTemplates).find(t => t && t._id === pair.sourceId);
                        return template ? safe(template.applicableChoiceTypes).includes(c.choiceType) : true;
                      }
                      return getApplicableChoiceTypes(pair.questionType).includes(c.choiceType);
                    })
                    .map(c => (
                      <option
                        key={c._id}
                        value={c.choiceValue || c.soundText || ''}
                      >
                        {c.choiceValue || c.soundText || '(No text)'} ({formatChoiceType(c.choiceType)})
                      </option>
                    ))}
                </select>
              ) : (
                // Datalist input for custom questions
                <input
                  list={`values-${pair.id}`}
                  value={pair.questionValue || ''}
                  onChange={(e) => updateQuestionChoicePair(pair.id, 'questionValue', e.target.value)}
                />
              )}
              <datalist id={`values-${pair.id}`}>
                {safe(choiceTemplates)
                  .filter(c => {
                    if (!c) return false;
                    // Filter by applicable choice types for current question
                    if (pair.sourceType === 'template_question' && pair.sourceId) {
                      const template = safe(questionTemplates).find(t => t && t._id === pair.sourceId);
                      return template ? safe(template.applicableChoiceTypes).includes(c.choiceType) : true;
                    }
                    return getApplicableChoiceTypes(pair.questionType).includes(c.choiceType);
                  })
                  .map(c => (
                    <option
                      key={c._id}
                      value={c.choiceValue || c.soundText}
                    />
                  ))}
              </datalist>
            </div>
            
            <div className="literexia-form-group">
              <label>Question Image</label>
              <div className="literexia-help-text">
                You can set both Question Image and Question Value if needed.
              </div>
              <div className="literexia-file-upload">
                <input
                  type="file"
                  id={`question-image-${pair.id}`}
                  ref={el => fileInputRefs.current[pair.id] = el}
                  onChange={(e) => handleFileChange(e, pair.id)}
                  accept="image/*"
                  style={{ display: 'none' }}
                />
                <div className="literexia-file-upload-controls">
                  {/* Allow editing images for all question types including assessment questions */}
                  <>
                    <button 
                      type="button" 
                      className="literexia-file-select-btn"
                      onClick={() => fileInputRefs.current[pair.id].click()}
                      disabled={fileUploads[pair.id]?.status === 'uploading'}
                    >
                      {fileUploads[pair.id]?.status === 'uploading' ? <FaSpinner className="fa-spin" /> : <FaPlus />} 
                      {pair.questionImage ? 'Change Image' : 'Upload Image'}
                    </button>
                    {pair.questionImage && (
                      <div className="literexia-image-preview">
                        <img src={pair.questionImage} alt="Question" />
                        {/* Only show remove button if not using a template */}
                        {!pair.sourceTemplateId && (
                          <button
                            type="button"
                            className="literexia-remove-image-btn"
                            onClick={() => updateQuestionChoicePair(pair.id, 'questionImage', null)}
                          >
                            <FaTimes />
                          </button>
                        )}
                      </div>
                    )}
                  </>
                  {fileUploads[pair.id]?.status === 'uploading' && <span className="literexia-uploading">Uploading...</span>}
                  {fileUploads[pair.id]?.status === 'pending' && (
                    <span className="literexia-pending">
                      <FaImage className="literexia-preview-icon" /> Image preview (will be uploaded when saving)
                    </span>
                  )}
                  {fileUploads[pair.id]?.status === 'error' && <span className="literexia-upload-error">Upload failed. Please try again.</span>}
                </div>
              </div>
            </div>
          </div>
          
          {/* Choices Section */}
          <div className="literexia-choices-selection">
            <div className="literexia-choices-header">
              <label>Answer Choices (Exactly 2 Required)</label>
              {isInlineCreationAllowed() && (
                <button
                  type="button"
                  className="literexia-create-choice-btn"
                  onClick={() => toggleChoiceForm(pair.id, !showNewChoiceFormByPair[pair.id])}
                  disabled={safe(pair.choiceIds).length >= 2}
                >
                  <FaPlus /> Add New Choice
                </button>
              )}
            </div>
            
            {/* Inline New Choice Form */}
            {isInlineCreationAllowed() && showNewChoiceFormByPair[pair.id] && (
              <div className="literexia-inline-form">
                <h5>Create New Choice</h5>
                <div className="literexia-form-row">
                  <div className="literexia-form-group">
                    <label>Choice Type</label>
                    <select
                      value={newChoiceData.choiceType}
                      onChange={(e) => setNewChoiceData(prev => ({
                        ...prev, choiceType: e.target.value
                      }))}
                    >
                      <option value="">Select Type</option>
                      {pair.sourceType === 'template_question' && pair.sourceId ? (
                        // For template questions, only show applicable choice types
                        (() => {
                          const template = questionTemplates.find(t => t._id === pair.sourceId);
                          return template ? template.applicableChoiceTypes.map(choiceType => (
                            <option key={choiceType} value={choiceType}>
                              {formatChoiceType(choiceType)}
                            </option>
                          )) : getApplicableChoiceTypes(pair.questionType).map(choiceType => (
                            <option key={choiceType} value={choiceType}>
                              {formatChoiceType(choiceType)}
                            </option>
                          ));
                        })()
                      ) : (
                        // For custom questions, show all applicable types for the question type
                        getApplicableChoiceTypes(pair.questionType).map(choiceType => (
                          <option key={choiceType} value={choiceType}>
                            {formatChoiceType(choiceType)}
                          </option>
                        ))
                      )}
                    </select>
                  </div>
                  
                  <div className="literexia-form-group">
                    <label>Choice Value</label>
                    <input
                      type="text"
                      value={newChoiceData.choiceValue}
                      onChange={(e) => setNewChoiceData(prev => ({
                        ...prev, choiceValue: e.target.value
                      }))}
                      placeholder="e.g., a, BOLA"
                    />
                  </div>
                </div>
                
                <div className="literexia-form-group">
                  <label>Sound Text (optional)</label>
                  <input
                    type="text"
                    value={newChoiceData.soundText}
                    onChange={(e) => setNewChoiceData(prev => ({
                      ...prev, soundText: e.target.value
                    }))}
                    placeholder="e.g., /ah/"
                  />
                </div>
                
                <div className="literexia-form-group">
                  <label>Description / Feedback (optional)</label>
                  <input
                    type="text"
                    value={newChoiceData.description}
                    onChange={(e) => setNewChoiceData(prev => ({
                      ...prev, description: e.target.value
                    }))}
                    placeholder="e.g., Correct! This is the right answer."
                  />
                  <div className="literexia-help-text">
                    Optional feedback shown to the student when they select this choice. If left empty, appropriate default feedback will be provided automatically.
                  </div>
                </div>
                
                {errors.newChoice && (
                  <div className="literexia-error-message">{errors.newChoice}</div>
                )}
                
                <div className="literexia-inline-form-actions">
                <button 
                   type="button" 
                   onClick={() => toggleChoiceForm(pair.id, false)}
                   className="literexia-cancel-btn"
                 >
                   Cancel
                 </button>
                 <button 
                   type="button" 
                   onClick={() => handleCreateNewChoice(pair.id)}
                   className="literexia-save-btn"
                   disabled={submitting}
                 >
                   {submitting ? <FaSpinner className="fa-spin" /> : 'Create Choice'}
                 </button>
               </div>
             </div>
           )}
           
           {/* Available Choices */}
           <div className="literexia-available-choices">
             <h5>Available Choices</h5>
             <div className="literexia-choice-tiles">
               {safe(choiceTemplates)
                 .filter(choice => {
                   if (!choice) return false;
                   // Filter by applicable choice types for current question
                   if (pair.sourceType === 'template_question' && pair.sourceId) {
                     const template = safe(questionTemplates).find(t => t && t._id === pair.sourceId);
                     return template ? safe(template.applicableChoiceTypes).includes(choice.choiceType) : true;
                   }
                   return getApplicableChoiceTypes(pair.questionType).includes(choice.choiceType);
                 })
                 .map(choice => (
                   <div 
                     key={choice._id}
                     className={`literexia-choice-tile ${
                       safe(pair.choiceIds).includes(choice._id) ? 'selected' : ''
                     } ${
                       safe(pair.choiceIds).length >= 2 && !safe(pair.choiceIds).includes(choice._id) ? 'disabled' : ''
                     }`}
                     onClick={() => {
                       // Allow clicking choices for both assessment and template questions
                       if (safe(pair.choiceIds).includes(choice._id)) {
                         removeChoiceFromPair(pair.id, choice._id);
                       } else if (safe(pair.choiceIds).length < 2) {
                         addChoiceToPair(pair.id, choice._id);
                       }
                     }}
                   >
                     <div className="literexia-choice-value">
                       {choice.choiceValue || choice.soundText || '(No text)'}
                     </div>
                     <div className="literexia-choice-type">
                       {formatChoiceType(choice.choiceType)}
                     </div>
                   </div>
                 ))}
             </div>
           </div>
           
           {/* Selected Choices */}
           <div className="literexia-selected-choices">
             <h5>Selected Choices ({safe(pair.choiceIds).length}/2)</h5>
             {!pair.choiceIds || safe(pair.choiceIds).length === 0 ? (
               <div className="literexia-empty-choices">
                          <p>No choices selected. Click on available choices above to add them.</p>
                        </div>
                      ) : (
               <div className="literexia-selected-choice-list">
                 {getChoicesByIds(pair.choiceIds).map((choice, choiceIndex) => {
                   if (!choice) return null;
                   
                   return (
                     <div
                       key={choice._id}
                       className={`literexia-selected-choice-item ${
                         choice._id === pair.correctChoiceId ? 'correct' : ''
                       }`}
                     >
                       <div className="literexia-choice-correct-indicator">
                                <input
                                  type="radio"
                                  name={`correct-choice-${pair.id}`}
                                  checked={choice._id === pair.correctChoiceId}
                                  onChange={() => setCorrectChoice(pair.id, choice._id)}
                                />
                                <label>Correct</label>
                              </div>
                              
                       <div className="literexia-selected-choice-content">
                         <div className="literexia-selected-choice-value">
                           {choice.choiceValue || choice.soundText || '(No text)'}
                         </div>
                         <div className="literexia-selected-choice-description">
                           <span className="literexia-description-label">Feedback (optional):</span> 
                           <input 
                             type="text"
                             value={choice.description || ''}
                             onChange={(e) => updateChoiceDescription(choice._id, e.target.value)}
                             placeholder="Add optional feedback for this choice..."
                             className="literexia-choice-description-input"
                           />
                         </div>
                       </div>
                       
                       <button
                         type="button"
                         className="literexia-remove-choice-btn"
                         onClick={() => removeChoiceFromPair(pair.id, choice._id)}
                         disabled={pair.sourceTemplateId && choice.isCorrect}
                         style={{
                           opacity: (pair.sourceTemplateId && choice.isCorrect) ? 0.5 : 1,
                           cursor: (pair.sourceTemplateId && choice.isCorrect) ? 'not-allowed' : 'pointer'
                         }}
                         title={(pair.sourceTemplateId && choice.isCorrect) ? 'Cannot remove correct answer from template' : 'Remove choice'}
                       >
                         <FaTrash />
                       </button>
                            </div>
                   );
                 })}
                        </div>
                      )}
             
             {/* Choice requirement warning */}
             {(!pair.choiceIds || safe(pair.choiceIds).length !== 2) && (
               <div className="literexia-choice-warning">
                 <FaExclamationTriangle />
                 <span>Exactly 2 choices are required for each question.</span>
               </div>
             )}
                    </div>
                  </div>
                </div>
              ))}
              
              <button
                type="button"
       className="literexia-add-question-btn"
       onClick={addQuestionChoicePair}
              >
                <FaPlus /> Add Another Question
              </button>
            </div>
 );
};

/**
* Step 3 Alternative: Sentence Preview (for Reading Comprehension)
*/
const renderSentencePreviewStep = () => {
 if (!selectedSentenceTemplate) {
   return (
     <div className="literexia-empty-state">
       <FaExclamationTriangle className="literexia-empty-icon" />
       <h3>No Reading Passage Selected</h3>
       <p>Please go back and select a reading passage.</p>
     </div>
   );
 }
 
 return (
   <div className="literexia-form-section">
     <h3>Preview Reading Passage</h3>
     
     <div className="literexia-sentence-preview">
       <div className="literexia-sentence-title">
         <h4>{selectedSentenceTemplate.title}</h4>
       </div>
       
       <div className="literexia-sentence-pages">
         <h5>Pages</h5>
         <div className="literexia-pages-list">
           {safe(selectedSentenceTemplate.sentenceText).map((page, index) => (
             <div key={index} className="literexia-page-item">
               <div className="literexia-page-number">{index + 1}</div>
               <div className="literexia-page-content">
                 <div className="literexia-page-image">
                   <img 
                     src={sanitizeImageUrl(page.image)} 
                     alt={`Page ${index + 1}`}
                     onError={(e) => {
                       console.error('Image failed to load:', page.image);
                       e.target.src = 'https://via.placeholder.com/400x300?text=Image+Not+Available';
                       e.target.alt = 'Image not available';
                     }} 
                   />
                 </div>
                 <div className="literexia-page-text">
                   <p>{page.text}</p>
                 </div>
               </div>
             </div>
           ))}
         </div>
       </div>
       
       <div className="literexia-sentence-questions">
         <h5>Questions</h5>
         <div className="literexia-questions-list">
           {safe(selectedSentenceTemplate.sentenceQuestions).map((question, index) => (
             <div key={index} className="literexia-question-item">
               <div className="literexia-question-number">{index + 1}</div>
               <div className="literexia-question-content">
                 <div className="literexia-question-text">
                   <p>{question.questionText}</p>
                 </div>
                 <div className="literexia-question-options">
                   <div className="literexia-correct-option">
                     <strong>Correct answer:</strong> {question.sentenceCorrectAnswer}
                   </div>
                   <div className="literexia-options-list">
                     <strong>Acceptable Answers:</strong>
                     <ul>
                       {safe(question.sentenceAcceptableAnswer).map((option, optIndex) => (
                         <li key={optIndex} className={option === question.sentenceCorrectAnswer ? 'correct-option' : ''}>
                           {option}
                         </li>
                       ))}
                     </ul>
                   </div>
                 </div>
               </div>
             </div>
           ))}
         </div>
       </div>
     </div>
   </div>
 );
};

/**
* Step 4: Review and Submit
*/
const renderReviewStep = () => {
 return (
   <div className="literexia-review-section">
     <h3>Review Activity</h3>
     
     <div className="literexia-info-banner">
       <FaInfoCircle />
       <p>
         Review your activity before saving. Once submitted, the activity will be available 
         for pushing to {student?.firstName || 'the student'}'s mobile device.
       </p>
     </div>
     
     {/* Basic Information Review */}
     <div className="literexia-review-card">
       <h4>Basic Information</h4>
       <div className="literexia-review-details">
         <div className="literexia-review-item">
           <span className="literexia-review-label">Title:</span>
           <span className="literexia-review-value">{title}</span>
         </div>
         <div className="literexia-review-item">
           <span className="literexia-review-label">Description:</span>
           <span className="literexia-review-value">{description}</span>
         </div>
         <div className="literexia-review-item">
           <span className="literexia-review-label">Category:</span>
           <span className="literexia-review-value">{formatCategoryName(category)}</span>
         </div>
         <div className="literexia-review-item">
           <span className="literexia-review-label">Reading Level:</span>
           <span className="literexia-review-value">{readingLevel}</span>
         </div>
       </div>
       
       <button 
         type="button" 
         className="literexia-edit-step-btn"
         onClick={() => setCurrentStep(1)}
       >
         <FaEdit /> Edit
       </button>
     </div>
   
     {/* Content Review */}
     {contentType === 'sentence' ? (
       <div className="literexia-review-card">
         <h4>Reading Passage</h4>
         <div className="literexia-review-summary">
           {!selectedSentenceTemplate ? (
             // Custom content summary - Show ALL activities
             <>
               {/* Overall Statistics */}
               <div className="rc-activity-stats" style={{ marginBottom: '24px' }}>
                 <div className="rc-stat-item">
                   <span className="rc-stat-icon">
                     <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                       <path d="M4 6H2v14c0 1.1.9 2 2 2h14v-2H4V6zm16-4H8c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zm-1 9H9V9h10v2zm-4 4H9v-2h6v2zm4-8H9V5h10v2z"/>
                     </svg>
                   </span>
                   <span><strong>Total Activities:</strong> {customReadingComprehensionActivities.length}</span>
                 </div>
                 <div className="rc-stat-item">
                   <span className="rc-stat-icon">
                     <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                       <path d="M14 2H6c-1.1 0-1.99.9-1.99 2L4 20c0 1.1.89 2 2 2h12c1.1 0 2-.9 2-2V8l-6-6zm2 16H8v-2h8v2zm0-4H8v-2h8v2zm-3-5V3.5L18.5 9H13z"/>
                     </svg>
                   </span>
                   <span><strong>Total Pages:</strong> {customReadingComprehensionActivities.reduce((total, activity) => total + (activity.storyPages?.length || 0), 0)}</span>
                 </div>
                 <div className="rc-stat-item">
                   <span className="rc-stat-icon">
                     <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                       <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 17h-2v-2h2v2zm2.07-7.75l-.9.92C13.45 12.9 13 13.5 13 15h-2v-.5c0-1.1.45-2.1 1.17-2.83l1.24-1.26c.37-.36.59-.86.59-1.41 0-1.1-.9-2-2-2s-2 .9-2 2H8c0-2.21 1.79-4 4-4s4 1.79 4 4c0 .88-.36 1.68-.93 2.25z"/>
                     </svg>
                   </span>
                   <span><strong>Total Questions:</strong> {customReadingComprehensionActivities.reduce((total, activity) => total + (activity.questions?.length || 0), 0)}</span>
                 </div>
               </div>
               
               {customReadingComprehensionActivities.length > 0 && (
                 <div className="literexia-passage-preview">
                   <div className="rc-section">
                     <h4 style={{ 
                       color: '#4A608A', 
                       fontSize: '18px', 
                       fontWeight: '700',
                       marginBottom: '20px',
                       display: 'flex',
                       alignItems: 'center',
                       gap: '12px'
                     }}>
                       <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                         <path d="M14 2H6c-1.1 0-1.99.9-1.99 2L4 20c0 1.1.89 2 2 2h12c1.1 0 2-.9 2-2V8l-6-6zm2 16H8v-2h8v2zm0-4H8v-2h8v2zm-3-5V3.5L18.5 9H13z"/>
                       </svg>
                       Activity Summary
                     </h4>
                     
                     <div className="rc-activities-container">
                       {customReadingComprehensionActivities.map((activity, index) => (
                         <div key={index} className="rc-activity-card">
                           <div className="rc-activity-header">
                             <div className="rc-activity-title">
                               <div className="page-number" style={{ 
                                 width: '40px', 
                                 height: '40px', 
                                 fontSize: '16px',
                                 marginRight: '12px'
                               }}>
                                 {index + 1}
                               </div>
                               <div>
                                 <h3 style={{ 
                                   margin: '0 0 4px 0', 
                                   fontSize: '18px', 
                                   fontWeight: '700', 
                                   color: '#1f2937' 
                                 }}>
                                   {activity.storyTitle || 'Untitled Story'}
                                 </h3>
                                 <p style={{ 
                                   margin: '0', 
                                   fontSize: '14px', 
                                   color: '#6b7280',
                                   fontWeight: '500'
                                 }}>
                                   Reading Comprehension Activity
                                 </p>
                               </div>
                             </div>
                             <div className="rc-activity-badge">
                               {activity.storyPages?.length || 0} Pages • {activity.questions?.length || 0} Questions
                             </div>
                           </div>
                           
                           {/* Story Pages Content */}
                           {activity.storyPages && activity.storyPages.length > 0 && (
                             <div className="rc-section rc-summary-section">
                               <h4 className="rc-summary-section-header">
                                 <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                                   <path d="M14 2H6c-1.1 0-1.99.9-1.99 2L4 20c0 1.1.89 2 2 2h12c1.1 0 2-.9 2-2V8l-6-6zm2 16H8v-2h8v2zm0-4H8v-2h8v2zm-3-5V3.5L18.5 9H13z"/>
                                 </svg>
                                 Story Pages
                               </h4>
                               
                               <div className="rc-summary-cards-container">
                                 {activity.storyPages.map((page, pageIndex) => (
                                   <div key={pageIndex} className="rc-story-page-card rc-summary-card">
                                     <div className="rc-card-header rc-summary-card-header">
                                       <div className="rc-summary-card-title-row">
                                         <div className="page-number rc-summary-page-number">
                                           {pageIndex + 1}
                                         </div>
                                         <h5 className="rc-card-title rc-summary-card-title">
                                           Page {pageIndex + 1}
                                         </h5>
                                       </div>
                                     </div>
                                     
                                     <div className="rc-form-group rc-summary-content-group">
                                       <p className="rc-summary-label">
                                         Content:
                                       </p>
                                       <div className="rc-summary-content-box">
                                         {page.text || 'No text content'}
                                       </div>
                                     </div>
                                     
                                     {page.image && (
                                       <div className="rc-summary-image-indicator">
                                         <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                                           <path d="M21 19V5c0-1.1-.9-2-2-2H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2zM8.5 13.5l2.5 3.01L14.5 12l4.5 6H5l3.5-4.5z"/>
                                         </svg>
                                         Image attached
                                       </div>
                                     )}
                                   </div>
                                 ))}
                               </div>
                             </div>
                           )}
                           
                           {/* Questions Content */}
                           {activity.questions && activity.questions.length > 0 && (
                             <div className="rc-section rc-summary-section">
                               <h4 className="rc-summary-section-header questions">
                                 <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                                   <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 17h-2v-2h2v2zm2.07-7.75l-.9.92C13.45 12.9 13 13.5 13 15h-2v-.5c0-1.1.45-2.1 1.17-2.83l1.24-1.26c.37-.36.59-.86.59-1.41 0-1.1-.9-2-2-2s-2 .9-2 2H8c0-2.21 1.79-4 4-4s4 1.79 4 4c0 .88-.36 1.68-.93 2.25z"/>
                                 </svg>
                                 Questions
                               </h4>
                               
                               <div className="rc-summary-cards-container">
                                 {activity.questions.map((question, questionIndex) => (
                                   <div key={questionIndex} className="rc-question-card rc-summary-card">
                                     <div className="rc-card-header rc-summary-card-header">
                                       <div className="rc-summary-card-title-row">
                                         <div className="question-number rc-summary-question-number">
                                           {questionIndex + 1}
                                         </div>
                                         <h5 className="rc-card-title rc-summary-card-title">
                                           Question {questionIndex + 1}
                                         </h5>
                                       </div>
                                     </div>
                                     
                                     <div className="rc-form-group rc-summary-content-group questions">
                                       <p className="rc-summary-label">
                                         Question Text:
                                       </p>
                                       <div className="rc-summary-content-box">
                                         {question.questionText || 'No question text'}
                                       </div>
                                     </div>
                                     
                                     {/* Correct Answer */}
                                     {question.correctAnswer && (
                                       <div className="rc-form-group rc-summary-content-group">
                                         <p className="rc-summary-label correct">
                                           Correct Answer:
                                         </p>
                                         <div className="rc-summary-content-box correct">
                                           {question.correctAnswer}
                                         </div>
                                       </div>
                                     )}
                                     
                                     {/* Acceptable Answers */}
                                     {question.acceptableAnswers && question.acceptableAnswers.length > 0 && (
                                       <div className="rc-form-group rc-summary-content-group last">
                                         <p className="rc-summary-label acceptable">
                                           Acceptable Answers:
                                         </p>
                                         <div className="rc-summary-content-box acceptable">
                                           {question.acceptableAnswers.map((answer, answerIndex) => (
                                             <div key={answerIndex} className={`rc-summary-answer-item ${answerIndex === question.acceptableAnswers.length - 1 ? 'last' : ''}`}>
                                               • "{answer}"
                                             </div>
                                           ))}
                                         </div>
                                       </div>
                                     )}
                                   </div>
                                 ))}
                               </div>
                             </div>
                           )}
                         </div>
                       ))}
                     </div>
                   </div>
                 </div>
               )}
             </>
           ) : (
             // Template content summary
             <>
               <p><strong>Title:</strong> {selectedSentenceTemplate?.title}</p>
               <p><strong>Pages:</strong> {selectedSentenceTemplate?.sentenceText?.length || 0}</p>
               <p><strong>Questions:</strong> {selectedSentenceTemplate?.sentenceQuestions?.length || 0}</p>
               
               {selectedSentenceTemplate && (
                 <div className="literexia-passage-preview">
                   <p className="literexia-passage-sample">
                     <strong>Sample text:</strong> "{selectedSentenceTemplate.sentenceText?.[0]?.text?.substring(0, 100) || ''}..."
                   </p>
                   <p className="literexia-question-sample">
                     <strong>Sample question:</strong> "{selectedSentenceTemplate.sentenceQuestions?.[0]?.questionText || ''}"
                   </p>
                 </div>
               )}
             </>
           )}
         </div>
         
         <button 
           type="button" 
           className="literexia-edit-step-btn"
           onClick={() => setCurrentStep(2)}
         >
           <FaEdit /> Change Passage
         </button>
       </div>
     ) : (
       <div className="literexia-review-card">
         <h4>Questions and Choices</h4>
         <div className="literexia-review-summary">
           <p>This activity has {safe(questionChoicePairs).length} question(s):</p>
           
           <div className="literexia-questions-summary">
             {safe(questionChoicePairs).map((pair, index) => {
               // Dynamic rendering based on category type
               const normCategory = normalizeCategory(category);

               return (
                 <div key={index} className="literexia-question-summary">
                   <p className="literexia-question-summary-text">
                     <strong>Q{index + 1}:</strong> {pair.questionText || 'No question text'}
                     {pair.questionValue && ` (${pair.questionValue})`}
                     {pair.questionImage && (
                       <span className="literexia-image-indicator">
                         <FaImage /> {fileUploads[pair.id]?.status === 'pending' ? 'Image preview (will be uploaded when saving)' : 'Has image'}
                       </span>
                     )}
                   </p>

                   {/* Category-specific content rendering */}
                   {normCategory === 'phonological_awareness' ? (
                     <div className="literexia-audio-visual-summary">
                       <p><strong>Audio-Visual Matching Pairs:</strong></p>
                       <div className="literexia-matching-pairs-review">
                         {pair.audioTexts?.filter(text => text && text.trim()).map((audioText, audioIndex) => {
                           // Generate matching text based on whether it's a single letter or word
                           let matchingText;
                           if (audioText.length === 1) {
                             // Single letter: L → Ll (uppercase + lowercase)
                             matchingText = audioText.toUpperCase() + audioText.toLowerCase();
                           } else {
                             // Word: Keep as is
                             matchingText = audioText;
                           }

                           return (
                             <div key={audioIndex} className="literexia-pair-review">
                               <span className="literexia-audio-text">
                                 <FaVolumeUp /> {audioText}
                               </span>
                               <span className="literexia-arrow">→</span>
                               <span className="literexia-visual-text">{matchingText}</span>
                             </div>
                           );
                         })}
                       </div>
                       {(!pair.audioTexts || pair.audioTexts.filter(text => text && text.trim()).length === 0) && (
                         <p className="literexia-no-content">No audio texts configured</p>
                       )}
                     </div>
                   ) : normCategory === 'alphabet_knowledge' ? (
                     <div className="literexia-choices-summary">
                       <p><strong>Choices:</strong></p>
                       <ul>
                         {safe(pair.choices || []).map((choice, choiceIndex) => (
                           <li
                             key={choiceIndex}
                             className={choice.isCorrect ? 'correct-choice' : ''}
                           >
                             {choice.optionText || '(No text)'}
                             {choice.isCorrect && ' (Correct)'}
                           </li>
                         ))}
                       </ul>
                     </div>
                   ) : normCategory === 'decoding' ? (
                     <div className="literexia-decoding-summary">
                       {/* Determine question type for display */}
                       {(() => {
                         const isTypeB = pair.displaySequence && pair.blankPosition !== undefined;
                         const questionType = isTypeB ? 'fill_missing_letter' : 'complete_word_identification';

                         if (questionType === 'complete_word_identification') {
                           // Type A: "Tukuyin ang nasa larawan?" - Complete word identification
                           const targetWord = pair.correctSequence ? pair.correctSequence.join('') : '';

                           return (
                             <div className="literexia-type-a-summary">
                               <p><strong>Type A - Complete Word Identification:</strong></p>
                               <div className="literexia-decoding-details">
                                 <div className="literexia-target-word">
                                   <span className="literexia-word-label">Target Word:</span>
                                   <span className="literexia-word-value">{targetWord || 'Not set'}</span>
                                 </div>
                                 <div className="literexia-drag-elements">
                                   <span className="literexia-elements-label">Available Letters:</span>
                                   <span className="literexia-elements-value">
                                     {pair.dragElements && pair.dragElements.length > 0
                                       ? pair.dragElements.join(', ')
                                       : 'No drag elements set'}
                                   </span>
                                 </div>
                                 <div className="literexia-activity-description">
                                   <span className="literexia-description-label">Activity:</span>
                                   <span className="literexia-description-text">
                                     Student will arrange ALL letters to spell "{targetWord}"
                                   </span>
                                 </div>
                               </div>
                             </div>
                           );
                         } else {
                           // Type B: "Buoin ang salita" - Fill in missing letter
                           const completedWord = (() => {
                             if (pair.displaySequence && pair.correctSequence && pair.correctSequence.length > 0) {
                               const display = [...pair.displaySequence];
                               const blankPos = pair.blankPosition !== undefined ? pair.blankPosition : 0;
                               if (display[blankPos] === '_') {
                                 display[blankPos] = pair.correctSequence[0];
                               }
                               return display.join('');
                             }
                             return 'Not configured';
                           })();

                           const blankDisplay = pair.displaySequence ? pair.displaySequence.join('') : 'Not set';
                           const missingLetter = pair.correctSequence && pair.correctSequence.length > 0 ? pair.correctSequence[0] : 'Not set';

                           return (
                             <div className="literexia-type-b-summary">
                               <p><strong>Type B - Fill Missing Letter:</strong></p>
                               <div className="literexia-decoding-details">
                                 <div className="literexia-complete-word">
                                   <span className="literexia-word-label">Complete Word:</span>
                                   <span className="literexia-word-value">{completedWord}</span>
                                 </div>
                                 <div className="literexia-display-sequence">
                                   <span className="literexia-display-label">Shown to Student:</span>
                                   <span className="literexia-display-value">{blankDisplay}</span>
                                 </div>
                                 <div className="literexia-missing-letter">
                                   <span className="literexia-missing-label">Missing Letter:</span>
                                   <span className="literexia-missing-value">{missingLetter}</span>
                                 </div>
                                 <div className="literexia-letter-choices">
                                   <span className="literexia-choices-label">Letter Choices:</span>
                                   <span className="literexia-choices-value">
                                     {pair.dragElements && pair.dragElements.length > 0
                                       ? pair.dragElements.join(', ')
                                       : 'No choices set'}
                                   </span>
                                 </div>
                                 <div className="literexia-activity-description">
                                   <span className="literexia-description-label">Activity:</span>
                                   <span className="literexia-description-text">
                                     Student will fill in the missing letter "{missingLetter}" to complete "{completedWord}"
                                   </span>
                                 </div>
                               </div>
                             </div>
                           );
                         }
                       })()}
                     </div>
                   ) : normCategory === 'word_recognition' ? (
                     <div className="word-recognition-review-summary">
                       {/* Determine question type for display */}
                       {(() => {
                         const isSoundMatching = pair.questionSubType === 'sound_matching' || 
                           (pair.questionText && pair.questionText.toLowerCase().includes('kasing tunog'));
                         const questionType = isSoundMatching ? 'sound_matching' : 'sentence_completion';

                         if (questionType === 'sentence_completion') {
                           // Sentence Completion: "Basahin ang pangungusap. Piliin ang tamang salita mula sa hanay."
                           const displayWord = pair.displayWord || 'Not set';
                           const sentencePreview = pair.sentenceTokens && pair.blankPosition !== null 
                             ? pair.sentenceTokens.map((token, index) => 
                                 index === pair.blankPosition ? '_____' : token
                               ).join(' ')
                             : displayWord;

                           return (
                             <div className="word-recognition-sentence-completion-review">
                               <p><strong>Type A - Sentence Completion:</strong></p>
                               <div className="word-recognition-review-details">
                                 <div className="word-recognition-sentence-display">
                                   <span className="word-recognition-label">Sentence:</span>
                                   <span className="word-recognition-sentence-text">{sentencePreview}</span>
                                 </div>
                                 <div className="word-recognition-answer-options">
                                   <span className="word-recognition-label">Answer Options:</span>
                                   <div className="word-recognition-options-list">
                                     {safe(pair.blankOptions || []).filter(option => option && option.trim()).map((option, optionIndex) => (
                                       <span 
                                         key={optionIndex} 
                                         className={`word-recognition-option ${(pair.correctAnswer || []).includes(option) ? 'correct-option' : ''}`}
                                       >
                                         {option}
                                         {(pair.correctAnswer || []).includes(option) && ' ✓'}
                                       </span>
                                     ))}
                                   </div>
                                 </div>
                                 <div className="word-recognition-activity-description">
                                   <span className="word-recognition-label">Activity:</span>
                                   <span className="word-recognition-description-text">
                                     Student will choose the correct word to complete the sentence
                                   </span>
                                 </div>
                               </div>
                             </div>
                           );
                         } else {
                           // Sound Matching: "Anong kasing tunog ng salitang nakikita?"
                           const displayWord = pair.displayWord || 'Not set';
                           const correctAnswer = pair.correctAnswer && pair.correctAnswer.length > 0 ? pair.correctAnswer[0] : 'Not set';

                           return (
                             <div className="word-recognition-sound-matching-review">
                               <p><strong>Type B - Sound Matching:</strong></p>
                               <div className="word-recognition-review-details">
                                 <div className="word-recognition-display-word">
                                   <span className="word-recognition-label">Display Word:</span>
                                   <span className="word-recognition-word-value">{displayWord}</span>
                                 </div>
                                 <div className="word-recognition-answer-options">
                                   <span className="word-recognition-label">Sound Options:</span>
                                   <div className="word-recognition-options-list">
                                     {safe(pair.blankOptions || []).filter(option => option && option.trim()).map((option, optionIndex) => (
                                       <span 
                                         key={optionIndex} 
                                         className={`word-recognition-option ${(pair.correctAnswer || []).includes(option) ? 'correct-option' : ''}`}
                                       >
                                         {option}
                                         {(pair.correctAnswer || []).includes(option) && ' ✓'}
                                       </span>
                                     ))}
                                   </div>
                                 </div>
                                 <div className="word-recognition-activity-description">
                                   <span className="word-recognition-label">Activity:</span>
                                   <span className="word-recognition-description-text">
                                     Student will match the sound of "{displayWord}" with the correct option
                                   </span>
                                 </div>
                                 {pair.questionImage && (
                                   <div className="word-recognition-image-info">
                                     <span className="word-recognition-label">Image:</span>
                                     <span className="word-recognition-image-status">
                                       <FaImage /> Image will be displayed with the word
                                     </span>
                                   </div>
                                 )}
                               </div>
                             </div>
                           );
                         }
                       })()}
                     </div>
                   ) : (
                     <div className="literexia-choices-summary">
                       <p><strong>Choices:</strong></p>
                       <ul>
                         {safe(getChoicesByIds(pair.choiceIds || [])).map((choice, choiceIndex) => {
                           if (!choice) return null;

                           const choiceDescription = choice.description || 'Default feedback will be provided';

                           return (
                             <li
                               key={choice._id}
                               className={choice._id === pair.correctChoiceId ? 'correct-choice' : ''}
                             >
                               {choice.choiceValue || choice.soundText || '(No text)'}
                               {choice._id === pair.correctChoiceId && ' (Correct)'}
                               <div className="literexia-choice-description-review">
                                 <span className="literexia-description-label">Feedback:</span> {choiceDescription}
                               </div>
                             </li>
                           );
                         })}
                       </ul>
                     </div>
                   )}
                 </div>
               );
             })}
           </div>
         </div>
         
         <button 
           type="button" 
           className="literexia-edit-step-btn"
           onClick={() => setCurrentStep(2)}
         >
           <FaEdit /> Edit Questions
         </button>
       </div>
     )}
     
     {/* Mobile Push Notice */}
     <div className="literexia-push-mobile-notice">
       <div className="literexia-notice-icon">
         <FaMobile />
       </div>
       <div className="literexia-notice-content">
         <h4>Ready to Save</h4>
         <p>
           This activity will be saved and can be pushed to {student?.firstName || 'the student'}'s 
           mobile device from the interventions list.
         </p>
       </div>
     </div>
   </div>
 );
};

// ===== HELPER FUNCTIONS FOR DISPLAY =====

const getCategoryDisplayName = (category) => {
 // Normalize the category
 const normCategory = normalizeCategory(category);
 
 const displayNames = {
   'alphabet_knowledge': 'Alphabet Knowledge (Letters & Sounds)',
   'phonological_awareness': 'Phonological Awareness (Syllables)',
   'word_recognition': 'Word Recognition',
   'decoding': 'Decoding',
   'reading_comprehension': 'Reading Comprehension (Passages)'
 };
 return displayNames[normCategory] || 'Unknown Category';
};

const getCategoryDescription = (category) => {
 // Normalize the category
 const normCategory = normalizeCategory(category);
 
 const descriptions = {
   'alphabet_knowledge': "This activity will focus on letter recognition, matching uppercase and lowercase letters, and letter sounds (patinig and katinig).",
   'phonological_awareness': "This activity will focus on syllable blending, identification, and manipulation (malapantig).",
   'word_recognition': "This activity will focus on recognizing whole words, matching words to images, or sounding out words.",
   'decoding': "This activity will focus on breaking down words into sounds, syllables, and letters to develop reading fluency.",
   'reading_comprehension': "This activity will include reading passages with supporting images, followed by comprehension questions about the text."
 };
 return descriptions[normCategory] || "General reading exercise to improve literacy skills.";
};

// ===== LOADING STATE =====
if (loading || checkingExisting) {
 return (
   <div className="literexia-modal-overlay">
     <div className="literexia-activity-edit-modal">
       <div className="literexia-loading-state">
         <FaSpinner className="literexia-spinner fa-spin" />
         <h3>Loading Activity Data...</h3>
         <p>Please wait while we load the templates and questions.</p>
       </div>
     </div>
   </div>
 );
}

// ===== MAIN RENDER =====
return (
 <div className="literexia-modal-overlay">
   {/* Hidden file input for image uploads */}
   <input
     type="file"
     ref={fileInputRef}
     style={{ display: 'none' }}
     accept="image/png,image/jpeg,image/jpg"
     onChange={handleFileSelect}
   />
   
   <div className="literexia-activity-edit-modal">
     {/* Modal Header */}
     <div className="literexia-modal-header">
       <div className="literexia-modal-title">
         <h2>
           {activity ? 'Edit' : 'Create'} Intervention Activity for {student?.firstName || 'Student'}
         </h2>
         <div className="literexia-student-badge">
           <FaUser /> {readingLevel}
         </div>
       </div>
       <button className="literexia-close-button" onClick={handleClose}>
         <FaTimes />
       </button>
     </div>
     
     {/* Error Banner */}
     {errors.general && (
       <div className="literexia-error-banner">
         <FaExclamationTriangle />
         <p>{errors.general}</p>
            </div>
          )}
          
     {/* Steps Indicator */}
     <div className="literexia-steps-indicator">
       <div className={`literexia-step ${currentStep >= 1 ? 'active' : ''}`} onClick={() => setCurrentStep(1)}>
         <div className="literexia-step-number">1</div>
         <div className="literexia-step-label">Basic Info</div>
       </div>
       <div className="literexia-step-connector"></div>

       <div
         className={`literexia-step ${currentStep >= 2 ? 'active' : ''}`}
         onClick={() => currentStep > 1 && setCurrentStep(2)}
       >
         <div className="literexia-step-number">2</div>
         <div className="literexia-step-label">
           {contentType === 'sentence' ? 'Select Passage' : 'Questions & Choices'}
         </div>
       </div>
       <div className="literexia-step-connector"></div>

         <div
           className={`literexia-step ${currentStep >= 3 ? 'active' : ''}`}
           onClick={() => currentStep > 2 && setCurrentStep(3)}
         >
           <div className="literexia-step-number">3</div>
           <div className="literexia-step-label">Review</div>
         </div>
       </div>
       
       {/* Modal Info Banner */}
       <div className="literexia-modal-info-banner">
         <FaInfoCircle />
         <p>
           This intervention activity will help address {student?.firstName || 'the student'}'s
           specific needs in {formatCategoryName(category)}. Create intervention questions using templates or custom content. All new questions automatically become reusable templates.
         </p>
       </div>
       
       {/* Form */}
       <form onSubmit={handleSubmit} className="literexia-edit-form">
         {renderStepContent()}
         
         {/* Form Navigation */}
         <div className="literexia-form-actions">
            {currentStep > 1 ? (
             <button type="button" className="literexia-cancel-btn" onClick={prevStep}>
                Back
              </button>
            ) : (
             <button type="button" className="literexia-cancel-btn" onClick={handleClose}>
                Cancel
              </button>
            )}
            
           <button type="submit" className="literexia-save-btn" disabled={submitting}>
              {submitting ? (
                <>
                 <FaSpinner className="literexia-spinner fa-spin" /> Processing...
                </>
              ) : currentStep < 3 ? (
                'Continue'
              ) : (
                <>
                 <FaSave /> Save Activity
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ActivityEditModal;