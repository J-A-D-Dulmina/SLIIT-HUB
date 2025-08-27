import React, { useState, useEffect } from 'react';
import { FaChevronLeft, FaChevronRight, FaUpload, FaSearch, FaFilter, FaTimes, FaFile, FaFolder, FaDownload, FaShare, FaClock, FaUser, FaLink, FaCopy, FaMapMarkerAlt, FaKey } from 'react-icons/fa';
import SideMenu from '../../../shared/components/SideMenu';
import TopBar from '../../../shared/components/TopBar';
import moment from 'moment';
import '../styles/ResourcesPage.css';
import axios from 'axios';
import UploadResourceModal from './UploadResourceModal.jsx';
import ConfirmationDialog from '../../../shared/components/ConfirmationDialog';
import { resourcesApi, userApi } from '../../../services/api';

const RESOURCE_TYPES = ['All', 'Documents', 'Presentations', 'Notes', 'Assignments', 'Others'];
const DEGREES = ['All', 'BSc (Hons) in IT', 'BSc (Hons) in Software Engineering', 'BSc (Hons) in Computer Systems Engineering', 'BSc (Hons) in Information Systems Engineering'];
const DEGREE_YEARS = ['All', 'Year 1', 'Year 2', 'Year 3', 'Year 4'];
const SEMESTERS = ['All', 'Semester 1', 'Semester 2'];
const MODULES = ['All', 'AI', 'Web Development', 'Database Systems', 'Software Engineering', 'Networks', 'Operating Systems'];

const API_BASE = 'http://localhost:5000/api/resources';
const DEGREE_API = 'http://localhost:5000/api/admin/degrees';

