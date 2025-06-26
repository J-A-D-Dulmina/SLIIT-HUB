import React, { useState } from 'react';
import '../styles/AdminVideosPage.css';
import { FaPencilAlt, FaTrash } from 'react-icons/fa';
import ConfirmationDialog from '../../../shared/components/ConfirmationDialog';

const initialVideos = [
  {
    id: 1,
    videoId: 'VID001',
    videoName: 'Intro to Programming',
    preview: 'https://www.w3schools.com/html/mov_bbb.mp4',
    studentName: 'Alice Smith',
    studentId: 'S001',
    degreeNumber: 'D001',
    degreeName: 'BSc in IT',
    year: '1',
    module: 'Programming',
    moduleNumber: 'M101',
    semester: '1',
    publishDate: '2024-06-01',
    description: 'Intro to programming basics.'
  },
  {
    id: 2,
    videoId: 'VID002',
    videoName: 'Networks Overview',
    preview: 'https://www.w3schools.com/html/movie.mp4',
    studentName: 'Bob Lee',
    studentId: 'S002',
    degreeNumber: 'D002',
    degreeName: 'BSc in Software Engineering',
    year: '2',
    module: 'Networks',
    moduleNumber: 'M102',
    semester: '2',
    publishDate: '2024-06-02',
    description: 'Understanding computer networks.'
  }
];

const emptyVideo = {
  videoId: '',
  videoName: '',
  preview: '',
  studentName: '',
  studentId: '',
  degreeNumber: '',
  degreeName: '',
  year: '',
  module: '',
  moduleNumber: '',
  semester: '',
  publishDate: '',
  description: ''
};

