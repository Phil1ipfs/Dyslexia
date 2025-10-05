// models/chatHistoryModel.js
const mongoose = require('mongoose');

const chatMessageSchema = new mongoose.Schema({
  messageId: {
    type: String,
    required: true
  },
  sender: {
    type: String,
    enum: ['user', 'bot'],
    required: true
  },
  text: {
    type: String,
    required: true
  },
  timestamp: {
    type: Date,
    default: Date.now
  }
});

const chatHistorySchema = new mongoose.Schema({
  userId: {
    type: String,
    required: true,
    index: true
  },
  userType: {
    type: String,
    enum: ['teacher', 'student', 'parent', 'admin'],
    required: true,
    index: true
  },
  sessionId: {
    type: String,
    required: true,
    index: true
  },
  messages: [chatMessageSchema],
  category: {
    type: String,
    enum: ['all', 'teaching', 'activities', 'interventions'],
    default: 'all'
  },
  language: {
    type: String,
    enum: ['filipino', 'english'],
    default: 'filipino'
  },
  lastActivity: {
    type: Date,
    default: Date.now
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
}, {
  collection: 'chat_history',
  timestamps: true
});

// Compound index for efficient queries
chatHistorySchema.index({ userId: 1, userType: 1, lastActivity: -1 });

// Update lastActivity on save
chatHistorySchema.pre('save', function(next) {
  this.lastActivity = new Date();
  next();
});

const ChatHistory = mongoose.models.ChatHistory || mongoose.model('ChatHistory', chatHistorySchema);

module.exports = ChatHistory;
