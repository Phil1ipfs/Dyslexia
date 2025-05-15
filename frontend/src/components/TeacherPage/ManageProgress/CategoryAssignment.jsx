import React, { useState, useEffect, useCallback } from 'react';
import {
  FaClipboardCheck,
  FaInfoCircle,
  FaCheck,
  FaSearch,
  FaTag,
  FaChartLine,
  FaLock,
  FaStar,
  FaExclamationTriangle,
  FaFilter,
  FaBookOpen,
  FaSyncAlt,
  FaUserAlt,
  FaList,
  FaEye,
  FaArrowLeft,
  FaArrowRight,
  FaPlusCircle,
  FaMinusCircle,
  FaEdit,
  FaQuestionCircle,
  FaExchangeAlt,
  FaRandom
} from 'react-icons/fa';

// Import API services
import StudentApiService from '../../../services/Teachers/StudentApiService';
import AssessmentApiService from '../../../services/Teachers/ManageProgress/AssessmentApiService';
import ProgressApiService from '../../../services/Teachers/ManageProgress/ProgressApiService';
import ContentApiService from '../../../services/Teachers/ManageProgress/ContentApiService';

import QuestionTemplateSelector from './QuestionTemplateSelector';


import './css/CategoryAssignment.css';

const CategoryAssignment = ({
  studentId,
  studentName,
  studentReadingLevel,
  onAssignmentComplete
}) => {


  // Category selection states
  const [categories, setCategories] = useState([]);
  const [selectedCategories, setSelectedCategories] = useState([]);
  const [assignedCategories, setAssignedCategories] = useState([]);
  const [publishedAssessments, setPublishedAssessments] = useState([]);

  const [showQuestionTemplateSelector, setShowQuestionTemplateSelector] = useState(false);
  const [customQuestions, setCustomQuestions] = useState({});
  const [selectedAssessment, setSelectedAssessment] = useState(null);

  const handleAddTemplateQuestion = (question) => {
    console.log("Adding template question:", question);
  
    // Add the question to the customQuestions state for the current assessment
    if (selectedAssessment) {
      // Ensure the question has a unique ID
      const uniqueQuestionId = `${question.questionId || Date.now()}-${Math.floor(Math.random() * 1000)}`;
      const questionWithUniqueId = {
        ...question,
        questionId: uniqueQuestionId,
        originalQuestionId: question.questionId || question.originalQuestionId
      };
  
      setCustomQuestions(prev => {
        // Clone the previous state
        const newState = { ...prev };
  
        // Initialize the array for this assessment if it doesn't exist
        if (!newState[selectedAssessment]) {
          newState[selectedAssessment] = [];
        }
  
        // Add the new question to the array
        newState[selectedAssessment] = [...newState[selectedAssessment], questionWithUniqueId];
  
        return newState;
      });
  
      // Auto-select the new question
      const questionKey = `${selectedAssessment}-${uniqueQuestionId}`;
      setSelectedQuestions(prev => ({
        ...prev,
        [questionKey]: true
      }));
  
      // Get content if contentReference is available and add it to the content state
      if (question.contentReference) {
        ContentApiService.loadQuestionContent(question.contentReference)
          .then(content => {
            if (content) {
              setContentForQuestions(prev => ({
                ...prev,
                [questionKey]: content
              }));
            }
          })
          .catch(error => {
            console.error("Error loading content for new question:", error);
          });
      }
    }
  
    setShowQuestionTemplateSelector(false);
  };



  // Content states
  const [contentCollections, setContentCollections] = useState({
    letters: [],
    syllables: [],
    words: [],
    sentences: [],
    shortstories: []
  });
  const [filteredContent, setFilteredContent] = useState({});
  const [contentSearchQuery, setContentSearchQuery] = useState('');

  // Question states
  const [questionBank, setQuestionBank] = useState({});
  const [showContentSelector, setShowContentSelector] = useState(false);
  const [selectedQuestion, setSelectedQuestion] = useState(null);
  const [selectedQuestionContent, setSelectedQuestionContent] = useState(null);
  const [selectedContentItem, setSelectedContentItem] = useState(null);

  // Assessment customization states
  const [selectedAssessments, setSelectedAssessments] = useState([]);
  const [questionsForAssessments, setQuestionsForAssessments] = useState({});
  const [selectedQuestions, setSelectedQuestions] = useState({});
  const [contentForQuestions, setContentForQuestions] = useState({});
  const [customContentMappings, setCustomContentMappings] = useState({});

  // UI state management
  const [currentStep, setCurrentStep] = useState('select-categories');
  const [searchQuery, setSearchQuery] = useState('');
  const [filteredCategories, setFilteredCategories] = useState([]);
  const [readingLevel, setReadingLevel] = useState(studentReadingLevel || 'Low Emerging');
  const [readingLevels, setReadingLevels] = useState([
    'Low Emerging',
    'High Emerging',
    'Developing',
    'Transitioning',
    'At Grade Level'
  ]);

  // Loading and error states
  const [loading, setLoading] = useState(true);
  const [contentLoading, setContentLoading] = useState(false);
  const [error, setError] = useState(null);
  const [specificError, setSpecificError] = useState(null);
  const [assignmentSuccess, setAssignmentSuccess] = useState(false);

  // Preview states
  const [showPreview, setShowPreview] = useState(false);
  const [previewQuestion, setPreviewQuestion] = useState(null);
  const [previewContent, setPreviewContent] = useState(null);

  // Load all necessary data
  useEffect(() => {


    const fetchData = async () => {
      try {
        setLoading(true);
        console.log("CategoryAssignment: Fetching data for student ID:", studentId);

        // Fetch assessment categories
        let categoriesData = [];
        try {
          categoriesData = await AssessmentApiService.getAssessmentCategories();
        } catch (error) {
          console.error("Failed to load assessment categories:", error);
          setSpecificError("Could not load assessment categories.");

          // Set default categories as fallback
          categoriesData = [
            {
              categoryID: 1,
              categoryTitle: "Alphabet Knowledge",
              categoryDescription: "Assessment of letter recognition, uppercase and lowercase letters, and letter sounds"
            },
            {
              categoryID: 2,
              categoryTitle: "Phonological Awareness",
              categoryDescription: "Assessment of sounds, sound patterns, and auditory processing skills"
            },
            {
              categoryID: 3,
              categoryTitle: "Decoding",
              categoryDescription: "Assessment of ability to interpret written symbols and translate them into speech"
            },
            {
              categoryID: 4,
              categoryTitle: "Word Recognition",
              categoryDescription: "Assessment of ability to recognize and understand common words"
            },
            {
              categoryID: 5,
              categoryTitle: "Reading Comprehension",
              categoryDescription: "Assessment of understanding of text content"
            }
          ];
        }

        // Process and set categories
        const validCategories = categoriesData.map(cat => ({
          ...cat,
          categoryTitle: cat.categoryTitle || cat.categoryName || `Category ${cat.categoryID}`,
          categoryDescription: cat.categoryDescription || `Assessment category for ${cat.categoryTitle || cat.categoryName}`,
          questionTypes: cat.questionTypes || []
        }));
        setCategories(validCategories);

        // Fetch reading levels
        try {
          const readingLevelsData = await AssessmentApiService.getReadingLevels();
          if (Array.isArray(readingLevelsData) && readingLevelsData.length > 0) {
            setReadingLevels(readingLevelsData);
          }
        } catch (error) {
          console.warn("Error fetching reading levels, using defaults:", error);
        }

        // Get student's category progress
        if (studentId) {
          try {
            const progress = await ProgressApiService.getCategoryProgress(studentId);

            if (progress && progress.categories && Array.isArray(progress.categories)) {
              setAssignedCategories(progress.categories);

              // Set reading level from student's progress data if available
              if (progress.readingLevel) {
                setReadingLevel(progress.readingLevel);
              }
            } else {
              setAssignedCategories([]);
            }
          } catch (error) {
            console.warn("Error fetching category progress, using empty array:", error);
            setAssignedCategories([]);
          }
        }

        // Fetch published assessments for the current reading level
        try {
          const assessmentsData = await AssessmentApiService.getPublishedAssessments(null, readingLevel);
          setPublishedAssessments(assessmentsData);
        } catch (error) {
          console.warn("Error fetching published assessments, using empty array:", error);
          setPublishedAssessments([]);
        }

        // Fetch content collections samples (to be used for content selection later)
        await fetchContentCollectionsSamples();

        setLoading(false);
      } catch (err) {
        console.error("Error in the main fetchData function:", err);
        setError("Failed to load data. Please try again.");
        setLoading(false);
      }
    };

    fetchData();
  }, [studentId, readingLevel]);

  // Fetch content collections samples
 // components/TeacherPage/ManageProgress/CategoryAssignment.jsx - Update fetchContentCollectionsSamples

// Fetch content collections samples
const fetchContentCollectionsSamples = async () => {
  try {
    setContentLoading(true);

    // Initialize collections with empty arrays
    const collections = {
      letters: [],
      syllables: [],
      words: [],
      sentences: [],
      shortstories: []
    };

    // Fetch each collection with error handling
    try {
      const letters = await ContentApiService.getLetters();
      if (letters && Array.isArray(letters)) {
        collections.letters = letters;
      }
    } catch (error) {
      console.warn("Failed to load letters collection:", error);
    }

    try {
      const syllables = await ContentApiService.getSyllables();
      if (syllables && Array.isArray(syllables)) {
        collections.syllables = syllables;
      }
    } catch (error) {
      console.warn("Failed to load syllables collection:", error);
    }

    try {
      const words = await ContentApiService.getWords();
      if (words && Array.isArray(words)) {
        collections.words = words;
      }
    } catch (error) {
      console.warn("Failed to load words collection:", error);
    }

    try {
      const sentences = await ContentApiService.getSentences();
      if (sentences && Array.isArray(sentences)) {
        collections.sentences = sentences;
      }
    } catch (error) {
      console.warn("Failed to load sentences collection:", error);
    }

    try {
      const shortstories = await ContentApiService.getShortStories();
      if (shortstories && Array.isArray(shortstories)) {
        collections.shortstories = shortstories;
      }
    } catch (error) {
      console.warn("Failed to load shortstories collection:", error);
    }

    setContentCollections(collections);
    setContentLoading(false);
  } catch (error) {
    console.error("Error fetching content collections:", error);
    setSpecificError("Could not load content collections for questions.");
    setContentLoading(false);
  }
};



  // Apply filters for categories
  useEffect(() => {
    if (!categories || categories.length === 0) return;

    // Filter categories based on search query
    const filtered = categories.filter(category => {
      const matchesSearch = !searchQuery || (
        category.categoryTitle?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        category.categoryDescription?.toLowerCase().includes(searchQuery.toLowerCase())
      );

      return matchesSearch;
    });

    // Add isRecommended flag and check for available assessments
    const enhancedCategories = filtered.map(category => {
      // Check recommended categories for current reading level
      const recommendedCategories = getRecommendedCategories(readingLevel);
      const isRecommended = recommendedCategories.includes(category.categoryID);

      // Check if there are published assessments for this category and reading level
      const hasAvailableAssessments = publishedAssessments.some(
        assessment => assessment.categoryID === category.categoryID && assessment.targetReadingLevel === readingLevel
      );

      return {
        ...category,
        isRecommended,
        hasAvailableAssessments
      };
    });

    // Sort categories: first by available assessments, then by recommendation, then by ID
    const sortedCategories = [...enhancedCategories].sort((a, b) => {
      // First by available assessments
      if (a.hasAvailableAssessments && !b.hasAvailableAssessments) return -1;
      if (!a.hasAvailableAssessments && b.hasAvailableAssessments) return 1;

      // Then by recommendation
      if (a.isRecommended && !b.isRecommended) return -1;
      if (!a.isRecommended && b.isRecommended) return 1;

      // Finally by ID
      return a.categoryID - b.categoryID;
    });

    setFilteredCategories(sortedCategories);
  }, [searchQuery, categories, readingLevel, publishedAssessments]);

  // Filter content collections based on search query and collection type
  useEffect(() => {
    if (!selectedQuestion || !selectedQuestion.contentReference) return;

    const collection = selectedQuestion.contentReference.collection;
    const collectionType = collection.replace('_collection', '');

    // Get the appropriate content collection
    let contentArray = [];
    if (collectionType === 'letters') contentArray = contentCollections.letters;
    else if (collectionType === 'syllables') contentArray = contentCollections.syllables;
    else if (collectionType === 'words') contentArray = contentCollections.words;
    else if (collectionType === 'sentences') contentArray = contentCollections.sentences;
    else if (collectionType === 'shortstory') contentArray = contentCollections.shortstories;

    // Filter by search query
    const filtered = contentArray.filter(item => {
      // Different search criteria based on content type
      if (collectionType === 'letters') {
        return !contentSearchQuery ||
          item.smallLetter?.toLowerCase().includes(contentSearchQuery.toLowerCase()) ||
          item.bigLetter?.toLowerCase().includes(contentSearchQuery.toLowerCase()) ||
          item.soundText?.toLowerCase().includes(contentSearchQuery.toLowerCase());
      } else if (collectionType === 'syllables' || collectionType === 'words') {
        return !contentSearchQuery ||
          item.text?.toLowerCase().includes(contentSearchQuery.toLowerCase()) ||
          item.soundText?.toLowerCase().includes(contentSearchQuery.toLowerCase());
      } else if (collectionType === 'sentences' || collectionType === 'shortstory') {
        return !contentSearchQuery ||
          item.text?.toLowerCase().includes(contentSearchQuery.toLowerCase()) ||
          item.title?.toLowerCase().includes(contentSearchQuery.toLowerCase());
      }
      return true;
    });

    setFilteredContent({
      type: collectionType,
      items: filtered
    });
  }, [contentSearchQuery, selectedQuestion, contentCollections]);

  // UTILITY FUNCTIONS

  // Get recommended categories based on reading level
  const getRecommendedCategories = (level) => {
    const recommendationsMap = {
      'Low Emerging': [1, 2, 3], // Alphabet Knowledge, Phonological Awareness, Decoding
      'High Emerging': [2, 3, 4], // Phonological Awareness, Decoding, Word Recognition
      'Developing': [3, 4, 5],    // Decoding, Word Recognition, Reading Comprehension
      'Transitioning': [4, 5],    // Word Recognition, Reading Comprehension
      'At Grade Level': [5]       // Reading Comprehension
    };

    return recommendationsMap[level] || [];
  };

  // Check if a category is already assigned
  const isCategoryAssigned = useCallback((categoryId) => {
    return assignedCategories.some(cat =>
      cat.categoryId === categoryId &&
      (cat.status === 'in_progress' || cat.status === 'completed')
    );
  }, [assignedCategories]);

  // Check if a category is selected
  const isCategorySelected = useCallback((categoryId) => {
    return selectedCategories.some(cat => cat.categoryID === categoryId);
  }, [selectedCategories]);

  // Get CSS class for a category
  const getCategoryClass = (categoryId) => {
    // Generate a consistent class based on category ID
    const baseClasses = [
      'lit-ca-alphabet',
      'lit-ca-phonological',
      'lit-ca-decoding',
      'lit-ca-word-recognition',
      'lit-ca-reading-comprehension'
    ];

    // Use modulo to cycle through the classes if we have more than 5 categories
    return baseClasses[(categoryId - 1) % baseClasses.length];
  };

  // Generate a reading level badge
  const getReadingLevelBadge = (readingLevel) => {
    const levelClass =
      readingLevel === 'Low Emerging' ? 'lit-ca-low-emerging' :
        readingLevel === 'High Emerging' ? 'lit-ca-high-emerging' :
          readingLevel === 'Developing' ? 'lit-ca-developing' :
            readingLevel === 'Transitioning' ? 'lit-ca-transitioning' :
              'lit-ca-grade-level';

    return (
      <span className={`lit-ca-reading-level-badge ${levelClass}`}>
        {readingLevel}
      </span>
    );
  };

  // Find assessments for a category
  const findAssessmentsForCategory = (categoryId) => {
    return publishedAssessments.filter(
      assessment => assessment.categoryID === categoryId && assessment.targetReadingLevel === readingLevel
    );
  };

  // Format content for display in selectors and previews
  const formatContentForDisplay = (content, type) => {
    if (!content) return "No content available";

    switch (type) {
      case 'letters':
        return `${content.bigLetter}/${content.smallLetter} - Sound: ${content.soundText || ""}`;
      case 'syllables':
        return `${content.text} - Sound: ${content.soundText || ""}`;
      case 'words':
        return `${content.text}${content.meaning ? ` - Meaning: ${content.meaning}` : ""}`;
      case 'sentences':
        return content.text;
      case 'shortstory':
        return content.title ? `${content.title}: ${content.content.substring(0, 50)}...` : content.content.substring(0, 50) + "...";
      default:
        return "Unknown content type";
    }
  };

  // Get content preview based on content and type
  const getContentPreviewElement = (content, type) => {
    if (!content) return <div className="lit-ca-no-content">No content available</div>;

    switch (type) {
      case 'letters':
        return (
          <div className="lit-ca-letter-content">
            <div className="lit-ca-letter-pair">
              <div className="lit-ca-big-letter">{content.bigLetter}</div>
              <div className="lit-ca-small-letter">{content.smallLetter}</div>
            </div>
            {content.soundText && (
              <div className="lit-ca-sound-text">Sound: {content.soundText}</div>
            )}
          </div>
        );
      case 'syllables':
        return (
          <div className="lit-ca-syllable-content">
            <div className="lit-ca-syllable-text">{content.text}</div>
            {content.soundText && (
              <div className="lit-ca-sound-text">Sound: {content.soundText}</div>
            )}
          </div>
        );
      case 'words':
        return (
          <div className="lit-ca-word-content">
            <div className="lit-ca-word-text">{content.text}</div>
            {content.meaning && (
              <div className="lit-ca-word-meaning">Meaning: {content.meaning}</div>
            )}
            {content.imageUrl && (
              <div className="lit-ca-word-image">
                <img src={content.imageUrl} alt={content.text} />
              </div>
            )}
          </div>
        );
      case 'sentences':
        return (
          <div className="lit-ca-sentence-content">
            <div className="lit-ca-sentence-text">"{content.text}"</div>
          </div>
        );
      case 'shortstory':
        return (
          <div className="lit-ca-shortstory-content">
            {content.title && (
              <div className="lit-ca-shortstory-title">{content.title}</div>
            )}
            <div className="lit-ca-shortstory-text">
              {content.content.length > 200
                ? content.content.substring(0, 200) + "..."
                : content.content}
            </div>
          </div>
        );
      default:
        return <div className="lit-ca-no-content">Unknown content type</div>;
    }
  };

  // EVENT HANDLERS

  // Handle reading level change
  const handleReadingLevelChange = (e) => {
    setReadingLevel(e.target.value);

    // Reset selections when reading level changes
    setSelectedCategories([]);
    setSelectedAssessments([]);
    setQuestionsForAssessments({});
    setSelectedQuestions({});
    setContentForQuestions({});
    setCustomContentMappings({});
  };

  // Handle category selection
  const handleCategorySelect = (category) => {
    // Check if category is already assigned
    if (isCategoryAssigned(category.categoryID)) {
      return;
    }

    // Check if category has available assessments
    if (!category.hasAvailableAssessments) {
      return; // Already showing this with a badge, no need for alert
    }

    const isSelected = selectedCategories.some(c => c.categoryID === category.categoryID);

    if (isSelected) {
      setSelectedCategories(selectedCategories.filter(c => c.categoryID !== category.categoryID));
    } else {
      setSelectedCategories([...selectedCategories, category]);
    }
  };

  // Handle opening the content selector for a question
  const handleOpenContentSelector = async (assessmentId, question) => {
    try {
      setContentLoading(true);
      setSelectedAssessment(assessmentId);
      setSelectedQuestion(question);

      // Get current content for this question if already loaded
      const questionKey = `${assessmentId}-${question.questionId}`;
      let content = contentForQuestions[questionKey];

      // If not loaded or we have custom mapping, load it
      if (!content || customContentMappings[questionKey]) {
        const contentReference = customContentMappings[questionKey] || question.contentReference;

        if (contentReference) {
          try {
            content = await ContentApiService.loadQuestionContent(contentReference);

            // Update content for questions
            setContentForQuestions(prev => ({
              ...prev,
              [questionKey]: content
            }));
          } catch (error) {
            console.warn(`Failed to load content for question ${questionKey}:`, error);
            content = null;
          }
        }
      }

      setSelectedQuestionContent(content);

      // Set filtered content based on question's content type
      if (question.contentReference) {
        const collectionType = question.contentReference.collection.replace('_collection', '');
        let contentArray = [];

        if (collectionType === 'letters') contentArray = contentCollections.letters;
        else if (collectionType === 'syllables') contentArray = contentCollections.syllables;
        else if (collectionType === 'words') contentArray = contentCollections.words;
        else if (collectionType === 'sentences') contentArray = contentCollections.sentences;
        else if (collectionType === 'shortstory') contentArray = contentCollections.shortstories;

        setFilteredContent({
          type: collectionType,
          items: contentArray
        });
      }

      setContentLoading(false);
      setShowContentSelector(true);
    } catch (error) {
      console.error("Error opening content selector:", error);
      setContentLoading(false);
      setSpecificError("Failed to load content selector for this question.");
    }
  };

  // Handle selecting a new content item for a question
  const handleSelectContentItem = (item) => {
    setSelectedContentItem(item);
  };

  // Handle confirming a content change for a question
  const handleConfirmContentChange = () => {
    if (!selectedQuestion || !selectedContentItem || !selectedAssessment) {
      return;
    }

    const questionKey = `${selectedAssessment}-${selectedQuestion.questionId}`;

    // Create a new content reference for this question
    const newContentReference = {
      collection: selectedQuestion.contentReference.collection,
      contentId: selectedContentItem._id
    };

    // Update custom content mappings
    setCustomContentMappings(prev => ({
      ...prev,
      [questionKey]: newContentReference
    }));

    // Update content for questions with the newly selected content
    setContentForQuestions(prev => ({
      ...prev,
      [questionKey]: selectedContentItem
    }));

    setShowContentSelector(false);
    setSelectedContentItem(null);
  };

  // Handle advancing to question selection
  // In CategoryAssignment.jsx, modify the handleProceedToQuestions function:

  const handleProceedToQuestions = async () => {
    if (selectedCategories.length === 0) return;

    setLoading(true);

    try {
      // Get assessments for these categories
      const categoryIds = selectedCategories.map(cat => cat.categoryID);

      // Build a map of assessments by category
      const assessmentsMap = {};

      // Try to fetch published assessments
      try {
        const publishedAssessments = await AssessmentApiService.getPublishedAssessments(null, readingLevel);

        // Group by category
        if (Array.isArray(publishedAssessments)) {
          publishedAssessments.forEach(assessment => {
            if (categoryIds.includes(assessment.categoryID)) {
              if (!assessmentsMap[assessment.categoryID]) {
                assessmentsMap[assessment.categoryID] = [];
              }
              assessmentsMap[assessment.categoryID].push(assessment);
            }
          });
        }
      } catch (error) {
        console.warn("Failed to fetch published assessments:", error);
        // Continue with empty map
      }

      // Build selected assessments array
      const newSelectedAssessments = [];
      const newQuestionsMap = {};
      const newSelectedQuestionsMap = {};

      // For each selected category, find or create assessment
      for (const category of selectedCategories) {
        const categoryId = category.categoryID;
        const assessmentsForCategory = assessmentsMap[categoryId] || [];

        // Use first assessment if available
        if (assessmentsForCategory.length > 0) {
          const assessment = assessmentsForCategory[0];

          newSelectedAssessments.push({
            categoryId: categoryId,
            categoryTitle: category.categoryTitle,
            assessmentId: assessment.assessmentId,
            assessmentTitle: assessment.title
          });

          // Add questions to map
          if (assessment.questions && assessment.questions.length > 0) {
            newQuestionsMap[assessment.assessmentId] = assessment.questions;

            // Pre-select all questions
            assessment.questions.forEach(question => {
              newSelectedQuestionsMap[`${assessment.assessmentId}-${question.questionId}`] = true;
            });
          } else {
            // Empty questions array
            newQuestionsMap[assessment.assessmentId] = [];
          }
        } else {
          // Create a placeholder assessment
          const placeholderId = `MA-${categoryId}-placeholder`;

          newSelectedAssessments.push({
            categoryId: categoryId,
            categoryTitle: category.categoryTitle,
            assessmentId: placeholderId,
            assessmentTitle: `${category.categoryTitle} Assessment - ${readingLevel}`
          });

          // Empty questions array
          newQuestionsMap[placeholderId] = [];
        }
      }

      // Update state with new data
      setSelectedAssessments(newSelectedAssessments);
      setQuestionsForAssessments(newQuestionsMap);
      setSelectedQuestions(newSelectedQuestionsMap);

      // Move to next step
      setCurrentStep('select-questions');

      // Try to load content for questions
      try {
        await loadContentForQuestions(newQuestionsMap);
      } catch (contentError) {
        console.warn("Failed to load content for questions:", contentError);
        // Continue without content
      }
    } catch (error) {
      console.error("Error preparing questions:", error);
      setSpecificError("Failed to prepare questions. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  // Load content for questions
  const loadContentForQuestions = async (questionsMap) => {
    const contentMap = {};
    let loadedCount = 0;
    let totalQuestions = 0;

    try {
      // Count total questions across all assessments
      for (const assessmentId in questionsMap) {
        totalQuestions += questionsMap[assessmentId].length;
      }

      // Instead of trying to preload all collections, we'll load content as needed

      // For each assessment and its questions, fetch content references
      for (const assessmentId in questionsMap) {
        const questions = questionsMap[assessmentId];

        for (const question of questions) {
          const questionKey = `${assessmentId}-${question.questionId}`;

          // Check if this question has a content reference
          if (question.contentReference) {
            try {
              const content = await ContentApiService.loadQuestionContent(question.contentReference);
              contentMap[questionKey] = content;
              loadedCount++;

              // Update loading progress if needed
              if (loadedCount % 5 === 0) {
                console.log(`Loaded content for ${loadedCount}/${totalQuestions} questions`);
              }
            } catch (contentError) {
              console.warn(`Failed to load content for question ${questionKey}:`, contentError);
              contentMap[questionKey] = null;
            }
          } else {
            contentMap[questionKey] = null;
          }
        }
      }

      setContentForQuestions(contentMap);
    } catch (error) {
      console.error("Error loading content for questions:", error);
      setSpecificError("Some question content could not be loaded.");
    }
  };




  // Toggle selection of a specific question
  const handleToggleQuestion = (assessmentId, questionId) => {
    const questionKey = `${assessmentId}-${questionId}`;

    setSelectedQuestions(prev => ({
      ...prev,
      [questionKey]: !prev[questionKey]
    }));
  };

  // Preview a question with its content
  const handlePreviewQuestion = (assessmentId, question) => {
    const questionKey = `${assessmentId}-${question.questionId}`;
    const content = contentForQuestions[questionKey];

    setPreviewQuestion(question);
    setPreviewContent(content);
    setShowPreview(true);
  };

  // Handle back button from question selection to category selection
  const handleBackToCategories = () => {
    setCurrentStep('select-categories');
  };

  // Handle proceeding to review
  const handleProceedToReview = () => {
    setCurrentStep('review');
  };

  // Handle category assignment
  const handleAssignCategories = async () => {
    // At review step, we're ready to assign
    setLoading(true);

    try {
      // Prepare data for assignment
      const selectedCategoryObjects = selectedCategories.map(category => ({
        categoryId: category.categoryID,
        categoryName: category.categoryTitle
      }));

      // Create the assignment payload including custom content mappings
      const assignmentPayload = {
        studentId: studentId,
        readingLevel: readingLevel,
        categories: selectedCategoryObjects,
        // Include customizations (selected questions and content mappings)
        customizations: {
          selectedQuestions: selectedQuestions,
          contentMappings: customContentMappings
        }
      };

      console.log("Sending assignment payload:", assignmentPayload);

      // Call API to assign categories
      const result = await AssessmentApiService.assignCategoriesToStudent(assignmentPayload);
      console.log("Assignment API response:", result);

      if (result.success) {
        // Refresh assigned categories
        try {
          console.log("Refreshing category progress data...");
          const updatedCategoryProgress = await ProgressApiService.getCategoryProgress(studentId);

          if (updatedCategoryProgress && updatedCategoryProgress.categories) {
            setAssignedCategories(updatedCategoryProgress.categories);
          }
        } catch (error) {
          console.error("Failed to refresh category progress:", error);
        }

        // Reset state for next usage
        setSelectedCategories([]);
        setSelectedAssessments([]);
        setQuestionsForAssessments({});
        setSelectedQuestions({});
        setContentForQuestions({});
        setCustomContentMappings({});
        setCurrentStep('select-categories');
        setAssignmentSuccess(true);

        // Notify parent component if callback provided
        if (onAssignmentComplete) {
          onAssignmentComplete(result);
        }

        // Reset success message after 3 seconds
        setTimeout(() => {
          setAssignmentSuccess(false);
        }, 3000);
      } else {
        console.error("Assignment failed:", result);
        setError("Assignment failed. Please try again.");
      }
    } catch (err) {
      console.error('Error assigning categories:', err);
      setError('Failed to assign categories. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Handle randomly selecting a different content for a question
  const handleRandomizeContent = async (assessmentId, question) => {
    try {
      setContentLoading(true);

      if (!question.contentReference) {
        setContentLoading(false);
        return;
      }

      const collectionType = question.contentReference.collection.replace('_collection', '');
      let contentArray = [];

      // Get the appropriate content collection
      if (collectionType === 'letters') contentArray = contentCollections.letters;
      else if (collectionType === 'syllables') contentArray = contentCollections.syllables;
      else if (collectionType === 'words') contentArray = contentCollections.words;
      else if (collectionType === 'sentences') contentArray = contentCollections.sentences;
      else if (collectionType === 'shortstory') contentArray = contentCollections.shortstories;

      if (contentArray.length === 0) {
        setContentLoading(false);
        setSpecificError("No content available to randomize. Try adding content first.");
        return;
      }

      // Pick a random content item
      const randomIndex = Math.floor(Math.random() * contentArray.length);
      const randomContent = contentArray[randomIndex];

      if (!randomContent) {
        setContentLoading(false);
        setSpecificError("Couldn't find alternative content. Please try again.");
        return;
      }

      const questionKey = `${assessmentId}-${question.questionId}`;

      // Create a new content reference
      const newContentReference = {
        collection: question.contentReference.collection,
        contentId: randomContent._id
      };

      // Update custom content mappings
      setCustomContentMappings(prev => ({
        ...prev,
        [questionKey]: newContentReference
      }));

      // Update content for questions
      setContentForQuestions(prev => ({
        ...prev,
        [questionKey]: randomContent
      }));

      setContentLoading(false);
    } catch (error) {
      console.error("Error randomizing content:", error);
      setContentLoading(false);
      setSpecificError("Failed to randomly assign new content to the question.");
    }
  };

  // RENDERING COMPONENTS

  // Error state
  if (error) {
    return (
      <div className="lit-ca-error-state">
        <FaExclamationTriangle className="lit-ca-error-icon" />
        <h3>Error Loading Categories</h3>
        <p>{error}</p>
        <button
          className="lit-ca-retry-btn"
          onClick={() => window.location.reload()}
        >
          <FaSyncAlt /> Retry
        </button>
      </div>
    );
  }

  // Loading state
  if (loading && categories.length === 0) {
    return (
      <div className="lit-ca-loading-state">
        <div className="lit-ca-spinner"></div>
        <p>Loading categories...</p>
      </div>
    );
  }

  // Empty state if there are no categories available
  if (!loading && categories.length === 0) {
    return (
      <div className="lit-ca-empty-state">
        <FaInfoCircle className="lit-ca-empty-icon" />
        <h3>No Available Categories</h3>
        <p>There are no assessment categories available at this time.</p>
      </div>
    );
  }

  return (
    <div className="lit-ca-container">
      {/* Success notification */}
      {assignmentSuccess && (
        <div className="lit-ca-success-alert">
          <FaCheck />
          Categories successfully assigned to student!
        </div>
      )}

      {/* Specific errors that don't prevent rendering */}
      {specificError && (
        <div className="lit-ca-warning-alert">
          <FaExclamationTriangle />
          {specificError}
        </div>
      )}

      {/* Student info and reading level section */}
      <div className="lit-ca-student-info">
        <div className="lit-ca-student-name">
          <FaUserAlt className="lit-ca-student-icon" />
          <h3>{studentName || "Selected Student"}</h3>
        </div>

        <div className="lit-ca-reading-level-selector">
          <label htmlFor="reading-level">Reading Level:</label>
          <select
            id="reading-level"
            value={readingLevel}
            onChange={handleReadingLevelChange}
          >
            {readingLevels.map(level => (
              <option key={level} value={level}>{level}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Reading level notification */}
      <div className="lit-ca-reading-level-alert">
        <FaInfoCircle />
        <p>
          This student is currently at <strong>{readingLevel}</strong> reading level.
          Assign appropriate categories to assess their progress. Only categories with available published assessments for this reading level can be assigned.
        </p>
        {getReadingLevelBadge(readingLevel)}
      </div>

      {/* Progress steps */}
      <div className="lit-ca-progress-steps">
        <div className={`lit-ca-step ${currentStep === 'select-categories' ? 'lit-ca-active' : ''}`}>
          <div className="lit-ca-step-number">1</div>
          <div className="lit-ca-step-label">Select Categories</div>
        </div>
        <div className="lit-ca-step-connector"></div>
        <div className={`lit-ca-step ${currentStep === 'select-questions' ? 'lit-ca-active' : ''}`}>
          <div className="lit-ca-step-number">2</div>
          <div className="lit-ca-step-label">Customize Questions</div>
        </div>
        <div className="lit-ca-step-connector"></div>
        <div className={`lit-ca-step ${currentStep === 'review' ? 'lit-ca-active' : ''}`}>
          <div className="lit-ca-step-number">3</div>
          <div className="lit-ca-step-label">Review & Assign</div>
        </div>
      </div>

      {/* STEP 1: Category Selection View */}
      {currentStep === 'select-categories' && (
        <>
          {/* Filters section */}
          <div className="lit-ca-category-filters">
            <div className="lit-ca-search-wrapper">
              <FaSearch className="lit-ca-search-icon" />
              <input
                type="text"
                className="lit-ca-search-input"
                placeholder="Search categories..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </div>

          {/* Selected categories summary */}
          <div className="lit-ca-selected-summary">
            <div className="lit-ca-selected-count">
              <strong>{selectedCategories.length}</strong> categories selected
            </div>
            <button
              className="lit-ca-next-btn"
              onClick={handleProceedToQuestions}
              disabled={selectedCategories.length === 0 || loading}
            >
              {loading ? <div className="lit-ca-spinner-small"></div> : <FaArrowRight />}
              Continue to Questions
            </button>
          </div>

          {/* Categories display */}
          {filteredCategories.length === 0 ? (
            <div className="lit-ca-empty-results">
              <FaInfoCircle className="lit-ca-empty-icon" />
              <p>No categories found matching your search. Please try different search terms.</p>
            </div>
          ) : (
            <div className="lit-ca-categories-grid">
              {filteredCategories.map(category => {
                const isAssigned = isCategoryAssigned(category.categoryID);
                const isSelected = isCategorySelected(category.categoryID);
                const availableAssessments = findAssessmentsForCategory(category.categoryID);
                const hasAssessments = availableAssessments.length > 0;

                return (
                  <div
                    key={category.categoryID}
                    className={`lit-ca-category-card 
                      ${isSelected ? 'lit-ca-selected' : ''} 
                      ${isAssigned ? 'lit-ca-assigned' : ''} 
                      ${!hasAssessments ? 'lit-ca-no-assessments' : ''}`}
                    onClick={() => hasAssessments && !isAssigned && handleCategorySelect(category)}
                  >
                    {/* Recommended badge */}
                    {category.isRecommended && (
                      <div className="lit-ca-recommended-badge">
                        <FaStar /> Recommended
                      </div>
                    )}

                    {/* Selection indicator */}
                    <div className="lit-ca-selection-indicator">
                      {isSelected ? <FaCheck /> : <span className="lit-ca-empty-check"></span>}
                    </div>

                    {/* Category header */}
                    <div className="lit-ca-category-header">
                      <h4 className="lit-ca-category-title">{category.categoryTitle}</h4>
                      <div className={`lit-ca-category-badge ${getCategoryClass(category.categoryID)}`}>
                        Category {category.categoryID}
                      </div>
                    </div>

                    {/* Category metadata */}
                    <div className="lit-ca-category-meta">
                      <div className="lit-ca-meta-item">
                        <FaList className="lit-ca-meta-icon" />
                        <span className="lit-ca-meta-text">
                          {availableAssessments.length} assessment{availableAssessments.length !== 1 ? 's' : ''}
                        </span>
                      </div>
                      <div className="lit-ca-meta-item">
                        <FaBookOpen className="lit-ca-meta-icon" />
                        <span className="lit-ca-meta-text">
                          {readingLevel}
                        </span>
                      </div>
                    </div>

                    {/* Category description */}
                    <div className="lit-ca-category-description">
                      <p>{category.categoryDescription}</p>
                    </div>

                    {/* Question types */}
                    <div className="lit-ca-question-types">
                      {category.questionTypes && category.questionTypes.slice(0, 3).map((type, index) => (
                        <span key={index} className="lit-ca-question-type-tag">
                          <FaTag /> {typeof type === 'string' ? type.replace(/_/g, ' ') : 'Question'}
                        </span>
                      ))}
                      {category.questionTypes && category.questionTypes.length > 3 && (
                        <span className="lit-ca-question-type-tag lit-ca-more-tag">
                          +{category.questionTypes.length - 3} more
                        </span>
                      )}
                    </div>

                    {/* Assigned badge */}
                    {isAssigned && (
                      <div className="lit-ca-assigned-badge">
                        <FaLock /> Currently Assigned
                      </div>
                    )}

                    {/* No assessments badge */}
                    {!hasAssessments && !isAssigned && (
                      <div className="lit-ca-no-assessments-badge">
                        <FaExclamationTriangle /> No Published Assessments
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </>
      )}

      {/* STEP 2: Question Selection View */}
      {currentStep === 'select-questions' && (
        <div className="lit-ca-questions-container">
          <div className="lit-ca-questions-header">
            <h3>Customize Questions for Assignment</h3>
            <p>Choose which questions to include in each assessment and customize content as needed. By default, all questions are selected.</p>
          </div>

          {/* Navigation buttons */}
          <div className="lit-ca-questions-navigation">
            <button
              className="lit-ca-back-btn"
              onClick={handleBackToCategories}
              disabled={loading}
            >
              <FaArrowLeft /> Back to Categories
            </button>

            <button
              className="lit-ca-next-btn"
              onClick={handleProceedToReview}
              disabled={loading || Object.values(selectedQuestions).filter(v => v).length === 0}
            >
              Continue to Review <FaArrowRight />
            </button>
          </div>

          {/* Assessment questions */}
          {selectedAssessments.map(assessmentInfo => {
            const assessment = publishedAssessments.find(a =>
              a.assessmentId === assessmentInfo.assessmentId
            );

            if (!assessment) return null;

            const questions = questionsForAssessments[assessmentInfo.assessmentId] || [];

            // Calculate how many questions are selected for this assessment
            const selectedQuestionCount = questions.filter(q =>
              selectedQuestions[`${assessmentInfo.assessmentId}-${q.questionId}`]
            ).length;

            return (
              <div key={assessmentInfo.assessmentId} className="lit-ca-assessment-card">
                <div className="lit-ca-assessment-header">
                  <h4 className="lit-ca-assessment-title">
                    {assessment.title}
                  </h4>

                  <div className={`lit-ca-category-badge ${getCategoryClass(assessmentInfo.categoryId)}`}>
                    {assessmentInfo.categoryTitle}
                  </div>


                  <button
                    className="lit-ca-add-template-question-btn"
                    onClick={() => {
                      setSelectedAssessment(assessmentInfo.assessmentId);
                      setShowQuestionTemplateSelector(true);
                    }}
                  >
                    <FaPlusCircle /> Add Template Question
                  </button>
                </div>

                <div className="lit-ca-assessment-info">
                  <div className="lit-ca-assessment-meta">
                    <div className="lit-ca-meta-item">
                      <span className="lit-ca-meta-label">Reading Level:</span>
                      <span className="lit-ca-meta-value">{assessment.targetReadingLevel}</span>
                    </div>
                    <div className="lit-ca-meta-item">
                      <span className="lit-ca-meta-label">Questions:</span>
                      <span className="lit-ca-meta-value">
                        {selectedQuestionCount} selected of {questions.length} total
                      </span>
                    </div>
                  </div>

                  <div className="lit-ca-assessment-actions">
                    <button
                      className="lit-ca-select-all-btn"
                      onClick={() => {
                        const newSelectedQuestions = { ...selectedQuestions };
                        for (const q of questions) {
                          newSelectedQuestions[`${assessmentInfo.assessmentId}-${q.questionId}`] = true;
                        }
                        setSelectedQuestions(newSelectedQuestions);
                      }}
                    >
                      <FaCheck /> Select All
                    </button>
                    <button
                      className="lit-ca-deselect-all-btn"
                      onClick={() => {
                        const newSelectedQuestions = { ...selectedQuestions };
                        for (const q of questions) {
                          newSelectedQuestions[`${assessmentInfo.assessmentId}-${q.questionId}`] = false;
                        }
                        setSelectedQuestions(newSelectedQuestions);
                      }}
                    >
                      <FaMinusCircle /> Deselect All
                    </button>
                  </div>
                </div>

                <div className="lit-ca-questions-list">
                  {questions.map(question => {
                    const questionKey = `${assessmentInfo.assessmentId}-${question.questionId}`;
                    const isSelected = !!selectedQuestions[questionKey];
                    const content = contentForQuestions[questionKey];
                    const hasContent = !!content;
                    const hasCustomContent = !!customContentMappings[questionKey];

                    return (
                      <div
                        key={questionKey}
                        className={`lit-ca-question-item ${isSelected ? 'lit-ca-selected' : ''} ${hasCustomContent ? 'lit-ca-custom-content' : ''}`}
                      >
                        <div className="lit-ca-question-selection">
                          <input
                            type="checkbox"
                            id={questionKey}
                            checked={isSelected}
                            onChange={() => handleToggleQuestion(assessmentInfo.assessmentId, question.questionId)}
                          />
                          <label htmlFor={questionKey}>
                            <div className="lit-ca-checkbox-custom">
                              {isSelected && <FaCheck />}
                            </div>
                          </label>
                        </div>

                        <div className="lit-ca-question-content">
                          <div className="lit-ca-question-text">
                            <strong>Q{question.questionNumber || question.questionId}:</strong> {question.questionText}
                          </div>

                          <div className="lit-ca-question-details">
                            <div className="lit-ca-question-type">
                              <FaTag /> {question.typeId.replace(/_/g, ' ')}
                            </div>

                            {hasContent && (
                              <div className="lit-ca-question-has-content">
                                <FaBookOpen /> {hasCustomContent ? "Custom Content" : "Default Content"}: {
                                  content ? formatContentForDisplay(
                                    content,
                                    question.contentReference?.collection.replace('_collection', '')
                                  ).substring(0, 50) : "No content"
                                }
                              </div>
                            )}

                            <div className="lit-ca-question-points">
                              <FaChartLine /> {question.pointValue || 1} point{(question.pointValue || 1) !== 1 ? 's' : ''}
                            </div>
                          </div>

                          {/* Content preview if available */}
                          {hasContent && isSelected && (
                            <div className="lit-ca-content-preview">
                              {getContentPreviewElement(
                                content,
                                question.contentReference?.collection.replace('_collection', '')
                              )}
                            </div>
                          )}
                        </div>

                        <div className="lit-ca-question-actions">
                          {question.contentReference && (
                            <>
                              <button
                                className="lit-ca-change-content-btn"
                                onClick={() => handleOpenContentSelector(assessmentInfo.assessmentId, question)}
                                title="Change content for this question"
                              >
                                <FaExchangeAlt /> Change Content
                              </button>

                              <button
                                className="lit-ca-randomize-btn"
                                onClick={() => handleRandomizeContent(assessmentInfo.assessmentId, question)}
                                title="Randomly select new content for this question"
                              >
                                <FaRandom /> Randomize
                              </button>
                            </>
                          )}

                          <button
                            className="lit-ca-preview-btn"
                            onClick={() => handlePreviewQuestion(assessmentInfo.assessmentId, question)}
                            title="Preview this question and its content"
                          >
                            <FaEye /> Preview
                          </button>
                        </div>
                      </div>
                    );
                  })}

                </div>
                {showQuestionTemplateSelector && (
                  <div className="lit-ca-modal-overlay">
                    <div className="lit-ca-modal-content lit-ca-template-selector-modal">
                      <QuestionTemplateSelector
                        categoryId={selectedCategories.find(c => c.categoryID === parseInt(selectedAssessment?.split('-')?.[1]))?.categoryID || 1}
                        readingLevel={readingLevel}
                        onAddQuestion={handleAddTemplateQuestion}
                        onClose={() => setShowQuestionTemplateSelector(false)}
                      />
                    </div>
                  </div>
                )}

              </div>
            );
          })}

          {/* Second navigation buttons at bottom */}
          <div className="lit-ca-questions-navigation lit-ca-bottom-nav">
            <button
              className="lit-ca-back-btn"
              onClick={handleBackToCategories}
              disabled={loading}
            >
              <FaArrowLeft /> Back to Categories
            </button>

            <button
              className="lit-ca-next-btn"
              onClick={handleProceedToReview}
              disabled={loading || Object.values(selectedQuestions).filter(v => v).length === 0}
            >
              Continue to Review <FaArrowRight />
            </button>
          </div>
        </div>
      )}

      {/* STEP 3: Review & Assign View */}
      {currentStep === 'review' && (
        <div className="lit-ca-review-container">
          <div className="lit-ca-review-header">
            <h3>Review and Confirm Assignment</h3>
            <p>Please review the selected categories and customized questions before finalizing the assignment.</p>
          </div>

          <div className="lit-ca-review-card">
            <div className="lit-ca-review-section">
              <h4>Student Information</h4>
              <div className="lit-ca-review-student">
                <div className="lit-ca-review-detail">
                  <span className="lit-ca-review-label">Student:</span>
                  <span className="lit-ca-review-value">{studentName}</span>
                </div>
                <div className="lit-ca-review-detail">
                  <span className="lit-ca-review-label">Reading Level:</span>
                  <span className="lit-ca-review-value">
                    {readingLevel}
                    {getReadingLevelBadge(readingLevel)}
                  </span>
                </div>
              </div>
            </div>

            <div className="lit-ca-review-section">
              <h4>Categories To Assign</h4>
              <div className="lit-ca-review-categories">
                {selectedCategories.map(category => {
                  const assessmentInfo = selectedAssessments.find(a => a.categoryId === category.categoryID);

                  if (!assessmentInfo) return null;

                  const questions = questionsForAssessments[assessmentInfo.assessmentId] || [];
                  const selectedQuestionCount = questions.filter(q =>
                    selectedQuestions[`${assessmentInfo.assessmentId}-${q.questionId}`]
                  ).length;

                  const customContentCount = questions.filter(q =>
                    customContentMappings[`${assessmentInfo.assessmentId}-${q.questionId}`]
                  ).length;

                  return (
                    <div key={category.categoryID} className="lit-ca-review-category">
                      <div className={`lit-ca-category-badge ${getCategoryClass(category.categoryID)}`}>
                        {category.categoryTitle}
                      </div>
                      <div className="lit-ca-category-assessment-count">
                        1 assessment • {selectedQuestionCount} questions selected
                      </div>
                      {customContentCount > 0 && (
                        <div className="lit-ca-custom-content-tag">
                          {customContentCount} questions with custom content
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="lit-ca-review-section">
              <h4>Assessment Summary</h4>
              <div className="lit-ca-review-assessments">
                {selectedAssessments.map(assessmentInfo => {
                  const assessment = publishedAssessments.find(a =>
                    a.assessmentId === assessmentInfo.assessmentId
                  );

                  if (!assessment) return null;

                  const questions = questionsForAssessments[assessmentInfo.assessmentId] || [];
                  const selectedQuestionsList = questions.filter(q =>
                    selectedQuestions[`${assessmentInfo.assessmentId}-${q.questionId}`]
                  );

                  return (
                    <div key={assessmentInfo.assessmentId} className="lit-ca-review-assessment">
                      <div className="lit-ca-review-assessment-title">
                        {assessment.title}
                      </div>
                      <div className="lit-ca-review-assessment-details">
                        <div className="lit-ca-review-assessment-meta">
                          <div className="lit-ca-review-detail">
                            <span className="lit-ca-review-label">Category:</span>
                            <span className="lit-ca-review-value">{assessmentInfo.categoryTitle}</span>
                          </div>
                          <div className="lit-ca-review-detail">
                            <span className="lit-ca-review-label">Questions:</span>
                            <span className="lit-ca-review-value">
                              {selectedQuestionsList.length} selected
                            </span>
                          </div>
                          <div className="lit-ca-review-detail">
                            <span className="lit-ca-review-label">Passing Threshold:</span>
                            <span className="lit-ca-review-value">
                              {assessment.passingThreshold || 75}%
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Show sample of selected questions */}
                      {selectedQuestionsList.length > 0 && (
                        <div className="lit-ca-review-questions-preview">
                          <h5>Selected Questions</h5>
                          <div className="lit-ca-review-questions-list">
                            {selectedQuestionsList.slice(0, 3).map(question => {
                              const questionKey = `${assessmentInfo.assessmentId}-${question.questionId}`;
                              const hasCustomContent = !!customContentMappings[questionKey];

                              return (
                                <div key={questionKey} className="lit-ca-review-question-item">
                                  <div className="lit-ca-review-question-text">
                                    Q{question.questionNumber || question.questionId}: {question.questionText}
                                  </div>
                                  {hasCustomContent && (
                                    <div className="lit-ca-custom-content-tag">
                                      <FaEdit /> Custom Content
                                    </div>
                                  )}
                                </div>
                              );
                            })}
                            {selectedQuestionsList.length > 3 && (
                              <div className="lit-ca-more-questions">
                                + {selectedQuestionsList.length - 3} more questions
                              </div>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          <div className="lit-ca-review-navigation">
            <button
              className="lit-ca-back-btn"
              onClick={() => setCurrentStep('select-questions')}
              disabled={loading}
            >
              <FaArrowLeft /> Back to Questions
            </button>

            <button
              className="lit-ca-assign-btn"
              onClick={handleAssignCategories}
              disabled={loading}
            >
              {loading ? <div className="lit-ca-spinner-small"></div> : <FaClipboardCheck />}
              Confirm and Assign
            </button>
          </div>
        </div>
      )}

      {/* Question Preview Modal */}
      {showPreview && previewQuestion && (
        <div className="lit-ca-modal-overlay" onClick={() => setShowPreview(false)}>
          <div className="lit-ca-modal-content" onClick={e => e.stopPropagation()}>
            <div className="lit-ca-modal-header">
              <h3>Question Preview</h3>
              <button className="lit-ca-modal-close" onClick={() => setShowPreview(false)}>×</button>
            </div>

            <div className="lit-ca-modal-body">
              <div className="lit-ca-preview-question-header">
                <div className="lit-ca-preview-question-text">
                  {previewQuestion.questionText}
                </div>
                <div className="lit-ca-preview-question-type">
                  Type: {previewQuestion.typeId.replace(/_/g, ' ')}
                </div>
              </div>

              {previewContent ? (
                <div className="lit-ca-preview-content">
                  {getContentPreviewElement(
                    previewContent,
                    previewQuestion.contentReference?.collection.replace('_collection', '')
                  )}
                </div>
              ) : (
                <div className="lit-ca-no-preview-content">
                  <FaInfoCircle />
                  <p>No content preview available for this question.</p>
                </div>
              )}

              {/* Question options */}
              {previewQuestion.options && previewQuestion.options.length > 0 && (
                <div className="lit-ca-preview-options">
                  <h4>Answer Options</h4>
                  <div className="lit-ca-options-list">
                    {previewQuestion.options.map((option, index) => (
                      <div
                        key={index}
                        className={`lit-ca-option-item ${option.isCorrect ? 'lit-ca-correct' : ''}`}
                      >
                        <div className="lit-ca-option-label">{option.optionId}</div>
                        <div className="lit-ca-option-text">{option.optionText}</div>
                        {option.isCorrect && <div className="lit-ca-option-correct"><FaCheck /> Correct</div>}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div className="lit-ca-modal-footer">
              <button className="lit-ca-modal-close-btn" onClick={() => setShowPreview(false)}>
                Close Preview
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Content Selector Modal */}
      {showContentSelector && selectedQuestion && (
        <div className="lit-ca-modal-overlay" onClick={() => setShowContentSelector(false)}>
          <div className="lit-ca-modal-content lit-ca-content-selector-modal" onClick={e => e.stopPropagation()}>
            <div className="lit-ca-modal-header">
              <h3>Select Content for Question</h3>
              <button className="lit-ca-modal-close" onClick={() => setShowContentSelector(false)}>×</button>
            </div>

            <div className="lit-ca-modal-body">
              <div className="lit-ca-content-selector-header">
                <div className="lit-ca-question-preview">
                  <h4>Question</h4>
                  <div className="lit-ca-question-text">{selectedQuestion.questionText}</div>
                  <div className="lit-ca-question-type">Type: {selectedQuestion.typeId.replace(/_/g, ' ')}</div>
                </div>

                <div className="lit-ca-current-content">
                  <h4>Current Content</h4>
                  {selectedQuestionContent ? (
                    <div className="lit-ca-content-preview">
                      {getContentPreviewElement(
                        selectedQuestionContent,
                        selectedQuestion.contentReference?.collection.replace('_collection', '')
                      )}
                    </div>
                  ) : (
                    <div className="lit-ca-no-content">
                      <FaInfoCircle />
                      <p>No content currently associated with this question.</p>
                    </div>
                  )}
                </div>
              </div>

              <div className="lit-ca-content-selector-search">
                <h4>Select New Content</h4>
                <div className="lit-ca-content-search">
                  <FaSearch className="lit-ca-search-icon" />
                  <input
                    type="text"
                    className="lit-ca-search-input"
                    placeholder="Search content..."
                    value={contentSearchQuery}
                    onChange={(e) => setContentSearchQuery(e.target.value)}
                  />
                </div>
              </div>

              {contentLoading ? (
                <div className="lit-ca-loading-state">
                  <div className="lit-ca-spinner"></div>
                  <p>Loading content...</p>
                </div>
              ) : (
                <div className="lit-ca-content-selector-list">
                  {filteredContent.items && filteredContent.items.length > 0 ? (
                    <>
                      <div className="lit-ca-content-list-header">
                        <span>Select from {filteredContent.items.length} available content items</span>
                      </div>
                      <div className="lit-ca-content-items-grid">
                        {filteredContent.items.map((item, index) => (
                          <div
                            key={index}
                            className={`lit-ca-content-item ${selectedContentItem?._id === item._id ? 'lit-ca-selected' : ''}`}
                            onClick={() => handleSelectContentItem(item)}
                          >
                            <div className="lit-ca-selection-indicator">
                              {selectedContentItem?._id === item._id ? <FaCheck /> : <span className="lit-ca-empty-check"></span>}
                            </div>
                            <div className="lit-ca-content-item-preview">
                              {getContentPreviewElement(item, filteredContent.type)}
                            </div>
                            <div className="lit-ca-content-item-text">
                              {formatContentForDisplay(item, filteredContent.type)}
                            </div>
                          </div>
                        ))}
                      </div>
                    </>
                  ) : (
                    <div className="lit-ca-empty-content-results">
                      <FaInfoCircle className="lit-ca-empty-icon" />
                      <p>No content found matching your search criteria. Try a different search term or collection.</p>
                    </div>
                  )}
                </div>
              )}
            </div>

            <div className="lit-ca-modal-footer">
              <button
                className="lit-ca-modal-close-btn"
                onClick={() => setShowContentSelector(false)}
              >
                Cancel
              </button>
              <button
                className="lit-ca-confirm-btn"
                onClick={handleConfirmContentChange}
                disabled={!selectedContentItem}
              >
                <FaCheck /> Confirm Selection
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Assignment instructions */}
      <div className="lit-ca-assignment-instructions">
        <FaInfoCircle />
        <div>
          <h4>Category Assignment Guidelines</h4>
          <p>
            Select appropriate assessment categories based on the student's current reading level.
            Students need to achieve a passing score (typically 75%) in each assigned category to progress to the next level.
          </p>
          <p>
            You can customize assignments by selecting specific questions and changing the content used in each question.
            This allows you to tailor assessments to each student's specific needs while maintaining consistency across assessment types.
          </p>
        </div>
      </div>
    </div>
  );
};

export default CategoryAssignment;