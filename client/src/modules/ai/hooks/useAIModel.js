import { useState } from 'react';

const PYTHON_SERVICE_URL = process.env.REACT_APP_PYTHON_SERVICE_URL || 'http://localhost:5001';
const SERVER_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';

export const useAIModel = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  const getVideoFile = async (videoId, videoTitle = '') => {
    try {
      // Try to fetch video from the server uploads directory
      // First try the standard naming pattern: videoFile-{id}.mp4
      const videoResponse = await fetch(`${SERVER_URL}/uploads/videos/videoFile-${videoId}.mp4`);
      
      if (!videoResponse.ok) {
        // Try alternative naming patterns
        const patterns = [
          `${SERVER_URL}/uploads/videos/${videoId}.mp4`,
          `${SERVER_URL}/uploads/videos/${videoTitle}.mp4`,
          `${SERVER_URL}/uploads/videos/video-${videoId}.mp4`
        ];
        
        for (const pattern of patterns) {
          try {
            const response = await fetch(pattern);
            if (response.ok) {
              return await response.blob();
            }
          } catch (e) {
            continue;
          }
        }
        
        throw new Error(`Video file not found. Tried patterns: videoFile-${videoId}.mp4, ${videoId}.mp4, ${videoTitle}.mp4`);
      }
      
      return await videoResponse.blob();
    } catch (error) {
      console.error('Error fetching video file:', error);
      throw new Error(`Failed to fetch video file from server: ${error.message}`);
    }
  };

  const generateAISummary = async (videoId, videoFile = null, videoTitle = '') => {
    setIsLoading(true);
    setError(null);
    
    try {
      let response;
      
      if (videoFile) {
        // Process video file directly
        const formData = new FormData();
        formData.append('video', videoFile);
        formData.append('title', videoTitle);
        formData.append('type', 'summary');
        
        response = await fetch(`${PYTHON_SERVICE_URL}/process-video`, {
          method: 'POST',
          body: formData,
        });
      } else {
        // Use existing video from server uploads directory
        const videoBlob = await getVideoFile(videoId, videoTitle);
        const formData = new FormData();
        formData.append('video', videoBlob, `video-${videoId}.mp4`);
        formData.append('title', videoTitle);
        formData.append('type', 'summary');
        
        response = await fetch(`${PYTHON_SERVICE_URL}/process-video`, {
          method: 'POST',
          body: formData,
        });
      }
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to generate summary');
      }
      
      const data = await response.json();
      return data.summary;
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const generateAIDescription = async (videoId, videoFile = null, videoTitle = '') => {
    setIsLoading(true);
    setError(null);
    
    try {
      let response;
      
      if (videoFile) {
        // Process video file directly
        const formData = new FormData();
        formData.append('video', videoFile);
        formData.append('title', videoTitle);
        
        response = await fetch(`${PYTHON_SERVICE_URL}/generate-description`, {
          method: 'POST',
          body: formData,
        });
      } else {
        // Use existing video from server uploads directory
        const videoBlob = await getVideoFile(videoId, videoTitle);
        const formData = new FormData();
        formData.append('video', videoBlob, `video-${videoId}.mp4`);
        formData.append('title', videoTitle);
        
        response = await fetch(`${PYTHON_SERVICE_URL}/generate-description`, {
          method: 'POST',
          body: formData,
        });
      }
      
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

  const generateAITimestamps = async (videoId, videoFile = null, videoTitle = '', useSceneDetection = true) => {
    setIsLoading(true);
    setError(null);
    
    try {
      let response;
      
      if (videoFile) {
        // Process video file directly
        const formData = new FormData();
        formData.append('video', videoFile);
        formData.append('title', videoTitle);
        formData.append('type', useSceneDetection ? 'all' : 'timestamps');
        if (useSceneDetection) {
          formData.append('scene_method', 'content');
          formData.append('threshold', '27.0');
        }
        
        response = await fetch(`${PYTHON_SERVICE_URL}/process-video`, {
          method: 'POST',
          body: formData,
        });
      } else {
        // Use existing video from server uploads directory
        const videoBlob = await getVideoFile(videoId, videoTitle);
        const formData = new FormData();
        formData.append('video', videoBlob, `video-${videoId}.mp4`);
        formData.append('title', videoTitle);
        formData.append('type', useSceneDetection ? 'all' : 'timestamps');
        if (useSceneDetection) {
          formData.append('scene_method', 'content');
          formData.append('threshold', '27.0');
        }
        
        response = await fetch(`${PYTHON_SERVICE_URL}/process-video`, {
          method: 'POST',
          body: formData,
        });
      }
      
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

  const detectScenes = async (videoId, videoFile = null, method = 'content', threshold = 27.0, minSceneLength = 1.0) => {
    setIsLoading(true);
    setError(null);
    
    try {
      let response;
      
      if (videoFile) {
        // Process video file directly
        const formData = new FormData();
        formData.append('video', videoFile);
        formData.append('method', method);
        formData.append('threshold', threshold.toString());
        formData.append('min_scene_length', minSceneLength.toString());
        
        response = await fetch(`${PYTHON_SERVICE_URL}/detect-scenes`, {
          method: 'POST',
          body: formData,
        });
      } else {
        // Use existing video from server uploads directory
        const videoBlob = await getVideoFile(videoId);
        const formData = new FormData();
        formData.append('video', videoBlob, `video-${videoId}.mp4`);
        formData.append('method', method);
        formData.append('threshold', threshold.toString());
        formData.append('min_scene_length', minSceneLength.toString());
        
        response = await fetch(`${PYTHON_SERVICE_URL}/detect-scenes`, {
          method: 'POST',
          body: formData,
        });
      }
      
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

  const processVideoWithAI = async (videoFile, videoTitle, types = ['summary', 'timestamps', 'description'], useSceneDetection = true) => {
    setIsLoading(true);
    setError(null);
    
    try {
      const formData = new FormData();
      formData.append('video', videoFile);
      formData.append('title', videoTitle);
      formData.append('type', 'all'); // Process everything
      if (useSceneDetection) {
        formData.append('scene_method', 'content');
        formData.append('threshold', '27.0');
      }
      
      const response = await fetch(`${PYTHON_SERVICE_URL}/process-video`, {
        method: 'POST',
        body: formData,
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

  const combineTimestamps = async (scenes, gptTimestamps, videoTitle) => {
    setIsLoading(true);
    setError(null);
    
    try {
      const formData = new FormData();
      formData.append('scenes', JSON.stringify(scenes));
      formData.append('gpt_timestamps', JSON.stringify(gptTimestamps));
      formData.append('video_title', videoTitle);
      
      const response = await fetch(`${PYTHON_SERVICE_URL}/combine-timestamps`, {
        method: 'POST',
        body: formData,
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to combine timestamps');
      }
      
      const data = await response.json();
      return data.combined_timestamps;
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const testVideoFileAccess = async (videoId) => {
    try {
      console.log(`Testing video file access for ID: ${videoId}`);
      const videoBlob = await getVideoFile(videoId);
      console.log('✅ Video file accessed successfully:', videoBlob.size, 'bytes');
      return true;
    } catch (error) {
      console.error('❌ Video file access failed:', error.message);
      return false;
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
    combineTimestamps,
    testVideoFileAccess,
  };
}; 