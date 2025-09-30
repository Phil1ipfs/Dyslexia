const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
const multer = require('multer');
const upload = multer();
const uploadToS3 = require('../utils/s3Upload');

/**
 * Comprehensive email uniqueness validation across ALL user types and collections
 */
const validateEmailUniqueness = async (email) => {
  try {
    console.log('🔍 [EMAIL VALIDATION] Starting comprehensive email uniqueness check for:', email);

    const sanitizedEmail = email.toLowerCase().trim();

    // Check 1: teachers.profile collection
    console.log('🔍 [EMAIL VALIDATION] Checking teachers.profile collection...');
    const teachersDb = mongoose.connection.useDb('teachers');
    const teachersCollection = teachersDb.collection('profile');
    const existingTeacher = await teachersCollection.findOne({ email: sanitizedEmail });

    if (existingTeacher) {
      console.log('❌ [EMAIL VALIDATION] Email found in teachers.profile:', existingTeacher._id);
      return {
        isUnique: false,
        existingUserType: 'teacher',
        foundInCollection: 'teachers.profile',
        existingRecord: {
          id: existingTeacher._id,
          name: `${existingTeacher.firstName} ${existingTeacher.lastName}`,
          email: existingTeacher.email
        }
      };
    }

    // Check 2: parent.parent_profile collection
    console.log('🔍 [EMAIL VALIDATION] Checking parent.parent_profile collection...');
    const parentDb = mongoose.connection.useDb('parent');
    const parentCollection = parentDb.collection('parent_profile');
    const existingParent = await parentCollection.findOne({ email: sanitizedEmail });

    if (existingParent) {
      console.log('❌ [EMAIL VALIDATION] Email found in parent.parent_profile:', existingParent._id);
      return {
        isUnique: false,
        existingUserType: 'parent',
        foundInCollection: 'parent.parent_profile',
        existingRecord: {
          id: existingParent._id,
          name: `${existingParent.firstName} ${existingParent.lastName}`,
          email: existingParent.email
        }
      };
    }

    // Check 3: users_web.users collection (general users/login accounts)
    console.log('🔍 [EMAIL VALIDATION] Checking users_web.users collection...');
    const usersWebDb = mongoose.connection.useDb('users_web');
    const usersCollection = usersWebDb.collection('users');
    const existingUser = await usersCollection.findOne({ email: sanitizedEmail });

    if (existingUser) {
      console.log('❌ [EMAIL VALIDATION] Email found in users_web.users:', existingUser._id);
      return {
        isUnique: false,
        existingUserType: 'user account',
        foundInCollection: 'users_web.users',
        existingRecord: {
          id: existingUser._id,
          email: existingUser.email,
          roles: existingUser.roles
        }
      };
    }

    // Check 4: test.users collection (student users)
    console.log('🔍 [EMAIL VALIDATION] Checking test.users collection...');
    const testDb = mongoose.connection.useDb('test');
    const studentsCollection = testDb.collection('users');
    const existingStudent = await studentsCollection.findOne({ email: sanitizedEmail });

    if (existingStudent) {
      console.log('❌ [EMAIL VALIDATION] Email found in test.users:', existingStudent._id);
      return {
        isUnique: false,
        existingUserType: 'student',
        foundInCollection: 'test.users',
        existingRecord: {
          id: existingStudent._id,
          name: `${existingStudent.firstName} ${existingStudent.lastName}`,
          email: existingStudent.email
        }
      };
    }

    // Check 5: admin_user.admin_profile collection
    console.log('🔍 [EMAIL VALIDATION] Checking admin_user.admin_profile collection...');
    const adminDb = mongoose.connection.useDb('admin_user');
    const adminCollection = adminDb.collection('admin_profile');
    const existingAdmin = await adminCollection.findOne({ email: sanitizedEmail });

    if (existingAdmin) {
      console.log('❌ [EMAIL VALIDATION] Email found in admin_user.admin_profile:', existingAdmin._id);
      return {
        isUnique: false,
        existingUserType: 'admin',
        foundInCollection: 'admin_user.admin_profile',
        existingRecord: {
          id: existingAdmin._id,
          name: `${existingAdmin.firstName} ${existingAdmin.lastName}`,
          email: existingAdmin.email
        }
      };
    }

    // All checks passed - email is unique across all systems
    console.log('✅ [EMAIL VALIDATION] Email is UNIQUE across ALL collections and user types');
    return {
      isUnique: true,
      checkedCollections: [
        'teachers.profile',
        'parent.parent_profile',
        'users_web.users',
        'test.users',
        'admin_user.admin_profile'
      ],
      message: 'Email is available for use'
    };

  } catch (error) {
    console.error('❌ [EMAIL VALIDATION] Error during email validation:', error);
    return {
      isUnique: false,
      error: true,
      message: 'Email validation failed due to system error',
      details: error.message
    };
  }
};

