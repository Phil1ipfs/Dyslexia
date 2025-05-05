// models/userModel.js
const mongoose = require('mongoose');
const Schema = mongoose.Schema;

// Define the schema with collection targeting to match your database structure
const userSchema = new Schema({
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true
  },
  password: {
    type: String,
    required: true
  },
  roles: {
    type: String, // String roles as shown in your database
    default: 'user'
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true,
  // IMPORTANT: This matches your actual collection shown in screenshots
  collection: 'users'
});

// Check if model already exists to prevent duplicate model errors
const User = mongoose.models.User || mongoose.model('User', userSchema);

module.exports = User;