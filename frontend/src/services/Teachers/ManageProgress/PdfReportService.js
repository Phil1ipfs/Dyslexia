/**
 * Enhanced Post-Assessment PDF Report Service
 * Matches pre-assessment PDF structure with professional styling
 * Includes intervention analysis and prescriptive recommendations
 */

import jsPDF from 'jspdf';
import CradleLogo from '../../../assets/images/Teachers/cradleLogo.jpg';

class PdfReportService {
  /**
   * Generate comprehensive post-assessment PDF report
   */
  static async generateProgressReport(studentData, progressData, responsesData, assessmentQuestions = [], onProgress = () => {}) {
    try {
      onProgress('Initializing PDF document...', 10);
      console.log('Generating post-assessment PDF with enhanced structure...');
      
      // Use proper short bond paper format (8.5" x 11")
      const pdf = new jsPDF('p', 'mm', [216, 279]); 
      const pageWidth = pdf.internal.pageSize.getWidth();
      const pageHeight = pdf.internal.pageSize.getHeight();
      const margin = 15;
      const bottomMargin = 25;

      let currentY = margin;

      onProgress('Adding professional header...', 20);
      // Add Cradle of Learners header with proper styling
      currentY = await this.addProfessionalHeader(pdf, pageWidth, margin, currentY);
      
      onProgress('Adding student information...', 30);
      // Add clean student information section
      currentY = this.addStudentInformationSection(pdf, studentData, progressData, pageWidth, margin, currentY);
      
      onProgress('Adding assessment overview...', 40);
      // Add professional assessment overview
      currentY = this.addAssessmentOverviewSection(pdf, progressData, responsesData, pageWidth, margin, currentY);
      
      onProgress('Processing question analysis...', 60);
      // Add comprehensive question-by-question analysis
      currentY = this.addQuestionByQuestionAnalysis(pdf, progressData, responsesData, assessmentQuestions, pageWidth, pageHeight, margin, bottomMargin, currentY);
      
      onProgress('Adding intervention analysis...', 80);
      // Add post-assessment specific sections
      currentY = this.addInterventionAnalysisSection(pdf, progressData, responsesData, pageWidth, pageHeight, margin, bottomMargin, currentY);
      
      onProgress('Adding prescriptive analysis...', 90);
      // Add prescriptive analysis section
      currentY = this.addPrescriptiveAnalysisSection(pdf, progressData, responsesData, pageWidth, pageHeight, margin, bottomMargin, currentY);
      
      onProgress('Finalizing report...', 95);
      // Add professional footer
      this.addProfessionalFooter(pdf, pageWidth, pageHeight, margin);
      
      onProgress('PDF generation completed!', 100);
      
      return pdf.output('blob');
      
    } catch (error) {
      console.error('Error generating post-assessment PDF:', error);
      throw error;
    }
  }

  /**
   * Add professional header matching pre-assessment style
   */
  static async addProfessionalHeader(pdf, pageWidth, margin, currentY) {
    try {
      // Logo - centered at top
      const logoSize = 25;
      const logoX = (pageWidth - logoSize) / 2;
      
      pdf.addImage(CradleLogo, 'JPEG', logoX, currentY, logoSize, logoSize);
      
      let yPos = currentY + logoSize + 8;
      
      // School name - large bold
      pdf.setFontSize(16);
      pdf.setFont('helvetica', 'bold');
      pdf.setTextColor(0, 0, 0);
      pdf.text('CRADLE OF LEARNERS', pageWidth / 2, yPos, { align: 'center' });
      
      yPos += 6;
      pdf.setFontSize(11);
      pdf.setFont('helvetica', 'italic');
      pdf.setTextColor(60, 60, 60);
      pdf.text('(Inclusive School for Individualized Education), Inc.', pageWidth / 2, yPos, { align: 'center' });
      
      yPos += 6;
      pdf.setFontSize(9);
      pdf.setFont('helvetica', 'normal');
      pdf.setTextColor(80, 80, 80);
      pdf.text('3rd Floor TUCP Bldg. Elliptical Road Corner Maharlika St. Quezon City', pageWidth / 2, yPos, { align: 'center' });
      
      yPos += 5;
      pdf.text('Tel: 8294-7772 | Email: cradle.of.learners@gmail.com', pageWidth / 2, yPos, { align: 'center' });
      
      // Professional divider line
      yPos += 8;
      pdf.setLineWidth(0.8);
      pdf.setDrawColor(74, 84, 148);
      pdf.line(margin, yPos, pageWidth - margin, yPos);
      
      // Title section with blue background
      yPos += 6;
      const titleHeight = 12;
      pdf.setFillColor(74, 84, 148);
      pdf.rect(margin, yPos, pageWidth - (margin * 2), titleHeight, 'F');
      
      pdf.setTextColor(255, 255, 255);
      pdf.setFontSize(12);
      pdf.setFont('helvetica', 'bold');
      pdf.text('POST-ASSESSMENT PROGRESS REPORT', pageWidth / 2, yPos + 8, { align: 'center' });
      
      // School year
      yPos += titleHeight + 8;
      pdf.setTextColor(0, 0, 0);
      pdf.setFontSize(10);
      pdf.setFont('helvetica', 'bold');
      pdf.text('School Year 2024-2025', pageWidth / 2, yPos, { align: 'center' });
      
      return yPos + 15;
    } catch (error) {
      console.error('Error adding header:', error);
      return currentY + 80; // Fallback height
    }
  }

