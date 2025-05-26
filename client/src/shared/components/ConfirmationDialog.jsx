import React from 'react';
import { FaExclamationTriangle, FaTimes } from 'react-icons/fa';
import '../styles/ConfirmationDialog.css';

const ConfirmationDialog = ({ 
  isOpen, 
  onClose, 
  onConfirm, 
  title, 
  message, 
  confirmText = 'Confirm', 
  cancelText = 'Cancel',
  type = 'warning' // warning, danger, info
}) => {
  if (!isOpen) return null;

  const getIcon = () => {
    switch (type) {
      case 'danger':
        return <FaExclamationTriangle className="danger-icon" />;
      case 'info':
        return <FaExclamationTriangle className="info-icon" />;
      default:
        return <FaExclamationTriangle className="warning-icon" />;
    }
  };

  return (
    <div className="confirmation-dialog-overlay">
      <div className="confirmation-dialog">
        <button className="confirmation-dialog-close" onClick={onClose}>
          <FaTimes />
        </button>
        
        <div className="confirmation-dialog-icon">
          {getIcon()}
        </div>

        <div className="confirmation-dialog-content">
          <h3>{title}</h3>
          <p>{message}</p>
        </div>

        <div className="confirmation-dialog-actions">
          <button 
            className="confirmation-dialog-cancel" 
            onClick={onClose}
          >
            {cancelText}
          </button>
          <button 
            className={`confirmation-dialog-confirm ${type}`}
            onClick={onConfirm}
          >
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ConfirmationDialog; 