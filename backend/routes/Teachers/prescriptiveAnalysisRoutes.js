// routes/Teachers/prescriptiveAnalysisRoutes.js
const express = require('express');
const router = express.Router();
const prescriptiveAnalysisController = require('../../controllers/Teachers/prescriptiveAnalysisController');
const { auth, authorize } = require('../../middleware/auth');
const mongoose = require('mongoose');

// Apply authentication middleware to all routes
router.use(auth);

// Get all prescriptive analyses for a student
// GET /api/prescriptive-analysis/student/:studentId
router.get(
  '/student/:studentId',
  authorize('teacher', 'admin'),
  prescriptiveAnalysisController.getStudentAnalyses
);

// Get a specific prescriptive analysis by ID
// GET /api/prescriptive-analysis/:analysisId
router.get(
  '/:analysisId',
  authorize('teacher', 'admin'),
  prescriptiveAnalysisController.getAnalysisById
);

// Get a specific prescriptive analysis by student and category
// GET /api/prescriptive-analysis/student/:studentId/category/:category
router.get(
  '/student/:studentId/category/:category',
  authorize('teacher', 'admin'),
  prescriptiveAnalysisController.getAnalysisByStudentAndCategory
);

// Create a new prescriptive analysis
// POST /api/prescriptive-analysis
router.post(
  '/',
  authorize('teacher', 'admin'),
  prescriptiveAnalysisController.createAnalysis
);

// Update an existing prescriptive analysis
// PUT /api/prescriptive-analysis/:analysisId
router.put(
  '/:analysisId',
  authorize('teacher', 'admin'),
  prescriptiveAnalysisController.updateAnalysis
);

// Delete a prescriptive analysis
// DELETE /api/prescriptive-analysis/:analysisId
router.delete(
  '/:analysisId',
  authorize('teacher', 'admin'),
  prescriptiveAnalysisController.deleteAnalysis
);

// Generate prescriptive analyses from category results
// POST /api/prescriptive-analysis/generate
router.post(
  '/generate',
  authorize('teacher', 'admin'),
  prescriptiveAnalysisController.generateAnalysesFromCategoryResults
);

// Initialize prescriptive analyses for all students
// POST /api/prescriptive-analysis/initialize
router.post(
  '/initialize',
  authorize('admin'),
  prescriptiveAnalysisController.initializeForAllStudents
);

// Regenerate empty prescriptive analyses
// POST /api/prescriptive-analysis/student/:studentId/regenerate
router.post(
  '/student/:studentId/regenerate',
  authorize('teacher', 'admin'),
  prescriptiveAnalysisController.regenerateAnalyses
);

// Ensure a student has prescriptive analysis records for all categories
// POST /api/prescriptive-analysis/student/:studentId/ensure
router.post(
  '/student/:studentId/ensure',
  authorize('teacher', 'admin'),
  prescriptiveAnalysisController.ensureStudentAnalysesExist
);

// Debug route for category results
// GET /api/prescriptive-analysis/debug/:studentId/category-results
router.get(
  '/debug/:studentId/category-results',
  authorize('teacher', 'admin'),
  prescriptiveAnalysisController.debugCategoryResults
);

