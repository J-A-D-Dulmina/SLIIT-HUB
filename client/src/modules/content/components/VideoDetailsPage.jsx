import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import ReactPlayer from 'react-player';
import '../../../styles/VideoDetailsPage.css';
import { 
  FaChevronLeft, 
  FaChevronRight,
  FaPlay, 
  FaClock, 
  FaCalendarAlt,
  FaUser,
  FaThumbsUp,
  FaRobot,
  FaClock as FaTimestamp,
  FaComment,
  FaThumbtack,
  FaExpand,
  FaCompress,
  FaShare,
  FaBookmark,
  FaPause,
  FaVolumeMute,
  FaVolumeUp,
  FaEye,
  FaReply,
  FaEllipsisV
} from 'react-icons/fa';
import SideMenu from '../../../shared/components/SideMenu';
import TopBar from '../../../shared/components/TopBar';

// Dummy data for video details
const VIDEO_DETAILS = {
  'IT1010': {
    1: {
      id: 1,
      title: 'Introduction to Python Programming',
      description: 'Learn the basics of Python programming language and its applications.',
      duration: '45:30',
      date: '2024-03-15',
      videoUrl: 'https://example.com/video1',
      publisher: 'Dr. John Smith',
      isRecommended: true,
      hasAISummary: true,
      hasAITimestamps: true,
      uploadTime: '10:30 AM',
      views: 1234,
      likes: 89,
      aiSummary: 'This lecture covers the fundamental concepts of Python programming, including variables, data types, and basic syntax. The instructor demonstrates practical examples and best practices for beginners.',
      timestamps: [
        { time: '00:00', title: 'Introduction' },
        { time: '05:30', title: 'Setting up Python' },
        { time: '12:45', title: 'Variables and Data Types' },
        { time: '25:15', title: 'Basic Operations' },
        { time: '35:20', title: 'Practice Examples' }
      ],
      comments: [
        {
          id: 1,
          user: 'Dr. Sarah Johnson',
          role: 'Lecturer',
          content: 'Important correction: When using floating-point numbers, always be careful with precision. Use the decimal module for financial calculations.',
          isPinned: true,
          timestamp: '2024-03-15 11:30 AM'
        },
        {
          id: 2,
          user: 'Student123',
          role: 'Student',
          content: 'Great explanation! The examples really helped me understand the concepts.',
          isPinned: false,
          timestamp: '2024-03-15 02:15 PM'
        },
        {
          id: 3,
          user: 'Alex Chen',
          role: 'Student',
          content: 'I have a question about the data types section. Could someone explain the difference between lists and tuples in more detail?',
          isPinned: false,
          timestamp: '2024-03-15 03:45 PM',
          replies: [
            {
              id: 1,
              user: 'Emma Wilson',
              role: 'Student',
              content: 'Lists are mutable (can be changed) while tuples are immutable (cannot be changed). Lists use square brackets [] and tuples use parentheses (). For example: my_list = [1, 2, 3] can be modified, but my_tuple = (1, 2, 3) cannot.',
              timestamp: '2024-03-15 04:20 PM'
            }
          ]
        }
      ]
    }
  }
};

