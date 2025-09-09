/**
 * PreAssessmentPDFService - Service for generating PDF reports for pre-assessment results
 * Based on Cradle of Learners format
 */

import jsPDF from 'jspdf';
import CradleLogo from '../../assets/images/Teachers/cradleLogo.jpg';

class PreAssessmentPDFService {
  /**
   * Generate PDF report for pre-assessment results
   * @param {Object} student - Student information
   * @param {Object} assessmentData - Processed assessment data
   * @param {Array} userResponses - Raw user responses
   * @returns {Promise} PDF generation promise
   */
  static async generatePreAssessmentPDF(student, assessmentData, userResponses) {
    try {
      console.log('Generating pre-assessment PDF...', { student, assessmentData });
      
      // Use proper short bond paper format with adequate space
      const pdf = new jsPDF('p', 'mm', [216, 279]); // 8.5" x 11" short bond
      const pageWidth = pdf.internal.pageSize.getWidth();
      const pageHeight = pdf.internal.pageSize.getHeight();
      const margin = 15; // Reduced margin for more content space
      const bottomMargin = 25; // Space for footer

      let currentY = margin;

      // Add Cradle of Learners header
      currentY = await this.addHeader(pdf, pageWidth, margin, currentY);
      
      // Add student information section with proper spacing
      currentY = this.addStudentInfo(pdf, student, assessmentData, pageWidth, margin, currentY);
      
      // Add assessment overview with no colors
      currentY = this.addAssessmentOverview(pdf, assessmentData, pageWidth, margin, currentY);
      
      // Add detailed question breakdown with smart page management
      currentY = this.addCompleteQuestionBreakdown(pdf, assessmentData, userResponses, pageWidth, pageHeight, margin, bottomMargin, currentY);
      
      // Add footer with signatures and actual date
      this.addSignatureFooter(pdf, pageWidth, pageHeight, margin);
      
      // Download the PDF with current date
      const now = new Date();
      const dateStr = now.toLocaleDateString('en-US', {
        year: 'numeric',
        month: '2-digit', 
        day: '2-digit'
      }).replace(/\//g, '-');
      const fileName = `${student.firstName}_${student.lastName}_PreAssessment_Report_${dateStr}.pdf`;
      pdf.save(fileName);
      
      return pdf;
    } catch (error) {
      console.error('Error generating PDF:', error);
      throw error;
    }
  }

  /**
   * Add Cradle of Learners header with logo
   */
  static async addHeader(pdf, pageWidth, margin, currentY) {
    try {
      // Add logo (centered at top) with appropriate sizing
      const logoSize = 25;
      const logoX = (pageWidth - logoSize) / 2;
      
      // Convert logo to base64 and add to PDF
      pdf.addImage(CradleLogo, 'JPEG', logoX, currentY, logoSize, logoSize);
      
      let yPos = currentY + logoSize + 10;
      
      // Add title with proper spacing
      pdf.setFontSize(18);
      pdf.setFont('helvetica', 'bold');
      pdf.setTextColor(0, 0, 0);
      pdf.text('CRADLE OF LEARNERS', pageWidth / 2, yPos, { align: 'center' });
      
      yPos += 8;
      pdf.setFontSize(12);
      pdf.setFont('helvetica', 'italic');
      pdf.setTextColor(60, 60, 60);
      pdf.text('(Inclusive School for Individualized Education), Inc.', pageWidth / 2, yPos, { align: 'center' });
      
      yPos += 7;
      pdf.setFontSize(10);
      pdf.setFont('helvetica', 'normal');
      pdf.setTextColor(80, 80, 80);
      pdf.text('3rd Floor TUCP Bldg. Elliptical Road Corner Maharlika St. Quezon City', pageWidth / 2, yPos, { align: 'center' });
      
      yPos += 6;
      pdf.text('Tel: 8294-7772 | Email: cradle.of.learners@gmail.com', pageWidth / 2, yPos, { align: 'center' });
      
      // Add professional line separator
      yPos += 10;
      pdf.setLineWidth(0.8);
      pdf.setDrawColor(74, 84, 148);
      pdf.line(margin, yPos, pageWidth - margin, yPos);
      
      return yPos + 15;
    } catch (error) {
      console.error('Error adding header:', error);
      // Fallback without logo
      let yPos = currentY;
      pdf.setFontSize(18);
      pdf.setFont('helvetica', 'bold');
      pdf.setTextColor(0, 0, 0);
      pdf.text('CRADLE OF LEARNERS', pageWidth / 2, yPos, { align: 'center' });
      return yPos + 30;
    }
  }

  /**
   * Add student information section
   */
  static addStudentInfo(pdf, student, assessmentData, pageWidth, margin, currentY) {
    let yPos = currentY;
    
    // Progress Report title with clean professional header
    pdf.setFillColor(70, 90, 150); // Clean professional blue
    pdf.rect(margin, yPos, pageWidth - (margin * 2), 12, 'F');
    
    pdf.setTextColor(255, 255, 255);
    pdf.setFontSize(12);
    pdf.setFont('helvetica', 'bold');
    pdf.text('PRE-ASSESSMENT PROGRESS REPORT', pageWidth / 2, yPos + 8, { align: 'center' });
    
    yPos += 18;
    pdf.setTextColor(0, 0, 0);
    pdf.setFontSize(10);
    pdf.setFont('helvetica', 'normal');
    pdf.text('School Year 2024-2025', pageWidth / 2, yPos, { align: 'center' });
    
    yPos += 15;
    
    // Student information card with clean professional styling
    const cardHeight = 45;
    pdf.setDrawColor(150, 150, 150); // Clean gray border
    pdf.setLineWidth(0.8);
    
    // Clean white background
    pdf.setFillColor(255, 255, 255);
    pdf.rect(margin, yPos, pageWidth - (margin * 2), cardHeight, 'FD');
    
    const leftColumn = margin + 12;
    const rightColumn = pageWidth / 2 + 12;
    const lineHeight = 10;
    const startY = yPos + 12;
    
    // Student information with better spacing
    pdf.setFontSize(9);
    pdf.setTextColor(0, 0, 0);
    
    this.addEnhancedInfoField(pdf, 'Student Name:', `${student.firstName || ''} ${student.lastName || ''}`.trim() || 'N/A', leftColumn, startY);
    this.addEnhancedInfoField(pdf, 'Grade Level:', student.grade || 'N/A', leftColumn, startY + lineHeight);
    this.addEnhancedInfoField(pdf, 'Parent/Guardian:', student.parentName || 'N/A', leftColumn, startY + lineHeight * 2);
    
    // Right column
    this.addEnhancedInfoField(pdf, 'Age:', student.age?.toString() || 'N/A', rightColumn, startY);
    this.addEnhancedInfoField(pdf, 'Gender:', student.gender || 'N/A', rightColumn, startY + lineHeight);
    
    // Current date when PDF is generated
    const currentDate = new Date().toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
    this.addEnhancedInfoField(pdf, 'Report Date:', currentDate, rightColumn, startY + lineHeight * 2);
    
    return yPos + cardHeight + 20;
  }

  static addInfoField(pdf, label, value, x, y) {
    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(9);
    pdf.text(label, x, y);
    pdf.setFont('helvetica', 'normal');
    pdf.setFontSize(9);
    const labelWidth = pdf.getTextWidth(label);
    pdf.text(value, x + labelWidth + 3, y);
  }

  /**
   * Add assessment overview section
   */
  static addAssessmentOverview(pdf, assessmentData, pageWidth, margin, currentY) {
    let yPos = currentY;
    
    // Section header with clean professional styling
    pdf.setFillColor(70, 90, 150); // Clean professional blue
    pdf.rect(margin, yPos, pageWidth - (margin * 2), 10, 'F');
    
    pdf.setTextColor(255, 255, 255);
    pdf.setFontSize(11);
    pdf.setFont('helvetica', 'bold');
    pdf.text('ASSESSMENT OVERVIEW', margin + 6, yPos + 7);
    
    // Reading level badge with clean styling
    const readingLevel = assessmentData.readingLevel || 'Not Assessed';
    const levelText = readingLevel;
    const badgeWidth = pdf.getTextWidth(levelText) + 12;
    
    // Clean success badge
    pdf.setFillColor(80, 140, 80); // Clean green
    pdf.rect(pageWidth - margin - badgeWidth - 6, yPos + 1, badgeWidth, 8, 'F');
    
    pdf.setTextColor(255, 255, 255);
    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(9);
    pdf.text(levelText, pageWidth - margin - badgeWidth / 2 - 6, yPos + 6.5, { align: 'center' });
    
    yPos += 18;
    pdf.setTextColor(0, 0, 0);
    
    // Overview cards with clean professional styling - reduced height
    const cardWidth = (pageWidth - margin * 2 - 16) / 3;
    const cardHeight = 26; // Reduced from 30
    
    // Overall Score Card with clean header
    this.addCleanOverviewCard(pdf, margin, yPos, cardWidth, cardHeight, 
      'OVERALL SCORE', `${assessmentData.correctAnswers || 0}/45`, 
      `${Math.round(((assessmentData.correctAnswers || 0) / 45) * 100)}%`);
    
    // Reading Level Card with clean header
    this.addCleanOverviewCard(pdf, margin + cardWidth + 10, yPos, cardWidth, cardHeight,
      'READING LEVEL', readingLevel, assessmentData.readingPercentage ? `${assessmentData.readingPercentage}%` : 'Determined');
    
    // Assessment Date Card with clean header
    const completedDate = assessmentData.completedAt ? 
      new Date(assessmentData.completedAt).toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric', 
        year: 'numeric'
      }) : 'Not completed';
    
