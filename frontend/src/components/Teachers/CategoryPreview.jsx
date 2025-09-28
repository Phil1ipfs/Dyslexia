// src/components/Teachers/CategoryPreview.jsx
import React from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faFont,
  faVolumeUp,
  faPuzzlePiece,
  faBook,
  faGraduationCap,
  faCheckCircle,
  faInfoCircle,
  faListUl,
  faArrowRight,
  faCheckDouble,
  faEye
} from "@fortawesome/free-solid-svg-icons";
import "./CategoryPreview.css";

const CategoryPreview = ({ assessment, question, questionIndex }) => {
  const renderAlphabetKnowledge = () => (
    <div className="cp-alphabet-preview">
      <div className="cp-question-prompt">
        {question.questionImage && (
          <div className="cp-question-visual">
            <img
              src={question.questionImage}
              alt="Question visual"
              className="cp-question-image"
            />
          </div>
        )}
        <div className="cp-question-text">
          <p className="cp-prompt-text">{question.questionText}</p>
          {question.questionValue && (
            <div className="cp-question-value-display">
              <FontAwesomeIcon icon={faInfoCircle} />
              <span>Target: {question.questionValue}</span>
            </div>
          )}
        </div>
      </div>
      <div className="cp-multiple-choice-preview">
        <h5 className="cp-section-title">
          <FontAwesomeIcon icon={faListUl} /> Answer Choices
        </h5>
        <div className="cp-choices-grid">
          {question.choiceOptions?.map((choice, choiceIndex) => (
            <div key={choiceIndex} className={`cp-choice-item ${choice.isCorrect ? 'correct' : ''}`}>
              <div className="cp-choice-letter">{choice.optionId}</div>
              <div className="cp-choice-content">
                <span className="cp-choice-text">{choice.optionText}</span>
                {choice.isCorrect && (
                  <div className="cp-correct-indicator">
                    <FontAwesomeIcon icon={faCheckCircle} />
                    <span>Correct Answer</span>
                  </div>
                )}
                {choice.description && (
                  <p className="cp-choice-description">{choice.description}</p>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  const renderPhonologicalAwareness = () => (
    <div className="cp-phonological-preview">
      <div className="cp-question-prompt">
        <p className="cp-prompt-text">{question.questionText}</p>
      </div>
      {question.questionSet?.map((set, setIndex) => (
        <div key={setIndex} className="cp-matching-set">
          <div className="cp-audio-items-section">
            <h5 className="cp-section-title">
              <FontAwesomeIcon icon={faVolumeUp} /> Audio Elements
            </h5>
            <div className="cp-audio-items">
              {set.audioTexts?.map((audio, audioIndex) => (
                <div key={audioIndex} className="cp-audio-item">
                  <FontAwesomeIcon icon={faVolumeUp} />
                  <span>{audio}</span>
                </div>
              ))}
            </div>
          </div>
          <div className="cp-visual-items-section">
            <h5 className="cp-section-title">
              <FontAwesomeIcon icon={faEye} /> Visual Options
            </h5>
            <div className="cp-visual-items">
              {set.matchingOptions?.map((visual, visualIndex) => (
                <div key={visualIndex} className="cp-visual-item">
                  <span>{visual}</span>
                </div>
              ))}
            </div>
          </div>
          <div className="cp-correct-pairs-section">
            <h5 className="cp-section-title">
              <FontAwesomeIcon icon={faCheckDouble} /> Correct Pairs
            </h5>
            <div className="cp-correct-pairs">
              {set.correctPairs?.map((pair, pairIndex) => (
                <div key={pairIndex} className="cp-correct-pair">
                  {Object.entries(pair).map(([audio, visual]) => (
                    <div key={audio} className="cp-pair-connection">
                      <div className="cp-audio-element">
                        <FontAwesomeIcon icon={faVolumeUp} />
                        <span>{audio}</span>
                      </div>
                      <div className="cp-connection-line">
                        <FontAwesomeIcon icon={faArrowRight} />
                      </div>
                      <div className="cp-visual-element">
                        <span>{visual}</span>
                      </div>
                    </div>
                  ))}
                </div>
              ))}
            </div>
          </div>
        </div>
      ))}
    </div>
  );

  const renderDecoding = () => (
    <div className="cp-decoding-preview">
      <div className="cp-question-prompt">
        {question.questionImage && (
          <div className="cp-question-visual">
            <img
              src={question.questionImage}
              alt="Decoding visual"
              className="cp-question-image"
            />
          </div>
        )}
        <p className="cp-prompt-text">{question.questionText}</p>
      </div>
      {question.displaySequence && (
        <div className="cp-word-pattern-section">
          <h5 className="cp-section-title">
            <FontAwesomeIcon icon={faFont} /> Word Pattern
          </h5>
          <div className="cp-word-pattern">
            {question.displaySequence.map((letter, letterIndex) => (
              <div key={letterIndex} className={`cp-letter-slot ${letter === '_' ? 'blank' : 'filled'}`}>
                {letter === '_' ? '?' : letter}
              </div>
            ))}
          </div>
        </div>
      )}
      <div className="cp-drag-elements-section">
        <h5 className="cp-section-title">
          <FontAwesomeIcon icon={faPuzzlePiece} /> Available Letters
        </h5>
        <div className="cp-drag-elements">
          {question.dragElements?.map((element, elemIndex) => (
            <div key={elemIndex} className="cp-drag-element">
              {element}
            </div>
          ))}
        </div>
      </div>
      <div className="cp-correct-answer-section">
        <h5 className="cp-section-title">
          <FontAwesomeIcon icon={faCheckCircle} /> Correct Sequence
        </h5>
        <div className="cp-correct-sequence">
          {question.correctSequence?.map((letter, seqIndex) => (
            <div key={seqIndex} className="cp-correct-letter">
              {letter}
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  const renderWordRecognition = () => (
    <div className="cp-word-recognition-preview">
      <div className="cp-question-prompt">
        {question.questionImage && (
          <div className="cp-question-visual">
            <img
              src={question.questionImage}
              alt="Word recognition visual"
              className="cp-question-image"
            />
          </div>
        )}
        <p className="cp-prompt-text">{question.questionText}</p>
      </div>
      <div className="cp-display-word-section">
        <h5 className="cp-section-title">
          <FontAwesomeIcon icon={faBook} /> Sentence/Word
        </h5>
        <div className="cp-display-word">
          {question.displayWord}
        </div>
      </div>
      <div className="cp-blank-options-section">
        <h5 className="cp-section-title">
          <FontAwesomeIcon icon={faListUl} /> Answer Options
        </h5>
        <div className="cp-blank-options">
          {question.blankOptions?.map((option, optIndex) => (
            <div key={optIndex} className={`cp-blank-option ${question.correctAnswer?.includes(option) ? 'correct' : ''}`}>
              <span className="cp-option-text">{option}</span>
              {question.correctAnswer?.includes(option) && (
                <div className="cp-correct-indicator">
                  <FontAwesomeIcon icon={faCheckCircle} />
                  <span>Correct</span>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  const renderReadingComprehension = () => (
    <div className="cp-reading-comprehension-preview">
      <div className="cp-question-prompt">
        <p className="cp-prompt-text">{question.questionText}</p>
      </div>
      {question.passages && question.passages.length > 0 && (
        <div className="cp-story-section">
          <h5 className="cp-section-title">
            <FontAwesomeIcon icon={faBook} /> Story: {question.storyTitle}
          </h5>
          {question.passages.map((passage, passageIndex) => (
            <div key={passageIndex} className="cp-passage-card">
              <div className="cp-passage-header">
                <span className="cp-page-number">Page {passage.pageNumber}</span>
              </div>
              <div className="cp-passage-content">
                {passage.pageImage && (
                  <div className="cp-passage-image">
                    <img
                      src={passage.pageImage}
                      alt={`Page ${passage.pageNumber} illustration`}
                      className="cp-story-image"
                    />
                  </div>
                )}
                <div className="cp-passage-text">
                  <p>{passage.pageText}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
      <div className="cp-answer-section">
        <h5 className="cp-section-title">
          <FontAwesomeIcon icon={faCheckCircle} /> Correct Answer
        </h5>
        <div className="cp-correct-answer">
          <div className="cp-primary-answer">
            <span className="cp-answer-label">Primary:</span>
            <span className="cp-answer-text">{question.correctAnswer}</span>
          </div>
          {question.acceptableAnswers && question.acceptableAnswers.length > 0 && (
            <div className="cp-acceptable-answers">
              <span className="cp-answer-label">Also Accepted:</span>
              <div className="cp-answer-list">
                {question.acceptableAnswers.map((answer, answerIndex) => (
                  <span key={answerIndex} className="cp-acceptable-answer">
                    {answer}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );

  const getCategoryRenderer = () => {
    switch (assessment.category) {
      case 'Alphabet Knowledge':
        return renderAlphabetKnowledge();
      case 'Phonological Awareness':
        return renderPhonologicalAwareness();
      case 'Decoding':
        return renderDecoding();
      case 'Word Recognition':
        return renderWordRecognition();
      case 'Reading Comprehension':
        return renderReadingComprehension();
      default:
        return <div>Unknown category type</div>;
    }
  };

  const getCategoryIcon = () => {
    switch (assessment.category) {
      case 'Alphabet Knowledge': return faFont;
      case 'Phonological Awareness': return faVolumeUp;
      case 'Decoding': return faPuzzlePiece;
      case 'Word Recognition': return faBook;
      case 'Reading Comprehension': return faGraduationCap;
      default: return faBook;
    }
  };

  const getCategoryColor = () => {
    switch (assessment.category) {
      case 'Alphabet Knowledge': return '#8B5CF6'; // Purple
      case 'Phonological Awareness': return '#F59E0B'; // Amber
      case 'Decoding': return '#10B981'; // Emerald
      case 'Word Recognition': return '#3B82F6'; // Blue
      case 'Reading Comprehension': return '#EF4444'; // Red
      default: return '#6B7280'; // Gray
    }
  };

  return (
    <div className="cp-preview-question-card enhanced">
      <div className="cp-question-header" style={{'--category-color': getCategoryColor()}}>
        <div className="cp-question-number-circle">
          <span>{questionIndex + 1}</span>
        </div>
        <div className="cp-question-metadata">
          <div className="cp-question-title">
            Question {questionIndex + 1}
          </div>
          <div className="cp-question-type-badge">
            <FontAwesomeIcon
              icon={getCategoryIcon()}
              className="cp-question-type-icon"
            />
            {assessment.category}
          </div>
        </div>
      </div>
      <div className="cp-question-content">
        {getCategoryRenderer()}
      </div>
    </div>
  );
};

export default CategoryPreview;