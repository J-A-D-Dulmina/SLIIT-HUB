import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { FaChevronLeft, FaPlay, FaClock, FaUser, FaCalendar, FaBook, FaGraduationCap } from 'react-icons/fa';
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
    fetchPublishedVideos();

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
      const response = await axios.get(`http://localhost:5000/api/tutoring/videos/published?module=${moduleCode}`, {
        withCredentials: true
      });
      setPublishedVideos(response.data.videos || []);
    } catch (error) {
      console.error('Error fetching published videos:', error);
      setPublishedVideos([]);
    } finally {
      setLoading(false);
    }
  };

  const handleVideoClick = (video) => {
    navigate(`/video/${video._id}`);
  };

  const formatDuration = (seconds) => {
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

            {publishedVideos.length === 0 ? (
              <div className="no-videos">
                <div className="no-videos-icon">
                  <FaPlay />
                </div>
                <h3>No Published Videos</h3>
                <p>There are no published videos available for this module yet.</p>
                <p>Check back later for new content!</p>
              </div>
            ) : (
              <div className="videos-grid">
                {publishedVideos.map(video => (
                  <div 
                    key={video._id} 
                    className="video-card"
                    onClick={() => handleVideoClick(video)}
                  >
                    <div className="video-thumbnail">
                      <img 
                        src={video.thumbnail || '/assets/SLITT HUB logo transparent.png'} 
                        alt={video.title || 'Video thumbnail'}
                      />
                      <div className="video-overlay">
                        <FaPlay className="play-icon" />
                      </div>
                      {video.duration && (
                        <div className="video-duration">
                          {formatDuration(video.duration)}
                        </div>
                      )}
                    </div>
                    
                    <div className="video-info">
                      <h3 className="video-title">{video.title || 'Untitled Video'}</h3>
                      <p className="video-description">{video.description || 'No description available'}</p>
                      
                      <div className="video-meta">
                        <div className="meta-item">
                          <FaUser />
                          <span>{video.uploaderName || 'Unknown'}</span>
                        </div>
                        <div className="meta-item">
                          <FaCalendar />
                          <span>{formatDate(video.createdAt)}</span>
                        </div>
                        {video.duration && (
                          <div className="meta-item">
                            <FaClock />
                            <span>{formatDuration(video.duration)}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  );
};

export default ModulePage; 