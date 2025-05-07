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
import LessonAssignment from '../../../components/TeacherPage/ManageProgress/LessonAssignment';
import PrescriptiveAnalysis from '../../../components/TeacherPage/ManageProgress/PrescriptiveAnalysis';
import ActivityEditModal from '../../../components/TeacherPage/ManageProgress/ActivityEditModal';
import LoadingSpinner from '../../../components/TeacherPage/ManageProgress/common/LoadingSpinner';
import ErrorMessage from '../../../components/TeacherPage/ManageProgress/common/ErrorMessage';

import StudentApiService from '../../../services/StudentApiService';


import '../../../css/Teachers/studentProgressView.css';
import '../../../components/TeacherPage/ManageProgress/css/LessonProgress.css';

// Import services
import {
  getStudentDetails,
  getAssessmentResults,
  getRecommendedLessons,
  getProgressData,
  getPrescriptiveRecommendations,
  assignLessonsToStudent,
  updateActivity
} from '../../../services/ProgressService';

const StudentProgressView = () => {
  const navigate = useNavigate();
  const { id } = useParams();

  // State
  const [activeTab, setActiveTab] = useState('assessment');
  const [student, setStudent] = useState(null);
  const [assessmentData, setAssessmentData] = useState(null);
  const [progressData, setProgressData] = useState(null);
  const [recommendedLessons, setRecommendedLessons] = useState([]);
  const [selectedLessons, setSelectedLessons] = useState([]);
  const [prescriptiveRecommendations, setPrescriptiveRecommendations] = useState([]);
  const [editingActivity, setEditingActivity] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [assignmentSuccess, setAssignmentSuccess] = useState(false);
  const [lessonsAssigned, setLessonsAssigned] = useState(false);
  const [pushToMobileSuccess, setPushToMobileSuccess] = useState(false);
  const [learningObjectives, setLearningObjectives] = useState([]);
  const [editingFeedback, setEditingFeedback] = useState({});
  const [tempFeedback, setTempFeedback] = useState({});

  // Fetch student data
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
  
        // Get student details
        const studentData = await StudentApiService.getStudentDetails(id);
        setStudent(studentData);
  
        // Get assessment data
        const assessment = await StudentApiService.getAssessmentResults(id);
        setAssessmentData(assessment);
  
        // Get progress data
        const progress = await StudentApiService.getProgressData(id);
        setProgressData(progress);
  
        // Get recommended lessons
        const lessons = await StudentApiService.getRecommendedLessons(id);
        setRecommendedLessons(lessons);
  
        // Check if any lessons are already assigned
        const hasAssignedLessons = lessons.some(lesson => lesson.assigned);
        setLessonsAssigned(hasAssignedLessons);
  
        // Initialize learning objectives
        const assignedLessons = lessons.filter(lesson => lesson.assigned);
        setLearningObjectives(assignedLessons.map(lesson => ({
          id: lesson.id,
          title: lesson.title,
          assistance: null, // null, 'minimal', 'moderate', 'maximal'
          remarks: '',
          isEditingRemarks: false
        })));
  
        // If lessons are assigned, get prescription
        if (hasAssignedLessons) {
          const recommendations = await StudentApiService.getPrescriptiveRecommendations(id);
          setPrescriptiveRecommendations(recommendations);
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

  // Handle lesson selection
  const handleLessonSelect = (lesson) => {
    if (lesson.assigned) return;

    const isSelected = selectedLessons.some(l => l.id === lesson.id);

    if (isSelected) {
      setSelectedLessons(selectedLessons.filter(l => l.id !== lesson.id));
    } else {
      setSelectedLessons([...selectedLessons, lesson]);
    }
  };

  // Handle lesson assignment
  const handleAssignLessons = async () => {
    if (selectedLessons.length === 0) return;
  
    try {
      setLoading(true);
      const lessonIds = selectedLessons.map(lesson => lesson.id);
      const result = await StudentApiService.assignLessonsToStudent(id, lessonIds);
  
      if (result.success) {
        // Update assigned lessons
        const updatedLessons = recommendedLessons.map(lesson => {
          if (lessonIds.includes(lesson.id)) {
            return { ...lesson, assigned: true };
          }
          return lesson;
        });
  
        setRecommendedLessons(updatedLessons);
        setSelectedLessons([]);
        setAssignmentSuccess(true);
  
        // Get prescriptive recommendations
        const recommendations = await StudentApiService.getPrescriptiveRecommendations(id);
        setPrescriptiveRecommendations(recommendations);
  
        // Unlock the other tabs
        setLessonsAssigned(true);
  
        // Reset success message after 3 seconds
        setTimeout(() => {
          setAssignmentSuccess(false);
        }, 3000);
      }
  
      setLoading(false);
    } catch (err) {
      console.error('Error assigning lessons:', err);
      setError('Failed to assign lessons. Please try again.');
      setLoading(false);
    }
  };

  // Handle editing an activity
  const handleEditActivity = (activity) => {
    setEditingActivity(activity);
  };

  // Handle learning objective assistance level
  const handleAssistanceChange = (lessonId, level) => {
    setLearningObjectives(prev =>
      prev.map(obj =>
        obj.id === lessonId ? { ...obj, assistance: level } : obj
      )
    );
  };

  // Handle remarks editing
  const toggleRemarksEditing = (lessonId) => {
    setLearningObjectives(prev =>
      prev.map(obj =>
        obj.id === lessonId
          ? { ...obj, isEditingRemarks: !obj.isEditingRemarks }
          : obj
      )
    );
  };

  const handleRemarksChange = (lessonId, remarks) => {
    setLearningObjectives(prev =>
      prev.map(obj =>
        obj.id === lessonId ? { ...obj, remarks } : obj
      )
    );
  };

  // Handle saving edited activity and pushing to mobile
// Update the handleSaveActivity function (continued):
const handleSaveActivity = async (updatedActivity) => {
  try {
    setLoading(true);
    const result = await StudentApiService.updateActivity(updatedActivity.id, updatedActivity);

    if (result.success) {
      // Update recommendations
      const updatedRecommendations = prescriptiveRecommendations.map(rec => {
        if (rec.id === updatedActivity.id) {
          // Mark as pushed to mobile directly
          return { ...rec, ...updatedActivity, status: 'pushed_to_mobile' };
        }
        return rec;
      });

      setPrescriptiveRecommendations(updatedRecommendations);
      setPushToMobileSuccess(true);

      setTimeout(() => {
        setPushToMobileSuccess(false);
      }, 3000);
    }

    setEditingActivity(null);
    setLoading(false);
  } catch (err) {
    console.error('Error updating activity:', err);
    setError('Failed to update activity. Please try again.');
    setLoading(false);
  }
};




  // Go back to students list
  const goBack = () => {
    navigate('/teacher/manage-progress');
  };

  // Check if a tab should be locked
  const isTabLocked = (tabName) => {
    if (tabName === 'assessment' || tabName === 'lessons') {
      return false;
    }
    return !lessonsAssigned;
  };

  // Handle tab click
  const handleTabClick = (tabName) => {
    if (!isTabLocked(tabName)) {
      setActiveTab(tabName);
    }
  };

  // Calculate assigned lessons for use in rendering
  const assignedLessons = recommendedLessons.filter(lesson => lesson.assigned);

  if (loading && !student) {
    return <LoadingSpinner message="Loading student data..." />;
  }

  if (error && !student) {
    return <ErrorMessage message={error} retry={() => window.location.reload()} />;
  }

  return (
    <div className="literexia-profile-container">
      {/* Header */}
      <div className="literexia-profile-header">
        <div className="literexia-header-content">
          <h1>Student Profile and Assessment</h1>
          <p>Review assessment results and assign lessons based on reading skill level.</p>
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

      {/* Top cards */}
      <div className="literexia-top-cards">
        {student && <StudentProfileCard student={student} />}
        {assessmentData && <AssessmentSummaryCard assessmentData={assessmentData} />}
      </div>

      {/* Tabs */}
      <div className="literexia-tabs-navigation">
        <button
          className={`literexia-tab-button ${activeTab === 'assessment' ? 'active' : ''}`}
          onClick={() => handleTabClick('assessment')}
        >
          <FaChartLine /> Assessment Results
        </button>

        <button
          className={`literexia-tab-button ${activeTab === 'lessons' ? 'active' : ''}`}
          onClick={() => handleTabClick('lessons')}
        >
          <FaBook /> Lesson Assignment
        </button>

        <button
          className={`literexia-tab-button ${activeTab === 'progress' ? 'active' : ''} ${isTabLocked('progress') ? 'locked' : ''}`}
          onClick={() => handleTabClick('progress')}
        >
          <FaChartLine /> Progress Report
        </button>

        <button
          className={`literexia-tab-button ${activeTab === 'prescriptive' ? 'active' : ''} ${isTabLocked('prescriptive') ? 'locked' : ''}`}
          onClick={() => handleTabClick('prescriptive')}
        >
          <FaLightbulb /> Personalized Activities
        </button>
        <button
          className={`literexia-tab-button ${activeTab === 'lessonProgress' ? 'active' : ''} ${isTabLocked('lessonProgress') ? 'locked' : ''}`}
          onClick={() => handleTabClick('lessonProgress')}
        >
          <FaCheckCircle /> Individuaized Education Progress
        </button>


      </div>

      {/* Tab content */}
        <div className="literexia-tab-content">
          {activeTab === 'assessment' && (
            <div className="literexia-tab-panel">
          <div className="literexia-panel-header">
            <h2>Assessment Results (CRLA)</h2>
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

          {activeTab === 'lessons' && (
            <div className="literexia-tab-panel">
          <div className="literexia-panel-header">
            <h2>Assign Lessons</h2>
          </div>
          <div className="literexia-panel-content">
            <h3>Recommended Lessons for {student?.name}</h3>
            {recommendedLessons.length > 0 ? (
              <LessonAssignment
            lessons={recommendedLessons}
            selectedLessons={selectedLessons}
            onLessonSelect={handleLessonSelect}
            onAssign={handleAssignLessons}
            assignmentSuccess={assignmentSuccess}
              />
            ) : (
              <div className="literexia-empty-state">
            <FaExclamationTriangle />
            <p>No lessons available for this student at this time.</p>
              </div>
            )}
          </div>
            </div>
          )}

          {activeTab === 'progress' && !isTabLocked('progress') && (
            <div className="literexia-tab-panel">
          <div className="literexia-panel-header">
            <h2>Progress Report</h2>
          </div>
          <div className="literexia-panel-content">
            {progressData ? (
              <ProgressReport
            progressData={progressData}
            assignedLessons={recommendedLessons.filter(lesson => lesson.assigned)}
            learningObjectives={learningObjectives}
            setLearningObjectives={setLearningObjectives}
              />
            ) : (
              <div className="literexia-empty-state">
            <FaExclamationTriangle />
            <p>No progress data available for this student. They may not have completed any lessons yet.</p>
              </div>
            )}
          </div>
            </div>
          )}

          {activeTab === 'lessonProgress' && !isTabLocked('lessonProgress') && (
            <div className="literexia-tab-panel">

          {/* Progress info section */}
          <div className="literexia-progress-info" style={{ marginBottom: '30px' }}>
            {/* <div className="literexia-progress-info-icon">
            <FaBrain />
          </div> */}
            <div className="literexia-progress-info-text">
              <p>

            <h3>Individual Progress</h3>
            This section shows the student's progress in their reading activities.
            This section shows the student's progress in their reading activities.
            This section shows the student's progress in their reading activities.
            This section shows the student's progress in their reading activities.
            This section shows the student's progress in their reading activities.
              </p>
            </div>
          </div>
          
          {/* Adding a spacer div for extra spacing */}
          <div style={{ height: '20px' }}></div>

          <div className="literexia-panel-header">
            <h2>Individuaized Education Progress</h2>
          </div>
          <div className="literexia-panel-content">
            <div className="lesson-progress-container">
              {assignedLessons.length > 0 ? (
            <div className="lesson-progress-table-container">
              <table className="lesson-progress-table">
                <thead>
              <tr>
                <th>Lesson</th>
                <th>Completed</th>
                <th colSpan="3">Assistance Level</th>
                <th>Remarks</th>
              </tr>
              <tr className="assistance-level-header">
                <th></th>
                <th></th>
                <th>Minimal</th>
                <th>Moderate</th>
                <th>Substantial</th>
                <th></th>
              </tr>
                </thead>
                <tbody>
              {assignedLessons.map(lesson => {
                          // Find if there's any activity associated with this lesson
                          const isCompleted = progressData?.recentActivities?.some(
                            activity => activity.title.includes(lesson.title.substring(0, 5))
                          );

                          const existingObjective = learningObjectives?.find(obj => obj.id === lesson.id);

                          return (
                            <tr key={lesson.id}>
                              <td>{lesson.title}</td>
                              <td className="completion-cell">
                                {isCompleted ? (
                                  <span className="completed"><FaCheckCircle /></span>
                                ) : (
                                  <span className="not-completed">Not yet</span>
                                )}
                              </td>
                              <td className="assistance-cell">
                                <div
                                  className={`assistance-checkbox ${existingObjective?.assistance === 'minimal' ? 'selected' : ''}`}
                                  onClick={() => handleAssistanceChange(lesson.id, 'minimal')}
                                >
                                  {existingObjective?.assistance === 'minimal' && <FaCheckCircle />}
                                </div>
                              </td>
                              <td className="assistance-cell">
                                <div
                                  className={`assistance-checkbox ${existingObjective?.assistance === 'moderate' ? 'selected' : ''}`}
                                  onClick={() => handleAssistanceChange(lesson.id, 'moderate')}
                                >
                                  {existingObjective?.assistance === 'moderate' && <FaCheckCircle />}
                                </div>
                              </td>
                              <td className="assistance-cell">
                                <div
                                  className={`assistance-checkbox ${existingObjective?.assistance === 'maximal' ? 'selected' : ''}`}
                                  onClick={() => handleAssistanceChange(lesson.id, 'maximal')}
                                >
                                  {existingObjective?.assistance === 'maximal' && <FaCheckCircle />}
                                </div>
                              </td>
                              <td className="notes-cell">
                                {existingObjective?.isEditingRemarks ? (
                                  <div className="notes-edit">
                                    <textarea
                                      value={existingObjective.remarks}
                                      onChange={(e) => handleRemarksChange(lesson.id, e.target.value)}
                                      placeholder="Add notes..."
                                      className="notes-textarea"
                                    />
                                    <button
                                      className="save-notes-btn"
                                      onClick={() => toggleRemarksEditing(lesson.id)}
                                    >
                                      <FaSave />
                                    </button>
                                  </div>
                                ) : (
                                  <div className="notes-view">
                                    <p>{existingObjective?.remarks || 'No notes yet.'}</p>
                                    <button
                                      className="edit-notes-btn"
                                      onClick={() => toggleRemarksEditing(lesson.id)}
                                    >
                                      <FaEdit />
                                    </button>
                                  </div>
                                )}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <div className="literexia-empty-state">
                    <FaExclamationTriangle />
                    <p>No lessons have been assigned to this student yet.</p>
                    <button
                      className="goto-lessons-btn"
                      onClick={() => setActiveTab('lessons')}
                    >
                      Go to Lesson Assignment
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {activeTab === 'prescriptive' && !isTabLocked('prescriptive') && (
          <div className="literexia-tab-panel">
            <div className="literexia-panel-header">
              <h2>Personalized Activities</h2>
            </div>
            <div className="literexia-panel-content">
              <PrescriptiveAnalysis
                recommendations={prescriptiveRecommendations}
                onEditActivity={handleEditActivity}
                student={student}
              />
            </div>
          </div>
        )}

        {isTabLocked(activeTab) && activeTab !== 'assessment' && activeTab !== 'lessons' && (
          <div className="literexia-locked-content">
            <FaLightbulb className="literexia-lock-large" />
            <h3>This section is locked</h3>
            <p>You need to assign lessons first to unlock this feature.</p>
            <button
              className="literexia-btn-goto-assign"
              onClick={() => setActiveTab('lessons')}
            >
              Go to Lesson Assignment
            </button>
          </div>
        )}
      </div>

      {/* Activity edit modal */}
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