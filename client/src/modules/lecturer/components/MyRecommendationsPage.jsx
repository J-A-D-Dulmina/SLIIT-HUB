import React, { useState } from 'react';
import '../styles/MyRecommendationsPage.css';

// Mock data for recommended videos
const initialRecommendations = [
  {
    id: 1,
    title: 'Deep Learning Basics',
    status: 'recommended',
    description: 'An introduction to deep learning concepts and neural networks.',
    videoUrl: '#',
  },
  {
    id: 2,
    title: 'Advanced Python Tips',
    status: 'not_recommended',
    description: 'Tips and tricks for writing efficient Python code.',
    videoUrl: '#',
  },
];

const MyRecommendationsPage = () => {
  const [recommendations, setRecommendations] = useState(initialRecommendations);

  const toggleRecommendation = (id) => {
    setRecommendations(recommendations.map(rec =>
      rec.id === id ? { ...rec, status: rec.status === 'recommended' ? 'not_recommended' : 'recommended' } : rec
    ));
  };

  const removeRecommendation = (id) => {
    setRecommendations(recommendations.filter(rec => rec.id !== id));
  };

  return (
    <div className="my-recommendations-page">
      <h2>My Recommendations</h2>
      {recommendations.length === 0 ? (
        <div>No recommendations yet.</div>
      ) : (
        <ul className="recommendation-list">
          {recommendations.map(rec => (
            <li key={rec.id} className={`recommendation-card ${rec.status}`}>
              <h3>{rec.title}</h3>
              <p>{rec.description}</p>
              <div className="rec-actions">
                <button onClick={() => toggleRecommendation(rec.id)} className={`rec-btn ${rec.status}`}>{rec.status === 'recommended' ? 'Recommended' : 'Not Recommended'}</button>
                <button onClick={() => removeRecommendation(rec.id)} className="rec-btn remove">Remove</button>
                <a href={rec.videoUrl} target="_blank" rel="noopener noreferrer" className="rec-btn view" style={{ marginLeft: 'auto' }}>View Video</a>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

export default MyRecommendationsPage; 