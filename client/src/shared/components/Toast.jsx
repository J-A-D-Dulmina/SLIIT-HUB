import React from 'react';
import '../styles/Toast.css';

const Toast = ({ message, onClose }) => {
  if (!message) return null;
  return (
    <div className="toast-popup">
      {message}
      <button className="toast-close" onClick={onClose}>&times;</button>
    </div>
  );
};

export default Toast; 