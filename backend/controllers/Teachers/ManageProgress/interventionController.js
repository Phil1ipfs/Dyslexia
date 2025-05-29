// controllers/Teachers/ManageProgress/interventionController.js
const InterventionService = require('../../../services/Teachers/InterventionService');
const User = require('../../../models/userModel');
const mongoose = require('mongoose');

class InterventionController {
  /**
   * Get all interventions for a student
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   */
  async getStudentInterventions(req, res) {
    try {
      const { studentId } = req.params;
      
      const interventions = await InterventionService.getStudentInterventions(studentId);
      
      return res.status(200).json({
        success: true,
        count: interventions.length,
        data: interventions
      });
    } catch (error) {
      console.error('Error fetching student interventions:', error);
      return res.status(500).json({
        success: false,
        message: 'Error fetching interventions',
        error: error.message
      });
    }
  }

  /**
   * Get an intervention by ID
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   */
  async getInterventionById(req, res) {
    try {
      const { interventionId } = req.params;
      
      const intervention = await InterventionService.getInterventionById(interventionId);
      
      return res.status(200).json({
        success: true,
        data: intervention
      });
    } catch (error) {
      console.error('Error fetching intervention by ID:', error);
      return res.status(500).json({
        success: false,
        message: 'Error fetching intervention',
        error: error.message
      });
    }
  }

  /**
   * Check if an intervention exists for a student and category
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   */
  async checkExistingIntervention(req, res) {
    try {
      const { studentId, category } = req.query;
      
      if (!studentId || !category) {
        return res.status(400).json({
          success: false,
          message: 'Student ID and category are required'
        });
      }
      
      const result = await InterventionService.checkExistingIntervention(studentId, category);
      
      return res.status(200).json({
        success: true,
        exists: result.exists,
        intervention: result.intervention
      });
    } catch (error) {
      console.error('Error checking existing intervention:', error);
      return res.status(500).json({
        success: false,
        message: 'Error checking existing intervention',
        error: error.message
      });
    }
  }

  /**
   * Create a new intervention
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   */
  async createIntervention(req, res) {
    try {
      const interventionData = req.body;
      
      // Log the incoming data for debugging
      console.log('Creating intervention with data:', JSON.stringify(interventionData, null, 2));
      
      // Validate required fields
      if (!interventionData.studentId) {
        return res.status(400).json({
          success: false,
          message: 'Student ID is required'
        });
      }
      
      if (!interventionData.category) {
        return res.status(400).json({
          success: false,
          message: 'Category is required'
        });
      }
      
      if (!interventionData.readingLevel) {
        return res.status(400).json({
          success: false,
          message: 'Reading level is required'
        });
      }
      
      // Check if questions array is present and valid
      if (!interventionData.questions) {
        return res.status(400).json({
          success: false,
          message: 'Questions array is required'
        });
      }
      
      if (!Array.isArray(interventionData.questions)) {
        return res.status(400).json({
          success: false,
          message: 'Questions must be an array'
        });
      }
      
      // Add user ID from auth middleware if available
      if (req.user) {
        interventionData.createdBy = req.user.id;
      }
      
      const intervention = await InterventionService.createIntervention(interventionData);
      
      return res.status(201).json({
        success: true,
        data: intervention
      });
    } catch (error) {
      console.error('Error creating intervention:', error);
      
      // Provide more detailed error information
      const errorResponse = {
        success: false,
        message: 'Error creating intervention',
        error: error.message,
        errorType: error.name || 'UnknownError'
      };
      
      // Add validation errors if available
      if (error.name === 'ValidationError' && error.errors) {
        errorResponse.validationErrors = Object.keys(error.errors).reduce((acc, key) => {
          acc[key] = error.errors[key].message;
          return acc;
        }, {});
        
        console.error('Validation errors:', errorResponse.validationErrors);
        
        return res.status(400).json(errorResponse);
      }
      
      // If it's a casting error, add more details
      if (error.name === 'CastError') {
        errorResponse.castError = {
          path: error.path,
          value: error.value,
          kind: error.kind
        };
        
        console.error('Cast error details:', errorResponse.castError);
        
        return res.status(400).json(errorResponse);
      }
      
      // If there's a specific error about ObjectId, provide clearer message
      if (error.message && error.message.includes('ObjectId')) {
        errorResponse.hint = 'There might be an issue with the studentId format. Ensure it\'s a valid MongoDB ObjectId.';
        console.error('ObjectId related error:', error.message);
        
        return res.status(400).json(errorResponse);
      }
      
      // For other types of errors, return 500
      return res.status(500).json(errorResponse);
    }
  }

