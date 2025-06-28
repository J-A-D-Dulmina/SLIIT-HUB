const mongoose = require('mongoose');

const meetingSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    trim: true,
    default: ''
  },
  host: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Student',
    required: true
  },
  hostEmail: {
    type: String,
    required: true,
    trim: true
  },
  hostName: {
    type: String,
    required: true,
    trim: true
  },
  hostStudentId: {
    type: String,
    required: true
  },
  startTime: {
    type: Date,
    required: true
  },
  endTime: {
    type: Date,
    required: true
  },
  duration: {
    type: Number, // in minutes
    required: true,
    min: 15,
    max: 480 // 8 hours max
  },
  degree: {
    type: String,
    required: true,
    enum: ['BSc in Information Technology', 'BSc in Software Engineering', 'BSc in Computer Science', 'BSc in Data Science']
  },
  year: {
    type: String,
    required: true,
    enum: ['Year 1', 'Year 2', 'Year 3', 'Year 4']
  },
  semester: {
    type: String,
    required: true,
    enum: ['Semester 1', 'Semester 2']
  },
  module: {
    type: String,
    required: true,
    trim: true
  },
  meetingLink: {
    type: String,
    default: ''
  },
  status: {
    type: String,
    enum: ['scheduled', 'in-progress', 'completed', 'cancelled', 'recording'],
    default: 'scheduled'
  },
  participants: [{
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Student'
    },
    email: String,
    name: String,
    role: {
      type: String,
      enum: ['host', 'participant', 'co-host'],
      default: 'participant'
    },
    joinedAt: Date,
    leftAt: Date
  }],
  maxParticipants: {
    type: Number,
    default: 50,
    min: 1,
    max: 100
  },
  isPublic: {
    type: Boolean,
    default: false
  },
  recordingUrl: {
    type: String,
    default: ''
  },
  chatHistory: [{
    sender: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Student'
    },
    senderName: String,
    message: String,
    timestamp: {
      type: Date,
      default: Date.now
    }
  }],
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  },
  password: {
    type: String,
    trim: true
  },
  settings: {
    allowChat: {
      type: Boolean,
      default: true
    },
    allowScreenShare: {
      type: Boolean,
      default: true
    },
    allowRecording: {
      type: Boolean,
      default: true
    },
    muteOnEntry: {
      type: Boolean,
      default: false
    },
    videoOnEntry: {
      type: Boolean,
      default: true
    },
    waitingRoom: {
      type: Boolean,
      default: false
    }
  },
  recordings: [{
    filename: {
      type: String,
      required: true
    },
    fileSize: {
      type: Number // in bytes
    },
    duration: {
      type: Number // in seconds
    },
    recordedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Student',
      required: true
    },
    recordedAt: {
      type: Date,
      default: Date.now
    },
    downloadUrl: {
      type: String
    },
    status: {
      type: String,
      enum: ['processing', 'completed', 'failed'],
      default: 'processing'
    }
  }],
  recordingStatus: {
    isRecording: {
      type: Boolean,
      default: false
    },
    startedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Student'
    },
    startedAt: {
      type: Date
    },
    stoppedAt: {
      type: Date
    },
    duration: {
      type: Number // in seconds
    }
  },
  notes: {
    type: String,
    default: ''
  },
  tags: [{
    type: String,
    trim: true
  }],
  startedAt: {
    type: Date
  },
  endedAt: {
    type: Date
  }
}, { timestamps: true });

// Index for efficient queries
meetingSchema.index({ host: 1, startTime: 1 });
meetingSchema.index({ status: 1, startTime: 1 });
meetingSchema.index({ 'participants.userId': 1 });

// Virtual for meeting duration in minutes
meetingSchema.virtual('durationMinutes').get(function() {
  return Math.round((this.endTime - this.startTime) / (1000 * 60));
});

// Virtual for current recording duration
meetingSchema.virtual('currentRecordingDuration').get(function() {
  if (this.recordingStatus.isRecording && this.recordingStatus.startedAt) {
    return Math.floor((Date.now() - this.recordingStatus.startedAt) / 1000);
  }
  return this.recordingStatus.duration || 0;
});

