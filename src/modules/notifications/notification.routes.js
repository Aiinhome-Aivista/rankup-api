const express = require('express');
const router = express.Router();
const NotificationController = require('./notification.controller');

// Mobile app hits this to save token
router.post('/save_token', NotificationController.saveDeviceToken);

module.exports = router;