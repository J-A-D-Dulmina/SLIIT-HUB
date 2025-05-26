import React, { useState } from 'react';
import { FaTimes } from 'react-icons/fa';
import '../../../styles/VideoEditModal.css';

// Dummy data for degrees and years
const DEGREES = [
  { id: 'BIT', name: 'Bachelor of Information Technology' },
  { id: 'BCS', name: 'Bachelor of Computer Science' },
  { id: 'BSE', name: 'Bachelor of Software Engineering' }
];

const YEARS = [
  { id: '1', name: 'Year 1' },
  { id: '2', name: 'Year 2' },
  { id: '3', name: 'Year 3' },
  { id: '4', name: 'Year 4' }
];

const MODULES = {
  '1': [
    { id: 'IT1010', name: 'Introduction to Programming' },
    { id: 'IT1020', name: 'Data Structures' },
    { id: 'IT1030', name: 'Database Systems' }
  ],
  '2': [
    { id: 'IT2010', name: 'Web Development' },
    { id: 'IT2020', name: 'Software Engineering' },
    { id: 'IT2030', name: 'Computer Networks' }
  ],
  '3': [
    { id: 'IT3010', name: 'Machine Learning' },
    { id: 'IT3020', name: 'Cloud Computing' },
    { id: 'IT3030', name: 'Mobile Development' }
  ],
  '4': [
    { id: 'IT4010', name: 'Artificial Intelligence' },
    { id: 'IT4020', name: 'Big Data' },
    { id: 'IT4030', name: 'Project Management' }
  ]
};

const VideoEditModal = ({ video, onClose, onSave }) => {
  const [formData, setFormData] = useState({
    title: video?.title || '',
    degree: video?.degree || '',
    year: video?.year || '',
    module: video?.module || '',
    status: video?.status || 'unpublished'
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave(formData);
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value,
      // Reset module when year changes
      ...(name === 'year' && { module: '' })
    }));
  };

  return (
    <div className="modal-overlay">
      <div className="modal-content">
        <div className="modal-header">
          <h2>{video ? 'Edit Video' : 'Upload New Video'}</h2>
          <button className="close-btn" onClick={onClose}>
            <FaTimes />
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="title">Title</label>
            <input
              type="text"
              id="title"
              name="title"
              value={formData.title}
              onChange={handleChange}
              required
              placeholder="Enter video title"
            />
          </div>

          <div className="form-row">
            <div className="form-group">
              <label htmlFor="degree">Degree</label>
              <select
                id="degree"
                name="degree"
                value={formData.degree}
                onChange={handleChange}
                required
              >
                <option value="">Select Degree</option>
                {DEGREES.map(degree => (
                  <option key={degree.id} value={degree.id}>
                    {degree.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label htmlFor="year">Year</label>
              <select
                id="year"
                name="year"
                value={formData.year}
                onChange={handleChange}
                required
              >
                <option value="">Select Year</option>
                {YEARS.map(year => (
                  <option key={year.id} value={year.id}>
                    {year.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="form-group">
            <label htmlFor="module">Module</label>
            <select
              id="module"
              name="module"
              value={formData.module}
              onChange={handleChange}
              required
              disabled={!formData.year}
            >
              <option value="">Select Module</option>
              {formData.year && MODULES[formData.year].map(module => (
                <option key={module.id} value={module.id}>
                  {module.id} - {module.name}
                </option>
              ))}
            </select>
          </div>

          {!video && (
            <div className="form-group">
              <label htmlFor="videoFile">Video File</label>
              <input
                type="file"
                id="videoFile"
                name="videoFile"
                accept="video/*"
                required
              />
            </div>
          )}

          <div className="form-actions">
            <button type="button" className="cancel-btn" onClick={onClose}>
              Cancel
            </button>
            <button type="submit" className="save-btn">
              {video ? 'Save Changes' : 'Upload Video'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default VideoEditModal; 