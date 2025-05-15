/**
 * assessmentResponseController.js
 * This controller handles student responses to assessments including
 * submission, scoring, and teacher feedback.
 */

const mongoose = require('mongoose');
const ObjectId = mongoose.Types.ObjectId;

// Get responses for a specific student
exports.getResponses = async (req, res) => {
  try {
    const studentId = req.params.id;
    const studentObjId = ObjectId(studentId);
    
    const testDb = mongoose.connection.useDb('test');
    const responsesCollection = testDb.collection('assessment_responses');
    
    const responses = await responsesCollection.find({
      userId: studentObjId
    }).toArray();
    
    res.json(responses);
  } catch (error) {
    console.error('Error fetching assessment responses:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Submit student response to an assessment
exports.submitResponse = async (req, res) => {
  try {
    const { assessmentId, answers } = req.body;
    const studentId = req.user.id; // Assuming this is used for student submissions
    
    if (!assessmentId || !answers) {
      return res.status(400).json({ message: 'Missing required fields' });
    }
    
    const testDb = mongoose.connection.useDb('test');
    const responsesCollection = testDb.collection('assessment_responses');
    const mainAssessmentCollection = testDb.collection('main_assessment');
    const assignmentsCollection = testDb.collection('assessment_assignments');
    const categoryProgressCollection = testDb.collection('category_progress');
    
    // Start a session for transaction
    const session = await mongoose.startSession();
    session.startTransaction();
    
    try {
      // Get the response document to update
      const response = await responsesCollection.findOne({
        assessmentId: assessmentId,
        userId: ObjectId(studentId)
      });
      
      if (!response) {
        await session.abortTransaction();
        session.endSession();
        return res.status(404).json({ message: 'Assessment response not found' });
      }
      
      // Get the assessment to check correct answers
      const assessment = await mainAssessmentCollection.findOne({
        assessmentId: assessmentId
      });
      
      if (!assessment) {
        await session.abortTransaction();
        session.endSession();
        return res.status(404).json({ message: 'Assessment not found' });
      }
      
      // Calculate score
      const correctAnswers = [];
      const incorrectAnswers = [];
      let rawScore = 0;
      
      // Process each question and answer
      for (const [questionId, answer] of Object.entries(answers)) {
        const question = assessment.questions.find(q => q.questionId.toString() === questionId);
        
        if (question) {
          const correctOption = question.options.find(o => o.isCorrect);
          const isCorrect = correctOption && correctOption.optionId === answer;
          
          if (isCorrect) {
            correctAnswers.push(questionId);
            rawScore += question.pointValue || 1;
          } else {
            incorrectAnswers.push(questionId);
          }
        }
      }
      
      const totalPoints = assessment.questions.reduce((sum, q) => sum + (q.pointValue || 1), 0);
      const percentageScore = totalPoints > 0 ? (rawScore / totalPoints) * 100 : 0;
      const passed = percentageScore >= (assessment.passingThreshold || 75);
      
      // Update the response document
      const now = new Date();
      const timeSpent = response.startTime ? (now - new Date(response.startTime)) / 1000 : 0;
      
      await responsesCollection.updateOne(
        { _id: response._id },
        {
          $set: {
            endTime: now,
            completed: true,
            answers: answers,
            rawScore: rawScore,
            percentageScore: percentageScore,
            passed: passed,
            attemptNumber: (response.attemptNumber || 0) + 1,
            correctAnswers: correctAnswers,
            incorrectAnswers: incorrectAnswers,
            timeSpent: timeSpent,
            completedAt: now
          }
        },
        { session }
      );
      
      // Update assignment status
      await assignmentsCollection.updateOne(
        { 
          assessmentId: assessmentId,
          "assignedStudent.userId": ObjectId(studentId)
        },
        {
          $set: {
            "assignedStudent.$.status": "completed",
            completionCount: 1,
            completionRate: 100
          }
        },
        { session }
      );
      
      // Update category progress
      const categoryProgress = await categoryProgressCollection.findOne({
        userId: ObjectId(studentId),
        "categories.mainAssessmentId": assessmentId
      });
      
      if (categoryProgress) {
        const updatedCategories = categoryProgress.categories.map(cat => {
          if (cat.mainAssessmentId === assessmentId) {
            return {
              ...cat,
              mainAssessmentCompleted: true,
              mainAssessmentScore: percentageScore,
              passed: passed,
              attemptCount: (cat.attemptCount || 0) + 1,
              lastAttemptDate: now,
              completionDate: now,
              status: passed ? 'completed' : 'in_progress'
            };
          }
          return cat;
        });
        
        const completedCategories = updatedCategories.filter(cat => cat.status === 'completed').length;
        const totalCategories = updatedCategories.length;
        const overallProgress = totalCategories > 0 ? (completedCategories / totalCategories) * 100 : 0;
        
        await categoryProgressCollection.updateOne(
          { _id: categoryProgress._id },
          {
            $set: {
              categories: updatedCategories,
              completedCategories: completedCategories,
              overallProgress: overallProgress,
              updatedAt: now
            }
          },
          { session }
        );
        
        // Check if all required categories are completed to advance reading level
        // This would be implemented here if needed
      }
      
      // Commit the transaction
      await session.commitTransaction();
      session.endSession();
      
      res.json({
        success: true,
        message: 'Assessment response submitted successfully',
        score: percentageScore,
        passed: passed
      });
    } catch (error) {
      await session.abortTransaction();
      session.endSession();
      throw error;
    }
  } catch (error) {
    console.error('Error submitting assessment response:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Start an assessment (to track start time)
exports.startAssessment = async (req, res) => {
  try {
    const { assessmentId } = req.body;
    const studentId = req.user.id;
    
    if (!assessmentId) {
      return res.status(400).json({ message: 'Assessment ID is required' });
    }
    
    const testDb = mongoose.connection.useDb('test');
    const responsesCollection = testDb.collection('assessment_responses');
    
    const result = await responsesCollection.findOneAndUpdate(
      {
        assessmentId: assessmentId,
        userId: ObjectId(studentId)
      },
      {
        $set: {
          startTime: new Date(),
          status: 'in_progress'
        }
      },
      { returnDocument: 'after' }
    );
    
    if (!result.value) {
      return res.status(404).json({ message: 'Assessment response not found' });
    }
    
    res.json({
      success: true,
      message: 'Assessment started',
      response: result.value
    });
  } catch (error) {
    console.error('Error starting assessment:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Provide teacher feedback on a student's assessment response
exports.provideFeedback = async (req, res) => {
  try {
    const responseId = req.params.id;
    const { teacherFeedback, nextSteps } = req.body;
    const teacherId = req.user.id;
    
    if (!teacherFeedback && !nextSteps) {
      return res.status(400).json({ message: 'Feedback or next steps required' });
    }
    
    const testDb = mongoose.connection.useDb('test');
    const responsesCollection = testDb.collection('assessment_responses');
    
    const updateFields = {
      reviewedAt: new Date(),
      teacherReviewedBy: ObjectId(teacherId)
    };
    
    if (teacherFeedback) updateFields.teacherFeedback = teacherFeedback;
    if (nextSteps) updateFields.nextSteps = nextSteps;
    
    const result = await responsesCollection.findOneAndUpdate(
      { _id: ObjectId(responseId) },
      { $set: updateFields },
      { returnDocument: 'after' }
    );
    
    if (!result.value) {
      return res.status(404).json({ message: 'Assessment response not found' });
    }
    
    res.json({
      success: true,
      message: 'Feedback provided successfully',
      response: result.value
    });
  } catch (error) {
    console.error('Error providing feedback:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};