import React, { useState, useEffect } from 'react';
import { FaChevronLeft, FaChevronRight, FaUpload, FaFileAlt, FaUser, FaCalendarAlt, FaPercentage, FaExclamationTriangle, FaGraduationCap, FaEye, FaTimes, FaHistory, FaClock, FaCheckCircle, FaTimesCircle, FaRedo } from 'react-icons/fa';
import SideMenu from '../../../shared/components/SideMenu';
import TopBar from '../../../shared/components/TopBar';
import '../styles/AIToolPage.css';

const AIToolPage = () => {
  const [collapsed, setCollapsed] = useState(false);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [selectedFile, setSelectedFile] = useState(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisResult, setAnalysisResult] = useState(null);
  const [highlightedText, setHighlightedText] = useState('');
  const [similarDocuments, setSimilarDocuments] = useState([]);
  const [showPreview, setShowPreview] = useState(false);
  const [previewContent, setPreviewContent] = useState('');
  const [previewUrl, setPreviewUrl] = useState(null);
  const [checkHistory, setCheckHistory] = useState([
    {
      id: 1,
      fileName: 'Web Development Assignment.pdf',
      checkDate: '2024-03-15T10:30:00',
      similarityScore: 15,
      status: 'passed',
      module: 'IT1040',
      degree: 'BSc (Hons) in IT'
    },
    {
      id: 2,
      fileName: 'Database Systems Report.docx',
      checkDate: '2024-03-14T15:45:00',
      similarityScore: 35,
      status: 'failed',
      module: 'IT1030',
      degree: 'BSc (Hons) in IT'
    },
    {
      id: 3,
      fileName: 'Software Engineering Project.pdf',
      checkDate: '2024-03-13T09:15:00',
      similarityScore: 8,
      status: 'passed',
      module: 'IT2020',
      degree: 'BSc (Hons) in IT'
    }
  ]);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 60000);
    return () => clearInterval(timer);
  }, []);

  const handleFileSelect = (event) => {
    const file = event.target.files[0];
    if (file) {
      setSelectedFile(file);
      setAnalysisResult(null);
      setHighlightedText('');
      setSimilarDocuments([]);
      
      // Create object URL for preview
      const url = URL.createObjectURL(file);
      setPreviewUrl(url);

      // Only read text content for non-PDF files
      if (!file.type.includes('pdf')) {
        const reader = new FileReader();
        reader.onload = (e) => {
          setPreviewContent(e.target.result);
        };
        reader.readAsText(file);
      }
    }
  };

  // Cleanup object URL when component unmounts or file changes
  useEffect(() => {
    return () => {
      if (previewUrl) {
        URL.revokeObjectURL(previewUrl);
      }
    };
  }, [previewUrl]);

  const handleAnalyze = async () => {
    if (!selectedFile) return;

    setIsAnalyzing(true);
    // Simulate API call for analysis
    setTimeout(() => {
      // Enhanced analysis result with detailed matches
      const result = {
        similarityScore: 35,
        matches: [
          {
            id: 1,
            title: 'Web Development Assignment 2024',
            author: 'John Smith',
            publishDate: '2024-02-15',
            similarity: 25,
            module: 'IT1040',
            degree: 'BSc (Hons) in IT',
            matchedSections: [
              {
                start: 0,
                end: 150,
                text: "The implementation of RESTful APIs requires careful consideration of HTTP methods and status codes. Proper error handling and validation are essential for robust API design.",
                similarity: 95
              },
              {
                start: 300,
                end: 450,
                text: "Database normalization is crucial for maintaining data integrity and reducing redundancy. The process involves organizing data into tables and establishing relationships between them.",
                similarity: 85
              }
            ]
          },
          {
            id: 2,
            title: 'Database Systems Project',
            author: 'Sarah Johnson',
            publishDate: '2024-01-20',
            similarity: 15,
            module: 'IT1030',
            degree: 'BSc (Hons) in IT',
            matchedSections: [
              {
                start: 600,
                end: 750,
                text: "SQL queries should be optimized for performance. Indexing and proper query structure can significantly improve database response times.",
                similarity: 75
              }
            ]
          }
        ],
        documentContent: `The implementation of RESTful APIs requires careful consideration of HTTP methods and status codes. Proper error handling and validation are essential for robust API design.

Database normalization is crucial for maintaining data integrity and reducing redundancy. The process involves organizing data into tables and establishing relationships between them.

When designing a web application, security should be a top priority. Implementing proper authentication and authorization mechanisms is essential.

SQL queries should be optimized for performance. Indexing and proper query structure can significantly improve database response times.`
      };

      // Add to history
      const newCheck = {
        id: checkHistory.length + 1,
        fileName: selectedFile.name,
        checkDate: new Date().toISOString(),
        similarityScore: result.similarityScore,
        status: result.similarityScore > 30 ? 'failed' : 'passed',
        module: 'Current Module',
        degree: 'Current Degree'
      };
      setCheckHistory([newCheck, ...checkHistory]);

      setAnalysisResult(result);
      setHighlightedText(result.documentContent);
      setSimilarDocuments(result.matches);
      setIsAnalyzing(false);
    }, 2000);
  };

  const togglePreview = () => {
    setShowPreview(!showPreview);
  };

  const handleViewAgain = (check) => {
    // Create a complete analysis result object with matches
    const result = {
      similarityScore: check.similarityScore,
      matches: [
        {
          id: 1,
          title: check.fileName,
          author: 'Previous Author',
          publishDate: check.checkDate,
          similarity: check.similarityScore,
          module: check.module,
          degree: check.degree,
          matchedSections: [
            {
              start: 0,
              end: 150,
              text: `This is a previously checked document from ${formatDate(check.checkDate)}. 
              The document had a similarity score of ${check.similarityScore}%.
              This is a sample of the matched content that was found.`,
              similarity: check.similarityScore
            }
          ]
        }
      ],
      documentContent: `This is a previously checked document from ${formatDate(check.checkDate)}. 
      The document had a similarity score of ${check.similarityScore}%.
      This is a sample of the matched content that was found.`
    };

    setAnalysisResult(result);
    setHighlightedText(result.documentContent);
    setSimilarDocuments(result.matches);
  };

  const renderSimilarDocuments = () => {
    if (!similarDocuments.length) return null;

    return (
      <div className="similar-documents">
        <h3>Similar Documents Found</h3>
        <div className="documents-list">
          {similarDocuments.map(doc => (
            <div key={doc.id} className="document-card">
              <div className="document-header">
                <h4>{doc.title}</h4>
                <span className="similarity-badge" style={{
                  backgroundColor: doc.similarity > 20 ? '#ef4444' : '#f59e0b'
                }}>
                  {doc.similarity}% Similar
                </span>
              </div>
              <div className="document-details">
                <div className="detail-item">
                  <FaUser className="icon" />
                  <span>{doc.author}</span>
                </div>
                <div className="detail-item">
                  <FaCalendarAlt className="icon" />
                  <span>{new Date(doc.publishDate).toLocaleDateString()}</span>
                </div>
                <div className="detail-item">
                  <FaFileAlt className="icon" />
                  <span>{doc.module}</span>
                </div>
                <div className="detail-item">
                  <FaGraduationCap className="icon" />
                  <span>{doc.degree}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  };

  const renderPreview = () => {
    if (!selectedFile) return null;

    if (selectedFile.type.includes('pdf')) {
      return (
        <div className="pdf-preview">
          <iframe
            src={previewUrl}
            title="PDF Preview"
            className="pdf-viewer"
          />
        </div>
      );
    }

    return (
      <div className="preview-content">
        {previewContent.split('\n').map((line, index) => (
          <p key={index}>{line}</p>
        ))}
      </div>
    );
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const renderHistory = () => (
    <div className="check-history">
      <div className="history-header">
        <h3>
          <FaHistory className="icon" />
          Check History
        </h3>
      </div>
      <div className="history-list">
        {checkHistory.map(check => (
          <div key={check.id} className="history-item">
            <div className="history-item-header">
              <div className="file-info">
                <FaFileAlt className="icon" />
                <span className="file-name">{check.fileName}</span>
              </div>
              <div className="history-actions">
                <button 
                  className="view-again-btn"
                  onClick={() => handleViewAgain(check)}
                  title="View this check again"
                >
                  <FaRedo className="icon" />
                  <span>View Again</span>
                </button>
                <div className="check-status" data-status={check.status}>
                  {check.status === 'passed' ? (
                    <FaCheckCircle className="icon" />
                  ) : (
                    <FaTimesCircle className="icon" />
                  )}
                  <span>{check.status === 'passed' ? 'Passed' : 'Failed'}</span>
                </div>
              </div>
            </div>
            <div className="history-item-details">
              <div className="detail-row">
                <div className="detail-item">
                  <FaClock className="icon" />
                  <span>{formatDate(check.checkDate)}</span>
                </div>
                <div className="detail-item">
                  <FaPercentage className="icon" />
                  <span className="similarity-score" data-score={check.similarityScore}>
                    {check.similarityScore}% Similarity
                  </span>
                </div>
              </div>
              <div className="detail-row">
                <div className="detail-item">
                  <FaFileAlt className="icon" />
                  <span>{check.module}</span>
                </div>
                <div className="detail-item">
                  <FaGraduationCap className="icon" />
                  <span>{check.degree}</span>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  const renderMatchedSections = (matches) => {
    if (!matches || !Array.isArray(matches)) return null;
    
    return matches.map((match, matchIndex) => (
      <div key={match.id} className="match-details">
        <div className="match-header">
          <h4>{match.title}</h4>
          <div className="match-meta">
            <span className="match-author">
              <FaUser className="icon" />
              {match.author}
            </span>
            <span className="match-date">
              <FaCalendarAlt className="icon" />
              {new Date(match.publishDate).toLocaleDateString()}
            </span>
            <span className="match-module">
              <FaFileAlt className="icon" />
              {match.module}
            </span>
          </div>
        </div>
        <div className="match-sections">
          {match.matchedSections && match.matchedSections.map((section, sectionIndex) => (
            <div 
              key={sectionIndex} 
              className="matched-section"
              data-similarity={section.similarity}
            >
              <div className="section-header">
                <span className="section-number">Match #{sectionIndex + 1}</span>
                <span className="section-similarity">{section.similarity}% Similar</span>
              </div>
              <div className="section-content">
                <p>{section.text}</p>
                <div className="section-location">
                  <span>Location: Characters {section.start}-{section.end}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    ));
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
        <main className="ai-tool-page">
          <div className="page-header">
            <h1>AI Plagiarism Detection</h1>
            <div className="header-right">
              <div className="upload-section">
                <input
                  type="file"
                  id="document-upload"
                  accept=".doc,.docx,.pdf,.txt"
                  onChange={handleFileSelect}
                  className="file-input"
                />
                <label htmlFor="document-upload" className="upload-btn">
                  <FaUpload /> Choose Document
                </label>
                {selectedFile && (
                  <button
                    className="analyze-btn"
                    onClick={handleAnalyze}
                    disabled={isAnalyzing}
                  >
                    {isAnalyzing ? 'Analyzing...' : 'Analyze Document'}
                  </button>
                )}
              </div>
            </div>
          </div>

          <div className="content-container">
            {selectedFile && (
              <div className="file-info">
                <div className="file-info-header">
                  <div className="file-info-left">
                    <FaFileAlt className="file-icon" />
                    <div className="file-details">
                      <span className="file-name">{selectedFile.name}</span>
                      <span className="file-size">
                        ({(selectedFile.size / 1024).toFixed(1)} KB)
                      </span>
                    </div>
                  </div>
                  <div className="file-info-actions">
                    <button 
                      className="preview-btn"
                      onClick={togglePreview}
                      title={showPreview ? "Hide Preview" : "Show Preview"}
                    >
                      {showPreview ? <FaTimes /> : <FaEye />}
                      <span>{showPreview ? "Hide Preview" : "Preview"}</span>
                    </button>
                  </div>
                </div>
                {showPreview && (
                  <div className="file-preview">
                    <div className="preview-header">
                      <h3>Document Preview</h3>
                      <span className="preview-type">{selectedFile.type || 'text/plain'}</span>
                    </div>
                    {renderPreview()}
                  </div>
                )}
              </div>
            )}

            {isAnalyzing && (
              <div className="analysis-progress">
                <div className="progress-spinner"></div>
                <p>Analyzing document for plagiarism...</p>
              </div>
            )}

            {analysisResult && (
              <div className="analysis-results">
                <div className="similarity-score">
                  <div className="score-circle" style={{
                    backgroundColor: analysisResult.similarityScore > 30 ? '#ef4444' : '#f59e0b'
                  }}>
                    <span className="score-value">{analysisResult.similarityScore}%</span>
                    <span className="score-label">Similarity</span>
                  </div>
                  {analysisResult.similarityScore > 30 && (
                    <div className="warning-message">
                      <FaExclamationTriangle />
                      <span>High similarity detected! Please review the matched sections below.</span>
                    </div>
                  )}
                </div>

                <div className="matches-container">
                  <h3>Matched Content</h3>
                  <div className="matches-list">
                    {analysisResult.matches && renderMatchedSections(analysisResult.matches)}
                  </div>
                </div>

                <div className="document-preview">
                  <h3>Document Preview</h3>
                  <div className="preview-content">
                    {highlightedText.split('\n').map((paragraph, index) => (
                      <p key={index}>{paragraph}</p>
                    ))}
                  </div>
                </div>

                {renderSimilarDocuments()}
              </div>
            )}

            {renderHistory()}
          </div>
        </main>
      </div>
    </div>
  );
};

export default AIToolPage; 