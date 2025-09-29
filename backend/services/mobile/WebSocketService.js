// services/mobile/WebSocketService.js
const { Server } = require('socket.io');
const RealTimeStudentProcessor = require('./RealTimeStudentProcessor');

/**
 * WebSocket Service for Real-time Student Progress Updates
 * Provides live updates to mobile apps during assessments
 */
class WebSocketService {
  constructor() {
    this.io = null;
    this.connectedClients = new Map(); // Track connected clients by studentId
    this.setupEventListeners();
  }

  /**
   * Initialize WebSocket server
   */
  initialize(server) {
    try {
      this.io = new Server(server, {
        cors: {
          origin: "*", // Configure appropriately for production
          methods: ["GET", "POST"]
        },
        path: '/socket.io'
      });

      this.setupSocketHandlers();
      console.log('[WEBSOCKET] ✅ WebSocket service initialized');

    } catch (error) {
      console.error('[WEBSOCKET] Error initializing WebSocket service:', error);
    }
  }

  /**
   * Setup Socket.IO event handlers
   */
  setupSocketHandlers() {
    this.io.on('connection', (socket) => {
      console.log(`[WEBSOCKET] Client connected: ${socket.id}`);

      // Handle student joining assessment session
      socket.on('join_assessment', (data) => {
        try {
          const { studentId, studentName } = data;

          if (!studentId) {
            socket.emit('error', { message: 'studentId is required' });
            return;
          }

          // Join student-specific room
          socket.join(`student_${studentId}`);
          socket.studentId = studentId;
          socket.studentName = studentName;

          // Track connected client
          this.connectedClients.set(studentId, {
            socketId: socket.id,
            studentName,
            joinedAt: new Date(),
            lastActivity: new Date()
          });

          console.log(`[WEBSOCKET] Student ${studentId} (${studentName}) joined assessment session`);

          // Send current assessment progress if available
          const progress = RealTimeStudentProcessor.getAssessmentProgress(studentId);
          if (progress) {
            socket.emit('assessment_progress', progress);
          }

          socket.emit('joined', {
            studentId,
            message: 'Successfully joined assessment session',
            timestamp: new Date().toISOString()
          });

        } catch (error) {
          console.error('[WEBSOCKET] Error in join_assessment:', error);
          socket.emit('error', { message: 'Failed to join assessment session' });
        }
      });

      // Handle student progress updates
      socket.on('update_progress', (data) => {
        try {
          if (socket.studentId) {
            const client = this.connectedClients.get(socket.studentId);
            if (client) {
              client.lastActivity = new Date();
            }

            // Broadcast progress to all connected clients for this student
            this.io.to(`student_${socket.studentId}`).emit('progress_updated', {
              studentId: socket.studentId,
              ...data,
              timestamp: new Date().toISOString()
            });
          }
        } catch (error) {
          console.error('[WEBSOCKET] Error in update_progress:', error);
        }
      });

      // Handle teacher monitoring requests
      socket.on('monitor_students', (data) => {
        try {
          const { teacherId, studentIds } = data;

          if (!Array.isArray(studentIds)) {
            socket.emit('error', { message: 'studentIds must be an array' });
            return;
          }

          // Join monitoring rooms for specified students
          studentIds.forEach(studentId => {
            socket.join(`monitor_student_${studentId}`);
          });

          socket.teacherId = teacherId;
          socket.monitoringStudents = studentIds;

          console.log(`[WEBSOCKET] Teacher ${teacherId} monitoring ${studentIds.length} students`);

          // Send current status for all monitored students
          const activeAssessments = RealTimeStudentProcessor.getAllActiveAssessments()
            .filter(assessment => studentIds.includes(assessment.studentId));

          socket.emit('monitoring_started', {
            teacherId,
            studentsCount: studentIds.length,
            activeAssessments,
            timestamp: new Date().toISOString()
          });

        } catch (error) {
          console.error('[WEBSOCKET] Error in monitor_students:', error);
          socket.emit('error', { message: 'Failed to start monitoring' });
        }
      });

      // Handle disconnect
      socket.on('disconnect', () => {
        try {
          console.log(`[WEBSOCKET] Client disconnected: ${socket.id}`);

          // Remove from connected clients if student
          if (socket.studentId) {
            this.connectedClients.delete(socket.studentId);
            console.log(`[WEBSOCKET] Student ${socket.studentId} disconnected`);
          }

        } catch (error) {
          console.error('[WEBSOCKET] Error handling disconnect:', error);
        }
      });

      // Handle ping for connection health
      socket.on('ping', () => {
        socket.emit('pong', { timestamp: new Date().toISOString() });
      });
    });
  }

  /**
   * Setup event listeners for real-time processor
   */
  setupEventListeners() {
    // Listen for student progress events
    RealTimeStudentProcessor.on('studentProgress', (data) => {
      this.broadcastStudentProgress(data);
    });

    // Listen for assessment completion events
    RealTimeStudentProcessor.on('assessmentComplete', (data) => {
      this.broadcastAssessmentComplete(data);
    });

    // Listen for processing errors
    RealTimeStudentProcessor.on('processingError', (data) => {
      this.broadcastProcessingError(data);
    });
  }

