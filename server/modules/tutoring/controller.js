const Video = require('./model');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Configure multer for video upload
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = 'uploads/videos';
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
      const uniqueId = `${req.user.id}_${Date.now()}`;

      // Generate thumbnail path
      const thumbnailDir = 'uploads/thumbnails';
      if (!fs.existsSync(thumbnailDir)) {
        fs.mkdirSync(thumbnailDir, { recursive: true });
      }
      const thumbnailPath = path.join(thumbnailDir, `thumb_${uniqueId}.jpg`);

      // Try to generate thumbnail (optional - won't fail if ffmpeg not available)
      let thumbnail = null;
      try {
        const { spawn } = require('child_process');
        const ffmpeg = spawn('ffmpeg', [
          '-i', req.file.path,
          '-ss', '00:00:01',
          '-vframes', '1',
          '-vf', 'scale=320:180',
          '-y',
          thumbnailPath
        ]);

        await new Promise((resolve, reject) => {
          ffmpeg.on('close', (code) => {
            if (code === 0) {
              thumbnail = thumbnailPath;
            }
            resolve();
          });
          ffmpeg.on('error', () => resolve()); // Don't fail if ffmpeg not available
        });
      } catch (error) {
        console.log('Thumbnail generation failed, continuing without thumbnail');
      }

      const video = new Video({
        uniqueId,
        title,
        description,
        module,
        degree,
        year,
        semester,
        videoFile: req.file.path,
        thumbnail: thumbnail,
        fileSize: req.file.size,
        uploadedBy: req.user.id
      });

      // Always update summary if provided
      if (summary !== undefined) video.summary = summary;
      // Always update timestamps if provided (allow clearing)
      if (timestamps !== undefined) video.timestamps = timestamps;

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
          thumbnail: video.thumbnail
        }
      });
    } catch (error) {
      // Delete uploaded file if database save fails
      if (req.file) {
        fs.unlinkSync(req.file.path);
      }
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
      videos: videos.map(video => ({
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
        aiFeatures: video.aiFeatures,
        views: video.views,
        uploadDate: video.uploadDate,
        publishDate: video.publishDate,
        videoFile: video.videoFile,
        thumbnail: video.thumbnail,
        summary: video.summary,
        timestamps: video.timestamps
      }))
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
    if (timestamps !== undefined) video.timestamps = timestamps;

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
        timestamps: video.timestamps
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
    if (video.videoFile && fs.existsSync(video.videoFile)) {
      fs.unlinkSync(video.videoFile);
    }
    // Delete thumbnail file
    if (video.thumbnail && fs.existsSync(video.thumbnail)) {
      fs.unlinkSync(video.thumbnail);
    }

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
    }

    await video.save();
    
    res.json({
      message: `Video ${video.status} successfully`,
      status: video.status
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

    if (!video.videoFile || !fs.existsSync(video.videoFile)) {
      return res.status(404).json({ message: 'Video file not found' });
    }

    const stat = fs.statSync(video.videoFile);
    const fileSize = stat.size;
    const range = req.headers.range;

    if (range) {
      const parts = range.replace(/bytes=/, "").split("-");
      const start = parseInt(parts[0], 10);
      const end = parts[1] ? parseInt(parts[1], 10) : fileSize - 1;
      const chunksize = (end - start) + 1;
      const file = fs.createReadStream(video.videoFile, { start, end });
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
      fs.createReadStream(video.videoFile).pipe(res);
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

    if (!video.thumbnail || !fs.existsSync(video.thumbnail)) {
      // Return a default thumbnail or 404
      return res.status(404).json({ message: 'Thumbnail not found' });
    }

    res.sendFile(path.resolve(video.thumbnail));
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

// Get a single video by ID
exports.getVideoById = async (req, res) => {
  try {
    const { videoId } = req.params;
    const video = await Video.findOne({ _id: videoId, uploadedBy: req.user.id });
    if (!video) {
      return res.status(404).json({ message: 'Video not found' });
    }
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
        aiFeatures: video.aiFeatures,
        views: video.views,
        uploadDate: video.uploadDate,
        publishDate: video.publishDate,
        videoFile: video.videoFile,
        thumbnail: video.thumbnail,
        timestamps: video.timestamps,
        summary: video.summary
        
      }
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
}; 