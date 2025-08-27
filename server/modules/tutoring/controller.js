const Video = require('./model');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { Student } = require('../user/model');
const crypto = require('crypto'); // Added for uniqueId generation
const mongoose = require('mongoose');

// Configure multer for video upload
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = path.join(__dirname, '../../uploads/videos');
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({
  storage: storage,
  limits: {
    fileSize: 500 * 1024 * 1024 // 500MB limit
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = /mp4|avi|mov|wmv|flv|webm/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);
    
    if (mimetype && extname) {
      return cb(null, true);
    } else {
      cb(new Error('Only video files are allowed!'));
    }
  }
}).single('videoFile');

// Upload video
exports.uploadVideo = async (req, res) => {
  upload(req, res, async (err) => {
    if (err) {
      return res.status(400).json({ message: err.message });
    }

    if (!req.file) {
      return res.status(400).json({ message: 'No video file uploaded' });
    }

    try {
      const { title, description, module, degree, year, semester, summary, timestamps } = req.body;
      
      if (!title) {
        return res.status(400).json({ message: 'Title is required.' });
      }
      if (!module) {
        return res.status(400).json({ message: 'Module is required.' });
      }
      if (!degree) {
        return res.status(400).json({ message: 'Degree is required.' });
      }
      if (!year) {
        return res.status(400).json({ message: 'Year is required.' });
      }
      if (!semester) {
        return res.status(400).json({ message: 'Semester is required.' });
      }

      // Generate unique ID combining student ID and timestamp
      let uniqueId = `${req.user.id}_${Date.now()}`;

      // Ensure uniqueId is exactly 6 uppercase alphanumeric characters
      while (uniqueId.length < 6) {
        uniqueId += crypto.randomBytes(3).toString('base64').replace(/[^A-Z0-9]/gi, '').toUpperCase();
      }
      uniqueId = uniqueId.slice(0, 6);

      // Generate thumbnail path
      const thumbnailDir = path.join(__dirname, '../../uploads/thumbnails');
      if (!fs.existsSync(thumbnailDir)) {
        fs.mkdirSync(thumbnailDir, { recursive: true });
      }
      const thumbnailPath = path.join(thumbnailDir, `thumb_${uniqueId}.jpg`);

      // Try to generate thumbnail (optional - won't fail if ffmpeg not available)
      let thumbnail = null;
      let duration = null;
      try {
        const { spawn } = require('child_process');
        
        // Generate thumbnail
        const ffmpegThumbnail = spawn('ffmpeg', [
          '-i', req.file.path,
          '-ss', '00:00:01',
          '-vframes', '1',
          '-vf', 'scale=320:180',
          '-y',
          thumbnailPath
        ]);

        await new Promise((resolve, reject) => {
          ffmpegThumbnail.on('close', (code) => {
            if (code === 0) {
              thumbnail = `uploads/thumbnails/thumb_${uniqueId}.jpg`;
            }
            resolve();
          });
          ffmpegThumbnail.on('error', () => resolve()); // Don't fail if ffmpeg not available
        });

        // Get video duration
        const ffmpegDuration = spawn('ffprobe', [
          '-v', 'quiet',
          '-show_entries', 'format=duration',
          '-of', 'csv=p=0',
          req.file.path
        ]);

        await new Promise((resolve, reject) => {
          let durationOutput = '';
          ffmpegDuration.stdout.on('data', (data) => {
            durationOutput += data.toString();
          });
          ffmpegDuration.on('close', (code) => {
            if (code === 0 && durationOutput.trim()) {
              duration = Math.round(parseFloat(durationOutput.trim()));
            }
            resolve();
          });
          ffmpegDuration.on('error', () => resolve()); // Don't fail if ffprobe not available
        });
      } catch (error) {
        console.log('Thumbnail/duration generation failed, continuing without them');
      }

      // Fetch the student's string ID
      const student = await Student.findById(req.user.id);
      if (!student) {
        return res.status(400).json({ message: 'Student not found.' });
      }

      // Save relative paths instead of absolute paths
      const videoFileName = path.basename(req.file.path);
      const relativeVideoPath = `uploads/videos/${videoFileName}`;

      const video = new Video({
        uniqueId,
        title,
        description,
        module,
        degree,
        year,
        semester,
        videoFile: relativeVideoPath,
        thumbnail: thumbnail,
        fileSize: req.file.size,
        duration: duration, // Add duration
        uploadedBy: req.user.id,
        studentId: student.studentId,
        addDate: new Date(),
        updateDate: new Date()
      });

      // Always update summary if provided
      if (summary !== undefined) video.summary = summary;
      // Always update timestamps if provided (allow clearing)
      if (timestamps !== undefined) {
        // Map 'time' to 'time_start' if needed for each timestamp
        let fixedTimestamps = [];
        try {
          const parsed = typeof timestamps === 'string' ? JSON.parse(timestamps) : timestamps;
          fixedTimestamps = parsed.map(ts => ({
            time_start: ts.time_start || ts.time || '',
            description: ts.description || ''
          }));
        } catch (e) {
          fixedTimestamps = [];
        }
        video.timestamps = fixedTimestamps;
      }

      console.log('Saving video with summary:', video.summary, 'timestamps:', video.timestamps);
      video.aiFeatures = video.aiFeatures || {};
      video.aiFeatures.summary = (video.summary || '').trim() !== '';
      video.aiFeatures.timestamps = Array.isArray(video.timestamps) && video.timestamps.length > 0;
      console.log('aiFeatures to be saved:', video.aiFeatures);
      video.markModified('aiFeatures');

      await video.save();
      
      res.status(201).json({
        message: 'Video uploaded successfully',
        video: {
          id: video._id,
          uniqueId: video.uniqueId,
          title: video.title,
          description: video.description,
          module: video.module,
          degree: video.degree,
          year: video.year,
          semester: video.semester,
          status: video.status,
          uploadDate: video.uploadDate,
          videoFile: video.videoFile,
          thumbnail: video.thumbnail,
          duration: video.duration && !isNaN(video.duration) ? video.duration : null,
          views: video.views,
          aiFeatures: video.aiFeatures,
          summary: video.summary,
          timestamps: video.timestamps
        }
      });
    } catch (error) {
      // Delete uploaded file if database save fails
      if (req.file) {
        fs.unlinkSync(req.file.path);
      }
      console.error('Video upload error:', error);
      res.status(500).json({ message: 'Server error' });
    }
  });
};

