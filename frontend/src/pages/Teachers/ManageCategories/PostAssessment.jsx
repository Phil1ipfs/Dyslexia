// src/pages/Teachers/ManageCategories/PostAssessment.jsx
import React, { useState, useEffect } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faPlus,
  faEdit,
  faEye,
  faTrash,
  faTimes,
  faExclamationTriangle,
  faSearch,
  faCheckCircle,
  faLock,
  faQuestion,
  faUpload,
  faBook,
  faFont,
  faImages,
  faFileAlt,
  faInfoCircle,
  faPuzzlePiece,
  faArrowRight,
  faArrowLeft,
  faChevronDown,
  faChevronUp,
  faFilter,
  faCheckDouble,
  faClipboardList,
  faChartLine,
  faUserGraduate,
  faLayerGroup,
  faCogs,
  faBullseye,
  faUsers,
  faGraduationCap
} from "@fortawesome/free-solid-svg-icons";
import "../../../css/Teachers/ManageCategories/PostAssessment.css";

// Tooltip component for help text
const Tooltip = ({ text }) => (
  <div className="pa-tooltip">
    <FontAwesomeIcon icon={faInfoCircle} className="pa-tooltip-icon" />
    <span className="pa-tooltip-text">{text}</span>
  </div>
);

const PostAssessment = ({ templates }) => {
  const [assessments, setAssessments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filterReadingLevel, setFilterReadingLevel] = useState("all");
  const [filterCategory, setFilterCategory] = useState("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [modalType, setModalType] = useState(""); // create, edit, preview, delete
  const [selectedAssessment, setSelectedAssessment] = useState(null);
  const [formData, setFormData] = useState({
    readingLevel: "",
    category: "",
    questions: []
  });
  const [submitConfirmDialog, setSubmitConfirmDialog] = useState(false);
  const [submitSuccessDialog, setSubmitSuccessDialog] = useState(false);
  const [deleteSuccessDialog, setDeleteSuccessDialog] = useState(false);
  const [currentQuestion, setCurrentQuestion] = useState(null);
  const [showQuestionForm, setShowQuestionForm] = useState(false);
  const [questionFormData, setQuestionFormData] = useState({
    questionType: "",
    questionText: "",
    questionImage: null,
    questionValue: "",
    choiceOptions: [
      { optionText: "", isCorrect: true },
      { optionText: "", isCorrect: false }
    ],
    passages: [],
    sentenceQuestions: []
  });
  const [previewPage, setPreviewPage] = useState(0);
  const [duplicateRestrictionDialog, setDuplicateRestrictionDialog] = useState(false);
  const [restrictionReason, setRestrictionReason] = useState("");

  // Enhanced restriction checking
  const checkExistingAssessment = (readingLevel, category, excludeId = null) => {
    return assessments.find(assessment => 
      assessment.readingLevel === readingLevel && 
      assessment.category === category &&
      assessment._id !== excludeId
    );
  };

  const canCreateAssessment = (readingLevel, category) => {
    const existing = checkExistingAssessment(readingLevel, category);
    
    // Can't create if there's already a pending or approved assessment
    if (existing && (existing.status === "pending" || existing.status === "approved")) {
      return {
        canCreate: false,
        reason: existing.status === "pending" 
          ? "A pending assessment already exists for this combination"
          : "An active assessment already exists for this combination"
      };
    }
    
    return { canCreate: true };
  };

  useEffect(() => {
    // Fetch assessments data
    const fetchAssessments = async () => {
      try {
        setLoading(true);

        // In production, this would be an API call to fetch from test.main_assessment
        const mockAssessments = [
          {
            _id: "68298fb179a34741f9cd1a01",
            readingLevel: "Low Emerging",
            category: "Alphabet Knowledge",
            questions: [
              {
                questionType: "patinig",
                questionText: "Anong katumbas na maliit na letra?",
                questionImage: "https://literexia-bucket.s3.ap-southeast-2.amazonaws.com/letters/A_big.png",
                questionValue: "A",
                choiceOptions: [
                  { optionText: "a", isCorrect: true },
                  { optionText: "e", isCorrect: false }
                ],
                order: 1
              },
              {
                questionType: "patinig",
                questionText: "Anong katumbas na maliit na letra?",
                questionImage: "https://literexia-bucket.s3.ap-southeast-2.amazonaws.com/letters/E_big.png",
                questionValue: "E",
                choiceOptions: [
                  { optionText: "e", isCorrect: true },
                  { optionText: "a", isCorrect: false }
                ],
                order: 2
              }
            ],
            isActive: true,
            createdAt: "2025-05-01T08:00:00.000Z",
            status: "approved"
          },
          {
            _id: "68298fb179a34741f9cd1a02",
            readingLevel: "Low Emerging",
            category: "Phonological Awareness",
            questions: [
              {
                questionType: "malapantig",
                questionText: "Kapag pinagsama ang mga pantig, ano ang mabubuo?",
                questionImage: null,
                questionValue: "BO + LA",
                choiceOptions: [
                  { optionText: "BOLA", isCorrect: true },
                  { optionText: "LABO", isCorrect: false }
                ],
                order: 1
              }
            ],
            isActive: true,
            createdAt: "2025-05-01T08:45:00.000Z",
            status: "pending"
          },
          {
            _id: "68298fb179a34741f9cd1a05",
            readingLevel: "Low Emerging",
            category: "Reading Comprehension",
            questions: [
              {
                questionType: "sentence",
                questionText: "Basahin ang kwento at sagutin ang mga tanong.",
                questionImage: null,
                questionValue: null,
                choiceOptions: [],
                passages: [
                  {
                    pageNumber: 1,
                    pageText: "Si Maria ay pumunta sa parke. Nakita niya ang maraming bulaklak na magaganda. Siya ay natuwa at nag-uwi ng ilang bulaklak para sa kanyang ina.",
                    pageImage: "https://literexia-bucket.s3.ap-southeast-2.amazonaws.com/passages/park_flowers.png"
                  },
                  {
                    pageNumber: 2,
                    pageText: "Nang makita ng ina ni Maria ang mga bulaklak, siya ay ngumiti at nagyakap sa kanyang anak. Gumawa sila ng maliit na hardin sa harap ng kanilang bahay.",
                    pageImage: "https://literexia-bucket.s3.ap-southeast-2.amazonaws.com/passages/mother_garden.png"
                  }
                ],
                sentenceQuestions: [
                  {
                    questionText: "Sino ang pangunahing tauhan sa kwento?",
                    questionImage: "https://literexia-bucket.s3.ap-southeast-2.amazonaws.com/questions/character_question.png",
                    correctAnswer: "Si Maria",
                    incorrectAnswer: "Ang ina"
                  }
                ],
                order: 1
              }
            ],
            isActive: false,
            createdAt: "2025-05-01T10:00:00.000Z",
            status: "rejected",
            rejectionReason: "The reading passage is too simple for the target reading level. Please add more complex vocabulary and sentence structures appropriate for Low Emerging level students."
          }
        ];

        setAssessments(mockAssessments);
        setLoading(false);
      } catch (err) {
        setError("Failed to load assessments. Please try again later.");
        setLoading(false);
      }
    };

    fetchAssessments();
  }, []);

  // Filter assessments
  const filteredAssessments = assessments.filter(assessment => {
    // Reading level filter
    const levelMatch = filterReadingLevel === "all" ? true : assessment.readingLevel === filterReadingLevel;

    // Category filter
    const categoryMatch = filterCategory === "all" ? true : assessment.category === filterCategory;

    // Search term
    const searchMatch =
      assessment.category.toLowerCase().includes(searchTerm.toLowerCase()) ||
      assessment.readingLevel.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (assessment.questions.some(q => q.questionText?.toLowerCase().includes(searchTerm.toLowerCase())));

    return levelMatch && categoryMatch && searchMatch;
  });

  const readingLevels = ["all", "Low Emerging", "High Emerging", "Developing", "Transitioning", "At Grade Level"];
  const categories = ["all", "Alphabet Knowledge", "Phonological Awareness",
    "Decoding", "Word Recognition", "Reading Comprehension"];

  const handleCreateAssessment = () => {
    setModalType("create");
    setSelectedAssessment(null);
    setFormData({
      readingLevel: "",
      category: "",
      questions: []
    });
    setShowModal(true);
  };

  const handleEditAssessment = (assessment) => {
    // Only allow editing for rejected assessments
    if (assessment.status !== "rejected") {
      alert("Only rejected assessments can be edited. Approved or pending assessments cannot be modified.");
      return;
    }

    setModalType("edit");
    setSelectedAssessment(assessment);
    setFormData({
      readingLevel: assessment.readingLevel,
      category: assessment.category,
      questions: [...assessment.questions]
    });
    setShowModal(true);
  };

  const handlePreviewAssessment = (assessment) => {
    setModalType("preview");
    setSelectedAssessment(assessment);
    setPreviewPage(0); // Reset to first page
    setShowModal(true);
  };

  const handleDeleteConfirm = (assessment) => {
    // Only allow deletion for rejected assessments
    if (assessment.status !== "rejected") {
      alert("Only rejected assessments can be deleted. Approved or pending assessments cannot be removed.");
      return;
    }

    setModalType("delete");
    setSelectedAssessment(assessment);
    setShowModal(true);
  };

  const handleDeleteAssessment = () => {
    if (!selectedAssessment) return;

    // In a real app, you'd make an API call to delete the assessment
    setAssessments(prev => prev.filter(a => a._id !== selectedAssessment._id));
    setShowModal(false);
    setSelectedAssessment(null);

    // Show custom deletion success notification with different message
    // We'll use the same component but with different content
    setDeleteSuccessDialog(true);
    setTimeout(() => {
      setDeleteSuccessDialog(false);
    }, 3000);
  };

  const handleFormChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleAddQuestion = () => {
    setShowQuestionForm(true);
    setCurrentQuestion(null);

    // Reset form data based on selected category
    const initialQuestionType =
      formData.category === "Alphabet Knowledge" ? "patinig" :
        formData.category === "Phonological Awareness" ? "malapantig" :
          formData.category === "Word Recognition" ? "word" :
            formData.category === "Decoding" ? "word" :
              "sentence";

    setQuestionFormData({
      questionType: initialQuestionType,
      questionText: "",
      questionImage: null,
      questionValue: "",
      choiceOptions: [
        { optionText: "", isCorrect: true },
        { optionText: "", isCorrect: false }
      ],
      passages: initialQuestionType === "sentence" ? [
        { pageNumber: 1, pageText: "", pageImage: null }
      ] : [],
      sentenceQuestions: initialQuestionType === "sentence" ? [
        { questionText: "", correctAnswer: "", incorrectAnswer: "" }
      ] : [],
      order: formData.questions.length + 1
    });
  };

  const handleEditQuestion = (question, index) => {
    setShowQuestionForm(true);
    setCurrentQuestion(index);
    setQuestionFormData({
      ...question,
      order: index + 1
    });
  };

  const handleRemoveQuestion = (index) => {
    setFormData(prev => ({
      ...prev,
      questions: prev.questions.filter((_, i) => i !== index)
    }));
  };

  const handleQuestionFormChange = (e) => {
    const { name, value } = e.target;
    setQuestionFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleChoiceChange = (index, field, value) => {
    setQuestionFormData(prev => {
      const updatedChoices = [...prev.choiceOptions];
      updatedChoices[index] = {
        ...updatedChoices[index],
        [field]: value
      };
      return {
        ...prev,
        choiceOptions: updatedChoices
      };
    });
  };

  const handleAddChoice = () => {
    setQuestionFormData(prev => ({
      ...prev,
      choiceOptions: [
        ...prev.choiceOptions,
        { optionText: "", isCorrect: false }
      ]
    }));
  };

  const handleRemoveChoice = (index) => {
    setQuestionFormData(prev => ({
      ...prev,
      choiceOptions: prev.choiceOptions.filter((_, i) => i !== index)
    }));
  };

  const handleQuestionFormSubmit = () => {
    // Validate question form
    if (!questionFormData.questionText) {
      alert("Please enter a question text.");
      return;
    }

    if (questionFormData.questionType !== "sentence" && questionFormData.choiceOptions.length < 2) {
      alert("Please add at least two choices for the question.");
      return;
    }

    // Check if at least one choice is marked as correct
    if (
      questionFormData.questionType !== "sentence" &&
      !questionFormData.choiceOptions.some(c => c.isCorrect)
    ) {
      alert("Please mark at least one choice as correct.");
      return;
    }

    // Update the questions array
    if (currentQuestion !== null) {
      // Edit existing question
      setFormData(prev => {
        const updatedQuestions = [...prev.questions];
        updatedQuestions[currentQuestion] = questionFormData;
        return {
          ...prev,
          questions: updatedQuestions
        };
      });
    } else {
      // Add new question
      setFormData(prev => ({
        ...prev,
        questions: [...prev.questions, questionFormData]
      }));
    }

    // Close the question form
    setShowQuestionForm(false);
  };

  const handleFileUpload = (e, field) => {
    const file = e.target.files[0];
    if (!file) return;

    // For a real app, you'd upload the file to your server/S3
    // Here we'll just create a fake URL for demonstration
    const fakeImageUrl = URL.createObjectURL(file);

    if (field === 'questionImage') {
      setQuestionFormData(prev => ({
        ...prev,
        questionImage: fakeImageUrl
      }));
    } else if (field.includes('pageImage')) {
      const pageIndex = parseInt(field.split('-')[1]);
      setQuestionFormData(prev => {
        const updatedPassages = [...prev.passages];
        updatedPassages[pageIndex] = {
          ...updatedPassages[pageIndex],
          pageImage: fakeImageUrl
        };
        return {
          ...prev,
          passages: updatedPassages
        };
      });
    }
  };

  const handleSaveAssessment = () => {
    // Validate form data
    if (!formData.readingLevel || !formData.category || formData.questions.length === 0) {
      alert("Please fill in all required fields and add at least one question.");
      return;
    }
    
    // Check restrictions for new assessments
    if (modalType === 'create') {
      const validation = canCreateAssessment(formData.readingLevel, formData.category);
      if (!validation.canCreate) {
        setDuplicateRestrictionDialog(true);
        setRestrictionReason(validation.reason);
        return;
      }
    }
    
    // Open confirmation dialog for admin approval
    setSubmitConfirmDialog(true);
  };

  const handleConfirmSubmit = () => {
    // In a real app, you'd make an API call to save the assessment
    const newAssessment = {
      _id: selectedAssessment ? selectedAssessment._id : Date.now().toString(),
      readingLevel: formData.readingLevel,
      category: formData.category,
      questions: formData.questions,
      isActive: false, // New assessments start as inactive
      status: "pending", // New or edited assessments need approval
      createdAt: new Date().toISOString()
    };

    if (selectedAssessment) {
      // Update existing assessment
      setAssessments(prev => prev.map(a => a._id === selectedAssessment._id ? newAssessment : a));
    } else {
      // Add new assessment
      setAssessments(prev => [...prev, newAssessment]);
    }

    setSubmitConfirmDialog(false);
    setShowModal(false);
    setSelectedAssessment(null);
    setFormData({
      readingLevel: "",
      category: "",
      questions: []
    });

    // Show success notification
    setSubmitSuccessDialog(true);
    setTimeout(() => {
      setSubmitSuccessDialog(false);
    }, 3000);
  };

  // Function to handle navigation in preview mode
  const handlePreviewPageChange = (direction) => {
    if (direction === 'next' && selectedAssessment?.questions?.[0]?.passages?.length > previewPage + 1) {
      setPreviewPage(prev => prev + 1);
    } else if (direction === 'prev' && previewPage > 0) {
      setPreviewPage(prev => prev - 1);
    }
  };

  // Helper to render the question type name in a friendly format
  const getQuestionTypeDisplay = (type) => {
    switch (type) {
      case "patinig": return "Vowel (Patinig)";
      case "katinig": return "Consonant (Katinig)";
      case "malapantig": return "Syllable (Malapantig)";
      case "word": return "Word";
      case "sentence": return "Reading Passage";
      default: return type;
    }
  };

  // Get assessment statistics
  const getAssessmentStats = () => {
    const totalAssessments = assessments.length;
    const activeAssessments = assessments.filter(a => a.status === "approved").length;
    const pendingAssessments = assessments.filter(a => a.status === "pending").length;
    const rejectedAssessments = assessments.filter(a => a.status === "rejected").length;

    return {
      total: totalAssessments,
      active: activeAssessments,
      pending: pendingAssessments,
      rejected: rejectedAssessments
    };
  };

  const stats = getAssessmentStats();

  if (loading) {
    return (
      <div className="post-assessment-container">
        <div className="pa-loading">
          <div className="pa-spinner"></div>
          <p>Loading assessments...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="post-assessment-container">
        <div className="pa-error">
          <FontAwesomeIcon icon={faExclamationTriangle} className="pa-error-icon" />
          <p>{error}</p>
          <button onClick={() => window.location.reload()} className="pa-retry-btn">
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="post-assessment-container">
      <div className="pa-header">
        <h2>
          <FontAwesomeIcon icon={faClipboardList} />
          Main Assessment Management
        </h2>
        <p>Create and manage targeted assessments for specific reading levels and categories based on student performance and learning progress.</p>
        <button
          className="pa-add-button"
          onClick={handleCreateAssessment}
        >
          <FontAwesomeIcon icon={faPlus} /> Create New Assessment
        </button>
      </div>

      {/* Assessment Overview Stats */}
      <div className="pa-assessment-overview">
        <div className="pa-overview-stats">
          <div className="pa-stat-card">
            <div className="pa-stat-icon">
              <FontAwesomeIcon icon={faLayerGroup} />
            </div>
            <div className="pa-stat-content">
              <div className="pa-stat-number">{stats.total}</div>
              <div className="pa-stat-label">Total Assessments</div>
            </div>
          </div>

          <div className="pa-stat-card active">
            <div className="pa-stat-icon">
              <FontAwesomeIcon icon={faCheckCircle} />
            </div>
            <div className="pa-stat-content">
              <div className="pa-stat-number">{stats.active}</div>
              <div className="pa-stat-label">Active</div>
            </div>
          </div>

          <div className="pa-stat-card pending">
            <div className="pa-stat-icon">
              <FontAwesomeIcon icon={faLock} />
            </div>
            <div className="pa-stat-content">
              <div className="pa-stat-number">{stats.pending}</div>
              <div className="pa-stat-label">Pending Approval</div>
            </div>
          </div>

          <div className="pa-stat-card rejected">
            <div className="pa-stat-icon">
              <FontAwesomeIcon icon={faExclamationTriangle} />
            </div>
            <div className="pa-stat-content">
              <div className="pa-stat-number">{stats.rejected}</div>
              <div className="pa-stat-label">Rejected</div>
            </div>
          </div>
        </div>
      </div>

      {/* System Information */}
      <div className="pa-system-info">
        <h3>About Post-Assessment Process</h3>
        <div className="pa-info-grid">
          <div className="pa-info-card">
            <div className="pa-info-icon">
              <FontAwesomeIcon icon={faBullseye} />
            </div>
            <div className="pa-info-content">
              <h4>Targeted Interventions</h4>
              <p>
                Create specialized assessments tailored to specific reading levels and categories
                to address individual student needs and learning gaps.
              </p>
            </div>
          </div>

          <div className="pa-info-card">
            <div className="pa-info-icon">
              <FontAwesomeIcon icon={faChartLine} />
            </div>
            <div className="pa-info-content">
              <h4>Progress Monitoring</h4>
              <p>
                Track student advancement through customized assessments that measure
                improvement in specific skill areas identified during pre-assessment.
              </p>
            </div>
          </div>

          <div className="pa-info-card">
            <div className="pa-info-icon">
              <FontAwesomeIcon icon={faCogs} />
            </div>
            <div className="pa-info-content">
              <h4>Flexible Assessment Design</h4>
              <p>
                Build assessments with various question types including visual, auditory,
                and text-based elements to accommodate different learning styles.
              </p>
            </div>
          </div>

          <div className="pa-info-card">
            <div className="pa-info-icon">
              <FontAwesomeIcon icon={faUserGraduate} />
            </div>
            <div className="pa-info-content">
              <h4>Adaptive Learning Path</h4>
              <p>
                Enable students to progress through reading levels at their own pace
                with assessments that adapt to their current skill level and performance.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Process Flow */}
      <div className="pa-process-flow">
        <h3>Post-Assessment Process Flow</h3>
        <div className="pa-flow-steps">
          <div className="pa-flow-step">
            <div className="pa-step-number">1</div>
            <div className="pa-step-content">
              <h4>Assessment Creation</h4>
              <p>Teachers create targeted assessments based on pre-assessment results and specific learning objectives.</p>
            </div>
          </div>
          <div className="pa-flow-connector">
            <FontAwesomeIcon icon={faArrowRight} />
          </div>
          <div className="pa-flow-step">
            <div className="pa-step-number">2</div>
            <div className="pa-step-content">
              <h4>Admin Review</h4>
              <p>Assessments undergo administrative review to ensure quality and alignment with educational standards.</p>
            </div>
          </div>
          <div className="pa-flow-connector">
            <FontAwesomeIcon icon={faArrowRight} />
          </div>
          <div className="pa-flow-step">
            <div className="pa-step-number">3</div>
            <div className="pa-step-content">
              <h4>Student Assignment</h4>
              <p>Approved assessments are assigned to students based on their reading level and identified needs.</p>
            </div>
          </div>
          <div className="pa-flow-connector">
            <FontAwesomeIcon icon={faArrowRight} />
          </div>
          <div className="pa-flow-step">
            <div className="pa-step-number">4</div>
            <div className="pa-step-content">
              <h4>Progress Tracking</h4>
              <p>Monitor student performance and advancement through the assessment system in real-time.</p>
            </div>
          </div>
          <div className="pa-flow-connector">
            <FontAwesomeIcon icon={faArrowRight} />
          </div>
          <div className="pa-flow-step">
            <div className="pa-step-number">5</div>
            <div className="pa-step-content">
              <h4>Level Advancement</h4>
              <p>Students advance to higher reading levels based on successful completion of assessments.</p>
            </div>
          </div>
        </div>
      </div>

      <div className="pa-filters">
        <div className="pa-search">
          <input
            type="text"
            placeholder="Search assessments..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
          />
          <FontAwesomeIcon icon={faSearch} className="pa-search-icon" />
        </div>

        <div className="pa-filter-group">
          <label><FontAwesomeIcon icon={faFilter} className="pa-filter-icon" /> Reading Level:</label>
          <select
            value={filterReadingLevel}
            onChange={e => setFilterReadingLevel(e.target.value)}
          >
            {readingLevels.map(level => (
              <option key={level} value={level}>
                {level === "all" ? "All Levels" : level}
              </option>
            ))}
          </select>
        </div>

        <div className="pa-filter-group">
          <label><FontAwesomeIcon icon={faFilter} className="pa-filter-icon" /> Category:</label>
          <select
            value={filterCategory}
            onChange={e => setFilterCategory(e.target.value)}
          >
            {categories.map(category => (
              <option key={category} value={category}>
                {category === "all" ? "All Categories" : category}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="pa-assessment-list">
        {filteredAssessments.length === 0 ? (
          <div className="pa-no-assessments">
            <div className="pa-empty-icon">
              <FontAwesomeIcon icon={faFileAlt} />
            </div>
            <h3>No assessments found</h3>
            <p>Create your first assessment to get started with targeted learning interventions.</p>
            <button
              className="pa-create-first"
              onClick={handleCreateAssessment}
            >
              <FontAwesomeIcon icon={faPlus} /> Create Assessment
            </button>
          </div>
        ) : (
          <div className="pa-table">
            <div className="pa-header-row">
              <div className="pa-header-cell">Reading Level</div>
              <div className="pa-header-cell">Category</div>
              <div className="pa-header-cell">Questions</div>
              <div className="pa-header-cell">Status</div>
              <div className="pa-header-cell">Actions</div>
            </div>

            {filteredAssessments.map(assessment => (
              <div key={assessment._id} className="pa-row">
                <div className="pa-cell">
                  <FontAwesomeIcon icon={faBook} className="pa-cell-icon" />
                  {assessment.readingLevel}
                </div>
                <div className="pa-cell">
                  <FontAwesomeIcon icon={faPuzzlePiece} className="pa-cell-icon" />
                  {assessment.category}
                </div>
                <div className="pa-cell">{assessment.questions.length}</div>
                <div className="pa-cell">
                  {assessment.status === "approved" ? (
                    <span className="pa-status pa-active">
                      <FontAwesomeIcon icon={faCheckCircle} /> Active
                    </span>
                  ) : assessment.status === "pending" ? (
                    <span className="pa-status pa-pending">
                      <FontAwesomeIcon icon={faLock} /> Pending Approval
                    </span>
                  ) : (
                                          <span className="pa-status pa-inactive">
                        <FontAwesomeIcon icon={faExclamationTriangle} /> Rejected
                        {assessment.rejectionReason && (
                          <span className="post-assess-status-tooltip">
                            <FontAwesomeIcon icon={faInfoCircle} className="post-assess-info-icon" />
                            <span className="post-assess-tooltip-content">{assessment.rejectionReason}</span>
                          </span>
                        )}
                      </span>
                  )}
                </div>
                <div className="pa-cell pa-actions">
                  {/* Only show edit and delete buttons for rejected assessments */}
                  {assessment.status === "rejected" && (
                    <>
                      <button
                        className="pa-edit-btn"
                        onClick={() => handleEditAssessment(assessment)}
                        title="Edit Assessment"
                      >
                        <FontAwesomeIcon icon={faEdit} />
                      </button>
                      <button
                        className="pa-delete-btn"
                        onClick={() => handleDeleteConfirm(assessment)}
                        title="Delete Assessment"
                      >
                        <FontAwesomeIcon icon={faTrash} />
                      </button>
                    </>

                  )}

                  {/* Preview is always available */}
                  <button
                    className="pa-preview-btn"
                    onClick={() => handlePreviewAssessment(assessment)}
                    title="Preview Assessment"
                  >
                    <FontAwesomeIcon icon={faEye} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Assessment Modal */}
      {showModal && (
        <div className="pa-modal-overlay">
          <div className={`pa-modal ${modalType === 'preview' || showQuestionForm ? 'pa-modal-enhanced' : ''} ${modalType === 'delete' ? 'pa-modal-narrow' : ''}`}>
            {/* Modal Header */}
            <div className="pa-modal-header">
              <h3>
                {modalType === 'create' ?
                  <><FontAwesomeIcon icon={faPlus} className="pa-modal-header-icon" /> Create New Assessment</> :
                  modalType === 'edit' ?
                    <><FontAwesomeIcon icon={faEdit} className="pa-modal-header-icon" /> Edit Assessment</> :
                    modalType === 'preview' ?
                      <><FontAwesomeIcon icon={faEye} className="pa-modal-header-icon" /> Assessment Preview</> :
                      <><FontAwesomeIcon icon={faTrash} className="pa-modal-header-icon" /> Delete Assessment</>
                }
              </h3>
              <button
                className="pa-modal-close"
                onClick={() => setShowModal(false)}
                title="Close"
              >
                <FontAwesomeIcon icon={faTimes} />
              </button>
            </div>

            {/* Modal Body */}
            <div className="pa-modal-body">
                              {modalType === 'delete' ? (
                <div className="pa-delete-confirm">
                  <div className="pa-delete-icon">
                    <FontAwesomeIcon icon={faExclamationTriangle} />
                  </div>
                  <div className="pa-delete-message">
                    <h4>Delete Assessment</h4>
                    {selectedAssessment?.status === 'rejected' ? (
                      <>
                        <p>Are you sure you want to permanently delete this rejected assessment?</p>
                        <p className="pa-delete-warning">
                          This assessment was rejected and will be permanently deleted.
                          This action cannot be undone.
                        </p>
                        {selectedAssessment?.rejectionReason && (
                          <div className="post-assess-rejection-reason">
                            <h5><FontAwesomeIcon icon={faInfoCircle} /> Rejection Reason:</h5>
                            <p>"{selectedAssessment.rejectionReason}"</p>
                          </div>
                        )}
                      </>
                    ) : (
                      <>
                        <p>This assessment cannot be deleted because it has been submitted for approval.</p>
                        <p className="pa-delete-info">
                          Only rejected assessments can be deleted. Contact an administrator if you need to remove this assessment.
                        </p>
                      </>
                    )}
                  </div>
                  <div className="pa-assessment-details">
                    <div className="pa-detail-row">
                      <span className="pa-detail-label">Reading Level:</span>
                      <span className="pa-detail-value">{selectedAssessment?.readingLevel}</span>
                    </div>
                    <div className="pa-detail-row">
                      <span className="pa-detail-label">Category:</span>
                      <span className="pa-detail-value">{selectedAssessment?.category}</span>
                    </div>
                    <div className="pa-detail-row">
                      <span className="pa-detail-label">Status:</span>
                      <span className={`pa-detail-value status-${selectedAssessment?.status}`}>
                        {selectedAssessment?.status?.charAt(0).toUpperCase() + selectedAssessment?.status?.slice(1)}
                      </span>
                    </div>
                    <div className="pa-detail-row">
                      <span className="pa-detail-label">Questions:</span>
                      <span className="pa-detail-value">{selectedAssessment?.questions.length}</span>
                    </div>
                  </div>
                </div>
              ) : modalType === 'preview' ? (
                <div className="pa-assessment-preview">
                  <div className="pa-preview-header">
                    <div className="pa-preview-info">
                      <div className="pa-preview-panel">
                        <div className="pa-preview-section">
                          <span className="pa-preview-label">Reading Level:</span>
                          <span className="pa-preview-value">{selectedAssessment.readingLevel}</span>
                        </div>

                        <div className="pa-preview-section">
                          <span className="pa-preview-label">Category:</span>
                          <span className="pa-preview-value">{selectedAssessment.category}</span>
                        </div>

                        <div className="pa-preview-section">
                          <span className="pa-preview-label">Total Questions:</span>
                          <span className="pa-preview-value">{selectedAssessment.questions.length}</span>
                        </div>

                        <div className="pa-preview-section">
                          <span className="pa-preview-label">Status:</span>
                          <span className="pa-preview-value">
                            {selectedAssessment.status === "approved" ? (
                              <span className="pa-status-tag active">
                                <FontAwesomeIcon icon={faCheckCircle} /> Active
                              </span>
                            ) : selectedAssessment.status === "pending" ? (
                              <span className="pa-status-tag pending">
                                <FontAwesomeIcon icon={faLock} /> Pending Approval
                              </span>
                            ) : (
                              <span className="pa-status-tag rejected">
                                <FontAwesomeIcon icon={faExclamationTriangle} /> Rejected
                              </span>
                            )}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="pa-preview-content">
                    <h4>
                      <FontAwesomeIcon icon={faFileAlt} className="pa-preview-icon" /> Assessment Questions
                    </h4>

                    {selectedAssessment.questions.map((question, index) => (
                      <div key={index} className="pa-preview-question-card">
                        <div className="pa-question-header">
                                                <div className="pa-question-metadata">
                          <span className="pa-question-number">Question {index + 1}</span>
                          <span className="pa-question-type">
                            <FontAwesomeIcon
                              icon={
                                question.questionType === "patinig" || question.questionType === "katinig"
                                  ? faFont
                                  : question.questionType === "malapantig"
                                    ? faPuzzlePiece
                                    : question.questionType === "sentence"
                                      ? faBook
                                      : faFileAlt
                              }
                              className="pa-question-type-icon"
                            />
                            {getQuestionTypeDisplay(question.questionType)}
                          </span>
                        </div>
                        </div>

                        <div className="pa-question-content">
                          <div className="pa-question-prompt">
                            {question.questionImage && (
                              <div className="pa-question-image-container">
                                <img
                                  src={question.questionImage}
                                  alt="Question visual"
                                  className="pa-question-image"
                                />
                              </div>
                            )}

                            <div className="pa-question-text-container">
                              <p className="pa-question-text">{question.questionText}</p>
                              {question.questionValue && (
                                <div className="pa-question-value">
                                  <strong>Value:</strong> {question.questionValue}
                                </div>
                              )}
                            </div>
                          </div>

                          {question.questionType === 'sentence' && question.passages ? (
                            <div className="pa-passage-preview">
                              <h5><FontAwesomeIcon icon={faBook} /> Reading Passage</h5>

                              <div className="pa-passage-navigation">
                                <button
                                  className="pa-page-nav-btn"
                                  onClick={() => handlePreviewPageChange('prev')}
                                  disabled={previewPage === 0}
                                >
                                  <FontAwesomeIcon icon={faArrowLeft} /> Previous
                                </button>

                                <span className="pa-page-indicator">
                                  Page {previewPage + 1} of {question.passages.length}
                                </span>

                                <button
                                  className="pa-page-nav-btn"
                                  onClick={() => handlePreviewPageChange('next')}
                                  disabled={previewPage >= question.passages.length - 1}
                                >
                                  Next <FontAwesomeIcon icon={faArrowRight} />
                                </button>
                              </div>

                              <div className="pa-passage-container">
                                {question.passages[previewPage]?.pageImage && (
                                  <div className="pa-passage-image-container">
                                    <img
                                      src={question.passages[previewPage].pageImage}
                                      alt={`Page ${previewPage + 1} illustration`}
                                      className="pa-passage-image"
                                    />
                                  </div>
                                )}

                                <div className="pa-passage-text-container">
                                  <p className="pa-passage-text">{question.passages[previewPage]?.pageText}</p>
                                </div>
                              </div>

                              <div className="pa-comprehension-questions">
                                <h5><FontAwesomeIcon icon={faQuestion} /> Comprehension Questions</h5>
                                {question.sentenceQuestions && question.sentenceQuestions.map((sq, sqIndex) => (
                                  <div key={sqIndex} className="pa-comprehension-question">
                                    <div className="pa-comprehension-q-header">
                                      <span className="pa-comprehension-q-number">Q{sqIndex + 1}:</span>
                                      <span className="pa-comprehension-q-text">{sq.questionText}</span>
                                    </div>

                                    <div className="pa-comprehension-options">
                                      <div className="pa-option pa-option-correct">
                                        <FontAwesomeIcon icon={faCheckCircle} className="pa-option-icon" />
                                        {sq.correctAnswer}
                                      </div>
                                      <div className="pa-option">
                                        {sq.incorrectAnswer}
                                      </div>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </div>
                          ) : (
                            <div className="pa-choice-options">
                              <h5><FontAwesomeIcon icon={faCheckDouble} /> Answer Options</h5>

                              <div className="pa-options-list">
                                {question.choiceOptions && question.choiceOptions.map((option, optIndex) => (
                                  <div
                                    key={optIndex}
                                    className={`pa-option ${option.isCorrect ? 'pa-option-correct' : ''}`}
                                  >
                                    {option.isCorrect && (
                                      <FontAwesomeIcon icon={faCheckCircle} className="pa-option-icon" />
                                    )}
                                    {option.optionText}
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>

                                  {selectedAssessment.status === "rejected" && selectedAssessment.rejectionReason && (
                  <div className="post-assess-rejection-panel">
                    <div className="post-assess-rejection-header">
                      <FontAwesomeIcon icon={faInfoCircle} /> Rejection Reason
                    </div>
                    <div className="post-assess-rejection-content">
                      {selectedAssessment.rejectionReason}
                    </div>
                  </div>
                )}
                </div>
              ) : showQuestionForm ? (
                <div className="pa-question-form">
                  <div className="pa-question-form-header">
                    <h4>
                      {currentQuestion !== null ? (
                        <><FontAwesomeIcon icon={faEdit} /> Edit Question #{currentQuestion + 1}</>
                      ) : (
                        <><FontAwesomeIcon icon={faPlus} /> Add New Question</>
                      )}
                    </h4>
                    <button
                      type="button"
                      className="pa-back-to-form-btn"
                      onClick={() => setShowQuestionForm(false)}
                    >
                      <FontAwesomeIcon icon={faArrowLeft} /> Back to Assessment
                    </button>
                  </div>

                  <div className="pa-question-form-content">
                    <div className="pa-question-form-grid">
                      <div className="pa-form-group">
                        <label htmlFor="questionType">
                          Question Type:
                          <Tooltip text="Select the type of question you want to create based on your assessment category." />
                        </label>
                        <select
                          id="questionType"
                          name="questionType"
                          value={questionFormData.questionType}
                          onChange={handleQuestionFormChange}
                          className="pa-select-input"
                        >
                          {formData.category === "Alphabet Knowledge" && (
                            <>
                              <option value="patinig">Vowel (Patinig)</option>
                              <option value="katinig">Consonant (Katinig)</option>
                            </>
                          )}
                          {formData.category === "Phonological Awareness" && (
                            <>
                              <option value="malapantig">Syllable (Malapantig)</option>
                              <option value="katinig">Consonant (Katinig)</option>
                              <option value="patinig">Vowel (Patinig)</option>
                            </>
                          )}
                          {(formData.category === "Word Recognition" || formData.category === "Decoding") && (
                            <option value="word">Word</option>
                          )}
                          {formData.category === "Reading Comprehension" && (
                            <option value="sentence">Reading Passage</option>
                          )}
                        </select>
                      </div>

                      <div className="pa-form-group">
                        <label htmlFor="questionText">
                          Question Text:
                          <Tooltip text="The main instruction or question displayed to the student." />
                        </label>
                        <input
                          type="text"
                          id="questionText"
                          name="questionText"
                          value={questionFormData.questionText}
                          onChange={handleQuestionFormChange}
                          placeholder="Enter the question text (e.g., 'Anong katumbas na maliit na letra?')"
                          required
                          className="pa-text-input"
                        />
                      </div>

                      {questionFormData.questionType !== "sentence" && (
                        <>
                          <div className="pa-form-group">
                            <label htmlFor="questionValue">
                              Question Display Text:
                              <Tooltip text="The text shown alongside the question, like a letter or word combination that students need to analyze." />
                            </label>
                            <input
                              type="text"
                              id="questionValue"
                              name="questionValue"
                              value={questionFormData.questionValue || ""}
                              onChange={handleQuestionFormChange}
                              placeholder="Enter text to display with the question (e.g., 'A' or 'BO + LA')"
                              className="pa-text-input"
                            />
                          </div>

                          <div className="pa-form-group">
                            <label>
                              Question Image:
                              <Tooltip text="Upload an image to display with the question (e.g., a picture of the letter or word)." />
                            </label>
                            <div className="pa-file-upload">
                              <label className="pa-file-upload-btn">
                                <FontAwesomeIcon icon={faUpload} /> Choose Image
                                <input
                                  type="file"
                                  accept="image/*"
                                  onChange={(e) => handleFileUpload(e, 'questionImage')}
                                  className="pa-file-input"
                                />
                              </label>
                              <span className="pa-file-name">
                                {questionFormData.questionImage
                                  ? questionFormData.questionImage.split('/').pop()
                                  : "No file chosen"}
                              </span>

                              {questionFormData.questionImage && (
                                <div className="pa-image-preview">
                                  <img
                                    src={questionFormData.questionImage}
                                    alt="Question preview"
                                    className="pa-preview-image"
                                  />
                                  <button
                                    type="button"
                                    className="pa-remove-image"
                                    onClick={() => setQuestionFormData(prev => ({
                                      ...prev,
                                      questionImage: null
                                    }))}
                                  >
                                    <FontAwesomeIcon icon={faTimes} />
                                  </button>
                                </div>
                              )}
                            </div>
                          </div>

                          <div className="pa-form-group pa-full-width">
                            <label>
                              Answer Choices:
                              <Tooltip text="Add answer options for the student to choose from. Mark one as correct." />
                            </label>

                            <div className="pa-choices-container">
                              {questionFormData.choiceOptions.map((choice, index) => (
                                <div key={index} className="pa-choice-item">
                                  <div className="pa-choice-input-group">
                                    <input
                                      type="text"
                                      value={choice.optionText}
                                      onChange={(e) => handleChoiceChange(index, "optionText", e.target.value)}
                                      placeholder={`Option ${index + 1} (e.g., "a" or "BOLA")`}
                                      required
                                      className="pa-text-input"
                                    />

                                    <div className="pa-choice-controls">
                                      <label className={`pa-correct-checkbox ${choice.isCorrect ? 'selected' : ''}`}>
                                        <input
                                          type="radio"
                                          name="correctOption"
                                          checked={choice.isCorrect}
                                          onChange={() => {
                                            // Set this option as correct and all others as incorrect
                                            questionFormData.choiceOptions.forEach((_, i) => {
                                              handleChoiceChange(i, "isCorrect", i === index);
                                            });
                                          }}
                                        />
                                        <FontAwesomeIcon icon={choice.isCorrect ? faCheckCircle : faQuestion} />
                                        Correct Answer
                                      </label>

                                      {index > 1 && (
                                        <button
                                          type="button"
                                          className="pa-remove-choice"
                                          onClick={() => handleRemoveChoice(index)}
                                          title="Remove this option"
                                        >
                                          <FontAwesomeIcon icon={faTimes} />
                                        </button>
                                      )}
                                    </div>
                                  </div>
                                </div>
                              ))}

                              <button
                                type="button"
                                className="pa-add-choice-btn"
                                onClick={handleAddChoice}
                              >
                                <FontAwesomeIcon icon={faPlus} /> Add Answer Choice
                              </button>

                              <div className="pa-help-text">
                                <FontAwesomeIcon icon={faInfoCircle} />
                                Note: The system will automatically limit to 2 options for mobile display.
                              </div>
                            </div>
                          </div>
                        </>
                      )}
                      {questionFormData.questionType === "sentence" && (
                        // Reading Passage questions form
                        <div className="pa-passage-form pa-full-width">
                          <div className="pa-form-section">
                            <h5><FontAwesomeIcon icon={faBook} /> Reading Passage Pages</h5>

                            {questionFormData.passages.map((page, index) => (
                              <div key={index} className="pa-passage-item">
                                <div className="pa-passage-header">
                                  <h5>Page {index + 1}</h5>
                                  {index > 0 && (
                                    <button
                                      type="button"
                                      className="pa-remove-page"
                                      onClick={() => {
                                        setQuestionFormData(prev => ({
                                          ...prev,
                                          passages: prev.passages.filter((_, i) => i !== index)
                                        }));
                                      }}
                                      title="Remove page"
                                    >
                                      <FontAwesomeIcon icon={faTimes} />
                                    </button>
                                  )}
                                </div>

                                <div className="pa-form-group">
                                  <label>
                                    Page Text:
                                    <Tooltip text="The text content for this page of the reading passage." />
                                  </label>
                                  <textarea
                                    value={page.pageText}
                                    onChange={(e) => {
                                      const updatedPassages = [...questionFormData.passages];
                                      updatedPassages[index] = {
                                        ...updatedPassages[index],
                                        pageText: e.target.value
                                      };
                                      setQuestionFormData(prev => ({
                                        ...prev,
                                        passages: updatedPassages
                                      }));
                                    }}
                                    placeholder="Enter the text for this page of the story"
                                    rows={4}
                                    className="pa-textarea"
                                  ></textarea>
                                </div>

                                <div className="pa-form-group">
                                  <label>
                                    Page Image:
                                    <Tooltip text="Upload an illustration for this page of the reading passage." />
                                  </label>
                                  <div className="pa-file-upload">
                                    <label className="pa-file-upload-btn">
                                      <FontAwesomeIcon icon={faUpload} /> Choose Image
                                      <input
                                        type="file"
                                        accept="image/*"
                                        onChange={(e) => handleFileUpload(e, `pageImage-${index}`)}
                                        className="pa-file-input"
                                      />
                                    </label>
                                    <span className="pa-file-name">
                                      {page.pageImage
                                        ? page.pageImage.split('/').pop()
                                        : "No file chosen"}
                                    </span>

                                    {page.pageImage && (
                                      <div className="pa-image-preview">
                                        <img
                                          src={page.pageImage}
                                          alt={`Page ${index + 1} preview`}
                                          className="pa-preview-image"
                                        />
                                      </div>
                                    )}
                                  </div>
                                </div>
                              </div>
                            ))}

                            <button
                              type="button"
                              className="pa-add-page-btn"
                              onClick={() => {
                                setQuestionFormData(prev => ({
                                  ...prev,
                                  passages: [
                                    ...prev.passages,
                                    {
                                      pageNumber: prev.passages.length + 1,
                                      pageText: "",
                                      pageImage: null
                                    }
                                  ]
                                }));
                              }}
                            >
                              <FontAwesomeIcon icon={faPlus} /> Add Page
                            </button>
                          </div>

                          <div className="pa-form-section">
                            <h5><FontAwesomeIcon icon={faQuestion} /> Comprehension Questions</h5>

                            {questionFormData.sentenceQuestions.map((sq, index) => (
                              <div key={index} className="pa-sentence-question-item">
                                <div className="pa-sentence-question-header">
                                  <h5>Question {index + 1}</h5>
                                  {index > 0 && (
                                    <button
                                      type="button"
                                      className="pa-remove-sentence-question"
                                      onClick={() => {
                                        setQuestionFormData(prev => ({
                                          ...prev,
                                          sentenceQuestions: prev.sentenceQuestions.filter((_, i) => i !== index)
                                        }));
                                      }}
                                      title="Remove question"
                                    >
                                      <FontAwesomeIcon icon={faTimes} />
                                    </button>
                                  )}
                                </div>

                                <div className="pa-form-group">
                                  <label>
                                    Question Text:
                                    <Tooltip text="The comprehension question about the passage." />
                                  </label>
                                  <input
                                    type="text"
                                    value={sq.questionText}
                                    onChange={(e) => {
                                      const updatedQuestions = [...questionFormData.sentenceQuestions];
                                      updatedQuestions[index] = {
                                        ...updatedQuestions[index],
                                        questionText: e.target.value
                                      };
                                      setQuestionFormData(prev => ({
                                        ...prev,
                                        sentenceQuestions: updatedQuestions
                                      }));
                                    }}
                                    placeholder="Enter question text (e.g., 'Sino ang pangunahing tauhan?')"
                                    className="pa-text-input"
                                  />
                                </div>

                                <div className="pa-form-group">
                                  <label>
                                    Correct Answer:
                                    <Tooltip text="The correct answer to the comprehension question." />
                                  </label>
                                  <input
                                    type="text"
                                    value={sq.correctAnswer}
                                    onChange={(e) => {
                                      const updatedQuestions = [...questionFormData.sentenceQuestions];
                                      updatedQuestions[index] = {
                                        ...updatedQuestions[index],
                                        correctAnswer: e.target.value
                                      };
                                      setQuestionFormData(prev => ({
                                        ...prev,
                                        sentenceQuestions: updatedQuestions
                                      }));
                                    }}
                                    placeholder="Enter the correct answer"
                                    className="pa-text-input pa-correct-input"
                                  />
                                </div>

                                <div className="pa-form-group">
                                  <label>
                                    Incorrect Answer:
                                    <Tooltip text="One incorrect option for the comprehension question." />
                                  </label>
                                  <input
                                    type="text"
                                    value={sq.incorrectAnswer}
                                    onChange={(e) => {
                                      const updatedQuestions = [...questionFormData.sentenceQuestions];
                                      updatedQuestions[index] = {
                                        ...updatedQuestions[index],
                                        incorrectAnswer: e.target.value
                                      };
                                      setQuestionFormData(prev => ({
                                        ...prev,
                                        sentenceQuestions: updatedQuestions
                                      }));
                                    }}
                                    placeholder="Enter an incorrect answer"
                                    className="pa-text-input pa-incorrect-input"
                                  />
                                </div>
                              </div>
                            ))}

                            <button
                              type="button"
                              className="pa-add-sentence-question-btn"
                              onClick={() => {
                                setQuestionFormData(prev => ({
                                  ...prev,
                                  sentenceQuestions: [
                                    ...prev.sentenceQuestions,
                                    {
                                      questionText: "",
                                      correctAnswer: "",
                                      incorrectAnswer: ""
                                    }
                                  ]
                                }));
                              }}
                            >
                              <FontAwesomeIcon icon={faPlus} /> Add Comprehension Question
                            </button>

                            <div className="pa-help-text">
                              <FontAwesomeIcon icon={faInfoCircle} />
                              Note: Only two answer choices (correct and incorrect) will be shown to students.
                            </div>
                          </div>
                        </div>
                      )}
                    </div>

                    <div className="pa-question-form-buttons">
                      <button
                        type="button"
                        className="pa-cancel-btn"
                        onClick={() => setShowQuestionForm(false)}
                      >
                        <FontAwesomeIcon icon={faTimes} /> Cancel
                      </button>
                      <button
                        type="button"
                        className="pa-save-question-btn"
                        onClick={handleQuestionFormSubmit}
                      >
                        <FontAwesomeIcon icon={currentQuestion !== null ? faEdit : faPlus} />
                        {currentQuestion !== null ? ' Update Question' : ' Add Question'}
                      </button>
                    </div>
                  </div>
                </div>
              ) : (
                // Assessment Form
                <div className="pa-assessment-form">
                  <div className="pa-assessment-form-header">
                    <h4>
                      <FontAwesomeIcon icon={modalType === 'create' ? faPlus : faEdit} />
                      {modalType === 'create' ? 'Create New Assessment' : 'Edit Assessment'}
                    </h4>
                    <p className="pa-form-description">
                      Build targeted assessments to evaluate student progress in specific reading skills and categories.
                    </p>
                  </div>

                  <div className="pa-form-section">
                    <h5>
                      <FontAwesomeIcon icon={faInfoCircle} />
                      Assessment Configuration
                    </h5>

                    <div className="pa-form-row">
                      <div className="pa-form-group">
                        <label htmlFor="readingLevel">
                          Reading Level:
                          <Tooltip text="Select the CRLA reading level this assessment targets." />
                        </label>
                        <select
                          id="readingLevel"
                          name="readingLevel"
                          value={formData.readingLevel}
                          onChange={handleFormChange}
                          required
                          className="pa-select-input"
                        >
                          <option value="">Select Reading Level</option>
                          <option value="Low Emerging">Low Emerging</option>
                          <option value="High Emerging">High Emerging</option>
                          <option value="Developing">Developing</option>
                          <option value="Transitioning">Transitioning</option>
                          <option value="At Grade Level">At Grade Level</option>
                        </select>
                      </div>

                      <div className="pa-form-group">
                        <label htmlFor="category">
                          Category:
                          <Tooltip text="Select the specific reading skill category to assess." />
                        </label>
                        <select
                          id="category"
                          name="category"
                          value={formData.category}
                          onChange={handleFormChange}
                          required
                          className="pa-select-input"
                        >
                          <option value="">Select Category</option>
                          <option value="Alphabet Knowledge">Alphabet Knowledge</option>
                          <option value="Phonological Awareness">Phonological Awareness</option>
                          <option value="Decoding">Decoding</option>
                          <option value="Word Recognition">Word Recognition</option>
                          <option value="Reading Comprehension">Reading Comprehension</option>
                        </select>
                      </div>
                    </div>
                  </div>

                  <div className="pa-form-section">
                    <div className="pa-questions-header">
                      <h5>
                        <FontAwesomeIcon icon={faFileAlt} />
                        Assessment Questions

                      </h5>
                      <div className="pa-questions-stats">
                        <span className="pa-questions-count">
                          {formData.questions.length} questions added
                        </span>
                        <button
                          type="button"
                          className="pa-add-question-btn"
                          onClick={handleAddQuestion}
                          disabled={!formData.category}
                        >
                          <FontAwesomeIcon icon={faPlus} /> Add Question
                        </button>
                      </div>
                    </div>

                    <div className="pa-questions-container">
                      {formData.questions.length === 0 ? (
                        <div className="pa-no-questions">
                          <FontAwesomeIcon icon={faQuestion} className="pa-no-questions-icon" />
                          <h6>No questions added yet</h6>
                          <p>Start building your assessment by adding questions tailored to your selected category and reading level.</p>
                          {!formData.category && (
                            <div className="pa-category-reminder">
                              <FontAwesomeIcon icon={faInfoCircle} />
                              Select a category above to begin adding questions.
                            </div>
                          )}
                        </div>
                      ) : (
                        <div className="pa-question-list">
                          {formData.questions.map((question, index) => (
                            <div key={index} className="pa-question-item">
                              <div className="pa-question-item-header">
                                <div className="pa-question-info">
                                  <span className="pa-question-number">Q{index + 1}</span>
                                  <div className="pa-question-details">
                                    <span className="pa-question-category">
                                      {getQuestionTypeDisplay(question.questionType)}
                                    </span>
                                    <span className="pa-question-text-preview">
                                      {question.questionText}
                                    </span>
                                  </div>
                                </div>

                                <div className="pa-question-item-actions">
                                  <button
                                    className="pa-edit-question-btn"
                                    onClick={() => handleEditQuestion(question, index)}
                                    title="Edit question"
                                  >
                                    <FontAwesomeIcon icon={faEdit} />
                                  </button>
                                  <button
                                    className="pa-remove-question"
                                    onClick={() => handleRemoveQuestion(index)}
                                    title="Remove question"
                                  >
                                    <FontAwesomeIcon icon={faTimes} />
                                  </button>
                                </div>
                              </div>

                              <div className="pa-question-item-metadata">
                                <div className="pa-question-meta-item">
                                  {question.questionImage && (
                                    <span className="pa-meta-tag">
                                      <FontAwesomeIcon icon={faImages} /> Has Image
                                    </span>
                                  )}
                                  {question.questionType === "sentence" ? (
                                    <>
                                      <span className="pa-meta-tag">
                                        <FontAwesomeIcon icon={faBook} /> {question.passages?.length || 0} Pages
                                      </span>
                                      <span className="pa-meta-tag">
                                        <FontAwesomeIcon icon={faQuestion} /> {question.sentenceQuestions?.length || 0} Questions
                                      </span>
                                    </>
                                  ) : (
                                    <span className="pa-meta-tag">
                                      <FontAwesomeIcon icon={faCheckCircle} /> {question.choiceOptions?.length || 0} Options
                                    </span>
                                  )}
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="pa-form-note">
                    <FontAwesomeIcon icon={faInfoCircle} />
                    <p>
                      Your assessment will be submitted for admin approval before it becomes available for student assignment.
                      Ensure all questions are complete and properly configured.
                    </p>
                  </div>
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="pa-modal-footer">
              {modalType === 'delete' ? (
                <>
                  <button
                    className="pa-modal-cancel"
                    onClick={() => setShowModal(false)}
                  >
                    <FontAwesomeIcon icon={faTimes} /> Cancel
                  </button>
                  <button
                    className="pa-modal-delete"
                    onClick={handleDeleteAssessment}
                  >
                    <FontAwesomeIcon icon={faTrash} /> Delete Assessment
                  </button>
                </>
              ) : modalType === 'preview' ? (
                <button
                  className="pa-modal-close-btn"
                  onClick={() => setShowModal(false)}
                >
                  <FontAwesomeIcon icon={faTimes} /> Close Preview
                </button>
              ) : showQuestionForm ? (
                null  // Buttons are inside the question form
              ) : (
                <>
                  <button
                    className="pa-modal-cancel"
                    onClick={() => setShowModal(false)}
                  >
                    <FontAwesomeIcon icon={faTimes} /> Cancel
                  </button>
                  <button
                    className="pa-modal-save"
                    onClick={handleSaveAssessment}
                    disabled={!formData.readingLevel || !formData.category || formData.questions.length === 0}
                  >
                    <FontAwesomeIcon icon={modalType === 'create' ? faPlus : faEdit} />
                    {modalType === 'create' ? ' Create Assessment' : ' Save Changes'}
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Submit Confirmation Dialog */}
      {submitConfirmDialog && (
        <div className="pa-modal-overlay">
          <div className="pa-modal pa-confirm-dialog">
            <div className="pa-modal-header">
              <h3><FontAwesomeIcon icon={faLock} className="pa-modal-header-icon" /> Submit for Admin Approval</h3>
              <button
                className="pa-modal-close"
                onClick={() => setSubmitConfirmDialog(false)}
              >
                <FontAwesomeIcon icon={faTimes} />
              </button>
            </div>

            <div className="pa-modal-body">
              <div className="pa-confirm-icon">
                <FontAwesomeIcon icon={faLock} />
              </div>
              <div className="pa-confirm-message">
                <p>Your assessment will be submitted for admin approval before it can be assigned to students.</p>
                <p>Once submitted, it will appear with "Pending Approval" status.</p>
                <p className="pa-confirm-question">Would you like to submit this assessment now?</p>
              </div>

              <div className="pa-submission-summary">
                <h4>Assessment Summary:</h4>
                <div className="pa-summary-details">
                  <div className="pa-summary-item">
                    <span className="pa-summary-label">Reading Level:</span>
                    <span className="pa-summary-value">{formData.readingLevel}</span>
                  </div>
                  <div className="pa-summary-item">
                    <span className="pa-summary-label">Category:</span>
                    <span className="pa-summary-value">{formData.category}</span>
                  </div>
                  <div className="pa-summary-item">
                    <span className="pa-summary-label">Total Questions:</span>
                    <span className="pa-summary-value">{formData.questions.length}</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="pa-modal-footer">
              <button
                className="pa-modal-cancel"
                onClick={() => setSubmitConfirmDialog(false)}
              >
                <FontAwesomeIcon icon={faArrowLeft} /> Go Back and Edit
              </button>
              <button
                className="pa-modal-save"
                onClick={handleConfirmSubmit}
              >
                <FontAwesomeIcon icon={faLock} /> Submit for Approval
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Success Notification */}
      {submitSuccessDialog && (
        <div className="pa-success-notification">
          <div className="pa-success-icon">
            <FontAwesomeIcon icon={faCheckCircle} />
          </div>
          <div className="pa-success-message">
            <p>Assessment submitted successfully!</p>
            <p className="pa-success-detail">Your assessment has been sent for admin approval.</p>
          </div>
        </div>
      )}

      {/* Delete Success Notification */}
      {deleteSuccessDialog && (
        <div className="pa-success-notification">
          <div className="pa-success-icon">
            <FontAwesomeIcon icon={faTrash} />
          </div>
          <div className="pa-success-message">
            <p>Assessment deleted successfully!</p>
            <p className="pa-success-detail">The assessment has been permanently removed.</p>
          </div>
        </div>
      )}

      {/* Duplicate Restriction Dialog */}
      {duplicateRestrictionDialog && (
        <div className="pa-modal-overlay">
          <div className="pa-modal pa-restriction-dialog">
            <div className="pa-modal-header">
              <h3>
                <FontAwesomeIcon icon={faExclamationTriangle} className="pa-modal-header-icon" /> 
                Cannot Create Assessment
              </h3>
              <button 
                className="pa-modal-close"
                onClick={() => setDuplicateRestrictionDialog(false)}
              >
                <FontAwesomeIcon icon={faTimes} />
              </button>
            </div>
            
            <div className="pa-modal-body">
              <div className="pa-restriction-icon">
                <FontAwesomeIcon icon={faExclamationTriangle} />
              </div>
              <div className="pa-restriction-message">
                <p>
                  <strong>Restriction:</strong> Only one assessment per reading level and category combination is allowed.
                </p>
                <p>
                  For <strong>{formData.readingLevel}</strong> level and <strong>{formData.category}</strong> category:
                </p>
                
                {(() => {
                  const existing = checkExistingAssessment(formData.readingLevel, formData.category);
                  if (existing?.status === 'pending') {
                    return (
                      <div className="pa-restriction-details pending">
                        <FontAwesomeIcon icon={faLock} />
                        <span>A pending assessment is awaiting admin approval</span>
                      </div>
                    );
                  } else if (existing?.status === 'approved') {
                    return (
                      <div className="pa-restriction-details approved">
                        <FontAwesomeIcon icon={faCheckCircle} />
                        <span>An active assessment is already deployed</span>
                      </div>
                    );
                  }
                })()}
                
                <div className="pa-restriction-options">
                  <p>You can:</p>
                  <ul className="pa-restriction-list">
                    <li>Wait for the pending assessment to be approved or rejected</li>
                    <li>Choose a different reading level or category combination</li>
                    <li>Edit the existing rejected assessment if available</li>
                    <li>Contact an administrator to modify active assessments</li>
                  </ul>
                </div>
              </div>
            </div>
            
            <div className="pa-modal-footer">
              <button 
                className="pa-modal-close-btn"
                onClick={() => setDuplicateRestrictionDialog(false)}
              >
                <FontAwesomeIcon icon={faArrowLeft} /> Go Back
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PostAssessment;