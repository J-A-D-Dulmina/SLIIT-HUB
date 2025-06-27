#!/usr/bin/env node
/**
 * Test script to diagnose AI system issues
 */

const axios = require('axios');

const SERVER_URL = 'http://localhost:5000';
const PYTHON_SERVICE_URL = 'http://localhost:5001';
const VIDEO_ID = '1750982251814-685619044';

async function testSystem() {
  console.log('🔍 Testing AI System...\n');

  // Test 1: Node.js Server
  console.log('1️⃣ Testing Node.js Server...');
  try {
    const serverResponse = await axios.get(`${SERVER_URL}/api/ai/health`);
    console.log('✅ Node.js server is running');
    console.log('   Response:', serverResponse.data);
  } catch (error) {
    console.log('❌ Node.js server error:', error.message);
    return;
  }

  // Test 2: Python Service
  console.log('\n2️⃣ Testing Python AI Service...');
  try {
    const pythonResponse = await axios.get(`${PYTHON_SERVICE_URL}/health`);
    console.log('✅ Python AI service is running');
    console.log('   Response:', pythonResponse.data);
  } catch (error) {
    console.log('❌ Python AI service error:', error.message);
    console.log('   Make sure to start the Python service: cd python_services && python api.py');
    return;
  }

  // Test 3: Video File Access
  console.log('\n3️⃣ Testing Video File Access...');
  try {
    const videoResponse = await axios.get(`${SERVER_URL}/api/ai/test-video/${VIDEO_ID}`);
    console.log('✅ Video file is accessible');
    console.log('   Response:', videoResponse.data);
  } catch (error) {
    console.log('❌ Video file access error:', error.message);
    if (error.response) {
      console.log('   Details:', error.response.data);
    }
    return;
  }

  // Test 4: Comprehensive Test
  console.log('\n4️⃣ Running Comprehensive Test...');
  try {
    const comprehensiveResponse = await axios.get(`${SERVER_URL}/api/ai/comprehensive-test/${VIDEO_ID}`);
    console.log('✅ Comprehensive test completed');
    console.log('   Results:', JSON.stringify(comprehensiveResponse.data, null, 2));
  } catch (error) {
    console.log('❌ Comprehensive test error:', error.message);
    if (error.response) {
      console.log('   Details:', error.response.data);
    }
  }

  // Test 5: Try AI Summary Generation
  console.log('\n5️⃣ Testing AI Summary Generation...');
  try {
    const summaryResponse = await axios.post(`${SERVER_URL}/api/ai/generate-summary`, {
      videoId: VIDEO_ID,
      videoTitle: 'Test Video'
    }, {
      timeout: 60000 // 1 minute timeout
    });
    console.log('✅ AI summary generation successful');
    console.log('   Summary length:', summaryResponse.data.summary?.length || 0, 'characters');
  } catch (error) {
    console.log('❌ AI summary generation error:', error.message);
    if (error.response) {
      console.log('   Status:', error.response.status);
      console.log('   Details:', error.response.data);
    }
  }

  console.log('\n🎯 Test completed!');
}

// Run the test
testSystem().catch(console.error); 