import React, { useState, useEffect } from 'react';
import { FaUser, FaEnvelope, FaPhone, FaEdit, FaLock, FaChevronLeft, FaChevronRight, FaGraduationCap, FaIdCard } from 'react-icons/fa';
import '../styles/ProfilePage.css';
import SideMenu from '../../../shared/components/SideMenu';
import TopBar from '../../../shared/components/TopBar';
import profileImage from '../../../assets/main_deshan-img.png';

const ProfilePage = () => {
  const [isEditing, setIsEditing] = useState(false);
  const [showPasswordForm, setShowPasswordForm] = useState(false);
  const [collapsed, setCollapsed] = useState(false);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [loading, setLoading] = useState(true);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    degree: '',
    userType: '',
    studentId: '',
    lecturerId: '',
    profileImage: profileImage
  });

  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });

  const [updateMessage, setUpdateMessage] = useState('');
  const [updateError, setUpdateError] = useState('');

  useEffect(() => {
    // Fetch user data from backend
    fetch('/api/protected', { credentials: 'include' })
      .then(res => res.ok ? res.json() : Promise.reject(res))
      .then(data => {
        setFormData(prev => ({
          ...prev,
          name: data.user.name || '',
          email: data.user.email || '',
          phone: data.user.mobile || '',
          degree: data.user.degree || '',
          userType: data.user.userType || '',
          studentId: data.user.studentId || '',
          lecturerId: data.user.lecturerId || ''
        }));
        setLoading(false);
      })
      .catch(() => {
        setLoading(false);
      });
  }, []);

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

  const handleSubmit = async (e) => {
    e.preventDefault();
    setUpdateMessage('');
    setUpdateError('');
    
    try {
      const updateData = {
        name: formData.name,
        mobile: formData.phone
      };
      
      // Only include degree for students
      if (formData.userType === 'student' && formData.degree) {
        updateData.degree = formData.degree;
      }
      
      const res = await fetch('/api/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(updateData)
      });
      
      const data = await res.json();
      
      if (res.ok) {
        setUpdateMessage('Profile updated successfully!');
        // Update the form data with the response
        setFormData(prev => ({
          ...prev,
          name: data.user.name || prev.name,
          email: data.user.email || prev.email,
          phone: data.user.mobile || prev.phone,
          degree: data.user.degree || prev.degree
        }));
    setIsEditing(false);
        // Clear message after 3 seconds
        setTimeout(() => setUpdateMessage(''), 3000);
      } else {
        setUpdateError(data.message || 'Failed to update profile');
      }
    } catch (err) {
      setUpdateError('Server error. Please try again.');
    }
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

  if (loading) {
    return (
      <div className="app-container">
        <SideMenu collapsed={collapsed} setCollapsed={setCollapsed} />
        <div className="main-content">
          <div className="loading">Loading profile...</div>
        </div>
      </div>
    );
  }

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
        <main className="profile-page">
              <div className="profile-container">
                <div className="profile-header">
                  <h2>Profile Information</h2>
                </div>
                
                {updateMessage && (
                  <div className="success-message">{updateMessage}</div>
                )}
                
                {updateError && (
                  <div className="error-message">{updateError}</div>
                )}
                
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
                          <label>Name:</label>
                          <p>{formData.name}</p>
                        </div>
                      </div>
                      <div className="info-item">
                        <FaEnvelope />
                        <div>
                          <label>Email:</label>
                          <p>{formData.email}</p>
                        </div>
                      </div>
                      <div className="info-item">
                        <FaPhone />
                        <div>
                          <label>Phone:</label>
                          <p>{formData.phone}</p>
                        </div>
                      </div>
                      <div className="info-item">
                        <FaGraduationCap />
                        <div>
                          <label>Degree:</label>
                          <p>{formData.degree}</p>
                        </div>
                      </div>
                      <div className="info-item">
                        <FaIdCard />
                        <div>
                          <label>{formData.userType === 'student' ? 'Student ID:' : 'Lecturer ID:'}</label>
                          <p>{formData.userType === 'student' ? formData.studentId : formData.lecturerId}</p>
                        </div>
                      </div>
                      <div className="info-item">
                        <div>
                          <label>Role:</label>
                          <p>{formData.userType === 'student' ? 'Student' : 'Lecturer'}</p>
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
                        <label>Degree</label>
                        <select
                          name="degree"
                          value={formData.degree}
                          onChange={handleInputChange}
                        >
                          <option value="">Select your degree</option>
                          <option value="BSc (Hons) in Information Technology">BSc (Hons) in Information Technology</option>
                          <option value="BSc (Hons) in Computer Science">BSc (Hons) in Computer Science</option>
                          <option value="BSc (Hons) in Software Engineering">BSc (Hons) in Software Engineering</option>
                          <option value="BSc (Hons) in Data Science">BSc (Hons) in Data Science</option>
                          <option value="BSc (Hons) in Cyber Security">BSc (Hons) in Cyber Security</option>
                          <option value="BSc (Hons) in Business Information Systems">BSc (Hons) in Business Information Systems</option>
                        </select>
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
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <button 
                    className="change-password-btn"
                    onClick={() => setShowPasswordForm(true)}
                  >
                    <FaLock /> Change Password
                  </button>
                    {!isEditing && (
                      <button 
                        className="main-edit-btn"
                        onClick={() => setIsEditing(true)}
                      >
                        <FaEdit /> Edit Profile
                      </button>
                    )}
                  </div>
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
        </main>
      </div>
    </div>
  );
};

export default ProfilePage; 