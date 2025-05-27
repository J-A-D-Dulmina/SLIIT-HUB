import React, { useState, useEffect } from 'react';
import { FaUser, FaEnvelope, FaPhone, FaEdit, FaLock, FaChevronLeft, FaChevronRight } from 'react-icons/fa';
import '../../../styles/ProfilePage.css';
import SideMenu from '../../../shared/components/SideMenu';
import TopBar from '../../../shared/components/TopBar';
import profileImage from '../../../assets/main_deshan-img.png';

const ProfilePage = () => {
  const [isEditing, setIsEditing] = useState(false);
  const [showPasswordForm, setShowPasswordForm] = useState(false);
  const [collapsed, setCollapsed] = useState(false);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [formData, setFormData] = useState({
    name: 'deshan dulmina',
    email: 'deshandlmina@gmail.com',
    phone: '0713618282',
    department: 'Computer Science',
    role: 'Student',
    profileImage: profileImage
  });

  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 60000);
    return () => clearInterval(timer);
  }, []);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handlePasswordChange = (e) => {
    const { name, value } = e.target;
    setPasswordData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    // TODO: Implement profile update logic
    setIsEditing(false);
  };

  const handlePasswordSubmit = (e) => {
    e.preventDefault();
    // TODO: Implement password change logic
    setShowPasswordForm(false);
    setPasswordData({
      currentPassword: '',
      newPassword: '',
      confirmPassword: ''
    });
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
              <div className="profile-container">
                <div className="profile-header">
                  <h2>Profile Information</h2>
                  {!isEditing && (
                    <button 
                      className="edit-btn"
                      onClick={() => setIsEditing(true)}
                    >
                      <FaEdit /> Edit Profile
                    </button>
                  )}
                </div>
                <div className="profile-content">
                  <div className="profile-image-section">
                    <img 
                      src={formData.profileImage} 
                      alt="Profile" 
                      className="profile-image"
                    />
                    {isEditing && (
                      <button className="change-image-btn">
                        Change Photo
                      </button>
                    )}
                  </div>
                  {!isEditing ? (
                    <div className="profile-info">
                      <div className="info-item">
                        <FaUser />
                        <div>
                          <label>Name</label>
                          <p>{formData.name}</p>
                        </div>
                      </div>
                      <div className="info-item">
                        <FaEnvelope />
                        <div>
                          <label>Email</label>
                          <p>{formData.email}</p>
                        </div>
                      </div>
                      <div className="info-item">
                        <FaPhone />
                        <div>
                          <label>Phone</label>
                          <p>{formData.phone}</p>
                        </div>
                      </div>
                      <div className="info-item">
                        <div>
                          <label>Department</label>
                          <p>{formData.department}</p>
                        </div>
                      </div>
                      <div className="info-item">
                        <div>
                          <label>Role</label>
                          <p>{formData.role}</p>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <form onSubmit={handleSubmit} className="edit-form">
                      <div className="form-group">
                        <label>Name</label>
                        <input
                          type="text"
                          name="name"
                          value={formData.name}
                          onChange={handleInputChange}
                        />
                      </div>
                      <div className="form-group">
                        <label>Email</label>
                        <input
                          type="email"
                          name="email"
                          value={formData.email}
                          onChange={handleInputChange}
                        />
                      </div>
                      <div className="form-group">
                        <label>Phone</label>
                        <input
                          type="tel"
                          name="phone"
                          value={formData.phone}
                          onChange={handleInputChange}
                        />
                      </div>
                      <div className="form-group">
                        <label>Department</label>
                        <input
                          type="text"
                          name="department"
                          value={formData.department}
                          onChange={handleInputChange}
                        />
                      </div>
                      <div className="form-actions">
                        <button type="submit" className="save-btn">Save Changes</button>
                        <button 
                          type="button" 
                          className="cancel-btn"
                          onClick={() => setIsEditing(false)}
                        >
                          Cancel
                        </button>
                      </div>
                    </form>
                  )}
                </div>
                <div className="password-section">
                  <button 
                    className="change-password-btn"
                    onClick={() => setShowPasswordForm(true)}
                  >
                    <FaLock /> Change Password
                  </button>
                  {showPasswordForm && (
                    <div className="password-form-overlay">
                      <div className="password-form-container">
                        <h3>Change Password</h3>
                        <form onSubmit={handlePasswordSubmit}>
                          <div className="form-group">
                            <label>Current Password</label>
                            <input
                              type="password"
                              name="currentPassword"
                              value={passwordData.currentPassword}
                              onChange={handlePasswordChange}
                              required
                            />
                          </div>
                          <div className="form-group">
                            <label>New Password</label>
                            <input
                              type="password"
                              name="newPassword"
                              value={passwordData.newPassword}
                              onChange={handlePasswordChange}
                              required
                            />
                          </div>
                          <div className="form-group">
                            <label>Confirm New Password</label>
                            <input
                              type="password"
                              name="confirmPassword"
                              value={passwordData.confirmPassword}
                              onChange={handlePasswordChange}
                              required
                            />
                          </div>
                          <div className="form-actions">
                            <button type="submit" className="save-btn">Update Password</button>
                            <button 
                              type="button" 
                              className="cancel-btn"
                              onClick={() => setShowPasswordForm(false)}
                            >
                              Cancel
                            </button>
                          </div>
                        </form>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProfilePage; 