import React, { useState, useEffect } from 'react';
import { Calendar, momentLocalizer } from 'react-big-calendar';
import moment from 'moment';
import 'react-big-calendar/lib/css/react-big-calendar.css';
import '../styles/LandingPage.css';
import SideMenu from '../../../shared/components/SideMenu';
import TopBar from '../../../shared/components/TopBar';
import UpcomingMeetings from '../../../shared/components/UpcomingMeetings';
import { FaChevronLeft, FaChevronRight, FaPlay, FaLink } from 'react-icons/fa';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

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

// Dummy scheduled meetings data
const MY_SCHEDULED_MEETINGS = [
  {
    id: 1,
    topic: 'Group Project Discussion',
    start: getTomorrowAt(10, 0),
    link: 'https://meet.sliit-hub.com/meeting/1',
  }
];

// Get module details
const getModuleDetails = (meetingId) => {
  const moduleDetails = {
    1: { 
      year: 'Year 2', 
      semester: 'Semester 2', 
      module: 'IT2020',
      coordinator: 'Dr. Jane Wilson'
    }
  };
  return moduleDetails[meetingId] || { 
    year: 'N/A', 
    semester: 'N/A', 
    module: 'N/A',
    coordinator: 'N/A'
  };
};

const LandingPage = () => {
  const [events, setEvents] = useState([]);
  const [myMeetings, setMyMeetings] = useState([]);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [showAllAnnouncements, setShowAllAnnouncements] = useState(false);
  const [collapsed, setCollapsed] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [meetingToStart, setMeetingToStart] = useState(null);
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [showEventModal, setShowEventModal] = useState(false);
  const navigate = useNavigate();
  const userInfo = JSON.parse(localStorage.getItem('userInfo') || '{}');

  useEffect(() => {
    fetchMeetings();
    fetchMyMeetings();
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 60000);
    return () => clearInterval(timer);
  }, []);

  const fetchMeetings = async () => {
    try {
      const res = await axios.get('http://localhost:5000/api/meetings/public');
      if (res.data && res.data.data) {
        setEvents(res.data.data.map(m => ({
          id: m._id,
          title: m.title,
          start: new Date(m.startTime),
          end: new Date(new Date(m.startTime).getTime() + (m.duration || 60) * 60000),
          allDay: false,
          resource: { ...m, isUpcomingMeeting: true }
        })));
      }
    } catch (err) {
      console.error('Failed to fetch meetings:', err);
    }
  };

  const fetchMyMeetings = async () => {
    try {
      const res = await axios.get('http://localhost:5000/api/meetings/my-meetings', { withCredentials: true });
      if (res.data && res.data.data) {
        setMyMeetings(res.data.data.map(m => ({
          id: m._id,
          title: m.title,
          start: new Date(m.startTime),
          end: new Date(new Date(m.startTime).getTime() + (m.duration || 60) * 60000),
          allDay: false,
          resource: { ...m, isScheduledMeeting: true }
        })));
      }
    } catch (err) {
      console.error('Failed to fetch my meetings:', err);
    }
  };

  // Combine for calendar
  const allEvents = [...events, ...myMeetings];

  // For UpcomingMeetings, filter for future meetings where user is host
  const upcomingMine = myMeetings.filter(m => new Date(m.start) > new Date());

  // For My Scheduled Meeting, show the next one
  const nextScheduledMeeting = upcomingMine.sort((a, b) => new Date(a.start) - new Date(b.start))[0];

  // Filter out ended meetings from calendar events
  const filteredEvents = allEvents.filter(e => {
    const status = e.resource?.status || e.status;
    return status !== 'ended' && status !== 'completed';
  });

  const handleSelectEvent = (event) => {
    setSelectedEvent(event);
    setShowEventModal(true);
  };

  const closeEventModal = () => {
    setShowEventModal(false);
    setSelectedEvent(null);
  };

  const displayedAnnouncements = showAllAnnouncements ? ANNOUNCEMENTS : ANNOUNCEMENTS.slice(0, 3);

  const canStartMeeting = (meeting) => {
    const now = new Date();
    const start = new Date(meeting.start);
    const diff = (start - now) / 60000;
    return diff <= 15 && diff >= -120;
  };

  const formatMeetingTime = (date) => {
    return moment(date).format('MMM D, YYYY [at] HH:mm');
  };

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
                  events={filteredEvents}
                  startAccessor="start"
                  endAccessor="end"
                  style={{ height: 500 }}
                  onSelectEvent={handleSelectEvent}
                  eventPropGetter={(event) => ({
                    className: event.resource?.isScheduledMeeting ? 'scheduled-meeting' : 'upcoming-meeting'
                  })}
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
                {ANNOUNCEMENTS.length > 3 && (
                  <button 
                    className="view-all-announcements-btn" 
                    onClick={() => setShowAllAnnouncements(v => !v)}
                  >
                    {showAllAnnouncements ? 'Show Less' : 'View All'}
                  </button>
                )}
              </div>
            </div>
          </div>
          <div className="right-sidebar">
            <UpcomingMeetings events={upcomingMine} />
            <div className="my-scheduled-meetings">
              <h3>My Scheduled Meeting</h3>
              {!nextScheduledMeeting ? (
                <>
                  <div className="no-meetings">No scheduled meetings</div>
                  <button 
                    className="action-btn" 
                    onClick={() => navigate('/my-meetings')}
                  >
                    Schedule Meeting
                  </button>
                </>
              ) : (
                <>
                  <div className="meeting-list">
                    <div className="meeting-item">
                      <div className="meeting-header">
                        <div className="meeting-details">
                          <h4>{nextScheduledMeeting.topic}</h4>
                          <div className="meeting-title"><strong>Title:</strong> {nextScheduledMeeting.title || nextScheduledMeeting.topic || 'N/A'}</div>
                          <div className="meeting-description"><strong>Description:</strong> {nextScheduledMeeting.resource?.description || nextScheduledMeeting.description || 'N/A'}</div>
                          <div className="meeting-meta">
                            <span>{nextScheduledMeeting.resource?.degree || nextScheduledMeeting.degree || 'N/A'}</span>
                            <span>{nextScheduledMeeting.resource?.year || nextScheduledMeeting.year || 'N/A'}</span>
                            <span>{nextScheduledMeeting.resource?.semester || nextScheduledMeeting.semester || 'N/A'}</span>
                            <span>{nextScheduledMeeting.resource?.module || nextScheduledMeeting.module || 'N/A'}</span>
                          </div>
                          <div className="meeting-coordinator">
                            Coordinator: {nextScheduledMeeting.resource?.hostName || nextScheduledMeeting.hostName || 'N/A'}
                          </div>
                          <div className="meeting-time">
                            {formatMeetingTime(nextScheduledMeeting.start)}
                          </div>
                        </div>
                        <button
                          className="start-meeting-btn"
                          disabled={!canStartMeeting(nextScheduledMeeting)}
                          onClick={() => handleStartMeeting(nextScheduledMeeting)}
                        >
                          <FaPlay /> Start
                        </button>
                      </div>
                      <div className="meeting-link">
                        <FaLink />
                        <a href={nextScheduledMeeting.resource?.meetingLink || nextScheduledMeeting.meetingLink || '#'} target="_blank" rel="noopener noreferrer">
                          {nextScheduledMeeting.resource?.meetingLink || nextScheduledMeeting.meetingLink || 'N/A'}
                        </a>
                      </div>
                    </div>
                  </div>
                  <button 
                    className="view-all-meetings-btn" 
                    onClick={() => navigate('/my-meetings')}
                  >
                    View All My Scheduled Meetings
                  </button>
                </>
              )}
            </div>
            {showConfirm && meetingToStart && (
              <div className="meeting-confirm-overlay">
                <div className="meeting-confirm-dialog">
                  <h4>Start Meeting</h4>
                  <p>Are you sure you want to start the meeting "{meetingToStart.topic}"?</p>
                  <div className="meeting-confirm-actions">
                    <button className="action-btn" onClick={confirmStartMeeting}>
                      Yes, Start
                    </button>
                    <button className="action-btn" onClick={cancelStartMeeting}>
                      Cancel
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
      {showEventModal && selectedEvent && (
        <div className="event-modal-overlay">
          <div className="event-modal-content">
            <h3>{selectedEvent.title || selectedEvent.resource?.title}</h3>
            <div><strong>Description:</strong> {selectedEvent.resource?.description || selectedEvent.description || 'N/A'}</div>
            <div><strong>Degree:</strong> {selectedEvent.resource?.degree || 'N/A'}</div>
            <div><strong>Year:</strong> {selectedEvent.resource?.year || 'N/A'}</div>
            <div><strong>Semester:</strong> {selectedEvent.resource?.semester || 'N/A'}</div>
            <div><strong>Module:</strong> {selectedEvent.resource?.module || 'N/A'}</div>
            <div><strong>Time:</strong> {formatMeetingTime(selectedEvent.start)}</div>
            <div><strong>Coordinator:</strong> {selectedEvent.resource?.hostName || 'N/A'}</div>
            <div className="event-modal-actions">
              {selectedEvent.resource?.isScheduledMeeting || selectedEvent.resource?.hostStudentId === userInfo.studentId || selectedEvent.resource?.host === userInfo._id ? (
                <button className="start-meeting-btn" onClick={() => handleStartMeeting(selectedEvent.resource)}>Start Meeting</button>
              ) : (
                <a href={selectedEvent.resource?.meetingLink || '#'} target="_blank" rel="noopener noreferrer">
                  <button className="join-meeting-btn">Join Meeting</button>
                </a>
              )}
              <button className="close-modal-btn" onClick={closeEventModal}>Close</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default LandingPage;