const AdminVideosPage = () => {
  const [videos, setVideos] = useState(initialVideos);
  const [showModal, setShowModal] = useState(false);
  const [modalMode, setModalMode] = useState('add');
  const [selectedVideo, setSelectedVideo] = useState(null);
  const [videoForm, setVideoForm] = useState(emptyVideo);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [videoToDelete, setVideoToDelete] = useState(null);
  const [search, setSearch] = useState('');
  const [filterDegree, setFilterDegree] = useState('');
  const [filterModule, setFilterModule] = useState('');
  const [filterSemester, setFilterSemester] = useState('');
  const [filterYear, setFilterYear] = useState('');

  // Modal open/close helpers
  const openAddModal = () => {
    setModalMode('add');
    setVideoForm(emptyVideo);
    setShowModal(true);
  };
  const openEditModal = (video) => {
    setModalMode('edit');
    setVideoForm({ ...video });
    setSelectedVideo(video);
    setShowModal(true);
  };
  const closeModal = () => {
    setShowModal(false);
    setSelectedVideo(null);
    setVideoForm(emptyVideo);
  };

  // Form changes
  const handleVideoFormChange = (e) => {
    const { name, value } = e.target;
    setVideoForm({ ...videoForm, [name]: value });
  };

  const handleVideoFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      const url = URL.createObjectURL(file);
      setVideoForm({ ...videoForm, preview: url });
    }
  };

  const handleDeleteVideoFile = () => {
    setVideoForm({ ...videoForm, preview: '' });
  };

  // Add/Edit Video
  const handleVideoFormSubmit = (e) => {
    e.preventDefault();
    if (!videoForm.videoId.trim() || !videoForm.videoName.trim() || !videoForm.preview.trim() || !videoForm.studentName.trim() || !videoForm.studentId.trim() || !videoForm.module.trim() || !videoForm.moduleNumber.trim() || !videoForm.degreeNumber.trim() || !videoForm.degreeName.trim() || !videoForm.semester.trim() || !videoForm.publishDate.trim() || !videoForm.description.trim()) return;
    if (modalMode === 'add') {
      setVideos([
        ...videos,
        { ...videoForm, id: Date.now() },
      ]);
    } else if (modalMode === 'edit' && selectedVideo) {
      setVideos(videos.map(v => v.id === selectedVideo.id ? { ...videoForm, id: v.id } : v));
    }
    closeModal();
  };

  // Delete Video (with confirmation)
  const handleDeleteVideo = (video) => {
    setVideoToDelete(video);
    setShowDeleteDialog(true);
  };
  const confirmDeleteVideo = () => {
    setVideos(videos.filter(v => v.id !== videoToDelete.id));
    setShowDeleteDialog(false);
    setVideoToDelete(null);
  };

  // Table row click (edit modal)
  const handleRowClick = (video) => {
    openEditModal(video);
  };

  return (
    <div className="videos-admin-page full-width">
      <h2>Videos Management</h2>
      <div style={{ display: 'flex', justifyContent: 'flex-start', alignItems: 'center', gap: 16, marginBottom: 16 }}>
        <input
          className="videos-search-bar"
          type="text"
          placeholder="Search videos..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          style={{ minWidth: 320, maxWidth: 540 }}
        />
        <select value={filterDegree} onChange={e => setFilterDegree(e.target.value)} className="videos-filter-select">
          <option value="">All Degrees</option>
          {[...new Set(videos.map(v => v.degreeName))].map(d => (
            <option key={d} value={d}>{d}</option>
          ))}
        </select>
        <select value={filterYear} onChange={e => setFilterYear(e.target.value)} className="videos-filter-select">
          <option value="">All Years</option>
          {[...new Set(videos.map(v => v.year))].map(y => (
            <option key={y} value={y}>{y}</option>
          ))}
        </select>
        <select value={filterSemester} onChange={e => setFilterSemester(e.target.value)} className="videos-filter-select">
          <option value="">All Semesters</option>
          {[...new Set(videos.map(v => v.semester))].map(s => (
            <option key={s} value={s}>{s}</option>
          ))}
        </select>
        <select value={filterModule} onChange={e => setFilterModule(e.target.value)} className="videos-filter-select">
          <option value="">All Modules</option>
          {[...new Set(videos.map(v => v.module))].map(m => (
            <option key={m} value={m}>{m}</option>
          ))}
        </select>
            </div>
      <div className="videos-table-wrapper">
        <table className="videos-table styled">
          <thead>
            <tr>
              <th>Video ID</th>
              <th>Video Name</th>
              <th>Preview</th>
              <th>Student Name</th>
              <th>Student ID</th>
              <th>Degree Number</th>
              <th>Degree Name</th>
              <th>Year</th>
              <th>Module</th>
              <th>Semester</th>
              <th>Module Number</th>
              <th>Publish Date</th>
              <th>Description</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {videos.filter(video => {
              const q = search.toLowerCase();
              const matchesSearch = (
                video.videoId.toLowerCase().includes(q) ||
                video.videoName.toLowerCase().includes(q) ||
                video.studentName.toLowerCase().includes(q) ||
                video.studentId.toLowerCase().includes(q) ||
                video.degreeNumber.toLowerCase().includes(q) ||
                video.degreeName.toLowerCase().includes(q) ||
                video.year.toLowerCase().includes(q) ||
                video.semester.toLowerCase().includes(q) ||
                video.module.toLowerCase().includes(q) ||
                video.moduleNumber.toLowerCase().includes(q) ||
                video.publishDate.toLowerCase().includes(q) ||
                video.description.toLowerCase().includes(q)
              );
              const matchesDegree = !filterDegree || video.degreeName === filterDegree;
              const matchesYear = !filterYear || video.year === filterYear;
              const matchesModule = !filterModule || video.module === filterModule;
              const matchesSemester = !filterSemester || video.semester === filterSemester;
              return matchesSearch && matchesDegree && matchesYear && matchesModule && matchesSemester;
            }).map(video => (
              <tr key={video.id} onClick={e => { if (e.target.tagName !== 'BUTTON') handleRowClick(video); }} className="videos-row">
                <td>{video.videoId}</td>
                <td>{video.videoName}</td>
                <td>
                  {video.preview ? (
                    <video src={video.preview} width={80} height={48} controls style={{ borderRadius: 6, background: '#eee' }}>
                      Your browser does not support the video tag.
                    </video>
                  ) : (
                    <span style={{ color: '#aaa' }}>No Preview</span>
                  )}
                </td>
                <td>{video.studentName}</td>
                <td>{video.studentId}</td>
                <td>{video.degreeNumber}</td>
                <td>{video.degreeName}</td>
                <td>{video.year}</td>
                <td>{video.module}</td>
                <td>{video.semester}</td>
                <td>{video.moduleNumber}</td>
                <td>{video.publishDate}</td>
                <td>{video.description}</td>
                <td style={{textAlign: 'right'}}>
                  <button type="button" className="videos-edit-btn" onClick={e => { e.stopPropagation(); openEditModal(video); }} title="Edit">
                    <FaPencilAlt />
                  </button>
                  <button type="button" className="videos-delete-btn" onClick={e => { e.stopPropagation(); handleDeleteVideo(video); }} title="Delete">
                    <FaTrash />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {/* Modal for Add/Edit Video */}
      {showModal && (
        <div className="modal-overlay">
          <div className="modal-content wide">
            <button className="modal-close" onClick={closeModal}>&times;</button>
            <h3>{modalMode === 'add' ? 'Add Video' : 'Edit Video'}</h3>
            <form className="modal-form" onSubmit={handleVideoFormSubmit}>
              <label>Video ID
                <input name="videoId" value={videoForm.videoId} onChange={handleVideoFormChange} required />
              </label>
              <label>Video Name
                <input name="videoName" value={videoForm.videoName} onChange={handleVideoFormChange} required />
              </label>
              <div style={{ marginBottom: 16 }}>
                {videoForm.preview ? (
                  <div style={{ marginBottom: 8 }}>
                    <video src={videoForm.preview} width={220} height={120} controls style={{ borderRadius: 8, background: '#eee' }}>
                      Your browser does not support the video tag.
                    </video>
                    <button type="button" onClick={handleDeleteVideoFile} style={{ marginLeft: 12, color: '#ef4444', background: 'none', border: 'none', cursor: 'pointer', fontWeight: 600 }}>Delete Video</button>
                  </div>
                ) : null}
                <label style={{ display: 'block', marginBottom: 4 }}>
                  <span style={{ fontWeight: 500 }}>Upload Video</span>
                  <input type="file" accept="video/*" onChange={handleVideoFileChange} style={{ display: 'block', marginTop: 4 }} />
                </label>
              </div>
              <label>Video URL
                <input name="preview" value={videoForm.preview} onChange={handleVideoFormChange} required placeholder="Paste video URL here or upload above" />
              </label>
              <label>Description
                <textarea name="description" value={videoForm.description} onChange={handleVideoFormChange} required rows={3} />
              </label>
              <label>Student Name
                <input name="studentName" value={videoForm.studentName} onChange={handleVideoFormChange} required />
              </label>
              <label>Student ID
                <input name="studentId" value={videoForm.studentId} onChange={handleVideoFormChange} required />
              </label>
              <label>Degree Number
                <input name="degreeNumber" value={videoForm.degreeNumber} onChange={handleVideoFormChange} required />
              </label>
              <label>Degree Name
                <input name="degreeName" value={videoForm.degreeName} onChange={handleVideoFormChange} required />
              </label>
              <label>Year
                <input name="year" value={videoForm.year} onChange={handleVideoFormChange} required />
              </label>
              <label>Module
                <input name="module" value={videoForm.module} onChange={handleVideoFormChange} required />
              </label>
              <label>Semester
                <input name="semester" value={videoForm.semester} onChange={handleVideoFormChange} required />
              </label>
              <label>Module Number
                <input name="moduleNumber" value={videoForm.moduleNumber} onChange={handleVideoFormChange} required />
              </label>
              <label>Publish Date
                <input name="publishDate" type="date" value={videoForm.publishDate} onChange={handleVideoFormChange} required />
              </label>
              <button type="submit" className="videos-save-btn" style={{ marginTop: 16 }}>{modalMode === 'add' ? 'Add' : 'Update'}</button>
            </form>
          </div>
        </div>
      )}
      {/* Delete Confirmation Dialog */}
      <ConfirmationDialog
        isOpen={showDeleteDialog}
        onClose={() => setShowDeleteDialog(false)}
        onConfirm={confirmDeleteVideo}
        title="Delete Video"
        message={`Are you sure you want to delete this video? This cannot be undone.`}
        confirmText="Delete"
        cancelText="Cancel"
        type="danger"
      />
    </div>
  );
};

export default AdminVideosPage; 