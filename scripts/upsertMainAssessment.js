const mongoose = require('mongoose');
require('dotenv').config();
const fs = require('fs');
const path = require('path');
const MainAssessment = require('../backend/models/Teachers/ManageProgress/mainAssessmentModel');

async function run() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('Connected to MongoDB');

    const seedPath = path.join(__dirname, '../seed_main_assessment.json');
    if (!fs.existsSync(seedPath)) {
      console.error(`Error: Seed file not found at ${seedPath}`);
      process.exit(1);
    }

    const seed = JSON.parse(fs.readFileSync(seedPath, 'utf8'));
    console.log(`Found ${seed.length} documents to process`);

    for (const doc of seed) {
      // normalise exactly like the service does
      const category = doc.category.toLowerCase().replace(/\s+/g, '_');
      const readingLevel = doc.readingLevel.toLowerCase().replace(/\s+/g, '_');

      // ensure every question has _id and order
      const incoming = doc.questions.map((q, idx) => ({
        ...q,
        order: q.order || (idx + 1),
        _id: q._id ? new mongoose.Types.ObjectId(q._id) : new mongoose.Types.ObjectId()
      }));

      // upsert and merge – keep existing questions, add new ones that aren't duplicates
      await MainAssessment.updateOne(
        { category, readingLevel, isActive: true },
        {
          $setOnInsert: {
            category,
            readingLevel,
            isActive: true,
            createdAt: new Date()
          },
          $set: { updatedAt: new Date() },
          // add new questions whose _id is not already present
          $addToSet: { questions: { $each: incoming } }
        },
        { upsert: true }
      );
      
      console.log(`Processed ${category} / ${readingLevel} - ${incoming.length} questions`);
    }

    console.log('✅ Upsert complete – existing data preserved');
    await mongoose.disconnect();
    console.log('Disconnected from MongoDB');
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

run(); 