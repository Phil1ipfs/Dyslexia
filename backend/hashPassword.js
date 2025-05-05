// hashPassword.js - A simple utility to hash passwords using bcrypt
// Usage: node hashPassword.js <password>

const bcrypt = require('bcrypt');

async function generateHash(password) {
  try {
    // Use 10 rounds for a good balance of security and performance
    const saltRounds = 10;
    const hash = await bcrypt.hash(password, saltRounds);
    
    return {
      password,
      hash
    };
  } catch (error) {
    console.error('Error generating hash:', error);
    throw error;
  }
}

// Main function
async function main() {
  // Get password from command line argument
  const password = process.argv[2];
  
  if (!password) {
    console.error('Please provide a password as a command line argument');
    console.log('Usage: node hashPassword.js <password>');
    process.exit(1);
  }
  
  try {
    const result = await generateHash(password);
    
    console.log('\n========= PASSWORD HASH GENERATOR =========');
    console.log(`Input Password: ${result.password}`);
    console.log(`Generated Hash: ${result.hash}`);
    console.log('===========================================\n');
    
    console.log('For your .env file or direct database update:');
    console.log(result.hash);
    
    // Add example code for updating a user in MongoDB
    console.log('\n=== Example MongoDB Update Command ===');
    console.log(`db.web_users.updateOne(
  { email: "example@mail.com" },
  { $set: { password: "${result.hash}" } }
)`);
    console.log('=====================================');
    
  } catch (error) {
    console.error('Failed to generate hash:', error);
  }
}

main().catch(console.error);