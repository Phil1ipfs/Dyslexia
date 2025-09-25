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
  const [expandedInterventions, setExpandedInterventions] = useState({});
  const [error, setError] = useState(null);
  const [editingRemarks, setEditingRemarks] = useState({}); // Track which remarks are being edited
  const [tempRemarks, setTempRemarks] = useState({}); // Store temporary remarks during editing
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
      <div className="literexia-iep-info">
        <div className="literexia-iep-header">
          <FaInfoCircle />
          <div>
            <h4>Individualized Education Progress Report</h4>
            <p>
              This report shows {getStudentName()}'s current progress and support needs across key reading skill categories.
              Teachers can update support levels and add remarks to track progress over time.
            </p>
          </div>
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
              <th>Lesson</th>
              <th>Category</th>
                <th className="literexia-score-cell">Score</th>
                <th colSpan={3} className="text-center">Support Level Needed</th>
                <th>Intervention</th>
                <th>Teacher Remarks</th>
            </tr>
            <tr className="literexia-support-level-header">
                <th colSpan={3}></th>
                <th>Minimal</th>
                <th>Moderate</th>
                <th>Extensive</th>
                <th colSpan={2}></th>
            </tr>
          </thead>
          <tbody>
              {iepData.objectives.map((objective) => (
                <tr key={objective._id} className="literexia-objective-row">
                  <td className="literexia-lesson-cell">
                    <div className="literexia-lesson-content">
                      <strong>{objective.lesson}</strong>
                      {objective.lastUpdated && (
                        <span className="literexia-last-updated">
                          Updated: {formatDate(objective.lastUpdated)}
                        </span>
                      )}
                    </div>
                </td>
                  <td className="literexia-category-cell">
                    <span className={`literexia-category-badge category-${objective.categoryName.toLowerCase().replace(/_/g, '-')}`}>
                      {objective.categoryName.replace(/_/g, ' ')}
                    </span>
                </td>
                  <td className="literexia-score-cell">
                    <div className="literexia-score-display">
                      <div className="literexia-assessment-score">
                        <span className={`literexia-score ${(objective.assessmentScore || objective.score || 0) >= (objective.passingThreshold || 75) ? 'passing' : 'needs-improvement'}`}>
                          {objective.assessmentScore || objective.score || 0}%
                        </span>
                        <small className="literexia-score-type">Assessment</small>

                        {/* Detailed assessment breakdown */}
                        {(objective.totalQuestions > 0 || objective.totalPossibleMatches > 0) && (
                          <div className="literexia-assessment-details">
                            {objective.totalQuestions > 0 && (
                              <small className="literexia-score-breakdown">
                                {objective.correctAnswers || 0}/{objective.totalQuestions} correct
                              </small>
                            )}
                            {objective.totalPossibleMatches > 0 && (
                              <small className="literexia-score-breakdown">
                                {objective.correctMatches || 0}/{objective.totalPossibleMatches} matches
                              </small>
                            )}
                          </div>
                        )}
                      </div>

                      {objective.hasIntervention && objective.latestInterventionScore && (
                        <div className="literexia-intervention-score">
                          <span className={`literexia-score ${objective.latestInterventionScore >= 75 ? 'passing' : 'needs-improvement'}`}>
                            {objective.latestInterventionScore}%
                          </span>
                          <small className="literexia-score-type">Latest Intervention</small>

                          {/* Show intervention improvement */}
                          {objective.interventionImprovement !== 0 && (
                            <div className={`literexia-improvement-indicator ${objective.interventionImprovement > 0 ? 'positive' : 'negative'}`}>
                              <small>
                                {objective.interventionImprovement > 0 ? '+' : ''}{objective.interventionImprovement}% improvement
                              </small>
                            </div>
                          )}
                        </div>
                      )}

                      <div className="literexia-overall-status">
                        <small className={`literexia-status ${(objective.isPassed || objective.latestInterventionPassed) ? 'passed' : 'needs-work'}`}>
                          {(objective.isPassed || objective.latestInterventionPassed) ? 'Passed' : 'Needs Work'}
                        </small>
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
                    {renderInterventionStatus(objective)}
                </td>
                <td className="literexia-remarks-cell">
                    {renderRemarksCell(objective)}
                </td>
              </tr>
            ))}
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
    </div>
  );
};

export default IEPReport; 
