import React, { useState, useEffect } from 'react';
import { Calendar, momentLocalizer } from 'react-big-calendar';
import moment from 'moment';
import 'react-big-calendar/lib/css/react-big-calendar.css';
import '../../../styles/LandingPage.css';
import SideMenu from '../../../shared/components/SideMenu';
import TopBar from '../../../shared/components/TopBar';
import UpcomingMeetings from '../../../shared/components/UpcomingMeetings';
import { FaChevronLeft, FaChevronRight } from 'react-icons/fa';

const localizer = momentLocalizer(moment);

const ANNOUNCEMENTS = [
  {
    title: 'System Maintenance',
    message: 'The system will be down for maintenance on Sunday, May 30th from 2 AM to 5 AM.'
  },
  {
    title: 'New Feature: AI Notes',
    message: 'Try our new AI-powered note generation feature for video lectures!'
  },
  {
    title: 'Exam Timetable Released',
    message: 'The semester exam timetable is now available on the portal.'
  },
  {
    title: 'Library Hours Extended',
    message: 'Library will be open until 10 PM during exam week.'
  },
  {
    title: 'New Course: Data Science',
    message: 'Enrollments are open for the new Data Science course.'
  },
  {
    title: 'Career Fair',
    message: 'Join the annual career fair on June 10th for job opportunities.'
  },
  {
    title: 'Feedback Survey',
    message: 'Please complete the student feedback survey by next Friday.'
  }
];

const LandingPage = () => {
  const [events, setEvents] = useState([]);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [showAllAnnouncements, setShowAllAnnouncements] = useState(false);
  const [collapsed, setCollapsed] = useState(false);

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

  const displayedAnnouncements = showAllAnnouncements ? ANNOUNCEMENTS : ANNOUNCEMENTS.slice(0, 5);

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
              <div className="announcements">
                <h3>Announcements</h3>
                {displayedAnnouncements.map((a, idx) => (
                  <div className="announcement-item" key={idx}>
                    <h4>{a.title}</h4>
                    <p>{a.message}</p>
                  </div>
                ))}
                {ANNOUNCEMENTS.length > 5 && (
                  <button className="view-all-announcements-btn" onClick={() => setShowAllAnnouncements(v => !v)}>
                    {showAllAnnouncements ? 'Show Less' : 'View All'}
                  </button>
                )}
              </div>
            </div>
          </div>
          <div className="sidebar-section">
            <UpcomingMeetings events={events} />
            <div className="quick-actions">
              <h3>Quick Actions</h3>
              <button className="action-btn">Start a Meeting</button>
              <button className="action-btn">Schedule a Meeting</button>
              <button className="action-btn">Join Meeting</button>
              <button className="action-btn">Upload Content</button>
              <button className="action-btn">Find Tutor</button>
              <button className="action-btn">View Resources</button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LandingPage;