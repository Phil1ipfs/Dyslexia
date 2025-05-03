// backend/server.js  – CommonJS edition
const express = require('express');
const cors = require('cors');
require('dotenv').config();
const connectDB = require('./config/teacher/db');      

// route files
const teacherProfileRoutes = require('./routes/Teachers/teacherProfile');
const chatbotRoutes        = require('./routes/Teachers/chatbot');

const app = express();
app.use(cors());
app.use(express.json());

connectDB();

app.use('/api/teachers', teacherProfileRoutes);
app.use('/api/chatbot',  chatbotRoutes);

app.get('/', (_req, res) => res.send('API is running...'));

const PORT = process.env.PORT || 5002;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
