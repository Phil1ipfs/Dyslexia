// Updated teacherProfileController.js
const bcrypt = require('bcrypt');
const mongoose = require('mongoose');
const { Upload } = require('@aws-sdk/lib-storage');
const { DeleteObjectCommand } = require('@aws-sdk/client-s3');
const s3Client = require('../../config/s3');
const path = require('path');
const slugify = require('slugify'); // Add this dependency if not already installed
const multer = require('multer');
const upload = multer();
const uploadToS3 = require('../../utils/s3Upload');

/**
 * Helper function to safely convert a string to ObjectId
 */
const toObjectId = (id) => {
  try {
    if (mongoose.Types.ObjectId.isValid(id)) {
      return new mongoose.Types.ObjectId(id);
    }
  } catch (error) {
    console.error('Invalid ObjectId:', id);
  }
  return null;
};

/**
 * Input validation and sanitization utility functions
 */
const validateAndSanitizeInput = {
  // Sanitize name fields (remove numbers, special chars except spaces, hyphens, apostrophes)
  sanitizeName: (name) => {
    if (!name || typeof name !== 'string') return '';

    const original = name.trim();

    // CRITICAL: If name contains numbers, REJECT completely - don't sanitize
    if (/\d/.test(original)) {
      console.log(`🚨 [SANITIZATION] REJECTING name with numbers: "${original}" - returning empty string`);
      return ''; // Return empty string to indicate rejection
    }

    const sanitized = original
      .replace(/[^a-zA-Z\s\-']/g, '') // Only letters, spaces, hyphens, apostrophes
      .replace(/\s+/g, ' ') // Multiple spaces to single space
      .substring(0, 50); // Max length 50 chars

    // Log if sanitization changed the input (for debugging)
    if (original !== sanitized) {
      console.log(`🧹 [SANITIZATION] Name sanitized: "${original}" → "${sanitized}"`);
    }

    return sanitized;
  },

  // Validate and sanitize phone numbers (Philippines format)
  sanitizePhoneNumber: (phone) => {
    if (!phone || typeof phone !== 'string') return '';

    // Remove all non-digits
    const digitsOnly = phone.replace(/\D/g, '');

    // Philippines phone number validation
    // Mobile: 09xxxxxxxxx (11 digits) or +639xxxxxxxxx (13 digits)
    // Landline: 02xxxxxxxx (10 digits) or area code variations

    if (digitsOnly.length === 11 && digitsOnly.startsWith('09')) {
      return digitsOnly; // Mobile number
    } else if (digitsOnly.length === 13 && digitsOnly.startsWith('639')) {
      return '+' + digitsOnly; // International mobile format
    } else if (digitsOnly.length >= 10 && digitsOnly.length <= 11) {
      return digitsOnly; // Landline or other valid format
    }

    return ''; // Invalid format
  },

  // Sanitize email
  sanitizeEmail: (email) => {
    if (!email || typeof email !== 'string') return '';
    return email.toLowerCase().trim().substring(0, 100);
  },

  // Sanitize text fields (remove potentially dangerous characters)
  sanitizeText: (text, maxLength = 100) => {
    if (!text || typeof text !== 'string') return '';
    return text
      .trim()
      .replace(/[<>\"'&]/g, '') // Remove potentially dangerous HTML chars
      .substring(0, maxLength);
  },

  // Validate date format (YYYY-MM-DD)
  validateDate: (date) => {
    if (!date) return '';
    const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
    if (!dateRegex.test(date)) return '';

    const parsedDate = new Date(date);
    if (isNaN(parsedDate.getTime())) return '';

    // Check if date is reasonable (not in future, not too old)
    const now = new Date();
    const minDate = new Date(now.getFullYear() - 100, 0, 1); // 100 years ago

    if (parsedDate > now || parsedDate < minDate) return '';

    return date;
  },

  // Validate and sanitize emergency contact
  sanitizeEmergencyContact: (emergencyContact) => {
    if (!emergencyContact || typeof emergencyContact !== 'object') {
      return { name: '', number: '' };
    }

    console.log('🔍 [SANITIZATION] Processing emergency contact:', {
      originalName: emergencyContact.name,
      originalNumber: emergencyContact.number
    });

    const sanitizedName = validateAndSanitizeInput.sanitizeName(emergencyContact.name);
    const sanitizedNumber = validateAndSanitizeInput.sanitizePhoneNumber(emergencyContact.number);

    console.log('✅ [SANITIZATION] Emergency contact processed:', {
      sanitizedName: sanitizedName,
      sanitizedNumber: sanitizedNumber
    });

    return {
      name: sanitizedName,
      number: sanitizedNumber
    };
  }
};

/**
 * Comprehensive input validation for profile updates with detailed logging
 */
const validateProfileInput = (data) => {
  const errors = [];
  const validationLog = [];

  console.log('🔍 [VALIDATION] Starting comprehensive input validation...');

  // Helper function to log validation details
  const logValidation = (field, value, isValid, errorMessage = null) => {
    const logEntry = {
      field,
      value: typeof value === 'string' ? value.substring(0, 50) : value,
      isValid,
      errorMessage
    };
    validationLog.push(logEntry);

    if (isValid) {
      console.log(`✅ [VALIDATION] ${field}: VALID - "${logEntry.value}"`);
    } else {
      console.log(`❌ [VALIDATION] ${field}: INVALID - "${logEntry.value}" - ${errorMessage}`);
    }
  };

  // Required field validation with detailed logging
  console.log('🔍 [VALIDATION] Checking required fields...');

  if (!data.firstName || data.firstName.trim().length === 0) {
    const error = 'First name is required and cannot be empty';
    errors.push(error);
    logValidation('firstName', data.firstName, false, error);
  } else {
    logValidation('firstName', data.firstName, true);
  }

  if (!data.lastName || data.lastName.trim().length === 0) {
    const error = 'Last name is required and cannot be empty';
    errors.push(error);
    logValidation('lastName', data.lastName, false, error);
  } else {
    logValidation('lastName', data.lastName, true);
  }

  if (!data.email || data.email.trim().length === 0) {
    const error = 'Email is required and cannot be empty';
    errors.push(error);
    logValidation('email', data.email, false, error);
  } else {
    logValidation('email', data.email, true);
  }

  // Email format validation with detailed logging
  console.log('🔍 [VALIDATION] Checking email format...');
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (data.email && !emailRegex.test(data.email)) {
    const error = 'Invalid email format. Please use format: example@domain.com';
    errors.push(error);
    logValidation('email format', data.email, false, error);
  } else if (data.email) {
    logValidation('email format', data.email, true);
  }

  // Name validation with detailed logging (no numbers or special characters)
  console.log('🔍 [VALIDATION] Checking name format restrictions...');
  const nameRegex = /^[a-zA-Z\s\-']+$/;

  // STRICT VALIDATION: Check for numbers first (explicit rejection)
  if (data.firstName && /\d/.test(data.firstName)) {
    const error = `First name "${data.firstName}" contains numbers which are not allowed. Please use only letters, spaces, hyphens, and apostrophes.`;
    errors.push(error);
    logValidation('firstName format', data.firstName, false, error);
  } else if (data.firstName && !nameRegex.test(data.firstName)) {
    const error = 'First name can only contain letters, spaces, hyphens, and apostrophes. Numbers and special characters are not allowed.';
    errors.push(error);
    logValidation('firstName format', data.firstName, false, error);
  } else if (data.firstName) {
    logValidation('firstName format', data.firstName, true);
  }

  // STRICT VALIDATION: Check last name for numbers
  if (data.lastName && /\d/.test(data.lastName)) {
    const error = `Last name "${data.lastName}" contains numbers which are not allowed. Please use only letters, spaces, hyphens, and apostrophes.`;
    errors.push(error);
    logValidation('lastName format', data.lastName, false, error);
  } else if (data.lastName && !nameRegex.test(data.lastName)) {
    const error = 'Last name can only contain letters, spaces, hyphens, and apostrophes. Numbers and special characters are not allowed.';
    errors.push(error);
    logValidation('lastName format', data.lastName, false, error);
  } else if (data.lastName) {
    logValidation('lastName format', data.lastName, true);
  }

  // STRICT VALIDATION: Check middle name for numbers
  if (data.middleName && data.middleName.trim() && /\d/.test(data.middleName)) {
    const error = `Middle name "${data.middleName}" contains numbers which are not allowed. Please use only letters, spaces, hyphens, and apostrophes.`;
    errors.push(error);
    logValidation('middleName format', data.middleName, false, error);
  } else if (data.middleName && data.middleName.trim() && !nameRegex.test(data.middleName)) {
    const error = 'Middle name can only contain letters, spaces, hyphens, and apostrophes. Numbers and special characters are not allowed.';
    errors.push(error);
    logValidation('middleName format', data.middleName, false, error);
  } else if (data.middleName && data.middleName.trim()) {
    logValidation('middleName format', data.middleName, true);
  }

  // Phone number validation with detailed logging
  console.log('🔍 [VALIDATION] Checking phone number format...');
  if (data.contact && data.contact.trim()) {
    const sanitizedPhone = validateAndSanitizeInput.sanitizePhoneNumber(data.contact);
    if (!sanitizedPhone) {
      const error = 'Invalid phone number format. Please use valid Philippines phone number format (e.g., 09171234567, +639171234567, or landline format)';
      errors.push(error);
      logValidation('contact phone', data.contact, false, error);
    } else {
      logValidation('contact phone', data.contact, true, `Sanitized to: ${sanitizedPhone}`);
    }
  }

  // Emergency contact validation with detailed logging
  console.log('🔍 [VALIDATION] Checking emergency contact data...');
  if (data.emergencyContact) {
    if (data.emergencyContact.name && data.emergencyContact.name.trim()) {
      // Check for numbers in emergency contact name
      const hasNumbers = /\d/.test(data.emergencyContact.name);
      if (hasNumbers) {
        const error = `Emergency contact name "${data.emergencyContact.name}" contains numbers which are not allowed. Please use only letters, spaces, hyphens, and apostrophes.`;
        errors.push(error);
        logValidation('emergency contact name', data.emergencyContact.name, false, error);
      } else if (!nameRegex.test(data.emergencyContact.name)) {
        const error = 'Emergency contact name can only contain letters, spaces, hyphens, and apostrophes. Numbers and special characters are not allowed.';
        errors.push(error);
        logValidation('emergency contact name', data.emergencyContact.name, false, error);
      } else {
        logValidation('emergency contact name', data.emergencyContact.name, true);
      }
    }

    if (data.emergencyContact.number && data.emergencyContact.number.trim()) {
      const sanitizedEmergencyPhone = validateAndSanitizeInput.sanitizePhoneNumber(data.emergencyContact.number);
      if (!sanitizedEmergencyPhone) {
        const error = 'Invalid emergency contact phone number format. Please use valid Philippines phone number format.';
        errors.push(error);
        logValidation('emergency contact phone', data.emergencyContact.number, false, error);
      } else {
        logValidation('emergency contact phone', data.emergencyContact.number, true, `Sanitized to: ${sanitizedEmergencyPhone}`);
      }
    }
  }

  // Date validation with detailed logging
  console.log('🔍 [VALIDATION] Checking date format...');
  if (data.dob && data.dob.trim()) {
    const validDate = validateAndSanitizeInput.validateDate(data.dob);
    if (!validDate) {
      const error = 'Invalid date of birth format. Please use YYYY-MM-DD format and ensure date is realistic (not in future, not more than 100 years ago)';
      errors.push(error);
      logValidation('date of birth', data.dob, false, error);
    } else {
      logValidation('date of birth', data.dob, true);
    }
  }

  // Gender validation with detailed logging
  console.log('🔍 [VALIDATION] Checking gender selection...');
  const validGenders = ['Male', 'Female', 'Other', ''];
  if (data.gender && !validGenders.includes(data.gender)) {
    const error = `Invalid gender selection. Please choose from: ${validGenders.filter(g => g).join(', ')}`;
    errors.push(error);
    logValidation('gender', data.gender, false, error);
  } else if (data.gender) {
    logValidation('gender', data.gender, true);
  }

  // Civil status validation with detailed logging
  console.log('🔍 [VALIDATION] Checking civil status selection...');
  const validCivilStatuses = ['Single', 'Married', 'Divorced', 'Widowed', 'Separated', ''];
  if (data.civilStatus && !validCivilStatuses.includes(data.civilStatus)) {
    const error = `Invalid civil status selection. Please choose from: ${validCivilStatuses.filter(s => s).join(', ')}`;
    errors.push(error);
    logValidation('civil status', data.civilStatus, false, error);
  } else if (data.civilStatus) {
    logValidation('civil status', data.civilStatus, true);
  }

  // Position validation with detailed logging
  console.log('🔍 [VALIDATION] Checking position field...');
  if (data.position && data.position.trim()) {
    const sanitizedPosition = validateAndSanitizeInput.sanitizeText(data.position, 100);
    if (sanitizedPosition !== data.position.trim()) {
      logValidation('position', data.position, true, `Sanitized to: ${sanitizedPosition}`);
    } else {
      logValidation('position', data.position, true);
    }
  }

  // Address validation with detailed logging
  console.log('🔍 [VALIDATION] Checking address field...');
  if (data.address && data.address.trim()) {
    const sanitizedAddress = validateAndSanitizeInput.sanitizeText(data.address, 200);
    if (sanitizedAddress !== data.address.trim()) {
      logValidation('address', data.address, true, `Sanitized to: ${sanitizedAddress}`);
    } else {
      logValidation('address', data.address, true);
    }
  }

  // Final validation summary
  console.log('📊 [VALIDATION SUMMARY] Total fields checked:', validationLog.length);
  console.log('📊 [VALIDATION SUMMARY] Valid fields:', validationLog.filter(log => log.isValid).length);
  console.log('📊 [VALIDATION SUMMARY] Invalid fields:', validationLog.filter(log => !log.isValid).length);
  console.log('📊 [VALIDATION SUMMARY] Total errors:', errors.length);

  if (errors.length > 0) {
    console.log('❌ [VALIDATION SUMMARY] Validation failed with errors:', errors);
  } else {
    console.log('✅ [VALIDATION SUMMARY] All validation checks passed successfully!');
  }

  return errors;
};

/**
 * Helper function to create sanitized response data with defaults
 */
const createSafeResponse = (profile) => {
  if (!profile) return null;

  // Convert to plain object if it's a Mongoose document
  const response = profile.toObject ? profile.toObject() : { ...profile };

  console.log('Creating safe response from profile:', {
    _id: response._id,
    firstName: response.firstName || '',
    lastName: response.lastName || '',
    email: response.email || ''
  });

  // Add defaults for all fields that might be missing
  const defaults = {
    firstName: '',
    middleName: '',
    lastName: '',
    position: '',
    employeeId: '',
    email: '',
    contact: '',
    gender: '',
    civilStatus: '',
    dob: '',
    address: '',
    profileImageUrl: null,
    emergencyContact: {
      name: '',
      number: ''
    }
  };

  // Apply defaults for any missing properties
  const result = { ...defaults, ...response };

  // Ensure emergencyContact is properly structured
  if (!result.emergencyContact) {
    result.emergencyContact = defaults.emergencyContact;
  } else if (typeof result.emergencyContact === 'object') {
    result.emergencyContact = {
      ...defaults.emergencyContact,
      ...result.emergencyContact
    };
  }

  // Ensure profileImageUrl is a real null not a string "null"
  if (result.profileImageUrl === "null") {
    result.profileImageUrl = null;
  }

  // Generate a full name if missing
  if (!result.name) {
    const nameParts = [result.firstName, result.middleName, result.lastName]
      .filter(part => part && part.trim());
    if (nameParts.length > 0) {
      result.name = nameParts.join(' ');
    }
  }

  // Add timestamps for cache busting
  if (result.profileImageUrl) {
    result.profileImageUrl = `${result.profileImageUrl}?t=${Date.now()}`;
  }

  return result;
};

/**
 * Get the User model from users_web database
 */
const getUserModel = async () => {
  // Define schema for User model
  const userSchema = new mongoose.Schema({
    email: String,
    password: String,
    passwordHash: String,
    roles: mongoose.Schema.Types.Mixed,
    updatedAt: Date
  }, { collection: 'users' });
  
  // Get a connection to the users_web database
  const userConnection = mongoose.connection.useDb('users_web');
  
  // Try to get existing model or create a new one
  try {
    return userConnection.model('User');
  } catch (e) {
    return userConnection.model('User', userSchema);
  }
};

/**
 * Get the profile collection from mobile_literexia database
 */
const getProfileCollection = async () => {
  // Connect to the teachers database
  const db = mongoose.connection.useDb('teachers');
  return db.collection('profile');
};

/**
 * Find the correct profile for the authenticated user
 * Handles the case where multiple profiles have the same email address
 */
const findCorrectProfile = async (req) => {
  try {
    const profileCollection = await getProfileCollection();
    const userAccountId = req.user.id;
    const userEmail = req.user.email;

    console.log('🔍 [PROFILE LOOKUP] Looking for profile for user:', {
      userAccountId,
      userEmail
    });

    // Search by email address (since that's what's used for login)
    const profilesWithEmail = await profileCollection.find({ email: userEmail }).toArray();

    console.log('🔍 [PROFILE LOOKUP] Found profiles with email:', profilesWithEmail.length);

    if (profilesWithEmail.length === 0) {
      console.log('❌ [PROFILE LOOKUP] No profiles found with email:', userEmail);
      return null;
    }

    if (profilesWithEmail.length === 1) {
      const profile = profilesWithEmail[0];
      console.log('✅ [PROFILE LOOKUP] Single profile found:', {
        profileId: profile._id.toString(),
        profileName: `${profile.firstName} ${profile.lastName}`,
        profileEmail: profile.email
      });
      return profile;
    }

    // Multiple profiles with same email - need resolution strategy
    console.log('⚠️ [PROFILE LOOKUP] Multiple profiles found with same email. Profiles:');
    profilesWithEmail.forEach((profile, index) => {
      console.log(`  ${index + 1}. ${profile.firstName} ${profile.lastName} (ID: ${profile._id.toString()}, Created: ${profile.createdAt})`);
    });

    // Resolution strategy: Use the most recently created profile
    // This assumes the newer profile is the correct/active one
    const sortedProfiles = profilesWithEmail.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    const selectedProfile = sortedProfiles[0];

    console.log('✅ [PROFILE LOOKUP] Selected most recent profile:', {
      profileId: selectedProfile._id.toString(),
      profileName: `${selectedProfile.firstName} ${selectedProfile.lastName}`,
      profileEmail: selectedProfile.email,
      createdAt: selectedProfile.createdAt
    });

    return selectedProfile;
  } catch (error) {
    console.error('❌ [PROFILE LOOKUP] Error during profile lookup:', error);
    return null;
  }
};

/**
 * Get the correct profile for the authenticated user
 */
const getOrCreateCorrectProfile = async (req) => {
  console.log('🔍 [PROFILE LOOKUP] Starting profile lookup for user:', {
    id: req.user.id,
    email: req.user.email
  });

  // Try to find the correct profile using the corrected logic
  const profile = await findCorrectProfile(req);

  if (profile) {
    console.log('✅ [PROFILE LOOKUP] Successfully found profile:', {
      profileId: profile._id.toString(),
      profileName: `${profile.firstName} ${profile.lastName}`,
      profileEmail: profile.email
    });
    return profile;
  }

  console.log('❌ [PROFILE LOOKUP] No profile found for user:', {
    id: req.user.id,
    email: req.user.email
  });
  return null;
};

/**
 * Get teacher profile
 */
exports.getProfile = async (req, res) => {
  try {
    console.log('Getting profile for user ID:', req.user.id);
    
    // Get or create the correct profile
    const profile = await getOrCreateCorrectProfile(req);
    
    // If no profile found, return 404
    if (!profile) {
      return res.status(404).json({ 
        error: 'No teacher profile found.',
        action: 'initialize'
      });
    }
    
    // Create safe response with proper defaults
    const response = createSafeResponse(profile);
    
    // Add timestamp for cache busting on image
    if (response.profileImageUrl) {
      response.profileImageUrl = `${response.profileImageUrl}?t=${Date.now()}`;
    }
    
    // Log profile data being returned for debugging
    console.log('Profile being returned:', JSON.stringify({
      _id: response._id,
      name: response.name,
      email: response.email,
      profileImageUrl: response.profileImageUrl ? 'has image' : 'no image'
    }));
    
    res.json(response);
  } catch (err) {
    console.error('Error fetching profile:', err);
    res.status(500).json({ error: 'Server error', details: err.message });
  }
};

/**
 * Initialize teacher profile
 */
exports.initializeProfile = async (req, res) => {
  try {
    console.log('Initializing profile for user:', req.user.email);
    
    // First check if we already have the correct profile
    const profile = await getOrCreateCorrectProfile(req);
    
    // If profile exists, return it
    if (profile) {
      console.log('Found existing profile for:', profile.name || profile.email);
      
      return res.json({
        message: 'Profile already exists',
        teacher: createSafeResponse(profile)
      });
    }
    
    // If no profile was created by getOrCreateCorrectProfile, something went wrong
    return res.status(500).json({ error: 'Failed to initialize profile' });
  } catch (err) {
    console.error('Error initializing profile:', err);
    res.status(500).json({ error: 'Failed to initialize profile', details: err.message });
  }
};

/**
 * Update teacher profile - FIXED for proper dual-collection synchronization
 */
exports.updateProfile = async (req, res) => {
  try {
    console.log('📝 [PROFILE UPDATE] Starting profile update for user:', req.user.id);
    console.log('📝 [PROFILE UPDATE] Request data:', req.body);

    // STEP 1: COMPREHENSIVE INPUT VALIDATION
    console.log('🔍 [PROFILE UPDATE] Validating input data...');
    const validationErrors = validateProfileInput(req.body);

    if (validationErrors.length > 0) {
      console.error('❌ [PROFILE UPDATE] Validation errors:', validationErrors);
      return res.status(400).json({
        error: 'Validation failed',
        details: validationErrors
      });
    }

    // STEP 2: SANITIZE ALL INPUT DATA
    console.log('🧹 [PROFILE UPDATE] Sanitizing input data...');
    const sanitizedData = {
      firstName: validateAndSanitizeInput.sanitizeName(req.body.firstName),
      middleName: validateAndSanitizeInput.sanitizeName(req.body.middleName),
      lastName: validateAndSanitizeInput.sanitizeName(req.body.lastName),
      email: validateAndSanitizeInput.sanitizeEmail(req.body.email),
      position: validateAndSanitizeInput.sanitizeText(req.body.position, 100),
      contact: validateAndSanitizeInput.sanitizePhoneNumber(req.body.contact),
      gender: req.body.gender && ['Male', 'Female', 'Other'].includes(req.body.gender) ? req.body.gender : '',
      civilStatus: req.body.civilStatus && ['Single', 'Married', 'Divorced', 'Widowed', 'Separated'].includes(req.body.civilStatus) ? req.body.civilStatus : '',
      dob: validateAndSanitizeInput.validateDate(req.body.dob),
      address: validateAndSanitizeInput.sanitizeText(req.body.address, 200),
      emergencyContact: validateAndSanitizeInput.sanitizeEmergencyContact(req.body.emergencyContact)
    };

    console.log('✅ [PROFILE UPDATE] Sanitized data:', {
      firstName: sanitizedData.firstName,
      lastName: sanitizedData.lastName,
      email: sanitizedData.email,
      contact: sanitizedData.contact,
      emergencyContact: sanitizedData.emergencyContact
    });

    // STEP 2.5: ADDITIONAL CHECK - If names are empty after sanitization, it means they were rejected
    const sanitizationErrors = [];
    if (req.body.firstName && sanitizedData.firstName === '') {
      sanitizationErrors.push(`First name "${req.body.firstName}" contains invalid characters (numbers/special chars) and was rejected.`);
    }
    if (req.body.lastName && sanitizedData.lastName === '') {
      sanitizationErrors.push(`Last name "${req.body.lastName}" contains invalid characters (numbers/special chars) and was rejected.`);
    }
    if (req.body.middleName && req.body.middleName.trim() && sanitizedData.middleName === '') {
      sanitizationErrors.push(`Middle name "${req.body.middleName}" contains invalid characters (numbers/special chars) and was rejected.`);
    }

    if (sanitizationErrors.length > 0) {
      console.error('🚨 [PROFILE UPDATE] Sanitization rejection errors:', sanitizationErrors);
      return res.status(400).json({
        error: 'Input rejected due to invalid characters',
        details: sanitizationErrors
      });
    }

    // STEP 3: Find the correct profile using fixed lookup
    console.log('🔍 [PROFILE UPDATE] Finding teacher profile...');
    const profile = await getOrCreateCorrectProfile(req);

    if (!profile) {
      console.error('❌ [PROFILE UPDATE] No teacher profile found');
      return res.status(404).json({
        error: 'No teacher profile found to update.',
        action: 'initialize'
      });
    }

    console.log('✅ [PROFILE UPDATE] Found profile:', {
      profileId: profile._id.toString(),
      currentEmail: profile.email,
      newEmail: sanitizedData.email
    });

    // Check if email is being changed
    const isEmailChanged = sanitizedData.email !== profile.email;
    console.log('📧 [PROFILE UPDATE] Email change detected:', isEmailChanged);

    // Generate full name from sanitized parts
    const fullName = [
      sanitizedData.firstName,
      sanitizedData.middleName,
      sanitizedData.lastName
    ].filter(part => part && part.trim()).join(' ');

    // STEP 4: Update teachers.profile collection with sanitized data
    console.log('💾 [PROFILE UPDATE] Updating teachers.profile with sanitized data...');

    const profileUpdateData = {
      firstName: sanitizedData.firstName,
      middleName: sanitizedData.middleName,
      lastName: sanitizedData.lastName,
      name: fullName,
      position: sanitizedData.position,
      email: sanitizedData.email,
      contact: sanitizedData.contact,
      gender: sanitizedData.gender,
      civilStatus: sanitizedData.civilStatus,
      dob: sanitizedData.dob,
      address: sanitizedData.address,
      emergencyContact: sanitizedData.emergencyContact,
      updatedAt: new Date()
    };

    // Ensure userId is preserved/set correctly
    const userId = toObjectId(req.user.id);
    if (userId) {
      profileUpdateData.userId = userId;
    }

    // Update teachers.profile
    const profileCollection = await getProfileCollection();
    const profileUpdateResult = await profileCollection.updateOne(
      { _id: profile._id },
      { $set: profileUpdateData }
    );

    console.log('✅ [PROFILE UPDATE] teachers.profile update result:', {
      acknowledged: profileUpdateResult.acknowledged,
      modifiedCount: profileUpdateResult.modifiedCount,
      matchedCount: profileUpdateResult.matchedCount
    });

    // STEP 5: CRITICAL FIX - Always update users_web.users for email sync
    console.log('💾 [PROFILE UPDATE] Updating users_web.users...');

    try {
      const usersDb = mongoose.connection.useDb('users_web');
      const usersCollection = usersDb.collection('users');

      if (!userId) {
        throw new Error('No valid user ID for users_web update');
      }

      const userUpdateData = {
        email: sanitizedData.email,
        updatedAt: new Date()
      };

      console.log('📧 [PROFILE UPDATE] Updating email in users_web.users:', {
        userId: userId.toString(),
        oldEmail: req.user.email,
        newEmail: sanitizedData.email
      });

      const userUpdateResult = await usersCollection.updateOne(
        { _id: userId },
        { $set: userUpdateData }
      );

      console.log('✅ [PROFILE UPDATE] users_web.users update result:', {
        acknowledged: userUpdateResult.acknowledged,
        modifiedCount: userUpdateResult.modifiedCount,
        matchedCount: userUpdateResult.matchedCount
      });

      if (userUpdateResult.matchedCount === 0) {
        console.error('❌ [PROFILE UPDATE] No user found in users_web.users with ID:', userId.toString());
      }

    } catch (userUpdateError) {
      console.error('❌ [PROFILE UPDATE] Failed to update users_web.users:', userUpdateError.message);
      // Don't fail the entire request - profile was updated successfully
      console.warn('⚠️ [PROFILE UPDATE] Continuing despite users_web sync failure');
    }

    // STEP 6: Get the updated profile with current data
    const updatedProfile = await profileCollection.findOne({ _id: profile._id });

    console.log('🎉 [PROFILE UPDATE] Profile update completed successfully');
    console.log('🔍 [EMERGENCY CONTACT] Final emergency contact data:', updatedProfile.emergencyContact);

    res.json({
      success: true,
      message: 'Profile updated successfully with comprehensive validation and sanitization!',
      teacher: createSafeResponse(updatedProfile),
      changes: {
        emailChanged: isEmailChanged,
        profileUpdated: profileUpdateResult.modifiedCount > 0,
        emergencyContactUpdated: !!(sanitizedData.emergencyContact.name || sanitizedData.emergencyContact.number),
        timestamp: new Date().toISOString()
      },
      validation: {
        sanitizedData: {
          firstName: sanitizedData.firstName,
          lastName: sanitizedData.lastName,
          contact: sanitizedData.contact,
          emergencyContact: sanitizedData.emergencyContact
        }
      }
    });

  } catch (err) {
    console.error('❌ [PROFILE UPDATE] Error updating profile:', err);
    res.status(500).json({
      error: 'Profile update failed',
      details: err.message
    });
  }
};

/**
 * Update teacher password - FIXED for proper users_web synchronization
 */
exports.updatePassword = async (req, res) => {
  const { currentPassword, newPassword } = req.body;

  console.log('🔐 [PASSWORD UPDATE] Starting password update for user:', req.user.id);

  if (!currentPassword || !newPassword) {
    return res.status(400).json({ error: 'Current password and new password are required' });
  }

  // Validate password complexity
  const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*])[A-Za-z\d!@#$%^&*]{8,}$/;
  if (!passwordRegex.test(newPassword)) {
    return res.status(400).json({ error: 'Password does not meet complexity requirements.' });
  }

  try {
    // CRITICAL FIX: Connect to users_web.users collection directly
    const usersDb = mongoose.connection.useDb('users_web');
    const usersCollection = usersDb.collection('users');

    console.log('🔍 [PASSWORD UPDATE] Looking up user in users_web.users...');

    // Find user by ID (most reliable)
    const userId = toObjectId(req.user.id);
    if (!userId) {
      console.error('❌ [PASSWORD UPDATE] Invalid user ID:', req.user.id);
      return res.status(400).json({ error: 'Invalid user ID format.' });
    }

    const user = await usersCollection.findOne({ _id: userId });
    if (!user) {
      console.error('❌ [PASSWORD UPDATE] User not found in users_web.users with ID:', userId.toString());
      return res.status(404).json({ error: 'User account not found.' });
    }

    console.log('✅ [PASSWORD UPDATE] Found user in users_web.users:', {
      id: user._id.toString(),
      email: user.email,
      hasPasswordHash: !!user.passwordHash
    });

    // CRITICAL: Always use passwordHash field (standardized)
    if (!user.passwordHash) {
      console.error('❌ [PASSWORD UPDATE] No passwordHash field found in user record');
      return res.status(500).json({ error: 'Password field not found in user record.' });
    }

    // Verify current password
    console.log('🔐 [PASSWORD UPDATE] Verifying current password...');

    let passwordIsValid = false;
    if (user.passwordHash.startsWith('$2a$') || user.passwordHash.startsWith('$2b$')) {
      try {
        passwordIsValid = await bcrypt.compare(currentPassword, user.passwordHash);
        console.log('✅ [PASSWORD UPDATE] Password verification result:', passwordIsValid);
      } catch (bcryptError) {
        console.error('❌ [PASSWORD UPDATE] Bcrypt verification error:', bcryptError);
        return res.status(500).json({ error: 'Password verification failed.' });
      }
    } else {
      console.error('❌ [PASSWORD UPDATE] Invalid password hash format');
      return res.status(500).json({ error: 'Invalid password hash format.' });
    }

    if (!passwordIsValid) {
      console.log('❌ [PASSWORD UPDATE] Incorrect current password provided');
      return res.status(400).json({ error: 'INCORRECT_PASSWORD' });
    }

    // Hash new password
    console.log('🔐 [PASSWORD UPDATE] Generating new password hash...');
    const newPasswordHash = await bcrypt.hash(newPassword, 10);

    // CRITICAL FIX: Update passwordHash in users_web.users
    const updateData = {
      passwordHash: newPasswordHash,  // Always use passwordHash field
      updatedAt: new Date()
    };

    console.log('💾 [PASSWORD UPDATE] Updating passwordHash in users_web.users...');
    const updateResult = await usersCollection.updateOne(
      { _id: userId },
      { $set: updateData }
    );

    console.log('✅ [PASSWORD UPDATE] Update result:', {
      acknowledged: updateResult.acknowledged,
      modifiedCount: updateResult.modifiedCount,
      matchedCount: updateResult.matchedCount
    });

    if (updateResult.modifiedCount === 0) {
      console.warn('⚠️ [PASSWORD UPDATE] No documents modified - password may be the same');
      return res.status(400).json({ error: 'Password update failed - no changes made.' });
    }

    // Verify the update worked
    const updatedUser = await usersCollection.findOne({ _id: userId });
    console.log('🔍 [PASSWORD UPDATE] Verification - password hash changed:',
      updatedUser.passwordHash !== user.passwordHash);

    console.log('🎉 [PASSWORD UPDATE] Password updated successfully for user:', userId.toString());
    return res.json({
      success: true,
      message: 'Password updated successfully.',
      timestamp: new Date().toISOString()
    });

  } catch (err) {
    console.error('❌ [PASSWORD UPDATE] Error updating password:', err);
    return res.status(500).json({
      error: 'Password update failed.',
      details: err.message
    });
  }
};

/**
 * Upload profile image
 */
exports.uploadProfileImage = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    console.log('Processing image upload: file size =', req.file.size, 'bytes');
    console.log('MIME type =', req.file.mimetype);

    // Find the correct profile
    const profile = await getOrCreateCorrectProfile(req);

    if (!profile) {
      console.error('No teacher profile found in the database');
      return res.status(404).json({ error: 'Teacher profile not found. Please create a profile first.' });
    }

    try {
      // Configuration values
      const bucketName = process.env.AWS_S3_BUCKET || 'literexia-bucket';
      const region = process.env.AWS_REGION || 'ap-southeast-2';

      // Delete existing S3 image if present
      if (profile.profileImageUrl && 
          profile.profileImageUrl !== "null" && 
          profile.profileImageUrl.includes('amazonaws.com')) {
        try {
          // Extract key from URL by parsing carefully
          let key = '';
          
          // Clean the URL to handle any query parameters
          const urlString = profile.profileImageUrl.split('?')[0];
          
          // Parse the path part only
          if (urlString.includes('/teacher-profiles/')) {
            const pathParts = urlString.split('/teacher-profiles/');
            if (pathParts.length > 1) {
              key = 'teacher-profiles/' + pathParts[1];
              console.log('Extracted S3 key:', key);
            }
          } else {
            console.log('Could not parse path from URL:', urlString);
          }
          
          if (key) {
            console.log('Deleting previous S3 image with key:', key);

            const deleteCommand = new DeleteObjectCommand({
              Bucket: bucketName,
              Key: key
            });

            await s3Client.send(deleteCommand);
            console.log('Successfully deleted previous S3 image');
          }
        } catch (deleteError) {
          console.error('Failed to delete previous S3 image:', deleteError.message);
          // Continue with upload even if deletion fails
        }
      }

      // Create organized folder structure
      const currentYear = new Date().getFullYear();
      const currentMonth = String(date.getMonth() + 1).padStart(2, '0');

      // Create a safe filename - avoiding spaces and special characters
      const timestamp = Date.now();
      const teacherId = profile._id.toString().replace(/[^a-zA-Z0-9]/g, '');
      
      // Get filename parts
      const originalFilename = req.file.originalname;
      const extension = path.extname(originalFilename);
      
      // Replace spaces and special characters
      const filenameBase = path.basename(originalFilename, extension)
        .replace(/[^a-zA-Z0-9]/g, '-')
        .toLowerCase();
      
      // Create a safe key
      const filename = `${timestamp}-${filenameBase}-${teacherId}${extension}`;
      const key = `teacher-profiles/${currentYear}/${currentMonth}/${filename}`;

      console.log('S3 upload starting:');
      console.log('- Bucket:', bucketName);
      console.log('- Key:', key);
      console.log('- File size:', req.file.size, 'bytes');

      // Set upload parameters
      const params = {
        Bucket: bucketName,
        Key: key,
        Body: req.file.buffer,
        ContentType: req.file.mimetype,
        CacheControl: 'no-cache',
        ACL: 'public-read' // Make sure file is publicly accessible
      };
      
      // Upload to S3
      await s3Client.send(new PutObjectCommand(params));
      
      // Construct the complete URL
      const imageUrl = `https://${bucketName}.s3.${region}.amazonaws.com/${key}`;
      console.log('Image uploaded to:', imageUrl);

      // Get the profile collection
      const profileCollection = await getProfileCollection();
      
      // Update MongoDB document
      const updateResult = await profileCollection.updateOne(
        { _id: profile._id },
        { 
          $set: { 
            profileImageUrl: imageUrl,
            updatedAt: new Date()
          } 
        }
      );
      
      console.log('Profile update result:', updateResult);

      // Get the updated profile to confirm change
      const updatedProfile = await profileCollection.findOne({ _id: profile._id });
      console.log('Teacher profile updated with new image URL:', updatedProfile.profileImageUrl);

      // Add timestamp for cache busting in response
      const imageUrlWithTimestamp = `${imageUrl}?t=${Date.now()}`;

      return res.json({
        success: true,
        message: 'Profile image uploaded successfully',
        imageUrl: imageUrlWithTimestamp
      });
    } catch (s3Error) {
      console.error('S3 upload failed:', s3Error.message);
      throw new Error(`Image upload failed: ${s3Error.message}`);
    }
  } catch (err) {
    console.error('Image upload failed:', err.message);
    console.error(err.stack);
    res.status(500).json({
      error: 'Failed to upload image',
      details: err.message
    });
  }
};


/**
 * Delete profile image
 */
exports.deleteProfileImage = async (req, res) => {
  try {
    // Find the correct profile
    const profile = await getOrCreateCorrectProfile(req);

    if (!profile) {
      return res.status(404).json({ error: 'No teacher profile found.' });
    }

    // Check if S3 image URL exists
    if (profile.profileImageUrl &&
        profile.profileImageUrl !== "null" &&
        profile.profileImageUrl.includes('amazonaws.com')) {
      try {
        // Check for bucket name in environment
        const bucketName = process.env.AWS_BUCKET_NAME || 'literexia-bucket';

        // Extract key from URL by parsing it properly
        let key = '';
        try {
          const url = new URL(profile.profileImageUrl.startsWith('http') ? 
                            profile.profileImageUrl : 
                            `https://${profile.profileImageUrl}`);
          
          // Remove query parameters (like timestamps) from the path
          const cleanPath = url.pathname.split('?')[0]; 
          const pathParts = cleanPath.split('/');
          key = pathParts.slice(1).join('/');
        } catch (urlError) {
          console.error('Error parsing image URL:', urlError);
          // Fallback method - crude string manipulation
          const urlParts = profile.profileImageUrl.split('/');
          key = urlParts.slice(3).join('/');
        }

        console.log('Deleting S3 image with key:', key);

        const deleteCommand = new DeleteObjectCommand({
          Bucket: bucketName,
          Key: key
        });

        await s3Client.send(deleteCommand);
        console.log('Successfully deleted S3 image');
      } catch (deleteError) {
        console.error('Failed to delete S3 image:', deleteError.message);
        // Continue with database update even if S3 deletion fails
      }
    }

    // Get the profile collection
    const profileCollection = await getProfileCollection();
    
    // Update MongoDB document
    await profileCollection.updateOne(
      { _id: profile._id },
      { 
        $set: { 
          profileImageUrl: null,
          updatedAt: new Date()
        } 
      }
    );

    console.log('Profile image record deleted for teacher:', profile.name || 'unknown');

    return res.json({
      success: true,
      message: 'Profile image deleted successfully'
    });
  } catch (err) {
    console.error('Error deleting profile image:', err.message);
    res.status(500).json({
      error: 'Failed to delete image',
      details: err.message
    });
  }
};

/**
 * Get current profile image
 */
exports.getCurrentProfileImage = async (req, res) => {
  try {
    console.log(`Attempting to fetch current teacher profile image for user:`, req.user.id);

    // Find the correct profile
    const profile = await getOrCreateCorrectProfile(req);

    if (!profile) {
      console.log('No teacher profile found');
      return res.status(404).json({ error: 'No teacher profile found.' });
    }

    console.log('Found teacher profile:', profile._id);
    console.log('Profile image URL:', profile.profileImageUrl);

    // Check if we have an S3 URL - if yes, return it
    if (profile.profileImageUrl && profile.profileImageUrl !== "null") {
      // Clean up the URL in case it got stored in an abbreviated format
      let cleanUrl = profile.profileImageUrl;
      
      // Ensure the URL is properly formed
      if (cleanUrl.includes('s3.') && !cleanUrl.startsWith('http')) {
        cleanUrl = 'https://' + cleanUrl;
      }
      
      // Add timestamp for cache busting
      const timestamp = Date.now();
      const cacheBustedUrl = `${cleanUrl}${cleanUrl.includes('?') ? '&' : '?'}t=${timestamp}`;
      
      console.log(`Teacher has S3 URL with cache busting: ${cacheBustedUrl}`);
      
      return res.json({ 
        imageUrl: cacheBustedUrl,
        timestamp: timestamp
      });
    }

    return res.json({ imageUrl: null });
  } catch (err) {
    console.error(`Error fetching profile image:`, err);
    res.status(500).json({ error: 'Server error', details: err.message });
  }
};

/**
 * Create a new teacher (profile + user) - FIXED to prevent duplicate assignments
 */
exports.createTeacher = async (req, res) => {
  try {
    console.log('👤 [TEACHER CREATION] Starting teacher creation process...');

    // 1. Extract teacher details from request body
    const {
      firstName, lastName, middleName, position, contact, address,
      civilStatus, dob, emergencyContact, gender, email
    } = req.body;

    console.log('📝 [TEACHER CREATION] Creating teacher:', {
      name: `${firstName} ${lastName}`,
      email: email
    });

    // Validate required fields
    if (!firstName || !lastName || !email) {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields: firstName, lastName, email'
      });
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid email format'
      });
    }

    // Handle profile image upload if file is present
    let profileImageUrl = '';
    if (req.file) {
      console.log('📸 [TEACHER CREATION] Processing profile image upload...');
      profileImageUrl = await uploadToS3(req.file, 'teacher-profiles');
      console.log('✅ [TEACHER CREATION] Profile image uploaded:', profileImageUrl);
    }

    // STEP 1: Check for duplicate email in BOTH collections
    console.log('🔍 [TEACHER CREATION] Checking for duplicate emails...');

    // Check teachers.profile
    const profileCollection = await getProfileCollection();
    const existingProfile = await profileCollection.findOne({ email });
    if (existingProfile) {
      console.error('❌ [TEACHER CREATION] Email exists in teachers.profile:', email);
      return res.status(400).json({
        success: false,
        message: 'This email is already registered in teacher profiles.'
      });
    }

    // Check users_web.users
    const usersDb = mongoose.connection.useDb('users_web');
    const usersCollection = usersDb.collection('users');
    const existingUser = await usersCollection.findOne({ email });
    if (existingUser) {
      console.error('❌ [TEACHER CREATION] Email exists in users_web.users:', email);
      return res.status(400).json({
        success: false,
        message: 'This email is already registered in user accounts.'
      });
    }

    console.log('✅ [TEACHER CREATION] Email is unique across all collections');

    // STEP 2: Generate secure credentials
    console.log('🔐 [TEACHER CREATION] Generating secure credentials...');

    const generatePassword = (length = 8) => {
      const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
      let password = '';
      for (let i = 0; i < length; i++) {
        password += chars.charAt(Math.floor(Math.random() * chars.length));
      }
      return password;
    };
    const password = generatePassword(8);
    const passwordHash = await bcrypt.hash(password, 10);

    console.log('✅ [TEACHER CREATION] Password generated and hashed');

    // STEP 3: Create user in users_web.users
    console.log('💾 [TEACHER CREATION] Creating user account in users_web.users...');

    // CRITICAL FIX: Create user document directly via collection to avoid Mongoose model issues
    const newUser = {
      email: email,
      passwordHash: passwordHash,
      roles: new mongoose.Types.ObjectId('681b690af9fd9071c6ac2f3a'), // Teacher role
      updatedAt: new Date(),
      createdAt: new Date()
    };

    const userInsertResult = await usersCollection.insertOne(newUser);
    const createdUserId = userInsertResult.insertedId;

    console.log('✅ [TEACHER CREATION] User created in users_web.users:', {
      userId: createdUserId.toString(),
      email: email
    });

    // STEP 4: Create teacher profile in teachers.profile with proper linking
    console.log('💾 [TEACHER CREATION] Creating teacher profile in teachers.profile...');

    const now = new Date();
    const fullName = [firstName, middleName, lastName].filter(part => part && part.trim()).join(' ');

    const profileDoc = {
      userId: createdUserId,          // CRITICAL: Link to the newly created user
      firstName,
      lastName,
      middleName: middleName || '',
      name: fullName,                 // Generate full name
      position,
      contact,
      profileImageUrl: profileImageUrl || '',
      address,
      civilStatus,
      dob,
      gender,
      email,
      emergencyContact: emergencyContact || { name: '', number: '' },
      createdAt: now,
      updatedAt: now
    };

    console.log('📝 [TEACHER CREATION] Inserting teacher profile:', {
      name: fullName,
      email: email,
      userId: createdUserId.toString()
    });

    const profileInsertResult = await profileCollection.insertOne(profileDoc);

    console.log('✅ [TEACHER CREATION] Teacher profile created:', {
      profileId: profileInsertResult.insertedId.toString(),
      userId: createdUserId.toString()
    });

    // STEP 5: Verify the complete creation
    console.log('🔍 [TEACHER CREATION] Verifying complete teacher creation...');

    const verifyUser = await usersCollection.findOne({ _id: createdUserId });
    const verifyProfile = await profileCollection.findOne({ _id: profileInsertResult.insertedId });

    console.log('✅ [TEACHER CREATION] Verification successful:', {
      userExists: !!verifyUser,
      profileExists: !!verifyProfile,
      userIdMatch: verifyProfile?.userId?.toString() === createdUserId.toString()
    });

    console.log('🎉 [TEACHER CREATION] Teacher created successfully');

    // 6. Respond with credentials for admin to display
    res.json({
      success: true,
      message: 'Teacher created successfully',
      data: {
        teacherProfile: {
          ...profileDoc,
          _id: profileInsertResult.insertedId
        },
        userAccount: {
          _id: createdUserId,
          email: email
        },
        credentials: { email, password },
        verification: {
          userIdLinked: true,
          emailUnique: true,
          timestamp: new Date().toISOString()
        }
      }
    });

  } catch (err) {
    console.error('❌ [TEACHER CREATION] Error creating teacher:', err);
    res.status(500).json({
      success: false,
      message: 'Teacher creation failed',
      error: err.message
    });
  }
};

