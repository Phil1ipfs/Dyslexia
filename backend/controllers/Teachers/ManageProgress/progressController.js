// controllers/Teachers/ManageProgress/progressController.js
const mongoose = require('mongoose');

/**
 * Handles core functionality for the Manage Progress module
 * Includes student progress tracking and interventions management
 */
class ProgressController {

    /**
     * Initialize collections and create empty shells for each student
     * @returns {Promise<boolean>} Success status
     */
    // controllers/Teachers/ManageProgress/progressController.js

    /**
     * Initialize collections and create empty shells for each student
     * @returns {Promise<boolean>} Success status
     */
    async initializeCollections() {
        try {
            // Check if database is connected
            if (mongoose.connection.readyState !== 1) {
                console.warn('⚠️ Database not connected. ManageProgress module initialization skipped.');
                return false;
            }

            console.log('🔄 Initializing ManageProgress module...');

            // Define schemas with proper relationships
            const schemas = this.defineSchemas();

            // Register models if they don't exist already
            const models = this.registerModels(schemas);

            // Get all students from the test database
            const testDB = mongoose.connection.useDb('test');
            const userCollection = testDB.collection('users');

            // Query students with gradeLevel field
            const students = await userCollection.find({
                gradeLevel: { $exists: true }
            }).toArray();

            console.log(`Found ${students.length} students to initialize progress tracking for.`);

            // Initialize records for each student
            await this.initializeStudentRecords(students, models);

            console.log('✅ ManageProgress module initialized successfully');
            return true;
        } catch (error) {
            console.error('Error initializing ManageProgress module:', error);
            return false;
        }
    }

