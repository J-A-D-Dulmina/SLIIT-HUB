import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { FaChevronLeft, FaChevronRight, FaClock, FaUsers, FaLink, FaPlay, FaSearch, FaFilter, FaTimes, FaSquare, FaCheckSquare, FaSyncAlt } from 'react-icons/fa';
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
  const [participatingMeetings, setParticipatingMeetings] = useState([]);
  const [currentUser, setCurrentUser] = useState(null);
  const [degrees, setDegrees] = useState([]);

  const navigate = useNavigate();

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  // Get current user data
  useEffect(() => {
    const fetchUserData = async () => {
      try {
        const response = await fetch('http://localhost:5000/api/protected', { 
          credentials: 'include' 
        });
        if (response.ok) {
          const data = await response.json();
          setCurrentUser(data.user);
        }
      } catch (error) {
        console.error('Error fetching user data:', error);
      }
    };
    fetchUserData();
  }, []);

  useEffect(() => {
    fetchMeetings();
    // Load participating meetings from localStorage
    const saved = localStorage.getItem('participatingMeetings');
    if (saved) {
      setParticipatingMeetings(JSON.parse(saved));
    }
    
    // Set up periodic refresh every 30 seconds to catch status changes
    const refreshInterval = setInterval(() => {
      fetchMeetings();
    }, 30000);
    
    return () => clearInterval(refreshInterval);
  }, []);

  useEffect(() => {
    fetch('/api/admin/degrees')
      .then(res => res.json())
      .then(data => setDegrees(data))
      .catch(() => setDegrees([]));
  }, []);

  // Dynamic year/semester/module options for filters
  const selectedDegreeObj = degrees.find(d => d._id === selectedDegree);
  const years = selectedDegreeObj ? selectedDegreeObj.years : [];
  const selectedYearObj = years.find(y => String(y.yearNumber) === String(selectedYear));
  const semesters = selectedYearObj ? selectedYearObj.semesters : [];
  const selectedSemesterObj = semesters.find(s => String(s.semesterNumber) === String(selectedSemester));
  const modules = selectedSemesterObj ? selectedSemesterObj.modules : [];

  const fetchMeetings = async () => {
    try {
      setLoading(true);
      const response = await fetch('http://localhost:5000/api/meetings/public', {
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include'
      });
      if (!response.ok) {
        throw new Error('Failed to fetch meetings');
      }
      const result = await response.json();
      
      // Filter out meetings where current user is the host
      let filteredMeetings = result.data || [];
      if (currentUser && currentUser.studentId) {
        filteredMeetings = filteredMeetings.filter(meeting => 
          meeting.hostStudentId !== currentUser.studentId
        );
        console.log('Filtered out user meetings. Original count:', result.data?.length, 'Filtered count:', filteredMeetings.length);
      }
      
      setMeetings(filteredMeetings);
      console.log('Fetched meetings:', filteredMeetings.map(m => ({
        id: m._id,
        title: m.title,
        status: m.status,
        canJoin: m.canJoin,
        computedStatus: m.computedStatus
      })));
    } catch (error) {
      setError('Failed to load meetings');
    } finally {
      setLoading(false);
    }
  };

  // Refetch meetings when currentUser changes
  useEffect(() => {
    if (currentUser) {
      fetchMeetings();
    }
  }, [currentUser]);

  const filteredMeetings = meetings.filter(meeting => {
    // Only filter out truly ended meetings, allow all others to show join button
    if (meeting.status === 'ended' || meeting.status === 'completed') return false;
    
    const matchesSearch =
      meeting.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      meeting.hostName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      meeting.description.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesDegree = !selectedDegree || meeting.degree === selectedDegree;
    const matchesYear = !selectedYear || meeting.year === selectedYear;
    const matchesSemester = !selectedSemester || meeting.semester === selectedSemester;
    const matchesModule = !selectedModule || meeting.module === selectedModule;
    const matchesStatus = !selectedStatus || meeting.status === selectedStatus;
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

  const handleParticipateToggle = async (meetingId) => {
    try {
      const isCurrentlyParticipating = participatingMeetings.includes(meetingId);
      
      if (isCurrentlyParticipating) {
        // Leave participation
        const response = await fetch(`http://localhost:5000/api/meetings/${meetingId}/leave-participation`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          credentials: 'include'
        });

        if (response.ok) {
          setParticipatingMeetings(prev => prev.filter(id => id !== meetingId));
          localStorage.setItem('participatingMeetings', JSON.stringify(participatingMeetings.filter(id => id !== meetingId)));
          // Refresh meetings to get updated participant count
          fetchMeetings();
        } else {
          const errorData = await response.json();
          alert(errorData.message || 'Failed to leave participation');
        }
      } else {
        // Join participation
        const response = await fetch(`http://localhost:5000/api/meetings/${meetingId}/participate`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          credentials: 'include'
        });

        if (response.ok) {
          setParticipatingMeetings(prev => [...prev, meetingId]);
          localStorage.setItem('participatingMeetings', JSON.stringify([...participatingMeetings, meetingId]));
          // Refresh meetings to get updated participant count
          fetchMeetings();
        } else {
          const errorData = await response.json();
          alert(errorData.message || 'Failed to join participation');
        }
      }
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
            <button 
              className="refresh-button"
              onClick={fetchMeetings}
              title="Refresh meetings"
            >
              <FaSyncAlt /> Refresh
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
                {/* Degree Filter */}
                <div className="filter-item">
                  <label>Degree</label>
                  <select
                    value={selectedDegree}
                    onChange={e => setSelectedDegree(e.target.value)}
                  >
                    <option value="">All Degrees</option>
                    {degrees.map(degree => (
                      <option key={degree._id} value={degree._id}>{degree.name}</option>
                    ))}
                  </select>
                </div>

                {/* Year Filter */}
                {selectedDegreeObj && (
                  <div className="filter-item">
                    <label>Degree Year</label>
                    <select
                      value={selectedYear}
                      onChange={e => setSelectedYear(e.target.value)}
                    >
                      <option value="">All Years</option>
                      {years.map(y => (
                        <option key={y.yearNumber} value={y.yearNumber}>Year {y.yearNumber}</option>
                      ))}
                    </select>
                  </div>
                )}

                {/* Semester Filter */}
                {selectedYearObj && (
                  <div className="filter-item">
                    <label>Semester</label>
                    <select
                      value={selectedSemester}
                      onChange={e => setSelectedSemester(e.target.value)}
                    >
                      <option value="">All Semesters</option>
                      {semesters.map(s => (
                        <option key={s.semesterNumber} value={s.semesterNumber}>Semester {s.semesterNumber}</option>
                      ))}
                    </select>
                  </div>
                )}

                {/* Module Filter */}
                {selectedSemesterObj && (
                  <div className="filter-item">
                    <label>Module</label>
                    <select
                      value={selectedModule}
                      onChange={e => setSelectedModule(e.target.value)}
                    >
                      <option value="">All Modules</option>
                      {modules.map(m => (
                        <option key={m.code} value={m.code}>{m.code} - {m.name}</option>
                      ))}
                    </select>
                  </div>
                )}

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
                const participantCount = meeting.participants ? meeting.participants.length : 0;
                const isParticipating = participatingMeetings.includes(meeting._id);
                
                return (
                  <div key={meeting._id} className={`meeting-card ${meeting.status}`}>
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
                          <span className={`status-tag ${meeting.status}`}>{meeting.status}</span>
                          <button
                            className={`toggle-participate ${isParticipating ? 'active' : ''}`}
                            onClick={() => handleParticipateToggle(meeting._id)}
                            disabled={meeting.status === 'ended'}
                          >
                            {isParticipating ? <FaCheckSquare /> : <FaSquare />}
                            {isParticipating ? 'Participating' : 'Participate'}
                          </button>
                          {/* Show join button for all non-ended meetings */}
                          {meeting.status !== 'ended' && meeting.status !== 'completed' && (
                            <button
                              className={`join-meeting ${meeting.status === 'in-progress' ? 'in-progress' : ''}`}
                              onClick={() => handleJoinMeeting(meeting)}
                              disabled={meeting.status === 'ended'}
                              title={meeting.status === 'in-progress' ? 'Join ongoing meeting' : 
                                     meeting.status === 'starting-soon' ? 'Join meeting starting soon' :
                                     meeting.status === 'upcoming' ? 'Join upcoming meeting' : 'Join meeting'}
                            >
                              <FaPlay /> 
                              {meeting.status === 'in-progress' ? 'Join Meeting' :
                               meeting.status === 'starting-soon' ? 'Join Soon' :
                               meeting.status === 'upcoming' ? 'Join Later' : 'Join Meeting'}
                            </button>
                          )}
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