// controllers/Teachers/ManageProgress/progressController.js
const mongoose = require('mongoose');

// Import models from their separate files
const CategoryResult = require('../../../models/Teachers/ManageProgress/categoryResultModel');
const PrescriptiveAnalysis = require('../../../models/Teachers/ManageProgress/prescriptiveAnalysisModel');
const InterventionPlan = require('../../../models/Teachers/ManageProgress/interventionPlanModel');
const InterventionAssessment = require('../../../models/Teachers/ManageProgress/interventionAssessmentModel');
const InterventionResults = require('../../../models/Teachers/ManageProgress/interventionResultsModel');
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

            // Initialize empty shells for each student - DISABLED AUTO-GENERATION
            // await this.initializeStudentRecords(students);

            console.log('✅ ManageProgress module initialized successfully');
            return true;
        } catch (error) {
            console.error('Error initializing ManageProgress module:', error);
            return false;
        }
    }

    /**
     * Initialize prescriptive analysis records for each student
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
        let createdAnalyses = 0;
        let skippedStudents = 0;

        // For each student, create/update prescriptive analysis records as needed
        for (const student of students) {
            try {
                const studentId = new mongoose.Types.ObjectId(student._id);
                
                // Skip students who were never assessed
                const readingLevel = student.readingLevel || 'Not Assessed';
                if (readingLevel === 'Not Assessed' || readingLevel === null || student.readingLevel === null) {
                    skippedStudents++;
                    console.log(`Skipping student ${studentId} with readingLevel: ${readingLevel}`);
                    continue;            // ▶️  do NOT create empty shells
                }
                
                let recordsCreated = 0;

                // Check and create PrescriptiveAnalysis for each category
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
                        }
                    } catch (error) {
                        console.error(`Error managing ${category} analysis: ${error}`);
                    }
                }

                // Log only if we created at least one record
                if (recordsCreated > 0) {
                    console.log(`Created ${recordsCreated} records for student: ${student.firstName} ${student.lastName}`);
                }
            } catch (error) {
                console.error(`Error processing student: ${error}`);
            }
        }

        // Log final statistics
        try {
            const prescriptiveAnalysisCount = await PrescriptiveAnalysis.countDocuments({});

            console.log("\n=== DATABASE VERIFICATION AFTER INITIALIZATION ===");
            console.log(`- Prescriptive Analysis: ${prescriptiveAnalysisCount} records (created: ${createdAnalyses})`);
            console.log(`- Skipped ${skippedStudents} students with 'Not Assessed' or null reading level`);
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

            if (
                student.readingLevel === 'Not Assessed' ||
                assessmentResults.length === 0
            ) {
                return res.status(200).json({
                    success: true,
                    data: null
                });
            }

            // Get prescriptive analysis (will be handled by separate API endpoint)
            let prescriptiveAnalyses = [];

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
                    prescriptiveAnalyses
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
     * Get prescriptive analyses for a student
     */
    async getStudentPrescriptiveAnalyses(req, res) {
        try {
            const { studentId } = req.params;

            // Convert studentId to number if it's a string (CLAUDE.md uses studentId as INT)
            const studentIdInt = parseInt(studentId);
            if (isNaN(studentIdInt)) {
                return res.status(400).json({
                    success: false,
                    message: 'Invalid student ID format'
                });
            }

            // Get prescriptive analyses from the database using the correct collection
            const prescriptiveAnalysisCollection = mongoose.connection.db.collection('prescriptive_analysis');

            // Query for prescriptive analyses for this student that have actual analysis data
            const analyses = await prescriptiveAnalysisCollection.find({
                studentId: studentIdInt,  // CLAUDE.md uses INT for studentId
                // Only return records that have the actual mathematical analysis data
                skillMastery: { $exists: true, $ne: null },
                errorPatterns: { $exists: true, $ne: null },
                interventionPlan: { $exists: true, $ne: null }
            }).sort({ createdAt: -1 }).toArray();

            if (!analyses || analyses.length === 0) {
                return res.status(200).json({
                    success: true,
                    message: 'No prescriptive analyses found for this student',
                    data: []
                });
            }

            // Return the real CLAUDE.md-compliant prescriptive analysis data
            console.log(`Found ${analyses.length} real prescriptive analyses for student ${studentIdInt}`);

            return res.status(200).json({
                success: true,
                data: analyses
            });
        } catch (error) {
            console.error('Error getting student prescriptive analyses:', error);
            return res.status(500).json({
                success: false,
                message: 'Failed to retrieve prescriptive analyses',
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

            // Initialize results tracking
            await InterventionResults.create({
                studentId: new mongoose.Types.ObjectId(studentId),
                interventionPlanId: newPlan._id,
                revisionNumber: 1, // Default for InterventionPlan-based results
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
     * Get all intervention assessments for a student (updated for new CLAUDE.md system)
     */
    async getStudentInterventions(req, res) {
        try {
            const { studentId } = req.params;
            console.log(`[PROGRESS CONTROLLER] Fetching interventions for student: ${studentId}`);

            // Convert to integer for studentId (intervention_assessment uses integer studentId)
            const studentIdInt = parseInt(studentId);
            if (isNaN(studentIdInt)) {
                return res.status(400).json({
                    success: false,
                    message: 'Invalid student ID format - must be integer'
                });
            }

            // Get intervention assessments from the new system (CLAUDE.md compliant)
            const interventionAssessments = await InterventionAssessment.find({
                studentId: studentIdInt
            }).sort({ createdAt: -1 });

            console.log(`[PROGRESS CONTROLLER] Found ${interventionAssessments.length} intervention assessments`);

            // Get intervention results for each assessment
            const interventionsWithResults = await Promise.all(
                interventionAssessments.map(async (assessment) => {
                    const results = await InterventionResults.findOne({
                        interventionAssessmentId: assessment._id
                    });

                    const assessmentObj = assessment.toObject();

                    return {
                        ...assessmentObj,
                        progress: results ? {
                            percentComplete: results.percentComplete || 0,
                            percentCorrect: results.percentCorrect || 0,
                            passedThreshold: results.isPassed || false,
                            score: results.score || 0,
                            completedAt: results.completedAt,
                            results: results.toObject()
                        } : null
                    };
                })
            );

            console.log(`[PROGRESS CONTROLLER] Returning ${interventionsWithResults.length} interventions with progress data`);

            return res.status(200).json({
                success: true,
                data: interventionsWithResults
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

            // Get results
            const progress = await InterventionResults.findOne({
                interventionPlanId: interventionId
            });

            return res.status(200).json({
                success: true,
                data: {
                    intervention,
                    progress
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
     * Update intervention results
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

            // Get current results or create a new one if it doesn't exist
            let progress = await InterventionResults.findOne({
                interventionPlanId: interventionId
            });

            if (!progress) {
                // Create a new results record if it doesn't exist
                progress = await InterventionResults.create({
                    studentId: intervention.studentId,
                    interventionPlanId: interventionId,
                    revisionNumber: 1, // Default for InterventionPlan-based results
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

            // Update results
            const totalActivities = intervention.questions.length;
            const percentComplete = (completedActivities / totalActivities) * 100;
            const totalAnswers = correctAnswers + incorrectAnswers;
            const percentCorrect = totalAnswers > 0 ? (correctAnswers / totalAnswers) * 100 : 0;
            const passedThreshold = percentCorrect >= (intervention.passThreshold || 75);

            progress = await InterventionResults.findOneAndUpdate(
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
}

module.exports = new ProgressController();