  /**
   * Add clean student information section
   */
  static addStudentInformationSection(pdf, studentData, progressData, pageWidth, margin, currentY) {
    let yPos = currentY + 5;
    
    // Create clean information box
    const boxHeight = 48;
    pdf.setFillColor(255, 255, 255);
    pdf.setDrawColor(150, 150, 150);
    pdf.setLineWidth(0.5);
    pdf.rect(margin, yPos, pageWidth - (margin * 2), boxHeight);
    
    yPos += 8;
    
    // Grid layout for student information
    const leftCol = margin + 8;
    const rightCol = pageWidth / 2 + 5;
    const rowSpacing = 10;
    
    // Row 1
    pdf.setFontSize(9);
    pdf.setFont('helvetica', 'bold');
    pdf.setTextColor(74, 84, 148);
    pdf.text('Student Name:', leftCol, yPos);
    
    pdf.setFont('helvetica', 'normal');
    pdf.setTextColor(0, 0, 0);
    const studentName = studentData.fullName || `Student ${progressData.studentId || 'Unknown'}`;
    pdf.text(studentName, leftCol + 30, yPos);
    
    pdf.setFont('helvetica', 'bold');
    pdf.setTextColor(74, 84, 148);
    pdf.text('Age:', rightCol, yPos);
    
    pdf.setFont('helvetica', 'normal');
    pdf.setTextColor(0, 0, 0);
    pdf.text('6', rightCol + 12, yPos);
    
    yPos += rowSpacing;
    
    // Row 2
    pdf.setFont('helvetica', 'bold');
    pdf.setTextColor(74, 84, 148);
    pdf.text('Grade Level:', leftCol, yPos);
    
    pdf.setFont('helvetica', 'normal');
    pdf.setTextColor(0, 0, 0);
    pdf.text('Grade 1', leftCol + 30, yPos);
    
    pdf.setFont('helvetica', 'bold');
    pdf.setTextColor(74, 84, 148);
    pdf.text('Gender:', rightCol, yPos);
    
    pdf.setFont('helvetica', 'normal');
    pdf.setTextColor(0, 0, 0);
    pdf.text('Female', rightCol + 18, yPos);
    
    yPos += rowSpacing;
    
    // Row 3
    pdf.setFont('helvetica', 'bold');
    pdf.setTextColor(74, 84, 148);
    pdf.text('Parent/Guardian:', leftCol, yPos);
    
    pdf.setFont('helvetica', 'normal');
    pdf.setTextColor(0, 0, 0);
    pdf.text('Parent', leftCol + 40, yPos);
    
    pdf.setFont('helvetica', 'bold');
    pdf.setTextColor(74, 84, 148);
    pdf.text('Report Date:', rightCol, yPos);
    
    pdf.setFont('helvetica', 'normal');
    pdf.setTextColor(0, 0, 0);
    const reportDate = new Date().toLocaleDateString('en-US', {
      month: 'long',
      day: 'numeric',
      year: 'numeric'
    });
    pdf.text(reportDate, rightCol + 28, yPos);
    
    yPos += rowSpacing;
    
    // Row 4
    pdf.setFont('helvetica', 'bold');
    pdf.setTextColor(74, 84, 148);
    pdf.text('Reading Level:', leftCol, yPos);
    
    pdf.setFont('helvetica', 'normal');
    pdf.setTextColor(0, 0, 0);
    const readingLevel = progressData.readingLevel || 'High Emerging';
    pdf.text(readingLevel, leftCol + 32, yPos);
    
    pdf.setFont('helvetica', 'bold');
    pdf.setTextColor(74, 84, 148);
    pdf.text('Last Assessment:', rightCol, yPos);
    
    pdf.setFont('helvetica', 'normal');
    pdf.setTextColor(0, 0, 0);
    const lastAssessment = progressData.assessmentDate ? 
      new Date(progressData.assessmentDate).toLocaleDateString('en-US', {
        month: 'long',
        day: 'numeric',
        year: 'numeric'
      }) : 
      'September 10, 2025';
    pdf.text(lastAssessment, rightCol + 35, yPos);
    
    return yPos + 20;
  }

