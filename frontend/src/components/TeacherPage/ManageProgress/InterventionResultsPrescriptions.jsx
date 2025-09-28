import React from 'react';
import {
  FaFlask,
  FaExclamationCircle,
  FaUserMd,
  FaBrain,
  FaEdit,
  FaCheckCircle,
  FaExclamationTriangle,
  FaGraduationCap,
  FaCog,
  FaChartLine,
  FaLightbulb,
  FaTools,
  FaClipboardList
} from 'react-icons/fa';
import './css/InterventionResultsPrescriptions.css';

/**
 * InterventionResultsPrescriptions Component
 *
 * Displays comprehensive research-based prescriptions from intervention results
 * Dynamically handles all reading categories (not limited to Alphabet Knowledge)
 *
 * @param {Object} props
 * @param {Object} props.researchBasedPrescriptions - Research prescriptions data
 * @param {string} props.categoryName - Current category being analyzed
 * @param {Object} props.interventionData - Full intervention data context
 * @param {boolean} props.showDetailedAnalysis - Whether to show full analysis
 */
const InterventionResultsPrescriptions = ({
  researchBasedPrescriptions,
  categoryName,
  interventionData,
  showDetailedAnalysis = true
}) => {

  // Get prescriptions for current category
  const categoryPrescriptions = researchBasedPrescriptions?.[categoryName];

  if (!categoryPrescriptions) {
    return (
      <div className="irp-research-prescriptions-container">
        <h4 className="irp-subsection-title">
          <FaFlask className="irp-section-icon" />
          Research-Based Prescriptions - {categoryName}
        </h4>
        <div className="irp-no-data">
          <p>No research-based prescriptions available for this category.</p>
          <small>Prescriptions are generated after intervention completion and analysis.</small>
        </div>
      </div>
    );
  }

  return (
    <div className="irp-research-prescriptions-container irp-fade-in">
      <h4 className="irp-subsection-title">
        <FaFlask className="irp-section-icon" />
        Research-Based Prescriptions - {categoryName}
      </h4>

      {/* Category Status */}
      {categoryPrescriptions.categoryStatus && (
        <div className="irp-category-status-card irp-slide-in">
          <h5 className="irp-status-title">Category Status</h5>
          <div className={`irp-status-badge status-${categoryPrescriptions.categoryStatus.replace(/_/g, '-')}`}>
            {categoryPrescriptions.categoryStatus.replace(/_/g, ' ').toUpperCase()}
          </div>
        </div>
      )}

      {/* Deficit Analysis */}
      {categoryPrescriptions.deficitAnalysis && showDetailedAnalysis && (
        <div className="irp-deficit-analysis-card irp-fade-in">
          <h5 className="irp-analysis-title">
            <FaExclamationCircle className="irp-icon" />
            Deficit Analysis
          </h5>

          {/* Specific Deficits */}
          {categoryPrescriptions.deficitAnalysis.specificDeficits?.map((deficit, index) => (
            <div key={index} className="irp-deficit-item">
              <div className="irp-deficit-header">
                <span className="irp-deficit-name">{deficit.deficit}</span>
                {deficit.severity && (
                  <span className={`irp-severity-badge ${deficit.severity}`}>
                    {deficit.severity}
                  </span>
                )}
              </div>

              <div className="irp-deficit-details">
                {deficit.manifestation && (
                  <p><strong>Manifestation:</strong> {deficit.manifestation}</p>
                )}
                {deficit.errorRate && (
                  <p><strong>Error Rate:</strong> {deficit.errorRate}</p>
                )}
                {deficit.researchEvidence && (
                  <p><strong>Research Evidence:</strong> {deficit.researchEvidence}</p>
                )}
                {deficit.interventionResponse && (
                  <p><strong>Intervention Response:</strong> {deficit.interventionResponse.replace(/_/g, ' ')}</p>
                )}
              </div>
            </div>
          ))}

          {/* Root Cause Analysis */}
          {categoryPrescriptions.deficitAnalysis.rootCauseAnalysis && (
            <div className="irp-root-cause-section">
              <h6 className="irp-root-cause-title">
                <FaBrain className="irp-icon" style={{ marginRight: '8px' }} />
                Root Cause Analysis
              </h6>
              <p className="irp-root-cause-text">
                {categoryPrescriptions.deficitAnalysis.rootCauseAnalysis}
              </p>
            </div>
          )}

          {/* Cognitive Factors */}
          {categoryPrescriptions.deficitAnalysis.cognitiveFactors?.length > 0 && (
            <div className="irp-factors-section">
              <h6 className="irp-factors-title">
                <FaBrain className="irp-icon" style={{ marginRight: '8px' }} />
                Cognitive Factors
              </h6>
              <div className="irp-factors-list">
                {categoryPrescriptions.deficitAnalysis.cognitiveFactors.map((factor, idx) => (
                  <span key={idx} className="irp-factor-tag">
                    {factor.replace(/_/g, ' ')}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Linguistic Factors */}
          {categoryPrescriptions.deficitAnalysis.linguisticFactors?.length > 0 && (
            <div className="irp-factors-section">
              <h6 className="irp-factors-title">
                <FaGraduationCap className="irp-icon" style={{ marginRight: '8px' }} />
                Linguistic Factors
              </h6>
              <div className="irp-factors-list">
                {categoryPrescriptions.deficitAnalysis.linguisticFactors.map((factor, idx) => (
                  <span key={idx} className="irp-factor-tag">
                    {factor.replace(/_/g, ' ')}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Research Classification */}
          {categoryPrescriptions.deficitAnalysis.researchClassification && (
            <div className="irp-research-classification">
              <h6 className="irp-classification-title">
                Research Classification
              </h6>
              <div className="irp-classification-value">
                {categoryPrescriptions.deficitAnalysis.researchClassification.replace(/_/g, ' ')}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Next Intervention Prescription */}
      {categoryPrescriptions.nextInterventionPrescription && (
        <div className="irp-next-prescription-card irp-fade-in">
          <h5 className="irp-prescription-title">
            <FaUserMd className="irp-icon" />
            Next Intervention Prescription
          </h5>

          {/* Recommended Action */}
          {categoryPrescriptions.nextInterventionPrescription.recommendedAction && (
            <div className="irp-action-section">
              <div className="irp-action-label">
                <FaClipboardList className="irp-icon" style={{ marginRight: '8px' }} />
                Recommended Action
              </div>
              <span className={`irp-action-badge action-${categoryPrescriptions.nextInterventionPrescription.recommendedAction?.replace(/_/g, '-')}`}>
                {categoryPrescriptions.nextInterventionPrescription.recommendedAction?.replace(/_/g, ' ')}
              </span>
            </div>
          )}

          {/* Primary Approach */}
          {categoryPrescriptions.nextInterventionPrescription.primaryApproach && (
            <div className="irp-action-section">
              <div className="irp-action-label">
                <FaLightbulb className="irp-icon" style={{ marginRight: '8px' }} />
                Primary Approach
              </div>
              <p>{categoryPrescriptions.nextInterventionPrescription.primaryApproach}</p>
            </div>
          )}

          {/* Specific Techniques */}
          {categoryPrescriptions.nextInterventionPrescription.specificTechniques?.length > 0 && (
            <div className="irp-techniques-section">
              <div className="irp-action-label">
                <FaTools className="irp-icon" style={{ marginRight: '8px' }} />
                Specific Techniques
              </div>
              <div className="irp-techniques-list">
                {categoryPrescriptions.nextInterventionPrescription.specificTechniques.map((technique, idx) => (
                  <div key={idx} className="irp-technique-item">
                    {typeof technique === 'object' ? (
                      <>
                        <div className="irp-technique-name">{technique.technique}</div>
                        <div className="irp-technique-details">
                          {technique.description && (
                            <div className="irp-technique-detail">
                              <strong>Description:</strong> {technique.description}
                            </div>
                          )}
                          {technique.duration && (
                            <div className="irp-technique-detail">
                              <strong>Duration:</strong> {technique.duration}
                            </div>
                          )}
                          {technique.materials && (
                            <div className="irp-technique-detail">
                              <strong>Materials:</strong> {technique.materials}
                            </div>
                          )}
                          {technique.progressCriteria && (
                            <div className="irp-technique-detail">
                              <strong>Progress Criteria:</strong> {technique.progressCriteria}
                            </div>
                          )}
                          {technique.researchBasis && (
                            <div className="irp-technique-detail">
                              <strong>Research Basis:</strong> {technique.researchBasis}
                            </div>
                          )}
                          {technique.modificationFromPrevious && (
                            <div className="irp-technique-detail">
                              <strong>Modification:</strong> {technique.modificationFromPrevious}
                            </div>
                          )}
                        </div>
                      </>
                    ) : (
                      <div className="irp-technique-name">{technique}</div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Intensity Level */}
          {categoryPrescriptions.nextInterventionPrescription.intensityLevel && (
            <div className="irp-intensity-section">
              <div className="irp-action-label">
                <FaChartLine className="irp-icon" style={{ marginRight: '8px' }} />
                Intensity Level
              </div>
              <span className={`irp-intensity-badge intensity-${categoryPrescriptions.nextInterventionPrescription.intensityLevel}`}>
                {categoryPrescriptions.nextInterventionPrescription.intensityLevel}
              </span>
            </div>
          )}

          {/* Session Structure */}
          {categoryPrescriptions.nextInterventionPrescription.sessionStructure && (
            <div className="irp-session-structure">
              <h6 className="irp-session-structure-title">
                <FaCog className="irp-icon" style={{ marginRight: '8px' }} />
                Session Structure
              </h6>
              <div className="irp-session-details">
                {categoryPrescriptions.nextInterventionPrescription.sessionStructure.optimalLength && (
                  <div className="irp-session-detail">
                    <strong>Optimal Length:</strong> {categoryPrescriptions.nextInterventionPrescription.sessionStructure.optimalLength}
                  </div>
                )}
                {categoryPrescriptions.nextInterventionPrescription.sessionStructure.breakPattern && (
                  <div className="irp-session-detail">
                    <strong>Break Pattern:</strong> {categoryPrescriptions.nextInterventionPrescription.sessionStructure.breakPattern}
                  </div>
                )}
                {categoryPrescriptions.nextInterventionPrescription.sessionStructure.sessionComponents && (
                  <div className="irp-session-detail">
                    <strong>Session Components:</strong> {categoryPrescriptions.nextInterventionPrescription.sessionStructure.sessionComponents.join(', ')}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Material Recommendations */}
          {categoryPrescriptions.nextInterventionPrescription.materialRecommendations?.length > 0 && (
            <div className="irp-support-features">
              <div className="irp-action-label">
                <FaTools className="irp-icon" style={{ marginRight: '8px' }} />
                Material Recommendations
              </div>
              <div className="irp-features-list">
                {categoryPrescriptions.nextInterventionPrescription.materialRecommendations.map((material, idx) => (
                  <span key={idx} className="irp-feature-tag">
                    {material}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Progress Monitoring */}
          {categoryPrescriptions.nextInterventionPrescription.progressMonitoring && (
            <div className="irp-session-structure">
              <h6 className="irp-session-structure-title">
                <FaChartLine className="irp-icon" style={{ marginRight: '8px' }} />
                Progress Monitoring
              </h6>
              <div className="irp-session-details">
                {categoryPrescriptions.nextInterventionPrescription.progressMonitoring.frequency && (
                  <div className="irp-session-detail">
                    <strong>Frequency:</strong> {categoryPrescriptions.nextInterventionPrescription.progressMonitoring.frequency}
                  </div>
                )}
                {categoryPrescriptions.nextInterventionPrescription.progressMonitoring.dataCollectionMethod && (
                  <div className="irp-session-detail">
                    <strong>Data Collection:</strong> {categoryPrescriptions.nextInterventionPrescription.progressMonitoring.dataCollectionMethod}
                  </div>
                )}
                {categoryPrescriptions.nextInterventionPrescription.progressMonitoring.keyIndicators && (
                  <div className="irp-session-detail">
                    <strong>Key Indicators:</strong> {categoryPrescriptions.nextInterventionPrescription.progressMonitoring.keyIndicators.join(', ')}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Teacher Revision Guidance */}
      {categoryPrescriptions.teacherRevisionGuidance?.revisionRecommended && (
        <div className="irp-teacher-revision-card irp-fade-in">
          <h5 className="irp-revision-title">
            <FaEdit className="irp-icon" />
            Teacher Revision Guidance
          </h5>

          {/* Revision Priority */}
          {categoryPrescriptions.teacherRevisionGuidance.revisionPriority && (
            <div className="irp-revision-priority">
              <div className="irp-action-label">Priority Level</div>
              <span className={`irp-priority-badge priority-${categoryPrescriptions.teacherRevisionGuidance.revisionPriority}`}>
                {categoryPrescriptions.teacherRevisionGuidance.revisionPriority}
              </span>
            </div>
          )}

          {/* Specific Changes */}
          {categoryPrescriptions.teacherRevisionGuidance.specificChanges?.length > 0 && (
            <div className="irp-changes-section">
              <div className="irp-action-label">
                <FaEdit className="irp-icon" style={{ marginRight: '8px' }} />
                Specific Changes Recommended
              </div>
              <div className="irp-changes-list">
                {categoryPrescriptions.teacherRevisionGuidance.specificChanges.map((change, idx) => (
                  <div key={idx} className="irp-change-item">
                    <div className="irp-change-text">{change.change}</div>
                    {change.rationale && (
                      <div className="irp-change-rationale">
                        <strong>Rationale:</strong> {change.rationale}
                      </div>
                    )}
                    {change.expectedImpact && (
                      <div className="irp-change-impact">
                        <strong>Expected Impact:</strong> {change.expectedImpact}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Question Modifications */}
          {categoryPrescriptions.teacherRevisionGuidance.questionModifications?.length > 0 && (
            <div className="irp-question-modifications">
              <div className="irp-action-label">
                <FaCog className="irp-icon" style={{ marginRight: '8px' }} />
                Question Modifications
              </div>
              {categoryPrescriptions.teacherRevisionGuidance.questionModifications.map((mod, idx) => (
                <div key={idx} className="irp-modification-item">
                  <div className="irp-modification-header">
                    <span className="irp-question-type">{mod.questionType}</span>
                  </div>
                  <div className="irp-modification-details">
                    {mod.currentDifficulty && (
                      <div><strong>Current:</strong> {mod.currentDifficulty}</div>
                    )}
                    {mod.recommendedChange && (
                      <div><strong>Recommended:</strong> {mod.recommendedChange}</div>
                    )}
                    {mod.reason && (
                      <div><strong>Reason:</strong> {mod.reason}</div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Support Features */}
          {categoryPrescriptions.teacherRevisionGuidance.supportFeatures?.length > 0 && (
            <div className="irp-support-features">
              <div className="irp-action-label">
                <FaTools className="irp-icon" style={{ marginRight: '8px' }} />
                Support Features to Add
              </div>
              <div className="irp-features-list">
                {categoryPrescriptions.teacherRevisionGuidance.supportFeatures.map((feature, idx) => (
                  <span key={idx} className="irp-feature-tag">
                    {feature}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Estimated Impact */}
          {categoryPrescriptions.teacherRevisionGuidance.estimatedImpact && (
            <div className="irp-estimated-impact">
              <div className="irp-impact-text">
                <FaCheckCircle className="irp-icon" style={{ marginRight: '8px' }} />
                {categoryPrescriptions.teacherRevisionGuidance.estimatedImpact}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Escalation Protocol */}
      {categoryPrescriptions.escalationProtocol && (
        <div className={`irp-escalation-protocol ${categoryPrescriptions.escalationProtocol.escalationTriggered ? 'irp-escalation-triggered' : ''}`}>
          <h5 className="irp-escalation-title">
            <FaExclamationTriangle className="irp-icon" />
            Escalation Protocol
          </h5>
          <div className="irp-escalation-status">
            <strong>Status:</strong> {categoryPrescriptions.escalationProtocol.escalationTriggered ? 'Triggered' : 'Not Triggered'}
          </div>
          {categoryPrescriptions.escalationProtocol.triggers?.length > 0 && (
            <div className="irp-escalation-triggers">
              <strong>Triggers:</strong> {categoryPrescriptions.escalationProtocol.triggers.join(', ')}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default InterventionResultsPrescriptions;