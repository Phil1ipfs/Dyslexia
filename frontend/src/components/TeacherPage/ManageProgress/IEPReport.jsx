import React, { useState, useEffect, useRef } from 'react';
import {
  FaCheckCircle,
  FaEdit,
  FaSave,
  FaTimes,
  FaExclamationTriangle,
  FaSpinner,
  FaCheck,
  FaInfoCircle,
  FaBook,
  FaChartLine,
  FaUserGraduate,
  FaCalendarAlt,
  FaFlask,
  FaArrowUp,
  FaArrowDown,
  FaEquals,
  FaEye,
  FaClipboardList,
  FaAward,
  FaExclamationCircle,
  FaSync,
  FaRedoAlt,
  FaFilePdf,
  FaEnvelope,
  FaUser,
  FaPhone,
  FaMapMarkerAlt,
  FaBriefcase,
  FaHome,
  FaPrint,
  FaDownload,
  FaPaperPlane,
  FaAddressCard,
  FaRing,
  FaVenusMars,
  FaBuilding,
  FaCheckSquare
} from 'react-icons/fa';
import IEPService from '../../../services/Teachers/ManageProgress/IEPService';
import StudentDetailsService from '../../../services/Teachers/StudentDetailsService';
import { fetchTeacherProfile } from '../../../services/Teachers/teacherService';
import AuthService from '../../../services/authService';
import { API_BASE_URL } from '../../../services/config';
import { pdf } from '@react-pdf/renderer';
import IEPReportPDFRenderer from './IEPReportPDFRenderer';
import { toast } from '../../../utils/toastHelper';
import SuccessDialog from '../../Teachers/SuccessDialog';
import './css/IEPReport.css';
import './css/IEPReportPDF.css'; // Import dedicated PDF styles
import '../../../css/Teachers/StudentDetails.css'; // Import PDF modal styles

// Import cradle logo
const cradleLogo = new URL('../../../assets/images/Teachers/cradleLogo.jpg', import.meta.url).href;

