const express = require('express');
const router = express.Router();
const CategoryResultsFixService = require('../../services/Teachers/CategoryResultsFixService');

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
 * Route to get fix status
 */
router.get('/status', async (req, res) => {
  try {
    res.json({
      success: true,
      message: 'Category Results Fix Service is running',
      timestamp: new Date()
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

module.exports = router;