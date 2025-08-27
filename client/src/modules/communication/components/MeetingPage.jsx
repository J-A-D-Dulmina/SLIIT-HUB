import React, { useState, useRef, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { FaMicrophone, FaMicrophoneSlash, FaVideo, FaVideoSlash, FaDesktop, FaComments, FaUsers, FaEllipsisH, FaHandPaper, FaRecordVinyl, FaStop, FaPhoneSlash, FaCog, FaDownload, FaCamera, FaTimes } from 'react-icons/fa';
import WebRTCService from '../../../services/WebRTCService';
import '../styles/MeetingPage.css';
import axios from 'axios';

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
  const [expandedVideo, setExpandedVideo] = useState(null); // userId of expanded video
  const [screenSharer, setScreenSharer] = useState(null); // User who is screen sharing
  const [showPreJoin, setShowPreJoin] = useState(true);
  const [preJoinMic, setPreJoinMic] = useState(true);
  const [preJoinCam, setPreJoinCam] = useState(true);
  const [preJoinSettings, setPreJoinSettings] = useState(false);
  const [audioDevices, setAudioDevices] = useState([]);
  const [videoDevices, setVideoDevices] = useState([]);
  const [selectedAudio, setSelectedAudio] = useState('');
  const [selectedVideo, setSelectedVideo] = useState('');
  const [outputDevices, setOutputDevices] = useState([]);
  const [selectedOutput, setSelectedOutput] = useState('');
  const [currentUser, setCurrentUser] = useState(null);
  
  // Refs
  const localVideoRef = useRef(null);
  const remoteVideosRef = useRef(new Map());
  const chatRef = useRef(null);
  const screenStreamRef = useRef(null);
  const screenShareVideoRef = useRef(null);
  const preJoinVideoRef = useRef(null);
  const preJoinStreamRef = useRef(null);

  useEffect(() => {
    initializeMeeting();
    
    // Don't cleanup on unmount - let the meeting continue running
    // Only cleanup if user explicitly leaves
    return () => {
      // Only cleanup if we're not just refreshing the page
      if (window.performance && window.performance.navigation.type === window.performance.navigation.TYPE_RELOAD) {
        // Page is being refreshed, don't cleanup
        return;
      }
      
      // Check if this is a page unload (closing tab/window)
      const handleBeforeUnload = (e) => {
        // Don't cleanup on page unload - let the meeting continue
        e.preventDefault();
        e.returnValue = '';
      };
      
      window.addEventListener('beforeunload', handleBeforeUnload);
      
      return () => {
        window.removeEventListener('beforeunload', handleBeforeUnload);
      };
    };
  }, [meetingId]);

  // Effect to handle screen share video element
  useEffect(() => {
    if (isScreenSharing && screenShareVideoRef.current && screenStreamRef.current) {
      const videoElement = screenShareVideoRef.current;
      const stream = screenStreamRef.current;
      
      // Ensure video element is properly configured
      videoElement.srcObject = stream;
      videoElement.muted = true;
      videoElement.autoplay = true;
      videoElement.playsInline = true;
      
      // Force play
      videoElement.play().catch(error => {
        console.error('Error playing screen share video:', error);
      });
      
      console.log('Screen share video element configured:', {
        videoElement: !!videoElement,
        stream: !!stream,
        tracks: stream.getTracks().length
      });
    }
  }, [isScreenSharing]);

  // Add useEffect to show camera preview in pre-join
  useEffect(() => {
    if (showPreJoin && preJoinCam && preJoinVideoRef.current) {
      console.log('Pre-join: Requesting camera access');
      navigator.mediaDevices.getUserMedia({ video: true, audio: false })
        .then(stream => {
          console.log('Pre-join: Camera stream obtained:', stream);
          preJoinStreamRef.current = stream; // Store the stream for reuse
          preJoinVideoRef.current.srcObject = stream;
          return preJoinVideoRef.current.play();
        })
        .then(() => {
          console.log('Pre-join: Camera preview playing successfully');
        })
        .catch(error => {
          console.error('Pre-join: Camera access failed:', error);
          preJoinVideoRef.current.srcObject = null;
        });
    } else if (preJoinVideoRef.current) {
      preJoinVideoRef.current.srcObject = null;
    }
    // Cleanup on unmount
    return () => {
      if (preJoinVideoRef.current && preJoinVideoRef.current.srcObject) {
        preJoinVideoRef.current.srcObject.getTracks().forEach(track => track.stop());
        preJoinVideoRef.current.srcObject = null;
        preJoinStreamRef.current = null;
      }
    };
  }, [showPreJoin, preJoinCam]);

  // Enumerate devices for settings
  useEffect(() => {
    if (showPreJoin && preJoinSettings) {
      navigator.mediaDevices.enumerateDevices().then(devices => {
        setAudioDevices(devices.filter(d => d.kind === 'audioinput'));
        setVideoDevices(devices.filter(d => d.kind === 'videoinput'));
        setOutputDevices(devices.filter(d => d.kind === 'audiooutput'));
      });
    }
  }, [showPreJoin, preJoinSettings]);

  // After setting up webrtc.onLocalStream, add this effect:
  useEffect(() => {
    if (localVideoRef.current && webrtcService.current && webrtcService.current.localStream) {
      console.log('Re-attaching local stream to video element', webrtcService.current.localStream, webrtcService.current.localStream.getTracks());
      localVideoRef.current.srcObject = webrtcService.current.localStream;
    }
  }, [localVideoRef.current, webrtcService.current && webrtcService.current.localStream]);

  const initializeMeeting = async () => {
      try {
      setConnectionStatus('connecting');
      
      // Get current user info from localStorage
      const userType = localStorage.getItem('userType');
      const userName = localStorage.getItem('userName');
      const studentId = localStorage.getItem('studentId');
      const lecturerId = localStorage.getItem('lecturerId');
      
      if (!userType || !userName) {
        throw new Error('User information not found. Please log in again.');
      }

      // Create user info object
      const userInfo = {
        id: userType === 'student' ? studentId : lecturerId,
        name: userName,
        type: userType
      };

      setCurrentUser(userInfo);
      
      // Fetch meeting data first
      await fetchMeetingData();
      
      // Initialize WebRTC service using the existing ref
      const webrtc = webrtcService.current;
      
      // Initialize WebRTC service
      await webrtc.initialize(meetingId, userInfo.id, userInfo.name);

      // Use pre-join stream if available (after initialize)
      if (preJoinStreamRef.current) {
        if (typeof webrtc.setLocalStream === 'function') {
          webrtc.setLocalStream(preJoinStreamRef.current);
        } else {
          webrtc.localStream = preJoinStreamRef.current;
          if (webrtc.onLocalStream) webrtc.onLocalStream(preJoinStreamRef.current);
        }
      } else {
        await webrtc.getUserMedia();
      }
      
      // Set up event handlers
      webrtc.onLocalStream = (stream) => {
        console.log('Local stream received');
        if (localVideoRef.current) {
          localVideoRef.current.srcObject = stream;
        }
      };

      webrtc.onRemoteStream = (userId, stream) => {
        console.log('Remote stream received for user:', userId);
        // Find or create video element for this user
        const videoElement = remoteVideosRef.current.get(userId);
        if (videoElement) {
          videoElement.srcObject = stream;
        }
      };

      webrtc.onUserJoined = (data) => {
        console.log('User joined meeting:', data);
        // Add user to participants list
        setParticipants(prev => {
          const existing = prev.find(p => p.userId === data.userId);
          if (!existing) {
            return [...prev, {
              userId: data.userId,
              name: data.name,
              email: data.email,
              isVideoOff: false,
              isMuted: false
            }];
          }
          return prev;
        });
      };
      
      webrtc.onUserLeft = (data) => {
        console.log('User left meeting:', data);
        // Remove user from participants list
        setParticipants(prev => prev.filter(p => p.userId !== data.userId));
        // Close peer connection
        webrtc.closePeerConnection(data.userId);
      };
      
      webrtc.onError = (error) => {
        console.error('WebRTC error:', error);
        setError(error);
        setConnectionStatus('error');
      };
      
      webrtc.onChatMessage = (data) => {
        addChatMessage('user', data.message, data.sender);
      };

      webrtc.onRecordingStart = () => {
        setIsRecording(true);
        setRecordingStatus('recording');
        addChatMessage('system', 'Recording started');
      };

      webrtc.onRecordingStop = () => {
        setIsRecording(false);
        setRecordingStatus('idle');
        setRecordingTime(0);
        addChatMessage('system', 'Recording stopped - file will be downloaded automatically');
      };

      webrtc.onRecordingTimeUpdate = (elapsed) => {
        setRecordingTime(elapsed);
      };

      webrtc.onScreenShareStart = (data) => {
        console.log('Screen sharing started by:', data.name);
        setIsScreenSharing(true);
        setScreenSharer({
          userId: data.userId,
          name: data.name
        });
        addChatMessage('system', `${data.name} started screen sharing`);
      };

      webrtc.onScreenShareStop = (data) => {
        console.log('Screen sharing stopped by:', data.name);
        setIsScreenSharing(false);
        setScreenSharer(null);
        addChatMessage('system', `${data.name} stopped screen sharing`);
      };

      // Handle host transfer
      webrtc.onHostTransferred = (data) => {
        console.log('Host transferred:', data);
        const { previousHost, newHost } = data;
        alert(`${previousHost.name} left the meeting. Host control has been transferred to ${newHost.name}.`);
        
        // Update local state if current user is the new host
        const currentUserId = localStorage.getItem('studentId') || localStorage.getItem('lecturerId');
        if (newHost.userId === currentUserId) {
          setIsHost(true);
        }
        addChatMessage('system', `Host control transferred from ${previousHost.name} to ${newHost.name}`);
      };

      // Handle host restoration
      webrtc.onHostRestored = (data) => {
        console.log('Host restored:', data);
        const { originalHost, previousTemporaryHost } = data;
        alert(`${originalHost.name} has rejoined the meeting. Host control has been restored.`);
        
        // Update local state if current user is the original host
        const currentUserId = localStorage.getItem('studentId') || localStorage.getItem('lecturerId');
        if (originalHost.userId === currentUserId) {
          setIsHost(true);
        }
        addChatMessage('system', `Host control restored to ${originalHost.name}`);
      };

      // Handle meeting ended by host
      webrtc.onMeetingEnded = (data) => {
        console.log('Meeting ended by host:', data);
        alert(`Meeting ended by host: ${data.message || 'The meeting has been ended by the host.'}`);
        cleanup();
        navigate('/my-meetings');
      };
      
      // Initialize WebRTC service
      setConnectionStatus('connected');

    } catch (error) {
      console.error('Error initializing meeting:', error);
        setError(error.message);
        setConnectionStatus('error');
    }
  };

  const fetchMeetingData = async () => {
    try {
      const response = await axios.get(`http://localhost:5000/api/meetings/${meetingId}`, {
        withCredentials: true
      });

      setMeetingData(response.data.data);
      
      // Don't load participants from database - they will be managed in memory via WebSocket
      // setParticipants([]); // Start with empty participants list
      
      // Use the backend's isHost flag
      setIsHost(response.data.data.isHost);
      console.log('Host detection from backend:', { isHost: response.data.data.isHost });
      
      // Check if meeting is currently recording
      if (response.data.data.status === 'recording') {
        setIsRecording(true);
        setRecordingStatus('recording');
      }
      
      // Don't load chat history from database - it will be managed in memory during meeting
      // if (response.data.data.chatHistory) {
      //   setMessages(response.data.data.chatHistory.map(msg => ({
      //     id: msg._id,
      //     type: 'user',
      //     sender: msg.senderName,
      //     message: msg.message,
      //     timestamp: new Date(msg.timestamp)
      //   })));
      // }
      
      // Don't automatically start the meeting - let user click start button
      // if (response.data.data.isHost && response.data.data.status !== 'in-progress') {
      //   await startMeeting();
      // }
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
        
        // Set current user as screen sharer
        const userType = localStorage.getItem('userType');
        const studentId = localStorage.getItem('studentId');
        const lecturerId = localStorage.getItem('lecturerId');
        const currentUserId = userType === 'student' ? studentId : lecturerId;
        const userName = localStorage.getItem('userName');
        
        setScreenSharer({
          userId: currentUserId,
          name: userName
        });
        
        console.log('Screen share stream:', screenStream);
        console.log('Screen share tracks:', screenStream.getTracks());
        
        // Set the screen share video element
        if (screenShareVideoRef.current) {
          screenShareVideoRef.current.srcObject = screenStream;
          console.log('Screen share video element set');
          
          // Add event listeners for debugging
          screenShareVideoRef.current.onloadedmetadata = () => {
            console.log('Screen share video metadata loaded');
          };
          
          screenShareVideoRef.current.onplay = () => {
            console.log('Screen share video started playing');
          };
          
          screenShareVideoRef.current.onerror = (error) => {
            console.error('Screen share video error:', error);
          };
        } else {
          console.error('Screen share video ref not found');
        }
        
        // Handle screen share stop
        screenStream.getVideoTracks()[0].onended = () => {
          console.log('Screen share track ended');
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
    
    // Clear the screen share video element
    if (screenShareVideoRef.current) {
      screenShareVideoRef.current.srcObject = null;
    }
    
    setIsScreenSharing(false);
    setScreenSharer(null);
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

  const leaveMeeting = async () => {
    if (window.confirm('Are you sure you want to leave the meeting? You can rejoin later.')) {
      try {
        // Call the backend to leave the meeting
        const response = await axios.post(`http://localhost:5000/api/meetings/${meetingId}/leave`, {}, {
          withCredentials: true
        });

        const { hostTransferred, meetingEnded } = response.data.data || {};

        if (hostTransferred) {
          alert('You left the meeting. Host control has been transferred to another participant.');
        } else if (meetingEnded) {
          alert('You left the meeting. The meeting has ended as no participants remain.');
        } else {
          alert('You left the meeting successfully.');
        }

        cleanup();
        navigate('/my-meetings');
      } catch (error) {
        console.error('Error leaving meeting:', error);
        alert('Failed to leave meeting properly. Please try again.');
        cleanup();
        navigate('/my-meetings');
      }
    }
  };

  const endMeeting = async () => {
    if (window.confirm('Are you sure you want to end this meeting for everyone? This action cannot be undone.')) {
      try {
        // Send WebSocket message to end meeting for all participants
        if (webrtcService && webrtcService.socket) {
          webrtcService.sendMessage({
            type: 'end-meeting',
            meetingId: meetingId
          });
        }

        // Call the backend to end the meeting
        const response = await axios.post(`http://localhost:5000/api/meetings/${meetingId}/end`, {}, {
          withCredentials: true
        });

        cleanup();
        navigate('/my-meetings');
      } catch (error) {
        console.error('Error ending meeting:', error);
        alert('Failed to end meeting. Please try again.');
      }
    }
  };

  const startMeeting = async () => {
    try {
      // Call the backend to start the meeting
      const response = await axios.post(`http://localhost:5000/api/meetings/${meetingId}/start`, {}, {
        withCredentials: true
      });
      console.log('Meeting started successfully:', response.data.message);
      // Update local meeting data
      if (meetingData) {
        setMeetingData(prev => ({
          ...prev,
          status: 'in-progress',
          startedAt: new Date()
        }));
      }
    } catch (error) {
      console.error('Error starting meeting:', error);
      alert(error.response?.data?.message || 'Failed to start meeting. Please try again.');
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

  // Helper to determine if a user (local or remote) has video on
  const isUserVideoOn = (userId) => {
    if (userId === 'local') return !isVideoOff;
    const participant = participants.find(p => p.userId === userId);
    return participant ? !participant.isVideoOff : false;
  };

  // Helper to get user name
  const getUserName = (userId) => {
    if (userId === 'local') return `You${isHost ? ' (Host)' : ''}`;
    const participant = participants.find(p => p.userId === userId);
    return participant ? participant.name : '';
  };

  // Pre-join screen
  if (showPreJoin) {
    return (
      <div className="pre-join-screen">
        <h2>Prepare to Join Meeting</h2>
        <div className="pre-join-controls">
          <button className={`icon-btn${preJoinMic ? ' active' : ''}`} onClick={() => setPreJoinMic(m => !m)} title={preJoinMic ? 'Mute Mic' : 'Unmute Mic'}>
            {preJoinMic ? <FaMicrophone /> : <FaMicrophoneSlash />}
          </button>
          <button className={`icon-btn${preJoinCam ? ' active' : ''}`} onClick={() => setPreJoinCam(c => !c)} title={preJoinCam ? 'Turn Off Camera' : 'Turn On Camera'}>
            {preJoinCam ? <FaVideo /> : <FaVideoSlash />}
          </button>
          <button className="icon-btn" onClick={() => setPreJoinSettings(s => !s)} title="Settings"><FaCog /></button>
        </div>
        {/* Camera preview box, always visible */}
        <div className="pre-join-video-preview">
          {preJoinCam ? (
            <video ref={preJoinVideoRef} autoPlay playsInline muted />
          ) : (
            <div className="video-placeholder">
              <FaCamera size={48} />
              <span>Camera is off</span>
            </div>
          )}
        </div>
        {preJoinSettings && (
          <div className="pre-join-settings-modal">
            <button className="close-btn" onClick={() => setPreJoinSettings(false)} title="Close"><FaTimes /></button>
            <h3>Settings</h3>
            <label htmlFor="audioDevice">Microphone</label>
            <select id="audioDevice" value={selectedAudio} onChange={e => setSelectedAudio(e.target.value)}>
              {audioDevices.map(d => <option key={d.deviceId} value={d.deviceId}>{d.label || 'Microphone'}</option>)}
            </select>
            <label htmlFor="videoDevice">Camera</label>
            <select id="videoDevice" value={selectedVideo} onChange={e => setSelectedVideo(e.target.value)}>
              {videoDevices.map(d => <option key={d.deviceId} value={d.deviceId}>{d.label || 'Camera'}</option>)}
            </select>
            <label htmlFor="outputDevice">Headset / Speaker</label>
            <select id="outputDevice" value={selectedOutput} onChange={e => setSelectedOutput(e.target.value)}>
              {outputDevices.map(d => <option key={d.deviceId} value={d.deviceId}>{d.label || 'Speaker/Headset'}</option>)}
            </select>
          </div>
        )}
        {isHost ? (
          <button className="start-meeting-btn" onClick={async () => {
            // Check if meeting is already in progress and we're rejoining
            // We should show "Rejoin" only if the meeting was actually started and we're coming back
            const isRejoining = (meetingData?.status === 'in-progress' || meetingData?.computedStatus === 'in-progress') && 
                               meetingData?.startedAt;
            
            if (!isRejoining) {
              // Start the meeting as host
              try {
                const response = await axios.post(`http://localhost:5000/api/meetings/${meetingId}/start`, {}, {
                  withCredentials: true
                });
                if (response.status === 200) {
                  setIsMuted(!preJoinMic);
                  setIsVideoOff(!preJoinCam);
                  setShowPreJoin(false);
                } else {
                  let errorMsg = 'Failed to start meeting.';
                  try {
                    if (response.data && response.data.message) errorMsg = response.data.message;
                  } catch (e) {}
                  alert(errorMsg);
                }
              } catch (error) {
                alert('Failed to start meeting. Please try again.');
              }
            } else {
              // Rejoin the meeting (no need to call start API again)
              setIsMuted(!preJoinMic);
              setIsVideoOff(!preJoinCam);
              setShowPreJoin(false);
            }
          }}>{(meetingData?.status === 'in-progress' || meetingData?.computedStatus === 'in-progress') && 
               meetingData?.startedAt ? 'Rejoin' : 'Start Meeting'}</button>
        ) : (
          <button className="join-meeting-btn" onClick={() => {
            setIsMuted(!preJoinMic);
            setIsVideoOff(!preJoinCam);
            setShowPreJoin(false);
          }}>Join Meeting</button>
        )}
      </div>
    );
  }

  const handleAudioDeviceChange = (deviceId) => {
    if (currentUser) {
      webrtcService.current.setAudioDevice(deviceId);
      setCurrentUser(prev => ({ ...prev, audioDeviceId: deviceId }));
    }
  };

  const handleVideoDeviceChange = (deviceId) => {
    if (currentUser) {
      webrtcService.current.setVideoDevice(deviceId);
      setCurrentUser(prev => ({ ...prev, videoDeviceId: deviceId }));
    }
  };

  const handleAudioOutputDeviceChange = (deviceId) => {
    if (currentUser) {
      webrtcService.current.setAudioOutputDevice(deviceId);
      setCurrentUser(prev => ({ ...prev, outputDeviceId: deviceId }));
    }
  };

  const troubleshootCamera = () => {
    if (localVideoRef.current) {
      localVideoRef.current.srcObject = null; // Stop current stream
      navigator.mediaDevices.getUserMedia({ video: true, audio: false })
        .then(stream => {
          console.log('Troubleshooting: Camera stream obtained:', stream);
          localVideoRef.current.srcObject = stream;
          alert('Camera stream restarted successfully.');
        })
        .catch(error => {
          console.error('Troubleshooting: Camera access failed:', error);
          alert('Failed to restart camera. Please check your camera settings and permissions.');
        });
    } else {
      alert('Camera preview is not available.');
    }
  };

  const refreshDeviceList = () => {
    navigator.mediaDevices.enumerateDevices().then(devices => {
      setAudioDevices(devices.filter(d => d.kind === 'audioinput'));
      setVideoDevices(devices.filter(d => d.kind === 'videoinput'));
      setOutputDevices(devices.filter(d => d.kind === 'audiooutput'));
      setCurrentUser(prev => ({ ...prev, audioDeviceId: '', videoDeviceId: '', outputDeviceId: '' }));
      alert('Device list refreshed.');
    }).catch(error => {
      console.error('Error refreshing device list:', error);
      alert('Failed to refresh device list. Please check browser console for details.');
    });
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
      <div className={`video-container ${isScreenSharing ? 'screen-sharing' : ''} ${expandedVideo ? 'video-expanded' : ''}`}>
        {/* Main area: show screen share or expanded video, else show camera views */}
        {isScreenSharing ? (
          <div className="screen-share-container">
            <video
              ref={screenShareVideoRef}
              autoPlay
              playsInline
              muted
              className="screen-share-video"
            />
            <div className="screen-share-label">Screen Share by {screenSharer?.name || 'Unknown'}</div>
            {!screenShareVideoRef.current?.srcObject && (
              <div className="screen-share-fallback">
                <p>Screen share active but no video stream</p>
                <p>Check console for debugging info</p>
              </div>
            )}
            {/* Show your camera video in top-right if you are sharing and camera is ON */}
            {screenSharer && screenSharer.userId === (localStorage.getItem('studentId') || localStorage.getItem('lecturerId')) && !isVideoOff && (
              <div className="screen-sharer-video">
                <video
                  ref={localVideoRef}
                  autoPlay
                  playsInline
                  muted
                  className="screen-sharer-video-element"
                />
                <div className="screen-sharer-label">You{isHost ? ' (Host)' : ''}</div>
              </div>
            )}
          </div>
        ) : expandedVideo ? (
          <div className="expanded-video-main" onDoubleClick={() => setExpandedVideo(null)}>
            {expandedVideo === 'local' ? (
              // Show local video expanded
              !isVideoOff ? (
                <div className="expanded-video-container">
                  <video
                    ref={localVideoRef}
                    autoPlay
                    playsInline
                    muted
                    className="expanded-video"
                  />
                  <div className="expanded-video-label">You{isHost ? ' (Host)' : ''}</div>
                  {isMuted && <div className="mute-indicator">🔇</div>}
                  <div className="expand-indicator">Double-click to minimize</div>
                </div>
              ) : (
                <div className="expanded-name-box">
                  <span className="expanded-video-label">You{isHost ? ' (Host)' : ''}</span>
                  <div className="expand-indicator">Double-click to minimize</div>
                </div>
              )
            ) : (
              // Show remote video expanded - find the existing video element
              <div className="expanded-video-container">
                {(() => {
                  const remoteVideo = remoteVideosRef.current.get(expandedVideo);
                  console.log('Expanding video for:', expandedVideo, 'Remote video ref:', remoteVideo);
                  if (remoteVideo && !remoteVideo.srcObject) {
                    // If the video element exists but has no stream, try to get it from the participant
                    const participant = participants.find(p => p.userId === expandedVideo);
                    console.log('Found participant:', participant);
                    if (participant && participant.stream) {
                      remoteVideo.srcObject = participant.stream;
                      console.log('Set stream from participant');
                    }
                  }
                  return (
                <video
                  autoPlay
                  playsInline
                  muted
                  className="expanded-video"
                  ref={el => {
                        if (el) {
                          console.log('Setting up expanded video element for:', expandedVideo);
                          // Use the same ref as the original video
                          const existingVideo = remoteVideosRef.current.get(expandedVideo);
                          if (existingVideo && existingVideo.srcObject) {
                            el.srcObject = existingVideo.srcObject;
                            console.log('Copied stream to expanded video element');
                          } else {
                            console.log('No existing video or stream found for:', expandedVideo);
                          }
                          remoteVideosRef.current.set(expandedVideo, el);
                        }
                  }}
                />
                  );
                })()}
                <div className="expanded-video-label">{getUserName(expandedVideo)}</div>
                <div className="expand-indicator">Double-click to minimize</div>
              </div>
            )}
          </div>
        ) : (
          <div className="main-placeholder">
            <div className="meeting-welcome">
              <h2>Welcome to the Meeting</h2>
              <p>Double-click any camera view to expand it</p>
            </div>
          </div>
        )}
        {/* Right section: show all camera/name boxes including local - always visible */}
        <div className="camera-videos-container right-section">
          {/* Local user box - hide if expanded in main area */}
          {expandedVideo !== 'local' && (
            <div 
              className="user-box"
              onDoubleClick={() => setExpandedVideo(expandedVideo === 'local' ? null : 'local')}
            >
              {!isVideoOff ? (
                <video ref={localVideoRef} autoPlay playsInline muted className="user-video" />
              ) : null}
              <div className="user-label">You{isHost ? ' (Host)' : ''}</div>
              {isMuted && <div className="mute-indicator">🔇</div>}
            </div>
          )}
          
          {/* Remote user boxes - hide if expanded in main area */}
          {participants.map(participant => (
            expandedVideo !== participant.userId && (
              <div 
                key={participant.userId} 
                className="user-box"
                onDoubleClick={() => setExpandedVideo(expandedVideo === participant.userId ? null : participant.userId)}
              >
                {!participant.isVideoOff ? (
                  <video 
                    autoPlay 
                    playsInline 
                    muted 
                    className="user-video" 
                    ref={el => { 
                      if (el) remoteVideosRef.current.set(participant.userId, el); 
                    }} 
                  />
                ) : null}
                <div className="user-label">{participant.name}</div>
              </div>
            )
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
          
          {/* Debug: Show recording button info */}
          {console.log('Recording button debug:', { isHost, isRecording, recordingStatus })}
          
          {/* Temporary debug recording button - always visible */}
          <button
            className="control-btn recording-btn debug"
            onClick={isRecording ? stopRecording : startRecording}
            disabled={recordingStatus === 'starting' || recordingStatus === 'stopping'}
            title={`Debug: ${getRecordingButtonTitle()} (isHost: ${isHost})`}
            style={{ backgroundColor: isHost ? '#28a745' : '#dc3545' }}
          >
            {getRecordingButtonIcon()}
          </button>

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

          {/* End Meeting button - Only for hosts */}
          {isHost && (
            <button
              className="control-btn end-btn"
              onClick={endMeeting}
              title="End meeting for everyone"
            >
              <FaStop />
            </button>
          )}

          <button
            className="control-btn leave-btn"
            onClick={leaveMeeting}
            title={isHost ? "Leave meeting (meeting will continue)" : "Leave meeting"}
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
                <select 
                  value={currentUser?.audioDeviceId || ''} 
                  onChange={(e) => handleAudioDeviceChange(e.target.value)}
                >
                  {audioDevices.map(d => (
                    <option key={d.deviceId} value={d.deviceId}>
                      {d.label || `Microphone ${d.deviceId.slice(0, 8)}...`}
                    </option>
                  ))}
                </select>
              </div>
              <div className="setting-item">
                <label>Camera</label>
                <select 
                  value={currentUser?.videoDeviceId || ''} 
                  onChange={(e) => handleVideoDeviceChange(e.target.value)}
                >
                  {videoDevices.map(d => (
                    <option key={d.deviceId} value={d.deviceId}>
                      {d.label || `Camera ${d.deviceId.slice(0, 8)}...`}
                    </option>
                  ))}
                </select>
              </div>
              <div className="setting-item">
                <label>Speaker/Headset</label>
                <select 
                  value={currentUser?.outputDeviceId || ''} 
                  onChange={(e) => handleAudioOutputDeviceChange(e.target.value)}
                >
                  {outputDevices.map(d => (
                    <option key={d.deviceId} value={d.deviceId}>
                      {d.label || `Speaker ${d.deviceId.slice(0, 8)}...`}
                    </option>
                  ))}
                </select>
              </div>
              
              {/* Camera Troubleshooting */}
              <div className="setting-item">
                <button 
                  className="troubleshoot-btn"
                  onClick={troubleshootCamera}
                  title="Troubleshoot camera issues"
                >
                  🔧 Troubleshoot Camera
                </button>
                <button 
                  className="refresh-devices-btn"
                  onClick={refreshDeviceList}
                  title="Refresh device list"
                >
                  🔄 Refresh Devices
                </button>
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
                <p>WebRTC Connections: {webrtcService.current?.peerConnections?.size || 0}</p>
              </div>
            </div>

            {/* Camera Status */}
            <div className="setting-group">
              <h4>Camera Status</h4>
              <div className="camera-status">
                <p>Camera: {isVideoOff ? '❌ Off' : '✅ On'}</p>
                <p>Microphone: {isMuted ? '❌ Muted' : '✅ Active'}</p>
                {localVideoRef.current?.srcObject && (
                  <p>Stream: ✅ Active</p>
                )}
                {error && (
                  <div className="error-message">
                    <p>⚠️ Error: {error}</p>
                    <button onClick={() => setError(null)}>Clear Error</button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MeetingPage; 