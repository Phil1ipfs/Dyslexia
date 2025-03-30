import mongoose from "mongoose";

const ProgressSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User", // assuming you want to reference a User model
  },
  date: {
    type: Date,
    required: true,
  },
  ProgressType: {
    type: String,
    required: true,
  },
  score: {
    type: Number,
    required: true,
  },
  timeSpent: {
    type: Number,
    required: true,
  },
  difficulties: {
    type: [String],
    default: [],
  },
  improvements: {
    type: [String],
    default: [],
  },
});

const Progress = mongoose.model("Progress", ProgressSchema);
export default Progress;
