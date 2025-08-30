#!/usr/bin/env node
/**
 * Test script that mimics the frontend API call exactly
 */

const axios = require('axios');

const SERVER_URL = 'http://localhost:5000';
const VIDEO_ID = '1750982251814-685619044';

async function testFrontendAPI() {
  try {
    console.log('Testing frontend API call...\n');
    
    // Test the meetings endpoint
    const response = await axios.get('http://localhost:5000/api/meetings', {
      withCredentials: true
    });
    
    console.log('Success!');
    console.log('Response status:', response.status);
    console.log('Number of meetings:', response.data.data?.length || 0);
    
  } catch (error) {
    console.log('Error occurred:');
    console.log('Status:', error.response?.status);
    console.log('Message:', error.response?.data?.message || error.message);
  }
}

testFrontendAPI(); 