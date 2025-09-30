// Real-Time Notification Service - WebSocket Integration
// Provides immediate feedback when scoring, analysis, and interventions complete

const WebSocket = require('ws');

class NotificationService {
  constructor() {
    this.wss = null;
    this.connections = new Map(); // studentId -> WebSocket connections
  }

  /**
   * Initialize WebSocket server
   */
  initialize(server) {
    try {
      this.wss = new WebSocket.Server({
        server: server,
        path: '/notifications'
      });

      this.wss.on('connection', (ws, request) => {
        console.log('[NOTIFICATIONS] 📡 New WebSocket connection established');

        ws.on('message', (message) => {
          try {
            const data = JSON.parse(message);
            this.handleClientMessage(ws, data);
          } catch (error) {
            console.error('[NOTIFICATIONS] ❌ Invalid message format:', error);
          }
        });

        ws.on('close', () => {
          this.removeConnection(ws);
        });

        ws.on('error', (error) => {
          console.error('[NOTIFICATIONS] ❌ WebSocket error:', error);
          this.removeConnection(ws);
        });
      });

      console.log('[NOTIFICATIONS] ✅ WebSocket server initialized on /notifications');
      return { success: true, message: 'WebSocket server started' };

    } catch (error) {
      console.error('[NOTIFICATIONS] ❌ Failed to initialize WebSocket server:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Handle client registration and messages
   */
  handleClientMessage(ws, data) {
    try {
      switch (data.type) {
        case 'register':
          this.registerConnection(ws, data.studentId, data.userType);
          break;
        case 'ping':
          ws.send(JSON.stringify({ type: 'pong', timestamp: Date.now() }));
          break;
        default:
          console.warn('[NOTIFICATIONS] ⚠️ Unknown message type:', data.type);
      }
    } catch (error) {
      console.error('[NOTIFICATIONS] ❌ Error handling client message:', error);
    }
  }

  /**
   * Register a WebSocket connection for a student
   */
  registerConnection(ws, studentId, userType = 'student') {
    if (!studentId) {
      ws.send(JSON.stringify({
        type: 'error',
        message: 'studentId is required for registration'
      }));
      return;
    }

    if (!this.connections.has(studentId)) {
      this.connections.set(studentId, []);
    }

    const connectionInfo = {
      ws: ws,
      userType: userType,
      registeredAt: new Date(),
      studentId: studentId
    };

    this.connections.get(studentId).push(connectionInfo);
    ws.studentId = studentId;
    ws.userType = userType;

    console.log(`[NOTIFICATIONS] 📝 Registered ${userType} connection for student ${studentId}`);

    // Send registration confirmation
    ws.send(JSON.stringify({
      type: 'registered',
      studentId: studentId,
      userType: userType,
      message: 'Connected to real-time notifications'
    }));
  }

  /**
   * Remove WebSocket connection
   */
  removeConnection(ws) {
    if (ws.studentId && this.connections.has(ws.studentId)) {
      const connections = this.connections.get(ws.studentId);
      const updatedConnections = connections.filter(conn => conn.ws !== ws);

      if (updatedConnections.length === 0) {
        this.connections.delete(ws.studentId);
      } else {
        this.connections.set(ws.studentId, updatedConnections);
      }

      console.log(`[NOTIFICATIONS] 📤 Removed connection for student ${ws.studentId}`);
    }
  }

  /**
   * Notify when category results are completed (main assessment)
   */
  async notifyCategoryResultsComplete(studentId, categoryResults) {
    try {
      const notification = {
        type: 'category_results_complete',
        studentId: studentId,
        timestamp: new Date().toISOString(),
        data: {
          assessmentType: 'main',
          readingLevel: categoryResults.readingLevel,
          overallScore: categoryResults.overallScore,
          categories: categoryResults.categories.map(cat => ({
            name: cat.categoryName,
            score: cat.score,
            passed: cat.isPassed,
            interventionRequired: cat.interventionRequired
          })),
          prescriptiveAnalysisId: categoryResults.prescriptiveAnalysisId,
          readingLevelProgression: categoryResults.readingLevelProgression
        },
        message: 'Assessment scoring completed! Results are now available.'
      };

      this.sendToStudent(studentId, notification);
      console.log(`[NOTIFICATIONS] 📊 Sent category results notification to student ${studentId}`);

    } catch (error) {
      console.error('[NOTIFICATIONS] ❌ Error sending category results notification:', error);
    }
  }

  /**
   * Notify when prescriptive analysis is generated
   */
  async notifyPrescriptiveAnalysisComplete(studentId, prescriptiveAnalysis) {
    try {
      const notification = {
        type: 'prescriptive_analysis_complete',
        studentId: studentId,
        timestamp: new Date().toISOString(),
        data: {
          analysisId: prescriptiveAnalysis._id,
          interventionRequired: prescriptiveAnalysis.interventionPlan?.required || false,
          interventionCategories: prescriptiveAnalysis.interventionPlan?.priority || [],
          overallReadiness: prescriptiveAnalysis.insights?.overallReadiness,
          recommendedAction: prescriptiveAnalysis.insights?.recommendedAction
        },
        message: 'Assessment analysis completed! Personalized insights are ready.'
      };

      this.sendToStudent(studentId, notification);
      console.log(`[NOTIFICATIONS] 🧠 Sent prescriptive analysis notification to student ${studentId}`);

    } catch (error) {
      console.error('[NOTIFICATIONS] ❌ Error sending prescriptive analysis notification:', error);
    }
  }

  /**
   * Notify when intervention results are completed
   */
  async notifyInterventionResultsComplete(studentId, interventionResults) {
    try {
      const notification = {
        type: 'intervention_results_complete',
        studentId: studentId,
        timestamp: new Date().toISOString(),
        data: {
          resultsId: interventionResults._id,
          category: interventionResults.category,
          score: interventionResults.score,
          passed: interventionResults.isPassed,
          improvement: interventionResults.improvement,
          improvementPercentage: interventionResults.improvementPercentage,
          revisionNumber: interventionResults.revisionNumber,
          recommendedAction: interventionResults.insights?.recommendedAction,
          categoryNowPassed: interventionResults.isPassed
        },
        message: interventionResults.isPassed
          ? `Great job! Your ${interventionResults.category} intervention passed with ${interventionResults.score}%!`
          : `Keep trying! Your ${interventionResults.category} intervention scored ${interventionResults.score}%. Teacher guidance available.`
      };

      this.sendToStudent(studentId, notification);
      console.log(`[NOTIFICATIONS] 🎯 Sent intervention results notification to student ${studentId}`);

    } catch (error) {
      console.error('[NOTIFICATIONS] ❌ Error sending intervention results notification:', error);
    }
  }

  /**
   * Notify when reading level progression occurs
   */
  async notifyReadingLevelProgression(studentId, progressionData) {
    try {
      const notification = {
        type: 'reading_level_progression',
        studentId: studentId,
        timestamp: new Date().toISOString(),
        data: {
          fromLevel: progressionData.fromLevel,
          toLevel: progressionData.toLevel,
          newCategoriesAvailable: progressionData.newCategoriesCreated,
          triggerCategory: progressionData.triggerCategory
        },
        message: `🎉 Congratulations! You've progressed to ${progressionData.toLevel} reading level!`
      };

      this.sendToStudent(studentId, notification);
      console.log(`[NOTIFICATIONS] 🚀 Sent reading level progression notification to student ${studentId}`);

    } catch (error) {
      console.error('[NOTIFICATIONS] ❌ Error sending progression notification:', error);
    }
  }

  /**
   * Notify when teacher creates/revises intervention
   */
  async notifyInterventionAvailable(studentId, interventionData) {
    try {
      const notification = {
        type: 'intervention_available',
        studentId: studentId,
        timestamp: new Date().toISOString(),
        data: {
          interventionId: interventionData.interventionId,
          category: interventionData.category,
          totalQuestions: interventionData.totalQuestions,
          revisionNumber: interventionData.revisionNumber || 1,
          isRevision: (interventionData.revisionNumber || 1) > 1,
          prescriptionBased: interventionData.prescriptionBased
        },
        message: interventionData.revisionNumber > 1
          ? `Your ${interventionData.category} intervention has been updated by your teacher. Ready to try again!`
          : `Your ${interventionData.category} intervention is ready! ${interventionData.totalQuestions} questions prepared for you.`
      };

      this.sendToStudent(studentId, notification);
      console.log(`[NOTIFICATIONS] 🎯 Sent intervention available notification to student ${studentId}`);

    } catch (error) {
      console.error('[NOTIFICATIONS] ❌ Error sending intervention available notification:', error);
    }
  }

  /**
   * Send notification to specific student
   */
  sendToStudent(studentId, notification) {
    const connections = this.connections.get(studentId);
    if (!connections || connections.length === 0) {
      console.log(`[NOTIFICATIONS] 📭 No active connections for student ${studentId}`);
      return;
    }

    let successCount = 0;
    connections.forEach(conn => {
      try {
        if (conn.ws.readyState === WebSocket.OPEN) {
          conn.ws.send(JSON.stringify(notification));
          successCount++;
        }
      } catch (error) {
        console.error(`[NOTIFICATIONS] ❌ Failed to send to connection:`, error);
      }
    });

    console.log(`[NOTIFICATIONS] ✅ Sent notification to ${successCount}/${connections.length} connections for student ${studentId}`);
  }

  /**
   * Broadcast to all connected clients
   */
  broadcast(notification) {
    if (!this.wss) return;

    this.wss.clients.forEach(ws => {
      if (ws.readyState === WebSocket.OPEN) {
        try {
          ws.send(JSON.stringify(notification));
        } catch (error) {
          console.error('[NOTIFICATIONS] ❌ Failed to broadcast:', error);
        }
      }
    });
  }

  /**
   * Get connection statistics
   */
  getStats() {
    const stats = {
      totalStudents: this.connections.size,
      totalConnections: 0,
      connectionsByType: { student: 0, teacher: 0, admin: 0 }
    };

    this.connections.forEach(connections => {
      stats.totalConnections += connections.length;
      connections.forEach(conn => {
        stats.connectionsByType[conn.userType] = (stats.connectionsByType[conn.userType] || 0) + 1;
      });
    });

    return stats;
  }

  /**
   * Health check for WebSocket service
   */
  healthCheck() {
    const stats = this.getStats();
    return {
      status: this.wss ? 'healthy' : 'unhealthy',
      webSocketServer: this.wss ? 'running' : 'not_initialized',
      connections: stats,
      uptime: process.uptime(),
      timestamp: new Date().toISOString()
    };
  }
}

// Singleton instance
const notificationService = new NotificationService();

module.exports = notificationService;