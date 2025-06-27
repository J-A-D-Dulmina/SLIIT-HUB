import { useState } from 'react';

const SERVER_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';

export const useAIModel = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  const generateAISummary = async (videoId, videoTitle = '') => {
    setIsLoading(true);
    setError(null);
    
    console.log('🔍 Frontend generateAISummary called with:', { videoId, videoTitle });
    
    try {
      const requestBody = {
        videoId,
        videoTitle
      };
      
      console.log('📤 Sending request to:', `${SERVER_URL}/api/ai/generate-summary`);
      console.log('📤 Request body:', requestBody);
      
      const response = await fetch(`${SERVER_URL}/api/ai/generate-summary`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
      });
      
      console.log('📥 Response status:', response.status);
      
      if (!response.ok) {
        const errorData = await response.json();
        console.error('❌ Server error response:', errorData);
        throw new Error(errorData.error || 'Failed to generate summary');
      }
      
      const data = await response.json();
      console.log('✅ Success response:', data);
      return data.summary;
    } catch (err) {
      console.error('❌ Frontend error:', err);
      setError(err.message);
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const generateAIDescription = async (videoId, videoTitle = '') => {
    setIsLoading(true);
    setError(null);
    
    try {
      const response = await fetch(`${SERVER_URL}/api/ai/generate-description`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          videoId,
          videoTitle
        }),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to generate description');
      }
      
      const data = await response.json();
      return data.description;
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const generateAITimestamps = async (videoId, videoTitle = '', useSceneDetection = true) => {
    setIsLoading(true);
    setError(null);
    
    try {
      const response = await fetch(`${SERVER_URL}/api/ai/generate-timestamps`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          videoId,
          videoTitle,
          useSceneDetection
        }),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to generate timestamps');
      }
      
      const data = await response.json();
      return data.timestamps;
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const detectScenes = async (videoId, method = 'content', threshold = 27.0, minSceneLength = 1.0) => {
    setIsLoading(true);
    setError(null);
    
    try {
      const response = await fetch(`${SERVER_URL}/api/ai/detect-scenes`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          videoId,
          method,
          threshold,
          minSceneLength
        }),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to detect scenes');
      }
      
      const data = await response.json();
      return data;
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const processVideoWithAI = async (videoId, videoTitle, types = ['summary', 'timestamps', 'description'], useSceneDetection = true) => {
    setIsLoading(true);
    setError(null);
    
    try {
      const response = await fetch(`${SERVER_URL}/api/ai/process-video`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          videoId,
          videoTitle,
          types,
          useSceneDetection
        }),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to process video with AI');
      }
      
      const data = await response.json();
      return data;
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const testVideoFileAccess = async (videoId) => {
    try {
      const response = await fetch(`${SERVER_URL}/api/ai/test-video/${videoId}`);
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Video file not found');
      }
      
      const data = await response.json();
      return data;
    } catch (error) {
      throw error;
    }
  };

  const testAIServiceHealth = async () => {
    try {
      const response = await fetch(`${SERVER_URL}/api/ai/health`);
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'AI service not available');
      }
      
      const data = await response.json();
      return data;
    } catch (error) {
      throw error;
    }
  };

  return {
    isLoading,
    error,
    generateAISummary,
    generateAIDescription,
    generateAITimestamps,
    detectScenes,
    processVideoWithAI,
    testVideoFileAccess,
    testAIServiceHealth,
  };
}; 