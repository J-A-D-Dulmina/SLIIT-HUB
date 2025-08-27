const Resource = require('./model');
const path = require('path');
const fs = require('fs');
const multer = require('multer');

// Multer setup
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = path.join(process.cwd(), 'server', 'uploads', 'resources');
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
const upload = multer({ storage });

// Upload resource
exports.uploadResource = [upload.single('file'), async (req, res) => {
  try {
    const { title, description, type, degree, year, semester, module, visibility } = req.body;
    if (!req.file) return res.status(400).json({ message: 'No file uploaded' });
    // Infer uploader from auth
    let uploader = null;
    let uploaderModel = null;
    if (req.user?.id) {
      uploader = req.user.id;
      uploaderModel = req.user.type === 'lecturer' ? 'Lecturer' : 'Student';
    }
    const relativePath = ['uploads', 'resources', req.file.filename].join('/');
    const resource = new Resource({
      title,
      description,
      type,
      visibility: visibility === 'private' ? 'private' : 'public',
      degree,
      year,
      semester,
      module,
      filePath: relativePath,
      fileType: req.file.mimetype,
      fileSize: req.file.size,
      uploader,
      uploaderModel,
    });
    await resource.save();
    res.status(201).json(resource);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
}];

// List resources
exports.listResources = async (req, res) => {
  try {
    const authUserId = req.user ? (req.user.id || req.user._id || req.user.userId) : null;
    const currentUserIdStr = authUserId ? String(authUserId) : null;
    const query = { $or: [{ visibility: 'public' }] };
    if (currentUserIdStr) {
      // Owner can see their private resources
      query.$or.push({ visibility: 'private', uploader: currentUserIdStr });
    }
    const resources = await Resource.find({ $or: query.$or })
      .sort({ uploadDate: -1 })
      .populate({ path: 'uploader', select: 'name email _id' });
    const currentUserId = currentUserIdStr;
    res.json(resources.map((r) => {
      const obj = r.toObject();
      obj._id = String(obj._id);
      obj.uploader = r.uploader && r.uploader._id ? String(r.uploader._id) : (obj.uploader ? String(obj.uploader) : undefined);
      obj.uploaderId = obj.uploader;
      obj.uploaderName = r.uploader && typeof r.uploader === 'object' ? (r.uploader.name || r.uploader.email || obj.uploader) : obj.uploader;
      obj.isOwner = currentUserId ? String(obj.uploaderId) === currentUserId : false;
      if (obj.filePath && obj.filePath.includes('uploads\\resources')) {
        const filename = path.basename(obj.filePath);
        obj.filePath = ['uploads', 'resources', filename].join('/');
      }
      return obj;
    }));
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// List only public resources
exports.listPublicResources = async (req, res) => {
  try {
    const resources = await Resource.find({ visibility: 'public' })
      .sort({ uploadDate: -1 })
      .populate({ path: 'uploader', select: 'name email _id' });
    res.json(resources.map((r) => {
      const obj = r.toObject();
      obj._id = String(obj._id);
      obj.uploader = r.uploader && r.uploader._id ? String(r.uploader._id) : (obj.uploader ? String(obj.uploader) : undefined);
      obj.uploaderId = obj.uploader;
      obj.uploaderName = r.uploader && typeof r.uploader === 'object' ? (r.uploader.name || r.uploader.email || obj.uploader) : obj.uploader;
      if (obj.filePath && obj.filePath.includes('uploads\\resources')) {
        const filename = path.basename(obj.filePath);
        obj.filePath = ['uploads', 'resources', filename].join('/');
      }
      return obj;
    }));
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// List only current user's resources (both public and private)
exports.listMyResources = async (req, res) => {
  try {
    if (!req.user?.id) return res.status(401).json({ message: 'Unauthorized' });
    const userId = String(req.user.id);
    const resources = await Resource.find({ uploader: userId })
      .sort({ uploadDate: -1 })
      .populate({ path: 'uploader', select: 'name email _id' });
    res.json(resources.map((r) => {
      const obj = r.toObject();
      obj._id = String(obj._id);
      obj.uploader = r.uploader && r.uploader._id ? String(r.uploader._id) : (obj.uploader ? String(obj.uploader) : undefined);
      obj.uploaderId = obj.uploader;
      obj.uploaderName = r.uploader && typeof r.uploader === 'object' ? (r.uploader.name || r.uploader.email || obj.uploader) : obj.uploader;
      obj.isOwner = true;
      if (obj.filePath && obj.filePath.includes('uploads\\resources')) {
        const filename = path.basename(obj.filePath);
        obj.filePath = ['uploads', 'resources', filename].join('/');
      }
      return obj;
    }));
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Download resource
exports.downloadResource = async (req, res) => {
  try {
    const resource = await Resource.findById(req.params.id);
    if (!resource) return res.status(404).json({ message: 'Resource not found' });
    if (resource.visibility === 'private') {
      // Only owner can download private resource
      if (!req.user || String(resource.uploader) !== String(req.user.id)) {
        return res.status(403).json({ message: 'Access denied' });
      }
    }
    res.download(resource.filePath, path.basename(resource.filePath));
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Update visibility (owner-only)
exports.updateVisibility = async (req, res) => {
  try {
    const { id } = req.params;
    const { visibility } = req.body;
    if (!['public', 'private'].includes(visibility)) {
      return res.status(400).json({ message: 'Invalid visibility' });
    }
    const resource = await Resource.findById(id);
    if (!resource) return res.status(404).json({ message: 'Resource not found' });
    if (!req.user || String(resource.uploader) !== String(req.user.id)) {
      return res.status(403).json({ message: 'Only the owner can update visibility' });
    }
    resource.visibility = visibility;
    await resource.save();
    res.json({ success: true, visibility: resource.visibility });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Delete resource
exports.deleteResource = async (req, res) => {
  try {
    const resource = await Resource.findById(req.params.id);
    if (!resource) return res.status(404).json({ message: 'Resource not found' });
    if (!req.user || String(resource.uploader) !== String(req.user.id)) {
      return res.status(403).json({ message: 'Only the owner can delete this resource' });
    }
    // Delete file from disk if present
    if (resource.filePath && fs.existsSync(resource.filePath)) {
      try { fs.unlinkSync(resource.filePath); } catch (_) {}
    }
    await resource.deleteOne();
    res.json({ success: true, message: 'Resource deleted' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
}; 

// Update resource metadata (owner-only)
exports.updateResource = async (req, res) => {
  try {
    const { id } = req.params;
    const resource = await Resource.findById(id);
    if (!resource) return res.status(404).json({ message: 'Resource not found' });
    if (!req.user || String(resource.uploader) !== String(req.user.id)) {
      return res.status(403).json({ message: 'Only the owner can update this resource' });
    }
    const allowed = ['title', 'description', 'type', 'degree', 'year', 'semester', 'module', 'visibility'];
    for (const key of allowed) {
      if (Object.prototype.hasOwnProperty.call(req.body, key) && req.body[key] !== undefined && req.body[key] !== null) {
        resource[key] = req.body[key];
      }
    }
    await resource.save();
    res.json({ success: true, resource });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};