  /**
   * Add professional assessment overview with cards
   */
  static addAssessmentOverviewSection(pdf, progressData, responsesData, pageWidth, margin, currentY) {
    let yPos = currentY;
    
    // Calculate actual performance metrics
    const totalQuestions = responsesData.length;
    const correctAnswers = responsesData.filter(r => r.isCorrect).length;
    const overallPercentage = totalQuestions > 0 ? Math.round((correctAnswers / totalQuestions) * 100) : 0;
    const readingLevel = progressData.readingLevel || 'High Emerging';
    
    // Determine reading level color
    let levelColor = [76, 175, 80]; // Green default
    if (readingLevel.toLowerCase().includes('emerging')) {
      levelColor = [76, 175, 80]; // Green
    }
    
    // Header with reading level badge
    const headerHeight = 12;
    const badgeWidth = 35;
    pdf.setFillColor(74, 84, 148);
    pdf.rect(margin, yPos, pageWidth - (margin * 2) - badgeWidth - 8, headerHeight, 'F');
    
    pdf.setTextColor(255, 255, 255);
    pdf.setFontSize(11);
    pdf.setFont('helvetica', 'bold');
    pdf.text('ASSESSMENT OVERVIEW', margin + 8, yPos + 8);
    
    // Reading level badge
    pdf.setFillColor(levelColor[0], levelColor[1], levelColor[2]);
    pdf.rect(pageWidth - margin - badgeWidth - 5, yPos + 1, badgeWidth, headerHeight - 2, 'F');
    
    pdf.setTextColor(255, 255, 255);
    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(8);
    pdf.text(readingLevel.toUpperCase(), pageWidth - margin - (badgeWidth / 2) - 5, yPos + 7, { align: 'center' });
    
    yPos += headerHeight + 10;
    
    // Overview cards - more compact design
    const cardWidth = (pageWidth - margin * 2 - 20) / 3;
    const cardHeight = 28; // reduced height
    
    // Overall Score Card
    this.addOverviewCard(pdf, margin, yPos, cardWidth, cardHeight,
      'OVERALL SCORE', `${correctAnswers}/${totalQuestions}`, 'Questions Answered');
    
    // Reading Level Card  
    this.addOverviewCard(pdf, margin + cardWidth + 10, yPos, cardWidth, cardHeight,
      'READING LEVEL', readingLevel, 'Determined');
    
    // Completed Date Card
    const completedDate = new Date().toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
    this.addOverviewCard(pdf, margin + (cardWidth + 10) * 2, yPos, cardWidth, cardHeight,
      'COMPLETED ON', completedDate, 'Assessment Date');
    
    return yPos + cardHeight + 12; // reduced spacing
  }

  /**
   * Add overview card matching pre-assessment style
   */
  static addOverviewCard(pdf, x, y, width, height, title, mainValue, subValue) {
    // Card background
    pdf.setFillColor(255, 255, 255);
    pdf.rect(x, y, width, height, 'F');
    
    // Card border
    pdf.setDrawColor(200, 200, 200);
    pdf.setLineWidth(0.5);
    pdf.rect(x, y, width, height);
    
    // Title
    pdf.setFontSize(6);
    pdf.setFont('helvetica', 'bold');
    pdf.setTextColor(100, 100, 100);
    pdf.text(title, x + width / 2, y + 7, { align: 'center' });
    
    // Main value
    pdf.setFontSize(10);
    pdf.setFont('helvetica', 'bold');
    pdf.setTextColor(74, 84, 148);
    pdf.text(mainValue, x + width / 2, y + 15, { align: 'center' });
    
    // Sub value
    pdf.setFontSize(6);
    pdf.setFont('helvetica', 'normal');
    pdf.setTextColor(120, 120, 120);
    pdf.text(subValue, x + width / 2, y + 22, { align: 'center' });
    
    pdf.setTextColor(0, 0, 0); // Reset
  }

  /**
   * Add comprehensive question-by-question analysis
   */
  static addQuestionByQuestionAnalysis(pdf, progressData, responsesData, assessmentQuestions, pageWidth, pageHeight, margin, bottomMargin, currentY) {
    let yPos = currentY;
    
    // Check if we have enough space for the section header and at least one question
    // If not, start on a new page to avoid cropping
    if (yPos + 80 > pageHeight - bottomMargin) {
      pdf.addPage();
      yPos = margin;
    }
    
    // Section header
    pdf.setFillColor(74, 84, 148);
    pdf.rect(margin, yPos, pageWidth - (margin * 2), 12, 'F');
    
    pdf.setTextColor(255, 255, 255);
    pdf.setFontSize(11);
    pdf.setFont('helvetica', 'bold');
    pdf.text('QUESTION-BY-QUESTION ANALYSIS', margin + 8, yPos + 8);
    
    yPos += 18;
    pdf.setTextColor(0, 0, 0);
    
    // Group responses by category
    const categorizedResponses = this.groupResponsesByCategory(responsesData);
    
    // Process each category
    for (const [categoryName, responses] of Object.entries(categorizedResponses)) {
      if (responses.length === 0) continue;
      
      // Check for new page before category header
      if (yPos + 60 > pageHeight - bottomMargin) {
        pdf.addPage();
        yPos = margin;
      }
      
      // Add category header
      yPos = this.addCategoryHeader(pdf, categoryName, responses, yPos, pageWidth, margin);
      
      // Add questions for this category  
      for (let i = 0; i < responses.length; i++) {
        const response = responses[i];
        
        // Calculate required space based on category type
        const categoryLower = categoryName.toLowerCase();
        let requiredSpace = 50; // default
        if (categoryLower.includes('phonological')) {
          requiredSpace = 65;
        } else if (categoryLower.includes('word') || categoryLower.includes('decoding')) {
          requiredSpace = 58;
        } else if (categoryLower.includes('comprehension')) {
          requiredSpace = 62;
        }
        
        if (yPos + requiredSpace > pageHeight - bottomMargin) {
          pdf.addPage();
          yPos = margin;
        }
        
        // Find question details
        const questionDetails = this.findQuestionInAssessments(response.questionId, assessmentQuestions);
        
        // Add question card
        yPos = this.addQuestionCard(pdf, response, questionDetails, i + 1, categoryName, yPos, pageWidth, margin);
        yPos += 8; // increased spacing between questions
      }
      
      yPos += 15; // increased spacing between categories
    }
    
    return yPos;
  }

