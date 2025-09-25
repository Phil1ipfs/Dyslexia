import React, { useState, useEffect } from 'react';
import {
  FaCheckCircle,
  FaEdit,
  FaSave,
  FaTimes,
  FaExclamationTriangle,
  FaSpinner,
  FaCheck,
  FaInfoCircle,
  FaBook,
  FaChartLine,
  FaUserGraduate,
  FaCalendarAlt,
  FaFlask,
  FaArrowUp,
  FaArrowDown,
  FaEquals,
  FaEye,
  FaClipboardList,
  FaAward,
  FaExclamationCircle,
  FaSync,
  FaRedoAlt
} from 'react-icons/fa';
import IEPService from '../../../services/Teachers/ManageProgress/IEPService';
import './css/IEPReport.css';

const IEPReport = ({ 
  student,
  onDataUpdate // Callback to notify parent of data changes
}) => {
  // State management
  const [iepData, setIepData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [interventionModal, setInterventionModal] = useState({ isOpen: false, objective: null });
  const [attemptModal, setAttemptModal] = useState({ isOpen: false, objective: null, attempt: null, attemptIndex: null });
  const [assessmentModal, setAssessmentModal] = useState({ isOpen: false, objective: null });
  const [expandedInterventions, setExpandedInterventions] = useState({});
  const [expandedRemarks, setExpandedRemarks] = useState({});
  const [error, setError] = useState(null);
  const [editingRemarks, setEditingRemarks] = useState({}); // Track which remarks are being edited
  const [tempRemarks, setTempRemarks] = useState({}); // Store temporary remarks during editing
  const [editingMainRemarks, setEditingMainRemarks] = useState({}); // Track which main assessment remarks are being edited
  const [tempMainRemarks, setTempMainRemarks] = useState({}); // Store temporary main assessment remarks during editing
  const [successMessage, setSuccessMessage] = useState('');

  // Load IEP data when component mounts or student changes
  useEffect(() => {
    if (student?.id || student?._id) {
      loadIEPData();
    }
  }, [student]);

  // Load IEP report data from backend
  const loadIEPData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const studentId = student?.id || student?._id;
      console.log('Loading IEP data for student:', studentId);
      
      const response = await IEPService.getIEPReport(studentId);
      
      if (response.success && response.data) {
        setIepData(response.data);
        console.log('IEP data loaded:', response.data);
        
        // Notify parent component of successful load
        if (onDataUpdate) {
          onDataUpdate(response.data);
        }
      } else {
        throw new Error('No IEP data available');
      }
      
    } catch (err) {
      console.error('Error loading IEP data:', err);
      setError(err.message || 'Failed to load IEP report');
    } finally {
      setLoading(false);
    }
  };

  // Refresh intervention data
  const refreshInterventionData = async () => {
    try {
      setRefreshing(true);
      setError(null);
      
      const studentId = student?.id || student?._id;
      console.log('Refreshing intervention data for student:', studentId);
      
      const response = await IEPService.refreshInterventionData(studentId);
      
      if (response.success && response.data) {
        setIepData(response.data);
        console.log('Intervention data refreshed:', response.data);
        
        // Notify parent component of successful refresh
        if (onDataUpdate) {
          onDataUpdate(response.data);
        }
        
        showSuccessMessage('Intervention data updated successfully');
      } else {
        throw new Error('Failed to refresh intervention data');
      }
      
    } catch (err) {
      console.error('Error refreshing intervention data:', err);
      setError(err.message || 'Failed to refresh intervention data');
    } finally {
      setRefreshing(false);
    }
  };

  // Toggle intervention details visibility
  const toggleInterventionDetails = (objectiveId) => {
    setExpandedInterventions(prev => ({
      ...prev,
      [objectiveId]: !prev[objectiveId]
    }));
  };

  // Open intervention modal
  const openInterventionModal = (objective) => {
    setInterventionModal({ isOpen: true, objective });
  };

  // Close intervention modal
  const closeInterventionModal = () => {
    setInterventionModal({ isOpen: false, objective: null });
  };

  // Open individual attempt modal
  const openAttemptModal = (objective, attempt, attemptIndex) => {
    setAttemptModal({ isOpen: true, objective, attempt, attemptIndex });
  };

  // Close attempt modal
  const closeAttemptModal = () => {
    setAttemptModal({ isOpen: false, objective: null, attempt: null, attemptIndex: null });
  };

  // Open assessment modal
  const openAssessmentModal = (objective) => {
    setAssessmentModal({ isOpen: true, objective });
  };

  // Close assessment modal
  const closeAssessmentModal = () => {
    setAssessmentModal({ isOpen: false, objective: null });
  };

  // Toggle remarks expansion
  const toggleRemarksExpansion = (objectiveId) => {
    setExpandedRemarks(prev => ({
      ...prev,
      [objectiveId]: !prev[objectiveId]
    }));
  };

  // Handle support level change (checkbox clicks)
  const handleSupportLevelChange = async (objectiveId, newSupportLevel) => {
    try {
      setSaving(true);
      
      const studentId = student?.id || student?._id;
      console.log('Updating support level:', { objectiveId, newSupportLevel });
      
      // If clicking the currently selected level, deselect it (make it optional)
      const currentLevel = iepData.objectives.find(obj => obj._id === objectiveId)?.supportLevel;
      const updatedLevel = currentLevel === newSupportLevel ? null : newSupportLevel;
      
      await IEPService.updateSupportLevel(studentId, objectiveId, updatedLevel);
      
      // Update local state
      setIepData(prevData => ({
        ...prevData,
        objectives: prevData.objectives.map(obj => 
          obj._id === objectiveId 
            ? { ...obj, supportLevel: updatedLevel, lastUpdated: new Date() }
            : obj
        )
      }));
      
      showSuccessMessage('Support level updated successfully');
      
    } catch (err) {
      console.error('Error updating support level:', err);
      setError(err.message || 'Failed to update support level');
    } finally {
      setSaving(false);
    }
  };

  // Start editing remarks for an objective
  const startEditingRemarks = (objectiveId, currentRemarks) => {
    setEditingRemarks(prev => ({ ...prev, [objectiveId]: true }));
    setTempRemarks(prev => ({ ...prev, [objectiveId]: currentRemarks || '' }));
  };

  // Cancel editing remarks
  const cancelEditingRemarks = (objectiveId) => {
    setEditingRemarks(prev => ({ ...prev, [objectiveId]: false }));
    setTempRemarks(prev => {
      const newTemp = { ...prev };
      delete newTemp[objectiveId];
      return newTemp;
    });
  };

  // Save remarks for an objective
  const saveRemarks = async (objectiveId) => {
    try {
      setSaving(true);
      
      const studentId = student?.id || student?._id;
      const newRemarks = tempRemarks[objectiveId] || '';
      
      console.log('Saving remarks:', { objectiveId, newRemarks });
      
      await IEPService.updateRemarks(studentId, objectiveId, newRemarks);
      
      // Update local state
      setIepData(prevData => ({
        ...prevData,
        objectives: prevData.objectives.map(obj => 
          obj._id === objectiveId 
            ? { ...obj, remarks: newRemarks, lastUpdated: new Date() }
            : obj
        )
      }));
      
      // Clear editing state
      setEditingRemarks(prev => ({ ...prev, [objectiveId]: false }));
      setTempRemarks(prev => {
        const newTemp = { ...prev };
        delete newTemp[objectiveId];
        return newTemp;
      });
      
      showSuccessMessage('Remarks updated successfully');
      
    } catch (err) {
      console.error('Error saving remarks:', err);
      setError(err.message || 'Failed to save remarks');
    } finally {
      setSaving(false);
    }
  };

  // Handle remarks text change
  const handleRemarksChange = (objectiveId, newRemarks) => {
    setTempRemarks(prev => ({ ...prev, [objectiveId]: newRemarks }));
  };

  // Start editing main assessment remarks for an objective
  const startEditingMainRemarks = (objectiveId, currentMainRemarks) => {
    setEditingMainRemarks(prev => ({ ...prev, [objectiveId]: true }));
    setTempMainRemarks(prev => ({ ...prev, [objectiveId]: currentMainRemarks || '' }));
  };

  // Cancel editing main assessment remarks
  const cancelEditingMainRemarks = (objectiveId) => {
    setEditingMainRemarks(prev => ({ ...prev, [objectiveId]: false }));
    setTempMainRemarks(prev => {
      const newTemp = { ...prev };
      delete newTemp[objectiveId];
      return newTemp;
    });
  };

  // Save main assessment remarks for an objective
  const saveMainRemarks = async (objectiveId) => {
    try {
      setSaving(true);

      const studentId = student?.id || student?._id;
      const newMainRemarks = assessmentModal.objective?.mainAssessmentRemarks || '';

      console.log('Saving main assessment remarks:', { objectiveId, newMainRemarks });

      await IEPService.updateMainAssessmentRemark(studentId, objectiveId, newMainRemarks);

      // Update local state
      setIepData(prevData => ({
        ...prevData,
        objectives: prevData.objectives.map(obj =>
          obj._id === objectiveId
            ? { ...obj, mainAssessmentRemarks: newMainRemarks, lastUpdated: new Date() }
            : obj
        )
      }));

      // Close modal
      closeAssessmentModal();

      showSuccessMessage('Main assessment remarks updated successfully');

    } catch (err) {
      console.error('Error saving main assessment remarks:', err);
      setError(err.message || 'Failed to save main assessment remarks');
    } finally {
      setSaving(false);
    }
  };

  // Handle main assessment remarks text change
  const handleMainRemarksChange = (objectiveId, newMainRemarks) => {
    setTempMainRemarks(prev => ({ ...prev, [objectiveId]: newMainRemarks }));
  };

  // Save individual attempt remark
  const saveAttemptRemark = async (objectiveId, attemptIndex, remark) => {
    try {
      setSaving(true);
      
      const studentId = student?.id || student?._id;
      
      console.log('Saving attempt remark:', { objectiveId, attemptIndex, remark });
      
      // Save to backend first
      await IEPService.updateAttemptRemark(studentId, objectiveId, attemptIndex, remark);

      // Update local state after successful backend save
      setIepData(prevData => ({
        ...prevData,
        objectives: prevData.objectives.map(obj => {
          if (obj._id === objectiveId) {
            const updatedHistory = [...obj.interventionHistory];
            updatedHistory[attemptIndex] = { ...updatedHistory[attemptIndex], teacherRemarks: remark };
            return { ...obj, interventionHistory: updatedHistory, lastUpdated: new Date() };
          }
          return obj;
        })
      }));
      
      showSuccessMessage('Remark saved successfully!');
      closeAttemptModal();
      
    } catch (error) {
      console.error('Error saving attempt remark:', error);
      setError('Failed to save remark. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  // Show success message temporarily
  const showSuccessMessage = (message) => {
    setSuccessMessage(message);
    setTimeout(() => setSuccessMessage(''), 3000);
  };

  // Render support level checkbox
  const renderSupportCheckbox = (objective, level) => {
    const isSelected = objective.supportLevel === level;
    const isDisabled = saving;
    
    return (
      <div
        className={`literexia-support-checkbox ${isSelected ? 'selected' : ''} ${isDisabled ? 'disabled' : ''}`}
        onClick={() => !isDisabled && handleSupportLevelChange(objective._id, level)}
        title={`Set support level to ${level}`}
      >
        {isSelected && <FaCheck />}
      </div>
    );
  };

  // Render comprehensive intervention status with history
  const renderInterventionStatus = (objective) => {
    if (!objective.hasIntervention) {
      const statusClass = objective.isPassed ? 'no-intervention-passed' : 'intervention-required';
      return (
        <div className={`literexia-intervention-status ${statusClass}`}>
          <div className="literexia-no-intervention">
            {objective.isPassed ? (
              <>
                <FaAward className="literexia-success-icon" />
                <span>No intervention needed</span>
              </>
            ) : (
              <>
                <FaExclamationCircle className="literexia-warning-icon" />
                <span>Intervention required</span>
              </>
            )}
          </div>
        </div>
      );
    }

    const isExpanded = expandedInterventions[objective._id];
    const latestScore = objective.latestInterventionScore || 0;
    const improvementIcon = objective.interventionImprovement > 0 ? FaArrowUp :
                           objective.interventionImprovement < 0 ? FaArrowDown : FaEquals;
    const improvementClass = objective.interventionImprovement > 0 ? 'positive' :
                            objective.interventionImprovement < 0 ? 'negative' : 'neutral';

    return (
      <div className="literexia-intervention-status has-intervention">
        <div className="literexia-intervention-summary">
          <div className="literexia-intervention-header" onClick={() => toggleInterventionDetails(objective._id)}>
            <div className="literexia-intervention-main">
              <FaFlask className="literexia-intervention-icon" />
              <div className="literexia-intervention-basic">
                <div className="literexia-attempts-info">
                  <span className="literexia-attempts-count">
                    {objective.interventionAttempts || 0} attempt{(objective.interventionAttempts || 0) !== 1 ? 's' : ''}
                  </span>
                  <span className={`literexia-latest-score ${objective.latestInterventionPassed ? 'passed' : 'failed'}`}>
                    Latest: {latestScore}%
                  </span>
                </div>
                {objective.interventionImprovement !== undefined && (
                  <div className={`literexia-improvement ${improvementClass}`}>
                    {React.createElement(improvementIcon)}
                    <span>{objective.interventionImprovement > 0 ? '+' : ''}{objective.interventionImprovement}%</span>
                  </div>
                )}
              </div>
            </div>
            <FaEye className={`literexia-expand-icon ${isExpanded ? 'expanded' : ''}`} />
          </div>

          {isExpanded && objective.interventionHistory && objective.interventionHistory.length > 0 && (
            <div className="literexia-intervention-history">
              <div className="literexia-history-header">
                <FaClipboardList />
                <span>Intervention History</span>
              </div>
              <div className="literexia-history-list">
                {objective.interventionHistory.map((attempt, index) => {
                  // Calculate improvement from previous attempt
                  let improvementFromPrevious = 0;
                  if (index > 0) {
                    const previousScore = objective.interventionHistory[index - 1].score || 0;
                    improvementFromPrevious = (attempt.score || 0) - previousScore;
                  } else {
                    // First attempt - compare to assessment
                    improvementFromPrevious = (attempt.score || 0) - (objective.assessmentScore || 0);
                  }

                  return (
                  <div key={index} className={`literexia-history-item ${attempt.isPassed ? 'passed' : 'failed'}`}>
                    <div className="literexia-attempt-number">
                      #{attempt.attemptNumber || (index + 1)}
                        {attempt.revisionNumber && attempt.revisionNumber > 1 && (
                          <small className="literexia-revision-info">v{attempt.revisionNumber}</small>
                        )}
                    </div>
                    <div className="literexia-attempt-details">
                      <div className="literexia-attempt-score">
                        <strong>{attempt.score || 0}%</strong>
                        <span className={`literexia-attempt-result ${attempt.isPassed ? 'passed' : 'failed'}`}>
                          {attempt.isPassed ? 'PASSED' : 'FAILED'}
                        </span>

                          {/* Show improvement from previous */}
                          {improvementFromPrevious !== 0 && (
                            <span className={`literexia-score-change ${improvementFromPrevious > 0 ? 'positive' : 'negative'}`}>
                              ({improvementFromPrevious > 0 ? '+' : ''}{improvementFromPrevious}%)
                            </span>
                          )}
                      </div>

                        <div className="literexia-attempt-meta">
                      {attempt.attemptedAt && (
                        <div className="literexia-attempt-date">
                              <FaCalendarAlt className="literexia-date-icon" />
                          {formatDate(attempt.attemptedAt)}
                        </div>
                      )}

                      {attempt.reason && attempt.reason !== 'intervention_attempt' && (
                        <div className="literexia-attempt-reason">
                              <FaInfoCircle className="literexia-reason-icon" />
                              {attempt.reason === 'teacher_revision' ? 'After Teacher Revision' :
                               attempt.reason === 'student_retake' ? 'Student Retake' :
                               attempt.reason === 'initial_attempt' ? 'Initial Attempt' :
                               attempt.reason.replace(/_/g, ' ')}
                        </div>
                      )}
                    </div>
                  </div>

                      {/* Progress indicator for this attempt */}
                      {index === objective.interventionHistory.length - 1 && (
                        <div className="literexia-latest-indicator">
                          <FaAward className="literexia-latest-icon" />
                          <small>Latest</small>
              </div>
                      )}
                    </div>
                  );
                })}

                {/* Summary of intervention journey */}
                {objective.interventionHistory.length > 1 && (
                  <div className="literexia-intervention-summary">
                    <div className="literexia-journey-stats">
                      <div className="literexia-stat-item">
                        <FaChartLine className="literexia-stat-icon" />
                        <span>Total Attempts: {objective.interventionAttempts || objective.interventionHistory.length}</span>
                      </div>

                      {objective.interventionImprovement !== 0 && (
                        <div className="literexia-stat-item">
                          {objective.interventionImprovement > 0 ? <FaArrowUp className="literexia-stat-icon positive" /> : <FaArrowDown className="literexia-stat-icon negative" />}
                          <span>Overall Progress: {objective.interventionImprovement > 0 ? '+' : ''}{objective.interventionImprovement}%</span>
            </div>
          )}

                      <div className="literexia-stat-item">
                        {objective.latestInterventionPassed ? <FaCheck className="literexia-stat-icon passed" /> : <FaTimes className="literexia-stat-icon failed" />}
                        <span>Status: {objective.latestInterventionPassed ? 'Successfully Completed' : 'Needs Further Support'}</span>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    );
  };

  // Render main assessment remarks cell as simple clickable area
  const renderMainAssessmentRemarksCell = (objective) => {
    const currentMainRemarks = objective.mainAssessmentRemarks;
    const hasRemarks = currentMainRemarks && currentMainRemarks.trim().length > 0;

    return (
      <div
        className="teacher-remarks-assessment-button"
        onClick={() => openAssessmentModal(objective)}
        title="Click to edit post assessment remarks"
      >
        <div className="teacher-remarks-assessment-content">
          <div className="teacher-remarks-assessment-text">
            {hasRemarks ? (
              <span className="teacher-remarks-content">
                {currentMainRemarks}
              </span>
            ) : (
              <span className="teacher-remarks-placeholder">
                Click to add post assessment remarks
              </span>
            )}
          </div>
          <div className="teacher-remarks-assessment-indicator">
            {hasRemarks ? (
              <FaCheck className="teacher-remarks-check" />
            ) : (
              <FaEdit className="teacher-remarks-edit" />
            )}
          </div>
        </div>
      </div>
    );
  };

  // Render remarks cell with edit functionality
  const renderRemarksCell = (objective) => {
    const isEditing = editingRemarks[objective._id];
    const currentRemarks = isEditing ? tempRemarks[objective._id] : objective.remarks;
    
    if (isEditing) {
      return (
        <div className="literexia-remarks-editor">
          <textarea
            value={currentRemarks || ''}
            onChange={(e) => handleRemarksChange(objective._id, e.target.value)}
            placeholder="Add your remarks about the student's progress..."
            disabled={saving}
            rows={3}
          />
          <div className="literexia-remarks-actions">
            <button 
              className="literexia-save-button"
              onClick={() => saveRemarks(objective._id)}
              disabled={saving}
              title="Save remarks"
            >
              {saving ? <FaSpinner className="spinning" /> : <FaSave />}
              Save
            </button>
            <button 
              className="literexia-cancel-button"
              onClick={() => cancelEditingRemarks(objective._id)}
              disabled={saving}
              title="Cancel editing"
            >
              <FaTimes />
              Cancel
            </button>
          </div>
        </div>
      );
    }
    
    return (
      <div className="literexia-remarks-display">
        <p className="literexia-remarks-text">
          {currentRemarks || 'Click to add remarks'}
        </p>
        <button 
          className="literexia-edit-button"
          onClick={() => startEditingRemarks(objective._id, currentRemarks)}
          disabled={saving}
          title="Edit remarks"
        >
          <FaEdit />
        </button>
      </div>
    );
  };

  // Render loading state
  if (loading) {
    return (
      <div className="literexia-iep-loading">
        <FaSpinner className="spinning" />
        <p>Loading IEP report...</p>
      </div>
    );
  }

  // Render error state
  if (error && !iepData) {
    return (
      <div className="literexia-iep-error">
        <FaExclamationTriangle />
        <h3>Unable to Load IEP Report</h3>
        <p>{error}</p>
        <button className="literexia-retry-button" onClick={loadIEPData}>
          <FaSync /> Retry
        </button>
      </div>
    );
  }

  // Render empty state
  if (!iepData || !iepData.objectives || iepData.objectives.length === 0) {
    return (
      <div className="literexia-empty-state">
        <FaInfoCircle />
        <h3>No IEP Report Available</h3>
        <p>There is no IEP report available for this student yet. Complete an assessment first.</p>
      </div>
    );
  }

  // Format date for display
  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  // Convert lesson name to category name (remove "Mastering" prefix)
  const getCategoryName = (lessonName) => {
    if (!lessonName) return '';
    return lessonName.replace(/^Mastering\s+/i, '');
  };

  // Get student name
  const getStudentName = () => {
    if (iepData.studentId?.firstName && iepData.studentId?.lastName) {
      return `${iepData.studentId.firstName} ${iepData.studentId.lastName}`;
    } else if (student?.firstName && student?.lastName) {
      return `${student.firstName} ${student.lastName}`;
    } else if (student?.name) {
      return student.name;
    } else {
      return 'Student';
    }
  };

  return (
    <div className="literexia-iep-container">
      {/* Success message */}
      {successMessage && (
        <div className="literexia-success-alert">
          <FaCheckCircle />
          {successMessage}
        </div>
      )}
      
      {/* Error message */}
      {error && (
        <div className="literexia-error-alert">
          <FaExclamationTriangle />
          {error}
          <button onClick={() => setError(null)}>×</button>
        </div>
      )}
      
      {/* Header section */}
        <div className="literexia-iep-header">
        <div className="literexia-header-icon">
          <FaInfoCircle />
        </div>
        <div className="literexia-head-content">
          <h3>Individualized Education Progress Report</h3>
            <p>
              This report shows {getStudentName()}'s current progress and support needs across key reading skill categories.
              Teachers can update support levels and add remarks to track progress over time.
            </p>
        </div>
      </div>
      
      {/* Student summary section */}
      <div className="literexia-iep-summary">
        <div className="literexia-summary-item">
          <div className="literexia-summary-icon">
            <FaUserGraduate />
          </div>
          <div className="literexia-summary-content">
            <span className="literexia-summary-label">Student</span>
            <span className="literexia-summary-value">{getStudentName()}</span>
          </div>
        </div>
        
        <div className="literexia-summary-item">
          <div className="literexia-summary-icon">
            <FaBook />
          </div>
          <div className="literexia-summary-content">
            <span className="literexia-summary-label">Reading Level</span>
            <span className="literexia-summary-value">{iepData.readingLevel || 'Not Assessed'}</span>
          </div>
        </div>
        
        <div className="literexia-summary-item">
          <div className="literexia-summary-icon">
            <FaChartLine />
          </div>
          <div className="literexia-summary-content">
            <span className="literexia-summary-label">Overall Score</span>
            <span className="literexia-summary-value">{iepData.overallScore || 0}%</span>
          </div>
        </div>
        
        <div className="literexia-summary-item">
          <div className="literexia-summary-icon">
            <FaCalendarAlt />
          </div>
          <div className="literexia-summary-content">
            <span className="literexia-summary-label">Last Updated</span>
            <span className="literexia-summary-value">{formatDate(iepData.updatedAt)}</span>
          </div>
        </div>
      </div>
      
      {/* Table section */}
      <div className="literexia-iep-table-container">
        <div className="literexia-iep-table-header">
          <h3>
            <span className="literexia-iep-table-icon">
              <FaBook />
            </span>
            Reading Skills Progress
          </h3>
          
          <button 
            className="literexia-refresh-button"
            onClick={refreshInterventionData}
            disabled={refreshing}
          >
            {refreshing ? <FaSpinner className="spinning" /> : <FaRedoAlt />}
            Refresh Interventions
          </button>
          <div className="literexia-table-info">
            <span>Click intervention details to view attempt history</span>
          </div>
        </div>
        
        <div className="literexia-table-responsive">
        <table className="literexia-iep-table">
          <thead>
            <tr>
              <th>Category</th>
                <th className="literexia-score-cell">Score</th>
                <th colSpan={3} className="text-center">Support Level Needed</th>
                <th>Intervention</th>
                <th>Teacher Remarks</th>
            </tr>
            <tr className="literexia-support-level-header">
              <th></th>
              <th></th>
                <th>
                  <div className="literexia-vertical-text">
                    <span>MI</span>
                    <span>NIMAL</span>
                  </div>
                </th>
                <th>
                  <div className="literexia-vertical-text">
                    <span>MO</span>
                    <span>DERATE</span>
                  </div>
                </th>
                <th>
                  <div className="literexia-vertical-text">
                    <span>EX</span>
                    <span>TENSIVE</span>
                  </div>
                </th>
              <th></th>
              <th></th>
            </tr>
          </thead>
          <tbody>
              {iepData.objectives.map((objective) => {
              return (
                <React.Fragment key={objective._id}>
                  {/* Main row - always visible */}
                  <tr className="literexia-objective-row">
                  <td className="literexia-lesson-cell">
                    <div className="literexia-lesson-content">
                      <div className="literexia-lesson-info">
                      <strong>{getCategoryName(objective.lesson)}</strong>
                      {objective.lastUpdated && (
                        <span className="literexia-last-updated">
                          Updated: {formatDate(objective.lastUpdated)}
                        </span>
                      )}
                    </div>
                    </div>
                </td>
                  <td className="literexia-score-cell">
                    <div className="literexia-score-display">
                      <div className="literexia-score-main">
                        <div className="literexia-primary-score">
                          <span className="literexia-score-number">
                          {objective.assessmentScore || objective.score || 0}%
                        </span>
                          <span className="literexia-score-label">Assessment</span>
                      </div>
                      {objective.hasIntervention && objective.latestInterventionScore && (
                        <div className="literexia-intervention-score">
                            <span className="literexia-score-number">
                            {objective.latestInterventionScore}%
                          </span>
                            <span className="literexia-score-label">Intervention</span>
                        </div>
                      )}
                      </div>
                      <div className={`literexia-status-indicator ${(objective.isPassed || objective.latestInterventionPassed) ? 'passed' : 'needs-work'}`}>
                          {(objective.isPassed || objective.latestInterventionPassed) ? 'Passed' : 'Needs Work'}
                      </div>

                  </div>
                </td>
                <td className="literexia-support-cell">
                    {renderSupportCheckbox(objective, 'minimal')}
                  </td>
                  <td className="literexia-support-cell">
                    {renderSupportCheckbox(objective, 'moderate')}
                </td>
                <td className="literexia-support-cell">
                    {renderSupportCheckbox(objective, 'extensive')}
                  </td>
                  <td className="literexia-intervention-cell">
                      <div className="literexia-intervention-display">
                        {/* Compact view - always visible */}
                        <div className="literexia-intervention-compact">
                          {!objective.hasIntervention ? (
                            <div className="literexia-no-intervention-status">
                              {objective.isPassed ? (
                                <>
                                  <FaAward className="literexia-success-icon" />
                                  <span>No intervention needed</span>
                                </>
                              ) : (
                                <>
                                  <FaExclamationCircle className="literexia-warning-icon" />
                                  <span>Intervention required</span>
                                </>
                              )}
                            </div>
                          ) : (
                            <div 
                              className="iep-intervention-card"
                              onClick={() => openInterventionModal(objective)}
                              title="Click to view detailed intervention information"
                            >
                              <div className="iep-intervention-header">
                                <div className="iep-intervention-icon-wrapper">
                                  <FaFlask />
                                </div>
                                <div className="iep-intervention-info">
                                  <div className="iep-intervention-stats">
                                    <div className="iep-attempts-badge">
                                      {objective.interventionAttempts || 0} attempts
                                    </div>
                                    <div className="iep-score-badge">
                                      Latest: {objective.latestInterventionScore || 0}%
                                    </div>
                                    {objective.interventionImprovement !== undefined && objective.interventionImprovement !== 0 && (
                                      <div className={`iep-improvement-indicator ${objective.interventionImprovement > 0 ? 'positive' : 'negative'}`}>
                                        <span className="iep-improvement-icon">{objective.interventionImprovement > 0 ? '+' : ''}</span>
                                        {objective.interventionImprovement}%
                                      </div>
                                    )}
                                  </div>
                                </div>
                                <div className="iep-expand-toggle">
                                  <FaEye className="iep-expand-icon" />
                                </div>
                              </div>
                            </div>
                          )}
                        </div>

                      </div>
                </td>
                <td className="literexia-remarks-cell">
                       <div className="literexia-remarks-container">
                         {/* Unified Remarks Section */}
                         <div className="teacher-remarks-unified-section">
                           <div className="teacher-remarks-section-header">
                             <FaEdit className="teacher-remarks-section-icon" />
                             <span className="teacher-remarks-section-title">Teacher Remarks</span>
                           </div>
                           
                           {/* Main Assessment Remarks */}
                           <div className="teacher-remarks-main-area">
                             <div className="teacher-remarks-subheader">
                               <FaBook className="teacher-remarks-subheader-icon" />
                               <span className="teacher-remarks-subheader-title">Post Assessment</span>
                             </div>
                             {renderMainAssessmentRemarksCell(objective)}
                           </div>

                           {/* Intervention Remarks */}
                           {objective.interventionHistory && objective.interventionHistory.length > 0 ? (
                             <div className="teacher-remarks-intervention-area">
                               <div className="teacher-remarks-subheader">
                                 <FaFlask className="teacher-remarks-subheader-icon" />
                                 <span className="teacher-remarks-subheader-title">Intervention Attempts</span>
                               </div>
                               <div className="literexia-attempts-container">
                                 {/* Summary View - Always Visible */}
                                 <div className="literexia-attempts-summary">
                                   <div className="literexia-summary-header">
                                     <span className="literexia-summary-title">Add Remarks</span>
                                     <button
                                       className="literexia-expand-button"
                                       onClick={() => toggleRemarksExpansion(objective._id)}
                                       title={expandedRemarks[objective._id] ? "Collapse attempts" : "Show all attempts"}
                                     >
                                       <span className="literexia-summary-count">
                                         {objective.interventionHistory.length} attempt{objective.interventionHistory.length !== 1 ? 's' : ''}
                                       </span>
                                       <FaEye className={`literexia-expand-icon ${expandedRemarks[objective._id] ? 'expanded' : ''}`} />
                                     </button>
                                   </div>
                                 </div>

                                 {/* Expanded View - Only when expanded */}
                                 {expandedRemarks[objective._id] && (
                                   <div className="literexia-attempts-expanded">
                                     <div className="literexia-attempts-header">
                                       <span className="literexia-attempts-title">All Attempts</span>
                                     </div>
                                     <div className="literexia-attempt-buttons">
                                       {objective.interventionHistory.map((attempt, index) => (
                                         <button
                                           key={attempt._id || index}
                                           className={`literexia-attempt-button ${attempt.teacherRemarks ? 'has-remarks' : 'no-remarks'}`}
                                           onClick={() => openAttemptModal(objective, attempt, index)}
                                           title={`Edit remark for attempt #${attempt.attemptNumber || (index + 1)}`}
                                         >
                                           <div className="literexia-attempt-button-content">
                                             <span className="literexia-attempt-text">
                                               Attempt {attempt.attemptNumber || (index + 1)} - Edit Remark
                                             </span>
                                             {attempt.teacherRemarks && (
                                               <FaCheck className="literexia-remarks-indicator" />
                                             )}
                                           </div>
                                         </button>
                                       ))}
                                     </div>
                                   </div>
                                 )}
                               </div>
                             </div>
                           ) : (
                             <div className="teacher-remarks-intervention-area">
                               <div className="teacher-remarks-subheader">
                                 <FaFlask className="teacher-remarks-subheader-icon" />
                                 <span className="teacher-remarks-subheader-title">Intervention Attempts</span>
                               </div>
                               <div className="literexia-no-attempts-simple">
                                 <span className="literexia-remarks-placeholder">No intervention attempts</span>
                               </div>
                             </div>
                           )}
                         </div>
                       </div>
                </td>
              </tr>
                </React.Fragment>
              );
            })}
          </tbody>
        </table>
      </div>
      </div>
      
      {/* Saving overlay */}
      {saving && (
        <div className="literexia-saving-overlay">
          <FaSpinner className="spinning" />
        </div>
      )}

      {/* Intervention Details Modal */}
      {interventionModal.isOpen && interventionModal.objective && (
        <div className="literexia-modal-overlay" onClick={closeInterventionModal}>
          <div className="literexia-intervention-modal" onClick={(e) => e.stopPropagation()}>
            <div className="literexia-modal-header">
              <div className="literexia-modal-title">
                <FaFlask className="literexia-modal-icon" />
                <div>
                  <h3>Intervention Details</h3>
                  <p>{getCategoryName(interventionModal.objective.lesson)}</p>
                </div>
              </div>
              <button className="literexia-modal-close" onClick={closeInterventionModal}>
                <FaTimes />
              </button>
            </div>

            <div className="literexia-modal-content">
              <div className="literexia-intervention-summary-modal">
                <div className="literexia-intervention-stats-modal">
                  <div className="literexia-stat-item-modal">
                    <span className="literexia-stat-label-modal">Total Attempts</span>
                    <span className="literexia-stat-value-modal">{interventionModal.objective.interventionAttempts || 0}</span>
                  </div>
                  <div className="literexia-stat-item-modal">
                    <span className="literexia-stat-label-modal">Latest Score</span>
                    <span className="literexia-stat-value-modal">{interventionModal.objective.latestInterventionScore || 0}%</span>
                  </div>
                  {interventionModal.objective.interventionImprovement !== undefined && interventionModal.objective.interventionImprovement !== 0 && (
                    <div className="literexia-stat-item-modal">
                      <span className="literexia-stat-label-modal">Improvement</span>
                      <span className={`literexia-stat-value-modal ${interventionModal.objective.interventionImprovement > 0 ? 'positive' : 'negative'}`}>
                        {interventionModal.objective.interventionImprovement > 0 ? '+' : ''}{interventionModal.objective.interventionImprovement}%
                      </span>
                    </div>
                  )}
                </div>
              </div>

              {interventionModal.objective.interventionHistory && interventionModal.objective.interventionHistory.length > 0 && (
                <div className="literexia-intervention-history-modal">
                  <div className="literexia-history-header-modal">
                    <FaClipboardList className="literexia-history-icon-modal" />
                    <h4>Intervention History</h4>
                  </div>
                  <div className="literexia-history-timeline-modal">
                    {interventionModal.objective.interventionHistory.map((attempt, index) => (
                      <div key={index} className={`literexia-history-item-modal ${attempt.isPassed ? 'passed' : 'failed'}`}>
                        <div className="literexia-history-indicator-modal">
                          <div className="literexia-history-dot-modal"></div>
                          {index < interventionModal.objective.interventionHistory.length - 1 && <div className="literexia-history-line-modal"></div>}
                        </div>
                        <div className="literexia-history-content-modal">
                          <div className="literexia-history-header-item-modal">
                            <span className="literexia-attempt-number-modal">Attempt #{attempt.attemptNumber || (index + 1)}</span>
                            <span className={`literexia-attempt-result-modal ${attempt.isPassed ? 'passed' : 'failed'}`}>
                              {attempt.isPassed ? 'PASSED' : 'FAILED'}
                            </span>
                          </div>
                          <div className="literexia-history-score-modal">
                            <strong>{attempt.score || 0}%</strong>
                          </div>
                          {attempt.attemptedAt && (
                            <div className="literexia-history-date-modal">
                              {formatDate(attempt.attemptedAt)}
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
      )}

      {/* Individual Attempt Remark Modal */}
      {attemptModal.isOpen && attemptModal.objective && attemptModal.attempt && (
        <div className="literexia-modal-overlay" onClick={closeAttemptModal}>
          <div className="literexia-attempt-modal" onClick={(e) => e.stopPropagation()}>
            <div className="literexia-modal-header">
              <div className="literexia-modal-title">
                <FaEdit className="literexia-modal-icon" />
                <div>
                  <h3>Edit Remark</h3>
                  <p>{getCategoryName(attemptModal.objective.lesson)} - Attempt {attemptModal.attempt.attemptNumber || (attemptModal.attemptIndex + 1)}</p>
                </div>
              </div>
              <button className="literexia-modal-close" onClick={closeAttemptModal}>
                <FaTimes />
              </button>
            </div>

            <div className="literexia-modal-content">
              <div className="literexia-attempt-info-card">
                <div className="literexia-attempt-details-header">
                  <h4>Attempt Details</h4>
                </div>
                <div className="literexia-attempt-details-grid">
                  <div className="literexia-detail-item">
                    <span className="literexia-detail-label">Score:</span>
                    <span className={`literexia-detail-value ${attemptModal.attempt.isPassed ? 'passed' : 'failed'}`}>
                      {attemptModal.attempt.score}%
                    </span>
                  </div>
                  <div className="literexia-detail-item">
                    <span className="literexia-detail-label">Status:</span>
                    <span className={`literexia-detail-value ${attemptModal.attempt.isPassed ? 'passed' : 'failed'}`}>
                      {attemptModal.attempt.isPassed ? 'PASSED' : 'FAILED'}
                    </span>
                  </div>
                  <div className="literexia-detail-item">
                    <span className="literexia-detail-label">Date:</span>
                    <span className="literexia-detail-value">
                      {attemptModal.attempt.attemptedAt ? formatDate(attemptModal.attempt.attemptedAt) : 'N/A'}
                    </span>
                  </div>
                </div>
              </div>

              <div className="literexia-remark-editor-simple">
                <div className="literexia-remark-header">
                  <h4>Your Remark</h4>
                  <p>Write your observations and feedback for this attempt.</p>
                </div>
                
                <div className="literexia-remark-textarea-container">
                  <textarea
                    className="literexia-remark-textarea"
                    placeholder="Enter your remark here... (e.g., 'Student showed improvement in letter recognition but still needs practice with vowel sounds.')"
                    value={attemptModal.attempt.teacherRemarks || ''}
                    onChange={(e) => {
                      const updatedAttempt = { ...attemptModal.attempt, teacherRemarks: e.target.value };
                      setAttemptModal({ ...attemptModal, attempt: updatedAttempt });
                    }}
                    rows={6}
                    maxLength={500}
                  />
                  <div className="literexia-remark-counter">
                    {(attemptModal.attempt.teacherRemarks || '').length}/500 characters
                  </div>
                </div>
              </div>

              <div className="literexia-attempt-actions">
                <button 
                  className="literexia-btn-secondary"
                  onClick={closeAttemptModal}
                  disabled={saving}
                >
                  Cancel
                </button>
                <button 
                  className="literexia-btn-primary"
                  onClick={() => saveAttemptRemark(
                    attemptModal.objective._id, 
                    attemptModal.attemptIndex, 
                    attemptModal.attempt.teacherRemarks || ''
                  )}
                  disabled={saving}
                >
                  {saving ? <FaSpinner className="spinning" /> : <FaSave />}
                  {saving ? 'Saving...' : 'Save Remark'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Post Assessment Modal */}
      {assessmentModal.isOpen && assessmentModal.objective && (
        <div className="literexia-modal-overlay" onClick={closeAssessmentModal}>
          <div className="literexia-modal" onClick={(e) => e.stopPropagation()}>
            <div className="literexia-modal-header">
              <div className="literexia-modal-title">
                <FaBook className="literexia-modal-icon" />
                <div>
                  <h3>Post Assessment Remarks</h3>
                  <p>{getCategoryName(assessmentModal.objective.lesson)}</p>
                </div>
              </div>
              <button className="literexia-modal-close" onClick={closeAssessmentModal}>
                <FaTimes />
              </button>
            </div>

            <div className="literexia-modal-content">
              <div className="literexia-remark-editor">
                <label htmlFor="assessment-remark">Add your remarks about the student's post assessment:</label>
                <textarea
                  id="assessment-remark"
                  value={assessmentModal.objective.mainAssessmentRemarks || ''}
                  onChange={(e) => {
                    const updatedObjective = { ...assessmentModal.objective, mainAssessmentRemarks: e.target.value };
                    setAssessmentModal(prev => ({ ...prev, objective: updatedObjective }));
                  }}
                  placeholder="Enter your remarks about the student's post assessment performance..."
                  rows={6}
                  maxLength={500}
                />
                <div className="literexia-remark-counter">
                  {(assessmentModal.objective.mainAssessmentRemarks || '').length}/500 characters
                </div>
              </div>
            </div>

            <div className="literexia-attempt-actions">
              <button 
                className="literexia-btn-secondary"
                onClick={closeAssessmentModal}
                disabled={saving}
              >
                Cancel
              </button>
              <button 
                className="literexia-btn-primary"
                onClick={() => saveMainRemarks(assessmentModal.objective._id)}
                disabled={saving}
              >
                {saving ? <FaSpinner className="spinning" /> : <FaSave />}
                {saving ? 'Saving...' : 'Save Remarks'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default IEPReport; 