const ResourcesPage = ({ mode = 'all', embedded = false, openUploadTrigger = 0 }) => {
  const [collapsed, setCollapsed] = useState(false);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [resources, setResources] = useState([]);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [selectedType, setSelectedType] = useState('All');
  // Filters driven by DB degree structure
  const [filterDegreeId, setFilterDegreeId] = useState('All');
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
    visibility: 'public',
    file: null
  });
  const [showShareModal, setShowShareModal] = useState(false);
  const [selectedResource, setSelectedResource] = useState(null);
  const [shareLink, setShareLink] = useState('');
  const [showEditModal, setShowEditModal] = useState(false);
  const [editForm, setEditForm] = useState({ title: '', description: '', type: 'Documents', degree: '', year: '', semester: '', module: '', visibility: 'public' });
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [degreeOptions, setDegreeOptions] = useState([]);
  const [yearOptions, setYearOptions] = useState([]);
  const [semesterOptions, setSemesterOptions] = useState([]);
  const [moduleOptions, setModuleOptions] = useState([]);

  // Set constant uploader name
  const UPLOADER_NAME = "J A D Dulmina";

  useEffect(() => {
    if (!embedded) {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 60000);
      return () => clearInterval(timer);
    }
  }, [embedded]);

  useEffect(() => {
    const init = async () => {
      try {
        const authRes = await userApi.me();
        const u = authRes.data?.user || {};
        const uid = u.id || u._id || u.userId || '';
        setCurrentUserId(String(uid));
      } catch (e) {
        setCurrentUserId('');
      }
      await fetchResources();
      fetchDegrees();
    };
    init();
  }, [mode]);

  // Respond to upload trigger from parent (embedded mode)
  const [lastUploadTrigger, setLastUploadTrigger] = useState(0);
  useEffect(() => {
    if (!embedded) return;
    if (mode === 'public') return;
    if (openUploadTrigger > 0 && openUploadTrigger !== lastUploadTrigger) {
      setShowUploadModal(true);
      setLastUploadTrigger(openUploadTrigger);
    }
  }, [embedded, mode, openUploadTrigger, lastUploadTrigger]);

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
      const res = mode === 'public' ? await resourcesApi.listPublic()
        : mode === 'my' ? await resourcesApi.listMine()
        : await resourcesApi.listAll();
      setResources((res.data || []).map(r => {
        const uploaderId = r?.uploader?._id || r?.uploaderId || r?.uploader || '';
        const uploaderName = r?.uploaderName || r?.uploader?.name || r?.uploader?.fullName || r?.uploader?.email || 'Unknown';
        const degreeId = r?.degree?._id || r?.degreeId || r?.degree || 'All';
        return {
          ...r,
          id: String(r._id || r.id),
          uploaderId: String(uploaderId || ''),
          uploaderName,
          degree: String(degreeId),
          type: r?.type || r?.resourceType || 'Others',
          visibility: r?.visibility || 'public',
          shareLink: resourcesApi.downloadUrl(r._id || r.id),
          fileType: (r.fileType || '').split('/').pop(),
          fileSize: r.fileSize ? formatFileSize(r.fileSize) : '',
        };
      }));
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

  // Derived filter option sets
  const filterYearOptions = React.useMemo(() => {
    if (filterDegreeId === 'All') return [];
    const d = degreeOptions.find(d => d._id === filterDegreeId);
    return d?.years || [];
  }, [degreeOptions, filterDegreeId]);

  const filterSemesterOptions = React.useMemo(() => {
    if (filterDegreeId === 'All' || selectedYear === 'All') return [];
    const d = degreeOptions.find(d => d._id === filterDegreeId);
    const y = d?.years?.find(y => String(y.yearNumber) === String(selectedYear));
    return y?.semesters || [];
  }, [degreeOptions, filterDegreeId, selectedYear]);

  const filterModuleOptions = React.useMemo(() => {
    if (filterDegreeId === 'All' || selectedYear === 'All' || selectedSemester === 'All') return [];
    const d = degreeOptions.find(d => d._id === filterDegreeId);
    const y = d?.years?.find(y => String(y.yearNumber) === String(selectedYear));
    const s = y?.semesters?.find(s => String(s.semesterNumber) === String(selectedSemester));
    return s?.modules || [];
  }, [degreeOptions, filterDegreeId, selectedYear, selectedSemester]);

  const [myResourcesOnly, setMyResourcesOnly] = useState(mode === 'my');
  const [currentUserId, setCurrentUserId] = useState('');

  // current user already loaded in init above

  const filteredResources = React.useMemo(() => {
    const lowerQ = String(searchQuery || '').toLowerCase();
    return resources.filter((resource) => {
      const title = String(resource.title || '');
      const description = String(resource.description || '');
      const uploaderName = String(resource.uploaderName || '');
      const resourceType = String(resource.type || '');
      const resourceDegree = String(resource.degree || '');
      const resourceYear = String(resource.year || '');
      const resourceSemester = String(resource.semester || '');
      const resourceModule = String(resource.module || '');
      const visibility = String(resource.visibility || 'public');
      const isOwner = (typeof resource.isOwner === 'boolean')
        ? resource.isOwner
        : (currentUserId && String(resource.uploaderId || '') === String(currentUserId));

      // Text search
      const matchesSearch = (
        title.toLowerCase().includes(lowerQ) ||
        description.toLowerCase().includes(lowerQ) ||
        uploaderName.toLowerCase().includes(lowerQ)
      );

      // Structured filters (only applied when not 'All')
      const matchesType = (selectedType === 'All') || (resourceType === selectedType);
      const matchesDegree = (filterDegreeId === 'All') || (resourceDegree === String(filterDegreeId));
      const matchesYear = (selectedYear === 'All') || (resourceYear === String(selectedYear));
      const matchesSemester = (selectedSemester === 'All') || (resourceSemester === String(selectedSemester));
      const matchesModule = (selectedModule === 'All') || (resourceModule === String(selectedModule));

      // Mode gating
      let includeByMode = true;
      if (mode === 'my') {
        includeByMode = !!isOwner;
      } else if (mode === 'public') {
        includeByMode = visibility === 'public';
      } else {
        // mode === 'all': show all public + my private
        includeByMode = (visibility === 'public') || !!isOwner;
        if (myResourcesOnly) includeByMode = !!isOwner;
      }

      return (
        includeByMode &&
        matchesSearch &&
        matchesType &&
        matchesDegree &&
        matchesYear &&
        matchesSemester &&
        matchesModule
      );
    });
  }, [resources, searchQuery, selectedType, filterDegreeId, selectedYear, selectedSemester, selectedModule, currentUserId, mode, myResourcesOnly]);

  const handleUploadChange = React.useCallback((e) => {
    const { name, value, files } = e.target;
    setUploadFormData(prev => ({
      ...prev,
      [name]: files ? files[0] : value
    }));
  }, []);

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
    // visibility
    if (uploadFormData.visibility) formData.append('visibility', uploadFormData.visibility);
    try {
      await axios.post(`${API_BASE}/upload`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
        withCredentials: true
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
        visibility: 'public',
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

  useEffect(() => {
    if (showEditModal && selectedResource) {
      setEditForm({
        title: selectedResource.title || '',
        description: selectedResource.description || '',
        type: selectedResource.type || 'Documents',
        degree: selectedResource.degree || '',
        year: selectedResource.year || '',
        semester: selectedResource.semester || '',
        module: selectedResource.module || '',
        visibility: selectedResource.visibility || 'public',
      });
    }
  }, [showEditModal, selectedResource]);

  const copyShareLink = () => {
    navigator.clipboard.writeText(shareLink);
    alert('Share link copied to clipboard!');
  };

  const clearFilters = () => {
    setFilterDegreeId('All');
    setSelectedType('All');
    setSelectedYear('All');
    setSelectedSemester('All');
    setSelectedModule('All');
    setMyResourcesOnly(false);
    setSearchQuery('');
    // Optionally collapse the filters panel for immediate visual feedback
    setShowFilters(false);
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

  const isOwnerFor = React.useCallback((resource) => {
    if (mode === 'my') return true;
    const resOwnerId = String(resource.uploaderId || resource.uploader || '');
    return !!currentUserId && resOwnerId === String(currentUserId);
  }, [currentUserId, mode]);

  const InnerContent = () => (
    <>
      {!embedded && (
          <div className="page-header">
          <h1>{mode === 'my' ? 'My Resources' : mode === 'public' ? 'Public Resources' : 'Academic Resources'}</h1>
          {mode !== 'public' && (
            <button className="upload-btn" onClick={() => setShowUploadModal(true)}>
              <FaUpload /> Upload Resource
            </button>
          )}
          </div>
      )}
      {/* Upload button is handled by parent header in embedded mode */}

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
              {mode === 'all' && (
                <div className="owner-toggle">
                  <label style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <input type="checkbox" checked={myResourcesOnly} onChange={e => setMyResourcesOnly(e.target.checked)} />
                    Show only my resources
                  </label>
                </div>
              )}
              <button 
                className={`filter-toggle-btn ${showFilters ? 'active' : ''}`}
                onClick={() => setShowFilters(!showFilters)}
              >
                <FaFilter />
                Filters
              </button>
              <button 
                className={`clear-toggle-btn ${filterDegreeId !== 'All' || selectedType !== 'All' || selectedYear !== 'All' || selectedSemester !== 'All' || selectedModule !== 'All' ? '' : 'hidden'}`}
                onClick={clearFilters}
                style={{ display: (filterDegreeId !== 'All' || selectedType !== 'All' || selectedYear !== 'All' || selectedSemester !== 'All' || selectedModule !== 'All') ? 'flex' : 'none' }}
              >
                <FaTimes /> Clear
              </button>
              {/* No upload button here in embedded mode */}
            </div>

            {showFilters && (
              <div className="filters-section">
                <div className="filter-group">
                  <label>Degree</label>
                  <select 
                    value={filterDegreeId} 
                    onChange={(e) => {
                      setFilterDegreeId(e.target.value);
                      setSelectedYear('All');
                      setSelectedSemester('All');
                      setSelectedModule('All');
                    }}
                  >
                    <option value="All">All</option>
                    {degreeOptions.map(degree => (
                      <option key={degree._id} value={degree._id}>{degree.name}</option>
                    ))}
                  </select>
                </div>

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
                    <option value="All">All</option>
                    {filterYearOptions.map(year => (
                      <option key={year.yearNumber} value={year.yearNumber}>Year {year.yearNumber}</option>
                    ))}
                  </select>
                </div>

                <div className="filter-group">
                  <label>Semester</label>
                  <select 
                    value={selectedSemester} 
                    onChange={(e) => setSelectedSemester(e.target.value)}
                  >
                    <option value="All">All</option>
                    {filterSemesterOptions.map(semester => (
                      <option key={semester.semesterNumber} value={semester.semesterNumber}>Semester {semester.semesterNumber}</option>
                    ))}
                  </select>
                </div>

                <div className="filter-group">
                  <label>Module</label>
                  <select 
                    value={selectedModule} 
                    onChange={(e) => setSelectedModule(e.target.value)}
                  >
                    <option value="All">All</option>
                    {filterModuleOptions.map(mod => (
                      <option key={mod.code} value={mod.code}>{mod.name}</option>
                    ))}
                  </select>
                </div>

                {/* clear button moved to header */}
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
                    <div className="action-group primary-actions">
                      {mode !== 'my' && (
                        <span className={`visibility-badge ${resource.visibility}`} title={resource.visibility}>
                          {resource.visibility === 'private' ? 'Private' : 'Public'}
                        </span>
                      )}
                      <button className="resource-action-btn share-resource-btn" onClick={() => handleShare(resource)} title="Share Resource"><FaShare /></button>
                      <button 
                        className="resource-action-btn download-resource-btn"
                        onClick={() => window.open(resource.shareLink, '_blank')}
                        title="Download Resource"
                      >
                        <FaDownload />
                      </button>
                    </div>
                    {isOwnerFor(resource) && (
                      <div className="action-group owner-actions">
                        <button
                          className={`resource-action-btn visibility-toggle-btn ${resource.visibility === 'public' ? 'is-public' : 'is-private'}`}
                          title={resource.visibility === 'public' ? 'Set Private' : 'Set Public'}
                          onClick={async () => {
                            const nextVis = resource.visibility === 'public' ? 'private' : 'public';
                            try {
                              await resourcesApi.updateVisibility(resource.id, nextVis);
                              setResources(prev => prev.map(r => r.id === resource.id ? { ...r, visibility: nextVis } : r));
                            } catch (err) {
                              alert('Failed to update visibility');
                            }
                          }}
                        >
                          {resource.visibility === 'public' ? 'Public' : 'Private'}
                        </button>
                        <button 
                          className="resource-action-btn edit-resource-btn"
                          title="Edit Resource"
                          onClick={() => {
                            setSelectedResource(resource);
                            setShowShareModal(false);
                            setShowEditModal(true);
                          }}
                        >
                          ✎
                        </button>
                        <button 
                          className="resource-action-btn delete-resource-btn"
                          title="Delete Resource"
                          onClick={() => { setSelectedResource(resource); setDeleteDialogOpen(true); }}
                        >
                          🗑
                        </button>
                      </div>
                    )}
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
                      <FaKey className="key-icon" /> {resource.uploaderName}
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

          {showUploadModal && (
            <UploadResourceModal 
              isOpen={showUploadModal}
              onClose={() => setShowUploadModal(false)}
              onSubmit={async (formData) => {
                try {
                  await axios.post(`${API_BASE}/upload`, formData, {
                    headers: { 'Content-Type': 'multipart/form-data' },
                    withCredentials: true
                  });
                  alert('Resource uploaded successfully!');
                  setShowUploadModal(false);
                  fetchResources();
                } catch (err) {
                  alert('Failed to upload resource.');
                  console.error(err);
                }
              }}
              degreeOptions={degreeOptions}
            />
          )}

          {/* Edit Modal */}
          {showEditModal && selectedResource && (
            <div 
              className="modal-overlay"
              onClick={(e) => e.stopPropagation()}
              onKeyDown={(e) => e.stopPropagation()}
              onKeyUp={(e) => e.stopPropagation()}
            >
              <div 
                className="modal-content"
                onClick={(e) => e.stopPropagation()}
                onKeyDown={(e) => e.stopPropagation()}
                onKeyUp={(e) => e.stopPropagation()}
              >
                <div className="modal-header">
                  <h2>Edit Resource</h2>
                  <button className="close-btn" onClick={() => setShowEditModal(false)}>×</button>
                </div>
                <form
                  onSubmit={async (e) => {
                    e.preventDefault();
                    try {
                      const body = {
                        title: editForm.title,
                        description: editForm.description,
                        type: editForm.type,
                        degree: editForm.degree,
                        year: editForm.year,
                        semester: editForm.semester,
                        module: editForm.module,
                        visibility: editForm.visibility,
                      };
                      await resourcesApi.update(selectedResource.id, body);
                      setResources(prev => prev.map(r => r.id === selectedResource.id ? { ...r, ...body } : r));
                      setShowEditModal(false);
                    } catch (err) {
                      alert('Failed to update resource');
                    }
                  }}
                >
                  <div className="form-group">
                    <label>Title</label>
                    <input value={editForm.title} onChange={(e) => setEditForm({ ...editForm, title: e.target.value })} />
                  </div>
                  <div className="form-group">
                    <label>Description</label>
                    <textarea value={editForm.description} onChange={(e) => setEditForm({ ...editForm, description: e.target.value })} />
                  </div>
                  <div className="form-row">
                    <div className="form-group">
                      <label>Type</label>
                      <select value={editForm.type} onChange={(e) => setEditForm({ ...editForm, type: e.target.value })}>
                        {['Documents','Presentations','Notes','Assignments','Others'].map(t => <option key={t} value={t}>{t}</option>)}
                      </select>
                    </div>
                    <div className="form-group">
                      <label>Visibility</label>
                      <select value={editForm.visibility} onChange={(e) => setEditForm({ ...editForm, visibility: e.target.value })}>
                        <option value="public">Public</option>
                        <option value="private">Private</option>
                      </select>
                    </div>
                  </div>
                  <div className="form-row">
                    <div className="form-group">
                      <label>Degree</label>
                      <select value={editForm.degree} onChange={(e) => setEditForm({ ...editForm, degree: e.target.value })}>
                        <option value="">Select Degree</option>
                        {degreeOptions.map(d => <option key={d._id} value={d._id}>{d.name}</option>)}
                      </select>
                    </div>
                    <div className="form-group">
                      <label>Year</label>
                      <input value={editForm.year} onChange={(e) => setEditForm({ ...editForm, year: e.target.value })} />
                    </div>
                    <div className="form-group">
                      <label>Semester</label>
                      <input value={editForm.semester} onChange={(e) => setEditForm({ ...editForm, semester: e.target.value })} />
                    </div>
                  </div>
                  <div className="form-group">
                    <label>Module</label>
                    <input value={editForm.module} onChange={(e) => setEditForm({ ...editForm, module: e.target.value })} />
                  </div>
                  <div className="form-actions">
                    <button type="button" className="cancel-btn" onClick={() => setShowEditModal(false)}>Cancel</button>
                    <button type="submit" className="submit-btn">Save Changes</button>
                  </div>
                </form>
              </div>
            </div>
          )}

          {/* Delete Confirmation */}
          <ConfirmationDialog
            isOpen={deleteDialogOpen}
            onClose={() => setDeleteDialogOpen(false)}
            onConfirm={async () => {
              if (!selectedResource) return;
              try {
                await resourcesApi.delete(selectedResource.id);
                setResources(prev => prev.filter(r => r.id !== selectedResource.id));
              } catch (err) {
                alert('Failed to delete resource');
              } finally {
                setDeleteDialogOpen(false);
                setSelectedResource(null);
              }
            }}
            title="Delete resource?"
            message="This action cannot be undone. The file will be removed."
            confirmText="Delete"
            cancelText="Cancel"
            type="danger"
          />

          {/* Share Modal */}
          {showShareModal && selectedResource && (
            <div 
              className="modal-overlay"
              onClick={(e) => e.stopPropagation()}
              onKeyDown={(e) => e.stopPropagation()}
              onKeyUp={(e) => e.stopPropagation()}
            >
              <div 
                className="modal-content share-modal"
                onClick={(e) => e.stopPropagation()}
                onKeyDown={(e) => e.stopPropagation()}
                onKeyUp={(e) => e.stopPropagation()}
              >
                <div className="modal-header">
                  <h2>Share Resource</h2>
                  <button 
                    className="close-btn"
                    onClick={() => setShowShareModal(false)}
                  >
                    ×
                  </button>
                </div>
                <div 
                  className="share-content"
                  onKeyDown={(e) => e.stopPropagation()}
                  onKeyUp={(e) => e.stopPropagation()}
                >
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
    </>
  );

  if (embedded) {
    return (
      <main className="resources-page">
        <InnerContent />
      </main>
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

        <main className="resources-page">
          <InnerContent />
        </main>
      </div>
    </div>
  );
};

export default ResourcesPage; 