  /**
   * Group responses by category
   */
  static groupResponsesByCategory(responsesData) {
    return responsesData.reduce((acc, response) => {
      const category = response.category || 'Unknown Category';
      if (!acc[category]) acc[category] = [];
      acc[category].push(response);
      return acc;
    }, {});
  }

  /**
   * Add category header with performance summary
   */
  static addCategoryHeader(pdf, categoryName, responses, yPos, pageWidth, margin) {
    // Calculate performance
    let correct = 0;
    let total = 0;
    
    if (categoryName.toLowerCase().includes('phonological')) {
      // For phonological awareness - sum matches
      correct = responses.reduce((sum, r) => sum + (r.correctMatches || 0), 0);
      total = responses.reduce((sum, r) => sum + (r.totalMatches || 0), 0);
    } else {
      // For other categories - count correct responses
      correct = responses.filter(r => r.isCorrect).length;
      total = responses.length;
    }
    
    const percentage = total > 0 ? Math.round((correct / total) * 100) : 0;
    
    // Category header background
    pdf.setFillColor(240, 240, 240);
    pdf.setDrawColor(180, 180, 180);
    pdf.setLineWidth(0.5);
    pdf.rect(margin, yPos, pageWidth - (margin * 2), 12, 'FD');
    
    // Category name
    pdf.setFontSize(9);
    pdf.setFont('helvetica', 'bold');
    pdf.setTextColor(0, 0, 0);
    pdf.text(categoryName, margin + 6, yPos + 8);
    
    // Performance summary  
    pdf.setFontSize(8);
    pdf.setFont('helvetica', 'normal');
    const summaryText = `${correct}/${total} correct (${percentage}%)`;
    const summaryWidth = pdf.getTextWidth(summaryText);
    pdf.text(summaryText, pageWidth - margin - summaryWidth - 6, yPos + 8);
    
    return yPos + 18;
  }

  /**
   * Add individual question card matching pre-assessment format
   */
  static addQuestionCard(pdf, response, questionDetails, questionNumber, categoryName, yPos, pageWidth, margin) {
    const categoryLower = categoryName.toLowerCase();
    
    // Determine card height based on category type
    let cardHeight = 40; // default
    if (categoryLower.includes('phonological')) {
      cardHeight = 55;
    } else if (categoryLower.includes('word') || categoryLower.includes('decoding')) {
      cardHeight = 48;
    } else if (categoryLower.includes('comprehension')) {
      cardHeight = 52;
    }
    
    // Question card background
    pdf.setFillColor(255, 255, 255);
    pdf.setDrawColor(180, 180, 180);
    pdf.setLineWidth(0.5);
    pdf.rect(margin, yPos, pageWidth - (margin * 2), cardHeight, 'FD');
    
    // Question header
    let headerY = yPos + 8;
    pdf.setFontSize(8);
    pdf.setFont('helvetica', 'bold');
    pdf.setTextColor(0, 0, 0);
    pdf.text(`Question ${questionNumber}`, margin + 6, headerY);
    
    // Question ID
    pdf.setFontSize(7);
    pdf.setFont('helvetica', 'normal');
    pdf.text(`ID: ${response.questionId}`, margin + 50, headerY);
    
    // Status badge
    const isCorrect = response.isCorrect;
    const statusText = isCorrect ? 'CORRECT' : 'INCORRECT';
    const statusColor = isCorrect ? [76, 175, 80] : [244, 67, 54];
    const badgeWidth = 22;
    
    pdf.setFillColor(statusColor[0], statusColor[1], statusColor[2]);
    pdf.rect(pageWidth - margin - badgeWidth - 6, yPos + 3, badgeWidth, 8, 'F');
    
    pdf.setTextColor(255, 255, 255);
    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(6);
    pdf.text(statusText, pageWidth - margin - (badgeWidth / 2) - 6, yPos + 7, { align: 'center' });
    
    // Question text
    let contentY = headerY + 8;
    pdf.setFontSize(8);
    pdf.setTextColor(0, 0, 0);
    pdf.setFont('helvetica', 'normal');
    
    const questionText = questionDetails?.questionText || 'Question text not available';
    const wrappedText = this.wrapText(pdf, questionText, pageWidth - (margin * 2) - 12, 8);
    
    if (wrappedText.length > 0) {
      pdf.text(`Question: ${wrappedText[0]}`, margin + 6, contentY);
      if (wrappedText.length > 1) {
        contentY += 5;
        pdf.text(wrappedText[1], margin + 20, contentY);
      }
    }
    
    contentY += 8;
    
    // Category-specific formatting
    if (categoryLower.includes('phonological')) {
      contentY = this.addPhonologicalAwarenessDetails(pdf, response, questionDetails, margin, contentY);
    } else if (categoryLower.includes('decoding')) {
      contentY = this.addDecodingDetails(pdf, response, questionDetails, margin, contentY, isCorrect);
    } else if (categoryLower.includes('word')) {
      contentY = this.addWordRecognitionDetails(pdf, response, questionDetails, margin, contentY, isCorrect);
    } else if (categoryLower.includes('comprehension')) {
      contentY = this.addReadingComprehensionDetails(pdf, response, questionDetails, margin, contentY, isCorrect);
    } else {
      // Default format for Alphabet Knowledge and others
      contentY = this.addStandardAnswerFormat(pdf, response, questionDetails, margin, contentY, isCorrect);
    }
    
    // Response time
    contentY += 6;
    pdf.setFontSize(7);
    pdf.setTextColor(100, 100, 100);
    const responseTime = this.formatResponseTime(response.responseTime);
    pdf.text(`Response Time: ${responseTime}`, margin + 6, contentY);
    
    pdf.setTextColor(0, 0, 0); // Reset
    
    return yPos + cardHeight;
  }

