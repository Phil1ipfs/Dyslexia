const mongoose = require('mongoose');
const multer = require('multer');
const upload = multer();
const uploadToS3 = require('../utils/s3Upload');

// Comprehensive admin validation utility for students
const adminValidation = {
  // Name validation (no numbers, proper format)
  validateName: (name, fieldName = 'Name', isMiddleName = false) => {
    if (!name || typeof name !== 'string') {
      return { isValid: false, errors: [`${fieldName} is required`] };
    }

    const trimmed = name.trim();
    if (!trimmed) {
      return { isValid: false, errors: [`${fieldName} cannot be empty`] };
    }

    // CRITICAL: Reject names with numbers completely
    if (/\d/.test(trimmed)) {
      console.log(`🚨 [STUDENT ADMIN] REJECTING ${fieldName} with numbers: "${trimmed}"`);
      return {
        isValid: false,
        errors: [`${fieldName} cannot contain numbers (e.g., "John123" is not allowed)`]
      };
    }

    // Special handling for middle names
    if (isMiddleName) {
      // Allow single letter with optional period (T, T.)
      if (trimmed.length <= 2 && /^[a-zA-Z]\.?$/.test(trimmed)) {
        return { isValid: true, errors: [] };
      }
    }

    // Check length constraints
    if (trimmed.length < 2) {
      return { isValid: false, errors: [`${fieldName} must be at least 2 characters long`] };
    }
    if (trimmed.length > 50) {
      return { isValid: false, errors: [`${fieldName} must be less than 50 characters`] };
    }

    // Check for allowed characters
    const allowedPattern = isMiddleName ? /^[a-zA-Z\s\-'.]+$/ : /^[a-zA-Z\s\-']+$/;
    if (!allowedPattern.test(trimmed)) {
      const allowedChars = isMiddleName
        ? "letters, spaces, hyphens, apostrophes, and periods"
        : "letters, spaces, hyphens, and apostrophes";
      return { isValid: false, errors: [`${fieldName} can only contain ${allowedChars}`] };
    }

    // Check for suspicious patterns
    if (/(.)\1{3,}/.test(trimmed)) {
      return { isValid: false, errors: [`${fieldName} cannot have more than 3 consecutive identical characters`] };
    }

    if (/\s{2,}/.test(trimmed)) {
      return { isValid: false, errors: [`${fieldName} cannot have multiple consecutive spaces`] };
    }

    return { isValid: true, errors: [], sanitized: trimmed };
  },

  // ID Number validation (for students)
  validateIdNumber: (idNumber, fieldName = 'ID Number') => {
    if (!idNumber) {
      return { isValid: false, errors: [`${fieldName} is required`] };
    }

    const idStr = idNumber.toString().trim();
    if (!idStr) {
      return { isValid: false, errors: [`${fieldName} cannot be empty`] };
    }

    // Check if only contains numbers
    if (!/^\d+$/.test(idStr)) {
      return { isValid: false, errors: [`${fieldName} can only contain numbers`] };
    }

    // Check length (common ID number lengths)
    if (idStr.length < 6) {
      return { isValid: false, errors: [`${fieldName} must be at least 6 digits`] };
    }

    if (idStr.length > 15) {
      return { isValid: false, errors: [`${fieldName} must be less than 15 digits`] };
    }

    // Check for suspicious patterns (all same digits, sequential)
    if (/^(\d)\1+$/.test(idStr)) {
      return { isValid: false, errors: [`${fieldName} cannot be all the same digit`] };
    }

    const idNumberInt = parseInt(idStr, 10);
    if (isNaN(idNumberInt)) {
      return { isValid: false, errors: [`${fieldName} must be a valid number`] };
    }

    return { isValid: true, errors: [], sanitized: idNumberInt };
  },

  // Age validation for students
  validateAge: (age, fieldName = 'Age') => {
    if (!age) {
      return { isValid: false, errors: [`${fieldName} is required`] };
    }

    const ageNum = Number(age);
    if (isNaN(ageNum) || !Number.isInteger(ageNum)) {
      return { isValid: false, errors: [`${fieldName} must be a whole number`] };
    }

    // Age validation for students (3-25 years old)
    if (ageNum < 3) {
      return { isValid: false, errors: ['Students must be at least 3 years old'] };
    }
    if (ageNum > 25) {
      return { isValid: false, errors: ['Please verify the age - seems high for a student (max 25)'] };
    }

    return { isValid: true, errors: [], sanitized: ageNum };
  },

  // Text validation for address, section, etc.
  validateText: (text, fieldName, required = false, maxLength = 200) => {
    if (required && (!text || typeof text !== 'string')) {
      return { isValid: false, errors: [`${fieldName} is required`] };
    }

    if (!text) {
      return { isValid: true, errors: [], sanitized: '' }; // Optional field
    }

    const trimmed = text.trim();
    if (required && !trimmed) {
      return { isValid: false, errors: [`${fieldName} cannot be empty`] };
    }

    if (trimmed.length > maxLength) {
      return { isValid: false, errors: [`${fieldName} must be less than ${maxLength} characters`] };
    }

    // Check for dangerous characters
    if (/[<>\"'&]/.test(trimmed)) {
      return { isValid: false, errors: [`${fieldName} cannot contain special HTML characters (< > " ' &)`] };
    }

    return { isValid: true, errors: [], sanitized: trimmed };
  },

  // Grade level validation
  validateGradeLevel: (gradeLevel, fieldName = 'Grade Level') => {
    if (!gradeLevel || typeof gradeLevel !== 'string') {
      return { isValid: false, errors: [`${fieldName} is required`] };
    }

    const trimmed = gradeLevel.trim();
    if (!trimmed) {
      return { isValid: false, errors: [`${fieldName} cannot be empty`] };
    }

    // Common grade level patterns
    const validPatterns = [
      /^Grade [1-9]$/i,          // Grade 1, Grade 2, etc.
      /^Grade 1[0-2]$/i,         // Grade 10, Grade 11, Grade 12
      /^Kindergarten$/i,         // Kindergarten
      /^K$/i,                    // K
      /^Pre-K$/i,                // Pre-K
      /^Nursery$/i               // Nursery
    ];

    const isValidGrade = validPatterns.some(pattern => pattern.test(trimmed));

    if (!isValidGrade) {
      return {
        isValid: false,
        errors: [
          `${fieldName} must be a valid grade format:`,
          '• Grade 1, Grade 2, ... Grade 12',
          '• Kindergarten or K',
          '• Pre-K',
          '• Nursery'
        ]
      };
    }

    return { isValid: true, errors: [], sanitized: trimmed };
  }
};

// Helper: get users collection in test db
const getStudentCollection = async () => {
  const db = mongoose.connection.useDb('test');
  return db.collection('users');
};

// CREATE student - COMPREHENSIVE VALIDATION
exports.createStudent = async (req, res) => {
  try {
    const {
      idNumber, firstName, middleName, lastName, age, gender, gradeLevel, section, address
    } = req.body;

    console.log('🔍 [STUDENT ADMIN] Create student validation starting...', {
      idNumber, firstName, lastName, middleName, age, gradeLevel
    });

    // Comprehensive validation
    const validationErrors = [];

    // Validate ID number
    const idNumberResult = adminValidation.validateIdNumber(idNumber);
    if (!idNumberResult.isValid) {
      validationErrors.push(...idNumberResult.errors);
    }

    // Validate first name
    const firstNameResult = adminValidation.validateName(firstName, 'First Name');
    if (!firstNameResult.isValid) {
      validationErrors.push(...firstNameResult.errors);
    }

    // Validate last name
    const lastNameResult = adminValidation.validateName(lastName, 'Last Name');
    if (!lastNameResult.isValid) {
      validationErrors.push(...lastNameResult.errors);
    }

    // Validate middle name (optional but must be valid if provided)
    let middleNameResult = { isValid: true, sanitized: '' };
    if (middleName && middleName.trim()) {
      middleNameResult = adminValidation.validateName(middleName, 'Middle Name', true);
      if (!middleNameResult.isValid) {
        validationErrors.push(...middleNameResult.errors);
      }
    }

    // Validate age
    const ageResult = adminValidation.validateAge(age);
    if (!ageResult.isValid) {
      validationErrors.push(...ageResult.errors);
    }

    // Validate grade level
    const gradeLevelResult = adminValidation.validateGradeLevel(gradeLevel);
    if (!gradeLevelResult.isValid) {
      validationErrors.push(...gradeLevelResult.errors);
    }

    // Validate section (required)
    const sectionResult = adminValidation.validateText(section, 'Section', true, 50);
    if (!sectionResult.isValid) {
      validationErrors.push(...sectionResult.errors);
    }

    // Validate address (optional)
    const addressResult = adminValidation.validateText(address, 'Address', false, 200);
    if (!addressResult.isValid) {
      validationErrors.push(...addressResult.errors);
    }

    // Validate gender (basic check)
    if (!gender || typeof gender !== 'string' || !gender.trim()) {
      validationErrors.push('Gender is required');
    } else {
      const validGenders = ['Male', 'Female', 'Other'];
      if (!validGenders.includes(gender.trim())) {
        validationErrors.push('Gender must be Male, Female, or Other');
      }
    }

    // If there are validation errors, return them
    if (validationErrors.length > 0) {
      console.log('🚨 [STUDENT ADMIN] Create validation failed:', validationErrors);
      console.log('🚨 [STUDENT ADMIN] Received data:', JSON.stringify({
        idNumber, firstName, middleName, lastName, age, gender, gradeLevel, section, address
      }, null, 2));
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        userType: 'student',
        validationErrors: validationErrors,
        receivedData: {
          idNumber: idNumber,
          firstName: firstName,
          middleName: middleName,
          lastName: lastName,
          age: age,
          gender: gender,
          gradeLevel: gradeLevel,
          section: section,
          address: address
        },
        details: 'Please fix the validation errors and try again.'
      });
    }

    console.log('✅ [STUDENT ADMIN] Create validation passed, proceeding...');

    // Check for duplicate ID number
    const collection = await getStudentCollection();
    const existingStudent = await collection.findOne({ idNumber: idNumberResult.sanitized });
    if (existingStudent) {
      return res.status(400).json({
        success: false,
        message: 'ID Number already exists',
        userType: 'student',
        validationErrors: [`A student with ID number ${idNumberResult.sanitized} already exists`],
        details: 'Please use a different ID number.'
      });
    }

    // Handle profile image upload
    let profileImageUrl = '';
    if (req.file) {
      try {
        console.log('📸 [STUDENT ADMIN] Uploading profile image to S3...', {
          filename: req.file.originalname,
          mimetype: req.file.mimetype,
          size: req.file.size
        });
        profileImageUrl = await uploadToS3(req.file, 'student-profiles');
        console.log('✅ [STUDENT ADMIN] Profile image uploaded successfully:', profileImageUrl);
      } catch (uploadError) {
        console.error('🚨 [STUDENT ADMIN] S3 upload failed:', uploadError);
        // Continue with student creation even if image upload fails
        console.warn('⚠️ [STUDENT ADMIN] Proceeding without profile image');
      }
    } else {
      console.log('ℹ️ [STUDENT ADMIN] No profile image provided');
    }

    // Create student document using sanitized data from validation
    const now = new Date();
    const studentDoc = {
      idNumber: idNumberResult.sanitized,
      firstName: firstNameResult.sanitized,
      middleName: middleNameResult.sanitized,
      lastName: lastNameResult.sanitized,
      age: ageResult.sanitized,
      gender: gender.trim(),
      gradeLevel: gradeLevelResult.sanitized,
      section: sectionResult.sanitized,
      address: addressResult.sanitized,
      profileImageUrl: profileImageUrl || '',
      readingLevel: null,
      readingPercentage: null,
      preAssessmentCompleted: false,
      createdAt: now,
      updatedAt: now
    };

    const result = await collection.insertOne(studentDoc);
    studentDoc._id = result.insertedId;

    console.log('✅ [STUDENT ADMIN] Student created successfully');

    res.json({
      success: true,
      message: 'Student created successfully',
      data: { studentProfile: studentDoc }
    });
  } catch (err) {
    console.error('🚨 [STUDENT ADMIN] Error creating student:', err);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: err.message,
      details: 'An unexpected error occurred while creating the student account.'
    });
  }
};

