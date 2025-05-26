import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import '../../../styles/ModuleListPage.css';
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
  FaChevronUp
} from 'react-icons/fa';
import SideMenu from '../../../shared/components/SideMenu';
import TopBar from '../../../shared/components/TopBar';
import UpcomingMeetings from '../../../shared/components/UpcomingMeetings';

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

// Dummy data for modules
const MODULES = {
  bsc: {
    1: [
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
      },
      {
        id: 'IT1030',
        name: 'Web Development',
        description: 'HTML, CSS, and JavaScript fundamentals for web development.',
        credits: 3
      }
    ],
    2: [
      {
        id: 'IT2010',
        name: 'Object-Oriented Programming',
        description: 'Advanced programming concepts using Java.',
        credits: 3
      },
      {
        id: 'IT2020',
        name: 'Data Structures and Algorithms',
        description: 'Implementation and analysis of common data structures and algorithms.',
        credits: 3
      }
    ]
  }
};

const ModuleListPage = () => {
  const navigate = useNavigate();
  const [expandedDegrees, setExpandedDegrees] = useState({});
  const [selectedYear, setSelectedYear] = useState({});
  const [collapsed, setCollapsed] = useState(false);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [events, setEvents] = useState([]);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 60000);
    
    // Simulate fetching events from API
    const dummyEvents = [
      {
        id: 1,
        title: 'Research Methodology Lecture',
        start: new Date(2025, 4, 25, 10, 0),
        end: new Date(2025, 4, 25, 12, 0),
      },
      {
        id: 2,
        title: 'Group Project Meeting',
        start: new Date(2025, 4, 26, 14, 0),
        end: new Date(2025, 4, 26, 16, 0),
      },
      {
        id: 3,
        title: 'AI Tutorial Session',
        start: new Date(2025, 4, 27, 9, 0),
        end: new Date(2025, 4, 27, 11, 0),
      }
    ];
    
    setEvents(dummyEvents);
    
    return () => clearInterval(timer);
  }, []);

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
  };

  const handleModuleClick = (moduleId) => {
    navigate(`/videos/${moduleId}`);
  };

  const getModules = (degreeId, yearId) => {
    return MODULES[degreeId]?.[yearId] || [];
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
                    <h2>Select Your Degree</h2>
                    <div className="degree-list">
                      {DEGREES.map(degree => (
                        <div key={degree.id} className="degree-section">
                          <div
                            className={`degree-card ${expandedDegrees[degree.id] ? 'expanded' : ''}`}
                            onClick={() => toggleDegree(degree.id)}
                          >
                            <div className="degree-icon">
                              {degree.icon}
                            </div>
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
                                <div className="module-list">
                                  <div className="module-grid">
                                    {getModules(degree.id, selectedYear[degree.id]).map(module => (
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
          <div className="sidebar-section">
            <UpcomingMeetings events={events} />
            <div className="quick-actions">
              <h3>Quick Actions</h3>
              <button className="action-btn">Start a Meeting</button>
              <button className="action-btn">Schedule a Meeting</button>
              <button className="action-btn">Join Meeting</button>
              <button className="action-btn">Upload Content</button>
              <button className="action-btn">Find Tutor</button>
              <button className="action-btn">View Resources</button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ModuleListPage; 