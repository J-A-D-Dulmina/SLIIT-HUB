import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import '../styles/TopBar.css';
import { FaBell, FaSearch, FaEnvelope, FaSave, FaUser, FaSignOutAlt } from 'react-icons/fa';
import axios from 'axios';

const TopBar = ({ currentTime }) => {
  const [showNotifications, setShowNotifications] = useState(false);
  const [showSavedVideos, setShowSavedVideos] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const navigate = useNavigate();
  
  // Get user info from localStorage
  const userName = localStorage.getItem('userName');
  const [avatarUrl, setAvatarUrl] = useState('');

  const [notifications, setNotifications] = useState([]);

  const toggleNotifications = () => {
    setShowNotifications(!showNotifications);
    setShowSavedVideos(false);
    setShowUserMenu(false);
  };

  const toggleSavedVideos = () => {
    setShowSavedVideos(!showSavedVideos);
    setShowNotifications(false);
    setShowUserMenu(false);
  };

  const toggleUserMenu = () => {
    setShowUserMenu(!showUserMenu);
    setShowNotifications(false);
    setShowSavedVideos(false);
  };

  const handleLogout = async () => {
    try {
      // Call logout endpoint to clear cookie
      await axios.post('http://localhost:5000/api/logout', {}, {
        withCredentials: true
      });
      
      // Clear all localStorage data
      localStorage.clear();
      
      // Redirect to login
      navigate('/login');
    } catch (error) {
      console.error('Logout error:', error);
      // Still clear localStorage and redirect even if API call fails
      localStorage.clear();
      navigate('/login');
    }
  };

  const markAsRead = (id) => {
    setNotifications(
      notifications.map(notification => 
        notification.id === id 
          ? { ...notification, read: true } 
          : notification
      )
    );
  };

  const formatTime = (date) => {
    if (!(date instanceof Date)) {
      return '';
    }
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const unreadCount = notifications.filter(n => !n.read).length;

  const [savedVideos, setSavedVideos] = useState([]);
  useEffect(() => {
    const handler = (e) => {
      const url = e.detail;
      setAvatarUrl(url || '');
    };
    window.addEventListener('avatar-updated', handler);
    return () => window.removeEventListener('avatar-updated', handler);
  }, []);

  useEffect(() => {
    // Load notifications
    axios.get('http://localhost:5000/api/notifications', { withCredentials: true })
      .then(res => {
        const items = Array.isArray(res.data?.notifications) ? res.data.notifications : [];
        setNotifications(items);
      })
      .catch(() => setNotifications([]));

    // Load saved videos for current user
    axios.get('http://localhost:5000/api/tutoring/videos/saved/me', { withCredentials: true })
      .then(res => {
        const items = Array.isArray(res.data?.videos) ? res.data.videos : [];
        setSavedVideos(items.map(v => ({ id: v.id, title: v.title, time: new Date(v.savedAt).toLocaleString() })));
      })
      .catch(() => setSavedVideos([]));

    // Load profile image
    axios.get('http://localhost:5000/api/protected', { withCredentials: true })
      .then(res => {
        const url = res.data?.user?.profileImageUrl ? `http://localhost:5000/${res.data.user.profileImageUrl}` : '';
        setAvatarUrl(url);
      })
      .catch(() => setAvatarUrl(''));
  }, []);

  return (
    <header className="app-header">
      <div className="header-search">
        <div className="search-input-group">
          <FaSearch className="search-icon" />
          <input 
            type="text" 
            className="search-input"
            placeholder="Search for resources, tutors, or meetings..." 
          />
        </div>
      </div>
      
      <div className="header-actions">
        <div className="time-display">
          {formatTime(currentTime)}
        </div>
        
        <div className="notification-wrapper">
          <button className="icon-button notification-button" onClick={toggleNotifications}>
            <FaBell />
            {unreadCount > 0 && <span className="notification-count">{unreadCount}</span>}
          </button>
          
          {showNotifications && (
            <div className="notification-panel">
              <div className="panel-header">
                <h3>Notifications</h3>
                {unreadCount > 0 && (
                  <button className="mark-read-button">Mark all as read</button>
                )}
              </div>
              
              <div className="notification-items">
                {notifications.length > 0 ? (
                  notifications.map(notification => (
                    <div 
                      key={notification.id} 
                      className={`notification-entry ${!notification.read ? 'unread' : ''}`}
                      onClick={() => markAsRead(notification.id)}
                    >
                      <div className="entry-icon">
                        {notification.type === 'message' && <FaEnvelope />}
                        {notification.type === 'meeting' && <FaBell />}
                        {notification.type === 'system' && <FaBell />}
                        {notification.type === 'deadline' && <FaBell />}
                      </div>
                      <div className="entry-content">
                        <p>{notification.content}</p>
                        <span className="entry-time">{notification.time}</span>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="empty-notifications">No notifications</div>
                )}
              </div>
            </div>
          )}
        </div>

        <div className="saved-videos-wrapper">
          <button className="icon-button saved-button" onClick={toggleSavedVideos}>
            <FaSave />
          </button>

          {showSavedVideos && (
            <div className="saved-videos-panel">
              <div className="panel-header">
                <h3>Saved Videos</h3>
              </div>
              
              <div className="saved-videos-items">
                {savedVideos.length > 0 ? (
                  savedVideos.map(video => (
                    <div key={video.id} className="saved-video-entry">
                      <div className="entry-content">
                        <p>{video.title}</p>
                        <span className="entry-time">{video.time}</span>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="empty-saved">No saved videos</div>
                )}
              </div>
            </div>
          )}
        </div>

        <div className="user-menu-wrapper">
          <button className="icon-button user-button" onClick={toggleUserMenu}>
            {avatarUrl ? (
              <img src={avatarUrl} alt="avatar" style={{ width: 24, height: 24, borderRadius: '50%', objectFit: 'cover' }} />
            ) : (
              <FaUser />
            )}
          </button>

          {showUserMenu && (
            <div className="user-menu-panel">
              <div className="panel-header">
                <h3>User Menu</h3>
              </div>
              
              <div className="user-menu-items">
                <button className="menu-item" onClick={() => navigate('/profile')}>
                  <FaUser />
                  <span>Profile</span>
                </button>
                <button className="menu-item logout-button" onClick={handleLogout}>
                  <FaSignOutAlt />
                  <span>Logout</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};

export default TopBar;