// Comprehensive admin validation utility
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
      console.log(`🚨 [ADMIN VALIDATION] REJECTING ${fieldName} with numbers: "${trimmed}"`);
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

  // Contact number validation (Philippine format)
  validateContactNumber: (contact, fieldName = 'Contact Number') => {
    if (!contact || typeof contact !== 'string') {
      return { isValid: false, errors: [`${fieldName} is required`] };
    }

    const trimmed = contact.trim();
    if (!trimmed) {
      return { isValid: false, errors: [`${fieldName} cannot be empty`] };
    }

    // Check if only contains valid characters
    if (!/^[\d\s\-\(\)\+]+$/.test(trimmed)) {
      return { isValid: false, errors: [`${fieldName} can only contain numbers, spaces, hyphens, parentheses, and plus sign`] };
    }

    // Remove all non-digits for validation
    const digitsOnly = trimmed.replace(/\D/g, '');

    // Philippine phone number validation
    let isValidFormat = false;
    if (digitsOnly.length === 11 && digitsOnly.startsWith('09')) {
      isValidFormat = true; // Mobile: 09xxxxxxxxx
    } else if (digitsOnly.length === 13 && digitsOnly.startsWith('639')) {
      isValidFormat = true; // International: +639xxxxxxxxx
    } else if (digitsOnly.length >= 7 && digitsOnly.length <= 11) {
      isValidFormat = true; // Landline variations
    }

    if (!isValidFormat) {
      return {
        isValid: false,
        errors: [
          `${fieldName} must be a valid Philippine number format:`,
          '• Mobile: 09XXXXXXXXX (11 digits)',
          '• International: +639XXXXXXXXX',
          '• Landline: 02XXXXXXXX or area code variations'
        ]
      };
    }

    return { isValid: true, errors: [], sanitized: digitsOnly };
  },

  // Email validation
  validateEmail: (email, fieldName = 'Email') => {
    if (!email || typeof email !== 'string') {
      return { isValid: false, errors: [`${fieldName} is required`] };
    }

    const trimmed = email.trim().toLowerCase();
    if (!trimmed) {
      return { isValid: false, errors: [`${fieldName} cannot be empty`] };
    }

    // Basic email format validation
    const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    if (!emailRegex.test(trimmed)) {
      return { isValid: false, errors: [`${fieldName} must be a valid email format (e.g., user@gmail.com)`] };
    }

    if (trimmed.length > 100) {
      return { isValid: false, errors: [`${fieldName} must be less than 100 characters`] };
    }

    return { isValid: true, errors: [], sanitized: trimmed };
  },

  // Date validation for parents
  validateBirthdate: (date, fieldName = 'Date of Birth') => {
    if (!date || typeof date !== 'string') {
      return { isValid: false, errors: [`${fieldName} is required`] };
    }

    const trimmed = date.trim();
    if (!trimmed) {
      return { isValid: false, errors: [`${fieldName} cannot be empty`] };
    }

    // Check date format (YYYY-MM-DD)
    const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
    if (!dateRegex.test(trimmed)) {
      return { isValid: false, errors: [`${fieldName} must be in YYYY-MM-DD format`] };
    }

    // Parse and validate date
    const parsedDate = new Date(trimmed);
    if (isNaN(parsedDate.getTime())) {
      return { isValid: false, errors: [`${fieldName} is not a valid date`] };
    }

    const now = new Date();

    // Check if date is in the future
    if (parsedDate > now) {
      return { isValid: false, errors: [`${fieldName} cannot be in the future`] };
    }

    // Age validation for parents (must be at least 16)
    const userAge = Math.floor((now - parsedDate) / (365.25 * 24 * 60 * 60 * 1000));
    if (userAge < 16) {
      return { isValid: false, errors: ['Parents must be at least 16 years old'] };
    }
    if (userAge > 100) {
      return { isValid: false, errors: ['Please verify the birth date - age seems unusually high'] };
    }

    return { isValid: true, errors: [], sanitized: trimmed };
  },

  // Text validation
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
  }
};

// Helper: get parent profile collection
const getParentProfileCollection = async () => {
  const db = mongoose.connection.useDb('parent');
  return db.collection('parent_profile');
};

