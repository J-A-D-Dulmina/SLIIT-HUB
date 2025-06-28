const Meeting = require('./model');
const Student = require('../user/model');
const Lecturer = require('../lecturer/model');



// Create a new meeting
const createMeeting = async (req, res) => {
  try {
    const {
      title,
      startTime,
      duration,
      degree,
      year,
      semester,
      module,
      email,
      description
    } = req.body;

    const userId = req.user && req.user.id ? req.user.id : null;
    const userType = req.user && req.user.type ? req.user.type : null;

    if (!userId || userType !== 'student') {
      return res.status(401).json({ success: false, message: 'Only authenticated students can create meetings' });
    }

    const student = await Student.findById(userId);
    if (!student) {
      return res.status(404).json({ success: false, message: 'Student not found' });
    }
    const hostName = student.name;
    const hostStudentId = student.studentId;

    if (!title || !startTime || !duration || !degree || !year || !semester || !module || !email) {
      return res.status(400).json({ success: false, message: 'Missing required fields' });
    }

    const startDateTime = new Date(startTime);
    const durationNum = parseInt(duration);
    const endTime = new Date(startDateTime.getTime() + durationNum * 60000);

    const meetingData = {
      title: title.trim(),
      description: description ? description.trim() : '',
      host: student._id,
      hostStudentId,
      hostEmail: email.trim(),
      hostName: hostName.trim(),
      startTime: startDateTime,
      endTime: endTime,
      duration: durationNum,
      degree: degree.trim(),
      year: year.trim(),
      semester: semester.trim(),
      module: module.trim(),
      maxParticipants: 50,
      isPublic: true,
      status: 'scheduled',
      participants: [{
        userId: student._id,
        email: email.trim(),
        name: hostName.trim(),
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
      chatHistory: [],
      recordings: [],
      recordingStatus: {
        isRecording: false,
        duration: 0
      },
      notes: '',
      tags: [degree, year, semester, module]
    };

    let meeting = new Meeting(meetingData);
    await meeting.save();

    // Now set the meetingLink using the real MongoDB _id
    meeting.meetingLink = `${process.env.FRONTEND_URL || 'http://localhost:3000'}/meeting/${meeting._id}`;
    await meeting.save();

    res.status(201).json({
      success: true,
      message: 'Meeting created successfully',
      data: meeting
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Internal server error', error: error.message });
  }
};

// Get all meetings (with filters)
const getMeetings = async (req, res) => {
  try {
    const {
      status,
      year,
      semester,
      module,
      search,
      page = 1,
      limit = 10,
      hostOnly = false
    } = req.query;

    let query = {};

    // Get user info from authenticated user
    if (req.user && req.user.id) {
      const userId = req.user.id;
      const userType = req.user.type;
      
      if (userType === 'student') {
        // Get student info to get studentId
        const student = await Student.findById(userId);
        if (student) {
          const studentId = student.studentId;
          
          if (hostOnly === 'true') {
            // Show only meetings hosted by the current student
            query.hostStudentId = studentId;
          } else {
            // Show meetings where student is host or participant
            query.$or = [
              { hostStudentId: studentId },
              { 'participants.userId': userId }
            ];
          }
        } else {
          return res.status(404).json({
            success: false,
            message: 'Student not found'
          });
        }
      } else {
        // For lecturers, use the userId directly
        if (hostOnly === 'true') {
          query.host = userId;
        } else {
          query.$or = [
            { host: userId },
            { 'participants.userId': userId }
          ];
        }
      }
    } else {
      return res.status(401).json({
        success: false,
        message: 'Authentication required to view meetings'
      });
    }

    // Filter by status
    if (status) {
      query.status = status;
    }

    // Filter by year
    if (year) {
      query.year = year;
    }

    // Filter by semester
    if (semester) {
      query.semester = semester;
    }

    // Filter by module
    if (module) {
      query.module = { $regex: module, $options: 'i' };
    }

    // Search functionality
    if (search) {
      query.$and = query.$and || [];
      query.$and.push({
        $or: [
          { title: { $regex: search, $options: 'i' } },
          { description: { $regex: search, $options: 'i' } },
          { hostName: { $regex: search, $options: 'i' } }
        ]
      });
    }

    const skip = (page - 1) * limit;

    const meetings = await Meeting.find(query)
      .populate('host', 'name email')
      .populate('participants.userId', 'name email')
      .sort({ startTime: 1 })
      .skip(skip)
      .limit(parseInt(limit));

    console.log('Found meetings:', meetings.length);
    meetings.forEach(meeting => {
      console.log(`Meeting: ${meeting.title}, Host: ${meeting.hostName}, HostStudentId: ${meeting.hostStudentId}`);
    });

    // Add computed status to each meeting
    const meetingsWithStatus = [];
    for (const meeting of meetings) {
      const meetingObj = meeting.toObject();
      const status = getMeetingStatus(meeting);
      
      // Check if user is the host based on user type
      let isHost = false;
      if (req.user && req.user.id) {
        if (req.user.type === 'student') {
          // For students, check hostStudentId
          const student = await Student.findById(req.user.id);
          if (student && student.studentId === meeting.hostStudentId) {
            isHost = true;
          }
        } else {
          // For lecturers, check host ObjectId
          isHost = meeting.host.toString() === req.user.id;
        }
      }
      
      meetingObj.computedStatus = status;
      meetingObj.isHost = isHost;
      meetingObj.canStart = isHost && (status === 'starting-soon' || status === 'upcoming');
      meetingObj.canJoin = status === 'in-progress';
      meetingsWithStatus.push(meetingObj);
    }

    res.json({
      success: true,
      data: meetingsWithStatus,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: await Meeting.countDocuments(query),
        pages: Math.ceil(await Meeting.countDocuments(query) / limit)
      }
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
};

// Get a single meeting by ID
const getMeetingById = async (req, res) => {
  try {
    console.log('getMeetingById called with params:', req.params);
    console.log('req.user:', req.user);
    
    const { id } = req.params;

    if (!req.user) {
      console.error('req.user is undefined - authentication failed');
      return res.status(401).json({
        success: false,
        message: 'Authentication required'
      });
    }

    const meeting = await Meeting.findById(id)
      .populate('host', 'name email')
      .populate('participants.userId', 'name email')
      .populate('chatHistory.sender', 'name email');

    if (!meeting) {
      return res.status(404).json({
        success: false,
        message: 'Meeting not found'
      });
    }

    // Add computed status
    const meetingObj = meeting.toObject();
    const status = getMeetingStatus(meeting);
    
    // Check if user is the host based on user type
    let isHost = false;
    if (req.user.type === 'student') {
      // For students, check hostStudentId
      const student = await Student.findById(req.user.id);
      if (student && student.studentId === meeting.hostStudentId) {
        isHost = true;
      }
    } else {
      // For lecturers, check host ObjectId
      isHost = meeting.host.toString() === req.user.id;
    }
    
    meetingObj.computedStatus = status;
    meetingObj.isHost = isHost;
    meetingObj.canStart = isHost && (status === 'starting-soon' || status === 'upcoming');
    meetingObj.canJoin = status === 'in-progress';

    res.json({
      success: true,
      data: meetingObj
    });

  } catch (error) {
    console.error('Error fetching meeting:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
};

// Update a meeting
const updateMeeting = async (req, res) => {
  try {
    const meeting = await Meeting.findById(req.params.id);

    if (!meeting) {
      return res.status(404).json({
        success: false,
        message: 'Meeting not found'
      });
    }

    // Check if user is the host
    if (meeting.host.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'Only the host can update the meeting'
      });
    }

    const {
      topic,
      date,
      time,
      duration,
      degree,
      year,
      semester,
      module,
      email,
      description
    } = req.body;
    
    // Update allowed fields
    if (topic) meeting.title = topic;
    if (description !== undefined) meeting.description = description;
    if (degree) meeting.degree = degree;
    if (year) meeting.year = year;
    if (semester) meeting.semester = semester;
    if (module) meeting.module = module;
    if (email) meeting.hostEmail = email;
    if (duration) meeting.duration = parseInt(duration);
    
    // Update start time if date and time are provided
    if (date && time) {
      const startDateTime = new Date(`${date}T${time}`);
      const now = new Date();
      
      // Validate start time (must be in the future)
      if (startDateTime <= now) {
        return res.status(400).json({
          success: false,
          message: 'Meeting start time must be in the future'
        });
      }
      
      meeting.startTime = startDateTime;
    }

    await meeting.save();
    await meeting.populate('host', 'name email');

    res.json({
      success: true,
      message: 'Meeting updated successfully',
      data: meeting
    });
  } catch (error) {
    console.error('Error updating meeting:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update meeting',
      error: error.message
    });
  }
};

// Delete a meeting
const deleteMeeting = async (req, res) => {
  try {
    const { id } = req.params;

    const meeting = await Meeting.findById(id);

    if (!meeting) {
      return res.status(404).json({
        success: false,
        message: 'Meeting not found'
      });
    }

    // Check if user is the host
    if (meeting.host.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'Only the meeting host can delete the meeting'
      });
    }

    // Check if meeting can be deleted (not in progress)
    if (meeting.status === 'in-progress') {
      return res.status(400).json({
        success: false,
        message: 'Cannot delete a meeting that is in progress'
      });
    }

    await Meeting.findByIdAndDelete(id);

    res.json({
      success: true,
      message: 'Meeting deleted successfully'
    });

  } catch (error) {
    console.error('Error deleting meeting:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
};

// Join a meeting
const joinMeeting = async (req, res) => {
  try {
    const { meetingId } = req.params;

    const meeting = await Meeting.findById(meetingId);

    if (!meeting) {
      return res.status(404).json({
        success: false,
        message: 'Meeting not found'
      });
    }

    // Check if meeting is active or can be started
    if (!meeting.canStart()) {
      return res.status(400).json({
        success: false,
        message: 'Meeting is not available for joining at this time'
      });
    }

    // Check if user is already a participant
    const existingParticipant = meeting.participants.find(
      p => p.userId.toString() === req.user.id
    );

    if (existingParticipant) {
      // Update join time if not already joined
      if (!existingParticipant.joinedAt) {
        existingParticipant.joinedAt = new Date();
        await meeting.save();
      }

      return res.json({
        success: true,
        message: 'Already joined the meeting',
        data: {
          meetingId: meeting._id,
          meetingLink: meeting.meetingLink,
          role: existingParticipant.role
        }
      });
    }

    // Check if meeting is full
    if (meeting.participants.length >= meeting.maxParticipants) {
      return res.status(400).json({
        success: false,
        message: 'Meeting is full'
      });
    }

    // Add user as participant
    meeting.participants.push({
      userId: req.user.id,
      email: req.user.email,
      name: req.user.name,
      role: 'participant',
      joinedAt: new Date()
    });

    await meeting.save();

    res.json({
      success: true,
      message: 'Successfully joined the meeting',
      data: {
        meetingId: meeting._id,
        meetingLink: meeting.meetingLink,
        role: 'participant'
      }
    });

  } catch (error) {
    console.error('Error joining meeting:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
};

// Leave a meeting
const leaveMeeting = async (req, res) => {
  try {
    const { meetingId } = req.params;

    const meeting = await Meeting.findById(meetingId);

    if (!meeting) {
      return res.status(404).json({
        success: false,
        message: 'Meeting not found'
      });
    }

    // Find participant
    const participantIndex = meeting.participants.findIndex(
      p => p.userId.toString() === req.user.id
    );

    if (participantIndex === -1) {
      return res.status(400).json({
        success: false,
        message: 'You are not a participant in this meeting'
      });
    }

    // Update left time
    meeting.participants[participantIndex].leftAt = new Date();

    await meeting.save();

    res.json({
      success: true,
      message: 'Successfully left the meeting'
    });

  } catch (error) {
    console.error('Error leaving meeting:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
};

// Start a meeting
const startMeeting = async (req, res) => {
  try {
    console.log('startMeeting called with params:', req.params);
    console.log('req.user:', req.user);
    
    const { meetingId } = req.params;
    const meeting = await Meeting.findById(meetingId);
    if (!meeting) {
      console.log('Meeting not found with ID:', meetingId);
      return res.status(404).json({ success: false, message: 'Meeting not found' });
    }

    console.log('Found meeting:', {
      id: meeting._id,
      title: meeting.title,
      status: meeting.status,
      startTime: meeting.startTime,
      currentTime: new Date(),
      timeDiffMinutes: (meeting.startTime - new Date()) / (1000 * 60),
      canStart: meeting.canStart()
    });

    // Check if user is the host
    let isHost = false;
    if (req.user.type === 'student') {
      // For students, check hostStudentId
      const student = await Student.findById(req.user.id);
      if (student && student.studentId === meeting.hostStudentId) {
        isHost = true;
      }
    } else {
      // For lecturers, check host ObjectId
      if (meeting.host.toString() === req.user.id) {
        isHost = true;
      }
    }

    console.log('Host check:', {
      userType: req.user.type,
      userId: req.user.id,
      meetingHost: meeting.host,
      meetingHostStudentId: meeting.hostStudentId,
      isHost: isHost
    });

    if (!isHost) {
      return res.status(403).json({ success: false, message: 'Only the meeting host can start the meeting' });
    }

    // Check if meeting can be started using the model method
    if (!meeting.canStart()) {
      return res.status(400).json({ success: false, message: 'Meeting cannot be started at this time' });
    }

    meeting.status = 'in-progress';
    meeting.startedAt = new Date(); // set start timestamp
    await meeting.save();
    res.json({
      success: true,
      message: 'Meeting started successfully',
      data: {
        meetingId: meeting._id,
        meetingLink: meeting.meetingLink,
        status: meeting.status
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Internal server error', error: error.message });
  }
};

// End a meeting
const endMeeting = async (req, res) => {
  try {
    const { meetingId } = req.params;
    const meeting = await Meeting.findById(meetingId);
    if (!meeting) {
      return res.status(404).json({ success: false, message: 'Meeting not found' });
    }

    // Check if user is the host
    let isHost = false;
    if (req.user.type === 'student') {
      // For students, check hostStudentId
      const student = await Student.findById(req.user.id);
      if (student && student.studentId === meeting.hostStudentId) {
        isHost = true;
      }
    } else {
      // For lecturers, check host ObjectId
      if (meeting.host.toString() === req.user.id) {
        isHost = true;
      }
    }

    if (!isHost) {
      return res.status(403).json({ success: false, message: 'Only the meeting host can end the meeting' });
    }

    meeting.status = 'completed';
    meeting.endedAt = new Date(); // set end timestamp
    await meeting.save();
    res.json({ success: true, message: 'Meeting ended successfully' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Internal server error', error: error.message });
  }
};

// Add chat message
const addChatMessage = async (req, res) => {
  try {
    const { id } = req.params;
    const { message } = req.body;

    if (!message || message.trim().length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Message cannot be empty'
      });
    }

    const meeting = await Meeting.findById(id);

    if (!meeting) {
      return res.status(404).json({
        success: false,
        message: 'Meeting not found'
      });
    }

    // Check if user is a participant
    const isParticipant = meeting.participants.some(
      p => p.userId.toString() === req.user.id
    );

    if (!isParticipant) {
      return res.status(403).json({
        success: false,
        message: 'You must be a participant to send messages'
      });
    }

    // Add message to chat history
    meeting.chatHistory.push({
      sender: req.user.id,
      senderName: req.user.name,
      message: message.trim(),
      timestamp: new Date()
    });

    await meeting.save();

    res.json({
      success: true,
      message: 'Message sent successfully',
      data: {
        messageId: meeting.chatHistory[meeting.chatHistory.length - 1]._id,
        sender: req.user.name,
        message: message.trim(),
        timestamp: new Date()
      }
    });

  } catch (error) {
    console.error('Error adding chat message:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
};

// Add participants to meeting
const addParticipants = async (req, res) => {
  try {
    const { participants } = req.body;
    const meeting = await Meeting.findById(req.params.id);

    if (!meeting) {
      return res.status(404).json({
        success: false,
        message: 'Meeting not found'
      });
    }

    // Check if user is the host
    if (meeting.host.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'Only the host can add participants'
      });
    }

    // Add each participant
    for (const participant of participants) {
      const user = await Student.findById(participant.userId);
      if (user) {
        await meeting.addParticipant(user._id, user.name, user.email, participant.role || 'participant');
      }
    }

    await meeting.populate('host', 'name email');
    await meeting.populate('participants.userId', 'name email');

    res.json({
      success: true,
      message: 'Participants added successfully',
      data: meeting
    });
  } catch (error) {
    console.error('Error adding participants:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to add participants',
      error: error.message
    });
  }
};

// Remove participant from meeting
const removeParticipant = async (req, res) => {
  try {
    const { meetingId, participantId } = req.params;
    const meeting = await Meeting.findById(meetingId);

    if (!meeting) {
      return res.status(404).json({
        success: false,
        message: 'Meeting not found'
      });
    }

    // Check if user is the host
    if (meeting.host.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'Only the host can remove participants'
      });
    }

    // Remove participant
    meeting.participants = meeting.participants.filter(
      p => p.userId.toString() !== participantId
    );

    await meeting.save();
    await meeting.populate('host', 'name email');
    await meeting.populate('participants.userId', 'name email');

    res.json({
      success: true,
      message: 'Participant removed successfully',
      data: meeting
    });
  } catch (error) {
    console.error('Error removing participant:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to remove participant',
      error: error.message
    });
  }
};

// Start recording
const startRecording = async (req, res) => {
  try {
    const { meetingId } = req.params;
    const meeting = await Meeting.findById(meetingId);

    if (!meeting) {
      return res.status(404).json({
        success: false,
        message: 'Meeting not found'
      });
    }

    // Check if user is the host
    if (meeting.host.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'Only the host can start recording'
      });
    }

    // Check if recording is already in progress
    if (meeting.recordingStatus.isRecording) {
      return res.status(400).json({
        success: false,
        message: 'Recording is already in progress'
      });
    }

    // Check if recording is allowed
    if (!meeting.settings.allowRecording) {
      return res.status(400).json({
        success: false,
        message: 'Recording is not allowed for this meeting'
      });
    }

    // Start recording
    await meeting.startRecording(req.user.id);

    res.json({
      success: true,
      message: 'Recording started successfully',
      data: {
        isRecording: true,
        startedAt: meeting.recordingStatus.startedAt,
        startedBy: req.user.id
      }
    });
  } catch (error) {
    console.error('Error starting recording:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to start recording',
      error: error.message
    });
  }
};

// Stop recording
const stopRecording = async (req, res) => {
  try {
    const { meetingId } = req.params;
    const meeting = await Meeting.findById(meetingId);

    if (!meeting) {
      return res.status(404).json({
        success: false,
        message: 'Meeting not found'
      });
    }

    // Check if user is the host
    if (meeting.host.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'Only the host can stop recording'
      });
    }

    // Check if recording is in progress
    if (!meeting.recordingStatus.isRecording) {
      return res.status(400).json({
        success: false,
        message: 'No recording in progress'
      });
    }

    // Stop recording
    await meeting.stopRecording();

    res.json({
      success: true,
      message: 'Recording stopped successfully',
      data: {
        isRecording: false,
        stoppedAt: meeting.recordingStatus.stoppedAt,
        duration: meeting.recordingStatus.duration
      }
    });
  } catch (error) {
    console.error('Error stopping recording:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to stop recording',
      error: error.message
    });
  }
};

// Add recording file
const addRecordingFile = async (req, res) => {
  try {
    const { meetingId } = req.params;
    const { filename, fileSize, duration, downloadUrl } = req.body;
    
    const meeting = await Meeting.findById(meetingId);

    if (!meeting) {
      return res.status(404).json({
        success: false,
        message: 'Meeting not found'
      });
    }

    // Check if user is the host
    if (meeting.host.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'Only the host can add recording files'
      });
    }

    // Add recording file
    const recordingData = {
      filename,
      fileSize,
      duration,
      recordedBy: req.user.id,
      downloadUrl,
      status: 'completed'
    };

    await meeting.addRecording(recordingData);

    res.json({
      success: true,
      message: 'Recording file added successfully',
      data: recordingData
    });
  } catch (error) {
    console.error('Error adding recording file:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to add recording file',
      error: error.message
    });
  }
};

