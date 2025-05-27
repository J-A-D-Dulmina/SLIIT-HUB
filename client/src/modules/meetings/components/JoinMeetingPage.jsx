import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { FaChevronLeft, FaChevronRight, FaClock, FaUsers, FaLink, FaPlay, FaSearch } from 'react-icons/fa';
import SideMenu from '../../../shared/components/SideMenu';
import TopBar from '../../../shared/components/TopBar';
import moment from 'moment';
import '../styles/JoinMeetingPage.css';

const JoinMeetingPage = () => {
  const [collapsed, setCollapsed] = useState(false);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [meetings, setMeetings] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
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
        description: 'Discussion about research progress and next steps'
      },
      {
        id: 2,
        title: 'Group Study Session',
        start: new Date(2024, 2, 29, 14, 0),
        end: new Date(2024, 2, 29, 15, 30),
        attendees: ['mike@example.com', 'lisa@example.com'],
        link: 'https://meet.sliit-hub.com/meeting/2',
        host: 'Mike Johnson',
        description: 'Group study session for AI and Machine Learning'
      },
      {
        id: 3,
        title: 'AI Tutorial',
        start: new Date(2024, 2, 30, 9, 0),
        end: new Date(2024, 2, 30, 10, 0),
        attendees: ['alex@example.com', 'emma@example.com'],
        link: 'https://meet.sliit-hub.com/meeting/3',
        host: 'Prof. Alex Chen',
        description: 'Tutorial session on Neural Networks and Deep Learning'
      }
    ];
    
    setMeetings(dummyMeetings);
    return () => clearInterval(timer);
  }, []);

  const filteredMeetings = meetings.filter(meeting => 
    meeting.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    meeting.host.toLowerCase().includes(searchQuery.toLowerCase()) ||
    meeting.description.toLowerCase().includes(searchQuery.toLowerCase())
  );

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

        <main className="join-meeting-page">
          <div className="page-header">
            <button className="back-button" onClick={() => navigate(-1)}>
              <FaChevronLeft />
              Back
            </button>
            <h1>Join Meeting</h1>
          </div>

          <div className="search-section">
            <div className="search-box">
              <FaSearch className="search-icon" />
              <input
                type="text"
                placeholder="Search meetings by title, host, or description..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </div>

          <div className="meetings-grid">
            {filteredMeetings.map(meeting => {
              const status = getMeetingStatus(meeting);
              return (
                <div key={meeting.id} className={`meeting-card ${status}`}>
                  <div className="meeting-header">
                    <h3>{meeting.title}</h3>
                    <span className={`status-badge ${status}`}>
                      {status === 'starting-soon' && 'Starting Soon'}
                      {status === 'upcoming' && 'Upcoming'}
                      {status === 'in-progress' && 'In Progress'}
                      {status === 'ended' && 'Ended'}
                    </span>
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
                        <span className="label">Host</span>
                        <span className="value">{meeting.host}</span>
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

                  <div className="meeting-actions">
                    <button 
                      className={`join-btn ${status === 'ended' ? 'disabled' : ''}`}
                      disabled={status === 'ended'}
                      onClick={() => window.open(meeting.link, '_blank')}
                    >
                      <FaPlay /> {status === 'in-progress' ? 'Join Now' : 'Join Meeting'}
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

export default JoinMeetingPage; 