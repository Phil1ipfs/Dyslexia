const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');

// Get all teachers
router.get('/teachers', async (req, res) => {
    try {
        const teachersDb = mongoose.connection.useDb('teachers');
        const teachers = await teachersDb.collection('profile').find({}).toArray();
        
        res.json({
            success: true,
            data: teachers
        });
    } catch (error) {
        console.error('Error fetching teachers:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching teachers',
            error: error.message
        });
    }
});

// Get all parents
router.get('/parents', async (req, res) => {
    try {
        const parentDb = mongoose.connection.useDb('parent');
        const parents = await parentDb.collection('parent_profile').find({}).toArray();
        
        res.json({
            success: true,
            data: parents
        });
    } catch (error) {
        console.error('Error fetching parents:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching parents',
            error: error.message
        });
    }
});

// Get teacher by ID
router.get('/teachers/:id', async (req, res) => {
    try {
        const teachersDb = mongoose.connection.useDb('teachers');
        const teacher = await teachersDb.collection('profile').findOne({
            _id: new mongoose.Types.ObjectId(req.params.id)
        });

        if (!teacher) {
            return res.status(404).json({
                success: false,
                message: 'Teacher not found'
            });
        }

        res.json({
            success: true,
            data: teacher
        });
    } catch (error) {
        console.error('Error fetching teacher:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching teacher',
            error: error.message
        });
    }
});

// Get all students
router.get('/students', async (req, res) => {
    console.log('Received request for students');
    try {
        // Connect to the test database
        const db = mongoose.connection.useDb('test');
        console.log('Connected to test database');

        // Get the users collection
        const collection = db.collection('users');
        console.log('Accessing users collection');

        // Fetch all documents
        const students = await collection.find({}).toArray();
        console.log(`Found ${students.length} students`);

        // Send response
        res.json({
            success: true,
            data: students
        });
    } catch (error) {
        console.error('Error fetching students:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching students',
            error: error.message
        });
    }
});

// Test route to verify the router is working
router.get('/test', (req, res) => {
    res.json({ message: 'Teacher routes are working' });
});

module.exports = router; 