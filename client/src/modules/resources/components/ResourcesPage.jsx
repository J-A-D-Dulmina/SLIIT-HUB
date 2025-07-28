import React, { useState, useEffect } from 'react';
import { FaChevronLeft, FaChevronRight, FaUpload, FaSearch, FaFilter, FaTimes, FaFile, FaFolder, FaDownload, FaShare, FaClock, FaUser, FaLink, FaCopy, FaMapMarkerAlt, FaKey } from 'react-icons/fa';
import SideMenu from '../../../shared/components/SideMenu';
import TopBar from '../../../shared/components/TopBar';
import moment from 'moment';
import '../styles/ResourcesPage.css';
import axios from 'axios';

const RESOURCE_TYPES = ['All', 'Documents', 'Presentations', 'Notes', 'Assignments', 'Others'];
const DEGREES = ['All', 'BSc (Hons) in IT', 'BSc (Hons) in Software Engineering', 'BSc (Hons) in Computer Systems Engineering', 'BSc (Hons) in Information Systems Engineering'];
const DEGREE_YEARS = ['All', 'Year 1', 'Year 2', 'Year 3', 'Year 4'];
const SEMESTERS = ['All', 'Semester 1', 'Semester 2'];
const MODULES = ['All', 'AI', 'Web Development', 'Database Systems', 'Software Engineering', 'Networks', 'Operating Systems'];

const API_BASE = 'http://localhost:5000/api/resources';
const DEGREE_API = 'http://localhost:5000/api/admin/degrees';