// Get recording files for a meeting
const getRecordingFiles = async (req, res) => {
  try {
    const { meetingId } = req.params;
    const meeting = await Meeting.findById(meetingId);

    if (!meeting) {
      return res.status(404).json({
        success: false,
        message: 'Meeting not found'
      });
    }

    // Check if user is authorized to view recordings
    const isAuthorized = meeting.host.toString() === req.user.id ||
      meeting.participants.some(p => p.userId.toString() === req.user.id);

    if (!isAuthorized) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to view recordings'
      });
    }

    res.json({
      success: true,
      data: {
        recordings: meeting.recordings,
        recordingStatus: meeting.recordingStatus
      }
    });
  } catch (error) {
    console.error('Error fetching recording files:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch recording files',
      error: error.message
    });
  }
};

// Get meeting statistics
const getMeetingStats = async (req, res) => {
  try {
    const { meetingId } = req.params;
    const meeting = await Meeting.findById(meetingId);

    if (!meeting) {
      return res.status(404).json({
        success: false,
        message: 'Meeting not found'
      });
    }

    // Check if user is authorized
    const isAuthorized = meeting.host.toString() === req.user.id ||
      meeting.participants.some(p => p.userId.toString() === req.user.id);

    if (!isAuthorized) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to view meeting statistics'
      });
    }

    const stats = {
      totalParticipants: meeting.participants.length,
      activeParticipants: meeting.participants.filter(p => !p.leftAt).length,
      chatMessages: meeting.chatHistory.length,
      recordings: meeting.recordings.length,
      totalRecordingDuration: meeting.recordings.reduce((total, rec) => total + (rec.duration || 0), 0),
      meetingDuration: meeting.startedAt && meeting.endedAt ? 
        Math.floor((meeting.endedAt - meeting.startedAt) / 1000) : 0,
      currentRecordingDuration: meeting.currentRecordingDuration
    };

    res.json({
      success: true,
      data: stats
    });
  } catch (error) {
    console.error('Error fetching meeting statistics:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch meeting statistics',
      error: error.message
    });
  }
};

