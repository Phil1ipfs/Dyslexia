// services/Teachers/ManageProgress/PdfReportService.js
import jsPDF from 'jspdf';
import 'jspdf-autotable';

class PdfReportService {
  constructor() {
    this.pageWidth = 210; // A4 width in mm
    this.pageHeight = 297; // A4 height in mm
    this.margin = 20;
    this.contentWidth = this.pageWidth - (this.margin * 2);
    this.lineHeight = 6;
    this.colors = {
      primary: '#dc2626',
      secondary: '#6b7280',
      success: '#059669',
      warning: '#d97706',
      danger: '#dc2626',
      light: '#f3f4f6',
      dark: '#1f2937'
    };
  }

  /**
   * Generate comprehensive PDF report for student's post-assessment progress
   * @param {Object} studentData - Student information
   * @param {Object} progressData - Category progress data
   * @param {Array} responsesData - Student responses data
   * @param {Function} onProgress - Progress callback function
   * @returns {Promise<Blob>} Generated PDF blob
   */
  async generateProgressReport(studentData, progressData, responsesData, onProgress = () => {}) {
    try {
      onProgress('Initializing PDF document...', 5);

      const pdf = new jsPDF('portrait', 'mm', 'a4');
      let currentY = this.margin;

      // Page 1: Executive Summary
      onProgress('Creating executive summary...', 15);
      currentY = await this.addExecutiveSummary(pdf, studentData, progressData, currentY);

      // Page 2: Category Analysis
      onProgress('Analyzing category performance...', 35);
      pdf.addPage();
      currentY = this.margin;
      currentY = await this.addCategoryAnalysis(pdf, progressData, currentY);

      // Page 3+: Detailed Question Breakdown
      onProgress('Processing detailed question analysis...', 55);
      await this.addQuestionBreakdown(pdf, responsesData, progressData);

      // Page N: Recommendations & Next Steps
      onProgress('Generating recommendations...', 75);
      pdf.addPage();
      currentY = this.margin;
      currentY = await this.addRecommendations(pdf, progressData, currentY);

      onProgress('Finalizing PDF document...', 90);

      // Add page numbers and footer to all pages
      this.addPageNumbersAndFooter(pdf);

      onProgress('PDF generation completed!', 100);

      // Return the PDF as a blob
      const pdfBlob = pdf.output('blob');
      return pdfBlob;

    } catch (error) {
      console.error('Error generating PDF report:', error);
      throw new Error(`Failed to generate PDF report: ${error.message}`);
    }
  }

  /**
   * Add executive summary page
   */
  async addExecutiveSummary(pdf, studentData, progressData, startY) {
    let currentY = startY;

    // Header
    currentY = this.addHeader(pdf, 'Post-Assessment Progress Report', currentY);

    // Student Information Section
    currentY = this.addStudentInfo(pdf, studentData, currentY);

    // Overall Performance Summary
    currentY = this.addOverallSummary(pdf, progressData, currentY);

    // Reading Level Progress
    currentY = this.addReadingLevelProgress(pdf, progressData, currentY);

    // Key Highlights
    currentY = this.addKeyHighlights(pdf, progressData, currentY);

    return currentY;
  }

  /**
   * Add category analysis page
   */
  async addCategoryAnalysis(pdf, progressData, startY) {
    let currentY = startY;

    // Section Header
    currentY = this.addSectionHeader(pdf, 'Category Performance Analysis', currentY);

    // Category Performance Table
    const categories = progressData.categories || [];
    const tableData = categories.map(category => [
      category.categoryName,
      `${category.correctAnswers}/${category.totalQuestions}`,
      `${category.score}%`,
      category.isPassed ? 'Passed' : 'Needs Improvement',
      category.interventionRequired ? 'Yes' : 'No'
    ]);

    pdf.autoTable({
      startY: currentY,
      head: [['Category', 'Correct/Total', 'Score', 'Status', 'Intervention']],
      body: tableData,
      theme: 'grid',
      headStyles: { fillColor: [220, 38, 38], textColor: 255 },
      styles: { fontSize: 10, cellPadding: 5 },
      columnStyles: {
        0: { cellWidth: 50 },
        1: { cellWidth: 30, halign: 'center' },
        2: { cellWidth: 25, halign: 'center' },
        3: { cellWidth: 40, halign: 'center' },
        4: { cellWidth: 25, halign: 'center' }
      }
    });

    currentY = pdf.lastAutoTable.finalY + 20;

    // Category Progress Chart (text-based representation)
    currentY = this.addCategoryProgressChart(pdf, categories, currentY);

    return currentY;
  }