exports.updateTeacher = async (req, res) => {
  try {
    const teacherId = req.params.id;
    const {
      firstName, lastName, middleName, position, contact, address,
      civilStatus, dob, gender, email
    } = req.body;

    // Update teacher profile in teachers.profile
    const profileCollection = await getProfileCollection();
    const updateData = {
      firstName,
      lastName,
      middleName: middleName || '',
      position,
      contact,
      address,
      civilStatus,
      dob,
      gender,
      email,
      updatedAt: new Date()
    };

    // Handle profile image upload if file is present
    if (req.file) {
      const profileImageUrl = await uploadToS3(req.file, 'teacher-profiles');
      updateData.profileImageUrl = profileImageUrl;
    }

    // Always fetch the updated document
    await profileCollection.updateOne(
      { _id: new mongoose.Types.ObjectId(teacherId) },
      { $set: updateData }
    );
    const updatedProfile = await profileCollection.findOne({ _id: new mongoose.Types.ObjectId(teacherId) });
    if (!updatedProfile) {
      return res.status(404).json({ success: false, message: 'Teacher not found' });
    }
    // Also update user in users_web.users if email is changed
    if (email && updatedProfile.userId) {
      const User = await getUserModel();
      await User.updateOne(
        { _id: updatedProfile.userId },
        { $set: { email, updatedAt: new Date() } }
      );
    }
    res.json({
      success: true,
      message: 'Teacher updated successfully',
      data: { teacherProfile: updatedProfile }
    });
  } catch (err) {
    console.error('Error updating teacher:', err);
    res.status(500).json({ success: false, message: 'Server error', error: err.message });
  }
};

