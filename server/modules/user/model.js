const mongoose = require('mongoose');

const studentSchema = new mongoose.Schema({
  studentId: { type: String, required: true, unique: true },
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  mobile: { type: String },
  profileImageUrl: { type: String },
  enrolYear: { type: Number },
  degree: { type: mongoose.Schema.Types.ObjectId, ref: 'Degree' }, // Now references Degree model
  degreeLegacy: { type: String } // For backward compatibility
}, { timestamps: true });

const adminSchema = new mongoose.Schema({
  adminId: { type: String, unique: true },
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  mobile: { type: String, required: true },
  password: { type: String, required: true }
}, { timestamps: true });

// Auto-generate adminId as 'ADM' + timestamp + random 3 digits
adminSchema.pre('save', async function(next) {
  if (!this.adminId) {
    const random = Math.floor(100 + Math.random() * 900);
    this.adminId = 'ADM' + Date.now() + random;
  }
  next();
});

const Admin = mongoose.model('Admin', adminSchema);

module.exports = {
  Student: mongoose.model('Student', studentSchema),
  Admin
}; 