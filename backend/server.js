// backend/server.js
const express = require('express');
const cors = require('cors');
require('dotenv').config();
const connectDB = require('./config/teacher/db');
const app = express();

// Enhanced logging middleware to debug route issues
const requestLogger = (req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
  next();
};

// Apply middlewares
app.use(cors());
app.use(express.json());
app.use(requestLogger);

// Connect to MongoDB
connectDB();

// Test route to verify server is running
app.get('/api/test', (req, res) => {
  res.json({ message: 'API is working!' });
});

// Apply routes with explicit logging
console.log('Registering routes for /api/teachers');
app.use('/api/teachers', require('./routes/Teachers/teacherProfile')); // 1st
// app.use('/api/teachers', require('./routes/Teachers/uploadFile'));     // 2nd

app.use('/api/chatbot', require('./routes/Teachers/chatbot'));

// Simple home route
app.get('/', (_req, res) => res.send('API is running…'));

// List all registered routes for debugging
app._router.stack.forEach((middleware) => {
  if(middleware.route) { // Routes registered directly on the app
    console.log(`Route: ${Object.keys(middleware.route.methods).join(',')} ${middleware.route.path}`);
  } else if(middleware.name === 'router') { // Router middleware
    middleware.handle.stack.forEach((handler) => {
      if(handler.route) {
        const path = handler.route.path;
        const methods = Object.keys(handler.route.methods).join(',');
        console.log(`Route: ${methods} ${middleware.regexp} ${path}`);
      }
    });
  }
});

// Handle 404 errors
app.use((req, res) => {
  console.log(`[404] Route not found: ${req.method} ${req.url}`);
  res.status(404).json({ error: 'Route not found' });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(`[ERROR] ${err.message}`);
  res.status(500).json({ error: 'Server error', message: err.message });
});

// Start server on the specified port
const PORT = process.env.PORT || 5002;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));