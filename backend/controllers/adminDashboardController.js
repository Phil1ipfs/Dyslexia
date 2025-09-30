const mongoose = require('mongoose');
const AdminPrescriptiveAnalysisService = require('../services/AdminPrescriptiveAnalysisService');

const getDashboardStats = async (req, res) => {
    try {
        console.log('Starting to fetch dashboard stats...');

        // Ensure we have a valid database connection
        if (mongoose.connection.readyState !== 1) {
            throw new Error('Database connection is not ready');
        }

        // Connect to each specific database
        const testDb = mongoose.connection.useDb('test');
        const teachersDb = mongoose.connection.useDb('teachers');
        const parentDb = mongoose.connection.useDb('parent');

        // Get counts from each collection
        const [studentsCount, teachersCount, parentsCount] = await Promise.all([
            testDb.collection('users').countDocuments(),
            teachersDb.collection('profile').countDocuments(),
            parentDb.collection('parent_profile').countDocuments()
        ]);

        // Calculate total users
        const totalUsers = studentsCount + teachersCount + parentsCount;

        // Prepare response data
        const stats = {
            users: {
                total: totalUsers,
                students: studentsCount,
                teachers: teachersCount,
                parents: parentsCount,
                activeToday: totalUsers // For now, assume all users are active
            },
            academicData: {
                averageScore: 85, // Default value
                averageReadingLevel: 2.5 // Default value
            },
            activities: {
                averageCompletionRate: 75,
                completedActivities: studentsCount * 2, // Estimate 2 activities per student
                pendingApproval: Math.floor(studentsCount * 0.3), // Estimate 30% pending
                activitiesCreated: teachersCount * 5, // Estimate 5 activities per teacher
                parentCommunications: parentsCount * 2 // Estimate 2 communications per parent
            },
            prescriptiveAnalytics: {
                highPriorityStudents: Math.floor(studentsCount * 0.1) // Estimate 10% high priority
            }
        };

        console.log('Sending response with stats:', stats);
        res.json(stats);
    } catch (error) {
        console.error('Error in getDashboardStats:', error);
        res.status(500).json({ 
            error: 'Failed to fetch dashboard statistics', 
            details: error.message
        });
    }
};

/**
 * Get comprehensive prescriptive analysis for Grade 1 students
 * Analyzes performance data using BKT and IRT models
 */
const getPrescriptiveAnalysis = async (req, res) => {
    try {
        console.log('[ADMIN CONTROLLER] ========================================');
        console.log('[ADMIN CONTROLLER] Starting prescriptive analysis request...');
        console.log('[ADMIN CONTROLLER] User from req.user:', req.user);
        console.log('[ADMIN CONTROLLER] Headers:', req.headers);
        console.log('[ADMIN CONTROLLER] ========================================');

        // Get comprehensive prescriptive analysis
        const analysisResult = await AdminPrescriptiveAnalysisService.getComprehensivePrescriptiveAnalysis();

        console.log('[ADMIN CONTROLLER] ✅ Prescriptive analysis completed successfully');

        res.json({
            success: true,
            message: 'Prescriptive analysis generated successfully',
            data: analysisResult,
            timestamp: new Date().toISOString()
        });

    } catch (error) {
        console.error('[ADMIN CONTROLLER] ❌ Error in prescriptive analysis:', error);

        res.status(500).json({
            success: false,
            error: 'Failed to generate prescriptive analysis',
            details: error.message,
            timestamp: new Date().toISOString()
        });
    }
};

/**
 * Get category-specific analysis for a particular reading skill
 */
const getCategoryAnalysis = async (req, res) => {
    try {
        const { category } = req.params;

        console.log(`[ADMIN CONTROLLER] Getting category analysis for: ${category}`);

        // Validate category
        const validCategories = ['Alphabet Knowledge', 'Phonological Awareness', 'Decoding', 'Word Recognition', 'Reading Comprehension'];
        if (!validCategories.includes(category)) {
            return res.status(400).json({
                success: false,
                error: 'Invalid category',
                validCategories: validCategories
            });
        }

        // Get full analysis and extract category-specific data
        const fullAnalysis = await AdminPrescriptiveAnalysisService.getComprehensivePrescriptiveAnalysis();
        const categoryData = fullAnalysis.categoryAnalysis[category];

        if (!categoryData) {
            return res.status(404).json({
                success: false,
                error: `No data found for category: ${category}`
            });
        }

        res.json({
            success: true,
            category: category,
            data: categoryData,
            timestamp: new Date().toISOString()
        });

    } catch (error) {
        console.error(`[ADMIN CONTROLLER] ❌ Error in category analysis for ${req.params.category}:`, error);

        res.status(500).json({
            success: false,
            error: 'Failed to get category analysis',
            details: error.message
        });
    }
};

/**
 * Get section-specific analysis for classroom insights
 */
const getSectionAnalysis = async (req, res) => {
    try {
        const { section } = req.params;

        console.log(`[ADMIN CONTROLLER] Getting section analysis for: ${section}`);

        // Get full analysis and extract section-specific data
        const fullAnalysis = await AdminPrescriptiveAnalysisService.getComprehensivePrescriptiveAnalysis();
        const sectionData = fullAnalysis.sectionAnalysis[section];

        if (!sectionData) {
            return res.status(404).json({
                success: false,
                error: `No data found for section: ${section}`,
                availableSections: Object.keys(fullAnalysis.sectionAnalysis)
            });
        }

        res.json({
            success: true,
            section: section,
            data: sectionData,
            timestamp: new Date().toISOString()
        });

    } catch (error) {
        console.error(`[ADMIN CONTROLLER] ❌ Error in section analysis for ${req.params.section}:`, error);

        res.status(500).json({
            success: false,
            error: 'Failed to get section analysis',
            details: error.message
        });
    }
};

/**
 * Get skill mastery overview using BKT analysis
 */
const getSkillMasteryAnalysis = async (req, res) => {
    try {
        console.log('[ADMIN CONTROLLER] Getting skill mastery analysis...');

        // Get full analysis and extract skill mastery data
        const fullAnalysis = await AdminPrescriptiveAnalysisService.getComprehensivePrescriptiveAnalysis();
        const skillMasteryData = fullAnalysis.skillMasteryAnalysis;

        res.json({
            success: true,
            data: skillMasteryData,
            modelUsed: 'Bayesian Knowledge Tracing (BKT)',
            description: 'Skill mastery analysis using BKT mathematical model to assess student knowledge acquisition',
            timestamp: new Date().toISOString()
        });

    } catch (error) {
        console.error('[ADMIN CONTROLLER] ❌ Error in skill mastery analysis:', error);

        res.status(500).json({
            success: false,
            error: 'Failed to get skill mastery analysis',
            details: error.message
        });
    }
};

module.exports = {
    getDashboardStats,
    getPrescriptiveAnalysis,
    getCategoryAnalysis,
    getSectionAnalysis,
    getSkillMasteryAnalysis
}; 