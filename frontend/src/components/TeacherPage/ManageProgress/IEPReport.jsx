import React, { useState } from 'react';
import { 
  FaCheckCircle, 
  FaPencilAlt, 
  FaSave, 
  FaTimes,
  FaExclamationTriangle,
  FaEdit
} from 'react-icons/fa';
import './css/IEPReport.css';

const IEPReport = ({ 
  student,
  learningObjectives = [],
  onAssistanceChange,
  onRemarksChange,
  onToggleRemarksEditing
}) => {
  const [editingObjectiveId, setEditingObjectiveId] = useState(null);
  const [editedRemarks, setEditedRemarks] = useState('');

  // Handle editing remarks
  const handleEditRemarks = (objectiveId, currentRemarks) => {
    if (onToggleRemarksEditing) {
      onToggleRemarksEditing(objectiveId);
    }
  };

  // Handle remarks change
  const handleRemarksChange = (objectiveId, remarks) => {
    if (onRemarksChange) {
      onRemarksChange(objectiveId, remarks);
    }
  };

  // Handle support level change
  const handleSupportLevelChange = (objectiveId, level) => {
    if (onAssistanceChange) {
      onAssistanceChange(objectiveId, level);
    }
  };

  if (!learningObjectives || learningObjectives.length === 0) {
    return (
      <div className="literexia-empty-state">
        <FaExclamationTriangle />
        <p>No IEP data available for this student. Please complete an assessment first.</p>
      </div>
    );
  }

  return (
    <div className="literexia-iep-container">
      <div className="literexia-iep-info">
        <p>
          This Individualized Education Progress (IEP) report tracks the student's progress in meeting 
          personalized learning objectives. You can update support levels and add remarks about their development.
        </p>
      </div>
      
      <div className="literexia-iep-table-container">
        <table className="literexia-iep-table">
          <thead>
            <tr>
              <th>Lesson</th>
              <th>Category</th>
              <th>Status</th>
              <th colSpan="3">Progress Level</th>
              <th>Remarks</th>
            </tr>
            <tr className="literexia-support-level-header">
              <th></th>
              <th></th>
              <th></th>
              <th>Minimal support</th>
              <th>Moderate support</th>
              <th>Extensive support</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {learningObjectives.map((objective) => (
              <tr key={objective.id}>
                <td className="literexia-lesson-cell">{objective.title}</td>
                <td>
                  {objective.category
                    .replace(/_/g, ' ')
                    .replace(/\b\w/g, l => l.toUpperCase())}
                </td>
                <td className="literexia-status-cell">
                  {objective.completed ? (
                    <span className="literexia-status-completed">
                      <FaCheckCircle /> Mastered
                    </span>
                  ) : (
                    <span className="literexia-status-in-progress">In Progress</span>
                  )}
                </td>
                <td className="literexia-support-cell">
                  <div
                    className={`literexia-support-checkbox ${objective.assistance === 'minimal' ? 'selected' : ''}`}
                    onClick={() => handleSupportLevelChange(objective.id, 'minimal')}
                  >
                    {objective.assistance === 'minimal' && <FaCheckCircle />}
                  </div>
                </td>
                <td className="literexia-support-cell">
                  <div
                    className={`literexia-support-checkbox ${objective.assistance === 'moderate' ? 'selected' : ''}`}
                    onClick={() => handleSupportLevelChange(objective.id, 'moderate')}
                  >
                    {objective.assistance === 'moderate' && <FaCheckCircle />}
                  </div>
                </td>
                <td className="literexia-support-cell">
                  <div
                    className={`literexia-support-checkbox ${objective.assistance === 'substantial' ? 'selected' : ''}`}
                    onClick={() => handleSupportLevelChange(objective.id, 'substantial')}
                  >
                    {objective.assistance === 'substantial' && <FaCheckCircle />}
                  </div>
                </td>
                <td className="literexia-remarks-cell">
                  {objective.isEditingRemarks ? (
                    <div className="literexia-remarks-editor">
                      <textarea
                        value={objective.remarks}
                        onChange={(e) => handleRemarksChange(objective.id, e.target.value)}
                        placeholder="Add your remarks here..."
                      />
                      <div className="literexia-remarks-actions">
                        <button 
                          className="literexia-save-button"
                          onClick={() => handleEditRemarks(objective.id)}
                        >
                          <FaSave /> Save
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="literexia-remarks-display">
                      <p>{objective.remarks || 'No remarks added yet.'}</p>
                      <button 
                        className="literexia-edit-button"
                        onClick={() => handleEditRemarks(objective.id, objective.remarks)}
                      >
                        <FaEdit />
                      </button>
                    </div>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default IEPReport; 