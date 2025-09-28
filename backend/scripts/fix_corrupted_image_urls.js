const mongoose = require('mongoose');
require('dotenv').config();

// Connect to MongoDB
const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/dyslexia', {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log('✅ Connected to MongoDB');
  } catch (error) {
    console.error('❌ MongoDB connection error:', error);
    process.exit(1);
  }
};

// Function to fix corrupted image URLs
const fixCorruptedImageUrls = async () => {
  try {
    const db = mongoose.connection.useDb('test');
    const interventionAssessmentsCollection = db.collection('intervention_assessments');
    
    console.log('🔍 Searching for intervention assessments with corrupted image URLs...');
    
    // Find intervention assessments with corrupted image URLs
    const corruptedAssessments = await interventionAssessmentsCollection.find({
      'questions.questionImage': {
        $regex: /[â¯%E2%80%AF]/
      }
    }).toArray();
    
    console.log(`📊 Found ${corruptedAssessments.length} intervention assessments with corrupted image URLs`);
    
    for (const assessment of corruptedAssessments) {
      console.log(`\n🔧 Fixing assessment: ${assessment._id}`);
      console.log(`   Category: ${assessment.category}`);
      console.log(`   Student ID: ${assessment.studentId}`);
      
      let hasChanges = false;
      const updatedQuestions = assessment.questions.map(question => {
        if (question.questionImage && question.questionImage.match(/[â¯%E2%80%AF]/)) {
          console.log(`   ❌ Corrupted URL: ${question.questionImage}`);
          
          // Fix the corrupted URL by replacing the corrupted characters
          let fixedUrl = question.questionImage
            .replace(/%E2%80%AF/g, '') // Remove URL-encoded â¯
            .replace(/â¯/g, '') // Remove â¯ characters
            .replace(/Screenshot\+/g, 'Screenshot-') // Replace + with - in Screenshot
            .replace(/\+/g, '-') // Replace remaining + with -
            .replace(/--+/g, '-') // Replace multiple dashes with single dash
            .replace(/^-+|-+$/g, ''); // Remove leading/trailing dashes
          
          console.log(`   ✅ Fixed URL: ${fixedUrl}`);
          
          hasChanges = true;
          return {
            ...question,
            questionImage: fixedUrl
          };
        }
        return question;
      });
      
      if (hasChanges) {
        // Update the assessment with fixed URLs
        await interventionAssessmentsCollection.updateOne(
          { _id: assessment._id },
          { $set: { questions: updatedQuestions } }
        );
        console.log(`   ✅ Updated assessment ${assessment._id}`);
      } else {
        console.log(`   ℹ️  No changes needed for assessment ${assessment._id}`);
      }
    }
    
    console.log('\n🎉 Finished fixing corrupted image URLs!');
    
  } catch (error) {
    console.error('❌ Error fixing corrupted image URLs:', error);
  }
};

// Main execution
const main = async () => {
  await connectDB();
  await fixCorruptedImageUrls();
  await mongoose.connection.close();
  console.log('✅ Database connection closed');
  process.exit(0);
};

// Run the script
main().catch(error => {
  console.error('❌ Script failed:', error);
  process.exit(1);
});
