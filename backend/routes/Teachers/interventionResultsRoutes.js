const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const { auth, authorize } = require('../../middleware/auth');

// Get intervention results for a specific student and category
router.get('/student/:studentId/category/:categoryName', auth, authorize('teacher', 'admin'), async (req, res) => {
  try {
    const { studentId, categoryName } = req.params;
    
    console.log(`[INTERVENTION RESULTS API] Fetching intervention results for student ${studentId}, category ${categoryName}`);

    // Connect to the test database
    const db = mongoose.connection.useDb('test');
    
    // First, get the category results to check intervention history
    const categoryResultsCollection = db.collection('category_results');
    const categoryResult = await categoryResultsCollection.findOne({
      studentId: parseInt(studentId)
    });

    if (!categoryResult) {
      console.log(`[INTERVENTION RESULTS API] No category results found for student ${studentId}`);
      return res.status(404).json({
        success: false,
        message: 'No assessment results found for this student'
      });
    }

    // Find the specific category
    const category = categoryResult.categories?.find(cat => 
      cat.categoryName === categoryName || 
      cat.categoryName?.toLowerCase() === categoryName.toLowerCase()
    );

    if (!category) {
      console.log(`[INTERVENTION RESULTS API] Category ${categoryName} not found for student ${studentId}`);
      return res.status(404).json({
        success: false,
        message: `Category ${categoryName} not found for this student`
      });
    }

    // Check if category has intervention history
    if (!category.interventionHistory || category.interventionHistory.length === 0) {
      console.log(`[INTERVENTION RESULTS API] No intervention history found for category ${categoryName}`);
      return res.status(404).json({
        success: false,
        message: `No intervention results found for category ${categoryName}`
      });
    }

    // Get the latest intervention result
    const latestIntervention = category.interventionHistory[category.interventionHistory.length - 1];
    
    // Get intervention assessment details
    const interventionAssessmentsCollection = db.collection('intervention_assessments');
    const interventionAssessment = await interventionAssessmentsCollection.findOne({
      _id: new mongoose.Types.ObjectId(latestIntervention.interventionId)
    });

    // Get intervention results details
    const interventionResultsCollection = db.collection('intervention_results');
    const interventionResult = await interventionResultsCollection.findOne({
      studentId: parseInt(studentId),
      interventionAssessmentId: new mongoose.Types.ObjectId(latestIntervention.interventionId),
      revisionNumber: latestIntervention.attemptNumber
    });

    // Prepare the response data
    const responseData = {
      studentId: parseInt(studentId),
      category: categoryName,
      score: latestIntervention.score,
      isPassed: latestIntervention.isPassed,
      attemptNumber: latestIntervention.attemptNumber,
      assessmentDate: latestIntervention.attemptedAt,
      completedAt: latestIntervention.completedAt,
      interventionId: latestIntervention.interventionId,
      interventionResultId: latestIntervention.interventionResultId,
      
      // Original assessment data (preserved)
      originalAssessmentScore: category.score,
      originalAssessmentPassed: category.isPassed,
      
      // Intervention history
      interventionHistory: category.interventionHistory,
      totalAttempts: category.interventionHistory.length,
      
      // Assessment details
      interventionAssessment: interventionAssessment,
      interventionResult: interventionResult,
      
      // Metadata
      metadata: {
        fetchedAt: new Date().toISOString(),
        hasInterventionHistory: true,
        dataSource: 'category_results',
        apiVersion: '1.0'
      }
    };

    console.log(`[INTERVENTION RESULTS API] ✅ Successfully fetched intervention results for ${categoryName}:`, {
      score: responseData.score,
      isPassed: responseData.isPassed,
      attemptNumber: responseData.attemptNumber,
      totalAttempts: responseData.totalAttempts
    });

    res.json({
      success: true,
      data: responseData
    });

  } catch (error) {
    console.error('[INTERVENTION RESULTS API] Error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching intervention results',
      error: error.message
    });
  }
});

