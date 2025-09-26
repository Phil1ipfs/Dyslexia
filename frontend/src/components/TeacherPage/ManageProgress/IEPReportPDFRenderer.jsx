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
    fontSize: 6,
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
    const level = supportLevel?.toLowerCase();
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

  // Generate comprehensive summary based on reading level and performance
  const generateComprehensiveSummary = () => {
    const objectives = iepData.objectives || [];
    const readingLevel = iepData.readingLevel || 'At Grade Level';
    const studentName = getStudentName();

    // Debug: Log the actual objectives data
    console.log('PDF Renderer - Raw objectives data:', objectives);
    console.log('PDF Renderer - Reading level:', readingLevel);
    console.log('PDF Renderer - Student name:', studentName);

    objectives.forEach((obj, idx) => {
      console.log(`PDF Renderer - Objective ${idx}:`, {
        category: obj.categoryName,
        assessmentScore: obj.assessmentScore,
        score: obj.score,
        latestInterventionScore: obj.latestInterventionScore,
        interventionImprovement: obj.interventionImprovement,
        interventionAttempts: obj.interventionAttempts,
        isPassed: obj.isPassed,
        latestInterventionPassed: obj.latestInterventionPassed
      });
    });

    // Calculate performance metrics
    const passedCount = objectives.filter(obj => obj.latestInterventionPassed || obj.isPassed).length;
    const totalCount = objectives.length;
    const totalInterventionAttempts = objectives.reduce((sum, obj) => sum + (obj.interventionAttempts || obj.interventionHistory?.length || 0), 0);
    
    // Reading level descriptions based on CLAUDE.md
    const readingLevelDescriptions = {
      'Low Emerging': {
        title: 'Learning the Alphabet',
        description: 'Foundational letter recognition skills',
        focus: 'Can you recognize letters A, B, C...?',
        categories: ['Alphabet Knowledge']
      },
      'High Emerging': {
        title: 'Letters + Sounds',
        description: 'Letter recognition with basic sound awareness',
        focus: 'Letters + Can you hear the difference between "B" and "P"?',
        categories: ['Alphabet Knowledge', 'Phonological Awareness']
      },
      'Developing': {
        title: 'Building Words',
        description: 'Phonetic decoding and word building skills',
        focus: 'Previous + Can you sound out "C-A-T" = "cat"?',
        categories: ['Alphabet Knowledge', 'Phonological Awareness', 'Decoding']
      },
      'Transitioning': {
        title: 'Recognizing Words',
        description: 'Automatic word recognition and fluency',
        focus: 'Previous + Can you recognize "cat" without sounding it out?',
        categories: ['Alphabet Knowledge', 'Phonological Awareness', 'Decoding', 'Word Recognition']
      },
      'At Grade Level': {
        title: 'Understanding Stories',
        description: 'Complete reading comprehension and analysis',
        focus: 'Previous + Can you understand what you read?',
        categories: ['Alphabet Knowledge', 'Phonological Awareness', 'Decoding', 'Word Recognition', 'Reading Comprehension']
      }
    };

    const levelInfo = readingLevelDescriptions[readingLevel] || readingLevelDescriptions['At Grade Level'];

    // Generate detailed performance analysis
    const performanceAnalysis = objectives.map(obj => {
      const categoryName = obj.categoryName;
      const initialScore = Math.round(obj.assessmentScore || obj.score || 0);

      // Calculate realistic final score based on actual data - NO 100% JUMPS
      let finalScore = initialScore;

      if (obj.latestInterventionScore && obj.latestInterventionScore > 0 && obj.latestInterventionScore <= 100) {
        // Use actual intervention score if available and realistic
        finalScore = Math.round(obj.latestInterventionScore);
      } else if (obj.interventionImprovement && obj.interventionImprovement > 0) {
        // Use calculated improvement
        finalScore = Math.min(95, Math.round(initialScore + obj.interventionImprovement));
      } else if (obj.isPassed || obj.latestInterventionPassed) {
        // If passed but no specific score, assume reasonable improvement to passing level
        const minPassingScore = 75;
        const reasonableImprovement = Math.min(35, minPassingScore - initialScore); // Max 35% improvement
        finalScore = Math.max(minPassingScore, initialScore + reasonableImprovement);
      }

      // Ensure final score is realistic (never jump more than 50% unless there's data to support it)
      const maxReasonableImprovement = 50;
      if (finalScore - initialScore > maxReasonableImprovement && !obj.latestInterventionScore) {
        finalScore = initialScore + maxReasonableImprovement;
      }

      // Calculate realistic improvement
      const improvement = Math.max(0, finalScore - initialScore);
      const attempts = Math.max(0, obj.interventionAttempts || obj.interventionHistory?.length || 0);
      const isMastered = obj.latestInterventionPassed || obj.isPassed || finalScore >= 75;
      
      // Category-specific analysis based on CLAUDE.md
      const categoryDescriptions = {
        'Alphabet Knowledge': {
          skill: 'letter recognition and letter-sound correspondence',
          importance: 'foundational skill for all reading development'
        },
        'Phonological Awareness': {
          skill: 'sound discrimination and phonemic awareness',
          importance: 'critical for developing decoding abilities'
        },
        'Decoding': {
          skill: 'phonetic word reading and structural analysis',
          importance: 'essential for reading unfamiliar words'
        },
        'Word Recognition': {
          skill: 'automatic sight word recognition and context clues',
          importance: 'enables reading fluency and comprehension'
        },
        'Reading Comprehension': {
          skill: 'literal and inferential understanding of text',
          importance: 'ultimate goal of reading instruction'
        }
      };

      const catInfo = categoryDescriptions[categoryName] || { skill: 'reading skills', importance: 'important for reading development' };

    return {
        category: categoryName,
        initialScore,
        finalScore,
        improvement,
        attempts,
        isMastered,
        skill: catInfo.skill,
        importance: catInfo.importance
      };
    });

    const summaryData = {
      readingLevel: {
        level: readingLevel,
        title: levelInfo.title,
        description: levelInfo.description,
        focus: levelInfo.focus,
        categories: levelInfo.categories
      },

      // DYNAMIC achievement description based on actual reading level
      achievement: `${studentName} is currently working at the "${readingLevel}" level (${levelInfo.title}), demonstrating ${passedCount === totalCount ? 'complete mastery' : 'progress'} across ${passedCount} of ${totalCount} ${readingLevel.toLowerCase()} literacy domains. This level focuses on ${levelInfo.focus.toLowerCase()}.`,

      // DYNAMIC initial assessment description based on actual categories
      performanceOverview: `The student's initial assessment at the ${readingLevel} level revealed varying proficiency across the ${totalCount} required domains: ${performanceAnalysis.map(p => `${p.category} (${p.initialScore}%)`).join(', ')}. ${totalInterventionAttempts > 0 ? 'These scores identified specific areas requiring targeted intervention support.' : 'Performance was sufficient for this reading level.'}`,

      // DYNAMIC intervention journey based on actual attempts
      interventionJourney: totalInterventionAttempts > 0
        ? `${studentName} completed ${totalInterventionAttempts} intervention attempts across ${performanceAnalysis.filter(p => p.attempts > 0).length} categories. Intervention sequence: ${performanceAnalysis.filter(p => p.attempts > 0).map(p => `${p.category} (${p.attempts} attempts)`).join(', ')}.`
        : `${studentName} achieved satisfactory performance on initial assessment without requiring intervention support.`,

      // DYNAMIC mastery achievement based on actual improvement
      detailedAnalysis: `${studentName} ${passedCount === totalCount ? 'successfully mastered' : `made progress in ${passedCount} of ${totalCount}`} ${readingLevel.toLowerCase()} reading categories${performanceAnalysis.some(p => p.improvement > 0) ? `, with an average improvement of ${Math.round(performanceAnalysis.reduce((sum, p) => sum + p.improvement, 0) / performanceAnalysis.length)}% across intervention categories` : ''}. ${passedCount === totalCount ? 'All required skills for this level have been demonstrated.' : `Additional work needed in ${totalCount - passedCount} categories.`}`,

      // DYNAMIC next steps based on reading level and performance
      nextSteps: (() => {
        if (passedCount === totalCount) {
          if (readingLevel === 'At Grade Level') {
            return `Maximum reading level achieved. ${studentName} demonstrates mastery of all fundamental literacy skills and is ready for grade-level reading materials, independent reading, and continued academic advancement.`;
          } else {
            return `${readingLevel} level completed successfully. ${studentName} is ready to progress to the next reading level with more advanced literacy skills.`;
          }
        } else {
          const failedCategories = performanceAnalysis.filter(p => !p.isMastered).map(p => p.category);
          return `Continued intervention support recommended for: ${failedCategories.join(', ')}. Focus on mastering these ${readingLevel.toLowerCase()} level skills before progressing.`;
        }
      })()
    };

    // Debug: Log the generated summary to verify it's professional format
    console.log('PDF Renderer - Generated Professional Summary:');
    console.log('  Achievement:', summaryData.achievement);
    console.log('  Performance Overview:', summaryData.performanceOverview);
    console.log('  Intervention Journey:', summaryData.interventionJourney);
    console.log('  Detailed Analysis:', summaryData.detailedAnalysis);
    console.log('  Next Steps:', summaryData.nextSteps);

    return summaryData;
  };

  const summary = generateComprehensiveSummary();

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

        {/* Comprehensive Summary Paragraph */}
        <View style={styles.summaryParagraph}>
          <Text>
            {getStudentName()} is currently working at the "{summary.readingLevel.level}" level ({summary.readingLevel.title}), demonstrating {summary.achievement.toLowerCase()}. {summary.performanceOverview} {summary.interventionJourney} {summary.detailedAnalysis} {summary.nextSteps}
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
            <Text style={styles.legendItem}>Min | Mod | Ext</Text>
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

            // Get support level (Min/Mod/Ext)
            const supportLevel = objective.supportLevel || 'Min';
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