  /**
   * Add phonological awareness specific details
   */
  static addPhonologicalAwarenessDetails(pdf, response, questionDetails, margin, contentY) {
    pdf.setFontSize(7);
    pdf.setFont('helvetica', 'bold');
    pdf.setTextColor(0, 0, 0);
    pdf.text('Audio Text: Pakinggan ang audio. Itugma ito sa katumbas na letra sa kabilang hanay.', margin + 6, contentY);
    
    contentY += 7;
    pdf.setFont('helvetica', 'normal');
    pdf.text(`Student's Matches: ${response.correctMatches || 0}/${response.totalMatches || 0} correct matches`, margin + 6, contentY);
    
    // Show detailed matching if available
    if (Array.isArray(response.response) && response.response.length > 0) {
      contentY += 6;
      pdf.setFontSize(6);
      const matchingPairs = response.response.slice(0, 3).map(pair => {
        const key = Object.keys(pair)[0];
        const value = pair[key];
        return `${key}→${value}`;
      }).join(', ');
      pdf.text(`Matches: ${matchingPairs}`, margin + 6, contentY);
    }
    
    contentY += 6;
    pdf.setFontSize(7);
    pdf.text(`Correct Answer: All ${response.totalMatches || 0} pairs correct`, margin + 6, contentY);
    
    return contentY;
  }

  /**
   * Add decoding specific details
   */
  static addDecodingDetails(pdf, response, questionDetails, margin, contentY, isCorrect) {
    pdf.setFontSize(7);
    pdf.setFont('helvetica', 'bold');
    pdf.setTextColor(0, 0, 0);
    pdf.text('Task: Arrange letters in correct sequence', margin + 6, contentY);
    
    contentY += 7;
    pdf.setFont('helvetica', 'normal');
    
    // Show available letters
    if (questionDetails?.dragElements) {
      pdf.text(`Available Letters: ${questionDetails.dragElements.join(', ')}`, margin + 6, contentY);
      contentY += 6;
    }
    
    // Student Answer
    const studentAnswer = this.formatStudentAnswer(response, questionDetails);
    pdf.text(`Student Answer: `, margin + 6, contentY);
    pdf.setTextColor(isCorrect ? 76 : 244, isCorrect ? 175 : 67, isCorrect ? 80 : 54);
    pdf.text(studentAnswer, margin + 45, contentY);
    
    // Correct Answer  
    contentY += 6;
    pdf.setTextColor(0, 0, 0);
    pdf.text(`Correct Answer: `, margin + 6, contentY);
    pdf.setTextColor(76, 175, 80);
    const correctAnswer = this.formatCorrectAnswer(response, questionDetails);
    pdf.text(correctAnswer, margin + 45, contentY);
    
    return contentY;
  }

  /**
   * Add word recognition specific details
   */
  static addWordRecognitionDetails(pdf, response, questionDetails, margin, contentY, isCorrect) {
    pdf.setFontSize(7);
    pdf.setFont('helvetica', 'bold');
    pdf.setTextColor(0, 0, 0);
    pdf.text('Task: Complete the word/sentence', margin + 6, contentY);
    
    contentY += 7;
    pdf.setFont('helvetica', 'normal');
    
    // Show word/sentence to complete
    if (questionDetails?.displayWord) {
      pdf.text(`Complete: ${questionDetails.displayWord}`, margin + 6, contentY);
      contentY += 6;
    }
    
    // Show available options
    if (questionDetails?.blankOptions) {
      pdf.setFontSize(6);
      pdf.text(`Options: ${questionDetails.blankOptions.join(', ')}`, margin + 6, contentY);
      contentY += 6;
    }
    
    pdf.setFontSize(7);
    // Student Answer
    const studentAnswer = this.formatStudentAnswer(response, questionDetails);
    pdf.text(`Student Answer: `, margin + 6, contentY);
    pdf.setTextColor(isCorrect ? 76 : 244, isCorrect ? 175 : 67, isCorrect ? 80 : 54);
    pdf.text(studentAnswer, margin + 45, contentY);
    
    // Correct Answer  
    contentY += 6;
    pdf.setTextColor(0, 0, 0);
    pdf.text(`Correct Answer: `, margin + 6, contentY);
    pdf.setTextColor(76, 175, 80);
    const correctAnswer = this.formatCorrectAnswer(response, questionDetails);
    pdf.text(correctAnswer, margin + 45, contentY);
    
    return contentY;
  }

