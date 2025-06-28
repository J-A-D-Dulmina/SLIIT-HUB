import React from 'react';
import { FaRobot, FaTimes } from 'react-icons/fa';
import { useAIModel } from '../hooks/useAIModel';

const AISummaryGenerator = ({ videoId, hasSummary, onSummaryGenerated, onSummaryRemoved }) => {
  const { generateSummary, isLoading, error } = useAIModel();

  const handleGenerate = async () => {
    try {
      const summary = await generateSummary(videoId);
      onSummaryGenerated(summary);
    } catch (error) {
      console.error('Error generating summary:', error);
    }
  };

  const handleRemove = () => {
    if (window.confirm('Are you sure you want to remove the AI-generated summary?')) {
      onSummaryRemoved();
    }
  };

  return (
    <div className="ai-generator">
      {!hasSummary ? (
        <button 
          className="ai-btn"
          onClick={handleGenerate}
          disabled={isLoading}
        >
          <FaRobot /> {isLoading ? 'Generating...' : 'Generate Summary'}
        </button>
      ) : (
        <button 
          className="ai-btn remove"
          onClick={handleRemove}
        >
          <FaTimes /> Remove Summary
        </button>
      )}
      {error && <p className="error-message">{error}</p>}
    </div>
  );
};

export default AISummaryGenerator; 