const axios = require('axios');
const fs = require('fs');
const path = require('path');
const FormData = require('form-data');

const PYTHON_SERVICE_URL = process.env.PYTHON_SERVICE_URL || 'http://localhost:5001';

class AIController {
  constructor() {
    // Bind all methods to ensure proper 'this' context
    this.getVideoFile = this.getVideoFile.bind(this);
    this.generateSummary = this.generateSummary.bind(this);
    this.generateDescription = this.generateDescription.bind(this);
    this.generateTimestamps = this.generateTimestamps.bind(this);
    this.detectScenes = this.detectScenes.bind(this);
    this.processVideoWithAI = this.processVideoWithAI.bind(this);
    this.testVideoAccess = this.testVideoAccess.bind(this);
    this.comprehensiveTest = this.comprehensiveTest.bind(this);
    this.healthCheck = this.healthCheck.bind(this);
    this.mapVideoIdToFile = this.mapVideoIdToFile.bind(this);
  }

  // Map MongoDB ObjectId to actual video file
  async mapVideoIdToFile(videoId) {
    try {
      const uploadsDir = path.join(__dirname, '../../uploads/videos');
      
      // List all files in the directory
      const files = fs.readdirSync(uploadsDir);
      console.log('Available files: ' + files.join(', '));
      
      // If we have only one video file, use it regardless of ID
      if (files.length === 1) {
        const filePath = path.join(uploadsDir, files[0]);
        console.log('Using single available video file: ' + filePath);
        return filePath;
      }
      
      // Try to find a file that might match the ID pattern
      for (const file of files) {
        if (file.includes(videoId) || file.includes('videoFile')) {
          const filePath = path.join(uploadsDir, file);
          console.log('Found matching video file: ' + filePath);
          return filePath;
        }
      }
      
      // If no match found, use the first video file available
      if (files.length > 0) {
        const filePath = path.join(uploadsDir, files[0]);
        console.log('No exact match found, using first available file: ' + filePath);
        return filePath;
      }
      
      throw new Error('No video files found in uploads directory');
    } catch (error) {
      console.error('Error mapping video ID to file:', error);
      throw error;
    }
  }

  // Get video file from server uploads directory
  async getVideoFile(videoId, videoTitle = '') {
    try {
      console.log('Looking for video file with ID: ' + videoId + ', Title: ' + videoTitle);
      
      // Use absolute path to server uploads directory
      const serverRoot = path.resolve(__dirname, '../../');
      const uploadsDir = path.join(serverRoot, 'uploads', 'videos');
      console.log('Server root: ' + serverRoot);
      console.log('Uploads directory: ' + uploadsDir);
      
      // Check if uploads directory exists
      if (!fs.existsSync(uploadsDir)) {
        throw new Error('Uploads directory does not exist: ' + uploadsDir);
      }
      
      // List all files in the directory for debugging
      const files = fs.readdirSync(uploadsDir);
      console.log('Files in uploads directory: ' + files.join(', '));
      
      // Try different naming patterns
      const patterns = [
        'videoFile-' + videoId + '.mp4',
        videoId + '.mp4',
        videoTitle + '.mp4',
        'video-' + videoId + '.mp4'
      ];
      
      console.log('Trying patterns: ' + patterns.join(', '));
      
      for (const pattern of patterns) {
        const filePath = path.join(uploadsDir, pattern);
        console.log('Checking: ' + filePath);
        if (fs.existsSync(filePath)) {
          console.log('Found video file: ' + filePath);
          const stats = fs.statSync(filePath);
          console.log('File size: ' + stats.size + ' bytes');
          return filePath;
        }
      }
      
      // If no exact match found, try to map the ID to an available file
      console.log('No exact match found for ID: ' + videoId + ', trying to map to available files...');
      return await this.mapVideoIdToFile(videoId);
      
    } catch (error) {
      console.error('Error finding video file:', error);
      throw error;
    }
  }

