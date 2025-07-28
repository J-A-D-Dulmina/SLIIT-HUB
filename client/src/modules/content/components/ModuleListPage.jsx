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
  FaLink,
  FaGraduationCap
} from 'react-icons/fa';
import SideMenu from '../../../shared/components/SideMenu';
import TopBar from '../../../shared/components/TopBar';
import UpcomingMeetings from '../../../shared/components/UpcomingMeetings';
import moment from 'moment';
import * as FaIcons from 'react-icons/fa';

// Remove static YEARS, SEMESTERS, MODULES
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
  const [degrees, setDegrees] = useState([]);
  const [expandedDegrees, setExpandedDegrees] = useState({});
  const [selectedYear, setSelectedYear] = useState({});
  const [selectedSemester, setSelectedSemester] = useState({});
  const [collapsed, setCollapsed] = useState(false);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [events, setEvents] = useState([]);
  const [showConfirm, setShowConfirm] = useState(false);
  const [meetingToStart, setMeetingToStart] = useState(null);
  const [allPublishedVideos, setAllPublishedVideos] = useState([]);

  const fetchAllPublishedVideos = async () => {
    const res = await fetch(`/api/tutoring/videos/published`);
    if (res.ok) {
      const data = await res.json();
      setAllPublishedVideos(data.videos);
    } else {
      setAllPublishedVideos([]);
    }
  };

  useEffect(() => {
    fetch('/api/admin/degrees')
      .then(res => res.json())
      .then(data => setDegrees(data))
      .catch(() => setDegrees([]));
    
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
    fetchAllPublishedVideos();
    
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

  // Remove static YEARS and SEMESTERS usage
  // const getModules = (degreeId, yearId, semesterId) => {
  //   // Always use 'bsc' for demo/testing so modules show for any degree
  //   return MODULES['bsc']?.[yearId]?.[semesterId] || [];
  // };

  // Add a function to fetch published videos for a module
  // const fetchPublishedVideos = async (degreeId, yearNumber, semesterNumber, moduleCode) => {
  //   const params = new URLSearchParams({
  //     degree: degreeId,
  //     year: yearNumber,
  //     semester: semesterNumber,
  //     module: moduleCode
  //   });
  //   const res = await fetch(`/api/tutoring/videos/published?${params.toString()}`);
  //   if (res.ok) {
  //     const data = await res.json();
  //     setSelectedModuleVideos(data.videos);
  //   } else {
  //     setSelectedModuleVideos([]);
  //   }
  // };

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
                      {degrees.map(degree => {
                        return (
                          <div key={degree._id} className="degree-section">
                            <div 
                              className={`degree-card ${expandedDegrees[degree._id] ? 'expanded' : ''}`}
                              onClick={() => toggleDegree(degree._id)}
                            >
                              <div className="degree-icon">
                                {degree.icon && FaIcons[degree.icon]
                                  ? React.createElement(FaIcons[degree.icon])
                                  : <FaGraduationCap />}
                              </div>
                              <div className="degree-info">
                                <h3>{degree.name}</h3>
                              </div>
                              {expandedDegrees[degree._id] ? <FaChevronUp /> : <FaChevronDown />}
                            </div>
                            
                            {expandedDegrees[degree._id] && (
                              <div className="degree-content">
                                <div className="year-list">
                                  {degree.years.map(year => {
                                    return (
                                      <div
                                        key={year.yearNumber}
                                        className={`year-card ${selectedYear[degree._id] === year.yearNumber ? 'selected' : ''}`}
                                        onClick={() => {
                                          toggleYear(degree._id, year.yearNumber);
                                        }}
                                      >
                                        <h3>Year {year.yearNumber}</h3>
                                      </div>
                                    );
                                  })}
                                </div>
                                
                                {selectedYear[degree._id] && (
                                  <div className="semester-list">
                                    {degree.years.find(y => y.yearNumber === selectedYear[degree._id])?.semesters.map(semester => {
                                      return (
                                        <div
                                          key={semester.semesterNumber}
                                          className={`semester-card ${selectedSemester[degree._id] === semester.semesterNumber ? 'selected' : ''}`}
                                          onClick={() => {
                                            toggleSemester(degree._id, semester.semesterNumber);
                                          }}
                                        >
                                          <h4>Semester {semester.semesterNumber}</h4>
                                        </div>
                                      );
                                    })}
                                  </div>
                                )}
                                
                                {selectedSemester[degree._id] && (
                                  <div className="module-list">
                                    <div className="module-grid">
                                      {degree.years.find(y => y.yearNumber === selectedYear[degree._id])?.semesters.find(s => s.semesterNumber === selectedSemester[degree._id])?.modules.map(module => {
                                        const moduleVideos = allPublishedVideos.filter(video => video.module === module.code);
                                        console.log('Module code:', module.code, 'All video.module:', allPublishedVideos.map(v => v.module));
                                        console.log('Filtered videos for this module:', moduleVideos);
                                        return (
                                          <div
                                            key={module.code}
                                            className="module-card"
                                            onClick={() => handleModuleClick(module.code)}
                                          >
                                            <div className="module-header">
                                              <h3>{module.code}</h3>
                                              <span className="credits">{module.credit} Credits</span>
                                            </div>
                                            <h4>{module.name}</h4>
                                            <p>{module.description}</p>
                                            {/* Show published videos for this module */}
                                            {moduleVideos && moduleVideos.length > 0 && (
                                              <div className="published-videos-list">
                                                {moduleVideos.map(video => {
                                                  // Patch: fallback for missing thumbnail/title, show raw data if missing
                                                  const thumbnail = video.thumbnail || '/assets/SLITT HUB logo transparent.png';
                                                  const title = video.title || 'Untitled Video';
                                                  return (
                                                    <div key={video._id} className="published-video-card">
                                                      <img src={thumbnail} alt={title} style={{ width: 120, height: 68, objectFit: 'cover', borderRadius: 6 }} />
                                                      <div style={{ marginLeft: 10 }}>
                                                        <div style={{ fontWeight: 600 }}>{title}</div>
                                                        <div style={{ fontSize: 12, color: '#666' }}>{video.description}</div>
                                                        {(!video.title || !video.thumbnail) && (
                                                          <pre style={{ fontSize: 10, color: '#b91c1c', background: '#fef2f2', padding: 4, borderRadius: 4 }}>{JSON.stringify(video, null, 2)}</pre>
                                                        )}
                                                      </div>
                                                    </div>
                                                  );
                                                })}
                                              </div>
                                            )}
                                          </div>
                                        );
                                      })}
                                    </div>
                                  </div>
                                )}
                              </div>
                            )}
                          </div>
                        );
                      })}
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