import React, { useState, useEffect } from 'react';
import '../styles/TutoringPage.css';
import { FaChevronLeft, FaChevronRight, FaEdit, FaTrash, FaUpload, FaEye, FaEyeSlash, FaRobot, FaClock, FaUserGraduate, FaCheck } from 'react-icons/fa';
import SideMenu from '../../../shared/components/SideMenu';
import TopBar from '../../../shared/components/TopBar';
import VideoEditModal from './VideoEditModal';
import LecturerReviewDialog from './LecturerReviewDialog';

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
  const [showEditModal, setShowEditModal] = useState(false);
  const [showReviewDialog, setShowReviewDialog] = useState(false);
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

  const handleVideoDelete = (videoId) => {
    if (window.confirm('Are you sure you want to delete this video?')) {
      setVideos(videos.filter(video => video.id !== videoId));
    }
  };

  const handlePublishToggle = (videoId) => {
    setVideos(videos.map(video => 
      video.id === videoId 
        ? { ...video, status: video.status === 'published' ? 'unpublished' : 'published' }
        : video
    ));
  };

  const handleEditClick = (video) => {
    setSelectedVideo(video);
    setShowEditModal(true);
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
        reviewLecturer: null
      };
      setVideos([...videos, newVideo]);
    }
    setShowEditModal(false);
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
              <button className="upload-btn" onClick={() => setShowEditModal(true)}>
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
                          handlePublishToggle(video.id);
                        }}
                      >
                        {video.status === 'published' ? <FaEyeSlash /> : <FaEye />}
                        {video.status === 'published' ? 'Unpublish' : 'Publish'}
                      </button>
                      <button 
                        className="action-btn delete-btn"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleVideoDelete(video.id);
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

      {showEditModal && (
        <VideoEditModal
          video={selectedVideo}
          onClose={() => {
            setShowEditModal(false);
            setSelectedVideo(null);
          }}
          onSave={handleSaveVideo}
        />
      )}

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
    </div>
  );
};

export default TutoringPage; 