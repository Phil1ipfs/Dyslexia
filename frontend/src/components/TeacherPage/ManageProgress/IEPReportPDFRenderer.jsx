import React from 'react';
import {
  Document,
  Page,
  Text,
  View,
  StyleSheet,
  Image,
  pdf
} from '@react-pdf/renderer';
import cradleLogo from '../../../assets/images/Teachers/cradleLogoTrans.png';

// Create styles for the PDF
const styles = StyleSheet.create({
  // Page setup
  page: {
    flexDirection: 'column',
    backgroundColor: '#FFFFFF',
    padding: 30,
    fontFamily: 'Times-Roman',
    fontSize: 10,
    lineHeight: 1.2,
  },

  // Header styles
  header: {
    alignItems: 'center',
    marginBottom: 25,
    paddingBottom: 20,
    borderBottom: '2pt solid #3B4F81',
  },

  headerContent: {
    textAlign: 'center',
    width: '100%',
  },

  logo: {
    width: 60,
    height: 60,
    alignSelf: 'center',
    marginBottom: 15,
  },

  schoolName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#3B4F81',
    textTransform: 'uppercase',
    marginBottom: 8,
  },

  schoolInfo: {
    fontSize: 9,
    color: '#374151',
    marginBottom: 4,
    lineHeight: 1.3,
  },

  reportTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#3B4F81',
    textTransform: 'uppercase',
    marginTop: 20,
    marginBottom: 8,
    textAlign: 'center',
  },

  schoolYear: {
    fontSize: 10,
    color: '#374151',
    textAlign: 'center',
    marginTop: 5,
  },

  // Student info styles
  studentInfo: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 20,
    padding: 15,
    backgroundColor: '#F9FAFB',
    borderRadius: 5,
  },

  infoItem: {
    width: '50%',
    marginBottom: 8,
  },

  infoLabel: {
    fontWeight: 'bold',
    color: '#3B4F81',
  },

  infoValue: {
    color: '#000',
  },

  // Section headers
  sectionHeader: {
    backgroundColor: '#3B4F81',
    color: '#FFFFFF',
    padding: 8,
    textAlign: 'center',
    fontSize: 11,
    fontWeight: 'bold',
    textTransform: 'uppercase',
    marginTop: 20,
    marginBottom: 10,
  },

  // Summary styles
  summaryText: {
    marginBottom: 8,
    textAlign: 'justify',
  },

  summaryLabel: {
    fontWeight: 'bold',
    color: '#3B4F81',
  },

  summaryParagraph: {
    marginBottom: 15,
    padding: 15,
    backgroundColor: '#F8FAFC',
    borderRadius: 5,
    lineHeight: 1.4,
    textAlign: 'justify',
  },

  // Table styles
  table: {
    display: 'table',
    width: 'auto',
    marginBottom: 15,
  },

  tableRow: {
    margin: 'auto',
    flexDirection: 'row',
  },

  tableHeader: {
    backgroundColor: '#3B4F81',
    color: '#FFFFFF',
  },

  tableCell: {
    width: '12%', // Reduced to fit support level column
    borderStyle: 'solid',
    borderWidth: 1,
    borderColor: '#D1D5DB',
    padding: 4,
    textAlign: 'center',
    fontSize: 7,
  },

  tableCellSupport: {
    width: '15%', // Support level column
    borderStyle: 'solid',
    borderWidth: 1,
    borderColor: '#D1D5DB',
    padding: 4,
    textAlign: 'center',
    fontSize: 7,
  },

  tableCellWide: {
    width: '25%', // Reduced to accommodate support level column
    borderStyle: 'solid',
    borderWidth: 1,
    borderColor: '#D1D5DB',
    padding: 4,
    fontSize: 7,
    textAlign: 'left',
    flexWrap: 'wrap',
  },

  // Status colors
  statusPassed: {
    backgroundColor: '#DCFCE7',
    color: '#166534',
    padding: 2,
    borderRadius: 2,
    fontSize: 7,
    fontWeight: 'bold',
  },

  statusFailed: {
    backgroundColor: '#FEE2E2',
    color: '#DC2626',
    padding: 2,
    borderRadius: 2,
    fontSize: 7,
    fontWeight: 'bold',
  },

  // Support level styles
  supportMin: {
    backgroundColor: '#DCFCE7',
    color: '#166534',
    padding: 2,
    borderRadius: 2,
    fontSize: 7,
    fontWeight: 'bold',
  },

  supportMod: {
    backgroundColor: '#FEF3C7',
    color: '#D97706',
    padding: 2,
    borderRadius: 2,
    fontSize: 7,
    fontWeight: 'bold',
  },

  supportExt: {
    backgroundColor: '#FEE2E2',
    color: '#DC2626',
    padding: 2,
    borderRadius: 2,
    fontSize: 7,
    fontWeight: 'bold',
  },

  checkmarkContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    padding: 4,
  },

  checkboxWrapper: {
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
  },

  checkboxLabel: {
    fontSize: 5,
    color: '#374151',
    fontWeight: 'bold',
    marginBottom: 2,
    textAlign: 'center',
  },

  checkbox: {
    fontSize: 12,
    color: '#059669',
    textAlign: 'center',
    fontFamily: 'Times-Roman',
    fontWeight: 'bold',
  },

  supportLevelText: {
    fontSize: 8,
    fontWeight: 'bold',
    textAlign: 'center',
    color: '#374151',
  },

  legendContainer: {
    backgroundColor: '#F3F4F6',
    padding: 8,
    marginBottom: 10,
    borderRadius: 3,
  },

  legendTitle: {
    fontSize: 8,
    fontWeight: 'bold',
    color: '#374151',
    marginBottom: 2,
  },

  legendRow: {
    marginBottom: 2,
  },

  legendItem: {
    fontSize: 7,
    color: '#6B7280',
  },

  // Signature section
  signatureSection: {
    flexDirection: 'row',
    marginTop: 30,
    justifyContent: 'space-between',
  },

  signatureBox: {
    width: '45%',
    textAlign: 'center',
  },

  signatureLine: {
    borderBottom: '1pt solid #000',
    marginBottom: 5,
    height: 30,
  },

  signatureLabel: {
    fontSize: 9,
    fontWeight: 'bold',
  },
});

