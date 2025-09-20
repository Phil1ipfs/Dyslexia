// src/components/TeacherDashboard/StudentProgress/ProgressReport.jsx
import React, { useState, useEffect, useRef } from 'react';
import {
  FaInfoCircle,
  FaBookOpen,
  FaChartLine,
  FaCheckCircle,
  FaBrain,
  FaCalendarAlt,
  FaFilter,
  FaArrowRight,
  FaBook,
  FaListAlt,
  FaQuestionCircle,
  FaCheck,
  FaLightbulb,
  FaPercentage,
  FaTag,
  FaHistory,
  FaExclamationTriangle,
  FaVolumeUp,
  FaFileAlt,
  FaTools,
  FaGraduationCap,
  FaExpandArrowsAlt,
  FaCompressArrowsAlt,
  FaTimesCircle,
  FaClock,
  FaEye,
  FaImage,
  FaClipboardList,
  FaFilePdf,
  FaDownload,
  FaSpinner,
  FaLock
} from 'react-icons/fa';

import './css/ProgressReport.css';
import ProgressApiService from '../../../services/Teachers/ManageProgress/ProgressApiService';
import MainAssessmentService from '../../../services/Teachers/MainAssessmentService';
import PdfReportService from '../../../services/Teachers/ManageProgress/PdfReportService';
import ImagePreviewModal from './ImagePreviewModal';

