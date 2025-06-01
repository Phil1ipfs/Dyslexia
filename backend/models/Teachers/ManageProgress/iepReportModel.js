const mongoose = require('mongoose');

const iepObjectiveSchema = new mongoose.Schema({
  lesson: {
    type: String,
    required: true,
    trim: true
  },
  category: {
    type: String,
    required: true,
    trim: true
  },
  completed: {
    type: Boolean,
    default: false
  },
  supportLevel: {
    type: String,
    enum: ['minimal', 'moderate', 'extensive'],
    default: 'moderate'
  },
  remarks: {
    type: String,
    trim: true,
    default: ''
  }
});

const iepReportSchema = new mongoose.Schema({
  studentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  studentNumber: {
    type: String,
    trim: true
  },
  readingLevel: {
    type: String,
    trim: true
  },
  objectives: [iepObjectiveSchema],
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
}, {
  collection: 'iep_reports'
});

// Update timestamp on save
iepReportSchema.pre('save', function(next) {
  this.updatedAt = new Date();
  next();
});

const IEPReport = mongoose.models.IEPReport || mongoose.model('IEPReport', iepReportSchema);

module.exports = IEPReport; 