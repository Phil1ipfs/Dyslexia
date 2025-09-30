// src/pages/Teachers/TeacherDashboard.jsx
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, ReferenceLine, PieChart, Pie, Cell,
  BarChart, Bar, Legend
} from 'recharts';

// Import icons (replace with actual paths to your icons)
import studentsIcon from '../../assets/icons/Teachers/students.png';
import scoringIcon from '../../assets/icons/Teachers/students.png';
import pendingIcon from '../../assets/icons/Teachers/activitymanage.png';
import '../../css/Teachers/TeacherDashboard.css';

// Dashboard API Service
import DashboardApiService from '../../services/Teachers/DashboardApiService';
import { API_BASE_URL } from '../../config/apiConfig';

/**
 * TeacherDashboard Component
 * 
 * A dashboard for teachers to monitor student progress and reading levels
 * Fetches data from MongoDB through API endpoints
 */
const TeacherDashboard = () => {
  // Navigation hook
  const navigate = useNavigate();

  // State variables
  const [selectedReadingLevel, setSelectedReadingLevel] = useState('All Levels');
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [studentDetailOpen, setStudentDetailOpen] = useState(false);
  const [readingLevelDetailOpen, setReadingLevelDetailOpen] = useState(false);
  const [notificationCount, setNotificationCount] = useState(0);
  const [studentFilter, setStudentFilter] = useState('all');
  const [sectionFilter, setSectionFilter] = useState('all');

  const [interventionFilter, setInterventionFilter] = useState('all');
  const [selectedIntervention, setSelectedIntervention] = useState(null);
  const [interventionDetailOpen, setInterventionDetailOpen] = useState(false);

  // Data state variables
  const [students, setStudents] = useState([]);
  const [sections, setSections] = useState(['Sampaguita', 'Unity', 'Dignity']);
  const [readingLevelDistribution, setReadingLevelDistribution] = useState([]);
  const [studentsNeedingAttention, setStudentsNeedingAttention] = useState([]);
  const [studentsInSelectedLevel, setStudentsInSelectedLevel] = useState([]);
  const [interventionProgress, setInterventionProgress] = useState([]);
  const [categoryResultsData, setCategoryResultsData] = useState([]); // Add this to store raw category results
  const [metrics, setMetrics] = useState({
    totalStudents: 0,
    completionRate: 0,
    averageScore: 0,
    pendingEdits: 0
  });
  const [prescriptiveData, setPrescriptiveData] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [successMessage, setSuccessMessage] = useState('');

  // Error state for database connection issues
  const [error, setError] = useState(null);

  // Fetch dashboard data on component mount
  useEffect(() => {
    fetchDashboardData();
  }, []);

  // Show success message temporarily
  useEffect(() => {
    if (successMessage) {
      const timer = setTimeout(() => {
        setSuccessMessage('');
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [successMessage]);

  /**
   * Get authentication headers with token
   * @returns {Object} Headers with authorization token
   */
  const getAuthHeaders = () => {
    // Get token from user object stored by authService
    const user = JSON.parse(localStorage.getItem('user'));
    const token = user?.token;
    return {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    };
  };

  const openInterventionDetail = (intervention) => {
    // Calculate detailed intervention statistics from real data
    const calculateInterventionStats = (interventionData) => {
      const {
        totalAttempts = 0,
        latestScore = 0,
        originalScore = 0,
        totalQuestions = 0,
        interventionHistory = [],
        category = '',
        improvement = 0,
        improvementPercentage = 0
      } = interventionData;

      // Get latest attempt data from intervention history
      const latestAttempt = interventionHistory.length > 0
        ? interventionHistory[interventionHistory.length - 1]
        : null;

      const latestAttemptNumber = latestAttempt ? latestAttempt.attemptNumber : 1;
      const currentScore = latestAttempt ? latestAttempt.score : latestScore;
      const currentPassed = latestAttempt ? latestAttempt.isPassed : false;
      const currentRevisionNumber = latestAttempt ? (latestAttempt.revisionNumber || 1) : 1;

      // Calculate completion percentage based on pass status
      const completionPercentage = currentPassed ? 100 : Math.min((totalAttempts / 3) * 100, 100);

      // Determine correct status based on intervention completion
      let interventionStatus = 'In Progress';
      if (currentPassed && currentScore >= 75) {
        interventionStatus = 'Completed Successfully';
      } else if (totalAttempts > 0 && !currentPassed) {
        interventionStatus = 'Needs Teacher Revision';
      }

      // Get mastery data from intervention results (latest revision)
      const masteryGrowth = interventionData.masteryGrowth || 0;
      const currentMastery = interventionData.currentMastery || interventionData.masteryProbability || 0;

      return {
        ...interventionData,
        percentComplete: Math.round(completionPercentage),
        percentCorrect: Math.round(currentScore),
        completedActivities: interventionData.completedActivities || totalAttempts,
        totalActivities: interventionData.totalQuestions || totalQuestions,
        interventionPlanName: `${category} Intervention`,
        currentRevisionNumber: currentRevisionNumber,
        latestAttemptNumber: latestAttemptNumber,
        currentMastery: currentMastery,
        masteryGrowth: masteryGrowth,
        improvementFromOriginal: improvement,
        status: interventionStatus,
        passedThreshold: currentPassed,
        notes: `${totalAttempts} attempts completed. ${currentPassed ? 'PASSED' : 'FAILED'} (threshold: ${interventionData.latestAttemptData?.passThreshold || 75}%). ${improvement > 0 ? `Overall improvement: ${improvement}% from original score.` : 'No improvement data available.'}`,
        lastActivityDate: latestAttempt && latestAttempt.completedAt
          ? new Date(latestAttempt.completedAt).toLocaleDateString()
          : 'N/A'
      };
    };

    const enhancedIntervention = calculateInterventionStats(intervention);
    setSelectedIntervention(enhancedIntervention);
    setInterventionDetailOpen(true);
  };

  // Add this function to handle closing the dialog
  const closeInterventionDetail = () => {
    setInterventionDetailOpen(false);
    setSelectedIntervention(null);
  };

  // Add this computed value for filtered intervention progress
  const filteredInterventionProgress = interventionFilter === 'all'
    ? interventionProgress
    : interventionProgress.filter(progress =>
      progress.readingLevel === interventionFilter ||
      progress.studentReadingLevel === interventionFilter
    );



  /**
   * Get category performance data showing intervention needs per category
   * Uses real category results data from MongoDB to show students needing intervention
   * Based on reading level category assignments from CLAUDE.md
   * @param {string} filterLevel - Optional reading level to filter by
   */
  const getCategoryPerformanceData = (filterLevel = null) => {
    // Reading level category assignments from CLAUDE.md (STRICT)
    const readingLevelCategories = {
      "Low Emerging": ["Alphabet Knowledge"],
      "High Emerging": ["Alphabet Knowledge", "Phonological Awareness"],
      "Developing": ["Alphabet Knowledge", "Phonological Awareness", "Decoding"],
      "Transitioning": ["Alphabet Knowledge", "Phonological Awareness", "Decoding", "Word Recognition"],
      "At Grade Level": ["Alphabet Knowledge", "Phonological Awareness", "Decoding", "Word Recognition", "Reading Comprehension"],
      "Not Assessed": [] // Students who haven't completed assessment - no categories to show
    };

    // If no students data available, return empty array
    if (!students || students.length === 0) {
      return [];
    }

    // Get category results data from state (loaded from MongoDB)
    console.log('Raw category results data:', categoryResultsData);
    console.log('Students data:', students);

    // Group students by reading level
    const studentsByLevel = students.reduce((acc, student) => {
      const level = student.readingLevel;
      if (!acc[level]) {
        acc[level] = [];
      }
      acc[level].push(student);
      return acc;
    }, {});
    
    console.log('Students grouped by level:', studentsByLevel);

    // Get all available reading levels from the data
    const allReadingLevels = Object.keys(studentsByLevel);
    
    // Determine which reading levels to process
    const levelsToProcess = filterLevel ? [filterLevel] : allReadingLevels;

    // Process category performance for each reading level
    const performanceData = levelsToProcess.map(readingLevel => {
      const studentsInLevel = studentsByLevel[readingLevel] || [];

      if (studentsInLevel.length === 0) {
        return null; // Skip levels with no students
      }

      // Calculate intervention needs for categories relevant to this reading level
      const categoryData = {};

      // Get the categories that are relevant to this reading level
      const relevantCategories = readingLevelCategories[readingLevel] || [];

      relevantCategories.forEach(categoryName => {
        let totalStudentsInLevel = studentsInLevel.length; // Total students in this reading level
        let studentsNeedingIntervention = 0;
        let detailedInterventionData = []; // Store detailed intervention information

        console.log(`\n=== Processing category: ${categoryName} for reading level: ${readingLevel} ===`);
        console.log(`Total students in this level: ${totalStudentsInLevel}`);

        // Process each student's category results
        studentsInLevel.forEach((student, index) => {
          // Find category results for this student using idNumber
          const studentCategoryResult = categoryResultsData.find(cr =>
            cr.studentId === student.idNumber
          );

          console.log(`Student ${index + 1}/${totalStudentsInLevel}: ${student.idNumber} (${student.firstName} ${student.lastName})`, {
            foundCategoryResult: !!studentCategoryResult,
            studentId: student.idNumber,
            readingLevel: student.readingLevel
          });

          if (studentCategoryResult && studentCategoryResult.categories) {
            // Find the specific category result
            const categoryResult = studentCategoryResult.categories.find(cat =>
              cat.categoryName === categoryName
            );

            if (categoryResult && categoryResult.isCompleted === true) {
              console.log(`  ✓ ${categoryName}: score=${categoryResult.score}, isPassed=${categoryResult.isPassed}, completed=${categoryResult.isCompleted}`);
              
              // Check if student needs intervention based on comprehensive logic
              let needsIntervention = false;
              let interventionStatus = '';
              
              if (categoryResult.isPassed === false || categoryResult.score < 75) {
                // Student failed the category - now check intervention status
                if (!categoryResult.currentInterventionId || categoryResult.interventionHistory.length === 0) {
                  // No intervention assigned yet - NEEDS INTERVENTION
                  needsIntervention = true;
                  interventionStatus = 'No intervention assigned';
                } else {
                  // Has intervention - check if latest attempt passed
                  const latestAttempt = categoryResult.interventionHistory.reduce((latest, current) => {
                    return current.attemptNumber > latest.attemptNumber ? current : latest;
                  });
                  
                  if (latestAttempt.isPassed === false) {
                    // Latest intervention attempt failed - STILL NEEDS INTERVENTION
                    needsIntervention = true;
                    interventionStatus = `Active intervention (attempt ${latestAttempt.attemptNumber})`;
                  } else {
                    // Latest intervention attempt passed - INTERVENTION COMPLETED
                    needsIntervention = false;
                    interventionStatus = `Intervention completed (attempt ${latestAttempt.attemptNumber})`;
                  }
                }
              } else {
                // Student passed the category - NO INTERVENTION NEEDED
                needsIntervention = false;
                interventionStatus = 'Passed assessment';
              }
              
              if (needsIntervention) {
                studentsNeedingIntervention++;
                console.log(`  ❌ Student needs intervention for ${categoryName}: ${interventionStatus}`);
                
                // Store detailed intervention information for tooltip
                detailedInterventionData.push({
                  studentName: `${student.firstName} ${student.lastName}`,
                  studentId: student.idNumber,
                  categoryName: categoryName,
                  assessmentScore: categoryResult.score,
                  interventionStatus: interventionStatus,
                  latestAttempt: categoryResult.interventionHistory.length > 0 ? 
                    categoryResult.interventionHistory.reduce((latest, current) => {
                      return current.attemptNumber > latest.attemptNumber ? current : latest;
                    }) : null
                });
              } else {
                console.log(`  ✅ Student does not need intervention for ${categoryName}: ${interventionStatus}`);
              }
            } else if (categoryResult) {
              console.log(`  ⚠️ ${categoryName}: not completed (completed=${categoryResult.isCompleted})`);
              // Student has category result but not completed - needs intervention
              studentsNeedingIntervention++;
              detailedInterventionData.push({
                studentName: `${student.firstName} ${student.lastName}`,
                studentId: student.idNumber,
                categoryName: categoryName,
                assessmentScore: 0,
                interventionStatus: 'Assessment Incomplete',
                latestAttempt: null
              });
            } else {
              console.log(`  ❌ ${categoryName}: no category result found`);
              // Student has no category result - needs intervention
              studentsNeedingIntervention++;
              detailedInterventionData.push({
                studentName: `${student.firstName} ${student.lastName}`,
                studentId: student.idNumber,
                categoryName: categoryName,
                assessmentScore: 0,
                interventionStatus: 'No Assessment Data',
                latestAttempt: null
              });
            }
          } else {
            console.log(`  ❌ No category results found for student ${student.idNumber}`);
            // Student has no category results at all - needs intervention
            studentsNeedingIntervention++;
            detailedInterventionData.push({
              studentName: `${student.firstName} ${student.lastName}`,
              studentId: student.idNumber,
              categoryName: categoryName,
              assessmentScore: 0,
              interventionStatus: 'No Assessment Data',
              latestAttempt: null
            });
          }
        });

        // Calculate percentage of students needing intervention for this category
        // Based on TOTAL students in the reading level, not just students with assessment data
        const interventionPercentage = totalStudentsInLevel > 0 ?
          Math.round((studentsNeedingIntervention / totalStudentsInLevel) * 100) : 0;

        console.log(`\n📊 FINAL RESULT for ${categoryName}:`);
        console.log(`   Category name (raw): "${categoryName}"`);
        console.log(`   Category name (length): ${categoryName.length}`);
        console.log(`   Category name (char codes):`, Array.from(categoryName).map(c => c.charCodeAt(0)));
        console.log(`   Total students in level: ${totalStudentsInLevel}`);
        console.log(`   Students needing intervention: ${studentsNeedingIntervention}`);
        console.log(`   Intervention percentage: ${interventionPercentage}%`);
        console.log(`   Detailed intervention data:`, detailedInterventionData);
        
        // Debug: Show which students are being counted
        if (detailedInterventionData.length > 0) {
          console.log(`   Students needing intervention:`, detailedInterventionData.map(s => `${s.studentName} (${s.interventionStatus})`));
        } else {
          console.log(`   No students need intervention for ${categoryName} in ${readingLevel}`);
        }
        
        // Store both percentage and detailed intervention data
        // Keep original category name to avoid data structure issues
        categoryData[categoryName] = {
          percentage: interventionPercentage,
          detailedData: detailedInterventionData
        };
      });

      const levelData = {
        readingLevel,
        studentCount: studentsInLevel.length,
        ...categoryData
      };
      
      console.log(`Final data for ${readingLevel}:`, levelData);
      return levelData;
    }).filter(data => data !== null); // Remove null entries for levels with no students

    console.log('Category Performance Data (Intervention Needs):', performanceData);
    return performanceData;
  };

  /**
   * Validate if a student should have progressed to the next reading level
   * Returns progression status and any issues found
   */
  const validateReadingLevelProgression = (student, studentCategoryResult, requiredCategories) => {
    if (!studentCategoryResult || !studentCategoryResult.categories) {
      return {
        shouldHaveProgressed: false,
        reason: 'No category results available'
      };
    }

    // Define reading level progression sequence
    const READING_LEVEL_PROGRESSION = {
      'Low Emerging': 'High Emerging',
      'High Emerging': 'Developing',
      'Developing': 'Transitioning',
      'Transitioning': 'At Grade Level',
      'At Grade Level': null // Maximum level
    };

    // Check if all required categories for current level are passed
    const passedCategories = requiredCategories.filter(requiredCategory => {
      const categoryResult = studentCategoryResult.categories.find(cat =>
        cat.categoryName === requiredCategory
      );
      return categoryResult && categoryResult.isPassed === true && categoryResult.score >= 75;
    });

    const allCategoriesPassed = passedCategories.length === requiredCategories.length;
    const nextLevel = READING_LEVEL_PROGRESSION[student.readingLevel];

    // If all categories passed and there's a next level, student should have progressed
    if (allCategoriesPassed && nextLevel) {
      return {
        shouldHaveProgressed: true,
        currentLevel: student.readingLevel,
        nextLevel: nextLevel,
        passedCategories: passedCategories.length,
        requiredCategories: requiredCategories.length,
        reason: `All ${requiredCategories.length} categories passed - should progress to ${nextLevel}`
      };
    }

    // If at maximum level and all categories passed, mark as completed
    if (allCategoriesPassed && !nextLevel) {
      return {
        shouldHaveProgressed: false,
        isAtMaxLevel: true,
        isCompleted: true,
        reason: 'Student at maximum level (At Grade Level) with all categories passed'
      };
    }

    return {
      shouldHaveProgressed: false,
      reason: `${passedCategories.length}/${requiredCategories.length} categories passed`
    };
  };

  /**
   * Calculate which students need attention based on failed categories and reading level requirements
   * A student needs attention if they have failed any required category for their reading level
   * This function processes real data from MongoDB with proper reading level validation
   */
  const calculateStudentsNeedingAttention = (studentsData, categoryResultsData = []) => {
    console.log('Processing category results data from MongoDB:', categoryResultsData.length, 'records');

    // Define required categories for each reading level based on CLAUDE.md
    const READING_LEVEL_CATEGORIES = {
      'Low Emerging': ['Alphabet Knowledge'],
      'High Emerging': ['Alphabet Knowledge', 'Phonological Awareness'],
      'Developing': ['Alphabet Knowledge', 'Phonological Awareness', 'Decoding'],
      'Transitioning': ['Alphabet Knowledge', 'Phonological Awareness', 'Decoding', 'Word Recognition'],
      'At Grade Level': ['Alphabet Knowledge', 'Phonological Awareness', 'Decoding', 'Word Recognition', 'Reading Comprehension']
    };

    const studentsNeedingAttention = [];

    studentsData.forEach(student => {
      // Find category results for this student using idNumber
      // Get ALL category results for this student and find the most recent one
      const allStudentCategoryResults = categoryResultsData.filter(cr =>
        cr.studentId === student.idNumber
      );

      // If multiple category results exist (due to reading level progression), use the most recent one
      const studentCategoryResult = allStudentCategoryResults.length > 0
        ? allStudentCategoryResults.reduce((latest, current) => {
            const latestDate = new Date(latest.assessmentDate);
            const currentDate = new Date(current.assessmentDate);
            return currentDate > latestDate ? current : latest;
          })
        : null;

      // Log if multiple records found (potential data consistency issue)
      if (allStudentCategoryResults.length > 1) {
        console.warn(`[DATA CONSISTENCY] Student ${student.idNumber} has ${allStudentCategoryResults.length} category results:`,
          allStudentCategoryResults.map(cr => ({
            readingLevel: cr.readingLevel,
            assessmentDate: cr.assessmentDate,
            categories: cr.categories?.map(cat => `${cat.categoryName}(${cat.score}%)`)
          }))
        );
      }

      console.log(`Processing student ${student.idNumber}:`, {
        firstName: student.firstName,
        lastName: student.lastName,
        readingLevel: student.readingLevel,
        foundCategoryResult: !!studentCategoryResult,
        categoryResultsCount: allStudentCategoryResults.length
      });

      const studentName = `${student.firstName || 'Student'} ${student.middleName ? student.middleName + ' ' : ''}${student.lastName || 'Name'}`;

      // Validate reading level consistency between users table and most recent category results
      let currentReadingLevel = student.readingLevel;
      if (studentCategoryResult && studentCategoryResult.readingLevel &&
          studentCategoryResult.readingLevel !== student.readingLevel) {
        console.warn(`[READING LEVEL MISMATCH] Student ${student.idNumber} (${studentName}):`, {
          userTableLevel: student.readingLevel,
          mostRecentAssessmentLevel: studentCategoryResult.readingLevel,
          assessmentDate: studentCategoryResult.assessmentDate
        });
        // Use the reading level from the most recent category result for consistency
        currentReadingLevel = studentCategoryResult.readingLevel;
      }

      // Get required categories for the current reading level (use most recent assessment level)
      const requiredCategories = READING_LEVEL_CATEGORIES[currentReadingLevel] || [];

      if (!studentCategoryResult || !studentCategoryResult.categories) {
        // No category results found - student needs assessment
        studentsNeedingAttention.push({
          ...student,
          id: student.idNumber,
          name: studentName,
          readingLevel: 'Not Assessed', // Set to "Not Assessed" for students without assessment data
          failedCategories: ['Assessment needed'],
          categoriesNeedingImprovement: [{
            category: 'Assessment',
            score: 0,
            status: 'Not Assessed',
            interventionRequired: false,
            interventionCompleted: false
          }],
          reason: 'Needs initial assessment',
          dataConsistency: {
            userTableReadingLevel: student.readingLevel,
            assessmentReadingLevel: null,
            hasMultipleRecords: allStudentCategoryResults.length > 1,
            mostRecentAssessmentDate: null
          }
        });
        return;
      }

      const failedCategories = [];
      const categoriesNeedingImprovement = [];

      // Check each REQUIRED category for this reading level
      requiredCategories.forEach(requiredCategory => {
        // Find the category result for this required category
        const categoryResult = studentCategoryResult.categories.find(cat =>
          cat.categoryName === requiredCategory
        );

        if (!categoryResult) {
          // Required category not found - needs assessment
          failedCategories.push(requiredCategory);
          categoriesNeedingImprovement.push({
            category: requiredCategory,
            score: 0,
            status: 'Not Assessed',
            interventionRequired: false,
            interventionCompleted: false
          });
          return;
        }

        // Check if category failed (score < 75% or isPassed = false)
        const hasFailed = categoryResult.isPassed === false || categoryResult.score < 75;
        
        // Comprehensive intervention validation logic (same as chart)
        let needsIntervention = false;
        let interventionStatus = '';
        let shouldShowInAttentionList = false;
        let latestAttemptInfo = null;
        
        if (hasFailed) {
          // Student failed the category - now check intervention status
          if (!categoryResult.currentInterventionId || categoryResult.interventionHistory.length === 0) {
            // No intervention assigned yet - NEEDS INTERVENTION
            needsIntervention = true;
            interventionStatus = 'No intervention assigned';
            shouldShowInAttentionList = true;
          } else {
            // Has intervention - check if latest attempt passed
            const latestAttempt = categoryResult.interventionHistory.reduce((latest, current) => {
              return current.attemptNumber > latest.attemptNumber ? current : latest;
            });
            
            latestAttemptInfo = latestAttempt; // Store for detailed display
            
            if (latestAttempt.isPassed === false) {
              // Latest intervention attempt failed - STILL NEEDS INTERVENTION
              needsIntervention = true;
              interventionStatus = `Active intervention (attempt ${latestAttempt.attemptNumber}, score: ${latestAttempt.score}%)`;
              shouldShowInAttentionList = true;
            } else {
              // Latest intervention attempt passed - INTERVENTION COMPLETED
              needsIntervention = false;
              interventionStatus = `Intervention completed (attempt ${latestAttempt.attemptNumber}, score: ${latestAttempt.score}%)`;
              shouldShowInAttentionList = false; // Don't show in attention list
            }
          }
        } else {
          // Student passed the category - NO INTERVENTION NEEDED
          needsIntervention = false;
          interventionStatus = 'Passed assessment';
          shouldShowInAttentionList = false;
        }

        // Student needs attention if:
        // 1. Category failed AND still needs intervention (no intervention assigned or active intervention), OR
        // 2. Category not completed yet
        if ((hasFailed && shouldShowInAttentionList) || !categoryResult.isCompleted) {
          failedCategories.push(categoryResult.categoryName);

          // Determine status based on comprehensive intervention validation
          let status = 'Assessment Failed';
          if (!categoryResult.isCompleted) {
            status = 'Assessment Incomplete';
          } else if (needsIntervention && interventionStatus === 'No intervention assigned') {
            status = 'Intervention Required';
          } else if (needsIntervention && interventionStatus.includes('Active intervention')) {
            // Include attempt number and score in the status
            status = `Active Intervention (Attempt ${latestAttemptInfo.attemptNumber}, Score: ${latestAttemptInfo.score}%)`;
          } else if (!needsIntervention && interventionStatus.includes('Intervention completed')) {
            // Include attempt number and score in the status
            status = `Intervention Completed (Attempt ${latestAttemptInfo.attemptNumber}, Score: ${latestAttemptInfo.score}%)`;
          }

          categoriesNeedingImprovement.push({
            category: categoryResult.categoryName,
            score: Math.round(categoryResult.score || 0),
            status: status,
            interventionRequired: needsIntervention,
            interventionCompleted: !needsIntervention && interventionStatus.includes('Intervention completed'),
            isCompleted: categoryResult.isCompleted || false,
            interventionStatus: interventionStatus // Add detailed intervention status for debugging
          });
        }
      });

      // Check for reading level progression blocking
      const passedCategories = requiredCategories.filter(requiredCategory => {
        const categoryResult = studentCategoryResult.categories.find(cat =>
          cat.categoryName === requiredCategory
        );
        return categoryResult && categoryResult.isPassed === true && categoryResult.score >= 75;
      });

      // Validate reading level progression (use corrected student data)
      const studentWithCorrectedLevel = { ...student, readingLevel: currentReadingLevel };
      const progressionValidation = validateReadingLevelProgression(studentWithCorrectedLevel, studentCategoryResult, requiredCategories);

      // If student has any failed categories or progression issues, they need attention
      if (failedCategories.length > 0 || progressionValidation.shouldHaveProgressed) {
        // Handle progression issues for students who should have progressed
        if (progressionValidation.shouldHaveProgressed && failedCategories.length === 0) {
          // Student passed all categories but hasn't progressed - add progression issue
          failedCategories.push('Progression Required');
          categoriesNeedingImprovement.push({
            category: 'Reading Level Progression',
            score: 100, // All categories passed
            status: 'Progression Required',
            interventionRequired: false,
            interventionCompleted: true, // Categories are complete
            isCompleted: true,
            progressionIssue: true
          });
        }

        studentsNeedingAttention.push({
          ...student,
          id: student.idNumber,
          name: studentName,
          readingLevel: currentReadingLevel, // Use the corrected reading level for consistency
          failedCategories,
          categoriesNeedingImprovement,
          // Calculate attention reason based on issue type
          reason: progressionValidation.shouldHaveProgressed && failedCategories.includes('Progression Required') ?
            `Ready for progression to ${progressionValidation.nextLevel}` :
            failedCategories.length === 1 ?
            `Failed ${failedCategories[0]}` :
              `Failed ${failedCategories.length}/${requiredCategories.length} required categories`,
          // Add comprehensive progression info
          progressionInfo: {
            requiredCategories: requiredCategories.length,
            passedCategories: passedCategories.length,
            failedCategories: failedCategories.length,
            canProgress: passedCategories.length === requiredCategories.length,
            shouldHaveProgressed: progressionValidation.shouldHaveProgressed,
            currentLevel: currentReadingLevel,
            nextLevel: progressionValidation.nextLevel,
            progressionReason: progressionValidation.reason
          },
          // Add data consistency info for debugging
          dataConsistency: {
            userTableReadingLevel: student.readingLevel,
            assessmentReadingLevel: studentCategoryResult?.readingLevel || null,
            hasMultipleRecords: allStudentCategoryResults.length > 1,
            mostRecentAssessmentDate: studentCategoryResult?.assessmentDate || null
          }
        });

        console.log(`Added student to attention list:`, {
          name: studentName,
          userTableReadingLevel: student.readingLevel,
          correctedReadingLevel: currentReadingLevel,
          requiredCategories,
          failedCategories,
          progressionBlocked: passedCategories.length < requiredCategories.length,
          shouldHaveProgressed: progressionValidation.shouldHaveProgressed,
          progressionReason: progressionValidation.reason,
          hasMultipleRecords: allStudentCategoryResults.length > 1
        });
      } else {
        console.log(`Student ${studentName} does not need attention:`, {
          userTableReadingLevel: student.readingLevel,
          correctedReadingLevel: currentReadingLevel,
          passedCategories: passedCategories.length,
          requiredCategories: requiredCategories.length,
          allPassed: passedCategories.length === requiredCategories.length,
          progressionStatus: progressionValidation.reason,
          isAtMaxLevel: progressionValidation.isAtMaxLevel || false,
          hasMultipleRecords: allStudentCategoryResults.length > 1
        });
      }
    });

    console.log(`Total students needing attention: ${studentsNeedingAttention.length}`);
    console.log('[STUDENTS NEEDING ATTENTION SUMMARY]', {
      totalStudents: studentsData.length,
      studentsWithCategoryResults: studentsData.filter(s => categoryResultsData.find(cr => cr.studentId === s.idNumber)).length,
      studentsNeedingAttention: studentsNeedingAttention.length,
      readingLevelBreakdown: studentsNeedingAttention.reduce((acc, student) => {
        acc[student.readingLevel] = (acc[student.readingLevel] || 0) + 1;
        return acc;
      }, {}),
      sectionBreakdown: studentsNeedingAttention.reduce((acc, student) => {
        acc[student.section] = (acc[student.section] || 0) + 1;
        return acc;
      }, {})
    });
    return studentsNeedingAttention;
  };

  /**
   * Calculate active interventions based on category results data
   * An intervention is considered active if:
   * 1. Student has a currentInterventionId
   * 2. Their latest intervention attempt in interventionHistory has isPassed: false
   */
  const calculateActiveInterventions = (categoryResultsData = []) => {
    console.log('Calculating active interventions from category results:', categoryResultsData.length, 'records');
    
    const activeInterventions = [];
    
    categoryResultsData.forEach(categoryResult => {
      if (!categoryResult.categories) return;
      
      categoryResult.categories.forEach(category => {
        // Check if this category has an active intervention
        if (category.currentInterventionId && category.interventionHistory && category.interventionHistory.length > 0) {
          // Get the latest intervention attempt (highest attemptNumber)
          const latestAttempt = category.interventionHistory.reduce((latest, current) => {
            return current.attemptNumber > latest.attemptNumber ? current : latest;
          });
          
          // If the latest attempt failed (isPassed: false), the intervention is still active
          if (latestAttempt.isPassed === false) {
            activeInterventions.push({
              studentId: categoryResult.studentId,
              categoryName: category.categoryName,
              currentInterventionId: category.currentInterventionId,
              latestAttempt: latestAttempt,
              interventionAttempts: category.interventionAttempts,
              assessmentDate: categoryResult.assessmentDate
            });
            
            console.log(`Active intervention found:`, {
              studentId: categoryResult.studentId,
              category: category.categoryName,
              attemptNumber: latestAttempt.attemptNumber,
              score: latestAttempt.score,
              isPassed: latestAttempt.isPassed,
              attemptedAt: latestAttempt.attemptedAt
            });
          }
        }
      });
    });
    
    console.log(`Total active interventions: ${activeInterventions.length}`);
    return activeInterventions;
  };

  /**
   * Main function to fetch all dashboard data from MongoDB
   */
  const fetchDashboardData = async () => {
    setIsLoading(true);
    setError(null);

    try {
      console.log('Fetching dashboard data from MongoDB...');

      // Fetch students data from MongoDB
      let usersData = [];
      try {
        const usersResponse = await fetch(`${API_BASE_URL}/admin/manage/students`, getAuthHeaders());
        if (usersResponse.ok) {
          const responseData = await usersResponse.json();
          usersData = responseData.data || responseData; // Handle different response formats
          console.log('Loaded students data from MongoDB:', usersData.length, 'records');
        } else {
          throw new Error(`Failed to fetch students: ${usersResponse.status}`);
        }
      } catch (error) {
        console.error('Could not load students data from MongoDB:', error);
        throw new Error('Failed to fetch students data from database');
      }

      // Fetch category results data from MongoDB
      let categoryResultsData = [];
      try {
        const categoryResultsResponse = await fetch(`${API_BASE_URL}/admin/category-results`, getAuthHeaders());
        if (categoryResultsResponse.ok) {
          const responseData = await categoryResultsResponse.json();
          categoryResultsData = responseData.data || responseData; // Handle different response formats
          console.log('Loaded category results data from MongoDB:', categoryResultsData.length, 'records');
        } else {
          console.warn('Could not load category results from MongoDB, continuing without them');
          categoryResultsData = [];
        }
      } catch (error) {
        console.warn('Could not load category results from MongoDB:', error);
        categoryResultsData = [];
      }

      console.log('Successfully loaded data from MongoDB');

      // Set students data - ensure it's properly formatted for category-based attention
      const students = usersData || [];
      console.log('Raw students data from MongoDB:', students.slice(0, 2)); // Debug first 2 students
      setStudents(students);

      // Calculate reading level distribution from MongoDB data
      const levelCounts = {};
      usersData.forEach(student => {
        const level = sanitizeData(student.readingLevel, 'readingLevel');
        levelCounts[level] = (levelCounts[level] || 0) + 1;
      });

      const testReadingLevelDistribution = Object.entries(levelCounts).map(([level, count]) => ({
        name: level,
        value: count,
        level: level,
        count: count,
        percentage: Math.round((count / usersData.length) * 100),
        color: getReadingLevelColor(level)
      }));

      setReadingLevelDistribution(testReadingLevelDistribution);

      // Store category results data in state for chart processing
      setCategoryResultsData(categoryResultsData);
      console.log('Category results data loaded from MongoDB:', categoryResultsData.length);

      // Merge students with their category results and overall scores
      const studentsWithCategoryData = students.map(student => {
        const categoryResult = categoryResultsData.find(cr =>
          cr.studentId === student.idNumber || cr.studentId === student.id
        );

        return {
          ...student,
          // Use overallScore from category results if available, fallback to readingPercentage
          lastScore: categoryResult ? categoryResult.overallScore : (student.readingPercentage || 0),
          categoryResult: categoryResult // Attach category result for processing
        };
      });

      console.log('Students with category data:', studentsWithCategoryData.slice(0, 2));

      // Set students needing attention - calculate based on category failures
      const studentsNeedingAttention = calculateStudentsNeedingAttention(studentsWithCategoryData, categoryResultsData);
      setStudentsNeedingAttention(studentsNeedingAttention);

      console.log(`Found ${studentsNeedingAttention.length} students needing attention based on category failures`);
      console.log('Students needing attention:', studentsNeedingAttention.map(s => ({
        name: s.name,
        readingLevel: s.readingLevel,
        failedCategories: s.failedCategories,
        categoriesNeedingImprovement: s.categoriesNeedingImprovement
      })));

      // Set dashboard metrics using MongoDB data
      const testMetrics = {
        totalStudents: students.length,
        studentsNeedingAttention: studentsNeedingAttention.length,
        completionRate: Math.round(((students.length - studentsNeedingAttention.length) / students.length) * 100) || 0,
        averageScore: 0, // Could be calculated from category results if needed
        pendingEdits: studentsNeedingAttention.length
      };
      setMetrics(testMetrics);

      // Set sections from MongoDB data
      const sectionCounts = {};
      usersData.forEach(student => {
        const section = student.section || 'Unassigned';
        sectionCounts[section] = (sectionCounts[section] || 0) + 1;
      });

      const availableSections = Object.keys(sectionCounts);
      setSections(availableSections);

      // Fetch comprehensive intervention progress from new API endpoint
      try {
        console.log('Fetching comprehensive intervention progress data...');
        const interventionResponse = await fetch('/api/teachers/dashboard/intervention-progress', {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          }
        });

        if (interventionResponse.ok) {
          const comprehensiveInterventionData = await interventionResponse.json();
          console.log('Comprehensive intervention data received:', comprehensiveInterventionData.length, 'records');
          setInterventionProgress(comprehensiveInterventionData);
        } else {
          console.warn('Failed to fetch intervention progress, using fallback');
          // Fallback to old method if new endpoint fails
          const activeInterventions = calculateActiveInterventions(categoryResultsData);
          setInterventionProgress(activeInterventions);
        }
      } catch (interventionError) {
        console.error('Error fetching intervention progress:', interventionError);
        // Fallback to old method if new endpoint fails
        const activeInterventions = calculateActiveInterventions(categoryResultsData);
        setInterventionProgress(activeInterventions);
      }

      // Set notification count based on students needing attention
      setNotificationCount(studentsNeedingAttention.length);


      // Set prescriptive analytics from MongoDB data
      setPrescriptiveData([]);

      // Set initial selected reading level
      if (testReadingLevelDistribution && testReadingLevelDistribution.length > 0) {
        const initialLevel = testReadingLevelDistribution[0].name;
        setSelectedReadingLevel(initialLevel);

        // Set students in selected level - use processed studentsNeedingAttention to get proper data structure
        const allProcessedStudents = [...studentsNeedingAttention, ...studentsWithCategoryData.filter(s => !studentsNeedingAttention.find(na => na.id === s.idNumber))];
        const studentsInLevel = allProcessedStudents.filter(student => {
          if (initialLevel === 'Not Assessed') {
            // For "Not Assessed", include students with null, undefined, or "Not Assessed" reading level
            return !student.readingLevel || student.readingLevel === 'Not Assessed';
          }
          return student.readingLevel === initialLevel;
        }).map(student => ({
          ...student,
          id: student.id || student.idNumber, // Ensure id field is set
          name: student.name || `${student.firstName} ${student.lastName}`, // Ensure name field is set
        }));
        setStudentsInSelectedLevel(studentsInLevel);
      }

      console.log('Dashboard data successfully loaded and processed from MongoDB');

    } catch (error) {
      console.error("Error fetching dashboard data:", error);

      // Set comprehensive error state
      setError({
        message: error.message || 'Failed to fetch dashboard data',
        type: 'DATABASE_ERROR',
        details: error.message.includes('Network Error') ? 'Unable to connect to database server' :
                error.message.includes('API Error') ? 'Database returned an error' :
                'An unexpected error occurred while loading dashboard data'
      });

      // Set empty states to prevent crashes
      setStudents([]);
      setStudentsNeedingAttention([]);
      setReadingLevelDistribution([]);
      setMetrics({
        totalStudents: 0,
        completionRate: 0,
        averageScore: 0,
        pendingEdits: 0
      });
      setSections([]);
      setInterventionProgress([]);
      setNotificationCount(0);
      setPrescriptiveData([]);

    } finally {
      setIsLoading(false);
    }
  };

  // UI event handlers
  /**
   * Toggle dropdown for reading level selection
   */
  const toggleDropdown = () => setIsDropdownOpen(!isDropdownOpen);

  /**
   * Select a reading level for progress chart
   * @param {string} level - Reading level to select
   */
  const selectReadingLevel = (level) => {
    setSelectedReadingLevel(level);
    setIsDropdownOpen(false);

    // Update students in selected level - use processed students to get proper data structure
    const allProcessedStudents = [...studentsNeedingAttention, ...students.filter(s => !studentsNeedingAttention.find(na => na.id === s.idNumber))];
    setStudentsInSelectedLevel(allProcessedStudents.filter(s => {
      if (level === 'Not Assessed') {
        // For "Not Assessed", include students with null, undefined, or "Not Assessed" reading level
        return !s.readingLevel || s.readingLevel === 'Not Assessed';
      }
      return s.readingLevel === level;
    }).map(student => ({
      ...student,
      id: student.id || student.idNumber, // Ensure id field is set
      name: student.name || `${student.firstName} ${student.lastName}`, // Ensure name field is set
    })));
  };


  /**
   * Open reading level detail modal when pie chart segment is clicked
   * @param {Object} entry - Pie chart data entry that was clicked
   */
  const handleReadingLevelPieClick = (entry) => {
    setSelectedReadingLevel(entry.name);
    // Update students in selected level - use processed students to get proper data structure
    const allProcessedStudents = [...studentsNeedingAttention, ...students.filter(s => !studentsNeedingAttention.find(na => na.id === s.idNumber))];
    setStudentsInSelectedLevel(allProcessedStudents.filter(s => {
      if (entry.name === 'Not Assessed') {
        // For "Not Assessed", include students with null, undefined, or "Not Assessed" reading level
        return !s.readingLevel || s.readingLevel === 'Not Assessed';
      }
      return s.readingLevel === entry.name;
    }).map(student => ({
      ...student,
      id: student.id || student.idNumber, // Ensure id field is set
      name: student.name || `${student.firstName} ${student.lastName}`, // Ensure name field is set
    })));
    setReadingLevelDetailOpen(true);
  };

  /**
   * Close reading level detail modal
   */
  const closeReadingLevelModal = () => {
    setReadingLevelDetailOpen(false);
  };

  /**
   * Open student detail modal
   * @param {Object} student - Student object to view
   */
  const openStudentDetail = async (student) => {
    setSelectedStudent(student);
    setStudentDetailOpen(true);

    // if this student has a parentId, go fetch their profile
    if (student.parentId) {
      try {
        const parentInfo = await DashboardApiService.getParentProfile(
          student.parentId,
          getAuthHeaders()
        );
        // merge the real parent name & address into state
        setSelectedStudent(s => ({
          ...s,
          parentName: parentInfo.name || s.parentName,
          address: parentInfo.address || s.address
        }));
      } catch (err) {
        console.warn('Could not load parent info', err);
      }
    }
  };

  /**
   * Close student detail modal
   */
  const closeStudentDetail = () => {
    setStudentDetailOpen(false);
    setSelectedStudent(null);
  };

  /**
   * Filter students by reading level
   * @param {string} filter - Reading level filter value
   */
  const handleReadingLevelFilter = (filter) => {
    setStudentFilter(filter);
  };

  /**
   * Filter students by section
   * @param {string} section - Section filter value
   */
  const handleSectionFilter = (section) => {
    setSectionFilter(section);
  };

  /**
   * Navigate to student progress page
   * @param {Object} student - Student to view
   */
  const viewStudentDetails = (student) => {
    if (studentDetailOpen) {
      closeStudentDetail();
    }
    navigate(`/teacher/student-progress/${student.id}`);
  };

  /**
   * Sanitize data to prevent unrelated terms from appearing
   * @param {string} value - Value to sanitize
   * @param {string} type - Type of data (readingLevel, section, name, etc.)
   * @returns {string} Sanitized value
   */
  const sanitizeData = (value, type = 'general') => {
    if (!value || value === null || value === undefined) {
      switch (type) {
        case 'readingLevel':
          return 'Not Assessed';
        case 'section':
          return 'Unassigned';
        case 'name':
          return 'Student Name';
        case 'category':
          return 'Assessment Needed';
        default:
          return 'Not Available';
      }
    }

    // List of unrelated terms to replace
    const unrelatedTerms = {
      'undefined': 'Not Assessed',
      'unknown': 'Not Available',
      'null': 'Not Available',
      'n/a': 'Not Available',
      'na': 'Not Available',
      'tbd': 'To Be Determined',
      'tba': 'To Be Announced',
      'pending': 'In Progress',
      'incomplete': 'In Progress'
    };

    const lowerValue = value.toLowerCase().trim();
    return unrelatedTerms[lowerValue] || value;
  };

  // Helper function to ensure proper text rendering
  const getSafeCategoryName = (name) => {
    const categoryMap = {
      'Alphabet Knowledge': 'Alphabet Knowledge',
      'Phonological Awareness': 'Phonological Awareness',
      'Decoding': 'Decoding', 
      'Word Recognition': 'Word Recognition',
      'Reading Comprehension': 'Reading Comprehension'
    };
    return categoryMap[name] || name;
  };

  /**
   * Get color for a reading level
   * @param {string} level - Reading level
   * @returns {string} HEX color code
   */
  const getReadingLevelColor = (level) => {
    const colors = {
      'Low Emerging': '#FF6B8A',
      'High Emerging': '#FF9E40',
      'Transitioning': '#e6c229',
      'Developing': '#4BC0C0',
      'At Grade Level': '#3D9970',
      'Not Assessed': '#B0B0B0'
    };
    return colors[level] || '#B0B0B0';
  };


  // Filter students based on selected filters
  const filteredStudents = studentFilter === 'all'
    ? studentsNeedingAttention
    : studentsNeedingAttention.filter(student => student.readingLevel === studentFilter);

  // Further filter by section if needed
  const sectionFilteredStudents = sectionFilter === 'all'
    ? filteredStudents
    : filteredStudents.filter(student => student.section === sectionFilter);

  // Debug logging for filtering issues
  console.log('[DASHBOARD FILTER DEBUG]', {
    studentFilter,
    sectionFilter,
    totalStudentsNeedingAttention: studentsNeedingAttention.length,
    afterReadingLevelFilter: filteredStudents.length,
    afterSectionFilter: sectionFilteredStudents.length,
    studentsNeedingAttentionSample: studentsNeedingAttention.slice(0, 2).map(s => ({
      name: s.name,
      readingLevel: s.readingLevel,
      section: s.section,
      failedCategories: s.failedCategories
    })),
    sectionFilteredStudentsSample: sectionFilteredStudents.slice(0, 2).map(s => ({
      name: s.name,
      readingLevel: s.readingLevel,
      section: s.section,
      failedCategories: s.failedCategories
    }))
  });

  if (isLoading) {
    return (
      <div className="teacher-dashboard-loading">
        <div className="teacher-loading-spinner"></div>
        <p>Loading dashboard data...</p>
      </div>
    );
  }

  return (
    <div className="teacher-dashboard">
      {/* Database Error Display */}
      {error && (
        <div style={{
          backgroundColor: '#ff4444',
          color: 'white',
          padding: '1rem 1.5rem',
          margin: '0 0 2rem 0',
          borderRadius: '8px',
          border: '1px solid #cc0000',
          boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)'
        }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between'
          }}>
            <div>
              <h4 style={{ margin: '0 0 0.5rem 0', fontSize: '1.1rem', fontWeight: '600' }}>
                🚫 Database Connection Error
              </h4>
              <p style={{ margin: '0 0 0.5rem 0', fontSize: '0.95rem' }}>
                {error.details}
              </p>
              <p style={{ margin: '0', fontSize: '0.85rem', opacity: 0.9 }}>
                Please check your database connection or contact system administrator.
              </p>
            </div>
            <button
              style={{
                backgroundColor: 'rgba(255, 255, 255, 0.2)',
                border: '1px solid rgba(255, 255, 255, 0.3)',
                color: 'white',
                padding: '0.5rem 1rem',
                borderRadius: '4px',
                cursor: 'pointer',
                fontSize: '0.85rem',
                fontWeight: '500',
                transition: 'all 0.2s'
              }}
              onMouseOver={(e) => e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.3)'}
              onMouseOut={(e) => e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.2)'}
              onClick={() => {
                console.log('Retrying database connection...');
                fetchDashboardData();
              }}
            >
              Retry Connection
            </button>
          </div>
        </div>
      )}

      {/* Header with dashboard title and notification bell */}
      <main className="teacher-dashboard__content">
        <div className="teacher-dashboard__header">
          <div className="teacher-dashboard__title-wrapper">
            <h1 className="teacher-dashboard__title">Teacher Dashboard</h1>
            <p className="teacher-dashboard__subtitle">
              Monitor student reading levels, performance, and assign interventions effectively.
            </p>
          </div>
        </div>

        {/* Stats Cards Grid - Key metrics at the top */}
        <div className="teacher-dashboard__stats">
          <div className="teacher-stat-card teacher-stat-card--students">
            <img src={studentsIcon} alt="Students" className="teacher-stat-card__icon" />
            <div className="teacher-stat-card__info">
              <h3 className="teacher-stat-card__heading">Total Students</h3>
              <p className="teacher-stat-card__value">{metrics.totalStudents}</p>
            </div>
          </div>

          <div className="teacher-stat-card teacher-stat-card--scoring">
            <img src={scoringIcon} alt="Score" className="teacher-stat-card__icon" />
            <div className="teacher-stat-card__info">
              <h3 className="teacher-stat-card__heading">Students At Risk</h3>
              <p className="teacher-stat-card__value">
                {studentsNeedingAttention.filter(student => student.readingLevel !== 'Not Assessed').length} students
              </p>
            </div>
          </div>

          <div className="teacher-stat-card teacher-stat-card--pending">
            <img src={pendingIcon} alt="Pending" className="teacher-stat-card__icon" />
            <div className="teacher-stat-card__info">
              <h3 className="teacher-stat-card__heading">Total Interventions</h3>
              <p className="teacher-stat-card__value">
                {interventionProgress.length} {interventionProgress.length === 1 ? 'intervention' : 'interventions'}
              </p>
              <div style={{ fontSize: '0.75rem', color: 'rgba(255, 255, 255, 0.8)', marginTop: '0.25rem' }}>
                {interventionProgress.filter(p => p.isPassed).length} completed • {' '}
                {interventionProgress.filter(p => p.status === 'Needs Teacher Revision').length} need revision
              </div>
            </div>
          </div>
        </div>

        {/* Students Needing Attention Section */}
        <div className="teacher-card teacher-full-width-card teacher-students-card">
          <div className="teacher-card__header">
            <h2 className="teacher-card__title">Students Needing Attention</h2>
            <div className="teacher-filter-controls">
              <span className="teacher-filter-label">Reading Level:</span>
              <div className="teacher-filter-buttons">
                <button
                  className={`teacher-filter-btn ${studentFilter === 'all' ? 'teacher-filter-btn--active' : ''}`}
                  onClick={() => handleReadingLevelFilter('all')}
                >
                  All
                </button>
                {readingLevelDistribution.map((level) => (
                  <button
                    key={level.name}
                    className={`teacher-filter-btn ${studentFilter === level.name ? 'teacher-filter-btn--active' : ''}`}
                    style={studentFilter === level.name ? { backgroundColor: level.color } : {}}
                    onClick={() => handleReadingLevelFilter(level.name)}
                  >
                    {level.name}
                  </button>
                ))}
              </div>

              <span className="teacher-filter-label">Section:</span>
              <div className="teacher-filter-buttons">
                <button
                  className={`teacher-filter-btn ${sectionFilter === 'all' ? 'teacher-filter-btn--active' : ''}`}
                  onClick={() => handleSectionFilter('all')}
                >
                  All
                </button>
                {sections.map((section) => (
                  <button
                    key={section}
                    className={`teacher-filter-btn ${sectionFilter === section ? 'teacher-filter-btn--active' : ''}`}
                    onClick={() => handleSectionFilter(section)}
                  >
                    {section}
                  </button>
                ))}
              </div>
            </div>
          </div>


          {/* Students Needing Attention Table */}
          <div style={{
            width: '100%',
            maxHeight: '400px',
            overflow: 'auto',
            margin: '1rem 0',
            borderRadius: '8px',
            backgroundColor: 'transparent',
            border: '1px solid rgba(255, 255, 255, 0.08)',
            boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)'
          }}>
            <table style={{
              width: '100%',
              borderCollapse: 'collapse',
              borderSpacing: '0',
              tableLayout: 'fixed',
              backgroundColor: 'transparent',
              color: 'white'
            }}>
              <thead>
                <tr>
                  <th style={{
                    textAlign: 'left',
                    fontSize: '0.9rem',
                    fontWeight: '500',
                    color: 'white',
                    padding: '12px 16px',
                    borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
                    backgroundColor: '#2a3c6d', // Darker blue as shown in screenshot
                    position: 'sticky',
                    top: '0',
                    zIndex: '10',
                    textTransform: 'uppercase',
                    letterSpacing: '0.05em'
                  }}>Student</th>
                  <th style={{
                    fontSize: '0.9rem',
                    fontWeight: '500',
                    color: 'white',
                    padding: '12px 16px',
                    borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
                    backgroundColor: '#2a3c6d', // Darker blue as shown in screenshot
                    position: 'sticky',
                    top: '0',
                    zIndex: '10',
                    textTransform: 'uppercase',
                    letterSpacing: '0.05em',
                    width: '15%',
                    textAlign: 'center'
                  }}>Reading Level</th>
                  <th style={{
                    textAlign: 'left',
                    fontSize: '0.9rem',
                    fontWeight: '500',
                    color: 'white',
                    padding: '12px 16px',
                    borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
                    backgroundColor: '#2a3c6d', // Darker blue as shown in screenshot
                    position: 'sticky',
                    top: '0',
                    zIndex: '10',
                    textTransform: 'uppercase',
                    letterSpacing: '0.05em',
                    width: '15%'
                  }}>Section</th>
                  <th style={{
                    textAlign: 'left',
                    fontSize: '0.9rem',
                    fontWeight: '500',
                    color: 'white',
                    padding: '12px 16px',
                    borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
                    backgroundColor: '#2a3c6d', // Darker blue as shown in screenshot
                    position: 'sticky',
                    top: '0',
                    zIndex: '10',
                    textTransform: 'uppercase',
                    letterSpacing: '0.05em',
                    width: '30%'
                  }}>Categories Needing Improvement</th>
                  <th style={{
                    textAlign: 'left',
                    fontSize: '0.9rem',
                    fontWeight: '500',
                    color: 'white',
                    padding: '12px 16px',
                    borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
                    backgroundColor: '#2a3c6d', // Darker blue as shown in screenshot
                    position: 'sticky',
                    top: '0',
                    zIndex: '10',
                    textTransform: 'uppercase',
                    letterSpacing: '0.05em',
                    width: '10%'
                  }}>Action</th>
                </tr>
              </thead>
              <tbody>
                {sectionFilteredStudents.length > 0 ? (
                  sectionFilteredStudents.map((student) => (
                    <tr key={student.uniqueId || student.id} style={{
                      transition: 'background-color 0.2s',
                      backgroundColor: 'transparent'
                    }} onMouseOver={(e) => e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.08)'}
                      onMouseOut={(e) => e.currentTarget.style.backgroundColor = 'transparent'}>
                      <td style={{
                        padding: '12px 16px',
                        borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
                        fontSize: '0.95rem',
                        verticalAlign: 'middle',
                        color: 'white',
                        backgroundColor: 'transparent'
                      }}>{student.name}</td>
                      <td style={{
                        padding: '12px 16px',
                        borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
                        fontSize: '0.95rem',
                        verticalAlign: 'middle',
                        color: 'white',
                        backgroundColor: 'transparent',
                        textAlign: 'center'
                      }}>
                        <span style={{
                          display: 'inline-block',
                          padding: '0.35rem 0.8rem',
                          borderRadius: '20px',
                          fontSize: '0.8rem',
                          fontWeight: '600',
                          color: 'white',
                          textAlign: 'center',
                          minWidth: '80px',
                          boxShadow: '0 2px 4px rgba(0, 0, 0, 0.2)',
                          letterSpacing: '0.03em',
                          backgroundColor: getReadingLevelColor(student.readingLevel)
                        }}>
                          {student.readingLevel}
                        </span>
                      </td>
                      <td style={{
                        padding: '12px 16px',
                        borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
                        fontSize: '0.95rem',
                        verticalAlign: 'middle',
                        color: 'white',
                        backgroundColor: 'transparent'
                      }}>{student.section}</td>
                      <td style={{
                        padding: '12px 16px',
                        borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
                        fontSize: '0.95rem',
                        verticalAlign: 'middle',
                        color: 'white',
                        backgroundColor: 'transparent',
                        maxWidth: '300px'
                      }}>
                        <span style={{
                          display: '-webkit-box',
                          WebkitLineClamp: 2,
                          WebkitBoxOrient: 'vertical',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          lineHeight: 1.4
                        }}>
                          {student.readingLevel === 'Not Assessed'
                            ? 'Needs assessment to determine areas for improvement'
                            : (student.categoriesNeedingImprovement && Array.isArray(student.categoriesNeedingImprovement)
                              ? student.categoriesNeedingImprovement.map(cat => `${cat.category} (${cat.score}%)`).join(', ')
                              : 'All categories passed')}
                        </span>
                      </td>
                      <td style={{
                        padding: '12px 16px',
                        borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
                        fontSize: '0.95rem',
                        verticalAlign: 'middle',
                        color: 'white',
                        backgroundColor: 'transparent'
                      }}>
                        <button
                          style={{
                            backgroundColor: 'rgba(255, 255, 255, 0.15)',
                            border: '1px solid rgba(255, 255, 255, 0.15)',
                            borderRadius: '6px',
                            color: 'white',
                            padding: '0.4rem 0.9rem',
                            fontSize: '0.85rem',
                            cursor: 'pointer',
                            transition: 'all 0.2s',
                            minWidth: '70px',
                            width: '100%',
                            maxWidth: '100px',
                            margin: '0 auto',
                            display: 'block',
                            fontWeight: '500'
                          }}
                          onMouseOver={(e) => {
                            e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.25)';
                            e.currentTarget.style.transform = 'translateY(-2px)';
                            e.currentTarget.style.boxShadow = '0 2px 5px rgba(0, 0, 0, 0.2)';
                          }}
                          onMouseOut={(e) => {
                            e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.15)';
                            e.currentTarget.style.transform = 'translateY(0)';
                            e.currentTarget.style.boxShadow = 'none';
                          }}
                          onClick={() => openStudentDetail(student)}
                        >
                          View
                        </button>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="5" style={{
                      textAlign: 'center',
                      padding: '20px',
                      color: 'white',
                      borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
                      fontSize: '0.95rem',
                      backgroundColor: 'transparent'
                    }}>
                      No students found matching the current filter.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>


        {/* Main 2x2 grid structure */}
        <div className="teacher-dashboard__main-grid">
          {/* Top-left cell: Category Performance by Reading Level Chart */}
          <div className="teacher-dashboard__grid-cell">
            <div className="teacher-card teacher-distribution-card">
              <div className="teacher-card__header">
                  <h2 className="teacher-card__title">
                    Students Needing Intervention - {selectedReadingLevel} Level
                  </h2>
                 <div className="teacher-filter-controls">
                   <span className="teacher-filter-label">Filter by Reading Level:</span>
                   <div className="teacher-filter-buttons">
                     {readingLevelDistribution.map((level) => (
                       <button
                         key={level.name}
                         className={`teacher-filter-btn ${selectedReadingLevel === level.name ? 'teacher-filter-btn--active' : ''}`}
                         style={selectedReadingLevel === level.name ? { backgroundColor: level.color } : {}}
                         onClick={() => setSelectedReadingLevel(level.name)}
                       >
                         {level.name}
                       </button>
                     ))}
                   </div>
                 </div>
              </div>
              <div className="teacher-category-performance-chart" style={{ height: '400px' }}>
                {(() => {
                  const chartData = getCategoryPerformanceData(selectedReadingLevel);
                  
                  console.log('Chart data for rendering:', chartData);
                  console.log('Selected reading level:', selectedReadingLevel);
                  
                  // Debug: Check if chart data has valid structure
                  if (chartData.length > 0) {
                    console.log('Chart data structure check:', {
                      firstItem: chartData[0],
                      hasCategories: Object.keys(chartData[0]).filter(key => 
                        ['Alphabet Knowledge', 'Phonological Awareness', 'Decoding', 'Word Recognition', 'Reading Comprehension'].includes(key)
                      ),
                      categoryValues: Object.entries(chartData[0]).filter(([key, value]) => 
                        ['Alphabet Knowledge', 'Phonological Awareness', 'Decoding', 'Word Recognition', 'Reading Comprehension'].includes(key)
                      )
                    });
                  }
                  
                  if (chartData.length === 0) {
                    return (
                      <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        height: '100%',
                        color: 'white',
                        fontSize: '1.1rem',
                        textAlign: 'center',
                        padding: '2rem'
                      }}>
                        <div>
                          <p style={{ margin: '0 0 0.5rem 0', fontWeight: '600' }}>
                            No intervention data available for {selectedReadingLevel} level
                          </p>
                          <p style={{ margin: '0', opacity: 0.8, fontSize: '0.9rem' }}>
                            Students in this level may need to complete assessments first to identify intervention needs
                          </p>
                        </div>
                      </div>
                    );
                  }
                  
                  return (
                    <ResponsiveContainer width="100%" height={360}>
                  <BarChart
                        data={chartData}
                    margin={{ top: 20, right: 30, left: 20, bottom: 60 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255, 255, 255, 0.1)" />
                    <XAxis
                      dataKey="readingLevel"
                      stroke="white"
                      fontSize={12}
                      angle={-45}
                      textAnchor="end"
                      height={80}
                    />
                    <YAxis
                      stroke="white"
                      fontSize={12}
                      domain={[0, 100]}
                      label={{ value: 'Students Needing Intervention (%)', angle: -90, position: 'insideLeft', style: { textAnchor: 'middle', fill: 'white' } }}
                    />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: 'rgba(42, 60, 109, 0.95)',
                        border: '1px solid rgba(255, 255, 255, 0.2)',
                        borderRadius: '8px',
                        color: 'white',
                        maxWidth: '400px',
                        fontFamily: 'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
                        fontSize: '14px',
                        lineHeight: '1.4'
                      }}
                        formatter={(value, name, props) => {
                          const chartData = getCategoryPerformanceData(selectedReadingLevel);
                          const currentData = chartData.find(item => item.readingLevel === props.payload.readingLevel);
                          
                          const safeCategoryName = getSafeCategoryName(name);
                          
                          if (currentData && currentData[name] && currentData[name].detailedData) {
                            const detailedData = currentData[name].detailedData;
                            if (detailedData.length > 0) {
                              return [
                                <div key="tooltip-content">
                                  <div style={{ fontWeight: 'bold', marginBottom: '8px' }}>
                                    {safeCategoryName}: {value}% need intervention
                                  </div>
                                  <div style={{ fontSize: '12px' }}>
                                    {detailedData.map((student, index) => (
                                      <div key={index} style={{ marginBottom: '4px' }}>
                                        <strong>{student.studentName}</strong> - {student.interventionStatus}
                                        {student.latestAttempt && (
                                          <span style={{ color: '#FFC154' }}>
                                            {' '}(Attempt {student.latestAttempt.attemptNumber}, Score: {student.latestAttempt.score}%)
                                          </span>
                                        )}
                                      </div>
                                    ))}
                                  </div>
                                </div>,
                                safeCategoryName
                              ];
                            }
                          }
                          return [`${value}% need intervention`, safeCategoryName];
                        }}
                      labelStyle={{ color: 'white' }}
                    />
                    <ReferenceLine y={50} stroke="#FFC154" strokeDasharray="5 5" strokeWidth={2} />
                        {chartData.length > 0 && Object.keys(chartData[0]).filter(key => 
                          ['Alphabet Knowledge', 'Phonological Awareness', 'Decoding', 'Word Recognition', 'Reading Comprehension'].includes(key)
                        ).map(categoryName => {
                          const colors = {
                            'Alphabet Knowledge': '#4BC0C0',
                            'Phonological Awareness': '#FF9F40',
                            'Decoding': '#FF6B6B',
                            'Word Recognition': '#9F7AEA',
                            'Reading Comprehension': '#48BB78'
                          };
                          return (
                            <Bar 
                              key={categoryName}
                              dataKey={`${categoryName}.percentage`} 
                              fill={colors[categoryName]} 
                              name={categoryName} 
                            />
                          );
                        })}
                  </BarChart>
                </ResponsiveContainer>
                  );
                })()}
                
                {/* Dynamic Custom Legend - Only show categories that are in the chart */}
                {(() => {
                  const chartData = getCategoryPerformanceData(selectedReadingLevel);
                  const displayedCategories = chartData.length > 0 ? 
                    Object.keys(chartData[0]).filter(key => 
                      ['Alphabet Knowledge', 'Phonological Awareness', 'Decoding', 'Word Recognition', 'Reading Comprehension'].includes(key)
                    ) : [];
                  
                  const colors = {
                    'Alphabet Knowledge': '#4BC0C0',
                    'Phonological Awareness': '#FF9F40',
                    'Decoding': '#FF6B6B',
                    'Word Recognition': '#9F7AEA',
                    'Reading Comprehension': '#48BB78'
                  };
                  
                  return (
                    <div style={{
                      display: 'flex',
                      flexWrap: 'wrap',
                      justifyContent: 'center',
                      gap: '15px',
                      marginTop: '5px',
                      marginBottom: '5px',
                      padding: '5px 0',
                      maxWidth: '100%',
                      overflow: 'hidden'
                    }}>
                      {displayedCategories.map(categoryName => {
                        const safeCategoryName = getSafeCategoryName(categoryName);
                        
                        return (
                          <div key={categoryName} style={{ 
                            display: 'flex', 
                            alignItems: 'center', 
                            gap: '6px',
                            flexShrink: 0,
                            minWidth: 'fit-content'
                          }}>
                            <div style={{ 
                              width: '10px', 
                              height: '10px', 
                              backgroundColor: colors[categoryName], 
                              borderRadius: '2px',
                              flexShrink: 0
                            }}></div>
                            <span style={{ 
                              color: 'white', 
                              fontSize: '11px', 
                              fontWeight: '500', 
                              fontFamily: 'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
                              lineHeight: '1.2',
                              whiteSpace: 'nowrap',
                              overflow: 'hidden',
                              textOverflow: 'ellipsis',
                              maxWidth: '120px'
                            }}>{safeCategoryName}</span>
              </div>
                        );
                      })}
                    </div>
                  );
                })()}
              </div>
            </div>
          </div>

          {/* Top-right cell: Reading Level Distribution Chart */}
          <div className="teacher-dashboard__grid-cell">
            <div className="teacher-card teacher-distribution-card">
              <h2 className="teacher-card__title">Students by Reading Level</h2>
              <div className="teacher-reading-level-distribution">
                <div className="teacher-pie-chart">
                  <ResponsiveContainer width="100%" height={400}>
                    <PieChart>
                      <Pie
                        data={readingLevelDistribution}
                        cx="50%"
                        cy="50%"
                        outerRadius={100}
                        innerRadius={60}
                        dataKey="value"
                        nameKey="name"
                        onClick={handleReadingLevelPieClick}
                        cursor="pointer"
                      >
                        {readingLevelDistribution.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip
                        content={({ active, payload, label }) => {
                          if (active && payload && payload.length) {
                            const data = payload[0].payload;
                            return (
                              <div className="teacher-pie-chart-custom-tooltip">
                                <div className="teacher-pie-tooltip-header">{data.name}</div>
                                <div className="teacher-pie-tooltip-content">
                                  <div className="teacher-pie-tooltip-item">
                                    <span 
                                      className="teacher-pie-tooltip-color" 
                                      style={{ backgroundColor: data.color }}
                                    ></span>
                                    <span className="teacher-pie-tooltip-label">
                                      {data.value} students
                                    </span>
                                  </div>
                                </div>
                              </div>
                            );
                          }
                          return null;
                        }}
                        cursor={{ fill: 'transparent' }}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                </div>

                <div className="teacher-reading-level-legend">
                  {readingLevelDistribution.map((entry, index) => (
                    <div
                      key={index}
                      className="teacher-legend-item"
                      onClick={() => handleReadingLevelPieClick(entry)}
                    >
                      <div
                        className="teacher-legend-color"
                        style={{ backgroundColor: entry.color }}
                      ></div>
                      <div className="teacher-legend-text">
                        <span>{entry.name}</span>
                        <span className="teacher-legend-value">{entry.value} students</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

        </div>

        {/* Student Intervention Progress Section */}
        <div className="teacher-dashboard__full-width">
          <div className="teacher-intervention-section">
            <div className="teacher-intervention-header">
              <h2 className="teacher-intervention-title">Student Intervention Progress</h2>
              <div className="teacher-intervention-filters">
                <span className="teacher-filter-label">Reading Level:</span>
                <div className="teacher-reading-level-pills">
                  <button
                    className={`teacher-level-pill ${interventionFilter === 'all' ? 'teacher-level-pill--active' : ''}`}
                    onClick={() => setInterventionFilter('all')}
                  >
                    All ({interventionProgress.length})
                  </button>
                  {Array.from(new Set(interventionProgress.map(p => p.readingLevel)))
                    .filter(level => level && level !== 'Not Assessed')
                    .sort((a, b) => {
                      const levelOrder = ['Low Emerging', 'High Emerging', 'Developing', 'Transitioning', 'At Grade Level'];
                      return levelOrder.indexOf(a) - levelOrder.indexOf(b);
                    })
                    .map(level => {
                      const count = interventionProgress.filter(p => p.readingLevel === level).length;
                      return (
                        <button
                          key={level}
                          className={`teacher-level-pill ${interventionFilter === level ? 'teacher-level-pill--active' : ''}`}
                          onClick={() => setInterventionFilter(level)}
                        >
                          {level} ({count})
                        </button>
                      );
                    })}
                </div>
              </div>
            </div>

            {/* Chart Container */}
            <div className="teacher-intervention-chart-container">
              <ResponsiveContainer width="100%" height={300}>
                <BarChart
                  data={filteredInterventionProgress.map(progress => ({
                    name: progress.studentName || 'Student',
                    completed: progress.latestScore || 0,
                    correct: progress.improvement || 0,
                    category: progress.category
                  }))}
                  margin={{ top: 10, right: 30, left: 20, bottom: 60 }}
                  barGap={0}
                  barCategoryGap="20%"
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" vertical={false} />
                  <XAxis
                    dataKey="name"
                    tick={{ fill: 'white', fontSize: 12 }}
                    axisLine={{ stroke: 'rgba(255,255,255,0.3)' }}
                    tickLine={false}
                  />
                  <YAxis
                    tickFormatter={(value) => `${value}%`}
                    tick={{ fill: 'white', fontSize: 12 }}
                    axisLine={{ stroke: 'rgba(255,255,255,0.3)' }}
                    tickLine={false}
                    domain={[0, 100]}
                    ticks={[0, 25, 50, 75, 100]}
                  />
                  <Tooltip
                    content={({ active, payload, label }) => {
                      if (active && payload && payload.length) {
                        return (
                          <div className="teacher-intervention-custom-tooltip">
                            <div className="teacher-intervention-tooltip-header">{label}</div>
                            {payload.map((entry, index) => (
                              <div key={index} className="teacher-intervention-tooltip-item">
                                <span
                                  className="teacher-intervention-tooltip-color"
                                  style={{ backgroundColor: entry.color }}
                                ></span>
                                <span className="teacher-intervention-tooltip-label">
                                  {entry.dataKey === 'completed' ? 'Latest Score' : 'Improvement'}: {entry.value}%
                                </span>
                              </div>
                            ))}
                            {payload[0]?.payload?.category && (
                              <div style={{ fontSize: '0.8rem', color: 'rgba(255, 255, 255, 0.8)', marginTop: '0.3rem' }}>
                                Category: {payload[0].payload.category}
                              </div>
                            )}
                          </div>
                        );
                      }
                      return null;
                    }}
                    cursor={false}
                  />
                  <ReferenceLine y={75} stroke="#F3C922" strokeWidth={1} />
                  <Bar dataKey="completed" name="Latest Score %" fill="#4BC0C0" radius={[4, 4, 0, 0]} maxBarSize={30} />
                  <Bar dataKey="correct" name="Improvement %" fill="#FF9E40" radius={[4, 4, 0, 0]} maxBarSize={30} />
                  <Legend
                    verticalAlign="bottom"
                    height={36}
                    iconType="circle"
                    iconSize={10}
                    wrapperStyle={{ paddingTop: '20px' }}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>

            {/* Comprehensive Intervention Progress Table */}
            <div style={{
              padding: '0',
              overflowX: 'auto',
              border: '1px solid rgba(255, 255, 255, 0.15)',
              borderRadius: '8px',
              backgroundColor: 'rgba(30, 42, 74, 0.3)'
            }}>
              <table className="teacher-intervention-table">
                <thead>
                  <tr>
                    <th>STUDENT</th>
                    <th>CATEGORY</th>
                    <th>READING LEVEL</th>
                    <th>ATTEMPTS</th>
                    <th>LATEST SCORE</th>
                    <th>IMPROVEMENT</th>
                    <th>STATUS</th>
                    <th>LAST ATTEMPT</th>
                    <th>ACTIONS</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredInterventionProgress && filteredInterventionProgress.length > 0 ? (
                    filteredInterventionProgress.map((progress) => (
                      <tr key={progress.id}>
                        <td>
                          <div style={{ display: 'flex', flexDirection: 'column' }}>
                            <span style={{ fontWeight: '500' }}>{progress.studentName}</span>
                            <span style={{ fontSize: '0.75rem', color: 'rgba(255, 255, 255, 0.7)' }}>
                              {progress.section} - {progress.gradeLevel}
                            </span>
                          </div>
                        </td>
                        <td>
                          <span style={{
                            display: 'inline-block',
                            padding: '0.3rem 0.6rem',
                            backgroundColor: 'rgba(255, 255, 255, 0.1)',
                            borderRadius: '4px',
                            fontSize: '0.8rem',
                            fontWeight: '500'
                          }}>
                            {progress.category}
                          </span>
                        </td>
                        <td>
                          <span style={{
                            display: 'inline-block',
                            padding: '0.3rem 0.6rem',
                            backgroundColor: 'rgba(255, 255, 255, 0.1)',
                            borderRadius: '4px',
                            fontSize: '0.8rem',
                            fontWeight: '500'
                          }}>
                            {progress.readingLevel}
                          </span>
                        </td>
                        <td>
                          <div style={{ textAlign: 'center' }}>
                            <span style={{ fontWeight: '600', fontSize: '1.1rem' }}>{progress.totalAttempts}</span>
                            <div style={{ fontSize: '0.7rem', color: 'rgba(255, 255, 255, 0.7)' }}>
                              {progress.revisionNumber > 1 ? `${progress.revisionNumber} revisions` : '1 revision'}
                            </div>
                          </div>
                        </td>
                        <td>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            <span style={{ fontWeight: '600' }}>{progress.latestScore}%</span>
                            <div style={{
                              fontSize: '0.7rem',
                              color: progress.latestScore >= 75 ? '#3D9970' : '#FF6B8A'
                            }}>
                              (was {progress.originalScore}%)
                            </div>
                          </div>
                        </td>
                        <td>
                          <div style={{
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: 'center'
                          }}>
                            <span style={{
                              color: progress.improvement >= 0 ? '#3D9970' : '#FF6B8A',
                              fontWeight: '600'
                            }}>
                              {progress.improvement >= 0 ? '+' : ''}{progress.improvement}%
                            </span>
                            {progress.improvementPercentage !== 0 && (
                              <div style={{
                                fontSize: '0.7rem',
                                color: 'rgba(255, 255, 255, 0.7)'
                              }}>
                                ({progress.improvementPercentage >= 0 ? '+' : ''}{progress.improvementPercentage}% rel.)
                              </div>
                            )}
                          </div>
                        </td>
                        <td>
                          <span style={{
                            display: 'inline-block',
                            padding: '0.4rem 0.8rem',
                            backgroundColor: progress.statusColor,
                            color: progress.statusColor === '#3D9970' ? 'white' : '#1E2A4A',
                            borderRadius: '20px',
                            fontSize: '0.75rem',
                            fontWeight: '600',
                            textAlign: 'center',
                            whiteSpace: 'nowrap'
                          }}>
                            {progress.status}
                          </span>
                        </td>
                        <td style={{ fontSize: '0.8rem' }}>
                          {progress.lastAttemptDate}
                        </td>
                        <td>
                          <button
                            style={{
                              backgroundColor: '#4BC0C0',
                              color: '#1E2A4A',
                              padding: '0.5rem 1rem',
                              borderRadius: '6px',
                              fontSize: '0.8rem',
                              fontWeight: '500',
                              cursor: 'pointer',
                              transition: 'all 0.2s',
                              textAlign: 'center',
                              border: 'none',
                              whiteSpace: 'nowrap'
                            }}
                            onMouseOver={(e) => {
                              e.currentTarget.style.transform = 'translateY(-2px)';
                              e.currentTarget.style.boxShadow = '0 3px 8px rgba(0, 0, 0, 0.2)';
                            }}
                            onMouseOut={(e) => {
                              e.currentTarget.style.transform = 'translateY(0)';
                              e.currentTarget.style.boxShadow = 'none';
                            }}
                            onClick={() => openInterventionDetail(progress)}
                          >
                            View Details
                          </button>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan="9" className="teacher-no-data-cell">
                        No intervention progress data available.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Intervention Detail Modal */}
        {interventionDetailOpen && selectedIntervention && (
          <div className="teacher-modal-overlay" onClick={closeInterventionDetail}>
            <div className="teacher-modal-content teacher-intervention-modal" onClick={(e) => e.stopPropagation()}>
              <div className="teacher-modal-header" style={{ backgroundColor: "#FF9E40" }}>
                <h2>Intervention Progress Summary</h2>
                <button className="teacher-modal-close" onClick={closeInterventionDetail}>×</button>
              </div>

              <div className="teacher-modal-body">
                <div className="teacher-intervention-summary">
                  <div className="teacher-intervention-summary-header">
                    <div className="teacher-intervention-student-info">
                      <h3>{selectedIntervention.studentName || 'Student'}</h3>
                      <div className="teacher-intervention-student-details">
                        <span className="teacher-level-badge modal-badge">
                          {selectedIntervention.readingLevel || selectedIntervention.studentReadingLevel || 'Not Assessed'}
                        </span>
                        <span className="teacher-intervention-date">
                          Last Activity: {selectedIntervention.lastActivityDate || 'N/A'}
                        </span>
                      </div>
                    </div>
                    <div className="teacher-intervention-progress-stats">
                      <div className="teacher-stat-item">
                        <span className="teacher-stat-label">Completion</span>
                        <span className="teacher-stat-value">{selectedIntervention.percentComplete || 0}%</span>
                      </div>
                      <div className="teacher-stat-item">
                        <span className="teacher-stat-label">Correct</span>
                        <span className="teacher-stat-value">{selectedIntervention.percentCorrect || 0}%</span>
                      </div>
                      <div className="teacher-stat-item">
                        <span className="teacher-stat-label">Status</span>
                        <span className={`teacher-stat-status ${
                          selectedIntervention.status === 'Completed Successfully' ? 'passed' :
                          selectedIntervention.status === 'Needs Teacher Revision' ? 'needs-revision' :
                          'in-progress'
                        }`}>
                          {selectedIntervention.status || 'In Progress'}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="teacher-intervention-details">
                    <div className="teacher-intervention-detail-section">
                      <h4>Intervention Plan</h4>
                      <div className="teacher-detail-item">
                        <span className="teacher-detail-label">Plan Name:</span>
                        <span className="teacher-detail-value">{selectedIntervention.interventionPlanName || 'Intervention Plan'}</span>
                      </div>
                      <div className="teacher-detail-item">
                        <span className="teacher-detail-label">Category:</span>
                        <span className="teacher-detail-value">{selectedIntervention.category || 'N/A'}</span>
                      </div>
                      <div className="teacher-detail-item">
                        <span className="teacher-detail-label">Completed Attempts:</span>
                        <span className="teacher-detail-value">{selectedIntervention.completedActivities || 0}</span>
                      </div>
                      <div className="teacher-detail-item">
                        <span className="teacher-detail-label">Improvement %:</span>
                        <span className="teacher-detail-value">{selectedIntervention.improvementFromOriginal || 0}%</span>
                      </div>
                    </div>

                    <div className="teacher-intervention-notes-section">
                      <h4>Notes</h4>
                      <div className="teacher-intervention-notes">
                        {selectedIntervention.notes ? (
                          <p>{selectedIntervention.notes}</p>
                        ) : (
                          <p className="teacher-no-notes">No notes available for this intervention.</p>
                        )}
                      </div>
                    </div>

                    <div className="teacher-intervention-progress-chart-section">
                      <h4>Progress Visualization</h4>
                      <div className="teacher-intervention-progress-bars">
                        <div className="teacher-progress-bar-item">
                          <span className="teacher-progress-label">Completion</span>
                          <div className="teacher-modal-progress-wrapper">
                            <div className="teacher-modal-progress-track">
                              <div
                                className="teacher-modal-progress-fill"
                                style={{
                                  width: `${selectedIntervention.percentComplete || 0}%`,
                                  backgroundColor: '#4BC0C0'
                                }}
                              ></div>
                            </div>
                            <span className="teacher-modal-progress-text">{selectedIntervention.percentComplete || 0}%</span>
                          </div>
                        </div>

                        <div className="teacher-progress-bar-item">
                          <span className="teacher-progress-label">Correct Answers</span>
                          <div className="teacher-modal-progress-wrapper">
                            <div className="teacher-modal-progress-track">
                              <div
                                className="teacher-modal-progress-fill"
                                style={{
                                  width: `${selectedIntervention.percentCorrect || 0}%`,
                                  backgroundColor: '#FF9E40'
                                }}
                              ></div>
                              <div
                                className="teacher-threshold-marker"
                                style={{ left: '75%' }}
                              ></div>
                            </div>
                            <span className="teacher-modal-progress-text">{selectedIntervention.percentCorrect || 0}%</span>
                          </div>
                          <div className="teacher-threshold-label">Passing Threshold: 75%</div>
                        </div>
                      </div>
                    </div>

                    {/* Intervention Attempt History */}
                    {selectedIntervention.interventionHistory && selectedIntervention.interventionHistory.length > 0 && (
                      <div className="teacher-intervention-history-section" style={{ marginTop: '20px' }}>
                        <h4>Intervention Attempt History</h4>
                        <div className="teacher-intervention-attempts">
                          {selectedIntervention.interventionHistory.map((attempt, index) => (
                            <div key={index} className="teacher-attempt-card" style={{
                              backgroundColor: 'rgba(255, 255, 255, 0.1)',
                              borderRadius: '8px',
                              padding: '12px',
                              marginBottom: '8px',
                              border: `2px solid ${attempt.isPassed ? '#3D9970' : '#FF6B8A'}`
                            }}>
                              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <div>
                                  <span className="teacher-attempt-label" style={{ color: 'white', fontWeight: 'bold' }}>
                                    Attempt #{attempt.attemptNumber}
                                  </span>
                                  {attempt.revisionNumber && attempt.revisionNumber > 1 && (
                                    <span style={{
                                      marginLeft: '8px',
                                      backgroundColor: '#FF9E40',
                                      color: 'white',
                                      padding: '2px 6px',
                                      borderRadius: '4px',
                                      fontSize: '0.8rem'
                                    }}>
                                      Rev {attempt.revisionNumber}
                                    </span>
                                  )}
                                </div>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                  <span style={{ color: 'white', fontWeight: 'bold', fontSize: '1.1rem' }}>
                                    {attempt.score}%
                                  </span>
                                  <span style={{
                                    backgroundColor: attempt.isPassed ? '#3D9970' : '#FF6B8A',
                                    color: 'white',
                                    padding: '4px 8px',
                                    borderRadius: '4px',
                                    fontSize: '0.8rem',
                                    fontWeight: 'bold'
                                  }}>
                                    {attempt.isPassed ? 'PASSED' : 'FAILED'}
                                  </span>
                                </div>
                              </div>
                              <div style={{ marginTop: '8px', color: 'rgba(255, 255, 255, 0.8)', fontSize: '0.9rem' }}>
                                <div>Started: {attempt.attemptedAt ? new Date(attempt.attemptedAt).toLocaleDateString() : 'N/A'}</div>
                                <div>Completed: {attempt.completedAt ? new Date(attempt.completedAt).toLocaleDateString() : 'N/A'}</div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                  </div>
                </div>
              </div>

              <div className="teacher-modal-footer">
                {!selectedIntervention.passedThreshold ? (
                  <button
                    className="teacher-primary-button"
                    onClick={() => {
                      // Add logic to update the intervention as complete if needed
                      closeInterventionDetail();
                    }}
                  >
                  </button>
                ) : (
                  <button
                    className="teacher-secondary-button"
                    onClick={closeInterventionDetail}
                  >
                    Close
                  </button>
                )}
              </div>
            </div>
          </div>
        )}


      </main>

      {/* Modal for Reading Level Details */}
      {readingLevelDetailOpen && (
        <div className="teacher-modal-overlay" onClick={closeReadingLevelModal}>
          <div className="teacher-modal-content" onClick={(e) => e.stopPropagation()}>
            <div
              className="teacher-modal-header"
              style={{ backgroundColor: getReadingLevelColor(selectedReadingLevel) }}
            >
              <h2>{selectedReadingLevel} Details</h2>
              <button className="teacher-modal-close" onClick={closeReadingLevelModal}>×</button>
            </div>

            <div className="teacher-modal-body">
                {/* Students in this reading level */}
                <div style={{
                marginTop: '0'
                }}>
                  <h4 style={{
                    fontSize: '1.1rem',
                    marginBottom: '1rem',
                    color: 'white',
                    fontWeight: '600'
                  }}>Students in this Level</h4>
                  <div style={{
                    backgroundColor: 'rgba(59, 79, 129, 0.3)',
                    borderRadius: '8px',
                    border: '1px solid rgba(255, 255, 255, 0.15)',
                    overflow: 'auto',
                    maxHeight: '300px'
                  }}>
                    <table style={{
                      width: '100%',
                      borderCollapse: 'collapse',
                      borderSpacing: '0',
                      backgroundColor: 'transparent',
                      color: 'white'
                    }}>
                      <thead>
                        <tr>
                          <th style={{
                            textAlign: 'left',
                            fontSize: '0.9rem',
                            fontWeight: '500',
                            color: 'white',
                            padding: '12px 16px',
                            borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
                            backgroundColor: '#2a3c6d', // Darker blue as shown in screenshot
                            position: 'sticky',
                            top: '0',
                            zIndex: '10',
                            textTransform: 'uppercase',
                            letterSpacing: '0.05em'
                          }}>Student</th>
                          <th style={{
                            textAlign: 'left',
                            fontSize: '0.9rem',
                            fontWeight: '500',
                            color: 'white',
                            padding: '12px 16px',
                            borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
                            backgroundColor: '#2a3c6d', // Darker blue as shown in screenshot
                            position: 'sticky',
                            top: '0',
                            zIndex: '10',
                            textTransform: 'uppercase',
                            letterSpacing: '0.05em'
                          }}>Section</th>
                          <th style={{
                            textAlign: 'left',
                            fontSize: '0.9rem',
                            fontWeight: '500',
                            color: 'white',
                            padding: '12px 16px',
                            borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
                            backgroundColor: '#2a3c6d', // Darker blue as shown in screenshot
                            position: 'sticky',
                            top: '0',
                            zIndex: '10',
                            textTransform: 'uppercase',
                            letterSpacing: '0.05em'
                          }}>Grade</th>
                          <th style={{
                            textAlign: 'left',
                            fontSize: '0.9rem',
                            fontWeight: '500',
                            color: 'white',
                            padding: '12px 16px',
                            borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
                            backgroundColor: '#2a3c6d', // Darker blue as shown in screenshot
                            position: 'sticky',
                            top: '0',
                            zIndex: '10',
                            textTransform: 'uppercase',
                            letterSpacing: '0.05em'
                          }}>Action</th>
                        </tr>
                      </thead>
                      <tbody>
                        {studentsInSelectedLevel.length > 0 ? (
                          studentsInSelectedLevel.map(student => (
                            <tr key={student.uniqueId || student.id} style={{
                              transition: 'background-color 0.2s',
                              backgroundColor: 'transparent'
                            }} onMouseOver={(e) => e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.08)'}
                               onMouseOut={(e) => e.currentTarget.style.backgroundColor = 'transparent'}>
                              <td style={{
                                padding: '12px 16px',
                                borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
                                fontSize: '0.95rem',
                                verticalAlign: 'middle',
                                color: 'white',
                                backgroundColor: 'transparent'
                              }}>{student.firstName} {student.middleName} {student.lastName}</td>
                              <td style={{
                                padding: '12px 16px',
                                borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
                                fontSize: '0.95rem',
                                verticalAlign: 'middle',
                                color: 'white',
                                backgroundColor: 'transparent'
                              }}>{student.section || 'N/A'}</td>
                              <td style={{
                                padding: '12px 16px',
                                borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
                                fontSize: '0.95rem',
                                verticalAlign: 'middle',
                                color: 'white',
                                backgroundColor: 'transparent'
                              }}>{student.gradeLevel || 'Grade 1'}</td>
                              <td style={{
                                padding: '12px 16px',
                                borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
                                fontSize: '0.95rem',
                                verticalAlign: 'middle',
                                color: 'white',
                                backgroundColor: 'transparent'
                              }}>
                                <button
                                  style={{
                                    backgroundColor: 'rgba(255, 255, 255, 0.15)',
                                    border: '1px solid rgba(255, 255, 255, 0.15)',
                                    borderRadius: '6px',
                                    color: 'white',
                                    padding: '0.4rem 0.9rem',
                                    fontSize: '0.85rem',
                                    cursor: 'pointer',
                                    transition: 'all 0.2s',
                                    minWidth: '70px',
                                    width: '100%',
                                    maxWidth: '80px',
                                    display: 'block',
                                    fontWeight: '500'
                                  }}
                                  onMouseOver={(e) => {
                                    e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.25)';
                                    e.currentTarget.style.transform = 'translateY(-2px)';
                                    e.currentTarget.style.boxShadow = '0 2px 5px rgba(0, 0, 0, 0.2)';
                                  }}
                                  onMouseOut={(e) => {
                                    e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.15)';
                                    e.currentTarget.style.transform = 'translateY(0)';
                                    e.currentTarget.style.boxShadow = 'none';
                                  }}
                                  onClick={() => openStudentDetail(student)}
                                >
                                  View
                                </button>
                              </td>
                            </tr>
                          ))
                        ) : (
                          <tr>
                            <td colSpan="4" style={{
                              textAlign: 'center',
                              padding: '20px',
                              color: 'white',
                              borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
                              fontSize: '0.95rem',
                              backgroundColor: 'transparent'
                            }}>
                              No students found in this reading level.
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            </div>

            </div>
      )}

      {/* Student Detail Modal */}
      {studentDetailOpen && selectedStudent && (
        <div className="teacher-modal-overlay" onClick={closeStudentDetail}>
          <div className="teacher-modal-content teacher-student-modal" onClick={(e) => e.stopPropagation()}>
            <div
              className="teacher-modal-header"
              style={{ backgroundColor: getReadingLevelColor(selectedStudent.readingLevel) }}
            >
              <h2>{selectedStudent.name}</h2>
              <button className="teacher-modal-close" onClick={closeStudentDetail}>×</button>
            </div>

            <div className="teacher-modal-body">
              <div className="teacher-student-info-summary">
                <div className="teacher-student-info-section">
                  <h3>Performance Summary</h3>
                  <div className="teacher-info-grid">
                    <div className="teacher-info-item">
                      <span className="teacher-info-label">Reading Level:</span>
                      <span className="teacher-info-value">
                        <span
                          className={`teacher-reading-level-badge teacher-reading-level-badge--${selectedStudent.readingLevel.toLowerCase().replace(/\s+/g, '-')}`}
                          style={{ backgroundColor: getReadingLevelColor(selectedStudent.readingLevel) }}
                        >
                          {selectedStudent.readingLevel}
                        </span>
                      </span>
                    </div>
                    <div className="teacher-info-item">
                      <span className="teacher-info-label">Grade Level:</span>
                      <span className="teacher-info-value">{selectedStudent.gradeLevel}</span>
                    </div>
                    <div className="teacher-info-item">
                      <span className="teacher-info-label">Section:</span>
                      <span className="teacher-info-value">{selectedStudent.section}</span>
                    </div>
                  </div>
                </div>

                <div className="teacher-student-categories">
                  <h3>Categories Needing Improvement</h3>
                  {selectedStudent.readingLevel !== 'Not Assessed' ? (
                    <div className="teacher-categories-list">
                      {selectedStudent.categoriesNeedingImprovement && selectedStudent.categoriesNeedingImprovement.length > 0 ? (
                        selectedStudent.categoriesNeedingImprovement.map((categoryInfo, index) => (
                          <div key={index} className="teacher-category-item">
                            <div className="teacher-category-marker" style={{ backgroundColor: getReadingLevelColor(selectedStudent.readingLevel) }}></div>
                            <div className="teacher-category-name">
                              {categoryInfo.category} ({categoryInfo.score}%) - {categoryInfo.status}
                            </div>
                          </div>
                        ))
                      ) : (
                        <p>No improvement categories identified.</p>
                      )}
                    </div>
                  ) : (
                    <p className="teacher-no-assessment-message">
                      This student needs to complete the pre-assessment to determine areas for improvement.
                    </p>
                  )}
                </div>

                <div className="teacher-student-additional-info">
                  <h3>Additional Information</h3>
                  <div className="teacher-info-grid">
                    <div className="teacher-info-item">
                      <span className="teacher-info-label">Age:</span>
                      <span className="teacher-info-value">{selectedStudent.age}</span>
                    </div>
                    <div className="teacher-info-item">
                      <span className="teacher-info-label">Gender:</span>
                      <span className="teacher-info-value">{selectedStudent.gender}</span>
                    </div>
                    <div className="teacher-info-item">
                      <span className="teacher-info-label">Parent:</span>
                      <span className="teacher-info-value">
                        {selectedStudent.parentName || 'Not specified'}
                      </span>
                    </div>
                    <div className="teacher-info-item">
                      <span className="teacher-info-label">Pre-Assessment:</span>
                      <span className="teacher-info-value">{selectedStudent.preAssessmentCompleted ? 'Completed' : 'Not completed'}</span>
                    </div>
                    <div className="teacher-info-item teacher-full-width">
                      <span className="teacher-info-label">Address:</span>
                      <span className="teacher-info-value">{selectedStudent.address}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="teacher-modal-footer">
              <button
                className="teacher-primary-button"
                onClick={() => viewStudentDetails(selectedStudent)}
              >
                View Full Profile
              </button>
              <button
                className="teacher-secondary-button"
                onClick={() => {
                  closeStudentDetail();
                  navigate('/teacher/manage-progress', {
                    state: { studentId: selectedStudent.id }
                  });
                }}
              >
                Manage Progress
              </button>
              <button className="teacher-secondary-button" onClick={closeStudentDetail}>Close</button>
            </div>
          </div>
        </div>
      )}

      {/* Success Message Toast */}
      {successMessage && (
        <div className="teacher-success-message">
          {successMessage}
        </div>
      )}
    </div>
  );
};

export default TeacherDashboard;
