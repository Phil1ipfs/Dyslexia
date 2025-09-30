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
  faTrash,
  faGraduationCap,
  faExclamationCircle,
  faQuestion,
  faPuzzlePiece
} from "@fortawesome/free-solid-svg-icons";
import "../../../css/Teachers/ManageCategories/PreAssessment.css";
import "../../../css/Teachers/ManageCategories/PreAssessmentUpdates.css";
import PreAssessmentService from "../../../services/Teachers/PreAssessmentService";
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

// Tooltip component for help text
const Tooltip = ({ text }) => (
  <div className="pre-tooltip">
    <FontAwesomeIcon icon={faInfoCircle} className="pre-tooltip-icon" />
    <span className="pre-tooltip-text">{text}</span>
  </div>
);

// Helper function to recalculate category counts from questions
const recalculateCategoryCounts = (questions) => {
  const counts = {
    alphabet_knowledge: 0,
    phonological_awareness: 0,
    decoding: 0,
    word_recognition: 0,
    reading_comprehension: 0
  };
  
  // Mapping from category names in database to our internal keys
  const categoryNameMap = {
    'Alphabet Knowledge': 'alphabet_knowledge',
    'Phonological Awareness': 'phonological_awareness', 
    'Decoding': 'decoding',
    'Word Recognition': 'word_recognition',
    'Reading Comprehension': 'reading_comprehension'
  };
  
  if (questions && questions.length > 0) {
    questions.forEach(question => {
      // Use the category field from database (matches sample JSON structure)
      let categoryKey = null;
      
      if (question.category) {
        // Map the category name to our internal key
        categoryKey = categoryNameMap[question.category];
      }
      
      if (categoryKey && counts.hasOwnProperty(categoryKey)) {
        counts[categoryKey]++;
      }
    });
  }
  
  return counts;
};

// Helper function to shuffle array
const shuffleArray = (array) => {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
};

// Helper functions to convert between internal keys and display names
const categoryKeyToDisplayName = {
  'alphabet_knowledge': 'Alphabet Knowledge',
  'phonological_awareness': 'Phonological Awareness', 
  'decoding': 'Decoding',
  'word_recognition': 'Word Recognition',
  'reading_comprehension': 'Reading Comprehension'
};

const categoryDisplayNameToKey = {
  'Alphabet Knowledge': 'alphabet_knowledge',
  'Phonological Awareness': 'phonological_awareness', 
  'Decoding': 'decoding',
  'Word Recognition': 'word_recognition',
  'Reading Comprehension': 'reading_comprehension'
};

