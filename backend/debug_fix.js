const mongoose = require('mongoose');
const CategoryResultsService = require('./services/Teachers/CategoryResultsService');

async function debugFix() {
  try {
    // Connect to MongoDB
    await mongoose.connect('mongodb://localhost:27017/test', {
      useNewUrlParser: true,
      useUnifiedTopology: true
    });

    console.log('Connected to MongoDB');

    // Test the force fix
    const result = await CategoryResultsService.forceFixStudentOverallScore(202533333);
    console.log('Force fix result:', JSON.stringify(result, null, 2));

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await mongoose.disconnect();
    process.exit(0);
  }
}

debugFix();