// Helper: get user model from users_web
const getUserModel = async () => {
  const userSchema = new mongoose.Schema({
    email: String,
    passwordHash: String,
    roles: mongoose.Schema.Types.ObjectId,
    updatedAt: Date
  }, { collection: 'users' });
  const userConnection = mongoose.connection.useDb('users_web');
  try {
    return userConnection.model('User');
  } catch (e) {
    return userConnection.model('User', userSchema);
  }
};

// Helper: generate random password
const generatePassword = (length = 8) => {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let password = '';
  for (let i = 0; i < length; i++) {
    password += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return password;
};

// Add this helper:
const getStudentCollection = async () => {
  const db = mongoose.connection.useDb('test');
  return db.collection('users');
};

exports.createParent = async (req, res) => {
  try {
    const {
      firstName, lastName, middleName, contact, address, civilStatus, dateOfBirth, gender, email, children = []
    } = req.body;

    console.log('🔍 [PARENT ADMIN] Create parent validation starting...', {
      firstName, lastName, middleName, contact, email, dateOfBirth
    });

    // Comprehensive validation
    const validationErrors = [];

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

    // Validate email
    const emailResult = adminValidation.validateEmail(email);
    if (!emailResult.isValid) {
      validationErrors.push(...emailResult.errors);
    }

    // Validate contact number
    const contactResult = adminValidation.validateContactNumber(contact);
    if (!contactResult.isValid) {
      validationErrors.push(...contactResult.errors);
    }

    // Validate birthdate (optional)
    let birthdateResult = { isValid: true, sanitized: dateOfBirth };
    if (dateOfBirth && dateOfBirth.trim()) {
      birthdateResult = adminValidation.validateBirthdate(dateOfBirth);
      if (!birthdateResult.isValid) {
        validationErrors.push(...birthdateResult.errors);
      }
    }

    // Validate address (optional)
    const addressResult = adminValidation.validateText(address, 'Address', false, 200);
    if (!addressResult.isValid) {
      validationErrors.push(...addressResult.errors);
    }

    // If there are validation errors, return them
    if (validationErrors.length > 0) {
      console.log('🚨 [PARENT ADMIN] Validation failed:', validationErrors);
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        userType: 'parent',
        validationErrors: validationErrors,
        details: 'Please fix the validation errors and try again.'
      });
    }

    console.log('✅ [PARENT ADMIN] Validation passed, proceeding with parent creation...');

    // Use sanitized data from validation
    const sanitizedData = {
      firstName: firstNameResult.sanitized,
      lastName: lastNameResult.sanitized,
      middleName: middleNameResult.sanitized || '',
      email: emailResult.sanitized,
      contact: contactResult.sanitized,
      dateOfBirth: birthdateResult.sanitized,
      address: addressResult.sanitized || ''
    };

    // Ensure children is always an array
    const childrenArray = Array.isArray(children) ? children : (children ? [children] : []);

    // COMPREHENSIVE cross-system email duplication check
    console.log('🔍 [PARENT CREATION] Checking for duplicate emails across ALL user types...');

    const emailValidationResult = await validateEmailUniqueness(sanitizedData.email);
    if (!emailValidationResult.isUnique) {
      console.error('❌ [PARENT CREATION] Email validation failed:', emailValidationResult);
      return res.status(400).json({
        success: false,
        message: 'Email already registered',
        userType: 'parent',
        validationErrors: [`This email is already registered as a ${emailValidationResult.existingUserType} in the system.`],
        details: `Email "${sanitizedData.email}" is already associated with a ${emailValidationResult.existingUserType} account. Please use a different email address.`,
        existingUser: emailValidationResult.existingRecord,
        foundInCollection: emailValidationResult.foundInCollection
      });
    }

    console.log('✅ [PARENT CREATION] Email is unique across ALL collections and user types');

    // 1. Generate password
    const password = generatePassword(8);

    // 2. Hash password
    const passwordHash = await bcrypt.hash(password, 10);

    // 3. Get User model and create user in users_web.users
    const User = await getUserModel();
    const userDoc = new User({
      email: sanitizedData.email,
      passwordHash,
      roles: new mongoose.Types.ObjectId('681b690af9fd9071c6ac2f3b'), // Parent role ObjectId
      updatedAt: new Date()
    });
    await userDoc.save();
    console.log('✅ [PARENT ADMIN] User created in users_web.users');

    // 4. Get profile collection and create parent profile in parent.parent_profile
    const profileCollection = await getParentProfileCollection();
    const now = new Date();
    const profileImageUrl = req.file ? await uploadToS3(req.file, 'parent-profiles') : null;
    const profileDoc = {
      userId: userDoc._id,
      firstName: sanitizedData.firstName,
      lastName: sanitizedData.lastName,
      middleName: sanitizedData.middleName,
      contact: sanitizedData.contact,
      address: sanitizedData.address,
      civilStatus,
      dateOfBirth: sanitizedData.dateOfBirth,
      gender,
      email: sanitizedData.email,
      children: childrenArray,
      profileImageUrl: profileImageUrl || '',
      createdAt: now,
      updatedAt: now
    };
    const insertResult = await profileCollection.insertOne(profileDoc);
    const parentId = insertResult.insertedId;
    // --- Bidirectional linking: update students' parentId field ---
    const studentCollection = await getStudentCollection();
    const validChildrenObjectIds = childrenArray
      .filter(id => mongoose.Types.ObjectId.isValid(id))
      .map(id => new mongoose.Types.ObjectId(id));
    if (validChildrenObjectIds.length > 0) {
      await studentCollection.updateMany(
        { _id: { $in: validChildrenObjectIds } },
        { $set: { parentId: parentId } }
      );
    }
    // Remove this parentId from students not in childrenArray
    await studentCollection.updateMany(
      { parentId: parentId, _id: { $nin: validChildrenObjectIds } },
      { $unset: { parentId: "" } }
    );
    console.log('✅ [PARENT ADMIN] Parent profile created successfully');

    // 5. Respond with credentials for admin to display
    res.json({
      success: true,
      message: 'Parent created successfully',
      data: {
        parentProfile: { ...profileDoc, _id: parentId },
        credentials: { email: sanitizedData.email, password }
      }
    });
  } catch (err) {
    console.error('🚨 [PARENT ADMIN] Error creating parent:', err);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: err.message,
      details: 'An unexpected error occurred while creating the parent account.'
    });
  }
};

