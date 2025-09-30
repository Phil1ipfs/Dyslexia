const mongoose = require('mongoose');
require('dotenv').config();

async function testMongoDB() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGO_URI);
    console.log('✅ Connected to MongoDB Atlas');

    // Access users_web database (the correct one for authentication)
    const usersDb = mongoose.connection.useDb('users_web');
    const usersCollection = usersDb.collection('users');

    // Count total users
    const totalUsers = await usersCollection.countDocuments();
    console.log(`\nTotal users in users_web.users: ${totalUsers}`);

    // Find ALL users to see what roles they have
    const allUsers = await usersCollection.find({}).toArray();
    console.log(`\nAll users in users_web.users:`);
    console.log('='.repeat(60));

    allUsers.forEach((user, index) => {
      console.log(`\nUser #${index + 1}:`);
      console.log(`  Email: ${user.email}`);
      console.log(`  Name: ${user.firstName} ${user.lastName}`);
      console.log(`  ID Number: ${user.idNumber || 'N/A'}`);
      console.log(`  Roles: ${JSON.stringify(user.roles)}`);
      console.log(`  Has password field: ${!!user.password}`);
      console.log(`  Has passwordHash field: ${!!user.passwordHash}`);

      // Show if password is properly hashed
      if (user.password) {
        console.log(`  Password starts with: ${user.password.substring(0, 7)}...`);
      }
      if (user.passwordHash) {
        console.log(`  PasswordHash starts with: ${user.passwordHash.substring(0, 7)}...`);
      }
    });

    // Check the roles collection to see what these role IDs mean
    console.log('\n' + '='.repeat(60));
    const rolesCollection = usersDb.collection('roles');
    const allRoles = await rolesCollection.find({}).toArray();
    console.log('\nRoles collection:');
    allRoles.forEach(role => {
      console.log(`  ${role._id}: ${role.name}`);
    });

    console.log('\n' + '='.repeat(60));

    await mongoose.disconnect();
    console.log('\n✅ Disconnected from MongoDB');

  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

testMongoDB();