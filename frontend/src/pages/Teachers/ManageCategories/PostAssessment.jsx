// src/pages/Teachers/ManageCategories/PostAssessment.jsx
import React, { useState, useEffect } from "react";
import "../../../css/Teachers/ManageCategories/PostAssessment.css";

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
  
  useEffect(() => {
    // Fetch assessments data
    const fetchAssessments = async () => {
      try {
        setLoading(true);
        
        // Mock data based on your JSON
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
            createdAt: "2025-05-01T08:00:00.000Z"
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
            createdAt: "2025-05-01T08:45:00.000Z"
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
            isActive: true,
            createdAt: "2025-05-01T10:00:00.000Z"
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
  (assessment.questions.some(q => q.questionText.toLowerCase().includes(searchTerm.toLowerCase())));

return levelMatch && categoryMatch && searchMatch;
});

const readingLevels = ["all", ...new Set(assessments.map(a => a.readingLevel).filter(Boolean))];
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
setShowModal(true);
};

const handleDeleteConfirm = (assessment) => {
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
};

const handleFormChange = (e) => {
const { name, value } = e.target;
setFormData(prev => ({
  ...prev,
  [name]: value
}));
};

const handleAddQuestion = () => {
// In a real app, you'd open a question selector based on the category
const newQuestion = {
  id: Date.now(),
  questionType: formData.category === "Alphabet Knowledge" ? "patinig" :
               formData.category === "Phonological Awareness" ? "malapantig" :
               formData.category === "Word Recognition" ? "word" :
               formData.category === "Decoding" ? "word" :
               "sentence",
  questionText: `Sample ${formData.category} question`,
  choiceOptions: [
    { optionText: "Option 1", isCorrect: true },
    { optionText: "Option 2", isCorrect: false }
  ],
  order: formData.questions.length + 1
};

setFormData(prev => ({
  ...prev,
  questions: [...prev.questions, newQuestion]
}));
};

const handleRemoveQuestion = (id) => {
setFormData(prev => ({
  ...prev,
  questions: prev.questions.filter(q => q.id !== id)
}));
};

const handleSaveAssessment = () => {
// Validate form data
if (!formData.readingLevel || !formData.category || formData.questions.length === 0) {
  alert("Please fill in all required fields and add at least one question.");
  return;
}

// In a real app, you'd make an API call to save the assessment
const newAssessment = {
  _id: selectedAssessment ? selectedAssessment._id : Date.now().toString(),
  readingLevel: formData.readingLevel,
  category: formData.category,
  questions: formData.questions,
  isActive: true,
  createdAt: new Date().toISOString()
};

if (selectedAssessment) {
  // Update existing assessment
  setAssessments(prev => prev.map(a => a._id === selectedAssessment._id ? newAssessment : a));
} else {
  // Add new assessment
  setAssessments(prev => [...prev, newAssessment]);
}

setShowModal(false);
setSelectedAssessment(null);
setFormData({
  readingLevel: "",
  category: "",
  questions: []
});
};

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
      <i className="fas fa-exclamation-circle"></i>
      <p>{error}</p>
      <button onClick={() => window.location.reload()}>Try Again</button>
    </div>
  </div>
);
}

