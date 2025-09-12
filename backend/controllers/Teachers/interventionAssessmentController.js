const InterventionGeneratorService = require('../../services/Teachers/InterventionGeneratorService');
const InterventionAssessment = require('../../models/Teachers/ManageProgress/interventionAssessmentModel');
const InterventionResponse = require('../../models/Teachers/ManageProgress/interventionResponseModel');
const PrescriptiveAnalysis = require('../../models/Teachers/ManageProgress/prescriptiveAnalysisModel');
const InterventionResults = require('../../models/Teachers/ManageProgress/interventionResultsModel');

/**
 * Intervention Assessment Controller
 * Handles API endpoints for one-time intervention generation and management
 */
class InterventionAssessmentController {

  /**
   * Generate one-time intervention based on prescriptive analysis
   * POST /api/intervention-assessment/generate
   */
  async generateIntervention(req, res) {
    try {
      const { analysisId, category } = req.body;

      console.log(`[INTERVENTION CONTROLLER] Generating intervention for analysis ${analysisId}, category: ${category}`);

      const intervention = await InterventionGeneratorService.generateIntervention(analysisId, category);

      res.status(201).json({
        success: true,
        message: 'Intervention generated successfully',
        data: {
          interventionId: intervention._id,
          studentId: intervention.studentId,
          category: intervention.category,
          readingLevel: intervention.readingLevel,
          totalQuestions: intervention.totalQuestions,
          questions: intervention.questions,
          status: intervention.status,
          createdAt: intervention.createdAt
        }
      });

    } catch (error) {
      console.error('[INTERVENTION CONTROLLER] Error generating intervention:', error);
      
      if (error.message.includes('already attempted')) {
        return res.status(409).json({
          success: false,
          message: 'Intervention already attempted',
          error: error.message
        });
      }
      
      if (error.message.includes('already passed')) {
        return res.status(400).json({
          success: false,
          message: 'Category already passed',
          error: error.message
        });
      }

      res.status(500).json({
        success: false,
        message: 'Failed to generate intervention',
        error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
      });
    }
  }

