// src/components/TeacherPage/StudentProgressView.jsx
import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  FaArrowLeft, FaChartLine, FaBook, FaLightbulb, FaListAlt,
  FaCheck, FaExclamationTriangle, FaEdit, FaCheckCircle, FaSpinner, FaUser, FaSave,
  FaLock
} from 'react-icons/fa';

// Import components
import StudentProfileCard from '../../../components/TeacherPage/ManageProgress/StudentProfileCard';
import AssessmentSummaryCard from '../../../components/TeacherPage/ManageProgress/AssessmentSummaryCard';
import PreAssessmentResults from '../../../components/TeacherPage/ManageProgress/PreAssessmentResults';
import ProgressReport from '../../../components/TeacherPage/ManageProgress/ProgressReport';
import PrescriptiveAnalysis from '../../../components/TeacherPage/ManageProgress/PrescriptiveAnalysis';
import IEPReport from '../../../components/TeacherPage/ManageProgress/IEPReport';
import ActivityEditModal from '../../../components/TeacherPage/ManageProgress/ActivityEditModal';
import LoadingSpinner from '../../../components/TeacherPage/ManageProgress/common/LoadingSpinner';
import ErrorMessage from '../../../components/TeacherPage/ManageProgress/common/ErrorMessage';

// Import services
import StudentApiService from '../../../services/Teachers/StudentApiService';
import CategoryResultsService from '../../../services/Teachers/CategoryResultsService';
import api from '../../../services/Teachers/api';

import '../../../css/Teachers/studentProgressView.css';

/**
 * StudentProgressView Component
 * 
 * This component displays a comprehensive view of a student's progress, assessments,
 * and allows teachers to create customized intervention activities.
 */
