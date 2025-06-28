# Real-Time Meeting System API Documentation

## Overview
This document describes the real-time meeting system with WebRTC video conferencing, chat, screen sharing, and recording capabilities.

## WebSocket Events

### Connection
- **URL**: `ws://localhost:5000?token=<JWT_TOKEN>`
- **Authentication**: JWT token required in query string

### Client to Server Events

#### Join Meeting
```javascript
{
  "type": "join-meeting",
  "meetingId": "meeting_id_here"
}
```

#### Leave Meeting
```javascript
{
  "type": "leave-meeting",
  "meetingId": "meeting_id_here"
}
```

#### Chat Message
```javascript
{
  "type": "chat-message",
  "meetingId": "meeting_id_here",
  "data": {
    "message": "Hello everyone!"
  }
}
```

#### RTC Offer
```javascript
{
  "type": "rtc-offer",
  "meetingId": "meeting_id_here",
  "data": {
    "targetUserId": "user_id_here",
    "offer": {
      "type": "offer",
      "sdp": "session_description_here"
    }
  }
}
```

#### RTC Answer
```javascript
{
  "type": "rtc-answer",
  "meetingId": "meeting_id_here",
  "data": {
    "targetUserId": "user_id_here",
    "answer": {
      "type": "answer",
      "sdp": "session_description_here"
    }
  }
}
```

#### RTC ICE Candidate
```javascript
{
  "type": "rtc-ice-candidate",
  "meetingId": "meeting_id_here",
  "data": {
    "targetUserId": "user_id_here",
    "candidate": {
      "candidate": "candidate_string_here",
      "sdpMLineIndex": 0,
      "sdpMid": "0"
    }
  }
}
```

#### Screen Share Start
```javascript
{
  "type": "screen-share-start",
  "meetingId": "meeting_id_here"
}
```

#### Screen Share Stop
```javascript
{
  "type": "screen-share-stop",
  "meetingId": "meeting_id_here"
}
```

#### Mute Audio
```javascript
{
  "type": "mute-audio",
  "meetingId": "meeting_id_here",
  "data": {
    "muted": true
  }
}
```

#### Mute Video
```javascript
{
  "type": "mute-video",
  "meetingId": "meeting_id_here",
  "data": {
    "muted": true
  }
}
```

#### Raise Hand
```javascript
{
  "type": "raise-hand",
  "meetingId": "meeting_id_here"
}
```

#### Start Recording (Host Only)
```javascript
{
  "type": "recording-start",
  "meetingId": "meeting_id_here"
}
```

#### Stop Recording (Host Only)
```javascript
{
  "type": "recording-stop",
  "meetingId": "meeting_id_here"
}
```

### Server to Client Events

#### Meeting Joined
```javascript
{
  "type": "meeting-joined",
  "meetingId": "meeting_id_here",
  "data": {
    "meeting": {
      "id": "meeting_id",
      "title": "Meeting Title",
      "host": "host_user_id",
      "participants": [
        {
          "userId": "user_id",
          "name": "User Name",
          "email": "user@example.com",
          "role": "host"
        }
      ]
    }
  }
}
```

#### User Joined
```javascript
{
  "type": "user-joined",
  "data": {
    "userId": "user_id_here",
    "name": "User Name",
    "email": "user@example.com"
  }
}
```

#### User Left
```javascript
{
  "type": "user-left",
  "data": {
    "userId": "user_id_here",
    "name": "User Name"
  }
}
```

#### Chat Message
```javascript
{
  "type": "chat-message",
  "data": {
    "sender": {
      "userId": "user_id",
      "name": "User Name",
      "email": "user@example.com"
    },
    "message": "Hello everyone!",
    "timestamp": "2024-01-01T12:00:00.000Z"
  }
}
```

#### RTC Offer
```javascript
{
  "type": "rtc-offer",
  "data": {
    "fromUserId": "user_id_here",
    "fromName": "User Name",
    "offer": {
      "type": "offer",
      "sdp": "session_description_here"
    }
  }
}
```

#### RTC Answer
```javascript
{
  "type": "rtc-answer",
  "data": {
    "fromUserId": "user_id_here",
    "fromName": "User Name",
    "answer": {
      "type": "answer",
      "sdp": "session_description_here"
    }
  }
}
```

#### RTC ICE Candidate
```javascript
{
  "type": "rtc-ice-candidate",
  "data": {
    "fromUserId": "user_id_here",
    "fromName": "User Name",
    "candidate": {
      "candidate": "candidate_string_here",
      "sdpMLineIndex": 0,
      "sdpMid": "0"
    }
  }
}
```

#### Screen Share Events
```javascript
{
  "type": "screen-share-start",
  "data": {
    "userId": "user_id_here",
    "name": "User Name"
  }
}
```

```javascript
{
  "type": "screen-share-stop",
  "data": {
    "userId": "user_id_here",
    "name": "User Name"
  }
}
```

#### Mute Events
```javascript
{
  "type": "mute-audio",
  "data": {
    "userId": "user_id_here",
    "name": "User Name",
    "muted": true
  }
}
```

```javascript
{
  "type": "mute-video",
  "data": {
    "userId": "user_id_here",
    "name": "User Name",
    "muted": true
  }
}
```

#### Raise Hand
```javascript
{
  "type": "raise-hand",
  "data": {
    "userId": "user_id_here",
    "name": "User Name"
  }
}
```

#### Recording Events
```javascript
{
  "type": "recording-start",
  "data": {
    "userId": "user_id_here",
    "name": "User Name",
    "timestamp": "2024-01-01T12:00:00.000Z"
  }
}
```

```javascript
{
  "type": "recording-stop",
  "data": {
    "userId": "user_id_here",
    "name": "User Name",
    "timestamp": "2024-01-01T12:00:00.000Z"
  }
}
```

