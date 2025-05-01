// routes/teacher.js
const express = require('express');
const bcrypt = require('bcrypt');
const router = express.Router();
const Teacher = require('../../models/Teachers/profile');
const multer = require('multer');
const { v4: uuidv4 } = require('uuid');

// Sanitize input helper function to prevent NoSQL injection
const sanitizeInput = (obj) => {
  if (!obj) return obj;

  const sanitized = {};

  Object.keys(obj).forEach(key => {
    if (typeof obj[key] === 'object' && obj[key] !== null) {
      sanitized[key] = sanitizeInput(obj[key]);
    } else if (typeof obj[key] === 'string') {
      // Remove potential NoSQL injection patterns
      sanitized[key] = obj[key]
        .replace(/\$/g, '')
        .replace(/\.\./g, '')
        .replace(/\{/g, '')
        .replace(/\}/g, '');
    } else {
      sanitized[key] = obj[key];
    }
  });

  return sanitized;
};

// Configure multer for memory storage (we'll save to MongoDB instead of disk)
const storage = multer.memoryStorage();

// File type filter
const fileFilter = (req, file, cb) => {
  // Accept only images
  if (file.mimetype.startsWith('image/')) {
    cb(null, true);
  } else {
    cb(new Error('Only image files are allowed'), false);
  }
};

const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB limit
  }
});

