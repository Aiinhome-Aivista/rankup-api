// const express = require('express');
// const router = express.Router();
// const NotificationController = require('./notification.controller');

// // Mobile app hits this to save token
// router.post('/save_token', NotificationController.saveDeviceToken);

// module.exports = router;
const express = require('express');
const router = express.Router();
const NotificationController = require('./notification.controller');
const authMiddleware = require('../../middlewares/auth.middleware');

router.post('/save_token', authMiddleware, NotificationController.saveDeviceToken);
router.get('/list', authMiddleware, NotificationController.getNotifications);
router.post('/mark_read', authMiddleware, NotificationController.markAsRead);

module.exports = router;