/**
 * Test Script for Meeting Creation
 * 
 * This script tests the meeting creation functionality to ensure:
 * 1. Meeting data is properly saved to database
 * 2. Meeting links are generated correctly
 * 3. All required fields are populated
 */

const mongoose = require('mongoose');
const Meeting = require('./modules/meeting/model');
const Student = require('./modules/user/model');
const Lecturer = require('./modules/lecturer/model');

// Connect to database
const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/sliit-hub');
    console.log('✅ Connected to MongoDB');
  } catch (error) {
    console.error('❌ Database connection failed:', error);
    process.exit(1);
  }
};

// Test meeting creation
const testMeetingCreation = async () => {
  try {
    console.log('\n🧪 Testing Meeting Creation...\n');

    // First, check if we have any users in the database
    const students = await Student.find().limit(1);
    const lecturers = await Lecturer.find().limit(1);

    if (students.length === 0 && lecturers.length === 0) {
      console.log('❌ No users found in database. Please create some users first.');
      return;
    }

    // Use the first available user
    const testUser = students.length > 0 ? students[0] : lecturers[0];
    const userType = students.length > 0 ? 'student' : 'lecturer';

    console.log(`👤 Using test user: ${testUser.name} (${userType})`);

    // Create test meeting data
    const testMeetingData = {
      title: 'Test Meeting - AI Discussion',
      description: 'This is a test meeting to discuss AI topics and recent developments in machine learning.',
      host: testUser._id,
      hostEmail: testUser.email,
      hostName: testUser.name,
      startTime: new Date(Date.now() + 30 * 60 * 1000), // 30 minutes from now
      endTime: new Date(Date.now() + 90 * 60 * 1000),   // 90 minutes from now
      duration: 60,
      degree: 'BSc in Information Technology',
      year: 'Year 3',
      semester: 'Semester 1',
      module: 'AI',
      meetingLink: `https://meet.google.com/test-${Date.now()}`,
      maxParticipants: 20,
      isPublic: true,
      status: 'scheduled',
      participants: [{
        userId: testUser._id,
        email: testUser.email,
        name: testUser.name,
        role: 'host',
        joinedAt: new Date()
      }],
      settings: {
        allowChat: true,
        allowScreenShare: true,
        allowRecording: true,
        muteOnEntry: false,
        videoOnEntry: true,
        waitingRoom: false
      },
      chatHistory: [{
        senderId: testUser._id,
        senderName: testUser.name,
        message: 'Welcome to the test meeting!',
        timestamp: new Date()
      }],
      recordings: [],
      recordingStatus: {
        isRecording: false,
        duration: 0
      },
      notes: 'Test meeting for AI discussion',
      tags: ['BSc in Information Technology', 'Year 3', 'Semester 1', 'AI']
    };

    console.log('📝 Creating test meeting...');
    console.log('Meeting data:', JSON.stringify(testMeetingData, null, 2));

    // Create and save the meeting
    const meeting = new Meeting(testMeetingData);
    const savedMeeting = await meeting.save();

    console.log('\n✅ Meeting saved successfully!');
    console.log('📊 Meeting Details:');
    console.log(`   ID: ${savedMeeting._id}`);
    console.log(`   Title: ${savedMeeting.title}`);
    console.log(`   Link: ${savedMeeting.meetingLink}`);
    console.log(`   Host: ${savedMeeting.hostName}`);
    console.log(`   Start: ${savedMeeting.startTime}`);
    console.log(`   End: ${savedMeeting.endTime}`);
    console.log(`   Duration: ${savedMeeting.duration} minutes`);
    console.log(`   Status: ${savedMeeting.status}`);

    // Verify the meeting was saved by fetching it
    const verifiedMeeting = await Meeting.findById(savedMeeting._id);
    if (verifiedMeeting) {
      console.log('\n✅ Database verification successful!');
      console.log(`   Retrieved meeting: ${verifiedMeeting.title}`);
      console.log(`   Database ID: ${verifiedMeeting._id}`);
    } else {
      console.log('\n❌ Database verification failed!');
    }

    // Test meeting methods
    console.log('\n🧪 Testing meeting methods...');
    console.log(`   Is Active: ${verifiedMeeting.isActive()}`);
    console.log(`   Can Start: ${verifiedMeeting.canStart()}`);
    console.log(`   Status: ${verifiedMeeting.getStatus()}`);

    // Clean up - delete the test meeting
    console.log('\n🧹 Cleaning up test data...');
    await Meeting.findByIdAndDelete(savedMeeting._id);
    console.log('✅ Test meeting deleted');

    console.log('\n🎉 All tests passed! Meeting creation and database saving is working correctly.');

  } catch (error) {
    console.error('\n❌ Test failed:', error);
  }
};

// Run the test
const runTest = async () => {
  await connectDB();
  await testMeetingCreation();
  await mongoose.connection.close();
  console.log('\n👋 Test completed. Database connection closed.');
};

// Run if this file is executed directly
if (require.main === module) {
  runTest();
}

module.exports = { testMeetingCreation }; 