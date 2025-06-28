const WebSocket = require('ws');
const jwt = require('jsonwebtoken');
const Meeting = require('../modules/meeting/model');
const Student = require('../modules/user/model');

class MeetingSocketServer {
  constructor(server) {
    this.wss = new WebSocket.Server({ server });
    this.rooms = new Map(); // Map of meetingId -> Set of WebSocket connections
    this.connections = new Map(); // Map of WebSocket -> user info
    this.rtcConnections = new Map(); // Map of meetingId -> Map of userId -> RTCPeerConnection info
    
    this.setupWebSocketServer();
  }

  setupWebSocketServer() {
    this.wss.on('connection', async (ws, req) => {
      try {
        // Authenticate the connection
        const user = await this.authenticateConnection(req);
        if (!user) {
          ws.close(1008, 'Authentication failed');
          return;
        }

        // Store user info with connection
        this.connections.set(ws, {
          userId: user._id,
          email: user.email,
          name: user.name
        });

        console.log(`WebSocket connected: ${user.name} (${user.email})`);

        // Handle incoming messages
        ws.on('message', async (data) => {
          try {
            const message = JSON.parse(data);
            await this.handleMessage(ws, message, user);
          } catch (error) {
            console.error('Error handling WebSocket message:', error);
            this.sendError(ws, 'Invalid message format');
          }
        });

        // Handle connection close
        ws.on('close', () => {
          this.handleDisconnection(ws, user);
        });

        // Handle errors
        ws.on('error', (error) => {
          console.error('WebSocket error:', error);
          this.handleDisconnection(ws, user);
        });

      } catch (error) {
        console.error('Error setting up WebSocket connection:', error);
        ws.close(1011, 'Internal server error');
      }
    });
  }

  async authenticateConnection(req) {
    try {
      // Parse cookies from request headers
      const cookies = this.parseCookies(req.headers.cookie);
      const token = cookies.token;

      if (!token) {
        console.log('No token found in cookies');
        return null;
      }

      // Verify JWT token
      const decoded = jwt.verify(token, process.env.JWT_SECRET || 'changeme');
      
      // Get user from database
      const user = await Student.findById(decoded.id).select('_id email name');
      return user;

    } catch (error) {
      console.error('Authentication error:', error);
      return null;
    }
  }

  parseCookies(cookieHeader) {
    const cookies = {};
    if (cookieHeader) {
      cookieHeader.split(';').forEach(cookie => {
        const [name, value] = cookie.trim().split('=');
        if (name && value) {
          cookies[name] = value;
        }
      });
    }
    return cookies;
  }

  async handleMessage(ws, message, user) {
    const { type, meetingId, data } = message;

    switch (type) {
      case 'join-meeting':
        await this.handleJoinMeeting(ws, meetingId, user);
        break;

      case 'leave-meeting':
        await this.handleLeaveMeeting(ws, meetingId, user);
        break;

      case 'chat-message':
        await this.handleChatMessage(ws, meetingId, user, data);
        break;

      case 'rtc-offer':
        await this.handleRTCOffer(ws, meetingId, user, data);
        break;

      case 'rtc-answer':
        await this.handleRTCAnswer(ws, meetingId, user, data);
        break;

      case 'rtc-ice-candidate':
        await this.handleRTCIceCandidate(ws, meetingId, user, data);
        break;

      case 'user-joined':
        await this.handleUserJoined(ws, meetingId, user);
        break;

      case 'user-left':
        await this.handleUserLeft(ws, meetingId, user);
        break;

      case 'screen-share-start':
        await this.handleScreenShareStart(ws, meetingId, user);
        break;

      case 'screen-share-stop':
        await this.handleScreenShareStop(ws, meetingId, user);
        break;

      case 'mute-audio':
        await this.handleMuteAudio(ws, meetingId, user, data);
        break;

      case 'mute-video':
        await this.handleMuteVideo(ws, meetingId, user, data);
        break;

      case 'raise-hand':
        await this.handleRaiseHand(ws, meetingId, user);
        break;

      case 'recording-start':
        await this.handleRecordingStart(ws, meetingId, user);
        break;

      case 'recording-stop':
        await this.handleRecordingStop(ws, meetingId, user);
        break;

      default:
        this.sendError(ws, `Unknown message type: ${type}`);
    }
  }

