// models/Student.js
const mongoose = require('mongoose');

const studentSchema = new mongoose.Schema({
  idNumber: {
    type: Number,
    required: true,
    unique: true
  },
  firstName: {
    type: String,
    required: true
  },
  middleName: String,
  lastName: {
    type: String,
    required: true
  },
  age: Number,
  createdAt: Date,
  lastLogin: Date,
  completedLessons: [Number]
}, { collection: 'users' });

module.exports = mongoose.model('Student', studentSchema);