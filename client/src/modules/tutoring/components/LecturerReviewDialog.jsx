import React, { useEffect, useMemo, useState } from 'react';
import { FaTimes } from 'react-icons/fa';
import '../styles/LecturerReviewDialog.css';
import { userApi } from '../../../services/api';

const LecturerReviewDialog = ({ video, onClose, onRequestReview }) => {
  const [selectedLecturer, setSelectedLecturer] = useState('');
  const [message, setMessage] = useState('');
  const [lecturers, setLecturers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchLecturers = async () => {
      setLoading(true);
      setError('');
      try {
        const res = await userApi.listLecturers();
        const list = res?.data?.lecturers || [];
        const mapped = list.map(l => ({ id: String(l.lecturerId || l._id || ''), name: String(l.name || l.email || l.lecturerId || 'Unknown') }));
        setLecturers(mapped.filter(l => l.id));
      } catch (e) {
        setError('Failed to load lecturers');
        setLecturers([]);
      } finally {
        setLoading(false);
      }
    };
    fetchLecturers();
  }, []);

  const handleSubmit = (e) => {
    e.preventDefault();
    onRequestReview({
      videoId: video.id,
      lecturerId: selectedLecturer,
      message
    });
  };

  const filteredLecturers = useMemo(() => lecturers, [lecturers]);

  return (
    <div className="tutoring-review-dialog">
      <div className="tutoring-review-content">
        <div className="tutoring-review-header">
          <h2>Request Lecturer Review</h2>
          <button className="tutoring-review-close" onClick={onClose}>
            <FaTimes />
          </button>
        </div>

        <div className="tutoring-review-video-info">
          <h3>{video.title}</h3>
          <div className="tutoring-review-video-meta">
            <span>Module: {video.module}</span>
            <span>Status: {video.status}</span>
          </div>
        </div>

        <form className="tutoring-review-form" onSubmit={handleSubmit}>
          <div className="tutoring-review-field">
            <label htmlFor="lecturer">Select Lecturer</label>
            <select
              id="lecturer"
              value={selectedLecturer}
              onChange={(e) => setSelectedLecturer(e.target.value)}
              required
            >
              <option value="">Select a lecturer</option>
              {filteredLecturers.map(lecturer => (
                <option key={lecturer.id} value={lecturer.id}>
                  {lecturer.name}
                </option>
              ))}
            </select>
            {loading && <small>Loading lecturers...</small>}
            {error && <small style={{ color: '#b91c1c' }}>{error}</small>}
          </div>

          <div className="tutoring-review-field">
            <label htmlFor="message">Message (Optional)</label>
            <textarea
              id="message"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Add any specific points you'd like the lecturer to review..."
            />
          </div>

          <div className="tutoring-review-actions">
            <button type="button" className="tutoring-review-cancel" onClick={onClose}>
              Cancel
            </button>
            <button type="submit" className="tutoring-review-submit">
              Request Review
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default LecturerReviewDialog; 