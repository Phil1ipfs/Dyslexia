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
 * 4. POST /api/upload/question-image (for S3 image uploads)
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
  FaChartLine,
  FaEdit,
  FaCheckCircle,
  FaPlus, 
  FaSpinner,
  FaTimes,
  FaUser,
  FaSave,
  FaArrowRight,
  FaTrash,
  FaMobile,
  FaLightbulb,
  FaHandsHelping,
  FaChalkboardTeacher,
  FaBookOpen,
  FaUpload,
  FaImage
} from 'react-icons/fa';
import api from '../../../services/Teachers/api';
import { toast } from '../../../utils/toastHelper';

import './css/ActivityEditModal.css';
import './css/AlphabetKnowledgeActivityEdit.css';

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
  const [readingLevel] = useState(student?.readingLevel || 'Low Emerging'); // Fixed to student's level
  
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
  
  // For Reading Comprehension
  const [selectedSentenceTemplate, setSelectedSentenceTemplate] = useState(null);
  
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
      
      // Check for valid choices in each question (using choiceOptions for CLAUDE.md format)
      interventionData.questions.forEach((question, index) => {
        if (!question.choiceOptions || !Array.isArray(question.choiceOptions)) {
          console.error(`[SAVE] ❌ Question ${index} choiceOptions validation failed:`, {
            question: question,
            choiceOptions: question.choiceOptions,
            choiceOptionsType: typeof question.choiceOptions,
            isArray: Array.isArray(question.choiceOptions)
          });
          throw new Error(`Question ${index} has invalid choiceOptions`);
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

        console.log(`✅ Question ${index} has ${safe(question.choices).length} valid choices`);
      });
      
      // Make the API call
      try {
        const response = await api.interventions.create(interventionData);
        console.log('Intervention creation response:', response.data);
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
   * Update an existing intervention
   * API: PUT /api/interventions/{id}
   */
  const updateIntervention = async (interventionId, interventionData) => {
    try {
      console.log(`Updating intervention ${interventionId}:`, interventionData);
      
      const response = await api.interventions.update(interventionId, interventionData);
      console.log('Intervention update response:', response.data);
      
      return response.data.data;
    } catch (error) {
      console.error('Error updating intervention:', error);
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
   * API: GET /api/interventions/templates/questions?category={category}
   */
  const loadQuestionTemplates = async () => {
    try {
      // Make the API call with proper authentication
      console.log('🔄 [TEMPLATE LOADING] Starting template load for category:', category);
      console.log('🔄 [TEMPLATE LOADING] API URL will be:', `/api/interventions/templates/questions?category=${category}`);

      const response = await api.interventions.getTemplateQuestions(category);
      console.log('🔄 [TEMPLATE LOADING] Raw API response:', response);
      console.log('🔄 [TEMPLATE LOADING] Response data:', response.data);
      console.log('🔄 [TEMPLATE LOADING] Response data.data:', response.data?.data);
      console.log('🔄 [TEMPLATE LOADING] Templates array length:', response.data?.data?.length || 0);

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
      setQuestionTemplates(templates);

      // Log state after setting
      setTimeout(() => {
        console.log('🔄 [TEMPLATE LOADING] questionTemplates state after setting:', questionTemplates);
      }, 100);

    } catch (error) {
      console.error('❌ [TEMPLATE LOADING] Error loading question templates:', error);
      setQuestionTemplates([]);
    }
  };
 
  /**
   * Load choice templates
   * API: GET /api/interventions/templates/choices
   */
  const loadChoiceTemplates = async () => {
    try {
      // Make the API call with proper authentication
      console.log('Loading choice templates:', `/api/interventions/templates/choices`);
      
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
   * API: GET /api/interventions/templates/sentences?readingLevel={level}
   */
  const loadSentenceTemplates = async () => {
    try {
      // Make the API call with proper authentication
      console.log('Loading sentence templates:', `/api/interventions/templates/sentences?readingLevel=${readingLevel}`);
      
      const response = await api.interventions.getSentenceTemplates(readingLevel);
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
   * API: POST /api/interventions/templates/questions
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
   * API: POST /api/interventions/templates/choices
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
   * @param {string} targetFolder - Target folder in S3 bucket (default: 'mobile')
   * @returns {Promise<string>} - The URL of the uploaded file
   */
  const uploadImageToS3 = async (file, targetFolder = 'mobile') => {
    try {
      setUploading(true);
      console.log(`[S3 UPLOAD] Starting upload process for file: ${file.name} (${file.type})`);
      console.log(`[S3 UPLOAD] Target folder: ${targetFolder}`);
      
      // Check if file is an image (png, jpg, jpeg)
      if (!file.type.match(/^image\/(jpeg|jpg|png)$/i)) {
        console.warn(`[S3 UPLOAD] File type not supported: ${file.type}. Only PNG, JPG, JPEG are allowed.`);
        throw new Error(`File type not supported: ${file.type}. Only PNG, JPG, JPEG are allowed.`);
      }
      
      // For development: Use real S3 upload but with extensive logging
      // Get pre-signed URL from server
      console.log(`[S3 UPLOAD] Requesting pre-signed URL for ${file.name}`);
      const response = await api.interventions.getUploadUrl(file.name, file.type, targetFolder);
      console.log('[S3 UPLOAD] Upload URL response:', response.data);
      
      // Use the pre-signed URL to upload directly to S3
      const { uploadUrl, fileUrl } = response.data.data; // Note: data is nested inside data
      
      console.log(`[S3 UPLOAD] Pre-signed URL obtained: ${uploadUrl}`);
      console.log(`[S3 UPLOAD] Expected file URL after upload: ${fileUrl}`);
      console.log(`[S3 UPLOAD] Starting direct upload to S3...`);
      
      try {
        console.log(`[S3 UPLOAD] Sending PUT request to S3 with content type: ${file.type}`);
        
        // Implement a retry mechanism (max 3 attempts)
        let uploadResponse;
        let lastError;
        let responseText = '';
        
        for (let attempt = 1; attempt <= 3; attempt++) {
          try {
            console.log(`[S3 UPLOAD] Attempt ${attempt} of 3...`);
            
            // The pre-signed URL already includes the necessary permissions (including ACL)
            // Don't add any custom headers that aren't signed with the URL
            uploadResponse = await fetch(uploadUrl, {
              method: 'PUT',
              body: file,
              headers: {
                'Content-Type': file.type
                // No x-amz-acl header - it's included in the pre-signed URL
              }
            });
            
            if (uploadResponse.ok) {
              console.log(`[S3 UPLOAD] Attempt ${attempt} successful!`);
              break; // Success, exit the retry loop
            }
            
            // If not successful, get the error response
            responseText = await uploadResponse.text();
            console.error(`[S3 UPLOAD] Attempt ${attempt} failed with status: ${uploadResponse.status}`);
            console.error(`[S3 UPLOAD] Error response: `, responseText);
            
            lastError = new Error(`Upload failed with status: ${uploadResponse.status}`);
            
            // Wait before retry (exponential backoff)
            if (attempt < 3) {
              const delay = attempt * 1000; // 1s, 2s
              console.log(`[S3 UPLOAD] Retrying in ${delay/1000} seconds...`);
              await new Promise(resolve => setTimeout(resolve, delay));
            }
          } catch (fetchError) {
            console.error(`[S3 UPLOAD] Fetch error on attempt ${attempt}:`, fetchError);
            lastError = fetchError;
            
            // Wait before retry
            if (attempt < 3) {
              const delay = attempt * 1000;
              console.log(`[S3 UPLOAD] Retrying in ${delay/1000} seconds...`);
              await new Promise(resolve => setTimeout(resolve, delay));
            }
          }
        }
        
        // After all retry attempts, check if we succeeded
        if (!uploadResponse || !uploadResponse.ok) {
          console.error(`[S3 UPLOAD] All upload attempts failed`);
          console.error(`[S3 UPLOAD] Last error response: `, responseText);
          
          // If in development mode, provide more helpful error information
          if (import.meta.env.DEV) {
            console.log(`[S3 UPLOAD] Debug tips for S3 upload failures:`);
            console.log(`1. Check that your S3 bucket CORS configuration allows PUT requests`);
            console.log(`2. Verify the pre-signed URL includes the ACL parameter`);
            console.log(`3. Check S3 bucket permissions and policies`);
          }
          
          throw lastError || new Error('Upload failed after multiple attempts');
        }
        
        console.log(`[S3 UPLOAD] ✅ File uploaded successfully to S3!`);
        console.log(`[S3 UPLOAD] File URL: ${fileUrl}`);
        
        // Verify the file is accessible by making a HEAD request
        try {
          console.log(`[S3 UPLOAD] Verifying file accessibility...`);
          const verifyResponse = await fetch(fileUrl, { method: 'HEAD' });
          if (verifyResponse.ok) {
            console.log(`[S3 UPLOAD] ✅ File verification successful - accessible at ${fileUrl}`);
          } else {
            console.warn(`[S3 UPLOAD] ⚠️ File verification failed - status: ${verifyResponse.status}`);
          }
        } catch (verifyError) {
          console.warn(`[S3 UPLOAD] ⚠️ Could not verify file: ${verifyError.message}`);
        }
        
        return fileUrl;
      } catch (fetchError) {
        console.error('[S3 UPLOAD] Error during file upload:', fetchError);

        // Show error in UI and reject upload
        setErrors(prev => ({
          ...prev,
          upload: `Failed to upload image: ${fetchError.message}`
        }));

        throw new Error(`Image upload failed: ${fetchError.message}`);
      }
    } catch (error) {
      console.error('[S3 UPLOAD] Error in uploadImageToS3:', error);

      // Show error in UI and reject upload
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
      
      // Upload to S3 in the mobile folder
      const imageUrl = await uploadImageToS3(file, 'mobile');
      
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
      if (currentUploadTarget && currentUploadTarget.type === 'question') {
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
   */
  const saveCustomQuestionsAsTemplates = async () => {
    try {
      console.log('[TEMPLATE AUTO-SAVE] Starting auto-save of custom questions as templates');

      // Only process Alphabet Knowledge questions for now
      const normCategory = normalizeCategory(category);
      if (normCategory !== 'alphabet_knowledge') {
        console.log('[TEMPLATE AUTO-SAVE] Skipping - not Alphabet Knowledge category');
        return;
      }

      // Filter custom questions (not from templates)
      const customQuestions = questionChoicePairs.filter(pair =>
        pair.sourceType === 'custom' && !pair.sourceTemplateId
      );

      if (customQuestions.length === 0) {
        console.log('[TEMPLATE AUTO-SAVE] No custom questions to save as templates');
        return;
      }

      console.log(`[TEMPLATE AUTO-SAVE] Found ${customQuestions.length} custom questions to convert to templates`);

      // Save each custom question as a template
      for (const pair of customQuestions) {
        try {
          const templateData = {
            category: category,
            questionType: pair.questionType || 'patinig',
            questionText: pair.questionText,
            questionImage: pair.questionImage,
            choiceOptions: pair.choices.map((choice, index) => ({
              optionId: (index + 1).toString(),
              optionText: choice.optionText,
              isCorrect: choice.isCorrect
            })),
            targetSkills: ["custom_teacher_created"],
            difficultyLevel: "medium",
            isActive: true
          };

          console.log(`[TEMPLATE AUTO-SAVE] Saving question as template: "${pair.questionText}"`);

          const response = await api.interventions.createTemplateQuestion(templateData);

          if (response.success) {
            console.log(`[TEMPLATE AUTO-SAVE] ✅ Successfully saved template: ${response.data._id}`);
          } else {
            console.warn(`[TEMPLATE AUTO-SAVE] ⚠️ Failed to save template: ${response.message}`);
          }

        } catch (templateError) {
          console.error(`[TEMPLATE AUTO-SAVE] Error saving individual template:`, templateError);
          // Continue with other questions even if one fails
        }
      }

      console.log('[TEMPLATE AUTO-SAVE] ✅ Auto-save process completed');

    } catch (error) {
      console.error('[TEMPLATE AUTO-SAVE] Error in auto-save process:', error);
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
        if (errors.sentenceTemplate) errorMessages.push("Please select a sentence template");
        if (errors.pairs) errorMessages.push("Please fill in all required question fields");
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
      
      // Prepare data for saving
      const interventionData = await prepareInterventionData();
      
      // Save intervention using the API
      let savedIntervention;
      
      try {
        if (activity?._id) {
          savedIntervention = await updateIntervention(activity._id, interventionData);
        } else {
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
      // For Reading Comprehension, use the sentence template according to CLAUDE.md
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
            recommendedQuestionCount: selectedSentenceTemplate.sentenceQuestions?.length || 1,
            intensityLevel: mongoDbAnalysis.researchBasedPrescriptions?.[category]?.interventionPrescription?.intensityLevel || "intensive",
            sessionStructure: mongoDbAnalysis.researchBasedPrescriptions?.[category]?.interventionPrescription?.sessionStructure || {
              optimalLength: "20-30 minutes",
              breakPattern: "Every 10 minutes"
            },
            specificTechniques: mongoDbAnalysis.researchBasedPrescriptions?.[category]?.interventionPrescription?.specificTechniques?.map(t => t.technique || t) || []
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
            recommendedQuestionCount: selectedSentenceTemplate.sentenceQuestions?.length || 1,
            intensityLevel: "intensive",
            sessionStructure: {
              optimalLength: "20-30 minutes",
              breakPattern: "Every 10 minutes"
            },
            specificTechniques: ["Systematic reading comprehension instruction", "Immediate corrective feedback"]
          },
          materialRecommendations: ["Teacher-selected sentence templates"]
        },

        // Teacher Implementation
        teacherImplementation: {
          implementedBy: localStorage.getItem('userId') || 'teacher_default',
          implementationDate: getFormattedDate(),
          prescriptionFollowed: true,
          questionDistribution: {
            total: selectedSentenceTemplate.sentenceQuestions?.length || 1,
            focusAreas: `Reading Comprehension - ${selectedSentenceTemplate.sentenceQuestions?.length || 1} passages`
          }
        },

        // Total questions count
        totalQuestions: selectedSentenceTemplate.sentenceQuestions?.length || 1,

        // Questions array
        questions: selectedSentenceTemplate.sentenceQuestions.map((q, index) => ({
          questionId: `int_reading_comprehension_${String(index + 1).padStart(3, '0')}`,
          source: 'sentence_template',
          sourceTemplateId: selectedSentenceTemplate._id,
          sourceQuestionId: selectedSentenceTemplate._id,
          questionIndex: index,
          questionType: 'sentence',
          questionText: q.questionText,
          questionImage: sanitizeImageUrl(q.image),
          questionValue: null,

          // Reading Comprehension specific structure
          sentenceQuestions: [{
            questionNumber: 1,
            questionText: q.questionText,
            sentenceCorrectAnswer: q.sentenceCorrectAnswer,
            sentenceOptionAnswers: q.sentenceOptionAnswers
          }],

          // Choices for compatibility
          choices: q.sentenceOptionAnswers.map((option, optIndex) => ({
            optionId: String(optIndex + 1),
            optionText: option,
            isCorrect: option === q.sentenceCorrectAnswer,
            description: option === q.sentenceCorrectAnswer ?
              'Correct! You understood the passage well.' :
              'Incorrect. Try reading the passage again carefully.'
          })),

          // Prescription alignment
          prescriptionAlignment: {
            targetSkill: "reading_comprehension",
            technique: "Systematic reading comprehension instruction",
            difficultyLevel: "standard",
            multisensoryElements: ["visual", "cognitive", "linguistic"]
          },

          createdBy: localStorage.getItem('userId') || 'teacher_default',
          createdAt: getFormattedDate()
        })),

        // Include the full sentence template for reference
        sentenceTemplate: selectedSentenceTemplate,

        // Versioning System
        revisionNumber: activity?.revisionNumber || 1,
        revisionHistory: activity?.revisionHistory || [{
          version: 1,
          editedBy: localStorage.getItem('userId') || 'teacher_default',
          editedAt: getFormattedDate(),
          changes: "Initial implementation of doctor's prescription",
          prescriptionCompliance: "full"
        }],
        lastEditedBy: localStorage.getItem('userId') || 'teacher_default',
        lastEditedAt: getFormattedDate(),

        // Intervention Parameters
        interventionParameters: {
          fixedQuestions: selectedSentenceTemplate.sentenceQuestions?.length || 1,
          allowSkip: false,
          showProgress: true,
          immediateFeeback: false
        },

        // Question Count Calculation
        questionCountCalculation: {
          finalCount: selectedSentenceTemplate.sentenceQuestions?.length || 1,
          rationale: `Teacher selected ${selectedSentenceTemplate.sentenceQuestions?.length || 1} reading comprehension passages`,
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
        createdBy: localStorage.getItem('userId') || 'teacher_default',
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
            intensityLevel: realAnalysisData.researchBasedPrescriptions?.[category]?.interventionPrescription?.intensityLevel ||
                          realAnalysisData.interventionPlan?.intensity ||
                          (realAnalysisData.skillMastery?.[category]?.score < 40 ? "highly_intensive" :
                           realAnalysisData.skillMastery?.[category]?.score < 60 ? "intensive" : "standard"),
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
                              return typeof t === 'string' ? t : t.technique || t;
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
            intensityLevel: "standard",
            sessionStructure: {
              optimalLength: "15-20 minutes",
              breakPattern: "Every 10 minutes"
            },
            specificTechniques: ["Teacher-created intervention based on observation"]
          },
          materialRecommendations: ["Teacher-created intervention questions"]
        },

        // Teacher Implementation
        teacherImplementation: {
          implementedBy: localStorage.getItem('userId') || 'teacher_default',
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
          // Check if this is Alphabet Knowledge (uses pair.choices) or other categories (uses choiceIds)
          const normCategory = normalizeCategory(category);
          const isAlphabetKnowledge = normCategory === 'alphabet_knowledge';

          // Get full choice objects for the selected choices
          const selectedChoices = isAlphabetKnowledge
            ? (pair.choices || [])  // Alphabet Knowledge uses pair.choices array
            : getChoicesByIds(pair.choiceIds); // Other categories use pair.choiceIds

          // Validate selectedChoices is not empty
          if (!selectedChoices || selectedChoices.length === 0) {
            console.error(`[SAVE] ❌ Question ${index} has no choices:`, {
              isAlphabetKnowledge,
              pairChoices: pair.choices,
              pairChoiceIds: pair.choiceIds,
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
          const isTemplateQuestion = pair.sourceType === 'template_question';

          return {
            questionId: questionId,
            source: pair.sourceType || 'custom',
            sourceTemplateId: isTemplateQuestion ? pair.sourceId : null,
            sourceQuestionId: pair.sourceId,
            questionIndex: index,
            questionType: pair.questionType,
            questionText: pair.questionText,
            questionImage: processedImageUrl,
            questionValue: pair.questionValue || (pair.questionImage ? pair.questionText?.split(' ').pop() || '' : ''),

            // Use choiceOptions for all categories (CLAUDE.md format)
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
            createdBy: localStorage.getItem('userId') || 'teacher_default',
            createdAt: getFormattedDate()
          };
        }),

        // Versioning System (required by CLAUDE.md)
        revisionNumber: activity?.revisionNumber || 1,
        revisionHistory: activity?.revisionHistory || [{
          version: 1,
          editedBy: localStorage.getItem('userId') || 'teacher_default',
          editedAt: getFormattedDate(),
          changes: "Initial implementation of doctor's prescription",
          prescriptionCompliance: "full"
        }],
        lastEditedBy: localStorage.getItem('userId') || 'teacher_default',
        lastEditedAt: getFormattedDate(),

        // Intervention Parameters
        interventionParameters: {
          fixedQuestions: questionChoicePairs.length,
          allowSkip: false,
          showProgress: true,
          immediateFeeback: false
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
        createdBy: localStorage.getItem('userId') || 'teacher_default',
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
    const defaultQuestionType = normCategory === 'alphabet_knowledge' ? 'patinig' : 
                                normCategory === 'phonological_awareness' ? 'malapantig' : 
                                normCategory === 'word_recognition' || normCategory === 'decoding' ? 'word' : 'sentence';
    
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

    const newPair = {
      id: generateUniqueId(),
      sourceType: 'custom',
      sourceId: null,
      questionType: defaultQuestionType,
      questionText: '',
      questionImage: null,
      questionValue: null,
      choiceIds: [],
      correctChoiceId: null,
      choices: defaultChoices  // Add choices array for Alphabet Knowledge
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
      console.warn(`Template not found: ${templateId}`);
      return;
    }

    console.log(`[TEMPLATE] Applying template "${template.templateText}" to question ${pairId}`);

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
   * Template Management
   */
  const setTemplateForPair = (pairId, templateId) => {
    setQuestionChoicePairs(prev => {
      return prev.map(pair => {
        if (pair.id === pairId) {
          // Find the selected template
          const template = questionTemplates.find(t => t._id === templateId);
          
          if (!template) {
            return pair;
          }
          
          // Reset choices when template changes
          return {
            ...pair,
            sourceType: 'template_question',
            sourceId: template._id,
            questionType: template.questionType,
            questionText: template.templateText,
            questionImage: null, // Templates don't have images
            questionValue: null, // Reset question value
            choiceIds: [], // Reset choices
            correctChoiceId: null // Reset correct choice
          };
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
 
  /**
   * Sentence Template Management
   */
  const handleSelectSentenceTemplate = (template) => {
    // Create a sanitized copy of the template with fixed image URLs
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
    
    setSelectedSentenceTemplate(sanitizedTemplate);
  };
 
  // ===== VALIDATION FUNCTIONS =====
 
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
        if (!selectedSentenceTemplate) {
          newErrors.sentenceTemplate = "A reading passage must be selected";
        }
      } else {
        if (safe(questionChoicePairs).length === 0) {
          newErrors.pairs = "At least one question must be added";
        }

        // Check if this is Alphabet Knowledge for specific validation
        const normCategory = normalizeCategory(category);

        if (normCategory === 'alphabet_knowledge') {
          // Validate Alphabet Knowledge questions
          const invalidPairs = questionChoicePairs.filter(pair => {
            if (!pair.choices || pair.choices.length !== 3) {
              return true; // Must have exactly 3 choices
            }
            const correctChoices = pair.choices.filter(choice => choice.isCorrect);
            return correctChoices.length !== 1; // Must have exactly 1 correct choice
          });

          if (invalidPairs.length > 0) {
            newErrors.pairs = "All questions must have exactly 3 choices with one marked as correct";
          }

          // Validate Question Value is required for Alphabet Knowledge
          const missingQuestionValue = questionChoicePairs.filter(pair =>
            !pair.sourceTemplateId && (!pair.questionValue || pair.questionValue.trim() === '')
          );

          if (missingQuestionValue.length > 0) {
            newErrors.questionValue = "Question Value is required for all Alphabet Knowledge questions";
          }

          // Validate Question Text is required for Alphabet Knowledge
          const missingQuestionText = questionChoicePairs.filter(pair =>
            !pair.sourceTemplateId && (!pair.questionText || pair.questionText.trim() === '')
          );

          if (missingQuestionText.length > 0) {
            newErrors.questionText = "Question Text is required for all Alphabet Knowledge questions";
          }
        } else {
          // Original validation for other categories
          const invalidPairs = questionChoicePairs.filter(pair =>
            safe(pair.choiceIds).length !== 2 || !pair.correctChoiceId
          );

          if (invalidPairs.length > 0) {
            newErrors.pairs = "All questions must have exactly 2 choices with one marked as correct";
          }
        }
        
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
    
    // Template validation
    if (contentType === 'sentence' && !selectedSentenceTemplate) {
      allErrors.sentenceTemplate = "A reading passage must be selected";
    }
    
    // Questions validation
    if (contentType !== 'sentence') {
      if (safe(questionChoicePairs).length === 0) {
        allErrors.pairs = "At least one question must be added";
      }

      // Check if this is Alphabet Knowledge for specific validation
      const normCategory = normalizeCategory(category);

      if (normCategory === 'alphabet_knowledge') {
        // Validate Alphabet Knowledge questions
        const invalidPairs = questionChoicePairs.filter(pair => {
          if (!pair.choices || pair.choices.length !== 3) {
            console.log(`[VALIDATION] Question ${pair.id}: Invalid choice count - has ${pair.choices?.length || 0}, needs 3`);
            return true; // Must have exactly 3 choices
          }

          // Check both isCorrect flags and correctChoiceId for validation
          const correctChoices = pair.choices.filter(choice => choice.isCorrect);
          const hasCorrectChoiceId = pair.correctChoiceId !== null && pair.correctChoiceId !== undefined;

          const isValid = correctChoices.length === 1 || hasCorrectChoiceId;

          if (!isValid) {
            console.log(`[VALIDATION] Question ${pair.id}: No correct answer - correctChoices: ${correctChoices.length}, correctChoiceId: ${pair.correctChoiceId}`);
          }

          // Valid if either has exactly 1 correct choice OR has a correctChoiceId
          return !isValid;
        });

        if (invalidPairs.length > 0) {
          console.log(`[VALIDATION] Found ${invalidPairs.length} invalid pairs for Alphabet Knowledge`);
          allErrors.pairs = "All questions must have exactly 3 choices with one marked as correct";
        }

        // Validate Question Value is required for Alphabet Knowledge
        const missingQuestionValue = questionChoicePairs.filter(pair =>
          !pair.sourceTemplateId && (!pair.questionValue || pair.questionValue.trim() === '')
        );

        if (missingQuestionValue.length > 0) {
          allErrors.questionValue = "Question Value is required for all Alphabet Knowledge questions";
        }

        // Validate Question Text is required for Alphabet Knowledge
        const missingQuestionText = questionChoicePairs.filter(pair =>
          !pair.sourceTemplateId && (!pair.questionText || pair.questionText.trim() === '')
        );

        if (missingQuestionText.length > 0) {
          allErrors.questionText = "Question Text is required for all Alphabet Knowledge questions";
        }
      } else {
        // Original validation for other categories
        const invalidPairs = questionChoicePairs.filter(pair =>
          pair.choiceIds.length !== 2 || !pair.correctChoiceId
        );

        if (invalidPairs.length > 0) {
          allErrors.pairs = "All questions must have exactly 2 choices with one marked as correct";
        }
      }
      
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
   * Sentence Template Selection (for Reading Comprehension)
   */
  const renderSentenceTemplateSelection = () => {
    return (
      <div className="literexia-form-section">
        <h3>Select a Reading Passage</h3>
        
        <div className="literexia-info-banner">
                <FaInfoCircle />
                <p>
            Choose a reading passage for this activity. Each passage includes text content, 
            supporting images, and comprehension questions tailored to the student's reading level.
                </p>
              </div>
              
        {errors.sentenceTemplate && (
          <div className="literexia-error-banner">
            <FaExclamationTriangle />
            <p>{errors.sentenceTemplate}</p>
          </div>
        )}
        
        <div className="literexia-sentence-templates-list">
          {safe(sentenceTemplates).length > 0 ? (
            safe(sentenceTemplates).map(template => (
              <div 
              key={template._id}
              className={`literexia-sentence-template-item ${
                selectedSentenceTemplate?._id === template._id ? 'selected' : ''
              }`}
                onClick={() => setSelectedSentenceTemplate(template)}
            >
              <div className="literexia-sentence-template-header">
                <h4>{template.title}</h4>
                <div className="literexia-sentence-template-level">
                  {template.readingLevel}
                      </div>
                    </div>
                    
              <div className="literexia-sentence-template-preview">
                <div className="literexia-sentence-image-preview">
                  <img src={template.sentenceText[0].image} alt="Passage" />
                      </div>
                <div className="literexia-sentence-text-preview">
                  <p>{template.sentenceText[0].text.length > 100 
                    ? template.sentenceText[0].text.substring(0, 100) + '...' 
                    : template.sentenceText[0].text}
                  </p>
                  <span className="literexia-sentence-stats">
                    {template.sentenceText.length} page{template.sentenceText.length !== 1 ? 's' : ''} • 
                    {template.sentenceQuestions.length} question{template.sentenceQuestions.length !== 1 ? 's' : ''}
                  </span>
                      </div>
                    </div>
                  </div>
          ))
        ) : (
          <div className="literexia-empty-state">
            <FaExclamationTriangle className="literexia-empty-icon" />
            <h3>No Reading Passages Available</h3>
            <p>No reading passages were found for the selected reading level.</p>
            </div>
          )}
      </div>
    </div>
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

      {errors.pairs && (
        <div className="literexia-error-banner">
          <FaExclamationTriangle />
          <p>{errors.pairs}</p>
        </div>
      )}

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
      
      {errors.pairs && (
        <div className="literexia-error-banner">
          <FaExclamationTriangle />
          <p>{errors.pairs}</p>
        </div>
      )}
              
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
                     <strong>Options:</strong>
                     <ul>
                       {safe(question.sentenceOptionAnswers).map((option, optIndex) => (
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
               // Check if this is Alphabet Knowledge (uses pair.choices) or other categories (uses choiceIds)
              const normCategory = normalizeCategory(category);
              const isAlphabetKnowledge = normCategory === 'alphabet_knowledge';

              let choices;

              if (isAlphabetKnowledge) {
                // For Alphabet Knowledge, choices are in pair.choices array
                choices = pair.choices || [];
              } else {
                // For other categories, use the old choiceIds system
                choices = getChoicesByIds(pair.choiceIds || []);
              }
               
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
                   <div className="literexia-choices-summary">
                     <p><strong>Choices:</strong></p>
                     <ul>
                       {safe(choices).map((choice, choiceIndex) => {
                         if (!choice) return null;
                         
                         // Check if this is Alphabet Knowledge
                         const normCategory = normalizeCategory(category);
                         const isAlphabetKnowledge = normCategory === 'alphabet_knowledge';

                         if (isAlphabetKnowledge) {
                           // Alphabet Knowledge choice rendering
                           return (
                             <li
                               key={choiceIndex}
                               className={choice.isCorrect ? 'correct-choice' : ''}
                             >
                               {choice.optionText || '(No text)'}
                               {choice.isCorrect && ' (Correct)'}
                             </li>
                           );
                         }

                         // Make sure we correctly extract and display the description
                         const choiceDescription = choice.description || 'Default feedback will be provided';
                         
                         console.log(`Rendering choice ${choiceIndex} for Q${index+1}:`, { 
                           choiceValue: choice.choiceValue || choice.soundText, 
                           isCorrect: choice._id === pair.correctChoiceId,
                           description: choice.description ? choice.description : '(using default)'
                         });
                         
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
       <button className="literexia-close-button" onClick={onClose}>
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
             <button type="button" className="literexia-cancel-btn" onClick={onClose}>
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