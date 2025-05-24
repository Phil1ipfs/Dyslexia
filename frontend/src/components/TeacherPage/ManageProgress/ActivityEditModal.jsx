/**
* ActivityEditModal Component
* 
* BACKEND INTEGRATION NOTES:
* 
* API ENDPOINTS NEEDED:
* 1. GET /api/main-assessment/questions?category={category}&readingLevel={level}
* 2. GET /api/templates/questions?category={category}
* 3. GET /api/templates/choices?choiceTypes={types}
* 4. GET /api/templates/sentences?readingLevel={level}
* 5. POST /api/templates/questions (for inline creation)
* 6. POST /api/templates/choices (for inline creation)
* 7. POST /api/upload/question-image (for S3 image uploads)
* 8. GET /api/interventions/check?studentId={id}&category={category} (to check for duplicates)
* 9. POST /api/interventions (to save intervention)
* 10. PUT /api/interventions/{id} (to update intervention)
* 
* DATA FLOW:
* 1. Load main assessment questions based on category + reading level
* 2. Load available templates for question creation (restricted by category)
* 3. Allow inline creation of new templates and choices (except for Reading Comprehension)
* 4. Enforce exactly 2 choices per question
* 5. Check for existing interventions before saving to prevent duplicates
* 6. Save final intervention to intervention_assessment collection
* 
* JSON COLLECTIONS REFERENCED:
* - main_assessment: Source questions for the category/level
* - templates_questions: Reusable question templates
* - templates_choices: Available answer choices
* - sentence_templates: Reading comprehension passages
* - intervention_assessment: Final saved interventions
* 
* @param {Object} activity - Existing activity to edit (from intervention_assessment)
* @param {Function} onClose - Function to close the modal
* @param {Function} onSave - Function to save the activity
* @param {Object} student - Student information (from users collection)
* @param {String} category - Category that needs intervention (score < 75%)
* @param {Object} analysis - Prescriptive analysis for this category
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

// Utility function to normalize category names
const normalizeCategory = (rawCategory = '') => {
  return typeof rawCategory === 'string' 
    ? rawCategory.toLowerCase().replace(/\s+/g, '_')
    : '';
};

// Helper function to format category name - moved outside component
const formatCategoryName = (categoryName) => {
  if (!categoryName) return "Unknown Category";
  
  return categoryName
    .replace(/_/g, ' ')
    .replace(/\b\w/g, l => l.toUpperCase());
};

const ActivityEditModal = ({ activity, onClose, onSave, student, category, analysis }) => {
  // ===== STATE MANAGEMENT =====
  
  // Basic activity information
  const [title, setTitle] = useState(
    activity?.name || 
    `Intervention for ${student?.firstName || 'Student'}`
  );
  const [description, setDescription] = useState(
    activity?.description || 
    `Targeted practice activities to improve skills`
  );
  const [readingLevel] = useState(student?.readingLevel || 'Low Emerging'); // Fixed to student's level
  
  // Checking for existing interventions
  const [existingIntervention, setExistingIntervention] = useState(null);
  const [checkingExisting, setCheckingExisting] = useState(false);
  
  // Update title and description after component mounts
  useEffect(() => {
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
  }, [activity, category, student]);
  
  // Step management for wizard-style interface
  const [currentStep, setCurrentStep] = useState(1);
  
  // Content type is determined by category
  const [contentType, setContentType] = useState('');
  
  // API Data States
  const [mainAssessmentQuestions, setMainAssessmentQuestions] = useState([]);
  const [availableQuestionTemplates, setAvailableQuestionTemplates] = useState([]);
  const [availableChoiceTemplates, setAvailableChoiceTemplates] = useState([]);
  const [availableSentenceTemplates, setAvailableSentenceTemplates] = useState([]);
  
  // Question Management
  const [questionChoicePairs, setQuestionChoicePairs] = useState([]);
  
  // For Reading Comprehension
  const [selectedSentenceTemplate, setSelectedSentenceTemplate] = useState(null);
  
  // Image Upload State
  const [uploadingImage, setUploadingImage] = useState(false);
  const [currentUploadTarget, setCurrentUploadTarget] = useState(null);
  const fileInputRef = useRef(null);
  
  // Inline Creation States
  const [showNewTemplateForm, setShowNewTemplateForm] = useState(false);
  const [showNewChoiceForm, setShowNewChoiceForm] = useState(false);
  const [newTemplateData, setNewTemplateData] = useState({
    templateText: '',
    questionType: '',
    applicableChoiceTypes: []
  });
  const [newChoiceData, setNewChoiceData] = useState({
    choiceType: '',
    choiceValue: '',
    choiceImage: '',
    soundText: ''
  });
  
  // UI States
  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [loading, setLoading] = useState(false);
  
  // File upload states
  const [fileUploads, setFileUploads] = useState({});
  const [uploading, setUploading] = useState(false);
  const fileInputRefs = useRef({});
  
  // ===== EFFECTS =====
  
  /**
   * Initialize content type based on category
   */
  useEffect(() => {
    if (category) {
      // Normalize the category
      const normCategory = normalizeCategory(category);
      
      // Set content type based on category
      if (normCategory === 'alphabet_knowledge') {
        setContentType('alphabet');
      } else if (normCategory === 'phonological_awareness') {
        setContentType('phonological');
      } else if (normCategory === 'word_recognition' || normCategory === 'decoding') {
        setContentType('word');
      } else if (normCategory === 'reading_comprehension') {
        setContentType('sentence');
      }
    }
  }, [category]);
  
  /**
   * Load initial data when component mounts
   */
  useEffect(() => {
    if (category && readingLevel && contentType) {
      loadInitialData();
    }
  }, [category, readingLevel, contentType]);
  
  /**
   * Initialize from existing activity data if editing
   */
  useEffect(() => {
    if (activity && activity.questions && activity.questions.length > 0) {
      initializeFromExistingActivity();
    }
  }, [activity, availableChoiceTemplates]);
 
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
      
      setNewTemplateData({
        templateText: '',
        questionType: defaultQuestionType,
        applicableChoiceTypes: defaultChoiceTypes.length > 0 ? [defaultChoiceTypes[0]] : []
      });
    }
  }, [showNewTemplateForm, category]);
 
  // ===== API FUNCTIONS =====
 
  /**
   * Check for existing interventions for this student/category
   * API: GET /api/interventions/check?studentId={id}&category={category}
   */
  const checkExistingInterventions = async () => {
    try {
      setCheckingExisting(true);
      // TODO: Replace with actual API call
      // const response = await fetch(`/api/interventions/check?studentId=${student._id}&category=${category}`);
      // const data = await response.json();
      
      // Mock API call - replace with actual implementation
      await new Promise(resolve => setTimeout(resolve, 500));
      const data = { exists: false, intervention: null };
      
      if (data.exists) {
        setExistingIntervention(data.intervention);
      }
    } catch (error) {
      console.error("Error checking existing interventions:", error);
    } finally {
      setCheckingExisting(false);
    }
  };
  
  /**
   * Load all initial data needed for the modal
   */
  const loadInitialData = async () => {
    setLoading(true);
    try {
      if (contentType === 'sentence') {
        // For Reading Comprehension, load sentence templates
        await loadSentenceTemplates();
      } else {
        // For other categories, load questions, templates, and choices
        await Promise.all([
          loadMainAssessmentQuestions(),
          loadQuestionTemplates(),
          loadChoiceTemplates()
        ]);
      }
    } catch (error) {
      console.error("Error loading initial data:", error);
      setErrors({ general: "Failed to load data. Please try again." });
    } finally {
      setLoading(false);
    }
  };
 
  /**
   * Load main assessment questions for this category and reading level
   * API: GET /api/main-assessment/questions?category={category}&readingLevel={level}
   */
  const loadMainAssessmentQuestions = async () => {
    try {
      // TODO: Replace with actual API call
      // const response = await fetch(`/api/main-assessment/questions?category=${category}&readingLevel=${readingLevel}`);
      // const questions = await response.json();
      
      // Mock API call - replace with actual implementation
      const questions = await mockFetchMainAssessmentQuestions(category, readingLevel);
      setMainAssessmentQuestions(questions);
      
      // Initialize question-choice pairs with main assessment questions
      if (questions.length > 0 && questionChoicePairs.length === 0) {
        const initialPairs = questions.map(question => ({
          id: Date.now() + Math.random(),
          sourceType: 'main_assessment',
          sourceId: question._id,
          questionType: question.questionType,
          questionText: question.questionText,
          questionImage: question.questionImage,
          questionValue: question.questionValue,
          choiceIds: [], // Will be populated from templates_choices
          correctChoiceId: null,
          // Keep original choices for reference
          originalChoices: question.choiceOptions
        }));
        
        setQuestionChoicePairs(initialPairs);
      }
    } catch (error) {
      console.error("Error loading main assessment questions:", error);
      throw error;
    }
  };
 
  /**
   * Load question templates for this category
   * API: GET /api/templates/questions?category={category}
   */
  const loadQuestionTemplates = async () => {
    try {
      // TODO: Replace with actual API call
      // const response = await fetch(`/api/templates/questions?category=${category}`);
      // const templates = await response.json();
      
      // Mock API call - replace with actual implementation
      const templates = await mockFetchQuestionTemplates(category);
      setAvailableQuestionTemplates(templates);
    } catch (error) {
      console.error("Error loading question templates:", error);
      throw error;
    }
  };
 
  /**
   * Load choice templates
   * API: GET /api/templates/choices
   */
  const loadChoiceTemplates = async () => {
    try {
      // TODO: Replace with actual API call
      // const response = await fetch('/api/templates/choices');
      // const choices = await response.json();
      
      // Mock API call - replace with actual implementation
      const choices = await mockFetchChoiceTemplates();
      setAvailableChoiceTemplates(choices);
    } catch (error) {
      console.error("Error loading choice templates:", error);
      throw error;
    }
  };
 
  /**
   * Load sentence templates for reading comprehension
   * API: GET /api/templates/sentences?readingLevel={level}
   */
  const loadSentenceTemplates = async () => {
    try {
      // TODO: Replace with actual API call
      // const response = await fetch(`/api/templates/sentences?readingLevel=${readingLevel}`);
      // const templates = await response.json();
      
      // Mock API call - replace with actual implementation
      const templates = await mockFetchSentenceTemplates(readingLevel);
      setAvailableSentenceTemplates(templates);
    } catch (error) {
      console.error("Error loading sentence templates:", error);
      throw error;
    }
  };
 
  /**
   * Create new question template inline
   * API: POST /api/templates/questions
   */
  const createNewQuestionTemplate = async (templateData) => {
    try {
      // Normalize the category
      const normCategory = normalizeCategory(category);
      
      // TODO: Replace with actual API call
      // const response = await fetch('/api/templates/questions', {
      //   method: 'POST',
      //   headers: { 'Content-Type': 'application/json' },
      //   body: JSON.stringify({
      //     category: normCategory,
      //     questionType: templateData.questionType,
      //     templateText: templateData.templateText,
      //     applicableChoiceTypes: templateData.applicableChoiceTypes,
      //     createdBy: currentTeacherId, // TODO: Get from auth context
      //     createdAt: new Date().toISOString(),
      //     updatedAt: new Date().toISOString()
      //   })
      // });
      // const newTemplate = await response.json();
      
      // Mock API call - replace with actual implementation
      const newTemplate = {
        _id: `new_template_${Date.now()}`,
        category: normCategory,
        questionType: templateData.questionType,
        templateText: templateData.templateText,
        applicableChoiceTypes: templateData.applicableChoiceTypes,
        createdBy: "current_teacher_id", // TODO: Get from auth
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
      
      // Add to available templates
      setAvailableQuestionTemplates(prev => [...prev, newTemplate]);
      
      return newTemplate;
    } catch (error) {
      console.error("Error creating question template:", error);
      throw error;
    }
  };
 
  /**
   * Create new choice template inline
   * API: POST /api/templates/choices
   */
  const createNewChoiceTemplate = async (choiceData) => {
    try {
      // TODO: Replace with actual API call
      // const response = await fetch('/api/templates/choices', {
      //   method: 'POST',
      //   headers: { 'Content-Type': 'application/json' },
      //   body: JSON.stringify({
      //     choiceType: choiceData.choiceType,
      //     choiceValue: choiceData.choiceValue,
      //     choiceImage: choiceData.choiceImage,
      //     soundText: choiceData.soundText,
      //     createdBy: currentTeacherId, // TODO: Get from auth context
      //     createdAt: new Date().toISOString(),
      //     updatedAt: new Date().toISOString()
      //   })
      // });
      // const newChoice = await response.json();
      
      // Mock API call - replace with actual implementation
      const newChoice = {
        _id: `new_choice_${Date.now()}`,
        choiceType: choiceData.choiceType,
        choiceValue: choiceData.choiceValue,
        choiceImage: choiceData.choiceImage,
        soundText: choiceData.soundText,
        createdBy: "current_teacher_id", // TODO: Get from auth
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
      
      // Add to available choices
      setAvailableChoiceTemplates(prev => [...prev, newChoice]);
      
      return newChoice;
    } catch (error) {
      console.error("Error creating choice template:", error);
      throw error;
    }
  };

  /**
   * Upload image to S3
   * API: POST /api/upload/question-image
   */
  const uploadImageToS3 = async (file) => {
    try {
      // In a real implementation, you would:
      // 1. Call your backend API to get a pre-signed URL
      // 2. Upload directly to S3 using that URL
      // 3. Return the final S3 URL for the image
      
      // For now, just simulate an upload delay and return a mock URL
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Mock S3 URL - in real implementation, this would come from the backend
      return `https://literexia-bucket.s3.ap-southeast-2.amazonaws.com/uploads/${file.name}`;
    } catch (error) {
      console.error("Error uploading image:", error);
      throw error;
    }
  };
 
  // ===== MOCK API FUNCTIONS =====
  // TODO: Remove these when connecting to real backend
 
  const mockFetchMainAssessmentQuestions = async (category, readingLevel) => {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 500));
    
    // Convert reading level from UI format to database format
    const dbReadingLevel = readingLevel.replace(/ /g, '_').toLowerCase();
    
    // Normalize category
    const normCategory = normalizeCategory(category);
    
    // Mock data based on test.main_assessment.json structure
    const allQuestions = [
      // Low Emerging - Alphabet Knowledge
      {
        _id: "68298fb179a34741f9cd1a01-1",
        questionType: "patinig",
        questionText: "Anong katumbas na maliit na letra?",
        questionImage: "https://literexia-bucket.s3.ap-southeast-2.amazonaws.com/letters/A_big.png",
        questionValue: "A",
        choiceOptions: [
          { optionText: "a", isCorrect: true },
          { optionText: "e", isCorrect: false }
        ],
        order: 1,
        category: "alphabet_knowledge",
        readingLevel: "low_emerging"
      },
      {
        _id: "68298fb179a34741f9cd1a01-2",
        questionType: "patinig",
        questionText: "Anong katumbas na maliit na letra?",
        questionImage: "https://literexia-bucket.s3.ap-southeast-2.amazonaws.com/letters/E_big.png",
        questionValue: "E",
        choiceOptions: [
          { optionText: "e", isCorrect: true },
          { optionText: "a", isCorrect: false }
        ],
        order: 2,
        category: "alphabet_knowledge",
        readingLevel: "low_emerging"
      },
      
      // Phonological Awareness
      {
        _id: "68298fb179a34741f9cd1a02-1",
        questionType: "malapantig",
        questionText: "Kapag pinagsama ang mga pantig, ano ang mabubuo?",
        questionImage: null,
        questionValue: "BO + LA",
        choiceOptions: [
          { optionText: "BOLA", isCorrect: true },
          { optionText: "LABO", isCorrect: false }
        ],
        order: 1,
        category: "phonological_awareness",
        readingLevel: "low_emerging"
      },
      
      // Word Recognition
      {
        _id: "68298fb179a34741f9cd1a03-1",
        questionType: "word",
        questionText: "Tukuyin ang angkop na salita sa larawan",
        questionImage: "https://literexia-bucket.s3.ap-southeast-2.amazonaws.com/words/ball.png",
        questionValue: null,
        choiceOptions: [
          { optionText: "BOLA", isCorrect: true },
          { optionText: "LABO", isCorrect: false }
        ],
        order: 1,
        category: "word_recognition",
        readingLevel: "low_emerging"
      },
      
      // Decoding
      {
        _id: "68298fb179a34741f9cd1a04-1",
        questionType: "word",
        questionText: "Paano babaybayin ang salitang ito?",
        questionImage: "https://literexia-bucket.s3.ap-southeast-2.amazonaws.com/words/dog.png",
        questionValue: null,
        choiceOptions: [
          { optionText: "A-S-O", isCorrect: true },
          { optionText: "A-S-A", isCorrect: false }
        ],
        order: 1,
        category: "decoding",
        readingLevel: "low_emerging"
      }
    ];
    
    // Filter by category and reading level
    return allQuestions.filter(
      q => q.category === normCategory && q.readingLevel === dbReadingLevel
    );
  };
 
  const mockFetchQuestionTemplates = async (category) => {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 500));
    
    // Normalize category
    const normCategory = normalizeCategory(category);
    
    // Mock data based on test.templates_questions.json structure
    const allTemplates = [
      {
        _id: "6829799079a34741f9cd19ef",
        category: "alphabet_knowledge",
        questionType: "patinig",
        templateText: "Anong katumbas na maliit na letra?",
        applicableChoiceTypes: ["patinigBigLetter", "patinigSmallLetter"]
      },
      {
        _id: "6829799079a34741f9cd19f0",
        category: "alphabet_knowledge",
        questionType: "patinig",
        templateText: "Anong katumbas na malaking letra?",
        applicableChoiceTypes: ["patinigBigLetter", "patinigSmallLetter"]
      },
      {
        _id: "6829799079a34741f9cd19f2",
        category: "alphabet_knowledge",
        questionType: "katinig",
        templateText: "Anong katumbas na maliit na letra?",
        applicableChoiceTypes: ["katinigBigLetter", "katinigSmallLetter"]
      },
      {
        _id: "6829799079a34741f9cd19f5",
        category: "phonological_awareness",
        questionType: "malapantig",
        templateText: "Kapag pinagsama ang mga pantig, ano ang mabubuo?",
        applicableChoiceTypes: ["malapatinigText", "wordText"]
      },
      {
        _id: "6829799079a34741f9cd19f8",
        category: "word_recognition",
        questionType: "word",
        templateText: "Piliin ang tamang larawan para sa salitang:",
        applicableChoiceTypes: ["wordText"]
      },
      {
        _id: "6829799079a34741f9cd19fa",
        category: "decoding",
        questionType: "word",
        templateText: "Paano babaybayin ang salitang ito?",
        applicableChoiceTypes: ["wordText"]
      }
    ];
    
    return allTemplates.filter(t => t.category === normCategory);
  };
 
  const mockFetchChoiceTemplates = async () => {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 500));
    
    // Mock data based on test.templates_choices.json structure
    return [
      // Patinig Big Letters
      {
        _id: "68297e4979a34741f9cd1a0f",
        choiceType: "patinigBigLetter",
        choiceValue: "A",
        choiceImage: "https://literexia-bucket.s3.ap-southeast-2.amazonaws.com/letters/A_big.png",
        soundText: null
      },
      {
        _id: "68297e4979a34741f9cd1a10",
        choiceType: "patinigBigLetter",
        choiceValue: "E",
        choiceImage: "https://literexia-bucket.s3.ap-southeast-2.amazonaws.com/letters/E_big.png",
        soundText: null
      },
      
      // Patinig Small Letters
      {
        _id: "68297e4979a34741f9cd1a14",
        choiceType: "patinigSmallLetter",
        choiceValue: "a",
        choiceImage: "https://literexia-bucket.s3.ap-southeast-2.amazonaws.com/letters/a_small.png",
        soundText: null
      },
      {
        _id: "68297e4979a34741f9cd1a15",
        choiceType: "patinigSmallLetter",
        choiceValue: "e",
        choiceImage: "https://literexia-bucket.s3.ap-southeast-2.amazonaws.com/letters/e_small.png",
        soundText: null
      },
      
      // Katinig Big Letters
      {
        _id: "68297e4979a34741f9cd1a1e",
        choiceType: "katinigBigLetter",
        choiceValue: "B",
        choiceImage: "https://literexia-bucket.s3.ap-southeast-2.amazonaws.com/letters/B_big.png",
        soundText: null
      },
      
      // Katinig Small Letters
      {
        _id: "68297e4979a34741f9cd1a28",
        choiceType: "katinigSmallLetter",
        choiceValue: "b",
        choiceImage: "https://literexia-bucket.s3.ap-southeast-2.amazonaws.com/letters/b_small.png",
        soundText: null
      },
      
      // Malapantig Text
      {
        _id: "6829828a79a34741f9cd1a3e",
        choiceType: "malapatinigText",
        choiceValue: "BA",
        choiceImage: null,
        soundText: "/ba/"
      },
      {
        _id: "80049a1b2c3d4e5f6a7b8c9d",
        choiceType: "malapatinigText",
        choiceValue: "BO",
        choiceImage: null,
        soundText: "/bo/"
      },
      
      // Word Text
      {
        _id: "6829828a79a34741f9cd1a4b",
        choiceType: "wordText",
        choiceValue: "BOLA",
        choiceImage: "https://literexia-bucket.s3.ap-southeast-2.amazonaws.com/words/ball.png",
        soundText: null
      },
      {
        _id: "6829828a79a34741f9cd1a48",
        choiceType: "wordText",
        choiceValue: "ASO",
        choiceImage: "https://literexia-bucket.s3.ap-southeast-2.amazonaws.com/words/dog.png",
        soundText: null
      }
    ];
  };
 
  const mockFetchSentenceTemplates = async (readingLevel) => {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 500));
    
    // Mock data based on test.sentence_templates.json structure
    const allTemplates = [
      {
        _id: "68297c4379a34741f9cd1a00",
        title: "Si Maria at ang mga Bulaklak",
        category: "reading_comprehension",
        readingLevel: "Low Emerging",
        sentenceText: [
          {
            pageNumber: 1,
            text: "Si Maria ay pumunta sa parke. Nakita niya ang maraming bulaklak na magaganda. Siya ay natuwa at nag-uwi ng ilang bulaklak para sa kanyang ina.",
            image: "https://literexia-bucket.s3.ap-southeast-2.amazonaws.com/passages/park_flowers.png"
          },
          {
            pageNumber: 2,
            text: "Nang makita ng ina ni Maria ang mga bulaklak, siya ay ngumiti at nagyakap sa kanyang anak. Gumawa sila ng maliit na hardin sa harap ng kanilang bahay.",
            image: "https://literexia-bucket.s3.ap-southeast-2.amazonaws.com/passages/mother_garden.png"
          }
        ],
        sentenceQuestions: [
          {
            questionNumber: 1,
            questionText: "Sino ang pangunahing tauhan sa kwento?",
            sentenceCorrectAnswer: "Si Maria",
            sentenceOptionAnswers: ["Si Maria", "Si Juan", "Ang ina", "Ang hardinero"]
          },
          {
            questionNumber: 2,
            questionText: "Saan pumunta si Maria?",
            sentenceCorrectAnswer: "Sa parke",
            sentenceOptionAnswers: ["Sa parke", "Sa paaralan", "Sa tindahan", "Sa bahay"]
          }
        ]
      }
    ];
    
    return allTemplates.filter(t => t.readingLevel === readingLevel);
  };
 
  // ===== INITIALIZATION FUNCTIONS =====
 
  /**
   * Initialize question-choice pairs from existing activity
   */
  const initializeFromExistingActivity = () => {
    if (!activity || !activity.questions || activity.questions.length === 0) return;
    
    try {
      const initialPairs = activity.questions.map(q => ({
        id: q.questionId || Date.now() + Math.random(),
        sourceType: q.source || 'custom',
        sourceId: q.sourceQuestionId || null,
        questionType: q.questionType,
        questionText: q.questionText,
        questionImage: q.questionImage,
        questionValue: q.questionValue,
        choiceIds: q.choiceIds || [], // References to templates_choices
        correctChoiceId: q.correctChoiceId || null,
        // Keep original choices for fallback
        originalChoices: q.choices || []
      }));
      
      setQuestionChoicePairs(initialPairs);
      
      // If it's a Reading Comprehension activity, set the sentence template
      if (contentType === 'sentence' && activity.sentenceTemplate) {
        setSelectedSentenceTemplate(activity.sentenceTemplate);
      }
    } catch (error) {
      console.error("Error initializing from existing activity:", error);
    }
  };
 
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
      'malapantig': ['malapatinigText', 'patinigBigLetter', 'patinigSmallLetter', 
                     'katinigBigLetter', 'katinigSmallLetter', 'patinigSound', 'katinigSound'],
      
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
    if (!choiceIds || choiceIds.length === 0) return [];
    
    return choiceIds.map(id => 
      availableChoiceTemplates.find(choice => choice._id === id)
    ).filter(Boolean);
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
      'phonological_awareness': ['malapantig', 'patinig', 'katinig'],
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
   */
  const handleFileChange = async (e, pairId) => {
    const file = e.target.files[0];
    if (!file) return;
    
    try {
      setFileUploads(prev => ({
        ...prev,
        [pairId]: { status: 'uploading', file: file.name }
      }));
      
      // Upload to S3 (simulated)
      const imageUrl = await uploadImageToS3(file);
      
      // Update the question pair
      updateQuestionChoicePair(pairId, 'questionImage', imageUrl);
      
      // Update upload status
      setFileUploads(prev => ({
        ...prev,
        [pairId]: { status: 'success', file: file.name }
      }));
    } catch (error) {
      console.error("Error uploading question image:", error);
      setFileUploads(prev => ({
        ...prev,
        [pairId]: { status: 'error', file: file.name }
      }));
    }
    
    // Reset the file input
    e.target.value = null;
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
      
      // Upload to S3 (simulated)
      const imageUrl = await uploadImageToS3(file);
      
      // Update the choice data
      setNewChoiceData(prev => ({
        ...prev,
        choiceImage: imageUrl
      }));
      
      // Update upload status
      setFileUploads(prev => ({
        ...prev,
        new_choice: { status: 'success', file: file.name }
      }));
    } catch (error) {
      console.error("Error uploading choice image:", error);
      setFileUploads(prev => ({
        ...prev,
        new_choice: { status: 'error', file: file.name }
      }));
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
      if (currentUploadTarget) {
        const imageUrl = await uploadImageToS3(file, currentUploadTarget.type, currentUploadTarget.id);
        
        // Update the appropriate state based on the target
        if (currentUploadTarget.type === 'question') {
          // Update question image
          setQuestionChoicePairs(prev => 
            prev.map(pair => 
              pair.id === currentUploadTarget.id ? { ...pair, questionImage: imageUrl } : pair
            )
          );
        } else if (currentUploadTarget.type === 'choice') {
          // Update choice image in new choice form
          setNewChoiceData(prev => ({ ...prev, choiceImage: imageUrl }));
        }
      }
    } catch (error) {
      console.error("Error handling file upload:", error);
      setErrors({ upload: "Failed to upload image. Please try again." });
    }
    
    // Reset the file input
    e.target.value = null;
  };
 
  // ===== EVENT HANDLERS =====
 
  /**
   * Handle form submission
   */
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (currentStep < 4) {
      if (validateCurrentStep()) {
      setCurrentStep(currentStep + 1);
      }
      return;
    }
    
    // Final validation before saving
    if (!validateAllSteps()) {
      // Go to first step with errors
      if (errors.title || errors.description) {
        setCurrentStep(1);
      } else if (errors.sentenceTemplate) {
        setCurrentStep(2);
      } else if (errors.pairs) {
        setCurrentStep(3);
      }
      return;
    }
    
    setSubmitting(true);
    
    try {
      // Check for existing interventions (only if creating new)
      if (!activity?._id) {
        // TODO: Replace with actual API call
        // const checkResponse = await fetch(`/api/interventions/check?studentId=${student._id}&category=${category}`);
        // const checkData = await response.json();
        
        // Mock check
        const checkData = { exists: false };
        
        if (checkData.exists) {
          setErrors({ general: "An intervention for this student and category already exists." });
          setSubmitting(false);
          return;
        }
      }
    
    // Prepare data for saving
      const interventionData = await prepareInterventionData();
      
      // Save intervention
      // TODO: Replace with actual API call
      // if (activity?._id) {
      //   await updateIntervention(activity._id, interventionData);
      // } else {
      //   await createIntervention(interventionData);
      // }
      
      // Mock API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      onSave(interventionData);
    } catch (error) {
      console.error("Error saving intervention:", error);
      setErrors({ general: "Failed to save intervention. Please try again." });
    } finally {
      setSubmitting(false);
    }
  };
 
  /**
   * Prepare intervention data for saving
   */
  const prepareInterventionData = async () => {
    let interventionData;
    
    if (contentType === 'sentence') {
      // For Reading Comprehension, use the sentence template
      interventionData = {
        _id: activity?._id || `intervention_${Date.now()}`,
        studentId: student._id,
      name: title,
      description,
      category,
      readingLevel,
        passThreshold: 75,
        questions: selectedSentenceTemplate.sentenceQuestions.map((q, index) => ({
          questionId: `q_${Date.now()}_${index}`,
          source: 'sentence_template',
          sourceQuestionId: selectedSentenceTemplate._id,
          questionIndex: index,
          questionType: 'sentence',
          questionText: q.questionText,
          questionImage: null,
          questionValue: null,
          choiceIds: [], // Sentence questions don't use choice templates
          correctChoiceId: null,
          choices: q.sentenceOptionAnswers.map((option, optIndex) => ({
            optionText: option,
            isCorrect: option === q.sentenceCorrectAnswer
        }))
      })),
        // Include the full sentence template for reference
        sentenceTemplate: selectedSentenceTemplate,
        status: 'draft',
        createdAt: activity?.createdAt || new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
    } else {
      // For other categories, use question-choice pairs
      interventionData = {
        _id: activity?._id || `intervention_${Date.now()}`,
        studentId: student._id,
        name: title,
        description,
        category,
        readingLevel,
        passThreshold: 75,
        questions: questionChoicePairs.map((pair, index) => ({
          questionId: `q_${Date.now()}_${index}`,
          source: pair.sourceType,
          sourceQuestionId: pair.sourceId,
          questionIndex: index,
          questionType: pair.questionType,
          questionText: pair.questionText,
          questionImage: pair.questionImage,
          questionValue: pair.questionValue,
          choiceIds: pair.choiceIds, // References to templates_choices
          correctChoiceId: pair.correctChoiceId,
          // Include actual choice data for mobile app consumption
          choices: getChoicesByIds(pair.choiceIds).map(choice => ({
            optionText: choice.choiceValue || choice.soundText || '',
            optionImage: choice.choiceImage,
            isCorrect: choice._id === pair.correctChoiceId
          }))
        })),
        status: 'draft',
        createdAt: activity?.createdAt || new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
    }
    
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
    
    const newPair = {
      id: Date.now(),
      sourceType: 'custom',
      sourceId: null,
      questionType: defaultQuestionType,
      questionText: '',
      questionImage: null,
      questionValue: null,
      choiceIds: [],
      correctChoiceId: null
    };
    
    setQuestionChoicePairs(prev => [...prev, newPair]);
  };
 
  const removeQuestionChoicePair = (id) => {
    if (questionChoicePairs.length <= 1) return;
    setQuestionChoicePairs(prev => prev.filter(pair => pair.id !== id));
  };
 
  const updateQuestionChoicePair = (id, field, value) => {
    setQuestionChoicePairs(prev => 
      prev.map(pair => 
        pair.id === id ? { ...pair, [field]: value } : pair
      )
    );
  };
 
  /**
   * Template Management
   */
  const setTemplateForPair = (pairId, templateId) => {
    const template = availableQuestionTemplates.find(t => t._id === templateId);
    if (!template) return;
    
    setQuestionChoicePairs(prev => 
      prev.map(pair => {
        if (pair.id === pairId) {
          return {
            ...pair,
            sourceType: 'template_question',
            sourceId: template._id,
            questionType: template.questionType,
            questionText: template.templateText,
            // Clear choices when template changes
            choiceIds: [],
            correctChoiceId: null
          };
        }
        return pair;
      })
    );
  };
 
  /**
   * Choice Management
   */
  const addChoiceToPair = (pairId, choiceId) => {
    setQuestionChoicePairs(prev => 
      prev.map(pair => {
        if (pair.id === pairId) {
          // Enforce exactly 2 choices
          if (pair.choiceIds.length >= 2) {
            return pair;
          }
          
          // Don't add if already present
          if (pair.choiceIds.includes(choiceId)) {
            return pair;
          }
          
          const newChoiceIds = [...pair.choiceIds, choiceId];
          
          return {
            ...pair,
            choiceIds: newChoiceIds,
            // Set first choice as correct if none set
            correctChoiceId: pair.correctChoiceId || choiceId
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
          
          return {
            ...pair,
            choiceIds: newChoiceIds,
            // Update correct choice if removed choice was correct
            correctChoiceId: pair.correctChoiceId === choiceId 
              ? (newChoiceIds.length > 0 ? newChoiceIds[0] : null)
              : pair.correctChoiceId
          };
        }
        return pair;
      })
    );
  };
 
  const setCorrectChoice = (pairId, choiceId) => {
    setQuestionChoicePairs(prev => 
      prev.map(pair => 
        pair.id === pairId ? { ...pair, correctChoiceId: choiceId } : pair
      )
    );
  };
 
  /**
   * Inline Template Creation
   */
  const handleCreateNewTemplate = async () => {
    try {
      if (!validateNewTemplate()) return;
      
      setSubmitting(true);
      const newTemplate = await createNewQuestionTemplate(newTemplateData);
      
      // Reset form
      setNewTemplateData({
        templateText: '',
        questionType: '',
        applicableChoiceTypes: []
      });
      setShowNewTemplateForm(false);
      
      // Show success message
      console.log('New template created:', newTemplate);
    } catch (error) {
      console.error('Error creating template:', error);
      setErrors({ newTemplate: 'Failed to create template. Please try again.' });
    } finally {
      setSubmitting(false);
    }
  };
 
  /**
   * Inline Choice Creation
   */
  const handleCreateNewChoice = async () => {
    try {
      if (!validateNewChoice()) return;
      
      setSubmitting(true);
      const newChoice = await createNewChoiceTemplate(newChoiceData);
      
      // Reset form
      setNewChoiceData({
        choiceType: '',
        choiceValue: '',
        choiceImage: '',
        soundText: ''
      });
      setShowNewChoiceForm(false);
      
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
    setSelectedSentenceTemplate(template);
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
      if (contentType === 'sentence' && !selectedSentenceTemplate) {
        newErrors.sentenceTemplate = "A reading passage must be selected";
      }
    }
    else if (currentStep === 3) {
      if (contentType !== 'sentence') {
        if (questionChoicePairs.length === 0) {
          newErrors.pairs = "At least one question must be added";
        }
        
        const invalidPairs = questionChoicePairs.filter(pair => 
          pair.choiceIds.length !== 2 || !pair.correctChoiceId
        );
        
        if (invalidPairs.length > 0) {
          newErrors.pairs = "All questions must have exactly 2 choices with one marked as correct";
        }
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
      if (questionChoicePairs.length === 0) {
        allErrors.pairs = "At least one question must be added";
      }
      
      const invalidPairs = questionChoicePairs.filter(pair => 
        pair.choiceIds.length !== 2 || !pair.correctChoiceId
      );
      
      if (invalidPairs.length > 0) {
        allErrors.pairs = "All questions must have exactly 2 choices with one marked as correct";
      }
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
        if (!newChoiceData.soundText) {
          newErrors.newChoice = "Sound text is required for sound-based choices";
        }
      } else if (!newChoiceData.choiceValue && !newChoiceData.soundText) {
        newErrors.newChoice = "Choice value or sound text is required";
      }
      
      // Image is required for these choice types
      const imageRequiredTypes = ['patinigBigLetter', 'patinigSmallLetter', 
                                 'katinigBigLetter', 'katinigSmallLetter', 'wordText'];
      if (imageRequiredTypes.includes(newChoiceData.choiceType) && !newChoiceData.choiceImage) {
        newErrors.newChoice = `Image is required for ${formatChoiceType(newChoiceData.choiceType)}`;
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
        return renderTemplateSelectionStep();
      case 3:
        return contentType === 'sentence' 
          ? renderSentencePreviewStep() 
          : renderQuestionChoicesStep();
      case 4:
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
        <h3>Questions from Assessment</h3>
        
        <div className="literexia-info-banner">
          <FaInfoCircle />
          <p>
            These questions are from the main assessment for {formatCategoryName(category)}. 
            You can use these questions or create new ones using templates.
          </p>
        </div>
        
        {/* Main Assessment Questions */}
        <div className="literexia-main-assessment-questions">
          {mainAssessmentQuestions.length > 0 ? (
            mainAssessmentQuestions.map((question, index) => (
              <div key={question._id} className="literexia-main-question-item">
                <div className="literexia-main-question-header">
                  <h4>Question {index + 1}</h4>
                  <div className="literexia-main-question-type">
                    {question.questionType}
                  </div>
                </div>
                
                <div className="literexia-main-question-content">
                  <div className="literexia-main-question-text">
                    <p>{question.questionText}</p>
                    {question.questionValue && (
                      <div className="literexia-main-question-value">
                        <strong>Value:</strong> {question.questionValue}
                      </div>
                    )}
                  </div>
                  
                  {question.questionImage && (
                    <div className="literexia-main-question-image">
                      <img src={question.questionImage} alt="Question" />
                    </div>
                  )}
                </div>
                
                <div className="literexia-main-question-choices">
                  <h5>Original Choices:</h5>
                  <ul>
                    {question.choiceOptions.map((option, optionIndex) => (
                      <li key={optionIndex} className={option.isCorrect ? 'correct-option' : ''}>
                        {option.optionText} {option.isCorrect && '(Correct)'}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            ))
          ) : (
            <div className="literexia-empty-state">
              <FaExclamationTriangle className="literexia-empty-icon" />
              <h3>No Assessment Questions Available</h3>
              <p>No questions were found for this category and reading level.</p>
            </div>
          )}
        </div>
        
        <hr className="literexia-section-divider" />
        
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
            {availableQuestionTemplates.length > 0 ? (
              availableQuestionTemplates.map(template => (
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
                        template.applicableChoiceTypes.map(formatChoiceType).join(', ')
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
          {availableSentenceTemplates.length > 0 ? (
            availableSentenceTemplates.map(template => (
              <div 
              key={template._id}
              className={`literexia-sentence-template-item ${
                selectedSentenceTemplate?._id === template._id ? 'selected' : ''
              }`}
              onClick={() => handleSelectSentenceTemplate(template)}
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
 * Step 3: Question-Choice Pairs
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
              
              {questionChoicePairs.map((pair, index) => (
        <div key={pair.id} className="literexia-question-pair">
          <div className="literexia-question-pair-header">
                    <h4>Question {index + 1}</h4>
            <div className="literexia-question-source-label">
              Source: {pair.sourceType === 'main_assessment' ? 'Assessment' : 
                      pair.sourceType === 'template_question' ? 'Template' : 'Custom'}
            </div>
                    <button
                      type="button"
              className="literexia-remove-pair-btn"
              onClick={() => removeQuestionChoicePair(pair.id)}
                      disabled={questionChoicePairs.length <= 1}
                    >
                      <FaTrash /> Remove
                    </button>
                  </div>
                  
          {/* Template Selection */}
          {pair.sourceType !== 'main_assessment' && (
            <div className="literexia-question-template-selection">
                    <label>Question Template</label>
                    <select
                value={pair.sourceId || ''}
                onChange={(e) => setTemplateForPair(pair.id, e.target.value)}
              >
                <option value="">-- Select Template --</option>
                {availableQuestionTemplates.map(template => (
                  <option key={template._id} value={template._id}>
                    {template.templateText} ({template.questionType})
                        </option>
                      ))}
                    </select>
                  </div>
          )}
          
          {/* Question Details */}
          <div className="literexia-question-details">
            <div className="literexia-form-row">
              <div className="literexia-form-group">
                <label>Question Text</label>
                <input
                  type="text"
                  value={pair.questionText || ''}
                  onChange={(e) => updateQuestionChoicePair(pair.id, 'questionText', e.target.value)}
                  disabled={pair.sourceType === 'main_assessment'}
                />
                    </div>
                    
              <div className="literexia-form-group">
                <label>Question Value (optional)</label>
                <input
                  type="text"
                  value={pair.questionValue || ''}
                  onChange={(e) => updateQuestionChoicePair(pair.id, 'questionValue', e.target.value)}
                  disabled={pair.sourceType === 'main_assessment'}
                  placeholder="e.g., A, BO + LA"
                />
              </div>
            </div>
            
            <div className="literexia-form-group">
              <label>Question Image</label>
              <div className="literexia-file-upload">
                <input
                  type="file"
                  id={`question-image-${pair.id}`}
                  ref={el => fileInputRefs.current[pair.id] = el}
                  onChange={(e) => handleFileChange(e, pair.id)}
                  accept="image/*"
                  disabled={pair.sourceType === 'main_assessment'}
                  style={{ display: 'none' }}
                />
                <div className="literexia-file-upload-controls">
                  <button 
                    type="button" 
                    className="literexia-file-select-btn"
                    onClick={() => fileInputRefs.current[pair.id].click()}
                    disabled={pair.sourceType === 'main_assessment' || fileUploads[pair.id]?.status === 'uploading'}
                  >
                    {fileUploads[pair.id]?.status === 'uploading' ? <FaSpinner className="fa-spin" /> : <FaPlus />} 
                    {pair.questionImage ? 'Change Image' : 'Upload Image'}
                  </button>
                  {pair.questionImage && (
                    <div className="literexia-image-preview">
                      <img src={pair.questionImage} alt="Question" />
                      <button 
                        type="button" 
                        className="literexia-remove-image-btn"
                        onClick={() => updateQuestionChoicePair(pair.id, 'questionImage', null)}
                        disabled={pair.sourceType === 'main_assessment'}
                      >
                        <FaTimes />
                      </button>
                    </div>
                  )}
                  {fileUploads[pair.id]?.status === 'uploading' && <span className="literexia-uploading">Uploading...</span>}
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
                  onClick={() => setShowNewChoiceForm(!showNewChoiceForm)}
                  disabled={pair.choiceIds.length >= 2 || pair.sourceType === 'main_assessment'}
                >
                  <FaPlus /> Add New Choice
                </button>
              )}
            </div>
            
            {/* Inline New Choice Form */}
            {isInlineCreationAllowed() && showNewChoiceForm && (
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
                          const template = availableQuestionTemplates.find(t => t._id === pair.sourceId);
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
                
                <div className="literexia-form-row">
                  <div className="literexia-form-group">
                    <label>Image</label>
                    <div className="literexia-file-upload">
                      <input
                        type="file"
                        id="new-choice-image"
                        ref={el => fileInputRefs.current.new_choice = el}
                        onChange={handleChoiceFileChange}
                        accept="image/*"
                        style={{ display: 'none' }}
                      />
                      <div className="literexia-file-upload-controls">
                        <button 
                          type="button" 
                          className="literexia-file-select-btn"
                          onClick={() => fileInputRefs.current.new_choice.click()}
                          disabled={fileUploads.new_choice?.status === 'uploading'}
                        >
                          {fileUploads.new_choice?.status === 'uploading' ? <FaSpinner className="fa-spin" /> : <FaPlus />} 
                          {newChoiceData.choiceImage ? 'Change Image' : 'Upload Image'}
                        </button>
                        {newChoiceData.choiceImage && (
                          <div className="literexia-image-preview">
                            <img src={newChoiceData.choiceImage} alt="Choice" />
                            <button 
                              type="button" 
                              className="literexia-remove-image-btn"
                              onClick={() => setNewChoiceData(prev => ({ ...prev, choiceImage: '' }))}
                            >
                              <FaTimes />
                            </button>
                          </div>
                        )}
                        {fileUploads.new_choice?.status === 'uploading' && <span className="literexia-uploading">Uploading...</span>}
                        {fileUploads.new_choice?.status === 'error' && <span className="literexia-upload-error">Upload failed. Please try again.</span>}
                      </div>
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
                </div>
                
                {errors.newChoice && (
                  <div className="literexia-error-message">{errors.newChoice}</div>
                )}
                
                <div className="literexia-inline-form-actions">
                <button 
                   type="button" 
                   onClick={() => setShowNewChoiceForm(false)}
                   className="literexia-cancel-btn"
                 >
                   Cancel
                 </button>
                 <button 
                   type="button" 
                   onClick={handleCreateNewChoice}
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
               {availableChoiceTemplates
                 .filter(choice => {
                   // Filter by applicable choice types for current question
                   if (pair.sourceType === 'template_question' && pair.sourceId) {
                     const template = availableQuestionTemplates.find(t => t._id === pair.sourceId);
                     return template ? template.applicableChoiceTypes.includes(choice.choiceType) : true;
                   }
                   return getApplicableChoiceTypes(pair.questionType).includes(choice.choiceType);
                 })
                 .map(choice => (
                   <div 
                     key={choice._id}
                     className={`literexia-choice-tile ${
                       pair.choiceIds.includes(choice._id) ? 'selected' : ''
                     } ${
                       pair.choiceIds.length >= 2 && !pair.choiceIds.includes(choice._id) ? 'disabled' : ''
                     } ${pair.sourceType === 'main_assessment' ? 'readonly' : ''}`}
                     onClick={() => {
                       if (pair.sourceType === 'main_assessment') return;
                       
                       if (pair.choiceIds.includes(choice._id)) {
                         removeChoiceFromPair(pair.id, choice._id);
                       } else if (pair.choiceIds.length < 2) {
                         addChoiceToPair(pair.id, choice._id);
                       }
                     }}
                   >
                     {choice.choiceImage && (
                       <div className="literexia-choice-image">
                         <img src={choice.choiceImage} alt={choice.choiceValue || choice.soundText} />
                       </div>
                     )}
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
             <h5>Selected Choices ({pair.choiceIds.length}/2)</h5>
             {pair.choiceIds.length === 0 ? (
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
                           disabled={pair.sourceType === 'main_assessment'}
                                />
                                <label>Correct</label>
                              </div>
                              
                       <div className="literexia-selected-choice-content">
                                {choice.choiceImage && (
                           <div className="literexia-selected-choice-image">
                             <img src={choice.choiceImage} alt={choice.choiceValue || choice.soundText} />
                                  </div>
                                )}
                         <div className="literexia-selected-choice-value">
                           {choice.choiceValue || choice.soundText || '(No text)'}
                                </div>
                              </div>
                       
                       <button
                         type="button"
                         className="literexia-remove-choice-btn"
                         onClick={() => removeChoiceFromPair(pair.id, choice._id)}
                         disabled={pair.sourceType === 'main_assessment'}
                       >
                         <FaTrash />
                       </button>
                            </div>
                   );
                 })}
                        </div>
                      )}
             
             {/* Choice requirement warning */}
             {pair.choiceIds.length !== 2 && (
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
           {selectedSentenceTemplate.sentenceText.map((page, index) => (
             <div key={index} className="literexia-page-item">
               <div className="literexia-page-number">{index + 1}</div>
               <div className="literexia-page-content">
                 <div className="literexia-page-image">
                   <img src={page.image} alt={`Page ${index + 1}`} />
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
           {selectedSentenceTemplate.sentenceQuestions.map((question, index) => (
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
                       {question.sentenceOptionAnswers.map((option, optIndex) => (
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
           <p><strong>Pages:</strong> {selectedSentenceTemplate?.sentenceText.length || 0}</p>
           <p><strong>Questions:</strong> {selectedSentenceTemplate?.sentenceQuestions.length || 0}</p>
           
           {selectedSentenceTemplate && (
             <div className="literexia-passage-preview">
               <p className="literexia-passage-sample">
                 <strong>Sample text:</strong> "{selectedSentenceTemplate.sentenceText[0].text.substring(0, 100)}..."
               </p>
               <p className="literexia-question-sample">
                 <strong>Sample question:</strong> "{selectedSentenceTemplate.sentenceQuestions[0].questionText}"
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
                  <p>This activity has {questionChoicePairs.length} question(s):</p>
                  
           <div className="literexia-questions-summary">
             {questionChoicePairs.map((pair, index) => {
               const choices = getChoicesByIds(pair.choiceIds);
               const correctChoice = choices.find(choice => choice._id === pair.correctChoiceId);
               
               return (
                 <div key={index} className="literexia-question-summary">
                   <p className="literexia-question-summary-text">
                     <strong>Q{index + 1}:</strong> {pair.questionText || 'No question text'}
                     {pair.questionValue && ` (${pair.questionValue})`}
                   </p>
                   <div className="literexia-choices-summary">
                          <p><strong>Choices:</strong></p>
                          <ul>
                       {choices.map((choice, choiceIndex) => (
                         <li 
                           key={choice._id} 
                           className={choice._id === pair.correctChoiceId ? 'correct-choice' : ''}
                         >
                           {choice.choiceValue || choice.soundText || '(No text)'} 
                           {choice._id === pair.correctChoiceId && ' (Correct)'}
                              </li>
                            ))}
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
                  onClick={() => setCurrentStep(3)}
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
           This activity will be saved as a draft and can be pushed to {student?.firstName || 'the student'}'s 
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
           {contentType === 'sentence' ? 'Select Passage' : 'Templates'}
         </div>
       </div>
       <div className="literexia-step-connector"></div>
       
       <div 
           className={`literexia-step ${currentStep >= 3 ? 'active' : ''}`} 
           onClick={() => currentStep > 2 && setCurrentStep(3)}
         >
           <div className="literexia-step-number">3</div>
           <div className="literexia-step-label">
             {contentType === 'sentence' ? 'Preview' : 'Questions & Choices'}
           </div>
         </div>
         <div className="literexia-step-connector"></div>
         
         <div 
           className={`literexia-step ${currentStep >= 4 ? 'active' : ''}`} 
           onClick={() => currentStep > 3 && setCurrentStep(4)}
         >
           <div className="literexia-step-number">4</div>
           <div className="literexia-step-label">Review</div>
         </div>
       </div>
       
       {/* Modal Info Banner */}
       <div className="literexia-modal-info-banner">
         <FaInfoCircle />
         <p>
           This intervention activity will help address {student?.firstName || 'the student'}'s 
           specific needs in {formatCategoryName(category)}. Questions can be sourced from assessments, 
           templates, or created custom. All choices are editable from the template library.
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
              ) : currentStep < 4 ? (
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