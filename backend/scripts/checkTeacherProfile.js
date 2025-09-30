const mongoose = require('mongoose');
require('dotenv').config();

async function checkTeacherProfile() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGO_URI);
    console.log('✅ Connected to MongoDB');

    // Get the teachers database
    const teacherDb = mongoose.connection.useDb('teachers');
    const profileCollection = teacherDb.collection('profile');

    console.log('\n📊 Teacher Profile Collection Analysis:');

    // Get all profiles
    const allProfiles = await profileCollection.find({}).toArray();
    console.log(`Found ${allProfiles.length} teacher profiles:`);

    allProfiles.forEach((profile, index) => {
      console.log(`\n${index + 1}. Profile ID: ${profile._id}`);
      console.log(`   Name: ${profile.firstName} ${profile.lastName}`);
      console.log(`   Email: ${profile.email}`);
      console.log(`   UserId: ${profile.userId}`);
      console.log(`   UserId type: ${typeof profile.userId}`);
    });

    // Get the users_web database to check user records
    console.log('\n👤 Users_web Database Analysis:');
    const usersDb = mongoose.connection.useDb('users_web');
    const usersCollection = usersDb.collection('users');

    const users = await usersCollection.find({}).limit(10).toArray();
    console.log(`Found ${users.length} users (showing first 10):`);

    users.forEach((user, index) => {
      console.log(`\n${index + 1}. User ID: ${user._id}`);
      console.log(`   Email: ${user.email}`);
      console.log(`   Roles: ${user.roles}`);
    });

    // Check for matches
    console.log('\n🔍 Matching Analysis:');
    for (const profile of allProfiles) {
      // Check by userId
      const userById = await usersCollection.findOne({ _id: profile.userId });

      // Check by email
      const userByEmail = await usersCollection.findOne({ email: profile.email });

      console.log(`\n📋 Profile: ${profile.firstName} ${profile.lastName} (${profile._id})`);
      console.log(`   By userId: ${userById ? '✅ Found' : '❌ Not found'}`);
      console.log(`   By email: ${userByEmail ? '✅ Found' : '❌ Not found'}`);

      if (userById) {
        console.log(`   User ID Match: ${userById._id} (email: ${userById.email})`);
      }
      if (userByEmail && userByEmail._id.toString() !== userById?._id.toString()) {
        console.log(`   Email Match: ${userByEmail._id} (email: ${userByEmail.email})`);
      }
    }

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await mongoose.disconnect();
    console.log('\n✅ Disconnected from MongoDB');
  }
}

checkTeacherProfile();