const PreAssessment = () => {
  const [preAssessment, setPreAssessment] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showPreviewModal, setShowPreviewModal] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showDeleteQuestionModal, setShowDeleteQuestionModal] = useState(false);
  const [questionToDelete, setQuestionToDelete] = useState(null);
  const [showSubmitConfirmModal, setShowSubmitConfirmModal] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [editingQuestionIndex, setEditingQuestionIndex] = useState(-1);
  const [showQuestionEditor, setShowQuestionEditor] = useState(false);
  const [dataChangeCounter, setDataChangeCounter] = useState(0);
  const [currentQuestionData, setCurrentQuestionData] = useState({
    questionId: '',
    category: '',
    questionType: '',
    questionText: '',
    questionImage: null,
    questionValue: '',
    difficultyLevel: '',
    
    // For multiple choice questions (alphabet knowledge)
    options: [
      { optionId: '1', optionText: '', isCorrect: true },
      { optionId: '2', optionText: '', isCorrect: false }
    ],
    
    // For reading comprehension
    passages: [
      { pageNumber: 1, pageText: '', pageImage: null }
    ],
    sentenceQuestions: [
      { questionText: '', correctAnswer: '', acceptableAnswers: [] }
    ],
    
    // For phonological awareness (malapantig questions)
    questionSet: {
      audioTexts: [], // Teacher can add 3-5 items as needed
      matchingOptions: [], // Should match audioTexts length
      correctPairs: [] // Should match audioTexts length
    },
    
    // For decoding questions (decode type)
    completeWord: '', // Complete word for both question types
    displaySequence: [],
    blankPosition: null,
    dragElements: [],
    correctSequence: [],
    
    // For word recognition questions (word type)  
    displayWord: '',
    blankOptions: [], // Teacher can add as many options as needed
    correctAnswer: [], // Can have multiple correct answers
    
    // Additional fields for interactive sentence building
    completeSentence: '',
    blankWords: [],
    blankedSentence: ''
  });
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    instructions: "",
    totalQuestions: 0,
    categoryCounts: {
      alphabet_knowledge: 0,
      phonological_awareness: 0,
      decoding: 0,
      word_recognition: 0,
      reading_comprehension: 0
    },
    language: "FL",
    questions: []
  });
  const [questionTypes, setQuestionTypes] = useState([]);
  // Preview All state variables
  const [isPreviewAllDialogOpen, setIsPreviewAllDialogOpen] = useState(false);
  const [previewAllTemplates, setPreviewAllTemplates] = useState([]);
  const [previewAllCurrentIndex, setPreviewAllCurrentIndex] = useState(0);

  useEffect(() => {
    // Fetch pre-assessment data
    const fetchPreAssessment = async () => {
      try {
        setLoading(true);
        console.log('Fetching pre-assessments from API...');
        
        // Fetch question types first to ensure they're available
        console.log('Fetching question types from API...');
        const typesResponse = await PreAssessmentService.getAllQuestionTypes();
        if (typesResponse.success) {
          console.log('Question types fetched successfully:', typesResponse.data.length);
          setQuestionTypes(typesResponse.data);
        } else {
          console.error('Error fetching question types:', typesResponse.message);
        }
        
        // Use PreAssessmentService to fetch assessment data from the API
        const response = await PreAssessmentService.getAllPreAssessments();
        console.log('API Response for assessments:', response);
        console.log('Number of assessments found:', response.data?.length || 0);
        
        if (response.success) {
          // If there are pre-assessments, find the one with assessmentId "1"
          if (response.data && response.data.length > 0) {
            // Look for assessment with assessmentId "1" (as per sample JSON)
            const targetAssessment = response.data.find(a => a.assessmentId === "1") || response.data[0];
            const assessmentId = targetAssessment._id;
            
            // Fetch the complete pre-assessment with questions
            console.log('Fetching detailed pre-assessment data for ID:', assessmentId);
            const detailResponse = await PreAssessmentService.getPreAssessmentById(assessmentId);
            console.log('Detail response success:', detailResponse.success);
            
            if (detailResponse.success && detailResponse.data) {
              const fetchedPreAssessment = detailResponse.data;
              
              // Ensure isActive field exists with a default value if not present
              fetchedPreAssessment.isActive = fetchedPreAssessment.isActive !== undefined ? 
                fetchedPreAssessment.isActive : true;
                
              // Ensure updatedAt field exists with a valid date
              fetchedPreAssessment.updatedAt = fetchedPreAssessment.updatedAt || 
                fetchedPreAssessment.lastUpdated || 
                new Date().toISOString();
              
              // Debug logging for questions
              console.log('Fetched pre-assessment with questions count:', 
                fetchedPreAssessment.questions ? fetchedPreAssessment.questions.length : 0);
              if (fetchedPreAssessment.questions && fetchedPreAssessment.questions.length > 0) {
                console.log('First question:', fetchedPreAssessment.questions[0]);
                
                // Ensure all questions have proper category field
                fetchedPreAssessment.questions = fetchedPreAssessment.questions.map(question => ({
                  ...question,
                  // Use category field as received from backend (matches sample JSON)
                  category: question.category || 'Alphabet Knowledge'
                }));
              }
              
              // Update total questions count
              fetchedPreAssessment.totalQuestions = fetchedPreAssessment.questions ? 
                fetchedPreAssessment.questions.length : 0;
              
              // Ensure updatedAt field exists
              fetchedPreAssessment.updatedAt = fetchedPreAssessment.updatedAt || 
                fetchedPreAssessment.lastUpdated || 
                new Date().toISOString();
              
              setPreAssessment(fetchedPreAssessment);
              
              // Calculate actual category counts based on questions
              const dynamicCategoryCounts = {
                alphabet_knowledge: 0,
                phonological_awareness: 0,
                decoding: 0,
                word_recognition: 0,
                reading_comprehension: 0
              };
              
              // Count questions by category
              if (fetchedPreAssessment.questions && fetchedPreAssessment.questions.length > 0) {
                fetchedPreAssessment.questions.forEach(question => {
                  const categoryKey = categoryDisplayNameToKey[question.category];
                  if (categoryKey && dynamicCategoryCounts.hasOwnProperty(categoryKey)) {
                    dynamicCategoryCounts[categoryKey]++;
                  }
                });
              }
              
              // Initialize form data
              setFormData({
                title: fetchedPreAssessment.title || "",
                description: fetchedPreAssessment.description || "",
                instructions: fetchedPreAssessment.instructions || "",
                totalQuestions: fetchedPreAssessment.totalQuestions,
                categoryCounts: dynamicCategoryCounts,
                language: fetchedPreAssessment.language || "FL",
                questions: fetchedPreAssessment.questions ? JSON.parse(JSON.stringify(fetchedPreAssessment.questions)) : [],
                isActive: fetchedPreAssessment.isActive,
                updatedAt: fetchedPreAssessment.updatedAt
              });
            } else {
              console.error('Error fetching pre-assessment details:', detailResponse.message);
              setPreAssessment(response.data[0]);
            }
          } else {
            console.log('No pre-assessments found');
            setPreAssessment(null);
          }
        } else {
          console.error('Error fetching pre-assessments:', response.message);
          setError(response.message || "Failed to load pre-assessment data. Please try again.");
        }
        
        setLoading(false);
      } catch (err) {
        console.error('Exception in fetchPreAssessment:', err);
        setError("Failed to load pre-assessment data. Please try again.");
        setLoading(false);
      }
    };
    
    fetchPreAssessment();
  }, []);

  // Add new useEffect to refresh data when changes occur
  useEffect(() => {
    if (dataChangeCounter > 0) {
      const refreshData = async () => {
        try {
          // Don't set loading to true during refresh to prevent showing empty state
          // setLoading(true);
          
          if (preAssessment && preAssessment._id) {
            console.log('Refreshing pre-assessment data after change...');
            const refreshResponse = await PreAssessmentService.getPreAssessmentById(preAssessment._id);
            
            if (refreshResponse.success && refreshResponse.data) {
              // Update with fresh data from server
              const freshData = refreshResponse.data;
              
              // Ensure required fields exist
              freshData.isActive = freshData.isActive !== undefined ? freshData.isActive : true;
              freshData.updatedAt = freshData.updatedAt || freshData.lastUpdated || new Date().toISOString();
              freshData.totalQuestions = freshData.questions ? freshData.questions.length : 0;
              
              // Calculate category counts from questions
              if (freshData.questions) {
                freshData.categoryCounts = recalculateCategoryCounts(freshData.questions);
              } else {
                // Ensure categoryCounts exist even if no questions
                freshData.categoryCounts = {
                  alphabet_knowledge: 0,
                  phonological_awareness: 0,
                  decoding: 0,
                  word_recognition: 0,
                  reading_comprehension: 0
                };
              }
              
              console.log('Refreshed data:', freshData);
              
              // Only update if we have valid data
              if (freshData._id) {
                setPreAssessment(freshData);
                
                // Also update formData to keep it in sync
                setFormData(prev => ({
                  ...prev,
                  questions: freshData.questions || [],
                  categoryCounts: freshData.categoryCounts || {},
                  totalQuestions: freshData.totalQuestions || 0,
                  isActive: freshData.isActive,
                  updatedAt: freshData.updatedAt
                }));
              }
            } else {
              console.warn('Refresh response was not successful or data was empty');
            }
          }
        } catch (err) {
          console.error('Error refreshing data:', err);
          // Don't update state if refresh fails to prevent data loss
        } finally {
          // setLoading(false);
        }
      };
      
      refreshData();
    }
  }, [dataChangeCounter]);

  // Handle navigating through questions in preview modal
  const handleQuestionNavigation = (direction) => {
    if (!preAssessment || !preAssessment.questions) return;
    
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

  // Define category-specific question types based on actual database structure
  const getCategoryQuestionTypes = (categoryId) => {
    if (!categoryId) return [];
    
    // Question types matching the sample database record exactly
    const categoryQuestionTypes = {
      'alphabet_knowledge': ['patinig', 'katinig'],
      'phonological_awareness': ['malapantig'],
      'decoding': ['decode'],
      'word_recognition': ['word'],
      'reading_comprehension': ['sentence']
    };
    
    return categoryQuestionTypes[categoryId] || [];
  };

  // Handle creating new pre-assessment
  const handleCreatePreAssessment = () => {
    // Initialize with empty questions array
    setFormData({
      title: "",
      description: "",
      instructions: "",
      totalQuestions: 0,
      categoryCounts: {
        alphabet_knowledge: 0,
        phonological_awareness: 0,
        decoding: 0,
        word_recognition: 0,
        reading_comprehension: 0
      },
      language: "FL",
      questions: []
    });
    setShowCreateModal(true);
  };

  // Handle editing existing pre-assessment
  const handleEditPreAssessment = async () => {
    // CRITICAL FIX: Refresh preAssessment data from server before opening edit modal
    console.log('🔧 EDIT MODAL DEBUG - Starting handleEditPreAssessment');

    if (preAssessment && preAssessment._id) {
      console.log('🔄 Refreshing preAssessment data from server...');

      try {
        // Fetch the latest data from server
        const refreshResponse = await PreAssessmentService.getPreAssessmentById(preAssessment._id);

        if (refreshResponse.success) {
          const freshPreAssessment = refreshResponse.data;
          console.log('✅ Fresh data fetched:', {
            hasQuestions: !!freshPreAssessment.questions,
            questionCount: freshPreAssessment.questions ? freshPreAssessment.questions.length : 0,
            title: freshPreAssessment.title
          });

          // Update preAssessment state with fresh data
          setPreAssessment(freshPreAssessment);

          // Use the fresh data for formData setup
          const dataToUse = freshPreAssessment;

          // Calculate actual category counts based on questions
          const dynamicCategoryCounts = {
            alphabet_knowledge: 0,
            phonological_awareness: 0,
            decoding: 0,
            word_recognition: 0,
            reading_comprehension: 0
          };

          // Count questions by category
          if (dataToUse.questions && dataToUse.questions.length > 0) {
            dataToUse.questions.forEach(question => {
              const categoryKey = categoryDisplayNameToKey[question.category];
              console.log('📋 Processing question:', {
                category: question.category,
                categoryKey: categoryKey,
                questionId: question.questionId
              });
              if (categoryKey && dynamicCategoryCounts.hasOwnProperty(categoryKey)) {
                dynamicCategoryCounts[categoryKey]++;
              }
            });
          }

          console.log('📊 Final category counts:', dynamicCategoryCounts);

          // Ensure we have valid isActive and updatedAt values
          const isActive = dataToUse.isActive !== undefined ? dataToUse.isActive : true;
          const updatedAt = dataToUse.updatedAt || dataToUse.lastUpdated || new Date().toISOString();

          // Deep copy the fresh data to formData
          const newFormData = {
            title: dataToUse.title || "",
            description: dataToUse.description || "",
            instructions: dataToUse.instructions || "",
            totalQuestions: dataToUse.questions ? dataToUse.questions.length : 0,
            categoryCounts: dynamicCategoryCounts,
            language: dataToUse.language || "FL",
            questions: dataToUse.questions ? JSON.parse(JSON.stringify(dataToUse.questions)) : [],
            isActive: isActive,
            updatedAt: updatedAt
          };

          console.log('💾 Setting formData with fresh data:', {
            totalQuestions: newFormData.totalQuestions,
            categoryCounts: newFormData.categoryCounts,
            questionsLength: newFormData.questions.length
          });

          setFormData(newFormData);
          console.log('✅ Form data set successfully with fresh server data');

        } else {
          console.error('❌ Failed to refresh data:', refreshResponse.message);
          // Fallback to existing preAssessment data
          console.log('⚠️ Using cached preAssessment data as fallback');
          setFormDataFromExisting(preAssessment);
        }
      } catch (error) {
        console.error('❌ Error refreshing preAssessment:', error);
        // Fallback to existing preAssessment data
        console.log('⚠️ Using cached preAssessment data as fallback due to error');
        setFormDataFromExisting(preAssessment);
      }
    } else {
      console.error('❌ No preAssessment data available for editing');
    }

    setShowEditModal(true);
  };

  // Helper function to set form data from existing preAssessment
  const setFormDataFromExisting = (assessmentData) => {
    const dynamicCategoryCounts = {
      alphabet_knowledge: 0,
      phonological_awareness: 0,
      decoding: 0,
      word_recognition: 0,
      reading_comprehension: 0
    };

    if (assessmentData.questions && assessmentData.questions.length > 0) {
      assessmentData.questions.forEach(question => {
        const categoryKey = categoryDisplayNameToKey[question.category];
        if (categoryKey && dynamicCategoryCounts.hasOwnProperty(categoryKey)) {
          dynamicCategoryCounts[categoryKey]++;
        }
      });
    }

    const newFormData = {
      title: assessmentData.title || "",
      description: assessmentData.description || "",
      instructions: assessmentData.instructions || "",
      totalQuestions: assessmentData.questions ? assessmentData.questions.length : 0,
      categoryCounts: dynamicCategoryCounts,
      language: assessmentData.language || "FL",
      questions: assessmentData.questions ? JSON.parse(JSON.stringify(assessmentData.questions)) : [],
      isActive: assessmentData.isActive !== undefined ? assessmentData.isActive : true,
      updatedAt: assessmentData.updatedAt || assessmentData.lastUpdated || new Date().toISOString()
    };

    setFormData(newFormData);
  };

  // Handle deleting pre-assessment
  const handleDeleteConfirm = () => {
    setShowDeleteModal(true);
  };

  // Handle form submission
  const handleFormSubmit = () => {
    // Validate form
    if (!formData.title) {
      toast.error("Please enter a title for the assessment.");
      return;
    }
    
    if (!formData.description) {
      toast.error("Please enter a description for the assessment.");
      return;
    }
    
    if (!formData.instructions) {
      toast.error("Please enter instructions for the assessment.");
      return;
    }

    // Show confirmation dialog
    setShowSubmitConfirmModal(true);
  };

  // Handle confirmed submission
  const handleConfirmSubmit = async () => {
    try {
      setLoading(true);
      
      // Create assessment data that matches the database schema
      const assessmentData = {
        ...formData,
        type: "pre_assessment",
        status: "active",
        isActive: formData.isActive !== undefined ? formData.isActive : true,
        updatedAt: new Date().toISOString(),
        // Always use fixed assessment ID as per sample JSON
        assessmentId: "1", 
        // If we're editing an existing assessment, keep its ID
        ...(preAssessment && { _id: preAssessment._id }),
        // Removed continueButtonText as it's not in sample JSON
        scoringRules: preAssessment?.scoringRules || {
          "Low Emerging": {
            part1ScoreRange: [0, 10],
            readingPercentageRange: [0, 16],
            correctAnswersRange: [0, 0]
          },
          "High Emerging": {
            part1ScoreRange: [11, 13],
            readingPercentageRange: [1, 25],
            correctAnswersRange: [0, 0]
          },
          "Developing": {
            part1ScoreRange: [14, 16],
            readingPercentageRange: [26, 50],
            correctAnswersRange: [1, 1]
          },
          "Transitioning": {
            part1ScoreRange: [17, 20],
            readingPercentageRange: [51, 75],
            correctAnswersRange: [2, 3]
          },
          "At Grade Level": {
            part1ScoreRange: [17, 20],
            readingPercentageRange: [76, 100],
            correctAnswersRange: [4, 5]
          }
        }
      };
      
      console.log('Submitting pre-assessment data:', assessmentData);
      
      // Use PreAssessmentService to create or update the assessment
      let response;
      if (preAssessment && preAssessment._id) {
        response = await PreAssessmentService.updatePreAssessment(preAssessment._id, assessmentData);
      } else {
        response = await PreAssessmentService.createPreAssessment(assessmentData);
      }
      
      console.log('API Response:', response);
      
      if (response.success) {
        // After successful update/create, fetch the complete assessment data
        if (response.data && response.data._id) {
          const fetchResponse = await PreAssessmentService.getPreAssessmentById(response.data._id);
          if (fetchResponse.success) {
            // Update the preAssessment state with fresh data
            const updatedAssessment = fetchResponse.data;
            
            // Ensure isActive and updatedAt fields are set properly
            updatedAssessment.isActive = updatedAssessment.isActive !== undefined ? 
              updatedAssessment.isActive : true;
            updatedAssessment.updatedAt = updatedAssessment.updatedAt || 
              updatedAssessment.lastUpdated || 
              new Date().toISOString();
            
            // Update total questions count
            updatedAssessment.totalQuestions = updatedAssessment.questions ? 
              updatedAssessment.questions.length : 0;
              
            setPreAssessment(updatedAssessment);
          } else {
            // If fetch fails, use the response data as fallback
            const fallbackData = {
              ...response.data,
              isActive: assessmentData.isActive,
              updatedAt: assessmentData.updatedAt
            };
            setPreAssessment(fallbackData);
          }
        } else {
          // If no ID in response, use the response data directly
          const fallbackData = {
            ...response.data,
            isActive: assessmentData.isActive,
            updatedAt: assessmentData.updatedAt
          };
          setPreAssessment(fallbackData);
        }
        
        setShowSubmitConfirmModal(false);
        setShowCreateModal(false);
        setShowEditModal(false);
        setShowSuccessModal(true);
        
        // Show success toast with improved visibility
        toast.success(preAssessment ? "Pre-assessment updated successfully!" : "Pre-assessment created successfully!", {
          position: "top-center",
          autoClose: 3000,
          hideProgressBar: false,
          closeOnClick: true,
          pauseOnHover: true,
          draggable: true,
          theme: "colored"
        });
        
        // Trigger refresh
        setDataChangeCounter(prev => prev + 1);
        
        // Auto-close success modal after 3 seconds
        setTimeout(() => {
          setShowSuccessModal(false);
        }, 3000);
      } else {
        setError(response.message || "Failed to save pre-assessment. Please try again.");
        toast.error(response.message || "Failed to save pre-assessment. Please try again.", {
          position: "top-center",
          autoClose: 3000,
          hideProgressBar: false,
          closeOnClick: true,
          pauseOnHover: true,
          draggable: true,
          theme: "colored"
        });
        setShowSubmitConfirmModal(false);
      }
    } catch (err) {
      console.error('Exception in handleConfirmSubmit:', err);
      setError("Failed to save pre-assessment. Please try again.");
      toast.error("Failed to save pre-assessment. Please try again.", {
        position: "top-center",
        autoClose: 3000,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: true,
        theme: "colored"
      });
      setShowSubmitConfirmModal(false);
    } finally {
      setLoading(false);
    }
  };

  // Handle deletion
  const handleDelete = async () => {
    try {
      if (!preAssessment || !preAssessment._id) {
        setError("Cannot delete: No pre-assessment selected");
        toast.error("Cannot delete: No pre-assessment selected");
        return;
      }
      
      setLoading(true);
      console.log('Deleting pre-assessment:', preAssessment._id);
      
      // Use PreAssessmentService to delete the assessment
      const response = await PreAssessmentService.deletePreAssessment(preAssessment._id);
      console.log('API Response:', response);
      
      if (response.success) {
        setPreAssessment(null);
        setShowDeleteModal(false);
        setShowSuccessModal(true);
        
        toast.success("Pre-assessment deleted successfully!");
        
        setTimeout(() => {
          setShowSuccessModal(false);
        }, 3000);
      } else {
        setError(response.message || "Failed to delete pre-assessment. Please try again.");
        toast.error(response.message || "Failed to delete pre-assessment. Please try again.");
        setShowDeleteModal(false);
      }
    } catch (err) {
      console.error('Exception in handleDelete:', err);
      setError("Failed to delete pre-assessment. Please try again.");
      toast.error("Failed to delete pre-assessment. Please try again.");
      setShowDeleteModal(false);
    } finally {
      setLoading(false);
    }
  };

  // Check if actions are allowed based on status
  const canEdit = () => {
    return true; // Always allow editing
  };

  const canDelete = () => {
    return true; // Always allow deletion
  };

  // Modified to add auto-generation of Question ID
  const handleAddQuestion = () => {
    setCurrentQuestionData({
      questionId: '', // Will be auto-generated when category is selected
      category: '',
      questionType: '',
      questionText: '',
      questionValue: '',
      questionImage: null,
      difficultyLevel: '',
      options: [
        { optionId: '1', optionText: '', isCorrect: true },
        { optionId: '2', optionText: '', isCorrect: false }
      ],
      passages: [
        { pageNumber: 1, pageText: '', pageImage: null }
      ],
      sentenceQuestions: [
        { questionText: '', correctAnswer: '', acceptableAnswers: [] }
      ],

      // For phonological awareness (malapantig questions)
      questionSet: {
        audioTexts: [],
        matchingOptions: [],
        correctPairs: []
      },

      // For decoding questions
      displaySequence: [],
      blankPosition: null,
      dragElements: [],
      correctSequence: [],

      // For word recognition questions
      displayWord: '',
      blankOptions: [],
      correctAnswer: []
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
    const existingCount = formData.questions.filter(q => categoryDisplayNameToKey[q.category] === categoryId).length;
    const paddedNumber = String(existingCount + 1).padStart(3, '0');
    
    return `${prefix}_${paddedNumber}`;
  };

  // Restore missing handleEditQuestion function
  const handleEditQuestion = (index) => {
    const question = formData.questions[index];
    
    // Handle category field mapping - use category directly from backend JSON
    const categoryId = question.category ? categoryDisplayNameToKey[question.category] : '';
    
    // Create a comprehensive question data object with all category-specific fields
    const baseQuestionData = {
      questionId: question.questionId || '',
      category: question.category || '',
      questionType: question.questionType || '',
      questionText: question.questionText || '',
      difficultyLevel: question.difficultyLevel || '',
      // CRITICAL FIX: For "Anong kasing tunog" questions, map displayWord to questionValue
      questionValue: question.questionText === 'Anong kasing tunog ng salitang nakikita?'
        ? (question.displayWord || question.questionValue || '')
        : (question.questionValue || ''),
      questionImage: question.questionImage || null,
      
      // Alphabet Knowledge - Multiple choice options
      options: question.options && question.options.length > 0 ? 
        question.options.map(opt => ({...opt})) : 
        [
          { optionId: '1', optionText: '', isCorrect: true },
          { optionId: '2', optionText: '', isCorrect: false },
          { optionId: '3', optionText: '', isCorrect: false }
        ],
      
      // Reading Comprehension - Passages and sentence questions
      passages: question.passages && question.passages.length > 0 ?
        question.passages.map(p => ({
          pageNumber: p.pageNumber,
          pageText: p.pageText || '',
          pageImage: p.pageImage || null,
        })) :
        [{ pageNumber: 1, pageText: '', pageImage: null }],
      
      sentenceQuestions: question.sentenceQuestions && question.sentenceQuestions.length > 0 ?
        question.sentenceQuestions.map(sq => ({
          questionText: sq.questionText || '',
          correctAnswer: sq.correctAnswer || '',
          acceptableAnswers: sq.acceptableAnswers || []
        })) :
        [{ questionText: '', correctAnswer: '', acceptableAnswers: [] }],
      
      // Phonological Awareness - Audio matching
      questionSet: {
        audioTexts: question.questionSet?.audioTexts || [],
        matchingOptions: question.questionSet?.matchingOptions || [],
        correctPairs: question.questionSet?.correctPairs || []
      },
      
      // Decoding - Letter sequences
      displaySequence: question.displaySequence || [],
      blankPosition: question.blankPosition || null,
      dragElements: question.dragElements || [],
      correctSequence: question.correctSequence || [],
      
      // Word Recognition - Fill in blanks
      displayWord: question.displayWord || '',
      completeSentence: question.displayWord || '', // For sentence input field
      blankOptions: question.blankOptions || [],
      correctAnswer: question.correctAnswer || []
    };
    
    console.log('Editing question with comprehensive data:', baseQuestionData);
    setCurrentQuestionData(baseQuestionData);
    setEditingQuestionIndex(index);
    setShowQuestionEditor(true);
  };

  // Restore missing handleDeleteQuestion function
  const handleDeleteQuestion = (index) => {
    // Show confirmation modal before deleting
    setQuestionToDelete(index);
    setShowDeleteQuestionModal(true);
  };

  // Confirm delete question function
  const confirmDeleteQuestion = async () => {
    if (questionToDelete !== null) {
      try {
        setLoading(true);
        
        // Get the question ID from the questions array
        const questionId = formData.questions[questionToDelete].questionId;
        
        if (preAssessment && preAssessment._id && questionId) {
          console.log(`Deleting question ${questionId} from assessment ${preAssessment._id}`);
          
          // Use PreAssessmentService to delete the question
          const response = await PreAssessmentService.deleteQuestionFromPreAssessment(
            preAssessment._id,
            questionId
          );
          
          console.log('API Response:', response);
          
          if (response.success) {
            // Update the local state with the updated assessment from the API
            setPreAssessment(response.data);
            
            // Also update the form data
            setFormData(prev => {
              const updatedQuestions = response.data.questions || [];
              const updatedCategoryCounts = recalculateCategoryCounts(updatedQuestions);
              return {
                ...prev,
                questions: updatedQuestions,
                categoryCounts: updatedCategoryCounts,
                totalQuestions: updatedQuestions.length
              };
            });
            
            toast.success("Question deleted successfully!");
            
            // Trigger refresh to ensure data consistency
            setDataChangeCounter(prev => prev + 1);
          } else {
            setError(response.message || "Failed to delete question. Please try again.");
            toast.error(response.message || "Failed to delete question. Please try again.");
          }
        } else {
          // No assessment ID yet, just update the local state
          setFormData(prev => {
            const newQuestions = prev.questions.filter((_, i) => i !== questionToDelete);
            const updatedCategoryCounts = recalculateCategoryCounts(newQuestions);
            return {
              ...prev,
              questions: newQuestions,
              categoryCounts: updatedCategoryCounts,
              totalQuestions: newQuestions.length
            };
          });
          
          // Also update preAssessment state if it exists
          if (preAssessment) {
            setPreAssessment(prev => ({
              ...prev,
              questions: formData.questions.filter((_, i) => i !== questionToDelete),
              categoryCounts: recalculateCategoryCounts(formData.questions.filter((_, i) => i !== questionToDelete)),
              totalQuestions: formData.questions.filter((_, i) => i !== questionToDelete).length
            }));
          }
          
          toast.success("Question removed from draft!");
        }
      } catch (err) {
        console.error('Exception in handleDeleteQuestion:', err);
        setError("Failed to delete question. Please try again.");
        toast.error("Failed to delete question. Please try again.");
      } finally {
        setLoading(false);
        // Close modal and reset state
        setShowDeleteQuestionModal(false);
        setQuestionToDelete(null);
      }
    }
  };

  // Modified to update questionId when category changes
  const handleQuestionDataChange = (e) => {
    const { name, value } = e.target;
    
    if (name === 'category') {
      // Auto-generate questionId when category is selected
      const categoryKey = categoryDisplayNameToKey[value];
      const questionId = generateQuestionId(categoryKey);
      
      // Auto-set question type based on category (fixed for all except alphabet_knowledge)
      let questionTypeName = '';
      if (categoryKey === 'alphabet_knowledge') {
        // For alphabet knowledge, keep it empty so user can select patinig/katinig
        questionTypeName = '';
      } else if (categoryKey === 'phonological_awareness') {
        questionTypeName = 'malapantig';
      } else if (categoryKey === 'decoding') {
        questionTypeName = 'decode';
      } else if (categoryKey === 'word_recognition') {
        questionTypeName = 'word';
      } else if (categoryKey === 'reading_comprehension') {
        questionTypeName = 'sentence';
      }
      
      console.log(`Setting question type to ${questionTypeName} for category ${value}`);
      
      setCurrentQuestionData(prev => ({
        ...prev,
        [name]: value,
        questionId: questionId,
        questionType: questionTypeName,
        
        // Reset category-specific fields when changing category
        ...(categoryKey === 'alphabet_knowledge' && {
          options: [
            { optionId: '1', optionText: '', isCorrect: true },
            { optionId: '2', optionText: '', isCorrect: false },
            { optionId: '3', optionText: '', isCorrect: false }
          ]
        }),
        
        ...(categoryKey === 'phonological_awareness' && {
          questionValue: null,
          questionImage: null,
          questionSet: {
            audioTexts: [],
            matchingOptions: [],
            correctPairs: []
          }
        }),
        
        ...(categoryKey === 'decoding' && {
          questionValue: null,
          displaySequence: [],
          blankPosition: null,
          dragElements: [],
          correctSequence: []
        }),
        
        ...(categoryKey === 'word_recognition' && {
          questionValue: null,
          displayWord: '',
          blankOptions: [],
          correctAnswer: []
        }),
        
        ...(categoryKey === 'reading_comprehension' && {
          passages: [
            { pageNumber: 1, pageText: '', pageImage: null }
          ],
          sentenceQuestions: [
            { questionText: '', correctAnswer: '', acceptableAnswers: [] }
          ]
        })
      }));
    } else {
      setCurrentQuestionData(prev => ({
        ...prev,
        [name]: value
      }));
    }
  };

  // Handle question image upload with S3 path
  const handleQuestionImageUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    
    try {
      // Show loading state
      setLoading(true);
      
      // First show a preview from local file
      const reader = new FileReader();
      reader.onload = () => {
        setCurrentQuestionData(prev => ({
          ...prev,
          questionImage: reader.result,
          // We'll set the S3 path after upload
        }));
      };
      reader.readAsDataURL(file);
      
      // Only upload to S3 when saving the question
      // This keeps the image as a preview until the user confirms
    } catch (error) {
      console.error("Error processing image:", error);
    } finally {
      setLoading(false);
    }
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

  // Phonological Awareness handlers
  const handleAudioTextChange = (index, value) => {
    // Validation: Only allow letters and convert to uppercase
    const sanitizedValue = value.replace(/[^a-zA-Z]/g, '').toUpperCase();
    
    setCurrentQuestionData(prev => ({
      ...prev,
      questionSet: {
        ...prev.questionSet,
        audioTexts: prev.questionSet.audioTexts.map((item, i) => i === index ? sanitizedValue : item),
        // Auto-update matching options to match audio texts
        matchingOptions: prev.questionSet.matchingOptions.map((item, i) => {
          if (i === index) {
            if (!sanitizedValue) return '';
            // If single letter, use format "Aa", otherwise use same word
            return sanitizedValue.length === 1 
              ? sanitizedValue.toUpperCase() + sanitizedValue.toLowerCase()
              : sanitizedValue.toUpperCase();
          }
          return item;
        }),
        // Auto-update correct pairs
        correctPairs: prev.questionSet.correctPairs.map((pair, i) => {
          if (i === index) {
            if (!sanitizedValue) return { audio: '', match: '' };
            const matchValue = sanitizedValue.length === 1 
              ? sanitizedValue.toUpperCase() + sanitizedValue.toLowerCase()
              : sanitizedValue.toUpperCase();
            return { 
              audio: sanitizedValue.toUpperCase(), 
              match: matchValue
            };
          }
          return pair;
        })
      }
    }));
  };

  const addAudioTextItem = () => {
    setCurrentQuestionData(prev => {
      // Limit to maximum 4 audio texts
      if (prev.questionSet.audioTexts.length >= 4) {
        toast.error('Maximum 4 audio texts allowed');
        return prev;
      }
      
      return {
        ...prev,
        questionSet: {
          ...prev.questionSet,
          audioTexts: [...prev.questionSet.audioTexts, ''],
          matchingOptions: [...prev.questionSet.matchingOptions, ''],
          correctPairs: [...prev.questionSet.correctPairs, { audio: '', match: '' }]
        }
      };
    });
  };

  const removeAudioTextItem = (index) => {
    setCurrentQuestionData(prev => ({
      ...prev,
      questionSet: {
        ...prev.questionSet,
        audioTexts: prev.questionSet.audioTexts.filter((_, i) => i !== index),
        matchingOptions: prev.questionSet.matchingOptions.filter((_, i) => i !== index),
        correctPairs: prev.questionSet.correctPairs.filter((_, i) => i !== index)
      }
    }));
  };

  const handleMatchingOptionChange = (index, value) => {
    setCurrentQuestionData(prev => ({
      ...prev,
      questionSet: {
        ...prev.questionSet,
        matchingOptions: prev.questionSet.matchingOptions.map((item, i) => i === index ? value : item)
      }
    }));
  };

  const handleCorrectPairChange = (index, field, value) => {
    setCurrentQuestionData(prev => ({
      ...prev,
      questionSet: {
        ...prev.questionSet,
        correctPairs: prev.questionSet.correctPairs.map((pair, i) => 
          i === index ? { ...pair, [field]: value } : pair
        )
      }
    }));
  };

  // Decoding handlers
  const handleDecodingQuestionTypeChange = (questionType) => {
    setCurrentQuestionData(prev => ({
      ...prev,
      questionText: questionType,
      // Reset arrays when switching question type
      displaySequence: questionType === 'Tukuyin ang nasa larawan' ? null : [],
      blankPosition: questionType === 'Buoin ang salita' ? 0 : null,
      dragElements: [],
      correctSequence: []
    }));
  };

  const handleDisplaySequenceChange = (index, value) => {
    // For "Buoin ang salita", only allow single letters, for blanks use empty string
    const sanitizedValue = currentQuestionData.questionText === 'Buoin ang salita' 
      ? (value === '' ? '' : value.replace(/[^a-zA-Z]/g, '').toUpperCase().slice(0, 1))
      : value.replace(/[^a-zA-Z]/g, '').toUpperCase().slice(0, 1);
      
    setCurrentQuestionData(prev => ({
      ...prev,
      displaySequence: prev.displaySequence.map((item, i) => i === index ? sanitizedValue : item)
    }));
  };

  const addSequenceItem = () => {
    setCurrentQuestionData(prev => ({
      ...prev,
      displaySequence: [...prev.displaySequence, '']
    }));
  };

  const removeSequenceItem = (index) => {
    setCurrentQuestionData(prev => ({
      ...prev,
      displaySequence: prev.displaySequence.filter((_, i) => i !== index)
    }));
  };

  const handleDragElementChange = (index, value) => {
    setCurrentQuestionData(prev => ({
      ...prev,
      dragElements: prev.dragElements.map((item, i) => i === index ? value : item)
    }));
  };

  const addDragElement = () => {
    setCurrentQuestionData(prev => ({
      ...prev,
      dragElements: [...prev.dragElements, '']
    }));
  };

  const removeDragElement = (index) => {
    setCurrentQuestionData(prev => ({
      ...prev,
      dragElements: prev.dragElements.filter((_, i) => i !== index)
    }));
  };

  const handleCorrectSequenceChange = (index, value) => {
    setCurrentQuestionData(prev => ({
      ...prev,
      correctSequence: prev.correctSequence.map((item, i) => i === index ? value : item)
    }));
  };

  const addCorrectSequenceItem = () => {
    setCurrentQuestionData(prev => ({
      ...prev,
      correctSequence: [...prev.correctSequence, '']
    }));
  };

  const removeCorrectSequenceItem = (index) => {
    setCurrentQuestionData(prev => ({
      ...prev,
      correctSequence: prev.correctSequence.filter((_, i) => i !== index)
    }));
  };

  // Word Recognition handlers
  const handleBlankOptionChange = (index, value) => {
    // Allow letters only, preserve case (no numbers)
    let sanitizedValue = value.replace(/[^a-zA-Z\s]/g, '');

    // For "Anong kasing tunog" questions, enforce complete words but keep original case
    if (currentQuestionData.questionText === 'Anong kasing tunog ng salitang nakikita?') {
      // Keep original case and remove extra spaces for consistency
      sanitizedValue = sanitizedValue.trim().replace(/\s+/g, ' ');

      // Validate it's a complete word (no short fragments that look like syllables)
      const words = sanitizedValue.split(' ');
      const validWords = words.filter(word => word.length >= 3); // Minimum 3 characters for complete words
      sanitizedValue = validWords.join(' ');
    }

    setCurrentQuestionData(prev => ({
      ...prev,
      blankOptions: prev.blankOptions.map((item, i) => i === index ? sanitizedValue : item)
    }));
  };

  const addBlankOption = () => {
    setCurrentQuestionData(prev => ({
      ...prev,
      blankOptions: [...prev.blankOptions, '']
    }));
  };

  const removeBlankOption = (index) => {
    setCurrentQuestionData(prev => ({
      ...prev,
      blankOptions: prev.blankOptions.filter((_, i) => i !== index)
    }));
  };

  const handleCorrectAnswerChange = (index, value) => {
    // Allow letters only, preserve case (no numbers)
    const sanitizedValue = value.replace(/[^a-zA-Z\s]/g, '');
    setCurrentQuestionData(prev => ({
      ...prev,
      correctAnswer: prev.correctAnswer.map((item, i) => i === index ? sanitizedValue : item)
    }));
  };

  const addCorrectAnswer = () => {
    setCurrentQuestionData(prev => ({
      ...prev,
      correctAnswer: [...prev.correctAnswer, '']
    }));
  };

  const removeCorrectAnswer = (index) => {
    setCurrentQuestionData(prev => ({
      ...prev,
      correctAnswer: prev.correctAnswer.filter((_, i) => i !== index)
    }));
  };

  // Reading Comprehension handlers
  const handlePassageTextChange = (index, value) => {
    setCurrentQuestionData(prev => ({
      ...prev,
      passages: prev.passages.map((passage, i) => 
        i === index ? { ...passage, pageText: value } : passage
      )
    }));
  };

  const addPassage = () => {
    setCurrentQuestionData(prev => ({
      ...prev,
      passages: [...prev.passages, { 
        pageNumber: prev.passages.length + 1, 
        pageText: '', 
        pageImage: null, 
        pageImageS3Path: null 
      }]
    }));
  };

  const removePassage = (index) => {
    setCurrentQuestionData(prev => ({
      ...prev,
      passages: prev.passages.filter((_, i) => i !== index).map((passage, i) => ({
        ...passage,
        pageNumber: i + 1
      }))
    }));
  };

  const handleSentenceQuestionTextChange = (index, value) => {
    setCurrentQuestionData(prev => ({
      ...prev,
      sentenceQuestions: prev.sentenceQuestions.map((question, i) => 
        i === index ? { ...question, questionText: value } : question
      )
    }));
  };

  const handleSentenceQuestionAnswerChange = (index, value) => {
    setCurrentQuestionData(prev => ({
      ...prev,
      sentenceQuestions: prev.sentenceQuestions.map((question, i) => 
        i === index ? { ...question, correctAnswer: value } : question
      )
    }));
  };

  const handleAcceptableAnswerChange = (questionIndex, answerIndex, value) => {
    setCurrentQuestionData(prev => ({
      ...prev,
      sentenceQuestions: prev.sentenceQuestions.map((question, i) => 
        i === questionIndex ? {
          ...question,
          acceptableAnswers: question.acceptableAnswers.map((answer, j) => 
            j === answerIndex ? value : answer
          )
        } : question
      )
    }));
  };

  const addAcceptableAnswer = (questionIndex) => {
    setCurrentQuestionData(prev => ({
      ...prev,
      sentenceQuestions: prev.sentenceQuestions.map((question, i) => 
        i === questionIndex ? {
          ...question,
          acceptableAnswers: [...question.acceptableAnswers, '']
        } : question
      )
    }));
  };

  const removeAcceptableAnswer = (questionIndex, answerIndex) => {
    setCurrentQuestionData(prev => ({
      ...prev,
      sentenceQuestions: prev.sentenceQuestions.map((question, i) => 
        i === questionIndex ? {
          ...question,
          acceptableAnswers: question.acceptableAnswers.filter((_, j) => j !== answerIndex)
        } : question
      )
    }));
  };

  const addSentenceQuestion = () => {
    setCurrentQuestionData(prev => ({
      ...prev,
      sentenceQuestions: [...prev.sentenceQuestions, { 
        questionText: '', 
        correctAnswer: '', 
        acceptableAnswers: [] 
      }]
    }));
  };

  const removeSentenceQuestion = (index) => {
    setCurrentQuestionData(prev => ({
      ...prev,
      sentenceQuestions: prev.sentenceQuestions.filter((_, i) => i !== index)
    }));
  };


  // Modified to handle S3 upload when saving
  const handleSaveQuestion = async () => {
    try {
      // Validation checks
      if (!currentQuestionData.category) {
        toast.error('Please select a category');
        return;
      }

      if (!currentQuestionData.difficultyLevel) {
        toast.error('Please select a difficulty level');
        return;
      }
    
      // Skip questionText validation for Reading Comprehension (questions are at sentence level)
      if (currentQuestionData.category !== 'Reading Comprehension' && !currentQuestionData.questionText.trim()) {
        toast.error('Question text is required');
        return;
      }
    
    
      // Category-specific validation
      if (currentQuestionData.category === 'Alphabet Knowledge') {
        // Alphabet Knowledge validation - requires 3 options
        if (!currentQuestionData.options || currentQuestionData.options.length < 3) {
          toast.error('Alphabet Knowledge questions require 3 answer options');
          return;
        }
        const hasEmptyOption = currentQuestionData.options.some(opt => !opt.optionText.trim());
        if (hasEmptyOption) {
          toast.error('All answer options must have text');
          return;
        }
        const hasCorrectAnswer = currentQuestionData.options.some(opt => opt.isCorrect);
        if (!hasCorrectAnswer) {
          toast.error('Please mark one option as correct');
          return;
        }
      } else if (currentQuestionData.category === 'Phonological Awareness') {
        // Phonological Awareness validation
        if (!currentQuestionData.questionSet.audioTexts || currentQuestionData.questionSet.audioTexts.length === 0) {
          toast.error('At least one audio text is required');
          return;
        }
        const hasEmptyAudioText = currentQuestionData.questionSet.audioTexts.some(text => !text.trim());
        if (hasEmptyAudioText) {
          toast.error('All audio texts must be filled');
          return;
        }
        if (currentQuestionData.questionSet.matchingOptions.length !== currentQuestionData.questionSet.audioTexts.length) {
          toast.error('Number of matching options must equal number of audio texts');
          return;
        }
        const hasEmptyMatchingOption = currentQuestionData.questionSet.matchingOptions.some(option => !option.trim());
        if (hasEmptyMatchingOption) {
          toast.error('All matching options must be filled');
          return;
        }
        if (currentQuestionData.questionSet.correctPairs.length !== currentQuestionData.questionSet.audioTexts.length) {
          toast.error('Number of correct pairs must equal number of audio texts');
          return;
        }
        const hasIncompletePairs = currentQuestionData.questionSet.correctPairs.some(pair => !pair.audio || !pair.match);
        if (hasIncompletePairs) {
          toast.error('All correct pairs must be configured');
          return;
        }
      } else if (categoryDisplayNameToKey[currentQuestionData.category] === 'decoding') {
        // Decoding validation
        if (currentQuestionData.questionText === 'Buoin ang salita' && (!currentQuestionData.displaySequence || currentQuestionData.displaySequence.length === 0)) {
          toast.error('Display sequence is required for "Buoin ang salita" questions');
          return;
        }
        if (!currentQuestionData.dragElements || currentQuestionData.dragElements.length === 0) {
          toast.error('Drag elements are required for decoding questions');
          return;
        }
        const hasEmptyDragElement = currentQuestionData.dragElements.some(element => !element.trim());
        if (hasEmptyDragElement) {
          toast.error('All drag elements must be filled');
          return;
        }
        if (!currentQuestionData.correctSequence || currentQuestionData.correctSequence.length === 0) {
          toast.error('Correct sequence is required for decoding questions');
          return;
        }
        const hasEmptyCorrectSequence = currentQuestionData.correctSequence.some(element => !element.trim());
        if (hasEmptyCorrectSequence) {
          toast.error('All correct sequence elements must be filled');
          return;
        }
      } else if (categoryDisplayNameToKey[currentQuestionData.category] === 'word_recognition') {
        // Word Recognition validation
        if (!currentQuestionData.displayWord || !currentQuestionData.displayWord.trim()) {
          toast.error('Display word/sentence is required for word recognition questions');
          return;
        }
        if (!currentQuestionData.blankOptions || currentQuestionData.blankOptions.length === 0) {
          toast.error('Answer options are required for word recognition questions');
          return;
        }
        const hasEmptyBlankOption = currentQuestionData.blankOptions.some(option => !option.trim());
        if (hasEmptyBlankOption) {
          toast.error('All answer options must be filled');
          return;
        }

        // Additional validation for "Anong kasing tunog" questions - ensure complete words
        if (currentQuestionData.questionText === 'Anong kasing tunog ng salitang nakikita?') {
          const hasSyllableFragments = currentQuestionData.blankOptions.some(option => {
            const words = option.trim().split(' ');
            return words.some(word => word.length < 3); // Less than 3 characters likely a syllable fragment
          });
          if (hasSyllableFragments) {
            toast.error('For sound matching questions, please use complete words (not syllables or word fragments)');
            return;
          }

          // Ensure at least 2 options for sound matching questions
          if (currentQuestionData.blankOptions.length < 2) {
            toast.error('Sound matching questions must have at least 2 answer options');
            return;
          }
        }
        if (!currentQuestionData.correctAnswer || currentQuestionData.correctAnswer.length === 0) {
          toast.error('At least one correct answer is required');
          return;
        }

        // For "Anong kasing tunog" questions, ensure exactly one correct answer
        if (currentQuestionData.questionText === 'Anong kasing tunog ng salitang nakikita?') {
          if (currentQuestionData.correctAnswer.length !== 1) {
            toast.error('Sound matching questions must have exactly one correct answer');
            return;
          }
        }

        const hasEmptyCorrectAnswer = currentQuestionData.correctAnswer.some(answer => !answer.trim());
        if (hasEmptyCorrectAnswer) {
          toast.error('All correct answers must be selected');
          return;
        }
      } else if (categoryDisplayNameToKey[currentQuestionData.category] === 'reading_comprehension') {
        // Reading Comprehension validation
        if (!currentQuestionData.passages.length) {
          toast.error('At least one passage is required');
          return;
        }
        const hasEmptyPassage = currentQuestionData.passages.some(p => !p.pageText.trim());
        if (hasEmptyPassage) {
          toast.error('All passages must have text');
          return;
        }
        if (!currentQuestionData.sentenceQuestions.length) {
          toast.error('At least one comprehension question is required');
          return;
        }
        const hasIncompleteSentenceQuestion = currentQuestionData.sentenceQuestions.some(
          q => !q.questionText.trim() || !q.correctAnswer.trim()
        );
        if (hasIncompleteSentenceQuestion) {
          toast.error('All comprehension questions must have text and correct answers');
          return;
        }
      }

      // Generate a question ID if not already set
      if (!currentQuestionData.questionId) {
        currentQuestionData.questionId = generateQuestionId(categoryDisplayNameToKey[currentQuestionData.category]);
      }

      // Make a copy of the current question data to avoid modifying the state directly
      const questionToSave = { ...currentQuestionData };

      // Category is now used directly from the form (matches backend sample JSON structure)
      // No conversion needed as we're using the backend format directly
      
      // Clean up fields based on question category to match sample JSON structure
      const categoryKey = categoryDisplayNameToKey[currentQuestionData.category];
      
      if (categoryKey === 'reading_comprehension') {
        // Only Reading Comprehension should have passages and sentenceQuestions
        // Set questionValue and questionImage to null for RC questions
        questionToSave.questionValue = null;
        questionToSave.questionImage = null;
        
        // Remove fields not needed for RC - questionText is at sentence level only
        delete questionToSave.questionText;
        delete questionToSave.options;
        delete questionToSave.questionSet;
        delete questionToSave.displaySequence;
        delete questionToSave.blankPosition;
        delete questionToSave.dragElements;
        delete questionToSave.correctSequence;
        delete questionToSave.displayWord;
        delete questionToSave.blankOptions;
        delete questionToSave.correctAnswer;
        delete questionToSave.completeWord;
        delete questionToSave.completeSentence;
        delete questionToSave.blankWords;
        delete questionToSave.blankedSentence;
      } else if (categoryKey === 'alphabet_knowledge') {
        // Only Alphabet Knowledge should have options
        // Keep questionValue for AK questions (e.g., "E", "O")
        
        // Remove fields not needed for AK
        delete questionToSave.passages;
        delete questionToSave.sentenceQuestions;
        delete questionToSave.questionSet;
        delete questionToSave.displaySequence;
        delete questionToSave.blankPosition;
        delete questionToSave.dragElements;
        delete questionToSave.correctSequence;
        delete questionToSave.displayWord;
        delete questionToSave.blankOptions;
        delete questionToSave.correctAnswer;
        delete questionToSave.completeWord;
        delete questionToSave.completeSentence;
        delete questionToSave.blankWords;
        delete questionToSave.blankedSentence;
      } else if (categoryKey === 'phonological_awareness') {
        // Only Phonological Awareness should have questionSet
        // Set questionValue and questionImage to null for PA questions
        questionToSave.questionValue = null;
        questionToSave.questionImage = null;
        
        // Remove fields not needed for PA
        delete questionToSave.passages;
        delete questionToSave.sentenceQuestions;
        delete questionToSave.options;
        delete questionToSave.displaySequence;
        delete questionToSave.blankPosition;
        delete questionToSave.dragElements;
        delete questionToSave.correctSequence;
        delete questionToSave.displayWord;
        delete questionToSave.blankOptions;
        delete questionToSave.correctAnswer;
        delete questionToSave.completeWord;
        delete questionToSave.completeSentence;
        delete questionToSave.blankWords;
        delete questionToSave.blankedSentence;
      } else if (categoryKey === 'decoding') {
        // Only Decoding should have displaySequence, blankPosition, dragElements, correctSequence  
        // Set questionValue to null for Decoding questions
        questionToSave.questionValue = null;
        
        // Remove fields not needed for Decoding
        delete questionToSave.passages;
        delete questionToSave.sentenceQuestions;
        delete questionToSave.options;
        delete questionToSave.questionSet;
        delete questionToSave.displayWord;
        delete questionToSave.blankOptions;
        delete questionToSave.correctAnswer;
        delete questionToSave.completeWord;
        delete questionToSave.completeSentence;
        delete questionToSave.blankWords;
        delete questionToSave.blankedSentence;
      } else if (categoryKey === 'word_recognition') {
        // Only Word Recognition should have displayWord, blankOptions, correctAnswer
        // Set questionValue to null for WR questions (field is hidden in UI)
        questionToSave.questionValue = null;
        
        // Remove fields not needed for WR
        delete questionToSave.passages;
        delete questionToSave.sentenceQuestions;
        delete questionToSave.options;
        delete questionToSave.questionSet;
        delete questionToSave.displaySequence;
        delete questionToSave.blankPosition;
        delete questionToSave.dragElements;
        delete questionToSave.correctSequence;
        delete questionToSave.completeWord;
        delete questionToSave.completeSentence;
        delete questionToSave.blankWords;
        delete questionToSave.blankedSentence;
      }

      // Ensure question type is preserved
      if (!questionToSave.questionType || questionToSave.questionType.trim() === '') {
        // Get question type name from the questionTypes array if not already set
        const categoryKey = categoryDisplayNameToKey[questionToSave.category];
        const questionType = questionTypes.find(qt => qt.typeId === categoryKey);
        questionToSave.questionType = questionType ? questionType.typeName : '';
      }

      // For non-reading comprehension questions, handle image upload
      if (categoryDisplayNameToKey[questionToSave.category] !== 'reading_comprehension') {
        // Upload image if present and new
        if (questionToSave.questionImage && 
            typeof questionToSave.questionImage === 'string' && 
            questionToSave.questionImage.startsWith('data:')) {
          try {
            // Convert data URL to file
            const file = await dataURLtoFile(
              questionToSave.questionImage,
              `question_${questionToSave.questionId}.png`
            );
            
            // Upload to server
            const formData = new FormData();
            formData.append('file', file);
            
            const response = await PreAssessmentService.uploadMedia(formData);
            if (response.success) {
              questionToSave.questionImage = response.fileUrl;
            }
          } catch (error) {
            console.error('Error uploading question image:', error);
            toast.error('Failed to upload question image');
            // Continue without the image
            questionToSave.questionImage = null;
          }
        }
      } else {
        // For reading comprehension, explicitly set questionValue and questionImage to null
        questionToSave.questionValue = null;
        questionToSave.questionImage = null;
      }

      // Upload passage images if present and new
      if (categoryDisplayNameToKey[questionToSave.category] === 'reading_comprehension') {
        for (let i = 0; i < questionToSave.passages.length; i++) {
          const passage = questionToSave.passages[i];
          if (passage.pageImage && 
              typeof passage.pageImage === 'string' && 
              passage.pageImage.startsWith('data:')) {
            try {
              // Convert data URL to file
              const file = await dataURLtoFile(
                passage.pageImage,
                `passage_${questionToSave.questionId}_page${passage.pageNumber}.png`
              );
              
              // Upload to server
              const formData = new FormData();
              formData.append('file', file);
              
              const response = await PreAssessmentService.uploadMedia(formData);
              if (response.success) {
                questionToSave.passages[i].pageImage = response.fileUrl;
              }
            } catch (error) {
              console.error('Error uploading passage image:', error);
              toast.error(`Failed to upload image for passage ${passage.pageNumber}`);
              // Continue without the image
              questionToSave.passages[i].pageImage = null;
            }
          }
        }
      }


      // Update the questions array
      const updatedQuestions = [...formData.questions];
      if (editingQuestionIndex >= 0) {
        // When editing, preserve any fields we didn't modify
        updatedQuestions[editingQuestionIndex] = {
          ...updatedQuestions[editingQuestionIndex],
          ...questionToSave
        };
      } else {
        updatedQuestions.push(questionToSave);
      }

      // Recalculate category counts from the updated questions array
      const updatedCategoryCounts = recalculateCategoryCounts(updatedQuestions);

      // Log what we're saving for debugging
      console.log('Saving question:', questionToSave);

      // Update form data with new questions, category counts, and total questions
      setFormData(prev => ({
        ...prev,
        questions: updatedQuestions,
        categoryCounts: updatedCategoryCounts,
        totalQuestions: updatedQuestions.length
      }));

      // Also update preAssessment state immediately to reflect changes in UI
      const updatedPreAssessment = {
        ...preAssessment,
        questions: updatedQuestions,
        categoryCounts: updatedCategoryCounts,
        totalQuestions: updatedQuestions.length,
        updatedAt: new Date().toISOString()
      };

      setPreAssessment(updatedPreAssessment);

      // Now save the changes to the backend
      try {
        let apiResponse;
        if (editingQuestionIndex >= 0) {
          // Update existing question
          apiResponse = await PreAssessmentService.updateQuestionInPreAssessment(
            preAssessment._id,
            questionToSave.questionId,
            questionToSave
          );
        } else {
          // Add new question  
          apiResponse = await PreAssessmentService.addQuestionToPreAssessment(
            preAssessment._id,
            questionToSave
          );
        }

        if (apiResponse.success) {
          // Update with fresh data from server to ensure consistency
          const freshAssessment = apiResponse.data;
          freshAssessment.totalQuestions = freshAssessment.questions ? freshAssessment.questions.length : 0;
          freshAssessment.categoryCounts = recalculateCategoryCounts(freshAssessment.questions || []);
          
          setPreAssessment(freshAssessment);
          console.log('🔄 Updating formData after successful save with:', {
            questionsLength: freshAssessment.questions ? freshAssessment.questions.length : 0,
            categoryCounts: freshAssessment.categoryCounts
          });

          setFormData(prev => {
            const newFormData = {
              ...prev,
              questions: freshAssessment.questions || [],
              categoryCounts: freshAssessment.categoryCounts,
              totalQuestions: freshAssessment.totalQuestions
            };
            console.log('📝 FormData being set to:', {
              questionsLength: newFormData.questions.length,
              categoryCounts: newFormData.categoryCounts
            });
            return newFormData;
          });

          // Trigger refresh to ensure UI consistency
          setDataChangeCounter(prev => prev + 1);
          
          toast.success(editingQuestionIndex >= 0 ? 'Question updated successfully' : 'Question added successfully');
        } else {
          throw new Error(apiResponse.message || 'Failed to save question');
        }
      } catch (error) {
        console.error('Error saving question to backend:', error);
        console.error('Error details:', {
          message: error.message,
          response: error.response?.data,
          status: error.response?.status
        });

        // Only revert if we have valid preAssessment data to revert to
        if (preAssessment && preAssessment.questions && preAssessment.questions.length > 0) {
          setPreAssessment(preAssessment);
          setFormData(prev => ({
            ...prev,
            questions: preAssessment.questions || [],
            categoryCounts: preAssessment.categoryCounts || {},
            totalQuestions: preAssessment.totalQuestions || 0
          }));
        } else {
          // If preAssessment is corrupted/empty, keep current formData state
          console.warn('preAssessment state is empty or corrupted, preserving current formData');
          // Revert only the specific question that failed to save
          if (editingQuestionIndex >= 0) {
            // For edits, revert just that question to its original state
            const originalQuestions = [...formData.questions];
            // Keep the original question unchanged for edits
            setFormData(prev => ({
              ...prev,
              questions: originalQuestions
            }));
          } else {
            // For new questions, just remove the last added question
            setFormData(prev => ({
              ...prev,
              questions: prev.questions.slice(0, -1),
              totalQuestions: Math.max(0, prev.totalQuestions - 1)
            }));
          }
        }

        // Show more specific error message
        const errorMessage = error.response?.data?.message || error.message || 'Unknown error occurred';
        toast.error(`Failed to save question: ${errorMessage}`);
        return;
      }

      // Close the question editor
      setShowQuestionEditor(false);
    } catch (error) {
      console.error('Error saving question:', error);
      toast.error('Failed to save question');
    }
  };

  // Helper function to convert data URL to File object
  const dataURLtoFile = async (dataURL, filename) => {
    const arr = dataURL.split(',');
    const mime = arr[0].match(/:(.*?);/)[1];
    const bstr = atob(arr[1]);
    let n = bstr.length;
    const u8arr = new Uint8Array(n);
    
    while (n--) {
      u8arr[n] = bstr.charCodeAt(n);
    }
    
    return new File([u8arr], filename, { type: mime });
  };

  // Function to get color for each category
  const getCategoryColor = (category) => {
    const colorMap = {
      'alphabet_knowledge': '#4299e1',
      'phonological_awareness': '#48bb78',
      'decoding': '#ed8936',
      'word_recognition': '#9f7aea',
      'reading_comprehension': '#f56565'
    };
    
    return colorMap[category] || '#a0aec0';
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
                  <span className="pre-status-badge active">
                    <FontAwesomeIcon icon={faCheckCircle} /> 
                    Active
                  </span>
                </div>
              </div>
              <p className="pre-assessment-description">{preAssessment.description}</p>
              
              <div className="pre-assessment-details">
                <div className="pre-detail-item">
                  <span className="pre-detail-label">Total Questions:</span>
                  <span className="pre-detail-value">{preAssessment.questions ? preAssessment.questions.length : 0}</span>
                </div>
                <div className="pre-detail-item">
                  <span className="pre-detail-label">Last Updated:</span>
                  <span className="pre-detail-value">
                    {preAssessment.lastUpdated || preAssessment.updatedAt ? 
                      new Date(preAssessment.lastUpdated || preAssessment.updatedAt).toLocaleString() : 
                      new Date().toLocaleString()}
                  </span>
                </div>
              </div>
              
              
              <div className="pre-category-distribution">
                <h4>Category Distribution</h4>
                <div className="pre-category-bars">
                  {Object.entries({
                    'alphabet_knowledge': 'Alphabet Knowledge',
                    'phonological_awareness': 'Phonological Awareness',
                    'decoding': 'Decoding',
                    'word_recognition': 'Word Recognition',
                    'reading_comprehension': 'Reading Comprehension'
                  }).map(([category, label]) => {
                    // Count actual questions per category with better category matching
                    const questionsInCategory = preAssessment.questions ? 
                      preAssessment.questions.filter(q => {
                        // Use category field directly from backend JSON structure
                        const categoryNameMap = {
                          'alphabet_knowledge': 'Alphabet Knowledge',
                          'phonological_awareness': 'Phonological Awareness',
                          'decoding': 'Decoding', 
                          'word_recognition': 'Word Recognition',
                          'reading_comprehension': 'Reading Comprehension'
                        };
                        
                        return q.category === categoryNameMap[category];
                      }).length : 0;
                    
                    // Calculate total questions
                    const totalQuestions = preAssessment.questions ? preAssessment.questions.length : 0;
                    
                    // Calculate percentage based on total questions (avoid division by zero)
                    // Ensure minimum width for visibility
                    const percentage = totalQuestions > 0 ? Math.max((questionsInCategory / totalQuestions) * 100, questionsInCategory > 0 ? 5 : 0) : 0;
                    
                    return (
                      <div key={category} className="pre-category-bar-item">
                        <div className="pre-category-label">
                          {label}
                          <span className="pre-category-label-count">{questionsInCategory}</span>
                        </div>
                        <div className="pre-category-bar-container">
                          <div 
                            className={`pre-category-bar ${questionsInCategory === 0 ? 'pre-category-bar-empty' : ''}`}
                            style={{ width: `${percentage}%` }}
                          >
                            {questionsInCategory > 0 && (
                              <span className="pre-category-count">{questionsInCategory}</span>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
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
            
            
            <button 
              className="pre-action-button"
              onClick={handleEditPreAssessment}
            >
              <FontAwesomeIcon icon={faEdit} />
              <span>Edit Assessment</span>
            </button>
            
            <button 
              className="pre-action-button delete"
              onClick={handleDeleteConfirm}
            >
              <FontAwesomeIcon icon={faTrash} />
              <span>Delete Assessment</span>
            </button>
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
              <h4>Student Assignment</h4>
              <p>New students are automatically assigned the active pre-assessment.</p>
            </div>
          </div>
          <div className="pre-flow-connector">
            <FontAwesomeIcon icon={faArrowRight} />
          </div>
          <div className="pre-flow-step">
            <div className="pre-step-number">3</div>
            <div className="pre-step-content">
              <h4>Assessment Completion</h4>
              <p>Students complete the assessment on the mobile app with automatic scoring.</p>
            </div>
          </div>
          <div className="pre-flow-connector">
            <FontAwesomeIcon icon={faArrowRight} />
          </div>
          <div className="pre-flow-step">
            <div className="pre-step-number">4</div>
            <div className="pre-step-content">
              <h4>Level Assignment & Planning</h4>
              <p>System assigns reading levels and teachers create targeted post-assessments.</p>
            </div>
          </div>
        </div>
      </div>

      {/* Preview Modal */}
      {showPreviewModal && preAssessment && (
        <div className="pre-modal-overlay">
          <div className="pre-modal pre-preview-modal">
            <div className="pre-modal-header">
              <h3>
                <FontAwesomeIcon icon={faEye} className="pre-modal-header-icon" />
                Preview Pre-Assessment
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
            
            {preAssessment.questions && preAssessment.questions.length > 0 ? (
              <div className="pre-modal-body">
                <div className="pre-preview-info">
                  <div className="pre-preview-section">
                    <span className="pre-preview-label">Assessment:</span>
                    <span className="pre-preview-value">{preAssessment.title}</span>
                  </div>
                  
                  <div className="pre-preview-section">
                    <span className="pre-preview-label">Total Questions:</span>
                    <span className="pre-preview-value">{preAssessment.questions.length}</span>
                  </div>
                  
                  <div className="pre-preview-section">
                    <span className="pre-preview-label">Question {currentQuestionIndex + 1} of {preAssessment.questions.length}</span>
                  </div>
                </div>
                
                <div className="pre-question-preview">
                  <div className="pre-question-category">
                    {(preAssessment.questions[currentQuestionIndex].category || 'Unknown').replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                    {preAssessment.questions[currentQuestionIndex].questionType && (
                      <span className="pre-question-subtype"> - {preAssessment.questions[currentQuestionIndex].questionType.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}</span>
                    )}
                  </div>
                  
                  <div className="pre-question-content">
                    {preAssessment.questions[currentQuestionIndex].questionImage && (
                      <div className="pre-question-image">
                        <img 
                          src={preAssessment.questions[currentQuestionIndex].questionImage} 
                          alt="Question visual" 
                          onError={(e) => {
                            console.error('Failed to load image:', preAssessment.questions[currentQuestionIndex].questionImage);
                            e.target.src = 'https://via.placeholder.com/300x200?text=Image+Not+Available';
                          }}
                        />
                      </div>
                    )}
                    
                    <div className="pre-question-text">
                      {preAssessment.questions[currentQuestionIndex].questionText}
                    </div>
                    
                    {preAssessment.questions[currentQuestionIndex].questionValue && (
                      <div className="pre-question-value">
                        <span className="pre-question-value-label">Value:</span>
                        {preAssessment.questions[currentQuestionIndex].questionValue}
                      </div>
                    )}
                  </div>
                  
                  {(() => {
                    const question = preAssessment.questions[currentQuestionIndex];
                    // Use category field directly and convert to internal key format
                    const questionType = question.category;
                    const normalizedType = categoryDisplayNameToKey[questionType] || questionType;
                    
                    return normalizedType === 'reading_comprehension' ? (
                    <div className="pre-reading-comprehension">
                      <div className="pre-passages">
                        <h4>
                          <FontAwesomeIcon icon={faBook} style={{ marginRight: '8px' }} />
                          Story Passages
                        </h4>
                        {question.passages && 
                          question.passages.map((passage, idx) => (
                            <div key={idx} className="pre-passage">
                              <div className="pre-passage-header">Page {passage.pageNumber}</div>
                              <div className="pre-passage-content">
                                {passage.pageImage && (
                                  <div className="pre-passage-image">
                                    <img 
                                      src={passage.pageImage} 
                                      alt={`Page ${passage.pageNumber}`}
                                      onError={(e) => {
                                        e.target.src = 'https://via.placeholder.com/300x200?text=Image+Not+Available';
                                      }}
                                    />
                                  </div>
                                )}
                                <div className="pre-passage-text">{passage.pageText}</div>
                              </div>
                            </div>
                          ))
                        }
                      </div>
                      <div className="pre-sentence-questions">
                        <h4>
                          <FontAwesomeIcon icon={faQuestion} style={{ marginRight: '8px' }} />
                          Comprehension Questions
                        </h4>
                        {question.sentenceQuestions && 
                          question.sentenceQuestions.map((sentenceQuestion, idx) => (
                            <div key={idx} className="pre-sentence-question">
                              <div className="pre-sentence-question-text">{sentenceQuestion.questionText}</div>
                              <div className="pre-sentence-options">
                                <div className="pre-option-item pre-correct-option">
                                  <div className="pre-option-content">{sentenceQuestion.correctAnswer}</div>
                                  <div className="pre-correct-marker">
                                    <FontAwesomeIcon icon={faCheckCircle} />
                                  </div>
                                </div>
                                {sentenceQuestion.acceptableAnswers && sentenceQuestion.acceptableAnswers.length > 0 && (
                                  <div className="pre-option-item">
                                    <div className="pre-option-content">Alternative answers: {sentenceQuestion.acceptableAnswers.join(', ')}</div>
                                  </div>
                                )}
                              </div>
                            </div>
                          ))
                        }
                      </div>
                    </div>
                  ) : normalizedType === 'phonological_awareness' ? (
                    <div className="pre-phonological-awareness">
                      <h4>
                        <FontAwesomeIcon icon={faVolumeUp} style={{ marginRight: '8px' }} />
                        Audio Matching
                      </h4>
                      {question.questionSet && (
                        <div className="pre-matching-preview">
                          <div className="pre-audio-items">
                            <strong>Audio Items:</strong> {question.questionSet.audioTexts && question.questionSet.audioTexts.join(', ')}
                          </div>
                          <div className="pre-matching-options">
                            <strong>Matching Options:</strong> {question.questionSet.matchingOptions && question.questionSet.matchingOptions.join(', ')}
                          </div>
                        </div>
                      )}
                    </div>
                  ) : normalizedType === 'decoding' ? (
                    <div className="pre-decoding">
                      <h4>
                        <FontAwesomeIcon icon={faPuzzlePiece} style={{ marginRight: '8px' }} />
                        Word Decoding
                      </h4>
                      <div className="pre-decoding-preview">
                        {question.displaySequence && (
                          <div className="pre-display-sequence">
                            <strong>Word Sequence:</strong> {question.displaySequence.join(' - ')}
                          </div>
                        )}
                        {question.dragElements && (
                          <div className="pre-drag-elements">
                            <strong>Available Letters:</strong> {question.dragElements.join(', ')}
                          </div>
                        )}
                        {question.correctSequence && (
                          <div className="pre-correct-sequence">
                            <strong>Correct Answer:</strong> {question.correctSequence.join('')}
                          </div>
                        )}
                      </div>
                    </div>
                  ) : normalizedType === 'word_recognition' ? (
                    <div className="pre-word-recognition">
                      <h4>
                        <FontAwesomeIcon icon={faEdit} style={{ marginRight: '8px' }} />
                        Word Recognition
                      </h4>
                      <div className="pre-word-recognition-preview">
                        {question.displayWord && (
                          <div className="pre-display-word">
                            <strong>Sentence:</strong> {question.displayWord}
                          </div>
                        )}
                        {question.blankOptions && (
                          <div className="pre-blank-options">
                            <strong>Answer Options:</strong> <span className="pre-no-uppercase">{question.blankOptions.join(', ')}</span>
                          </div>
                        )}
                        {question.correctAnswer && (
                          <div className="pre-correct-answer">
                            <strong>Correct Answer:</strong> <span className="pre-no-uppercase">{question.correctAnswer.join(', ')}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  ) : normalizedType === 'alphabet_knowledge' && question.options ? (
                    <div className="pre-options-preview">
                      {question.options.map((option, index) => (
                        <div 
                          key={option.optionId || index} 
                          className={`pre-option-item ${option.isCorrect ? 'pre-correct-option' : ''}`}
                        >
                          <div className="pre-option-content pre-no-uppercase">
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
                  ) : (
                    <div className="pre-no-preview">
                      <p>Preview not available for this question type: {questionType || 'Unknown'}</p>
                      <p>Normalized type: {normalizedType}</p>
                      <p>Available fields: {Object.keys(question).join(', ')}</p>
                    </div>
                  );
                  })()}
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
            ) : (
              <div className="pre-modal-body">
                <div className="pre-no-questions-preview">
                  <FontAwesomeIcon icon={faExclamationCircle} size="3x" />
                  <h4>No Questions Available</h4>
                  <p>This assessment doesn't have any questions yet. Add questions before previewing.</p>
                </div>
              </div>
            )}
            
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
                  <div className="pre-language-display">Filipino</div>
                </div>
                
                <div className="pre-form-group">
                  <label htmlFor="totalQuestions">
                    Total Questions:
                    <Tooltip text="Total number of questions in the assessment. This is calculated automatically based on the questions you add." />
                  </label>
                  <div className="pre-total-questions-display">
                    <span className="pre-total-questions-value">
                      {formData.questions?.length || 0}
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
                
                <div className="pre-category-counts">
                  <h5>Category Question Counts</h5>
                  <div className="pre-category-counts-grid">
                  {Object.entries({
                    'alphabet_knowledge': 'Alphabet Knowledge',
                    'phonological_awareness': 'Phonological Awareness',
                    'decoding': 'Decoding',
                    'word_recognition': 'Word Recognition',
                    'reading_comprehension': 'Reading Comprehension'
                  }).map(([category, label]) => {
                      // CRITICAL FIX: Use preAssessment.questions as primary source, fallback to formData
                      const questionsArray = (preAssessment && preAssessment.questions)
                        ? preAssessment.questions
                        : (formData.questions || []);

                    // Debug logging for question count display
                    if (category === 'alphabet_knowledge') {
                      console.log('🔍 QUESTION COUNT DEBUG:', {
                        category: category,
                        label: label,
                        preAssessmentQuestions: preAssessment?.questions?.length || 0,
                        formDataQuestions: formData.questions?.length || 0,
                        usingPreAssessment: !!(preAssessment && preAssessment.questions),
                        finalQuestionsArray: questionsArray.length,
                        showEditModal: showEditModal
                      });
                    }

                    const questionsInCategory = questionsArray.filter(q => {
                      // Use category field directly from backend JSON structure
                      const categoryNameMap = {
                        'alphabet_knowledge': 'Alphabet Knowledge',
                        'phonological_awareness': 'Phonological Awareness',
                        'decoding': 'Decoding',
                        'word_recognition': 'Word Recognition',
                        'reading_comprehension': 'Reading Comprehension'
                      };

                      const matches = q.category === categoryNameMap[category];
                      if (category === 'alphabet_knowledge' && q.category) {
                        console.log('📋 Question filtering:', {
                          questionCategory: q.category,
                          expectedCategory: categoryNameMap[category],
                          matches: matches,
                          questionId: q.questionId
                        });
                      }
                      return matches;
                    }).length;

                    if (category === 'alphabet_knowledge') {
                      console.log('📊 Final count for', label, ':', questionsInCategory);
                    }
                    
                    return (
                        <div key={category} className="pre-category-count-item">
                          <span className="pre-category-count-label">{label}:</span>
                          <span className="pre-category-count-value">{questionsInCategory}</span>
                      </div>
                    );
                  })}
                    <div className="pre-category-count-item pre-category-count-total">
                      <span className="pre-category-count-label">Total Questions:</span>
                      <span className="pre-category-count-value">
                        {formData.questions?.length || 0}
                      </span>
                    </div>
                  </div>
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
              
              {/* Conditional rendering based on whether we're in edit mode or create mode */}
              {formData.questions && formData.questions.length > 0 ? (
                <div className="pre-questions-list">
                  {formData.questions.map((question, index) => (
                    <div key={question.questionId || index} className="pre-question-item">
                      <div className="pre-question-item-header">
                        <div className="pre-question-info">
                          <span className="pre-question-number">Q{index + 1}</span>
                          <div className="pre-question-details">
                            <span className="pre-question-category">
                              {question.category?.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
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
                  <label htmlFor="category">
                    Category: <span className="pre-required-field">*</span>
                    <Tooltip text="Select the reading category for this question" />
                  </label>
                  <select
                    id="category"
                    name="category"
                    value={currentQuestionData.category || ''}
                    onChange={handleQuestionDataChange}
                    required
                    className={!currentQuestionData.category ? 'pre-validation-highlight' : ''}
                  >
                    <option value="">Select Category</option>
                    <option value="Alphabet Knowledge">Alphabet Knowledge</option>
                    <option value="Phonological Awareness">Phonological Awareness</option>
                    <option value="Decoding">Decoding</option>
                    <option value="Word Recognition">Word Recognition</option>
                    <option value="Reading Comprehension">Reading Comprehension</option>
                  </select>
                  {!currentQuestionData.category && (
                    <div className="pre-validation-message">Please select a category</div>
                  )}
                </div>
                
                <div className="pre-form-group">
                  <label htmlFor="questionType">
                    Question Type: <span className="pre-required-field">*</span>
                    <Tooltip text="Specific type within the category" />
                  </label>
                  {categoryDisplayNameToKey[currentQuestionData.category] === 'alphabet_knowledge' ? (
                    <select
                      id="questionType"
                      name="questionType"
                      value={currentQuestionData.questionType || ''}
                      onChange={handleQuestionDataChange}
                      required
                      className={currentQuestionData.category && !currentQuestionData.questionType ? 'pre-validation-highlight' : ''}
                    >
                      <option value="">Select Type</option>
                      <option value="patinig">Patinig</option>
                      <option value="katinig">Katinig</option>
                    </select>
                  ) : (
                    <input
                      type="text"
                      id="questionType"
                      name="questionType"
                      value={
                        categoryDisplayNameToKey[currentQuestionData.category] === 'phonological_awareness' ? 'malapantig' :
                        categoryDisplayNameToKey[currentQuestionData.category] === 'decoding' ? 'decode' :
                        categoryDisplayNameToKey[currentQuestionData.category] === 'word_recognition' ? 'word' :
                        categoryDisplayNameToKey[currentQuestionData.category] === 'reading_comprehension' ? 'sentence' :
                        currentQuestionData.questionType || ''
                      }
                      onChange={handleQuestionDataChange}
                      required
                      disabled
                      className="pre-form-input"
                      style={{ backgroundColor: '#f5f5f5', cursor: 'not-allowed' }}
                    />
                  )}
                  {currentQuestionData.category && !currentQuestionData.questionType && (
                    <div className="pre-validation-message">Please select a question type</div>
                  )}
                  {currentQuestionData.category && getCategoryQuestionTypes(categoryDisplayNameToKey[currentQuestionData.category]).length === 0 && (
                    <div className="pre-validation-message">No question types available for this category</div>
                  )}
                </div>
                
                <div className="pre-form-group">
                  <label htmlFor="difficultyLevel">
                    Reading Level: <span className="pre-required-field">*</span>
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
                
                {/* Question Text - Only for categories that don't have specific question text options */}
                {currentQuestionData.category && 
                 categoryDisplayNameToKey[currentQuestionData.category] !== 'decoding' && 
                 categoryDisplayNameToKey[currentQuestionData.category] !== 'word_recognition' && 
                 categoryDisplayNameToKey[currentQuestionData.category] !== 'reading_comprehension' && (
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
                )}

                {/* Decoding Question Text Selection */}
                {categoryDisplayNameToKey[currentQuestionData.category] === 'decoding' && (
                  <div className="pre-form-group pre-full-width">
                    <label htmlFor="decodingQuestionText">
                      Question Text: <span className="pre-required-field">*</span>
                      <Tooltip text="Select the appropriate question text for your decoding exercise" />
                    </label>
                    <select
                      id="decodingQuestionText"
                      value={currentQuestionData.questionText}
                      onChange={(e) => {
                        const selectedText = e.target.value;
                        setCurrentQuestionData(prev => ({
                          ...prev,
                          questionText: selectedText,
                          // Reset related fields when changing question type
                          displaySequence: selectedText === 'Tukuyin ang nasa larawan' ? null : [],
                          dragElements: [],
                          correctSequence: [],
                          completeWord: '',
                          blankPosition: selectedText === 'Buoin ang salita' ? 0 : null
                        }));
                      }}
                      className="pre-form-select"
                      required
                    >
                      <option value="">Select question text</option>
                      <option value="Tukuyin ang nasa larawan?">Tukuyin ang nasa larawan?</option>
                      <option value="Buoin ang salita">Buoin ang salita</option>
                    </select>
                    {!currentQuestionData.questionText && (
                      <div className="pre-validation-message">Please select a question text</div>
                    )}
                  </div>
                )}

                {/* Word Recognition Question Text Selection */}
                {categoryDisplayNameToKey[currentQuestionData.category] === 'word_recognition' && (
                  <div className="pre-form-group pre-full-width">
                    <label htmlFor="wordRecognitionQuestionText">
                      Question Text: <span className="pre-required-field">*</span>
                      <Tooltip text="Select the appropriate question text for your word recognition exercise" />
                    </label>
                    <select
                      id="wordRecognitionQuestionText"
                      value={currentQuestionData.questionText}
                      onChange={(e) => {
                        const selectedText = e.target.value;
                        setCurrentQuestionData(prev => ({
                          ...prev,
                          questionText: selectedText,
                          // Reset related fields when changing question type
                          completeSentence: '',
                          displayWord: '',
                          blankOptions: [],
                          correctAnswer: [],
                          blankWords: [],
                          blankedSentence: ''
                        }));
                      }}
                      className="pre-form-select"
                      required
                    >
                      <option value="">Select question text</option>
                      <option value="Basahin ang pangungusap. Piliin ang tamang salita mula sa hanay.">Basahin ang pangungusap. Piliin ang tamang salita mula sa hanay.</option>
                      <option value="Anong kasing tunog ng salitang nakikita?">Anong kasing tunog ng salitang nakikita?</option>
                    </select>
                    {!currentQuestionData.questionText && (
                      <div className="pre-validation-message">Please select a question text</div>
                    )}
                  </div>
                )}
                
                {/* Only show Question Value for categories that use it (only alphabet knowledge) */}
                {categoryDisplayNameToKey[currentQuestionData.category] === 'alphabet_knowledge' && (
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
                )}
                
                {/* Only show Question Image for categories that use it (exclude reading comprehension and phonological awareness) */}
                {(categoryDisplayNameToKey[currentQuestionData.category] === 'alphabet_knowledge' ||
                  categoryDisplayNameToKey[currentQuestionData.category] === 'decoding' ||
                  categoryDisplayNameToKey[currentQuestionData.category] === 'word_recognition') && (
                <div className="pre-form-group">
                  <label htmlFor="questionImage" style={{ color: '#4a5568' }}>
                    Question Image:
                    <Tooltip text="Upload an image for this question" />
                  </label>
                  <div className="pre-file-upload-container">
                    <label className="pre-file-upload-btnn">
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
                )}
              </div>
              
              {/* Alphabet Knowledge - Multiple Choice Options */}
              {categoryDisplayNameToKey[currentQuestionData.category] === 'alphabet_knowledge' && (
                <div className="pre-options-section">
                  <div className="pre-section-header">
                    <h5>
                      <FontAwesomeIcon icon={faListAlt} className="pre-section-icon" />
                      Multiple Choice Options
                      <span className="pre-required-field">*</span>
                    </h5>
                    <div className="pre-section-info">
                      <FontAwesomeIcon icon={faInfoCircle} />
                      <span>Create 3 answer options for Alphabet Knowledge questions</span>
                    </div>
                  </div>
                  
                  <div className="pre-options-container">
                    {currentQuestionData.options.map((option, index) => (
                      <div key={index} className={`pre-option-card ${option.isCorrect ? 'correct-option' : ''} ${!option.optionText.trim() ? 'has-error' : ''}`}>
                        <div className="pre-option-header">
                          <div className="pre-option-number">
                            <span>{String.fromCharCode(65 + index)}</span>
                          </div>
                          <div className="pre-option-title">
                            <span>Option {index + 1}</span>
                            {option.isCorrect && (
                              <div className="pre-correct-badge">
                                <FontAwesomeIcon icon={faCheckCircle} />
                                <span>Correct Answer</span>
                              </div>
                            )}
                          </div>
                        </div>
                        
                        <div className="pre-option-content">
                          <div className="pre-option-input-group">
                            <input
                              type="text"
                              value={option.optionText || ''}
                              onChange={(e) => handleOptionTextChange(index, e.target.value)}
                              placeholder={`Enter option ${String.fromCharCode(65 + index)} text...`}
                              className={`pre-option-input ${!option.optionText.trim() ? 'error' : ''}`}
                              aria-label={`Option ${index + 1} text`}
                            />
                            {!option.optionText.trim() && (
                              <div className="pre-input-error">
                                <FontAwesomeIcon icon={faExclamationTriangle} />
                                <span>Option text is required</span>
                              </div>
                            )}
                          </div>
                          
                          <div className="pre-option-controls">
                            <label className={`pre-correct-toggle ${option.isCorrect ? 'active' : ''}`}>
                              <input
                                type="radio"
                                name="correctOption"
                                checked={option.isCorrect || false}
                                onChange={() => handleOptionCorrectChange(index)}
                                className="pre-hidden-radio"
                              />
                              <div className="pre-toggle-content">
                                <FontAwesomeIcon icon={option.isCorrect ? faCheckCircle : faQuestionCircle} />
                                <span>{option.isCorrect ? 'Correct Answer' : 'Mark as Correct'}</span>
                              </div>
                            </label>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                  
                  <div className="pre-options-footer">
                    <div className="pre-help-text">
                      <FontAwesomeIcon icon={faInfoCircle} className="help-icon" />
                      <div className="help-content">
                        <strong>Instructions:</strong>
                        <ul>
                          <li>Fill in all 3 answer options with meaningful text</li>
                          <li>Select exactly one option as the correct answer</li>
                          <li>Options will be randomized for students during assessment</li>
                        </ul>
                      </div>
                    </div>
                    
                    <div className="pre-options-summary">
                      <div className="summary-item">
                        <span className="summary-label">Completed Options:</span>
                        <span className="summary-value">
                          {currentQuestionData.options.filter(opt => opt.optionText.trim()).length}/3
                        </span>
                      </div>
                      <div className="summary-item">
                        <span className="summary-label">Correct Answer Set:</span>
                        <span className={`summary-value ${currentQuestionData.options.some(opt => opt.isCorrect) ? 'success' : 'error'}`}>
                          {currentQuestionData.options.some(opt => opt.isCorrect) ? 'Yes' : 'No'}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Phonological Awareness - Audio Matching */}
              {categoryDisplayNameToKey[currentQuestionData.category] === 'phonological_awareness' && (
                <div className="pre-phonological-section">
                  <div className="pre-section-header">
                    <FontAwesomeIcon icon={faVolumeUp} className="pre-section-icon" />
                    <h5 className="pre-section-title">Audio Matching Configuration <span className="pre-required-field">*</span></h5>
                    <Tooltip text="Configure audio texts (letters or words) and their matching options for malapantig questions" />
                  </div>
                  
                  {/* Audio Texts */}
                  <div className="pre-audio-texts-section">
                    <div className="pre-subsection-header">
                      <h6 className="pre-subsection-title">Audio Texts (TTS will read these)</h6>
                      <span className="pre-limit-indicator">{currentQuestionData.questionSet.audioTexts.length}/4 items</span>
                    </div>
                    <p className="pre-subsection-description">Enter letters (e.g., H, T) or words (e.g., DAGA, MATA) that will be read aloud by text-to-speech</p>
                    
                    <div className="pre-audio-texts-grid">
                      {currentQuestionData.questionSet.audioTexts.map((audioText, index) => (
                        <div key={index} className="pre-audio-text-card">
                          <div className="pre-audio-text-header">
                            <span className="pre-audio-text-label">Audio {index + 1}</span>
                            {currentQuestionData.questionSet.audioTexts.length > 1 && (
                              <button
                                type="button"
                                onClick={() => removeAudioTextItem(index)}
                                className="pre-remove-btn-small"
                                title="Remove"
                              >
                                <FontAwesomeIcon icon={faTimes} />
                              </button>
                            )}
                          </div>
                          <input
                            type="text"
                            value={audioText}
                            onChange={(e) => handleAudioTextChange(index, e.target.value)}
                            placeholder="Enter letter (e.g., H) or word (e.g., DAGA)"
                            className="pre-audio-text-input"
                          />
                          <div className="pre-auto-generated">
                            Auto-match: {audioText ? (
                              audioText.length === 1 
                                ? audioText.toUpperCase() + audioText.toLowerCase()
                                : audioText.toUpperCase()
                            ) : 'Hh'}
                          </div>
                        </div>
                      ))}
                    </div>
                    
                    {currentQuestionData.questionSet.audioTexts.length < 4 && (
                      <button
                        type="button"
                        onClick={addAudioTextItem}
                        className="pre-add-btn-primary"
                      >
                        <FontAwesomeIcon icon={faPlus} />
                        Add Audio Text
                      </button>
                    )}
                  </div>

                  {/* Matching Options - Auto-generated display */}
                  <div className="pre-matching-options-section">
                    <div className="pre-subsection-header">
                      <h6 className="pre-subsection-title">Matching Options (Visual choices)</h6>
                      <span className="pre-auto-label">Auto-generated & Shuffled</span>
                    </div>
                    <p className="pre-subsection-description">These are automatically generated based on your audio texts and will be randomly shuffled for students</p>
                    
                    <div className="pre-matching-options-preview">
                      {shuffleArray(currentQuestionData.questionSet.matchingOptions).map((option, index) => (
                        <div key={`shuffled-${index}-${option}`} className="pre-matching-option-display">
                          <span className="pre-option-number">{index + 1}</span>
                          <span className="pre-option-text">{option || 'Enter audio text first'}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Correct Pairs - Auto-configured */}
                  <div className="pre-correct-pairs-section">
                    <div className="pre-subsection-header">
                      <h6 className="pre-subsection-title">Correct Audio-Visual Pairs</h6>
                      <span className="pre-auto-label">Auto-configured</span>
                    </div>
                    <p className="pre-subsection-description">Pairs are automatically created from your audio texts</p>
                    
                    <div className="pre-pairs-preview">
                      {currentQuestionData.questionSet.correctPairs.map((pair, index) => (
                        <div key={index} className="pre-pair-display">
                          <div className="pre-pair-number">Pair {index + 1}</div>
                          <div className="pre-pair-content">
                            <div className="pre-pair-audio">
                              <FontAwesomeIcon icon={faVolumeUp} />
                              <span>{pair.audio || '?'}</span>
                            </div>
                            <div className="pre-pair-arrow">
                              <FontAwesomeIcon icon={faArrowRight} />
                            </div>
                            <div className="pre-pair-visual">
                              <span>{pair.match || '??'}</span>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}


              {/* Decoding - Letter Sequence Configuration */}
              {categoryDisplayNameToKey[currentQuestionData.category] === 'decoding' && currentQuestionData.questionText && (
                <div className="pre-decoding-section">
                  <div className="pre-section-header">
                    <FontAwesomeIcon icon={faArrowRight} className="pre-section-icon" />
                    <h5 className="pre-section-title">Letter Sequence Configuration <span className="pre-required-field">*</span></h5>
                    <Tooltip text="Configure letter sequences for decode questions" />
                  </div>
                  
                  {/* Question Type Note */}
                  <div className="pre-question-type-note">
                    <div className="pre-note-content">
                      <FontAwesomeIcon icon={faInfoCircle} className="pre-note-icon" />
                      <div className="pre-note-text">
                        <p><strong>Selected Question Type:</strong></p>
                        {currentQuestionData.questionText === 'Tukuyin ang nasa larawan?' && (
                          <p>• Students will identify the complete word from the image by arranging all letters</p>
                        )}
                        {currentQuestionData.questionText === 'Buoin ang salita' && (
                          <p>• Students will fill in missing letter(s) to complete the word</p>
                        )}
                        {!currentQuestionData.questionText && (
                          <p>• Please select a question text to see the configuration options</p>
                        )}
                      </div>
                    </div>
                  </div>

                  {currentQuestionData.questionText && (
                    <>
                      {/* Display Sequence */}
                      <div className="pre-display-sequence-section">
                        <div className="pre-subsection-header">
                          <h6 className="pre-subsection-title">
                            {currentQuestionData.questionText === 'Buoin ang salita' ? 'Word with Blank Position' : 'Complete Word Letters'}
                          </h6>
                        </div>
                        <p className="pre-subsection-description">
                          {currentQuestionData.questionText === 'Buoin ang salita' 
                            ? 'Enter the complete word, then mark which position should be blank for students to fill'
                            : 'Enter all letters of the word that students will arrange from the image'}
                        </p>
                        
                        {currentQuestionData.questionText === 'Buoin ang salita' ? (
                          // For "Buoin ang salita" - show complete word with blank position selector
                          <div className="pre-buoin-word-builder">
                            <div className="pre-form-group">
                              <label>Complete Word:</label>
                              <input
                                type="text"
                                value={currentQuestionData.completeWord || ''}
                                onChange={(e) => {
                                  const word = e.target.value.replace(/[^a-zA-Z]/g, '');
                                  const sequence = word.split('');
                                  setCurrentQuestionData(prev => ({
                                    ...prev,
                                    completeWord: word,
                                    displaySequence: sequence.map((letter, index) => 
                                      index === (prev.blankPosition || 0) ? '' : letter
                                    ),
                                    correctSequence: prev.blankPosition !== null ? [sequence[prev.blankPosition] || ''] : []
                                  }));
                                }}
                                placeholder="Enter complete word (e.g., TINAPAY)"
                                className="pre-complete-word-input"
                              />
                            </div>
                            
                            {currentQuestionData.completeWord && (
                              <div className="pre-blank-position-selector">
                                <label>Select Blank Position:</label>
                                <div className="pre-word-positions">
                                  {currentQuestionData.completeWord.split('').map((letter, index) => (
                                    <button
                                      key={index}
                                      type="button"
                                      className={`pre-position-btn ${currentQuestionData.blankPosition === index ? 'selected' : ''}`}
                                      onClick={() => {
                                        const completeSequence = currentQuestionData.completeWord.split('');
                                        setCurrentQuestionData(prev => ({
                                          ...prev,
                                          blankPosition: index,
                                          displaySequence: completeSequence.map((l, i) => i === index ? '' : l),
                                          correctSequence: [letter]
                                        }));
                                      }}
                                    >
                                      <span className="pre-position-number">Position {index + 1}</span>
                                      <span className="pre-position-letter">{letter}</span>
                                    </button>
                                  ))}
                                </div>
                              </div>
                            )}
                          </div>
                        ) : (
                          // For "Tukuyin ang nasa larawan" - show letter grid for complete word
                          <div className="pre-tukuyin-word-builder">
                            <div className="pre-form-group">
                              <label>Complete Word (will be scrambled for students):</label>
                              <input
                                type="text"
                                value={currentQuestionData.completeWord || ''}
                                onChange={(e) => {
                                  const word = e.target.value.replace(/[^a-zA-Z]/g, '');
                                  const sequence = word.split('');
                                  setCurrentQuestionData(prev => ({
                                    ...prev,
                                    completeWord: word,
                                    displaySequence: null,
                                    correctSequence: sequence,
                                    blankPosition: null // No blank position for this type
                                  }));
                                }}
                                placeholder="Enter complete word (e.g., YELO)"
                                className="pre-complete-word-input"
                              />
                            </div>
                          </div>
                        )}
                        
                        {/* Display Preview */}
                        {currentQuestionData.displaySequence && currentQuestionData.displaySequence.length > 0 && (
                          <div className="pre-sequence-preview">
                            <h6>Preview (what students will see):</h6>
                            <div className="pre-preview-word">
                              {currentQuestionData.displaySequence.map((letter, index) => (
                                <span 
                                  key={index} 
                                  className={`pre-letter-box ${letter === '' ? 'blank' : ''}`}
                                >
                                  {letter === '' ? '___' : letter}
                                </span>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>

                      {/* Drag Elements */}
                      <div className="pre-drag-elements-section">
                        <div className="pre-subsection-header">
                          <h6 className="pre-subsection-title">Available Letters (Student Options)</h6>
                        </div>
                        <p className="pre-subsection-description">
                          {currentQuestionData.questionText === 'Buoin ang salita' 
                            ? 'Letters students can choose from to fill the blank (includes correct answer + distractors)'
                            : 'All letters from the word plus some distractors for students to arrange'}
                        </p>
                        
                        {/* Auto-populate button */}
                        {currentQuestionData.completeWord && (
                          <div className="pre-auto-populate-section">
                            <button
                              type="button"
                              onClick={() => {
                                if (currentQuestionData.questionText === 'Buoin ang salita') {
                                  // For "Buoin ang salita" - add correct letter + some distractors
                                  const correctLetter = currentQuestionData.correctSequence[0] || '';
                                  // Use mixed case distractors for variety
                                  const distractors = ['a', 'e', 'i', 'o', 'u', 'b', 'c', 'd', 'f', 'g', 'h', 'j', 'k', 'l', 'm', 'n', 'p', 'q', 'r', 's', 't', 'v', 'w', 'x', 'y', 'z',
                                                      'A', 'E', 'I', 'O', 'U', 'B', 'C', 'D', 'F', 'G', 'H', 'J', 'K', 'L', 'M', 'N', 'P', 'Q', 'R', 'S', 'T', 'V', 'W', 'X', 'Y', 'Z'];
                                  const availableDistractors = distractors.filter(d => d !== correctLetter);
                                  // Randomize distractor selection
                                  const shuffled = availableDistractors.sort(() => Math.random() - 0.5);
                                  const selectedDistractors = shuffled.slice(0, 3);
                                  const allOptions = [correctLetter, ...selectedDistractors].filter(Boolean);
                                  
                                  setCurrentQuestionData(prev => ({
                                    ...prev,
                                    dragElements: allOptions
                                  }));
                                } else {
                                  // For "Tukuyin ang nasa larawan" - add all word letters + some distractors
                                  const wordLetters = currentQuestionData.completeWord.split('');
                                  const distractors = ['a', 'e', 'i', 'o', 'u', 'b', 'c', 'd', 'f', 'g', 'h', 'j', 'k', 'l', 'm', 'n', 'p', 'q', 'r', 's', 't', 'v', 'w', 'x', 'y', 'z',
                                                      'A', 'E', 'I', 'O', 'U', 'B', 'C', 'D', 'F', 'G', 'H', 'J', 'K', 'L', 'M', 'N', 'P', 'Q', 'R', 'S', 'T', 'V', 'W', 'X', 'Y', 'Z'];
                                  const availableDistractors = distractors.filter(d => !wordLetters.includes(d));
                                  // Randomize distractor selection
                                  const shuffled = availableDistractors.sort(() => Math.random() - 0.5);
                                  const selectedDistractors = shuffled.slice(0, 2);
                                  const allOptions = [...wordLetters, ...selectedDistractors];
                                  
                                  setCurrentQuestionData(prev => ({
                                    ...prev,
                                    dragElements: allOptions
                                  }));
                                }
                              }}
                              className="pre-auto-populate-btn"
                            >
                              <FontAwesomeIcon icon={faGraduationCap} />
                              Auto-populate with distractors
                            </button>
                          </div>
                        )}
                        
                        <div className="pre-drag-elements-grid">
                          {currentQuestionData.dragElements.map((element, index) => {
                            const isCorrectAnswer = currentQuestionData.correctSequence.includes(element);
                            return (
                              <div key={index} className={`pre-drag-card ${isCorrectAnswer ? 'correct' : ''}`}>
                                <input
                                  type="text"
                                  value={element}
                                  onChange={(e) => {
                                    const newElement = e.target.value.toUpperCase().replace(/[^A-Z]/g, '').slice(0, 1);
                                    setCurrentQuestionData(prev => ({
                                      ...prev,
                                      dragElements: prev.dragElements.map((el, i) => i === index ? newElement : el)
                                    }));
                                  }}
                                  placeholder="Letter"
                                  className="pre-drag-input"
                                  maxLength="1"
                                />
                                {isCorrectAnswer && (
                                  <div className="pre-correct-indicator">
                                    <FontAwesomeIcon icon={faCheckCircle} />
                                  </div>
                                )}
                                <button
                                  type="button"
                                  onClick={() => {
                                    setCurrentQuestionData(prev => ({
                                      ...prev,
                                      dragElements: prev.dragElements.filter((_, i) => i !== index)
                                    }));
                                  }}
                                  className="pre-remove-btn-small"
                                  title="Remove"
                                >
                                  <FontAwesomeIcon icon={faTimes} />
                                </button>
                              </div>
                            );
                          })}
                          <button
                            type="button"
                            onClick={() => {
                              setCurrentQuestionData(prev => ({
                                ...prev,
                                dragElements: [...prev.dragElements, '']
                              }));
                            }}
                            className="pre-add-btn-drag"
                          >
                            <FontAwesomeIcon icon={faPlus} />
                            Add Option
                          </button>
                        </div>
                      </div>

                      {/* Correct Answer Display */}
                      <div className="pre-correct-sequence-section">
                        <div className="pre-subsection-header">
                          <h6 className="pre-subsection-title">Correct Answer</h6>
                          <span className="pre-auto-label">Auto-generated</span>
                        </div>
                        <p className="pre-subsection-description">
                          {currentQuestionData.questionText === 'Buoin ang salita' 
                            ? 'The correct letter that fills the selected blank position'
                            : 'The complete word sequence that students need to arrange'}
                        </p>
                        
                        <div className="pre-correct-answer-display">
                          {currentQuestionData.correctSequence.length > 0 ? (
                            <div className="pre-correct-answers-grid">
                              {currentQuestionData.correctSequence.map((letter, index) => (
                                <div key={index} className="pre-correct-answer-chip">
                                  <span className="pre-answer-text">{letter}</span>
                                  <span className="pre-answer-type">
                                    {currentQuestionData.questionText === 'Buoin ang salita' ? 'Missing Letter' : `Position ${index + 1}`}
                                  </span>
                                </div>
                              ))}
                            </div>
                          ) : (
                            <div className="pre-no-correct-answers">
                              <FontAwesomeIcon icon={faInfoCircle} />
                              <span>
                                {currentQuestionData.questionText === 'Buoin ang salita' 
                                  ? 'Select a blank position to auto-generate the correct answer'
                                  : 'Enter a complete word to auto-generate the correct sequence'}
                              </span>
                            </div>
                          )}
                        </div>
                      </div>
                    </>
                  )}
                </div>
              )}


              {/* Word Recognition - Enhanced Fill in the Blank */}
              {categoryDisplayNameToKey[currentQuestionData.category] === 'word_recognition' && currentQuestionData.questionText && (
                <div className="pre-word-recognition-section">
                  <div className="pre-section-header">
                    <FontAwesomeIcon icon={faBook} className="pre-section-icon" />
                    <h5 className="pre-section-title">Word Recognition Configuration <span className="pre-required-field">*</span></h5>
                    <Tooltip text="Configure sentences and word options for word recognition questions" />
                  </div>
                  
                  {/* Question Type Note */}
                  <div className="pre-question-type-note">
                    <div className="pre-note-content">
                      <FontAwesomeIcon icon={faInfoCircle} className="pre-note-icon" />
                      <div className="pre-note-text">
                        <p><strong>Selected Question Type:</strong></p>
                        {currentQuestionData.questionText === 'Basahin ang pangungusap. Piliin ang tamang salita mula sa hanay.' && (
                          <p>• Students will read a sentence with blanks and choose the correct words from given options</p>
                        )}
                        {currentQuestionData.questionText === 'Anong kasing tunog ng salitang nakikita?' && (
                          <p>• Students will identify syllables or sounds that match the displayed word</p>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Interactive Sentence Builder for fill-in-the-blank */}
                  {currentQuestionData.questionText === 'Basahin ang pangungusap. Piliin ang tamang salita mula sa hanay.' && (
                  <div className="pre-sentence-builder-section">
                    <div className="pre-subsection-header">
                      <h6 className="pre-subsection-title">Sentence Builder</h6>
                      <span className="pre-help-text">Click words to make them blanks</span>
                    </div>
                    <p className="pre-subsection-description">Type your sentence below, then click on words to convert them into blanks</p>
                    
                    <div className="pre-form-group">
                      <label htmlFor="sentenceInput">
                        Enter Complete Sentence: <span className="pre-required-field">*</span>
                        <Tooltip text="Type the complete sentence first" />
                      </label>
                      <textarea
                        id="sentenceInput"
                        value={currentQuestionData.completeSentence || ''}
                        onChange={(e) => {
                          const newSentence = e.target.value;
                          setCurrentQuestionData(prev => ({
                            ...prev,
                            completeSentence: newSentence,
                            displayWord: newSentence, // Update display word too
                            blankWords: [], // Reset blanks when sentence changes
                            blankedSentence: newSentence
                          }));
                        }}
                        placeholder="e.g., 'Naglalaro siya ng bola sa parke.'"
                        className="pre-sentence-input"
                        rows={2}
                        required
                      />
                    </div>
                    
                    {/* Word Click Interface */}
                    {currentQuestionData.completeSentence && (
                      <div className="pre-word-click-section">
                        <h6>Click words to make them blanks:</h6>
                        <div className="pre-interactive-sentence">
                          {currentQuestionData.completeSentence.split(' ').map((word, index) => {
                            const cleanWord = word.replace(/[.,!?;:]/g, '');
                            const punctuation = word.match(/[.,!?;:]/) ? word.match(/[.,!?;:]/)[0] : '';
                            const isBlank = currentQuestionData.blankWords && currentQuestionData.blankWords.includes(cleanWord.toLowerCase());
                            
                            return (
                              <span key={index} className="pre-word-container">
                                <button
                                  type="button"
                                  className={`pre-word-button ${isBlank ? 'blank' : ''}`}
                                  onClick={() => {
                                    const newBlankWords = [...(currentQuestionData.blankWords || [])];
                                    const wordLower = cleanWord.toLowerCase();
                                    
                                    if (isBlank) {
                                      // Remove from blanks
                                      const index = newBlankWords.indexOf(wordLower);
                                      if (index > -1) newBlankWords.splice(index, 1);
                                    } else {
                                      // Add to blanks
                                      if (!newBlankWords.includes(wordLower)) {
                                        newBlankWords.push(wordLower);
                                      }
                                    }
                                    
                                    // Update blanked sentence
                                    const blankedSentence = currentQuestionData.completeSentence.split(' ').map(w => {
                                      const clean = w.replace(/[.,!?;:]/g, '');
                                      const punct = w.match(/[.,!?;:]/) ? w.match(/[.,!?;:]/)[0] : '';
                                      return newBlankWords.includes(clean.toLowerCase()) ? '___' + punct : w;
                                    }).join(' ');
                                    
                                    setCurrentQuestionData(prev => {
                                      // Auto-sync blanked words with correct answers and blank options
                                      // Only include words that are currently blanked
                                      // Keep original case for all Word Recognition questions
                                      const newCorrectAnswers = [...new Set(newBlankWords)]; // Keep original case
                                      
                                      // Keep existing non-blank options and add new blank words
                                      const existingNonBlankOptions = (prev.blankOptions || []).filter(option => 
                                        !prev.blankWords?.includes(option)
                                      );
                                      const updatedBlankOptions = [...new Set([...existingNonBlankOptions, ...newBlankWords])]; // Keep original case
                                      
                                      return {
                                        ...prev,
                                        blankWords: newBlankWords,
                                        blankedSentence: blankedSentence,
                                        displayWord: blankedSentence,
                                        // Correct answers should only contain currently blanked words
                                        correctAnswer: newCorrectAnswers,
                                        // Blank options include both blanked words and additional distractors
                                        blankOptions: updatedBlankOptions
                                      };
                                    });
                                  }}
                                >
                                  {isBlank ? '___' : cleanWord}
                                </button>
                                {punctuation && <span className="pre-punctuation">{punctuation}</span>}
                                {index < currentQuestionData.completeSentence.split(' ').length - 1 && ' '}
                              </span>
                            );
                          })}
                        </div>
                        
                        {/* Display blanked sentence */}
                        {currentQuestionData.blankedSentence && currentQuestionData.blankedSentence !== currentQuestionData.completeSentence && (
                          <div className="pre-blanked-preview">
                            <h6>Preview with blanks:</h6>
                            <div className="pre-blanked-sentence">{currentQuestionData.blankedSentence}</div>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                  )}

                  {/* Alternative Configuration for "Anong kasing tunog ng salitang nakikita?" */}
                  {currentQuestionData.questionText === 'Anong kasing tunog ng salitang nakikita?' && (
                    <div className="pre-sound-matching-section">
                      <div className="pre-subsection-header">
                        <h6 className="pre-subsection-title">Word and Sound Configuration</h6>
                        <span className="pre-help-text">Configure word with complete word options</span>
                      </div>
                      <p className="pre-subsection-description">Set up a word that students will identify similar sounding complete words for</p>
                      
                      <div className="pre-form-group">
                        <label htmlFor="displayWordInput">
                          Display Word: <span className="pre-required-field">*</span>
                          <Tooltip text="The word students will see and need to identify sounds from" />
                        </label>
                        <input
                          id="displayWordInput"
                          type="text"
                          value={currentQuestionData.questionValue || ''}
                          onChange={(e) => {
                            const newValue = e.target.value.toUpperCase();

                            setCurrentQuestionData(prev => ({
                              ...prev,
                              questionValue: newValue,
                              displayWord: newValue
                            }));
                          }}
                          placeholder="e.g., 'SUMBRERO'"
                          className="pre-display-word-input"
                          required
                        />
                      </div>
                    </div>
                  )}

                  {/* Shared Answer Options and Correct Answers - Available for both Word Recognition types */}
                  {currentQuestionData.questionText && (
                    <>
                      {/* Answer Options */}
                      <div className="pre-blank-options-section">
                        <div className="pre-subsection-header">
                          <h6 className="pre-subsection-title">Answer Options <span className="pre-required-field">*</span></h6>
                          <span className="pre-help-text">Include correct answers and distractors</span>
                        </div>
                        <p className="pre-subsection-description">
                          {currentQuestionData.questionText === 'Basahin ang pangungusap. Piliin ang tamang salita mula sa hanay.'
                            ? 'Add all possible answer choices (correct answers are auto-added from blanks)'
                            : 'Add complete words that students can choose from (not syllables or word parts)'}
                        </p>
                        
                        <div className="pre-blank-options-container">
                          {currentQuestionData.blankOptions.map((option, index) => {
                            const isCorrectAnswer = currentQuestionData.correctAnswer && currentQuestionData.correctAnswer.includes(option);
                            return (
                              <div key={index} className={`pre-blank-option-item ${isCorrectAnswer ? 'correct' : ''}`}>
                                <div className="pre-option-content">
                                  <input
                                    type="text"
                                    value={option}
                                    onChange={(e) => handleBlankOptionChange(index, e.target.value)}
                                    placeholder={currentQuestionData.questionText === 'Basahin ang pangungusap. Piliin ang tamang salita mula sa hanay.'
                                      ? `Option ${index + 1}`
                                      : `Complete word ${index + 1}`}
                                    className="pre-blank-option-input pre-no-uppercase"
                                    style={{ textTransform: 'none !important' }}
                                  />

                                  {/* For sound matching questions, show radio button */}
                                  {currentQuestionData.questionText === 'Anong kasing tunog ng salitang nakikita?' ? (
                                    <div className="pre-radio-container">
                                      <label className="pre-correct-radio">
                                        <input
                                          type="radio"
                                          name="soundMatchingCorrectAnswer"
                                          checked={isCorrectAnswer}
                                          onChange={() => {
                                            // For sound matching questions, only one correct answer is allowed
                                            setCurrentQuestionData(prev => ({
                                              ...prev,
                                              correctAnswer: [option] // Single correct answer, preserve case
                                            }));
                                          }}
                                        />
                                        <span className="pre-radio-label">
                                          <FontAwesomeIcon icon={faCheckCircle} />
                                          Correct
                                        </span>
                                      </label>
                                    </div>
                                  ) : (
                                    /* For other question types, show correct indicator */
                                    isCorrectAnswer && (
                                      <div className="pre-correct-indicator">
                                        <FontAwesomeIcon icon={faCheckCircle} />
                                        <span>Correct</span>
                                      </div>
                                    )
                                  )}
                                </div>
                                {/* Only show remove button for non-correct answers in auto-generated questions */}
                                {!(currentQuestionData.questionText === 'Basahin ang pangungusap. Piliin ang tamang salita mula sa hanay.' && isCorrectAnswer) && (
                                  <button
                                    type="button"
                                    onClick={() => removeBlankOption(index)}
                                    className="pre-remove-btn-small"
                                    title="Remove"
                                  >
                                    <FontAwesomeIcon icon={faTimes} />
                                  </button>
                                )}
                              </div>
                            );
                          })}
                          <button
                            type="button"
                            onClick={addBlankOption}
                            className="pre-add-btn-primary"
                          >
                            <FontAwesomeIcon icon={faPlus} />
                            {currentQuestionData.questionText === 'Basahin ang pangungusap. Piliin ang tamang salita mula sa hanay.'
                              ? 'Add Answer Option'
                              : 'Add Complete Word Option'}
                          </button>
                        </div>
                      </div>

                      {/* Correct Answers Management */}
                      <div className="pre-correct-answers-section">
                        <div className="pre-subsection-header">
                          <h6 className="pre-subsection-title">
                            {currentQuestionData.questionText === 'Anong kasing tunog ng salitang nakikita?'
                              ? 'Correct Answer'
                              : 'Correct Answers'}
                          </h6>
                          <span className="pre-auto-label">
                            {currentQuestionData.questionText === 'Basahin ang pangungusap. Piliin ang tamang salita mula sa hanay.'
                              ? 'Auto-managed from blanks'
                              : 'Selected from options'}
                          </span>
                        </div>
                        <p className="pre-subsection-description">
                          {currentQuestionData.questionText === 'Basahin ang pangungusap. Piliin ang tamang salita mula sa hanay.'
                            ? 'These are automatically determined from the words you\'ve made into blanks'
                            : currentQuestionData.questionText === 'Anong kasing tunog ng salitang nakikita?'
                            ? 'Select the complete word option above that matches the display word\'s sound'
                            : 'Check the complete word options above that match the display word\'s sound'}
                        </p>
                        
                        <div className="pre-correct-answers-display">
                          {currentQuestionData.correctAnswer && currentQuestionData.correctAnswer.length > 0 ? (
                            currentQuestionData.correctAnswer.map((answer, index) => (
                              <div key={index} className="pre-correct-answer-chip">
                                <span className="pre-answer-text" style={{ textTransform: 'none !important' }}>{answer}</span>
                                {/* Only show X button for non-auto-generated questions */}
                                {currentQuestionData.questionText !== 'Basahin ang pangungusap. Piliin ang tamang salita mula sa hanay.' && (
                                  <button
                                    type="button"
                                    onClick={() => {
                                      const newCorrectAnswers = currentQuestionData.correctAnswer.filter((_, i) => i !== index);
                                      setCurrentQuestionData(prev => ({
                                        ...prev,
                                        correctAnswer: newCorrectAnswers
                                      }));
                                    }}
                                    className="pre-remove-chip"
                                    title="Remove"
                                  >
                                    <FontAwesomeIcon icon={faTimes} />
                                  </button>
                                )}
                              </div>
                            ))
                          ) : (
                            <div className="pre-no-correct-answers">
                              <FontAwesomeIcon icon={faInfoCircle} />
                              <span>
                                {currentQuestionData.questionText === 'Basahin ang pangungusap. Piliin ang tamang salita mula sa hanay.' 
                                  ? 'Make words into blanks to automatically add correct answers'
                                  : 'Select correct options above to add them as correct answers'}
                              </span>
                            </div>
                          )}
                        </div>
                      </div>
                    </>
                  )}
                </div>
              )}
              
              {/* Reading Comprehension Section - For reading_comprehension questions */}
              {categoryDisplayNameToKey[currentQuestionData.category] === 'reading_comprehension' && (
                <div className="pre-reading-comp-section">
                  {/* Passage Pages */}
                  <div className="pre-passage-section">
                    <div className="pre-section-header">
                      <FontAwesomeIcon icon={faBook} className="pre-section-icon" />
                      <h5 className="pre-section-title">Reading Passage Pages <span className="pre-required-field">*</span></h5>
                      <Tooltip text="Add story pages that students will read for comprehension questions" />
                    </div>
                    <p className="pre-section-description">Create engaging reading passages with optional images to assess student comprehension</p>
                    
                    {currentQuestionData.passages.map((passage, index) => (
                      <div key={index} className="pre-passage-editor">
                        <div className="pre-passage-header">
                          <h6>Page {passage.pageNumber}</h6>
                          <div className="pre-passage-actions">
                            {currentQuestionData.passages.length > 1 && (
                              <button
                                type="button"
                                className="pre-remove-passage-btn"
                                onClick={() => {
                                  setCurrentQuestionData(prev => ({
                                    ...prev,
                                    passages: prev.passages.filter((_, i) => i !== index)
                                  }));
                                }}
                              >
                                <FontAwesomeIcon icon={faTimes} /> Remove
                              </button>
                            )}
                          </div>
                        </div>
                        
                        <div className="pre-form-group pre-full-width">
                          <label>
                            Passage Text: <span className="pre-required-field">*</span>
                          </label>
                          <textarea
                            value={passage.pageText || ''}
                            onChange={(e) => {
                              const updatedPassages = [...currentQuestionData.passages];
                              updatedPassages[index] = {
                                ...updatedPassages[index],
                                pageText: e.target.value
                              };
                              setCurrentQuestionData(prev => ({
                                ...prev,
                                passages: updatedPassages
                              }));
                            }}
                            placeholder="Enter the passage text for this page"
                            rows={4}
                            className={!passage.pageText.trim() ? 'pre-validation-highlight' : ''}
                          />
                          {!passage.pageText.trim() && (
                            <div className="pre-validation-message">Passage text is required</div>
                          )}
                        </div>
                        
                        <div className="pre-form-group">
                          <label>Passage Image:</label>
                          <div className="pre-file-upload-container">
                            <label className="pre-file-upload-btnn">
                              <FontAwesomeIcon icon={faUpload} />
                              {passage.pageImage ? 'Change Image' : 'Upload Image'}
                              <input
                                type="file"
                                accept="image/*"
                                onChange={(e) => {
                                  const file = e.target.files[0];
                                  if (!file) return;
                                  
                                  // Preview image
                                  const reader = new FileReader();
                                  reader.onload = () => {
                                    const updatedPassages = [...currentQuestionData.passages];
                                    updatedPassages[index] = {
                                      ...updatedPassages[index],
                                      pageImage: reader.result
                                    };
                                    setCurrentQuestionData(prev => ({
                                      ...prev,
                                      passages: updatedPassages
                                    }));
                                  };
                                  reader.readAsDataURL(file);
                                }}
                                className="pre-file-input-hidden"
                              />
                            </label>
                            {passage.pageImage && (
                              <div className="pre-image-preview">
                                <img 
                                  src={passage.pageImage} 
                                  alt={`Passage page ${passage.pageNumber}`} 
                                  className="pre-preview-image" 
                                />
                                <button
                                  type="button"
                                  className="pre-remove-image"
                                  onClick={() => {
                                    const updatedPassages = [...currentQuestionData.passages];
                                    updatedPassages[index] = {
                                      ...updatedPassages[index],
                                      pageImage: null,
                                                                  };
                                    setCurrentQuestionData(prev => ({
                                      ...prev,
                                      passages: updatedPassages
                                    }));
                                  }}
                                >
                                  <FontAwesomeIcon icon={faTimes} />
                                </button>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                    
                    <button
                      type="button"
                      className="pre-add-passage-btn"
                      onClick={() => {
                        setCurrentQuestionData(prev => ({
                          ...prev,
                          passages: [
                            ...prev.passages,
                            {
                              pageNumber: prev.passages.length + 1,
                              pageText: '',
                              pageImage: null,
                                                  }
                          ]
                        }));
                      }}
                    >
                      <FontAwesomeIcon icon={faPlus} /> Add Page
                    </button>
                  </div>
                  
                  {/* Comprehension Questions */}
                  <div className="pre-sentence-questions-section">
                    <div className="pre-section-header">
                      <FontAwesomeIcon icon={faQuestion} className="pre-section-icon" />
                      <h5 className="pre-section-title">Comprehension Questions <span className="pre-required-field">*</span></h5>
                      <Tooltip text="Create questions to test student understanding of the reading passage" />
                    </div>
                    <p className="pre-section-description">Design questions that assess student comprehension with expected answers and acceptable alternatives</p>
                    
                    <div className="pre-comprehension-questions-container">
                      {currentQuestionData.sentenceQuestions.map((question, index) => (
                        <div key={index} className="pre-sentence-question-editor">
                          <div className="pre-sentence-question-header">
                            <div className="pre-question-header-left">
                              <FontAwesomeIcon icon={faQuestion} className="pre-question-icon" />
                              <h6 className="pre-question-title">Question {index + 1}</h6>
                            </div>
                            <div className="pre-sentence-question-actions">
                              {currentQuestionData.sentenceQuestions.length > 1 && (
                                <button
                                  type="button"
                                  className="pre-remove-question-btn"
                                  onClick={() => {
                                    setCurrentQuestionData(prev => ({
                                      ...prev,
                                      sentenceQuestions: prev.sentenceQuestions.filter((_, i) => i !== index)
                                    }));
                                  }}
                                  title="Remove this question"
                                >
                                  <FontAwesomeIcon icon={faTimes} />
                                  <span>Remove</span>
                                </button>
                              )}
                            </div>
                          </div>
                        
                        <div className="pre-form-group pre-full-width">
                          <label>
                            Question Text: <span className="pre-required-field">*</span>
                          </label>
                          <input
                            type="text"
                            value={question.questionText || ''}
                            onChange={(e) => {
                              const updatedQuestions = [...currentQuestionData.sentenceQuestions];
                              updatedQuestions[index] = {
                                ...updatedQuestions[index],
                                questionText: e.target.value
                              };
                              setCurrentQuestionData(prev => ({
                                ...prev,
                                sentenceQuestions: updatedQuestions
                              }));
                            }}
                            placeholder="Enter the question about the passage"
                            className={!question.questionText.trim() ? 'pre-validation-highlight' : ''}
                          />
                          {!question.questionText.trim() && (
                            <div className="pre-validation-message">Question text is required</div>
                          )}
                        </div>
                        
                        <div className="pre-form-group">
                          <label>
                            Expected Answer: <span className="pre-required-field">*</span>
                            <Tooltip text="The main correct answer for this question" />
                          </label>
                          <input
                            type="text"
                            value={question.correctAnswer || ''}
                            onChange={(e) => {
                              const updatedQuestions = [...currentQuestionData.sentenceQuestions];
                              updatedQuestions[index] = {
                                ...updatedQuestions[index],
                                correctAnswer: e.target.value
                              };
                              setCurrentQuestionData(prev => ({
                                ...prev,
                                sentenceQuestions: updatedQuestions
                              }));
                            }}
                            placeholder="Enter the expected answer"
                            className={!question.correctAnswer.trim() ? 'pre-validation-highlight' : ''}
                          />
                          {!question.correctAnswer.trim() && (
                            <div className="pre-validation-message">Expected answer is required</div>
                          )}
                        </div>
                        
                        <div className="pre-acceptable-answers-section">
                          <label>
                            Alternative Acceptable Answers:
                            <Tooltip text="Add other acceptable variations of the answer" />
                          </label>
                          
                          {question.acceptableAnswers && question.acceptableAnswers.map((answer, answerIndex) => (
                            <div key={answerIndex} className="pre-acceptable-answer-item">
                              <input
                                type="text"
                                value={answer}
                                onChange={(e) => {
                                  const updatedQuestions = [...currentQuestionData.sentenceQuestions];
                                  updatedQuestions[index] = {
                                    ...updatedQuestions[index],
                                    acceptableAnswers: updatedQuestions[index].acceptableAnswers.map((ans, i) => 
                                      i === answerIndex ? e.target.value : ans
                                    )
                                  };
                                  setCurrentQuestionData(prev => ({
                                    ...prev,
                                    sentenceQuestions: updatedQuestions
                                  }));
                                }}
                                placeholder={`Alternative answer ${answerIndex + 1}`}
                                className="pre-acceptable-answer-input"
                              />
                              <button
                                type="button"
                                onClick={() => {
                                  const updatedQuestions = [...currentQuestionData.sentenceQuestions];
                                  updatedQuestions[index] = {
                                    ...updatedQuestions[index],
                                    acceptableAnswers: updatedQuestions[index].acceptableAnswers.filter((_, i) => i !== answerIndex)
                                  };
                                  setCurrentQuestionData(prev => ({
                                    ...prev,
                                    sentenceQuestions: updatedQuestions
                                  }));
                                }}
                                className="pre-remove-btn"
                                title="Remove"
                              >
                                <FontAwesomeIcon icon={faTimes} />
                              </button>
                            </div>
                          ))}
                          
                          <button
                            type="button"
                            onClick={() => {
                              const updatedQuestions = [...currentQuestionData.sentenceQuestions];
                              updatedQuestions[index] = {
                                ...updatedQuestions[index],
                                acceptableAnswers: [...(updatedQuestions[index].acceptableAnswers || []), '']
                              };
                              setCurrentQuestionData(prev => ({
                                ...prev,
                                sentenceQuestions: updatedQuestions
                              }));
                            }}
                            className="pre-add-btn"
                          >
                            <FontAwesomeIcon icon={faPlus} style={{ marginRight: '8px' }} />
                            Add Alternative Answer
                          </button>
                        </div>
                      </div>
                    ))}
                    
                    <button
                      type="button"
                      className="pre-add-sentence-question-btn"
                      onClick={() => {
                        setCurrentQuestionData(prev => ({
                          ...prev,
                          sentenceQuestions: [
                            ...prev.sentenceQuestions,
                            { questionText: '', correctAnswer: '', acceptableAnswers: [] }
                          ]
                        }));
                      }}
                    >
                      <FontAwesomeIcon icon={faPlus} /> Add Question
                    </button>
                    </div>
                  </div>
                </div>
              )}

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
                <FontAwesomeIcon icon={faCheckCircle} className="pre-modal-header-icon" />
                Save Pre-Assessment
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
                <FontAwesomeIcon icon={faCheckCircle} />
              </div>
              <div className="pre-confirm-message">
                <p>You are about to save this pre-assessment curriculum.</p>
                <p className="pre-confirm-question">Would you like to save this assessment now?</p>
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
                <FontAwesomeIcon icon={faCheckCircle} /> Save Assessment
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
                <p>Are you sure you want to delete this pre-assessment?</p>
                <p className="pre-delete-warning">This action cannot be undone.</p>
              </div>
              
              {preAssessment && (
                <div className="pre-delete-summary">
                  <div className="pre-summary-item">
                    <span className="pre-summary-label">Assessment Title:</span>
                    <span className="pre-summary-value">{preAssessment.title || 'Unknown Assessment'}</span>
                  </div>
                  <div className="pre-summary-item">
                    <span className="pre-summary-label">Total Questions:</span>
                    <span className="pre-summary-value">{preAssessment.totalQuestions || 0} questions</span>
                  </div>
                  <div className="pre-summary-item">
                    <span className="pre-summary-label">Language:</span>
                    <span className="pre-summary-value">{preAssessment.language === 'FL' ? 'Filipino' : preAssessment.language || 'Unknown'}</span>
                  </div>
                </div>
              )}
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

      {/* Delete Question Confirmation Modal */}
      {showDeleteQuestionModal && (
        <div className="pre-modal-overlay">
          <div className="pre-modal pre-confirm-modal">
            <div className="pre-modal-header">
              <h3>
                <FontAwesomeIcon icon={faTrash} className="pre-modal-header-icon" />
                Delete Question
              </h3>
              <button 
                className="pre-modal-close"
                onClick={() => {
                  setShowDeleteQuestionModal(false);
                  setQuestionToDelete(null);
                }}
              >
                <FontAwesomeIcon icon={faTimes} />
              </button>
            </div>
            
            <div className="pre-modal-body">
              <div className="pre-delete-icon">
                <FontAwesomeIcon icon={faExclamationTriangle} />
              </div>
              <div className="pre-delete-message">
                <p>Are you sure you want to delete this question?</p>
                <p className="pre-delete-warning">This action cannot be undone.</p>
              </div>
              
              {questionToDelete !== null && formData.questions[questionToDelete] && (
                <div className="pre-delete-summary">
                  <div className="pre-summary-item">
                    <span className="pre-summary-label">Question ID:</span>
                    <span className="pre-summary-value">{formData.questions[questionToDelete].questionId || 'New Question'}</span>
                  </div>
                  <div className="pre-summary-item">
                    <span className="pre-summary-label">Category:</span>
                    <span className="pre-summary-value">{formData.questions[questionToDelete].category}</span>
                  </div>
                  <div className="pre-summary-item">
                    <span className="pre-summary-label">Question Text:</span>
                    <span className="pre-summary-value">
                      {formData.questions[questionToDelete].questionText?.substring(0, 50) || 'No text'}
                      {formData.questions[questionToDelete].questionText?.length > 50 ? '...' : ''}
                    </span>
                  </div>
                </div>
              )}
            </div>
            
            <div className="pre-modal-footer">
              <button 
                className="pre-button secondary"
                onClick={() => {
                  setShowDeleteQuestionModal(false);
                  setQuestionToDelete(null);
                }}
              >
                Cancel
              </button>
              <button 
                className="pre-button danger"
                onClick={confirmDeleteQuestion}
              >
                <FontAwesomeIcon icon={faTrash} /> Delete Question
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
                ? "Pre-assessment has been saved successfully." 
                : "Pre-assessment has been deleted."}
            </p>
          </div>
        </div>
      )}


      <ToastContainer
        position="top-center"
        autoClose={3000}
        hideProgressBar={false}
        newestOnTop={true}
        closeOnClick
        rtl={false}
        pauseOnFocusLoss
        draggable
        pauseOnHover
        theme="colored"
        limit={3}
        style={{ zIndex: 9999 }}
      />
    </div>
  );
};

export default PreAssessment;