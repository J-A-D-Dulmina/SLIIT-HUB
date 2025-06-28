import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import '../styles/TutoringPage.css';
import { FaChevronLeft, FaChevronRight, FaEdit, FaTrash, FaUpload, FaRobot, FaClock, FaUserGraduate, FaTimes, FaGlobe } from 'react-icons/fa';
import SideMenu from '../../../shared/components/SideMenu';
import TopBar from '../../../shared/components/TopBar';
import LoadingSpinner from '../../../shared/components/LoadingSpinner';
import VideoEditPage from './VideoEditPage';
import LecturerReviewDialog from './LecturerReviewDialog';
import ConfirmationDialog from '../../../shared/components/ConfirmationDialog';
import Toast from '../../../shared/components/Toast';
import '../../../shared/styles/Toast.css';

const TutoringPage = () => {
  const navigate = useNavigate();
  const [videos, setVideos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [collapsed, setCollapsed] = useState(false);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [showEditPage, setShowEditPage] = useState(false);
  const [showReviewDialog, setShowReviewDialog] = useState(false);
  const [showPublishConfirm, setShowPublishConfirm] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showUploadDialog, setShowUploadDialog] = useState(false);
  const [selectedVideo, setSelectedVideo] = useState(null);
  const [uploadFormData, setUploadFormData] = useState({
    title: '',
    description: '',
    module: '',
    degree: '',
    year: '',
    semester: '',
    videoFile: null
  });

  const [uploading, setUploading] = useState(false);
  const [uploadMessage, setUploadMessage] = useState('');
  const [uploadError, setUploadError] = useState('');
  const [deleteMessage, setDeleteMessage] = useState('');
  const [moduleError, setModuleError] = useState('');

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 60000);
    return () => clearInterval(timer);
  }, []);

  // Fetch videos from backend
  useEffect(() => {
    fetchStudentVideos();
  }, []);

  const fetchStudentVideos = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await fetch('/api/tutoring/videos', { credentials: 'include' });
      if (res.ok) {
        const data = await res.json();
        setVideos(data.videos);
      } else {
        setError('Failed to fetch videos');
      }
    } catch (error) {
      console.error('Error fetching videos:', error);
      setError('Network error. Please check your connection.');
    } finally {
      setLoading(false);
    }
  };

  const handleVideoUpdate = (videoId, updates) => {
    setVideos(videos.map(video => 
      video.id === videoId ? { ...video, ...updates } : video
    ));
  };

  const handleVideoDelete = (video) => {
    setSelectedVideo(video);
    setShowDeleteConfirm(true);
  };

  const handleConfirmDelete = async () => {
    if (selectedVideo) {
      try {
        const res = await fetch(`/api/tutoring/videos/${selectedVideo.id}`, {
          method: 'DELETE',
          credentials: 'include'
        });
        if (res.ok) {
          // Remove from local state
      const updatedVideos = videos.filter(v => v.id !== selectedVideo.id);
      setVideos(updatedVideos);
          setDeleteMessage('Video deleted successfully!');
          setTimeout(() => setDeleteMessage(''), 3000);
        } else {
          const data = await res.json();
          alert(data.message || 'Failed to delete video');
        }
      } catch (error) {
        alert('Server error. Please try again.');
      }
    }
    setShowDeleteConfirm(false);
    setSelectedVideo(null);
  };

  const handlePublishToggle = (video) => {
    setSelectedVideo(video);
    setShowPublishConfirm(true);
  };

  const handleConfirmPublish = () => {
    if (selectedVideo) {
      const updatedVideos = videos.map(v =>
        v.id === selectedVideo.id
          ? { ...v, status: v.status === 'published' ? 'draft' : 'published' }
          : v
      );
      setVideos(updatedVideos);
    }
    setShowPublishConfirm(false);
    setSelectedVideo(null);
  };

  const fetchVideoById = async (videoId) => {
    const res = await fetch('/api/tutoring/videos', { credentials: 'include' });
    if (res.ok) {
      const data = await res.json();
      return data.videos.find(v => v.id === videoId);
    }
    return null;
  };

  const handleEditClick = async (video) => {
    const latestVideo = await fetchVideoById(video.id);
    setSelectedVideo(latestVideo || video);
    setShowEditPage(true);
  };

  const handleUploadSubmit = async (e) => {
    e.preventDefault();
    setUploading(true);
    setUploadMessage('');
    setUploadError('');
    setModuleError('');

    if (!uploadFormData.module) {
      setModuleError('Please select a module.');
      setUploading(false);
      return;
    }

    try {
      const formData = new FormData();
      formData.append('title', uploadFormData.title);
      formData.append('description', uploadFormData.description);
      formData.append('module', uploadFormData.module);
      formData.append('degree', uploadFormData.degree);
      formData.append('year', uploadFormData.year);
      formData.append('semester', uploadFormData.semester);
      formData.append('videoFile', uploadFormData.videoFile);

      const res = await fetch('/api/tutoring/upload', {
        method: 'POST',
        credentials: 'include',
        body: formData
      });

      const data = await res.json();

      if (res.ok) {
        setUploadMessage('Video uploaded successfully!');
        setShowUploadDialog(false);
        setUploadFormData({
          title: '',
          description: '',
          module: '',
          degree: '',
          year: '',
          semester: '',
          videoFile: null
        });
        // Refresh videos list
        fetchStudentVideos();
        // Clear message after 3 seconds
        setTimeout(() => setUploadMessage(''), 3000);
      } else {
        setUploadError(data.message || 'Upload failed');
      }
    } catch (error) {
      setUploadError('Server error. Please try again.');
    } finally {
      setUploading(false);
    }
  };

  const handleUploadChange = (e) => {
    const { name, value, files } = e.target;
    setUploadFormData(prev => ({
      ...prev,
      [name]: files ? files[0] : value
    }));
  };

  const handleReviewClick = (video) => {
    setSelectedVideo(video);
    setShowReviewDialog(true);
  };

  const handleSaveVideo = async (formData) => {
    if (selectedVideo) {
      try {
        const res = await fetch(`/api/tutoring/videos/${selectedVideo.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify(formData)
        });
        if (res.ok) {
          const data = await res.json();
          handleVideoUpdate(selectedVideo.id, data.video);
          return true;
        } else {
          const data = await res.json();
          alert(data.message || 'Failed to update video');
          return false;
        }
      } catch (error) {
        alert('Server error. Please try again.');
        return false;
      }
    } else {
      // Handle new video upload
      const newVideo = {
        id: videos.length + 1,
        ...formData,
        date: new Date().toISOString().split('T')[0],
        reviewStatus: null,
        reviewLecturer: null,
        aiFeatures: {
          summary: false,
          timestamps: false,
          lecturerRecommended: false
        }
      };
      setVideos([...videos, newVideo]);
      return true;
    }
  };

  const handleRequestReview = (reviewData) => {
    handleVideoUpdate(selectedVideo.id, {
      reviewStatus: 'pending',
      reviewLecturer: reviewData.lecturerId
    });
    setShowReviewDialog(false);
    setSelectedVideo(null);
  };

  const handleVideoClick = (video) => {
    if (video.status === 'published') {
      navigate(`/video/${video.module}/${video.id}`);
    }
  };

  if (showEditPage) {
    return (
      <VideoEditPage
        video={selectedVideo}
        onClose={() => {
          setShowEditPage(false);
          setSelectedVideo(null);
        }}
        onSave={handleSaveVideo}
      />
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
        <main className="tutoring-page">
          <div className="page-header">
            <button className="back-button">
              <FaChevronLeft />
              Back
            </button>
            <h1>My Tutoring Videos</h1>
          </div>

          <div className="videos-section">
            <div className="section-header">
              <h2>My Videos</h2>
              <button className="upload-btn" onClick={() => setShowUploadDialog(true)}>
                <FaUpload /> Upload Video
              </button>
            </div>

            {loading && (
              <LoadingSpinner message="Loading videos..." size="medium" />
            )}

            {error && (
              <div className="error-state">
                <p>{error}</p>
                <button onClick={fetchStudentVideos} className="retry-btn">
                  Try Again
                </button>
              </div>
            )}

            {!loading && !error && videos.length === 0 && (
              <div className="empty-state">
                <div className="empty-icon">📹</div>
                <h3>No videos yet</h3>
                <p>Upload your first video to get started!</p>
                <button onClick={() => setShowUploadDialog(true)} className="upload-first-btn">
                  <FaUpload /> Upload Your First Video
                </button>
              </div>
            )}

            {!loading && !error && videos.length > 0 && (
              <div className="video-list">
                {videos.map(video => (
                  <div 
                    key={video.id} 
                    className={`video-item ${video.status === 'published' ? 'clickable' : ''}`}
                    onClick={() => handleVideoClick(video)}
                  >
                    <div className="video-thumbnail">
                      {video.thumbnail ? (
                        <img 
                          src={`/api/tutoring/thumbnail/${video.id}`}
                          alt={video.title}
                          onError={(e) => {
                            // If thumbnail fails, show video element
                            e.target.style.display = 'none';
                            const videoElement = e.target.parentElement.querySelector('video');
                            if (videoElement) {
                              videoElement.style.display = 'block';
                            } else {
                              // Show placeholder if no video element
                              const placeholder = document.createElement('div');
                              placeholder.className = 'video-placeholder';
                              placeholder.innerHTML = '<div class="placeholder-icon">📹</div><span>Video</span>';
                              e.target.parentElement.appendChild(placeholder);
                            }
                          }}
                        />
                      ) : video.videoFile ? (
                        <video 
                          src={`/api/tutoring/video/${video.id}`}
                          preload="metadata"
                          muted
                          onLoadedMetadata={(e) => {
                            const duration = Math.floor(e.target.duration);
                            const minutes = Math.floor(duration / 60);
                            const seconds = duration % 60;
                            const durationSpan = e.target.parentElement.querySelector('.duration');
                            if (durationSpan) {
                              durationSpan.textContent = `${minutes}:${seconds.toString().padStart(2, '0')}`;
                            }
                          }}
                          onError={() => {
                            // Show placeholder if video fails
                            const placeholder = document.createElement('div');
                            placeholder.className = 'video-placeholder';
                            placeholder.innerHTML = '<div class="placeholder-icon">📹</div><span>Video</span>';
                            const videoElement = document.querySelector(`[data-video-id="${video.id}"]`);
                            if (videoElement) {
                              videoElement.style.display = 'none';
                              videoElement.parentElement.appendChild(placeholder);
                            }
                          }}
                          data-video-id={video.id}
                        />
                      ) : (
                        <div className="video-placeholder">
                          <div className="placeholder-icon">📹</div>
                          <span>No Video</span>
                        </div>
                      )}
                      <span className="duration">--:--</span>
                      {!video.aiFeatures?.lecturerRecommended && (
                        <button 
                          className="lecturer-recommend-btn"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleReviewClick(video);
                          }}
                        >
                          <FaUserGraduate /> Get Lecturer Review
                        </button>
                      )}
                    </div>
                    <div className="video-content">
                      <div className="video-info">
                        <h3>{video.title}</h3>
                        <p>{video.description}</p>
                      </div>
                      <div className="video-meta">
                        <span className="module">{video.module}</span>
                        <span className="semester">Semester {video.semester}</span>
                        <span className={`status ${video.status}`}>
                          {video.status === 'published' ? 'Published' : 'Unpublished'}
                        </span>
                      </div>
                      <div className="ai-tags">
                        {video.aiFeatures?.summary && (
                          <span className="ai-tag summary">
                            <FaRobot /> AI Summary
                          </span>
                        )}
                        {video.aiFeatures?.timestamps && (
                          <span className="ai-tag timestamps">
                            <FaClock /> AI Timestamps
                          </span>
                        )}
                        {video.aiFeatures?.lecturerRecommended && (
                          <span className="ai-tag lecturer">
                            <FaUserGraduate /> Lecturer Recommended
                          </span>
                        )}
                      </div>
                      <div className="video-actions-container">
                        <button 
                          className="video-action-btn edit-video-btn"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleEditClick(video);
                          }}
                          title="Edit Video"
                        >
                          <FaEdit /> Edit
                        </button>
                        <button 
                          className={`video-action-btn ${video.status === 'published' ? 'unpublish-video-btn' : 'publish-video-btn'}`}
                          onClick={(e) => {
                            e.stopPropagation();
                            handlePublishToggle(video);
                          }}
                          title={video.status === 'published' ? 'Unpublish Video' : 'Publish Video'}
                        >
                          <FaGlobe /> {video.status === 'published' ? 'Unpublish' : 'Publish'}
                        </button>
                        <button 
                          className="video-action-btn delete-video-btn"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleVideoDelete(video);
                          }}
                          title="Delete Video"
                        >
                          <FaTrash /> Delete
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </main>
      </div>

      {showReviewDialog && selectedVideo && (
        <LecturerReviewDialog
          video={selectedVideo}
          onClose={() => {
            setShowReviewDialog(false);
            setSelectedVideo(null);
          }}
          onRequestReview={handleRequestReview}
        />
      )}

      <ConfirmationDialog
        isOpen={showPublishConfirm}
        onClose={() => {
          setShowPublishConfirm(false);
          setSelectedVideo(null);
        }}
        onConfirm={handleConfirmPublish}
        title={selectedVideo?.status === 'published' ? 'Unpublish Video' : 'Publish Video'}
        message={selectedVideo?.status === 'published' 
          ? 'Are you sure you want to unpublish this video? It will no longer be visible to students.'
          : 'Are you sure you want to publish this video? It will be visible to all students.'}
        confirmText={selectedVideo?.status === 'published' ? 'Unpublish' : 'Publish'}
        type="warning"
      />

      <ConfirmationDialog
        isOpen={showDeleteConfirm}
        onClose={() => {
          setShowDeleteConfirm(false);
          setSelectedVideo(null);
        }}
        onConfirm={handleConfirmDelete}
        title="Delete Video"
        message="Are you sure you want to delete this video? This action cannot be undone."
        confirmText="Delete"
        type="danger"
      />

      {showUploadDialog && (
        <div className="tutoring-review-dialog">
          <div className="tutoring-review-content">
            <div className="tutoring-review-header">
              <h2>Upload New Video</h2>
              <button className="tutoring-review-close" onClick={() => setShowUploadDialog(false)}>
                <FaTimes />
              </button>
            </div>

            {uploadMessage && (
              <div className="success-message">{uploadMessage}</div>
            )}
            
            {uploadError && (
              <div className="error-message">{uploadError}</div>
            )}

            {moduleError && <div style={{ color: 'red', marginTop: 4 }}>{moduleError}</div>}

            <form className="tutoring-review-form" onSubmit={handleUploadSubmit}>
              <div className="tutoring-review-field">
                <label htmlFor="title">Title <span style={{color: 'red'}}>*</span></label>
                <input
                  type="text"
                  id="title"
                  name="title"
                  value={uploadFormData.title}
                  onChange={handleUploadChange}
                  required
                  placeholder="Enter video title"
                />
              </div>

              <div className="tutoring-review-field">
                <label htmlFor="description">Description</label>
                <textarea
                  id="description"
                  name="description"
                  value={uploadFormData.description}
                  onChange={handleUploadChange}
                  placeholder="Enter video description"
                />
              </div>

              <div className="tutoring-review-field">
                <label>Module Selection <span style={{color: 'red'}}>*</span></label>
                <div className="module-selection">
                  <select
                    name="degree"
                    value={uploadFormData.degree}
                    onChange={handleUploadChange}
                    required
                  >
                    <option value="">Select Degree</option>
                    <option value="BSc (Hons) in Information Technology">BSc (Hons) in Information Technology</option>
                    <option value="BSc (Hons) in Computer Science">BSc (Hons) in Computer Science</option>
                    <option value="BSc (Hons) in Software Engineering">BSc (Hons) in Software Engineering</option>
                    <option value="BSc (Hons) in Data Science">BSc (Hons) in Data Science</option>
                    <option value="BSc (Hons) in Cyber Security">BSc (Hons) in Cyber Security</option>
                    <option value="BSc (Hons) in Business Information Systems">BSc (Hons) in Business Information Systems</option>
                  </select>

                  <select
                    name="year"
                    value={uploadFormData.year}
                    onChange={handleUploadChange}
                    required
                  >
                    <option value="">Select Year</option>
                    <option value="1">Year 1</option>
                    <option value="2">Year 2</option>
                    <option value="3">Year 3</option>
                    <option value="4">Year 4</option>
                  </select>

                  <select
                    name="semester"
                    value={uploadFormData.semester}
                    onChange={handleUploadChange}
                    required
                  >
                    <option value="">Select Semester</option>
                    <option value="1">Semester 1</option>
                    <option value="2">Semester 2</option>
                  </select>

                  <select
                    name="module"
                    value={uploadFormData.module}
                    onChange={handleUploadChange}
                    required
                  >
                    <option value="">Select Module</option>
                    <option value="IT1010">IT1010 - Introduction to Programming</option>
                    <option value="IT1020">IT1020 - Data Structures</option>
                    <option value="IT1030">IT1030 - Database Systems</option>
                    <option value="IT1040">IT1040 - Web Development</option>
                    <option value="IT1050">IT1050 - Software Engineering</option>
                  </select>
                </div>
              </div>

              <div className="tutoring-review-field">
                <label htmlFor="videoFile">Video File <span style={{color: 'red'}}>*</span></label>
                <input
                  type="file"
                  id="videoFile"
                  name="videoFile"
                  onChange={handleUploadChange}
                  accept="video/*"
                  required
                />
                <small>Maximum file size: 500MB. Supported formats: MP4, AVI, MOV, WMV, FLV, WebM</small>
              </div>

              <div className="tutoring-review-actions">
                <button type="button" className="tutoring-review-cancel" onClick={() => setShowUploadDialog(false)}>
                  Cancel
                </button>
                <button type="submit" className="tutoring-review-submit" disabled={uploading}>
                  {uploading ? 'Uploading...' : 'Upload Video'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Show delete confirmation message as a popup */}
      <Toast message={deleteMessage} onClose={() => setDeleteMessage('')} />
    </div>
  );
};

export default TutoringPage;