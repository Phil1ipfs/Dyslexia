// Initialize prescriptive analyses for all students
router.post('/initialize-all', prescriptiveAnalysisController.initializeForAllStudents);

// Cleanup analyses for students with null reading level
router.post('/cleanup-null', prescriptiveAnalysisController.cleanupNullReadingLevelAnalyses); 