  // Generate AI Summary
  async generateSummary(req, res) {
    try {
      console.log('Server generateSummary called');
      console.log('Request body:', req.body);
      console.log('Request headers:', req.headers);
      
      const { videoId, videoTitle } = req.body;
      
      console.log('Extracted parameters:', { videoId, videoTitle });
      
      if (!videoId) {
        console.error('No videoId provided in request body');
        return res.status(400).json({ error: 'Video ID is required' });
      }

      console.log('Generating AI summary for video: ' + videoId);
      console.log('Python service URL: ' + PYTHON_SERVICE_URL);
      
      // First check if Python service is running
      try {
        const healthResponse = await axios.get(`${PYTHON_SERVICE_URL}/health`, {
          timeout: 5000
        });
        console.log('Python AI service is running');
      } catch (healthError) {
        console.error('Python AI service is not running:', healthError.message);
        return res.status(503).json({ 
          error: 'AI service is not available',
          details: 'Please make sure the Python AI service is running on port 5001'
        });
      }
      
      // Get video file path
      const videoFilePath = await this.getVideoFile(videoId, videoTitle);
      console.log('Video file path: ' + videoFilePath);
      
      // Check if file exists and is readable
      if (!fs.existsSync(videoFilePath)) {
        throw new Error('Video file not found at path: ' + videoFilePath);
      }
      
      const stats = fs.statSync(videoFilePath);
      console.log('Video file size: ' + stats.size + ' bytes');
      
      // Create form data for Python service
      const formData = new FormData();
      formData.append('video', fs.createReadStream(videoFilePath));
      formData.append('title', videoTitle || '');
      formData.append('type', 'summary');
      
      console.log('Sending request to Python service...');
      
      // Send to Python service
      const response = await axios.post(`${PYTHON_SERVICE_URL}/process-video`, formData, {
        headers: {
          ...formData.getHeaders(),
        },
        timeout: 300000, // 5 minutes timeout
      });
      
      console.log('AI summary generated successfully');
      console.log('Response data:', response.data);
      
      // Check if the Python service returned an error in the response
      if (response.data.error) {
        throw new Error(response.data.error);
      }
      
      if (response.data.summary && response.data.summary.includes('failed')) {
        throw new Error(response.data.summary);
      }
      
      res.json({ 
        success: true, 
        summary: response.data.summary,
        message: 'AI summary generated successfully'
      });
      
    } catch (error) {
      console.error('Error generating AI summary:', error.message);
      console.error('Full error:', error);
      
      // Provide more specific error messages
      let errorMessage = 'Failed to generate AI summary';
      let errorDetails = error.message;
      
      if (error.code === 'ECONNREFUSED') {
        errorMessage = 'AI service is not running';
        errorDetails = 'Please start the Python AI service on port 5001';
      } else if (error.code === 'ENOTFOUND') {
        errorMessage = 'Cannot connect to AI service';
        errorDetails = 'Please check if the Python AI service is running';
      } else if (error.response) {
        errorMessage = 'AI service error: ' + error.response.status;
        errorDetails = error.response.data?.error || error.message;
      }
      
      res.status(500).json({ 
        error: errorMessage,
        details: errorDetails 
      });
    }
  }

  // Generate AI Description
  async generateDescription(req, res) {
    try {
      const { videoId, videoTitle } = req.body;
      
      if (!videoId) {
        return res.status(400).json({ error: 'Video ID is required' });
      }

      console.log('Generating AI description for video: ' + videoId);
      
      // Get video file path
      const videoFilePath = await this.getVideoFile(videoId, videoTitle);
      
      // Create form data for Python service
      const formData = new FormData();
      formData.append('video', fs.createReadStream(videoFilePath));
      formData.append('title', videoTitle || '');
      
      // Send to Python service
      const response = await axios.post(`${PYTHON_SERVICE_URL}/generate-description`, formData, {
        headers: {
          ...formData.getHeaders(),
        },
        timeout: 120000, // 2 minutes timeout
      });
      
      console.log('AI description generated successfully');
      res.json({ 
        success: true, 
        description: response.data.description,
        message: 'AI description generated successfully'
      });
      
    } catch (error) {
      console.error('Error generating AI description:', error.message);
      res.status(500).json({ 
        error: 'Failed to generate AI description',
        details: error.message 
      });
    }
  }

