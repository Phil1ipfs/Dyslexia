// services/Teachers/InterventionService.js
const mongoose = require('mongoose');
const InterventionPlan = require('../../models/Teachers/ManageProgress/interventionPlanModel');
const InterventionProgress = require('../../models/Teachers/ManageProgress/interventionProgressModel');
const InterventionResponse = require('../../models/Teachers/ManageProgress/interventionResponseModel');
const TemplateQuestion = require('../../models/Teachers/ManageProgress/templatesQuestionsModel');
const TemplateChoice = require('../../models/Teachers/ManageProgress/templatesChoicesModel');
const SentenceTemplate = require('../../models/Teachers/ManageProgress/sentenceTemplateModel');
const PrescriptiveAnalysis = require('../../models/Teachers/ManageProgress/prescriptiveAnalysisModel');
const User = require('../../models/userModel');
const s3Client = require('../../config/s3');

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
      console.log('Creating intervention with data:', JSON.stringify(interventionData, null, 2));
      
      // Check if student exists
      const student = await User.findById(interventionData.studentId);
      if (!student) {
        throw new Error('Student not found');
      }
      
      // Check if there's an existing intervention for this student and category
      const existingIntervention = await InterventionPlan.findOne({
        studentId: interventionData.studentId,
        category: interventionData.category,
      });
      
      if (existingIntervention) {
        // If there's an existing intervention, archive it first
        existingIntervention.status = 'archived';
        await existingIntervention.save();
        
        console.log(`Archived existing intervention ${existingIntervention._id} for student ${interventionData.studentId} and category ${interventionData.category}`);
      }
      
      // Add default descriptions for choices if not provided
      if (interventionData.questions && Array.isArray(interventionData.questions)) {
        interventionData.questions = interventionData.questions.map(question => {
          if (question.choices && Array.isArray(question.choices)) {
            question.choices = question.choices.map(choice => {
              // Description field is optional - provide defaults if missing
              if (!choice.description || choice.description.trim() === '') {
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
                console.log(`Using teacher-provided description for choice: ${choice.optionText}: "${choice.description}"`);
              }
              
              return choice;
            });
          }
          return question;
        });
      }
      
      // Print the final intervention data with descriptions
      console.log('Final intervention data with descriptions:');
      if (interventionData.questions) {
        interventionData.questions.forEach((question, qIndex) => {
          console.log(`Question ${qIndex + 1}: ${question.questionText}`);
          if (question.choices) {
            question.choices.forEach((choice, cIndex) => {
              console.log(`  Choice ${cIndex + 1}: ${choice.optionText} - Description: ${choice.description || 'N/A'}`);
            });
          }
        });
      }
      
      // Create progress record
      const interventionProgress = new InterventionProgress({
        studentId: interventionData.studentId,
        interventionPlanId: null,  // Will be updated after intervention is created
        status: 'not_started',
        completedActivities: 0,
        totalActivities: interventionData.questions?.length || 0,
        correctAnswers: 0,
        incorrectAnswers: 0,
        percentComplete: 0,
        percentCorrect: 0,
        passedThreshold: false
      });
      
      // Create the intervention
      const intervention = new InterventionPlan(interventionData);
      
      // Save both records
      await intervention.save();
      
      // Update the progress record with the intervention ID
      interventionProgress.interventionPlanId = intervention._id;
      await interventionProgress.save();
      
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
      
      console.log(`Querying templates_questions with category: ${normCategory}`);
      
      // Use direct collection access to match how main_assessment is queried
      const templates = await mongoose.connection.db
        .collection('templates_questions')
        .find({ 
          category: normCategory,
          isActive: true 
        })
        .toArray();
      
      console.log(`Found ${templates.length} template questions`);
      
      return templates;
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
      console.log('Creating template question with data:', templateData);
      
      // Ensure the category is properly normalized
      templateData.category = this.normalizeCategoryName(templateData.category);
      
      // Set default values for required fields if not provided
      if (!templateData.isActive) templateData.isActive = true;
      if (!templateData.isApproved) templateData.isApproved = true;
      if (!templateData.createdAt) templateData.createdAt = new Date();
      if (!templateData.updatedAt) templateData.updatedAt = new Date();
      
      // Insert directly into the collection
      const result = await mongoose.connection.db
        .collection('templates_questions')
        .insertOne(templateData);
      
      if (!result.insertedId) {
        throw new Error('Failed to insert template question');
      }
      
      console.log(`Successfully created template question with ID: ${result.insertedId}`);
      
      return { ...templateData, _id: result.insertedId };
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
      const progress = await InterventionProgress.findOne({
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
}

module.exports = new InterventionService(); 