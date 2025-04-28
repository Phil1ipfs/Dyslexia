import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { FaArrowLeft, FaChartLine, FaBook, FaLightbulb, FaListAlt, FaLock, 
  FaCheck, FaExclamationTriangle, FaEdit, FaCheckCircle, FaSpinner, FaUser } from 'react-icons/fa';

// Import components
import StudentProfileCard from '../../components/TeacherPage/ManageProgress/StudentProfileCard';
import AssessmentSummaryCard from '../../components/TeacherPage/ManageProgress/AssessmentSummaryCard';
import AssessmentResults from '../../components/TeacherPage/ManageProgress/AssessmentResults';
import ProgressReport from '../../components/TeacherPage/ManageProgress/ProgressReport';
import LessonAssignment from '../../components/TeacherPage/ManageProgress/LessonAssignment';
import PrescriptiveAnalysis from '../../components/TeacherPage/ManageProgress/PrescriptiveAnalysis';
import AdminApprovalSection from '../../components/TeacherPage/ManageProgress/AdminApprovalSection';
import ActivityEditModal from '../../components/TeacherPage/ManageProgress/ActivityEditModal';
import LoadingSpinner from '../../components/TeacherPage/ManageProgress/common/LoadingSpinner';
import ErrorMessage from '../../components/TeacherPage/ManageProgress/common/ErrorMessage';

import '../../css/Teachers/studentProgressView.css';

