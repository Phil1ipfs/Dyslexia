const mongoose = require('mongoose');
const multer = require('multer');
const { S3Client, PutObjectCommand } = require('@aws-sdk/client-s3');
const bcrypt = require('bcrypt');

// Data sanitization utility functions
const sanitizeInput = {
    // Sanitize names - remove symbols, numbers, extra spaces
    name: (name) => {
        if (!name || typeof name !== 'string') return '';
        return name
            .replace(/[^a-zA-Z\s\u00C0-\u017F.-]/g, '') // Allow letters, spaces, accents, dots, hyphens
            .replace(/\s+/g, ' ') // Replace multiple spaces with single space
            .trim()
            .substring(0, 50); // Limit length
    },

    // Sanitize email - ensure proper format
    email: (email) => {
        if (!email || typeof email !== 'string') return '';
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        const cleanEmail = email.toLowerCase().trim();
        return emailRegex.test(cleanEmail) ? cleanEmail : '';
    },

    // Sanitize contact number - only numbers, +, -, spaces, parentheses
    contact: (contact) => {
        if (!contact || typeof contact !== 'string') return '';
        return contact
            .replace(/[^0-9+\-\s()]/g, '') // Only allow numbers and common phone characters
            .trim()
            .substring(0, 20); // Limit length
    },

    // Sanitize text fields - remove dangerous characters but allow most text
    text: (text, maxLength = 200) => {
        if (!text || typeof text !== 'string') return '';
        return text
            .replace(/[<>]/g, '') // Remove potential HTML tags
            .trim()
            .substring(0, maxLength);
    },

    // Validate date of birth and ensure 18+ age
    dateOfBirth: (dateStr) => {
        if (!dateStr) return '';

        const date = new Date(dateStr);
        const today = new Date();

        // Check if valid date
        if (isNaN(date.getTime())) return '';

        // Check if date is not in the future
        if (date > today) return '';

        // Calculate age
        const age = today.getFullYear() - date.getFullYear();
        const monthDiff = today.getMonth() - date.getMonth();
        const dayDiff = today.getDate() - date.getDate();

        // Adjust age if birthday hasn't occurred this year
        const actualAge = monthDiff < 0 || (monthDiff === 0 && dayDiff < 0) ? age - 1 : age;

        // Must be 18 or older for admin
        if (actualAge < 18) return '';

        return dateStr;
    },

    // Sanitize gender selection
    gender: (gender) => {
        const validGenders = ['Male', 'Female'];
        return validGenders.includes(gender) ? gender : '';
    },

    // Sanitize civil status selection
    civilStatus: (status) => {
        const validStatuses = ['Single', 'Married', 'Divorced', 'Widowed'];
        return validStatuses.includes(status) ? status : '';
    }
};

// Configure AWS S3
const s3Client = new S3Client({
    region: process.env.AWS_REGION,
    credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
    },
});

// Configure multer for memory storage
const upload = multer({
    storage: multer.memoryStorage(),
    limits: {
        fileSize: 5 * 1024 * 1024, // 5MB limit
    },
    fileFilter: (req, file, cb) => {
        if (file.mimetype.startsWith('image/')) {
            cb(null, true);
        } else {
            cb(new Error('Only image files are allowed!'), false);
        }
    },
});

