// src/pages/Teachers/StudentDetails.jsx
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
  const questionsPerPage = 9;

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

  // Add a new state variable for category results
  const [categoryResults, setCategoryResults] = useState({});

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

        // Fetch category results for detailed question answers
        try {
          const categoryResultsData = await StudentDetailsService.getCategoryResults(studentId);
          console.log("Category results loaded:", categoryResultsData);
          
          // Check if the response is HTML instead of JSON
          if (typeof categoryResultsData === 'string' && categoryResultsData.includes('<!DOCTYPE html>')) {
            console.error('Received HTML instead of JSON for category results');
            setCategoryResults({});
          } else {
            // Organize category results by category name for easier access
            if (categoryResultsData && categoryResultsData.categories && Array.isArray(categoryResultsData.categories)) {
              const resultsByCategory = {};
              categoryResultsData.categories.forEach(categoryResult => {
                if (categoryResult.categoryName) {
                  resultsByCategory[categoryResult.categoryName] = categoryResult;
                }
              });
              setCategoryResults(resultsByCategory);
            }
          }
        } catch (error) {
          console.error("Error fetching category results:", error);
          setCategoryResults({});
        }

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

  // In StudentDetails.jsx, update the renderParentImage function:
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

  // Add these functions for category selection and pagination
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
      {/* Header */}
      <div className="sdx-header">
        <button className="sdx-back-btn" onClick={goBack}>
          <FaArrowLeft /> Back
        </button>
        <h1 className="sdx-title"></h1>
        <div className="sdx-actions">
          <button
            className="sdx-view-report-btn"
            onClick={() => setShowProgressReport(true)}
          >
            <FaFilePdf /> View Progress Report
          </button>
        </div>
      </div>

      {/* Student Profile Section */}
      <div className="sdx-profile-card">
        <div className="sdx-profile-header">
          <div className="sdx-avatar">
            {student.profileImageUrl ? (
              <img
                src={student.profileImageUrl}
                alt={student.name}
                className="sdx-avatar-img"
                onError={(e) => {
                  e.target.onerror = null;
                  e.target.style.display = "none";
                  e.target.parentElement.innerText = student.name.split(' ').map(n => n[0]).join('').toUpperCase();
                }}
              />
            ) : (
              student.name.split(' ').map(n => n[0]).join('').toUpperCase()
            )}
          </div>
          <div className="sdx-profile-info">
            <h2 className="sdx-student-name">{student.name}</h2>
            <div className="sdx-student-id">
              <FaIdCard /> ID: {student.idNumber || student.id || student._id}
            </div>
          </div>
        </div>

        <div className="sdx-profile-details">
          <div className="sdx-details-column">
            <div className="sdx-detail-item">
              <div className="sdx-detail-icon">
                <FaCalendarAlt />
              </div>
              <div className="sdx-detail-content">
                <span className="sdx-detail-label">Age</span>
                <span className="sdx-detail-value">{student.age} years old</span>
              </div>
            </div>

            <div className="sdx-detail-item">
              <div className="sdx-detail-icon">
                <FaSchool />
              </div>
              <div className="sdx-detail-content">
                <span className="sdx-detail-label">Grade </span>
                <span className="sdx-detail-value">{student.gradeLevel || 'Grade 1'}</span>
              </div>
            </div>

            <div className="sdx-detail-item">
              <div className="sdx-detail-icon">
                <FaUsers />
              </div>
              <div className="sdx-detail-content">
                <span className="sdx-detail-label">Section</span>
                <span className="sdx-detail-value">{student.section || 'Sampaguita'}</span>
              </div>
            </div>
          </div>

          <div className="sdx-details-column">
            <div className="sdx-detail-item">
              <div className="sdx-detail-icon">
                <FaVenusMars />
              </div>
              <div className="sdx-detail-content">
                <span className="sdx-detail-label">Gender</span>
                <span className="sdx-detail-value">{student.gender || 'Not specified'}</span>
              </div>
            </div>

            <div className="sdx-detail-item">
              <div className="sdx-detail-icon">
                <FaMapMarkerAlt />
              </div>
              <div className="sdx-detail-content">
                <span className="sdx-detail-label">Address</span>
                <span className="sdx-detail-value">{student.address || 'Not provided'}</span>
              </div>
            </div>

            <div className="sdx-detail-item">
              <div className="sdx-detail-icon">
                <FaBookReader />
              </div>
              <div className="sdx-detail-content">
                <span className="sdx-detail-label">Reading Level</span>
                <span className="sdx-detail-value">{student.readingLevel || 'Not Assessed'}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

   {/* Parent Information */}
