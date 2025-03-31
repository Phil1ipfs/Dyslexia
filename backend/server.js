import expresss from 'express';
import dotev from 'dotenv';
import {connectDB} from './config/db.js';

dotev.config();

const app = expresss(); 
app.use(expresss.json());

app.post("/api/ ", async (req, res) => {
    const home = req.body; 

    if (!home.email || !home.role || !home.profile || !home.preferences) {
        return res.status(400).json({ message:false, message: "Home data is required" });
    }
    
    const newHome = new Home(home);

    try {
        await newHome.save();
        res.status(201).json({ message: true, data: newHome });
    } catch (error) {
        console.error("Error in Create home", error,message);
        res.status(500).json({ success: false, message: "Server error" });
    }
});

app.listen(5000, () => {
    connectDB();
    console.log('Server started at http://localhost:5000');
});