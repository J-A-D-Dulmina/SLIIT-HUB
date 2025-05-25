import React from 'react';
import { Link } from 'react-router-dom';
import '../../styles/SideMenu.css';
import logo from '../../assets/SLITT HUB logo.png';
import { 
  FaHome, 
  FaVideo, 
  FaBook, 
  FaUsers, 
  FaRobot, 
  FaCalendarAlt, 
  FaCog, 
  FaSignOutAlt
} from 'react-icons/fa';

const SideMenu = ({ collapsed }) => {
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
          <li className="active">
            <Link to="/dashboard">
              <FaHome className="icon" />
              {!collapsed && <span>Dashboard</span>}
            </Link>
          </li>
          <li>
            <Link to="/meetings">
              <FaVideo className="icon" />
              {!collapsed && <span>Meetings</span>}
            </Link>
          </li>
          <li>
            <Link to="/resources">
              <FaBook className="icon" />
              {!collapsed && <span>Resources</span>}
            </Link>
          </li>
          <li>
            <Link to="/tutoring">
              <FaUsers className="icon" />
              {!collapsed && <span>Tutoring</span>}
            </Link>
          </li>
          <li>
            <Link to="/ai-tools">
              <FaRobot className="icon" />
              {!collapsed && <span>AI Tools</span>}
            </Link>
          </li>
          <li>
            <Link to="/calendar">
              <FaCalendarAlt className="icon" />
              {!collapsed && <span>Calendar</span>}
            </Link>
          </li>
        </ul>
      </nav>
      <div className="menu-footer">
        <ul>
          <li>
            <Link to="/settings">
              <FaCog className="icon" />
              {!collapsed && <span>Settings</span>}
            </Link>
          </li>
          <li>
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