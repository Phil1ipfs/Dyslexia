// Prescriptive Analytics Controller
// Handles API endpoints for prescriptive analysis generation and management

const prescriptiveAnalyticsService = require('../../services/Teachers/PrescriptiveAnalyticsService');
const timePredictionService = require('../../services/Teachers/PrescriptiveAnalytics/timePredictionService');
const dynamicQuestionService = require('../../services/Teachers/PrescriptiveAnalytics/dynamicQuestionService');
const progressTrackingService = require('../../services/Teachers/ProgressTrackingService');
const PrescriptiveAnalysis = require('../../models/Teachers/ManageProgress/prescriptiveAnalysisModel');
const CategoryResult = require('../../models/Teachers/ManageProgress/categoryResultModel');

class PrescriptiveAnalyticsController {

  /**
   * Generate prescriptive analysis after category results are created
   * POST /api/prescriptive-analytics/generate
   */
  async generateAnalysis(req, res) {
    try {
      const { categoryResultId } = req.body;

      console.log(`Generating prescriptive analysis for category result: ${categoryResultId}`);

      const analysis = await prescriptiveAnalyticsService.generatePrescriptiveAnalysis(categoryResultId);

      res.status(201).json({
        success: true,
        message: 'Prescriptive analysis generated successfully',
        data: {
          analysisId: analysis._id,
          studentId: analysis.studentId,
          readingLevel: analysis.readingLevel,
          assessmentType: analysis.assessmentType,
          insights: analysis.insights,
          interventionPlan: analysis.interventionPlan,
          createdAt: analysis.createdAt
        }
      });

    } catch (error) {
      console.error('Error generating prescriptive analysis:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to generate prescriptive analysis',
        error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
      });
    }
  }

  /**
   * Get prescriptive analysis by ID
   * GET /api/prescriptive-analytics/:id
   */
  async getAnalysisById(req, res) {
    try {
      const { id } = req.params;

      const analysis = await PrescriptiveAnalysis.findById(id)
        .populate('categoryResultId');

      if (!analysis) {
        return res.status(404).json({
          success: false,
          message: 'Prescriptive analysis not found'
        });
      }

      res.json({
        success: true,
        data: analysis
      });

    } catch (error) {
      console.error('Error fetching prescriptive analysis:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch prescriptive analysis',
        error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
      });
    }
  }

  /**
   * Get latest prescriptive analysis for a student
   * GET /api/prescriptive-analytics/student/:studentId/latest
   */
  async getLatestAnalysisForStudent(req, res) {
    try {
      const { studentId } = req.params;
      const { assessmentType = 'main' } = req.query;

      const analysis = await PrescriptiveAnalysis.findOne({ 
        studentId: parseInt(studentId),
        assessmentType 
      })
        .sort({ createdAt: -1 })
        .populate('categoryResultId');

      if (!analysis) {
        return res.status(404).json({
          success: false,
          message: 'No prescriptive analysis found for this student'
        });
      }

      res.json({
        success: true,
        data: analysis
      });

    } catch (error) {
      console.error('Error fetching latest analysis:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch latest analysis',
        error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
      });
    }
  }

  /**
   * Get all prescriptive analyses for a student
   * GET /api/prescriptive-analytics/student/:studentId
   */
  async getAnalysesForStudent(req, res) {
    try {
      const { studentId } = req.params;
      const { limit = 10, page = 1, assessmentType } = req.query;

      const query = { studentId: parseInt(studentId) };
      if (assessmentType) {
        query.assessmentType = assessmentType;
      }

      const analyses = await PrescriptiveAnalysis.find(query)
        .sort({ createdAt: -1 })
        .limit(parseInt(limit))
        .skip((parseInt(page) - 1) * parseInt(limit))
        .populate('categoryResultId');

      const total = await PrescriptiveAnalysis.countDocuments(query);

      res.json({
        success: true,
        data: analyses,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          pages: Math.ceil(total / parseInt(limit))
        }
      });

    } catch (error) {
      console.error('Error fetching student analyses:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch student analyses',
        error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
      });
    }
  }

  /**
   * Update analysis after intervention completion
   * PUT /api/prescriptive-analytics/update-after-intervention
   */
  async updateAfterIntervention(req, res) {
    try {
      const { studentId, interventionResultId } = req.body;

      console.log(`Updating prescriptive analysis for student ${studentId} after intervention ${interventionResultId}`);

      const updatedAnalysis = await prescriptiveAnalyticsService.updateAnalysisAfterIntervention(
        parseInt(studentId),
        interventionResultId
      );

      res.json({
        success: true,
        message: 'Analysis updated after intervention',
        data: {
          analysisId: updatedAnalysis._id,
          studentId: updatedAnalysis.studentId,
          interventionHistory: updatedAnalysis.interventionHistory,
          interventionPlan: updatedAnalysis.interventionPlan,
          insights: updatedAnalysis.insights,
          updatedAt: updatedAnalysis.updatedAt
        }
      });

    } catch (error) {
      console.error('Error updating analysis after intervention:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to update analysis after intervention',
        error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
      });
    }
  }

  /**
   * Check if student needs face-to-face intervention
   * GET /api/prescriptive-analytics/face-to-face-check/:studentId/:category
   */
  async checkFaceToFaceNeeded(req, res) {
    try {
      const { studentId, category } = req.params;

      const recommendation = await prescriptiveAnalyticsService.checkFaceToFaceRecommendation(
        parseInt(studentId),
        category
      );

      res.json({
        success: true,
        data: recommendation
      });

    } catch (error) {
      console.error('Error checking face-to-face recommendation:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to check face-to-face recommendation',
        error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
      });
    }
  }

  /**
   * Get analysis summary for dashboard
   * GET /api/prescriptive-analytics/dashboard/:studentId
   */
  async getDashboardSummary(req, res) {
    try {
      const { studentId } = req.params;

      // Get latest analysis
      const latestAnalysis = await PrescriptiveAnalysis.findOne({ 
        studentId: parseInt(studentId),
        assessmentType: 'main'
      })
        .sort({ createdAt: -1 });

      if (!latestAnalysis) {
        return res.status(404).json({
          success: false,
          message: 'No analysis found for dashboard'
        });
      }

      // Get progress over time (last 5 analyses)
      const progressAnalyses = await PrescriptiveAnalysis.find({
        studentId: parseInt(studentId),
        assessmentType: 'main'
      })
        .sort({ createdAt: -1 })
        .limit(5);

      // Calculate progress trends
      const progressTrends = this.calculateProgressTrends(progressAnalyses);

      // Get pending interventions
      const pendingInterventions = latestAnalysis.interventionPlan.required 
        ? latestAnalysis.interventionPlan.priority 
        : [];

      // Get recent intervention results
      const recentInterventions = latestAnalysis.interventionHistory.slice(0, 3);

      const dashboardData = {
        currentAnalysis: {
          id: latestAnalysis._id,
          overallScore: latestAnalysis.insights.overallScore,
          readingLevel: latestAnalysis.readingLevel,
          passedCategories: latestAnalysis.insights.passedCategories,
          failedCategories: latestAnalysis.insights.failedCategories,
          strengths: latestAnalysis.insights.strengths,
          weaknesses: latestAnalysis.insights.weaknesses,
          recommendedAction: latestAnalysis.insights.recommendedAction,
          assessmentDate: latestAnalysis.assessmentDate
        },
        progressTrends,
        pendingInterventions,
        recentInterventions,
        needsFaceToFace: latestAnalysis.insights.recommendedAction === 'face_to_face_required'
      };

      res.json({
        success: true,
        data: dashboardData
      });

    } catch (error) {
      console.error('Error generating dashboard summary:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to generate dashboard summary',
        error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
      });
    }
  }

  /**
   * Get detailed skill mastery report
   * GET /api/prescriptive-analytics/skill-mastery/:studentId
   */
  async getSkillMasteryReport(req, res) {
    try {
      const { studentId } = req.params;
      const { category } = req.query;

      const query = { 
        studentId: parseInt(studentId),
        assessmentType: 'main'
      };

      const analyses = await PrescriptiveAnalysis.find(query)
        .sort({ createdAt: -1 })
        .limit(10);

      if (analyses.length === 0) {
        return res.status(404).json({
          success: false,
          message: 'No skill mastery data found'
        });
      }

      const masteryReport = this.buildSkillMasteryReport(analyses, category);

      res.json({
        success: true,
        data: masteryReport
      });

    } catch (error) {
      console.error('Error generating skill mastery report:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to generate skill mastery report',
        error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
      });
    }
  }

  /**
   * Get error pattern analysis report
   * GET /api/prescriptive-analytics/error-patterns/:studentId
   */
  async getErrorPatternReport(req, res) {
    try {
      const { studentId } = req.params;

      const latestAnalysis = await PrescriptiveAnalysis.findOne({ 
        studentId: parseInt(studentId),
        assessmentType: 'main'
      })
        .sort({ createdAt: -1 });

      if (!latestAnalysis) {
        return res.status(404).json({
          success: false,
          message: 'No error pattern data found'
        });
      }

      const errorReport = this.buildErrorPatternReport(latestAnalysis);

      res.json({
        success: true,
        data: errorReport
      });

    } catch (error) {
      console.error('Error generating error pattern report:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to generate error pattern report',
        error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
      });
    }
  }

  // Helper methods

  calculateProgressTrends(analyses) {
    if (analyses.length < 2) {
      return { trend: 'insufficient_data', data: [] };
    }

    const progressData = analyses.reverse().map(analysis => ({
      date: analysis.assessmentDate,
      overallScore: analysis.insights.overallScore,
      passedCategories: analysis.insights.passedCategories,
      failedCategories: analysis.insights.failedCategories
    }));

    // Calculate trend (improving, declining, stable)
    const scores = progressData.map(d => d.overallScore);
    const firstHalf = scores.slice(0, Math.floor(scores.length / 2));
    const secondHalf = scores.slice(Math.ceil(scores.length / 2));
    
    const firstAvg = firstHalf.reduce((sum, score) => sum + score, 0) / firstHalf.length;
    const secondAvg = secondHalf.reduce((sum, score) => sum + score, 0) / secondHalf.length;
    
    const difference = secondAvg - firstAvg;
    let trend;
    
    if (Math.abs(difference) < 5) {
      trend = 'stable';
    } else if (difference > 0) {
      trend = 'improving';
    } else {
      trend = 'declining';
    }

    return {
      trend,
      data: progressData,
      improvement: Math.round(difference)
    };
  }

  buildSkillMasteryReport(analyses, targetCategory) {
    const latestAnalysis = analyses[0];
    const report = {
      studentId: latestAnalysis.studentId,
      readingLevel: latestAnalysis.readingLevel,
      categories: {}
    };

    // Convert Map to Object for each category
    for (const [category, mastery] of latestAnalysis.skillMastery) {
      if (!targetCategory || category === targetCategory) {
        report.categories[category] = {
          masteryProbability: mastery.masteryProbability,
          score: mastery.score,
          isPassed: mastery.isPassed,
          totalQuestions: mastery.totalQuestions,
          correctAnswers: mastery.correctAnswers,
          lastUpdated: mastery.lastUpdated,
          responseHistory: mastery.responseHistory,
          abilityEstimate: latestAnalysis.abilityEstimates[category] || 0
        };
      }
    }

    return report;
  }

  buildErrorPatternReport(analysis) {
    const report = {
      studentId: analysis.studentId,
      readingLevel: analysis.readingLevel,
      assessmentDate: analysis.assessmentDate,
      errorPatterns: {},
      interventionRecommendations: analysis.interventionPlan.specificFocus || {}
    };

    // Convert Map to Object for error patterns
    if (analysis.errorPatterns) {
      for (const [category, patterns] of analysis.errorPatterns) {
        report.errorPatterns[category] = patterns;
      }
    }

    return report;
  }

  /**
   * Predict intervention time for a student
   * POST /api/prescriptive-analytics/predict-time
   */
  async predictInterventionTime(req, res) {
    try {
      const { studentId, category, questionCount, readingLevel, availableMinutes } = req.body;

      console.log(`Predicting intervention time for student ${studentId}, category ${category}`);

      const timePrediction = await timePredictionService.predictInterventionTime(
        parseInt(studentId),
        category,
        questionCount || null,
        readingLevel,
        availableMinutes || 30
      );

      res.json({
        success: true,
        data: timePrediction
      });

    } catch (error) {
      console.error('Error predicting intervention time:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to predict intervention time',
        error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
      });
    }
  }

  /**
   * Generate dynamic question plan based on analysis
   * POST /api/prescriptive-analytics/dynamic-questions
   */
  async generateDynamicQuestions(req, res) {
    try {
      const { analysisId, category, availableMinutes, constraints } = req.body;

      console.log(`Generating dynamic question plan for analysis ${analysisId}, category ${category}`);

      // Get the analysis data
      const analysis = await PrescriptiveAnalysis.findById(analysisId);
      if (!analysis) {
        return res.status(404).json({
          success: false,
          message: 'Analysis not found'
        });
      }

      const analysisData = {
        studentId: analysis.studentId,
        readingLevel: analysis.readingLevel,
        skillMastery: analysis.skillMastery,
        errorPatterns: analysis.errorPatterns,
        abilityEstimates: analysis.abilityEstimates
      };

      const questionPlan = await dynamicQuestionService.generateDynamicQuestionPlan(
        analysisData,
        category,
        availableMinutes || 30,
        constraints || null
      );

      res.json({
        success: true,
        data: questionPlan
      });

    } catch (error) {
      console.error('Error generating dynamic questions:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to generate dynamic questions',
        error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
      });
    }
  }

  /**
   * Get student's historical response time patterns
   * GET /api/prescriptive-analytics/response-time-patterns/:studentId/:category
   */
  async getResponseTimePatterns(req, res) {
    try {
      const { studentId, category } = req.params;

      console.log(`Getting response time patterns for student ${studentId}, category ${category}`);

      const patterns = await timePredictionService.getHistoricalResponseTimes(
        parseInt(studentId),
        category
      );

      res.json({
        success: true,
        data: {
          studentId: parseInt(studentId),
          category,
          patterns
        }
      });

    } catch (error) {
      console.error('Error getting response time patterns:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to get response time patterns',
        error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
      });
    }
  }

  /**
   * Get system health status
   * GET /api/prescriptive-analytics/health
   */
  async getSystemHealth(req, res) {
    try {
      const IntegrationTriggerService = require('../../services/Teachers/PrescriptiveAnalytics/integrationTriggerService');
      
      const [serviceHealth, integrationHealth] = await Promise.all([
        prescriptiveAnalyticsService.healthCheck(),
        IntegrationTriggerService.healthCheck()
      ]);

      const overallHealth = {
        status: serviceHealth.status === 'healthy' && integrationHealth.status === 'healthy' ? 'healthy' : 'unhealthy',
        timestamp: new Date(),
        components: {
          prescriptiveAnalyticsService: serviceHealth,
          integrationTriggerService: integrationHealth
        }
      };

      res.json({
        success: true,
        data: overallHealth
      });
    } catch (error) {
      console.error('Error getting system health:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to get system health',
        error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
      });
    }
  }

  // Additional methods from ManageProgress integration

  /**
   * Generate comprehensive prescriptive analysis using BKT/IRT mathematical models
   * POST /api/prescriptive-analytics/comprehensive/:studentId
   */
  async generateComprehensiveAnalysis(req, res) {
    try {
      const { studentId } = req.params;
      
      console.log(`Generating comprehensive BKT/IRT analysis for student ${studentId}`);

      // Get most recent category result for student
      const CategoryResultsService = require('../../services/Teachers/CategoryResultsService');
      const categoryResults = await CategoryResultsService.getCategoryResults(studentId);
      
      if (categoryResults.length === 0) {
        return res.status(404).json({
          success: false,
          message: 'No category results found for analysis'
        });
      }

      // Use comprehensive service to generate analysis
      const mostRecentResult = categoryResults[0];
      const analysis = await prescriptiveAnalyticsService.generatePrescriptiveAnalysis(mostRecentResult._id);

      res.status(201).json({
        success: true,
        message: 'Comprehensive BKT/IRT analysis generated successfully',
        data: {
          analysisId: analysis._id,
          studentId: analysis.studentId,
          readingLevel: analysis.readingLevel,
          assessmentType: analysis.assessmentType,
          skillMastery: analysis.skillMastery,
          abilityEstimates: analysis.abilityEstimates,
          errorPatterns: analysis.errorPatterns,
          interventionPlan: analysis.interventionPlan,
          insights: analysis.insights,
          createdAt: analysis.createdAt
        }
      });

    } catch (error) {
      console.error('Error generating comprehensive analysis:', error);
      res.status(500).json({
        success: false,
        message: 'Server error while generating comprehensive analysis',
        error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
      });
    }
  }

  /**
   * Generate prescriptive analysis from intervention results
   * POST /api/prescriptive-analytics/intervention/:interventionId
   */
  async generateAnalysisFromIntervention(req, res) {
    try {
      const { interventionId } = req.params;

      console.log(`Generating analysis from intervention ${interventionId}`);

      // Use the intervention service to generate analysis
      const InterventionService = require('../../services/Teachers/InterventionService');
      const result = await InterventionService.generateAnalysisFromIntervention(interventionId);

      res.status(201).json({
        success: true,
        message: 'Prescriptive analysis generated from intervention results',
        data: result.data,
        interventionOutcome: result.interventionOutcome
      });

    } catch (error) {
      console.error('Error generating analysis from intervention:', error);
      res.status(500).json({
        success: false,
        message: 'Server error while generating analysis from intervention',
        error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
      });
    }
  }

  /**
   * Get intervention history with analytics for a student
   * GET /api/prescriptive-analytics/intervention-history/:studentId
   */
  async getInterventionHistory(req, res) {
    try {
      const { studentId } = req.params;

      console.log(`Getting intervention history for student ${studentId}`);

      // Get all prescriptive analyses with intervention history
      const analyses = await PrescriptiveAnalysis.find({
        studentId: parseInt(studentId)
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

      res.json({
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
      res.status(500).json({
        success: false,
        message: 'Server error while retrieving intervention history',
        error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
      });
    }
  }

  /**
   * Update recommendation template for easy updates
   * PUT /api/prescriptive-analytics/template
   */
  async updateRecommendationTemplate(req, res) {
    try {
      const { templateType, templateContent } = req.body;

      console.log(`Updating recommendation template: ${templateType}`);

      // Use service to update template
      const updatedTemplate = await prescriptiveAnalyticsService.updateRecommendationTemplate(
        templateType,
        templateContent
      );

      res.json({
        success: true,
        message: 'Recommendation template updated successfully',
        data: updatedTemplate
      });

    } catch (error) {
      console.error('Error updating recommendation template:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to update recommendation template',
        error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
      });
    }
  }

  /**
   * Get available templates
   * GET /api/prescriptive-analytics/templates
   */
  async getAvailableTemplates(req, res) {
    try {
      console.log('Getting available recommendation templates');

      // Use service to get templates
      const templates = await prescriptiveAnalyticsService.getAvailableTemplates();

      res.json({
        success: true,
        data: templates
      });

    } catch (error) {
      console.error('Error getting available templates:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to get available templates',
        error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
      });
    }
  }

  // Progress Tracking and Analytics Methods

  /**
   * Get comprehensive progress tracking analytics for a student
   * GET /api/prescriptive-analytics/progress/:studentId
   */
  async getProgressAnalytics(req, res) {
    try {
      const { studentId } = req.params;
      const { dateRange = 'all' } = req.query;

      console.log(`Getting comprehensive progress analytics for student ${studentId}`);

      const progressData = await progressTrackingService.getStudentProgressAnalytics(
        parseInt(studentId),
        dateRange
      );

      res.json({
        success: true,
        data: progressData
      });

    } catch (error) {
      console.error('Error getting progress analytics:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to get progress analytics',
        error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
      });
    }
  }

  /**
   * Get before/after intervention comparison analytics
   * GET /api/prescriptive-analytics/intervention-comparison/:studentId
   */
  async getInterventionComparisons(req, res) {
    try {
      const { studentId } = req.params;
      const { category } = req.query;

      console.log(`Getting intervention comparisons for student ${studentId}`);

      // Get full progress analytics and extract intervention comparisons
      const progressData = await progressTrackingService.getStudentProgressAnalytics(
        parseInt(studentId)
      );

      if (!progressData.hasData) {
        return res.status(404).json({
          success: false,
          message: 'No progress data available for comparison'
        });
      }

      let comparisons = progressData.interventionComparisons || [];

      // Filter by category if specified
      if (category) {
        comparisons = comparisons.filter(comp => comp.category === category);
      }

      res.json({
        success: true,
        data: {
          studentId: parseInt(studentId),
          category: category || 'all',
          totalComparisons: comparisons.length,
          comparisons,
          summary: {
            effectiveInterventions: comparisons.filter(c => c.improvement.effectiveIntervention).length,
            averageScoreImprovement: comparisons.length > 0 
              ? Math.round(comparisons.reduce((sum, c) => sum + c.improvement.scoreChange, 0) / comparisons.length)
              : 0,
            averageMasteryImprovement: comparisons.length > 0
              ? Math.round((comparisons.reduce((sum, c) => sum + c.improvement.masteryChange, 0) / comparisons.length) * 100) / 100
              : 0
          }
        }
      });

    } catch (error) {
      console.error('Error getting intervention comparisons:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to get intervention comparisons',
        error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
      });
    }
  }

  /**
   * Get category-specific progress trends
   * GET /api/prescriptive-analytics/category-progress/:studentId/:category
   */
  async getCategoryProgress(req, res) {
    try {
      const { studentId, category } = req.params;
      const { dateRange = 'all' } = req.query;

      console.log(`Getting category progress for student ${studentId}, category: ${category}`);

      const progressData = await progressTrackingService.getStudentProgressAnalytics(
        parseInt(studentId),
        dateRange
      );

      if (!progressData.hasData) {
        return res.status(404).json({
          success: false,
          message: 'No progress data available'
        });
      }

      const categoryProgress = progressData.categoryProgress[category];
      const masteryProgression = progressData.masteryProgression[category];

      if (!categoryProgress?.hasData) {
        return res.status(404).json({
          success: false,
          message: `No progress data available for category: ${category}`
        });
      }

      res.json({
        success: true,
        data: {
          studentId: parseInt(studentId),
          category,
          dateRange,
          progress: categoryProgress,
          masteryProgression,
          interventions: (progressData.interventionComparisons || []).filter(c => c.category === category)
        }
      });

    } catch (error) {
      console.error('Error getting category progress:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to get category progress',
        error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
      });
    }
  }

  /**
   * Get intervention effectiveness analytics
   * GET /api/prescriptive-analytics/intervention-effectiveness/:studentId
   */
  async getInterventionEffectiveness(req, res) {
    try {
      const { studentId } = req.params;

      console.log(`Getting intervention effectiveness for student ${studentId}`);

      const progressData = await progressTrackingService.getStudentProgressAnalytics(
        parseInt(studentId)
      );

      if (!progressData.hasData) {
        return res.status(404).json({
          success: false,
          message: 'No progress data available'
        });
      }

      res.json({
        success: true,
        data: {
          studentId: parseInt(studentId),
          interventionAnalytics: progressData.interventionAnalytics,
          interventionComparisons: progressData.interventionComparisons,
          insights: progressData.insights,
          summary: {
            hasInterventions: progressData.interventionAnalytics?.hasInterventions || false,
            totalInterventions: progressData.interventionAnalytics?.totalInterventions || 0,
            successRate: progressData.interventionAnalytics?.successRate || 0,
            effectiveInterventions: (progressData.interventionComparisons || []).filter(c => c.improvement.effectiveIntervention).length
          }
        }
      });

    } catch (error) {
      console.error('Error getting intervention effectiveness:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to get intervention effectiveness',
        error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
      });
    }
  }
}

module.exports = new PrescriptiveAnalyticsController();