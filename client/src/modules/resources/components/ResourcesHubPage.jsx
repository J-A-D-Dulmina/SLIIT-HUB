import React, { useState, useEffect } from 'react';
import { FaChevronLeft, FaChevronRight, FaUpload } from 'react-icons/fa';
import SideMenu from '../../../shared/components/SideMenu';
import TopBar from '../../../shared/components/TopBar';
import ResourcesPage from './ResourcesPage.jsx';

const ResourcesHubPage = () => {
  const [collapsed, setCollapsed] = useState(false);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [activeTab, setActiveTab] = useState('my'); // 'my' | 'public'
  const [uploadTrigger, setUploadTrigger] = useState(0);
  const onOpenUpload = React.useCallback(() => setUploadTrigger(t => t + 1), []);

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
            onClick={() => setCollapsed(v => !v)}
            aria-label="Toggle sidebar"
          >
            {collapsed ? <FaChevronRight /> : <FaChevronLeft />}
          </button>
        </div>
        <TopBar currentTime={currentTime} />

        <main className="resources-page">
          <div className="page-header" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <h1>Resources</h1>
            {activeTab !== 'public' && (
              <button
                className="upload-btn"
                onClick={onOpenUpload}
              >
                <FaUpload /> Add Resource
              </button>
            )}
          </div>

          <div className="tabs" style={{ display: 'flex', gap: 12, marginBottom: 16 }}>
            <button
              className={`tab ${activeTab === 'my' ? 'active' : ''}`}
              onClick={() => setActiveTab('my')}
            >
              My Resources
            </button>
            <button
              className={`tab ${activeTab === 'public' ? 'active' : ''}`}
              onClick={() => setActiveTab('public')}
            >
              Public Resources
            </button>
          </div>

          <ResourcesPage mode={activeTab} embedded openUploadTrigger={uploadTrigger} />
        </main>
      </div>
    </div>
  );
};

export default ResourcesHubPage;


