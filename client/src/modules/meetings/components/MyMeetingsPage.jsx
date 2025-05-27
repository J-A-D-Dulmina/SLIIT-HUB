import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { FaChevronLeft, FaChevronRight, FaClock, FaUsers, FaLink, FaPlay, FaEdit, FaTrash, FaPlus } from 'react-icons/fa';
import SideMenu from '../../../shared/components/SideMenu';
import TopBar from '../../../shared/components/TopBar';
import moment from 'moment';
import '../styles/MyMeetingsPage.css';

const MyMeetingsPage = () => {
  const [collapsed, setCollapsed] = useState(false);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [meetings, setMeetings] = useState([]);
  const [showScheduleForm, setShowScheduleForm] = useState(false);
  const [scheduleFormData, setScheduleFormData] = useState({
    topic: '',
    date: '',
    time: '',
    duration: '60',
    attendees: '',
    description: ''
  });
  const navigate = useNavigate();

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 60000);

    // Simulate fetching meetings from API
    const dummyMeetings = [
      {
        id: 1,
        title: 'AI Tutorial Session',
        start: new Date(2024, 2, 30, 9, 0),
        end: new Date(2024, 2, 30, 10, 0),
        attendees: ['alex@example.com', 'emma@example.com'],
        link: 'https://meet.sliit-hub.com/meeting/3',
        description: 'Tutorial session on Neural Networks and Deep Learning',
        status: 'upcoming'
      },
      {
        id: 2,
        title: 'Research Progress Review',
        start: new Date(2024, 2, 31, 14, 0),
        end: new Date(2024, 2, 31, 15, 30),
        attendees: ['john@example.com', 'sarah@example.com'],
        link: 'https://meet.sliit-hub.com/meeting/4',
        description: 'Review of research progress and discussion of next steps',
        status: 'upcoming'
      }
    ];
    
    setMeetings(dummyMeetings);
    return () => clearInterval(timer);
  }, []);

  const handleScheduleChange = (e) => {
    const { name, value } = e.target;
    setScheduleFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleScheduleSubmit = (e) => {
    e.preventDefault();
    // TODO: Implement meeting scheduling logic
    console.log('Scheduled Meeting:', scheduleFormData);
    alert('Meeting Scheduled!');
    setScheduleFormData({
      topic: '',
      date: '',
      time: '',
      duration: '60',
      attendees: '',
      description: ''
    });
    setShowScheduleForm(false);
  };

  const handleEditMeeting = (meetingId) => {
    // TODO: Implement edit meeting logic
    console.log('Edit meeting:', meetingId);
  };

  const handleDeleteMeeting = (meetingId) => {
    // TODO: Implement delete meeting logic
    if (window.confirm('Are you sure you want to delete this meeting?')) {
      console.log('Delete meeting:', meetingId);
    }
  };

  const formatMeetingTime = (date) => {
    return moment(date).format('MMM D, YYYY [at] HH:mm');
  };

  const getMeetingStatus = (meeting) => {
    const now = new Date();
    const start = new Date(meeting.start);
    const end = new Date(meeting.end);
    
    if (now < start) {
      const diff = (start - now) / 60000; // minutes
      if (diff <= 15) return 'starting-soon';
      return 'upcoming';
    }
    if (now >= start && now <= end) return 'in-progress';
    return 'ended';
  };

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
            {collapsed ? <FaChevronRight /> : <FaChevronLeft />}
          </button>
        </div>
        <TopBar currentTime={currentTime} />

        <main className="my-meetings-page">
          <div className="page-header">
            <button className="back-button" onClick={() => navigate(-1)}>
              <FaChevronLeft />
              Back
            </button>
            <h1>My Meetings</h1>
            <button className="schedule-btn" onClick={() => setShowScheduleForm(true)}>
              <FaPlus /> Schedule New Meeting
            </button>
          </div>

          {showScheduleForm && (
            <div className="schedule-form-overlay">
              <div className="schedule-form-card">
                <div className="form-header">
                  <h2>Schedule New Meeting</h2>
                  <button className="close-btn" onClick={() => setShowScheduleForm(false)}>×</button>
                </div>
                <form onSubmit={handleScheduleSubmit}>
                  <div className="form-group">
                    <label htmlFor="topic">Topic</label>
                    <input
                      type="text"
                      id="topic"
                      name="topic"
                      value={scheduleFormData.topic}
                      onChange={handleScheduleChange}
                      required
                      placeholder="Meeting Topic"
                    />
                  </div>

                  <div className="form-row">
                    <div className="form-group">
                      <label htmlFor="date">Date</label>
                      <input
                        type="date"
                        id="date"
                        name="date"
                        value={scheduleFormData.date}
                        onChange={handleScheduleChange}
                        required
                      />
                    </div>

                    <div className="form-group">
                      <label htmlFor="time">Time</label>
                      <input
                        type="time"
                        id="time"
                        name="time"
                        value={scheduleFormData.time}
                        onChange={handleScheduleChange}
                        required
                      />
                    </div>
                  </div>

                  <div className="form-row">
                    <div className="form-group">
                      <label htmlFor="duration">Duration (minutes)</label>
                      <input
                        type="number"
                        id="duration"
                        name="duration"
                        value={scheduleFormData.duration}
                        onChange={handleScheduleChange}
                        required
                        min="15"
                        step="15"
                      />
                    </div>

                    <div className="form-group">
                      <label htmlFor="attendees">Attendees (comma-separated emails)</label>
                      <input
                        type="text"
                        id="attendees"
                        name="attendees"
                        value={scheduleFormData.attendees}
                        onChange={handleScheduleChange}
                        placeholder="attendee1@example.com, attendee2@example.com"
                      />
                    </div>
                  </div>

                  <div className="form-group">
                    <label htmlFor="description">Description</label>
                    <textarea
                      id="description"
                      name="description"
                      value={scheduleFormData.description}
                      onChange={handleScheduleChange}
                      placeholder="Meeting description..."
                      rows="3"
                    />
                  </div>

                  <div className="form-actions">
                    <button type="button" className="cancel-btn" onClick={() => setShowScheduleForm(false)}>
                      Cancel
                    </button>
                    <button type="submit" className="submit-btn">
                      Schedule Meeting
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}

          <div className="meetings-grid">
            {meetings.map(meeting => {
              const status = getMeetingStatus(meeting);
              return (
                <div key={meeting.id} className={`meeting-card ${status}`}>
                  <div className="meeting-header">
                    <h3>{meeting.title}</h3>
                    <div className="meeting-actions">
                      <button 
                        className="action-btn edit"
                        onClick={() => handleEditMeeting(meeting.id)}
                        title="Edit Meeting"
                      >
                        <FaEdit />
                      </button>
                      <button 
                        className="action-btn delete"
                        onClick={() => handleDeleteMeeting(meeting.id)}
                        title="Delete Meeting"
                      >
                        <FaTrash />
                      </button>
                    </div>
                  </div>
                  
                  <div className="meeting-info">
                    <div className="info-item">
                      <FaClock className="icon" />
                      <div className="info-content">
                        <span className="label">Time</span>
                        <span className="value">{formatMeetingTime(meeting.start)}</span>
                      </div>
                    </div>
                    
                    <div className="info-item">
                      <FaUsers className="icon" />
                      <div className="info-content">
                        <span className="label">Attendees</span>
                        <span className="value">{meeting.attendees.length} participants</span>
                      </div>
                    </div>

                    <div className="info-item">
                      <FaLink className="icon" />
                      <div className="info-content">
                        <span className="label">Meeting Link</span>
                        <a href={meeting.link} target="_blank" rel="noopener noreferrer" className="meeting-link">
                          {meeting.link}
                        </a>
                      </div>
                    </div>
                  </div>

                  <p className="meeting-description">{meeting.description}</p>

                  <div className="meeting-footer">
                    <span className={`status-badge ${status}`}>
                      {status === 'starting-soon' && 'Starting Soon'}
                      {status === 'upcoming' && 'Upcoming'}
                      {status === 'in-progress' && 'In Progress'}
                      {status === 'ended' && 'Ended'}
                    </span>
                    <button 
                      className={`join-btn ${status === 'ended' ? 'disabled' : ''}`}
                      disabled={status === 'ended'}
                      onClick={() => window.open(meeting.link, '_blank')}
                    >
                      <FaPlay /> {status === 'in-progress' ? 'Join Now' : 'Start Meeting'}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </main>
      </div>
    </div>
  );
};

export default MyMeetingsPage; 