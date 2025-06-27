const mongoose = require('mongoose');

const lecturerSchema = new mongoose.Schema({
  lecturerId: { type: String, required: true, unique: true },
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  mobile: { type: String },
  modules: [{ type: String }],
}, { timestamps: true });

module.exports = mongoose.model('Lecturer', lecturerSchema); 