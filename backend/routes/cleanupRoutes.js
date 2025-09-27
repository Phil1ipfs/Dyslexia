// routes/cleanupRoutes.js
const express = require('express');
const router = express.Router();
const DatabaseCleanupController = require('../controllers/DatabaseCleanupController');

// Log all requests to this router
router.use((req, res, next) => {
  console.log(`[cleanupRoutes] ${req.method} ${req.originalUrl}`);
  next();
});

// Database cleanup and monitoring routes

/**
 * POST /api/cleanup/run
 * Run comprehensive database cleanup for intervention image URLs
 * Validates all intervention image URLs and replaces broken ones with fallbacks
 */
router.post('/run', DatabaseCleanupController.runCleanup);

/**
 * GET /api/cleanup/health-check
 * Run quick health check on intervention image URLs
 * Samples random interventions to check overall system health
 */
router.get('/health-check', DatabaseCleanupController.healthCheck);

/**
 * POST /api/cleanup/orphaned-files
 * Clean up orphaned files from S3
 * Requires confirmation in request body: { "confirm": true }
 * WARNING: This permanently deletes files from S3
 */
router.post('/orphaned-files', DatabaseCleanupController.cleanupOrphanedFiles);

/**
 * POST /api/cleanup/validate-url
 * Validate a specific image URL and get fallback if needed
 * Body: { "url": "https://example.com/image.jpg", "category": "Phonological Awareness" }
 */
router.post('/validate-url', DatabaseCleanupController.validateImageUrl);

/**
 * GET /api/cleanup/cache-stats
 * Get image URL validator cache statistics
 * Shows cache hit rate and validation performance
 */
router.get('/cache-stats', DatabaseCleanupController.getCacheStats);

/**
 * POST /api/cleanup/clear-cache
 * Clear image URL validation cache
 * Forces fresh validation on next requests
 */
router.post('/clear-cache', DatabaseCleanupController.clearCache);

/**
 * GET /api/cleanup/system-status
 * Get comprehensive system status for S3 and image management
 * Includes database health, S3 connectivity, cache stats, and intervention image health
 */
router.get('/system-status', DatabaseCleanupController.getSystemStatus);

/**
 * POST /api/cleanup/prescriptive-duplicates
 * Remove duplicate prescriptive analysis records that block new analysis generation
 * Body: { "studentId": 202533333 } or { "confirm": "all" } to clean all duplicates
 */
router.post('/prescriptive-duplicates', DatabaseCleanupController.removePrescriptiveDuplicates);

/**
 * GET /api/cleanup/prescriptive-duplicates/:studentId
 * Check for duplicate prescriptive analysis records for a specific student
 */
router.get('/prescriptive-duplicates/:studentId', DatabaseCleanupController.checkPrescriptiveDuplicates);

module.exports = router;