// Pre-save middleware to update endTime based on duration
meetingSchema.pre('save', function(next) {
  if (this.isModified('startTime') || this.isModified('duration')) {
    this.endTime = new Date(this.startTime.getTime() + (this.duration * 60 * 1000));
  }
  this.updatedAt = new Date();
  next();
});

// Method to check if meeting is currently active
meetingSchema.methods.isActive = function() {
  const now = new Date();
  return this.startTime <= now && this.endTime >= now;
};

// Method to check if meeting can be started
meetingSchema.methods.canStart = function() {
  const now = new Date();
  const timeDiff = (this.startTime - now) / (1000 * 60); // minutes
  return timeDiff <= 15 && timeDiff >= -120; // Allow 15 minutes early, 2 hours late
};

// Method to get meeting status based on time
meetingSchema.methods.getStatus = function() {
  const now = new Date();
  
  if (this.status === 'cancelled') return 'cancelled';
  if (this.status === 'completed') return 'completed';
  
  if (now < this.startTime) {
    const timeDiff = (this.startTime - now) / (1000 * 60);
    return timeDiff <= 15 ? 'starting-soon' : 'upcoming';
  }
  
  if (now >= this.startTime && now <= this.endTime) {
    return 'in-progress';
  }
  
  return 'ended';
};

// Method to start recording
meetingSchema.methods.startRecording = function(userId) {
  this.recordingStatus.isRecording = true;
  this.recordingStatus.startedBy = userId;
  this.recordingStatus.startedAt = new Date();
  this.status = 'recording';
  return this.save();
};

// Method to stop recording
meetingSchema.methods.stopRecording = function() {
  this.recordingStatus.isRecording = false;
  this.recordingStatus.stoppedAt = new Date();
  this.recordingStatus.duration = this.currentRecordingDuration;
  this.status = 'in-progress';
  return this.save();
};

// Method to add recording file
meetingSchema.methods.addRecording = function(recordingData) {
  this.recordings.push(recordingData);
  return this.save();
};

// Method to add participant
meetingSchema.methods.addParticipant = function(userId, name, email, role = 'participant') {
  const existingParticipant = this.participants.find(p => p.userId.toString() === userId.toString());
  
  if (!existingParticipant) {
    this.participants.push({
      userId,
      name,
      email,
      role,
      joinedAt: new Date()
    });
  } else {
    // Update existing participant
    existingParticipant.joinedAt = new Date();
    existingParticipant.leftAt = null;
  }
  
  return this.save();
};

// Method to remove participant
meetingSchema.methods.removeParticipant = function(userId) {
  const participant = this.participants.find(p => p.userId.toString() === userId.toString());
  if (participant) {
    participant.leftAt = new Date();
  }
  return this.save();
};

// Method to add chat message
meetingSchema.methods.addChatMessage = function(senderId, senderName, message) {
  this.chatHistory.push({
    sender: senderId,
    senderName,
    message,
    timestamp: new Date()
  });
  return this.save();
};

// Static method to get upcoming meetings
meetingSchema.statics.getUpcomingMeetings = function(userId) {
  return this.find({
    $or: [
      { host: userId },
      { 'participants.userId': userId }
    ],
    startTime: { $gte: new Date() },
    status: { $in: ['scheduled', 'in-progress', 'recording'] }
  }).populate('host', 'name email').sort({ startTime: 1 });
};

// Static method to get past meetings
meetingSchema.statics.getPastMeetings = function(userId) {
  return this.find({
    $or: [
      { host: userId },
      { 'participants.userId': userId }
    ],
    status: { $in: ['completed', 'cancelled'] }
  }).populate('host', 'name email').sort({ startTime: -1 });
};

// Static method to get meetings by status
meetingSchema.statics.getMeetingsByStatus = function(userId, status) {
  return this.find({
    $or: [
      { host: userId },
      { 'participants.userId': userId }
    ],
    status: status
  }).populate('host', 'name email').sort({ startTime: -1 });
};

module.exports = mongoose.model('Meeting', meetingSchema); 