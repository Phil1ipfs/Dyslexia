const AutoProcessingService = require('../../services/Teachers/AutoProcessingService');

/**
 * Auto Processing Controller
 * Handles manual triggers and status checks for automatic assessment processing
 */

/**
 * Manually trigger processing of all complete assessments
 * POST /api/auto-processing/process-all
 */
const processAllCompleteAssessments = async (req, res) => {
  try {
    console.log('[AUTO PROCESSING CONTROLLER] Manual trigger for processing all complete assessments');

    const result = await AutoProcessingService.processAllCompleteAssessments();

    res.status(200).json({
      success: true,
      message: 'Auto-processing completed',
      data: {
        summary: result,
        details: {
          totalStudents: result.total,
          newlyProcessed: result.processed,
          alreadyProcessed: result.skipped,
          stillIncomplete: result.incomplete
        }
      }
    });

  } catch (error) {
    console.error('[AUTO PROCESSING CONTROLLER] Error in manual processing:', error);
    res.status(500).json({
      success: false,
      message: 'Error during auto-processing',
      error: error.message
    });
  }
};

/**
 * Process specific student
 * POST /api/auto-processing/process-student/:studentId
 */
const processSpecificStudent = async (req, res) => {
  try {
    const { studentId } = req.params;

    console.log(`[AUTO PROCESSING CONTROLLER] Manual trigger for student ${studentId}`);

    const result = await AutoProcessingService.processSpecificStudent(studentId);

    res.status(200).json({
      success: true,
      message: `Student ${studentId} processing completed`,
      data: result
    });

  } catch (error) {
    console.error(`[AUTO PROCESSING CONTROLLER] Error processing student ${req.params.studentId}:`, error);
    res.status(500).json({
      success: false,
      message: `Error processing student ${req.params.studentId}`,
      error: error.message
    });
  }
};

/**
 * Get auto-processing status
 * GET /api/auto-processing/status
 */
const getProcessingStatus = async (req, res) => {
  try {
    const status = await AutoProcessingService.getProcessingStatus();

    res.status(200).json({
      success: true,
      message: 'Auto-processing status retrieved',
      data: status
    });

  } catch (error) {
    console.error('[AUTO PROCESSING CONTROLLER] Error getting status:', error);
    res.status(500).json({
      success: false,
      message: 'Error retrieving auto-processing status',
      error: error.message
    });
  }
};

module.exports = {
  processAllCompleteAssessments,
  processSpecificStudent,
  getProcessingStatus
};