// Get all intervention results for a student
router.get('/student/:studentId', auth, authorize('teacher', 'admin'), async (req, res) => {
  try {
    const { studentId } = req.params;
    
    console.log(`[INTERVENTION RESULTS API] Fetching all intervention results for student ${studentId}`);

    // Connect to the test database
    const db = mongoose.connection.useDb('test');
    
    // Get the category results
    const categoryResultsCollection = db.collection('category_results');
    const categoryResult = await categoryResultsCollection.findOne({
      studentId: parseInt(studentId)
    });

    if (!categoryResult) {
      console.log(`[INTERVENTION RESULTS API] No category results found for student ${studentId}`);
      return res.status(404).json({
        success: false,
        message: 'No assessment results found for this student'
      });
    }

    // Process each category that has intervention history
    const allInterventionResults = {};
    
    for (const category of categoryResult.categories) {
      if (category.interventionHistory && category.interventionHistory.length > 0) {
        const latestIntervention = category.interventionHistory[category.interventionHistory.length - 1];
        
        allInterventionResults[category.categoryName] = {
          studentId: parseInt(studentId),
          category: category.categoryName,
          score: latestIntervention.score,
          isPassed: latestIntervention.isPassed,
          attemptNumber: latestIntervention.attemptNumber,
          assessmentDate: latestIntervention.attemptedAt,
          completedAt: latestIntervention.completedAt,
          interventionId: latestIntervention.interventionId,
          interventionResultId: latestIntervention.interventionResultId,
          
          // Original assessment data (preserved)
          originalAssessmentScore: category.score,
          originalAssessmentPassed: category.isPassed,
          
          // Intervention history
          interventionHistory: category.interventionHistory,
          totalAttempts: category.interventionHistory.length,
          
          // Metadata
          metadata: {
            fetchedAt: new Date().toISOString(),
            hasInterventionHistory: true,
            dataSource: 'category_results',
            apiVersion: '1.0'
          }
        };
      }
    }

    console.log(`[INTERVENTION RESULTS API] ✅ Successfully fetched intervention results for ${Object.keys(allInterventionResults).length} categories`);

    res.json({
      success: true,
      data: allInterventionResults
    });

  } catch (error) {
    console.error('[INTERVENTION RESULTS API] Error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching intervention results',
      error: error.message
    });
  }
});

// Get all revisions for a specific intervention
router.get('/student/:studentId/intervention/:interventionId/all-revisions', auth, authorize('teacher', 'admin'), async (req, res) => {
  try {
    const { studentId, interventionId } = req.params;
    const { category } = req.query;
    
    console.log(`[INTERVENTION RESULTS API] Fetching all revisions for student ${studentId}, intervention ${interventionId}, category ${category}`);

    // Connect to the test database
    const db = mongoose.connection.useDb('test');
    
    // Get intervention responses for all revisions
    const interventionResponsesCollection = db.collection('intervention_responses');
    const responses = await interventionResponsesCollection.find({
      studentId: parseInt(studentId),
      interventionAssessmentId: new mongoose.Types.ObjectId(interventionId),
      ...(category && { category: category })
    }).sort({ revisionNumber: 1, answeredAt: 1 }).toArray();

    if (responses.length === 0) {
      return res.status(404).json({ 
        success: false, 
        message: `No intervention responses found for student ${studentId}, intervention ${interventionId}` 
      });
    }

    // Group responses by revision number
    const responsesByRevision = {};
    responses.forEach(response => {
      const revision = response.revisionNumber || 1;
      if (!responsesByRevision[revision]) {
        responsesByRevision[revision] = [];
      }
      responsesByRevision[revision].push(response);
    });

    console.log(`[INTERVENTION RESULTS API] ✅ Successfully fetched all revisions for intervention ${interventionId}:`, Object.keys(responsesByRevision).length, 'revisions');
    
    res.json({ 
      success: true, 
      data: responsesByRevision,
      metadata: {
        totalRevisions: Object.keys(responsesByRevision).length,
        totalResponses: responses.length,
        fetchedAt: new Date().toISOString()
      }
    });

  } catch (error) {
    console.error('[INTERVENTION RESULTS API] Error fetching all revisions:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Error fetching all revisions', 
      error: error.message 
    });
  }
});

module.exports = router;
