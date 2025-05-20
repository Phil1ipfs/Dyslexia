import React, { useState, useEffect, useCallback } from 'react';
import { 
  FaTimes, 
  FaEdit,
  FaSave, 
  FaExclamationTriangle, 
  FaInfoCircle, 
  FaPlus, 
  FaTrash,
  FaUser,
  FaImage,
  FaFont,
  FaHeadphones,
  FaMicrophone,
  FaSpinner,
  FaQuestionCircle,
  FaBookOpen,
  FaCheckCircle,
  FaMobile,
  FaAlignLeft
} from 'react-icons/fa';
import './css/ActivityEditModal.css';

/**
 * ActivityEditModal Component
 * 
 * This component allows teachers to create intervention activities for students who 
 * need additional practice in specific categories.
 * 
 * The modal uses different template types according to the category:
 * - For Alphabet Knowledge: patinig and katinig question templates
 * - For Phonological Awareness: malapantig question templates
 * - For Word Recognition & Decoding: word question templates
 * - For Reading Comprehension: sentence templates (which include passage text, images, and questions)
 * 
 * The component strictly adheres to the defined database schema, using template questions
 * and template choices from the respective collections.
 * 
 * @param {Object} activity - The activity to be edited (from prescriptive analysis)
 * @param {Function} onClose - Function to close the modal
 * @param {Function} onSave - Function to save the edited activity
 * @param {Object} student - Student information
 */
