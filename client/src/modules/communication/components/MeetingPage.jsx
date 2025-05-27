import React, { useState, useRef, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { FaMicrophone, FaMicrophoneSlash, FaVideo, FaVideoSlash, FaDesktop, FaComments, FaUsers, FaEllipsisH, FaHandPaper, FaRecordVinyl, FaStop } from 'react-icons/fa';
import '../styles/MeetingPage.css';

const MeetingPage = () => {
  const { meetingId } = useParams();
  const navigate = useNavigate();
  const [isMuted, setIsMuted] = useState(false);
  const [isVideoOff, setIsVideoOff] = useState(false);
  const [isScreenSharing, setIsScreenSharing] = useState(false);
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [isParticipantsOpen, setIsParticipantsOpen] = useState(false);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [meetingData, setMeetingData] = useState(null);
  const [participants, setParticipants] = useState([]);
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const videoRef = useRef(null);
  const chatRef = useRef(null);
  const mediaRecorderRef = useRef(null);
  const recordingTimerRef = useRef(null);

  useEffect(() => {
    // Fetch meeting data
    const fetchMeetingData = async () => {
      try {
        // TODO: Replace with actual API call
        const dummyMeetingData = {
          id: meetingId,
          title: 'AI Tutorial Session',
          host: 'Prof. Alex Chen',
          participants: [
            { id: 1, name: 'You', role: 'Host' },
            { id: 2, name: 'Alex Chen', role: 'Participant' },
            { id: 3, name: 'Emma Wilson', role: 'Participant' }
          ]
        };
        setMeetingData(dummyMeetingData);
        setParticipants(dummyMeetingData.participants);
      } catch (error) {
        console.error('Error fetching meeting data:', error);
        // Handle error - maybe redirect to meetings page
        navigate('/my-meetings');
      }
    };

    fetchMeetingData();
  }, [meetingId, navigate]);

  useEffect(() => {
    // Initialize video stream
    if (videoRef.current) {
      navigator.mediaDevices.getUserMedia({ video: true, audio: true })
        .then(stream => {
          videoRef.current.srcObject = stream;
          // Initialize MediaRecorder
          mediaRecorderRef.current = new MediaRecorder(stream);
          
          mediaRecorderRef.current.ondataavailable = (event) => {
            if (event.data.size > 0) {
              const url = URL.createObjectURL(event.data);
              const a = document.createElement('a');
              a.href = url;
              a.download = `meeting-recording-${meetingId}-${new Date().toISOString()}.webm`;
              a.click();
              URL.revokeObjectURL(url);
            }
          };
        })
        .catch(err => {
          console.error('Error accessing media devices:', err);
        });
    }

    // Cleanup function
    return () => {
      if (videoRef.current && videoRef.current.srcObject) {
        const tracks = videoRef.current.srcObject.getTracks();
        tracks.forEach(track => track.stop());
      }
      if (recordingTimerRef.current) {
        clearInterval(recordingTimerRef.current);
      }
    };
  }, [meetingId]);

  const toggleMute = () => {
    setIsMuted(!isMuted);
    if (videoRef.current && videoRef.current.srcObject) {
      const audioTrack = videoRef.current.srcObject.getAudioTracks()[0];
      if (audioTrack) {
        audioTrack.enabled = isMuted;
      }
    }
  };

  const toggleVideo = () => {
    setIsVideoOff(!isVideoOff);
    if (videoRef.current && videoRef.current.srcObject) {
      const videoTrack = videoRef.current.srcObject.getVideoTracks()[0];
      if (videoTrack) {
        videoTrack.enabled = !isVideoOff;
      }
    }
  };

  const toggleScreenShare = async () => {
    try {
      if (!isScreenSharing) {
        const stream = await navigator.mediaDevices.getDisplayMedia({ video: true });
        // TODO: Implement screen sharing with WebRTC
        setIsScreenSharing(true);
      } else {
        // Stop screen sharing
        setIsScreenSharing(false);
      }
    } catch (err) {
      console.error('Error sharing screen:', err);
    }
  };

  const toggleRecording = () => {
    if (!isRecording) {
      // Start recording
      if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'inactive') {
        mediaRecorderRef.current.start();
        setIsRecording(true);
        // Start recording timer
        recordingTimerRef.current = setInterval(() => {
          setRecordingTime(prev => prev + 1);
        }, 1000);
      }
    } else {
      // Stop recording
      if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
        mediaRecorderRef.current.stop();
        setIsRecording(false);
        // Stop recording timer
        clearInterval(recordingTimerRef.current);
        setRecordingTime(0);
      }
    }
  };

  const formatRecordingTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const handleEndCall = () => {
    // Stop all media tracks
    if (videoRef.current && videoRef.current.srcObject) {
      const tracks = videoRef.current.srcObject.getTracks();
      tracks.forEach(track => track.stop());
    }
    // Navigate back to meetings page
    navigate('/my-meetings');
  };

  const sendMessage = (e) => {
    e.preventDefault();
    if (newMessage.trim()) {
      const message = {
        id: Date.now(),
        text: newMessage,
        sender: 'You',
        timestamp: new Date().toLocaleTimeString()
      };
      setMessages([...messages, message]);
      setNewMessage('');
      // TODO: Implement real-time chat with WebRTC or WebSocket
    }
  };

  if (!meetingData) {
    return <div className="meeting-page loading">Loading meeting...</div>;
  }

  return (
    <div className="meeting-page">
      <div className="meeting-main">
        <div className="video-grid">
          <div className="main-video">
            <video ref={videoRef} autoPlay playsInline muted={isMuted} />
            <div className="video-overlay">
              <span className="user-name">You</span>
              {isRecording && (
                <div className="recording-indicator">
                  <span className="recording-dot"></span>
                  <span className="recording-time">{formatRecordingTime(recordingTime)}</span>
                </div>
              )}
            </div>
          </div>
          {/* Add more video participants here */}
        </div>

        <div className="meeting-controls">
          <button className={`control-btn ${isMuted ? 'active' : ''}`} onClick={toggleMute}>
            {isMuted ? <FaMicrophoneSlash /> : <FaMicrophone />}
          </button>
          <button className={`control-btn ${isVideoOff ? 'active' : ''}`} onClick={toggleVideo}>
            {isVideoOff ? <FaVideoSlash /> : <FaVideo />}
          </button>
          <button className={`control-btn ${isScreenSharing ? 'active' : ''}`} onClick={toggleScreenShare}>
            <FaDesktop />
          </button>
          <button className={`control-btn ${isRecording ? 'recording' : ''}`} onClick={toggleRecording}>
            {isRecording ? <FaStop /> : <FaRecordVinyl />}
          </button>
          <button className="control-btn" onClick={() => setIsChatOpen(!isChatOpen)}>
            <FaComments />
          </button>
          <button className="control-btn" onClick={() => setIsParticipantsOpen(!isParticipantsOpen)}>
            <FaUsers />
          </button>
          <button className="control-btn">
            <FaHandPaper />
          </button>
          <button className="control-btn">
            <FaEllipsisH />
          </button>
          <button className="end-call-btn" onClick={handleEndCall}>End Call</button>
        </div>
      </div>

      {isChatOpen && (
        <div className="chat-sidebar">
          <div className="chat-header">
            <h3>Meeting Chat</h3>
            <button onClick={() => setIsChatOpen(false)}>×</button>
          </div>
          <div className="chat-messages" ref={chatRef}>
            {messages.map(message => (
              <div key={message.id} className="chat-message">
                <div className="message-header">
                  <span className="sender">{message.sender}</span>
                  <span className="timestamp">{message.timestamp}</span>
                </div>
                <p className="message-text">{message.text}</p>
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

      {isParticipantsOpen && (
        <div className="participants-sidebar">
          <div className="participants-header">
            <h3>Participants</h3>
            <button onClick={() => setIsParticipantsOpen(false)}>×</button>
          </div>
          <div className="participants-list">
            {participants.map(participant => (
              <div key={participant.id} className="participant">
                <span className="participant-name">{participant.name}</span>
                <span className="participant-role">{participant.role}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default MeetingPage; 