// backend/routes/Teachers/uploadFile.js
const express = require('express');
const multer = require('multer');
const path = require('path');
const mongoose = require('mongoose');
const { PutObjectCommand } = require('@aws-sdk/client-s3');
const s3Client = require('../../config/s3');
const StudentSchema = require('../../models/Student').schema;

const router = express.Router();

// use memory storage for multer
const storage = multer.memoryStorage();
const upload = multer({ storage }).single('file');

// bind the Student model to the same DB your studentRoutes use
const Student = mongoose
    .connection
    .useDb('test')                   // <— switch this to whatever DB you’re using
    .model('Student', StudentSchema, 'users');

router.post('/upload', (req, res) => {
    upload(req, res, async (err) => {
        if (err) {
            return res.status(400).json({ message: 'Upload error', error: err.message });
        }
        if (!req.file) {
            return res.status(400).json({ message: 'No file uploaded' });
        }
        const { studentId } = req.body;
        const ext = path.extname(req.file.originalname);
        const filename = `${Date.now()}-${req.file.originalname}`;

        const s3Params = {
            Bucket: process.env.AWS_BUCKET_NAME,
            Key: `student-profiles/${filename}`,
            Body: req.file.buffer,
            ContentType: req.file.mimetype,
            ACL: 'public-read'
        };

        try {
            await s3Client.send(new PutObjectCommand(s3Params));

            // build the correct URL from your bucket + region
            // build the correct URL from your bucket + region
            const region = s3Client.config.region;
            const bucket = process.env.AWS_BUCKET_NAME;
            const url = `https://${bucket}.s3.${region}.amazonaws.com/student-profiles/${filename}`;

            // save it on the **same** DB/collection your GET uses
            const student = await Student.findById(studentId);
            if (!student) {
                return res.status(404).json({ message: 'Student not found' });
            }

            student.profileImageUrl = url;
            await student.save();

            return res.json({ message: 'Upload successful', imageUrl: url });
        } catch (uploadErr) {
            console.error(uploadErr);
            return res.status(500).json({ message: 'S3 upload failed', error: uploadErr.message });
        }
    });
});

module.exports = router;
