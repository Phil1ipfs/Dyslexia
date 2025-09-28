const express = require('express');
const router = express.Router();
const { auth, authorize } = require('../../middleware/auth');
const templatesController = require('../../controllers/Teachers/templatesController');

// ========== TEMPLATE QUESTIONS ROUTES ==========

// Get all template questions with filtering
router.get('/questions',
  auth,
  authorize('teacher', 'guro'),
  templatesController.getTemplateQuestions
);

// Get template question by ID
router.get('/questions/:id',
  auth,
  authorize('teacher', 'guro'),
  templatesController.getTemplateQuestionById
);

// Create new template question
router.post('/questions',
  auth,
  authorize('teacher', 'guro'),
  templatesController.createTemplateQuestion
);

// Update template question
router.put('/questions/:id',
  auth,
  authorize('teacher', 'guro'),
  templatesController.updateTemplateQuestion
);

// Delete template question
router.delete('/questions/:id',
  auth,
  authorize('teacher', 'guro'),
  templatesController.deleteTemplateQuestion
);


// ========== SENTENCE TEMPLATES ROUTES ==========

// Get all sentence templates with filtering
router.get('/sentences',
  auth,
  authorize('teacher', 'guro'),
  templatesController.getSentenceTemplates
);

// Get sentence template by ID
router.get('/sentences/:id',
  auth,
  authorize('teacher', 'guro'),
  templatesController.getSentenceTemplateById
);

// Get sentence templates by reading level
router.get('/sentences/level/:readingLevel',
  auth,
  authorize('teacher', 'guro'),
  templatesController.getSentenceTemplatesByLevel
);

// Create new sentence template
router.post('/sentences',
  auth,
  authorize('teacher', 'guro'),
  templatesController.createSentenceTemplate
);

// Update sentence template
router.put('/sentences/:id',
  auth,
  authorize('teacher', 'guro'),
  templatesController.updateSentenceTemplate
);

// Delete sentence template
router.delete('/sentences/:id',
  auth,
  authorize('teacher', 'guro'),
  templatesController.deleteSentenceTemplate
);

// ========== TEMPLATE AVAILABILITY AND MIGRATION ROUTES ==========

// Check template availability for intervention generation
router.get('/availability',
  auth,
  authorize('teacher', 'guro'),
  templatesController.checkTemplateAvailability
);

// Migrate old fragmented templates to complete template structure
router.post('/migrate',
  auth,
  authorize('teacher', 'guro'),
  templatesController.migrateOldTemplates
);

// ========== INTERVENTION GENERATION ROUTES ==========

// Generate intervention assessment using 3-source system (templates + main_assessment + custom)
router.post('/generate-intervention',
  auth,
  authorize('teacher', 'guro'),
  templatesController.generateInterventionAssessment
);

module.exports = router;