    async initializeStudentRecords(students, models) {
        // Extract models
        const { 
          CategoryResult, 
          PrescriptiveAnalysis, 
          InterventionPlan, 
          InterventionProgress 
        } = models;
        
        // First, let's explicitly check what's in the database
        console.log("\n=== DATABASE VERIFICATION BEFORE INITIALIZATION ===");
        const dbName = mongoose.connection.db.databaseName;
        console.log(`Connected to database: ${dbName}`);
        
        // List all collections
        const collections = await mongoose.connection.db.listCollections().toArray();
        console.log("Available collections:");
        collections.forEach(c => console.log(`- ${c.name}`));
        
        // Check all collections
        try {
          const categoryResultsCollection = mongoose.connection.db.collection('category_results');
          const prescriptiveAnalysisCollection = mongoose.connection.db.collection('prescriptive_analysis');
          const interventionPlanCollection = mongoose.connection.db.collection('intervention_assessment');
          const interventionProgressCollection = mongoose.connection.db.collection('intervention_progress');
          
          console.log(`Direct collection check: 'category_results' has ${await categoryResultsCollection.countDocuments({})} documents`);
          console.log(`Direct collection check: 'prescriptive_analysis' has ${await prescriptiveAnalysisCollection.countDocuments({})} documents`);
          console.log(`Direct collection check: 'intervention_assessment' has ${await interventionPlanCollection.countDocuments({})} documents`);
          console.log(`Direct collection check: 'intervention_progress' has ${await interventionProgressCollection.countDocuments({})} documents`);
        } catch (error) {
          console.error(`Error checking collections: ${error}`);
        }
        
        // Categories for analysis
        const categories = [
          'Alphabet Knowledge',
          'Phonological Awareness', 
          'Word Recognition', 
          'Decoding', 
          'Reading Comprehension'
        ];
      
        console.log(`\nStarting initialization for ${students.length} students...`);
        
        // Track created records for verification
        let createdCategoryResults = 0;
        let createdAnalyses = 0;
        let createdPlans = 0;
        let createdProgresses = 0;
      
        // For each student, create/update records as needed
        for (const student of students) {
          console.log(`\nInitializing progress tracking for student: ${student.firstName} ${student.lastName} (${student._id})`);
      
          try {
            const studentId = new mongoose.Types.ObjectId(student._id);
            const readingLevel = student.readingLevel || 'Low Emerging';
            let recordsCreated = 0;
               try {
              const categoryResult = await CategoryResult.findOneAndUpdate(
                { studentId },
                { 
                  $setOnInsert: { 
                    studentId,
                    assessmentType: 'post-assessment',
                    categories: categories.map(categoryName => ({
                      categoryName,
                      totalQuestions: 0,
                      correctAnswers: 0,
                      score: 0,
                      isPassed: false,
                      passingThreshold: 75
                    })),
                    overallScore: 0,
                    allCategoriesPassed: false,
                    readingLevelUpdated: false
                  },
                  readingLevel,
                  updatedAt: new Date()
                },
                { 
                  upsert: true, 
                  new: true, 
                  setDefaultsOnInsert: true 
                }
              );
              
              if (categoryResult.__v === 0) { 
                console.log(`✓ Created category result record for student ${studentId}: ${categoryResult._id}`);
                recordsCreated++;
                createdCategoryResults++;
              } else {
                console.log(`✓ Student ${studentId} already has category results: ${categoryResult._id}`);
              }
            } catch (error) {
              console.error(`Error checking/creating category results: ${error}`);
            }
                  for (const category of categories) {
              try {
                const analysis = await PrescriptiveAnalysis.findOneAndUpdate(
                  { 
                    studentId,
                    categoryId: category
                  },
                  {
                    $setOnInsert: {
                      studentId,
                      categoryId: category,
                      strengths: [],
                      weaknesses: [],
                      recommendations: []
                    },
                    // Always update reading level
                    readingLevel,
                    updatedAt: new Date()
                  },
                  { 
                    upsert: true,
                    new: true,
                    setDefaultsOnInsert: true
                  }
                );
                
                if (analysis.__v === 0) {
                  console.log(`✓ Created ${category} analysis for student ${studentId}: ${analysis._id}`);
                  recordsCreated++;
                  createdAnalyses++;
                } else {
                  console.log(`✓ Student ${studentId} already has ${category} analysis: ${analysis._id}`);
                }
              } catch (error) {
                console.error(`Error checking/creating ${category} analysis: ${error}`);
              }
            }
            
            // 3. Check and create/update InterventionPlan
            try {
              // Using findOneAndUpdate with upsert
              const interventionPlan = await InterventionPlan.findOneAndUpdate(
                { studentId },
                {
                  $setOnInsert: {
                    studentId,
                    name: `Intervention Plan for ${student.firstName}`,
                    category: '',
                    description: '',
                    questions: [],
                    status: 'active'
                  },
                  // Always update reading level
                  readingLevel,
                  updatedAt: new Date()
                },
                { 
                  upsert: true,
                  new: true,
                  setDefaultsOnInsert: true
                }
              );
              
              if (interventionPlan.__v === 0) {
                console.log(`✓ Created intervention plan for student ${studentId}: ${interventionPlan._id}`);
                recordsCreated++;
                createdPlans++;
              } else {
                console.log(`✓ Student ${studentId} already has intervention plan: ${interventionPlan._id}`);
              }
                            try {
                // Using findOneAndUpdate with upsert
                const progress = await InterventionProgress.findOneAndUpdate(
                  { 
                    studentId,
                    interventionPlanId: interventionPlan._id
                  },
                  {
                    $setOnInsert: {
                      studentId,
                      interventionPlanId: interventionPlan._id,
                      completedActivities: 0,
                      totalActivities: interventionPlan.questions ? interventionPlan.questions.length : 0,
                      percentComplete: 0,
                      correctAnswers: 0,
                      incorrectAnswers: 0,
                      percentCorrect: 0,
                      passedThreshold: false,
                      notes: 'Default progress record'
                    },
                    updatedAt: new Date()
                  },
                  { 
                    upsert: true,
                    new: true,
                    setDefaultsOnInsert: true
                  }
                );
                
                if (progress.__v === 0) {
                  console.log(`✓ Created intervention progress for student ${studentId}: ${progress._id}`);
                  recordsCreated++;
                  createdProgresses++;
                } else {
                  console.log(`✓ Student ${studentId} already has intervention progress: ${progress._id}`);
                }
              } catch (error) {
                console.error(`Error checking/creating intervention progress: ${error}`);
              }
            } catch (error) {
              console.error(`Error checking/creating intervention plan: ${error}`);
            }
            
            if (recordsCreated > 0) {
              console.log(`Created ${recordsCreated} new records for student ${student.firstName} ${student.lastName}`);
            } else {
              console.log(`No new records needed for student ${student.firstName} ${student.lastName}`);
            }
          } catch (error) {
            console.error(`Error initializing records for student ${student._id}:`, error);
          }
        }
        
        // After initializing all students, verify the totals with direct collection checks
        console.log("\n=== DATABASE VERIFICATION AFTER INITIALIZATION ===");
        
        try {
          const categoryResultsCollection = mongoose.connection.db.collection('category_results');
          const prescriptiveAnalysisCollection = mongoose.connection.db.collection('prescriptive_analysis');
          const interventionPlanCollection = mongoose.connection.db.collection('intervention_assessment');
          const interventionProgressCollection = mongoose.connection.db.collection('intervention_progress');
          
          const categoryResultCount = await categoryResultsCollection.countDocuments({});
          const prescriptiveAnalysisCount = await prescriptiveAnalysisCollection.countDocuments({});
          const interventionPlanCount = await interventionPlanCollection.countDocuments({});
          const interventionProgressCount = await interventionProgressCollection.countDocuments({});
          
          console.log(`Direct collection counts after initialization:`);
          console.log(`- Category Results: ${categoryResultCount} records (created: ${createdCategoryResults})`);
          console.log(`- Prescriptive Analyses: ${prescriptiveAnalysisCount} records (created: ${createdAnalyses})`);
          console.log(`- Intervention Plans: ${interventionPlanCount} records (created: ${createdPlans})`);
          console.log(`- Intervention Progress: ${interventionProgressCount} records (created: ${createdProgresses})`);
        } catch (error) {
          console.error(`Error verifying record counts:`, error);
        }
      }