const IEPReport = ({ 
  student,
  onDataUpdate // Callback to notify parent of data changes
}) => {
  // State management
  const [iepData, setIepData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [dataLoaded, setDataLoaded] = useState(false);
  const [saving, setSaving] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [forceUpdate, setForceUpdate] = useState(0); // Force update counter
  const [interventionModal, setInterventionModal] = useState({ isOpen: false, objective: null });
  const [attemptModal, setAttemptModal] = useState({ isOpen: false, objective: null, attempt: null, attemptIndex: null });
  const [assessmentModal, setAssessmentModal] = useState({ isOpen: false, objective: null });
  const [expandedInterventions, setExpandedInterventions] = useState({});
  const [expandedRemarks, setExpandedRemarks] = useState({});
  const [error, setError] = useState(null);
  const [editingRemarks, setEditingRemarks] = useState({}); // Track which remarks are being edited
  const [tempRemarks, setTempRemarks] = useState({}); // Store temporary remarks during editing
  const [editingMainRemarks, setEditingMainRemarks] = useState({}); // Track which main assessment remarks are being edited
  const [tempMainRemarks, setTempMainRemarks] = useState({}); // Store temporary main assessment remarks during editing
  const [successMessage, setSuccessMessage] = useState('');

  // Parent information and PDF/Email functionality state
  const [parentInfo, setParentInfo] = useState(null);
  const [parentProfile, setParentProfile] = useState(null);
  const [loadingParent, setLoadingParent] = useState(false);
  const [sendingEmail, setSendingEmail] = useState(false);
  const [generatingPdf, setGeneratingPdf] = useState(false);
  const [showParentSection, setShowParentSection] = useState(true);
  const [emailModal, setEmailModal] = useState({ isOpen: false, emailData: null });
  const [showProgressReport, setShowProgressReport] = useState(false);
  const [showSuccessDialog, setShowSuccessDialog] = useState(false);
  const [successDialogData, setSuccessDialogData] = useState({ message: '', submessage: '' });
  const [feedbackMessage, setFeedbackMessage] = useState({ subject: '', content: '' });
  const [isEditingFeedback, setIsEditingFeedback] = useState(false);
  const [includeProgressReport, setIncludeProgressReport] = useState(true);
  const [parentImageLoaded, setParentImageLoaded] = useState(false);
  const [parentImageError, setParentImageError] = useState(false);
  const [retryCount, setRetryCount] = useState(0);
  const MAX_RETRIES = 2;
  
  // Reading level progression confirmation dialog state
  const [showProgressionDialog, setShowProgressionDialog] = useState(false);

  // Teacher profile state
  const [teacherProfile, setTeacherProfile] = useState(null);

  // ✅ NEW: General Recommendation state
  const [generalRecommendation, setGeneralRecommendation] = useState('');
  const [isEditingRecommendation, setIsEditingRecommendation] = useState(false);
  const [savingRecommendation, setSavingRecommendation] = useState(false);

  // Get data from either local state or global state
  const currentIepData = iepData || window.iepReportGlobalState?.iepData;

  // Get student name
  const getStudentName = () => {
    // Debug logging to see what data we have
    console.log('getStudentName debug:', {
      currentIepData_studentId: currentIepData?.studentId,
      student: student,
      student_firstName: student?.firstName,
      student_lastName: student?.lastName,
      student_name: student?.name
    });

    if (currentIepData?.studentId?.firstName && currentIepData?.studentId?.lastName) {
      return `${currentIepData.studentId.firstName} ${currentIepData.studentId.lastName}`;
    } else if (student?.firstName && student?.lastName) {
      return `${student.firstName} ${student.lastName}`;
    } else if (student?.name) {
      return student.name;
    } else if (student?.idNumber && window.studentsGlobalCache) {
      // Try to find student in global cache by ID number
      const cachedStudent = window.studentsGlobalCache.find(s => s.idNumber === student.idNumber);
      if (cachedStudent?.firstName && cachedStudent?.lastName) {
        return `${cachedStudent.firstName} ${cachedStudent.lastName}`;
      }
    }

    console.warn('No student name found, using fallback');
    return 'Student';
  };

  // Get parent name for display
  const getParentName = () => {
    // Check if parentInfo exists and has name properties
    if (parentInfo) {
      // First check for a complete name property
      if (parentInfo.name) {
        return parentInfo.name;
      }

      // Next check for firstName/lastName/middleName
      if (parentInfo.firstName || parentInfo.lastName) {
        return `${parentInfo.firstName || ''} ${parentInfo.middleName ? parentInfo.middleName + ' ' : ''}${parentInfo.lastName || ''}`.trim();
      }
    }

    // Check student.parent object
    if (typeof student?.parent === 'string' && student.parent) {
      return student.parent;
    }

    if (student?.parent && typeof student.parent === 'object') {
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
    if (student?.parentName) {
      return student.parentName;
    }

    // If parentId exists but we don't have the name, return generic
    if (student?.parentId) {
      return `Registered Parent (ID: ${student.parentId.substring(0, 6)}...)`;
    }

    return 'Parent';
  };

  // Get teacher name
  const getTeacherName = () => {
    try {
      if (teacherProfile?.firstName && teacherProfile?.lastName) {
        return `${teacherProfile.firstName} ${teacherProfile.lastName}`;
      } else if (teacherProfile?.name) {
        return teacherProfile.name;
      } else {
        return 'Teacher';
      }
    } catch (error) {
      console.error('Error getting teacher name:', error);
      return 'Teacher';
    }
  };

  // Refs for PDF generation
  const reportRef = useRef();

  // Utility function to clean teacher remarks and filter out file paths
  const cleanTeacherRemarks = (remark) => {
    if (!remark || typeof remark !== 'string') {
      return null;
    }

    const cleanedRemark = remark.trim();

    // Check if the remark contains file paths (common patterns)
    const filePathPatterns = [
      '/Users/',
      '/Documents/',
      '/backend/',
      '/frontend/',
      'goodboykit/Documents',
      '/Dyslexia/',
      'xshcdfhckbskcsdsds',
      'C:\\',
      'D:\\',
      '.pdf',
      '.doc',
      '.txt'
    ];

    // If the remark contains any file path patterns, consider it invalid
    const containsFilePath = filePathPatterns.some(pattern =>
      cleanedRemark.includes(pattern)
    );

    if (containsFilePath) {
      console.warn('File path detected in teacher remarks, filtering out:', cleanedRemark);
      return null;
    }

    // If the remark is too long (likely a corrupted path), consider it invalid
    if (cleanedRemark.length > 500) {
      console.warn('Remark too long (possibly corrupted), filtering out');
      return null;
    }

    // Return cleaned remark if valid
    return cleanedRemark.length > 0 ? cleanedRemark : null;
  };

  // IMPROVED: Enhanced function to extract clean text before file path corruption
  const extractCleanRemark = (remark) => {
    if (!remark || typeof remark !== 'string') {
      return null;
    }

    let cleanedRemark = remark.trim();

    // File path patterns to identify corruption points
    const filePathPatterns = [
      '/Users/',
      '/Documents/',
      '/backend/',
      '/frontend/',
      'goodboykit/Documents',
      '/Dyslexia/'
    ];

    // If the remark contains file paths, extract only the text before the file path corruption
    for (const pattern of filePathPatterns) {
      const pathIndex = cleanedRemark.indexOf(pattern);
      if (pathIndex !== -1) {
        // Extract text before the file path corruption
        const textBeforePath = cleanedRemark.substring(0, pathIndex).trim();
        if (textBeforePath.length >= 2) {
          return textBeforePath;
        } else {
          // If no valid text before the path, return null
          return null;
        }
      }
    }

    // If no file paths found, return the cleaned remark if it has actual content
    return cleanedRemark.length >= 2 ? cleanedRemark : null;
  };

  // Generate automatic progress summary when manual remarks are empty
  const generateProgressSummary = (objective) => {
    if (!objective) return null;

    const {
      score: assessmentScore,
      latestInterventionScore,
      interventionImprovement,
      interventionAttempts,
      interventionHistory,
      passingThreshold = 75
    } = objective;

    // Assessment progress summary
    let assessmentSummary = '';
    if (assessmentScore !== undefined) {
      if (assessmentScore >= passingThreshold) {
        assessmentSummary = `Strong initial performance (${assessmentScore}%) - met mastery criteria without intervention.`;
      } else {
        const level = assessmentScore < 25 ? 'significant challenges' :
                     assessmentScore < 50 ? 'moderate challenges' :
                     'some difficulties';
        assessmentSummary = `Initial assessment showed ${level} (${assessmentScore}%).`;
      }
    }

    // Intervention progress summary
    let interventionSummary = '';
    if (interventionHistory && interventionHistory.length > 0) {
      const finalAttempt = interventionHistory[interventionHistory.length - 1];
      const firstScore = interventionHistory[0]?.score || 0;
      const finalScore = finalAttempt?.score || 0;
      const totalImprovement = finalScore - (assessmentScore || 0);

      if (finalAttempt?.isPassed) {
        if (interventionAttempts === 1) {
          interventionSummary = ` Achieved mastery (${finalScore}%) on first intervention attempt with ${totalImprovement}% improvement.`;
        } else {
          interventionSummary = ` Through ${interventionAttempts} intervention attempts, achieved mastery (${finalScore}%) with ${totalImprovement}% total improvement.`;
        }
      } else {
        interventionSummary = ` Intervention in progress (${interventionAttempts} attempts, current: ${finalScore}%).`;
      }
    }

    return assessmentSummary + interventionSummary;
  };

  // Get EXACTLY what's in the database - no fallbacks, no automatic generation
  const getDatabaseRemark = (objective) => {
    // For main assessment remarks: show remarks or mainAssessmentRemarks, cleaned up
    const mainRemark = extractCleanRemark(objective.remarks || objective.mainAssessmentRemarks);
    return mainRemark || 'No remarks added';
  };

  // Generate specific learning objectives based on category and progress
  const generateLearningObjective = (objective) => {
    if (!objective) return 'Learning objective not specified';

    const categoryName = getCategoryName(objective.lesson);
    const isCompleted = objective.latestInterventionPassed || (objective.score >= 75);

    const objectives = {
      'Alphabet Knowledge': isCompleted
        ? 'Successfully demonstrate mastery of letter recognition, including uppercase and lowercase letters, and letter-sound correspondence.'
        : 'Develop accurate letter recognition skills and strengthen letter-sound correspondence for improved reading foundation.',

      'Phonological Awareness': isCompleted
        ? 'Demonstrate mastery of sound discrimination, phonemic awareness, and ability to manipulate sounds within words.'
        : 'Strengthen phonological processing skills including sound discrimination, rhyming, and phoneme manipulation.',

      'Decoding': isCompleted
        ? 'Successfully decode unfamiliar words using phonetic strategies and structural analysis with high accuracy.'
        : 'Develop systematic decoding strategies for unknown words using phonics and structural analysis skills.',

      'Word Recognition': isCompleted
        ? 'Demonstrate automatic recognition of high-frequency words and apply context clues for word identification.'
        : 'Build sight word vocabulary and develop strategies for word recognition using context and structural clues.',

      'Reading Comprehension': isCompleted
        ? 'Demonstrate strong reading comprehension with ability to answer literal and inferential questions about text.'
        : 'Improve reading comprehension skills including literal understanding and making simple inferences from text.'
    };

    return objectives[categoryName] || `Develop proficiency in ${categoryName} skills through targeted instruction and practice.`;
  };
  const loadedStudentRef = useRef(null);
  
  // Global state management to persist across component re-mounts
  if (!window.iepReportGlobalState) {
    window.iepReportGlobalState = {
      iepData: null,
      loading: true,
      dataLoaded: false,
      error: null
    };
  }

  // Load teacher profile
  const loadTeacherProfile = async () => {
    try {
      const profile = await fetchTeacherProfile();
      setTeacherProfile(profile);
      console.log('Teacher profile loaded:', profile);
    } catch (error) {
      console.error('Error loading teacher profile:', error);
      // Don't let teacher profile loading break the component
      setTeacherProfile(null);
    }
  };

  // Load IEP data when component mounts or student changes
  useEffect(() => {
    const studentId = student?.id || student?._id;
    if (studentId) {
      console.log('useEffect triggered for student:', studentId, 'current iepData:', !!iepData);

      // Only load if we don't already have data for this student
      if (!iepData || loadedStudentRef.current !== studentId) {
        console.log('Loading data for student:', studentId);
        loadedStudentRef.current = studentId;
      loadIEPData();
      loadParentData();
        // Load teacher profile (optional - don't let it break the component)
        loadTeacherProfile().catch(err => console.warn('Teacher profile loading failed:', err));
      } else {
        console.log('useEffect skipped - data already loaded for student:', studentId);
      }

      // Initialize feedback message with pre-filled content (like StudentDetails)
      const studentName = getStudentName();
      const parentName = getParentName();

      if (parentName && parentName !== 'No parent information') {
        setFeedbackMessage({
          subject: `IEP Progress Report for ${studentName}`,
          content: `Dear ${parentName},\n\nI hope this message finds you well. I'm writing to share ${studentName}'s progress in our Individualized Education Program (IEP).\n\n${studentName} has been working diligently on their reading skills, and I wanted to update you on their recent achievements and areas where we continue to focus our efforts.\n\nPlease find the detailed IEP progress report attached, which includes specific information about ${studentName}'s performance across different reading categories, intervention progress, and support level recommendations.\n\nIf you have any questions about this report or would like to discuss ${studentName}'s progress further, please don't hesitate to reach out to me. Your partnership in ${studentName}'s educational journey is invaluable.\n\nThank you for your continued support.\n\nBest regards,\nTeacher`
        });
      } else {
        setFeedbackMessage({
          subject: `IEP Progress Report for ${studentName}`,
          content: `Dear Parent,\n\nI hope this message finds you well. I'm writing to share ${studentName}'s progress in our Individualized Education Program (IEP).\n\n${studentName} has been working diligently on their reading skills, and I wanted to update you on their recent achievements and areas where we continue to focus our efforts.\n\nPlease find the detailed IEP progress report attached, which includes specific information about ${studentName}'s performance across different reading categories, intervention progress, and support level recommendations.\n\nIf you have any questions about this report or would like to discuss ${studentName}'s progress further, please don't hesitate to reach out to me. Your partnership in ${studentName}'s educational journey is invaluable.\n\nThank you for your continued support.\n\nBest regards,\nTeacher`
        });
      }
    }
  }, [student?.id, student?._id, iepData]); // Include iepData to properly trigger when it changes

  // Debug: Monitor loading state changes
  useEffect(() => {
    console.log('Loading state changed to:', loading);
  }, [loading]);

  // Debug: Monitor dataLoaded state changes
  useEffect(() => {
    console.log('DataLoaded state changed to:', dataLoaded);
  }, [dataLoaded]);

  // Update feedback message when teacher profile loads
  useEffect(() => {
    if (teacherProfile && feedbackMessage.content) {
      const studentName = getStudentName();
      const parentName = getParentName();
      const teacherName = getTeacherName();

      // Only update if the teacher name has changed
      if (teacherName !== 'Teacher') {
        const updatedContent = feedbackMessage.content.replace(/Best regards,\nTeacher/g, `Best regards,\n${teacherName}`);
        setFeedbackMessage(prev => ({
          ...prev,
          content: updatedContent
        }));
      }
    }
  }, [teacherProfile]);

  // Force re-render when forceUpdate changes
  useEffect(() => {
    console.log('Force update triggered:', forceUpdate);
  }, [forceUpdate]);

  // Emergency fallback: If we have data but still showing loading, force render
  useEffect(() => {
    if (currentIepData && currentIepData.objectives && currentIepData.objectives.length > 0 && loading) {
      console.log('🚨 EMERGENCY: Data exists but loading is true - forcing loading to false');
      setLoading(false);
    }
  }, [iepData, loading]);

  // Force re-render when global state changes
  useEffect(() => {
    const checkGlobalState = () => {
      const globalData = window.iepReportGlobalState?.iepData;
      if (globalData && globalData.objectives && globalData.objectives.length > 0 && loading) {
        console.log('🚨 GLOBAL STATE DETECTED: Forcing component update');
        setForceUpdate(prev => prev + 1);
        setLoading(false);
      }
    };

    // Check immediately
    checkGlobalState();

    // Also check after a short delay
    const timeout = setTimeout(checkGlobalState, 100);
    
    return () => clearTimeout(timeout);
  }, [loading]);

  // Remove conflicting useEffect - loading state is managed directly in loadIEPData

  // Global state watcher: Force re-render when global state changes
  useEffect(() => {
    const checkGlobalState = () => {
      if (window.iepReportGlobalState?.iepData && !iepData) {
        console.log('🚨 GLOBAL STATE WATCHER: Found global data, forcing state sync');
        setIepData(window.iepReportGlobalState.iepData);
        setDataLoaded(true);
        setLoading(false);
        setForceUpdate(prev => prev + 1);
      }
    };
    
    // Check immediately
    checkGlobalState();
    
    // Set up interval to check for global state changes
    const interval = setInterval(checkGlobalState, 100);
    
    return () => clearInterval(interval);
  }, [iepData]);

  // Add ref for preventing duplicate calls
  const loadingRef = useRef(false);

  // Load IEP report data from backend
  const loadIEPData = async () => {
    // Prevent multiple simultaneous calls using ref, not state
    if (loadingRef.current) {
      console.log('IEP data already loading, skipping duplicate call');
      return;
    }

    try {
      loadingRef.current = true;
      setLoading(true);
      setError(null);
      
      const studentId = student?.id || student?._id;
      const currentReadingLevel = student?.readingLevel;

      console.log('Loading IEP data for student:', studentId, 'Reading Level:', currentReadingLevel);

      // ✅ CRITICAL FIX: Pass current reading level to get correct IEP
      const response = await IEPService.getIEPReport(studentId, null, currentReadingLevel);
      
      if (response.success && response.data) {
        console.log('Setting IEP data:', response.data);
        console.log('About to call setIepData...');

        // ✅ VALIDATION: Ensure IEP data matches current student reading level
        const iepReadingLevel = response.data.readingLevel;
        if (currentReadingLevel && iepReadingLevel !== currentReadingLevel) {
          console.warn(`⚠️ IEP reading level mismatch: Expected ${currentReadingLevel}, Got ${iepReadingLevel}`);
          // Still proceed but log the mismatch for debugging
        } else {
          console.log(`✅ IEP reading level validation passed: ${iepReadingLevel}`);
        }
        

          // Use direct state setters with immediate verification
          console.log('🔄 Using direct state setters...');
          
          // Update global state first
          window.iepReportGlobalState.iepData = response.data;
          window.iepReportGlobalState.dataLoaded = true;
          window.iepReportGlobalState.loading = false;
          window.iepReportGlobalState.error = null;
          
          // Set all states at once
        setIepData(response.data);
          setDataLoaded(true);
          setLoading(false);
          setForceUpdate(prev => prev + 1);

          // ✅ NEW: Initialize general recommendation
          if (response.data.generalRecommendation) {
            setGeneralRecommendation(response.data.generalRecommendation);
          }
          
          console.log('✅ All state setters called - Global state updated:', window.iepReportGlobalState);
          
          // Immediate verification - check if state actually changed
          setTimeout(() => {
            console.log('🔍 Immediate verification - checking if state updated...');
            // This will trigger a re-render and show the current state
          }, 10);
          
          // Force React to process state changes immediately
          import('react-dom').then(({ flushSync }) => {
            flushSync(() => {
              console.log('🔄 FlushSync: Forcing immediate React update');
            });
          });
        
        // Notify parent component of successful load
        if (onDataUpdate) {
          onDataUpdate(response.data);
        }
      } else {
        throw new Error('No IEP data available');
      }
      
    } catch (err) {
      console.error('Error loading IEP data:', err);
      setError(err.message || 'Failed to load IEP report');
      console.log('Setting loading to false in error case');
      setLoading(false);
    } finally {
      // Reset the loading ref
      loadingRef.current = false;
      console.log('In finally block - loading ref reset to false');
    }
  };

  // Refresh intervention data
  const refreshInterventionData = async () => {
    try {
      setRefreshing(true);
      setError(null);
      
      const studentId = student?.id || student?._id;
      console.log('Refreshing intervention data for student:', studentId);
      
      const response = await IEPService.refreshInterventionData(studentId);
      
      if (response.success && response.data) {
        setIepData(response.data);
        console.log('Intervention data refreshed:', response.data);
        
        // Notify parent component of successful refresh
        if (onDataUpdate) {
          onDataUpdate(response.data);
        }
        
        showSuccessMessage('Intervention data updated successfully');
      } else {
        throw new Error('Failed to refresh intervention data');
      }
      
    } catch (err) {
      console.error('Error refreshing intervention data:', err);
      setError(err.message || 'Failed to refresh intervention data');
    } finally {
      setRefreshing(false);
    }
  };

  // Toggle intervention details visibility
  const toggleInterventionDetails = (objectiveId) => {
    setExpandedInterventions(prev => ({
      ...prev,
      [objectiveId]: !prev[objectiveId]
    }));
  };

  // Open intervention modal
  const openInterventionModal = (objective) => {
    setInterventionModal({ isOpen: true, objective });
  };

  // Close intervention modal
  const closeInterventionModal = () => {
    setInterventionModal({ isOpen: false, objective: null });
  };

  // Open individual attempt modal
  const openAttemptModal = (objective, attempt, attemptIndex) => {
    setAttemptModal({ isOpen: true, objective, attempt, attemptIndex });
  };

  // Close attempt modal
  const closeAttemptModal = () => {
    setAttemptModal({ isOpen: false, objective: null, attempt: null, attemptIndex: null });
  };

  // Open assessment modal
  const openAssessmentModal = (objective) => {
    setAssessmentModal({ isOpen: true, objective });
  };

  // Close assessment modal
  const closeAssessmentModal = () => {
    setAssessmentModal({ isOpen: false, objective: null });
  };

  // Toggle remarks expansion
  const toggleRemarksExpansion = (objectiveId) => {
    setExpandedRemarks(prev => ({
      ...prev,
      [objectiveId]: !prev[objectiveId]
    }));
  };

  // Handle support level change (checkbox clicks)
  const handleSupportLevelChange = async (objectiveId, newSupportLevel) => {
    try {
      setSaving(true);
      
      const studentId = student?.id || student?._id;
      console.log('Updating support level:', { objectiveId, newSupportLevel });
      
      // If clicking the currently selected level, deselect it (make it optional)
      const currentLevel = currentIepData.objectives.find(obj => obj._id === objectiveId)?.supportLevel;
      const updatedLevel = currentLevel === newSupportLevel ? null : newSupportLevel;
      
      await IEPService.updateSupportLevel(studentId, objectiveId, updatedLevel);
      
      // Update local state
      setIepData(prevData => ({
        ...prevData,
        objectives: prevData.objectives.map(obj => 
          obj._id === objectiveId 
            ? { ...obj, supportLevel: updatedLevel, lastUpdated: new Date() }
            : obj
        )
      }));
      
      showSuccessMessage('Support level updated successfully');
      
    } catch (err) {
      console.error('Error updating support level:', err);
      setError(err.message || 'Failed to update support level');
    } finally {
      setSaving(false);
    }
  };

  // Start editing remarks for an objective
  const startEditingRemarks = (objectiveId, currentRemarks) => {
    setEditingRemarks(prev => ({ ...prev, [objectiveId]: true }));
    setTempRemarks(prev => ({ ...prev, [objectiveId]: currentRemarks || '' }));
  };

  // Cancel editing remarks
  const cancelEditingRemarks = (objectiveId) => {
    setEditingRemarks(prev => ({ ...prev, [objectiveId]: false }));
    setTempRemarks(prev => {
      const newTemp = { ...prev };
      delete newTemp[objectiveId];
      return newTemp;
    });
  };

  // Save remarks for an objective
  const saveRemarks = async (objectiveId) => {
    try {
      setSaving(true);
      
      const studentId = student?.id || student?._id;
      const newRemarks = tempRemarks[objectiveId] || '';
      
      console.log('Saving remarks:', { objectiveId, newRemarks });
      
      await IEPService.updateRemarks(studentId, objectiveId, newRemarks);
      
      // Update local state
      setIepData(prevData => ({
        ...prevData,
        objectives: prevData.objectives.map(obj => 
          obj._id === objectiveId 
            ? { ...obj, remarks: newRemarks, lastUpdated: new Date() }
            : obj
        )
      }));
      
      // Clear editing state
      setEditingRemarks(prev => ({ ...prev, [objectiveId]: false }));
      setTempRemarks(prev => {
        const newTemp = { ...prev };
        delete newTemp[objectiveId];
        return newTemp;
      });
      
      showSuccessMessage('Remarks updated successfully');
      
    } catch (err) {
      console.error('Error saving remarks:', err);
      setError(err.message || 'Failed to save remarks');
    } finally {
      setSaving(false);
    }
  };

  // Handle remarks text change
  const handleRemarksChange = (objectiveId, newRemarks) => {
    setTempRemarks(prev => ({ ...prev, [objectiveId]: newRemarks }));
  };

  // Start editing main assessment remarks for an objective
  const startEditingMainRemarks = (objectiveId, currentMainRemarks) => {
    setEditingMainRemarks(prev => ({ ...prev, [objectiveId]: true }));
    setTempMainRemarks(prev => ({ ...prev, [objectiveId]: currentMainRemarks || '' }));
  };

  // Cancel editing main assessment remarks
  const cancelEditingMainRemarks = (objectiveId) => {
    setEditingMainRemarks(prev => ({ ...prev, [objectiveId]: false }));
    setTempMainRemarks(prev => {
      const newTemp = { ...prev };
      delete newTemp[objectiveId];
      return newTemp;
    });
  };

  // Save main assessment remarks for an objective
  const saveMainRemarks = async (objectiveId) => {
    try {
      setSaving(true);

      const studentId = student?.id || student?._id;
      const newMainRemarks = assessmentModal.objective?.mainAssessmentRemarks || '';

      console.log('Saving main assessment remarks:', { objectiveId, newMainRemarks });

      await IEPService.updateMainAssessmentRemark(studentId, objectiveId, newMainRemarks);

      // Update local state
      setIepData(prevData => ({
        ...prevData,
        objectives: prevData.objectives.map(obj =>
          obj._id === objectiveId
            ? { ...obj, mainAssessmentRemarks: newMainRemarks, lastUpdated: new Date() }
            : obj
        )
      }));

      // Close modal
      closeAssessmentModal();

      showSuccessMessage('Main assessment remarks updated successfully');

    } catch (err) {
      console.error('Error saving main assessment remarks:', err);
      setError(err.message || 'Failed to save main assessment remarks');
    } finally {
      setSaving(false);
    }
  };

  // Handle main assessment remarks text change
  const handleMainRemarksChange = (objectiveId, newMainRemarks) => {
    setTempMainRemarks(prev => ({ ...prev, [objectiveId]: newMainRemarks }));
  };

  // Save individual attempt remark
  const saveAttemptRemark = async (objectiveId, attemptIndex, remark) => {
    try {
      setSaving(true);
      
      const studentId = student?.id || student?._id;
      
      console.log('Saving attempt remark:', { objectiveId, attemptIndex, remark });
      
      // Save to backend first
      await IEPService.updateAttemptRemark(studentId, objectiveId, attemptIndex, remark);

      // Update local state after successful backend save
      setIepData(prevData => ({
        ...prevData,
        objectives: prevData.objectives.map(obj => {
          if (obj._id === objectiveId) {
            const updatedHistory = [...obj.interventionHistory];
            updatedHistory[attemptIndex] = { ...updatedHistory[attemptIndex], teacherRemarks: remark };
            return { ...obj, interventionHistory: updatedHistory, lastUpdated: new Date() };
          }
          return obj;
        })
      }));
      
      showSuccessMessage('Remark saved successfully!');
      closeAttemptModal();
      
    } catch (error) {
      console.error('Error saving attempt remark:', error);
      setError('Failed to save remark. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  // ✅ NEW: Save general recommendation
  const saveGeneralRecommendation = async () => {
    try {
      setSavingRecommendation(true);

      const studentId = student?.id || student?._id;

      console.log('Saving general recommendation:', generalRecommendation);

      // Call the API to update general recommendation
      const response = await fetch(`${API_BASE_URL}/iep/student/${studentId}/general-recommendation`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${AuthService.getToken()}`
        },
        body: JSON.stringify({
          recommendation: generalRecommendation
        })
      });

      const result = await response.json();

      if (result.success) {
        // Update local state with the saved recommendation
        setIepData(prevData => ({
          ...prevData,
          generalRecommendation: generalRecommendation,
          generalRecommendationUpdatedAt: new Date()
        }));

        // Update global state as well
        if (window.iepReportGlobalState?.iepData) {
          window.iepReportGlobalState.iepData.generalRecommendation = generalRecommendation;
          window.iepReportGlobalState.iepData.generalRecommendationUpdatedAt = new Date();
        }

        setIsEditingRecommendation(false);
        showSuccessMessage('General recommendation saved successfully!');
        toast.success('General recommendation saved successfully!');
      } else {
        throw new Error(result.error || 'Failed to save recommendation');
      }

    } catch (error) {
      console.error('Error saving general recommendation:', error);
      setError('Failed to save general recommendation. Please try again.');
      toast.error('Failed to save general recommendation. Please try again.');
    } finally {
      setSavingRecommendation(false);
    }
  };

  // ✅ NEW: Cancel editing general recommendation
  const cancelEditingRecommendation = () => {
    // Restore original value from iepData
    if (currentIepData?.generalRecommendation) {
      setGeneralRecommendation(currentIepData.generalRecommendation);
    } else {
      setGeneralRecommendation('');
    }
    setIsEditingRecommendation(false);
  };

  // Show success message temporarily
  const showSuccessMessage = (message) => {
    setSuccessMessage(message);
    setTimeout(() => setSuccessMessage(''), 3000);
  };

  // Handle saving feedback message (from StudentDetails.jsx)
  const handleSaveFeedback = () => setIsEditingFeedback(false);

  // Handle canceling feedback message editing
  const handleCancelFeedback = () => {
    setIsEditingFeedback(false);
    // Optionally, you could reset the feedback message to its original state here
    // if you want to discard unsaved changes
  };

  // Load parent data using StudentDetailsService (matching StudentDetails.jsx implementation)
  const loadParentData = async () => {
    try {
      setLoadingParent(true);
      const studentId = student?.id || student?._id;

      if (!studentId) return;

      console.log('Loading parent data for student:', studentId);

      // First get student details to get parentId
      const studentData = await StudentDetailsService.getStudentDetails(studentId);

      if (studentData && studentData.parentId) {
        try {
          console.log('Fetching parent profile for ID:', studentData.parentId);
          // Use the same method as StudentDetails.jsx - pass student data as fallback
          const parentData = await StudentDetailsService.getParentProfileWithFallback(
            studentData.parentId,
            studentData
          );
          setParentInfo(parentData);
          setParentProfile(parentData);
          console.log('Parent profile loaded:', parentData);

          // Update feedbackMessage with parent name and comprehensive content
          const studentName = getStudentName();
          const parentName = parentData?.name || getParentName();
          setFeedbackMessage({
            subject: `IEP Progress Report for ${studentName}`,
            content: `Dear ${parentName},\n\nI hope this message finds you well. I'm writing to share ${studentName}'s progress in our Individualized Education Program (IEP).\n\n${studentName} has been working diligently on their reading skills, and I wanted to update you on their recent achievements and areas where we continue to focus our efforts.\n\nPlease find the detailed IEP progress report attached, which includes specific information about ${studentName}'s performance across different reading categories, intervention progress, and support level recommendations.\n\nIf you have any questions about this report or would like to discuss ${studentName}'s progress further, please don't hesitate to reach out to me. Your partnership in ${studentName}'s educational journey is invaluable.\n\nThank you for your continued support.\n\nBest regards,\nTeacher`
          });
        } catch (e) {
          console.warn('Could not load parent profile:', e);
          // Set feedback with fallback parent name
          const studentName = getStudentName();
          setFeedbackMessage({
            subject: `IEP Progress Report for ${studentName}`,
            content: `Dear Parent,\n\nI hope this message finds you well. I'm writing to share ${studentName}'s progress in our Individualized Education Program (IEP).\n\n${studentName} has been working diligently on their reading skills, and I wanted to update you on their recent achievements and areas where we continue to focus our efforts.\n\nPlease find the detailed IEP progress report attached, which includes specific information about ${studentName}'s performance across different reading categories, intervention progress, and support level recommendations.\n\nIf you have any questions about this report or would like to discuss ${studentName}'s progress further, please don't hesitate to reach out to me. Your partnership in ${studentName}'s educational journey is invaluable.\n\nThank you for your continued support.\n\nBest regards,\nTeacher`
          });
        }
      } else {
        console.warn('No parentId found in student data');
        // Set default feedback message
        const studentName = getStudentName();
        setFeedbackMessage({
          subject: `IEP Progress Report for ${studentName}`,
          content: `Dear Parent,\n\nI hope this message finds you well. I'm writing to share ${studentName}'s progress in our Individualized Education Program (IEP).\n\n${studentName} has been working diligently on their reading skills, and I wanted to update you on their recent achievements and areas where we continue to focus our efforts.\n\nPlease find the detailed IEP progress report attached, which includes specific information about ${studentName}'s performance across different reading categories, intervention progress, and support level recommendations.\n\nIf you have any questions about this report or would like to discuss ${studentName}'s progress further, please don't hesitate to reach out to me. Your partnership in ${studentName}'s educational journey is invaluable.\n\nThank you for your continued support.\n\nBest regards,\nTeacher`
        });
      }
    } catch (err) {
      console.error('Error loading parent data:', err);
    } finally {
      setLoadingParent(false);
    }
  };

  // Show PDF preview modal (don't auto-generate PDF)
  const generatePDF = () => {
    console.log("Showing IEP PDF preview with:", {
      hasStudent: !!student,
      hasIepData: !!iepData,
      studentName: getStudentName(),
      hasParentInfo: !!parentInfo,
      objectivesCount: currentIepData?.objectives?.length || 0
    });

    // Just show the modal for preview
    setShowProgressReport(true);
  };

  // Actually export the PDF when user clicks export button
  const exportToPDF = async () => {
    try {
      setGeneratingPdf(true);

      console.log('Starting React PDF generation...');
      console.log('Current IEP Data being used:', currentIepData);
      console.log('Student data being used:', student);

      // Prepare complete data for PDF renderer including student information
      const pdfData = {
        ...currentIepData,
        student: student,                    // Include student prop
        studentName: getStudentName(),       // Include computed student name
        studentAge: student?.age,            // Include student age
        studentGrade: student?.gradeLevel,   // Include student grade
        studentGender: student?.gender,      // Include student gender
        parentName: student?.parentName || student?.parent?.name || 'N/A',
        academicYear: new Date().getFullYear(),
        teacherProfile: teacherProfile,      // Include teacher profile data
        teacherName: getTeacherName(),       // Include computed teacher name
        // Validate and clean objectives data
        objectives: (currentIepData?.objectives || []).map(obj => {
          const initialScore = Math.min(100, Math.max(0, obj.assessmentScore || obj.score || 0));
          let finalScore = initialScore;

          // Calculate realistic final score
          if (obj.latestInterventionScore && obj.latestInterventionScore > 0 && obj.latestInterventionScore <= 100) {
            finalScore = obj.latestInterventionScore;
          } else if (obj.isPassed || obj.latestInterventionPassed) {
            // If marked as passed, ensure at least 75% or current score
            finalScore = Math.max(initialScore, 75);
          }

          // Calculate realistic improvement
          const realImprovement = Math.max(0, finalScore - initialScore);

          return {
            ...obj,
            assessmentScore: initialScore,
            latestInterventionScore: finalScore !== initialScore ? finalScore : null,
            interventionImprovement: realImprovement
          };
        })
      };

      console.log('PDF Data being passed to renderer:', pdfData);
      console.log('Student data:', student);
      console.log('IEP objectives:', iepData?.objectives);

      // Generate PDF using React PDF renderer
      const blob = await pdf(<IEPReportPDFRenderer iepData={pdfData} />).toBlob();

      // Create download link
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;

        // Save the PDF with the student's name
        const studentName = getStudentName() || 'Student';
        const fileName = `IEP_Progress_Report_${studentName.replace(/[^a-z0-9]/gi, '_')}_${new Date().toISOString().split('T')[0]}.pdf`;
      link.download = fileName;

      // Trigger download
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

        console.log("IEP PDF generated successfully");
        toast.success("IEP Progress Report PDF generated successfully");
        showSuccessMessage('IEP PDF report generated successfully!');

      } catch (error) {
      console.error('Error generating PDF:', error);
      toast.error(`Failed to generate PDF: ${error.message || 'Unknown error'}`);
        setError("There was an error generating the PDF. Please try again.");
    } finally {
      setGeneratingPdf(false);
      // Keep modal open so user can continue viewing or export again
    }
  };

  // Check if parent is connected (from StudentDetails.jsx)
  const isParentConnected = () => {
    return (
      (parentInfo && (parentInfo.name || parentInfo.email)) ||
      (typeof student?.parent === 'string' && student.parent) ||
      (student?.parent && student.parent.name) ||
      (student?.parentId)
    );
  };

  // Complete handleSendReport function with PDF size optimization (from StudentDetails.jsx)
  const handleSendReport = async () => {
    try {
      // Validate parent connection
      if (!isParentConnected() || !student?.parentId) {
        alert('Cannot send report - No parent account is connected to this student.');
        return;
      }

      // Don't allow sending if editing the message
      if (isEditingFeedback) {
        alert('Please save your message before sending the report.');
        return;
      }

      // Show a loading message
      console.log('Preparing IEP report for sending...', {
        includeProgressReport,
        willGeneratePDF: includeProgressReport
      });
      
      if (includeProgressReport) {
        toast.loading('Preparing IEP report with PDF...');
      } else {
        toast.loading('Preparing IEP message...');
      }

      // If including progress report, generate the PDF
      let pdfBase64 = null;
      if (includeProgressReport) {
        try {
          // First show the progress report modal to ensure it's rendered
          setShowProgressReport(true);

          // Wait for the modal to render
          await new Promise(resolve => setTimeout(resolve, 500));

          // Check if the element is available
          const element = reportRef.current;
          if (!element) {
            throw new Error('Progress report element not found');
          }

          // Generate PDF using React PDF renderer
          console.log('Email PDF: Starting React PDF generation...');

          // Prepare complete data for PDF renderer including student information
          const pdfData = {
            ...currentIepData,
            student: student,                    // Include student prop
            studentName: getStudentName(),       // Include computed student name
            studentAge: student?.age,            // Include student age
            studentGrade: student?.gradeLevel,   // Include student grade
            studentGender: student?.gender,      // Include student gender
            parentName: student?.parentName || student?.parent?.name || 'N/A',
            academicYear: new Date().getFullYear(),
            teacherProfile: teacherProfile,      // Include teacher profile data
            teacherName: getTeacherName(),       // Include computed teacher name
            // Validate and clean objectives data
            objectives: (currentIepData?.objectives || []).map(obj => {
              const initialScore = Math.min(100, Math.max(0, obj.assessmentScore || obj.score || 0));
              let finalScore = initialScore;

              // Calculate realistic final score
              if (obj.latestInterventionScore && obj.latestInterventionScore > 0 && obj.latestInterventionScore <= 100) {
                finalScore = obj.latestInterventionScore;
              } else if (obj.isPassed || obj.latestInterventionPassed) {
                // If marked as passed, ensure at least 75% or current score
                finalScore = Math.max(initialScore, 75);
              }

              // Calculate realistic improvement
              const realImprovement = Math.max(0, finalScore - initialScore);

              return {
                ...obj,
                assessmentScore: initialScore,
                latestInterventionScore: finalScore !== initialScore ? finalScore : null,
                interventionImprovement: realImprovement
              };
            })
          };

          console.log('Email PDF Data being passed to renderer:', pdfData);

          const blob = await pdf(<IEPReportPDFRenderer iepData={pdfData} />).toBlob();

          // Convert blob to base64 for email/S3 upload
          const arrayBuffer = await blob.arrayBuffer();
          const bytes = new Uint8Array(arrayBuffer);
          let binary = '';
          for (let i = 0; i < bytes.byteLength; i++) {
            binary += String.fromCharCode(bytes[i]);
          }
          pdfBase64 = btoa(binary);

          console.log(`React PDF generated successfully, size: ${pdfBase64.length} bytes`);

          // React PDF generates smaller files, but still check if too large
          if (pdfBase64.length > 5000000) { // Check if PDF is over 5MB
            console.warn('PDF is too large for email');
              const continueWithoutPDF = window.confirm(
              'The generated PDF is too large to send via email. Would you like to send the message without the PDF attachment?'
              );

              if (continueWithoutPDF) {
                pdfBase64 = null;
                setIncludeProgressReport(false);
              } else {
                setShowProgressReport(false);
                return;
            }
          }

          // Hide the modal after generating PDF
          setShowProgressReport(false);
        } catch (pdfError) {
          console.error('Error generating PDF:', pdfError);
          setShowProgressReport(false);
          toast.error('Failed to generate PDF');

          // Ask user if they want to continue without PDF
          const continueWithoutPDF = window.confirm(
            'Failed to generate PDF report. Would you like to send the message without the PDF attachment?'
          );

          if (continueWithoutPDF) {
            setIncludeProgressReport(false);
          } else {
            return;
          }
        }
      }

      // Prepare report data
      const reportData = {
        subject: feedbackMessage.subject,
        content: feedbackMessage.content,
        includeProgressReport: includeProgressReport && !!pdfBase64, // Only include if checkbox is checked AND we have PDF data
        pdfData: includeProgressReport ? pdfBase64 : null, // Explicitly set to null if not including report
        reportDate: new Date().toISOString().split('T')[0]
      };

      console.log('Report data prepared:', {
        includeProgressReport: reportData.includeProgressReport,
        hasPdfData: !!reportData.pdfData,
        checkboxChecked: includeProgressReport
      });

      toast.loading('Sending IEP report to parent...');
      console.log('Sending IEP report to parent...');

      try {
        // Send report through service
        const result = await IEPService.sendReportToParent(
          student?.id || student?._id,
          student.parentId,
          reportData
        );

        if (result && result.success) {
          console.log('IEP report sent successfully:', result);
          const studentName = getStudentName();
          const parentName = getParentName();
          const subject = feedbackMessage.subject;
          
          const successMessage = includeProgressReport && pdfBase64 
            ? `📧 IEP Progress Report sent to ${parentName} - Subject: "${subject}"`
            : `📧 Message sent to ${parentName} - Subject: "${subject}"`;
          toast.success(successMessage);
          setSuccessDialogData({
            message: includeProgressReport && pdfBase64
              ? `IEP Progress Report has been successfully sent to ${parentName}!`
              : `Message has been successfully sent to ${parentName}!`,
            submessage: `Subject: "${subject}" - A copy has been saved to ${studentName}'s records.`
          });
          setShowSuccessDialog(true);
        } else {
          throw new Error(result?.message || 'Failed to send report');
        }
      } catch (sendError) {
        console.error('Error sending report:', sendError);
        toast.error('Error sending report');

        // If error is likely related to PDF size, offer to send without PDF
        if (sendError.message.includes('too large') ||
            sendError.message.includes('413') ||
            sendError.message.includes('Server error') ||
            sendError.message.includes('offset') ||
            sendError.message.includes('size')) {

          const continueWithoutPDF = window.confirm(
            `${sendError.message}\n\nWould you like to try sending just the message without the PDF attachment?`
          );

          if (continueWithoutPDF) {
            // Try again without PDF
            try {
              toast.loading('Trying to send without PDF attachment...');
              const simpleResult = await IEPService.sendReportToParent(
                student?.id || student?._id,
                student.parentId,
                {
                  ...reportData,
                  includeProgressReport: false,
                  pdfData: null
                }
              );

              if (simpleResult && simpleResult.success) {
                console.log('Simple IEP report sent successfully:', simpleResult);
                const studentName = getStudentName();
                const parentName = getParentName();
                const subject = feedbackMessage.subject;
                
                toast.success(`📧 Message sent to ${parentName} (without PDF) - Subject: "${subject}"`);
                setSuccessDialogData({
                  message: `Message has been successfully sent to ${parentName}!`,
                  submessage: `Subject: "${subject}" - A copy has been saved to ${studentName}'s records.`
                });
                setShowSuccessDialog(true);
              } else {
                throw new Error(simpleResult?.message || 'Failed to send simple report');
              }
            } catch (finalError) {
              console.error('Error sending simple report:', finalError);
              toast.error('Failed to send report');
              alert(`Error sending report: ${finalError.message || 'Unknown error'}`);
            }
          } else {
            alert(`Error sending report: ${sendError.message}`);
          }
        } else {
          alert(`Error sending report: ${sendError.message}`);
        }
      }
    } catch (error) {
      console.error('Error sending report:', error);
      toast.error('Error preparing report');
      alert(`Error preparing report: ${error.message || 'Unknown error'}`);
    }
  };

  // Simple wrapper that calls the advanced email function
  const sendReportToParent = async () => {
    await handleSendReport();
  };


  // Parent image handling functions (from StudentDetails.jsx)
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
  };

  const retryLoadImage = () => {
    if (retryCount < MAX_RETRIES) {
      console.log(`Retrying image load (${retryCount + 1}/${MAX_RETRIES})`);
      console.log("Original URL:", parentProfile?.profileImageUrl);

      setParentImageError(false);
      setRetryCount(prev => prev + 1);

      // Force image reload by updating timestamp
      const img = new Image();
      img.onload = handleParentImageLoad;
      img.onerror = handleParentImageError;
      img.src = parentProfile?.profileImageUrl + '?retry=' + Date.now();
    }
  };

  // Handler for reading level progression
  const handleReadingLevelProgression = async () => {
    if (!canProgressToNextLevel()) {
      toast.error('Student must complete all categories before progressing to the next reading level');
      return;
    }

    // Show custom confirmation dialog
    setShowProgressionDialog(true);
  };

  // Confirm reading level progression
  const confirmReadingLevelProgression = async () => {
    try {
      setSaving(true);
      setShowProgressionDialog(false);
      toast.loading('Progressing student to next reading level...');

      const token = AuthService.getToken();
      const response = await fetch(`${API_BASE_URL}/iep/student/${student.idNumber}/reading-level-progression`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        }
      });

      const result = await response.json();

      if (result.success) {
        toast.success(`Student successfully progressed to ${result.data?.newReadingLevel || 'next level'}!`);

        // ✅ COMPREHENSIVE STATE REFRESH after reading level progression
        console.log('🔄 Starting comprehensive state refresh after progression...');

        // 1. Clear all cached IEP data
        setIepData(null);
        setDataLoaded(false);

        // 2. Clear global state to prevent stale data
        if (window.iepReportGlobalState) {
          window.iepReportGlobalState.iepData = null;
          window.iepReportGlobalState.dataLoaded = false;
        }

        // 3. Reset loaded student reference to force fresh load
        if (loadedStudentRef?.current) {
          loadedStudentRef.current = null;
        }

        // 4. Notify parent component about progression (refresh student data)
        if (onDataUpdate && result.data) {
          console.log('🔄 Notifying parent component of progression...');
          onDataUpdate(result.data);
        }

        // 5. Force component re-render with fresh data after slight delay
        setTimeout(() => {
          console.log('🔄 Forcing fresh IEP data load with new reading level...');
          setForceUpdate(prev => prev + 1); // Trigger force update
          loadIEPData(); // Load data with refreshed student info
        }, 1500); // Increased delay to ensure backend has processed

        // 6. ✅ ENHANCED: Force complete page refresh to ensure UI updates properly
        setTimeout(() => {
          console.log('🔄 Forcing complete page refresh to ensure UI reflects new reading level...');
          // Option 1: Force window reload to ensure complete UI refresh
          window.location.reload();

          // Option 2: Alternative - force navigation refresh (if using React Router)
          // window.location.href = window.location.href;
        }, 2500); // Additional delay to allow component state updates first
      } else {
        throw new Error(result.error || 'Failed to progress reading level');
      }
    } catch (error) {
      console.error('Error progressing reading level:', error);
      toast.error(`Failed to progress reading level: ${error.message}`);
    } finally {
      setSaving(false);
    }
  };

  // Cancel reading level progression
  const cancelReadingLevelProgression = () => {
    setShowProgressionDialog(false);
  };


  // Get the next reading level
  const getNextReadingLevel = () => {
    if (!currentIepData?.readingLevel) {
      console.warn('getNextReadingLevel: No current reading level found');
      return null;
    }

    const levels = ['Low Emerging', 'High Emerging', 'Developing', 'Transitioning', 'At Grade Level'];
    const currentIndex = levels.indexOf(currentIepData.readingLevel);

    console.log('getNextReadingLevel debug:', {
      currentReadingLevel: currentIepData.readingLevel,
      currentIndex: currentIndex,
      levels: levels,
      nextLevel: currentIndex >= 0 && currentIndex < levels.length - 1 ? levels[currentIndex + 1] : null
    });

    if (currentIndex >= 0 && currentIndex < levels.length - 1) {
      return levels[currentIndex + 1];
    }

    return null;
  };

  // Check if student can progress to next reading level
  const canProgressToNextLevel = () => {
    if (!currentIepData?.objectives) return false;

    // Check if all categories are completed and passed
    const allObjectives = currentIepData.objectives;
    const completedAndPassed = allObjectives.every(obj =>
      obj.isCompleted && (obj.isPassed || obj.latestInterventionPassed)
    );

    // Check if there's a next level available
    const hasNextLevel = getNextReadingLevel() !== null;

    return completedAndPassed && hasNextLevel;
  };

  // Render parent image with proper fallback (from StudentDetails.jsx)
  const renderParentImage = () => {
    if (parentProfile && parentProfile.profileImageUrl) {
      return (
        <img
          src={parentProfile.profileImageUrl}
          alt={getParentName()}
          className="sdx-parent-avatar-img"
          onLoad={handleParentImageLoad}
          onError={handleParentImageError}
        />
      );
    }

    const initial = parentProfile && parentProfile.name ?
      parentProfile.name.charAt(0).toUpperCase() :
      typeof student?.parent === 'string' ?
        student.parent.charAt(0).toUpperCase() :
        student?.parent && student.parent.name ?
          student.parent.name.charAt(0).toUpperCase() : 'P';

    return (
      <div className="sdx-parent-avatar-placeholder">
        {initial}
      </div>
    );
  };

  // Toggle parent section visibility
  const toggleParentSection = () => {
    setShowParentSection(!showParentSection);
  };

  // Render support level checkbox
  const renderSupportCheckbox = (objective, level) => {
    const isSelected = objective.supportLevel === level;
    const isDisabled = saving;
    
    return (
      <div
        className={`literexia-support-checkbox ${isSelected ? 'selected' : ''} ${isDisabled ? 'disabled' : ''}`}
        onClick={() => !isDisabled && handleSupportLevelChange(objective._id, level)}
        title={`Set support level to ${level}`}
      >
        {isSelected && <FaCheck />}
      </div>
    );
  };

  // Render comprehensive intervention status with history
  const renderInterventionStatus = (objective) => {
    if (!objective.hasIntervention) {
      const statusClass = objective.isPassed ? 'no-intervention-passed' : 'intervention-required';
      return (
        <div className={`literexia-intervention-status ${statusClass}`}>
          <div className="literexia-no-intervention">
            {objective.isPassed ? (
              <>
                <FaAward className="literexia-success-icon" />
                <span>No intervention needed</span>
              </>
            ) : (
              <>
                <FaExclamationCircle className="literexia-warning-icon" />
                <span>Intervention required</span>
              </>
            )}
          </div>
        </div>
      );
    }

    const isExpanded = expandedInterventions[objective._id];
    const latestScore = objective.latestInterventionScore || 0;
    const improvementIcon = objective.interventionImprovement > 0 ? FaArrowUp :
                           objective.interventionImprovement < 0 ? FaArrowDown : FaEquals;
    const improvementClass = objective.interventionImprovement > 0 ? 'positive' :
                            objective.interventionImprovement < 0 ? 'negative' : 'neutral';

    return (
      <div className="literexia-intervention-status has-intervention">
        <div className="literexia-intervention-summary">
          <div className="literexia-intervention-header" onClick={() => toggleInterventionDetails(objective._id)}>
            <div className="literexia-intervention-main">
              <FaFlask className="literexia-intervention-icon" />
              <div className="literexia-intervention-basic">
                <div className="literexia-attempts-info">
                  <span className="literexia-attempts-count">
                    {objective.interventionHistory?.length || objective.interventionAttempts || 0} attempt{(objective.interventionHistory?.length || objective.interventionAttempts || 0) !== 1 ? 's' : ''}
                  </span>
                  <span className={`literexia-latest-score ${objective.latestInterventionPassed ? 'passed' : 'failed'}`}>
                    Latest: {latestScore}%
                  </span>
                </div>
                {objective.interventionImprovement !== undefined && (
                  <div className={`literexia-improvement ${improvementClass}`}>
                    {React.createElement(improvementIcon)}
                    <span>{objective.interventionImprovement > 0 ? '+' : ''}{objective.interventionImprovement}%</span>
                  </div>
                )}
              </div>
            </div>
            <FaEye className={`literexia-expand-icon ${isExpanded ? 'expanded' : ''}`} />
          </div>

          {isExpanded && objective.interventionHistory && objective.interventionHistory.length > 0 && (
            <div className="literexia-intervention-history">
              <div className="literexia-history-header">
                <FaClipboardList />
                <span>Intervention History</span>
              </div>
              <div className="literexia-history-list">
                {objective.interventionHistory.map((attempt, index) => {
                  // Calculate improvement from previous attempt
                  let improvementFromPrevious = 0;
                  if (index > 0) {
                    const previousScore = objective.interventionHistory[index - 1].score || 0;
                    improvementFromPrevious = (attempt.score || 0) - previousScore;
                  } else {
                    // First attempt - compare to assessment
                    improvementFromPrevious = (attempt.score || 0) - (objective.assessmentScore || 0);
                  }

                  return (
                  <div key={index} className={`literexia-history-item ${attempt.isPassed ? 'passed' : 'failed'}`}>
                    <div className="literexia-attempt-number">
                      #{attempt.attemptNumber || (index + 1)}
                        {attempt.revisionNumber && attempt.revisionNumber > 1 && (
                          <small className="literexia-revision-info">v{attempt.revisionNumber}</small>
                        )}
                    </div>
                    <div className="literexia-attempt-details">
                      <div className="literexia-attempt-score">
                        <strong>{attempt.score || 0}%</strong>
                        <span className={`literexia-attempt-result ${attempt.isPassed ? 'passed' : 'failed'}`}>
                          {attempt.isPassed ? 'PASSED' : 'FAILED'}
                        </span>

                          {/* Show improvement from previous */}
                          {improvementFromPrevious !== 0 && (
                            <span className={`literexia-score-change ${improvementFromPrevious > 0 ? 'positive' : 'negative'}`}>
                              ({improvementFromPrevious > 0 ? '+' : ''}{improvementFromPrevious}%)
                            </span>
                          )}
                      </div>

                        <div className="literexia-attempt-meta">
                      {attempt.attemptedAt && (
                        <div className="literexia-attempt-date">
                              <FaCalendarAlt className="literexia-date-icon" />
                          {formatDate(attempt.attemptedAt)}
                        </div>
                      )}

                      {attempt.reason && attempt.reason !== 'intervention_attempt' && (
                        <div className="literexia-attempt-reason">
                              <FaInfoCircle className="literexia-reason-icon" />
                              {attempt.reason === 'teacher_revision' ? 'After Teacher Revision' :
                               attempt.reason === 'student_retake' ? 'Student Retake' :
                               attempt.reason === 'initial_attempt' ? 'Initial Attempt' :
                               attempt.reason.replace(/_/g, ' ')}
                        </div>
                      )}
                    </div>
                  </div>

                      {/* Progress indicator for this attempt */}
                      {index === objective.interventionHistory.length - 1 && (
                        <div className="literexia-latest-indicator">
                          <FaAward className="literexia-latest-icon" />
                          <small>Latest</small>
              </div>
                      )}
                    </div>
                  );
                })}

                {/* Summary of intervention journey */}
                {objective.interventionHistory.length > 1 && (
                  <div className="literexia-intervention-summary">
                    <div className="literexia-journey-stats">
                      <div className="literexia-stat-item">
                        <FaChartLine className="literexia-stat-icon" />
                        <span>Total Attempts: {objective.interventionAttempts || objective.interventionHistory.length}</span>
                      </div>

                      {objective.interventionImprovement !== 0 && (
                        <div className="literexia-stat-item">
                          {objective.interventionImprovement > 0 ? <FaArrowUp className="literexia-stat-icon positive" /> : <FaArrowDown className="literexia-stat-icon negative" />}
                          <span>Overall Progress: {objective.interventionImprovement > 0 ? '+' : ''}{objective.interventionImprovement}%</span>
            </div>
          )}

                      <div className="literexia-stat-item">
                        {objective.latestInterventionPassed ? <FaCheck className="literexia-stat-icon passed" /> : <FaTimes className="literexia-stat-icon failed" />}
                        <span>Status: {objective.latestInterventionPassed ? 'Successfully Completed' : 'Needs Further Support'}</span>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    );
  };

  // Render main assessment remarks cell as simple clickable area
  const renderMainAssessmentRemarksCell = (objective) => {
    const currentMainRemarks = objective.mainAssessmentRemarks;
    const hasRemarks = currentMainRemarks && currentMainRemarks.trim().length > 0;

    return (
      <div
        className="teacher-remarks-assessment-button"
        onClick={() => openAssessmentModal(objective)}
        title="Click to edit post assessment remarks"
      >
        <div className="teacher-remarks-assessment-content">
          <div className="teacher-remarks-assessment-text">
            <span className="teacher-remarks-placeholder">
              {hasRemarks ? "Remarks" : "Add Remark"}
            </span>
          </div>
          <div className="teacher-remarks-assessment-indicator">
            {hasRemarks ? (
              <FaCheck className="teacher-remarks-check" />
            ) : (
              <FaEdit className="teacher-remarks-edit" />
            )}
          </div>
        </div>
      </div>
    );
  };

  // Render remarks cell with edit functionality
  const renderRemarksCell = (objective) => {
    const isEditing = editingRemarks[objective._id];
    const currentRemarks = isEditing ? tempRemarks[objective._id] : objective.remarks;
    
    if (isEditing) {
      return (
        <div className="literexia-remarks-editor">
          <textarea
            value={currentRemarks || ''}
            onChange={(e) => handleRemarksChange(objective._id, e.target.value)}
            placeholder="Add remarks here..."
            disabled={saving}
            rows={3}
          />
          <div className="literexia-remarks-actions">
            <button 
              className="literexia-save-button"
              onClick={() => saveRemarks(objective._id)}
              disabled={saving}
              title="Save remarks"
            >
              {saving ? <FaSpinner className="spinning" /> : <FaSave />}
              Save
            </button>
            <button 
              className="literexia-cancel-button"
              onClick={() => cancelEditingRemarks(objective._id)}
              disabled={saving}
              title="Cancel editing"
            >
              <FaTimes />
              Cancel
            </button>
          </div>
        </div>
      );
    }
    
    return (
      <div className="literexia-remarks-display">
        <p className="literexia-remarks-text">
          {currentRemarks || 'Click to add remarks'}
        </p>
        <button 
          className="literexia-edit-button"
          onClick={() => startEditingRemarks(objective._id, currentRemarks)}
          disabled={saving}
          title="Edit remarks"
        >
          <FaEdit />
        </button>
      </div>
    );
  };

  // SIMPLIFIED RENDER LOGIC - Use either local or global data
  const renderTime = new Date().toLocaleTimeString();
  
  const hasData = !!(currentIepData && currentIepData.objectives && currentIepData.objectives.length > 0);
  
  console.log(`[${renderTime}] IEPReport render state:`, {
    loading,
    dataLoaded,
    error,
    hasLocalData: !!iepData,
    hasGlobalData: !!window.iepReportGlobalState?.iepData,
    hasCurrentData: hasData,
    objectivesCount: currentIepData?.objectives?.length || 0,
    studentId: student?.id || student?._id,
    dataSource: iepData ? 'LOCAL' : 'GLOBAL'
  });

  // Show loading state only if we're actually loading and have no data
  if (loading && !hasData) {
    console.log('Rendering loading state');
    return (
      <div className="literexia-iep-loading">
        <FaSpinner className="spinning" />
        <p>Loading IEP report...</p>
      </div>
    );
  }

  // Show error state if there's an error and no data
  if (error && !hasData) {
    console.log('Rendering error state:', error);
    return (
      <div className="literexia-iep-error">
        <FaExclamationTriangle />
        <h3>Unable to Load IEP Report</h3>
        <p>{error}</p>
        <button className="literexia-retry-button" onClick={loadIEPData}>
          <FaSync /> Retry
        </button>
      </div>
    );
  }

  // Show empty state if no data available
  if (!hasData) {
    console.log('Rendering empty state - no IEP data available');
    return (
      <div className="literexia-empty-state">
        <FaInfoCircle />
        <h3>No IEP Report Available</h3>
        <p>There is no IEP report available for this student yet. Complete an assessment first.</p>
        <button className="literexia-retry-button" onClick={loadIEPData}>
          <FaSync /> Retry Loading
        </button>
      </div>
    );
  }

  // If we have data, render the full IEP report
  console.log('🚨 RENDERING FULL IEP REPORT: Using', iepData ? 'LOCAL' : 'GLOBAL', 'data with', currentIepData.objectives.length, 'objectives');

  // Format date for display
  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  // Convert lesson name to category name (remove "Mastering" prefix)
  const getCategoryName = (lessonName) => {
    if (!lessonName) return '';
    return lessonName.replace(/^Mastering\s+/i, '');
  };




  // Get parent email
  const getParentEmail = () => {
    // Check parentInfo first
    if (parentInfo?.email) {
      return parentInfo.email;
    }

    // Check student parent data
    if (student?.parentEmail) {
      return student.parentEmail;
    }

    if (student?.parent?.email) {
      return student.parent.email;
    }

    return null;
  };

  return (
    <div className="literexia-iep-container">
      
      {/* Success message */}
      {successMessage && (
        <div className="literexia-success-alert">
          <FaCheckCircle />
          {successMessage}
        </div>
      )}

      {/* Error message */}
      {error && (
        <div className="literexia-error-alert">
          <FaExclamationTriangle />
          {error}
          <button onClick={() => setError(null)}>×</button>
        </div>
      )}

        {/* Header section */}
        <div className="literexia-iep-header">
        <div className="literexia-header-icon">
          <FaInfoCircle />
        </div>
        <div className="literexia-head-content">
          <h3>Individualized Education Progress Report</h3>
            <p>
              This report shows {currentIepData.studentId?.firstName || 'Student'}'s current progress and support needs across key reading skill categories.
              Teachers can update support levels and add remarks to track progress over time.
            </p>
        </div>
      </div>
      
      {/* Student summary section */}
      <div className="literexia-iep-summary">
        <div className="literexia-summary-item">
          <div className="literexia-summary-icon">
            <FaUserGraduate />
          </div>
          <div className="literexia-summary-content">
            <span className="literexia-summary-label">Student</span>
            <span className="literexia-summary-value">{currentIepData.studentId?.firstName} {currentIepData.studentId?.lastName}</span>
          </div>
        </div>
        
        <div className="literexia-summary-item">
          <div className="literexia-summary-icon">
            <FaBook />
          </div>
          <div className="literexia-summary-content">
            <span className="literexia-summary-label">Current Reading Level</span>
            <span className="literexia-summary-value">
              {currentIepData.readingLevel || 'Not Assessed'}
          
            </span>
          </div>
        </div>
        
        <div className="literexia-summary-item">
          <div className="literexia-summary-icon">
            <FaChartLine />
          </div>
          <div className="literexia-summary-content">
            <span className="literexia-summary-label">Overall Score</span>
            <span className="literexia-summary-value">{currentIepData.overallScore || 0}%</span>
          </div>
        </div>
        
        <div className="literexia-summary-item">
          <div className="literexia-summary-icon">
            <FaCalendarAlt />
          </div>
          <div className="literexia-summary-content">
            <span className="literexia-summary-label">Last Updated</span>
            <span className="literexia-summary-value">{formatDate(currentIepData.updatedAt)}</span>
          </div>
        </div>
      </div>

      {/* Student Progress Actions */}
      <div className="literexia-progress-actions">
        <div className="literexia-actions-header">
          <h3>
            <FaUserGraduate />
            Student Progress Actions
          </h3>
          <p>Manage student reading level progression</p>
        </div>

        <div className="literexia-action-buttons">
          {/* Button 1: Reading Level Progression */}
          <div className="literexia-action-item">
            <div className="literexia-action-info">
              <div className="literexia-action-title">
                <FaArrowUp className="literexia-action-icon" />
                Reading Level Progression
              </div>
              <div className="literexia-action-description">
                Progress student to next reading level when all categories are completed and passed
              </div>
            </div>
            <button
              className="literexia-action-button progression"
              onClick={handleReadingLevelProgression}
              disabled={!canProgressToNextLevel() || saving}
              title={
                canProgressToNextLevel()
                  ? "Progress to next reading level"
                  : !getNextReadingLevel()
                    ? "Student is already at maximum reading level"
                    : "Student must complete all categories first"
              }
            >
              {saving ? <FaSpinner className="spinning" /> : <FaArrowUp />}
              {canProgressToNextLevel()
                ? 'Progress to Next Level'
                : !getNextReadingLevel()
                  ? 'Maximum Level Reached'
                  : 'Not Ready for Progression'
              }
            </button>
          </div>

        </div>
      </div>


      {/* Table section */}
      <div className="literexia-iep-table-container">
        <div className="literexia-iep-table-header">
          <h3>
            <span className="literexia-iep-table-icon">
              <FaBook />
            </span>
            Reading Skills Progress
          </h3>
          
          <button 
            className="literexia-refresh-button"
            onClick={refreshInterventionData}
            disabled={refreshing}
          >
            {refreshing ? <FaSpinner className="spinning" /> : <FaRedoAlt />}
            Refresh Data Results
          </button>
          <button
            className="literexia-pdf-btn"
            onClick={generatePDF}
            disabled={generatingPdf}
            title="Generate PDF Report"
          >
            {generatingPdf ? <FaSpinner className="spinning" /> : <FaFilePdf />}
            {generatingPdf ? 'Generating...' : 'Generate PDF'}
          </button>
        </div>
        
        <div className="literexia-table-responsive">
        <table className="literexia-iep-table">
          <thead>
            <tr>
              <th>Category</th>
                <th className="literexia-score-cell">Score</th>
                <th colSpan={3} className="text-center">Support Level Needed</th>
                <th>Intervention</th>
                <th>Teacher Remarks</th>
            </tr>
            <tr className="literexia-support-level-header">
              <th></th>
              <th></th>
                <th>
                  <div className="literexia-vertical-text">
                    <span>MI</span>
                    <span>NIMAL</span>
                  </div>
                </th>
                <th>
                  <div className="literexia-vertical-text">
                    <span>MO</span>
                    <span>DERATE</span>
                  </div>
                </th>
                <th>
                  <div className="literexia-vertical-text">
                    <span>EX</span>
                    <span>TENSIVE</span>
                  </div>
                </th>
              <th></th>
              <th></th>
            </tr>
          </thead>
          <tbody>
              {currentIepData.objectives.map((objective) => {
              return (
                <React.Fragment key={objective._id}>
                  {/* Main row - always visible */}
                  <tr className="literexia-objective-row">
                  <td className="literexia-lesson-cell">
                    <div className="literexia-lesson-content">
                      <div className="literexia-lesson-info">
                      <strong>{getCategoryName(objective.lesson)}</strong>
                      {objective.lastUpdated && (
                        <span className="literexia-last-updated">
                          Updated: {formatDate(objective.lastUpdated)}
                        </span>
                      )}
                    </div>
                    </div>
                </td>
                  <td className="literexia-score-cell">
                    <div className="literexia-score-display">
                      <div className="literexia-score-main">
                        <div className="literexia-primary-score">
                          <span className="literexia-score-number">
                          {objective.assessmentScore || objective.score || 0}%
                        </span>
                          <span className="literexia-score-label">Assessment</span>
                      </div>
                      {objective.hasIntervention && objective.latestInterventionScore && (
                        <div className="literexia-intervention-score">
                            <span className="literexia-score-number">
                            {objective.latestInterventionScore}%
                          </span>
                            <span className="literexia-score-label">Intervention</span>
                        </div>
                      )}
                      </div>
                      <div className={`literexia-status-indicator ${(objective.isPassed || objective.latestInterventionPassed) ? 'passed' : 'needs-work'}`}>
                          {(objective.isPassed || objective.latestInterventionPassed) ? 'Passed' : 'Needs Work'}
                      </div>

                  </div>
                </td>
                <td className="literexia-support-cell">
                    {renderSupportCheckbox(objective, 'minimal')}
                  </td>
                  <td className="literexia-support-cell">
                    {renderSupportCheckbox(objective, 'moderate')}
                </td>
                <td className="literexia-support-cell">
                    {renderSupportCheckbox(objective, 'extensive')}
                  </td>
                  <td className="literexia-intervention-cell">
                      <div className="literexia-intervention-display">
                        {/* Compact view - always visible */}
                        <div className="literexia-intervention-compact">
                          {!objective.hasIntervention ? (
                            <div className="literexia-no-intervention-status">
                              {objective.isPassed ? (
                                <>
                                  <FaAward className="literexia-success-icon" />
                                  <span>No intervention needed</span>
                                </>
                              ) : (
                                <>
                                  <FaExclamationCircle className="literexia-warning-icon" />
                                  <span>Intervention required</span>
                                </>
                              )}
                            </div>
                          ) : (
                            <div 
                              className="iep-intervention-card"
                              onClick={() => openInterventionModal(objective)}
                              title="Click to view detailed intervention information"
                            >
                              <div className="iep-intervention-header">
                                <div className="iep-intervention-icon-wrapper">
                                  <FaFlask />
                                </div>
                                <div className="iep-intervention-info">
                                  <div className="iep-intervention-stats">
                                    <div className="iep-attempts-badge">
                                      {objective.interventionHistory?.length || objective.interventionAttempts || 0} attempts
                                    </div>
                                    <div className="iep-score-badge">
                                      Latest: {objective.latestInterventionScore || 0}%
                                    </div>
                                    {objective.interventionImprovement !== undefined && objective.interventionImprovement !== 0 && (
                                      <div className={`iep-improvement-indicator ${objective.interventionImprovement > 0 ? 'positive' : 'negative'}`}>
                                        <span className="iep-improvement-icon">{objective.interventionImprovement > 0 ? '+' : ''}</span>
                                        {objective.interventionImprovement}%
                                      </div>
                                    )}
                                  </div>
                                </div>
                                <div className="iep-expand-toggle">
                                  <FaEye className="iep-expand-icon" />
                                </div>
                              </div>
                            </div>
                          )}
                        </div>

                      </div>
                </td>
                <td className="literexia-remarks-cell">
                       <div className="literexia-remarks-container">
                         {/* Unified Remarks Section */}
                         <div className="teacher-remarks-unified-section">
                           <div className="teacher-remarks-section-header">
                             <FaEdit className="teacher-remarks-section-icon" />
                             <span className="teacher-remarks-section-title">Teacher Remarks</span>
                           </div>
                           
                           {/* Main Assessment Remarks */}
                           <div className="teacher-remarks-main-area">
                             <div className="teacher-remarks-subheader">
                               <FaBook className="teacher-remarks-subheader-icon" />
                               <span className="teacher-remarks-subheader-title">Post Assessment</span>
                             </div>
                             {renderMainAssessmentRemarksCell(objective)}
                           </div>

                           {/* Intervention Remarks */}
                           {objective.interventionHistory && objective.interventionHistory.length > 0 ? (
                             <div className="teacher-remarks-intervention-area">
                               <div className="teacher-remarks-subheader">
                                 <FaFlask className="teacher-remarks-subheader-icon" />
                                 <span className="teacher-remarks-subheader-title">Intervention Attempts</span>
                               </div>
                               <div className="literexia-attempts-container">
                                 {/* Summary View - Always Visible */}
                                 <div className="literexia-attempts-summary">
                                   <div className="literexia-summary-header">
                                     <span className="literexia-summary-title">Add Remarks</span>
                                     <button
                                       className="literexia-expand-button"
                                       onClick={() => toggleRemarksExpansion(objective._id)}
                                       title={expandedRemarks[objective._id] ? "Collapse attempts" : "Show all attempts"}
                                     >
                                       <span className="literexia-summary-count">
                                         {objective.interventionHistory.length} attempt{objective.interventionHistory.length !== 1 ? 's' : ''}
                                       </span>
                                       <FaEye className={`literexia-expand-icon ${expandedRemarks[objective._id] ? 'expanded' : ''}`} />
                                     </button>
                                   </div>
                                 </div>

                                 {/* Expanded View - Only when expanded */}
                                 {expandedRemarks[objective._id] && (
                                   <div className="literexia-attempts-expanded">
                                     <div className="literexia-attempts-header">
                                       <span className="literexia-attempts-title">All Attempts</span>
                                     </div>
                                     <div className="literexia-attempt-buttons">
                                       {objective.interventionHistory.map((attempt, index) => (
                                         <button
                                           key={attempt._id || index}
                                           className={`literexia-attempt-button ${attempt.teacherRemarks ? 'has-remarks' : 'no-remarks'}`}
                                           onClick={() => openAttemptModal(objective, attempt, index)}
                                           title={`Edit remark for attempt #${attempt.attemptNumber || (index + 1)}`}
                                         >
                                           <div className="literexia-attempt-button-content">
                                             <span className="literexia-attempt-text">
                                               Attempt {attempt.attemptNumber || (index + 1)} - Edit Remark
                                             </span>
                                             {attempt.teacherRemarks && (
                                               <FaCheck className="literexia-remarks-indicator" />
                                             )}
                                           </div>
                                         </button>
                                       ))}
                                     </div>
                                   </div>
                                 )}
                               </div>
                             </div>
                           ) : (
                             <div className="teacher-remarks-intervention-area">
                               <div className="teacher-remarks-subheader">
                                 <FaFlask className="teacher-remarks-subheader-icon" />
                                 <span className="teacher-remarks-subheader-title">Intervention Attempts</span>
                               </div>
                               <div className="literexia-no-attempts-simple">
                                 <span className="literexia-remarks-placeholder">No intervention attempts</span>
                               </div>
                             </div>
                           )}
                         </div>
                       </div>
                </td>
              </tr>
                </React.Fragment>
              );
            })}
          </tbody>
        </table>
      </div>
      </div>

      {/* ✅ NEW: General Recommendations Section - Before Parent Information */}
      <div className="sdx-recommendation-card">
        <h3 className="sdx-section-title">
          <FaClipboardList /> General Recommendations
        </h3>
        <div className="sdx-recommendation-content">
          <div className="sdx-recommendation-header">
            <p className="sdx-recommendation-description">
              Provide personalized recommendations based on the student's overall progress, learning needs, and intervention outcomes. These recommendations will be included in the IEP Progress Report PDF.
            </p>
            {!isEditingRecommendation && (
              <button
                className="sdx-edit-recommendation-btn"
                onClick={() => setIsEditingRecommendation(true)}
              >
                <FaEdit /> Edit Recommendation
              </button>
            )}
          </div>

          {isEditingRecommendation ? (
            <div className="sdx-recommendation-edit">
              <textarea
                className="sdx-recommendation-textarea"
                value={generalRecommendation}
                onChange={(e) => setGeneralRecommendation(e.target.value)}
                placeholder="Enter general recommendations for the student. Consider their strengths, areas for improvement, suggested strategies for home support, and next steps in their learning journey..."
                rows="8"
              />
              <div className="sdx-recommendation-actions">
                <button
                  className="sdx-save-recommendation-btn"
                  onClick={saveGeneralRecommendation}
                  disabled={savingRecommendation}
                >
                  {savingRecommendation ? (
                    <>
                      <FaSpinner className="fa-spin" /> Saving...
                    </>
                  ) : (
                    <>
                      <FaSave /> Save Recommendation
                    </>
                  )}
                </button>
                <button
                  className="sdx-cancel-recommendation-btn"
                  onClick={cancelEditingRecommendation}
                  disabled={savingRecommendation}
                >
                  <FaTimes /> Cancel
                </button>
              </div>
            </div>
          ) : (
            <div className="sdx-recommendation-display">
              {generalRecommendation && generalRecommendation.trim() !== '' ? (
                <div className="sdx-recommendation-text">
                  <FaCheckCircle className="sdx-recommendation-icon" />
                  <p>{generalRecommendation}</p>
                </div>
              ) : (
                <div className="sdx-recommendation-empty">
                  <FaInfoCircle className="sdx-empty-icon" />
                  <p>No general recommendations have been provided yet. Click "Edit Recommendation" to add personalized recommendations for this student.</p>
                </div>
              )}
              {currentIepData?.generalRecommendationUpdatedAt && (
                <div className="sdx-recommendation-meta">
                  <FaCalendarAlt className="sdx-meta-icon" />
                  <span>Last updated: {new Date(currentIepData.generalRecommendationUpdatedAt).toLocaleDateString('en-US', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit'
                  })}</span>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Parent Information Section - Moved to bottom of Reading Skills Progress */}
      <div className="sdx-parent-card">
        <h3 className="sdx-section-title">
          <FaUser /> Parent/Guardian Information
        </h3>
        <div className="sdx-parent-details">
          <div className="sdx-parent-avatar">
            {renderParentImage()}
            {parentImageError && retryCount < MAX_RETRIES && (
              <div className="sdx-image-retry" onClick={retryLoadImage}>
                <FaSync size={14} /> Retry
              </div>
            )}
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
                      typeof student?.parentEmail === 'string' ?
                        student.parentEmail :
                        student?.parent && student.parent.email ?
                          student.parent.email : 'Not available'}
                  </span>
                </div>
                <div className="sdx-contact-item">
                  <FaPhone className="sdx-contact-icon" />
                  <span>
                    {parentProfile && parentProfile.phoneNumber ?
                      parentProfile.phoneNumber :
                      typeof student?.parentContact === 'string' ?
                        student.parentContact :
                        student?.parent && student.parent.contact ?
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
                    student?.parent && typeof student.parent === 'object' && student.parent.address ?
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
                    student?.parent && typeof student.parent === 'object' && student.parent.civilStatus ?
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
                    student?.parent && typeof student.parent === 'object' && student.parent.gender ?
                      student.parent.gender : 'Not provided'}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

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
                <>
              <button
                className="sdx-save-btn"
                onClick={handleSaveFeedback}
              >
                <FaSave /> Save Message
              </button>
                  <button
                    className="sdx-cancel-btn"
                    onClick={handleCancelFeedback}
                  >
                    <FaTimes /> Cancel
                  </button>
                </>
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
              disabled={isEditingFeedback || sendingEmail}
            >
              {sendingEmail ? <FaSpinner className="spinning" /> : <FaPaperPlane />}
              {sendingEmail ? 'Sending...' : 'Send Report'}
            </button>
          </div>
        </div>
      </div>


      
      {/* Saving overlay */}
      {saving && (
        <div className="literexia-saving-overlay">
          <FaSpinner className="spinning" />
        </div>
      )}

      {/* Intervention Details Modal */}
      {interventionModal.isOpen && interventionModal.objective && (
        <div className="literexia-modal-overlay" onClick={closeInterventionModal}>
          <div className="literexia-intervention-modal" onClick={(e) => e.stopPropagation()}>
            <div className="literexia-modal-header">
              <div className="literexia-modal-title">
                <FaFlask className="literexia-modal-icon" />
                <div>
                  <h3>Intervention Details</h3>
                  <p>{getCategoryName(interventionModal.objective.lesson)}</p>
                </div>
              </div>
              <button className="literexia-modal-close" onClick={closeInterventionModal}>
                <FaTimes />
              </button>
            </div>

            <div className="literexia-modal-content">
              <div className="literexia-intervention-summary-modal">
                <div className="literexia-intervention-stats-modal">
                  <div className="literexia-stat-item-modal">
                    <span className="literexia-stat-label-modal">Total Attempts</span>
                    <span className="literexia-stat-value-modal">{interventionModal.objective.interventionHistory?.length || interventionModal.objective.interventionAttempts || 0}</span>
                  </div>
                  <div className="literexia-stat-item-modal">
                    <span className="literexia-stat-label-modal">Latest Score</span>
                    <span className="literexia-stat-value-modal">{interventionModal.objective.latestInterventionScore || 0}%</span>
                  </div>
                  {interventionModal.objective.interventionImprovement !== undefined && interventionModal.objective.interventionImprovement !== 0 && (
                    <div className="literexia-stat-item-modal">
                      <span className="literexia-stat-label-modal">Improvement</span>
                      <span className={`literexia-stat-value-modal ${interventionModal.objective.interventionImprovement > 0 ? 'positive' : 'negative'}`}>
                        {interventionModal.objective.interventionImprovement > 0 ? '+' : ''}{interventionModal.objective.interventionImprovement}%
                      </span>
                    </div>
                  )}
                </div>
              </div>

              {interventionModal.objective.interventionHistory && interventionModal.objective.interventionHistory.length > 0 && (
                <div className="literexia-intervention-history-modal">
                  <div className="literexia-history-header-modal">
                    <FaClipboardList className="literexia-history-icon-modal" />
                    <h4>Intervention History</h4>
                  </div>
                  <div className="literexia-history-timeline-modal">
                    {interventionModal.objective.interventionHistory.map((attempt, index) => (
                      <div key={index} className={`literexia-history-item-modal ${attempt.isPassed ? 'passed' : 'failed'}`}>
                        <div className="literexia-history-indicator-modal">
                          <div className="literexia-history-dot-modal"></div>
                          {index < interventionModal.objective.interventionHistory.length - 1 && <div className="literexia-history-line-modal"></div>}
                        </div>
                        <div className="literexia-history-content-modal">
                          <div className="literexia-history-header-item-modal">
                            <span className="literexia-attempt-number-modal">Attempt #{attempt.attemptNumber || (index + 1)}</span>
                            <span className={`literexia-attempt-result-modal ${attempt.isPassed ? 'passed' : 'failed'}`}>
                              {attempt.isPassed ? 'PASSED' : 'FAILED'}
                            </span>
                          </div>
                          <div className="literexia-history-score-modal">
                            <strong>{attempt.score || 0}%</strong>
                          </div>
                          {attempt.attemptedAt && (
                            <div className="literexia-history-date-modal">
                              {formatDate(attempt.attemptedAt)}
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Individual Attempt Remark Modal */}
      {attemptModal.isOpen && attemptModal.objective && attemptModal.attempt && (
        <div className="literexia-modal-overlay" onClick={closeAttemptModal}>
          <div className="literexia-attempt-modal" onClick={(e) => e.stopPropagation()}>
            <div className="literexia-modal-header">
              <div className="literexia-modal-title">
                <FaEdit className="literexia-modal-icon" />
                <div>
                  <h3>Edit Remark</h3>
                  <p>{getCategoryName(attemptModal.objective.lesson)} - Attempt {attemptModal.attempt.attemptNumber || (attemptModal.attemptIndex + 1)}</p>
                </div>
              </div>
              <button className="literexia-modal-close" onClick={closeAttemptModal}>
                <FaTimes />
              </button>
            </div>

            <div className="literexia-modal-content">
              <div className="literexia-attempt-info-card">
                <div className="literexia-attempt-details-header">
                  <h4>Attempt Details</h4>
                </div>
                <div className="literexia-attempt-details-grid">
                  <div className="literexia-detail-item">
                    <span className="literexia-detail-label">Score:</span>
                    <span className={`literexia-detail-value ${attemptModal.attempt.isPassed ? 'passed' : 'failed'}`}>
                      {attemptModal.attempt.score}%
                    </span>
                  </div>
                  <div className="literexia-detail-item">
                    <span className="literexia-detail-label">Status:</span>
                    <span className={`literexia-detail-value ${attemptModal.attempt.isPassed ? 'passed' : 'failed'}`}>
                      {attemptModal.attempt.isPassed ? 'PASSED' : 'FAILED'}
                    </span>
                  </div>
                  <div className="literexia-detail-item">
                    <span className="literexia-detail-label">Date:</span>
                    <span className="literexia-detail-value">
                      {attemptModal.attempt.attemptedAt ? formatDate(attemptModal.attempt.attemptedAt) : 'N/A'}
                    </span>
                  </div>
                </div>
              </div>

              <div className="iep-modal-editor">
                <label htmlFor="attempt-remark">Your Remark</label>
                <div className="iep-modal-textarea-container">
                  <textarea
                    id="attempt-remark"
                    className="iep-modal-textarea"
                    placeholder="Enter your remark here..."
                    value={attemptModal.attempt.teacherRemarks || ''}
                    onChange={(e) => {
                      const updatedAttempt = { ...attemptModal.attempt, teacherRemarks: e.target.value };
                      setAttemptModal({ ...attemptModal, attempt: updatedAttempt });
                    }}
                    maxLength={500}
                  />
                  <div className="iep-modal-counter">
                    {(attemptModal.attempt.teacherRemarks || '').length}/500 characters
                  </div>
                </div>
              </div>

              <div className="iep-modal-actions">
                <button 
                  className="iep-modal-btn-secondary"
                  onClick={closeAttemptModal}
                  disabled={saving}
                >
                  Cancel
                </button>
                <button 
                  className="iep-modal-btn-primary"
                  onClick={() => saveAttemptRemark(
                    attemptModal.objective._id, 
                    attemptModal.attemptIndex, 
                    attemptModal.attempt.teacherRemarks || ''
                  )}
                  disabled={saving}
                >
                  {saving ? <FaSpinner className="spinning" /> : <FaSave />}
                  {saving ? 'Saving...' : 'Save Remark'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Post Assessment Modal */}
      {assessmentModal.isOpen && assessmentModal.objective && (
        <div className="literexia-modal-overlay" onClick={closeAssessmentModal}>
          <div className="literexia-modal" onClick={(e) => e.stopPropagation()}>
            <div className="literexia-modal-header">
              <div className="literexia-modal-title">
                <FaBook className="literexia-modal-icon" />
                <div>
                  <h3>Post Assessment Remarks</h3>
                  <p>{getCategoryName(assessmentModal.objective.lesson)}</p>
                </div>
              </div>
              <button className="literexia-modal-close" onClick={closeAssessmentModal}>
                <FaTimes />
              </button>
            </div>

            <div className="literexia-modal-content">
              <div className="iep-modal-editor">
                <label htmlFor="assessment-remark">Add your remarks about the student's post assessment:</label>
                <div className="iep-modal-textarea-container">
                  <textarea
                    id="assessment-remark"
                    className="iep-modal-textarea"
                    value={assessmentModal.objective.mainAssessmentRemarks || ''}
                    onChange={(e) => {
                      const updatedObjective = { ...assessmentModal.objective, mainAssessmentRemarks: e.target.value };
                      setAssessmentModal(prev => ({ ...prev, objective: updatedObjective }));
                    }}
                    placeholder="Type your remarks here..."
                    maxLength={500}
                  />
                  <div className="iep-modal-counter">
                    {(assessmentModal.objective.mainAssessmentRemarks || '').length}/500 characters
                  </div>
                </div>
                <div className="iep-modal-actions">
                  <button
                    type="button"
                    className="iep-modal-btn-secondary"
                    onClick={closeAssessmentModal}
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    className="iep-modal-btn-primary"
                    onClick={() => saveMainRemarks(assessmentModal.objective._id)}
                    disabled={!(assessmentModal.objective.mainAssessmentRemarks || '').trim()}
                  >
                    <FaSave />
                    Save Remarks
                  </button>
                </div>
              </div>
            </div>

          </div>
        </div>
      )}

      {/* Professional Progress Report Modal (Advanced from StudentDetails.jsx) */}
      {showProgressReport && (
        <div className="sdx-modal-overlay" onClick={() => setShowProgressReport(false)}>
          <div className="sdx-modal-content" onClick={e => e.stopPropagation()}>
            <div className="sdx-modal-header">
              <h2 className="sdx-modal-title">IEP Progress Report</h2>
              <div className="sdx-modal-actions">
                <button className="sdx-export-btn" onClick={exportToPDF} disabled={generatingPdf}>
                  {generatingPdf ? <FaSpinner className="spinning" /> : <FaFilePdf />}
                  {generatingPdf ? 'Generating...' : 'Export as PDF'}
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
              <div className="iep-pdf-container" ref={reportRef}>
                {/* Report Header with School Branding */}
                <div className="iep-pdf-header">
                  <img src={cradleLogo} alt="Cradle of Learners Logo" className="iep-pdf-logo" />
                  <div className="iep-pdf-school-info">
                    <h1 className="iep-pdf-school-name">CRADLE OF LEARNERS</h1>
                    <p className="iep-pdf-school-tagline">(Inclusive School for Individualized Education), Inc.</p>
                    <p className="iep-pdf-school-address">3rd Floor TUCP Bldg. Elliptical Road Corner Maharlika St. Quezon City</p>
                    <p className="iep-pdf-school-contact">Tel: 8294-7772 | Email: cradle.of.learners@gmail.com</p>
                  </div>
                </div>

                {/* Report Title */}
                <div className="iep-pdf-title-section">
                  <h2 className="iep-pdf-main-title">INDIVIDUALIZED EDUCATION PROGRAM<br/>IEP PROGRESS REPORT</h2>
                  <p className="iep-pdf-school-year">S.Y. {new Date().getFullYear()}-{new Date().getFullYear() + 1}</p>
                </div>

                {/* Student Information */}
                <div className="iep-pdf-student-info">
                  <div className="iep-pdf-info-row">
                    <div className="iep-pdf-info-item">
                      <strong>Name:</strong> {getStudentName()}
                    </div>
                    <div className="iep-pdf-info-item">
                      <strong>Age:</strong> {currentIepData?.studentId?.age || student?.age || 'N/A'}
                    </div>
                  </div>
                  <div className="iep-pdf-info-row">
                    <div className="iep-pdf-info-item">
                      <strong>Grade:</strong> {currentIepData?.studentId?.gradeLevel || student?.gradeLevel || 'N/A'}
                    </div>
                    <div className="iep-pdf-info-item">
                      <strong>Gender:</strong> {currentIepData?.studentId?.gender || student?.gender || 'N/A'}
                    </div>
                  </div>
                  <div className="iep-pdf-info-row">
                    <div className="iep-pdf-info-item">
                      <strong>Parent:</strong> {getParentName()}
                    </div>
                    <div className="iep-pdf-info-item">
                      <strong>Date:</strong> {new Date().toLocaleDateString()}
                    </div>
                  </div>
                  <div className="iep-pdf-info-row">
                    <div className="iep-pdf-info-item">
                      <strong>Reading Level:</strong> {currentIepData?.readingLevel || 'Not Assessed'}
                    </div>
                    <div className="iep-pdf-info-item">
                      <strong>Last Assessment:</strong> {currentIepData?.updatedAt ? formatDate(currentIepData.updatedAt) : 'N/A'}
                    </div>
                  </div>
                </div>

                {/* Student Performance Summary */}
                <div className="iep-pdf-section-title">Student Performance Summary</div>
                <div className="iep-pdf-performance-summary">
                  <div className="iep-pdf-summary-content">
                    <p className="iep-pdf-summary-text">
                      <strong>Reading Level Achievement:</strong> {getStudentName()} is currently functioning at the <strong>{currentIepData?.readingLevel || 'Not Assessed'}</strong> reading level
                      {(() => {
                        if (!currentIepData?.objectives) return ', with comprehensive assessment data pending to establish baseline performance and intervention needs.';

                        const availableCategories = currentIepData.objectives.map(obj => obj.categoryName);
                        const passedCategories = currentIepData.objectives.filter(obj => obj.isPassed);
                        const allPassed = passedCategories.length === availableCategories.length && availableCategories.length > 0;

                        // Calculate performance metrics for more detailed analysis
                        const averageScore = currentIepData.objectives.reduce((sum, obj) => sum + (obj.assessmentScore || obj.score || 0), 0) / currentIepData.objectives.length;
                        const performanceRange = Math.round(averageScore);

                        if (allPassed) {
                          return `, demonstrating complete mastery across all ${availableCategories.length} assessed literacy domain${availableCategories.length > 1 ? 's' : ''}: ${availableCategories.join(', ')}. With an average performance of ${performanceRange}%, this achievement reflects strong foundational reading skills and readiness for advancement to the next developmental reading level. The student's consistent performance above the 75% mastery threshold indicates solid understanding of current grade-level expectations.`;
                        } else {
                          const pendingCategories = currentIepData.objectives.filter(obj => !obj.isPassed);
                          const pendingCategoryNames = pendingCategories.map(obj => obj.categoryName);
                          const pendingScores = pendingCategories.map(obj => `${obj.categoryName} (${obj.assessmentScore || obj.score || 0}%)`);

                          return `, requiring targeted development in ${pendingCategoryNames.length} critical literacy domain${pendingCategoryNames.length > 1 ? 's' : ''}: ${pendingScores.join(', ')}. Current performance indicates specific skill gaps that benefit from systematic intervention approaches. The average assessment performance of ${performanceRange}% suggests ${performanceRange >= 50 ? 'emerging competencies that can be strengthened' : 'foundational skills requiring intensive support'} through evidence-based instructional strategies.`;
                        }
                      })()}
                    </p>

                    <p className="iep-pdf-summary-text">
                      <strong>Initial Assessment Performance:</strong> The comprehensive initial assessment administered across multiple literacy domains revealed the following detailed performance profile:
                      {(() => {
                        if (!currentIepData?.objectives || currentIepData.objectives.length === 0) {
                          return ' Assessment data is not yet available and requires completion to establish baseline performance metrics.';
                        }

                        const performanceDetails = currentIepData.objectives.map(obj => {
                          const score = obj.assessmentScore || obj.score || 0;
                          const questionData = obj.totalQuestions ? ` (${obj.correctAnswers || 0}/${obj.totalQuestions} questions correct)` : '';
                          return `${obj.categoryName}: ${score}%${questionData}`;
                        });

                        const failedCategories = currentIepData.objectives.filter(obj => !obj.isPassed);
                        const passedCategories = currentIepData.objectives.filter(obj => obj.isPassed);

                        // Calculate score distribution
                        const scores = currentIepData.objectives.map(obj => obj.assessmentScore || obj.score || 0);
                        const highScores = scores.filter(s => s >= 75).length;
                        const mediumScores = scores.filter(s => s >= 50 && s < 75).length;
                        const lowScores = scores.filter(s => s < 50).length;

                        let performanceAnalysis = ` ${performanceDetails.join('; ')}.`;

                        if (failedCategories.length > 0) {
                          const interventionCategoriesDetails = failedCategories.map(obj => {
                            const score = obj.assessmentScore || obj.score || 0;
                            if (score < 25) return `${obj.categoryName} (significant challenge at ${score}%)`;
                            else if (score < 50) return `${obj.categoryName} (moderate difficulty at ${score}%)`;
                            else return `${obj.categoryName} (approaching proficiency at ${score}%)`;
                          });

                          performanceAnalysis += ` Assessment results indicate ${failedCategories.length} domain${failedCategories.length > 1 ? 's' : ''} requiring intervention: ${interventionCategoriesDetails.join(', ')}. Performance distribution shows ${highScores} area${highScores !== 1 ? 's' : ''} at mastery level, ${mediumScores} area${mediumScores !== 1 ? 's' : ''} showing emerging skills, and ${lowScores} area${lowScores !== 1 ? 's' : ''} needing intensive support.`;
                        } else {
                          performanceAnalysis += ` All ${currentIepData.objectives.length} assessed literacy domain${currentIepData.objectives.length > 1 ? 's' : ''} exceeded the 75% proficiency threshold, demonstrating strong foundational reading competencies and indicating readiness for grade-level academic challenges.`;
                        }

                        return performanceAnalysis;
                      })()}
                    </p>

                    <p className="iep-pdf-summary-text">
                      <strong>Intervention Progress:</strong> {getStudentName()}
                      {(() => {
                        if (!currentIepData?.objectives) return 'has not yet initiated intervention activities, pending completion of baseline assessment protocols.';

                        const totalAttempts = currentIepData.objectives.reduce((total, obj) => total + (obj.interventionAttempts || 0), 0);
                        const categoriesWithInterventions = currentIepData.objectives.filter(obj => obj.hasIntervention && obj.interventionAttempts > 0);

                        if (totalAttempts === 0) {
                          const needingIntervention = currentIepData.objectives.filter(obj => !obj.isPassed);
                          if (needingIntervention.length > 0) {
                            return `has been identified for intervention support in ${needingIntervention.length} literacy domain${needingIntervention.length > 1 ? 's' : ''}: ${needingIntervention.map(obj => obj.categoryName).join(', ')}. Intervention protocols are pending implementation based on the comprehensive assessment results, with targeted strategies being developed to address specific learning gaps.`;
                          } else {
                            return 'has demonstrated proficiency across all assessed domains and does not require intervention support at this time.';
                          }
                        }

                        // Detailed intervention analysis
                        const interventionDetails = categoriesWithInterventions.map(obj => {
                          const improvementData = obj.interventionImprovement !== undefined ? ` with ${obj.interventionImprovement >= 0 ? '+' : ''}${obj.interventionImprovement}% improvement` : '';
                          const latestScore = obj.latestInterventionScore ? ` (latest score: ${obj.latestInterventionScore}%)` : '';
                          return `${obj.categoryName} (${obj.interventionAttempts} attempt${obj.interventionAttempts > 1 ? 's' : ''}${improvementData}${latestScore})`;
                        });

                        const successfulInterventions = categoriesWithInterventions.filter(obj => obj.latestInterventionPassed);
                        const unsuccessfulInterventions = categoriesWithInterventions.filter(obj => !obj.latestInterventionPassed);

                        // Calculate overall intervention effectiveness
                        const totalImprovements = categoriesWithInterventions
                          .filter(obj => obj.interventionImprovement !== undefined)
                          .reduce((sum, obj) => sum + obj.interventionImprovement, 0);
                        const avgImprovement = categoriesWithInterventions.length > 0 ? Math.round(totalImprovements / categoriesWithInterventions.length) : 0;

                        let progressReport = ` has actively engaged in ${totalAttempts} intervention session${totalAttempts > 1 ? 's' : ''} across ${categoriesWithInterventions.length} literacy domain${categoriesWithInterventions.length > 1 ? 's' : ''}: ${interventionDetails.join('; ')}.`;

                        if (successfulInterventions.length > 0) {
                          progressReport += ` The student successfully achieved mastery in ${successfulInterventions.length} domain${successfulInterventions.length > 1 ? 's' : ''} (${successfulInterventions.map(obj => obj.categoryName).join(', ')}), demonstrating an average improvement of ${avgImprovement}% across intervention areas. This progress indicates strong responsiveness to targeted instructional support and effective skill acquisition through systematic intervention approaches.`;

                          if (unsuccessfulInterventions.length > 0) {
                            progressReport += ` Continued intervention focus is recommended for ${unsuccessfulInterventions.length} remaining domain${unsuccessfulInterventions.length > 1 ? 's' : ''}: ${unsuccessfulInterventions.map(obj => obj.categoryName).join(', ')}.`;
                          }
                        } else {
                          progressReport += ` While the student has demonstrated commitment to the intervention process with an average improvement of ${avgImprovement}% across attempted domains, mastery thresholds have not yet been achieved. These results suggest the need for adjusted intervention strategies, increased instructional intensity, or alternative pedagogical approaches to better support the student's learning profile and specific needs.`;
                        }

                        return progressReport;
                      })()}
                    </p>
                    
                    <p className="iep-pdf-summary-text">
                      <strong>Mastery Achievement and Learning Trajectory:</strong>
                      {(() => {
                        if (!currentIepData?.objectives || currentIepData.objectives.length === 0) {
                          return `${getStudentName()} has not yet completed comprehensive assessment protocols. Baseline evaluation is required to establish current performance levels and identify individual learning strengths and areas for growth.`;
                        }

                        const passedCategories = currentIepData.objectives.filter(obj => obj.isPassed);
                        const totalCategories = currentIepData.objectives.length;
                        const masteryPercentage = Math.round((passedCategories.length / totalCategories) * 100);

                        // Calculate detailed improvement metrics
                        const improvementData = currentIepData.objectives
                          .filter(obj => obj.hasIntervention && obj.interventionImprovement !== undefined)
                          .map(obj => obj.interventionImprovement);

                        const avgImprovement = improvementData.length > 0 ?
                          Math.round(improvementData.reduce((a, b) => a + b, 0) / improvementData.length) : 0;

                        // Analyze learning patterns
                        const strongDomains = currentIepData.objectives.filter(obj => (obj.assessmentScore || obj.score || 0) >= 75);
                        const emergingDomains = currentIepData.objectives.filter(obj => (obj.assessmentScore || obj.score || 0) >= 50 && (obj.assessmentScore || obj.score || 0) < 75);
                        const challengingDomains = currentIepData.objectives.filter(obj => (obj.assessmentScore || obj.score || 0) < 50);

                        // Overall average score
                        const averageScore = Math.round(currentIepData.objectives.reduce((sum, obj) => sum + (obj.assessmentScore || obj.score || 0), 0) / totalCategories);

                        if (masteryPercentage === 100) {
                          return `${getStudentName()} has demonstrated exceptional academic achievement through systematic intervention implementation, attaining complete mastery (100%) across all ${totalCategories} assessed literacy domain${totalCategories > 1 ? 's' : ''} with an overall performance average of ${averageScore}%. The intervention effectiveness data shows an average improvement of ${avgImprovement}% across targeted domains, indicating highly successful responsiveness to instructional support. This comprehensive mastery profile demonstrates the student's strong foundational reading competencies, consistent academic engagement, effective learning strategies, and readiness for advanced literacy challenges at the next developmental level.`;
                        } else if (masteryPercentage >= 75) {
                          return `${getStudentName()} has achieved substantial academic progress with ${masteryPercentage}% mastery across assessed literacy domains (${passedCategories.length} of ${totalCategories} categories passed) and an overall performance average of ${averageScore}%. Performance analysis reveals strength in ${strongDomains.length} domain${strongDomains.length !== 1 ? 's' : ''}, emerging competencies in ${emergingDomains.length} area${emergingDomains.length !== 1 ? 's' : ''}, and targeted support needs in ${challengingDomains.length} domain${challengingDomains.length !== 1 ? 's' : ''}. The intervention effectiveness data shows an average improvement of ${avgImprovement}% across intervention areas, demonstrating positive educational outcomes and strong potential for achieving complete mastery with continued targeted support.`;
                        } else if (masteryPercentage > 0) {
                          return `${getStudentName()} has achieved emerging mastery with ${masteryPercentage}% completion across assessed literacy domains (${passedCategories.length} of ${totalCategories} categories passed) and an overall performance average of ${averageScore}%. Current achievement profile shows ${strongDomains.length} domain${strongDomains.length !== 1 ? 's' : ''} at proficiency level, ${emergingDomains.length} area${emergingDomains.length !== 1 ? 's' : ''} showing developing skills, and ${challengingDomains.length} domain${challengingDomains.length !== 1 ? 's' : ''} requiring intensive support. Intervention data indicates ${avgImprovement >= 0 ? `positive growth trajectory with ${avgImprovement}% average improvement` : 'ongoing challenges requiring strategy revision'}, suggesting the need for enhanced instructional approaches, increased support intensity, and possibly individualized learning accommodations.`;
                        } else {
                          const unsuccessfulDomains = currentIepData.objectives.filter(obj => !obj.isPassed).map(obj => obj.categoryName);
                          return `${getStudentName()} requires comprehensive intervention support across all assessed literacy domains: ${unsuccessfulDomains.join(', ')}. With an overall performance average of ${averageScore}%, current results indicate significant foundational skill gaps that require intensive, individualized instructional approaches. The intervention data suggests ${avgImprovement !== 0 ? `some responsiveness with ${avgImprovement}% change, but` : 'limited responsiveness, indicating the need for'} alternative pedagogical strategies, increased instructional intensity, multi-sensory teaching approaches, and potentially specialized educational services to effectively address the student's unique learning profile and academic needs.`;
                        }
                      })()}
                    </p>

                    <p className="iep-pdf-summary-text">
                      <strong>Current Academic Status and Recommendations:</strong>
                      {(() => {
                        if (!currentIepData?.objectives || currentIepData.objectives.length === 0) {
                          return `${getStudentName()} requires comprehensive initial assessment to establish current reading competencies, identify learning strengths, and determine appropriate individualized intervention strategies for optimal academic progress.`;
                        }

                        const passedCategories = currentIepData.objectives.filter(obj => obj.isPassed);
                        const totalCategories = currentIepData.objectives.length;
                        const allPassed = passedCategories.length === totalCategories;
                        const hasActiveInterventions = currentIepData.objectives.some(obj => obj.hasIntervention && !obj.latestInterventionPassed);

                        // Calculate current performance metrics
                        const averageScore = Math.round(currentIepData.objectives.reduce((sum, obj) => sum + (obj.assessmentScore || obj.score || 0), 0) / totalCategories);
                        const masteryPercentage = Math.round((passedCategories.length / totalCategories) * 100);

                        // Determine next reading level
                        const readingLevelProgression = {
                          'Low Emerging': 'High Emerging',
                          'High Emerging': 'Developing',
                          'Developing': 'Transitioning',
                          'Transitioning': 'At Grade Level',
                          'At Grade Level': 'Advanced'
                        };
                        const nextLevel = readingLevelProgression[currentIepData.readingLevel] || 'Next Level';

                        if (allPassed) {
                          return `${getStudentName()} has successfully achieved mastery across all ${totalCategories} assessed literacy domain${totalCategories > 1 ? 's' : ''} for the ${currentIepData.readingLevel} reading level, with an overall performance average of ${averageScore}%. This comprehensive achievement demonstrates strong foundational reading competencies and indicates exceptional readiness for academic advancement to the ${nextLevel} reading level. The student would benefit from enrichment activities, advanced literacy challenges, and continued progress monitoring to maintain skill proficiency and support accelerated academic growth in reading development.`;
                        } else if (hasActiveInterventions) {
                          const pendingCategories = currentIepData.objectives.filter(obj => !obj.isPassed);
                          const pendingDetails = pendingCategories.map(obj => `${obj.categoryName} (${obj.assessmentScore || obj.score || 0}%)`);

                          return `${getStudentName()} is currently engaged in active intervention protocols targeting ${pendingCategories.length} literacy domain${pendingCategories.length > 1 ? 's' : ''}: ${pendingDetails.join(', ')}. With ${masteryPercentage}% current mastery rate and ${averageScore}% overall performance, the student requires continued systematic intervention support, potential revision of instructional strategies, and enhanced educational accommodations to achieve proficiency at the ${currentIepData.readingLevel} reading level. Recommended actions include: regular progress monitoring (weekly), data-driven intervention adjustments, collaborative teacher consultation, and possible referral for additional educational support services.`;
                        } else {
                          const failedCategories = currentIepData.objectives.filter(obj => !obj.isPassed);
                          const failedDetails = failedCategories.map(obj => `${obj.categoryName} (${obj.assessmentScore || obj.score || 0}%)`);

                          return `${getStudentName()} requires immediate implementation of intensive intervention protocols in ${failedCategories.length} critical literacy domain${failedCategories.length > 1 ? 's' : ''}: ${failedDetails.join(', ')}. With current performance metrics showing ${masteryPercentage}% mastery rate and ${averageScore}% overall academic achievement, priority actions include: development of individualized intervention plans, implementation of evidence-based instructional strategies, provision of specialized educational supports, and establishment of frequent progress monitoring systems. The student would benefit from multi-sensory teaching approaches, reduced cognitive load strategies, and potential consultation with literacy specialists to address identified learning gaps and facilitate academic progress toward mastery at the ${currentIepData.readingLevel} reading level.`;
                        }
                      })()}
                    </p>
                  </div>
                </div>

                {/* IEP Progress Table */}
                <div className="iep-pdf-page-2-section">
                  <div className="iep-pdf-page-break-spacer"></div>
                  <div className="iep-pdf-section-title">Learning Objectives and Progress</div>
                  <div className="iep-pdf-progress-table">
                  <table className="iep-pdf-table">
                    <thead>
                      <tr>
                        <th className="iep-pdf-th-category">Learning Category</th>
                        <th className="iep-pdf-th-score">Assessment Score</th>
                        <th className="iep-pdf-th-intervention">Intervention Progress</th>
                        <th className="iep-pdf-th-support" colSpan="3">Support Level Required</th>
                        <th className="iep-pdf-th-remarks">Teacher Remarks</th>
                      </tr>
                      <tr>
                        <th className="iep-pdf-th-empty"></th>
                        <th className="iep-pdf-th-empty"></th>
                        <th className="iep-pdf-th-empty"></th>
                        <th className="iep-pdf-th-level">Min</th>
                        <th className="iep-pdf-th-level">Mod</th>
                        <th className="iep-pdf-th-level">Ext</th>
                        <th className="iep-pdf-th-empty"></th>
                      </tr>
                    </thead>
                    <tbody>
                      {currentIepData && currentIepData.objectives && currentIepData.objectives.length > 0 ? (
                        currentIepData.objectives.map((objective, index) => {
                          // Get category data from the categories array if available
                          const categoryData = currentIepData.categories?.find(cat =>
                            cat.categoryName === getCategoryName(objective.lesson)
                          );

                          return (
                            <tr key={index} className="iep-pdf-tr">
                              <td className="iep-pdf-category-cell">
                                <div className="iep-pdf-category-info">
                                  <div className="iep-pdf-category-name">{getCategoryName(objective.lesson)}</div>
                                  <div className="iep-pdf-category-status">
                                    {(objective.isPassed || objective.latestInterventionPassed) ?
                                      'Mastered' :
                                      objective.hasIntervention ? 'In Progress' : 'Needs Support'
                                    }
                                </div>
                              </div>
                            </td>
                              <td className="iep-pdf-score-cell">
                                <div className="iep-pdf-score-breakdown">
                                  <div className="iep-pdf-primary-score">
                                    <span className={`iep-pdf-score-${(objective.assessmentScore || objective.score || 0) >= 75 ? 'passing' : 'failing'}`}>
                                      {objective.assessmentScore || objective.score || 0}%
                              </span>
                                  </div>
                                  <div className="iep-pdf-score-status">
                                    {(objective.assessmentScore || objective.score || 0) >= 75 ? 'Passed' : 'Needs Support'}
                                  </div>
                                </div>
                            </td>
                              <td className="iep-pdf-intervention-cell">
                                {objective.hasIntervention ? (
                                  <div className="iep-pdf-intervention-details">
                                    <div className="iep-pdf-intervention-attempts">
                                      <strong>Attempts:</strong> {categoryData?.interventionAttempts || objective.interventionAttempts || 0}
                                    </div>
                                    <div className="iep-pdf-intervention-latest">
                                      <strong>Latest Score:</strong>
                                      <span className={`iep-pdf-score-${(objective.latestInterventionScore || 0) >= 75 ? 'passing' : 'failing'}`}>
                                        {objective.latestInterventionScore || 0}%
                                </span>
                                    </div>
                                    <div className="iep-pdf-intervention-result">
                                      {objective.latestInterventionPassed ?
                                        'Successfully Completed' :
                                        'Ongoing Support Required'
                                      }
                                    </div>
                                    {categoryData?.interventionHistory && categoryData.interventionHistory.length > 1 && (
                                      <div className="iep-pdf-intervention-progress">
                                        <small>Progress: {categoryData.interventionHistory[0].score || 0}% → {objective.latestInterventionScore || 0}%</small>
                                  </div>
                                )}
                              </div>
                                ) : (
                                  <div className="iep-pdf-no-intervention">
                                    {(objective.isPassed || (objective.assessmentScore || objective.score || 0) >= 75) ?
                                      'No intervention needed' :
                                      'Intervention recommended'
                                    }
                                  </div>
                                )}
                            </td>
                              <td className="iep-pdf-support-cell">
                                {objective.supportLevel === 'minimal' ? '✓' : ''}
                            </td>
                              <td className="iep-pdf-support-cell">
                                {objective.supportLevel === 'moderate' ? '✓' : ''}
                            </td>
                              <td className="iep-pdf-support-cell">
                                {objective.supportLevel === 'extensive' ? '✓' : ''}
                            </td>
                              <td className="iep-pdf-remarks-cell">
                                <div className="iep-pdf-remarks-container">
                                  {/* Post Assessment Remarks - EXACTLY from database */}
                                  <div className="iep-pdf-remarks-section">
                                    <div className="iep-pdf-remarks-label">Teacher Assessment Remarks:</div>
                                    <div className="iep-pdf-remarks-content">
                                      {getDatabaseRemark(objective)}
                                    </div>
                                  </div>

                                  {/* Intervention Remarks */}
                                  {categoryData?.interventionHistory && categoryData.interventionHistory.length > 0 && (
                                    <div className="iep-pdf-remarks-section">
                                      <div className="iep-pdf-remarks-label">Intervention:</div>
                                      <div className="iep-pdf-intervention-remarks">
                                        {categoryData.interventionHistory
                                          .filter(attempt => extractCleanRemark(attempt.teacherRemarks))
                                          .map((attempt, idx) => (
                                            <div key={idx} className="iep-pdf-attempt-remark">
                                              <small>Attempt {attempt.attemptNumber}: </small>
                                              {extractCleanRemark(attempt.teacherRemarks) || 'No remarks added'}
                                            </div>
                                          ))
                                        }
                                        {!categoryData.interventionHistory.some(attempt => extractCleanRemark(attempt.teacherRemarks)) && (
                                          <small className="iep-pdf-no-remarks">No intervention remarks added</small>
                                        )}
                                      </div>
                                  </div>
                                )}

                                  {/* Note: No "No remarks message" needed since we always generate progress summaries */}
                              </div>
                            </td>
                          </tr>
                          );
                        })
                      ) : (
                        <tr className="iep-pdf-tr">
                          <td colSpan="7" className="iep-pdf-empty-cell">
                            No learning objectives recorded yet.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
                      </div>

                {/* Intervention Details Section - Only show if we have intervention data */}
                {currentIepData && currentIepData.objectives && currentIepData.objectives.length > 0 &&
                 currentIepData.objectives.some(objective => {
                   const categoryData = currentIepData.categories?.find(cat =>
                     cat.categoryName === getCategoryName(objective.lesson)
                   );
                   return objective.hasIntervention ||
                     (categoryData && categoryData.interventionHistory && categoryData.interventionHistory.length > 0);
                 }) && (
                  <div className="iep-pdf-intervention-details">
                    <div className="iep-pdf-page-break-spacer"></div>
                    <div className="iep-pdf-section-title">Intervention Details</div>
                    <div className="iep-pdf-intervention-content">
                      {currentIepData.objectives.map((objective, index) => {
                        // Check if we have intervention data directly in the objective
                        const hasInterventionData = objective.hasIntervention || 
                          (objective.interventionHistory && objective.interventionHistory.length > 0);
                        
                        if (!hasInterventionData) {
                          return null;
                        }
                        
                        return (
                          <div key={index} className={`iep-pdf-intervention-category ${index >= 3 ? 'iep-pdf-page-4-category' : ''}`}>
                            {/* Add page break after first 3 categories (index 2) for page 4 layout */}
                            {index === 3 && <div className="iep-pdf-page-4-spacer"></div>}
                            
                            <h4 className="iep-pdf-intervention-category-title">
                              {objective.categoryName || getCategoryName(objective.lesson)}
                            </h4>
                            <div className="iep-pdf-intervention-table">
                              <table className="iep-pdf-intervention-table-content">
                                <thead>
                                  <tr>
                                    <th className="iep-pdf-intervention-th">Attempt</th>
                                    <th className="iep-pdf-intervention-th">Score</th>
                                    <th className="iep-pdf-intervention-th">Status</th>
                                    <th className="iep-pdf-intervention-th">Date Attempted</th>
                                    <th className="iep-pdf-intervention-th">Teacher Remarks</th>
                                  </tr>
                                </thead>
                                <tbody>
                                  {(objective.interventionHistory || []).map((attempt, attemptIndex) => (
                                    <tr key={attemptIndex} className="iep-pdf-intervention-tr">
                                      <td className="iep-pdf-intervention-td">{attempt.attemptNumber}</td>
                                      <td className="iep-pdf-intervention-td">
                                        <span className={`iep-pdf-intervention-score ${attempt.isPassed ? 'passed' : 'failed'}`}>
                                          {attempt.score}%
                                        </span>
                                      </td>
                                      <td className="iep-pdf-intervention-td">
                                        <span className={`iep-pdf-intervention-status ${attempt.isPassed ? 'status-passed' : 'status-failed'}`}>
                                          {attempt.isPassed ? 'Passed' : 'Failed'}
                                        </span>
                                      </td>
                                      <td className="iep-pdf-intervention-td">
                                        {attempt.attemptedAt ? formatDate(attempt.attemptedAt) : 'N/A'}
                                      </td>
                                      <td className="iep-pdf-intervention-td iep-pdf-intervention-remarks">
                                        <div className="iep-pdf-intervention-remarks-content">
                                          <span className="iep-pdf-intervention-remark-text">
                                            {extractCleanRemark(attempt.teacherRemarks) || 'No remarks'}
                        </span>
                      </div>
                                      </td>
                                    </tr>
                                  ))}
                                </tbody>
                              </table>
                      </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* ✅ NEW: General Recommendations Section - Before Signatures */}
                <div className="iep-pdf-general-recommendation">
                  <div className="iep-pdf-section-title">General Recommendations</div>
                  <div className="iep-pdf-recommendation-content">
                    {currentIepData?.generalRecommendation && currentIepData.generalRecommendation.trim() !== '' ? (
                      <p className="iep-pdf-recommendation-text">
                        {currentIepData.generalRecommendation}
                      </p>
                    ) : (
                      <p className="iep-pdf-recommendation-empty">
                        No general recommendations have been provided at this time. Teachers may add personalized recommendations based on the student's overall progress and learning needs.
                      </p>
                    )}
                  </div>
                </div>

                {/* Authorized Personnel - Stay on page 4 with last 2 categories */}
                <div className="iep-pdf-page-4-section">
                  <div className="iep-pdf-signatures">
                  <div className="iep-pdf-signature">
                    <p className="iep-pdf-sign-name">{getTeacherName()}</p>
                    <p className="iep-pdf-sign-title">Grade 1 Teacher</p>
                    <p className="iep-pdf-sign-date">Date: {new Date().toLocaleDateString()}</p>
                </div>
                  <div className="iep-pdf-signature">
                    <p className="iep-pdf-sign-name">Ms. Jasmine P. Lim</p>
                    <p className="iep-pdf-sign-title">School Principal</p>
                    <p className="iep-pdf-sign-date">Date: {new Date().toLocaleDateString()}</p>
                  </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Success Dialog */}
      <SuccessDialog
        isOpen={showSuccessDialog}
        onClose={() => setShowSuccessDialog(false)}
        title="Success"
        message={successDialogData.message}
        submessage={successDialogData.submessage}
      />

      {/* Reading Level Progression Confirmation Dialog */}
      {showProgressionDialog && (
        <div className="literexia-modal-overlay" onClick={cancelReadingLevelProgression}>
          <div className="literexia-progression-modal" onClick={(e) => e.stopPropagation()}>
            <div className="literexia-modal-header">
              <div className="literexia-modal-title">
                <FaArrowUp className="literexia-modal-icon warning" />
                <div>
                  <h3>Confirm Reading Level Progression</h3>
                  <p>This action will permanently change the student's reading level</p>
                </div>
              </div>
              <button className="literexia-modal-close" onClick={cancelReadingLevelProgression}>
                <FaTimes />
              </button>
            </div>

            <div className="literexia-modal-content">
              <div className="literexia-progression-warning">
                <div className="literexia-warning-icon">
                  <FaInfoCircle />
                </div>
                <div className="literexia-warning-content">
                  <h4>
                    {getNextReadingLevel()
                      ? `Are you sure you want to progress ${getStudentName()} to the next reading level?`
                      : `${getStudentName()} is already at the maximum reading level.`
                    }
                  </h4>
                  <div className="literexia-level-progression-info">
                    <div className="literexia-current-level">
                      <span className="literexia-level-label">Current Level:</span>
                      <span className="literexia-level-value">{currentIepData?.readingLevel || 'Not Assessed'}</span>
                    </div>
                    <div className="literexia-arrow-separator">
                      <FaArrowUp />
                    </div>
                    <div className="literexia-next-level">
                      <span className="literexia-level-label">Next Level:</span>
                      <span className="literexia-level-value next">{getNextReadingLevel() || 'Maximum Level Reached'}</span>
                    </div>
                  </div>
                  <div className="literexia-warning-footer">
                    <FaInfoCircle className="literexia-warning-footer-icon" />
                    <strong>This action cannot be undone.</strong>
                  </div>
                </div>
              </div>

              <div className="literexia-modal-actions">
                <button 
                  className="literexia-modal-btn-secondary"
                  onClick={cancelReadingLevelProgression}
                  disabled={saving}
                >
                  <FaTimes />
                  Cancel
                </button>
                <button 
                  className="literexia-modal-btn-primary progression"
                  onClick={confirmReadingLevelProgression}
                  disabled={saving}
                >
                  {saving ? <FaSpinner className="spinning" /> : <FaArrowUp />}
                  {saving ? 'Progressing...' : 'Progress to Next Level'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default IEPReport; 
