const bcrypt = require('bcryptjs'); // Use bcryptjs if bcrypt doesn't work

const readline = require('readline');

// Setup the readline interface to get user input
const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});

// Function to hash the password
async function hashPassword() {
    // Prompt the user for a password
    rl.question('Enter your password: ', async (password) => {
        try {
            // Hash the password with a salt rounds value (e.g., 10)
            const hashedPassword = await bcrypt.hash(password, 10);
            
            // Output the hashed password
            console.log(`Your hashed password is: ${hashedPassword}`);

            // Close the readline interface
            rl.close();
        } catch (err) {
            console.error('Error hashing password:', err);
            rl.close();
        }
    });
}

// Call the function to hash the password
hashPassword();