  async handleJoinMeeting(ws, meetingId, user) {
    try {
      // Verify meeting exists and user can join
      const meeting = await Meeting.findById(meetingId);
      if (!meeting) {
        this.sendError(ws, 'Meeting not found');
        return;
      }

      // Check if user is a participant
      const isParticipant = meeting.participants.some(
        p => p.userId.toString() === user._id.toString()
      );

      if (!isParticipant) {
        this.sendError(ws, 'You are not a participant in this meeting');
        return;
      }

      // Add connection to room
      if (!this.rooms.has(meetingId)) {
        this.rooms.set(meetingId, new Set());
      }
      this.rooms.get(meetingId).add(ws);

      // Store meeting info with connection
      this.connections.get(ws).meetingId = meetingId;

      // Send confirmation
      this.sendToClient(ws, {
        type: 'meeting-joined',
        meetingId,
        data: {
          meeting: {
            id: meeting._id,
            title: meeting.title,
            host: meeting.host.toString(),
            participants: meeting.participants.map(p => ({
              userId: p.userId.toString(),
              name: p.name,
              email: p.email,
              role: p.role
            }))
          }
        }
      });

      // Notify other participants
      this.broadcastToRoom(meetingId, ws, {
        type: 'user-joined',
        meetingId,
        data: {
          userId: user._id,
          name: user.name,
          email: user.email
        }
      });

    } catch (error) {
      console.error('Error joining meeting:', error);
      this.sendError(ws, 'Failed to join meeting');
    }
  }

  async handleLeaveMeeting(ws, meetingId, user) {
    try {
      // Remove from room
      const room = this.rooms.get(meetingId);
      if (room) {
        room.delete(ws);
        if (room.size === 0) {
          this.rooms.delete(meetingId);
        }
      }

      // Clear meeting info from connection
      const connection = this.connections.get(ws);
      if (connection) {
        delete connection.meetingId;
      }

      // Notify other participants
      this.broadcastToRoom(meetingId, ws, {
        type: 'user-left',
        meetingId,
        data: {
          userId: user._id,
          name: user.name,
          email: user.email
        }
      });

    } catch (error) {
      console.error('Error leaving meeting:', error);
    }
  }

  async handleChatMessage(ws, meetingId, user, data) {
    try {
      const { message } = data;

      // Save message to database
      await Meeting.findByIdAndUpdate(meetingId, {
        $push: {
          chatHistory: {
            sender: user._id,
            senderName: user.name,
            message: message,
            timestamp: new Date()
          }
        }
      });

      // Broadcast to room
      this.broadcastToRoom(meetingId, null, {
        type: 'chat-message',
        meetingId,
        data: {
          sender: user._id,
          senderName: user.name,
          message: message,
          timestamp: new Date()
        }
      });

    } catch (error) {
      console.error('Error handling chat message:', error);
      this.sendError(ws, 'Failed to send message');
    }
  }

  async handleRTCOffer(ws, meetingId, user, data) {
    const { targetUserId, offer } = data;
    
    // Forward offer to target user
    const targetWs = this.findUserConnection(meetingId, targetUserId);
    if (targetWs) {
      this.sendToClient(targetWs, {
        type: 'rtc-offer',
        meetingId,
        data: {
          fromUserId: user._id,
          offer: offer
        }
      });
    }
  }

  async handleRTCAnswer(ws, meetingId, user, data) {
    const { targetUserId, answer } = data;
    
    // Forward answer to target user
    const targetWs = this.findUserConnection(meetingId, targetUserId);
    if (targetWs) {
      this.sendToClient(targetWs, {
        type: 'rtc-answer',
        meetingId,
        data: {
          fromUserId: user._id,
          answer: answer
        }
      });
    }
  }

  async handleRTCIceCandidate(ws, meetingId, user, data) {
    const { targetUserId, candidate } = data;
    
    // Forward ICE candidate to target user
    const targetWs = this.findUserConnection(meetingId, targetUserId);
    if (targetWs) {
      this.sendToClient(targetWs, {
        type: 'rtc-ice-candidate',
        meetingId,
        data: {
          fromUserId: user._id,
          candidate: candidate
        }
      });
    }
  }

  async handleUserJoined(ws, meetingId, user) {
    // This is handled in handleJoinMeeting
  }

  async handleUserLeft(ws, meetingId, user) {
    // This is handled in handleLeaveMeeting
  }

  async handleScreenShareStart(ws, meetingId, user) {
    this.broadcastToRoom(meetingId, ws, {
      type: 'screen-share-start',
      meetingId,
      data: {
        userId: user._id
      }
    });
  }

  async handleScreenShareStop(ws, meetingId, user) {
    this.broadcastToRoom(meetingId, ws, {
      type: 'screen-share-stop',
      meetingId,
      data: {
        userId: user._id
      }
    });
  }

