#!/usr/bin/env node
/**
 * Test script to diagnose AI system issues
 */

const axios = require('axios');
const fs = require('fs');
const path = require('path');

const SERVER_URL = 'http://localhost:5000';
const PYTHON_SERVICE_URL = 'http://localhost:8000';
const VIDEO_PATH = path.join(__dirname, 'uploads', 'videos', 'test-video.mp4');

async function testNodeServer() {
  try {
    const response = await axios.get(`${SERVER_URL}/api/meetings`);
    console.log('Node.js server is running');
    return true;
  } catch (error) {
    console.log('Node.js server error:', error.message);
    return false;
  }
}

async function testPythonService() {
  try {
    const response = await axios.get(`${PYTHON_SERVICE_URL}/health`);
    console.log('Python AI service is running');
    return true;
  } catch (error) {
    console.log('Python AI service error:', error.message);
    return false;
  }
}

async function testVideoFile() {
  try {
    if (fs.existsSync(VIDEO_PATH)) {
      console.log('Video file is accessible');
      return true;
    } else {
      console.log('Video file not found');
      return false;
    }
  } catch (error) {
    console.log('Video file access error:', error.message);
    return false;
  }
}

async function testComprehensiveSystem() {
  try {
    const response = await axios.post(`${SERVER_URL}/api/ai/generate-summary`, {
      videoId: 'test-video-id',
      videoTitle: 'Test Video'
    });
    console.log('Comprehensive test completed');
    return true;
  } catch (error) {
    console.log('Comprehensive test error:', error.message);
    return false;
  }
}

async function testAISummaryGeneration() {
  try {
    const response = await axios.post(`${SERVER_URL}/api/ai/generate-summary`, {
      videoId: 'test-video-id',
      videoTitle: 'Test Video for AI Summary'
    }, {
      timeout: 30000
    });
    
    console.log('AI summary generation successful');
    console.log('Summary:', response.data.summary);
    return true;
  } catch (error) {
    console.log('AI summary generation error:', error.message);
    return false;
  }
}

async function runAllTests() {
  console.log('Testing AI System...\n');
  
  const tests = [
    { name: 'Node.js Server', test: testNodeServer },
    { name: 'Python AI Service', test: testPythonService },
    { name: 'Video File Access', test: testVideoFile },
    { name: 'Comprehensive System', test: testComprehensiveSystem },
    { name: 'AI Summary Generation', test: testAISummaryGeneration }
  ];
  
  for (const test of tests) {
    console.log(`\n--- ${test.name} ---`);
    await test.test();
  }
  
  console.log('\n=== All tests completed ===');
}

runAllTests(); 