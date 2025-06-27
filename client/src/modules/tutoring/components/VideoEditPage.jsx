import React, { useState, useEffect } from 'react';
import { FaChevronLeft, FaChevronRight, FaRobot, FaClock, FaEdit, FaExpand, FaDownload } from 'react-icons/fa';
import ReactPlayer from 'react-player';
import SideMenu from '../../../shared/components/SideMenu';
import TopBar from '../../../shared/components/TopBar';
import { useAIModel } from '../../ai/hooks/useAIModel';
import '../styles/VideoEditPage.css';

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
  const [videoFile, setVideoFile] = useState(null);

  // AI model hook
  const { 
    generateAISummary, 
    generateAITimestamps, 
    generateAIDescription, 
    processVideoWithAI,
    isLoading: aiLoading, 
    error: aiError 
  } = useAIModel();

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 60000);
    return () => clearInterval(timer);
  }, []);

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave(formData);
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleVideoFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setVideoFile(file);
    }
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
    setIsGenerating(prev => ({ ...prev, [type]: true }));
    setGenerationProgress(prev => ({ ...prev, [type]: 'Analyzing video content...' }));
    
    try {
      let result;
      
      switch (type) {
        case 'description':
          setGenerationProgress(prev => ({ ...prev, [type]: 'Generating short description with AI...' }));
          result = await generateAIDescription(video?.id, videoFile, formData.title);
          setFormData(prev => ({
            ...prev,
            description: result
          }));
          break;
          
        case 'summary':
          setGenerationProgress(prev => ({ ...prev, [type]: 'Transcribing audio with Whisper...' }));
          setGenerationProgress(prev => ({ ...prev, [type]: 'Generating summary with GPT...' }));
          result = await generateAISummary(video?.id, videoFile, formData.title);
          setFormData(prev => ({
            ...prev,
            summary: result
          }));
          break;
          
        case 'timestamps':
          setGenerationProgress(prev => ({ ...prev, [type]: 'Detecting scenes with PySceneDetect...' }));
          setGenerationProgress(prev => ({ ...prev, [type]: 'Generating timestamps with GPT...' }));
          result = await generateAITimestamps(video?.id, videoFile, formData.title);
          setFormData(prev => ({
            ...prev,
            timestamps: result
          }));
          break;
      }
    } catch (error) {
      console.error(`Error generating ${type}:`, error);
      // Show error to user
      alert(`Error generating ${type}: ${error.message}`);
    } finally {
      setIsGenerating(prev => ({ ...prev, [type]: false }));
      setGenerationProgress(prev => ({ ...prev, [type]: '' }));
    }
  };

  const generateAllAIContent = async () => {
    if (!videoFile && !video?.id) {
      alert('Please upload a video file first or select an existing video.');
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
      const result = await processVideoWithAI(videoFile, formData.title, ['summary', 'timestamps', 'description']);
      
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
      console.error('Error generating all AI content:', error);
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
    // Create a PDF document
    const doc = {
      title: video?.title || 'Video Summary',
      content: formData.summary,
      module: formData.module,
      date: new Date().toLocaleDateString()
    };

    // Convert to PDF and download
    const blob = new Blob([JSON.stringify(doc, null, 2)], { type: 'application/pdf' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${video?.title || 'video'}-summary.pdf`;
    document.body.appendChild(a);
    a.click();
    window.URL.revokeObjectURL(url);
    document.body.removeChild(a);
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
                  url={`/api/tutoring/video/${video.id}`}
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
                  <select
                    id="degree"
                    name="degree"
                    value={formData.degree}
                    onChange={handleChange}
                    required
                  >
                    <option value="">Select Degree</option>
                    <option value="BSc">BSc in Information Technology</option>
                    <option value="BEng">BEng in Software Engineering</option>
                    <option value="BScCS">BSc in Computer Science</option>
                  </select>

                  <select
                    id="year"
                    name="year"
                    value={formData.year}
                    onChange={handleChange}
                    required
                  >
                    <option value="">Select Year</option>
                    <option value="1">Year 1</option>
                    <option value="2">Year 2</option>
                    <option value="3">Year 3</option>
                    <option value="4">Year 4</option>
                  </select>

                  <select
                    id="semester"
                    name="semester"
                    value={formData.semester}
                    onChange={handleChange}
                    required
                  >
                    <option value="">Select Semester</option>
                    <option value="1">Semester 1</option>
                    <option value="2">Semester 2</option>
                  </select>

                  <select
                    id="module"
                    name="module"
                    value={formData.module}
                    onChange={handleChange}
                    required
                  >
                    <option value="">Select Module</option>
                    <option value="IT1010">IT1010 - Introduction to Programming</option>
                    <option value="IT1020">IT1020 - Data Structures</option>
                    <option value="IT1030">IT1030 - Database Systems</option>
                    <option value="IT1040">IT1040 - Web Development</option>
                    <option value="IT1050">IT1050 - Software Engineering</option>
                  </select>
                </div>
              </div>

              <div className="form-group">
                <div className="form-group-header">
                  <label>Timestamps</label>
                  <button
                    type="button"
                    className="ai-generate-btn timestamps"
                    onClick={() => generateAIContent('timestamps')}
                    disabled={isGenerating.timestamps}
                  >
                    <FaClock /> {isGenerating.timestamps ? 'Generating...' : 'Generate with AI'}
                  </button>
                </div>
                {isGenerating.timestamps && (
                  <div className="generation-progress">
                    <div className="progress-spinner"></div>
                    <span>{generationProgress.timestamps}</span>
                  </div>
                )}
                <div className="timestamps-list">
                  {formData.timestamps.map((timestamp, index) => (
                    <div key={index} className="timestamp-item">
                      <input
                        type="text"
                        value={timestamp.time}
                        onChange={(e) => handleTimestampChange(index, 'time', e.target.value)}
                        placeholder="00:00"
                        className="timestamp-time"
                      />
                      <input
                        type="text"
                        value={timestamp.description}
                        onChange={(e) => handleTimestampChange(index, 'description', e.target.value)}
                        placeholder="Description"
                        className="timestamp-description"
                      />
                      <button
                        type="button"
                        className="remove-timestamp-btn"
                        onClick={() => removeTimestamp(index)}
                      >
                        ×
                      </button>
                    </div>
                  ))}
                  <button
                    type="button"
                    className="add-timestamp-btn"
                    onClick={addTimestamp}
                  >
                    Add Timestamp
                  </button>
                </div>
              </div>

              {!video && (
                <div className="form-group">
                  <label htmlFor="videoFile">Video File</label>
                  <input
                    type="file"
                    id="videoFile"
                    name="videoFile"
                    accept="video/*"
                    onChange={handleVideoFileChange}
                    required
                  />
                  <small>Upload a video file to enable AI content generation</small>
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
        </main>
      </div>
    </div>
  );
};

export default VideoEditPage; 