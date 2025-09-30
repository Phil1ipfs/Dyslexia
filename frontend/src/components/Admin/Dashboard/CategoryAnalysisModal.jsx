import React from 'react';
import { X, Award, Shield, AlertTriangle, Lightbulb, TrendingUp, TrendingDown } from 'lucide-react';
import './CategoryAnalysisModal.css';

const CategoryAnalysisModal = ({ isOpen, onClose, categoryData, categoryName }) => {
  if (!isOpen || !categoryData) return null;

  const getPerformanceLevel = (accuracy) => {
    if (accuracy >= 75) return 'Proficient';
    if (accuracy >= 60) return 'Developing';
    if (accuracy >= 40) return 'Struggling';
    return 'Critical';
  };

  const getPerformanceClass = (accuracy) => {
    if (accuracy >= 75) return 'proficient';
    if (accuracy >= 60) return 'developing';
    if (accuracy >= 40) return 'struggling';
    return 'critical';
  };

  const performanceLevel = getPerformanceLevel(categoryData.performance?.accuracy || 0);
  const performanceClass = getPerformanceClass(categoryData.performance?.accuracy || 0);

  return (
    <div className="category-modal-overlay" onClick={onClose}>
      <div className="category-modal" onClick={(e) => e.stopPropagation()}>
        <div className="category-modal__header">
          <div className="category-modal__title">
            <Award size={20} />
            <h2>{categoryName}</h2>
            <span className={`performance-badge performance-badge--${performanceClass}`}>
              {performanceLevel}
            </span>
          </div>
          <button className="category-modal__close" onClick={onClose}>
            <X size={20} />
          </button>
        </div>

        <div className="category-modal__content">
          {/* Key Metrics */}
          <div className="category-modal__metrics">
            <h3>Performance Metrics</h3>
            <div className="metrics-grid">
              <div className="metric-item">
                <span className="metric-label">Students</span>
                <span className="metric-value">{categoryData.studentCount || 0}</span>
              </div>
              <div className="metric-item">
                <span className="metric-label">Accuracy</span>
                <span className={`metric-value accuracy accuracy--${performanceClass}`}>
                  {categoryData.performance?.accuracy || 0}%
                </span>
              </div>
              <div className="metric-item">
                <span className="metric-label">BKT Mastery</span>
                <span className="metric-value">
                  {Math.round((categoryData.skillMastery?.averageMastery || 0) * 100)}%
                </span>
              </div>
              <div className="metric-item">
                <span className="metric-label">IRT Ability</span>
                <span className={`metric-value irt-ability ${(categoryData.abilityEstimates?.averageAbility || 0) >= 0 ? 'irt-ability--positive' : 'irt-ability--negative'}`}>
                  {(categoryData.abilityEstimates?.averageAbility || 0) >= 0 ? '+' : ''}{categoryData.abilityEstimates?.averageAbility || 0}
                </span>
              </div>
            </div>
          </div>

          {/* Strengths */}
          {categoryData.strengths && categoryData.strengths.length > 0 && (
            <div className="category-modal__section">
              <h3>
                <Shield size={16} />
                Strengths
              </h3>
              <ul className="analysis-list analysis-list--strengths">
                {categoryData.strengths.map((strength, index) => (
                  <li key={index}>{strength}</li>
                ))}
              </ul>
            </div>
          )}

          {/* Weaknesses */}
          {categoryData.weaknesses && categoryData.weaknesses.length > 0 && (
            <div className="category-modal__section">
              <h3>
                <AlertTriangle size={16} />
                Areas for Improvement
              </h3>
              <ul className="analysis-list analysis-list--weaknesses">
                {categoryData.weaknesses.map((weakness, index) => (
                  <li key={index}>{weakness}</li>
                ))}
              </ul>
            </div>
          )}

          {/* Recommendations */}
          {categoryData.recommendations && categoryData.recommendations.length > 0 && (
            <div className="category-modal__section">
              <h3>
                <Lightbulb size={16} />
                Recommendations
              </h3>
              <ul className="analysis-list analysis-list--recommendations">
                {categoryData.recommendations.map((recommendation, index) => (
                  <li key={index}>{recommendation}</li>
                ))}
              </ul>
            </div>
          )}

          {/* Additional Insights */}
          {categoryData.insights && (
            <div className="category-modal__section">
              <h3>Additional Insights</h3>
              <div className="insights-grid">
                {categoryData.insights.overallReadiness && (
                  <div className="insight-item">
                    <span className="insight-label">Overall Readiness:</span>
                    <span className="insight-value">{categoryData.insights.overallReadiness}</span>
                  </div>
                )}
                {categoryData.insights.recommendedAction && (
                  <div className="insight-item">
                    <span className="insight-label">Recommended Action:</span>
                    <span className="insight-value">{categoryData.insights.recommendedAction}</span>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        <div className="category-modal__footer">
          <button className="category-modal__close-btn" onClick={onClose}>
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

export default CategoryAnalysisModal;