// Logging middleware
const logActivity = (req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.originalUrl} - User: ${req.ip}`);
  next();
};

router.use(logActivity);

// ───────────────────────── GET profile
// GET /api/teachers/profile
router.get('/profile', async (req, res) => {
  try {
    const teacher = await Teacher.findOne().select('-profileImage.data -passwordHash'); // Don't send binary data or password hash
    if (!teacher) return res.status(404).json({ error: 'No teacher profile found.' });

    // If we have a profile image, include the URL
    if (teacher.profileImage && teacher.profileImage.contentType) {
      // The URL is added through the virtual property
      res.json(teacher);
    } else {
      // Make sure we have a consistent response format
      const teacherObj = teacher.toObject({ virtuals: true });
      teacherObj.profileImageUrl = null;
      
      // If name fields aren't populated yet but name is available, split it
      if (teacher.name && (!teacher.firstName && !teacher.middleName && !teacher.lastName)) {
        const nameParts = teacher.name.split(' ');
        
        if (nameParts.length === 1) {
          teacherObj.firstName = nameParts[0];
          teacherObj.middleName = '';
          teacherObj.lastName = '';
        } else if (nameParts.length === 2) {
          teacherObj.firstName = nameParts[0];
          teacherObj.middleName = '';
          teacherObj.lastName = nameParts[1];
        } else {
          teacherObj.firstName = nameParts[0];
          teacherObj.lastName = nameParts[nameParts.length - 1];
          teacherObj.middleName = nameParts.slice(1, nameParts.length - 1).join(' ');
        }
      }
      
      res.json(teacherObj);
    }
  } catch (err) {
    console.error('Error fetching profile:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// ───────────────────────── GET profile image
// GET /api/teachers/profile/image/:id
router.get('/profile/image/:id', async (req, res) => {
  try {
    console.log(`Attempting to fetch image for ID: ${req.params.id}`);
    const teacher = await Teacher.findById(req.params.id);
    if (!teacher) {
      console.log(`No teacher found with ID: ${req.params.id}`);
      return res.status(404).json({ error: 'No teacher profile found.' });
    }
    if (!teacher.profileImage || !teacher.profileImage.data) {
      console.log(`Teacher found but no profile image data exists for ID: ${req.params.id}`);
      return res.status(404).json({ error: 'No profile image found.' });
    }

    // Set the appropriate content type
    res.set('Content-Type', teacher.profileImage.contentType);
    // Set cache control headers
    res.set('Cache-Control', 'no-store, no-cache, must-revalidate, private');
    res.set('Pragma', 'no-cache');
    // Send the binary data
    res.send(teacher.profileImage.data);
    console.log(`Successfully served image for ID: ${req.params.id}`);
  } catch (err) {
    console.error(`Error fetching profile image for ID ${req.params.id}:`, err);
    res.status(500).json({ error: 'Server error' });
  }
});

// ───────────────────────── UPDATE profile
// PUT /api/teachers/profile
router.put('/profile', async (req, res) => {
  try {
    // Sanitize input data
    const sanitizedData = sanitizeInput(req.body);

    // Validate required fields
    if (!sanitizedData.firstName || !sanitizedData.email || !sanitizedData.contact) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(sanitizedData.email)) {
      return res.status(400).json({ error: 'Invalid email format' });
    }

    // Validate phone number format (Philippine format)
    const phoneRegex = /^(\+?63|0)[\d]{10}$/;
    const cleanPhone = sanitizedData.contact.replace(/\s+/g, '');
    if (!phoneRegex.test(cleanPhone)) {
      return res.status(400).json({ error: 'Invalid phone number format' });
    }

    const teacher = await Teacher.findOne();
    if (!teacher) return res.status(404).json({ error: 'No teacher profile found.' });

    // Only update allowed fields, don't allow passwordHash or profileImage modification
    const updatableFields = [
      'firstName', 'middleName', 'lastName', 'position', 'email', 
      'contact', 'gender', 'civilStatus', 'dob', 'address', 'emergencyContact'
    ];

    updatableFields.forEach(field => {
      if (sanitizedData[field] !== undefined) {
        teacher[field] = sanitizedData[field];
      }
    });

    // Regenerate the full name
    teacher.name = [teacher.firstName, teacher.middleName, teacher.lastName]
      .filter(part => part && part.trim())
      .join(' ');

    await teacher.save();

    // Log the update action
    console.log(`[${new Date().toISOString()}] Profile updated for ${teacher.name}`);

    // Return updated teacher data without sensitive data
    const returnData = teacher.toObject({ virtuals: true });
    delete returnData.passwordHash;
    delete returnData.profileImage?.data; // Don't send binary data

    res.json({ message: 'Profile updated!', teacher: returnData });
  } catch (err) {
    console.error('Error updating profile:', err);
    res.status(500).json({ error: 'Update failed' });
  }
});

// ───────────────────────── CHANGE password
// POST /api/teachers/password
router.post('/password', async (req, res) => {
  const { currentPassword, newPassword } = req.body;

  // Sanitize inputs
  const sanitizedCurrentPassword = currentPassword.replace(/[^\w!@#$%^&*]/g, '');
  const sanitizedNewPassword = newPassword.replace(/[^\w!@#$%^&*]/g, '');

  // Validate password complexity
  const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*])[A-Za-z\d!@#$%^&*]{8,}$/;
  if (!passwordRegex.test(sanitizedNewPassword)) {
    return res.status(400).json({ error: 'Password does not meet complexity requirements.' });
  }

  try {
    const teacher = await Teacher.findOne();
    if (!teacher) {
      return res.status(404).json({ error: 'Profile not found.' });
    }

    // Special case: Check if we have the initial unhashed "HelloWorld" password
    const isInitialPassword = teacher.passwordHash === "HelloWorld";

    // For regular case, verify current password using bcrypt
    let passwordIsValid = false;

    if (isInitialPassword) {
      // For initial password, just compare directly
      passwordIsValid = sanitizedCurrentPassword === "HelloWorld";
    } else if (teacher.passwordHash) {
      // For properly hashed passwords, use bcrypt to compare
      passwordIsValid = await bcrypt.compare(sanitizedCurrentPassword, teacher.passwordHash);
    }

    if (!passwordIsValid) {
      // Log failed password change attempt
      console.log(`[${new Date().toISOString()}] Failed password change attempt - incorrect current password`);
      return res.status(400).json({ error: 'INCORRECT_PASSWORD' });
    }

    // Hash and save new password
    teacher.passwordHash = await bcrypt.hash(sanitizedNewPassword, 10);
    await teacher.save();

    // Log successful password change
    console.log(`[${new Date().toISOString()}] Password changed successfully for ${teacher.name}`);

    res.json({ success: true, message: 'Password updated successfully.' });
  } catch (err) {
    console.error('Error updating password:', err);
    res.status(500).json({ error: 'Password update failed.' });
  }
});

// ───────────────────────── UPLOAD profile image
// POST /api/teachers/profile/image
router.post('/profile/image', upload.single('profileImage'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    const teacher = await Teacher.findOne();
    if (!teacher) {
      return res.status(404).json({ error: 'No teacher profile found.' });
    }

    // Store image directly in MongoDB
    teacher.profileImage = {
      data: req.file.buffer,
      contentType: req.file.mimetype,
      filename: req.file.originalname,
      uploadDate: new Date()
    };

    await teacher.save();

    // Log image upload
    console.log(`[${new Date().toISOString()}] Profile image uploaded for ${teacher.name}`);

    res.json({
      success: true,
      message: 'Profile image uploaded successfully',
      imageUrl: teacher.profileImageUrl // Virtual property that gives the URL
    });
  } catch (err) {
    console.error('Error uploading profile image:', err);
    res.status(500).json({ error: 'Failed to upload image' });
  }
});

// ───────────────────────── DELETE profile image
// DELETE /api/teachers/profile/image
router.delete('/profile/image', async (req, res) => {
  try {
    const teacher = await Teacher.findOne();
    if (!teacher) {
      return res.status(404).json({ error: 'No teacher profile found.' });
    }

    // If there's an existing image, remove it
    if (teacher.profileImage && teacher.profileImage.data) {
      // Clear profile image data
      teacher.profileImage = null;
      await teacher.save();

      // Log image deletion
      console.log(`[${new Date().toISOString()}] Profile image deleted for ${teacher.name}`);

      return res.json({
        success: true,
        message: 'Profile image deleted successfully'
      });
    } else {
      return res.status(404).json({ error: 'No profile image to delete' });
    }
  } catch (err) {
    console.error('Error deleting profile image:', err);
    res.status(500).json({ error: 'Failed to delete image' });
  }
});

module.exports = router;