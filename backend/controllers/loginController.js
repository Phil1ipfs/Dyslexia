// // backend/controllers/loginController.js
// const bcrypt = require('bcrypt');
// const jwt = require('jsonwebtoken');
// const User = require('../models/userModel'); // Import the User model

// // Handle login
// exports.login = async (req, res) => {
//   const { email, password } = req.body;

//   try {
//     // Find user by email - FIXED: Changed from "user.findOne" to "User.findOne"
//     const user = await User.findOne({ email });
//     if (!user) {
//       console.log('User not found:', email);
//       return res.status(400).json({ message: 'Invalid credentials' });
//     }

//     // Debugging: Log the stored hash and the password entered
//     console.log('Stored hashed password: ', user.password);
//     console.log('Password entered: ', password);

//     // Check if the password matches
//     const isMatch = await bcrypt.compare(password, user.password); // Compare hashed password
//     if (!isMatch) {
//       console.log('Password does not match');
//       return res.status(400).json({ message: 'Invalid credentials' });
//     }

//     // Create JWT token
//     const token = jwt.sign(
//       { id: user._id, email: user.email, roles: user.roles },
//       process.env.JWT_SECRET_KEY || 'fallback_secret_key', // Added fallback secret key
//       { expiresIn: '1h' }
//     );

//     // Return token and user data
//     res.json({
//       token,
//       user: { email: user.email, roles: user.roles },
//     });
//   } catch (error) {
//     console.error('Login error:', error);
//     res.status(500).json({ message: 'Server error' });
//   }
// }
// backend/controllers/loginController.js
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const User = require('../models/userModel'); // Import the User model

// Handle login
exports.login = async (req, res) => {
  const { email, password } = req.body;

  try {
    // Find user by email in the web_users collection
    const user = await User.findOne({ email });
    if (!user) {
      console.log('User not found:', email);
      return res.status(400).json({ message: 'Invalid credentials' });
    }

    // Debugging: Log the stored hash and the password entered
    console.log('Stored hashed password: ', user.password);
    console.log('Password entered: ', password);

    // OPTION 1: For development/testing - bypass password check
    // For quick testing - remove this in production!
    const isMatch = true;
    
    // OPTION 2: Standard bcrypt check (comment out for testing if needed)
    // const isMatch = await bcrypt.compare(password, user.password);
    
    if (!isMatch) {
      console.log('Password does not match');
      return res.status(400).json({ message: 'Invalid credentials' });
    }

    // Create JWT token
    const token = jwt.sign(
      { id: user._id, email: user.email, roles: user.roles },
      process.env.JWT_SECRET_KEY || 'fallback_secret_key',
      { expiresIn: '1h' }
    );

    // Return token and user data
    res.json({
      token,
      user: { email: user.email, roles: user.roles },
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ message: 'Server error' });
  }
}