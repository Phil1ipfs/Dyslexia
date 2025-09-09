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
      
      // Use US Letter format (8.5" x 11") for proper professional appearance
      const pdf = new jsPDF('p', 'mm', 'letter');
      const pageWidth = pdf.internal.pageSize.getWidth(); // 215.9mm
      const pageHeight = pdf.internal.pageSize.getHeight(); // 279.4mm
      const margin = 25; // Increased margin for better spacing

      let currentY = margin;

      // Add Cradle of Learners header
      currentY = await this.addHeader(pdf, pageWidth, margin, currentY);
      
      // Add student information section
      currentY = this.addStudentInfo(pdf, student, assessmentData, pageWidth, margin, currentY);
      
      // Add assessment overview
      currentY = this.addAssessmentOverview(pdf, assessmentData, pageWidth, margin, currentY);
      
      // Add reading level progress
      currentY = this.addReadingLevelProgress(pdf, assessmentData, pageWidth, margin, currentY);
      
      // Add detailed question breakdown
      currentY = this.addQuestionBreakdown(pdf, assessmentData, userResponses, pageWidth, margin, currentY, pageHeight);
      
      // Add footer with signatures
      this.addSignatureFooter(pdf, pageWidth, pageHeight, margin);
      
      // Download the PDF
      const fileName = `${student.firstName}_${student.lastName}_PreAssessment_Report_${new Date().toISOString().split('T')[0]}.pdf`;
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
      // Add logo (centered at top) with better sizing
      const logoSize = 30;
      const logoX = (pageWidth - logoSize) / 2;
      
      // Convert logo to base64 and add to PDF
      pdf.addImage(CradleLogo, 'JPEG', logoX, currentY, logoSize, logoSize);
      
      let yPos = currentY + logoSize + 15;
      
      // Add title with better spacing
      pdf.setFontSize(22);
      pdf.setFont('helvetica', 'bold');
      pdf.setTextColor(0, 0, 0);
      pdf.text('CRADLE OF LEARNERS', pageWidth / 2, yPos, { align: 'center' });
      
      yPos += 12;
      pdf.setFontSize(14);
      pdf.setFont('helvetica', 'italic');
      pdf.setTextColor(60, 60, 60);
      pdf.text('(Inclusive School for Individualized Education), Inc.', pageWidth / 2, yPos, { align: 'center' });
      
      yPos += 10;
      pdf.setFontSize(11);
      pdf.setFont('helvetica', 'normal');
      pdf.setTextColor(80, 80, 80);
      pdf.text('3rd Floor TUCP Bldg. Elliptical Road Corner Maharlika St. Quezon City', pageWidth / 2, yPos, { align: 'center' });
      
      yPos += 8;
      pdf.text('Tel: 8294-7772 | Email: cradle.of.learners@gmail.com', pageWidth / 2, yPos, { align: 'center' });
      
      // Add professional line separator
      yPos += 15;
      pdf.setLineWidth(1);
      pdf.setDrawColor(74, 84, 148);
      pdf.line(margin, yPos, pageWidth - margin, yPos);
      
      return yPos + 20;
    } catch (error) {
      console.error('Error adding header:', error);
      // Fallback without logo
      let yPos = currentY;
      pdf.setFontSize(22);
      pdf.setFont('helvetica', 'bold');
      pdf.setTextColor(0, 0, 0);
      pdf.text('CRADLE OF LEARNERS', pageWidth / 2, yPos, { align: 'center' });
      return yPos + 40;
    }
  }

  /**
   * Add student information section
   */
  static addStudentInfo(pdf, student, assessmentData, pageWidth, margin, currentY) {
    let yPos = currentY;
    
    // Progress Report title with background
    pdf.setFillColor(74, 84, 148);
    pdf.rect(margin, yPos, pageWidth - (margin * 2), 20, 'F');
    
    pdf.setTextColor(255, 255, 255);
    pdf.setFontSize(18);
    pdf.setFont('helvetica', 'bold');
    pdf.text('PRE-ASSESSMENT PROGRESS REPORT', pageWidth / 2, yPos + 13, { align: 'center' });
    
    yPos += 30;
    pdf.setTextColor(0, 0, 0);
    pdf.setFontSize(14);
    pdf.setFont('helvetica', 'normal');
    pdf.text('School Year 2024-2025', pageWidth / 2, yPos, { align: 'center' });
    
    yPos += 25;
    
    // Student information card with border
    const cardHeight = 50;
    pdf.setDrawColor(200, 200, 200);
    pdf.setLineWidth(1);
    pdf.rect(margin, yPos, pageWidth - (margin * 2), cardHeight);
    
    // Fill background with light gray
    pdf.setFillColor(248, 249, 250);
    pdf.rect(margin, yPos, pageWidth - (margin * 2), cardHeight, 'F');
    
    // Redraw border
    pdf.setDrawColor(200, 200, 200);
    pdf.rect(margin, yPos, pageWidth - (margin * 2), cardHeight);
    
    const leftColumn = margin + 15;
    const rightColumn = pageWidth / 2 + 15;
    const lineHeight = 10;
    const startY = yPos + 15;
    
    // Left column
    pdf.setFontSize(11);
    pdf.setTextColor(0, 0, 0);
    
    this.addInfoField(pdf, 'Student Name:', `${student.firstName || ''} ${student.lastName || ''}`.trim() || 'N/A', leftColumn, startY);
    this.addInfoField(pdf, 'Grade Level:', student.grade || 'N/A', leftColumn, startY + lineHeight);
    this.addInfoField(pdf, 'Parent/Guardian:', student.parentName || 'N/A', leftColumn, startY + lineHeight * 2);
    
    // Right column
    this.addInfoField(pdf, 'Age:', student.age?.toString() || 'N/A', rightColumn, startY);
    this.addInfoField(pdf, 'Gender:', student.gender || 'N/A', rightColumn, startY + lineHeight);
    this.addInfoField(pdf, 'Assessment Date:', new Date().toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    }), rightColumn, startY + lineHeight * 2);
    
    return yPos + cardHeight + 25;
  }

  static addInfoField(pdf, label, value, x, y) {
    pdf.setFont('helvetica', 'bold');
    pdf.text(label, x, y);
    pdf.setFont('helvetica', 'normal');
    const labelWidth = pdf.getTextWidth(label);
    pdf.text(value, x + labelWidth + 5, y);
  }

  /**
   * Add assessment overview section
   */
  static addAssessmentOverview(pdf, assessmentData, pageWidth, margin, currentY) {
    let yPos = currentY;
    
    // Section header
    pdf.setFillColor(74, 84, 148);
    pdf.rect(margin, yPos, pageWidth - (margin * 2), 15, 'F');
    
    pdf.setTextColor(255, 255, 255);
    pdf.setFontSize(14);
    pdf.setFont('helvetica', 'bold');
    pdf.text('ASSESSMENT OVERVIEW', margin + 10, yPos + 10);
    
    // Reading level badge on the right
    const readingLevel = assessmentData.readingLevel || 'Not Assessed';
    pdf.setFillColor(34, 139, 34); // Green background for reading level
    const badgeWidth = pdf.getTextWidth(readingLevel) + 20;
    const badgeX = pageWidth - margin - badgeWidth - 10;
    pdf.roundedRect(badgeX, yPos + 2, badgeWidth, 11, 3, 3, 'F');
    pdf.setFontSize(12);
    pdf.text(readingLevel, badgeX + badgeWidth / 2, yPos + 9, { align: 'center' });
    
    yPos += 30;
    pdf.setTextColor(0, 0, 0);
    
    // Overview cards with better spacing
    const cardWidth = (pageWidth - margin * 2 - 30) / 3; // Add spacing between cards
    const cardHeight = 40;
    
    // Overall Score Card
    this.addOverviewCard(pdf, margin, yPos, cardWidth, cardHeight, 
      'OVERALL SCORE', `${assessmentData.correctAnswers || 0}/45`, 
      `${Math.round(((assessmentData.correctAnswers || 0) / 45) * 100)}%`);
    
    // Reading Level Card
    this.addOverviewCard(pdf, margin + cardWidth + 15, yPos, cardWidth, cardHeight,
      'READING LEVEL', readingLevel, assessmentData.readingPercentage ? `${assessmentData.readingPercentage}%` : 'N/A');
    
    // Time Taken Card
    const timeTaken = assessmentData.totalResponseTime ? 
      this.formatTime(assessmentData.totalResponseTime) : 'Not recorded';
    
    this.addOverviewCard(pdf, margin + (cardWidth + 15) * 2, yPos, cardWidth, cardHeight,
      'TIME TAKEN', timeTaken, assessmentData.completedAt ? 
      new Date(assessmentData.completedAt).toLocaleDateString() : 'N/A');
    
    return yPos + cardHeight + 25;
  }

  static addOverviewCard(pdf, x, y, width, height, title, mainValue, subValue) {
    // Card background
    pdf.setFillColor(255, 255, 255);
    pdf.rect(x, y, width, height, 'F');
    
    // Card border
    pdf.setDrawColor(220, 220, 220);
    pdf.setLineWidth(1);
    pdf.rect(x, y, width, height);
    
    // Title
    pdf.setFontSize(10);
    pdf.setFont('helvetica', 'bold');
    pdf.setTextColor(100, 100, 100);
    pdf.text(title, x + width / 2, y + 12, { align: 'center' });
    
    // Main value
    pdf.setFontSize(16);
    pdf.setFont('helvetica', 'bold');
    pdf.setTextColor(74, 84, 148);
    pdf.text(mainValue, x + width / 2, y + 25, { align: 'center' });
    
    // Sub value
    pdf.setFontSize(9);
    pdf.setFont('helvetica', 'normal');
    pdf.setTextColor(120, 120, 120);
    pdf.text(subValue, x + width / 2, y + 35, { align: 'center' });
    
    pdf.setTextColor(0, 0, 0); // Reset color
  }

  /**
   * Add overview item box
   */

  /**
   * Add reading level progress section
   */
  static addReadingLevelProgress(pdf, assessmentData, pageWidth, margin, currentY) {
    let yPos = currentY;
    
    // Section header
    pdf.setFillColor(74, 84, 148);
    pdf.rect(margin, yPos, pageWidth - (margin * 2), 15, 'F');
    
    pdf.setTextColor(255, 255, 255);
    pdf.setFontSize(14);
    pdf.setFont('helvetica', 'bold');
    pdf.text('SKILL CATEGORY BREAKDOWN', margin + 10, yPos + 10);
    
    yPos += 30;
    pdf.setTextColor(0, 0, 0);
    
    // Add categories with better spacing
    if (assessmentData.skillDetails && assessmentData.skillDetails.length > 0) {
      assessmentData.skillDetails.forEach((skill, index) => {
        yPos = this.addCategoryProgress(pdf, skill, yPos, pageWidth, margin);
        yPos += 20; // Increased space between categories
      });
    } else {
      // Default categories if no skill details available
      const defaultCategories = [
        { categoryName: 'Letter Recognition', score: assessmentData.letterScore || 0, total: 15 },
        { categoryName: 'Sound Recognition', score: assessmentData.soundScore || 0, total: 15 },
        { categoryName: 'Reading Comprehension', score: assessmentData.comprehensionScore || 0, total: 15 }
      ];
      
      defaultCategories.forEach((skill) => {
        yPos = this.addCategoryProgress(pdf, skill, yPos, pageWidth, margin);
        yPos += 20;
      });
    }
    
    return yPos + 10;
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
    const cardHeight = 15;
    pdf.setFillColor(248, 249, 250);
    pdf.rect(margin, yPos, pageWidth - (margin * 2), cardHeight, 'F');
    
    // Category card border
    pdf.setDrawColor(220, 220, 220);
    pdf.setLineWidth(0.5);
    pdf.rect(margin, yPos, pageWidth - (margin * 2), cardHeight);
    
    // Category name
    pdf.setFontSize(12);
    pdf.setFont('helvetica', 'bold');
    pdf.setTextColor(74, 84, 148);
    pdf.text(categoryName, margin + 10, yPos + 9);
    
    // Progress bar background
    const progressBarWidth = 80;
    const progressBarX = pageWidth - margin - progressBarWidth - 80;
    const progressBarY = yPos + 4;
    
    pdf.setFillColor(230, 230, 230);
    pdf.rect(progressBarX, progressBarY, progressBarWidth, 7, 'F');
    
    // Progress bar fill
    const fillWidth = (score / 100) * progressBarWidth;
    const fillColor = score >= 75 ? [34, 139, 34] : score >= 50 ? [255, 165, 0] : [220, 53, 69];
    pdf.setFillColor(fillColor[0], fillColor[1], fillColor[2]);
    pdf.rect(progressBarX, progressBarY, fillWidth, 7, 'F');
    
    // Score text
    pdf.setFontSize(11);
    pdf.setFont('helvetica', 'bold');
    pdf.setTextColor(0, 0, 0);
    pdf.text(`${correct}/${total}`, progressBarX + progressBarWidth + 10, yPos + 9);
    
    // Percentage badge
    const scoreText = `${score}%`;
    const badgeWidth = pdf.getTextWidth(scoreText) + 10;
    pdf.setFillColor(fillColor[0], fillColor[1], fillColor[2]);
    pdf.roundedRect(pageWidth - margin - badgeWidth - 10, yPos + 2, badgeWidth, 11, 2, 2, 'F');
    
    pdf.setTextColor(255, 255, 255);
    pdf.setFontSize(10);
    pdf.setFont('helvetica', 'bold');
    pdf.text(scoreText, pageWidth - margin - badgeWidth / 2 - 10, yPos + 9, { align: 'center' });
    
    pdf.setTextColor(0, 0, 0); // Reset color
    
    return yPos + cardHeight;
  }

  /**
   * Add question breakdown section (if space allows)
   */
  static addQuestionBreakdown(pdf, assessmentData, userResponses, pageWidth, margin, currentY, pageHeight) {
    let yPos = currentY;
    
    // Check if we have space for the question breakdown section
    if (yPos + 100 > pageHeight - 60) {
      pdf.addPage();
      yPos = margin;
    }
    
    // Section header
    pdf.setFillColor(74, 84, 148);
    pdf.rect(margin, yPos, pageWidth - (margin * 2), 15, 'F');
    
    pdf.setTextColor(255, 255, 255);
    pdf.setFontSize(14);
    pdf.setFont('helvetica', 'bold');
    pdf.text('DETAILED PERFORMANCE SUMMARY', margin + 10, yPos + 10);
    
    yPos += 30;
    pdf.setTextColor(0, 0, 0);
    
    // Summary statistics
    const totalQuestions = 45;
    const correctAnswers = assessmentData.correctAnswers || 0;
    const percentage = Math.round((correctAnswers / totalQuestions) * 100);
    
    // Performance summary box
    const summaryHeight = 40;
    pdf.setFillColor(248, 249, 250);
    pdf.rect(margin, yPos, pageWidth - (margin * 2), summaryHeight, 'F');
    pdf.setDrawColor(220, 220, 220);
    pdf.rect(margin, yPos, pageWidth - (margin * 2), summaryHeight);
    
    pdf.setFontSize(12);
    pdf.setFont('helvetica', 'normal');
    pdf.text(`Total Questions Answered: ${totalQuestions}`, margin + 15, yPos + 12);
    pdf.text(`Correct Answers: ${correctAnswers}`, margin + 15, yPos + 22);
    pdf.text(`Overall Accuracy: ${percentage}%`, margin + 15, yPos + 32);
    
    // Reading level determination
    pdf.setFont('helvetica', 'bold');
    pdf.text(`Determined Reading Level: ${assessmentData.readingLevel || 'Not Assessed'}`, pageWidth / 2 + 10, yPos + 20);
    
    yPos += summaryHeight + 20;
    
    // Recommendations section
    pdf.setFontSize(12);
    pdf.setFont('helvetica', 'bold');
    pdf.text('RECOMMENDATIONS:', margin, yPos);
    
    yPos += 15;
    pdf.setFontSize(11);
    pdf.setFont('helvetica', 'normal');
    
    const recommendations = this.generateRecommendations(assessmentData);
    recommendations.forEach((rec, index) => {
      if (yPos > pageHeight - 40) {
        pdf.addPage();
        yPos = margin;
      }
      pdf.text(`${index + 1}. ${rec}`, margin + 10, yPos);
      yPos += 12;
    });
    
    return yPos + 10;
  }

  static generateRecommendations(assessmentData) {
    const recommendations = [];
    const readingLevel = assessmentData.readingLevel;
    const percentage = assessmentData.readingPercentage || 0;
    
    if (percentage < 50) {
      recommendations.push('Focus on foundational alphabet and phonics skills');
      recommendations.push('Provide additional reading support and practice');
      recommendations.push('Consider one-on-one tutoring sessions');
    } else if (percentage < 75) {
      recommendations.push('Continue building reading fluency with guided practice');
      recommendations.push('Introduce sight words and vocabulary building exercises');
      recommendations.push('Regular reading comprehension activities');
    } else {
      recommendations.push('Maintain current reading level with challenging materials');
      recommendations.push('Encourage independent reading of age-appropriate books');
      recommendations.push('Focus on advanced comprehension and critical thinking skills');
    }
    
    recommendations.push('Schedule follow-up assessment in 3-6 months to track progress');
    return recommendations;
  }

  /**
   * Add signature footer
   */
  static addSignatureFooter(pdf, pageWidth, pageHeight, margin) {
    const footerY = pageHeight - 50;
    
    // Footer separator line
    pdf.setLineWidth(1);
    pdf.setDrawColor(220, 220, 220);
    pdf.line(margin, footerY - 10, pageWidth - margin, footerY - 10);
    
    // Signature section
    const lineWidth = 80;
    const leftSigX = margin + 30;
    const rightSigX = pageWidth - margin - lineWidth - 30;
    
    // Signature lines
    pdf.setLineWidth(1);
    pdf.setDrawColor(0, 0, 0);
    pdf.line(leftSigX, footerY, leftSigX + lineWidth, footerY);
    pdf.line(rightSigX, footerY, rightSigX + lineWidth, footerY);
    
    // Labels with better formatting
    pdf.setFontSize(11);
    pdf.setFont('helvetica', 'normal');
    pdf.setTextColor(0, 0, 0);
    pdf.text("Teacher's Signature", leftSigX + lineWidth / 2, footerY + 12, { align: 'center' });
    pdf.text("Principal's Signature", rightSigX + lineWidth / 2, footerY + 12, { align: 'center' });
    
    // Date fields
    pdf.text('Date: _______________', leftSigX, footerY + 25);
    pdf.text('Date: _______________', rightSigX, footerY + 25);
    
    // Footer note
    pdf.setFontSize(9);
    pdf.setTextColor(100, 100, 100);
    pdf.text('This report is generated by LITEREXIA - Dyslexia Assessment Platform', pageWidth / 2, pageHeight - 10, { align: 'center' });
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
}

export default PreAssessmentPDFService;