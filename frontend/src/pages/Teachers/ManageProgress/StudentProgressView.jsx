import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  FaArrowLeft, FaChartLine, FaBook, FaLightbulb, FaListAlt,
  FaCheck, FaExclamationTriangle, FaEdit, FaCheckCircle, FaSpinner, FaUserAlt, FaSave
} from 'react-icons/fa';

// Import components
import StudentProfileCard from '../../../components/TeacherPage/ManageProgress/StudentProfileCard';
import AssessmentSummaryCard from '../../../components/TeacherPage/ManageProgress/AssessmentSummaryCard';
import AssessmentResults from '../../../components/TeacherPage/ManageProgress/AssessmentResults';
import ProgressReport from '../../../components/TeacherPage/ManageProgress/ProgressReport';
import CategoryAssignment from '../../../components/TeacherPage/ManageProgress/CategoryAssignment';
import PrescriptiveAnalysis from '../../../components/TeacherPage/ManageProgress/PrescriptiveAnalysis';
import ActivityEditModal from '../../../components/TeacherPage/ManageProgress/ActivityEditModal';
import LoadingSpinner from '../../../components/TeacherPage/ManageProgress/common/LoadingSpinner';
import ErrorMessage from '../../../components/TeacherPage/ManageProgress/common/ErrorMessage';
import IndividualizedEducationProgress from '../../../components/TeacherPage/ManageProgress/IndividualizedEducationProgress';

import StudentApiService from '../../../services/Teachers/StudentApiService';

import '../../../css/Teachers/studentProgressView.css';
import '../../../components/TeacherPage/ManageProgress/css/IndividualizedEducationProgress.css';