    /**
   * Define schemas for all collections
   * @returns {Object} Collection of schemas
   */
    defineSchemas() {
        const categoryResultSchema = new mongoose.Schema({
            studentId: {
                type: mongoose.Schema.Types.ObjectId,
                ref: 'User',
                required: true
            },
            assessmentType: {
                type: String,
                enum: ['post-assessment', 'intervention'],
                default: 'post-assessment'
            },
            readingLevel: {
                type: String,
                default: 'Low Emerging'
            },
            assessmentDate: {
                type: Date,
                default: Date.now
            },
            categories: [{
                categoryName: {
                    type: String,
                    enum: ['Alphabet Knowledge', 'Phonological Awareness', 'Word Recognition', 'Decoding', 'Reading Comprehension']
                },
                totalQuestions: {
                    type: Number,
                    default: 0
                },
                correctAnswers: {
                    type: Number,
                    default: 0
                },
                score: {
                    type: Number,
                    default: 0
                },
                isPassed: {
                    type: Boolean,
                    default: false
                },
                passingThreshold: {
                    type: Number,
                    default: 75
                }
            }],
            overallScore: {
                type: Number,
                default: 0
            },
            allCategoriesPassed: {
                type: Boolean,
                default: false
            },
            readingLevelUpdated: {
                type: Boolean,
                default: false
            }
        }, { collection: 'category_results', timestamps: true });

        const prescriptiveAnalysisSchema = new mongoose.Schema({
            studentId: {
                type: mongoose.Schema.Types.ObjectId,
                ref: 'User',
                required: true
            },
            categoryId: {
                type: String,
                required: true
            },
            readingLevel: {
                type: String,
                required: true
            },
            strengths: [{
                type: String
            }],
            weaknesses: [{
                type: String
            }],
            recommendations: [{
                type: String
            }],
            createdBy: {
                type: mongoose.Schema.Types.ObjectId,
                ref: 'User'
            }
        }, { collection: 'prescriptive_analysis', timestamps: true });

        const interventionPlanSchema = new mongoose.Schema({
            studentId: {
                type: mongoose.Schema.Types.ObjectId,
                ref: 'User',
                required: true
            },
            prescriptiveAnalysisId: {
                type: mongoose.Schema.Types.ObjectId,
                ref: 'PrescriptiveAnalysis'
            },
            categoryResultId: {
                type: mongoose.Schema.Types.ObjectId,
                ref: 'CategoryResult'
            },
            name: {
                type: String,
                required: true
            },
            category: {
                type: String,
                required: true,
                enum: ['Alphabet Knowledge', 'Phonological Awareness', 'Word Recognition', 'Decoding', 'Reading Comprehension']
            },
            description: {
                type: String
            },
            readingLevel: {
                type: String,
                required: true
            },
            passThreshold: {
                type: Number,
                default: 75
            },
            questions: [{
                questionId: mongoose.Schema.Types.ObjectId,
                source: {
                    type: String,
                    enum: ['main_assessment', 'template'],
                    required: true
                },
                sourceQuestionId: mongoose.Schema.Types.ObjectId,
                templateId: mongoose.Schema.Types.ObjectId,
                questionIndex: Number,
                questionType: {
                    type: String,
                    required: true
                },
                questionText: {
                    type: String,
                    required: true
                },
                questionImage: String,
                questionValue: String,
                choices: [{
                    choiceText: String,
                    choiceImage: String,
                    isCorrect: Boolean
                }]
            }],
            status: {
                type: String,
                enum: ['draft', 'active', 'completed', 'archived'],
                default: 'draft'
            },
            createdBy: {
                type: mongoose.Schema.Types.ObjectId,
                ref: 'User'
            }
        }, { collection: 'intervention_assessment', timestamps: true });

        const interventionProgressSchema = new mongoose.Schema({
            studentId: {
                type: mongoose.Schema.Types.ObjectId,
                ref: 'User',
                required: true
            },
            interventionPlanId: {
                type: mongoose.Schema.Types.ObjectId,
                ref: 'InterventionPlan',
                required: true
            },
            completedActivities: {
                type: Number,
                default: 0
            },
            totalActivities: {
                type: Number,
                default: 0
            },
            percentComplete: {
                type: Number,
                default: 0
            },
            correctAnswers: {
                type: Number,
                default: 0
            },
            incorrectAnswers: {
                type: Number,
                default: 0
            },
            percentCorrect: {
                type: Number,
                default: 0
            },
            passedThreshold: {
                type: Boolean,
                default: false
            },
            lastActivity: {
                type: Date
            },
            notes: {
                type: String
            }
        }, { collection: 'intervention_progress', timestamps: true });

        return {
            categoryResultSchema,
            prescriptiveAnalysisSchema,
            interventionPlanSchema,
            interventionProgressSchema
        };
    }


