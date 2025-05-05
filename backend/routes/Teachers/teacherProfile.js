// backend/routes/Teachers/teacherProfile.js
const express = require('express');
const multer = require('multer');
const { Upload } = require('@aws-sdk/lib-storage');
const { DeleteObjectCommand } = require('@aws-sdk/client-s3');
const s3Client = require('../../config/s3');
const Teacher = require('../../models/Teachers/profile');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const router = express.Router();

// Configure multer for memory storage
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

// Authentication middleware
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];
  
  if (!token) {
    console.log('No token provided in request');
    return res.status(401).json({ error: 'Unauthorized: No token provided' });
  }
  
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET_KEY || 'fallback_secret_key');
    req.user = decoded;
    console.log('Authenticated user:', req.user.email, 'User ID:', req.user.id);
    next();
  } catch (error) {
    console.error('Token verification failed:', error.message);
    return res.status(401).json({ error: 'Unauthorized: Invalid token' });
  }
};

// Sanitize input helper function
const sanitizeInput = (obj) => {
  if (!obj) return obj;
  const sanitized = {};
  Object.keys(obj).forEach(key => {
    if (typeof obj[key] === 'object' && obj[key] !== null) {
      sanitized[key] = sanitizeInput(obj[key]);
    } else if (typeof obj[key] === 'string') {
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

// Logging middleware
const logActivity = (req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.originalUrl} - User: ${req.ip}`);
  next();
};

router.use(logActivity);

// Initialize teacher profile
// In routes/Teachers/teacherProfile.js - Update the initialize profile route
router.post('/profile/initialize', authenticateToken, async (req, res) => {
  try {
    console.log('Initializing profile for user:', req.user.email);
    
    // First, try to find profile by userId
    let teacher = await Teacher.findOne({ userId: req.user.id });
    
    // If not found by userId, try by email
    if (!teacher && req.user.email) {
      teacher = await Teacher.findOne({ email: req.user.email });
    }
    
    // If profile exists, return it
    if (teacher) {
      console.log('Found existing profile for:', teacher.name || teacher.email);
      
      // If the profile doesn't have userId, update it
      if (!teacher.userId) {
        teacher.userId = req.user.id;
        await teacher.save();
        console.log('Updated profile with user ID:', req.user.id);
      }
      
      const teacherData = teacher.toObject({ virtuals: true });
      delete teacherData.passwordHash;
      delete teacherData.profileImage?.data;
      
      return res.json({
        message: 'Profile already exists',
        teacher: teacherData
      });
    }
    
    // Create a default profile
    const defaultFirstName = req.user.email ? req.user.email.split('@')[0] : '';
    const newTeacher = new Teacher({
      userId: req.user.id,
      email: req.user.email,
      firstName: defaultFirstName || 'New',
      lastName: 'Teacher',
      position: '',
      // Add default contact number to satisfy the required field
      contact: '09000000000', // Default placeholder phone number
      passwordHash: await bcrypt.hash("DefaultPassword123!", 10),
      profileImageUrl: null,
      createdAt: new Date(),
      updatedAt: new Date()
    });
    
    await newTeacher.save();
    console.log('Created default profile for:', req.user.email);
    
    const returnData = newTeacher.toObject({ virtuals: true });
    delete returnData.passwordHash;
    
    return res.status(201).json({
      message: 'Default profile created',
      teacher: returnData
    });
  } catch (err) {
    console.error('Error initializing profile:', err);
    res.status(500).json({ error: 'Failed to initialize profile', details: err.message });
  }
});



// GET /api/teachers/profile
router.get('/profile', authenticateToken, async (req, res) => {
  try {
    console.log('Getting profile for user ID:', req.user.id);
    
    // First, try to find profile by userId
    let teacher = await Teacher.findOne({ userId: req.user.id }).select('-profileImage.data -passwordHash');
    
    // If not found by userId, try by email
    if (!teacher && req.user.email) {
      teacher = await Teacher.findOne({ email: req.user.email }).select('-profileImage.data -passwordHash');
      
      // If found by email but without userId, update it
      if (teacher && !teacher.userId) {
        teacher.userId = req.user.id;
        await teacher.save();
        console.log('Updated existing profile with user ID');
      }
    }
    
    // If still not found, check if any profile exists (migration support)
    if (!teacher) {
      teacher = await Teacher.findOne().select('-profileImage.data -passwordHash');
      
      // If found any profile, update it with the current user's ID
      if (teacher) {
        teacher.userId = req.user.id;
        teacher.email = req.user.email || teacher.email;
        await teacher.save();
        console.log('Migrated existing profile to user ID:', req.user.id);
      }
    }
    
    // If no profile exists at all, create default profile
    if (!teacher) {
      console.log('No profile found, redirecting to initialize endpoint...');
      return res.status(404).json({ 
        error: 'No teacher profile found.',
        action: 'initialize'
      });
    }

    // Create response object with profile data
    const teacherObj = teacher.toObject({ virtuals: true });

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

    // Transform profileImageUrl from "null" string to actual null
    if (teacherObj.profileImageUrl === "null") {
      teacherObj.profileImageUrl = null;
    }

    res.json(teacherObj);
  } catch (err) {
    console.error('Error fetching profile:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// POST /api/teachers/profile
router.post('/profile', authenticateToken, async (req, res) => {
  try {
    // Sanitize input data
    const sanitizedData = sanitizeInput(req.body);

    // Validate required fields
    if (!sanitizedData.firstName || !sanitizedData.email) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    // Check if profile already exists for this user
    let existingTeacher = await Teacher.findOne({ userId: req.user.id });
    if (!existingTeacher && req.user.email) {
      existingTeacher = await Teacher.findOne({ email: req.user.email });
    }
    
    if (existingTeacher) {
      return res.status(400).json({ error: 'Teacher profile already exists. Use PUT to update.' });
    }

    // Create a new teacher profile
    const teacher = new Teacher({
      ...sanitizedData,
      userId: req.user.id, // Link to authenticated user
      email: sanitizedData.email || req.user.email,
      passwordHash: await bcrypt.hash("DefaultPassword123!", 10), // Set default password
      profileImageUrl: null,
      createdAt: new Date(),
      updatedAt: new Date()
    });

    // Generate full name from parts
    teacher.name = [teacher.firstName, teacher.middleName, teacher.lastName]
      .filter(part => part && part.trim())
      .join(' ');

    await teacher.save();

    // Log the creation action
    console.log(`[${new Date().toISOString()}] Created new profile for ${teacher.name}`);

    // Return the new teacher without sensitive data
    const returnData = teacher.toObject({ virtuals: true });
    delete returnData.passwordHash;

    res.status(201).json({ message: 'Profile created!', teacher: returnData });
  } catch (err) {
    console.error('Error creating profile:', err);
    res.status(500).json({ error: 'Failed to create profile' });
  }
});

// PUT /api/teachers/profile
router.put('/profile', authenticateToken, async (req, res) => {
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

    // Find profile by user ID
    let updateFilter = { userId: req.user.id };
    
    // Check if profile exists by userId
    const profileExists = await Teacher.findOne(updateFilter);
    if (!profileExists) {
      // If no profile found by userId, try email
      if (req.user.email) {
        const profileByEmail = await Teacher.findOne({ email: req.user.email });
        if (profileByEmail) {
          // If found by email, update it to use userId
          profileByEmail.userId = req.user.id;
          await profileByEmail.save();
          console.log('Added userId to existing profile found by email');
        } else {
          // If still not found, look for any profile
          const anyProfile = await Teacher.findOne();
          if (anyProfile) {
            // Update any profile to use the current user's ID
            anyProfile.userId = req.user.id;
            anyProfile.email = req.user.email || anyProfile.email;
            await anyProfile.save();
            console.log('Linked existing profile to current user');
          }
        }
      }
      
      // For findOneAndUpdate, use empty filter as fallback if no profile found yet
      updateFilter = {};
    }

    // Find existing profile using findOneAndUpdate
    const updateResult = await Teacher.findOneAndUpdate(
      updateFilter,
      {
        userId: req.user.id, // Ensure userId is set
        firstName: sanitizedData.firstName,
        middleName: sanitizedData.middleName || '',
        lastName: sanitizedData.lastName,
        position: sanitizedData.position || '',
        email: sanitizedData.email,
        contact: sanitizedData.contact,
        gender: sanitizedData.gender || '',
        civilStatus: sanitizedData.civilStatus || '',
        dob: sanitizedData.dob || '',
        address: sanitizedData.address || '',
        emergencyContact: sanitizedData.emergencyContact || { name: '', number: '' },
        name: [sanitizedData.firstName, sanitizedData.middleName, sanitizedData.lastName]
          .filter(part => part && part.trim())
          .join(' '),
        updatedAt: new Date()
      },
      {
        new: true, // Return the updated document
        upsert: true, // Create if it doesn't exist
        runValidators: true, // Run model validators
        setDefaultsOnInsert: true // Apply default values if creating new doc
      }
    );

    // Log the update action
    console.log(`[${new Date().toISOString()}] Profile updated for ${updateResult.name}`);

    // Return updated teacher data without sensitive data
    const returnData = updateResult.toObject({ virtuals: true });
    delete returnData.passwordHash;
    delete returnData.profileImage?.data; // Don't send binary data

    // Transform profileImageUrl from "null" string to actual null
    if (returnData.profileImageUrl === "null") {
      returnData.profileImageUrl = null;
    }

    res.json({ message: 'Profile updated!', teacher: returnData });
  } catch (err) {
    console.error('Error updating profile:', err);
    res.status(500).json({ error: 'Update failed', details: err.message });
  }
});

// GET /api/teachers/profile/image/current
router.get('/profile/image/current', authenticateToken, async (req, res) => {
  try {
    console.log(`Attempting to fetch current teacher profile image for user:`, req.user.id);

    // Find profile by userId
    let teacher = await Teacher.findOne({ userId: req.user.id });
    
    // If not found by userId, try by email
    if (!teacher && req.user.email) {
      teacher = await Teacher.findOne({ email: req.user.email });
    }
    
    // If still not found, try any profile
    if (!teacher) {
      teacher = await Teacher.findOne();
    }

    if (!teacher) {
      console.log('No teacher profile found');
      return res.status(404).json({ error: 'No teacher profile found.' });
    }

    // Check if we have an S3 URL - if yes, redirect to it
    if (teacher.profileImageUrl && teacher.profileImageUrl !== "null") {
      console.log(`Teacher has S3 URL, redirecting to: ${teacher.profileImageUrl}`);
      return res.redirect(teacher.profileImageUrl);
    }

    // Fall back to binary data in MongoDB if no S3 URL
    if (!teacher.profileImage || !teacher.profileImage.data) {
      console.log(`Teacher found but no profile image data exists`);
      return res.status(404).json({ error: 'No profile image found.' });
    }

    // Serve from MongoDB (legacy support)
    res.set('Content-Type', teacher.profileImage.contentType);
    res.set('Cache-Control', 'no-store, no-cache, must-revalidate, private');
    res.set('Pragma', 'no-cache');
    res.send(teacher.profileImage.data);
    console.log(`Successfully served image from MongoDB`);
  } catch (err) {
    console.error(`Error fetching profile image:`, err);
    res.status(500).json({ error: 'Server error' });
  }
});

// POST /api/teachers/password
router.post('/password', authenticateToken, async (req, res) => {
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
    // Find profile by userId
    let teacher = await Teacher.findOne({ userId: req.user.id });
    
    // If not found by userId, try by email
    if (!teacher && req.user.email) {
      teacher = await Teacher.findOne({ email: req.user.email });
    }
    
    // If still not found, try any profile
    if (!teacher) {
      teacher = await Teacher.findOne();
    }
    
    if (!teacher) {
      return res.status(404).json({ error: 'Profile not found.' });
    }

    // Special case: Check if we have the initial unhashed "DefaultPassword123!" password
    const isInitialPassword = teacher.passwordHash === "DefaultPassword123!";

    // For regular case, verify current password using bcrypt
    let passwordIsValid = false;

    if (isInitialPassword) {
      // For initial password, just compare directly
      passwordIsValid = sanitizedCurrentPassword === "DefaultPassword123!";
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
    teacher.lastPasswordChange = new Date();
    
    // If the profile doesn't have a userId, update it
    if (!teacher.userId) {
      teacher.userId = req.user.id;
    }
    
    await teacher.save();

    // Log successful password change
    console.log(`[${new Date().toISOString()}] Password changed successfully for ${teacher.name}`);

    res.json({ success: true, message: 'Password updated successfully.' });
  } catch (err) {
    console.error('Error updating password:', err);
    res.status(500).json({ error: 'Password update failed.' });
  }
});

// POST /api/teachers/profile/image
router.post('/profile/image', authenticateToken, upload.single('profileImage'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    console.log('Processing image upload: file size =', req.file.size, 'bytes');
    console.log('MIME type =', req.file.mimetype);

    // Find profile by userId
    let teacher = await Teacher.findOne({ userId: req.user.id });
    
    // If not found by userId, try by email
    if (!teacher && req.user.email) {
      teacher = await Teacher.findOne({ email: req.user.email });
    }
    
    // If still not found, try any profile
    if (!teacher) {
      teacher = await Teacher.findOne();
    }

    if (!teacher) {
      console.error('No teacher profile found in the database');
      return res.status(404).json({ error: 'Teacher profile not found. Please create a profile first.' });
    }

    // Add userId if missing
    if (!teacher.userId) {
      teacher.userId = req.user.id;
      await teacher.save();
    }

    console.log('Found teacher profile with ID:', teacher._id.toString());

    try {
      // Check if S3 config exists
      if (!process.env.AWS_BUCKET_NAME) {
        throw new Error('AWS_BUCKET_NAME is not configured');
      }

      // Delete existing S3 image if present
      if (teacher.profileImageUrl &&
        teacher.profileImageUrl !== "null" &&
        teacher.profileImageUrl.includes('amazonaws.com')) {
        try {
          // Extract key from URL
          const urlParts = teacher.profileImageUrl.split('/');
          const key = urlParts.slice(3).join('/');

          console.log('Deleting previous S3 image with key:', key);

          const deleteCommand = new DeleteObjectCommand({
            Bucket: process.env.AWS_BUCKET_NAME,
            Key: key
          });

          await s3Client.send(deleteCommand);
          console.log('Successfully deleted previous S3 image');
        } catch (deleteError) {
          console.error('Failed to delete previous S3 image:', deleteError.message);
          // Continue with upload even if deletion fails
        }
      }

      // Create organized folder structure
      const currentYear = new Date().getFullYear();
      const currentMonth = String(new Date().getMonth() + 1).padStart(2, '0');

      // Generate unique filename with teacher information
      const timestamp = Date.now();
      const sanitizedId = teacher._id.toString().replace(/[^a-zA-Z0-9]/g, '');
      const sanitizedName = teacher.lastName ?
        teacher.lastName.toLowerCase().replace(/[^a-z0-9]/g, '') :
        'teacher';
      const fileExt = req.file.originalname.split('.').pop().toLowerCase() || 'jpg';

      // Create structured key with folders
      const filename = `${timestamp}-${sanitizedName}-${sanitizedId}.${fileExt}`;
      const key = `teacher-profiles/${currentYear}/${currentMonth}/${filename}`;

      console.log('S3 upload starting:');
      console.log('- Bucket:', process.env.AWS_BUCKET_NAME);
      console.log('- Key:', key);
      console.log('- File size:', req.file.size, 'bytes');

      // Create S3 upload
      const uploader = new Upload({
        client: s3Client,
        params: {
          Bucket: process.env.AWS_BUCKET_NAME,
          Key: key,
          Body: req.file.buffer,
          ACL: 'public-read',
          ContentType: req.file.mimetype
        }
      });

      // Perform the upload
      const uploadResult = await uploader.done();
      console.log('S3 upload successful:', uploadResult.Location);

      // Update MongoDB document - using findOneAndUpdate to avoid document not found errors
      const updateResult = await Teacher.findOneAndUpdate(
        { _id: teacher._id },
        {
          profileImageUrl: uploadResult.Location,
          updatedAt: new Date()
        },
        {
          new: true, // Return updated document
          runValidators: true
        }
      );

      if (!updateResult) {
        throw new Error('Failed to update teacher profile after successful S3 upload');
      }

      console.log('Teacher profile updated with new image URL:', updateResult.profileImageUrl);

      return res.json({
        success: true,
        message: 'Profile image uploaded successfully',
        imageUrl: uploadResult.Location
      });
    } catch (s3Error) {
      console.error('S3 upload or MongoDB update failed:', s3Error.message);

      // Fallback to MongoDB storage
      console.log('Falling back to MongoDB storage...');

      try {
        // Store image in MongoDB using findOneAndUpdate
        const mongoUpdate = await Teacher.findOneAndUpdate(
          { _id: teacher._id },
          {
            profileImage: {
              data: req.file.buffer,
              contentType: req.file.mimetype,
              filename: req.file.originalname,
              uploadDate: new Date()
            },
            // Local API URL as fallback
            profileImageUrl: `/api/teachers/profile/image/current?noCache=${Date.now()}`,
            updatedAt: new Date()
          },
          {
            new: true,
            runValidators: true
          }
        );

        if (!mongoUpdate) {
          throw new Error('Failed to update MongoDB with image data');
        }

        console.log('Image successfully stored in MongoDB');

        return res.json({
          success: true,
          message: 'Profile image stored in MongoDB (S3 upload failed)',
          imageUrl: mongoUpdate.profileImageUrl,
          fallback: true
        });
      } catch (mongoError) {
        console.error('MongoDB fallback storage failed:', mongoError.message);
        throw new Error(`S3 upload failed and MongoDB fallback failed: ${mongoError.message}`);
      }
    }
  } catch (err) {
    console.error('Image upload failed:', err.message);
    console.error(err.stack);
    res.status(500).json({
      error: 'Failed to upload image',
      details: err.message
    });
  }
});

// DELETE /api/teachers/profile/image
router.delete('/profile/image', authenticateToken, async (req, res) => {
  try {
    // Find profile by userId
    let teacher = await Teacher.findOne({ userId: req.user.id });
    
    // If not found by userId, try by email
    if (!teacher && req.user.email) {
      teacher = await Teacher.findOne({ email: req.user.email });
    }
    
    // If still not found, try any profile
    if (!teacher) {
      teacher = await Teacher.findOne();
    }

    if (!teacher) {
      return res.status(404).json({ error: 'No teacher profile found.' });
    }

    // Check if S3 image URL exists
    if (teacher.profileImageUrl &&
      teacher.profileImageUrl !== "null" &&
      teacher.profileImageUrl.includes('amazonaws.com')) {
      try {
        // Extract key from URL
        const urlParts = teacher.profileImageUrl.split('/');
        // This will maintain the folder structure (teacher-profiles/year/month/filename)
        const key = urlParts.slice(3).join('/');

        console.log('Deleting S3 image with key:', key);

        const deleteCommand = new DeleteObjectCommand({
          Bucket: process.env.AWS_BUCKET_NAME,
          Key: key
        });

        await s3Client.send(deleteCommand);
        console.log('Successfully deleted S3 image');
      } catch (deleteError) {
        console.error('Failed to delete S3 image:', deleteError.message);
        // Continue with database update even if S3 deletion fails
      }
    }

    // Update MongoDB document using findOneAndUpdate
    const updateResult = await Teacher.findOneAndUpdate(
      { _id: teacher._id },
      {
        profileImageUrl: null, // Set to null, not "null" string
        profileImage: null, // Remove MongoDB image data too
        updatedAt: new Date()
      },
      {
        new: true,
        runValidators: true
      }
    );

    if (!updateResult) {
      throw new Error('Failed to update teacher profile after deleting image');
    }

    console.log('Profile image record deleted for teacher:', updateResult.name || 'unknown');

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
});

// POST /api/teachers/profile/image/delete
router.post('/profile/image/delete', authenticateToken, async (req, res) => {
  try {
    // Find profile by userId
    let teacher = await Teacher.findOne({ userId: req.user.id });
    
    // If not found by userId, try by email
    if (!teacher && req.user.email) {
      teacher = await Teacher.findOne({ email: req.user.email });
    }
    
    // If still not found, try any profile
    if (!teacher) {
      teacher = await Teacher.findOne();
    }
    
    if (!teacher) {
      return res.status(404).json({ error: 'No teacher profile found.' });
    }

    // Check if S3 image URL exists
    if (teacher.profileImageUrl &&
      teacher.profileImageUrl !== "null" &&
      teacher.profileImageUrl.includes('amazonaws.com')) {
      try {
        // Extract key from URL
        const urlParts = teacher.profileImageUrl.split('/');
        const key = urlParts.slice(3).join('/'); // Maintain folder structure

        const deleteCommand = new DeleteObjectCommand({
          Bucket: process.env.AWS_BUCKET_NAME,
          Key: key
        });

        await s3Client.send(deleteCommand);
        console.log(`Deleted image from S3: ${key}`);
      } catch (deleteError) {
        console.error(`Error deleting S3 image:`, deleteError);
        // Continue with database update even if S3 deletion fails
      }
    }

    // Update MongoDB document
    const updateResult = await Teacher.findOneAndUpdate(
      { _id: teacher._id },
      {
        profileImageUrl: null,
        profileImage: null,
        updatedAt: new Date()
      },
      { new: true }
    );

    if (!updateResult) {
      throw new Error('Failed to update teacher profile after deleting image');
    }

    console.log(`Profile image deleted for ${updateResult.name || 'teacher'}`);

    return res.json({
      success: true,
      message: 'Profile image deleted successfully'
    });
  } catch (err) {
    console.error('Error deleting profile image:', err);
    res.status(500).json({ error: 'Failed to delete image', details: err.message });
  }
});

// Export the router
module.exports = router;