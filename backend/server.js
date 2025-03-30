import expresss from 'express';
import dotev from 'dotenv';
import {connectDB} from './config/db.js';

dotev.config();

const app = expresss(); 

app.get("/HomePage", (req, res) => {});

app.listen(5000, () => {
    connectDB();
    console.log('Server started at http://localhost:5000');
});