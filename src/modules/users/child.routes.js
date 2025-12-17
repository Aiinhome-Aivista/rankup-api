const express = require('express');
const router = express.Router();
const ChildController = require('./child.controller');
const authMiddleware = require('../../middlewares/auth.middleware');

// Define the route (token required)
router.post('/add', authMiddleware, ChildController.addChild);

module.exports = router;
