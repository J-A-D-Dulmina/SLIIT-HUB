import React from 'react';
import { NavLink } from 'react-router-dom';
import { FaTachometerAlt, FaUserTie, FaUserGraduate, FaBook, FaBullhorn, FaUserShield, FaLayerGroup, FaVideo } from 'react-icons/fa';
import '../styles/AdminSidebar.css';

const AdminSidebar = () => (
  <aside className="admin-sidebar">
    <div className="admin-sidebar-header">Admin Panel</div>
    <nav className="admin-sidebar-nav">
      <NavLink to="/admin-dashboard" className={({ isActive }) => isActive ? 'active' : ''} end><FaTachometerAlt /> Dashboard</NavLink>
      <NavLink to="/admin-degrees" className={({ isActive }) => isActive ? 'active' : ''}><FaLayerGroup /> Degrees</NavLink>
      <NavLink to="/admin-lecturers" className={({ isActive }) => isActive ? 'active' : ''}><FaUserTie /> Lecturers</NavLink>
      <NavLink to="/admin-students" className={({ isActive }) => isActive ? 'active' : ''}><FaUserGraduate /> Students</NavLink>
      <NavLink to="/admin-videos" className={({ isActive }) => isActive ? 'active' : ''}><FaVideo /> Videos</NavLink>
      <NavLink to="/admin-announcements" className={({ isActive }) => isActive ? 'active' : ''}><FaBullhorn /> Announcements</NavLink>
      <NavLink to="/admin-admins" className={({ isActive }) => isActive ? 'active' : ''}><FaUserShield /> Admins</NavLink>
    </nav>
  </aside>
);

export default AdminSidebar; 