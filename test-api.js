// Quick test script to verify OpenAI API key works
import dotenv from 'dotenv';
import OpenAI from 'openai';
import fs from 'fs';

// Load environment variables
dotenv.config();

async function testAPI() {
  console.log('🧪 Testing OpenAI API connection...\n');

  // Check if API key is set
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    console.error('❌ OPENAI_API_KEY not found in .env file');
    process.exit(1);
  }

  console.log('✅ API key found');
  console.log(`   Key starts with: ${apiKey.substring(0, 20)}...`);

  // Initialize OpenAI client
  const openai = new OpenAI({ apiKey });

  try {
    // Test TTS (Text-to-Speech)
    console.log('\n🔊 Testing Text-to-Speech...');
    const mp3 = await openai.audio.speech.create({
      model: 'tts-1',
      voice: 'nova',
      input: 'Hello Stella! This is a test.',
    });

    const buffer = Buffer.from(await mp3.arrayBuffer());
    const testFile = 'test-tts-output.mp3';
    fs.writeFileSync(testFile, buffer);

    console.log(`✅ TTS Success! Audio saved to: ${testFile}`);
    console.log(`   File size: ${buffer.length} bytes`);

    // Test completion (quick validation)
    console.log('\n💬 Testing API connection with a quick request...');
    const completion = await openai.chat.completions.create({
      model: 'gpt-3.5-turbo',
      messages: [{ role: 'user', content: 'Say "API works!" in 2 words' }],
      max_tokens: 10,
    });

    console.log(`✅ API Connection Success!`);
    console.log(`   Response: ${completion.choices[0].message.content}`);

    console.log('\n🎉 All tests passed! Your API key is working correctly.');
    console.log('   You can now build the spelling bee app.\n');

  } catch (error) {
    console.error('\n❌ API Test Failed:', error.message);
    if (error.status === 401) {
      console.error('   → Invalid API key. Please check your .env file.');
    } else if (error.status === 429) {
      console.error('   → Rate limit exceeded. Please wait a moment and try again.');
    } else if (error.status === 403) {
      console.error('   → API key does not have permission. Check your OpenAI account.');
    } else {
      console.error('   → Unexpected error:', error);
    }
    process.exit(1);
  }
}

testAPI();
