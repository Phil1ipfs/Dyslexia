const mongoose = require('mongoose');
require('dotenv').config();

// Connect to MongoDB using the same configuration as the main app
const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log('MongoDB connected successfully');
  } catch (error) {
    console.error('MongoDB connection error:', error);
    process.exit(1);
  }
};

// Migrate student idNumbers to ensure consistent integer type
const migrateStudentIdNumbers = async () => {
  try {
    const db = mongoose.connection.useDb('test');
    const usersCollection = db.collection('users');
    
    console.log('Starting migration of student idNumbers...');
    
    // Find all documents with idNumber field
    const students = await usersCollection.find({ idNumber: { $exists: true } }).toArray();
    
    console.log(`Found ${students.length} students with idNumber field`);
    
    let updatedCount = 0;
    
    for (const student of students) {
      const currentIdNumber = student.idNumber;
      const newIdNumber = Number.isInteger(Number(currentIdNumber)) ? Number(currentIdNumber) : parseInt(currentIdNumber, 10);
      
      // Only update if the value actually changed (different type)
      if (currentIdNumber !== newIdNumber) {
        await usersCollection.updateOne(
          { _id: student._id },
          { $set: { idNumber: newIdNumber } }
        );
        console.log(`Updated student ${student.firstName} ${student.lastName}: ${currentIdNumber} -> ${newIdNumber}`);
        updatedCount++;
      }
    }
    
    console.log(`Migration completed. Updated ${updatedCount} students.`);
    
  } catch (error) {
    console.error('Migration error:', error);
  } finally {
    mongoose.connection.close();
    console.log('Database connection closed');
  }
};

// Run the migration
const runMigration = async () => {
  await connectDB();
  await migrateStudentIdNumbers();
};

runMigration();
