const InterventionResponse = require('../../models/Teachers/ManageProgress/interventionResponseModel');
const InterventionAssessment = require('../../models/Teachers/ManageProgress/interventionAssessmentModel');
const InterventionCompletionService = require('./InterventionCompletionService');

/**
 * Background service that monitors intervention_responses collection
 * and automatically triggers processing when interventions are completed
 */
class InterventionMonitoringService {
  constructor() {
    this.isRunning = false;
    this.isChecking = false; // overlap guard: true while a check is in flight
    this.intervalId = null;
    this.checkInterval = 30000; // Check every 30 seconds
    this.lastCheck = new Date();
  }

  /**
   * Start the monitoring service
   */
  start() {
    if (this.isRunning) {
      console.log('[INTERVENTION MONITORING] Service already running');
      return;
    }

    console.log(`[INTERVENTION MONITORING] 🚀 Starting intervention monitoring service (check interval: ${this.checkInterval / 1000}s)`);
    this.isRunning = true;
    this.lastCheck = new Date();

    // Initial check
    this.checkForCompletedInterventions();

    // Set up periodic checking
    this.intervalId = setInterval(() => {
      this.checkForCompletedInterventions();
    }, this.checkInterval);

    console.log('[INTERVENTION MONITORING] ✅ Service started successfully');
  }

  /**
   * Stop the monitoring service
   */
  stop() {
    if (!this.isRunning) {
      console.log('[INTERVENTION MONITORING] Service not running');
      return;
    }

    console.log('[INTERVENTION MONITORING] 🛑 Stopping intervention monitoring service');
    this.isRunning = false;

    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }

