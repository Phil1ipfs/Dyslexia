// controllers/Teachers/prescriptiveAnalysisController.js
const mongoose = require('mongoose');
const PrescriptiveAnalysisService = require('../../services/Teachers/PrescriptiveAnalysisService');
const CategoryResult = require('../../models/Teachers/ManageProgress/categoryResultModel');

class PrescriptiveAnalysisController {
  /**
   * Get all prescriptive analyses for a student
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   */
  async getStudentAnalyses(req, res) {
    try {
      const { studentId } = req.params;
      
      // Step 1: Get user information to determine reading level
      let user;
      if (mongoose.Types.ObjectId.isValid(studentId)) {
        user = await mongoose.connection.db.collection('users').findOne({ 
          _id: new mongoose.Types.ObjectId(studentId) 
        });
      } else {
        user = await mongoose.connection.db.collection('users').findOne({ 
          idNumber: studentId 
        });
      }
      
      if (!user) {
        return res.status(404).json({
          success: false,
          message: 'Student not found'
        });
      }

      const readingLevel = user.readingLevel || 'Not Assessed';
      
      // Step 2: If reading level is not assessed, short-circuit
      if (readingLevel === 'Not Assessed') {
        return res.status(200).json({
          success: true,
          data: null          // ←  frontend will know there is nothing to show
        });
      }
      
      // Otherwise proceed as before
      await PrescriptiveAnalysisService.ensureStudentHasAllAnalyses(
        studentId, 
        readingLevel
      );
      
      // Step 3: Get analyses from database
      let analyses = await PrescriptiveAnalysisService.getStudentAnalyses(studentId);
      
      if (!analyses || analyses.length === 0) {
        return res.status(200).json({ success: true, data: null });
      }
      
      // Step 4: Check if any analyses are empty and regenerate if needed
      const hasEmptyAnalyses = analyses.some(analysis => 
        (!analysis.strengths || analysis.strengths.length === 0) ||
        (!analysis.weaknesses || analysis.weaknesses.length === 0) ||
        (!analysis.recommendations || analysis.recommendations.length === 0)
      );
      
      if (hasEmptyAnalyses) {
        console.log(`Found empty analyses for student ${studentId}, regenerating content...`);
        analyses = await PrescriptiveAnalysisService.regenerateEmptyAnalyses(studentId);
      }
      
      return res.status(200).json({
        success: true,
        count: analyses.length,
        data: analyses
      });
    } catch (error) {
      console.error('Error fetching student analyses:', error);
      return res.status(500).json({
        success: false,
        message: 'Error fetching prescriptive analyses',
        error: error.message
      });
    }
  }

  /**
   * Get a specific prescriptive analysis by ID
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   */
  async getAnalysisById(req, res) {
    try {
      const { analysisId } = req.params;
      
      if (!mongoose.Types.ObjectId.isValid(analysisId)) {
        return res.status(400).json({
          success: false,
          message: 'Invalid analysis ID format'
        });
      }

      const analysis = await PrescriptiveAnalysisService.getAnalysisById(analysisId);
      
      if (!analysis) {
        return res.status(404).json({
          success: false,
          message: 'Prescriptive analysis not found'
        });
      }
      
      return res.status(200).json({
        success: true,
        data: analysis
      });
    } catch (error) {
      console.error('Error fetching analysis by ID:', error);
      return res.status(500).json({
        success: false,
        message: 'Error fetching prescriptive analysis',
        error: error.message
      });
    }
  }

  /**
   * Get a specific prescriptive analysis by student ID and category
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   */
  async getAnalysisByStudentAndCategory(req, res) {
    try {
      const { studentId, category } = req.params;

      const analysis = await PrescriptiveAnalysisService.getAnalysisByStudentAndCategory(
        studentId,
        category
      );
      
      if (!analysis) {
        return res.status(404).json({
          success: false,
          message: 'Prescriptive analysis not found'
        });
      }
      
      return res.status(200).json({
        success: true,
        data: analysis
      });
    } catch (error) {
      console.error('Error fetching analysis by student and category:', error);
      return res.status(500).json({
        success: false,
        message: 'Error fetching prescriptive analysis',
        error: error.message
      });
    }
  }

