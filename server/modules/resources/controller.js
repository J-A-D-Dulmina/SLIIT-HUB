const Resource = require('./model');
const path = require('path');
const fs = require('fs');
const multer = require('multer');

// Multer setup
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = path.join(__dirname, '../../uploads/resources');
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
    const { title, description, type, degree, year, semester, module, uploader } = req.body;
    if (!req.file) return res.status(400).json({ message: 'No file uploaded' });
    const resource = new Resource({
      title,
      description,
      type,
      degree,
      year,
      semester,
      module,
      filePath: req.file.path,
      fileType: req.file.mimetype,
      fileSize: req.file.size,
      uploader,
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
    const resources = await Resource.find().sort({ uploadDate: -1 });
    res.json(resources);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Download resource
exports.downloadResource = async (req, res) => {
  try {
    const resource = await Resource.findById(req.params.id);
    if (!resource) return res.status(404).json({ message: 'Resource not found' });
    res.download(resource.filePath, path.basename(resource.filePath));
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Delete resource
exports.deleteResource = async (req, res) => {
  try {
    const resource = await Resource.findByIdAndDelete(req.params.id);
    if (!resource) return res.status(404).json({ message: 'Resource not found' });
    // Optionally delete file from disk
    if (resource.filePath && fs.existsSync(resource.filePath)) {
      fs.unlinkSync(resource.filePath);
    }
    res.json({ message: 'Resource deleted' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
}; 