const axios = require('axios');

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

let authToken = '';

async function login() {
  try {
    console.log('🔐 Logging in...');
    const response = await axios.post(`${BASE_URL}/users/login`, testUser);
    authToken = response.data.token;
    console.log('✅ Login successful');
    return true;
  } catch (error) {
    console.error('❌ Login failed:', error.response?.data || error.message);
    return false;
  }
}

async function createMeeting() {
  try {
    console.log('📅 Creating meeting...');
    const response = await axios.post(`${BASE_URL}/meetings`, testMeeting, {
      headers: { Authorization: `Bearer ${authToken}` }
    });
    console.log('✅ Meeting created:', response.data.data);
    return response.data.data.id;
  } catch (error) {
    console.error('❌ Create meeting failed:', error.response?.data || error.message);
    return null;
  }
}

async function getMeetings() {
  try {
    console.log('📋 Fetching all meetings...');
    const response = await axios.get(`${BASE_URL}/meetings`, {
      headers: { Authorization: `Bearer ${authToken}` }
    });
    console.log('✅ Meetings fetched:', response.data.data.length, 'meetings');
    return response.data.data;
  } catch (error) {
    console.error('❌ Get meetings failed:', error.response?.data || error.message);
    return [];
  }
}

async function getMyMeetings() {
  try {
    console.log('📋 Fetching my meetings...');
    const response = await axios.get(`${BASE_URL}/meetings?hostOnly=true`, {
      headers: { Authorization: `Bearer ${authToken}` }
    });
    console.log('✅ My meetings fetched:', response.data.data.length, 'meetings');
    return response.data.data;
  } catch (error) {
    console.error('❌ Get my meetings failed:', error.response?.data || error.message);
    return [];
  }
}

async function updateMeeting(meetingId) {
  try {
    console.log('✏️ Updating meeting...');
    const updateData = {
      ...testMeeting,
      topic: 'Updated Test Meeting',
      description: 'This meeting has been updated'
    };
    const response = await axios.put(`${BASE_URL}/meetings/${meetingId}`, updateData, {
      headers: { Authorization: `Bearer ${authToken}` }
    });
    console.log('✅ Meeting updated:', response.data.data);
    return true;
  } catch (error) {
    console.error('❌ Update meeting failed:', error.response?.data || error.message);
    return false;
  }
}

async function joinMeeting(meetingId) {
  try {
    console.log('👥 Joining meeting...');
    const response = await axios.post(`${BASE_URL}/meetings/${meetingId}/join`, {}, {
      headers: { Authorization: `Bearer ${authToken}` }
    });
    console.log('✅ Joined meeting:', response.data.message);
    return true;
  } catch (error) {
    console.error('❌ Join meeting failed:', error.response?.data || error.message);
    return false;
  }
}

async function leaveMeeting(meetingId) {
  try {
    console.log('👋 Leaving meeting...');
    const response = await axios.post(`${BASE_URL}/meetings/${meetingId}/leave`, {}, {
      headers: { Authorization: `Bearer ${authToken}` }
    });
    console.log('✅ Left meeting:', response.data.message);
    return true;
  } catch (error) {
    console.error('❌ Leave meeting failed:', error.response?.data || error.message);
    return false;
  }
}

async function deleteMeeting(meetingId) {
  try {
    console.log('🗑️ Deleting meeting...');
    const response = await axios.delete(`${BASE_URL}/meetings/${meetingId}`, {
      headers: { Authorization: `Bearer ${authToken}` }
    });
    console.log('✅ Meeting deleted:', response.data.message);
    return true;
  } catch (error) {
    console.error('❌ Delete meeting failed:', error.response?.data || error.message);
    return false;
  }
}

async function runTests() {
  console.log('🚀 Starting Meeting API Tests...\n');

  // Login
  const loginSuccess = await login();
  if (!loginSuccess) {
    console.log('❌ Cannot proceed without login');
    return;
  }

  // Create meeting
  const meetingId = await createMeeting();
  if (!meetingId) {
    console.log('❌ Cannot proceed without creating a meeting');
    return;
  }

  // Get all meetings
  await getMeetings();

  // Get my meetings
  await getMyMeetings();

  // Update meeting
  await updateMeeting(meetingId);

  // Join meeting
  await joinMeeting(meetingId);

  // Leave meeting
  await leaveMeeting(meetingId);

  // Delete meeting
  await deleteMeeting(meetingId);

  console.log('\n🎉 All tests completed!');
}

// Run the tests
runTests().catch(console.error); 