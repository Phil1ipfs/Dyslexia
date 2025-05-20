import React, { useState } from 'react';
import {
  FaInfoCircle,
  FaChartBar,
  FaCheck,
  FaTimes,
  FaChevronDown,
  FaChevronUp,
  FaGraduationCap,
  FaCalendarAlt,
  FaClock,
  FaBookOpen,
  FaArrowRight
} from 'react-icons/fa';
import './css/AssessmentResults.css';

/**
 * AssessmentResults Component
 * 
 * This component displays a student's assessment results.
 * It includes:
 * - Overall reading level and score information
 * - Detailed breakdown of performance by reading skill
 * - Option to expand each skill to see sample questions
 * - Recommendations based on assessment results
 * 
 * The component is designed to work with both pre-assessment and post-assessment data
 * following the system's assessment flow:
 * 1. First pre-assessment sets initial reading level in users collection
 * 2. Post-assessments can update reading level if:
 *    - All categories are passed
 *    - New level is higher than current level
 *    - Assessment hasn't been used to update level before (readingLevelUpdated flag)
 *
 * @param {Object} assessmentData - Assessment data from the API
 * @returns {JSX.Element} The assessment results UI
 */
const AssessmentResults = ({ assessmentData }) => {
  // State to track which skill category is expanded
  const [expandedSkill, setExpandedSkill] = useState(null);

  // If no assessment data is provided, show an empty state
  if (!assessmentData) {
    return (
      <div className="assessment-results__empty-state">
        <h3>No Assessment Data Available</h3>
        <p>The assessment may not have been completed yet for this student.</p>
      </div>
    );
  }

  // Toggle expanded skill category
  const toggleSkill = (index) => {
    setExpandedSkill(expandedSkill === index ? null : index);
  };

  /**
   * Get the CSS class for a skill category bar
   * Different categories have different color treatments
   */
  const getSkillClass = (category) => {
    // Map category names to CSS classes for consistent styling
    const categoryClasses = {
      'Alphabet Knowledge': 'assessment-results__skill-bar--patinig',
      'Phonological Awareness': 'assessment-results__skill-bar--pantig',
      'Word Recognition': 'assessment-results__skill-bar--salita',
      'Decoding': 'assessment-results__skill-bar--salita', // Using same style as Word Recognition
      'Reading Comprehension': 'assessment-results__skill-bar--pag-unawa',
      // Legacy category names for backward compatibility
      'Patinig': 'assessment-results__skill-bar--patinig',
      'Pantig': 'assessment-results__skill-bar--pantig',
      'Pagkilala ng Salita': 'assessment-results__skill-bar--salita',
      'Pag-unawa sa Binasa': 'assessment-results__skill-bar--pag-unawa'
    };

    return categoryClasses[category] || 'assessment-results__skill-bar--patinig';
  };

  /**
   * Generate recommendation text based on reading level and scores
   * This is a placeholder - in actual implementation, this would be 
   * driven by the backend assessment logic
   */
  const getRecommendationText = () => {
    // You can enhance this with more sophisticated logic based on scores
    // For now it's a simple mapping from reading level to recommendation
    const level = assessmentData.readingLevel || 'Not Assessed';

    const recommendations = {
      'Low Emerging': 'Based on the assessment, we recommend focusing on alphabet knowledge and basic phonological awareness. The student should practice letter recognition and phoneme identification with visual aids.',
      'High Emerging': 'Based on the assessment, we recommend focusing on syllable blending and basic word decoding. The student should practice with common word patterns and simple texts.',
      'Developing': 'Based on the assessment, we recommend focusing on word recognition and simple reading comprehension. The student should work with short sentences and identify main ideas.',
      'Transitioning': 'Based on the assessment, we recommend focusing on paragraph comprehension and fluency. The student should practice with longer texts and identify key details.',
      'At Grade Level': 'Based on the assessment, we recommend continuing with grade-level materials while focusing on deeper comprehension and vocabulary extension.',
      'Advanced': 'Based on the assessment, we recommend providing more challenging reading materials and focusing on critical thinking and analysis skills.',
      'Not Assessed': 'A complete assessment is needed to provide targeted recommendations.'
    };

    return recommendations[level] ||
      `Based on the assessment, we recommend focusing on ${assessmentData.focusAreas || 'all fundamental reading skills'}.`;
  };

  /**
   * Format date for display
   * @param {string} dateString - Date string from assessment data
   * @returns {string} Formatted date string
   */
  const formatDate = (dateString) => {
    if (!dateString) return "Not available";

    try {
      const date = new Date(dateString);

      // Check if date is valid
      if (isNaN(date.getTime())) {
        return dateString;
      }

      // Format as Month DD, YYYY
      return new Intl.DateTimeFormat('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      }).format(date);
    } catch (e) {
      return dateString;
    }
  };

  /**
   * Get skill level description based on score
   * @param {number} score - Skill category score (0-100)
   * @returns {Object} Level info with label and CSS class
   */
  const getSkillLevel = (score) => {
    if (score >= 85) return { label: 'Excellent', className: 'skill-excellent' };
    if (score >= 70) return { label: 'Good', className: 'skill-good' };
    if (score >= 50) return { label: 'Average', className: 'skill-average' };
    return { label: 'Needs Practice', className: 'skill-needs-improvement' };
  };

  // Extract assessment date from various possible properties
  const assessmentDate = formatDate(
    assessmentData.assessmentDate ||
    assessmentData.lastAssessmentDate ||
    assessmentData.createdAt
  );

  // Extract categories from assessment data (handle different formats)
  const skillCategories = assessmentData.skillDetails ||
    assessmentData.categories ||
    [];

  return (
    <div className="assessment-results">
      {/* Assessment Information Banner */}
      <div className="assessment-results__info-banner">
        <div className="assessment-results__info-icon">
          <FaInfoCircle />
        </div>
        <div className="assessment-results__info-content">
          <h3>Comprehensive Reading and Literacy Assessment (CRLA)</h3>
          <p>
            Based on the assessment conducted on <strong>{assessmentDate}</strong>,
            this student is currently at the <strong>{assessmentData.readingLevel || 'Not Assessed'}</strong> reading level.
            Below are the detailed results of their reading abilities by skill category.
          </p>
        </div>
      </div>

      {/* Assessment Overview */}
      <div className="assessment-results__overview">
        <div className="assessment-results__overview-header">
          <h3>
            <FaGraduationCap className="assessment-results__overview-icon" />
            Assessment Overview
          </h3>

          <div className="assessment-results__score-badge">
            {assessmentData.overallScore || Math.round(
              skillCategories.reduce((sum, cat) => sum + (cat.score || 0), 0) /
              (skillCategories.length || 1)
            )}%
          </div>
        </div>

        <div className="assessment-results__overview-grid">
          <div className="assessment-results__overview-item">
            <div className="assessment-results__overview-item-icon">
              <FaBookOpen />
            </div>
            <div className="assessment-results__overview-item-content">
              <div className="assessment-results__overview-item-label">
                Reading Level
              </div>
              <div className="assessment-results__overview-item-value">
                {assessmentData.readingLevel || 'Not Assessed'}
              </div>
            </div>
          </div>

          <div className="assessment-results__overview-item">
            <div className="assessment-results__overview-item-icon">
              <FaCalendarAlt />
            </div>
            <div className="assessment-results__overview-item-content">
              <div className="assessment-results__overview-item-label">
                Assessment Date
              </div>
              <div className="assessment-results__overview-item-value">
                {assessmentDate}
              </div>
            </div>
          </div>

          <div className="assessment-results__overview-item">
            <div className="assessment-results__overview-item-icon">
              <FaArrowRight />
            </div>
            <div className="assessment-results__overview-item-content">
              <div className="assessment-results__overview-item-label">
                Assessment Type
              </div>
              <div className="assessment-results__overview-item-value">
                {assessmentData.assessmentType || 'Standard'} Assessment
              </div>
            </div>
          </div>

          <div className="assessment-results__overview-item">
            <div className="assessment-results__overview-item-icon">
              <FaClock />
            </div>
            <div className="assessment-results__overview-item-content">
              <div className="assessment-results__overview-item-label">
                Completion Time
              </div>
              <div className="assessment-results__overview-item-value">
                {assessmentData.duration ? `${assessmentData.duration} minutes` : 'Not recorded'}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Skill Analysis Section */}
      <div className="assessment-results__skills-section">
        <h3 className="assessment-results__section-title">
          <FaChartBar className="assessment-results__section-icon" />
          Reading Skills Analysis
        </h3>

        <div className="assessment-results__skill-list">
          {/* Map through the skill categories and render each one */}
          {skillCategories.map((skill, index) => {
            // Extract category name and score from different potential formats
            const categoryName = skill.category || skill.categoryName || 'Skill Area';
            const score = skill.score || 0;
            const totalQuestions = skill.totalQuestions || 10;
            const correctAnswers = skill.correctAnswers || 0;
            const isPassed = skill.isPassed || score >= 75;

            // Get skill level info based on score
            const skillLevel = getSkillLevel(score);

            // Analysis text (use provided or generate based on score)
            const analysisText = skill.analysis ||
              `The student got ${correctAnswers} out of ${totalQuestions} questions correct
                                 in this skill area, achieving a ${score}% score.
                                 ${isPassed ? 'They have passed this skill category.' : 'They need more practice in this area.'}`;

            return (
              <div key={index} className="assessment-results__skill-item">
                <div className="assessment-results__skill-header">
                  <div className="assessment-results__skill-title">
                    <span className="assessment-results__skill-name">{categoryName}</span>
                    <span className="assessment-results__skill-score">{score}%</span>
                  </div>
                  <button
                    className="assessment-results__expand-btn"
                    onClick={() => toggleSkill(index)}
                    aria-label={expandedSkill === index ? "Collapse details" : "Expand details"}
                  >
                    {expandedSkill === index ? <FaChevronUp /> : <FaChevronDown />}
                  </button>
                </div>

                <div className="assessment-results__skill-bar-wrapper">
                  <div
                    className={`assessment-results__skill-bar ${getSkillClass(categoryName)}`}
                    style={{ width: `${score}%` }}
                    aria-valuenow={score}
                    aria-valuemin="0"
                    aria-valuemax="100"
                  ></div>
                </div>

                <div className="assessment-results__skill-analysis">
                  <p>{analysisText}</p>
                </div>

                {/* Expanded details - show sample questions if available */}
                {expandedSkill === index && skill.sampleQuestions && skill.sampleQuestions.length > 0 && (
                  <div className="assessment-results__skill-details">
                    <h4>Sample Questions</h4>
                    <div className="assessment-results__sample-questions">
                      {skill.sampleQuestions.map((question, qIndex) => (
                        <div key={qIndex} className="assessment-results__question-item">
                          <div className="assessment-results__question-text">
                            <span className="assessment-results__question-number">Q{qIndex + 1}:</span>
                            {question.text}
                          </div>

                          <div className="assessment-results__question-answers">
                            <div className="assessment-results__answer-row">
                              <div className="assessment-results__answer-label">Student's Answer:</div>
                              <div className={`assessment-results__answer-value 
                                ${question.correct ? 'assessment-results__answer--correct' : 'assessment-results__answer--incorrect'}`}>
                                {question.studentAnswer}
                                {question.correct ? (
                                  <FaCheck className="assessment-results__icon-correct" />
                                ) : (
                                  <FaTimes className="assessment-results__icon-incorrect" />
                                )}
                              </div>
                            </div>

                            {!question.correct && (
                              <div className="assessment-results__answer-row">
                                <div className="assessment-results__answer-label">Correct Answer:</div>
                                <div className="assessment-results__answer-value assessment-results__answer--correct">
                                  {question.correctAnswer}
                                </div>
                              </div>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Recommendations Section */}
      <div className="assessment-results__conclusion">
        <h3 className="assessment-results__conclusion-title">Recommendations</h3>
        <p className="assessment-results__conclusion-text">
          {getRecommendationText()}
        </p>
        <div className="assessment-results__focus-areas">
          <strong>Primary Focus Areas:</strong>
          <span className="assessment-results__focus-value">
            {assessmentData.focusAreas ||
              (skillCategories
                .filter(skill => (skill.score || 0) < 70)
                .map(skill => skill.category || skill.categoryName)
                .join(', ') || 'All fundamental reading skills')}
          </span>
        </div>
      </div>

      {/* Note about assessment process - important for context */}
      <div className="assessment-results__process-note">
        <div className="assessment-results__process-note-icon">
          <FaInfoCircle />
        </div>
        <div className="assessment-results__process-note-text">
          <p>
            <strong>Assessment Process:</strong> Reading levels are determined by a student's performance across multiple skill categories.
            Pre-assessment establishes an initial reading level, while subsequent assessments can advance a student's
            level when they demonstrate significant improvement.
          </p>
        </div>
      </div>
    </div>
  );
};

export default AssessmentResults;