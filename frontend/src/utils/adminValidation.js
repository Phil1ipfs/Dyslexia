// Frontend validation utility for admin user management
// Comprehensive validation with real-time feedback

/**
 * Advanced validation rules for admin user management
 * Prevents submission until all validation passes
 */
const adminValidation = {
  // Name validation (no numbers, proper format)
  validateName: (name, fieldName = 'Name', isMiddleName = false) => {
    const errors = [];

    // Handle middle name as optional
    if (isMiddleName) {
      // If middle name is empty or null, that's valid (optional field)
      if (!name || typeof name !== 'string') {
        return { isValid: true, errors: [] };
      }

      const trimmed = name.trim();

      // Empty middle name is valid (optional)
      if (!trimmed) {
        return { isValid: true, errors: [] };
      }

      // CRITICAL: Reject names with numbers completely
      if (/\d/.test(trimmed)) {
        return {
          isValid: false,
          errors: [`${fieldName} cannot contain numbers (e.g., "John123" is not allowed)`]
        };
      }

      // Allow single letter with optional period (T, T.)
      if (trimmed.length <= 2 && /^[a-zA-Z]\.?$/.test(trimmed)) {
        return { isValid: true, errors: [] };
      }

      // For longer middle names, apply normal name rules
      if (trimmed.length < 2) {
        errors.push(`${fieldName} must be at least 2 characters long`);
      }

      if (trimmed.length > 50) {
        errors.push(`${fieldName} must be less than 50 characters`);
      }

      // Allow only letters, spaces, hyphens, and apostrophes
      if (!/^[a-zA-Z\s'-\.]+$/.test(trimmed)) {
        errors.push(`${fieldName} can only contain letters, spaces, hyphens, apostrophes, and periods`);
      }

      return { isValid: errors.length === 0, errors };
    }

    // Required field validation (for first name, last name, etc.)
    if (!name || typeof name !== 'string') {
      return { isValid: false, errors: [`${fieldName} is required`] };
    }

    const trimmed = name.trim();

    // Empty check after trim
    if (!trimmed) {
      return { isValid: false, errors: [`${fieldName} cannot be empty`] };
    }

    // CRITICAL: Reject names with numbers completely
    if (/\d/.test(trimmed)) {
      return {
        isValid: false,
        errors: [`${fieldName} cannot contain numbers (e.g., "John123" is not allowed)`]
      };
    }

    // Check for minimum length
    if (trimmed.length < 2) {
      errors.push(`${fieldName} must be at least 2 characters long`);
    }

    // Check for maximum length
    if (trimmed.length > 50) {
      errors.push(`${fieldName} must be less than 50 characters`);
    }

    // Allow only letters, spaces, hyphens, and apostrophes
    const allowedPattern = isMiddleName ? /^[a-zA-Z\s\-'.]+$/ : /^[a-zA-Z\s\-']+$/;
    if (!allowedPattern.test(trimmed)) {
      const allowedChars = isMiddleName
        ? "letters, spaces, hyphens, apostrophes, and periods"
        : "letters, spaces, hyphens, and apostrophes";
      errors.push(`${fieldName} can only contain ${allowedChars}`);
    }

    // Check for suspicious patterns
    if (/(.)\1{3,}/.test(trimmed)) {
      errors.push(`${fieldName} cannot have more than 3 consecutive identical characters`);
    }

    // Check for multiple consecutive spaces
    if (/\s{2,}/.test(trimmed)) {
      errors.push(`${fieldName} cannot have multiple consecutive spaces`);
    }

    // Check for keyboard patterns
    const suspiciousPatterns = [/qwerty/i, /asdf/i, /zxcv/i, /abc/i];
    if (suspiciousPatterns.some(pattern => pattern.test(trimmed))) {
      errors.push(`${fieldName} appears to contain keyboard patterns - please enter a real name`);
    }

    return { isValid: errors.length === 0, errors };
  },

  // Contact number validation (Philippine format)
  validateContactNumber: (contact, fieldName = 'Contact Number') => {
    const errors = [];

    if (!contact || typeof contact !== 'string') {
      return { isValid: false, errors: [`${fieldName} is required`] };
    }

    const trimmed = contact.trim();

    if (!trimmed) {
      return { isValid: false, errors: [`${fieldName} cannot be empty`] };
    }

    // Remove all non-digits for validation
    const digitsOnly = trimmed.replace(/\D/g, '');

    // Check if only contains valid characters (digits, spaces, hyphens, parentheses, plus)
    if (!/^[\d\s\-\(\)\+]+$/.test(trimmed)) {
      errors.push(`${fieldName} can only contain numbers, spaces, hyphens, parentheses, and plus sign`);
    }

    // Philippine phone number validation
    let isValidFormat = false;
    let formatMessage = '';

    if (digitsOnly.length === 11 && digitsOnly.startsWith('09')) {
      isValidFormat = true; // Mobile: 09xxxxxxxxx
      formatMessage = 'Valid mobile number format';
    } else if (digitsOnly.length === 13 && digitsOnly.startsWith('639')) {
      isValidFormat = true; // International: +639xxxxxxxxx
      formatMessage = 'Valid international mobile format';
    } else if (digitsOnly.length >= 7 && digitsOnly.length <= 11) {
      isValidFormat = true; // Landline variations
      formatMessage = 'Valid landline format';
    }

    if (!isValidFormat) {
      errors.push(`${fieldName} must be a valid Philippine number format:`);
      errors.push('• Mobile: 09XXXXXXXXX (11 digits)');
      errors.push('• International: +639XXXXXXXXX');
      errors.push('• Landline: 02XXXXXXXX or area code variations');
    }

    return {
      isValid: errors.length === 0,
      errors,
      suggestion: isValidFormat ? formatMessage : null
    };
  },

  // Email validation (proper Gmail/email format)
  validateEmail: (email, fieldName = 'Email') => {
    const errors = [];

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
      errors.push(`${fieldName} must be a valid email format (e.g., user@gmail.com)`);
    }

    // Check email length
    if (trimmed.length > 100) {
      errors.push(`${fieldName} must be less than 100 characters`);
    }

    // Check for valid email providers (optional but recommended)
    const commonProviders = ['gmail.com', 'yahoo.com', 'outlook.com', 'hotmail.com', 'protonmail.com'];
    const domain = trimmed.split('@')[1];

    if (domain && !commonProviders.includes(domain)) {
      // Don't block, just warn
      return {
        isValid: true,
        errors: [],
        warning: `Email domain '${domain}' is not a common provider. Please double-check the email address.`
      };
    }

    return { isValid: errors.length === 0, errors };
  },

  // Date validation (birthdate for different user types)
  validateBirthdate: (date, userType = 'user', fieldName = 'Date of Birth') => {
    const errors = [];

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
      errors.push(`${fieldName} must be in YYYY-MM-DD format`);
      return { isValid: false, errors };
    }

    // Parse and validate date
    const parsedDate = new Date(trimmed);
    if (isNaN(parsedDate.getTime())) {
      errors.push(`${fieldName} is not a valid date`);
      return { isValid: false, errors };
    }

    const now = new Date();

    // Check if date is in the future
    if (parsedDate > now) {
      errors.push(`${fieldName} cannot be in the future`);
    }

    // Age validation based on user type
    const userAge = Math.floor((now - parsedDate) / (365.25 * 24 * 60 * 60 * 1000));

    switch (userType.toLowerCase()) {
      case 'teacher':
        if (userAge < 18) {
          errors.push('Teachers must be at least 18 years old');
        }
        if (userAge > 80) {
          errors.push('Please verify the birth date - age seems unusually high');
        }
        break;

      case 'parent':
        if (userAge < 16) {
          errors.push('Parents must be at least 16 years old');
        }
        if (userAge > 100) {
          errors.push('Please verify the birth date - age seems unusually high');
        }
        break;

      case 'student':
        if (userAge < 3) {
          errors.push('Students must be at least 3 years old');
        }
        if (userAge > 25) {
          errors.push('Please verify the birth date - age seems high for a student');
        }
        break;

      default:
        if (userAge > 120) {
          errors.push('Please verify the birth date - age seems unusually high');
        }
    }

    return {
      isValid: errors.length === 0,
      errors,
      calculatedAge: userAge
    };
  },

  // ID Number validation (for students)
  validateIdNumber: (idNumber, fieldName = 'ID Number') => {
    const errors = [];

    if (!idNumber) {
      return { isValid: false, errors: [`${fieldName} is required`] };
    }

    const idStr = idNumber.toString().trim();

    if (!idStr) {
      return { isValid: false, errors: [`${fieldName} cannot be empty`] };
    }

    // Check if only contains numbers
    if (!/^\d+$/.test(idStr)) {
      errors.push(`${fieldName} can only contain numbers`);
    }

    // Check length (common ID number lengths)
    if (idStr.length < 6) {
      errors.push(`${fieldName} must be at least 6 digits`);
    }

    if (idStr.length > 15) {
      errors.push(`${fieldName} must be less than 15 digits`);
    }

    // Check for suspicious patterns (all same digits, sequential)
    if (/^(\d)\1+$/.test(idStr)) {
      errors.push(`${fieldName} cannot be all the same digit`);
    }

    return { isValid: errors.length === 0, errors };
  },

  // General text validation
  validateText: (text, fieldName, required = false, maxLength = 100) => {
    const errors = [];

    if (required && (!text || typeof text !== 'string')) {
      return { isValid: false, errors: [`${fieldName} is required`] };
    }

    if (!text) {
      return { isValid: true, errors: [] }; // Optional field
    }

    const trimmed = text.trim();

    if (required && !trimmed) {
      return { isValid: false, errors: [`${fieldName} cannot be empty`] };
    }

    if (trimmed.length > maxLength) {
      errors.push(`${fieldName} must be less than ${maxLength} characters`);
    }

    // Check for dangerous characters
    if (/[<>\"'&]/.test(trimmed)) {
      errors.push(`${fieldName} cannot contain special HTML characters (< > " ' &)`);
    }

    return { isValid: errors.length === 0, errors };
  },

  // Age validation for different user types
  validateAge: (age, userType = 'student', fieldName = 'Age') => {
    const errors = [];

    // Check if age is provided and is a number
    if (!age && age !== 0) {
      return { isValid: false, errors: [`${fieldName} is required`] };
    }

    const ageNum = Number(age);

    // Check if it's a valid number
    if (isNaN(ageNum) || !Number.isInteger(ageNum)) {
      return { isValid: false, errors: [`${fieldName} must be a valid whole number`] };
    }

    // Age range validation based on user type
    const ageRanges = {
      student: { min: 3, max: 25 },
      teacher: { min: 18, max: 80 },
      parent: { min: 16, max: 100 }
    };

    const range = ageRanges[userType] || ageRanges.student;

    if (ageNum < range.min || ageNum > range.max) {
      errors.push(`${fieldName} must be between ${range.min} and ${range.max} years for ${userType}s`);
    }

    return { isValid: errors.length === 0, errors };
  },

  // Grade level validation
  validateGradeLevel: (gradeLevel, fieldName = 'Grade Level') => {
    const errors = [];

    if (!gradeLevel || typeof gradeLevel !== 'string') {
      return { isValid: false, errors: [`${fieldName} is required`] };
    }

    const trimmed = gradeLevel.trim();

    if (!trimmed) {
      return { isValid: false, errors: [`${fieldName} cannot be empty`] };
    }

    // Valid grade levels
    const validGrades = [
      'Grade 1', 'Grade 2', 'Grade 3',
      'Grade 4', 'Grade 5', 'Grade 6'
    ];

    if (!validGrades.includes(trimmed)) {
      errors.push(`${fieldName} must be one of: ${validGrades.join(', ')}`);
    }

    return { isValid: errors.length === 0, errors };
  },

  // Comprehensive form validation
  validateUserForm: (formData, userType) => {
    const allErrors = {};
    let isFormValid = true;

    // Validate first name
    const firstNameResult = adminValidation.validateName(formData.firstName, 'First Name');
    if (!firstNameResult.isValid) {
      allErrors.firstName = firstNameResult.errors;
      isFormValid = false;
    }

    // Validate last name
    const lastNameResult = adminValidation.validateName(formData.lastName, 'Last Name');
    if (!lastNameResult.isValid) {
      allErrors.lastName = lastNameResult.errors;
      isFormValid = false;
    }

    // Validate middle name (optional but must be valid if provided)
    if (formData.middleName && formData.middleName.trim()) {
      const middleNameResult = adminValidation.validateName(formData.middleName, 'Middle Name', true);
      if (!middleNameResult.isValid) {
        allErrors.middleName = middleNameResult.errors;
        isFormValid = false;
      }
    }

    // Validate email
    const emailResult = adminValidation.validateEmail(formData.email);
    if (!emailResult.isValid) {
      allErrors.email = emailResult.errors;
      isFormValid = false;
    } else if (emailResult.warning) {
      allErrors.email = [emailResult.warning];
      // Don't set isFormValid to false for warnings
    }

    // Validate contact number
    if (formData.contact) {
      const contactResult = adminValidation.validateContactNumber(formData.contact);
      if (!contactResult.isValid) {
        allErrors.contact = contactResult.errors;
        isFormValid = false;
      }
    }

    // Validate birthdate
    if (formData.dateOfBirth) {
      const birthdateResult = adminValidation.validateBirthdate(formData.dateOfBirth, userType);
      if (!birthdateResult.isValid) {
        allErrors.dateOfBirth = birthdateResult.errors;
        isFormValid = false;
      }
    }

    // Validate ID number (for students)
    if (userType === 'student' && formData.idNumber) {
      const idResult = adminValidation.validateIdNumber(formData.idNumber);
      if (!idResult.isValid) {
        allErrors.idNumber = idResult.errors;
        isFormValid = false;
      }
    }

    // Validate address (optional)
    if (formData.address) {
      const addressResult = adminValidation.validateText(formData.address, 'Address', false, 200);
      if (!addressResult.isValid) {
        allErrors.address = addressResult.errors;
        isFormValid = false;
      }
    }

    return {
      isValid: isFormValid,
      errors: allErrors,
      hasWarnings: Object.values(allErrors).some(errors =>
        errors.some(error => error.includes('not a common provider'))
      )
    };
  }
};

export default adminValidation;