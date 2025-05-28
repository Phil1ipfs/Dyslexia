// src/pages/Admin/StudentAssessmentResults.jsx
import React, { useState, useEffect } from 'react';
import { Link, useParams } from 'react-router-dom';
import { 
  ArrowLeft, FileText, BarChart2, 
  Book, Award, Layers, CheckCircle, XCircle, AlertTriangle, 
  ChevronDown, ChevronUp, Download, Printer, Share2, Edit
} from 'lucide-react';
import '../../css/Admin/AssessmentResults/StudentAssessmentResults.css';

const StudentAssessmentResults = () => {
  const { id } = useParams();
  const [student, setStudent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [expandedCategories, setExpandedCategories] = useState([]);

  useEffect(() => {
    // Simulated API call - would be replaced with actual backend call
    const fetchStudentData = async () => {
      try {
        setLoading(true);
        
        // In production, this would be replaced with an actual API call
        // e.g., const response = await axios.get(`/api/admin/assessment-results/${id}`);
        
        // Simulated student data
        const mockStudent = {
          _id: id,
          idNumber: 202522222,
          firstName: "Kit Nicholas",
          middleName: "Rish",
          lastName: "Mark",
          section: "Hope",
          gradeLevel: "Grade 2",
          age: 8,
          teacherName: "Ms. Jane Smith",
          readingLevel: "Low Emerging",
          readingPercentage: 8,
          preAssessmentCompleted: true,
          completedAt: "2025-05-23T17:53:54.969307",
          totalQuestions: 25,
          correctAnswers: 2,
          categoryScores: {
            "alphabet_knowledge": { 
              total: 5, 
              correct: 1, 
              score: 20,
              description: "Ability to recognize and name letters of the alphabet",
              questions: [
                { id: 1, question: "Identify the letter 'A'", result: "correct" },
                { id: 2, question: "Match lowercase 'b' with uppercase 'B'", result: "incorrect" },
                { id: 3, question: "Identify the letter 'M'", result: "incorrect" },
                { id: 4, question: "Identify the letter 'Z'", result: "incorrect" },
                { id: 5, question: "Match lowercase 'r' with uppercase 'R'", result: "incorrect" }
              ]
            },
            "phonological_awareness": { 
              total: 5, 
              correct: 0, 
              score: 0,
              description: "Ability to recognize and work with sounds in spoken language",
              questions: [
                { id: 1, question: "Identify the first sound in 'cat'", result: "incorrect" },
                { id: 2, question: "Identify rhyming words", result: "incorrect" },
                { id: 3, question: "Count syllables in 'butterfly'", result: "incorrect" },
                { id: 4, question: "Blend sounds /m/ /a/ /p/", result: "incorrect" },
                { id: 5, question: "Segment the word 'dog' into sounds", result: "incorrect" }
              ]
            },
            "decoding": { 
              total: 5, 
              correct: 0, 
              score: 0,
              description: "Ability to apply knowledge of letter-sound relationships to correctly pronounce written words",
              questions: [
                { id: 1, question: "Read the word 'cat'", result: "incorrect" },
                { id: 2, question: "Sound out 'dog'", result: "incorrect" },
                { id: 3, question: "Read the word 'run'", result: "incorrect" },
                { id: 4, question: "Sound out 'big'", result: "incorrect" },
                { id: 5, question: "Read the word 'sun'", result: "incorrect" }
              ]
            },
            "word_recognition": { 
              total: 5, 
              correct: 1, 
              score: 20,
              description: "Ability to identify words quickly and accurately",
              questions: [
                { id: 1, question: "Recognize the sight word 'the'", result: "correct" },
                { id: 2, question: "Recognize the sight word 'and'", result: "incorrect" },
                { id: 3, question: "Recognize the sight word 'of'", result: "incorrect" },
                { id: 4, question: "Recognize the sight word 'to'", result: "incorrect" },
                { id: 5, question: "Recognize the sight word 'in'", result: "incorrect" }
              ]
            },
            "reading_comprehension": { 
              total: 5, 
              correct: 0, 
              score: 0,
              description: "Ability to process text, understand its meaning, and integrate with what the reader already knows",
              questions: [
                { id: 1, question: "Answer a question about the main character", result: "incorrect" },
                { id: 2, question: "Identify the setting of the story", result: "incorrect" },
                { id: 3, question: "Recall a detail from the text", result: "incorrect" },
                { id: 4, question: "Understand the sequence of events", result: "incorrect" },
                { id: 5, question: "Make a prediction based on the story", result: "incorrect" }
              ]
            }
          },
          difficulties: [
            "Letter recognition, particularly lowercase letters",
            "Sound-symbol correspondence",
            "Phonemic awareness",
            "Sight word recognition",
            "Basic text comprehension"
          ],
          strengths: [
            "Can identify some uppercase letters",
            "Shows interest in books and stories",
            "Can recognize a few sight words"
          ],
          recommendations: [
            "Daily alphabet activities focusing on letter recognition",
            "Phonological awareness exercises, particularly sound isolation",
            "Guided reading practice with simple decodable texts",
            "Sight word practice using flashcards and games",
            "Interactive storytelling to build comprehension skills"
          ],
          allCategoriesPassed: false
        };
        
        setStudent(mockStudent);
      } catch (error) {
        console.error("Error fetching student assessment results:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchStudentData();
  }, [id]);

  // Format date for display
  const formatDate = (dateString) => {
    if (!dateString) return "N/A";
    
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
      });
    } catch (e) {
      return dateString;
    }
  };

  // Toggle category expansion
  const toggleCategory = (categoryId) => {
    setExpandedCategories(prev => {
      if (prev.includes(categoryId)) {
        return prev.filter(id => id !== categoryId);
      }
      return [...prev, categoryId];
    });
  };

  // Format category name for display
  const formatCategoryName = (category) => {
    if (!category) return '';
    return category
      .split('_')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  };

  if (loading) {
    return (
      <div className="student-assessment__container">
        <div className="student-assessment__loading">
          <div className="student-assessment__loading-spinner"></div>
          <p>Loading student assessment results...</p>
        </div>
      </div>
    );
  }

  if (!student) {
    return (
      <div className="student-assessment__container">
        <div className="student-assessment__error">
          <AlertTriangle size={48} />
          <h3>Student Not Found</h3>
          <p>The student assessment results could not be found.</p>
          <Link to="/admin/assessment-results-overview" className="student-assessment__back-btn">
            <ArrowLeft size={18} />
            Back to Assessment Results
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="student-assessment__container">
      {/* Header */}
      <div className="student-assessment__header">
        <Link to="/admin/assessment-results-overview" className="student-assessment__back-btn">
          <ArrowLeft size={18} />
          Back to Post Assessment Results
        </Link>
        
        <div className="student-assessment__actions">
          <button className="student-assessment__action-btn">
            <Printer size={16} />
            <span>Print</span>
          </button>
          <button className="student-assessment__action-btn">
            <Download size={16} />
            <span>Download PDF</span>
          </button>
          <button className="student-assessment__action-btn">
            <Share2 size={16} />
            <span>Share</span>
          </button>
        </div>
      </div>

      {/* Profile Card */}
      <div className="student-assessment__profile-card">
        <div className="student-assessment__profile-header">
          <div className="student-assessment__profile-avatar">
            {student.profileImageUrl ? (
              <img 
                src={student.profileImageUrl} 
                alt={`${student.firstName} ${student.lastName}`} 
                className="student-assessment__avatar-img"
              />
            ) : (
              <div className="student-assessment__avatar-placeholder">
                {student.firstName.charAt(0)}
              </div>
            )}
          </div>
          
          <div className="student-assessment__profile-info">
            <h1>{student.firstName} {student.middleName ? student.middleName + ' ' : ''}{student.lastName}</h1>
            
            <div className="student-assessment__profile-details">
              <div className="student-assessment__profile-detail">
                <span className="student-assessment__detail-label">ID Number</span>
                <span className="student-assessment__detail-value">{student.idNumber}</span>
              </div>
              
              <div className="student-assessment__profile-detail">
                <span className="student-assessment__detail-label">Grade</span>
                <span className="student-assessment__detail-value">{student.gradeLevel}</span>
              </div>
              
              <div className="student-assessment__profile-detail">
                <span className="student-assessment__detail-label">Section</span>
                <span className="student-assessment__detail-value">{student.section}</span>
              </div>
              
              <div className="student-assessment__profile-detail">
                <span className="student-assessment__detail-label">Teacher</span>
                <span className="student-assessment__detail-value">{student.teacherName}</span>
              </div>
              
              <div className="student-assessment__profile-detail">
                <span className="student-assessment__detail-label">Assessment Date</span>
                <span className="student-assessment__detail-value">{formatDate(student.completedAt)}</span>
              </div>
            </div>
          </div>
          
          <div className="student-assessment__level-badge-container">
            <div className={`student-assessment__level-badge student-assessment__level--${student.readingLevel.toLowerCase().replace(' ', '-')}`}>
              {student.readingLevel}
            </div>
            <span className="student-assessment__score-badge">Overall Score: {student.readingPercentage}%</span>
          </div>
        </div>
      </div>

      {/* Summary Section */}
      <div className="student-assessment__summary-section">
        <h2 className="student-assessment__section-title">
          <BarChart2 size={20} />
          Post Assessment Summary
        </h2>
        
        <div className="student-assessment__summary-grid">
          <div className="student-assessment__summary-card">
            <div className="student-assessment__summary-icon">
              <Book size={20} />
            </div>
            <div className="student-assessment__summary-content">
              <h3>Total Questions</h3>
              <p className="student-assessment__summary-value">{student.totalQuestions}</p>
              <p className="student-assessment__summary-detail">
                Questions across all categories
              </p>
            </div>
          </div>
          
          <div className="student-assessment__summary-card">
            <div className="student-assessment__summary-icon">
              <CheckCircle size={20} />
            </div>
            <div className="student-assessment__summary-content">
              <h3>Correct Answers</h3>
              <p className="student-assessment__summary-value">{student.correctAnswers}</p>
              <p className="student-assessment__summary-detail">
                {Math.round((student.correctAnswers / student.totalQuestions) * 100)}% accuracy rate
              </p>
            </div>
          </div>
          
          <div className="student-assessment__summary-card">
            <div className="student-assessment__summary-icon">
              <Award size={20} />
            </div>
            <div className="student-assessment__summary-content">
              <h3>Reading Level</h3>
              <p className="student-assessment__summary-value">{student.readingLevel}</p>
              <p className="student-assessment__summary-detail">
                Based on DepEd CRLA post-assessment standards
              </p>
            </div>
          </div>
          
          <div className="student-assessment__summary-card">
            <div className="student-assessment__summary-icon">
              <Layers size={20} />
            </div>
            <div className="student-assessment__summary-content">
              <h3>Categories Passed</h3>
              <p className="student-assessment__summary-value">
                {Object.values(student.categoryScores).filter(category => category.score >= 75).length} / 5
              </p>
              <p className="student-assessment__summary-detail">
                {Object.values(student.categoryScores).filter(category => category.score >= 75).length === 5 ? 
                  'All categories passed!' : 'Some categories need improvement'}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Categories Section */}
      <div className="student-assessment__categories-section">
        <h2 className="student-assessment__section-title">
          <Layers size={20} />
          Category Performance
        </h2>
        
        <div className="student-assessment__categories-grid">
          {Object.entries(student.categoryScores).map(([category, data]) => (
            <div key={category} className="student-assessment__category-card">
              <div className="student-assessment__category-header">
                <h3>{formatCategoryName(category)}</h3>
                <button 
                  className="student-assessment__toggle-btn"
                  onClick={() => toggleCategory(category)}
                >
                  {expandedCategories.includes(category) ? 
                    <ChevronUp size={18} /> : 
                    <ChevronDown size={18} />
                  }
                </button>
              </div>
              
              <div className="student-assessment__category-score">
                <div className={`student-assessment__score-circle student-assessment__score--${data.score >= 75 ? 'passed' : data.score >= 50 ? 'partial' : 'failed'}`}>
                  {data.score}%
                </div>
                
                <div className="student-assessment__score-details">
                  <p className="student-assessment__correct-count">
                    {data.correct} out of {data.total} correct
                  </p>
                  <span className={`student-assessment__status-badge ${data.score >= 75 ? 'passed' : 'failed'}`}>
                    {data.score >= 75 ? <CheckCircle size={14} /> : <XCircle size={14} />}
                    {data.score >= 75 ? 'Passed' : 'Needs Improvement'}
                  </span>
                </div>
              </div>
              
              <div className="student-assessment__progress-bar">
                <div 
                  className="student-assessment__progress-fill" 
                  style={{ width: `${data.score}%` }}
                ></div>
              </div>
              
              {expandedCategories.includes(category) && (
                <div className="student-assessment__category-details">
                  <p>{data.description}</p>
                  
                  <div className="student-assessment__questions-overview">
                    <h4>Question Results</h4>
                    <div className="student-assessment__questions-grid">
                      {data.questions.map((question, index) => (
                        <div 
                          key={question.id} 
                          className={`student-assessment__question-result ${question.result}`}
                          title={question.question}
                        >
                          {index + 1}
                          {question.result === 'correct' ? 
                            <CheckCircle size={12} /> : 
                            <XCircle size={12} />
                          }
                        </div>
                      ))}
                    </div>
                  </div>
                  
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default StudentAssessmentResults;