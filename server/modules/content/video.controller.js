const Video = require('./video.model');
const Degree = require('../../modules/admin/degree.model');
const crypto = require('crypto');

// Create a new video
exports.createVideo = async (req, res) => {
  try {
    if (!req.body.uniqueId) {
      // Generate a short, uppercase, alphanumeric ID (6 chars)
      req.body.uniqueId = crypto.randomBytes(3).toString('base64').replace(/[^A-Z0-9]/gi, '').slice(0, 6).toUpperCase();
    }
    const video = new Video(req.body);
    await video.save();
    res.status(201).json(video);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

// Get all videos
exports.getVideos = async (req, res) => {
  try {
    const videos = await Video.find();
    // Fetch degree info for each video
    const mapped = await Promise.all(videos.map(async v => {
      const obj = v.toObject();
      let degreeName = '';
      let moduleName = '';
      let degreeDoc = null;
      if (obj.degree) {
        try {
          degreeDoc = await Degree.findById(obj.degree);
        } catch {}
        if (!degreeDoc && typeof obj.degree === 'string') {
          degreeDoc = await Degree.findOne({ code: obj.degree });
        }
        if (degreeDoc) {
          degreeName = degreeDoc.name;
          // Find module name
          const yearObj = degreeDoc.years.find(y => String(y.yearNumber) === String(obj.year));
          if (yearObj) {
            const semObj = yearObj.semesters.find(s => String(s.semesterNumber) === String(obj.semester));
            if (semObj) {
              const modObj = semObj.modules.find(m => m.code === obj.module || m.id === obj.module);
              if (modObj) {
                moduleName = modObj.name;
              }
            }
          }
        }
      }
      // Extract filename for preview
      let preview = '';
      if (obj.videoFile) {
        const fileName = obj.videoFile.split(/\\|\//).pop();
        preview = '/uploads/videos/' + fileName;
      }
      return {
        ...obj,
        degreeName,
        moduleName,
        preview,
        thumbnail: obj.thumbnail ? '/' + obj.thumbnail.replace(/\\/g, '/') : '',
      };
    }));
    console.log('Mapped videos for frontend:', mapped);
    res.json(mapped);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Get video by ID
exports.getVideoById = async (req, res) => {
  try {
    const video = await Video.findById(req.params.id);
    if (!video) return res.status(404).json({ message: 'Video not found' });
    res.json(video);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Update video
exports.updateVideo = async (req, res) => {
  try {
    const video = await Video.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
    if (!video) return res.status(404).json({ message: 'Video not found' });
    res.json(video);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

// Delete video
exports.deleteVideo = async (req, res) => {
  try {
    const video = await Video.findByIdAndDelete(req.params.id);
    if (!video) return res.status(404).json({ message: 'Video not found' });
    res.json({ message: 'Video deleted' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
}; 