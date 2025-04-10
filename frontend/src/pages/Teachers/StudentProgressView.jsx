// src/pages/Teachers/StudentProgressView.jsx
import React, { Component } from "react";
import { useParams, useLocation, useNavigate } from "react-router-dom";
import "../../css/Teachers/studentProgressView.css";
import * as Dialog from "@radix-ui/react-dialog";



/* ─────────────────────────────────────────────────────────────── */
/*  SERVICE LAYER – future implementation will connect to MongoDB */
/* ─────────────────────────────────────────────────────────────── */
class PracticeModuleService {
  static getTemplatesForConcept(concept) {
    // In a future implementation, this would perform an API call to MongoDB.
    // For now, we use a MOCK which simply returns an array
    const MOCK = {
      "Vowel Sound": [{ id: "tpl-1", title: "Vowel Drill A-E", itemCount: 10 }]
    };
    return MOCK[concept] ?? [];
  }
}

/* ─────────────────────────────────────────────────────────────── */
/*  SMALL DIALOG – for Assigning Practice Module */
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
        templates: PracticeModuleService.getTemplatesForConcept(this.props.concept)
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
                <p className="empty-message">
                  No ready-made templates found for this concept.
                </p>
                <button className="btn btn-create" onClick={onCreate}>
                  Create Practice Module
                </button>
              </div>
            ) : (
              <ul className="assign-template-list">
                {templates.map((t) => (
                  <li key={t.id} className="assign-template-item">
                    <div className="template-info">
                      <strong>{t.title}</strong>
                      <span className="item-count">({t.itemCount} items)</span>
                    </div>
                    <button
                      className="btn btn-assign"
                      onClick={() => {
                        onAssign(t);
                        onClose(); // manually close after assigning
                      }}
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
 * Instead of mapping specific category names, we now return a default style.
 * In the future, you could modify this function to fetch dynamic styling info from MongoDB.
 */
const getCategoryColorClass = (category) => {
  switch (category) {
    case "Vowel Sound":
      return "ponetiko";
    case "Syllable Blending":
      return "pagpapantig";
    case "Word Recognition":
      return "salita";
    case "Reading Comprehension":
      return "pag-unawa";
    default:
      return "default-skill-bar";
  }
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
------------------------------------------ */
class VisualizationSection extends Component {
  constructor(props) {
    super(props);
    this.state = {
      chartAnimated: false,
      selectedCategory: "", // now dynamic (you may want to pass in a category field)
      filter: "month",
      showDetailDate: null,
      hoveredBar: null,
      openSkillIndex: null,
    };
    this.chartRef = React.createRef();
  }

  componentDidMount() {
    // Simulate an animation delay (e.g. chart animation)
    setTimeout(() => this.setState({ chartAnimated: true }), 500);
  }

  toggleSkill = (index) => {
    this.setState((prev) => ({
      openSkillIndex: prev.openSkillIndex === index ? null : index,
    }));
  };

  getActiveData() {
    const { categorizedActivityScores } = this.props;
    const { selectedCategory, filter } = this.state;
    // Instead of relying on fixed names, assume the data is dynamic
    const catObj = categorizedActivityScores.find(
      (c) => c.category === selectedCategory
    );
    if (!catObj) return [];
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
    const { chartAnimated, selectedCategory, filter, openSkillIndex, showDetailDate } =
      this.state;
    const activeData = this.getActiveData();

    return (
      <div className="visualization-section">
        <div className="visualization-content">
          {/* Left: Dynamic Skill Mastery */}
          <div className="skill-progress">
            <h4 className="score-results-heading">Score Results</h4>
            <div className="skill-bars">
              {skillData.map((item, idx) => {
                const barWidth = chartAnimated ? `${item.value}%` : "0%";
                const isOpen = openSkillIndex === idx;
                const subSkillQuestions = [
                  {
                    question: "Sample Question 1?",
                    studentAnswer: "Answer 1",
                    correctAnswer: "Answer 1",
                    isCorrect: true,
                  },
                  {
                    question: "Sample Question 2?",
                    studentAnswer: "Answer 2",
                    correctAnswer: "Answer 3",
                    isCorrect: false,
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
                            <div className={`answer-status ${q.isCorrect ? "correct" : "incorrect"}`}>
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

          {/* Right: Activity Scores (unchanged for now) */}
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
            <div className="activity-score-chart-container" ref={this.chartRef}>
            <div className="chart-grid-lines">
                {[100, 80, 60, 40, 20].map((val, idx) => (
                  <div key={idx} className="chart-grid-line" style={{ bottom: `${val}%` }}>
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
                        transform: chartAnimated ? "translateY(0)" : "translateY(20px)"
                      }}
                      onClick={() =>
                        this.props.openActivityModal({
                          date: point.date,
                          category: selectedCategory,
                          score: point.score,
                          feedback: "Sample feedback text.",
                          questions: [
                            { text: "Sample Q1", studentAnswer: "A", correctAnswer: "A", correct: true },
                            { text: "Sample Q2", studentAnswer: "B", correctAnswer: "C", correct: false }
                          ]
                        })
                      }
                    >
                      <div className="chart-point-dot" />
                      <div className="chart-point-hover">{point.date} – {point.score}%</div>
                      {isOpen && (
                        <div className="chart-detail-panel">
                          <h5>{point.date} Details</h5>
                          <p>Score: {point.score}%</p>
                          <div className="sub-question-item">
                            <strong>Question:</strong> Sample Question 1<br />
                            <strong>Answer:</strong> A <span style={{ color: "red" }}>✘</span>
                          </div>
                          <div className="sub-question-item">
                            <strong>Question:</strong> Sample Question 2<br />
                            <strong>Answer:</strong> B <span style={{ color: "green" }}>✔</span>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
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
                      transform: chartAnimated ? "translateY(0)" : "translateY(10px)"
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
};

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

    const getCategoryColorClass = (category) => {
  switch (category) {
    case "Vowel Sound":
      return "ponetiko";
    case "Syllable Blending":
      return "pagpapantig";
    case "Word Recognition":
      return "salita";
    case "Reading Comprehension":
      return "pag-unawa";
    default:
      return "default-skill-bar";
  }
};

    return (
      <div className={`analysis-card ${getCategoryColorClass()}`}>
        <div className="card-header">
          <h4>{title}</h4>
          <div className={`status-badge ${status.toLowerCase().replace(/\s+/g, "-")}`}>
            {status}
          </div>
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
            <span>Linked Concept:</span> {concept} • Category: {category} • Antas: {antas}
          </div>
          <div className="detail-item">
            <span>Assigned Date:</span> {assignedDate}
          </div>
          <div className={`status-badge ${status.toLowerCase().replace(" ", "-")}`}>
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
            <span>Linked Concept:</span> {concept} • Category: {category} • Antas: {antas}
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
    const { title, concept, category, antas, submissionDate, status } = this.props;
    return (
      <div className="approval-card">
        <div className="approval-info">
          <h4>{title}</h4>
          <div className="detail-item">
            <span>Linked Concept:</span> {concept} • Category: {category} • Antas: {antas}
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
                Admin has approved the activity. The student can now take the activity again with edited information.
              </p>
              <p>
                Customize to verify mastery of specific concepts.
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
   MAIN COMPONENT: StudentProgressViewContent
   TABBED LAYOUT (progress/modules/admin)
   with collapsible headers for the Progress Report and Prescriptive Analysis
------------------------------------------ */
class StudentProgressViewContent extends Component {
  constructor(props) {
    super(props);
    this.state = {
      activeTab: "progress",
      selectedActivity: null,
      isModalOpen: false,
      // Collapsible states
      showProgressReport: true,
      showAnalysisReport: true,
      showModules: true,
      showReassessment: true,
      showAdminApproval: true,
      // Student summary (will eventually come from database)
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
      // Skill Mastery Data – dynamic from database later
      skillData: [
        { label: "Vowel Sound", value: 45, completedCount: 4, totalCount: 10 },
        { label: "Syllable Blending", value: 65, completedCount: 7, totalCount: 10 },
        { label: "Word Recognition", value: 75, completedCount: 6, totalCount: 8 },
        { label: "Reading Comprehension", value: 90, completedCount: 9, totalCount: 10 },
      ],
      // Legacy overview scores (if needed)
      activityScores: [
        { date: "Mar 1", score: 62 },
        { date: "Mar 8", score: 68 },
        { date: "Mar 15", score: 70 },
        { date: "Mar 22", score: 65 },
        { date: "Mar 29", score: 78 },
        { date: "Apr 1", score: 85 },
      ],
      // Categorized data – dynamic by category from database in the future
      categorizedActivityScores: [
        {
          category: "Vowel Sound",
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
          category: "Syllable Blending",
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
          category: "Word Recognition",
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
          category: "Reading Comprehension",
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
      analysisCards: [
        {
          id: 1,
          title: "Vowel Sound Identification",
          concept: "Vowel Sound",
          status: "Pending",
          lesson: "Elementary Activity 1",
          score: 38,
          note: "Student struggles with vowel recognition. Targeted practice is recommended.",
          recommendation: "Assign vowel-sound drill",
        },
        {
          id: 2,
          title: "Syllable Blending",
          concept: "Syllable Blending",
          status: "Completed",
          lesson: "Activity 2",
          score: 45,
          note: "Difficulty blending syllables observed.",
          recommendation: "Practice syllable combinations",
        },
        {
          id: 3,
          title: "Word Recognition",
          concept: "Word Recognition",
          status: "Pending",
          lesson: "Activity 3",
          score: 50,
          note: "Assistance needed for high-frequency word identification.",
          recommendation: "Assign word recognition tasks",
        },
        {
          id: 4,
          title: "Reading Comprehension",
          concept: "Reading Comprehension",
          status: "Pending",
          lesson: "Activity 4",
          score: 40,
          note: "Struggles with comprehension questions.",
          recommendation: "Assign reading comprehension drills",
        },
      ],
      assignedModules: [],
      adminApprovalStatus: "pending",
      assignDialogOpen: false,
      dialogConcept: null,
      assignCardId: null,
    };
  }

  handleAssignPractice = (cardId, concept) => {
    this.setState({
      assignDialogOpen: true,
      dialogConcept: concept,
      assignCardId: cardId,
    });
  };

  // ── Activity modal ───────────────────────────
  openActivityModal = (activity) => {
    this.setState({ selectedActivity: activity, isModalOpen: true });
  };
  closeActivityModal = () => {
    this.setState({ selectedActivity: null, isModalOpen: false });
  };

  // ── Assign dialog ────────────────────────────
  closeAssignDialog = () => {
    this.setState({ assignDialogOpen: false, dialogConcept: null });
  };

  handleAssignTemplate = (tpl) => {
    const { assignCardId, student, dialogConcept } = this.state;
    // Determine the module category dynamically (this mapping can later be removed
    // in favor of dynamic data from MongoDB)
    const getCategoryForConcept = (concept) => {
      // In a dynamic solution, this field should come from the database.
      return concept; // Simply return the concept as the category for now.
    };
    const assignedModule = {
      id: assignCardId,
      title: tpl.title,
      concept: dialogConcept,
      category: getCategoryForConcept(dialogConcept),
      antas: student.readingLevel.split(" ")[1],
      assignedDate: new Date().toLocaleDateString("en-US", {
        month: "long",
        day: "numeric",
        year: "numeric",
      }),
      status: "In Progress",
    };
    this.setState((prev) => ({
      analysisCards: prev.analysisCards.map((card) =>
        card.id === assignCardId ? { ...card, status: "In Progress" } : card
      ),
      assignedModules: [...prev.assignedModules, assignedModule],
      assignDialogOpen: false,
      dialogConcept: null,
      assignCardId: null,
    }));
  };

  handleCreateModule = (concept) => {
    // Navigate to the Create Practice Module page (see below)
    this.props.navigate("/teacher/create-practice-module", {
      state: { concept },
    });
    this.closeAssignDialog();
  };

  setTab = (t) => this.setState({ activeTab: t });
  toggleApprovalStatus = () => {
    this.setState((prev) => ({
      adminApprovalStatus: prev.adminApprovalStatus === "pending" ? "approved" : "pending",
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
              Track individual student progress, system recommendations, and personalized interventions
            </p>
          </div>

          {/* Top Profile and Tabs */}
          <div className="top-cards-container">
            <StudentInfoCard student={student} />
            <ReadingProgressCard student={student} />
          </div>
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

          {/* Conditional Content */}
          {activeTab === "progress" && (
            <div>
              {/* Collapsible Progress Report */}
              <div
                className="visualization-header-box"
                onClick={() =>
                  this.setState((prev) => ({
                    showProgressReport: !prev.showProgressReport
                  }))
                }
                style={{ cursor: "pointer", padding: "20px", marginTop: "20px" }}
              >
                <div className="header-side"></div>
                <h2 className="visualization-header-text">
                  Progress Report: {student.readingLevel} {this.state.showProgressReport ? "▲" : "▼"}
                </h2>
                <div className="header-side right"></div>
              </div>
              {this.state.showProgressReport && (
                <VisualizationSection
                  student={student}
                  skillData={skillData}
                  activityScores={activityScores}
                  categorizedActivityScores={categorizedActivityScores}
                  openActivityModal={this.openActivityModal}
                />
              )}
              {/* Collapsible Prescriptive Analysis */}
              <div
                className="analysis-section-header-box"
                onClick={() =>
                  this.setState((prev) => ({
                    showAnalysisReport: !prev.showAnalysisReport
                  }))
                }
                style={{ cursor: "pointer", padding: "20px" }}
              >
                <div className="analysis-header-side"></div>
                <h2 className="analysis-header-text">
                  Prescriptive Analysis {this.state.showAnalysisReport ? "▲" : "▼"}
                </h2>
                <div className="analysis-header-side right"></div>
              </div>
              {this.state.showAnalysisReport && (
                <div className="analysis-container" style={{ padding: "0 20px" }}>
                  {this.state.analysisCards.map((card) => (
                    <AnalysisCard
                      key={card.id}
                      title={card.title}
                      status={card.status}
                      lesson={card.lesson}
                      score={card.score}
                      note={card.note}
                      recommendation={card.recommendation}
                      onAssignModule={() => this.handleAssignPractice(card.id, card.concept)}
                      onCreateModule={() => this.handleCreateModule(card.concept)}
                    />
                  ))}
                </div>
              )}
            </div>
          )}
          {activeTab === "modules" && (
            <div style={{ padding: "20px" }}>
              {/* Collapsible Assigned Practice Modules */}
              <div
                className="visualization-header-box"
                onClick={() =>
                  this.setState((prev) => ({ showModules: !prev.showModules }))
                }
                style={{ cursor: "pointer" }}
              >
                <div className="header-side"></div>
                <h2 className="visualization-header-text">
                  Assigned Practice Modules {this.state.showModules ? "▲" : "▼"}
                </h2>
                <div className="header-side right"></div>
              </div>
              {this.state.showModules &&
                this.state.assignedModules.map((mod, index) => (
                  <PracticeModuleCard
                    key={index}
                    title={mod.title}
                    concept={mod.concept}
                    category={mod.category}
                    antas={mod.antas}
                    assignedDate={mod.assignedDate}
                    status={mod.status}
                    onViewModule={() => this.handleAction(`View module for ${mod.title}`)}
                  />
                ))}
              {/* Collapsible Edit Activity for Reassessment */}
              <div
                className="visualization-header-box"
                onClick={() =>
                  this.setState((prev) => ({ showReassessment: !prev.showReassessment }))
                }
                style={{ cursor: "pointer", marginTop: "20px" }}
              >
                <div className="header-side"></div>
                <h2 className="visualization-header-text">
                  Edit Activity for Reassessment {this.state.showReassessment ? "▲" : "▼"}
                </h2>
                <div className="header-side right"></div>
              </div>
              {this.state.showReassessment && (
                <ActivityCard
                  title="Syllable Blending Practice"
                  concept="Syllable Blending"
                  category="Standard"  // now a generic category instead of a hardcoded name
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
              )}
            </div>
          )}
          {activeTab === "admin" && (
            <div style={{ padding: "20px" }}>
              {/* Collapsible Admin Approval */}
              <div
                className="visualization-header-box"
                onClick={() =>
                  this.setState((prev) => ({ showAdminApproval: !prev.showAdminApproval }))
                }
                style={{ cursor: "pointer" }}
              >
                <div className="header-side"></div>
                <h2 className="visualization-header-text">
                  Admin Approval with Edit Activity {this.state.showAdminApproval ? "▲" : "▼"}
                </h2>
                <div className="header-side right"></div>
              </div>
              {this.state.showAdminApproval && (
                <>
                  <ApprovalCard
                    title="Syllable Blending Practice"
                    concept="Syllable Blending"
                    category="Standard" // generic now
                    antas="Dalawa"
                    submissionDate="April 8, 2025"
                    status={adminApprovalStatus}
                    onReassessment={() => this.handleAction("Start reassessment")}
                  />
                  <div className="demo-controls">
                    <button className="btn btn-secondary" onClick={this.toggleApprovalStatus}>
                      Toggle Approval Status (Demo)
                    </button>
                  </div>
                </>
              )}
            </div>
          )}
          {/* Activity Detail Modal */}
          {this.state.isModalOpen && this.state.selectedActivity && (
            <div className="custom-modal-overlay">
              <div className="custom-modal">
                <button className="modal-close-btn" onClick={this.closeActivityModal}>
                  ×
                </button>
                <h2>Activity Details: {this.state.selectedActivity.date}</h2>
                <p>
                  <strong>{this.state.selectedActivity.category} Score:</strong> {this.state.selectedActivity.score}%
                </p>
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
                  <h4>Feedback</h4>
                  <p>{this.state.selectedActivity.feedback}</p>
                </div>
              </div>
            </div>
          )}
          {/* Assign‑Practice‑Module Dialog */}
          <AssignPracticeModuleDialog
            isOpen={this.state.assignDialogOpen}
            concept={this.state.dialogConcept}
            onAssign={this.handleAssignTemplate}
            onCreate={() => this.handleCreateModule(this.state.dialogConcept)}
            onClose={this.closeAssignDialog}
          />
        </div>
      </div>
    );
  }
}

/* Wrapper to use route params */
const StudentProgressView = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  return (
    <StudentProgressViewContent id={id} navigate={navigate} location={location} />
  );
};

export default StudentProgressView;
