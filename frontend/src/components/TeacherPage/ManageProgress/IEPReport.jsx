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
import { jsPDF } from 'jspdf';
import html2canvas from 'html2canvas';
import { toast } from '../../../utils/toastHelper';
import SuccessDialog from '../../Teachers/SuccessDialog';
import './css/IEPReport.css';
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
  
  // Teacher profile state
  const [teacherProfile, setTeacherProfile] = useState(null);

  // Refs for PDF generation
  const reportRef = useRef();
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
      console.log('Loading IEP data for student:', studentId);
      
      const response = await IEPService.getIEPReport(studentId);
      
      if (response.success && response.data) {
        console.log('Setting IEP data:', response.data);
        console.log('About to call setIepData...');

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

      // Wait a moment for the modal to render completely
      await new Promise(resolve => setTimeout(resolve, 500));

      if (!reportRef.current) {
        console.error("IEP report element not found");
        toast.error("Failed to generate PDF - Report element not found");
        return;
      }

      try {
        // Use html2canvas to capture the report with optimized settings
        const canvas = await html2canvas(reportRef.current, {
          scale: 1.5, // Balanced scale for quality and file size
          useCORS: true,
          logging: false,
          allowTaint: true,
          scrollY: -window.scrollY,
          backgroundColor: '#ffffff',
          removeContainer: true,
          imageTimeout: 15000
        });

        // Create PDF with proper dimensions
        const imgData = canvas.toDataURL('image/jpeg', 0.8); // Use JPEG for smaller file size
        const pdf = new jsPDF('p', 'mm', 'a4');
        const pdfW = pdf.internal.pageSize.getWidth();
        const pdfH = pdf.internal.pageSize.getHeight();

        // Calculate image dimensions for PDF
        const imgW = pdfW;
        const imgH = (canvas.height * imgW) / canvas.width;

        // Add image to PDF, potentially across multiple pages
        let yOffset = 0;
        let remainingH = imgH;

        // First page
        pdf.addImage(imgData, 'JPEG', 0, yOffset, imgW, imgH, undefined, 'FAST');
        remainingH -= pdfH;
        yOffset -= pdfH;

        // Add extra pages if needed
        while (remainingH > 0) {
          pdf.addPage();
          pdf.addImage(imgData, 'JPEG', 0, yOffset, imgW, imgH, undefined, 'FAST');
          remainingH -= pdfH;
          yOffset -= pdfH;
        }

        // Save the PDF with the student's name
        const studentName = getStudentName() || 'Student';
        const fileName = `IEP_Progress_Report_${studentName.replace(/[^a-z0-9]/gi, '_')}_${new Date().toISOString().split('T')[0]}.pdf`;
        pdf.save(fileName);

        console.log("IEP PDF generated successfully");
        toast.success("IEP Progress Report PDF generated successfully");
        showSuccessMessage('IEP PDF report generated successfully!');

      } catch (error) {
        console.error("Error generating IEP PDF:", error);
        toast.error("Failed to generate IEP PDF");
        setError("There was an error generating the PDF. Please try again.");
      }
    } catch (error) {
      console.error('Error preparing IEP PDF data:', error);
      toast.error("Failed to prepare IEP PDF data");
      setError('Failed to prepare PDF data. Please try again.');
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

          // Generate PDF data with optimized settings
          const canvas = await html2canvas(element, {
            scale: 1.5, // Reduced from 2 to lower file size
            useCORS: true,
            scrollY: -window.scrollY,
            logging: false,
            imageTimeout: 15000,
            backgroundColor: '#ffffff',
            // Add quality options to reduce file size
            allowTaint: true,
            removeContainer: true
          });

          const imgData = canvas.toDataURL('image/jpeg', 0.7); // Use JPEG instead of PNG for smaller file size

          const pdf = new jsPDF('p', 'mm', 'a4');
          const pdfWidth = pdf.internal.pageSize.getWidth();
          const pdfHeight = pdf.internal.pageSize.getHeight();
          const imgWidth = canvas.width;
          const imgHeight = canvas.height;
          const ratio = Math.min(pdfWidth / imgWidth, pdfHeight / imgHeight);

          // Add image with compression settings
          pdf.addImage(
            imgData,
            'JPEG',
            0,
            0,
            imgWidth * ratio,
            imgHeight * ratio,
            undefined,
            'FAST' // Use FAST compression
          );

          // Convert to base64 with lower quality
          const pdfOutput = pdf.output('datauristring');
          pdfBase64 = pdfOutput.split(',')[1]; // Extract the base64 part

          console.log(`PDF generated successfully, original size: ${pdfBase64.length} bytes`);

          // Try to reduce size if needed
          if (pdfBase64.length > 5000000) { // Check if PDF is over 5MB
            toast.loading('PDF is too large, attempting to optimize...');

            // Try a more aggressive approach for large PDFs
            const smallerCanvas = document.createElement('canvas');
            const ctx = smallerCanvas.getContext('2d');
            const scaleFactor = 0.5; // Scale down by 50%

            smallerCanvas.width = canvas.width * scaleFactor;
            smallerCanvas.height = canvas.height * scaleFactor;

            ctx.drawImage(canvas, 0, 0, smallerCanvas.width, smallerCanvas.height);
            const smallerImgData = smallerCanvas.toDataURL('image/jpeg', 0.5);

            const smallerPdf = new jsPDF('p', 'mm', 'a4');
            smallerPdf.addImage(
              smallerImgData,
              'JPEG',
              0,
              0,
              pdfWidth,
              pdfHeight * (smallerCanvas.height / smallerCanvas.width) * (pdfWidth / pdfHeight),
              undefined,
              'FAST'
            );

            const smallerPdfOutput = smallerPdf.output('datauristring');
            const smallerPdfBase64 = smallerPdfOutput.split(',')[1];

            console.log(`Reduced PDF size from ${pdfBase64.length} to ${smallerPdfBase64.length} bytes`);

            if (smallerPdfBase64.length <= 5000000) {
              pdfBase64 = smallerPdfBase64;
            } else {
              console.warn('PDF is still too large after optimization');
              const continueWithoutPDF = window.confirm(
                'The generated PDF is too large to send. Would you like to send the message without the PDF attachment?'
              );

              if (continueWithoutPDF) {
                pdfBase64 = null;
                setIncludeProgressReport(false);
              } else {
                setShowProgressReport(false);
                return;
              }
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
                    {objective.interventionAttempts || 0} attempt{(objective.interventionAttempts || 0) !== 1 ? 's' : ''}
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
  
  // Get data from either local state or global state
  const currentIepData = iepData || window.iepReportGlobalState?.iepData;
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

  // Get student name
  const getStudentName = () => {
    if (currentIepData.studentId?.firstName && currentIepData.studentId?.lastName) {
      return `${currentIepData.studentId.firstName} ${currentIepData.studentId.lastName}`;
    } else if (student?.firstName && student?.lastName) {
      return `${student.firstName} ${student.lastName}`;
    } else if (student?.name) {
      return student.name;
    } else {
      return 'Student';
    }
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
            <span className="literexia-summary-label">Reading Level</span>
            <span className="literexia-summary-value">{currentIepData.readingLevel || 'Not Assessed'}</span>
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
          <div className="literexia-table-info">
            <span>Click intervention details to view attempt history</span>
          </div>
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
                                      {objective.interventionAttempts || 0} attempts
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

      {/* Export Actions */}
      <div className="literexia-export-actions">
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
                    <span className="literexia-stat-value-modal">{interventionModal.objective.interventionAttempts || 0}</span>
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
              <div className="sdx-report-printable" ref={reportRef}>
                {/* Report Header with School Branding */}
                <div className="sdx-report-header">
                  <img src={cradleLogo} alt="Cradle of Learners Logo" className="sdx-report-logo" />
                  <div className="sdx-report-school-info">
                    <h1 className="sdx-report-school-name">CRADLE OF LEARNERS</h1>
                    <p className="sdx-report-school-tagline">(Inclusive School for Individualized Education), Inc.</p>
                    <p className="sdx-report-school-address">3rd Floor TUCP Bldg. Elliptical Road Corner Maharlika St. Quezon City</p>
                    <p className="sdx-report-school-contact">☎ 8294‑7772 | ✉ cradle.of.learners@gmail.com</p>
                  </div>
                </div>

                {/* Report Title */}
                <div className="sdx-report-title-section">
                  <h2 className="sdx-report-main-title">PROGRESS REPORT</h2>
                  <p className="sdx-report-school-year">S.Y. {new Date().getFullYear()}-{new Date().getFullYear() + 1}</p>
                </div>

                {/* Student Information */}
                <div className="sdx-report-student-info">
                  <div className="sdx-report-info-row">
                    <div className="sdx-report-info-item">
                      <strong>Name:</strong> {getStudentName()}
                    </div>
                    <div className="sdx-report-info-item">
                      <strong>Age:</strong> {currentIepData?.studentId?.age || student?.age || 'N/A'}
                    </div>
                  </div>
                  <div className="sdx-report-info-row">
                    <div className="sdx-report-info-item">
                      <strong>Grade:</strong> {currentIepData?.studentId?.gradeLevel || student?.gradeLevel || 'N/A'}
                    </div>
                    <div className="sdx-report-info-item">
                      <strong>Gender:</strong> {currentIepData?.studentId?.gender || student?.gender || 'N/A'}
                    </div>
                  </div>
                  <div className="sdx-report-info-row">
                    <div className="sdx-report-info-item">
                      <strong>Parent:</strong> {getParentName()}
                    </div>
                    <div className="sdx-report-info-item">
                      <strong>Date:</strong> {new Date().toLocaleDateString()}
                    </div>
                  </div>
                  <div className="sdx-report-info-row">
                    <div className="sdx-report-info-item">
                      <strong>Reading Level:</strong> {currentIepData?.readingLevel || 'Not Assessed'}
                    </div>
                    <div className="sdx-report-info-item">
                      <strong>Last Assessment:</strong> {currentIepData?.updatedAt ? formatDate(currentIepData.updatedAt) : 'N/A'}
                    </div>
                  </div>
                </div>

                {/* Reading Level Progress Section */}
                <div className="sdx-report-section-title">Reading Level Progress</div>
                <div className="sdx-report-level-progress">
                  <div className="sdx-level-overall-summary">
                    <p className="sdx-level-overall-description">
                      {getStudentName()} is currently at the <strong>{currentIepData?.readingLevel || 'Not Assessed'}</strong> reading level
                      with an overall score of <strong>{currentIepData?.overallScore || 0}%</strong>.
                      {currentIepData?.readingLevel && currentIepData.readingLevel !== 'Not Assessed' ?
                        ` This level indicates good progress in fundamental reading skills and comprehension abilities.` :
                        ' An assessment is needed to determine the appropriate reading level.'}
                    </p>
                  </div>
                </div>

                {/* IEP Progress Table */}
                <div className="sdx-report-section-title">Learning Progress</div>
                <div className="sdx-report-progress-table">
                  <table className="sdx-report-table">
                    <thead>
                      <tr>
                        <th className="sdx-report-th">Lesson</th>
                        <th className="sdx-report-th">Status</th>
                        <th className="sdx-report-th">Score</th>
                        <th className="sdx-report-th" colSpan="3">Support Level</th>
                        <th className="sdx-report-th">Remarks</th>
                      </tr>
                      <tr>
                        <th className="sdx-report-th-empty"></th>
                        <th className="sdx-report-th-empty"></th>
                        <th className="sdx-report-th-empty"></th>
                        <th className="sdx-report-th-level">Minimal</th>
                        <th className="sdx-report-th-level">Moderate</th>
                        <th className="sdx-report-th-level">Extensive</th>
                        <th className="sdx-report-th-empty"></th>
                      </tr>
                    </thead>
                    <tbody>
                      {currentIepData && currentIepData.objectives && currentIepData.objectives.length > 0 ? (
                        currentIepData.objectives.map((objective, index) => (
                          <tr key={index} className="sdx-report-tr">
                            <td className="sdx-report-td sdx-report-td-aralin">
                              <div>
                                <div>{getCategoryName(objective.lesson)}</div>
                                <div style={{ fontSize: '0.8rem', color: '#666' }}>
                                  {objective.categoryName || getCategoryName(objective.lesson)}
                                </div>
                              </div>
                            </td>
                            <td className="sdx-report-td sdx-report-td-status">
                              <span className={`sdx-status-badge ${(objective.isPassed || objective.latestInterventionPassed) ? 'status-completed' : objective.hasIntervention ? 'status-in_progress' : 'status-not_started'}`}>
                                {(objective.isPassed || objective.latestInterventionPassed) ? 'Completed' : objective.hasIntervention ? 'In Progress' : 'Not Started'}
                              </span>
                            </td>
                            <td className="sdx-report-td sdx-report-td-score">
                              <div className="sdx-score-container">
                                <span className={`sdx-score ${(objective.latestInterventionScore || objective.assessmentScore || objective.score || 0) >= 75 ? 'passing' : 'failing'}`}>
                                  {objective.latestInterventionScore || objective.assessmentScore || objective.score || 0}%
                                </span>
                                {objective.hasIntervention && objective.latestInterventionScore && (
                                  <div style={{ fontSize: '0.8rem', marginTop: '2px', color: '#666' }}>
                                    Assessment: {objective.assessmentScore || objective.score || 0}%
                                  </div>
                                )}
                              </div>
                            </td>
                            <td className="sdx-report-td sdx-report-td-support">
                              {objective.supportLevel === 'minimal' ? "✓" : ""}
                            </td>
                            <td className="sdx-report-td sdx-report-td-support">
                              {objective.supportLevel === 'moderate' ? "✓" : ""}
                            </td>
                            <td className="sdx-report-td sdx-report-td-support">
                              {objective.supportLevel === 'extensive' ? "✓" : ""}
                            </td>
                            <td className="sdx-report-td sdx-report-td-puna">
                              <div>
                                {objective.remarks || objective.mainAssessmentRemarks ? (
                                  <span>{objective.remarks || objective.mainAssessmentRemarks}</span>
                                ) : (
                                  <span className="sdx-no-remarks">No remarks added</span>
                                )}
                                {objective.hasIntervention && (
                                  <div style={{ marginTop: '0.5rem', fontSize: '0.8rem', fontStyle: 'italic', color: '#ff6b00' }}>
                                    Intervention: {objective.interventionAttempts || 0} attempt{(objective.interventionAttempts || 0) !== 1 ? 's' : ''}
                                    {objective.latestInterventionPassed && ' - Completed successfully'}
                                  </div>
                                )}
                              </div>
                            </td>
                          </tr>
                        ))
                      ) : (
                        <tr className="sdx-report-tr">
                          <td colSpan="7" className="sdx-report-td-empty">
                            No learning activities recorded yet.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>

                {/* IEP Summary Section */}
                {currentIepData && currentIepData.objectives && currentIepData.objectives.length > 0 && (
                  <div className="sdx-iep-summary-section">
                    <div className="sdx-report-section-title">IEP Summary</div>
                    <div className="sdx-iep-summary-details">
                      <div className="sdx-iep-detail">
                        <span className="sdx-iep-label">Academic Year:</span>
                        <span className="sdx-iep-value">{currentIepData.academicYear || new Date().getFullYear()}</span>
                      </div>
                      <div className="sdx-iep-detail">
                        <span className="sdx-iep-label">Overall Score:</span>
                        <span className="sdx-iep-value">{currentIepData.overallScore || 0}%</span>
                      </div>
                      <div className="sdx-iep-detail">
                        <span className="sdx-iep-label">Reading Level:</span>
                        <span className="sdx-iep-value">{currentIepData.readingLevel || 'Not Assessed'}</span>
                      </div>
                      <div className="sdx-iep-detail">
                        <span className="sdx-iep-label">Active Interventions:</span>
                        <span className="sdx-iep-value">
                          {currentIepData.objectives ?
                            currentIepData.objectives.filter(obj => obj.hasIntervention).length : 0}
                          of {currentIepData.objectives ? currentIepData.objectives.length : 0}
                        </span>
                      </div>
                      <div className="sdx-iep-detail">
                        <span className="sdx-iep-label">Last Updated:</span>
                        <span className="sdx-iep-value">{formatDate(currentIepData.updatedAt)}</span>
                      </div>
                    </div>
                  </div>
                )}

                {/* Prescriptive Recommendations */}
                <div className="sdx-report-section-title">Prescriptive Recommendations</div>
                <div className="sdx-report-recommendations">
                  <ul className="sdx-report-rec-list">
                    <li className="sdx-report-rec-item">
                      Student continues to develop reading skills. {currentIepData?.objectives && currentIepData.objectives.some(obj => !obj.isPassed && !obj.latestInterventionPassed) ? 'May need additional practice and support to improve reading comprehension.' : 'Shows good progress across reading categories.'}
                    </li>
                    <li className="sdx-report-rec-item">
                      {currentIepData?.objectives && currentIepData.objectives.some(obj => obj.hasIntervention) ? 'Continue with current intervention strategies for categories showing improvement.' : 'Encourage practice with phonemic awareness activities at home to strengthen reading foundation.'}
                    </li>
                    <li className="sdx-report-rec-item">
                      Regular practice with guided reading will help improve fluency and comprehension. Monitor progress closely and adjust support levels as needed.
                    </li>
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
      )}

      {/* Success Dialog */}
      <SuccessDialog
        isOpen={showSuccessDialog}
        onClose={() => setShowSuccessDialog(false)}
        title="Success"
        message={successDialogData.message}
        submessage={successDialogData.submessage}
      />
    </div>
  );
};

export default IEPReport; 