exports.updateParent = async (req, res) => {
  try {
    const parentId = req.params.id;
    const {
      firstName, lastName, middleName, contact, address, civilStatus, dateOfBirth, gender, email, children = []
    } = req.body;

    console.log('🔍 [PARENT ADMIN] Update parent validation starting...', {
      parentId, firstName, lastName, middleName, contact, email, dateOfBirth
    });

    // Comprehensive validation
    const validationErrors = [];

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

    // Validate email
    const emailResult = adminValidation.validateEmail(email);
    if (!emailResult.isValid) {
      validationErrors.push(...emailResult.errors);
    }

    // Validate contact number
    const contactResult = adminValidation.validateContactNumber(contact);
    if (!contactResult.isValid) {
      validationErrors.push(...contactResult.errors);
    }

    // Validate birthdate (optional)
    let birthdateResult = { isValid: true, sanitized: dateOfBirth };
    if (dateOfBirth && dateOfBirth.trim()) {
      birthdateResult = adminValidation.validateBirthdate(dateOfBirth);
      if (!birthdateResult.isValid) {
        validationErrors.push(...birthdateResult.errors);
      }
    }

    // Validate address (optional)
    const addressResult = adminValidation.validateText(address, 'Address', false, 200);
    if (!addressResult.isValid) {
      validationErrors.push(...addressResult.errors);
    }

    // If there are validation errors, return them
    if (validationErrors.length > 0) {
      console.log('🚨 [PARENT ADMIN] Update validation failed:', validationErrors);
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        userType: 'parent',
        validationErrors: validationErrors,
        details: 'Please fix the validation errors and try again.'
      });
    }

    console.log('✅ [PARENT ADMIN] Update validation passed, proceeding...');

    // Use sanitized data from validation
    const sanitizedData = {
      firstName: firstNameResult.sanitized,
      lastName: lastNameResult.sanitized,
      middleName: middleNameResult.sanitized || '',
      email: emailResult.sanitized,
      contact: contactResult.sanitized,
      dateOfBirth: birthdateResult.sanitized,
      address: addressResult.sanitized || ''
    };

    // Ensure children is always an array
    const childrenArray = Array.isArray(children) ? children : (children ? [children] : []);

    // Update parent profile
    const profileCollection = await getParentProfileCollection();
    const updateData = {
      firstName: sanitizedData.firstName,
      lastName: sanitizedData.lastName,
      middleName: sanitizedData.middleName,
      contact: sanitizedData.contact,
      address: sanitizedData.address,
      civilStatus,
      dateOfBirth: sanitizedData.dateOfBirth,
      gender,
      email: sanitizedData.email,
      children: childrenArray,
      updatedAt: new Date()
    };
    // Handle profile image upload if file is present
    if (req.file) {
      const profileImageUrl = await uploadToS3(req.file, 'parent-profiles');
      updateData.profileImageUrl = profileImageUrl;
    }
    await profileCollection.updateOne(
      { _id: new mongoose.Types.ObjectId(parentId) },
      { $set: updateData }
    );
    const updatedProfile = await profileCollection.findOne({ _id: new mongoose.Types.ObjectId(parentId) });
    if (!updatedProfile) {
      return res.status(404).json({ success: false, message: 'Parent not found' });
    }
    // Also update user in users_web.users if email is changed
    if (sanitizedData.email && updatedProfile.userId) {
      const User = await getUserModel();
      await User.updateOne(
        { _id: updatedProfile.userId },
        { $set: { email: sanitizedData.email, updatedAt: new Date() } }
      );
      console.log('✅ [PARENT ADMIN] User email updated in users_web.users');
    }
    // --- Bidirectional linking: update students' parentId field ---
    const studentCollection = await getStudentCollection();
    const validChildrenObjectIds = childrenArray
      .filter(id => mongoose.Types.ObjectId.isValid(id))
      .map(id => new mongoose.Types.ObjectId(id));
    if (validChildrenObjectIds.length > 0) {
      await studentCollection.updateMany(
        { _id: { $in: validChildrenObjectIds } },
        { $set: { parentId: new mongoose.Types.ObjectId(parentId) } }
      );
    }
    // Remove this parentId from students not in childrenArray
    await studentCollection.updateMany(
      { parentId: new mongoose.Types.ObjectId(parentId), _id: { $nin: validChildrenObjectIds } },
      { $unset: { parentId: "" } }
    );
    console.log('✅ [PARENT ADMIN] Parent updated successfully');

    res.json({
      success: true,
      message: 'Parent updated successfully',
      data: { parentProfile: updatedProfile }
    });
  } catch (err) {
    console.error('🚨 [PARENT ADMIN] Error updating parent:', err);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: err.message,
      details: 'An unexpected error occurred while updating the parent account.'
    });
  }
};