// Get my meetings (meetings hosted by current user)
const getMyMeetings = async (req, res) => {
  try {
    const {
      status,
      year,
      semester,
      module,
      search,
      page = 1,
      limit = 10
    } = req.query;

    if (!req.user || !req.user.id) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required to view your meetings'
      });
    }

    const userId = req.user.id;
    const userType = req.user.type;

    let query = {};

    if (userType === 'student') {
      // Get student info to get studentId
      const student = await Student.findById(userId);
      if (student) {
        const studentId = student.studentId;
        query.hostStudentId = studentId;
      } else {
        return res.status(404).json({
          success: false,
          message: 'Student not found'
        });
      }
    } else {
      // For lecturers, use the userId directly
      query.host = userId;
    }

    // Filter by status
    if (status) {
      query.status = status;
    }

    // Filter by year
    if (year) {
      query.year = year;
    }

    // Filter by semester
    if (semester) {
      query.semester = semester;
    }

    // Filter by module
    if (module) {
      query.module = { $regex: module, $options: 'i' };
    }

    // Search functionality
    if (search) {
      query.$and = query.$and || [];
      query.$and.push({
        $or: [
          { title: { $regex: search, $options: 'i' } },
          { description: { $regex: search, $options: 'i' } },
          { hostName: { $regex: search, $options: 'i' } }
        ]
      });
    }

    const skip = (page - 1) * limit;

    const meetings = await Meeting.find(query)
      .populate('host', 'name email')
      .populate('participants.userId', 'name email')
      .sort({ startTime: 1 })
      .skip(skip)
      .limit(parseInt(limit));

    // Add computed status to each meeting
    const meetingsWithStatus = [];
    for (const meeting of meetings) {
      const meetingObj = meeting.toObject();
      const status = getMeetingStatus(meeting);
      
      // Check if user is the host based on user type
      let isHost = false;
      if (req.user && req.user.id) {
        if (req.user.type === 'student') {
          // For students, check hostStudentId
          const student = await Student.findById(req.user.id);
          if (student && student.studentId === meeting.hostStudentId) {
            isHost = true;
          }
        } else {
          // For lecturers, check host ObjectId
          isHost = meeting.host.toString() === req.user.id;
        }
      }
      
      meetingObj.computedStatus = status;
      meetingObj.isHost = isHost;
      meetingObj.canStart = isHost && (status === 'starting-soon' || status === 'upcoming');
      meetingObj.canJoin = status === 'in-progress';
      meetingsWithStatus.push(meetingObj);
    }

    res.json({
      success: true,
      data: meetingsWithStatus,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: await Meeting.countDocuments(query),
        pages: Math.ceil(await Meeting.countDocuments(query) / limit)
      }
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
};

