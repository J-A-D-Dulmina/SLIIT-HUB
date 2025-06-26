import React, { useState } from 'react';
import '../styles/AdminDashboardHome.css';

const stats = [
  { label: 'Students', value: 1200 },
  { label: 'Lecturers', value: 35 },
  { label: 'Videos', value: 210 },
  { label: 'Degrees', value: 6 },
  { label: 'Admins', value: 3 },
];

const initialAnnouncements = [
  { id: 1, text: 'Exam Timetable Released', date: '2024-06-01' },
  { id: 2, text: 'System Maintenance on June 5th', date: '2024-05-28' },
];

const recentActivity = [
  { id: 1, text: 'Added new video: "AI for Beginners"' },
  { id: 2, text: 'Lecturer Dr. Jane Wilson updated module "Networks"' },
  { id: 3, text: 'Student Alice Smith registered' },
];

const AdminDashboardHome = () => {
  const [announcements, setAnnouncements] = useState(initialAnnouncements);
  const [newAnnouncement, setNewAnnouncement] = useState('');

  const handleAddAnnouncement = (e) => {
    e.preventDefault();
    if (newAnnouncement.trim()) {
      setAnnouncements([
        { id: Date.now(), text: newAnnouncement, date: new Date().toISOString().slice(0, 10) },
        ...announcements,
      ]);
      setNewAnnouncement('');
    }
  };

  return (
    <div className="admin-dashboard-home">
      <h2>Welcome, Admin</h2>
      <div className="admin-dashboard-left">
        <div className="admin-stats-grid">
          {stats.map(stat => (
            <div key={stat.label} className="admin-stat-card">
              <div className="admin-stat-value">{stat.value}</div>
              <div className="admin-stat-label">{stat.label}</div>
            </div>
          ))}
        </div>
        <div className="admin-announcement-section">
          <h3>Announcements</h3>
          <form className="admin-announcement-form" onSubmit={handleAddAnnouncement}>
            <input
              type="text"
              value={newAnnouncement}
              onChange={e => setNewAnnouncement(e.target.value)}
              placeholder="Add new announcement..."
              className="admin-announcement-input"
            />
            <button type="submit" className="admin-announcement-btn">Add</button>
          </form>
          <ul className="admin-announcement-list">
            {announcements.map(a => (
              <li key={a.id} className="admin-announcement-item">
                <span className="admin-announcement-text">{a.text}</span>
                <span className="admin-announcement-date">{a.date}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboardHome; 