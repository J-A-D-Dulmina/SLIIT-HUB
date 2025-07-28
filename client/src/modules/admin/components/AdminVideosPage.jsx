import React, { useState, useEffect, useRef } from 'react';
import '../styles/AdminVideosPage.css';
import { FaPencilAlt, FaTrash, FaEye } from 'react-icons/fa';
import ConfirmationDialog from '../../../shared/components/ConfirmationDialog';
import ReactPlayer from 'react-player';
import axios from 'axios';

const emptyVideo = {
  uniqueId: '',
  title: '',
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

const viewFieldOrder = [
  'uniqueId', 'title', 'description', 'module', 'moduleName', 'degreeName', 'year', 'semester', 'videoFile', 'thumbnail', 'fileSize', 'uploadedBy', 'studentId', 'status', 'timestamps', 'uploadDate', 'aiFeatures', 'summary'
];
const fieldLabels = {
  uniqueId: 'Video ID',
  title: 'Title',
  description: 'Description',
  module: 'Module Code',
  moduleName: 'Module Name',
  degreeName: 'Degree Name',
  year: 'Year',
  semester: 'Semester',
  videoFile: 'Video',
  thumbnail: 'Thumbnail',
  fileSize: 'File Size',
  uploadedBy: 'Uploaded By',
  studentId: 'Student ID',
  status: 'Status',
  timestamps: 'Timestamps',
  uploadDate: 'Upload Date',
  aiFeatures: 'AI Features',
  summary: 'Summary',
};
function formatFileSize(size) {
  if (!size) return '';
  if (size > 1024 * 1024) return (size / (1024 * 1024)).toFixed(2) + ' MB';
  if (size > 1024) return (size / 1024).toFixed(2) + ' KB';
  return size + ' B';
}
function formatDate(date) {
  if (!date) return '';
  const d = new Date(date);
  if (isNaN(d)) return date;
  return d.toISOString().replace('T', ' ').slice(0, 19);
}

function getWebPath(dbPath) {
  if (!dbPath) return '';
  let path = dbPath.replace(/\\/g, '/');
  const idx = path.indexOf('uploads/');
  if (idx !== -1) {
    path = '/' + path.slice(idx);
  } else if (!path.startsWith('/')) {
    path = '/' + path;
  }
  return path;
}

const AdminVideosPage = () => {
  const [videos, setVideos] = useState([]);
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
  const studentNameCache = useRef({});
  const [, forceUpdate] = useState(0); // for re-render after cache update
  const [showViewModal, setShowViewModal] = useState(false);
  const [viewVideo, setViewVideo] = useState(null);
  const [degrees, setDegrees] = useState([]);
  const [yearOptions, setYearOptions] = useState([]);
  const [semesterOptions, setSemesterOptions] = useState([]);
  const [moduleOptions, setModuleOptions] = useState([]);

  // Fetch degrees for select options
  useEffect(() => {
    axios.get('/api/admin/degrees')
      .then(res => setDegrees(res.data));
  }, []);

  // Update year options when degree changes
  useEffect(() => {
    const degree = degrees.find(d => d.name === videoForm.degreeName);
    if (degree) {
      setYearOptions(degree.years.map(y => y.yearNumber));
    } else {
      setYearOptions([]);
    }
    setSemesterOptions([]);
    setModuleOptions([]);
  }, [videoForm.degreeName, degrees]);

  // Update semester options when year changes
  useEffect(() => {
    const degree = degrees.find(d => d.name === videoForm.degreeName);
    const year = degree?.years.find(y => String(y.yearNumber) === String(videoForm.year));
    if (year) {
      setSemesterOptions(year.semesters.map(s => s.semesterNumber));
    } else {
      setSemesterOptions([]);
    }
    setModuleOptions([]);
  }, [videoForm.degreeName, videoForm.year, degrees]);

  // Update module options when semester changes
  useEffect(() => {
    const degree = degrees.find(d => d.name === videoForm.degreeName);
    const year = degree?.years.find(y => String(y.yearNumber) === String(videoForm.year));
    const semester = year?.semesters.find(s => String(s.semesterNumber) === String(videoForm.semester));
    if (semester) {
      setModuleOptions(semester.modules.map(m => ({ code: m.code, name: m.name })));
    } else {
      setModuleOptions([]);
    }
  }, [videoForm.degreeName, videoForm.year, videoForm.semester, degrees]);

  // Auto-fetch student name by studentId
  useEffect(() => {
    if (videoForm.studentId && !videoForm.studentName) {
      fetch(`/api/students/by-id/${videoForm.studentId}`)
        .then(res => res.ok ? res.json() : null)
        .then(data => {
          if (data && data.name) {
            setVideoForm(vf => ({ ...vf, studentName: data.name }));
          }
        });
    }
  }, [videoForm.studentId]);

  // Fetch videos from backend on mount
  useEffect(() => {
    fetchVideos();
  }, []);

  const fetchVideos = async () => {
    try {
      const res = await axios.get('/api/admin/videos');
      setVideos(res.data);
    } catch (err) {
      // Optionally handle error
    }
  };

  // Fetch student name by studentId if not present
  const getStudentName = (studentId, fallbackName) => {
    if (!studentId) return fallbackName || 'Unknown Student';
    if (studentNameCache.current[studentId]) return studentNameCache.current[studentId];
    // Fetch and cache
    axios.get(`/api/students/by-id/${studentId}`)
      .then(res => {
        if (res.data && res.data.name) {
          studentNameCache.current[studentId] = res.data.name;
          forceUpdate(n => n + 1); // trigger re-render
        }
      })
      .catch(() => {});
    return fallbackName || 'Unknown Student';
  };

  // Modal open/close helpers
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

  const openViewModal = (video) => {
    setViewVideo(video);
    setShowViewModal(true);
  };
  const closeViewModal = () => {
    setShowViewModal(false);
    setViewVideo(null);
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
  const handleVideoFormSubmit = async (e) => {
    e.preventDefault();
    if (!videoForm.uniqueId.trim() || !videoForm.title.trim() || !videoForm.preview.trim() || !videoForm.studentName.trim() || !videoForm.studentId.trim() || !videoForm.module.trim() || !videoForm.moduleNumber.trim() || !videoForm.degreeName.trim() || !videoForm.semester.trim() || !videoForm.publishDate.trim() || !videoForm.description.trim()) return;
    if (modalMode === 'add') {
      try {
        const res = await axios.post('/api/admin/videos', videoForm);
        await fetchVideos();
      } catch (error) {
        console.error('Error adding video:', error);
      }
    } else if (modalMode === 'edit' && selectedVideo && selectedVideo._id) {
      try {
        const res = await axios.put(`/api/admin/videos/${selectedVideo._id}`, videoForm);
        await fetchVideos();
      } catch (error) {
        console.error('Error updating video:', error);
      }
    }
    closeModal();
  };

  // Delete Video (with confirmation)
  const handleDeleteVideo = (video) => {
    setVideoToDelete(video);
    setShowDeleteDialog(true);
  };
  const confirmDeleteVideo = async () => {
    if (videoToDelete && videoToDelete._id) {
      try {
        await axios.delete(`/api/admin/videos/${videoToDelete._id}`);
        await fetchVideos();
      } catch (error) {
        console.error('Error deleting video:', error);
      }
    }
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
          {[...new Set(videos.map(v => (v.degreeCode || '') + '|' + (v.degreeName || '')).filter(pair => pair && pair !== '|'))]
            .map(pair => {
              const [code, name] = pair.split('|');
              return (
                <option key={code} value={code}>{name ? `${name} (${code})` : code}</option>
              );
            })}
        </select>
        <select value={filterYear} onChange={e => setFilterYear(e.target.value)} className="videos-filter-select">
          <option value="">All Years</option>
          {[...new Set(videos.map(v => v.year).filter(Boolean))].map(y => (
            <option key={y} value={y}>{y}</option>
          ))}
        </select>
        <select value={filterSemester} onChange={e => setFilterSemester(e.target.value)} className="videos-filter-select">
          <option value="">All Semesters</option>
          {[...new Set(videos.map(v => v.semester).filter(Boolean))].map(s => (
            <option key={s} value={s}>{s}</option>
          ))}
        </select>
        <select value={filterModule} onChange={e => setFilterModule(e.target.value)} className="videos-filter-select">
          <option value="">All Modules</option>
          {[...new Set(videos.map(v => v.module).filter(Boolean))].map(m => (
            <option key={m} value={m}>{m}</option>
          ))}
        </select>
            </div>
      <div className="videos-table-wrapper">
        <table className="videos-table styled">
          <thead>
            <tr>
              <th>Video ID</th>
              <th>Title</th>
              <th>Preview</th>
              <th>Degree Name</th>
              <th>Year</th>
              <th>Semester</th>
              <th>Module Name</th>
              <th>Tags</th>
              <th>Student Name</th>
              <th>Student ID</th>
              <th>Description</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {videos.length === 0 ? (
              <tr><td colSpan={12} style={{ textAlign: 'center', color: '#888', padding: '32px 0' }}>No videos found.</td></tr>
            ) : (
              videos.filter(video => {
                const q = search.toLowerCase();
                const matchesSearch = (
                  (video.degreeName || '').toLowerCase().includes(q) ||
                  (video.year || '').toLowerCase().includes(q) ||
                  (video.semester || '').toLowerCase().includes(q) ||
                  (video.moduleName || '').toLowerCase().includes(q) ||
                  (video.uniqueId || '').toLowerCase().includes(q) ||
                  (video.title || '').toLowerCase().includes(q) ||
                  (video.studentName || getStudentName(video.studentId)).toLowerCase().includes(q) ||
                  (video.studentId || '').toLowerCase().includes(q) ||
                  (video.description || '').toLowerCase().includes(q)
                );
                const matchesDegree = !filterDegree || (video.degreeName || '') === filterDegree;
                const matchesYear = !filterYear || (video.year || '') === filterYear;
                const matchesModule = !filterModule || (video.module || '') === filterModule;
                const matchesSemester = !filterSemester || (video.semester || '') === filterSemester;
                return matchesSearch && matchesDegree && matchesYear && matchesModule && matchesSemester;
              }).map(video => (
                <tr key={video._id} className="videos-row">
                  <td>{video.uniqueId || ''}</td>
                  <td>{video.title || ''}</td>
                  <td>
                    {video.videoFile ? (
                      <video src={`http://localhost:5000/${video.videoFile}`} width={80} height={48} controls style={{ borderRadius: 6, background: '#eee' }}>
                        Your browser does not support the video tag.
                      </video>
                    ) : (
                      <span style={{ color: '#aaa' }}>No Preview</span>
                    )}
                  </td>
                  <td>{video.degreeName || ''}</td>
                  <td>{video.year || ''}</td>
                  <td>{video.semester || ''}</td>
                  <td>{video.moduleName || ''}</td>
                  <td>
                    {/* Tags: status, AI features */}
                    {video.status && (
                      <span className={`tag status-tag status-${video.status}`}>{video.status}</span>
                    )}
                    {video.aiFeatures?.summary && (
                      <span className="tag ai-tag">AI Summary</span>
                    )}
                    {video.aiFeatures?.timestamps && (
                      <span className="tag ai-tag">AI Timestamps</span>
                    )}
                    {video.aiFeatures?.lecturerRecommended && (
                      <span className="tag lecturer-tag">Lecturer Recommended</span>
                    )}
                  </td>
                  <td>{video.studentName || getStudentName(video.studentId)}</td>
                  <td>{video.studentId || ''}</td>
                  <td>{video.description || ''}</td>
                  <td style={{textAlign: 'right'}}>
                    <button type="button" className="videos-view-btn" onClick={e => { e.stopPropagation(); openViewModal(video); }} title="View">
                      <FaEye style={{ fontSize: 16, verticalAlign: 'middle' }} />
                    </button>
                    <button type="button" className="videos-edit-btn" onClick={e => { e.stopPropagation(); openEditModal(video); }} title="Edit">
                      <FaPencilAlt />
                    </button>
                    <button type="button" className="videos-delete-btn" onClick={e => { e.stopPropagation(); handleDeleteVideo(video); }} title="Delete">
                      <FaTrash />
                    </button>
                  </td>
                </tr>
              ))
            )}
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
                <input name="uniqueId" value={videoForm.uniqueId} onChange={handleVideoFormChange} required />
              </label>
              <label>Title
                <input name="title" value={videoForm.title} onChange={handleVideoFormChange} required />
              </label>
              <label>Description
                <textarea name="description" value={videoForm.description} onChange={handleVideoFormChange} required rows={3} />
              </label>
              <label>Degree
                <select name="degreeName" value={videoForm.degreeName} onChange={handleVideoFormChange} required>
                  <option value="">Select Degree</option>
                  {degrees.map(d => (
                    <option key={d.code} value={d.name}>{d.name}</option>
                  ))}
                </select>
              </label>
              <label>Year
                <select name="year" value={videoForm.year} onChange={handleVideoFormChange} required>
                  <option value="">Select Year</option>
                  {yearOptions.map(y => (
                    <option key={y} value={y}>{y}</option>
                  ))}
                </select>
              </label>
              <label>Semester
                <select name="semester" value={videoForm.semester} onChange={handleVideoFormChange} required>
                  <option value="">Select Semester</option>
                  {semesterOptions.map(s => (
                    <option key={s} value={s}>{s}</option>
                  ))}
                </select>
              </label>
              <label>Module
                <select name="module" value={videoForm.module} onChange={e => {
                  const val = e.target.value;
                  setVideoForm(vf => {
                    const mod = moduleOptions.find(m => m.code === val);
                    return { ...vf, module: mod?.code || '', moduleName: mod?.name || '' };
                  });
                }} required>
                  <option value="">Select Module</option>
                  {moduleOptions.map(m => (
                    <option key={m.code} value={m.code}>{m.name} ({m.code})</option>
                  ))}
                </select>
              </label>
              <label>Student ID
                <input name="studentId" value={videoForm.studentId} onChange={handleVideoFormChange} required />
              </label>
              <label>Student Name
                <input name="studentName" value={videoForm.studentName || ''} readOnly style={{ background: '#f3f4f6' }} />
              </label>
              <label>Status
                <select name="status" value={videoForm.status || ''} onChange={handleVideoFormChange}>
                  <option value="">Select status</option>
                  <option value="published">Published</option>
                  <option value="unpublished">Unpublished</option>
                  <option value="deleted">Deleted</option>
                </select>
              </label>
              <label>Publish Date
                <input name="publishDate" type="date" value={videoForm.publishDate} onChange={handleVideoFormChange} required />
              </label>
              {/* Video File Preview and Upload */}
              <div style={{ marginBottom: 16 }}>
                {videoForm.videoFile && (
                  <div style={{ marginBottom: 8 }}>
                    <video src={`http://localhost:5000/${videoForm.videoFile}`} width={220} height={120} controls style={{ borderRadius: 8, background: '#eee' }}>
                      Your browser does not support the video tag.
                    </video>
                  </div>
                )}
                <label style={{ display: 'block', marginBottom: 4 }}>
                  <span style={{ fontWeight: 500 }}>Upload Video</span>
                  <input type="file" accept="video/*" name="videoFile" onChange={handleVideoFileChange} style={{ display: 'block', marginTop: 4 }} />
                </label>
              </div>
              {/* Thumbnail Preview and Upload */}
              <div style={{ marginBottom: 16 }}>
                {videoForm.thumbnail && (
                  <div style={{ marginBottom: 8 }}>
                    <img src={getWebPath(videoForm.thumbnail)} alt="Thumbnail" width={120} style={{ borderRadius: 8, background: '#eee' }} />
                  </div>
                )}
                <label style={{ display: 'block', marginBottom: 4 }}>
                  <span style={{ fontWeight: 500 }}>Upload Thumbnail</span>
                  <input type="file" accept="image/*" name="thumbnail" onChange={e => setVideoForm({ ...videoForm, thumbnail: e.target.files[0] })} style={{ display: 'block', marginTop: 4 }} />
                </label>
              </div>
              {/* AI Features */}
              <div style={{ marginBottom: 16 }}>
                <label style={{ marginRight: 12 }}>
                  <input type="checkbox" name="aiSummary" checked={!!videoForm.aiFeatures?.summary} onChange={e => setVideoForm({ ...videoForm, aiFeatures: { ...videoForm.aiFeatures, summary: e.target.checked } })} /> AI Summary
                </label>
                <label style={{ marginRight: 12 }}>
                  <input type="checkbox" name="aiTimestamps" checked={!!videoForm.aiFeatures?.timestamps} onChange={e => setVideoForm({ ...videoForm, aiFeatures: { ...videoForm.aiFeatures, timestamps: e.target.checked } })} /> AI Timestamps
                </label>
                <label>
                  <input type="checkbox" name="lecturerRecommended" checked={!!videoForm.aiFeatures?.lecturerRecommended} onChange={e => setVideoForm({ ...videoForm, aiFeatures: { ...videoForm.aiFeatures, lecturerRecommended: e.target.checked } })} /> Lecturer Recommended
                </label>
              </div>
              {/* Read-only fields */}
              {videoForm.fileSize && (
                <div style={{ marginBottom: 8 }}><b>File Size:</b> {formatFileSize(videoForm.fileSize)}</div>
              )}
              {videoForm.uploadDate && (
                <div style={{ marginBottom: 8 }}><b>Upload Date:</b> {formatDate(videoForm.uploadDate)}</div>
              )}
              {videoForm.summary && (
                <div style={{ marginBottom: 8 }}><b>Summary:</b> {videoForm.summary}</div>
              )}
              {videoForm.timestamps && Array.isArray(videoForm.timestamps) && (
                <div style={{ marginBottom: 8 }}><b>Timestamps:</b>
                  <ul style={{ margin: 0, paddingLeft: 18 }}>
                    {videoForm.timestamps.map((ts, i) => (
                      <li key={i}>{ts.time_start} - {ts.description}</li>
                    ))}
                  </ul>
                </div>
              )}
              <button type="submit" className="videos-save-btn" style={{ marginTop: 16 }}>{modalMode === 'add' ? 'Add' : 'Update'}</button>
            </form>
          </div>
        </div>
      )}
      {/* View Modal */}
      {showViewModal && viewVideo && (
        <div className="modal-overlay">
          <div className="modal-content wide">
            <button className="modal-close" onClick={closeViewModal}>&times;</button>
            <h3>Video Details</h3>
            <div className="video-details-grid">
              {/* Video ID */}
              {viewVideo.uniqueId && (
                <div className="video-detail-row">
                  <span className="video-detail-label">Video ID</span>
                  <span className="video-detail-value">{viewVideo.uniqueId}</span>
                </div>
              )}
              {/* Title */}
              {viewVideo.title && (
                <div className="video-detail-row">
                  <span className="video-detail-label">Title</span>
                  <span className="video-detail-value">{viewVideo.title}</span>
                </div>
              )}
              {/* Description */}
              {viewVideo.description && (
                <div className="video-detail-row">
                  <span className="video-detail-label">Description</span>
                  <span className="video-detail-value">{viewVideo.description}</span>
                </div>
              )}
              {/* Degree */}
              {viewVideo.degreeName && (
                <div className="video-detail-row">
                  <span className="video-detail-label">Degree</span>
                  <span className="video-detail-value">{viewVideo.degreeName}</span>
                </div>
              )}
              {/* Year */}
              {viewVideo.year && (
                <div className="video-detail-row">
                  <span className="video-detail-label">Year</span>
                  <span className="video-detail-value">{viewVideo.year}</span>
                </div>
              )}
              {/* Semester */}
              {viewVideo.semester && (
                <div className="video-detail-row">
                  <span className="video-detail-label">Semester</span>
                  <span className="video-detail-value">{viewVideo.semester}</span>
                </div>
              )}
              {/* Module */}
              {(viewVideo.moduleName || viewVideo.module) && (
                <div className="video-detail-row">
                  <span className="video-detail-label">Module</span>
                  <span className="video-detail-value">{viewVideo.moduleName ? `${viewVideo.moduleName} (${viewVideo.module})` : viewVideo.module}</span>
                </div>
              )}
              {/* Student ID */}
              {viewVideo.studentId && (
                <div className="video-detail-row">
                  <span className="video-detail-label">Student ID</span>
                  <span className="video-detail-value">{viewVideo.studentId}</span>
                </div>
              )}
              {/* Student Name */}
              {(viewVideo.studentId || viewVideo.studentName) && (
                <div className="video-detail-row">
                  <span className="video-detail-label">Student Name</span>
                  <span className="video-detail-value">{getStudentName(viewVideo.studentId, viewVideo.studentName)}</span>
                </div>
              )}
              {/* Status */}
              {viewVideo.status && (
                <div className="video-detail-row">
                  <span className="video-detail-label">Status</span>
                  <span className="video-detail-value">
                    <span className={`tag status-tag status-${viewVideo.status}`}>{viewVideo.status}</span>
                  </span>
                </div>
              )}
              {/* AI Features */}
              {viewVideo.aiFeatures && typeof viewVideo.aiFeatures === 'object' && (
                <div className="video-detail-row">
                  <span className="video-detail-label">AI Features</span>
                  <span className="video-detail-value">
                    {viewVideo.aiFeatures.summary && <span className="tag ai-tag">AI Summary</span>}
                    {viewVideo.aiFeatures.timestamps && <span className="tag ai-tag">AI Timestamps</span>}
                    {viewVideo.aiFeatures.lecturerRecommended && <span className="tag lecturer-tag">Lecturer Recommended</span>}
                  </span>
                </div>
              )}
              {/* Video */}
              {viewVideo.videoFile && (
                <div className="video-detail-row">
                  <span className="video-detail-label">Video</span>
                  <span className="video-detail-value">
                    <ReactPlayer
                      key={getWebPath(viewVideo.videoFile)}
                      url={getWebPath(viewVideo.videoFile)}
                      width={320}
                      height={180}
                      controls={true}
                      config={{ file: { attributes: { controlsList: 'nodownload' } } }}
                    />
                  </span>
                </div>
              )}
              {/* Thumbnail */}
              {viewVideo.thumbnail && (
                <div className="video-detail-row">
                  <span className="video-detail-label">Thumbnail</span>
                  <span className="video-detail-value">
                    <img src={`http://localhost:5000/${viewVideo.thumbnail}`} alt="Thumbnail" style={{ maxWidth: 200, borderRadius: 8 }} />
                  </span>
                </div>
              )}
              {/* File Size */}
              {viewVideo.fileSize && (
                <div className="video-detail-row">
                  <span className="video-detail-label">File Size</span>
                  <span className="video-detail-value">{formatFileSize(viewVideo.fileSize)}</span>
                </div>
              )}
              {/* Upload Date */}
              {viewVideo.uploadDate && (
                <div className="video-detail-row">
                  <span className="video-detail-label">Upload Date</span>
                  <span className="video-detail-value">{formatDate(viewVideo.uploadDate)}</span>
                </div>
              )}
              {/* Summary */}
              {viewVideo.summary && (
                <div className="video-detail-row">
                  <span className="video-detail-label">Summary</span>
                  <span className="video-detail-value">{viewVideo.summary}</span>
                </div>
              )}
              {/* Timestamps */}
              {viewVideo.timestamps && Array.isArray(viewVideo.timestamps) && (
                <div className="video-detail-row">
                  <span className="video-detail-label">Timestamps</span>
                  <span className="video-detail-value">
                    <ul style={{ margin: 0, paddingLeft: 18 }}>
                      {viewVideo.timestamps.map((ts, i) => (
                        <li key={i}>{ts.time_start} - {ts.description}</li>
                      ))}
                    </ul>
                  </span>
                </div>
              )}
            </div>
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