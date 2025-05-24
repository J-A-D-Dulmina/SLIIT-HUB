import React, { useState, useEffect } from 'react';
import { Calendar, momentLocalizer } from 'react-big-calendar';
import moment from 'moment';
import 'react-big-calendar/lib/css/react-big-calendar.css';
import '../../../styles/LandingPage.css';
import SideMenu from '../../../shared/components/SideMenu';
import TopBar from '../../../shared/components/TopBar';
import UpcomingMeetings from '../../../shared/components/UpcomingMeetings';

const localizer = momentLocalizer(moment);

const LandingPage = () => {
  const [events, setEvents] = useState([]);
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    // Simulate fetching events from API
    const dummyEvents = [
      {
        id: 1,
        title: 'Research Methodology Lecture',
        start: new Date(2025, 4, 25, 10, 0),
        end: new Date(2025, 4, 25, 12, 0),
      },
      {
        id: 2,
        title: 'Group Project Meeting',
        start: new Date(2025, 4, 26, 14, 0),
        end: new Date(2025, 4, 26, 16, 0),
      },
      {
        id: 3,
        title: 'AI Tutorial Session',
        start: new Date(2025, 4, 27, 9, 0),
        end: new Date(2025, 4, 27, 11, 0),
      },
      {
        id: 4,
        title: 'Database Assignment Deadline',
        start: new Date(2025, 4, 28, 23, 59),
        end: new Date(2025, 4, 28, 23, 59),
      },
    ];
    
    setEvents(dummyEvents);
    
    // Update current time every minute
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 60000);
    
    return () => clearInterval(timer);
  }, []);

  const handleSelectEvent = (event) => {
    alert(`Event: ${event.title}`);
  };

  return (
    <div className="landing-page">
      <SideMenu />
      
      <div className="main-content">
        <TopBar currentTime={currentTime} />
        
        <div className="content-container">
          <div className="calendar-section">
            <h3>Academic Calendar</h3>
            <Calendar
              localizer={localizer}
              events={events}
              startAccessor="start"
              endAccessor="end"
              style={{ height: 500 }}
              onSelectEvent={handleSelectEvent}
            />
          </div>
          
          <div className="sidebar-section">
            <UpcomingMeetings events={events} />
            
            <div className="quick-actions">
              <h3>Quick Actions</h3>
              <button className="action-btn">Join Meeting</button>
              <button className="action-btn">Upload Content</button>
              <button className="action-btn">Find Tutor</button>
              <button className="action-btn">View Resources</button>
            </div>
            
            <div className="announcements">
              <h3>Announcements</h3>
              <div className="announcement-item">
                <h4>System Maintenance</h4>
                <p>The system will be down for maintenance on Sunday, May 30th from 2 AM to 5 AM.</p>
              </div>
              <div className="announcement-item">
                <h4>New Feature: AI Notes</h4>
                <p>Try our new AI-powered note generation feature for video lectures!</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LandingPage;