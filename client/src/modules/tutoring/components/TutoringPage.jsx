import React, { useState, useEffect } from 'react';
import '../styles/TutoringPage.css';
import { FaChevronLeft, FaChevronRight, FaEdit, FaTrash, FaUpload, FaEye, FaEyeSlash, FaRobot, FaClock, FaUserGraduate, FaCheck } from 'react-icons/fa';
import SideMenu from '../../../shared/components/SideMenu';
import TopBar from '../../../shared/components/TopBar';
import VideoEditPage from './VideoEditPage';
import LecturerReviewDialog from './LecturerReviewDialog';
import ConfirmationDialog from '../../../shared/components/ConfirmationDialog';

// Dummy data for videos
const MY_VIDEOS = [
  {
    id: 1,
    title: 'Introduction to Python Programming',
    description: 'A comprehensive guide to Python basics for beginners.',
    status: 'published',
    module: 'IT1010',
    date: '2024-03-15',
    reviewStatus: 'pending',
    reviewLecturer: 'Dr. John Smith',
    aiFeatures: {
      summary: true,
      timestamps: true,
      lecturerRecommended: true
    }
  },
  {
    id: 2,
    title: 'Data Structures in Python',
    description: 'Understanding lists, dictionaries, and sets in Python.',
    status: 'published',
    module: 'IT1010',
    date: '2024-03-16',
    reviewStatus: null,
    reviewLecturer: null,
    aiFeatures: {
      summary: false,
      timestamps: true,
      lecturerRecommended: false
    }
  },
  {
    id: 3,
    title: 'Object-Oriented Programming',
    description: 'Learn the fundamentals of OOP in Python.',
    status: 'unpublished',
    module: 'IT1010',
    date: '2024-03-17',
    reviewStatus: null,
    reviewLecturer: null,
    aiFeatures: {
      summary: false,
      timestamps: false,
      lecturerRecommended: false
    }
  }
];

const TutoringPage = () => {
  const [videos, setVideos] = useState(MY_VIDEOS);
  const [collapsed, setCollapsed] = useState(false);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [showEditPage, setShowEditPage] = useState(false);
  const [showReviewDialog, setShowReviewDialog] = useState(false);
  const [showPublishConfirm, setShowPublishConfirm] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [selectedVideo, setSelectedVideo] = useState(null);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 60000);
    return () => clearInterval(timer);
  }, []);

  const handleVideoUpdate = (videoId, updates) => {
    setVideos(videos.map(video => 
      video.id === videoId ? { ...video, ...updates } : video
    ));
  };

  const handleVideoDelete = (video) => {
    setSelectedVideo(video);
    setShowDeleteConfirm(true);
  };

  const handleConfirmDelete = () => {
    if (selectedVideo) {
      const updatedVideos = videos.filter(v => v.id !== selectedVideo.id);
      setVideos(updatedVideos);
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

  const handleEditClick = (video) => {
    setSelectedVideo(video);
    setShowEditPage(true);
  };

  const handleReviewClick = (video) => {
    setSelectedVideo(video);
    setShowReviewDialog(true);
  };

  const handleSaveVideo = (formData) => {
    if (selectedVideo) {
      handleVideoUpdate(selectedVideo.id, formData);
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
    }
    setShowEditPage(false);
    setSelectedVideo(null);
  };

  const handleRequestReview = (reviewData) => {
    handleVideoUpdate(selectedVideo.id, {
      reviewStatus: 'pending',
      reviewLecturer: reviewData.lecturerId
    });
    setShowReviewDialog(false);
    setSelectedVideo(null);
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
            <h1>My Tutoring</h1>
          </div>

          <div className="videos-section">
            <div className="section-header">
              <h2>My Videos</h2>
              <button className="upload-btn" onClick={() => setShowEditPage(true)}>
                <FaUpload /> Upload Video
              </button>
            </div>

            <div className="video-list">
              {videos.map(video => (
                <div key={video.id} className="video-item">
                  <div className="video-thumbnail">
                    <img 
                      src={`https://img.youtube.com/vi/${video.id}/maxresdefault.jpg`} 
                      alt={video.title}
                      onError={(e) => {
                        e.target.src = 'https://via.placeholder.com/320x180?text=Video+Thumbnail';
                      }}
                    />
                    <span className="duration">10:30</span>
                    {!video.aiFeatures.lecturerRecommended && (
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
                      <span className={`status ${video.status}`}>
                        {video.status === 'published' ? 'Published' : 'Unpublished'}
                      </span>
                    </div>
                    <div className="ai-tags">
                      {video.aiFeatures.summary && (
                        <span className="ai-tag summary">
                          <FaRobot /> AI Summary
                        </span>
                      )}
                      {video.aiFeatures.timestamps && (
                        <span className="ai-tag timestamps">
                          <FaClock /> AI Timestamps
                        </span>
                      )}
                      {video.aiFeatures.lecturerRecommended && (
                        <span className="ai-tag lecturer">
                          <FaUserGraduate /> Lecturer Recommended
                        </span>
                      )}
                    </div>
                    <div className="video-actions">
                      <button 
                        className="action-btn edit-btn"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleEditClick(video);
                        }}
                      >
                        <FaEdit /> Edit
                      </button>
                      <button 
                        className="action-btn publish-btn"
                        onClick={(e) => {
                          e.stopPropagation();
                          handlePublishToggle(video);
                        }}
                      >
                        {video.status === 'published' ? <FaEyeSlash /> : <FaEye />}
                        {video.status === 'published' ? 'Unpublish' : 'Publish'}
                      </button>
                      <button 
                        className="action-btn delete-btn"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleVideoDelete(video);
                        }}
                      >
                        <FaTrash /> Delete
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
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
    </div>
  );
};

export default TutoringPage; 