    /**
     * Register models for all schemas
     * @param {Object} schemas Collection of schemas
     * @returns {Object} Collection of models
     */
    registerModels(schemas) {
        // Create or retrieve existing models
        const CategoryResult = mongoose.models.CategoryResult ||
            mongoose.model('CategoryResult', schemas.categoryResultSchema);

        const PrescriptiveAnalysis = mongoose.models.PrescriptiveAnalysis ||
            mongoose.model('PrescriptiveAnalysis', schemas.prescriptiveAnalysisSchema);

        const InterventionPlan = mongoose.models.InterventionPlan ||
            mongoose.model('InterventionPlan', schemas.interventionPlanSchema);

        const InterventionProgress = mongoose.models.InterventionProgress ||
            mongoose.model('InterventionProgress', schemas.interventionProgressSchema);

        return {
            CategoryResult,
            PrescriptiveAnalysis,
            InterventionPlan,
            InterventionProgress
        };
    }

    /**
     * Get progress summary for all students
     */
    // In the getProgressSummary method:
    async getProgressSummary(req, res) {
        try {
            // Access models
            const CategoryResult = mongoose.model('CategoryResult');
            const InterventionPlan = mongoose.model('InterventionPlan');

            // Get students from test database
            const testDB = mongoose.connection.useDb('test');
            const userCollection = testDB.collection('users');

            // Find all students
            const students = await userCollection.find({
                gradeLevel: { $exists: true }
            }).toArray();

            if (!students || students.length === 0) {
                return res.status(200).json({
                    success: true,
                    message: 'No students found',
                    data: []
                });
            }

            // Get the most recent assessment result for each student
            const studentProgress = await Promise.all(
                students.map(async (student) => {
                    const studentId = new mongoose.Types.ObjectId(student._id);
                    const latestAssessment = await CategoryResult.findOne({
                        studentId
                    }).sort({ assessmentDate: -1 }).limit(1);

                    // Get intervention plans for student
                    const activeInterventions = await InterventionPlan.find({
                        studentId,
                        status: 'active'
                    }).countDocuments();

                    return {
                        studentId: student._id,
                        name: `${student.firstName} ${student.lastName}`,
                        readingLevel: student.readingLevel || 'Not Assessed',
                        assessmentComplete: student.preAssessmentCompleted,
                        lastAssessmentDate: student.lastAssessmentDate,
                        lastScore: latestAssessment ? latestAssessment.overallScore : null,
                        allCategoriesPassed: latestAssessment ? latestAssessment.allCategoriesPassed : false,
                        activeInterventions: activeInterventions
                    };
                })
            );

            return res.status(200).json({
                success: true,
                data: studentProgress
            });
        } catch (error) {
            console.error('Error getting progress summary:', error);
            return res.status(500).json({
                success: false,
                message: 'Failed to retrieve progress summary',
                error: error.message
            });
        }
    }

