import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  FaArrowLeft, FaChartLine, FaBook, FaLightbulb, FaListAlt,
  FaCheck, FaExclamationTriangle, FaEdit, FaCheckCircle, FaSpinner, FaUser, FaSave
} from 'react-icons/fa';

// Import components
import StudentProfileCard from '../../../components/TeacherPage/ManageProgress/StudentProfileCard';
import AssessmentSummaryCard from '../../../components/TeacherPage/ManageProgress/AssessmentSummaryCard';
import AssessmentResults from '../../../components/TeacherPage/ManageProgress/AssessmentResults';
import ProgressReport from '../../../components/TeacherPage/ManageProgress/ProgressReport';
import PrescriptiveAnalysis from '../../../components/TeacherPage/ManageProgress/PrescriptiveAnalysis';
import ActivityEditModal from '../../../components/TeacherPage/ManageProgress/ActivityEditModal';
import LoadingSpinner from '../../../components/TeacherPage/ManageProgress/common/LoadingSpinner';
import ErrorMessage from '../../../components/TeacherPage/ManageProgress/common/ErrorMessage';

import StudentApiService from '../../../services/Teachers/StudentApiService';

import '../../../css/Teachers/studentProgressView.css';

/**
 * StudentProgressView Component
 * 
 * This component displays a comprehensive view of a student's progress, assessments,
 * and allows teachers to create customized intervention activities.
 * 
 * The workflow is structured as follows:
 * 1. Student completes assessment
 * 2. Teacher reviews results (Assessment Results tab)
 * 3. If student passes all categories, they progress to next reading level
 * 4. If student fails certain categories, teacher can create targeted interventions (Prescriptive Analysis tab)
 * 5. The interventions are pushed to the student's mobile device
 * 6. Teacher monitors the student's progress on interventions
 * 
 * Each intervention is created from templates:
 * - For Alphabet Knowledge: uses patinig & katinig templates
 * - For Phonological Awareness: uses malapantig templates
 * - For Word Recognition & Decoding: uses word templates
 * - For Reading Comprehension: uses sentence templates (complete passages with questions)
 */
