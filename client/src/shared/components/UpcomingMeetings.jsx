import React from 'react';
import { useNavigate } from 'react-router-dom';
import '../../styles/UpcomingMeetings.css';
import { FaVideo, FaUsers, FaChalkboardTeacher } from 'react-icons/fa';

const UpcomingMeetings = ({ events }) => {
  const navigate = useNavigate();
  
  // Sort events by start time and filter to show only future events
  const upcomingEvents = events
    .filter(event => new Date(event.start) > new Date())
    .sort((a, b) => new Date(a.start) - new Date(b.start))
    .slice(0, 2); // Show only next 2 events

  const formatEventTime = (date) => {
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const formatEventDate = (date) => {
    const today = new Date();
    const tomorrow = new Date();
    tomorrow.setDate(today.getDate() + 1);
    
    if (date.toDateString() === today.toDateString()) {
      return 'Today';
    } else if (date.toDateString() === tomorrow.toDateString()) {
      return 'Tomorrow';
    } else {
      return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    }
  };

  const getEventIcon = (title) => {
    if (title.toLowerCase().includes('lecture')) {
      return <FaChalkboardTeacher className="event-icon lecture" />;
    } else if (title.toLowerCase().includes('meeting')) {
      return <FaUsers className="event-icon meeting" />;
    } else {
      return <FaVideo className="event-icon tutorial" />;
    }
  };

  const handleViewAll = () => {
    navigate('/join-meeting');
  };

  return (
    <div className="upcoming-meetings">
      <h3>Upcoming Meetings</h3>
      
      {upcomingEvents.length > 0 ? (
        <div className="meeting-list">
          {upcomingEvents.map(event => (
            <div key={event.id} className="meeting-item">
              <div className="meeting-icon">
                {getEventIcon(event.title)}
              </div>
              <div className="meeting-details">
                <h4>{event.title}</h4>
                <div className="meeting-time">
                  <span className="date">{formatEventDate(new Date(event.start))}</span>
                  <span className="time">{formatEventTime(new Date(event.start))}</span>
                </div>
              </div>
              <button className="join-btn">Join</button>
            </div>
          ))}
        </div>
      ) : (
        <div className="no-meetings">
          <p>No upcoming meetings</p>
        </div>
      )}
      
      <button className="view-all-btn" onClick={handleViewAll}>View All Meetings</button>
    </div>
  );
};

export default UpcomingMeetings;