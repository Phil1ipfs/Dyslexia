const express = require('express');
const router = express.Router();
const CategoryResultsFixService = require('../../services/Teachers/CategoryResultsFixService');
const CategoryResultsService = require('../../services/Teachers/CategoryResultsService');

/**
 * Route to manually trigger category results fix
 */
router.post('/fix-all', async (req, res) => {
  try {
    console.log('[CATEGORY FIX API] Manual fix triggered');
    const result = await CategoryResultsFixService.fixAllCategoryResults();
    res.json(result);
  } catch (error) {
    console.error('[CATEGORY FIX API] Error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * Route to fix specific student's category results
 */
router.post('/fix-student/:studentId', async (req, res) => {
  try {
    const { studentId } = req.params;
    console.log(`[CATEGORY FIX API] Manual fix triggered for student ${studentId}`);
    const result = await CategoryResultsFixService.fixStudentCategoryResults(parseInt(studentId));
    res.json(result);
  } catch (error) {
    console.error('[CATEGORY FIX API] Error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * Route to fix dynamic category completion detection
 * ✅ NEW: Fixes categories scoring ≥75% that should not require intervention
 */
router.post('/fix-dynamic-completion', async (req, res) => {
  try {
    console.log('[DYNAMIC COMPLETION FIX API] Manual dynamic completion fix triggered');
    const result = await CategoryResultsService.fixDynamicCategoryCompletion();
    res.json(result);
  } catch (error) {
    console.error('[DYNAMIC COMPLETION FIX API] Error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * Route to fix dynamic category completion for specific student
 * ✅ NEW: Fixes categories scoring ≥75% for a specific student
 */
router.post('/fix-dynamic-completion/:studentId', async (req, res) => {
  try {
    const { studentId } = req.params;
    console.log(`[DYNAMIC COMPLETION FIX API] Manual dynamic completion fix triggered for student ${studentId}`);
    const result = await CategoryResultsService.fixDynamicCategoryCompletion(parseInt(studentId));
    res.json(result);
  } catch (error) {
    console.error('[DYNAMIC COMPLETION FIX API] Error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * Route to get fix status
 */
router.get('/status', async (req, res) => {
  try {
    res.json({
      success: true,
      message: 'Category Results Fix Service is running',
      timestamp: new Date(),
      features: [
        'Category intervention fix',
        'Dynamic completion detection fix'
      ]
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

module.exports = router;