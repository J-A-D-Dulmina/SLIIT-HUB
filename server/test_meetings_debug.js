const axios = require('axios');

// Test the meetings endpoint
async function testMeetings() {
  try {
    console.log('Testing meetings endpoint...');
    
    // First, let's try to get meetings without authentication
    console.log('\n1. Testing without authentication:');
    try {
      const response = await axios.get('http://localhost:5000/api/meetings');
      console.log('Response:', response.data);
    } catch (error) {
      console.log('Expected error (no auth):', error.response?.data || error.message);
    }

    // Now let's try with authentication
    console.log('\n2. Testing with authentication:');
    
    // Login first
    const loginResponse = await axios.post('http://localhost:5000/api/users/login', {
      email: 'jaddulmina@gmail.com',
      password: 'password123'
    }, {
      withCredentials: true
    });
    
    console.log('Login response:', loginResponse.data);
    
    // Get meetings with credentials
    const meetingsResponse = await axios.get('http://localhost:5000/api/meetings', {
      withCredentials: true
    });
    
    console.log('Meetings response:', meetingsResponse.data);
    
    // Also try my-meetings endpoint
    console.log('\n3. Testing my-meetings endpoint:');
    const myMeetingsResponse = await axios.get('http://localhost:5000/api/meetings/my-meetings', {
      withCredentials: true
    });
    
    console.log('My meetings response:', myMeetingsResponse.data);
    
  } catch (error) {
    console.error('Error:', error.response?.data || error.message);
  }
}

testMeetings(); 