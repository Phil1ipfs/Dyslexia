// controllers/Teachers/ManageProgress/progressController.js
const mongoose = require('mongoose');

// Import models from their separate files
const CategoryResult = require('../../../models/Teachers/ManageProgress/categoryResultModel');
const PrescriptiveAnalysis = require('../../../models/Teachers/ManageProgress/prescriptiveAnalysisModel');
const InterventionPlan = require('../../../models/Teachers/ManageProgress/interventionPlanModel');
const InterventionProgress = require('../../../models/Teachers/ManageProgress/interventionProgressModel');
const InterventionResponse = require('../../../models/Teachers/ManageProgress/interventionResponseModel');
const StudentResponse = require('../../../models/Teachers/ManageProgress/studentResponseModel');

/**
 * Handles core functionality for the Manage Progress module
 * Includes student progress tracking and interventions management
 */
class ProgressController {

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

            // Get all students from the test database
            const userCollection = mongoose.connection.db.collection('users');

            // Query students with gradeLevel field
            const students = await userCollection.find({
                gradeLevel: { $exists: true }
            }).toArray();

            console.log(`Found ${students.length} students to initialize progress tracking for.`);

            // Initialize empty shells for each student
            await this.initializeStudentRecords(students);

            console.log('✅ ManageProgress module initialized successfully');
            return true;
        } catch (error) {
            console.error('Error initializing ManageProgress module:', error);
            return false;
        }
    }

    /**
     * Initialize empty records for each student across all collections
     * @param {Array} students List of student users
     */
    async initializeStudentRecords(students) {
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

            // If count > 0, show a sample document
            if (await categoryResultsCollection.countDocuments({}) > 0) {
                const sample = await categoryResultsCollection.findOne({});
                console.log(`Sample document: ${JSON.stringify(sample, null, 2).substring(0, 200)}...`);
            }

            // List all student IDs in category_results
            const allRecords = await categoryResultsCollection.find({}).toArray();
            console.log(`Student IDs in category_results: ${allRecords.map(r => r.studentId).join(', ')}`);
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

        // Standard question counts for each category based on main assessment
        const standardQuestionCounts = {
            'Alphabet Knowledge': 9,
            'Phonological Awareness': 5,
            'Word Recognition': 5,
            'Decoding': 5,
            'Reading Comprehension': 6
        };

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

                // 1. DIRECT DATABASE CHECK for category results
                try {
                    const categoryResultsCollection = mongoose.connection.db.collection('category_results');
                    const directCount = await categoryResultsCollection.countDocuments({ studentId });
                    console.log(`Direct DB check: Student ${studentId} has ${directCount} category results`);
                } catch (err) {
                    console.error(`Error in direct DB check: ${err}`);
                }

                // 2. Check and create/update CategoryResult with error handling
                try {

                    const categoryResultsCollection = mongoose.connection.db.collection('category_results');
                    const directCount = await categoryResultsCollection.countDocuments({ studentId });

                    const categoryResult = await CategoryResult.findOneAndUpdate(
                        { studentId },
                        {
                            $setOnInsert: {
                                studentId,
                                assessmentType: 'post-assessment',
                                categories: categories.map(categoryName => ({
                                    categoryName,
                                    totalQuestions: standardQuestionCounts[categoryName],
                                    correctAnswers: 0,
                                    score: 0,
                                    isPassed: false,
                                    passingThreshold: 75
                                })),
                                overallScore: 0,
                                allCategoriesPassed: false,
                                readingLevelUpdated: false
                            },
                            // Always update the reading level
                            readingLevel,
                            updatedAt: new Date()
                        },
                        {
                            upsert: true,
                            new: true,
                            setDefaultsOnInsert: true
                        }
                    );


                    const isNewRecord = directCount === 0;
                    if (isNewRecord) {
                        console.log(`✓ Created category result record for student ${studentId}: ${categoryResult._id}`);
                        recordsCreated++;
                        createdCategoryResults++;
                    } else {
                        console.log(`✓ Student ${studentId} already has category results: ${categoryResult._id}`);
                    }
                } catch (error) {
                    console.error(`Error checking/creating category results: ${error}`);
                }

                // 3. Check and create PrescriptiveAnalysis for each category
                for (const category of categories) {
                    try {
                        const existingAnalysisCount = await PrescriptiveAnalysis.countDocuments({
                            studentId,
                            categoryId: category
                        });

                        if (existingAnalysisCount === 0) {
                            // Create an empty prescriptive analysis
                            const analysis = await PrescriptiveAnalysis.create({
                                studentId,
                                categoryId: category,
                                readingLevel,
                                strengths: [],
                                weaknesses: [],
                                recommendations: []
                            });

                            console.log(`✓ Created ${category} analysis for student ${studentId}: ${analysis._id}`);
                            recordsCreated++;
                            createdAnalyses++;
                        } else {
                            // Update the reading level for existing analysis
                            const analysis = await PrescriptiveAnalysis.findOneAndUpdate(
                                { studentId, categoryId: category },
                                { readingLevel, updatedAt: new Date() },
                                { new: true }
                            );
                            console.log(`✓ Student ${studentId} already has ${category} analysis: ${analysis._id}`);
                        }
                    } catch (error) {
                        console.error(`Error managing ${category} analysis: ${error}`);
                    }
                }
                // 4. Check and create InterventionPlan if none exists
                try {
                    const existingPlanCount = await InterventionPlan.countDocuments({ studentId });

                    // Find existing prescriptive analysis for this student (most recent one)
                    const prescriptiveAnalysis = await PrescriptiveAnalysis.findOne({
                        studentId,
                        categoryId: 'Alphabet Knowledge' // Match the intervention category
                    });

                    // Find existing category result for this student (most recent one)
                    const categoryResult = await CategoryResult.findOne({ studentId }).sort({ createdAt: -1 });

                    let interventionPlan;
                    if (existingPlanCount === 0) {
                        interventionPlan = await InterventionPlan.create({
                            studentId,
                            prescriptiveAnalysisId: prescriptiveAnalysis ? prescriptiveAnalysis._id : null,
                            categoryResultId: categoryResult ? categoryResult._id : null,
                            name: `Letter Recognition for ${student.firstName}`,
                            category: 'Alphabet Knowledge', // Make sure this is explicitly set
                            description: 'A foundation plan to build letter recognition skills',
                            readingLevel: readingLevel,
                            passThreshold: 75, // Include pass threshold
                            questions: [], // Empty questions array
                            status: 'draft'
                        });

                        console.log(`✓ Created intervention plan for student ${studentId}: ${interventionPlan._id}`);
                        recordsCreated++;
                        createdPlans++;

                        // Try to add sample questions from main assessment
                        try {
                            const mainAssessmentCollection = mongoose.connection.db.collection('main_assessment');
                            const mainAssessment = await mainAssessmentCollection.findOne({
                                category: 'Alphabet Knowledge',
                                readingLevel: readingLevel || 'Low Emerging'
                            });

                            if (mainAssessment && mainAssessment.questions && mainAssessment.questions.length > 0) {
                                // Select up to 3 sample questions from main assessment
                                const sampleQuestions = mainAssessment.questions.slice(0, 3).map((q, index) => ({
                                    questionId: new mongoose.Types.ObjectId(),
                                    source: 'main_assessment',
                                    sourceQuestionId: mainAssessment._id,
                                    questionIndex: index,
                                    questionType: q.questionType || 'patinig',
                                    questionText: q.questionText || 'Sample question',
                                    questionImage: q.questionImage || null,
                                    questionValue: q.questionValue || null,
                                    choices: q.choices || []
                                }));

                                // Update the intervention with sample questions
                                await InterventionPlan.findByIdAndUpdate(
                                    interventionPlan._id,
                                    {
                                        questions: sampleQuestions,
                                        updatedAt: new Date()
                                    }
                                );

                                // Get the updated intervention with questions
                                interventionPlan = await InterventionPlan.findById(interventionPlan._id);
                            }
                        } catch (err) {
                            console.log('Could not add sample questions to intervention:', err.message);
                        }

                        const progress = await InterventionProgress.create({
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
                        });

                        console.log(`✓ Created intervention progress for student ${studentId}: ${progress._id}`);
                        recordsCreated++;
                        createdProgresses++;

                    } else {
                        // Get the existing plan
                        interventionPlan = await InterventionPlan.findOne({ studentId });
                        console.log(`✓ Student ${studentId} already has intervention plan: ${interventionPlan._id}`);

                        // Update the reading level and foreign keys if needed
                        const updateData = {};
                        if (interventionPlan.readingLevel !== readingLevel) {
                            updateData.readingLevel = readingLevel;
                        }

                        // Update prescriptive analysis reference if not set
                        if (!interventionPlan.prescriptiveAnalysisId && prescriptiveAnalysis) {
                            updateData.prescriptiveAnalysisId = prescriptiveAnalysis._id;
                        }

                        // Update category result reference if not set
                        if (!interventionPlan.categoryResultId && categoryResult) {
                            updateData.categoryResultId = categoryResult._id;
                        }

                        // Apply updates if needed
                        if (Object.keys(updateData).length > 0) {
                            updateData.updatedAt = new Date();
                            await InterventionPlan.updateOne(
                                { _id: interventionPlan._id },
                                updateData
                            );
                        }
                    }

                    // 5. Check and create InterventionProgress if none exists and if plan exists
                    if (interventionPlan) {
                        const existingProgressCount = await InterventionProgress.countDocuments({
                            interventionPlanId: interventionPlan._id
                        });

                        if (existingProgressCount === 0) {
                            // Create empty intervention progress
                            const progress = await InterventionProgress.create({
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
                            });

                            console.log(`✓ Created intervention progress for student ${studentId}: ${progress._id}`);
                            recordsCreated++;
                            createdProgresses++;
                        } else {
                            const progress = await InterventionProgress.findOne({
                                interventionPlanId: interventionPlan._id
                            });
                            console.log(`✓ Student ${studentId} already has intervention progress: ${progress._id}`);
                        }
                    }
                } catch (error) {
                    console.error(`Error managing intervention records: ${error}`);
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

            // List all student IDs in category_results after initialization
            const allRecords = await categoryResultsCollection.find({}).toArray();
            console.log(`Student IDs in category_results after initialization: ${allRecords.map(r => r.studentId).join(', ')}`);
        } catch (error) {
            console.error(`Error verifying record counts:`, error);
        }
    }

    /**
     * Get progress summary for all students
     */
    async getProgressSummary(req, res) {
        try {
            // Get students from database
            const userCollection = mongoose.connection.db.collection('users');

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

            // Use the users collection directly
            const userCollection = mongoose.connection.db.collection('users');

            // Check if student exists
            const student = await userCollection.findOne({ _id: new mongoose.Types.ObjectId(studentId) });
            if (!student) {
                return res.status(404).json({
                    success: false,
                    message: 'Student not found'
                });
            }

            // Get assessment results
            const assessmentResults = await CategoryResult.find({
                studentId: new mongoose.Types.ObjectId(studentId)
            }).sort({ assessmentDate: -1 });

            // Get prescriptive analysis
            const prescriptiveAnalysis = await PrescriptiveAnalysis.find({
                studentId: new mongoose.Types.ObjectId(studentId)
            });

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

            // Use the users collection directly
            const userCollection = mongoose.connection.db.collection('users');

            // Check if student exists
            const student = await userCollection.findOne({ _id: new mongoose.Types.ObjectId(studentId) });
            if (!student) {
                return res.status(404).json({
                    success: false,
                    message: 'Student not found'
                });
            }

            // Create new prescriptive analysis
            const newAnalysis = await PrescriptiveAnalysis.create({
                studentId: new mongoose.Types.ObjectId(studentId),
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

            // Use the users collection directly
            const userCollection = mongoose.connection.db.collection('users');

            // Check if student exists
            const student = await userCollection.findOne({ _id: new mongoose.Types.ObjectId(studentId) });
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
                studentId: new mongoose.Types.ObjectId(studentId),
                prescriptiveAnalysisId: prescriptiveAnalysisId ? new mongoose.Types.ObjectId(prescriptiveAnalysisId) : null,
                categoryResultId: categoryResultId ? new mongoose.Types.ObjectId(categoryResultId) : null,
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
                studentId: new mongoose.Types.ObjectId(studentId),
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

            // Get intervention plans
            const interventionPlans = await InterventionPlan.find({
                studentId: new mongoose.Types.ObjectId(studentId)
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

            // Record response
            const response = await InterventionResponse.create({
                studentId: new mongoose.Types.ObjectId(studentId),
                interventionPlanId: new mongoose.Types.ObjectId(interventionPlanId),
                questionId: new mongoose.Types.ObjectId(questionId),
                selectedChoice,
                isCorrect,
                responseTime,
                createdAt: Date.now()
            });

            // Update progress
            const interventionProgress = await InterventionProgress.findOne({
                interventionPlanId: new mongoose.Types.ObjectId(interventionPlanId)
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
                    { interventionPlanId: new mongoose.Types.ObjectId(interventionPlanId) },
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