const express = require('express');
const router = express.Router();
const DashboardController = require('./dashboard.controller');
const authenticateToken = require('../../middlewares/auth.middleware');


// GET Full Dashboard
router.get('/student', authenticateToken, DashboardController.getStudentDashboard);


module.exports = router;