// Debug route to manually trigger the complete regeneration process
// GET /api/prescriptive-analysis/debug/:studentId/regenerate-full
router.get(
  '/debug/:studentId/regenerate-full',
  authorize('teacher', 'admin'),
  async (req, res) => {
    try {
      const { studentId } = req.params;
      const PrescriptiveAnalysisService = require('../../services/Teachers/PrescriptiveAnalysisService');
      
      console.log(`--- VERBOSE DEBUG: Manual regeneration for student ${studentId} ---`);
      
      // Get user info
      let user;
      if (mongoose.Types.ObjectId.isValid(studentId)) {
        user = await mongoose.connection.db.collection('users').findOne({ 
          _id: new mongoose.Types.ObjectId(studentId) 
        });
        console.log(`User found by ObjectId: ${JSON.stringify(user)}`);
      } else {
        user = await mongoose.connection.db.collection('users').findOne({ 
          idNumber: studentId 
        });
        console.log(`User found by idNumber: ${JSON.stringify(user)}`);
      }
      
      if (!user) {
        return res.status(404).json({
          success: false,
          message: 'Student not found'
        });
      }
      
      // Step 1: Ensure analyses exist
      console.log('Step 1: Ensuring analyses exist...');
      const initialAnalyses = await PrescriptiveAnalysisService.ensureStudentHasAllAnalyses(
        studentId, 
        user.readingLevel || 'Low Emerging'
      );
      console.log(`Created/found ${initialAnalyses.length} analyses`);
      
      // Step 2: Get the latest category result
      console.log('Step 2: Getting latest category result...');
      let categoryResult = await mongoose.model('CategoryResult').findOne({
        $or: [
          { studentId: mongoose.Types.ObjectId.isValid(studentId) ? new mongoose.Types.ObjectId(studentId) : null },
          { studentId: studentId }
        ]
      }).sort({ assessmentDate: -1 });
      
      // If not found by direct match, try matching by string ID number
      if (!categoryResult && user.idNumber) {
        console.log(`Attempting to find category result by idNumber: ${user.idNumber}`);
        categoryResult = await mongoose.model('CategoryResult').findOne({
          studentId: user.idNumber
        }).sort({ assessmentDate: -1 });
      }
      
      if (categoryResult) {
        console.log(`Found category result: ${JSON.stringify(categoryResult)}`);
        
        // Step 3: Generate analyses based on category result
        console.log('Step 3: Generating analyses from category results...');
        const updatedAnalyses = await PrescriptiveAnalysisService.generateAnalysesFromCategoryResults(
          studentId,
          categoryResult
        );
        console.log(`Updated ${updatedAnalyses.length} analyses from category results`);
      } else {
        console.log('No category results found, skipping step 3');
      }
      
      // Step 4: Regenerate any remaining empty analyses
      console.log('Step 4: Regenerating empty analyses...');
      const analyses = await PrescriptiveAnalysisService.regenerateEmptyAnalyses(studentId);
      
      // Print the first analysis to check if it's populated
      if (analyses.length > 0) {
        console.log(`Sample analysis after regeneration: ${JSON.stringify(analyses[0])}`);
      }
      
      return res.status(200).json({
        success: true,
        message: 'Full regeneration process completed successfully',
        analyses
      });
    } catch (error) {
      console.error('Error in debug regenerate full route:', error);
      return res.status(500).json({
        success: false,
        message: 'Error in debug regenerate route',
        error: error.message
      });
    }
  }
);

