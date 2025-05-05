// models/userModel.js
const mongoose = require('mongoose');
const Schema = mongoose.Schema;

// Define the schema with collection targeting
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
    type: [String],
    default: ['user']
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true,
  // IMPORTANT: Make sure the collection name matches what's in your database
  collection: 'web_users' // Explicitly set the collection name
});

// Check if model already exists to prevent duplicate model errors
const User = mongoose.models.User || mongoose.model('User', userSchema);

module.exports = User;