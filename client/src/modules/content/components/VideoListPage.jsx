import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import '../styles/VideoListPage.css';
import { 
  FaChevronLeft, 
  FaChevronRight,
  FaPlay, 
  FaClock, 
  FaCalendarAlt,
  FaUser,
  FaThumbsUp,
  FaRobot,
  FaClock as FaTimestamp
} from 'react-icons/fa';
import SideMenu from '../../../shared/components/SideMenu';
import TopBar from '../../../shared/components/TopBar';

// Dummy data for videos
const VIDEOS = {
  'IT1010': [
    {
      id: 1,
      title: 'Introduction to Python Programming',
      description: 'Learn the basics of Python programming language and its applications.',
      duration: '45:30',
      date: '2024-03-15',
      thumbnail: 'https://via.placeholder.com/320x180',
      videoUrl: 'https://example.com/video1',
      publisher: 'Dr. John Smith',
      isRecommended: true,
      hasAISummary: true,
      hasAITimestamps: true,
      uploadTime: '10:30 AM'
    },
    {
      id: 2,
      title: 'Variables and Data Types',
      description: 'Understanding different data types and variable declaration in Python.',
      duration: '38:15',
      date: '2024-03-16',
      thumbnail: 'https://via.placeholder.com/320x180',
      videoUrl: 'https://example.com/video2',
      publisher: 'Prof. Sarah Johnson',
      isRecommended: false,
      hasAISummary: true,
      hasAITimestamps: false,
      uploadTime: '2:15 PM'
    },
    {
      id: 3,
      title: 'Control Structures',
      description: 'Learn about if-else statements, loops, and other control structures.',
      duration: '52:45',
      date: '2024-03-17',
      thumbnail: 'https://via.placeholder.com/320x180',
      videoUrl: 'https://example.com/video3',
      publisher: 'Dr. Michael Brown',
      isRecommended: true,
      hasAISummary: false,
      hasAITimestamps: true,
      uploadTime: '9:45 AM'
    }
  ]
};

const VideoListPage = () => {
  const { moduleId } = useParams();
  const navigate = useNavigate();
  const [collapsed, setCollapsed] = useState(false);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [videos, setVideos] = useState([]);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 60000);

    // Simulate fetching videos for the module
    setVideos(VIDEOS[moduleId] || []);
    
    return () => clearInterval(timer);
  }, [moduleId]);

  const handleVideoClick = (videoId) => {
    navigate(`/video/${moduleId}/${videoId}`);
  };

  const handleBackClick = () => {
    navigate('/units');
  };

  return (
    <div className="landing-page">
      <SideMenu collapsed={collapsed} />
      
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
        
        <div className="content-container">
          <div className="main-column">
            <div className="main-card">
              <div className="video-list-page">
                <div className="page-header">
                  <button className="back-button" onClick={handleBackClick}>
                    <FaChevronLeft /> Back to Modules
                  </button>
                  <h1>Module {moduleId} - Videos</h1>
                </div>

                <div className="video-grid">
                  {videos.map((video) => (
                    <div key={video.id} className="video-card" onClick={() => handleVideoClick(video.id)}>
                      <div className="video-thumbnail">
                        <img src={video.thumbnail} alt={video.title} />
                        <div className="play-overlay">
                          <FaPlay />
                        </div>
                        <div className="video-duration">
                          <FaClock /> {video.duration}
                        </div>
                      </div>
                      <div className="video-info">
                        <h3>{video.title}</h3>
                        <div className="video-meta">
                          <span className="publisher">
                            <FaUser /> {video.publisher}
                          </span>
                          <span className="upload-time">
                            <FaCalendarAlt /> {video.uploadTime}
                          </span>
                        </div>
                        <div className="video-features">
                          {video.isRecommended && (
                            <span className="feature recommended">
                              <FaThumbsUp /> Recommended
                            </span>
                          )}
                          {video.hasAISummary && (
                            <span className="feature ai-summary">
                              <FaRobot /> AI Summary
                            </span>
                          )}
                          {video.hasAITimestamps && (
                            <span className="feature ai-timestamps">
                              <FaClock /> AI Timestamps
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default VideoListPage; 