// Get videos by student
exports.getStudentVideos = async (req, res) => {
  try {
    const videos = await Video.find({ uploadedBy: req.user.id })
      .sort({ uploadDate: -1 });
    
    res.json({
      videos: videos.map(video => {
        const summary = video.summary || '';
        const timestamps = Array.isArray(video.timestamps) ? video.timestamps : [];
        const aiFeatures = video.aiFeatures || {};
        aiFeatures.summary = summary.trim() !== '';
        aiFeatures.timestamps = timestamps.length > 0;
        return {
        id: video._id,
        uniqueId: video.uniqueId,
        title: video.title,
        description: video.description,
        module: video.module,
        degree: video.degree,
        year: video.year,
        semester: video.semester,
        status: video.status,
        reviewStatus: video.reviewStatus,
        reviewLecturer: video.reviewLecturer,
          aiFeatures,
        views: video.views,
        duration: video.duration && !isNaN(video.duration) ? video.duration : null,
        uploadDate: video.uploadDate,
        publishDate: video.publishDate,
        videoFile: video.videoFile,
        thumbnail: video.thumbnail,
          summary,
          timestamps: timestamps.map(ts => ({
            time_start: ts.time_start || ts.time || '',
            description: ts.description || ''
          }))
        };
      })
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

// Update video
exports.updateVideo = async (req, res) => {
  try {
    const { videoId } = req.params;
    const { title, description, module, degree, year, semester, summary, timestamps } = req.body;
    
    const video = await Video.findOne({ _id: videoId, uploadedBy: req.user.id });
    
    if (!video) {
      return res.status(404).json({ message: 'Video not found' });
    }

    video.title = title || video.title;
    video.description = description || video.description;
    video.module = module || video.module;
    video.degree = degree || video.degree;
    video.year = year || video.year;
    video.semester = semester || video.semester;
    // Always update summary if provided
    if (summary !== undefined) video.summary = summary;
    // Always update timestamps if provided (allow clearing)
    if (timestamps !== undefined) {
      // Map 'time' to 'time_start' if needed for each timestamp
      let fixedTimestamps = [];
      try {
        const parsed = typeof timestamps === 'string' ? JSON.parse(timestamps) : timestamps;
        fixedTimestamps = parsed.map(ts => ({
          time_start: ts.time_start || ts.time || '',
          description: ts.description || ''
        }));
      } catch (e) {
        fixedTimestamps = [];
      }
      video.timestamps = fixedTimestamps;
    }

    console.log('Saving video with summary:', video.summary, 'timestamps:', video.timestamps);
    video.aiFeatures = video.aiFeatures || {};
    video.aiFeatures.summary = (video.summary || '').trim() !== '';
    video.aiFeatures.timestamps = Array.isArray(video.timestamps) && video.timestamps.length > 0;
    console.log('aiFeatures to be saved:', video.aiFeatures);
    video.markModified('aiFeatures');
    video.updateDate = new Date();

    await video.save();
    
    res.json({
      message: 'Video updated successfully',
      video: {
        id: video._id,
        uniqueId: video.uniqueId,
        title: video.title,
        description: video.description,
        module: video.module,
        degree: video.degree,
        year: video.year,
        semester: video.semester,
        status: video.status,
        videoFile: video.videoFile,
        summary: video.summary,
        timestamps: video.timestamps,
        aiFeatures: video.aiFeatures
      }
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

// Delete video
exports.deleteVideo = async (req, res) => {
  try {
    const { videoId } = req.params;
    
    const video = await Video.findOne({ _id: videoId, uploadedBy: req.user.id });
    
    if (!video) {
      return res.status(404).json({ message: 'Video not found' });
    }

    // Delete video file
    if (video.videoFile) {
      const absoluteVideoPath = path.join(__dirname, '../../', video.videoFile);
      if (fs.existsSync(absoluteVideoPath)) {
        fs.unlinkSync(absoluteVideoPath);
      }
    }
    
    // Delete thumbnail file
    if (video.thumbnail) {
      const absoluteThumbnailPath = path.join(__dirname, '../../', video.thumbnail);
      if (fs.existsSync(absoluteThumbnailPath)) {
        fs.unlinkSync(absoluteThumbnailPath);
      }
    }

    video.deleteDate = new Date();
    await video.save();
    await Video.findByIdAndDelete(videoId);
    
    res.json({ message: 'Video deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

// Toggle video publish status
exports.togglePublishStatus = async (req, res) => {
  try {
    const { videoId } = req.params;
    
    const video = await Video.findOne({ _id: videoId, uploadedBy: req.user.id });
    
    if (!video) {
      return res.status(404).json({ message: 'Video not found' });
    }

    video.status = video.status === 'published' ? 'unpublished' : 'published';
    if (video.status === 'published') {
      video.publishDate = new Date();
    } else {
      video.unpublishDate = new Date();
    }
    video.updateDate = new Date();

    await video.save();
    
    res.json({
      message: `Video ${video.status} successfully`,
      status: video.status
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

// Student requests lecturer review for a video
exports.requestReview = async (req, res) => {
  try {
    const { videoId } = req.params;
    const { lecturerId, message } = req.body;
    if (!lecturerId) {
      return res.status(400).json({ message: 'lecturerId is required' });
    }
    // Ensure this video belongs to the current student
    const video = await Video.findOne({ _id: videoId, uploadedBy: req.user.id });
    if (!video) {
      return res.status(404).json({ message: 'Video not found' });
    }
    video.reviewLecturer = lecturerId;
    video.reviewStatus = 'pending';
    if (typeof message === 'string') {
      video.reviewNote = message.slice(0, 1000);
    }
    await video.save();
    res.json({
      message: 'Review requested',
      video: {
        id: video._id,
        reviewLecturer: video.reviewLecturer,
        reviewStatus: video.reviewStatus,
        reviewNote: video.reviewNote || ''
      }
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

// Stream video file
exports.streamVideo = async (req, res) => {
  try {
    const { videoId } = req.params;
    
    const video = await Video.findOne({ _id: videoId, uploadedBy: req.user.id });
    
    if (!video) {
      return res.status(404).json({ message: 'Video not found' });
    }

    if (!video.videoFile) {
      return res.status(404).json({ message: 'Video file not found' });
    }

    // Convert relative path to absolute path
    const absoluteVideoPath = path.join(__dirname, '../../', video.videoFile);
    
    if (!fs.existsSync(absoluteVideoPath)) {
      return res.status(404).json({ message: 'Video file not found' });
    }

    const stat = fs.statSync(absoluteVideoPath);
    const fileSize = stat.size;
    const range = req.headers.range;

    if (range) {
      const parts = range.replace(/bytes=/, "").split("-");
      const start = parseInt(parts[0], 10);
      const end = parts[1] ? parseInt(parts[1], 10) : fileSize - 1;
      const chunksize = (end - start) + 1;
      const file = fs.createReadStream(absoluteVideoPath, { start, end });
      const head = {
        'Content-Range': `bytes ${start}-${end}/${fileSize}`,
        'Accept-Ranges': 'bytes',
        'Content-Length': chunksize,
        'Content-Type': 'video/mp4',
      };
      res.writeHead(206, head);
      file.pipe(res);
    } else {
      const head = {
        'Content-Length': fileSize,
        'Content-Type': 'video/mp4',
      };
      res.writeHead(200, head);
      fs.createReadStream(absoluteVideoPath).pipe(res);
    }
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

// Serve thumbnail
exports.serveThumbnail = async (req, res) => {
  try {
    const { videoId } = req.params;
    
    const video = await Video.findOne({ _id: videoId, uploadedBy: req.user.id });
    
    if (!video) {
      return res.status(404).json({ message: 'Video not found' });
    }

    if (!video.thumbnail) {
      // Return a default thumbnail or 404
      return res.status(404).json({ message: 'Thumbnail not found' });
    }

    // Convert relative path to absolute path
    const absoluteThumbnailPath = path.join(__dirname, '../../', video.thumbnail);
    
    if (!fs.existsSync(absoluteThumbnailPath)) {
      return res.status(404).json({ message: 'Thumbnail not found' });
    }

    res.sendFile(path.resolve(absoluteThumbnailPath));
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

// Get a single video by ID
exports.getVideoById = async (req, res) => {
  try {
    const { videoId } = req.params;
    const video = await Video.findOne({ _id: videoId }).populate('uploadedBy', 'name studentId');
    
    if (!video) {
      return res.status(404).json({ message: 'Video not found' });
    }
    
    const summary = video.summary || '';
    const timestamps = Array.isArray(video.timestamps) ? video.timestamps : [];
    const aiFeatures = video.aiFeatures || {};
    aiFeatures.summary = summary.trim() !== '';
    aiFeatures.timestamps = timestamps.length > 0;
    
    // Get student information
    const studentName = video.uploadedBy?.name || video.studentId || 'Unknown Student';
    
    // Check if current user liked the video
    const userLiked = video.likedBy && video.likedBy.includes(req.user.id);
    
    res.json({
      video: {
        id: video._id,
        uniqueId: video.uniqueId,
        title: video.title,
        description: video.description,
        module: video.module,
        degree: video.degree,
        year: video.year,
        semester: video.semester,
        status: video.status,
        reviewStatus: video.reviewStatus,
        reviewLecturer: video.reviewLecturer,
        aiFeatures,
        views: video.views || 0,
        likes: video.likes || 0,
        userLiked: userLiked,
        uploadDate: video.addDate || video.uploadDate,
        publishDate: video.publishDate,
        videoFile: video.videoFile,
        thumbnail: video.thumbnail,
        summary,
        timestamps: timestamps.map(ts => ({
          time_start: ts.time_start || ts.time || '',
          description: ts.description || ''
        })),
        // Add student information
        studentName: studentName,
        studentId: video.studentId,
        uploaderName: studentName,
        // Add duration (you may need to calculate this from the video file)
        duration: video.duration && !isNaN(video.duration) ? video.duration : null
      }
    });
  } catch (error) {
    console.error('Error in getVideoById:', error);
    res.status(500).json({ message: 'Server error' });
  }
}; 

// Get published videos by degree, year, semester, and module
exports.getPublishedVideos = async (req, res) => {
  try {
    const { degree, year, semester, module } = req.query;
    console.log('=== Published Videos Debug ===');
    console.log('Query parameters:', { degree, year, semester, module });
    
    // First, let's see if there are any published videos at all
    const allPublishedVideos = await Video.find({ status: 'published' });
    console.log('Total published videos in database:', allPublishedVideos.length);
    console.log('Sample published videos:', allPublishedVideos.slice(0, 3).map(v => ({
      id: v._id,
      title: v.title,
      module: v.module,
      moduleType: typeof v.module,
      degree: v.degree,
      degreeType: typeof v.degree,
      year: v.year,
      yearType: typeof v.year,
      semester: v.semester,
      semesterType: typeof v.semester,
      status: v.status
    })));
    
    // Test simple module query
    if (module) {
      const moduleOnlyVideos = await Video.find({ status: 'published', module: module });
      console.log(`Videos found for module "${module}" only:`, moduleOnlyVideos.length);
      console.log('Module-only videos:', moduleOnlyVideos.map(v => ({ id: v._id, title: v.title, module: v.module, status: v.status })));
      
      // Also try case-insensitive search
      const moduleRegexVideos = await Video.find({ status: 'published', module: { $regex: module, $options: 'i' } });
      console.log(`Videos found for module "${module}" (case-insensitive):`, moduleRegexVideos.length);
    }
    
    const query = { status: 'published' };
    
    if (degree) {
      try {
        // If degree looks like a MongoDB ObjectId, use ObjectId for query
        if (/^[a-fA-F0-9]{24}$/.test(degree)) {
          query.degree = new mongoose.Types.ObjectId(degree);
        } else {
          query.degree = degree;
        }
      } catch (error) {
        console.error('Error converting degree to ObjectId:', error);
        query.degree = degree; // Fallback to string
      }
    }
    
    if (year) query.year = year;
    if (semester) query.semester = semester;
    if (module) query.module = module;
    
    console.log('Final query:', JSON.stringify(query, null, 2));
    
    const videos = await Video.find(query).populate('uploadedBy', 'name studentId');
    console.log('Published videos found:', videos.length);
    console.log('Videos:', videos.map(v => ({ id: v._id, title: v.title, module: v.module, status: v.status })));
    
    const transformedVideos = videos.map(video => {
      const summary = video.summary || '';
      const timestamps = Array.isArray(video.timestamps) ? video.timestamps : [];
      const aiFeatures = video.aiFeatures || {};
      aiFeatures.summary = summary.trim() !== '';
      aiFeatures.timestamps = timestamps.length > 0;
      
      // Get student name
      const studentName = video.uploadedBy?.name || video.studentId || 'Unknown Student';
      
      return {
        id: video._id,
        uniqueId: video.uniqueId,
        title: video.title,
        description: video.description,
        module: video.module,
        degree: video.degree,
        year: video.year,
        semester: video.semester,
        status: video.status,
        reviewStatus: video.reviewStatus,
        reviewLecturer: video.reviewLecturer,
        aiFeatures,
        views: video.views || 0,
        duration: video.duration && !isNaN(video.duration) ? video.duration : null,
        uploadDate: video.addDate || video.uploadDate,
        publishDate: video.publishDate,
        videoFile: video.videoFile,
        thumbnail: video.thumbnail,
        summary,
        timestamps: timestamps.map(ts => ({
          time_start: ts.time_start || ts.time || '',
          description: ts.description || ''
        })),
        // Add student information
        studentName: studentName,
        studentId: video.studentId,
        uploaderName: studentName
      };
    });
    
    res.json({ videos: transformedVideos });
  } catch (err) {
    console.error('Error in getPublishedVideos:', err);
    console.error('Error stack:', err.stack);
    res.status(500).json({ message: 'Server error', error: err.message });
  }
}; 

// Like/Unlike a video
exports.likeVideo = async (req, res) => {
  try {
    const { videoId } = req.params;
    const userId = req.user.id;

    const video = await Video.findById(videoId);
    if (!video) {
      return res.status(404).json({ message: 'Video not found' });
    }

    const userLiked = video.likedBy.includes(userId);

    if (userLiked) {
      // Unlike the video
      video.likedBy = video.likedBy.filter(id => id.toString() !== userId);
      video.likes = Math.max(0, video.likes - 1);
    } else {
      // Like the video
      video.likedBy.push(userId);
      video.likes = video.likes + 1;
    }

    await video.save();

    res.json({
      success: true,
      likes: video.likes,
      userLiked: !userLiked
    });
  } catch (error) {
    console.error('Error in likeVideo:', error);
    res.status(500).json({ message: 'Server error' });
  }
}; 

// Save/Unsave a video for the current user (student or lecturer)
exports.toggleSaveVideo = async (req, res) => {
  try {
    const { videoId } = req.params;
    const userId = req.user.id;
    const video = await Video.findById(videoId);
    if (!video) return res.status(404).json({ message: 'Video not found' });
    if (!Array.isArray(video.savedBy)) video.savedBy = [];
    const alreadySaved = video.savedBy.some(id => String(id) === String(userId));
    if (alreadySaved) {
      video.savedBy = video.savedBy.filter(id => String(id) !== String(userId));
    } else {
      video.savedBy.push(userId);
    }
    await video.save();
    res.json({ success: true, saved: !alreadySaved });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

// Get saved videos for current user
exports.getSavedVideos = async (req, res) => {
  try {
    const userId = req.user.id;
    const videos = await Video.find({ savedBy: userId }).sort({ addDate: -1 });
    res.json({
      videos: videos.map(v => ({ id: v._id, title: v.title, savedAt: v.updateDate || v.addDate }))
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};