  /**
   * Update an existing intervention
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   */
  async updateIntervention(req, res) {
    try {
      const { interventionId } = req.params;
      const updateData = req.body;
      
      const intervention = await InterventionService.updateIntervention(interventionId, updateData);
      
      return res.status(200).json({
        success: true,
        data: intervention
      });
    } catch (error) {
      console.error('Error updating intervention:', error);
      return res.status(500).json({
        success: false,
        message: 'Error updating intervention',
        error: error.message
      });
    }
  }

  /**
   * Delete an intervention
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   */
  async deleteIntervention(req, res) {
    try {
      const { interventionId } = req.params;
      
      const intervention = await InterventionService.deleteIntervention(interventionId);
      
      return res.status(200).json({
        success: true,
        message: 'Intervention deleted successfully',
        data: intervention
      });
    } catch (error) {
      console.error('Error deleting intervention:', error);
      return res.status(500).json({
        success: false,
        message: 'Error deleting intervention',
        error: error.message
      });
    }
  }

  /**
   * Push an intervention to mobile
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   */
  async pushToMobile(req, res) {
    try {
      const { interventionId } = req.params;
      
      const intervention = await InterventionService.pushToMobile(interventionId);
      
      return res.status(200).json({
        success: true,
        message: 'Intervention pushed to mobile successfully',
        data: intervention
      });
    } catch (error) {
      console.error('Error pushing intervention to mobile:', error);
      return res.status(500).json({
        success: false,
        message: 'Error pushing intervention to mobile',
        error: error.message
      });
    }
  }

  /**
   * Get main assessment questions
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   */
  async getMainAssessmentQuestions(req, res) {
    try {
      const { category, readingLevel } = req.query;
      
      if (!category || !readingLevel) {
        return res.status(400).json({
          success: false,
          message: 'Category and reading level are required'
        });
      }
      
      const questions = await InterventionService.getMainAssessmentQuestions(category, readingLevel);
      
      return res.status(200).json({
        success: true,
        count: questions.length,
        data: questions
      });
    } catch (error) {
      console.error('Error fetching main assessment questions:', error);
      return res.status(500).json({
        success: false,
        message: 'Error fetching main assessment questions',
        error: error.message
      });
    }
  }

  /**
   * Get template questions
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   */
  async getTemplateQuestions(req, res) {
    try {
      const { category } = req.query;
      
      if (!category) {
        return res.status(400).json({
          success: false,
          message: 'Category is required'
        });
      }
      
      const templates = await InterventionService.getTemplateQuestions(category);
      
      return res.status(200).json({
        success: true,
        count: templates.length,
        data: templates
      });
    } catch (error) {
      console.error('Error fetching template questions:', error);
      return res.status(500).json({
        success: false,
        message: 'Error fetching template questions',
        error: error.message
      });
    }
  }

  /**
   * Get template choices
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   */
  async getTemplateChoices(req, res) {
    try {
      const { choiceTypes } = req.query;
      
      const choiceTypesArray = choiceTypes ? choiceTypes.split(',') : [];
      
      const choices = await InterventionService.getTemplateChoices(choiceTypesArray);
      
      return res.status(200).json({
        success: true,
        count: choices.length,
        data: choices
      });
    } catch (error) {
      console.error('Error fetching template choices:', error);
      return res.status(500).json({
        success: false,
        message: 'Error fetching template choices',
        error: error.message
      });
    }
  }

  /**
   * Get sentence templates
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   */
  async getSentenceTemplates(req, res) {
    try {
      const { readingLevel } = req.query;
      
      if (!readingLevel) {
        return res.status(400).json({
          success: false,
          message: 'Reading level is required'
        });
      }
      
      const templates = await InterventionService.getSentenceTemplates(readingLevel);
      
      return res.status(200).json({
        success: true,
        count: templates.length,
        data: templates
      });
    } catch (error) {
      console.error('Error fetching sentence templates:', error);
      return res.status(500).json({
        success: false,
        message: 'Error fetching sentence templates',
        error: error.message
      });
    }
  }

  /**
   * Create a new template question
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   */
  async createTemplateQuestion(req, res) {
    try {
      const templateData = req.body;
      
      // Validate required fields
      if (!templateData.category || !templateData.questionType || !templateData.templateText) {
        return res.status(400).json({
          success: false,
          message: 'Category, question type, and template text are required'
        });
      }
      
      // Add user ID from auth middleware
      if (req.user) {
        templateData.createdBy = req.user.id;
      }
      
      const template = await InterventionService.createTemplateQuestion(templateData);
      
      return res.status(201).json({
        success: true,
        data: template
      });
    } catch (error) {
      console.error('Error creating template question:', error);
      return res.status(500).json({
        success: false,
        message: 'Error creating template question',
        error: error.message
      });
    }
  }

