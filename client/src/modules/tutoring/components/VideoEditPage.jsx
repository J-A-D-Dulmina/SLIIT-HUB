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
    description: 0,
    summary: 0,
    timestamps: 0
  });
  const [showFullSummary, setShowFullSummary] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [degrees, setDegrees] = useState([]);
  const [showPublishConfirm, setShowPublishConfirm] = useState(false);
  const [agreeTerms, setAgreeTerms] = useState(false);
  const [publishLoading, setPublishLoading] = useState(false);
  const [videoError, setVideoError] = useState(false);
  const [videoLoading, setVideoLoading] = useState(true);
  const [videoReady, setVideoReady] = useState(false);
  const [updateStatus, setUpdateStatus] = useState({
    summary: false,
    description: false,
    timestamps: false
  });
  const [notification, setNotification] = useState({
    show: false,
    message: '',
    type: 'success'
  });

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

  // Clear update status after 3 seconds
  useEffect(() => {
    const timer = setTimeout(() => {
      setUpdateStatus({
        summary: false,
        description: false,
        timestamps: false
      });
    }, 3000);
    return () => clearTimeout(timer);
  }, [updateStatus]);

  // Auto-hide notification after 3 seconds
  useEffect(() => {
    if (notification.show) {
      const timer = setTimeout(() => {
        setNotification({ show: false, message: '', type: 'success' });
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [notification.show]);

  const showNotification = (message, type = 'success') => {
    setNotification({
      show: true,
      message,
      type
    });
  };

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
    if (!video?.id) {
      alert('Please select an existing video to generate AI content.');
      return;
    }

    setIsGenerating(prev => ({ ...prev, [type]: true }));
    setGenerationProgress(prev => ({ ...prev, [type]: 0 }));

    try {
      console.log(`Generating ${type}...`);
      
      // Quick progress update for UI feedback
      setGenerationProgress(prev => ({ ...prev, [type]: 25 }));
      
      let result;
      switch (type) {
        case 'summary':
          result = await generateSummary(video.id, { videoTitle: formData.title });
          break;
        case 'description':
          result = await generateDescription(video.id, { videoTitle: formData.title });
          break;
        case 'timestamps':
          result = await generateTimestamps(video.id, { videoTitle: formData.title });
          break;
        default:
          throw new Error(`Unknown generation type: ${type}`);
      }

      // Set progress to 100% when completed
      setGenerationProgress(prev => ({ ...prev, [type]: 100 }));

      // Update form data immediately
      setFormData(prev => ({
        ...prev,
        [type]: result
      }));

      // Show success feedback
      showUpdateSuccess(type);
      showNotification(`${type.charAt(0).toUpperCase() + type.slice(1)} generated successfully!`, 'success');

      // Reset progress after a short delay to show completion
      setTimeout(() => {
        setGenerationProgress(prev => ({ ...prev, [type]: 0 }));
      }, 1000);

    } catch (error) {
      console.error(`Error generating ${type}:`, error);
      showNotification(`Error generating ${type}: ${error.message}`, 'error');
    } finally {
      setIsGenerating(prev => ({ ...prev, [type]: false }));
    }
  };

  const generateAllAIContent = async () => {
    if (!video?.id) {
      alert('Please select an existing video to generate AI content.');
      return;
    }

    setIsGenerating({
      description: true,
      summary: true,
      timestamps: true
    });
    
    setGenerationProgress({
      description: 0,
      summary: 0,
      timestamps: 0
    });

    try {
      // Step 1: Generate Summary (0-33%)
      console.log('Step 1: Generating Summary...');
      setGenerationProgress(prev => ({ ...prev, summary: 25 }));
      
      // Minimal delay for UI feedback
      await new Promise(resolve => setTimeout(resolve, 300));
      setGenerationProgress(prev => ({ ...prev, summary: 50 }));
      
      const summaryResult = await generateSummary(video.id, { videoTitle: formData.title });
      
      // Real-time update: Update summary immediately
      setFormData(prev => ({
        ...prev,
        summary: summaryResult
      }));
      setGenerationProgress(prev => ({ ...prev, summary: 100 })); // Set to 100% when completed
      
      // Show visual feedback
      showUpdateSuccess('summary');
      
      // Step 2: Generate Description (33-66%) - Reduced delays
      console.log('Step 2: Generating Description...');
      setGenerationProgress(prev => ({ ...prev, description: 25 }));
      
      // Minimal delay for UI feedback
      await new Promise(resolve => setTimeout(resolve, 200));
      setGenerationProgress(prev => ({ ...prev, description: 50 }));
      
      const descriptionResult = await generateDescription(video.id, { videoTitle: formData.title });
      
      // Real-time update: Update description immediately
      setFormData(prev => ({
        ...prev,
        description: descriptionResult
      }));
      setGenerationProgress(prev => ({ ...prev, description: 100 })); // Set to 100% when completed
      
      // Show visual feedback
      showUpdateSuccess('description');
      
      // Step 3: Generate Timestamps (66-100%) - Reduced delays
      console.log('Step 3: Generating Timestamps...');
      setGenerationProgress(prev => ({ ...prev, timestamps: 25 }));
      
      // Minimal delay for UI feedback
      await new Promise(resolve => setTimeout(resolve, 300));
      setGenerationProgress(prev => ({ ...prev, timestamps: 50 }));
      
      const timestampsResult = await generateTimestamps(video.id, { videoTitle: formData.title });
      
      // Real-time update: Update timestamps immediately
      setFormData(prev => ({
        ...prev,
        timestamps: timestampsResult
      }));
      setGenerationProgress(prev => ({ ...prev, timestamps: 100 })); // Set to 100% when completed
      
      // Show visual feedback
      showUpdateSuccess('timestamps');

      console.log('All AI content generated successfully!');
      
      // Show final completion message
      setTimeout(() => {
        showNotification('All AI content generated successfully! Summary, Description, and Timestamps have been updated.', 'success');
      }, 200);
      
      // Reset progress after a short delay to show completion
      setTimeout(() => {
        setGenerationProgress({
          description: 0,
          summary: 0,
          timestamps: 0
        });
      }, 1500);
      
    } catch (error) {
      console.error('Error generating AI content:', error);
      alert(`Error generating AI content: ${error.message}`);
      
    } finally {
      // Reset all generation states
      setIsGenerating({
        description: false,
        summary: false,
        timestamps: false
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

  const handleVideoReady = () => {
    setVideoLoading(false);
    setVideoReady(true);
    setVideoError(false);
  };

  const handleVideoError = (error) => {
    console.error('Video player error:', error);
    setVideoLoading(false);
    setVideoError(true);
    setVideoReady(false);
  };

  const handleVideoStart = () => {
    setVideoLoading(false);
  };

  const handleRetryVideo = () => {
    setVideoError(false);
    setVideoLoading(true);
    setVideoReady(false);
  };

  const showUpdateSuccess = (type) => {
    setUpdateStatus(prev => ({ ...prev, [type]: true }));
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

          {/* AI Content Generation Section */}
          <div className="ai-content-section">
            <div className="ai-content-header">
              <h3>AI Content Generation</h3>
              <button
                type="button"
                className="generate-all-btn"
                onClick={generateAllAIContent}
                disabled={isGenerating.summary || isGenerating.description || isGenerating.timestamps}
              >
                <FaRobot /> Generate All Content with AI
              </button>
            </div>
            
            {/* Progress Bar for Generate All Content */}
            {(isGenerating.summary && isGenerating.description && isGenerating.timestamps) && (
              <div className="ai-progress-overview">
                <div className="progress-container">
                  <div className="progress-header">
                    <h3>AI Content Generation in Progress</h3>
                    <div className="progress-stats">
                      <span className="progress-percentage">
                        {Math.round((generationProgress.summary + generationProgress.description + generationProgress.timestamps) / 3)}%
                      </span>
                    </div>
                  </div>
                  <div className="progress-bar">
                    <div 
                      className="progress-fill" 
                      style={{ 
                        width: `${(generationProgress.summary + generationProgress.description + generationProgress.timestamps) / 3}%` 
                      }}
                    ></div>
                  </div>
                  <div className="progress-steps">
                    <div className={`step ${generationProgress.summary >= 100 ? 'completed' : ''}`}>
                      <span className="step-icon">1</span>
                      <span className="step-text">Generate Summary</span>
                    </div>
                    <div className={`step ${generationProgress.description >= 100 ? 'completed' : ''}`}>
                      <span className="step-icon">2</span>
                      <span className="step-text">Generate Description</span>
                    </div>
                    <div className={`step ${generationProgress.timestamps >= 100 ? 'completed' : ''}`}>
                      <span className="step-icon">3</span>
                      <span className="step-text">Generate Timestamps</span>
                    </div>
                    <div className={`step ${(generationProgress.summary + generationProgress.description + generationProgress.timestamps) / 3 >= 99 ? 'completed' : ''}`}>
                      <span className="step-icon">4</span>
                      <span className="step-text">Finalizing Results</span>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          <div className="video-preview-section">
            <div className="video-player-wrapper">
              {videoLoading && (
                <div className="video-loading">
                  <div className="loading-spinner"></div>
                  <p>Loading video...</p>
                </div>
              )}
              
              {videoError && (
                <div className="video-error">
                  <div className="error-icon">⚠️</div>
                  <p>Failed to load video</p>
                  <small>The video file may be missing or corrupted</small>
                  <button className="retry-btn" onClick={handleRetryVideo}>
                    Try Again
                  </button>
                </div>
              )}
              
              {video?.videoFile && !videoError && (
                <ReactPlayer
                  url={`http://localhost:5000/${video.videoFile}`}
                  width="100%"
                  height="100%"
                  controls={true}
                  onReady={handleVideoReady}
                  onError={handleVideoError}
                  onStart={handleVideoStart}
                  config={{
                    file: {
                      attributes: {
                        crossOrigin: "anonymous"
                      },
                      forceVideo: true,
                      forceHLS: false,
                      forceDASH: false
                    }
                  }}
                  style={{ display: videoLoading ? 'none' : 'block' }}
                />
              )}
              
              {!video?.videoFile && (
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
                  {updateStatus.summary && (
                    <span className="update-indicator">✓ Updated</span>
                  )}
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
                  <div className="progress-container">
                    <div className="progress-header">
                      <span className="progress-label">Generating Summary</span>
                      <span className="progress-percentage">{generationProgress.summary}%</span>
                    </div>
                    <div className="progress-bar">
                      <div 
                        className="progress-fill" 
                        style={{ width: `${generationProgress.summary}%` }}
                      ></div>
                    </div>
                  </div>
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
                  <div className="description-header-left">
                    <label htmlFor="description">Description</label>
                    {updateStatus.description && (
                      <span className="update-indicator">✓ Updated</span>
                    )}
                  </div>
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
                    <div className="progress-container">
                      <div className="progress-header">
                        <span className="progress-label">Generating Description</span>
                        <span className="progress-percentage">{generationProgress.description}%</span>
                      </div>
                      <div className="progress-bar">
                        <div 
                          className="progress-fill" 
                          style={{ width: `${generationProgress.description}%` }}
                        ></div>
                      </div>
                    </div>
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
                    {updateStatus.timestamps && (
                      <span className="update-indicator">✓ Updated</span>
                    )}
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
                    <div className="progress-container">
                      <div className="progress-header">
                        <span className="progress-label">Generating Timestamps</span>
                        <span className="progress-percentage">{generationProgress.timestamps}%</span>
                      </div>
                      <div className="progress-bar">
                        <div 
                          className="progress-fill" 
                          style={{ width: `${generationProgress.timestamps}%` }}
                        ></div>
                      </div>
                    </div>
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
          
          {/* Custom Notification Popup */}
          {notification.show && (
            <div className={`notification-popup ${notification.type}`}>
              <div className="notification-content">
                <div className="notification-icon">
                  {notification.type === 'success' ? '✓' : '⚠️'}
                </div>
                <div className="notification-message">
                  {notification.message}
                </div>
                <button 
                  className="notification-close"
                  onClick={() => setNotification({ show: false, message: '', type: 'success' })}
                >
                  ×
                </button>
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
};

export default VideoEditPage; 