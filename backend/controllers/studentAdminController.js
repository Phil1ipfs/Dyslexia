const mongoose = require('mongoose');
const multer = require('multer');
const upload = multer();
const uploadToS3 = require('../utils/s3Upload');

// Helper: get users collection in test db
const getStudentCollection = async () => {
  const db = mongoose.connection.useDb('test');
  return db.collection('users');
};

// CREATE student
exports.createStudent = async (req, res) => {
  try {
    let profileImageUrl = '';
    if (req.file) {
      profileImageUrl = await uploadToS3(req.file, 'student-profiles');
    }
    const {
      idNumber, firstName, middleName, lastName, age, gender, gradeLevel, section, address
    } = req.body;
    
    // Validate and convert numbers to ensure consistency
    const idNumberInt = Number.isInteger(Number(idNumber)) ? Number(idNumber) : parseInt(idNumber, 10);
    const ageInt = Number.isInteger(Number(age)) ? Number(age) : parseInt(age, 10);
    
    const now = new Date();
    const studentDoc = {
      idNumber: idNumberInt,
      firstName,
      middleName: middleName || '',
      lastName,
      age: ageInt,
      gender,
      gradeLevel,
      section,
      address,
      profileImageUrl: profileImageUrl || '',
      readingLevel: null,
      readingPercentage: null,
      preAssessmentCompleted: false,
      createdAt: now,
      updatedAt: now
    };
    const collection = await getStudentCollection();
    const result = await collection.insertOne(studentDoc);
    studentDoc._id = result.insertedId;
    res.json({ success: true, message: 'Student created successfully', data: { studentProfile: studentDoc } });
  } catch (err) {
    console.error('Error creating student:', err);
    res.status(500).json({ success: false, message: 'Server error', error: err.message });
  }
};

// UPDATE student
exports.updateStudent = async (req, res) => {
  try {
    let profileImageUrl = '';
    if (req.file) {
      profileImageUrl = await uploadToS3(req.file, 'student-profiles');
    }
    const studentId = req.params.id;
    const {
      idNumber, firstName, middleName, lastName, age, gender, gradeLevel, section, address
    } = req.body;
    
    // Validate and convert numbers to ensure consistency
    const idNumberInt = Number.isInteger(Number(idNumber)) ? Number(idNumber) : parseInt(idNumber, 10);
    const ageInt = Number.isInteger(Number(age)) ? Number(age) : parseInt(age, 10);
    
    const updateData = {
      idNumber: idNumberInt,
      firstName,
      middleName: middleName || '',
      lastName,
      age: ageInt,
      gender,
      gradeLevel,
      section,
      address,
      updatedAt: new Date()
    };
    if (profileImageUrl) updateData.profileImageUrl = profileImageUrl;
    const collection = await getStudentCollection();
    await collection.updateOne(
      { _id: new mongoose.Types.ObjectId(studentId) },
      { $set: updateData }
    );
    const updatedProfile = await collection.findOne({ _id: new mongoose.Types.ObjectId(studentId) });
    if (!updatedProfile) {
      return res.status(404).json({ success: false, message: 'Student not found' });
    }
    res.json({ success: true, message: 'Student updated successfully', data: { studentProfile: updatedProfile } });
  } catch (err) {
    console.error('Error updating student:', err);
    res.status(500).json({ success: false, message: 'Server error', error: err.message });
  }
};

// DELETE student
exports.deleteStudent = async (req, res) => {
  try {
    const studentId = req.params.id;
    const collection = await getStudentCollection();
    const deleteResult = await collection.deleteOne({ _id: new mongoose.Types.ObjectId(studentId) });
    if (deleteResult.deletedCount === 0) {
      return res.status(404).json({ success: false, message: 'Student not found' });
    }
    res.json({ success: true, message: 'Student deleted successfully' });
  } catch (err) {
    console.error('Error deleting student:', err);
    res.status(500).json({ success: false, message: 'Server error', error: err.message });
  }
}; 