// Direct update route to populate analyses with fixed content
// GET /api/prescriptive-analysis/debug/:studentId/force-populate
router.get(
  '/debug/:studentId/force-populate',
  authorize('teacher', 'admin'),
  async (req, res) => {
    try {
      const { studentId } = req.params;
      const mongoose = require('mongoose');
      
      console.log(`Force populating analyses for student ${studentId}`);
      
      // Find all analyses for this student
      let studentObjectId;
      
      if (mongoose.Types.ObjectId.isValid(studentId)) {
        studentObjectId = new mongoose.Types.ObjectId(studentId);
      } else {
        const user = await mongoose.connection.db.collection('users').findOne({ idNumber: studentId });
        if (!user) {
          return res.status(404).json({ success: false, message: 'Student not found' });
        }
        studentObjectId = user._id;
      }
      
      // Get the PrescriptiveAnalysis model
      const PrescriptiveAnalysis = require('../../models/Teachers/ManageProgress/prescriptiveAnalysisModel');
      
      // Find all analyses for this student
      const analyses = await PrescriptiveAnalysis.find({ studentId: studentObjectId });
      
      console.log(`Found ${analyses.length} analyses to update`);
      
      // Fixed content by category
      const contentByCategory = {
        'Alphabet Knowledge': {
          strengths: [
            'Strong recognition of most letters',
            'Good understanding of letter-sound relationships',
            'Able to identify letters in different contexts'
          ],
          weaknesses: [
            'Occasional confusion with similar letters',
            'Inconsistent with lowercase forms',
            'May struggle with less common letters'
          ],
          recommendations: [
            'Regular practice with problematic letters',
            'Multi-sensory letter activities',
            'Letter recognition games',
            'Connect letters to familiar words'
          ]
        },
        'Phonological Awareness': {
          strengths: [
            'Can identify beginning and ending sounds',
            'Shows awareness of rhyming patterns',
            'Good syllable segmentation skills'
          ],
          weaknesses: [
            'Difficulty with blending sounds',
            'Struggles with manipulating phonemes',
            'Inconsistent with identifying middle sounds'
          ],
          recommendations: [
            'Daily phonemic awareness activities',
            'Sound blending and segmentation practice',
            'Rhyming games and activities',
            'Explicit instruction in sound manipulation'
          ]
        },
        'Word Recognition': {
          strengths: [
            'Recognizes common high-frequency words',
            'Growing sight word vocabulary',
            'Can identify familiar words in text'
          ],
          weaknesses: [
            'Difficulty with less common words',
            'Slow recognition speed',
            'Struggles in contextual reading'
          ],
          recommendations: [
            'Regular sight word practice',
            'Word recognition games',
            'Flash card activities',
            'Reading familiar books to build fluency'
          ]
        },
        'Decoding': {
          strengths: [
            'Applies basic phonics rules',
            'Can decode simple words',
            'Shows understanding of sound-symbol relationships'
          ],
          weaknesses: [
            'Difficulty with vowel patterns',
            'Struggles with multi-syllable words',
            'Inconsistent application of rules'
          ],
          recommendations: [
            'Systematic phonics instruction',
            'Decoding practice with decodable texts',
            'Word family activities',
            'Break down longer words into syllables'
          ]
        },
        'Reading Comprehension': {
          strengths: [
            'Understands basic story elements',
            'Can recall main events',
            'Answers literal questions about text'
          ],
          weaknesses: [
            'Difficulty making inferences',
            'Limited vocabulary affects understanding',
            'Struggles with more complex texts'
          ],
          recommendations: [
            'Direct instruction in comprehension strategies',
            'Vocabulary building activities',
            'Discussion questions before, during and after reading',
            'Graphic organizers for story structure'
          ]
        }
      };
      
      // Update each analysis with fixed content using findByIdAndUpdate for reliability
      const updatePromises = analyses.map(analysis => {
        const content = contentByCategory[analysis.categoryId];
        
        if (content) {
          console.log(`Updating analysis ID ${analysis._id} for category ${analysis.categoryId}`);
          
          return PrescriptiveAnalysis.findByIdAndUpdate(
            analysis._id,
            {
              strengths: content.strengths,
              weaknesses: content.weaknesses,
              recommendations: content.recommendations,
              updatedAt: new Date()
            },
            { new: true }
          );
        } else {
          console.log(`No content found for category ${analysis.categoryId}`);
          return Promise.resolve(null);
        }
      });
      
      // Wait for all updates to complete
      const updatedAnalyses = await Promise.all(updatePromises);
      
      // Filter out null results (from categories without content)
      const validUpdates = updatedAnalyses.filter(a => a !== null);
      
      return res.status(200).json({
        success: true,
        message: 'Analyses updated with fixed content',
        count: validUpdates.length,
        analyses: validUpdates
      });
    } catch (error) {
      console.error('Error in force populate route:', error);
      return res.status(500).json({
        success: false,
        message: 'Error updating analyses',
        error: error.message
      });
    }
  }
);

// Direct database check route
// GET /api/prescriptive-analysis/debug/direct-check
router.get(
  '/debug/direct-check',
  authorize('teacher', 'admin'),
  async (req, res) => {
    try {
      const mongoose = require('mongoose');
      const PrescriptiveAnalysis = require('../../models/Teachers/ManageProgress/prescriptiveAnalysisModel');
      
      // Get a sample analysis directly from the database
      const sampleAnalyses = await PrescriptiveAnalysis.find().limit(3);
      
      // Check database connection
      const dbStatus = mongoose.connection.readyState === 1 ? 'connected' : 'disconnected';
      
      // Check if collections exist
      const collections = await mongoose.connection.db.listCollections().toArray();
      const collectionNames = collections.map(c => c.name);
      
      // Try a direct MongoDB query
      const directResults = await mongoose.connection.db.collection('prescriptive_analysis').find().limit(3).toArray();
      
      return res.status(200).json({
        success: true,
        dbStatus,
        collections: collectionNames,
        sampleAnalyses,
        directResults,
        modelTest: {
          modelExists: !!PrescriptiveAnalysis,
          schemaFields: Object.keys(PrescriptiveAnalysis.schema.paths)
        }
      });
    } catch (error) {
      console.error('Error in direct database check:', error);
      return res.status(500).json({
        success: false,
        message: 'Error checking database',
        error: error.message
      });
    }
  }
);

