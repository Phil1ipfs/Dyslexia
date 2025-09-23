const TemplateQuestion = require('../../models/Teachers/ManageProgress/templatesQuestionsModel');
const SentenceTemplate = require('../../models/Teachers/ManageProgress/sentenceTemplateModel');
const InterventionGeneratorService = require('../../services/Teachers/InterventionGeneratorService');

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

    const templateQuestions = await TemplateQuestion.find(query).sort({ createdAt: -1 });

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

    // Validate required fields for complete template structure
    if (!templateData.category || !templateData.questionType || !templateData.questionText) {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields: category, questionType, and questionText are required'
      });
    }

    // Category-specific validation for complete templates
    if (templateData.category === 'Alphabet Knowledge' && (!templateData.choiceOptions || templateData.choiceOptions.length === 0)) {
      return res.status(400).json({
        success: false,
        message: 'Alphabet Knowledge templates must have choiceOptions'
      });
    }

    if (templateData.category === 'Phonological Awareness' && !templateData.questionSet) {
      return res.status(400).json({
        success: false,
        message: 'Phonological Awareness templates must have questionSet'
      });
    }

    if (templateData.category === 'Decoding' && (!templateData.dragElements || !templateData.correctSequence)) {
      return res.status(400).json({
        success: false,
        message: 'Decoding templates must have dragElements and correctSequence'
      });
    }

    if (templateData.category === 'Word Recognition' && (!templateData.blankOptions || !templateData.correctAnswer)) {
      return res.status(400).json({
        success: false,
        message: 'Word Recognition templates must have blankOptions and correctAnswer'
      });
    }

    // Add creator information
    if (req.user && req.user._id) {
      templateData.createdBy = req.user._id;
    }

    const newTemplate = new TemplateQuestion(templateData);
    await newTemplate.save();

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

    const sentenceTemplates = await SentenceTemplate.find({
      readingLevel: readingLevel,
      isActive: true
    }).sort({ createdAt: -1 });

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

// ========== TEMPLATE AVAILABILITY AND MIGRATION ==========

/**
 * Check template availability for intervention generation
 * Helps teachers understand what templates need to be created
 */
