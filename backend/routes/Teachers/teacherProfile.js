// backend/routes/Teachers/teacherProfile.js
const express = require('express');
const multer = require('multer');
const { Upload } = require('@aws-sdk/lib-storage');
const { DeleteObjectCommand } = require('@aws-sdk/client-s3');
const s3Client = require('../../config/s3');
const Teacher = require('../../models/Teachers/profile');
const bcrypt = require('bcrypt');
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

// ───────────────────────── GET profile
// GET /api/teachers/profile
router.get('/profile', async (req, res) => {
  try {
    const teacher = await Teacher.findOne().select('-profileImage.data -passwordHash'); // Don't send binary data or password hash
    if (!teacher) return res.status(404).json({ error: 'No teacher profile found.' });

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

// ───────────────────────── CREATE new profile
// POST /api/teachers/profile
router.post('/profile', async (req, res) => {
  try {
    // Sanitize input data
    const sanitizedData = sanitizeInput(req.body);

    // Validate required fields
    if (!sanitizedData.firstName || !sanitizedData.email) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    // Check if profile already exists
    const existingTeacher = await Teacher.findOne();
    if (existingTeacher) {
      return res.status(400).json({ error: 'Teacher profile already exists. Use PUT to update.' });
    }

    // Create a new teacher profile
    const teacher = new Teacher({
      ...sanitizedData,
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

    // Find existing or create new teacher profile
    let teacher = await Teacher.findOne();
    if (!teacher) {
      // Create new profile if not exists
      teacher = new Teacher({
        passwordHash: await bcrypt.hash("DefaultPassword123!", 10), // Set default password
        profileImageUrl: null,
        createdAt: new Date()
      });
    }

    // Only update allowed fields
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

    teacher.updatedAt = new Date();
    await teacher.save();

    // Log the update action
    console.log(`[${new Date().toISOString()}] Profile updated for ${teacher.name}`);

    // Return updated teacher data without sensitive data
    const returnData = teacher.toObject({ virtuals: true });
    delete returnData.passwordHash;
    delete returnData.profileImage?.data; // Don't send binary data
    
    // Transform profileImageUrl from "null" string to actual null
    if (returnData.profileImageUrl === "null") {
      returnData.profileImageUrl = null;
    }

    res.json({ message: 'Profile updated!', teacher: returnData });
  } catch (err) {
    console.error('Error updating profile:', err);
    res.status(500).json({ error: 'Update failed' });
  }
});


// GET /api/teachers/profile/image/current
router.get('/profile/image/current', async (req, res) => {
  try {
    console.log(`Attempting to fetch current teacher profile image`);
    
    // Always use findOne without ID parameters
    const teacher = await Teacher.findOne();
    
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

    console.log('Processing image upload: file size =', req.file.size, 'bytes');
    console.log('MIME type =', req.file.mimetype);

    // First, get the teacher profile
    let teacher = await Teacher.findOne();
    if (!teacher) {
      // Create new teacher profile if not exists
      console.log('Creating new teacher profile for image upload');
      teacher = new Teacher({
        firstName: "Unknown",
        lastName: "User", 
        email: "unknown@example.com",
        contact: "09000000000",
        passwordHash: await bcrypt.hash("DefaultPassword123!", 10),
        createdAt: new Date(),
        updatedAt: new Date()
      });
      
      // Save the new teacher to get an _id
      await teacher.save();
      console.log('Created new teacher profile with ID:', teacher._id);
    }

    // First try MongoDB-only storage as a safe approach
    console.log('Storing image in MongoDB first as a fallback');
    teacher.profileImage = {
      data: req.file.buffer,
      contentType: req.file.mimetype,
      filename: req.file.originalname,
      uploadDate: new Date()
    };
    
    // Save to MongoDB first to ensure we have a backup
    teacher.updatedAt = new Date();
    await teacher.save();
    console.log('Image saved to MongoDB successfully');

    // Now try S3 storage
    try {
      // Check if S3 config exists before proceeding
      if (!process.env.AWS_BUCKET_NAME || !process.env.AWS_ACCESS_KEY_ID || !process.env.AWS_SECRET_ACCESS_KEY) {
        throw new Error('Missing S3 credentials in environment variables');
      }
      
      // Delete existing image from S3 if it exists
      if (teacher.profileImageUrl && teacher.profileImageUrl !== "null") {
        try {
          console.log('Attempting to delete previous S3 image:', teacher.profileImageUrl);
          
          // Extract key from URL
          const urlParts = teacher.profileImageUrl.split('/');
          const key = urlParts.slice(3).join('/'); // Skip the https://bucket-name.s3.region part
          
          console.log('Extracted S3 key:', key);
          
          const deleteCommand = new DeleteObjectCommand({
            Bucket: process.env.AWS_BUCKET_NAME,
            Key: key
          });
          
          await s3Client.send(deleteCommand);
          console.log(`[${new Date().toISOString()}] Successfully deleted old image from S3: ${key}`);
        } catch (deleteError) {
          console.error(`[${new Date().toISOString()}] Error deleting old S3 image:`, deleteError);
          // Continue with upload even if deletion fails
        }
      }

      // Generate a unique filename with proper sanitization
      const sanitizedFirstName = (teacher.firstName || 'user').replace(/[^a-zA-Z0-9]/g, '');
      const sanitizedLastName = (teacher.lastName || 'profile').replace(/[^a-zA-Z0-9]/g, '');
      const timestamp = Date.now();
      const filename = `${timestamp}-${sanitizedFirstName}-${sanitizedLastName}.jpg`;
      const key = `uploads/${filename}`;
      
      console.log('S3 upload - bucket:', process.env.AWS_BUCKET_NAME);
      console.log('S3 upload - key:', key);
      console.log('Request buffer size:', req.file.buffer.length);

      // Upload to S3
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

      console.log('Starting S3 upload...');
      const uploadResult = await uploader.done();
      console.log('S3 upload successful:', uploadResult.Location);
      
      // Update teacher with S3 URL
      teacher.profileImageUrl = uploadResult.Location;
      teacher.updatedAt = new Date();
      await teacher.save();
      console.log('Teacher profile updated with new image URL:', teacher.profileImageUrl);

      return res.json({
        success: true,
        message: 'Profile image uploaded successfully to S3',
        imageUrl: teacher.profileImageUrl
      });
    } catch (s3Error) {
      console.error('S3 upload failed with error:', s3Error);
      console.error('Error details:', s3Error.stack);
      
      // Return success with MongoDB URL since we already saved it there
      const mongoUrl = `/api/teachers/profile/image/${teacher._id}?noCache=${Date.now()}`;
      console.log('Using MongoDB fallback URL:', mongoUrl);
      
      return res.json({
        success: true,
        message: 'Profile image uploaded to MongoDB (S3 upload failed)',
        imageUrl: mongoUrl,
        error: s3Error.message
      });
    }
  } catch (err) {
    console.error('Detailed error uploading profile image:', err);
    console.error('Error stack:', err.stack);
    res.status(500).json({ 
      error: 'Failed to upload image', 
      details: err.message 
    });
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

    // Check if we have an S3 URL to delete
    if (teacher.profileImageUrl && teacher.profileImageUrl !== "null") {
      try {
        // Extract key from URL
        const urlParts = teacher.profileImageUrl.split('/');
        const key = urlParts.slice(3).join('/'); // Skip the https://bucket-name.s3.region part
        
        const deleteCommand = new DeleteObjectCommand({
          Bucket: process.env.AWS_BUCKET_NAME,
          Key: key
        });
        
        await s3Client.send(deleteCommand);
        console.log(`[${new Date().toISOString()}] Deleted image from S3: ${key}`);
      } catch (deleteError) {
        console.error(`[${new Date().toISOString()}] Error deleting S3 image:`, deleteError);
        // Continue with database update even if S3 deletion fails
      }
    }

    // Reset the profileImageUrl field to null, not "null" string
    teacher.profileImageUrl = null;
    
    // Also remove MongoDB image data if it exists
    if (teacher.profileImage && teacher.profileImage.data) {
      teacher.profileImage = null;
    }
    
    teacher.updatedAt = new Date();
    await teacher.save();

    // Log image deletion
    console.log(`[${new Date().toISOString()}] Profile image deleted for ${teacher.name}`);

    return res.json({
      success: true,
      message: 'Profile image deleted successfully'
    });
  } catch (err) {
    console.error('Error deleting profile image:', err);
    res.status(500).json({ error: 'Failed to delete image' });
  }
});

// Export the router
module.exports = router;