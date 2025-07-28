import { useState } from 'react';

const SERVER_URL = 'http://localhost:5000';

// NOTE: The backend is now always using gpt-3.5-turbo for all AI completions.
// No need to specify or select model in the frontend.

export const useAIModel = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  // All functions below simply call the backend API, which uses gpt-3.5-turbo
  const generateSummary = async (videoId, options = {}) => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await fetch(`${SERVER_URL}/api/ai/generate-summary`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          videoId,
          ...options
        }),
      });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to generate summary');
      }
      const data = await response.json();
      return data.summary; // Return just the summary text
    } catch (error) {
      setError(error.message);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const generateDescription = async (videoId, options = {}) => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await fetch(`${SERVER_URL}/api/ai/generate-description`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          videoId,
          ...options
        }),
      });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to generate description');
      }
      const data = await response.json();
      return data.description; // Return just the description text
    } catch (error) {
      setError(error.message);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const generateTimestamps = async (videoId, options = {}) => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await fetch(`${SERVER_URL}/api/ai/generate-timestamps`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          videoId,
          ...options
        }),
      });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to generate timestamps');
      }
      const data = await response.json();
      return data.timestamps; // Return just the timestamps array
    } catch (error) {
      setError(error.message);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const detectScenes = async (videoId, options = {}) => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await fetch(`${SERVER_URL}/api/ai/detect-scenes`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          videoId,
          ...options
        }),
      });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to detect scenes');
      }
      const data = await response.json();
      return data;
    } catch (error) {
      setError(error.message);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const processVideoWithAI = async (videoId, options = {}) => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await fetch(`${SERVER_URL}/api/ai/process-video`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          videoId,
          ...options
        }),
      });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to process video');
      }
      const data = await response.json();
      return data;
    } catch (error) {
      setError(error.message);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const testVideoAccess = async (videoId) => {
    try {
      const response = await fetch(`${SERVER_URL}/api/ai/test-video/${videoId}`);
      return await response.json();
    } catch (error) {
      console.error('Error testing video access:', error);
      throw error;
    }
  };

  const healthCheck = async () => {
    try {
      const response = await fetch(`${SERVER_URL}/api/ai/health`);
      return await response.json();
    } catch (error) {
      console.error('Error checking AI service health:', error);
      throw error;
    }
  };

  return {
    isLoading,
    error,
    generateSummary,
    generateDescription,
    generateTimestamps,
    detectScenes,
    processVideoWithAI,
    testVideoAccess,
    healthCheck,
  };
}; 