// src/components/Admin/CategoryAnalysisModal.jsx
import React from 'react';
import {
  X,
  Award,
  Brain,
  Target,
  Shield,
  AlertTriangle,
  Lightbulb,
  TrendingUp,
  TrendingDown,
  Users,
  BarChart3,
  Clock,
  CheckCircle,
  XCircle,
  Info
} from 'lucide-react';
import './CategoryAnalysisModal.css';

const CategoryAnalysisModal = ({
  isOpen,
  onClose,
  category,
  analysis
}) => {
  if (!isOpen || !analysis) return null;

  const formatMasteryPercentage = (value) => {
    return Math.round(value * 100);
  };

  const formatIRTAbility = (value) => {
    return value >= 0 ? `+${value.toFixed(2)}` : value.toFixed(2);
  };

  const getPerformanceBadgeClass = (level) => {
    const levelMap = {
      'excellent': 'performance-badge--excellent',
      'proficient': 'performance-badge--proficient',
      'developing': 'performance-badge--developing',
      'struggling': 'performance-badge--struggling',
      'critical': 'performance-badge--critical'
    };
    return levelMap[level] || 'performance-badge--unknown';
  };

  return (
    <div className="category-modal-overlay" onClick={onClose}>
      <div className="category-modal" onClick={(e) => e.stopPropagation()}>
        <div className="category-modal__header">
          <div className="category-modal__title">
            <Award size={24} />
            <h2>{category} - Detailed Analysis</h2>
          </div>
          <button
            className="category-modal__close-btn"
            onClick={onClose}
            aria-label="Close modal"
          >
            <X size={20} />
          </button>
        </div>

        <div className="category-modal__content">
          {/* Performance Overview */}
          <section className="modal-section">
            <div className="section-header">
              <BarChart3 size={18} />
              <h3>Performance Overview</h3>
              <div className={`performance-badge ${getPerformanceBadgeClass(analysis.performance?.performanceLevel)}`}>
                {analysis.performance?.performanceLevel || 'Unknown'}
              </div>
            </div>

            <div className="performance-grid">
              <div className="performance-metric">
                <Users size={16} />
                <div className="metric-content">
                  <span className="metric-label">Students Analyzed</span>
                  <span className="metric-value">{analysis.studentCount || 0}</span>
                </div>
              </div>

              <div className="performance-metric">
                <Target size={16} />
                <div className="metric-content">
                  <span className="metric-label">Overall Accuracy</span>
                  <span className={`metric-value accuracy-value ${
                    analysis.performance?.accuracy >= 75 ? 'accuracy--good' :
                    analysis.performance?.accuracy >= 60 ? 'accuracy--warning' :
                    'accuracy--critical'
                  }`}>
                    {analysis.performance?.accuracy || 0}%
                  </span>
                </div>
              </div>

              <div className="performance-metric">
                <Clock size={16} />
                <div className="metric-content">
                  <span className="metric-label">Avg Response Time</span>
                  <span className="metric-value">{analysis.performance?.averageResponseTime || 0}s</span>
                </div>
              </div>

              <div className="performance-metric">
                <BarChart3 size={16} />
                <div className="metric-content">
                  <span className="metric-label">Total Responses</span>
                  <span className="metric-value">{analysis.totalResponses || 0}</span>
                </div>
              </div>
            </div>
          </section>

          {/* BKT & IRT Mathematical Models */}
          <section className="modal-section">
            <div className="section-header">
              <Brain size={18} />
              <h3>Mathematical Models Analysis</h3>
            </div>

            <div className="models-grid">
              {/* Bayesian Knowledge Tracing */}
              <div className="model-card bkt-card">
                <div className="model-header">
                  <Target size={16} />
                  <h4>Bayesian Knowledge Tracing (BKT)</h4>
                </div>
                <div className="model-content">
                  <div className="bkt-mastery">
                    <span className="mastery-label">Average Mastery Probability</span>
                    <div className="mastery-circle">
                      <div
                        className="mastery-progress"
                        style={{
                          background: `conic-gradient(#4CAF50 ${formatMasteryPercentage(analysis.skillMastery?.averageMastery || 0) * 3.6}deg, #f0f0f0 0deg)`
                        }}
                      >
                        <span className="mastery-percentage">
                          {formatMasteryPercentage(analysis.skillMastery?.averageMastery || 0)}%
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="bkt-distribution">
                    <div className="distribution-item">
                      <CheckCircle size={14} className="icon-success" />
                      <span>Mastered Students: {analysis.skillMastery?.masteredStudents || 0}</span>
                    </div>
                    <div className="distribution-item">
                      <XCircle size={14} className="icon-warning" />
                      <span>Struggling Students: {analysis.skillMastery?.strugglingStudents || 0}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Item Response Theory */}
              <div className="model-card irt-card">
                <div className="model-header">
                  <TrendingUp size={16} />
                  <h4>Item Response Theory (IRT)</h4>
                </div>
                <div className="model-content">
                  <div className="irt-ability">
                    <span className="ability-label">Average Ability Estimate</span>
                    <div className="ability-scale">
                      <div className="scale-bar">
                        <div className="scale-markers">
                          <span>-3</span>
                          <span>-2</span>
                          <span>-1</span>
                          <span>0</span>
                          <span>+1</span>
                          <span>+2</span>
                          <span>+3</span>
                        </div>
                        <div
                          className="ability-indicator"
                          style={{
                            left: `${((analysis.abilityEstimates?.averageAbility || 0) + 3) * (100/6)}%`
                          }}
                        >
                          <span className="ability-value">
                            {formatIRTAbility(analysis.abilityEstimates?.averageAbility || 0)}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="irt-distribution">
                    <div className="distribution-item">
                      <TrendingUp size={14} className="icon-success" />
                      <span>High Ability: {analysis.abilityEstimates?.highAbilityStudents || 0}</span>
                    </div>
                    <div className="distribution-item">
                      <TrendingDown size={14} className="icon-warning" />
                      <span>Low Ability: {analysis.abilityEstimates?.lowAbilityStudents || 0}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* Error Pattern Analysis */}
          <section className="modal-section">
            <div className="section-header">
              <AlertTriangle size={18} />
              <h3>Error Pattern Analysis</h3>
            </div>

            {analysis.errorPatterns?.overall && (
              <div className="error-analysis">
                <div className="error-overview">
                  <div className="error-metric">
                    <span className="error-label">Total Responses</span>
                    <span className="error-value">{analysis.errorPatterns.overall.totalResponses}</span>
                  </div>
                  <div className="error-metric">
                    <span className="error-label">Incorrect Responses</span>
                    <span className="error-value error-value--warning">
                      {analysis.errorPatterns.overall.incorrectResponses}
                    </span>
                  </div>
                  <div className="error-metric">
                    <span className="error-label">Error Rate</span>
                    <span className={`error-value ${
                      analysis.errorPatterns.overall.errorRate <= 20 ? 'error-value--good' :
                      analysis.errorPatterns.overall.errorRate <= 40 ? 'error-value--warning' :
                      'error-value--critical'
                    }`}>
                      {analysis.errorPatterns.overall.errorRate}%
                    </span>
                  </div>
                  <div className="error-metric">
                    <span className="error-label">Severity Level</span>
                    <span className={`error-value severity-${analysis.errorPatterns.overall.errorSeverity}`}>
                      {analysis.errorPatterns.overall.errorSeverity}
                    </span>
                  </div>
                </div>

                {analysis.errorPatterns.specific && (
                  <div className="specific-errors">
                    <h5>Category-Specific Error Patterns</h5>
                    <div className="specific-error-content">
                      {analysis.errorPatterns.specific.errorType && (
                        <div className="error-type">
                          <strong>Primary Error Type:</strong> {analysis.errorPatterns.specific.errorType}
                        </div>
                      )}

                      {analysis.errorPatterns.specific.recommendedFocus && (
                        <div className="recommended-focus">
                          <strong>Recommended Focus Areas:</strong>
                          <ul>
                            {analysis.errorPatterns.specific.recommendedFocus.map((focus, index) => (
                              <li key={index}>{focus}</li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            )}
          </section>

          {/* Detailed Analysis Sections */}
          <div className="analysis-sections-grid">
            {/* Strengths */}
            <section className="analysis-section strengths-section">
              <div className="section-header">
                <Shield size={16} />
                <h4>Strengths</h4>
              </div>
              <div className="analysis-content">
                {analysis.strengths?.length > 0 ? (
                  <ul className="analysis-list analysis-list--strengths">
                    {analysis.strengths.map((strength, index) => (
                      <li key={index} className="analysis-item">
                        <CheckCircle size={12} />
                        <span>{strength}</span>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="no-data">No specific strengths identified.</p>
                )}
              </div>
            </section>

            {/* Weaknesses */}
            <section className="analysis-section weaknesses-section">
              <div className="section-header">
                <AlertTriangle size={16} />
                <h4>Areas for Improvement</h4>
              </div>
              <div className="analysis-content">
                {analysis.weaknesses?.length > 0 ? (
                  <ul className="analysis-list analysis-list--weaknesses">
                    {analysis.weaknesses.map((weakness, index) => (
                      <li key={index} className="analysis-item">
                        <XCircle size={12} />
                        <span>{weakness}</span>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="no-data">No specific weaknesses identified.</p>
                )}
              </div>
            </section>

            {/* Recommendations */}
            <section className="analysis-section recommendations-section">
              <div className="section-header">
                <Lightbulb size={16} />
                <h4>Targeted Recommendations</h4>
              </div>
              <div className="analysis-content">
                {analysis.recommendations?.length > 0 ? (
                  <ul className="analysis-list analysis-list--recommendations">
                    {analysis.recommendations.map((recommendation, index) => (
                      <li key={index} className="analysis-item">
                        <Info size={12} />
                        <span>{recommendation}</span>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="no-data">No specific recommendations available.</p>
                )}
              </div>
            </section>
          </div>

          {/* Mathematical Details Footer */}
          <section className="modal-section model-details">
            <div className="section-header">
              <Brain size={18} />
              <h3>Mathematical Model Details</h3>
            </div>
            <div className="model-details-content">
              <div className="model-explanation">
                <h5>Bayesian Knowledge Tracing (BKT)</h5>
                <p>
                  Tracks student knowledge state evolution through response patterns using probabilistic inference.
                  Estimates the probability that a student has mastered the skill based on their correct/incorrect responses.
                </p>
              </div>
              <div className="model-explanation">
                <h5>Item Response Theory (IRT)</h5>
                <p>
                  Measures student ability on a standardized scale (-3 to +3) considering question difficulty and discrimination.
                  Provides more nuanced ability estimates than simple percentage scores.
                </p>
              </div>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
};

export default CategoryAnalysisModal;