    /**
     * Get detailed assessment results for a specific student
     */
    async getStudentAssessmentDetails(req, res) {
        try {
            const { studentId } = req.params;

            if (!mongoose.Types.ObjectId.isValid(studentId)) {
                return res.status(400).json({
                    success: false,
                    message: 'Invalid student ID format'
                });
            }

            // Access models
            const CategoryResult = mongoose.model('CategoryResult');
            const PrescriptiveAnalysis = mongoose.model('PrescriptiveAnalysis');
            const User = mongoose.model('User');


            // Get students from test database
            const testDB = mongoose.connection.useDb('test');
            const userCollection = testDB.collection('users');

            // Check if student exists
            const student = await User.findById(studentId);
            if (!student) {
                return res.status(404).json({
                    success: false,
                    message: 'Student not found'
                });
            }

            // Get assessment results
            const assessmentResults = await CategoryResult.find({
                studentId
            }).sort({ assessmentDate: -1 });

            // Get prescriptive analysis
            const prescriptiveAnalysis = await PrescriptiveAnalysis.find({ studentId });

            return res.status(200).json({
                success: true,
                data: {
                    student: {
                        id: student._id,
                        name: `${student.firstName} ${student.lastName}`,
                        readingLevel: student.readingLevel || 'Not Assessed',
                        gradeLevel: student.gradeLevel
                    },
                    assessmentResults,
                    prescriptiveAnalysis
                }
            });
        } catch (error) {
            console.error('Error getting student assessment details:', error);
            return res.status(500).json({
                success: false,
                message: 'Failed to retrieve student assessment details',
                error: error.message
            });
        }
    }

    /**
     * Get detailed response data for a specific assessment
     */
    async getAssessmentResponses(req, res) {
        try {
            const { assessmentId } = req.params;

            if (!mongoose.Types.ObjectId.isValid(assessmentId)) {
                return res.status(400).json({
                    success: false,
                    message: 'Invalid assessment ID format'
                });
            }

            // Access models
            const CategoryResult = mongoose.model('CategoryResult');
            const StudentResponse = mongoose.model('StudentResponse');

            // Get the assessment
            const assessment = await CategoryResult.findById(assessmentId);
            if (!assessment) {
                return res.status(404).json({
                    success: false,
                    message: 'Assessment not found'
                });
            }

            // Get student responses for this assessment
            const responses = await StudentResponse.find({
                categoryResultId: assessmentId
            }).sort({ answeredAt: 1 });

            return res.status(200).json({
                success: true,
                data: {
                    assessment,
                    responses
                }
            });
        } catch (error) {
            console.error('Error getting assessment responses:', error);
            return res.status(500).json({
                success: false,
                message: 'Failed to retrieve assessment responses',
                error: error.message
            });
        }
    }