// Get all public meetings (for joining)
const getPublicMeetings = async (req, res) => {
  try {
    const {
      status,
      year,
      semester,
      module,
      search,
      page = 1,
      limit = 10
    } = req.query;

    let query = {};

    // Only show public meetings that are not completed
    query.isPublic = true;
    query.status = { $ne: 'completed' };

    // Filter by status
    if (status) {
      query.status = status;
    }

    // Filter by year
    if (year) {
      query.year = year;
    }

    // Filter by semester
    if (semester) {
      query.semester = semester;
    }

    // Filter by module
    if (module) {
      query.module = { $regex: module, $options: 'i' };
    }

    // Search functionality
    if (search) {
      query.$and = query.$and || [];
      query.$and.push({
        $or: [
          { title: { $regex: search, $options: 'i' } },
          { description: { $regex: search, $options: 'i' } },
          { hostName: { $regex: search, $options: 'i' } }
        ]
      });
    }

    const skip = (page - 1) * limit;

    const meetings = await Meeting.find(query)
      .populate('host', 'name email')
      .populate('participants.userId', 'name email')
      .sort({ startTime: 1 })
      .skip(skip)
      .limit(parseInt(limit));

    // Add computed status to each meeting
    const meetingsWithStatus = [];
    for (const meeting of meetings) {
      const meetingObj = meeting.toObject();
      const status = getMeetingStatus(meeting);
      
      meetingObj.computedStatus = status;
      meetingObj.isHost = false; // Will be determined on frontend
      meetingObj.canStart = false; // Will be determined on frontend
      meetingObj.canJoin = status !== 'ended' && status !== 'completed'; // Show join button for all non-ended meetings
      meetingObj.status = status; // Update the status to use computed status
      meetingsWithStatus.push(meetingObj);
    }

    res.json({
      success: true,
      data: meetingsWithStatus,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: await Meeting.countDocuments(query),
        pages: Math.ceil(await Meeting.countDocuments(query) / limit)
      }
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
};

// Participate in a meeting
const participateInMeeting = async (req, res) => {
  try {
    const { meetingId } = req.params;
    const meeting = await Meeting.findById(meetingId);

    if (!meeting) {
      return res.status(404).json({
        success: false,
        message: 'Meeting not found'
      });
    }

    // Check if meeting is public
    if (!meeting.isPublic) {
      return res.status(403).json({
        success: false,
        message: 'This meeting is not public'
      });
    }

    // Check if meeting is not completed
    if (meeting.status === 'completed') {
      return res.status(400).json({
        success: false,
        message: 'This meeting has already ended'
      });
    }

    // Check if user is already a participant
    const isAlreadyParticipant = meeting.participants.some(
      p => p.userId.toString() === req.user.id
    );

    if (isAlreadyParticipant) {
      return res.status(400).json({
        success: false,
        message: 'You are already participating in this meeting'
      });
    }

    // Check if meeting is full
    if (meeting.participants.length >= meeting.maxParticipants) {
      return res.status(400).json({
        success: false,
        message: 'This meeting is full'
      });
    }

    // Get user info
    let userInfo;
    if (req.user.type === 'student') {
      const student = await Student.findById(req.user.id);
      userInfo = {
        userId: student._id,
        email: student.email,
        name: student.name,
        role: 'participant',
        joinedAt: new Date()
      };
    } else {
      const lecturer = await Lecturer.findById(req.user.id);
      userInfo = {
        userId: lecturer._id,
        email: lecturer.email,
        name: lecturer.name,
        role: 'participant',
        joinedAt: new Date()
      };
    }

    // Add user to participants
    meeting.participants.push(userInfo);
    await meeting.save();

    // Populate the meeting data
    await meeting.populate('host', 'name email');
    await meeting.populate('participants.userId', 'name email');

    res.json({
      success: true,
      message: 'Successfully joined the meeting',
      data: {
        meeting,
        participantCount: meeting.participants.length
      }
    });

  } catch (error) {
    console.error('Error participating in meeting:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
};

// Leave participation in a meeting
const leaveParticipation = async (req, res) => {
  try {
    const { meetingId } = req.params;
    const meeting = await Meeting.findById(meetingId);

    if (!meeting) {
      return res.status(404).json({
        success: false,
        message: 'Meeting not found'
      });
    }

    // Find and remove user from participants
    const participantIndex = meeting.participants.findIndex(
      p => p.userId.toString() === req.user.id
    );

    if (participantIndex === -1) {
      return res.status(400).json({
        success: false,
        message: 'You are not participating in this meeting'
      });
    }

    // Remove participant
    meeting.participants.splice(participantIndex, 1);
    await meeting.save();

    // Populate the meeting data
    await meeting.populate('host', 'name email');
    await meeting.populate('participants.userId', 'name email');

    res.json({
      success: true,
      message: 'Successfully left the meeting',
      data: {
        meeting,
        participantCount: meeting.participants.length
      }
    });

  } catch (error) {
    console.error('Error leaving participation:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
};

function getMeetingStatus(meeting) {
  const now = new Date();
  const start = new Date(meeting.startTime);
  const end = new Date(meeting.endTime);
  
  // If meeting has been manually started, prioritize that status
  if (meeting.status === 'in-progress') {
    return 'in-progress';
  }
  
  if (meeting.status === 'completed' || meeting.status === 'ended') return 'ended';
  if (now < start) {
    const diff = (start - now) / 60000;
    if (diff <= 15) return 'starting-soon';
    return 'upcoming';
  }
  if (now >= start && now <= end) return 'in-progress';
  return 'ended';
}

module.exports = {
  createMeeting,
  getMeetings,
  getMeetingById,
  updateMeeting,
  deleteMeeting,
  joinMeeting,
  leaveMeeting,
  startMeeting,
  endMeeting,
  addChatMessage,
  addParticipants,
  removeParticipant,
  startRecording,
  stopRecording,
  addRecordingFile,
  getRecordingFiles,
  getMeetingStats,
  getMyMeetings,
  getPublicMeetings,
  participateInMeeting,
  leaveParticipation
}; 