const ActivityEditModal = ({ activity, onClose, onSave, student }) => {
  // ===== STATE MANAGEMENT =====
  
  // Basic activity information
  const [title, setTitle] = useState(activity?.title || '');
  const [description, setDescription] = useState(activity?.description || '');
  const [category, setCategory] = useState(activity?.category || '');
  const [readingLevel, setReadingLevel] = useState(activity?.readingLevel || student?.readingLevel || 'Low Emerging');
  
  // Step management for wizard-style interface
  const [currentStep, setCurrentStep] = useState(1);
  
  // Content type is determined by category
  // - 'alphabet' for Alphabet Knowledge (patinig & katinig)
  // - 'phonological' for Phonological Awareness (malapantig)
  // - 'word' for Word Recognition and Decoding (word)
  // - 'sentence' for Reading Comprehension (sentence)
  const [contentType, setContentType] = useState('alphabet');
  
  // Selected templates (from available question/choice templates)
  const [selectedQuestionTemplates, setSelectedQuestionTemplates] = useState([]);
  
  // Available templates (from API/database)
  const [availableQuestionTemplates, setAvailableQuestionTemplates] = useState([]);
  const [availableChoiceTemplates, setAvailableChoiceTemplates] = useState([]);
  const [availableSentenceTemplates, setAvailableSentenceTemplates] = useState([]);
  
  // Selected question-choice pairs for the activity
  const [questionChoicePairs, setQuestionChoicePairs] = useState([]);
  
  // For sentence templates (Reading Comprehension)
  const [selectedSentenceTemplate, setSelectedSentenceTemplate] = useState(null);
  
  // Validation state
  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);
  
  // ===== EFFECTS =====
  
  /**
   * Initialize content type based on activity category
   */
  useEffect(() => {
    if (activity?.category) {
      // Set content type based on category
      if (activity.category === 'Alphabet Knowledge') {
        setContentType('alphabet');
      } else if (activity.category === 'Phonological Awareness') {
        setContentType('phonological');
      } else if (activity.category === 'Word Recognition' || activity.category === 'Decoding') {
        setContentType('word');
      } else if (activity.category === 'Reading Comprehension') {
        setContentType('sentence');
      }
    }
  }, [activity]);
  
  /**
   * Load available templates when component mounts or content type changes
   * 
   * This simulates fetching templates from the server based on category
   * In a real implementation, this would make API calls to fetch templates
   */
  useEffect(() => {
    // Simulate API call to fetch templates
    const loadTemplates = async () => {
      // In a real implementation, these would be API calls
      try {
        // Fetch question templates relevant to the content type
        const fetchedQuestionTemplates = await simulateFetchQuestionTemplates(contentType);
        setAvailableQuestionTemplates(fetchedQuestionTemplates);
        
        // Fetch choice templates relevant to the content type
        const fetchedChoiceTemplates = await simulateFetchChoiceTemplates(contentType);
        setAvailableChoiceTemplates(fetchedChoiceTemplates);
        
        // If content type is 'sentence', fetch sentence templates
        if (contentType === 'sentence') {
          const fetchedSentenceTemplates = await simulateFetchSentenceTemplates(readingLevel);
          setAvailableSentenceTemplates(fetchedSentenceTemplates);
        }
      } catch (error) {
        console.error("Error loading templates:", error);
        // Set error state here if needed
      }
    };
    
    loadTemplates();
  }, [contentType, readingLevel]);
  
  /**
   * Initialize from existing activity data if editing
   */
  useEffect(() => {
    if (activity && activity.questions) {
      // Convert activity questions to question-choice pairs
      const initialPairs = activity.questions.map(q => ({
        id: q.id || Date.now() + Math.random(),
        questionTemplate: q.questionTemplate || null,
        choices: q.choices || [],
        correctAnswer: q.correctAnswer || 0
      }));
      
      setQuestionChoicePairs(initialPairs);
      
      // If it's a sentence activity, set the selected sentence template
      if (contentType === 'sentence' && activity.sentenceTemplate) {
        setSelectedSentenceTemplate(activity.sentenceTemplate);
      }
    }
  }, [activity, contentType]);
  
  /**
   * Initialize question-choice pairs when templates are selected
   */
  useEffect(() => {
    if (questionChoicePairs.length === 0 && selectedQuestionTemplates.length > 0) {
      addQuestionChoicePair();
    }
  }, [selectedQuestionTemplates, questionChoicePairs.length]);
  
  // ===== TEMPLATE FETCHING SIMULATION =====
  // These functions simulate API calls to fetch templates
  // In a real implementation, these would be replaced with actual API calls
  
  /**
   * Simulates fetching question templates based on content type
   * @param {string} type - Content type (alphabet, phonological, word, sentence)
   * @return {Object[]} Array of question templates
   */
  const simulateFetchQuestionTemplates = async (type) => {
    // This would be an API call in a real implementation
    // Following the templates_questions.json structure
    return [
      {
        id: 1,
        category: 'Alphabet Knowledge',
        questionType: 'patinig',
        templateText: 'Anong katumbas na maliit na letra?',
        applicableChoiceTypes: ['patinigBigLetter', 'patinigSmallLetter'],
        correctChoiceType: 'patinigSmallLetter'
      },
      {
        id: 2,
        category: 'Alphabet Knowledge',
        questionType: 'patinig',
        templateText: 'Anong tunog ng letra?',
        applicableChoiceTypes: ['patinigBigLetter', 'patinigSound'],
        correctChoiceType: 'patinigSound'
      },
      {
        id: 3,
        category: 'Alphabet Knowledge',
        questionType: 'katinig',
        templateText: 'Anong katumbas na maliit na letra?',
        applicableChoiceTypes: ['katinigBigLetter', 'katinigSmallLetter'],
        correctChoiceType: 'katinigSmallLetter'
      },
      {
        id: 4,
        category: 'Phonological Awareness',
        questionType: 'malapantig',
        templateText: 'Kapag pinagsama ang mga pantig, ano ang mabubuo?',
        applicableChoiceTypes: ['malapatinigText', 'wordText'],
        correctChoiceType: 'wordText'
      },
      {
        id: 5,
        category: 'Word Recognition',
        questionType: 'word',
        templateText: 'Piliin ang tamang larawan para sa salitang:',
        applicableChoiceTypes: ['wordText'],
        correctChoiceType: 'wordText'
      }
    ].filter(template => {
      // Filter based on content type
      if (type === 'alphabet') {
        return template.category === 'Alphabet Knowledge';
      } else if (type === 'phonological') {
        return template.category === 'Phonological Awareness';
      } else if (type === 'word') {
        return template.category === 'Word Recognition' || template.category === 'Decoding';
      }
      return false; // Not filtering for sentence, as that uses sentence templates
    });
  };
  
  /**
   * Simulates fetching choice templates based on content type
   * @param {string} type - Content type
   * @return {Object[]} Array of choice templates
   */
  const simulateFetchChoiceTemplates = async (type) => {
    // This would be an API call in a real implementation
    // The structure follows templates_choices.json
    return [
      // Patinig (Vowel) choices
      {
        id: 1,
        choiceType: 'patinigBigLetter',
        choiceValue: 'A',
        choiceImage: 'https://example.com/images/A_big.png',
        soundText: null
      },
      {
        id: 2,
        choiceType: 'patinigBigLetter',
        choiceValue: 'E',
        choiceImage: 'https://example.com/images/E_big.png',
        soundText: null
      },
      {
        id: 3,
        choiceType: 'patinigSmallLetter',
        choiceValue: 'a',
        choiceImage: 'https://example.com/images/a_small.png',
        soundText: null
      },
      {
        id: 4,
        choiceType: 'patinigSmallLetter',
        choiceValue: 'e',
        choiceImage: 'https://example.com/images/e_small.png',
        soundText: null
      },
      {
        id: 5,
        choiceType: 'patinigSound',
        choiceValue: null,
        choiceImage: null,
        soundText: '/ah/'
      },
      
      // Katinig (Consonant) choices
      {
        id: 6,
        choiceType: 'katinigBigLetter',
        choiceValue: 'B',
        choiceImage: 'https://example.com/images/B_big.png',
        soundText: null
      },
      {
        id: 7,
        choiceType: 'katinigSmallLetter',
        choiceValue: 'b',
        choiceImage: 'https://example.com/images/b_small.png',
        soundText: null
      },
      
      // Malapantig (Syllable) choices
      {
        id: 8,
        choiceType: 'malapatinigText',
        choiceValue: 'BA',
        choiceImage: null,
        soundText: '/ba/'
      },
      {
        id: 9,
        choiceType: 'malapatinigText',
        choiceValue: 'BO',
        choiceImage: null,
        soundText: '/bo/'
      },
      
      // Word choices
      {
        id: 10,
        choiceType: 'wordText',
        choiceValue: 'bola',
        choiceImage: 'https://example.com/images/ball.png',
        soundText: null
      },
      {
        id: 11,
        choiceType: 'wordText',
        choiceValue: 'aso',
        choiceImage: 'https://example.com/images/dog.png',
        soundText: null
      }
    ].filter(choice => {
      // Filter based on content type
      if (type === 'alphabet') {
        return choice.choiceType.includes('patinig') || choice.choiceType.includes('katinig');
      } else if (type === 'phonological') {
        return choice.choiceType === 'malapatinigText' || choice.choiceType === 'wordText';
      } else if (type === 'word') {
        return choice.choiceType === 'wordText' || choice.choiceType === 'wordSound';
      }
      return false;
    });
  };
  
  /**
   * Simulates fetching sentence templates based on reading level
   * @param {string} level - Reading level
   * @return {Object[]} Array of sentence templates
   */
  const simulateFetchSentenceTemplates = async (level) => {
    // This would be an API call in a real implementation
    // The structure follows sentence_templates.json
    return [
      {
        id: 1,
        title: 'Si Maria at ang mga Bulaklak',
        category: 'Reading Comprehension',
        readingLevel: 'Low Emerging',
        sentenceText: [
          {
            pageNumber: 1,
            text: 'Si Maria ay pumunta sa parke. Nakita niya ang maraming bulaklak na magaganda. Siya ay natuwa at nag-uwi ng ilang bulaklak para sa kanyang ina.',
            image: 'https://example.com/images/park_flowers.png'
          },
          {
            pageNumber: 2,
            text: 'Nang makita ng ina ni Maria ang mga bulaklak, siya ay ngumiti at nagyakap sa kanyang anak. Gumawa sila ng maliit na hardin sa harap ng kanilang bahay.',
            image: 'https://example.com/images/mother_garden.png'
          }
        ],
        sentenceQuestions: [
          {
            questionNumber: 1,
            questionText: 'Sino ang pangunahing tauhan sa kwento?',
            sentenceCorrectAnswer: 'Si Maria',
            sentenceOptionAnswers: ['Si Maria', 'Si Juan', 'Ang ina', 'Ang hardinero']
          },
          {
            questionNumber: 2,
            questionText: 'Saan pumunta si Maria?',
            sentenceCorrectAnswer: 'Sa parke',
            sentenceOptionAnswers: ['Sa parke', 'Sa paaralan', 'Sa tindahan', 'Sa bahay']
          }
        ]
      },
      {
        id: 2,
        title: 'Ang Batang Matulungin',
        category: 'Reading Comprehension',
        readingLevel: 'Transitioning',
        sentenceText: [
          {
            pageNumber: 1,
            text: 'Si Pedro ay isang batang matulungin. Tuwing umaga, tinutulungan niya ang kanyang ina na maglinis ng bahay. Siya ay nagwawalis ng sahig at nagliligpit ng mga laruan.',
            image: 'https://example.com/images/boy_cleaning.png'
          },
          {
            pageNumber: 2,
            text: 'Pagkatapos maglinis, tinutulungan din niya ang kanyang ama sa hardin. Nagdidilig siya ng mga halaman at namimitas ng mga gulay. Ang kanyang mga magulang ay masaya dahil si Pedro ay isang mabuting anak.',
            image: 'https://example.com/images/boy_garden.png'
          }
        ],
        sentenceQuestions: [
          {
            questionNumber: 1,
            questionText: 'Sino ang batang matulungin?',
            sentenceCorrectAnswer: 'Si Pedro',
            sentenceOptionAnswers: ['Si Pedro', 'Si Maria', 'Si Juan', 'Si Ana']
          },
          {
            questionNumber: 2,
            questionText: 'Paano tinutulungan ni Pedro ang kanyang ina?',
            sentenceCorrectAnswer: 'Nagwawalis ng sahig at nagliligpit ng mga laruan',
            sentenceOptionAnswers: [
              'Nagwawalis ng sahig at nagliligpit ng mga laruan',
              'Nagluluto ng pagkain',
              'Naglalaba ng damit',
              'Naghuhugas ng pinggan'
            ]
          }
        ]
      }
    ].filter(template => template.readingLevel === level || level === 'All Levels');
  };
  
  // ===== HANDLER FUNCTIONS =====
  
  /**
   * Handles selection of a question template
   * @param {Object} template - The question template object
   */
  const handleSelectQuestionTemplate = (template) => {
    if (selectedQuestionTemplates.some(t => t.id === template.id)) {
      // Already selected, deselect it
      setSelectedQuestionTemplates(selectedQuestionTemplates.filter(t => t.id !== template.id));
    } else {
      // Not selected, add it
      setSelectedQuestionTemplates([...selectedQuestionTemplates, template]);
    }
  };
  
  /**
   * Adds a question-choice pair to the activity
   */
  const addQuestionChoicePair = () => {
    const newPair = {
      id: Date.now(),
      questionTemplate: null,
      choices: [],
      correctAnswer: 0
    };
    
    setQuestionChoicePairs(prevPairs => [...prevPairs, newPair]);
  };
  
  /**
   * Updates a question-choice pair
   * @param {number} id - The ID of the pair to update
   * @param {string} field - The field to update
   * @param {any} value - The new value
   */
  const updateQuestionChoicePair = (id, field, value) => {
    // Add debug logging
    console.log(`Updating pair ${id}, field ${field}:`, value);
    
    setQuestionChoicePairs(prevPairs => {
      const newPairs = prevPairs.map(pair => 
        pair.id === id ? { ...pair, [field]: value } : pair
      );
      
      // Log the updated array
      console.log('Updated pairs:', newPairs);
      return newPairs;
    });
  };
  
  /**
   * Removes a question-choice pair
   * @param {number} id - The ID of the pair to remove
   */
  const removeQuestionChoicePair = (id) => {
    if (questionChoicePairs.length <= 1) {
      // Don't remove if it's the last pair
      return;
    }
    
    setQuestionChoicePairs(prevPairs => prevPairs.filter(pair => pair.id !== id));
  };
  
  /**
   * Handles selection of a sentence template for Reading Comprehension activities
   * @param {Object} template - The sentence template object
   */
  const handleSelectSentenceTemplate = (template) => {
    setSelectedSentenceTemplate(template);
  };
  
  /**
   * Add a choice to a question-choice pair
   * @param {number} pairId - The ID of the pair to update
   * @param {Object} choice - The choice template object
   */
  const addChoiceToPair = (pairId, choice) => {
    setQuestionChoicePairs(prevPairs => {
      return prevPairs.map(pair => {
        if (pair.id === pairId) {
          // Don't add if already present
          if (pair.choices.some(c => c.id === choice.id)) {
            return pair;
          }
          
          return {
            ...pair,
            choices: [...pair.choices, choice]
          };
        }
        return pair;
      });
    });
  };
  
  /**
   * Remove a choice from a question-choice pair
   * @param {number} pairId - The ID of the pair to update
   * @param {number} choiceId - The ID of the choice to remove
   */
  const removeChoiceFromPair = (pairId, choiceId) => {
    setQuestionChoicePairs(prevPairs => {
      return prevPairs.map(pair => {
        if (pair.id === pairId) {
          // Need at least two choices
          if (pair.choices.length <= 2) {
            return pair;
          }
          
          // Adjust correctAnswer if needed
          const choiceIndex = pair.choices.findIndex(c => c.id === choiceId);
          let newCorrectAnswer = pair.correctAnswer;
          
          if (choiceIndex === pair.correctAnswer) {
            // The correct answer was removed, set to first option
            newCorrectAnswer = 0;
          } else if (choiceIndex < pair.correctAnswer) {
            // An option before the correct one was removed, shift index
            newCorrectAnswer--;
          }
          
          return {
            ...pair,
            choices: pair.choices.filter(c => c.id !== choiceId),
            correctAnswer: newCorrectAnswer
          };
        }
        return pair;
      });
    });
  };
  
  /**
   * Set the correct answer for a question-choice pair
   * @param {number} pairId - The ID of the pair to update
   * @param {number} choiceIndex - The index of the correct choice
   */
  const setCorrectAnswer = (pairId, choiceIndex) => {
    setQuestionChoicePairs(prevPairs => {
      return prevPairs.map(pair => 
        pair.id === pairId ? { ...pair, correctAnswer: choiceIndex } : pair
      );
    });
  };
  
  // ===== NAVIGATION FUNCTIONS =====
  
  /**
   * Move to the next step in the wizard
   */
  const nextStep = () => {
    if (validateCurrentStep()) {
      setCurrentStep(currentStep + 1);
    }
  };
  
  /**
   * Move to the previous step in the wizard
   */
  const prevStep = () => {
    setCurrentStep(currentStep - 1);
  };
  
  // ===== VALIDATION FUNCTIONS =====
  
  /**
   * Validates the current step
   * @return {boolean} Whether the current step is valid
   */
  const validateCurrentStep = () => {
    const newErrors = {};
    
    if (currentStep === 1) {
      // Basic info validation
      if (!title.trim()) {
        newErrors.title = "Title is required";
      }
      
      if (!description.trim()) {
        newErrors.description = "Description is required";
      }
      
      if (!category) {
        newErrors.category = "Category is required";
      }
    }
    else if (currentStep === 2) {
      // Template selection validation
      if (contentType !== 'sentence' && selectedQuestionTemplates.length === 0) {
        newErrors.templates = "At least one question template must be selected";
      }
      
      if (contentType === 'sentence' && !selectedSentenceTemplate) {
        newErrors.sentenceTemplate = "A reading passage must be selected";
      }
    }
    else if (currentStep === 3) {
      // Question-choice pairs validation
      if (contentType !== 'sentence') {
        if (questionChoicePairs.length === 0) {
          newErrors.pairs = "At least one question must be added";
        }
        
        if (questionChoicePairs.some(pair => !pair.questionTemplate)) {
          newErrors.pairs = "All questions must have a question template";
        }
        
        if (questionChoicePairs.some(pair => pair.choices.length < 2)) {
          newErrors.pairs = "All questions must have at least two choices";
        }
      }
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };
  
  /**
   * Validates all steps before submission
   * @return {boolean} Whether all steps are valid
   */
  const validateAllSteps = () => {
    const allErrors = {};
    
    // Basic info validation
    if (!title.trim()) {
      allErrors.title = "Title is required";
    }
    
    if (!description.trim()) {
      allErrors.description = "Description is required";
    }
    
    if (!category) {
      allErrors.category = "Category is required";
    }
    
    // Template selection validation
    if (contentType !== 'sentence' && selectedQuestionTemplates.length === 0) {
      allErrors.templates = "At least one question template must be selected";
    }
    
    if (contentType === 'sentence' && !selectedSentenceTemplate) {
      allErrors.sentenceTemplate = "A reading passage must be selected";
    }
    
    // Question-choice pairs validation
    if (contentType !== 'sentence') {
      if (questionChoicePairs.length === 0) {
        allErrors.pairs = "At least one question must be added";
      }
      
      if (questionChoicePairs.some(pair => !pair.questionTemplate)) {
        allErrors.pairs = "All questions must have a question template";
      }
      
      if (questionChoicePairs.some(pair => pair.choices.length < 2)) {
        allErrors.pairs = "All questions must have at least two choices";
      }
    }
    
    setErrors(allErrors);
    return Object.keys(allErrors).length === 0;
  };
  
  // ===== FORM SUBMISSION =====
  
  /**
   * Handle form submission
   * @param {Event} e - The submit event
   */
  const handleSubmit = (e) => {
    e.preventDefault();
    
    if (currentStep < 4) {
      // If not on the final step, just go to next step
      nextStep();
      return;
    }
    
    // Final validation before saving
    if (!validateAllSteps()) {
      // If validation fails, go to the first step with errors
      if (errors.title || errors.description || errors.category) {
        setCurrentStep(1);
      } else if (errors.templates || errors.sentenceTemplate) {
        setCurrentStep(2);
      } else if (errors.pairs) {
        setCurrentStep(3);
      }
      return;
    }
    
    // Show submitting state
    setSubmitting(true);
    
    // Prepare data for saving
    let updatedActivity;
    
    if (contentType === 'sentence') {
      // For Reading Comprehension, use the sentence template
      updatedActivity = {
        ...activity,
        id: activity?.id || Date.now(),
        title,
        description,
        category,
        readingLevel,
        contentType,
        sentenceTemplate: selectedSentenceTemplate,
        // No questionChoicePairs for sentence templates, as they have their own questions
        questions: selectedSentenceTemplate.sentenceQuestions.map(q => ({
          id: Date.now() + Math.random(),
          questionText: q.questionText,
          correctAnswer: q.sentenceCorrectAnswer,
          options: q.sentenceOptionAnswers
        })),
        status: 'pushed_to_mobile', // Directly push to mobile
        lastModified: new Date().toISOString()
      };
    } else {
      // For other categories, use the question-choice pairs
      updatedActivity = {
        ...activity,
        id: activity?.id || Date.now(),
        title,
        description,
        category,
        readingLevel,
        contentType,
        // Map question-choice pairs to questions format, ensuring correct choices have images
        questions: questionChoicePairs.map(pair => {
          // Prepare options array - for correct answers, we pass the image too
          const options = pair.choices.map((choice, index) => {
            // For correct choices, we want to include the image if available
            if (index === pair.correctAnswer && choice.choiceImage) {
              return {
                text: choice.choiceValue || choice.soundText || '',
                image: choice.choiceImage
              };
            } else {
              // For incorrect choices, just use the text value
              return choice.choiceValue || choice.soundText || '';
            }
          });
          
          return {
            id: pair.id,
            questionTemplate: pair.questionTemplate,
            questionText: pair.questionTemplate?.templateText || '',
            options: options,
            correctAnswer: pair.correctAnswer,
            choiceObjects: pair.choices // Keep the full choice objects for reference
          };
        }),
        status: 'pushed_to_mobile', // Directly push to mobile
        lastModified: new Date().toISOString()
      };
    }
    
    // Call onSave with the updated activity
    // Wrapped in setTimeout to simulate API call
    setTimeout(() => {
      onSave(updatedActivity);
      setSubmitting(false);
    }, 1000);
  };
  
  // ===== RENDER HELPER FUNCTIONS =====
  
  /**
   * Render different step content based on current step
   * @return {JSX.Element} The current step content
   */
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
   * Renders Step 1: Basic Information
   * @return {JSX.Element} Step 1 content
   */
  const renderBasicInfoStep = () => {
    return (
      <div className="literexia-form-section">
        <h3>Activity Information</h3>
        
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
          <label htmlFor="category">
            Category <span className="literexia-required">*</span>
          </label>
          <select
            id="category"
            value={category}
            onChange={(e) => {
              setCategory(e.target.value);
              
              // Update content type based on category
              if (e.target.value === 'Alphabet Knowledge') {
                setContentType('alphabet');
              } else if (e.target.value === 'Phonological Awareness') {
                setContentType('phonological');
              } else if (e.target.value === 'Word Recognition' || e.target.value === 'Decoding') {
                setContentType('word');
              } else if (e.target.value === 'Reading Comprehension') {
                setContentType('sentence');
              }
            }}
            className={errors.category ? 'literexia-error' : ''}
            disabled={activity?.category} // Disable if editing an existing activity
          >
            <option value="">Select a category</option>
            <option value="Alphabet Knowledge">Alphabet Knowledge</option>
            <option value="Phonological Awareness">Phonological Awareness</option>
            <option value="Word Recognition">Word Recognition</option>
            <option value="Decoding">Decoding</option>
            <option value="Reading Comprehension">Reading Comprehension</option>
          </select>
          {errors.category && <div className="literexia-error-message">{errors.category}</div>}
        </div>
        
        <div className="literexia-form-group">
          <label htmlFor="readingLevel">Reading Level</label>
          <select
            id="readingLevel"
            value={readingLevel}
            onChange={(e) => setReadingLevel(e.target.value)}
          >
            <option value="Low Emerging">Low Emerging</option>
            <option value="High Emerging">High Emerging</option>
            <option value="Transitioning">Transitioning</option>
            <option value="Developing">Developing</option>
            <option value="At Grade Level">At Grade Level</option>
          </select>
        </div>
        
        {/* Display info about the content type being used */}
        <div className="literexia-content-type-info">
          <h4>Content Type: {
            contentType === 'alphabet' ? 'Alphabet Knowledge (Letters & Sounds)' :
            contentType === 'phonological' ? 'Phonological Awareness (Syllables)' :
            contentType === 'word' ? 'Word Recognition & Decoding' :
            contentType === 'sentence' ? 'Reading Comprehension (Passages)' :
            'Not Selected'
          }</h4>
          
          <div className="literexia-content-type-description">
            {contentType === 'alphabet' && (
              <p>This activity will focus on letter recognition, matching uppercase and lowercase letters, and letter sounds (patinig and katinig).</p>
            )}
            {contentType === 'phonological' && (
              <p>This activity will focus on syllable blending, identification, and manipulation (malapantig).</p>
            )}
            {contentType === 'word' && (
              <p>This activity will focus on recognizing whole words, matching words to images, or sounding out words.</p>
            )}
            {contentType === 'sentence' && (
              <p>This activity will include reading passages with supporting images, followed by comprehension questions about the text.</p>
            )}
          </div>
        </div>
      </div>
    );
  };

  /**
   * Renders Step 2: Template Selection
   * This step varies significantly based on content type
   * @return {JSX.Element} Step 2 content
   */
  const renderTemplateSelectionStep = () => {
    // For Reading Comprehension, we select sentence templates
    if (contentType === 'sentence') {
      return (
        <div className="literexia-form-section">
          <h3>Select a Reading Passage</h3>
          
          <div className="literexia-info-banner">
            <FaInfoCircle />
            <p>
              Choose a reading passage for this activity. Each passage includes:
              <ul>
                <li>Text content split across pages</li>
                <li>Supporting images for each page</li>
                <li>Comprehension questions specific to this passage</li>
              </ul>
              All passages are tailored to the student's reading level.
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
                  key={template.id}
                  className={`literexia-sentence-template-item ${selectedSentenceTemplate?.id === template.id ? 'selected' : ''}`}
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
                <p>No reading passages were found for the selected reading level. Try selecting a different reading level.</p>
              </div>
            )}
          </div>
        </div>
      );
    }
    
    // For other content types, we select question templates
    return (
      <div className="literexia-form-section">
        <h3>Select Question Templates</h3>
        
        <div className="literexia-info-banner">
          <FaInfoCircle />
          <p>
            Choose the question templates to use in this activity. These templates will be used to create questions
            targeting the specific skills the student needs to practice.
          </p>
        </div>
        
        {errors.templates && (
          <div className="literexia-error-banner">
            <FaExclamationTriangle />
            <p>{errors.templates}</p>
          </div>
        )}
        
        <div className="literexia-question-templates-list">
          {availableQuestionTemplates.length > 0 ? (
            availableQuestionTemplates.map(template => (
              <div 
                key={template.id}
                className={`literexia-question-template-item ${selectedQuestionTemplates.some(t => t.id === template.id) ? 'selected' : ''}`}
                onClick={() => handleSelectQuestionTemplate(template)}
              >
                <div className="literexia-question-template-header">
                  <h4>{template.templateText}</h4>
                  <div className="literexia-question-template-type">
                    {template.questionType}
                  </div>
                </div>
                
                <div className="literexia-question-template-details">
                  <div className="literexia-template-detail">
                    <strong>Category:</strong> {template.category}
                  </div>
                  <div className="literexia-template-detail">
                    <strong>Applicable Choices:</strong> {template.applicableChoiceTypes.join(', ')}
                  </div>
                  <div className="literexia-template-detail">
                    <strong>Correct Choice Type:</strong> {template.correctChoiceType}
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div className="literexia-empty-state">
              <FaExclamationTriangle className="literexia-empty-icon" />
              <h3>No Question Templates Available</h3>
              <p>No question templates were found for the selected category. Try selecting a different category.</p>
            </div>
          )}
        </div>
      </div>
    );
  };

  /**
   * Renders Step 3: Question-Choice Pairs
   * This step is used for non-sentence content types
   * @return {JSX.Element} Step 3 content for alphabet, phonological, word
   */
  const renderQuestionChoicesStep = () => {  
    return (
      <div className="literexia-form-section">
        <h3>Create Questions and Choices</h3>
        
        <div className="literexia-info-banner">
          <FaInfoCircle />
          <p>
            For each question, select a question template and then add choices.
            Mark one choice as the correct answer. Images will be displayed for correct answers only.
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
              <button
                type="button"
                className="literexia-remove-pair-btn"
                onClick={() => removeQuestionChoicePair(pair.id)}
                disabled={questionChoicePairs.length <= 1}
              >
                <FaTrash /> Remove
              </button>
            </div>
            
            <div className="literexia-question-template-selection">
              <label>Select a Question Template <span className="literexia-required">*</span></label>
              
              {/* Debug output - remove in production */}
              <div style={{ fontSize: '10px', color: '#666', marginBottom: '5px' }}>
                Current template: {pair.questionTemplate ? 
                  `ID: ${pair.questionTemplate.id}, Text: ${pair.questionTemplate.templateText}` : 
                  'None selected'}
              </div>
              
              <select
                value={pair.questionTemplate?.id?.toString() || ''}
                onChange={(e) => {
                  const templateId = e.target.value;
                  console.log('Selected value from dropdown:', templateId);
                  
                  if (!templateId) {
                    console.log('Empty selection, clearing template');
                    updateQuestionChoicePair(pair.id, 'questionTemplate', null);
                    updateQuestionChoicePair(pair.id, 'choices', []);
                    return;
                  }
                  
                  const template = selectedQuestionTemplates.find(t => 
                    String(t.id) === String(templateId)
                  );
                  
                  console.log('Found template for selection:', template);
                  
                  if (template) {
                    // Update in a single batch
                    const updatedPair = {
                      ...pair,
                      questionTemplate: template,
                      choices: [],
                      correctAnswer: 0
                    };
                    
                    // Use this instead of multiple updateQuestionChoicePair calls
                    setQuestionChoicePairs(prevPairs => 
                      prevPairs.map(p => p.id === pair.id ? updatedPair : p)
                    );
                    
                    console.log('Updated pair with new template');
                  } else {
                    console.error('Template not found for ID:', templateId);
                  }
                }}
                className={!pair.questionTemplate ? 'literexia-error' : ''}
              >
                <option value="">-- Select Template --</option>
                {selectedQuestionTemplates.map(template => (
                  <option key={template.id} value={template.id.toString()}>
                    {template.templateText}
                  </option>
                ))}
              </select>
            </div>
            
            {pair.questionTemplate && (
              <div className="literexia-choices-selection">
                <div className="literexia-choices-header">
                  <label>Select Choices <span className="literexia-required">*</span></label>
                  <div className="literexia-choices-info">
                    <small>Available choice types: {pair.questionTemplate.applicableChoiceTypes.join(', ')}</small>
                    <small>Correct choice type: {pair.questionTemplate.correctChoiceType}</small>
                  </div>
                </div>
                
                <div className="literexia-available-choices">
                  <h5>Available Choices</h5>
                  <div className="literexia-choice-tiles">
                    {availableChoiceTemplates
                      .filter(choice => pair.questionTemplate.applicableChoiceTypes.includes(choice.choiceType))
                      .map(choice => (
                        <div 
                          key={choice.id}
                          className="literexia-choice-tile"
                          onClick={() => addChoiceToPair(pair.id, choice)}
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
                            {choice.choiceType}
                          </div>
                        </div>
                      ))}
                  </div>
                </div>
                
                <div className="literexia-selected-choices">
                  <h5>Selected Choices</h5>
                  {pair.choices.length === 0 ? (
                    <div className="literexia-empty-choices">
                      <p>No choices selected. Click on available choices above to add them.</p>
                    </div>
                  ) : (
                    <div className="literexia-selected-choice-list">
                      {pair.choices.map((choice, choiceIndex) => (
                        <div
                          key={choice.id}
                          className={`literexia-selected-choice-item ${choiceIndex === pair.correctAnswer ? 'correct' : ''}`}
                        >
                          <div className="literexia-choice-correct-indicator">
                            <input
                              type="radio"
                              name={`correct-choice-${pair.id}`}
                              checked={choiceIndex === pair.correctAnswer}
                              onChange={() => setCorrectAnswer(pair.id, choiceIndex)}
                            />
                            <label>Correct</label>
                          </div>
                          
                          <div className="literexia-selected-choice-content">
                            {/* Only show images for correct choices or during selection */}
                            {(choiceIndex === pair.correctAnswer || true) && choice.choiceImage && (
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
                            onClick={() => removeChoiceFromPair(pair.id, choice.id)}
                            disabled={pair.choices.length <= 2}
                          >
                            <FaTrash />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}
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
   * Renders Step 3 (alternative): Sentence Template Preview
   * This step is used for Reading Comprehension activities
   * @return {JSX.Element} Step 3 content for sentence
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
   * Renders Step 4: Review and Submit
   * @return {JSX.Element} Step 4 content
   */
  const renderReviewStep = () => {
    return (
      <div className="literexia-review-section">
        <h3>Review Activity</h3>
        
        <div className="literexia-info-banner">
          <FaInfoCircle />
          <p>
            Review your activity before pushing it to {student?.firstName || student?.name}'s mobile device. 
            Once submitted, the activity will be immediately available on their mobile app for practice.
          </p>
        </div>
        
        {/* Basic information review */}
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
              <span className="literexia-review-value">{category}</span>
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
        
        {/* Content type specific review */}
        {contentType === 'sentence' ? (
          <div className="literexia-review-card">
            <h4>Reading Passage</h4>
            <div className="literexia-review-summary">
              <p>
                <strong>Title:</strong> {selectedSentenceTemplate?.title}
              </p>
              <p>
                <strong>Pages:</strong> {selectedSentenceTemplate?.sentenceText.length || 0}
              </p>
              <p>
                <strong>Questions:</strong> {selectedSentenceTemplate?.sentenceQuestions.length || 0}
              </p>
              
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
          <>
            <div className="literexia-review-card">
              <h4>Question Templates</h4>
              <div className="literexia-review-summary">
                <p>This activity uses {selectedQuestionTemplates.length} question template(s):</p>
                <ul className="literexia-template-summary">
                  {selectedQuestionTemplates.map((template, index) => (
                    <li key={index}>
                      <strong>{template.templateText}</strong>
                      <span className="literexia-template-type">({template.questionType})</span>
                    </li>
                  ))}
                </ul>
              </div>
              
              <button 
                type="button" 
                className="literexia-edit-step-btn"
                onClick={() => setCurrentStep(2)}
              >
                <FaEdit /> Edit
              </button>
            </div>
          
            <div className="literexia-review-card">
              <h4>Questions and Choices</h4>
              <div className="literexia-review-summary">
                <p>This activity has {questionChoicePairs.length} question(s):</p>
                
                <div className="literexia-questions-summary">
                  {questionChoicePairs.map((pair, index) => (
                    <div key={index} className="literexia-question-summary">
                      <p className="literexia-question-summary-text">
                        <strong>Q{index + 1}:</strong> {pair.questionTemplate?.templateText || 'No template selected'}
                      </p>
                      <div className="literexia-choices-summary">
                        <p><strong>Choices:</strong></p>
                        <ul>
                          {pair.choices.map((choice, choiceIndex) => (
                            <li key={choiceIndex} className={choiceIndex === pair.correctAnswer ? 'correct-choice' : ''}>
                              {choice.choiceValue || choice.soundText || '(No text)'} 
                              {choiceIndex === pair.correctAnswer && ' (Correct)'}
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              
              <button 
                type="button" 
                className="literexia-edit-step-btn"
                onClick={() => setCurrentStep(3)}
              >
                <FaEdit /> Edit
              </button>
            </div>
          </>
        )}
        
        {/* Mobile notification banner */}
        <div className="literexia-push-mobile-notice">
          <div className="literexia-notice-icon">
            <FaMobile />
          </div>
          <div className="literexia-notice-content">
            <h4>Ready to Push to Mobile</h4>
            <p>
              This activity will be sent directly to {student?.firstName || student?.name}'s mobile 
              device after submission.
            </p>
          </div>
        </div>
      </div>
    );
  };

  // ===== MAIN RENDER =====
  return (
    <div className="literexia-modal-overlay">
      <div className="literexia-activity-edit-modal">
        {/* Modal Header */}
        <div className="literexia-modal-header">
          <div className="literexia-modal-title">
            <h2>Create Intervention Activity for {student?.firstName || student?.name || 'Student'}</h2>
            <div className="literexia-student-badge">
              <FaUser /> {student?.readingLevel || 'Level 2'}
            </div>
          </div>
          <button className="literexia-close-button" onClick={onClose}>
            <FaTimes />
          </button>
        </div>
        
        {/* Error banner */}
        {Object.keys(errors).length > 0 && (
          <div className="literexia-error-banner">
            <FaExclamationTriangle />
            <p>Please fix the errors before continuing</p>
          </div>
        )}
        
        {/* Steps indicator */}
        <div className="literexia-steps-indicator">
          <div className={`literexia-step ${currentStep >= 1 ? 'active' : ''}`} onClick={() => setCurrentStep(1)}>
            <div className="literexia-step-number">1</div>
            <div className="literexia-step-label">Basic Info</div>
          </div>
          <div className="literexia-step-connector"></div>
          
          <div 
            className={`literexia-step ${currentStep >= 2 ? 'active' : ''}`} 
            onClick={() => validateCurrentStep() && setCurrentStep(2)}
          >
            <div className="literexia-step-number">2</div>
            <div className="literexia-step-label">
              {contentType === 'sentence' ? 'Select Passage' : 'Select Templates'}
            </div>
          </div>
          <div className="literexia-step-connector"></div>
          
          <div 
            className={`literexia-step ${currentStep >= 3 ? 'active' : ''}`} 
            onClick={() => validateCurrentStep() && setCurrentStep(3)}
          >
            <div className="literexia-step-number">3</div>
            <div className="literexia-step-label">
              {contentType === 'sentence' ? 'Preview' : 'Questions & Choices'}
            </div>
          </div>
          <div className="literexia-step-connector"></div>
          
          <div 
            className={`literexia-step ${currentStep >= 4 ? 'active' : ''}`} 
            onClick={() => validateCurrentStep() && setCurrentStep(4)}
          >
            <div className="literexia-step-number">4</div>
            <div className="literexia-step-label">Review</div>
          </div>
        </div>
        
        {/* Modal Info Banner - explains purpose */}
        <div className="literexia-modal-info-banner">
          <FaInfoCircle />
          <p>
            {contentType === 'sentence' ? (
              <>
                This activity will create a reading comprehension exercise using a complete passage with questions.
                The student will see the passage text along with supporting images, followed by questions to test their understanding.
              </>
            ) : (
              <>
                This intervention activity will help address {student?.firstName || student?.name || 'the student'}'s 
                specific needs in {category || 'the selected category'}. The activity will be sent directly to the student's mobile device.
              </>
            )}
          </p>
        </div>
        
        {/* Form */}
        <form onSubmit={handleSubmit} className="literexia-edit-form">
          {renderStepContent()}
          
          {/* Form navigation */}
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
                  <FaSpinner className="literexia-spinner" /> Processing...
                </>
              ) : currentStep < 4 ? (
                'Continue'
              ) : (
                <>
                  <FaSave /> Send to Mobile Device
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