const PrescriptionOnlyService = require('./services/Teachers/PrescriptiveAnalytics/prescriptionOnlyService');
const CategoryResult = require('./models/Teachers/ManageProgress/categoryResultsModel');
const StudentResponse = require('./models/Teachers/ManageProgress/studentResponseModel');

async function testReadingLevelDataFix() {
  try {
    console.log('🧪 [TESTING] Reading level data fix...');

    // Find the developing level category result for student 202533333
    const categoryResult = await CategoryResult.findOne({
      studentId: 202533333,
      readingLevel: 'Developing'
    }).sort({ createdAt: -1 });

    if (!categoryResult) {
      console.log('❌ No developing level category result found');
      return;
    }

    console.log('✅ Found category result:', {
      studentId: categoryResult.studentId,
      readingLevel: categoryResult.readingLevel,
      categories: categoryResult.categories.map(c => ({
        name: c.categoryName,
        score: c.score,
        completed: c.isCompleted,
        passed: c.isPassed
      }))
    });

    // Check what student responses exist for this reading level
    const responses = await StudentResponse.find({
      studentId: 202533333,
      readingLevel: 'Developing'
    }).sort({ answeredAt: 1 });

    console.log('📊 Student responses for Developing level:');
    console.log('Total responses:', responses.length);

    const responsesByCategory = {};
    responses.forEach(response => {
      if (!responsesByCategory[response.category]) {
        responsesByCategory[response.category] = [];
      }
      responsesByCategory[response.category].push(response);
    });

    Object.entries(responsesByCategory).forEach(([category, categoryResponses]) => {
      console.log(`  ${category}: ${categoryResponses.length} responses`);
    });

    // Generate a new prescriptive analysis with current responses
    console.log('🔄 Generating new prescriptive analysis...');
    const prescriptionService = new PrescriptionOnlyService();
    const result = await prescriptionService.generatePrescription(categoryResult._id);

    console.log('✅ Analysis generated:', {
      analysisId: result.analysis._id,
      studentId: result.analysis.studentId,
      readingLevel: result.analysis.readingLevel,
      errorPatternsCategories: Object.keys(result.analysis.errorPatterns || {}),
      skillMasteryCategories: Object.keys(result.analysis.skillMastery || {})
    });

    // Check if Phonological Awareness has any response history (should be empty)
    const phonologicalMastery = result.analysis.skillMastery['Phonological Awareness'];
    if (phonologicalMastery && phonologicalMastery.responseHistory) {
      console.log('📊 Phonological Awareness response history:');
      console.log('Count:', phonologicalMastery.responseHistory.length);
      if (phonologicalMastery.responseHistory.length > 0) {
        console.log('❌ ERROR: Should not have response history for category not attempted at this reading level');
        console.log('First response:', phonologicalMastery.responseHistory[0]);
      } else {
        console.log('✅ SUCCESS: No response history for unattempted category (correct placeholder behavior)');
      }
    } else {
      console.log('✅ SUCCESS: No response history object for unattempted category');
    }

    process.exit(0);
  } catch (error) {
    console.error('❌ Test failed:', error.message);
    console.error('Stack:', error.stack);
    process.exit(1);
  }
}

testReadingLevelDataFix();