const bcrypt = require('bcryptjs');
const Lecturer = require('./model');
const Degree = require('../admin/degree.model');
const Video = require('../tutoring/model');

exports.createLecturer = async (req, res) => {
  // TODO: Add admin authentication check
  const { lecturerId, name, email, password, mobile, modules, degrees } = req.body;
  if (!lecturerId || !name || !email || !password || !mobile) {
    return res.status(400).json({ message: 'Missing required fields' });
  }
  try {
    const existingEmail = await Lecturer.findOne({ email });
    if (existingEmail) return res.status(409).json({ message: 'Email already registered' });
    const existingLecturerId = await Lecturer.findOne({ lecturerId });
    if (existingLecturerId) return res.status(409).json({ message: 'Lecturer ID already registered' });
    const hashed = await bcrypt.hash(password, 10);
    let degreeIds = [];
    if (degrees && Array.isArray(degrees)) {
      for (const deg of degrees) {
        let degreeObj = await Degree.findOne({ code: deg }) || await Degree.findById(deg);
        if (degreeObj) degreeIds.push(degreeObj._id);
      }
    }
    const lecturer = new Lecturer({
      lecturerId,
      name,
      email,
      password: hashed,
      mobile,
      modules: modules && Array.isArray(modules) ? modules : [],
      degrees: degreeIds
    });
    await lecturer.save();
    res.status(201).json({ message: 'Lecturer created successfully' });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
}; 

// Get lecturer review queue (pending by default, or filter by status)
exports.getReviewQueue = async (req, res) => {
  try {
    if (!req.user || req.user.type !== 'lecturer') {
      return res.status(403).json({ message: 'Forbidden' });
    }
    const { status } = req.query; // pending|recommended|rejected or all
    const lecturer = await Lecturer.findById(req.user.id);
    if (!lecturer) {
      return res.status(404).json({ message: 'Lecturer not found' });
    }
    const query = { reviewLecturer: lecturer.lecturerId };
    if (status && status !== 'all') {
      query.reviewStatus = status;
    }
    const videos = await Video.find(query)
      .populate('uploadedBy', 'name studentId')
      .sort({ addDate: -1 });

    // Resolve degree name for each video (supports ObjectId or code string)
    const transformed = await Promise.all(videos.map(async (v) => {
      let degreeName = '';
      try {
        // If degree is a populated object with name/code
        if (v.degree && typeof v.degree === 'object' && !v.degree.toString) {
          if (v.degree.name) {
            degreeName = v.degree.name;
          } else if (v.degree.code) {
            const d = await Degree.findOne({ code: v.degree.code }).lean();
            degreeName = (d && (d.name || d.code)) || v.degree.code;
          } else if (v.degree._id) {
            const d = await Degree.findById(v.degree._id).lean();
            degreeName = (d && (d.name || d.code)) || '';
          }
        } else if (v.degree && typeof v.degree === 'object' && v.degree.toString) {
          // Degree is an ObjectId
          const d = await Degree.findById(v.degree).lean();
          if (d) degreeName = d.name || d.code || '';
        } else if (typeof v.degree === 'string') {
          const str = v.degree.trim();
          if (/^[a-fA-F0-9]{24}$/.test(str)) {
            // Looks like an ObjectId string
            const dById = await Degree.findById(str).lean();
            degreeName = (dById && (dById.name || dById.code)) || '';
          }
          if (!degreeName) {
            // Try by code
            const dByCode = await Degree.findOne({ code: str }).lean();
            degreeName = (dByCode && (dByCode.name || dByCode.code)) || '';
          }
          if (!degreeName) {
            // Try by name
            const dByName = await Degree.findOne({ name: str }).lean();
            degreeName = (dByName && dByName.name) || '';
          }
          if (!degreeName) {
            degreeName = str; // fallback to raw
          }
        }
      } catch (_) {
        degreeName = typeof v.degree === 'string' ? v.degree : '';
      }

      const rawDegree = (v.degree && (v.degree.name || v.degree.code)) || (typeof v.degree === 'string' ? v.degree : '') || '';
      const degreeDisplay = degreeName || rawDegree;

      return {
        id: v._id,
        title: v.title,
        description: v.description,
        module: v.module,
        degree: v.degree,
        degreeName,
        degreeDisplay,
        year: v.year,
        semester: v.semester,
        status: v.status,
        reviewStatus: v.reviewStatus,
        reviewLecturer: v.reviewLecturer,
        reviewNote: v.reviewNote || '',
        studentName: (v.uploadedBy && (v.uploadedBy.name || v.uploadedBy.studentId)) || v.studentId || 'Unknown Student',
        studentId: (v.uploadedBy && v.uploadedBy.studentId) || v.studentId || undefined,
        addDate: v.addDate || v.uploadDate,
        publishDate: v.publishDate || null,
        thumbnail: v.thumbnail,
        videoFile: v.videoFile,
        aiFeatures: v.aiFeatures || {}
      };
    }));

    res.json({ videos: transformed });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
};

// Lecturer updates review decision on a video (recommended or rejected)
exports.updateReviewDecision = async (req, res) => {
  try {
    if (!req.user || req.user.type !== 'lecturer') {
      return res.status(403).json({ message: 'Forbidden' });
    }
    const { videoId } = req.params;
    const { decision } = req.body; // 'recommended' | 'rejected'
    if (!['recommended', 'rejected'].includes(decision)) {
      return res.status(400).json({ message: 'Invalid decision' });
    }
    const lecturer = await Lecturer.findById(req.user.id);
    if (!lecturer) {
      return res.status(404).json({ message: 'Lecturer not found' });
    }
    const video = await Video.findById(videoId);
    if (!video) {
      return res.status(404).json({ message: 'Video not found' });
    }
    if (video.reviewLecturer !== lecturer.lecturerId) {
      return res.status(403).json({ message: 'Not authorized to review this video' });
    }
    video.reviewStatus = decision;
    video.aiFeatures = video.aiFeatures || {};
    video.aiFeatures.lecturerRecommended = decision === 'recommended';
    video.markModified('aiFeatures');
    await video.save();
    res.json({
      message: 'Review updated',
      video: {
        id: video._id,
        reviewStatus: video.reviewStatus,
        aiFeatures: video.aiFeatures
      }
    });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
};

// List lecturer recommended videos
exports.getRecommended = async (req, res) => {
  try {
    if (!req.user || req.user.type !== 'lecturer') {
      return res.status(403).json({ message: 'Forbidden' });
    }
    const lecturer = await Lecturer.findById(req.user.id);
    if (!lecturer) {
      return res.status(404).json({ message: 'Lecturer not found' });
    }
    const videos = await Video.find({ reviewLecturer: lecturer.lecturerId, reviewStatus: 'recommended' })
      .sort({ addDate: -1 });
    res.json({
      videos: videos.map(v => ({
        id: v._id,
        title: v.title,
        description: v.description,
        module: v.module,
        degree: v.degree,
        year: v.year,
        semester: v.semester,
        status: v.status,
        reviewStatus: v.reviewStatus,
        thumbnail: v.thumbnail,
        videoFile: v.videoFile,
        aiFeatures: v.aiFeatures || {}
      }))
    });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
};

// Public: list lecturers for selection (minimal fields)
exports.listAllLecturers = async (req, res) => {
  try {
    const lecturers = await Lecturer.find({}, 'name email lecturerId _id');
    res.json({ lecturers });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
};