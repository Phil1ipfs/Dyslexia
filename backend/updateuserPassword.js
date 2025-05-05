// updateUserPassword.js - Utility to update user passwords in MongoDB
// Usage: node updateUserPassword.js <email> <password>

require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcrypt');

// MongoDB connection setup
async function connectToMongoDB() {
  try {
    const uri = process.env.MONGO_URI;
    
    if (!uri) {
      throw new Error('MONGO_URI not found in environment variables');
    }
    
    console.log('Connecting to MongoDB...');
    await mongoose.connect(uri, {
      dbName: 'test'  // Use the database where web_users is located
    });
    
    console.log('✅ MongoDB Connected');
    return true;
  } catch (error) {
    console.error('Failed to connect to MongoDB:', error);
    return false;
  }
}

// User schema
const userSchema = new mongoose.Schema({
  email: String,
  password: String,
  roles: [String]
}, { 
  collection: 'web_users' 
});

async function updateUserPassword(email, plainPassword) {
  try {
    // Create User model
    const User = mongoose.model('User', userSchema);
    
    // Find the user
    const user = await User.findOne({ email });
    
    if (!user) {
      console.error(`User with email ${email} not found`);
      return false;
    }
    
    console.log(`Found user: ${user.email}`);
    console.log(`Current roles: ${user.roles.join(', ')}`);
    
    // Hash the password
    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(plainPassword, saltRounds);
    
    // Update user's password
    user.password = hashedPassword;
    await user.save();
    
    console.log('✅ Password updated successfully');
    return {
      email: user.email,
      roles: user.roles,
      hashedPassword
    };
  } catch (error) {
    console.error('Error updating password:', error);
    return false;
  }
}

// Main function
async function main() {
  // Get email and password from command line arguments
  const email = process.argv[2];
  const password = process.argv[3];
  
  if (!email || !password) {
    console.error('Please provide both email and password as command line arguments');
    console.log('Usage: node updateUserPassword.js <email> <password>');
    process.exit(1);
  }
  
  // Connect to MongoDB
  const connected = await connectToMongoDB();
  
  if (!connected) {
    console.error('Failed to connect to database. Exiting...');
    process.exit(1);
  }
  
  try {
    // Update the user's password
    const result = await updateUserPassword(email, password);
    
    if (result) {
      console.log('\n========= PASSWORD UPDATE SUCCESSFUL =========');
      console.log(`User: ${result.email}`);
      console.log(`Roles: ${result.roles.join(', ')}`);
      console.log(`New Password Hash: ${result.hashedPassword}`);
      console.log('==============================================\n');
    }
  } catch (error) {
    console.error('Failed to update password:', error);
  } finally {
    // Disconnect from MongoDB
    await mongoose.disconnect();
    console.log('Disconnected from MongoDB');
  }
}

// Run the main function
main().catch(console.error);