  /**
   * Add reading comprehension specific details
   */
  static addReadingComprehensionDetails(pdf, response, questionDetails, margin, contentY, isCorrect) {
    pdf.setFontSize(7);
    pdf.setFont('helvetica', 'bold');
    pdf.setTextColor(0, 0, 0);
    pdf.text('Task: Answer based on reading passage', margin + 6, contentY);
    
    contentY += 7;
    pdf.setFont('helvetica', 'normal');
    
    // Show story title if available
    if (questionDetails?.storyTitle) {
      pdf.text(`Story: ${questionDetails.storyTitle}`, margin + 6, contentY);
      contentY += 6;
    }
    
    // Student Answer
    const studentAnswer = this.formatStudentAnswer(response, questionDetails);
    pdf.text(`Student Answer: `, margin + 6, contentY);
    pdf.setTextColor(isCorrect ? 76 : 244, isCorrect ? 175 : 67, isCorrect ? 80 : 54);
    pdf.text(studentAnswer, margin + 45, contentY);
    
    // Correct Answer  
    contentY += 6;
    pdf.setTextColor(0, 0, 0);
    pdf.text(`Correct Answer: `, margin + 6, contentY);
    pdf.setTextColor(76, 175, 80);
    const correctAnswer = this.formatCorrectAnswer(response, questionDetails);
    pdf.text(correctAnswer, margin + 45, contentY);
    
    // Show acceptable answers if available
    if (questionDetails?.acceptableAnswers && questionDetails.acceptableAnswers.length > 1) {
      contentY += 5;
      pdf.setFontSize(6);
      pdf.setTextColor(100, 100, 100);
      pdf.text(`Acceptable: ${questionDetails.acceptableAnswers.join(', ')}`, margin + 6, contentY);
    }
    
    return contentY;
  }

  /**
   * Add standard answer format (for Alphabet Knowledge, etc.)
   */
  static addStandardAnswerFormat(pdf, response, questionDetails, margin, contentY, isCorrect) {
    const studentAnswer = this.formatStudentAnswer(response, questionDetails);
    const correctAnswer = this.formatCorrectAnswer(response, questionDetails);
    
    pdf.setFontSize(7);
    pdf.setFont('helvetica', 'normal');
    
    // Student Answer
    pdf.setTextColor(0, 0, 0);
    pdf.text(`Student Answer: `, margin + 6, contentY);
    pdf.setTextColor(isCorrect ? 76 : 244, isCorrect ? 175 : 67, isCorrect ? 80 : 54);
    pdf.text(studentAnswer, margin + 45, contentY);
    
    // Correct Answer  
    contentY += 6;
    pdf.setTextColor(0, 0, 0);
    pdf.text(`Correct Answer: `, margin + 6, contentY);
    pdf.setTextColor(76, 175, 80);
    pdf.text(correctAnswer, margin + 45, contentY);
    
    return contentY;
  }

  /**
   * Add intervention analysis section
   */
  static addInterventionAnalysisSection(pdf, progressData, responsesData, pageWidth, pageHeight, margin, bottomMargin, currentY) {
    let yPos = currentY;
    
    // Check if we need a new page
    if (yPos + 80 > pageHeight - bottomMargin) {
      pdf.addPage();
      yPos = margin;
    }
    
    // Section header
    pdf.setFillColor(255, 152, 0);
    pdf.rect(margin, yPos, pageWidth - (margin * 2), 12, 'F');
    
    pdf.setTextColor(255, 255, 255);
    pdf.setFontSize(11);
    pdf.setFont('helvetica', 'bold');
    pdf.text('INTERVENTION ANALYSIS', margin + 8, yPos + 8);
    
    yPos += 18;
    pdf.setTextColor(0, 0, 0);
    
    // Analyze categories needing intervention
    const categories = progressData.categories || [];
    const needsIntervention = categories.filter(cat => (cat.score || 0) < 75);
    
    if (needsIntervention.length > 0) {
      needsIntervention.forEach(category => {
        yPos = this.addInterventionRecommendation(pdf, category, yPos, pageWidth, margin);
        yPos += 8;
      });
    } else {
      pdf.setFontSize(9);
      pdf.setFont('helvetica', 'normal');
      pdf.text('All categories have been mastered - No immediate intervention required.', margin + 6, yPos);
      
      yPos += 10;
      pdf.text('Continue regular reading practice to maintain skills.', margin + 6, yPos);
      yPos += 15;
    }
    
    return yPos;
  }

