const express = require('express');
const router = express.Router();
const meetingRoutes = require('./routes');

// Mount meeting routes under /meetings
router.use('/meetings', meetingRoutes);

module.exports = router; 