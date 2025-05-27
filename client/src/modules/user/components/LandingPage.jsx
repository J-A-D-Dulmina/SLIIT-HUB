import React, { useState, useEffect } from 'react';
import { Calendar, momentLocalizer } from 'react-big-calendar';
import moment from 'moment';
import 'react-big-calendar/lib/css/react-big-calendar.css';
import '../../../styles/LandingPage.css';
import SideMenu from '../../../shared/components/SideMenu';
import TopBar from '../../../shared/components/TopBar';
import UpcomingMeetings from '../../../shared/components/UpcomingMeetings';
import { FaChevronLeft, FaChevronRight, FaPlay, FaLink } from 'react-icons/fa';
import { useNavigate } from 'react-router-dom';

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

// Helper to get tomorrow's date at a specific hour
const getTomorrowAt = (hour, minute = 0) => {
  const d = new Date();
  d.setDate(d.getDate() + 1);
  d.setHours(hour, minute, 0, 0);
  return d;
};

// Helper to get a specific date at a specific hour
const getDateAt = (date, hour, minute = 0) => {
  const d = new Date(date);
  d.setHours(hour, minute, 0, 0);
  return d;
};

// Get 29th of current month
const get29thDate = () => {
  const date = new Date();
  date.setDate(29);
  return date;
};

// Dummy scheduled meetings data (all for tomorrow)
const MY_SCHEDULED_MEETINGS = [
  {
    id: 1,
    topic: 'Group Project Discussion',
    start: getTomorrowAt(10, 0), // Tomorrow at 10:00
    link: 'https://meet.sliit-hub.com/meeting/1',
  },
  {
    id: 2,
    topic: 'AI Tutorial',
    start: getTomorrowAt(14, 0), // Tomorrow at 14:00
    link: 'https://meet.sliit-hub.com/meeting/2',
  },
];

const LandingPage = () => {
  const [events, setEvents] = useState([]);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [showAllAnnouncements, setShowAllAnnouncements] = useState(false);
  const [collapsed, setCollapsed] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [meetingToStart, setMeetingToStart] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    // Add scheduled meetings (your own meetings) as blue events
    const calendarEvents = MY_SCHEDULED_MEETINGS.map(m => ({
      id: m.id,
      title: m.topic,
      start: m.start,
      end: new Date(m.start.getTime() + 60 * 60000), // 1 hour duration
      allDay: false,
      resource: { isScheduledMeeting: true },
    }));

    // Add only two upcoming meetings on the 29th
    const upcomingMeetings = [
      {
        id: 101,
        title: 'Research Discussion',
        start: getDateAt(get29thDate(), 10, 30), // 29th at 10:30
        end: new Date(getDateAt(get29thDate(), 10, 30).getTime() + 60 * 60000),
        allDay: false,
        resource: { isUpcomingMeeting: true },
      },
      {
        id: 102,
        title: 'Group Study Session',
        start: getDateAt(get29thDate(), 14, 0), // 29th at 14:00
        end: new Date(getDateAt(get29thDate(), 14, 0).getTime() + 90 * 60000),
        allDay: false,
        resource: { isUpcomingMeeting: true },
      }
    ];

    setEvents([...calendarEvents, ...upcomingMeetings]);
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

  // Helper to check if meeting can be started (within 15 min before start)
  const canStartMeeting = (meeting) => {
    const now = new Date();
    const start = new Date(meeting.start);
    const diff = (start - now) / 60000; // minutes
    return diff <= 15 && diff >= -120; // allow up to 2 hours after start
  };

  // Format date/time
  const formatMeetingTime = (date) => {
    return moment(date).format('MMM D, YYYY [at] HH:mm');
  };

  // Confirm start meeting
  const handleStartMeeting = (meeting) => {
    setMeetingToStart(meeting);
    setShowConfirm(true);
  };

  const confirmStartMeeting = () => {
    setShowConfirm(false);
    alert(`Meeting started: ${meetingToStart.topic}`);
    setMeetingToStart(null);
  };

  const cancelStartMeeting = () => {
    setShowConfirm(false);
    setMeetingToStart(null);
  };

  // Only show the first 2 meetings
  const scheduledMeetingsToShow = MY_SCHEDULED_MEETINGS.slice(0, 2);

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
                  eventPropGetter={(event) => {
                    if (event.resource?.isScheduledMeeting) {
                      // Your own scheduled meetings in blue
                      return {
                        className: 'scheduled-meeting',
                        style: {
                          backgroundColor: '#3498db',
                          color: '#fff',
                          borderRadius: 6,
                          border: 'none'
                        }
                      };
                    } else if (event.resource?.isUpcomingMeeting) {
                      // Others' upcoming meetings in green
                      return {
                        className: 'upcoming-meeting',
                        style: {
                          backgroundColor: '#2ecc71',
                          color: '#fff',
                          borderRadius: 6,
                          border: 'none'
                        }
                      };
                    }
                    return {};
                  }}
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
            <div className="my-scheduled-meetings">
              <h3>My Scheduled Meetings</h3>
              {scheduledMeetingsToShow.length === 0 ? (
                <>
                  <div className="no-meetings">No scheduled meetings</div>
                  <button className="action-btn" onClick={() => navigate('/my-meetings')}>Schedule Meeting</button>
                </>
              ) : (
                <>
                  <div className="meeting-list">
                    {scheduledMeetingsToShow.map(meeting => (
                      <div className="meeting-item" key={meeting.id}>
                        <div className="meeting-header">
                          <div className="meeting-details">
                            <h4>{meeting.topic}</h4>
                            <div className="meeting-time">{formatMeetingTime(meeting.start)}</div>
                          </div>
                          <button
                            className="start-meeting-btn"
                            disabled={!canStartMeeting(meeting)}
                            onClick={() => handleStartMeeting(meeting)}
                          >
                            <FaPlay /> Start
                          </button>
                        </div>
                        <div className="meeting-link">
                          <FaLink style={{ marginRight: 4 }} />
                          <a href={meeting.link} target="_blank" rel="noopener noreferrer">{meeting.link}</a>
                        </div>
                      </div>
                    ))}
                  </div>
                  <button className="view-all-meetings-btn" onClick={() => navigate('/my-meetings')}>View All Meetings</button>
                </>
              )}
            </div>
            {showConfirm && meetingToStart && (
              <div className="meeting-confirm-overlay">
                <div className="meeting-confirm-dialog">
                  <h4>Start Meeting</h4>
                  <p>Are you sure you want to start the meeting "{meetingToStart.topic}"?</p>
                  <div className="meeting-confirm-actions">
                    <button className="action-btn" onClick={confirmStartMeeting}>Yes, Start</button>
                    <button className="action-btn" onClick={cancelStartMeeting}>Cancel</button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default LandingPage;