  /**
   * Add intervention recommendation for category
   */
  static addInterventionRecommendation(pdf, category, yPos, pageWidth, margin) {
    const score = category.score || 0;
    const categoryName = category.categoryName || 'Unknown Category';
    
    // Recommendation box
    pdf.setFillColor(255, 248, 240);
    pdf.setDrawColor(255, 152, 0);
    pdf.setLineWidth(0.5);
    pdf.rect(margin, yPos, pageWidth - (margin * 2), 25, 'FD');
    
    // Category name and score
    pdf.setFontSize(9);
    pdf.setFont('helvetica', 'bold');
    pdf.setTextColor(0, 0, 0);
    pdf.text(`${categoryName} (${score}%)`, margin + 6, yPos + 8);
    
    // Status badge
    let statusText = '';
    let statusColor = [255, 152, 0];
    
    if (score < 50) {
      statusText = 'CRITICAL';
      statusColor = [244, 67, 54];
    } else {
      statusText = 'NEEDS ATTENTION';
    }
    
    const badgeWidth = 25;
    pdf.setFillColor(statusColor[0], statusColor[1], statusColor[2]);
    pdf.rect(pageWidth - margin - badgeWidth - 6, yPos + 3, badgeWidth, 8, 'F');
    
    pdf.setTextColor(255, 255, 255);
    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(6);
    pdf.text(statusText, pageWidth - margin - (badgeWidth / 2) - 6, yPos + 7, { align: 'center' });
    
    // Recommendation text
    let recommendation = '';
    if (score < 50) {
      recommendation = `Intensive daily intervention required. Focus on foundational ${categoryName.toLowerCase()} skills with one-on-one instruction.`;
    } else if (score < 65) {
      recommendation = `Targeted small group instruction needed. Practice ${categoryName.toLowerCase()} skills 3-4 times weekly.`;
    } else {
      recommendation = `Additional practice recommended. Continue guided ${categoryName.toLowerCase()} activities.`;
    }
    
    pdf.setFontSize(8);
    pdf.setFont('helvetica', 'normal');
    pdf.setTextColor(0, 0, 0);
    const wrappedText = this.wrapText(pdf, recommendation, pageWidth - (margin * 2) - 20, 8);
    
    let textY = yPos + 15;
    wrappedText.forEach(line => {
      pdf.text(line, margin + 12, textY);
      textY += 4;
    });
    
    return yPos + 25;
  }

  /**
   * Add prescriptive analysis section  
   */
  static addPrescriptiveAnalysisSection(pdf, progressData, responsesData, pageWidth, pageHeight, margin, bottomMargin, currentY) {
    let yPos = currentY;
    
    // Check if we need a new page
    if (yPos + 60 > pageHeight - bottomMargin) {
      pdf.addPage();
      yPos = margin;
    }
    
    // Section header
    pdf.setFillColor(76, 175, 80);
    pdf.rect(margin, yPos, pageWidth - (margin * 2), 12, 'F');
    
    pdf.setTextColor(255, 255, 255);
    pdf.setFontSize(11);
    pdf.setFont('helvetica', 'bold');
    pdf.text('PRESCRIPTIVE ANALYSIS', margin + 8, yPos + 8);
    
    yPos += 18;
    pdf.setTextColor(0, 0, 0);
    
    // Calculate overall performance
    const totalQuestions = responsesData.length;
    const correctAnswers = responsesData.filter(r => r.isCorrect).length;
    const overallPercentage = totalQuestions > 0 ? Math.round((correctAnswers / totalQuestions) * 100) : 0;
    
    // Add prescriptive recommendations
    pdf.setFontSize(9);
    pdf.setFont('helvetica', 'bold');
    pdf.text('Recommended Learning Strategies:', margin + 6, yPos);
    
    yPos += 8;
    pdf.setFont('helvetica', 'normal');
    
    let strategies = [];
    if (overallPercentage >= 85) {
      strategies = [
        '• Continue with grade-level reading materials and challenging texts',
        '• Introduce advanced comprehension strategies and critical thinking',
        '• Encourage independent reading and creative writing activities'
      ];
    } else if (overallPercentage >= 70) {
      strategies = [
        '• Focus on guided reading with teacher support',
        '• Practice phonics patterns and sight word recognition',
        '• Use multi-sensory approaches for skill reinforcement'
      ];
    } else {
      strategies = [
        '• Implement intensive foundational reading instruction',
        '• Use systematic phonics and decoding interventions',
        '• Provide frequent practice with high-frequency words'
      ];
    }
    
    strategies.forEach(strategy => {
      pdf.text(strategy, margin + 6, yPos);
      yPos += 6;
    });
    
    yPos += 5;
    
    // Next assessment timeline
    pdf.setFont('helvetica', 'bold');
    pdf.text('Next Assessment:', margin + 6, yPos);
    
    yPos += 6;
    pdf.setFont('helvetica', 'normal');
    pdf.text('Schedule follow-up assessment in 4-6 weeks to monitor progress.', margin + 6, yPos);
    
    return yPos + 15;
  }

  /**
   * Add professional footer with signatures
   */
  static addProfessionalFooter(pdf, pageWidth, pageHeight, margin) {
    const footerY = pageHeight - 35;
    
    // Summary statement
    pdf.setFontSize(9);
    pdf.setFont('helvetica', 'normal');
    pdf.setTextColor(0, 0, 0);
    pdf.text('Continuous assessment and targeted intervention will support optimal reading development.', 
             pageWidth / 2, footerY - 10, { align: 'center' });
    
    // Signature lines
    const leftSigX = margin + 40;
    const rightSigX = pageWidth - margin - 80;
    
    pdf.setLineWidth(0.5);
    pdf.setDrawColor(0, 0, 0);
    pdf.line(leftSigX, footerY, leftSigX + 50, footerY);
    pdf.line(rightSigX, footerY, rightSigX + 50, footerY);
    
    // Signature labels
    pdf.setFontSize(8);
    pdf.setFont('helvetica', 'normal');
    pdf.text('Teacher\'s Signature', leftSigX + 25, footerY + 6, { align: 'center' });
    pdf.text('Principal\'s Signature', rightSigX + 25, footerY + 6, { align: 'center' });
    
    // Footer info
    pdf.setFontSize(7);
    pdf.setTextColor(120, 120, 120);
    pdf.text('Post-Assessment Progress Report - Cradle of Learners', margin, pageHeight - 8);
    
    // Page numbers
    const pageCount = pdf.getNumberOfPages();
    for (let i = 1; i <= pageCount; i++) {
      pdf.setPage(i);
      pdf.text(`Page ${i} of ${pageCount}`, pageWidth - margin - 30, pageHeight - 8);
    }
  }

