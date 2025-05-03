// backend/routes/loginRoutes.js
const express = require('express');
const { login } = require('../controllers/loginController');
const router = express.Router();

// Define the POST route for login
router.post('/login', login);  // This defines the /api/login route

module.exports = router;
