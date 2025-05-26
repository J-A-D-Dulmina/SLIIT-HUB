import React, { useState } from 'react';
import { FaTimes } from 'react-icons/fa';
import '../styles/LecturerReviewDialog.css';

// Dummy data for lecturers
const LECTURERS = [
  { id: 1, name: 'Dr. John Smith', module: 'IT1010' },
  { id: 2, name: 'Prof. Sarah Johnson', module: 'IT1010' },
  { id: 3, name: 'Dr. Michael Brown', module: 'IT1020' },
  { id: 4, name: 'Prof. Emily Davis', module: 'IT1020' }
];

const LecturerReviewDialog = ({ video, onClose, onRequestReview }) => {
  const [selectedLecturer, setSelectedLecturer] = useState('');
  const [message, setMessage] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    onRequestReview({
      videoId: video.id,
      lecturerId: selectedLecturer,
      message
    });
  };

  const filteredLecturers = LECTURERS.filter(lecturer => lecturer.module === video.module);

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