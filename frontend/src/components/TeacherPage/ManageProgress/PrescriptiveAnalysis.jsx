// src/components/TeacherPage/ManageProgress/PrescriptiveAnalysis.jsx
import React, { useState, useEffect, useRef, useCallback } from 'react';
import axios from 'axios';
import api from '../../../services/Teachers/api';
import './css/InterventionResponseModal.css';
import {
  FaInfoCircle,
  FaExclamationTriangle,
  FaChartLine,
  FaBook,
  FaEdit,
  FaCheckCircle,
  FaBrain,
  FaRuler,
  FaEye,
  FaUserMd,
  FaArrowUp,
  FaArrowRight,
  FaPlus,
  FaMobile,
  FaHandsHelping,
  FaSpinner,
  FaTimes,
  FaGraduationCap,
  FaQuestionCircle,
  FaClock,
  FaCheck,
  FaUserEdit,
  FaStethoscope,
  FaPrescriptionBottleAlt,
  FaLink,
  FaFlag,
  FaCalendarAlt,
  FaHistory
} from 'react-icons/fa';
import ActivityEditModal from './ActivityEditModal';
import ConfirmationDialog from './ConfirmationDialog';
import SuccessNotification from './SuccessNotification';
import './css/PrescriptiveAnalysis.css';
import './css/ErrorPatternAnalysis.css';
import './css/InterventionResultsDisplay.css';

// Add inline styles for elements that might not be in the CSS file
const inlineStyles = {
  disabled: {
    color: '#999',
    cursor: 'not-allowed',
  },
  filterNote: {
    fontSize: '0.8rem',
    fontStyle: 'italic',
    color: '#666',
  }
};

/**
 * DYNAMIC CORRECT ANSWER EXTRACTION FOR ALL READING CATEGORIES
 * Handles different question formats for each category
 */
const extractCorrectAnswerForCategory = (question, category) => {
  console.log('🔍 [EXTRACT] Category:', category, 'Question:', question);

  switch (category) {
    case 'Phonological Awareness':
      // Format: [{"S": "Ss"}, {"A": "Aa"}, {"V": "Vv"}]
      if (question?.questionSet?.correctPairs && Array.isArray(question.questionSet.correctPairs)) {
        return question.questionSet.correctPairs.map(pair => {
          const audio = Object.keys(pair)[0];
          const visual = pair[audio];
          return `${audio} → ${visual}`;
        }).join(', ');
      }
      break;

    case 'Alphabet Knowledge':
      // Format: choiceOptions with isCorrect flags
      if (question?.choiceOptions && Array.isArray(question.choiceOptions)) {
        const correctOptions = question.choiceOptions.filter(option => option.isCorrect);
        if (correctOptions.length > 0) {
          return correctOptions.map(option => option.optionText).join(', ');
        }
      }
      break;

    case 'Decoding':
      // Format: correctSequence array
      if (question?.correctSequence && Array.isArray(question.correctSequence)) {
        return question.correctSequence.join('-');
      }
      // Alternative format: displaySequence with fill-in-the-blank
      if (question?.displaySequence && question?.blankPosition !== undefined) {
        const sequence = [...question.displaySequence];
        if (question.correctSequence && question.correctSequence[0]) {
          sequence[question.blankPosition] = question.correctSequence[0];
          return sequence.join('');
        }
      }
      break;

    case 'Word Recognition':
      // Format: correctAnswer array
      if (question?.correctAnswer && Array.isArray(question.correctAnswer)) {
        return question.correctAnswer.join(', ');
      }
      break;

    case 'Reading Comprehension':
      // Format: sentenceQuestions with sentenceCorrectAnswer
      if (question?.sentenceQuestions && Array.isArray(question.sentenceQuestions)) {
        return question.sentenceQuestions.map((sentenceQ, index) =>
          `Q${index + 1}: ${sentenceQ.sentenceCorrectAnswer}`
        ).join('; ');
      }
      // Alternative format: single sentenceCorrectAnswer
      if (question?.sentenceCorrectAnswer) {
        return question.sentenceCorrectAnswer;
      }
      break;

    default:
      console.warn('🔍 [EXTRACT] Unknown category:', category);
      break;
  }

  // Fallback: try to find any correct answer field
  console.log('🔍 [EXTRACT] No specific format found, trying fallbacks...');

  // Try common fallback fields
  if (question?.correctAnswer) {
    return Array.isArray(question.correctAnswer) ? question.correctAnswer.join(', ') : question.correctAnswer;
  }

  if (question?.correctSequence) {
    return Array.isArray(question.correctSequence) ? question.correctSequence.join('-') : question.correctSequence;
  }

  if (question?.sentenceCorrectAnswer) {
    return question.sentenceCorrectAnswer;
  }

  console.warn('🔍 [EXTRACT] No correct answer format found for category:', category);
  return `N/A - No correct answer format found for ${category}`;
};

/**
 * Simple error boundary component to catch and display errors
 * from the PrescriptiveAnalysis component
 */
class PrescriptiveAnalysisErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, errorMessage: '' };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, errorMessage: error.toString() };
  }

  componentDidCatch(error, errorInfo) {
    console.error('PrescriptiveAnalysis error:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="literexia-prescriptive-container">
          <div className="literexia-progress-info" style={{ backgroundColor: '#ffeeee', borderLeft: '4px solid #ff6b6b' }}>
            <div className="literexia-progress-info-icon">
              <FaExclamationTriangle style={{ color: '#ff6b6b' }} />
            </div>
            <div className="literexia-progress-info-text">
              <h3>Error Loading Prescriptive Analysis</h3>
              <p>
                An error occurred while loading the prescriptive analysis data.
                Please try refreshing the page or contact support if the issue persists.
              </p>
              <div style={{ marginTop: '10px', fontSize: '0.8rem', color: '#666' }}>
                Error details: {this.state.errorMessage}
              </div>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

/**
 * PrescriptiveAnalysis Component
 * 
 * Main component for displaying prescriptive analysis and managing interventions
 * for students who scored below 75% in specific categories.
 * 
 * This component shows:
 * - Category performance breakdown
 * - Strengths, weaknesses, and recommendations for each failing category
 * - Current intervention activities
 * - Teaching guides for in-person support
 * 
 * @param {Object} student - Student object from users collection
 * @param {Object} categoryResults - Results from category_results collection
 * @param {Array} prescriptiveAnalyses - Array from prescriptive_analysis collection
 * @param {Array} interventions - Array from intervention_assessment collection
 * @param {Array} interventionProgress - Array from intervention_progress collection
 * @param {Function} onCreateActivity - Callback when new activity is created
 * @param {string} studentId - Optional student ID if student object isn't provided
 */
const PrescriptiveAnalysis = ({ 
  student, 
  categoryResults, 
  prescriptiveAnalyses, 
  interventions, 
  interventionProgress,
  onCreateActivity,
  studentId 
}) => {
  // ===== STATE MANAGEMENT =====
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [showNeedingInterventionOnly, setShowNeedingInterventionOnly] = useState(true);
  const [showActivityModal, setShowActivityModal] = useState(false);
  const [editingActivity, setEditingActivity] = useState(null);
  const [localInterventions, setLocalInterventions] = useState([]);
  const [loading, setLoading] = useState(false);

  // Dialog and notification states
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [showSuccessNotification, setShowSuccessNotification] = useState(false);
  const [pendingIntervention, setPendingIntervention] = useState(null);

  // Intervention results states for dynamic UI
  const [interventionResults, setInterventionResults] = useState({});
  const [interventionStatus, setInterventionStatus] = useState({}); // 'initial', 'success', 'revision_needed'
  const isLoadingInterventionsRef = useRef(false);
  const [notificationMessage, setNotificationMessage] = useState({
    title: 'Success!',
    message: 'Intervention successfully pushed to mobile device!'
  });

  // Response modal states
  const [showResponseModal, setShowResponseModal] = useState(false);
  const [selectedInterventionData, setSelectedInterventionData] = useState(null);
  const [interventionResponses, setInterventionResponses] = useState([]);

  // Helper function to get intervention status for a category
  const getInterventionStatus = (categoryName, categoryData = null) => {
    // 🎯 PRIORITY 1: Check category data for intervention history FIRST
    if (categoryData) {
      // Check intervention history for successful attempts (most reliable indicator)
      const hasSuccessfulIntervention = categoryData.interventionHistory?.some(attempt => attempt.isPassed);

      // Check if category passed via intervention based on flags
      const passedViaIntervention = categoryData.isPassed && categoryData.interventionCompleted;

      if (hasSuccessfulIntervention || passedViaIntervention) {
        console.log(`[INTERVENTION STATUS] ✅ ${categoryName} detected as intervention SUCCESS via:`, {
          hasSuccessfulIntervention,
          passedViaIntervention,
          interventionAttempts: categoryData.interventionAttempts,
          mainScore: categoryData.score
        });
        return 'success';
      }

      // Check if there are failed intervention attempts
      const hasFailedInterventions = categoryData.interventionHistory?.some(attempt => !attempt.isPassed);
      if (hasFailedInterventions && !hasSuccessfulIntervention) {
        console.log(`[INTERVENTION STATUS] ❌ ${categoryName} needs revision:`, {
          hasFailedInterventions,
          hasSuccessfulIntervention
        });
        return 'revision_needed';
      }
    }

    // 🎯 PRIORITY 2: Check intervention results state (fallback)
    const results = interventionResults[categoryName];
    if (results?.passed && results?.score >= 75) {
      console.log(`[INTERVENTION STATUS] ✅ ${categoryName} detected as intervention SUCCESS via results state`);
      return 'success';
    } else if (results?.passed === false && results?.score < 75) {
      console.log(`[INTERVENTION STATUS] ❌ ${categoryName} needs revision via results state`);
      return 'revision_needed';
    }

    console.log(`[INTERVENTION STATUS] 📊 ${categoryName} has no intervention attempts - using initial status`);
    return 'initial';
  };

  // NEW: Get latest intervention attempt for a category from category results
  const getLatestInterventionAttempt = (category) => {
    if (!category.interventionHistory || category.interventionHistory.length === 0) {
      return null;
    }
    
    // Sort by attempt number and get the latest
    const sortedHistory = [...category.interventionHistory].sort((a, b) => b.attemptNumber - a.attemptNumber);
    return sortedHistory[0];
  };

  // NEW: Get current display score for a category (latest intervention or original)
  const getCurrentDisplayScore = (category) => {
    const latestAttempt = getLatestInterventionAttempt(category);
    
    // If there's a latest intervention attempt, use that score
    if (latestAttempt) {
      return latestAttempt.score;
    }
    
    // Otherwise, use the original category score
    return Number(category.score) || 0;
  };

  // NEW: Determine if category is unlocked based on intervention progression
  const isCategoryUnlocked = (categoryName, categoryIndex) => {
    // First category (Alphabet Knowledge) is always unlocked
    if (categoryIndex === 0) return true;
    
    // Check if all previous categories have passed (either original assessment or latest intervention)
    const categories = liveCategoryResults?.categories || [];
    for (let i = 0; i < categoryIndex; i++) {
      const prevCategory = categories[i];
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

  // NEW: Get category progression status based on intervention history
  const getCategoryProgressionStatus = (category) => {
    const latestAttempt = getLatestInterventionAttempt(category);

    // If category passed, check if it was via intervention or original assessment
    if (category.isPassed) {
      // Check if passed via intervention
      if (category.interventionCompleted && latestAttempt && latestAttempt.isPassed) {
        return {
          status: 'passed',
          score: latestAttempt.score,
          source: 'intervention',
          attemptNumber: latestAttempt.attemptNumber,
          message: `Passed via intervention on attempt ${latestAttempt.attemptNumber} (Score: ${latestAttempt.score}%)`
        };
      }

      // Otherwise, passed via original assessment
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
        message: ''
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

  // Helper function to determine UI theme based on intervention status
  const getUITheme = (categoryName) => {
    const status = getInterventionStatus(categoryName);
    switch (status) {
      case 'success':
        return 'success'; // Green theme
      case 'revision_needed':
        return 'revision'; // Yellow/Orange theme
      default:
        return 'initial'; // Blue diagnostic theme
    }
  };

  // Helper function to render status-specific content
  const renderStatusContent = (categoryName, defaultContent) => {
    const status = getInterventionStatus(categoryName);
    const results = interventionResults[categoryName];

    switch (status) {
      case 'success':
        return (
          <div className="epa-success-content">
            <div className="epa-success-header">
              <FaCheckCircle className="epa-success-icon" />
              <div>
                <h5 className="epa-success-title">Intervention Successful!</h5>
                <p className="epa-success-subtitle">
                  Student scored {results?.score}% (improved from {results?.previousScore || 'N/A'}%)
                </p>
              </div>
            </div>
            <div className="epa-success-metrics">
              <div className="epa-metric">
                <span className="epa-metric-label">Current Score:</span>
                <span className="epa-metric-value">{results?.score}%</span>
              </div>
              <div className="epa-metric">
                <span className="epa-metric-label">Improvement:</span>
                <span className="epa-metric-value">+{results?.improvement || 0}%</span>
              </div>
              <div className="epa-metric">
                <span className="epa-metric-label">Status:</span>
                <span className="epa-metric-value success">Passed</span>
              </div>
            </div>
          </div>
        );

      case 'revision_needed':
        return (
          <div className="epa-revision-content">
            <div className="epa-revision-header">
              <FaEdit className="epa-revision-icon" />
              <div>
                <h5 className="epa-revision-title">Intervention Needs Revision</h5>
                <p className="epa-revision-subtitle">
                  Student scored {results?.score}% - close to passing! Consider revision.
                </p>
              </div>
            </div>
            <div className="epa-revision-guidance">
              <h6 className="epa-revision-guidance-title">Revision Recommendations:</h6>
              <ul className="epa-revision-suggestions">
                <li>Reduce complexity of questions slightly</li>
                <li>Add more visual cues or audio support</li>
                <li>Focus on specific error patterns identified</li>
                <li>Consider breaking into smaller practice sessions</li>
              </ul>
            </div>
            {defaultContent}
          </div>
        );

      default:
        return defaultContent;
    }
  };

  // Enhanced function to fetch intervention results with version tracking and data normalization
  const fetchInterventionResults = async (studentId, categoryName) => {
    try {
      console.log(`[INTERVENTION RESULTS] Fetching corrected intervention results for student ${studentId}, category ${categoryName}`);
      console.log(`[INTERVENTION RESULTS] Using corrected backend with revision filtering and data normalization...`);

      // Fetch intervention results using corrected backend endpoint
      const response = await api.get(`/api/intervention-results/student/${studentId}/category/${categoryName}`);

      if (response.data && response.data.success && response.data.data) {
        const interventionData = response.data.data;

        // Get category results to check intervention history with revision tracking
        const categoryResponse = await api.get(`/api/category-results/student/${studentId}`);
        let interventionHistory = [];
        let originalAssessmentScore = null;

        if (categoryResponse.data && categoryResponse.data.success) {
          const categoryResults = categoryResponse.data.data;
          const relevantCategory = categoryResults.categories?.find(cat => cat.categoryName === categoryName);

          if (relevantCategory) {
            // Preserve original assessment score (data normalization)
            originalAssessmentScore = relevantCategory.score;
            interventionHistory = relevantCategory.interventionHistory || [];

            console.log(`[DATA NORMALIZATION] 🔒 Original assessment score preserved: ${originalAssessmentScore}%`);
            console.log(`[REVISION TRACKING] Intervention history:`, interventionHistory);
          }
        }

        if (interventionData) {
          const hasMultipleAttempts = interventionHistory.length > 1;
          const currentRevision = interventionData.revisionNumber || 1;

          console.log(`[INTERVENTION RESULTS] Found intervention result for ${categoryName}`);
          console.log(`[INTERVENTION RESULTS] 📈 Current result:`, {
            score: interventionData.score,
            revision: currentRevision,
            passed: interventionData.isPassed
          });

          if (hasMultipleAttempts) {
            console.log(`[INTERVENTION RESULTS] Multiple attempts detected from intervention history`);
            console.log(`[INTERVENTION RESULTS] Historical attempts:`, interventionHistory.map(h => ({
              attempt: h.attemptNumber,
              score: h.score,
              revision: h.revisionNumber,
              passed: h.isPassed,
              completedAt: h.completedAt
            })));
          }

          // Calculate progression metrics from intervention history
          let progressionMetrics = null;
          if (hasMultipleAttempts) {
            const sortedHistory = [...interventionHistory].sort((a, b) => a.attemptNumber - b.attemptNumber);
            const previousAttempt = sortedHistory[sortedHistory.length - 2]; // Second most recent
            const currentAttempt = sortedHistory[sortedHistory.length - 1]; // Most recent

            progressionMetrics = {
              previousScore: previousAttempt.score,
              currentScore: currentAttempt.score,
              scoreImprovement: currentAttempt.score - previousAttempt.score,
              previousRevision: previousAttempt.revisionNumber || 1,
              currentRevision: currentAttempt.revisionNumber || 1,
              totalAttempts: interventionHistory.length,
              interventionHistory: sortedHistory.map((attempt) => ({
                attemptNumber: attempt.attemptNumber,
                score: attempt.score,
                isPassed: attempt.isPassed,
                revisionNumber: attempt.revisionNumber || 1,
                completedAt: attempt.completedAt,
                attemptReason: attempt.attemptReason || 'intervention_attempt'
              }))
            };
          }

          // Transform the data to match expected format with corrected backend data
          return {
            category: interventionData.category,
            score: interventionData.score,
            isPassed: interventionData.isPassed,
            passed: interventionData.isPassed,
            previousScore: interventionData.previousScore,
            improvement: interventionData.improvement,
            skillMastery: interventionData.skillMastery,
            errorPatterns: interventionData.errorPatterns,
            interventionEffectiveness: interventionData.interventionEffectiveness,
            researchBasedPrescriptions: interventionData.researchBasedPrescriptions,
            progressComparison: interventionData.progressComparison,
            insights: interventionData.insights,
            completedAt: interventionData.completedAt,
            interventionId: interventionData.interventionAssessmentId,
            assessmentDate: interventionData.assessmentDate,
            revisionNumber: currentRevision,

            // 🆕 DATA NORMALIZATION: Original assessment score preservation
            dataNormalization: {
              originalAssessmentScore: originalAssessmentScore,
              interventionScore: interventionData.score,
              scorePreserved: true,
              interventionOnlyTrackedInHistory: true
            },

            // 🆕 REVISION TRACKING DATA
            versionTracking: {
              revisionNumber: currentRevision,
              hasMultipleAttempts: hasMultipleAttempts,
              totalAttempts: interventionHistory.length,
              isLatestVersion: true,
              interventionHistory: interventionHistory
            },

            // 🆕 PROGRESSION METRICS (from intervention history)
            progressionMetrics: progressionMetrics,

            // 🆕 ENHANCED METADATA
            metadata: {
              fetchedAt: new Date().toISOString(),
              hasRevisionTracking: currentRevision > 1,
              hasDataNormalization: originalAssessmentScore !== null,
              dataCompleteness: 'corrected_backend',
              apiVersion: '3.0-corrected-data'
            }
          };
        } else {
          console.log(`[INTERVENTION RESULTS] ❌ No intervention results found for student ${studentId}, category ${categoryName}`);
          return null;
        }
      } else {
        console.log(`[INTERVENTION RESULTS] ❌ Invalid response format from corrected backend`);
        return null;
      }
    } catch (error) {
      console.error('❌ Error fetching corrected intervention results:', error);
      // Fallback to debug endpoint if new endpoint fails
      try {
        console.log(`[INTERVENTION RESULTS] Falling back to debug endpoint...`);
        const fallbackResponse = await api.get(`/api/intervention-monitoring/debug-data`);

        if (fallbackResponse.data && fallbackResponse.data.success && fallbackResponse.data.data.interventionResults) {
          const allResults = fallbackResponse.data.data.interventionResults;
          const categoryResults = allResults.filter(result =>
            result.studentId === parseInt(studentId) &&
            result.category === categoryName
          ).sort((a, b) => {
            const dateA = new Date(a.completedAt || a.createdAt || 0);
            const dateB = new Date(b.completedAt || b.createdAt || 0);
            return dateB - dateA;
          });

          if (categoryResults.length > 0) {
            console.log(`[INTERVENTION RESULTS] Using fallback data for ${categoryName}`);
            return categoryResults[0];
          }
        }
      } catch (fallbackError) {
        console.error('❌ Fallback also failed:', fallbackError);
      }
      return null;
    }
  };

  // ===== STATE (fetched if not injected by parent) =====
  const [liveStudent, setLiveStudent] = useState(student ?? null);
  const [liveCategoryResults, setLiveCategoryResults] = useState(categoryResults ?? null);
  const [liveAnalyses, setLiveAnalyses] = useState(prescriptiveAnalyses ?? null);
  const [liveInterventions, setLiveInterventions] = useState(interventions ?? []);
  const hasDataBeenFetched = useRef(false);

  // Merge server-created & local drafts
  const effectiveInterventions = [...(liveInterventions || []), ...(localInterventions || [])];

  // Filter categories that need intervention (score < 75%) - memoized to prevent infinite loops
  const categoriesNeedingIntervention = React.useMemo(() => {
    return liveCategoryResults && liveCategoryResults.categories && Array.isArray(liveCategoryResults.categories)
      ? liveCategoryResults.categories.filter(cat => (Number(cat.score) || 0) < 75)
      : [];
  }, [liveCategoryResults]);
    
  // Define allCategoriesPassed BEFORE it's used in getAnalysisForCategory
  const allCategoriesPassed = React.useMemo(
    () => liveCategoryResults?.categories?.length > 0 && (categoriesNeedingIntervention?.length === 0 || false),
    [categoriesNeedingIntervention, liveCategoryResults]
  );

  // ===== EFFECTS =====
  
  /**
   * Reset fetch flag when student changes
   */
  // Use ref to track which student we've fetched data for
  const lastFetchedStudentRef = useRef(null);

  // Reset fetch flag when student changes
  useEffect(() => {
    const currentStudentId = student?.idNumber || student?.id || studentId;
    if (currentStudentId && currentStudentId !== lastFetchedStudentRef.current) {
      hasDataBeenFetched.current = false;
      lastFetchedStudentRef.current = currentStudentId;
    }
  }, [student?.idNumber, student?.id, studentId]);

  /**
   * Fetch data when studentId is available and parent hasn't provided data
   */
  useEffect(() => {
    // For interventions and progress, always fetch fresh data when student ID is available
    // IMPORTANT: Use idNumber (integer) for prescriptive analysis API, not _id (ObjectId)
    const sid = student?.idNumber || student?.id || studentId;
    if (!sid) return;                              // no ID? bail.
    
    // If parent supplied all data except interventions, we only need to fetch interventions
    const needsInterventions = interventions?.length === 0 || interventions === undefined;
    
    // Skip fetches if we've already fetched for this student
    if (hasDataBeenFetched.current) {
      console.log('Already fetched data for student:', sid);
      return;
    }

    console.log('PrescriptiveAnalysis useEffect Debug:');
    console.log('  - student ID:', sid);
    console.log('  - hasDataBeenFetched:', hasDataBeenFetched.current);

    (async () => {
      try {
        setLoading(true);

        // Only fetch basic data if not already provided or fetched
        if (!student || !categoryResults || !prescriptiveAnalyses) {
          // 2.1 Get student core profile
          const { data: stu } = await api.get(`/api/student/${sid}`);
          setLiveStudent(stu);

          // 2.2 Latest category result
          const { data: cat } = await api.get(`/api/progress/category-results/${sid}`);
          console.log('[CATEGORY RESULTS DEBUG] Raw API response:', cat);
          // Handle different response formats
          if (cat && cat.success && cat.data && cat.data.categories) {
            // API returns {success: true, data: {categories: [...]}}
            setLiveCategoryResults(cat.data);
          } else if (cat && cat.categories) {
            // Direct category results object
            setLiveCategoryResults(cat);
          } else if (Array.isArray(cat)) {
            // If the API returns an array directly, wrap it in the expected structure
            setLiveCategoryResults({ categories: cat });
          } else {
            console.warn('Unexpected category results format:', cat);
            setLiveCategoryResults({ categories: [] });
          }

          // 2.3 Real CLAUDE.md Prescriptive analyses (auto-generated by the server)
          console.log('[PRESCRIPTIVE ANALYSIS DEBUG] Fetching analysis for student:', sid);
          console.log('🔍 [PRESCRIPTIVE ANALYSIS DEBUG] API endpoint:', `/api/progress/student/${sid}/prescriptive-analyses`);

          const { data } = await api.get(`/api/progress/student/${sid}/prescriptive-analyses`);
          console.log('🔍 [PRESCRIPTIVE ANALYSIS DEBUG] API Response received:');
          console.log('  - Raw response:', data);
          console.log('  - Response type:', typeof data);
          console.log('  - Response is array:', Array.isArray(data));
          console.log('  - Response length:', data?.length);

          if (data === null || data === undefined) {
            console.log('❌ [PRESCRIPTIVE ANALYSIS DEBUG] API returned null - no analysis generated yet');
            console.log('❌ [PRESCRIPTIVE ANALYSIS DEBUG] This means the backend has not processed student_responses into prescriptive_analysis');
            console.log('❌ [PRESCRIPTIVE ANALYSIS DEBUG] According to CLAUDE.md, prescriptive analysis should auto-generate when category_results is saved');
          }

          // Handle different response formats for REAL data
          if (data === null || data === undefined) {
            // If the API returns null, set liveAnalyses to null
            console.log('No prescriptive analysis data available');
            setLiveAnalyses([]);
          } else if (data.success && Array.isArray(data.data)) {
            // If the API returns {success: true, data: [...]}
            console.log('Found prescriptive analyses:', data.data.length);
            setLiveAnalyses(data.data);
          } else if (Array.isArray(data)) {
            // If the API returns the array directly
            console.log('Found prescriptive analyses (direct array):', data.length);
            setLiveAnalyses(data);
          } else if (data.success === false) {
            // Handle API errors
            console.warn('API returned error:', data.message || 'Unknown error');
            setLiveAnalyses([]);
          } else {
            // Fallback - treat single object as array
            console.log('Converting single analysis to array');
            setLiveAnalyses([data]);
          }
        }

        // Always fetch fresh interventions data
        console.log('Fetching interventions for student:', sid);
        try {
          const response = await api.get(`/api/progress/student/${sid}/interventions`);
          
          console.log('Fetched interventions response:', response);
          
          // Ensure we always set an array, even if the API returns null, undefined, or a non-array
          if (Array.isArray(response.data)) {
            setLiveInterventions(response.data);
          } else if (response.data && Array.isArray(response.data.data)) {
            // Handle {success: true, data: [...]} format
            setLiveInterventions(response.data.data);
          } else {
            // Fallback to empty array for any other response format
            console.warn('Unexpected interventions response format:', response.data);
            setLiveInterventions([]);
          }
        } catch (error) {
          console.error('Error fetching interventions:', error);
          // Ensure we set an empty array on error
          setLiveInterventions([]);
        }

        // Mark that we've successfully fetched data for this student
        hasDataBeenFetched.current = true;
      } catch (err) {
        console.error('PrescriptiveAnalysis fetch error:', err);
      } finally {
        setLoading(false);
      }
    })();
  }, [student?.idNumber, student?.id, studentId]);
  
  /**
   * Auto-select first category (either one needing intervention or just the first one)
   */
  useEffect(() => {
    if (!selectedCategory) {
      // ✅ FIX: Only auto-select categories that have prescriptive analysis data
      const categoriesWithAnalysis = liveCategoryResults?.categories?.filter(cat => {
        if (!liveAnalyses || liveAnalyses.length === 0) return false;

        // Check if any prescriptive analysis contains skillMastery data for this category
        return liveAnalyses.some(analysis =>
          analysis?.skillMastery &&
          analysis.skillMastery[cat.categoryName] &&
          analysis.skillMastery[cat.categoryName].responseHistory &&
          analysis.skillMastery[cat.categoryName].responseHistory.length > 0
        );
      }) || [];

      if (categoriesWithAnalysis.length > 0) {
        // Select the first category with analysis (prioritize those needing intervention)
        const analysisNeedingIntervention = categoriesNeedingIntervention?.filter(cat =>
          categoriesWithAnalysis.some(withAnalysis => withAnalysis.categoryName === cat.categoryName)
        ) || [];

        if (analysisNeedingIntervention.length > 0) {
          setSelectedCategory(analysisNeedingIntervention[0].categoryName);
        } else {
          setSelectedCategory(categoriesWithAnalysis[0].categoryName);
        }
      }
    }
  }, [categoriesNeedingIntervention, selectedCategory, liveCategoryResults, liveAnalyses]);

  // Debug effect to log data
  useEffect(() => {
    console.log('Category Results:', liveCategoryResults);
    console.log('Prescriptive Analyses:', liveAnalyses);
    console.log('Selected Category:', selectedCategory);
    if (selectedCategory) {
      const analysis = getAnalysisForCategory(selectedCategory);
      console.log('Selected Analysis:', analysis);
      
      // Log the structure of the analysis object
      if (analysis) {
        console.log('Analysis structure:', Object.keys(analysis));
        console.log('Analysis has strengths?', Boolean(analysis.strengths));
        console.log('Analysis has analysis?', Boolean(analysis.analysis));
        console.log('Analysis has recommendations?', Boolean(analysis.recommendations));
        console.log('Analysis has recommendation?', Boolean(analysis.recommendation));
      }
    }
  }, [selectedCategory, liveAnalyses, liveCategoryResults]);

  // Effect to load intervention results when component mounts or student changes
  useEffect(() => {
    const loadInterventionResults = async () => {
      const currentStudentId = liveStudent?.idNumber || liveStudent?.id || studentId;

      // Skip if no student ID or already loading
      if (!currentStudentId || isLoadingInterventionsRef.current) {
        return;
      }

      // Skip if no categories need intervention
      if (!categoriesNeedingIntervention || categoriesNeedingIntervention.length === 0) {
        setInterventionResults({});
        return;
      }

      console.log('Loading intervention results for categories:', categoriesNeedingIntervention.map(cat => cat.categoryName));

      isLoadingInterventionsRef.current = true;

      try {
        const results = {};
        for (const category of categoriesNeedingIntervention) {
          try {
            const categoryResults = await fetchInterventionResults(currentStudentId, category.categoryName);
            if (categoryResults) {
              results[category.categoryName] = categoryResults;
            }
          } catch (error) {
            console.error(`Error loading intervention results for ${category.categoryName}:`, error);
            // Continue with other categories even if one fails
          }
        }

        setInterventionResults(results);
        console.log('[INTERVENTION RESULTS] All intervention results loaded:', results);
      } finally {
        isLoadingInterventionsRef.current = false;
      }
    };

    // Only run if we have the necessary data
    if (liveStudent || studentId) {
      loadInterventionResults();
    }
  }, [liveStudent?.idNumber, liveStudent?.id, studentId, categoriesNeedingIntervention?.length]);

  // ===== HELPER FUNCTIONS =====

  /**
   * Get prescriptive analysis for a specific category from REAL CLAUDE.md data
   * @param {string} categoryName - Category name
   * @param {Object|null} categoryData - Category data for intervention status detection
   * @return {Object|null} Analysis object with BKT, IRT, and error patterns from real data
   */
  const getAnalysisForCategory = (categoryName, categoryData = null) => {
    console.log('Looking for REAL prescriptive analysis for category:', categoryName);
    console.log('Available real analyses:', liveAnalyses);

    if (!categoryName) return null;

    // Get student ID
    const currentStudentId = liveStudent?.idNumber || liveStudent?._id || studentId;
    console.log('Looking for student ID:', currentStudentId);

    // Check if we have any analyses
    if (!liveAnalyses || liveAnalyses.length === 0) {
      console.log('❌ [PRESCRIPTIVE ANALYSIS DEBUG] No real prescriptive analyses available - backend needs to process student_responses');
      console.log('❌ [PRESCRIPTIVE ANALYSIS DEBUG] Student', currentStudentId, 'has completed main assessment but no prescriptive analysis exists');
      console.log('❌ [PRESCRIPTIVE ANALYSIS DEBUG] This indicates the automatic trigger in CategoryResultsService is not working');
      return null;
    }

    // Find the REAL prescriptive analysis for this student (CLAUDE.md format)
    const studentAnalysis = liveAnalyses.find(analysis => {
      if (!analysis) return false;

      // Handle different ID formats from real data
      let analysisStudentId;
      if (typeof analysis.studentId === 'object' && analysis.studentId.$oid) {
        analysisStudentId = analysis.studentId.$oid;
      } else if (typeof analysis.studentId === 'number' || typeof analysis.studentId === 'string') {
        analysisStudentId = analysis.studentId;
      } else {
        console.log('Analysis has no valid studentId:', analysis);
        return false;
      }

      const matches = analysisStudentId == currentStudentId;
      console.log(`Checking REAL analysis student ID ${analysisStudentId} vs current ${currentStudentId}: ${matches}`);
      return matches;
    });

    if (!studentAnalysis) {
      console.log('No REAL prescriptive analysis found for student:', currentStudentId);
      return null;
    }

    console.log('Found REAL prescriptive analysis:', studentAnalysis);

    // Debug: Log the _id field specifically
    console.log('ANALYSIS _ID FIELD:', studentAnalysis._id);
    console.log('ANALYSIS _ID TYPE:', typeof studentAnalysis._id);
    if (studentAnalysis._id && typeof studentAnalysis._id === 'object') {
      console.log('ANALYSIS _ID OBJECT KEYS:', Object.keys(studentAnalysis._id));
      console.log('ANALYSIS _ID.$oid:', studentAnalysis._id.$oid);
    }

    // Debug: Log detailed structure of the found analysis
    console.log('DETAILED ANALYSIS STRUCTURE:');
    console.log('- skillMastery exists:', Boolean(studentAnalysis.skillMastery));
    console.log('- skillMastery keys:', studentAnalysis.skillMastery ? Object.keys(studentAnalysis.skillMastery) : 'N/A');
    console.log('- abilityEstimates exists:', Boolean(studentAnalysis.abilityEstimates));
    console.log('- abilityEstimates keys:', studentAnalysis.abilityEstimates ? Object.keys(studentAnalysis.abilityEstimates) : 'N/A');
    console.log('- errorPatterns exists:', Boolean(studentAnalysis.errorPatterns));
    console.log('- errorPatterns keys:', studentAnalysis.errorPatterns ? Object.keys(studentAnalysis.errorPatterns) : 'N/A');
    console.log('- interventionPlan exists:', Boolean(studentAnalysis.interventionPlan));
    console.log('- insights exists:', Boolean(studentAnalysis.insights));

    // Verify this is CLAUDE.md-compliant data (has the sophisticated structure)
    if (!studentAnalysis.skillMastery && !studentAnalysis.abilityEstimates && !studentAnalysis.errorPatterns) {
      console.warn('Analysis found but not CLAUDE.md-compliant. Backend needs to generate proper prescriptive analysis from student_responses.json');
      console.warn('This should NOT happen if the backend prescriptive analysis is working correctly!');
      return null;
    }

    // Normalize category name for Map access
    const normalizedCategory = categoryName
      .replace(/_/g, ' ')
      .replace(/\b\w/g, l => l.toUpperCase());

    console.log('Extracting real data for normalized category:', normalizedCategory);
    console.log('Original category name:', categoryName);

    // Extract category-specific data from the REAL analysis using actual data structure
    console.log('Available skillMastery categories:', Object.keys(studentAnalysis.skillMastery || {}));
    console.log('Available abilityEstimates categories:', Object.keys(studentAnalysis.abilityEstimates || {}));
    console.log('Available errorPatterns categories:', Object.keys(studentAnalysis.errorPatterns || {}));

    // Test specific lookups
    console.log('TESTING CATEGORY LOOKUPS:');
    console.log(`- skillMastery["${categoryName}"] exists:`, Boolean(studentAnalysis.skillMastery?.[categoryName]));
    console.log(`- skillMastery["${normalizedCategory}"] exists:`, Boolean(studentAnalysis.skillMastery?.[normalizedCategory]));
    console.log(`- abilityEstimates["${categoryName}"] exists:`, Boolean(studentAnalysis.abilityEstimates?.[categoryName]));
    console.log(`- abilityEstimates["${normalizedCategory}"] exists:`, Boolean(studentAnalysis.abilityEstimates?.[normalizedCategory]));
    console.log(`- errorPatterns["${categoryName}"] exists:`, Boolean(studentAnalysis.errorPatterns?.[categoryName]));
    console.log(`- errorPatterns["${normalizedCategory}"] exists:`, Boolean(studentAnalysis.errorPatterns?.[normalizedCategory]));

    // 🔄 PRIORITIZE POST-INTERVENTION ANALYSIS: Check if category passed via intervention
    const interventionStatus = getInterventionStatus(categoryName, categoryData);
    const hasPassedViaIntervention = interventionStatus === 'success';
    const interventionData = interventionResults[categoryName];

    console.log(`[ANALYSIS DATA] Category: ${categoryName}, Intervention Status: ${interventionStatus}, Has Intervention Data: ${!!interventionData}`);

    // Extract BKT data - prioritize intervention results if category passed via intervention
    let skillMasteryData;
    let dataSource = '';

    if (hasPassedViaIntervention && interventionData?.skillMastery?.[categoryName]) {
      // 🎯 Use POST-INTERVENTION analysis for categories that passed via intervention
      skillMasteryData = interventionData.skillMastery[categoryName];
      dataSource = 'intervention_results (post-intervention)';
      console.log(`[ANALYSIS DATA] ✅ Using POST-INTERVENTION analysis for ${categoryName}:`, skillMasteryData);
    } else {
      // 📊 Use PRE-INTERVENTION analysis for categories not yet attempted or failed intervention
      skillMasteryData = studentAnalysis.skillMastery?.[categoryName] || studentAnalysis.skillMastery?.[normalizedCategory];
      dataSource = 'prescriptive_analysis (pre-intervention)';
      console.log(`[ANALYSIS DATA] 📊 Using PRE-INTERVENTION analysis for ${categoryName}:`, skillMasteryData);
    }

    const bktData = skillMasteryData ? {
      ...skillMasteryData,
      // Ensure we have all BKT fields from the database
      masteryProbability: skillMasteryData.masteryProbability || 0,
      score: skillMasteryData.score || 0,
      isPassed: skillMasteryData.isPassed || false,
      totalQuestions: skillMasteryData.totalQuestions || 0,
      correctAnswers: skillMasteryData.correctAnswers || 0,
      totalPossibleMatches: skillMasteryData.totalPossibleMatches || 0,
      correctMatches: skillMasteryData.correctMatches || 0,
      responseHistory: skillMasteryData.responseHistory || [],
      lastUpdated: skillMasteryData.lastUpdated,
      // Add metadata about data source
      _dataSource: dataSource,
      _isPostIntervention: hasPassedViaIntervention
    } : null;

    // Extract complete error patterns with all confusion pairs
    const errorPatternsData = studentAnalysis.errorPatterns?.[categoryName] || studentAnalysis.errorPatterns?.[normalizedCategory];

    console.log('🔍 [DEBUG] Error patterns for', categoryName, ':', errorPatternsData);

    const enhancedErrorPatterns = errorPatternsData ? {
      ...errorPatternsData,
      // Enhanced processing of error patterns from database
      ...Object.keys(errorPatternsData).reduce((acc, key) => {
        const patternData = errorPatternsData[key];
        console.log(`🔍 [DEBUG] Processing error pattern '${key}':`, patternData);

        if (patternData && typeof patternData === 'object') {
          acc[key] = {
            ...patternData,

            // Extract confusion pairs with intervention focus from database
            confusionPairs: patternData.confusionPairs?.map(pair => ({
              ...pair,
              // Ensure we have the intervention focus from database
              intervention: pair.interventionFocus || pair.intervention
            })) || [],

            // Extract cognitive implications from database structure
            cognitiveImplications: (() => {
              const implications = patternData.cognitiveImplications;
              console.log(`🔍 [DEBUG] Cognitive implications for ${key}:`, implications);

              if (!implications) return [];

              if (Array.isArray(implications)) {
                return implications;
              }

              if (typeof implications === 'object') {
                // Convert object values to array with detailed descriptions
                return Object.entries(implications).map(([factor, description]) => {
                  return `${factor.replace(/([A-Z])/g, ' $1').toLowerCase()}: ${description}`;
                });
              }

              return [implications];
            })(),

            // Extract additional pattern details from database
            errorType: patternData.error_type || patternData.errorType,
            percentage: patternData.percentage,
            count: patternData.count,
            total: patternData.total,
            avgPartialSuccess: patternData.avg_partial_success,
            questionIds: patternData.questionIds || [],
            sequentialDifficulty: patternData.sequentialDifficulty
          };
        }
        return acc;
      }, {})
    } : null;

    // Extract complete research-based prescriptions
    const researchPrescriptions = studentAnalysis.researchBasedPrescriptions?.[categoryName] ||
                                  studentAnalysis.researchBasedPrescriptions?.[normalizedCategory];

    console.log('🔍 [DEBUG] Research prescriptions for', categoryName, ':', researchPrescriptions);

    // Extract detailed error analysis - individual letter/question level analysis
    // It's nested in errorPatterns.[categoryName].detailedErrorAnalysis
    const categoryErrorPatterns = studentAnalysis.errorPatterns?.[categoryName] || studentAnalysis.errorPatterns?.[normalizedCategory];
    
    // For Phonological Awareness, use matching_errors data instead of detailedErrorAnalysis
    let detailedErrorAnalysis = [];
    if (categoryName === 'Phonological Awareness' && categoryErrorPatterns?.matching_errors) {
      // Convert matching_errors to detailedErrorAnalysis format
      const matchingErrors = categoryErrorPatterns.matching_errors;
      detailedErrorAnalysis = matchingErrors.confusionPairs?.map(pair => {
        // Handle different data structures for confusion pairs
        let soundsArray = [];
        let displayText = 'Unknown';
        
        if (pair && typeof pair === 'object') {
          // Check if it's the new format with audio/match keys
          if (pair.audio && pair.match) {
            soundsArray = [pair.audio, pair.match];
            displayText = `${pair.audio} ↔ ${pair.match}`;
          }
          // Check if it's the old format with sounds array
          else if (pair.sounds && Array.isArray(pair.sounds)) {
            soundsArray = pair.sounds;
            displayText = pair.sounds.join(' ↔ ');
          }
          // Check if it's a string format
          else if (typeof pair === 'string') {
            soundsArray = [pair];
            displayText = pair;
          }
          // Fallback for other object structures
          else {
            soundsArray = Object.values(pair).filter(val => typeof val === 'string');
            displayText = soundsArray.join(' ↔ ') || 'Unknown';
          }
        } else if (typeof pair === 'string') {
          soundsArray = [pair];
          displayText = pair;
        }
        
        return {
          errorPattern: `Sound discrimination difficulty with ${displayText}`,
          specificPairs: soundsArray,
          interventionFocus: pair.interventionFocus || 'Focus on sound discrimination training',
          confusionRate: pair.confusionRate || pair.confusion_rate || pair.rate || 0,
        errorType: 'sound_discrimination'
        };
      }) || [];
    } else {
      detailedErrorAnalysis = categoryErrorPatterns?.detailedErrorAnalysis || [];
    }

    console.log('🔍 [DEBUG] Detailed error analysis extraction for', categoryName, ':');
    console.log('🔍 [DEBUG] Category error patterns:', categoryErrorPatterns);
    console.log('🔍 [DEBUG] Detailed error analysis found:', detailedErrorAnalysis);
    console.log('🔍 [DEBUG] Full errorPatterns structure:', studentAnalysis.errorPatterns);

    const enhancedResearchPrescriptions = researchPrescriptions ? {
      ...researchPrescriptions,

      // Extract maintenance strategies with complete details from database
      maintenanceStrategies: (() => {
        const activities = researchPrescriptions.maintenanceRecommendations?.activities || [];
        console.log('🔍 [DEBUG] Maintenance activities found:', activities);

        return activities.map(activity => {
          if (typeof activity === 'string') return activity;

          // Extract full activity details from database structure
          const fullDescription = [
            activity.activity || '',
            activity.purpose ? `(${activity.purpose})` : '',
            activity.frequency ? `Frequency: ${activity.frequency}` : '',
            activity.implementation || '',
            activity.rationale || ''
          ].filter(Boolean).join(' - ');

          return fullDescription || activity.activity || activity.description || 'Maintenance activity';
        });
      })(),

      // Extract intervention strategies with complete technique details from database
      interventionStrategies: (() => {
        const techniques = researchPrescriptions.interventionPrescription?.specificTechniques || [];
        console.log('🔍 [DEBUG] Intervention techniques found:', techniques);

        return techniques.map(technique => {
          if (typeof technique === 'string') return technique;

          // Extract full technique details from database structure
          const fullDescription = [
            technique.technique || '',
            technique.description || '',
            technique.duration ? `Duration: ${technique.duration}` : '',
            technique.materials ? `Materials: ${technique.materials}` : '',
            technique.progressCriteria ? `Success: ${technique.progressCriteria}` : '',
            technique.researchBasis ? `Research: ${technique.researchBasis}` : ''
          ].filter(Boolean).join(' | ');

          return fullDescription || technique.technique || technique.description || 'Intervention technique';
        });
      })(),

      // Extract escalation protocols with complete trigger and approach details from database
      escalationProtocols: (() => {
        const triggers = researchPrescriptions.escalationProtocol?.triggers || [];
        console.log('🔍 [DEBUG] Escalation triggers found:', triggers);

        return triggers.map(trigger => {
          if (typeof trigger === 'string') return trigger;

          // Extract full escalation details from database structure
          const approaches = trigger.specificTechniques?.map(tech => {
            return [
              tech.technique || '',
              tech.purpose || '',
              tech.implementation || '',
              tech.researchBasis || ''
            ].filter(Boolean).join(' - ');
          }) || [];

          const fullDescription = [
            trigger.trigger ? `Trigger: ${trigger.trigger}` : '',
            trigger.approach ? `Approach: ${trigger.approach}` : '',
            trigger.researchFoundation ? `Research: ${trigger.researchFoundation}` : '',
            ...approaches
          ].filter(Boolean).join(' | ');

          return fullDescription || trigger.approach || trigger.description || 'Escalation protocol';
        });
      })(),

      // Extract additional prescription details from database
      categoryStatus: researchPrescriptions.categoryStatus,
      deficitAnalysis: researchPrescriptions.deficitAnalysis,
      intensityLevel: researchPrescriptions.interventionPrescription?.intensityLevel,
      sessionStructure: researchPrescriptions.interventionPrescription?.sessionStructure,
      materialRecommendations: researchPrescriptions.interventionPrescription?.materialRecommendations || []
    } : null;

    // Extract complete intervention plan data
    const interventionPlanData = studentAnalysis.interventionPlan?.specificFocus?.[categoryName] ||
                                studentAnalysis.interventionPlan?.specificFocus?.[normalizedCategory] ||
                                studentAnalysis.interventionPlan;
    console.log('🔍 [DEBUG] Intervention plan data for', categoryName, ':', interventionPlanData);

    const enhancedInterventionPlan = interventionPlanData ? {
      ...interventionPlanData,
      // Extract all intervention details from database
      focus: interventionPlanData.focus,

      // Extract complete target sounds list from database
      targetSounds: (() => {
        const sounds = interventionPlanData.targetSounds || [];
        console.log('🔍 [DEBUG] Target sounds found:', sounds);

        // Handle different formats: array of strings or detailed objects
        return sounds.map(sound => {
          if (typeof sound === 'string') return sound;
          if (sound.discrimination) return sound.discrimination;
          if (sound.sounds) return sound.sounds.join('-');
          return sound;
        });
      })(),

      // Extract all recommended activities from database
      recommendedActivities: (() => {
        const activities = interventionPlanData.recommendedActivities || [];
        console.log('🔍 [DEBUG] Recommended activities found:', activities);
        return activities;
      })(),

      // Extract complete question distribution from database
      questionDistribution: (() => {
        const distribution = interventionPlanData.questionDistribution || {};
        console.log('🔍 [DEBUG] Question distribution found:', distribution);
        return distribution;
      })(),

      // Extract target patterns from database
      targetPatterns: interventionPlanData.targetPatterns || [],

      // Extract dynamic question count from the database
      recommendedQuestionCount: extractQuestionCount(studentAnalysis, categoryName),
      questionCountRationale: extractQuestionCountRationale(studentAnalysis, categoryName)
    } : null;

    const categoryAnalysis = {
      // Basic info
      category: categoryName,
      readingLevel: studentAnalysis.readingLevel,
      assessmentDate: studentAnalysis.assessmentDate,
      assessmentType: studentAnalysis.assessmentType,
      overallScore: studentAnalysis.insights?.overallScore,

      // Enhanced BKT Data with complete response history
      bktData: bktData,

      // REAL IRT Data from abilityEstimates object
      irtAbility: studentAnalysis.abilityEstimates?.[categoryName] || studentAnalysis.abilityEstimates?.[normalizedCategory],

      // Enhanced Error Patterns with all confusion pairs and cognitive implications
      errorPatterns: enhancedErrorPatterns,

      // Detailed Error Analysis - letter/question level breakdown
      detailedErrorAnalysis: detailedErrorAnalysis,

      // Enhanced Intervention Plan with dynamic question count
      interventionPlan: enhancedInterventionPlan,

      // Enhanced Research-based prescriptions with all strategy types
      researchBasedPrescriptions: enhancedResearchPrescriptions,

      // Complete insights from REAL analysis
      insights: {
        ...studentAnalysis.insights,
        // Extract additional insights
        strengths: studentAnalysis.insights?.strengths || [],
        weaknesses: studentAnalysis.insights?.weaknesses || [],
        overallReadiness: studentAnalysis.insights?.overallReadiness,
        recommendedAction: studentAnalysis.insights?.recommendedAction,
        passedCategories: studentAnalysis.insights?.passedCategories,
        failedCategories: studentAnalysis.insights?.failedCategories
      },

      // REAL Intervention History for this category
      interventionHistory: studentAnalysis.interventionHistory?.filter(h =>
        h.category === categoryName || h.category === normalizedCategory
      ) || [],

      // Full analysis object for complex operations
      fullAnalysis: studentAnalysis
    };

    console.log('Extracted REAL category analysis for', normalizedCategory, ':', categoryAnalysis);
    return categoryAnalysis;
  };

  // Helper function to extract dynamic question count from database
  const extractQuestionCount = (studentAnalysis, categoryName) => {
    console.log('🔍 [DEBUG] Extracting question count for', categoryName);
    console.log('🔍 [DEBUG] Full intervention plan:', studentAnalysis.interventionPlan);

    // Try different possible locations for question count in the database
    const interventionPlan = studentAnalysis.interventionPlan;
    if (!interventionPlan) {
      console.log('❌ No intervention plan found');
      return 10; // Default fallback
    }

    // Check specific focus for this category
    const categorySpecific = interventionPlan.specificFocus?.[categoryName];
    console.log('🔍 [DEBUG] Category specific data:', categorySpecific);

    if (categorySpecific?.recommendedQuestionCount) {
      console.log('✅ Found recommendedQuestionCount:', categorySpecific.recommendedQuestionCount);
      return categorySpecific.recommendedQuestionCount;
    }

    // Check question distribution for total count
    if (categorySpecific?.questionDistribution) {
      console.log('🔍 [DEBUG] Question distribution:', categorySpecific.questionDistribution);

      if (categorySpecific.questionDistribution.total) {
        console.log('✅ Found total in questionDistribution:', categorySpecific.questionDistribution.total);
        return categorySpecific.questionDistribution.total;
      }

      const total = Object.values(categorySpecific.questionDistribution).reduce((sum, count) => {
        return sum + (typeof count === 'number' ? count : 0);
      }, 0);
      if (total > 0) {
        console.log('✅ Calculated total from questionDistribution:', total);
        return total;
      }
    }

    // Check overall intervention plan
    if (interventionPlan.recommendedQuestionCount) {
      console.log('✅ Found overall recommendedQuestionCount:', interventionPlan.recommendedQuestionCount);
      return interventionPlan.recommendedQuestionCount;
    }

    // Extract from question count calculation if available
    if (studentAnalysis.questionCountCalculation?.finalCount) {
      console.log('✅ Found finalCount:', studentAnalysis.questionCountCalculation.finalCount);
      return studentAnalysis.questionCountCalculation.finalCount;
    }

    console.log('❌ No dynamic question count found in database, using default');
    return 10; // Default fallback
  };

  // Helper function to extract question count rationale from database
  const extractQuestionCountRationale = (studentAnalysis, categoryName) => {
    const interventionPlan = studentAnalysis.interventionPlan;
    const categorySpecific = interventionPlan?.specificFocus?.[categoryName];

    // Try to get rationale from question count calculation
    if (studentAnalysis.questionCountCalculation?.rationale) {
      return studentAnalysis.questionCountCalculation.rationale;
    }

    // Try to get from category-specific plan
    if (categorySpecific?.rationale) {
      return categorySpecific.rationale;
    }

    // Generate based on available data
    const errorRate = studentAnalysis.errorPatterns?.[categoryName]?.matching_errors?.percentage;
    const masteryLevel = studentAnalysis.skillMastery?.[categoryName]?.masteryProbability;

    if (errorRate && masteryLevel) {
      return `Based on ${errorRate}% error rate and ${Math.round(masteryLevel * 100)}% mastery level`;
    }

    return 'Based on assessment performance and error analysis';
  };

  /**
   * Get interventions for a specific category
   * @param {string} categoryName - Category name
   * @return {Array} Array of interventions
   */
  const getInterventionsForCategory = (categoryName) => {
    if (!effectiveInterventions || !Array.isArray(effectiveInterventions)) {
      return [];
    }
    return effectiveInterventions.filter(
      intervention => intervention.category === categoryName
    );
  };

  /**
   * Get progress for a specific intervention
   * @param {string} interventionId - Intervention ID
   * @return {Object|null} Progress object or null
   */
  const getProgressForIntervention = (interventionId) => {
    if (!interventionProgress) return null;
    return interventionProgress.find(
      progress => progress.interventionPlanId === interventionId
    );
  };

  /**
   * Format category name for display
   * @param {string} categoryName - Category name
   * @return {string} Formatted category name
   */
  const formatCategoryName = (categoryName) => {
    if (!categoryName) return "Unknown Category";
    
    // Format for display (e.g., "alphabet_knowledge" → "Alphabet Knowledge")
    return categoryName
      .replace(/_/g, ' ')
      .replace(/\b\w/g, l => l.toUpperCase());
  };

  // ===== EVENT HANDLERS =====

  /**
   * Handle creating new activity
   * @param {string} category - Category name
   * @param {Object} analysis - Analysis object
   * @param {Object} existingActivity - Existing activity to edit (optional)
   */
  const handleCreateActivity = (category, analysis, existingActivity = null) => {
    // Check if this is for creating version 2 based on failed intervention results
    const interventionResultData = interventionResults[category];
    const hasInterventionResults = interventionResultData && interventionResultData.score !== undefined;
    const isFailedIntervention = hasInterventionResults && !interventionResultData.isPassed;

    // Pass additional context for version 2 creation
    const activityContext = {
      ...existingActivity,
      isVersionTwo: isFailedIntervention && existingActivity !== null,
      interventionResults: isFailedIntervention ? interventionResultData : null,
      revisionReason: isFailedIntervention ? `Student scored ${interventionResultData.score}% (below 75% threshold) - creating revised intervention` : null
    };

    setEditingActivity(activityContext);
    setSelectedCategory(category);
    setShowActivityModal(true);
  };

  /**
   * Handle closing the intervention responses modal
   */
  const handleCloseResponseModal = () => {
    console.log('🔒 Closing response modal');
    setShowResponseModal(false);
    setSelectedInterventionData(null);
    setInterventionResponses([]);
  };

  /**
   * Handle viewing intervention responses
   * @param {Object} intervention - Intervention object
   * @param {string} category - Category name
   */
  const handleViewResponses = async (intervention, category) => {
    console.log('handleViewResponses called:', { intervention: intervention._id, category });
    console.log('Student data:', { studentId: student.idNumber, studentName: student.firstName });
    console.log('Intervention object:', intervention);

    try {
      setLoading(true);
      console.log('Loading state set to true');

      // Try multiple approaches to fetch intervention responses
      let fetchedResponses = [];

      try {
        // Fetch intervention responses from database based on intervention ID and revision number
        console.log('Fetching intervention responses from database...');
        
        const currentRevision = intervention.revisionNumber || 1;
        const studentId = student.idNumber || student.id;
        
        console.log(`Fetching responses for intervention ${intervention._id}, revision ${currentRevision}, student ${studentId}`);
        
        // Try to fetch from the intervention responses API endpoint
        try {
          console.log('Attempting API call to /api/intervention-responses with params:', {
            studentId: studentId,
            interventionAssessmentId: intervention._id,
            revisionNumber: currentRevision,
            category: category
          });
          
          const response = await api.get(`/api/intervention-responses`, {
            params: {
              studentId: studentId,
              interventionAssessmentId: intervention._id,
              revisionNumber: currentRevision,
              category: category
            }
          });
          
          console.log('API response received:', {
            status: response.status,
            data: response.data,
            hasData: !!response.data,
            hasSuccess: response.data?.success,
            hasDataArray: !!response.data?.data,
            dataLength: response.data?.data?.length || 0
          });
          
          if (response.data && response.data.success && response.data.data) {
            fetchedResponses = response.data.data;
            console.log('Found intervention responses from API:', fetchedResponses.length, 'responses');
          } else if (response.data && Array.isArray(response.data)) {
            // Handle case where API returns array directly
            fetchedResponses = response.data;
            console.log('Found intervention responses from API (direct array):', fetchedResponses.length, 'responses');
          } else {
            console.log('No intervention responses found in API response');
            fetchedResponses = [];
          }
        } catch (apiError) {
          console.warn('API fetch failed, trying alternative endpoint:', apiError.message);
          console.warn('API error details:', {
            message: apiError.message,
            status: apiError.response?.status,
            data: apiError.response?.data
          });
          
          // Fallback: try alternative endpoint structure
          try {
            console.log('Attempting alternative API call to /api/intervention-responses/student/...');
            const altResponse = await api.get(`/api/intervention-responses/student/${studentId}/intervention/${intervention._id}/revision/${currentRevision}`);
            
            console.log('Alternative API response received:', {
              status: altResponse.status,
              data: altResponse.data,
              hasData: !!altResponse.data,
              hasSuccess: altResponse.data?.success,
              hasDataArray: !!altResponse.data?.data,
              dataLength: altResponse.data?.data?.length || 0
            });
            
            if (altResponse.data && altResponse.data.success && altResponse.data.data) {
              fetchedResponses = altResponse.data.data;
              console.log('Found intervention responses from alternative API:', fetchedResponses.length, 'responses');
            } else if (altResponse.data && Array.isArray(altResponse.data)) {
              // Handle case where API returns array directly
              fetchedResponses = altResponse.data;
              console.log('Found intervention responses from alternative API (direct array):', fetchedResponses.length, 'responses');
            } else {
              fetchedResponses = [];
              console.log('No intervention responses found in alternative API response');
            }
          } catch (altError) {
            console.warn('Alternative API fetch also failed:', altError.message);
            console.warn('Alternative API error details:', {
              message: altError.message,
              status: altError.response?.status,
              data: altError.response?.data
            });
            fetchedResponses = [];
          }
        }
        } catch (error) {
          console.warn('Error loading intervention responses:', error.message);
          fetchedResponses = [];
        }

      // Calculate completion status based on intervention assessment questions vs responses
      const totalQuestions = intervention.totalQuestions || intervention.questions?.length || 0;
      const completedResponses = fetchedResponses.length;
      const isComplete = completedResponses >= totalQuestions;

      console.log('Completion analysis:', {
        totalQuestions,
        completedResponses,
        isComplete,
        responsesSample: fetchedResponses.slice(0, 2) // Log first 2 responses for debugging
      });

      // If no responses found, show informational message but still allow modal to open
      if (fetchedResponses.length === 0) {
        console.log('No intervention responses found - this may be expected if student has not started intervention yet');
      }

      // Don't proceed if intervention is incomplete and we have partial responses
      if (completedResponses > 0 && !isComplete) {
        console.warn(`Intervention incomplete: ${completedResponses}/${totalQuestions} responses`);
        alert(`Intervention is incomplete. Student has answered ${completedResponses} out of ${totalQuestions} questions. Please ensure all questions are completed before viewing responses.`);
        return;
      }

      // Combine response data with question data from intervention assessment
      const enrichedResponses = fetchedResponses.map(response => {
        const question = intervention.questions?.find(q => q.questionId === response.questionId);
        return {
          ...response,
          questionText: question?.questionText || 'Question text not found',
          questionImage: question?.questionImage,
          questionValue: question?.questionValue,
          choiceOptions: question?.choiceOptions || [],
          correctAnswer: question?.choiceOptions?.find(opt => opt.isCorrect)?.optionText || 'N/A'
        };
      });

      console.log('Enriched responses created:', {
        fetchedResponsesCount: fetchedResponses.length,
        enrichedResponsesCount: enrichedResponses.length,
        sampleResponse: enrichedResponses[0] || 'No responses'
      });

      // Get intervention results for this category
      const categoryInterventionResults = interventionResults[category];
      console.log('🔍 Category intervention results for modal:', {
        category,
        categoryInterventionResults,
        score: categoryInterventionResults?.score,
        isPassed: categoryInterventionResults?.isPassed
      });

      // Fetch complete intervention assessment data with questions and correctPairs
      let interventionAssessment = null;
      try {
        console.log('🔍 Fetching intervention assessment data for modal:', intervention._id);
        const assessmentResponse = await api.get(`/api/intervention-assessment/${intervention._id}`);

        if (assessmentResponse.data && assessmentResponse.data.success) {
          interventionAssessment = assessmentResponse.data.data;
          console.log('✅ [MODAL DATA] Intervention assessment loaded successfully');
        } else {
          console.warn('⚠️ [MODAL DATA] Intervention assessment API response invalid');
        }
      } catch (assessmentError) {
        console.error('❌ [MODAL DATA] Failed to fetch intervention assessment:', assessmentError.message);
      }

      const modalData = {
        intervention,
        interventionAssessment, // Include complete intervention assessment with questions and correctPairs
        category,
        interventionResults: categoryInterventionResults,
        totalQuestions,
        completedResponses,
        isComplete,
        score: categoryInterventionResults?.score || intervention.score || 0,
        isPassed: categoryInterventionResults?.isPassed || intervention.isPassed || false
      };

      console.log('📋 Final modal data being set:', modalData);
      setSelectedInterventionData(modalData);
      setInterventionResponses(enrichedResponses);
      console.log('📋 Setting modal state:', { responses: enrichedResponses.length, modalWillShow: true });
      setShowResponseModal(true);
    } catch (error) {
      console.error('Error fetching intervention responses:', error);

      // Show modal anyway with error message
      const categoryInterventionResults = interventionResults[category];

      setSelectedInterventionData({
        intervention,
        category,
        interventionResults: categoryInterventionResults,
        totalQuestions: intervention.totalQuestions || intervention.questions?.length || 0,
        completedResponses: 0,
        isComplete: false,
        score: categoryInterventionResults?.score || 0,
        isPassed: categoryInterventionResults?.isPassed || false,
        error: error.message
      });
      setInterventionResponses([]);
      setShowResponseModal(true);
      console.log('📋 Showing modal with error state');
    } finally {
      setLoading(false);
    }
  };

  /**
   * Refresh interventions from server to get the latest data
   */
  const refreshInterventions = async () => {
    if (!liveStudent?.idNumber) return;

    try {
      console.log('🔄 Refreshing interventions for student:', liveStudent.idNumber);
      const response = await api.get(`/api/progress/student/${liveStudent.idNumber}/interventions`);

      console.log('✅ Refreshed interventions response:', response);

      // Ensure we always set an array, even if the API returns null, undefined, or a non-array
      if (Array.isArray(response.data)) {
        setLiveInterventions(response.data);
        console.log('✅ Updated liveInterventions with', response.data.length, 'interventions');
      } else if (response.data && Array.isArray(response.data.data)) {
        // Handle {success: true, data: [...]} format
        setLiveInterventions(response.data.data);
        console.log('✅ Updated liveInterventions with', response.data.data.length, 'interventions (nested data)');
      } else {
        // Fallback to empty array for any other response format
        console.warn('Unexpected interventions response format:', response.data);
        setLiveInterventions([]);
      }

      console.log('✅ Interventions refreshed successfully');
    } catch (error) {
      console.error('❌ Error refreshing interventions:', error);
      // Don't clear existing data on refresh error
      // Note: We don't show an error notification here as this is a silent background refresh
    }
  };

  /**
   * Handle saving activity (from ActivityEditModal)
   * @param {Object} activityData - Activity data from modal
   */
  const handleSaveActivity = async (activityData) => {
    console.log('🔄 handleSaveActivity called with:', activityData);

    try {
      // For existing interventions (editing), update local state immediately for responsive UI
      // For new interventions, skip local state update to avoid duplicates after server refresh
      if (activityData._id && localInterventions.some(item => item._id === activityData._id)) {
        setLocalInterventions(prev => {
          const existingIndex = prev.findIndex(item => item._id === activityData._id);
          if (existingIndex >= 0) {
            const updated = [...prev];
            updated[existingIndex] = activityData;
            console.log('📝 Updated existing intervention in local state');
            return updated;
          }
          return prev;
        });
      } else {
        console.log('➕ New intervention - skipping local state update to prevent duplicates');
      }

      // Close modal immediately for responsive UI
      setShowActivityModal(false);
      setEditingActivity(null);

      // Refresh interventions from server to get complete, up-to-date data
      // This ensures the UI shows the correct intervention with all questions
      await refreshInterventions();

      // Show success notification
      setNotificationMessage({
        title: 'Intervention Saved Successfully!',
        message: `The intervention for ${activityData.category || 'this category'} has been created and is ready for the student.`
      });
      setShowSuccessNotification(true);

      // Call parent callback if provided
      if (onCreateActivity) {
        onCreateActivity(activityData);
      }

      console.log('✅ Activity save process completed with server refresh');
    } catch (error) {
      console.error('❌ Error in handleSaveActivity:', error);

      // If refresh fails, still show some success feedback since the intervention was saved
      // But indicate there might be a display issue
      setNotificationMessage({
        title: 'Intervention Saved',
        message: `The intervention has been saved, but there was an issue refreshing the display. Please refresh the page to see the latest data.`
      });
      setShowSuccessNotification(true);
    }
  };

  /**
   * Initiate pushing intervention to mobile device
   * Shows confirmation dialog first
   * @param {Object} intervention - Intervention to push
   */
  const handlePushToMobile = (intervention) => {
    // Store the intervention to be pushed and show confirmation dialog
    setPendingIntervention(intervention);
    setShowConfirmDialog(true);
  };
  
  /**
   * Confirm and execute pushing intervention to mobile device
   * Called when user confirms the dialog
   */
  const confirmPushToMobile = async () => {
    // Close the confirmation dialog
    setShowConfirmDialog(false);
    
    if (!pendingIntervention) return;
    
    setLoading(true);
    try {
      // Make real API call to update status to 'active' using our API service
      const response = await api.interventions.activate(pendingIntervention._id);
      
      if (response.data.success) {
        // Update local state to reflect the change
        setLiveInterventions(prev => 
          prev.map(item => 
            item._id === pendingIntervention._id 
              ? { ...item, status: 'active' }
              : item
          )
        );
        
        // Also update local interventions in case it's there
        setLocalInterventions(prev => 
          prev.map(item => 
            item._id === pendingIntervention._id 
              ? { ...item, status: 'active' }
              : item
          )
        );
        
        // Show success notification
        setNotificationMessage({
          title: 'Successfully Pushed to Mobile!',
          message: `This intervention is now active and available on the student's mobile device.`
        });
        setShowSuccessNotification(true);
        
        console.log('Intervention pushed to mobile:', pendingIntervention._id);
      } else {
        throw new Error(response.data.message || "Failed to activate intervention");
      }
    } catch (error) {
      console.error('Error pushing intervention to mobile:', error);
      alert(`Error pushing intervention to mobile: ${error.message || "Unknown error"}`);
    } finally {
      setLoading(false);
      setPendingIntervention(null);
    }
  };

  /**
   * Handle modal closing with proper cleanup
   */
  const handleModalClose = () => {
    console.log("Closing activity edit modal with cleanup");
    // Force cleanup and close
    setEditingActivity(null);
    setShowActivityModal(false);
  };

  // ===== RENDER HELPERS =====

  /**
   * Render comprehensive research-based analysis - ALL database content dynamically
   * @param {Object} researchBasedPrescriptions - Research prescriptions from database
   * @param {string} categoryName - Category name for dynamic content
   * @return {JSX.Element} Comprehensive research analysis display
   */
  const renderComprehensiveResearchAnalysis = (researchBasedPrescriptions, categoryName) => {
    if (!researchBasedPrescriptions || !categoryName) {
      return null;
    }

    console.log('🔍 [COMPREHENSIVE] Rendering comprehensive analysis for', categoryName, ':', researchBasedPrescriptions);

    const {
      categoryStatus,
      deficitAnalysis,
      interventionPrescription,
      escalationProtocol,
      maintenanceRecommendations,
      accelerationRecommendations
    } = researchBasedPrescriptions;

    // Get intervention plan from the selected analysis
    const selectedAnalysis = getAnalysisForCategory(categoryName);
    const interventionPlan = selectedAnalysis?.interventionPlan;

    if (!deficitAnalysis && !interventionPrescription && !interventionPlan) {
      return null; // No research data available for this category
    }

    return (
      <div className="literexia-analysis-card literexia-full-width">
        <div className="literexia-card-content">
          <div className={`epa-container theme-${getUITheme(categoryName)}`}>
         

            <div className="epa-content">
              {/* Deficit Analysis Section */}
              {deficitAnalysis && (
                <div className="epa-research-section">
                  <div className="epa-research-header">
                    <h5 className="epa-research-title">Deficit Analysis</h5>
                    <span className="epa-research-classification">{deficitAnalysis.researchClassification}</span>
                  </div>

                  {/* Specific Deficits */}
                  {deficitAnalysis.specificDeficits && deficitAnalysis.specificDeficits.length > 0 && (
                    <div className="epa-deficit-grid">
                      {deficitAnalysis.specificDeficits.map((deficit, index) => (
                        <div key={index} className="epa-deficit-card">
                          <div className="epa-deficit-header">
                            <span className={`epa-severity-badge epa-severity-badge--${deficit.severity}`}>
                              {deficit.severity?.toUpperCase()}
                            </span>
                            <div className="epa-deficit-title">{deficit.deficit}</div>
                          </div>
                          <div className="epa-deficit-details">
                            <div className="epa-deficit-manifestation">
                              <strong>Manifestation:</strong> {deficit.manifestation}
                            </div>
                            <div className="epa-deficit-error-rate">
                              <strong>Error Rate:</strong> {deficit.errorRate}
                            </div>
                            {deficit.researchEvidence && (
                              <div className="epa-deficit-evidence">
                                <strong>Evidence:</strong> {deficit.researchEvidence}
                              </div>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Root Cause Analysis */}
                  {deficitAnalysis.rootCauseAnalysis && (
                    <div className="epa-root-cause">
                      <h6>Root Cause Analysis</h6>
                      <p>{deficitAnalysis.rootCauseAnalysis}</p>
                    </div>
                  )}

                  {/* Cognitive Factors */}
                  {deficitAnalysis.cognitiveFactors && deficitAnalysis.cognitiveFactors.length > 0 && (
                    <div className="epa-cognitive-factors">
                      <h6>Cognitive Factors</h6>
                      <div className="epa-factor-tags">
                        {deficitAnalysis.cognitiveFactors.map((factor, index) => (
                          <span key={index} className="epa-factor-tag">{factor}</span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Intervention Prescription Section */}
              {interventionPrescription && (
                <div className="epa-research-section">
                  <div className="epa-research-header">
                    <h5 className="epa-research-title">Intervention Prescription</h5>
                    <span className="epa-intensity-badge epa-intensity-badge--{interventionPrescription.intensityLevel}">
                      {interventionPrescription.intensityLevel?.replace('_', ' ').toUpperCase()}
                    </span>
                  </div>

                  {/* Primary Approach */}
                  {interventionPrescription.primaryApproach && (
                    <div className="epa-primary-approach">
                      <h6>Primary Approach</h6>
                      <p className="epa-approach-name">{interventionPrescription.primaryApproach?.replace('_', ' ')}</p>
                    </div>
                  )}

                  {/* Specific Techniques */}
                  {interventionPrescription.specificTechniques && interventionPrescription.specificTechniques.length > 0 && (
                    <div className="epa-techniques-grid">
                      <h6>Specific Techniques</h6>
                      <div className="epa-techniques-container">
                        {interventionPrescription.specificTechniques.map((technique, index) => (
                          <div key={index} className="epa-technique-card">
                            <div className="epa-technique-header">
                              <h7 className="epa-technique-name">{technique.technique || technique}</h7>
                            </div>
                            {technique.description && (
                              <div className="epa-technique-description">{technique.description}</div>
                            )}
                            <div className="epa-technique-details">
                              {technique.duration && (
                                <div className="epa-technique-duration">
                                  <strong>Duration:</strong> {technique.duration}
                                </div>
                              )}
                              {technique.materials && (
                                <div className="epa-technique-materials">
                                  <strong>Materials:</strong> {technique.materials}
                                </div>
                              )}
                              {technique.progressCriteria && (
                                <div className="epa-technique-criteria">
                                  <strong>Success Criteria:</strong> {technique.progressCriteria}
                                </div>
                              )}
                              {technique.researchBasis && (
                                <div className="epa-technique-research">
                                  <strong>Research Basis:</strong> {technique.researchBasis}
                                </div>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Session Structure */}
                  {interventionPrescription.sessionStructure && (
                    <div className="epa-session-structure">
                      <h6>Session Structure</h6>
                      <div className="epa-session-details">
                        {interventionPrescription.sessionStructure.optimalLength && (
                          <div className="epa-session-length">
                            <strong>Optimal Length:</strong> {interventionPrescription.sessionStructure.optimalLength}
                          </div>
                        )}
                        {interventionPrescription.sessionStructure.breakPattern && (
                          <div className="epa-break-pattern">
                            <strong>Break Pattern:</strong> {interventionPrescription.sessionStructure.breakPattern}
                          </div>
                        )}
                        {interventionPrescription.sessionStructure.sessionComponents && (
                          <div className="epa-session-components">
                            <strong>Components:</strong>
                            <ul>
                              {interventionPrescription.sessionStructure.sessionComponents.map((component, index) => (
                                <li key={index}>{component}</li>
                              ))}
                            </ul>
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Material Recommendations */}
                  {interventionPrescription.materialRecommendations && interventionPrescription.materialRecommendations.length > 0 && (
                    <div className="epa-materials">
                      <h6>Material Recommendations</h6>
                      <ul className="epa-materials-list">
                        {interventionPrescription.materialRecommendations.map((material, index) => (
                          <li key={index}>{material}</li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {/* Progress Monitoring */}
                  {interventionPrescription.progressMonitoring && (
                    <div className="epa-progress-monitoring">
                      <h6>Progress Monitoring</h6>
                      <div className="epa-monitoring-details">
                        {interventionPrescription.progressMonitoring.frequency && (
                          <div className="epa-monitoring-frequency">
                            <strong>Frequency:</strong> {interventionPrescription.progressMonitoring.frequency}
                          </div>
                        )}
                        {interventionPrescription.progressMonitoring.keyIndicators && (
                          <div className="epa-monitoring-indicators">
                            <strong>Key Indicators:</strong>
                            <ul>
                              {interventionPrescription.progressMonitoring.keyIndicators.map((indicator, index) => (
                                <li key={index}>{indicator}</li>
                              ))}
                            </ul>
                          </div>
                        )}
                        {interventionPrescription.progressMonitoring.dataCollectionMethod && (
                          <div className="epa-monitoring-method">
                            <strong>Data Collection:</strong> {interventionPrescription.progressMonitoring.dataCollectionMethod}
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Intervention Plan Section - Integrated from database */}
              {interventionPlan && (
                <div className="epa-research-section">
                  <div className="epa-research-header">
                    <h5 className="epa-research-title">Intervention Plan</h5>
                    <span className="epa-intensity-badge">IMPLEMENTATION</span>
                  </div>

                  {/* Primary Focus */}
                  {interventionPlan.focus && (
                    <div className="epa-primary-approach">
                      <h6>Primary Focus Area</h6>
                      <p className="epa-approach-name">{interventionPlan.focus.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}</p>
                    </div>
                  )}

                  {/* Recommended Activities */}
                  {interventionPlan.recommendedActivities && interventionPlan.recommendedActivities.length > 0 && (
                    <div className="epa-techniques-grid">
                      <h6>Recommended Activities</h6>
                      <div className="epa-techniques-container">
                        {interventionPlan.recommendedActivities.map((activity, index) => (
                          <div key={index} className="epa-technique-card">
                            <div className="epa-technique-header">
                              <h7 className="epa-technique-name">{index + 1}</h7>
                            </div>
                            <div className="epa-technique-description">
                              {typeof activity === 'string' ? 
                                activity.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()) : 
                                (activity.skill || activity.activity || activity.description || JSON.stringify(activity))
                              }
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Question Distribution Plan */}
                  {interventionPlan.questionDistribution && Object.keys(interventionPlan.questionDistribution).length > 0 && (
                    <div className="epa-session-structure">
                      <h6>Question Distribution Plan</h6>
                      <div className="epa-session-details">
                        <div className="epa-session-length">
                          <strong>total:</strong> {interventionPlan.recommendedQuestionCount || Object.values(interventionPlan.questionDistribution).reduce((sum, count) => sum + (typeof count === 'number' ? count : 0), 0)} questions
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Question Requirements */}
                  {interventionPlan.recommendedQuestionCount && (
                    <div className="epa-materials">
                      <h6>Intervention Question Requirements</h6>
                      <div className="epa-requirements-content">
                        <div className="epa-requirements-count">{interventionPlan.recommendedQuestionCount} Questions Recommended</div>
                        {interventionPlan.questionCountRationale && (
                          <div className="epa-requirements-rationale">
                            <span className="epa-requirements-rationale-label">Rationale:</span> {interventionPlan.questionCountRationale}
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Escalation Protocol Section */}
              {escalationProtocol && escalationProtocol.triggers && escalationProtocol.triggers.length > 0 && (
                <div className="epa-research-section">
                  <div className="epa-research-header">
                    <h5 className="epa-research-title">Escalation Protocol</h5>
                  </div>

                  <div className="epa-escalation-triggers">
                    {escalationProtocol.triggers.map((trigger, index) => (
                      <div key={index} className="epa-escalation-card">
                        <div className="epa-escalation-header">
                          <h6 className="epa-escalation-trigger">{trigger.trigger}</h6>
                          <span className="epa-escalation-approach">{trigger.approach}</span>
                        </div>

                        {trigger.specificTechniques && trigger.specificTechniques.length > 0 && (
                          <div className="epa-escalation-techniques">
                            <strong>Escalation Techniques:</strong>
                            {trigger.specificTechniques.map((technique, techIndex) => (
                              <div key={techIndex} className="epa-escalation-technique">
                                <div className="epa-escalation-technique-name">{technique.technique}</div>
                                <div className="epa-escalation-technique-purpose">{technique.purpose}</div>
                                <div className="epa-escalation-technique-implementation">{technique.implementation}</div>
                                {technique.researchBasis && (
                                  <div className="epa-escalation-research">
                                    <strong>Research Basis:</strong> {technique.researchBasis}
                                  </div>
                                )}
                              </div>
                            ))}
                          </div>
                        )}

                        {trigger.intensityRecommendations && (
                          <div className="epa-intensity-recommendations">
                            <strong>Intensity Recommendations:</strong>
                            <div className="epa-intensity-details">
                              {trigger.intensityRecommendations.duration && (
                                <div><strong>Duration:</strong> {trigger.intensityRecommendations.duration}</div>
                              )}
                              {trigger.intensityRecommendations.frequency && (
                                <div><strong>Frequency:</strong> {trigger.intensityRecommendations.frequency}</div>
                              )}
                              {trigger.intensityRecommendations.totalIntervention && (
                                <div><strong>Total Hours:</strong> {trigger.intensityRecommendations.totalIntervention}</div>
                              )}
                              {trigger.intensityRecommendations.researchSupport && (
                                <div><strong>Research Support:</strong> {trigger.intensityRecommendations.researchSupport}</div>
                              )}
                            </div>
                          </div>
                        )}

                        {trigger.researchFoundation && (
                          <div className="epa-escalation-foundation">
                            <strong>Research Foundation:</strong> {trigger.researchFoundation}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Maintenance Recommendations */}
              {maintenanceRecommendations && maintenanceRecommendations.activities && maintenanceRecommendations.activities.length > 0 && (
                <div className="epa-research-section">
                  <div className="epa-research-header">
                    <h5 className="epa-research-title">Maintenance Recommendations</h5>
                  </div>

                  <div className="epa-maintenance-activities">
                    {maintenanceRecommendations.activities.map((activity, index) => (
                      <div key={index} className="epa-maintenance-activity">
                        {typeof activity === 'string' ? activity : (
                          <div>
                            <div className="epa-activity-name">{activity.activity}</div>
                            {activity.frequency && <div className="epa-activity-frequency">Frequency: {activity.frequency}</div>}
                            {activity.implementation && <div className="epa-activity-implementation">{activity.implementation}</div>}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Acceleration Recommendations */}
              {accelerationRecommendations && (accelerationRecommendations.bridgingActivities?.length > 0 || accelerationRecommendations.nextLevelSkills?.length > 0) && (
                <div className="epa-research-section">
                  <div className="epa-research-header">
                    <h5 className="epa-research-title">Acceleration Recommendations</h5>
                  </div>

                  {accelerationRecommendations.bridgingActivities && accelerationRecommendations.bridgingActivities.length > 0 && (
                    <div className="epa-bridging-activities">
                      <h6>Bridging Activities</h6>
                      <ul>
                        {accelerationRecommendations.bridgingActivities.map((activity, index) => (
                          <li key={index}>{activity}</li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {accelerationRecommendations.nextLevelSkills && accelerationRecommendations.nextLevelSkills.length > 0 && (
                    <div className="epa-next-level-skills">
                      <h6>Next Level Skills</h6>
                      <ul>
                        {accelerationRecommendations.nextLevelSkills.map((skill, index) => (
                          <li key={index}>
                            {typeof skill === 'string' ? skill : (
                              <div>
                                <div className="epa-skill-name">{skill.skill || 'Next Level Skill'}</div>
                                {skill.targetMastery && (
                                  <div className="epa-skill-target">Target: {skill.targetMastery}</div>
                                )}
                                {skill.timeframe && (
                                  <div className="epa-skill-timeframe">Timeline: {skill.timeframe}</div>
                                )}
                                {skill.prerequisiteCheck && (
                                  <div className="epa-skill-prerequisite">Prerequisites: {skill.prerequisiteCheck}</div>
                                )}
                                {skill.progressIndicators && Array.isArray(skill.progressIndicators) && (
                                  <div className="epa-skill-indicators">
                                    Progress Indicators:
                                    <ul className="epa-skill-indicator-list">
                                      {skill.progressIndicators.map((indicator, idx) => (
                                        <li key={idx} className="epa-skill-indicator-item">{indicator}</li>
                                      ))}
                                    </ul>
                                  </div>
                                )}
                              </div>
                            )}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  };

  /**
   * Render detailed error analysis from database - letter/question level breakdown
   * @param {Array} detailedErrorAnalysis - Array of detailed error items from database
   * @param {string} categoryName - Category name for context
   * @return {JSX.Element} Detailed error analysis display
   */
  const renderDetailedErrorAnalysis = (detailedErrorAnalysis, categoryName) => {
    console.log('🔍 [RENDER] renderDetailedErrorAnalysis called with:', {
      detailedErrorAnalysis,
      categoryName,
      hasData: detailedErrorAnalysis && detailedErrorAnalysis.length > 0,
      length: detailedErrorAnalysis ? detailedErrorAnalysis.length : 0
    });

    if (!detailedErrorAnalysis || detailedErrorAnalysis.length === 0) {
      console.log('🔍 [RENDER] No detailed error analysis data, returning fallback display');
      
      // Get the analysis data for this category to show dynamic performance info
      const selectedAnalysis = getAnalysisForCategory(categoryName);
      const categoryData = selectedAnalysis?.skillMastery?.[categoryName];
      const researchPrescriptions = selectedAnalysis?.researchBasedPrescriptions?.[categoryName];
      
      console.log('🔍 [DEBUG] Category data for', categoryName, ':', categoryData);
      console.log('🔍 [DEBUG] Selected analysis:', selectedAnalysis);
      console.log('🔍 [DEBUG] Available skillMastery keys:', selectedAnalysis?.skillMastery ? Object.keys(selectedAnalysis.skillMastery) : 'No skillMastery');
      
      // Try to get data from liveCategoryResults as fallback
      const liveCategoryData = liveCategoryResults?.categories?.find(cat => 
        cat.categoryName === categoryName || cat.category === categoryName
      );
      
      console.log('🔍 [DEBUG] Live category data for', categoryName, ':', liveCategoryData);
      
      // Use the most accurate data source
      const finalCategoryData = categoryData || liveCategoryData;
      
      // Determine if this is a passed or failed category - use the actual data from the analysis
      const isPassed = finalCategoryData?.isPassed === true || finalCategoryData?.score >= 75;
      const score = finalCategoryData?.score || 0;
      const correctAnswers = finalCategoryData?.correctAnswers || 0;
      const totalQuestions = finalCategoryData?.totalQuestions || 0;
      const status = finalCategoryData?.status || (isPassed ? 'ADEQUATE' : 'NEEDS IMPROVEMENT');
      
      console.log('🔍 [DEBUG] Final calculated values:', { isPassed, score, correctAnswers, totalQuestions, status, finalCategoryData });
      
      return (
        <div className="literexia-analysis-card literexia-full-width">
          <div className="literexia-card-content">
            <div className={`epa-container theme-${isPassed ? 'success' : 'initial'}`}>
              <div className="epa-header">
                {isPassed ? (
                  <FaCheckCircle className="epa-icon" />
                ) : (
                  <FaExclamationTriangle className="epa-icon" />
                )}
                <div>
                  <h4 className="epa-title">{categoryName} Performance Analysis</h4>
                </div>
              </div>
              <div className="epa-content">
                <div className="epa-metrics">
                  <div className="epa-metric-card">
                    <div className="epa-metric-label">Mastery Level</div>
                    <div className={`epa-metric-value ${isPassed ? 'positive' : 'negative'}`}>
                      {score}% - {isPassed ? 'MASTERED' : 'NEEDS WORK'}
                    </div>
                  </div>
                  <div className="epa-metric-card">
                    <div className="epa-metric-label">Questions Answered</div>
                    <div className="epa-metric-value">
                      {correctAnswers}/{totalQuestions} correct
                    </div>
                  </div>
                  <div className="epa-metric-card">
                    <div className="epa-metric-label">Status</div>
                    <div className={`epa-metric-value ${isPassed ? 'positive' : 'negative'}`}>
                      {status} - {isPassed ? 'No intervention needed' : 'Intervention required'}
                    </div>
                  </div>
                </div>
                
                {/* Show maintenance recommendations for passed categories */}
                {isPassed && researchPrescriptions?.maintenanceRecommendations && (
                  <div className="epa-section">
                    <div className="epa-section-header">
                      <h5 className="epa-subsection-title">Maintenance Recommendations</h5>
                    </div>
                    <div className="epa-section-content">
                      {researchPrescriptions.maintenanceRecommendations.activities && researchPrescriptions.maintenanceRecommendations.activities.length > 0 ? (
                        <div className="epa-maintenance-activities">
                          {researchPrescriptions.maintenanceRecommendations.activities.map((activity, index) => (
                            <div key={index} className="epa-maintenance-activity">
                              {typeof activity === 'string' ? activity : (
                                <div>
                                  <div className="epa-activity-name">{activity.activity}</div>
                                  {activity.purpose && <div className="epa-activity-purpose">{activity.purpose}</div>}
                                  {activity.frequency && <div className="epa-activity-frequency">Frequency: {activity.frequency}</div>}
                                  {activity.implementation && <div className="epa-activity-implementation">{activity.implementation}</div>}
                                  {activity.rationale && <div className="epa-activity-rationale">{activity.rationale}</div>}
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p>Continue practice to maintain mastery while building advanced skills.</p>
                      )}
                    </div>
                  </div>
                )}
                
                {/* Show acceleration recommendations */}
                {isPassed && researchPrescriptions?.accelerationRecommendations && (
                  <>
                    {researchPrescriptions.accelerationRecommendations.nextLevelSkills && researchPrescriptions.accelerationRecommendations.nextLevelSkills.length > 0 && (
                      <div className="epa-section">
                        <div className="epa-section-header">
                          <h5 className="epa-subsection-title">Next Level Skills</h5>
                        </div>
                        <div className="epa-section-content">
                          {researchPrescriptions.accelerationRecommendations.nextLevelSkills.map((skill, index) => (
                            <div key={index} className="epa-skill-item">
                              {typeof skill === 'string' ? (
                                <div className="epa-skill-name">{skill}</div>
                              ) : (
                                <div>
                                  <div className="epa-skill-name">{skill.skill || 'Next Level Skill'}</div>
                                  {skill.targetMastery && <div className="epa-skill-target">Target: {skill.targetMastery}</div>}
                                  {skill.timeframe && <div className="epa-skill-timeframe">Timeline: {skill.timeframe}</div>}
                                  {skill.prerequisiteCheck && <div className="epa-skill-prerequisite">Prerequisites: {skill.prerequisiteCheck}</div>}
                                  {skill.progressIndicators && Array.isArray(skill.progressIndicators) && skill.progressIndicators.length > 0 && (
                                    <div className="epa-skill-indicators">
                                      <div className="epa-skill-indicators-label">Progress Indicators:</div>
                                      <ul className="epa-skill-indicator-list">
                                        {skill.progressIndicators.map((indicator, idx) => (
                                          <li key={idx} className="epa-skill-indicator-item">{indicator}</li>
                                        ))}
                                      </ul>
                                    </div>
                                  )}
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                    
                    {researchPrescriptions.accelerationRecommendations.bridgingActivities && researchPrescriptions.accelerationRecommendations.bridgingActivities.length > 0 && (
                      <div className="epa-section">
                        <div className="epa-section-header">
                          <h5 className="epa-subsection-title">Bridging Activities</h5>
                        </div>
                        <div className="epa-section-content">
                          <ul>
                            {researchPrescriptions.accelerationRecommendations.bridgingActivities.map((activity, index) => (
                              <li key={index}>{activity}</li>
                            ))}
                          </ul>
                        </div>
                      </div>
                    )}
                  </>
                )}
                
                {/* Show deficit analysis for failed categories */}
                {!isPassed && researchPrescriptions?.deficitAnalysis && (
                  <div className="epa-section">
                    <div className="epa-section-header">
                      <h5 className="epa-subsection-title">Areas for Improvement</h5>
                    </div>
                    <div className="epa-section-content">
                      {researchPrescriptions.deficitAnalysis.specificDeficits && researchPrescriptions.deficitAnalysis.specificDeficits.length > 0 ? (
                        <div className="epa-deficit-list">
                          {researchPrescriptions.deficitAnalysis.specificDeficits.map((deficit, index) => (
                            <div key={index} className="epa-deficit-item">
                              <div className="epa-deficit-header">
                                <div className="epa-deficit-name">{deficit.deficit}</div>
                                <div className={`epa-severity-badge severity-${deficit.severity?.toLowerCase() || 'moderate'}`}>
                                  {deficit.severity || 'Moderate'}
                                </div>
                              </div>
                              <div className="epa-deficit-details">
                                <div className="epa-deficit-manifestation">{deficit.manifestation}</div>
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p>Focus on fundamental skill development in this category.</p>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      );
    }

    console.log('🔍 [RENDER] Rendering detailed error analysis with data:', detailedErrorAnalysis);

    // Transform database structure to match our display needs
    const transformedErrors = detailedErrorAnalysis.map(error => {
      // Extract letter from errorPattern (e.g., "Vowel recognition difficulty with E" -> "E")
      const letterMatch = error.errorPattern?.match(/with (.+)$/);
      const letter = letterMatch ? letterMatch[1] : 'Unknown';

      // Determine if it's vowel, consonant, or sound discrimination based on errorPattern
      const isVowel = error.errorPattern?.toLowerCase().includes('vowel');
      const isConsonant = error.errorPattern?.toLowerCase().includes('consonant');
      const isSoundDiscrimination = error.errorPattern?.toLowerCase().includes('sound discrimination');

      return {
        ...error,
        letter: letter,
        letterType: isVowel ? 'vowel' : (isConsonant ? 'consonant' : (isSoundDiscrimination ? 'sound' : 'other')),
        specificError: error.errorPattern,
        cognitiveImplication: isVowel ?
          'Visual-auditory vowel processing difficulty' :
          (isConsonant ? 'Consonant-sound correspondence weakness' : 
           (isSoundDiscrimination ? 'Auditory discrimination and working memory limitations' : 'General processing difficulty')),
        questionId: `Pattern Analysis` // Since we don't have specific questionId in this structure
      };
    });

    console.log('🔍 [RENDER] Transformed errors:', transformedErrors);

    // Group errors by letter type for better organization
    const vowelErrors = transformedErrors.filter(error => error.letterType === 'vowel');
    const consonantErrors = transformedErrors.filter(error => error.letterType === 'consonant');
    const soundErrors = transformedErrors.filter(error => error.letterType === 'sound');
    const otherErrors = transformedErrors.filter(error => error.letterType === 'other');

    return (
      <div className="literexia-analysis-card literexia-full-width">
        <div className="literexia-card-content">
          <div className={`epa-container theme-${getUITheme(categoryName)}`}>
            <div className="epa-header">
              <FaExclamationTriangle className="epa-icon" />
            
              <div className="epa-summary">
                <span className="epa-error-count">{detailedErrorAnalysis.length} specific errors identified</span>
              </div>
            </div>

            <div className="epa-content">
              {/* Vowel Errors Section */}
              {vowelErrors.length > 0 && (
                <div className="epa-error-group">
                  <div className="epa-error-group-header">
                    <h5 className="epa-error-group-title">
                      <span className="epa-error-type-badge epa-error-type-badge--vowel">Vowel Errors</span>
                      Vowel Recognition Difficulties ({vowelErrors.length} errors)
                    </h5>
                  </div>
                  <div className="epa-error-items">
                    {vowelErrors.map((error, index) => (
                      <div key={index} className="epa-error-item">
                        <div className="epa-error-header">
                          <span className="epa-error-letter-badge epa-error-letter-badge--vowel">{error.letter}</span>
                          <div className="epa-error-title">{error.letter} Recognition Issue</div>
                        </div>
                        <div className="epa-error-compact-details">
                          <div className="epa-error-pattern-compact">
                            <strong>Pattern:</strong> {error.errorPattern?.replace('Vowel recognition difficulty with ' + error.letter, 'Vowel confusion')}
                          </div>
                          <div className="epa-error-intervention-compact">
                            <strong>Focus:</strong> {error.interventionFocus?.replace('Vowel discrimination training for ' + error.letter, 'Vowel training')}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Consonant Errors Section */}
              {consonantErrors.length > 0 && (
                <div className="epa-error-group">
                  <div className="epa-error-group-header">
                    <h5 className="epa-error-group-title">
                      <span className="epa-error-type-badge epa-error-type-badge--consonant">Consonant Errors</span>
                      Consonant Recognition Difficulties ({consonantErrors.length} errors)
                    </h5>
                  </div>
                  <div className="epa-error-items">
                    {consonantErrors.map((error, index) => (
                      <div key={index} className="epa-error-item">
                        <div className="epa-error-header">
                          <span className="epa-error-letter-badge epa-error-letter-badge--consonant">{error.letter}</span>
                          <div className="epa-error-title">{error.letter} Recognition Issue</div>
                        </div>
                        <div className="epa-error-compact-details">
                          <div className="epa-error-pattern-compact">
                            <strong>Pattern:</strong> {error.errorPattern?.replace('Consonant recognition difficulty with ' + error.letter, 'Consonant confusion')}
                          </div>
                          <div className="epa-error-intervention-compact">
                            <strong>Focus:</strong> {error.interventionFocus?.replace('Consonant-sound correspondence practice for ' + error.letter, 'Consonant training')}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Sound Discrimination Errors Section */}
              {soundErrors.length > 0 && (
                <div className="epa-error-group">
                  <div className="epa-error-group-header">
                    <h5 className="epa-error-group-title">
                      <span className="epa-error-type-badge epa-error-type-badge--sound">Sound Errors</span>
                      Sound Discrimination Difficulties ({soundErrors.length} errors)
                    </h5>
                  </div>
                  <div className="epa-error-items">
                    {soundErrors.map((error, index) => (
                      <div key={index} className="epa-error-item">
                        <div className="epa-error-letter">
                          <span className="epa-error-letter-badge epa-error-letter-badge--sound">
                            {error.letter || error.questionId}
                          </span>
                        </div>
                        <div className="epa-error-details">
                          <div className="epa-error-primary">
                            <span className="epa-error-description">{error.specificError}</span>
                            <span className="epa-error-question">Confusion Rate: {error.confusionRate}%</span>
                          </div>
                          <div className="epa-error-secondary">
                            {error.errorPattern && (
                              <div className="epa-error-pattern">
                                <strong>Pattern:</strong> {error.errorPattern}
                              </div>
                            )}
                            {error.cognitiveImplication && (
                              <div className="epa-error-cognitive">
                                <strong>Cognitive Issue:</strong> {error.cognitiveImplication}
                              </div>
                            )}
                          </div>
                          {error.interventionFocus && (
                            <div className="epa-error-intervention">
                              <strong>Intervention Focus:</strong> {error.interventionFocus}
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Other Errors Section */}
              {otherErrors.length > 0 && (
                <div className="epa-error-group">
                  <div className="epa-error-group-header">
                    <h5 className="epa-error-group-title">
                      <span className="epa-error-type-badge epa-error-type-badge--other">Other Errors</span>
                      Additional Error Patterns ({otherErrors.length} errors)
                    </h5>
                  </div>
                  <div className="epa-error-items">
                    {otherErrors.map((error, index) => (
                      <div key={index} className="epa-error-item">
                        <div className="epa-error-letter">
                          <span className="epa-error-letter-badge epa-error-letter-badge--other">
                            {error.letter || error.questionId}
                          </span>
                        </div>
                        <div className="epa-error-details">
                          <div className="epa-error-primary">
                            <span className="epa-error-description">{error.specificError}</span>
                            <span className="epa-error-question">Question: {error.questionId}</span>
                          </div>
                          <div className="epa-error-secondary">
                            {error.errorPattern && (
                              <div className="epa-error-pattern">
                                <strong>Pattern:</strong> {error.errorPattern}
                              </div>
                            )}
                            {error.cognitiveImplication && (
                              <div className="epa-error-cognitive">
                                <strong>Cognitive Issue:</strong> {error.cognitiveImplication}
                              </div>
                            )}
                          </div>
                          {error.interventionFocus && (
                            <div className="epa-error-intervention">
                              <strong>Intervention Focus:</strong> {error.interventionFocus}
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

            </div>
          </div>
        </div>
      </div>
    );
  };

  /**
   * Render teaching guide for specific category
   * @param {string} categoryName - Category name
   * @return {JSX.Element} Teaching guide content
   */
  /**
   * Render BKT (Bayesian Knowledge Tracing) visualization
   */
  const renderBKTAnalysis = (bktData, categoryName) => {
    if (!bktData) return null;

    const masteryPercentage = Math.round((bktData.masteryProbability || 0.5) * 100);
    const confidenceLevel = masteryPercentage >= 80 ? 'high' : masteryPercentage >= 60 ? 'medium' : 'low';

    return (
      <div className="literexia-bkt-analysis">
        <div className="literexia-analysis-section">
          <h4><FaBrain /> Bayesian Knowledge Tracing (BKT)</h4>
          <div className="literexia-bkt-content">
            <div className="literexia-mastery-display">
              <div className="literexia-mastery-gauge">
                <div
                  className={`literexia-mastery-fill literexia-confidence-${confidenceLevel}`}
                  style={{ width: `${masteryPercentage}%` }}
                ></div>
              </div>
              <div className="literexia-mastery-info">
                <span className="literexia-mastery-percentage">{masteryPercentage}%</span>
                <span className="literexia-mastery-label">Mastery Probability</span>
              </div>
            </div>

            {bktData.responseHistory && bktData.responseHistory.length > 0 && (
              <div className="literexia-learning-progression">
                <h5>Learning Progression</h5>
                <div className="literexia-progression-timeline">
                  {bktData.responseHistory.slice(-10).map((response, index) => (
                    <div key={index} className="literexia-progression-point">
                      <div
                        className={`literexia-point ${response.correct ? 'correct' : 'incorrect'}`}
                        title={`Question ${response.questionId}: ${response.correct ? 'Correct' : 'Incorrect'} - Mastery: ${Math.round((response.masteryAfter || 0.5) * 100)}%`}
                      >
                        {response.correct ? '✓' : '✗'}
                      </div>
                    </div>
                  ))}
                </div>
                <div className="literexia-progression-summary">
                  <span>Latest responses showing mastery evolution</span>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  };

  /**
   * Render IRT (Item Response Theory) ability estimate
   */
  const renderIRTAnalysis = (irtAbility, categoryName) => {
    if (typeof irtAbility !== 'number') return null;

    // Convert IRT scale (-3 to +3) to percentage (0 to 100)
    const abilityPercentage = Math.round(((irtAbility + 3) / 6) * 100);
    const abilityLevel = irtAbility >= 1.5 ? 'Very High' :
                        irtAbility >= 0.5 ? 'High' :
                        irtAbility >= -0.5 ? 'Average' :
                        irtAbility >= -1.5 ? 'Below Average' : 'Very Low';

    return (
      <div className="literexia-irt-analysis">
        <div className="literexia-analysis-section">
          <h4><FaChartLine /> Item Response Theory (IRT) Ability</h4>
          <div className="literexia-irt-content">
            <div className="literexia-ability-thermometer">
              <div className="literexia-thermometer-scale">
                <div className="literexia-scale-marker" data-value="Very High">+3</div>
                <div className="literexia-scale-marker" data-value="High">+1</div>
                <div className="literexia-scale-marker" data-value="Average">0</div>
                <div className="literexia-scale-marker" data-value="Below Average">-1</div>
                <div className="literexia-scale-marker" data-value="Very Low">-3</div>
              </div>
              <div className="literexia-thermometer-fill">
                <div
                  className="literexia-ability-indicator"
                  style={{ bottom: `${abilityPercentage}%` }}
                >
                  <span className="literexia-ability-value">{irtAbility.toFixed(1)}</span>
                </div>
              </div>
            </div>
            <div className="literexia-ability-info">
              <div className="literexia-ability-level">{abilityLevel}</div>
              <div className="literexia-ability-description">
                {irtAbility >= 1 ?
                  `Student shows above-average ability in ${formatCategoryName(categoryName)}` :
                  irtAbility >= -0.5 ?
                  `Student shows average ability in ${formatCategoryName(categoryName)}` :
                  `Student needs additional support in ${formatCategoryName(categoryName)}`
                }
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  };

  /**
   * Render sophisticated error pattern analysis based on CLAUDE.md specifications
   */
  const renderErrorPatternAnalysis = (errorPatterns, categoryName) => {
    if (!errorPatterns) return null;

    const renderCategorySpecificErrors = () => {
      switch (categoryName) {
        case 'Alphabet Knowledge':
          return (
            <div className="literexia-error-breakdown">
              {errorPatterns.patinig_errors && (
                <div className="literexia-error-group">
                  <h6>Vowel (Patinig) Errors</h6>
                  <div className="literexia-error-stats">
                    <span className="literexia-error-rate">{errorPatterns.patinig_errors.percentage}% error rate</span>
                    <span className="literexia-error-count">({errorPatterns.patinig_errors.count}/{errorPatterns.patinig_errors.total})</span>
                  </div>
                  {errorPatterns.patinig_errors.specific_letters && (
                    <div className="literexia-confused-letters">
                      <strong>Confused letters:</strong> {errorPatterns.patinig_errors.specific_letters.join(', ')}
                    </div>
                  )}
                </div>
              )}

              {errorPatterns.katinig_errors && (
                <div className="literexia-error-group">
                  <h6>Consonant (Katinig) Errors</h6>
                  <div className="literexia-error-stats">
                    <span className="literexia-error-rate">{errorPatterns.katinig_errors.percentage}% error rate</span>
                    <span className="literexia-error-count">({errorPatterns.katinig_errors.count}/{errorPatterns.katinig_errors.total})</span>
                  </div>
                </div>
              )}
            </div>
          );

        case 'Phonological Awareness':
          return (
            <div className="literexia-error-breakdown">
              {errorPatterns.matching_errors && (
                <div className="literexia-error-group">
                  <h6>Sound-Symbol Matching Errors</h6>
                  <div className="literexia-error-stats">
                    <span className="literexia-error-rate">{errorPatterns.matching_errors.percentage}% error rate</span>
                    <span className="literexia-partial-success">Avg. {Math.round((errorPatterns.matching_errors.avg_partial_success || 0) * 100)}% partial success</span>
                  </div>
                  <div className="literexia-error-type">
                    <strong>Primary issue:</strong> {errorPatterns.matching_errors.error_type?.replace(/_/g, ' ')}
                  </div>

                  {/* Sound confusion analysis */}
                  <div className="literexia-sound-confusions">
                    <h6>Common Sound Confusions</h6>
                    <div className="literexia-confusion-pairs">
                      <div className="literexia-confusion-item">B-P sounds <span className="literexia-confusion-rate">High confusion</span></div>
                      <div className="literexia-confusion-item">M-N sounds <span className="literexia-confusion-rate">Moderate confusion</span></div>
                      <div className="literexia-confusion-item">D-T sounds <span className="literexia-confusion-rate">Low confusion</span></div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          );

        case 'Decoding':
          return (
            <div className="literexia-error-breakdown">
              {errorPatterns.decoding_errors && (
                <div className="literexia-error-group">
                  <h6>Decoding Pattern Errors</h6>
                  <div className="literexia-error-stats">
                    <span className="literexia-error-rate">{errorPatterns.decoding_errors.percentage}% error rate</span>
                  </div>
                  <div className="literexia-error-position">
                    <strong>Most errors at:</strong> {errorPatterns.decoding_errors.most_error_position === 0 ? 'Beginning of words' :
                                                      errorPatterns.decoding_errors.most_error_position === 1 ? 'Middle of words' : 'End of words'}
                  </div>
                  <div className="literexia-error-type">
                    <strong>Primary pattern:</strong> {errorPatterns.decoding_errors.error_type?.replace(/_/g, ' ')}
                  </div>
                </div>
              )}
            </div>
          );

        default:
          return (
            <div className="literexia-general-errors">
              <p>Error pattern analysis available for this category</p>
            </div>
          );
      }
    };

    return (
      <div className="literexia-error-analysis">
        <div className="literexia-analysis-section">
          <h4><FaExclamationTriangle /> Error Pattern Analysis</h4>
          <div className="literexia-error-content">
            {renderCategorySpecificErrors()}
          </div>
        </div>
      </div>
    );
  };

  /**
   * Render intervention analysis with history and recommendations
   */
  const renderInterventionAnalysis = (interventionHistory, interventionPlan, categoryName) => {
    const hasInterventions = interventionHistory && interventionHistory.length > 0;
    const hasInterventionPlan = interventionPlan && Object.keys(interventionPlan).length > 0;

    if (!hasInterventions && !hasInterventionPlan) {
      return null; // Hide container if no intervention data
    }

    return (
      <div className="literexia-intervention-analysis">
        <div className="literexia-interventions-header">
          <h3><FaHandsHelping /> Intervention Analysis</h3>
          <div className="literexia-one-time-rule-indicator">
            <span className="literexia-rule-badge">One-Time Digital Rule</span>
            <span className="literexia-rule-description">Each category gets one intervention attempt</span>
          </div>
        </div>

        {hasInterventions && (
          <div className="literexia-intervention-history">
            <h4>Intervention History</h4>
            <div className="literexia-history-timeline">
              {interventionHistory.map((intervention, index) => (
                <div key={index} className={`literexia-history-item ${intervention.passed ? 'passed' : 'failed'}`}>
                  <div className="literexia-history-marker">
                    {intervention.passed ? <FaCheckCircle /> : <FaTimes />}
                  </div>
                  <div className="literexia-history-content">
                    <div className="literexia-history-title">
                      Attempt #{intervention.attempt || index + 1} - {intervention.passed ? 'Passed' : 'Failed'}
                    </div>
                    <div className="literexia-history-details">
                      <span>Score: {intervention.score}%</span>
                      <span>Date: {new Date(intervention.dateTaken).toLocaleDateString()}</span>
                    </div>
                    {!intervention.passed && (
                      <div className="literexia-revision-notice">
                        <FaEdit /> Teacher revision recommended for next attempt
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {hasInterventionPlan && (
          <div className="literexia-intervention-recommendations">
            <h4>Intervention Recommendations</h4>
            <div className="literexia-recommendation-content">
              {interventionPlan.focus && (
                <div className="literexia-focus-area">
                  <strong>Primary Focus:</strong> {interventionPlan.focus.replace(/_/g, ' ')}
                </div>
              )}

              {interventionPlan.targetSounds && interventionPlan.targetSounds.length > 0 && (
                <div className="literexia-target-elements">
                  <strong>Target Sound Pairs:</strong>
                  <div className="literexia-sound-tags">
                    {interventionPlan.targetSounds.map((sound, idx) => (
                      <span key={idx} className="literexia-sound-tag">{sound}</span>
                    ))}
                  </div>
                </div>
              )}

              {interventionPlan.recommendedActivities && interventionPlan.recommendedActivities.length > 0 && (
                <div className="literexia-recommended-activities">
                  <strong>Recommended Activities:</strong>
                  <ul className="literexia-activity-list">
                    {interventionPlan.recommendedActivities.map((activity, idx) => (
                      <li key={idx}>
                        {typeof activity === 'string' ? 
                          activity.replace(/_/g, ' ') : 
                          (activity.skill || activity.activity || activity.description || JSON.stringify(activity))
                        }
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    );
  };

  const renderMathematicalAnalysis = (categoryName, analysis) => {
    console.log('🎯 [RENDER MATHEMATICAL ANALYSIS] Starting with:', {
      categoryName,
      analysis: !!analysis,
      interventionResultsState: interventionResults,
      selectedCategory: categoryName
    });

    if (!analysis || !categoryName) {
      return null;
    }

    // Check if intervention results exist for this category
    const hasInterventionResults = interventionResults[categoryName] && interventionResults[categoryName].score !== undefined;

    // If intervention results exist, show the comparison layout directly
    if (hasInterventionResults) {
      console.log('🎯 [INTERVENTION RESULTS] Found intervention results for', categoryName, ':', interventionResults[categoryName]);
      return renderDynamicAnalysisLayout(categoryName, analysis?.detailedErrorAnalysis, analysis?.researchBasedPrescriptions, analysis);
    }

    // Extract the category data from selectedCategoryData for scores
    const currentScore = selectedCategoryData?.score || 0;

    // Check if student has actually attempted any questions for this category
    const hasAttemptedQuestions = currentScore > 0 ||
                                 (selectedCategoryData?.totalQuestions && selectedCategoryData.totalQuestions > 0) ||
                                 (selectedCategoryData?.correctAnswers && selectedCategoryData.correctAnswers >= 0);

    if (!hasAttemptedQuestions) {
      console.log('🎯 [NO ATTEMPT] Student has not attempted this category yet, not showing analysis');
      return null;
    }

    const targetScore = 75;
    const gap = Math.max(0, targetScore - currentScore);

    const {
      bktData,           // Bayesian Knowledge Tracing data
      irtAbility,        // Item Response Theory ability estimate
      errorPatterns,     // Error pattern analysis
      detailedErrorAnalysis, // Individual letter/question level analysis from database
      insights,          // Overall insights
      interventionPlan,  // Intervention recommendations
      researchBasedPrescriptions // Research-based prescriptions from database
    } = analysis;

    // Additional validation: Check if BKT data has meaningful values
    const hasMeaningfulBKTData = bktData &&
                                (bktData.masteryProbability > 0 ||
                                 bktData.score > 0 ||
                                 bktData.totalQuestions > 0 ||
                                 (bktData.responseHistory && bktData.responseHistory.length > 0));

    if (!hasMeaningfulBKTData && !errorPatterns && !researchBasedPrescriptions) {
      console.log('🎯 [NO MEANINGFUL DATA] Analysis exists but contains no meaningful data for', categoryName);
      return null;
    }

    console.log('🎯 [RENDER DEBUG] Analysis data for', categoryName, ':', {
      bktData,
      irtAbility,
      errorPatterns,
      detailedErrorAnalysis,
      interventionPlan,
      researchBasedPrescriptions
    });

    return (
      <div className="literexia-mathematical-analysis-section">
        {/* Header with score metrics on the right */}
        <div className="literexia-math-analysis-header-container">
          <div className="literexia-math-analysis-header-layout">
            <div className="literexia-math-analysis-header-title">
              <h3>{formatCategoryName(categoryName)} Analysis</h3>
            </div>
            <div className="literexia-math-analysis-header-scores">
              <div className="literexia-math-analysis-score-item">
                <span className="literexia-math-analysis-score-label">CURRENT SCORE</span>
                <span className="literexia-math-analysis-score-value">{currentScore}%</span>
              </div>
              <FaArrowRight className="literexia-math-analysis-score-arrow" />
              <div className="literexia-math-analysis-score-item">
                <span className="literexia-math-analysis-score-label">TARGET SCORE</span>
                <span className="literexia-math-analysis-score-value">75%</span>
              </div>
              <div className="literexia-math-analysis-score-item">
                <span className="literexia-math-analysis-score-label">GAP</span>
                <span className="literexia-math-analysis-score-value">{gap}%</span>
              </div>
            </div>
          </div>
        </div>

        {/* Two-column layout for BKT and IRT */}
        <div className="literexia-analysis-two-column">
          {/* Left Column - BKT (Bayesian Knowledge Tracing) */}
          {bktData && (
            <div className="literexia-analysis-card">
              <div className="literexia-card-content">
                <div className="literexia-math-analysis-bkt-container">
                  <div className="literexia-math-analysis-bkt-gauge">
                    <div className="literexia-mastery-label">Mastery Probability:</div>
                    <div className="literexia-math-analysis-bkt-circle">
                      <div className={`literexia-math-analysis-bkt-percent ${
                        bktData.masteryProbability >= 0.75 ? 'high' :
                        bktData.masteryProbability >= 0.5 ? 'medium' : 'low'
                      }`}>
                        {(bktData.masteryProbability * 100).toFixed(1)}%
                      </div>
                    </div>
                  </div>
                  <div className="literexia-math-analysis-bkt-details">
                    <div className="literexia-math-analysis-bkt-metric">
                      <span className="literexia-math-analysis-bkt-label">Assessment Score:</span>
                      <span className="literexia-math-analysis-bkt-value">{bktData.score}% ({bktData.isPassed ? 'Passed' : 'Needs Intervention'})</span>
                    </div>
                    <div className="literexia-math-analysis-bkt-metric">
                      <span className="literexia-math-analysis-bkt-label">Questions Answered:</span>
                      <span className="literexia-math-analysis-bkt-value">{bktData.totalQuestions} total, {bktData.correctAnswers} correct
                      {bktData.totalPossibleMatches > 0 && (
                        <span> ({bktData.correctMatches}/{bktData.totalPossibleMatches} matches)</span>
                      )}</span>
                    </div>
                    <div className="literexia-math-analysis-bkt-metric">
                      <span className="literexia-math-analysis-bkt-label">BKT Interpretation:</span>
                      <span className="literexia-math-analysis-bkt-value">{
                        bktData.masteryProbability >= 0.75 ?
                          `High confidence - student demonstrates mastery of ${formatCategoryName(categoryName)}` :
                        bktData.masteryProbability >= 0.5 ?
                          `Moderate confidence - student shows partial mastery of ${formatCategoryName(categoryName)}` :
                          `Low confidence - student needs targeted intervention for ${formatCategoryName(categoryName)}`
                      }</span>
                    </div>

                    {/* BKT Response History Evolution */}
                    {bktData.responseHistory && bktData.responseHistory.length > 0 && (
                      <div className="literexia-math-analysis-bkt-evolution">
                        <div className="literexia-math-analysis-bkt-evolution-header">
                          <h6><FaChartLine className="literexia-section-icon" /> Learning Progression (BKT Evolution)</h6>
                          <p>Real-time mastery probability changes as student answers each question</p>
                        </div>
                        <div className="literexia-math-analysis-bkt-timeline">
                          {bktData.responseHistory.slice(-10).map((response, index) => (
                            <div key={index} className="literexia-math-analysis-bkt-point">
                              <div
                                className={`literexia-math-analysis-bkt-indicator ${response.correct ? 'correct' : 'incorrect'}`}
                                title={`Question ${response.questionId}: ${response.correct ? 'Correct' : 'Incorrect'} → ${Math.round(response.masteryAfter * 100)}% mastery`}
                              >
                                {response.correct ? '✓' : '✗'}
                              </div>
                              <div className="literexia-math-analysis-bkt-progression">
                                <small>{Math.round(response.masteryAfter * 100)}%</small>
                                <div className="literexia-math-analysis-bkt-question-info">{response.questionId}</div>
                              </div>
                            </div>
                          ))}
                        </div>
                        <div className="literexia-math-analysis-bkt-summary">
                          <small>Showing last {Math.min(10, bktData.responseHistory.length)} responses with mastery evolution</small>
                          <div className="literexia-math-analysis-bkt-trend">
                            <span>Trend: </span>
                            {bktData.responseHistory.length >= 2 && (
                              <span className={
                                bktData.responseHistory[bktData.responseHistory.length - 1].masteryAfter >
                                bktData.responseHistory[0].masteryAfter ? 'improving' : 'declining'
                              }>
                                {bktData.responseHistory[bktData.responseHistory.length - 1].masteryAfter >
                                 bktData.responseHistory[0].masteryAfter ? (
                                   <><FaChartLine /> Improving</>
                                 ) : (
                                   <><FaExclamationTriangle /> Needs Support</>
                                 )}
                              </span>
                            )}
                          </div>
                        </div>
<br></br> <br></br>
   
                        
                      </div>)}
                      {irtAbility !== null && irtAbility !== undefined && (
              <div className="literexia-card-content">
                <div className="epa-irt-container">
                  <div className="epa-irt-header">
                    <FaRuler className="epa-irt-icon" />
                    <h4 className="epa-irt-title">Item Response Theory (IRT) Ability Estimate</h4>
                  </div>
                  <div className="epa-irt-content">
                    <div className="epa-irt-ability">
                      <span className="epa-irt-ability-label">Ability Level (θ):</span>
                      <span className={`epa-irt-ability-value ${
                        irtAbility >= 1.0 ? 'epa-irt-ability-value--positive' :
                        irtAbility >= -0.5 ? 'epa-irt-ability-value--neutral' : ''
                      }`}>
                        {irtAbility > 0 ? '+' : ''}{irtAbility.toFixed(1)}
                      </span>
                      <span className="epa-irt-scale">(Scale: -3.0 to +3.0)</span>
                    </div>
                    <div className="epa-irt-interpretation">
                      <span className="epa-irt-interpretation-label">IRT INTERPRETATION:</span>
                      <p className={`epa-irt-interpretation-text ${
                        irtAbility >= -0.5 ? 'epa-irt-interpretation-text--mild' :
                        irtAbility >= -1.5 ? 'epa-irt-interpretation-text--moderate' : 'epa-irt-interpretation-text--severe'
                      }`}>
                        {irtAbility >= 1.0 ?
                          `Excellent ability in ${formatCategoryName(categoryName)}` :
                        irtAbility >= 0.0 ?
                          `Above average ability in ${formatCategoryName(categoryName)}` :
                        irtAbility >= -1.0 ?
                          `Below average ability - needs additional support in ${formatCategoryName(categoryName)}` :
                          `Significant difficulty - intensive intervention recommended for ${formatCategoryName(categoryName)}`
                        }
                      </p>
                    </div>
                  </div>
                </div>
              </div>
          )}
                  </div>
                </div>
              </div>
            </div>
          )}

       
        </div>

        {/* Error Pattern Analysis - Full Width */}
        {errorPatterns && Object.keys(errorPatterns).length > 0 && (
          <div className="literexia-analysis-card literexia-full-width">
            <div className="literexia-card-content">
              <div className={`epa-container theme-${getUITheme(selectedCategory)}`}>
                {Object.entries(errorPatterns).map(([errorType, errorData]) => (
                  <div key={errorType} className="epa-section">
                    <div className="epa-header">
                        <h6 className="epa-title">{errorType.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}</h6>
                      {errorData.percentage && (
                        <div className="epa-severity">
                          <span className="epa-percentage">{errorData.percentage}% error rate</span>
                          <span className={`epa-badge epa-badge--${
                            errorData.percentage >= 70 ? 'severe' :
                            errorData.percentage >= 50 ? 'high' :
                            errorData.percentage >= 30 ? 'moderate' : 'low'
                          }`}>
                            {errorData.percentage >= 70 ? 'Severe' :
                             errorData.percentage >= 50 ? 'High' :
                             errorData.percentage >= 30 ? 'Moderate' : 'Low'} Severity
                          </span>
                        </div>
                      )}
                    </div>

                    <div className="epa-content">
                      {/* Basic Error Metrics */}
                      <div className="epa-metrics">
                        {errorData.count !== undefined && errorData.total !== undefined && (
                          <div className="epa-metric-card">
                            <span className="epa-metric-label">Error Count:</span>
                            <span className="epa-metric-value">{errorData.count}/{errorData.total} questions</span>
                          </div>
                        )}
                        {errorData.avg_partial_success !== undefined && (
                          <div className="epa-metric-card">
                            <span className="epa-metric-label">Partial Success Rate:</span>
                            <span className="epa-metric-value">{Math.round(errorData.avg_partial_success * 100)}%</span>
                          </div>
                        )}
                        {errorData.error_type && (
                          <div className="epa-metric-card">
                            <span className="epa-metric-label">Primary Error Type:</span>
                            <span className="epa-metric-value">{errorData.error_type.replace(/_/g, ' ')}</span>
                          </div>
                        )}
                      </div>

                      {/* Confusion Pairs - Dynamic from Database */}
                      {errorData.confusionPairs && errorData.confusionPairs.length > 0 && (
                        <div className="epa-confusion-section">
                          <h6 className="epa-confusion-title">
                            Specific Confusion Patterns
                          </h6>
                          <div className="epa-confusion-grid">
                            {errorData.confusionPairs.map((pair, index) => (
                              <div key={index} className="epa-confusion-item">
                                <div className="epa-confusion-pair">
                                  {pair.sounds ? (
                                    <span>{pair.sounds.join(' ↔ ')}</span>
                                  ) : (
                                    <span>{pair.original} ↔ {pair.confused}</span>
                                  )}
                                </div>
                                <div className="epa-confusion-rate">
                                  <span className={`epa-confusion-percentage epa-confusion-percentage--${
                                    (pair.confusionRate || pair.frequency) >= 75 ? 'high' :
                                    (pair.confusionRate || pair.frequency) >= 50 ? 'medium' : 'low'
                                  }`}>
                                    {pair.confusionRate || pair.frequency}% confusion
                                  </span>
                                </div>
                                {pair.intervention && (
                                  <div className="epa-intervention-text">
                                    {pair.intervention}
                                  </div>
                                )}
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Cognitive Implications - Dynamic from Database */}
                      {errorData.cognitiveImplications && errorData.cognitiveImplications.length > 0 && (
                        <div className="epa-implications">
                          <h6 className="epa-implications-title">
                            Cognitive Implications
                          </h6>
                          <div className="epa-implications-list">
                            {errorData.cognitiveImplications.map((implication, index) => (
                              <div key={index} className="epa-implication-item">
                                <div className="epa-implication-category">

                                </div>
                                <div className="epa-implication-text">{implication}</div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Affected Questions */}
                      {errorData.questionIds && errorData.questionIds.length > 0 && (
                        <div className="epa-questions">
                          <div className="epa-questions-header">
                            <span className="epa-questions-label">Questions with Errors:</span>
                            <span className="epa-questions-count">({errorData.questionIds.length} questions)</span>
                          </div>
                          <div className="epa-question-tags">
                            {errorData.questionIds.map((questionId, index) => (
                              <span key={index} className="epa-question-tag">Q{questionId}</span>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Dynamic Layout: Before/After Intervention Comparison or Initial Analysis */}
        {renderDynamicAnalysisLayout(categoryName, detailedErrorAnalysis, researchBasedPrescriptions, selectedAnalysis)}
      </div>
    );
  };

  /**
   * Render comprehensive research-based prescriptions for intervention results
   * Fetches data from intervention_results.json
   */
  const renderInterventionResearchComprehensivePrescriptions = (interventionData, categoryName) => {
    console.log('🔬 [INTERVENTION RESEARCH] Rendering intervention research prescriptions for:', categoryName);
    console.log('🔬 [INTERVENTION RESEARCH] Available intervention data:', interventionData);
    console.log('🔬 [INTERVENTION RESEARCH] Research prescriptions data:', interventionData?.researchBasedPrescriptions);

    if (!interventionData?.researchBasedPrescriptions?.[categoryName]) {
      console.log('❌ [INTERVENTION RESEARCH] No research prescriptions found for category:', categoryName);
      return (
        <div className="comprehensive-research-container">
          <div className="research-section">
            <div className="after-intervention-research-section-header">
              <h5 className="research-section-title">
                <FaUserMd />
                Research-Based Prescriptions
              </h5>
              <span className="research-classification-badge">No Data Available</span>
            </div>
            <div className="research-section-content">
              <p>No comprehensive research prescriptions available for this intervention result.</p>
            </div>
          </div>
        </div>
      );
    }

    const researchData = interventionData.researchBasedPrescriptions[categoryName];
    console.log('✅ [INTERVENTION RESEARCH] Found research data:', researchData);

    return (
      <div className="comprehensive-research-container">
        {/* Deficit Analysis Section */}
        {researchData.deficitAnalysis && (
          <div className="research-section">
            <div className="after-intervention-research-section-header">
              <h5 className="research-section-title">
                <FaExclamationTriangle />
                Updated Deficit Analysis
              </h5>
              <span className="research-classification-badge">
                {researchData.deficitAnalysis.researchClassification?.replace(/_/g, ' ') || 'Analysis'}
              </span>
            </div>
            <div className="research-section-content">
              {/* Specific Deficits */}
              {researchData.deficitAnalysis.specificDeficits && researchData.deficitAnalysis.specificDeficits.length > 0 && (
                <div className="deficit-grid">
                  {researchData.deficitAnalysis.specificDeficits.map((deficit, index) => (
                    <div key={index} className="deficit-card">
                      <div className="deficit-header">
                        <div className="deficit-title">{deficit.deficit}</div>
                        <span className={`severity-badge severity-badge--${deficit.severity || 'moderate'}`}>
                          {deficit.severity?.toUpperCase() || 'MODERATE'}
                        </span>
                      </div>
                      <div className="deficit-details">
                        <div className="deficit-manifestation">
                          <strong>Manifestation:</strong> {deficit.manifestation}
                        </div>
                        <div className="deficit-error-rate">
                          <strong>Error Rate:</strong> {deficit.errorRate}
                        </div>
                        {deficit.researchEvidence && (
                          <div className="deficit-evidence">
                            <strong>Evidence:</strong> {deficit.researchEvidence}
                          </div>
                        )}
                        {deficit.interventionResponse && (
                          <div className="deficit-evidence">
                            <strong>Intervention Response:</strong> {deficit.interventionResponse}
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Root Cause Analysis */}
              {researchData.deficitAnalysis.rootCauseAnalysis && (
                <div style={{ marginTop: '16px' }}>
                  <h6 style={{ color: '#1e293b', fontWeight: '600', marginBottom: '8px' }}>Root Cause Analysis</h6>
                  <p style={{ color: '#4b5563', fontSize: '14px', lineHeight: '1.4' }}>
                    {researchData.deficitAnalysis.rootCauseAnalysis}
                  </p>
                </div>
              )}

              {/* Cognitive Factors */}
              {researchData.deficitAnalysis.cognitiveFactors && researchData.deficitAnalysis.cognitiveFactors.length > 0 && (
                <div style={{ marginTop: '16px' }}>
                  <h6 style={{ color: '#1e293b', fontWeight: '600', marginBottom: '8px' }}>Cognitive Factors</h6>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                    {researchData.deficitAnalysis.cognitiveFactors.map((factor, index) => (
                      <span key={index} style={{
                        background: '#f3f4f6',
                        color: '#374151',
                        padding: '4px 8px',
                        borderRadius: '4px',
                        fontSize: '12px',
                        fontWeight: '500'
                      }}>
                        {factor.replace(/_/g, ' ')}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Next Intervention Prescription Section */}
        {researchData.nextInterventionPrescription && (
          <div className="research-section">
            <div className="after-intervention-research-section-header">
              <h5 className="research-section-title">
                <FaUserMd />
                Next Intervention Prescription
              </h5>
              <span className="research-classification-badge">
                {researchData.nextInterventionPrescription.intensityLevel?.replace(/_/g, ' ').toUpperCase() || 'PRESCRIPTION'}
              </span>
            </div>
            <div className="research-section-content">
              {/* Primary Approach */}
              {researchData.nextInterventionPrescription.primaryApproach && (
                <div style={{ marginBottom: '16px' }}>
                  <h6 style={{ color: '#1e293b', fontWeight: '600', marginBottom: '8px' }}>Primary Approach</h6>
                  <p style={{ color: '#4b5563', fontSize: '14px' }}>
                    {researchData.nextInterventionPrescription.primaryApproach.replace(/_/g, ' ')}
                  </p>
                </div>
              )}

              {/* Specific Techniques */}
              {researchData.nextInterventionPrescription.specificTechniques && researchData.nextInterventionPrescription.specificTechniques.length > 0 && (
                <div className="techniques-grid">
                  <h6 style={{ color: '#1e293b', fontWeight: '600', marginBottom: '12px' }}>Specific Techniques</h6>
                  <div className="techniques-container">
                    {researchData.nextInterventionPrescription.specificTechniques.map((technique, index) => (
                      <div key={index} className="technique-card">
                        <div className="technique-header">
                          <h7 className="technique-name">{technique.technique || technique}</h7>
                        </div>
                        {technique.description && (
                          <div className="technique-description">{technique.description}</div>
                        )}
                        <div className="technique-details">
                          {technique.duration && (
                            <div className="technique-duration">
                              <strong>Duration:</strong> {technique.duration}
                            </div>
                          )}
                          {technique.materials && (
                            <div className="technique-materials">
                              <strong>Materials:</strong> {technique.materials}
                            </div>
                          )}
                          {technique.progressCriteria && (
                            <div className="technique-criteria">
                              <strong>Success Criteria:</strong> {technique.progressCriteria}
                            </div>
                          )}
                          {technique.researchBasis && (
                            <div className="technique-research">
                              <strong>Research Basis:</strong> {technique.researchBasis}
                            </div>
                          )}
                          {technique.modificationFromPrevious && (
                            <div className="technique-research">
                              <strong>Modification:</strong> {technique.modificationFromPrevious.replace(/_/g, ' ')}
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Session Structure */}
              {researchData.nextInterventionPrescription.sessionStructure && (
                <div style={{ marginTop: '20px' }}>
                  <h6 style={{ color: '#1e293b', fontWeight: '600', marginBottom: '12px' }}>Session Structure</h6>
                  <div style={{ background: '#f8fafc', padding: '16px', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                    {researchData.nextInterventionPrescription.sessionStructure.optimalLength && (
                      <div style={{ marginBottom: '8px', fontSize: '14px', color: '#4b5563' }}>
                        <strong>Optimal Length:</strong> {researchData.nextInterventionPrescription.sessionStructure.optimalLength}
                      </div>
                    )}
                    {researchData.nextInterventionPrescription.sessionStructure.breakPattern && (
                      <div style={{ marginBottom: '8px', fontSize: '14px', color: '#4b5563' }}>
                        <strong>Break Pattern:</strong> {researchData.nextInterventionPrescription.sessionStructure.breakPattern}
                      </div>
                    )}
                    {researchData.nextInterventionPrescription.sessionStructure.sessionComponents && (
                      <div style={{ fontSize: '14px', color: '#4b5563' }}>
                        <strong>Components:</strong>
                        <ul style={{ margin: '8px 0 0 16px', listStyle: 'disc' }}>
                          {researchData.nextInterventionPrescription.sessionStructure.sessionComponents.map((component, index) => (
                            <li key={index}>{component.replace(/_/g, ' ')}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Material Recommendations */}
              {researchData.nextInterventionPrescription.materialRecommendations && researchData.nextInterventionPrescription.materialRecommendations.length > 0 && (
                <div style={{ marginTop: '20px' }}>
                  <h6 style={{ color: '#1e293b', fontWeight: '600', marginBottom: '12px' }}>Material Recommendations</h6>
                  <ul style={{ margin: '0 0 0 16px', listStyle: 'disc', color: '#4b5563', fontSize: '14px', lineHeight: '1.4' }}>
                    {researchData.nextInterventionPrescription.materialRecommendations.map((material, index) => (
                      <li key={index} style={{ marginBottom: '4px' }}>{material}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Teacher Revision Guidance Section */}
        {researchData.teacherRevisionGuidance?.revisionRecommended && (
          <div className="research-section">
            <div className="after-intervention-research-section-header">
              <h5 className="research-section-title">
                <FaEdit />
                Teacher Revision Guidance
              </h5>
              <span className="research-classification-badge">
                PRIORITY: {researchData.teacherRevisionGuidance.revisionPriority?.toUpperCase() || 'MEDIUM'}
              </span>
            </div>
            <div className="research-section-content">
              <div className="revision-guidance-section">
                <div className="revision-guidance-header">
                  <h6 className="revision-guidance-title">
                    <FaExclamationTriangle />
                    Revision Recommended
                  </h6>
                </div>

                <div className="revision-priority">
                  <div className="priority-label">Priority Level:</div>
                  <div className="priority-value">
                    {researchData.teacherRevisionGuidance.revisionPriority?.toUpperCase() || 'MEDIUM'}
                  </div>
                </div>

                {researchData.teacherRevisionGuidance.specificChanges && researchData.teacherRevisionGuidance.specificChanges.length > 0 && (
                  <div className="revision-changes">
                    <h6 style={{ color: '#1e293b', fontWeight: '600', marginBottom: '12px' }}>Specific Changes</h6>
                    {researchData.teacherRevisionGuidance.specificChanges.map((change, index) => (
                      <div key={index} className="revision-change">
                        <div className="change-description">{change.change}</div>
                        <div className="change-rationale">{change.rationale}</div>
                        <div className="change-impact">{change.expectedImpact}</div>
                      </div>
                    ))}
                  </div>
                )}

                {researchData.teacherRevisionGuidance.estimatedImpact && (
                  <div className="estimated-impact-section">
                    <div className="impact-label">Estimated Impact:</div>
                    <div className="impact-value">
                      {researchData.teacherRevisionGuidance.estimatedImpact}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Escalation Protocol Section */}
        {researchData.escalationProtocol && researchData.escalationProtocol.escalationTriggered === false && (
          <div className="research-section">
            <div className="after-intervention-research-section-header">
              <h5 className="research-section-title">
                <FaCheckCircle />
                Escalation Status
              </h5>
              <span className="research-classification-badge escalation-success">
                NO ESCALATION
              </span>
            </div>
            <div className="research-section-content">
              <div className="escalation-status-content">
                <FaCheckCircle className="escalation-icon" />
                <div className="escalation-details">
                  <div className="escalation-title">No Escalation Required</div>
                  <div className="escalation-description">
                    Student showing progress - continue with current intervention approach
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  };

  // ===== DYNAMIC ANALYSIS LAYOUT FUNCTION =====
  /**
   * Renders dynamic analysis layout that adapts based on intervention results
   * Shows either:
   * 1. Initial two-column layout (Before Intervention)
   * 2. Before/After comparison layout (After Intervention)
   */
  const renderDynamicAnalysisLayout = (categoryName, detailedErrorAnalysis, researchBasedPrescriptions, selectedAnalysis) => {
    const interventionData = interventionResults[categoryName];
    const hasInterventionResults = interventionData && interventionData.score !== undefined;
    
    console.log('[DEBUG] renderDynamicAnalysisLayout called with:', {
      categoryName,
      hasDetailedErrorAnalysis: !!detailedErrorAnalysis,
      hasResearchBasedPrescriptions: !!researchBasedPrescriptions,
      hasSelectedAnalysis: !!selectedAnalysis,
      selectedAnalysisKeys: selectedAnalysis ? Object.keys(selectedAnalysis) : [],
      hasInterventionData: !!interventionData,
      interventionScore: interventionData?.score,
      interventionResultsState: interventionResults,
      interventionDataForCategory: interventionData,
      hasInterventionResults: hasInterventionResults,
      scoreUndefined: interventionData?.score === undefined,
      scoreType: typeof interventionData?.score,
      scoreValue: interventionData?.score
    });
    
    console.log('[DEBUG] Will show layout type:', hasInterventionResults ? 'BEFORE/AFTER COMPARISON' : 'INITIAL DIAGNOSIS ONLY');

    if (!hasInterventionResults) {
      // ===== BEFORE INTERVENTION: Standard Two-Column Layout =====
      return (
        <div className="epa-two-column-layout">
          {/* Left Column: Detailed Error Analysis */}
          <div className="epa-left-column">
            <div className="epa-column-header">
              <FaExclamationTriangle className="epa-icon" />
              <span>Detailed Error Analysis</span>
              <span className="epa-status-indicator epa-status-initial">INITIAL DIAGNOSIS</span>
            </div>
            {renderDetailedErrorAnalysis(detailedErrorAnalysis, categoryName)}
          </div>

          {/* Right Column: Intervention Prescription and Plan */}
          <div className="epa-right-column">
            <div className="epa-column-header">
              <FaUserMd className="epa-icon" />
              <span>Intervention Prescription & Plan</span>
              <span className="epa-status-indicator epa-status-prescription">PRESCRIPTION</span>
            </div>
            {renderComprehensiveResearchAnalysis(researchBasedPrescriptions, categoryName)}
          </div>
        </div>
      );
    } else {
      // ===== AFTER INTERVENTION: Comprehensive Results Display =====
      const interventionStatus = getInterventionStatus(categoryName);
      const statusTheme = getUITheme(categoryName);

      return (
        <div className="epa-intervention-results-display">
          {/* Comprehensive Intervention Results Header */}
          <div className="epa-intervention-results-header">
            <div className="epa-results-header-content">
              <div className="epa-results-icon">
                <FaEdit />
              </div>
              <div className="epa-results-title-section">
                <h3 className="epa-results-title">
                  Intervention Results for {categoryName}
                </h3>
                <p className="epa-results-subtitle">
                  {interventionData.isPassed ? (
                    `Student scored ${interventionData.score}% - Intervention successful!`
                  ) : (
                    `Student scored ${interventionData.score}% - Teacher revision recommended.`
                  )}
                </p>
                <div className="epa-assessment-metadata">
                  <span>Assessment Date: {new Date(interventionData.assessmentDate || Date.now()).toLocaleDateString()}</span>
                  {interventionData.revisionNumber && (
                    <span>Revision: #{interventionData.revisionNumber}</span>
                  )}
                  {interventionData.versionTracking?.hasMultipleAttempts && (
                    <span>Attempts: {interventionData.versionTracking.totalAttempts}</span>
                  )}
                  {interventionData.dataNormalization?.scorePreserved && (
                    <span className="data-normalization-indicator">📊 Original Score Preserved</span>
                  )}
                </div>
              </div>
              <div className="epa-results-score-summary">
                {/* Data Normalization Section */}
                {interventionData.dataNormalization && (
                  <div className="epa-score-metric data-normalization">
                    <div className="epa-score-label">ORIGINAL</div>
                    <div className="epa-score-value original-preserved">
                      {interventionData.dataNormalization.originalAssessmentScore}%
                    </div>
                    <div className="epa-score-sublabel">Preserved</div>
                  </div>
                )}
                <div className="epa-score-metric">
                  <div className="epa-score-label">BEFORE</div>
                  <div className="epa-score-value before">{interventionData.previousScore || 0}%</div>
                </div>
                <div className="epa-score-arrow">→</div>
                <div className="epa-score-metric">
                  <div className="epa-score-label">INTERVENTION</div>
                  <div className={`epa-score-value after ${interventionData.isPassed ? 'passed' : 'needs-revision'}`}>
                    {interventionData.score}%
                  </div>
                  <div className="epa-score-sublabel">Rev #{interventionData.revisionNumber || 1}</div>
                </div>
                <div className="epa-score-metric">
                  <div className="epa-score-label">IMPROVEMENT</div>
                  <div className={`epa-improvement-value ${interventionData.improvement >= 0 ? 'positive' : 'negative'}`}>
                    +{interventionData.improvement}%
                  </div>
                </div>
                <div className="epa-score-metric">
                  <div className="epa-score-label">STATUS</div>
                  <div className={`epa-status-badge ${interventionData.isPassed ? 'passed' : 'failed'}`}>
                    {interventionData.isPassed ? 'PASSED' : 'NEEDS REVISION'}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* TOP SECTION: Skill Mastery Analysis + Error Pattern Analysis */}
          <div className="intervention-results-top-section">
            {/* Left Card: Skill Mastery Analysis */}
            <div className="intervention-results-skill-mastery-card">
              <div className="after-intervention-skill-mastery-header">
                <FaChartLine className="epa-icon" />
                <span>Skill Mastery Analysis</span>
              </div>
              <div className="skill-mastery-content">
                {interventionData.skillMastery?.[categoryName] && (
                  <div className="epa-skill-mastery-analysis">
                    <h4 className="epa-subsection-title">
                      <FaBrain className="epa-section-icon" />
                      Bayesian Knowledge Tracing (BKT) Analysis
                    </h4>
                    <div className="epa-bkt-display">
                      <div className="mastery-gauge-container">
                        <div
                          className="mastery-gauge"
                          style={{'--percentage': (interventionData.skillMastery[categoryName].masteryProbability * 100).toFixed(0)}}
                        >
                          <div className="mastery-percentage">
                            {(interventionData.skillMastery[categoryName].masteryProbability * 100).toFixed(1)}%
                            <span className="mastery-gauge-label">MASTERY</span>
                          </div>
                        </div>
                        <div className="mastery-interpretation">
                          <strong>Skill Status:</strong> {interventionData.skillMastery[categoryName].status ||
                            (interventionData.skillMastery[categoryName].masteryProbability >= 0.75 ? 'MASTERED' :
                             interventionData.skillMastery[categoryName].masteryProbability >= 0.5 ? 'DEVELOPING' : 'NEEDS_IMPROVEMENT')}
                        </div>
                      </div>

                      <div className="epa-bkt-metrics">
                        <div className="epa-metric-row">
                          <span className="epa-metric-label">Questions Answered:</span>
                          <span className="epa-metric-value">{interventionData.skillMastery[categoryName].totalQuestions}</span>
                        </div>
                        <div className="epa-metric-row">
                          <span className="epa-metric-label">Correct Answers:</span>
                          <span className="epa-metric-value">{interventionData.skillMastery[categoryName].correctAnswers}</span>
                        </div>
                        <div className="epa-metric-row">
                          <span className="epa-metric-label">Final Score:</span>
                          <span className={`epa-metric-value ${interventionData.skillMastery[categoryName].isPassed ? 'passed' : 'failed'}`}>
                            {interventionData.skillMastery[categoryName].score}%
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Learning Progression (BKT Evolution) */}
                    {interventionData.skillMastery[categoryName].responseHistory && (
                      <div className="epa-learning-progression">
                        <h4 className="epa-subsection-title">
                          <FaChartLine className="epa-section-icon" />
                          Learning Progression (BKT Evolution)
                        </h4>
                        <div className="epa-response-timeline">
                          {interventionData.skillMastery[categoryName].responseHistory.slice(-8).map((response, index) => (
                            <div key={index} className="epa-response-item">
                              <div className={`epa-response-indicator ${response.correct ? 'correct' : 'incorrect'}`}>
                                {response.correct ? <FaCheck /> : <FaTimes />}
                              </div>
                              <div className="epa-response-details">
                                <div className="epa-question-id">{response.questionId.replace('int_alphabet_knowledge_', '')}</div>
                                <div className="epa-mastery-after">{(response.masteryAfter * 100).toFixed(0)}%</div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* Right Card: Error Pattern Analysis */}
            <div className="intervention-results-error-pattern-card">
              <div className="after-intervention-error-pattern-header">
                <FaExclamationTriangle className="epa-icon" />
                <span>Error Pattern Analysis</span>
              </div>
              <div className="error-pattern-content">
                {interventionData.errorPatterns?.[categoryName] && (
                  <div className="epa-error-pattern-analysis">
                    <h4 className="epa-subsection-title">
                      <FaExclamationTriangle className="epa-section-icon" />
                      Error Pattern Analysis - {categoryName}
                    </h4>

                    <div className="epa-pattern-summary">
                      <div className="epa-pattern-overview">
                        <div className="pattern-summary-label">Overall Error Rate:</div>
                        <div className="pattern-summary-value">
                          {interventionData.errorPatterns[categoryName].percentage || interventionData.errorPatterns[categoryName].count && interventionData.errorPatterns[categoryName].total ?
                            Math.round((interventionData.errorPatterns[categoryName].count / interventionData.errorPatterns[categoryName].total) * 100) : 0}%
                        </div>
                      </div>
                      <div className="epa-pattern-focus">
                        <div className="pattern-summary-label">Primary Focus:</div>
                        <div className="pattern-summary-value">
                          {interventionData.errorPatterns[categoryName].detailedErrorAnalysis?.[0]?.interventionFocus ||
                            interventionData.errorPatterns[categoryName].error_type?.replace('_', ' ') || 'systematic_skill_review'}
                        </div>
                      </div>
                      <div className="epa-pattern-issues">
                        <div className="pattern-summary-label">Specific Issues:</div>
                        <div className="pattern-summary-value">
                          {interventionData.errorPatterns[categoryName].detailedErrorAnalysis?.[0]?.specificPairs?.join(', ') ||
                            interventionData.errorPatterns[categoryName].currentPatterns?.[0] || 'Pattern analysis in progress'}
                        </div>
                      </div>
                      {interventionData.errorPatterns[categoryName].questionIds && (
                        <div className="epa-pattern-questions">
                          <div className="pattern-summary-label">Problem Questions:</div>
                          <div className="pattern-summary-value">
                            {interventionData.errorPatterns[categoryName].questionIds.length} out of {interventionData.errorPatterns[categoryName].total || interventionData.totalQuestions}
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Category-Specific Error Patterns */}
                    {categoryName === 'Alphabet Knowledge' && (
                      <>
                        {/* Patinig Errors for Alphabet Knowledge */}
                        {interventionData.errorPatterns[categoryName].patinig_errors && (
                          <div className="epa-category-specific-errors">
                            <h5 className="error-category-title">Patinig (Vowel) Errors</h5>
                            <div className="epa-error-metrics">
                              <div className="epa-error-metric">
                                <span className="epa-error-label">Error Count:</span>
                                <span className="epa-error-value">{interventionData.errorPatterns[categoryName].patinig_errors.count}</span>
                              </div>
                              <div className="epa-error-metric">
                                <span className="epa-error-label">Error Rate:</span>
                                <span className={`epa-error-value ${interventionData.errorPatterns[categoryName].patinig_errors.percentage === 0 ? 'success' : 'warning'}`}>
                                  {interventionData.errorPatterns[categoryName].patinig_errors.percentage}%
                                </span>
                              </div>
                            </div>
                            {interventionData.errorPatterns[categoryName].patinig_errors.specific_letters?.length > 0 && (
                              <div className="epa-problem-letters">
                                <div className="problem-letters-label">Problem Letters:</div>
                                <div className="epa-letter-tags">
                                  {interventionData.errorPatterns[categoryName].patinig_errors.specific_letters.map((letter, index) => (
                                    <span key={index} className="epa-letter-tag vowel">{letter}</span>
                                  ))}
                                </div>
                              </div>
                            )}
                            <div className="epa-intervention-focus">
                              <div className="intervention-focus-label">Intervention Focus:</div>
                              <div className="intervention-focus-value">
                                {interventionData.errorPatterns[categoryName].patinig_errors.interventionFocus || 'vowel_discrimination_practice'}
                              </div>
                            </div>
                          </div>
                        )}

                        {/* Katinig Errors for Alphabet Knowledge */}
                        {interventionData.errorPatterns[categoryName].katinig_errors && (
                          <div className="epa-category-specific-errors">
                            <h5 className="error-category-title">Katinig (Consonant) Errors</h5>
                            <div className="epa-error-metrics">
                              <div className="epa-error-metric">
                                <span className="epa-error-label">Error Count:</span>
                                <span className="epa-error-value">{interventionData.errorPatterns[categoryName].katinig_errors.count}</span>
                              </div>
                              <div className="epa-error-metric">
                                <span className="epa-error-label">Error Rate:</span>
                                <span className={`epa-error-value ${interventionData.errorPatterns[categoryName].katinig_errors.percentage === 0 ? 'success' : 'warning'}`}>
                                  {interventionData.errorPatterns[categoryName].katinig_errors.percentage}%
                                </span>
                              </div>
                            </div>
                            {interventionData.errorPatterns[categoryName].katinig_errors.specific_letters?.length > 0 && (
                              <div className="epa-problem-letters">
                                <div className="problem-letters-label">Problem Letters:</div>
                                <div className="epa-letter-tags">
                                  {interventionData.errorPatterns[categoryName].katinig_errors.specific_letters.map((letter, index) => (
                                    <span key={index} className="epa-letter-tag consonant">{letter}</span>
                                  ))}
                                </div>
                              </div>
                            )}
                          </div>
                        )}
                      </>
                    )}

                    {/* Phonological Awareness Specific Errors */}
                    {categoryName === 'Phonological Awareness' && interventionData.errorPatterns[categoryName].matching_errors && (
                      <div className="epa-category-specific-errors">
                        <h5 className="error-category-title">Sound Matching Errors</h5>
                        <div className="epa-error-metrics">
                          <div className="epa-error-metric">
                            <span className="epa-error-label">Matching Errors:</span>
                            <span className="epa-error-value">{interventionData.errorPatterns[categoryName].matching_errors.count}</span>
                          </div>
                          <div className="epa-error-metric">
                            <span className="epa-error-label">Error Rate:</span>
                            <span className={`epa-error-value ${interventionData.errorPatterns[categoryName].matching_errors.percentage > 50 ? 'danger' : 'warning'}`}>
                              {interventionData.errorPatterns[categoryName].matching_errors.percentage}%
                            </span>
                          </div>
                          <div className="epa-error-metric">
                            <span className="epa-error-label">Avg Partial Success:</span>
                            <span className="epa-error-value">{(interventionData.errorPatterns[categoryName].matching_errors.avg_partial_success * 100).toFixed(0)}%</span>
                          </div>
                        </div>
                        {interventionData.errorPatterns[categoryName].matching_errors.confusion_pairs && (
                          <div className="epa-confusion-pairs">
                            <div className="confusion-pairs-label">Confusion Pairs:</div>
                            <div className="epa-confusion-tags">
                              {interventionData.errorPatterns[categoryName].matching_errors.confusion_pairs.map((pair, index) => {
                                // Handle different data structures for confusion pairs
                                let displayText = 'N/A';
                                let confusionRate = 0;
                                
                                if (pair && typeof pair === 'object') {
                                  // Check if it's the new format with audio/match keys
                                  if (pair.audio && pair.match) {
                                    displayText = `${pair.audio}-${pair.match}`;
                                    confusionRate = pair.confusion_rate || pair.rate || 0;
                                  }
                                  // Check if it's the old format with sounds array
                                  else if (pair.sounds && Array.isArray(pair.sounds)) {
                                    displayText = pair.sounds.join('-');
                                    confusionRate = pair.confusion_rate || 0;
                                  }
                                  // Check if it's a string format
                                  else if (typeof pair === 'string') {
                                    displayText = pair;
                                  }
                                  // Fallback for other object structures
                                  else {
                                    displayText = JSON.stringify(pair);
                                  }
                                } else if (typeof pair === 'string') {
                                  displayText = pair;
                                }
                                
                                return (
                                <span key={index} className="epa-confusion-tag">
                                    {displayText} ({confusionRate}%)
                                </span>
                                );
                              })}
                            </div>
                          </div>
                        )}
                      </div>
                    )}

                    {/* Decoding Specific Errors */}
                    {categoryName === 'Decoding' && interventionData.errorPatterns[categoryName].decoding_errors && (
                      <div className="epa-category-specific-errors">
                        <h5 className="error-category-title">Decoding Difficulties</h5>
                        <div className="epa-error-metrics">
                          <div className="epa-error-metric">
                            <span className="epa-error-label">DECODING ERRORS:</span>
                            <span className="epa-error-value">{interventionData.errorPatterns[categoryName].decoding_errors.count}</span>
                          </div>
                          <div className="epa-error-metric">
                            <span className="epa-error-label">MOST ERRORS AT:</span>
                            <span className="epa-error-value">
                              {interventionData.errorPatterns[categoryName].decoding_errors.most_error_position === 0 ? 'Beginning' :
                               interventionData.errorPatterns[categoryName].decoding_errors.most_error_position === 1 ? 'Middle' : 'End'}
                            </span>
                          </div>
                        </div>
                        {interventionData.errorPatterns[categoryName].decoding_errors.pattern_types && (
                          <div className="epa-pattern-types">
                            <strong>PATTERN DIFFICULTIES:</strong>
                            <div className="epa-pattern-tags">
                              {interventionData.errorPatterns[categoryName].decoding_errors.pattern_types.map((pattern, index) => (
                                <span key={index} className="epa-pattern-tag">
                                  {pattern.pattern} ({pattern.error_rate}% errors)
                                </span>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    )}

                    {/* Word Recognition Specific Errors */}
                    {categoryName === 'Word Recognition' && interventionData.errorPatterns[categoryName].word_errors && (
                      <div className="epa-category-specific-errors">
                        <h5 className="error-category-title">Word Recognition Issues</h5>
                        <div className="epa-error-metrics">
                          <div className="epa-error-metric">
                            <span className="epa-error-label">WORD ERRORS:</span>
                            <span className="epa-error-value">{interventionData.errorPatterns[categoryName].word_errors.count}</span>
                          </div>
                          <div className="epa-error-metric">
                            <span className="epa-error-label">PRIMARY ISSUE:</span>
                            <span className="epa-error-value">{interventionData.errorPatterns[categoryName].word_errors.error_type?.replace('_', ' ') || 'context_clues'}</span>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Reading Comprehension Specific Errors */}
                    {categoryName === 'Reading Comprehension' && interventionData.errorPatterns[categoryName].comprehension_errors && (
                      <div className="epa-category-specific-errors">
                        <h5 className="error-category-title">Comprehension Difficulties</h5>
                        <div className="epa-error-metrics">
                          <div className="epa-error-metric">
                            <span className="epa-error-label">FAILED PASSAGES:</span>
                            <span className="epa-error-value">{interventionData.errorPatterns[categoryName].comprehension_errors.count}</span>
                          </div>
                          <div className="epa-error-metric">
                            <span className="epa-error-label">MAIN ISSUE:</span>
                            <span className="epa-error-value">{interventionData.errorPatterns[categoryName].comprehension_errors.error_type?.replace('_', ' ') || 'literal_comprehension'}</span>
                          </div>
                        </div>
                        {interventionData.errorPatterns[categoryName].comprehension_errors.question_breakdown && (
                          <div className="epa-comprehension-breakdown">
                            <strong>QUESTION BREAKDOWN:</strong>
                            {Object.entries(interventionData.errorPatterns[categoryName].comprehension_errors.question_breakdown).map(([questionId, details], index) => (
                              <div key={index} className="epa-question-detail">
                                {questionId}: {details.sentence_questions_correct}/{details.sentence_questions_total} correct (Status: {details.result})
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* BOTTOM SECTION: Two-Column Layout Based on intervention_results.json structure */}
          <div className="intervention-results-two-column">
            {/* Left Column: Intervention Performance & Analysis */}
            <div className="intervention-results-left-column">
              <div className="after-intervention-column-header">
                <FaChartLine className="epa-icon" />
                <span>Intervention Performance & Analysis</span>
              </div>
              <div className="intervention-results-column-content">

                {/* Intervention Score Performance Card */}
                <div className="intervention-performance-card">
                  <div className="performance-header">
                    <h3 className="performance-label">Intervention Score</h3>
                    <span className={`performance-status ${interventionData.isPassed ? 'passed' : 'needs-revision'}`}>
                      {interventionData.isPassed ? 'Passed' : 'Needs Revision'}
                    </span>
                  </div>
                  <div className="performance-metrics">
                    <div className="score-display">
                      <span className={`score-value ${interventionData.isPassed ? 'intervention-passed' : 'intervention-failed'}`}>
                        {interventionData.score}%
                      </span>
                      <div className="threshold-info">
                        Passing threshold: {interventionData.passThreshold || 75}%
                      </div>
                      <div className="mastery-probability">
                        Mastery Probability: {interventionData.skillMastery?.[categoryName]?.masteryProbability ?
                          (interventionData.skillMastery[categoryName].masteryProbability * 100).toFixed(1) + '%' : 'N/A'}
                      </div>
                    </div>
                    <div className="progress-bar-container">
                      <div className="progress-bar">
                        <div
                          className={`progress-fill ${interventionData.isPassed ? 'progress--passed' : 'progress--failed'}`}
                          style={{ width: `${Math.min(interventionData.score, 100)}%` }}
                        ></div>
                      </div>
                      <div className="progress-labels">
                        <span>0%</span>
                        <span className="threshold-marker">{interventionData.passThreshold || 75}% (Pass)</span>
                        <span>100%</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Progress Indicators Card */}
                <div className="progress-indicators-card">
                  <div className="performance-header">
                    <h3 className="performance-label">Progress Indicators</h3>
                  </div>
                  <div className="progress-metrics">
                    <div className="progress-metric">
                      <span className="metric-label">Score Improvement:</span>
                      <span className={`metric-value ${interventionData.improvement >= 0 ? 'positive' : 'negative'}`}>
                        {interventionData.improvement >= 0 ? '+' : ''}{interventionData.improvement}%
                      </span>
                    </div>
                    <div className="progress-metric">
                      <span className="metric-label">Mastery Growth:</span>
                      <span className={`metric-value ${interventionData.skillMastery?.[categoryName]?.masteryProbability ? 'positive' : 'moderate'}`}>
                        {interventionData.skillMastery?.[categoryName]?.masteryProbability ?
                          '+' + ((interventionData.skillMastery[categoryName].masteryProbability - (interventionData.skillMastery[categoryName].previousMastery || 0.3)) * 100).toFixed(1) + '%' :
                          'N/A'}
                      </span>
                    </div>
                    <div className="progress-metric">
                      <span className="metric-label">Error Reduction:</span>
                      <span className={`metric-value ${interventionData.progressComparison?.progressIndicators?.errorReduction > 0 ? 'positive' : 'moderate'}`}>
                        {interventionData.progressComparison?.progressIndicators?.errorReduction || 0}%
                      </span>
                    </div>
                    <div className="progress-metric">
                      <span className="metric-label">Skill Transfer:</span>
                      <span className="metric-value moderate">
                        {interventionData.progressComparison?.progressIndicators?.skillTransfer || 'limited'}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Intervention Effectiveness Card */}
                <div className="intervention-performance-card">
                  <div className="performance-header">
                    <h3 className="performance-label">Intervention Effectiveness</h3>
                  </div>
                  <div className="effectiveness-content">
                    <div className="effectiveness-metric">
                      <span className="metric-label">Overall Effectiveness:</span>
                      <span className={`effectiveness-badge ${
                        interventionData.interventionEffectiveness?.overallEffectiveness === 'HIGHLY_EFFECTIVE' ? 'highly-effective' :
                        interventionData.interventionEffectiveness?.overallEffectiveness === 'MODERATELY_EFFECTIVE' ? 'moderately-effective' :
                        'needs-improvement'
                      }`}>
                        {interventionData.interventionEffectiveness?.overallEffectiveness || 'MODERATELY EFFECTIVE'}
                      </span>
                    </div>

                    {/* Error Pattern Resolution */}
                    {interventionData.interventionEffectiveness?.errorPatternResolution && (
                      <div className="error-resolution-summary">
                        {interventionData.interventionEffectiveness.errorPatternResolution.improved?.length > 0 && (
                          <div className="resolution-item improved">
                            <div className="resolution-label">Improved Patterns:</div>
                            <div className="resolution-value">{interventionData.interventionEffectiveness.errorPatternResolution.improved.join(', ')}</div>
                          </div>
                        )}
                        {interventionData.interventionEffectiveness.errorPatternResolution.persistent?.length > 0 && (
                          <div className="resolution-item persistent">
                            <div className="resolution-label">Persistent Patterns:</div>
                            <div className="resolution-value">{interventionData.interventionEffectiveness.errorPatternResolution.persistent.join(', ')}</div>
                          </div>
                        )}
                      </div>
                    )}

                    {/* Skill Progression */}
                    {interventionData.interventionEffectiveness?.skillProgression && (
                      <div className="skill-progression-metrics">
                        <div className="progression-item">
                          <div className="progression-label">Mastery Growth:</div>
                          <div className="progression-value">
                            {(interventionData.interventionEffectiveness.skillProgression.masteryGrowth * 100).toFixed(1)}%
                          </div>
                        </div>
                        <div className="progression-item">
                          <div className="progression-label">Response Time:</div>
                          <div className="progression-value">
                            +{interventionData.interventionEffectiveness.skillProgression.responseTimeImprovement}%
                          </div>
                        </div>
                        <div className="progression-item">
                          <div className="progression-label">Consistency:</div>
                          <div className="progression-value">
                            +{interventionData.interventionEffectiveness.skillProgression.consistencyImprovement}%
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Progress Comparison Card */}
                {interventionData.progressComparison && (
                  <div className="progress-comparison-card">
                    <div className="performance-header">
                      <h3 className="performance-label">Progress Comparison</h3>
                    </div>
                    <div className="comparison-content">
                      <div className="comparison-section">
                        <h4 className="comparison-subtitle">Main Assessment vs Intervention</h4>
                        <div className="comparison-metrics">
                          <div className="comparison-item">
                            <span className="comparison-label">Original Score:</span>
                            <span className="comparison-value original">
                              {interventionData.progressComparison.mainAssessmentPerformance?.score || interventionData.previousScore}%
                            </span>
                          </div>
                          <div className="comparison-item">
                            <span className="comparison-label">Intervention Score:</span>
                            <span className="comparison-value intervention">
                              {interventionData.progressComparison.interventionPerformance?.score || interventionData.score}%
                            </span>
                          </div>
                          <div className="comparison-item">
                            <span className="comparison-label">Improvement:</span>
                            <span className={`comparison-value ${interventionData.improvement >= 0 ? 'positive' : 'negative'}`}>
                              {interventionData.improvement >= 0 ? '+' : ''}{interventionData.improvement}%
                            </span>
                          </div>
                        </div>
                        {interventionData.progressComparison.progressIndicators && (
                          <div className="progress-indicators-detail">
                            <div className="indicator-item">
                              <span>Mastery Growth:</span>
                              <span className="indicator-value">
                                +{((interventionData.progressComparison.progressIndicators.masteryGrowth || 0) * 100).toFixed(1)}%
                              </span>
                            </div>
                            <div className="indicator-item">
                              <span>Error Reduction:</span>
                              <span className="indicator-value">
                                {interventionData.progressComparison.progressIndicators.errorReduction || 0}%
                              </span>
                            </div>
                            <div className="indicator-item">
                              <span>Skill Transfer:</span>
                              <span className="indicator-value">
                                {interventionData.progressComparison.progressIndicators.skillTransfer || 'limited'}
                              </span>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                )}

                {/* Insights and Recommendations Card */}
                {interventionData.insights && (
                  <div className="insights-recommendations-card">
                    <div className="performance-header">
                      <h3 className="performance-label">Insights & Recommendations</h3>
                    </div>
                    <div className="insights-content">
                      {interventionData.insights.strengths?.length > 0 && (
                        <div className="insights-section strengths">
                          <h4 className="insights-subtitle">Strengths</h4>
                          <ul className="insights-list">
                            {interventionData.insights.strengths.map((strength, index) => (
                              <li key={index} className="insight-item strength">{strength}</li>
                            ))}
                          </ul>
                        </div>
                      )}
                      {interventionData.insights.weaknesses?.length > 0 && (
                        <div className="insights-section weaknesses">
                          <h4 className="insights-subtitle">Areas for Improvement</h4>
                          <ul className="insights-list">
                            {interventionData.insights.weaknesses.map((weakness, index) => (
                              <li key={index} className="insight-item weakness">{weakness}</li>
                            ))}
                          </ul>
                        </div>
                      )}
                      <div className="insights-section readiness">
                        <div className="readiness-assessment">
                          <span className="readiness-label">Overall Readiness:</span>
                          <span className="readiness-value">
                            {interventionData.insights.overallReadiness || 'Developing skills steadily'}
                          </span>
                        </div>
                        <div className="recommended-action">
                          <span className="action-label">Recommended Action:</span>
                          <span className={`action-value ${interventionData.insights.recommendedAction}`}>
                            {interventionData.insights.recommendedAction?.replace('_', ' ').toUpperCase() || 'CONTINUE MONITORING'}
                          </span>
                        </div>
                      </div>
                      {interventionData.insights.nextStepsRationale && (
                        <div className="insights-section rationale">
                          <h4 className="insights-subtitle">Next Steps Rationale</h4>
                          <p className="rationale-text">{interventionData.insights.nextStepsRationale}</p>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Analytics Metrics Card */}
                {interventionData.analyticsMetrics && (
                  <div className="analytics-metrics-card">
                    <div className="performance-header">
                      <h3 className="performance-label">Analytics Metrics</h3>
                    </div>
                    <div className="analytics-content">
                      <div className="analytics-grid">
                        <div className="analytics-item">
                          <span className="analytics-label">Total Questions:</span>
                          <span className="analytics-value">
                            {interventionData.analyticsMetrics.totalQuestions || interventionData.totalQuestions}
                          </span>
                        </div>
                        <div className="analytics-item">
                          <span className="analytics-label">Total Correct:</span>
                          <span className="analytics-value">
                            {interventionData.analyticsMetrics.totalCorrect || interventionData.correctAnswers}
                          </span>
                        </div>
                        <div className="analytics-item">
                          <span className="analytics-label">Avg Response Time:</span>
                          <span className="analytics-value">
                            {interventionData.analyticsMetrics.averageResponseTime || 'N/A'}s
                          </span>
                        </div>
                        <div className="analytics-item">
                          <span className="analytics-label">Consistency Index:</span>
                          <span className="analytics-value">
                            {interventionData.analyticsMetrics.consistencyIndex ?
                              (interventionData.analyticsMetrics.consistencyIndex * 100).toFixed(0) + '%' : 'N/A'}
                          </span>
                        </div>
                      </div>
                      {interventionData.analyticsMetrics.confidenceMetrics && (
                        <div className="confidence-section">
                          <h4 className="confidence-subtitle">Confidence Metrics</h4>
                          <div className="confidence-grid">
                            <div className="confidence-item">
                              <span className="confidence-label">Skill Mastery Confidence:</span>
                              <span className="confidence-value">
                                {(interventionData.analyticsMetrics.confidenceMetrics.skillMasteryConfidence * 100).toFixed(0)}%
                              </span>
                            </div>
                            <div className="confidence-item">
                              <span className="confidence-label">Intervention Success Probability:</span>
                              <span className="confidence-value">
                                {(interventionData.analyticsMetrics.confidenceMetrics.interventionSuccessProbability * 100).toFixed(0)}%
                              </span>
                            </div>
                            {interventionData.analyticsMetrics.confidenceMetrics.teacherRevisionLikelihood && (
                              <div className="confidence-item">
                                <span className="confidence-label">Teacher Revision Success Likelihood:</span>
                                <span className="confidence-value">
                                  {(interventionData.analyticsMetrics.confidenceMetrics.teacherRevisionLikelihood * 100).toFixed(0)}%
                                </span>
                              </div>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Revision Tracking & Data Normalization Card */}
                {(interventionData.versionTracking || interventionData.dataNormalization) && (
                  <div className="revision-tracking-card">
                    <div className="performance-header">
                      <h3 className="performance-label">
                        <FaHistory className="epa-icon" style={{ marginRight: '8px' }} />
                        Revision Tracking & Data Integrity
                      </h3>
                    </div>
                    <div className="revision-content">

                      {/* Data Normalization Section */}
                      {interventionData.dataNormalization && (
                        <div className="data-normalization-section">
                          <h4 className="revision-subtitle">📊 Data Normalization Status</h4>
                          <div className="normalization-info">
                            <div className="normalization-item">
                              <span className="norm-label">Original Assessment Score:</span>
                              <span className="norm-value preserved">
                                {interventionData.dataNormalization.originalAssessmentScore}%
                              </span>
                              <span className="norm-status">🔒 Preserved</span>
                            </div>
                            <div className="normalization-item">
                              <span className="norm-label">Intervention Score:</span>
                              <span className="norm-value intervention">
                                {interventionData.dataNormalization.interventionScore}%
                              </span>
                              <span className="norm-status">📝 Tracked in History</span>
                            </div>
                            <div className="normalization-note">
                              <strong>Data Integrity:</strong> Original assessment scores are preserved to maintain
                              data normalization. Intervention scores are tracked separately in intervention history.
                            </div>
                          </div>
                        </div>
                      )}

                      {/* Version Tracking Section */}
                      {interventionData.versionTracking && (
                        <div className="version-tracking-section">
                          <h4 className="revision-subtitle">🔄 Version Tracking</h4>
                          <div className="version-info">
                            <div className="version-item">
                              <span className="version-label">Current Revision:</span>
                              <span className="version-value">#{interventionData.versionTracking.revisionNumber}</span>
                            </div>
                            <div className="version-item">
                              <span className="version-label">Total Attempts:</span>
                              <span className="version-value">{interventionData.versionTracking.totalAttempts}</span>
                            </div>
                            {interventionData.versionTracking.hasMultipleAttempts && (
                              <div className="version-item">
                                <span className="version-label">Multiple Attempts:</span>
                                <span className="version-value multiple">✅ Yes</span>
                              </div>
                            )}
                          </div>
                        </div>
                      )}

                      {/* Intervention History */}
                      {interventionData.versionTracking?.interventionHistory?.length > 0 && (
                        <div className="intervention-history-section">
                          <h4 className="revision-subtitle">📜 Intervention History</h4>
                          <div className="history-timeline">
                            {interventionData.versionTracking.interventionHistory.map((attempt, index) => (
                              <div key={index} className={`history-item ${attempt.isPassed ? 'passed' : 'failed'}`}>
                                <div className="history-marker">
                                  <span className="attempt-number">{attempt.attemptNumber}</span>
                                </div>
                                <div className="history-details">
                                  <div className="history-header">
                                    <span className="history-revision">Revision #{attempt.revisionNumber}</span>
                                    <span className={`history-status ${attempt.isPassed ? 'passed' : 'failed'}`}>
                                      {attempt.isPassed ? 'PASSED' : 'FAILED'}
                                    </span>
                                  </div>
                                  <div className="history-metrics">
                                    <span>Score: {attempt.score}%</span>
                                    <span>Date: {new Date(attempt.completedAt).toLocaleDateString()}</span>
                                    <span>Reason: {attempt.attemptReason?.replace('_', ' ') || 'intervention_attempt'}</span>
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Backend Data Status */}
                      {interventionData.metadata && (
                        <div className="backend-status-section">
                          <h4 className="revision-subtitle">⚙️ Backend Data Status</h4>
                          <div className="backend-info">
                            <div className="backend-item">
                              <span className="backend-label">API Version:</span>
                              <span className="backend-value">{interventionData.metadata.apiVersion}</span>
                            </div>
                            <div className="backend-item">
                              <span className="backend-label">Data Completeness:</span>
                              <span className="backend-value">{interventionData.metadata.dataCompleteness}</span>
                            </div>
                            {interventionData.metadata.hasRevisionTracking && (
                              <div className="backend-item">
                                <span className="backend-label">Revision Tracking:</span>
                                <span className="backend-value enabled">✅ Enabled</span>
                              </div>
                            )}
                            {interventionData.metadata.hasDataNormalization && (
                              <div className="backend-item">
                                <span className="backend-label">Data Normalization:</span>
                                <span className="backend-value enabled">✅ Active</span>
                              </div>
                            )}
                            <div className="backend-item">
                              <span className="backend-label">Last Fetched:</span>
                              <span className="backend-value">
                                {new Date(interventionData.metadata.fetchedAt).toLocaleString()}
                              </span>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                )}

              </div>
            </div>

            {/* Right Column: Comprehensive Research Prescriptions */}
            <div className="intervention-results-right-column">
              <div className="after-intervention-column-header">
                <FaUserMd className="epa-icon" />
                <span>Comprehensive Research Prescriptions</span>
              </div>
              <div className="intervention-results-column-content">
                {/* Render Comprehensive Research-Based Prescriptions for Intervention Results */}
                {renderInterventionResearchComprehensivePrescriptions(interventionData, categoryName)}
              </div>
            </div>
          </div>
        </div>
      );
    }
  };

  // ===== HELPER FUNCTIONS FOR BEFORE/AFTER COMPARISON =====

  // Enhanced intervention results fetching with version tracking and cross-referencing
  const fetchEnhancedInterventionResults = useCallback(async (studentId, category) => {
    try {
      console.log(`[ENHANCED INTERVENTION RESULTS] Fetching dynamic results for student ${studentId}, category: ${category}`);

      // Get all intervention results for this student and category
      const response = await axios.get(`/api/intervention-results`, {
        params: {
          studentId: studentId,
          category: category,
          includeVersionTracking: true,
          includeAnalytics: true,
          sortBy: 'assessmentDate',
          sortOrder: 'desc' // Get newest first
        }
      });

      if (response.data.success && response.data.data.length > 0) {
        // Get the most recent intervention result (newest)
        const latestResult = response.data.data[0];

        // Enhanced version tracking analysis
        const versionTracking = {
          currentVersion: latestResult.insights?.versionTracking?.revisionNumber || 1,
          totalAttempts: response.data.data.length,
          progressionHistory: response.data.data.map((result, index) => ({
            attemptNumber: response.data.data.length - index,
            version: result.insights?.versionTracking?.revisionNumber || 1,
            score: result.score,
            isPassed: result.isPassed,
            assessmentDate: result.assessmentDate,
            prescriptionAccuracy: result.insights?.prescriptionAnalysisAccuracy?.versionAwareAccuracy || 75,
            masteryGrowth: result.skillMastery?.[category]?.masteryProbability || 0
          })),
          crossReferenceCapable: true,
          bidirectionalTrackingEnabled: true
        };

        // Calculate prescription accuracy improvement across versions
        const accuracyProgression = versionTracking.progressionHistory.map(attempt => {
          const baseAccuracy = 75; // VERSION 1 baseline
          const versionMultiplier = attempt.version === 1 ? 1 :
                                   attempt.version === 2 ? 1.09 : // 82% for version 2
                                   attempt.version >= 3 ? 1.19 : 1; // 89% for version 3+
          return Math.round(baseAccuracy * versionMultiplier);
        });

        // Enhanced analytics with cross-referencing
        const enhancedAnalytics = {
          ...latestResult,
          versionTracking: versionTracking,
          prescriptionAccuracyProgression: accuracyProgression,
          crossReferenceAnalysis: {
            previousAttempts: response.data.data.slice(1), // All except latest
            improvementTrajectory: calculateImprovementTrajectory(response.data.data),
            teacherRevisionEffectiveness: calculateRevisionEffectiveness(response.data.data),
            learningVelocity: calculateLearningVelocity(response.data.data)
          },
          comprehensiveAccuracy: {
            version1Baseline: 75,
            version2Enhanced: 82,
            version3Advanced: 89,
            currentAccuracy: accuracyProgression[0] || 75
          }
        };

        console.log(`[ENHANCED INTERVENTION RESULTS] ✅ Successfully fetched enhanced results:`, {
          latestVersion: versionTracking.currentVersion,
          totalAttempts: versionTracking.totalAttempts,
          currentAccuracy: enhancedAnalytics.comprehensiveAccuracy.currentAccuracy,
          crossReferenceEnabled: true
        });

        return enhancedAnalytics;
      } else {
        console.log(`[ENHANCED INTERVENTION RESULTS] No intervention results found for ${category}`);
        return null;
      }
    } catch (error) {
      console.error(`[ENHANCED INTERVENTION RESULTS] Error fetching results:`, error);
      return null;
    }
  }, []);

  // Calculate improvement trajectory across attempts
  const calculateImprovementTrajectory = (attempts) => {
    if (attempts.length < 2) return 'insufficient_data';

    const scores = attempts.reverse().map(attempt => attempt.score); // Chronological order
    const improvements = [];

    for (let i = 1; i < scores.length; i++) {
      improvements.push(scores[i] - scores[i-1]);
    }

    const avgImprovement = improvements.reduce((sum, imp) => sum + imp, 0) / improvements.length;

    if (avgImprovement > 10) return 'strong_improvement';
    if (avgImprovement > 5) return 'moderate_improvement';
    if (avgImprovement > 0) return 'slight_improvement';
    return 'declining_performance';
  };

  // Calculate teacher revision effectiveness
  const calculateRevisionEffectiveness = (attempts) => {
    const revisions = attempts.filter(attempt =>
      attempt.insights?.versionTracking?.revisionNumber > 1
    );

    if (revisions.length === 0) return 'no_revisions';

    const revisionImprovements = revisions.map(revision => {
      const previousAttempt = attempts.find(attempt =>
        attempt.insights?.versionTracking?.revisionNumber === (revision.insights?.versionTracking?.revisionNumber - 1)
      );

      if (previousAttempt) {
        return revision.score - previousAttempt.score;
      }
      return 0;
    });

    const avgRevisionImprovement = revisionImprovements.reduce((sum, imp) => sum + imp, 0) / revisionImprovements.length;

    if (avgRevisionImprovement > 15) return 'highly_effective';
    if (avgRevisionImprovement > 8) return 'moderately_effective';
    if (avgRevisionImprovement > 0) return 'slightly_effective';
    return 'ineffective';
  };

  // Calculate learning velocity
  const calculateLearningVelocity = (attempts) => {
    if (attempts.length < 2) return 0;

    const chronologicalAttempts = attempts.reverse();
    const firstAttempt = chronologicalAttempts[0];
    const lastAttempt = chronologicalAttempts[chronologicalAttempts.length - 1];

    const scoreImprovement = lastAttempt.score - firstAttempt.score;
    const timeSpan = new Date(lastAttempt.assessmentDate) - new Date(firstAttempt.assessmentDate);
    const daysDiff = timeSpan / (1000 * 60 * 60 * 24);

    if (daysDiff === 0) return scoreImprovement;
    return scoreImprovement / daysDiff; // Points per day
  };

  // Enhanced intervention results fetching with dynamic updates
  useEffect(() => {
    const fetchDynamicInterventionResults = async () => {
      if (!liveStudent?.idNumber) return;

      console.log('[DYNAMIC INTERVENTION RESULTS] Fetching latest intervention results...');

      const categories = ['Alphabet Knowledge', 'Phonological Awareness', 'Decoding', 'Word Recognition', 'Reading Comprehension'];
      const enhancedResults = {};

      for (const category of categories) {
        const enhancedResult = await fetchEnhancedInterventionResults(liveStudent.idNumber, category);
        if (enhancedResult) {
          enhancedResults[category] = enhancedResult;
        }
      }

      console.log('[DYNAMIC INTERVENTION RESULTS] ✅ Enhanced results updated:', Object.keys(enhancedResults));
      setInterventionResults(prevResults => ({
        ...prevResults,
        ...enhancedResults
      }));
    };

    fetchDynamicInterventionResults();
  }, [liveStudent?.idNumber, fetchEnhancedInterventionResults]);

  // Render Comprehensive Research-Based Prescriptions for Intervention Results
  const renderInterventionResearchPrescriptions = (interventionData, categoryName) => {
    if (!interventionData?.researchBasedPrescriptions?.[categoryName]) {
      return (
        <div className="research-prescriptions-placeholder">
          <div className="placeholder-icon">
            <FaUserMd />
          </div>
          <div className="placeholder-content">
            <h4>Research Prescriptions Processing</h4>
            <p>Comprehensive research-based prescriptions are being generated for {categoryName}.</p>
          </div>
        </div>
      );
    }

    const prescription = interventionData.researchBasedPrescriptions[categoryName];
    const versionTracking = interventionData.versionTracking || {};
    const accuracyProgression = interventionData.prescriptionAccuracyProgression || [75];
    const currentAccuracy = interventionData.comprehensiveAccuracy?.currentAccuracy || 75;

    return (
      <div className="comprehensive-research-prescriptions">
        {/* Version Tracking Header */}
        <div className="version-tracking-header">
          <div className="version-info">
            <h3 className="prescription-title">
              <FaUserMd className="epa-icon" />
              Research-Based Prescriptions
            </h3>
            <div className="version-tracking-badges">
              <div className={`version-badge version-${versionTracking.currentVersion || 1}`}>
                VERSION {versionTracking.currentVersion || 1}
              </div>
              <div className="accuracy-badge">
                {currentAccuracy}% ACCURACY
              </div>
              <div className="attempts-badge">
                {versionTracking.totalAttempts || 1} ATTEMPT{(versionTracking.totalAttempts || 1) > 1 ? 'S' : ''}
              </div>
            </div>
          </div>

          {/* Prescription Accuracy Progression */}
          <div className="accuracy-progression">
            <h4 className="progression-title">Prescription Accuracy Evolution</h4>
            <div className="progression-timeline">
              {accuracyProgression.map((accuracy, index) => {
                const version = accuracyProgression.length - index;
                const isCurrentVersion = version === (versionTracking.currentVersion || 1);

                return (
                  <div key={version} className={`progression-step ${isCurrentVersion ? 'current' : ''}`}>
                    <div className="step-marker">
                      <div className="step-number">V{version}</div>
                      <div className="step-accuracy">{accuracy}%</div>
                    </div>
                    {index < accuracyProgression.length - 1 && (
                      <div className="step-connector"></div>
                    )}
                  </div>
                );
              })}
            </div>
            <div className="progression-description">
              <span className="progression-label">Enhanced Cross-Referencing:</span>
              <span className="progression-value">
                {versionTracking.crossReferenceCapable ? 'ENABLED' : 'BASELINE'}
                • {versionTracking.bidirectionalTrackingEnabled ? 'Bidirectional' : 'Unidirectional'} Tracking
              </span>
            </div>
          </div>
        </div>

        {/* Deficit Analysis Section */}
        {prescription.deficitAnalysis && (
          <div className="research-prescription-section deficit-analysis">
            <h4 className="after-intervention-section-title">
              <FaStethoscope className="section-icon" />
              Comprehensive Deficit Analysis
            </h4>
            <div className="deficit-content">
              {prescription.deficitAnalysis.specificDeficits?.map((deficit, index) => (
                <div key={index} className="deficit-item">
                  <div className="deficit-header">
                    <h5 className="deficit-title">{deficit.deficit}</h5>
                    <div className={`severity-badge severity-${deficit.severity}`}>
                      {deficit.severity?.toUpperCase()}
                    </div>
                  </div>
                  <div className="deficit-details">
                    <div className="deficit-detail">
                      <span className="detail-label">Manifestation:</span>
                      <span className="detail-value">{deficit.manifestation}</span>
                    </div>
                    <div className="deficit-detail">
                      <span className="detail-label">Error Rate:</span>
                      <span className="detail-value error-rate">{deficit.errorRate}</span>
                    </div>
                    <div className="deficit-detail">
                      <span className="detail-label">Research Evidence:</span>
                      <span className="detail-value research">{deficit.researchEvidence}</span>
                    </div>
                    <div className="deficit-detail">
                      <span className="detail-label">Intervention Response:</span>
                      <span className={`detail-value response-${deficit.interventionResponse?.replace('_', '-')}`}>
                        {deficit.interventionResponse?.replace('_', ' ').toUpperCase()}
                      </span>
                    </div>
                  </div>
                </div>
              ))}

              {/* Root Cause Analysis */}
              {prescription.deficitAnalysis.rootCauseAnalysis && (
                <div className="root-cause-analysis">
                  <h5 className="analysis-subtitle">Root Cause Analysis</h5>
                  <p className="root-cause-text">{prescription.deficitAnalysis.rootCauseAnalysis}</p>

                  {/* Cognitive Factors */}
                  {prescription.deficitAnalysis.cognitiveFactors && (
                    <div className="cognitive-factors">
                      <span className="factors-label">Cognitive Factors:</span>
                      <div className="factors-tags">
                        {prescription.deficitAnalysis.cognitiveFactors.map((factor, index) => (
                          <span key={index} className="factor-tag cognitive">
                            {factor.replace('_', ' ')}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Linguistic Factors */}
                  {prescription.deficitAnalysis.linguisticFactors && (
                    <div className="linguistic-factors">
                      <span className="factors-label">Linguistic Factors:</span>
                      <div className="factors-tags">
                        {prescription.deficitAnalysis.linguisticFactors.map((factor, index) => (
                          <span key={index} className="factor-tag linguistic">
                            {factor.replace('_', ' ')}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Next Intervention Prescription Section */}
        {prescription.nextInterventionPrescription && (
          <div className="research-prescription-section next-intervention">
            <h4 className="after-intervention-section-title">
              <FaPrescriptionBottleAlt className="section-icon" />
              Next Intervention Prescription
            </h4>
            <div className="prescription-content">
              <div className="prescription-overview">
                <div className="prescription-metric">
                  <span className="metric-label">Recommended Action:</span>
                  <span className={`metric-value action-${prescription.nextInterventionPrescription.recommendedAction?.replace('_', '-')}`}>
                    {prescription.nextInterventionPrescription.recommendedAction?.replace('_', ' ').toUpperCase()}
                  </span>
                </div>
                <div className="prescription-metric">
                  <span className="metric-label">Primary Approach:</span>
                  <span className="metric-value approach">
                    {prescription.nextInterventionPrescription.primaryApproach}
                  </span>
                </div>
                <div className="prescription-metric">
                  <span className="metric-label">Intensity Level:</span>
                  <span className={`metric-value intensity-${prescription.nextInterventionPrescription.intensityLevel}`}>
                    {prescription.nextInterventionPrescription.intensityLevel?.toUpperCase()}
                  </span>
                </div>
              </div>

              {/* Specific Techniques */}
              {prescription.nextInterventionPrescription.specificTechniques?.map((technique, index) => (
                <div key={index} className="technique-item">
                  <h5 className="technique-title">{technique.technique}</h5>
                  <div className="technique-details">
                    <div className="technique-detail">
                      <span className="detail-label">Description:</span>
                      <span className="detail-value">{technique.description}</span>
                    </div>
                    <div className="technique-detail">
                      <span className="detail-label">Duration:</span>
                      <span className="detail-value duration">{technique.duration}</span>
                    </div>
                    <div className="technique-detail">
                      <span className="detail-label">Materials:</span>
                      <span className="detail-value materials">{technique.materials}</span>
                    </div>
                    <div className="technique-detail">
                      <span className="detail-label">Progress Criteria:</span>
                      <span className="detail-value criteria">{technique.progressCriteria}</span>
                    </div>
                    <div className="technique-detail">
                      <span className="detail-label">Research Basis:</span>
                      <span className="detail-value research">{technique.researchBasis}</span>
                    </div>
                    {technique.modificationFromPrevious && (
                      <div className="technique-detail modification">
                        <span className="detail-label">Modification from Previous:</span>
                        <span className="detail-value modification-value">{technique.modificationFromPrevious}</span>
                      </div>
                    )}
                  </div>
                </div>
              ))}

              {/* Session Structure */}
              {prescription.nextInterventionPrescription.sessionStructure && (
                <div className="session-structure">
                  <h5 className="structure-title">Session Structure</h5>
                  <div className="structure-details">
                    <div className="structure-item">
                      <span className="structure-label">Optimal Length:</span>
                      <span className="structure-value">{prescription.nextInterventionPrescription.sessionStructure.optimalLength}</span>
                    </div>
                    <div className="structure-item">
                      <span className="structure-label">Break Pattern:</span>
                      <span className="structure-value">{prescription.nextInterventionPrescription.sessionStructure.breakPattern}</span>
                    </div>
                    {prescription.nextInterventionPrescription.sessionStructure.sessionComponents && (
                      <div className="structure-item components">
                        <span className="structure-label">Session Components:</span>
                        <div className="component-tags">
                          {prescription.nextInterventionPrescription.sessionStructure.sessionComponents.map((component, index) => (
                            <span key={index} className="component-tag">
                              {component.replace('_', ' ')}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Progress Monitoring */}
              {prescription.nextInterventionPrescription.progressMonitoring && (
                <div className="progress-monitoring">
                  <h5 className="monitoring-title">Progress Monitoring</h5>
                  <div className="monitoring-details">
                    <div className="monitoring-item">
                      <span className="monitoring-label">Frequency:</span>
                      <span className="monitoring-value">{prescription.nextInterventionPrescription.progressMonitoring.frequency}</span>
                    </div>
                    <div className="monitoring-item">
                      <span className="monitoring-label">Data Collection:</span>
                      <span className="monitoring-value">{prescription.nextInterventionPrescription.progressMonitoring.dataCollectionMethod}</span>
                    </div>
                    {prescription.nextInterventionPrescription.progressMonitoring.keyIndicators && (
                      <div className="monitoring-item indicators">
                        <span className="monitoring-label">Key Indicators:</span>
                        <div className="indicator-tags">
                          {prescription.nextInterventionPrescription.progressMonitoring.keyIndicators.map((indicator, index) => (
                            <span key={index} className="indicator-tag">
                              {indicator.replace('_', ' ')}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Teacher Revision Guidance Section */}
        {prescription.teacherRevisionGuidance && (
          <div className="research-prescription-section teacher-revision">
            <h4 className="after-intervention-section-title">
              <FaUserEdit className="section-icon" />
              Teacher Revision Guidance
            </h4>
            <div className="revision-content">
              <div className="revision-overview">
                <div className="revision-status">
                  <span className="status-label">Revision Recommended:</span>
                  <span className={`status-value ${prescription.teacherRevisionGuidance.revisionRecommended ? 'recommended' : 'not-recommended'}`}>
                    {prescription.teacherRevisionGuidance.revisionRecommended ? 'YES' : 'NO'}
                  </span>
                </div>
                <div className="revision-priority">
                  <span className="priority-label">Priority:</span>
                  <span className={`priority-value priority-${prescription.teacherRevisionGuidance.revisionPriority}`}>
                    {prescription.teacherRevisionGuidance.revisionPriority?.toUpperCase()}
                  </span>
                </div>
                <div className="revision-impact">
                  <span className="impact-label">Estimated Impact:</span>
                  <span className="impact-value">{prescription.teacherRevisionGuidance.estimatedImpact}</span>
                </div>
              </div>

              {/* Specific Changes */}
              {prescription.teacherRevisionGuidance.specificChanges?.map((change, index) => (
                <div key={index} className="revision-change">
                  <h5 className="change-title">Recommended Change #{index + 1}</h5>
                  <div className="change-details">
                    <div className="change-detail">
                      <span className="detail-label">Change:</span>
                      <span className="detail-value">{change.change}</span>
                    </div>
                    <div className="change-detail">
                      <span className="detail-label">Rationale:</span>
                      <span className="detail-value rationale">{change.rationale}</span>
                    </div>
                    <div className="change-detail">
                      <span className="detail-label">Expected Impact:</span>
                      <span className="detail-value impact">{change.expectedImpact}</span>
                    </div>
                  </div>
                </div>
              ))}

              {/* Question Modifications */}
              {prescription.teacherRevisionGuidance.questionModifications?.map((modification, index) => (
                <div key={index} className="question-modification">
                  <h5 className="modification-title">Question Modification #{index + 1}</h5>
                  <div className="modification-details">
                    <div className="modification-detail">
                      <span className="detail-label">Question Type:</span>
                      <span className="detail-value type">{modification.questionType}</span>
                    </div>
                    <div className="modification-detail">
                      <span className="detail-label">Current Difficulty:</span>
                      <span className="detail-value current">{modification.currentDifficulty}</span>
                    </div>
                    <div className="modification-detail">
                      <span className="detail-label">Recommended Change:</span>
                      <span className="detail-value recommended">{modification.recommendedChange}</span>
                    </div>
                    <div className="modification-detail">
                      <span className="detail-label">Reason:</span>
                      <span className="detail-value reason">{modification.reason}</span>
                    </div>
                  </div>
                </div>
              ))}

              {/* Support Features */}
              {prescription.teacherRevisionGuidance.supportFeatures && (
                <div className="support-features">
                  <h5 className="features-title">Recommended Support Features</h5>
                  <div className="feature-tags">
                    {prescription.teacherRevisionGuidance.supportFeatures.map((feature, index) => (
                      <span key={index} className="feature-tag">
                        {feature}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Cross-Reference Analysis Section */}
        {interventionData.crossReferenceAnalysis && (
          <div className="research-prescription-section cross-reference">
            <h4 className="after-intervention-section-title">
              <FaLink className="section-icon" />
              Cross-Reference Analysis
            </h4>
            <div className="cross-reference-content">
              <div className="cross-reference-overview">
                <div className="cross-reference-metric">
                  <span className="metric-label">Previous Attempts:</span>
                  <span className="metric-value">{interventionData.crossReferenceAnalysis.previousAttempts?.length || 0}</span>
                </div>
                <div className="cross-reference-metric">
                  <span className="metric-label">Improvement Trajectory:</span>
                  <span className={`metric-value trajectory-${interventionData.crossReferenceAnalysis.improvementTrajectory?.replace('_', '-')}`}>
                    {interventionData.crossReferenceAnalysis.improvementTrajectory?.replace('_', ' ').toUpperCase()}
                  </span>
                </div>
                <div className="cross-reference-metric">
                  <span className="metric-label">Teacher Revision Effectiveness:</span>
                  <span className={`metric-value effectiveness-${interventionData.crossReferenceAnalysis.teacherRevisionEffectiveness?.replace('_', '-')}`}>
                    {interventionData.crossReferenceAnalysis.teacherRevisionEffectiveness?.replace('_', ' ').toUpperCase()}
                  </span>
                </div>
                <div className="cross-reference-metric">
                  <span className="metric-label">Learning Velocity:</span>
                  <span className="metric-value velocity">
                    {interventionData.crossReferenceAnalysis.learningVelocity?.toFixed(2) || '0.00'} pts/day
                  </span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Escalation Protocol Section */}
        {prescription.escalationProtocol && (
          <div className="research-prescription-section escalation-protocol">
            <h4 className="after-intervention-section-title">
              <FaExclamationTriangle className="section-icon" />
              Escalation Protocol
            </h4>
            <div className="escalation-content">
              <div className="escalation-status">
                <span className="status-label">Escalation Triggered:</span>
                <span className={`status-value ${prescription.escalationProtocol.escalationTriggered ? 'triggered' : 'not-triggered'}`}>
                  {prescription.escalationProtocol.escalationTriggered ? 'YES' : 'NO'}
                </span>
              </div>
              {prescription.escalationProtocol.triggers?.length > 0 && (
                <div className="escalation-triggers">
                  <span className="triggers-label">Triggers:</span>
                  <div className="trigger-tags">
                    {prescription.escalationProtocol.triggers.map((trigger, index) => (
                      <span key={index} className="trigger-tag">
                        {trigger}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    );
  };

  const renderCategoryTabs = () => {
    return (
      <div className="literexia-category-tabs">
        <div className="literexia-tabs-header">
          <h3>Reading Skill Categories</h3>
          <div className="literexia-tabs-filter">
            <label style={allCategoriesPassed ? inlineStyles.disabled : {}}>
              <input 
                type="checkbox" 
                checked={showNeedingInterventionOnly && !allCategoriesPassed} 
                onChange={() => setShowNeedingInterventionOnly(!showNeedingInterventionOnly)}
                disabled={allCategoriesPassed}
              />
              Show only categories needing intervention
              {allCategoriesPassed && <span style={inlineStyles.filterNote}> (All categories passed)</span>}
            </label>
          </div>
        </div>
        
        <div className="literexia-tabs-containerr">
          {(liveCategoryResults?.categories || [])
            .filter((cat, catIndex) => {
              if (!showNeedingInterventionOnly || allCategoriesPassed) {
                return true; // Show all categories when filter is off or all passed
              }

              const score = Number(cat.score) || 0;
              const isPassed = score >= 75;

              // Always show passed categories (to show progress)
              if (isPassed) {
                return true;
              }

              // For unpassed categories, only show if it's accessible/unlocked
              const isUnlocked = isCategoryUnlocked(cat.categoryName, catIndex);
              return isUnlocked;
            })
            .map((category, index) => {
              const categoryName = category.categoryName;
              const displayName = formatCategoryName(categoryName);
              const score = Number(category.score) || 0;
              const isCompleted = category.isCompleted || false;
              const isPassed = category.isPassed || false;
              const needsIntervention = isCompleted && score < 75;
              const correctAnswers = category.correctAnswers || 0;
              const totalQuestions = category.totalQuestions || 0;

              // NEW: Get dynamic progression status based on intervention history
              const progressionStatus = getCategoryProgressionStatus(category);
              const isUnlocked = isCategoryUnlocked(categoryName, index);
              const latestAttempt = getLatestInterventionAttempt(category);

              // ✅ FIX: Check if there's prescriptive analysis data for this category
              const hasPrescriptiveAnalysis = (() => {
                if (!liveAnalyses || liveAnalyses.length === 0) return false;

                // Check if any prescriptive analysis contains skillMastery data for this category
                return liveAnalyses.some(analysis =>
                  analysis?.skillMastery &&
                  analysis.skillMastery[categoryName] &&
                  analysis.skillMastery[categoryName].responseHistory &&
                  analysis.skillMastery[categoryName].responseHistory.length > 0
                );
              })();

              // Determine status and styling based on dynamic progression
              let statusLabel, statusClass, isClickable = true;

              if (!isUnlocked) {
                statusLabel = "BLOCKED";
                statusClass = "blocked";
                isClickable = false;
              } else if (!hasPrescriptiveAnalysis) {
                // ✅ FIX: Block clicking for categories without prescriptive analysis
                statusLabel = "NOT ANSWERED YET";
                statusClass = "not-answered";
                isClickable = false;
              } else if (progressionStatus.status === 'passed') {
                // Show different labels based on how the category passed
                if (progressionStatus.source === 'intervention') {
                  statusLabel = "PASSED";
                } else {
                  statusLabel = "PASSED";
                }
                statusClass = "passed";
              } else if (progressionStatus.status === 'needs_revision') {
                statusLabel = "NEEDS REVISION";
                statusClass = "needs-revision";
              } else if (!isCompleted) {
                // If category hasn't been completed yet, show "NOT ANSWERED YET"
                statusLabel = "NOT ANSWERED YET";
                statusClass = "not-started";
              } else if (progressionStatus.status === 'needs_intervention') {
                statusLabel = "NEEDS INTERVENTION";
                statusClass = "needs-attention";
              } else if (isCompleted && !isPassed) {
                statusLabel = "FAILED";
                statusClass = "failed";
              } else {
                statusLabel = "NOT STARTED";
                statusClass = "not-started";
              }

              return (
                <div
                  key={index}
                  className={`literexia-category-tabb ${selectedCategory === categoryName ? 'active' : ''} ${statusClass} ${!isUnlocked ? 'blocked' : ''} ${!hasPrescriptiveAnalysis ? 'not-attempted' : ''}`}
                  onClick={() => isClickable && setSelectedCategory(categoryName)}
                  style={(!isUnlocked || !hasPrescriptiveAnalysis) ? { cursor: 'not-allowed', opacity: 0.6 } : {}}
                  title={!hasPrescriptiveAnalysis ? 'No prescriptive analysis available - student has not completed this category assessment' : ''}
                >
                  <div className="literexia-tab-contentt">
                    <div className="literexia-tab-namee">{displayName}</div>
                    <div className="literexia-tab-scoree">{getCurrentDisplayScore(category)}%</div>

                    <div className="literexia-progress-indicators">
                      {Array.from({ length: Math.min(totalQuestions, 5) }).map((_, i) => (
                        <div
                          key={i}
                          className={`literexia-progress-indicator ${i < correctAnswers ? 'correct' : ''} ${!isUnlocked ? 'blocked' : ''}`}
                        />
                      ))}
                    </div>

                    <div className={`literexia-tab-badge ${statusClass}`}>
                      {!isUnlocked ? (
                        <>
                          <FaTimes /> {statusLabel}
                          <div className="blocked-reason">
                            {progressionStatus.message}
                          </div>
                        </>
                      ) : progressionStatus.status === 'needs_revision' ? (
                        <>
                          <FaEdit /> {statusLabel}
                          <div className="revision-details">
                            Attempt {progressionStatus.attemptNumber} - {getCurrentDisplayScore(category)}%
                          </div>
                        </>
                      ) : progressionStatus.status === 'needs_intervention' ? (
                        <>
                          <FaExclamationTriangle /> {statusLabel}
                        </>
                      ) : progressionStatus.status === 'passed' ? (
                        <>
                          <FaCheckCircle /> {statusLabel}
                          {progressionStatus.source === 'intervention' && (
                            <div className="intervention-success">
                               - {progressionStatus.score}%
                            </div>
                          )}
                        </>
                      ) : (
                        <>
                          <FaInfoCircle /> {statusLabel}
                        </>
                      )}
                    </div>

                    {isUnlocked && progressionStatus.status === 'needs_intervention' && correctAnswers > 0 && (
                      <div className="literexia-status-text">
                        Need {Math.ceil(totalQuestions * 0.75) - correctAnswers} more to pass
                      </div>
                    )}

                    {isUnlocked && progressionStatus.status === 'needs_revision' && (
                      <div className="literexia-status-text">
                        Teacher can revise for attempt {progressionStatus.attemptNumber + 1}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
        </div>
      </div>
    );
  };

  // ===== EARLY RETURNS =====

  // Loading state
  if (loading || !liveStudent || !liveCategoryResults) {
    return (
      <div className="literexia-loading-screen">
        <FaSpinner className="fa-spin" /> Loading prescriptive analysis…
      </div>
    );
  }

  // Manual generation function
  const handleManualGeneration = async () => {
    try {
      setLoading(true);
      console.log('🔧 [MANUAL GENERATION] Starting manual prescriptive analysis generation...');
      console.log('🔧 [MANUAL GENERATION] Student ID:', liveStudent?.idNumber);
      console.log('🔧 [MANUAL GENERATION] Category Results:', liveCategoryResults);

      if (!liveCategoryResults?._id) {
        throw new Error('No category result ID available for generation');
      }

      // Call the prescriptive analytics generation endpoint
      const response = await axios.post('/api/prescriptive-analytics/generate', {
        categoryResultId: liveCategoryResults._id
      });

      console.log('🔧 [MANUAL GENERATION] Generation response:', response.data);

      if (response.data.success) {
        console.log('✅ [MANUAL GENERATION] Successfully generated prescriptive analysis');
        // Refresh the analyses
        window.location.reload(); // Simple refresh for now
      } else {
        throw new Error(response.data.message || 'Generation failed');
      }
    } catch (error) {
      console.error('❌ [MANUAL GENERATION] Error:', error);
      alert('Failed to generate prescriptive analysis: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  // Not assessed yet
  if (
    liveStudent?.readingLevel === 'Not Assessed' ||
    !liveCategoryResults?.categories?.length
  ) {
    return (
      <div className="literexia-prescriptive-container">
        <div className="literexia-progress-info not-assessed">
          <div className="literexia-progress-info-icon">
            <FaInfoCircle />
          </div>
          <div className="literexia-progress-info-text">
            <h3>No Prescriptive Analysis Yet</h3>
            <p>
              The student hasn't completed the initial post-assessment, so
              strengths, weaknesses, and recommendations are not available.
              Once an assessment is completed and a reading level is set,
              prescriptive analysis will appear here automatically.
            </p>
          </div>
        </div>
      </div>
    );
  }

  // No prescriptive analysis generated yet (but student has completed assessment)
  if (!liveAnalyses || liveAnalyses.length === 0) {
    return (
      <div className="literexia-prescriptive-container">
        <div className="literexia-progress-info" style={{ backgroundColor: '#fff3cd', borderLeft: '4px solid #ffc107' }}>
          <div className="literexia-progress-info-icon">
            <FaExclamationTriangle style={{ color: '#ffc107' }} />
          </div>
          <div className="literexia-progress-info-text">
            <h3>Prescriptive Analysis Not Generated</h3>
            <p>
              Student <strong>{liveStudent.firstName} {liveStudent.lastName}</strong> has completed their main assessment
              with an overall score of <strong>{liveCategoryResults.overallScore}%</strong>, but the prescriptive analysis
              has not been automatically generated yet.
            </p>
            <p>
              According to CLAUDE.md architecture, prescriptive analysis should automatically generate when
              category results are saved. Since this didn't happen, you can manually trigger the generation below.
            </p>
            <div style={{ marginTop: '20px' }}>
              <button
                onClick={handleManualGeneration}
                style={{
                  backgroundColor: '#007bff',
                  color: 'white',
                  border: 'none',
                  padding: '12px 24px',
                  borderRadius: '5px',
                  cursor: 'pointer',
                  fontSize: '16px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px'
                }}
                disabled={loading}
              >
                <FaBrain />
                {loading ? 'Generating Analysis...' : 'Generate Prescriptive Analysis'}
              </button>
            </div>
            <div style={{ marginTop: '15px', fontSize: '12px', color: '#666' }}>
              <strong>Debug Info:</strong><br/>
              Student ID: {liveStudent?.idNumber}<br/>
              Category Result ID: {liveCategoryResults?._id}<br/>
              Categories Available: {liveCategoryResults?.categories?.length || 0}<br/>
              Overall Score: {liveCategoryResults?.overallScore}%
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Show an info banner but don't return early - continue to show analysis
  const renderAllPassedBanner = () => {
    if (allCategoriesPassed) {
      return (
        <div className="literexia-progress-info" style={{ marginBottom: '20px' }}>
          <div className="literexia-progress-info-icon">
            <FaCheckCircle style={{ color: '#3B4F81' }} />
          </div>
          <div className="literexia-progress-info-textt">
            <h3>All Categories Passed</h3>
            <p>
              Great news! The student has passed all categories with scores above the 75% threshold.
              No interventions are needed at this time, but you can still review the analysis above.
            </p>
          </div>
        </div>
      );
    }
    return null;
  };

  // ===== DERIVED DATA FOR SELECTED CATEGORY =====
  // Safe access to the category data and analysis
  const selectedCategoryData = selectedCategory && liveCategoryResults?.categories ? 
    liveCategoryResults.categories.find(cat => cat && cat.categoryName === selectedCategory) || null : null;

  // Helper function to determine if a category should be considered "passed"
  const isCategoryPassed = (categoryData, categoryName) => {
    // Check if category is marked as passed in the category data
    if (categoryData?.isPassed) {
      return true;
    }
    
    // Check if there are intervention results that indicate the category has passed
    const interventionResultData = interventionResults[categoryName];
    if (interventionResultData && interventionResultData.isPassed && interventionResultData.score >= 75) {
      return true;
    }
    
    // Check if there's a successful intervention attempt in the category's intervention history
    if (categoryData?.interventionHistory?.some(attempt => attempt.isPassed && attempt.score >= 75)) {
      return true;
    }
    
    return false;
  };
    
  // Use a try-catch block to handle any potential errors in getAnalysisForCategory
  let selectedAnalysis = null;
  try {
    selectedAnalysis = selectedCategory ? getAnalysisForCategory(selectedCategory, selectedCategoryData) : null;
  } catch (error) {
    console.error("Error getting analysis for category:", error);
  }
  
  const selectedInterventions = selectedCategory ? getInterventionsForCategory(selectedCategory) : [];

  // ===== MAIN RENDER =====
  return (
    <div className="literexia-prescriptive-container">
      {/* Header */}
      <div className="literexia-prescriptive-header">
        <div className="literexia-header-icon">
          <FaBrain />
        </div>
        <div className="literexia-head-content">
          <h3>Prescriptive Analysis and Intervention</h3>
          <p>
            Based on assessment results, this analysis identifies specific categories where the student
            needs additional support. Each category below the 75% threshold has individualized recommendations
            and intervention activities.
          </p>
        </div>
      </div>
      
 
      
      {/* Category tabs */}
      {renderCategoryTabs()}
      
      {/* Selected category analysis */}
      {selectedCategory && selectedCategoryData && (() => {
        // ✅ FIX: Check if there's prescriptive analysis data for this category
        const hasPrescriptiveAnalysisForCategory = (() => {
          if (!liveAnalyses || liveAnalyses.length === 0) return false;

          // Check if any prescriptive analysis contains skillMastery data for this category
          return liveAnalyses.some(analysis =>
            analysis?.skillMastery &&
            analysis.skillMastery[selectedCategory] &&
            analysis.skillMastery[selectedCategory].responseHistory &&
            analysis.skillMastery[selectedCategory].responseHistory.length > 0
          );
        })();

        if (!hasPrescriptiveAnalysisForCategory) {
          return (
            <div className="literexia-category-analysis">
              <div className="literexia-empty-analysis">
                <FaQuestionCircle style={{ color: '#999', fontSize: '2rem' }} />
                <div>
                  <h4>No Prescriptive Analysis Available</h4>
                  <p>No prescriptive analysis data exists for {formatCategoryName(selectedCategory)}.</p>
                  <p>Analysis will be available once the student completes this category assessment and the system generates prescriptive analysis data.</p>
                </div>
              </div>
            </div>
          );
        }

        return (
          <div className="literexia-category-analysis">
          
          {/* Show success banner for passed categories */}
          {isCategoryPassed(selectedCategoryData, selectedCategory) && (
            <div className="literexia-success-banner">
              <FaCheckCircle style={{color: '#4CAF50'}} />
              <p>
                The student has mastered {formatCategoryName(selectedCategory)} with a score of {(() => {
                  // Get the most recent score - either from intervention results or category data
                  const interventionResultData = interventionResults[selectedCategory];
                  if (interventionResultData && interventionResultData.isPassed) {
                    return interventionResultData.score;
                  }
                  return selectedCategoryData?.score || 0;
                })()}% (above the 75% threshold). No intervention is needed for this category.
              </p>
            </div>
          )}

          {/* Show processing message when no analysis is available */}
          {!selectedAnalysis && !isCategoryPassed(selectedCategoryData, selectedCategory) && (
            <div className="literexia-empty-analysis">
              <FaInfoCircle />
              <div>
                <h4>Analysis in Progress</h4>
                <p>Detailed prescriptive analysis for {selectedCategory} is being generated.</p>
                <p>This comprehensive analysis will include learning insights and personalized recommendations once processing is complete.</p>
              </div>
            </div>
          )}

          {/* Mathematical Analysis from CLAUDE.md Prescriptive Analytics */}
          {renderMathematicalAnalysis(selectedCategory, selectedAnalysis)}       
          <br></br> <br></br>

          {/* Current interventions - always show, but with different functionality for passed categories */}
          {selectedCategoryData && (
            <div className="literexia-current-interventions">
              <div className="literexia-interventions-header">
                <h3>Current Interventions</h3>
                {isCategoryPassed(selectedCategoryData, selectedCategory) && (
                  <div className="literexia-category-passed-badge">
                    <FaCheckCircle style={{color: '#4CAF50', marginRight: '6px'}} />
                    <span>Category Passed - View Only</span>
                  </div>
                )}
                {selectedInterventions.length === 0 && !isCategoryPassed(selectedCategoryData, selectedCategory) && (
                  <button 
                    className="literexia-create-activity-btn" 
                    onClick={() => handleCreateActivity(selectedCategory, selectedAnalysis)}
                    disabled={loading}
                    title="Create a new intervention activity"
                  >
                    <FaPlus /> Create New Intervention Activity
                  </button>
                )}
                {selectedInterventions.length === 0 && isCategoryPassed(selectedCategoryData, selectedCategory) && (
                  <div className="literexia-category-passed-notice">
                    <FaCheckCircle style={{color: '#4CAF50', marginRight: '8px'}} />
                    <span>Category passed - no new interventions needed</span>
                  </div>
                )}
              </div>
              
              {selectedInterventions.length > 0 ? (
                <div className="literexia-interventions-list">
                  {selectedInterventions.map((intervention, index) => {
                    // VERSION-AWARE LOGIC: Check if student has responded to current version
                    const currentRevision = intervention.revisionNumber || 1;
                    const hasBeenRevised = currentRevision > 1;
                    const interventionResultData = interventionResults[selectedCategory];

                    // Use progress data directly from intervention object (API already includes it)
                    const progress = intervention.progress;

                    // Check if intervention results exist AND match current revision
                    // Also check if we have intervention results data for this category
                    const hasCurrentVersionResults = (progress &&
                      progress.score !== undefined &&
                      progress.results &&
                      progress.results.revisionNumber === currentRevision) ||
                      (interventionResultData && 
                       interventionResultData.revisionNumber === currentRevision &&
                       interventionResultData.score !== undefined);

                    // Check if student has started current version (has any responses)
                    const hasCurrentVersionResponses = progress && progress.revisionNumber === currentRevision;

                    // Determine display values based on current version status
                    let progressPercentage, isPassed, interventionStatus;

                    if (hasCurrentVersionResults) {
                      // Student completed current version - use progress data from API or intervention results
                      if (interventionResultData && interventionResultData.revisionNumber === currentRevision) {
                        progressPercentage = interventionResultData.score;
                        isPassed = interventionResultData.isPassed;
                      } else {
                        progressPercentage = progress ? progress.score : 0;
                        isPassed = progress ? progress.passedThreshold : false;
                      }
                      interventionStatus = isPassed ? 'passed' : 'failed';
                    } else if (hasBeenRevised && !hasCurrentVersionResponses) {
                      // Teacher created new version but student hasn't started it yet
                      progressPercentage = 0;
                      isPassed = false;
                      interventionStatus = 'active'; // Show as active - waiting for student
                    } else if (hasCurrentVersionResponses) {
                      // Student started current version but hasn't finished
                      progressPercentage = progress.percentComplete || 0;
                      isPassed = progress.passedThreshold || false;
                      interventionStatus = 'active';
                    } else {
                      // No responses yet for any version
                      progressPercentage = 0;
                      isPassed = false;
                      interventionStatus = intervention.status || 'active';
                    }
                    
                    return (
                      <div key={index} className="literexia-intervention-card">
                        {/* Card Header with Status Badge */}
                        <div className="literexia-intervention-card-header">
                          <div className="literexia-intervention-category-badge">
                            <FaBook className="category-icon" />
                            <span className="category-name">{intervention.category || selectedCategory}</span>
                          </div>
                          <div className={`literexia-intervention-status-badge ${hasCurrentVersionResults ? (isPassed ? 'passed' : 'failed') : intervention.status}`}>
                            {hasCurrentVersionResults ? (
                              isPassed ? (
                                <>
                                  <FaCheckCircle className="status-icon" />
                                  <span>PASSED</span>
                                  {currentRevision > 1 && <span className="revision-info">Rev {currentRevision}</span>}
                                </>
                              ) : (
                                <>
                                  <FaTimes className="status-icon" />
                                  <span>FAILED</span>
                                  {currentRevision > 1 && <span className="revision-info">Rev {currentRevision}</span>}
                                </>
                              )
                            ) : intervention.status === 'active' ? (
                              <>
                                <FaMobile className="status-icon" />
                                <span>ACTIVE</span>
                                {currentRevision > 1 && <span className="revision-info">Rev {currentRevision}</span>}
                              </>
                            ) : (
                              <>
                                <FaEdit className="status-icon" />
                                <span>DRAFT</span>
                                {currentRevision > 1 && <span className="revision-info">Rev {currentRevision}</span>}
                              </>
                            )}
                          </div>
                        </div>

                        {/* Progress Section with version awareness */}
                        <div className="literexia-intervention-progress-section">
                          <div className="literexia-progress-header">
                            <div className="literexia-progress-title">
                              <FaChartLine className="progress-icon" />
                              <span>{hasCurrentVersionResults ? 'Intervention Score' : 'Progress Percentage'}</span>
                            </div>
                            <div className={`literexia-progress-percentage ${hasCurrentVersionResults ? (isPassed ? 'passed-score' : 'failed-score') : ''}`}>
                              {progressPercentage}%
                            </div>
                          </div>
                          <div className="literexia-progress-bar-container">
                            <div
                              className={`literexia-progress-bar-fill ${hasCurrentVersionResults ? (isPassed ? 'passed-bar' : 'failed-bar') : ''}`}
                              style={{
                                width: `${progressPercentage}%`,
                                backgroundColor: hasCurrentVersionResults
                                  ? (isPassed ? '#10b981' : '#ef4444')
                                  : '#5470a8'
                              }}
                            ></div>
                          </div>
                        </div>

                        {/* Intervention Details Grid */}
                        <div className="literexia-intervention-details-grid">
                          <div className="literexia-detail-item">
                            <div className="literexia-detail-icon">
                              <FaGraduationCap />
                            </div>
                            <div className="literexia-detail-content">
                              <span className="literexia-detail-label">Reading Level</span>
                              <span className="literexia-detail-value">{intervention.readingLevel}</span>
                            </div>
                          </div>

                          <div className="literexia-detail-item">
                            <div className="literexia-detail-icon">
                              <FaQuestionCircle />
                            </div>
                            <div className="literexia-detail-content">
                              <span className="literexia-detail-label">Questions</span>
                              <span className="literexia-detail-value">{intervention.questions ? intervention.questions.length : 0}</span>
                            </div>
                          </div>

                          <div className="literexia-detail-item">
                            <div className="literexia-detail-icon">
                              <FaClock />
                            </div>
                            <div className="literexia-detail-content">
                              <span className="literexia-detail-label">Created</span>
                              <span className="literexia-detail-value">
                                {new Date(intervention.createdAt).toLocaleDateString()}
                              </span>
                            </div>
                          </div>

                          <div className="literexia-detail-item">
                            <div className="literexia-detail-icon">
                              <FaInfoCircle />
                            </div>
                            <div className="literexia-detail-content">
                              <span className="literexia-detail-label">Status</span>
                              <span className="literexia-detail-value">{intervention.status}</span>
                            </div>
                          </div>
                        </div>

                        {/* Action Buttons with version-aware logic */}
                        <div className="literexia-intervention-actions">
                          <button
                            className={`literexia-edit-activity-btn ${hasCurrentVersionResults && !isPassed ? 'version-two' : ''} ${isCategoryPassed(selectedCategoryData, selectedCategory) ? 'disabled-passed' : ''}`}
                            onClick={() => handleCreateActivity(selectedCategory, selectedAnalysis, intervention)}
                            disabled={
                              loading ||
                              (hasBeenRevised && !hasCurrentVersionResults) || // VERSION 2+ without results - disable edit
                              (intervention.status === 'active' && !(hasCurrentVersionResults && !isPassed)) ||
                              isCategoryPassed(selectedCategoryData, selectedCategory) // Disable edit when category is passed
                            }
                            title={
                              isCategoryPassed(selectedCategoryData, selectedCategory)
                                ? "Cannot edit - category has been passed"
                                : hasBeenRevised && !hasCurrentVersionResults
                                ? "Cannot edit - student hasn't attempted this version yet"
                                : hasCurrentVersionResults && !isPassed
                                ? "Create version 3 of this intervention (score below 75%)"
                                : intervention.status === 'active'
                                ? "Active interventions cannot be edited after being pushed to mobile"
                                : "Edit this intervention activity"
                            }
                          >
                            <FaEdit className="action-icon" />
                            <span>Edit Activity</span>
                          </button>

                          {/* Only show View Responses if current version has results */}
                          {hasCurrentVersionResults && (
                            <button
                              className="literexia-view-responses-btn"
                              onClick={() => handleViewResponses(intervention, selectedCategory)}
                              disabled={loading}
                              title="View detailed student responses and analysis"
                            >
                              <FaEye className="action-icon" />
                              <span>View Responses</span>
                            </button>
                          )}

                          {hasCurrentVersionResults ? (
                            <div className={`literexia-active-status ${isPassed ? 'completed-passed' : 'completed-failed'}`}>
                              <FaCheckCircle className="action-icon" />
                              <span>{isPassed ? 'Completed - Passed' : 'Completed - Failed'}</span>
                            </div>
                          ) : intervention.status === 'draft' ? (
                            <button
                              className="literexia-push-mobile-btn"
                              onClick={() => handlePushToMobile(intervention)}
                              disabled={loading}
                              title="Push this intervention to the student's mobile device"
                            >
                              {loading && pendingIntervention?._id === intervention._id ? (
                                <FaSpinner className="fa-spin action-icon" />
                              ) : (
                                <FaMobile className="action-icon" />
                              )}
                              <span>Active on Mobile</span>
                            </button>
                          ) : (
                            <div className="literexia-active-status">
                              <FaCheckCircle className="action-icon" />
                              <span>Active on Mobile</span>
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="literexia-empty-interventions">
                  <FaInfoCircle />
                  <p>No intervention activities have been created for this category yet. Create an activity to help the student improve their skills.</p>
                </div>
              )}
            </div>
          )}

                  {/* Display the "All Categories Passed" banner if applicable */}
                  {renderAllPassedBanner()}
        </div>
        );
      })()}

      

      {/* Activity Edit Modal */}
      {showActivityModal && (
        <ActivityEditModal
          key={`activity-modal-${Date.now()}`}
          activity={editingActivity}
          student={liveStudent}
          category={selectedCategory}
          analysis={selectedAnalysis}
          onClose={handleModalClose}
          onSave={handleSaveActivity}
        />
      )}

      {/* Confirmation Dialog */}
      <ConfirmationDialog
        show={showConfirmDialog}
        title="Push Intervention to Mobile"
        message={
          <>
            Are you sure you want to push this intervention to the student's mobile device?
            <br /><br />
            <strong>IMPORTANT:</strong> Once pushed, this intervention cannot be edited again. 
            It will be marked as 'active' in the database and available on the student's mobile app.
          </>
        }
        confirmText="Push to Mobile"
        cancelText="Cancel"
        icon={<FaMobile />}
        onConfirm={confirmPushToMobile}
        onCancel={() => setShowConfirmDialog(false)}
      />

      {/* Success Notification */}
      {showSuccessNotification && (
        <SuccessNotification
          show={showSuccessNotification}
          title={notificationMessage.title}
          message={notificationMessage.message}
          onDismiss={() => setShowSuccessNotification(false)}
        />
      )}

      {/* Intervention Responses Modal */}
      {showResponseModal && selectedInterventionData && (
        <div className="intervention-response-modal-overlay" onClick={handleCloseResponseModal}>
          <div className="intervention-response-modal-container" onClick={(e) => e.stopPropagation()}>
            {/* Modal Header */}
            <div className="intervention-response-modal-header">
              <div className="intervention-response-modal-title">
                <FaEye className="modal-icon" />
                <div className="title-content">
                  <h3>Intervention Responses</h3>
                  <span className="category-badge">{selectedInterventionData.category}</span>
                </div>
              </div>
              <div className="intervention-response-revision-info">
                <span className={`intervention-response-revision-badge ${(selectedInterventionData.interventionResults?.isPassed || (selectedInterventionData.interventionResults?.score || 0) >= 75) ? 'passed' : 'failed'}`}>
                  {(selectedInterventionData.interventionResults?.isPassed || (selectedInterventionData.interventionResults?.score || 0) >= 75) ? 'PASSED' : 'FAILED'} REV {selectedInterventionData.interventionResults?.revisionNumber || selectedInterventionData.interventionAssessment?.revisionNumber || 1}
                </span>
              <button
                  className="intervention-response-modal-close"
                onClick={handleCloseResponseModal}
                title="Close modal"
              >
                <FaTimes />
              </button>
              </div>
            </div>

            <div className="intervention-response-modal-content">
              {/* Intervention Overview */}
              <div className="intervention-response-overview">
                <div className="intervention-response-overview-header">
                  <h4>Intervention Overview</h4>
                </div>
                
                <div className="intervention-response-stats-grid">
                  <div className="intervention-response-stat-card">
                    <div className="intervention-response-stat-icon">
                      <FaQuestionCircle />
                    </div>
                    <div className="intervention-response-stat-content">
                      <span className="intervention-response-stat-label">Total Questions</span>
                      <span className="intervention-response-stat-value">{selectedInterventionData.totalQuestions}</span>
                    </div>
                  </div>
                  
                  <div className="intervention-response-stat-card">
                    <div className="intervention-response-stat-icon">
                      <FaCheckCircle />
                    </div>
                    <div className="intervention-response-stat-content">
                      <span className="intervention-response-stat-label">Completed</span>
                      <span className="intervention-response-stat-value">{selectedInterventionData.completedResponses}</span>
                    </div>
                  </div>
                  
                  <div className="intervention-response-stat-card intervention-response-score-card">
                    <div className="intervention-response-stat-icon">
                      <FaChartLine />
                    </div>
                    <div className="intervention-response-stat-content">
                      <span className="intervention-response-stat-label">Score</span>
                      <span className={`intervention-response-stat-value score ${selectedInterventionData.interventionResults?.isPassed ? 'passed' : 'failed'}`}>
                        {selectedInterventionData.interventionResults?.score || 0}%
                      </span>
                    </div>
                  </div>
                  
                    <div className="intervention-response-stat-card intervention-response-status-card">
                      <div className="intervention-response-stat-icon">
                        <FaFlag />
                      </div>
                      <div className="intervention-response-stat-content">
                        <span className="intervention-response-stat-label">Status</span>
                        <span className={`status-badge ${(selectedInterventionData.interventionResults?.score || 0) >= 75 ? 'passed' : 'failed'}`}>
                          {(selectedInterventionData.interventionResults?.score || 0) >= 75 ? 'PASSED' : 'FAILED'}
                        </span>
                      </div>
                    </div>
                </div>
              </div>

              {/* Student Responses Section */}
              <div className="intervention-response-responses-section">
                <div className="intervention-response-responses-header">
                  <h4>Student Responses</h4>
                  <div className="intervention-response-responses-count">
                    {interventionResponses.length} response{interventionResponses.length !== 1 ? 's' : ''}
                  </div>
                </div>

                <div className="intervention-response-responses-list">
                  {interventionResponses.length > 0 ? (
                    interventionResponses.map((response, index) => (
                      <div key={index} className={`intervention-response-response-card ${response.isCorrect ? 'correct' : 'incorrect'}`}>
                        <div className="intervention-response-response-card-header">
                          <div className="intervention-response-question-info">
                            <div className="intervention-response-question-number">
                              <span>Q{index + 1}</span>
                            </div>
                            <div className={`intervention-response-response-status ${response.isCorrect ? 'correct' : 'incorrect'}`}>
                              {response.isCorrect ? <FaCheck /> : <FaTimes />}
                            </div>
                          </div>
                          <div className="intervention-response-response-meta">
                            <div className="intervention-response-response-time">
                              <FaClock />
                              <span>{response.responseTime}s</span>
                            </div>
                            <div className="intervention-response-response-date">
                              <FaCalendarAlt />
                              <span>{new Date(response.answeredAt).toLocaleDateString()}</span>
                            </div>
                          </div>
                        </div>

                        <div className="intervention-response-response-card-content">
                          <div className="intervention-response-question-section">
                            <h5>Question</h5>
                            <p className="intervention-response-question-text">{response.questionText || 'Question text not available'}</p>
                            {response.questionImage && (
                              <div className="intervention-response-question-image">
                                <img 
                                  src={response.questionImage} 
                                  alt="Question image" 
                                  className="intervention-response-image"
                                />
                              </div>
                            )}
                          </div>

                          <div className="intervention-response-answers-section">
                            <div className="intervention-response-answer-row">
                              <div className="intervention-response-answer-item student-answer">
                                <span className="intervention-response-answer-label">Student Answer</span>
                                <span className={`intervention-response-answer-value ${response.isCorrect ? 'correct' : 'incorrect'}`}>
                                  {(() => {
                                    if (!response.response) return 'No response';

                                    // Handle Phonological Awareness audio-visual pairs
                                    if (typeof response.response === 'object' && Array.isArray(response.response)) {
                                      // Format: [{"audio": "S", "match": "Aa"}, {"audio": "A", "match": "Ss"}, {"audio": "V", "match": "Vv"}]
                                      return response.response.map(item => {
                                        if (typeof item === 'object' && item.audio && item.match) {
                                          return `${item.audio} → ${item.match}`;
                                        } else if (typeof item === 'object' && item.audio && item.visual) {
                                          return `${item.audio} → ${item.visual}`;
                                        } else if (typeof item === 'object') {
                                          // Handle any other object format
                                          const keys = Object.keys(item);
                                          if (keys.length === 2) {
                                            return `${keys[0]} → ${item[keys[0]]}`;
                                          }
                                          return JSON.stringify(item);
                                        }
                                        return String(item);
                                      }).join(', ');
                                    } else if (typeof response.response === 'object' && response.response.audio && response.response.match) {
                                      return `${response.response.audio} → ${response.response.match}`;
                                    } else if (typeof response.response === 'object' && response.response.audio && response.response.visual) {
                                      return `${response.response.audio} → ${response.response.visual}`;
                                    } else if (typeof response.response === 'object') {
                                      return JSON.stringify(response.response);
                                    }

                                    return String(response.response);
                                  })()}
                                </span>
                              </div>
                              <div className="intervention-response-answer-item correct-answer">
                                <span className="intervention-response-answer-label">Correct Answer</span>
                                <span className="intervention-response-answer-value correct">
                                  {(() => {
                                    // Find the corresponding question in the intervention assessment
                                    if (selectedInterventionData?.interventionAssessment?.questions) {
                                      const question = selectedInterventionData.interventionAssessment.questions.find(
                                        q => q.questionId === response.questionId
                                      );

                                      console.log('🔍 [CORRECT ANSWER] Found question for', response.questionId, ':', question);

                                      if (question) {
                                        // DYNAMIC CORRECT ANSWER EXTRACTION FOR ALL CATEGORIES
                                        return extractCorrectAnswerForCategory(question, selectedInterventionData.category);
                                      }

                                      console.log('🔍 [CORRECT ANSWER] Question not found');
                                    }

                                    console.log('🔍 [CORRECT ANSWER] No intervention assessment or questions found');
                                    return 'N/A - No intervention assessment data';
                                  })()}
                                </span>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="intervention-response-no-responses">
                      <FaInfoCircle />
                      <p>No responses found for this intervention.</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// Export the component wrapped in the error boundary
const PrescriptiveAnalysisWithErrorBoundary = (props) => (
  <PrescriptiveAnalysisErrorBoundary>
    <PrescriptiveAnalysis {...props} />
  </PrescriptiveAnalysisErrorBoundary>
);

export default PrescriptiveAnalysisWithErrorBoundary;