    /**
     * Create a new prescriptive analysis for a student
     */
    async createPrescriptiveAnalysis(req, res) {
        try {
            const { studentId, categoryId, readingLevel, strengths, weaknesses, recommendations } = req.body;

            if (!mongoose.Types.ObjectId.isValid(studentId)) {
                return res.status(400).json({
                    success: false,
                    message: 'Invalid student ID format'
                });
            }

            // Access models
            const PrescriptiveAnalysis = mongoose.model('PrescriptiveAnalysis');
            const User = mongoose.model('User');

            // Check if student exists
            const student = await User.findById(studentId);
            if (!student) {
                return res.status(404).json({
                    success: false,
                    message: 'Student not found'
                });
            }

            // Create new prescriptive analysis
            const newAnalysis = await PrescriptiveAnalysis.create({
                studentId,
                categoryId,
                readingLevel,
                strengths: strengths || [],
                weaknesses: weaknesses || [],
                recommendations: recommendations || [],
                createdBy: req.user ? req.user.id : null
            });

            return res.status(201).json({
                success: true,
                data: newAnalysis
            });
        } catch (error) {
            console.error('Error creating prescriptive analysis:', error);
            return res.status(500).json({
                success: false,
                message: 'Failed to create prescriptive analysis',
                error: error.message
            });
        }
    }

    /**
     * Update an existing prescriptive analysis
     */
    async updatePrescriptiveAnalysis(req, res) {
        try {
            const { analysisId } = req.params;
            const { strengths, weaknesses, recommendations } = req.body;

            if (!mongoose.Types.ObjectId.isValid(analysisId)) {
                return res.status(400).json({
                    success: false,
                    message: 'Invalid analysis ID format'
                });
            }

            // Access model
            const PrescriptiveAnalysis = mongoose.model('PrescriptiveAnalysis');

            // Update the analysis
            const updatedAnalysis = await PrescriptiveAnalysis.findByIdAndUpdate(
                analysisId,
                {
                    strengths,
                    weaknesses,
                    recommendations,
                    updatedAt: Date.now()
                },
                { new: true, runValidators: true }
            );

            if (!updatedAnalysis) {
                return res.status(404).json({
                    success: false,
                    message: 'Prescriptive analysis not found'
                });
            }

            return res.status(200).json({
                success: true,
                data: updatedAnalysis
            });
        } catch (error) {
            console.error('Error updating prescriptive analysis:', error);
            return res.status(500).json({
                success: false,
                message: 'Failed to update prescriptive analysis',
                error: error.message
            });
        }
    }

    /**
     * Create a new intervention plan for a student
     */
    async createInterventionPlan(req, res) {
        try {
            const {
                studentId,
                prescriptiveAnalysisId,
                categoryResultId,
                name,
                category,
                description,
                readingLevel,
                passThreshold,
                questions
            } = req.body;

            if (!mongoose.Types.ObjectId.isValid(studentId)) {
                return res.status(400).json({
                    success: false,
                    message: 'Invalid student ID format'
                });
            }

            // Access models
            const InterventionPlan = mongoose.model('InterventionPlan');
            const InterventionProgress = mongoose.model('InterventionProgress');
            const User = mongoose.model('User');

            // Check if student exists
            const student = await User.findById(studentId);
            if (!student) {
                return res.status(404).json({
                    success: false,
                    message: 'Student not found'
                });
            }

            // Set default questions if none provided
            const interventionQuestions = questions || [];

            // Create new intervention plan
            const newPlan = await InterventionPlan.create({
                studentId,
                prescriptiveAnalysisId: prescriptiveAnalysisId || null,
                categoryResultId: categoryResultId || null,
                name,
                category,
                description: description || '',
                readingLevel,
                passThreshold: passThreshold || 75,
                questions: interventionQuestions,
                status: 'active',
                createdBy: req.user ? req.user.id : null
            });

            // Initialize progress tracking
            await InterventionProgress.create({
                studentId,
                interventionPlanId: newPlan._id,
                completedActivities: 0,
                totalActivities: interventionQuestions.length,
                percentComplete: 0,
                correctAnswers: 0,
                incorrectAnswers: 0,
                percentCorrect: 0,
                passedThreshold: false
            });

            return res.status(201).json({
                success: true,
                data: newPlan
            });
        } catch (error) {
            console.error('Error creating intervention plan:', error);
            return res.status(500).json({
                success: false,
                message: 'Failed to create intervention plan',
                error: error.message
            });
        }
    }

