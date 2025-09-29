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

  // Get student name
  const getStudentName = () => {
    console.log('PDF Renderer - Getting student name from:', {
      studentId: iepData?.studentId,
      studentName: iepData?.studentName,
      student: iepData?.student
    });
    
    if (iepData.studentId?.firstName && iepData.studentId?.lastName) {
      const name = `${iepData.studentId.firstName} ${iepData.studentId.lastName}`;
      console.log('PDF Renderer - Using studentId name:', name);
      return name;
    }
    if (iepData.studentName) {
      console.log('PDF Renderer - Using studentName:', iepData.studentName);
      return iepData.studentName;
    }
    if (iepData.student?.firstName && iepData.student?.lastName) {
      const name = `${iepData.student.firstName} ${iepData.student.lastName}`;
      console.log('PDF Renderer - Using student name:', name);
      return name;
    }
    console.log('PDF Renderer - No student name found, using fallback');
    return 'Student Name Not Available';
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

        {/* Comprehensive Summary - Same Logic as React Component */}
        <View style={styles.summaryParagraph}>
          <Text>
            {(() => {
              if (!iepData?.objectives || iepData.objectives.length === 0) {
                return `${getStudentName()} requires comprehensive assessment data to establish baseline performance and intervention needs.`;
              }

              const studentName = getStudentName();
              const currentIepData = iepData;

              // Calculate performance metrics for more detailed analysis
              const averageScore = currentIepData.objectives.reduce((sum, obj) => sum + (obj.assessmentScore || obj.score || 0), 0) / currentIepData.objectives.length;
              const performanceRange = Math.round(averageScore);

              const availableCategories = currentIepData.objectives.map(obj => obj.categoryName);
              // Check mastery considering both initial assessment AND intervention success
              const passedCategories = currentIepData.objectives.filter(obj => obj.isPassed || obj.latestInterventionPassed);
              const allPassed = passedCategories.length === availableCategories.length && availableCategories.length > 0;

              // Reading Level Achievement Summary
              let summary = `Reading Level Achievement: ${studentName} is currently functioning at the ${currentIepData?.readingLevel || 'Not Assessed'} reading level`;

              if (allPassed) {
                summary += `, demonstrating complete mastery across all ${availableCategories.length} assessed literacy domain${availableCategories.length > 1 ? 's' : ''}: ${availableCategories.join(', ')}. With an average performance of ${performanceRange}%, this achievement reflects strong foundational reading skills and readiness for advancement to the next developmental reading level.`;
              } else {
                // Check for domains that still need work (failed both initial AND intervention)
                const pendingCategories = currentIepData.objectives.filter(obj => !obj.isPassed && !obj.latestInterventionPassed);
                const pendingCategoryNames = pendingCategories.map(obj => obj.categoryName);
                const pendingScores = pendingCategories.map(obj => `${obj.categoryName} (${obj.assessmentScore || obj.score || 0}%)`);

                summary += `, requiring targeted development in ${pendingCategoryNames.length} critical literacy domain${pendingCategoryNames.length > 1 ? 's' : ''}: ${pendingScores.join(', ')}. Current performance indicates specific skill gaps that benefit from systematic intervention approaches. The average assessment performance of ${performanceRange}% suggests ${performanceRange >= 50 ? 'emerging competencies that can be strengthened' : 'foundational skills requiring intensive support'} through evidence-based instructional strategies.`;
              }

              // Initial Assessment Performance
              const performanceDetails = currentIepData.objectives.map(obj => {
                const score = obj.assessmentScore || obj.score || 0;
                const questionData = obj.totalQuestions ? ` (${obj.correctAnswers || 0}/${obj.totalQuestions} questions correct)` : '';
                return `${obj.categoryName}: ${score}%${questionData}`;
              });

              const failedCategories = currentIepData.objectives.filter(obj => !obj.isPassed);

              summary += ` Initial Assessment Performance: The comprehensive initial assessment revealed the following detailed performance profile: ${performanceDetails.join('; ')}.`;

              if (failedCategories.length > 0) {
                const interventionCategoriesDetails = failedCategories.map(obj => {
                  const score = obj.assessmentScore || obj.score || 0;
                  if (score < 25) return `${obj.categoryName} (significant challenge at ${score}%)`;
                  else if (score < 50) return `${obj.categoryName} (moderate difficulty at ${score}%)`;
                  else return `${obj.categoryName} (approaching proficiency at ${score}%)`;
                });

                summary += ` Assessment results indicate ${failedCategories.length} domain${failedCategories.length > 1 ? 's' : ''} requiring intervention: ${interventionCategoriesDetails.join(', ')}.`;
              }

              // Add concise intervention and status summary
              const totalAttempts = currentIepData.objectives.reduce((total, obj) => total + (obj.interventionAttempts || 0), 0);
              const categoriesWithInterventions = currentIepData.objectives.filter(obj => obj.hasIntervention && obj.interventionAttempts > 0);

              if (totalAttempts > 0) {
                const interventionDetails = categoriesWithInterventions.map(obj => {
                  const improvementData = obj.interventionImprovement !== undefined ? ` with ${obj.interventionImprovement >= 0 ? '+' : ''}${obj.interventionImprovement}% improvement` : '';
                  const latestScore = obj.latestInterventionScore ? ` (latest: ${obj.latestInterventionScore}%)` : '';
                  return `${obj.categoryName} (${obj.interventionAttempts} attempt${obj.interventionAttempts > 1 ? 's' : ''}${improvementData}${latestScore})`;
                });

                const successfulInterventions = categoriesWithInterventions.filter(obj => obj.latestInterventionPassed);

                summary += ` Intervention Progress: ${studentName} has actively engaged in ${totalAttempts} intervention session${totalAttempts > 1 ? 's' : ''} across ${categoriesWithInterventions.length} literacy domain${categoriesWithInterventions.length > 1 ? 's' : ''}: ${interventionDetails.join('; ')}.`;

                if (successfulInterventions.length > 0) {
                  summary += ` Successfully achieved mastery in ${successfulInterventions.length} domain${successfulInterventions.length > 1 ? 's' : ''} (${successfulInterventions.map(obj => obj.categoryName).join(', ')}).`;
                }
              }

              // Add current status (considering both initial assessment AND intervention success)
              if (allPassed) {
                summary += ` Current Status: Complete mastery achieved - ready for reading level advancement.`;
              } else {
                const needingWork = currentIepData.objectives.filter(obj => !obj.isPassed && !obj.latestInterventionPassed);
                summary += ` Current Status: ${needingWork.length} domain${needingWork.length > 1 ? 's' : ''} requiring continued intervention support.`;
              }

              return summary;
            })()}
          </Text>
        </View>
      </Page>

      {/* Page 2: Learning Objectives and Progress */}
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

          {/* Table Rows */}
          {(iepData.objectives || []).map((objective, index) => {
            const initialScore = objective.assessmentScore || objective.score || 0;
            const interventionScore = objective.latestInterventionScore || 0;
            const attempts = objective.interventionAttempts || 0;
            const isMastered = objective.latestInterventionPassed || objective.isPassed;

            // Get support level (preserve null values)
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

            // Format intervention progress
            const interventionProgress = interventionScore > 0 ?
              `${interventionScore}% (${attempts > 0 ? `${attempts} attempts` : 'completed'})` :
              (attempts > 0 ? `In progress (${attempts} attempts)` : 'Not started');

            // Get teacher remarks from main assessment or intervention history
            const teacherRemarks = objective.remarks ||
              objective.mainAssessmentRemarks ||
              objective.interventionHistory?.find(h => h.teacherRemarks)?.teacherRemarks ||
              'No remarks added';

            // Clean up remarks (remove file paths)
            const cleanRemarks = teacherRemarks.replace(/\/Users.*$/, '').trim() || 'No remarks added';

            return (
            <View key={index} style={styles.tableRow}>
              <Text style={styles.tableCell}>{objective.categoryName}</Text>
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
                  {cleanRemarks}
              </Text>
            </View>
            );
          })}
        </View>
      </Page>

      {/* Page 3: Intervention Details */}
      <Page size="A4" style={styles.page}>
        <View style={[styles.sectionHeader, { marginTop: 20 }]}>
          <Text>INTERVENTION DETAILS</Text>
        </View>

        {(iepData.objectives || []).filter(obj => obj.interventionHistory?.length > 0).map((objective, categoryIndex) => {
          const totalAttempts = objective.interventionHistory?.length || 0;
          const passedAttempts = objective.interventionHistory?.filter(a => a.isPassed).length || 0;
          const finalScore = objective.latestInterventionScore || 0;
          const improvement = objective.interventionImprovement || 0;
          
          return (
            <View key={categoryIndex} style={{ marginBottom: 30, marginTop: 15 }}>
              {/* Category Header with Summary */}
              <View style={{ 
                backgroundColor: '#F3F4F6', 
                padding: 10, 
                marginBottom: 10, 
                borderRadius: 5 
              }}>
            <Text style={{
              fontSize: 12,
              fontWeight: 'bold',
              color: '#3B4F81',
                  marginBottom: 5,
              textTransform: 'uppercase'
            }}>
              {objective.categoryName}
            </Text>
                <Text style={{ fontSize: 9, color: '#374151' }}>
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
                  const cleanRemarks = attempt.teacherRemarks?.replace(/\/Users.*$/, '').trim() || 'No remarks';
                  
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

        {/* Signature Section */}
        <View style={styles.signatureSection}>
          <View style={styles.signatureBox}>
            <View style={styles.signatureLine}></View>
            <Text style={styles.signatureLabel}>JAN MARK CARAM</Text>
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