  /**
   * Check if student is eligible for intervention in a category
   * GET /api/intervention-assessment/eligibility/:studentId/:category
   */
  async checkEligibility(req, res) {
    try {
      const { studentId, category } = req.params;

      const eligibility = await InterventionGeneratorService.checkInterventionEligibility(
        parseInt(studentId),
        category
      );

      res.json({
        success: true,
        data: eligibility
      });

    } catch (error) {
      console.error('[INTERVENTION CONTROLLER] Error checking eligibility:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to check eligibility',
        error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
      });
    }
  }

  /**
   * Get intervention assessment by ID
   * GET /api/intervention-assessment/:interventionId
   */
  async getInterventionById(req, res) {
    try {
      const { interventionId } = req.params;

      const intervention = await InterventionAssessment.findById(interventionId)
        .populate('prescriptiveAnalysisId');

      if (!intervention) {
        return res.status(404).json({
          success: false,
          message: 'Intervention not found'
        });
      }

      res.json({
        success: true,
        data: intervention
      });

    } catch (error) {
      console.error('[INTERVENTION CONTROLLER] Error fetching intervention:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch intervention',
        error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
      });
    }
  }

  /**
   * Get all interventions for a student
   * GET /api/intervention-assessment/student/:studentId
   */
  async getInterventionsForStudent(req, res) {
    try {
      const { studentId } = req.params;
      const { limit = 10, page = 1 } = req.query;

      const interventions = await InterventionAssessment.find({ 
        studentId: parseInt(studentId) 
      })
        .sort({ createdAt: -1 })
        .limit(parseInt(limit))
        .skip((parseInt(page) - 1) * parseInt(limit))
        .populate('prescriptiveAnalysisId');

      const total = await InterventionAssessment.countDocuments({ 
        studentId: parseInt(studentId) 
      });

      res.json({
        success: true,
        data: interventions,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          pages: Math.ceil(total / parseInt(limit))
        }
      });

    } catch (error) {
      console.error('[INTERVENTION CONTROLLER] Error fetching student interventions:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch student interventions',
        error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
      });
    }
  }

  /**
   * Get active interventions for a student
   * GET /api/intervention-assessment/student/:studentId/active
   */
  async getActiveInterventionsForStudent(req, res) {
    try {
      const { studentId } = req.params;

      const activeInterventions = await InterventionAssessment.find({ 
        studentId: parseInt(studentId),
        status: 'active'
      })
        .sort({ createdAt: -1 })
        .populate('prescriptiveAnalysisId');

      res.json({
        success: true,
        data: activeInterventions
      });

    } catch (error) {
      console.error('[INTERVENTION CONTROLLER] Error fetching active interventions:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch active interventions',
        error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
      });
    }
  }

  /**
   * Mark intervention as started
   * POST /api/intervention-assessment/:interventionId/start
   */
  async startIntervention(req, res) {
    try {
      const { interventionId } = req.params;

      const intervention = await InterventionAssessment.findById(interventionId);
      if (!intervention) {
        return res.status(404).json({
          success: false,
          message: 'Intervention not found'
        });
      }

      await intervention.markAsStarted();

      res.json({
        success: true,
        message: 'Intervention started',
        data: {
          interventionId: intervention._id,
          status: intervention.status,
          startedAt: intervention.startedAt
        }
      });

    } catch (error) {
      console.error('[INTERVENTION CONTROLLER] Error starting intervention:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to start intervention',
        error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
      });
    }
  }

  /**
   * Mark intervention as completed
   * POST /api/intervention-assessment/:interventionId/complete
   */
  async completeIntervention(req, res) {
    try {
      const { interventionId } = req.params;

      const intervention = await InterventionAssessment.findById(interventionId);
      if (!intervention) {
        return res.status(404).json({
          success: false,
          message: 'Intervention not found'
        });
      }

      // Process all intervention responses and create final results
      const processingResult = await InterventionGeneratorService.processInterventionResults(interventionId);
      
      if (!processingResult.success) {
        throw new Error('Failed to process intervention results');
      }

      // Mark intervention as completed with results ID
      await intervention.markAsCompleted(processingResult.interventionResultsId);

      // Update prescriptive analysis with intervention completion
      const prescriptiveAnalyticsService = require('../../services/Teachers/PrescriptiveAnalyticsService');
      await prescriptiveAnalyticsService.updateAnalysisAfterIntervention(
        intervention.studentId,
        processingResult.interventionResultsId
      );

      res.json({
        success: true,
        message: 'Intervention completed and results processed',
        data: {
          interventionId: intervention._id,
          interventionResultsId: processingResult.interventionResultsId,
          status: intervention.status,
          completedAt: intervention.completedAt,
          results: processingResult.results
        }
      });

    } catch (error) {
      console.error('[INTERVENTION CONTROLLER] Error completing intervention:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to complete intervention',
        error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
      });
    }
  }

  /**
   * Get questions for an intervention
   * GET /api/intervention-assessment/:interventionId/questions
   */
  async getInterventionQuestions(req, res) {
    try {
      const { interventionId } = req.params;

      const intervention = await InterventionAssessment.findById(interventionId);
      if (!intervention) {
        return res.status(404).json({
          success: false,
          message: 'Intervention not found'
        });
      }

      res.json({
        success: true,
        data: {
          interventionId: intervention._id,
          category: intervention.category,
          totalQuestions: intervention.totalQuestions,
          questions: intervention.questions
        }
      });

    } catch (error) {
      console.error('[INTERVENTION CONTROLLER] Error fetching questions:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch questions',
        error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
      });
    }
  }

  /**
   * Get a specific question from an intervention
   * GET /api/intervention-assessment/:interventionId/question/:questionId
   */
  async getInterventionQuestion(req, res) {
    try {
      const { interventionId, questionId } = req.params;

      const intervention = await InterventionAssessment.findById(interventionId);
      if (!intervention) {
        return res.status(404).json({
          success: false,
          message: 'Intervention not found'
        });
      }

      const question = intervention.getQuestionById(questionId);
      if (!question) {
        return res.status(404).json({
          success: false,
          message: 'Question not found'
        });
      }

      res.json({
        success: true,
        data: {
          interventionId: intervention._id,
          question: question
        }
      });

    } catch (error) {
      console.error('[INTERVENTION CONTROLLER] Error fetching question:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch question',
        error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
      });
    }
  }

  /**
   * Record student response to intervention question
   * POST /api/intervention-assessment/:interventionId/response
   */
  async recordResponse(req, res) {
    try {
      const { interventionId } = req.params;
      const { questionId, response, isCorrect, responseTime } = req.body;

      const intervention = await InterventionAssessment.findById(interventionId);
      if (!intervention) {
        return res.status(404).json({
          success: false,
          message: 'Intervention not found'
        });
      }

      // Create intervention response record
      const responseData = {
        studentId: intervention.studentId,
        interventionAssessmentId: interventionId,
        categoryId: null, // We don't have categoryId in the new model
        questionId,
        category: intervention.category,
        response,
        isCorrect,
        responseTime: responseTime || null,
        answeredAt: new Date(),
        createdAt: new Date(),
        readingLevel: intervention.readingLevel
      };

      const interventionResponse = new InterventionResponse(responseData);
      await interventionResponse.save();

      res.json({
        success: true,
        message: 'Response recorded',
        data: {
          responseId: interventionResponse._id,
          questionId,
          isCorrect,
          responseTime: responseTime
        }
      });

    } catch (error) {
      console.error('[INTERVENTION CONTROLLER] Error recording response:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to record response',
        error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
      });
    }
  }

  /**
   * Get intervention progress
   * GET /api/intervention-assessment/:interventionId/progress
   */
  async getInterventionProgress(req, res) {
    try {
      const { interventionId } = req.params;

      const intervention = await InterventionAssessment.findById(interventionId);
      if (!intervention) {
        return res.status(404).json({
          success: false,
          message: 'Intervention not found'
        });
      }

      // Count responses for this intervention
      const responseCount = await InterventionResponse.countDocuments({
        interventionAssessmentId: interventionId
      });

      const correctCount = await InterventionResponse.countDocuments({
        interventionAssessmentId: interventionId,
        isCorrect: true
      });

      const progress = {
        interventionId: intervention._id,
        category: intervention.category,
        totalQuestions: intervention.totalQuestions,
        answeredQuestions: responseCount,
        correctAnswers: correctCount,
        percentComplete: Math.round((responseCount / intervention.totalQuestions) * 100),
        percentCorrect: responseCount > 0 ? Math.round((correctCount / responseCount) * 100) : 0,
        isCompleted: intervention.status === 'completed',
        startedAt: intervention.startedAt,
        completedAt: intervention.completedAt
      };

      res.json({
        success: true,
        data: progress
      });

    } catch (error) {
      console.error('[INTERVENTION CONTROLLER] Error fetching progress:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch progress',
        error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
      });
    }
  }

  /**
   * Delete an intervention (admin only)
   * DELETE /api/intervention-assessment/:interventionId
   */
  async deleteIntervention(req, res) {
    try {
      const { interventionId } = req.params;

      const intervention = await InterventionAssessment.findByIdAndDelete(interventionId);
      if (!intervention) {
        return res.status(404).json({
          success: false,
          message: 'Intervention not found'
        });
      }

      // Also delete associated responses
      await InterventionResponse.deleteMany({
        interventionAssessmentId: interventionId
      });

      res.json({
        success: true,
        message: 'Intervention deleted',
        data: {
          deletedInterventionId: interventionId
        }
      });

    } catch (error) {
      console.error('[INTERVENTION CONTROLLER] Error deleting intervention:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to delete intervention',
        error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
      });
    }
  }

  /**
   * Get intervention statistics for a student
   * GET /api/intervention-assessment/statistics/:studentId
   */
  async getStudentInterventionStatistics(req, res) {
    try {
      const { studentId } = req.params;

      const interventions = await InterventionAssessment.find({ 
        studentId: parseInt(studentId) 
      });

      const totalInterventions = interventions.length;
      const completedInterventions = interventions.filter(i => i.status === 'completed').length;
      const activeInterventions = interventions.filter(i => i.status === 'active').length;

      // Get category breakdown
      const categoryBreakdown = {};
      interventions.forEach(intervention => {
        if (!categoryBreakdown[intervention.category]) {
          categoryBreakdown[intervention.category] = {
            total: 0,
            completed: 0,
            active: 0
          };
        }
        categoryBreakdown[intervention.category].total++;
        if (intervention.status === 'completed') {
          categoryBreakdown[intervention.category].completed++;
        } else if (intervention.status === 'active') {
          categoryBreakdown[intervention.category].active++;
        }
      });

      const statistics = {
        studentId: parseInt(studentId),
        totalInterventions,
        completedInterventions,
        activeInterventions,
        categoryBreakdown
      };

      res.json({
        success: true,
        data: statistics
      });

    } catch (error) {
      console.error('[INTERVENTION CONTROLLER] Error fetching statistics:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch statistics',
        error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
      });
    }
  }

  /**
   * Validate intervention generation request without creating
   * POST /api/intervention-assessment/validate-generation
   */
  async validateInterventionGeneration(req, res) {
    try {
      const { analysisId, category } = req.body;

      // Get prescriptive analysis
      const analysis = await PrescriptiveAnalysis.findById(analysisId);
      if (!analysis) {
        return res.status(404).json({
          success: false,
          message: 'Prescriptive analysis not found'
        });
      }

      // Check eligibility
      const eligibility = await InterventionGeneratorService.checkInterventionEligibility(
        analysis.studentId,
        category
      );

      if (!eligibility.eligible) {
        return res.status(400).json({
          success: false,
          message: 'Intervention generation not allowed',
          data: eligibility
        });
      }

      res.json({
        success: true,
        message: 'Intervention generation is valid',
        data: {
          studentId: analysis.studentId,
          category,
          readingLevel: analysis.readingLevel,
          eligibility
        }
      });

    } catch (error) {
      console.error('[INTERVENTION CONTROLLER] Error validating generation:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to validate generation',
        error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
      });
    }
  }

  /**
   * Health check for intervention assessment service
   * GET /api/intervention-assessment/health
   */
  async getServiceHealth(req, res) {
    try {
      // Test database connectivity
      const sampleIntervention = await InterventionAssessment.findOne({}).limit(1);
      const sampleResponse = await InterventionResponse.findOne({}).limit(1);

      const health = {
        status: 'healthy',
        timestamp: new Date(),
        components: {
          database: 'connected',
          interventionAssessmentCollection: 'accessible',
          interventionResponseCollection: 'accessible',
          interventionGenerator: 'available'
        },
        statistics: {
          totalInterventions: await InterventionAssessment.countDocuments({}),
          activeInterventions: await InterventionAssessment.countDocuments({ status: 'active' }),
          completedInterventions: await InterventionAssessment.countDocuments({ status: 'completed' }),
          totalResponses: await InterventionResponse.countDocuments({})
        }
      };

      res.json({
        success: true,
        data: health
      });

    } catch (error) {
      console.error('[INTERVENTION CONTROLLER] Error checking health:', error);
      res.status(500).json({
        success: false,
        message: 'Service health check failed',
        error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
      });
    }
  }
}

module.exports = new InterventionAssessmentController();