// Import services
import { 
  getStudentDetails, 
  getAssessmentResults, 
  getRecommendedLessons,
  getProgressData,
  getPrescriptiveRecommendations,
  getAdminApprovals,
  assignLessonsToStudent,
  updateActivity
} from '../../services/ProgressService';

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
  const [adminApprovals, setAdminApprovals] = useState([]);
  const [editingActivity, setEditingActivity] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [assignmentSuccess, setAssignmentSuccess] = useState(false);
  const [lessonsAssigned, setLessonsAssigned] = useState(false);

  // Fetch student data
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        
        // Get student details
        const studentData = await getStudentDetails(id);
        setStudent(studentData);
        
        // Get assessment data
        const assessment = await getAssessmentResults(id);
        setAssessmentData(assessment);
        
        // Get progress data
        const progress = await getProgressData(id);
        setProgressData(progress);
        
        // Get recommended lessons
        const lessons = await getRecommendedLessons(id);
        setRecommendedLessons(lessons);
        
        // Check if any lessons are already assigned
        const hasAssignedLessons = lessons.some(lesson => lesson.assigned);
        setLessonsAssigned(hasAssignedLessons);
        
        // If lessons are assigned, get prescription and approvals
        if (hasAssignedLessons) {
          const recommendations = await getPrescriptiveRecommendations(id);
          setPrescriptiveRecommendations(recommendations);
          
          const approvals = await getAdminApprovals(id);
          setAdminApprovals(approvals);
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
      const result = await assignLessonsToStudent(id, lessonIds);
      
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
        
        // Get prescriptive recommendations and admin approvals
        const recommendations = await getPrescriptiveRecommendations(id);
        setPrescriptiveRecommendations(recommendations);
        
        const approvals = await getAdminApprovals(id);
        setAdminApprovals(approvals);
        
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

  // Handle saving edited activity
  const handleSaveActivity = async (updatedActivity) => {
    try {
      setLoading(true);
      const result = await updateActivity(updatedActivity.id, updatedActivity);
      
      if (result.success) {
        // Update recommendations
        const updatedRecommendations = prescriptiveRecommendations.map(rec => {
          if (rec.id === updatedActivity.id) {
            return { ...rec, ...updatedActivity, status: 'pending_approval' };
          }
          return rec;
        });
        
        setPrescriptiveRecommendations(updatedRecommendations);
        
        // Add to admin approvals
        setAdminApprovals([...adminApprovals, {
          ...updatedActivity,
          submittedAt: new Date().toISOString()
        }]);
        
        // Switch to admin approvals tab
        setActiveTab('approvals');
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

  if (loading && !student) {
    return <LoadingSpinner message="Naglo-load ng datos ng mag-aaral..." />;
  }

  if (error && !student) {
    return <ErrorMessage message={error} retry={() => window.location.reload()} />;
  }

  return (
    <div className="literexia-profile-container">
      {/* Header */}
      <div className="literexia-profile-header">
        <div className="literexia-header-content">
          <h1>Profail at Pagsusuri ng Mag-aaral</h1>
          <p>Suriin ang resulta ng pagsusuri at magtakda ng mga aralin batay sa antas ng kasanayan sa pagbasa.</p>
        </div>
        <button className="literexia-btn-back" onClick={goBack}>
          <FaArrowLeft /> Bumalik sa Listahan ng mga Mag-aaral
        </button>
      </div>
      
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
          <FaChartLine /> Resulta ng Pagsusuri
        </button>
        
        <button 
          className={`literexia-tab-button ${activeTab === 'lessons' ? 'active' : ''}`}
          onClick={() => handleTabClick('lessons')}
        >
          <FaBook /> Pagtatakda ng Aralin
        </button>
        
        <button 
          className={`literexia-tab-button ${activeTab === 'progress' ? 'active' : ''} ${isTabLocked('progress') ? 'locked' : ''}`}
          onClick={() => handleTabClick('progress')}
        >
          {isTabLocked('progress') && <FaLock className="literexia-lock-icon" />}
          <FaChartLine /> Talaan ng Pag-unlad
        </button>
        
        <button 
          className={`literexia-tab-button ${activeTab === 'prescriptive' ? 'active' : ''} ${isTabLocked('prescriptive') ? 'locked' : ''}`}
          onClick={() => handleTabClick('prescriptive')}
        >
          {isTabLocked('prescriptive') && <FaLock className="literexia-lock-icon" />}
          <FaLightbulb /> Pagsusuring Prescriptive
        </button>
        
        <button 
          className={`literexia-tab-button ${activeTab === 'approvals' ? 'active' : ''} ${isTabLocked('approvals') ? 'locked' : ''}`}
          onClick={() => handleTabClick('approvals')}
        >
          {isTabLocked('approvals') && <FaLock className="literexia-lock-icon" />}
          <FaListAlt /> Mga Nakabinbing Pag-apruba
        </button>
      </div>
      
      {/* Tab content */}
      <div className="literexia-tab-content">
        {activeTab === 'assessment' && (
          <div className="literexia-tab-panel">
            <div className="literexia-panel-header">
              <h2>Resulta ng Paunang Pagsusuri (CRLA)</h2>
            </div>
            <div className="literexia-panel-content">
              {assessmentData ? (
                <AssessmentResults assessmentData={assessmentData} />
              ) : (
                <div className="literexia-empty-state">
                  <FaExclamationTriangle />
                  <p>Walang available na datos ng pagsusuri para sa mag-aaral na ito.</p>
                </div>
              )}
            </div>
          </div>
        )}
        
        {activeTab === 'lessons' && (
          <div className="literexia-tab-panel">
            <div className="literexia-panel-header">
              <h2>Magtakda ng mga Aralin</h2>
            </div>
            <div className="literexia-panel-content">
              <h3>Mga Inirerekomendang Aralin para kay {student?.name}</h3>
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
                  <p>Walang available na aralin para sa mag-aaral na ito.</p>
                </div>
              )}
            </div>
          </div>
        )}
        
        {activeTab === 'progress' && !isTabLocked('progress') && (
          <div className="literexia-tab-panel">
            <div className="literexia-panel-header">
              <h2>Talaan ng Pag-unlad</h2>
            </div>
            <div className="literexia-panel-content">
              {progressData ? (
                <ProgressReport 
                  progressData={progressData} 
                  assignedLessons={recommendedLessons.filter(lesson => lesson.assigned)}
                />
              ) : (
                <div className="literexia-empty-state">
                  <FaExclamationTriangle />
                  <p>Walang datos ng pag-unlad para sa mag-aaral na ito. Maaaring hindi pa siya nakakatapos ng anumang aralin.</p>
                </div>
              )}
            </div>
          </div>
        )}
        
        {activeTab === 'prescriptive' && !isTabLocked('prescriptive') && (
          <div className="literexia-tab-panel">
            <div className="literexia-panel-header">
              <h2>Pagsusuring Prescriptive</h2>
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
        
        {activeTab === 'approvals' && !isTabLocked('approvals') && (
          <div className="literexia-tab-panel">
            <div className="literexia-panel-header">
              <h2>Mga Nakabinbing Pag-apruba</h2>
            </div>
            <div className="literexia-panel-content">
              <AdminApprovalSection recommendations={adminApprovals} />
            </div>
          </div>
        )}
        
        {isTabLocked(activeTab) && activeTab !== 'assessment' && activeTab !== 'lessons' && (
          <div className="literexia-locked-content">
            <FaLock className="literexia-lock-large" />
            <h3>Naka-lock ang seksyong ito</h3>
            <p>Kailangan mo munang magtakda ng mga aralin upang ma-unlock ang feature na ito.</p>
            <button 
              className="literexia-btn-goto-assign" 
              onClick={() => setActiveTab('lessons')}
            >
              Pumunta sa Pagtatakda ng Aralin
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
      {loading && student && <LoadingSpinner overlay message="Ina-update ang datos..." />}
    </div>
  );
};

export default StudentProgressView;