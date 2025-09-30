const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');

// Get intervention responses for a specific student and intervention
router.get('/', async (req, res) => {
  try {
    const { studentId, interventionAssessmentId, revisionNumber, category } = req.query;
    
    console.log('[INTERVENTION RESPONSES] Fetching responses:', {
      studentId,
      interventionAssessmentId,
      revisionNumber,
      category
    });

    if (!studentId || !interventionAssessmentId) {
      return res.status(400).json({
        success: false,
        message: 'Student ID and Intervention Assessment ID are required'
      });
    }

    // Connect to the test database
    const db = mongoose.connection.useDb('test');
    const interventionResponsesCollection = db.collection('intervention_responses');

    // Build query
    const query = {
      studentId: parseInt(studentId),
      interventionAssessmentId: new mongoose.Types.ObjectId(interventionAssessmentId)
    };

    // Add revision number if provided
    if (revisionNumber) {
      query.revisionNumber = parseInt(revisionNumber);
    }

    // Add category if provided
    if (category) {
      query.category = category;
    }

    console.log('[INTERVENTION RESPONSES] Query:', query);

    // Fetch responses
    const responses = await interventionResponsesCollection.find(query).toArray();
    
    console.log('[INTERVENTION RESPONSES] Found responses:', responses.length);

    // Also fetch the intervention assessment details
    const interventionAssessmentCollection = db.collection('intervention_assessment');

    console.log('[INTERVENTION RESPONSES] Looking for intervention assessment with ID:', interventionAssessmentId);

    const interventionAssessment = await interventionAssessmentCollection.findOne({
      _id: new mongoose.Types.ObjectId(interventionAssessmentId)
    });

    console.log('[INTERVENTION RESPONSES] Found intervention assessment:', interventionAssessment ? 'YES' : 'NO');
    if (interventionAssessment) {
      console.log('[INTERVENTION RESPONSES] Assessment questions count:', interventionAssessment.questions?.length || 0);
    }

    // Fetch intervention results for this intervention
    const interventionResultsCollection = db.collection('intervention_results');
    const interventionResult = await interventionResultsCollection.findOne({
      studentId: parseInt(studentId),
      interventionAssessmentId: new mongoose.Types.ObjectId(interventionAssessmentId),
      revisionNumber: parseInt(revisionNumber) || 1
    });

    res.json({
      success: true,
      data: responses,
      interventionAssessment: interventionAssessment,
      interventionResult: interventionResult,
      totalResponses: responses.length,
      revisionNumber: revisionNumber || 1
    });

  } catch (error) {
    console.error('[INTERVENTION RESPONSES] Error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching intervention responses',
      error: error.message
    });
  }
});

// Get intervention responses by student ID
router.get('/student/:studentId', async (req, res) => {
  try {
    const { studentId } = req.params;
    const { category, revisionNumber } = req.query;

    console.log('[INTERVENTION RESPONSES] Fetching responses for student:', studentId);

    const db = mongoose.connection.useDb('test');
    const interventionResponsesCollection = db.collection('intervention_responses');

    const query = {
      studentId: parseInt(studentId)
    };

    if (category) {
      query.category = category;
    }

    if (revisionNumber) {
      query.revisionNumber = parseInt(revisionNumber);
    }

    const responses = await interventionResponsesCollection.find(query).toArray();

    res.json({
      success: true,
      data: responses,
      totalResponses: responses.length
    });

  } catch (error) {
    console.error('[INTERVENTION RESPONSES] Error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching intervention responses',
      error: error.message
    });
  }
});

// Get intervention responses by specific path
router.get('/student/:studentId/intervention/:interventionId/revision/:revisionNumber', async (req, res) => {
  try {
    const { studentId, interventionId, revisionNumber } = req.params;
    const { category } = req.query;

    console.log('[INTERVENTION RESPONSES] Fetching responses for specific intervention:', {
      studentId,
      interventionId,
      revisionNumber,
      category
    });

    const db = mongoose.connection.useDb('test');
    const interventionResponsesCollection = db.collection('intervention_responses');

    const query = {
      studentId: parseInt(studentId),
      interventionAssessmentId: new mongoose.Types.ObjectId(interventionId),
      revisionNumber: parseInt(revisionNumber)
    };

    if (category) {
      query.category = category;
    }

    const responses = await interventionResponsesCollection.find(query).toArray();

    // Also fetch intervention assessment and results
    const interventionAssessmentCollection = db.collection('intervention_assessment');
    const interventionResultsCollection = db.collection('intervention_results');

    const [interventionAssessment, interventionResult] = await Promise.all([
      interventionAssessmentCollection.findOne({
        _id: new mongoose.Types.ObjectId(interventionId)
      }),
      interventionResultsCollection.findOne({
        studentId: parseInt(studentId),
        interventionAssessmentId: new mongoose.Types.ObjectId(interventionId),
        revisionNumber: parseInt(revisionNumber)
      })
    ]);

    res.json({
      success: true,
      data: responses,
      interventionAssessment: interventionAssessment,
      interventionResult: interventionResult,
      totalResponses: responses.length,
      revisionNumber: parseInt(revisionNumber)
    });

  } catch (error) {
    console.error('[INTERVENTION RESPONSES] Error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching intervention responses',
      error: error.message
    });
  }
});

module.exports = router;