  /**
   * Add detailed question breakdown
   */
  async addQuestionBreakdown(pdf, responsesData, progressData) {
    const categories = progressData.categories || [];
    
    for (const category of categories) {
      pdf.addPage();
      let currentY = this.margin;

      // Category Header
      currentY = this.addSectionHeader(pdf, `${category.categoryName} - Detailed Analysis`, currentY);

      // Category Summary
      currentY = this.addCategorySummary(pdf, category, currentY);

      // Question Details
      const categoryResponses = responsesData.filter(response => 
        response.category === category.categoryName
      );

      if (categoryResponses.length > 0) {
        currentY = this.addQuestionDetails(pdf, categoryResponses, currentY);
      }

      // Intervention Analysis (if applicable)
      if (category.interventionRequired) {
        currentY = this.addInterventionAnalysis(pdf, category, currentY);
      }
    }
  }

  /**
   * Add recommendations and next steps
   */
  async addRecommendations(pdf, progressData, startY) {
    let currentY = startY;

    // Section Header
    currentY = this.addSectionHeader(pdf, 'Recommendations & Next Steps', currentY);

    // Generate recommendations based on performance
    const recommendations = this.generateRecommendations(progressData);
    
    for (const recommendation of recommendations) {
      currentY = this.addRecommendationItem(pdf, recommendation, currentY);
      
      // Check if we need a new page
      if (currentY > this.pageHeight - 50) {
        pdf.addPage();
        currentY = this.margin;
      }
    }

    // Next Steps
    currentY += 10;
    currentY = this.addSubsectionHeader(pdf, 'Suggested Next Steps', currentY);
    
    const nextSteps = this.generateNextSteps(progressData);
    for (const step of nextSteps) {
      currentY = this.addBulletPoint(pdf, step, currentY);
    }

    return currentY;
  }

  /**
   * Helper method to add header
   */
  addHeader(pdf, title, startY) {
    // Title
    pdf.setFontSize(20);
    pdf.setFont('helvetica', 'bold');
    pdf.setTextColor(220, 38, 38);
    pdf.text(title, this.margin, startY);

    // Date
    pdf.setFontSize(10);
    pdf.setFont('helvetica', 'normal');
    pdf.setTextColor(107, 114, 128);
    const currentDate = new Date().toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
    pdf.text(`Generated on: ${currentDate}`, this.pageWidth - this.margin - 50, startY);

    // Separator line
    pdf.setDrawColor(220, 38, 38);
    pdf.setLineWidth(0.5);
    pdf.line(this.margin, startY + 5, this.pageWidth - this.margin, startY + 5);

    return startY + 15;
  }

  /**
   * Helper method to add student information
   */
  addStudentInfo(pdf, studentData, startY) {
    let currentY = startY;

    pdf.setFontSize(14);
    pdf.setFont('helvetica', 'bold');
    pdf.setTextColor(31, 41, 55);
    pdf.text('Student Information', this.margin, currentY);
    currentY += 10;

    pdf.setFontSize(10);
    pdf.setFont('helvetica', 'normal');
    pdf.setTextColor(107, 114, 128);

    const studentInfo = [
      `Student ID: ${studentData.studentId || 'N/A'}`,
      `Full Name: ${studentData.fullName || 'N/A'}`,
      `Grade Level: ${studentData.gradeLevel || 'N/A'}`,
      `Current Reading Level: ${studentData.readingLevel || 'N/A'}`,
      `Assessment Date: ${studentData.assessmentDate || 'N/A'}`
    ];

    studentInfo.forEach(info => {
      pdf.text(info, this.margin + 5, currentY);
      currentY += this.lineHeight;
    });

    return currentY + 10;
  }

