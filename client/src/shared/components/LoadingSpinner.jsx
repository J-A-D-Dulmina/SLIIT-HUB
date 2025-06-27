import React from 'react';
import '../styles/LoadingSpinner.css';

const LoadingSpinner = ({ message = 'Loading...', size = 'medium' }) => {
  return (
    <div className={`loading-container ${size}`}>
      <div className="loading-spinner"></div>
      {message && <p className="loading-message">{message}</p>}
    </div>
  );
};

export default LoadingSpinner; 