  /**
   * Create a new prescriptive analysis
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   */
  async createAnalysis(req, res) {
    try {
      const analysisData = {
        ...req.body,
        // Add user ID from auth middleware if available
        createdBy: req.user ? req.user.id : null
      };
      
      // Validate required fields
      if (!analysisData.studentId || !analysisData.categoryId || !analysisData.readingLevel) {
        return res.status(400).json({
          success: false,
          message: 'Student ID, category, and reading level are required'
        });
      }
      
      const analysis = await PrescriptiveAnalysisService.createAnalysis(analysisData);
      
      return res.status(201).json({
        success: true,
        data: analysis
      });
    } catch (error) {
      console.error('Error creating analysis:', error);
      return res.status(500).json({
        success: false,
        message: 'Error creating prescriptive analysis',
        error: error.message
      });
    }
  }

  /**
   * Update an existing prescriptive analysis
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   */
  async updateAnalysis(req, res) {
    try {
      const { analysisId } = req.params;
      const updateData = req.body;
      
      if (!mongoose.Types.ObjectId.isValid(analysisId)) {
        return res.status(400).json({
          success: false,
          message: 'Invalid analysis ID format'
        });
      }
      
      const analysis = await PrescriptiveAnalysisService.updateAnalysis(analysisId, updateData);
      
      if (!analysis) {
        return res.status(404).json({
          success: false,
          message: 'Prescriptive analysis not found'
        });
      }
      
      return res.status(200).json({
        success: true,
        data: analysis
      });
    } catch (error) {
      console.error('Error updating analysis:', error);
      return res.status(500).json({
        success: false,
        message: 'Error updating prescriptive analysis',
        error: error.message
      });
    }
  }

  /**
   * Delete a prescriptive analysis
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   */
  async deleteAnalysis(req, res) {
    try {
      const { analysisId } = req.params;
      
      if (!mongoose.Types.ObjectId.isValid(analysisId)) {
        return res.status(400).json({
          success: false,
          message: 'Invalid analysis ID format'
        });
      }
      
      const analysis = await PrescriptiveAnalysisService.deleteAnalysis(analysisId);
      
      if (!analysis) {
        return res.status(404).json({
          success: false,
          message: 'Prescriptive analysis not found'
        });
      }
      
      return res.status(200).json({
        success: true,
        data: analysis
      });
    } catch (error) {
      console.error('Error deleting analysis:', error);
      return res.status(500).json({
        success: false,
        message: 'Error deleting prescriptive analysis',
        error: error.message
      });
    }
  }

  /**
   * Generate prescriptive analyses for a student's failing categories
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   */
  async generateAnalysesFromCategoryResults(req, res) {
    try {
      const { studentId, categoryResultId } = req.body;
      
      // If category result ID provided, fetch that specific one
      let categoryResult;
      if (categoryResultId && mongoose.Types.ObjectId.isValid(categoryResultId)) {
        categoryResult = await CategoryResult.findById(categoryResultId);
      } else {
        // Otherwise, get the most recent category result
        categoryResult = await CategoryResult.findOne({
          studentId: mongoose.Types.ObjectId.isValid(studentId) 
            ? new mongoose.Types.ObjectId(studentId) 
            : studentId // Handle both ObjectId and idNumber formats
        }).sort({ assessmentDate: -1 });
      }
      
      if (!categoryResult) {
        return res.status(404).json({
          success: false,
          message: 'No category results found for this student'
        });
      }
      
      // Step 1: First ensure the student has analysis records for all categories
      await PrescriptiveAnalysisService.ensureStudentHasAllAnalyses(
        studentId, 
        categoryResult.readingLevel || 'Low Emerging'
      );
      
      // Step 2: Then update the analyses with content based on category results
      const analyses = await PrescriptiveAnalysisService.generateAnalysesFromCategoryResults(
        studentId,
        categoryResult
      );
      
      // Step 3: Finally, ensure all analyses have content (even those not covered by the category result)
      const fullyPopulatedAnalyses = await PrescriptiveAnalysisService.regenerateEmptyAnalyses(studentId);
      
      return res.status(200).json({
        success: true,
        count: fullyPopulatedAnalyses.length,
        data: fullyPopulatedAnalyses
      });
    } catch (error) {
      console.error('Error generating analyses from category results:', error);
      return res.status(500).json({
        success: false,
        message: 'Error generating prescriptive analyses',
        error: error.message
      });
    }
  }

  /**
   * Initialize prescriptive analyses for all students
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   */
  async initializeForAllStudents(req, res) {
    try {
      const result = await PrescriptiveAnalysisService.initializeForAllStudents();
      
      return res.status(200).json({
        success: true,
        message: 'Prescriptive analyses initialized for all students',
        data: result
      });
    } catch (error) {
      console.error('Error initializing prescriptive analyses:', error);
      return res.status(500).json({
        success: false,
        message: 'Error initializing prescriptive analyses',
        error: error.message
      });
    }
  }