exports.getAdminProfile = async (req, res) => {
    try {
        // Get the admin user ID and email from the request
        const adminEmail = req.user.email;
        const adminId = req.user.id;
        console.log('Looking up admin profile for:', { email: adminEmail, id: adminId });

        // Connect to admin_user database
        const adminUserDb = mongoose.connection.useDb('admin_user');
        const adminProfileCollection = adminUserDb.collection('admin_profile');

        // Find the admin profile by email and userId if available
        const query = { email: adminEmail };
        if (adminId) {
            query.userId = adminId;
        }

        let adminProfile = await adminProfileCollection.findOne(query);
        console.log('Found admin profile:', JSON.stringify(adminProfile, null, 2));

        // If not found with both email and userId, try just email
        if (!adminProfile && adminId) {
            adminProfile = await adminProfileCollection.findOne({ email: adminEmail });

            // If found by email but missing userId, update it
            if (adminProfile) {
                await adminProfileCollection.updateOne(
                    { _id: adminProfile._id },
                    { $set: { userId: adminId } }
                );
                adminProfile.userId = adminId;
            }
        }

        if (!adminProfile) {
            return res.status(404).json({
                success: false,
                message: 'Admin profile not found'
            });
        }

        // Return the complete profile data
        return res.status(200).json({
            success: true,
            data: {
                firstName: adminProfile.firstName || '',
                lastName: adminProfile.lastName || '',
                middleName: adminProfile.middleName || '',
                email: adminProfile.email || '',
                contact: adminProfile.contact || '',
                address: adminProfile.address || '',
                dateOfBirth: adminProfile.dateOfBirth || adminProfile.dateOfbirth || '',
                gender: adminProfile.gender || '',
                civilStatus: adminProfile.civilStatus || '',
                profileImageUrl: adminProfile.profileImageUrl || ''
            }
        });

    } catch (error) {
        console.error('Error in getAdminProfile:', error);
        return res.status(500).json({
            success: false,
            message: 'Error fetching admin profile',
            error: error.message
        });
    }
};

exports.updateAdminProfile = async (req, res) => {
    try {
        const adminEmail = req.user.email;
        const adminId = req.user.id;
        const updateData = req.body;

        console.log('Updating admin profile for:', { email: adminEmail, id: adminId });
        console.log('Update data before sanitization:', updateData);

        // Sanitize all input data before processing
        const sanitizedData = {
            firstName: sanitizeInput.name(updateData.firstName),
            lastName: sanitizeInput.name(updateData.lastName),
            middleName: sanitizeInput.name(updateData.middleName),
            email: sanitizeInput.email(updateData.email),
            contact: sanitizeInput.contact(updateData.contact),
            address: sanitizeInput.text(updateData.address, 200),
            dateOfBirth: sanitizeInput.dateOfBirth(updateData.dateOfBirth),
            gender: sanitizeInput.gender(updateData.gender),
            civilStatus: sanitizeInput.civilStatus(updateData.civilStatus),
            profileImageUrl: updateData.profileImageUrl // This is handled by AWS S3 upload, already safe
        };

        console.log('Sanitized data:', sanitizedData);

        // Validate required fields after sanitization
        const validationErrors = [];
        if (!sanitizedData.firstName) validationErrors.push('First name is required and must contain only letters');
        if (!sanitizedData.lastName) validationErrors.push('Last name is required and must contain only letters');
        if (!sanitizedData.email) validationErrors.push('Valid email address is required');
        if (!sanitizedData.dateOfBirth) validationErrors.push('Date of birth is required and admin must be 18+ years old');

        if (validationErrors.length > 0) {
            return res.status(400).json({
                success: false,
                message: 'Validation failed',
                errors: validationErrors
            });
        }

        // Connect to admin_user database
        const adminUserDb = mongoose.connection.useDb('admin_user');
        const adminProfileCollection = adminUserDb.collection('admin_profile');

        // Prepare update object with sanitized data (note: database field is 'dateOfbirth' with lowercase 'b')
        const updateObject = {
            firstName: sanitizedData.firstName,
            lastName: sanitizedData.lastName,
            middleName: sanitizedData.middleName || '',
            email: sanitizedData.email,
            contact: sanitizedData.contact || '',
            address: sanitizedData.address || '',
            dateOfbirth: sanitizedData.dateOfBirth,  // Frontend sends dateOfBirth, database expects dateOfbirth
            gender: sanitizedData.gender || '',
            civilStatus: sanitizedData.civilStatus || '',
            profileImageUrl: sanitizedData.profileImageUrl || '',
            updatedAt: new Date()
        };

        // Remove undefined values
        Object.keys(updateObject).forEach(key => {
            if (updateObject[key] === undefined) {
                delete updateObject[key];
            }
        });

        // Find and update the admin profile
        const query = { email: adminEmail };
        if (adminId) {
            query.userId = adminId;
        }

        const result = await adminProfileCollection.updateOne(
            query,
            { $set: updateObject },
            { upsert: true }
        );

        // Also update the email in users_web database if email changed
        if (sanitizedData.email && sanitizedData.email !== adminEmail) {
            const usersWebDb = mongoose.connection.useDb('users_web');
            const usersCollection = usersWebDb.collection('users');

            await usersCollection.updateOne(
                { email: adminEmail },
                { $set: { email: sanitizedData.email } }
            );
        }

        console.log('Update result:', result);

        return res.status(200).json({
            success: true,
            message: 'Admin profile updated successfully',
            data: updateObject
        });

    } catch (error) {
        console.error('Error in updateAdminProfile:', error);
        return res.status(500).json({
            success: false,
            message: 'Error updating admin profile',
            error: error.message
        });
    }
};

