import React, { useEffect, useState } from 'react';
import '../styles/AdminDashboardHome.css';
import axios from 'axios';

const initialStats = [
  { label: 'Students', value: 0 },
  { label: 'Lecturers', value: 0 },
  { label: 'Videos', value: 0 },
  { label: 'Degrees', value: 0 },
  { label: 'Admins', value: 0 },
];

const initialAnnouncements = [];

const recentActivity = [
  { id: 1, text: 'Added new video: "AI for Beginners"' },
  { id: 2, text: 'Lecturer Dr. Jane Wilson updated module "Networks"' },
  { id: 3, text: 'Student Alice Smith registered' },
];

const AdminDashboardHome = () => {
  const [announcements, setAnnouncements] = useState(initialAnnouncements);
  const [newAnnouncement, setNewAnnouncement] = useState('');
  const [stats, setStats] = useState(initialStats);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const fetchStats = async () => {
    try {
      setLoading(true);
      setError('');
      const res = await axios.get('http://localhost:5000/api/admin/stats', { withCredentials: true });
      const { students, lecturers, videos, degrees, admins } = res.data || {};
      setStats([
        { label: 'Students', value: students || 0 },
        { label: 'Lecturers', value: lecturers || 0 },
        { label: 'Videos', value: videos || 0 },
        { label: 'Degrees', value: degrees || 0 },
        { label: 'Admins', value: admins || 0 },
      ]);
    } catch (e) {
      setError(e.response?.data?.message || 'Failed to load stats');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
    // Load announcements
    axios.get('http://localhost:5000/api/announcements')
      .then(res => setAnnouncements((res.data?.announcements || []).map(a => ({ id: a.id, text: a.text, date: new Date(a.date).toISOString().slice(0,10) }))))
      .catch(() => setAnnouncements([]));
  }, []);

  const handleAddAnnouncement = async (e) => {
    e.preventDefault();
    if (!newAnnouncement.trim()) return;
    try {
      const res = await axios.post('http://localhost:5000/api/announcements', { text: newAnnouncement.trim() }, { withCredentials: true });
      setAnnouncements(prev => [
        { id: res.data.id, text: res.data.text, date: new Date(res.data.date).toISOString().slice(0,10) },
        ...prev
      ]);
      setNewAnnouncement('');
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to add announcement');
    }
  };

  return (
    <div className="admin-dashboard-home">
      <h2>Welcome, Admin</h2>
      <div className="admin-dashboard-left">
        <div className="admin-stats-grid">
          {error && <div className="error" style={{ gridColumn: '1 / -1' }}>{error}</div>}
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