const IEPReportPDFRenderer = ({ iepData }) => {
  // Debug: Log the data being received
  console.log('PDF Renderer - IEP Data received:', iepData);
  console.log('PDF Renderer - Student ID:', iepData?.studentId);
  console.log('PDF Renderer - Student:', iepData?.student);

  // Format date helper
  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  // Render support level checkboxes
  const renderSupportLevelCheckmarks = (supportLevel) => {
    // Handle null, undefined, or empty support level
    if (!supportLevel || supportLevel === null || supportLevel === undefined || supportLevel === '') {
      return (
        <View style={styles.checkmarkContainer}>
          <View style={styles.checkboxWrapper}>
            <Text style={styles.checkboxLabel}>Minimal</Text>
            <Text style={styles.checkbox}>[ ]</Text>
          </View>
          <View style={styles.checkboxWrapper}>
            <Text style={styles.checkboxLabel}>Moderate</Text>
            <Text style={styles.checkbox}>[ ]</Text>
          </View>
          <View style={styles.checkboxWrapper}>
            <Text style={styles.checkboxLabel}>Extensive</Text>
            <Text style={styles.checkbox}>[ ]</Text>
          </View>
        </View>
      );
    }

    const level = supportLevel.toLowerCase();
    const isMinimal = level === 'minimal' || level === 'min';
    const isModerate = level === 'moderate' || level === 'mod';
    const isExtensive = level === 'extensive' || level === 'ext';

    return (
      <View style={styles.checkmarkContainer}>
        <View style={styles.checkboxWrapper}>
          <Text style={styles.checkboxLabel}>Minimal</Text>
          <Text style={styles.checkbox}>{isMinimal ? '[X]' : '[ ]'}</Text>
        </View>
        <View style={styles.checkboxWrapper}>
          <Text style={styles.checkboxLabel}>Moderate</Text>
          <Text style={styles.checkbox}>{isModerate ? '[X]' : '[ ]'}</Text>
        </View>
        <View style={styles.checkboxWrapper}>
          <Text style={styles.checkboxLabel}>Extensive</Text>
          <Text style={styles.checkbox}>{isExtensive ? '[X]' : '[ ]'}</Text>
        </View>
      </View>
    );
  };

  // Get student name - EXACTLY same logic as React component
  const getStudentName = () => {
    // Use the exact same logic as the React component
    if (iepData?.studentId?.firstName && iepData?.studentId?.lastName) {
      return `${iepData.studentId.firstName} ${iepData.studentId.lastName}`;
    } else if (iepData?.student?.firstName && iepData?.student?.lastName) {
      return `${iepData.student.firstName} ${iepData.student.lastName}`;
    } else if (iepData?.studentName) {
      return iepData.studentName;
    } else if (iepData?.student?.name) {
      return iepData.student.name;
    } else if (iepData?.student?.idNumber && window.studentsGlobalCache) {
      // Try to find student in global cache by ID number
      const cachedStudent = window.studentsGlobalCache.find(s => s.idNumber === iepData.student.idNumber);
      if (cachedStudent?.firstName && cachedStudent?.lastName) {
        return `${cachedStudent.firstName} ${cachedStudent.lastName}`;
      }
    }

    return 'Student';
  };

  // Convert lesson name to category name (remove "Mastering" prefix) - EXACTLY same as React component
  const getCategoryName = (lessonName) => {
    if (!lessonName) return '';
    return lessonName.replace(/^Mastering\s+/i, '');
  };

  // Utility function to clean teacher remarks and filter out file paths - EXACTLY same as React component
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
      return null;
    }

    // If the remark is too long (likely a corrupted path), consider it invalid
    if (cleanedRemark.length > 500) {
      return null;
    }

    // Return cleaned remark if valid
    return cleanedRemark.length > 0 ? cleanedRemark : null;
  };

  // IMPROVED: Enhanced function to extract clean text before file path corruption - EXACTLY same as React component
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

  // Get EXACTLY what's in the database - no fallbacks, no automatic generation - EXACTLY same as React component
  const getDatabaseRemark = (objective) => {
    // For main assessment remarks: show remarks or mainAssessmentRemarks, cleaned up
    const mainRemark = extractCleanRemark(objective.remarks || objective.mainAssessmentRemarks);
    return mainRemark || 'No remarks added';
  };

  // Get teacher name - EXACTLY same logic as React component
  const getTeacherName = () => {
    try {
      if (iepData?.teacherProfile?.firstName && iepData?.teacherProfile?.lastName) {
        return `${iepData.teacherProfile.firstName} ${iepData.teacherProfile.lastName}`;
      } else if (iepData?.teacherProfile?.name) {
        return iepData.teacherProfile.name;
      } else if (iepData?.teacherName) {
        return iepData.teacherName;
      } else {
        return 'Teacher';
      }
    } catch (error) {
      console.error('Error getting teacher name:', error);
      return 'Teacher';
    }
  };

  // Debug: Log the data being processed
  console.log('PDF Renderer - Raw objectives data:', iepData.objectives);
  console.log('PDF Renderer - Reading level:', iepData.readingLevel);
  console.log('PDF Renderer - Student name:', getStudentName());

  return (
    <Document>
      {/* Page 1: Header + Student Info + Summary */}
      <Page size="A4" style={styles.page}>
        {/* Header */}
        <View style={styles.header}>
          <Image 
            style={styles.logo} 
            src={cradleLogo}
          />
          <View style={styles.headerContent}>
          <Text style={styles.schoolName}>CRADLE OF LEARNERS</Text>
          <Text style={styles.schoolInfo}>(Inclusive School for Individualized Education), Inc.</Text>
          <Text style={styles.schoolInfo}>3rd Floor TJCP Bldg. Elliptical Road Corner Maharlika St. Quezon City</Text>
          <Text style={styles.schoolInfo}>Tel: 8294-7772 | Email: cradle.of.learners@gmail.com</Text>

          <Text style={styles.reportTitle}>INDIVIDUALIZED EDUCATION PROGRAM</Text>
          <Text style={styles.reportTitle}>IEP PROGRESS REPORT</Text>
            <Text style={styles.schoolYear}>S.Y. {iepData.academicYear || '2025'}</Text>
          </View>
        </View>

        {/* Student Information */}
        <View style={styles.studentInfo}>
          <View style={styles.infoItem}>
            <Text><Text style={styles.infoLabel}>Name: </Text>{getStudentName()}</Text>
          </View>
          <View style={styles.infoItem}>
            <Text><Text style={styles.infoLabel}>Age: </Text>{iepData.studentId?.age || iepData.student?.age || iepData.studentAge || 'N/A'}</Text>
          </View>
          <View style={styles.infoItem}>
            <Text><Text style={styles.infoLabel}>Grade: </Text>{iepData.studentId?.gradeLevel || iepData.student?.gradeLevel || iepData.studentGrade || 'N/A'}</Text>
          </View>
          <View style={styles.infoItem}>
            <Text><Text style={styles.infoLabel}>Gender: </Text>{iepData.studentId?.gender || iepData.student?.gender || iepData.studentGender || 'N/A'}</Text>
          </View>
          <View style={styles.infoItem}>
            <Text><Text style={styles.infoLabel}>Parent: </Text>{iepData.studentId?.parentName || iepData.student?.parentName || iepData.parentName || 'N/A'}</Text>
          </View>
          <View style={styles.infoItem}>
            <Text><Text style={styles.infoLabel}>Date: </Text>{formatDate(new Date())}</Text>
          </View>
          <View style={styles.infoItem}>
            <Text><Text style={styles.infoLabel}>Reading Level: </Text>{iepData.readingLevel || 'N/A'}</Text>
          </View>
          <View style={styles.infoItem}>
            <Text><Text style={styles.infoLabel}>Last Assessment: </Text>{formatDate(iepData.updatedAt || iepData.lastAssessment)}</Text>
          </View>
        </View>

        {/* Student Performance Summary */}
        <View style={styles.sectionHeader}>
          <Text>STUDENT PERFORMANCE SUMMARY</Text>
        </View>

        {/* Comprehensive Summary - EXACTLY matching React Component Logic */}
        <View style={styles.summaryParagraph}>
          <Text style={styles.summaryText}>
            <Text style={styles.summaryLabel}>Reading Level Achievement: </Text>
            {(() => {
              if (!iepData?.objectives || iepData.objectives.length === 0) {
                return `${getStudentName()} has not yet completed comprehensive assessment protocols. Baseline evaluation is required to establish current performance levels and identify individual learning strengths and areas for growth.`;
              }

              const studentName = getStudentName();
              const currentIepData = iepData;

              // Calculate performance metrics for more detailed analysis
              const averageScore = currentIepData.objectives.reduce((sum, obj) => sum + (obj.assessmentScore || obj.score || 0), 0) / currentIepData.objectives.length;
              const performanceRange = Math.round(averageScore);

              const availableCategories = currentIepData.objectives.map(obj => obj.categoryName);
              const passedCategories = currentIepData.objectives.filter(obj => obj.isPassed);
              const allPassed = passedCategories.length === availableCategories.length && availableCategories.length > 0;

              if (allPassed) {
                return `${studentName} is currently functioning at the ${currentIepData?.readingLevel || 'Not Assessed'} reading level, demonstrating complete mastery across all ${availableCategories.length} assessed literacy domain${availableCategories.length > 1 ? 's' : ''}: ${availableCategories.join(', ')}. With an average performance of ${performanceRange}%, this achievement reflects strong foundational reading skills and readiness for advancement to the next developmental reading level. The student's consistent performance above the 75% mastery threshold indicates solid understanding of current grade-level expectations.`;
              } else {
                const pendingCategories = currentIepData.objectives.filter(obj => !obj.isPassed);
                const pendingCategoryNames = pendingCategories.map(obj => obj.categoryName);
                const pendingScores = pendingCategories.map(obj => `${obj.categoryName} (${obj.assessmentScore || obj.score || 0}%)`);

                return `${studentName} is currently functioning at the ${currentIepData?.readingLevel || 'Not Assessed'} reading level, requiring targeted development in ${pendingCategoryNames.length} critical literacy domain${pendingCategoryNames.length > 1 ? 's' : ''}: ${pendingScores.join(', ')}. Current performance indicates specific skill gaps that benefit from systematic intervention approaches. The average assessment performance of ${performanceRange}% suggests ${performanceRange >= 50 ? 'emerging competencies that can be strengthened' : 'foundational skills requiring intensive support'} through evidence-based instructional strategies.`;
              }
            })()}
          </Text>

          <Text style={styles.summaryText}>
            <Text style={styles.summaryLabel}>Initial Assessment Performance: </Text>
            {(() => {
              if (!iepData?.objectives || iepData.objectives.length === 0) {
                return 'Assessment data is not yet available and requires completion to establish baseline performance metrics.';
              }

              const currentIepData = iepData;
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

              let performanceAnalysis = `The comprehensive initial assessment administered across multiple literacy domains revealed the following detailed performance profile: ${performanceDetails.join('; ')}.`;

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
          </Text>

          <Text style={styles.summaryText}>
            <Text style={styles.summaryLabel}>Intervention Progress: </Text>
            {(() => {
              if (!iepData?.objectives || iepData.objectives.length === 0) {
                return `${getStudentName()} has not yet initiated intervention activities, pending completion of baseline assessment protocols.`;
              }

              const studentName = getStudentName();
              const currentIepData = iepData;
              const totalAttempts = currentIepData.objectives.reduce((total, obj) => total + (obj.interventionAttempts || 0), 0);
              const categoriesWithInterventions = currentIepData.objectives.filter(obj => obj.hasIntervention && obj.interventionAttempts > 0);

              if (totalAttempts === 0) {
                const needingIntervention = currentIepData.objectives.filter(obj => !obj.isPassed);
                if (needingIntervention.length > 0) {
                  return `${studentName} has been identified for intervention support in ${needingIntervention.length} literacy domain${needingIntervention.length > 1 ? 's' : ''}: ${needingIntervention.map(obj => obj.categoryName).join(', ')}. Intervention protocols are pending implementation based on the comprehensive assessment results, with targeted strategies being developed to address specific learning gaps.`;
                } else {
                  return `${studentName} has demonstrated proficiency across all assessed domains and does not require intervention support at this time.`;
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

              let progressReport = `${studentName} has actively engaged in ${totalAttempts} intervention session${totalAttempts > 1 ? 's' : ''} across ${categoriesWithInterventions.length} literacy domain${categoriesWithInterventions.length > 1 ? 's' : ''}: ${interventionDetails.join('; ')}.`;

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
          </Text>

          <Text style={styles.summaryText}>
            <Text style={styles.summaryLabel}>Mastery Achievement and Learning Trajectory: </Text>
            {(() => {
              if (!iepData?.objectives || iepData.objectives.length === 0) {
                return `${getStudentName()} has not yet completed comprehensive assessment protocols. Baseline evaluation is required to establish current performance levels and identify individual learning strengths and areas for growth.`;
              }

              const studentName = getStudentName();
              const currentIepData = iepData;
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
                return `${studentName} has demonstrated exceptional academic achievement through systematic intervention implementation, attaining complete mastery (100%) across all ${totalCategories} assessed literacy domain${totalCategories > 1 ? 's' : ''} with an overall performance average of ${averageScore}%. The intervention effectiveness data shows an average improvement of ${avgImprovement}% across targeted domains, indicating highly successful responsiveness to instructional support. This comprehensive mastery profile demonstrates the student's strong foundational reading competencies, consistent academic engagement, effective learning strategies, and readiness for advanced literacy challenges at the next developmental level.`;
              } else if (masteryPercentage >= 75) {
                return `${studentName} has achieved substantial academic progress with ${masteryPercentage}% mastery across assessed literacy domains (${passedCategories.length} of ${totalCategories} categories passed) and an overall performance average of ${averageScore}%. Performance analysis reveals strength in ${strongDomains.length} domain${strongDomains.length !== 1 ? 's' : ''}, emerging competencies in ${emergingDomains.length} area${emergingDomains.length !== 1 ? 's' : ''}, and targeted support needs in ${challengingDomains.length} domain${challengingDomains.length !== 1 ? 's' : ''}. The intervention effectiveness data shows an average improvement of ${avgImprovement}% across intervention areas, demonstrating positive educational outcomes and strong potential for achieving complete mastery with continued targeted support.`;
              } else if (masteryPercentage > 0) {
                return `${studentName} has achieved emerging mastery with ${masteryPercentage}% completion across assessed literacy domains (${passedCategories.length} of ${totalCategories} categories passed) and an overall performance average of ${averageScore}%. Current achievement profile shows ${strongDomains.length} domain${strongDomains.length !== 1 ? 's' : ''} at proficiency level, ${emergingDomains.length} area${emergingDomains.length !== 1 ? 's' : ''} showing developing skills, and ${challengingDomains.length} domain${challengingDomains.length !== 1 ? 's' : ''} requiring intensive support. Intervention data indicates ${avgImprovement >= 0 ? `positive growth trajectory with ${avgImprovement}% average improvement` : 'ongoing challenges requiring strategy revision'}, suggesting the need for enhanced instructional approaches, increased support intensity, and possibly individualized learning accommodations.`;
              } else {
                const unsuccessfulDomains = currentIepData.objectives.filter(obj => !obj.isPassed).map(obj => obj.categoryName);
                return `${studentName} requires comprehensive intervention support across all assessed literacy domains: ${unsuccessfulDomains.join(', ')}. With an overall performance average of ${averageScore}%, current results indicate significant foundational skill gaps that require intensive, individualized instructional approaches. The intervention data suggests ${avgImprovement !== 0 ? `some responsiveness with ${avgImprovement}% change, but` : 'limited responsiveness, indicating the need for'} alternative pedagogical strategies, increased instructional intensity, multi-sensory teaching approaches, and potentially specialized educational services to effectively address the student's unique learning profile and academic needs.`;
              }
            })()}
          </Text>

          <Text style={styles.summaryText}>
            <Text style={styles.summaryLabel}>Current Academic Status and Recommendations: </Text>
            {(() => {
              if (!iepData?.objectives || iepData.objectives.length === 0) {
                return `${getStudentName()} requires comprehensive initial assessment to establish current reading competencies, identify learning strengths, and determine appropriate individualized intervention strategies for optimal academic progress.`;
              }

              const studentName = getStudentName();
              const currentIepData = iepData;
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
                return `${studentName} has successfully achieved mastery across all ${totalCategories} assessed literacy domain${totalCategories > 1 ? 's' : ''} for the ${currentIepData.readingLevel} reading level, with an overall performance average of ${averageScore}%. This comprehensive achievement demonstrates strong foundational reading competencies and indicates exceptional readiness for academic advancement to the ${nextLevel} reading level. The student would benefit from enrichment activities, advanced literacy challenges, and continued progress monitoring to maintain skill proficiency and support accelerated academic growth in reading development.`;
              } else if (hasActiveInterventions) {
                const pendingCategories = currentIepData.objectives.filter(obj => !obj.isPassed);
                const pendingDetails = pendingCategories.map(obj => `${obj.categoryName} (${obj.assessmentScore || obj.score || 0}%)`);

                return `${studentName} is currently engaged in active intervention protocols targeting ${pendingCategories.length} literacy domain${pendingCategories.length > 1 ? 's' : ''}: ${pendingDetails.join(', ')}. With ${masteryPercentage}% current mastery rate and ${averageScore}% overall performance, the student requires continued systematic intervention support, potential revision of instructional strategies, and enhanced educational accommodations to achieve proficiency at the ${currentIepData.readingLevel} reading level. Recommended actions include: regular progress monitoring (weekly), data-driven intervention adjustments, collaborative teacher consultation, and possible referral for additional educational support services.`;
              } else {
                const failedCategories = currentIepData.objectives.filter(obj => !obj.isPassed);
                const failedDetails = failedCategories.map(obj => `${obj.categoryName} (${obj.assessmentScore || obj.score || 0}%)`);

                return `${studentName} requires immediate implementation of intensive intervention protocols in ${failedCategories.length} critical literacy domain${failedCategories.length > 1 ? 's' : ''}: ${failedDetails.join(', ')}. With current performance metrics showing ${masteryPercentage}% mastery rate and ${averageScore}% overall academic achievement, priority actions include: development of individualized intervention plans, implementation of evidence-based instructional strategies, provision of specialized educational supports, and establishment of frequent progress monitoring systems. The student would benefit from multi-sensory teaching approaches, reduced cognitive load strategies, and potential consultation with literacy specialists to address identified learning gaps and facilitate academic progress toward mastery at the ${currentIepData.readingLevel} reading level.`;
              }
            })()}
          </Text>
        </View>
      </Page>

      {/* Page 2: Learning Objectives, Intervention Details, and Signatures */}
      <Page size="A4" style={styles.page}>
        <View style={styles.sectionHeader}>
          <Text>LEARNING OBJECTIVES AND PROGRESS</Text>
        </View>

        {/* Support Level Legend */}
        <View style={styles.legendContainer}>
          <Text style={styles.legendTitle}>Support Level Legend:</Text>
          <View style={styles.legendRow}>
            <Text style={styles.legendItem}>[X] = Required | [ ] = Not Required</Text>
          </View>
          <View style={styles.legendRow}>
            <Text style={styles.legendItem}>Minimal | Moderate | Extensive</Text>
          </View>
        </View>

        {/* Table Header */}
        <View style={styles.table}>
          <View style={[styles.tableRow, styles.tableHeader]}>
            <Text style={styles.tableCell}>Learning Category</Text>
            <Text style={styles.tableCell}>Assessment Score</Text>
            <Text style={styles.tableCell}>Intervention Progress</Text>
            <Text style={styles.tableCellSupport}>Support Level Required</Text>
            <Text style={styles.tableCell}>Status</Text>
            <Text style={styles.tableCellWide}>Teacher Remarks</Text>
          </View>

          {/* Table Rows - EXACTLY same logic as React component */}
          {(iepData.objectives || []).map((objective, index) => {
            // Use exact same data processing as React component
            const initialScore = objective.assessmentScore || objective.score || 0;
            const interventionScore = objective.latestInterventionScore || 0;
            const attempts = objective.interventionAttempts || 0;
            const isMastered = objective.latestInterventionPassed || objective.isPassed;

            // Get support level (preserve null values) - EXACTLY same as React component
            const supportLevel = objective.supportLevel;
            const getSupportStyle = (level) => {
              switch(level?.toLowerCase()) {
                case 'minimal':
                case 'min': return styles.supportMin;
                case 'moderate':
                case 'mod': return styles.supportMod;
                case 'extensive':
                case 'ext': return styles.supportExt;
                default: return styles.supportMin;
              }
            };

            // Format intervention progress - EXACTLY same logic as React component
            const interventionProgress = interventionScore > 0 ?
              `${interventionScore}% (${attempts > 0 ? `${attempts} attempts` : 'completed'})` :
              (attempts > 0 ? `In progress (${attempts} attempts)` : 'Not started');

            // Get teacher remarks - EXACTLY same logic as React component
            const teacherRemarks = getDatabaseRemark(objective);

            return (
            <View key={index} style={styles.tableRow}>
              <Text style={styles.tableCell}>{getCategoryName(objective.lesson)}</Text>
                <Text style={styles.tableCell}>{initialScore}%</Text>
                <Text style={styles.tableCell}>{interventionProgress}</Text>
                <View style={[styles.tableCellSupport, getSupportStyle(supportLevel)]}>
                  {renderSupportLevelCheckmarks(supportLevel)}
                </View>
              <Text style={[
                styles.tableCell,
                  isMastered ? styles.statusPassed : styles.statusFailed
              ]}>
                  {isMastered ? 'MASTERED' : 'IN PROGRESS'}
              </Text>
                <Text style={styles.tableCellWide}>
                  {teacherRemarks}
              </Text>
            </View>
            );
          })}
        </View>

        {/* Intervention Details Section - Flows naturally on same page */}
        {(iepData.objectives || []).filter(obj => obj.interventionHistory?.length > 0).length > 0 && (
          <>
            <View style={[styles.sectionHeader, { marginTop: 30 }]}>
          <Text>INTERVENTION DETAILS</Text>
        </View>

        {(iepData.objectives || []).filter(obj => obj.interventionHistory?.length > 0).map((objective, categoryIndex) => {
          const totalAttempts = objective.interventionHistory?.length || 0;
          const passedAttempts = objective.interventionHistory?.filter(a => a.isPassed).length || 0;
          const finalScore = objective.latestInterventionScore || 0;
          const improvement = objective.interventionImprovement || 0;
          
          return (
                <View key={categoryIndex} style={{ marginBottom: 20, marginTop: 15 }}>
              {/* Category Header with Summary */}
              <View style={{ 
                backgroundColor: '#F3F4F6', 
                    padding: 8, 
                    marginBottom: 8, 
                borderRadius: 5 
              }}>
            <Text style={{
                  fontSize: 10,
              fontWeight: 'bold',
              color: '#3B4F81',
                      marginBottom: 3,
              textTransform: 'uppercase'
            }}>
                  {getCategoryName(objective.lesson)}
            </Text>
                    <Text style={{ fontSize: 8, color: '#374151' }}>
                  Total Attempts: {totalAttempts} | Passed: {passedAttempts} | Final Score: {finalScore}% | Improvement: {improvement}%
                </Text>
              </View>

            <View style={styles.table}>
              <View style={[styles.tableRow, styles.tableHeader]}>
                <Text style={styles.tableCell}>Attempt</Text>
                <Text style={styles.tableCell}>Score</Text>
                <Text style={styles.tableCell}>Status</Text>
                <Text style={styles.tableCell}>Date Attempted</Text>
                  <Text style={styles.tableCellWide}>Teacher Remarks</Text>
              </View>

                {(objective.interventionHistory || []).map((attempt, attemptIndex) => {
                      // Use exact same remark cleaning logic as React component
                      const cleanRemarks = extractCleanRemark(attempt.teacherRemarks) || 'No remarks';
                  
                  return (
                <View key={attemptIndex} style={styles.tableRow}>
                  <Text style={styles.tableCell}>{attempt.attemptNumber}</Text>
                  <Text style={styles.tableCell}>{attempt.score}%</Text>
                  <Text style={[
                    styles.tableCell,
                    attempt.isPassed ? styles.statusPassed : styles.statusFailed
                  ]}>
                    {attempt.isPassed ? 'PASSED' : 'FAILED'}
                  </Text>
                  <Text style={styles.tableCell}>
                    {formatDate(attempt.attemptedAt)}
                  </Text>
                      <Text style={styles.tableCellWide}>
                        {cleanRemarks}
                  </Text>
                </View>
                  );
                })}
              </View>
            </View>
          );
        })}
          </>
        )}

        {/* Signature Section - Flows naturally on same page */}
        <View style={[styles.signatureSection, { marginTop: 30 }]}>
          <View style={styles.signatureBox}>
            <View style={styles.signatureLine}></View>
            <Text style={styles.signatureLabel}>{getTeacherName()}</Text>
            <Text style={{ fontSize: 8 }}>Class Teacher</Text>
            <Text style={{ fontSize: 8 }}>Date: {formatDate(new Date())}</Text>
          </View>

          <View style={styles.signatureBox}>
            <View style={styles.signatureLine}></View>
            <Text style={styles.signatureLabel}>MS. JASMINE P. LIM</Text>
            <Text style={{ fontSize: 8 }}>School Principal</Text>
            <Text style={{ fontSize: 8 }}>Date: {formatDate(new Date())}</Text>
          </View>
        </View>
      </Page>
    </Document>
  );
};

export default IEPReportPDFRenderer;