  // Helper Methods
  
  static findQuestionInAssessments(questionId, assessmentQuestions) {
    if (!assessmentQuestions || !questionId) return null;
    
    for (const assessment of assessmentQuestions) {
      if (assessment.questions && Array.isArray(assessment.questions)) {
        const question = assessment.questions.find(q => q.questionId === questionId);
        if (question) return question;
      }
    }
    return null;
  }

  static formatStudentAnswer(response, questionDetails) {
    if (!response.response || response.response.length === 0) return 'No response';
    
    const category = response.category.toLowerCase();
    
    if (category.includes('alphabet') || category.includes('knowledge')) {
      // Multiple choice questions
      if (Array.isArray(response.response) && response.response[0] && questionDetails?.choiceOptions) {
        const optionId = response.response[0];
        const selectedOption = questionDetails.choiceOptions.find(opt => opt.optionId === optionId);
        return selectedOption ? selectedOption.optionText : `Option ${optionId}`;
      }
      return Array.isArray(response.response) ? response.response[0] : String(response.response);
    } else if (category.includes('phonological')) {
      // Matching questions - already handled in specific method
      if (response.correctMatches !== undefined && response.totalMatches !== undefined) {
        return `${response.correctMatches}/${response.totalMatches} matches`;
      }
      return 'Matching response';
    } else if (category.includes('decoding')) {
      // Letter arrangement
      return Array.isArray(response.response) ? response.response.join('') : String(response.response);
    } else if (category.includes('word') || category.includes('recognition')) {
      // Fill in the blanks
      return Array.isArray(response.response) ? response.response.join(', ') : String(response.response);
    } else if (category.includes('comprehension') || category.includes('reading')) {
      // Text input
      return Array.isArray(response.response) ? response.response.join(', ') : String(response.response);
    }
    
    // Fallback
    return Array.isArray(response.response) ? response.response.join(', ') : String(response.response);
  }

  static formatCorrectAnswer(response, questionDetails) {
    if (!questionDetails) return 'Not available';
    
    const category = response.category.toLowerCase();
    
    if (category.includes('alphabet') || category.includes('knowledge')) {
      // Multiple choice questions
      if (questionDetails.choiceOptions) {
        const correctOption = questionDetails.choiceOptions.find(opt => opt.isCorrect);
        return correctOption ? correctOption.optionText : 'Correct option';
      }
    } else if (category.includes('phonological')) {
      // Matching questions
      if (questionDetails.questionSet && questionDetails.questionSet[0] && questionDetails.questionSet[0].correctPairs) {
        const correctPairs = questionDetails.questionSet[0].correctPairs;
        return `All ${correctPairs.length} pairs correct`;
      }
      return 'All pairs matched correctly';
    } else if (category.includes('decoding')) {
      // Letter arrangement
      if (questionDetails.correctSequence) {
        return Array.isArray(questionDetails.correctSequence) ? 
          questionDetails.correctSequence.join('') : String(questionDetails.correctSequence);
      }
    } else if (category.includes('word') || category.includes('recognition')) {
      // Fill in the blanks
      if (questionDetails.correctAnswer) {
        return Array.isArray(questionDetails.correctAnswer) ? 
          questionDetails.correctAnswer.join(', ') : String(questionDetails.correctAnswer);
      }
    } else if (category.includes('comprehension') || category.includes('reading')) {
      // Text input
      if (questionDetails.correctAnswer) {
        return String(questionDetails.correctAnswer);
      }
      if (questionDetails.acceptableAnswers && questionDetails.acceptableAnswers.length > 0) {
        return questionDetails.acceptableAnswers[0];
      }
    }
    
    return 'Answer not available';
  }

  static formatResponseTime(seconds) {
    if (!seconds || seconds < 0) return '0m 0s';
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = Math.floor(seconds % 60);
    return `${minutes}m ${remainingSeconds}s`;
  }

  static wrapText(pdf, text, maxWidth, fontSize) {
    pdf.setFontSize(fontSize);
    const words = text.split(' ');
    const lines = [];
    let currentLine = '';
    
    words.forEach(word => {
      const testLine = currentLine ? currentLine + ' ' + word : word;
      const testWidth = pdf.getTextWidth(testLine);
      
      if (testWidth > maxWidth && currentLine) {
        lines.push(currentLine);
        currentLine = word;
      } else {
        currentLine = testLine;
      }
    });
    
    if (currentLine) {
      lines.push(currentLine);
    }
    
    return lines;
  }
}

// Export service instance
const pdfReportService = {
  generateProgressReport: (studentData, progressData, responsesData, assessmentQuestions, onProgress) => {
    return PdfReportService.generateProgressReport(studentData, progressData, responsesData, assessmentQuestions, onProgress);
  }
};

export default pdfReportService;