const ProgressReport = ({ progressData, categoryAccessMap = {}, categoryAccessLoading = false, onViewRecommendations }) => {
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedTimeframe, setSelectedTimeframe] = useState('current');
  const [animated, setAnimated] = useState(false);
  const animatedRef = useRef(false);
  const [expandedCategories, setExpandedCategories] = useState({});
  const [studentResponses, setStudentResponses] = useState([]);
  const [assessmentQuestions, setAssessmentQuestions] = useState([]);
  const [loadingDetails, setLoadingDetails] = useState(false);
  const [imagePreview, setImagePreview] = useState({
    isOpen: false,
    imageUrl: '',
    title: '',
    questionText: ''
  });
  const [pdfGeneration, setPdfGeneration] = useState({
    isGenerating: false,
    progress: 0,
    error: null
  });
  
  useEffect(() => {
    if (animatedRef.current) return;
    
    const timer = setTimeout(() => {
      setAnimated(true);
      animatedRef.current = true;
      
      // Animate counters on page load
      const counters = document.querySelectorAll('.student-progress-counter');
      counters.forEach(counter => {
        const target = parseInt(counter.getAttribute('data-target') || 0, 10);
        const duration = 1500; // milliseconds
        const startTime = performance.now();
        
        function updateCounter(currentTime) {
          const elapsedTime = currentTime - startTime;
          
          if (elapsedTime < duration) {
            const progress = elapsedTime / duration;
            const currentValue = Math.ceil(progress * target);
            counter.textContent = currentValue;
            requestAnimationFrame(updateCounter);
          } else {
            counter.textContent = target;
          }
        }
        
        requestAnimationFrame(updateCounter);
      });
    }, 300);
    
    return () => clearTimeout(timer);
  }, []);

  // Fetch detailed data when component mounts
  useEffect(() => {
    if (progressData && progressData.studentId) {
      fetchDetailedData(progressData.studentId);
    }
  }, [progressData]);

  // Fetch student responses and assessment questions
  const fetchDetailedData = async (studentId) => {
    try {
      setLoadingDetails(true);

      // Check if student responses are already included in progressData (for post-assessment)
      if (progressData.studentResponses && progressData.studentResponses.length > 0) {
        console.log('Using student responses from progressData:', progressData.studentResponses.length);
        setStudentResponses(progressData.studentResponses);
      } else {
        // Fallback: Fetch student responses separately (for pre-assessment or when not included)
        console.log('Fetching student responses separately...');
        const responsesResult = await ProgressApiService.getStudentResponses(studentId);
        if (responsesResult.success && responsesResult.data) {
          setStudentResponses(responsesResult.data);
        }
      }

      // Fetch assessment questions - we'll get them all since we need them for comparison
      const assessmentsResult = await MainAssessmentService.getAllAssessments();
      if (assessmentsResult.success && assessmentsResult.data) {
        setAssessmentQuestions(assessmentsResult.data);
      }

    } catch (error) {
      console.error('Error fetching detailed data:', error);
    } finally {
      setLoadingDetails(false);
    }
  };

  // Toggle category expansion
  const toggleCategoryExpansion = (categoryName) => {
    setExpandedCategories(prev => ({
      ...prev,
      [categoryName]: !prev[categoryName]
    }));
  };

  // Handle image preview
  const handleImageClick = (imageUrl, title, questionText) => {
    setImagePreview({
      isOpen: true,
      imageUrl,
      title: title || 'Question Image',
      questionText: questionText || ''
    });
  };

  const handleCloseImagePreview = () => {
    setImagePreview({
      isOpen: false,
      imageUrl: '',
      title: '',
      questionText: ''
    });
  };
  
  // Enhanced debugging for ProgressReport rendering issues
  console.log('[PROGRESS REPORT] Component rendering with data:');
  console.log('  - progressData exists:', !!progressData);
  console.log('  - progressData structure:', progressData ? Object.keys(progressData) : 'null');
  console.log('  - progressData.categories exists:', !!(progressData && progressData.categories));
  console.log('  - progressData.categories type:', progressData && progressData.categories ? typeof progressData.categories : 'undefined');
  console.log('  - progressData.categories is array:', !!(progressData && progressData.categories && Array.isArray(progressData.categories)));
  console.log('  - progressData.categories length:', progressData && progressData.categories ? progressData.categories.length : 0);
  console.log('  - Full progressData:', progressData);

  // Check if we have valid category results data
  const hasCategoryResults = progressData &&
    progressData.categories &&
    Array.isArray(progressData.categories) &&
    progressData.categories.length > 0;

  console.log('[PROGRESS REPORT] Validation results:');
  console.log('  - hasCategoryResults:', hasCategoryResults);
  console.log('  - Will render main content:', hasCategoryResults);

  if (!progressData) {
    console.log('[PROGRESS REPORT] Early return: No progressData');
    return (
      <div className="student-progress-empty-state">
        <FaInfoCircle size={48} />
        <h3>No Progress Data</h3>
        <p>No progress data available for this student. They may not have completed any assessment yet.</p>
      </div>
    );
  }

  // Implement robust conditional rendering with multiple fallbacks
  console.log('[PROGRESS REPORT] Implementing robust conditional rendering...');

  // Try to extract categories from different possible structures
  let categoriesData = null;
  let fallbackData = {};

  if (progressData) {
    // Standard structure: progressData.categories
    if (progressData.categories && Array.isArray(progressData.categories) && progressData.categories.length > 0) {
      categoriesData = progressData.categories;
      console.log('Found categories in standard structure:', categoriesData.length);
    }
    // Alternative structure: progressData.data.categories (API wrapper)
    else if (progressData.data && progressData.data.categories && Array.isArray(progressData.data.categories) && progressData.data.categories.length > 0) {
      categoriesData = progressData.data.categories;
      console.log('Found categories in data wrapper structure:', categoriesData.length);
      // Lift other properties to top level
      fallbackData = { ...progressData.data };
    }
    // Alternative structure: direct array (just in case)
    else if (Array.isArray(progressData) && progressData.length > 0) {
      categoriesData = progressData;
      console.log('Found categories as direct array:', categoriesData.length);
    }
  }

  // If still no categories found, show detailed diagnostic
  if (!categoriesData) {
    console.log('❌ [PROGRESS REPORT] No valid category data found after all attempts');
    return (
      <div className="student-progress-empty-state">
        <FaExclamationTriangle size={48} />
        <h3>Assessment Data Structure Issue</h3>
        <p>Unable to locate category results in the expected data structure.</p>
        <div style={{marginTop: '20px', textAlign: 'left', fontSize: '12px', background: '#f8f9fa', padding: '15px', borderRadius: '5px', fontFamily: 'monospace'}}>
          <strong>Data Structure Analysis:</strong><br/>
          <br/>
          <strong>progressData exists:</strong> {progressData ? 'Yes' : 'No'}<br/>
          <strong>progressData type:</strong> {typeof progressData}<br/>
          <strong>progressData keys:</strong> {progressData ? Object.keys(progressData).join(', ') : 'N/A'}<br/>
          <br/>
          <strong>categories property:</strong> {progressData && progressData.categories ? 'Present' : 'Missing'}<br/>
          <strong>categories type:</strong> {progressData && progressData.categories ? typeof progressData.categories : 'undefined'}<br/>
          <strong>categories is array:</strong> {progressData && progressData.categories && Array.isArray(progressData.categories) ? 'Yes' : 'No'}<br/>
          <strong>categories length:</strong> {progressData && progressData.categories && Array.isArray(progressData.categories) ? progressData.categories.length : 'N/A'}<br/>
          <br/>
          <strong>data.categories exists:</strong> {progressData && progressData.data && progressData.data.categories ? 'Yes' : 'No'}<br/>
          <strong>studentResponses count:</strong> {progressData && progressData.studentResponses ? progressData.studentResponses.length : 'N/A'}<br/>
          <br/>
          <strong>Full progressData structure:</strong><br/>
          <pre style={{fontSize: '10px', maxHeight: '200px', overflow: 'auto', background: 'white', padding: '5px', margin: '5px 0'}}>
            {JSON.stringify(progressData, null, 2)}
          </pre>
        </div>

        <div style={{marginTop: '15px', padding: '10px', background: '#e3f2fd', borderRadius: '5px'}}>
          <strong>💡 Possible Solutions:</strong><br/>
          • Check if the student has completed their assessment<br/>
          • Verify the API is returning category results<br/>
          • Ensure the backend is structured correctly<br/>
          • Contact support if this issue persists
        </div>
      </div>
    );
  }

  // Create normalized progressData structure for rendering
  const normalizedProgressData = {
    ...progressData,
    ...fallbackData,
    categories: categoriesData
  };

  console.log('[PROGRESS REPORT] Successfully normalized data structure');
  console.log('  - Categories count:', categoriesData.length);
  console.log('  - First category:', categoriesData[0]);

  // Update hasCategoryResults based on normalized data
  const hasValidCategoryData = categoriesData && Array.isArray(categoriesData) && categoriesData.length > 0;

  // Calculate progress metrics from normalized category results
  const calculateCompletionRate = () => {
    if (!hasValidCategoryData) return 0;

    // Count passed categories
    const passedCategories = categoriesData.filter(cat => cat.isPassed).length;
    return Math.round((passedCategories / categoriesData.length) * 100);
  };
  
  // Format date for display
  const formatDate = (dateString) => {
    if (!dateString) return "Not available";
    
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });
    } catch (e) {
      return dateString;
    }
  };
  
  // Recalculate metrics using actual student responses data
  const recalculateMetricsFromResponses = () => {
    if (!studentResponses || studentResponses.length === 0) {
      // Fallback to category results if no response data
      return {
        totalQuestions: hasCategoryResults ? 
          progressData.categories.reduce((total, category) => total + (Number(category.totalQuestions) || 0), 0) : 0,
        correctAnswers: hasCategoryResults ? 
          progressData.categories.reduce((total, category) => total + (Number(category.correctAnswers) || 0), 0) : 0
      };
    }

    let totalQuestions = 0;
    let correctAnswers = 0;

    // Group responses by category
    const responsesByCategory = studentResponses.reduce((acc, response) => {
      const category = response.category || 'Unknown';
      if (!acc[category]) acc[category] = [];
      acc[category].push(response);
      return acc;
    }, {});

    // Calculate totals for each category
    Object.entries(responsesByCategory).forEach(([category, responses]) => {
      if (category.toLowerCase().includes('phonological')) {
        // For Phonological Awareness: aggregate matches
        const totalMatches = responses.reduce((sum, resp) => sum + (resp.totalMatches || 0), 0);
        const correctMatches = responses.reduce((sum, resp) => sum + (resp.correctMatches || 0), 0);
        
        totalQuestions += totalMatches;
        correctAnswers += correctMatches;
        
        console.log(`PA Calculation: ${correctMatches}/${totalMatches} matches from ${responses.length} questions`);
      } else {
        // For other categories: count individual responses
        totalQuestions += responses.length;
        correctAnswers += responses.filter(resp => resp.isCorrect).length;
        
        console.log(`${category} Calculation: ${responses.filter(resp => resp.isCorrect).length}/${responses.length} questions`);
      }
    });

    return { totalQuestions, correctAnswers };
  };

  // Calculate completion rate and other metrics using normalized data
  const completionRate = calculateCompletionRate();
  const { totalQuestions, correctAnswers } = recalculateMetricsFromResponses();
  const passedCategories = hasValidCategoryData ?
    categoriesData.filter(cat => cat.isPassed).length : 0;
  const totalCategories = hasValidCategoryData ?
    categoriesData.length : 0;
  const assessmentDate = formatDate(normalizedProgressData.assessmentDate || normalizedProgressData.createdAt);
  const readingLevel = normalizedProgressData.readingLevel || "Not Assessed";

  // Calculate overall score - either use the one from the API or calculate
  const overallScore = normalizedProgressData.overallScore || (hasValidCategoryData ?
    Math.round(categoriesData.reduce((total, category) => total + (Number(category.score) || 0), 0) / totalCategories) : 0);

  // Determine if any categories need attention (below 75% threshold)
  const categoriesNeedingAttention = hasValidCategoryData ?
    categoriesData.filter(cat => (Number(cat.score) || 0) < 75) : [];

  console.log('[PROGRESS REPORT] Calculated metrics:');
  console.log('  - completionRate:', completionRate);
  console.log('  - totalQuestions:', totalQuestions);
  console.log('  - correctAnswers:', correctAnswers);
  console.log('  - passedCategories:', passedCategories);
  console.log('  - totalCategories:', totalCategories);
  console.log('  - overallScore:', overallScore);
  
  // Get status class based on score
  const getStatusClass = (score) => {
    score = Number(score) || 0;
    if (score >= 75) return 'achieved';
    if (score >= 50) return 'developing';
    return 'emerging';
  };

  // Handle view recommendations click
  const handleViewRecommendations = (category) => {
    if (onViewRecommendations) {
      onViewRecommendations(category);
    }
  };
  
  // Format category name for display
  const formatCategoryName = (categoryName) => {
    if (!categoryName) return "Unknown Category";
    
    return categoryName
      .replace(/_/g, ' ')
      .replace(/\b\w/g, l => l.toUpperCase());
  };

  // Get category icon based on category name
  const getCategoryIcon = (category) => {
    // Icon mapping with uniform color
    const iconMap = {
      'alphabet_knowledge': <FaQuestionCircle />,
      'phonological_awareness': <FaVolumeUp />,
      'decoding': <FaBook />,
      'word_recognition': <FaListAlt />,
      'reading_comprehension': <FaFileAlt />
    };
    
    // Try to match category name (case insensitive)
    const categoryLower = category ? category.toLowerCase() : '';
    
    for (const [key, icon] of Object.entries(iconMap)) {
      if (categoryLower.includes(key.toLowerCase().replace('_', ' '))) {
        return icon;
      }
    }
    
    // Default icon
    return <FaBookOpen />;
  };
  
  // Get reading level class for styling
  const getReadingLevelClass = (level) => {
    if (!level || level === 'Not Assessed') return 'reading-level-not-assessed';
    
    switch(level.toLowerCase()) {
      case 'early':
      case 'low emerging':
      case 'high emerging':
        return 'reading-level-early';
      
      case 'developing':
      case 'emergent':
        return 'reading-level-developing';
      
      case 'transitioning':
      case 'at grade level':
      case 'fluent':
        return 'reading-level-fluent';
      
      case 'advanced':
        return 'reading-level-advanced';
      
      default:
        return 'reading-level-not-assessed';
    }
  };

  // Get actual counts for a category from student responses
  const getCategoryActualCounts = (categoryName) => {
    if (!studentResponses || studentResponses.length === 0) {
      // Fallback to category metadata if no responses
      return { correct: 0, total: 0 };
    }

    const categoryResponses = studentResponses.filter(response => 
      response.category && response.category.toLowerCase().includes(categoryName.toLowerCase())
    );

    if (categoryName.toLowerCase().includes('phonological')) {
      // For Phonological Awareness: aggregate matches
      const totalMatches = categoryResponses.reduce((sum, resp) => sum + (resp.totalMatches || 0), 0);
      const correctMatches = categoryResponses.reduce((sum, resp) => sum + (resp.correctMatches || 0), 0);
      return { correct: correctMatches, total: totalMatches };
    } else {
      // For other categories: count individual questions
      const totalQuestions = categoryResponses.length;
      const correctQuestions = categoryResponses.filter(resp => resp.isCorrect).length;
      return { correct: correctQuestions, total: totalQuestions };
    }
  };

  // NEW: Get latest intervention attempt for a category
  const getLatestInterventionAttempt = (category) => {
    if (!category.interventionHistory || category.interventionHistory.length === 0) {
      return null;
    }
    
    // Sort by attempt number and get the latest
    const sortedHistory = [...category.interventionHistory].sort((a, b) => b.attemptNumber - a.attemptNumber);
    return sortedHistory[0];
  };

  // NEW: Determine if category is unlocked based on intervention progression
  const isCategoryUnlocked = (categoryName, categoryIndex) => {
    // First category (Alphabet Knowledge) is always unlocked
    if (categoryIndex === 0) return true;
    
    // Check if all previous categories have passed (either original assessment or latest intervention)
    for (let i = 0; i < categoryIndex; i++) {
      const prevCategory = categoriesData[i];
      const latestAttempt = getLatestInterventionAttempt(prevCategory);
      
      // Check if previous category passed either in original assessment or latest intervention
      const prevCategoryPassed = prevCategory.isPassed || 
        (latestAttempt && latestAttempt.isPassed && latestAttempt.score >= 75);
      
      if (!prevCategoryPassed) {
        return false;
      }
    }
    
    return true;
  };

  // NEW: Get the current display score for a category (latest intervention or original)
  const getCurrentDisplayScore = (category) => {
    const latestAttempt = getLatestInterventionAttempt(category);
    
    // If there's a latest intervention attempt, use that score
    if (latestAttempt) {
      return latestAttempt.score;
    }
    
    // Otherwise, use the original category score
    return Number(category.score) || 0;
  };

  // NEW: Get the current display status for a category
  const getCurrentDisplayStatus = (category) => {
    const latestAttempt = getLatestInterventionAttempt(category);
    
    // If there's a latest intervention attempt, use that status
    if (latestAttempt) {
      return latestAttempt.isPassed ? 'passed' : 'needs_revision';
    }
    
    // Otherwise, use the original category status
    const score = Number(category.score) || 0;
    if (score >= 75) return 'passed';
    if (score > 0) return 'needs_intervention';
    return 'not_attempted';
  };

  // NEW: Get category status based on intervention progression
  const getCategoryProgressionStatus = (category) => {
    const latestAttempt = getLatestInterventionAttempt(category);
    
    // If category originally passed, it's passed
    if (category.isPassed) {
      return {
        status: 'passed',
        score: category.score,
        source: 'original_assessment',
        message: 'Category passed in original assessment'
      };
    }
    
    // If no intervention attempts yet, show as needs intervention
    if (!latestAttempt) {
      return {
        status: 'needs_intervention',
        score: category.score,
        source: 'original_assessment',
        message: 'Needs intervention - original score below threshold'
      };
    }
    
    // Check latest intervention attempt
    if (latestAttempt.isPassed && latestAttempt.score >= 75) {
      return {
        status: 'passed',
        score: latestAttempt.score,
        source: 'intervention',
        attemptNumber: latestAttempt.attemptNumber,
        message: `Passed on intervention attempt ${latestAttempt.attemptNumber}`
      };
    } else {
      return {
        status: 'needs_revision',
        score: latestAttempt.score,
        source: 'intervention',
        attemptNumber: latestAttempt.attemptNumber,
        message: `Failed on intervention attempt ${latestAttempt.attemptNumber} - needs revision`
      };
    }
  };

  // Get detailed questions for a category
  const getCategoryQuestions = (categoryName) => {
    console.log('getCategoryQuestions called for:', categoryName);
    console.log('studentResponses available:', !!studentResponses, studentResponses?.length);
    console.log('assessmentQuestions available:', !!assessmentQuestions, assessmentQuestions?.length);
    
    if (!studentResponses || !assessmentQuestions) {
      console.log('❌ Missing data - studentResponses or assessmentQuestions not available');
      return [];
    }
    
    // Filter student responses for this category
    const categoryResponses = studentResponses.filter(response => 
      response.category && response.category.toLowerCase().includes(categoryName.toLowerCase())
    );
    
    console.log('📝 Found category responses:', categoryResponses.length, categoryResponses);
    
    // Map responses to questions with details
    const questionsWithDetails = categoryResponses.map(response => {
      // Find the assessment question details
      const assessmentQuestion = findAssessmentQuestion(response.questionId, categoryName);
      
      console.log('Question details for', response.questionId, ':', assessmentQuestion);
      
      return {
        ...response,
        questionDetails: assessmentQuestion,
        questionText: assessmentQuestion?.questionText || 'Question text not available',
        questionImage: assessmentQuestion?.questionImage,
        correctAnswer: getCorrectAnswer(assessmentQuestion, response.category),
        studentAnswer: formatStudentResponse(response, assessmentQuestion)
      };
    }).sort((a, b) => {
      // Sort by question ID for consistent ordering
      const aId = a.questionId || '';
      const bId = b.questionId || '';
      return aId.localeCompare(bId);
    });
    
    console.log('Final questions with details:', questionsWithDetails);
    return questionsWithDetails;
  };

  // Find assessment question by ID and category
  const findAssessmentQuestion = (questionId, categoryName) => {
    if (!assessmentQuestions || !questionId) return null;
    
    for (const assessment of assessmentQuestions) {
      if (assessment.questions && Array.isArray(assessment.questions)) {
        const question = assessment.questions.find(q => q.questionId === questionId);
        if (question) {
          return question;
        }
      }
    }
    return null;
  };

  // Get correct answer based on question type
  const getCorrectAnswer = (questionDetails, category) => {
    if (!questionDetails) return 'Not available';
    
    const categoryLower = category?.toLowerCase() || '';
    
    if (categoryLower.includes('alphabet')) {
      // Multiple choice - find correct option
      if (questionDetails.choiceOptions) {
        const correctOption = questionDetails.choiceOptions.find(opt => opt.isCorrect);
        return correctOption ? correctOption.optionText : 'Correct option';
      }
    } else if (categoryLower.includes('phonological')) {
      // Matching - show correct pairs
      if (questionDetails.questionSet && questionDetails.questionSet[0] && questionDetails.questionSet[0].correctPairs) {
        return `${questionDetails.questionSet[0].correctPairs.length} correct pairs`;
      }
    } else if (categoryLower.includes('decoding')) {
      // Drag and drop - show correct sequence
      if (questionDetails.correctSequence && Array.isArray(questionDetails.correctSequence)) {
        return questionDetails.correctSequence.join('');
      }
    } else if (categoryLower.includes('word')) {
      // Fill blank - show correct answer
      if (questionDetails.correctAnswer && Array.isArray(questionDetails.correctAnswer)) {
        return questionDetails.correctAnswer.join(', ');
      }
    } else if (categoryLower.includes('comprehension')) {
      // Text input - show correct answer
      return questionDetails.correctAnswer || 'Expected answer';
    }
    
    return 'Answer format not recognized';
  };

  // Format student response for display
  const formatStudentResponse = (response, questionDetails) => {
    if (!response.response) return 'No response';
    
    const categoryLower = response.category?.toLowerCase() || '';
    
    if (categoryLower.includes('alphabet')) {
      // Multiple choice - show selected option
      if (Array.isArray(response.response) && response.response[0]) {
        const optionId = response.response[0];
        if (questionDetails && questionDetails.choiceOptions) {
          const selectedOption = questionDetails.choiceOptions.find(opt => opt.optionId === optionId);
          return selectedOption ? selectedOption.optionText : `Option ${optionId}`;
        }
        return `Option ${optionId}`;
      }
    } else if (categoryLower.includes('phonological')) {
      // Matching - show detailed matching pairs
      if (Array.isArray(response.response) && response.response.length > 0) {
        return response.response;
      }
      // Fallback to match count
      if (response.correctMatches !== undefined && response.totalMatches !== undefined) {
        return `${response.correctMatches}/${response.totalMatches} correct matches`;
      }
    } else if (categoryLower.includes('decoding')) {
      // Drag and drop - show sequence
      if (Array.isArray(response.response)) {
        return response.response.join('');
      }
    } else if (categoryLower.includes('word')) {
      // Fill blank - show selected options
      if (Array.isArray(response.response)) {
        return response.response.join(', ');
      }
    } else if (categoryLower.includes('comprehension')) {
      // Text input - show response
      if (Array.isArray(response.response)) {
        return response.response.join(', ');
      }
    }
    
    return Array.isArray(response.response) ? response.response.join(', ') : String(response.response);
  };

  // Format time for display
  const formatTime = (seconds) => {
    if (!seconds || seconds < 0 || !Number.isFinite(seconds)) return 'Not recorded';
    const sanitizedSeconds = Math.max(0, Math.round(seconds));
    const minutes = Math.floor(sanitizedSeconds / 60);
    const remainingSeconds = sanitizedSeconds % 60;
    return `${minutes}m ${remainingSeconds}s`;
  };

  // Get answer status badge
  const getAnswerStatusBadge = (isCorrect) => {
    if (isCorrect) {
      return (
        <span className="student-progress-status-badge student-progress-status-badge--correct">
          <FaCheckCircle /> Correct
        </span>
      );
    } else {
      return (
        <span className="student-progress-status-badge student-progress-status-badge--incorrect">
          <FaTimesCircle /> Incorrect
        </span>
      );
    }
  };

  // Debug function to check data - keep for database troubleshooting
  const debugData = () => {
    console.log('Debug Progress Report Data:');
    console.log('progressData:', progressData);
    console.log('studentResponses:', studentResponses);
    console.log('assessmentQuestions:', assessmentQuestions);
    console.log('expandedCategories:', expandedCategories);
  };

  // PDF Generation function - integrated with PdfReportService
  const generatePdfReport = async () => {
    try {
      setPdfGeneration({ isGenerating: true, progress: 0, error: null });
      
      // Prepare student data for PDF generation
      const studentData = {
        studentId: progressData?.studentId || 'N/A',
        fullName: progressData?.studentName || `Student ${progressData?.studentId}`,
        gradeLevel: progressData?.gradeLevel || 'Not specified',
        readingLevel: progressData?.readingLevel || 'Unknown',
        assessmentDate: progressData?.assessmentDate ? 
          new Date(progressData.assessmentDate).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
          }) : 'Not specified'
      };

      // Progress callback function
      const onProgress = (step, progress) => {
        console.log(`${progress}% - ${step}`);
        setPdfGeneration(prev => ({ ...prev, progress }));
      };

      // Generate PDF using the service
      const pdfBlob = await PdfReportService.generateProgressReport(
        studentData,
        progressData,
        studentResponses,
        assessmentQuestions,
        onProgress
      );

      // Create download link and trigger download
      const url = window.URL.createObjectURL(pdfBlob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `Progress_Report_${studentData.studentId}_${new Date().toISOString().split('T')[0]}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);

      console.log('📄 PDF Report Generated and Downloaded Successfully!');
      setPdfGeneration({ isGenerating: false, progress: 0, error: null });
      
    } catch (error) {
      console.error('Error generating PDF:', error);
      setPdfGeneration({
        isGenerating: false,
        progress: 0,
        error: error.message || 'Failed to generate PDF report. Please try again.'
      });
    }
  };
  
  return (
    <div className="student-progress-container">
      {/* Progress info section */}
      <div className="student-progress-info">
        <FaInfoCircle className="student-progress-info-icon" />
        <div className="student-progress-info-text">
          <h3>Post Assessment Progress Report</h3>
          <p>
            This report shows the student's progress based on their assessment
            completed on <strong>{assessmentDate}</strong>. Current reading level: <strong>{readingLevel}</strong>.
            You can view their performance across the key reading skill categories.
          </p>
        </div>
      </div>
      
      {/* Assessment Summary Cards */}
      <div className="student-progress-summary-cards">
        <div className={`student-progress-summary-card ${animated ? 'animate' : ''}`} style={{animationDelay: '0s'}}>
          <div className="student-progress-card-header">
            <div className="student-progress-card-icon">
              <FaCheckCircle />
            </div>
            <div className="student-progress-card-value">
              <span className="student-progress-counter" data-target={completionRate}>{animated ? completionRate : '0'}</span>%
            </div>
          </div>
          <div className="student-progress-card-label">Categories Passed ({passedCategories}/{totalCategories})</div>
        </div>
        
        <div className={`student-progress-summary-card ${animated ? 'animate' : ''}`} style={{animationDelay: '0.1s'}}>
          <div className="student-progress-card-header">
            <div className="student-progress-card-icon">
              <FaChartLine />
            </div>
            <div className="student-progress-card-value">
              <span className="student-progress-counter" data-target={overallScore}>{animated ? overallScore : '0'}</span>%
            </div>
          </div>
          <div className="student-progress-card-label">Average Score</div>
        </div>
        
        <div className={`student-progress-summary-card ${animated ? 'animate' : ''}`} style={{animationDelay: '0.2s'}}>
          <div className="student-progress-card-header">
            <div className="student-progress-card-icon">
              <FaBookOpen />
            </div>
            <div className="student-progress-card-value">
              <span className="student-progress-counter" data-target={correctAnswers}>{animated ? correctAnswers : '0'}</span>/{totalQuestions}
            </div>
          </div>
          <div className="student-progress-card-label">Correct Answers</div>
        </div>
        
        <div className={`student-progress-summary-card ${animated ? 'animate' : ''}`} style={{animationDelay: '0.3s'}}>
          <div className="student-progress-card-header">
            <div className="student-progress-card-icon">
              <FaCalendarAlt />
            </div>
            <div className="student-progress-card-value">
              <div className={`student-progress-reading-level ${getReadingLevelClass(readingLevel)}`}>
                {readingLevel}
              </div>
            </div>
          </div>
          <div className="student-progress-card-label">Reading Level</div>
        </div>
      </div>

      {/* Combined Category Progress & Performance Section */}
      {console.log('[PROGRESS REPORT] About to render main content section, hasValidCategoryData:', hasValidCategoryData)}
      {hasValidCategoryData && (
        <div className="student-progress-category-section">
          <div className="student-progress-section-header">
            <h3 className="student-progress-section-title">
              <FaChartLine className="student-progress-section-icon" /> 
              Reading Skills Assessment
            </h3>
            <div className="student-progress-section-actions">
              <button
                className="student-progress-pdf-button"
                onClick={generatePdfReport}
                disabled={pdfGeneration.isGenerating}
                title={pdfGeneration.isGenerating ? `Generating PDF... ${pdfGeneration.progress}%` : "Download comprehensive PDF report"}
              >
                <FaFilePdf />
                <FaDownload className="student-progress-pdf-icon" />
                {pdfGeneration.isGenerating ? `Generating... ${pdfGeneration.progress}%` : 'Download PDF Report'}
              </button>
            </div>
          </div>
          
          <div className="student-progress-info" style={{ marginBottom: '1.5rem' }}>
            <FaInfoCircle className="student-progress-info-icon" />
            <div className="student-progress-info-text">
              <h3>Category Performance</h3>
              <p>
                Each category contains sets of questions. Students need to score at least 75% to pass each category.
                Categories below the threshold need targeted interventions to improve skills.
              </p>
            </div>
          </div>
          
          {/* Overall Progress Bar */}
          <div className="student-progress-completion-bar">
            <div className="student-progress-completion-bar-label">
              <span>Overall Progress:</span>
              <span className="student-progress-completion-count">{correctAnswers}/{totalQuestions} questions correct ({Math.round((correctAnswers / totalQuestions) * 100)}%)</span>
            </div>
            <div className="student-progress-completion-bar-container">
              <div 
                className="student-progress-completion-bar-fill" 
                style={{width: `${Math.min(100, Math.round((correctAnswers / totalQuestions) * 100))}%`}}
              ></div>
            </div>
          </div>
          
          {/* Category Access Loading Indicator */}
          {categoryAccessLoading && (
            <div className="student-progress-loading-state" style={{ textAlign: 'center', padding: '10px 0', color: '#6c757d' }}>
              <FaSpinner style={{ animation: 'spin 1s linear infinite', marginRight: '8px' }} />
              Validating category access permissions...
            </div>
          )}

          {/* Enhanced Category Cards - Individual Row Layout with Dynamic Intervention Progression */}
          <div className="student-progress-categories-list">
            {console.log('[PROGRESS REPORT] About to render categories list, categoriesData:', categoriesData)}
            {categoriesData.map((category, index) => {
              const categoryName = category.categoryName || `Category ${index + 1}`;
              const displayName = typeof categoryName === 'string' ?
                formatCategoryName(categoryName) : 
                `Category ${index + 1}`;
              
              // Get actual counts from student responses data
              const actualCounts = getCategoryActualCounts(categoryName);
              const correctCount = actualCounts.correct || Number(category.correctAnswers) || 0;
              const totalCount = actualCounts.total || Number(category.totalQuestions) || 0;
              
              // NEW: Get current display score (latest intervention or original)
              const score = getCurrentDisplayScore(category);
              
              // NEW: Get dynamic progression status based on intervention history
              const progressionStatus = getCategoryProgressionStatus(category);
              const isUnlocked = isCategoryUnlocked(categoryName, index);
              const latestAttempt = getLatestInterventionAttempt(category);

              console.log(`[DYNAMIC PROGRESSION] Analyzing ${categoryName}:`);
              console.log(`  - Progression Status:`, progressionStatus);
              console.log(`  - Is Unlocked:`, isUnlocked);
              console.log(`  - Latest Attempt:`, latestAttempt);

              // Determine category status for display based on dynamic progression
              let categoryStatus = '';
              let statusMessage = '';
              let displayScore = score; // Use the current display score (latest intervention or original)
              let isPassed = progressionStatus.status === 'passed';

              if (!isUnlocked) {
                categoryStatus = 'blocked';
                statusMessage = 'Prerequisites not met - previous categories need to pass';
              } else if (progressionStatus.status === 'passed') {
                categoryStatus = 'passed';
                statusMessage = progressionStatus.message;
              } else if (progressionStatus.status === 'needs_revision') {
                categoryStatus = 'needs_revision';
                statusMessage = progressionStatus.message;
              } else if (progressionStatus.status === 'needs_intervention') {
                categoryStatus = 'needs_intervention';
                statusMessage = progressionStatus.message;
              } else {
                categoryStatus = 'not_attempted';
                statusMessage = 'Not attempted yet';
              }

              console.log(`  - Final Status: ${categoryStatus} - ${statusMessage}`);

              // Get questions for this category
              const categoryQuestions = getCategoryQuestions(categoryName);
              const isExpanded = expandedCategories[categoryName];
              
              return (
                <div key={index} className={`student-progress-category-item ${
                  categoryStatus === 'passed' ? 'student-progress-category-passed' :
                  categoryStatus === 'blocked' ? 'student-progress-category-blocked' :
                  categoryStatus === 'needs_revision' ? 'student-progress-category-needs-revision' :
                  'student-progress-category-needs-attention'
                }`}>
                  {/* Category Main Row */}
                  <div className="student-progress-category-main">
                    <div className="student-progress-category-left">
                      <div className="student-progress-category-icon">
                        {getCategoryIcon(categoryName)}
                      </div>
                      <div className="student-progress-category-info">
                        <h3 className="student-progress-category-name">
                          {displayName}
                          {categoryStatus === 'blocked' && (
                            <span className="student-progress-needs-attention-badge" style={{ backgroundColor: '#dc3545', color: 'white' }}>
                              BLOCKED
                            </span>
                          )}
                          {categoryStatus === 'not_attempted' && (
                            <span className="student-progress-needs-attention-badge" style={{ backgroundColor: '#6c757d', color: 'white' }}>
                              NOT ATTEMPTED
                            </span>
                          )}
                          {categoryStatus === 'needs_intervention' && (
                            <span className="student-progress-needs-attention-badge" style={{ backgroundColor: '#ffc107', color: '#000' }}>
                              NEEDS INTERVENTION
                            </span>
                          )}
                          {categoryStatus === 'needs_revision' && (
                            <span className="student-progress-needs-attention-badge" style={{ backgroundColor: '#fd7e14', color: 'white' }}>
                              NEEDS REVISION
                            </span>
                          )}
                          {categoryStatus === 'passed' && (
                            <span className="student-progress-needs-attention-badge" style={{ backgroundColor: '#28a745', color: 'white' }}>
                              PASSED
                            </span>
                          )}
                        </h3>
                        <div className="student-progress-category-stats">
                          {categoryStatus === 'blocked' ? (
                            <>
                              <span className="student-progress-score-display" style={{ color: '#dc3545' }}>Blocked</span>
                              <span className="student-progress-score-fraction" style={{ color: '#dc3545' }}>
                                {statusMessage}
                              </span>
                            </>
                          ) : categoryStatus === 'not_attempted' ? (
                            <>
                              <span className="student-progress-score-display" style={{ color: '#6c757d' }}>Not Attempted</span>
                              <span className="student-progress-score-fraction" style={{ color: '#6c757d' }}>
                                {statusMessage}
                              </span>
                            </>
                          ) : (
                            <>
                              <span className="student-progress-score-display">{displayScore}%</span>
                              <span className="student-progress-score-fraction">
                                {progressionStatus.source === 'intervention' ? 
                                  `Intervention Attempt ${progressionStatus.attemptNumber}` : 
                                  `${correctCount}/${totalCount} correct`
                                }
                              </span>
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                    
                    <div className="student-progress-category-right">
                      <button
                        className="student-progress-expand-toggle"
                        onClick={() => (categoryStatus !== 'not_attempted' && categoryStatus !== 'blocked') && toggleCategoryExpansion(categoryName)}
                        disabled={categoryStatus === 'not_attempted' || categoryStatus === 'blocked'}
                        style={{
                          opacity: (categoryStatus === 'not_attempted' || categoryStatus === 'blocked') ? 0.5 : 1,
                          cursor: (categoryStatus === 'not_attempted' || categoryStatus === 'blocked') ? 'not-allowed' : 'pointer'
                        }}
                        aria-label={
                          categoryStatus === 'blocked' ? 'Category is blocked - prerequisites not met' :
                          categoryStatus === 'not_attempted' ? 'No assessment data available to expand' :
                          (isExpanded ? 'Collapse details' : 'Expand details')
                        }
                      >
                        {categoryStatus === 'not_attempted' ? <FaInfoCircle /> : (isExpanded ? <FaCompressArrowsAlt /> : <FaExpandArrowsAlt />)}
                      </button>
                    </div>
                  </div>
                  
                  {/* Progress Dots */}
                  <div className="student-progress-dots-container">
                    {Array.from({ length: totalCount }).map((_, qIndex) => (
                      <div 
                        key={qIndex} 
                        className={`student-progress-dot ${qIndex < correctCount ? 'student-progress-dot-correct' : 'student-progress-dot-empty'}`}
                        title={qIndex < correctCount ? 'Correct' : 'Incorrect/Not Answered'}
                      />
                    ))}
                  </div>
                  
                  {/* Status Message with Dynamic Intervention Progression */}
                  <div className="student-progress-status-summary">
                    {categoryStatus === 'not_attempted' ? (
                      <div className="student-progress-need-more-message" style={{ color: '#6c757d' }}>
                        <FaInfoCircle /> {statusMessage}
                      </div>
                    ) : categoryStatus === 'blocked' ? (
                      <div className="student-progress-need-more-message" style={{ color: '#dc3545' }}>
                        <FaTimesCircle /> {statusMessage}
                      </div>
                    ) : categoryStatus === 'passed' ? (
                      <div className="student-progress-success-message">
                        <FaCheckCircle /> {statusMessage} - Score: {displayScore}%
                        {progressionStatus.source === 'intervention' && (
                          <div className="intervention-success-details" style={{ fontSize: '0.8em', marginTop: '4px', opacity: 0.8 }}>
                            Intervention Success! Student improved from {category.score}% to {displayScore}%
                          </div>
                        )}
                      </div>
                    ) : categoryStatus === 'needs_revision' ? (
                      <div className="student-progress-need-more-message" style={{ color: '#fd7e14' }}>
                        <FaEdit /> {statusMessage} - Score: {displayScore}%
                        {latestAttempt && (
                          <div className="intervention-revision-details" style={{ fontSize: '0.8em', marginTop: '4px', opacity: 0.8 }}>
                            📝 Teacher can revise intervention for attempt {latestAttempt.attemptNumber + 1}
                          </div>
                        )}
                      </div>
                    ) : categoryStatus === 'needs_intervention' ? (
                      <div className="student-progress-need-more-message" style={{ color: '#ffc107' }}>
                        <FaExclamationTriangle /> {statusMessage} - Score: {displayScore}%
                        <div className="intervention-needed-details" style={{ fontSize: '0.8em', marginTop: '4px', opacity: 0.8 }}>
                          Teacher can create intervention activity
                        </div>
                      </div>
                    ) : (
                      <div className="student-progress-need-more-message">
                        <FaExclamationTriangle /> Needs Intervention - Score: {displayScore}% (Need {Math.ceil(totalCount * 0.75) - correctCount} more to pass)
                      </div>
                    )}
                  </div>

                  {/* Expandable Question Details */}
                  {isExpanded && categoryStatus !== 'not_attempted' && (
                    <div className="student-progress-question-details-section">
                      <h4 className="student-progress-question-details-title">
                        <FaClipboardList /> Question Details
                      </h4>
                      {loadingDetails ? (
                        <div className="student-progress-loading-state">
                          <div className="student-progress-spinner"></div>
                          <span>Loading question details...</span>
                        </div>
                      ) : categoryQuestions.length > 0 ? (
                        <div className="student-progress-questions-grid">
                          {categoryQuestions.map((question, qIndex) => {
                            const isPhonological = categoryName.toLowerCase().includes('phonological');
                            
                            return (
                              <div key={question.questionId || qIndex} className="student-progress-question-card">
                                <div className="student-progress-question-header">
                                  <div className="student-progress-question-number">
                                    Question {qIndex + 1}
                                  </div>
                                  <div className="student-progress-question-id">
                                    ID: {question.questionId}
                                  </div>
                                  {getAnswerStatusBadge(question.isCorrect)}
                                </div>

                                <div className="student-progress-question-body">
                                  <div className="student-progress-question-text">
                                    <strong>Question:</strong> {question.questionText}
                                  </div>

                                  {/* Special handling for different question types */}
                                  {isPhonological && (
                                    <div className="student-progress-phonological-details">
                                      <div className="student-progress-audio-instruction">
                                        <FaVolumeUp className="student-progress-audio-icon" />
                                        <span className="student-progress-audio-text">
                                          Audio Text: Pakinggan ang audio. Itugma ito sa katumbas na letra sa kabilang hanay.
                                        </span>
                                      </div>
                                      
                                      {question.questionDetails && question.questionDetails.questionSet && question.questionDetails.questionSet[0] && (
                                        <div className="student-progress-matching-pairs">
                                          <div className="student-progress-matching-section">
                                            <h5>Audio Elements:</h5>
                                            <div className="student-progress-audio-elements">
                                              {question.questionDetails.questionSet[0].audioTexts?.map((audio, idx) => (
                                                <span key={idx} className="student-progress-audio-element">
                                                  <FaVolumeUp /> {audio}
                                                </span>
                                              ))}
                                            </div>
                                          </div>
                                          
                                          <div className="student-progress-matching-section">
                                            <h5>Matching Options:</h5>
                                            <div className="student-progress-matching-options">
                                              {question.questionDetails.questionSet[0].matchingOptions?.map((option, idx) => (
                                                <span key={idx} className="student-progress-matching-option">
                                                  {option}
                                                </span>
                                              ))}
                                            </div>
                                          </div>
                                        </div>
                                      )}

                                      {/* Student's matching response */}
                                      {Array.isArray(question.response) && (
                                        <div className="student-progress-matching-response">
                                          <h5>Student's Matches:</h5>
                                          <div className="student-progress-match-pairs">
                                            {question.response.map((pair, idx) => {
                                              const pairKey = Object.keys(pair)[0];
                                              const pairValue = pair[pairKey];
                                              const isCorrect = question.questionDetails?.questionSet?.[0]?.correctPairs?.some(
                                                correctPair => correctPair[pairKey] === pairValue
                                              );
                                              
                                              return (
                                                <div key={idx} className={`student-progress-match-pair ${isCorrect ? 'correct' : 'incorrect'}`}>
                                                  <span className="student-progress-match-audio">{pairKey}</span>
                                                  <FaArrowRight className="student-progress-match-arrow" />
                                                  <span className="student-progress-match-letter">{pairValue}</span>
                                                  {isCorrect ? (
                                                    <FaCheck className="student-progress-match-check correct" />
                                                  ) : (
                                                    <FaTimesCircle className="student-progress-match-check incorrect" />
                                                  )}
                                                </div>
                                              );
                                            })}
                                          </div>
                                          
                                          <div className="student-progress-match-summary">
                                            <span className="student-progress-match-score">
                                              {question.correctMatches || 0}/{question.totalMatches || 0} correct matches
                                            </span>
                                          </div>
                                        </div>
                                      )}
                                    </div>
                                  )}

                                  {/* Special handling for Word Recognition */}
                                  {categoryName.toLowerCase().includes('word') && (
                                    <div className="student-progress-word-recognition-details">
                                      <div className="student-progress-word-instruction">
                                        <FaBook className="student-progress-word-icon" />
                                        <span className="student-progress-word-text">
                                          Fill in the blanks to complete the word
                                        </span>
                                      </div>
                                      
                                      {question.questionDetails && (
                                        <div className="student-progress-word-display">
                                          <div className="student-progress-word-section">
                                            <h5>Word to Complete:</h5>
                                            <div className="student-progress-display-word">
                                              {question.questionDetails.displayWord || 'Word display not available'}
                                            </div>
                                          </div>
                                          
                                          <div className="student-progress-word-section">
                                            <h5>Available Options:</h5>
                                            <div className="student-progress-word-options">
                                              {question.questionDetails.blankOptions?.map((option, idx) => (
                                                <span key={idx} className="student-progress-word-option">
                                                  {option}
                                                </span>
                                              ))}
                                            </div>
                                          </div>
                                          
                                          <div className="student-progress-word-answer">
                                            <div className="student-progress-word-section">
                                              <h5>Student's Answer:</h5>
                                              <div className="student-progress-word-response">
                                                {Array.isArray(question.response) ? 
                                                  question.response.map((part, idx) => (
                                                    <span key={idx} className={`student-progress-word-part ${question.isCorrect ? 'correct' : 'incorrect'}`}>
                                                      {part}
                                                    </span>
                                                  )) : 
                                                  <span className={`student-progress-word-part ${question.isCorrect ? 'correct' : 'incorrect'}`}>
                                                    {question.response || 'No response'}
                                                  </span>
                                                }
                                              </div>
                                            </div>
                                            
                                            <div className="student-progress-word-section">
                                              <h5>Correct Answer:</h5>
                                              <div className="student-progress-word-correct">
                                                {question.questionDetails.correctAnswer?.map((part, idx) => (
                                                  <span key={idx} className="student-progress-word-part correct">
                                                    {part}
                                                  </span>
                                                ))}
                                              </div>
                                            </div>
                                          </div>
                                        </div>
                                      )}
                                    </div>
                                  )}

                                  {/* Special handling for Decoding */}
                                  {categoryName.toLowerCase().includes('decoding') && (
                                    <div className="student-progress-decoding-details">
                                      <div className="student-progress-decoding-instruction">
                                        <FaListAlt className="student-progress-decoding-icon" />
                                        <span className="student-progress-decoding-text">
                                          Arrange the letters in the correct sequence
                                        </span>
                                      </div>
                                      
                                      {question.questionDetails && (
                                        <div className="student-progress-decoding-display">
                                          <div className="student-progress-decoding-section">
                                            <h5>Available Letters:</h5>
                                            <div className="student-progress-decoding-elements">
                                              {question.questionDetails.dragElements?.map((element, idx) => (
                                                <span key={idx} className="student-progress-decoding-element">
                                                  {element}
                                                </span>
                                              ))}
                                            </div>
                                          </div>
                                          
                                          <div className="student-progress-decoding-answer">
                                            <div className="student-progress-decoding-section">
                                              <h5>Student's Sequence:</h5>
                                              <div className="student-progress-decoding-response">
                                                {Array.isArray(question.response) ? 
                                                  question.response.map((letter, idx) => (
                                                    <span key={idx} className={`student-progress-decoding-letter ${question.isCorrect ? 'correct' : 'incorrect'}`}>
                                                      {letter}
                                                    </span>
                                                  )) : 
                                                  <span className={`student-progress-decoding-letter ${question.isCorrect ? 'correct' : 'incorrect'}`}>
                                                    {question.response || 'No response'}
                                                  </span>
                                                }
                                              </div>
                                            </div>
                                            
                                            <div className="student-progress-decoding-section">
                                              <h5>Correct Sequence:</h5>
                                              <div className="student-progress-decoding-correct">
                                                {question.questionDetails.correctSequence?.map((letter, idx) => (
                                                  <span key={idx} className="student-progress-decoding-letter correct">
                                                    {letter}
                                                  </span>
                                                ))}
                                              </div>
                                            </div>
                                          </div>
                                        </div>
                                      )}
                                    </div>
                                  )}

                                  {/* Special handling for Reading Comprehension */}
                                  {categoryName.toLowerCase().includes('comprehension') && (
                                    <div className="student-progress-comprehension-details">
                                      <div className="student-progress-comprehension-instruction">
                                        <FaFileAlt className="student-progress-comprehension-icon" />
                                        <span className="student-progress-comprehension-text">
                                          Read the story and answer the question
                                        </span>
                                      </div>
                                      
                                      {question.questionDetails && (
                                        <div className="student-progress-comprehension-display">
                                          {question.questionDetails.storyTitle && (
                                            <div className="student-progress-story-title">
                                              <h5>Story: {question.questionDetails.storyTitle}</h5>
                                            </div>
                                          )}
                                          
                                          <div className="student-progress-comprehension-answer">
                                            {/* All-or-Nothing Scoring Display */}
                                            {question.allOrNothingScoring && question.sentenceQAPairs && question.sentenceQAPairs.length > 0 ? (
                                              <div className="student-progress-rc-all-or-nothing">
                                                <div className="student-progress-rc-scoring-header">
                                                  <h5>Question Status:</h5>
                                                  <div className={`student-progress-rc-overall-result ${question.allSentenceQuestionsCorrect ? 'passed' : 'failed'}`}>
                                                    {question.allSentenceQuestionsCorrect ? 'PASSED' : 'FAILED'}
                                                    ({question.sentenceQAPairs.filter(pair => pair.isCorrect).length}/{question.sentenceQAPairs.length} questions correct)
                                                  </div>
                                                </div>

                                                <div className="student-progress-rc-explanation">
                                                  <small>All questions must be correct to pass</small>
                                                </div>

                                                <div className="student-progress-rc-question-pairs">
                                                  {question.sentenceQAPairs.map(pair => (
                                                    <div key={pair.questionNumber} className={`student-progress-rc-qa-pair ${pair.isCorrect ? 'correct' : 'incorrect'}`}>
                                                      <div className="student-progress-rc-question">
                                                        <div className="student-progress-rc-question-header">
                                                          <span className="student-progress-rc-question-num">Q{pair.questionNumber}:</span>
                                                          <span className={`student-progress-rc-status ${pair.isCorrect ? 'correct' : 'incorrect'}`}>
                                                            {pair.isCorrect ? '✓' : '✗'}
                                                          </span>
                                                        </div>
                                                        <div className="student-progress-rc-question-text">{pair.questionText}</div>
                                                      </div>

                                                      <div className="student-progress-rc-answers">
                                                        <div className="student-progress-rc-student-answer">
                                                          <strong>Student Answer:</strong> "{pair.studentAnswer}"
                                                        </div>
                                                        <div className="student-progress-rc-correct-answer">
                                                          <strong>Expected Answer:</strong> "{pair.correctAnswer}"
                                                          {pair.acceptableAnswers && pair.acceptableAnswers.length > 0 && (
                                                            <div className="student-progress-rc-acceptable">
                                                              <small>Also accepts: {pair.acceptableAnswers.join(', ')}</small>
                                                            </div>
                                                          )}
                                                        </div>
                                                      </div>
                                                    </div>
                                                  ))}
                                                </div>
                                              </div>
                                            ) : (
                                              /* Fallback to original structure for older data */
                                              <>
                                                <div className="student-progress-comprehension-section">
                                                  <h5>Student's Answer:</h5>
                                                  <div className={`student-progress-comprehension-response ${question.isCorrect ? 'correct' : 'incorrect'}`}>
                                                    {Array.isArray(question.response) ? question.response.join(', ') : question.response || 'No response'}
                                                  </div>
                                                </div>

                                                <div className="student-progress-comprehension-section">
                                                  <h5>Expected Answer:</h5>
                                                  <div className="student-progress-comprehension-correct">
                                                    {question.questionDetails.correctAnswer}
                                                  </div>

                                                  {question.questionDetails.acceptableAnswers && question.questionDetails.acceptableAnswers.length > 1 && (
                                                    <div className="student-progress-acceptable-answers">
                                                      <small>Acceptable answers: {question.questionDetails.acceptableAnswers.join(', ')}</small>
                                                    </div>
                                                  )}
                                                </div>
                                              </>
                                            )}
                                          </div>
                                        </div>
                                      )}
                                    </div>
                                  )}

                                  {question.questionImage && (
                                    <div className="student-progress-question-media">
                                      <button
                                        className="student-progress-image-preview-btn"
                                        onClick={() => handleImageClick(
                                          question.questionImage,
                                          `Question ${qIndex + 1} Image`,
                                          question.questionText
                                        )}
                                        title="Click to view image"
                                      >
                                        <FaEye /> View Image
                                      </button>
                                    </div>
                                  )}

                                  {/* Standard answer comparison for simple question types only (Alphabet Knowledge) */}
                                  {!isPhonological && 
                                   !categoryName.toLowerCase().includes('word') && 
                                   !categoryName.toLowerCase().includes('decoding') && 
                                   !categoryName.toLowerCase().includes('comprehension') && (
                                    <div className="student-progress-answer-comparison">
                                      <div className="student-progress-answer-row">
                                        <span className="student-progress-answer-label">Student Answer:</span>
                                        <span className={`student-progress-answer-value ${question.isCorrect ? 'student-progress-answer-correct' : 'student-progress-answer-incorrect'}`}>
                                          {question.studentAnswer}
                                        </span>
                                      </div>
                                      <div className="student-progress-answer-row">
                                        <span className="student-progress-answer-label">Correct Answer:</span>
                                        <span className="student-progress-answer-value student-progress-answer-correct">
                                          {question.correctAnswer}
                                        </span>
                                      </div>
                                    </div>
                                  )}

                                  {/* Response time for all questions */}
                                  <div className="student-progress-answer-row">
                                    <span className="student-progress-answer-label">Response Time:</span>
                                    <span className="student-progress-answer-value">
                                      <FaClock /> {formatTime(question.responseTime)}
                                    </span>
                                  </div>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      ) : (
                        <div className="student-progress-no-questions">
                          <FaInfoCircle />
                          <span>No detailed question data available for this category.</span>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Process Note */}
      <div className="student-progress-process-note">
        <FaLightbulb className="student-progress-process-note-icon" />
        <div className="student-progress-process-note-text">
          <p>
            <strong>Next Steps:</strong> Based on these results, you can create personalized intervention plans in the Prescriptive Analysis tab to address specific areas where the student needs additional support.
          </p>
        </div>
      </div>

      {/* Image Preview Modal */}
      <ImagePreviewModal
        isOpen={imagePreview.isOpen}
        onClose={handleCloseImagePreview}
        imageUrl={imagePreview.imageUrl}
        title={imagePreview.title}
        questionText={imagePreview.questionText}
      />
    </div>
  );
};

export default ProgressReport;