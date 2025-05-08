// // models/index.js
// const mongoose = require('mongoose');

// // Define schemas for various collections
// const userResponseSchema = new mongoose.Schema({
//   assessmentId: { type: mongoose.Schema.Types.Mixed, required: true },
//   userId: { type: mongoose.Schema.Types.Mixed, required: true },
//   answers: { type: Object, default: {} },
//   score: { type: Number, default: 0 },
//   readingLevel: { type: String },
//   readingPercentage: { type: Number },
//   completedAt: { type: Date, default: Date.now }
// }, { 
//   strict: false // Allow flexible schema
// });

// const studentSchema = new mongoose.Schema({
//   idNumber: { type: Number },
//   firstName: { type: String },
//   middleName: { type: String },
//   lastName: { type: String },
//   age: { type: Number },
//   parentId: { type: mongoose.Schema.Types.Mixed },
//   lastAssessmentDate: { type: Date },
//   readingLevel: { type: String },
//   readingPercentage: { type: Number },
//   preAssessmentCompleted: { type: Boolean, default: false },
//   createdAt: { type: Date, default: Date.now },
//   lastLogin: { type: Date }
// }, { 
//   strict: false // Allow flexible schema
// });

// const parentProfileSchema = new mongoose.Schema({
//   userId: { type: mongoose.Schema.Types.Mixed },
//   firstName: { type: String },
//   middleName: { type: String },
//   lastName: { type: String },
//   email: { type: String },
//   contact: { type: String },
//   profileImageUrl: { type: String }
// }, { 
//   strict: false // Allow flexible schema
// });

// // Function to create models with explicit collection names
// const createModels = (db) => {
//   const models = {};
  
//   // Models for the test database
//   const testDb = db.useDb('test');
//   models.Student = testDb.model('Student', studentSchema, 'users');
  
//   // Models for the mobile_literexia database
//   const mobileDb = db.useDb('mobile_literexia');
//   models.UserResponse = mobileDb.model('UserResponse', userResponseSchema, 'Pre_Assessment.user_responses');
  
//   // Models for the users_web database
//   const usersWebDb = db.useDb('users_web');
//   models.ParentProfile = usersWebDb.model('ParentProfile', parentProfileSchema, 'parent.profile');
  
//   return models;
// };

// module.exports = {
//   createModels,
//   schemas: {
//     userResponseSchema,
//     studentSchema,
//     parentProfileSchema
//   }
// };