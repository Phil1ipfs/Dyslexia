// services/Teachers/InterventionService.js
const mongoose = require('mongoose');
const InterventionPlan = require('../../../backend/models/Teachers/ManageProgress/interventionPlanModel');
const InterventionProgress = require('../../../backend/models/Teachers/ManageProgress/interventionProgressModel');
const InterventionResponse = require('../../../backend/models/Teachers/ManageProgress/interventionResponseModel');
const TemplateQuestion = require('../../../backend/models/Teachers/ManageProgress/templatesQuestionsModel');
const TemplateChoice = require('../../../backend/models/Teachers/ManageProgress/templatesChoicesModel');
const SentenceTemplate = require('../../../backend/models/Teachers/ManageProgress/sentenceTemplateModel');
const PrescriptiveAnalysis = require('../../../backend/models/Teachers/ManageProgress/prescriptiveAnalysisModel');
const User = require('../../../backend/models/userModel');
const s3Client = require('../../../backend/config/s3');

class InterventionService {
  /**
   * Get all interventions for a student
   * @param {string} studentId - The student ID
   * @returns {Promise<Array>} - The interventions
   */
  async getStudentInterventions(studentId) {
    try {
      // Convert string ID to ObjectId if needed
      let studentObjectId;
      if (mongoose.Types.ObjectId.isValid(studentId)) {
        studentObjectId = new mongoose.Types.ObjectId(studentId);
      } else {
        // Try to find user by idNumber
        const user = await User.findOne({ idNumber: studentId });
        if (!user) {
          throw new Error('Student not found');
        }
        studentObjectId = user._id;
      }
      
      const interventions = await InterventionPlan.find({ studentId: studentObjectId })
        .sort({ createdAt: -1 });
      
      // Fetch progress for each intervention
      const interventionsWithProgress = await Promise.all(
        interventions.map(async (intervention) => {
          const progress = await InterventionProgress.findOne({ 
            interventionPlanId: intervention._id,
            studentId: studentObjectId
          });
          
          return {
            ...intervention.toObject(),
            progress: progress ? progress.toObject() : null
          };
        })
      );
      
      return interventionsWithProgress;
    } catch (error) {
      console.error('Error fetching student interventions:', error);
      throw error;
    }
  }
  
  /**
   * Get an intervention by ID
   * @param {string} interventionId - The intervention ID
   * @returns {Promise<Object>} - The intervention
   */
  async getInterventionById(interventionId) {
    try {
      if (!mongoose.Types.ObjectId.isValid(interventionId)) {
        throw new Error('Invalid intervention ID format');
      }
      
      const intervention = await InterventionPlan.findById(interventionId);
      
      if (!intervention) {
        throw new Error('Intervention not found');
      }
      
      // Get progress for this intervention
      const progress = await InterventionProgress.findOne({ 
        interventionPlanId: intervention._id 
      });
      
      return {
        ...intervention.toObject(),
        progress: progress ? progress.toObject() : null
      };
    } catch (error) {
      console.error('Error fetching intervention by ID:', error);
      throw error;
    }
  }
  
  /**
   * Check if an intervention exists for a student and category
   * @param {string} studentId - The student ID
   * @param {string} category - The category
   * @returns {Promise<Object>} - The existing intervention or null
   */
  async checkExistingIntervention(studentId, category) {
    try {
      // Convert string ID to ObjectId if needed
      let studentObjectId;
      if (mongoose.Types.ObjectId.isValid(studentId)) {
        studentObjectId = new mongoose.Types.ObjectId(studentId);
      } else {
        // Try to find user by idNumber
        const user = await User.findOne({ idNumber: studentId });
        if (!user) {
          throw new Error('Student not found');
        }
        studentObjectId = user._id;
      }
      
      const existingIntervention = await InterventionPlan.findOne({
        studentId: studentObjectId,
        category: category
      });
      
      return {
        exists: !!existingIntervention,
        intervention: existingIntervention
      };
    } catch (error) {
      console.error('Error checking existing intervention:', error);
      throw error;
    }
  }
  
