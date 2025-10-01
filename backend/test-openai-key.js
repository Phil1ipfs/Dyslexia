/**
 * Quick test to check if OpenAI API key is valid
 * Run: node test-openai-key.js
 */

require('dotenv').config();
const OpenAI = require('openai').default;

async function testOpenAIKey() {
  console.log('🔍 Testing OpenAI API Key...\n');

  // Check if key exists
  if (!process.env.OPENAI_API_KEY) {
    console.error('❌ OPENAI_API_KEY not found in .env file');
    process.exit(1);
  }

  console.log('✅ API Key found in environment');
  console.log(`Key starts with: ${process.env.OPENAI_API_KEY.substring(0, 20)}...`);

  // Initialize OpenAI client
  const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY
  });

  try {
    console.log('\n🧪 Testing API call with gpt-3.5-turbo...');

    const completion = await openai.chat.completions.create({
      model: 'gpt-3.5-turbo',
      messages: [
        { role: 'system', content: 'You are a helpful assistant.' },
        { role: 'user', content: 'Say "API key is working!" if you can read this.' }
      ],
      max_tokens: 20
    });

    const reply = completion.choices?.[0]?.message?.content || '';

    console.log('✅ SUCCESS! OpenAI API is working!');
    console.log(`Response: ${reply}`);
    console.log('\n🎯 Your OpenAI API key is valid and has credit.');

  } catch (error) {
    console.error('\n❌ FAILED! OpenAI API Error:');
    console.error(`Error Type: ${error.constructor.name}`);
    console.error(`Error Message: ${error.message}`);

    if (error.status === 401) {
      console.error('\n🔑 INVALID API KEY - Your OpenAI API key is invalid or revoked.');
      console.error('   → Generate a new key at: https://platform.openai.com/api-keys');
    } else if (error.status === 429) {
      console.error('\n💰 QUOTA EXCEEDED - You have run out of OpenAI credits.');
      console.error('   → Add credits at: https://platform.openai.com/account/billing');
    } else if (error.code === 'insufficient_quota') {
      console.error('\n💰 INSUFFICIENT QUOTA - Your OpenAI account needs more credits.');
      console.error('   → Add credits at: https://platform.openai.com/account/billing');
    }

    process.exit(1);
  }
}

testOpenAIKey();