const checkTemplateAvailability = async (req, res) => {
  try {
    const { prescriptiveAnalysisId, category } = req.query;

    if (!prescriptiveAnalysisId || !category) {
      return res.status(400).json({
        success: false,
        message: 'prescriptiveAnalysisId and category are required'
      });
    }

    // Get prescriptive analysis to determine student's needs
    const PrescriptiveAnalysis = require('../../models/Teachers/ManageProgress/prescriptiveAnalysisModel');
    const analysis = await PrescriptiveAnalysis.findById(prescriptiveAnalysisId);

    if (!analysis) {
      return res.status(404).json({
        success: false,
        message: 'Prescriptive analysis not found'
      });
    }

    // Get category skill mastery and error patterns
    const categoryMastery = analysis.skillMastery.get ?
      analysis.skillMastery.get(category) :
      analysis.skillMastery[category];

    const errorPatterns = analysis.errorPatterns.get ?
      analysis.errorPatterns.get(category) :
      analysis.errorPatterns[category] || {};

    // Calculate optimal question count based on analytics
    const optimalQuestionCount = await InterventionGeneratorService.calculateOptimalQuestionCount(
      errorPatterns,
      categoryMastery,
      category,
      analysis.readingLevel,
      0 // Initial attempt
    );

    // Check current template availability
    let availableTemplates = 0;
    let templateStatus = 'none';
    let migrationNeeded = false;
    let oldTemplates = [];

    if (category === 'Reading Comprehension') {
      // Reading Comprehension uses sentence_templates
      const sentenceTemplates = await SentenceTemplate.find({
        readingLevel: analysis.readingLevel,
        isActive: true
      });
      availableTemplates = sentenceTemplates.length;
      templateStatus = availableTemplates >= optimalQuestionCount ? 'sufficient' : 'insufficient';
    } else {
      // Check for new complete templates
      const completeTemplates = await TemplateQuestion.find({
        category: category,
        isActive: true,
        // Check if it has the complete structure (not just templatetext)
        $or: [
          { choiceOptions: { $exists: true, $ne: [] } }, // Alphabet Knowledge
          { questionSet: { $exists: true } }, // Phonological Awareness
          { dragElements: { $exists: true } }, // Decoding
          { blankOptions: { $exists: true } } // Word Recognition
        ]
      });
      availableTemplates = completeTemplates.length;

      // Check for old fragmented templates that need migration
      oldTemplates = await TemplateQuestion.find({
        category: category,
        isActive: true,
        templatetext: { $exists: true }, // Old structure
        questionText: { $exists: false } // Missing new structure
      });

      migrationNeeded = oldTemplates.length > 0;
      templateStatus = availableTemplates >= optimalQuestionCount ? 'sufficient' : 'insufficient';
    }

    // Check main assessment availability as fallback
    const MainAssessment = require('../../models/Teachers/mainAssessmentModel');
    const mainAssessmentQuestions = await MainAssessment.find({
      category: category,
      isActive: true
    });
    const mainAssessmentCount = mainAssessmentQuestions.reduce((count, assessment) =>
      count + (assessment.questions ? assessment.questions.length : 0), 0
    );

    // Calculate gaps and recommendations
    const totalAvailable = availableTemplates + Math.min(mainAssessmentCount, optimalQuestionCount - availableTemplates);
    const shortageAmount = Math.max(0, optimalQuestionCount - totalAvailable);

    let recommendedAction = 'none';
    if (migrationNeeded && availableTemplates === 0) {
      recommendedAction = 'migrate_old_templates';
    } else if (shortageAmount > 0) {
      recommendedAction = 'create_new_templates';
    } else if (templateStatus === 'sufficient') {
      recommendedAction = 'ready_for_intervention';
    }

    res.json({
      success: true,
      message: 'Template availability checked successfully',
      data: {
        category,
        studentAnalysis: {
          readingLevel: analysis.readingLevel,
          masteryScore: categoryMastery?.score || 0,
          errorRate: InterventionGeneratorService.calculateErrorRate ?
            InterventionGeneratorService.calculateErrorRate(errorPatterns) : 0
        },
        questionRequirements: {
          optimalCount: optimalQuestionCount,
          rationale: `Based on ${analysis.readingLevel} level and error analysis`
        },
        templateAvailability: {
          completeTemplates: availableTemplates,
          mainAssessmentQuestions: mainAssessmentCount,
          totalAvailable,
          shortageAmount,
          status: templateStatus
        },
        migration: {
          needed: migrationNeeded,
          oldTemplates: oldTemplates.length,
          oldTemplateIds: oldTemplates.map(t => t._id)
        },
        recommendation: {
          action: recommendedAction,
          priority: shortageAmount > 5 ? 'high' : shortageAmount > 0 ? 'medium' : 'low',
          details: getTemplateRecommendationDetails(recommendedAction, category, shortageAmount, migrationNeeded)
        }
      }
    });
  } catch (error) {
    console.error('Error checking template availability:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
};

/**
 * Migrate old fragmented templates to complete template structure
 */
const migrateOldTemplates = async (req, res) => {
  try {
    const { templateIds } = req.body;

    if (!templateIds || !Array.isArray(templateIds)) {
      return res.status(400).json({
        success: false,
        message: 'templateIds array is required'
      });
    }

    const migrationResults = [];
    let successCount = 0;
    let errorCount = 0;

    for (const templateId of templateIds) {
      try {
        const oldTemplate = await TemplateQuestion.findById(templateId);
        if (!oldTemplate || !oldTemplate.templatetext) {
          migrationResults.push({
            templateId,
            status: 'skipped',
            reason: 'Not an old template or already migrated'
          });
          continue;
        }

        // Create new complete template structure based on category
        const migratedTemplate = await createCompleteTemplateFromOld(oldTemplate);

        if (migratedTemplate) {
          // Deactivate old template
          oldTemplate.isActive = false;
          oldTemplate.migrated = true;
          oldTemplate.migratedTo = migratedTemplate._id;
          await oldTemplate.save();

          migrationResults.push({
            templateId,
            status: 'success',
            oldTemplate: oldTemplate.templatetext,
            newTemplateId: migratedTemplate._id,
            category: oldTemplate.category
          });
          successCount++;
        } else {
          migrationResults.push({
            templateId,
            status: 'failed',
            reason: 'Could not create complete template structure'
          });
          errorCount++;
        }
      } catch (error) {
        migrationResults.push({
          templateId,
          status: 'error',
          reason: error.message
        });
        errorCount++;
      }
    }

    res.json({
      success: successCount > 0,
      message: `Migration completed: ${successCount} succeeded, ${errorCount} failed`,
      data: {
        summary: {
          total: templateIds.length,
          succeeded: successCount,
          failed: errorCount
        },
        results: migrationResults
      }
    });
  } catch (error) {
    console.error('Error migrating templates:', error);
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

    const interventionAssessment = await InterventionGeneratorService.generateIntervention(
      prescriptiveAnalysisId,
      category
    );

    res.status(201).json({
      success: true,
      message: 'Intervention assessment generated successfully using 3-source system',
      data: interventionAssessment,
      questionSources: interventionAssessment.questions.reduce((acc, q) => {
        acc[q.source] = (acc[q.source] || 0) + 1;
        return acc;
      }, {}),
      totalQuestions: interventionAssessment.questions.length,
      templateMetadata: interventionAssessment.templateMetadata
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

/**
 * Helper method to get template recommendation details
 */
const getTemplateRecommendationDetails = (action, category, shortageAmount, migrationNeeded) => {
  const details = {
    migrate_old_templates: {
      description: `Migrate existing fragmented templates to complete ${category} template structure`,
      steps: [
        'Review old template fragments',
        'Use migration endpoint to convert to complete templates',
        'Verify migrated templates work correctly',
        'Create additional templates if still needed'
      ]
    },
    create_new_templates: {
      description: `Create ${shortageAmount} new complete ${category} templates`,
      steps: [
        `Design ${shortageAmount} new ${category} questions with complete structure`,
        'Include all required fields for the category',
        'Test templates with sample intervention generation',
        'Activate templates for production use'
      ]
    },
    ready_for_intervention: {
      description: 'Sufficient templates available for intervention generation',
      steps: [
        'Generate intervention assessment',
        'Monitor template usage and effectiveness',
        'Create additional templates as needed for variety'
      ]
    },
    none: {
      description: 'No specific action required',
      steps: []
    }
  };

  return details[action] || details.none;
};

/**
 * Helper method to create complete template from old fragmented template
 */
const createCompleteTemplateFromOld = async (oldTemplate) => {
  try {
    const completeTemplateData = {
      category: oldTemplate.category,
      questionType: oldTemplate.questionType,
      questionText: oldTemplate.templatetext,
      questionImage: null,
      questionValue: null,
      isActive: true,
      createdBy: oldTemplate.createdBy,
      migratedFrom: oldTemplate._id
    };

    // Add category-specific complete structure
    switch (oldTemplate.category) {
      case 'Alphabet Knowledge':
        // Create basic choice options for alphabet templates
        completeTemplateData.choiceOptions = [
          { optionId: '1', optionText: 'a', isCorrect: true },
          { optionId: '2', optionText: 'b', isCorrect: false },
          { optionId: '3', optionText: 'c', isCorrect: false }
        ];
        break;

      case 'Phonological Awareness':
        // Create basic question set for phonological templates
        completeTemplateData.questionSet = {
          audioTexts: ['H', 'T', 'N'],
          matchingOptions: ['Hh', 'Tt', 'Nn', 'Ll'],
          correctPairs: [
            { 'H': 'Hh' },
            { 'T': 'Tt' },
            { 'N': 'Nn' }
          ]
        };
        completeTemplateData.matchCount = 3;
        break;

      case 'Decoding':
        // Create basic decoding structure
        if (oldTemplate.questionType === 'decode' && oldTemplate.templatetext.includes('Tukuyin')) {
          completeTemplateData.questionType = 'complete_word_identification';
          completeTemplateData.dragElements = ['C', 'A', 'T', 'O'];
          completeTemplateData.correctSequence = ['C', 'A', 'T'];
        } else {
          completeTemplateData.questionType = 'fill_missing_letter';
          completeTemplateData.displaySequence = ['_', 'a', 't'];
          completeTemplateData.dragElements = ['C', 'B', 'D', 'M'];
          completeTemplateData.correctSequence = ['C'];
          completeTemplateData.blankPosition = 0;
        }
        break;

      case 'Word Recognition':
        // Create basic word recognition structure
        if (oldTemplate.templatetext.includes('tunog')) {
          completeTemplateData.questionType = 'rhyming_words';
          completeTemplateData.displayWord = 'BOLA';
          completeTemplateData.blankOptions = ['MESA', 'SELA', 'KOLA'];
          completeTemplateData.correctAnswer = ['SELA'];
        } else {
          completeTemplateData.questionType = 'sentence_completion';
          completeTemplateData.displayWord = 'Kumain ako ng _____ sa almusal.';
          completeTemplateData.blankOptions = ['Tinapay', 'Sapatos', 'Libro', 'Mesa'];
          completeTemplateData.correctAnswer = ['Tinapay'];
        }
        break;

      default:
        return null; // Cannot migrate unknown category
    }

    const newTemplate = new TemplateQuestion(completeTemplateData);
    await newTemplate.save();
    return newTemplate;
  } catch (error) {
    console.error('Error creating complete template from old:', error);
    return null;
  }
};

module.exports = {
  // Template Questions
  getTemplateQuestions,
  getTemplateQuestionById,
  createTemplateQuestion,
  updateTemplateQuestion,
  deleteTemplateQuestion,


  // Sentence Templates
  getSentenceTemplates,
  getSentenceTemplateById,
  getSentenceTemplatesByLevel,
  createSentenceTemplate,
  updateSentenceTemplate,
  deleteSentenceTemplate,

  // Template Availability and Migration
  checkTemplateAvailability,
  migrateOldTemplates,
  getTemplateRecommendationDetails,
  createCompleteTemplateFromOld,

  // Intervention Generation
  generateInterventionAssessment
};