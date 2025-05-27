import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { FaChevronLeft, FaChevronRight, FaClock, FaUsers, FaLink, FaPlay, FaSearch, FaFilter, FaTimes, FaSquare, FaCheckSquare } from 'react-icons/fa';
import SideMenu from '../../../shared/components/SideMenu';
import TopBar from '../../../shared/components/TopBar';
import moment from 'moment';
import '../styles/JoinMeetingPage.css';

const DEGREE_YEARS = ['Year 1', 'Year 2', 'Year 3', 'Year 4'];
const SEMESTERS = ['Semester 1', 'Semester 2'];
const MODULES = ['AI', 'Web Development', 'Database Systems', 'Software Engineering', 'Networks', 'Operating Systems'];

const JoinMeetingPage = () => {
  const [collapsed, setCollapsed] = useState(false);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [meetings, setMeetings] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [selectedYear, setSelectedYear] = useState('');
  const [selectedSemester, setSelectedSemester] = useState('');
  const [selectedModule, setSelectedModule] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('');
  const [participatingMeetings, setParticipatingMeetings] = useState(() => {
    const saved = localStorage.getItem('participatingMeetings');
    return saved ? JSON.parse(saved) : [];
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
        title: 'Research Discussion',
        start: new Date(2024, 2, 29, 10, 30),
        end: new Date(2024, 2, 29, 11, 30),
        attendees: ['john@example.com', 'sarah@example.com'],
        link: 'https://meet.sliit-hub.com/meeting/1',
        host: 'Dr. Yasas Jayaweera',
        description: 'Discussion about research progress and next steps',
        module: 'AI',
        year: 'Year 4',
        semester: 'Semester 2'
      },
      {
        id: 2,
        title: 'Group Study Session',
        start: new Date(2024, 2, 29, 14, 0),
        end: new Date(2024, 2, 29, 15, 30),
        attendees: ['mike@example.com', 'lisa@example.com'],
        link: 'https://meet.sliit-hub.com/meeting/2',
        host: 'Mike Johnson',
        description: 'Group study session for AI and Machine Learning',
        module: 'Web Development',
        year: 'Year 3',
        semester: 'Semester 1'
      },
      {
        id: 3,
        title: 'AI Tutorial',
        start: new Date(2024, 2, 30, 9, 0),
        end: new Date(2024, 2, 30, 10, 0),
        attendees: ['alex@example.com', 'emma@example.com'],
        link: 'https://meet.sliit-hub.com/meeting/3',
        host: 'Prof. Alex Chen',
        description: 'Tutorial session on Neural Networks and Deep Learning',
        module: 'AI',
        year: 'Year 2',
        semester: 'Semester 2'
      }
    ];

    setMeetings(dummyMeetings);
    return () => clearInterval(timer);
  }, []);

  const filteredMeetings = meetings.filter(meeting => {
    const matchesSearch =
      meeting.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      meeting.host.toLowerCase().includes(searchQuery.toLowerCase()) ||
      meeting.description.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesYear = !selectedYear || meeting.year === selectedYear;
    const matchesSemester = !selectedSemester || meeting.semester === selectedSemester;
    const matchesModule = !selectedModule || meeting.module === selectedModule;
    const matchesStatus = !selectedStatus || getMeetingStatus(meeting) === selectedStatus;

    return matchesSearch && matchesYear && matchesSemester && matchesModule && matchesStatus;
  });

  const clearFilters = () => {
    setSelectedYear('');
    setSelectedSemester('');
    setSelectedModule('');
    setSelectedStatus('');
  };

  const formatMeetingTime = (date) => {
    return moment(date).format('MMM D, YYYY [at] HH:mm');
  };

  const canStartMeeting = (meeting) => {
    const now = new Date();
    const start = new Date(meeting.start);
    const diff = (start - now) / 60000; // minutes
    return diff <= 15 && diff >= -120; // allow up to 2 hours after start
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
    return 'upcoming';
  };

  const handleParticipateToggle = (meetingId) => {
    setParticipatingMeetings(prev => {
      const isCurrentlyParticipating = prev.includes(meetingId);
      const newList = isCurrentlyParticipating
        ? prev.filter(id => id !== meetingId)
        : [...prev, meetingId];

      // Update meeting participants count
      setMeetings(currentMeetings =>
        currentMeetings.map(meeting => {
          if (meeting.id === meetingId) {
            return {
              ...meeting,
              attendees: isCurrentlyParticipating
                ? meeting.attendees.filter(email => email !== 'current-user@example.com')
                : [...meeting.attendees, 'current-user@example.com']
            };
          }
          return meeting;
        })
      );

      // Save to localStorage
      localStorage.setItem('participatingMeetings', JSON.stringify(newList));
      return newList;
    });
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
                  placeholder="Search meetings by title, host, or description..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
              <button
                className={`filter-button ${showFilters ? 'active' : ''}`}
                onClick={() => setShowFilters(!showFilters)}
              >
                <FaFilter />
                Filters
                {(selectedYear || selectedSemester || selectedModule || selectedStatus) && (
                  <span className="filter-indicator" />
                )}
              </button>
            </div>

            {showFilters && (
              <div className="filter-container">
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

                {(selectedYear || selectedSemester || selectedModule || selectedStatus) && (
                  <button className="reset-filters" onClick={clearFilters}>
                    <FaTimes /> Clear Filters
                  </button>
                )}
              </div>
            )}
          </div>

          <div className="meeting-grid">
            {filteredMeetings.length > 0 ? (
              filteredMeetings.map(meeting => {
                const status = getMeetingStatus(meeting);
                return (
                  <div key={meeting.id} className={`meeting-card ${status}`}>
                    <div className="meeting-content">
                      <div>
                        <div className="meeting-header">
                          <h3>{meeting.title}</h3>
                          <p className="meeting-brief">{meeting.description}</p>        
                        </div>
                      </div>
                      <div>
                        <div className="meeting-tags">
                          <span className="tag-module">{meeting.module}</span>
                          <span className="tag-year">{meeting.year}</span>
                          <span className="tag-semester">{meeting.semester}</span>
                          <span className="tag-time">
                            <FaClock /> {formatMeetingTime(meeting.start)}
                          </span>
                        </div>
                        <div className="meeting-info">
                          <div className="info-row">
                            <FaUsers />
                            <span>Host: {meeting.host}</span>
                          </div>
                          <div className="info-row">
                            <FaUsers />
                            <span>{meeting.attendees.length} {meeting.attendees.length === 1 ? 'participant' : 'participants'}</span>
                          </div>
                        </div>
                      </div>

                      <div>
                        <div className="action-panel">
                          <span className={`status-tag ${status}`}>
                            {status === 'starting-soon' && 'Starting Soon'}
                            {status === 'upcoming' && 'Upcoming'}
                            {status === 'in-progress' && 'In Progress'}
                          </span>
                          <button
                            className={`toggle-participate ${participatingMeetings.includes(meeting.id) ? 'active' : ''}`}
                            onClick={() => handleParticipateToggle(meeting.id)}
                          >
                            {participatingMeetings.includes(meeting.id) ? <FaCheckSquare /> : <FaSquare />}
                            {participatingMeetings.includes(meeting.id) ? 'Participating' : 'Participate'}
                          </button>
                          <button
                            className="join-meeting"
                            onClick={() => window.open(meeting.link, '_blank')}
                          >
                            <FaPlay /> {status === 'in-progress' ? 'Join Now' : 'Join Meeting'}
                          </button>
                        </div>
                      </div>
                    </div>
                    <div className="meeting-url">
                      <FaLink />
                      <a href={meeting.link} target="_blank" rel="noopener noreferrer">
                        {meeting.link}
                      </a>
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="empty-state">
                <p>No meetings found matching your criteria</p>
                <button className="reset-filters" onClick={clearFilters}>
                  Clear Filters
                </button>
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  );
};

export default JoinMeetingPage; 