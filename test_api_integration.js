// Manual API test to trigger intervention integration
const axios = require('axios');

async function testInterventionIntegration() {
  try {
    // Test with your actual intervention result ID
    const interventionResultId = '68d7b5b2d4c128d501962ba3';
    const studentId = 202533333;

    console.log('🧪 Testing intervention integration with:');
    console.log('- Intervention Result ID:', interventionResultId);
    console.log('- Student ID:', studentId);

    // Check if this intervention result exists in category_results
    const categoryCheckResponse = await axios.get(`http://localhost:5001/api/category-results/student/${studentId}`);
    console.log('\\n📊 Current category_results:');

    if (categoryCheckResponse.data && categoryCheckResponse.data.success) {
      const categoryResults = categoryCheckResponse.data.data;
      categoryResults.forEach(record => {
        console.log(`\\n📋 Reading Level: ${record.readingLevel}`);
        record.categories.forEach(cat => {
          if (cat.categoryName === 'Alphabet Knowledge') {
            console.log(`  📝 ${cat.categoryName}:`);
            console.log(`    - Score: ${cat.score}%`);
            console.log(`    - Passed: ${cat.isPassed}`);
            console.log(`    - Intervention Attempts: ${cat.interventionAttempts || 0}`);
            console.log(`    - Intervention Completed: ${cat.interventionCompleted || false}`);
            console.log(`    - History Length: ${cat.interventionHistory?.length || 0}`);

            if (cat.interventionHistory && cat.interventionHistory.length > 0) {
              console.log(`    - Latest Attempt: Score ${cat.interventionHistory[cat.interventionHistory.length - 1].score}%, Passed: ${cat.interventionHistory[cat.interventionHistory.length - 1].isPassed}`);
            }
          }
        });
      });
    }

    // Try to find if there's an intervention processing endpoint
    console.log('\\n🔧 Checking for intervention processing endpoint...');

    // Check intervention monitoring status
    try {
      const monitoringResponse = await axios.get('http://localhost:5001/api/intervention-monitoring/status');
      console.log('📊 Monitoring Status:', monitoringResponse.data);
    } catch (error) {
      console.log('⚠️ Monitoring endpoint not available');
    }

    console.log('\\n✅ Test completed');

  } catch (error) {
    console.error('❌ Error:', error.response?.data || error.message);
  }
}

testInterventionIntegration();