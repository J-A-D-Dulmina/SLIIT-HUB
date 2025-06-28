const express = require('express');
const router = express.Router();
const meetingController = require('./controller');
const auth = require('../../middleware/auth');

// Create a new meeting
router.post('/', auth, meetingController.createMeeting);

// Get all meetings (public - no auth required)
router.get('/', meetingController.getMeetings);

// Get a specific meeting (public - no auth required)
router.get('/:id', meetingController.getMeetingById);

// Update a meeting
router.put('/:id', auth, meetingController.updateMeeting);

// Delete a meeting
router.delete('/:id', auth, meetingController.deleteMeeting);

// Join a meeting
router.post('/:meetingId/join', auth, meetingController.joinMeeting);

// Leave a meeting
router.post('/:meetingId/leave', auth, meetingController.leaveMeeting);

// Add participants to meeting
router.post('/:id/participants', auth, meetingController.addParticipants);

// Remove participant from meeting
router.delete('/:meetingId/participants/:participantId', auth, meetingController.removeParticipant);

// Start recording
router.post('/:meetingId/recording/start', auth, meetingController.startRecording);

// Stop recording
router.post('/:meetingId/recording/stop', auth, meetingController.stopRecording);

// Add recording file
router.post('/:meetingId/recordings', auth, meetingController.addRecordingFile);

// Get recording files for a meeting
router.get('/:meetingId/recordings', auth, meetingController.getRecordingFiles);

// Get meeting statistics
router.get('/:meetingId/stats', auth, meetingController.getMeetingStats);

module.exports = router; 