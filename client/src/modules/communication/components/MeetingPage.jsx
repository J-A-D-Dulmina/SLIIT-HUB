import React, { useState, useRef, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { FaMicrophone, FaMicrophoneSlash, FaVideo, FaVideoSlash, FaDesktop, FaComments, FaUsers, FaEllipsisH, FaHandPaper, FaRecordVinyl, FaStop, FaPhoneSlash, FaCog, FaDownload } from 'react-icons/fa';
import WebRTCService from '../../../services/WebRTCService';
import '../styles/MeetingPage.css';

const MeetingPage = () => {
  const { meetingId } = useParams();
  const navigate = useNavigate();
  
  // WebRTC service
  const webrtcService = useRef(new WebRTCService());
  
  // State
  const [isMuted, setIsMuted] = useState(false);
  const [isVideoOff, setIsVideoOff] = useState(false);
  const [isScreenSharing, setIsScreenSharing] = useState(false);
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [isParticipantsOpen, setIsParticipantsOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [meetingData, setMeetingData] = useState(null);
  const [participants, setParticipants] = useState([]);
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [connectionStatus, setConnectionStatus] = useState('connecting');
  const [error, setError] = useState(null);
  const [isHost, setIsHost] = useState(false);
  const [recordingStatus, setRecordingStatus] = useState('idle'); // idle, starting, recording, stopping
  
  // Refs
  const localVideoRef = useRef(null);
  const remoteVideosRef = useRef(new Map());
  const chatRef = useRef(null);
  const screenStreamRef = useRef(null);

  useEffect(() => {
    initializeMeeting();
    
    return () => {
      cleanup();
    };
  }, [meetingId]);

  const initializeMeeting = async () => {
      try {
      setConnectionStatus('connecting');
      
      // Get user info from localStorage
      const userInfo = JSON.parse(localStorage.getItem('userInfo') || '{}');
      if (!userInfo.id || !userInfo.name) {
        throw new Error('User information not found. Please log in again.');
      }

      // Initialize WebRTC service
      const service = webrtcService.current;
      
      // Set up event handlers
      service.onLocalStream = (stream) => {
        if (localVideoRef.current) {
          localVideoRef.current.srcObject = stream;
        }
      };

      service.onRemoteStream = (userId, stream) => {
        const videoElement = remoteVideosRef.current.get(userId);
        if (videoElement) {
          videoElement.srcObject = stream;
        }
      };

      service.onUserJoined = (data) => {
        setParticipants(prev => [...prev, data]);
        addChatMessage('system', `${data.name} joined the meeting`);
      };

      service.onUserLeft = (data) => {
        setParticipants(prev => prev.filter(p => p.userId !== data.userId));
        addChatMessage('system', `${data.name} left the meeting`);
        
        // Remove remote video element
        const videoElement = remoteVideosRef.current.get(data.userId);
        if (videoElement) {
          videoElement.remove();
          remoteVideosRef.current.delete(data.userId);
        }
      };

      service.onChatMessage = (data) => {
        addChatMessage('user', data.message, data.sender);
      };

      service.onError = (errorMessage) => {
        setError(errorMessage);
        setConnectionStatus('error');
      };

      // Recording event handlers
      service.onRecordingStart = () => {
        setIsRecording(true);
        setRecordingStatus('recording');
        addChatMessage('system', 'Recording started');
      };

      service.onRecordingStop = () => {
        setIsRecording(false);
        setRecordingStatus('idle');
        setRecordingTime(0);
        addChatMessage('system', 'Recording stopped - file will be downloaded automatically');
      };

      service.onRecordingTimeUpdate = (elapsed) => {
        setRecordingTime(elapsed);
      };

      // Initialize the service with cookie-based auth
      await service.initialize(meetingId, userInfo.id, userInfo.name);
      
      setConnectionStatus('connected');
      
      // Fetch meeting data
      await fetchMeetingData();

    } catch (error) {
      console.error('Error initializing meeting:', error);
      setError(error.message);
      setConnectionStatus('error');
    }
  };

  const fetchMeetingData = async () => {
    try {
      const response = await fetch(`/api/meetings/${meetingId}`, {
        headers: {
          'Content-Type': 'application/json'
        },
        credentials: 'include'
      });

      if (response.ok) {
        const data = await response.json();
        setMeetingData(data.data);
        setParticipants(data.data.participants || []);
        
        // Check if current user is host
        const userInfo = JSON.parse(localStorage.getItem('userInfo') || '{}');
        setIsHost(data.data.host === userInfo.id);
        
        // Check if meeting is currently recording
        if (data.data.status === 'recording') {
          setIsRecording(true);
          setRecordingStatus('recording');
        }
        
        // Load chat history
        if (data.data.chatHistory) {
          setMessages(data.data.chatHistory.map(msg => ({
            id: msg._id,
            type: 'user',
            sender: msg.senderName,
            message: msg.message,
            timestamp: new Date(msg.timestamp)
          })));
        }
      }
    } catch (error) {
      console.error('Error fetching meeting data:', error);
    }
  };

  const cleanup = () => {
    if (webrtcService.current) {
      webrtcService.current.leaveMeeting();
    }
    
    if (screenStreamRef.current) {
      screenStreamRef.current.getTracks().forEach(track => track.stop());
      }
    };

  const toggleMute = () => {
    const newMutedState = !isMuted;
    setIsMuted(newMutedState);
    webrtcService.current.toggleAudioMute(newMutedState);
  };

  const toggleVideo = () => {
    const newVideoState = !isVideoOff;
    setIsVideoOff(newVideoState);
    webrtcService.current.toggleVideoMute(newVideoState);
  };

  const toggleScreenShare = async () => {
    try {
      if (!isScreenSharing) {
        const screenStream = await webrtcService.current.startScreenShare();
        screenStreamRef.current = screenStream;
        setIsScreenSharing(true);
        
        // Handle screen share stop
        screenStream.getVideoTracks()[0].onended = () => {
          stopScreenShare();
        };
      } else {
        stopScreenShare();
      }
    } catch (error) {
      console.error('Error toggling screen share:', error);
      setError('Failed to start screen sharing');
    }
  };

  const stopScreenShare = () => {
    webrtcService.current.stopScreenShare();
    if (screenStreamRef.current) {
      screenStreamRef.current.getTracks().forEach(track => track.stop());
      screenStreamRef.current = null;
    }
    setIsScreenSharing(false);
  };

  const toggleChat = () => {
    setIsChatOpen(!isChatOpen);
    setIsParticipantsOpen(false);
    setIsSettingsOpen(false);
  };

  const toggleParticipants = () => {
    setIsParticipantsOpen(!isParticipantsOpen);
    setIsChatOpen(false);
    setIsSettingsOpen(false);
  };

  const toggleSettings = () => {
    setIsSettingsOpen(!isSettingsOpen);
    setIsChatOpen(false);
    setIsParticipantsOpen(false);
  };

  const sendMessage = (e) => {
    e.preventDefault();
    if (newMessage.trim()) {
      webrtcService.current.sendChatMessage(newMessage.trim());
      setNewMessage('');
    }
  };

  const addChatMessage = (type, message, sender = null) => {
    const newMessage = {
      id: Date.now(),
      type,
      sender: sender?.name || 'System',
      message,
      timestamp: new Date()
    };
    
    setMessages(prev => [...prev, newMessage]);
    
    // Scroll to bottom
    setTimeout(() => {
      if (chatRef.current) {
        chatRef.current.scrollTop = chatRef.current.scrollHeight;
      }
    }, 100);
  };

  const startRecording = async () => {
    try {
      if (!isHost) {
        setError('Only the meeting host can start recording');
        return;
      }

      setRecordingStatus('starting');
      await webrtcService.current.startRecording();
      
    } catch (error) {
      console.error('Error starting recording:', error);
      setError('Failed to start recording');
      setRecordingStatus('idle');
    }
  };

  const stopRecording = async () => {
    try {
      if (!isHost) {
        setError('Only the meeting host can stop recording');
        return;
      }

      setRecordingStatus('stopping');
      await webrtcService.current.stopRecording();
      
    } catch (error) {
      console.error('Error stopping recording:', error);
      setError('Failed to stop recording');
      setRecordingStatus('recording');
    }
  };

  const raiseHand = () => {
    webrtcService.current.raiseHand();
  };

  const leaveMeeting = () => {
    if (window.confirm('Are you sure you want to leave the meeting?')) {
      cleanup();
      navigate('/my-meetings');
    }
  };

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const getRecordingButtonIcon = () => {
    if (recordingStatus === 'starting' || recordingStatus === 'stopping') {
      return <div className="loading-spinner" />;
    }
    return isRecording ? <FaStop /> : <FaRecordVinyl />;
  };

  const getRecordingButtonTitle = () => {
    if (recordingStatus === 'starting') return 'Starting recording...';
    if (recordingStatus === 'stopping') return 'Stopping recording...';
    return isRecording ? 'Stop recording' : 'Start recording';
  };

  return (
    <div className="meeting-page">
      {/* Connection Status */}
      {connectionStatus === 'connecting' && (
        <div className="connection-status connecting">
          Connecting to meeting...
        </div>
      )}
      
      {connectionStatus === 'error' && (
        <div className="connection-status error">
          Connection failed: {error}
          <button onClick={() => window.location.reload()}>Retry</button>
        </div>
      )}

      {/* Recording Status */}
              {isRecording && (
        <div className="recording-status">
                <div className="recording-indicator">
            <div className="recording-dot"></div>
            <span>REC</span>
            <span className="recording-time">{formatTime(recordingTime)}</span>
          </div>
          <div className="recording-notice">
            This meeting is being recorded
          </div>
                </div>
              )}

      {/* Main Video Area */}
      <div className="video-container">
        {/* Local Video */}
        <div className="local-video-container">
          <video
            ref={localVideoRef}
            autoPlay
            playsInline
            muted
            className="local-video"
          />
          <div className="local-video-label">You {isHost ? '(Host)' : ''}</div>
          {isMuted && <div className="mute-indicator">🔇</div>}
          {isVideoOff && <div className="video-off-indicator">📹</div>}
        </div>

        {/* Remote Videos */}
        <div className="remote-videos-grid" id="remote-videos">
          {participants.map(participant => (
            <div key={participant.userId} className="remote-video-container">
              <video
                autoPlay
                playsInline
                muted
                className="remote-video"
                ref={el => {
                  if (el) remoteVideosRef.current.set(participant.userId, el);
                }}
              />
              <div className="remote-video-label">{participant.name}</div>
            </div>
          ))}
          </div>
        </div>

      {/* Control Bar */}
      <div className="control-bar">
        <div className="control-left">
          <button
            className={`control-btn ${isMuted ? 'active' : ''}`}
            onClick={toggleMute}
            title={isMuted ? 'Unmute' : 'Mute'}
          >
            {isMuted ? <FaMicrophoneSlash /> : <FaMicrophone />}
          </button>

          <button
            className={`control-btn ${isVideoOff ? 'active' : ''}`}
            onClick={toggleVideo}
            title={isVideoOff ? 'Turn on video' : 'Turn off video'}
          >
            {isVideoOff ? <FaVideoSlash /> : <FaVideo />}
          </button>

          <button
            className={`control-btn ${isScreenSharing ? 'active' : ''}`}
            onClick={toggleScreenShare}
            title={isScreenSharing ? 'Stop sharing' : 'Share screen'}
          >
            <FaDesktop />
          </button>
        </div>

        <div className="control-center">
          <button
            className="control-btn"
            onClick={toggleParticipants}
            title="Participants"
          >
            <FaUsers />
          </button>

          <button
            className="control-btn"
            onClick={toggleChat}
            title="Chat"
          >
            <FaComments />
          </button>

          <button
            className="control-btn"
            onClick={raiseHand}
            title="Raise hand"
          >
            <FaHandPaper />
          </button>

          {/* Recording Button - Only visible to host */}
          {isHost && (
            <button
              className={`control-btn recording-btn ${isRecording ? 'recording' : ''} ${recordingStatus !== 'idle' && !isRecording ? 'loading' : ''}`}
              onClick={isRecording ? stopRecording : startRecording}
              disabled={recordingStatus === 'starting' || recordingStatus === 'stopping'}
              title={getRecordingButtonTitle()}
            >
              {getRecordingButtonIcon()}
            </button>
          )}

          {/* Recording indicator for participants */}
          {!isHost && isRecording && (
            <div className="recording-indicator-btn">
              <FaRecordVinyl />
              <span>REC</span>
            </div>
          )}
        </div>

        <div className="control-right">
          <button
            className="control-btn"
            onClick={toggleSettings}
            title="Settings"
          >
            <FaCog />
          </button>

          <button
            className="control-btn leave-btn"
            onClick={leaveMeeting}
            title="Leave meeting"
          >
            <FaPhoneSlash />
          </button>
        </div>
      </div>

      {/* Chat Sidebar */}
      {isChatOpen && (
        <div className="chat-sidebar">
          <div className="chat-header">
            <h3>Meeting Chat</h3>
            <button onClick={toggleChat}>×</button>
          </div>
          <div className="chat-messages" ref={chatRef}>
            {messages.map(message => (
              <div key={message.id} className={`chat-message ${message.type}`}>
                <div className="message-header">
                  <span className="sender">{message.sender}</span>
                  <span className="timestamp">
                    {message.timestamp.toLocaleTimeString()}
                  </span>
                </div>
                <p className="message-text">{message.message}</p>
              </div>
            ))}
          </div>
          <form className="chat-input" onSubmit={sendMessage}>
            <input
              type="text"
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              placeholder="Type a message..."
            />
            <button type="submit">Send</button>
          </form>
        </div>
      )}

      {/* Participants Sidebar */}
      {isParticipantsOpen && (
        <div className="participants-sidebar">
          <div className="participants-header">
            <h3>Participants ({participants.length + 1})</h3>
            <button onClick={toggleParticipants}>×</button>
          </div>
          <div className="participants-list">
            <div className="participant local">
              <span className="participant-name">You {isHost ? '(Host)' : ''}</span>
              <span className="participant-status">
                {isMuted ? '🔇' : '🎤'} {isVideoOff ? '📹' : '📷'}
              </span>
            </div>
            {participants.map(participant => (
              <div key={participant.userId} className="participant">
                <span className="participant-name">{participant.name}</span>
                <span className="participant-role">{participant.role}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Settings Sidebar */}
      {isSettingsOpen && (
        <div className="settings-sidebar">
          <div className="settings-header">
            <h3>Settings</h3>
            <button onClick={toggleSettings}>×</button>
          </div>
          <div className="settings-content">
            <div className="setting-group">
              <h4>Audio & Video</h4>
              <div className="setting-item">
                <label>Microphone</label>
                <select>
                  <option>Default Microphone</option>
                </select>
              </div>
              <div className="setting-item">
                <label>Camera</label>
                <select>
                  <option>Default Camera</option>
                </select>
              </div>
            </div>
            
            <div className="setting-group">
              <h4>Recording</h4>
              <div className="recording-info">
                <p>Status: {recordingStatus}</p>
                {isRecording && (
                  <p>Duration: {formatTime(recordingTime)}</p>
                )}
                {isHost && (
                  <p className="recording-note">
                    As the host, you can start and stop recording. 
                    Recordings will be automatically downloaded when stopped.
                  </p>
                )}
              </div>
            </div>
            
            <div className="setting-group">
              <h4>Connection</h4>
              <div className="connection-info">
                <p>Status: {connectionStatus}</p>
                <p>Participants: {participants.length + 1}</p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MeetingPage; 