const express = require('express');
const router = express.Router();
const { loginUser, registerUser, createLecturer, updateProfile } = require('./controller');
const authenticateToken = require('../../middleware/auth');
const Student = require('./model');
const Lecturer = require('../lecturer/model');

// POST /api/login
router.post('/login', loginUser);
// POST /api/register (students only)
router.post('/register', registerUser);
// POST /api/admin/lecturers (admin only)
router.post('/admin/lecturers', authenticateToken, createLecturer);

// Example protected route
router.get('/protected', authenticateToken, async (req, res) => {
  let userInfo = {};
  if (req.user.type === 'student') {
    userInfo = await Student.findById(req.user.id).lean();
    res.json({
      message: 'You are authenticated!',
      user: {
        name: userInfo.name,
        email: userInfo.email,
        mobile: userInfo.mobile,
        userType: 'student',
        studentId: userInfo.studentId,
        degree: userInfo.degree
      }
    });
  } else if (req.user.type === 'lecturer') {
    userInfo = await Lecturer.findById(req.user.id).lean();
    res.json({
      message: 'You are authenticated!',
      user: {
        name: userInfo.name,
        email: userInfo.email,
        mobile: userInfo.mobile,
        userType: 'lecturer',
        lecturerId: userInfo.lecturerId
      }
    });
  } else {
    res.status(400).json({ message: 'Unknown user type' });
  }
});

// Profile update route
router.put('/profile', authenticateToken, updateProfile);

module.exports = router; 