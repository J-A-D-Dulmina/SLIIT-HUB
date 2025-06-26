import React, { useState } from 'react';

const initialVideos = [
  { id: 1, title: 'Intro to AI', description: 'Basics of AI', url: '#', status: 'active' },
  { id: 2, title: 'Python Tips', description: 'Advanced Python', url: '#', status: 'active' },
];

const AdminVideosPage = () => {
  const [videos, setVideos] = useState(initialVideos);

  const editVideo = (id) => {
    const title = prompt('New video title?');
    if (title) setVideos(videos.map(v => v.id === id ? { ...v, title } : v));
  };
  const deleteVideo = (id) => setVideos(videos.filter(v => v.id !== id));

  return (
    <div className="admin-videos-page">
      <h2>Manage Videos</h2>
      <ul className="admin-video-list">
        {videos.map(video => (
          <li key={video.id} className="admin-video-card">
            <div className="admin-video-title">{video.title}</div>
            <div className="admin-video-desc">{video.description}</div>
            <div className="admin-video-actions">
              <button onClick={() => editVideo(video.id)} className="admin-edit-btn">Edit</button>
              <button onClick={() => deleteVideo(video.id)} className="admin-delete-btn">Delete</button>
              <a href={video.url} target="_blank" rel="noopener noreferrer" className="admin-view-btn">View</a>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
};

export default AdminVideosPage; 