<div className="sdx-parent-card">
  <h3 className="sdx-section-title">
    <FaUser /> Parent Information
  </h3>
  <div className="sdx-parent-details">
    <div className="sdx-parent-avatar">
      {renderParentImage()}
    </div>
    <div className="sdx-parent-info">
      <h4 className="sdx-parent-name">
        {isParentConnected() ? getParentName() : 'Not connected'}
      </h4>
      {isParentConnected() ? (
        <div className="sdx-parent-contact">
          <div className="sdx-contact-item">
            <FaEnvelope className="sdx-contact-icon" />
            <span>
              {parentProfile && parentProfile.email ? 
                parentProfile.email : 
                typeof student.parentEmail === 'string' ? 
                  student.parentEmail : 
                  student.parent && student.parent.email ? 
                    student.parent.email : 'Not available'}
            </span>
          </div>
          <div className="sdx-contact-item">
            <FaPhone className="sdx-contact-icon" />
            <span>
              {parentProfile && parentProfile.contact ? 
                parentProfile.contact : 
                typeof student.parentContact === 'string' ? 
                  student.parentContact : 
                  student.parent && student.parent.contact ? 
                    student.parent.contact : 'Not available'}
            </span>
          </div>
        </div>
      ) : (
        <div className="sdx-parent-contact">
          <div className="sdx-contact-item">
            <FaEnvelope className="sdx-contact-icon" />
            <span>Not available</span>
          </div>
          <div className="sdx-contact-item">
            <FaPhone className="sdx-contact-icon" />
            <span>Not available</span>
          </div>
        </div>
      )}
    </div>

    {/* Additional parent details in grid format */}
    <div className="sdx-parent-details-grid">
      <div className="sdx-contact-item">
        <FaAddressCard className="sdx-contact-icon" />
        <div className="sdx-detail-content">
          <span className="sdx-detail-label">Address</span>
          <span className="sdx-detail-value">
            {parentProfile && parentProfile.address ? 
              parentProfile.address : 
              student.parent && typeof student.parent === 'object' && student.parent.address ? 
                student.parent.address : 'Not provided'}
          </span>
        </div>
      </div>
      <div className="sdx-contact-item">
        <FaRing className="sdx-contact-icon" />
        <div className="sdx-detail-content">
          <span className="sdx-detail-label">Civil Status</span>
          <span className="sdx-detail-value">
            {parentProfile && parentProfile.civilStatus ? 
              parentProfile.civilStatus : 
              student.parent && typeof student.parent === 'object' && student.parent.civilStatus ? 
                student.parent.civilStatus : 'Not provided'}
          </span>
        </div>
      </div>
      <div className="sdx-contact-item">
        <FaVenusMars className="sdx-contact-icon" />
        <div className="sdx-detail-content">
          <span className="sdx-detail-label">Gender</span>
          <span className="sdx-detail-value">
            {parentProfile && parentProfile.gender ? 
              parentProfile.gender : 
              student.parent && typeof student.parent === 'object' && student.parent.gender ? 
                student.parent.gender : 'Not provided'}
          </span>
        </div>
      </div>
      <div className="sdx-contact-item">
        <FaBuilding className="sdx-contact-icon" />
        <div className="sdx-detail-content">
          <span className="sdx-detail-label">Occupation</span>
          <span className="sdx-detail-value">
            {parentProfile && parentProfile.occupation ? 
              parentProfile.occupation : 
              student.parent && typeof student.parent === 'object' && student.parent.occupation ? 
                student.parent.occupation : 'Not provided'}
          </span>
        </div>
      </div>
    </div>
  </div>
