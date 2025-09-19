// src/components/TeacherPage/ManageProgress/PrescriptiveAnalysis.jsx
import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import api from '../../../services/Teachers/api';
import {
  FaInfoCircle,
  FaExclamationTriangle,
  FaExclamationCircle,
  FaChartLine,
  FaBook,
  FaEdit,
  FaCheckCircle,
  FaBrain,
  FaRuler,
  FaUserMd,
  FaChartBar,
  FaBug,
  FaArrowUp,
  FaRoute,
  FaArrowRight,
  FaPlus,
  FaMobile,
  FaHandsHelping,
  FaSpinner,
  FaTimes,
  FaGraduationCap,
  FaQuestionCircle,
  FaClock,
  FaCheck
} from 'react-icons/fa';
import ActivityEditModal from './ActivityEditModal';
import ConfirmationDialog from './ConfirmationDialog';
import SuccessNotification from './SuccessNotification';
import './css/PrescriptiveAnalysis.css';
import './css/ErrorPatternAnalysis.css';
import './css/BKTTimelineCompact.css';

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

  // Helper function to get intervention status for a category
  const getInterventionStatus = (categoryName) => {
    const results = interventionResults[categoryName];
    if (!results) return 'initial';

    if (results.passed && results.score >= 75) {
      return 'success';
    } else if (results.passed === false && results.score < 75) {
      return 'revision_needed';
    }
    return 'initial';
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

  // Function to fetch intervention results from the backend
  const fetchInterventionResults = async (studentId, categoryName) => {
    try {
      console.log(`[INTERVENTION RESULTS] Fetching intervention results for student ${studentId}, category ${categoryName}`);

      // Try to fetch intervention results for this specific category
      const response = await api.get(`/api/intervention-monitoring/debug-data`);

      if (response.data && response.data.success && response.data.data.interventionResults) {
        const allResults = response.data.data.interventionResults;

        // Filter results for this specific student and category
        const categoryResult = allResults.find(result =>
          result.studentId === parseInt(studentId) &&
          result.category === categoryName
        );

        if (categoryResult) {
          console.log(`[INTERVENTION RESULTS] Found intervention results for ${categoryName}:`, categoryResult);

          // Transform the data to match expected format
          return {
            category: categoryResult.category,
            score: categoryResult.score,
            passed: categoryResult.isPassed,
            previousScore: categoryResult.previousScore,
            improvement: categoryResult.improvement,
            skillMastery: categoryResult.skillMastery,
            errorPatterns: categoryResult.errorPatterns,
            interventionEffectiveness: categoryResult.interventionEffectiveness,
            researchBasedPrescriptions: categoryResult.researchBasedPrescriptions,
            progressComparison: categoryResult.progressComparison,
            insights: categoryResult.insights,
            completedAt: categoryResult.completedAt,
            interventionId: categoryResult.interventionAssessmentId
          };
        } else {
          console.log(`[INTERVENTION RESULTS] No intervention results found for student ${studentId}, category ${categoryName}`);
          return null;
        }
      }

      return null;
    } catch (error) {
      console.error('Error fetching intervention results:', error);
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
          console.log('🔍 [CATEGORY RESULTS DEBUG] Raw API response:', cat);
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
          console.log('🔍 [PRESCRIPTIVE ANALYSIS DEBUG] Fetching analysis for student:', sid);
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
      if (categoriesNeedingIntervention?.length > 0) {
        // If there are categories needing intervention, select the first one
        setSelectedCategory(categoriesNeedingIntervention[0].categoryName);
      } else if (liveCategoryResults?.categories?.length > 0) {
        // If all categories are passed, just select the first category
        setSelectedCategory(liveCategoryResults.categories[0].categoryName);
      }
    }
  }, [categoriesNeedingIntervention, selectedCategory, liveCategoryResults]);

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
   * @return {Object|null} Analysis object with BKT, IRT, and error patterns from real data
   */
  const getAnalysisForCategory = (categoryName) => {
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

    // Extract complete BKT data with response history
    const skillMasteryData = studentAnalysis.skillMastery?.[categoryName] || studentAnalysis.skillMastery?.[normalizedCategory];
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
      lastUpdated: skillMasteryData.lastUpdated
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
    const detailedErrorAnalysis = categoryErrorPatterns?.detailedErrorAnalysis || [];

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

  // Helper function to get ability level classification
  const getAbilityLevel = (estimate) => {
    if (estimate >= 2.0) return 'Very High';
    if (estimate >= 1.0) return 'Above Average';
    if (estimate >= -1.0) return 'Average';
    if (estimate >= -2.0) return 'Below Average';
    return 'Very Low';
  };

  // Helper function to get IRT explanation
  const getIRTExplanation = (estimate) => {
    if (estimate >= 2.0) return 'Student demonstrates exceptional ability in this reading skill area.';
    if (estimate >= 1.0) return 'Student shows above-average ability and typically succeeds on most tasks.';
    if (estimate >= -1.0) return 'Student has average ability and succeeds on appropriately leveled tasks.';
    if (estimate >= -2.0) return 'Student has below-average ability and needs additional support to succeed.';
    return 'Student has significant difficulty and requires intensive intervention support.';
  };

  // Helper function to get mastery level classification
  const getMasteryLevel = (probability) => {
    if (probability >= 0.9) return 'Very High Mastery';
    if (probability >= 0.75) return 'High Mastery';
    if (probability >= 0.5) return 'Moderate Mastery';
    if (probability >= 0.25) return 'Low Mastery';
    return 'Very Low Mastery';
  };

  // Helper function to get mastery progression class
  const getMasteryProgressionClass = (probability) => {
    if (probability >= 0.75) return 'high-mastery';
    if (probability >= 0.5) return 'moderate-mastery';
    if (probability >= 0.25) return 'low-mastery';
    return 'very-low-mastery';
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
    setEditingActivity(existingActivity);
    setSelectedCategory(category);
    setShowActivityModal(true);
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
                            <div className="epa-technique-description">{activity.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}</div>
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
                          <li key={index}>{skill}</li>
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
      // Return a placeholder to show this function is being called
      return (
        <div className="literexia-analysis-card literexia-full-width">
          <div className="literexia-card-content">
            <div className={`epa-container theme-${getUITheme(categoryName)}`}>
              <div className="epa-header">
                <FaExclamationTriangle className="epa-icon" />
                <div>
                  <h4 className="epa-title">Individual Letter Analysis</h4>
                  <p className="epa-subtitle">No detailed letter-level analysis available from database</p>
                </div>
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

      // Determine if it's vowel or consonant based on errorPattern
      const isVowel = error.errorPattern?.toLowerCase().includes('vowel');
      const isConsonant = error.errorPattern?.toLowerCase().includes('consonant');

      return {
        ...error,
        letter: letter,
        letterType: isVowel ? 'vowel' : (isConsonant ? 'consonant' : 'other'),
        specificError: error.errorPattern,
        cognitiveImplication: isVowel ?
          'Visual-auditory vowel processing difficulty' :
          'Consonant-sound correspondence weakness',
        questionId: `Pattern Analysis` // Since we don't have specific questionId in this structure
      };
    });

    console.log('🔍 [RENDER] Transformed errors:', transformedErrors);

    // Group errors by letter type for better organization
    const vowelErrors = transformedErrors.filter(error => error.letterType === 'vowel');
    const consonantErrors = transformedErrors.filter(error => error.letterType === 'consonant');
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
                      <li key={idx}>{activity.replace(/_/g, ' ')}</li>
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
                </div>
              </div>
              <div className="epa-results-score-summary">
                <div className="epa-score-metric">
                  <div className="epa-score-label">BEFORE</div>
                  <div className="epa-score-value before">{interventionData.previousScore || 0}%</div>
                </div>
                <div className="epa-score-arrow">→</div>
                <div className="epa-score-metric">
                  <div className="epa-score-label">AFTER</div>
                  <div className={`epa-score-value after ${interventionData.isPassed ? 'passed' : 'needs-revision'}`}>
                    {interventionData.score}%
                  </div>
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

          {/* Two-Column Layout Based on intervention_results.json structure */}
          <div className="epa-two-column-layout">
            {/* Left Column: Skill Mastery & Analysis */}
            <div className="epa-left-column">
              <div className="epa-column-header">
                <FaChartLine className="epa-icon" />
                <span>Skill Mastery Analysis</span>
              </div>
              <div className="epa-column-content">

                {/* Comprehensive Skill Mastery from intervention_results.json */}
                {interventionData.skillMastery?.[categoryName] && (
                  <div className="epa-skill-mastery-card">
                    <h4 className="epa-subsection-title">
                      <FaBrain className="epa-section-icon" />
                      Bayesian Knowledge Tracing (BKT) Analysis
                    </h4>
                    <div className="epa-bkt-display">
                      <div className="epa-mastery-gauge">
                        <div className="epa-gauge-container">
                          <div className={`epa-mastery-circle ${interventionData.skillMastery[categoryName].masteryProbability >= 0.75 ? 'high' :
                            interventionData.skillMastery[categoryName].masteryProbability >= 0.5 ? 'medium' : 'low'}`}>
                            <span className="epa-mastery-percentage">
                              {(interventionData.skillMastery[categoryName].masteryProbability * 100).toFixed(1)}%
                            </span>
                            <span className="epa-mastery-label">Mastery</span>
                          </div>
                        </div>
                        <div className="epa-mastery-interpretation">
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
                        {interventionData.skillMastery[categoryName].correctMatches !== undefined && (
                          <div className="epa-metric-row">
                            <span className="epa-metric-label">Correct Matches:</span>
                            <span className="epa-metric-value">
                              {interventionData.skillMastery[categoryName].correctMatches}/{interventionData.skillMastery[categoryName].totalPossibleMatches || interventionData.skillMastery[categoryName].totalQuestions * 3}
                            </span>
                          </div>
                        )}
                        <div className="epa-metric-row">
                          <span className="epa-metric-label">Final Score:</span>
                          <span className={`epa-metric-value ${interventionData.skillMastery[categoryName].isPassed ? 'passed' : 'failed'}`}>
                            {interventionData.skillMastery[categoryName].score}%
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Response History Evolution - Real BKT Learning Curve */}
                {interventionData.skillMastery?.[categoryName]?.responseHistory && (
                  <div className="bkt-compact-container">
                    <h4 className="bkt-compact-header">
                      <FaChartLine className="epa-section-icon" />
                      Learning Progression (BKT Evolution)
                    </h4>
                    <div className="bkt-compact-timeline">
                      {interventionData.skillMastery[categoryName].responseHistory.slice(-12).map((response, index) => (
                        <div key={index} className="bkt-compact-item">
                          <div className={`bkt-compact-icon ${response.correct ? 'correct' : 'incorrect'}`}>
                          </div>
                          <div className="bkt-compact-question">
                            {response.questionId}
                          </div>
                          <div className="bkt-compact-score">
                            {(response.masteryAfter * 100).toFixed(0)}%
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* IRT Ability Estimate */}
                {interventionData.abilityEstimates?.[categoryName] !== undefined && (
                  <div className="epa-irt-analysis-card">
                    <h4 className="epa-subsection-title">
                      <FaCalculator className="epa-section-icon" />
                      Item Response Theory (IRT) Analysis
                    </h4>
                    <div className="epa-irt-display">
                      <div className="epa-ability-scale">
                        <div className="epa-scale-line">
                          <span className="epa-scale-label">-3.0</span>
                          <div className="epa-scale-bar">
                            <div
                              className="epa-ability-marker"
                              style={{ left: `${((interventionData.abilityEstimates[categoryName] + 3) / 6) * 100}%` }}
                            >
                              <span className="epa-ability-value">{interventionData.abilityEstimates[categoryName].toFixed(1)}</span>
                            </div>
                          </div>
                          <span className="epa-scale-label">+3.0</span>
                        </div>
                      </div>
                      <div className="epa-irt-interpretation">
                        <strong>Ability Level:</strong> {(() => {
                          const ability = interventionData.abilityEstimates[categoryName];
                          if (ability >= 1.5) return 'Excellent - Well above grade level';
                          if (ability >= 0.5) return 'Above Average - Performing well';
                          if (ability >= -0.5) return 'Average - Meeting expectations';
                          if (ability >= -1.5) return 'Below Average - Needs support';
                          return 'Significant difficulty - Intensive intervention needed';
                        })()}
                      </div>
                    </div>
                  </div>
                )}

                {/* Intervention Effectiveness Analysis - Based on intervention_results data */}
                {interventionData.interventionEffectiveness && (
                  <div className="epa-effectiveness-analysis-card">
                    <h4 className="epa-subsection-title">
                      <FaChartBar className="epa-section-icon" />
                      Intervention Effectiveness Analysis
                    </h4>
                    <div className="epa-effectiveness-display">
                      <div className="epa-effectiveness-metric">
                        <span className="epa-metric-label">Overall Effectiveness:</span>
                        <span className={`epa-metric-value effectiveness-${interventionData.interventionEffectiveness.overallEffectiveness?.toLowerCase()}`}>
                          {interventionData.interventionEffectiveness.overallEffectiveness?.replace(/_/g, ' ')}
                        </span>
                      </div>

                      {interventionData.interventionEffectiveness.skillProgression && (
                        <div className="epa-skill-progression">
                          <div className="epa-progression-item">
                            <span className="epa-progression-label">Mastery Growth:</span>
                            <span className="epa-progression-value">
                              +{(interventionData.interventionEffectiveness.skillProgression.masteryGrowth * 100).toFixed(1)}%
                            </span>
                          </div>
                          {interventionData.interventionEffectiveness.skillProgression.responseTimeImprovement && (
                            <div className="epa-progression-item">
                              <span className="epa-progression-label">Response Time Improvement:</span>
                              <span className="epa-progression-value">
                                +{interventionData.interventionEffectiveness.skillProgression.responseTimeImprovement}%
                              </span>
                            </div>
                          )}
                        </div>
                      )}

                      {interventionData.interventionEffectiveness.errorPatternResolution && (
                        <div className="epa-error-resolution">
                          {interventionData.interventionEffectiveness.errorPatternResolution.improved?.length > 0 && (
                            <div className="epa-resolution-category">
                              <span className="epa-resolution-label">Improved Patterns:</span>
                              <span className="epa-resolution-value improved">
                                {interventionData.interventionEffectiveness.errorPatternResolution.improved.join(', ')}
                              </span>
                            </div>
                          )}
                          {interventionData.interventionEffectiveness.errorPatternResolution.persistent?.length > 0 && (
                            <div className="epa-resolution-category">
                              <span className="epa-resolution-label">Persistent Patterns:</span>
                              <span className="epa-resolution-value persistent">
                                {interventionData.interventionEffectiveness.errorPatternResolution.persistent.join(', ')}
                              </span>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                )}

              </div>
            </div>

            {/* Right Column: Error Patterns & Progress */}
            <div className="epa-right-column">
              <div className="epa-column-header">
                <FaExclamationTriangle className="epa-icon" />
                <span>Error Pattern Analysis</span>
              </div>
              <div className="epa-column-content">

                {/* Dynamic Error Pattern Analysis for All Categories */}
                {interventionData.errorPatterns?.[categoryName] && (
                  <div className="epa-error-patterns-card">
                    <h4 className="epa-subsection-title">
                      <FaBug className="epa-section-icon" />
                      Error Pattern Analysis - {categoryName}
                    </h4>
                    <div className="epa-error-patterns-content">
                      {/* Detailed Error Analysis */}
                      {interventionData.errorPatterns[categoryName].detailedErrorAnalysis?.map((error, index) => (
                        <div key={index} className="epa-error-pattern-item">
                          <div className="epa-error-pattern">
                            <strong>Pattern:</strong> {error.errorPattern}
                          </div>
                          <div className="epa-intervention-focus">
                            <strong>Focus:</strong> {error.interventionFocus}
                          </div>
                          {error.specificPairs?.length > 0 && (
                            <div className="epa-specific-pairs">
                              <strong>Specific Issues:</strong> {error.specificPairs.join(', ')}
                            </div>
                          )}
                        </div>
                      ))}

                      {/* Dynamic Category-Specific Error Patterns */}
                      {Object.entries(interventionData.errorPatterns[categoryName])
                        .filter(([key]) => !['detailedErrorAnalysis', 'currentPatterns', 'errorReductionRate'].includes(key))
                        .map(([errorType, errorData]) => {
                          // Skip if errorData is not an object or is null/undefined
                          if (!errorData || typeof errorData !== 'object' || Array.isArray(errorData)) {
                            return null;
                          }

                          return (
                            <div key={errorType} className="epa-category-error-section">
                              <h5 className="epa-error-type-title">
                                {errorType.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                              </h5>

                              {/* Error Statistics */}
                              {(errorData.count !== undefined || errorData.percentage !== undefined) && (
                                <div className="epa-error-stats">
                                  {errorData.count !== undefined && (
                                    <div className="epa-error-stat">
                                      <span className="epa-stat-label">Error Count:</span>
                                      <span className="epa-stat-value">{errorData.count}{errorData.total ? `/${errorData.total}` : ''}</span>
                                    </div>
                                  )}
                                  {errorData.percentage !== undefined && (
                                    <div className="epa-error-stat">
                                      <span className="epa-stat-label">Error Rate:</span>
                                      <span className={`epa-stat-value rate-${errorData.percentage > 70 ? 'high' : errorData.percentage > 40 ? 'medium' : 'low'}`}>
                                        {errorData.percentage}%
                                      </span>
                                    </div>
                                  )}
                                </div>
                              )}

                              {/* Error Type */}
                              {errorData.error_type && (
                                <div className="epa-error-type">
                                  <span className="epa-type-label">Error Type:</span>
                                  <span className="epa-type-value">{errorData.error_type.replace(/_/g, ' ')}</span>
                                </div>
                              )}

                              {/* Specific Letters (for letter-based categories) */}
                              {errorData.specific_letters?.length > 0 && (
                                <div className="epa-specific-letters">
                                  <span className="epa-letters-label">Problem Letters:</span>
                                  <div className="epa-letters-list">
                                    {errorData.specific_letters.map((letter, idx) => (
                                      <span key={idx} className="epa-letter-tag">{letter}</span>
                                    ))}
                                  </div>
                                </div>
                              )}

                              {/* Confusion Pairs (for phonological awareness) */}
                              {errorData.confusion_pairs?.length > 0 && (
                                <div className="epa-confusion-pairs">
                                  <span className="epa-pairs-label">Confusion Pairs:</span>
                                  <div className="epa-pairs-list">
                                    {errorData.confusion_pairs.map((pair, idx) => (
                                      <div key={idx} className="epa-confusion-pair">
                                        <span className="epa-pair-sounds">{pair.sounds?.join('-') || 'N/A'}</span>
                                        <span className="epa-pair-rate">{pair.confusion_rate || pair.confusionRate || 0}%</span>
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              )}

                              {/* Question IDs */}
                              {errorData.questionIds?.length > 0 && (
                                <div className="epa-failed-questions">
                                  <span className="epa-questions-label">Affected Questions:</span>
                                  <div className="epa-question-list">
                                    {errorData.questionIds.map((questionId, idx) => (
                                      <span key={idx} className="epa-failed-question">{questionId}</span>
                                    ))}
                                  </div>
                                </div>
                              )}

                              {/* Intervention Focus */}
                              {errorData.interventionFocus && (
                                <div className="epa-intervention-focus">
                                  <span className="epa-focus-label">Intervention Focus:</span>
                                  <span className="epa-focus-value">{errorData.interventionFocus}</span>
                                </div>
                              )}

                              {/* Research Classification */}
                              {errorData.researchClassification && (
                                <div className="epa-research-classification">
                                  <span className="epa-classification-label">Research Classification:</span>
                                  <span className="epa-classification-value">{errorData.researchClassification.replace(/_/g, ' ')}</span>
                                </div>
                              )}
                            </div>
                          );
                        })
                        .filter(Boolean) // Remove null entries
                      }

                      {/* Current Patterns Summary */}
                      {interventionData.errorPatterns[categoryName].currentPatterns?.length > 0 && (
                        <div className="epa-current-patterns">
                          <h5 className="epa-patterns-title">Current Error Patterns</h5>
                          <div className="epa-patterns-list">
                            {interventionData.errorPatterns[categoryName].currentPatterns.map((pattern, idx) => (
                              <div key={idx} className="epa-pattern-item">{pattern}</div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                )}

             

                {/* Research-Based Prescriptions for next steps */}
                {interventionData.researchBasedPrescriptions?.[categoryName] && (
                  <div className="epa-next-steps-card">
                    <h4 className="epa-subsection-title">
                      <FaRoute className="epa-section-icon" />
                      Next Steps & Recommendations
                    </h4>
                    <div className="epa-next-steps-content">
                      {interventionData.researchBasedPrescriptions[categoryName].categoryStatus && (
                        <div className="epa-category-status">
                          <span className="epa-status-label">Status:</span>
                          <span className={`epa-status-value status-${interventionData.researchBasedPrescriptions[categoryName].categoryStatus}`}>
                            {interventionData.researchBasedPrescriptions[categoryName].categoryStatus.replace(/_/g, ' ')}
                          </span>
                        </div>
                      )}

                      {interventionData.researchBasedPrescriptions[categoryName].teacherRevisionGuidance?.revisionRecommended && (
                        <div className="epa-revision-guidance">
                          <h5>Teacher Revision Guidance</h5>
                          <div className="epa-revision-priority">
                            Priority: <span className={`priority-${interventionData.researchBasedPrescriptions[categoryName].teacherRevisionGuidance.revisionPriority}`}>
                              {interventionData.researchBasedPrescriptions[categoryName].teacherRevisionGuidance.revisionPriority}
                            </span>
                          </div>
                          {interventionData.researchBasedPrescriptions[categoryName].teacherRevisionGuidance.specificChanges?.map((change, idx) => (
                            <div key={idx} className="epa-revision-change">
                              <div className="epa-change-description">{change.change}</div>
                              <div className="epa-change-rationale">{change.rationale}</div>
                              <div className="epa-change-impact">Expected: {change.expectedImpact}</div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Left Column: Intervention Results & Analysis */}
            <div className="epa-left-column">
              <div className="epa-column-header">
                {interventionData.isPassed ? <FaCheckCircle className="epa-icon" /> : <FaEdit className="epa-icon" />}
                <span>Intervention Performance & Analysis</span>
              </div>
              <div className="epa-column-content">
                {/* Intervention Performance Metrics */}
                {interventionData.progressComparison?.interventionPerformance && (
                  <div className="epa-intervention-performance-card">
                    <div className="epa-performance-header">
                      <span className="epa-performance-label">Intervention Score</span>
                      <span className={`epa-performance-status ${interventionData.isPassed ? 'passed' : 'needs-revision'}`}>
                        {interventionData.isPassed ? 'Passed!' : 'Needs Revision'}
                      </span>
                    </div>
                    <div className="epa-performance-metrics">
                      <div className={`epa-score-value intervention-${interventionData.isPassed ? 'passed' : 'failed'}`}>
                        {interventionData.score}%
                      </div>
                      <div className="epa-threshold-info">Passing threshold: {interventionData.passThreshold || 75}%</div>
                      <div className="epa-mastery-probability">
                        Mastery Probability: {(interventionData.progressComparison.interventionPerformance.masteryProbability * 100).toFixed(1)}%
                      </div>
                      <div className="epa-progress-bar-container">
                        <div className="epa-progress-bar">
                          <div
                            className={`epa-progress-fill epa-progress--${interventionData.isPassed ? 'passed' : 'failed'}`}
                            style={{ width: `${Math.min(100, (interventionData.score / (interventionData.passThreshold || 75)) * 100)}%` }}
                          ></div>
                        </div>
                        <div className="epa-progress-labels">
                          <span>0%</span>
                          <span className="threshold-marker">{interventionData.passThreshold || 75}% (Pass)</span>
                          <span>100%</span>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Progress Indicators from intervention_results.json */}
                {interventionData.progressComparison?.progressIndicators && (
                  <div className="epa-progress-indicators-card">
                    <h4 className="epa-subsection-title">Progress Indicators</h4>
                    <div className="epa-progress-metrics">
                      <div className="epa-metric">
                        <span className="epa-metric-label">Score Improvement:</span>
                        <span className={`epa-metric-value ${interventionData.progressComparison.progressIndicators.scoreImprovement >= 0 ? 'positive' : 'negative'}`}>
                          {interventionData.progressComparison.progressIndicators.scoreImprovement >= 0 ? '+' : ''}{interventionData.progressComparison.progressIndicators.scoreImprovement}%
                        </span>
                      </div>
                      <div className="epa-metric">
                        <span className="epa-metric-label">Mastery Growth:</span>
                        <span className="epa-metric-value positive">
                          +{(interventionData.progressComparison.progressIndicators.masteryGrowth * 100).toFixed(1)}%
                        </span>
                      </div>
                      <div className="epa-metric">
                        <span className="epa-metric-label">Error Reduction:</span>
                        <span className="epa-metric-value positive">
                          {interventionData.progressComparison.progressIndicators.errorReduction * 100}%
                        </span>
                      </div>
                      <div className="epa-metric">
                        <span className="epa-metric-label">Skill Transfer:</span>
                        <span className={`epa-metric-value ${interventionData.progressComparison.progressIndicators.skillTransfer === 'excellent' || interventionData.progressComparison.progressIndicators.skillTransfer === 'good' ? 'positive' : 'moderate'}`}>
                          {interventionData.progressComparison.progressIndicators.skillTransfer}
                        </span>
                      </div>
                    </div>
                  </div>
                )}

                {/* Intervention Effectiveness Analysis */}
                {interventionData.interventionEffectiveness && (
                  <div className="epa-effectiveness-card">
                    <h4 className="epa-subsection-title">Intervention Effectiveness</h4>
                    <div className="epa-effectiveness-content">
                      <div className="epa-effectiveness-item">
                        <strong>Overall Effectiveness:</strong>
                        <span className={`epa-effectiveness-value ${interventionData.interventionEffectiveness.overallEffectiveness === 'HIGHLY_EFFECTIVE' ? 'high' :
                          interventionData.interventionEffectiveness.overallEffectiveness === 'MODERATELY_EFFECTIVE' ? 'moderate' : 'low'}`}>
                          {interventionData.interventionEffectiveness.overallEffectiveness?.replace('_', ' ')}
                        </span>
                      </div>
                      {interventionData.interventionEffectiveness.skillProgression && (
                        <div className="epa-skill-progression">
                          <div className="epa-effectiveness-item">
                            <strong>Mastery Growth:</strong> +{(interventionData.interventionEffectiveness.skillProgression.masteryGrowth * 100).toFixed(1)}%
                          </div>
                          <div className="epa-effectiveness-item">
                            <strong>Response Time Improvement:</strong> +{interventionData.interventionEffectiveness.skillProgression.responseTimeImprovement}%
                          </div>
                          <div className="epa-effectiveness-item">
                            <strong>Consistency Improvement:</strong> +{interventionData.interventionEffectiveness.skillProgression.consistencyImprovement}%
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Error Pattern Resolution */}
                {interventionData.interventionEffectiveness?.errorPatternResolution && (
                  <div className="epa-error-resolution-card">
                    <h4 className="epa-subsection-title">Error Pattern Resolution</h4>
                    <div className="epa-resolution-content">
                      {interventionData.interventionEffectiveness.errorPatternResolution.improved?.length > 0 && (
                        <div className="epa-resolution-item improved">
                          <FaCheckCircle className="epa-resolution-icon" />
                          <div>
                            <strong>Improved Patterns:</strong>
                            <div className="epa-pattern-list">
                              {interventionData.interventionEffectiveness.errorPatternResolution.improved.map((pattern, index) => (
                                <span key={index} className="epa-pattern-tag improved">{pattern}</span>
                              ))}
                            </div>
                          </div>
                        </div>
                      )}
                      {interventionData.interventionEffectiveness.errorPatternResolution.persistent?.length > 0 && (
                        <div className="epa-resolution-item persistent">
                          <FaExclamationTriangle className="epa-resolution-icon" />
                          <div>
                            <strong>Persistent Patterns:</strong>
                            <div className="epa-pattern-list">
                              {interventionData.interventionEffectiveness.errorPatternResolution.persistent.map((pattern, index) => (
                                <span key={index} className="epa-pattern-tag persistent">{pattern}</span>
                              ))}
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Teacher Action Recommendations */}
                {interventionData.insights && (
                  <div className="epa-insights-card">
                    <h4 className="epa-subsection-title">
                      {interventionData.isPassed ? '🎉 Success! Next Steps:' : ' Action Required:'}
                    </h4>
                    <div className="epa-insights-content">
                      <div className="epa-insight-item">
                        <strong>Recommended Action:</strong> {interventionData.insights.recommendedAction?.replace('_', ' ')}
                      </div>
                      <div className="epa-insight-item">
                        <strong>Impact Assessment:</strong> {interventionData.insights.interventionImpact}
                      </div>
                      <div className="epa-insight-item">
                        <strong>Next Steps Rationale:</strong> {interventionData.insights.nextStepsRationale}
                      </div>
                      {interventionData.insights.strengths?.length > 0 && (
                        <div className="epa-insight-item">
                          <strong>Strengths Observed:</strong>
                          <ul className="epa-insight-list">
                            {interventionData.insights.strengths.map((strength, index) => (
                              <li key={index}>{strength}</li>
                            ))}
                          </ul>
                        </div>
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
  };

  // ===== HELPER FUNCTIONS FOR BEFORE/AFTER COMPARISON =====

  /**
   * Renders simplified error patterns for the Before column
   */
  const renderSimplifiedErrorPatterns = (detailedErrorAnalysis, categoryName) => {
    if (!detailedErrorAnalysis || !Array.isArray(detailedErrorAnalysis)) {
      return <div className="epa-no-patterns">No error patterns identified.</div>;
    }

    return (
      <div className="epa-simplified-error-patterns">
        {detailedErrorAnalysis.slice(0, 3).map((error, index) => (
          <div key={index} className="epa-error-pattern-summary">
            <div className="epa-error-pattern-type">
              {error.errorType || error.error_type || 'Pattern Issue'}
            </div>
            <div className="epa-error-pattern-description">
              {error.errorPattern || error.specificPairs?.join(', ') || 'Pattern not specified'}
            </div>
            <div className="epa-error-pattern-focus">
              Focus: {error.interventionFocus || 'Targeted practice needed'}
            </div>
          </div>
        ))}
        {detailedErrorAnalysis.length > 3 && (
          <div className="epa-more-patterns">
            +{detailedErrorAnalysis.length - 3} more patterns identified
          </div>
        )}
      </div>
    );
  };

  /**
   * Renders simplified prescription for the Before column
   */
  const renderSimplifiedPrescription = (researchBasedPrescriptions, categoryName) => {
    if (!researchBasedPrescriptions || !researchBasedPrescriptions[categoryName]) {
      return <div className="epa-no-prescription">Prescription data not available.</div>;
    }

    const prescription = researchBasedPrescriptions[categoryName];

    return (
      <div className="epa-simplified-prescription">
        {prescription.nextInterventionPrescription && (
          <div className="epa-prescription-summary">
            <div className="epa-prescription-approach">
              <strong>Approach:</strong> {prescription.nextInterventionPrescription.primaryApproach || 'Structured intervention'}
            </div>
            <div className="epa-prescription-intensity">
              <strong>Intensity:</strong> {prescription.nextInterventionPrescription.intensityLevel || 'Moderate'}
            </div>
            {prescription.nextInterventionPrescription.specificTechniques && (
              <div className="epa-prescription-techniques">
                <strong>Key Techniques:</strong>
                <ul className="epa-technique-list">
                  {prescription.nextInterventionPrescription.specificTechniques.slice(0, 2).map((technique, index) => (
                    <li key={index}>{technique.technique || technique}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}
        {prescription.deficitAnalysis && prescription.deficitAnalysis.specificDeficits && (
          <div className="epa-deficit-summary">
            <strong>Key Deficits:</strong>
            <ul className="epa-deficit-list">
              {prescription.deficitAnalysis.specificDeficits.slice(0, 2).map((deficit, index) => (
                <li key={index}>{deficit.deficit || deficit}</li>
              ))}
            </ul>
          </div>
        )}
      </div>
    );
  };

  /**
   * Renders error pattern resolution analysis
   */
  const renderErrorPatternResolution = (interventionData, categoryName) => {
    if (!interventionData.errorPatternResolution) {
      return (
        <div className="epa-pattern-resolution-placeholder">
          <div className="epa-resolution-item">
            <span className="epa-resolution-label">Resolved:</span>
            <span className="epa-resolution-count">0 patterns</span>
          </div>
          <div className="epa-resolution-item">
            <span className="epa-resolution-label">Improved:</span>
            <span className="epa-resolution-count">1 pattern</span>
          </div>
          <div className="epa-resolution-item">
            <span className="epa-resolution-label">Persistent:</span>
            <span className="epa-resolution-count">0 patterns</span>
          </div>
        </div>
      );
    }

    const resolution = interventionData.errorPatternResolution;
    return (
      <div className="epa-pattern-resolution">
        <div className="epa-resolution-item success">
          <span className="epa-resolution-label">Resolved:</span>
          <span className="epa-resolution-count">{resolution.resolved?.length || 0}</span>
        </div>
        <div className="epa-resolution-item improved">
          <span className="epa-resolution-label">Improved:</span>
          <span className="epa-resolution-count">{resolution.improved?.length || 1}</span>
        </div>
        <div className="epa-resolution-item persistent">
          <span className="epa-resolution-label">Persistent:</span>
          <span className="epa-resolution-count">{resolution.persistent?.length || 0}</span>
        </div>
        {resolution.new_patterns && resolution.new_patterns.length > 0 && (
          <div className="epa-resolution-item new">
            <span className="epa-resolution-label">New Issues:</span>
            <span className="epa-resolution-count">{resolution.new_patterns.length}</span>
          </div>
        )}
      </div>
    );
  };

  /**
   * Renders teacher action recommendations
   */
  const renderTeacherActionRecommendations = (interventionData, categoryName, interventionStatus) => {
    if (interventionStatus === 'success') {
      return (
        <div className="epa-action-recommendations success">
          <div className="epa-success-actions">
            <div className="epa-action-item success-item">
              <div className="epa-action-title">Category Complete</div>
              <div className="epa-action-description">
                Student has mastered {categoryName}. They can now proceed to the next category or reading level.
              </div>
            </div>
            <div className="epa-action-item maintenance-item">
              <div className="epa-action-title">🔄 Maintenance Activities</div>
              <div className="epa-action-description">
                Continue periodic practice to maintain mastery. Review in 2-3 weeks.
              </div>
            </div>
          </div>
        </div>
      );
    } else {
      return (
        <div className="epa-action-recommendations revision-needed">
          <div className="epa-revision-actions">
            <div className="epa-action-item revision-primary">
              <div className="epa-action-title">📝 Intervention Needs Revision</div>
              <div className="epa-action-description">
                Student showed improvement ({interventionData.improvement || 0}%) but needs slight adjustments to reach the 75% threshold.
              </div>
            </div>
            <div className="epa-revision-suggestions">
              <div className="epa-revision-title">💡 Revision Suggestions:</div>
              <ul className="epa-suggestion-list">
                <li>Reduce question complexity slightly</li>
                <li>Add visual or audio support features</li>
                <li>Focus on persistent error patterns</li>
                <li>Consider breaking into shorter practice sessions</li>
              </ul>
            </div>
            <div className="epa-action-item priority-high">
              <div className="epa-action-title">⚡ Priority: High</div>
              <div className="epa-action-description">
                Student is close to passing. Small adjustments should lead to success.
              </div>
            </div>
          </div>
        </div>
      );
    }
  };

  /**
   * Renders simplified prescriptive analysis for the "Before" column
   */
  const renderSimplifiedPrescriptiveAnalysis = (detailedErrorAnalysis, researchBasedPrescriptions, categoryName) => {
    return (
      <div className="epa-simplified-analysis">
        <div className="epa-analysis-section">
          <h6 className="epa-section-title">Key Error Patterns</h6>
          <div className="epa-error-summary">
            {detailedErrorAnalysis && detailedErrorAnalysis.length > 0 ? (
              detailedErrorAnalysis.slice(0, 3).map((error, index) => (
                <div key={index} className="epa-error-item-simple">
                  <span className="epa-error-pattern">{error.errorPattern}</span>
                  <span className="epa-error-focus">{error.interventionFocus}</span>
                </div>
              ))
            ) : (
              <div className="epa-no-data">Error patterns not available</div>
            )}
          </div>
        </div>

        <div className="epa-analysis-section">
          <h6 className="epa-section-title">Recommended Intervention</h6>
          <div className="epa-prescription-summary">
            {researchBasedPrescriptions && researchBasedPrescriptions[categoryName] ? (
              <div className="epa-prescription-overview">
                <div className="epa-prescription-item">
                  <strong>Approach:</strong> {researchBasedPrescriptions[categoryName].nextInterventionPrescription?.primaryApproach || 'Comprehensive intervention'}
                </div>
                <div className="epa-prescription-item">
                  <strong>Intensity:</strong> {researchBasedPrescriptions[categoryName].nextInterventionPrescription?.intensityLevel || 'Standard'}
                </div>
              </div>
            ) : (
              <div className="epa-no-data">Prescription details not available</div>
            )}
          </div>
        </div>
      </div>
    );
  };

  /**
   * Renders progress analysis for the middle column
   */
  const renderProgressAnalysis = (interventionData, categoryName) => {
    const improvementPercentage = interventionData.improvement || 0;
    const masteryGrowth = interventionData.skillMastery?.[categoryName]?.masteryGrowth || 0;

    return (
      <div className="epa-progress-analysis">
        <div className="epa-progress-chart">
          <div className="epa-progress-item">
            <div className="epa-progress-label">Score Improvement</div>
            <div className="epa-progress-bar">
              <div
                className={`epa-progress-fill ${improvementPercentage >= 0 ? 'positive' : 'negative'}`}
                style={{ width: `${Math.min(Math.abs(improvementPercentage), 100)}%` }}
              ></div>
            </div>
            <div className="epa-progress-value">
              {improvementPercentage >= 0 ? '+' : ''}{improvementPercentage}%
            </div>
          </div>

          <div className="epa-progress-item">
            <div className="epa-progress-label">Mastery Growth (BKT)</div>
            <div className="epa-progress-bar">
              <div
                className={`epa-progress-fill ${masteryGrowth >= 0 ? 'positive' : 'negative'}`}
                style={{ width: `${Math.min(Math.abs(masteryGrowth * 100), 100)}%` }}
              ></div>
            </div>
            <div className="epa-progress-value">
              {masteryGrowth >= 0 ? '+' : ''}{(masteryGrowth * 100).toFixed(1)}%
            </div>
          </div>
        </div>

        <div className="epa-effectiveness-analysis">
          <h6 className="epa-section-title">Intervention Effectiveness</h6>
          <div className="epa-effectiveness-summary">
            {interventionData.interventionEffectiveness ? (
              <div className="epa-effectiveness-details">
                <div className="epa-effectiveness-item">
                  <strong>Overall:</strong> {interventionData.interventionEffectiveness.overallEffectiveness?.replace('_', ' ') || 'Moderately Effective'}
                </div>
                <div className="epa-effectiveness-item">
                  <strong>Key Strengths:</strong> {interventionData.interventionEffectiveness.interventionInsights?.strengths?.join(', ') || 'Student showed improvement'}
                </div>
              </div>
            ) : (
              <div className="epa-no-data">Effectiveness analysis not available</div>
            )}
          </div>
        </div>

        <div className="epa-skill-comparison">
          <h6 className="epa-section-title">Skill Mastery Comparison</h6>
          <div className="epa-mastery-before-after">
            <div className="epa-mastery-item">
              <span className="epa-mastery-label">Before:</span>
              <span className="epa-mastery-value before">
                {interventionData.progressComparison?.mainAssessmentPerformance?.masteryProbability
                  ? (interventionData.progressComparison.mainAssessmentPerformance.masteryProbability * 100).toFixed(0) + '%'
                  : 'N/A'}
              </span>
            </div>
            <div className="epa-mastery-item">
              <span className="epa-mastery-label">After:</span>
              <span className="epa-mastery-value after">
                {interventionData.progressComparison?.interventionPerformance?.masteryProbability
                  ? (interventionData.progressComparison.interventionPerformance.masteryProbability * 100).toFixed(0) + '%'
                  : 'N/A'}
              </span>
            </div>
          </div>
        </div>
      </div>
    );
  };

  /**
   * Renders intervention results analysis for the "After" column
   */
  const renderInterventionResultsAnalysis = (interventionData, categoryName) => {
    return (
      <div className="epa-intervention-results">
        <div className="epa-results-section">
          <h6 className="epa-section-title">Error Pattern Resolution</h6>
          <div className="epa-pattern-resolution">
            {interventionData.interventionEffectiveness?.errorPatternResolution ? (
              <div className="epa-resolution-summary">
                <div className="epa-resolution-item resolved">
                  <span className="epa-resolution-label">Resolved:</span>
                  <span className="epa-resolution-count">
                    {interventionData.interventionEffectiveness.errorPatternResolution.resolved?.length || 0}
                  </span>
                </div>
                <div className="epa-resolution-item improved">
                  <span className="epa-resolution-label">Improved:</span>
                  <span className="epa-resolution-count">
                    {interventionData.interventionEffectiveness.errorPatternResolution.improved?.length || 0}
                  </span>
                </div>
                <div className="epa-resolution-item persistent">
                  <span className="epa-resolution-label">Persistent:</span>
                  <span className="epa-resolution-count">
                    {interventionData.interventionEffectiveness.errorPatternResolution.persistent?.length || 0}
                  </span>
                </div>
              </div>
            ) : (
              <div className="epa-no-data">Pattern resolution data not available</div>
            )}
          </div>
        </div>

        <div className="epa-results-section">
          <h6 className="epa-section-title">Current Error Patterns</h6>
          <div className="epa-current-errors">
            {interventionData.errorPatterns?.[categoryName] ? (
              <div className="epa-error-details">
                {Object.entries(interventionData.errorPatterns[categoryName])
                  .filter(([key, value]) => key !== 'detailedErrorAnalysis' && value.count > 0)
                  .slice(0, 3)
                  .map(([errorType, errorData], index) => (
                    <div key={index} className="epa-error-item-after">
                      <span className="epa-error-type">{errorType.replace('_', ' ')}</span>
                      <span className="epa-error-percentage">{errorData.percentage || errorData.count}%</span>
                    </div>
                  ))}
              </div>
            ) : (
              <div className="epa-no-data">Current error patterns not available</div>
            )}
          </div>
        </div>

        <div className="epa-results-section">
          <h6 className="epa-section-title">Next Steps Prescription</h6>
          <div className="epa-next-steps">
            {interventionData.researchBasedPrescriptions?.[categoryName] ? (
              <div className="epa-next-prescription">
                <div className="epa-next-action">
                  <strong>Recommended Action:</strong> {interventionData.researchBasedPrescriptions[categoryName].nextInterventionPrescription?.recommendedAction?.replace('_', ' ') || 'Continue current approach'}
                </div>
                <div className="epa-next-intensity">
                  <strong>Intensity Level:</strong> {interventionData.researchBasedPrescriptions[categoryName].nextInterventionPrescription?.intensityLevel?.replace('_', ' ') || 'Standard'}
                </div>
              </div>
            ) : (
              <div className="epa-no-data">Next steps prescription not available</div>
            )}
          </div>
        </div>
      </div>
    );
  };

  /**
   * Renders comprehensive intervention results details that aren't shown elsewhere
   * Dynamically fetches from interventionResults state
   */
  const renderDetailedInterventionData = (categoryName) => {
    const interventionData = interventionResults[categoryName];

    if (!interventionData) {
      return null;
    }

    return (
      <div className="epa-detailed-intervention-container">
        <div className="epa-detailed-header">
          <h4>
            <FaListAlt className="epa-icon" />
            Comprehensive Intervention Analysis
          </h4>
          <span className="epa-data-source">Live Database Data</span>
        </div>

        <div className="epa-two-column-layout">
          {/* Left Column: Technical Analysis */}
          <div className="epa-left-column">
            <div className="epa-column-header">
              <FaCog className="epa-icon" />
              <span>Technical Analysis Data</span>
            </div>
            <div className="epa-column-content">

              {/* Response History Details */}
              {interventionData.skillMastery?.[categoryName]?.responseHistory && (
                <div className="epa-response-history-section">
                  <h5>
                    <FaHistory className="epa-section-icon" />
                    Response History ({interventionData.skillMastery[categoryName].responseHistory.length} questions)
                  </h5>
                  <div className="epa-response-timeline">
                    {interventionData.skillMastery[categoryName].responseHistory.map((response, index) => (
                      <div key={index} className="epa-response-item">
                        <div className="epa-response-question">
                          <span className="epa-question-id">{response.questionId}</span>
                          <span className={`epa-response-result ${response.correct ? 'correct' : 'incorrect'}`}>
                            {response.correct ? '✓' : '✗'}
                          </span>
                        </div>
                        <div className="epa-response-mastery">
                          Mastery: {(response.masteryAfter * 100).toFixed(1)}%
                        </div>
                        <div className="epa-response-time">
                          {new Date(response.timestamp).toLocaleTimeString()}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Ability Estimates */}
              {interventionData.abilityEstimates && (
                <div className="epa-ability-section">
                  <h5>
                    <FaChartBar className="epa-section-icon" />
                    IRT Ability Estimates
                  </h5>
                  <div className="epa-ability-data">
                    {Object.entries(interventionData.abilityEstimates).map(([category, estimate]) => (
                      <div key={category} className="epa-ability-item">
                        <span className="epa-ability-category">{category}:</span>
                        <span className={`epa-ability-value ${estimate >= 0 ? 'positive' : 'negative'}`}>
                          {estimate.toFixed(2)}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Assessment Metadata */}
              <div className="epa-metadata-section">
                <h5>
                  <FaInfoCircle className="epa-section-icon" />
                  Assessment Details
                </h5>
                <div className="epa-metadata-grid">
                  <div className="epa-metadata-item">
                    <label>Assessment Date:</label>
                    <span>{new Date(interventionData.assessmentDate).toLocaleString()}</span>
                  </div>
                  <div className="epa-metadata-item">
                    <label>Reading Level:</label>
                    <span>{interventionData.readingLevel}</span>
                  </div>
                  <div className="epa-metadata-item">
                    <label>Total Questions:</label>
                    <span>{interventionData.totalQuestions}</span>
                  </div>
                  <div className="epa-metadata-item">
                    <label>Correct Answers:</label>
                    <span>{interventionData.correctAnswers}</span>
                  </div>
                  <div className="epa-metadata-item">
                    <label>Pass Threshold:</label>
                    <span>{interventionData.passThreshold}%</span>
                  </div>
                  <div className="epa-metadata-item">
                    <label>Previous Score:</label>
                    <span>{interventionData.previousScore}%</span>
                  </div>
                  <div className="epa-metadata-item">
                    <label>Improvement:</label>
                    <span className={`${interventionData.improvement >= 0 ? 'positive' : 'negative'}`}>
                      {interventionData.improvement >= 0 ? '+' : ''}{interventionData.improvement}%
                    </span>
                  </div>
                  <div className="epa-metadata-item">
                    <label>Improvement Percentage:</label>
                    <span>{interventionData.improvementPercentage.toFixed(1)}%</span>
                  </div>
                </div>
              </div>

            </div>
          </div>

          {/* Right Column: Research & Prescriptions */}
          <div className="epa-right-column">
            <div className="epa-column-header">
              <FaUserMd className="epa-icon" />
              <span>Research-Based Prescriptions</span>
            </div>
            <div className="epa-column-content">


              {/* Comprehensive Research-Based Prescriptions Container */}
              {interventionData.researchBasedPrescriptions?.[categoryName] && (
                <div className="epa-research-prescriptions-container">
                  <h4 className="epa-subsection-title">
                    <FaFlask className="epa-section-icon" />
                    Research-Based Prescriptions - {categoryName}
                  </h4>

                  {/* Category Status */}
                  {interventionData.researchBasedPrescriptions[categoryName].categoryStatus && (
                    <div className="epa-category-status-card">
                      <h5 className="epa-status-title">Category Status</h5>
                      <div className={`epa-status-badge status-${interventionData.researchBasedPrescriptions[categoryName].categoryStatus.replace(/_/g, '-')}`}>
                        {interventionData.researchBasedPrescriptions[categoryName].categoryStatus.replace(/_/g, ' ').toUpperCase()}
                      </div>
                    </div>
                  )}

                  {/* Deficit Analysis */}
                  {interventionData.researchBasedPrescriptions[categoryName].deficitAnalysis && (
                    <div className="epa-deficit-analysis-card">
                      <h5 className="epa-analysis-title">
                        <FaExclamationCircle className="epa-icon" />
                        Deficit Analysis
                      </h5>

                      {/* Specific Deficits */}
                      {interventionData.researchBasedPrescriptions[categoryName].deficitAnalysis.specificDeficits?.map((deficit, index) => (
                        <div key={index} className="epa-deficit-item">
                          <div className="epa-deficit-header">
                            <span className="epa-deficit-name">{deficit.deficit}</span>
                            <span className={`epa-severity-badge severity-${deficit.severity}`}>{deficit.severity}</span>
                          </div>
                          <div className="epa-deficit-details">
                            <div className="epa-manifestation">
                              <strong>Manifestation:</strong> {deficit.manifestation}
                            </div>
                            {deficit.errorRate && (
                              <div className="epa-error-rate">
                                <strong>Error Rate:</strong> {deficit.errorRate}
                              </div>
                            )}
                            {deficit.researchEvidence && (
                              <div className="epa-research-evidence">
                                <strong>Research Evidence:</strong> {deficit.researchEvidence}
                              </div>
                            )}
                            {deficit.interventionResponse && (
                              <div className="epa-intervention-response">
                                <strong>Response:</strong> {deficit.interventionResponse}
                              </div>
                            )}
                          </div>
                        </div>
                      ))}

                      {/* Root Cause Analysis */}
                      {interventionData.researchBasedPrescriptions[categoryName].deficitAnalysis.rootCauseAnalysis && (
                        <div className="epa-root-cause">
                          <h6>Root Cause Analysis</h6>
                          <p>{interventionData.researchBasedPrescriptions[categoryName].deficitAnalysis.rootCauseAnalysis}</p>
                        </div>
                      )}

                      {/* Cognitive & Linguistic Factors */}
                      <div className="epa-factors-grid">
                        {interventionData.researchBasedPrescriptions[categoryName].deficitAnalysis.cognitiveFactors?.length > 0 && (
                          <div className="epa-factors-section">
                            <h6>Cognitive Factors</h6>
                            <div className="epa-factors-list">
                              {interventionData.researchBasedPrescriptions[categoryName].deficitAnalysis.cognitiveFactors.map((factor, idx) => (
                                <span key={idx} className="epa-factor-tag cognitive">{factor.replace(/_/g, ' ')}</span>
                              ))}
                            </div>
                          </div>
                        )}
                        {interventionData.researchBasedPrescriptions[categoryName].deficitAnalysis.linguisticFactors?.length > 0 && (
                          <div className="epa-factors-section">
                            <h6>Linguistic Factors</h6>
                            <div className="epa-factors-list">
                              {interventionData.researchBasedPrescriptions[categoryName].deficitAnalysis.linguisticFactors.map((factor, idx) => (
                                <span key={idx} className="epa-factor-tag linguistic">{factor.replace(/_/g, ' ')}</span>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>

                      {/* Research Classification */}
                      {interventionData.researchBasedPrescriptions[categoryName].deficitAnalysis.researchClassification && (
                        <div className="epa-research-classification">
                          <h6>Research Classification</h6>
                          <span className="epa-classification-badge">
                            {interventionData.researchBasedPrescriptions[categoryName].deficitAnalysis.researchClassification.replace(/_/g, ' ')}
                          </span>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Next Intervention Prescription */}
                  {interventionData.researchBasedPrescriptions[categoryName].nextInterventionPrescription && (
                    <div className="epa-intervention-prescription-card">
                      <h5 className="epa-prescription-title">
                        <FaRoute className="epa-icon" />
                        Next Intervention Prescription
                      </h5>

                      {/* Recommended Action */}
                      <div className="epa-recommended-action">
                        <strong>Recommended Action:</strong>
                        <span className={`epa-action-badge action-${interventionData.researchBasedPrescriptions[categoryName].nextInterventionPrescription.recommendedAction?.replace(/_/g, '-')}`}>
                          {interventionData.researchBasedPrescriptions[categoryName].nextInterventionPrescription.recommendedAction?.replace(/_/g, ' ')}
                        </span>
                      </div>

                      {/* Primary Approach */}
                      {interventionData.researchBasedPrescriptions[categoryName].nextInterventionPrescription.primaryApproach && (
                        <div className="epa-primary-approach">
                          <strong>Primary Approach:</strong> {interventionData.researchBasedPrescriptions[categoryName].nextInterventionPrescription.primaryApproach}
                        </div>
                      )}

                      {/* Specific Techniques */}
                      {interventionData.researchBasedPrescriptions[categoryName].nextInterventionPrescription.specificTechniques?.length > 0 && (
                        <div className="epa-specific-techniques">
                          <h6>Specific Techniques</h6>
                          {interventionData.researchBasedPrescriptions[categoryName].nextInterventionPrescription.specificTechniques.map((technique, idx) => (
                            <div key={idx} className="epa-technique-card">
                              <div className="epa-technique-name">{technique.technique}</div>
                              <div className="epa-technique-description">{technique.description}</div>
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
                                  <strong>Progress Criteria:</strong> {technique.progressCriteria}
                                </div>
                              )}
                              {technique.researchBasis && (
                                <div className="epa-technique-research">
                                  <strong>Research Basis:</strong> {technique.researchBasis}
                                </div>
                              )}
                              {technique.modificationFromPrevious && (
                                <div className="epa-technique-modification">
                                  <strong>Modification:</strong> {technique.modificationFromPrevious}
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                      )}

                      {/* Intensity Level */}
                      {interventionData.researchBasedPrescriptions[categoryName].nextInterventionPrescription.intensityLevel && (
                        <div className="epa-intensity-level">
                          <strong>Intensity Level:</strong>
                          <span className={`epa-intensity-badge intensity-${interventionData.researchBasedPrescriptions[categoryName].nextInterventionPrescription.intensityLevel}`}>
                            {interventionData.researchBasedPrescriptions[categoryName].nextInterventionPrescription.intensityLevel}
                          </span>
                        </div>
                      )}

                      {/* Session Structure */}
                      {interventionData.researchBasedPrescriptions[categoryName].nextInterventionPrescription.sessionStructure && (
                        <div className="epa-session-structure">
                          <h6>Session Structure</h6>
                          {interventionData.researchBasedPrescriptions[categoryName].nextInterventionPrescription.sessionStructure.optimalLength && (
                            <div className="epa-session-length">
                              <strong>Optimal Length:</strong> {interventionData.researchBasedPrescriptions[categoryName].nextInterventionPrescription.sessionStructure.optimalLength}
                            </div>
                          )}
                          {interventionData.researchBasedPrescriptions[categoryName].nextInterventionPrescription.sessionStructure.sessionComponents?.length > 0 && (
                            <div className="epa-session-components">
                              <strong>Components:</strong>
                              <div className="epa-components-list">
                                {interventionData.researchBasedPrescriptions[categoryName].nextInterventionPrescription.sessionStructure.sessionComponents.map((component, idx) => (
                                  <span key={idx} className="epa-component-tag">{component.replace(/_/g, ' ')}</span>
                                ))}
                              </div>
                            </div>
                          )}
                          {interventionData.researchBasedPrescriptions[categoryName].nextInterventionPrescription.sessionStructure.breakPattern && (
                            <div className="epa-break-pattern">
                              <strong>Break Pattern:</strong> {interventionData.researchBasedPrescriptions[categoryName].nextInterventionPrescription.sessionStructure.breakPattern}
                            </div>
                          )}
                        </div>
                      )}

                      {/* Material Recommendations */}
                      {interventionData.researchBasedPrescriptions[categoryName].nextInterventionPrescription.materialRecommendations?.length > 0 && (
                        <div className="epa-material-recommendations">
                          <h6>Material Recommendations</h6>
                          <div className="epa-materials-list">
                            {interventionData.researchBasedPrescriptions[categoryName].nextInterventionPrescription.materialRecommendations.map((material, idx) => (
                              <div key={idx} className="epa-material-item">{material}</div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Progress Monitoring */}
                      {interventionData.researchBasedPrescriptions[categoryName].nextInterventionPrescription.progressMonitoring && (
                        <div className="epa-progress-monitoring">
                          <h6>Progress Monitoring</h6>
                          {interventionData.researchBasedPrescriptions[categoryName].nextInterventionPrescription.progressMonitoring.frequency && (
                            <div className="epa-monitoring-frequency">
                              <strong>Frequency:</strong> {interventionData.researchBasedPrescriptions[categoryName].nextInterventionPrescription.progressMonitoring.frequency}
                            </div>
                          )}
                          {interventionData.researchBasedPrescriptions[categoryName].nextInterventionPrescription.progressMonitoring.keyIndicators?.length > 0 && (
                            <div className="epa-monitoring-indicators">
                              <strong>Key Indicators:</strong>
                              <ul>
                                {interventionData.researchBasedPrescriptions[categoryName].nextInterventionPrescription.progressMonitoring.keyIndicators.map((indicator, idx) => (
                                  <li key={idx}>{indicator}</li>
                                ))}
                              </ul>
                            </div>
                          )}
                          {interventionData.researchBasedPrescriptions[categoryName].nextInterventionPrescription.progressMonitoring.dataCollectionMethod && (
                            <div className="epa-monitoring-method">
                              <strong>Data Collection:</strong> {interventionData.researchBasedPrescriptions[categoryName].nextInterventionPrescription.progressMonitoring.dataCollectionMethod}
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  )}

                  {/* Teacher Revision Guidance */}
                  {interventionData.researchBasedPrescriptions[categoryName].teacherRevisionGuidance && (
                    <div className="epa-teacher-revision-card">
                      <h5 className="epa-revision-title">
                        <FaEdit className="epa-icon" />
                        Teacher Revision Guidance
                      </h5>

                      {/* Revision Status */}
                      <div className="epa-revision-status">
                        <div className="epa-revision-recommended">
                          <strong>Revision Recommended:</strong>
                          <span className={`epa-recommendation-badge ${interventionData.researchBasedPrescriptions[categoryName].teacherRevisionGuidance.revisionRecommended ? 'recommended' : 'not-recommended'}`}>
                            {interventionData.researchBasedPrescriptions[categoryName].teacherRevisionGuidance.revisionRecommended ? 'Yes' : 'No'}
                          </span>
                        </div>
                        {interventionData.researchBasedPrescriptions[categoryName].teacherRevisionGuidance.revisionPriority && (
                          <div className="epa-revision-priority">
                            <strong>Priority:</strong>
                            <span className={`epa-priority-badge priority-${interventionData.researchBasedPrescriptions[categoryName].teacherRevisionGuidance.revisionPriority}`}>
                              {interventionData.researchBasedPrescriptions[categoryName].teacherRevisionGuidance.revisionPriority}
                            </span>
                          </div>
                        )}
                      </div>

                      {/* Specific Changes */}
                      {interventionData.researchBasedPrescriptions[categoryName].teacherRevisionGuidance.specificChanges?.length > 0 && (
                        <div className="epa-specific-changes">
                          <h6>Specific Changes</h6>
                          {interventionData.researchBasedPrescriptions[categoryName].teacherRevisionGuidance.specificChanges.map((change, idx) => (
                            <div key={idx} className="epa-change-item">
                              <div className="epa-change-description">
                                <strong>Change:</strong> {change.change}
                              </div>
                              <div className="epa-change-rationale">
                                <strong>Rationale:</strong> {change.rationale}
                              </div>
                              {change.expectedImpact && (
                                <div className="epa-change-impact">
                                  <strong>Expected Impact:</strong> {change.expectedImpact}
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                      )}

                      {/* Question Modifications */}
                      {interventionData.researchBasedPrescriptions[categoryName].teacherRevisionGuidance.questionModifications?.length > 0 && (
                        <div className="epa-question-modifications">
                          <h6>Question Modifications</h6>
                          {interventionData.researchBasedPrescriptions[categoryName].teacherRevisionGuidance.questionModifications.map((mod, idx) => (
                            <div key={idx} className="epa-modification-item">
                              <div className="epa-modification-type">
                                <strong>Question Type:</strong> {mod.questionType}
                              </div>
                              <div className="epa-modification-current">
                                <strong>Current Difficulty:</strong> {mod.currentDifficulty}
                              </div>
                              <div className="epa-modification-recommended">
                                <strong>Recommended Change:</strong> {mod.recommendedChange}
                              </div>
                              <div className="epa-modification-reason">
                                <strong>Reason:</strong> {mod.reason}
                              </div>
                            </div>
                          ))}
                        </div>
                      )}

                      {/* Support Features */}
                      {interventionData.researchBasedPrescriptions[categoryName].teacherRevisionGuidance.supportFeatures?.length > 0 && (
                        <div className="epa-support-features">
                          <h6>Support Features</h6>
                          <div className="epa-features-list">
                            {interventionData.researchBasedPrescriptions[categoryName].teacherRevisionGuidance.supportFeatures.map((feature, idx) => (
                              <span key={idx} className="epa-feature-tag">{feature}</span>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Estimated Impact */}
                      {interventionData.researchBasedPrescriptions[categoryName].teacherRevisionGuidance.estimatedImpact && (
                        <div className="epa-estimated-impact">
                          <strong>Estimated Impact:</strong> {interventionData.researchBasedPrescriptions[categoryName].teacherRevisionGuidance.estimatedImpact}
                        </div>
                      )}
                    </div>
                  )}

                  {/* Escalation Protocol */}
                  {interventionData.researchBasedPrescriptions[categoryName].escalationProtocol && (
                    <div className="epa-escalation-protocol-card">
                      <h5 className="epa-escalation-title">
                        <FaExclamationTriangle className="epa-icon" />
                        Escalation Protocol
                      </h5>
                      <div className="epa-escalation-status">
                        <strong>Escalation Triggered:</strong>
                        <span className={`epa-escalation-badge ${interventionData.researchBasedPrescriptions[categoryName].escalationProtocol.escalationTriggered ? 'triggered' : 'not-triggered'}`}>
                          {interventionData.researchBasedPrescriptions[categoryName].escalationProtocol.escalationTriggered ? 'Yes' : 'No'}
                        </span>
                      </div>
                      {interventionData.researchBasedPrescriptions[categoryName].escalationProtocol.triggers?.length > 0 && (
                        <div className="epa-escalation-triggers">
                          <h6>Triggers</h6>
                          <ul>
                            {interventionData.researchBasedPrescriptions[categoryName].escalationProtocol.triggers.map((trigger, idx) => (
                              <li key={idx}>{trigger}</li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}

              {/* Insights & Recommendations */}
              {interventionData.insights && (
                <div className="epa-insights-section">
                  <h5>
                    <FaLightbulb className="epa-section-icon" />
                    AI Insights & Recommendations
                  </h5>
                  <div className="epa-insights-content">
                    {interventionData.insights.strengths?.length > 0 && (
                      <div className="epa-strengths">
                        <h6>Strengths</h6>
                        <ul>
                          {interventionData.insights.strengths.map((strength, index) => (
                            <li key={index}>{strength}</li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {interventionData.insights.weaknesses?.length > 0 && (
                      <div className="epa-weaknesses">
                        <h6>Areas for Improvement</h6>
                        <ul>
                          {interventionData.insights.weaknesses.map((weakness, index) => (
                            <li key={index}>{weakness}</li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {interventionData.recommendations?.length > 0 && (
                      <div className="epa-recommendations">
                        <h6>Recommendations</h6>
                        <ul>
                          {interventionData.recommendations.map((rec, index) => (
                            <li key={index}>{rec}</li>
                          ))}
                        </ul>
                      </div>
                    )}

                    <div className="epa-readiness">
                      <strong>Overall Readiness:</strong> {interventionData.insights.overallReadiness}
                    </div>
                    <div className="epa-next-action">
                      <strong>Recommended Action:</strong> {interventionData.insights.recommendedAction?.replace('_', ' ')}
                    </div>
                  </div>
                </div>
              )}

            </div>
          </div>
        </div>
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
            .filter(cat => !showNeedingInterventionOnly || (Number(cat.score) || 0) < 75 || allCategoriesPassed)
            .map((category, index) => {
              const categoryName = category.categoryName;
              const displayName = formatCategoryName(categoryName);
              const score = Number(category.score) || 0;
              const isCompleted = category.isCompleted || false;
              const isPassed = category.isPassed || false;
              const needsIntervention = isCompleted && score < 75;
              const correctAnswers = category.correctAnswers || 0;
              const totalQuestions = category.totalQuestions || 0;

              // Define prerequisite order for reading levels
              const categoryPrerequisites = {
                'Alphabet Knowledge': [],
                'Phonological Awareness': ['Alphabet Knowledge'],
                'Decoding': ['Alphabet Knowledge', 'Phonological Awareness'],
                'Word Recognition': ['Alphabet Knowledge', 'Phonological Awareness', 'Decoding'],
                'Reading Comprehension': ['Alphabet Knowledge', 'Phonological Awareness', 'Decoding', 'Word Recognition']
              };

              // Check if prerequisites are met
              const prerequisites = categoryPrerequisites[categoryName] || [];
              const prerequisitesMet = prerequisites.every(prereqName => {
                const prereqCategory = liveCategoryResults?.categories?.find(cat => cat.categoryName === prereqName);
                return prereqCategory && prereqCategory.isPassed && prereqCategory.score >= 75;
              });

              // Determine blocking status
              const isBlocked = !prerequisitesMet && prerequisites.length > 0;
              const blockingCategory = prerequisites.find(prereqName => {
                const prereqCategory = liveCategoryResults?.categories?.find(cat => cat.categoryName === prereqName);
                return !prereqCategory || !prereqCategory.isPassed || prereqCategory.score < 75;
              });

              // Determine status and styling
              let statusLabel, statusClass, isClickable = true;

              if (isBlocked) {
                statusLabel = "BLOCKED";
                statusClass = "blocked";
                isClickable = false;
              } else if (needsIntervention) {
                statusLabel = "NEEDS ATTENTION";
                statusClass = "needs-attention";
              } else if (isPassed) {
                statusLabel = "PASSED";
                statusClass = "passed";
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
                  className={`literexia-category-tabb ${selectedCategory === categoryName ? 'active' : ''} ${statusClass} ${isBlocked ? 'blocked' : ''}`}
                  onClick={() => isClickable && setSelectedCategory(categoryName)}
                  style={isBlocked ? { cursor: 'not-allowed', opacity: 0.6 } : {}}
                >
                  <div className="literexia-tab-contentt">
                    <div className="literexia-tab-namee">{displayName}</div>
                    <div className="literexia-tab-scoree">{score}%</div>

                    <div className="literexia-progress-indicators">
                      {Array.from({ length: Math.min(totalQuestions, 5) }).map((_, i) => (
                        <div
                          key={i}
                          className={`literexia-progress-indicator ${i < correctAnswers ? 'correct' : ''} ${isBlocked ? 'blocked' : ''}`}
                        />
                      ))}
                    </div>

                    <div className={`literexia-tab-badge ${statusClass}`}>
                      {isBlocked ? (
                        <>
                          <FaTimes /> {statusLabel}
                          <div className="blocked-reason">
                            Must pass: {blockingCategory}
                          </div>
                        </>
                      ) : needsIntervention ? (
                        <>
                          <FaExclamationTriangle /> {statusLabel}
                        </>
                      ) : isPassed ? (
                        <>
                          <FaCheckCircle /> {statusLabel}
                        </>
                      ) : (
                        <>
                          <FaInfoCircle /> {statusLabel}
                        </>
                      )}
                    </div>

                    {!isBlocked && !needsIntervention && !isPassed && correctAnswers > 0 && (
                      <div className="literexia-status-text">
                        Need {Math.ceil(totalQuestions * 0.75) - correctAnswers} more to pass
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
    
  // Use a try-catch block to handle any potential errors in getAnalysisForCategory
  let selectedAnalysis = null;
  try {
    selectedAnalysis = selectedCategory ? getAnalysisForCategory(selectedCategory) : null;
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
      {selectedCategory && selectedCategoryData && (
        <div className="literexia-category-analysis">
          
          {/* Show success banner for passed categories */}
          {selectedCategoryData?.isPassed && (
            <div className="literexia-success-banner">
              <FaCheckCircle style={{color: '#4CAF50'}} />
              <p>
                The student has mastered {formatCategoryName(selectedCategory)} with a score of {selectedCategoryData.score}% (above the 75% threshold). No intervention is needed for this category.
              </p>
            </div>
          )}

          {/* Show processing message when no analysis is available */}
          {!selectedAnalysis && !selectedCategoryData?.isPassed && (
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

          {/* Current interventions - only show if the selected category has not passed */}
          {selectedCategoryData && !selectedCategoryData.isPassed && (
            <div className="literexia-current-interventions">
              <div className="literexia-interventions-header">
                <h3>Current Interventions</h3>
                {selectedInterventions.length === 0 && (
                  <button 
                    className="literexia-create-activity-btn" 
                    onClick={() => handleCreateActivity(selectedCategory, selectedAnalysis)}
                    disabled={loading}
                    title="Create a new intervention activity"
                  >
                    <FaPlus /> Create New Intervention Activity
                  </button>
                )}
              </div>
              
              {selectedInterventions.length > 0 ? (
                <div className="literexia-interventions-list">
                  {selectedInterventions.map((intervention, index) => {
                    const progress = getProgressForIntervention(intervention._id);
                    const progressPercentage = progress ? progress.percentComplete : 0;
                    // Removed unused variable: correctPercentage
                    const isPassed = progress ? progress.passedThreshold : false;
                    
                    return (
                      <div key={index} className="literexia-intervention-card">
                        {/* Card Header with Status Badge */}
                        <div className="literexia-intervention-card-header">
                          <div className="literexia-intervention-category-badge">
                            <FaBook className="category-icon" />
                            <span className="category-name">{intervention.category || selectedCategory}</span>
                          </div>
                          <div className={`literexia-intervention-status-badge ${isPassed ? 'passed' : intervention.status}`}>
                            {isPassed ? (
                              <>
                                <FaCheckCircle className="status-icon" />
                                <span>PASSED</span>
                              </>
                            ) : intervention.status === 'active' ? (
                              <>
                                <FaMobile className="status-icon" />
                                <span>ACTIVE</span>
                              </>
                            ) : (
                              <>
                                <FaEdit className="status-icon" />
                                <span>DRAFT</span>
                              </>
                            )}
                          </div>
                        </div>

                        {/* Progress Section */}
                        <div className="literexia-intervention-progress-section">
                          <div className="literexia-progress-header">
                            <div className="literexia-progress-title">
                              <FaChartLine className="progress-icon" />
                              <span>Score Percentage</span>
                            </div>
                            <div className="literexia-progress-percentage">
                              {progressPercentage}%
                            </div>
                          </div>
                          <div className="literexia-progress-bar-container">
                            <div
                              className="literexia-progress-bar-fill"
                              style={{
                                width: `${progressPercentage}%`,
                                backgroundColor: '#5470a8'
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

                        {/* Action Buttons */}
                        <div className="literexia-intervention-actions">
                          <button
                            className="literexia-edit-activity-btn"
                            onClick={() => handleCreateActivity(selectedCategory, selectedAnalysis, intervention)}
                            disabled={loading || intervention.status === 'active'}
                            title={intervention.status === 'active' ?
                              "Active interventions cannot be edited after being pushed to mobile" :
                              "Edit this intervention activity"}
                          >
                            <FaEdit className="action-icon" />
                            <span>Edit Activity</span>
                          </button>

                          {intervention.status === 'draft' ? (
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

        
      )}

      

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