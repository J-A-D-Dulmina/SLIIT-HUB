class WebRTCService {
  constructor() {
    this.localStream = null;
    this.remoteStreams = new Map();
    this.peerConnections = new Map();
    this.socket = null;
    this.meetingId = null;
    this.userId = null;
    this.userName = null;
    
    // Recording functionality
    this.mediaRecorder = null;
    this.recordedChunks = [];
    this.isRecording = false;
    this.recordingStartTime = null;
    this.recordingTimer = null;
    
    // Configuration for WebRTC
    this.rtcConfig = {
      iceServers: [
        { urls: 'stun:stun.l.google.com:19302' },
        { urls: 'stun:stun1.l.google.com:19302' },
        { urls: 'stun:stun2.l.google.com:19302' },
        { urls: 'stun:stun3.l.google.com:19302' },
        { urls: 'stun:stun4.l.google.com:19302' }
      ]
    };

    // Event callbacks
    this.onLocalStream = null;
    this.onRemoteStream = null;
    this.onUserJoined = null;
    this.onUserLeft = null;
    this.onChatMessage = null;
    this.onError = null;
    this.onRecordingStart = null;
    this.onRecordingStop = null;
    this.onRecordingTimeUpdate = null;
    this.onScreenShareStart = null;
    this.onScreenShareStop = null;
    this.onMeetingEnded = null;
  }

  // Initialize WebRTC service
  async initialize(meetingId, userId, userName) {
    this.meetingId = meetingId;
    this.userId = userId;
    this.userName = userName;

    // Connect to WebSocket
    await this.connectWebSocket();

    // Get user media
    await this.getUserMedia();

    return true;
  }

  // Connect to WebSocket server
  async connectWebSocket() {
    return new Promise((resolve, reject) => {
      // Get token from cookies
      const getCookie = (name) => {
        const value = `; ${document.cookie}`;
        const parts = value.split(`; ${name}=`);
        if (parts.length === 2) return parts.pop().split(';').shift();
        return null;
      };
      
      console.log('WebSocket: All cookies:', document.cookie);
      const token = getCookie('token');
      console.log('WebSocket: Token found:', !!token);
      console.log('WebSocket: Token length:', token ? token.length : 0);
      
      // Use WebSocket with token as query parameter
      const wsUrl = token ? `ws://localhost:5000?token=${encodeURIComponent(token)}` : 'ws://localhost:5000';
      console.log('WebSocket: Attempting to connect to:', wsUrl);
      
      this.socket = new WebSocket(wsUrl);

      this.socket.onmessage = (event) => {
        this.handleSocketMessage(JSON.parse(event.data));
      };

      this.socket.onerror = (error) => {
        console.error('WebSocket error:', error);
        console.error('WebSocket readyState:', this.socket.readyState);
        if (this.onError) this.onError('WebSocket connection failed');
        reject(error);
      };

      this.socket.onclose = (event) => {
        console.log('WebSocket disconnected. Code:', event.code, 'Reason:', event.reason);
        this.cleanup();
      };
      
      // Add timeout
      const timeoutId = setTimeout(() => {
        if (this.socket && this.socket.readyState === WebSocket.CONNECTING) {
          console.log('WebSocket connection timeout');
          this.socket.close();
          reject(new Error('WebSocket connection timeout'));
        }
      }, 10000); // 10 second timeout
      
      // Handle successful connection
      this.socket.onopen = () => {
        clearTimeout(timeoutId);
        console.log('WebSocket connected successfully');
        this.joinMeeting();
        resolve();
      };
    });
  }

  // Get user media (camera and microphone)
  async getUserMedia() {
    try {
      this.localStream = await navigator.mediaDevices.getUserMedia({
        video: true,
        audio: true
      });

      if (this.onLocalStream) {
        this.onLocalStream(this.localStream);
      }

      console.log('Local stream obtained');
    } catch (error) {
      console.error('Error getting user media:', error);
      
      // Handle specific error types
      if (error.name === 'NotReadableError' || error.name === 'NotAllowedError') {
        if (this.onError) this.onError('Camera/microphone is in use by another application. Please close other tabs or applications using your camera and try again.');
      } else if (error.name === 'NotFoundError') {
        if (this.onError) this.onError('No camera or microphone found. Please connect a device and try again.');
      } else if (error.name === 'NotAllowedError') {
        if (this.onError) this.onError('Camera/microphone access denied. Please allow access and try again.');
      } else {
        if (this.onError) this.onError('Failed to access camera/microphone: ' + error.message);
      }
      
      // Try to get audio only if video fails
      try {
        this.localStream = await navigator.mediaDevices.getUserMedia({
          video: false,
          audio: true
        });

        if (this.onLocalStream) {
          this.onLocalStream(this.localStream);
        }

        console.log('Audio-only stream obtained');
        if (this.onError) this.onError('Video unavailable, but audio is working.');
      } catch (audioError) {
        console.error('Audio also failed:', audioError);
        if (this.onError) this.onError('Unable to access camera or microphone. Please check your device permissions.');
      }
    }
  }

  // Join meeting room
  joinMeeting() {
    this.sendMessage({
      type: 'join-meeting',
      meetingId: this.meetingId
    });
  }

  // Leave meeting room
  leaveMeeting() {
    // Send leave message to server
    this.sendMessage({
      type: 'leave-meeting',
      meetingId: this.meetingId
    });
    
    // Then cleanup resources
    this.cleanup();
  }

  // Handle incoming WebSocket messages
  handleSocketMessage(message) {
    const { type, data } = message;

    switch (type) {
      case 'meeting-joined':
        this.handleMeetingJoined(data);
        break;

      case 'user-joined':
        this.handleUserJoined(data);
        break;

      case 'user-left':
        this.handleUserLeft(data);
        break;

      case 'rtc-offer':
        this.handleRTCOffer(data);
        break;

      case 'rtc-answer':
        this.handleRTCAnswer(data);
        break;

      case 'rtc-ice-candidate':
        this.handleRTCIceCandidate(data);
        break;

      case 'chat-message':
        this.handleChatMessage(data);
        break;

      case 'screen-share-start':
        this.handleScreenShareStart(data);
        break;

      case 'screen-share-stop':
        this.handleScreenShareStop(data);
        break;

      case 'mute-audio':
        this.handleMuteAudio(data);
        break;

      case 'mute-video':
        this.handleMuteVideo(data);
        break;

      case 'raise-hand':
        this.handleRaiseHand(data);
        break;

      case 'recording-start':
        this.handleRecordingStart(data);
        break;

      case 'recording-stop':
        this.handleRecordingStop(data);
        break;

      case 'meeting-ended':
        this.handleMeetingEnded(data);
        break;

      case 'error':
        console.error('WebSocket error:', data.message);
        if (this.onError) this.onError(data.message);
        break;

      default:
        console.log('Unknown message type:', type, message);
    }
  }

  // Handle meeting joined confirmation
  handleMeetingJoined(data) {
    console.log('Joined meeting:', data);
    
    // Establish connections with existing users
    if (data.existingUsers && Array.isArray(data.existingUsers)) {
      data.existingUsers.forEach(async (existingUser) => {
        if (existingUser.userId !== this.userId) {
          console.log('Connecting to existing user:', existingUser);
          
          const peerConnection = await this.createPeerConnection(existingUser.userId);
          if (peerConnection && this.localStream) {
            try {
              // Create and send offer to existing user
              const offer = await peerConnection.createOffer();
              await peerConnection.setLocalDescription(offer);

              this.sendMessage({
                type: 'rtc-offer',
                meetingId: this.meetingId,
                data: {
                  targetUserId: existingUser.userId,
                  offer
                }
              });
            } catch (error) {
              console.error('Error creating offer for existing user:', error);
            }
          }
        }
      });
    }

    if (this.onUserJoined) {
      this.onUserJoined(data);
    }
  }

  // Handle new user joining
  handleUserJoined(data) {
    console.log('User joined:', data);
    
    // Create peer connection for the new user
    this.createPeerConnection(data.userId).then(async (peerConnection) => {
      if (peerConnection && this.localStream) {
        try {
          // Create and send offer to the new user
          const offer = await peerConnection.createOffer();
          await peerConnection.setLocalDescription(offer);

          this.sendMessage({
            type: 'rtc-offer',
            meetingId: this.meetingId,
            data: {
              targetUserId: data.userId,
              offer
            }
          });
        } catch (error) {
          console.error('Error creating offer for new user:', error);
        }
      }
    });

    if (this.onUserJoined) {
      this.onUserJoined(data);
    }
  }

  // Handle user leaving
  handleUserLeft(data) {
    console.log('User left:', data.name);
    
    // Close peer connection
    this.closePeerConnection(data.userId);

    if (this.onUserLeft) {
      this.onUserLeft(data);
    }
  }

  // Create peer connection for a user
  async createPeerConnection(targetUserId) {
    try {
      const peerConnection = new RTCPeerConnection(this.rtcConfig);
      this.peerConnections.set(targetUserId, peerConnection);

      // Add local stream tracks
      if (this.localStream) {
        this.localStream.getTracks().forEach(track => {
          peerConnection.addTrack(track, this.localStream);
        });
      }

      // Handle remote stream
      peerConnection.ontrack = (event) => {
        const remoteStream = event.streams[0];
        this.remoteStreams.set(targetUserId, remoteStream);
        
        if (this.onRemoteStream) {
          this.onRemoteStream(targetUserId, remoteStream);
        }
      };

      // Handle ICE candidates
      peerConnection.onicecandidate = (event) => {
        if (event.candidate) {
          this.sendMessage({
            type: 'rtc-ice-candidate',
            meetingId: this.meetingId,
            data: {
              targetUserId,
              candidate: event.candidate
            }
          });
        }
      };

      // Handle connection state changes
      peerConnection.onconnectionstatechange = () => {
        console.log(`Connection state with ${targetUserId}:`, peerConnection.connectionState);
        if (peerConnection.connectionState === 'failed') {
          console.error('Connection failed with:', targetUserId);
          this.closePeerConnection(targetUserId);
        }
      };

      return peerConnection;

    } catch (error) {
      console.error('Error creating peer connection:', error);
      if (this.onError) this.onError('Failed to establish connection');
      return null;
    }
  }

  // Handle incoming RTC offer
  async handleRTCOffer(data) {
    try {
      const { fromUserId, offer } = data;
      
      // Create peer connection if it doesn't exist
      if (!this.peerConnections.has(fromUserId)) {
        await this.createPeerConnection(fromUserId);
      }

      const peerConnection = this.peerConnections.get(fromUserId);
      
      // Set remote description
      await peerConnection.setRemoteDescription(offer);

      // Create and send answer
      const answer = await peerConnection.createAnswer();
      await peerConnection.setLocalDescription(answer);

      this.sendMessage({
        type: 'rtc-answer',
        meetingId: this.meetingId,
        data: {
          targetUserId: fromUserId,
          answer
        }
      });

    } catch (error) {
      console.error('Error handling RTC offer:', error);
      if (this.onError) this.onError('Failed to handle connection offer');
    }
  }

  // Handle incoming RTC answer
  async handleRTCAnswer(data) {
    try {
      const { fromUserId, answer } = data;
      const peerConnection = this.peerConnections.get(fromUserId);
      
      if (peerConnection) {
        await peerConnection.setRemoteDescription(answer);
      }

    } catch (error) {
      console.error('Error handling RTC answer:', error);
      if (this.onError) this.onError('Failed to handle connection answer');
    }
  }

  // Handle incoming ICE candidate
  async handleRTCIceCandidate(data) {
    try {
      const { fromUserId, candidate } = data;
      const peerConnection = this.peerConnections.get(fromUserId);
      
      if (peerConnection) {
        await peerConnection.addIceCandidate(candidate);
      }

    } catch (error) {
      console.error('Error handling ICE candidate:', error);
    }
  }

  // Close peer connection
  closePeerConnection(targetUserId) {
    const peerConnection = this.peerConnections.get(targetUserId);
    if (peerConnection) {
      peerConnection.close();
      this.peerConnections.delete(targetUserId);
    }
    
    this.remoteStreams.delete(targetUserId);
  }

  // Send chat message
  sendChatMessage(message) {
    this.sendMessage({
      type: 'chat-message',
      meetingId: this.meetingId,
      data: { message }
    });
  }

  // Handle incoming chat message
  handleChatMessage(data) {
    if (this.onChatMessage) {
      this.onChatMessage(data);
    }
  }

  // Toggle audio mute
  toggleAudioMute(muted) {
    if (this.localStream) {
      const audioTrack = this.localStream.getAudioTracks()[0];
      if (audioTrack) {
        audioTrack.enabled = !muted;
      }
    }

    this.sendMessage({
      type: 'mute-audio',
      meetingId: this.meetingId,
      data: { muted }
    });
  }

  // Toggle video mute
  toggleVideoMute(muted) {
    if (this.localStream) {
      const videoTrack = this.localStream.getVideoTracks()[0];
      if (videoTrack) {
        videoTrack.enabled = !muted;
      }
    }

    this.sendMessage({
      type: 'mute-video',
      meetingId: this.meetingId,
      data: { muted }
    });
  }

  // Start screen sharing
  async startScreenShare() {
    try {
      const screenStream = await navigator.mediaDevices.getDisplayMedia({
        video: true,
        audio: false
      });

      // Replace video track in all peer connections
      const videoTrack = screenStream.getVideoTracks()[0];
      
      this.peerConnections.forEach(peerConnection => {
        const sender = peerConnection.getSenders().find(s => s.track?.kind === 'video');
        if (sender) {
          sender.replaceTrack(videoTrack);
        }
      });

      this.sendMessage({
        type: 'screen-share-start',
        meetingId: this.meetingId
      });

      return screenStream;

    } catch (error) {
      console.error('Error starting screen share:', error);
      if (this.onError) this.onError('Failed to start screen sharing');
      throw error;
    }
  }

  // Stop screen sharing
  stopScreenShare() {
    // Restore camera video track
    if (this.localStream) {
      const videoTrack = this.localStream.getVideoTracks()[0];
      
      this.peerConnections.forEach(peerConnection => {
        const sender = peerConnection.getSenders().find(s => s.track?.kind === 'video');
        if (sender) {
          sender.replaceTrack(videoTrack);
        }
      });
    }

    this.sendMessage({
      type: 'screen-share-stop',
      meetingId: this.meetingId
    });
  }

  // Handle screen share events
  handleScreenShareStart(data) {
    console.log('Screen sharing started by:', data.name);
    if (this.onScreenShareStart) {
      this.onScreenShareStart(data);
    }
  }

  handleScreenShareStop(data) {
    console.log('Screen sharing stopped by:', data.name);
    if (this.onScreenShareStop) {
      this.onScreenShareStop(data);
    }
  }

  // Handle mute events
  handleMuteAudio(data) {
    console.log(`${data.name} ${data.muted ? 'muted' : 'unmuted'} audio`);
  }

  handleMuteVideo(data) {
    console.log(`${data.name} ${data.muted ? 'muted' : 'unmuted'} video`);
  }

  // Raise hand
  raiseHand() {
    this.sendMessage({
      type: 'raise-hand',
      meetingId: this.meetingId
    });
  }

  // Handle raise hand
  handleRaiseHand(data) {
    console.log(`${data.name} raised their hand`);
  }

  // Start recording
  async startRecording() {
    try {
      if (this.isRecording) {
        throw new Error('Recording is already in progress');
      }

      // Create a combined stream for recording
      const streams = [this.localStream];
      
      // Add all remote streams
      this.remoteStreams.forEach(stream => {
        streams.push(stream);
      });

      // Create a MediaStream that combines all streams
      const combinedStream = new MediaStream();
      
      streams.forEach(stream => {
        stream.getTracks().forEach(track => {
          combinedStream.addTrack(track);
        });
      });

      // Initialize MediaRecorder
      this.mediaRecorder = new MediaRecorder(combinedStream, {
        mimeType: 'video/webm;codecs=vp9,opus',
        videoBitsPerSecond: 2500000 // 2.5 Mbps
      });

      this.recordedChunks = [];
      this.isRecording = true;
      this.recordingStartTime = Date.now();

      // Set up recording event handlers
      this.mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          this.recordedChunks.push(event.data);
        }
      };

      this.mediaRecorder.onstop = () => {
        this.createRecordingFile();
      };

      this.mediaRecorder.onerror = (error) => {
        console.error('Recording error:', error);
        this.isRecording = false;
        if (this.onError) this.onError('Recording failed');
      };

      // Start recording
      this.mediaRecorder.start(1000); // Collect data every second

      // Start recording timer
      this.recordingTimer = setInterval(() => {
        if (this.onRecordingTimeUpdate) {
          const elapsed = Math.floor((Date.now() - this.recordingStartTime) / 1000);
          this.onRecordingTimeUpdate(elapsed);
        }
      }, 1000);

      // Notify server
      this.sendMessage({
        type: 'recording-start',
        meetingId: this.meetingId
      });

      if (this.onRecordingStart) {
        this.onRecordingStart();
      }

      console.log('Recording started');

    } catch (error) {
      console.error('Error starting recording:', error);
      if (this.onError) this.onError('Failed to start recording');
      throw error;
    }
  }

  // Stop recording
  stopRecording() {
    try {
      if (!this.isRecording || !this.mediaRecorder) {
        throw new Error('No recording in progress');
      }

      // Stop the MediaRecorder
      this.mediaRecorder.stop();
      this.isRecording = false;

      // Clear recording timer
      if (this.recordingTimer) {
        clearInterval(this.recordingTimer);
        this.recordingTimer = null;
      }

      // Notify server
      this.sendMessage({
        type: 'recording-stop',
        meetingId: this.meetingId
      });

      if (this.onRecordingStop) {
        this.onRecordingStop();
      }

      console.log('Recording stopped');

    } catch (error) {
      console.error('Error stopping recording:', error);
      if (this.onError) this.onError('Failed to stop recording');
      throw error;
    }
  }

  // Create recording file
  createRecordingFile() {
    try {
      const blob = new Blob(this.recordedChunks, {
        type: 'video/webm'
      });

      const url = URL.createObjectURL(blob);
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      const filename = `meeting-recording-${this.meetingId}-${timestamp}.webm`;

      // Create download link
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      a.style.display = 'none';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);

      // Clean up
      URL.revokeObjectURL(url);
      this.recordedChunks = [];

      console.log('Recording file created:', filename);

    } catch (error) {
      console.error('Error creating recording file:', error);
      if (this.onError) this.onError('Failed to create recording file');
    }
  }

  // Handle recording events from server
  handleRecordingStart(data) {
    console.log('Recording started by:', data.name);
  }

  handleRecordingStop(data) {
    this.isRecording = false;
    this.recordingStartTime = null;
    if (this.recordingTimer) {
      clearInterval(this.recordingTimer);
      this.recordingTimer = null;
    }
    if (this.onRecordingStop) {
      this.onRecordingStop(data);
    }
  }

  // Get recording status
  getRecordingStatus() {
    return {
      isRecording: this.isRecording,
      startTime: this.recordingStartTime,
      elapsed: this.recordingStartTime ? Math.floor((Date.now() - this.recordingStartTime) / 1000) : 0
    };
  }

  // Send message to WebSocket
  sendMessage(message) {
    if (this.socket && this.socket.readyState === WebSocket.OPEN) {
      this.socket.send(JSON.stringify(message));
    }
  }

  // Cleanup resources
  cleanup() {
    // Only cleanup WebSocket connection, don't automatically leave meeting
    if (this.socket) {
      this.socket.close();
      this.socket = null;
    }
    
    // Stop local stream
    if (this.localStream) {
      this.localStream.getTracks().forEach(track => track.stop());
      this.localStream = null;
    }
    
    // Stop screen share
    if (this.screenStream) {
      this.screenStream.getTracks().forEach(track => track.stop());
      this.screenStream = null;
    }
    
    // Close peer connections
    this.peerConnections.forEach(connection => {
      connection.close();
    });
    this.peerConnections.clear();
    
    // Clear remote streams
    this.remoteStreams.clear();
    
    // Clear recording
    if (this.mediaRecorder) {
      this.mediaRecorder.stop();
      this.mediaRecorder = null;
    }
    
    // Clear recording chunks
    this.recordingChunks = [];
    
    // Reset recording time
    if (this.recordingTimeInterval) {
      clearInterval(this.recordingTimeInterval);
      this.recordingTimeInterval = null;
    }
  }

  // Get connection stats
  getStats() {
    return {
      localStream: this.localStream,
      remoteStreams: this.remoteStreams,
      peerConnections: this.peerConnections.size,
      socketConnected: this.socket?.readyState === WebSocket.OPEN,
      isRecording: this.isRecording
    };
  }

  handleMeetingEnded(data) {
    console.log('Meeting ended by host:', data);
    
    // Show notification to user
    if (this.onMeetingEnded) {
      this.onMeetingEnded(data);
    }
    
    // Clean up resources
    this.cleanup();
    
    // Close WebSocket connection
    if (this.socket) {
      this.socket.close(1000, 'Meeting ended by host');
    }
  }
}

export default WebRTCService; 