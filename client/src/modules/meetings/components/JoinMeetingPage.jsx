import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { FaChevronLeft, FaChevronRight, FaClock, FaUsers, FaLink, FaPlay, FaSearch, FaFilter, FaTimes, FaSquare, FaCheckSquare } from 'react-icons/fa';
import SideMenu from '../../../shared/components/SideMenu';
import TopBar from '../../../shared/components/TopBar';
import moment from 'moment';
import '../styles/JoinMeetingPage.css';

const DEGREES = [
  'BSc in Information Technology',
  'BSc in Software Engineering',
  'BSc in Computer Science',
  'BSc in Data Science'
];

const DEGREE_YEARS = ['Year 1', 'Year 2', 'Year 3', 'Year 4'];
const SEMESTERS = ['Semester 1', 'Semester 2'];
const MODULES = ['AI', 'Web Development', 'Database Systems', 'Software Engineering', 'Networks', 'Operating Systems'];

const JoinMeetingPage = () => {
  const [collapsed, setCollapsed] = useState(false);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [meetings, setMeetings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [selectedDegree, setSelectedDegree] = useState('');
  const [selectedYear, setSelectedYear] = useState('');
  const [selectedSemester, setSelectedSemester] = useState('');
  const [selectedModule, setSelectedModule] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('');
  const [participatingMeetings, setParticipatingMeetings] = useState(() => {
    const saved = localStorage.getItem('participatingMeetings');
    return saved ? JSON.parse(saved) : [];
  });
  const navigate = useNavigate();

  // Get user info and token
  const userInfo = JSON.parse(localStorage.getItem('userInfo') || '{}');
  const token = localStorage.getItem('token');

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
      const response = await fetch('/api/meetings', {
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

  const getMeetingStatus = (meeting) => {
    const now = new Date();
    const start = new Date(meeting.startTime);
    const end = new Date(meeting.endTime);

    if (now < start) {
      const diff = (start - now) / 60000; // minutes
      if (diff <= 15) return 'starting-soon';
      return 'upcoming';
    }
    if (now >= start && now <= end) return 'in-progress';
    return 'ended';
  };

  const filteredMeetings = meetings.filter(meeting => {
    const status = getMeetingStatus(meeting);
    if (status === 'ended' || status === 'completed') return false;
    const matchesSearch =
      meeting.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      meeting.hostName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      meeting.description.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesDegree = !selectedDegree || meeting.degree === selectedDegree;
    const matchesYear = !selectedYear || meeting.year === selectedYear;
    const matchesSemester = !selectedSemester || meeting.semester === selectedSemester;
    const matchesModule = !selectedModule || meeting.module === selectedModule;
    const matchesStatus = !selectedStatus || getMeetingStatus(meeting) === selectedStatus;
    return matchesSearch && matchesDegree && matchesYear && matchesSemester && matchesModule && matchesStatus;
  });

  const clearFilters = () => {
    setSelectedDegree('');
    setSelectedYear('');
    setSelectedSemester('');
    setSelectedModule('');
    setSelectedStatus('');
  };

  const hasActiveFilters = selectedDegree || selectedYear || selectedSemester || selectedModule || selectedStatus;

  const formatMeetingTime = (date) => {
    return moment(date).format('MMM D, YYYY [at] HH:mm');
  };

  const canStartMeeting = (meeting) => {
    const now = new Date();
    const start = new Date(meeting.startTime);
    const diff = (start - now) / 60000; // minutes
    return diff <= 15 && diff >= -120; // allow up to 2 hours after start
  };

  const handleParticipateToggle = async (meetingId) => {
    try {
      const isCurrentlyParticipating = participatingMeetings.includes(meetingId);
      
      if (isCurrentlyParticipating) {
        // Leave meeting
        const response = await fetch(`/api/meetings/${meetingId}/leave`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });

        if (response.ok) {
          setParticipatingMeetings(prev => prev.filter(id => id !== meetingId));
          localStorage.setItem('participatingMeetings', JSON.stringify(participatingMeetings.filter(id => id !== meetingId)));
        }
      } else {
        // Join meeting
        const response = await fetch(`/api/meetings/${meetingId}/join`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });

        if (response.ok) {
          setParticipatingMeetings(prev => [...prev, meetingId]);
          localStorage.setItem('participatingMeetings', JSON.stringify([...participatingMeetings, meetingId]));
        }
      }

      // Refresh meetings to get updated participant count
      fetchMeetings();
    } catch (error) {
      console.error('Error toggling participation:', error);
      alert('Failed to update participation status');
    }
  };

  const handleJoinMeeting = (meeting) => {
    // Navigate to the meeting page
    navigate(`/meeting/${meeting._id}`);
  };

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
          <main className="meeting-dashboard">
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

        <main className="meeting-dashboard">
          <div className="dashboard-header">
            <h1>All Meetings</h1>
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
                    value={selectedDegree}
                    onChange={(e) => setSelectedDegree(e.target.value)}
                  >
                    <option value="">All Degrees</option>
                    {DEGREES.map(degree => (
                      <option key={degree} value={degree}>{degree}</option>
                    ))}
                  </select>
                </div>

                <div className="filter-item">
                  <label>Degree Year</label>
                  <select
                    value={selectedYear}
                    onChange={(e) => setSelectedYear(e.target.value)}
                  >
                    <option value="">All Years</option>
                    {DEGREE_YEARS.map(year => (
                      <option key={year} value={year}>{year}</option>
                    ))}
                  </select>
                </div>

                <div className="filter-item">
                  <label>Semester</label>
                  <select
                    value={selectedSemester}
                    onChange={(e) => setSelectedSemester(e.target.value)}
                  >
                    <option value="">All Semesters</option>
                    {SEMESTERS.map(semester => (
                      <option key={semester} value={semester}>{semester}</option>
                    ))}
                  </select>
                </div>

                <div className="filter-item">
                  <label>Module</label>
                  <select
                    value={selectedModule}
                    onChange={(e) => setSelectedModule(e.target.value)}
                  >
                    <option value="">All Modules</option>
                    {MODULES.map(module => (
                      <option key={module} value={module}>{module}</option>
                    ))}
                  </select>
                </div>

                <div className="filter-item">
                  <label>Status</label>
                  <select
                    value={selectedStatus}
                    onChange={(e) => setSelectedStatus(e.target.value)}
                  >
                    <option value="">All Status</option>
                    <option value="starting-soon">Starting Soon</option>
                    <option value="upcoming">Upcoming</option>
                    <option value="in-progress">In Progress</option>
                  </select>
                </div>
              </div>
            )}
          </div>

          <div className="meeting-grid">
            {filteredMeetings.length > 0 ? (
              filteredMeetings.map(meeting => {
                const status = getMeetingStatus(meeting);
                const isParticipating = participatingMeetings.includes(meeting._id);
                const participantCount = meeting.participants ? meeting.participants.length : 0;
                
                return (
                  <div key={meeting._id} className={`meeting-card ${status}`}>
                    <div className="meeting-content">
                      <div>
                        <div className="meeting-header">
                          <h3>{meeting.title}</h3>
                          <p className="meeting-brief">{meeting.description}</p>        
                        </div>
                      </div>
                      <div>
                        <div className="meeting-tags">
                          <span className="tag-degree">{meeting.degree}</span>
                          <span className="tag-module">{meeting.module}</span>
                          <span className="tag-year">{meeting.year}</span>
                          <span className="tag-semester">{meeting.semester}</span>
                          <span className="tag-time">
                            <FaClock /> {formatMeetingTime(meeting.startTime)}
                          </span>
                        </div>
                        <div className="meeting-info">
                          <div className="info-row">
                            <FaUsers />
                            <span>Host: {meeting.hostName}</span>
                          </div>
                          <div className="info-row">
                            <FaUsers />
                            <span>{participantCount} {participantCount === 1 ? 'participant' : 'participants'}</span>
                          </div>
                        </div>
                      </div>

                      <div>
                        <div className="action-panel">
                          <span className={`status-tag ${status}`}>
                            {status === 'starting-soon' && 'Starting Soon'}
                            {status === 'upcoming' && 'Upcoming'}
                            {status === 'in-progress' && 'In Progress'}
                            {status === 'ended' && 'Ended'}
                          </span>
                          <button
                            className={`toggle-participate ${isParticipating ? 'active' : ''}`}
                            onClick={() => handleParticipateToggle(meeting._id)}
                            disabled={status === 'ended'}
                          >
                            {isParticipating ? <FaCheckSquare /> : <FaSquare />}
                            {isParticipating ? 'Participating' : 'Participate'}
                          </button>
                          <button
                            className="join-meeting"
                            onClick={() => handleJoinMeeting(meeting)}
                            disabled={status === 'ended'}
                          >
                            <FaPlay /> {status === 'in-progress' ? 'Join Now' : 'Join Meeting'}
                          </button>
                        </div>
                      </div>
                    </div>
                    <div className="meeting-url">
                      <FaLink />
                      <a href={meeting.meetingLink} target="_blank" rel="noopener noreferrer">
                        {meeting.meetingLink}
                      </a>
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="no-meetings">No meetings found</div>
            )}
          </div>
        </main>
      </div>
    </div>
  );
};

export default JoinMeetingPage; 