const StudentProgressView = () => {
  const navigate = useNavigate();
  const { id } = useParams();

  // State for student data
  const [student, setStudent] = useState(null);
  const [assessmentData, setAssessmentData] = useState(null);
  const [progressData, setProgressData] = useState(null);
  
  // State for prescriptive analysis
  const [prescriptiveRecommendations, setPrescriptiveRecommendations] = useState([]);
  
  // State for IEP report
  const [learningObjectives, setLearningObjectives] = useState([]);
  
  // UI states
  const [activeTab, setActiveTab] = useState('assessment');
  const [editingActivity, setEditingActivity] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [pushToMobileSuccess, setPushToMobileSuccess] = useState(false);

  /**
   * Fetch student data when component mounts or ID changes
   * This includes basic info, assessment results, and recommendations
   */
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
  
        // Get student details
        const studentData = await StudentApiService.getStudentDetails(id);
        setStudent(studentData);
  
        // Get assessment results
        const assessment = await StudentApiService.getAssessmentResults(id);
        setAssessmentData(assessment);
  
        // Get category results for the progress report
        const categoryResults = await StudentApiService.getCategoryResults(id);
        setProgressData(categoryResults);
        
        // Get prescriptive recommendations (for interventions)
        // In a real implementation, this would come from an API call based on assessment results
        // Here we're using mock data structured according to your database schema
        const mockRecommendations = generateMockRecommendations(studentData);
        setPrescriptiveRecommendations(mockRecommendations);
  
        // Initialize learning objectives
        initializeLearningObjectives(categoryResults);
        
        setLoading(false);
      } catch (err) {
        console.error('Error loading student data:', err);
        setError('Failed to load student data. Please try again later.');
        setLoading(false);
      }
    };
  
    fetchData();
  }, [id]);
  
  /**
   * Helper to initialize learning objectives based on category results
   * @param {Object} categoryResults - The category results from the API
   */
  const initializeLearningObjectives = (categoryResults) => {
    if (!categoryResults || !categoryResults.categories) return;
    
    // Create learning objectives based on categories
    const objectives = categoryResults.categories.map((category, index) => ({
      id: index + 1,
      title: `Mastering ${category.categoryName}`,
      category: category.categoryName,
      completed: category.isPassed,
      assistance: category.isPassed ? 'minimal' : 'moderate',
      remarks: category.isPassed 
        ? `Student has achieved mastery in ${category.categoryName}.` 
        : `Student needs additional practice in ${category.categoryName}.`,
      isEditingRemarks: false
    }));
    
    setLearningObjectives(objectives);
  };
  
  /**
   * Generate mock recommendations for the prescriptive analysis
   * @param {Object} student - The student data
   * @return {Array} An array of recommendation objects
   */
  const generateMockRecommendations = (student) => {
    // In a real implementation, these would be generated based on assessment results
    return [
      {
        id: 1,
        title: "Letter Recognition Practice",
        category: "Alphabet Knowledge",
        readingLevel: student?.readingLevel || "Low Emerging",
        score: 60,
        targetScore: 75,
        status: "draft",
        analysis: "Student struggles with distinguishing similar letters, particularly 'b', 'd', and 'p'.",
        recommendation: "Provide focused practice on distinguishing visually similar letters through systematic exposure and multisensory approaches.",
        questions: [
          {
            id: 101,
            questionText: "Anong katumbas na maliit na letra?",
            questionType: "patinig",
            options: ["a", "e", "i"],
            correctAnswer: 0
          }
        ]
      },
      {
        id: 2,
        title: "Syllable Blending",
        category: "Phonological Awareness",
        readingLevel: student?.readingLevel || "Low Emerging",
        score: 50,
        targetScore: 75,
        status: "draft",
        analysis: "Student has difficulty blending syllables to form complete words.",
        recommendation: "Practice syllable blending with simple two-syllable words, gradually increasing complexity.",
        questions: [
          {
            id: 201,
            questionText: "Kapag pinagsama ang mga pantig, ano ang mabubuo?",
            questionType: "malapantig",
            options: ["BOLA", "LABO", "MATA"],
            correctAnswer: 0
          }
        ]
      },
      {
        id: 3,
        title: "Word Recognition",
        category: "Word Recognition",
        readingLevel: student?.readingLevel || "Low Emerging",
        score: 65,
        targetScore: 75,
        status: "pushed_to_mobile",
        analysis: "Student can recognize some common words but needs more practice with less frequent vocabulary.",
        recommendation: "Expand vocabulary through regular exposure to new words with supporting visuals.",
        questions: [
          {
            id: 301,
            questionText: "Piliin ang tamang larawan para sa salitang:",
            questionType: "word",
            options: ["aso", "pusa", "bola"],
            correctAnswer: 0
          }
        ]
      },
      {
        id: 4,
        title: "Basic Story Comprehension",
        category: "Reading Comprehension",
        readingLevel: student?.readingLevel || "Low Emerging",
        score: 40,
        targetScore: 75,
        status: "draft",
        analysis: "Student struggles with remembering key details from short passages.",
        recommendation: "Practice with simple stories that include visual supports, focusing on recall of main events and characters.",
        sentenceTemplate: {
          id: 1,
          title: "Si Maria at ang mga Bulaklak",
          sentenceText: [
            {
              pageNumber: 1,
              text: "Si Maria ay pumunta sa parke. Nakita niya ang maraming bulaklak na magaganda.",
              image: "https://example.com/images/flower_park.jpg"
            }
          ],
          sentenceQuestions: [
            {
              questionNumber: 1,
              questionText: "Sino ang pangunahing tauhan sa kwento?",
              sentenceCorrectAnswer: "Si Maria",
              sentenceOptionAnswers: ["Si Maria", "Si Juan", "Ang ina", "Ang hardinero"]
            }
          ]
        }
      }
    ];
  };

  /**
   * Handle editing an activity from the prescriptive analysis
   * @param {Object} activity - The activity to edit
   */
  const handleEditActivity = (activity) => {
    setEditingActivity(activity);
  };

  /**
   * Handle saving an edited activity and pushing to mobile
   * @param {Object} updatedActivity - The updated activity
   */
  const handleSaveActivity = async (updatedActivity) => {
    try {
      setLoading(true);
      
      // In a real implementation, this would be an API call
      // Here we're just updating state directly
      
      // Update recommendations list with the edited activity
      const updatedRecommendations = prescriptiveRecommendations.map(rec => {
        if (rec.id === updatedActivity.id) {
          // Mark as pushed to mobile directly
          return { ...rec, ...updatedActivity, status: 'pushed_to_mobile' };
        }
        return rec;
      });

      setPrescriptiveRecommendations(updatedRecommendations);
      setPushToMobileSuccess(true);

      // Reset success message after 3 seconds
      setTimeout(() => {
        setPushToMobileSuccess(false);
      }, 3000);

      setEditingActivity(null);
      setLoading(false);
    } catch (err) {
      console.error('Error updating activity:', err);
      setError('Failed to update activity. Please try again.');
      setLoading(false);
    }
  };

  /**
   * Handle assistance level change in learning objectives
   * @param {number} objectiveId - The ID of the objective to update
   * @param {string} level - The new assistance level
   */
  const handleAssistanceChange = (objectiveId, level) => {
    setLearningObjectives(prev =>
      prev.map(obj =>
        obj.id === objectiveId ? { ...obj, assistance: level } : obj
      )
    );
  };

  /**
   * Toggle remarks editing state for a learning objective
   * @param {number} objectiveId - The ID of the objective to update
   */
  const toggleRemarksEditing = (objectiveId) => {
    setLearningObjectives(prev =>
      prev.map(obj =>
        obj.id === objectiveId
          ? { ...obj, isEditingRemarks: !obj.isEditingRemarks }
          : obj
      )
    );
  };

  /**
   * Update remarks for a learning objective
   * @param {number} objectiveId - The ID of the objective to update
   * @param {string} remarks - The new remarks
   */
  const handleRemarksChange = (objectiveId, remarks) => {
    setLearningObjectives(prev =>
      prev.map(obj =>
        obj.id === objectiveId ? { ...obj, remarks } : obj
      )
    );
  };

  /**
   * Navigate back to the students list
   */
  const goBack = () => {
    navigate('/teacher/manage-progress');
  };

  // Loading state
  if (loading && !student) {
    return <LoadingSpinner message="Loading student data..." />;
  }

  // Error state
  if (error && !student) {
    return <ErrorMessage message={error} retry={() => window.location.reload()} />;
  }

  return (
    <div className="literexia-profile-container">
      {/* Header */}
      <div className="literexia-profile-header">
        <div className="literexia-header-content">
          <h1>Student Progress</h1>
          <p>Review assessment results and create personalized interventions based on reading skill needs.</p>
        </div>
        <button className="literexia-btn-back" onClick={goBack}>
          <FaArrowLeft /> Back to Students List
        </button>
      </div>

      {/* Success message for push to mobile */}
      {pushToMobileSuccess && (
        <div className="literexia-success-alert">
          <FaCheckCircle />
          Activity was successfully updated and pushed to student's mobile device!
        </div>
      )}

      {/* Top cards - Student info and assessment summary */}
      <div className="literexia-top-cards">
        {student && <StudentProfileCard student={student} />}
        {assessmentData && (
          <AssessmentSummaryCard
            assessmentData={assessmentData}
          />
        )}
      </div>

      {/* Tabs navigation */}
      <div className="literexia-tabs-navigation">
        <button
          className={`literexia-tab-button ${activeTab === 'assessment' ? 'active' : ''}`}
          onClick={() => setActiveTab('assessment')}
        >
          <FaChartLine /> Pre Assessment Results
        </button>

        <button
          className={`literexia-tab-button ${activeTab === 'progress' ? 'active' : ''}`}
          onClick={() => setActiveTab('progress')}
        >
          <FaChartLine /> Post Assessment Progress
        </button>

        <button
          className={`literexia-tab-button ${activeTab === 'prescriptive' ? 'active' : ''}`}
          onClick={() => setActiveTab('prescriptive')}
        >
          <FaLightbulb /> Prescriptive Analysis
        </button>

        <button
          className={`literexia-tab-button ${activeTab === 'iep' ? 'active' : ''}`}
          onClick={() => setActiveTab('iep')}
        >
          <FaCheckCircle /> IEP Report
        </button>
      </div>

      {/* Tab content */}
      <div className="literexia-tab-content">
        {/* Pre Assessment Results Tab */}
        {activeTab === 'assessment' && (
          <div className="literexia-tab-panel">
            <div className="literexia-panel-header">
              <h2>Pre-Assessment Results (CRLA)</h2>
            </div>
            <div className="literexia-panel-content">
              {assessmentData ? (
                <AssessmentResults assessmentData={assessmentData} />
              ) : (
                <div className="literexia-empty-state">
                  <FaExclamationTriangle />
                  <p>No assessment data available for this student.</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Post Assessment Progress Tab */}
        {activeTab === 'progress' && (
          <div className="literexia-tab-panel">
            <div className="literexia-panel-header">
              <h2>Post Assessment Progress Report</h2>
            </div>
            <div className="literexia-panel-content">
              {progressData ? (
                <ProgressReport
                  progressData={progressData}
                  learningObjectives={learningObjectives}
                  setLearningObjectives={setLearningObjectives}
                />
              ) : (
                <div className="literexia-empty-state">
                  <FaExclamationTriangle />
                  <p>No progress data available for this student. They may not have completed any assessments yet.</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Prescriptive Analysis Tab - For creating interventions */}
        {activeTab === 'prescriptive' && (
          <div className="literexia-tab-panel">
            <div className="literexia-panel-header">
              <h2>Prescriptive Analysis and Intervention</h2>
            </div>
            <div className="literexia-panel-content">
              {prescriptiveRecommendations.length > 0 ? (
                <PrescriptiveAnalysis
                  recommendations={prescriptiveRecommendations}
                  onEditActivity={handleEditActivity}
                  student={student}
                />
              ) : (
                <div className="literexia-empty-state">
                  <FaExclamationTriangle />
                  <p>No personalized activities available for this student yet. Complete an assessment first.</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* IEP Report Tab */}
        {activeTab === 'iep' && (
          <div className="literexia-tab-panel">
            <div className="literexia-panel-header">
              <h2>Individualized Education Progress</h2>
            </div>
            <div className="literexia-panel-content">
              <div className="literexia-iep-info">
                <p>
                  This section shows the student's progress in meeting individualized learning objectives.
                  You can track their progress, adjust assistance levels, and add notes about their development.
                </p>
              </div>
              
              {learningObjectives.length > 0 ? (
                <div className="literexia-iep-table-container">
                  <table className="literexia-iep-table">
                    <thead>
                      <tr>
                        <th>Objective</th>
                        <th>Category</th>
                        <th>Status</th>
                        <th colSpan="3">Assistance Level</th>
                        <th>Remarks</th>
                      </tr>
                      <tr className="literexia-assistance-level-header">
                        <th></th>
                        <th></th>
                        <th></th>
                        <th>Minimal</th>
                        <th>Moderate</th>
                        <th>Substantial</th>
                        <th></th>
                      </tr>
                    </thead>
                    <tbody>
                      {learningObjectives.map((objective) => (
                        <tr key={objective.id}>
                          <td>{objective.title}</td>
                          <td>{objective.category}</td>
                          <td className="literexia-status-cell">
                            {objective.completed ? (
                              <span className="literexia-status-completed"><FaCheckCircle /> Mastered</span>
                            ) : (
                              <span className="literexia-status-in-progress">In Progress</span>
                            )}
                          </td>
                          <td className="literexia-assistance-cell">
                            <div
                              className={`literexia-assistance-checkbox ${objective.assistance === 'minimal' ? 'selected' : ''}`}
                              onClick={() => handleAssistanceChange(objective.id, 'minimal')}
                            >
                              {objective.assistance === 'minimal' && <FaCheckCircle />}
                            </div>
                          </td>
                          <td className="literexia-assistance-cell">
                            <div
                              className={`literexia-assistance-checkbox ${objective.assistance === 'moderate' ? 'selected' : ''}`}
                              onClick={() => handleAssistanceChange(objective.id, 'moderate')}
                            >
                              {objective.assistance === 'moderate' && <FaCheckCircle />}
                            </div>
                          </td>
                          <td className="literexia-assistance-cell">
                            <div
                              className={`literexia-assistance-checkbox ${objective.assistance === 'substantial' ? 'selected' : ''}`}
                              onClick={() => handleAssistanceChange(objective.id, 'substantial')}
                            >
                              {objective.assistance === 'substantial' && <FaCheckCircle />}
                            </div>
                          </td>
                          <td className="literexia-remarks-cell">
                            {objective.isEditingRemarks ? (
                              <div className="literexia-remarks-edit">
                                <textarea
                                  value={objective.remarks}
                                  onChange={(e) => handleRemarksChange(objective.id, e.target.value)}
                                  placeholder="Add notes..."
                                  className="literexia-remarks-textarea"
                                />
                                <button
                                  className="literexia-save-remarks-btn"
                                  onClick={() => toggleRemarksEditing(objective.id)}
                                >
                                  <FaSave />
                                </button>
                              </div>
                            ) : (
                              <div className="literexia-remarks-view">
                                <p>{objective.remarks || 'No notes yet.'}</p>
                                <button
                                  className="literexia-edit-remarks-btn"
                                  onClick={() => toggleRemarksEditing(objective.id)}
                                >
                                  <FaEdit />
                                </button>
                              </div>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="literexia-empty-state">
                  <FaExclamationTriangle />
                  <p>No learning objectives have been defined for this student yet.</p>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Activity edit modal - Opens when editing an activity */}
      {editingActivity && (
        <ActivityEditModal
          activity={editingActivity}
          onClose={() => setEditingActivity(null)}
          onSave={handleSaveActivity}
          student={student}
        />
      )}

      {/* Loading overlay */}
      {loading && student && <LoadingSpinner overlay message="Updating data..." />}
    </div>
  );
};

export default StudentProgressView;
