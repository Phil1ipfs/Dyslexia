// services/Teachers/InterventionService.js
const mongoose = require('mongoose');
const InterventionPlan = require('../../models/Teachers/ManageProgress/interventionPlanModel');
const InterventionResults = require('../../models/Teachers/ManageProgress/interventionResultsModel');
const TemplateQuestion = require('../../models/Teachers/ManageProgress/templatesQuestionsModel');
const TemplateChoice = require('../../models/Teachers/ManageProgress/templatesChoicesModel');
const SentenceTemplate = require('../../models/Teachers/ManageProgress/sentenceTemplateModel');
const PrescriptiveAnalysis = require('../../models/Teachers/ManageProgress/prescriptiveAnalysisModel');
const User = require('../../models/userModel');
const s3Client = require('../../config/s3');
const CategoryResultsService = require('./CategoryResultsService');

class InterventionService {
  /**
   * Get all interventions for a student
   * @param {string} studentId - The student ID
   * @returns {Promise<Array>} - The interventions
   */
  async getStudentInterventions(studentId) {
    try {
      console.log(`Fetching interventions for student: ${studentId}`);
      
      let query = {};
      
      // Handle different types of student IDs
      if (mongoose.Types.ObjectId.isValid(studentId)) {
        // If it's a valid ObjectId, use it directly
        query = { studentId: new mongoose.Types.ObjectId(studentId) };
      } else {
        // Try to find the user by idNumber
        const user = await User.findOne({ idNumber: studentId });
        
        if (user) {
          // If user found, use their ObjectId
          query = { studentId: user._id };
        } else {
          // If no user found, try using the original studentId
          query = { studentId };
        }
      }
      
      console.log('Query for interventions:', JSON.stringify(query));
      
      // Find all interventions for this student
      const interventions = await InterventionPlan.find(query)
        .sort({ createdAt: -1 })
        .lean();
      
      console.log(`Found ${interventions.length} interventions for student ${studentId}`);
      
      // Get progress for each intervention
      const interventionsWithProgress = await Promise.all(interventions.map(async (intervention) => {
        try {
          const progress = await InterventionResults.findOne({
            interventionPlanId: intervention._id
          }).lean();
          
          return {
            ...intervention,
            progress: progress || null
          };
        } catch (error) {
          console.error(`Error fetching progress for intervention ${intervention._id}:`, error);
          return {
            ...intervention,
            progress: null
          };
        }
      }));
      
      return interventionsWithProgress;
    } catch (error) {
      console.error(`Error fetching interventions for student ${studentId}:`, error);
      return [];
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
      const progress = await InterventionResults.findOne({ 
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
   * Enhanced with strict one-time intervention validation
   * @param {string} studentId - The student ID
   * @param {string} category - The category
   * @returns {Promise<Object>} - The existing intervention or null
   */
  async checkExistingIntervention(studentId, category) {
    try {
      // Convert string ID to ObjectId if needed
      let studentObjectId;
      let query = {};
      
      if (mongoose.Types.ObjectId.isValid(studentId)) {
        studentObjectId = new mongoose.Types.ObjectId(studentId);
        query = { studentId: studentObjectId };
      } else {
        // Try to find user by idNumber
        const user = await User.findOne({ idNumber: studentId });
        if (user) {
          studentObjectId = user._id;
          query = { studentId: studentObjectId };
        } else {
          // If no user found, use the original studentId
          query = { studentId };
        }
      }
      
      // Find intervention by studentId and category
      const existingIntervention = await InterventionPlan.findOne({
        ...query,
        category: category
      });

      // Also check prescriptive analysis for intervention history
      const prescriptiveAnalysis = await PrescriptiveAnalysis.findOne({
        studentId: studentId,
        assessmentType: 'main'
      }).sort({ createdAt: -1 });

      let interventionAttempted = false;
      let interventionHistory = [];
      
      if (prescriptiveAnalysis && prescriptiveAnalysis.interventionHistory) {
        interventionHistory = prescriptiveAnalysis.interventionHistory.filter(h => h.category === category);
        interventionAttempted = interventionHistory.length > 0;
      }
      
      return {
        exists: !!existingIntervention,
        intervention: existingIntervention,
        interventionAttempted,
        interventionHistory,
        canCreateNew: !interventionAttempted, // Strict one-time rule
        reason: interventionAttempted ? 'One-time intervention rule: Category already attempted' : 'Can create new intervention'
      };
    } catch (error) {
      console.error('Error checking existing intervention:', error);
      throw error;
    }
  }

  /**
   * Validate intervention eligibility with strict one-time enforcement
   * @param {string} studentId - The student ID
   * @param {string} category - The category
   * @returns {Promise<Object>} - Validation result
   */
  async validateInterventionEligibility(studentId, category) {
    try {
      console.log(`[INTERVENTION VALIDATION] Validating eligibility for student ${studentId}, category: ${category}`);

      // Check existing interventions
      const existingCheck = await this.checkExistingIntervention(studentId, category);
      
      if (!existingCheck.canCreateNew) {
        return {
          eligible: false,
          reason: existingCheck.reason,
          interventionHistory: existingCheck.interventionHistory,
          recommendedAction: 'face_to_face_required',
          details: 'Student has already attempted intervention for this category. One-time intervention rule enforced.'
        };
      }

      // Check if category needs intervention (score < 75%)
      const prescriptiveAnalysis = await PrescriptiveAnalysis.findOne({
        studentId: studentId,
        assessmentType: 'main'
      }).sort({ createdAt: -1 });

      if (!prescriptiveAnalysis) {
        return {
          eligible: false,
          reason: 'No prescriptive analysis found',
          recommendedAction: 'complete_main_assessment',
          details: 'Student needs to complete main assessment before intervention can be generated.'
        };
      }

      // Check if category failed (< 75%)
      const categoryMastery = prescriptiveAnalysis.skillMastery.get ? 
        prescriptiveAnalysis.skillMastery.get(category) : 
        prescriptiveAnalysis.skillMastery[category];

      if (!categoryMastery) {
        return {
          eligible: false,
          reason: 'Category not assessed',
          recommendedAction: 'complete_category_assessment',
          details: `Category "${category}" was not assessed in the main assessment.`
        };
      }

      const categoryScore = categoryMastery.score || 0;
      if (categoryScore >= 75) {
        return {
          eligible: false,
          reason: 'Category already passed',
          categoryScore,
          recommendedAction: 'no_intervention_needed',
          details: `Student scored ${categoryScore}% in "${category}" which meets the 75% pass threshold.`
        };
      }

      // All checks passed - eligible for intervention
      return {
        eligible: true,
        reason: 'Intervention needed and allowed',
        categoryScore,
        errorSeverity: this.calculateCategoryErrorSeverity(prescriptiveAnalysis.errorPatterns, category),
        masteryLevel: categoryMastery.masteryProbability || 0.5,
        recommendedAction: 'create_intervention',
        details: `Student scored ${categoryScore}% in "${category}" (below 75% threshold) and has not attempted intervention yet.`
      };

    } catch (error) {
      console.error('[INTERVENTION VALIDATION] Error validating eligibility:', error);
      return {
        eligible: false,
        reason: 'Validation error',
        error: error.message,
        recommendedAction: 'manual_review',
        details: 'Error occurred during validation. Manual review required.'
      };
    }
  }

  /**
   * Calculate error severity for a specific category
   * @param {Map|Object} errorPatterns - Error patterns from prescriptive analysis
   * @param {string} category - Category to analyze
   * @returns {Object} Error severity analysis
   */
  calculateCategoryErrorSeverity(errorPatterns, category) {
    const categoryErrors = errorPatterns.get ? errorPatterns.get(category) : errorPatterns[category];
    
    if (!categoryErrors) {
      return { level: 'unknown', score: 0, hasPatterns: false };
    }

    let totalErrors = 0;
    let totalQuestions = 0;
    
    Object.values(categoryErrors).forEach(errorData => {
      if (errorData.count && errorData.total) {
        totalErrors += errorData.count;
        totalQuestions += errorData.total;
      }
    });

    if (totalQuestions === 0) {
      return { level: 'unknown', score: 0, hasPatterns: false };
    }

    const errorRate = (totalErrors / totalQuestions) * 100;
    
    let level;
    if (errorRate >= 70) level = 'severe';
    else if (errorRate >= 50) level = 'high';
    else if (errorRate >= 30) level = 'moderate';
    else if (errorRate >= 15) level = 'low';
    else level = 'minimal';

    return {
      level,
      score: Math.round(errorRate),
      totalErrors,
      totalQuestions,
      hasPatterns: true
    };
  }
  
  /**
   * Create a new intervention with strict validation
   * @param {Object} interventionData - The intervention data
   * @returns {Promise<Object>} - The created intervention
   */
  async createIntervention(interventionData) {
    try {
      console.log('[INTERVENTION SERVICE] Creating intervention with data:', JSON.stringify(interventionData, null, 2));
      
      // Validate student ID
      if (!interventionData.studentId || !mongoose.Types.ObjectId.isValid(interventionData.studentId)) {
        throw new Error('Invalid student ID');
      }
      
      // Check if student exists
      const student = await User.findById(interventionData.studentId);
      if (!student) {
        throw new Error('Student not found');
      }

      // Strict validation for one-time intervention rule
      if (interventionData.category) {
        const eligibility = await this.validateInterventionEligibility(interventionData.studentId, interventionData.category);
        
        if (!eligibility.eligible) {
          throw new Error(`Intervention creation blocked: ${eligibility.reason}. ${eligibility.details}`);
        }
        
        console.log(`[INTERVENTION SERVICE] Intervention validated: ${eligibility.details}`);
      }
      
      // Add student number from the user record
      if (student.idNumber) {
        interventionData.studentNumber = student.idNumber;
        console.log(`Added student number ${student.idNumber} to intervention data`);
      }
      
      // Ensure prescriptiveAnalysisId is a valid ObjectId or null
      if (interventionData.prescriptiveAnalysisId) {
        if (!mongoose.Types.ObjectId.isValid(interventionData.prescriptiveAnalysisId)) {
          console.warn('Invalid prescriptiveAnalysisId format, setting to null:', interventionData.prescriptiveAnalysisId);
          interventionData.prescriptiveAnalysisId = null;
        }
      }
      
      // If categoryResultId is not provided, try to find the most recent category result
      if (!interventionData.categoryResultId) {
        try {
          console.log('Finding most recent category result for student:', interventionData.studentId);
          
          // Use the CategoryResultsService to find the most recent category result
          const categoryResult = await CategoryResultsService.getCategoryResultByCategory(
            interventionData.studentId,
            interventionData.category
          );
          
          if (categoryResult) {
            console.log(`Found category result ${categoryResult._id} for student ${interventionData.studentId} and category ${interventionData.category}`);
            interventionData.categoryResultId = categoryResult._id;
          } else {
            console.log(`No category result found for student ${interventionData.studentId} and category ${interventionData.category}`);
          }
        } catch (error) {
          console.error('Error finding category result:', error);
          // Continue with intervention creation even if category result lookup fails
        }
      }
      
      // Create intervention progress record first
      let interventionProgress = null;
      try {
        interventionProgress = new InterventionResults({
          studentId: interventionData.studentId,
          completedActivities: 0,
          totalActivities: interventionData.questions?.length || 0,
          correctAnswers: 0,
          incorrectAnswers: 0,
          percentComplete: 0,
          percentCorrect: 0,
          passedThreshold: false
        });
        console.log('Created InterventionResults object:', interventionProgress);
      } catch (progressError) {
        console.error('Error creating progress record object:', progressError);
        // Continue with intervention creation even if progress record creation fails
      }
      
      // Create the intervention
      console.log('Attempting to create intervention with model:', InterventionPlan.modelName);
      const intervention = new InterventionPlan(interventionData);
      
      // Save intervention first
      try {
        console.log('Saving intervention document...');
        await intervention.save();
        console.log('Intervention saved successfully with ID:', intervention._id);
      } catch (saveError) {
        console.error('Error saving intervention:', saveError);
        
        // Provide more detailed error information for debugging
        if (saveError.name === 'ValidationError') {
          Object.keys(saveError.errors).forEach(field => {
            console.error(`Validation error for field '${field}':`, saveError.errors[field].message);
          });
        } else if (saveError.name === 'CastError') {
          console.error('Cast error details:', {
            path: saveError.path,
            value: saveError.value,
            kind: saveError.kind
          });
        }
        
        throw saveError; // Re-throw the error after logging details
      }
      
      // Only save progress record if intervention was saved successfully and progress record was created
      if (interventionProgress) {
        try {
          // Update the progress record with the intervention ID
          interventionProgress.interventionPlanId = intervention._id;
          await interventionProgress.save();
          console.log('Progress record saved successfully with ID:', interventionProgress._id);
        } catch (progressSaveError) {
          console.error('Error saving progress record:', progressSaveError);
          // Don't fail the entire operation if only the progress record fails
          // Just log the error and continue
        }
      }
      
      return intervention;
    } catch (error) {
      console.error('Error creating intervention:', error);
      throw error;
    }
  }
  
  /**
   * Update an existing intervention
   * @param {string} interventionId - The intervention ID
   * @param {Object} updateData - The update data
   * @returns {Promise<Object>} - The updated intervention
   */
  async updateIntervention(interventionId, updateData) {
    try {
      if (!mongoose.Types.ObjectId.isValid(interventionId)) {
        throw new Error('Invalid intervention ID format');
      }
      
      console.log(`Updating intervention ${interventionId} with data:`, JSON.stringify(updateData, null, 2));
      
      // Find the existing intervention
      const existingIntervention = await InterventionPlan.findById(interventionId);
      
      if (!existingIntervention) {
        throw new Error('Intervention not found');
      }
      
      // Verify the student exists
      if (updateData.studentId) {
        const student = await User.findById(updateData.studentId);
        if (!student) {
          throw new Error('Student not found');
        }
        
        // Update studentNumber if student ID is changing
        if (student.idNumber) {
          updateData.studentNumber = student.idNumber;
          console.log(`Updated studentNumber to ${student.idNumber} based on new studentId`);
        }
      }
      
      // If questions are being updated, make sure descriptions are maintained
      if (updateData.questions && Array.isArray(updateData.questions)) {
        updateData.questions = updateData.questions.map(question => {
          if (question.choices && Array.isArray(question.choices)) {
            question.choices = question.choices.map(choice => {
              // Ensure description field exists and is properly set
              if (!choice.description || choice.description.trim() === '') {
                console.log(`Missing description for choice: ${choice.optionText} - adding default`);
                
                // Add default descriptions based on whether the choice is correct
                if (choice.isCorrect) {
                  choice.description = `Correct! "${choice.optionText}" is the right answer.`;
                  console.log(`Added default correct description for choice: ${choice.optionText}`);
                } else {
                  choice.description = `Incorrect. Try again and listen carefully to the sound.`;
                  
                  // Add more specific feedback based on question type
                  if (question.questionType === 'patinig') {
                    choice.description = `Incorrect. This is not the right vowel sound. Listen carefully and try again.`;
                  } else if (question.questionType === 'katinig') {
                    choice.description = `Incorrect. This is not the right consonant sound. Listen carefully and try again.`;
                  } else if (question.questionType === 'malapantig') {
                    choice.description = `Incorrect. This is not the right syllable. Listen to the whole word and try again.`;
                  } else if (question.questionType === 'word') {
                    choice.description = `Incorrect. This is not the right word. Look at the letters carefully and try again.`;
                  } else if (question.questionType === 'sentence') {
                    choice.description = `Incorrect. This is not the right answer. Read the passage again carefully.`;
                  }
                  console.log(`Added default incorrect description for choice: ${choice.optionText}`);
                }
              } else {
                console.log(`Using existing description for choice: ${choice.optionText}: "${choice.description}"`);
              }
              
              return choice;
            });
          }
          return question;
        });
        
        // Print the final questions with descriptions
        console.log('Final questions with descriptions:');
        updateData.questions.forEach((question, qIndex) => {
          console.log(`Question ${qIndex + 1}: ${question.questionText}`);
          if (question.choices) {
            question.choices.forEach((choice, cIndex) => {
              console.log(`  Choice ${cIndex + 1}: ${choice.optionText} - Description: ${choice.description || 'N/A'}`);
            });
          }
        });
      }
      
      // Set updatedAt field
      updateData.updatedAt = new Date();
      
      // Update the intervention
      const updatedIntervention = await InterventionPlan.findByIdAndUpdate(
        interventionId,
        { $set: updateData },
        { new: true }
      );
      
      return updatedIntervention;
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
      
      // Delete associated results
      await InterventionResults.deleteMany({ interventionPlanId: interventionId });
      
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
      
      console.log(`[DEBUG] Fetching template questions for category: ${normCategory}`);
      
      // Use direct collection access to match how main_assessment is queried
      const templates = await mongoose.connection.db
        .collection('templates_questions')
        .find({ 
          category: normCategory,
          isActive: true 
        })
        .toArray();
      
      console.log(`[DEBUG] Found ${templates.length} template questions`);
      console.log('[DEBUG] Template questions data sample:', templates.slice(0, 2));
      
      return templates;
    } catch (error) {
      console.error('[ERROR] Error fetching template questions:', error);
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
        console.log(`[DEBUG] Fetching template choices for types: ${choiceTypes.join(', ')}`);
      } else {
        console.log('[DEBUG] Fetching all active template choices');
      }
      
      const choices = await TemplateChoice.find(query);
      
      console.log(`[DEBUG] Found ${choices.length} template choices`);
      if (choices.length > 0) {
        console.log('[DEBUG] Template choices data sample:', 
          choices.slice(0, 2).map(c => ({ 
            id: c._id, 
            type: c.choiceType, 
            value: c.choiceValue, 
            soundText: c.soundText 
          }))
        );
      }
      
      return choices;
    } catch (error) {
      console.error('[ERROR] Error fetching template choices:', error);
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
      
      console.log(`[DEBUG] Fetching sentence templates for reading level: ${normReadingLevel}`);
      
      // Use the correct model - make sure SentenceTemplate is imported
      const templates = await SentenceTemplate.find({
        readingLevel: normReadingLevel,
        isActive: true
      });
      
      console.log(`[DEBUG] Found ${templates.length} sentence templates`);
      if (templates.length > 0) {
        console.log('[DEBUG] Sentence templates data sample:', 
          templates.slice(0, 1).map(t => ({ 
            id: t._id, 
            title: t.title,
            pages: t.sentenceText.length,
            questions: t.sentenceQuestions.length
          }))
        );
      }
      
      return templates;
    } catch (error) {
      console.error('[ERROR] Error fetching sentence templates:', error);
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
      console.log('[DEBUG] Creating template question with data:', templateData);
      
      // Ensure the category is properly normalized
      templateData.category = this.normalizeCategoryName(templateData.category);
      
      // Set default values for required fields if not provided
      if (!templateData.isActive) templateData.isActive = true;
      if (!templateData.createdAt) templateData.createdAt = new Date();
      if (!templateData.updatedAt) templateData.updatedAt = new Date();
      
      // Insert directly into the collection
      const result = await mongoose.connection.db
        .collection('templates_questions')
        .insertOne(templateData);
      
      if (!result.insertedId) {
        throw new Error('Failed to insert template question');
      }
      
      console.log(`[DEBUG] Successfully created template question with ID: ${result.insertedId}`);
      
      return { ...templateData, _id: result.insertedId };
    } catch (error) {
      console.error('[ERROR] Error creating template question:', error);
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
      console.log('[DEBUG] Creating template choice with data:', choiceData);
      
      // Clean up empty strings to be null
      if (choiceData.soundText === '') {
        choiceData.soundText = null;
      }
      if (choiceData.choiceValue === '') {
        choiceData.choiceValue = null;
      }
      
      // Make sure at least one of choiceValue or soundText is provided
      if (choiceData.choiceValue === null && choiceData.soundText === null) {
        throw new Error('Either choiceValue or soundText must be provided');
      }
      
      const newChoice = new TemplateChoice(choiceData);
      await newChoice.save();
      
      console.log(`[DEBUG] Successfully created template choice with ID: ${newChoice._id}`);
      console.log('[DEBUG] New choice data:', {
        id: newChoice._id,
        type: newChoice.choiceType,
        value: newChoice.choiceValue,
        soundText: newChoice.soundText
      });
      
      return newChoice;
    } catch (error) {
      console.error('[ERROR] Error creating template choice:', error);
      throw error;
    }
  }
  
  /**
   * Generate a pre-signed URL for S3 uploads
   * @param {string} fileName - The file name
   * @param {string} fileType - The file type
   * @param {string} targetFolder - The target folder in S3 bucket (default: 'mobile')
   * @returns {Promise<Object>} - The pre-signed URL
   */
  async getPresignedUploadUrl(fileName, fileType, targetFolder = 'mobile') {
    try {
      if (!s3Client) {
        throw new Error('S3 client not properly configured');
      }
      
      const bucketName = process.env.AWS_BUCKET_NAME || 'literexia-bucket';
      const region = process.env.AWS_REGION || 'ap-southeast-2';
      
      // Sanitize the file name to avoid S3 issues
      const sanitizedFileName = fileName.replace(/[^a-zA-Z0-9._-]/g, '_');
      
      // Create a unique key for the file with the target folder
      const key = `${targetFolder}/${Date.now()}_${sanitizedFileName}`;
      
      // Set S3 parameters for pre-signed URL
      // Note: We need to include ACL in the S3 params (not as a header)
      // This ensures the ACL is signed with the URL and the file becomes public after upload
      const s3Params = {
        Bucket: bucketName,
        Key: key,
        ContentType: fileType,
        Expires: 300, // URL expires in 5 minutes
        ACL: 'public-read' // Include ACL in pre-signed params, not as a separate header
      };
      
      console.log('Generating presigned URL with params:', {
        bucket: bucketName,
        key: key,
        contentType: fileType,
        targetFolder
      });
      
      // Generate the pre-signed URL
      const uploadUrl = await s3Client.getSignedUrlPromise('putObject', s3Params);
      
      console.log('Generated presigned URL successfully');
      
      // Create a direct URL to the file that will be accessible after upload
      const fileUrl = `https://${bucketName}.s3.${region}.amazonaws.com/${s3Params.Key}`;
      
      return {
        uploadUrl,
        key: s3Params.Key,
        fileUrl
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
    
    // If the input is already in the normalized format (with spaces),
    // return it as is since that's what's in the JSON data
    if (Object.values(categoryMap).includes(categoryName)) {
      return categoryName;
    }
    
    // Otherwise, try to map from the normalized format to the format in the JSON data
    return categoryMap[normalized] || categoryName;
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
      
      // Get intervention to determine total questions and get feedback
      const intervention = await InterventionPlan.findById(responseData.interventionPlanId);
      
      if (!intervention) {
        throw new Error('Intervention not found');
      }
      
      // Get student number from intervention or from user
      if (intervention.studentNumber) {
        response.studentNumber = intervention.studentNumber;
      } else {
        // Try to find the student to get their ID number
        const student = await User.findById(responseData.studentId);
        if (student && student.idNumber) {
          response.studentNumber = student.idNumber;
          
          // Also update the intervention with the student number
          await InterventionPlan.findByIdAndUpdate(
            intervention._id,
            { $set: { studentNumber: student.idNumber } }
          );
        }
      }
      
      // Find the question and choice to get the description
      if (intervention.questions && Array.isArray(intervention.questions)) {
        const question = intervention.questions.find(q => q.questionId === responseData.questionId);
        if (question && question.choices && Array.isArray(question.choices)) {
          const choice = question.choices.find(c => c.optionText === responseData.selectedChoice);
          if (choice && choice.description) {
            // Add the description to the response
            response.feedbackDescription = choice.description;
          }
        }
      }
      
      await response.save();
      
      // Update progress
      const progress = await InterventionResults.findOne({
        studentId: responseData.studentId,
        interventionPlanId: responseData.interventionPlanId
      });
      
      if (!progress) {
        throw new Error('Progress record not found');
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
  
  /**
   * Generate prescriptive analysis from intervention results
   * @param {string} interventionId - The intervention ID
   * @returns {Promise<Object>} - Generated analysis
   */
  async generateAnalysisFromIntervention(interventionId) {
    try {
      // Get intervention and its results
      const intervention = await InterventionPlan.findById(interventionId);
      if (!intervention) {
        throw new Error('Intervention not found');
      }

      const interventionResult = await InterventionResults.findOne({
        interventionPlanId: interventionId
      });

      if (!interventionResult) {
        throw new Error('Intervention results not found');
      }

      // Get student info
      const student = await User.findById(intervention.studentId);
      if (!student) {
        throw new Error('Student not found');
      }

      const readingLevel = student.readingLevel || 'Low Emerging';
      const categoryName = intervention.category;
      const isPassed = interventionResult.passedThreshold;
      const score = interventionResult.percentCorrect || 0;
      const attempt = await this.getInterventionAttemptNumber(intervention.studentId, categoryName);

      // Create or update prescriptive analysis for this intervention
      let analysis = await PrescriptiveAnalysis.findOne({
        studentId: intervention.studentId,
        categoryId: categoryName,
        assessmentType: 'intervention'
      });

      if (!analysis) {
        analysis = new PrescriptiveAnalysis({
          studentId: intervention.studentId,
          categoryId: categoryName,
          readingLevel: readingLevel,
          assessmentType: 'intervention',
          skillMastery: {},
          abilityEstimates: {},
          errorPatterns: {},
          interventionHistory: []
        });
      }

      // Add intervention attempt to history
      analysis.interventionHistory.push({
        category: categoryName,
        interventionId: intervention._id,
        dateTaken: new Date(),
        passed: isPassed,
        score: score,
        attempt: attempt
      });

      // Update skill mastery for this category
      if (!analysis.skillMastery) {
        analysis.skillMastery = new Map();
      }

      const masteryData = analysis.skillMastery.get(categoryName) || {
        masteryProbability: 0.5,
        totalQuestions: 0,
        correctAnswers: 0,
        score: 0,
        isPassed: false,
        responseHistory: []
      };

      // Update mastery based on intervention results
      masteryData.totalQuestions += intervention.questions?.length || 0;
      masteryData.correctAnswers += interventionResult.correctAnswers || 0;
      masteryData.score = score;
      masteryData.isPassed = isPassed;
      masteryData.lastUpdated = new Date();

      // Simple BKT update (could be more sophisticated)
      if (isPassed) {
        masteryData.masteryProbability = Math.min(0.95, masteryData.masteryProbability + 0.2);
      } else {
        masteryData.masteryProbability = Math.max(0.1, masteryData.masteryProbability - 0.1);
      }

      analysis.skillMastery.set(categoryName, masteryData);

      // Update ability estimates
      if (!analysis.abilityEstimates) {
        analysis.abilityEstimates = new Map();
      }
      
      const abilityEstimate = (score - 50) / 25; // Convert to -2 to +2 range
      analysis.abilityEstimates.set(categoryName, Math.max(-3, Math.min(3, abilityEstimate)));

      // Generate insights based on intervention outcome
      if (!analysis.insights) {
        analysis.insights = {
          strengths: [],
          weaknesses: [],
          passedCategories: 0,
          failedCategories: 0,
          overallScore: score
        };
      }

      if (isPassed) {
        analysis.insights.strengths = analysis.insights.strengths.filter(s => !s.includes(categoryName));
        analysis.insights.strengths.push(`${categoryName} - Intervention Success`);
        analysis.insights.recommendedAction = attempt > 1 ? 'continue_assessment' : 'success_ready';
        analysis.insights.overallReadiness = 'Improvement shown through intervention';
      } else {
        analysis.insights.weaknesses = analysis.insights.weaknesses.filter(w => !w.includes(categoryName));
        analysis.insights.weaknesses.push(`${categoryName} - ${score}% (Attempt ${attempt})`);
        
        // Escalate based on attempt number
        if (attempt >= 3) {
          analysis.insights.recommendedAction = 'face_to_face_required';
          analysis.insights.overallReadiness = 'Requires face-to-face support after multiple intervention attempts';
        } else {
          analysis.insights.recommendedAction = 'immediate_intervention';
          analysis.insights.overallReadiness = 'Needs additional intervention support';
        }
      }

      // Update intervention plan based on results
      if (!isPassed) {
        if (!analysis.interventionPlan) {
          analysis.interventionPlan = { required: true, priority: [], specificFocus: {} };
        }
        
        if (!analysis.interventionPlan.priority.includes(categoryName)) {
          analysis.interventionPlan.priority.push(categoryName);
        }

        // Generate more targeted recommendations for failed attempts
        const specificFocus = {
          focus: attempt > 1 ? "remediation_strategies" : "skill_reinforcement",
          recommendedActivities: this.getEscalatedActivities(categoryName, attempt),
          questionDistribution: this.getAdaptiveQuestionDistribution(categoryName, attempt)
        };
        
        analysis.interventionPlan.specificFocus.set(categoryName, specificFocus);
      } else {
        // Remove from intervention plan if passed
        if (analysis.interventionPlan && analysis.interventionPlan.priority) {
          analysis.interventionPlan.priority = analysis.interventionPlan.priority.filter(cat => cat !== categoryName);
          analysis.interventionPlan.required = analysis.interventionPlan.priority.length > 0;
        }
      }

      analysis.updatedAt = new Date();
      await analysis.save();

      return {
        success: true,
        data: analysis,
        interventionOutcome: {
          category: categoryName,
          passed: isPassed,
          score: score,
          attempt: attempt,
          escalationNeeded: !isPassed && attempt >= 3
        }
      };

    } catch (error) {
      console.error('Error generating analysis from intervention:', error);
      throw error;
    }
  }

  /**
   * Get the current attempt number for a category intervention
   * @param {string} studentId - Student ID
   * @param {string} category - Category name
   * @returns {Promise<number>} - Attempt number
   */
  async getInterventionAttemptNumber(studentId, category) {
    try {
      const existingAnalysis = await PrescriptiveAnalysis.findOne({
        studentId: studentId,
        categoryId: category,
        assessmentType: 'intervention'
      });

      if (!existingAnalysis || !existingAnalysis.interventionHistory) {
        return 1;
      }

      return existingAnalysis.interventionHistory.length + 1;
    } catch (error) {
      console.error('Error getting attempt number:', error);
      return 1;
    }
  }

  /**
   * Get escalated activities based on attempt number
   * @param {string} category - Category name
   * @param {number} attempt - Attempt number
   * @returns {Array} - Recommended activities
   */
  getEscalatedActivities(category, attempt) {
    const baseActivities = {
      'Phonological Awareness': ['sound_discrimination', 'minimal_pairs', 'rhyming_practice'],
      'Decoding': ['syllable_blending', 'word_building', 'pattern_recognition'],
      'Alphabet Knowledge': ['letter_tracing', 'sound_matching', 'visual_recognition'],
      'Word Recognition': ['sight_words', 'word_families', 'context_clues'],
      'Reading Comprehension': ['guided_reading', 'question_answering', 'story_mapping']
    };

    let activities = baseActivities[category] || ['targeted_practice'];

    if (attempt >= 2) {
      activities = activities.concat(['multi_sensory_approach', 'one_on_one_instruction']);
    }

    if (attempt >= 3) {
      activities = activities.concat(['intensive_remediation', 'alternative_strategies']);
    }

    return activities;
  }

  /**
   * Get adaptive question distribution based on attempt
   * @param {string} category - Category name  
   * @param {number} attempt - Attempt number
   * @returns {Object} - Question distribution
   */
  getAdaptiveQuestionDistribution(category, attempt) {
    const distributions = {
      1: { easy: 60, medium: 30, hard: 10 },
      2: { easy: 80, medium: 15, hard: 5 },
      3: { easy: 90, medium: 10, hard: 0 }
    };

    return distributions[Math.min(attempt, 3)];
  }

  /**
   * Update all existing interventions to add descriptions and link to prescriptive analyses
   * @returns {Promise<Object>} - Result of the update operation
   */
  async updateExistingInterventions() {
    try {
      // Get all interventions
      const interventions = await InterventionPlan.find({});
      console.log(`Found ${interventions.length} interventions to check and update`);
      
      let updatedCount = 0;
      let prescriptiveAnalysisLinkedCount = 0;
      let choiceDescriptionsAddedCount = 0;
      
      // Process each intervention
      for (const intervention of interventions) {
        let needsUpdate = false;
        let interventionData = intervention.toObject();
        
        // Check if prescriptiveAnalysisId is missing
        if (!intervention.prescriptiveAnalysisId) {
          const prescriptiveAnalysis = await PrescriptiveAnalysis.findOne({
            studentId: intervention.studentId,
            categoryId: intervention.category
          });
          
          if (prescriptiveAnalysis) {
            console.log(`Found matching prescriptive analysis for intervention ${intervention._id}: ${prescriptiveAnalysis._id}`);
            interventionData.prescriptiveAnalysisId = prescriptiveAnalysis._id;
            needsUpdate = true;
            prescriptiveAnalysisLinkedCount++;
          }
        }
        
        // Check if descriptions are missing in choices
        if (intervention.questions && Array.isArray(intervention.questions)) {
          let questionsUpdated = false;
          
          interventionData.questions = intervention.questions.map(question => {
            let questionObj = question.toObject ? question.toObject() : { ...question };
            
            if (questionObj.choices && Array.isArray(questionObj.choices)) {
              let choicesUpdated = false;
              
              questionObj.choices = questionObj.choices.map(choice => {
                let choiceObj = choice.toObject ? choice.toObject() : { ...choice };
                
                if (!choiceObj.description) {
                  // Add default descriptions based on whether the choice is correct
                  if (choiceObj.isCorrect) {
                    choiceObj.description = `Correct! "${choiceObj.optionText}" is the right answer.`;
                  } else {
                    choiceObj.description = `Incorrect. Try again and listen carefully to the sound.`;
                    
                    // Add more specific feedback based on question type
                    if (questionObj.questionType === 'patinig') {
                      choiceObj.description = `Incorrect. This is not the right vowel sound. Listen carefully and try again.`;
                    } else if (questionObj.questionType === 'katinig') {
                      choiceObj.description = `Incorrect. This is not the right consonant sound. Listen carefully and try again.`;
                    } else if (questionObj.questionType === 'malapantig') {
                      choiceObj.description = `Incorrect. This is not the right syllable. Listen to the whole word and try again.`;
                    } else if (questionObj.questionType === 'word') {
                      choiceObj.description = `Incorrect. This is not the right word. Look at the letters carefully and try again.`;
                    } else if (questionObj.questionType === 'sentence') {
                      choiceObj.description = `Incorrect. This is not the right answer. Read the passage again carefully.`;
                    }
                  }
                  
                  choicesUpdated = true;
                  choiceDescriptionsAddedCount++;
                }
                
                return choiceObj;
              });
              
              if (choicesUpdated) {
                questionsUpdated = true;
              }
            }
            
            return questionObj;
          });
          
          if (questionsUpdated) {
            needsUpdate = true;
          }
        }
        
        // Update the intervention if needed
        if (needsUpdate) {
          await InterventionPlan.findByIdAndUpdate(
            intervention._id,
            { $set: { ...interventionData, updatedAt: new Date() } },
            { runValidators: true }
          );
          
          updatedCount++;
        }
      }
      
      return {
        totalInterventions: interventions.length,
        updatedInterventions: updatedCount,
        prescriptiveAnalysisLinked: prescriptiveAnalysisLinkedCount,
        choiceDescriptionsAdded: choiceDescriptionsAddedCount
      };
    } catch (error) {
      console.error('Error updating existing interventions:', error);
      throw error;
    }
  }

  /**
   * Generate intervention assessment with template-only system and dynamic question counts
   * @param {string} prescriptiveAnalysisId - ID of prescriptive analysis
   * @param {string} category - Category requiring intervention
   * @param {Object} options - Generation options
   * @returns {Promise<Object>} Generated intervention assessment with template analysis
   */
  async generateInterventionAssessment(prescriptiveAnalysisId, category, options = {}) {
    try {
      console.log(`[INTERVENTION GENERATION] Generating template-based assessment for category: ${category}`);

      // Get prescriptive analysis
      const analysis = await PrescriptiveAnalysis.findById(prescriptiveAnalysisId);
      if (!analysis) {
        throw new Error('Prescriptive analysis not found');
      }

      const studentId = analysis.studentId;
      const readingLevel = analysis.readingLevel;

      // Get error patterns for this category to guide question selection
      const errorPatterns = analysis.errorPatterns?.get ?
        analysis.errorPatterns.get(category) :
        analysis.errorPatterns[category];

      // Use template-only system to get available questions and analyze teacher needs
      const templateResult = await this.getQuestionsFromTemplatesOnly(
        category,
        readingLevel,
        errorPatterns,
        {
          ...options,
          prescriptiveAnalysis: analysis // Pass full analysis for dynamic calculation
        }
      );

      // Create intervention assessment document with template-based data
      const interventionAssessment = {
        studentId: parseInt(studentId),
        prescriptiveAnalysisId: prescriptiveAnalysisId,
        category: category,
        readingLevel: readingLevel,
        passThreshold: 75,

        // Prescriptive Analytics "Prescription"
        prescription: templateResult.prescription,

        // Template Availability Analysis
        templateAvailability: templateResult.templateAvailability,
        teacherAction: templateResult.teacherAction,

        questionSelectionStrategy: {
          method: 'template_only', // No longer using multi-source
          targetDifficulty: 0.7,
          focusAreas: templateResult.prescription.focusAreas,
          errorSeverity: templateResult.prescription.errorSeverity
        },

        totalQuestions: templateResult.prescription.questionCount, // Target from analytics
        availableQuestions: templateResult.questions.length, // Actually available from templates
        questions: templateResult.questions, // Available template questions

        interventionParameters: {
          fixedQuestions: templateResult.questions.length, // Use available count
          allowSkip: false,
          showProgress: true,
          immediateFeeback: false
        },

        // Add calculation details for transparency
        questionCountCalculation: {
          targetCount: templateResult.prescription.questionCount,
          availableCount: templateResult.questions.length,
          rationale: templateResult.prescription.countRationale,
          calculatedAt: new Date()
        },

        status: templateResult.templateAvailability.hasShortage ? 'needs_teacher_input' : 'ready',
        createdAt: new Date(),
        updatedAt: new Date()
      };

      console.log(`[INTERVENTION GENERATION] Template-based assessment completed:`);
      console.log(`- Target questions: ${templateResult.prescription.questionCount}`);
      console.log(`- Available questions: ${templateResult.questions.length}`);
      console.log(`- Teacher action: ${templateResult.teacherAction}`);
      console.log(`- Status: ${interventionAssessment.status}`);

      return interventionAssessment;

    } catch (error) {
      console.error('[INTERVENTION GENERATION] Error generating intervention assessment:', error);
      throw error;
    }
  }

  /**
   * Calculate optimal question count based on prescriptive analytics
   * @param {Object} analysis - Prescriptive analysis data
   * @param {string} category - Target category
   * @returns {Object} Question count calculation with details
   */
  calculateOptimalQuestionCount(analysis, category) {
    try {
      console.log(`[DYNAMIC COUNT] Calculating optimal question count for ${category}`);

      // Get base values
      const skillMastery = analysis.skillMastery?.get ?
        analysis.skillMastery.get(category) :
        analysis.skillMastery[category];

      const errorPatterns = analysis.errorPatterns?.get ?
        analysis.errorPatterns.get(category) :
        analysis.errorPatterns[category];

      const readingLevel = analysis.readingLevel;

      // Base question count ranges by reading level
      const baseCountByLevel = {
        'Low Emerging': { min: 5, base: 8, max: 12 },
        'High Emerging': { min: 6, base: 10, max: 14 },
        'Developing': { min: 8, base: 12, max: 16 },
        'Transitioning': { min: 8, base: 12, max: 16 },
        'At Grade Level': { min: 10, base: 15, max: 18 }
      };

      const levelConfig = baseCountByLevel[readingLevel] || baseCountByLevel['Low Emerging'];
      let questionCount = levelConfig.base;
      let factors = { base: levelConfig.base };

      // Factor 1: Error severity analysis (±40% of base)
      const errorSeverity = this.calculateCategoryErrorSeverity(errorPatterns, category);
      let errorAdjustment = 0;

      if (errorSeverity.hasPatterns) {
        switch (errorSeverity.level) {
          case 'severe':
            errorAdjustment = Math.round(levelConfig.base * 0.4); // +40%
            break;
          case 'high':
            errorAdjustment = Math.round(levelConfig.base * 0.25); // +25%
            break;
          case 'moderate':
            errorAdjustment = Math.round(levelConfig.base * 0.1); // +10%
            break;
          case 'low':
            errorAdjustment = Math.round(levelConfig.base * -0.1); // -10%
            break;
          case 'minimal':
            errorAdjustment = Math.round(levelConfig.base * -0.2); // -20%
            break;
        }
      }

      questionCount += errorAdjustment;
      factors.errorSeverity = {
        level: errorSeverity.level,
        adjustment: errorAdjustment,
        percentage: errorSeverity.score
      };

      // Factor 2: Mastery level analysis (±25% of base)
      let masteryAdjustment = 0;
      if (skillMastery) {
        const masteryProbability = skillMastery.masteryProbability || 0.5;
        const score = skillMastery.score || 50;

        if (score < 40) {
          masteryAdjustment = Math.round(levelConfig.base * 0.25); // +25% for very low scores
        } else if (score < 55) {
          masteryAdjustment = Math.round(levelConfig.base * 0.15); // +15% for low scores
        } else if (score < 65) {
          masteryAdjustment = Math.round(levelConfig.base * 0.05); // +5% for below average
        } else if (score >= 75) {
          masteryAdjustment = Math.round(levelConfig.base * -0.15); // -15% for passing scores
        }
      }

      questionCount += masteryAdjustment;
      factors.masteryLevel = {
        score: skillMastery?.score || 0,
        probability: skillMastery?.masteryProbability || 0.5,
        adjustment: masteryAdjustment
      };

      // Factor 3: Category complexity multiplier
      const categoryComplexity = {
        'Alphabet Knowledge': 0.8,    // Simpler - fewer questions needed
        'Phonological Awareness': 1.1, // More complex - matching tasks
        'Decoding': 1.0,              // Standard complexity
        'Word Recognition': 1.0,       // Standard complexity
        'Reading Comprehension': 1.2   // Most complex - passages
      };

      const complexityMultiplier = categoryComplexity[category] || 1.0;
      const complexityAdjustment = Math.round((questionCount * complexityMultiplier) - questionCount);
      questionCount = Math.round(questionCount * complexityMultiplier);

      factors.categoryComplexity = {
        multiplier: complexityMultiplier,
        adjustment: complexityAdjustment
      };

      // Factor 4: Intervention history (previous attempts)
      let historyAdjustment = 0;
      if (analysis.interventionHistory && Array.isArray(analysis.interventionHistory)) {
        const categoryHistory = analysis.interventionHistory.filter(h => h.category === category);
        const attemptCount = categoryHistory.length + 1; // Current attempt

        if (attemptCount > 1) {
          // Reduce questions for repeat attempts to avoid fatigue
          historyAdjustment = -Math.min(3, attemptCount - 1);
        }
      }

      questionCount += historyAdjustment;
      factors.interventionHistory = {
        attemptCount: analysis.interventionHistory ?
          analysis.interventionHistory.filter(h => h.category === category).length + 1 : 1,
        adjustment: historyAdjustment
      };

      // Apply bounds
      questionCount = Math.max(levelConfig.min, Math.min(levelConfig.max, questionCount));

      // Ensure minimum of 5 questions, maximum of 18
      questionCount = Math.max(5, Math.min(18, questionCount));

      const result = {
        questionCount: questionCount,
        reasoning: {
          category: category,
          readingLevel: readingLevel,
          baseRange: levelConfig,
          finalCount: questionCount,
          factors: factors,
          rationale: this.generateCountRationale(factors, questionCount, levelConfig.base)
        }
      };

      console.log(`[DYNAMIC COUNT] Calculated ${questionCount} questions for ${category}:`, result.reasoning.rationale);
      return result;

    } catch (error) {
      console.error('[DYNAMIC COUNT] Error calculating question count:', error);
      // Fallback to safe defaults
      const fallbackCount = {
        'Low Emerging': 8,
        'High Emerging': 10,
        'Developing': 12,
        'Transitioning': 12,
        'At Grade Level': 15
      };

      return {
        questionCount: fallbackCount[analysis.readingLevel] || 10,
        reasoning: {
          category: category,
          readingLevel: analysis.readingLevel,
          finalCount: fallbackCount[analysis.readingLevel] || 10,
          factors: { error: error.message },
          rationale: 'Used fallback count due to calculation error'
        }
      };
    }
  }

  /**
   * Generate rationale text for question count decision
   */
  generateCountRationale(factors, finalCount, baseCount) {
    const parts = [`Started with base count of ${baseCount} for reading level`];

    if (factors.errorSeverity && factors.errorSeverity.adjustment !== 0) {
      const direction = factors.errorSeverity.adjustment > 0 ? 'increased' : 'decreased';
      parts.push(`${direction} by ${Math.abs(factors.errorSeverity.adjustment)} due to ${factors.errorSeverity.level} error severity (${factors.errorSeverity.percentage}% error rate)`);
    }

    if (factors.masteryLevel && factors.masteryLevel.adjustment !== 0) {
      const direction = factors.masteryLevel.adjustment > 0 ? 'increased' : 'decreased';
      parts.push(`${direction} by ${Math.abs(factors.masteryLevel.adjustment)} based on mastery score of ${factors.masteryLevel.score}%`);
    }

    if (factors.categoryComplexity && factors.categoryComplexity.adjustment !== 0) {
      const direction = factors.categoryComplexity.adjustment > 0 ? 'increased' : 'decreased';
      parts.push(`${direction} by ${Math.abs(factors.categoryComplexity.adjustment)} for category complexity (${factors.categoryComplexity.multiplier}x)`);
    }

    if (factors.interventionHistory && factors.interventionHistory.adjustment !== 0) {
      parts.push(`reduced by ${Math.abs(factors.interventionHistory.adjustment)} for repeat attempt (attempt #${factors.interventionHistory.attemptCount})`);
    }

    return `${parts.join(', ')} = ${finalCount} total questions`;
  }

  /**
   * Get available questions from templates only - No programmatic generation
   * Teachers must provide all intervention questions through templates
   * System acts as "doctor providing prescription" while teachers provide "treatment"
   */
  async getQuestionsFromTemplatesOnly(category, readingLevel, errorPatterns, options = {}) {
    try {
      // Calculate optimal question count using prescriptive analytics (the "prescription")
      let targetQuestionCount = 10; // Default fallback
      let countCalculation = null;

      if (options.prescriptiveAnalysis) {
        countCalculation = this.calculateOptimalQuestionCount(options.prescriptiveAnalysis, category);
        targetQuestionCount = countCalculation.questionCount;
      } else {
        console.warn('[TEMPLATE-ONLY] No prescriptive analysis provided, using default count of 10');
      }

      console.log(`[TEMPLATE-ONLY] Starting template retrieval for ${category} at ${readingLevel} level with ${targetQuestionCount} questions needed`);

      // Get all available templates for this category
      let availableTemplates = [];
      let templateQuestions = [];

      try {
        if (category === 'Reading Comprehension') {
          // Use sentence templates for Reading Comprehension
          availableTemplates = await this.getSentenceTemplates(readingLevel);
          templateQuestions = await this.generateQuestionsFromSentenceTemplates(
            availableTemplates,
            targetQuestionCount
          );
        } else {
          // Use regular templates for other categories
          availableTemplates = await this.getTemplateQuestions(category);
          templateQuestions = await this.generateQuestionsFromTemplates(
            availableTemplates,
            category,
            errorPatterns,
            targetQuestionCount
          );
        }

        console.log(`[TEMPLATE-ONLY] Found ${availableTemplates.length} available templates, generated ${templateQuestions.length} questions`);
      } catch (error) {
        console.error('[TEMPLATE-ONLY] Template generation failed:', error.message);
        templateQuestions = [];
      }

      // Analyze template availability vs requirement
      const templateShortage = targetQuestionCount - templateQuestions.length;
      const hasShortage = templateShortage > 0;

      const result = {
        questions: templateQuestions,
        prescription: {
          category: category,
          questionCount: targetQuestionCount,
          focusAreas: this.determineFocusAreas(errorPatterns, category),
          errorSeverity: this.calculateCategoryErrorSeverity(errorPatterns, category),
          countRationale: countCalculation ? countCalculation.reasoning.rationale : 'Default count used'
        },
        templateAvailability: {
          availableTemplates: availableTemplates.length,
          generatedQuestions: templateQuestions.length,
          requiredQuestions: targetQuestionCount,
          hasShortage: hasShortage,
          shortageAmount: hasShortage ? templateShortage : 0,
          shortageMessage: hasShortage ?
            `Need ${templateShortage} more questions. Teacher should create additional templates.` :
            'Sufficient templates available'
        },
        teacherAction: hasShortage ? 'create_more_templates' : 'use_available_templates'
      };

      console.log(`[TEMPLATE-ONLY] Template analysis:`, {
        available: availableTemplates.length,
        generated: templateQuestions.length,
        required: targetQuestionCount,
        shortage: templateShortage,
        teacherAction: result.teacherAction
      });

      return result;

    } catch (error) {
      console.error('[TEMPLATE-ONLY] Error in template-only question retrieval:', error);
      throw error;
    }
  }

  /**
   * Generate questions from templates based on error patterns
   */
  async generateQuestionsFromTemplates(templates, category, errorPatterns, maxQuestions) {
    try {
      const questions = [];

      if (!templates || templates.length === 0) {
        console.log(`[TEMPLATES] No templates available for ${category}`);
        return questions;
      }

      // Filter templates based on error patterns
      const relevantTemplates = this.filterTemplatesByErrorPatterns(templates, errorPatterns);
      console.log(`[TEMPLATES] Found ${relevantTemplates.length} relevant templates for ${category}`);

      for (let i = 0; i < Math.min(maxQuestions, relevantTemplates.length); i++) {
        const template = relevantTemplates[i];

        // Get applicable choices for this template
        const choices = await this.getTemplateChoices(template.applicableChoiceTypes || []);

        // Build question from template
        const question = await this.buildQuestionFromTemplate(template, choices, i + 1);
        if (question) {
          questions.push(question);
        }
      }

      return questions;
    } catch (error) {
      console.error('[TEMPLATES] Error generating questions from templates:', error);
      return [];
    }
  }

  /**
   * Generate questions from sentence templates for Reading Comprehension
   */
  async generateQuestionsFromSentenceTemplates(sentenceTemplates, maxQuestions) {
    try {
      const questions = [];

      if (!sentenceTemplates || sentenceTemplates.length === 0) {
        console.log('[SENTENCE_TEMPLATES] No sentence templates available for Reading Comprehension');
        return questions;
      }

      console.log(`[SENTENCE_TEMPLATES] Found ${sentenceTemplates.length} sentence templates`);

      for (let i = 0; i < Math.min(maxQuestions, sentenceTemplates.length); i++) {
        const template = sentenceTemplates[i];

        // Generate questions from each sentence template
        if (template.sentenceQuestions && template.sentenceQuestions.length > 0) {
          for (let j = 0; j < template.sentenceQuestions.length && questions.length < maxQuestions; j++) {
            const sentenceQuestion = template.sentenceQuestions[j];

            const question = {
              questionId: `q_int_rc_${String(questions.length + 1).padStart(3, '0')}`,
              source: 'sentence_template',
              sourceQuestionId: template._id.toString(),
              questionType: 'multiple_choice',
              questionText: sentenceQuestion.questionText,
              questionImage: null,
              questionValue: null,
              passageTitle: template.title,
              passageText: template.sentenceText,
              choiceOptions: sentenceQuestion.sentenceOptionAnswers?.map((option, index) => ({
                optionId: `opt_${index + 1}`,
                optionText: option,
                isCorrect: option === sentenceQuestion.sentenceCorrectAnswer
              })) || [],
              difficulty: 0.0,
              discrimination: 1.0,
              targetSkill: 'reading_comprehension',
              targetElement: 'passage_based'
            };

            questions.push(question);
          }
        }
      }

      return questions;
    } catch (error) {
      console.error('[SENTENCE_TEMPLATES] Error generating questions from sentence templates:', error);
      return [];
    }
  }



  /**
   * Helper method to build question from template
   */
  async buildQuestionFromTemplate(template, choices, questionNumber) {
    try {
      const questionId = `q_int_${template.category.toLowerCase().replace(/\s+/g, '_')}_${String(questionNumber).padStart(3, '0')}`;

      const question = {
        questionId: questionId,
        source: 'template_question',
        sourceQuestionId: template._id.toString(),
        questionType: template.questionType,
        questionText: template.templatetext,
        questionImage: null,
        questionValue: null,
        difficulty: 0,
        discrimination: 1.0,
        targetSkill: 'error_focused',
        targetElement: 'template_based'
      };

      // Add category-specific question data based on question type
      if (template.questionType === 'malapantig' && template.category === 'Phonological Awareness') {
        // Build matching question structure
        const audioTexts = choices.slice(0, template.matchCount || 3).map(c => c.choiceValue);
        const matchingOptions = choices.slice(0, template.matchCount || 3).map(c => c.correctMatch || c.choiceValue);

        question.questionSet = {
          audioTexts: audioTexts,
          matchingOptions: matchingOptions,
          correctPairs: audioTexts.map(audio => ({
            audio: audio,
            match: choices.find(c => c.choiceValue === audio)?.correctMatch || audio
          }))
        };
      } else {
        // Build choice options for multiple choice questions
        const selectedChoices = choices.slice(0, 4); // Get up to 4 choices
        question.choiceOptions = selectedChoices.map((choice, index) => ({
          optionId: `opt_${index + 1}`,
          optionText: choice.choiceValue,
          isCorrect: index === 0 // First option is correct by default
        }));
      }

      return question;
    } catch (error) {
      console.error('[TEMPLATE_BUILD] Error building question from template:', error);
      return null;
    }
  }



  /**
   * Helper methods for strategy determination
   */
  determineSelectionMethod(errorPatterns) {
    if (!errorPatterns || Object.keys(errorPatterns).length === 0) {
      return 'general_practice';
    }
    return 'error_focused';
  }

  determineFocusAreas(errorPatterns, category) {
    const focusAreas = {};

    if (!errorPatterns) {
      focusAreas['general_practice'] = 100;
      return focusAreas;
    }

    // Category-specific focus area determination
    switch (category) {
      case 'Alphabet Knowledge':
        if (errorPatterns.patinig_errors) {
          focusAreas['patinig_practice'] = 60;
          focusAreas['general_practice'] = 40;
        } else if (errorPatterns.katinig_errors) {
          focusAreas['katinig_practice'] = 60;
          focusAreas['general_practice'] = 40;
        } else {
          focusAreas['general_practice'] = 100;
        }
        break;
      case 'Phonological Awareness':
        if (errorPatterns.matching_errors) {
          focusAreas['sound_matching'] = 70;
          focusAreas['general_practice'] = 30;
        } else {
          focusAreas['general_practice'] = 100;
        }
        break;
      default:
        focusAreas['general_practice'] = 100;
    }

    return focusAreas;
  }

  /**
   * Filter templates based on error patterns
   */
  filterTemplatesByErrorPatterns(templates, errorPatterns) {
    if (!errorPatterns || Object.keys(errorPatterns).length === 0) {
      return templates; // Return all if no specific errors
    }

    // Simple filtering - can be enhanced based on specific error pattern logic
    return templates;
  }
}

module.exports = new InterventionService(); 