// UPDATE student
exports.updateStudent = async (req, res) => {
  try {
    const studentId = req.params.id;
    const {
      idNumber, firstName, middleName, lastName, age, gender, gradeLevel, section, address
    } = req.body;

    console.log('🔍 [STUDENT ADMIN] Update student validation starting...', {
      studentId, idNumber, firstName, lastName, middleName, age, gradeLevel
    });

    // Comprehensive validation
    const validationErrors = [];

    // Validate ID number
    const idNumberResult = adminValidation.validateIdNumber(idNumber);
    if (!idNumberResult.isValid) {
      validationErrors.push(...idNumberResult.errors);
    }

    // Validate first name
    const firstNameResult = adminValidation.validateName(firstName, 'First Name');
    if (!firstNameResult.isValid) {
      validationErrors.push(...firstNameResult.errors);
    }

    // Validate last name
    const lastNameResult = adminValidation.validateName(lastName, 'Last Name');
    if (!lastNameResult.isValid) {
      validationErrors.push(...lastNameResult.errors);
    }

    // Validate middle name (optional but must be valid if provided)
    let middleNameResult = { isValid: true, sanitized: '' };
    if (middleName && middleName.trim()) {
      middleNameResult = adminValidation.validateName(middleName, 'Middle Name', true);
      if (!middleNameResult.isValid) {
        validationErrors.push(...middleNameResult.errors);
      }
    }

    // Validate age
    const ageResult = adminValidation.validateAge(age);
    if (!ageResult.isValid) {
      validationErrors.push(...ageResult.errors);
    }

    // Validate grade level
    const gradeLevelResult = adminValidation.validateGradeLevel(gradeLevel);
    if (!gradeLevelResult.isValid) {
      validationErrors.push(...gradeLevelResult.errors);
    }

    // Validate section (required)
    const sectionResult = adminValidation.validateText(section, 'Section', true, 50);
    if (!sectionResult.isValid) {
      validationErrors.push(...sectionResult.errors);
    }

    // Validate address (optional)
    const addressResult = adminValidation.validateText(address, 'Address', false, 200);
    if (!addressResult.isValid) {
      validationErrors.push(...addressResult.errors);
    }

    // Validate gender (basic check)
    if (!gender || typeof gender !== 'string' || !gender.trim()) {
      validationErrors.push('Gender is required');
    } else {
      const validGenders = ['Male', 'Female', 'Other'];
      if (!validGenders.includes(gender.trim())) {
        validationErrors.push('Gender must be Male, Female, or Other');
      }
    }

    // If there are validation errors, return them
    if (validationErrors.length > 0) {
      console.log('🚨 [STUDENT ADMIN] Update validation failed:', validationErrors);
      console.log('🚨 [STUDENT ADMIN] Received data:', JSON.stringify({
        idNumber, firstName, middleName, lastName, age, gender, gradeLevel, section, address
      }, null, 2));
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        userType: 'student',
        validationErrors: validationErrors,
        receivedData: {
          idNumber: idNumber,
          firstName: firstName,
          middleName: middleName,
          lastName: lastName,
          age: age,
          gender: gender,
          gradeLevel: gradeLevel,
          section: section,
          address: address
        },
        details: 'Please fix the validation errors and try again.'
      });
    }

    console.log('✅ [STUDENT ADMIN] Update validation passed, proceeding...');

    // Check for duplicate ID number (excluding current student)
    const collection = await getStudentCollection();
    const existingStudent = await collection.findOne({
      idNumber: idNumberResult.sanitized,
      _id: { $ne: new mongoose.Types.ObjectId(studentId) }
    });
    if (existingStudent) {
      return res.status(400).json({
        success: false,
        message: 'ID Number already exists',
        userType: 'student',
        validationErrors: [`Another student with ID number ${idNumberResult.sanitized} already exists`],
        details: 'Please use a different ID number.'
      });
    }

    // Handle profile image upload
    let profileImageUrl = '';
    if (req.file) {
      profileImageUrl = await uploadToS3(req.file, 'student-profiles');
    }

    // Use sanitized data from validation
    const updateData = {
      idNumber: idNumberResult.sanitized,
      firstName: firstNameResult.sanitized,
      middleName: middleNameResult.sanitized,
      lastName: lastNameResult.sanitized,
      age: ageResult.sanitized,
      gender: gender.trim(),
      gradeLevel: gradeLevelResult.sanitized,
      section: sectionResult.sanitized,
      address: addressResult.sanitized,
      updatedAt: new Date()
    };

    if (profileImageUrl) {
      updateData.profileImageUrl = profileImageUrl;
    }

    await collection.updateOne(
      { _id: new mongoose.Types.ObjectId(studentId) },
      { $set: updateData }
    );

    const updatedProfile = await collection.findOne({ _id: new mongoose.Types.ObjectId(studentId) });
    if (!updatedProfile) {
      return res.status(404).json({ success: false, message: 'Student not found' });
    }

    console.log('✅ [STUDENT ADMIN] Student updated successfully');

    res.json({
      success: true,
      message: 'Student updated successfully',
      data: { studentProfile: updatedProfile }
    });
  } catch (err) {
    console.error('🚨 [STUDENT ADMIN] Error updating student:', err);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: err.message,
      details: 'An unexpected error occurred while updating the student account.'
    });
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