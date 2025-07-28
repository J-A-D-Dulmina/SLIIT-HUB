const mongoose = require('mongoose');

const moduleSchema = new mongoose.Schema({
  code: { type: String, required: true },
  name: { type: String, required: true },
  credit: { type: Number, default: 0 },
  description: { type: String, default: '' },
}, { _id: false });

const semesterSchema = new mongoose.Schema({
  semesterNumber: { type: Number, required: true },
  modules: [moduleSchema]
}, { _id: false });

const yearSchema = new mongoose.Schema({
  yearNumber: { type: Number, required: true },
  semesterCount: { type: Number, required: true },
  semesters: [semesterSchema]
}, { _id: false });

const degreeSchema = new mongoose.Schema({
  name: { type: String, required: true },
  code: { type: String, required: true, unique: true },
  yearCount: { type: Number, required: true },
  years: [yearSchema],
  icon: { type: String, default: '' } // Optional icon field
}, { timestamps: true });

module.exports = mongoose.model('Degree', degreeSchema); 