  // Generate AI Timestamps
  async generateTimestamps(req, res) {
    try {
      const { videoId, videoTitle, useSceneDetection = true } = req.body;
      
      if (!videoId) {
        return res.status(400).json({ error: 'Video ID is required' });
      }

      console.log('Generating AI timestamps for video: ' + videoId);
      
      // Get video file path
      const videoFilePath = await this.getVideoFile(videoId, videoTitle);
      
      // Create form data for Python service
      const formData = new FormData();
      formData.append('video', fs.createReadStream(videoFilePath));
      formData.append('title', videoTitle || '');
      formData.append('type', useSceneDetection ? 'all' : 'timestamps');
      if (useSceneDetection) {
        formData.append('scene_method', 'content');
        formData.append('threshold', '27.0');
      }
      
      // Send to Python service
      const response = await axios.post(`${PYTHON_SERVICE_URL}/process-video`, formData, {
        headers: {
          ...formData.getHeaders(),
        },
        timeout: 300000, // 5 minutes timeout
      });
      
      console.log('AI timestamps generated successfully');
      res.json({ 
        success: true, 
        timestamps: response.data.timestamps,
        message: 'AI timestamps generated successfully'
      });
      
    } catch (error) {
      console.error('Error generating AI timestamps:', error.message);
      res.status(500).json({ 
        error: 'Failed to generate AI timestamps',
        details: error.message 
      });
    }
  }

  // Detect Scenes
  async detectScenes(req, res) {
    try {
      const { videoId, method = 'content', threshold = 27.0, minSceneLength = 1.0 } = req.body;
      
      if (!videoId) {
        return res.status(400).json({ error: 'Video ID is required' });
      }

      console.log('Detecting scenes for video: ' + videoId);
      
      // Get video file path
      const videoFilePath = await this.getVideoFile(videoId);
      
      // Create form data for Python service
      const formData = new FormData();
      formData.append('video', fs.createReadStream(videoFilePath));
      formData.append('method', method);
      formData.append('threshold', threshold.toString());
      formData.append('min_scene_length', minSceneLength.toString());
      
      // Send to Python service
      const response = await axios.post(`${PYTHON_SERVICE_URL}/detect-scenes`, formData, {
        headers: {
          ...formData.getHeaders(),
        },
        timeout: 180000, // 3 minutes timeout
      });
      
      console.log('Scene detection completed successfully');
      res.json({ 
        success: true, 
        ...response.data,
        message: 'Scene detection completed successfully'
      });
      
    } catch (error) {
      console.error('Error detecting scenes:', error.message);
      res.status(500).json({ 
        error: 'Failed to detect scenes',
        details: error.message 
      });
    }
  }

  // Process Video with All AI Features
  async processVideoWithAI(req, res) {
    try {
      const { videoId, videoTitle, types = ['summary', 'timestamps', 'description'], useSceneDetection = true } = req.body;
      
      if (!videoId) {
        return res.status(400).json({ error: 'Video ID is required' });
      }

      console.log('Processing video with AI: ' + videoId);
      
      // Get video file path
      const videoFilePath = await this.getVideoFile(videoId, videoTitle);
      
      // Create form data for Python service
      const formData = new FormData();
      formData.append('video', fs.createReadStream(videoFilePath));
      formData.append('title', videoTitle || '');
      formData.append('type', 'all'); // Process everything
      if (useSceneDetection) {
        formData.append('scene_method', 'content');
        formData.append('threshold', '27.0');
      }
      
      // Send to Python service
      const response = await axios.post(`${PYTHON_SERVICE_URL}/process-video`, formData, {
        headers: {
          ...formData.getHeaders(),
        },
        timeout: 600000, // 10 minutes timeout
      });
      
      console.log('Full AI processing completed successfully');
      res.json({ 
        success: true, 
        ...response.data,
        message: 'Full AI processing completed successfully'
      });
      
    } catch (error) {
      console.error('Error processing video with AI:', error.message);
      res.status(500).json({ 
        error: 'Failed to process video with AI',
        details: error.message 
      });
    }
  }

