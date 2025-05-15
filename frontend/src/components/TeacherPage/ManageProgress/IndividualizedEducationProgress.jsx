import React from 'react';
import { 
  FaCheckCircle, 
  FaEdit, 
  FaSave,
  FaExclamationTriangle
} from 'react-icons/fa';
import './css/IndividualizedEducationProgress.css';

const IndividualizedEducationProgress = ({ 
  assignedCategories,
  progressData,
  learningObjectives,
  onAssistanceChange,
  onRemarksChange,
  onToggleRemarksEditing
}) => {
  
  // If no assigned categories are found
  if (!assignedCategories || assignedCategories.length === 0) {
    return (
      <div className="literexia-empty-state">
        <FaExclamationTriangle />
        <h3>No Assigned Categories</h3>
        <p>This student doesn't have any assessment categories assigned yet. Please assign categories first.</p>
      </div>
    );
  }

  // Get completion status for a category
  const getCategoryCompletion = (categoryId) => {
    const category = assignedCategories.find(cat => cat.categoryId === categoryId);
    return category?.mainAssessmentCompleted || false;
  };

  // Get score for a category
  const getCategoryScore = (categoryId) => {
    const category = assignedCategories.find(cat => cat.categoryId === categoryId);
    return category?.mainAssessmentScore || 0;
  };

  // Get passing status for a category
  const getCategoryPassing = (categoryId) => {
    const category = assignedCategories.find(cat => cat.categoryId === categoryId);
    return category?.passed || false;
  };

  // Get learning objective for a category
  const getLearningObjective = (categoryId) => {
    return learningObjectives.find(obj => obj.id === categoryId) || {
      id: categoryId,
      assistance: null,
      remarks: '',
      isEditingRemarks: false
    };
  };

  return (
    <div className="individualized-progress-container">
      {/* Progress info section */}
      <div className="literexia-progress-info">
        <div className="literexia-progress-info-text">
          <h3>Individualized Education Plan Progress</h3>
          <p>
            This section allows you to track the student's progress across assigned assessment categories.
            You can record the level of assistance required, add remarks, and monitor completion status.
            Use this information to provide targeted support and adjust your teaching approach.
          </p>
        </div>
      </div>
      
      {/* Learning objectives and progress table */}
      <div className="literexia-individualized-education-table">
        <table className="literexia-progress-table">
          <thead>
            <tr>
              <th>Category</th>
              <th>Assessment ID</th>
              <th>Completed</th>
              <th>Score</th>
              <th colSpan="3">Assistance Level</th>
              <th>Remarks</th>
            </tr>
            <tr className="assistance-level-header">
              <th></th>
              <th></th>
              <th></th>
              <th></th>
              <th>Minimal</th>
              <th>Moderate</th>
              <th>Substantial</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {assignedCategories.map(category => {
              const isCompleted = getCategoryCompletion(category.categoryId);
              const score = getCategoryScore(category.categoryId);
              const hasPassed = getCategoryPassing(category.categoryId);
              const objective = getLearningObjective(category.categoryId);
              
              return (
                <tr key={category.categoryId} className={hasPassed ? 'passed-row' : ''}>
                  <td className="category-name-cell">
                    {category.categoryName}
                    {hasPassed && <span className="passed-indicator"><FaCheckCircle /> Passed</span>}
                  </td>
                  <td className="assessment-id-cell">
                    {category.mainAssessmentId || 'Not assigned'}
                  </td>
                  <td className="completion-cell">
                    {isCompleted ? (
                      <span className="completed"><FaCheckCircle /></span>
                    ) : (
                      <span className="not-completed">Not yet</span>
                    )}
                  </td>
                  <td className={`score-cell ${score >= 75 ? 'passing-score' : 'failing-score'}`}>
                    {isCompleted ? `${score}%` : '-'}
                  </td>
                  <td className="assistance-cell">
                    <div
                      className={`assistance-checkbox ${objective.assistance === 'minimal' ? 'selected' : ''}`}
                      onClick={() => onAssistanceChange(category.categoryId, 'minimal')}
                    >
                      {objective.assistance === 'minimal' && <FaCheckCircle />}
                    </div>
                  </td>
                  <td className="assistance-cell">
                    <div
                      className={`assistance-checkbox ${objective.assistance === 'moderate' ? 'selected' : ''}`}
                      onClick={() => onAssistanceChange(category.categoryId, 'moderate')}
                    >
                      {objective.assistance === 'moderate' && <FaCheckCircle />}
                    </div>
                  </td>
                  <td className="assistance-cell">
                    <div
                      className={`assistance-checkbox ${objective.assistance === 'maximal' ? 'selected' : ''}`}
                      onClick={() => onAssistanceChange(category.categoryId, 'maximal')}
                    >
                      {objective.assistance === 'maximal' && <FaCheckCircle />}
                    </div>
                  </td>
                  <td className="remarks-cell">
                    {objective.isEditingRemarks ? (
                      <div className="remarks-edit">
                        <textarea
                          value={objective.remarks}
                          onChange={(e) => onRemarksChange(category.categoryId, e.target.value)}
                          placeholder="Add remarks..."
                          className="remarks-textarea"
                        />
                        <button
                          className="save-remarks-btn"
                          onClick={() => onToggleRemarksEditing(category.categoryId)}
                        >
                          <FaSave />
                        </button>
                      </div>
                    ) : (
                      <div className="remarks-view">
                        <p>{objective.remarks || 'No remarks yet.'}</p>
                        <button
                          className="edit-remarks-btn"
                          onClick={() => onToggleRemarksEditing(category.categoryId)}
                        >
                          <FaEdit />
                        </button>
                      </div>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      
      {/* Legend and guidance */}
      <div className="literexia-assistance-legend">
        <h4>Assistance Level Guide</h4>
        <div className="legend-items">
          <div className="legend-item">
            <span className="legend-label">Minimal:</span>
            <span className="legend-description">Student needs only occasional hints or reminders.</span>
          </div>
          <div className="legend-item">
            <span className="legend-label">Moderate:</span>
            <span className="legend-description">Student needs step-by-step guidance but can complete most tasks independently.</span>
          </div>
          <div className="legend-item">
            <span className="legend-label">Substantial:</span>
            <span className="legend-description">Student requires intensive support and direct instruction throughout the activity.</span>
          </div>
        </div>
      </div>
      
      {/* Progression guidance */}
      <div className="literexia-progression-guidance">
        <h4>Category Progression Guidance</h4>
        <p>
          Students must achieve a minimum score of 75% in each category assessment to advance.
          Record the level of assistance provided to track progress towards independence.
          Add specific remarks about strengths, challenges, and strategies that work well.
        </p>
        <div className="literexia-progress-note">
          <strong>Note:</strong> Regularly reviewing and updating this information will help create a personalized
          learning pathway and ensure the student receives appropriate support.
        </div>
      </div>
    </div>
  );
};

export default IndividualizedEducationProgress;