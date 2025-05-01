const express   = require('express');
const cors      = require('cors');
require('dotenv').config();
const connectDB = require('./config/db');

const app = express();               
app.use(cors());
app.use(express.json());

connectDB();                          

// mount routes
app.use('/api/teachers', require('./routes/Teachers/teacherProfile'));

app.get('/', (_req, res) => res.send('API is running...'));

const PORT = process.env.PORT || 5001;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