  /**
   * Helper method to add overall summary
   */
  addOverallSummary(pdf, progressData, startY) {
    let currentY = startY;

    pdf.setFontSize(14);
    pdf.setFont('helvetica', 'bold');
    pdf.setTextColor(31, 41, 55);
    pdf.text('Overall Performance Summary', this.margin, currentY);
    currentY += 10;

    // Summary statistics
    const overallScore = progressData.overallScore || 0;
    const completedCategories = progressData.completedCategories || 0;
    const totalCategories = progressData.totalCategories || 0;
    const allPassed = progressData.allCategoriesPassed || false;

    // Create summary box
    pdf.setFillColor(243, 244, 246);
    pdf.rect(this.margin, currentY, this.contentWidth, 30, 'F');

    pdf.setFontSize(12);
    pdf.setTextColor(31, 41, 55);
    pdf.text(`Overall Score: ${overallScore}%`, this.margin + 10, currentY + 10);
    pdf.text(`Categories Completed: ${completedCategories}/${totalCategories}`, this.margin + 10, currentY + 20);

    // Status indicator
    const statusColor = allPassed ? [5, 150, 105] : [220, 38, 38];
    const statusText = allPassed ? 'All Categories Passed' : 'Requires Attention';
    
    pdf.setTextColor(...statusColor);
    pdf.setFont('helvetica', 'bold');
    pdf.text(`Status: ${statusText}`, this.margin + 100, currentY + 15);

    return currentY + 40;
  }

  /**
   * Helper method to add reading level progress
   */
  addReadingLevelProgress(pdf, progressData, startY) {
    let currentY = startY;

    pdf.setFontSize(14);
    pdf.setFont('helvetica', 'bold');
    pdf.setTextColor(31, 41, 55);
    pdf.text('Reading Level Progress', this.margin, currentY);
    currentY += 10;

    const currentLevel = progressData.readingLevel || 'Unknown';
    const levelUpdated = progressData.readingLevelUpdated || false;

    pdf.setFontSize(10);
    pdf.setFont('helvetica', 'normal');
    pdf.setTextColor(107, 114, 128);

    pdf.text(`Current Reading Level: ${currentLevel}`, this.margin + 5, currentY);
    currentY += this.lineHeight;

    if (levelUpdated) {
      pdf.setTextColor(5, 150, 105);
      pdf.text('✓ Reading level has been updated based on assessment results', this.margin + 5, currentY);
    } else {
      pdf.setTextColor(220, 38, 38);
      pdf.text('⚠ Further improvement needed to advance to next reading level', this.margin + 5, currentY);
    }

    return currentY + 15;
  }

  /**
   * Helper method to add key highlights
   */
  addKeyHighlights(pdf, progressData, startY) {
    let currentY = startY;

    pdf.setFontSize(14);
    pdf.setFont('helvetica', 'bold');
    pdf.setTextColor(31, 41, 55);
    pdf.text('Key Highlights', this.margin, currentY);
    currentY += 10;

    const highlights = this.generateKeyHighlights(progressData);
    
    pdf.setFontSize(10);
    pdf.setFont('helvetica', 'normal');

    highlights.forEach(highlight => {
      pdf.setTextColor(highlight.color[0], highlight.color[1], highlight.color[2]);
      pdf.text(`• ${highlight.text}`, this.margin + 5, currentY);
      currentY += this.lineHeight + 2;
    });

    return currentY + 10;
  }

  /**
   * Generate key highlights based on progress data
   */
  generateKeyHighlights(progressData) {
    const highlights = [];
    const categories = progressData.categories || [];

    // Highest performing category
    const topCategory = categories.reduce((max, cat) => 
      (cat.score > max.score) ? cat : max, categories[0] || { score: 0, categoryName: 'None' });
    
    if (topCategory.score > 0) {
      highlights.push({
        text: `Strongest performance in ${topCategory.categoryName} (${topCategory.score}%)`,
        color: [5, 150, 105] // Green
      });
    }

    // Categories needing improvement
    const needsImprovement = categories.filter(cat => !cat.isPassed);
    if (needsImprovement.length > 0) {
      highlights.push({
        text: `${needsImprovement.length} ${needsImprovement.length === 1 ? 'category needs' : 'categories need'} improvement`,
        color: [220, 38, 38] // Red
      });
    }

    // Intervention status
    const needsIntervention = categories.filter(cat => cat.interventionRequired);
    if (needsIntervention.length > 0) {
      highlights.push({
        text: `${needsIntervention.length} ${needsIntervention.length === 1 ? 'category requires' : 'categories require'} intervention support`,
        color: [217, 119, 6] // Orange
      });
    }

    // Overall progress
    if (progressData.allCategoriesPassed) {
      highlights.push({
        text: 'All categories successfully completed - Ready for next level!',
        color: [5, 150, 105] // Green
      });
    }

    return highlights;
  }

