import React, { useState } from 'react';
import '../../styles/TopBar.css';
import { FaBell, FaSearch, FaEnvelope, FaSave } from 'react-icons/fa';

const TopBar = ({ currentTime }) => {
  const [showNotifications, setShowNotifications] = useState(false);
  const [showSavedVideos, setShowSavedVideos] = useState(false);
  const [notifications, setNotifications] = useState([
    {
      id: 1,
      type: 'message',
      content: 'New message from Dr. Yasas Jayaweera',
      time: '10 minutes ago',
      read: false
    },
    {
      id: 2,
      type: 'meeting',
      content: 'Upcoming meeting: Research Discussion',
      time: '30 minutes ago',
      read: false
    },
    {
      id: 3,
      type: 'system',
      content: 'Your resource upload was approved',
      time: '2 hours ago',
      read: true
    },
    {
      id: 4,
      type: 'deadline',
      content: 'Reminder: Assignment due tomorrow',
      time: '5 hours ago',
      read: true
    }
  ]);

  const toggleNotifications = () => {
    setShowNotifications(!showNotifications);
    setShowSavedVideos(false);
  };

  const toggleSavedVideos = () => {
    setShowSavedVideos(!showSavedVideos);
    setShowNotifications(false);
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

  const [savedVideos, setSavedVideos] = useState([
    { id: 1, title: 'Saved Video 1', time: '2 days ago' },
    { id: 2, title: 'Saved Video 2', time: '1 week ago' },
  ]);

  return (
    <div className="top-bar">
      <div className="search-container">
        <div className="search-box">
          <FaSearch className="search-icon" />
          <input type="text" placeholder="Search for resources, tutors, or meetings..." />
        </div>
      </div>
      
      <div className="top-bar-right">
        <div className="current-time">
          {formatTime(currentTime)}
        </div>
        
        <div className="notification-container">
          <button className="notification-btn" onClick={toggleNotifications}>
            <FaBell />
            {unreadCount > 0 && <span className="notification-badge">{unreadCount}</span>}
          </button>
          
          {showNotifications && (
            <div className="notification-dropdown">
              <div className="notification-header">
                <h3>Notifications</h3>
                {unreadCount > 0 && (
                  <button className="mark-all-read">Mark all as read</button>
                )}
              </div>
              
              <div className="notification-list">
                {notifications.length > 0 ? (
                  notifications.map(notification => (
                    <div 
                      key={notification.id} 
                      className={`notification-item ${!notification.read ? 'unread' : ''}`}
                      onClick={() => markAsRead(notification.id)}
                    >
                      <div className="notification-icon">
                        {notification.type === 'message' && <FaEnvelope />}
                        {notification.type === 'meeting' && <FaBell />}
                        {notification.type === 'system' && <FaBell />}
                        {notification.type === 'deadline' && <FaBell />}
                      </div>
                      <div className="notification-content">
                        <p>{notification.content}</p>
                        <span className="notification-time">{notification.time}</span>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="no-notifications">No notifications</div>
                )}
              </div>
            </div>
          )}
        </div>

        <div className="saved-videos-container">
          <button className="saved-videos-btn" onClick={toggleSavedVideos}>
            <FaSave />
          </button>

          {showSavedVideos && (
            <div className="saved-videos-dropdown">
              <div className="saved-videos-header">
                <h3>Saved Videos</h3>
              </div>
              
              <div className="saved-videos-list">
                {savedVideos.length > 0 ? (
                  savedVideos.map(video => (
                    <div key={video.id} className="saved-video-item">
                      <div className="saved-video-content">
                        <p>{video.title}</p>
                        <span className="saved-video-time">{video.time}</span>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="no-saved-videos">No saved videos</div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default TopBar;