  /**
   * Create a new intervention
   * @param {Object} interventionData - The intervention data
   * @returns {Promise<Object>} - The created intervention
   */
  async createIntervention(interventionData) {
    try {
      // Convert string ID to ObjectId if needed
      if (typeof interventionData.studentId === 'string') {
        if (mongoose.Types.ObjectId.isValid(interventionData.studentId)) {
          interventionData.studentId = new mongoose.Types.ObjectId(interventionData.studentId);
        } else {
          // Try to find user by idNumber
          const user = await User.findOne({ idNumber: interventionData.studentId });
          if (!user) {
            throw new Error('Student not found');
          }
          interventionData.studentId = user._id;
        }
      }
      
      // Check if an intervention already exists for this student and category
      const existingCheck = await this.checkExistingIntervention(
        interventionData.studentId, 
        interventionData.category
      );
      
      if (existingCheck.exists) {
        throw new Error('An intervention for this student and category already exists');
      }
      
      // Create the intervention
      const intervention = new InterventionPlan(interventionData);
      await intervention.save();
      
      return intervention;
    } catch (error) {
      console.error('Error creating intervention:', error);
      throw error;
    }
  }
  
  /**
   * Update an existing intervention
   * @param {string} interventionId - The intervention ID
   * @param {Object} updateData - The data to update
   * @returns {Promise<Object>} - The updated intervention
   */
  async updateIntervention(interventionId, updateData) {
    try {
      if (!mongoose.Types.ObjectId.isValid(interventionId)) {
        throw new Error('Invalid intervention ID format');
      }
      
      // Find and update the intervention
      const intervention = await InterventionPlan.findByIdAndUpdate(
        interventionId,
        { $set: { ...updateData, updatedAt: new Date() } },
        { new: true, runValidators: true }
      );
      
      if (!intervention) {
        throw new Error('Intervention not found');
      }
      
      // If questions were updated, update the total activities in progress
      if (updateData.questions) {
        await InterventionProgress.findOneAndUpdate(
          { interventionPlanId: interventionId },
          { 
            $set: { 
              totalActivities: updateData.questions.length,
              updatedAt: new Date()
            } 
          }
        );
      }
      
      return intervention;
    } catch (error) {
      console.error('Error updating intervention:', error);
      throw error;
    }
  }
  
  /**
   * Delete an intervention
   * @param {string} interventionId - The intervention ID
   * @returns {Promise<Object>} - The deleted intervention
   */
  async deleteIntervention(interventionId) {
    try {
      if (!mongoose.Types.ObjectId.isValid(interventionId)) {
        throw new Error('Invalid intervention ID format');
      }
      
      // Delete the intervention
      const intervention = await InterventionPlan.findByIdAndDelete(interventionId);
      
      if (!intervention) {
        throw new Error('Intervention not found');
      }
      
      // Delete associated progress
      await InterventionProgress.deleteMany({ interventionPlanId: interventionId });
      
      // Delete associated responses
      await InterventionResponse.deleteMany({ interventionPlanId: interventionId });
      
      return intervention;
    } catch (error) {
      console.error('Error deleting intervention:', error);
      throw error;
    }
  }
  
  /**
   * Push an intervention to mobile
   * @param {string} interventionId - The intervention ID
   * @returns {Promise<Object>} - The updated intervention
   */
  async pushToMobile(interventionId) {
    try {
      if (!mongoose.Types.ObjectId.isValid(interventionId)) {
        throw new Error('Invalid intervention ID format');
      }
      
      // Update the intervention status to active
      const intervention = await InterventionPlan.findByIdAndUpdate(
        interventionId,
        { $set: { status: 'active', updatedAt: new Date() } },
        { new: true }
      );
      
      if (!intervention) {
        throw new Error('Intervention not found');
      }
      
      // Here you would implement any additional logic to notify mobile app
      // This could involve sending a notification or updating a flag in the user's document
      
      return intervention;
    } catch (error) {
      console.error('Error pushing intervention to mobile:', error);
      throw error;
    }
  }
  