    console.log('[INTERVENTION MONITORING] ✅ Service stopped');
  }

  /**
   * Main monitoring function - checks for completed interventions and processes them
   */
  async checkForCompletedInterventions() {
    // Overlap guard: if the previous tick is still running (e.g. under load), skip
    // this one rather than stacking concurrent full passes on the shared event loop.
    if (this.isChecking) {
      console.log('[INTERVENTION MONITORING] ⏭️ Previous check still running, skipping this tick');
      return;
    }
    this.isChecking = true;
    try {
      const checkStartTime = new Date();
      console.log(`[INTERVENTION MONITORING] 🔍 Checking for completed interventions at ${checkStartTime.toISOString()}`);

      // 1. Find all active interventions (not yet completed)
      const activeInterventions = await InterventionAssessment.find({
        status: 'active',
        completedAt: null,
        interventionResultsId: null
      }).select('_id studentId category totalQuestions createdAt');

      if (activeInterventions.length === 0) {
        console.log('[INTERVENTION MONITORING] No active interventions found');
        this.lastCheck = checkStartTime;
        return;
      }

      console.log(`[INTERVENTION MONITORING] Found ${activeInterventions.length} active interventions to check`);

      let processedCount = 0;
      let completedCount = 0;

      // 2. Check each active intervention for completion
      for (const intervention of activeInterventions) {
        try {
          const completionResult = await this.checkSingleIntervention(intervention);

          if (completionResult.completed) {
            completedCount++;

            if (completionResult.autoProcessed) {
              processedCount++;
              console.log(`[INTERVENTION MONITORING] ✅ Auto-processed intervention ${intervention._id} for student ${intervention.studentId}`);
            }
          }
        } catch (error) {
          console.error(`[INTERVENTION MONITORING] Error checking intervention ${intervention._id}:`, error.message);
        }
      }

      const checkEndTime = new Date();
      const duration = checkEndTime - checkStartTime;

      console.log(`[INTERVENTION MONITORING] 📊 Check complete: ${completedCount} completed, ${processedCount} auto-processed (${duration}ms)`);
      this.lastCheck = checkStartTime;

    } catch (error) {
      console.error('[INTERVENTION MONITORING] Error in monitoring check:', error);
    } finally {
      this.isChecking = false;
    }
  }

  /**
   * Check a single intervention for completion
   * @param {Object} intervention - Intervention assessment document
   * @returns {Object} Check result
   */
  async checkSingleIntervention(intervention) {
    try {
      const expectedQuestions = intervention.totalQuestions || 0;

      // Count responses for this intervention
      const responseCount = await InterventionResponse.countDocuments({
        interventionAssessmentId: intervention._id,
        studentId: intervention.studentId
      });

      const isComplete = responseCount >= expectedQuestions;

      if (!isComplete) {
        // Not yet complete
        return {
          interventionId: intervention._id,
          completed: false,
          responseCount: responseCount,
          expectedCount: expectedQuestions,
          remaining: expectedQuestions - responseCount
        };
      }

      // Intervention is complete - trigger automatic processing
      console.log(`[INTERVENTION MONITORING] 🎯 Intervention ${intervention._id} completed (${responseCount}/${expectedQuestions}) - triggering processing`);

      const completionResult = await InterventionCompletionService.checkAndProcessCompletion(
        intervention._id.toString(),
        intervention.studentId
      );

      if (completionResult.autoProcessed) {
        console.log(`[INTERVENTION MONITORING] ✅ Successfully auto-processed intervention ${intervention._id}`);
        console.log(`[INTERVENTION MONITORING] Results: score=${completionResult.results?.score}, passed=${completionResult.results?.isPassed}`);
      } else if (completionResult.alreadyProcessed) {
        console.log(`[INTERVENTION MONITORING] ℹ️ Intervention ${intervention._id} already processed`);
      } else {
        console.warn(`[INTERVENTION MONITORING] ⚠️ Intervention ${intervention._id} complete but not processed: ${completionResult.reason}`);
      }

      return completionResult;

    } catch (error) {
      console.error(`[INTERVENTION MONITORING] Error checking intervention ${intervention._id}:`, error);
      return {
        interventionId: intervention._id,
        completed: false,
        error: error.message
      };
    }
  }

  /**
   * Get monitoring service status
   * @returns {Object} Service status
   */
  getStatus() {
    return {
      isRunning: this.isRunning,
      checkInterval: this.checkInterval,
      lastCheck: this.lastCheck,
      nextCheck: this.isRunning ? new Date(this.lastCheck.getTime() + this.checkInterval) : null,
      uptime: this.isRunning ? Date.now() - this.lastCheck.getTime() : 0
    };
  }

  /**
   * Force a manual check (for testing)
   */
  async forceCheck() {
    console.log('[INTERVENTION MONITORING] 🔧 Manual check triggered');
    await this.checkForCompletedInterventions();
  }

  /**
   * Update check interval
   * @param {number} intervalMs - New interval in milliseconds
   */
  setCheckInterval(intervalMs) {
    const oldInterval = this.checkInterval;
    this.checkInterval = intervalMs;

    console.log(`[INTERVENTION MONITORING] Check interval updated: ${oldInterval / 1000}s → ${intervalMs / 1000}s`);

    if (this.isRunning) {
      // Restart with new interval
      this.stop();
      this.start();
    }
  }

  /**
   * Get statistics about monitoring activity
   */
  async getMonitoringStats() {
    try {
      const activeInterventions = await InterventionAssessment.countDocuments({
        status: 'active',
        completedAt: null,
        interventionResultsId: null
      });

      const completedInterventions = await InterventionAssessment.countDocuments({
        status: 'active',
        completedAt: { $ne: null },
        interventionResultsId: { $ne: null }
      });

      const totalInterventions = await InterventionAssessment.countDocuments({});

      const recentResponses = await InterventionResponse.countDocuments({
        createdAt: { $gte: new Date(Date.now() - 24 * 60 * 60 * 1000) } // Last 24 hours
      });

      return {
        activeInterventions,
        completedInterventions,
        totalInterventions,
        recentResponses,
        serviceStatus: this.getStatus()
      };
    } catch (error) {
      console.error('[INTERVENTION MONITORING] Error getting stats:', error);
      return {
        error: error.message,
        serviceStatus: this.getStatus()
      };
    }
  }
}

// Create singleton instance
const monitoringService = new InterventionMonitoringService();

module.exports = monitoringService;