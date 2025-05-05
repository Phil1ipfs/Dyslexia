// routes/auth/authRoutes.js
const express = require('express');
const router = express.Router();

// Import the controller
const authController = require('../../controllers/authController');

// Define the POST route for login
router.post('/login', authController.login);

// Export the router
module.exports = router;