  /**
   * Get main assessment questions for a category and reading level
   * @param {string} category - The category
   * @param {string} readingLevel - The reading level
   * @returns {Promise<Array>} - The questions
   */
  async getMainAssessmentQuestions(category, readingLevel) {
    try {
      const normCategory = this.normalizeCategoryName(category);
      const normReadingLevel = this.normalizeReadingLevel(readingLevel);
      
      // Query the main_assessment collection correctly
      const docs = await mongoose.connection.db
        .collection('main_assessment')
        .find({
          category: normCategory,
          readingLevel: normReadingLevel,
          isActive: true
        })
        .toArray();
      
      let questions = [];
      for (const doc of docs) {
        if (!Array.isArray(doc.questions)) continue;
        
        questions = questions.concat(
          doc.questions.map(q => ({
            ...q,
            _id: q._id || `${doc._id}-${q.order}`,
            category: doc.category,
            readingLevel: doc.readingLevel
          }))
        );
      }
      
      return questions;
    } catch (error) {
      console.error('Error fetching main assessment questions:', error);
      throw error;
    }
  }
  
  /**
   * Get template questions for a category
   * @param {string} category - The category
   * @returns {Promise<Array>} - The template questions
   */
  async getTemplateQuestions(category) {
    try {
      const normCategory = this.normalizeCategoryName(category);
      
      // Use the correct model - make sure TemplateQuestion is imported
      return await TemplateQuestion.find({ 
        category: normCategory,
        isActive: true 
      });
    } catch (error) {
      console.error('Error fetching template questions:', error);
      throw error;
    }
  }
  
  /**
   * Get template choices by choice types
   * @param {Array} choiceTypes - The choice types
   * @returns {Promise<Array>} - The template choices
   */
  async getTemplateChoices(choiceTypes = []) {
    try {
      const query = { isActive: true };
      
      if (choiceTypes && choiceTypes.length > 0) {
        query.choiceType = { $in: choiceTypes };
      }
      
      return await TemplateChoice.find(query);
    } catch (error) {
      console.error('Error fetching template choices:', error);
      throw error;
    }
  }
  
  /**
   * Get sentence templates for a reading level
   * @param {string} readingLevel - The reading level
   * @returns {Promise<Array>} - The sentence templates
   */
  async getSentenceTemplates(readingLevel) {
    try {
      const normReadingLevel = this.normalizeReadingLevel(readingLevel);
      
      // Use the correct model - make sure SentenceTemplate is imported
      return await SentenceTemplate.find({
        readingLevel: normReadingLevel,
        isActive: true
      });
    } catch (error) {
      console.error('Error fetching sentence templates:', error);
      throw error;
    }
  }
  
  /**
   * Create a new template question
   * @param {Object} templateData - The template data
   * @returns {Promise<Object>} - The created template
   */
  async createTemplateQuestion(templateData) {
    try {
      const newTemplate = new TemplateQuestion(templateData);
      await newTemplate.save();
      return newTemplate;
    } catch (error) {
      console.error('Error creating template question:', error);
      throw error;
    }
  }
  
  /**
   * Create a new template choice
   * @param {Object} choiceData - The choice data
   * @returns {Promise<Object>} - The created choice
   */
  async createTemplateChoice(choiceData) {
    try {
      const newChoice = new TemplateChoice(choiceData);
      await newChoice.save();
      return newChoice;
    } catch (error) {
      console.error('Error creating template choice:', error);
      throw error;
    }
  }
  