    /**
     * Get all intervention plans for a student
     */
    async getStudentInterventions(req, res) {
        try {
            const { studentId } = req.params;

            if (!mongoose.Types.ObjectId.isValid(studentId)) {
                return res.status(400).json({
                    success: false,
                    message: 'Invalid student ID format'
                });
            }

            // Access models
            const InterventionPlan = mongoose.model('InterventionPlan');
            const InterventionProgress = mongoose.model('InterventionProgress');

            // Get intervention plans
            const interventionPlans = await InterventionPlan.find({
                studentId
            }).sort({ createdAt: -1 });

            // Get progress for each plan
            const interventionsWithProgress = await Promise.all(
                interventionPlans.map(async (plan) => {
                    const progress = await InterventionProgress.findOne({
                        interventionPlanId: plan._id
                    });

                    return {
                        ...plan.toObject(),
                        progress: progress ? progress.toObject() : null
                    };
                })
            );

            return res.status(200).json({
                success: true,
                data: interventionsWithProgress
            });
        } catch (error) {
            console.error('Error getting student interventions:', error);
            return res.status(500).json({
                success: false,
                message: 'Failed to retrieve student interventions',
                error: error.message
            });
        }
    }

    /**
     * Get details of a specific intervention plan
     */
    async getInterventionDetails(req, res) {
        try {
            const { interventionId } = req.params;

            if (!mongoose.Types.ObjectId.isValid(interventionId)) {
                return res.status(400).json({
                    success: false,
                    message: 'Invalid intervention ID format'
                });
            }

            // Access models
            const InterventionPlan = mongoose.model('InterventionPlan');
            const InterventionProgress = mongoose.model('InterventionProgress');
            const InterventionResponse = mongoose.model('InterventionResponse');

            // Get intervention plan
            const intervention = await InterventionPlan.findById(interventionId);
            if (!intervention) {
                return res.status(404).json({
                    success: false,
                    message: 'Intervention plan not found'
                });
            }

            // Get progress
            const progress = await InterventionProgress.findOne({
                interventionPlanId: interventionId
            });

            // Get student responses
            const responses = await InterventionResponse.find({
                interventionPlanId: interventionId
            }).sort({ createdAt: 1 });

            return res.status(200).json({
                success: true,
                data: {
                    intervention,
                    progress,
                    responses
                }
            });
        } catch (error) {
            console.error('Error getting intervention details:', error);
            return res.status(500).json({
                success: false,
                message: 'Failed to retrieve intervention details',
                error: error.message
            });
        }
    }

    /**
     * Update intervention progress
     */
    async updateInterventionProgress(req, res) {
        try {
            const { interventionId } = req.params;
            const { completedActivities, correctAnswers, incorrectAnswers, notes } = req.body;

            if (!mongoose.Types.ObjectId.isValid(interventionId)) {
                return res.status(400).json({
                    success: false,
                    message: 'Invalid intervention ID format'
                });
            }

            // Access models
            const InterventionPlan = mongoose.model('InterventionPlan');
            const InterventionProgress = mongoose.model('InterventionProgress');

            // Get intervention plan
            const intervention = await InterventionPlan.findById(interventionId);
            if (!intervention) {
                return res.status(404).json({
                    success: false,
                    message: 'Intervention plan not found'
                });
            }

            // Get current progress or create a new one if it doesn't exist
            let progress = await InterventionProgress.findOne({
                interventionPlanId: interventionId
            });

            if (!progress) {
                // Create a new progress record if it doesn't exist
                progress = await InterventionProgress.create({
                    studentId: intervention.studentId,
                    interventionPlanId: interventionId,
                    completedActivities: 0,
                    totalActivities: intervention.questions.length,
                    percentComplete: 0,
                    correctAnswers: 0,
                    incorrectAnswers: 0,
                    percentCorrect: 0,
                    passedThreshold: false,
                    lastActivity: Date.now()
                });
            }

            // Update progress
            const totalActivities = intervention.questions.length;
            const percentComplete = (completedActivities / totalActivities) * 100;
            const totalAnswers = correctAnswers + incorrectAnswers;
            const percentCorrect = totalAnswers > 0 ? (correctAnswers / totalAnswers) * 100 : 0;
            const passedThreshold = percentCorrect >= (intervention.passThreshold || 75);

            progress = await InterventionProgress.findOneAndUpdate(
                { interventionPlanId: interventionId },
                {
                    completedActivities,
                    totalActivities,
                    percentComplete,
                    correctAnswers,
                    incorrectAnswers,
                    percentCorrect,
                    passedThreshold,
                    lastActivity: Date.now(),
                    notes,
                    updatedAt: Date.now()
                },
                { new: true, runValidators: true }
            );

            // If intervention is complete, update its status
            if (percentComplete === 100) {
                await InterventionPlan.findByIdAndUpdate(
                    interventionId,
                    {
                        status: 'completed',
                        updatedAt: Date.now()
                    }
                );
            }

            return res.status(200).json({
                success: true,
                data: progress
            });
        } catch (error) {
            console.error('Error updating intervention progress:', error);
            return res.status(500).json({
                success: false,
                message: 'Failed to update intervention progress',
                error: error.message
            });
        }
    }