const ResourcesPage = () => {
  const [collapsed, setCollapsed] = useState(false);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [resources, setResources] = useState([]);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [selectedType, setSelectedType] = useState('All');
  const [selectedYear, setSelectedYear] = useState('All');
  const [selectedSemester, setSelectedSemester] = useState('All');
  const [selectedModule, setSelectedModule] = useState('All');
  const [uploadFormData, setUploadFormData] = useState({
    title: '',
    description: '',
    type: '',
    degree: '',
    year: '',
    semester: '',
    module: '',
    file: null
  });
  const [showShareModal, setShowShareModal] = useState(false);
  const [selectedResource, setSelectedResource] = useState(null);
  const [shareLink, setShareLink] = useState('');
  const [degreeOptions, setDegreeOptions] = useState([]);
  const [yearOptions, setYearOptions] = useState([]);
  const [semesterOptions, setSemesterOptions] = useState([]);
  const [moduleOptions, setModuleOptions] = useState([]);

  // Set constant uploader name
  const UPLOADER_NAME = "J A D Dulmina";

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 60000);

    // Fetch resources and degrees from backend
    fetchResources();
    fetchDegrees();
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    if (!uploadFormData.degree) {
      setYearOptions([]);
      setSemesterOptions([]);
      setModuleOptions([]);
      return;
    }
    const selectedDegree = degreeOptions.find(d => d._id === uploadFormData.degree);
    if (selectedDegree) {
      setYearOptions(selectedDegree.years || []);
      // Reset year/semester/module if degree changes
      if (!selectedDegree.years.some(y => String(y.yearNumber) === String(uploadFormData.year))) {
        setUploadFormData(prev => ({ ...prev, year: '', semester: '', module: '' }));
      }
    } else {
      setYearOptions([]);
      setSemesterOptions([]);
      setModuleOptions([]);
    }
  }, [uploadFormData.degree, degreeOptions]);

  useEffect(() => {
    if (!uploadFormData.degree || !uploadFormData.year) {
      setSemesterOptions([]);
      setModuleOptions([]);
      return;
    }
    const selectedDegree = degreeOptions.find(d => d._id === uploadFormData.degree);
    const selectedYear = selectedDegree?.years.find(y => String(y.yearNumber) === String(uploadFormData.year));
    if (selectedYear) {
      setSemesterOptions(selectedYear.semesters || []);
      if (!selectedYear.semesters.some(s => String(s.semesterNumber) === String(uploadFormData.semester))) {
        setUploadFormData(prev => ({ ...prev, semester: '', module: '' }));
      }
    } else {
      setSemesterOptions([]);
      setModuleOptions([]);
    }
  }, [uploadFormData.degree, uploadFormData.year, degreeOptions]);

  useEffect(() => {
    if (!uploadFormData.degree || !uploadFormData.year || !uploadFormData.semester) {
      setModuleOptions([]);
      return;
    }
    const selectedDegree = degreeOptions.find(d => d._id === uploadFormData.degree);
    const selectedYear = selectedDegree?.years.find(y => String(y.yearNumber) === String(uploadFormData.year));
    const selectedSemester = selectedYear?.semesters.find(s => String(s.semesterNumber) === String(uploadFormData.semester));
    if (selectedSemester) {
      setModuleOptions(selectedSemester.modules || []);
      if (!selectedSemester.modules.some(m => m.code === uploadFormData.module)) {
        setUploadFormData(prev => ({ ...prev, module: '' }));
      }
    } else {
      setModuleOptions([]);
    }
  }, [uploadFormData.degree, uploadFormData.year, uploadFormData.semester, degreeOptions]);

  const fetchResources = async () => {
    try {
      const res = await axios.get(`${API_BASE}`);
      setResources(res.data.map(r => ({
        ...r,
        id: r._id,
        shareLink: `${API_BASE}/download/${r._id}`,
        fileType: (r.fileType || '').split('/').pop(),
        fileSize: r.fileSize ? formatFileSize(r.fileSize) : '',
      })));
    } catch (err) {
      console.error('Failed to fetch resources:', err);
    }
  };

  const fetchDegrees = async () => {
    try {
      const res = await axios.get(DEGREE_API);
      setDegreeOptions(res.data);
    } catch (err) {
      console.error('Failed to fetch degrees:', err);
    }
  };

  const filteredResources = resources.filter(resource => {
    const matchesSearch = 
      resource.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      resource.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      resource.uploader.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesType = selectedType === 'All' || resource.type === selectedType;
    const matchesYear = selectedYear === 'All' || resource.year === selectedYear;
    const matchesSemester = selectedSemester === 'All' || resource.semester === selectedSemester;
    const matchesModule = selectedModule === 'All' || resource.module === selectedModule;

    return matchesSearch && matchesType && matchesYear && matchesSemester && matchesModule;
  });

  const handleUploadChange = (e) => {
    const { name, value, files } = e.target;
    setUploadFormData(prev => ({
      ...prev,
      [name]: files ? files[0] : value
    }));
  };

  const handleUploadSubmit = async (e) => {
    e.preventDefault();
    if (!uploadFormData.title.trim()) {
      alert('Please enter a title for the resource');
      return;
    }
    if (!uploadFormData.file) {
      alert('Please select a file to upload');
      return;
    }
    const formData = new FormData();
    Object.entries(uploadFormData).forEach(([key, value]) => {
      if (value) formData.append(key, value);
    });
    formData.append('uploader', UPLOADER_NAME);
    try {
      await axios.post(`${API_BASE}/upload`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      alert('Resource uploaded successfully!');
      setShowUploadModal(false);
      setUploadFormData({
        title: '',
        description: '',
        type: '',
        degree: '',
        year: '',
        semester: '',
        module: '',
        file: null
      });
      fetchResources();
    } catch (err) {
      alert('Failed to upload resource.');
      console.error(err);
    }
  };

  const handleShare = (resource) => {
    setSelectedResource(resource);
    setShareLink(resource.shareLink);
    setShowShareModal(true);
  };

  const copyShareLink = () => {
    navigator.clipboard.writeText(shareLink);
    alert('Share link copied to clipboard!');
  };

  const clearFilters = () => {
    setSelectedType('All');
    setSelectedYear('All');
    setSelectedSemester('All');
    setSelectedModule('All');
  };

  const formatFileSize = (size) => {
    if (size >= 1024 * 1024) return (size / (1024 * 1024)).toFixed(1) + ' MB';
    if (size >= 1024) return (size / 1024).toFixed(1) + ' KB';
    return size + ' B';
  };

  const getFileIcon = (fileType) => {
    switch (fileType.toLowerCase()) {
      case 'pdf':
        return <FaFile className="file-icon pdf" />;
      case 'doc':
      case 'docx':
        return <FaFile className="file-icon doc" />;
      case 'ppt':
      case 'pptx':
        return <FaFile className="file-icon ppt" />;
      case 'zip':
      case 'rar':
        return <FaFile className="file-icon zip" />;
      default:
        return <FaFile className="file-icon" />;
    }
  };

  const formatDateTime = (date) => {
    return moment(date).format('MMMM D, YYYY [at] h:mm A');
  };

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

        <main className="resources-page">
          <div className="page-header">
            <h1>Academic Resources</h1>
            <button className="upload-btn" onClick={() => setShowUploadModal(true)}>
              <FaUpload /> Upload Resource
            </button>
          </div>

          <div className="search-section">
            <div className="search-header">
              <div className="search-box">
                <FaSearch className="search-icon" />
                <input
                  type="text"
                  placeholder="Search resources by title, description, or uploader..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
              <button 
                className={`filter-toggle-btn ${showFilters ? 'active' : ''}`}
                onClick={() => setShowFilters(!showFilters)}
              >
                <FaFilter />
                Filters
                {(selectedType !== 'All' || selectedYear !== 'All' || 
                  selectedSemester !== 'All' || selectedModule !== 'All') && (
                  <span className="filter-badge" />
                )}
              </button>
            </div>

            {showFilters && (
              <div className="filters-section">
                <div className="filter-group">
                  <label>Resource Type</label>
                  <select 
                    value={selectedType} 
                    onChange={(e) => setSelectedType(e.target.value)}
                  >
                    {RESOURCE_TYPES.map(type => (
                      <option key={type} value={type}>{type}</option>
                    ))}
                  </select>
                </div>

                <div className="filter-group">
                  <label>Degree Year</label>
                  <select 
                    value={selectedYear} 
                    onChange={(e) => setSelectedYear(e.target.value)}
                  >
                    {DEGREE_YEARS.map(year => (
                      <option key={year} value={year}>{year}</option>
                    ))}
                  </select>
                </div>

                <div className="filter-group">
                  <label>Semester</label>
                  <select 
                    value={selectedSemester} 
                    onChange={(e) => setSelectedSemester(e.target.value)}
                  >
                    {SEMESTERS.map(semester => (
                      <option key={semester} value={semester}>{semester}</option>
                    ))}
                  </select>
                </div>

                <div className="filter-group">
                  <label>Module</label>
                  <select 
                    value={selectedModule} 
                    onChange={(e) => setSelectedModule(e.target.value)}
                  >
                    {MODULES.map(module => (
                      <option key={module} value={module}>{module}</option>
                    ))}
                  </select>
                </div>

                {(selectedType !== 'All' || selectedYear !== 'All' || 
                  selectedSemester !== 'All' || selectedModule !== 'All') && (
                  <button className="clear-filters-btn" onClick={clearFilters}>
                    <FaTimes /> Clear Filters
                  </button>
                )}
              </div>
            )}
          </div>

          <div className="resources-grid">
            {filteredResources.map(resource => (
              <div key={resource.id} className="resource-card">
                <div className="resource-header">
                  <div className="resource-type">
                    {getFileIcon(resource.fileType)}
                    <span>{resource.type}</span>
                  </div>
                  <div className="resource-actions">
                    <button 
                      className="resource-action-btn share-resource-btn"
                      onClick={() => handleShare(resource)}
                      title="Share Resource"
                    >
                      <FaShare />
                    </button>
                    <button 
                      className="resource-action-btn download-resource-btn"
                      onClick={() => window.open(resource.shareLink, '_blank')}
                      title="Download Resource"
                    >
                      <FaDownload />
                    </button>
                  </div>
                </div>

                <div className="resource-content">
                  <h3>{resource.title}</h3>
                  <p className="resource-description">{resource.description}</p>
                  
                  <div className="resource-meta">
                    <span className="meta-item">
                      <FaFolder /> {resource.module}
                    </span>
                    <span className="meta-item uploader">
                      <FaKey className="key-icon" /> {resource.uploader}
                    </span>
                    <span className="meta-item datetime">
                      <FaMapMarkerAlt className="location-icon" /> {formatDateTime(resource.uploadDate)}
                    </span>
                  </div>

                  <div className="resource-details">
                    <div className="detail-item">
                      <span className="label">Year</span>
                      <span className="value">{resource.year}</span>
                    </div>
                    <div className="detail-item">
                      <span className="label">Semester</span>
                      <span className="value">{resource.semester}</span>
                    </div>
                    <div className="detail-item">
                      <span className="label">File Size</span>
                      <span className="value">{resource.fileSize}</span>
                    </div>
                    <div className="detail-item">
                      <span className="label">Downloads</span>
                      <span className="value">{resource.downloadCount}</span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Upload Modal */}
          {showUploadModal && (
            <div className="modal-overlay">
              <div className="modal-content">
                <div className="modal-header">
                  <h2>Upload Resource</h2>
                  <button 
                    className="close-btn"
                    onClick={() => setShowUploadModal(false)}
                  >
                    ×
                  </button>
                </div>
                <form onSubmit={handleUploadSubmit}>
                  <div className="form-group">
                    <label htmlFor="title">Title *</label>
                    <input
                      type="text"
                      id="title"
                      name="title"
                      value={uploadFormData.title}
                      onChange={handleUploadChange}
                      placeholder="Resource Title"
                    />
                  </div>

                  <div className="form-group">
                    <label htmlFor="description">Description</label>
                    <textarea
                      id="description"
                      name="description"
                      value={uploadFormData.description}
                      onChange={handleUploadChange}
                      placeholder="Resource Description"
                      rows="3"
                    />
                  </div>

                  <div className="form-row">
                    <div className="form-group">
                      <label htmlFor="degree">Degree</label>
                      <select
                        id="degree"
                        name="degree"
                        value={uploadFormData.degree}
                        onChange={handleUploadChange}
                      >
                        <option value="">Select Degree</option>
                        {degreeOptions.map(degree => (
                          <option key={degree._id} value={degree._id}>{degree.name}</option>
                        ))}
                      </select>
                    </div>

                    <div className="form-group">
                      <label htmlFor="type">Resource Type</label>
                      <select
                        id="type"
                        name="type"
                        value={uploadFormData.type}
                        onChange={handleUploadChange}
                      >
                        <option value="">Select Type</option>
                        {RESOURCE_TYPES.filter(type => type !== 'All').map(type => (
                          <option key={type} value={type}>{type}</option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div className="form-row">
                    <div className="form-group">
                      <label htmlFor="year">Degree Year</label>
                      <select
                        id="year"
                        name="year"
                        value={uploadFormData.year}
                        onChange={handleUploadChange}
                      >
                        <option value="">Select Year</option>
                        {yearOptions.map(year => (
                          <option key={year.yearNumber} value={year.yearNumber}>Year {year.yearNumber}</option>
                        ))}
                      </select>
                    </div>

                    <div className="form-group">
                      <label htmlFor="semester">Semester</label>
                      <select
                        id="semester"
                        name="semester"
                        value={uploadFormData.semester}
                        onChange={handleUploadChange}
                      >
                        <option value="">Select Semester</option>
                        {semesterOptions.map(sem => (
                          <option key={sem.semesterNumber} value={sem.semesterNumber}>Semester {sem.semesterNumber}</option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div className="form-group">
                    <label htmlFor="module">Module</label>
                    <select
                      id="module"
                      name="module"
                      value={uploadFormData.module}
                      onChange={handleUploadChange}
                    >
                      <option value="">Select Module</option>
                      {moduleOptions.map(mod => (
                        <option key={mod.code} value={mod.code}>{mod.name}</option>
                      ))}
                    </select>
                  </div>

                  <div className="form-group">
                    <label htmlFor="file">File</label>
                    <input
                      type="file"
                      id="file"
                      name="file"
                      onChange={handleUploadChange}
                      accept=".pdf,.doc,.docx,.ppt,.pptx,.zip,.rar"
                    />
                    <p className="file-hint">Supported formats: PDF, DOC, DOCX, PPT, PPTX, ZIP, RAR</p>
                  </div>

                  <div className="form-actions">
                    <button 
                      type="button" 
                      className="cancel-btn"
                      onClick={() => setShowUploadModal(false)}
                    >
                      Cancel
                    </button>
                    <button type="submit" className="submit-btn">
                      Upload Resource
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}

          {/* Share Modal */}
          {showShareModal && selectedResource && (
            <div className="modal-overlay">
              <div className="modal-content share-modal">
                <div className="modal-header">
                  <h2>Share Resource</h2>
                  <button 
                    className="close-btn"
                    onClick={() => setShowShareModal(false)}
                  >
                    ×
                  </button>
                </div>
                <div className="share-content">
                  <p>Share this resource with others using the link below:</p>
                  <div className="share-link-box">
                    <input
                      type="text"
                      value={shareLink}
                      readOnly
                    />
                    <button 
                      className="copy-btn"
                      onClick={copyShareLink}
                    >
                      <FaCopy /> Copy
                    </button>
                  </div>
                  <div className="share-info">
                    <p className="share-title">{selectedResource.title}</p>
                    <div className="share-meta">
                      <span>Uploaded by {selectedResource.uploader}</span>
                      <span>•</span>
                      <span>{formatDateTime(selectedResource.uploadDate)}</span>
                      <span>•</span>
                      <span>{selectedResource.downloadCount} downloads</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
};

export default ResourcesPage; 