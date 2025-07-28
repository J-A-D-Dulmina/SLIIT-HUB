const Degree = require('./degree.model');

// Create a new degree
exports.createDegree = async (req, res) => {
  try {
    const degree = new Degree(req.body);
    await degree.save();
    res.status(201).json(degree);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

// Get all degrees
exports.getDegrees = async (req, res) => {
  try {
    const degrees = await Degree.find();
    res.json(degrees);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Get degree by ID
exports.getDegreeById = async (req, res) => {
  try {
    const degree = await Degree.findById(req.params.id);
    if (!degree) return res.status(404).json({ message: 'Degree not found' });
    res.json(degree);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Update degree
exports.updateDegree = async (req, res) => {
  try {
    const degree = await Degree.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
    if (!degree) return res.status(404).json({ message: 'Degree not found' });
    res.json(degree);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

// Delete degree
exports.deleteDegree = async (req, res) => {
  try {
    const degree = await Degree.findByIdAndDelete(req.params.id);
    if (!degree) return res.status(404).json({ message: 'Degree not found' });
    res.json({ message: 'Degree deleted' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
}; 