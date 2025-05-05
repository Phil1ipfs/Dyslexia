// verifyPassword.js - Utility to verify if a password matches a hash
// Usage: node verifyPassword.js <hash> <password>

const bcrypt = require('bcrypt');

async function verifyPassword(hash, password) {
  try {
    // Use bcrypt to compare the password with the hash
    const isMatch = await bcrypt.compare(password, hash);
    
    return {
      password,
      hash,
      isMatch
    };
  } catch (error) {
    console.error('Error verifying password:', error);
    return {
      password,
      hash,
      isMatch: false,
      error: error.message
    };
  }
}

// Main function
async function main() {
  // Get hash and password from command line arguments
  const hash = process.argv[2];
  const password = process.argv[3];
  
  if (!hash || !password) {
    console.error('Please provide both hash and password as command line arguments');
    console.log('Usage: node verifyPassword.js <hash> <password>');
    process.exit(1);
  }
  
  try {
    const result = await verifyPassword(hash, password);
    
    console.log('\n========= PASSWORD VERIFICATION =========');
    console.log(`Password: ${result.password}`);
    console.log(`Hash: ${result.hash}`);
    console.log(`Match: ${result.isMatch ? '✅ YES' : '❌ NO'}`);
    
    if (result.error) {
      console.log(`Error: ${result.error}`);
    }
    
    console.log('=========================================\n');
    
  } catch (error) {
    console.error('Failed to verify password:', error);
  }
}

main().catch(console.error);