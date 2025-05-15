// controllers/Teachers/ManageProgress/assessmentAssignmentController.js
const mongoose = require('mongoose');
const ObjectId = mongoose.Types.ObjectId;

// Helper function to get connection to database
const getTestDb = () => mongoose.connection.useDb('test');
const getPreAssessmentDb = () => mongoose.connection.useDb('Pre_Assessment');
const CustomizedAssessment = require('../../../models/Teachers/CustomizedAssessment');

// Helper function to convert IDs safely
const toObjectId = (id) => {
  try {
    if (mongoose.Types.ObjectId.isValid(id)) {
      return new mongoose.Types.ObjectId(id);
    }
  } catch (error) {
    console.error('Error converting to ObjectId:', error);
  }
  return id;
};

/**
 * Assign assessment categories to a student with content customization
 * @route POST /api/assessment/assign-categories
 */
exports.assignCategories = async (req, res) => {
  const session = await mongoose.startSession();
  
  try {
    console.log('Starting category assignment process');
    console.log('Request payload:', JSON.stringify(req.body));
    
    const { studentId, readingLevel, categories, customizations } = req.body;
    
    // Input validation
    if (!studentId) {
      return res.status(400).json({ success: false, message: 'Student ID is required' });
    }
    
    if (!readingLevel) {
      return res.status(400).json({ success: false, message: 'Reading level is required' });
    }
    
    if (!categories || !Array.isArray(categories) || categories.length === 0) {
      return res.status(400).json({ success: false, message: 'At least one category must be specified' });
    }
    
    // Convert IDs to proper types
    const studentObjId = toObjectId(studentId);
    const teacherObjId = req.user ? toObjectId(req.user.id) : null;
    
    // Database collections
    const testDb = getTestDb();
    const assignmentsCollection = testDb.collection('assessment_assignments');
    const responsesCollection = testDb.collection('assessment_responses');
    const categoryProgressCollection = testDb.collection('category_progress');
    const studentProfileUpdatesCollection = testDb.collection('student_profile_updates');
    const mainAssessmentCollection = testDb.collection('main_assessment');
    const customizedAssessmentsCollection = testDb.collection('customized_assessments');
    const usersCollection = testDb.collection('users');
    
    // Start transaction
    session.startTransaction();
    
    try {
      // Process each category
      const assignmentResults = [];
      
      for (const category of categories) {
        const categoryId = parseInt(category.categoryId);
        console.log(`Processing category ${categoryId}: ${category.categoryName}`);
        
        // Find matching main assessment for this category and reading level
        let mainAssessment;
        try {
          mainAssessment = await mainAssessmentCollection.findOne({
            categoryID: categoryId,
            targetReadingLevel: readingLevel,
            status: "active",
            isPublished: true
          });
          
          if (!mainAssessment) {
            console.log(`No published assessment found for category ${categoryId}, creating placeholder`);
            
            // Create placeholder assessment
            const placeholderId = `MA-${categoryId}-${Date.now().toString().slice(-6)}`;
            mainAssessment = {
              _id: new mongoose.Types.ObjectId(),
              assessmentId: placeholderId,
              title: `${category.categoryName} Assessment - ${readingLevel}`,
              description: `Assessment for ${category.categoryName} at ${readingLevel} level`,
              categoryID: categoryId,
              categoryName: category.categoryName,
              targetReadingLevel: readingLevel,
              totalQuestions: 0,
              passingThreshold: 75,
              status: "active",
              isPublished: true,
              createdBy: teacherObjId,
              createdAt: new Date(),
              updatedAt: new Date(),
              questions: [], // Empty questions array
              instructions: `Please complete this ${category.categoryName} assessment.`,
              feedbackSettings: {
                showExplanation: true,
                showCorrectAnswer: true,
                immediatePerQuestionFeedback: true
              }
            };
            
            // Save the placeholder assessment
            await mainAssessmentCollection.insertOne(mainAssessment, { session });
            console.log(`Created placeholder assessment with ID: ${placeholderId}`);
          } else {
            console.log(`Found published assessment: ${mainAssessment.title} (${mainAssessment.assessmentId})`);
          }
        } catch (assessmentError) {
          console.error('Error finding/creating assessment:', assessmentError);
          throw assessmentError; // Will trigger transaction abort
        }
        
        // Create customized assessment if customizations were provided
        let customizedAssessment = null;
        let useCustomizedAssessment = false;
        
        if (customizations) {
          try {
            // Check if we have selected questions or content mappings
            const hasSelectedQuestions = customizations.selectedQuestions && 
              Object.keys(customizations.selectedQuestions).some(key => 
                key.startsWith(mainAssessment.assessmentId) && customizations.selectedQuestions[key]
              );
              
            const hasContentMappings = customizations.contentMappings && 
              Object.keys(customizations.contentMappings).some(key => 
                key.startsWith(mainAssessment.assessmentId)
              );
            
            // Only create customized assessment if we have customizations
            if (hasSelectedQuestions || hasContentMappings) {
              // Filter questions based on selection
              let selectedQuestions = [];
              
              if (hasSelectedQuestions && mainAssessment.questions) {
                selectedQuestions = mainAssessment.questions.filter(q => 
                  customizations.selectedQuestions[`${mainAssessment.assessmentId}-${q.questionId}`]
                );
                
                // Apply content mappings to questions
                if (hasContentMappings && mainAssessment.questions) {
                  selectedQuestions = selectedQuestions.map(q => {
                    const questionKey = `${mainAssessment.assessmentId}-${q.questionId}`;
                    const contentMapping = customizations.contentMappings[questionKey];
                    
                    if (contentMapping) {
                      // Process content reference properly
                      let contentId = contentMapping.contentId;
                      
                      // Handle different ID formats
                      if (typeof contentId === 'object' && contentId.$oid) {
                        contentId = contentId.$oid;
                      }
                      
                      // Ensure valid ObjectId when possible
                      if (mongoose.Types.ObjectId.isValid(contentId)) {
                        contentId = new ObjectId(contentId);
                      }
                      
                      return {
                        ...q,
                        originalQuestionId: q.questionId,
                        questionId: `${q.questionId}-${Date.now().toString().slice(-4)}`,
                        contentReference: {
                          collection: contentMapping.collection,
                          contentId: contentId
                        },
                        originalContentReference: q.contentReference
                      };
                    }
                    
                    return {
                      ...q,
                      originalQuestionId: q.questionId,
                      questionId: `${q.questionId}-${Date.now().toString().slice(-4)}`
                    };
                  });
                }


              }
              
              // Create a customized assessment
              const customAssessmentId = `CA-${categoryId}-${Date.now().toString().slice(-6)}`;
              
              customizedAssessment = {
                originalAssessmentId: mainAssessment.assessmentId,
                studentId: studentObjId,
                teacherId: teacherObjId,
                assessmentId: customAssessmentId,
                title: `${mainAssessment.title} (Customized)`,
                description: `Customized version of ${mainAssessment.title} for student`,
                categoryID: categoryId,
                categoryName: category.categoryName,
                targetReadingLevel: readingLevel,
                questions: selectedQuestions,
                totalQuestions: selectedQuestions.length,
                passingThreshold: mainAssessment.passingThreshold || 75,
                status: 'active',
                createdAt: new Date(),
                updatedAt: new Date()
              };
              
              // Insert customized assessment
              const result = await customizedAssessmentsCollection.insertOne(customizedAssessment, { session });
              customizedAssessment._id = result.insertedId;
              
              useCustomizedAssessment = true;
              console.log(`Created customized assessment: ${customAssessmentId}`);
            }
          } catch (customizeError) {
            console.error('Error creating customized assessment:', customizeError);
            // Continue with standard assessment if customization fails
            useCustomizedAssessment = false;
          }
        }
        
        // Use either the customized assessment or the main assessment
        const assessmentToUse = useCustomizedAssessment ? customizedAssessment : mainAssessment;
        
        // Create the assignment document
        const assignmentDoc = {
          assessmentId: assessmentToUse.assessmentId,
          assessmentTitle: assessmentToUse.title,
          categoryId: categoryId,
          categoryName: category.categoryName,
          assignedBy: teacherObjId,
          assignedDate: new Date(),
          targetReadingLevel: readingLevel,
          passingThreshold: assessmentToUse.passingThreshold || 75,
          completionCount: 0,
          totalAssigned: 1,
          completionRate: 0,
          instructions: assessmentToUse.instructions || `Please complete this ${category.categoryName} assessment.`,
          assignedStudent: [
            {
              userId: studentObjId,
              readingLevel: readingLevel,
              status: 'pending'
            }
          ],
          hasCustomization: useCustomizedAssessment,
          customizedAssessmentId: useCustomizedAssessment ? customizedAssessment.assessmentId : null
        };
        
        // Insert the assignment
        let result;
        try {
          result = await assignmentsCollection.insertOne(assignmentDoc, { session });
          console.log(`Created assignment: ${assignmentDoc.assessmentTitle} (ID: ${assignmentDoc.assessmentId})`);
          assignmentResults.push({ ...assignmentDoc, _id: result.insertedId });
        } catch (assignmentError) {
          console.error('Error creating assignment:', assignmentError);
          throw assignmentError; // Will trigger transaction abort
        }
        
        // Create an empty assessment response to track student progress
        const responseDoc = {
          assessmentId: assessmentToUse.assessmentId,
          userId: studentObjId,
          categoryId: categoryId,
          categoryName: category.categoryName,
          readingLevel: readingLevel,
          startTime: null,
          endTime: null,
          completed: false,
          answers: {},
          rawScore: null,
          totalQuestions: assessmentToUse.totalQuestions || 0,
          percentageScore: null,
          passed: null,
          attemptNumber: 0,
          correctAnswers: [],
          incorrectAnswers: [],
          timeSpent: 0,
          completedAt: null,
          reviewedAt: null,
          teacherFeedback: "",
          teacherReviewedBy: null,
          nextSteps: "",
          assignmentId: result.insertedId,
          hasCustomization: useCustomizedAssessment,
          customizedAssessmentId: useCustomizedAssessment ? customizedAssessment.assessmentId : null
        };
        
        // Insert the response
        try {
          await responsesCollection.insertOne(responseDoc, { session });
          console.log(`Created assessment response for ${category.categoryName}`);
        } catch (responseError) {
          console.error('Error creating assessment response:', responseError);
          throw responseError; // Will trigger transaction abort
        }
        
        // Create student profile update record
        const updateDoc = {
          userId: studentObjId,
          updateType: "assignment_received",
          previousValue: null,
          newValue: assessmentToUse.assessmentId,
          reason: `Teacher assigned ${category.categoryName} assessment`,
          assessmentId: assessmentToUse.assessmentId,
          categoryId: categoryId,
          updateDate: new Date(),
          updatedBy: teacherObjId
        };
        
        try {
          await studentProfileUpdatesCollection.insertOne(updateDoc, { session });
          console.log(`Created student profile update for ${category.categoryName}`);
        } catch (updateError) {
          console.error('Error creating student profile update:', updateError);
          throw updateError; // Will trigger transaction abort
        }
        
        // Update category progress
        try {
          await updateCategoryProgress(
            studentObjId, 
            categoryId, 
            category.categoryName, 
            assessmentToUse.assessmentId,
            'in_progress',
            categoryProgressCollection,
            session
          );
        } catch (progressError) {
          console.error('Error updating category progress:', progressError);
          throw progressError;
        }
      }
      
      // Commit the transaction
      await session.commitTransaction();
      session.endSession();
      
      console.log('Assignment transaction committed successfully');
      
      // Return success response
      res.json({
        success: true,
        message: 'Categories assigned successfully',
        assignments: assignmentResults
      });
    } catch (error) {
      // Abort transaction on critical error
      await session.abortTransaction();
      session.endSession();
      console.error('Assignment transaction aborted due to error:', error);
      throw error;
    }
  } catch (error) {
    if (session.inTransaction()) {
      await session.abortTransaction();
    }
    session.endSession();
    
    console.error('Error in assignCategories:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

// Helper function to update category progress
async function updateCategoryProgress(studentId, categoryId, categoryName, assessmentId, status, collection, session) {
  // Check if progress exists
  const progress = await collection.findOne({ userId: studentId });
  
  if (progress) {
    console.log(`Found existing category progress for student`);
    
    // Update existing categories
    const updatedCategories = [...progress.categories];
    
    // Find this category
    const categoryIndex = updatedCategories.findIndex(c => c.categoryId === categoryId);
    
    if (categoryIndex >= 0) {
      console.log(`Updating existing category: ${categoryName}`);
      updatedCategories[categoryIndex] = {
        ...updatedCategories[categoryIndex],
        status: status,
        mainAssessmentId: assessmentId,
        lastAttemptDate: new Date()
      };
    } else {
      console.log(`Adding new category: ${categoryName}`);
      // Add new category
      updatedCategories.push({
        categoryId: categoryId,
        categoryName: categoryName,
        preAssessmentCompleted: true,
        preAssessmentScore: 0,
        preAssessmentDate: new Date(),
        mainAssessmentCompleted: false,
        mainAssessmentId: assessmentId,
        mainAssessmentScore: null,
        passed: false,
        passingThreshold: 75,
        attemptCount: 0,
        lastAttemptDate: new Date(),
        completionDate: null,
        status: status
      });
    }
    
    // Update the category progress
    await collection.updateOne(
      { _id: progress._id },
      {
        $set: {
          categories: updatedCategories,
          updatedAt: new Date()
        }
      },
      { session }
    );
    
    console.log(`Updated category progress for student`);
  } else {
    console.log(`Creating new category progress for student`);
    
    // Create default categories structure
    const allCategories = [
      {
        categoryId: 1,
        categoryName: "Alphabet Knowledge",
        preAssessmentCompleted: false,
        preAssessmentScore: null,
        preAssessmentDate: null,
        mainAssessmentCompleted: false,
        mainAssessmentId: null,
        mainAssessmentScore: null,
        passed: false,
        passingThreshold: 75,
        attemptCount: 0,
        lastAttemptDate: null,
        completionDate: null,
        status: "pending"
      },
      {
        categoryId: 2,
        categoryName: "Phonological Awareness",
        preAssessmentCompleted: false,
        preAssessmentScore: null,
        preAssessmentDate: null,
        mainAssessmentCompleted: false,
        mainAssessmentId: null,
        mainAssessmentScore: null,
        passed: false,
        passingThreshold: 75,
        attemptCount: 0,
        lastAttemptDate: null,
        completionDate: null,
        status: "pending"
      },
      {
        categoryId: 3,
        categoryName: "Decoding",
        preAssessmentCompleted: false,
        preAssessmentScore: null,
        preAssessmentDate: null,
        mainAssessmentCompleted: false,
        mainAssessmentId: null,
        mainAssessmentScore: null,
        passed: false,
        passingThreshold: 75,
        attemptCount: 0,
        lastAttemptDate: null,
        completionDate: null,
        status: "pending"
      },
      {
        categoryId: 4,
        categoryName: "Word Recognition",
        preAssessmentCompleted: false,
        preAssessmentScore: null,
        preAssessmentDate: null,
        mainAssessmentCompleted: false,
        mainAssessmentId: null,
        mainAssessmentScore: null,
        passed: false,
        passingThreshold: 75,
        attemptCount: 0,
        lastAttemptDate: null,
        completionDate: null,
        status: "pending"
      },
      {
        categoryId: 5,
        categoryName: "Reading Comprehension",
        preAssessmentCompleted: false,
        preAssessmentScore: null,
        preAssessmentDate: null,
        mainAssessmentCompleted: false,
        mainAssessmentId: null,
        mainAssessmentScore: null,
        passed: false,
        passingThreshold: 75,
        attemptCount: 0,
        lastAttemptDate: null,
        completionDate: null,
        status: "locked"
      }
    ];
    
    // Update the category
    const category = allCategories.find(c => c.categoryId === categoryId);
    if (category) {
      category.status = status;
      category.preAssessmentCompleted = true;
      category.preAssessmentScore = 0;
      category.preAssessmentDate = new Date();
      category.mainAssessmentId = assessmentId;
      category.lastAttemptDate = new Date();
    }
    
    // Create new progress
    const newProgress = {
      userId: studentId,
      studentName: '',
      readingLevel: '',
      categories: allCategories,
      completedCategories: 0,
      totalCategories: 5,
      overallProgress: 0,
      nextCategory: {
        categoryId: categoryId,
        categoryName: categoryName,
        assessmentId: assessmentId
      },
      createdAt: new Date(),
      updatedAt: new Date()
    };
    
    await collection.insertOne(newProgress, { session });
    console.log(`Created new category progress for student`);
  }
}

// controllers/Teachers/ManageProgress/assessmentResponseController.js - Key function fix

// Submit student response to an assessment
exports.submitResponse = async (req, res) => {
  try {
    const { assessmentId, answers } = req.body;
    const studentId = req.user.id; // Assuming this is used for student submissions
    
    if (!assessmentId || !answers) {
      return res.status(400).json({ message: 'Missing required fields' });
    }
    
    const testDb = getTestDb();
    const responsesCollection = testDb.collection('assessment_responses');
    const mainAssessmentCollection = testDb.collection('main_assessment');
    const customizedAssessmentsCollection = testDb.collection('customized_assessments');
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
      
      // Check if this assessment is customized
      let assessment;
      if (response.hasCustomization && response.customizedAssessmentId) {
        // Get the customized assessment
        assessment = await customizedAssessmentsCollection.findOne({
          assessmentId: response.customizedAssessmentId
        });
        
        console.log('Using customized assessment for scoring');
      }
      
      // If not found or not customized, fall back to main assessment
      if (!assessment) {
        assessment = await mainAssessmentCollection.findOne({
          assessmentId: assessmentId
        });
        
        console.log('Using main assessment for scoring');
      }
      
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
      const categoryId = response.categoryId;
      const categoryProgress = await categoryProgressCollection.findOne({
        userId: ObjectId(studentId),
        "categories.categoryId": categoryId
      });
      
      if (categoryProgress) {
        const updatedCategories = categoryProgress.categories.map(cat => {
          if (cat.categoryId === categoryId) {
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

/**
 * Get assessment assignments for a student
 * @route GET /api/assessment/assessment-assignments/:id
 */
exports.getAssignments = async (req, res) => {
  try {
    const studentId = req.params.id;
    console.log(`Getting assessment assignments for student: ${studentId}`);

    const studentObjId = toObjectId(studentId);

    const testDb = getTestDb();
    const assignmentsCollection = testDb.collection('assessment_assignments');

    // Find assignments for this student with query optimization
    let assignments;
    try {
      // First try to find by direct match in assignedStudent array
      assignments = await assignmentsCollection.find({
        "assignedStudent.userId": studentObjId
      }).toArray();

      if (!assignments || assignments.length === 0) {
        // If no exact match, try string conversion of ID for flexibility
        assignments = await assignmentsCollection.find({
          $or: [
            { "assignedStudent.userId": studentObjId },
            { "assignedStudent.userId": studentId.toString() }
          ]
        }).toArray();
      }

      // If still no matches, try checking by student numeric ID
      if (!assignments || assignments.length === 0) {
        const numericId = parseInt(studentId);
        if (!isNaN(numericId)) {
          const usersCollection = testDb.collection('users');
          const student = await usersCollection.findOne({ idNumber: numericId });

          if (student) {
            assignments = await assignmentsCollection.find({
              "assignedStudent.userId": student._id
            }).toArray();
          }
        }
      }

      console.log(`Found ${assignments.length} assignments for student: ${studentId}`);

      // Sanitize customizations to avoid sending too much data
      const sanitizedAssignments = assignments.map(assignment => {
        // Create a copy without customizedAssessment to reduce payload size
        if (assignment.customizedAssessment) {
          return {
            ...assignment,
            hasCustomization: true,
            customizedAssessment: {
              assessmentId: assignment.customizedAssessment.assessmentId,
              totalQuestions: assignment.customizedAssessment.totalQuestions || 0
            }
          };
        }
        return assignment;
      });

      return res.json(sanitizedAssignments);
    } catch (findError) {
      console.error('Error finding assignments:', findError);
      return res.status(500).json({
        message: 'Error retrieving assignments',
        error: findError.message
      });
    }
  } catch (error) {
    console.error('Error in getAssignments:', error);
    res.status(500).json({
      message: 'Server error',
      error: error.message
    });
  }
};

/**
 * Get student analytics with assessment data
 * @route GET /api/assessment/student-analytics/:id
 */
exports.getStudentAnalytics = async (req, res) => {
  try {
    const studentId = req.params.id;
    console.log(`Getting analytics for student: ${studentId}`);

    const studentObjId = toObjectId(studentId);

    const testDb = getTestDb();
    const responsesCollection = testDb.collection('assessment_responses');
    const categoryProgressCollection = testDb.collection('category_progress');
    const usersCollection = testDb.collection('users');

    // Get student info first
    let student;
    try {
      if (mongoose.Types.ObjectId.isValid(studentId)) {
        student = await usersCollection.findOne({ _id: new mongoose.Types.ObjectId(studentId) });
      }

      if (!student) {
        // Try by numeric ID
        const numericId = parseInt(studentId);
        if (!isNaN(numericId)) {
          student = await usersCollection.findOne({ idNumber: numericId });
        }
      }
    } catch (studentError) {
      console.warn('Error finding student:', studentError);
    }

    // Get all completed responses
    let responses;
    try {
      responses = await responsesCollection.find({
        userId: studentObjId,
        completed: true
      }).toArray();

      console.log(`Found ${responses.length} completed responses for student: ${studentId}`);
    } catch (responsesError) {
      console.error('Error finding responses:', responsesError);
      return res.status(500).json({
        message: 'Error retrieving assessment responses',
        error: responsesError.message
      });
    }

    // Get category progress
    let categoryProgress;
    try {
      categoryProgress = await categoryProgressCollection.findOne({
        userId: studentObjId
      });

      console.log(`Category progress ${categoryProgress ? 'found' : 'not found'} for student: ${studentId}`);
    } catch (progressError) {
      console.error('Error finding category progress:', progressError);
      return res.status(500).json({
        message: 'Error retrieving category progress',
        error: progressError.message
      });
    }

    // Calculate analytics
    const analytics = {
      studentId: studentId,
      studentName: student ? `${student.firstName || ''} ${student.lastName || ''}`.trim() : 'Student',
      readingLevel: student?.readingLevel || categoryProgress?.readingLevel || 'Not Assessed',
      totalAssessmentsCompleted: responses.length,
      averageScore: 0,
      categoryBreakdown: {},
      strengths: [],
      weaknesses: [],
      recentProgress: [],
      recommendations: []
    };

    // Calculate average score
    if (responses.length > 0) {
      const totalScore = responses.reduce((sum, resp) => sum + (resp.percentageScore || 0), 0);
      analytics.averageScore = totalScore / responses.length;
    }

    // Calculate category breakdown
    if (categoryProgress && categoryProgress.categories) {
      categoryProgress.categories.forEach(cat => {
        if (cat.status === 'in_progress' || cat.status === 'completed') {
          analytics.categoryBreakdown[cat.categoryName] = {
            categoryId: cat.categoryId,
            score: cat.mainAssessmentScore || 0,
            status: cat.status,
            passed: cat.passed || false,
            attempts: cat.attemptCount || 0,
            lastAttempt: cat.lastAttemptDate,
            completionDate: cat.completionDate
          };
        }
      });

      // Identify strengths and weaknesses
      const categoriesWithScores = categoryProgress.categories
        .filter(cat => cat.mainAssessmentScore !== null)
        .sort((a, b) => (b.mainAssessmentScore || 0) - (a.mainAssessmentScore || 0));

      analytics.strengths = categoriesWithScores.slice(0, 2).map(cat => ({
        categoryId: cat.categoryId,
        category: cat.categoryName,
        score: cat.mainAssessmentScore || 0
      }));

      analytics.weaknesses = [...categoriesWithScores].reverse().slice(0, 2).map(cat => ({
        categoryId: cat.categoryId,
        category: cat.categoryName,
        score: cat.mainAssessmentScore || 0
      }));

      // Generate recommendations based on weaknesses
      if (analytics.weaknesses.length > 0) {
        const weakestCategory = analytics.weaknesses[0];
        if (weakestCategory.score < 50) {
          analytics.recommendations.push({
            type: 'focused_practice',
            categoryId: weakestCategory.categoryId,
            category: weakestCategory.category,
            message: `Focused practice needed in ${weakestCategory.category}`,
            urgency: 'high'
          });
        } else if (weakestCategory.score < 70) {
          analytics.recommendations.push({
            type: 'additional_practice',
            categoryId: weakestCategory.categoryId,
            category: weakestCategory.category,
            message: `Additional practice recommended in ${weakestCategory.category}`,
            urgency: 'medium'
          });
        }
      }
    }

    // Get recent progress (most recent assessments first)
    analytics.recentProgress = responses
      .sort((a, b) => new Date(b.completedAt || 0) - new Date(a.completedAt || 0))
      .slice(0, 5)
      .map(resp => ({
        assessmentId: resp.assessmentId,
        categoryId: resp.categoryId,
        categoryName: resp.categoryName,
        completedAt: resp.completedAt,
        score: resp.percentageScore || 0,
        passed: resp.passed || false,
        timeSpent: resp.timeSpent || 0
      }));

    console.log('Successfully compiled student analytics');

    res.json(analytics);
  } catch (error) {
    console.error('Error in getStudentAnalytics:', error);
    res.status(500).json({
      message: 'Server error',
      error: error.message
    });
  }
};

/**
 * Update assignment status
 * @route PUT /api/assessment/assignment/:id/status
 */
exports.updateAssignmentStatus = async (req, res) => {
  try {
    const assignmentId = req.params.id;
    const { status, notes } = req.body;

    console.log(`Updating assignment status to "${status}" for assignment: ${assignmentId}`);

    if (!status) {
      return res.status(400).json({ message: 'Status is required' });
    }

    // Validate status value
    const validStatuses = ['pending', 'in_progress', 'completed', 'cancelled'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ message: 'Invalid status. Must be one of: pending, in_progress, completed, cancelled' });
    }

    const testDb = getTestDb();
    const assignmentsCollection = testDb.collection('assessment_assignments');

    // Find and update the assignment
    let result;
    try {
      // Try to find by MongoDB ObjectId first
      if (mongoose.Types.ObjectId.isValid(assignmentId)) {
        result = await assignmentsCollection.findOneAndUpdate(
          { _id: new mongoose.Types.ObjectId(assignmentId) },
          {
            $set: {
              "assignedStudent.$[].status": status,
              notes: notes || "",
              updatedAt: new Date()
            }
          },
          { returnDocument: 'after' }
        );
      }

      // If not found, try by assessmentId
      if (!result || !result.value) {
        result = await assignmentsCollection.findOneAndUpdate(
          { assessmentId: assignmentId },
          {
            $set: {
              "assignedStudent.$[].status": status,
              notes: notes || "",
              updatedAt: new Date()
            }
          },
          { returnDocument: 'after' }
        );
      }

      if (!result || !result.value) {
        console.log(`Assignment not found with ID: ${assignmentId}`);
        return res.status(404).json({ message: 'Assignment not found' });
      }

      console.log(`Successfully updated assignment: ${result.value.assessmentTitle}`);

      // Update category progress if status is 'completed'
      if (status === 'completed') {
        try {
          const assignment = result.value;
          const categoryId = assignment.categoryId;
          const studentId = assignment.assignedStudent[0]?.userId;

          if (studentId) {
            const categoryProgressCollection = testDb.collection('category_progress');
            const categoryProgress = await categoryProgressCollection.findOne({
              userId: toObjectId(studentId)
            });

            if (categoryProgress) {
              const updatedCategories = [...categoryProgress.categories];
              const categoryIndex = updatedCategories.findIndex(c => c.categoryId === categoryId);

              if (categoryIndex >= 0) {
                updatedCategories[categoryIndex] = {
                  ...updatedCategories[categoryIndex],
                  status: 'completed',
                  completionDate: new Date()
                };

                // Continuing the updateAssignmentStatus function...

                await categoryProgressCollection.updateOne(
                  { _id: categoryProgress._id },
                  {
                    $set: {
                      categories: updatedCategories,
                      completedCategories: updatedCategories.filter(c => c.status === 'completed').length,
                      updatedAt: new Date()
                    }
                  }
                );

                console.log(`Updated category progress for completed assignment`);
              }
            }
          }
        } catch (progressError) {
          console.error('Error updating category progress:', progressError);
          // Non-critical error, continue
        }
      }
    } catch (updateError) {
      console.error('Error updating assignment status:', updateError);
      return res.status(500).json({
        message: 'Error updating assignment status',
        error: updateError.message
      });
    }

    res.json({
      success: true,
      message: 'Assignment status updated',
      assignment: result.value
    });
  } catch (error) {
    console.error('Error in updateAssignmentStatus:', error);
    res.status(500).json({
      message: 'Server error',
      error: error.message
    });
  }
};

/**
* Get assessment questions with content from customized assessment if available
* @route GET /api/assessment/questions/:assessmentId
*/
exports.getAssessmentQuestions = async (req, res) => {
  try {
    const { assessmentId } = req.params;
    const studentId = req.user?.id;

    if (!assessmentId) {
      return res.status(400).json({ message: 'Assessment ID is required' });
    }

    if (!studentId) {
      return res.status(401).json({ message: 'User ID is required' });
    }

    console.log(`Retrieving questions for assessment ${assessmentId} for student ${studentId}`);

    const testDb = getTestDb();
    const mainAssessmentCollection = testDb.collection('main_assessment');
    const assignmentsCollection = testDb.collection('assessment_assignments');
    const responsesCollection = testDb.collection('assessment_responses');

    // First check if there's a customized assessment for this student
    let customizedQuestions = null;

    try {
      // Find the response to get the assignment reference
      const response = await responsesCollection.findOne({
        assessmentId: assessmentId,
        userId: toObjectId(studentId)
      });

      if (response && response.assignmentId) {
        // Get the assignment with customized assessment
        const assignment = await assignmentsCollection.findOne({
          _id: response.assignmentId
        });

        if (assignment && assignment.customizedAssessment && assignment.customizedAssessment.questions) {
          customizedQuestions = assignment.customizedAssessment.questions;
          console.log(`Found customized questions for assessment ${assessmentId}`);
        }
      } else if (response && response.hasCustomization) {
        // Alternative lookup by assessmentId if assignmentId is not stored
        const assignment = await assignmentsCollection.findOne({
          assessmentId: assessmentId,
          "assignedStudent.userId": toObjectId(studentId)
        });

        if (assignment && assignment.customizedAssessment && assignment.customizedAssessment.questions) {
          customizedQuestions = assignment.customizedAssessment.questions;
          console.log(`Found customized questions via alternative lookup`);
        }
      }
    } catch (customError) {
      console.error('Error finding customized assessment:', customError);
      // Continue to try original assessment questions
    }

    // If customized questions found, return them
    if (customizedQuestions) {
      return res.json({
        success: true,
        isCustomized: true,
        questions: customizedQuestions
      });
    }

    // Otherwise, get original assessment questions
    try {
      const assessment = await mainAssessmentCollection.findOne({
        assessmentId: assessmentId
      });

      if (!assessment) {
        return res.status(404).json({ message: 'Assessment not found' });
      }

      if (!assessment.questions || assessment.questions.length === 0) {
        return res.status(404).json({ message: 'No questions found for this assessment' });
      }

      console.log(`Returning ${assessment.questions.length} original questions for assessment ${assessmentId}`);

      return res.json({
        success: true,
        isCustomized: false,
        questions: assessment.questions
      });
    } catch (assessmentError) {
      console.error('Error finding main assessment:', assessmentError);
      return res.status(500).json({
        message: 'Error retrieving assessment questions',
        error: assessmentError.message
      });
    }
  } catch (error) {
    console.error('Error in getAssessmentQuestions:', error);
    res.status(500).json({
      message: 'Server error',
      error: error.message
    });
  }
};

/**
* Assign multiple categories at once to a group of students
* @route POST /api/assessment/assign-categories-batch
*/
exports.assignCategoriesBatch = async (req, res) => {
  try {
    const { students, categories, readingLevel } = req.body;

    if (!students || !Array.isArray(students) || students.length === 0) {
      return res.status(400).json({ success: false, message: 'At least one student must be specified' });
    }

    if (!categories || !Array.isArray(categories) || categories.length === 0) {
      return res.status(400).json({ success: false, message: 'At least one category must be specified' });
    }

    if (!readingLevel) {
      return res.status(400).json({ success: false, message: 'Reading level is required' });
    }

    console.log(`Batch assigning ${categories.length} categories to ${students.length} students`);

    // Process each student individually using the single assignment function
    const results = [];
    const failures = [];

    for (const studentId of students) {
      try {
        // Create a mock request for the assignCategories function
        const mockReq = {
          body: {
            studentId,
            readingLevel,
            categories
          },
          user: req.user
        };

        // Create a mock response to capture the result
        const mockRes = {
          status: function (statusCode) {
            this.statusCode = statusCode;
            return this;
          },
          json: function (data) {
            this.data = data;
            return this;
          }
        };

        // Call the assignCategories function
        await exports.assignCategories(mockReq, mockRes);

        // Check the result
        if (mockRes.statusCode && mockRes.statusCode !== 200) {
          failures.push({
            studentId,
            error: mockRes.data?.message || 'Unknown error'
          });
        } else if (mockRes.data?.success) {
          results.push({
            studentId,
            assignments: mockRes.data.assignments
          });
        } else {
          failures.push({
            studentId,
            error: 'Unknown error in assignment process'
          });
        }
      } catch (studentError) {
        console.error(`Error assigning categories to student ${studentId}:`, studentError);
        failures.push({
          studentId,
          error: studentError.message
        });
      }
    }

    res.json({
      success: true,
      message: `Assigned categories to ${results.length} students with ${failures.length} failures`,
      successes: results,
      failures: failures
    });
  } catch (error) {
    console.error('Error in assignCategoriesBatch:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

/**
* Get category recommendations for reading level
* @route GET /api/assessment/recommended-categories/:readingLevel
*/
exports.getRecommendedCategories = async (req, res) => {
  try {
    const { readingLevel } = req.params;

    if (!readingLevel) {
      return res.status(400).json({ message: 'Reading level is required' });
    }

    // Define recommended categories by reading level
    const recommendationMap = {
      'Low Emerging': [1, 2, 3], // Alphabet Knowledge, Phonological Awareness, Decoding
      'High Emerging': [2, 3, 4], // Phonological Awareness, Decoding, Word Recognition
      'Developing': [3, 4, 5],    // Decoding, Word Recognition, Reading Comprehension
      'Transitioning': [4, 5],    // Word Recognition, Reading Comprehension
      'At Grade Level': [5]       // Reading Comprehension
    };

    // Get category info from Pre_Assessment database
    const preAssessmentDb = getPreAssessmentDb();
    const categoriesCollection = preAssessmentDb.collection('assessment_categories');

    let categories;
    try {
      categories = await categoriesCollection.find({}).toArray();

      if (!categories || categories.length === 0) {
        // Fallback to default categories
        categories = [
          {
            categoryID: 1,
            categoryTitle: "Alphabet Knowledge",
            categoryDescription: "Assessment of letter recognition, uppercase and lowercase letters, and letter sounds"
          },
          {
            categoryID: 2,
            categoryTitle: "Phonological Awareness",
            categoryDescription: "Assessment of sounds, sound patterns, and auditory processing skills"
          },
          {
            categoryID: 3,
            categoryTitle: "Decoding",
            categoryDescription: "Assessment of ability to interpret written symbols and translate them into speech"
          },
          {
            categoryID: 4,
            categoryTitle: "Word Recognition",
            categoryDescription: "Assessment of ability to recognize and understand common words"
          },
          {
            categoryID: 5,
            categoryTitle: "Reading Comprehension",
            categoryDescription: "Assessment of understanding of text content"
          }
        ];
      }
    } catch (categoriesError) {
      console.error('Error fetching categories:', categoriesError);
      // Use default categories
      categories = [
        {
          categoryID: 1,
          categoryTitle: "Alphabet Knowledge",
          categoryDescription: "Assessment of letter recognition, uppercase and lowercase letters, and letter sounds"
        },
        {
          categoryID: 2,
          categoryTitle: "Phonological Awareness",
          categoryDescription: "Assessment of sounds, sound patterns, and auditory processing skills"
        },
        {
          categoryID: 3,
          categoryTitle: "Decoding",
          categoryDescription: "Assessment of ability to interpret written symbols and translate them into speech"
        },
        {
          categoryID: 4,
          categoryTitle: "Word Recognition",
          categoryDescription: "Assessment of ability to recognize and understand common words"
        },
        {
          categoryID: 5,
          categoryTitle: "Reading Comprehension",
          categoryDescription: "Assessment of understanding of text content"
        }
      ];
    }

    // Get recommended category IDs for this reading level
    const recommendedIds = recommendationMap[readingLevel] || [];

    // Filter categories to recommended ones
    const recommendedCategories = categories
      .filter(cat => recommendedIds.includes(cat.categoryID))
      .map(cat => ({
        categoryId: cat.categoryID,
        categoryTitle: cat.categoryTitle,
        categoryDescription: cat.categoryDescription,
        isRecommended: true
      }));

    res.json({
      readingLevel,
      recommendedCategories
    });
  } catch (error) {
    console.error('Error in getRecommendedCategories:', error);
    res.status(500).json({
      message: 'Server error',
      error: error.message
    });
  }
};

/**
* Get content for a specific question
* @route GET /api/assessment/question-content/:collection/:contentId
*/
exports.getQuestionContent = async (req, res) => {
  try {
    const { collection, contentId } = req.params;

    if (!collection || !contentId) {
      return res.status(400).json({ message: 'Collection and content ID are required' });
    }

    // Validate collection
    const validCollections = ['letters_collection', 'syllables_collection', 'words_collection', 'sentences_collection', 'shortstory_collection'];
    if (!validCollections.includes(collection)) {
      return res.status(400).json({ message: 'Invalid collection name' });
    }

    // Get the Pre_Assessment database connection
    const preAssessmentDb = getPreAssessmentDb();
    const collectionObj = preAssessmentDb.collection(collection);

    // Try to find the content
    let content;
    try {
      // Try to find by ObjectId
      if (mongoose.Types.ObjectId.isValid(contentId)) {
        content = await collectionObj.findOne({
          _id: new mongoose.Types.ObjectId(contentId)
        });
      }

      // If not found, try string ID fields (letterID, syllableID, etc.)
      if (!content) {
        // Remove 'collection' from collection name to get the base type
        const baseType = collection.replace('_collection', '');

        // Build the ID field name (letterID, wordID, etc.)
        const idField = `${baseType}ID`;

        // Find by ID field
        const query = {};
        query[idField] = contentId;

        content = await collectionObj.findOne(query);
      }

      if (!content) {
        return res.status(404).json({ message: 'Content not found' });
      }

      res.json(content);
    } catch (contentError) {
      console.error(`Error finding content in ${collection}:`, contentError);
      return res.status(500).json({
        message: 'Error retrieving content',
        error: contentError.message
      });
    }
  } catch (error) {
    console.error('Error in getQuestionContent:', error);
    res.status(500).json({
      message: 'Server error',
      error: error.message
    });
  }
};

/**
* Get available question content options for a specific collection
* @route GET /api/assessment/content-options/:collection
*/
exports.getContentOptions = async (req, res) => {
  try {
    const { collection } = req.params;
    const { limit = 20, search } = req.query;

    if (!collection) {
      return res.status(400).json({ message: 'Collection is required' });
    }

    // Validate collection
    const validCollections = ['letters', 'syllables', 'words', 'sentences', 'shortstories'];
    if (!validCollections.includes(collection)) {
      return res.status(400).json({ message: 'Invalid collection name' });
    }

    // Map to actual collection name in database
    const dbCollection = `${collection}_collection`;

    // Get the Pre_Assessment database connection
    const preAssessmentDb = getPreAssessmentDb();
    const collectionObj = preAssessmentDb.collection(dbCollection);

    // Build search query
    const query = {};
    if (search) {
      // Different search criteria based on collection type
      if (collection === 'letters') {
        query.$or = [
          { smallLetter: { $regex: search, $options: 'i' } },
          { bigLetter: { $regex: search, $options: 'i' } },
          { soundText: { $regex: search, $options: 'i' } }
        ];
      } else if (collection === 'syllables' || collection === 'words') {
        query.$or = [
          { text: { $regex: search, $options: 'i' } },
          { soundText: { $regex: search, $options: 'i' } }
        ];

        if (collection === 'words') {
          query.$or.push({ meaning: { $regex: search, $options: 'i' } });
          query.$or.push({ category: { $regex: search, $options: 'i' } });
        }
      } else if (collection === 'sentences' || collection === 'shortstories') {
        query.$or = [
          { text: { $regex: search, $options: 'i' } }
        ];

        if (collection === 'shortstories') {
          query.$or.push({ title: { $regex: search, $options: 'i' } });
          query.$or.push({ content: { $regex: search, $options: 'i' } });
        }
      }
    }

    // Fetch content options
    try {
      const options = await collectionObj.find(query)
        .limit(parseInt(limit, 10))
        .toArray();

      res.json({
        collection,
        totalItems: options.length,
        items: options
      });
    } catch (findError) {
      console.error(`Error finding content options in ${collection}:`, findError);
      return res.status(500).json({
        message: 'Error retrieving content options',
        error: findError.message
      });
    }
  } catch (error) {
    console.error('Error in getContentOptions:', error);
    res.status(500).json({
      message: 'Server error',
      error: error.message
    });
  }
};

module.exports = exports;