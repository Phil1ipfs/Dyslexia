import mongoose from "mongoose";

const UserSchema = new mongoose.Schema({
  email: {
  type: String,
  required: true, // Optionally make it required
  role: String, // 'admin', 'parent', or 'teacher'
  profile: {
    name: String,
    age: Number,
    gradeLevel: String,
    dyslexiaType: String,
  },
  preferences: {
    font: String,
    spacing: Number,
    backgroundColor: String,
    },
  },
});

const User = mongoose.model("User", UserSchema);
export default User;
