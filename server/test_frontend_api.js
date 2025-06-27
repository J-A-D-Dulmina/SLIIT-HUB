#!/usr/bin/env node
/**
 * Test script that mimics the frontend API call exactly
 */

const axios = require('axios');

const SERVER_URL = 'http://localhost:5000';
const VIDEO_ID = '1750982251814-685619044';

async function testFrontendAPI() {
  console.log('🔍 Testing frontend API call...\n');

  try {
    console.log('📤 Sending request to:', `${SERVER_URL}/api/ai/generate-summary`);
    console.log('📤 Request body:', { videoId: VIDEO_ID, videoTitle: 'Test Video' });

    const response = await axios.post(`${SERVER_URL}/api/ai/generate-summary`, {
      videoId: VIDEO_ID,
      videoTitle: 'Test Video'
    }, {
      headers: {
        'Content-Type': 'application/json',
      },
      timeout: 60000
    });

    console.log('✅ Success!');
    console.log('📥 Response status:', response.status);
    console.log('📥 Response data:', response.data);

  } catch (error) {
    console.log('❌ Error occurred:');
    console.log('   Message:', error.message);
    
    if (error.response) {
      console.log('   Status:', error.response.status);
      console.log('   Data:', error.response.data);
    }
  }
}

testFrontendAPI(); 