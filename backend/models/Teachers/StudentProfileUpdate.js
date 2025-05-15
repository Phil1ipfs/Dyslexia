// models/Teachers/StudentProfileUpdate.js
const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const studentProfileUpdateSchema = new Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    // This references a student in the test.users collection
    // But we don't specify ref to avoid conflicts with users_web User model
    required: true
  },
  updateType: {
    type: String,
    enum: [
      'assignment_received',
      'assessment_completed',
      'category_status_changed',
      'reading_level_changed',
      'recommendation_created'
    ],
    required: true
  },
  previousValue: Schema.Types.Mixed,
  newValue: Schema.Types.Mixed,
  reason: String,
  assessmentId: String,
  categoryId: Number,
  updateDate: {
    type: Date,
    default: Date.now
  },
  updatedBy: {
    type: mongoose.Schema.Types.ObjectId,
    // This references a teacher in the users_web.users collection
    // But we don't specify ref to avoid conflicts
    required: true
  }
}, {
  collection: 'student_profile_updates'
});

// We need to determine if we should create a different model name to avoid conflicts
// Or use a specific database connection
let StudentProfileUpdate;

try {
  // Try to get existing model first to avoid model overwrite warnings
  StudentProfileUpdate = mongoose.model('StudentProfileUpdate');
} catch (error) {
  // If model doesn't exist yet, create it
  // Since server.js connects to users_web by default, we'll specify test database
  StudentProfileUpdate = mongoose.connection.useDb('test').model('StudentProfileUpdate', studentProfileUpdateSchema);
}

module.exports = StudentProfileUpdate;