const mongoose = require('mongoose');
const MainAssessment = require('../../../models/Teachers/ManageProgress/mainAssessmentModel');

class MainAssessmentController {
  /**
   * Upsert main assessment questions
   * Admin-only route for safely adding new questions
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   */
  async upsertMainAssessment(req, res) {
    try {
      const payload = req.body;
      
      if (!Array.isArray(payload)) {
        return res.status(400).json({
          success: false,
          message: 'Request body must be an array of assessment documents'
        });
      }
      
      const results = [];
      
      for (const doc of payload) {
        // Validate required fields
        if (!doc.category || !doc.readingLevel || !Array.isArray(doc.questions)) {
          results.push({
            success: false,
            message: 'Each document must have category, readingLevel, and questions array',
            document: doc
          });
          continue;
        }
        
        // Normalize fields like the service does
        const category = doc.category.toLowerCase().replace(/\s+/g, '_');
        const readingLevel = doc.readingLevel.toLowerCase().replace(/\s+/g, '_');
        
        // Ensure every question has _id and order
        const incoming = doc.questions.map((q, idx) => ({
          ...q,
          order: q.order || (idx + 1),
          _id: q._id ? new mongoose.Types.ObjectId(q._id) : new mongoose.Types.ObjectId()
        }));
        
        // Upsert and merge - keep existing questions, add new ones
        const result = await MainAssessment.updateOne(
          { category, readingLevel, isActive: true },
          {
            $setOnInsert: {
              category,
              readingLevel,
              isActive: true,
              createdAt: new Date()
            },
            $set: { updatedAt: new Date() },
            // Add new questions whose _id is not already present
            $addToSet: { questions: { $each: incoming } }
          },
          { upsert: true }
        );
        
        results.push({
          success: true,
          category,
          readingLevel,
          questionsAdded: incoming.length,
          mongoResult: result
        });
      }
      
      return res.status(200).json({
        success: true,
        message: 'Main assessment upsert completed',
        results
      });
    } catch (error) {
      console.error('Error upserting main assessment:', error);
      return res.status(500).json({
        success: false,
        message: 'Error upserting main assessment',
        error: error.message
      });
    }
  }
  
  /**
   * Get all main assessment documents
   * Admin-only route for managing assessment questions
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   */
  async getAllMainAssessments(req, res) {
    try {
      const { category, readingLevel, isActive } = req.query;
      
      // Build query based on provided filters
      const query = {};
      if (category) query.category = category.toLowerCase().replace(/\s+/g, '_');
      if (readingLevel) query.readingLevel = readingLevel.toLowerCase().replace(/\s+/g, '_');
      if (isActive !== undefined) query.isActive = isActive === 'true';
      
      const assessments = await MainAssessment.find(query).sort({ category: 1, readingLevel: 1 });
      
      return res.status(200).json({
        success: true,
        count: assessments.length,
        data: assessments
      });
    } catch (error) {
      console.error('Error fetching main assessments:', error);
      return res.status(500).json({
        success: false,
        message: 'Error fetching main assessments',
        error: error.message
      });
    }
  }
}

module.exports = new MainAssessmentController(); 