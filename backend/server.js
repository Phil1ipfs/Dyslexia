import expresss from 'express';
import dotev from 'dotenv';
import {connectDB} from './config/db.js';

dotev.config();

const app = expresss(); 

app.post("/HomePages", async (req, res) => {
    const home = req.body; 

    if (!home.email || !home.role || !home.profile || !home.preferences) {
        return res.status(400).json({ message: 'Home data is required' });
    }

});

app.listen(5000, () => {
    connectDB();
    console.log('Server started at http://localhost:5000');
});