</div>

      {/* Learning Activities and Progress Section */}
      <div className="sdx-activities-card">
        <h3 className="sdx-section-title">
          <FaBookReader /> Learning Activities and Progress
        </h3>

        {activities && activities.length > 0 ? (
          <div className="sdx-activities-table">
            <div className="sdx-table-header">
              <div className="sdx-header-cell sdx-activity-name">Lesson</div>
              <div className="sdx-header-cell sdx-activity-completed">Completed</div>
              <div className="sdx-header-cell sdx-activity-progress-label" colSpan="3">Progress Level</div>
              <div className="sdx-header-cell sdx-activity-remarks">Remarks</div>
            </div>

            <div className="sdx-table-subheader">
              <div className="sdx-subheader-cell sdx-placeholder"></div>
              <div className="sdx-subheader-cell sdx-placeholder"></div>
              <div className="sdx-subheader-cell sdx-support-level">Minimal support</div>
              <div className="sdx-subheader-cell sdx-support-level">Moderate support</div>
              <div className="sdx-subheader-cell sdx-support-level">Extensive support</div>
              <div className="sdx-subheader-cell sdx-placeholder"></div>
            </div>

            {activities.map((activity, index) => (
              <div key={index} className="sdx-table-row">
                <div className="sdx-cell sdx-activity-name">{activity.name}</div>
                <div className="sdx-cell sdx-activity-completed">
                  {renderCheckbox(activity.completed)}
                </div>
                <div className="sdx-cell sdx-activity-support">
                  {renderCheckbox(activity.minimalSupport)}
                </div>
                <div className="sdx-cell sdx-activity-support">
                  {renderCheckbox(activity.moderateSupport)}
                </div>
                <div className="sdx-cell sdx-activity-support">
                  {renderCheckbox(activity.extensiveSupport)}
                </div>
                <div className="sdx-cell sdx-activity-remarks">{activity.remarks}</div>
              </div>
            ))}
          </div>
        ) : (
          <div className="sdx-no-activities">
            <p>No learning activities recorded yet.</p>
            {!student.preAssessmentCompleted && (
              <p>Student needs to complete pre-assessment first.</p>
            )}
          </div>
        )}
      </div>

      {/* Reading Level Progress Section */}
      {(assessment || readingLevelProgress) && (
        <div className="sdx-assessment-card">
          <h3 className="sdx-section-title">
            <FaBookReader /> Reading Level Progress
          </h3>
          <div className="sdx-assessment-content">
            <div className="sdx-level-info">
              <div className={`sdx-level-badge ${getReadingLevelClass(student.readingLevel || 'Not Assessed')}`}>
                {student.readingLevel || 'Not Assessed'}
              </div>
              <div className="sdx-level-details">
                <span className="sdx-level-name">{student.readingLevel || 'Not Assessed'}</span>
                <span className="sdx-level-description">
                  {getReadingLevelDescription(student.readingLevel || 'Not Assessed')}
                </span>
              </div>
            </div>

            {/* Category Summary Cards */}
            <div className="sdx-category-selector">
              <h4 className="sdx-category-selector-title">Assessment Categories</h4>
              <div className="sdx-category-cards">
                {formatAssessmentItems().map((skill, index) => (
                  <div 
                    key={index} 
                    className={`sdx-category-card ${selectedCategory === skill.name ? 'selected' : ''}`}
                    onClick={() => handleCategorySelect(skill.name)}
                  >
                    <div className="sdx-category-card-header">
                      <span className="sdx-category-name">{skill.name}</span>
                      <span className={`sdx-category-score ${skill.score >= 80 ? 'score-excellent' :
                        skill.score >= 60 ? 'score-good' :
                          skill.score >= 40 ? 'score-average' :
                            'score-needs-improvement'
                        }`}>{skill.score}%</span>
                    </div>
                    
                    <div className="sdx-category-progress">
                      <div 
                        className={`sdx-category-progress-bar ${skill.score >= 80 ? 'score-excellent' :
                          skill.score >= 60 ? 'score-good' :
                            skill.score >= 40 ? 'score-average' :
                              'score-needs-improvement'
                          }`}
                        style={{ width: `${skill.score}%` }}
                      ></div>
                    </div>
                    
                    <div className="sdx-category-details">
                      <span className="sdx-category-correct">
                        <span className="sdx-category-status-icon correct">✓</span> {skill.correctAnswers} correct
                      </span>
                      <span className="sdx-category-incorrect">
                        <span className="sdx-category-status-icon incorrect">✗</span> {skill.incorrectAnswers} incorrect
                      </span>
                    </div>
                    
                    <div className="sdx-category-status">
                      <span className={`sdx-category-passed-badge ${skill.isPassed ? 'passed' : 'failed'}`}>
                        {skill.isPassed ? 'Passed' : 'Not Passed'}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Question Details Section */}
            {selectedCategory && (
              <div className="sdx-question-details">
                <h4 className="sdx-question-details-title">
                  {selectedCategory} Questions
                  {getQuestionsForCategory().length > 0 && (
                    <span className="sdx-question-pagination-info">
                      Page {currentPage} of {Math.ceil(getQuestionsForCategory().length / questionsPerPage)}
                    </span>
                  )}
                </h4>
                
                <div className="sdx-questions-list">
                  {getQuestionsForCategory().length > 0 ? (
                    getQuestionsForCategory()
                      .slice((currentPage - 1) * questionsPerPage, currentPage * questionsPerPage)
                      .map((question, index) => (
                        <div key={index} className="sdx-question-item">
                          <div className="sdx-question-number">
                            Q{(currentPage - 1) * questionsPerPage + index + 1}
                          </div>
                          <div className="sdx-question-content">
                            <div className="sdx-question-text">
                              <strong>Question:</strong> {question.questionText}
                              {question.questionValue && (
                                <div className="sdx-question-value">{question.questionValue}</div>
                              )}
                            </div>
                            
                            {question.questionImage && (
                              <div className="sdx-question-image-container">
                                <img 
                                  src={question.questionImage} 
                                  alt="Question visual" 
                                  className="sdx-question-image" 
                                  onError={(e) => {
                                    console.warn("Failed to load question image:", e.target.src);
                                    e.target.style.display = "none";
                                  }}
                                />
                              </div>
                            )}
                            
                            {question.choiceOptions && question.choiceOptions.length > 0 && (
                              <div className="sdx-question-options">
                                <div className="sdx-options-label">Options:</div>
                                <div className="sdx-options-list">
                                  {question.choiceOptions.map((option, optIndex) => (
                                    <div 
                                      key={optIndex} 
                                      className={`sdx-option-item ${option.isCorrect ? 'correct' : ''}`}
                                    >
                                      <span className={`sdx-option-marker ${option.isCorrect ? 'correct' : ''}`}>
                                        {option.isCorrect ? '✓' : '○'}
                                      </span>
                                      <span className="sdx-option-text">{option.optionText}</span>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            )}
                            
                            {/* For sentence questions with passages */}
                            {question.passages && question.passages.length > 0 && (
                              <div className="sdx-question-passage">
                                <div className="sdx-passage-label">Reading Passage:</div>
                                {question.passages.map((passage, passageIndex) => (
                                  <div key={passageIndex} className="sdx-passage-content">
                                    <div className="sdx-passage-page">Page {passage.pageNumber}</div>
                                    <div className="sdx-passage-text">{passage.pageText}</div>
                                    {passage.pageImage && (
                                      <div className="sdx-passage-image-container">
                                        <img 
                                          src={passage.pageImage} 
                                          alt={`Passage visual ${passage.pageNumber}`} 
                                          className="sdx-passage-image"
                                          onError={(e) => {
                                            console.warn("Failed to load passage image:", e.target.src);
                                            e.target.style.display = "none";
                                          }}
                                        />
                                      </div>
                                    )}
                                  </div>
                                ))}
                              </div>
                            )}
                            
                            {/* For sentence questions with subquestions */}
                            {question.sentenceQuestions && question.sentenceQuestions.length > 0 && (
                              <div className="sdx-question-subquestions">
                                <div className="sdx-subquestions-label">Comprehension Questions:</div>
                                {question.sentenceQuestions.map((subq, subqIndex) => (
                                  <div key={subqIndex} className="sdx-subquestion-item">
                                    <div className="sdx-subquestion-text">{subq.questionText}</div>
                                    <div className="sdx-subquestion-options">
                                      <div className={`sdx-suboption-item correct`}>
                                        <span className="sdx-suboption-marker correct">✓</span>
                                        <span className="sdx-suboption-text">{subq.correctAnswer}</span>
                                      </div>
                                      <div className={`sdx-suboption-item incorrect`}>
                                        <span className="sdx-suboption-marker incorrect">✗</span>
                                        <span className="sdx-suboption-text">{subq.incorrectAnswer}</span>
                                      </div>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                        </div>
                      ))
                  ) : (
                    <div className="sdx-no-questions">
                      <p>No detailed questions available for this category.</p>
                      <p>The assessment data shows overall performance but individual questions are not available.</p>
                    </div>
                  )}
                </div>
                
                {/* Pagination Controls */}
                {getQuestionsForCategory().length > questionsPerPage && (
                  <div className="sdx-pagination-controls">
                    <button 
                      className="sdx-pagination-btn prev" 
                      onClick={handlePrevPage}
                      disabled={currentPage === 1}
                    >
                      Previous
                    </button>
                    <span className="sdx-pagination-info">
                      Page {currentPage} of {Math.ceil(getQuestionsForCategory().length / questionsPerPage)}
                    </span>
                    <button 
                      className="sdx-pagination-btn next" 
                      onClick={handleNextPage}
                      disabled={currentPage >= Math.ceil(getQuestionsForCategory().length / questionsPerPage)}
                    >
                      Next
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Send Progress Report Section */}
      <div className="sdx-send-report-section">
        <h3 className="sdx-section-title">
          <FaPaperPlane /> Send Report to Parent
        </h3>

        <div className="sdx-message-box">
          <div className="sdx-message-header">
            <div className="sdx-message-subject">
              <label><strong>Subject:</strong></label>
              {isEditingFeedback ? (
                <input
                  type="text"
                  value={feedbackMessage.subject}
                  onChange={(e) => setFeedbackMessage({ ...feedbackMessage, subject: e.target.value })}
                  className="sdx-subject-input"
                />
              ) : (
                <span>{feedbackMessage.subject}</span>
              )}
            </div>
            <div className="sdx-message-recipient">
              <span>To:</span>
              <div className="sdx-recipient-badge">
                <FaUser className="sdx-recipient-icon" />
                <span>{getParentName()}</span>
              </div>
            </div>
          </div>

          <div className="sdx-message-content">
            {isEditingFeedback ? (
              <textarea
                value={feedbackMessage.content}
                onChange={(e) => setFeedbackMessage({ ...feedbackMessage, content: e.target.value })}
                className="sdx-message-textarea"
                rows="6"
              ></textarea>
            ) : (
              <p className="sdx-message-text">{feedbackMessage.content}</p>
            )}
          </div>

          <div className="sdx-include-report">
            <label className="sdx-include-report-label">
              <input
                type="checkbox"
                checked={includeProgressReport}
                onChange={() => setIncludeProgressReport(!includeProgressReport)}
                className="sdx-include-report-checkbox"
              />
              <FaCheckSquare className={`sdx-checkbox-icon ${includeProgressReport ? 'checked' : ''}`} />
              <span><strong>Include Progress Report</strong></span>
            </label>
          </div>

          <div className="sdx-message-actions">
            {isEditingFeedback ? (
              <button
                className="sdx-save-btn"
                onClick={handleSaveFeedback}
              >
                <FaSave /> Save Message
              </button>
            ) : (
              <button
                className="sdx-edit-btn"
                onClick={() => setIsEditingFeedback(true)}
              >
                <FaEdit /> Edit Message
              </button>
            )}

            <button
              className="sdx-send-btn"
              onClick={handleSendReport}
              disabled={isEditingFeedback}
            >
              <FaPaperPlane /> Send Report
            </button>
          </div>
        </div>
      </div>

      {/* Progress Report Modal */}
      {showProgressReport && (
        <div className="sdx-modal-overlay" onClick={() => setShowProgressReport(false)}>
          <div className="sdx-modal-content" onClick={e => e.stopPropagation()}>
            <div className="sdx-modal-header">
              <h2 className="sdx-modal-title">Progress Report</h2>
              <div className="sdx-modal-actions">
                <button className="sdx-export-btn" onClick={exportToPDF}>
                  <FaFilePdf /> Export as PDF
                </button>
                <button
                  className="sdx-close-btn"
                  onClick={() => setShowProgressReport(false)}
                >
                  <FaTimes />
                </button>
              </div>
            </div>

            {/* Scrollable wrapper keeps the scrollbar */}
            <div className="sdx-scroll-wrapper">
              {/* Printable body (FULL height) */}
              <div className="sdx-report-printable" ref={progressReportRef}>
                {/* Report Header */}
                <div className="sdx-report-header">
                  <img src={cradleLogo} alt="Cradle of Learners Logo" className="sdx-report-logo" />
                  <div className="sdx-report-school-info">
                    <h1 className="sdx-report-school-name">CRADLE OF LEARNERS</h1>
                    <p className="sdx-report-school-tagline">(Inclusive School for Individualized Education), Inc.</p>
                    <p className="sdx-report-school-address">3rd Floor TUCP Bldg. Elliptical Road Corner Maharlika St. Quezon City</p>
                    <p className="sdx-report-school-contact">☎ 8294‑7772 | ✉ cradle.of.learners@gmail.com</p>
                  </div>
                </div>

                <div className="sdx-modal-body">
                  {/* Report Title */}
                  <div className="sdx-report-title-section">
                    <h2 className="sdx-report-main-title">PROGRESS REPORT</h2>
                    <p className="sdx-report-school-year">S.Y. {progressReport.schoolYear}</p>
                  </div>

                  {/* Student Information */}
                  <div className="sdx-report-student-info">
                    <div className="sdx-report-info-row">
                      <div className="sdx-report-info-item">
                        <strong>Name:</strong> {student.name}
                      </div>
                      <div className="sdx-report-info-item">
                        <strong>Age:</strong> {student.age}
                      </div>
                    </div>
                    <div className="sdx-report-info-row">
                      <div className="sdx-report-info-item">
                        <strong>Grade:</strong> {student.gradeLevel || 'Grade 1'}
                      </div>
                      <div className="sdx-report-info-item">
                        <strong>Gender:</strong> {student.gender || 'Not specified'}
                      </div>
                    </div>
                    <div className="sdx-report-info-row">
                      <div className="sdx-report-info-item">
                        <strong>Parent:</strong> {getParentName()}
                      </div>
                      <div className="sdx-report-info-item">
                        <strong>Date:</strong> {progressReport.reportDate}
                      </div>
                    </div>
                    <div className="sdx-report-info-row">
                      <div className="sdx-report-info-item">
                        <strong>Reading Level:</strong> {student.readingLevel || 'Not Assessed'}
                      </div>
                      <div className="sdx-report-info-item">
                        <strong>Last Assessment:</strong> {student.lastAssessment || student.lastAssessmentDate ? new Date(student.lastAssessment || student.lastAssessmentDate).toLocaleDateString() : 'Not available'}
                      </div>
                    </div>
                  </div>

                  {/* Progress Table */}
                  <div className="sdx-report-progress-table">
                    <table className="sdx-report-table">
                      <thead>
                        <tr>
                          <th className="sdx-report-th sdx-report-th-aralin">Lesson</th>
                          <th className="sdx-report-th sdx-report-th-nakumpleto">Completed</th>
                          <th className="sdx-report-th sdx-report-th-antas" colSpan="3">Progress Level</th>
                          <th className="sdx-report-th sdx-report-th-puna">Remarks</th>
                        </tr>
                        <tr>
                          <th className="sdx-report-th-empty"></th>
                          <th className="sdx-report-th-empty"></th>
                          <th className="sdx-report-th-level">Minimal support</th>
                          <th className="sdx-report-th-level">Moderate support</th>
                          <th className="sdx-report-th-level">Extensive support</th>
                          <th className="sdx-report-th-empty"></th>
                        </tr>
                      </thead>
                      <tbody>
                        {activities && activities.length > 0 ? (
                          activities.map((activity, index) => (
                            <tr key={index} className="sdx-report-tr">
                              <td className="sdx-report-td sdx-report-td-aralin">{activity.name}</td>
                              <td className="sdx-report-td sdx-report-td-nakumpleto">
                                {activity.completed ? "✓" : ""}
                              </td>
                              <td className="sdx-report-td sdx-report-td-support">
                                {renderCheckbox(activity.minimalSupport)}
                              </td>
                              <td className="sdx-report-td sdx-report-td-support">
                                {renderCheckbox(activity.moderateSupport)}
                              </td>
                              <td className="sdx-report-td sdx-report-td-support">
                                {renderCheckbox(activity.extensiveSupport)}
                              </td>
                              <td className="sdx-report-td sdx-report-td-puna">{activity.remarks}</td>
                            </tr>
                          ))
                        ) : (
                          <tr className="sdx-report-tr">
                            <td colSpan="6" className="sdx-report-td-empty">
                              No learning activities recorded yet.
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>

                  {/* Reading Assessment Summary */}
                  {(assessment || readingLevelProgress) && (
                    <div className="sdx-report-assessment-summary">
                      <h3 className="sdx-report-section-title">Reading Level Progress</h3>
                      
                      {/* Category Summary Cards */}
                      <div className="sdx-report-category-cards">
                        {formatAssessmentItems().map((skill, index) => (
                          <div key={index} className="sdx-report-category-card">
                            <div className="sdx-report-category-header">
                              <span className="sdx-report-category-name">{skill.name}</span>
                              <span className={`sdx-report-category-score ${skill.score >= 80 ? 'score-excellent' :
                                skill.score >= 60 ? 'score-good' :
                                  skill.score >= 40 ? 'score-average' :
                                    'score-needs-improvement'
                                }`}>{skill.score}%</span>
                            </div>
                            
                            <div className="sdx-report-category-progress">
                              <div 
                                className={`sdx-report-category-progress-bar ${skill.score >= 80 ? 'score-excellent' :
                                  skill.score >= 60 ? 'score-good' :
                                    skill.score >= 40 ? 'score-average' :
                                      'score-needs-improvement'
                                  }`}
                                style={{ width: `${skill.score}%` }}
                              ></div>
                            </div>
                            
                            <div className="sdx-report-category-details">
                              <div className="sdx-report-category-answer-counts">
                                <span className="sdx-report-category-correct">
                                  ✓ {skill.correctAnswers} correct
                                </span>
                                <span className="sdx-report-category-incorrect">
                                  ✗ {skill.incorrectAnswers} incorrect
                                </span>
                              </div>
                              <span className={`sdx-report-category-passed ${skill.isPassed ? 'passed' : 'failed'}`}>
                                {skill.isPassed ? 'Passed' : 'Not Passed'}
                              </span>
                            </div>
                            
                            {/* Show questions from the assessmentQuestions state instead of skill.questions */}
                            {assessmentQuestions[skill.name] && assessmentQuestions[skill.name].length > 0 && (
                              <div className="sdx-report-category-questions">
                                <div className="sdx-report-questions-title">Assessment Questions:</div>
                                {assessmentQuestions[skill.name].map((question, qIndex) => (
                                  <div key={qIndex} className="sdx-report-question-item">
                                    <div className="sdx-report-question-text">
                                      {question.questionText}
                                      {question.questionValue && (
                                        <span className="sdx-report-question-value"> ({question.questionValue})</span>
                                      )}
                                    </div>
                                    
                                    {question.choiceOptions && question.choiceOptions.length > 0 && (
                                      <div className="sdx-report-question-options">
                                        {question.choiceOptions.map((option, optIndex) => (
                                          <div 
                                            key={optIndex} 
                                            className={`sdx-report-option-item ${option.isCorrect ? 'correct' : ''}`}
                                          >
                                            <span className="sdx-report-option-marker">
                                              {option.isCorrect ? '✓' : '○'}
                                            </span>
                                            <span className="sdx-report-option-text">{option.optionText}</span>
                                          </div>
                                        ))}
                                      </div>
                                    )}
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                      
                      <div className="sdx-report-overall-summary">
                        <p className="sdx-report-overall-description">
                          {student.name} is currently at the <strong>{student.readingLevel || 'Not Assessed'}</strong> reading level. 
                          {student.readingLevel && student.readingLevel !== 'Not Assessed' ? 
                            ` This means ${getReadingLevelDescription(student.readingLevel).toLowerCase()}.` : 
                            ' An assessment is needed to determine the appropriate reading level.'}
                        </p>
                      </div>
                    </div>
                  )}

                  {/* Recommendations */}
                  <div className="sdx-report-recommendations">
                    <h3 className="sdx-report-section-title">Prescriptive Recommendations</h3>
                    <ul className="sdx-report-rec-list">
                      {progressReport.recommendations.map((rec, index) => (
                        <li key={index} className="sdx-report-rec-item">{rec}</li>
                      ))}
                    </ul>
                  </div>

                  {/* Signatures */}
                  <div className="sdx-report-signatures">
                    <div className="sdx-report-signature">
                      <div className="sdx-report-sign-line"></div>
                      <p className="sdx-report-sign-name">Teacher's Signature</p>
                    </div>
                    <div className="sdx-report-signature">
                      <div className="sdx-report-sign-line"></div>
                      <p className="sdx-report-sign-name">Principal's Signature</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Success Dialog */}
      {showSuccessDialog && (
        <div className="sdx-dialog-overlay">
          <div className="sdx-dialog">
            <div className="sdx-dialog-header">
              <h3 className="sdx-dialog-title">
                <FaCheckCircle className="sdx-dialog-icon" /> Success
              </h3>
            </div>
            <div className="sdx-dialog-content">
              <div className="sdx-dialog-message">
                <p>Progress report has been successfully sent to {getParentName()}!</p>
                <p>A copy has been saved to the student's records.</p>
              </div>
              <div className="sdx-dialog-actions">
                <button
                  className="sdx-dialog-btn sdx-dialog-btn-primary"
                  onClick={closeSuccessDialog}
                >
                  OK
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default StudentDetails;