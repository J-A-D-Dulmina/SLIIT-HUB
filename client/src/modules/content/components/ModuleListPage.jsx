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
import axios from 'axios';

// Backend-connected meeting data structure

const ModuleListPage = () => {
  const navigate = useNavigate();
  const [degrees, setDegrees] = useState([]);
  const [expandedDegrees, setExpandedDegrees] = useState({});
  const [selectedYear, setSelectedYear] = useState({});
  const [selectedSemester, setSelectedSemester] = useState({});
  const [collapsed, setCollapsed] = useState(false);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [events, setEvents] = useState([]);
  const [myMeetings, setMyMeetings] = useState([]);
  const [showConfirm, setShowConfirm] = useState(false);
  const [meetingToStart, setMeetingToStart] = useState(null);
  
  // Get user info from localStorage
  const userInfo = JSON.parse(localStorage.getItem('userInfo') || '{}');

  const fetchMeetings = async () => {
    try {
      const res = await axios.get('http://localhost:5000/api/meetings/public');
      if (res.data && res.data.data) {
        setEvents(res.data.data.map(m => ({
          id: m._id,
          title: m.title,
          start: new Date(m.startTime),
          end: new Date(new Date(m.startTime).getTime() + (m.duration || 60) * 60000),
          allDay: false,
          resource: { ...m, isUpcomingMeeting: true }
        })));
      }
    } catch (err) {
      console.error('Failed to fetch meetings:', err);
    }
  };

  const fetchMyMeetings = async () => {
    try {
      const res = await axios.get('http://localhost:5000/api/meetings/my-meetings', { withCredentials: true });
      if (res.data && res.data.data) {
        setMyMeetings(res.data.data.map(m => ({
          id: m._id,
          title: m.title,
          start: new Date(m.startTime),
          end: new Date(new Date(m.startTime).getTime() + (m.duration || 60) * 60000),
          allDay: false,
          resource: { ...m, isScheduledMeeting: true }
        })));
      }
    } catch (err) {
      console.error('Failed to fetch my meetings:', err);
    }
  };

  useEffect(() => {
    axios.get('/api/admin/degrees')
      .then(res => setDegrees(res.data))
      .catch(() => setDegrees([]));
    
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 60000);
    
    fetchMeetings();
    fetchMyMeetings();
    
    return () => clearInterval(timer);
  }, []);

  // Meeting helper functions
  const formatMeetingTime = (date) => {
    return moment(date).format('MMM D, YYYY [at] HH:mm');
  };

  const handleStartMeeting = (meeting) => {
    setMeetingToStart(meeting);
    setShowConfirm(true);
  };

  const confirmStartMeeting = async () => {
    try {
      // Call the start meeting API
      const response = await axios.post(`http://localhost:5000/api/meetings/${meetingToStart._id}/start`, {}, {
        withCredentials: true
      });
      
      setShowConfirm(false);
      alert(`Meeting started: ${meetingToStart.title || meetingToStart.topic}`);
      setMeetingToStart(null);
      
      // Refresh meetings data
      await fetchMyMeetings();
    } catch (error) {
      alert(`Failed to start meeting: ${error.response?.data?.message || error.message}`);
    }
  };

  const cancelStartMeeting = () => {
    setShowConfirm(false);
    setMeetingToStart(null);
  };

  // For UpcomingMeetings, filter for upcoming meetings from OTHER people (public meetings)
  const upcomingOthers = events.filter(m => {
    const status = m.resource?.computedStatus || m.resource?.status || m.status;
    return status === 'upcoming' || status === 'starting-soon';
  });

  // For My Scheduled Meeting, show the next one (my upcoming meetings only)
  const upcomingMine = myMeetings.filter(m => {
    const status = m.resource?.computedStatus || m.resource?.status || m.computedStatus || m.status;
    return status === 'upcoming' || status === 'starting-soon' || status === 'scheduled';
  });
  const nextScheduledMeeting = upcomingMine.sort((a, b) => new Date(a.resource?.startTime || a.startTime) - new Date(b.resource?.startTime || b.startTime))[0];



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
    navigate(`/module/${moduleId}`);
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
            <UpcomingMeetings events={upcomingOthers} />
          </div>
        </div>
      </div>
    </div>
  );
};

export default ModuleListPage; 