import React, { useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { FaTachometerAlt, FaUserTie, FaUserGraduate, FaBook, FaBullhorn, FaUserShield, FaLayerGroup, FaVideo, FaUserCircle, FaSignOutAlt } from 'react-icons/fa';
import ConfirmationDialog from '../../../shared/components/ConfirmationDialog';
import '../styles/AdminSidebar.css';

const adminInfo = {
  name: 'Admin User',
  email: 'admin@slitthub.com',
};

const AdminSidebar = () => {
  const navigate = useNavigate();
  const [showLogoutDialog, setShowLogoutDialog] = useState(false);

  const handleLogout = () => {
    setShowLogoutDialog(true);
  };

  const confirmLogout = () => {
    setShowLogoutDialog(false);
    navigate('/admin-login');
  };

  return (
    <aside className="admin-sidebar">
      <div className="admin-sidebar-top">
        <div className="admin-sidebar-title">SLIIT HUB <span style={{ fontWeight: 400 }}>admin panel</span></div>
      </div>
      <hr className="admin-sidebar-divider" />
      <nav className="admin-sidebar-nav">
        <NavLink to="/admin-dashboard" className={({ isActive }) => isActive ? 'active' : ''} end><FaTachometerAlt /> Dashboard</NavLink>
        <NavLink to="/admin-lecturers" className={({ isActive }) => isActive ? 'active' : ''}><FaUserTie /> Lecturers</NavLink>
        <NavLink to="/admin-students" className={({ isActive }) => isActive ? 'active' : ''}><FaUserGraduate /> Students</NavLink>
        <NavLink to="/admin-videos" className={({ isActive }) => isActive ? 'active' : ''}><FaVideo /> Videos</NavLink>
        <NavLink to="/admin-degrees" className={({ isActive }) => isActive ? 'active' : ''}><FaLayerGroup /> Degrees</NavLink>
        <NavLink to="/admin-announcements" className={({ isActive }) => isActive ? 'active' : ''}><FaBullhorn /> Announcements</NavLink>
        <NavLink to="/admin-admins" className={({ isActive }) => isActive ? 'active' : ''}><FaUserShield /> Admins</NavLink>
        <button className="admin-sidebar-logout-btn" onClick={handleLogout}>
          <FaSignOutAlt style={{ marginRight: 8 }} /> Logout
        </button>
      </nav>
      <div className="admin-sidebar-bottom">
        <div className="admin-sidebar-admin-details">
          <FaUserCircle className="admin-sidebar-admin-avatar" />
          <div>
            <div className="admin-sidebar-admin-name">{adminInfo.name}</div>
            <div className="admin-sidebar-admin-email">{adminInfo.email}</div>
          </div>
        </div>
      </div>
      <ConfirmationDialog
        isOpen={showLogoutDialog}
        onClose={() => setShowLogoutDialog(false)}
        onConfirm={confirmLogout}
        title="Logout Confirmation"
        message="Are you sure you want to logout?"
        confirmText="Logout"
        cancelText="Cancel"
        type="danger"
      />
    </aside>
  );
};

export default AdminSidebar; 