import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import '../styles/SideMenu.css';
import logo from '../../assets/SLITT HUB logo.png';
import { 
  FaHome, 
  FaVideo, 
  FaBook, 
  FaUsers, 
  FaRobot, 
  FaCalendarAlt, 
  FaCog, 
  FaSignOutAlt,
  FaUser,
  FaGraduationCap,
  FaChevronDown,
  FaChevronRight,
  FaSignInAlt,
  FaList
} from 'react-icons/fa';

const SideMenu = ({ collapsed }) => {
  const location = useLocation();
  const { pathname } = location;
  const [showMeetingSubmenu, setShowMeetingSubmenu] = useState(true);

  const toggleMeetingSubmenu = () => {
    setShowMeetingSubmenu(!showMeetingSubmenu);
  };

  const isJoinMeetingActive = pathname === '/join-meeting';
  const isMyMeetingsActive = pathname === '/my-meetings';
  const isMeetingSectionActive = isJoinMeetingActive || isMyMeetingsActive;

  return (
    <div className={`side-menu ${collapsed ? 'collapsed' : ''}`}>
      <div className="menu-header">
        <div className="logo-container">
          <img src={logo} alt="SLIIT HUB Logo" className={`logo large${collapsed ? ' collapsed' : ''}`} />
        </div>
        {!collapsed && <div className="app-name">SLIIT HUB</div>}
      </div>
      <div className="user-profile">
        {!collapsed && (
          <>
            <div className="avatar">JD</div>
            <div className="user-info">
              <h4>J A D Dulmina</h4>
              <p>Student ID: 2433442</p>
            </div>
          </>
        )}
        {collapsed && <div className="avatar small">JD</div>}
      </div>
      <nav className="menu-nav">
        <ul>
          <li className={pathname === '/dashboard' ? 'active' : ''}>
            <Link to="/dashboard">
              <FaHome className="icon" />
              {!collapsed && <span>Dashboard</span>}
            </Link>
          </li>
          <li className={pathname === '/profile' ? 'active' : ''}>
            <Link to="/profile">
              <FaUser className="icon" />
              {!collapsed && <span>Profile</span>}
            </Link>
          </li>
          <li className={pathname === '/units' ? 'active' : ''}>
            <Link to="/units">
              <FaGraduationCap className="icon" />
              {!collapsed && <span>Units</span>}
            </Link>
          </li>
          <li className={`menu-item-with-submenu ${isMeetingSectionActive ? 'active' : ''}`}>
            <div 
              className="menu-item-header" 
              onClick={toggleMeetingSubmenu}
            >
              <div className="menu-item-content">
                <FaVideo className="icon" />
                {!collapsed && <span>Meetings</span>}
              </div>
              {!collapsed && (
                <span className={`submenu-arrow ${showMeetingSubmenu ? 'open' : ''}`}>
                  {showMeetingSubmenu ? <FaChevronDown /> : <FaChevronRight />}
                </span>
              )}
            </div>
            {!collapsed && showMeetingSubmenu && (
              <div className="submenu">
                <ul>
                  <li className={isJoinMeetingActive ? 'active' : ''}>
                    <Link to="/join-meeting">
                      <FaSignInAlt className="icon" />
                      <span>Join Meeting</span>
                    </Link>
                  </li>
                  <li className={isMyMeetingsActive ? 'active' : ''}>
                    <Link to="/my-meetings">
                      <FaList className="icon" />
                      <span>My Meetings</span>
                    </Link>
                  </li>
                </ul>
              </div>
            )}
          </li>
          <li className={pathname === '/resources' ? 'active' : ''}>
            <Link to="/resources">
              <FaBook className="icon" />
              {!collapsed && <span>Resources</span>}
            </Link>
          </li>
          <li className={pathname === '/tutoring' ? 'active' : ''}>
            <Link to="/tutoring">
              <FaUsers className="icon" />
              {!collapsed && <span>My Tutoring</span>}
            </Link>
          </li>
          <li className={pathname === '/ai-tool' ? 'active' : ''}>
            <Link to="/ai-tool">
              <FaRobot className="icon" />
              {!collapsed && <span>AI Tools</span>}
            </Link>
          </li>
          <li className={pathname === '/calendar' ? 'active' : ''}>
            <Link to="/calendar">
              <FaCalendarAlt className="icon" />
              {!collapsed && <span>Calendar</span>}
            </Link>
          </li>
        </ul>
      </nav>
      <div className="menu-footer">
        <ul>
          <li className={pathname === '/settings' ? 'active' : ''}>
            <Link to="/settings">
              <FaCog className="icon" />
              {!collapsed && <span>Settings</span>}
            </Link>
          </li>
          <li className={pathname === '/logout' ? 'active' : ''}>
            <Link to="/logout">
              <FaSignOutAlt className="icon" />
              {!collapsed && <span>Logout</span>}
            </Link>
          </li>
        </ul>
      </div>
    </div>
  );
};

export default SideMenu;