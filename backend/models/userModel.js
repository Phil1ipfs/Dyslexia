// // backend/models/userModel.js
// const mongoose = require('mongoose');

// const userSchema = new mongoose.Schema(
//   {
//     email: { type: String, required: true, unique: true },
//     password: { type: String, required: true },
//     roles: { type: String, required: true },
//   },
//   { timestamps: true }
// );

// module.exports = mongoose.model('User', userSchema, 'web_users');

// backend/models/userModel.js 
const mongoose = require('mongoose');

const userSchema = new mongoose.Schema(
  {
    email: {
      type: String,
      required: true,
      unique: true
    },
    password: {
      type: String,
      required: true
    },
    roles: {
      type: String,
      required: true
    },
  },
  { timestamps: true }
);

// Explicitly set the collection name to "web_users" 
module.exports = mongoose.model('user', userSchema, 'web_users');