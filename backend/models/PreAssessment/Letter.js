const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const letterSchema = new Schema({
  letterID: {
    type: String,
    required: true,
    unique: true
  },
  type: {
    type: String,
    enum: ['patinig', 'katinig'],
    required: true
  },
  smallLetter: {
    type: String,
    required: true
  },
  bigLetter: {
    type: String,
    required: true
  },
  imageUrl: String,
  examples: [String],
  soundText: String,
  createdBy: {
    type: mongoose.Schema.Types.ObjectId 
  },
  isEditable: {
    type: Boolean,
    default: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
}, {
  collection: 'letters_collection'
});

// Export model from Pre_Assessment database
module.exports = mongoose.connection.useDb('Pre_Assessment').model('Letter', letterSchema);
