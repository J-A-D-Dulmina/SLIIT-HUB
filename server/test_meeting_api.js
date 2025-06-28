const axios = require('axios');
const fetch = require('node-fetch');

const BASE_URL = 'http://localhost:5000/api';

// Test data
const testUser = {
  email: 'test@example.com',
  password: 'password123'
};

const testMeeting = {
  topic: 'Test Meeting',
  date: '2024-12-30',
  time: '14:00',
  duration: '60',
  degree: 'BSc in Information Technology',
  year: 'Year 3',
  semester: 'Semester 1',
  module: 'Web Development',
  email: 'test@example.com',
  description: 'This is a test meeting for API testing'
};

let authToken = null;
let testMeetingId = null;

async function login() {
  try {
    console.log('Logging in...');
    const response = await axios.post(`${BASE_URL}/login`, {
      email: 'student@test.com',
      password: 'password123'
    });
    
    authToken = response.data.token;
    console.log('Login successful');
    return true;
  } catch (error) {
    console.error('Login failed:', error.response?.data || error.message);
    return false;
  }
}

async function createMeeting() {
  try {
    const meetingData = {
      title: 'Test Meeting - API Testing',
      description: 'This is a test meeting created via API',
      startTime: new Date(Date.now() + 60 * 60 * 1000), // 1 hour from now
      endTime: new Date(Date.now() + 120 * 60 * 1000),  // 2 hours from now
      degree: 'BSc in Information Technology',
      year: 'Year 2',
      semester: 'Semester 1',
      module: 'Web Development',
      maxParticipants: 15,
      isPublic: true
    };

    const response = await axios.post(`${BASE_URL}/meetings`, meetingData, {
      headers: {
        'Authorization': `Bearer ${authToken}`,
        'Content-Type': 'application/json'
      }
    });

    testMeetingId = response.data.data._id;
    console.log('Meeting created:', response.data.data);
    return true;
  } catch (error) {
    console.error('Create meeting failed:', error.response?.data || error.message);
    return false;
  }
}

async function fetchAllMeetings() {
  try {
    console.log('Fetching all meetings...');
    const response = await axios.get(`${BASE_URL}/meetings`, {
      headers: {
        'Authorization': `Bearer ${authToken}`
      }
    });

    console.log('Meetings fetched:', response.data.data.length, 'meetings');
    return true;
  } catch (error) {
    console.error('Fetch meetings failed:', error.response?.data || error.message);
    return false;
  }
}

async function fetchMyMeetings() {
  try {
    console.log('Fetching my meetings...');
    const response = await axios.get(`${BASE_URL}/meetings/my-meetings`, {
      headers: {
        'Authorization': `Bearer ${authToken}`
      }
    });

    console.log('My meetings fetched:', response.data.data.length, 'meetings');
    return true;
  } catch (error) {
    console.error('Fetch my meetings failed:', error.response?.data || error.message);
    return false;
  }
}

async function updateMeeting() {
  if (!testMeetingId) {
    console.log('No test meeting to update');
    return false;
  }

  try {
    const updateData = {
      title: 'Updated Test Meeting - API Testing',
      description: 'This meeting has been updated via API',
      maxParticipants: 20
    };

    const response = await axios.put(`${BASE_URL}/meetings/${testMeetingId}`, updateData, {
      headers: {
        'Authorization': `Bearer ${authToken}`,
        'Content-Type': 'application/json'
      }
    });

    console.log('Meeting updated:', response.data.data);
    return true;
  } catch (error) {
    console.error('Update meeting failed:', error.response?.data || error.message);
    return false;
  }
}

async function joinMeeting() {
  if (!testMeetingId) {
    console.log('No test meeting to join');
    return false;
  }

  try {
    const response = await axios.post(`${BASE_URL}/meetings/${testMeetingId}/join`, {}, {
      headers: {
        'Authorization': `Bearer ${authToken}`,
        'Content-Type': 'application/json'
      }
    });

    console.log('Joined meeting:', response.data.message);
    return true;
  } catch (error) {
    console.error('Join meeting failed:', error.response?.data || error.message);
    return false;
  }
}

async function leaveMeeting() {
  if (!testMeetingId) {
    console.log('No test meeting to leave');
    return false;
  }

  try {
    const response = await axios.post(`${BASE_URL}/meetings/${testMeetingId}/leave`, {}, {
      headers: {
        'Authorization': `Bearer ${authToken}`,
        'Content-Type': 'application/json'
      }
    });

    console.log('Left meeting:', response.data.message);
    return true;
  } catch (error) {
    console.error('Leave meeting failed:', error.response?.data || error.message);
    return false;
  }
}

async function deleteMeeting() {
  if (!testMeetingId) {
    console.log('No test meeting to delete');
    return false;
  }

  try {
    const response = await axios.delete(`${BASE_URL}/meetings/${testMeetingId}`, {
      headers: {
        'Authorization': `Bearer ${authToken}`
      }
    });

    console.log('Meeting deleted:', response.data.message);
    return true;
  } catch (error) {
    console.error('Delete meeting failed:', error.response?.data || error.message);
    return false;
  }
}

async function runTests() {
  console.log('=== Meeting API Test ===\n');

  // Login
  if (!await login()) {
    console.log('Cannot proceed without login');
    return;
  }

  // Create meeting
  if (!await createMeeting()) {
    console.log('Cannot proceed without creating a meeting');
    return;
  }

  // Test other operations
  await fetchAllMeetings();
  await fetchMyMeetings();
  await updateMeeting();
  await joinMeeting();
  await leaveMeeting();
  await deleteMeeting();

  console.log('\n=== All tests completed ===');
}

async function testMeetingAPI() {
  console.log('Testing Meeting API endpoints...');
  
  try {
    // Test 1: Check if server is running
    console.log('\n1. Testing server status...');
    const statusResponse = await axios.get(`${BASE_URL}/meetings/public`);
    console.log('Server status:', statusResponse.status);
    
    // Test 2: Get public meetings
    console.log('\n2. Testing public meetings endpoint...');
    const publicMeetingsResponse = await axios.get(`${BASE_URL}/meetings/public`);
    if (publicMeetingsResponse.status === 200) {
      const data = publicMeetingsResponse.data;
      console.log('Public meetings found:', data.data ? data.data.length : 0);
    } else {
      console.log('Public meetings error:', publicMeetingsResponse.status);
    }
    
    // Test 3: Test with a specific meeting ID (this will fail without auth, but we can see the error)
    console.log('\n3. Testing specific meeting endpoint (will fail without auth)...');
    const testMeetingId = '68604090e225fa54be89d295';
    try {
      const meetingResponse = await axios.get(`${BASE_URL}/meetings/${testMeetingId}`);
      console.log('Meeting endpoint status:', meetingResponse.status);
    } catch (error) {
      console.log('Meeting endpoint status:', error.response?.status || 'Network error');
      if (error.response?.data) {
        console.log('Error message:', error.response.data.message);
      }
    }
    
  } catch (error) {
    console.error('Test failed:', error.message);
  }
}

runTests();
testMeetingAPI(); 