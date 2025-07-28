import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import ReactPlayer from 'react-player';
import '../styles/VideoDetailsPage.css';
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
import axios from 'axios';

// Default video structure
const DEFAULT_VIDEO = {
  id: '',
  title: '',
  description: '',
  duration: '00:00',
  date: '',
  videoUrl: '',
  publisher: '',
  isRecommended: false,
  hasAISummary: false,
  hasAITimestamps: false,
  uploadTime: '',
  views: 0,
  likes: 0,
  aiSummary: '',
  timestamps: [],
  comments: []
};

const VideoDetailsPage = () => {
  const { moduleId, videoId } = useParams();
  const navigate = useNavigate();
  const playerRef = useRef(null);
  const [collapsed, setCollapsed] = useState(true);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [video, setVideo] = useState(DEFAULT_VIDEO);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
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

    // Fetch video details from API
    fetchVideoDetails();
    
    return () => clearInterval(timer);
  }, [moduleId, videoId]);

  const fetchVideoDetails = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await axios.get(`http://localhost:5000/api/tutoring/videos/${videoId}`, {
        withCredentials: true
      });
      
      const videoData = response.data.video;
      
      // Transform the API data to match our component structure
      const transformedVideo = {
        id: videoData.id,
        title: videoData.title,
        description: videoData.description,
        duration: '00:00', // Duration not available in API
        date: new Date(videoData.uploadDate).toLocaleDateString(),
        videoUrl: videoData.videoFile ? `http://localhost:5000/${videoData.videoFile}` : '',
        publisher: 'Student', // Videos are uploaded by students
        isRecommended: videoData.aiFeatures?.lecturerRecommended || false,
        hasAISummary: videoData.aiFeatures?.summary || false,
        hasAITimestamps: videoData.aiFeatures?.timestamps || false,
        uploadTime: new Date(videoData.uploadDate).toLocaleTimeString(),
        views: videoData.views || 0,
        likes: 0, // Likes not implemented yet
        aiSummary: videoData.summary || '',
        timestamps: videoData.timestamps?.map(ts => ({
          time: ts.time_start || '00:00',
          title: ts.description || 'Untitled'
        })) || [],
        comments: [] // Comments not implemented yet
      };
      
      setVideo(transformedVideo);
    } catch (error) {
      console.error('Error fetching video details:', error);
      setError('Failed to load video details. Please try again.');
    } finally {
      setLoading(false);
    }
  };

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

  if (loading) {
    return (
      <div className="video-details-page">
        <div className="loading-container">
          <div className="loading-spinner">Loading...</div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="video-details-page">
        <div className="error-container">
          <h2>Error</h2>
          <p>{error}</p>
          <button onClick={fetchVideoDetails}>Try Again</button>
        </div>
      </div>
    );
  }

  if (!video || !video.id) {
    return (
      <div className="video-details-page">
        <div className="error-container">
          <h2>Video Not Found</h2>
          <p>The video you're looking for doesn't exist.</p>
          <button onClick={() => navigate(`/videos/${moduleId}`)}>Back to Videos</button>
        </div>
      </div>
    );
  }

  return (
    <div className="app-container">
      <SideMenu collapsed={collapsed} setCollapsed={setCollapsed} />
      <div className="main-content">
        <div className="sidebar-toggle-btn-wrapper">
          <button
            className="sidebar-toggle-btn"
            onClick={() => setCollapsed((v) => !v)}
            aria-label="Toggle sidebar"
          >
            {collapsed ? <FaChevronRight /> : <FaChevronLeft />}
          </button>
        </div>
        <TopBar currentTime={currentTime} />
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
      </div>
    </div>
  );
};

export default VideoDetailsPage; 