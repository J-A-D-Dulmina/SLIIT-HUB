import React, { useState } from 'react';
import '../../styles/TopBar.css';
import { FaBell, FaSearch, FaEnvelope } from 'react-icons/fa';

const TopBar = ({ currentTime }) => {
  const [showNotifications, setShowNotifications] = useState(false);
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
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const unreadCount = notifications.filter(n => !n.read).length;

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
        
        <div className="messages-btn">
          <FaEnvelope />
        </div>
      </div>
    </div>
  );
};

export default TopBar;