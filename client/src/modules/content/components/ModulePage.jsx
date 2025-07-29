import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { FaChevronLeft, FaPlay, FaClock, FaUser, FaCalendar, FaBook, FaGraduationCap, FaRobot, FaUserGraduate } from 'react-icons/fa';
import SideMenu from '../../../shared/components/SideMenu';
import TopBar from '../../../shared/components/TopBar';
import moment from 'moment';
import '../styles/ModulePage.css';
import axios from 'axios';

const ModulePage = () => {
  const { moduleCode } = useParams();
  const navigate = useNavigate();
  const [collapsed, setCollapsed] = useState(false);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [moduleInfo, setModuleInfo] = useState(null);
  const [publishedVideos, setPublishedVideos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 60000);

    fetchModuleInfo();
    fetchPublishedVideos(); // Call immediately

    return () => clearInterval(timer);
  }, [moduleCode]);

  const fetchModuleInfo = async () => {
    try {
      // Fetch all degrees to find the module info
      const response = await axios.get('http://localhost:5000/api/admin/degrees');
      const degrees = response.data;
      
      // Find the module across all degrees
      let foundModule = null;
      let foundDegree = null;
      let foundYear = null;
      let foundSemester = null;

      for (const degree of degrees) {
        for (const year of degree.years) {
          for (const semester of year.semesters) {
            const module = semester.modules.find(m => m.code === moduleCode);
            if (module) {
              foundModule = module;
              foundDegree = degree;
              foundYear = year;
              foundSemester = semester;
              break;
            }
          }
          if (foundModule) break;
        }
        if (foundModule) break;
      }

      if (foundModule) {
        setModuleInfo({
          module: foundModule,
          degree: foundDegree,
          year: foundYear,
          semester: foundSemester
        });
      } else {
        setError('Module not found');
      }
    } catch (error) {
      console.error('Error fetching module info:', error);
      setError('Failed to load module information');
    }
  };

  const fetchPublishedVideos = async () => {
    try {
      setLoading(true);
      
      // Fetch all published videos (simpler approach)
      console.log('Fetching all published videos...');
      
      const response = await axios.get(`http://localhost:5000/api/tutoring/videos/published`, {
        withCredentials: true
      });
      
      console.log('All published videos response:', response.data);
      
      // Filter videos for this specific module
      const allVideos = response.data.videos || [];
      const moduleVideos = allVideos.filter(video => video.module === moduleCode);
      
      console.log('Filtered videos for module', moduleCode, ':', moduleVideos);
      console.log('Sample video structure:', moduleVideos[0]);
      console.log('Video IDs:', moduleVideos.map(v => ({ id: v.id, _id: v._id, title: v.title })));
      
      setPublishedVideos(moduleVideos);
    } catch (error) {
      console.error('Error fetching published videos:', error);
      setPublishedVideos([]);
    } finally {
      setLoading(false);
    }
  };

  const handleVideoClick = (video) => {
    console.log('=== Video Click Debug ===');
    console.log('Video object:', video);
    console.log('Video ID:', video.id);
    console.log('Video _id:', video._id);
    console.log('Video title:', video.title);
    console.log('Module code:', moduleCode);
    console.log('Navigation URL:', `/video/${moduleCode}/${video.id}`);
    
    if (!video.id) {
      console.error('Video ID is missing!');
      console.error('Available video fields:', Object.keys(video));
      alert('Error: Video ID is missing. Please try again.');
      return;
    }
    
    navigate(`/video/${moduleCode}/${video.id}`);
  };

  const formatDuration = (seconds) => {
    if (!seconds || seconds <= 0) return '';
    
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    
    if (hours > 0) {
      return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }
    return `${minutes}:${secs.toString().padStart(2, '0')}`;
  };

  const formatDate = (date) => {
    return moment(date).format('MMM D, YYYY');
  };

  if (loading || !moduleInfo) {
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
              {collapsed ? <FaChevronLeft /> : <FaChevronLeft />}
            </button>
          </div>
          <TopBar currentTime={currentTime} />
          <main className="module-page">
            <div className="loading">Loading module...</div>
          </main>
        </div>
      </div>
    );
  }

  if (error) {
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
              {collapsed ? <FaChevronLeft /> : <FaChevronLeft />}
            </button>
          </div>
          <TopBar currentTime={currentTime} />
          <main className="module-page">
            <div className="error-message">
              <h2>Error</h2>
              <p>{error}</p>
              <button onClick={() => navigate('/modules')}>Back to Modules</button>
            </div>
          </main>
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
            {collapsed ? <FaChevronLeft /> : <FaChevronLeft />}
          </button>
        </div>
        <TopBar currentTime={currentTime} />
        
        <main className="module-page">
                    <div className="module-header">
            <div className="header-section">
              <button className="back-btn" onClick={() => navigate('/modules')}>
                <FaChevronLeft /> Back to Modules
              </button>
              
              {moduleInfo && (
                <div className="module-path">
                  <span className="path-item">
                    <FaGraduationCap />
                    {moduleInfo.degree.name}
                  </span>
                  <span className="path-separator">/</span>
                  <span className="path-item">Year {moduleInfo.year.yearNumber}</span>
                  <span className="path-separator">/</span>
                  <span className="path-item">Semester {moduleInfo.semester.semesterNumber}</span>
                </div>
              )}
            </div>
            
            {moduleInfo && (
              <div className="module-details">
                <div className="module-title">
                  <h1>{moduleInfo.module.name}</h1>
                  <span className="module-code">{moduleInfo.module.code}</span>
                  <span className="module-credits">{moduleInfo.module.credit} Credits</span>
                </div>
              </div>
            )}
          </div>

          <div className="videos-section">
            <div className="videos-header">
              <h2>Published Videos</h2>
              <span className="video-count">{publishedVideos.length} video{publishedVideos.length !== 1 ? 's' : ''}</span>
            </div>

            {!loading && publishedVideos.length === 0 ? (
              <div className="no-videos">
                <div className="no-videos-icon">
                  <FaPlay />
                </div>
                <h3>No Published Videos</h3>
                <p>There are no published videos available for this module yet.</p>
                <p>Check back later for new content!</p>
                {/* Debug: Show the module code being searched */}
                <p style={{ fontSize: '0.8rem', color: '#666', marginTop: '1rem' }}>
                  Debug: Searching for module "{moduleCode}"
                </p>
              </div>
            ) : (
              <div className="videos-grid">
                {publishedVideos.map(video => {
                  // Clean thumbnail URL construction
                  const thumbnailUrl = video.thumbnail 
                    ? `http://localhost:5000/${video.thumbnail}` 
                    : '/assets/SLITT HUB logo transparent.png';
                  
                  // Clean uploader name extraction
                  const uploaderName = video.uploaderName || video.studentName || video.studentId || 'Unknown';
                  
                  // Clean upload date extraction
                  const uploadDate = video.uploadDate || video.createdAt || video.addDate || new Date();
                  
                  // Clean duration formatting
                  const formattedDuration = video.duration && video.duration > 0 ? formatDuration(video.duration) : null;
                  
                  return (
                    <div 
                      key={video.id} 
                      className="video-card"
                      onClick={() => handleVideoClick(video)}
                    >
                      {/* Video Thumbnail Section */}
                      <div className="video-thumbnail">
                        <img 
                          src={thumbnailUrl}
                          alt={video.title || 'Video thumbnail'}
                          onError={(e) => {
                            e.target.src = '/assets/SLITT HUB logo transparent.png';
                          }}
                        />
                        
                        {/* Play Icon */}
                        <div className="play-icon">
                          <FaPlay />
                        </div>
                        
                        {/* Duration Badge */}
                        {formattedDuration && (
                          <div className="video-duration">
                            {formattedDuration}
                          </div>
                        )}
                        
                        {/* Published Status Badge */}
                        {video.status === 'published' && (
                          <div className="publish-status-badge">
                            Published
                          </div>
                        )}
                      </div>
                      
                      {/* Video Information Section */}
                      <div className="video-info">
                        {/* Title */}
                        <h3 className="video-title">
                          {video.title || 'Untitled Video'}
                        </h3>
                        
                        {/* Description */}
                        <p className="video-description">
                          {video.description || 'No description available'}
                        </p>
                        
                        {/* Meta Information */}
                        <div className="video-meta">
                          {/* Uploader */}
                          <div className="meta-item">
                            <FaUser />
                            <span>{uploaderName}</span>
                          </div>
                          
                          {/* Upload Date */}
                          <div className="meta-item">
                            <FaCalendar />
                            <span>{formatDate(uploadDate)}</span>
                          </div>
                          
                          {/* Duration */}
                          {formattedDuration && (
                            <div className="meta-item">
                              <FaClock />
                              <span>{formattedDuration}</span>
                            </div>
                          )}
                          
                          {/* Module */}
                          <div className="meta-item">
                            <FaBook />
                            <span>{video.module || moduleCode}</span>
                          </div>
                        </div>
                        
                        {/* AI Features Badges */}
                        {video.aiFeatures && (
                          <div className="ai-features-badges">
                            {video.aiFeatures.summary && (
                              <span className="ai-badge summary">
                                <FaRobot /> AI Summary
                              </span>
                            )}
                            {video.aiFeatures.timestamps && (
                              <span className="ai-badge timestamps">
                                <FaClock /> AI Timestamps
                              </span>
                            )}
                            {video.aiFeatures.lecturerRecommended && (
                              <span className="ai-badge recommended">
                                <FaUserGraduate /> Recommended
                              </span>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  );
};

export default ModulePage; 