// src/pages/Teachers/StudentProgressView.jsx
import React, { Component } from "react";
import { useParams, useLocation, useNavigate } from "react-router-dom";
import "../../css/Teachers/studentProgressView.css";
import * as Dialog from "@radix-ui/react-dialog";


/* ─────────────────────────────────────────────────────────────── */
/*  SERVICE LAYER – swap for real Mongo queries later             */
/* ─────────────────────────────────────────────────────────────── */
class PracticeModuleService {
  static getTemplatesForConcept(concept) {
    // MOCK: return [] to simulate “no template” for most concepts
    const MOCK = {
      "Vowel Sound": [{ id: "tpl‑1", title: "Vowel Drill A‑E", itemCount: 10 }]
    };
    return MOCK[concept] ?? [];
  }
}


/* ─────────────────────────────────────────────────────────────── */
/*  SMALL DIALOG – shown when “Assign Practice Module” is pressed */
/* ─────────────────────────────────────────────────────────────── */
class AssignPracticeModuleDialog extends Component {
  constructor(props) {
    super(props);
    this.state = {
      templates: PracticeModuleService.getTemplatesForConcept(props.concept)
    };
  }
  componentDidUpdate(prev) {
    if (prev.concept !== this.props.concept) {
      this.setState({
        templates: PracticeModuleService.getTemplatesForConcept(
          this.props.concept
        )
      });
    }
  }
  render() {
    const { isOpen, onClose, concept, onAssign, onCreate } = this.props;
    const { templates } = this.state;
    if (!isOpen) return null;

    return (

      <Dialog.Root open={isOpen} onOpenChange={onClose}>
        <Dialog.Portal>
          <Dialog.Overlay className="dialog-overlay" />
          <Dialog.Content className="assign-dialog-content">
            <Dialog.Title className="assign-dialog-title">
              Assign Practice Module<br />
              <span className="concept-title">– {concept}</span>
            </Dialog.Title>

            {templates.length === 0 ? (
              <div className="assign-empty-state">
                <p className="empty-message">No ready-made templates found for this concept.</p>
                <button className="btn btn-create" onClick={onCreate}>
                  Create Practice Module
                </button>
              </div>
            ) : (
              <ul className="assign-template-list">
                {templates.map(t => (
                  <li key={t.id} className="assign-template-item">
                    <div className="template-info">
                      <strong>{t.title}</strong>
                      <span className="item-count">({t.itemCount} items)</span>
                    </div>
                    <button
                      className="btn btn-assign"
                      onClick={() => onAssign(t)}
                    >
                      Assign
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>

    );
  }
}


/**
 * Utility function that maps category name to a color class
 */
const getCategoryColorClass = (categoryName) => {
  const colorMap = {
    ponetiko: "ponetiko",
    pagpapantig: "pagpapantig",
    salita: "salita",
    "pag-unawa": "pag-unawa",
  };
  return colorMap[categoryName.toLowerCase()] || "default-skill-bar";
};

/* ------------------------------------------
   COMPONENT: StudentInfoCard 
------------------------------------------ */
class StudentInfoCard extends Component {
  render() {
    const { student } = this.props;
    return (
      <div className="student-info-card">
        <div className="avatar-container">
          <div className="avatar-circle">{student.name.charAt(0)}</div>
        </div>
        <div className="student-details">
          <h2>{student.name}</h2>
          <div className="detail-item">
            <span>Age:</span> {student.age}
          </div>
          <div className="detail-item">
            <span>Reading Level:</span> {student.readingLevel}
          </div>
          <div className="detail-item">
            <span>Grade:</span> {student.gradeLevel}
          </div>
        </div>
      </div>
    );
  }
}

/* ------------------------------------------
   COMPONENT: ReadingProgressCard 
------------------------------------------ */
class ReadingProgressCard extends Component {
  constructor(props) {
    super(props);
    this.state = { showPercentage: false };
  }

  togglePercentage = () => {
    this.setState((prev) => ({ showPercentage: !prev.showPercentage }));
  };

  render() {
    const { student } = this.props;
    const total = student.totalActivities || 1;
    const completed = student.activitiesCompleted || 0;
    const progressPercentage = Math.round((completed / total) * 100);

    return (
      <div className="reading-progress-card">
        <div className="reading-progress-header">
          <h3>Reading Progress – {student.readingLevel}</h3>
          <span className="reading-progress-percent">
            ({progressPercentage}%)
          </span>
        </div>

        <div
          className="progress-bar-container"
          onMouseEnter={this.togglePercentage}
          onMouseLeave={this.togglePercentage}
        >
          <div className="progress-bar">
            <div
              className="progress-bar-fill"
              style={{ width: `${progressPercentage}%` }}
            />
          </div>
        </div>

        <div className="detail-item">
          <span>Aralin Completed:</span> {completed}/{total}
        </div>
        <div className="detail-item">
          <span>Recently Taken Activity:</span> {student.lastActivityDate}
        </div>
      </div>
    );
  }
}

/* ------------------------------------------
   COMPONENT: VisualizationSection
   - Skill Mastery Breakdown w/ Collapsible
   - Activity Scores Over Time w/ Dot Click 
------------------------------------------ */
class VisualizationSection extends Component {
  constructor(props) {
    super(props);
    this.state = {
      chartAnimated: false,
      selectedCategory: "Ponetiko",
      filter: "month",
      showDetailDate: null,
      hoveredBar: null,
      openSkillIndex: null,
    };
    this.chartRef = React.createRef();
  }

  componentDidMount() {
    setTimeout(() => this.setState({ chartAnimated: true }), 500);
  }

  toggleSkill = (index) => {
    this.setState((prev) => ({
      openSkillIndex: prev.openSkillIndex === index ? null : index,
    }));
  };

  toggleChartDetail = (dateStr) => {
    // if same date => close; else show
    this.setState((prev) => ({
      showDetailDate: prev.showDetailDate === dateStr ? null : dateStr,
    }));
  };

  getActiveData() {
    const { categorizedActivityScores } = this.props;
    const { selectedCategory, filter } = this.state;

    const catObj = categorizedActivityScores.find(
      (c) => c.category === selectedCategory
    );
    if (!catObj) return [];

    // Filter by week or month
    const now = new Date();
    const cutoff = new Date();
    if (filter === "week") {
      cutoff.setDate(now.getDate() - 7);
    } else if (filter === "month") {
      cutoff.setDate(now.getDate() - 30);
    }
    return catObj.data.filter((entry) => {
      const dateObj = new Date(`${entry.date} 2025`);
      return dateObj >= cutoff;
    });
  }

  render() {
    const { skillData } = this.props;
    const {
      chartAnimated,
      selectedCategory,
      filter,
      openSkillIndex,
      showDetailDate,
    } = this.state;


    const activeData = this.getActiveData();

    return (

      <div className="visualization-section">

        <div className="visualization-header-box">
          <div className="header-side left" />
          <div className="visualization-header-text">
            <span className="visualization-header-text">
              Progress Report: {this.props.student.readingLevel}
            </span>  </div>
          <div className="header-side right" />
        </div>


        <div className="visualization-content">



          {/* Left: Skill Mastery (collapsible) */}
          <div className="skill-progress">
            <h4 className="score-results-heading">Score Results</h4>
            <div className="skill-bars">
              {skillData.map((item, idx) => {
                const barWidth = chartAnimated ? `${item.value}%` : "0%";
                const isOpen = openSkillIndex === idx;

                // demo sub-skill questions
                const subSkillQuestions = [
                  {
                    question: "Which vowel is 'a'?",
                    studentAnswer: "e",
                    correctAnswer: "a",
                    isCorrect: false,
                  },
                  {
                    question: "Recognize consonant 'b'",
                    studentAnswer: "b",
                    correctAnswer: "b",
                    isCorrect: true,
                  },
                ];

                return (
                  <div key={idx} className="skill-bar-container-block">
                    <div
                      className="skill-bar"
                      onMouseEnter={() => this.setState({ hoveredBar: idx })}
                      onMouseLeave={() => this.setState({ hoveredBar: null })}
                    >
                      <div className="skill-name">
                        {item.label}
                        {this.state.hoveredBar === idx && (
                          <span className="score-tooltip">
                            Score Result: {item.completedCount} / {item.totalCount}
                          </span>
                        )}

                      </div>
                      <div className="skill-bar-container">
                        <div
                          className={`skill-bar-fill ${getCategoryColorClass(item.label)}`}
                          style={{ width: barWidth }}
                        />
                      </div>
                    </div>

                    <div className="view-questions-btn-container">
                      <button
                        className="btn-view-questions"
                        onClick={() => this.toggleSkill(idx)}
                      >
                        {isOpen ? "Hide Questions" : "View Questions"}
                        <span className="dropdown-icon">{isOpen ? "▲" : "▼"}</span>
                      </button>

                    </div>

                    {isOpen && (
                      <div className="skill-question-collapse">
                        <h5>Questions Breakdown</h5>
                        {subSkillQuestions.map((q, i) => (
                          <div key={i} className="sub-question-item updated-format">
                            <div className="question-text">
                              <strong>Q{i + 1}:</strong> {q.question}
                            </div>
                            <div
                              className={`answer-status ${q.isCorrect ? "correct" : "incorrect"
                                }`}
                            >
                              {q.isCorrect ? "Correct" : "Incorrect"}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                );
              })}
            </div>
          </div>

          {/* Right: Activity Scores Over Time */}
          <div className="activity-chart">
            <h4>Activity Scores Progress</h4>
            <div className="filter-controls">
              <label htmlFor="filterSelect">Filter:</label>
              <select
                id="filterSelect"
                value={filter}
                onChange={(e) => this.setState({ filter: e.target.value })}
              >
                <option value="week">This Week</option>
                <option value="month">This Month</option>
              </select>
            </div>

            {/* Category Tabs */}
            <div className="category-tabs">
              {this.props.categorizedActivityScores.map((cat, i) => (
                <button
                  key={i}
                  className={selectedCategory === cat.category ? "active" : ""}
                  onClick={() => this.setState({ selectedCategory: cat.category })}
                >
                  {cat.category}
                </button>
              ))}
            </div>

            <div className="chart-container" ref={this.chartRef}>
              {/* Grid Lines */}
              <div className="chart-grid-lines">
                {[100, 80, 60, 40, 20].map((val, idx) => (
                  <div
                    key={idx}
                    className="chart-grid-line"
                    style={{ bottom: `${val}%` }}
                  >
                    <span className="chart-grid-label">{val}%</span>
                  </div>
                ))}
              </div>

              <div className="chart-line">
                {activeData.map((point, index) => {
                  const leftPos = `${(index * 100) / (activeData.length - 1)}%`;
                  const bottomPos = `${point.score}%`;
                  const isOpen = showDetailDate === point.date;

                  return (
                    <div
                      key={index}
                      className={`chart-point ${isOpen ? "active" : ""}`}
                      style={{
                        left: leftPos,
                        bottom: bottomPos,
                        opacity: chartAnimated ? 1 : 0,
                        transform: chartAnimated ? "translateY(0)" : "translateY(20px)",
                      }}
                      onClick={() =>
                        this.props.openActivityModal({
                          date: point.date,
                          category: selectedCategory,
                          score: point.score,
                          feedback: "Isabella struggles with vowels 'a' and 'e'.",
                          questions: [
                            { text: "Identify vowel 'a'", studentAnswer: "e", correctAnswer: "a", correct: false },
                            { text: "Identify consonant 'p'", studentAnswer: "p", correctAnswer: "p", correct: true },
                            { text: "Blend syllables 'ba-na-na'", studentAnswer: "banana", correctAnswer: "banana", correct: true },
                            { text: "Identify vowel 'i'", studentAnswer: "i", correctAnswer: "i", correct: true },
                            { text: "Identify vowel 'e'", studentAnswer: "a", correctAnswer: "e", correct: false },
                          ]
                        })
                      }
                    >
                      <div className="chart-point-dot" />
                      {/* Hover label */}
                      <div className="chart-point-hover">
                        {point.date} – {point.score}%
                      </div>

                      {/* On click detail panel */}
                      {isOpen && (
                        <div className="chart-detail-panel">
                          <h5>{point.date} Details</h5>
                          <p>Score: {point.score}%</p>

                          {/* Example question breakdown */}
                          <div className="sub-question-item">
                            <strong>Question:</strong> Identify vowel 'a'
                            <br />
                            <strong>Answer:</strong> i <span style={{ color: "red" }}>✘</span>
                          </div>
                          <div className="sub-question-item">
                            <strong>Question:</strong> Blend syllable 'ma-ga'
                            <br />
                            <strong>Answer:</strong> maga <span style={{ color: "green" }}>✔</span>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}

                {/* Lines between points */}
                <svg
                  className="chart-lines"
                  width="100%"
                  height="100%"
                  style={{ position: "absolute", bottom: 0, left: 0 }}
                >
                  {chartAnimated &&
                    activeData.map((point, idx) => {
                      if (idx < activeData.length - 1) {
                        const x1 = `${(idx * 100) / (activeData.length - 1)}%`;
                        const y1 = `${100 - point.score}%`;
                        const x2 = `${((idx + 1) * 100) / (activeData.length - 1)}%`;
                        const y2 = `${100 - activeData[idx + 1].score}%`;

                        return (
                          <line
                            key={idx}
                            x1={x1}
                            y1={y1}
                            x2={x2}
                            y2={y2}
                            stroke="#4f66c0"
                            strokeWidth="2"
                            className="chart-line-segment"
                          />
                        );
                      }
                      return null;
                    })}
                </svg>
              </div>

              <div className="chart-labels">
                {activeData.map((point, idx) => (
                  <div
                    key={idx}
                    className="chart-label"
                    style={{
                      left: `${(idx * 100) / (activeData.length - 1)}%`,
                      opacity: chartAnimated ? 1 : 0,
                      transform: chartAnimated ? "translateY(0)" : "translateY(10px)",
                    }}
                  >
                    {point.date}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }
}

const ActivityDetailModal = ({ isOpen, onClose, activity }) => {
  if (!activity) return null;

  return (
    <Dialog.Root open={isOpen} onOpenChange={onClose}>
      <Dialog.Portal>
        <Dialog.Overlay className="dialog-overlay" />
        <Dialog.Content className="dialog-content">
          <Dialog.Title className="dialog-title">
            Activity Details: {activity.date}
          </Dialog.Title>
          <p><strong>{activity.category} Score:</strong> {activity.score}%</p>

          <table className="activity-table">
            <thead>
              <tr>
                <th>Question</th>
                <th>Student Answer</th>
                <th>Correct Answer</th>
              </tr>
            </thead>
            <tbody>
              {activity.questions.map((q, idx) => (
                <tr key={idx}>
                  <td>{q.text}</td>
                  <td className={q.correct ? "correct-text" : "incorrect-text"}>
                    {q.studentAnswer}
                  </td>
                  <td className="correct-answer">{q.correctAnswer}</td>
                  <td className={q.correct ? "correct-text" : "incorrect-text"}>
                    {q.correct ? "Correct" : "Incorrect"}
                  </td>
                </tr>
              ))}
            </tbody>


          </table>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
};

/* ------------------------------------------
   COMPONENT: AnalysisCard 
------------------------------------------ */
class AnalysisCard extends Component {
  render() {
    const {
      title,
      status,
      lesson,
      score,
      note,
      recommendation,
      onAssignModule,
      onCreateModule,
    } = this.props;

    return (
      <div className="analysis-card">
        <div className="card-header">
          <h4>{title}</h4>
          <div className={`status-badge ${status.toLowerCase()}`}>{status}</div>
        </div>
        <div className="card-content">
          <div className="detail-item">
            <span>Aralin Uno:</span> {lesson}
          </div>
          <div className="detail-item">
            <span>Student Score:</span> {score}%
          </div>
          <div className="analysis-note">{note}</div>
          <div className="recommendation-section">
            <div className="recommendation-label">
              Recommendation: {recommendation}
            </div>
            <div className="action-buttons">
              <button className="btn btn-primary" onClick={onAssignModule}>
                Assign Practice Module
              </button>
              <button className="btn btn-secondary" onClick={onCreateModule}>
                Create Practice Module
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }
}

/* ------------------------------------------
   COMPONENT: PracticeModuleCard
------------------------------------------ */
class PracticeModuleCard extends Component {
  render() {
    const {
      title,
      concept,
      category,
      antas,
      assignedDate,
      status,
      onViewModule,
    } = this.props;

    return (
      <div className="module-card">
        <div className="module-info">
          <h4>{title}</h4>
          <div className="detail-item">
            <span>Linked Concept:</span> {concept} • Category: {category} • Antas:{" "}
            {antas}
          </div>
          <div className="detail-item">
            <span>Assigned Date:</span> {assignedDate}
          </div>
          <div
            className={`status-badge ${status.toLowerCase().replace(" ", "-")}`}
          >
            {status}
          </div>
        </div>
        <div className="module-actions">
          <button className="btn btn-secondary" onClick={onViewModule}>
            View Module
          </button>
        </div>
      </div>
    );
  }
}

/* ------------------------------------------
   COMPONENT: ActivityCard
------------------------------------------ */
class ActivityCard extends Component {
  render() {
    const {
      title,
      concept,
      category,
      antas,
      assignedDate,
      score,
      status,
      notification,
      actionText,
      onAction,
    } = this.props;

    return (
      <div className="activity-card">
        <div className="activity-info">
          <h4>{title}</h4>
          <div className="detail-item">
            <span>Linked Concept:</span> {concept} • Category: {category} • Antas:{" "}
            {antas}
          </div>
          <div className="detail-item">
            <span>Assigned Date:</span> {assignedDate}{" "}
            {score && (
              <>
                • <span>Score:</span> {score}
              </>
            )}
          </div>
          <div className={`status-badge ${status.toLowerCase()}`}>{status}</div>
          {notification && (
            <div className={`notification-box ${notification.type}`}>
              {notification.messages.map((msg, idx) => (
                <p key={idx}>{msg}</p>
              ))}
            </div>
          )}
        </div>
        <div className="activity-actions">
          <button className="btn btn-primary" onClick={onAction}>
            {actionText}
          </button>
        </div>
      </div>
    );
  }
}

/* ------------------------------------------
   COMPONENT: ApprovalCard
------------------------------------------ */
class ApprovalCard extends Component {
  constructor(props) {
    super(props);
    this.state = {
      isApproved: props.isApproved || false,
    };
  }

  handleReassessment = () => {
    if (this.props.onReassessment) {
      this.props.onReassessment();
    }
  };

  render() {
    const { title, concept, category, antas, submissionDate, status } =
      this.props;
    const { isApproved } = this.state;

    return (
      <div className="approval-card">
        <div className="approval-info">
          <h4>{title}</h4>
          <div className="detail-item">
            <span>Linked Concept:</span> {concept} • Category: {category} • Antas:{" "}
            {antas}
          </div>
          <div className="detail-item">
            <span>Submission Date:</span> {submissionDate}
          </div>
          <div className={`status-badge ${status.toLowerCase()}`}>{status}</div>

          {status.toLowerCase() === "pending" ? (
            <div className="notification-box warning">
              <p>Please wait for the Admin to approve the edited activity</p>
              <p>This will allow for subsequent reassessment</p>
            </div>
          ) : (
            <div className="notification-box info">
              <p>
                Admin has approved the activity. The student can now take the
                activity again with edited information.
              </p>
              <p>
                Customize the assessment to verify mastery of specific concepts.
              </p>
            </div>
          )}
        </div>
        <div className="approval-actions">
          <button
            className="btn btn-primary"
            onClick={this.handleReassessment}
            disabled={status.toLowerCase() === "pending"}
          >
            Re-assessment
          </button>
        </div>
      </div>
    );
  }
}

/* ------------------------------------------
   MAIN: StudentProgressViewContent
   TABBED LAYOUT (progress/modules/admin)
   w/ sub-skill + chart detail expansions
------------------------------------------ */
class StudentProgressViewContent extends Component {
  constructor(props) {
    super(props);
    this.state = {
      activeTab: "progress",
      selectedActivity: null,
      isModalOpen: false,

      // Student summary
      student: {
        id: "999",
        name: "Isabella Cruz",
        gradeLevel: "Grade One",
        readingLevel: "Antas Una",
        age: 5,
        activitiesCompleted: 10,
        totalActivities: 15,
        lastActivityDate: "April 1, 2025",
      },

      // Skill Mastery Data
      skillData: [
        {
          label: "Ponetiko",
          value: 45,
          completedCount: 4,
          totalCount: 10,
        },
        {
          label: "Pagpapantig",
          value: 65,
          completedCount: 7,
          totalCount: 10,
        },
        {
          label: "Salita",
          value: 75,
          completedCount: 6,
          totalCount: 8,
        },
        {
          label: "Pag-unawa",
          value: 90,
          completedCount: 9,
          totalCount: 10,
        },
      ],

      // Original single-line array
      activityScores: [
        { date: "Mar 1", score: 62 },
        { date: "Mar 8", score: 68 },
        { date: "Mar 15", score: 70 },
        { date: "Mar 22", score: 65 },
        { date: "Mar 29", score: 78 },
        { date: "Apr 1", score: 85 },
      ],

      // Multi-line data for each category
      categorizedActivityScores: [
        {
          category: "Ponetiko",
          data: [
            { date: "Mar 8", score: 45 },
            { date: "Mar 19", score: 11 },
            { date: "Mar 30", score: 60 },
            { date: "Apr 3", score: 70 },
            { date: "Apr 6", score: 82 },
            { date: "Apr 9", score: 88 },
          ],
        },
        {
          category: "Pagpapantig",
          data: [
            { date: "Mar 1", score: 55 },
            { date: "Mar 15", score: 70 },
            { date: "Mar 28", score: 63 },
            { date: "Apr 4", score: 80 },
            { date: "Apr 7", score: 77 },
            { date: "Apr 10", score: 85 },
          ],
        },
        {
          category: "Salita",
          data: [
            { date: "Mar 1", score: 68 },
            { date: "Mar 8", score: 75 },
            { date: "Mar 22", score: 60 },
            { date: "Apr 5", score: 83 },
            { date: "Apr 8", score: 90 },
            { date: "Apr 9", score: 92 },
          ],
        },
        {
          category: "Pagunawa",
          data: [
            { date: "Mar 5", score: 89 },
            { date: "Mar 15", score: 80 },
            { date: "Mar 29", score: 77 },
            { date: "Apr 6", score: 84 },
            { date: "Apr 9", score: 91 },
            { date: "Apr 10", score: 87 },
          ],
        },
      ],

      adminApprovalStatus: "pending",
    };

  }

  /* ── Activity modal ─────────────────────────── */

  openActivityModal = (activity) => {
    this.setState({ selectedActivity: activity, isModalOpen: true });
  };
  closeActivityModal = () => {
    this.setState({ selectedActivity: null, isModalOpen: false });
  };

  /* ── Assign dialog ──────────────────────────── */
  openAssignDialog = (concept) => {
    this.setState({ assignDialogOpen: true, dialogConcept: concept });
  };



  closeAssignDialog = () =>
    this.setState({ assignDialogOpen: false, dialogConcept: null });
  handleAssignTemplate = tpl => {
    alert(`Template «${tpl.title}» assigned!`);
    this.closeAssignDialog();
  };
  handleCreateModule = concept => {
    this.props.navigate("/teachers/create-practice-module", {
      state: { concept }
    });
    this.closeAssignDialog();
  };



  componentDidMount() {
    // In real code, fetch from DB or API
  }

  /* misc */
  setTab = t => this.setState({ activeTab: t });

  toggleApprovalStatus = () => {
    this.setState((prev) => ({
      adminApprovalStatus:
        prev.adminApprovalStatus === "pending" ? "approved" : "pending",
    }));
  };

  handleAction = (action) => {
    alert(`Action triggered: ${action}`);
  };

  render() {
    const {
      activeTab,
      student,
      skillData,
      activityScores,
      categorizedActivityScores,
      adminApprovalStatus,
    } = this.state;

    return (
      <div className="student-progress-container">
        <div className="student-progress-view">
          {/* Header */}
          <div className="progress-header">
            <h1>Student Progress & Prescriptive Analysis</h1>
            <p>
              Track individual student progress, system recommendations,
              and personalized interventions
            </p>
          </div>

          {/* TAB CONTENT */}
          {activeTab === "progress" && (
            <>
              {/* Student Profile + Reading Progress */}
              <div className="top-cards-container">
                <StudentInfoCard student={student} />
                <ReadingProgressCard student={student} />
              </div>


              {/* Tab Navigation */}
              <div className="tab-navigation" style={{ padding: "0 20px" }}>
                <button
                  className={`btn-tab ${activeTab === "progress" ? "active-tab" : ""}`}
                  onClick={() => this.setTab("progress")}
                >
                  Progress
                </button>
                <button
                  className={`btn-tab ${activeTab === "modules" ? "active-tab" : ""}`}
                  onClick={() => this.setTab("modules")}
                >
                  Edit Modules
                </button>
                <button
                  className={`btn-tab ${activeTab === "admin" ? "active-tab" : ""}`}
                  onClick={() => this.setTab("admin")}
                >
                  Admin Approval
                </button>
              </div>

              {/* Visualization (Skill + line chart) */}
              <VisualizationSection
                student={student}
                skillData={skillData}
                activityScores={activityScores}
                categorizedActivityScores={categorizedActivityScores}
                openActivityModal={this.openActivityModal}
              />

              {/* Prescriptive Analysis */}
              <div style={{ padding: "20px" }}>
                <div className="analysis-section-header-box">
                  <div className="analysis-header-side" />
                  <div className="analysis-header-text">Prescriptive Analysis</div>
                  <div className="analysis-header-side right" />
                </div>
                <div className="analysis-container">
                  <AnalysisCard
                    title="Vowel Sound Identification"
                    status="Pending"
                    lesson="Elementary Ponetiko"
                    score={38}
                    note="Isabella struggles with vowel (a-e-i-o-u) recognition. Assign targeted vowel sound activities to improve phonetic skills."
                    recommendation="Assign vowel-sound drill"
                    onAssignModule={() => this.openAssignDialog("Vowel Sound")}   // ✅ Actual dialog!
                    onCreateModule={() => this.handleCreateModule("Vowel Sound")}
                  />

                  <AnalysisCard
                    title="Syllable Blending"
                    status="Completed"
                    lesson="Pagpapantig Gawain 3"
                    score={45}
                    note="Isabella has difficulty blending 'ng' syllables."
                    recommendation="Practice syllable combinations"
                    onAssignModule={() =>
                      this.openAssignDialog("Assign syllable practice")
                    }
                    onCreateModule={() =>
                      this.handleCreateModule("Create syllable module")
                    }
                  />
                </div>
              </div>
            </>
          )}

          {activeTab === "modules" && (
            <div style={{ padding: "20px" }}>

              <h2>Assigned Practice Modules</h2>
              <PracticeModuleCard
                title="Vowel Drill A-E"
                concept="Vowel Sound"
                category="Ponetiko"
                antas="Una"
                assignedDate="March 15, 2025"
                status="In Progress"
                onViewModule={() => this.handleAction("View vowel drill module")}
              />

              <h2 style={{ marginTop: "30px" }}>
                Edit Activity for Reassessment
              </h2>
              <ActivityCard
                title="Syllable Blending Practice"
                concept="Syllable Blending"
                category="Pagpapantig"
                antas="Dalawa"
                assignedDate="March 22, 2025"
                score="90%"
                status="Completed"
                notification={{
                  type: "success",
                  messages: [
                    "Student passed the practice module. You may edit the original activity before reassessment.",
                    "Customize to verify mastery of specific concepts.",
                  ],
                }}
                actionText="Edit Activity Instance"
                onAction={() => this.handleAction("Edit activity")}
              />
            </div>
          )}

          {activeTab === "admin" && (
            <div style={{ padding: "20px" }}>
              <h2>Admin Approval with Edit Activity</h2>
              <ApprovalCard
                title="Syllable Blending Practice"
                concept="Syllable Blending"
                category="Pagpapantig"
                antas="Dalawa"
                submissionDate="April 8, 2025"
                status={adminApprovalStatus}
                onReassessment={() => this.handleAction("Start reassessment")}
              />

              <div className="demo-controls">
                <button
                  className="btn btn-secondary"
                  onClick={this.toggleApprovalStatus}
                >
                  Toggle Approval Status (Demo)
                </button>
              </div>
            </div>
          )}
        </div>

        {this.state.isModalOpen && this.state.selectedActivity && (
          <div className="custom-modal-overlay">
            <div className="custom-modal">
              <button className="modal-close-btn" onClick={this.closeActivityModal}>×</button>
              <h2>Activity Details: {this.state.selectedActivity.date}</h2>
              <p><strong>{this.state.selectedActivity.category} Score:</strong> {this.state.selectedActivity.score}%</p>

              <table className="modal-table">
                <thead>
                  <tr>
                    <th>Question</th>
                    <th>Student Answer</th>
                    <th>Correct Answer</th>
                  </tr>
                </thead>
                <tbody>
                  {this.state.selectedActivity.questions.map((q, idx) => (
                    <tr key={idx}>
                      <td>{q.text}</td>
                      <td className={`student-answer ${q.correct ? "correct" : "incorrect"}`}>
                        {q.studentAnswer}
                      </td>
                      <td className={`correct-answer ${q.correct ? "highlight" : ""}`}>
                        {q.correctAnswer}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>

              <div className="feedback-box">
                <h4>LOLL</h4>
                <p>{this.state.selectedActivity.feedback}</p>
              </div>
            </div>
          </div>
        )}

        {/* Assign‑Practice‑Module dialog */}
        <AssignPracticeModuleDialog
          isOpen={this.state.assignDialogOpen}
          concept={this.state.dialogConcept}
          onAssign={this.handleAssignTemplate}
          onCreate={() => this.handleCreateModule(this.state.dialogConcept)}
          onClose={this.closeAssignDialog}
        />
      </div>




    );
  }


}


/* Wrapper: so we can use route params if needed */
const StudentProgressView = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  return (
    <StudentProgressViewContent id={id} navigate={navigate} location={location} />
  );
};

export default StudentProgressView;
