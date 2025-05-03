const express = require('express');
const cors    = require('cors');
require('dotenv').config();
const connectDB = require('./config/teacher/db');

const app = express();
app.use(cors());
app.use(express.json());
connectDB();

app.use('/api/teachers', require('./routes/Teachers/uploadFile'));
app.use('/api/teachers', require('./routes/Teachers/teacherProfile'));
app.use('/api/chatbot',  require('./routes/Teachers/chatbot'));

app.get('/', (_req, res) => res.send('API is running…'));


const PORT = process.env.PORT || 5002;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