  async handleMuteAudio(ws, meetingId, user, data) {
    const { muted } = data;
    this.broadcastToRoom(meetingId, ws, {
      type: 'mute-audio',
      meetingId,
      data: {
        userId: user._id,
        muted: muted
      }
    });
  }

  async handleMuteVideo(ws, meetingId, user, data) {
    const { muted } = data;
    this.broadcastToRoom(meetingId, ws, {
      type: 'mute-video',
      meetingId,
      data: {
        userId: user._id,
        muted: muted
      }
    });
  }

  async handleRaiseHand(ws, meetingId, user) {
    this.broadcastToRoom(meetingId, ws, {
      type: 'raise-hand',
      meetingId,
      data: {
        userId: user._id
      }
    });
  }

  async handleRecordingStart(ws, meetingId, user) {
    try {
      // Verify user is host
      const meeting = await Meeting.findById(meetingId);
      if (!meeting) {
        this.sendError(ws, 'Meeting not found');
        return;
      }

      if (meeting.host.toString() !== user._id.toString()) {
        this.sendError(ws, 'Only the host can start recording');
        return;
      }

      // Update meeting status
      await Meeting.findByIdAndUpdate(meetingId, {
        status: 'recording',
        'recordingStatus.isRecording': true,
        'recordingStatus.startedBy': user._id,
        'recordingStatus.startedAt': new Date()
      });

      // Broadcast to room
      this.broadcastToRoom(meetingId, null, {
        type: 'recording-start',
        meetingId,
        data: {
          startedBy: user._id
        }
      });

    } catch (error) {
      console.error('Error starting recording:', error);
      this.sendError(ws, 'Failed to start recording');
    }
  }

  async handleRecordingStop(ws, meetingId, user) {
    try {
      // Verify user is host
      const meeting = await Meeting.findById(meetingId);
      if (!meeting) {
        this.sendError(ws, 'Meeting not found');
        return;
      }

      if (meeting.host.toString() !== user._id.toString()) {
        this.sendError(ws, 'Only the host can stop recording');
        return;
      }

      // Update meeting status
      await Meeting.findByIdAndUpdate(meetingId, {
        status: 'in-progress',
        'recordingStatus.isRecording': false,
        'recordingStatus.stoppedAt': new Date()
      });

      // Broadcast to room
      this.broadcastToRoom(meetingId, null, {
        type: 'recording-stop',
        meetingId,
        data: {
          stoppedBy: user._id
        }
      });

    } catch (error) {
      console.error('Error stopping recording:', error);
      this.sendError(ws, 'Failed to stop recording');
    }
  }

  handleDisconnection(ws, user) {
    try {
      // Get meeting info from connection
      const connection = this.connections.get(ws);
      if (connection && connection.meetingId) {
        const meetingId = connection.meetingId;
        
        // Remove from room
        const room = this.rooms.get(meetingId);
        if (room) {
          room.delete(ws);
          if (room.size === 0) {
            this.rooms.delete(meetingId);
          }
        }

        // Notify other participants
        this.broadcastToRoom(meetingId, ws, {
          type: 'user-left',
          meetingId,
          data: {
            userId: user._id,
            name: user.name,
            email: user.email
          }
        });
      }

      // Remove connection
      this.connections.delete(ws);
      
      console.log(`WebSocket disconnected: ${user.name} (${user.email})`);

    } catch (error) {
      console.error('Error handling disconnection:', error);
    }
  }

  findUserConnection(meetingId, userId) {
    if (!this.rooms.has(meetingId)) return null;

    for (const connection of this.rooms.get(meetingId)) {
      const connectionInfo = this.connections.get(connection);
      if (connectionInfo && connectionInfo.userId === userId) {
        return connection;
      }
    }
    return null;
  }

  broadcastToRoom(meetingId, excludeWs, message) {
    if (!this.rooms.has(meetingId)) return;

    this.rooms.get(meetingId).forEach(connection => {
      if (connection !== excludeWs && connection.readyState === WebSocket.OPEN) {
        this.sendToClient(connection, message);
      }
    });
  }

  sendToClient(ws, message) {
    if (ws.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify(message));
    }
  }

  sendError(ws, error) {
    this.sendToClient(ws, {
      type: 'error',
      data: { message: error }
    });
  }

  // Get room statistics
  getRoomStats() {
    const stats = {};
    for (const [meetingId, connections] of this.rooms) {
      stats[meetingId] = {
        participantCount: connections.size,
        participants: Array.from(connections).map(ws => {
          const info = this.connections.get(ws);
          return {
            userId: info.userId,
            name: info.name,
            email: info.email
          };
        })
      };
    }
    return stats;
  }
}

module.exports = MeetingSocketServer; 