import React from 'react';
import { FaClock, FaTimes } from 'react-icons/fa';
import { useAIModel } from '../hooks/useAIModel';

const AITimestampsGenerator = ({ videoId, hasTimestamps, onTimestampsGenerated, onTimestampsRemoved }) => {
  const { generateAITimestamps, isLoading, error } = useAIModel();

  const handleGenerate = async () => {
    try {
      const timestamps = await generateAITimestamps(videoId);
      onTimestampsGenerated(timestamps);
    } catch (error) {
      console.error('Error generating timestamps:', error);
    }
  };

  const handleRemove = () => {
    if (window.confirm('Are you sure you want to remove the AI-generated timestamps?')) {
      onTimestampsRemoved();
    }
  };

  return (
    <div className="ai-generator">
      {!hasTimestamps ? (
        <button 
          className="ai-btn"
          onClick={handleGenerate}
          disabled={isLoading}
        >
          <FaClock /> {isLoading ? 'Generating...' : 'Generate Timestamps'}
        </button>
      ) : (
        <button 
          className="ai-btn remove"
          onClick={handleRemove}
        >
          <FaTimes /> Remove Timestamps
        </button>
      )}
      {error && <p className="error-message">{error}</p>}
    </div>
  );
};

export default AITimestampsGenerator; 