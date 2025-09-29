const mongoose = require('mongoose');
const multer = require('multer');
const { S3Client, PutObjectCommand } = require('@aws-sdk/client-s3');
const bcrypt = require('bcrypt');

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
        console.log('Update data:', updateData);

        // Connect to admin_user database
        const adminUserDb = mongoose.connection.useDb('admin_user');
        const adminProfileCollection = adminUserDb.collection('admin_profile');

        // Prepare update object
        const updateObject = {
            firstName: updateData.firstName,
            lastName: updateData.lastName,
            middleName: updateData.middleName,
            email: updateData.email,
            contact: updateData.contact,
            address: updateData.address,
            dateOfBirth: updateData.dateOfBirth,
            gender: updateData.gender,
            civilStatus: updateData.civilStatus,
            profileImageUrl: updateData.profileImageUrl,
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
        if (updateData.email && updateData.email !== adminEmail) {
            const usersWebDb = mongoose.connection.useDb('users_web');
            const usersCollection = usersWebDb.collection('users');

            await usersCollection.updateOne(
                { email: adminEmail },
                { $set: { email: updateData.email } }
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
                ACL: 'public-read'
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