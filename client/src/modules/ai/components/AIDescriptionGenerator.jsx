import React from 'react';
import { FaRobot, FaTimes } from 'react-icons/fa';
import { useAIModel } from '../hooks/useAIModel';

const AIDescriptionGenerator = ({ videoId, hasDescription, onDescriptionGenerated, onDescriptionRemoved }) => {
  const { generateDescription, isLoading, error } = useAIModel();

  const handleGenerate = async () => {
    try {
      const description = await generateDescription(videoId);
      onDescriptionGenerated(description);
    } catch (error) {
      console.error('Error generating description:', error);
    }
  };

  const handleRemove = () => {
    if (window.confirm('Are you sure you want to remove the AI-generated description?')) {
      onDescriptionRemoved();
    }
  };

  return (
    <div className="ai-generator">
      {!hasDescription ? (
        <button 
          className="ai-btn"
          onClick={handleGenerate}
          disabled={isLoading}
        >
          <FaRobot /> {isLoading ? 'Generating...' : 'Generate Description'}
        </button>
      ) : (
        <button 
          className="ai-btn remove"
          onClick={handleRemove}
        >
          <FaTimes /> Remove Description
        </button>
      )}
      {error && <p className="error-message">{error}</p>}
    </div>
  );
};

export default AIDescriptionGenerator; 