#### Error
```javascript
{
  "type": "error",
  "data": {
    "message": "Error description"
  }
}
```

## REST API Endpoints

### Meeting Management

#### Create Meeting
- **POST** `/api/meetings`
- **Body**:
```json
{
  "title": "Meeting Title",
  "description": "Meeting Description",
  "scheduledDate": "2024-01-01T12:00:00.000Z",
  "duration": 60,
  "participants": [
    {
      "userId": "user_id",
      "role": "participant"
    }
  ],
  "settings": {
    "allowChat": true,
    "allowScreenShare": true,
    "allowRecording": true,
    "muteOnEntry": false,
    "videoOnEntry": true,
    "waitingRoom": false
  }
}
```

#### Get Meetings
- **GET** `/api/meetings?status=scheduled&type=upcoming`
- **Query Parameters**:
  - `status`: scheduled, in-progress, completed, cancelled, recording
  - `type`: upcoming, past
  - `page`: page number
  - `limit`: items per page

#### Get Meeting
- **GET** `/api/meetings/:id`

#### Update Meeting
- **PUT** `/api/meetings/:id`
- **Body**: Same as create meeting (partial updates allowed)

#### Delete Meeting
- **DELETE** `/api/meetings/:id`

### Meeting Participation

#### Join Meeting
- **POST** `/api/meetings/:meetingId/join`

#### Leave Meeting
- **POST** `/api/meetings/:meetingId/leave`

#### Add Participants
- **POST** `/api/meetings/:id/participants`
- **Body**:
```json
{
  "participants": [
    {
      "userId": "user_id",
      "role": "participant"
    }
  ]
}
```

#### Remove Participant
- **DELETE** `/api/meetings/:meetingId/participants/:participantId`

### Recording Management

#### Start Recording
- **POST** `/api/meetings/:meetingId/recording/start`
- **Requirements**: User must be the meeting host

#### Stop Recording
- **POST** `/api/meetings/:meetingId/recording/stop`
- **Requirements**: User must be the meeting host

#### Add Recording File
- **POST** `/api/meetings/:meetingId/recordings`
- **Body**:
```json
{
  "filename": "meeting-recording-123.webm",
  "fileSize": 1048576,
  "duration": 3600,
  "downloadUrl": "https://example.com/recording.webm"
}
```

#### Get Recording Files
- **GET** `/api/meetings/:meetingId/recordings`

#### Get Meeting Statistics
- **GET** `/api/meetings/:meetingId/stats`

## WebRTC Configuration

### ICE Servers
```javascript
const rtcConfig = {
  iceServers: [
    { urls: 'stun:stun.l.google.com:19302' },
    { urls: 'stun:stun1.l.google.com:19302' },
    { urls: 'stun:stun2.l.google.com:19302' },
    { urls: 'stun:stun3.l.google.com:19302' },
    { urls: 'stun:stun4.l.google.com:19302' }
  ]
};
```

### Media Constraints
```javascript
const mediaConstraints = {
  video: true,
  audio: true
};
```

### Screen Share Constraints
```javascript
const screenConstraints = {
  video: true,
  audio: false
};
```

## Recording Features

### Recording Capabilities
- **Format**: WebM with VP9 video and Opus audio
- **Quality**: 2.5 Mbps video bitrate
- **Content**: Combined local and remote streams
- **Storage**: Automatic download to user's device
- **Permissions**: Only meeting host can start/stop recording

### Recording Workflow
1. Host clicks "Start Recording" button
2. System combines all participant streams
3. MediaRecorder captures combined stream
4. Recording data collected in chunks
5. When stopped, creates WebM file
6. Automatic download triggered
7. Recording metadata saved to database

### Recording Status Tracking
- Real-time recording duration display
- Visual recording indicators
- Recording notifications to all participants
- Recording history in meeting details

## Security Features

### Authentication
- JWT token required for all connections
- Token validation on WebSocket connection
- User authorization checks for all operations

### Meeting Access Control
- Only participants can join meetings
- Host-only operations (recording, participant management)
- Meeting link validation

### Data Privacy
- Chat messages stored in database
- Recording files stored locally (not on server)
- Participant information protected

## Error Handling

### Common Errors
- **Authentication Failed**: Invalid or expired token
- **Meeting Not Found**: Invalid meeting ID
- **Not Authorized**: User lacks required permissions
- **Recording Not Allowed**: Meeting settings disable recording
- **Already Recording**: Recording already in progress

### Error Response Format
```javascript
{
  "type": "error",
  "data": {
    "message": "Error description",
    "code": "ERROR_CODE"
  }
}
```

## Browser Compatibility

### Supported Browsers
- Chrome 74+
- Firefox 67+
- Safari 13+
- Edge 79+

### Required Features
- WebRTC (RTCPeerConnection)
- MediaRecorder API
- WebSocket API
- getUserMedia API
- getDisplayMedia API (for screen sharing)

## Performance Considerations

### Bandwidth Management
- Adaptive video quality based on connection
- Audio-only mode for poor connections
- Screen sharing optimization

### Resource Usage
- Automatic cleanup of media streams
- Memory management for recordings
- Connection pooling for WebSocket

### Scalability
- Room-based WebSocket connections
- Efficient peer-to-peer connections
- Minimal server resource usage

## Troubleshooting

### Common Issues
1. **Camera/Microphone Access**: Check browser permissions
2. **Connection Issues**: Verify STUN server availability
3. **Recording Problems**: Ensure MediaRecorder API support
4. **Screen Share**: Check getDisplayMedia API support

### Debug Information
- WebSocket connection status
- WebRTC connection statistics
- Recording status and progress
- Error logs and stack traces

---

This real-time meeting system provides a complete solution for online video conferencing with all essential features for educational and business use cases. 