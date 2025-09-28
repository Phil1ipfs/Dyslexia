const IEPReport = require('../../../models/Teachers/ManageProgress/iepReportModel');
const mongoose = require('mongoose');

class IEPController {
  
  // Get IEP report for a student - Enhanced for reading level progression
  static async getIEPReport(req, res) {
    try {
      const { studentId } = req.params;
      const { academicYear, readingLevel } = req.query;

      console.log(`Getting IEP report for student: ${studentId}`);

      // Validate studentId
      if (!mongoose.Types.ObjectId.isValid(studentId)) {
        return res.status(400).json({
          success: false,
          error: 'Invalid student ID format'
        });
      }

      // Get student's current reading level first
      const testDb = mongoose.connection.useDb('test');
      const usersCollection = testDb.collection('users');
      const student = await usersCollection.findOne({
        _id: new mongoose.Types.ObjectId(studentId)
      });

      if (!student) {
        return res.status(404).json({
          success: false,
          error: 'Student not found'
        });
      }

      // ✅ ENHANCED: Build query for reading level specific IEP
      const query = {
        studentId: new mongoose.Types.ObjectId(studentId)
      };

      if (academicYear) {
        query.academicYear = academicYear;
      }

      // ✅ CRITICAL FIX: Find IEP for specific reading level OR current reading level
      const targetReadingLevel = readingLevel || student.readingLevel;
      if (targetReadingLevel) {
        query.readingLevel = targetReadingLevel;
      }

      console.log(`🔍 Searching for IEP: studentId=${studentId}, readingLevel=${targetReadingLevel}, academicYear=${academicYear || 'current'}`);

      // Find IEP report for the specific reading level (NOT just isActive=true)
      let iepReport = await IEPReport.findOne(query)
        .sort({ createdAt: -1 })
        .populate('studentId', 'idNumber firstName lastName readingLevel')
        .populate('lastModifiedBy', 'firstName lastName');

      console.log(`📋 IEP query result: ${iepReport ? 'Found' : 'Not found'} for reading level: ${targetReadingLevel}`);
      
      // ✅ ENHANCED: Handle historical records and progression scenarios
      if (!iepReport) {
        console.log(`📋 No IEP found for ${targetReadingLevel}. Checking progression scenarios...`);

        // Check if student has progressed beyond the requested level
        const levelOrder = ['Low Emerging', 'High Emerging', 'Developing', 'Transitioning', 'At Grade Level'];
        const requestedIndex = levelOrder.indexOf(targetReadingLevel);
        const currentIndex = levelOrder.indexOf(student.readingLevel);

        if (requestedIndex < currentIndex) {
          // Looking for historical record - find it even if isActive=false
          console.log(`🔍 Searching for historical IEP: ${targetReadingLevel} (student is now ${student.readingLevel})`);
          iepReport = await IEPReport.findOne({
            studentId: new mongoose.Types.ObjectId(studentId),
            readingLevel: targetReadingLevel
            // Note: Not filtering by isActive - we want historical records too
          })
          .sort({ createdAt: -1 })
          .populate('studentId', 'idNumber firstName lastName readingLevel')
          .populate('lastModifiedBy', 'firstName lastName');

          if (iepReport) {
            console.log(`✅ Found historical IEP for ${targetReadingLevel}`);
          }
        } else {
          // Try to create from category results for current/future levels
          console.log('Attempting to create IEP from category results');
          try {
            const testDb = mongoose.connection.useDb('test');
            const categoryResults = await testDb.collection('category_results').findOne({
              studentId: parseInt(student.idNumber),
              readingLevel: targetReadingLevel
            });

            if (categoryResults) {
              iepReport = await IEPController.createIEPFromCategoryResults(student.idNumber, categoryResults);

              // Populate the fields after creation
              if (iepReport) {
                iepReport = await IEPReport.findById(iepReport._id)
                  .populate('studentId', 'idNumber firstName lastName readingLevel')
                  .populate('lastModifiedBy', 'firstName lastName');
              }
            }
          } catch (createError) {
            console.error('Failed to create IEP from category results:', createError.message);
          }
        }
      }
      
      if (!iepReport) {
        return res.status(404).json({
          success: false,
          error: 'No IEP report found and could not create one'
        });
      }
      
      res.json({
        success: true,
        data: iepReport
      });
      
    } catch (error) {
      console.error('Error getting IEP report:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to retrieve IEP report',
        message: error.message
      });
    }
  }
  
  // Create IEP report from category results
  static async createFromCategoryResults(studentId, teacherId) {
    try {
      console.log(`Creating IEP from category results for student: ${studentId}`);
      
      // Get student info first
      const testDb = mongoose.connection.useDb('test');
      const usersCollection = testDb.collection('users');
      const student = await usersCollection.findOne({ 
        _id: new mongoose.Types.ObjectId(studentId) 
      });
      
      if (!student) {
        throw new Error('Student not found');
      }
      
      console.log(`Found student: ${student.idNumber} (${student.firstName} ${student.lastName})`);
      
      // Get the latest category results using studentObjectId
      const categoryResultsCollection = testDb.collection('category_results');
      
      console.log(`Searching for category results with studentObjectId: ${studentId}`);
      
      // Try to find results using studentObjectId field
      let latestResults = null;
      
      // Method 1: Try with direct ObjectId conversion
      try {
        latestResults = await categoryResultsCollection.findOne(
          { 
            studentObjectId: new mongoose.Types.ObjectId(studentId)
          },
          { sort: { assessmentDate: -1 } }
        );
        
        if (latestResults) {
          console.log('✅ Found results using direct ObjectId conversion');
        }
      } catch (err) {
        console.log('Error searching with direct ObjectId:', err.message);
      }
      
      // Method 2: Try with string format if MongoDB stores it as string
      if (!latestResults) {
        console.log('Trying with string representation of ObjectId...');
        latestResults = await categoryResultsCollection.findOne(
          { 
            'studentObjectId': studentId
          },
          { sort: { assessmentDate: -1 } }
        );
        
        if (latestResults) {
          console.log('✅ Found results using string representation');
        }
      }
      
      // Method 3: Try with $oid format (Extended JSON format)
      if (!latestResults) {
        console.log('Trying with $oid format...');
        latestResults = await categoryResultsCollection.findOne(
          { 
            'studentObjectId.$oid': studentId
          },
          { sort: { assessmentDate: -1 } }
        );
        
        if (latestResults) {
          console.log('✅ Found results using $oid format');
        }
      }
      
      // Method 4: Try with student number as fallback
      if (!latestResults) {
        console.log(`Falling back to student number: ${student.idNumber}`);
        
        // Try with string format
        latestResults = await categoryResultsCollection.findOne(
          { studentId: student.idNumber },
          { sort: { assessmentDate: -1 } }
        );
        
        if (latestResults) {
          console.log('✅ Found results using student number as string');
        } else {
          // Try with number format
          latestResults = await categoryResultsCollection.findOne(
            { studentId: parseInt(student.idNumber) },
            { sort: { assessmentDate: -1 } }
          );
          
          if (latestResults) {
            console.log('✅ Found results using student number as integer');
          }
        }
      }
      
      // Debug: If still not found, examine the actual data structure
      if (!latestResults) {
        console.log('No results found. Examining database contents...');
        
        const sampleResults = await categoryResultsCollection.find({}).limit(3).toArray();
        console.log('Sample category results:');
        sampleResults.forEach((result, index) => {
          console.log(`${index + 1}. studentId: ${result.studentId} (type: ${typeof result.studentId})`);
          console.log(`   studentObjectId: ${JSON.stringify(result.studentObjectId)}`);
          console.log(`   studentObjectId type: ${typeof result.studentObjectId}`);
          console.log(`   Assessment Date: ${result.assessmentDate}`);
        });
        
        throw new Error(`No category results found for student ${student.idNumber} (ObjectId: ${studentId})`);
      }
      
      console.log(`✅ Found category results: ${latestResults._id}`);
      console.log(`Assessment date: ${latestResults.assessmentDate}`);
      console.log(`Categories in results: ${latestResults.categories?.length || 0}`);
      
      if (!latestResults.categories || latestResults.categories.length === 0) {
        throw new Error('Category results found but no categories data available');
      }
      
      // Log category details for debugging
      latestResults.categories.forEach((cat, index) => {
        console.log(`Category ${index + 1}: ${cat.categoryName} - Score: ${cat.score}% - Passed: ${cat.isPassed}`);
      });
      
      // Check if IEP report already exists for this student with SAME reading level and academic year
      const currentReadingLevel = latestResults.readingLevel || student.readingLevel;
      const currentAcademicYear = new Date().getFullYear().toString();

      console.log(`Checking for existing IEP report for reading level: ${currentReadingLevel}, academic year: ${currentAcademicYear}...`);
      let iepReport = await IEPReport.findOne({
        studentId: new mongoose.Types.ObjectId(studentId),
        readingLevel: currentReadingLevel,
        academicYear: currentAcademicYear,
        isActive: true
      });

      let isUpdate = false;
      if (iepReport) {
        console.log(`✅ Found existing IEP report for SAME reading level (${currentReadingLevel}): ${iepReport._id} - UPDATING same record`);
        isUpdate = true;

        // Update existing report with latest data (same reading level)
        iepReport.overallScore = latestResults.overallScore || 0;
        iepReport.basedOnAssessmentId = latestResults._id;
        iepReport.lastModifiedBy = teacherId ? new mongoose.Types.ObjectId(teacherId) : null;
        iepReport.updatedAt = new Date();
      } else {
        // Check if there's an existing record with different reading level
        const previousIEP = await IEPReport.findOne({
          studentId: new mongoose.Types.ObjectId(studentId),
          isActive: true
        }).sort({ createdAt: -1 });

        if (previousIEP && previousIEP.readingLevel !== currentReadingLevel) {
          console.log(`📈 Student progressed from ${previousIEP.readingLevel} → ${currentReadingLevel} - Creating NEW record for reading level progression`);
        } else if (previousIEP && previousIEP.academicYear !== currentAcademicYear) {
          console.log(`📅 New academic year (${previousIEP.academicYear} → ${currentAcademicYear}) - Creating NEW record`);
        } else {
          console.log('No existing IEP report found - Creating initial record');
        }

        iepReport = new IEPReport({
          studentId: new mongoose.Types.ObjectId(studentId),
          studentNumber: student.idNumber,
          readingLevel: currentReadingLevel,
          overallScore: latestResults.overallScore || 0,
          basedOnAssessmentId: latestResults._id,
          lastModifiedBy: teacherId ? new mongoose.Types.ObjectId(teacherId) : null,
          academicYear: currentAcademicYear
        });
      }

      // Generate/update objectives from category results with enhanced intervention data
      console.log(`${isUpdate ? 'Updating' : 'Generating'} objectives from category results...`);
      iepReport.generateObjectivesFromCategoryResults(latestResults);

      // Enhance objectives with detailed intervention data
      iepReport.objectives = iepReport.objectives.map(objective => {
        // Find matching category data with intervention history
        const categoryData = latestResults.categories.find(cat =>
          cat.categoryName === objective.categoryName
        );

        if (categoryData) {
          // Add comprehensive assessment data
          objective.assessmentScore = categoryData.score || 0;
          objective.totalQuestions = categoryData.totalQuestions || 0;
          objective.correctAnswers = categoryData.correctAnswers || 0;
          objective.totalPossibleMatches = categoryData.totalPossibleMatches || 0;
          objective.correctMatches = categoryData.correctMatches || 0;
          objective.isCompleted = categoryData.isCompleted || false;
          objective.isPassed = categoryData.isPassed || false;
          objective.passingThreshold = categoryData.passingThreshold || 75;

          console.log(`Processing intervention data for ${categoryData.categoryName}:`);
          console.log(`  Assessment: ${objective.assessmentScore}% (${objective.correctAnswers}/${objective.totalQuestions})`);
          console.log(`  Intervention History: ${categoryData.interventionHistory?.length || 0} attempts`);

          // Add comprehensive intervention data if exists
          if (categoryData.interventionHistory && categoryData.interventionHistory.length > 0) {
            objective.hasIntervention = true;
            objective.interventionAttempts = categoryData.interventionAttempts || categoryData.interventionHistory.length;
            objective.interventionCompleted = categoryData.interventionCompleted || false;
            objective.interventionId = categoryData.currentInterventionId || null;

            // Map complete intervention history with comprehensive data
            objective.interventionHistory = categoryData.interventionHistory.map((attempt, index) => {
              const mappedAttempt = {
                attemptNumber: attempt.attemptNumber || (index + 1),
                score: attempt.score || 0,
                isPassed: attempt.isPassed || false,
                attemptedAt: attempt.attemptedAt || attempt.completedAt || new Date(),
                reason: attempt.attemptReason || attempt.reason || 'intervention_attempt',
                revisionNumber: attempt.revisionNumber || 1,
                teacherRemarks: attempt.teacherRemarks || '' // ✅ Include teacherRemarks field
              };

              console.log(`    Attempt ${mappedAttempt.attemptNumber}: ${mappedAttempt.score}% - ${mappedAttempt.isPassed ? 'PASSED' : 'FAILED'}`);
              return mappedAttempt;
            });

            // Get latest intervention result
            const latestAttempt = categoryData.interventionHistory[categoryData.interventionHistory.length - 1];
            if (latestAttempt) {
              objective.latestInterventionScore = latestAttempt.score || 0;
              objective.latestInterventionPassed = latestAttempt.isPassed || false;

              // Set intervention status based on latest attempt outcome
              if (latestAttempt.isPassed) {
                objective.interventionStatus = 'completed_passed';
                objective.interventionName = `${categoryData.categoryName} Intervention - Passed`;
              } else {
                objective.interventionStatus = 'completed_failed';
                objective.interventionName = `${categoryData.categoryName} Intervention - Needs Revision (Attempt ${objective.interventionAttempts})`;
              }

              console.log(`  Latest: ${objective.latestInterventionScore}% - ${objective.latestInterventionPassed ? 'PASSED' : 'FAILED'}`);
            }

            // Calculate comprehensive intervention improvement
            if (categoryData.interventionHistory.length > 1) {
              // Multiple attempts - show progress from first to last
              const firstAttempt = categoryData.interventionHistory[0];
              const lastAttempt = categoryData.interventionHistory[categoryData.interventionHistory.length - 1];
              objective.interventionImprovement = (lastAttempt.score || 0) - (firstAttempt.score || 0);
              console.log(`  Improvement across attempts: +${objective.interventionImprovement}% (${firstAttempt.score}% → ${lastAttempt.score}%)`);
            } else if (categoryData.interventionHistory.length === 1) {
              // Single attempt - show improvement from original assessment
              const interventionScore = categoryData.interventionHistory[0].score || 0;
              const originalScore = categoryData.score || 0;
              objective.interventionImprovement = interventionScore - originalScore;
              console.log(`  Improvement from assessment: +${objective.interventionImprovement}% (${originalScore}% → ${interventionScore}%)`);
            }

            // Set intervention created date from history
            if (categoryData.interventionHistory.length > 0) {
              const firstAttempt = categoryData.interventionHistory[0];
              objective.interventionCreatedAt = firstAttempt.attemptedAt || firstAttempt.completedAt;
            }

          } else {
            // No intervention data - set appropriate status
            objective.hasIntervention = false;
            objective.interventionAttempts = 0;
            objective.interventionCompleted = false;
            objective.interventionHistory = [];
            objective.latestInterventionScore = 0;
            objective.latestInterventionPassed = false;
            objective.interventionImprovement = 0;
            objective.interventionId = null;
            objective.interventionCreatedAt = null;

            // Set status based on whether intervention is needed
            if (categoryData.isPassed) {
              objective.interventionStatus = 'not_needed';
              objective.interventionName = 'No intervention needed - Assessment passed';
            } else {
              objective.interventionStatus = 'required';
              objective.interventionName = 'Intervention required - Assessment failed';
            }

            console.log(`  No intervention data - Status: ${objective.interventionStatus}`);
          }
        }

        return objective;
      });

      console.log(`Generated ${iepReport.objectives?.length || 0} objectives with intervention data:`);
      iepReport.objectives?.forEach((obj, index) => {
        console.log(`${index + 1}. ${obj.lesson} - Score: ${obj.assessmentScore}% - Intervention: ${obj.hasIntervention ? `${obj.interventionAttempts} attempts` : 'None'}`);
        if (obj.interventionHistory && obj.interventionHistory.length > 0) {
          obj.interventionHistory.forEach((attempt, attemptIndex) => {
            console.log(`    Attempt ${attempt.attemptNumber}: ${attempt.score}% - ${attempt.isPassed ? 'PASSED' : 'FAILED'}`);
          });
        }
      });

      await iepReport.save();
      if (isUpdate) {
        console.log(`✅ Updated existing IEP report for student ${student.idNumber} - SAME reading level (${currentReadingLevel}) - Record ID: ${iepReport._id}`);
      } else {
        console.log(`✅ Created new IEP report for student ${student.idNumber} - Reading level: ${currentReadingLevel} - Record ID: ${iepReport._id}`);
      }

      return iepReport;
      
    } catch (error) {
      console.error('Error creating IEP from category results:', error);
      throw error; // Re-throw to see the actual error
    }
  }
  
  // Legacy method - Update support level (keep for backward compatibility)
  static async updateSupportLevel(req, res) {
    try {
      const { studentId, objectiveId } = req.params;
      const { supportLevel } = req.body;

      console.log(`Legacy: Updating support level for student ${studentId}, objective ${objectiveId}`);
      
      // Validate inputs
      if (!mongoose.Types.ObjectId.isValid(studentId)) {
        return res.status(400).json({ error: 'Invalid student ID' });
      }
      
      // Allow null supportLevel (to uncheck)
      if (supportLevel !== null && !['minimal', 'moderate', 'extensive'].includes(supportLevel)) {
        return res.status(400).json({ error: 'Invalid support level' });
      }
      
      // Find and update the IEP report
      const iepReport = await IEPReport.findOne({ 
        studentId: new mongoose.Types.ObjectId(studentId),
        isActive: true
      });
      
      if (!iepReport) {
        return res.status(404).json({ error: 'IEP report not found' });
      }
      
      // Find the objective and update it
      const objective = iepReport.objectives.id(objectiveId);
      if (!objective) {
        return res.status(404).json({ error: 'Objective not found' });
      }
      
      objective.supportLevel = supportLevel;
      objective.lastUpdated = new Date();
      
      await iepReport.save();
      
      res.json({
        success: true,
        message: 'Support level updated successfully',
        data: objective
      });
      
    } catch (error) {
      console.error('Error updating support level:', error);
      res.status(500).json({
        success: false, 
        error: 'Failed to update support level',
        message: error.message
      });
    }
  }
  
  // Update remarks for an objective
  static async updateRemarks(req, res) {
    try {
      const { studentId, objectiveId } = req.params;
      const { remarks } = req.body;
      
      console.log(`Updating remarks for student ${studentId}, objective ${objectiveId}`);
      
      // Validate inputs
      if (!mongoose.Types.ObjectId.isValid(studentId)) {
        return res.status(400).json({ error: 'Invalid student ID' });
      }
      
      // Find and update the IEP report
      const iepReport = await IEPReport.findOne({
        studentId: new mongoose.Types.ObjectId(studentId),
        isActive: true
      });
      
      if (!iepReport) {
        return res.status(404).json({ error: 'IEP report not found' });
      }
      
      // Find the objective and update it
      const objective = iepReport.objectives.id(objectiveId);
      if (!objective) {
        return res.status(404).json({ error: 'Objective not found' });
      }
      
      objective.remarks = remarks || '';
      objective.lastUpdated = new Date();
      iepReport.lastModifiedBy = req.user?.id;
      
      await iepReport.save();
      
      res.json({
        success: true,
        message: 'Remarks updated successfully',
        data: objective
      });
      
    } catch (error) {
      console.error('Error updating remarks:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to update remarks',
        message: error.message
      });
    }
  }
  
  // Bulk update multiple objectives
  static async bulkUpdateObjectives(req, res) {
    try {
      const { studentId } = req.params;
      const { updates } = req.body; // Array of {objectiveId, supportLevel?, remarks?}
      
      console.log(`Bulk updating objectives for student ${studentId}`);
      
      // Validate inputs
      if (!mongoose.Types.ObjectId.isValid(studentId)) {
        return res.status(400).json({ error: 'Invalid student ID' });
      }
      
      if (!Array.isArray(updates)) {
        return res.status(400).json({ error: 'Updates must be an array' });
      }
      
      // Find the IEP report
      const iepReport = await IEPReport.findOne({
        studentId: new mongoose.Types.ObjectId(studentId),
        isActive: true
      });
      
      if (!iepReport) {
        return res.status(404).json({ error: 'IEP report not found' });
      }
      
      // Apply updates
      const updatedObjectives = [];
      for (const update of updates) {
        const objective = iepReport.objectives.id(update.objectiveId);
        if (objective) {
          if (update.supportLevel && ['minimal', 'moderate', 'extensive'].includes(update.supportLevel)) {
            objective.supportLevel = update.supportLevel;
          }
          if (update.hasOwnProperty('remarks')) {
            objective.remarks = update.remarks;
          }
          objective.lastUpdated = new Date();
          updatedObjectives.push(objective);
        }
      }
      
      iepReport.lastModifiedBy = req.user?.id;
      await iepReport.save();
      
      res.json({
        success: true,
        message: `Updated ${updatedObjectives.length} objectives successfully`,
        data: updatedObjectives
      });
      
    } catch (error) {
      console.error('Error bulk updating objectives:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to bulk update objectives',
        message: error.message
      });
    }
  }
  
  // Refresh intervention data - IMPROVED to preserve teacher data
  static async refreshInterventionData(req, res) {
    try {
      const { studentId } = req.params;

      console.log(`🔄 Refreshing intervention data for student: ${studentId} (preserving teacher data)`);

      // Validate studentId
      if (!mongoose.Types.ObjectId.isValid(studentId)) {
        return res.status(400).json({
          success: false,
          error: 'Invalid student ID format'
        });
      }

      // Find the active IEP report
      let iepReport = await IEPReport.findOne({
        studentId: new mongoose.Types.ObjectId(studentId),
        isActive: true
      });

      if (!iepReport) {
        return res.status(404).json({
          success: false,
          error: 'No active IEP report found'
        });
      }

      // Get fresh category results with intervention data
      const testDb = mongoose.connection.useDb('test');
      const categoryResultsCollection = testDb.collection('category_results');

      // Try different search methods for category results
      let latestResults = null;

      // Method 1: Try with ObjectId format
      try {
        // ✅ CRITICAL FIX: Filter by BOTH studentObjectId AND readingLevel to prevent cross-level contamination
        latestResults = await categoryResultsCollection.findOne(
          {
            studentObjectId: new mongoose.Types.ObjectId(studentId),
            readingLevel: iepReport.readingLevel  // ✅ ADD reading level filter to prevent contamination
          },
          { sort: { assessmentDate: -1 } }
        );
        if (latestResults) {
          console.log(`✅ Found category results using studentObjectId for reading level: ${iepReport.readingLevel}`);
        } else {
          console.log(`⚠️ No category results found using studentObjectId for reading level: ${iepReport.readingLevel}`);
        }
      } catch (err) {
        console.log('Method 1 failed, trying alternative...');
      }

      // Method 2: Try with student number if ObjectId failed
      if (!latestResults) {
        const usersCollection = testDb.collection('users');
        const student = await usersCollection.findOne({
          _id: new mongoose.Types.ObjectId(studentId)
        });

        if (student) {
          // ✅ CRITICAL FIX: Filter by BOTH studentId AND readingLevel to prevent cross-level contamination
          latestResults = await categoryResultsCollection.findOne(
            {
              studentId: student.idNumber,
              readingLevel: iepReport.readingLevel  // ✅ ADD reading level filter to prevent contamination
            },
            { sort: { assessmentDate: -1 } }
          );

          if (latestResults) {
            console.log(`✅ Found category results using student number: ${student.idNumber} for reading level: ${iepReport.readingLevel}`);
          } else {
            console.log(`⚠️ No category results found for student ${student.idNumber} at reading level: ${iepReport.readingLevel}`);
          }
        }
      }

      if (!latestResults) {
        console.log('⚠️ No category results found - using basic refresh');
        // Fall back to basic refresh without comprehensive data
        return this.basicRefreshIntervention(req, res, iepReport);
      }

      // Store original teacher data before refresh
      const originalTeacherData = {};
      iepReport.objectives.forEach(obj => {
        originalTeacherData[obj.categoryName] = {
          supportLevel: obj.supportLevel,
          remarks: obj.remarks,
          mainAssessmentRemarks: obj.mainAssessmentRemarks, // ✅ PRESERVE main assessment remarks
          interventionHistory: obj.interventionHistory ? obj.interventionHistory.map(attempt => ({
            ...attempt,
            teacherRemarks: attempt.teacherRemarks || '' // ✅ PRESERVE individual attempt remarks
          })) : []
        };
      });

      console.log(`📚 Preserving teacher data for ${Object.keys(originalTeacherData).length} objectives`);

      // ✅ FIX: DON'T regenerate objectives - just update them in place to preserve teacher data
      // iepReport.generateObjectivesFromCategoryResults(latestResults); // ❌ REMOVED - This was wiping out teacher data!

      // Enhanced objectives processing with fresh intervention data
      iepReport.objectives = iepReport.objectives.map(objective => {
        // Find matching category data with intervention history
        const categoryData = latestResults.categories.find(cat =>
          cat.categoryName === objective.categoryName
        );

        if (categoryData) {
          // Update all assessment and intervention data
          objective.assessmentScore = categoryData.score || 0;
          objective.totalQuestions = categoryData.totalQuestions || 0;
          objective.correctAnswers = categoryData.correctAnswers || 0;
          objective.totalPossibleMatches = categoryData.totalPossibleMatches || 0;
          objective.correctMatches = categoryData.correctMatches || 0;
          objective.isCompleted = categoryData.isCompleted || false;
          objective.isPassed = categoryData.isPassed || false;
          objective.passingThreshold = categoryData.passingThreshold || 75;

          // ✅ CRITICAL FIX: Check if category has intervention data (but IGNORE existing data for fresh reading levels)
          const hasNewInterventionData = categoryData.interventionHistory && categoryData.interventionHistory.length > 0;
          const hasExistingInterventionData = originalTeacherData[objective.categoryName]?.interventionHistory && originalTeacherData[objective.categoryName].interventionHistory.length > 0;

          // ✅ ANTI-CONTAMINATION FIX: If category_results has no intervention data, clear all intervention data regardless of what IEP contains
          const shouldClearInterventionData = !hasNewInterventionData;

          // Update comprehensive intervention data
          if (hasNewInterventionData) {
            objective.hasIntervention = true;
            objective.interventionAttempts = categoryData.interventionAttempts || categoryData.interventionHistory?.length || originalTeacherData[objective.categoryName]?.interventionHistory?.length || 0;
            objective.interventionCompleted = categoryData.interventionCompleted || false;
            objective.interventionId = categoryData.currentInterventionId || null;

            // ✅ ENHANCED FIX: Preserve ALL teacher remarks during intervention history update
            const originalHistory = originalTeacherData[objective.categoryName]?.interventionHistory || [];
            console.log(`  🔍 DEBUG: Preserving intervention history for ${objective.categoryName}`);
            console.log(`    📋 Original history count: ${originalHistory.length}`);
            console.log(`    📋 New category data count: ${categoryData.interventionHistory?.length || 0}`);
            console.log(`    📋 Has new intervention data: ${hasNewInterventionData}`);
            console.log(`    📋 Has existing intervention data: ${hasExistingInterventionData}`);

            // ✅ CRITICAL FIX: If no new intervention data but has existing data, preserve existing entirely
            if (!hasNewInterventionData && hasExistingInterventionData) {
              console.log(`    🔒 No new intervention data - preserving existing intervention history entirely`);
              objective.interventionHistory = originalHistory.map(attempt => ({
                ...attempt,
                // Ensure teacher remarks are preserved as-is
                teacherRemarks: attempt.teacherRemarks || ''
              }));
            } else {
              // Map fresh intervention history with enhanced teacher remarks preservation
              objective.interventionHistory = (categoryData.interventionHistory || []).map((attempt, index) => {
              const attemptNumber = attempt.attemptNumber || (index + 1);

              // ✅ ENHANCED: Try multiple matching strategies for teacher remarks preservation
              let teacherRemarks = '';

              // Strategy 1: Match by attemptNumber
              let originalAttempt = originalHistory.find(original => original.attemptNumber === attemptNumber);

              // Strategy 2: If no match by attemptNumber, try matching by index for backwards compatibility
              if (!originalAttempt && originalHistory[index]) {
                originalAttempt = originalHistory[index];
                console.log(`    ⚠️  Fallback: Using index ${index} for attemptNumber ${attemptNumber}`);
              }

              // Strategy 3: If still no match, try matching by score and date proximity
              if (!originalAttempt) {
                originalAttempt = originalHistory.find(original =>
                  Math.abs((original.score || 0) - (attempt.score || 0)) <= 5 // Similar score (within 5%)
                );
              }

              // Extract teacher remarks if found
              if (originalAttempt) {
                teacherRemarks = originalAttempt.teacherRemarks || '';
                if (teacherRemarks) {
                  console.log(`    ✅ Preserved teacher remarks for attempt ${attemptNumber}: "${teacherRemarks}"`);
                }
              } else {
                console.log(`    ⚠️  No original attempt found for attemptNumber ${attemptNumber}`);
              }

              return {
                attemptNumber: attemptNumber,
                score: attempt.score || 0,
                isPassed: attempt.isPassed || false,
                attemptedAt: attempt.attemptedAt || attempt.completedAt || new Date(),
                reason: attempt.attemptReason || attempt.reason || 'intervention_attempt',
                revisionNumber: attempt.revisionNumber || 1,
                // ✅ ENHANCED: Preserve teacher remarks with fallback to original attempt data
                teacherRemarks: teacherRemarks || attempt.teacherRemarks || ''
              };
            });

            // ✅ CRITICAL FIX: If original history has MORE attempts with teacher remarks, preserve them
            const maxAttempts = Math.max(categoryData.interventionHistory.length, originalHistory.length);
            if (originalHistory.length > categoryData.interventionHistory.length) {
              console.log(`    🔄 Original history has more attempts (${originalHistory.length} vs ${categoryData.interventionHistory.length}), preserving extra attempts with teacher remarks`);

              // Add missing attempts from original history that have teacher remarks
              for (let i = categoryData.interventionHistory.length; i < originalHistory.length; i++) {
                const originalAttempt = originalHistory[i];
                if (originalAttempt && originalAttempt.teacherRemarks) {
                  console.log(`    ➕ Adding extra attempt ${originalAttempt.attemptNumber} with teacher remarks: "${originalAttempt.teacherRemarks}"`);
                  objective.interventionHistory.push({
                    attemptNumber: originalAttempt.attemptNumber || (i + 1),
                    score: originalAttempt.score || 0,
                    isPassed: originalAttempt.isPassed || false,
                    attemptedAt: originalAttempt.attemptedAt || new Date(),
                    reason: originalAttempt.reason || 'intervention_attempt',
                    revisionNumber: originalAttempt.revisionNumber || 1,
                    teacherRemarks: originalAttempt.teacherRemarks || ''
                  });
                }
              }
            }
            }  // ✅ Close the "else" block for enhanced intervention mapping

            // Set latest intervention data - use intervention history from objective (which now has preserved data)
            const latestAttempt = objective.interventionHistory?.length > 0
              ? objective.interventionHistory[objective.interventionHistory.length - 1]
              : null;
            objective.latestInterventionScore = latestAttempt?.score || 0;
            objective.latestInterventionPassed = latestAttempt?.isPassed || false;
            objective.interventionImprovement = Math.max(0, (objective.latestInterventionScore || 0) - (objective.assessmentScore || 0));

            // Set intervention status based on completion
            if (objective.latestInterventionPassed) {
              objective.interventionStatus = 'completed_passed';
              objective.interventionName = `${objective.categoryName} Intervention - Passed`;
            } else {
              objective.interventionStatus = categoryData.interventionCompleted ? 'completed_failed' : 'in_progress';
              objective.interventionName = `${objective.categoryName} Intervention - ${categoryData.interventionCompleted ? 'Failed' : 'In Progress'}`;
            }

            objective.interventionCreatedAt = categoryData.interventionHistory[0]?.attemptedAt || new Date();

            console.log(`  📊 Updated ${objective.categoryName}: ${objective.interventionAttempts} attempts, latest: ${objective.latestInterventionScore}%`);
          } else {
            // No intervention data - clear intervention fields but preserve teacher data
            objective.hasIntervention = false;
            objective.interventionId = null;
            objective.interventionName = '';
            objective.interventionStatus = null;
            objective.interventionAttempts = 0;
            objective.interventionCompleted = false;
            objective.interventionHistory = [];
            objective.latestInterventionScore = 0;
            objective.latestInterventionPassed = false;
            objective.interventionImprovement = 0;
            objective.interventionCreatedAt = null;
          }

          // ✅ PRESERVE TEACHER DATA - This is the key fix!
          const teacherData = originalTeacherData[objective.categoryName];
          if (teacherData) {
            objective.supportLevel = teacherData.supportLevel;
            objective.remarks = teacherData.remarks;
            objective.mainAssessmentRemarks = teacherData.mainAssessmentRemarks; // ✅ RESTORE main assessment remarks
            console.log(`  ✅ Preserved teacher data for ${objective.categoryName}: Support=${teacherData.supportLevel || 'none'}, Remarks=${teacherData.remarks ? 'yes' : 'none'}, MainRemarks=${teacherData.mainAssessmentRemarks ? 'yes' : 'none'}`);
          }

          objective.lastUpdated = new Date();
        }

        return objective;
      });

      await iepReport.save();

      console.log('✅ Intervention data refreshed successfully WITH teacher data preserved');

      res.json({
        success: true,
        message: 'Intervention data refreshed successfully (teacher data preserved)',
        data: iepReport
      });
      
    } catch (error) {
      console.error('Error refreshing intervention data:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to refresh intervention data',
        message: error.message
      });
    }
  }
  
  // Get all IEP reports for a class or multiple students
  static async getClassIEPReports(req, res) {
    try {
      const { studentIds, academicYear } = req.query;
      
      // Build query
      const query = { isActive: true };
      
      if (studentIds) {
        const ids = studentIds.split(',').map(id => new mongoose.Types.ObjectId(id));
        query.studentId = { $in: ids };
      }
      
      if (academicYear) {
        query.academicYear = academicYear;
      }
      
      const iepReports = await IEPReport.find(query)
        .populate('studentId', 'idNumber firstName lastName readingLevel')
        .populate('lastModifiedBy', 'firstName lastName')
        .sort({ updatedAt: -1 });
      
      res.json({
        success: true,
        data: iepReports,
        count: iepReports.length
      });
      
    } catch (error) {
      console.error('Error getting class IEP reports:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to retrieve class IEP reports',
        message: error.message
      });
    }
  }
  
  // New method - Update support level directly by objective ID
  static async updateObjectiveSupportLevel(req, res) {
    try {
      const { objectiveId } = req.params;
      const { supportLevel, studentId } = req.body;

      console.log(`Updating support level for objective ${objectiveId} to ${supportLevel}`);
      
      // Validate support level - null is allowed to uncheck
      if (supportLevel !== null && !['minimal', 'moderate', 'extensive'].includes(supportLevel)) {
        return res.status(400).json({ 
          success: false, 
          message: 'Invalid support level. Must be minimal, moderate, extensive, or null.'
        });
      }
      
      // Find the IEP report containing this objective
      const iepReport = await IEPReport.findOne({ 
        "objectives._id": objectiveId,
        studentId: studentId
      });
      
      if (!iepReport) {
        return res.status(404).json({ 
          success: false, 
          message: 'IEP report or objective not found' 
        });
      }
      
      // Find the objective in the array
      const objectiveIndex = iepReport.objectives.findIndex(
        obj => obj._id.toString() === objectiveId
      );
      
      if (objectiveIndex === -1) {
        return res.status(404).json({ 
          success: false, 
          message: 'Objective not found in IEP report' 
        });
      }
      
      // Update the support level
      iepReport.objectives[objectiveIndex].supportLevel = supportLevel;
      iepReport.objectives[objectiveIndex].lastUpdated = new Date();
      
      // Save the updated report
      await iepReport.save();
      
      return res.status(200).json({
        success: true,
        message: 'Support level updated successfully',
        data: iepReport.objectives[objectiveIndex]
      });
      
    } catch (error) {
      console.error('Error updating objective support level:', error);
      return res.status(500).json({ 
        success: false, 
        message: 'Error updating support level', 
        error: error.message 
      });
    }
  }

  // Send progress report to parent and save PDF
  static async sendReportToParent(req, res) {
    try {
      const { studentId } = req.params;
      const { parentId, subject, content, pdfS3Path, includeProgressReport } = req.body;
      
      console.log(`Sending progress report to parent for student: ${studentId}`);
      console.log(`PDF S3 path: ${pdfS3Path || 'None'}`);
      
      // Validate studentId
      if (!mongoose.Types.ObjectId.isValid(studentId)) {
        return res.status(400).json({ 
          success: false,
          error: 'Invalid student ID format' 
        });
      }
      
      // Validate parentId
      if (!parentId || !mongoose.Types.ObjectId.isValid(parentId)) {
        return res.status(400).json({
          success: false,
          error: 'Valid parent ID is required'
        });
      }
      
      // Validate basic required fields
      if (!subject || !content) {
        return res.status(400).json({
          success: false,
          error: 'Subject and content are required'
        });
      }
      
      // Get access to the 'parent' database
      const parentDb = mongoose.connection.useDb('parent');
      const childPdfCollection = parentDb.collection('child_pdf');
      
      // Get teacher profile ID from users collection
      let teacherId = null;
      if (req.user && req.user.id) {
        try {
          const teacherDb = mongoose.connection.useDb('teachers');
          const teacherProfileCollection = teacherDb.collection('profile');
          
          // Find teacher profile using userId from users_web
          const teacherProfile = await teacherProfileCollection.findOne({
            userId: new mongoose.Types.ObjectId(req.user.id)
          });
          
          if (teacherProfile) {
            teacherId = teacherProfile._id;
            console.log(`Found teacher profile with ID: ${teacherId}`);
          } else {
            // Try to find by the known ID
            const knownId = '6818bae0e9bed4ff08ab7e8c';
            if (mongoose.Types.ObjectId.isValid(knownId)) {
              const objId = new mongoose.Types.ObjectId(knownId);
              const knownProfile = await teacherProfileCollection.findOne({ _id: objId });
              
              if (knownProfile) {
                teacherId = knownProfile._id;
                console.log(`Using known teacher profile with ID: ${teacherId}`);
              } else {
                console.warn(`No teacher profile found for user ID: ${req.user.id}`);
              }
            }
          }
        } catch (error) {
          console.error('Error fetching teacher profile:', error);
        }
      }
      
      // Create PDF record
      const pdfRecord = {
        studentId: new mongoose.Types.ObjectId(studentId),
        parentId: new mongoose.Types.ObjectId(parentId),
        teacherId: teacherId ? new mongoose.Types.ObjectId(teacherId) : null,
        subject: subject,
        content: content,
        pdfS3Path: pdfS3Path, // Store S3 path instead of raw PDF data
        includeProgressReport: !!includeProgressReport,
        sentAt: new Date(),
        status: 'sent'
      };
      
      // Insert record into the child_pdf collection
      try {
        const result = await childPdfCollection.insertOne(pdfRecord);
        
        if (!result.acknowledged) {
          throw new Error('Failed to save progress report record');
        }
        
        // Get student and parent info for logging
        const testDb = mongoose.connection.useDb('test');
        const usersCollection = testDb.collection('users');
        
        const student = await usersCollection.findOne({ 
          _id: new mongoose.Types.ObjectId(studentId)
        });
        
        const parent = await usersCollection.findOne({
          _id: new mongoose.Types.ObjectId(parentId) 
        });
        
        console.log(`✅ Sent progress report for ${student?.firstName || 'student'} ${student?.lastName || ''} to parent ${parent?.firstName || 'parent'} ${parent?.lastName || ''}`);
        
        res.json({
          success: true,
          data: {
            id: result.insertedId,
            studentId,
            parentId,
            sentAt: pdfRecord.sentAt,
            pdfS3Path: pdfRecord.pdfS3Path
          },
          message: 'Progress report sent successfully'
        });
      } catch (dbError) {
        console.error('Database error when saving progress report:', dbError);
        return res.status(500).json({
          success: false,
          error: 'Failed to save progress report to database',
          message: dbError.message
        });
      }
      
    } catch (error) {
      console.error('Error sending progress report:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to send progress report',
        message: error.message
      });
    }
  }

  // Get previous PDF reports for a student
  static async getPreviousPdfReports(req, res) {
    try {
      const { studentId } = req.params;
      
      console.log(`Getting previous PDF reports for student: ${studentId}`);
      
      // Validate studentId
      if (!mongoose.Types.ObjectId.isValid(studentId)) {
        return res.status(400).json({
          success: false,
          error: 'Invalid student ID format'
        });
      }
      
      // Get the parent database
      const parentDb = mongoose.connection.useDb('parent');
      const childPdfCollection = parentDb.collection('child_pdf');
      
      // Find all reports for this student
      const reports = await childPdfCollection.find({
        studentId: new mongoose.Types.ObjectId(studentId)
      })
      .sort({ sentAt: -1 }) // Most recent first
      .project({
        _id: 1,
        subject: 1,
        content: 1,
        pdfS3Path: 1,
        sentAt: 1,
        parentId: 1
      }) // Don't include the full PDF data
      .toArray();
      
      console.log(`Found ${reports.length} reports for student ${studentId}`);
      
      res.json({
        success: true,
        data: reports,
        count: reports.length
      });
      
    } catch (error) {
      console.error('Error getting previous PDF reports:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to retrieve previous reports',
        message: error.message
      });
    }
  }

  // Update main assessment remark for an objective
  static async updateMainAssessmentRemark(req, res) {
    try {
      const { studentId, objectiveId } = req.params;
      const { remark } = req.body;

      console.log(`Updating main assessment remark for student ${studentId}, objective ${objectiveId}`);

      // Validate inputs
      if (!mongoose.Types.ObjectId.isValid(studentId)) {
        return res.status(400).json({
          success: false,
          error: 'Invalid student ID format'
        });
      }

      if (!mongoose.Types.ObjectId.isValid(objectiveId)) {
        return res.status(400).json({
          success: false,
          error: 'Invalid objective ID format'
        });
      }

      // Find the IEP report
      const iepReport = await IEPReport.findOne({
        studentId: new mongoose.Types.ObjectId(studentId),
        isActive: true
      });

      if (!iepReport) {
        return res.status(404).json({
          success: false,
          error: 'IEP report not found'
        });
      }

      // Find the objective
      const objective = iepReport.objectives.id(objectiveId);
      if (!objective) {
        return res.status(404).json({
          success: false,
          error: 'Objective not found'
        });
      }

      // Update the main assessment remark
      objective.mainAssessmentRemarks = remark || '';
      objective.lastUpdated = new Date();
      iepReport.lastModifiedBy = req.user?.id;

      await iepReport.save();

      console.log(`✅ Successfully updated main assessment remark for ${objective.categoryName}`);

      res.json({
        success: true,
        message: 'Main assessment remark updated successfully',
        data: {
          objectiveId: objectiveId,
          remark: remark || '',
          updatedAt: objective.lastUpdated
        }
      });

    } catch (error) {
      console.error('Error updating main assessment remark:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to update main assessment remark',
        message: error.message
      });
    }
  }

  // Update attempt remark for a specific intervention attempt
  static async updateAttemptRemark(req, res) {
    try {
      const { studentId, objectiveId, attemptIndex } = req.params;
      const { remark } = req.body;

      console.log(`Updating attempt remark for student ${studentId}, objective ${objectiveId}, attempt ${attemptIndex}`);

      // Validate inputs
      if (!mongoose.Types.ObjectId.isValid(studentId)) {
        return res.status(400).json({
          success: false,
          error: 'Invalid student ID format'
        });
      }

      if (!mongoose.Types.ObjectId.isValid(objectiveId)) {
        return res.status(400).json({
          success: false,
          error: 'Invalid objective ID format'
        });
      }

      const attemptIndexNum = parseInt(attemptIndex);
      if (isNaN(attemptIndexNum) || attemptIndexNum < 0) {
        return res.status(400).json({
          success: false,
          error: 'Invalid attempt index'
        });
      }

      // Find the IEP report
      const iepReport = await IEPReport.findOne({
        studentId: new mongoose.Types.ObjectId(studentId),
        isActive: true
      });

      if (!iepReport) {
        return res.status(404).json({
          success: false,
          error: 'IEP report not found'
        });
      }

      // Find the objective
      const objective = iepReport.objectives.id(objectiveId);
      if (!objective) {
        return res.status(404).json({
          success: false,
          error: 'Objective not found'
        });
      }

      // Check if intervention history exists and has the specified attempt
      if (!objective.interventionHistory || !Array.isArray(objective.interventionHistory)) {
        return res.status(404).json({
          success: false,
          error: 'No intervention history found for this objective'
        });
      }

      if (attemptIndexNum >= objective.interventionHistory.length) {
        return res.status(404).json({
          success: false,
          error: `Attempt index ${attemptIndexNum} not found. This objective has ${objective.interventionHistory.length} attempts.`
        });
      }

      // Update the remark for the specific attempt
      objective.interventionHistory[attemptIndexNum].teacherRemarks = remark || '';
      objective.lastUpdated = new Date();
      iepReport.lastModifiedBy = req.user?.id;

      await iepReport.save();

      console.log(`✅ Successfully updated attempt ${attemptIndexNum} remark for ${objective.categoryName}`);

      res.json({
        success: true,
        message: 'Attempt remark updated successfully',
        data: {
          objectiveId: objectiveId,
          attemptIndex: attemptIndexNum,
          remark: remark || '',
          updatedAt: objective.lastUpdated
        }
      });

    } catch (error) {
      console.error('Error updating attempt remark:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to update attempt remark',
        message: error.message
      });
    }
  }

  // Basic fallback refresh method when no category results are found
  static async basicRefreshIntervention(req, res, iepReport) {
    try {
      console.log('⚠️ Using basic refresh fallback - preserving existing teacher data');

      // Store original teacher data
      const originalTeacherData = {};
      iepReport.objectives.forEach(obj => {
        originalTeacherData[obj.categoryName] = {
          supportLevel: obj.supportLevel,
          remarks: obj.remarks,
          interventionHistory: obj.interventionHistory ? [...obj.interventionHistory] : []
        };
      });

      // Update timestamps without losing teacher data
      iepReport.objectives.forEach(objective => {
        // Preserve teacher data
        const teacherData = originalTeacherData[objective.categoryName];
        if (teacherData) {
          objective.supportLevel = teacherData.supportLevel;
          objective.remarks = teacherData.remarks;
          // Keep existing intervention history as-is
          if (teacherData.interventionHistory.length > 0) {
            objective.interventionHistory = teacherData.interventionHistory;
          }
        }

        objective.lastUpdated = new Date();
      });

      await iepReport.save();

      console.log('✅ Basic refresh completed with teacher data preserved');

      return res.json({
        success: true,
        message: 'IEP report refreshed (basic mode - teacher data preserved)',
        data: iepReport
      });

    } catch (error) {
      console.error('Error in basic refresh:', error);
      return res.status(500).json({
        success: false,
        error: 'Failed to refresh IEP report',
        message: error.message
      });
    }
  }

  // ✅ NEW METHOD: Handle reading level progression with proper IEP record preservation
  static async handleReadingLevelProgression(studentId, newReadingLevel, categoryResults, teacherId) {
    try {
      console.log(`🚀 READING LEVEL PROGRESSION: Student ${studentId} → ${newReadingLevel}`);

      // Get student information
      const testDb = mongoose.connection.useDb('test');
      const usersCollection = testDb.collection('users');
      const student = await usersCollection.findOne({
        _id: new mongoose.Types.ObjectId(studentId)
      });

      if (!student) {
        throw new Error('Student not found');
      }

      const previousReadingLevel = student.readingLevel;
      console.log(`📚 Progression: ${previousReadingLevel} → ${newReadingLevel}`);

      // ✅ STEP 1: Mark previous IEP as completed (NOT deleted - preserve history)
      if (previousReadingLevel && previousReadingLevel !== newReadingLevel) {
        const previousIEPs = await IEPReport.find({
          studentId: new mongoose.Types.ObjectId(studentId),
          readingLevel: previousReadingLevel,
          isActive: true
        });

        for (const previousIEP of previousIEPs) {
          previousIEP.isActive = false; // Mark as historical, not deleted
          previousIEP.completedAt = new Date();
          previousIEP.completionReason = `Reading level progression to ${newReadingLevel}`;
          await previousIEP.save();
          console.log(`✅ Preserved historical IEP: ${previousIEP._id} (${previousReadingLevel})`);
        }
      }

      // ✅ STEP 2: Create NEW IEP for the new reading level
      const newIEPData = {
        studentId: new mongoose.Types.ObjectId(studentId),
        studentNumber: student.idNumber.toString(),
        readingLevel: newReadingLevel,
        overallScore: categoryResults.overallScore || 0,
        basedOnAssessmentId: categoryResults._id,
        lastModifiedBy: teacherId,
        isActive: true, // New IEP is now active
        academicYear: new Date().getFullYear().toString(),
        progressionFrom: previousReadingLevel, // Track where student came from
        progressionDate: new Date()
      };

      const newIEPReport = new IEPReport(newIEPData);
      newIEPReport.generateObjectivesFromCategoryResults(categoryResults);
      await newIEPReport.save();

      console.log(`✅ Created new IEP for ${newReadingLevel}: ${newIEPReport._id}`);

      return {
        success: true,
        previousIEP: {
          readingLevel: previousReadingLevel,
          preserved: true,
          status: 'historical'
        },
        newIEP: {
          id: newIEPReport._id,
          readingLevel: newReadingLevel,
          status: 'active'
        },
        message: `Successfully progressed from ${previousReadingLevel} to ${newReadingLevel} with historical IEP preservation`
      };

    } catch (error) {
      console.error('Error handling reading level progression:', error);
      throw error;
    }
  }

  // ✅ NEW HTTP ENDPOINT: Handle reading level progression request
  static async handleReadingLevelProgressionRequest(req, res) {
    try {
      const { studentId } = req.params;

      console.log(`🚀 HTTP ENDPOINT: Reading level progression request for student ${studentId}`);

      // Get student information using student number (like other IEP operations)
      const testDb = mongoose.connection.useDb('test');
      const usersCollection = testDb.collection('users');

      // First try to find by numeric ID (student number)
      let student = await usersCollection.findOne({ idNumber: parseInt(studentId) });

      // If not found, try ObjectId format for backward compatibility
      if (!student && mongoose.Types.ObjectId.isValid(studentId)) {
        student = await usersCollection.findOne({
          _id: new mongoose.Types.ObjectId(studentId)
        });
      }

      if (!student) {
        return res.status(404).json({
          success: false,
          error: 'Student not found'
        });
      }

      // For now, we'll implement a simple progression to the next level
      // TODO: Add logic to validate student is ready for progression
      const currentLevel = student.readingLevel;
      const levelProgression = {
        'Low Emerging': 'High Emerging',
        'High Emerging': 'Developing',
        'Developing': 'Transitioning',
        'Transitioning': 'At Grade Level'
      };

      const newLevel = levelProgression[currentLevel];

      if (!newLevel) {
        return res.status(400).json({
          success: false,
          error: `Student is already at the highest level (${currentLevel})`
        });
      }

      // Update student's reading level using their ObjectId
      await usersCollection.updateOne(
        { _id: student._id },
        {
          $set: {
            readingLevel: newLevel,
            updatedAt: new Date()
          }
        }
      );

      console.log(`✅ Student ${student.idNumber} (${student._id}) progressed from ${currentLevel} to ${newLevel}`);

      // ✅ ENHANCED: Create new category_results for the new reading level
      await IEPController.createCategoryResultsForNewLevel(student.idNumber, newLevel, currentLevel);

      // ✅ COORDINATION FIX: Create new IEP report for the new reading level
      console.log(`📋 Creating new IEP report for reading level: ${newLevel}`);
      try {
        const categoryResults = await testDb.collection('category_results').findOne({
          studentId: parseInt(student.idNumber),
          readingLevel: newLevel
        });

        if (categoryResults) {
          await IEPController.createIEPFromCategoryResults(student.idNumber, categoryResults);
          console.log(`✅ Created new IEP report for ${newLevel} level`);
        }
      } catch (iepError) {
        console.warn(`⚠️ IEP report creation failed: ${iepError.message}`);
        // Don't fail the progression, just log the warning
      }

      res.json({
        success: true,
        data: {
          studentId: student.idNumber,
          studentObjectId: student._id,
          previousLevel: currentLevel,
          newReadingLevel: newLevel,
          progressedAt: new Date()
        },
        message: `Student successfully progressed from ${currentLevel} to ${newLevel}`
      });

    } catch (error) {
      console.error('Error in reading level progression endpoint:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to progress reading level',
        message: error.message
      });
    }
  }

  // ✅ SIMPLIFIED: Create category_results for new reading level after progression
  static async createCategoryResultsForNewLevel(studentId, newLevel, previousLevel) {
    try {
      console.log(`🚀 PROGRESSION: ${studentId} from ${previousLevel} → ${newLevel}`);

      const testDb = mongoose.connection.useDb('test');
      const categoryResultsCollection = testDb.collection('category_results');

      // ✅ STEP 1: Find and preserve existing category data
      console.log(`📊 STEP 1: Finding existing category_results...`);

      let existingResult = null;
      const queries = [
        { studentId: parseInt(studentId) },
        { studentId: studentId.toString() },
        { studentId: studentId }
      ];

      for (const query of queries) {
        const results = await categoryResultsCollection
          .find(query)
          .sort({ assessmentDate: -1 })
          .limit(1)
          .toArray();

        if (results?.length > 0) {
          existingResult = results[0];
          console.log(`📊 ✅ Found existing record: ${existingResult._id}`);
          break;
        }
      }

      // ✅ STEP 2: Define categories for each reading level
      const levelCategories = {
        'Low Emerging': ['Alphabet Knowledge'],
        'High Emerging': ['Alphabet Knowledge', 'Phonological Awareness'],
        'Developing': ['Alphabet Knowledge', 'Phonological Awareness', 'Decoding'],
        'Transitioning': ['Alphabet Knowledge', 'Phonological Awareness', 'Decoding', 'Word Recognition'],
        'At Grade Level': ['Alphabet Knowledge', 'Phonological Awareness', 'Decoding', 'Word Recognition', 'Reading Comprehension']
      };

      const newCategories = levelCategories[newLevel] || [];
      console.log(`📋 New level (${newLevel}) requires: ${newCategories.join(', ')}`);

      // ✅ STEP 3: Create categories with preserved data AND main_assessment integration
      const mainAssessmentCollection = testDb.collection('main_assessment');

      const categories = await Promise.all(newCategories.map(async categoryName => {
        // Check if this category exists in previous level and preserve its data
        const existingCategory = existingResult?.categories?.find(cat => cat.categoryName === categoryName);

        // ✅ COORDINATION FIX: Fetch totalQuestions from main_assessment
        let totalQuestions = 0;
        try {
          const mainAssessment = await mainAssessmentCollection.findOne({
            readingLevel: newLevel,
            category: categoryName,
            isActive: true
          });
          totalQuestions = mainAssessment?.questions?.length || 0;
          console.log(`📊 ${categoryName}: ${totalQuestions} questions from main_assessment (${newLevel})`);
        } catch (assessmentError) {
          console.warn(`⚠️ Could not fetch main_assessment for ${categoryName}: ${assessmentError.message}`);
        }

        // ✅ ENHANCED DATA SANITIZATION: Check for existing student_responses for this category in the new reading level
        const studentResponsesCollection = testDb.collection('student_responses');

        console.log(`🔍 DATA SANITIZATION: Checking for existing student_responses for ${categoryName} in ${newLevel}`);
        const existingResponses = await studentResponsesCollection.find({
          studentId: parseInt(studentId),
          category: categoryName,
          readingLevel: newLevel
        }).toArray();

        console.log(`📊 Found ${existingResponses.length} existing responses for ${categoryName} (expected: ${totalQuestions})`);

        // ✅ DATA SANITIZATION: Only populate scores when assessment is COMPLETELY finished
        const isAssessmentComplete = existingResponses.length >= totalQuestions && totalQuestions > 0;

        let categoryData = {
          categoryName: categoryName,
          totalQuestions: totalQuestions, // ✅ FIXED: Use actual count from main_assessment
          correctAnswers: 0,
          totalPossibleMatches: 0,
          correctMatches: 0,
          score: 0,
          isPassed: false,
          passingThreshold: 75,
          isCompleted: false,
          lastQuestionAnswered: '',
          interventionRequired: false,
          interventionAttempts: 0,
          interventionCompleted: false,
          currentInterventionId: null,
          interventionHistory: [],
          _id: new mongoose.Types.ObjectId()
        };

        if (isAssessmentComplete) {
          console.log(`✅ DATA SANITIZATION: Assessment complete for ${categoryName}, calculating actual scores...`);

          // Calculate actual scores using same logic as CategoryResultsService
          let correctAnswers = 0;
          let totalPossibleMatches = 0;
          let correctMatches = 0;

          existingResponses.forEach(response => {
            if (response.isCorrect) {
              correctAnswers++;
            }

            // Handle Phonological Awareness matching questions
            if (categoryName === 'Phonological Awareness' && response.totalMatches) {
              totalPossibleMatches += response.totalMatches;
              correctMatches += response.correctMatches || 0;
            }
          });

          // Calculate score based on category type
          let score = 0;
          if (categoryName === 'Phonological Awareness' && totalPossibleMatches > 0) {
            score = Math.round((correctMatches / totalPossibleMatches) * 100);
          } else if (totalQuestions > 0) {
            score = Math.round((correctAnswers / totalQuestions) * 100);
          }

          const isPassed = score >= 75;

          // Find last question answered
          const sortedResponses = existingResponses.sort((a, b) =>
            new Date(b.answeredAt || b.createdAt) - new Date(a.answeredAt || a.createdAt)
          );
          const lastQuestionAnswered = sortedResponses[0]?.questionId || '';

          categoryData = {
            ...categoryData,
            correctAnswers: correctAnswers,
            totalPossibleMatches: totalPossibleMatches,
            correctMatches: correctMatches,
            score: score,
            isPassed: isPassed,
            isCompleted: true,
            lastQuestionAnswered: lastQuestionAnswered,
            interventionRequired: !isPassed
          };

          console.log(`🎯 ${categoryName}: ${correctAnswers}/${totalQuestions} correct, score: ${score}%, passed: ${isPassed}`);
          if (categoryName === 'Phonological Awareness') {
            console.log(`  📊 Matching: ${correctMatches}/${totalPossibleMatches} matches correct`);
          }
        } else {
          console.log(`⏳ ${categoryName}: Assessment incomplete (${existingResponses.length}/${totalQuestions}), using placeholder`);
        }

        return categoryData;
      }));

      // ✅ STEP 4: Calculate overall metrics for new record
      const completedCategories = categories.filter(cat => cat.isCompleted).length;
      const passedCategories = categories.filter(cat => cat.isPassed).length;
      const allCategoriesPassed = categories.length > 0 && categories.every(cat => cat.isPassed);
      const overallScore = categories.length > 0
        ? Math.round(categories.reduce((sum, cat) => sum + (cat.score || 0), 0) / categories.length)
        : 0;

      console.log(`📊 METRICS: ${passedCategories}/${categories.length} passed, overall: ${overallScore}%`);

      // ✅ STEP 5: Create new category_results record
      const newCategoryResult = {
        studentId: parseInt(studentId), // Ensure consistent format
        assessmentDate: new Date(),
        categories: categories,
        overallScore: overallScore,
        completedCategories: completedCategories,
        totalCategories: categories.length,
        allCategoriesPassed: allCategoriesPassed,
        readingLevel: newLevel,
        readingLevelUpdated: false, // ✅ FIX: Set to false so record can be modified by auto-processing
        progressionFrom: previousLevel,
        progressionDate: new Date(),
        createdAt: new Date(),
        updatedAt: new Date()
      };

      // ✅ STEP 6: ATOMIC TRANSACTION - Delete old, insert new (ensures no multiple records)
      console.log(`🔒 STEP 6: Starting atomic transaction for DELETE-INSERT operation...`);

      const session = await mongoose.startSession();

      try {
        await session.withTransaction(async () => {
          // Delete old record within transaction
          if (existingResult) {
            const deleteResult = await categoryResultsCollection.deleteOne(
              { _id: existingResult._id },
              { session }
            );
            if (deleteResult.deletedCount > 0) {
              console.log(`🗑️ ✅ Deleted old record: ${existingResult._id}`);
            } else {
              throw new Error(`Failed to delete old record: ${existingResult._id}`);
            }
          }

          // Insert new record within same transaction
          const insertResult = await categoryResultsCollection.insertOne(newCategoryResult, { session });
          if (!insertResult.insertedId) {
            throw new Error('Failed to create new category_results record');
          }

          console.log(`✨ ✅ Created new record: ${insertResult.insertedId} for ${newLevel}`);
          console.log(`🔒 ✅ ATOMIC SUCCESS: ${studentId} progression complete: ${previousLevel} → ${newLevel}`);
        });
      } finally {
        await session.endSession();
      }

    } catch (error) {
      console.error('Error creating category_results for new level:', error);
      throw error;
    }
  }

  // ✅ NEW METHOD: Get IEP history for a student (all reading levels)
  static async getIEPHistory(req, res) {
    try {
      const { studentId } = req.params;
      const { academicYear } = req.query;

      console.log(`Getting IEP history for student: ${studentId}`);

      if (!mongoose.Types.ObjectId.isValid(studentId)) {
        return res.status(400).json({
          success: false,
          error: 'Invalid student ID format'
        });
      }

      // Build query for ALL IEP records (not just active)
      const query = {
        studentId: new mongoose.Types.ObjectId(studentId)
      };

      if (academicYear) {
        query.academicYear = academicYear;
      }

      // Get ALL IEP records for this student, sorted by creation date
      const iepHistory = await IEPReport.find(query)
        .sort({ createdAt: -1 })
        .populate('studentId', 'idNumber firstName lastName readingLevel')
        .populate('lastModifiedBy', 'firstName lastName');

      console.log(`📚 Found ${iepHistory.length} IEP records for student ${studentId}`);

      // ✅ Group by reading level for better organization
      const groupedHistory = {};
      iepHistory.forEach(iep => {
        if (!groupedHistory[iep.readingLevel]) {
          groupedHistory[iep.readingLevel] = [];
        }
        groupedHistory[iep.readingLevel].push(iep);
      });

      res.json({
        success: true,
        data: {
          totalRecords: iepHistory.length,
          byReadingLevel: groupedHistory,
          chronological: iepHistory
        },
        message: `Found ${iepHistory.length} IEP records across ${Object.keys(groupedHistory).length} reading levels`
      });

    } catch (error) {
      console.error('Error getting IEP history:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to retrieve IEP history',
        message: error.message
      });
    }
  }

  // ✅ MISSING FUNCTION: Create fresh IEP report for new reading level during progression
  static async createIEPFromCategoryResults(studentId, categoryResults) {
    try {
      console.log(`📋 IEP PROGRESSION: Creating fresh IEP for student ${studentId}, level ${categoryResults.readingLevel}`);

      // ✅ STEP 1: Get student information
      const User = require('../../../models/userModel');
      const student = await User.findOne({ idNumber: parseInt(studentId) });
      if (!student) {
        throw new Error(`Student not found: ${studentId}`);
      }

      // ✅ STEP 2: Preserve existing IEP reports (set isActive: false)
      console.log(`📚 PRESERVING: Setting existing IEP reports to inactive for student ${studentId}`);
      await IEPReport.updateMany(
        {
          studentId: student._id,
          isActive: true
        },
        {
          $set: {
            isActive: false,
            completedAt: new Date(),
            completionReason: `Progressed to ${categoryResults.readingLevel}`
          }
        }
      );

      // ✅ STEP 3: Determine progression source (find previous level)
      const currentLevel = categoryResults.readingLevel;
      const levelOrder = ['Low Emerging', 'High Emerging', 'Developing', 'Transitioning', 'At Grade Level'];
      const currentIndex = levelOrder.indexOf(currentLevel);
      const previousLevel = currentIndex > 0 ? levelOrder[currentIndex - 1] : null;

      // ✅ STEP 4: Create fresh IEP report with placeholder objectives
      console.log(`✨ CREATING: Fresh IEP report for ${currentLevel} level`);
      const freshIEPReport = new IEPReport({
        studentId: student._id,
        studentNumber: studentId.toString(),
        readingLevel: currentLevel,
        overallScore: categoryResults.overallScore || 0,
        basedOnAssessmentId: categoryResults._id,
        isActive: true,
        academicYear: new Date().getFullYear().toString(),

        // ✅ PROGRESSION TRACKING (per CLAUDE.md)
        progressionFrom: previousLevel,
        progressionDate: new Date(),

        // Initialize with empty objectives (will be populated below)
        objectives: []
      });

      // ✅ STEP 5: Generate fresh placeholder objectives using model method
      freshIEPReport.generateObjectivesFromCategoryResults(categoryResults);

      // ✅ STEP 6: Override objectives to ensure they are fresh placeholders
      console.log(`🎯 OBJECTIVES: Creating fresh placeholders for ${currentLevel} level`);
      freshIEPReport.objectives = freshIEPReport.objectives.map(objective => ({
        ...objective,
        // ✅ FRESH PLACEHOLDERS - Reset all progress tracking
        status: 'not_started',
        completed: false,
        score: 0,
        assessmentScore: 0,
        correctAnswers: 0,
        isCompleted: false,
        isPassed: false,
        hasIntervention: false,
        interventionId: null,
        interventionName: '',
        interventionStatus: 'not_needed',
        interventionAttempts: 0,
        interventionCompleted: false,
        interventionHistory: [],
        latestInterventionScore: 0,
        latestInterventionPassed: false,
        interventionImprovement: 0,
        interventionCreatedAt: null,
        supportLevel: 'extensive', // Default support level for new level
        remarks: '',
        mainAssessmentRemarks: '',
        lastUpdated: new Date()
      }));

      // ✅ STEP 7: Save the fresh IEP report
      const savedIEPReport = await freshIEPReport.save();

      console.log(`✅ IEP PROGRESSION COMPLETE: Created fresh IEP report ${savedIEPReport._id}`);
      console.log(`📊 Fresh objectives created: ${savedIEPReport.objectives.length} categories`);
      console.log(`🔄 Progression: ${previousLevel} → ${currentLevel}`);

      return savedIEPReport;

    } catch (error) {
      console.error(`❌ IEP PROGRESSION ERROR: Failed to create IEP for student ${studentId}:`, error);
      throw new Error(`IEP creation failed: ${error.message}`);
    }
  }

  // ✅ NEW: Fix category isPassed status when intervention succeeded but status not updated
  static async fixCategoryPassedStatus(req, res) {
    try {
      const { studentId } = req.params;

      console.log(`🔧 [FIX PASSED STATUS] Starting fix for student ${studentId}`);

      // Get current IEP report
      const iepReport = await IEPReport.findOne({
        studentId: mongoose.Types.ObjectId(studentId),
        isActive: true
      });

      if (!iepReport) {
        return res.status(404).json({
          success: false,
          message: 'No active IEP report found for student'
        });
      }

      let fixedCount = 0;
      const fixedCategories = [];

      // Check each objective for intervention success
      for (const objective of iepReport.objectives) {
        const { categoryName, interventionHistory } = objective;

        // Check if any intervention passed but category still marked as failed
        const hasPassedIntervention = interventionHistory.some(attempt =>
          attempt.isPassed === true && attempt.score >= 75
        );

        if (hasPassedIntervention && !objective.isPassed) {
          // Fix the status
          objective.isPassed = true;
          objective.status = 'mastered';
          objective.interventionCompleted = true;
          objective.interventionRequired = false;

          // Update score to highest intervention score
          const highestScore = Math.max(...interventionHistory.map(h => h.score || 0));
          objective.score = Math.max(objective.score, highestScore);

          fixedCount++;
          fixedCategories.push({
            category: categoryName,
            newStatus: 'mastered',
            newScore: objective.score
          });

          console.log(`✅ [FIX PASSED STATUS] Fixed ${categoryName}: now marked as passed (${objective.score}%)`);
        }
      }

      if (fixedCount > 0) {
        // Save the updated IEP report
        await iepReport.save();

        console.log(`🎉 [FIX PASSED STATUS] Fixed ${fixedCount} categories for student ${studentId}`);

        return res.status(200).json({
          success: true,
          message: `Fixed ${fixedCount} category status issues`,
          data: {
            studentId,
            fixedCount,
            fixedCategories,
            totalObjectives: iepReport.objectives.length
          }
        });
      } else {
        console.log(`ℹ️ [FIX PASSED STATUS] No fixes needed for student ${studentId}`);

        return res.status(200).json({
          success: true,
          message: 'No category status issues found',
          data: {
            studentId,
            fixedCount: 0,
            totalObjectives: iepReport.objectives.length
          }
        });
      }

    } catch (error) {
      console.error(`❌ [FIX PASSED STATUS] Error fixing student ${req.params.studentId}:`, error);
      return res.status(500).json({
        success: false,
        message: 'Failed to fix category passed status',
        error: error.message
      });
    }
  }

}

module.exports = IEPController; 