  /**
   * Generate recommendations based on performance
   */
  generateRecommendations(progressData) {
    const recommendations = [];
    const categories = progressData.categories || [];

    categories.forEach(category => {
      if (!category.isPassed) {
        recommendations.push({
          category: category.categoryName,
          score: category.score,
          recommendation: this.getCategoryRecommendation(category)
        });
      }
    });

    return recommendations;
  }

  /**
   * Get specific recommendation for a category
   */
  getCategoryRecommendation(category) {
    const score = category.score;
    const categoryName = category.categoryName;

    if (score < 50) {
      return `Focus on fundamental ${categoryName.toLowerCase()} skills with intensive practice and one-on-one support.`;
    } else if (score < 65) {
      return `Continue practicing ${categoryName.toLowerCase()} with guided exercises and regular assessment.`;
    } else {
      return `${categoryName} shows good progress. Minor adjustments needed to reach passing threshold.`;
    }
  }

  /**
   * Generate next steps based on overall progress
   */
  generateNextSteps(progressData) {
    const steps = [];
    const allPassed = progressData.allCategoriesPassed;

    if (allPassed) {
      steps.push('Proceed to next reading level assessments');
      steps.push('Continue regular reading practice to maintain skills');
      steps.push('Introduce more complex reading materials');
    } else {
      steps.push('Focus on categories that need improvement');
      steps.push('Implement recommended intervention strategies');
      steps.push('Schedule follow-up assessment in 2-4 weeks');
      steps.push('Provide additional support materials for weak areas');
    }

    return steps;
  }

  /**
   * Add section header
   */
  addSectionHeader(pdf, title, startY) {
    pdf.setFontSize(16);
    pdf.setFont('helvetica', 'bold');
    pdf.setTextColor(220, 38, 38);
    pdf.text(title, this.margin, startY);

    // Underline
    pdf.setDrawColor(220, 38, 38);
    pdf.setLineWidth(0.3);
    pdf.line(this.margin, startY + 2, this.margin + pdf.getTextWidth(title), startY + 2);

    return startY + 12;
  }

  /**
   * Add page numbers and footer
   */
  addPageNumbersAndFooter(pdf) {
    const pageCount = pdf.getNumberOfPages();
    
    for (let i = 1; i <= pageCount; i++) {
      pdf.setPage(i);
      
      // Page number
      pdf.setFontSize(8);
      pdf.setFont('helvetica', 'normal');
      pdf.setTextColor(107, 114, 128);
      pdf.text(`Page ${i} of ${pageCount}`, this.pageWidth - this.margin - 20, this.pageHeight - 10);
      
      // Footer text
      pdf.text('Post-Assessment Progress Report - Dyslexia Reading Assessment System', 
               this.margin, this.pageHeight - 10);
    }
  }

  /**
   * Add category progress chart (text-based)
   */
  addCategoryProgressChart(pdf, categories, startY) {
    let currentY = startY;

    pdf.setFontSize(12);
    pdf.setFont('helvetica', 'bold');
    pdf.setTextColor(31, 41, 55);
    pdf.text('Category Progress Visualization', this.margin, currentY);
    currentY += 10;

    categories.forEach(category => {
      const score = category.score;
      const barWidth = (score / 100) * (this.contentWidth - 50);
      
      // Category name
      pdf.setFontSize(9);
      pdf.setFont('helvetica', 'normal');
      pdf.setTextColor(31, 41, 55);
      pdf.text(category.categoryName, this.margin, currentY);
      
      // Progress bar background
      pdf.setFillColor(243, 244, 246);
      pdf.rect(this.margin + 50, currentY - 3, this.contentWidth - 50, 5, 'F');
      
      // Progress bar fill
      const barColor = score >= 75 ? [5, 150, 105] : score >= 50 ? [217, 119, 6] : [220, 38, 38];
      pdf.setFillColor(...barColor);
      pdf.rect(this.margin + 50, currentY - 3, barWidth, 5, 'F');
      
      // Score text
      pdf.setTextColor(...barColor);
      pdf.text(`${score}%`, this.margin + this.contentWidth - 20, currentY);
      
      currentY += 10;
    });

    return currentY + 10;
  }

