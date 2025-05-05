// controllers/teacherProfileController.js
const bcrypt = require('bcrypt');
const { Upload } = require('@aws-sdk/lib-storage');
const { DeleteObjectCommand } = require('@aws-sdk/client-s3');
const s3Client = require('../config/s3');
const getTeacherProfileModel = require('../models/teacherProfileModel');

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

// Get teacher profile
exports.getProfile = async (req, res) => {
  try {
    console.log('Getting profile for user ID:', req.user.id);
    
    // Get the TeacherProfile model
    const TeacherProfile = await getTeacherProfileModel();
    
    // First, try to find profile by userId
    let teacher = await TeacherProfile.findOne({ userId: req.user.id }).select('-profileImage.data -passwordHash');
    
    // If not found by userId, try by email
    if (!teacher && req.user.email) {
      teacher = await TeacherProfile.findOne({ email: req.user.email }).select('-profileImage.data -passwordHash');
      
      // If found by email but without userId, update it
      if (teacher && !teacher.userId) {
        teacher.userId = req.user.id;
        await teacher.save();
        console.log('Updated existing profile with user ID');
      }
    }
    
    // If no profile exists, return 404
    if (!teacher) {
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
};

// Initialize teacher profile
exports.initializeProfile = async (req, res) => {
  try {
    console.log('Initializing profile for user:', req.user.email);
    
    // Get the TeacherProfile model
    const TeacherProfile = await getTeacherProfileModel();
    
    // First, try to find profile by userId
    let teacher = await TeacherProfile.findOne({ userId: req.user.id });
    
    // If not found by userId, try by email
    if (!teacher && req.user.email) {
      teacher = await TeacherProfile.findOne({ email: req.user.email });
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
    const newTeacher = new TeacherProfile({
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
};

// Create teacher profile
exports.createProfile = async (req, res) => {
  try {
    // Sanitize input data
    const sanitizedData = sanitizeInput(req.body);

    // Validate required fields
    if (!sanitizedData.firstName || !sanitizedData.email) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    // Get the TeacherProfile model
    const TeacherProfile = await getTeacherProfileModel();
    
    // Check if profile already exists for this user
    let existingTeacher = await TeacherProfile.findOne({ userId: req.user.id });
    if (!existingTeacher && req.user.email) {
      existingTeacher = await TeacherProfile.findOne({ email: req.user.email });
    }
    
    if (existingTeacher) {
      return res.status(400).json({ error: 'Teacher profile already exists. Use PUT to update.' });
    }

    // Create a new teacher profile
    const teacher = new TeacherProfile({
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
};

// Update teacher profile
exports.updateProfile = async (req, res) => {
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

    // Get the TeacherProfile model
    const TeacherProfile = await getTeacherProfileModel();

    // Find profile by user ID
    let updateFilter = { userId: req.user.id };
    
    // Check if profile exists by userId
    const profileExists = await TeacherProfile.findOne(updateFilter);
    if (!profileExists) {
      // If no profile found by userId, try email
      if (req.user.email) {
        const profileByEmail = await TeacherProfile.findOne({ email: req.user.email });
        if (profileByEmail) {
          // If found by email, update it to use userId
          profileByEmail.userId = req.user.id;
          await profileByEmail.save();
          console.log('Added userId to existing profile found by email');
        } else {
          // If still not found, look for any profile
          const anyProfile = await TeacherProfile.findOne();
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
    const updateResult = await TeacherProfile.findOneAndUpdate(
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
};

// Update teacher password
exports.updatePassword = async (req, res) => {
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
    // Get the TeacherProfile model
    const TeacherProfile = await getTeacherProfileModel();
    
    // Find profile by userId
    let teacher = await TeacherProfile.findOne({ userId: req.user.id });
    
    // If not found by userId, try by email
    if (!teacher && req.user.email) {
      teacher = await TeacherProfile.findOne({ email: req.user.email });
    }
    
    // If still not found, try any profile
    if (!teacher) {
      teacher = await TeacherProfile.findOne();
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
};

// Upload profile image
exports.uploadProfileImage = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    console.log('Processing image upload: file size =', req.file.size, 'bytes');
    console.log('MIME type =', req.file.mimetype);

    // Get the TeacherProfile model
    const TeacherProfile = await getTeacherProfileModel();
    
    // Find profile by userId
    let teacher = await TeacherProfile.findOne({ userId: req.user.id });
    
    // If not found by userId, try by email
    if (!teacher && req.user.email) {
      teacher = await TeacherProfile.findOne({ email: req.user.email });
    }
    
    // If still not found, try any profile
    if (!teacher) {
      teacher = await TeacherProfile.findOne();
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
      const updateResult = await TeacherProfile.findOneAndUpdate(
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
        const mongoUpdate = await TeacherProfile.findOneAndUpdate(
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
};

// Delete profile image
exports.deleteProfileImage = async (req, res) => {
  try {
    // Get the TeacherProfile model
    const TeacherProfile = await getTeacherProfileModel();
    
    // Find profile by userId
    let teacher = await TeacherProfile.findOne({ userId: req.user.id });
    
    // If not found by userId, try by email
    if (!teacher && req.user.email) {
      teacher = await TeacherProfile.findOne({ email: req.user.email });
    }
    
    // If still not found, try any profile
    if (!teacher) {
      teacher = await TeacherProfile.findOne();
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
    const updateResult = await TeacherProfile.findOneAndUpdate(
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
};

// Get current profile image
// Update the getCacheBustedImageUrl function in teacherProfileController.js
// Add this to your getCurrentProfileImage method:

exports.getCurrentProfileImage = async (req, res) => {
  try {
    console.log(`Attempting to fetch current teacher profile image for user:`, req.user.id);

    // Get the TeacherProfile model
    const TeacherProfile = await getTeacherProfileModel();
    
    // Find profile by userId
    let teacher = await TeacherProfile.findOne({ userId: req.user.id });
    
    // If not found by userId, try by email
    if (!teacher && req.user.email) {
      teacher = await TeacherProfile.findOne({ email: req.user.email });
    }
    
    // If still not found, try any profile
    if (!teacher) {
      teacher = await TeacherProfile.findOne();
    }

    if (!teacher) {
      console.log('No teacher profile found');
      return res.status(404).json({ error: 'No teacher profile found.' });
    }

    console.log('Found teacher profile:', teacher._id);
    console.log('Profile image URL:', teacher.profileImageUrl);

    // Check if we have an S3 URL - if yes, redirect to it
    if (teacher.profileImageUrl && teacher.profileImageUrl !== "null") {
      // Clean up the URL in case it got stored in an abbreviated format
      let cleanUrl = teacher.profileImageUrl;
      // Ensure the URL is properly formed
      if (cleanUrl.includes('s3.ap-southeast-2.amazonaws.com') && !cleanUrl.startsWith('http')) {
        cleanUrl = 'https://' + cleanUrl;
      }
      
      console.log(`Teacher has S3 URL, redirecting to: ${cleanUrl}`);
      return res.redirect(cleanUrl);
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
    res.status(500).json({ error: 'Server error', details: err.message });
  }
};