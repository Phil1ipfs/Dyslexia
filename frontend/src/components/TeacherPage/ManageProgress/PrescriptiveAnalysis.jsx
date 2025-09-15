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
  FaLightbulb,
  FaArrowRight,
  FaPlus,
  FaMobile,
  FaChalkboardTeacher,
  FaHandsHelping,
  FaSpinner,
  FaTimes
} from 'react-icons/fa';
import ActivityEditModal from './ActivityEditModal';
import ConfirmationDialog from './ConfirmationDialog';
import SuccessNotification from './SuccessNotification';
import './css/PrescriptiveAnalysis.css';

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
  const [notificationMessage, setNotificationMessage] = useState({
    title: 'Success!',
    message: 'Intervention successfully pushed to mobile device!'
  });
  
  // ===== STATE (fetched if not injected by parent) =====
  const [liveStudent, setLiveStudent] = useState(student ?? null);
  const [liveCategoryResults, setLiveCategoryResults] = useState(categoryResults ?? null);
  const [liveAnalyses, setLiveAnalyses] = useState(prescriptiveAnalyses ?? null);
  const [liveInterventions, setLiveInterventions] = useState(interventions ?? []);
  const hasDataBeenFetched = useRef(false);

  // Merge server-created & local drafts
  const effectiveInterventions = [...liveInterventions, ...localInterventions];

  // Filter categories that need intervention (score < 75%)
  const categoriesNeedingIntervention = liveCategoryResults
    ? liveCategoryResults.categories.filter(cat => (Number(cat.score) || 0) < 75)
    : [];
    
  // Define allCategoriesPassed BEFORE it's used in getAnalysisForCategory
  const allCategoriesPassed = React.useMemo(
    () => liveCategoryResults?.categories?.length > 0 && categoriesNeedingIntervention.length === 0,
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
          setLiveCategoryResults(cat);

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
      if (categoriesNeedingIntervention.length > 0) {
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

    const categoryAnalysis = {
      // Basic info
      category: categoryName,
      readingLevel: studentAnalysis.readingLevel,
      overallScore: studentAnalysis.insights?.overallScore,

      // REAL BKT Data from skillMastery object (not Map)
      bktData: studentAnalysis.skillMastery?.[categoryName] || studentAnalysis.skillMastery?.[normalizedCategory],

      // REAL IRT Data from abilityEstimates object (not Map)
      irtAbility: studentAnalysis.abilityEstimates?.[categoryName] || studentAnalysis.abilityEstimates?.[normalizedCategory],

      // REAL Error Patterns from errorPatterns object (not Map)
      errorPatterns: studentAnalysis.errorPatterns?.[categoryName] || studentAnalysis.errorPatterns?.[normalizedCategory],

      // REAL Intervention Plan specific to this category
      interventionPlan: studentAnalysis.interventionPlan?.specificFocus?.[categoryName] ||
                       studentAnalysis.interventionPlan?.specificFocus?.[normalizedCategory] ||
                       studentAnalysis.interventionPlan,

      // Overall insights from REAL analysis
      insights: studentAnalysis.insights,

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

  /**
   * Get interventions for a specific category
   * @param {string} categoryName - Category name
   * @return {Array} Array of interventions
   */
  const getInterventionsForCategory = (categoryName) => {
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
   * Handle saving activity (from ActivityEditModal)
   * @param {Object} activityData - Activity data from modal
   */
  const handleSaveActivity = (activityData) => {
    setLocalInterventions(prev => {
      const existingIndex = prev.findIndex(item => item._id === activityData._id);
      if (existingIndex >= 0) {
        // Update existing
        const updated = [...prev];
        updated[existingIndex] = activityData;
        return updated;
      } else {
        // Add new
        return [...prev, activityData];
      }
    });

    setShowActivityModal(false);
    setEditingActivity(null);

    // Call parent callback if provided
    if (onCreateActivity) {
      onCreateActivity(activityData);
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
    // Display REAL mathematical analysis from CLAUDE.md prescriptive analytics system
    if (!analysis || !categoryName) {
      return (
        <div className="literexia-analysis-missing">
          <div className="literexia-missing-header">
            <FaExclamationTriangle />
            <h3>Prescriptive Analysis Not Available</h3>
          </div>
          <p>Mathematical analysis is being generated from student responses. Please check back shortly.</p>
        </div>
      );
    }

    const {
      bktData,           // Bayesian Knowledge Tracing data
      irtAbility,        // Item Response Theory ability estimate
      errorPatterns,     // Error pattern analysis
      insights,          // Overall insights
      interventionPlan   // Intervention recommendations
    } = analysis;

    return (
      <div className="literexia-mathematical-analysis">
        <div className="literexia-analysis-header">
          <div className="literexia-analysis-icon">
            <FaChartLine />
          </div>
          <h3>Mathematical Analysis for {categoryName}</h3>
          <span className="literexia-analysis-badge">CLAUDE.md Prescriptive Analytics</span>
        </div>

        <div className="literexia-analysis-content">

          {/* BKT (Bayesian Knowledge Tracing) Section */}
          {bktData && (
            <div className="literexia-bkt-section">
              <div className="literexia-section-header">
                <FaBrain className="literexia-section-icon" />
                <h4>Bayesian Knowledge Tracing (BKT)</h4>
              </div>
              <div className="literexia-bkt-content">
                <div className="literexia-mastery-probability">
                  <div className="literexia-probability-label">Mastery Probability:</div>
                  <div className="literexia-probability-value">
                    <span className={`literexia-probability-percent ${
                      bktData.masteryProbability >= 0.75 ? 'high' :
                      bktData.masteryProbability >= 0.5 ? 'medium' : 'low'
                    }`}>
                      {(bktData.masteryProbability * 100).toFixed(1)}%
                    </span>
                  </div>
                </div>
                <div className="literexia-bkt-details">
                  <div className="literexia-bkt-metric">
                    <strong>Assessment Score:</strong> {bktData.score}% ({bktData.isPassed ? 'Passed' : 'Needs Intervention'})
                  </div>
                  <div className="literexia-bkt-metric">
                    <strong>Questions Answered:</strong> {bktData.totalQuestions} total, {bktData.correctAnswers} correct
                    {bktData.totalPossibleMatches > 0 && (
                      <span> ({bktData.correctMatches}/{bktData.totalPossibleMatches} matches)</span>
                    )}
                  </div>
                  <div className="literexia-bkt-interpretation">
                    <strong>BKT Interpretation:</strong> {
                      bktData.masteryProbability >= 0.75 ?
                        `High confidence that student has mastered ${categoryName} skills` :
                      bktData.masteryProbability >= 0.5 ?
                        `Moderate confidence - student shows partial mastery of ${categoryName}` :
                        `Low confidence - student needs targeted intervention for ${categoryName}`
                    }
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* IRT (Item Response Theory) Section */}
          {irtAbility !== null && irtAbility !== undefined && (
            <div className="literexia-irt-section">
              <div className="literexia-section-header">
                <FaRuler className="literexia-section-icon" />
                <h4>Item Response Theory (IRT) Ability Estimate</h4>
              </div>
              <div className="literexia-irt-content">
                <div className="literexia-ability-scale">
                  <div className="literexia-scale-label">Ability Level (θ):</div>
                  <div className="literexia-ability-value">
                    <span className={`literexia-ability-score ${
                      irtAbility >= 1.0 ? 'excellent' :
                      irtAbility >= 0.0 ? 'above-average' :
                      irtAbility >= -1.0 ? 'below-average' : 'needs-support'
                    }`}>
                      {irtAbility > 0 ? '+' : ''}{irtAbility.toFixed(2)}
                    </span>
                    <span className="literexia-scale-range">(Scale: -3.0 to +3.0)</span>
                  </div>
                </div>
                <div className="literexia-irt-interpretation">
                  <strong>IRT Interpretation:</strong> {
                    irtAbility >= 1.5 ?
                      `Excellent ability - student performs well above average for ${categoryName}` :
                    irtAbility >= 0.5 ?
                      `Above average ability - student shows good performance in ${categoryName}` :
                    irtAbility >= -0.5 ?
                      `Average ability - student performance is typical for ${categoryName}` :
                    irtAbility >= -1.5 ?
                      `Below average ability - student needs additional support for ${categoryName}` :
                      `Significant difficulty - intensive intervention recommended for ${categoryName}`
                  }
                </div>
              </div>
            </div>
          )}

          {/* Error Pattern Analysis Section */}
          {errorPatterns && Object.keys(errorPatterns).length > 0 && (
            <div className="literexia-error-section">
              <div className="literexia-section-header">
                <FaExclamationCircle className="literexia-section-icon" />
                <h4>Error Pattern Analysis</h4>
              </div>
              <div className="literexia-error-content">
                {Object.entries(errorPatterns).map(([errorType, errorData]) => (
                  <div key={errorType} className="literexia-error-pattern">
                    <div className="literexia-error-type">{errorType.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}</div>
                    {errorData.count && errorData.total && (
                      <div className="literexia-error-stats">
                        <span className="literexia-error-rate">
                          {errorData.count}/{errorData.total} errors ({errorData.percentage}%)
                        </span>
                        {errorData.avg_partial_success && (
                          <span className="literexia-partial-success">
                            Average {(errorData.avg_partial_success * 100).toFixed(1)}% partial success per question
                          </span>
                        )}
                      </div>
                    )}
                    {errorData.error_type && (
                      <div className="literexia-error-classification">
                        <strong>Error Type:</strong> {errorData.error_type.replace(/_/g, ' ')}
                      </div>
                    )}
                    {errorData.questionIds && errorData.questionIds.length > 0 && (
                      <div className="literexia-error-questions">
                        <strong>Affected Questions:</strong> {errorData.questionIds.join(', ')}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Intervention Recommendations */}
          {interventionPlan && (
            <div className="literexia-intervention-section">
              <div className="literexia-section-header">
                <FaUserMd className="literexia-section-icon" />
                <h4>Intervention Recommendations</h4>
              </div>
              <div className="literexia-intervention-content">
                {interventionPlan.focus && (
                  <div className="literexia-focus-area">
                    <strong>Primary Focus:</strong> {interventionPlan.focus.replace(/_/g, ' ')}
                  </div>
                )}
                {interventionPlan.targetSounds && interventionPlan.targetSounds.length > 0 && (
                  <div className="literexia-target-sounds">
                    <strong>Target Sound Pairs:</strong> {interventionPlan.targetSounds.join(', ')}
                  </div>
                )}
                {interventionPlan.recommendedActivities && interventionPlan.recommendedActivities.length > 0 && (
                  <div className="literexia-recommended-activities">
                    <strong>Recommended Activities:</strong>
                    <ul>
                      {interventionPlan.recommendedActivities.map((activity, index) => (
                        <li key={index}>{activity.replace(/_/g, ' ')}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Overall Insights */}
          {insights && (
            <div className="literexia-insights-section">
              <div className="literexia-section-header">
                <FaLightbulb className="literexia-section-icon" />
                <h4>Overall Insights</h4>
              </div>
              <div className="literexia-insights-content">
                {insights.overallScore && (
                  <div className="literexia-overall-score">
                    <strong>Overall Reading Score:</strong> {insights.overallScore}%
                  </div>
                )}
                {insights.recommendedAction && (
                  <div className="literexia-recommended-action">
                    <strong>Recommended Action:</strong> {insights.recommendedAction.replace(/_/g, ' ')}
                  </div>
                )}
                {insights.weaknesses && insights.weaknesses.length > 0 && (
                  <div className="literexia-weaknesses">
                    <strong>Areas Needing Support:</strong> {insights.weaknesses.join(', ')}
                  </div>
                )}
              </div>
            </div>
          )}

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
          {liveCategoryResults.categories
            .filter(cat => !showNeedingInterventionOnly || (Number(cat.score) || 0) < 75 || allCategoriesPassed)
            .map((category, index) => {
              const categoryName = category.categoryName;
              const displayName = formatCategoryName(categoryName);
              const score = Number(category.score) || 0;
              const needsIntervention = score < 75;
              const correctAnswers = category.correctAnswers || 0;
              const totalQuestions = category.totalQuestions || 0;
              const statusLabel = needsIntervention ? "NEEDS ATTENTION" : "NOT STARTED";
              const statusClass = needsIntervention ? "needs-attention" : "not-started";
              
              return (
                <div 
                  key={index}
                  className={`literexia-category-tabb ${selectedCategory === categoryName ? 'active' : ''} ${needsIntervention ? 'needs-intervention' : ''}`}
                  onClick={() => setSelectedCategory(categoryName)}
                >
                  <div className="literexia-tab-contentt">
                    <div className="literexia-tab-namee">{displayName}</div>
                    <div className="literexia-tab-scoree">{score}%</div>
                    
                    <div className="literexia-progress-indicators">
                      {Array.from({ length: Math.min(totalQuestions, 5) }).map((_, i) => (
                        <div 
                          key={i} 
                          className={`literexia-progress-indicator ${i < correctAnswers ? 'correct' : ''}`}
                        />
                      ))}
                    </div>
                    
                    {needsIntervention ? (
                      <div className={`literexia-tab-badge ${statusClass}`}>
                        <FaExclamationTriangle /> {statusLabel}
                      </div>
                    ) : (
                      <div className="literexia-status-text">
                        {correctAnswers > 0 
                          ? `Need ${Math.ceil(totalQuestions * 0.75) - correctAnswers} more to pass` 
                          : 'Not started'}
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
          <div className="literexia-analysis-header">
            <h3>{formatCategoryName(selectedCategory)} Analysis</h3>
            <div className="literexia-analysis-metrics">
              <div className="literexia-metric">
                <div className="literexia-metric-label">Current Score</div>
                <div className="literexia-metric-value">{selectedCategoryData.score}%</div>
              </div>
              <div className="literexia-metric-arrow">
                <FaArrowRight />
              </div>
              <div className="literexia-metric">
                <div className="literexia-metric-label">Target Score</div>
                <div className="literexia-metric-value">75%</div>
              </div>
              <div className="literexia-metric">
                <div className="literexia-metric-label">Gap</div>
                <div className="literexia-metric-value">{Math.max(0, 75 - selectedCategoryData.score)}%</div>
              </div>
            </div>
          </div>
          
          {/* Analysis content */}
          <div className="literexia-analysis-content">
            {/* Show success banner for passed categories */}
            {selectedCategoryData?.isPassed && (
              <div className="literexia-success-banner">
                <FaCheckCircle style={{color: '#4CAF50'}} />
                <p>
                  The student has mastered {formatCategoryName(selectedCategory)} with a score of {selectedCategoryData.score}% (above the 75% threshold). No intervention is needed for this category.
                </p>
              </div>
            )}

            {/* Always show analysis sections for all categories */}
            <div className="literexia-analysis-grid">
              <div className="literexia-analysis-column">
                <div className="literexia-analysis-section">
                  <h4><FaCheckCircle /> Strengths</h4>
                  {/* Check for strengths array or analysis string property */}
                  {selectedAnalysis?.strengths && selectedAnalysis.strengths.length > 0 ? (
                    <ul className="literexia-strengths-list">
                      {selectedAnalysis.strengths.map((strength, idx) => (
                        <li key={idx}>{strength}</li>
                      ))}
                    </ul>
                  ) : selectedAnalysis?.analysis ? (
                    <ul className="literexia-strengths-list">
                      <li>{selectedAnalysis.analysis}</li>
                    </ul>
                  ) : (
                    <p className="literexia-empty-info">No specific strengths identified yet.</p>
                  )}
                </div>
              </div>
              
              <div className="literexia-analysis-column">
                <div className="literexia-analysis-section">
                  <h4><FaExclamationTriangle /> Weaknesses</h4>
                  {selectedAnalysis?.weaknesses && selectedAnalysis.weaknesses.length > 0 ? (
                    <ul className="literexia-weaknesses-list">
                      {selectedAnalysis.weaknesses.map((weakness, idx) => (
                        <li key={idx}>{weakness}</li>
                      ))}
                    </ul>
                  ) : (
                    <p className="literexia-empty-info">No specific weaknesses identified yet.</p>
                  )}
                </div>
              </div>
            </div>
            
            {/* Recommendations */}
            <div className="literexia-analysis-section">
              <h4><FaLightbulb /> Recommendations</h4>
              {selectedAnalysis?.recommendations && selectedAnalysis.recommendations.length > 0 ? (
                <ul className="literexia-recommendations-list">
                  {selectedAnalysis.recommendations.map((recommendation, idx) => (
                    <li key={idx}>{recommendation}</li>
                  ))}
                </ul>
              ) : selectedAnalysis?.recommendation ? (
                <ul className="literexia-recommendations-list">
                  <li>{selectedAnalysis.recommendation}</li>
                </ul>
              ) : (
                <p className="literexia-empty-info">No specific recommendations available yet.</p>
              )}
            </div>

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
          </div>
          
          {/* Mathematical Analysis from CLAUDE.md Prescriptive Analytics */}
          {renderMathematicalAnalysis(selectedCategory, selectedAnalysis)}
          
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
                    const correctPercentage = progress ? progress.percentCorrect : 0;
                    const isPassed = progress ? progress.passedThreshold : false;
                    
                    return (
                      <div key={index} className="literexia-intervention-card">
                        <div className="literexia-intervention-header">
                          <div className="literexia-intervention-title-container">
                            <h4 className="literexia-intervention-title">{intervention.name}</h4>
                            <div className="literexia-intervention-subtitle">{intervention.description}</div>
                          </div>
                          <div className={`literexia-intervention-status ${isPassed ? 'passed' : intervention.status}`}>
                            {isPassed ? 'Passed' : intervention.status === 'active' ? 'Active' : 'Draft'}
                          </div>
                        </div>
                        
                        {/* // will be on the category_results need to fix later on  */}
                        <div className="literexia-intervention-progress">
                          <div className="literexia-progress-item">
                            <div className="literexia-progress-label">
                              <span>Completion</span>
                              <span>{progressPercentage}%</span>
                            </div>
                            <div className="literexia-progress-bar-container">
                              <div 
                                className="literexia-progress-bar-fill" 
                                style={{width: `${progressPercentage}%`}}
                              ></div>
                            </div>
                          </div>
                          
                          <div className="literexia-progress-item">
                            <div className="literexia-progress-label">
                              <span>Accuracy</span>
                              <span>{correctPercentage}%</span>
                            </div>
                            <div className="literexia-progress-bar-container">
                              <div 
                                className={`literexia-progress-bar-fill ${correctPercentage >= 75 ? 'achieved' : 'in-progress'}`}
                                style={{width: `${correctPercentage}%`}}
                              ></div>
                            </div>
                          </div>
                        </div>
                        
                        <div className="literexia-intervention-details">
                          <div className="literexia-intervention-detail">
                            <span className="literexia-detail-label">Reading Level:</span>
                            <span className="literexia-detail-value">{intervention.readingLevel}</span>
                          </div>
                          <div className="literexia-intervention-detail">
                            <span className="literexia-detail-label">Questions:</span>
                            <span className="literexia-detail-value">{intervention.questions ? intervention.questions.length : 0}</span>
                          </div>
                          <div className="literexia-intervention-detail">
                            <span className="literexia-detail-label">Status:</span>
                            <span className="literexia-detail-value">{intervention.status}</span>
                          </div>
                          <div className="literexia-intervention-detail">
                            <span className="literexia-detail-label">Created:</span>
                            <span className="literexia-detail-value">
                              {new Date(intervention.createdAt).toLocaleDateString()}
                            </span>
                          </div>
                        </div>
                        
                        <div className="literexia-intervention-actions">
                          <button 
                            className="literexia-edit-activity-btn"
                            onClick={() => handleCreateActivity(selectedCategory, selectedAnalysis, intervention)}
                            disabled={loading || intervention.status === 'active'}
                            title={intervention.status === 'active' ? 
                              "Active interventions cannot be edited after being pushed to mobile" : 
                              "Edit this intervention activity"}
                          >
                            <FaEdit /> Edit Activity
                          </button>
                          {intervention.status === 'draft' ? (
                            <button 
                              className="literexia-push-mobile-btn"
                              onClick={() => handlePushToMobile(intervention)}
                              disabled={loading}
                              title="Push this intervention to the student's mobile device"
                            >
                              {loading && pendingIntervention?._id === intervention._id ? <FaSpinner className="fa-spin" /> : <FaMobile />}
                              Push to Mobile
                            </button>
                          ) : (
                            <div className="literexia-active-status">
                              <FaCheckCircle /> Active on Mobile
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