    /**
     * Record a student's response to an intervention question
     */
    async recordInterventionResponse(req, res) {
        try {
            const { studentId, interventionPlanId, questionId, selectedChoice, isCorrect, responseTime } = req.body;

            // Validate ObjectId fields
            if (!mongoose.Types.ObjectId.isValid(studentId) ||
                !mongoose.Types.ObjectId.isValid(interventionPlanId) ||
                !mongoose.Types.ObjectId.isValid(questionId)) {
                return res.status(400).json({
                    success: false,
                    message: 'Invalid ID format in request'
                });
            }

            // Access models
            const InterventionResponse = mongoose.model('InterventionResponse');
            const InterventionProgress = mongoose.model('InterventionProgress');
            const InterventionPlan = mongoose.model('InterventionPlan');

            // Record response
            const response = await InterventionResponse.create({
                studentId,
                interventionPlanId,
                questionId,
                selectedChoice,
                isCorrect,
                responseTime,
                createdAt: Date.now()
            });

            // Update progress
            const interventionProgress = await InterventionProgress.findOne({
                interventionPlanId
            });

            if (interventionProgress) {
                // Calculate new values
                const completedActivities = interventionProgress.completedActivities + 1;
                const correctAnswers = isCorrect
                    ? interventionProgress.correctAnswers + 1
                    : interventionProgress.correctAnswers;
                const incorrectAnswers = !isCorrect
                    ? interventionProgress.incorrectAnswers + 1
                    : interventionProgress.incorrectAnswers;

                // Get the intervention to check total activities
                const intervention = await InterventionPlan.findById(interventionPlanId);
                const totalActivities = intervention ? intervention.questions.length : 0;

                // Calculate percentages
                const percentComplete = totalActivities > 0
                    ? (completedActivities / totalActivities) * 100
                    : 0;
                const totalAnswers = correctAnswers + incorrectAnswers;
                const percentCorrect = totalAnswers > 0
                    ? (correctAnswers / totalAnswers) * 100
                    : 0;
                const passedThreshold = percentCorrect >= (intervention.passThreshold || 75);

                // Update progress
                await InterventionProgress.findOneAndUpdate(
                    { interventionPlanId },
                    {
                        completedActivities,
                        totalActivities,
                        percentComplete,
                        correctAnswers,
                        incorrectAnswers,
                        percentCorrect,
                        passedThreshold,
                        lastActivity: Date.now(),
                        updatedAt: Date.now()
                    }
                );

                // If intervention is complete, update its status
                if (percentComplete === 100) {
                    await InterventionPlan.findByIdAndUpdate(
                        interventionPlanId,
                        {
                            status: 'completed',
                            updatedAt: Date.now()
                        }
                    );
                }
            }

            return res.status(201).json({
                success: true,
                data: response
            });
        } catch (error) {
            console.error('Error recording intervention response:', error);
            return res.status(500).json({
                success: false,
                message: 'Failed to record intervention response',
                error: error.message
            });
        }
    }
}

module.exports = new ProgressController();