  /**
   * Generate a pre-signed URL for S3 uploads
   * @param {string} fileName - The file name
   * @param {string} fileType - The file type
   * @returns {Promise<Object>} - The pre-signed URL
   */
  async getPresignedUploadUrl(fileName, fileType) {
    try {
      if (!s3Client || !s3Client.getSignedUrlPromise) {
        throw new Error('S3 client not properly configured');
      }
      
      const s3Params = {
        Bucket: process.env.AWS_S3_BUCKET,
        Key: `uploads/${Date.now()}_${fileName}`,
        ContentType: fileType,
        Expires: 300 // URL expires in 5 minutes
      };
      
      // Generate the pre-signed URL
      const uploadUrl = await s3Client.getSignedUrlPromise('putObject', s3Params);
      
      return {
        uploadUrl,
        key: s3Params.Key,
        fileUrl: `https://${process.env.AWS_S3_BUCKET}.s3.amazonaws.com/${s3Params.Key}`
      };
    } catch (error) {
      console.error('Error generating pre-signed URL:', error);
      throw error;
    }
  }
  
  /**
   * Helper method to normalize category name
   * @param {string} categoryName - The category name
   * @returns {string} - The normalized category name
   */
  normalizeCategoryName(categoryName) {
    if (!categoryName) return '';
    
    // Handle both UI format ("Alphabet Knowledge") and DB format ("alphabet_knowledge")
    const normalized = categoryName.toLowerCase().replace(/\s+/g, '_');
    
    // Map common variations
    const categoryMap = {
      'alphabet_knowledge': 'Alphabet Knowledge',
      'phonological_awareness': 'Phonological Awareness', 
      'word_recognition': 'Word Recognition',
      'decoding': 'Decoding',
      'reading_comprehension': 'Reading Comprehension'
    };
    
    // Return the DB format that matches your JSON data
    return Object.keys(categoryMap).find(key => 
      categoryMap[key].toLowerCase().replace(/\s+/g, '_') === normalized
    ) || normalized;
  }
  
  /**
   * Helper method to normalize reading level
   * @param {string} readingLevel - The reading level
   * @returns {string} - The normalized reading level
   */
  normalizeReadingLevel(readingLevel) {
    if (!readingLevel) return 'Low Emerging';
    
    // Handle both UI format ("Low Emerging") and any DB format
    const levelMap = {
      'low_emerging': 'Low Emerging',
      'high_emerging': 'High Emerging', 
      'developing': 'Developing',
      'transitioning': 'Transitioning',
      'at_grade_level': 'At Grade Level'
    };
    
    // Find exact match first
    const exactMatch = Object.values(levelMap).find(level => 
      level.toLowerCase() === readingLevel.toLowerCase()
    );
    
    return exactMatch || readingLevel;
  }
  
  /**
   * Record a student's response to an intervention question
   * @param {Object} responseData - The response data
   * @returns {Promise<Object>} - The recorded response and updated progress
   */
  async recordResponse(responseData) {
    try {
      // Create the response record
      const response = new InterventionResponse(responseData);
      await response.save();
      
      // Update progress
      const progress = await InterventionProgress.findOne({
        studentId: responseData.studentId,
        interventionPlanId: responseData.interventionPlanId
      });
      
      if (!progress) {
        throw new Error('Progress record not found');
      }
      
      // Get intervention to determine total questions
      const intervention = await InterventionPlan.findById(responseData.interventionPlanId);
      
      if (!intervention) {
        throw new Error('Intervention not found');
      }
      
      // Update progress metrics
      progress.completedActivities += 1;
      progress.lastActivity = new Date();
      
      if (responseData.isCorrect) {
        progress.correctAnswers += 1;
      } else {
        progress.incorrectAnswers += 1;
      }
      
      // Calculate percentages
      progress.percentComplete = Math.round((progress.completedActivities / intervention.questions.length) * 100);
      progress.percentCorrect = Math.round(
        (progress.correctAnswers / (progress.correctAnswers + progress.incorrectAnswers)) * 100
      );
      
      // Check if passed threshold
      progress.passedThreshold = progress.percentCorrect >= intervention.passThreshold;
      
      await progress.save();
      
      // If intervention is complete, update its status
      if (progress.percentComplete === 100) {
        intervention.status = 'completed';
        await intervention.save();
      }
      
      return { response, progress };
    } catch (error) {
      console.error('Error recording response:', error);
      throw error;
    }
  }
}

module.exports = new InterventionService();