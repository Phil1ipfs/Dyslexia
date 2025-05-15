// models/Teachers/AssessmentAssignment.js
const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const assignedStudentSchema = new Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    required: true
  },
  readingLevel: {
    type: String,
    required: true
  },
  status: {
    type: String,
    enum: ['pending', 'in_progress', 'completed'],
    default: 'pending'
  }
}, { _id: false });

const assessmentAssignmentSchema = new Schema({
  assessmentId: {
    type: String,
    required: true
  },
  assessmentTitle: {
    type: String,
    required: true
  },
  categoryId: {
    type: Number,
    required: true
  },
  categoryName: {
    type: String,
    required: true
  },
  assignedBy: {
    type: mongoose.Schema.Types.ObjectId,
    required: true
  },
  assignedDate: {
    type: Date,
    default: Date.now
  },
  targetReadingLevel: {
    type: String,
    required: true
  },
  passingThreshold: {
    type: Number,
    default: 75
  },
  completionCount: {
    type: Number,
    default: 0
  },
  totalAssigned: {
    type: Number,
    default: 0
  },
  completionRate: {
    type: Number,
    default: 0
  },
  instructions: String,
  assignedStudent: [assignedStudentSchema],
  notes: String
}, {
  collection: 'assessment_assignments'
});

module.exports = mongoose.connection.useDb('test').model('AssessmentAssignment', assessmentAssignmentSchema);
