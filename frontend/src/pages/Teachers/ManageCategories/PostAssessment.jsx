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
  
  useEffect(() => {
    // Fetch assessments data
    // This would be replaced with actual API call
    const fetchAssessments = async () => {
      try {
        setLoading(true);
        
        // Mock data for now
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
            isActive: true
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
            isActive: true
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
            isActive: true
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
      assessment.readingLevel.toLowerCase().includes(searchTerm.toLowerCase());
    
    return levelMatch && categoryMatch && searchMatch;
  });
  
  const readingLevels = ["all", ...new Set(assessments.map(a => a.readingLevel).filter(Boolean))];
  const categories = ["all", ...new Set(assessments.map(a => a.category).filter(Boolean))];
  
  const handleCreateAssessment = () => {
    // Navigate to create assessment page or open a modal
    alert("Create assessment functionality will be implemented here");
  };
  
  const handleEditAssessment = (id) => {
    // Navigate to edit assessment page
    alert(`Edit assessment ${id}`);
  };
  
  const handlePreviewAssessment = (id) => {
    // Show assessment preview
    alert(`Preview assessment ${id}`);
  };
  
  const handleDeleteAssessment = (id) => {
    // Delete assessment
    if (window.confirm("Are you sure you want to delete this assessment?")) {
      setAssessments(prev => prev.filter(assessment => assessment._id !== id));
    }
  };
  
  if (loading) {
    return <div className="pa-loading">Loading assessments...</div>;
  }
  
  if (error) {
    return <div className="pa-error">{error}</div>;
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
            <p>No assessments found. Create your first assessment to get started.</p>
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
                    onClick={() => handleEditAssessment(assessment._id)}
                  >
                    <i className="fas fa-edit"></i>
                  </button>
                  <button
                    className="pa-preview-btn"
                    onClick={() => handlePreviewAssessment(assessment._id)}
                  >
                    <i className="fas fa-eye"></i>
                  </button>
                  <button
                    className="pa-delete-btn"
                    onClick={() => handleDeleteAssessment(assessment._id)}
                  >
                    <i className="fas fa-trash"></i>
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default PostAssessment;