  /**
   * Regenerate content for empty prescriptive analyses
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   */
  async regenerateAnalyses(req, res) {
    try {
      const { studentId } = req.params;
      
      // Regenerate empty analyses
      const analyses = await PrescriptiveAnalysisService.regenerateEmptyAnalyses(studentId);
      
      return res.status(200).json({
        success: true,
        message: 'Prescriptive analyses regenerated successfully',
        count: analyses.length,
        data: analyses
      });
    } catch (error) {
      console.error('Error regenerating analyses:', error);
      return res.status(500).json({
        success: false,
        message: 'Error regenerating prescriptive analyses',
        error: error.message
      });
    }
  }

  /**
   * Debug route to inspect category results for a student
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   */
  async debugCategoryResults(req, res) {
    try {
      const { studentId } = req.params;
      
      if (!mongoose.Types.ObjectId.isValid(studentId)) {
        return res.status(400).json({
          success: false,
          message: 'Invalid student ID format'
        });
      }
      
      // Get the latest category result
      const categoryResult = await mongoose.model('CategoryResult').findOne({
        studentId: new mongoose.Types.ObjectId(studentId)
      }).sort({ assessmentDate: -1 });
      
      if (!categoryResult) {
        return res.status(404).json({
          success: false,
          message: 'No category results found for this student'
        });
      }
      
      // Inspect how categories would be processed
      const processedCategories = categoryResult.categories.map(category => {
        const categoryName = category.categoryName
          .replace(/_/g, ' ')
          .replace(/\b\w/g, l => l.toUpperCase());
          
        // Generate what the analysis would look like
        const generatedAnalysis = PrescriptiveAnalysisService.generateAutomatedAnalysis(
          categoryName, 
          category.score,
          categoryResult.readingLevel
        );
        
        return {
          originalName: category.categoryName,
          normalizedName: categoryName,
          normalizedForComparison: PrescriptiveAnalysisService.normalizeCategoryName(category.categoryName),
          score: category.score,
          readingLevel: categoryResult.readingLevel,
          generatedContent: generatedAnalysis
        };
      });
      
      return res.status(200).json({
        success: true,
        categoryResult,
        processedCategories
      });
    } catch (error) {
      console.error('Error in debug route:', error);
      return res.status(500).json({
        success: false,
        message: 'Error in debug route',
        error: error.message
      });
    }
  }

  /**
   * Ensure a student has prescriptive analysis records for all categories
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   */
  async ensureStudentAnalysesExist(req, res) {
    try {
      const { studentId } = req.params;
      let readingLevel = req.query.readingLevel || 'Low Emerging';
      
      // Step 1: Ensure the student has analysis records for all categories
      await PrescriptiveAnalysisService.ensureStudentHasAllAnalyses(studentId, readingLevel);
      
      // Step 2: Regenerate any empty analyses to populate their content
      const analyses = await PrescriptiveAnalysisService.regenerateEmptyAnalyses(studentId);
      
      return res.status(200).json({
        success: true,
        message: 'Prescriptive analyses created and populated for student',
        count: analyses.length,
        data: analyses
      });
    } catch (error) {
      console.error('Error ensuring student analyses:', error);
      return res.status(500).json({
        success: false,
        message: 'Error ensuring prescriptive analyses for student',
        error: error.message
      });
    }
  }

  /**
   * Direct update method to populate prescriptive analyses
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   */
  async directUpdate(req, res) {
    try {
      const { studentId } = req.params;
      
      // Find the student
      let studentObjectId;
      if (mongoose.Types.ObjectId.isValid(studentId)) {
        studentObjectId = new mongoose.Types.ObjectId(studentId);
      } else {
        const user = await mongoose.connection.db.collection('users').findOne({ idNumber: studentId });
        if (!user) {
          return res.status(404).json({
            success: false,
            message: 'Student not found'
          });
        }
        studentObjectId = user._id;
      }
      
      // Direct MongoDB update bypassing Mongoose
      const updateResult = await mongoose.connection.db.collection('prescriptive_analysis').updateMany(
        { studentId: studentObjectId },
        {
          $set: {
            strengths: ["Excellent performance in this area", "Shows strong understanding of concepts", "Applies skills consistently"],
            weaknesses: ["Occasional difficulty with complex concepts", "May need reinforcement for new material", "Can benefit from additional practice"],
            recommendations: ["Continue to build on current skills", "Provide regular opportunities for practice", "Encourage application in varied contexts", "Offer challenging extensions"],
            updatedAt: new Date()
          }
        }
      );
      
      // Return updated documents
      const updatedAnalyses = await mongoose.connection.db.collection('prescriptive_analysis')
        .find({ studentId: studentObjectId })
        .toArray();
      
      return res.status(200).json({
        success: true,
        message: 'Analyses updated successfully via direct MongoDB operation',
        count: updatedAnalyses.length,
        updatedAnalyses
      });
    } catch (error) {
      console.error('Error in direct update:', error);
      return res.status(500).json({
        success: false,
        message: 'Error updating analyses directly',
        error: error.message
      });
    }
  }