return (
<div className="post-assessment-container">
  <div className="pa-header">
    <h2>Main Assessment</h2>
    <p>Manage post-assessment templates organized by reading level and category.</p>
    <button 
      className="pa-add-button"
      onClick={handleCreateAssessment}
    >
      <i className="fas fa-plus"></i> Create New Assessment
    </button>
  </div>
  
  <div className="pa-filters">
    <div className="pa-search">
      <input
        type="text"
        placeholder="Search assessments..."
        value={searchTerm}
        onChange={e => setSearchTerm(e.target.value)}
      />
    </div>
    
    <div className="pa-filter-group">
      <label>Reading Level:</label>
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
      <label>Category:</label>
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
          <i className="fas fa-clipboard-list"></i>
        </div>
        <h3>No assessments found</h3>
        <p>Create your first assessment to get started.</p>
        <button 
          className="pa-create-first"
          onClick={handleCreateAssessment}
        >
          <i className="fas fa-plus"></i> Create Assessment
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
            <div className="pa-cell">{assessment.readingLevel}</div>
            <div className="pa-cell">{assessment.category}</div>
            <div className="pa-cell">{assessment.questions.length}</div>
            <div className="pa-cell">
              <span className={`pa-status ${assessment.isActive ? 'pa-active' : 'pa-inactive'}`}>
                {assessment.isActive ? 'Active' : 'Inactive'}
              </span>
            </div>
            <div className="pa-cell pa-actions">
              <button
                className="pa-edit-btn"
                onClick={() => handleEditAssessment(assessment)}
                title="Edit"
              >
                <i className="fas fa-edit"></i>
              </button>
              <button
                className="pa-preview-btn"
                onClick={() => handlePreviewAssessment(assessment)}
                title="Preview"
              >
                <i className="fas fa-eye"></i>
              </button>
              <button
                className="pa-delete-btn"
                onClick={() => handleDeleteConfirm(assessment)}
                title="Delete"
              >
                <i className="fas fa-trash"></i>
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
      <div className={`pa-modal ${modalType === 'preview' ? 'pa-modal-large' : ''}`}>
        {/* Modal Header */}
        <div className="pa-modal-header">
          <h3>
            {modalType === 'create' ? 'Create New Assessment' : 
             modalType === 'edit' ? 'Edit Assessment' :
             modalType === 'preview' ? 'Assessment Preview' :
             'Delete Assessment'}
          </h3>
          <button 
            className="pa-modal-close"
            onClick={() => setShowModal(false)}
          >
            <i className="fas fa-times"></i>
          </button>
        </div>
        
        {/* Modal Body */}
        <div className="pa-modal-body">
          {modalType === 'delete' ? (
            <div className="pa-delete-confirm">
              <div className="pa-delete-icon">
                <i className="fas fa-exclamation-triangle"></i>
              </div>
              <p>Are you sure you want to delete this assessment?</p>
              <div className="pa-assessment-details">
                <p><strong>Reading Level:</strong> {selectedAssessment.readingLevel}</p>
                <p><strong>Category:</strong> {selectedAssessment.category}</p>
                <p><strong>Questions:</strong> {selectedAssessment.questions.length}</p>
              </div>
              <p className="pa-delete-warning">This action cannot be undone.</p>
            </div>
          ) : modalType === 'preview' ? (
            <div className="pa-assessment-preview">
              <div className="pa-preview-header">
                <div className="pa-preview-info">
                  <p><strong>Reading Level:</strong> {selectedAssessment.readingLevel}</p>
                  <p><strong>Category:</strong> {selectedAssessment.category}</p>
                  <p><strong>Total Questions:</strong> {selectedAssessment.questions.length}</p>
                </div>
              </div>
              
              <div className="pa-preview-questions">
                <h4>Questions</h4>
                {selectedAssessment.questions.map((question, index) => (
                  <div key={index} className="pa-preview-question">
                    <div className="pa-question-header">
                      <span className="pa-question-number">Question {index + 1}</span>
                      <span className="pa-question-type">{question.questionType}</span>
                    </div>
                    
                    <div className="pa-question-content">
                      {question.questionImage && (
                        <div className="pa-question-image">
                          <img src={question.questionImage} alt="Question" />
                        </div>
                      )}
                      <p className="pa-question-text">{question.questionText}</p>
                      
                      {question.questionType === 'sentence' && question.passages ? (
                        <div className="pa-passage-preview">
                          <h5>Passage</h5>
                          <div className="pa-passage-pages">
                            {question.passages.map((page, pageIndex) => (
                              <div key={pageIndex} className="pa-passage-page">
                                <p><strong>Page {page.pageNumber}:</strong></p>
                                {page.pageImage && (
                                  <img src={page.pageImage} alt={`Page ${page.pageNumber}`} className="pa-page-image" />
                                )}
                                <p>{page.pageText}</p>
                              </div>
                            ))}
                          </div>
                          <h5>Comprehension Questions</h5>
                          <div className="pa-sentence-questions">
                            {question.sentenceQuestions.map((sq, sqIndex) => (
                              <div key={sqIndex} className="pa-sentence-question">
                                <p><strong>Q{sqIndex + 1}:</strong> {sq.questionText}</p>
                                <p><strong>Correct Answer:</strong> {sq.correctAnswer}</p>
                              </div>
                            ))}
                          </div>
                        </div>
                      ) : (
                        <div className="pa-choice-options">
                          <h5>Answer Options</h5>
                          <ul>
                            {question.choiceOptions.map((option, optIndex) => (
                              <li key={optIndex} className={option.isCorrect ? 'pa-correct-option' : ''}>
                                {option.optionText} {option.isCorrect ? '(Correct)' : ''}
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="pa-assessment-form">
              <div className="pa-form-group">
                <label htmlFor="readingLevel">Reading Level:</label>
                <select
                  id="readingLevel"
                  name="readingLevel"
                  value={formData.readingLevel}
                  onChange={handleFormChange}
                  required
                >
                  <option value="">Select Reading Level</option>
                  <option value="Low Emerging">Low Emerging</option>
                  <option value="Emerging">Emerging</option>
                  <option value="Developing">Developing</option>
                  <option value="Transitioning">Transitioning</option>
                  <option value="Fluent">Fluent</option>
                </select>
              </div>
              
              <div className="pa-form-group">
                <label htmlFor="category">Category:</label>
                <select
                  id="category"
                  name="category"
                  value={formData.category}
                  onChange={handleFormChange}
                  required
                >
                  <option value="">Select Category</option>
                  <option value="Alphabet Knowledge">Alphabet Knowledge</option>
                  <option value="Phonological Awareness">Phonological Awareness</option>
                  <option value="Decoding">Decoding</option>
                  <option value="Word Recognition">Word Recognition</option>
                  <option value="Reading Comprehension">Reading Comprehension</option>
                </select>
              </div>
              
              <div className="pa-form-group">
                <label>Questions:</label>
                <div className="pa-questions-container">
                  {formData.questions.length === 0 ? (
                    <div className="pa-no-questions">
                      <p>No questions added yet. Use the button below to add questions.</p>
                    </div>
                  ) : (
                    <div className="pa-question-list">
                      {formData.questions.map((question, index) => (
                        <div key={index} className="pa-question-item">
                          <div className="pa-question-item-header">
                            <span>Q{index + 1}: {question.questionText}</span>
                            <button
                              className="pa-remove-question"
                              onClick={() => handleRemoveQuestion(question.id)}
                            >
                              <i className="fas fa-times"></i>
                            </button>
                          </div>
                          <div className="pa-question-item-type">
                            <span>{question.questionType}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                  
                  <button
                    className="pa-add-question"
                    onClick={handleAddQuestion}
                    disabled={!formData.category}
                  >
                    <i className="fas fa-plus"></i> Add Question
                  </button>
                  
                  {!formData.category && (
                    <p className="pa-help-text">Select a category to add questions.</p>
                  )}
                </div>
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
                Cancel
              </button>
              <button 
                className="pa-modal-delete"
                onClick={handleDeleteAssessment}
              >
                Delete
              </button>
            </>
          ) : modalType === 'preview' ? (
            <button 
              className="pa-modal-close-btn"
              onClick={() => setShowModal(false)}
            >
              Close
            </button>
          ) : (
            <>
              <button 
                className="pa-modal-cancel"
                onClick={() => setShowModal(false)}
              >
                Cancel
              </button>
              <button 
                className="pa-modal-save"
                onClick={handleSaveAssessment}
                disabled={!formData.readingLevel || !formData.category || formData.questions.length === 0}
              >
                {modalType === 'create' ? 'Create' : 'Save'}
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  )}
</div>
);
};

export default PostAssessment;