exports.deleteParent = async (req, res) => {
  try {
    const parentId = req.params.id;
    const profileCollection = await getParentProfileCollection();
    // Find the profile to get userId
    const profile = await profileCollection.findOne({ _id: new mongoose.Types.ObjectId(parentId) });
    if (!profile) {
      return res.status(404).json({ success: false, message: 'Parent not found' });
    }
    // Delete the profile
    const deleteResult = await profileCollection.deleteOne({ _id: new mongoose.Types.ObjectId(parentId) });
    if (deleteResult.deletedCount === 0) {
      return res.status(500).json({ success: false, message: 'Failed to delete parent profile' });
    }
    // Delete the user in users_web.users
    if (profile.userId) {
      const User = await getUserModel();
      await User.deleteOne({ _id: profile.userId });
    }
    res.json({ success: true, message: 'Parent deleted successfully' });
  } catch (err) {
    console.error('Error deleting parent:', err);
    res.status(500).json({ success: false, message: 'Server error', error: err.message });
  }
};

exports.uploadParentProfileImage = async (req, res) => {
  try {
    const parentId = req.params.id;
    const profileCollection = await getParentProfileCollection();
    const profile = await profileCollection.findOne({ _id: new mongoose.Types.ObjectId(parentId) });
    if (!profile) {
      return res.status(404).json({ success: false, message: 'Parent not found' });
    }

    let profileImageUrl = profile.profileImageUrl;
    if (req.file) {
      profileImageUrl = await uploadToS3(req.file, 'parent-profiles');
    }

    await profileCollection.updateOne(
      { _id: new mongoose.Types.ObjectId(parentId) },
      { $set: { profileImageUrl } }
    );

    res.json({
      success: true,
      message: 'Parent profile image updated successfully',
      data: { profileImageUrl }
    });
  } catch (err) {
    console.error('Error updating parent profile image:', err);
    res.status(500).json({ success: false, message: 'Server error', error: err.message });
  }
};

// GET all parents
exports.getParents = async (req, res) => {
  try {
    const profileCollection = await getParentProfileCollection();
    const parents = await profileCollection.find({}).toArray();
    res.json({ success: true, data: parents });
  } catch (err) {
    console.error('Error fetching parents:', err);
    res.status(500).json({ success: false, message: 'Server error', error: err.message });
  }
}; 