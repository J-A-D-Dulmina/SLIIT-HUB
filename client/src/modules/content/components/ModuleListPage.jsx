import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import '../styles/ModuleListPage.css';
import { 
  FaBook, 
  FaChevronRight, 
  FaChevronLeft,
  FaLaptopCode,
  FaCode,
  FaDatabase,
  FaNetworkWired,
  FaMobileAlt,
  FaCloud,
  FaChevronDown,
  FaChevronUp,
  FaPlay,
  FaLink
} from 'react-icons/fa';
import SideMenu from '../../../shared/components/SideMenu';
import TopBar from '../../../shared/components/TopBar';
import UpcomingMeetings from '../../../shared/components/UpcomingMeetings';
import moment from 'moment';

const DEGREES = [
  { 
    id: 'bsc', 
    name: 'Bachelor of Science in Information Technology',
    icon: <FaLaptopCode />
  },
  { 
    id: 'bse', 
    name: 'Bachelor of Software Engineering',
    icon: <FaCode />
  },
  { 
    id: 'bcs', 
    name: 'Bachelor of Computer Science',
    icon: <FaDatabase />
  },
  { 
    id: 'bnet', 
    name: 'Bachelor of Network Engineering',
    icon: <FaNetworkWired />
  },
  { 
    id: 'bmob', 
    name: 'Bachelor of Mobile Computing',
    icon: <FaMobileAlt />
  },
  { 
    id: 'bcloud', 
    name: 'Bachelor of Cloud Computing',
    icon: <FaCloud />
  }
];

const YEARS = [
  { id: 1, name: 'Year 1' },
  { id: 2, name: 'Year 2' },
  { id: 3, name: 'Year 3' },
  { id: 4, name: 'Year 4' }
];

const SEMESTERS = [
  { id: 1, name: 'Semester 1' },
  { id: 2, name: 'Semester 2' }
];

// Update MODULES structure to include semesters
const MODULES = {
  bsc: {
    1: {
      1: [ // Year 1, Semester 1
        {
          id: 'IT1010',
          name: 'Introduction to Programming',
          description: 'Fundamental concepts of programming and problem-solving using Python.',
          credits: 3
        },
        {
          id: 'IT1020',
          name: 'Database Management Systems',
          description: 'Introduction to database concepts, SQL, and database design.',
          credits: 3
        }
      ],
      2: [ // Year 1, Semester 2
        {
          id: 'IT1030',
          name: 'Web Development',
          description: 'HTML, CSS, and JavaScript fundamentals for web development.',
          credits: 3
        }
      ]
    },
    2: {
      1: [ // Year 2, Semester 1
        {
          id: 'IT2010',
          name: 'Object-Oriented Programming',
          description: 'Advanced programming concepts using Java.',
          credits: 3
        }
      ],
      2: [ // Year 2, Semester 2
        {
          id: 'IT2020',
          name: 'Data Structures and Algorithms',
          description: 'Implementation and analysis of common data structures and algorithms.',
          credits: 3
        }
      ]
    }
  }
};

// Add the same meeting data structure as LandingPage
const MY_SCHEDULED_MEETINGS = [
  {
    id: 1,
    topic: 'Group Project Discussion',
    start: new Date(new Date().setDate(new Date().getDate() + 1)), // Tomorrow
    link: 'https://meet.sliit-hub.com/meeting/1',
  }
];

// Add the same module details helper
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

