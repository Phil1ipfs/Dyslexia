import React, { useState, useEffect, useRef } from 'react';
import {
  FaArrowLeft,
  FaUser,
  FaIdCard,
  FaCalendarAlt,
  FaSchool,
  FaVenusMars,
  FaMapMarkerAlt,
  FaUsers,
  FaEnvelope,
  FaPhone,
  FaPaperPlane,
  FaSave,
  FaEdit,
  FaPrint,
  FaFilePdf,
  FaTimes,
  FaBookReader,
  FaCheckSquare,
  FaBuilding,
  FaRing,
  FaAddressCard,
  FaCheckCircle,
  FaSync
} from 'react-icons/fa';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import StudentDetailsService from '../../../services/Teachers/StudentDetailsService';
import '../../../css/Teachers/StudentDetails.css';
import { jsPDF } from 'jspdf';
import html2canvas from 'html2canvas';

// Import cradle logo - using Vite's import mechanism
const cradleLogo = new URL('../../../assets/images/Teachers/cradleLogo.jpg', import.meta.url).href;

const StudentDetails = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { id } = useParams();
  const studentId = id || (location.state?.student?.id);
  const progressReportRef = useRef(null);

  // State variables
  const [student, setStudent] = useState(null);
  const [parentProfile, setParentProfile] = useState(null);
  const [assessment, setAssessment] = useState(null);
  const [progress, setProgress] = useState(null);
  const [recommendedLessons, setRecommendedLessons] = useState([]);
  const [prescriptiveRecommendations, setPrescriptiveRecommendations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activities, setActivities] = useState([]);
  const [showSuccessDialog, setShowSuccessDialog] = useState(false);
  const [parentImageLoaded, setParentImageLoaded] = useState(false);
  const [parentImageError, setParentImageError] = useState(false);
  const [retryCount, setRetryCount] = useState(0);
  const MAX_RETRIES = 2;
  const [readingLevelProgress, setReadingLevelProgress] = useState(null);
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const questionsPerPage = 5;

  // Default progress report
  const defaultProgress = {
    schoolYear: '2024-2025',
    reportDate: new Date().toISOString().split('T')[0],
    recommendations: [
      `Student continues to develop reading skills. May need additional practice and support to improve reading comprehension.`,
      `Encourage practice with phonemic awareness activities at home to strengthen reading foundation.`,
      `Regular practice with guided reading will help improve fluency and comprehension.`
    ]
  };

  // UI state
  const [progressReport, setProgressReport] = useState(defaultProgress);
  const [feedbackMessage, setFeedbackMessage] = useState({
    subject: '',
    content: ''
  });
  const [showProgressReport, setShowProgressReport] = useState(false);
  const [isEditingFeedback, setIsEditingFeedback] = useState(false);
  const [includeProgressReport, setIncludeProgressReport] = useState(true);

  // Add a new state variable for assessment questions
  const [assessmentQuestions, setAssessmentQuestions] = useState({});

  const isParentConnected = () => {
    return (
      (parentProfile && (parentProfile.name || parentProfile.email)) ||
      (typeof student.parent === 'string' && student.parent) ||
      (student.parent && student.parent.name) ||
      (student.parentId)
    );
  };

  // Main data fetching effect
  useEffect(() => {
    if (!studentId) {
      setLoading(false);
      return;
    }

    const fetchAllStudentData = async () => {
      try {
        setLoading(true);
        console.log("Fetching data for student ID:", studentId);
  
        // Fetch student details
        const studentData = await StudentDetailsService.getStudentDetails(studentId);
  
        // Normalize reading level to new categories
        if (studentData) {
          studentData.readingLevel = StudentDetailsService.convertLegacyReadingLevel(studentData.readingLevel);
        }

        setStudent(studentData);
        console.log("Student data loaded:", studentData);

         // Fetch parent profile if parentId exists
      if (studentData && studentData.parentId) {
        try {
          console.log("Fetching parent profile for ID:", studentData.parentId);
          // Pass the student data as second parameter for fallback
          const parentData = await StudentDetailsService.getParentProfileWithFallback(
            studentData.parentId, 
            studentData
          );
          setParentProfile(parentData);
          console.log("Parent profile loaded:", parentData);

          // Set up feedback message with parent name
          setFeedbackMessage({
            subject: `Progress Report for ${studentData.name}`,
            content: `Dear ${parentData?.name || 'Parent'},\n\nI'm writing to update you on ${studentData.name}'s progress in our reading comprehension activities...`
          });
        } catch (e) {
          console.warn('Could not load parent profile:', e);
          // Set feedback with fallback parent name
          setFeedbackMessage({
            subject: `Progress Report for ${studentData.name}`,
            content: `Dear Parent,\n\nI'm writing to update you on ${studentData.name}'s progress...`
          });
        }
      }

        // Fetch other data (assessment, progress, etc.)
        const [assessmentData, progressData, lessonsData, recs, readingProgressData] = await Promise.all([
          StudentDetailsService.getAssessmentResults(studentId),
          StudentDetailsService.getProgressData(studentId),
          StudentDetailsService.getRecommendedLessons(studentId),
          StudentDetailsService.getPrescriptiveRecommendations(studentId),
          StudentDetailsService.getReadingLevelProgress(studentId)
        ]);

        setAssessment(assessmentData);
        setProgress(progressData);
        setRecommendedLessons(lessonsData);
        setPrescriptiveRecommendations(recs);
        setReadingLevelProgress(readingProgressData);
        console.log("Reading level progress data loaded:", readingProgressData);

        // Now fetch main assessment data based on student's reading level
        if (studentData && studentData.readingLevel && studentData.readingLevel !== 'Not Assessed') {
          try {
            const mainAssessmentData = await StudentDetailsService.getMainAssessment(studentData.readingLevel);
            console.log("Main assessment data loaded:", mainAssessmentData);
            
            // Organize questions by category
            const questionsByCategory = {};
            if (mainAssessmentData && Array.isArray(mainAssessmentData)) {
              mainAssessmentData.forEach(item => {
                if (item.category && item.questions && Array.isArray(item.questions)) {
                  questionsByCategory[item.category] = item.questions;
                }
              });
            }
            setAssessmentQuestions(questionsByCategory);
            
            // If we don't have a selected category yet and we have categories, select the first one
            if (!selectedCategory && Object.keys(questionsByCategory).length > 0) {
              setSelectedCategory(Object.keys(questionsByCategory)[0]);
            }
          } catch (error) {
            console.error("Error fetching main assessment data:", error);
          }
        }

        // Format activities from progress data
        if (progressData && progressData.recentActivities) {
          const formattedActivities = progressData.recentActivities.map(act => {
            const score = act.score || 0;
            return {
              id: act.id,
              name: act.title,
              description: act.category,
              completed: true,
              minimalSupport: score >= 70,
              moderateSupport: score >= 40 && score < 70,
              extensiveSupport: score < 40,
              remarks: `Student ${score >= 70 ? 'excels at' : score >= 40 ? 'is progressing with' : 'needs additional support with'} ${act.category?.toLowerCase() || 'this area'}.`
            };
          });
          setActivities(formattedActivities);
        }

        // Update progress report recommendations
        if (recs && recs.length) {
          setProgressReport(prev => ({
            ...prev,
            recommendations: recs.map(r => r.rationale || r.recommendation || r.text || '')
          }));
        }

      } catch (error) {
        console.error('Error fetching student data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchAllStudentData();
  }, [studentId]);

  const handleParentImageLoad = () => {
    console.log("Parent image loaded successfully");
    setParentImageLoaded(true);
    setParentImageError(false);
  };

  const handleParentImageError = (e) => {
    console.error("Error loading parent image:", e.target.src);
    console.warn("Failed image URL:", e.target.src);
    setParentImageError(true);
    setParentImageLoaded(false);
  
    // Add browser console debugging info
    console.info("Try accessing the image directly in your browser:", e.target.src);
    console.info("Check the Network tab in DevTools for more details on the failure");
  };
  
  // Update the retryLoadImage function:
  const retryLoadImage = () => {
    if (retryCount < MAX_RETRIES) {
      console.log(`Retrying image load (${retryCount + 1}/${MAX_RETRIES})`);
      console.log("Original URL:", parentProfile.profileImageUrl);
  
      setParentImageError(false);
      setParentImageLoaded(false);
      setRetryCount(prev => prev + 1);
  
      // Force reload with cache-busting parameter
      const cacheBuster = `cb=${Date.now()}`;
      const newUrl = parentProfile.profileImageUrl.includes('?')
        ? `${parentProfile.profileImageUrl}&${cacheBuster}`
        : `${parentProfile.profileImageUrl}?${cacheBuster}`;
  
      console.log("Retrying with URL:", newUrl);
  
      // Update the image src
      const imgElement = document.querySelector('.sdx-parent-avatar img');
      if (imgElement) {
        imgElement.src = newUrl;
      }
    }
  };

  // Export progress report to PDF
  const exportToPDF = async () => {
    const element = progressReportRef.current;
    if (!element) return;

    try {
      const canvas = await html2canvas(element, {
        scale: 2,
        useCORS: true,
        scrollY: -window.scrollY
      });

      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF('p', 'mm', 'a4');
      const pdfW = pdf.internal.pageSize.getWidth();
      const pdfH = pdf.internal.pageSize.getHeight();
      const imgW = pdfW;
      const imgH = (canvas.height * imgW) / canvas.width;

      let yOffset = 0;
      let remainingH = imgH;

      // First page
      pdf.addImage(imgData, 'PNG', 0, yOffset, imgW, imgH);
      remainingH -= pdfH;
      yOffset -= pdfH;

      // Additional pages if needed
      while (remainingH > 0) {
        pdf.addPage();
        pdf.addImage(imgData, 'PNG', 0, yOffset, imgW, imgH);
        remainingH -= pdfH;
        yOffset -= pdfH;
      }

      pdf.save(`${(student?.name || 'student').replace(/[^a-z0-9]/gi, '_')}_progress_report.pdf`);
    } catch (err) {
      console.error('PDF Export Error:', err);
      alert('Failed to export PDF – please try again.');
    }
  };

  // Helper functions
  const getReadingLevelClass = (level) => {
    const classMap = {
      'Low Emerging': 'reading-level-early',
      'High Emerging': 'reading-level-early',
      'Developing': 'reading-level-developing',
      'Transitioning': 'reading-level-developing',
      'At Grade Level': 'reading-level-fluent',
      'Advanced': 'reading-level-advanced'
    };
    return classMap[level] || 'reading-level-not-assessed';
  };

  const getReadingLevelDescription = (level) => {
    const descriptions = {
      'Low Emerging': 'Beginning to recognize letters and sounds',
      'High Emerging': 'Developing letter-sound connections',
      'Developing': 'Building phonemic awareness and basic vocabulary',
      'Transitioning': 'Building reading comprehension skills',
      'At Grade Level': 'Can read and comprehend grade-level text',
      'Advanced': 'Reading above grade level with strong comprehension'
    };
    return descriptions[level] || 'Not yet assessed - Needs initial assessment';
  };

  // UI event handlers
  const handleSaveFeedback = () => setIsEditingFeedback(false);
  const handleSendReport = () => setShowSuccessDialog(true);
  const renderCheckbox = (isChecked) => (
    <div className={`sdx-checkbox ${isChecked ? 'checked' : ''}`}>
      {isChecked && <span className="sdx-checkmark">✓</span>}
    </div>
  );
  const goBack = () => navigate('/teacher/view-student');
  const closeSuccessDialog = () => setShowSuccessDialog(false);

  // Format assessment items for display
  const formatAssessmentItems = () => {
    // If reading level progress data exists, use it
    if (readingLevelProgress && readingLevelProgress.categories && readingLevelProgress.categories.length > 0) {
      return readingLevelProgress.categories.map(category => {
        const score = category.score || 0;
        const correctAnswers = category.correctAnswers || 0;
        const totalQuestions = category.totalQuestions || 0;
        const incorrectAnswers = totalQuestions - correctAnswers;
        const description = getCategoryDescription(category.category, score);
        
        return {
          id: category.category,
          name: category.category,
          score: score,
          correctAnswers: correctAnswers,
          incorrectAnswers: incorrectAnswers,
          totalQuestions: totalQuestions,
          isPassed: category.isPassed,
          description: description,
          questions: category.questions || [] // Include the questions
        };
      });
    }
    
    // Fall back to assessment data if reading level progress is not available
    if (assessment && assessment.skillDetails) {
      return assessment.skillDetails.map(skill => {
        // Calculate incorrect answers if we have the data
        const correctAnswers = skill.correctAnswers || 0;
        const totalQuestions = skill.totalQuestions || 10; // Fallback to 10 if not specified
        const incorrectAnswers = totalQuestions - correctAnswers;
        
        return {
          id: skill.id || Math.random().toString(36).substr(2, 9),
          code: skill.category === 'Patinig' ? 'Pa' :
            skill.category === 'Pantig' ? 'Pg' :
              skill.category === 'Pagkilala ng Salita' ? 'PS' :
                skill.category === 'Pag-unawa sa Binasa' ? 'PB' : 'RL',
          name: skill.category,
          score: skill.score || 0,
          correctAnswers: correctAnswers,
          incorrectAnswers: incorrectAnswers,
          totalQuestions: totalQuestions,
          isPassed: skill.isPassed || (skill.score >= 75),
          description: skill.analysis || 'No analysis available',
          questions: [] // No questions available in this data source
        };
      });
    }
    
    return [];
  };

  // Add a helper function to get category descriptions
  const getCategoryDescription = (category, score) => {
    // Descriptions based on category and score
    if (score >= 80) {
      return `Excellent performance in ${category}. Student has mastered the key skills in this area.`;
    } else if (score >= 60) {
      return `Good progress in ${category}. Student demonstrates understanding but may benefit from additional practice.`;
    } else if (score >= 40) {
      return `Average performance in ${category}. Student needs targeted support to strengthen these skills.`;
    } else {
      return `Needs improvement in ${category}. Student requires structured intervention to develop these foundational skills.`;
    }
  };

  // Get parent name for display
  const getParentName = () => {
    // Check if parentProfile exists and has name properties
    if (parentProfile) {
      // First check for a complete name property
      if (parentProfile.name) {
        return parentProfile.name;
      }
      
      // Next check for firstName/lastName/middleName
      if (parentProfile.firstName || parentProfile.lastName) {
        return `${parentProfile.firstName || ''} ${parentProfile.middleName ? parentProfile.middleName + ' ' : ''}${parentProfile.lastName || ''}`.trim();
      }
    }
    
    // Check student.parent object
    if (typeof student.parent === 'string' && student.parent) {
      return student.parent;
    }
    
    if (student.parent && typeof student.parent === 'object') {
      // Check if parent object has a name
      if (student.parent.name) {
        return student.parent.name;
      }
      
      // Check if parent object has firstName/lastName/middleName
      if (student.parent.firstName || student.parent.lastName) {
        return `${student.parent.firstName || ''} ${student.parent.middleName ? student.parent.middleName + ' ' : ''}${student.parent.lastName || ''}`.trim();
      }
    }
    
    // Check for parentName property
    if (student.parentName) {
      return student.parentName;
    }
    
    // If parentId exists but we don't have the name, check the fallback data
    if (student.parentId) {
      // Fallback parent profiles from MongoDB if API fetch failed
      const fallbackParentProfiles = [
        { _id: "681a2933af165878136e05da", firstName: "Jan Mark", middleName: "Percival", lastName: "Caram" },
        { _id: "6827575c89b0d728f9333a20", firstName: "Kit Nicholas", middleName: "Tongol", lastName: "Santiago" },
        { _id: "682ca15af0bfb8e632bdfd13", firstName: "Rain", middleName: "Percival", lastName: "Aganan" },
        { _id: "682d75b9f7897b64cec98cc7", firstName: "Kit Nicholas", middleName: "Rish", lastName: "Aganan" },
        { _id: "6830d880779e20b64f720f44", firstName: "Kit Nicholas", middleName: "Pascual", lastName: "Caram" },
        { _id: "6835ef1645a2af9158a6d5b7", firstName: "Pia", middleName: "Zop", lastName: "Rey" }
      ];
      
      const matchedParent = fallbackParentProfiles.find(p => p._id === student.parentId);
      if (matchedParent) {
        return `${matchedParent.firstName || ''} ${matchedParent.middleName ? matchedParent.middleName + ' ' : ''}${matchedParent.lastName || ''}`.trim();
      }
      
      return `Registered Parent (ID: ${student.parentId.substring(0, 6)}...)`;
    }
    
    return 'Parent';
  };

  const renderParentImage = () => {
    if (parentProfile && parentProfile.profileImageUrl) {
      return (
        <div className="sdx-parent-avatar">
          <img
            src={parentProfile.profileImageUrl}
            alt={getParentName()}
            className="sdx-parent-avatar-img"
            onLoad={handleParentImageLoad}
            onError={handleParentImageError}
          />
          {parentImageError && retryCount < MAX_RETRIES && (
            <div className="sdx-image-retry" onClick={retryLoadImage}>
              <FaSync size={14} /> Retry
            </div>
          )}
        </div>
      );
    }

    const initial = parentProfile && parentProfile.name ?
      parentProfile.name.charAt(0).toUpperCase() :
      typeof student.parent === 'string' ?
        student.parent.charAt(0).toUpperCase() :
        student.parent && student.parent.name ?
          student.parent.name.charAt(0).toUpperCase() : 'P';

    return (
      <div className="sdx-parent-avatar-placeholder">
        {initial}
      </div>
    );
  };

  // Move these functions inside the component
  const handleCategorySelect = (categoryName) => {
    setSelectedCategory(categoryName);
    setCurrentPage(1);
  };

  const getQuestionsForCategory = () => {
    if (!selectedCategory) {
      return [];
    }
    
    // First try to get questions from assessmentQuestions
    if (assessmentQuestions && assessmentQuestions[selectedCategory]) {
      return assessmentQuestions[selectedCategory];
    }
    
    // Fallback to readingLevelProgress if we don't have data in assessmentQuestions
    if (readingLevelProgress && readingLevelProgress.categories) {
      const category = readingLevelProgress.categories.find(cat => cat.category === selectedCategory);
      return category && category.questions ? category.questions : [];
    }
    
    return [];
  };

  const handleNextPage = () => {
    const questions = getQuestionsForCategory();
    const totalPages = Math.ceil(questions.length / questionsPerPage);
    if (currentPage < totalPages) {
      setCurrentPage(currentPage + 1);
    }
  };

  const handlePrevPage = () => {
    if (currentPage > 1) {
      setCurrentPage(currentPage - 1);
    }
  };

  // Render loading state
  if (loading) {
    return (
      <div className="sdx-container">
        <div className="vs-loading">
          <div className="vs-loading-spinner"></div>
          <p>Loading student details...</p>
        </div>
      </div>
    );
  }

  // Render "not found" state
  if (!student) {
    return (
      <div className="sdx-container">
        <div className="vs-no-results">
          <p>Student not found.</p>
          <button className="sdx-back-btn" onClick={goBack}>
            <FaArrowLeft /> Back to Student List
          </button>
        </div>
      </div>
    );
  }

  // Main component render
  return (
    <div className="sdx-container">
      {/* Component JSX continues here... */}
    </div>
  );
};

export default StudentDetails; 