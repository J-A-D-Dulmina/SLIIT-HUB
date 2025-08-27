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

const ANNOUNCEMENTS = [];

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
  const [isLecturer, setIsLecturer] = useState(userInfo?.userType === 'lecturer');

  useEffect(() => {
    // Determine role from backend for reliability
    axios.get('http://localhost:5000/api/protected', { withCredentials: true })
      .then(res => setIsLecturer(res.data?.user?.userType === 'lecturer'))
      .catch(() => setIsLecturer(userInfo?.userType === 'lecturer'));

    fetchMeetings();
    fetchMyMeetings();
    // Load announcements
    axios.get('http://localhost:5000/api/announcements?limit=5')
      .then(res => setAnnouncementsState((res.data?.announcements || []).map(a => ({
        title: a.text,
        message: new Date(a.date).toLocaleDateString()
      }))))
      .catch(() => {});
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

  // For UpcomingMeetings, filter for upcoming meetings from OTHER people (public meetings)
  const upcomingOthers = events.filter(m => {
    const status = m.resource?.computedStatus || m.resource?.status || m.status;
    return status === 'upcoming' || status === 'starting-soon';
  });

  // For My Scheduled Meeting, show the next one (my upcoming meetings only)
  const upcomingMine = myMeetings.filter(m => {
    const status = m.resource?.computedStatus || m.resource?.status || m.computedStatus || m.status;
    return status === 'upcoming' || status === 'starting-soon' || status === 'scheduled';
  });
  const nextScheduledMeeting = upcomingMine.sort((a, b) => new Date(a.resource?.startTime || a.startTime) - new Date(b.resource?.startTime || b.startTime))[0];

  // For calendar, show both my meetings (blue) and others' meetings (green)
  const myCalendarEvents = myMeetings.filter(e => {
    const status = e.resource?.computedStatus || e.resource?.status || e.computedStatus || e.status;
    return status !== 'ended' && status !== 'completed' && status !== 'cancelled';
  }).map(event => {
    const startTime = new Date(event.start);
    const endTime = new Date(startTime.getTime() + 30 * 60000); // 30 minutes duration for display
    
    // Ensure the event doesn't span multiple days
    const sameDay = startTime.toDateString() === endTime.toDateString();
    const finalEndTime = sameDay ? endTime : new Date(startTime.getTime() + 23 * 60 * 60000); // Max 23 hours if different day
    
    return {
      ...event,
      title: `${event.title} (${moment(startTime).format('HH:mm')})`, // Add time to title
      start: startTime,
      end: finalEndTime,
      allDay: false,
      isMyMeeting: true // Mark as my meeting for blue color
    };
  });

  // Get my meeting IDs to avoid duplicates
  const myMeetingIds = myMeetings.map(m => m._id || m.resource?._id);

  const othersCalendarEvents = events.filter(e => {
    const status = e.resource?.computedStatus || e.resource?.status || e.computedStatus || e.status;
    const eventId = e._id || e.resource?._id;
    
    // Only include if not ended/completed/cancelled AND not already in my meetings
    return status !== 'ended' && status !== 'completed' && status !== 'cancelled' && !myMeetingIds.includes(eventId);
  }).map(event => {
    const startTime = new Date(event.start);
    const endTime = new Date(startTime.getTime() + 30 * 60000); // 30 minutes duration for display
    
    // Ensure the event doesn't span multiple days
    const sameDay = startTime.toDateString() === endTime.toDateString();
    const finalEndTime = sameDay ? endTime : new Date(startTime.getTime() + 23 * 60 * 60000); // Max 23 hours if different day
    
    return {
      ...event,
      title: `${event.title} (${moment(startTime).format('HH:mm')})`, // Add time to title
      start: startTime,
      end: finalEndTime,
      allDay: false,
      isMyMeeting: false // Mark as others' meeting for green color
    };
  });

  const filteredEvents = [...myCalendarEvents, ...othersCalendarEvents];

  const handleSelectEvent = (event) => {
    setSelectedEvent(event);
    setShowEventModal(true);
  };

  const closeEventModal = () => {
    setShowEventModal(false);
    setSelectedEvent(null);
  };

  const [announcementsState, setAnnouncementsState] = useState([]);
  const displayedAnnouncements = showAllAnnouncements ? announcementsState : announcementsState.slice(0, 3);

  const formatMeetingTime = (date) => {
    return moment(date).format('MMM D, YYYY [at] HH:mm');
  };

  const handleStartMeeting = (meeting) => {
    // Close the detail popup first
    setShowEventModal(false);
    setSelectedEvent(null);
    
    // Then show the confirmation popup
    setMeetingToStart(meeting);
    setShowConfirm(true);
  };

  const confirmStartMeeting = async () => {
    try {
      // Call the start meeting API
      const response = await axios.post(`http://localhost:5000/api/meetings/${meetingToStart._id}/start`, {}, {
        withCredentials: true
      });
      
      setShowConfirm(false);
      alert(`Meeting started: ${meetingToStart.title || meetingToStart.topic}`);
      setMeetingToStart(null);
      
      // Refresh meetings data
      await fetchMyMeetings();
    } catch (error) {
      alert(`Failed to start meeting: ${error.response?.data?.message || error.message}`);
    }
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
                    className: event.isMyMeeting ? 'my-meeting' : 'others-meeting'
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
                {announcementsState.length > 3 && (
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
            <UpcomingMeetings events={upcomingOthers} />
            {!isLecturer && (
              <div className="my-scheduled-meetings">
                <h3>My Scheduled Meeting</h3>
                {!nextScheduledMeeting ? (
                  <>
                    <div className="dashboard-no-meetings">No scheduled meetings</div>
                    <button 
                      className="dashboard-action-btn" 
                      onClick={() => navigate('/my-meetings')}
                    >
                      Schedule Meeting
                    </button>
                  </>
                ) : (
                  <>
                    <div className="dashboard-meeting-list">
                      <div className="dashboard-meeting-item">
                        <div className="dashboard-meeting-header">
                          <div className="dashboard-meeting-details">
                            <h4 className="dashboard-meeting-title">{nextScheduledMeeting.resource?.title || nextScheduledMeeting.title || nextScheduledMeeting.topic}</h4>
                            <div className="dashboard-meeting-description">
                              {nextScheduledMeeting.resource?.description || nextScheduledMeeting.description || 'No description available'}
                            </div>
                            <div className="dashboard-meeting-meta">
                              <span>{nextScheduledMeeting.resource?.degree || nextScheduledMeeting.degree || 'N/A'}</span>
                              <span>{nextScheduledMeeting.resource?.year || nextScheduledMeeting.year || 'N/A'}</span>
                              <span>{nextScheduledMeeting.resource?.semester || nextScheduledMeeting.semester || 'N/A'}</span>
                              <span>{nextScheduledMeeting.resource?.module || nextScheduledMeeting.module || 'N/A'}</span>
                            </div>
                            <div className="dashboard-meeting-coordinator">
                              Coordinator: {nextScheduledMeeting.resource?.hostName || nextScheduledMeeting.hostName || 'N/A'}
                            </div>
                            <div className="dashboard-meeting-time">
                              {formatMeetingTime(nextScheduledMeeting.resource?.startTime || nextScheduledMeeting.startTime || nextScheduledMeeting.start)}
                            </div>
                          </div>
                          <button
                            className="dashboard-start-meeting-btn"
                            disabled={!(nextScheduledMeeting.resource?.canStart || nextScheduledMeeting.canStart)}
                            onClick={() => handleStartMeeting(nextScheduledMeeting.resource || nextScheduledMeeting)}
                          >
                            <FaPlay /> Start
                          </button>
                        </div>
                        <div className="dashboard-meeting-link">
                          <FaLink />
                          <a href={nextScheduledMeeting.resource?.meetingLink || nextScheduledMeeting.meetingLink || '#'} target="_blank" rel="noopener noreferrer">
                            {nextScheduledMeeting.resource?.meetingLink || nextScheduledMeeting.meetingLink || 'N/A'}
                          </a>
                        </div>
                      </div>
                    </div>
                    <button 
                      className="dashboard-view-all-meetings-btn" 
                      onClick={() => navigate('/my-meetings')}
                    >
                      View All My Scheduled Meetings
                    </button>
                  </>
                )}
              </div>
            )}
            {showConfirm && meetingToStart && (
              <div className="meeting-confirm-overlay">
                <div className="meeting-confirm-dialog">
                  <h4>Start Meeting</h4>
                  <p>Are you sure you want to start the meeting "{meetingToStart.title || meetingToStart.topic}"?</p>
                  <div className="meeting-confirm-actions">
                    <button className="meeting-confirm-start-btn" onClick={confirmStartMeeting}>
                      Yes, Start
                    </button>
                    <button className="meeting-confirm-cancel-btn" onClick={cancelStartMeeting}>
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
              {selectedEvent.resource?.isHost ? (
                <button className="event-modal-start-btn" onClick={() => handleStartMeeting(selectedEvent.resource)}>Start Meeting</button>
              ) : (
                <a href={selectedEvent.resource?.meetingLink || '#'} target="_blank" rel="noopener noreferrer">
                  <button className="event-modal-join-btn">Join Meeting</button>
                </a>
              )}
              <button className="event-modal-close-btn" onClick={closeEventModal}>Close</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default LandingPage;