// Direct MongoDB update route
// GET /api/prescriptive-analysis/debug/:studentId/direct-update
router.get(
  '/debug/:studentId/direct-update',
  authorize('teacher', 'admin'),
  async (req, res) => {
    try {
      const { studentId } = req.params;
      const mongoose = require('mongoose');
      
      console.log(`Direct MongoDB update for student ${studentId}`);
      
      // Find all analyses for this student
      let studentObjectId;
      
      if (mongoose.Types.ObjectId.isValid(studentId)) {
        studentObjectId = new mongoose.Types.ObjectId(studentId);
      } else {
        const user = await mongoose.connection.db.collection('users').findOne({ idNumber: studentId });
        if (!user) {
          return res.status(404).json({ success: false, message: 'Student not found' });
        }
        studentObjectId = user._id;
      }
      
      // Fixed content for all categories
      const fixedContent = {
        strengths: ['Student shows potential in this area', 'Demonstrates some understanding of basic concepts', 'Can apply skills with support'],
        weaknesses: ['Needs more practice with core skills', 'Requires additional support with complex tasks', 'Benefits from regular reinforcement'],
        recommendations: ['Provide structured practice opportunities', 'Use multi-sensory teaching approaches', 'Break tasks into smaller steps', 'Offer regular feedback and encouragement']
      };
      
      // Use direct MongoDB operation to update all analyses for this student
      const updateResult = await mongoose.connection.db.collection('prescriptive_analysis').updateMany(
        { studentId: studentObjectId },
        { 
          $set: {
            strengths: fixedContent.strengths,
            weaknesses: fixedContent.weaknesses,
            recommendations: fixedContent.recommendations,
            updatedAt: new Date()
          }
        }
      );
      
      // Get updated documents to return
      const updatedAnalyses = await mongoose.connection.db.collection('prescriptive_analysis')
        .find({ studentId: studentObjectId })
        .toArray();
      
      return res.status(200).json({
        success: true,
        message: 'Direct MongoDB update completed',
        updateResult,
        analyses: updatedAnalyses
      });
    } catch (error) {
      console.error('Error in direct update route:', error);
      return res.status(500).json({
        success: false,
        message: 'Error with direct MongoDB update',
        error: error.message
      });
    }
  }
);

// Direct update route using controller method
// POST /api/prescriptive-analysis/student/:studentId/direct-update
router.post(
  '/student/:studentId/direct-update',
  authorize('teacher', 'admin'),
  prescriptiveAnalysisController.directUpdate
);

// Regenerate all empty analyses for all students
// POST /api/prescriptive-analysis/regenerate-all
router.post(
  '/regenerate-all',
  authorize('admin'),
  async (req, res) => {
    try {
      const PrescriptiveAnalysisService = require('../../services/Teachers/PrescriptiveAnalysisService');
      const mongoose = require('mongoose');
      
      console.log('Starting regeneration of all empty analyses...');
      
      // Get all students
      const users = await mongoose.connection.db.collection('users').find({
        gradeLevel: { $exists: true } // Only get students
      }).toArray();
      
      console.log(`Found ${users.length} students to process`);
      
      let successCount = 0;
      let errorCount = 0;
      
      // Process each student
      for (const student of users) {
        try {
          // Regenerate empty analyses for this student
          const analyses = await PrescriptiveAnalysisService.regenerateEmptyAnalyses(student._id);
          console.log(`Successfully regenerated ${analyses.length} analyses for student ${student._id}`);
          successCount++;
        } catch (error) {
          console.error(`Error regenerating analyses for student ${student._id}:`, error);
          errorCount++;
        }
      }
      
      return res.status(200).json({
        success: true,
        message: `Regeneration complete. Processed ${successCount} students successfully, ${errorCount} errors.`
      });
    } catch (error) {
      console.error('Error regenerating all analyses:', error);
      return res.status(500).json({
        success: false,
        message: 'Error regenerating analyses',
        error: error.message
      });
    }
  }
);

// Fix all empty prescriptive analyses
// POST /api/prescriptive-analysis/fix-empty
router.post(
  '/fix-empty',
  authorize('admin'),
  prescriptiveAnalysisController.fixEmptyAnalyses
);

module.exports = router;