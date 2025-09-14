const TemplateQuestion = require('../../models/Teachers/ManageProgress/templatesQuestionsModel');
const TemplateChoice = require('../../models/Teachers/ManageProgress/templatesChoicesModel');
const SentenceTemplate = require('../../models/Teachers/ManageProgress/sentenceTemplateModel');
const InterventionService = require('../../services/Teachers/InterventionService');

/**
 * Templates Controller - Manages template questions, choices, and sentence templates
 * Used for intervention generation and question management
 */

// ========== TEMPLATE QUESTIONS MANAGEMENT ==========

/**
 * Get all template questions with filtering
 */
const getTemplateQuestions = async (req, res) => {
  try {
    const { category, questionType, isActive } = req.query;

    const query = {};
    if (category) query.category = category;
    if (questionType) query.questionType = questionType;
    if (isActive !== undefined) query.isActive = isActive === 'true';

    const templateQuestions = await InterventionService.getTemplateQuestions(category || '');

    res.json({
      success: true,
      message: 'Template questions retrieved successfully',
      data: templateQuestions,
      count: templateQuestions.length
    });
  } catch (error) {
    console.error('Error fetching template questions:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
};

/**
 * Get template question by ID
 */
const getTemplateQuestionById = async (req, res) => {
  try {
    const { id } = req.params;

    if (!id) {
      return res.status(400).json({
        success: false,
        message: 'Template question ID is required'
      });
    }

    const templateQuestion = await TemplateQuestion.findById(id);

    if (!templateQuestion) {
      return res.status(404).json({
        success: false,
        message: 'Template question not found'
      });
    }

    res.json({
      success: true,
      message: 'Template question retrieved successfully',
      data: templateQuestion
    });
  } catch (error) {
    console.error('Error fetching template question:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
};

/**
 * Create new template question
 */
const createTemplateQuestion = async (req, res) => {
  try {
    const templateData = req.body;

    // Validate required fields
    if (!templateData.category || !templateData.questionType || !templateData.templatetext) {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields: category, questionType, and templatetext are required'
      });
    }

    // Add creator information
    if (req.user && req.user._id) {
      templateData.createdBy = req.user._id;
    }

    const newTemplate = await InterventionService.createTemplateQuestion(templateData);

    res.status(201).json({
      success: true,
      message: 'Template question created successfully',
      data: newTemplate
    });
  } catch (error) {
    console.error('Error creating template question:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
};

/**
 * Update template question
 */
const updateTemplateQuestion = async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = req.body;

    if (!id) {
      return res.status(400).json({
        success: false,
        message: 'Template question ID is required'
      });
    }

    // Add update timestamp
    updateData.updatedAt = new Date();

    const updatedTemplate = await TemplateQuestion.findByIdAndUpdate(
      id,
      updateData,
      { new: true, runValidators: true }
    );

    if (!updatedTemplate) {
      return res.status(404).json({
        success: false,
        message: 'Template question not found'
      });
    }

    res.json({
      success: true,
      message: 'Template question updated successfully',
      data: updatedTemplate
    });
  } catch (error) {
    console.error('Error updating template question:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
};

/**
 * Delete template question
 */
const deleteTemplateQuestion = async (req, res) => {
  try {
    const { id } = req.params;

    if (!id) {
      return res.status(400).json({
        success: false,
        message: 'Template question ID is required'
      });
    }

    const deletedTemplate = await TemplateQuestion.findByIdAndDelete(id);

    if (!deletedTemplate) {
      return res.status(404).json({
        success: false,
        message: 'Template question not found'
      });
    }

    res.json({
      success: true,
      message: 'Template question deleted successfully',
      data: deletedTemplate
    });
  } catch (error) {
    console.error('Error deleting template question:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
};

// ========== TEMPLATE CHOICES MANAGEMENT ==========

/**
 * Get all template choices with filtering
 */
const getTemplateChoices = async (req, res) => {
  try {
    const { category, choiceType, isActive } = req.query;

    const query = {};
    if (category) query.category = category;
    if (choiceType) query.choiceType = choiceType;
    if (isActive !== undefined) query.isActive = isActive === 'true';

    const templateChoices = await TemplateChoice.find(query);

    res.json({
      success: true,
      message: 'Template choices retrieved successfully',
      data: templateChoices,
      count: templateChoices.length
    });
  } catch (error) {
    console.error('Error fetching template choices:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
};

/**
 * Get template choices by choice types
 */
const getTemplateChoicesByTypes = async (req, res) => {
  try {
    const { choiceTypes } = req.body; // Array of choice types

    if (!choiceTypes || !Array.isArray(choiceTypes)) {
      return res.status(400).json({
        success: false,
        message: 'choiceTypes array is required'
      });
    }

    const templateChoices = await InterventionService.getTemplateChoices(choiceTypes);

    res.json({
      success: true,
      message: 'Template choices retrieved successfully',
      data: templateChoices,
      count: templateChoices.length,
      choiceTypes: choiceTypes
    });
  } catch (error) {
    console.error('Error fetching template choices by types:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
};

/**
 * Create new template choice
 */
const createTemplateChoice = async (req, res) => {
  try {
    const choiceData = req.body;

    // Validate required fields
    if (!choiceData.category || !choiceData.choiceType || !choiceData.choiceValue) {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields: category, choiceType, and choiceValue are required'
      });
    }

    const newChoice = await InterventionService.createTemplateChoice(choiceData);

    res.status(201).json({
      success: true,
      message: 'Template choice created successfully',
      data: newChoice
    });
  } catch (error) {
    console.error('Error creating template choice:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
};

/**
 * Update template choice
 */
const updateTemplateChoice = async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = req.body;

    if (!id) {
      return res.status(400).json({
        success: false,
        message: 'Template choice ID is required'
      });
    }

    // Add update timestamp
    updateData.updatedAt = new Date();

    const updatedChoice = await TemplateChoice.findByIdAndUpdate(
      id,
      updateData,
      { new: true, runValidators: true }
    );

    if (!updatedChoice) {
      return res.status(404).json({
        success: false,
        message: 'Template choice not found'
      });
    }

    res.json({
      success: true,
      message: 'Template choice updated successfully',
      data: updatedChoice
    });
  } catch (error) {
    console.error('Error updating template choice:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
};

/**
 * Delete template choice
 */
const deleteTemplateChoice = async (req, res) => {
  try {
    const { id } = req.params;

    if (!id) {
      return res.status(400).json({
        success: false,
        message: 'Template choice ID is required'
      });
    }

    const deletedChoice = await TemplateChoice.findByIdAndDelete(id);

    if (!deletedChoice) {
      return res.status(404).json({
        success: false,
        message: 'Template choice not found'
      });
    }

    res.json({
      success: true,
      message: 'Template choice deleted successfully',
      data: deletedChoice
    });
  } catch (error) {
    console.error('Error deleting template choice:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
};

// ========== SENTENCE TEMPLATES MANAGEMENT ==========

/**
 * Get all sentence templates with filtering
 */
const getSentenceTemplates = async (req, res) => {
  try {
    const { readingLevel, category, isActive } = req.query;

    const query = {};
    if (readingLevel) query.readingLevel = readingLevel;
    if (category) query.category = category;
    if (isActive !== undefined) query.isActive = isActive === 'true';

    const sentenceTemplates = await SentenceTemplate.find(query);

    res.json({
      success: true,
      message: 'Sentence templates retrieved successfully',
      data: sentenceTemplates,
      count: sentenceTemplates.length
    });
  } catch (error) {
    console.error('Error fetching sentence templates:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
};

/**
 * Get sentence template by ID
 */
const getSentenceTemplateById = async (req, res) => {
  try {
    const { id } = req.params;

    if (!id) {
      return res.status(400).json({
        success: false,
        message: 'Sentence template ID is required'
      });
    }

    const sentenceTemplate = await SentenceTemplate.findById(id);

    if (!sentenceTemplate) {
      return res.status(404).json({
        success: false,
        message: 'Sentence template not found'
      });
    }

    res.json({
      success: true,
      message: 'Sentence template retrieved successfully',
      data: sentenceTemplate
    });
  } catch (error) {
    console.error('Error fetching sentence template:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
};

/**
 * Get sentence templates by reading level
 */
const getSentenceTemplatesByLevel = async (req, res) => {
  try {
    const { readingLevel } = req.params;

    if (!readingLevel) {
      return res.status(400).json({
        success: false,
        message: 'Reading level is required'
      });
    }

    const sentenceTemplates = await InterventionService.getSentenceTemplates(readingLevel);

    res.json({
      success: true,
      message: 'Sentence templates retrieved successfully',
      data: sentenceTemplates,
      count: sentenceTemplates.length,
      readingLevel: readingLevel
    });
  } catch (error) {
    console.error('Error fetching sentence templates by level:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
};

/**
 * Create new sentence template
 */
const createSentenceTemplate = async (req, res) => {
  try {
    const templateData = req.body;

    // Validate required fields
    if (!templateData.title || !templateData.readingLevel || !templateData.sentenceText || !templateData.sentenceQuestions) {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields: title, readingLevel, sentenceText, and sentenceQuestions are required'
      });
    }

    // Add creator information
    if (req.user && req.user._id) {
      templateData.createdBy = req.user._id;
    }

    // Set default category
    if (!templateData.category) {
      templateData.category = 'Reading Comprehension';
    }

    const newTemplate = new SentenceTemplate(templateData);
    await newTemplate.save();

    res.status(201).json({
      success: true,
      message: 'Sentence template created successfully',
      data: newTemplate
    });
  } catch (error) {
    console.error('Error creating sentence template:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
};

/**
 * Update sentence template
 */
const updateSentenceTemplate = async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = req.body;

    if (!id) {
      return res.status(400).json({
        success: false,
        message: 'Sentence template ID is required'
      });
    }

    // Add update timestamp
    updateData.updatedAt = new Date();

    const updatedTemplate = await SentenceTemplate.findByIdAndUpdate(
      id,
      updateData,
      { new: true, runValidators: true }
    );

    if (!updatedTemplate) {
      return res.status(404).json({
        success: false,
        message: 'Sentence template not found'
      });
    }

    res.json({
      success: true,
      message: 'Sentence template updated successfully',
      data: updatedTemplate
    });
  } catch (error) {
    console.error('Error updating sentence template:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
};

/**
 * Delete sentence template
 */
const deleteSentenceTemplate = async (req, res) => {
  try {
    const { id } = req.params;

    if (!id) {
      return res.status(400).json({
        success: false,
        message: 'Sentence template ID is required'
      });
    }

    const deletedTemplate = await SentenceTemplate.findByIdAndDelete(id);

    if (!deletedTemplate) {
      return res.status(404).json({
        success: false,
        message: 'Sentence template not found'
      });
    }

    res.json({
      success: true,
      message: 'Sentence template deleted successfully',
      data: deletedTemplate
    });
  } catch (error) {
    console.error('Error deleting sentence template:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
};

// ========== INTERVENTION GENERATION USING TEMPLATES ==========

/**
 * Generate intervention assessment using 3-source system
 */
const generateInterventionAssessment = async (req, res) => {
  try {
    const { prescriptiveAnalysisId, category } = req.body;

    if (!prescriptiveAnalysisId || !category) {
      return res.status(400).json({
        success: false,
        message: 'prescriptiveAnalysisId and category are required'
      });
    }

    console.log(`[TEMPLATES] Generating intervention for category: ${category}`);

    const interventionAssessment = await InterventionService.generateInterventionAssessment(
      prescriptiveAnalysisId,
      category,
      req.body.options || {}
    );

    res.status(201).json({
      success: true,
      message: 'Intervention assessment generated successfully using 3-source system',
      data: interventionAssessment,
      questionSources: interventionAssessment.questions.reduce((acc, q) => {
        acc[q.source] = (acc[q.source] || 0) + 1;
        return acc;
      }, {}),
      totalQuestions: interventionAssessment.questions.length
    });
  } catch (error) {
    console.error('Error generating intervention assessment:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
};

module.exports = {
  // Template Questions
  getTemplateQuestions,
  getTemplateQuestionById,
  createTemplateQuestion,
  updateTemplateQuestion,
  deleteTemplateQuestion,

  // Template Choices
  getTemplateChoices,
  getTemplateChoicesByTypes,
  createTemplateChoice,
  updateTemplateChoice,
  deleteTemplateChoice,

  // Sentence Templates
  getSentenceTemplates,
  getSentenceTemplateById,
  getSentenceTemplatesByLevel,
  createSentenceTemplate,
  updateSentenceTemplate,
  deleteSentenceTemplate,

  // Intervention Generation
  generateInterventionAssessment
};