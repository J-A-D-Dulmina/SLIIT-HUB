import React, { useState, useEffect } from 'react';
import { FaChevronLeft, FaChevronRight, FaRobot, FaExpand, FaDownload, FaTrash, FaCheckCircle } from 'react-icons/fa';
import ReactPlayer from 'react-player';
import SideMenu from '../../../shared/components/SideMenu';
import TopBar from '../../../shared/components/TopBar';
import { useAIModel } from '../../ai/hooks/useAIModel';
import '../styles/VideoEditPage.css';
import Toast from '../../../shared/components/Toast';
import '../../../shared/styles/Toast.css';
import jsPDF from 'jspdf';

const VideoEditPage = ({ video, onClose, onSave }) => {
  const [collapsed, setCollapsed] = useState(false);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [formData, setFormData] = useState({
    title: video?.title || '',
    description: video?.description || '',
    module: video?.module || '',
    degree: video?.degree || '',
    year: video?.year || '',
    status: video?.status || 'unpublished',
    summary: video?.summary || '',
    timestamps: video?.timestamps || [],
    semester: video?.semester || ''
  });
  const [isGenerating, setIsGenerating] = useState({
    description: false,
    summary: false,
    timestamps: false
  });
  const [generationProgress, setGenerationProgress] = useState({
    description: '',
    summary: '',
    timestamps: ''
  });
  const [showFullSummary, setShowFullSummary] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [degrees, setDegrees] = useState([]);
  const [showPublishConfirm, setShowPublishConfirm] = useState(false);
  const [agreeTerms, setAgreeTerms] = useState(false);
  const [publishLoading, setPublishLoading] = useState(false);

  // AI model hook
  const { 
    generateSummary,
    generateTimestamps,
    generateDescription,
    processVideoWithAI,
    error: aiError 
  } = useAIModel();

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 60000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    // Fetch the latest video data from the backend by ID
    const fetchLatestVideo = async () => {
      if (!video?.id) return;
      const res = await fetch(`http://localhost:5000/api/tutoring/videos/${video.id}`, { credentials: 'include' });
      if (res.ok) {
        const data = await res.json();
        const latest = data.video;
        if (latest) {
          setFormData({
            title: latest.title || '',
            description: latest.description || '',
            module: latest.module || '',
            degree: latest.degree || '',
            year: latest.year || '',
            status: latest.status || 'unpublished',
            summary: latest.summary || '',
            timestamps: latest.timestamps || [],
            semester: latest.semester || ''
          });
          return;
        }
      }
      // fallback to prop
      setFormData({
        title: video?.title || '',
        description: video?.description || '',
        module: video?.module || '',
        degree: video?.degree || '',
        year: video?.year || '',
        status: video?.status || 'unpublished',
        summary: video?.summary || '',
        timestamps: video?.timestamps || [],
        semester: video?.semester || ''
      });
    };
    fetchLatestVideo();
  }, [video]);

  useEffect(() => {
    fetch('/api/admin/degrees')
      .then(res => res.json())
      .then(data => setDegrees(data))
      .catch(() => setDegrees([]));
  }, []);

  // Dynamic year/semester/module options
  const selectedDegree = degrees.find(d => d._id === formData.degree);
  const years = selectedDegree ? selectedDegree.years : [];
  const selectedYear = years.find(y => String(y.yearNumber) === String(formData.year));
  const semesters = selectedYear ? selectedYear.semesters : [];
  const selectedSemester = semesters.find(s => String(s.semesterNumber) === String(formData.semester));
  const modules = selectedSemester ? selectedSemester.modules : [];

  const handleSubmit = async (e) => {
    e.preventDefault();
    const result = await onSave(formData);
    if (result === true) {
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleTimestampChange = (index, field, value) => {
    const newTimestamps = [...formData.timestamps];
    newTimestamps[index] = { ...newTimestamps[index], [field]: value };
    setFormData(prev => ({
      ...prev,
      timestamps: newTimestamps
    }));
  };

  const addTimestamp = () => {
    setFormData(prev => ({
      ...prev,
      timestamps: [...prev.timestamps, { time: '', description: '' }]
    }));
  };

  const removeTimestamp = (index) => {
    const newTimestamps = formData.timestamps.filter((_, i) => i !== index);
    setFormData(prev => ({
      ...prev,
      timestamps: newTimestamps
    }));
  };

  const generateAIContent = async (type) => {
    // Remove or comment out these debug logs:
    // VideoEditPage generateAIContent called with: Object
    // ✅ Using video ID: ...
    // 📤 Calling generateTimestamps with: Object
    // (and any similar console.log statements)
    
    if (!video?.id) {
      // Remove or comment out this alert:
      // alert('Please select an existing video to generate AI content.');
      return;
    }

    setIsGenerating(prev => ({ ...prev, [type]: true }));
    setGenerationProgress(prev => ({ ...prev, [type]: 'Processing with AI...' }));
    
    try {
      let result;
      
      switch (type) {
        case 'description':
          // Remove or comment out this console.log:
          // console.log('📤 Calling generateDescription with:', { videoId: video.id, title: formData.title });
          result = await generateDescription(video.id, { videoTitle: formData.title });
          setFormData(prev => ({
            ...prev,
            description: result
          }));
          break;
          
        case 'summary':
          // Remove or comment out this console.log:
          // console.log('📤 Calling generateSummary with:', { videoId: video.id, title: formData.title });
          result = await generateSummary(video.id, { videoTitle: formData.title });
          setFormData(prev => ({
            ...prev,
            summary: result
          }));
          break;
          
        case 'timestamps':
          // Remove or comment out this console.log:
          // console.log('📤 Calling generateTimestamps with:', { videoId: video.id, title: formData.title });
          result = await generateTimestamps(video.id, { videoTitle: formData.title });
          setFormData(prev => ({
            ...prev,
            timestamps: result
          }));
          break;
        default:
          // Optionally, do nothing or handle unexpected cases
          break;
      }
    } catch (error) {
      // Remove or comment out this console.error:
      // console.error(`Error generating ${type}:`, error);
      alert(`Error generating ${type}: ${error.message}`);
    } finally {
      setIsGenerating(prev => ({ ...prev, [type]: false }));
      setGenerationProgress(prev => ({ ...prev, [type]: '' }));
    }
  };

  const generateAllAIContent = async () => {
    if (!video?.id) {
      // Remove or comment out this alert:
      // alert('Please select an existing video to generate AI content.');
      return;
    }

    setIsGenerating({
      description: true,
      summary: true,
      timestamps: true
    });
    
    setGenerationProgress({
      description: 'Processing video with AI...',
      summary: 'Processing video with AI...',
      timestamps: 'Processing video with AI...'
    });

    try {
      const result = await processVideoWithAI(
        video.id,
        formData.title, 
        ['summary', 'timestamps', 'description']
      );
      
      if (result.summary) {
        setFormData(prev => ({
          ...prev,
          summary: result.summary
        }));
      }
      
      if (result.timestamps) {
        setFormData(prev => ({
          ...prev,
          timestamps: result.timestamps
        }));
      }
      
      if (result.description) {
        setFormData(prev => ({
          ...prev,
          description: result.description
        }));
      }
      
    } catch (error) {
      // Remove or comment out this console.error:
      // console.error('Error generating all AI content:', error);
      alert(`Error generating AI content: ${error.message}`);
    } finally {
      setIsGenerating({
        description: false,
        summary: false,
        timestamps: false
      });
      setGenerationProgress({
        description: '',
        summary: '',
        timestamps: ''
      });
    }
  };

  const handleDownloadPDF = () => {
    const doc = new jsPDF();
    const title = video?.title || 'Video Summary';
    const summary = formData.summary || '';

    doc.setFontSize(18);
    doc.text(title, 10, 20);

    doc.setFontSize(12);
    doc.text('Summary:', 10, 35);
    doc.setFontSize(11);

    // Split summary into lines to fit the page
    const lines = doc.splitTextToSize(summary, 180);
    doc.text(lines, 10, 45);

    doc.save(`${title.replace(/[^a-z0-9]/gi, '_').toLowerCase()}-summary.pdf`);
  };

  console.log("Timestamps in formData:", formData.timestamps);

  // Add a function to handle publish/unpublish
  const handlePublishToggle = async () => {
    setPublishLoading(true);
    try {
      const res = await fetch(`http://localhost:5000/api/tutoring/videos/${video.id}/publish`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ status: formData.status === 'published' ? 'unpublished' : 'published' })
      });
      if (res.ok) {
        setFormData(prev => ({ ...prev, status: prev.status === 'published' ? 'unpublished' : 'published' }));
        setShowPublishConfirm(false);
        setAgreeTerms(false);
      }
    } finally {
      setPublishLoading(false);
    }
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
        <main className="video-edit-page">
          <div className="page-header">
            <button className="back-button" onClick={onClose}>
              <FaChevronLeft />
              Back
            </button>
            <h1>{video ? 'Edit Video' : 'Upload New Video'}</h1>
          </div>

          {/* AI Generation Controls */}
          <div className="ai-controls-section">
            <div className="ai-controls-header">
              <h3>AI Content Generation</h3>
              <p>Use AI to automatically generate video content using OpenAI Whisper and GPT-4</p>
            </div>
            <div className="ai-controls-buttons">
              <button
                type="button"
                className="ai-generate-all-btn"
                onClick={generateAllAIContent}
                disabled={isGenerating.summary || isGenerating.description || isGenerating.timestamps}
              >
                <FaRobot /> Generate All Content with AI
              </button>
            </div>
            {(isGenerating.summary || isGenerating.description || isGenerating.timestamps) && (
              <div className="ai-progress-overview">
                <div className="progress-spinner"></div>
                <span>Processing video with AI (Whisper + GPT-4)...</span>
              </div>
            )}
            {aiError && (
              <div className="ai-error-message">
                <p>Error: {aiError}</p>
              </div>
            )}
          </div>

          <div className="video-preview-section">
            <div className="video-player-wrapper">
              {video?.videoFile ? (
              <ReactPlayer
                  url={`http://localhost:5000/api/tutoring/video/${video.id}`}
                width="100%"
                height="100%"
                controls={true}
                config={{
                  file: {
                    attributes: {
                      controlsList: 'nodownload'
                    }
                  }
                }}
              />
              ) : (
                <div className="video-placeholder">
                  <div className="placeholder-content">
                    <div className="placeholder-icon">📹</div>
                    <p>No video file available</p>
                    <small>Video preview will appear here when a file is uploaded</small>
                  </div>
                </div>
              )}
            </div>
          </div>

          <div className="summary-section">
            <div className="form-group">
              <div className="form-group-header">
                <div className="summary-header-left">
                  <label htmlFor="summary">Summary</label>
                  <div className="summary-actions">
                    <button
                      type="button"
                      className="summary-action-btn view-summary-btn"
                      onClick={() => setShowFullSummary(true)}
                    >
                      <FaExpand /> Full View
                    </button>
                    <button
                      type="button"
                      className="summary-action-btn download-summary-btn"
                      onClick={handleDownloadPDF}
                      disabled={!formData.summary}
                    >
                      <FaDownload /> PDF
                    </button>
                  </div>
                </div>
                <button
                  type="button"
                  className="ai-generate-btn summary"
                  onClick={() => generateAIContent('summary')}
                  disabled={isGenerating.summary}
                >
                  <FaRobot /> {isGenerating.summary ? 'Generating...' : 'Generate with AI'}
                </button>
              </div>
              {isGenerating.summary && (
                <div className="generation-progress">
                  <div className="progress-spinner"></div>
                  <span>{generationProgress.summary}</span>
                </div>
              )}
              <textarea
                id="summary"
                name="summary"
                value={formData.summary}
                onChange={handleChange}
                placeholder="Enter video summary or generate with AI using Whisper and GPT-4"
                rows="12"
              />
            </div>
          </div>

          {showFullSummary && (
            <div className="full-summary-modal">
              <div className="full-summary-content">
                <div className="full-summary-header">
                  <h2>Summary - {video?.title || 'New Video'}</h2>
                  <button 
                    className="close-btn"
                    onClick={() => setShowFullSummary(false)}
                  >
                    <FaChevronLeft /> Back
                  </button>
                </div>
                <div className="full-summary-body">
                  {formData.summary || 'No summary available'}
                </div>
                <div className="full-summary-footer">
                  <button
                    className="download-btn"
                    onClick={handleDownloadPDF}
                    disabled={!formData.summary}
                  >
                    <FaDownload /> Download PDF
                  </button>
                </div>
              </div>
            </div>
          )}

          <div className="edit-content">
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

              <div className="form-group">
                <div className="form-group-header">
                  <label htmlFor="description">Description</label>
                  <button
                    type="button"
                    className="ai-generate-btn description"
                    onClick={() => generateAIContent('description')}
                    disabled={isGenerating.description}
                  >
                    <FaRobot /> {isGenerating.description ? 'Generating...' : 'Generate with AI'}
                  </button>
                </div>
                {isGenerating.description && (
                  <div className="generation-progress">
                    <div className="progress-spinner"></div>
                    <span>{generationProgress.description}</span>
                  </div>
                )}
                <textarea
                  id="description"
                  name="description"
                  value={formData.description}
                  onChange={handleChange}
                  required
                  placeholder="Enter video description or generate with AI"
                  rows="4"
                />
              </div>

              <div className="form-group">
                <label htmlFor="module">Module</label>
                <div className="module-selection">
                  {/* Degree Dropdown */}
                  <select
                    id="degree"
                    name="degree"
                    value={formData.degree}
                    onChange={handleChange}
                    required
                  >
                    <option value="">Select Degree</option>
                    {degrees.map(degree => (
                      <option key={degree._id} value={degree._id}>{degree.name}</option>
                    ))}
                  </select>

                  {/* Year Dropdown */}
                  {selectedDegree && (
                    <select
                      id="year"
                      name="year"
                      value={formData.year}
                      onChange={handleChange}
                      required
                    >
                      <option value="">Select Year</option>
                      {years.map(y => (
                        <option key={y.yearNumber} value={y.yearNumber}>Year {y.yearNumber}</option>
                      ))}
                    </select>
                  )}

                  {/* Semester Dropdown */}
                  {selectedYear && (
                    <select
                      id="semester"
                      name="semester"
                      value={formData.semester}
                      onChange={handleChange}
                      required
                    >
                      <option value="">Select Semester</option>
                      {semesters.map(s => (
                        <option key={s.semesterNumber} value={s.semesterNumber}>Semester {s.semesterNumber}</option>
                      ))}
                    </select>
                  )}

                  {/* Module Dropdown */}
                  {selectedSemester && (
                    <select
                      id="module"
                      name="module"
                      value={formData.module}
                      onChange={handleChange}
                      required
                    >
                      <option value="">Select Module</option>
                      {modules.map(m => (
                        <option key={m.code} value={m.code}>{m.code} - {m.name}</option>
                      ))}
                    </select>
                  )}
                </div>
              </div>

              <div className="timestamps-section">
                <div className="timestamps-header" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div style={{ display: 'flex', alignItems: 'center' }}>
                    <label style={{ marginRight: 8 }}>Timestamps</label>
                    <button type="button" className="add-timestamp-btn" onClick={addTimestamp} style={{ marginRight: 8 }}>
                    + Add
                    </button>
                  </div>
                  <button
                    type="button"
                    className="ai-generate-btn timestamps"
                    onClick={() => generateAIContent('timestamps')}
                    disabled={isGenerating.timestamps}
                  >
                    <FaRobot /> {isGenerating.timestamps ? 'Generating...' : 'Generate with AI'}
                  </button>
                </div>
                {isGenerating.timestamps && (
                  <div className="generation-progress">
                    <div className="progress-spinner"></div>
                    <span>{generationProgress.timestamps || 'Processing video with AI...'}</span>
                  </div>
                )}
                <ul className="timestamps-list">
                  {formData.timestamps.map((ts, idx) => (
                    <li key={idx} className="timestamp-row">
                      <input
                        type="text"
                        className="timestamp-time"
                        value={ts.time_start || ''}
                        onChange={e => handleTimestampChange(idx, 'time_start', e.target.value)}
                        maxLength={6}
                      />
                      <input
                        type="text"
                        className="timestamp-desc"
                        value={ts.description}
                        onChange={e => handleTimestampChange(idx, 'description', e.target.value)}
                      />
                      <button
                        type="button"
                        className="delete-timestamp-btn"
                        onClick={() => removeTimestamp(idx)}
                        title="Delete"
                      >
                        <FaTrash />
                      </button>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="form-actions" style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                <button type="button" className="cancel-btn" onClick={onClose}>
                  Cancel
                </button>
                <button type="submit" className="save-btn">
                  {video ? 'Save Changes' : 'Upload Video'}
                </button>
              </div>
            </form>
          </div>

          {/* Show save success toast */}
          <Toast message={saveSuccess ? 'Video saved successfully!' : ''} onClose={() => setSaveSuccess(false)} />
        </main>
      </div>
    </div>
  );
};

export default VideoEditPage; 