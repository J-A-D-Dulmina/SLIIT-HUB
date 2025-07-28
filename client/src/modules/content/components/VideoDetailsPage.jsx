import React, { useState, useEffect, useRef, useCallback } from 'react';
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
  FaEllipsisV,
  FaDownload
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
  const [videoError, setVideoError] = useState(false);
  const [videoLoading, setVideoLoading] = useState(true);
  const [videoReady, setVideoReady] = useState(false);
  const [comments, setComments] = useState([]);
  const [commentsLoading, setCommentsLoading] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);
  const [editingComment, setEditingComment] = useState(null);
  const [editContent, setEditContent] = useState('');
  const [replyContent, setReplyContent] = useState('');

  useEffect(() => {
    getCurrentUser();
  }, []);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 60000);

    // Fetch video details from API
    fetchVideoDetails();
    
    return () => clearInterval(timer);
  }, [moduleId, videoId]);

  const getCurrentUser = () => {
    const userType = localStorage.getItem('userType');
    const studentId = localStorage.getItem('studentId');
    const lecturerId = localStorage.getItem('lecturerId');
    const userName = localStorage.getItem('userName') || localStorage.getItem('name') || 'Unknown User';
    
    console.log('=== Frontend User Debug ===');
    console.log('userType:', userType);
    console.log('studentId:', studentId);
    console.log('lecturerId:', lecturerId);
    console.log('userName:', userName);
    console.log('All localStorage keys:', Object.keys(localStorage));
    console.log('All localStorage values:');
    Object.keys(localStorage).forEach(key => {
      console.log(`${key}:`, localStorage.getItem(key));
    });
    
    // Check if user is logged in
    if (!userType || (!studentId && !lecturerId)) {
      console.log('User not properly logged in!');
      setCurrentUser(null);
      return;
    }
    
    const currentUserData = {
      type: userType,
      id: studentId || lecturerId,
      studentId: studentId,
      lecturerId: lecturerId,
      name: userName
    };
    
    console.log('Setting current user to:', currentUserData);
    setCurrentUser(currentUserData);
  };

  const fetchComments = async () => {
    try {
      setCommentsLoading(true);
      const response = await axios.get(`http://localhost:5000/api/content/videos/${videoId}/comments`, {
        withCredentials: true
      });
      
      if (response.data.success) {
        console.log('Fetched comments:', response.data.comments);
        setComments(response.data.comments);
      }
    } catch (error) {
      console.error('Error fetching comments:', error);
    } finally {
      setCommentsLoading(false);
    }
  };

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
    
    // Fetch comments after video details
    fetchComments();
  };

  const handleBackClick = () => {
    navigate(`/videos/${moduleId}`);
  };

  const handleAddComment = async (e, content) => {
    e.preventDefault();
    if (!content.trim()) return;

    // Check if user is authenticated
    if (!currentUser || !currentUser.id) {
      alert('Please log in to add comments.');
      window.location.href = '/login';
      return;
    }

    try {
      console.log('Adding comment with user:', currentUser);
      const response = await axios.post(`http://localhost:5000/api/content/videos/${videoId}/comments`, {
        content: content
      }, {
        withCredentials: true
      });

      if (response.data.success) {
        console.log('Comment added successfully:', response.data.comment);
        setComments(prev => [response.data.comment, ...prev]);
        setNewComment('');
        setShowCommentForm(false);
      }
    } catch (error) {
      console.error('Error adding comment:', error);
      if (error.response?.status === 401) {
        alert('Please log in again to add comments.');
        window.location.href = '/login';
      } else {
        alert('Failed to add comment. Please try again.');
      }
    }
  };

  const handleReply = async (commentId, replyContent) => {
    if (!replyContent.trim()) return;

    try {
      console.log('Adding reply with user:', currentUser);
      const response = await axios.post(`http://localhost:5000/api/content/videos/comments/${commentId}/replies`, {
        content: replyContent
      }, {
        withCredentials: true
      });

      if (response.data.success) {
        console.log('Reply added successfully:', response.data.comment);
        setComments(prev => prev.map(comment => 
          comment._id === commentId ? response.data.comment : comment
        ));
        setReplyTo(null);
        setReplyContent('');
      }
    } catch (error) {
      console.error('Error adding reply:', error);
      alert('Failed to add reply. Please try again.');
    }
  };

  const handleEditComment = async (commentId, newContent) => {
    if (!newContent.trim()) return;

    try {
      const response = await axios.put(`http://localhost:5000/api/content/videos/comments/${commentId}`, {
        content: newContent
      }, {
        withCredentials: true
      });

      if (response.data.success) {
        setComments(prev => prev.map(comment => 
          comment._id === commentId ? response.data.comment : comment
        ));
      }
    } catch (error) {
      console.error('Error updating comment:', error);
      alert('Failed to update comment. Please try again.');
    }
  };

  const handleDeleteComment = async (commentId) => {
    if (!window.confirm('Are you sure you want to delete this comment?')) return;

    try {
      const response = await axios.delete(`http://localhost:5000/api/content/videos/comments/${commentId}`, {
        withCredentials: true
      });

      if (response.data.success) {
        setComments(prev => prev.filter(comment => comment._id !== commentId));
      }
    } catch (error) {
      console.error('Error deleting comment:', error);
      alert('Failed to delete comment. Please try again.');
    }
  };

  const handlePinComment = async (commentId) => {
    try {
      const response = await axios.patch(`http://localhost:5000/api/content/videos/comments/${commentId}/pin`, {}, {
        withCredentials: true
      });

      if (response.data.success) {
        setComments(prev => prev.map(comment => 
          comment._id === commentId ? response.data.comment : comment
        ));
      }
    } catch (error) {
      console.error('Error pinning comment:', error);
      alert('Failed to pin comment. Please try again.');
    }
  };

  const handleDownloadSummary = () => {
    if (!video.aiSummary) {
      alert('No AI summary available to download.');
      return;
    }

    // Create the content for the file
    const content = `AI Summary - ${video.title}\n\n${video.aiSummary}\n\nGenerated on: ${new Date().toLocaleString()}`;
    
    // Create a blob and download link
    const blob = new Blob([content], { type: 'text/plain' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `ai-summary-${video.title.replace(/[^a-z0-9]/gi, '-').toLowerCase()}.txt`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
  };

  const handleVideoReady = () => {
    setVideoLoading(false);
    setVideoReady(true);
    setVideoError(false);
  };

  const handleVideoError = (error) => {
    console.error('Video player error:', error);
    setVideoLoading(false);
    setVideoError(true);
    setVideoReady(false);
  };

  const handleVideoStart = () => {
    setVideoLoading(false);
  };

  const handleRetryVideo = () => {
    setVideoError(false);
    setVideoLoading(true);
    setVideoReady(false);
    // Force re-render of ReactPlayer
    if (playerRef.current) {
      playerRef.current.seekTo(0);
    }
  };

  const CommentForm = ({ onSubmit, initialValue = '', placeholder = 'Add a comment...', isReply = false }) => {
    const [localValue, setLocalValue] = useState(initialValue);
    const textareaRef = useRef(null);
    
    // Update local value when initialValue changes
    useEffect(() => {
      setLocalValue(initialValue);
    }, [initialValue]);

    // Focus the textarea when component mounts
    useEffect(() => {
      if (textareaRef.current) {
        textareaRef.current.focus();
      }
    }, []);

    const handleSubmit = useCallback((e) => {
      e.preventDefault();
      // Pass the local value to the parent
      onSubmit(e, localValue);
      setLocalValue(''); // Clear local value after submit
    }, [onSubmit, localValue]);

    const handleChange = useCallback((e) => {
      const value = e.target.value;
      setLocalValue(value);
    }, []);

    const handleCancel = useCallback(() => {
      setShowCommentForm(false);
      setReplyTo(null);
      setReplyContent('');
      setNewComment('');
    }, []);

    return (
      <form onSubmit={handleSubmit} className="comment-form">
        <textarea
          ref={textareaRef}
          value={localValue}
          onChange={handleChange}
          placeholder={placeholder}
          rows={3}
        />
        <div className="comment-form-actions">
          <button type="button" className="cancel-btn" onClick={handleCancel}>
            Cancel
          </button>
          <button type="submit" className="submit-btn">
            {replyTo ? 'Reply' : 'Comment'}
          </button>
        </div>
      </form>
    );
  };

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
              {videoLoading && (
                <div className="video-loading">
                  <div className="loading-spinner"></div>
                  <p>Loading video...</p>
                </div>
              )}
              
              {videoError && (
                <div className="video-error">
                  <div className="error-icon">⚠️</div>
                  <h3>Video Playback Error</h3>
                  <p>The video could not be loaded. This might be due to:</p>
                  <ul>
                    <li>Network connectivity issues</li>
                    <li>Video file format not supported</li>
                    <li>Server temporarily unavailable</li>
                  </ul>
                  <button className="retry-btn" onClick={handleRetryVideo}>
                    Try Again
                  </button>
                  <button className="download-video-btn" onClick={() => window.open(video.videoUrl, '_blank')}>
                    Download Video
                  </button>
                </div>
              )}
              
              {!videoError && (
                <ReactPlayer
                  ref={playerRef}
                  url={video.videoUrl}
                  width="100%"
                  height="100%"
                  playing={playing}
                  volume={volume}
                  controls={true}
                  onReady={handleVideoReady}
                  onError={handleVideoError}
                  onStart={handleVideoStart}
                  config={{
                    file: {
                      attributes: {
                        crossOrigin: "anonymous"
                      },
                      forceVideo: true,
                      forceHLS: false,
                      forceDASH: false
                    },
                    youtube: {
                      playerVars: { showinfo: 1 }
                    }
                  }}
                  style={{ display: videoLoading ? 'none' : 'block' }}
                />
              )}
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
                <div className="ai-summary-header">
                  <h3>AI-Generated Summary</h3>
                  {video.hasAISummary && video.aiSummary && (
                    <button 
                      className="download-summary-btn"
                      onClick={handleDownloadSummary}
                      title="Download AI Summary"
                    >
                      <FaDownload /> Download
                    </button>
                  )}
                </div>
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
            <CommentForm key="main-comment" onSubmit={(e, content) => handleAddComment(e, content)} initialValue={newComment} />
          )}

          <div className="comment-list">
            {commentsLoading ? (
              <div className="comments-loading">
                <div className="loading-spinner"></div>
                <p>Loading comments...</p>
              </div>
            ) : comments.length === 0 ? (
              <div className="no-comments">
                <p>No comments yet. Be the first to comment!</p>
              </div>
            ) : (
              comments.map((comment, index) => (
                <div key={comment._id} className={`comment ${comment.isPinned ? 'pinned' : ''}`}>
                  {comment.isPinned && (
                    <div className="pinned-badge">
                      <FaThumbtack /> Pinned
                    </div>
                  )}
                  <div className="comment-header">
                    <span className="user">{comment.user.name}</span>
                    <span className="user-type">{comment.user.type === 'lecturer' ? 'Lecturer' : 'Student'}</span>
                    <span className="timestamp">{new Date(comment.createdAt).toLocaleString()}</span>
                  </div>
                  
                  {editingComment === comment._id ? (
                    <div className="edit-comment-form">
                      <textarea
                        value={editContent}
                        onChange={(e) => setEditContent(e.target.value)}
                        rows={3}
                        className="edit-textarea"
                      />
                      <div className="edit-actions">
                        <button 
                          className="save-edit-btn"
                          onClick={() => {
                            handleEditComment(comment._id, editContent);
                            setEditingComment(null);
                            setEditContent('');
                          }}
                        >
                          Save
                        </button>
                        <button 
                          className="cancel-edit-btn"
                          onClick={() => {
                            setEditingComment(null);
                            setEditContent('');
                          }}
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  ) : (
                    <p className="content">{comment.content}</p>
                  )}
                  
                  <div className="comment-actions">
                    <button 
                      className="reply-btn"
                      onClick={() => setReplyTo(comment._id)}
                    >
                      <FaReply /> Reply
                    </button>
                    
                    {/* Debug: Log user comparison */}
                    {console.log('=== Comment User Debug ===')}
                    {console.log('Comment user:', comment.user)}
                    {console.log('Current user:', currentUser)}
                    {console.log('Comment user.id:', comment.user.id)}
                    {console.log('Current user.id:', currentUser?.id)}
                    {console.log('Current user.studentId:', currentUser?.studentId)}
                    {console.log('Current user.lecturerId:', currentUser?.lecturerId)}
                    {console.log('Comparison result:', currentUser && comment.user.id === currentUser.id)}
                    
                    {/* Show edit/delete/pin buttons only for comment author */}
                    {/* Temporary: Always show for testing */}
                    {(currentUser && comment.user.id === currentUser.id) || true && (
                      <>
                        <button 
                          className="edit-btn"
                          onClick={() => {
                            setEditingComment(comment._id);
                            setEditContent(comment.content);
                          }}
                        >
                          Edit
                        </button>
                        <button 
                          className="delete-btn"
                          onClick={() => handleDeleteComment(comment._id)}
                        >
                          Delete
                        </button>
                        {currentUser && currentUser.type === 'lecturer' && (
                          <button 
                            className={`pin-btn ${comment.isPinned ? 'pinned' : ''}`}
                            onClick={() => handlePinComment(comment._id)}
                          >
                            {comment.isPinned ? 'Unpin' : 'Pin'}
                          </button>
                        )}
                      </>
                    )}
                  </div>

                  {replyTo === comment._id && (
                    <CommentForm 
                      key={`reply-to-${comment._id}`}
                      onSubmit={(e, content) => {
                        e.preventDefault();
                        handleReply(comment._id, content);
                      }}
                      placeholder="Write a reply..."
                      isReply={true}
                      initialValue={replyContent}
                    />
                  )}

                  {comment.replies && comment.replies.length > 0 && (
                    <div className="replies">
                      {comment.replies.map((reply, replyIndex) => (
                        <div key={replyIndex} className="reply">
                          <div className="reply-header">
                            <span className="user">{reply.user.name}</span>
                            <span className="user-type">{reply.user.type === 'lecturer' ? 'Lecturer' : 'Student'}</span>
                            <span className="timestamp">{new Date(reply.createdAt).toLocaleString()}</span>
                          </div>
                          <p className="content">{reply.content}</p>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      </div>
        </div>
      </div>
    </div>
  );
};

export default VideoDetailsPage; 