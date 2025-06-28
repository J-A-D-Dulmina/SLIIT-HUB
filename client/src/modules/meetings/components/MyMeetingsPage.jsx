import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { FaChevronLeft, FaChevronRight, FaClock, FaUsers, FaLink, FaPlay, FaEdit, FaTrash, FaPlus, FaEnvelope } from 'react-icons/fa';
import SideMenu from '../../../shared/components/SideMenu';
import TopBar from '../../../shared/components/TopBar';
import moment from 'moment';
import '../styles/MyMeetingsPage.css';

const DEGREES = [
  'BSc in Information Technology',
  'BSc in Software Engineering',
  'BSc in Computer Science',
  'BSc in Data Science'
];

const DEGREE_YEARS = ['Year 1', 'Year 2', 'Year 3', 'Year 4'];
const SEMESTERS = ['Semester 1', 'Semester 2'];
const MODULES = ['AI', 'Web Development', 'Database Systems', 'Software Engineering', 'Networks', 'Operating Systems'];

const MyMeetingsPage = () => {
  const [collapsed, setCollapsed] = useState(false);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [meetings, setMeetings] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showScheduleForm, setShowScheduleForm] = useState(false);
  const [showEditForm, setShowEditForm] = useState(false);
  const [editingMeeting, setEditingMeeting] = useState(null);
  const [showSuccessMessage, setShowSuccessMessage] = useState(false);
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

  // Get user info from localStorage
  const userInfo = JSON.parse(localStorage.getItem('userInfo') || '{}');

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 60000);

    fetchMeetings();
    return () => clearInterval(timer);
  }, []);

  const fetchMeetings = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/meetings?hostOnly=true', {
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include'
      });
      if (!response.ok) {
        throw new Error('Failed to fetch meetings');
      }
      const result = await response.json();
      setMeetings(result.data || []);
    } catch (error) {
      setError('Failed to load meetings');
    } finally {
      setLoading(false);
    }
  };

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
    const meetingDate = moment(meeting.startTime).format('YYYY-MM-DD');
    const meetingTime = moment(meeting.startTime).format('HH:mm');
    
    setScheduleFormData({
      topic: meeting.title,
      date: meetingDate,
      time: meetingTime,
      duration: meeting.duration.toString(),
      degree: meeting.degree || '',
      year: meeting.year,
      semester: meeting.semester,
      module: meeting.module,
      email: meeting.hostEmail || userInfo.email || '',
      description: meeting.description
    });
    setShowEditForm(true);
  };

  const handleEditSubmit = async (e) => {
    e.preventDefault();
    try {
      const response = await fetch(`/api/meetings/${editingMeeting._id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(scheduleFormData)
      });

      if (!response.ok) {
        throw new Error('Failed to update meeting');
      }

      alert('Meeting Updated Successfully!');
    setShowEditForm(false);
    setEditingMeeting(null);
      resetFormData();
      fetchMeetings(); // Refresh the meetings list
    } catch (error) {
      console.error('Error updating meeting:', error);
      alert('Failed to update meeting. Please try again.');
    }
  };

  const handleScheduleSubmit = async (e) => {
    e.preventDefault();
    const payload = {
      title: scheduleFormData.topic,
      startTime: `${scheduleFormData.date}T${scheduleFormData.time}`,
      duration: scheduleFormData.duration,
      degree: scheduleFormData.degree,
      year: scheduleFormData.year,
      semester: scheduleFormData.semester,
      module: scheduleFormData.module,
      email: scheduleFormData.email,
      description: scheduleFormData.description
    };
    for (const field of ['title', 'startTime', 'duration', 'degree', 'year', 'semester', 'module']) {
      if (!payload[field] || payload[field] === 'undefined' || payload[field] === 'null') {
        alert(`Please fill in the ${field} field.`);
        return;
      }
    }
    if (isNaN(Date.parse(payload.startTime)) || new Date(payload.startTime) <= new Date()) {
      alert('Meeting start time must be a valid future date and time.');
      return;
    }
    try {
      const response = await fetch('/api/meetings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(payload)
      });
      if (!response.ok) {
        if (response.status === 401 || response.status === 403) {
          alert('Session expired. Please log in again.');
          navigate('/login');
          return;
        }
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to create meeting');
      }
      
      // Show success message and close form
      setShowSuccessMessage(true);
      setShowScheduleForm(false);
      resetFormData();
      
      // Hide success message after 3 seconds
      setTimeout(() => {
        setShowSuccessMessage(false);
      }, 3000);
      
      fetchMeetings();
    } catch (error) {
      alert(`Failed to schedule meeting: ${error.message}`);
    }
  };

  const resetFormData = () => {
    setScheduleFormData({
      topic: '',
      date: '',
      time: '',
      duration: '60',
      degree: '',
      year: '',
      semester: '',
      module: '',
      email: userInfo.email || '',
      description: ''
    });
  };

  const handleDeleteClick = (meeting) => {
    setMeetingToDelete(meeting);
    setShowDeleteConfirm(true);
  };

  const confirmDelete = async () => {
    if (meetingToDelete) {
      try {
        const response = await fetch(`/api/meetings/${meetingToDelete._id}`, {
          method: 'DELETE',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include'
        });

        if (!response.ok) {
          throw new Error('Failed to delete meeting');
        }

        alert('Meeting deleted successfully!');
        setMeetings(prevMeetings => prevMeetings.filter(m => m._id !== meetingToDelete._id));
      setShowDeleteConfirm(false);
      setMeetingToDelete(null);
      } catch (error) {
        console.error('Error deleting meeting:', error);
        alert('Failed to delete meeting. Please try again.');
      }
    }
  };

  const cancelDelete = () => {
    setShowDeleteConfirm(false);
    setMeetingToDelete(null);
  };

  const formatMeetingTime = (date) => {
    return moment(date).format('MMM D, YYYY [at] HH:mm');
  };

  const handleStartMeeting = (meeting) => {
    // Extract meeting ID from the link or use the meeting ID directly
    const meetingId = meeting._id || meeting.link.split('/').pop();
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
              resetFormData();
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
                resetFormData();
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

  if (loading) {
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
            <div className="loading">Loading meetings...</div>
          </main>
        </div>
      </div>
    );
  }

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
          {/* Success Message */}
          {showSuccessMessage && (
            <div className="success-message-overlay">
              <div className="success-message-card">
                <div className="success-icon">✓</div>
                <h3>Meeting Scheduled Successfully!</h3>
                <p>Your meeting has been created and is now available in your meetings list.</p>
              </div>
            </div>
          )}

          <div className="page-header">
            <h1>My Meetings</h1>
            <button className="schedule-btn" onClick={() => setShowScheduleForm(true)}>
              <FaPlus />
              Schedule Meeting
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
            {meetings.length > 0 ? (
              meetings.map(meeting => {
              return (
                  <div key={meeting._id} className={`my-meeting-card ${meeting.status}`}>
                  <div className="my-meeting-header">
                    <h3 className="my-meeting-title">{meeting.title}</h3>
                    <div className="my-meeting-actions">
                      <button 
                        className="my-action-btn my-action-btn-edit"
                        onClick={() => handleEditMeeting(meeting)}
                        title="Edit Meeting"
                      >
                        <FaEdit />
                      </button>
                      <button 
                        className="my-action-btn my-action-btn-delete"
                        onClick={() => handleDeleteClick(meeting)}
                        title="Delete Meeting"
                      >
                        <FaTrash />
                      </button>
                    </div>
                  </div>

                  <div className="my-meeting-meta">
                    <span className="my-meeting-module">{meeting.module}</span>
                    <span className="my-meeting-year">{meeting.year}</span>
                    <span className="my-meeting-semester">{meeting.semester}</span>
                  </div>
                  
                  <div className="my-meeting-info">
                    <div className="info-item">
                      <FaClock className="icon" />
                      <div className="info-content">
                        <span className="label">Time</span>
                          <span className="value">{formatMeetingTime(meeting.startTime)}</span>
                      </div>
                    </div>
                    
                    <div className="info-item">
                      <FaEnvelope className="icon" />
                      <div className="info-content">
                        <span className="label">Email</span>
                          <span className="value">{meeting.hostEmail || 'Not specified'}</span>
                      </div>
                    </div>

                    <div className="info-item">
                      <FaLink className="icon" />
                      <div className="info-content">
                        <span className="label">Meeting Link</span>
                          <a href={meeting.meetingLink} target="_blank" rel="noopener noreferrer" className="meeting-link">
                            {meeting.meetingLink}
                        </a>
                      </div>
                    </div>
                  </div>

                  <p className="my-meeting-description">{meeting.description}</p>

                  <div className="my-meeting-footer">
                    <span className={`my-status-badge ${meeting.status}`}>
                      {meeting.status === 'starting-soon' && 'Starting Soon'}
                      {meeting.status === 'upcoming' && 'Upcoming'}
                      {meeting.status === 'in-progress' && 'In Progress'}
                        {meeting.status === 'ended' && 'Ended'}
                    </span>
                    <button 
                      className="strt-meeting-btn"
                      onClick={() => handleStartMeeting(meeting)}
                        disabled={meeting.status === 'ended'}
                    >
                      <FaPlay /> {meeting.status === 'in-progress' ? 'Join Now' : 'Start Meeting'}
                    </button>
                  </div>
                </div>
              );
              })
            ) : (
              <div className="empty-state">
                <p>No meetings found. Schedule your first meeting!</p>
                <button className="schedule-btn" onClick={() => setShowScheduleForm(true)}>
                  <FaPlus /> Schedule New Meeting
                </button>
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  );
};

export default MyMeetingsPage; 