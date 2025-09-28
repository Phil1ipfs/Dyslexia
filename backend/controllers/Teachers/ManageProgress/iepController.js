const IEPReport = require('../../../models/Teachers/ManageProgress/iepReportModel');
const mongoose = require('mongoose');

class IEPController {
  
  // Get IEP report for a student
  static async getIEPReport(req, res) {
    try {
      const { studentId } = req.params;
      const { academicYear } = req.query;
      
      console.log(`Getting IEP report for student: ${studentId}`);
      
      // Validate studentId
      if (!mongoose.Types.ObjectId.isValid(studentId)) {
        return res.status(400).json({ 
          success: false,
          error: 'Invalid student ID format' 
        });
      }
      
      // Build query
      const query = {
        studentId: new mongoose.Types.ObjectId(studentId),
        isActive: true
      };
      
      if (academicYear) {
        query.academicYear = academicYear;
      }
      
      // Find the most recent IEP report
      let iepReport = await IEPReport.findOne(query)
        .sort({ createdAt: -1 })
        .populate('studentId', 'idNumber firstName lastName readingLevel')
        .populate('lastModifiedBy', 'firstName lastName');
      
      // If no IEP report exists, try to create one from category results
      if (!iepReport) {
        console.log('No IEP report found, attempting to create from category results');
        try {
          iepReport = await IEPController.createFromCategoryResults(studentId, req.user?.id);
          
          // Populate the fields after creation
          if (iepReport) {
            iepReport = await IEPReport.findById(iepReport._id)
              .populate('studentId', 'idNumber firstName lastName readingLevel')
              .populate('lastModifiedBy', 'firstName lastName');
          }
        } catch (createError) {
          console.error('Failed to create IEP from category results:', createError.message);
          return res.status(404).json({
            success: false,
            error: 'No IEP report available and could not create from assessment data',
            details: createError.message
          });
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
                revisionNumber: attempt.revisionNumber || 1
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
        latestResults = await categoryResultsCollection.findOne(
          { studentObjectId: new mongoose.Types.ObjectId(studentId) },
          { sort: { assessmentDate: -1 } }
        );
        if (latestResults) {
          console.log('✅ Found category results using studentObjectId');
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
          latestResults = await categoryResultsCollection.findOne(
            { studentId: student.idNumber },
            { sort: { assessmentDate: -1 } }
          );

          if (latestResults) {
            console.log(`✅ Found category results using student number: ${student.idNumber}`);
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

          // Update comprehensive intervention data
          if (categoryData.interventionHistory && categoryData.interventionHistory.length > 0) {
            objective.hasIntervention = true;
            objective.interventionAttempts = categoryData.interventionAttempts || categoryData.interventionHistory.length;
            objective.interventionCompleted = categoryData.interventionCompleted || false;
            objective.interventionId = categoryData.currentInterventionId || null;

            // Map fresh intervention history - ✅ FIX: Match by attemptNumber instead of array index
            objective.interventionHistory = categoryData.interventionHistory.map((attempt, index) => {
              const attemptNumber = attempt.attemptNumber || (index + 1);

              // ✅ FIX: Find matching teacher remarks by attemptNumber, not array index
              const originalAttempt = originalTeacherData[objective.categoryName]?.interventionHistory?.find(
                original => original.attemptNumber === attemptNumber
              );

              return {
                attemptNumber: attemptNumber,
                score: attempt.score || 0,
                isPassed: attempt.isPassed || false,
                attemptedAt: attempt.attemptedAt || attempt.completedAt || new Date(),
                reason: attempt.attemptReason || attempt.reason || 'intervention_attempt',
                revisionNumber: attempt.revisionNumber || 1,
                // ✅ FIX: Preserve teacher remarks by matching attemptNumber
                teacherRemarks: originalAttempt?.teacherRemarks || attempt.teacherRemarks || ''
              };
            });

            // Set latest intervention data
            const latestAttempt = categoryData.interventionHistory[categoryData.interventionHistory.length - 1];
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
}

module.exports = IEPController; 