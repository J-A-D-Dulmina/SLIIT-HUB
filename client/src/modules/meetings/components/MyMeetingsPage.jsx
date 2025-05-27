import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { FaChevronLeft, FaChevronRight, FaClock, FaUsers, FaLink, FaPlay, FaEdit, FaTrash, FaPlus, FaEnvelope } from 'react-icons/fa';
import SideMenu from '../../../shared/components/SideMenu';
import TopBar from '../../../shared/components/TopBar';
import moment from 'moment';
import '../styles/MyMeetingsPage.css';

const DEGREES = [
  'Bachelor of Science in Information Technology',
  'Bachelor of Software Engineering',
  'Bachelor of Computer Science',
  'Bachelor of Network Engineering',
  'Bachelor of Mobile Computing',
  'Bachelor of Cloud Computing'
];

const DEGREE_YEARS = ['Year 1', 'Year 2', 'Year 3', 'Year 4'];
const SEMESTERS = ['Semester 1', 'Semester 2'];
const MODULES = ['AI', 'Web Development', 'Database Systems', 'Software Engineering', 'Networks', 'Operating Systems'];

const MyMeetingsPage = () => {
  const [collapsed, setCollapsed] = useState(false);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [meetings, setMeetings] = useState([]);
  const [showScheduleForm, setShowScheduleForm] = useState(false);
  const [showEditForm, setShowEditForm] = useState(false);
  const [editingMeeting, setEditingMeeting] = useState(null);
  const [scheduleFormData, setScheduleFormData] = useState({
    topic: '',
    date: '',
    time: '',
    duration: '60',
    degree: '',
    year: '',
    semester: '',
    module: '',
    email: '',
    description: ''
  });
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [meetingToDelete, setMeetingToDelete] = useState(null);
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
        start: new Date(2025, 2, 30, 9, 0),
        end: new Date(2025, 2, 30, 10, 0),
        attendees: ['alex@example.com', 'emma@example.com'],
        link: 'https://meet.sliit-hub.com/meeting/3',
        description: 'Tutorial session on Neural Networks and Deep Learning',
        module: 'AI',
        year: 'Year 2',
        semester: 'Semester 2',
        host: 'Prof. Alex Chen'
      },
      {
        id: 2,
        title: 'Research Progress Review',
        start: new Date(2025, 2, 31, 14, 0),
        end: new Date(2025, 2, 31, 15, 30),
        attendees: ['john@example.com', 'sarah@example.com'],
        link: 'https://meet.sliit-hub.com/meeting/4',
        description: 'Review of research progress and discussion of next steps',
        module: 'Software Engineering',
        year: 'Year 4',
        semester: 'Semester 1',
        host: 'Dr. Sarah Johnson'
      },
      {
        id: 3,
        title: 'Web Development Workshop',
        start: new Date(2025, 3, 15, 10, 0), // April 15, 2024
        end: new Date(2025, 3, 15, 12, 0),
        attendees: ['mike@example.com', 'lisa@example.com', 'john@example.com'],
        link: 'https://meet.sliit-hub.com/meeting/5',
        description: 'Hands-on workshop on modern web development practices and frameworks',
        module: 'Web Development',
        year: 'Year 3',
        semester: 'Semester 1',
        host: 'Dr. Michael Brown'
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

  const handleEditMeeting = (meeting) => {
    setEditingMeeting(meeting);
    // Format the date and time for the form
    const meetingDate = moment(meeting.start).format('YYYY-MM-DD');
    const meetingTime = moment(meeting.start).format('HH:mm');
    
    setScheduleFormData({
      topic: meeting.title,
      date: meetingDate,
      time: meetingTime,
      duration: moment(meeting.end).diff(moment(meeting.start), 'minutes').toString(),
      degree: meeting.degree || '',
      year: meeting.year,
      semester: meeting.semester,
      module: meeting.module,
      email: meeting.email || '',
      description: meeting.description
    });
    setShowEditForm(true);
  };

  const handleEditSubmit = (e) => {
    e.preventDefault();
    // TODO: Implement meeting edit logic
    console.log('Edited Meeting:', { ...scheduleFormData, id: editingMeeting.id });
    alert('Meeting Updated!');
    setShowEditForm(false);
    setEditingMeeting(null);
    setScheduleFormData({
      topic: '',
      date: '',
      time: '',
      duration: '60',
      degree: '',
      year: '',
      semester: '',
      module: '',
      email: '',
      description: ''
    });
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
      degree: '',
      year: '',
      semester: '',
      module: '',
      email: '',
      description: ''
    });
    setShowScheduleForm(false);
  };

  const handleDeleteClick = (meeting) => {
    setMeetingToDelete(meeting);
    setShowDeleteConfirm(true);
  };

  const confirmDelete = () => {
    if (meetingToDelete) {
      // TODO: Implement actual delete logic
      console.log('Delete meeting:', meetingToDelete.id);
      setMeetings(prevMeetings => prevMeetings.filter(m => m.id !== meetingToDelete.id));
      setShowDeleteConfirm(false);
      setMeetingToDelete(null);
    }
  };

  const cancelDelete = () => {
    setShowDeleteConfirm(false);
    setMeetingToDelete(null);
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
    return 'upcoming'; // Changed from 'ended' to 'upcoming'
  };

  const handleStartMeeting = (meeting) => {
    // Extract meeting ID from the link
    const meetingId = meeting.link.split('/').pop();
    navigate(`/meeting/${meetingId}`);
  };

  const renderMeetingForm = (isEdit = false) => (
    <div className="schedule-form-overlay">
      <div className="schedule-form-card">
        <div className="form-header">
          <h2>{isEdit ? 'Edit Meeting' : 'Schedule New Meeting'}</h2>
          <button 
            className="close-btn" 
            onClick={() => {
              setShowScheduleForm(false);
              setShowEditForm(false);
              setEditingMeeting(null);
            }}
          >
            ×
          </button>
        </div>
        <form onSubmit={isEdit ? handleEditSubmit : handleScheduleSubmit}>
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

          <div className="form-group">
            <label htmlFor="degree">Degree</label>
            <select
              id="degree"
              name="degree"
              value={scheduleFormData.degree}
              onChange={handleScheduleChange}
              required
            >
              <option value="">Select Degree</option>
              {DEGREES.map(degree => (
                <option key={degree} value={degree}>{degree}</option>
              ))}
            </select>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label htmlFor="year">Degree Year</label>
              <select
                id="year"
                name="year"
                value={scheduleFormData.year}
                onChange={handleScheduleChange}
                required
              >
                <option value="">Select Year</option>
                {DEGREE_YEARS.map(year => (
                  <option key={year} value={year}>{year}</option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label htmlFor="semester">Semester</label>
              <select
                id="semester"
                name="semester"
                value={scheduleFormData.semester}
                onChange={handleScheduleChange}
                required
              >
                <option value="">Select Semester</option>
                {SEMESTERS.map(semester => (
                  <option key={semester} value={semester}>{semester}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label htmlFor="module">Module</label>
              <select
                id="module"
                name="module"
                value={scheduleFormData.module}
                onChange={handleScheduleChange}
                required
              >
                <option value="">Select Module</option>
                {MODULES.map(module => (
                  <option key={module} value={module}>{module}</option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label htmlFor="email">Your Email</label>
              <input
                type="email"
                id="email"
                name="email"
                value={scheduleFormData.email}
                onChange={handleScheduleChange}
                required
                placeholder="your.email@example.com"
              />
            </div>
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
            <button 
              type="button" 
              className="cancel-btn" 
              onClick={() => {
                setShowScheduleForm(false);
                setShowEditForm(false);
                setEditingMeeting(null);
              }}
            >
              Cancel
            </button>
            <button type="submit" className="submit-btn">
              {isEdit ? 'Update Meeting' : 'Schedule Meeting'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );

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
            <h1>My Meetings</h1>
            <button className="schedule-btn" onClick={() => setShowScheduleForm(true)}>
              <FaPlus /> Schedule New Meeting
            </button>
          </div>

          {showScheduleForm && renderMeetingForm(false)}
          {showEditForm && renderMeetingForm(true)}

          {/* Add Delete Confirmation Dialog */}
          {showDeleteConfirm && meetingToDelete && (
            <div className="meeting-confirm-overlay">
              <div className="meeting-confirm-dialog">
                <h4>Delete Meeting</h4>
                <p>Are you sure you want to delete the meeting "{meetingToDelete.title}"?</p>
                <p className="delete-warning">This action cannot be undone.</p>
                <div className="meeting-confirm-actions">
                  <button className="cancel-btn" onClick={cancelDelete}>Cancel</button>
                  <button className="delete-confirm-btn" onClick={confirmDelete}>Delete Meeting</button>
                </div>
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
                        onClick={() => handleEditMeeting(meeting)}
                        title="Edit Meeting"
                      >
                        <FaEdit />
                      </button>
                      <button 
                        className="action-btn delete"
                        onClick={() => handleDeleteClick(meeting)}
                        title="Delete Meeting"
                      >
                        <FaTrash />
                      </button>
                    </div>
                  </div>

                  <div className="meeting-meta">
                    <span className="meeting-module">{meeting.module}</span>
                    <span className="meeting-year">{meeting.year}</span>
                    <span className="meeting-semester">{meeting.semester}</span>
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
                      <FaEnvelope className="icon" />
                      <div className="info-content">
                        <span className="label">Email</span>
                        <span className="value">{meeting.email || 'Not specified'}</span>
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
                    </span>
                    <button 
                      className="strt-meeting-btn"
                      onClick={() => handleStartMeeting(meeting)}
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