  /**
   * Additional helper methods for detailed sections
   */
  addCategorySummary(pdf, category, startY) {
    let currentY = startY;

    // Category statistics
    pdf.setFontSize(10);
    pdf.setFont('helvetica', 'normal');
    pdf.setTextColor(107, 114, 128);

    const stats = [
      `Total Questions: ${category.totalQuestions}`,
      `Correct Answers: ${category.correctAnswers}`,
      `Score: ${category.score}%`,
      `Status: ${category.isPassed ? 'Passed' : 'Needs Improvement'}`,
      `Completed: ${category.isCompleted ? 'Yes' : 'No'}`
    ];

    stats.forEach(stat => {
      pdf.text(stat, this.margin + 5, currentY);
      currentY += this.lineHeight;
    });

    return currentY + 10;
  }

  addQuestionDetails(pdf, responses, startY) {
    let currentY = startY;

    pdf.setFontSize(12);
    pdf.setFont('helvetica', 'bold');
    pdf.setTextColor(31, 41, 55);
    pdf.text('Question Analysis', this.margin, currentY);
    currentY += 10;

    // Create table for question details
    const tableData = responses.slice(0, 10).map(response => [
      response.questionId,
      response.isCorrect ? 'Correct' : 'Incorrect',
      `${response.responseTime}s`,
      new Date(response.answeredAt).toLocaleDateString()
    ]);

    pdf.autoTable({
      startY: currentY,
      head: [['Question ID', 'Result', 'Time', 'Date']],
      body: tableData,
      theme: 'striped',
      headStyles: { fillColor: [220, 38, 38], textColor: 255 },
      styles: { fontSize: 8, cellPadding: 3 }
    });

    return pdf.lastAutoTable.finalY + 10;
  }

  addInterventionAnalysis(pdf, category, startY) {
    let currentY = startY;

    if (category.interventionHistory && category.interventionHistory.length > 0) {
      pdf.setFontSize(12);
      pdf.setFont('helvetica', 'bold');
      pdf.setTextColor(217, 119, 6);
      pdf.text('Intervention History', this.margin, currentY);
      currentY += 10;

      category.interventionHistory.forEach((intervention, index) => {
        pdf.setFontSize(9);
        pdf.setFont('helvetica', 'normal');
        pdf.setTextColor(107, 114, 128);
        
        pdf.text(`Attempt ${intervention.attemptNumber}:`, this.margin + 5, currentY);
        pdf.text(`Score: ${intervention.score}%`, this.margin + 40, currentY);
        pdf.text(`Status: ${intervention.isPassed ? 'Passed' : 'Failed'}`, this.margin + 80, currentY);
        
        currentY += this.lineHeight;
      });

      currentY += 5;
    }

    return currentY;
  }

  addRecommendationItem(pdf, recommendation, startY) {
    let currentY = startY;

    pdf.setFontSize(11);
    pdf.setFont('helvetica', 'bold');
    pdf.setTextColor(220, 38, 38);
    pdf.text(`${recommendation.category} (${recommendation.score}%)`, this.margin, currentY);
    currentY += 8;

    pdf.setFontSize(9);
    pdf.setFont('helvetica', 'normal');
    pdf.setTextColor(31, 41, 55);
    
    // Split long text into multiple lines
    const textLines = pdf.splitTextToSize(recommendation.recommendation, this.contentWidth - 10);
    textLines.forEach(line => {
      pdf.text(line, this.margin + 5, currentY);
      currentY += this.lineHeight;
    });

    return currentY + 8;
  }

  addSubsectionHeader(pdf, title, startY) {
    pdf.setFontSize(12);
    pdf.setFont('helvetica', 'bold');
    pdf.setTextColor(31, 41, 55);
    pdf.text(title, this.margin, startY);
    return startY + 8;
  }

  addBulletPoint(pdf, text, startY) {
    pdf.setFontSize(9);
    pdf.setFont('helvetica', 'normal');
    pdf.setTextColor(107, 114, 128);
    
    const textLines = pdf.splitTextToSize(`• ${text}`, this.contentWidth - 10);
    textLines.forEach(line => {
      pdf.text(line, this.margin + 5, startY);
      startY += this.lineHeight;
    });
    
    return startY + 2;
  }
}

export default new PdfReportService();