exports.uploadProfileImage = [
    upload.single('profileImage'),
    async (req, res) => {
        try {
            if (!req.file) {
                return res.status(400).json({
                    success: false,
                    message: 'No image file provided'
                });
            }

            const adminEmail = req.user.email;
            const file = req.file;

            // Generate unique filename
            const timestamp = Date.now();
            const fileName = `admin-profiles/${timestamp}-${adminEmail.replace('@', '_')}-${file.originalname}`;

            // Upload to S3
            const uploadParams = {
                Bucket: process.env.AWS_BUCKET_NAME,
                Key: fileName,
                Body: file.buffer,
                ContentType: file.mimetype,
            };

            const command = new PutObjectCommand(uploadParams);
            await s3Client.send(command);

            // Generate the public URL
            const imageUrl = `https://${process.env.AWS_BUCKET_NAME}.s3.${process.env.AWS_REGION}.amazonaws.com/${fileName}`;

            console.log('Image uploaded successfully:', imageUrl);

            return res.status(200).json({
                success: true,
                message: 'Image uploaded successfully',
                imageUrl: imageUrl
            });

        } catch (error) {
            console.error('Error uploading image:', error);
            return res.status(500).json({
                success: false,
                message: 'Error uploading image',
                error: error.message
            });
        }
    }
];

exports.changePassword = async (req, res) => {
    try {
        const { currentPassword, newPassword } = req.body;
        const adminEmail = req.user.email;

        if (!currentPassword || !newPassword) {
            return res.status(400).json({
                success: false,
                message: 'Current password and new password are required'
            });
        }

        // Connect to users_web database
        const usersWebDb = mongoose.connection.useDb('users_web');
        const usersCollection = usersWebDb.collection('users');

        // Find the user
        const user = await usersCollection.findOne({ email: adminEmail });
        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'User not found'
            });
        }

        // Verify current password
        const isValidPassword = await bcrypt.compare(currentPassword, user.passwordHash);
        if (!isValidPassword) {
            return res.status(400).json({
                success: false,
                message: 'Current password is incorrect'
            });
        }

        // Hash new password
        const saltRounds = 10;
        const hashedNewPassword = await bcrypt.hash(newPassword, saltRounds);

        // Update password
        await usersCollection.updateOne(
            { email: adminEmail },
            {
                $set: {
                    passwordHash: hashedNewPassword,
                    updatedAt: new Date()
                }
            }
        );

        console.log('Password changed successfully for:', adminEmail);

        return res.status(200).json({
            success: true,
            message: 'Password changed successfully'
        });

    } catch (error) {
        console.error('Error changing password:', error);
        return res.status(500).json({
            success: false,
            message: 'Error changing password',
            error: error.message
        });
    }
}; 