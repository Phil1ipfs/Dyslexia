// routes/Teachers/studentRoutes.js
const express = require('express');
const router = express.Router();
const { auth, authorize } = require('../../middleware/auth');
const studentController = require('../../controllers/Teachers/studentController');

// Get all students
router.get('/students', auth, authorize('teacher', 'admin'), studentController.getStudents);

// Get student by ID
router.get('/student/:id', auth, authorize('teacher', 'admin'), studentController.getStudentById);

// Get assessment results
router.get('/assessment/:id', auth, authorize('teacher', 'admin'), studentController.getAssessmentResults);

// Get student progress
router.get('/progress/:id', auth, authorize('teacher', 'admin'), studentController.getProgressData);

// Get recommended lessons
router.get('/recommended-lessons/:id', auth, authorize('teacher', 'admin'), studentController.getRecommendedLessons);

// Get prescriptive recommendations
router.get('/prescriptive-recommendations/:id', auth, authorize('teacher', 'admin'), studentController.getPrescriptiveRecommendations);

// Update student address
router.patch('/student/:id/address', auth, authorize('teacher', 'admin'), studentController.updateStudentAddress);

// Link parent to student
router.post('/student/:id/link-parent', auth, authorize('teacher', 'admin'), studentController.linkParentToStudent);

// NEW ENDPOINTS FOR FILTERS
// Get available grade levels
router.get('/grade-levels', auth, authorize('teacher', 'admin'), studentController.getGradeLevels);

// Get available sections/classes
router.get('/sections', auth, authorize('teacher', 'admin'), studentController.getSections);

// Get reading levels
router.get('/reading-levels', auth, authorize('teacher', 'admin'), studentController.getReadingLevels);


router.get('/student/:id/parent-info', auth, authorize('teacher', 'admin'), studentController.getParentInfo);

// Get category results for a student (Manage Progress Post Assessment)
router.get('/student/:id/category-results', auth, authorize('teacher', 'admin'), studentController.getCategoryResults);


module.exports = router;