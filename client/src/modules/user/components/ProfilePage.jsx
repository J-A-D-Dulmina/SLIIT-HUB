import React, { useState, useEffect } from 'react';
import { FaUser, FaEnvelope, FaPhone, FaEdit, FaLock, FaChevronLeft, FaChevronRight, FaGraduationCap, FaIdCard } from 'react-icons/fa';
import '../styles/ProfilePage.css';
import SideMenu from '../../../shared/components/SideMenu';
import TopBar from '../../../shared/components/TopBar';
// Removed hardcoded profile image; will use backend URL or placeholder
import axios from 'axios';

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
    year: '',
    semester: '',
    module: '',
    userType: '',
    studentId: '',
    lecturerId: '',
    profileImage: ''
  });
  const [degrees, setDegrees] = useState([]);

  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });

  const [updateMessage, setUpdateMessage] = useState('');
  const [updateError, setUpdateError] = useState('');

  useEffect(() => {
    axios.get('/api/admin/degrees')
      .then(res => setDegrees(res.data))
      .catch(() => setDegrees([]));
  }, []);

  useEffect(() => {
    // Fetch user data from backend
    axios.get('http://localhost:5000/api/protected', { withCredentials: true })
      .then(res => {
        setFormData(prev => ({
          ...prev,
          name: res.data.user.name || '',
          email: res.data.user.email || '',
          phone: res.data.user.mobile || '',
          degree: res.data.user.degree || '',
          year: res.data.user.year || '',
          semester: res.data.user.semester || '',
          module: res.data.user.module || '',
          userType: res.data.user.userType || '',
          studentId: res.data.user.studentId || '',
          lecturerId: res.data.user.lecturerId || '',
          profileImage: res.data.user.profileImageUrl ? `http://localhost:5000/${res.data.user.profileImageUrl}` : prev.profileImage
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

  // Dynamic year/semester/module options
  const selectedDegree = degrees.find(d => d._id === formData.degree);
  const years = selectedDegree ? selectedDegree.years : [];
  const selectedYear = years.find(y => String(y.yearNumber) === String(formData.year));
  const semesters = selectedYear ? selectedYear.semesters : [];
  const selectedSemester = semesters.find(s => String(s.semesterNumber) === String(formData.semester));
  const modules = selectedSemester ? selectedSemester.modules : [];

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
      const updateData = {};
      if (formData.name && formData.name.trim()) updateData.name = formData.name.trim();
      if (formData.phone && formData.phone.trim()) updateData.mobile = formData.phone.trim();
      
      // Degree editing removed per requirements
      
      const res = await axios.put('http://localhost:5000/api/profile', updateData, {
        withCredentials: true
      });
      
      setUpdateMessage('Profile updated successfully!');
      // Update the form data with the response
      setFormData(prev => ({
        ...prev,
        name: res.data.user.name || prev.name,
        email: res.data.user.email || prev.email,
        phone: res.data.user.mobile || prev.phone,
        degree: res.data.user.degree || prev.degree
      }));
      setIsEditing(false);
      // Clear message after 3 seconds
      setTimeout(() => setUpdateMessage(''), 3000);
    } catch (err) {
      setUpdateError(err.response?.data?.message || err.response?.data?.error || 'Server error. Please try again.');
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
                    {formData.profileImage ? (
                      <img 
                        src={formData.profileImage} 
                        alt="Profile" 
                        className="profile-image"
                      />
                    ) : (
                      <div className="profile-image placeholder">
                        <FaUser />
                      </div>
                    )}
                    {isEditing && (
                      <label className="change-image-btn">
                        Change Photo
                        <input
                          type="file"
                          accept="image/*"
                          style={{ display: 'none' }}
                          onChange={async (e) => {
                            const file = e.target.files?.[0];
                            if (!file) return;
                            const form = new FormData();
                            form.append('image', file);
                            try {
                              const res = await axios.post('http://localhost:5000/api/profile/image', form, { withCredentials: true });
                              const newUrl = `http://localhost:5000${res.data.url}`;
                              setFormData(prev => ({ ...prev, profileImage: newUrl }));
                              try {
                                localStorage.setItem('profileImageUrl', newUrl);
                                window.dispatchEvent(new CustomEvent('avatar-updated', { detail: newUrl }));
                              } catch {}
                            } catch (err) {
                              alert('Failed to upload image');
                            }
                          }}
                        />
                      </label>
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
                      {formData.userType === 'student' && (
                        <div className="info-item">
                          <FaGraduationCap />
                          <div>
                            <label>Degree:</label>
                            <p>{selectedDegree ? selectedDegree.name : (formData.degree || 'N/A')}</p>
                          </div>
                        </div>
                      )}
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
                      {/* Degree removed from edit as requested */}
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