const VideoDetailsPage = () => {
  const { moduleId, videoId } = useParams();
  const navigate = useNavigate();
  const playerRef = useRef(null);
  const [collapsed, setCollapsed] = useState(true);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [video, setVideo] = useState(null);
  const [activeTab, setActiveTab] = useState('summary');
  const [playing, setPlaying] = useState(false);
  const [volume, setVolume] = useState(0.8);
  const [newComment, setNewComment] = useState('');
  const [replyTo, setReplyTo] = useState(null);
  const [showCommentForm, setShowCommentForm] = useState(false);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 60000);

    // Simulate fetching video details
    setVideo(VIDEO_DETAILS[moduleId]?.[videoId] || null);
    
    return () => clearInterval(timer);
  }, [moduleId, videoId]);

  const handleBackClick = () => {
    navigate(`/videos/${moduleId}`);
  };

  const handleAddComment = (e) => {
    e.preventDefault();
    if (!newComment.trim()) return;

    const comment = {
      id: Date.now(),
      user: 'Current Student', // This would come from your auth system
      role: 'Student',
      content: newComment,
      isPinned: false,
      timestamp: new Date().toLocaleString(),
      replies: []
    };

    setVideo(prev => ({
      ...prev,
      comments: [...prev.comments, comment]
    }));
    setNewComment('');
    setShowCommentForm(false);
  };

  const handleReply = (commentId, replyContent) => {
    if (!replyContent.trim()) return;

    const reply = {
      id: Date.now(),
      user: 'Current Student', // This would come from your auth system
      role: 'Student',
      content: replyContent,
      timestamp: new Date().toLocaleString()
    };

    setVideo(prev => ({
      ...prev,
      comments: prev.comments.map(comment => 
        comment.id === commentId
          ? { ...comment, replies: [...(comment.replies || []), reply] }
          : comment
      )
    }));
    setReplyTo(null);
  };

  const CommentForm = ({ onSubmit, initialValue = '', placeholder = 'Add a comment...' }) => (
    <form onSubmit={onSubmit} className="comment-form">
      <textarea
        value={initialValue}
        onChange={(e) => setNewComment(e.target.value)}
        placeholder={placeholder}
        rows={3}
      />
      <div className="comment-form-actions">
        <button type="button" className="cancel-btn" onClick={() => {
          setShowCommentForm(false);
          setReplyTo(null);
        }}>
          Cancel
        </button>
        <button type="submit" className="submit-btn">
          {replyTo ? 'Reply' : 'Comment'}
        </button>
      </div>
    </form>
  );

  if (!video) {
    return <div>Loading...</div>;
  }

  return (
    <div className="video-details-page">
      <div className="page-header">
        <button className="back-button" onClick={() => window.history.back()}>
          <FaChevronLeft /> Back
        </button>
        <h1>{video.title}</h1>
      </div>

      <div className="content-wrapper">
        <div className="video-section">
          <div className="video-player-container">
            <div className="video-player">
              <ReactPlayer
                ref={playerRef}
                url={video.videoUrl}
                width="100%"
                height="100%"
                playing={playing}
                volume={volume}
                controls={true}
                config={{
                  youtube: {
                    playerVars: { showinfo: 1 }
                  }
                }}
              />
            </div>
          </div>

          <div className="video-actions">
            <button className="action-btn like-btn">
              <FaThumbsUp />
              <span className="action-text">Like</span>
              <span className="action-count">{video.likes}</span>
            </button>
            <button className="action-btn share-btn">
              <FaShare />
              <span className="action-text">Share</span>
            </button>
            <button className="action-btn save-btn">
              <FaBookmark />
              <span className="action-text">Save</span>
            </button>
          </div>

          <div className="video-info">
            <div className="video-meta">
              <span>
                <FaEye /> {video.views} views
              </span>
              <span>
                <FaCalendarAlt /> {video.date}
              </span>
              <span>
                <FaClock /> {video.duration}
              </span>
            </div>
            <p className="description">{video.description}</p>
          </div>

          <div className="content-tabs">
            <button 
              className={`tab-btn ${activeTab === 'summary' ? 'active' : ''}`}
              onClick={() => setActiveTab('summary')}
            >
              <FaRobot /> AI Summary
            </button>
            <button 
              className={`tab-btn ${activeTab === 'timestamps' ? 'active' : ''}`}
              onClick={() => setActiveTab('timestamps')}
            >
              <FaTimestamp /> Timestamps
            </button>
          </div>

          <div className="tab-content">
            {activeTab === 'summary' && (
              <div className="ai-summary">
                <h3>AI-Generated Summary</h3>
                <p>{video.aiSummary}</p>
              </div>
            )}
            {activeTab === 'timestamps' && (
              <div className="timestamps">
                <h3>Video Timestamps</h3>
                <div className="timestamp-list">
                  {video.timestamps.map((timestamp, index) => (
                    <div 
                      key={index} 
                      className="timestamp-item"
                      onClick={() => {
                        const [minutes, seconds] = timestamp.time.split(':').map(Number);
                        const totalSeconds = minutes * 60 + seconds;
                        if (playerRef.current) {
                          playerRef.current.seekTo(totalSeconds);
                          setPlaying(true);
                        }
                      }}
                    >
                      <span className="time">{timestamp.time}</span>
                      <span className="title">{timestamp.title}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="comments-section">
          <div className="tags-container">
            {video.isRecommended && (
              <div className="tag recommended">
                <FaThumbsUp /> Recommended
              </div>
            )}
            <div className="ai-features">
              {video.hasAISummary && (
                <div className="tag ai-summary">
                  <FaRobot /> AI Summary
                </div>
              )}
              {video.hasAITimestamps && (
                <div className="tag ai-timestamps">
                  <FaClock /> AI Timestamps
                </div>
              )}
            </div>
            <div className="tag publisher">
              <FaUser /> {video.publisher}
            </div>
          </div>

          <div className="comments-header">
            <h3>Comments</h3>
            <button 
              className="add-comment-btn"
              onClick={() => setShowCommentForm(true)}
            >
              <FaComment /> Add Comment
            </button>
          </div>

          {showCommentForm && !replyTo && (
            <CommentForm onSubmit={handleAddComment} />
          )}

          <div className="comment-list">
            {video.comments.map((comment, index) => (
              <div key={index} className={`comment ${comment.isPinned ? 'pinned' : ''}`}>
                {comment.isPinned && (
                  <div className="pinned-badge">
                    <FaThumbtack /> Pinned
                  </div>
                )}
                <div className="comment-header">
                  <span className="user">{comment.user}</span>
                  <span className="role">{comment.role}</span>
                  <span className="timestamp">{comment.timestamp}</span>
                </div>
                <p className="content">{comment.content}</p>
                
                {comment.role !== 'Lecturer' && (
                  <button 
                    className="reply-btn"
                    onClick={() => setReplyTo(comment.id)}
                  >
                    <FaReply /> Reply
                  </button>
                )}

                {replyTo === comment.id && (
                  <CommentForm 
                    onSubmit={(e) => {
                      e.preventDefault();
                      handleReply(comment.id, newComment);
                    }}
                    placeholder="Write a reply..."
                  />
                )}

                {comment.replies && comment.replies.length > 0 && (
                  <div className="replies">
                    {comment.replies.map((reply, replyIndex) => (
                      <div key={replyIndex} className="reply">
                        <div className="reply-header">
                          <span className="user">{reply.user}</span>
                          <span className="role">{reply.role}</span>
                          <span className="timestamp">{reply.timestamp}</span>
                        </div>
                        <p className="content">{reply.content}</p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default VideoDetailsPage; 