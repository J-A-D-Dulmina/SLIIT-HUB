const express = require('express');
const router = express.Router();
const { listMyNotifications, markAllAsRead } = require('./controller');
const authenticateToken = require('../../middleware/auth');

router.use(authenticateToken);
router.get('/', listMyNotifications);
router.post('/mark-read', markAllAsRead);

module.exports = router;


