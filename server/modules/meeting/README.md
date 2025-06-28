# Meeting Module Documentation

## Overview
The Meeting module provides comprehensive functionality for scheduling, managing, and participating in real-time video meetings with WebRTC support.

## Features

### Core Meeting Management
- ✅ Create meetings with detailed information (topic, date, time, duration, degree, year, semester, module)
- ✅ Update meeting details (host only)
- ✅ Delete meetings (host only)
- ✅ View all meetings or filter by host
- ✅ Real-time meeting status tracking

### Participant Management
- ✅ Join meetings as participants
- ✅ Leave meetings
- ✅ View participant lists
- ✅ Host controls and permissions

### Real-time Communication
- ✅ WebRTC video/audio streaming
- ✅ Screen sharing
- ✅ Real-time chat
- ✅ Participant management
- ✅ Meeting recording (host only)

### Meeting Status
- **Upcoming**: Meeting hasn't started yet
- **Starting Soon**: Meeting starts within 15 minutes
- **In Progress**: Meeting is currently active
- **Ended**: Meeting has finished

## API Endpoints

### Authentication Required
All endpoints require a valid JWT token in the Authorization header:
```
Authorization: Bearer <token>
```

### Meeting CRUD Operations

#### Create Meeting
```http
POST /api/meetings
Content-Type: application/json

{
  "topic": "AI Tutorial Session",
  "date": "2024-12-30",
  "time": "14:00",
  "duration": "60",
  "degree": "BSc in Information Technology",
  "year": "Year 3",
  "semester": "Semester 1",
  "module": "AI",
  "email": "host@example.com",
  "description": "Tutorial session on Neural Networks"
}
```

#### Get All Meetings
```http
GET /api/meetings
GET /api/meetings?hostOnly=true
GET /api/meetings?year=Year 3&module=AI
```

#### Get Meeting by ID
```http
GET /api/meetings/:id
```

#### Update Meeting
```http
PUT /api/meetings/:id
Content-Type: application/json

{
  "topic": "Updated Topic",
  "description": "Updated description"
}
```

#### Delete Meeting
```http
DELETE /api/meetings/:id
```

### Participant Management

#### Join Meeting
```http
POST /api/meetings/:id/join
```

#### Leave Meeting
```http
POST /api/meetings/:id/leave
```

### Meeting Controls

#### Start Meeting
```http
POST /api/meetings/:id/start
```

#### End Meeting
```http
POST /api/meetings/:id/end
```

### Chat System

#### Add Chat Message
```http
POST /api/meetings/:id/chat
Content-Type: application/json

{
  "message": "Hello everyone!"
}
```

### Recording (Host Only)

#### Start Recording
```http
POST /api/meetings/:id/recording/start
```

#### Stop Recording
```http
POST /api/meetings/:id/recording/stop
```

#### Get Recording Files
```http
GET /api/meetings/:id/recordings
```

## Database Schema

### Meeting Model
```javascript
{
  title: String,           // Meeting topic
  description: String,     // Meeting description
  host: ObjectId,          // Reference to User (host)
  hostName: String,        // Host's name
  hostEmail: String,       // Host's email
  startTime: Date,         // Meeting start time
  endTime: Date,           // Computed end time
  duration: Number,        // Duration in minutes
  degree: String,          // Degree program
  year: String,            // Year (Year 1-4)
  semester: String,        // Semester (Semester 1-2)
  module: String,          // Module name
  meetingLink: String,     // Meeting URL
  maxParticipants: Number, // Max participants allowed
  isPublic: Boolean,       // Public/private meeting
  status: String,          // Meeting status
  participants: [{         // Participant list
    userId: ObjectId,
    email: String,
    name: String,
    role: String,
    joinedAt: Date
  }],
  chatHistory: [{          // Chat messages
    sender: ObjectId,
    message: String,
    timestamp: Date
  }],
  recordingFiles: [{       // Recording files
    filename: String,
    path: String,
    size: Number,
    duration: Number,
    createdAt: Date
  }],
  isRecording: Boolean,    // Recording status
  createdAt: Date,
  updatedAt: Date
}
```

## Frontend Integration

### MyMeetingsPage
- Displays meetings hosted by the current user
- Create, edit, and delete meetings
- Start/join meetings
- Real-time status updates

### JoinMeetingPage
- Browse all available meetings
- Search and filter meetings
- Join/leave meetings
- Navigate to meeting room

### MeetingPage (Real-time)
- WebRTC video/audio streaming
- Screen sharing
- Chat functionality
- Participant management
- Recording controls (host only)

## WebSocket Events

### Client to Server
- `join-meeting`: Join a meeting room
- `leave-meeting`: Leave a meeting room
- `chat-message`: Send chat message
- `offer`: WebRTC offer
- `answer`: WebRTC answer
- `ice-candidate`: ICE candidate
- `screen-share-start`: Start screen sharing
- `screen-share-stop`: Stop screen sharing
- `recording-start`: Start recording (host only)
- `recording-stop`: Stop recording (host only)

### Server to Client
- `user-joined`: New user joined
- `user-left`: User left
- `chat-message`: New chat message
- `offer`: WebRTC offer
- `answer`: WebRTC answer
- `ice-candidate`: ICE candidate
- `screen-share-started`: Screen sharing started
- `screen-share-stopped`: Screen sharing stopped
- `recording-started`: Recording started
- `recording-stopped`: Recording stopped

## Testing

Run the test script to verify API functionality:
```bash
cd server
node test_meeting_api.js
```

## Security Features

- JWT authentication required for all endpoints
- Host-only permissions for meeting updates/deletion
- Host-only permissions for recording controls
- Input validation and sanitization
- Rate limiting on chat messages
- Secure WebRTC signaling

## Error Handling

The API returns consistent error responses:
```javascript
{
  "success": false,
  "message": "Error description",
  "error": "Detailed error message"
}
```

Common HTTP status codes:
- `200`: Success
- `201`: Created
- `400`: Bad Request (validation errors)
- `401`: Unauthorized (invalid/missing token)
- `403`: Forbidden (insufficient permissions)
- `404`: Not Found
- `500`: Internal Server Error

## Environment Variables

Required environment variables:
```env
JWT_SECRET=your_jwt_secret
MONGODB_URI=your_mongodb_connection_string
```

## Dependencies

### Backend
- `express`: Web framework
- `mongoose`: MongoDB ODM
- `jsonwebtoken`: JWT authentication
- `socket.io`: WebSocket server
- `multer`: File upload handling

### Frontend
- `react`: UI framework
- `socket.io-client`: WebSocket client
- `webrtc-adapter`: WebRTC compatibility
- `moment`: Date/time handling 