    this.addCleanOverviewCard(pdf, margin + (cardWidth + 10) * 2, yPos, cardWidth, cardHeight,
      'COMPLETED ON', completedDate, 'Assessment Date');
    
    return yPos + cardHeight + 15; // Reduced spacing
  }

  static addOverviewCard(pdf, x, y, width, height, title, mainValue, subValue) {
    // Card background - clean white
    pdf.setFillColor(255, 255, 255);
    pdf.rect(x, y, width, height, 'F');
    
    // Card border - professional gray
    pdf.setDrawColor(150, 150, 150);
    pdf.setLineWidth(0.8);
    pdf.rect(x, y, width, height);
    
    // Title - black text
    pdf.setFontSize(7);
    pdf.setFont('helvetica', 'bold');
    pdf.setTextColor(0, 0, 0);
    pdf.text(title, x + width / 2, y + 8, { align: 'center' });
    
    // Main value - prominent black text
    pdf.setFontSize(12);
    pdf.setFont('helvetica', 'bold');
    pdf.setTextColor(0, 0, 0);
    pdf.text(mainValue, x + width / 2, y + 18, { align: 'center' });
    
    // Sub value - gray text
    pdf.setFontSize(7);
    pdf.setFont('helvetica', 'normal');
    pdf.setTextColor(100, 100, 100);
    pdf.text(subValue, x + width / 2, y + 25, { align: 'center' });
    
    pdf.setTextColor(0, 0, 0); // Reset color
  }

  /**
   * Add overview item box
   */

  /**
   * Add reading level progress section
   */
  static addCategoryOverview(pdf, assessmentData, pageWidth, margin, currentY) {
    let yPos = currentY;
    
    // Section header
    pdf.setFillColor(74, 84, 148);
    pdf.rect(margin, yPos, pageWidth - (margin * 2), 12, 'F');
    
    pdf.setTextColor(255, 255, 255);
    pdf.setFontSize(12);
    pdf.setFont('helvetica', 'bold');
    pdf.text('SKILL CATEGORY BREAKDOWN', margin + 8, yPos + 8);
    
    yPos += 20;
    pdf.setTextColor(0, 0, 0);
    
    // Add categories with proper spacing for short bond paper
    if (assessmentData.skillDetails && assessmentData.skillDetails.length > 0) {
      assessmentData.skillDetails.forEach((skill, index) => {
        yPos = this.addCategoryProgress(pdf, skill, yPos, pageWidth, margin);
        yPos += 15; // Proper spacing between categories
      });
    }
    
    return yPos + 15;
  }

  /**
   * Add individual category progress
   */
  static addCategoryProgress(pdf, skill, yPos, pageWidth, margin) {
    const categoryName = skill.categoryName || skill.category || 'Unknown Category';
    const score = skill.score || 0;
    const correct = skill.correct || Math.round((score / 100) * (skill.total || 15));
    const total = skill.totalQuestions || skill.total || 15;
    
    // Category card background
    const cardHeight = 12;
    pdf.setFillColor(248, 249, 250);
    pdf.rect(margin, yPos, pageWidth - (margin * 2), cardHeight, 'F');
    
    // Category card border
    pdf.setDrawColor(220, 220, 220);
    pdf.setLineWidth(0.3);
    pdf.rect(margin, yPos, pageWidth - (margin * 2), cardHeight);
    
    // Category name
    pdf.setFontSize(10);
    pdf.setFont('helvetica', 'bold');
    pdf.setTextColor(74, 84, 148);
    pdf.text(categoryName, margin + 8, yPos + 7.5);
    
    // Progress bar background
    const progressBarWidth = 60;
    const progressBarX = pageWidth - margin - progressBarWidth - 60;
    const progressBarY = yPos + 3;
    
    pdf.setFillColor(230, 230, 230);
    pdf.rect(progressBarX, progressBarY, progressBarWidth, 6, 'F');
    
    // Progress bar fill
    const fillWidth = (score / 100) * progressBarWidth;
    const fillColor = score >= 75 ? [34, 139, 34] : score >= 50 ? [255, 165, 0] : [220, 53, 69];
    pdf.setFillColor(fillColor[0], fillColor[1], fillColor[2]);
    pdf.rect(progressBarX, progressBarY, fillWidth, 6, 'F');
    
    // Score text
    pdf.setFontSize(9);
    pdf.setFont('helvetica', 'bold');
    pdf.setTextColor(0, 0, 0);
    pdf.text(`${correct}/${total}`, progressBarX + progressBarWidth + 5, yPos + 7.5);
    
    // Percentage badge
    const scoreText = `${score}%`;
    const badgeWidth = pdf.getTextWidth(scoreText) + 8;
    pdf.setFillColor(fillColor[0], fillColor[1], fillColor[2]);
    pdf.roundedRect(pageWidth - margin - badgeWidth - 8, yPos + 2, badgeWidth, 8, 1, 1, 'F');
    
    pdf.setTextColor(255, 255, 255);
    pdf.setFontSize(8);
    pdf.setFont('helvetica', 'bold');
    pdf.text(scoreText, pageWidth - margin - badgeWidth / 2 - 8, yPos + 7, { align: 'center' });
    
    pdf.setTextColor(0, 0, 0); // Reset color
    
    return yPos + cardHeight;
  }

  /**
   * Add question breakdown section (if space allows)
   */
  static addCompleteQuestionBreakdown(pdf, assessmentData, userResponses, pageWidth, pageHeight, margin, bottomMargin, currentY) {
    let yPos = currentY;
    
    // Check if we need a new page
    if (yPos + 40 > pageHeight - bottomMargin) {
      pdf.addPage();
      yPos = margin;
    }
    
    // Section header with clean professional styling - reduced height
    pdf.setFillColor(70, 90, 150); // Clean professional blue
    pdf.rect(margin, yPos, pageWidth - (margin * 2), 9, 'F');
    
    pdf.setTextColor(255, 255, 255);
    pdf.setFontSize(10); // Reduced font size
    pdf.setFont('helvetica', 'bold');
    pdf.text('QUESTION-BY-QUESTION ANALYSIS', margin + 6, yPos + 6.5);
    
    yPos += 15; // Reduced spacing
    pdf.setTextColor(0, 0, 0);
    
    // Process questions by category with proper page management
    if (assessmentData.skillDetails && assessmentData.skillDetails.length > 0) {
      assessmentData.skillDetails.forEach((skill, skillIndex) => {
        // Check if we need a new page for category header
        if (yPos + 25 > pageHeight - bottomMargin) {
          pdf.addPage();
          yPos = margin;
        }
        
        // Category header with clean professional styling
        yPos = this.addCleanCategoryHeader(pdf, skill, yPos, pageWidth, margin);
        
        // Add questions for this category with smart pagination
        if (skill.questions && skill.questions.length > 0) {
          skill.questions.forEach((question, qIndex) => {
            // Check if we need a new page for question (reduced space requirement)
            if (yPos + 40 > pageHeight - bottomMargin) {
              pdf.addPage();
              yPos = margin;
            }
            
            yPos = this.addCleanQuestionCard(pdf, question, qIndex + 1, yPos, pageWidth, margin);
            yPos += 3; // Reduced gap between questions
          });
        }
        
        yPos += 8; // Reduced gap between categories
      });
    }
    
    return yPos;
  }

  static addCategoryHeader(pdf, skill, yPos, pageWidth, margin) {
    const categoryName = skill.categoryName || skill.category;
    const score = skill.score || 0;
    const correct = skill.correct || 0;
    const total = skill.totalQuestions || skill.total || 0;
    
    // Category header background - light gray, no colors
    pdf.setFillColor(245, 245, 245);
    pdf.rect(margin, yPos, pageWidth - (margin * 2), 12, 'F');
    
    pdf.setDrawColor(100, 100, 100);
    pdf.setLineWidth(0.5);
    pdf.rect(margin, yPos, pageWidth - (margin * 2), 12);
    
    // Category name - black text
    pdf.setFontSize(10);
    pdf.setFont('helvetica', 'bold');
    pdf.setTextColor(0, 0, 0);
    pdf.text(categoryName, margin + 6, yPos + 8);
    
    // Score summary - black text
    pdf.setFontSize(9);
    pdf.setFont('helvetica', 'normal');
    pdf.setTextColor(0, 0, 0);
    const scoreText = `${correct}/${total} correct (${score}%)`;
    pdf.text(scoreText, pageWidth - margin - pdf.getTextWidth(scoreText) - 6, yPos + 8);
    
    return yPos + 18;
  }

  static addQuestionDetail(pdf, question, questionNumber, yPos, pageWidth, margin) {
    // Question card background - adequate height to prevent cropping
    const cardHeight = 38;
    pdf.setFillColor(255, 255, 255);
    pdf.rect(margin, yPos, pageWidth - (margin * 2), cardHeight, 'F');
    
    // Professional border
    pdf.setDrawColor(150, 150, 150);
    pdf.setLineWidth(0.5);
    pdf.rect(margin, yPos, pageWidth - (margin * 2), cardHeight);
    
    // Question number and status - no colored badges
    const isCorrect = question.isCorrect;
    const statusText = isCorrect ? '✓ CORRECT' : '✗ INCORRECT';
    
    pdf.setFontSize(8);
    pdf.setFont('helvetica', 'bold');
    pdf.setTextColor(0, 0, 0);
    pdf.text(`Question ${questionNumber}`, margin + 6, yPos + 10);
    
    // Status text only (no colored background)
    pdf.setFontSize(7);
    pdf.setFont('helvetica', 'bold');
    pdf.setTextColor(0, 0, 0);
    pdf.text(statusText, pageWidth - margin - pdf.getTextWidth(statusText) - 6, yPos + 10);
    
    // Question text with proper wrapping
    pdf.setFontSize(8);
    pdf.setTextColor(0, 0, 0);
    pdf.setFont('helvetica', 'normal');
    
    const questionText = question.questionText || 'Question text not available';
    const maxWidth = pageWidth - (margin * 2) - 12;
    const wrappedText = this.wrapText(pdf, questionText, maxWidth, 8);
    
    let textY = yPos + 17;
    if (wrappedText.length > 1) {
      pdf.text(`Q: ${wrappedText[0]}`, margin + 6, textY);
      if (wrappedText[1]) {
        pdf.text(wrappedText[1], margin + 10, textY + 5);
        textY += 5;
      }
    } else {
      pdf.text(`Q: ${questionText}`, margin + 6, textY);
    }
    
    // Student vs correct answer with proper spacing
    const studentAnswer = this.formatStudentAnswer(question);
    const correctAnswer = this.formatCorrectAnswer(question);
    
    pdf.setFontSize(7);
    const answerY = textY + 8;
    pdf.text(`Student Answer: ${studentAnswer}`, margin + 6, answerY);
    
    const correctAnswerX = Math.max(margin + 90, margin + pdf.getTextWidth(`Student Answer: ${studentAnswer}`) + 15);
    pdf.text(`Correct Answer: ${correctAnswer}`, correctAnswerX, answerY);
    
    // Focus and difficulty (NO response time)
    const detailY = answerY + 7;
    if (question.questionValue) {
      pdf.text(`Focus: ${question.questionValue}`, margin + 6, detailY);
    }
    
    if (question.difficultyLevel) {
      const difficulty = question.difficultyLevel.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
      const difficultyX = question.questionValue ? margin + 60 : margin + 6;
      pdf.text(`Difficulty: ${difficulty}`, difficultyX, detailY);
    }
    
    pdf.setTextColor(0, 0, 0); // Reset color
    
    return yPos + cardHeight;
  }

  static formatStudentAnswer(question) {
    // Check if question was answered - handle different possible flags
    const wasAnswered = question.wasAnswered !== false && question.isAnswered !== false && question.studentResponse !== null;
    
    if (!wasAnswered) return 'Not answered';
    
    const questionType = question.questionType;
    
    switch (questionType) {
      case 'patinig':
      case 'katinig':
      case 'malaking':
      case 'tunog':
        return question.studentAnswerText || `Option ${question.studentAnswer}`;
        
      case 'malapantig':
        return question.studentAnswerText || 
          (question.correctMatches !== undefined && question.totalMatches !== undefined 
            ? `${question.correctMatches}/${question.totalMatches} matches`
            : 'Matching response');
        
      case 'decode':
        if (Array.isArray(question.studentResponse)) {
          return question.studentResponse.join('');
        }
        return question.studentAnswerText || 'Letter arrangement';
        
      case 'word':
        if (Array.isArray(question.studentResponse)) {
          return question.studentResponse.join(', ');
        }
        return question.studentAnswerText || 'Word selection';
        
      case 'sentence':
        if (Array.isArray(question.studentResponse)) {
          return question.studentResponse.join(', ');
        }
        return question.studentAnswerText || 'Text response';
        
      default:
        return question.studentAnswerText || 'Response recorded';
    }
  }

  static formatCorrectAnswer(question) {
    const questionType = question.questionType;
    
    switch (questionType) {
      case 'patinig':
      case 'katinig':
      case 'malaking':
      case 'tunog':
        if (question.options) {
          const correctOption = question.options.find(opt => opt.isCorrect);
          return correctOption ? correctOption.optionText : 'Not available';
        }
        return question.correctAnswerText || 'Not available';
        
      case 'malapantig':
        return question.correctAnswerText || 'All matches correct';
        
      case 'decode':
        return question.correctAnswerText || question.questionValue || 'Letter sequence';
        
      case 'word':
        return question.correctAnswerText || question.expectedAnswer || 'Expected word';
        
      case 'sentence':
        return question.correctAnswerText || question.expectedAnswer || 'Text answer';
        
      default:
        return question.correctAnswerText || 'Not available';
    }
  }

  static wrapText(pdf, text, maxWidth, fontSize = 8) {
    pdf.setFontSize(fontSize);
    const words = text.split(' ');
    const lines = [];
    let currentLine = '';
    
    words.forEach(word => {
      const testLine = currentLine ? `${currentLine} ${word}` : word;
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
    
    // Limit to 2 lines to prevent overflow
    return lines.slice(0, 2);
  }

  /**
   * Add signature footer
   */
  static addSignatureFooter(pdf, pageWidth, pageHeight, margin) {
    const footerY = pageHeight - 35;
    
    // Footer separator line
    pdf.setLineWidth(0.3);
    pdf.setDrawColor(150, 150, 150);
    pdf.line(margin, footerY - 6, pageWidth - margin, footerY - 6);
    
    // Signature section
    const lineWidth = 55;
    const leftSigX = margin + 15;
    const rightSigX = pageWidth - margin - lineWidth - 15;
    
    // Signature lines
    pdf.setLineWidth(0.5);
    pdf.setDrawColor(0, 0, 0);
    pdf.line(leftSigX, footerY, leftSigX + lineWidth, footerY);
    pdf.line(rightSigX, footerY, rightSigX + lineWidth, footerY);
    
    // Labels
    pdf.setFontSize(8);
    pdf.setFont('helvetica', 'normal');
    pdf.setTextColor(0, 0, 0);
    pdf.text("Teacher's Signature", leftSigX + lineWidth / 2, footerY + 6, { align: 'center' });
    pdf.text("Principal's Signature", rightSigX + lineWidth / 2, footerY + 6, { align: 'center' });
    
    // Date fields with actual current date
    const currentDate = new Date().toLocaleDateString('en-US', {
      month: '2-digit',
      day: '2-digit', 
      year: 'numeric'
    });
    
    pdf.setFontSize(7);
    pdf.text(`Date: ${currentDate}`, leftSigX, footerY + 14);
    pdf.text(`Date: ${currentDate}`, rightSigX, footerY + 14);
    
    // Footer note with current date
    pdf.setFontSize(7);
    pdf.setTextColor(80, 80, 80);
    const generatedText = `Generated on ${currentDate} by LITEREXIA - Dyslexia Assessment Platform`;
    pdf.text(generatedText, pageWidth / 2, pageHeight - 6, { align: 'center' });
  }

  /**
   * Format time in minutes and seconds
   */
  static formatTime(seconds) {
    if (!seconds || seconds < 0 || !Number.isFinite(seconds)) return 'Not recorded';
    const sanitizedSeconds = Math.max(0, Math.round(seconds));
    const minutes = Math.floor(sanitizedSeconds / 60);
    const remainingSeconds = sanitizedSeconds % 60;
    return `${minutes}m ${remainingSeconds}s`;
  }

  /**
   * Add enhanced info field with clean styling - no boxes
   */
  static addEnhancedInfoField(pdf, label, value, x, y) {
    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(9);
    pdf.setTextColor(70, 90, 150); // Clean blue for labels
    pdf.text(label, x, y);
    
    pdf.setFont('helvetica', 'normal');
    pdf.setFontSize(9);
    pdf.setTextColor(60, 60, 60);
    const labelWidth = pdf.getTextWidth(label);
    
    // Simple text without background boxes for cleaner look
    pdf.text(value, x + labelWidth + 5, y);
  }

  /**
   * Add clean overview card with professional design
   */
  static addCleanOverviewCard(pdf, x, y, width, height, title, mainValue, subValue) {
    // Clean card with professional styling
    pdf.setFillColor(255, 255, 255);
    pdf.rect(x, y, width, height, 'F');
    
    // Clean header - reduced height
    pdf.setFillColor(245, 245, 245);
    pdf.rect(x, y, width, 10, 'F');
    
    // Professional border
    pdf.setDrawColor(150, 150, 150);
    pdf.setLineWidth(0.8);
    pdf.rect(x, y, width, height);
    
    // Title with clean text - smaller font
    pdf.setFontSize(7);
    pdf.setFont('helvetica', 'bold');
    pdf.setTextColor(60, 60, 60);
    pdf.text(title, x + width / 2, y + 7, { align: 'center' });
    
    // Main value with clean emphasis - slightly smaller
    pdf.setFontSize(12);
    pdf.setFont('helvetica', 'bold');
    pdf.setTextColor(70, 90, 150);
    pdf.text(mainValue, x + width / 2, y + 20, { align: 'center' });
    
    // Sub value with clean text - smaller font
    pdf.setFontSize(7);
    pdf.setFont('helvetica', 'normal');
    pdf.setTextColor(100, 100, 100);
    pdf.text(subValue, x + width / 2, y + 26, { align: 'center' });
    
    pdf.setTextColor(0, 0, 0); // Reset color
  }

  /**
   * Add clean category header with professional design
   */
  static addCleanCategoryHeader(pdf, skill, yPos, pageWidth, margin) {
    const categoryName = skill.categoryName || skill.category;
    const score = skill.score || 0;
    const correct = skill.correct || 0;
    const total = skill.totalQuestions || skill.total || 0;
    
    // Clean category header with professional styling - reduced height for better spacing
    const headerHeight = 15;
    
    // Clean background
    pdf.setFillColor(240, 240, 240);
    pdf.rect(margin, yPos, pageWidth - (margin * 2), headerHeight, 'F');
    
    // Professional border
    pdf.setDrawColor(150, 150, 150);
    pdf.setLineWidth(0.8);
    pdf.rect(margin, yPos, pageWidth - (margin * 2), headerHeight);
    
    // Category name with clean text - reduced font size
    pdf.setFontSize(10);
    pdf.setFont('helvetica', 'bold');
    pdf.setTextColor(70, 90, 150);
    pdf.text(categoryName, margin + 8, yPos + 10);
    
    // Score text with clean styling - reduced font size
    pdf.setFontSize(9);
    pdf.setFont('helvetica', 'bold');
    pdf.setTextColor(60, 60, 60);
    const scoreText = `${correct}/${total} correct (${score}%)`;
    pdf.text(scoreText, pageWidth - margin - pdf.getTextWidth(scoreText) - 8, yPos + 10);
    
    return yPos + headerHeight + 6; // Reduced spacing after header
  }

  static getCategoryIcon(category) {
    // Removed icons to avoid text encoding issues in PDF
    return '';
  }

  /**
   * Get category color matching frontend design
   */
  static getCategoryColor(category) {
    const colors = {
      'Alphabet Knowledge': [155, 89, 182], // Purple
      'Phonological Awareness': [52, 152, 219], // Blue
      'Decoding': [46, 204, 113], // Green
      'Word Recognition': [241, 196, 15], // Yellow/Orange
      'Reading Comprehension': [231, 76, 60] // Red
    };
    return colors[category] || [102, 51, 153]; // Default purple
  }

  /**
   * Add clean question card with professional design
   */
  static addCleanQuestionCard(pdf, question, questionNumber, yPos, pageWidth, margin) {
    // Clean question card with proper spacing
    const cardHeight = 52; // Slightly reduced height for better space usage
    const cardPadding = 8; // Reduced padding for more content space
    
    // Card background with clean white
    pdf.setFillColor(255, 255, 255);
    pdf.rect(margin, yPos, pageWidth - (margin * 2), cardHeight, 'F');
    
    // Clean border
    const isCorrect = question.isCorrect;
    const wasAnswered = question.wasAnswered !== false; // Default to true if not specified
    
    pdf.setDrawColor(150, 150, 150);
    pdf.setLineWidth(0.8);
    pdf.rect(margin, yPos, pageWidth - (margin * 2), cardHeight);
    
    // Question header area with clean background
    pdf.setFillColor(248, 248, 248);
    pdf.rect(margin, yPos, pageWidth - (margin * 2), 14, 'F');
    
    // Determine status and colors based on answer state
    let statusText, statusColor;
    if (!wasAnswered) {
      statusText = 'NOT ANSWERED';
      statusColor = [120, 120, 120]; // Neutral gray
    } else if (isCorrect) {
      statusText = 'CORRECT';
      statusColor = [80, 140, 80]; // Green
    } else {
      statusText = 'INCORRECT';
      statusColor = [180, 60, 60]; // Red
    }
    
    pdf.setFontSize(9);
    pdf.setFont('helvetica', 'bold');
    pdf.setTextColor(70, 90, 150);
    pdf.text(`Question ${questionNumber}`, margin + cardPadding, yPos + 9);
    
    // Clean status badge
    pdf.setFontSize(8);
    pdf.setFont('helvetica', 'bold');
    const statusWidth = pdf.getTextWidth(statusText);
    
    // Clean colored status badge
    pdf.setFillColor(statusColor[0], statusColor[1], statusColor[2]);
    pdf.rect(pageWidth - margin - statusWidth - 10, yPos + 2.5, statusWidth + 6, 8, 'F');
    
    pdf.setTextColor(255, 255, 255);
    pdf.text(statusText, pageWidth - margin - statusWidth - 7, yPos + 9);
    
    const borderColor = [70, 90, 150]; // Clean blue for consistency
    
    // Question content area with better spacing
    let contentY = yPos + 20;
    
    // Question text with proper formatting - handle different question types
    pdf.setFontSize(8);
    pdf.setTextColor(60, 60, 60);
    pdf.setFont('helvetica', 'normal');
    
    // Get question text based on question type
    let questionText = question.questionText || 'Question text not available';
    
    // Special handling for reading comprehension questions
    if (question.questionType === 'sentence' && question.sentenceQuestions && question.sentenceQuestions.length > 0) {
      // For RC questions, try to get the specific comprehension question
      if (question.studentResponse) {
        const studentAnswer = Array.isArray(question.studentResponse) ? question.studentResponse[0] : question.studentResponse;
        // Try to match with specific question based on answer
        for (const sentenceQ of question.sentenceQuestions) {
          if (sentenceQ.correctAnswer?.toLowerCase() === studentAnswer?.toLowerCase() || 
              sentenceQ.acceptableAnswers?.some(ans => ans.toLowerCase() === studentAnswer?.toLowerCase())) {
            questionText = sentenceQ.questionText;
            break;
          }
        }
        // If no match, use first question
        if (questionText === 'Question text not available') {
          questionText = question.sentenceQuestions[0].questionText;
        }
      } else {
        // For unanswered questions, show the first comprehension question
        questionText = question.sentenceQuestions[0].questionText;
      }
    }
    
    const maxWidth = pageWidth - (margin * 2) - (cardPadding * 2) - 18;
    const wrappedText = this.wrapText(pdf, questionText, maxWidth, 8);
    
    pdf.setFont('helvetica', 'bold');
    pdf.setTextColor(borderColor[0], borderColor[1], borderColor[2]);
    pdf.text('Question:', margin + cardPadding, contentY);
    pdf.setFont('helvetica', 'normal');
    pdf.setTextColor(60, 60, 60);
    
    if (wrappedText.length > 1) {
      pdf.text(wrappedText[0], margin + cardPadding + 22, contentY);
      if (wrappedText[1]) {
        pdf.text(wrappedText[1], margin + cardPadding + 22, contentY + 4);
        contentY += 4;
      }
    } else {
      pdf.text(questionText, margin + cardPadding + 22, contentY);
    }
    
    // Answer comparison with proper layout and spacing
    const answerY = contentY + 8;
    const studentAnswer = this.formatStudentAnswer(question);
    const correctAnswer = this.formatCorrectAnswer(question);
    
    // Create two-column layout for answers with proper spacing
    const leftColumnWidth = (pageWidth - (margin * 2) - (cardPadding * 2) - 12) / 2;
    const rightColumnStart = margin + cardPadding + leftColumnWidth + 12;
    
    // Student answer section - Left column
    pdf.setFontSize(7);
    pdf.setFont('helvetica', 'bold');
    pdf.setTextColor(borderColor[0], borderColor[1], borderColor[2]);
    pdf.text('Student Answer:', margin + cardPadding, answerY);
    
    // Student answer with background - adjust color based on answer state
    pdf.setFont('helvetica', 'normal');
    let studentBgColor;
    if (!wasAnswered) {
      studentBgColor = [248, 248, 248]; // Light gray for unanswered
    } else if (isCorrect) {
      studentBgColor = [240, 255, 240]; // Light green for correct
    } else {
      studentBgColor = [255, 245, 245]; // Light red for incorrect
    }
    
    pdf.setFillColor(studentBgColor[0], studentBgColor[1], studentBgColor[2]);
    pdf.rect(margin + cardPadding, answerY + 2, leftColumnWidth, 7, 'F');
    
    // Add border
    pdf.setDrawColor(200, 200, 200);
    pdf.setLineWidth(0.2);
    pdf.rect(margin + cardPadding, answerY + 2, leftColumnWidth, 7);
    
    pdf.setTextColor(60, 60, 60);
    
    // Handle special formatting for phonological awareness questions
    if (question.questionType === 'malapantig' && studentAnswer.includes('→')) {
      // For phonological awareness with multiple lines, split and display properly
      const lines = studentAnswer.split('\n');
      const firstLine = lines[0];
      pdf.text(firstLine.length > 25 ? firstLine.substring(0, 25) + '...' : firstLine, margin + cardPadding + 1, answerY + 6);
    } else {
      // Truncate long answers to fit in the box
      const truncatedAnswer = studentAnswer.length > 28 ? studentAnswer.substring(0, 28) + '...' : studentAnswer;
      pdf.text(truncatedAnswer, margin + cardPadding + 1, answerY + 6);
    }
    
    // Correct answer section - Right column
    pdf.setFont('helvetica', 'bold');
    pdf.setTextColor(46, 204, 113); // Green for correct answer
    pdf.text('Correct Answer:', rightColumnStart, answerY);
    
    // Correct answer with background
    pdf.setFont('helvetica', 'normal');
    pdf.setFillColor(240, 255, 240); // Light green background
    pdf.rect(rightColumnStart, answerY + 2, leftColumnWidth, 7, 'F');
    
    // Add border
    pdf.setDrawColor(200, 200, 200);
    pdf.setLineWidth(0.2);
    pdf.rect(rightColumnStart, answerY + 2, leftColumnWidth, 7);
    
    pdf.setTextColor(60, 60, 60);
    
    // Handle special formatting for phonological awareness questions
    if (question.questionType === 'malapantig' && correctAnswer.includes('→')) {
      // For phonological awareness with multiple lines, split and display properly
      const lines = correctAnswer.split('\n');
      const firstLine = lines[0];
      pdf.text(firstLine.length > 25 ? firstLine.substring(0, 25) + '...' : firstLine, rightColumnStart + 1, answerY + 6);
    } else {
      // Truncate long answers to fit in the box
      const truncatedAnswer = correctAnswer.length > 28 ? correctAnswer.substring(0, 28) + '...' : correctAnswer;
      pdf.text(truncatedAnswer, rightColumnStart + 1, answerY + 6);
    }
    
    // Additional details INSIDE the question box with proper layout
    const detailY = answerY + 13;
    pdf.setFontSize(7);
    
    // Focus and Difficulty in organized layout WITHIN the card boundaries
    if (question.questionValue || question.difficultyLevel) {
      // Focus - Left column (within card)
      if (question.questionValue) {
        pdf.setFont('helvetica', 'bold');
        pdf.setTextColor(102, 51, 153); // Purple for labels
        pdf.text('Focus:', margin + cardPadding, detailY);
        pdf.setFont('helvetica', 'normal');
        pdf.setTextColor(80, 80, 80);
        pdf.text(question.questionValue, margin + cardPadding + 18, detailY);
      }
      
      // Difficulty - Right column (within card)
      if (question.difficultyLevel) {
        const difficulty = question.difficultyLevel.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
        pdf.setFont('helvetica', 'bold');
        pdf.setTextColor(102, 51, 153); // Purple for labels
        pdf.text('Difficulty:', rightColumnStart, detailY);
        pdf.setFont('helvetica', 'normal');
        pdf.setTextColor(80, 80, 80);
        // Truncate long difficulty text
        const truncatedDifficulty = difficulty.length > 15 ? difficulty.substring(0, 15) + '...' : difficulty;
        pdf.text(truncatedDifficulty, rightColumnStart + 25, detailY);
      }
    }
    
    pdf.setTextColor(0, 0, 0); // Reset color
    
    return yPos + cardHeight;
  }
}

export default PreAssessmentPDFService;