  /**
   * Create a new template choice
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   */
  async createTemplateChoice(req, res) {
    try {
      const choiceData = req.body;
      
      // Validate required fields
      if (!choiceData.choiceType) {
        return res.status(400).json({
          success: false,
          message: 'Choice type is required'
        });
      }
      
      // Validate choiceImage if present
      if (choiceData.choiceImage) {
        const isUrl = /^https?:\/\//.test(choiceData.choiceImage);
        if (!isUrl) {
          return res.status(400).json({ 
            success: false, 
            message: 'Invalid image URL format' 
          });
        }
      }
      
      // Add user ID from auth middleware
      if (req.user) {
        choiceData.createdBy = req.user.id;
      }
      
      const choice = await InterventionService.createTemplateChoice(choiceData);
      
      return res.status(201).json({
        success: true,
        data: choice
      });
    } catch (error) {
      console.error('Error creating template choice:', error);
      return res.status(500).json({
        success: false,
        message: 'Error creating template choice',
        error: error.message
      });
    }
  }

  /**
   * Get a pre-signed URL for S3 uploads
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   */
  async getUploadUrl(req, res) {
    try {
      const { fileName, fileType, targetFolder } = req.body;
      
      if (!fileName || !fileType) {
        return res.status(400).json({
          success: false,
          message: 'File name and file type are required'
        });
      }
      
      const urlData = await InterventionService.getPresignedUploadUrl(fileName, fileType, targetFolder || 'mobile');
      
      return res.status(200).json({
        success: true,
        data: urlData
      });
    } catch (error) {
      console.error('Error generating upload URL:', error);
      return res.status(500).json({
        success: false,
        message: 'Error generating upload URL',
        error: error.message
      });
    }
  }

  /**
   * Record a response to an intervention question
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   */
  async recordResponse(req, res) {
    try {
      const responseData = req.body;
      
      // Validate required fields
      if (!responseData.studentId || !responseData.interventionPlanId || 
          !responseData.questionId || !responseData.selectedChoice ||
          responseData.isCorrect === undefined) {
        return res.status(400).json({
          success: false,
          message: 'Missing required fields'
        });
      }
      
      // Convert IDs to ObjectId if they're strings
      if (typeof responseData.studentId === 'string' && mongoose.Types.ObjectId.isValid(responseData.studentId)) {
        responseData.studentId = new mongoose.Types.ObjectId(responseData.studentId);
      } else if (typeof responseData.studentId === 'string') {
        // Try to find user by idNumber
        const user = await User.findOne({ idNumber: responseData.studentId });
        if (!user) {
          return res.status(404).json({
            success: false,
            message: 'Student not found'
          });
        }
        responseData.studentId = user._id;
      }
      
      if (typeof responseData.interventionPlanId === 'string' && 
          mongoose.Types.ObjectId.isValid(responseData.interventionPlanId)) {
        responseData.interventionPlanId = new mongoose.Types.ObjectId(responseData.interventionPlanId);
      }
      
      const result = await InterventionService.recordResponse(responseData);
      
      return res.status(201).json({
        success: true,
        data: result
      });
    } catch (error) {
      console.error('Error recording response:', error);
      return res.status(500).json({
        success: false,
        message: 'Error recording response',
        error: error.message
      });
    }
  }

  /**
   * Update all existing interventions to add descriptions and link to prescriptive analyses
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   */
  async updateExistingInterventions(req, res) {
    try {
      const result = await InterventionService.updateExistingInterventions();
      
      return res.status(200).json({
        success: true,
        message: 'Existing interventions updated successfully',
        data: result
      });
    } catch (error) {
      console.error('Error updating existing interventions:', error);
      return res.status(500).json({
        success: false,
        message: 'Error updating existing interventions',
        error: error.message
      });
    }
  }

  /**
   * Activate an intervention by setting its status to 'active'
   * This marks it as ready for mobile delivery and prevents further editing
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   */
  async activateIntervention(req, res) {
    try {
      const { interventionId } = req.params;
      
      if (!interventionId) {
        return res.status(400).json({
          success: false,
          message: 'Intervention ID is required'
        });
      }
      
      // Log the activation attempt
      console.log(`Activating intervention: ${interventionId}`);
      
      // Update the intervention status to 'active'
      const updatedIntervention = await InterventionService.updateIntervention(
        interventionId, 
        { status: 'active' }
      );
      
      if (!updatedIntervention) {
        return res.status(404).json({
          success: false,
          message: 'Intervention not found'
        });
      }
      
      console.log(`Successfully activated intervention: ${interventionId}`);
      
      return res.status(200).json({
        success: true,
        message: 'Intervention activated successfully',
        data: updatedIntervention
      });
    } catch (error) {
      console.error('Error activating intervention:', error);
      return res.status(500).json({
        success: false,
        message: 'Error activating intervention',
        error: error.message
      });
    }
  }
}

// Export the class itself, not an instance
module.exports = InterventionController;