const express = require('express');
const router = express.Router();
const tutoringRoutes = require('./routes');

// Mount tutoring routes
router.use('/', tutoringRoutes);

module.exports = router; 