const StudentProgressView = () => {
  const navigate = useNavigate();
  const { id } = useParams();

  // State
  const [activeTab, setActiveTab] = useState('assessment');
  const [student, setStudent] = useState(null);
  const [assessmentData, setAssessmentData] = useState(null);
  const [progressData, setProgressData] = useState(null);
  const [categoryProgress, setCategoryProgress] = useState(null);
  const [readingLevelInfo, setReadingLevelInfo] = useState(null);
  const [assignmentData, setAssignmentData] = useState([]);
  const [selectedCategories, setSelectedCategories] = useState([]);
  const [prescriptiveRecommendations, setPrescriptiveRecommendations] = useState([]);
  const [editingActivity, setEditingActivity] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [assignmentSuccess, setAssignmentSuccess] = useState(false);
  const [categoriesAssigned, setCategoriesAssigned] = useState(false);
  const [pushToMobileSuccess, setPushToMobileSuccess] = useState(false);
  const [learningObjectives, setLearningObjectives] = useState([]);
  const [editingFeedback, setEditingFeedback] = useState({});
  const [tempFeedback, setTempFeedback] = useState({});
  const [availableCategories, setAvailableCategories] = useState([]);
  const [mainAssessmentData, setMainAssessmentData] = useState([]);

// Fetch student data
useEffect(() => {
const fetchData = async () => {
  try {
    setLoading(true);

    // Get student details
    let hasError = false;
    let studentData;
    
    try {
      studentData = await StudentApiService.getStudentDetails(id);
      setStudent(studentData);
    } catch (studentError) {
      console.error('Failed to load student details:', studentError);
      hasError = true;
      // Create a default student object with reading level if in URL
      const urlSearchParams = new URLSearchParams(window.location.search);
      const readingLevel = urlSearchParams.get('readingLevel') || 'Low Emerging';
      
      studentData = {
        id: id,
        name: "Student " + id,
        firstName: "Student",
        lastName: id,
        readingLevel: readingLevel,
        gradeLevel: "Grade 1",
        // Flag to check if this is a new pre-assessment student
        preAssessmentCompleted: true,
        preAssessmentJustCompleted: true
      };
      setStudent(studentData);
    }

    // Continue with other data fetching, handling each independently
    try {
      const assessment = await StudentApiService.getPreAssessmentResults(id);
      setAssessmentData(assessment);
    } catch (assessmentError) {
      console.warn('Failed to load assessment data:', assessmentError);
      // Assessment data is optional, continue
    }

    try {
      const progress = await StudentApiService.getProgressData(id);
      setProgressData(progress);
    } catch (progressError) {
      console.warn('Failed to load progress data:', progressError);
      // Progress data is optional, continue
    }

    try {
      // For student who just completed pre-assessment, try initializing
      if (studentData?.preAssessmentCompleted && studentData?.preAssessmentJustCompleted) {
        try {
          console.log("Initializing student data after pre-assessment");
          await StudentApiService.initializeStudentAfterPreAssessment(id, studentData.readingLevel);
        } catch (initError) {
          console.warn("Failed to initialize student after pre-assessment:", initError);
        }
      }
      
      const categoryProgressData = await StudentApiService.getCategoryProgress(id);
      setCategoryProgress(categoryProgressData);
      
      // Check if any categories are already assigned
      const hasAssignedCategories = categoryProgressData && 
        categoryProgressData.categories && 
        categoryProgressData.categories.some(cat => cat.status === 'in_progress');
      
      setCategoriesAssigned(hasAssignedCategories);
      
      // Initialize learning objectives based on assigned categories
      if (hasAssignedCategories && categoryProgressData.categories) {
        const assignedCategories = categoryProgressData.categories.filter(
          cat => cat.status === 'in_progress' || cat.status === 'completed'
        );
        
        setLearningObjectives(assignedCategories.map(cat => ({
          id: cat.categoryId,
          title: cat.categoryName,
          mainAssessmentId: cat.mainAssessmentId,
          assistance: null, // null, 'minimal', 'moderate', 'maximal'
          remarks: '',
          isEditingRemarks: false
        })));
      }
      
      // If categories are assigned, get prescription
      if (hasAssignedCategories) {
        try {
          const recommendations = await StudentApiService.getPrescriptiveRecommendations(id);
          setPrescriptiveRecommendations(recommendations);
        } catch (recommendationsError) {
          console.warn('Failed to load recommendations:', recommendationsError);
        }
      }
    } catch (categoryError) {
      console.warn('Failed to load category progress:', categoryError);
      // Set default empty category progress
      setCategoryProgress({
        userId: id,
        categories: [],
        completedCategories: 0,
        totalCategories: 0,
        overallProgress: 0
      });
    }

    try {
      const readingLevelData = await StudentApiService.getReadingLevelProgression(id);
      setReadingLevelInfo(readingLevelData);
    } catch (readingLevelError) {
      console.warn('Failed to load reading level info:', readingLevelError);
    }

    try {
      const assignments = await StudentApiService.getAssessmentAssignments(id);
      setAssignmentData(assignments);
    } catch (assignmentsError) {
      console.warn('Failed to load assessment assignments:', assignmentsError);
      setAssignmentData([]);
    }

    try {
      const categories = await StudentApiService.getAssessmentCategories();
      setAvailableCategories(categories);
    } catch (categoriesError) {
      console.warn('Failed to load assessment categories:', categoriesError);
      setAvailableCategories([]);
    }

   try {
      // Check if getMainAssessmentDetails exists before calling it
      if (typeof StudentApiService.getMainAssessmentDetails === 'function') {
        const mainAssessments = await StudentApiService.getMainAssessmentDetails();
        setMainAssessmentData(mainAssessments);
      } else {
        console.warn('getMainAssessmentDetails method is not defined');
        setMainAssessmentData([]);
      }
    } catch (mainAssessmentsError) {
      console.warn('Failed to load main assessment details:', mainAssessmentsError);
      setMainAssessmentData([]);
    }

 

    // If there were any critical errors, set the error state
    if (hasError) {
      setError('Some data could not be loaded. The view may be incomplete.');
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

  // Handle category selection
  const handleCategorySelect = (category) => {
    // Check if category is already assigned
    if (categoryProgress &&
      categoryProgress.categories &&
      categoryProgress.categories.some(cat =>
        cat.categoryId === category.categoryID &&
        (cat.status === 'in_progress' || cat.status === 'completed')
      )) {
      return;
    }

    const isSelected = selectedCategories.some(c => c.categoryID === category.categoryID);

    if (isSelected) {
      setSelectedCategories(selectedCategories.filter(c => c.categoryID !== category.categoryID));
    } else {
      setSelectedCategories([...selectedCategories, category]);
    }
  };

  // Handle category assignment
  const handleAssignCategories = async () => {
    if (selectedCategories.length === 0) return;

    try {
      setLoading(true);

      // Prepare data for assignment
      const assignmentPayload = {
        studentId: id,
        readingLevel: student?.readingLevel || 'Low Emerging',
        categories: selectedCategories.map(cat => ({
          categoryId: cat.categoryID,
          categoryName: cat.categoryTitle
        }))
      };

      // Call API to assign categories
      const result = await StudentApiService.assignCategoriesToStudent(assignmentPayload);

      if (result.success) {
        // Refresh category progress data
        try {
          const updatedCategoryProgress = await StudentApiService.getCategoryProgress(id);
          setCategoryProgress(updatedCategoryProgress);
        } catch (progressError) {
          console.warn('Failed to refresh category progress:', progressError);
        }

        // Refresh assignments data
        try {
          const updatedAssignments = await StudentApiService.getAssessmentAssignments(id);
          setAssignmentData(updatedAssignments);
        } catch (assignmentsError) {
          console.warn('Failed to refresh assignments:', assignmentsError);
        }

        setSelectedCategories([]);
        setAssignmentSuccess(true);

        // Get prescriptive recommendations
        try {
          const recommendations = await StudentApiService.getPrescriptiveRecommendations(id);
          setPrescriptiveRecommendations(recommendations);
        } catch (recommendationsError) {
          console.warn('Failed to load recommendations:', recommendationsError);
        }

        // Unlock the other tabs
        setCategoriesAssigned(true);

        // Reset success message after 3 seconds
        setTimeout(() => {
          setAssignmentSuccess(false);
        }, 3000);
      }

      setLoading(false);
    } catch (err) {
      console.error('Error assigning categories:', err);
      setError('Failed to assign categories. Please try again.');
      setLoading(false);
    }
  };

  // Handle learning objective assistance level
  const handleAssistanceChange = (categoryId, level) => {
    setLearningObjectives(prev =>
      prev.map(obj =>
        obj.id === categoryId ? { ...obj, assistance: level } : obj
      )
    );
  };

  // Handle remarks editing
  const toggleRemarksEditing = (categoryId) => {
    setLearningObjectives(prev =>
      prev.map(obj =>
        obj.id === categoryId
          ? { ...obj, isEditingRemarks: !obj.isEditingRemarks }
          : obj
      )
    );
  };

  const handleRemarksChange = (categoryId, remarks) => {
    setLearningObjectives(prev =>
      prev.map(obj =>
        obj.id === categoryId ? { ...obj, remarks } : obj
      )
    );
  };

  // Add this function to StudentProgressView.jsx
  const fetchCategoryProgress = async () => {
    try {
      const updatedCategoryProgress = await StudentApiService.getCategoryProgress(id);
      setCategoryProgress(updatedCategoryProgress);

      // Check if any categories are now assigned
      const hasAssignedCategories = updatedCategoryProgress &&
        updatedCategoryProgress.categories &&
        updatedCategoryProgress.categories.some(cat => cat.status === 'in_progress');

      setCategoriesAssigned(hasAssignedCategories);

      // Initialize learning objectives based on assigned categories
      if (hasAssignedCategories && updatedCategoryProgress.categories) {
        const assignedCategories = updatedCategoryProgress.categories.filter(
          cat => cat.status === 'in_progress' || cat.status === 'completed'
        );

        setLearningObjectives(assignedCategories.map(cat => ({
          id: cat.categoryId,
          title: cat.categoryName,
          mainAssessmentId: cat.mainAssessmentId,
          assistance: null,
          remarks: '',
          isEditingRemarks: false
        })));
      }
    } catch (error) {
      console.error('Failed to refresh category progress:', error);
    }
  };

  // Handle editing an activity
  const handleEditActivity = (activity) => {
    setEditingActivity(activity);
  };

  // Handle saving edited activity and pushing to mobile
  const handleSaveActivity = async (updatedActivity) => {
    try {
      setLoading(true);
      const result = await StudentApiService.updateActivity(updatedActivity.id, updatedActivity);

      if (result.success) {
        // Update recommendations
        const updatedRecommendations = prescriptiveRecommendations.map(rec => {
          if (rec.id === updatedActivity.id) {
            // Mark as pushed to mobile
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
      }

      setEditingActivity(null);
      setLoading(false);
    } catch (err) {
      console.error('Error updating activity:', err);
      setError('Failed to update activity. Please try again.');
      setLoading(false);
    }
  };

  // Handle feedback for assessment responses
  const handleProvideFeedback = async (responseId, feedback, nextSteps) => {
    try {
      setLoading(true);
      const result = await StudentApiService.provideFeedback(responseId, {
        feedback,
        nextSteps
      });

      if (result.success) {
        // Refresh assessment data
        try {
          const updatedAssignments = await StudentApiService.getAssessmentAssignments(id);
          setAssignmentData(updatedAssignments);
        } catch (assignmentsError) {
          console.warn('Failed to refresh assignments:', assignmentsError);
        }

        setEditingFeedback({});
        setTempFeedback({});
      }

      setLoading(false);
    } catch (err) {
      console.error('Error providing feedback:', err);
      setError('Failed to save feedback. Please try again.');
      setLoading(false);
    }
  };

  // Go back to students list
  const goBack = () => {
    navigate('/teacher/manage-progress');
  };

  // Check if a tab should be locked
  const isTabLocked = (tabName) => {
    if (tabName === 'assessment' || tabName === 'categories') {
      return false;
    }
    return !categoriesAssigned;
  };

  // Handle tab click
  const handleTabClick = (tabName) => {
    if (!isTabLocked(tabName)) {
      setActiveTab(tabName);
    }
  };

  // Try clearing error and reloading component
  const handleRetry = () => {
    setError(null);
    setLoading(true);
    window.location.reload();
  };

  // Show loading spinner while initial data loads
  if (loading && !student) {
    return <LoadingSpinner message="Loading student data..." />;
  }

  // Show error message if critical data failed to load
  if (error && !student) {
    return <ErrorMessage message={error} retry={handleRetry} />;
  }

  return (
    <div className="literexia-profile-container">
      {/* Header */}
      <div className="literexia-profile-header">
        <div className="literexia-header-content">
          <h1>Student Profile and Assessment</h1>
          <p>Review assessment results and assign categories based on reading skill level.</p>
        </div>
        <button className="literexia-btn-back" onClick={goBack}>
          <FaArrowLeft /> Back to Students List
        </button>
      </div>

      {/* Warning banner for partial data load */}
      {error && student && (
        <div className="literexia-warning-alert">
          <FaExclamationTriangle />
          {error} <button onClick={handleRetry} className="literexia-retry-link">Retry loading</button>
        </div>
      )}

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
        {assessmentData && (
          <AssessmentSummaryCard
            assessmentData={assessmentData}
          />
        )}
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
          className={`literexia-tab-button ${activeTab === 'categories' ? 'active' : ''}`}
          onClick={() => handleTabClick('categories')}
        >
          <FaBook /> Category Assignment
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
          <FaLightbulb /> Prescriptive Analysis
        </button>

        <button
          className={`literexia-tab-button ${activeTab === 'individualProgress' ? 'active' : ''} ${isTabLocked('individualProgress') ? 'locked' : ''}`}
          onClick={() => handleTabClick('individualProgress')}
        >
          <FaCheckCircle /> Individualized Education Progress
        </button>
      </div>

      {/* Tab content */}
      <div className="literexia-tab-content">
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

        {activeTab === 'categories' && (
          <div className="literexia-tab-panel">
            <div className="literexia-panel-header">
              <h2>Assign Assessment Categories</h2>
            </div>
            <div className="literexia-panel-content">
              <h3>Assessment Categories for {student?.name || `Student ${id}`}</h3>
              {availableCategories && availableCategories.length > 0 ? (
                <CategoryAssignment
                  studentId={id}
                  studentName={student?.name || `Student ${id}`}
                  studentReadingLevel={student?.readingLevel || 'Low Emerging'}
                  onAssignmentComplete={(result) => {
                    setAssignmentSuccess(true);
                    setCategoriesAssigned(true);
                    // Clear selection and show success message
                    setSelectedCategories([]);
                    setTimeout(() => setAssignmentSuccess(false), 3000);

                    // Refresh category progress data
                    fetchCategoryProgress();
                  }}
                />
              ) : (
                <div className="literexia-empty-state">
                  <FaExclamationTriangle />
                  <p>No assessment categories available at this time.</p>
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
              {progressData && categoryProgress ? (
                <ProgressReport
                  progressData={progressData}
                  categoryProgress={categoryProgress}
                  readingLevelInfo={readingLevelInfo}
                  assessmentAssignments={assignmentData}
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

        {activeTab === 'individualProgress' && !isTabLocked('individualProgress') && (
          <div className="literexia-tab-panel">
            <div className="literexia-panel-header">
              <h2>Individualized Education Progress</h2>
            </div>
            <div className="literexia-panel-content">
              {categoryProgress && categoryProgress.categories && categoryProgress.categories.some(cat =>
                cat.status === 'in_progress' || cat.status === 'completed'
              ) ? (
                <IndividualizedEducationProgress
                  assignedCategories={categoryProgress.categories.filter(
                    cat => cat.status === 'in_progress' || cat.status === 'completed'
                  )}
                  progressData={progressData}
                  learningObjectives={learningObjectives}
                  onAssistanceChange={handleAssistanceChange}
                  onRemarksChange={handleRemarksChange}
                  onToggleRemarksEditing={toggleRemarksEditing}
                />
              ) : (
                <div className="literexia-empty-state">
                  <FaExclamationTriangle />
                  <p>No assigned categories found for this student.</p>
                  <button
                    className="goto-categories-btn"
                    onClick={() => setActiveTab('categories')}
                  >
                    Go to Category Assignment
                  </button>
                </div>
              )}
            </div>
          </div>
        )}

        {activeTab === 'prescriptive' && !isTabLocked('prescriptive') && (
          <div className="literexia-tab-panel">
            <div className="literexia-panel-header">
              <h2>Personalized Activities</h2>
            </div>
            <div className="literexia-panel-content">
              {prescriptiveRecommendations && prescriptiveRecommendations.length > 0 ? (
                <PrescriptiveAnalysis
                  recommendations={prescriptiveRecommendations}
                  onEditActivity={handleEditActivity}
                  student={student}
                />
              ) : (
                <div className="literexia-empty-state">
                  <FaExclamationTriangle />
                  <p>No personalized activities available for this student yet.</p>
                </div>
              )}
            </div>
          </div>
        )}

        {isTabLocked(activeTab) && activeTab !== 'assessment' && activeTab !== 'categories' && (
          <div className="literexia-locked-content">
            <FaLightbulb className="literexia-lock-large" />
            <h3>This section is locked</h3>
            <p>You need to assign assessment categories first to unlock this feature.</p>
            <button
              className="literexia-btn-goto-assign"
              onClick={() => setActiveTab('categories')}
            >
              Go to Category Assignment
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