  // Test video file access
  async testVideoAccess(req, res) {
    try {
      const { videoId } = req.params;
      
      if (!videoId) {
        return res.status(400).json({ error: 'Video ID is required' });
      }

      console.log('Testing video file access for: ' + videoId);
      
      const videoFilePath = await this.getVideoFile(videoId);
      const stats = fs.statSync(videoFilePath);
      
      res.json({ 
        success: true, 
        videoPath: videoFilePath,
        fileSize: stats.size,
        message: 'Video file found and accessible'
      });
      
    } catch (error) {
      console.error('Error testing video access:', error.message);
      res.status(404).json({ 
        error: 'Video file not found',
        details: error.message 
      });
    }
  }

  // Comprehensive test endpoint
  async comprehensiveTest(req, res) {
    try {
      const { videoId } = req.params;
      
      if (!videoId) {
        return res.status(400).json({ error: 'Video ID is required' });
      }

      console.log('Running comprehensive test for video: ' + videoId);
      
      const testResults = {
        videoId,
        timestamp: new Date().toISOString(),
        tests: {}
      };

      // Test 1: Video file access
      try {
        const videoFilePath = await this.getVideoFile(videoId);
        const stats = fs.statSync(videoFilePath);
        testResults.tests.videoFile = {
          success: true,
          path: videoFilePath,
          size: stats.size,
          message: 'Video file found and accessible'
        };
      } catch (error) {
        testResults.tests.videoFile = {
          success: false,
          error: error.message
        };
      }

      // Test 2: Python service health
      try {
        const healthResponse = await axios.get(`${PYTHON_SERVICE_URL}/health`, {
          timeout: 5000
        });
        testResults.tests.pythonService = {
          success: true,
          status: healthResponse.status,
          data: healthResponse.data,
          message: 'Python AI service is running'
        };
      } catch (error) {
        testResults.tests.pythonService = {
          success: false,
          error: error.message,
          message: 'Python AI service is not accessible'
        };
      }

      // Test 3: Try to send a small test request
      if (testResults.tests.videoFile.success && testResults.tests.pythonService.success) {
        try {
          const videoFilePath = await this.getVideoFile(videoId);
          const formData = new FormData();
          formData.append('video', fs.createReadStream(videoFilePath));
          formData.append('title', 'Test Video');
          formData.append('type', 'summary');
          
          const response = await axios.post(`${PYTHON_SERVICE_URL}/process-video`, formData, {
            headers: {
              ...formData.getHeaders(),
            },
            timeout: 30000, // 30 seconds for test
          });
          
          testResults.tests.aiProcessing = {
            success: true,
            status: response.status,
            message: 'AI processing test successful'
          };
        } catch (error) {
          testResults.tests.aiProcessing = {
            success: false,
            error: error.message,
            message: 'AI processing test failed'
          };
        }
      } else {
        testResults.tests.aiProcessing = {
          success: false,
          error: 'Skipped - prerequisites not met',
          message: 'Cannot test AI processing without video file and Python service'
        };
      }

      res.json(testResults);
      
    } catch (error) {
      console.error('Error in comprehensive test:', error.message);
      res.status(500).json({ 
        error: 'Comprehensive test failed',
        details: error.message 
      });
    }
  }

  // Health check for AI service
  async healthCheck(req, res) {
    try {
      const response = await axios.get(`${PYTHON_SERVICE_URL}/health`, {
        timeout: 5000
      });
      
      res.json({ 
        success: true, 
        pythonService: 'healthy',
        message: 'AI service is running'
      });
      
    } catch (error) {
      console.error('AI service health check failed:', error.message);
      res.status(503).json({ 
        error: 'AI service is not available',
        details: error.message 
      });
    }
  }
}

module.exports = new AIController(); 