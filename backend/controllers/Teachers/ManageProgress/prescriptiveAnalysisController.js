const mongoose = require('mongoose');
const PrescriptiveAnalysis = require('../../../models/Teachers/ManageProgress/prescriptiveAnalysisModel');
const CategoryResultsService = require('../../../services/Teachers/CategoryResultsService');
const InterventionService = require('../../../services/Teachers/InterventionService');

// Use the comprehensive prescriptive analytics service
const PrescriptiveAnalyticsService = require('../../../services/Teachers/PrescriptiveAnalyticsService');

/**
 * Prescriptive Analysis Controller - ManageProgress Version
 * This controller acts as a clean bridge to the comprehensive PrescriptiveAnalyticsService
 * Maintains compatibility with existing ManageProgress routes while using the main service
 */
class PrescriptiveAnalysisController {
  constructor() {
    this.prescriptiveAnalyticsService = new PrescriptiveAnalyticsService();
  }

  /**
   * Get prescriptive analyses for a student
   * Delegates to comprehensive PrescriptiveAnalyticsService
   */
  async getStudentAnalyses(req, res) {
    try {
      const { studentId } = req.params;
      
      if (!studentId) {
        return res.status(400).json({
          success: false,
          message: 'Student ID is required'
        });
      }

      // Get analyses using comprehensive service
      const analyses = await PrescriptiveAnalysis.find({
        studentId: mongoose.Types.ObjectId.isValid(studentId) ? 
          new mongoose.Types.ObjectId(studentId) : studentId
      }).sort({ createdAt: -1 });

      return res.status(200).json({
        success: true,
        data: analyses
      });
    } catch (error) {
      console.error('Error getting student analyses:', error);
      return res.status(500).json({
        success: false,
        message: 'Server error while retrieving analyses',
        error: error.message
      });
    }
  }

  /**
   * Generate analyses for a student based on their category results
   * Delegates to comprehensive PrescriptiveAnalyticsService
   */
  async generateAnalysesFromResults(req, res) {
    try {
      const { studentId } = req.params;
      const { categoryResultId } = req.body;

      if (!studentId) {
        return res.status(400).json({
          success: false,
          message: 'Student ID is required'
        });
      }

      // If categoryResultId provided, use comprehensive service
      if (categoryResultId) {
        const analysis = await this.prescriptiveAnalyticsService.generatePrescriptiveAnalysis(categoryResultId);
        return res.status(200).json({
          success: true,
          data: analysis,
          message: 'Comprehensive prescriptive analysis generated'
        });
      }

      // Otherwise, get most recent category result for student
      const categoryResults = await CategoryResultsService.getCategoryResults(studentId);
      if (categoryResults.length === 0) {
        return res.status(404).json({
          success: false,
          message: 'No category results found for student'
        });
      }

      const mostRecentResult = categoryResults[0];
      const analysis = await this.prescriptiveAnalyticsService.generatePrescriptiveAnalysis(mostRecentResult._id);

      return res.status(200).json({
        success: true,
        data: analysis,
        message: 'Prescriptive analysis generated from category results'
      });
    } catch (error) {
      console.error('Error generating analyses:', error);
      return res.status(500).json({
        success: false,
        message: 'Server error while generating analyses',
        error: error.message
      });
    }
  }

  /**
   * Generate comprehensive prescriptive analysis using BKT/IRT mathematical models
   * Delegates to comprehensive PrescriptiveAnalyticsService
   */
  async generateComprehensiveAnalysis(req, res) {
    try {
      const { studentId } = req.params;
      
      if (!studentId) {
        return res.status(400).json({
          success: false,
          message: 'Student ID is required'
        });
      }

      // Get most recent category result for student
      const categoryResults = await CategoryResultsService.getCategoryResults(studentId);
      if (categoryResults.length === 0) {
        return res.status(404).json({
          success: false,
          message: 'No category results found for analysis'
        });
      }

      // Use comprehensive service to generate analysis
      const mostRecentResult = categoryResults[0];
      const analysis = await this.prescriptiveAnalyticsService.generatePrescriptiveAnalysis(mostRecentResult._id);

      return res.status(200).json({
        success: true,
        data: analysis,
        message: 'Comprehensive BKT/IRT analysis generated successfully'
      });

    } catch (error) {
      console.error('Error generating comprehensive analysis:', error);
      return res.status(500).json({
        success: false,
        message: 'Server error while generating comprehensive analysis',
        error: error.message
      });
    }
  }

  /**
   * Generate prescriptive analysis from intervention results
   * Delegates to InterventionService
   */
  async generateAnalysisFromIntervention(req, res) {
    try {
      const { interventionId } = req.params;

      if (!interventionId) {
        return res.status(400).json({
          success: false,
          message: 'Intervention ID is required'
        });
      }

      // Use the intervention service to generate analysis
      const result = await InterventionService.generateAnalysisFromIntervention(interventionId);

      return res.status(200).json({
        success: true,
        data: result.data,
        interventionOutcome: result.interventionOutcome,
        message: 'Prescriptive analysis generated from intervention results'
      });

    } catch (error) {
      console.error('Error generating analysis from intervention:', error);
      return res.status(500).json({
        success: false,
        message: 'Server error while generating analysis from intervention',
        error: error.message
      });
    }
  }

  /**
   * Get intervention history with analytics for a student
   * Gets complete intervention history for student
   */
  async getInterventionHistory(req, res) {
    try {
      const { studentId } = req.params;

      if (!studentId) {
        return res.status(400).json({
          success: false,
          message: 'Student ID is required'
        });
      }

      // Get all prescriptive analyses with intervention history
      const analyses = await PrescriptiveAnalysis.find({
        studentId: mongoose.Types.ObjectId.isValid(studentId) ? 
          new mongoose.Types.ObjectId(studentId) : studentId
      }).sort({ updatedAt: -1 });

      // Extract intervention history from all analyses
      const allInterventionHistory = [];
      let totalCategories = 0;
      let categoriesRequiringEscalation = 0;

      for (const analysis of analyses) {
        if (analysis.interventionHistory && analysis.interventionHistory.length > 0) {
          allInterventionHistory.push(...analysis.interventionHistory);
          totalCategories++;
          
          if (analysis.insights?.recommendedAction === 'face_to_face_required') {
            categoriesRequiringEscalation++;
          }
        }
      }

      return res.status(200).json({
        success: true,
        data: {
          history: allInterventionHistory,
          summary: {
            totalCategories,
            categoriesRequiringEscalation,
            totalInterventionAttempts: allInterventionHistory.length
          }
        }
      });

    } catch (error) {
      console.error('Error getting intervention history:', error);
      return res.status(500).json({
        success: false,
        message: 'Server error while retrieving intervention history',
        error: error.message
      });
    }
  }
}

// Create controller instance
const controller = new PrescriptiveAnalysisController();

// Export methods bound to controller instance
module.exports = {
  getStudentAnalyses: controller.getStudentAnalyses.bind(controller),
  generateAnalysesFromResults: controller.generateAnalysesFromResults.bind(controller),
  generateComprehensiveAnalysis: controller.generateComprehensiveAnalysis.bind(controller),
  generateAnalysisFromIntervention: controller.generateAnalysisFromIntervention.bind(controller),
  getInterventionHistory: controller.getInterventionHistory.bind(controller)
};