  /**
   * Broadcast student progress to connected clients
   */
  broadcastStudentProgress(data) {
    try {
      const { studentId, questionId, category, isCorrect, categoryUpdate } = data;

      // Send to student's own session
      this.io.to(`student_${studentId}`).emit('question_completed', {
        questionId,
        category,
        isCorrect,
        categoryUpdate: {
          category: categoryUpdate.category,
          currentScore: categoryUpdate.currentScore,
          progressPercentage: categoryUpdate.progressPercentage,
          isPassed: categoryUpdate.isPassed
        },
        timestamp: data.timestamp
      });

      // Send to teachers monitoring this student
      this.io.to(`monitor_student_${studentId}`).emit('student_progress', {
        studentId,
        questionId,
        category,
        isCorrect,
        categoryUpdate,
        timestamp: data.timestamp
      });

      console.log(`[WEBSOCKET] Broadcasted progress for student ${studentId}: ${category} - ${isCorrect ? 'CORRECT' : 'INCORRECT'}`);

    } catch (error) {
      console.error('[WEBSOCKET] Error broadcasting student progress:', error);
    }
  }

  /**
   * Broadcast assessment completion
   */
  broadcastAssessmentComplete(data) {
    try {
      const { studentId, finalResults } = data;

      // Send detailed results to student
      this.io.to(`student_${studentId}`).emit('assessment_complete', {
        studentId,
        overallScore: finalResults.overallScore,
        readingLevel: finalResults.readingLevel,
        allCategoriesPassed: finalResults.allCategoriesPassed,
        categories: finalResults.categories.map(cat => ({
          categoryName: cat.categoryName,
          score: cat.score,
          isPassed: cat.isPassed,
          badge: cat.badge
        })),
        summary: finalResults.summary,
        completionTime: data.completionTime
      });

      // Send summary to monitoring teachers
      this.io.to(`monitor_student_${studentId}`).emit('student_assessment_complete', {
        studentId,
        overallScore: finalResults.overallScore,
        performance: finalResults.summary.performance,
        allCategoriesPassed: finalResults.allCategoriesPassed,
        completionTime: data.completionTime
      });

      console.log(`[WEBSOCKET] Broadcasted assessment completion for student ${studentId}: ${finalResults.overallScore}%`);

    } catch (error) {
      console.error('[WEBSOCKET] Error broadcasting assessment completion:', error);
    }
  }

  /**
   * Broadcast processing errors
   */
  broadcastProcessingError(data) {
    try {
      const { studentId, questionId, error } = data;

      // Send error to student
      this.io.to(`student_${studentId}`).emit('processing_error', {
        questionId,
        error: 'Question processing failed. Please try again.',
        timestamp: data.timestamp
      });

      // Send detailed error to monitoring teachers
      this.io.to(`monitor_student_${studentId}`).emit('student_error', {
        studentId,
        questionId,
        error,
        timestamp: data.timestamp
      });

      console.log(`[WEBSOCKET] Broadcasted processing error for student ${studentId}: ${error}`);

    } catch (error) {
      console.error('[WEBSOCKET] Error broadcasting processing error:', error);
    }
  }

  /**
   * Send custom message to specific student
   */
  sendToStudent(studentId, event, data) {
    try {
      this.io.to(`student_${studentId}`).emit(event, {
        ...data,
        timestamp: new Date().toISOString()
      });

      console.log(`[WEBSOCKET] Sent ${event} to student ${studentId}`);

    } catch (error) {
      console.error(`[WEBSOCKET] Error sending ${event} to student ${studentId}:`, error);
    }
  }

  /**
   * Broadcast to all teachers monitoring a student
   */
  broadcastToTeachers(studentId, event, data) {
    try {
      this.io.to(`monitor_student_${studentId}`).emit(event, {
        studentId,
        ...data,
        timestamp: new Date().toISOString()
      });

      console.log(`[WEBSOCKET] Broadcasted ${event} to teachers monitoring student ${studentId}`);

    } catch (error) {
      console.error(`[WEBSOCKET] Error broadcasting ${event} to teachers:`, error);
    }
  }

  /**
   * Get connected clients statistics
   */
  getConnectedClientsStats() {
    const stats = {
      totalConnected: this.connectedClients.size,
      students: [],
      teachers: 0
    };

    for (const [studentId, client] of this.connectedClients) {
      stats.students.push({
        studentId,
        studentName: client.studentName,
        joinedAt: client.joinedAt,
        lastActivity: client.lastActivity,
        duration: Date.now() - client.joinedAt.getTime()
      });
    }

    // Count teachers (rough estimate based on socket rooms)
    if (this.io) {
      const rooms = this.io.sockets.adapter.rooms;
      stats.teachers = Array.from(rooms.keys())
        .filter(room => room.startsWith('monitor_student_')).length;
    }

    return stats;
  }

  /**
   * Send system announcement to all connected clients
   */
  broadcastSystemMessage(message, type = 'info') {
    try {
      this.io.emit('system_message', {
        message,
        type,
        timestamp: new Date().toISOString()
      });

      console.log(`[WEBSOCKET] Broadcasted system message: ${message}`);

    } catch (error) {
      console.error('[WEBSOCKET] Error broadcasting system message:', error);
    }
  }

  /**
   * Cleanup inactive connections
   */
  cleanupInactiveConnections() {
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
    let cleanedCount = 0;

    for (const [studentId, client] of this.connectedClients) {
      if (client.lastActivity < oneHourAgo) {
        this.connectedClients.delete(studentId);
        cleanedCount++;
        console.log(`[WEBSOCKET] Cleaned up inactive connection for student ${studentId}`);
      }
    }

    // Also cleanup inactive assessments
    const assessmentCleanupCount = RealTimeStudentProcessor.cleanupInactiveAssessments();

    return {
      connectionsCleanedUp: cleanedCount,
      assessmentsCleanedUp: assessmentCleanupCount
    };
  }
}

module.exports = new WebSocketService();