const StudentProgressView = () => {
  const navigate = useNavigate();
  const { id } = useParams();

  // State for student data
  const [student, setStudent] = useState(null);
  const [assessmentData, setAssessmentData] = useState(null);
  const [categoryResults, setCategoryResults] = useState(null);
  const [userResponses, setUserResponses] = useState(null);
  
  // State for prescriptive analysis
  const [prescriptiveRecommendations, setPrescriptiveRecommendations] = useState([]);

  // State for IEP report
  const [learningObjectives, setLearningObjectives] = useState([]);

  // State for category access validation
  const [categoryAccessMap, setCategoryAccessMap] = useState({});
  const [categoryAccessLoading, setCategoryAccessLoading] = useState(false);

  // UI states
  const [activeTab, setActiveTab] = useState('assessment');
  const [editingActivity, setEditingActivity] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [pushToMobileSuccess, setPushToMobileSuccess] = useState(false);
  const [preAssessmentCompleted, setPreAssessmentCompleted] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState(null);

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

        // Get PRE-assessment results and status
        const preAssessmentStatus = await StudentApiService.getPreAssessmentStatus(id);
        const preAssessmentData = await StudentApiService.getPreAssessmentResults(id);
        
        // Debug logging
        console.log('Pre-assessment data received:', preAssessmentData);
        console.log('Pre-assessment status:', preAssessmentStatus);
        
        // Check if pre-assessment is completed
        const hasCompletedPreAssessment = preAssessmentStatus?.hasCompleted || 
                                          preAssessmentStatus?.preAssessmentCompleted ||
                                          (preAssessmentData && preAssessmentData.hasCompleted) ||
                                          studentData?.preAssessmentCompleted;
        
        setPreAssessmentCompleted(hasCompletedPreAssessment);
        setAssessmentData(preAssessmentData);

        // Get pre-assessment user responses
        const preAssessmentUserResponses = await StudentApiService.getPreAssessmentUserResponses(id);
        console.log('Pre-assessment user responses received:', preAssessmentUserResponses);
        setUserResponses(preAssessmentUserResponses);

        console.log("📞 ABOUT TO CALL fetchProgressData...");
        
        // Get data for progress report
        const fetchProgressData = async () => {
          console.log("🚀 Fetching POST-ASSESSMENT data specifically...");
          console.log("🚀 Student ID from useParams():", id);
          console.log("🚀 Type of ID:", typeof id);

          if (!id) {
            console.error("❌ Student ID is undefined! Cannot fetch post-assessment data.");
            return null;
          }

          try {
            console.log("🚀 About to call getPostAssessmentResults with ID:", id);
            console.log("🚀 ID Type:", typeof id);
            console.log("🚀 ID Value stringified:", JSON.stringify(id));

            // Only fetch post-assessment results - no fallbacks
            const postAssessmentResults = await StudentApiService.getPostAssessmentResults(id);
            
            console.log("🚀 Post-assessment API response:", postAssessmentResults);
            
            if (postAssessmentResults && 
                postAssessmentResults.categories && 
                postAssessmentResults.categories.length > 0) {
              console.log("✅ Found valid post-assessment data with", postAssessmentResults.categories.length, "categories");
              console.log("✅ Assessment type:", postAssessmentResults.assessmentType);
              console.log("✅ Overall score:", postAssessmentResults.overallScore);
              setCategoryResults(postAssessmentResults);
              return postAssessmentResults;
            } else {
              console.log("❌ No valid post-assessment data found");
              setCategoryResults(null);
              return null;
            }
          } catch (err) {
            console.error("❌ Error fetching post-assessment data:", err);
            setCategoryResults(null);
            return null;
          }
        };

        const progressData = await fetchProgressData();
        console.log("📞 fetchProgressData COMPLETED, result:", progressData);

        // Fetch category access validation for prerequisite blocking
        if (progressData && progressData.categories && progressData.categories.length > 0) {
          console.log("🔒 Fetching category access validation...");
          setCategoryAccessLoading(true);

          try {
            const categoryNames = progressData.categories.map(cat => cat.categoryName);
            // Use idNumber from student data (backend uses idNumber, not studentId)
            const studentIdForAPI = studentData.idNumber || studentData.studentId || id;
            console.log("🔍 Using student ID for category access validation:", studentIdForAPI);
            const accessMap = await StudentApiService.checkMultipleCategoryAccess(studentIdForAPI, categoryNames);
            console.log("🔒 Category access validation completed:", accessMap);
            setCategoryAccessMap(accessMap);
          } catch (accessError) {
            console.error("❌ Error fetching category access validation:", accessError);
            // Don't use fallback - let the UI show the error or retry
            setCategoryAccessMap({});
          } finally {
            setCategoryAccessLoading(false);
          }

          initializeLearningObjectives(progressData);
          generateRecommendationsFromResults(progressData, studentData);
        } else {
          generateMockRecommendations(studentData);
        }
        
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
    if (!categoryResults || !categoryResults.categories || categoryResults.categories.length === 0) return;
    
    // Create learning objectives based on categories
    const objectives = categoryResults.categories.map((category, index) => {
      // Format category name for display
      const displayName = category.categoryName
        .replace(/_/g, ' ')
        .replace(/\b\w/g, l => l.toUpperCase());
        
      return {
        id: index + 1,
        title: `Mastering ${displayName}`,
        category: category.categoryName,
        completed: category.isPassed,
        assistance: category.isPassed ? 'minimal' : 'moderate',
        remarks: category.isPassed 
          ? `Student has achieved mastery in ${displayName}.` 
          : `Student needs additional practice in ${displayName}.`,
        isEditingRemarks: false
      };
    });
    
    setLearningObjectives(objectives);
  };
  
  /**
   * Generate recommendations based on actual category results
   * @param {Object} results - The category results
   * @param {Object} student - The student data
   */
  const generateRecommendationsFromResults = (results, student) => {
    if (!results || !results.categories || !student) return;
    
    // Generate recommendations for categories that need improvement
    const recommendations = results.categories
      .filter(category => !category.isPassed)
      .map((category, index) => {
        // Format category name for display
        const displayName = category.categoryName
          .replace(/_/g, ' ')
          .replace(/\b\w/g, l => l.toUpperCase());
          
        // Select appropriate icon based on category
        let icon;
        let title;
        let analysis;
        let recommendation;
        let questions = [];
        
        switch(category.categoryName.toLowerCase()) {
          case 'alphabet_knowledge':
          case 'alphabet knowledge':
            title = "Letter Recognition Practice";
            analysis = "Student struggles with distinguishing similar letters.";
            recommendation = "Provide focused practice on distinguishing visually similar letters through systematic exposure and multisensory approaches.";
            questions = [
              {
                id: 101 + index,
                questionText: "Anong katumbas na maliit na letra?",
                questionType: "patinig",
                options: ["a", "e", "i"],
                correctAnswer: 0
              }
            ];
            break;
            
          case 'phonological_awareness':
          case 'phonological awareness':
            title = "Syllable Blending";
            analysis = "Student has difficulty blending syllables to form complete words.";
            recommendation = "Practice syllable blending with simple two-syllable words, gradually increasing complexity.";
            questions = [
              {
                id: 201 + index,
                questionText: "Kapag pinagsama ang mga pantig, ano ang mabubuo?",
                questionType: "malapantig",
                options: ["BOLA", "LABO", "MATA"],
                correctAnswer: 0
              }
            ];
            break;
            
          case 'word_recognition':
          case 'word recognition':
            title = "Word Recognition";
            analysis = "Student can recognize some common words but needs more practice with less frequent vocabulary.";
            recommendation = "Expand vocabulary through regular exposure to new words with supporting visuals.";
            questions = [
              {
                id: 301 + index,
                questionText: "Piliin ang tamang larawan para sa salitang:",
                questionType: "word",
                options: ["aso", "pusa", "bola"],
                correctAnswer: 0
              }
            ];
            break;
            
          case 'decoding':
            title = "Sound-Letter Correspondence";
            analysis = "Student struggles with connecting sounds to letters in unfamiliar words.";
            recommendation = "Practice decoding skills with a structured phonics approach.";
            questions = [
              {
                id: 401 + index,
                questionText: "Paano babaybayin ang salitang ito?",
                questionType: "word",
                options: ["B-O-L-A", "L-O-B-A", "B-A-L-O"],
                correctAnswer: 0
              }
            ];
            break;
            
          case 'reading_comprehension':
          case 'reading comprehension':
            title = "Basic Story Comprehension";
            analysis = "Student struggles with remembering key details from short passages.";
            recommendation = "Practice with simple stories that include visual supports, focusing on recall of main events and characters.";
            questions = [
              {
                id: 501 + index,
                questionText: "Sino ang pangunahing tauhan sa kwento?",
                questionType: "comprehension",
                options: ["Si Maria", "Si Juan", "Ang ina"],
                correctAnswer: 0
              }
            ];
            break;
            
          default:
            title = `${displayName} Practice`;
            analysis = `Student needs additional practice with ${displayName.toLowerCase()}.`;
            recommendation = `Provide structured practice in ${displayName.toLowerCase()} with regular feedback.`;
            questions = [
              {
                id: 601 + index,
                questionText: "Sample question",
                questionType: "general",
                options: ["Option A", "Option B", "Option C"],
                correctAnswer: 0
              }
            ];
        }
        
        return {
          id: index + 1,
          title: title,
          category: category.categoryName,
          readingLevel: student?.readingLevel || "Low Emerging",
          score: category.score || 0,
          targetScore: category.passingThreshold || 75,
          status: "draft",
          analysis: analysis,
          recommendation: recommendation,
          questions: questions
        };
      });
      
    setPrescriptiveRecommendations(recommendations);
  };
  
  /**
   * Generate mock recommendations for the prescriptive analysis
   * @param {Object} student - The student data
   */
  const generateMockRecommendations = (student) => {
    // Fallback recommendations
    const mockRecommendations = [
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
        status: "draft",
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
      }
    ];
    
    setPrescriptiveRecommendations(mockRecommendations);
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
      // Close the modal immediately
      setEditingActivity(null);
      
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

      // Ensure we stay on the prescriptive analysis tab
      setActiveTab('prescriptive');
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

  // Handle tab change with pre-assessment check and category results check
  const handleTabChange = (tab) => {
    if (tab === 'assessment') {
      // Pre-assessment tab is always accessible
      setActiveTab(tab);
    } else if (tab === 'progress') {
      // Post assessment progress tab requires both pre-assessment completion AND category results
      if (preAssessmentCompleted && categoryResults && categoryResults.categories && categoryResults.categories.length > 0) {
        setActiveTab(tab);
      }
    } else {
      // Other tabs (prescriptive, iep) require both pre-assessment completion AND category results
      if (preAssessmentCompleted && categoryResults && categoryResults.categories && categoryResults.categories.length > 0) {
        setActiveTab(tab);
      }
    }
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

      {/* Pre-assessment required alert */}
      {!preAssessmentCompleted && (
        <div className="literexia-warning-alert">
          <FaExclamationTriangle />
          <span>This student has not completed pre-assessment yet. Other tabs will be locked until pre-assessment is completed.</span>
        </div>
      )}

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
        
        {console.log('🔥 RENDER CHECK - StudentProgressView:')}
        {console.log('🔥 categoryResults (POST-ASSESSMENT):', categoryResults)}
        {console.log('🔥 assessmentData (PRE-ASSESSMENT):', assessmentData)}
        {console.log('🔥 student:', student)}
        {console.log('🔥 Passing to AssessmentSummaryCard:', categoryResults || assessmentData)}
        
        {/* Always prioritize categoryResults (post-assessment) over assessmentData (pre-assessment) */}
        {(categoryResults || assessmentData) ? (
          <AssessmentSummaryCard
            key={`assessment-${student?.id}-${Date.now()}`}
            assessmentData={categoryResults || assessmentData}
            student={student}
          />
        ) : (
          <div key="no-assessment-data" style={{display: 'none'}}>
            {console.log('🔥 No assessment data available for display')}
          </div>
        )}
      </div>

      {/* Tabs navigation */}
      <div className="literexia-tabs-navigation">
        <button
          className={`literexia-tab-button ${activeTab === 'assessment' ? 'active' : ''}`}
          onClick={() => handleTabChange('assessment')}
        >
          <FaChartLine /> Pre Assessment Results
        </button>

        <button
          className={`literexia-tab-button ${activeTab === 'progress' ? 'active' : ''} ${(!preAssessmentCompleted || !categoryResults || !categoryResults.categories || categoryResults.categories.length === 0) ? 'locked' : ''}`}
          onClick={() => handleTabChange('progress')}
          disabled={!preAssessmentCompleted || !categoryResults || !categoryResults.categories || categoryResults.categories.length === 0}
        >
          {(!preAssessmentCompleted || !categoryResults || !categoryResults.categories || categoryResults.categories.length === 0) && <FaLock className="lock-icon" />}
          <FaChartLine /> Post Assessment Progress
        </button>

        <button
          className={`literexia-tab-button ${activeTab === 'prescriptive' ? 'active' : ''} ${(!preAssessmentCompleted || !categoryResults || !categoryResults.categories || categoryResults.categories.length === 0) ? 'locked' : ''}`}
          onClick={() => handleTabChange('prescriptive')}
          disabled={!preAssessmentCompleted || !categoryResults || !categoryResults.categories || categoryResults.categories.length === 0}
        >
          {(!preAssessmentCompleted || !categoryResults || !categoryResults.categories || categoryResults.categories.length === 0) && <FaLock className="lock-icon" />}
          <FaLightbulb /> Prescriptive Analysis and Intervention
        </button>

        <button
          className={`literexia-tab-button ${activeTab === 'iep' ? 'active' : ''} ${(!preAssessmentCompleted || !categoryResults || !categoryResults.categories || categoryResults.categories.length === 0) ? 'locked' : ''}`}
          onClick={() => handleTabChange('iep')}
          disabled={!preAssessmentCompleted || !categoryResults || !categoryResults.categories || categoryResults.categories.length === 0}
        >
          {(!preAssessmentCompleted || !categoryResults || !categoryResults.categories || categoryResults.categories.length === 0) && <FaLock className="lock-icon" />}
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
              {assessmentData && assessmentData.skillDetails && assessmentData.skillDetails.length > 0 ? (
                <PreAssessmentResults assessmentData={assessmentData} userResponses={userResponses} student={student} categoryResults={categoryResults} />
              ) : (
                <div className="literexia-empty-state">
                  <FaExclamationTriangle />
                  <p>No pre-assessment data available for this student. The student needs to complete the pre-assessment first.</p>
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
              {categoryResults ? (
                <ProgressReport
                  progressData={categoryResults}
                  categoryAccessMap={categoryAccessMap}
                  categoryAccessLoading={categoryAccessLoading}
                  onViewRecommendations={(category) => {
                    setActiveTab('prescriptive');
                    setSelectedCategory(category.categoryName);
                  }}
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
              {student && student.readingLevel ? (
                <PrescriptiveAnalysis
                  student={student}
                  categoryResults={categoryResults}
                  prescriptiveAnalyses={null}
                  studentId={id}
                  onCreateActivity={handleEditActivity}
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
              <IEPReport
                student={student}
                learningObjectives={learningObjectives}
                onAssistanceChange={handleAssistanceChange}
                onRemarksChange={handleRemarksChange}
                onToggleRemarksEditing={toggleRemarksEditing}
              />
            </div>
          </div>
        )}
      </div>

      {/* Activity edit modal - Opens when editing an activity */}
      {editingActivity && (
        <ActivityEditModal
          activity={editingActivity}
          student={student}
          category={editingActivity?.category || 'alphabet_knowledge'}
          analysis={prescriptiveRecommendations.find(r => r.categoryId === (editingActivity?.category || 'alphabet_knowledge'))}
          onClose={() => setEditingActivity(null)}
          onSave={handleSaveActivity}
        />
      )}

      {/* Loading overlay */}
      {loading && student && <LoadingSpinner overlay message="Updating data..." />}
    </div>
  );
};

export default StudentProgressView;