import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { FaChevronLeft, FaChevronRight, FaClock, FaUsers, FaLink, FaPlay, FaEdit, FaTrash, FaPlus, FaEnvelope, FaSearch, FaFilter } from 'react-icons/fa';
import SideMenu from '../../../shared/components/SideMenu';
import TopBar from '../../../shared/components/TopBar';
import ConfirmationDialog from '../../../shared/components/ConfirmationDialog';
import moment from 'moment';
import '../styles/MyMeetingsPage.css';
import axios from 'axios';

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
  const [showEndMeetingConfirm, setShowEndMeetingConfirm] = useState(false);
  const [meetingToEnd, setMeetingToEnd] = useState(null);
  const [showEndSuccess, setShowEndSuccess] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [filterData, setFilterData] = useState({
    degree: '',
    year: '',
    semester: '',
    module: '',
    status: ''
  });
  const [degrees, setDegrees] = useState([]);
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

  useEffect(() => {
    axios.get('/api/admin/degrees')
      .then(res => setDegrees(res.data))
      .catch(() => setDegrees([]));
  }, []);

  const fetchMeetings = async () => {
    try {
      setLoading(true);
      
      // Use the my-meetings endpoint
      const response = await axios.get('http://localhost:5000/api/meetings/my-meetings', {
        withCredentials: true
      });
      
      setMeetings(response.data.data || []);
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
      const response = await axios.put(`http://localhost:5000/api/meetings/${editingMeeting._id}`, scheduleFormData, {
        withCredentials: true
      });

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
      const response = await axios.post('http://localhost:5000/api/meetings', payload, {
        withCredentials: true
      });
      
      // Show success message and close form
      setShowSuccessMessage(true);
      setShowScheduleForm(false);
      resetFormData();
      // Hide success message after 3 seconds
      setTimeout(() => {
        setShowSuccessMessage(false);
      }, 3000);
      fetchMeetings();
      // Don't navigate to meeting page - let user see the start button
      // if (response.data && response.data.data && response.data.data._id) {
      //   navigate(`/meeting/${response.data.data._id}`);
      // }
    } catch (error) {
      if (error.response?.status === 401 || error.response?.status === 403) {
        alert('Session expired. Please log in again.');
        navigate('/login');
        return;
      }
      alert(`Failed to schedule meeting: ${error.response?.data?.message || error.message}`);
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

  const filteredMeetings = meetings.filter(meeting => {
    const matchesSearch = !searchQuery || 
      meeting.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      meeting.description.toLowerCase().includes(searchQuery.toLowerCase());
    
    // Use separate filter data and fix comparison logic
    const matchesDegree = !filterData.degree || meeting.degree === filterData.degree;
    const matchesYear = !filterData.year || String(meeting.year) === String(filterData.year);
    const matchesSemester = !filterData.semester || String(meeting.semester) === String(filterData.semester);
    const matchesModule = !filterData.module || meeting.module === filterData.module;
    const matchesStatus = !filterData.status || meeting.status === filterData.status;
    
    // Debug logging
    if (filterData.degree || filterData.year || filterData.semester || filterData.module || filterData.status) {
      console.log('Filtering meeting:', meeting.title, {
        meeting: {
          degree: meeting.degree,
          year: meeting.year,
          semester: meeting.semester,
          module: meeting.module,
          status: meeting.status
        },
        filter: filterData,
        matches: {
          degree: matchesDegree,
          year: matchesYear,
          semester: matchesSemester,
          module: matchesModule,
          status: matchesStatus
        }
      });
    }
    
    return matchesSearch && matchesDegree && matchesYear && matchesSemester && matchesModule && matchesStatus;
  });

  const clearFilters = () => {
    setFilterData({
      degree: '',
      year: '',
      semester: '',
      module: '',
      status: ''
    });
  };

  const hasActiveFilters = filterData.degree || filterData.year || filterData.semester || filterData.module || filterData.status;

  const handleDeleteClick = (meeting) => {
    setMeetingToDelete(meeting);
    setShowDeleteConfirm(true);
  };

  const confirmDelete = async () => {
    if (meetingToDelete) {
      try {
        const response = await axios.delete(`http://localhost:5000/api/meetings/${meetingToDelete._id}`, {
          withCredentials: true
        });

        alert('Meeting deleted successfully!');
        setMeetings(prevMeetings => prevMeetings.filter(m => m._id !== meetingToDelete._id));
        setShowDeleteConfirm(false);
        setMeetingToDelete(null);
      } catch (error) {
        console.error('Error deleting meeting:', error);
        alert('Error deleting meeting: ' + (error.response?.data?.message || error.message));
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

  const handleStartMeeting = async (meeting) => {
    try {
      // First call the start meeting API
      const response = await axios.post(`http://localhost:5000/api/meetings/${meeting._id}/start`, {}, {
        withCredentials: true
      });
      
      // If successful, navigate to the meeting page
      navigate(`/meeting/${meeting._id}`);
    } catch (error) {
      alert(`Failed to start meeting: ${error.response?.data?.message || error.message}`);
    }
  };

  const handleRejoinMeeting = async (meeting) => {
    try {
      // Navigate directly to the meeting page for rejoining
      navigate(`/meeting/${meeting._id}`);
    } catch (error) {
      alert(`Failed to rejoin meeting: ${error.response?.data?.message || error.message}`);
    }
  };

  // Add this function to refresh meetings after ending
  const handleEndMeeting = async (meetingId) => {
    const meeting = meetings.find(m => m._id === meetingId);
    setMeetingToEnd(meeting);
    setShowEndMeetingConfirm(true);
  };

  const confirmEndMeeting = async () => {
    if (meetingToEnd) {
      try {
        const response = await axios.post(`http://localhost:5000/api/meetings/${meetingToEnd._id}/end`, {}, {
          withCredentials: true
        });
        setShowEndMeetingConfirm(false);
        setMeetingToEnd(null);
        setShowEndSuccess(true);
          await fetchMeetings(); // Refresh meetings list
        
        // Hide success message after 3 seconds
        setTimeout(() => {
          setShowEndSuccess(false);
        }, 3000);
      } catch (error) {
        alert('Failed to end meeting. Please try again.');
        setShowEndMeetingConfirm(false);
        setMeetingToEnd(null);
      }
    }
  };

  const cancelEndMeeting = () => {
    setShowEndMeetingConfirm(false);
    setMeetingToEnd(null);
  };

  const renderMeetingForm = (isEdit = false) => {
    // Dynamic year/semester/module options for scheduling/editing
    const selectedDegree = degrees.find(d => d._id === scheduleFormData.degree);
    const years = selectedDegree ? selectedDegree.years : [];
    const selectedYear = years.find(y => String(y.yearNumber) === String(scheduleFormData.year));
    const semesters = selectedYear ? selectedYear.semesters : [];
    const selectedSemester = semesters.find(s => String(s.semesterNumber) === String(scheduleFormData.semester));
    const modules = selectedSemester ? selectedSemester.modules : [];

    return (
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

            {/* Degree Dropdown */}
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
                {degrees.map(degree => (
                  <option key={degree._id} value={degree._id}>{degree.name}</option>
                ))}
              </select>
            </div>

            {/* Year Dropdown */}
            {selectedDegree && (
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
                  {years.map(y => (
                    <option key={y.yearNumber} value={y.yearNumber}>Year {y.yearNumber}</option>
                  ))}
                </select>
              </div>
            )}

            {/* Semester Dropdown */}
            {selectedYear && (
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
                  {semesters.map(s => (
                    <option key={s.semesterNumber} value={s.semesterNumber}>Semester {s.semesterNumber}</option>
                  ))}
                </select>
              </div>
            )}

            {/* Module Dropdown */}
            {selectedSemester && (
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
                  {modules.map(m => (
                    <option key={m.code} value={m.code}>{m.code} - {m.name}</option>
                  ))}
                </select>
              </div>
            )}

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
  };

  const selectedDegreeFilter = degrees.find(d => d._id === filterData.degree);
  const years = selectedDegreeFilter ? selectedDegreeFilter.years : [];
  const selectedYearFilter = years.find(y => String(y.yearNumber) === String(filterData.year));
  const semesters = selectedYearFilter ? selectedYearFilter.semesters : [];
  const selectedSemesterFilter = semesters.find(s => String(s.semesterNumber) === String(filterData.semester));
  const modules = selectedSemesterFilter ? selectedSemesterFilter.modules : [];

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
          {/* Success Messages */}
          {showSuccessMessage && (
            <div className="success-message-overlay">
              <div className="success-message-card">
                <div className="success-icon">✓</div>
                <h3>Meeting Scheduled Successfully!</h3>
                <p>Your meeting has been created and is now available in your meetings list.</p>
              </div>
            </div>
          )}

          {showEndSuccess && (
            <div className="success-message-overlay">
              <div className="success-message-card">
                <div className="success-icon">✓</div>
                <h3>Meeting Ended Successfully!</h3>
                <p>The meeting has been ended and all participants have been notified.</p>
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

          <div className="search-container">
            <div className="search-controls">
              <div className="search-input-wrapper">
                <FaSearch className="search-icon" />
                <input
                  type="text"
                  placeholder="Search meetings..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
              <div className="filter-controls">
                <button
                  className={`filter-button ${showFilters ? 'active' : ''}`}
                  onClick={() => setShowFilters(!showFilters)}
                >
                  <FaFilter />
                  Filters
                </button>
                {hasActiveFilters && (
                  <button
                    className="filter-button clear-filter-btn"
                    onClick={clearFilters}
                    type="button"
                  >
                    Clear
                  </button>
                )}
              </div>
            </div>

            {showFilters && (
              <div className="filter-container">
                <div className="filter-item">
                  <label>Degree</label>
                  <select
                    value={filterData.degree}
                    onChange={(e) => setFilterData(prev => ({ ...prev, degree: e.target.value }))}
                  >
                    <option value="">All Degrees</option>
                    {degrees.map(degree => (
                      <option key={degree._id} value={degree._id}>{degree.name}</option>
                    ))}
                  </select>
                </div>

                <div className="filter-item">
                  <label>Degree Year</label>
                  <select
                    value={filterData.year}
                    onChange={(e) => setFilterData(prev => ({ ...prev, year: e.target.value }))}
                  >
                    <option value="">All Years</option>
                    {years.map(y => (
                      <option key={y.yearNumber} value={y.yearNumber}>Year {y.yearNumber}</option>
                    ))}
                  </select>
                </div>

                <div className="filter-item">
                  <label>Semester</label>
                  <select
                    value={filterData.semester}
                    onChange={(e) => setFilterData(prev => ({ ...prev, semester: e.target.value }))}
                  >
                    <option value="">All Semesters</option>
                    {semesters.map(s => (
                      <option key={s.semesterNumber} value={s.semesterNumber}>Semester {s.semesterNumber}</option>
                    ))}
                  </select>
                </div>

                <div className="filter-item">
                  <label>Module</label>
                  <select
                    value={filterData.module}
                    onChange={(e) => setFilterData(prev => ({ ...prev, module: e.target.value }))}
                  >
                    <option value="">All Modules</option>
                    {modules.map(m => (
                      <option key={m.code} value={m.code}>{m.code} - {m.name}</option>
                    ))}
                  </select>
                </div>

                <div className="filter-item">
                  <label>Status</label>
                  <select
                    value={filterData.status}
                    onChange={(e) => setFilterData(prev => ({ ...prev, status: e.target.value }))}
                  >
                    <option value="">All Status</option>
                    <option value="starting-soon">Starting Soon</option>
                    <option value="upcoming">Upcoming</option>
                    <option value="in-progress">In Progress</option>
                    <option value="ended">Ended</option>
                  </select>
                </div>
              </div>
            )}
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
            {filteredMeetings.length > 0 ? (
              filteredMeetings.map(meeting => {
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
                      <FaUsers className="icon" />
                      <div className="info-content">
                        <span className="label">Participants</span>
                          <span className="value">{meeting.participants ? meeting.participants.length : 0} people</span>
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
                    <span className={`my-status-badge ${meeting.computedStatus || meeting.status}`}>{meeting.computedStatus || meeting.status}</span>
                    <div className="meeting-actions">
                      {/* Use backend-computed properties */}
                      {meeting.isHost && meeting.canStart && (
                        <button className="strt-meeting-btn" onClick={() => handleStartMeeting(meeting)}>
                          <FaPlay /> Start Meeting
                        </button>
                      )}
                      {meeting.isHost && (meeting.computedStatus === 'in-progress' || meeting.status === 'in-progress') && (
                        <button className="rejoin-meeting-btn" onClick={() => handleRejoinMeeting(meeting)}>
                          <FaPlay /> Rejoin
                        </button>
                      )}
                      {meeting.canJoin && !meeting.isHost && (
                        <button className="strt-meeting-btn" onClick={() => handleStartMeeting(meeting)}>
                          <FaPlay /> Join Now
                        </button>
                      )}
                      {(meeting.computedStatus === 'in-progress' || meeting.status === 'in-progress') && meeting.isHost && (
                        <button className="end-meeting-btn" onClick={() => handleEndMeeting(meeting._id)}>
                          End Meeting
                        </button>
                      )}
                    </div>
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

      {/* Confirmation Dialogs */}
      <ConfirmationDialog
        isOpen={showDeleteConfirm}
        onClose={cancelDelete}
        onConfirm={confirmDelete}
        title="Delete Meeting"
        message="Are you sure you want to delete this meeting? This action cannot be undone."
        confirmText="Delete"
        cancelText="Cancel"
        type="danger"
      />

      <ConfirmationDialog
        isOpen={showEndMeetingConfirm}
        onClose={cancelEndMeeting}
        onConfirm={confirmEndMeeting}
        title="End Meeting"
        message={`Are you sure you want to end "${meetingToEnd?.title}" for everyone? This action cannot be undone.`}
        confirmText="End Meeting"
        cancelText="Cancel"
        type="danger"
      />


    </div>
  );
};

export default MyMeetingsPage; 