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
  const [agreeTerms, setAgreeTerms] = useState(false);
  const [publishLoading, setPublishLoading] = useState(false);
  const [publishTarget, setPublishTarget] = useState(null);
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
  const [degrees, setDegrees] = useState([]);
  const [showTermsPopup, setShowTermsPopup] = useState(false); // NEW STATE

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 60000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    fetch('/api/admin/degrees')
      .then(res => res.json())
      .then(data => setDegrees(data))
      .catch(() => setDegrees([]));
  }, []);

  // Dynamic year/semester/module options
  const selectedDegree = degrees.find(d => d._id === uploadFormData.degree);
  const years = selectedDegree ? selectedDegree.years : [];
  const selectedYear = years.find(y => String(y.yearNumber) === String(uploadFormData.year));
  const semesters = selectedYear ? selectedYear.semesters : [];
  const selectedSemester = semesters.find(s => String(s.semesterNumber) === String(uploadFormData.semester));
  const modules = selectedSemester ? selectedSemester.modules : [];

  // Fetch videos from backend
  useEffect(() => {
    fetchStudentVideos();
  }, []);

  const fetchStudentVideos = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await fetch('http://localhost:5000/api/tutoring/videos', { credentials: 'include' });
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
        const res = await fetch(`http://localhost:5000/api/tutoring/videos/${selectedVideo.id}`, {
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

  // Add a function to handle publish/unpublish for a video in the list
  const handlePublishToggleList = (video) => {
    setPublishTarget(video);
    if (video.status === 'published') {
      setShowPublishConfirm(true); // Unpublish: show confirmation only
    } else {
      setShowTermsPopup(true); // Publish: show terms first
    }
  };

  const handleConfirmTerms = () => {
    setShowTermsPopup(false);
    setShowPublishConfirm(true); // Then show confirmation popup
  };

  const handleCancelTerms = () => {
    setShowTermsPopup(false);
    setPublishTarget(null);
    setAgreeTerms(false);
  };
  const handleConfirmPublishList = async () => {
    if (!publishTarget) return;
    setPublishLoading(true);
    try {
      const res = await fetch(`http://localhost:5000/api/tutoring/videos/${publishTarget.id}/publish`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ status: publishTarget.status === 'published' ? 'unpublished' : 'published' })
      });
      if (res.ok) {
        setVideos(videos => videos.map(v => v.id === publishTarget.id ? { ...v, status: v.status === 'published' ? 'unpublished' : 'published' } : v));
        setShowPublishConfirm(false);
        setAgreeTerms(false);
        setPublishTarget(null);
      }
    } finally {
      setPublishLoading(false);
    }
  };

  const fetchVideoById = async (videoId) => {
    const res = await fetch('http://localhost:5000/api/tutoring/videos', { credentials: 'include' });
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

      const res = await fetch('http://localhost:5000/api/tutoring/upload', {
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
        const res = await fetch(`http://localhost:5000/api/tutoring/videos/${selectedVideo.id}`, {
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
                          src={`http://localhost:5000/api/tutoring/thumbnail/${video.id}`}
                          alt={video.title}
                          onError={(e) => {
                            e.target.style.display = 'none';
                            e.target.nextSibling.style.display = 'block';
                          }}
                        />
                      ) : video.videoFile ? (
                        <video 
                          src={`http://localhost:5000/api/tutoring/video/${video.id}`}
                          controls
                          style={{ display: 'none' }}
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
                            handlePublishToggleList(video);
                          }}
                          title={video.status === 'published' ? 'Unpublish Video' : 'Publish Video'}
                          disabled={publishLoading}
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

      {showTermsPopup && publishTarget && publishTarget.status !== 'published' && (
        <ConfirmationDialog
          isOpen={showTermsPopup}
          onClose={handleCancelTerms}
          onConfirm={handleConfirmTerms}
          title="Terms and Conditions"
          message={<div>
            <p>To publish this video, you must agree to the following terms:</p>
            <div className="terms-box" style={{ background: '#f8fafc', padding: 12, borderRadius: 8, marginBottom: 12, fontSize: 14 }}>
              <ul style={{ margin: 0, paddingLeft: 18 }}>
                <li>This video is your original work and does not infringe on copyrights.</li>
                <li>You have the right to share this content for educational purposes.</li>
                <li>No inappropriate, offensive, or illegal content is included.</li>
                <li>Once published, the video will be visible to all students in the relevant degree/module.</li>
              </ul>
            </div>
            <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 15 }}>
              <input type="checkbox" checked={agreeTerms} onChange={e => setAgreeTerms(e.target.checked)} />
              I agree to the terms and conditions above
            </label>
          </div>}
          confirmText="Confirm"
          cancelText="Cancel"
          type="info"
          // Only allow confirm if terms are checked
          onConfirm={agreeTerms ? handleConfirmTerms : undefined}
        />
      )}

      {showPublishConfirm && publishTarget && (
        <ConfirmationDialog
          isOpen={showPublishConfirm}
          onClose={() => {
            setShowPublishConfirm(false);
            setPublishTarget(null);
            setAgreeTerms(false);
          }}
          onConfirm={handleConfirmPublishList}
          title={publishTarget.status === 'published' ? 'Unpublish Video' : 'Publish Video'}
          message={publishTarget.status === 'published'
            ? 'Are you sure you want to unpublish this video? It will no longer be visible to students.'
            : 'Are you sure you want to publish this video? It will be visible to all students.'}
          confirmText={publishTarget.status === 'published' ? 'Unpublish' : 'Publish'}
          type="warning"
        />
      )}

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
                  {/* Degree Dropdown */}
                  <select
                    name="degree"
                    value={uploadFormData.degree}
                    onChange={handleUploadChange}
                    required
                  >
                    <option value="">Select Degree</option>
                    {degrees.map(degree => (
                      <option key={degree._id} value={degree._id}>{degree.name}</option>
                    ))}
                  </select>

                  {/* Year Dropdown */}
                  {selectedDegree && (
                    <select
                      name="year"
                      value={uploadFormData.year}
                      onChange={handleUploadChange}
                      required
                    >
                      <option value="">Select Year</option>
                      {years.map(y => (
                        <option key={y.yearNumber} value={y.yearNumber}>Year {y.yearNumber}</option>
                      ))}
                    </select>
                  )}

                  {/* Semester Dropdown */}
                  {selectedYear && (
                    <select
                      name="semester"
                      value={uploadFormData.semester}
                      onChange={handleUploadChange}
                      required
                    >
                      <option value="">Select Semester</option>
                      {semesters.map(s => (
                        <option key={s.semesterNumber} value={s.semesterNumber}>Semester {s.semesterNumber}</option>
                      ))}
                    </select>
                  )}

                  {/* Module Dropdown */}
                  {selectedSemester && (
                    <select
                      name="module"
                      value={uploadFormData.module}
                      onChange={handleUploadChange}
                      required
                    >
                      <option value="">Select Module</option>
                      {modules.map(m => (
                        <option key={m.code} value={m.code}>{m.code} - {m.name}</option>
                      ))}
                    </select>
                  )}
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