const mongoose = require('mongoose');
const Schema = mongoose.Schema;

// Define the schema to match the database structure shown in the screenshots
const userSchema = new Schema({
  _id: {
    type: mongoose.Schema.Types.ObjectId,
    auto: true
  },
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true
  },
  passwordHash: {
    type: String,
    required: true
  },
  roles: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'roles',
    required: true
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
}, {
  // Do not include timestamps since the database already has updatedAt field
  // and there's no createdAt field in the user documents
  timestamps: false,
  // This matches your collection in mobile_literexia.users_web
  collection: 'users'
});

// Check if model already exists to prevent duplicate model errors
const User = mongoose.models.User || mongoose.model('User', userSchema, 'users');

module.exports = User;