exports.deleteTeacher = async (req, res) => {
  try {
    const teacherId = req.params.id;
    console.log('Delete request for teacherId:', teacherId);
    const profileCollection = await getProfileCollection();
    // Log all documents before delete
    const allBefore = await profileCollection.find({}).toArray();
    console.log('All profiles before delete:', allBefore.map(doc => doc._id.toString()));
    // Find the profile to get userId
    const profile = await profileCollection.findOne({ _id: new mongoose.Types.ObjectId(teacherId) });
    console.log('Profile found for delete:', profile);
    if (!profile) {
      return res.status(404).json({ success: false, message: 'Teacher not found' });
    }
    // Delete the profile
    const deleteResult = await profileCollection.deleteOne({ _id: new mongoose.Types.ObjectId(teacherId) });
    console.log('Profile delete result:', deleteResult);
    // Log all documents after delete
    const allAfter = await profileCollection.find({}).toArray();
    console.log('All profiles after delete:', allAfter.map(doc => doc._id.toString()));
    if (deleteResult.deletedCount === 0) {
      return res.status(500).json({ success: false, message: 'Failed to delete teacher profile' });
    }
    // Delete the user in users_web.users
    if (profile.userId) {
      const User = await getUserModel();
      await User.deleteOne({ _id: profile.userId });
    }
    res.json({ success: true, message: 'Teacher deleted successfully' });
  } catch (err) {
    console.error('Error deleting teacher:', err);
    res.status(500).json({ success: false, message: 'Server error', error: err.message });
  }
};