  /**
   * Fix all empty prescriptive analyses in the database directly
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   */
  async fixEmptyAnalyses(req, res) {
    try {
      console.log('Starting direct fix of empty prescriptive analyses');
      
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
      
      // Default content for unknown categories
      const defaultContent = {
        strengths: [
          'Shows potential in this area',
          'Demonstrates understanding of basic concepts',
          'Can apply skills with support'
        ],
        weaknesses: [
          'Needs additional practice',
          'Requires more structured guidance',
          'Benefits from repetition and reinforcement'
        ],
        recommendations: [
          'Provide structured learning opportunities',
          'Use multi-sensory teaching approaches',
          'Offer regular feedback and encouragement',
          'Break tasks into manageable steps'
        ]
      };
      
      // Find all empty analyses
      const emptyAnalyses = await mongoose.connection.db.collection('prescriptive_analysis').find({
        $or: [
          { strengths: { $exists: false } },
          { strengths: { $size: 0 } },
          { weaknesses: { $exists: false } },
          { weaknesses: { $size: 0 } },
          { recommendations: { $exists: false } },
          { recommendations: { $size: 0 } }
        ]
      }).toArray();
      
      console.log(`Found ${emptyAnalyses.length} empty analyses to fix`);
      
      let updatedCount = 0;
      
      // Update each empty analysis
      for (const analysis of emptyAnalyses) {
        // Get content for this category
        const content = contentByCategory[analysis.categoryId] || defaultContent;
        
        // Update the analysis
        const result = await mongoose.connection.db.collection('prescriptive_analysis').updateOne(
          { _id: analysis._id },
          {
            $set: {
              strengths: content.strengths,
              weaknesses: content.weaknesses,
              recommendations: content.recommendations,
              updatedAt: new Date()
            }
          }
        );
        
        if (result.modifiedCount > 0) {
          updatedCount++;
          console.log(`Updated analysis for ${analysis.categoryId}`);
        }
      }
      
      // Get updated analyses for verification
      const updatedAnalyses = await mongoose.connection.db.collection('prescriptive_analysis')
        .find({ _id: { $in: emptyAnalyses.map(a => a._id) } })
        .toArray();
      
      return res.status(200).json({
        success: true,
        message: `Successfully fixed ${updatedCount} empty analyses`,
        totalFound: emptyAnalyses.length,
        updated: updatedCount,
        samples: updatedAnalyses.slice(0, 3) // Return just a few samples for verification
      });
    } catch (error) {
      console.error('Error fixing empty analyses:', error);
      return res.status(500).json({
        success: false,
        message: 'Error fixing empty analyses',
        error: error.message
      });
    }
  }

  /**
   * Clean up analyses for students with null or "Not Assessed" reading level
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   */
  async cleanupNullReadingLevelAnalyses(req, res) {
    try {
      console.log('Starting cleanup of analyses for students with null reading level');
      
      // 1. Get all students with null or "Not Assessed" reading level
      const users = await mongoose.connection.db.collection('users').find({
        $or: [
          { readingLevel: null },
          { readingLevel: 'Not Assessed' }
        ]
      }).toArray();
      
      console.log(`Found ${users.length} students with null or "Not Assessed" reading level`);
      
      // 2. Delete all analyses for these students
      let deletedCount = 0;
      for (const user of users) {
        const result = await mongoose.connection.db.collection('prescriptive_analysis').deleteMany({
          studentId: user._id
        });
        
        console.log(`Deleted ${result.deletedCount} analyses for student ${user._id} (${user.firstName} ${user.lastName})`);
        deletedCount += result.deletedCount;
      }
      
      return res.status(200).json({
        success: true,
        message: `Successfully deleted ${deletedCount} analyses for ${users.length} students with null reading level`,
        data: {
          studentsCount: users.length,
          deletedAnalyses: deletedCount
        }
      });
    } catch (error) {
      console.error('Error cleaning up analyses for null reading level:', error);
      return res.status(500).json({
        success: false,
        message: 'Error cleaning up analyses',
        error: error.message
      });
    }
  }
}

module.exports = new PrescriptiveAnalysisController(); 