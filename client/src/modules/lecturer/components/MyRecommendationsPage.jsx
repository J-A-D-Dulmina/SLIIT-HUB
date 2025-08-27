import React, { useEffect, useState } from 'react';
import '../styles/MyRecommendationsPage.css';
import SideMenu from '../../../shared/components/SideMenu';
import TopBar from '../../../shared/components/TopBar';
import { FaChevronLeft, FaChevronRight } from 'react-icons/fa';
import { useNavigate } from 'react-router-dom';
import { lecturerApi } from '../../../services/api';
import ConfirmationDialog from '../../../shared/components/ConfirmationDialog';

const MyRecommendationsPage = () => {
  const [tab, setTab] = useState('pending'); // pending | recommended | rejected | all
  const [videos, setVideos] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [collapsed, setCollapsed] = useState(false);
  const [currentTime, setCurrentTime] = useState(new Date());
  const navigate = useNavigate();
  const [confirmState, setConfirmState] = useState({ open: false, videoId: null, decision: null });
  const [successMsg, setSuccessMsg] = useState('');

  const getDegreeLabel = (v) => {
    const raw = v.degreeDisplay || v.degreeName || (v.degree && (v.degree.name || v.degree.code)) || v.degree;
    if (!raw) return '';
    const asString = String(raw);
    if (/^[a-fA-F0-9]{24}$/.test(asString)) return '';
    return asString;
  };

  const fetchQueue = async (status = 'pending') => {
    try {
      setLoading(true);
      setError('');
      const res = await lecturerApi.reviewQueue(status);
      setVideos(res.data.videos || []);
    } catch (e) {
      setError(e.response?.data?.message || 'Failed to load');
    } finally {
      setLoading(false);
    }
  };

  const updateDecision = async (videoId, decision) => {
    try {
      await lecturerApi.updateDecision(videoId, decision);
      fetchQueue(tab);
      setSuccessMsg(decision === 'recommended' ? 'Video recommended successfully.' : 'Video rejected.');
    } catch (e) {
      alert(e.response?.data?.message || 'Failed to update');
    }
  };

  const viewVideo = (video) => {
    // Navigate to the same route structure used by the module videos page
    // Expecting video.module to be the module identifier
    const moduleId = video.module || 'unknown';
    if (video.id && moduleId) {
      navigate(`/video/${moduleId}/${video.id}`);
    }
  };

  useEffect(() => {
    fetchQueue(tab);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tab]);

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 60000);
    return () => clearInterval(timer);
  }, []);

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

        <div className="my-recommendations-page">
          <h2>Lecturer Review Dashboard</h2>
          <div className="tabs">
            {['pending', 'recommended', 'rejected', 'all'].map(t => (
              <button key={t} className={`tab ${tab === t ? 'active' : ''}`} onClick={() => setTab(t)}>
                {t.charAt(0).toUpperCase() + t.slice(1)}
              </button>
            ))}
          </div>

          {loading && <div>Loading...</div>}
          {error && <div className="error">{error}</div>}

          {!loading && !error && (
            <ul className="recommendation-list">
              {videos.length === 0 && <div>No items.</div>}
              {videos.map(v => (
                <li key={v.id} className={`recommendation-card ${v.reviewStatus || 'pending'}`}>
                  <div className="rec-main">
                    <div className="rec-thumb" onClick={() => viewVideo(v)} role="button" tabIndex={0} onKeyDown={(e) => { if (e.key === 'Enter') viewVideo(v); }}>
                      {v.thumbnail ? (
                        <img src={`http://localhost:5000/${v.thumbnail}`} alt={v.title} />
                      ) : (
                        <div className="placeholder">📹</div>
                      )}
                    </div>
                    <div className="rec-info">
                      <h3 onClick={() => viewVideo(v)} role="button">{v.title}</h3>
                      {v.studentName && (
                        <div className="subtle" style={{ marginBottom: 6 }}>Owner: {v.studentName}</div>
                      )}
                      {/* Hide summary/description per request */}
                      <div className="meta">
                        {getDegreeLabel(v) && <span>{getDegreeLabel(v)}</span>}
                        <span>Year {v.year}</span>
                        <span>Sem {v.semester}</span>
                        <span>{v.module}</span>
                        {(v.publishDate || v.addDate) && (
                          <span className="subtle">{new Date(v.publishDate || v.addDate).toLocaleDateString()}</span>
                        )}
                      </div>
                      <div className="tags">
                        {v.reviewStatus && (
                          <span className={`tag status-${v.reviewStatus}`}>{v.reviewStatus}</span>
                        )}
                        {v.aiFeatures?.summary && <span className="tag ai">AI Summary</span>}
                        {v.aiFeatures?.timestamps && <span className="tag ai">AI Timestamps</span>}
                        {v.aiFeatures?.lecturerRecommended && <span className="tag ai">Lecturer Recommended</span>}
                      </div>
                      {v.reviewNote && (
                        <div style={{ marginTop: 6, color: '#475569', fontSize: '0.85rem' }}>
                          <strong>Student note:</strong> {v.reviewNote}
                        </div>
                      )}
                    </div>
                    <div className="rec-actions">
                      <button className="rec-btn view" onClick={() => viewVideo(v)}>View</button>
                      {v.reviewStatus !== 'recommended' && (
                        <button className="rec-btn approve" onClick={() => setConfirmState({ open: true, videoId: v.id, decision: 'recommended' })}>Recommend</button>
                      )}
                      {v.reviewStatus !== 'rejected' && (
                        <button className="rec-btn reject" onClick={() => setConfirmState({ open: true, videoId: v.id, decision: 'rejected' })}>Reject</button>
                      )}
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          )}
          <ConfirmationDialog
            isOpen={confirmState.open}
            onClose={() => setConfirmState({ open: false, videoId: null, decision: null })}
            onConfirm={() => {
              const { videoId, decision } = confirmState;
              setConfirmState({ open: false, videoId: null, decision: null });
              if (videoId && decision) updateDecision(videoId, decision);
            }}
            title={confirmState.decision === 'recommended' ? 'Confirm Recommendation' : 'Confirm Rejection'}
            message={confirmState.decision === 'recommended' ? 'Are you sure you want to recommend this video?' : 'Are you sure you want to reject this video?'}
            confirmText={confirmState.decision === 'recommended' ? 'Recommend' : 'Reject'}
            type={confirmState.decision === 'recommended' ? 'info' : 'danger'}
          />
          {successMsg && (
            <div className="success-banner" role="status" onAnimationEnd={() => setSuccessMsg('')}>
              {successMsg}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default MyRecommendationsPage;