const ModuleListPage = () => {
  const navigate = useNavigate();
  const [expandedDegrees, setExpandedDegrees] = useState({});
  const [selectedYear, setSelectedYear] = useState({});
  const [selectedSemester, setSelectedSemester] = useState({});
  const [collapsed, setCollapsed] = useState(false);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [events, setEvents] = useState([]);
  const [showConfirm, setShowConfirm] = useState(false);
  const [meetingToStart, setMeetingToStart] = useState(null);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 60000);
    
    // Add the same events setup as LandingPage
    const calendarEvents = MY_SCHEDULED_MEETINGS.map(m => ({
      id: m.id,
      title: m.topic,
      start: m.start,
      end: new Date(m.start.getTime() + 60 * 60000),
      allDay: false,
      resource: { isScheduledMeeting: true },
    }));

    const upcomingMeetings = [
      {
        id: 101,
        title: 'Research Discussion',
        start: new Date(new Date().setDate(29)),
        end: new Date(new Date().setDate(29) + 60 * 60000),
        allDay: false,
        resource: { isUpcomingMeeting: true },
      },
      {
        id: 102,
        title: 'Group Study Session',
        start: new Date(new Date().setDate(29) + 3.5 * 60 * 60000),
        end: new Date(new Date().setDate(29) + 5 * 60 * 60000),
        allDay: false,
        resource: { isUpcomingMeeting: true },
      }
    ];

    setEvents([...calendarEvents, ...upcomingMeetings]);
    
    return () => clearInterval(timer);
  }, []);

  // Add the same meeting helper functions as LandingPage
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

  // Get only the next scheduled meeting
  const nextScheduledMeeting = MY_SCHEDULED_MEETINGS
    .sort((a, b) => new Date(a.start) - new Date(b.start))[0];

  const toggleDegree = (degreeId) => {
    setExpandedDegrees(prev => ({
      ...prev,
      [degreeId]: !prev[degreeId]
    }));
  };

  const toggleYear = (degreeId, yearId) => {
    setSelectedYear(prev => ({
      ...prev,
      [degreeId]: prev[degreeId] === yearId ? null : yearId
    }));
    // Clear semester selection when year changes
    setSelectedSemester(prev => ({
      ...prev,
      [degreeId]: null
    }));
  };

  const toggleSemester = (degreeId, semesterId) => {
    setSelectedSemester(prev => ({
      ...prev,
      [degreeId]: prev[degreeId] === semesterId ? null : semesterId
    }));
  };

  const handleModuleClick = (moduleId) => {
    navigate(`/videos/${moduleId}`);
  };

  const getModules = (degreeId, yearId, semesterId) => {
    return MODULES[degreeId]?.[yearId]?.[semesterId] || [];
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
              <div className="module-list-page">
                <div className="selection-container">
                  <div className="degree-selection">
                    <h2>Select Your Degree Program</h2>
                    <div className="degree-list">
                      {DEGREES.map(degree => (
                        <div key={degree.id} className="degree-section">
                          <div 
                            className={`degree-card ${expandedDegrees[degree.id] ? 'expanded' : ''}`}
                            onClick={() => toggleDegree(degree.id)}
                          >
                            <div className="degree-icon">{degree.icon}</div>
                            <div className="degree-info">
                              <h3>{degree.name}</h3>
                            </div>
                            {expandedDegrees[degree.id] ? <FaChevronUp /> : <FaChevronDown />}
                          </div>
                          
                          {expandedDegrees[degree.id] && (
                            <div className="degree-content">
                              <div className="year-list">
                                {YEARS.map(year => (
                                  <div
                                    key={year.id}
                                    className={`year-card ${selectedYear[degree.id] === year.id ? 'selected' : ''}`}
                                    onClick={() => toggleYear(degree.id, year.id)}
                                  >
                                    <h3>{year.name}</h3>
                                  </div>
                                ))}
                              </div>
                              
                              {selectedYear[degree.id] && (
                                <div className="semester-list">
                                  {SEMESTERS.map(semester => (
                                    <div
                                      key={semester.id}
                                      className={`semester-card ${selectedSemester[degree.id] === semester.id ? 'selected' : ''}`}
                                      onClick={() => toggleSemester(degree.id, semester.id)}
                                    >
                                      <h4>{semester.name}</h4>
                                    </div>
                                  ))}
                                </div>
                              )}
                              
                              {selectedSemester[degree.id] && (
                                <div className="module-list">
                                  <div className="module-grid">
                                    {getModules(degree.id, selectedYear[degree.id], selectedSemester[degree.id]).map(module => (
                                      <div
                                        key={module.id}
                                        className="module-card"
                                        onClick={() => handleModuleClick(module.id)}
                                      >
                                        <div className="module-header">
                                          <h3>{module.id}</h3>
                                          <span className="credits">{module.credits} Credits</span>
                                        </div>
                                        <h4>{module.name}</h4>
                                        <p>{module.description}</p>
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
          <div className="right-sidebar">
            <UpcomingMeetings events={events} />
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
                          <div className="meeting-meta">
                            <span>{getModuleDetails(nextScheduledMeeting.id).year}</span>
                            <span>{getModuleDetails(nextScheduledMeeting.id).semester}</span>
                            <span>{getModuleDetails(nextScheduledMeeting.id).module}</span>
                          </div>
                          <div className="meeting-coordinator">
                            Coordinator: {getModuleDetails(nextScheduledMeeting.id).coordinator}
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
                        <a href={nextScheduledMeeting.link} target="_blank" rel="noopener noreferrer">
                          {nextScheduledMeeting.link}
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
    </div>
  );
};

export default ModuleListPage; 